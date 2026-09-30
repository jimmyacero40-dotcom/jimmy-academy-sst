'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ShieldAlert, Loader2, CheckCircle, ChevronLeft, ChevronRight,
  Save, User, AlertCircle, Send,
} from 'lucide-react'
import {
  PREGUNTAS, GRUPOS_PELIGROS, CAMPO_MEJORAS, avance, estaCompleta,
  type Participacion, type Pregunta,
} from '@/lib/peligros'

interface Trabajador {
  nombre?: string; cedula?: string | null; empresa?: string | null
  cargo?: string | null; area?: string | null; centro_trabajo?: string | null
}

const inp = 'w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors'

export default function ParticipacionPeligrosPage() {
  const [datos, setDatos] = useState<Participacion>({})
  const [trabajador, setTrabajador] = useState<Trabajador>({})
  const [periodo, setPeriodo] = useState(new Date().getFullYear())
  const [paso, setPaso] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(false)

  useEffect(() => {
    fetch('/api/participacion-peligros')
      .then(r => r.json())
      .then(d => {
        setPeriodo(d.periodo)
        setTrabajador(d.trabajador ?? {})
        if (d.participacion) {
          setDatos(d.participacion)
          if (d.participacion.estado === 'enviado') setEnviada(true)
        }
      })
      .catch(() => setError('No fue posible cargar tu participación'))
      .finally(() => setCargando(false))
  }, [])

  const set = (campo: keyof Participacion, valor: any) => {
    setDatos(p => ({ ...p, [campo]: valor }))
    setError(null)
  }

  // Los guardados se encadenan: dos a la vez podrían intentar crear la misma
  // participación y chocar contra la restricción de una por año.
  const enCurso = useRef<Promise<unknown>>(Promise.resolve())

  const guardar = useCallback((enviar: boolean): Promise<boolean> => {
    const tarea = enCurso.current.then(() => guardarAhora(enviar))
    enCurso.current = tarea.catch(() => {})
    return tarea

    async function guardarAhora(enviar: boolean) {
    setGuardando(true); setError(null)
    try {
      const res = await fetch('/api/participacion-peligros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, periodo, enviar }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? 'No fue posible guardar'); return false }
      if (enviar) setEnviada(true)
      return true
    } catch {
      setError('Sin conexión. Intenta de nuevo.')
      return false
    } finally { setGuardando(false) }
    }
  }, [datos, periodo])

  const pregunta = PREGUNTAS[paso]
  const { hechas, total, pct } = avance(datos)

  /** Una pregunta obligatoria sin responder no deja avanzar. */
  const respondida = (q: Pregunta) => {
    if (q.tipo === 'confirmacion') return datos.confirma_participacion === true
    const v = datos[q.campo]
    return Array.isArray(v) ? v.length > 0 : !!v
  }
  const puedeAvanzar = !pregunta?.obligatoria || respondida(pregunta)

  const siguiente = () => {
    if (!puedeAvanzar) { setIntento(true); return }
    setIntento(false)
    // Se avanza de una vez y el guardado va detrás: esperar la respuesta del
    // servidor para cambiar de pregunta se siente como que el botón no responde.
    setPaso(p => Math.min(p + 1, PREGUNTAS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    void guardar(false)
  }
  const anterior = () => { setIntento(false); setPaso(p => Math.max(p - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando…</p>
    </div>
  )

  if (enviada) return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="terra-card p-10 text-center flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle size={30} />
        </div>
        <p className="text-lg font-black" style={{ color: 'var(--text)' }}>¡Gracias por participar!</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: 420 }}>
          Tu participación en la identificación de peligros {periodo} quedó registrada. El área de
          Seguridad y Salud en el Trabajo la usará para revisar los riesgos de tu labor.
        </p>
        <Link href="/dashboard/tu-cuentas" className="terra-btn mt-2" style={{ padding: '11px 20px', fontSize: 13 }}>
          Volver a Tú Cuentas
        </Link>
      </motion.div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 pb-32">

      {/* ── Encabezado con sus datos, que no tiene que volver a escribir ── */}
      <div className="terra-card p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
            <ShieldAlert size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Participación anual en la identificación de peligros
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Periodo {periodo} · Tu experiencia ayuda a prevenir accidentes
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 grid grid-cols-2 gap-x-4 gap-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          {([
            ['Trabajador', trabajador.nombre],
            ['Cédula', trabajador.cedula],
            ['Cargo', trabajador.cargo],
            ['Área', trabajador.area],
            ['Finca / centro de trabajo', trabajador.centro_trabajo],
            ['Fecha', new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })],
          ] as [string, string | null | undefined][]).map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k}</p>
              <p className="text-xs font-semibold truncate" style={{ color: v ? 'var(--text)' : 'var(--text-faint)' }}>
                {v || 'Sin registrar'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
          <User size={10} /> Estos datos vienen de tu perfil. Si algo está mal, corrígelo en Mi Perfil.
        </p>
      </div>

      {/* ── Avance ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>
            Pregunta {paso + 1} de {PREGUNTAS.length}
          </p>
          <p className="text-xs font-bold" style={{ color: pct === 100 ? '#10B981' : 'var(--primary)' }}>
            {hechas} de {total} respondidas
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          <motion.div className="h-full rounded-full" animate={{ width: `${pct}%` }}
            style={{ background: pct === 100 ? '#10B981' : 'var(--primary)' }} />
        </div>
      </div>

      {/* ── Pregunta ── */}
      <AnimatePresence mode="wait">
        <motion.div key={pregunta.n}
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
          className="terra-card p-5">

          <div className="flex items-start gap-3 mb-4">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: 'var(--primary)', color: '#fff' }}>{pregunta.n}</span>
            <div>
              <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text)' }}>
                {pregunta.titulo}{pregunta.obligatoria && <span style={{ color: '#EF4444' }}> *</span>}
              </p>
              {pregunta.ayuda && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{pregunta.ayuda}</p>
              )}
            </div>
          </div>

          {pregunta.tipo === 'texto' && (
            <textarea className={`${inp} resize-none`} rows={4}
              value={(datos[pregunta.campo] as string) ?? ''}
              onChange={e => set(pregunta.campo, e.target.value)}
              placeholder={pregunta.placeholder} />
          )}

          {pregunta.tipo === 'opcion' && (
            <div className="space-y-2">
              {pregunta.opciones!.map(o => {
                const activa = datos[pregunta.campo] === o
                return (
                  <button key={o} onClick={() => set(pregunta.campo, o)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={activa
                      ? { background: 'rgba(59,130,246,0.12)', border: '1.5px solid var(--primary)', color: 'var(--text)' }
                      : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                    {activa && '✓ '}{o}
                  </button>
                )
              })}
            </div>
          )}

          {pregunta.tipo === 'peligros' && (
            <div className="space-y-4">
              {GRUPOS_PELIGROS.map(g => (
                <div key={g.grupo}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: g.color }}>
                    {g.grupo}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.opciones.map(o => {
                      const marcado = (datos.peligros ?? []).includes(o)
                      return (
                        <button key={o}
                          onClick={() => set('peligros', marcado
                            ? (datos.peligros ?? []).filter(x => x !== o)
                            : [...(datos.peligros ?? []), o])}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all"
                          style={marcado
                            ? { background: `${g.color}22`, border: `1.5px solid ${g.color}`, color: 'var(--text)' }
                            : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                          {marcado && '✓ '}{o}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>
                  Otro peligro que no esté en la lista
                </p>
                <input className={inp} value={datos.peligros_otro ?? ''}
                  onChange={e => set('peligros_otro', e.target.value)} placeholder="Opcional" />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                {(datos.peligros ?? []).length} peligro{(datos.peligros ?? []).length === 1 ? '' : 's'} marcado{(datos.peligros ?? []).length === 1 ? '' : 's'}
              </p>
            </div>
          )}

          {/* La mejora se pregunta junto a la suficiencia de los controles. */}
          {pregunta.campo === 'controles_suficientes' && (
            <div className="mt-4">
              <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text)' }}>{CAMPO_MEJORAS.titulo}</p>
              <textarea className={`${inp} resize-none`} rows={3}
                value={(datos.oportunidades_mejora as string) ?? ''}
                onChange={e => set('oportunidades_mejora', e.target.value)}
                placeholder={CAMPO_MEJORAS.placeholder} />
            </div>
          )}

          {pregunta.tipo === 'confirmacion' && (
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-all"
                style={{
                  background: datos.confirma_participacion ? 'rgba(16,185,129,0.07)' : 'var(--bg-surface)',
                  border: `1px solid ${datos.confirma_participacion ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                }}>
                <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: datos.confirma_participacion ? '#10B981' : 'var(--bg-card)',
                    border: `2px solid ${datos.confirma_participacion ? '#10B981' : 'var(--border)'}`,
                  }}>
                  {datos.confirma_participacion && <CheckCircle size={13} className="text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={!!datos.confirma_participacion}
                  onChange={e => set('confirma_participacion', e.target.checked)} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Confirmo que participé en la identificación de peligros de mi puesto de trabajo y que
                  la información que entregué es verdadera.
                </span>
              </label>

              {!estaCompleta(datos) && (
                <div className="p-3 rounded-xl text-xs flex items-start gap-2"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
                  <AlertCircle size={14} className="mt-px flex-shrink-0" />
                  <span>Todavía faltan respuestas. Usa <strong>Anterior</strong> para completarlas.</span>
                </div>
              )}
            </div>
          )}

          {intento && !puedeAvanzar && (
            <p className="mt-3 text-xs font-bold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
              <AlertCircle size={13} /> Responde esta pregunta para continuar.
            </p>
          )}
          {error && (
            <p className="mt-3 text-xs font-bold" style={{ color: '#EF4444' }}>{error}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Navegación ── */}
      <div className="flex items-center gap-2 mt-4">
        <button onClick={anterior} disabled={paso === 0}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl disabled:opacity-35"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <ChevronLeft size={14} /> Anterior
        </button>

        <button onClick={() => guardar(false)} disabled={guardando}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
        </button>

        <div className="flex-1" />

        {paso < PREGUNTAS.length - 1 ? (
          <button onClick={siguiente}
            className="terra-btn flex items-center gap-1.5 font-bold" style={{ padding: '12px 20px', fontSize: 13 }}>
            Siguiente <ChevronRight size={14} />
          </button>
        ) : (
          <button onClick={() => guardar(true)} disabled={guardando || !estaCompleta(datos)}
            className="terra-btn flex items-center gap-1.5 font-bold disabled:opacity-40"
            style={{ padding: '12px 20px', fontSize: 13, background: '#10B981' }}>
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar participación
          </button>
        )}
      </div>
    </div>
  )
}
