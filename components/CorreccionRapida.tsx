'use client'

// ─── Corrección rápida de datos del personal ──────────────────────────
// Arreglar un nombre mal escrito obligaba a abrir la ficha de la persona,
// editar, guardar y volver a la lista. Para una importación de Excel con
// veinte nombres en minúscula eso son veinte vueltas.
//
// Aquí se eligen las personas en la lista, se marca qué corregir y se ve
// el resultado antes de guardar. Nada se aplica a ciegas: la columna
// "Después" es editable, así que un corte mal adivinado se arregla ahí
// mismo sin salir de la ventana.
// ──────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Wand2, ArrowRight, Check, Loader2 } from 'lucide-react'
import { CORRECCIONES, proponer, hayCambio, type Correccion, type DatosPersona } from '@/lib/correccion-nombres'

export interface PersonaCorregible extends DatosPersona {
  id: string
  cedula?: string
}

export default function CorreccionRapida({
  personas,
  onCerrar,
  onAplicar,
}: {
  personas: PersonaCorregible[]
  onCerrar: () => void
  /** Guarda los cambios. Devuelve cuántas personas se actualizaron. */
  onAplicar: (cambios: { id: string; name: string; cargo: string | null; nombres: string | null; apellidos: string | null }[]) => Promise<void>
}) {
  const [acciones, setAcciones] = useState<Correccion[]>(['mayusculas'])
  const [editado, setEditado] = useState<Record<string, string>>({})
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())
  const [guardando, setGuardando] = useState(false)

  const alternar = (id: Correccion) => {
    setAcciones(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]))
    // Un retoque a mano se hizo sobre otra propuesta; al cambiar las acciones
    // deja de corresponder, así que se descarta en vez de quedar pegado.
    setEditado({})
  }

  /** Solo las personas a las que las acciones elegidas les cambian algo. */
  const filas = useMemo(() => personas
    .map(p => ({ persona: p, propuesta: proponer(p, acciones) }))
    .filter(f => hayCambio(f.persona, f.propuesta)), [personas, acciones])

  const nombreFinal = (f: typeof filas[number]) => editado[f.persona.id] ?? f.propuesta.name
  const aGuardar = filas.filter(f => !excluidos.has(f.persona.id))

  const aplicar = async () => {
    if (!aGuardar.length) return
    setGuardando(true)
    try {
      await onAplicar(aGuardar.map(f => ({
        id: f.persona.id,
        name: nombreFinal(f),
        cargo: f.propuesta.cargo ?? null,
        nombres: f.propuesta.nombres ?? null,
        apellidos: f.propuesta.apellidos ?? null,
      })))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onCerrar}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

        {/* ── Encabezado ── */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--primary-dim)' }}>
            <Wand2 size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Corrección rápida</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {personas.length} {personas.length === 1 ? 'persona seleccionada' : 'personas seleccionadas'}
            </p>
          </div>
          <button onClick={onCerrar} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
        </div>

        {/* ── Qué corregir ── */}
        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          {CORRECCIONES.map(c => {
            const activa = acciones.includes(c.id)
            return (
              <button key={c.id} onClick={() => alternar(c.id)} title={c.descripcion}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                style={activa
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                {activa && <Check size={11} />}{c.label}
              </button>
            )
          })}
        </div>

        {/* ── Antes y después ── */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {acciones.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--text-faint)' }}>
              Elige arriba qué quieres corregir.
            </p>
          ) : filas.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--text-faint)' }}>
              A las personas seleccionadas no les cambia nada. Ya están así.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
                Cambian {filas.length} de {personas.length}. El resultado se puede retocar antes de guardar.
              </p>
              {filas.map(f => {
                const fuera = excluidos.has(f.persona.id)
                return (
                  <div key={f.persona.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs"
                    style={{ opacity: fuera ? 0.4 : 1, background: 'var(--bg-card)' }}>
                    <input type="checkbox" checked={!fuera}
                      onChange={() => setExcluidos(s => {
                        const n = new Set(s)
                        if (n.has(f.persona.id)) n.delete(f.persona.id); else n.add(f.persona.id)
                        return n
                      })}
                      className="w-3.5 h-3.5 rounded accent-blue-500 flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--text-faint)' }}
                      title={f.persona.name}>{f.persona.name}</span>
                    <ArrowRight size={11} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                    <input
                      value={nombreFinal(f)} disabled={fuera}
                      onChange={e => setEditado(x => ({ ...x, [f.persona.id]: e.target.value }))}
                      className="flex-1 min-w-0 px-2 py-1 rounded-md text-xs font-semibold outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--primary)' }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Guardar ── */}
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {aGuardar.length === 0 ? 'Nada por guardar' : `Se actualizarán ${aGuardar.length}`}
          </span>
          <button onClick={onCerrar} className="ml-auto px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            Cancelar
          </button>
          <button onClick={aplicar} disabled={!aGuardar.length || guardando}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            {guardando ? <><Loader2 size={12} className="animate-spin" /> Guardando…</> : <><Check size={12} /> Aplicar</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
