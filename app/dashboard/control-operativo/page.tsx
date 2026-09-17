'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  LogIn, LogOut, Download, RefreshCw, Filter, X,
  Users, Calendar, Building2, CheckCircle2, AlertCircle, FileText
} from 'lucide-react'

interface AccessLog {
  id: string
  entry_time: string
  exit_time: string | null
  user: { id: string; name: string; cedula: string; cargo: string | null }
  area: { id: string; name: string; color: string } | null
  gatehouse: { id: string; name: string } | null
  registered_by_user: { id: string; name: string } | null
}

interface Gatehouse { id: string; name: string; is_active: boolean }
interface Area { id: string; name: string; color: string }

type PeriodType = 'day' | 'week' | 'range'
type StatusFilter = 'all' | 'inside' | 'exited'

export default function ControlOperativoPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'admin' || (session?.user as any)?.role === 'superadmin'

  const [logs, setLogs] = useState<AccessLog[]>([])
  const [gatehouses, setGatehouses] = useState<Gatehouse[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  // Query params
  const [period, setPeriod] = useState<PeriodType>('day')
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  // Filters
  const [filterGate, setFilterGate] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterArea, setFilterArea] = useState('')
  const [searchWorker, setSearchWorker] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()

    // Always pass explicit dates
    if (period === 'day') {
      params.set('from', selectedDate)
      params.set('to', selectedDate)
    } else if (period === 'week') {
      const d = new Date(selectedDate)
      const dayOfWeek = d.getDay()
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(d)
      monday.setDate(d.getDate() + diffToMon)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 7)
      params.set('from', monday.toISOString().split('T')[0])
      params.set('to', sunday.toISOString().split('T')[0])
    } else {
      params.set('from', dateFrom)
      params.set('to', dateTo)
    }

    if (filterGate) params.set('gatehouse_id', filterGate)
    if (filterArea) params.set('area_id', filterArea)

    const res = await fetch(`/api/access-logs?${params.toString()}`)
    if (res.ok) setLogs(await res.json())
    setLoading(false)
  }, [period, selectedDate, dateFrom, dateTo, filterGate, filterArea])

  useEffect(() => {
    Promise.all([fetch('/api/gatehouses'), fetch('/api/areas')]).then(async ([ghRes, aRes]) => {
      if (ghRes.ok) {
        const gh: Gatehouse[] = await ghRes.json()
        setGatehouses(gh.filter(g => g.is_active))
      }
      if (aRes.ok) setAreas(await aRes.json())
    })
  }, [])

  useEffect(() => { load() }, [load])

  // Filter logs
  const filtered = logs.filter(l => {
    if (filterStatus === 'inside' && l.exit_time) return false
    if (filterStatus === 'exited' && !l.exit_time) return false
    if (searchWorker) {
      const q = searchWorker.toLowerCase()
      if (!l.user.name.toLowerCase().includes(q) && !l.user.cedula.includes(q)) return false
    }
    return true
  })

  // Indicators
  const uniqueWorkers = new Set(filtered.map(l => l.user.id)).size
  const inside = filtered.filter(l => !l.exit_time).length
  const exited = filtered.filter(l => !!l.exit_time).length
  const totalEntries = filtered.length

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(format)
    const params = new URLSearchParams()
    if (period === 'day') {
      params.set('from', selectedDate)
      params.set('to', selectedDate)
    } else if (period === 'week') {
      const d = new Date(selectedDate)
      const dayOfWeek = d.getDay()
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(d)
      monday.setDate(d.getDate() + diffToMon)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 7)
      params.set('from', monday.toISOString().split('T')[0])
      params.set('to', sunday.toISOString().split('T')[0])
    } else {
      params.set('from', dateFrom)
      params.set('to', dateTo)
    }
    if (filterGate) params.set('gatehouse_id', filterGate)
    if (filterArea) params.set('area_id', filterArea)

    const url = `/api/export/access-logs?format=${format}&${params.toString()}`
    window.location.href = url
    setExporting(null)
  }

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>Registro de Ingresos y Salidas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>Consulta y administra movimientos de personal</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/control-operativo/porteria"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            <LogIn size={15} /> Registrar Ingreso
          </Link>
          <Link href="/dashboard/control-operativo/salida"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <LogOut size={15} /> Registrar Salida
          </Link>
        </div>
      </div>

      {/* Período y Filtros */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Período */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-label)' }}>Período</label>
          <div className="flex rounded-lg overflow-hidden mb-3" style={{ border: '1px solid var(--border)', width: 'fit-content' }}>
            {(['day', 'week', 'range'] as PeriodType[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-4 py-2 text-sm font-semibold transition-colors"
                style={{ background: period === p ? 'var(--primary)' : 'var(--bg)', color: period === p ? '#fff' : 'var(--text-dim)' }}>
                {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Rango'}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {period === 'day' && (
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Fecha</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
            )}
            {period === 'week' && (
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Semana que contiene</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
            )}
            {period === 'range' && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Desde</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Hasta</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Trabajador / Cédula</label>
            <input type="text" value={searchWorker} onChange={e => setSearchWorker(e.target.value)}
              placeholder="Buscar…"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Portería</label>
            <select value={filterGate} onChange={e => setFilterGate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option value="">Todas</option>
              {gatehouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Área</label>
            <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option value="">Todas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-label)' }}>Estado</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option value="all">Todos</option>
              <option value="inside">Dentro</option>
              <option value="exited">Salió</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={load} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              <Filter size={14} /> Consultar
            </button>
            <button onClick={() => { setSearchWorker(''); setFilterGate(''); setFilterArea(''); setFilterStatus('all'); setPeriod('day'); setSelectedDate(today) }}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Personas únicas', value: uniqueWorkers, icon: Users, color: 'var(--primary)' },
          { label: 'Dentro ahora', value: inside, icon: LogIn, color: '#10B981' },
          { label: 'Salieron', value: exited, icon: LogOut, color: '#F59E0B' },
          { label: 'Total registros', value: totalEntries, icon: FileText, color: 'var(--primary)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-label)' }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>
            {filtered.length} movimientos
          </span>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => handleExport('pdf')} disabled={exporting !== null}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                <Download size={13} /> {exporting === 'pdf' ? 'Generando...' : 'PDF'}
              </button>
              <button onClick={() => handleExport('excel')} disabled={exporting !== null}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                <Download size={13} /> {exporting === 'excel' ? 'Generando...' : 'Excel'}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <AlertCircle size={32} style={{ color: 'var(--text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Sin registros para este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="terra-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">N°</th>
                  <th className="px-4 py-3 text-left">Trabajador</th>
                  <th className="px-4 py-3 text-left">Cédula</th>
                  <th className="px-4 py-3 text-left">Portería</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Ingreso</th>
                  <th className="px-4 py-3 text-left">Salida</th>
                  <th className="px-4 py-3 text-left">Duración</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const entry = new Date(log.entry_time)
                  const exit = log.exit_time ? new Date(log.exit_time) : null
                  const duration = exit ? Math.floor((exit.getTime() - entry.getTime()) / 60000) : 0
                  const durationStr = duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`

                  return (
                    <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold">{i + 1}</td>
                      <td className="px-4 py-3">{log.user.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.user.cedula || '—'}</td>
                      <td className="px-4 py-3 text-xs">{log.gatehouse?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{entry.toLocaleDateString('es-CO')}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{entry.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-xs">{exit ? exit.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{log.exit_time ? durationStr : '—'}</td>
                      <td className="px-4 py-3">
                        {log.exit_time
                          ? <span className="badge-success text-[10px]">Salió</span>
                          : <span className="badge-info text-[10px]">Dentro</span>
                        }
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
