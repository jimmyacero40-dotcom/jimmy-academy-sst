'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Loader2, Award, CalendarDays, BarChart2
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

const STATUS_META = {
  pending:     { label: 'Pendiente',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  in_progress: { label: 'En curso',    color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  icon: BookOpen },
  completed:   { label: 'Completado',  color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  expired:     { label: 'Vencido',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: AlertTriangle },
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function MyPlanPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  useEffect(() => {
    fetch('/api/enrollments')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEnrollments(data); setLoading(false) })
  }, [])

  const active    = enrollments.filter(e => e.status === 'pending' || e.status === 'in_progress' || e.status === 'expired')
  const completed = enrollments.filter(e => e.status === 'completed')

  const urgent = active.filter(e => {
    const d = daysUntil(e.due_date)
    return d !== null && d <= 7 && d >= 0
  })

  const displayed = tab === 'active' ? active : completed

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

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.12)' }}>
            <CalendarDays size={18} style={{ color: '#8B5CF6' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Mi Formación</h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--text-dim)' }}>
          Tus cursos asignados, progreso y certificados
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : enrollments.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--primary-dim)' }}>
            <BookOpen size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text)' }}>
            Sin cursos asignados
          </h3>
          <p className="text-sm max-w-xs" style={{ color: 'var(--text-dim)' }}>
            Tu administrador aún no ha publicado un plan de capacitación. Cuando lo haga, tus cursos aparecerán aquí.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Pendientes', value: active.filter(e => e.status !== 'expired').length, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: Clock },
              { label: 'Completados', value: completed.length, color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: CheckCircle },
              { label: 'Vencidos', value: active.filter(e => e.status === 'expired').length, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', icon: AlertTriangle },
            ].map(s => (
              <div key={s.label} className="terra-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.bg }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Urgent alert */}
          {urgent.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl mb-6"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#FCA5A5' }} />
              <div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: '#FCA5A5' }}>
                  {urgent.length} curso{urgent.length > 1 ? 's' : ''} próximo{urgent.length > 1 ? 's' : ''} a vencer
                </div>
                <div className="text-xs" style={{ color: 'rgba(252,165,165,0.7)' }}>
                  {urgent.map(e => e.trainings.title).join(', ')} — complétalo{urgent.length > 1 ? 's' : ''} antes de que se venzan
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'inline-flex' }}>
            {([
              { key: 'active',    label: `Activos (${active.length})` },
              { key: 'completed', label: `Completados (${completed.length})` },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t.key ? 'var(--primary)' : 'transparent',
                  color: tab === t.key ? '#fff' : 'var(--text-dim)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Course list */}
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <BarChart2 size={24} className="mb-3" style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                {tab === 'active' ? 'No tienes cursos pendientes.' : 'Aún no has completado ningún curso.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map((enrollment, i) => {
                const meta = STATUS_META[enrollment.status]
                const StatusIcon = meta.icon
                const days = daysUntil(enrollment.due_date)
                const isUrgent = days !== null && days <= 7 && days >= 0

                return (
                  <motion.div key={enrollment.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => enrollment.status !== 'completed' && startCourse(enrollment)}
                    className="terra-card p-4 group"
                    style={{ cursor: enrollment.status !== 'completed' ? 'pointer' : 'default' }}>
                    <div className="flex items-start gap-4">

                      {/* Icon */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: meta.bg }}>
                        <StatusIcon size={20} style={{ color: meta.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            {enrollment.trainings.title}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: meta.bg, color: meta.color }}>
                            {meta.label}
                          </span>
                        </div>

                        {enrollment.trainings.description && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-dim)' }}>
                            {enrollment.trainings.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {enrollment.trainings.duration && (
                            <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                              <Clock size={10} /> {enrollment.trainings.duration} min
                            </span>
                          )}
                          {enrollment.due_date && enrollment.status !== 'completed' && (
                            <span className="text-[11px] flex items-center gap-1"
                              style={{ color: isUrgent ? '#FCA5A5' : 'var(--text-faint)' }}>
                              <CalendarDays size={10} />
                              {days === null ? '' : days < 0 ? 'Vencido' : days === 0 ? 'Vence hoy' : `Vence en ${days} día${days !== 1 ? 's' : ''}`}
                            </span>
                          )}
                          {enrollment.status === 'completed' && enrollment.score !== null && (
                            <span className="text-[11px] flex items-center gap-1" style={{ color: '#34D399' }}>
                              <Award size={10} /> {enrollment.score}% — Aprobado
                            </span>
                          )}
                          {enrollment.status === 'completed' && enrollment.completed_at && (
                            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                              {new Date(enrollment.completed_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow for active courses */}
                      {enrollment.status !== 'completed' && (
                        <ChevronRight size={16} className="flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1"
                          style={{ color: 'var(--text-faint)' }} />
                      )}
                      {enrollment.status === 'completed' && (
                        <button
                          onClick={e => { e.stopPropagation(); router.push('/dashboard/certificates') }}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <Award size={11} /> Certificado
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
