'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Search, RefreshCw, LogIn, LogOut, UserPlus, Edit3,
  Trash2, Award, BookOpen, FileText, Eye, Filter, ChevronLeft,
  ChevronRight, X
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string
  action: string
  resource: string
  resourceId: string | null
  detail: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  User: { id: string; name: string; email: string; role: string } | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTION_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  LOGIN:              { label: 'Login',         color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  icon: LogIn },
  LOGOUT:             { label: 'Logout',        color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)',  icon: LogOut },
  CREATE:             { label: 'Creación',      color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  icon: UserPlus },
  UPDATE:             { label: 'Edición',       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: Edit3 },
  DELETE:             { label: 'Eliminación',   color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   icon: Trash2 },
  ENROLL:             { label: 'Matrícula',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)', icon: BookOpen },
  COMPLETE:           { label: 'Completado',    color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', icon: Award },
  CERTIFICATE_ISSUED: { label: 'Certificado',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', icon: Award },
  VIEW:               { label: 'Visualización', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)',  icon: Eye },
  EXPORT:             { label: 'Exportación',   color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)',icon: FileText },
}

const DEFAULT_CFG = { label: 'Acción', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: FileText }

const RESOURCE_LABELS: Record<string, string> = {
  auth: 'Autenticación', user: 'Usuario', training: 'Capacitación',
  enrollment: 'Matrícula', certificate: 'Certificado', evaluation: 'Evaluación',
  report: 'Reporte', profile: 'Perfil', plan: 'Plan',
}

const ALL_ACTIONS = ['LOGIN','LOGOUT','CREATE','UPDATE','DELETE','ENROLL','COMPLETE','CERTIFICATE_ISSUED','VIEW','EXPORT']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'hace un momento'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const days = Math.floor(h / 24)
  return `hace ${days}d`
}

function getInitials(name: string) {
  return (name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function avatarColor(id: string) {
  const h = (id.charCodeAt(0) + id.charCodeAt(1) * 37) % 360
  return `hsl(${h},65%,52%)`
}

function browserName(ua: string | null) {
  if (!ua) return 'Desconocido'
  if (ua.includes('node')) return 'Sistema'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Navegador'
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  const cfg = ACTION_CFG[log.action] ?? DEFAULT_CFG
  const Icon = cfg.icon

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--border-strong)] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <Icon size={16} style={{ color: cfg.color }} />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text)] text-sm">{cfg.label}</h2>
              <p className="text-xs text-[var(--text-faint)]">{fmtDate(log.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {log.User && (
            <div>
              <p className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Usuario</p>
              <div className="flex items-center gap-3 bg-[var(--bg-card)] rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: avatarColor(log.User.id) }}>
                  {getInitials(log.User.name ?? log.User.email)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{log.User.name ?? '—'}</p>
                  <p className="text-xs text-[var(--text-faint)]">{log.User.email}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold mt-0.5 inline-block"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD' }}>
                    {log.User.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Detalle</p>
            <div className="bg-[var(--bg-card)] rounded-xl p-4">
              <p className="text-sm text-[var(--text)] leading-relaxed">{log.detail}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Metadata</p>
            <div className="space-y-0 divide-y divide-[var(--border)]">
              {[
                { label: 'Recurso',    value: RESOURCE_LABELS[log.resource] ?? log.resource },
                { label: 'ID recurso', value: log.resourceId ?? '—' },
                { label: 'IP',         value: log.ipAddress ?? '—' },
                { label: 'Navegador',  value: browserName(log.userAgent) },
                { label: 'Timestamp',  value: fmtDate(log.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="text-xs text-[var(--text-faint)] flex-shrink-0">{label}</span>
                  <span className="text-xs text-[var(--text)] font-mono text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {log.userAgent && log.userAgent !== 'node' && (
            <div>
              <p className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">User Agent</p>
              <pre className="text-[10px] text-[var(--text-faint)] bg-[var(--bg-card)] rounded-xl p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                {log.userAgent}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

export default function AuditPage() {
  const [logs, setLogs]         = useState<LogEntry[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')
  const [selected, setSelected] = useState<LogEntry | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(p), limit: String(PAGE_SIZE),
      ...(actionFilter && { action: actionFilter }),
      ...(search && { search }),
      ...(fromDate && { from: fromDate }),
      ...(toDate && { to: toDate }),
    })
    const res = await fetch(`/api/audit?${params}`)
    const data = await res.json()
    setLogs(data.logs ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [actionFilter, search, fromDate, toDate])

  useEffect(() => { setPage(1); load(1) }, [load])

  const goPage = (p: number) => { setPage(p); load(p) }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = !!(actionFilter || search || fromDate || toDate)
  const clearFilters = () => { setActionFilter(''); setSearch(''); setFromDate(''); setToDate('') }

  // Stats from current page
  const actionCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] ?? 0) + 1; return acc
  }, {})
  const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)] mb-1">Registro de Auditoría</h1>
            <p className="text-[var(--text-dim)] text-sm">
              {total.toLocaleString('es-CO')} eventos · actividad del sistema en tiempo real
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border"
              style={hasFilters
                ? { borderColor: '#3B82F6', color: '#3B82F6', background: 'rgba(59,130,246,0.1)' }
                : { borderColor: 'var(--border)', color: 'var(--text-dim)', background: 'transparent' }}>
              <Filter size={14} /> Filtros{hasFilters ? ' •' : ''}
            </button>
            <button onClick={() => load(page)}
              className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      {topActions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {topActions.map(([action, count], i) => {
            const cfg = ACTION_CFG[action] ?? DEFAULT_CFG
            const Icon = cfg.icon
            return (
              <motion.button key={action}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setActionFilter(actionFilter === action ? '' : action)}
                className="bg-[var(--bg-surface)] border rounded-xl p-4 text-left transition-all hover:border-[var(--border-strong)]"
                style={{ borderColor: actionFilter === action ? cfg.color : 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>
                </div>
                <div className="text-xl font-black" style={{ color: cfg.color }}>{count}</div>
                <div className="text-xs text-[var(--text-faint)] mt-0.5">{cfg.label}</div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 mb-5">
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar en detalle o recurso..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/40 transition-all" />
            </div>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-blue-500/40 transition-all">
              <option value="">Todas las acciones</option>
              {ALL_ACTIONS.map(a => (
                <option key={a} value={a} className="bg-[var(--bg-surface)]">{ACTION_CFG[a]?.label ?? a}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-blue-500/40 transition-all" />
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-blue-500/40 transition-all" />
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: '#EF4444' }}>
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </motion.div>
      )}

      {/* Log list */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">

        {loading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-48 rounded" />
                  <div className="skeleton h-2.5 w-72 rounded" />
                </div>
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(148,163,184,0.1)' }}>
              <Shield size={24} className="text-[var(--text-faint)]" />
            </div>
            <p className="text-[var(--text-dim)] text-sm font-semibold">Sin eventos registrados</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log, i) => {
              const cfg = ACTION_CFG[log.action] ?? DEFAULT_CFG
              const Icon = cfg.icon
              return (
                <motion.button key={log.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.012, 0.25) }}
                  onClick={() => setSelected(log)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-[var(--text-faint)]">
                        {RESOURCE_LABELS[log.resource] ?? log.resource}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text)] truncate">{log.detail}</p>
                    {log.User && (
                      <p className="text-xs text-[var(--text-faint)] mt-0.5 truncate">
                        {log.User.name ?? log.User.email}
                        {log.ipAddress && <span> · {log.ipAddress}</span>}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-[var(--text-dim)]">{timeAgo(log.createdAt)}</p>
                    <p className="text-[10px] text-[var(--text-faint)] mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-faint)]">
              Pág. {page}/{totalPages} · {total.toLocaleString('es-CO')} eventos
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => goPage(page - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg disabled:opacity-30 text-[var(--text-dim)]">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 :
                  page <= 3 ? i + 1 :
                  page >= totalPages - 2 ? totalPages - 4 + i :
                  page - 2 + i
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                    style={p === page
                      ? { background: '#3B82F6', color: '#fff' }
                      : { color: 'var(--text-dim)' }}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
                className="p-1.5 rounded-lg disabled:opacity-30 text-[var(--text-dim)]">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail drawer */}
      {selected && <DetailDrawer log={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
