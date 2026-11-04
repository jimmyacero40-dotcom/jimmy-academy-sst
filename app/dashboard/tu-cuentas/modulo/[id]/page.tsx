'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  LayoutList, Loader2, CheckCircle, ChevronLeft, ChevronRight,
  Save, AlertCircle, Send, Clock, User,
} from 'lucide-react'
import {
  avance, respondida, estaCompleta, type Modulo, type Pregunta,
} from '@/lib/modulos'

const inp = 'w-full text-sm rounded-xl px-3 py-2.5 outline-none'
const estiloInp: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
}

export default function ResponderModuloPage({ params }: { params: { id: string } }) {
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [datos, setDatos] = useState<Record<string, any>>({})
  const [trabajador, setTrabajador] = useState<any>({})
  const [paso, setPaso] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(false)

  useEffect(() => {
    fetch(`/api/modulos/${params.id}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'No disponible')
        return r.json()
      })
      .then(d => {
        setModulo(d.modulo)
        setPreguntas(d.preguntas ?? [])
        setTrabajador(d.trabajador ?? {})
        if (d.respuesta) {
          setDatos(d.respuesta.respuestas ?? {})
          if (d.respuesta.estado === 'enviado') setEnviada(true)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [params.id])

  const set = (id: string, valor: any) => {
    setDatos(p => ({ ...p, [id]: valor }))
    setError(null)
  }

  // Los guardados se encadenan: dos a la vez podrían chocar al crear la misma
  // respuesta, que es única por módulo y persona.
  const enCurso = useRef<Promise<unknown>>(Promise.resolve())

  const guardar = useCallback((enviar: boolean): Promise<boolean> => {
    const tarea = enCurso.current.then(() => ahora())
    enCurso.current = tarea.catch(() => {})
    return tarea

    async function ahora() {
      setGuardando(true); setError(null)
      try {
        const r = await fetch(`/api/modulos/${params.id}/respuestas`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ respuestas: datos, enviar }),
        })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) { setError(d.error ?? 'No fue posible guardar'); return false }
        if (enviar) setEnviada(true)
        return true
      } catch {
        setError('Sin conexión. Intenta de nuevo.')
        return false
      } finally { setGuardando(false) }
    }
  }, [datos, params.id])

  const pregunta = preguntas[paso]
  const { hechas, total, pct } = avance(preguntas, datos)
  const puedeAvanzar = !pregunta?.obligatoria || respondida(pregunta, datos[pregunta.id])
  const esUltima = paso === preguntas.length - 1

  const siguiente = () => {
    if (!puedeAvanzar) { setIntento(true); return }
    setIntento(false)
    void guardar(false)
    setPaso(p => Math.min(p + 1, preguntas.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const anterior = () => {
    setIntento(false)
    setPaso(p => Math.max(p - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const enviar = async () => {
    if (!estaCompleta(preguntas, datos)) {
      setIntento(true)
      setError('Faltan preguntas por responder')
      return
    }
    await guardar(true)
  }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando…</p>
    </div>
  )

  if (!modulo) return (
    <div className="max-w-xl mx-auto p-4">
      <div className="terra-card p-8 text-center">
        <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{error ?? 'No disponible'}</p>
        <Link href="/dashboard/tu-cuentas" className="terra-btn mt-4 inline-block"
          style={{ padding: '10px 18px', fontSize: 13 }}>Volver a Tú Cuentas</Link>
      </div>
    </div>
  )

  if (enviada) return (
    <Cierre color="#10B981" icono={<CheckCircle size={30} />} titulo="¡Gracias por responder!">
      Lo que contó en «{modulo.nombre}» quedó registrado. El área de Seguridad y Salud en el
      Trabajo lo va a tener en cuenta.
    </Cierre>
  )

  if (modulo.estado !== 'abierto') return (
    <Cierre color="#F59E0B" icono={<Clock size={30} />} titulo="El plazo ya se cerró">
      «{modulo.nombre}» ya no recibe respuestas. Si necesita contar algo, háblelo con el área de
      Seguridad y Salud en el Trabajo.
    </Cierre>
  )

  if (!preguntas.length) return (
    <Cierre color="#F59E0B" icono={<Clock size={30} />} titulo="Todavía no hay preguntas">
      Este módulo aún se está preparando. Vuelva más tarde.
    </Cierre>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 pb-32">

      {/* ── Encabezado ── */}
      <div className="terra-card p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: modulo.color + '1F', color: modulo.color }}>
            <LayoutList size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>{modulo.nombre}</p>
            {modulo.descripcion && (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{modulo.descripcion}</p>
            )}
            {trabajador?.nombre && (
              <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                <User size={11} />{trabajador.nombre}
                {trabajador.cargo && ` · ${trabajador.cargo}`}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-dim)' }}>
              Pregunta {paso + 1} de {preguntas.length}
              {total > 0 && ` · ${hechas} de ${total} obligatorias`}
            </span>
            <span className="text-xs font-bold" style={{ color: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : 'var(--text-dim)' }}>
              {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : 'var(--primary)' }} />
          </div>
        </div>
      </div>

      {/* ── La pregunta ── */}
      <AnimatePresence mode="wait">
        <motion.div key={pregunta.id}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="terra-card p-5">
          <p className="text-base font-bold leading-snug" style={{ color: 'var(--text)' }}>
            {pregunta.titulo}
            {!pregunta.obligatoria && (
              <span className="text-xs font-normal ml-1.5" style={{ color: 'var(--text-faint)' }}>(opcional)</span>
            )}
          </p>
          {pregunta.ayuda && (
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{pregunta.ayuda}</p>
          )}

          <div className="mt-4">
            <Campo pregunta={pregunta} valor={datos[pregunta.id]} onCambio={v => set(pregunta.id, v)} />
          </div>

          {intento && !puedeAvanzar && (
            <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: '#FCA5A5' }}>
              <AlertCircle size={13} /> Esta pregunta es obligatoria.
            </p>
          )}
          {error && (
            <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: '#FCA5A5' }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Pie ── */}
      <div className="flex items-center gap-2 mt-4">
        <button onClick={anterior} disabled={paso === 0}
          className="terra-btn-outline flex items-center gap-1.5 disabled:opacity-30"
          style={{ padding: '10px 16px', fontSize: 12 }}>
          <ChevronLeft size={13} /> Atrás
        </button>

        <button onClick={() => guardar(false)} disabled={guardando}
          className="flex items-center gap-1.5 rounded-lg text-xs font-semibold"
          style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          {guardando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
        </button>

        <div className="ml-auto">
          {esUltima ? (
            <button onClick={enviar} disabled={guardando}
              className="terra-btn flex items-center gap-1.5" style={{ padding: '10px 20px', fontSize: 12 }}>
              {guardando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Enviar
            </button>
          ) : (
            <button onClick={siguiente}
              className="terra-btn flex items-center gap-1.5" style={{ padding: '10px 20px', fontSize: 12 }}>
              Siguiente <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-center mt-4" style={{ color: 'var(--text-faint)' }}>
        Puede dejarlo a medias y seguir después: lo que ya respondió queda guardado.
      </p>
    </div>
  )
}

// ─── Una respuesta, según el tipo de pregunta ─────────────────────────

function Campo({ pregunta, valor, onCambio }: {
  pregunta: Pregunta; valor: any; onCambio: (v: any) => void
}) {
  switch (pregunta.tipo) {
    case 'texto':
      return <input value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        placeholder={pregunta.placeholder ?? ''} className={inp} style={estiloInp} />

    case 'parrafo':
      return <textarea rows={4} value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        placeholder={pregunta.placeholder ?? ''} className={`${inp} resize-none`} style={estiloInp} />

    case 'numero':
      return <input type="number" value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        className={inp} style={estiloInp} />

    case 'fecha':
      return <input type="date" value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        className={inp} style={estiloInp} />

    case 'si_no':
      return (
        <div className="flex gap-2">
          {[['si', 'Sí'], ['no', 'No']].map(([v, n]) => (
            <button key={v} onClick={() => onCambio(v)}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={valor === v
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {n}
            </button>
          ))}
        </div>
      )

    case 'escala':
      return (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onCambio(n)}
              className="flex-1 py-3 rounded-xl text-base font-black"
              style={Number(valor) === n
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {n}
            </button>
          ))}
        </div>
      )

    case 'opcion':
      return (
        <div className="space-y-1.5">
          {pregunta.opciones.map(o => (
            <button key={o} onClick={() => onCambio(o)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm"
              style={valor === o
                ? { background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--text)' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {o}
            </button>
          ))}
        </div>
      )

    case 'multiple': {
      const marcadas: string[] = Array.isArray(valor) ? valor : []
      return (
        <div className="space-y-1.5">
          {pregunta.opciones.map(o => {
            const puesta = marcadas.includes(o)
            return (
              <button key={o}
                onClick={() => onCambio(puesta ? marcadas.filter(x => x !== o) : [...marcadas, o])}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5"
                style={puesta
                  ? { background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--text)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: puesta ? 'var(--primary)' : 'transparent',
                    border: `2px solid ${puesta ? 'var(--primary)' : 'var(--border)'}`,
                  }}>
                  {puesta && <CheckCircle size={10} className="text-white" />}
                </span>
                {o}
              </button>
            )
          })}
        </div>
      )
    }

    case 'confirmacion':
      return (
        <button onClick={() => onCambio(valor !== true)}
          className="w-full text-left px-3 py-3 rounded-xl text-sm flex items-start gap-2.5"
          style={valor === true
            ? { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--text)' }
            : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{
              background: valor === true ? '#10B981' : 'transparent',
              border: `2px solid ${valor === true ? '#10B981' : 'var(--border)'}`,
            }}>
            {valor === true && <CheckCircle size={13} className="text-white" />}
          </span>
          <span>Confirmo que lo que respondí es mío y es verdad.</span>
        </button>
      )

    default:
      return null
  }
}

function Cierre({ color, icono, titulo, children }: {
  color: string; icono: React.ReactNode; titulo: string; children: React.ReactNode
}) {
  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="terra-card p-10 text-center flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: color + '1F', color, border: `1px solid ${color}4D` }}>
          {icono}
        </div>
        <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{titulo}</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: 420 }}>{children}</p>
        <Link href="/dashboard/tu-cuentas" className="terra-btn mt-2" style={{ padding: '11px 20px', fontSize: 13 }}>
          Volver a Tú Cuentas
        </Link>
      </motion.div>
    </div>
  )
}
