'use client'

/**
 * Mis acciones: lo que esta cuenta tiene que ejecutar.
 *
 * Es la única pantalla del responsable —mantenimiento, el jefe de campo,
 * gerencia—. Ve lo que se le asignó y nada más, escribe qué hizo y ahí para:
 * cerrar el reporte es de quien verifica, no de quien ejecuta.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Wrench, Loader2, CheckCircle, Clock, MapPin, Calendar, AlertTriangle, Send,
} from 'lucide-react'

interface Accion {
  id: string
  codigo: string | null
  fecha_reporte: string | null
  lugar: string | null
  area: string | null
  centro_trabajo: string | null
  tipos: string[] | null
  descripcion: string | null
  acciones_inmediatas: string[] | null
  sugerencia_mejora: string | null
  estado: string
  fecha_asignacion: string | null
  accion_intervencion: string | null
  observaciones_sst: string | null
  ejecucion_descripcion: string | null
  ejecucion_at: string | null
  ejecutado_por_nombre: string | null
  fecha_cierre: string | null
  observaciones_cierre: string | null
  created_at: string
}

function dia(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function MisAccionesPage() {
  const [acciones, setAcciones] = useState<Accion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState<'pendientes' | 'todas'>('pendientes')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch('/api/mis-acciones')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo cargar')
      setAcciones(d.acciones ?? [])
    } catch (e: any) {
      setError(e.message)
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const porHacer = useMemo(() => acciones.filter(a => a.estado !== 'cerrado' && !a.ejecucion_at), [acciones])
  const enEspera = useMemo(() => acciones.filter(a => a.estado !== 'cerrado' && a.ejecucion_at), [acciones])
  const cerradas = useMemo(() => acciones.filter(a => a.estado === 'cerrado'), [acciones])

  const visibles = filtro === 'pendientes' ? [...porHacer, ...enEspera] : acciones

  async function registrar(a: Accion) {
    if (!texto.trim()) return
    setGuardando(true); setError(null)
    try {
      const r = await fetch('/api/mis-acciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, ejecucion_descripcion: texto }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo guardar')
      setAbierta(null); setTexto('')
      await cargar()
    } catch (e: any) {
      setError(e.message)
    }
    setGuardando(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <Wrench size={18} style={{ color: '#6366F1' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            Mis acciones
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Lo que le asignaron de los reportes. Escriba qué hizo; SST lo verifica y lo cierra.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { n: porHacer.length, t: 'Por hacer', c: '#F59E0B' },
          { n: enEspera.length, t: 'Hechas, esperando verificación', c: '#6366F1' },
          { n: cerradas.length, t: 'Cerradas por SST', c: '#10B981' },
        ].map(x => (
          <div key={x.t} className="terra-card p-3">
            <p className="text-2xl font-black tabular-nums leading-none" style={{ color: x.c }}>{x.n}</p>
            <p className="text-[11px] font-bold mt-1.5 leading-tight" style={{ color: 'var(--text-dim)' }}>{x.t}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {([['pendientes', 'Lo que falta'], ['todas', 'Todas']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: filtro === k ? 'var(--primary)' : 'transparent', color: filtro === k ? '#fff' : 'var(--text-dim)' }}>
            {l}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : visibles.length === 0 ? (
        <div className="terra-card p-12 text-center">
          <CheckCircle size={30} className="mx-auto mb-3" style={{ color: '#10B981' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>No tiene acciones pendientes</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Cuando SST le asigne una acción de un reporte, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map(a => {
            const hecha = !!a.ejecucion_at
            const cerrada = a.estado === 'cerrado'
            const color = cerrada ? '#10B981' : hecha ? '#6366F1' : '#F59E0B'
            return (
              <div key={a.id} className="terra-card overflow-hidden" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black tabular-nums" style={{ color: 'var(--text-faint)' }}>
                          {a.codigo ?? 'Sin código'}
                        </span>
                        {(a.tipos ?? []).map(t => (
                          <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm font-bold mt-1.5" style={{ color: 'var(--text)' }}>
                        {a.descripcion || 'Sin descripción'}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {a.lugar && (
                          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                            <MapPin size={11} /> {a.lugar}{a.area ? ` · ${a.area}` : ''}
                          </span>
                        )}
                        <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                          <Calendar size={11} /> Reportado el {dia(a.fecha_reporte ?? a.created_at)}
                        </span>
                        {a.fecha_asignacion && (
                          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                            <Clock size={11} /> Asignado el {dia(a.fecha_asignacion)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: `${color}1A`, color }}>
                      {cerrada ? 'CERRADA' : hecha ? 'HECHA' : 'POR HACER'}
                    </span>
                  </div>

                  {(a.accion_intervencion || a.observaciones_sst) && (
                    <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                        Lo que pide SST
                      </p>
                      {a.accion_intervencion && (
                        <p className="text-xs" style={{ color: 'var(--text)' }}>{a.accion_intervencion}</p>
                      )}
                      {a.observaciones_sst && (
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>{a.observaciones_sst}</p>
                      )}
                    </div>
                  )}

                  {hecha && (
                    <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#6366F1' }}>
                        Lo que se hizo
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>{a.ejecucion_descripcion}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                        {a.ejecutado_por_nombre ?? 'Registrado'} · {dia(a.ejecucion_at)}
                        {!cerrada && ' · esperando la verificación de SST'}
                      </p>
                    </div>
                  )}

                  {cerrada && a.observaciones_cierre && (
                    <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#10B981' }}>
                        Cierre de SST · {dia(a.fecha_cierre)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>{a.observaciones_cierre}</p>
                    </div>
                  )}

                  {!cerrada && (
                    abierta === a.id ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold" style={{ color: 'var(--text-dim)' }}>
                          ¿Qué se hizo? Escríbalo como quedará en el soporte
                        </label>
                        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={4} autoFocus
                          placeholder="Ej.: Se cambió la guarda del motor 3 y se verificó su ajuste. Material: guarda metálica calibre 18."
                          className="w-full rounded-xl px-3 py-2.5 text-sm"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                        <div className="flex gap-2">
                          <button onClick={() => { setAbierta(null); setTexto('') }}
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                            Cancelar
                          </button>
                          <button onClick={() => registrar(a)} disabled={guardando || !texto.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                            style={{ background: '#6366F1', color: '#fff' }}>
                            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Registrar lo hecho
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAbierta(a.id); setTexto(a.ejecucion_descripcion ?? '') }}
                        className="w-full py-2.5 rounded-xl text-sm font-bold"
                        style={hecha
                          ? { border: '1px solid var(--border)', color: 'var(--text-dim)' }
                          : { background: '#6366F1', color: '#fff' }}>
                        {hecha ? 'Corregir lo que escribí' : 'Registrar lo que hice'}
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
