'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart2, Loader2, CheckCircle, Clock, AlertTriangle,
  BookOpen, Search, X, Users, Award, TrendingUp, Mail, ClipboardList, ChevronRight
} from 'lucide-react'
import RecordatorioDialog from '@/components/RecordatorioDialog'
import AttendanceWizard from '@/components/AttendanceWizard'

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
  in_progress: { label: 'En curso',   color: 'var(--primary)', bg: 'rgba(59,130,246,0.1)'  },
  completed:   { label: 'Completado', color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  expired:     { label: 'Vencido',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [avisando, setAvisando] = useState(false)
  // Sacar la lista de asistencia desde aquí: en esta pantalla es donde se ve
  // quién hizo qué y qué día, que es justo lo que pide el formato.
  const [eligiendoCurso, setEligiendoCurso] = useState(false)
  const [cursoAsistencia, setCursoAsistencia] =
    useState<{ id: number; title: string; temario?: string; description?: string } | null>(null)
  const [empresa, setEmpresa] = useState({ nombre: '', logo: '' })
  const [temarios, setTemarios] = useState<Record<number, { temario?: string; description?: string }>>({})

  useEffect(() => {
    fetch('/api/enrollments')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEnrollments(data); setLoading(false) })
    fetch('/api/companies')
      .then(r => r.ok ? r.json() : [])
      .then((d: any[]) => setEmpresa({ nombre: d?.[0]?.name ?? '', logo: d?.[0]?.logo_url ?? '' }))
      .catch(() => {})
    // El temario va impreso en el formato; se trae una vez y se usa al elegir.
    fetch('/api/trainings')
      .then(r => r.ok ? r.json() : [])
      .then((d: any[]) => {
        const m: Record<number, { temario?: string; description?: string }> = {}
        for (const t of d ?? []) m[t.id] = { temario: t.temario, description: t.description }
        setTemarios(m)
      })
      .catch(() => {})
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

  // A quién avisarle: una persona, no una inscripción. Si a alguien le faltan
  // tres cursos no se le mandan tres correos; se le manda uno que dice que
  // tiene capacitaciones pendientes, con la lista en el detalle.
  const atrasados = useMemo(() => {
    const por = new Map<string, { user_id: string; nombre: string; cursos: string[] }>()
    for (const e of filtered) {
      if (e.status === 'completed' || !e.users?.id) continue
      const y = por.get(e.users.id) ?? { user_id: e.users.id, nombre: e.users.name, cursos: [] }
      if (e.trainings?.title) y.cursos.push(e.trainings.title)
      por.set(e.users.id, y)
    }
    return [...por.values()]
  }, [filtered])

  /** Los temas que se ven ahora mismo, con cuántos los completaron. */
  const cursos = useMemo(() => {
    const m = new Map<number, { id: number; title: string; total: number; hechos: number }>()
    for (const e of filtered) {
      if (!e.trainings?.id) continue
      const c = m.get(e.trainings.id) ?? { id: e.trainings.id, title: e.trainings.title, total: 0, hechos: 0 }
      c.total++
      if (e.status === 'completed') c.hechos++
      m.set(e.trainings.id, c)
    }
    return [...m.values()].sort((a, b) => a.title.localeCompare(b.title, 'es'))
  }, [filtered])

  return (
    <div className="p-6">

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
            style={{ background: 'linear-gradient(90deg, var(--primary), #10B981)' }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
          <span>{completed} completados</span>
          <span>{total} total</span>
        </div>
      </div>

      {avisando && (
        <RecordatorioDialog
          modulo="formacion"
          titulo={`${atrasados.length} personas con capacitaciones sin terminar`}
          candidatos={atrasados.map(a => ({
            user_id: a.user_id,
            nombre: a.nombre,
            detalle: a.cursos.length === 1 ? a.cursos[0] : `${a.cursos.length} capacitaciones pendientes`,
          }))}
          onCerrar={() => setAvisando(false)}
        />
      )}

      {/* Escoger el tema del que se saca la lista. Los temas son los que se
          están viendo: si se filtró por «Completado», salen esos. */}
      {eligiendoCurso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Lista de asistencia</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  Escoge el tema. Después podrás filtrar por el día en que la hicieron.
                </p>
              </div>
              <button onClick={() => setEligiendoCurso(false)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-faint)' }}>
                <X size={15} />
              </button>
            </div>
            <div className="space-y-1.5">
              {cursos.map(c => (
                <button key={c.id}
                  onClick={() => {
                    setCursoAsistencia({ id: c.id, title: c.title, ...(temarios[c.id] ?? {}) })
                    setEligiendoCurso(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                  <BookOpen size={14} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{c.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      {c.hechos} de {c.total} la han completado
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {cursoAsistencia && (
        <AttendanceWizard
          training={cursoAsistencia}
          companyName={empresa.nombre}
          companyLogo={empresa.logo}
          onClose={() => setCursoAsistencia(null)}
          onSaved={() => {}}
        />
      )}

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
        {cursos.length > 0 && (
          <button onClick={() => setEligiendoCurso(true)}
            className="flex items-center gap-1.5 rounded-lg font-bold"
            style={{ padding: '8px 14px', fontSize: 12, border: '1px solid rgba(16,185,129,0.4)', color: '#10B981', background: 'rgba(16,185,129,0.07)' }}>
            <ClipboardList size={13} /> Lista de asistencia
          </button>
        )}
        {atrasados.length > 0 && (
          <button onClick={() => setAvisando(true)}
            className="flex items-center gap-1.5 rounded-lg font-bold"
            style={{ padding: '8px 14px', fontSize: 12, border: '1px solid rgba(36,60,44,0.4)', color: '#243C2C', background: 'rgba(36,60,44,0.06)' }}>
            <Mail size={13} /> Avisar a {atrasados.length}
          </button>
        )}
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
                <th>Realizó</th>
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
                    {/* Cuándo la hizo. «Vence» dice hasta cuándo tenía, pero
                        para una auditoría lo que vale es el día en que la
                        presentó. */}
                    <td>
                      <span className="text-xs" style={{ color: e.completed_at ? '#34D399' : 'var(--text-faint)' }}>
                        {e.completed_at
                          ? new Date(e.completed_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
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
