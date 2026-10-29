'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, Loader2, BookOpen, Save, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, CalendarPlus, Search,
} from 'lucide-react'
import {
  MESES, enPalabras, ocurrencias as repetir, type Ocurrencia,
} from '@/lib/plan-fechas'
import {
  ESTADOS, ESTADO_NOMBRE, PERIODICIDADES, PERIODICIDAD_NOMBRE,
  colorCategoria, type PlanItem, type Tema,
} from './tipos'

// ── El panel de asignación ────────────────────────────────────────────────
// El mismo para editar una capacitación del calendario y para crear una nueva
// al soltar un tema en un día: cambia el modo, no el formulario, para que lo
// que se ve antes de guardar sea exactamente lo que queda guardado.
// ──────────────────────────────────────────────────────────────────────────

export interface ValoresIniciales {
  month: number
  scheduled_date: string | null
  required?: boolean
}

/**
 * El marco. Fuera del componente para que React no lo vuelva a montar en cada
 * pintada y los campos no pierdan el cursor mientras se escribe.
 */
function Marco({ variante, titulo, children }: {
  variante: 'barra' | 'panel'
  titulo: string
  children: React.ReactNode
}) {
  if (variante === 'panel') {
    return <div className="flex flex-col h-full overflow-hidden">{children}</div>
  }
  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      role="dialog" aria-label={titulo}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden shadow-2xl"
      style={{ width: 360, maxWidth: '100vw', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>
      {children}
    </motion.div>
  )
}

interface Props {
  modo: 'crear' | 'editar'
  /** 'panel' lo dibuja dentro de otra barra lateral, sin ventana propia. */
  variante?: 'barra' | 'panel'
  planId: string
  anioPlan: number
  /** El tema en modo crear. Si no viene, el panel muestra un selector. */
  tema?: Tema | null
  /** Para el selector de tema cuando se crea desde el botón "+" del día. */
  temas?: Tema[]
  item?: PlanItem | null
  inicial?: ValoresIniciales
  onCerrar: () => void
  /** Los ítems creados o el actualizado. */
  onGuardado: (items: PlanItem[]) => void
  onEliminado?: (id: string) => void
}

export default function PanelAsignacion({
  modo, planId, anioPlan, tema, temas = [], item, inicial, onCerrar, onGuardado, onEliminado,
  variante = 'barra',
}: Props) {
  const crear = modo === 'crear'

  const [temaId, setTemaId] = useState<number | null>(tema?.id ?? item?.trainings.id ?? null)
  const [buscaTema, setBuscaTema] = useState('')

  const [form, setForm] = useState({
    month: item?.month ?? inicial?.month ?? new Date().getMonth() + 1,
    scheduled_date: item?.scheduled_date ?? inicial?.scheduled_date ?? '',
    end_date: item?.end_date ?? '',
    estado: item?.estado ?? 'pendiente',
    required: item?.required ?? inicial?.required ?? tema?.obligatorio ?? true,
    reinduccion: item?.reinduccion ?? false,
    periodicity: item?.periodicity ?? 'once',
    valid_days: item?.valid_days ?? '',
    modalidad: item?.modalidad ?? 'presencial',
    observaciones: item?.observaciones ?? '',
    target_type: item?.plan_item_targets[0]?.target_type ?? 'all',
  })
  const [guardando, setGuardando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [confirmaBorrar, setConfirmaBorrar] = useState(false)
  const [error, setError] = useState('')

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  // Esc cierra. Si hay una confirmación de borrado abierta, la cierra primero.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      if (confirmaBorrar) setConfirmaBorrar(false)
      else onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [confirmaBorrar, onCerrar])

  const temaElegido: Tema | null =
    tema ??
    temas.find(t => t.id === temaId) ??
    (item ? { ...item.trainings, obligatorio: item.required } : null)

  // Vista previa de las repeticiones: lo que se va a crear además de la primera.
  const repeticiones: Ocurrencia[] = crear
    ? repetir(anioPlan, Number(form.month), form.scheduled_date || null, form.periodicity)
    : []
  const extras = repeticiones.slice(1)

  const guardar = async () => {
    setError('')
    if (crear && !temaId) { setError('Elige el tema'); return }
    setGuardando(true)

    const cuerpo: Record<string, any> = {
      month: Number(form.month),
      scheduled_date: form.scheduled_date || null,
      end_date: form.end_date || null,
      estado: form.estado,
      required: form.required,
      reinduccion: form.reinduccion,
      periodicity: form.periodicity,
      valid_days: form.valid_days !== '' ? Number(form.valid_days) : null,
      modalidad: form.modalidad,
      observaciones: form.observaciones || null,
      // "Dirigido a" se quitó: decía "toda la empresa" sin asignarle nada a
      // nadie. A quién le toca se decide en la pestaña Asignación, persona por
      // persona, y al no mandar el campo lo ya guardado se queda como está.
    }

    const res = crear
      ? await fetch(`/api/plans/${planId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...cuerpo, training_id: temaId, ocurrencias: repeticiones }),
        })
      : await fetch(`/api/plans/${planId}/items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...cuerpo, item_id: item!.id }),
        })

    if (res.ok) {
      const dato = await res.json()
      onGuardado(Array.isArray(dato) ? dato : [dato])
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'No se pudo guardar')
    }
    setGuardando(false)
  }

  const eliminar = async () => {
    if (!item) return
    setBorrando(true)
    const res = await fetch(`/api/plans/${planId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id }),
    })
    if (res.ok) onEliminado?.(item.id)
    else setError('No se pudo eliminar')
    setBorrando(false)
    setConfirmaBorrar(false)
  }

  const color = colorCategoria(temaElegido?.category ?? null)
  const temasFiltrados = buscaTema.trim()
    ? temas.filter(t => t.title.toLowerCase().includes(buscaTema.trim().toLowerCase()))
    : temas

  return (
    <Marco variante={variante} titulo={crear ? 'Nueva capacitación' : 'Editar capacitación'}>

      {/* Encabezado */}
      {variante === 'barra' && (
      <div className="flex items-start gap-3 p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: color + '18', border: `1px solid ${color}30` }}>
          {crear ? <CalendarPlus size={14} style={{ color }} /> : <BookOpen size={14} style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-bold text-sm leading-snug" style={{ color: 'var(--text)' }}>
              {temaElegido?.title ?? 'Elige el tema'}
            </div>
            {crear && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
                style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                Nueva
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {temaElegido?.category}{temaElegido?.duration ? ` · ${temaElegido.duration}` : ''}
          </div>
        </div>
        <button onClick={onCerrar} aria-label="Cerrar"
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
          <X size={14} />
        </button>
      </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selector de tema, solo cuando se creó sin uno */}
        {crear && !tema && (
          <div>
            <label className="field-label">Tema *</label>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input value={buscaTema} onChange={e => setBuscaTema(e.target.value)}
                placeholder="Buscar tema..." className="terra-input pl-8 text-xs py-1.5" />
            </div>
            <div className="rounded-xl overflow-y-auto" style={{ maxHeight: 180, border: '1px solid var(--border)' }}>
              {temasFiltrados.map(t => (
                <button key={t.id} onClick={() => setTemaId(t.id)}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                  style={{
                    color: 'var(--text)',
                    background: temaId === t.id ? colorCategoria(t.category) + '20' : 'transparent',
                  }}>
                  {t.title}
                </button>
              ))}
              {temasFiltrados.length === 0 && (
                <p className="text-[10px] text-center py-4" style={{ color: 'var(--text-faint)' }}>Sin resultados</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="field-label">Mes</label>
          <select value={form.month} onChange={e => f('month', Number(e.target.value))} className="terra-input">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Fecha inicio</label>
            <input type="date" value={form.scheduled_date}
              onChange={e => f('scheduled_date', e.target.value)} className="terra-input" />
          </div>
          <div>
            <label className="field-label">Fecha fin</label>
            <input type="date" value={form.end_date}
              onChange={e => f('end_date', e.target.value)} className="terra-input" />
          </div>
        </div>

        <div>
          <label className="field-label">Estado</label>
          <select value={form.estado} onChange={e => f('estado', e.target.value)} className="terra-input">
            {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_NOMBRE[s]}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Modalidad</label>
            <select value={form.modalidad} onChange={e => f('modalidad', e.target.value)} className="terra-input">
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="mixta">Mixta</option>
              <option value="e-learning">E-learning</option>
            </select>
          </div>
          <div>
            <label className="field-label">Periodicidad</label>
            <select value={form.periodicity} onChange={e => f('periodicity', e.target.value)} className="terra-input">
              {PERIODICIDADES.map(p => <option key={p} value={p}>{PERIODICIDAD_NOMBRE[p]}</option>)}
            </select>
          </div>
        </div>

        {/* Vista previa de las repeticiones */}
        {crear && extras.length > 0 && (
          <div className="rounded-xl p-2.5 text-[11px]"
            style={{ background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--text-dim)' }}>
            <span className="font-bold" style={{ color: 'var(--primary)' }}>Se crearán también: </span>
            {extras.map(o => o.scheduled_date ? enPalabras(o.scheduled_date) : MESES[o.month - 1]).join(' · ')}
          </div>
        )}

        <div className="space-y-2">
          {[
            { key: 'required', label: 'Obligatoria', tc: '#FCD34D' },
            { key: 'reinduccion', label: 'Es reinducción', tc: '#A78BFA' },
          ].map(({ key, label, tc }) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
              <button onClick={() => f(key, !(form as any)[key])} aria-label={label}
                aria-pressed={!!(form as any)[key]}>
                {(form as any)[key]
                  ? <ToggleRight size={20} style={{ color: tc }} />
                  : <ToggleLeft size={20} style={{ color: 'var(--text-faint)' }} />}
              </button>
            </div>
          ))}
        </div>

        <div>
          <label className="field-label">Observaciones</label>
          <textarea rows={3} value={form.observaciones}
            onChange={e => f('observaciones', e.target.value)}
            placeholder="Notas adicionales..." className="terra-input resize-none" />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl text-[11px]"
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
            <AlertCircle size={13} className="flex-shrink-0 mt-px" /> {error}
          </div>
        )}
      </div>

      {/* Pie */}
      <div className="p-4 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        {confirmaBorrar ? (
          <div className="rounded-xl p-3"
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-[11px] mb-2.5" style={{ color: '#FCA5A5' }}>
              ¿Quitar esta capacitación del plan? Se pierde su programación.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmaBorrar(false)} className="terra-btn-outline flex-1 text-xs py-1.5">
                No, dejarla
              </button>
              <button onClick={eliminar} disabled={borrando}
                className="flex-1 text-xs py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
                style={{ background: '#EF4444', color: '#fff' }}>
                {borrando ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Sí, quitar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {!crear && (
              <button onClick={() => setConfirmaBorrar(true)} aria-label="Eliminar del plan"
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--red-dim)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Trash2 size={13} />
              </button>
            )}
            <button onClick={guardar} disabled={guardando} className="terra-btn flex-1 text-sm">
              {guardando
                ? <><Loader2 size={13} className="animate-spin" />Guardando...</>
                : <><Save size={13} />{crear && extras.length > 0 ? `Guardar ${repeticiones.length} sesiones` : 'Guardar'}</>}
            </button>
          </div>
        )}
      </div>
    </Marco>
  )
}
