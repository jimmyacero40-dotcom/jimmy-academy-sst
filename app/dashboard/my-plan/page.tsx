'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Loader2, Award, CalendarDays,
  History, GraduationCap, Lock, Play
} from 'lucide-react'

interface Enrollment {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'expired'
  due_date: string | null
  started_at: string | null
  completed_at: string | null
  score: number | null
  created_at: string
  trainings: {
    id: number
    title: string
    description: string | null
    duration: number | null
  }
}

interface Certificate {
  id: string; code: string; course: string; issued: string
  expires: string; status: string; score?: string; duration?: string
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Pill badge for course status
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: 'Pendiente',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
    in_progress: { label: 'En curso',   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
    completed:   { label: 'Completado', color: '#34D399', bg: 'rgba(16,185,129,0.12)'  },
    expired:     { label: 'Vencido',    color: '#FCA5A5', bg: 'rgba(239,68,68,0.12)'   },
  }
  const c = cfg[status] ?? cfg.pending
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

export default function MyPlanPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [certs, setCerts]             = useState<Certificate[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<'month' | 'history' | 'certs'>('month')

  useEffect(() => {
    Promise.all([
      fetch('/api/enrollments').then(r => r.ok ? r.json() : []),
      fetch('/api/certificates').then(r => r.ok ? r.json() : []),
    ]).then(([enr, c]) => {
      setEnrollments(enr)
      setCerts(c)
      setLoading(false)
    })
  }, [])

  // ── Date helpers ──────────────────────────────────────────────────────────
  const now       = new Date()
  const year      = now.getFullYear()
  const monthIdx  = now.getMonth()           // 0-based
  const monthName = MONTHS_ES[monthIdx]
  const currentYM = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
  // Usa fecha LOCAL (no UTC) para evitar desfase de timezone Colombia UTC-5
  const dueYM = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
  }

  // ── Filter logic ──────────────────────────────────────────────────────────
  const thisMonth = enrollments.filter(e => {
    if (!e.due_date) return false
    return dueYM(e.due_date) === currentYM &&
      (e.status === 'pending' || e.status === 'in_progress' || e.status === 'expired')
  })

  const future = enrollments.filter(e => {
    if (!e.due_date) return false
    return dueYM(e.due_date) > currentYM &&
      (e.status === 'pending' || e.status === 'in_progress')
  })

  // History: completed + past expired
  const history = enrollments.filter(e =>
    e.status === 'completed' ||
    (e.status === 'expired' && e.due_date && dueYM(e.due_date) < currentYM)
  ).sort((a, b) => {
    const da = a.completed_at || a.due_date || a.created_at
    const db = b.completed_at || b.due_date || b.created_at
    return new Date(db).getTime() - new Date(da).getTime()
  })

  const completedCount = enrollments.filter(e => e.status === 'completed').length
  const pendingCount   = thisMonth.filter(e => e.status !== 'completed').length
  const urgentCount    = thisMonth.filter(e => {
    const d = daysUntil(e.due_date); return d !== null && d <= 5 && d >= 0
  }).length

  const startCourse = async (enrollment: Enrollment) => {
    if (enrollment.status === 'pending') {
      await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })
    }
    router.push(`/dashboard/trainings/${enrollment.trainings.id}`)
  }

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs = [
    { key: 'month',   label: `${monthName}`,       icon: CalendarDays,  count: thisMonth.length   },
    { key: 'history', label: 'Historial',           icon: History,       count: history.length     },
    { key: 'certs',   label: 'Certificados',        icon: Award,         count: certs.length       },
  ] as const

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <GraduationCap size={20} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Mi Formación</h1>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {monthName} {year} · Plan de capacitación
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {!loading && enrollments.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#34D399' }}>{completedCount}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>completados</div>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--border)' }} />
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#60A5FA' }}>{pendingCount}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>este mes</div>
            </div>
            {certs.length > 0 && (
              <>
                <div className="w-px h-8" style={{ background: 'var(--border)' }} />
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: '#FBBF24' }}>{certs.length}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>certificados</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <>
          {/* ── Alert: urgent courses ──────────────────────────────────── */}
          <AnimatePresence>
            {urgentCount > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3.5 rounded-xl mb-5"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={15} className="flex-shrink-0" style={{ color: '#FCA5A5' }} />
                <span className="text-sm font-medium" style={{ color: '#FCA5A5' }}>
                  Tienes {urgentCount} capacitación{urgentCount > 1 ? 'es' : ''} que vence{urgentCount > 1 ? 'n' : ''} pronto este mes
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'inline-flex' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t.key ? 'var(--primary)' : 'transparent',
                  color: tab === t.key ? '#fff' : 'var(--text-dim)',
                }}>
                <t.icon size={14} />
                {t.label}
                {t.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)',
                      color: tab === t.key ? '#fff' : 'var(--text-faint)',
                    }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: Este mes ─────────────────────────────────────────── */}
          {tab === 'month' && (
            <div className="space-y-3">
              {thisMonth.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <CheckCircle size={24} style={{ color: '#34D399' }} />
                  </div>
                  <p className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>
                    {enrollments.length === 0
                      ? 'Sin cursos asignados'
                      : `Sin capacitaciones para ${monthName}`}
                  </p>
                  <p className="text-sm max-w-xs" style={{ color: 'var(--text-dim)' }}>
                    {enrollments.length === 0
                      ? 'Tu administrador publicará tu plan de capacitación aquí.'
                      : `Tus capacitaciones de ${monthName} ya están completadas o no hay cursos programados para este mes.`}
                  </p>
                </motion.div>
              ) : (
                thisMonth.map((e, i) => <CourseCard key={e.id} enrollment={e} index={i} onStart={startCourse} onCert={() => setTab('certs')} />)
              )}

              {/* Next month preview */}
              {future.length > 0 && (
                <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-faint)' }}>Próximamente</p>
                  <div className="space-y-2">
                    {future.slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: 0.6 }}>
                        <Lock size={14} style={{ color: 'var(--text-faint)' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-dim)' }}>
                            {e.trainings.title}
                          </div>
                        </div>
                        {e.due_date && (
                          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                            Disponible {new Date(new Date(e.due_date).getFullYear(), new Date(e.due_date).getMonth(), 1).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    ))}
                    {future.length > 3 && (
                      <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
                        +{future.length - 3} capacitaciones más programadas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Historial ────────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <History size={24} style={{ color: 'var(--text-faint)' }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin historial</p>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Tus capacitaciones completadas aparecerán aquí.</p>
                </motion.div>
              ) : (
                history.map((e, i) => <CourseCard key={e.id} enrollment={e} index={i} onStart={startCourse} onCert={() => setTab('certs')} />)
              )}
            </div>
          )}

          {/* ── TAB: Certificados ─────────────────────────────────────── */}
          {tab === 'certs' && (
            <div className="space-y-3">
              {certs.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <Award size={24} style={{ color: '#FBBF24' }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin certificados aún</p>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    Al completar una capacitación recibirás tu certificado aquí.
                  </p>
                </motion.div>
              ) : (
                certs.map((cert, i) => <CertCard key={cert.id} cert={cert} index={i} />)
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseCard({ enrollment: e, index, onStart, onCert }: {
  enrollment: Enrollment
  index: number
  onStart: (e: Enrollment) => void
  onCert: () => void
}) {
  const days      = daysUntil(e.due_date)
  const isUrgent  = days !== null && days <= 5 && days >= 0
  const isDone    = e.status === 'completed'
  const isExpired = e.status === 'expired'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="terra-card p-4 group"
      style={{ cursor: isDone ? 'default' : 'pointer' }}
      onClick={() => !isDone && onStart(e)}>

      <div className="flex items-start gap-4">
        {/* Status icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: isDone ? 'rgba(16,185,129,0.1)' : isExpired ? 'rgba(239,68,68,0.1)' : isUrgent ? 'rgba(239,68,68,0.08)' : 'rgba(96,165,250,0.1)',
          }}>
          {isDone    ? <CheckCircle size={18} style={{ color: '#34D399' }} />
          : isExpired ? <AlertTriangle size={18} style={{ color: '#FCA5A5' }} />
          : e.status === 'in_progress' ? <Play size={18} style={{ color: '#60A5FA' }} />
          : <BookOpen size={18} style={{ color: '#60A5FA' }} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="font-semibold text-sm leading-snug" style={{ color: 'var(--text)' }}>
              {e.trainings.title}
            </div>
            <StatusBadge status={e.status} />
          </div>

          {e.trainings.description && (
            <p className="text-xs line-clamp-1 mb-2" style={{ color: 'var(--text-dim)' }}>
              {e.trainings.description}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {e.trainings.duration && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                <Clock size={10} /> {e.trainings.duration} min
              </span>
            )}

            {/* Date info */}
            {!isDone && e.due_date && (
              <span className="text-[11px] flex items-center gap-1 font-medium"
                style={{ color: isUrgent || isExpired ? '#FCA5A5' : 'var(--text-faint)' }}>
                <CalendarDays size={10} />
                {isExpired
                  ? `Venció el ${fmtDate(e.due_date)}`
                  : days === 0 ? 'Vence hoy'
                  : `Vence ${fmtDate(e.due_date)}`}
              </span>
            )}

            {isDone && e.completed_at && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                <CheckCircle size={10} /> Completado {fmtDate(e.completed_at)}
              </span>
            )}

            {isDone && e.score !== null && (
              <span className="text-[11px] flex items-center gap-1 font-semibold" style={{ color: '#34D399' }}>
                <Award size={10} /> {e.score}%
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        {isDone ? (
          <button
            onClick={ev => { ev.stopPropagation(); onCert() }}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
            style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Award size={12} /> Ver certificado
          </button>
        ) : !isExpired && (
          <ChevronRight size={16} className="flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1"
            style={{ color: 'var(--text-faint)' }} />
        )}
      </div>
    </motion.div>
  )
}

// ── Certificate card ──────────────────────────────────────────────────────────
function CertCard({ cert, index }: { cert: Certificate; index: number }) {
  const router = useRouter()
  const isValid = new Date(cert.expires).getTime() > Date.now()
  const expiresIn = Math.ceil((new Date(cert.expires).getTime() - Date.now()) / 86400000)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="terra-card p-4 flex items-center gap-4">

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isValid ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.08)' }}>
        <Award size={18} style={{ color: isValid ? '#FBBF24' : '#FCA5A5' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate mb-0.5" style={{ color: 'var(--text)' }}>
          {cert.course}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Emitido {fmtDate(cert.issued)}
          </span>
          <span className="text-[11px]" style={{ color: isValid ? '#34D399' : '#FCA5A5' }}>
            {isValid
              ? expiresIn <= 30 ? `Vence en ${expiresIn} días` : `Vigente hasta ${fmtDate(cert.expires)}`
              : `Venció ${fmtDate(cert.expires)}`}
          </span>
          {cert.score && (
            <span className="text-[11px] font-semibold" style={{ color: '#34D399' }}>
              {cert.score}%
            </span>
          )}
        </div>
      </div>

      {/* View button */}
      <button
        onClick={() => router.push('/dashboard/certificates')}
        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
        style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Award size={12} /> Ver
      </button>
    </motion.div>
  )
}
