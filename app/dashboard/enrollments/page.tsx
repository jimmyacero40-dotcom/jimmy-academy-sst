'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart2, Loader2, CheckCircle, Clock, AlertTriangle,
  BookOpen, Search, X, Users, Award, TrendingUp
} from 'lucide-react'

interface Enrollment {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'expired'
  due_date: string | null
  completed_at: string | null
  score: number | null
  users: { id: string; name: string; email: string; cedula: string; area: string | null }
  trainings: { id: number; title: string; duration: number | null }
}

const STATUS_META = {
  pending:     { label: 'Pendiente',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  in_progress: { label: 'En curso',   color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
  completed:   { label: 'Completado', color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  expired:     { label: 'Vencido',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetch('/api/enrollments')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEnrollments(data); setLoading(false) })
  }, [])

  const filtered = enrollments.filter(e => {
    const matchStatus = filterStatus === 'all' || e.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q ||
      e.users?.name?.toLowerCase().includes(q) ||
      e.trainings?.title?.toLowerCase().includes(q) ||
      e.users?.area?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const total      = enrollments.length
  const completed  = enrollments.filter(e => e.status === 'completed').length
  const pending    = enrollments.filter(e => e.status === 'pending' || e.status === 'in_progress').length
  const expired    = enrollments.filter(e => e.status === 'expired').length
  const compliance = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <BarChart2 size={18} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Trazabilidad</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Cumplimiento de matrículas por trabajador
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cumplimiento general', value: `${compliance}%`, color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: TrendingUp },
          { label: 'Completados',          value: completed,        color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: CheckCircle },
          { label: 'Pendientes',           value: pending,          color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: Clock },
          { label: 'Vencidos',             value: expired,          color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="terra-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="terra-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
            Progreso general del plan
          </span>
          <span className="text-xs font-bold" style={{ color: '#10B981' }}>{compliance}%</span>
        </div>
        <div className="terra-progress-track">
          <motion.div className="terra-progress-fill" initial={{ width: 0 }} animate={{ width: `${compliance}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #3B82F6, #10B981)' }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
          <span>{completed} completados</span>
          <span>{total} total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Buscar por trabajador, curso o área..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="terra-input pl-8 py-2 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-faint)' }}><X size={13} /></button>
          )}
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {[
            { key: 'all',         label: 'Todos' },
            { key: 'pending',     label: 'Pendiente' },
            { key: 'in_progress', label: 'En curso' },
            { key: 'completed',   label: 'Completado' },
            { key: 'expired',     label: 'Vencido' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filterStatus === f.key ? 'var(--primary)' : 'transparent',
                color: filterStatus === f.key ? '#fff' : 'var(--text-dim)',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={28} className="mb-3" style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Sin resultados</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {enrollments.length === 0
              ? 'No hay matrículas todavía. Activa un plan para generarlas.'
              : 'Intenta con otro filtro o búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="terra-card overflow-hidden">
          <table className="terra-table w-full">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Curso</th>
                <th>Área</th>
                <th>Vence</th>
                <th>Estado</th>
                <th>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const meta = STATUS_META[e.status]
                const overdue = e.due_date && e.status !== 'completed' && new Date(e.due_date) < new Date()
                return (
                  <motion.tr key={e.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: 'var(--grad-main)' }}>
                          {e.users?.name?.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{e.users?.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{e.users?.cedula}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-medium max-w-[200px] truncate" style={{ color: 'var(--text)' }}>
                        {e.trainings?.title}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                        {e.users?.area || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: overdue ? '#FCA5A5' : 'var(--text-dim)' }}>
                        {e.due_date
                          ? new Date(e.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      {e.score !== null ? (
                        <span className="text-xs flex items-center gap-1" style={{ color: e.score >= 70 ? '#34D399' : '#FCA5A5' }}>
                          <Award size={10} /> {e.score}%
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
