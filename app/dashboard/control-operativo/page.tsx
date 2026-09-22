'use client'

import { useState, useCallback } from 'react'
import { useConsulta } from '@/lib/useConsulta'
import { useSession } from 'next-auth/react'
import { tienePermiso } from '@/lib/permisos'
import Link from 'next/link'
import {
  ArrowLeftRight, Users, LogIn, LogOut, Building2,
  Search, Filter, RefreshCw,
  CheckCircle2, FileText, Table2, DoorOpen
} from 'lucide-react'

interface AccessLog {
  id: string
  entry_time: string
  exit_time: string | null
  notes: string | null
  auto_exit: boolean | null
  auto_exit_reason: string | null
  user: { id: string; name: string; cedula: string; cargo: string | null; area_id: string | null }
  area: { id: string; name: string; color: string } | null
  gatehouse: { id: string; name: string; location: string | null } | null
  registered_by_user: { id: string; name: string } | null
  exit_by_user: { id: string; name: string } | null
}

interface Area { id: string; name: string; color: string }
interface Gatehouse { id: string; name: string; is_active?: boolean }

type Period = 'day' | 'week' | 'range'
type Estado = 'all' | 'inside' | 'exited'

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** 24h para los reportes: cabe en columnas estrechas sin recortarse. */
function fmtTime24(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function motivoSalida(reason: string | null) {
  if (reason === 'ingreso_otra_porteria') return 'Cerrada automáticamente: la persona ingresó por otra portería'
  if (reason === 'fin_jornada') return 'Cerrada automáticamente al terminar la jornada'
  if (reason === 'normalizacion_duplicados') return 'Cerrada al normalizar ingresos duplicados'
  return 'Salida registrada automáticamente por el sistema'
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
  return name.trim().split(/\s+/).slice(0,2).map(p => p[0]).join('').toUpperCase()
}

/** Lunes..domingo (inclusive) de la semana que contiene `isoDate`. */
function weekBounds(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  const dow = base.getUTCDay()
  const monday = new Date(base)
  monday.setUTCDate(base.getUTCDate() + (dow === 0 ? -6 : 1 - dow))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { from: monday.toISOString().split('T')[0], to: sunday.toISOString().split('T')[0] }
}

export default function ControlOperativoPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.role
  // Se decide por permiso, no por rol: si al portero se le marcó "Exportar
  // reportes" en Configuración, la casilla debe servir de verdad.
  const puedeExportar = tienePermiso(rol, (session?.user as any)?.permissions, 'accesos.exportar')
  const today = new Date().toISOString().split('T')[0]

  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const [period, setPeriod] = useState<Period>('day')
  const [selectedDate, setSelectedDate] = useState(today)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterGate, setFilterGate] = useState('')
  const [filterEstado, setFilterEstado] = useState<Estado>('all')

  /** Ventana de consulta efectiva, según el periodo elegido. */
  const resolveRange = useCallback(() => {
    if (period === 'day')  return { from: selectedDate, to: selectedDate }
    if (period === 'week') return weekBounds(selectedDate)
    return { from: dateFrom || today, to: dateTo || today }
  }, [period, selectedDate, dateFrom, dateTo, today])

  // La url resume todo el contexto de la consulta (fechas y porteria/area). Al
  // cambiar, la lista se vacia y la peticion anterior se aborta, asi que nunca
  // se ven movimientos de otra porteria mientras llegan los nuevos.
  const urlMovimientos = (() => {
    const { from, to } = resolveRange()
    // Siempre 'range': asi la API usa las fechas explicitas y nunca asume "hoy".
    const params = new URLSearchParams({ period: 'range', from, to })
    if (filterArea) params.set('area_id', filterArea)
    if (filterGate) params.set('gatehouse_id', filterGate)
    return `/api/access-logs?${params}`
  })()
  const movimientos = useConsulta<AccessLog[]>(urlMovimientos, [])
  const logs: AccessLog[] = Array.isArray(movimientos.datos) ? movimientos.datos : []
  const loading = movimientos.cargando
  const error = movimientos.error
  const load = movimientos.recargar

  const areasQ = useConsulta<Area[]>('/api/areas', [])
  const porteriasQ = useConsulta<Gatehouse[]>('/api/gatehouses', [])
  const areas: Area[] = Array.isArray(areasQ.datos) ? areasQ.datos : []
  const gatehouses: Gatehouse[] = (Array.isArray(porteriasQ.datos) ? porteriasQ.datos : []).filter(g => g.is_active !== false)

  const filtered = logs.filter(l => {
    if (filterEstado === 'inside' && l.exit_time) return false
    if (filterEstado === 'exited' && !l.exit_time) return false
    if (!search) return true
    const q = search.toLowerCase()
    return l.user?.name?.toLowerCase().includes(q) || (l.user?.cedula || '').includes(q)
  })

  const inside = filtered.filter(l => !l.exit_time)
  const exited = filtered.filter(l => !!l.exit_time)
  const uniqueUsers = new Set(filtered.map(l => l.user?.id)).size
  const uniqueAreas = new Set(filtered.filter(l => l.area).map(l => l.area!.id)).size

  const areaCount: Record<string, { name: string; color: string; count: number }> = {}
  for (const l of filtered) {
    const k = l.area?.id || '__sin-area__'
    if (!areaCount[k]) areaCount[k] = { name: l.area?.name || 'Sin área', color: l.area?.color || '#8595AD', count: 0 }
    areaCount[k].count++
  }
  const areaRanking = Object.values(areaCount).sort((a, b) => b.count - a.count).slice(0, 8)

  /** Texto del rango + filtros activos, para encabezar los reportes. */
  function reportMeta() {
    const { from, to } = resolveRange()
    const rango = from === to ? from : `${from} → ${to}`
    const chips: string[] = []
    if (filterGate)   chips.push(`Portería: ${gatehouses.find(g => g.id === filterGate)?.name || '—'}`)
    if (filterArea)   chips.push(`Área: ${areas.find(a => a.id === filterArea)?.name || '—'}`)
    if (filterEstado !== 'all') chips.push(`Estado: ${filterEstado === 'inside' ? 'Dentro' : 'Salió'}`)
    if (search)       chips.push(`Búsqueda: "${search}"`)
    return { rango, filtros: chips.length ? chips.join(' · ') : 'Sin filtros adicionales' }
  }

  /** Filas del reporte: exactamente lo que se ve en pantalla, en el mismo orden. */
  function reportRows() {
    return filtered.map(l => [
      fmtDay(l.entry_time),
      fmtTime24(l.entry_time),
      fmtTime24(l.exit_time),
      !l.exit_time ? 'Dentro' : l.auto_exit ? 'Salió (auto)' : 'Salió',
      l.user?.name || '—',
      l.user?.cedula || '—',
      l.user?.cargo || '—',
      l.area?.name || 'Sin área',
      l.gatehouse?.name || '—',
    ])
  }

  const REPORT_HEAD = ['F. ingreso','Entrada','Salida','Estado','Trabajador','Doc','Cargo','Área','Portería']

  async function exportPDF() {
    if (!filtered.length) return
    setExporting('pdf')
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const { rango, filtros } = reportMeta()

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()

      autoTable(doc, {
        head: [REPORT_HEAD],
        body: reportRows(),
        startY: 26,
        margin: { top: 26, left: 10, right: 10, bottom: 12 },
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'ellipsize', valign: 'middle' },
        headStyles: { fillColor: [15, 42, 32], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [244, 247, 245] },
        columnStyles: {
          0: { cellWidth: 20 }, 1: { cellWidth: 13 }, 2: { cellWidth: 13 },
          3: { cellWidth: 22 }, 4: { cellWidth: 59 }, 5: { cellWidth: 22 },
          6: { cellWidth: 38 }, 7: { cellWidth: 28 }, 8: { cellWidth: 28 },
        },
        didDrawPage: () => {
          doc.setFontSize(13); doc.setTextColor(15, 42, 32); doc.setFont('helvetica', 'bold')
          doc.text('Registro Diario de Ingresos', 10, 13)
          doc.setFontSize(8); doc.setTextColor(90); doc.setFont('helvetica', 'normal')
          doc.text(`Rango: ${rango}  ·  ${filtered.length} registros  ·  ${filtros}`, 10, 19)
          const page = doc.getNumberOfPages()
          doc.setFontSize(7); doc.setTextColor(130)
          doc.text(`Generado ${new Date().toLocaleString('es-CO')}`, 10, pageH - 5)
          doc.text(`Página ${page}`, pageW - 10, pageH - 5, { align: 'right' })
        },
      })

      doc.save(`registro_ingresos_${rango.replace(/[^\d]/g, '')}.pdf`)
    } finally {
      setExporting(null)
    }
  }

  async function exportExcel() {
    if (!filtered.length) return
    setExporting('excel')
    try {
      const XLSX = await import('xlsx')
      const { rango, filtros } = reportMeta()
      const ws = XLSX.utils.aoa_to_sheet([
        ['Registro Diario de Ingresos'],
        [`Rango: ${rango}`, `${filtered.length} registros`, filtros],
        [],
        REPORT_HEAD,
        ...reportRows(),
      ])
      ws['!cols'] = [{ wch: 12 },{ wch: 10 },{ wch: 10 },{ wch: 9 },{ wch: 34 },{ wch: 14 },{ wch: 22 },{ wch: 18 },{ wch: 20 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Ingresos')
      XLSX.writeFile(wb, `registro_ingresos_${rango.replace(/[^\d]/g, '')}.xlsx`)
    } finally {
      setExporting(null)
    }
  }

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide mb-1.5'

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>Registro Diario de Ingresos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>Personas que ingresaron y salieron de las instalaciones</p>
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

      {/* Filtros */}
      <div className="rounded-xl p-4 flex flex-wrap gap-3 items-end"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <div>
          <label className={labelCls} style={{ color: 'var(--text-label)' }}>Periodo</label>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['day','week','range'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: period === p ? 'var(--primary)' : 'var(--bg)', color: period === p ? '#fff' : 'var(--text-dim)' }}>
                {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Rango'}
              </button>
            ))}
          </div>
        </div>

        {period === 'day' && (
          <div>
            <label className={labelCls} style={{ color: 'var(--text-label)' }}>Fecha</label>
            <input type="date" value={selectedDate} max={today} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
        )}

        {period === 'week' && (
          <div>
            <label className={labelCls} style={{ color: 'var(--text-label)' }}>Semana de</label>
            <input type="date" value={selectedDate} max={today} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
              {weekBounds(selectedDate).from} → {weekBounds(selectedDate).to}
            </p>
          </div>
        )}

        {period === 'range' && (
          <>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-label)' }}>Desde</label>
              <input type="date" value={dateFrom} max={dateTo || today} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-label)' }}>Hasta</label>
              <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </>
        )}

        <div className="flex-1 min-w-48">
          <label className={labelCls} style={{ color: 'var(--text-label)' }}>Trabajador / Documento</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o cédula…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--text-label)' }}>Portería</label>
          <select value={filterGate} onChange={e => setFilterGate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
            <option value="">Todas</option>
            {gatehouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--text-label)' }}>Área</label>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
            <option value="">Todas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--text-label)' }}>Estado</label>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as Estado)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
            <option value="all">Todos</option>
            <option value="inside">Dentro</option>
            <option value="exited">Salió</option>
          </select>
        </div>

        <button onClick={load}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          <Filter size={14} /> Consultar
        </button>
        <button onClick={() => {
            setSearch(''); setFilterArea(''); setFilterGate(''); setFilterEstado('all')
            setPeriod('day'); setSelectedDate(today); setDateFrom(today); setDateTo(today)
          }}
          className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--text-dim)', border: '1px solid var(--border)', background: 'var(--bg)' }}>
          Limpiar
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444' }}>
          No fue posible cargar los registros: {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Personas únicas',    value: uniqueUsers,     icon: Users,          color: 'var(--primary)' },
          { label: 'Actualmente dentro', value: inside.length,   icon: LogIn,          color: '#10B981' },
          { label: 'Ya salieron',        value: exited.length,   icon: LogOut,         color: '#F59E0B' },
          { label: 'Total ingresos',     value: filtered.length, icon: ArrowLeftRight, color: 'var(--primary)' },
          { label: 'Total salidas',      value: exited.length,   icon: CheckCircle2,   color: '#10B981' },
          { label: 'Áreas con ingresos', value: uniqueAreas,     icon: Building2,      color: '#8B5CF6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-label)' }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>{loading ? '—' : value}</span>
          </div>
        ))}
      </div>

      {/* Emergencia + ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#EF4444' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>Personas actualmente dentro</h3>
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
            {inside.length === 0 && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin personas actualmente dentro</p>}
          </div>
        </div>

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
        <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>{filtered.length} registros</span>
          <div className="flex items-center gap-2" hidden={!puedeExportar}>
            <button onClick={exportPDF} disabled={!filtered.length || exporting !== null}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
              <FileText size={13} /> {exporting === 'pdf' ? 'Generando…' : 'PDF'}
            </button>
            <button onClick={exportExcel} disabled={!filtered.length || exporting !== null}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
              <Table2 size={13} /> {exporting === 'excel' ? 'Generando…' : 'Excel'}
            </button>
          </div>
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
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">F. ingreso</th>
                  <th className="px-4 py-3 text-left">Entrada</th>
                  <th className="px-4 py-3 text-left">Salida</th>
                  <th className="px-4 py-3 text-left">Permanencia</th>
                  <th className="px-4 py-3 text-left">Trabajador</th>
                  <th className="px-4 py-3 text-left">Cédula</th>
                  <th className="px-4 py-3 text-left">Área</th>
                  <th className="px-4 py-3 text-left">Portería</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-dim)' }}>{fmtDay(log.entry_time)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{fmtTime(log.entry_time)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm tabular-nums" style={{ color: log.exit_time ? 'var(--text-dim)' : 'var(--text-faint)' }}>{fmtTime(log.exit_time)}</span>
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
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${log.area.color}18`, color: log.area.color }}>{log.area.name}</span>
                        : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {log.gatehouse
                        ? <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
                            <DoorOpen size={12} style={{ color: 'var(--text-faint)' }} />{log.gatehouse.name}
                          </span>
                        : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {!log.exit_time
                        ? <span className="badge-info text-[11px]">Dentro</span>
                        : log.auto_exit
                          ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                              title={motivoSalida(log.auto_exit_reason)}
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.35)' }}>
                              Salida automática
                            </span>
                          : <span className="badge-success text-[11px]">Salió</span>}
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
