'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  LogOut, ArrowLeft, RefreshCw, CheckCircle2, Clock, DoorOpen, Search, X,
} from 'lucide-react'
import { useConsulta } from '@/lib/useConsulta'

interface InsideLog {
  id: string
  entry_time: string
  gatehouse: { id: string; name: string } | null
  user: { id: string; name: string; cedula: string; cargo: string | null; active: boolean }
  area: { id: string; name: string; color: string } | null
}
interface Area { id: string; name: string; color: string }
interface Gatehouse { id: string; name: string; is_active: boolean }

type Orden = 'reciente' | 'antiguo' | 'nombre'

const SIN_PORTERIA = '__sin_porteria__'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function permanencia(entry: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(entry).getTime()) / 60000))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60); const m = mins % 60
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim()
}

const inputCls = 'px-3 py-2 rounded-lg text-sm outline-none'
const inputSty = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }

export default function SalidaPage() {
  const { data: session } = useSession()
  const esPortero = (session?.user as any)?.role === 'portero'

  // Porterías visibles para este usuario: el API ya devuelve solo las asignadas
  // a un portero, y todas a un administrador.
  const porterias = useConsulta<Gatehouse[]>('/api/gatehouses', [])
  const areasQ = useConsulta<Area[]>('/api/areas', [])
  const gatehouses = useMemo(() => (Array.isArray(porterias.datos) ? porterias.datos : []).filter(g => g.is_active), [porterias.datos])
  const areas = Array.isArray(areasQ.datos) ? areasQ.datos : []

  // '' = Todas. Es el valor inicial para que el superadmin vea todas las porterías.
  const [filtroPorteria, setFiltroPorteria] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden>('reciente')

  // Hasta conocer las porterías no se consulta: antes se pedía "todas" un instante
  // y se pintaban datos mezclados antes de la sede correcta.
  const url = porterias.cargando ? null : (() => {
    const p = new URLSearchParams()
    if (filtroPorteria) p.set('gatehouse_id', filtroPorteria)
    if (filtroArea) p.set('area_id', filtroArea)
    return `/api/access-logs/inside?${p}`
  })()
  const dentro = useConsulta<InsideLog[]>(url, [])
  const logs = Array.isArray(dentro.datos) ? dentro.datos : []

  const [registering, setRegistering] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function registerExit(log: InsideLog) {
    setRegistering(log.id)
    const res = await fetch(`/api/access-logs/${log.id}`, { method: 'PATCH' })
    if (res.ok) {
      showToast(`Salida registrada: ${log.user.name}`, 'ok')
      dentro.setDatos(prev => (Array.isArray(prev) ? prev : []).filter(l => l.id !== log.id))
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error || 'Error al registrar salida', 'err')
    }
    setRegistering(null)
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = logs.filter(l =>
      !q || l.user.name.toLowerCase().includes(q) || (l.user.cedula || '').includes(q))
    return [...lista].sort((a, b) => {
      if (orden === 'nombre') return a.user.name.localeCompare(b.user.name, 'es')
      const d = new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime()
      return orden === 'antiguo' ? d : -d
    })
  }, [logs, busqueda, orden])

  // Secciones: con "Todas" aparece cada portería aunque no tenga a nadie dentro,
  // para que el superadmin vea el estado de todas de un vistazo.
  const secciones = useMemo(() => {
    const base = filtroPorteria ? gatehouses.filter(g => g.id === filtroPorteria) : gatehouses
    const grupos = base.map(g => ({ id: g.id, nombre: g.name, logs: visibles.filter(l => l.gatehouse?.id === g.id) }))
    const sinPorteria = visibles.filter(l => !l.gatehouse)
    if (!filtroPorteria && sinPorteria.length) grupos.push({ id: SIN_PORTERIA, nombre: 'Sin portería registrada', logs: sinPorteria })
    return grupos
  }, [gatehouses, visibles, filtroPorteria])

  const hayFiltros = !!(filtroPorteria || filtroArea || busqueda || orden !== 'reciente')
  const cargando = porterias.cargando || dentro.cargando

  return (
    <div className="p-4 sm:p-6 w-full space-y-4">
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'ok' ? '#10B981' : '#EF4444', color: '#fff', maxWidth: 380 }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Link href={esPortero ? '/dashboard/control-operativo/porteria' : '/dashboard/control-operativo'}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <ArrowLeft size={14} /> Volver
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>Registro de Salida</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Personas con ingreso sin salida hoy, por portería.</p>
        </div>
        <button onClick={dentro.recargar} disabled={cargando}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-xl p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3 items-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o cédula…"
            className={`${inputCls} w-full pl-9`} style={inputSty} />
        </div>
        {gatehouses.length > 1 && (
          <select value={filtroPorteria} onChange={e => setFiltroPorteria(e.target.value)}
            className={`${inputCls} flex-1 sm:flex-none font-semibold`} style={inputSty} aria-label="Portería">
            <option value="">Todas las porterías</option>
            {gatehouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
        <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)}
          className={`${inputCls} flex-1 sm:flex-none`} style={inputSty} aria-label="Área">
          <option value="">Todas las áreas</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={orden} onChange={e => setOrden(e.target.value as Orden)}
          className={`${inputCls} flex-1 sm:flex-none`} style={inputSty} aria-label="Orden">
          <option value="reciente">Ingreso más reciente</option>
          <option value="antiguo">Más tiempo dentro</option>
          <option value="nombre">Nombre (A-Z)</option>
        </select>
        {hayFiltros && (
          <button onClick={() => { setFiltroPorteria(''); setFiltroArea(''); setBusqueda(''); setOrden('reciente') }}
            className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {dentro.error && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444' }}>
          No fue posible cargar: {dentro.error}
        </div>
      )}

      {cargando ? (
        // Mientras llega el contexto nuevo no se muestra nada del anterior.
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map(i => (
            <div key={i} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="h-5 w-48 rounded animate-pulse" style={{ background: 'var(--border)' }} />
              {[0, 1, 2].map(j => <div key={j} className="h-10 rounded animate-pulse" style={{ background: 'var(--bg)' }} />)}
            </div>
          ))}
        </div>
      ) : secciones.length === 0 ? (
        <div className="rounded-xl py-14 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <DoorOpen size={30} className="mx-auto mb-2" style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No tienes porterías asignadas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {secciones.map(sec => (
            <section key={sec.id} className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                <DoorOpen size={16} style={{ color: 'var(--primary)' }} />
                <h2 className="text-sm font-extrabold uppercase tracking-wide flex-1 min-w-0 truncate" style={{ color: 'var(--text-strong)' }}>
                  {sec.nombre}
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: sec.logs.length ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)', color: sec.logs.length ? '#10B981' : 'var(--text-faint)' }}>
                  {sec.logs.length} dentro
                </span>
              </header>

              {sec.logs.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-5 text-sm" style={{ color: 'var(--text-faint)' }}>
                  <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                  {busqueda || filtroArea ? 'Nadie coincide con los filtros en esta portería.' : 'No hay personas dentro.'}
                </div>
              ) : (
                <>
                  {/* Escritorio: tabla */}
                  <div className="hidden md:block">
                    <table className="terra-table w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-2.5 text-left">Trabajador</th>
                          <th className="px-4 py-2.5 text-left">Cédula</th>
                          <th className="px-4 py-2.5 text-left">Área</th>
                          <th className="px-4 py-2.5 text-left">Ingreso</th>
                          <th className="px-4 py-2.5 text-left">Tiempo</th>
                          <th className="px-4 py-2.5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.logs.map(log => (
                          <tr key={log.id}>
                            <td className="px-4 py-2.5">
                              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{log.user.name}</div>
                              {log.user.cargo && <div className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{log.user.cargo}</div>}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>{log.user.cedula || '—'}</td>
                            <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{log.area?.name || '—'}</td>
                            <td className="px-4 py-2.5 text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{fmtTime(log.entry_time)}</td>
                            <td className="px-4 py-2.5">
                              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                                <Clock size={11} /> {permanencia(log.entry_time)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <BotonSalida log={log} registering={registering} onClick={registerExit} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Celular: tarjetas, todo dentro del ancho, botón siempre visible */}
                  <ul className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                    {sec.logs.map(log => (
                      <li key={log.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{log.user.name}</div>
                          <div className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>C.C. {log.user.cedula || '—'}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-dim)' }}>
                            <span>Ingresó {fmtTime(log.entry_time)}</span>
                            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--primary)' }}>
                              <Clock size={11} /> {permanencia(log.entry_time)}
                            </span>
                            <span className="font-semibold" style={{ color: '#10B981' }}>· Dentro</span>
                          </div>
                        </div>
                        <BotonSalida log={log} registering={registering} onClick={registerExit} grande />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function BotonSalida({ log, registering, onClick, grande }: {
  log: InsideLog; registering: string | null; onClick: (l: InsideLog) => void; grande?: boolean
}) {
  return (
    <button onClick={() => onClick(log)} disabled={registering === log.id}
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold disabled:opacity-60 flex-shrink-0 ${grande ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'}`}
      style={{ background: '#EF4444', color: '#fff' }}>
      {registering === log.id ? <RefreshCw size={13} className="animate-spin" /> : <LogOut size={13} />}
      Salida
    </button>
  )
}
