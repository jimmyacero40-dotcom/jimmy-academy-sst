'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Clock, CheckCircle, AlertTriangle, Loader2, Award,
  CalendarDays, History, GraduationCap, Lock, Play,
  BookOpen, ChevronRight, Star
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
    cover_url: string | null
    category: string | null
  }
}

interface Certificate {
  id: string; code: string; course: string; issued: string
  expires: string; status: string; score?: string; duration?: string
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const GRADIENTS = [
  'from-blue-600 to-indigo-800',
  'from-emerald-600 to-teal-800',
  'from-violet-600 to-purple-800',
  'from-amber-500 to-orange-700',
  'from-rose-600 to-pink-800',
  'from-cyan-600 to-sky-800',
]

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMonth(d: string) {
  // Show start of month from due_date string without UTC conversion issues
  const [y, m] = d.slice(0, 7).split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long' })
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
    ]).then(([enr, c]: [Enrollment[], Certificate[]]) => {
      // If a certificate exists for a training title, mark that enrollment as
      // completed regardless of what the DB status says. This corrects enrollments
      // that stayed in_progress because training_id was missing from the cert POST.
      const certTitles = new Set<string>(c.map(cert => cert.course.trim().toLowerCase()))
      const corrected = enr.map(e => {
        if (
          (e.status === 'in_progress' || e.status === 'pending') &&
          certTitles.has(e.trainings.title.trim().toLowerCase())
        ) {
          return { ...e, status: 'completed' as const }
        }
        return e
      })
      setEnrollments(corrected)
      setCerts(c)
      setLoading(false)
    })
  }, [])

  // ── Date helpers ──────────────────────────────────────────────────────────
  const now       = new Date()
  const year      = now.getFullYear()
  const monthIdx  = now.getMonth()
  const monthName = MONTHS_ES[monthIdx]
  const currentYM = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
  const dueYM = (d: string) => d.slice(0, 7)

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

  const tabs = [
    { key: 'month',   label: monthName,      icon: GraduationCap, count: thisMonth.length  },
    { key: 'history', label: 'Historial',    icon: History,       count: history.length    },
    { key: 'certs',   label: 'Certificados', icon: Award,         count: certs.length      },
  ] as const

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black mb-0.5" style={{ color: 'var(--text)' }}>
            Mi Formación
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {monthName} {year} · Plan de capacitación personal
          </p>
        </div>

        {!loading && enrollments.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#34D399' }}>{completedCount}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>completados</div>
            </div>
            <div className="w-px h-10" style={{ background: 'var(--border)' }} />
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#60A5FA' }}>{pendingCount}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>este mes</div>
            </div>
            {certs.length > 0 && (
              <>
                <div className="w-px h-10" style={{ background: 'var(--border)' }} />
                <div className="text-center">
                  <div className="text-2xl font-black" style={{ color: '#FBBF24' }}>{certs.length}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>certificados</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <>
          {/* ── Alert: urgent ──────────────────────────────────────────── */}
          <AnimatePresence>
            {urgentCount > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl mb-5"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={16} className="flex-shrink-0" style={{ color: '#FCA5A5' }} />
                <span className="text-sm font-medium" style={{ color: '#FCA5A5' }}>
                  Tienes {urgentCount} capacitación{urgentCount > 1 ? 'es' : ''} que vence{urgentCount > 1 ? 'n' : ''} pronto este mes
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 rounded-xl mb-7"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'inline-flex' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t.key ? 'var(--primary)' : 'transparent',
                  color: tab === t.key ? '#fff' : 'var(--text-dim)',
                }}>
                <t.icon size={14} />
                {t.label}
                {t.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: tab === t.key ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface)',
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
            <>
              {thisMonth.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <CheckCircle size={28} style={{ color: '#34D399' }} />
                  </div>
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>
                    {enrollments.length === 0 ? 'Sin cursos asignados' : `Al día en ${monthName}`}
                  </p>
                  <p className="text-sm max-w-xs" style={{ color: 'var(--text-dim)' }}>
                    {enrollments.length === 0
                      ? 'Tu administrador publicará tu plan de capacitación aquí.'
                      : `Tus capacitaciones de ${monthName} están completadas.`}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {thisMonth.map((e, i) => (
                    <CourseCard key={e.id} enrollment={e} index={i} gradIndex={i}
                      onStart={startCourse} onCert={() => setTab('certs')} />
                  ))}
                </div>
              )}

              {/* ── Próximamente ──────────────────────────────────────── */}
              {future.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                    <span className="text-xs font-bold uppercase tracking-widest px-2"
                      style={{ color: 'var(--text-faint)' }}>Próximamente</span>
                    <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {future.map((e, i) => (
                      <LockedCard key={e.id} enrollment={e} index={i} gradIndex={thisMonth.length + i} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── TAB: Historial ────────────────────────────────────────── */}
          {tab === 'history' && (
            <>
              {history.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <History size={28} style={{ color: 'var(--text-faint)' }} />
                  </div>
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Sin historial</p>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    Tus capacitaciones completadas aparecerán aquí.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {history.map((e, i) => (
                    <CourseCard key={e.id} enrollment={e} index={i} gradIndex={i}
                      onStart={startCourse} onCert={() => setTab('certs')} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB: Certificados ─────────────────────────────────────── */}
          {tab === 'certs' && (
            <div className="space-y-3">
              {certs.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <Award size={28} style={{ color: '#FBBF24' }} />
                  </div>
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Sin certificados aún</p>
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

// ── Course card (Netflix/Coursera style) ──────────────────────────────────────
function CourseCard({ enrollment: e, index, gradIndex, onStart, onCert }: {
  enrollment: Enrollment
  index: number
  gradIndex: number
  onStart: (e: Enrollment) => void
  onCert: () => void
}) {
  const days      = daysUntil(e.due_date)
  const isUrgent  = days !== null && days <= 5 && days >= 0
  const isDone    = e.status === 'completed'
  const isExpired = e.status === 'expired'
  const isActive  = e.status === 'in_progress'
  const grad      = GRADIENTS[gradIndex % GRADIENTS.length]
  const hasCover  = e.trainings.cover_url && e.trainings.cover_url.startsWith('http')

  const statusColor = isDone ? '#34D399' : isExpired ? '#FCA5A5' : isUrgent ? '#F97316' : isActive ? '#60A5FA' : '#A78BFA'
  const statusLabel = isDone ? 'Completado' : isExpired ? 'Vencido' : isActive ? 'En curso' : 'Pendiente'
  const statusBg    = isDone ? 'rgba(16,185,129,0.15)' : isExpired ? 'rgba(239,68,68,0.15)' : isActive ? 'rgba(96,165,250,0.15)' : 'rgba(167,139,250,0.15)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden flex flex-col group cursor-pointer"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
      onClick={() => !isDone && !isExpired && onStart(e)}>

      {/* ── Cover image ─────────────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {hasCover ? (
          <img
            src={e.trainings.cover_url!}
            alt={e.trainings.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
            <BookOpen size={40} className="opacity-30 text-white" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />

        {/* Status badge top-right */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}30` }}>
            {statusLabel}
          </span>
        </div>

        {/* Category top-left */}
        {e.trainings.category && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)' }}>
              {e.trainings.category}
            </span>
          </div>
        )}

        {/* Score badge for completed */}
        {isDone && e.score !== null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ background: 'rgba(16,185,129,0.8)', color: '#fff' }}>
            <Star size={10} fill="currentColor" />
            <span className="text-[10px] font-bold">{e.score}%</span>
          </div>
        )}
      </div>

      {/* ── Card body ───────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2"
          style={{ color: 'var(--text)' }}>
          {e.trainings.title}
        </h3>

        {/* Progress bar (in_progress) */}
        {isActive && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full"
                style={{ width: '35%', background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>En progreso</p>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-auto flex-wrap">
          {e.trainings.duration && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
              <Clock size={10} /> {e.trainings.duration}
            </span>
          )}
          {!isDone && e.due_date && (
            <span className="text-[11px] flex items-center gap-1 font-medium"
              style={{ color: isUrgent || isExpired ? '#FCA5A5' : 'var(--text-faint)' }}>
              <CalendarDays size={10} />
              {isExpired ? `Venció ${fmtDate(e.due_date)}`
                : days === 0 ? 'Vence hoy'
                : days !== null && days <= 5 ? `${days}d restantes`
                : `Hasta ${fmtDate(e.due_date)}`}
            </span>
          )}
          {isDone && e.completed_at && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
              <CheckCircle size={10} /> {fmtDate(e.completed_at)}
            </span>
          )}
        </div>

        {/* CTA button */}
        <div className="mt-3">
          {isDone ? (
            <button
              onClick={ev => { ev.stopPropagation(); onCert() }}
              className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Award size={13} /> Ver certificado
            </button>
          ) : isExpired ? (
            <div className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              style={{ background: 'rgba(239,68,68,0.07)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={13} /> Período vencido
            </div>
          ) : (
            <button
              onClick={ev => { ev.stopPropagation(); onStart(e) }}
              className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: isActive ? 'linear-gradient(135deg,#3B82F6,#60A5FA)' : 'linear-gradient(135deg,#7C3AED,#A78BFA)', color: '#fff' }}>
              <Play size={12} fill="currentColor" />
              {isActive ? 'Continuar' : 'Iniciar'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Locked card (future courses) ─────────────────────────────────────────────
function LockedCard({ enrollment: e, index, gradIndex }: {
  enrollment: Enrollment
  index: number
  gradIndex: number
}) {
  const grad    = GRADIENTS[gradIndex % GRADIENTS.length]
  const hasCover = e.trainings.cover_url && e.trainings.cover_url.startsWith('http')
  const availMonth = e.due_date ? fmtMonth(e.due_date) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden flex items-center gap-3 p-3"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        opacity: 0.55,
      }}>

      {/* Mini cover */}
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
        {hasCover ? (
          <img src={e.trainings.cover_url!} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
            <BookOpen size={16} className="text-white opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <Lock size={14} className="text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-dim)' }}>
          {e.trainings.title}
        </p>
        {availMonth && (
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Disponible en {availMonth}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ── Certificate card ──────────────────────────────────────────────────────────
function CertCard({ cert, index }: { cert: Certificate; index: number }) {
  const router = useRouter()
  const isValid   = new Date(cert.expires).getTime() > Date.now()
  const expiresIn = Math.ceil((new Date(cert.expires).getTime() - Date.now()) / 86400000)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="terra-card p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isValid ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.08)' }}>
        <Award size={20} style={{ color: isValid ? '#FBBF24' : '#FCA5A5' }} />
      </div>
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
        </div>
      </div>
      <button
        onClick={() => router.push('/dashboard/certificates')}
        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
        style={{ background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>
        Ver
      </button>
    </motion.div>
  )
}
