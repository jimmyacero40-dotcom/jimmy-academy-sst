'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  FileText, Loader2, CheckCircle, ChevronLeft, ChevronRight,
  Send, AlertCircle, MapPin, Lock,
} from 'lucide-react'
import { CampoDictado } from '@/components/CampoDictado'
import {
  TIPOS_REPORTE, ACCIONES_INMEDIATAS, faltantes, puedeEnviarse,
  type ReporteHSE,
} from '@/lib/reportes-hse'

const inp = 'w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors'

const hoy = () => new Date().toISOString().slice(0, 10)

// El orden es el del formato AVC-FR54: primero el tipo, después qué sucedió.
const PASOS = ['Datos', 'Tipo', 'Qué sucedió', 'Acción', 'Sugerencia', 'Revisar'] as const

export default function NuevoReportePage() {
  const [r, setR] = useState<ReporteHSE>({ fecha_reporte: hoy(), tipos: [], acciones_inmediatas: [] })
  const [trabajador, setTrabajador] = useState<Record<string, string | null>>({})
  const [paso, setPaso] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState<ReporteHSE | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(false)

  useEffect(() => {
    fetch('/api/reportes-hse').then(res => res.json())
      .then(d => setTrabajador(d.trabajador ?? {}))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const set = (campo: keyof ReporteHSE, valor: any) => { setR(p => ({ ...p, [campo]: valor })); setError(null) }
  const alternar = (campo: 'tipos' | 'acciones_inmediatas', valor: string) => {
    const actual = r[campo] ?? []
    set(campo, actual.includes(valor) ? actual.filter(x => x !== valor) : [...actual, valor])
  }

  // Solo se exige lo imprescindible, y se exige en el paso donde se pregunta.
  const pasoCompleto = (n: number) => {
    if (n === 0) return !!r.fecha_reporte && !!r.lugar?.trim()
    if (n === 1) return (r.tipos ?? []).length > 0
    if (n === 2) return !!r.descripcion?.trim()
    return true
  }

  const siguiente = () => {
    if (!pasoCompleto(paso)) { setIntento(true); return }
    setIntento(false)
    setPaso(p => Math.min(p + 1, PASOS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const anterior = () => { setIntento(false); setPaso(p => Math.max(p - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const enviar = async () => {
    setEnviando(true); setError(null)
    try {
      const res = await fetch('/api/reportes-hse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? 'No fue posible enviar el reporte'); return }
      setEnviado(body.reporte)
    } catch {
      setError('Sin conexión. Intenta de nuevo.')
    } finally { setEnviando(false) }
  }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  )

  if (enviado) return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="terra-card p-10 text-center flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle size={30} />
        </div>
        <p className="text-lg font-black" style={{ color: 'var(--text)' }}>Reporte recibido</p>
        <p className="text-sm font-mono font-bold px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--primary)' }}>
          {enviado.codigo}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: 420 }}>
          Gracias por reportar. El área de Seguridad y Salud en el Trabajo lo revisará y le hará
          seguimiento. Puede consultarlo cuando quiera en RePortal.
        </p>
        <div className="flex gap-2 mt-2 flex-wrap justify-center">
          <Link href="/dashboard/reportal" className="terra-btn" style={{ padding: '11px 20px', fontSize: 13 }}>
            Ver mis reportes
          </Link>
          <button onClick={() => { setEnviado(null); setR({ fecha_reporte: hoy(), tipos: [], acciones_inmediatas: [] }); setPaso(0) }}
            className="text-sm font-bold px-5 py-2.5 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            Hacer otro reporte
          </button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 pb-32">

      {/* ── Quién reporta: ya lo sabemos ── */}
      <div className="terra-card p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}>
            <FileText size={19} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Tarjeta de reporte HSE
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Reporta {trabajador.nombre ?? ''}{trabajador.cedula ? ` · ${trabajador.cedula}` : ''}
              {trabajador.cargo ? ` · ${trabajador.cargo}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ── Avance ── */}
      <div className="flex gap-1 mb-4">
        {PASOS.map((p, i) => (
          <div key={p} className="flex-1">
            <div className="h-1.5 rounded-full transition-all"
              style={{ background: i <= paso ? 'var(--primary)' : 'var(--bg-card)' }} />
            <p className="text-[10px] font-bold mt-1 text-center truncate"
              style={{ color: i === paso ? 'var(--primary)' : 'var(--text-faint)' }}>{p}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={paso}
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }} className="terra-card p-5 space-y-5">

          {/* ── 1. Qué sucedió, dónde y cuándo ── */}
          {paso === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text)' }}>Fecha del reporte *</p>
                <input type="date" className={inp} value={r.fecha_reporte ?? ''} max={hoy()}
                  onChange={e => set('fecha_reporte', e.target.value)} />
              </div>
              <div>
                <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                  <MapPin size={11} /> Lugar *
                </p>
                <input className={inp} value={r.lugar ?? ''}
                  onChange={e => set('lugar', e.target.value)} placeholder="Ej: bodega, lote 3, taller" />
              </div>
              <p className="col-span-2 text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                Su nombre y su cédula ya están en el reporte; no tiene que escribirlos.
              </p>
            </div>
          )}

          {/* ── 1. Tipo de reporte ── */}
          {paso === 1 && (
            <>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  ¿Qué tipo de reporte es? <span style={{ color: '#EF4444' }}>*</span>
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  Puede marcar más de uno. Si no está seguro, elija el que más se parezca.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {TIPOS_REPORTE.map(t => {
                  const activo = (r.tipos ?? []).includes(t.id)
                  return (
                    <button key={t.id} onClick={() => alternar('tipos', t.id)}
                      className="text-left p-3.5 rounded-xl transition-all flex items-start gap-3"
                      style={activo
                        ? { background: `${t.color}18`, border: `1.5px solid ${t.color}` }
                        : { background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <span className="text-xl leading-none mt-0.5">{t.icono}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold" style={{ color: activo ? t.color : 'var(--text)' }}>
                          {activo && '✓ '}{t.titulo}
                        </span>
                        <span className="block text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          {t.ayuda}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── 2. ¿Qué sucedió? ── */}
          {paso === 2 && (
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                ¿Qué sucedió? <span style={{ color: '#EF4444' }}>*</span>
              </p>
              <p className="text-xs mt-1 mb-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                Indique claramente lo que desea reportar. Si prefiere, puede dictarlo.
              </p>
              <CampoDictado className={inp} rows={6}
                value={r.descripcion ?? ''} onChange={v => set('descripcion', v)}
                aria-label="¿Qué sucedió?"
                placeholder="Ej: la escalera del beneficiadero está suelta y se mueve al subir" />
            </div>
          )}

          {/* ── 3. Acción inmediata ── */}
          {paso === 3 && (
            <>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>¿Qué se hizo de inmediato?</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  Marque lo que se haya hecho. Si no se hizo nada todavía, puede seguir sin marcar.
                </p>
              </div>
              <div className="space-y-2">
                {ACCIONES_INMEDIATAS.map(a => {
                  const activo = (r.acciones_inmediatas ?? []).includes(a)
                  return (
                    <button key={a} onClick={() => alternar('acciones_inmediatas', a)}
                      className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-semibold transition-all"
                      style={activo
                        ? { background: 'rgba(16,185,129,0.12)', border: '1.5px solid #10B981', color: 'var(--text)' }
                        : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                      {activo ? '✓ ' : ''}{a}
                    </button>
                  )
                })}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>¿Otra acción o sugerencia?</p>
                <p className="text-xs mt-1 mb-2" style={{ color: 'var(--text-dim)' }}>Opcional.</p>
                <CampoDictado className={inp} rows={3}
                  value={r.otra_accion ?? ''} onChange={v => set('otra_accion', v)}
                  aria-label="Otra acción o sugerencia"
                  placeholder="Ej: se avisó al jefe de la finca por radio" />
              </div>
            </>
          )}

          {/* ── 4. Sugerencia de mejora ── */}
          {paso === 4 && (
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                ¿Qué cree que debería hacerse para mejorar?
              </p>
              <p className="text-xs mt-1 mb-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                Su sugerencia de mejora o intervención. Es opcional, pero es lo que más ayuda a
                corregir de raíz.
              </p>
              <CampoDictado className={inp} rows={6}
                value={r.sugerencia_mejora ?? ''} onChange={v => set('sugerencia_mejora', v)}
                aria-label="Sugerencia de mejora o intervención"
                placeholder="Ej: cambiar la escalera por una fija y con pasamanos" />
            </div>
          )}

          {/* ── Revisar y enviar ── */}
          {paso === 5 && (
            <div className="space-y-3">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Revise antes de enviar</p>

              {([
                ['Fecha', r.fecha_reporte],
                ['Lugar', r.lugar],
                ['1. Tipo de reporte', (r.tipos ?? []).join(', ')],
                ['2. Qué sucedió', r.descripcion],
                ['3. Acción inmediata', [...(r.acciones_inmediatas ?? []), r.otra_accion].filter(Boolean).join(' · ')],
                ['4. Sugerencia de mejora o intervención', r.sugerencia_mejora],
              ] as [string, string | null | undefined][]).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k}</p>
                  <p className="text-sm whitespace-pre-wrap mt-0.5" style={{ color: v ? 'var(--text)' : 'var(--text-faint)' }}>
                    {v || 'Sin diligenciar'}
                  </p>
                </div>
              ))}

              {/* El seguimiento no es del trabajador: se muestra para que sepa qué sigue. */}
              <div className="p-3.5 rounded-xl" style={{ background: 'rgba(148,163,184,0.08)', border: '1px dashed var(--border)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
                  <Lock size={11} /> 5. Seguimiento — lo diligencia Seguridad y Salud en el Trabajo
                </p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Seguimiento, quién recibe la solicitud, su firma y el número en la Matriz de Mejoras.
                  Usted no tiene que llenar nada de esto: lo registra SST cuando atienda el reporte.
                </p>
              </div>

              {!puedeEnviarse(r) && (
                <div className="p-3 rounded-xl text-xs flex items-start gap-2"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
                  <AlertCircle size={14} className="mt-px flex-shrink-0" />
                  <span>Falta {faltantes(r).join(', ')}. Use <strong>Anterior</strong> para completarlo.</span>
                </div>
              )}
            </div>
          )}

          {intento && !pasoCompleto(paso) && (
            <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
              <AlertCircle size={13} />
              {paso === 0 ? 'Complete la fecha y el lugar.'
                : paso === 1 ? 'Elija al menos un tipo de reporte.'
                : 'Cuente qué sucedió para poder continuar.'}
            </p>
          )}
          {error && <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{error}</p>}
        </motion.div>
      </AnimatePresence>

      {/* ── Navegación ── */}
      <div className="flex items-center gap-2 mt-4">
        {paso === 0
          ? <Link href="/dashboard/reportal"
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <ChevronLeft size={14} /> Salir
            </Link>
          : <button onClick={anterior}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <ChevronLeft size={14} /> Anterior
            </button>}

        <div className="flex-1" />

        {paso < PASOS.length - 1 ? (
          <button onClick={siguiente}
            className="terra-btn flex items-center gap-1.5 font-bold" style={{ padding: '13px 22px', fontSize: 14 }}>
            Siguiente <ChevronRight size={15} />
          </button>
        ) : (
          <button onClick={enviar} disabled={enviando || !puedeEnviarse(r)}
            className="terra-btn flex items-center gap-1.5 font-bold disabled:opacity-40"
            style={{ padding: '13px 22px', fontSize: 14, background: '#10B981' }}>
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {enviando ? 'Enviando…' : 'Enviar reporte'}
          </button>
        )}
      </div>
    </div>
  )
}
