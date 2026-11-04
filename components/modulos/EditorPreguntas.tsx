'use client'

import { useState } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, X, GripVertical, AlertCircle,
} from 'lucide-react'
import { TIPOS, usaOpciones, type Pregunta, type TipoPregunta } from '@/lib/modulos'

const inp = 'w-full text-sm rounded-lg px-3 py-2 outline-none'
const estiloInp: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
}

/** Una pregunta nueva, sin id: el servidor se lo pone al guardar. */
function enBlanco(orden: number): Pregunta {
  return {
    id: `nueva-${Date.now()}-${orden}`,
    orden, titulo: '', ayuda: '', tipo: 'parrafo',
    opciones: [], obligatoria: true, placeholder: '',
  }
}

export default function EditorPreguntas({
  moduloId, iniciales, bloqueado, onGuardado,
}: {
  moduloId: string
  iniciales: Pregunta[]
  /** Con respuestas enviadas no se borran preguntas a la ligera. */
  bloqueado: boolean
  onGuardado: (preguntas: Pregunta[]) => void
}) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(iniciales)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(iniciales.length ? null : null)

  const tocar = (id: string, cambios: Partial<Pregunta>) =>
    setPreguntas(ps => ps.map(p => p.id === id ? { ...p, ...cambios } : p))

  const mover = (i: number, delta: number) => {
    const j = i + delta
    if (j < 0 || j >= preguntas.length) return
    setPreguntas(ps => {
      const copia = [...ps]
      ;[copia[i], copia[j]] = [copia[j], copia[i]]
      return copia.map((p, k) => ({ ...p, orden: k + 1 }))
    })
  }

  const agregar = () => {
    const nueva = enBlanco(preguntas.length + 1)
    setPreguntas(ps => [...ps, nueva])
    setAbierta(nueva.id)
  }

  const quitar = (id: string) =>
    setPreguntas(ps => ps.filter(p => p.id !== id).map((p, k) => ({ ...p, orden: k + 1 })))

  const guardar = async () => {
    setGuardando(true); setError(null); setListo(false)
    try {
      const r = await fetch(`/api/modulos/${moduloId}/preguntas`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Las nuevas van sin id para que el servidor se lo asigne.
          preguntas: preguntas.map(p => (
            p.id.startsWith('nueva-') ? { ...p, id: undefined } : p
          )),
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No fue posible guardar'); return }
      setPreguntas(d)
      onGuardado(d)
      setListo(true)
      setTimeout(() => setListo(false), 2500)
    } catch {
      setError('Error de conexión')
    } finally { setGuardando(false) }
  }

  return (
    <div className="space-y-3">

      {bloqueado && (
        <div className="flex items-start gap-2 text-xs p-3 rounded-xl leading-relaxed"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Ya hay gente que respondió. Puede corregir la redacción, pero si borra una pregunta
            o le cambia el tipo, lo que contestaron sobre ella deja de poder leerse.
          </span>
        </div>
      )}

      {preguntas.map((p, i) => {
        const esta = abierta === p.id
        return (
          <div key={p.id} className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: `1px solid ${esta ? 'var(--primary-border)' : 'var(--border)'}` }}>

            <div className="flex items-center gap-2 px-3 py-2.5">
              <GripVertical size={14} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
              <span className="text-[11px] font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                {i + 1}
              </span>
              <button onClick={() => setAbierta(esta ? null : p.id)}
                className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate"
                  style={{ color: p.titulo ? 'var(--text)' : 'var(--text-faint)' }}>
                  {p.titulo || 'Pregunta sin escribir'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  {TIPOS.find(t => t.id === p.tipo)?.nombre}
                  {!p.obligatoria && ' · opcional'}
                </p>
              </button>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"
                  className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-25"
                  style={{ color: 'var(--text-dim)' }}><ChevronUp size={14} /></button>
                <button onClick={() => mover(i, 1)} disabled={i === preguntas.length - 1} aria-label="Bajar"
                  className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-25"
                  style={{ color: 'var(--text-dim)' }}><ChevronDown size={14} /></button>
                <button onClick={() => quitar(p.id)} aria-label="Quitar la pregunta"
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: '#FCA5A5' }}><Trash2 size={13} /></button>
              </div>
            </div>

            {esta && (
              <div className="px-3 pb-3 space-y-2.5" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    La pregunta
                  </label>
                  <input value={p.titulo} onChange={e => tocar(p.id, { titulo: e.target.value })}
                    placeholder="¿Qué le quiere preguntar?" className={inp} style={estiloInp} />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Ayuda <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--text-faint)' }}>(opcional)</span>
                  </label>
                  <input value={p.ayuda ?? ''} onChange={e => tocar(p.id, { ayuda: e.target.value })}
                    placeholder="Una línea que le aclare qué contestar" className={inp} style={estiloInp} />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Cómo responde
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {TIPOS.map(t => (
                      <button key={t.id} onClick={() => tocar(p.id, { tipo: t.id as TipoPregunta })}
                        title={t.ayuda}
                        className="text-[11px] font-semibold py-2 px-2 rounded-lg text-left"
                        style={p.tipo === t.id
                          ? { background: 'var(--primary)', color: '#fff' }
                          : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                        {t.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {usaOpciones(p.tipo) && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                      Las opciones <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--text-faint)' }}>(una por línea)</span>
                    </label>
                    <textarea rows={4} value={p.opciones.join('\n')}
                      onChange={e => tocar(p.id, { opciones: e.target.value.split('\n') })}
                      placeholder={'Muy de acuerdo\nDe acuerdo\nEn desacuerdo'}
                      className={`${inp} resize-none`} style={estiloInp} />
                  </div>
                )}

                {(p.tipo === 'texto' || p.tipo === 'parrafo') && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                      Ejemplo dentro de la casilla <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--text-faint)' }}>(opcional)</span>
                    </label>
                    <input value={p.placeholder ?? ''} onChange={e => tocar(p.id, { placeholder: e.target.value })}
                      placeholder="Ej: el piso queda resbaloso cuando llueve" className={inp} style={estiloInp} />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={p.obligatoria}
                    onChange={e => tocar(p.id, { obligatoria: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-xs" style={{ color: 'var(--text)' }}>
                    Obligatoria: sin responderla no puede enviar
                  </span>
                </label>
              </div>
            )}
          </div>
        )
      })}

      <button onClick={agregar}
        className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
        style={{ border: '1px dashed var(--border)', color: 'var(--primary)' }}>
        <Plus size={14} /> Agregar pregunta
      </button>

      {error && (
        <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
          <X size={13} /> {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {listo && <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Guardado</span>}
        <button onClick={guardar} disabled={guardando}
          className="terra-btn flex items-center gap-1.5" style={{ padding: '9px 18px', fontSize: 12 }}>
          {guardando ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Guardar preguntas
        </button>
      </div>
    </div>
  )
}
