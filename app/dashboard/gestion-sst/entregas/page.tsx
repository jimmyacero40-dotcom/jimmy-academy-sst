'use client'

/**
 * Entregas al trabajador.
 *
 * Nació por la bebida hidratante de los que fumigan, pero no se hizo para la
 * bebida: entregar un EPP, la dotación o el protector solar es exactamente lo
 * mismo, y quien entrega define qué entrega.
 *
 * El formato en papel era largo porque el papel no sabe quién es nadie: había
 * que escribir nombre, cédula, cargo y área en cada entrega. Aquí la persona
 * ya existe, así que una entrega son cuatro datos y tres toques.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Package, Plus, Loader2, Search, Check, X, Trash2, Download,
  Settings2, CalendarDays, PenLine, AlertCircle, FileText,
} from 'lucide-react'
import { tienePermiso } from '@/lib/permisos'

interface Tipo {
  id: string
  nombre: string
  descripcion: string | null
  referencia: string | null
  unidad: string
  periodicidad: 'diaria' | 'semanal' | 'mensual' | 'ninguna'
  activo: boolean
}

interface Entrega {
  id: string
  user_id: string
  nombre: string
  cedula: string
  cargo: string
  area: string
  cantidad: number
  referencia: string | null
  entregado_at: string
  entregado_por_nombre: string | null
  observacion: string | null
  elemento?: string
  unidad?: string
  tiene_firma: boolean
  confirmado_at: string | null
}

interface Persona {
  id: string
  name: string
  cedula: string | null
  cargo: string | null
  area: string | null
}

const PERIODOS: Record<string, string> = {
  diaria: 'Un día',
  semanal: 'Una semana',
  mensual: 'Un mes',
  ninguna: 'Sin periodicidad',
}

const inp = 'px-3 py-2 rounded-lg text-sm outline-none w-full'
const estilo = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }

/** Hoy en Colombia, 'YYYY-MM-DD'. */
function hoyCol(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export default function EntregasPage() {
  const { data: session } = useSession()
  const usuario = session?.user as { role?: string; permissions?: string[] | null } | undefined
  const puedeRegistrar = !!usuario?.role
    && tienePermiso(usuario.role, usuario.permissions, 'sst.entregas.registrar')

  const [tipos, setTipos] = useState<Tipo[]>([])
  const [tipoId, setTipoId] = useState('')
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [recientes, setRecientes] = useState<Record<string, string>>({})
  const [desde, setDesde] = useState(hoyCol())
  const [hasta, setHasta] = useState(hoyCol())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entregando, setEntregando] = useState(false)
  const [editandoTipos, setEditandoTipos] = useState(false)
  // Para el encabezado del formato de la empresa.
  const [empresa, setEmpresa] = useState('AgroVenture Capital')
  const [logo, setLogo] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/companies')
      .then(r => (r.ok ? r.json() : []))
      .then((d: any[]) => {
        if (d?.[0]?.name) setEmpresa(d[0].name)
        if (d?.[0]?.logo_url) setLogo(d[0].logo_url)
      })
      .catch(() => {})
  }, [])

  const verTodos = tipoId === 'todos'
  const tipo = useMemo(
    () => (verTodos
      ? { id: 'todos', nombre: 'Todos los entregables', descripcion: null, referencia: null, unidad: '', periodicidad: 'ninguna' as const, activo: true }
      : tipos.find(t => t.id === tipoId) ?? null),
    [tipos, tipoId, verTodos])

  useEffect(() => {
    fetch('/api/entregas/tipos')
      .then(r => (r.ok ? r.json() : []))
      .then((d: Tipo[]) => {
        setTipos(d)
        setTipoId(prev => prev || d[0]?.id || '')
        if (!d.length) setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  const cargar = useCallback(async () => {
    if (!tipoId) return
    setCargando(true); setError(null)
    try {
      const r = await fetch(`/api/entregas?tipo_id=${tipoId}&desde=${desde}&hasta=${hasta}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo cargar')
      setEntregas(d.entregas ?? [])
      setRecientes(d.recientes ?? {})
    } catch (e: any) {
      setError(e.message)
    }
    setCargando(false)
  }, [tipoId, desde, hasta])

  useEffect(() => { cargar() }, [cargar])

  async function borrar(e: Entrega) {
    if (!window.confirm(`¿Quitar la entrega a ${e.nombre}? Queda como si no se le hubiera entregado.`)) return
    const r = await fetch(`/api/entregas?id=${e.id}`, { method: 'DELETE' })
    if (r.ok) cargar()
  }

  const total = entregas.reduce((s, e) => s + e.cantidad, 0)
  const personas = new Set(entregas.map(e => e.user_id)).size
  const sinFirma = entregas.filter(e => !e.tiene_firma).length
  const sinConfirmar = entregas.filter(e => !e.confirmado_at).length

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* ── Encabezado ── */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(36,60,44,0.10)', border: '1px solid rgba(36,60,44,0.25)' }}>
          <Package size={18} style={{ color: '#243C2C' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            Entregas
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Bebida hidratante, EPP, dotación · se registra cuando se entrega
          </p>
        </div>
        {puedeRegistrar && (
          <button onClick={() => setEditandoTipos(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
            <Settings2 size={13} /> Qué se entrega
          </button>
        )}
      </div>

      {tipos.length === 0 && !cargando ? (
        <div className="terra-card p-10 text-center">
          <Package size={30} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>Todavía no hay nada definido</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Primero diga qué se entrega: la bebida hidratante, un respirador, la dotación…
          </p>
          {puedeRegistrar && (
            <button onClick={() => setEditandoTipos(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: '#243C2C', color: '#fff' }}>
              <Plus size={14} /> Definir el primero
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Qué y cuándo se está mirando ── */}
          <div className="terra-card p-4 flex items-end gap-3 flex-wrap">
            <div className="flex-1" style={{ minWidth: 200 }}>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Entregable</label>
              <select value={tipoId} onChange={e => setTipoId(e.target.value)} className={inp} style={estilo}>
                {/* El formato de la empresa es por trabajador y cruza
                    elementos distintos, así que hay que poder verlo todo. */}
                <option value="todos">Todos los entregables</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Desde</label>
              <input type="date" value={desde} max={hasta} onChange={e => setDesde(e.target.value)}
                className={inp} style={{ ...estilo, width: 150 }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Hasta</label>
              <input type="date" value={hasta} min={desde} max={hoyCol()} onChange={e => setHasta(e.target.value)}
                className={inp} style={{ ...estilo, width: 150 }} />
            </div>
            <button onClick={() => { setDesde(hoyCol()); setHasta(hoyCol()) }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
              <CalendarDays size={13} className="inline mr-1" /> Hoy
            </button>
            {puedeRegistrar && !verTodos && (
              <button onClick={() => setEntregando(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
                style={{ background: '#243C2C', color: '#fff' }}>
                <Plus size={14} /> Registrar entrega
              </button>
            )}
          </div>

          {/* ── Lo del periodo ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Dato valor={personas} rotulo="Personas" color="#243C2C" />
            <Dato valor={`${total} ${tipo?.unidad ?? ''}`} rotulo="Entregado" color="#10B981" />
            <Dato valor={entregas.length} rotulo="Registros" color="#60A5FA" />
            <Dato valor={sinConfirmar} rotulo="Sin confirmar" color={sinConfirmar ? '#F59E0B' : '#10B981'}
              nota={sinConfirmar ? 'el trabajador no lo ha aceptado' : 'todas aceptadas'} />
          </div>

          {tipo?.referencia && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Referencia por defecto: <strong style={{ color: 'var(--text-dim)' }}>{tipo.referencia}</strong>
            </p>
          )}

          {/* ── La tabla ── */}
          <div className="terra-card overflow-hidden">
            {cargando ? (
              <div className="flex justify-center py-14">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : error ? (
              <p className="text-sm p-6 text-center" style={{ color: '#EF4444' }}>{error}</p>
            ) : entregas.length === 0 ? (
              <div className="py-14 text-center">
                <Package size={28} className="mx-auto mb-2" style={{ color: 'var(--text-faint)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
                  Sin entregas en estas fechas
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  Si ese día no se aplicó, no tiene por qué haberlas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 700 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Trabajador', 'Cargo', 'Cantidad', 'Referencia', 'Entregado', 'Quién entregó', 'Confirmó', ''].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-bold"
                          style={{ color: 'var(--text-faint)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entregas.map((e, i) => (
                      <tr key={e.id}
                        style={{ borderBottom: '1px solid var(--border)', background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold" style={{ color: 'var(--text)' }}>{e.nombre}</p>
                          <p className="text-[10px] font-mono" style={{ color: 'var(--text-faint)' }}>{e.cedula}</p>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-dim)' }}>{e.cargo || '—'}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: 'var(--text)' }}>
                          {e.cantidad} {e.unidad || tipo?.unidad}
                          {verTodos && e.elemento && (
                            <span className="block text-[10px] font-normal" style={{ color: 'var(--text-dim)' }}>
                              {e.elemento}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-dim)' }}>{e.referencia || '—'}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-dim)' }}>
                          {fecha(e.entregado_at)} · {hora(e.entregado_at)}
                          {!e.tiene_firma && (
                            <span className="ml-1.5 text-[10px] font-bold" style={{ color: '#F59E0B' }}
                              title="Esta persona no tiene firma registrada, así que el soporte sale sin ella">
                              sin firma
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-dim)' }}>
                          {e.entregado_por_nombre || '—'}
                        </td>
                        {/* La otra mitad de la trazabilidad: que él diga que
                            lo recibió, no solo que nosotros lo entregamos. */}
                        <td className="px-3 py-2.5">
                          {e.confirmado_at ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                              title={`Confirmado el ${new Date(e.confirmado_at).toLocaleString('es-CO')}`}>
                              ✓ {fecha(e.confirmado_at)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#B45309' }}
                              title="El trabajador todavía no ha confirmado que lo recibió">
                              sin confirmar
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {/* El formato de la empresa es por trabajador: su
                                hoja con todo lo que ha recibido. */}
                            <button onClick={() => formatoDe(e.user_id, empresa, logo)}
                              title={`Formato AVC-FR06 de ${e.nombre}`}
                              className="p-1.5 rounded-lg" style={{ color: 'var(--text-faint)' }}>
                              <FileText size={13} />
                            </button>
                            {puedeRegistrar && (
                              <button onClick={() => borrar(e)} title="Quitar esta entrega"
                                className="p-1.5 rounded-lg" style={{ color: '#EF4444' }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {entregas.length > 0 && (
            <button onClick={() => descargarSoporte(entregas, tipo!, desde, hasta)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
              <Download size={13} /> Soporte en PDF
            </button>
          )}
        </>
      )}

      {entregando && tipo && !verTodos && (
        <DialogoEntrega
          tipo={tipo}
          recientes={recientes}
          onCerrar={() => setEntregando(false)}
          onListo={() => { setEntregando(false); cargar() }}
        />
      )}

      {editandoTipos && (
        <DialogoTipos
          tipos={tipos}
          onCerrar={() => setEditandoTipos(false)}
          onCambio={(nuevos) => {
            setTipos(nuevos)
            if (!nuevos.some(t => t.id === tipoId)) setTipoId(nuevos[0]?.id ?? '')
          }}
        />
      )}
    </div>
  )
}

function Dato({ valor, rotulo, color, nota }: {
  valor: string | number; rotulo: string; color: string; nota?: string
}) {
  return (
    <div className="terra-card p-3">
      <p className="text-xl font-black" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{valor}</p>
      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-label)' }}>{rotulo}</p>
      {nota && <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{nota}</p>}
    </div>
  )
}

/** Registrar: a quién, cuánto y con qué referencia. */
function DialogoEntrega({ tipo, recientes, onCerrar, onListo }: {
  tipo: Tipo
  recientes: Record<string, string>
  onCerrar: () => void
  onListo: () => void
}) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [cargando, setCargando] = useState(true)
  const [busca, setBusca] = useState('')
  const [fCargo, setFCargo] = useState('')
  const [elegidos, setElegidos] = useState<Set<string>>(new Set())
  const [cantidad, setCantidad] = useState('1')
  const [referencia, setReferencia] = useState(tipo.referencia ?? '')
  const [cuando, setCuando] = useState(hoyCol())
  const [observacion, setObservacion] = useState('')
  // Se recuerda en el navegador: casi siempre entrega la misma persona, y
  // volver a escribir su nombre en cada entrega es el tipo de trabajo que
  // hacía largo el formato de papel.
  const [quienEntrega, setQuienEntrega] = useState('')
  useEffect(() => {
    try { setQuienEntrega(localStorage.getItem('agrosafe.quienEntrega') ?? '') } catch { /* sin memoria, se escribe */ }
  }, [])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then(r => (r.ok ? r.json() : []))
      .then((d: any[]) => {
        setPersonas(d
          .filter(u => u.role === 'worker' && u.active && !u.retired_at)
          .map(u => ({ id: u.id, name: u.name, cedula: u.cedula, cargo: u.cargo, area: u.area })))
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  const cargos = useMemo(
    () => [...new Set(personas.map(p => (p.cargo ?? '').trim()).filter(Boolean))].sort(),
    [personas])

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return personas.filter(p => {
      if (fCargo && (p.cargo ?? '').trim() !== fCargo) return false
      if (!q) return true
      return `${p.name} ${p.cedula ?? ''}`.toLowerCase().includes(q)
    })
  }, [personas, busca, fCargo])

  async function guardar() {
    setGuardando(true); setError(null)
    try {
      const r = await fetch('/api/entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_id: tipo.id,
          user_ids: [...elegidos],
          cantidad: Number(cantidad) || 1,
          referencia: referencia.trim() || null,
          fecha: cuando,
          entregado_por_nombre: quienEntrega.trim() || null,
          observacion: observacion.trim() || null,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo registrar')
      try { localStorage.setItem('agrosafe.quienEntrega', quienEntrega.trim()) } catch { /* da igual */ }
      onListo()
    } catch (e: any) {
      setError(e.message)
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-strong)' }}>Registrar entrega</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{tipo.nombre}</p>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg" style={{ color: 'var(--text-faint)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Cantidad</label>
              <input type="number" min={1} step="any" value={cantidad}
                onChange={e => setCantidad(e.target.value)} className={inp} style={estilo} />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Fecha</label>
              <input type="date" value={cuando} max={hoyCol()}
                onChange={e => setCuando(e.target.value)} className={inp} style={estilo} />
            </div>
          </div>

          {/* El formato pide nombres y apellidos de quien entregó, y la
              cuenta puede ser la del almacén, que es un puesto y no una
              persona. Por eso se escribe aquí. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-faint)' }}>Quién entrega</label>
            <input value={quienEntrega} onChange={e => setQuienEntrega(e.target.value)}
              placeholder="Nombres y apellidos de quien hace la entrega"
              className={inp} style={estilo} />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-faint)' }}>Referencia de lo entregado</label>
            <input value={referencia} onChange={e => setReferencia(e.target.value)}
              placeholder="Marca, presentación o lote. Ej.: Hidratante X 500 ml · lote 2411"
              className={inp} style={estilo} />
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
              Queda escrito en el soporte: dice qué salió ese día, no qué se suele entregar.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-faint)' }}>A quién · {elegidos.size} marcados</label>
              {elegidos.size > 0 && (
                <button onClick={() => setElegidos(new Set())}
                  className="text-[11px] font-semibold" style={{ color: 'var(--text-faint)' }}>Ninguno</button>
              )}
            </div>

            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-faint)' }} />
                <input value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Nombre o cédula" className={inp + ' pl-8'} style={estilo} />
              </div>
              <select value={fCargo} onChange={e => setFCargo(e.target.value)}
                className={inp} style={{ ...estilo, width: 170 }}>
                <option value="">Todos los cargos</option>
                {cargos.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="rounded-xl divide-y overflow-y-auto"
              style={{ border: '1px solid var(--border)', borderColor: 'var(--border)', maxHeight: 240 }}>
              {cargando ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-faint)' }} />
                </div>
              ) : visibles.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: 'var(--text-faint)' }}>
                  Nadie coincide
                </p>
              ) : visibles.map(p => {
                const act = elegidos.has(p.id)
                const yaRecibio = recientes[p.id]
                return (
                  <button key={p.id} type="button"
                    onClick={() => setElegidos(prev => {
                      const s = new Set(prev); s.has(p.id) ? s.delete(p.id) : s.add(p.id); return s
                    })}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left">
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        border: `1px solid ${act ? '#10B981' : 'var(--border-strong)'}`,
                        background: act ? '#10B981' : 'transparent',
                      }}>
                      {act && <Check size={11} color="#fff" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                        {[p.cedula, p.cargo].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {/* Ya recibió dentro del periodo del entregable: no bloquea
                        —puede hacer falta otro— pero que no sea por descuido. */}
                    {yaRecibio && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                        title={`Ya recibió el ${new Date(yaRecibio).toLocaleString('es-CO')}`}>
                        ya recibió
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {tipo.periodicidad !== 'ninguna' && (
              <p className="text-[10px] mt-1.5 flex items-start gap-1" style={{ color: 'var(--text-faint)' }}>
                <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                «Ya recibió» cuenta {PERIODOS[tipo.periodicidad].toLowerCase()} hacia atrás.
                Si hoy no se aplicó, no tiene que entregarle a nadie.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-faint)' }}>Observación (opcional)</label>
            <input value={observacion} onChange={e => setObservacion(e.target.value)}
              placeholder="Ej.: aplicación en el lote 4" className={inp} style={estilo} />
          </div>

          <p className="text-[11px] flex items-start gap-1.5" style={{ color: 'var(--text-faint)' }}>
            <PenLine size={11} className="flex-shrink-0 mt-0.5" />
            El soporte lleva la firma que cada uno tiene registrada, copiada tal como está hoy.
            A quien no la tenga, el soporte le sale sin firma.
          </p>

          {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
        </div>

        <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onCerrar}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando || elegidos.size === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            style={{ background: '#243C2C', color: '#fff' }}>
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Entregar a {elegidos.size}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Qué se entrega: lo define quien entrega. */
function DialogoTipos({ tipos, onCerrar, onCambio }: {
  tipos: Tipo[]
  onCerrar: () => void
  onCambio: (t: Tipo[]) => void
}) {
  const [lista, setLista] = useState<Tipo[]>(tipos)
  const [nuevo, setNuevo] = useState({ nombre: '', referencia: '', unidad: 'unidad', periodicidad: 'ninguna' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aplicar = (t: Tipo[]) => { setLista(t); onCambio(t) }

  async function crear() {
    if (!nuevo.nombre.trim()) return
    setGuardando(true); setError(null)
    try {
      const r = await fetch('/api/entregas/tipos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevo),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo crear')
      aplicar([...lista, d])
      setNuevo({ nombre: '', referencia: '', unidad: 'unidad', periodicidad: 'ninguna' })
    } catch (e: any) { setError(e.message) }
    setGuardando(false)
  }

  async function cambiar(t: Tipo, cambios: Partial<Tipo>) {
    const r = await fetch('/api/entregas/tipos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, ...cambios }),
    })
    if (!r.ok) return
    const d = await r.json()
    aplicar(lista.map(x => (x.id === t.id ? d : x)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-strong)' }}>Qué se entrega</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              La periodicidad solo sirve para avisarle a quién le falta; no obliga a nada.
            </p>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg" style={{ color: 'var(--text-faint)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {lista.map(t => (
            <div key={t.id} className="rounded-xl p-3 space-y-2"
              style={{ border: '1px solid var(--border)', opacity: t.activo ? 1 : 0.55 }}>
              <div className="flex items-center gap-2">
                <input defaultValue={t.nombre}
                  onBlur={e => e.target.value.trim() && e.target.value !== t.nombre && cambiar(t, { nombre: e.target.value })}
                  className={inp} style={estilo} />
                <button onClick={() => cambiar(t, { activo: !t.activo })}
                  className="text-[11px] font-semibold px-2.5 py-2 rounded-lg whitespace-nowrap"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  {t.activo ? 'Archivar' : 'Reactivar'}
                </button>
              </div>
              <input defaultValue={t.referencia ?? ''} placeholder="Referencia por defecto (marca, presentación, lote)"
                onBlur={e => e.target.value !== (t.referencia ?? '') && cambiar(t, { referencia: e.target.value })}
                className={inp} style={estilo} />
              <div className="grid grid-cols-2 gap-2">
                <input defaultValue={t.unidad} placeholder="sobre, par, unidad…"
                  onBlur={e => e.target.value.trim() && e.target.value !== t.unidad && cambiar(t, { unidad: e.target.value })}
                  className={inp} style={estilo} />
                <select value={t.periodicidad} onChange={e => cambiar(t, { periodicidad: e.target.value as Tipo['periodicidad'] })}
                  className={inp} style={estilo}>
                  {Object.entries(PERIODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          ))}

          <div className="rounded-xl p-3 space-y-2" style={{ border: '1px dashed var(--border-strong)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Agregar
            </p>
            <input value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
              placeholder="Ej.: Respirador media cara" className={inp} style={estilo} />
            <input value={nuevo.referencia} onChange={e => setNuevo({ ...nuevo, referencia: e.target.value })}
              placeholder="Referencia por defecto (opcional)" className={inp} style={estilo} />
            <div className="grid grid-cols-2 gap-2">
              <input value={nuevo.unidad} onChange={e => setNuevo({ ...nuevo, unidad: e.target.value })}
                placeholder="unidad" className={inp} style={estilo} />
              <select value={nuevo.periodicidad} onChange={e => setNuevo({ ...nuevo, periodicidad: e.target.value })}
                className={inp} style={estilo}>
                {Object.entries(PERIODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button onClick={crear} disabled={guardando || !nuevo.nombre.trim()}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
              style={{ background: '#243C2C', color: '#fff' }}>
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar
            </button>
          </div>

          {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
        </div>

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onCerrar} className="w-full px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

/** El formato AVC-FR06 de una persona: todo lo que ha recibido. */
async function formatoDe(userId: string, empresa: string, logo: string | null) {
  try {
    const r = await fetch(`/api/entregas/trabajador?user_id=${userId}`)
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'No se pudo armar el formato')
    const { exportarFR06 } = await import('./export-fr06')
    await exportarFR06(d.trabajador, d.entregas, empresa, logo)
  } catch (e: any) {
    alert(e.message)
  }
}

async function descargarSoporte(entregas: Entrega[], tipo: Tipo, desde: string, hasta: string) {
  const { exportarEntregasPDF } = await import('./export-pdf')
  await exportarEntregasPDF(entregas, tipo, desde, hasta)
}
