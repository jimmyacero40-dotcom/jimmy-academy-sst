'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  LogOut, ArrowLeft, RefreshCw, Users, CheckCircle2, Clock, DoorOpen
} from 'lucide-react'

interface InsideLog {
  id: string
  entry_time: string
  user: { id: string; name: string; cedula: string; cargo: string | null; active: boolean }
  area: { id: string; name: string; color: string } | null
  registered_by_user: { id: string; name: string } | null
}

interface Area { id: string; name: string; color: string }
interface Gatehouse { id: string; name: string; is_active: boolean }

const AVATAR_COLORS = ['#06B6D4','#0891B2','#6BA644','#10B981','#F59E0B','#8595AD']
function avatarColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase()
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function permanencia(entry: string) {
  const mins = Math.floor((Date.now() - new Date(entry).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60); const m = mins % 60
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim()
}

export default function SalidaPage() {
  const { data: session } = useSession()
  const esPortero = (session?.user as any)?.role === 'portero'
  const [logs, setLogs]             = useState<InsideLog[]>([])
  const [areas, setAreas]           = useState<Area[]>([])
  const [gatehouses, setGatehouses] = useState<Gatehouse[]>([])
  const [activeGate, setActiveGate] = useState<string>('')
  const [loading, setLoading]       = useState(true)
  const [filterArea, setFilterArea] = useState('')
  const [registering, setRegistering] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterArea)  params.set('area_id', filterArea)
    if (activeGate)  params.set('gatehouse_id', activeGate)
    const res = await fetch(`/api/access-logs/inside?${params}`)
    if (res.ok) setLogs(await res.json())
    setLoading(false)
  }, [filterArea, activeGate])

  useEffect(() => {
    Promise.all([fetch('/api/areas'), fetch('/api/gatehouses')]).then(async ([aRes, ghRes]) => {
      if (aRes.ok)  setAreas(await aRes.json())
      if (ghRes.ok) {
        const ghData: Gatehouse[] = await ghRes.json()
        const active = ghData.filter(g => g.is_active)
        setGatehouses(active)
        if (active.length > 0) setActiveGate(active[0].id)
      }
    })
  }, [])

  useEffect(() => { load() }, [load])

  async function registerExit(log: InsideLog) {
    setRegistering(log.id)
    const res = await fetch(`/api/access-logs/${log.id}`, { method: 'PATCH' })
    if (res.ok) {
      showToast(`✓ Salida registrada: ${log.user.name}`, 'ok')
      setLogs(prev => prev.filter(l => l.id !== log.id))
    } else {
      const err = await res.json()
      showToast(err.error || 'Error al registrar salida', 'err')
    }
    setRegistering(null)
  }

  return (
    <div className="p-6 w-full space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'ok' ? '#10B981' : '#EF4444', color: '#fff', maxWidth: 360 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* El portero vuelve a su portería; el administrador, al registro general. */}
        <Link href={esPortero ? '/dashboard/control-operativo/porteria' : '/dashboard/control-operativo'}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <ArrowLeft size={14} /> Volver
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>Registro de Salida</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Registra la salida de quienes ya ingresaron hoy. Toca Salida y listo.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* KPI */}
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
          <span className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>{logs.length}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
            personas dentro · con ingreso sin salida hoy
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {gatehouses.length > 1 && (
            <select value={activeGate} onChange={e => setActiveGate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm outline-none font-semibold"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              {gatehouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <option value="">Todas las áreas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <CheckCircle2 size={32} style={{ color: '#10B981' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>Todos han registrado su salida</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No hay personas dentro en este momento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="terra-table w-full">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 120 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Trabajador</th>
                  <th className="px-4 py-3 text-left">Cédula</th>
                  <th className="px-4 py-3 text-left">Área</th>
                  <th className="px-4 py-3 text-left">Ingreso</th>
                  <th className="px-4 py-3 text-left">Tiempo</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ background: avatarColor(log.user.id) }}>
                          {initials(log.user.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{log.user.name}</div>
                          {log.user.cargo && <div className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>{log.user.cargo}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>{log.user.cedula || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {log.area
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: `${log.area.color}18`, color: log.area.color }}>
                            {log.area.name}
                          </span>
                        : <span style={{ color: 'var(--text-faint)' }}>—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        {fmtTime(log.entry_time)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: 'var(--primary)' }}>
                        <Clock size={11} /> {permanencia(log.entry_time)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-info text-[11px] flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
                        Dentro
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => registerExit(log)}
                        disabled={registering === log.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                        style={{ background: '#EF4444', color: '#fff' }}>
                        {registering === log.id
                          ? <RefreshCw size={12} className="animate-spin" />
                          : <LogOut size={12} />
                        }
                        Salida
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
