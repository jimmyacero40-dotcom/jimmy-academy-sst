'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart2, Download, Users, Award, BookOpen, AlertCircle,
  FileSpreadsheet, FileText, TrendingUp, CheckCircle, Clock,
  XCircle, RefreshCw, ChevronDown, ChevronUp, Shield
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  users: number
  activeUsers: number
  enrollments: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  avgScore: number | null
  compliance: number
  certificates: number
  expiredCerts: number
  byArea: { area: string; total: number; completed: number; pct: number }[]
  monthly: { month: string; completed: number; enrolled: number }[]
}

interface WorkerRow {
  id: string; name: string; email: string; cedula: string; area: string
  role: string; status: string; total: number; completed: number
  compliance: number; avgScore: number | null
}

interface TrainingRow {
  id: string; title: string; category: string; duration: string
  status: string; valid_until: string; enrolled: number; completed: number
  passRate: number; avgScore: number | null
}

type ReportTab = 'summary' | 'workers' | 'trainings'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(val: number) {
  return val >= 80 ? '#10B981' : val >= 50 ? '#F59E0B' : '#EF4444'
}

function scoreColor(s: number | null) {
  if (s == null) return 'var(--text-faint)'
  return s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444'
}

async function exportXlsx(data: any[], filename: string, sheetName: string) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

async function exportPdf(title: string, headers: string[], rows: (string | number)[][], filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const colW = (pageW - margin * 2) / headers.length

  // Header
  doc.setFillColor(13, 22, 41)
  doc.rect(0, 0, pageW, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Jimmy Academy — SG-SST', margin, 13)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(title, pageW - margin, 13, { align: 'right' })

  // Date
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(8)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' })}`, margin, 26)

  // Table header
  let y = 32
  doc.setFillColor(30, 41, 59)
  doc.rect(margin, y, pageW - margin * 2, 8, 'F')
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  headers.forEach((h, i) => doc.text(h, margin + i * colW + 2, y + 5.5))

  y += 8
  doc.setFont('helvetica', 'normal')

  rows.forEach((row, ri) => {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = 20
    }
    if (ri % 2 === 0) {
      doc.setFillColor(15, 23, 42)
      doc.rect(margin, y, pageW - margin * 2, 7, 'F')
    }
    doc.setTextColor(203, 213, 225)
    row.forEach((cell, i) => {
      const text = String(cell ?? '—').substring(0, 28)
      doc.text(text, margin + i * colW + 2, y + 5)
    })
    y += 7
  })

  doc.save(filename)
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBar({ data }: { data: { month: string; completed: number; enrolled: number }[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.enrolled, 1)))
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: 64 }}>
            <div className="w-full rounded-sm" style={{ height: `${(d.enrolled / maxVal) * 100}%`, background: 'rgba(59,130,246,0.25)' }} />
            {d.completed > 0 && (
              <div className="w-full rounded-sm absolute" style={{ height: `${(d.completed / maxVal) * 100}%`, background: '#10B981', position: 'relative' }} />
            )}
          </div>
          <span className="text-[10px] text-[var(--text-faint)]">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('summary')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [workers, setWorkers] = useState<WorkerRow[]>([])
  const [trainings, setTrainings] = useState<TrainingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null)
  const [sortCol, setSortCol] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const loadSummary = useCallback(async () => {
    const res = await fetch('/api/reports?type=summary')
    const data = await res.json()
    setSummary(data)
  }, [])

  const loadWorkers = useCallback(async () => {
    const res = await fetch('/api/reports?type=workers')
    const data = await res.json()
    setWorkers(Array.isArray(data) ? data : [])
  }, [])

  const loadTrainings = useCallback(async () => {
    const res = await fetch('/api/reports?type=trainings')
    const data = await res.json()
    setTrainings(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadSummary(), loadWorkers(), loadTrainings()]).finally(() => setLoading(false))
  }, [loadSummary, loadWorkers, loadTrainings])

  const sort = (col: string, arr: any[]) => {
    const dir = sortCol === col && sortDir === 'desc' ? 'asc' : 'desc'
    setSortCol(col); setSortDir(dir)
    return [...arr].sort((a, b) => {
      const av = a[col] ?? 0, bv = b[col] ?? 0
      return dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
  }

  const SortIcon = ({ col }: { col: string }) => sortCol === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null

  const handleExportXlsx = async () => {
    setExporting('xlsx')
    try {
      if (tab === 'workers') {
        await exportXlsx(workers.map(w => ({
          Nombre: w.name, Cédula: w.cedula, Email: w.email, Área: w.area,
          Rol: w.role, Estado: w.status, Matriculas: w.total,
          Completados: w.completed, 'Cumplimiento %': w.compliance,
          'Promedio score': w.avgScore ?? '',
        })), 'reporte_trabajadores.xlsx', 'Trabajadores')
      } else if (tab === 'trainings') {
        await exportXlsx(trainings.map(t => ({
          Título: t.title, Categoría: t.category, Duración: t.duration,
          Estado: t.status, 'Vence': t.valid_until, Matriculados: t.enrolled,
          Completados: t.completed, 'Tasa aprobación %': t.passRate,
          'Promedio score': t.avgScore ?? '',
        })), 'reporte_capacitaciones.xlsx', 'Capacitaciones')
      } else {
        const rows = summary ? [{
          'Total usuarios': summary.users, 'Activos': summary.activeUsers,
          'Total matrículas': summary.enrollments, 'Completados': summary.completed,
          'En curso': summary.inProgress, 'Pendientes': summary.pending,
          'Vencidos': summary.overdue, 'Cumplimiento %': summary.compliance,
          'Promedio score': summary.avgScore ?? '',
          'Certificados': summary.certificates, 'Certificados vencidos': summary.expiredCerts,
        }] : []
        await exportXlsx(rows, 'reporte_resumen.xlsx', 'Resumen')
      }
    } finally { setExporting(null) }
  }

  const handleExportPdf = async () => {
    setExporting('pdf')
    try {
      if (tab === 'workers') {
        await exportPdf(
          'Reporte de Trabajadores',
          ['Nombre', 'Cédula', 'Área', 'Matrículas', 'Completados', 'Cumpl. %', 'Score'],
          workers.map(w => [w.name, w.cedula || '—', w.area || '—', w.total, w.completed, `${w.compliance}%`, w.avgScore != null ? `${w.avgScore}%` : '—']),
          'reporte_trabajadores.pdf'
        )
      } else if (tab === 'trainings') {
        await exportPdf(
          'Reporte de Capacitaciones',
          ['Título', 'Categoría', 'Matriculados', 'Completados', 'Tasa %', 'Score prom.'],
          trainings.map(t => [t.title, t.category || '—', t.enrolled, t.completed, `${t.passRate}%`, t.avgScore != null ? `${t.avgScore}%` : '—']),
          'reporte_capacitaciones.pdf'
        )
      } else {
        await exportPdf(
          'Resumen SG-SST',
          ['Indicador', 'Valor'],
          summary ? [
            ['Total usuarios', summary.users], ['Usuarios activos', summary.activeUsers],
            ['Total matrículas', summary.enrollments], ['Completados', summary.completed],
            ['En curso', summary.inProgress], ['Pendientes', summary.pending],
            ['Vencidos', summary.overdue], ['Cumplimiento', `${summary.compliance}%`],
            ['Score promedio', summary.avgScore != null ? `${summary.avgScore}%` : '—'],
            ['Certificados', summary.certificates], ['Certificados vencidos', summary.expiredCerts],
          ] : [],
          'reporte_resumen.pdf'
        )
      }
    } finally { setExporting(null) }
  }

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'summary',   label: 'Resumen',        icon: BarChart2 },
    { id: 'workers',   label: 'Trabajadores',   icon: Users },
    { id: 'trainings', label: 'Capacitaciones', icon: BookOpen },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)] mb-1">Reportes SG-SST</h1>
            <p className="text-[var(--text-dim)] text-sm">Indicadores reales · Exporta a Excel o PDF</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={handleExportXlsx} disabled={!!exporting || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border"
              style={{ borderColor: '#10B981', color: '#10B981', background: 'rgba(16,185,129,0.08)', opacity: exporting ? 0.6 : 1 }}>
              {exporting === 'xlsx' ? <RefreshCw size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
              Excel
            </button>
            <button onClick={handleExportPdf} disabled={!!exporting || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border"
              style={{ borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.08)', opacity: exporting ? 0.6 : 1 }}>
              {exporting === 'pdf' ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={15} />}
              PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t.id
              ? { background: 'var(--bg-surface)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
              : { color: 'var(--text-dim)', background: 'transparent' }
            }
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* ── SUMMARY TAB ─────────────────────────────────────────────── */}
          {tab === 'summary' && summary && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

              {/* KPI grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Usuarios activos', value: summary.activeUsers, sub: `de ${summary.users} totales`, icon: Users, color: '#3B82F6' },
                  { label: 'Cumplimiento',      value: `${summary.compliance}%`, sub: `${summary.completed} completados`, icon: TrendingUp, color: pct(summary.compliance) },
                  { label: 'Score promedio',    value: summary.avgScore != null ? `${summary.avgScore}%` : '—', sub: 'en completados', icon: Award, color: scoreColor(summary.avgScore) },
                  { label: 'Certificados',      value: summary.certificates, sub: summary.expiredCerts > 0 ? `${summary.expiredCerts} vencidos` : 'todos vigentes', icon: Shield, color: summary.expiredCerts > 0 ? '#F59E0B' : '#10B981' },
                ].map(({ label, value, sub, icon: Icon, color }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[var(--text-dim)] font-semibold">{label}</span>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                    </div>
                    <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
                    <div className="text-xs text-[var(--text-faint)]">{sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Enrollment breakdown */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                  <h3 className="font-bold text-[var(--text)] text-sm mb-4">Estado de matrículas</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Completados', val: summary.completed,  color: '#10B981', icon: CheckCircle },
                      { label: 'En curso',    val: summary.inProgress, color: '#3B82F6', icon: Clock },
                      { label: 'Pendientes',  val: summary.pending,    color: '#94A3B8', icon: Clock },
                      { label: 'Vencidos',    val: summary.overdue,    color: '#EF4444', icon: XCircle },
                    ].map(({ label, val, color, icon: Icon }) => {
                      const total = summary.enrollments || 1
                      const w = Math.round(val / total * 100)
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
                              <Icon size={12} style={{ color }} /> {label}
                            </div>
                            <span className="text-xs font-bold" style={{ color }}>{val} <span className="text-[var(--text-faint)] font-normal">({w}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.8 }}
                              className="h-full rounded-full" style={{ background: color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Monthly trend */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                  <h3 className="font-bold text-[var(--text)] text-sm mb-1">Tendencia (6 meses)</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(59,130,246,0.25)' }} /> Matriculados
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block bg-emerald-500" /> Completados
                    </span>
                  </div>
                  <MiniBar data={summary.monthly} />
                </div>
              </div>

              {/* By area */}
              {summary.byArea.length > 0 && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                  <h3 className="font-bold text-[var(--text)] text-sm mb-4">Cumplimiento por área</h3>
                  <div className="space-y-3">
                    {[...summary.byArea].sort((a, b) => b.pct - a.pct).map(({ area, total, completed, pct: p }) => (
                      <div key={area}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--text-dim)] truncate max-w-[60%]">{area}</span>
                          <span className="text-xs font-bold" style={{ color: pct(p) }}>{p}% <span className="text-[var(--text-faint)] font-normal">({completed}/{total})</span></span>
                        </div>
                        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.8 }}
                            className="h-full rounded-full" style={{ background: pct(p) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── WORKERS TAB ─────────────────────────────────────────────── */}
          {tab === 'workers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
                        {[
                          { col: 'name',       label: 'Nombre' },
                          { col: 'area',       label: 'Área' },
                          { col: 'total',      label: 'Matrículas' },
                          { col: 'completed',  label: 'Completados' },
                          { col: 'compliance', label: 'Cumpl. %' },
                          { col: 'avgScore',   label: 'Score prom.' },
                        ].map(({ col, label }) => (
                          <th key={col}
                            onClick={() => setWorkers(w => sort(col, w))}
                            className="px-4 py-3 text-left text-xs font-bold text-[var(--text-dim)] cursor-pointer hover:text-[var(--text)] transition-colors select-none"
                          >
                            <span className="flex items-center gap-1">{label} <SortIcon col={col} /></span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {workers.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-faint)] text-sm">Sin datos</td></tr>
                      ) : workers.map((w, i) => (
                        <motion.tr key={w.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[var(--text)] text-sm">{w.name}</div>
                            <div className="text-xs text-[var(--text-faint)]">{w.cedula || w.email}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--text-dim)]">{w.area || '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-[var(--text)]">{w.total}</td>
                          <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#10B981' }}>{w.completed}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${w.compliance}%`, background: pct(w.compliance) }} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: pct(w.compliance) }}>{w.compliance}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: scoreColor(w.avgScore) }}>
                            {w.avgScore != null ? `${w.avgScore}%` : '—'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TRAININGS TAB ────────────────────────────────────────────── */}
          {tab === 'trainings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
                        {[
                          { col: 'title',    label: 'Capacitación' },
                          { col: 'category', label: 'Categoría' },
                          { col: 'enrolled', label: 'Matriculados' },
                          { col: 'completed',label: 'Completados' },
                          { col: 'passRate', label: 'Aprobación %' },
                          { col: 'avgScore', label: 'Score prom.' },
                        ].map(({ col, label }) => (
                          <th key={col}
                            onClick={() => setTrainings(t => sort(col, t))}
                            className="px-4 py-3 text-left text-xs font-bold text-[var(--text-dim)] cursor-pointer hover:text-[var(--text)] transition-colors select-none"
                          >
                            <span className="flex items-center gap-1">{label} <SortIcon col={col} /></span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {trainings.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-faint)] text-sm">Sin datos</td></tr>
                      ) : trainings.map((t, i) => (
                        <motion.tr key={t.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[var(--text)] text-sm max-w-[200px] truncate">{t.title}</div>
                            {t.duration && <div className="text-xs text-[var(--text-faint)]">{t.duration}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {t.category ? (
                              <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                                style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
                                {t.category}
                              </span>
                            ) : <span className="text-[var(--text-faint)] text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[var(--text)]">{t.enrolled}</td>
                          <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#10B981' }}>{t.completed}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${t.passRate}%`, background: pct(t.passRate) }} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: pct(t.passRate) }}>{t.passRate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: scoreColor(t.avgScore) }}>
                            {t.avgScore != null ? `${t.avgScore}%` : '—'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
