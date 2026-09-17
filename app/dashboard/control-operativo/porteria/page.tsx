'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LogIn, Search, CheckCircle2, XCircle,
  Users, ArrowLeft, RefreshCw, DoorOpen, MapPin, ChevronRight
} from 'lucide-react'

interface Worker {
  id: string
  name: string
  cedula: string
  cargo: string | null
  area_id: string | null
  active: boolean
  area_name?: string
  area_color?: string
}

interface Area { id: string; name: string; color: string }
interface Gatehouse { id: string; name: string; location: string | null; is_active: boolean }

type WorkerStatus = 'can_enter' | 'blocked' | 'already_inside'

const AVATAR_COLORS = ['#06B6D4','#0891B2','#6BA644','#10B981','#F59E0B','#8595AD']
function avatarColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase()
}

// ── Sede selector (landing) ────────────────────────────────────────
function SedeSelectorView({ gatehouses, loading }: { gatehouses: Gatehouse[]; loading: boolean }) {
  return (
    <div className="p-6 w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>Portería</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          Selecciona una sede para registrar ingresos (vista del personal de seguridad).
        </p>
      </div>

      <div className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-label)' }}>
            Sedes disponibles
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : gatehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <DoorOpen size={32} style={{ color: 'var(--text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No hay sedes configuradas</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {gatehouses.map(g => (
              <Link
                key={g.id}
                href={`/dashboard/control-operativo/porteria?sede=${g.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors group"
                style={{ color: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--primary-dim)' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>{g.name}</div>
                  {g.location && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{g.location}</div>
                  )}
                </div>
                <span className="text-sm font-semibold flex items-center gap-1 flex-shrink-0"
                  style={{ color: 'var(--primary)' }}>
                  Ver portería <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Portería operativa (con sede seleccionada) ──────────────────────
function PorteriaOperativaView({ gateId, gateName }: { gateId: string; gateName: string }) {
  const [workers, setWorkers]     = useState<Worker[]>([])
  const [areas, setAreas]         = useState<Area[]>([])
  const [insideIds, setInsideIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterArea, setFilterArea]     = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | 'can_enter' | 'blocked' | 'already_inside'>('')
  const [registering, setRegistering]   = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [cedula, setCedula] = useState('')
  const cedulaRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function loadInsideIds() {
    const res = await fetch(`/api/access-logs/inside?gatehouse_id=${gateId}`)
    if (res.ok) {
      const data = await res.json()
      setInsideIds(new Set(data.map((l: any) => l.user.id)))
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [wRes, aRes] = await Promise.all([fetch('/api/users'), fetch('/api/areas')])
      const wData: any[] = wRes.ok ? await wRes.json() : []
      const aData: Area[] = aRes.ok ? await aRes.json() : []
      const aMap: Record<string, Area> = {}
      for (const a of aData) aMap[a.id] = a
      setAreas(aData)
      setWorkers(wData.map((w: any) => ({
        ...w,
        area_name: w.area_id ? aMap[w.area_id]?.name : null,
        area_color: w.area_id ? aMap[w.area_id]?.color : null,
      })))
      await loadInsideIds()
      setLoading(false)
    }
    init()
  }, [gateId])

  function getStatus(w: Worker): WorkerStatus {
    if (!w.active) return 'blocked'
    if (insideIds.has(w.id)) return 'already_inside'
    return 'can_enter'
  }

  async function registerEntry(worker: Worker) {
    setRegistering(worker.id)
    const res = await fetch('/api/access-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: worker.id, area_id: worker.area_id, gatehouse_id: gateId }),
    })
    if (res.ok) {
      showToast(`✓ Ingreso registrado: ${worker.name}`, 'ok')
      await loadInsideIds()
    } else {
      showToast((await res.json()).error || 'Error al registrar ingreso', 'err')
    }
    setRegistering(null)
  }

  async function verifyCedula() {
    if (!cedula.trim()) return
    const found = workers.find(w => w.cedula === cedula.trim())
    if (!found) { showToast('Cédula no encontrada en el sistema', 'err'); return }
    const st = getStatus(found)
    if (st === 'blocked') { showToast(`${found.name} está bloqueado — verificar estado`, 'err'); return }
    if (st === 'already_inside') { showToast(`${found.name} ya está dentro`, 'err'); return }
    await registerEntry(found)
    setCedula('')
    cedulaRef.current?.focus()
  }

  const filtered = workers.filter(w => {
    if (filterArea && w.area_id !== filterArea) return false
    if (filterStatus && getStatus(w) !== filterStatus) return false
    if (!search) return true
    const q = search.toLowerCase()
    return w.name.toLowerCase().includes(q) || w.cedula.includes(q)
  })

  const canEnterCount = workers.filter(w => getStatus(w) === 'can_enter').length
  const insideCount   = insideIds.size
  const blockedCount  = workers.filter(w => getStatus(w) === 'blocked').length

  return (
    <div className="p-6 w-full space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'ok' ? '#10B981' : '#EF4444', color: '#fff', maxWidth: 360 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/control-operativo/porteria"
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <ArrowLeft size={14} /> Sedes
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>
            Portería · <span style={{ color: 'var(--primary)' }}>{gateName}</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Verifica por cédula o selecciona de la lista</p>
        </div>
        <button onClick={loadInsideIds}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pueden entrar', value: canEnterCount, color: '#10B981' },
          { label: 'Ya dentro',     value: insideCount,   color: 'var(--primary)' },
          { label: 'Bloqueados',    value: blockedCount,  color: '#EF4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-label)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Búsqueda por cédula */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-strong)' }}>
          Verificar ingreso por cédula
        </label>
        <div className="flex gap-2">
          <input ref={cedulaRef} type="text" value={cedula}
            onChange={e => setCedula(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyCedula()}
            placeholder="Escribe o escanea la cédula y presiona Enter…"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none font-mono"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <button onClick={verifyCedula}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            <LogIn size={15} /> Verificar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar trabajador…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="">Todas las áreas</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="">Todos los estados</option>
          <option value="can_enter">Puede entrar</option>
          <option value="already_inside">Ya dentro</option>
          <option value="blocked">Bloqueado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>
            Trabajadores autorizados · {filtered.length} personas
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Users size={32} style={{ color: 'var(--text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Sin resultados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="terra-table w-full">
              <colgroup>
                <col style={{ width: '30%' }} /><col style={{ width: 120 }} />
                <col style={{ width: 150 }} /><col style={{ width: 120 }} /><col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Trabajador</th>
                  <th className="px-4 py-3 text-left">Cédula</th>
                  <th className="px-4 py-3 text-left">Área</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => {
                  const st = getStatus(w)
                  return (
                    <tr key={w.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                            style={{ background: avatarColor(w.id) }}>
                            {initials(w.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{w.name}</div>
                            {w.cargo && <div className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>{w.cargo}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>{w.cedula || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {w.area_name
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded"
                              style={{ background: `${w.area_color}18`, color: w.area_color || 'var(--primary)' }}>
                              {w.area_name}
                            </span>
                          : <span style={{ color: 'var(--text-faint)' }}>—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {st === 'can_enter'     && <span className="badge-success text-[11px] flex items-center gap-1 w-fit"><CheckCircle2 size={11} /> Puede entrar</span>}
                        {st === 'already_inside'&& <span className="badge-info text-[11px] flex items-center gap-1 w-fit"><LogIn size={11} /> Ya dentro</span>}
                        {st === 'blocked'       && <span className="badge-danger text-[11px] flex items-center gap-1 w-fit"><XCircle size={11} /> Bloqueado</span>}
                      </td>
                      <td className="px-4 py-3">
                        {st === 'can_enter' ? (
                          <button onClick={() => registerEntry(w)} disabled={registering === w.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60"
                            style={{ background: 'var(--primary)', color: '#fff' }}>
                            {registering === w.id ? <RefreshCw size={12} className="animate-spin" /> : <LogIn size={12} />}
                            Ingresar
                          </button>
                        ) : <span className="text-xs" style={{ color: 'var(--text-faint)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Root page (switches between selector y operativa) ──────────────
function PorteriaPageInner() {
  const searchParams = useSearchParams()
  const sedeId = searchParams.get('sede')

  const [gatehouses, setGatehouses] = useState<Gatehouse[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetch('/api/gatehouses')
      .then(r => r.ok ? r.json() : [])
      .then((data: Gatehouse[]) => {
        setGatehouses(data.filter(g => g.is_active))
        setLoading(false)
      })
  }, [])

  if (sedeId) {
    const gate = gatehouses.find(g => g.id === sedeId)
    const name = gate?.name ?? 'Sede'
    return <PorteriaOperativaView gateId={sedeId} gateName={name} />
  }

  return <SedeSelectorView gatehouses={gatehouses} loading={loading} />
}

export default function PorteriaPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    }>
      <PorteriaPageInner />
    </Suspense>
  )
}
