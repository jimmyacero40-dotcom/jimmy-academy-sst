'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, Clock, Search, AlertCircle } from 'lucide-react'

/**
 * Dejar registrado un movimiento que no se marcó en portería.
 *
 * Pasa: la persona entró y nadie la marcó. El movimiento existió y el SG-SST
 * necesita la trazabilidad, así que se repone después con las horas reales.
 * Queda señalado como manual y con el motivo escrito, porque ante una
 * auditoría no es lo mismo lo que se marcó en el momento que lo que se repuso.
 *
 * El mismo diálogo sirve para corregir las horas de un movimiento que ya
 * existe: equivocarse al reponer se arregla donde se repuso.
 */

interface Persona { id: string; name: string; cedula: string; cargo?: string | null; area_id?: string | null }
interface Area { id: string; name: string }
interface Porteria { id: string; name: string }

export interface MovimientoAEditar {
  id: string
  entry_time: string
  exit_time: string | null
  user?: { id: string; name: string } | null
}

/** Un instante ISO → el 'YYYY-MM-DDTHH:mm' que entiende <input datetime-local>. */
function paraCampo(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Cuánto estuvo, dicho en palabras, para revisar antes de guardar. */
function permanencia(entrada: string, salida: string): string {
  if (!entrada || !salida) return ''
  const mins = Math.round((new Date(salida).getTime() - new Date(entrada).getTime()) / 60000)
  if (mins <= 0) return ''
  if (mins < 60) return `${mins} minutos`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h} h ${m} min` : `${h} horas`
}

export default function RegistroManual({
  editar, areas, porterias, onCerrar, onGuardado,
}: {
  /** Presente = corregir ese movimiento. Ausente = reponer uno nuevo. */
  editar?: MovimientoAEditar | null
  areas: Area[]
  porterias: Porteria[]
  onCerrar: () => void
  onGuardado: () => void
}) {
  const corrigiendo = !!editar

  const [personas, setPersonas] = useState<Persona[]>([])
  const [busca, setBusca] = useState('')
  const [personaId, setPersonaId] = useState(editar?.user?.id ?? '')
  const [entrada, setEntrada] = useState(paraCampo(editar?.entry_time ?? null))
  const [salida, setSalida] = useState(paraCampo(editar?.exit_time ?? null))
  const [areaId, setAreaId] = useState('')
  const [porteriaId, setPorteriaId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (corrigiendo) return
    fetch('/api/users')
      .then(r => r.ok ? r.json() : [])
      .then((us: any[]) => setPersonas((us ?? []).map(u => ({
        id: u.id, name: u.name, cedula: u.cedula ?? '', cargo: u.cargo, area_id: u.area_id,
      }))))
      .catch(() => {})
  }, [corrigiendo])

  // Al escoger a alguien se propone su área, que es lo que casi siempre aplica.
  useEffect(() => {
    const p = personas.find(x => x.id === personaId)
    if (p?.area_id) setAreaId(p.area_id)
  }, [personaId, personas])

  const encontradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return personas.slice(0, 40)
    return personas.filter(p => `${p.name} ${p.cedula}`.toLowerCase().includes(q)).slice(0, 40)
  }, [personas, busca])

  const dura = permanencia(entrada, salida)

  const guardar = async () => {
    setError('')
    if (!corrigiendo && !personaId) { setError('Escoja a la persona'); return }
    if (!entrada) { setError('Escriba la fecha y la hora de entrada'); return }
    if (!motivo.trim()) { setError('Escriba por qué se registra a mano'); return }
    setGuardando(true)

    const cuerpo: any = {
      manual: true,
      manual_motivo: motivo.trim(),
      entry_time: new Date(entrada).toISOString(),
      exit_time: salida ? new Date(salida).toISOString() : null,
    }
    if (!corrigiendo) {
      cuerpo.user_id = personaId
      cuerpo.area_id = areaId || null
      cuerpo.gatehouse_id = porteriaId || null
      cuerpo.notes = notas.trim() || null
    }

    const res = await fetch(
      corrigiendo ? `/api/access-logs/${editar!.id}` : '/api/access-logs',
      { method: corrigiendo ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo) },
    ).catch(() => null)

    if (!res || !res.ok) {
      const d = await res?.json().catch(() => ({}))
      setError(d?.error || 'No fue posible guardar el movimiento')
      setGuardando(false)
      return
    }
    setGuardando(false)
    onGuardado()
  }

  const etiqueta = 'text-xs font-semibold mb-1.5 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onCerrar}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}>
              <Clock size={15} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                {corrigiendo ? 'Corregir las horas' : 'Registrar un movimiento a mano'}
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                {corrigiendo
                  ? editar?.user?.name ?? 'Movimiento del registro'
                  : 'Para lo que no se marcó en portería en su momento'}
              </p>
            </div>
          </div>
          <button onClick={onCerrar} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {!corrigiendo && (
            <div>
              <label className={etiqueta} style={{ color: 'var(--text-dim)' }}>Persona *</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                <input value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nombre o cédula…" className="terra-input" style={{ paddingLeft: 34 }} />
              </div>
              <div className="rounded-xl overflow-y-auto" style={{ maxHeight: 170, border: '1px solid var(--border)' }}>
                {encontradas.map(p => (
                  <button key={p.id} type="button" onClick={() => setPersonaId(p.id)}
                    className="w-full text-left px-3 py-2 text-xs transition-colors"
                    style={{
                      background: personaId === p.id ? 'var(--primary-dim)' : 'transparent',
                      color: personaId === p.id ? 'var(--primary)' : 'var(--text-dim)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                    <span className="font-semibold">{p.name}</span>
                    <span className="ml-2 font-mono" style={{ color: 'var(--text-faint)' }}>{p.cedula}</span>
                  </button>
                ))}
                {!encontradas.length && (
                  <p className="px-3 py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Nadie con ese nombre o cédula.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={etiqueta} style={{ color: 'var(--text-dim)' }}>Entrada *</label>
              <input type="datetime-local" value={entrada} onChange={e => setEntrada(e.target.value)} className="terra-input" />
            </div>
            <div>
              <label className={etiqueta} style={{ color: 'var(--text-dim)' }}>Salida</label>
              <input type="datetime-local" value={salida} onChange={e => setSalida(e.target.value)} className="terra-input" />
            </div>
          </div>
          <p className="text-[11px] -mt-2" style={{ color: 'var(--text-faint)' }}>
            {dura
              ? <>Estuvo <strong style={{ color: 'var(--text-dim)' }}>{dura}</strong>.</>
              : 'Sin hora de salida, el movimiento queda abierto y la persona aparece dentro.'}
          </p>

          {!corrigiendo && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={etiqueta} style={{ color: 'var(--text-dim)' }}>Área</label>
                <select value={areaId} onChange={e => setAreaId(e.target.value)} className="terra-input">
                  <option value="">Sin área</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className={etiqueta} style={{ color: 'var(--text-dim)' }}>Portería</label>
                <select value={porteriaId} onChange={e => setPorteriaId(e.target.value)} className="terra-input">
                  <option value="">Sin portería</option>
                  {porterias.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={etiqueta} style={{ color: 'var(--text-dim)' }}>Por qué se registra a mano *</label>
            <input value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: no se marcó en portería esa mañana" className="terra-input" />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>
              Esto queda guardado con su nombre y es lo que sustenta el registro ante una auditoría.
            </p>
          </div>

          {!corrigiendo && (
            <div>
              <label className={etiqueta} style={{ color: 'var(--text-dim)' }}>Observaciones</label>
              <input value={notas} onChange={e => setNotas(e.target.value)}
                placeholder="Opcional" className="terra-input" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl p-3 text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onCerrar} className="terra-btn-outline flex-1 py-2 text-sm">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
            style={{ background: 'var(--primary)', color: '#fff', opacity: guardando ? 0.6 : 1 }}>
            {guardando && <Loader2 size={14} className="animate-spin" />}
            {corrigiendo ? 'Guardar la corrección' : 'Registrar el movimiento'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
