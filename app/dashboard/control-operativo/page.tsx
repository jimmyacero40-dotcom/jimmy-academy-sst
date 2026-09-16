'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeftRight, Users, LogIn, LogOut, Building2,
  Calendar, Search, Filter, Download, RefreshCw,
  Clock, CheckCircle2, AlertCircle, ChevronDown
} from 'lucide-react'

interface AccessLog {
  id: string
  entry_time: string
  exit_time: string | null
  notes: string | null
  user: { id: string; name: string; cedula: string; cargo: string | null; area_id: string | null }
  area: { id: string; name: string; color: string } | null
  registered_by_user: { id: string; name: string } | null
  exit_by_user: { id: string; name: string } | null
}

interface Area { id: string; name: string; color: string }

type Period = 'day' | 'week' | 'range'

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function permanencia(entry: string, exit: string | null) {
  const end = exit ? new Date(exit) : new Date()
  const mins = Math.floor((end.getTime() - new Date(entry).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60); const m = mins % 60
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim()
}

const AVATAR_COLORS = ['#06B6D4','#0891B2','#6BA644','#10B981','#F59E0B','#8595AD']
function avatarColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase()
}

export default function ControlOperativoPage() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('day')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ period })
    if (period === 'range') { params.set('from', dateFrom || today); params.set('to', dateTo || today) }
    if (filterArea) params.set('area_id', filterArea)
    const res = await fetch(`/api/access-logs?${params}`)
    if (res.ok) setLogs(await res.json())
    setLoading(false)
  }, [period, dateFrom, dateTo, filterArea, today])

  useEffect(() => { fetch('/api/areas').then(r => r.json()).then(d => setAreas(Array.isArray(d) ? d : [])) }, [])
  useEffect(() => { load() }, [load])

  const filtered = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.user.name.toLowerCase().includes(q) || l.user.cedula.includes(q)
  })

  const inside  = filtered.filter(l => !l.exit_time)
  const exited  = filtered.filter(l => !!l.exit_time)
  const uniqueUsers = new Set(filtered.map(l => l.user.id)).size
  const uniqueAreas = new Set(filtered.filter(l => l.area).map(l => l.area!.id)).size

  // ranking by area
  const areaCount: Record<string, { name: string; color: string; count: number }> = {}
  for (const l of filtered) {
    const k = l.area?.id || '__sin-area__'
    const name = l.area?.name || 'Sin área'
    const color = l.area?.color || '#8595AD'
    if (!areaCount[k]) areaCount[k] = { name, color, count: 0 }
    areaCount[k].count++
  }
  const areaRanking = Object.values(areaCount).sort((a, b) => b.count - a.count).slice(0, 8)

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>
            Registro Diario de Ingresos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
            Personas que ingresaron y salieron de las instalaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/control-operativo/porteria"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <LogIn size={15} /> Registrar Ingreso
          </Link>
          <Link
            href="/dashboard/control-operativo/salida"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <LogOut size={15} /> Registrar Salida
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div
        className="rounded-xl p-4 flex flex-wrap gap-3 items-end"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Periodo */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-label)' }}>Periodo</label>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['day','week','range'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: period === p ? 'var(--primary)' : 'var(--bg)',
                  color: period === p ? '#fff' : 'var(--text-dim)',
                }}
              >
                {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Rango'}
              </button>
            ))}
          </div>
        </div>

        {/* Rango de fechas */}
        {period === 'range' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-label)' }}>Desde</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-label)' }}>Hasta</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
          </>
        )}

        {/* Búsqueda */}
        <div className="flex-1 min-w-48">
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-label)' }}>Trabajador / Documento</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nombre o cédula…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Área */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-label)' }}>Área</label>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <option value="">Todas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <button onClick={load}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          <Filter size={14} /> Consultar
        </button>
        <button onClick={() => { setSearch(''); setFilterArea(''); setPeriod('day'); load() }}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--border)', background: 'var(--bg)' }}>
          Limpiar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Personas únicas',   value: uniqueUsers,         icon: Users,         color: 'var(--primary)' },
          { label: 'Actualmente dentro',value: inside.length,       icon: LogIn,         color: '#10B981' },
          { label: 'Ya salieron',       value: exited.length,       icon: LogOut,        color: '#F59E0B' },
          { label: 'Total ingresos',    value: filtered.length,     icon: ArrowLeftRight,color: 'var(--primary)' },
          { label: 'Total salidas',     value: exited.length,       icon: CheckCircle2,  color: '#10B981' },
          { label: 'Áreas con ingresos',value: uniqueAreas,         icon: Building2,     color: '#8B5CF6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label}
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-label)' }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Bloque emergencia + ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dentro ahora */}
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#EF4444' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>
              Personas actualmente dentro
            </h3>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EF444420', color: '#EF4444' }}>
              {inside.length}
            </span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: 'var(--text-faint)' }}>
            Personas con ingreso sin salida registrada. Útil para evacuación.
          </p>
          <div className="flex flex-wrap gap-2">
            {areaRanking.filter(a => a.name !== 'Sin área').map(a => (
              <div key={a.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: `${a.color}18`, border: `1px solid ${a.color}30`, color: a.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
                {a.name}: {a.count}
              </div>
            ))}
            {inside.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin personas actualmente dentro</p>
            )}
          </div>
        </div>

        {/* Ranking por área */}
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-strong)' }}>Áreas con mayor ingreso</h3>
          {areaRanking.length === 0
            ? <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin datos en el periodo</p>
            : areaRanking.map((a, i) => (
              <div key={a.name} className="flex items-center gap-3 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <span className="w-5 text-xs font-bold text-center" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{a.name}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{a.count}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>
            {filtered.length} registros
          </span>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
            <Download size={13} /> Exportar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ArrowLeftRight size={32} style={{ color: 'var(--text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Sin registros en el periodo seleccionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="terra-table w-full">
              <colgroup>
                <col style={{ width: 90 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 95 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Entrada</th>
                  <th className="px-4 py-3 text-left">Salida</th>
                  <th className="px-4 py-3 text-left">Permanencia</th>
                  <th className="px-4 py-3 text-left">Trabajador</th>
                  <th className="px-4 py-3 text-left">Cédula</th>
                  <th className="px-4 py-3 text-left">Área</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        {fmtTime(log.entry_time)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm tabular-nums" style={{ color: log.exit_time ? 'var(--text-dim)' : 'var(--text-faint)' }}>
                        {fmtTime(log.exit_time)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded"
                        style={{
                          background: log.exit_time ? 'var(--primary-dim)' : 'rgba(16,185,129,0.1)',
                          color: log.exit_time ? 'var(--primary)' : '#10B981'
                        }}>
                        {permanencia(log.entry_time, log.exit_time)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
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
                      {log.exit_time
                        ? <span className="badge-success text-[11px]">Salió</span>
                        : <span className="badge-info text-[11px]">Dentro</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        {log.registered_by_user?.name || '—'}
                      </span>
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
