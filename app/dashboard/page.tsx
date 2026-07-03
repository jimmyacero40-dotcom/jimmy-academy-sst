'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users, BookOpen, Award, TrendingUp, CheckCircle, Clock,
  AlertTriangle, CalendarDays, ChevronRight, Loader2,
  BarChart2, FileText, UserCheck
} from 'lucide-react'

interface Enrollment {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'expired'
  due_date: string | null
  completed_at: string | null
  users?: { name: string; area: string | null }
  trainings?: { title: string }
}

interface KPIs {
  totalWorkers: number
  totalEnrollments: number
  completed: number
  pending: number
  expired: number
  certificates: number
  compliancePct: number
  thisMonthEnrollments: number
  thisMonthCompleted: number
  expiringNext30: number
  byArea: { area: string; total: number; done: number; pct: number }[]
  recentCompleted: Enrollment[]
  urgentPending: Enrollment[]
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="terra-progress-track">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="terra-progress-fill"
        style={{ background: color }}
      />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'worker'

  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (userRole === 'worker') { router.replace('/dashboard/my-plan'); return }

    const now = new Date()
    const thisMonth = now.getMonth()   // 0-indexed
    const thisYear = now.getFullYear()

    try {
      const [enrollRes, usersRes, certsRes] = await Promise.all([
        fetch('/api/enrollments'),
        fetch('/api/users'),
        fetch('/api/certificates'),
      ])

      const enrollments: Enrollment[] = enrollRes.ok ? await enrollRes.json() : []
      const users: any[] = usersRes.ok ? await usersRes.json() : []
      const certs: any[] = certsRes.ok ? await certsRes.json() : []

      const activeWorkers = users.filter(u => u.active && u.role === 'worker')

      const completed  = enrollments.filter(e => e.status === 'completed')
      const pending    = enrollments.filter(e => e.status === 'pending' || e.status === 'in_progress')
      const expired    = enrollments.filter(e => e.status === 'expired')

      const compliancePct = enrollments.length > 0
        ? Math.round((completed.length / enrollments.length) * 100)
        : 0

      // This month
      const thisMonthAll = enrollments.filter(e => {
        if (!e.due_date) return false
        const d = new Date(e.due_date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      })
      const thisMonthCompleted = thisMonthAll.filter(e => e.status === 'completed')

      // Expiring in next 30 days
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const expiringNext30 = pending.filter(e => {
        if (!e.due_date) return false
        const d = new Date(e.due_date)
        return d >= now && d <= in30
      })

      // By area
      const areaMap: Record<string, { total: number; done: number }> = {}
      enrollments.forEach(e => {
        const area = (e.users as any)?.area || 'Sin área'
        if (!areaMap[area]) areaMap[area] = { total: 0, done: 0 }
        areaMap[area].total++
        if (e.status === 'completed') areaMap[area].done++
      })
      const byArea = Object.entries(areaMap)
        .map(([area, { total, done }]) => ({
          area, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6)

      // Recent completed (last 5)
      const recentCompleted = [...completed]
        .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())
        .slice(0, 5)

      // Urgent pending (due in ≤7 days)
      const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const urgentPending = pending.filter(e => {
        if (!e.due_date) return false
        const d = new Date(e.due_date)
        return d >= now && d <= in7
      }).slice(0, 5)

      setKpis({
        totalWorkers: activeWorkers.length,
        totalEnrollments: enrollments.length,
        completed: completed.length,
        pending: pending.length,
        expired: expired.length,
        certificates: certs.length,
        compliancePct,
        thisMonthEnrollments: thisMonthAll.length,
        thisMonthCompleted: thisMonthCompleted.length,
        expiringNext30: expiringNext30.length,
        byArea,
        recentCompleted,
        urgentPending,
      })
    } catch { /* leave null, show empty */ }
    setLoading(false)
  }, [userRole, router])

  useEffect(() => { load() }, [load])

  const now = new Date()
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  const k = kpis

  const kpiCards = [
    {
      label: 'Cumplimiento PAC',
      value: k ? `${k.compliancePct}%` : '—',
      sub: k ? `${k.completed} de ${k.totalEnrollments} completadas` : 'Sin datos',
      icon: TrendingUp,
      accent: k && k.compliancePct >= 80 ? '#10B981' : k && k.compliancePct >= 50 ? '#F59E0B' : '#EF4444',
      bg: k && k.compliancePct >= 80 ? 'rgba(16,185,129,0.08)' : k && k.compliancePct >= 50 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
      href: '/dashboard/enrollments',
    },
    {
      label: 'Trabajadores activos',
      value: k ? String(k.totalWorkers) : '—',
      sub: k && k.totalWorkers > 0 ? 'con acceso al sistema' : 'Importa desde Excel',
      icon: Users,
      accent: 'var(--amber)',
      bg: 'rgba(245,158,11,0.08)',
      href: '/dashboard/users',
    },
    {
      label: `Pendientes — ${monthLabel}`,
      value: k ? String(k.thisMonthEnrollments - k.thisMonthCompleted) : '—',
      sub: k ? `${k.thisMonthCompleted} completadas este mes` : 'Sin plan activo',
      icon: CalendarDays,
      accent: '#3B82F6',
      bg: 'rgba(59,130,246,0.08)',
      href: '/dashboard/enrollments',
    },
    {
      label: 'Certificados emitidos',
      value: k ? String(k.certificates) : '—',
      sub: k && k.expiringNext30 > 0 ? `${k.expiringNext30} vencen en 30 días` : 'Todos al día',
      icon: Award,
      accent: '#A78BFA',
      bg: 'rgba(167,139,250,0.08)',
      href: '/dashboard/certificates',
    },
  ]

  const AREA_COLORS = ['#10B981','#3B82F6','var(--amber)','#A78BFA','#F43F5E','#14B8A6']

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black mb-1"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Panel de Control
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {monthLabel} · Sistema de Gestión de la Formación SST
            </p>
          </div>
          {k && k.expiringNext30 > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
              <AlertTriangle size={15} />
              {k.expiringNext30} vencimientos próximos
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map(({ label, value, sub, icon: Icon, accent, bg, href }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <Link href={href} className="terra-card p-5 block hover:border-amber-500/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: bg }}>
                  <Icon size={18} style={{ color: accent }} strokeWidth={2} />
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} />
              </div>
              <div className="text-3xl font-black mb-1" style={{ color: accent }}>{value}</div>
              <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{label}</div>
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{sub}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">

        {/* Cumplimiento por área */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="lg:col-span-2 terra-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Cumplimiento por Área</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                Basado en matrículas activas del plan
              </p>
            </div>
            <Link href="/dashboard/enrollments"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              Ver detalle
            </Link>
          </div>

          <div className="p-5">
            {!k || k.byArea.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BarChart2 size={28} className="mb-3" style={{ color: 'var(--text-faint)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Sin datos de matrículas</p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Activa un Plan Anual para generar matrículas automáticamente
                </p>
                <Link href="/dashboard/plan"
                  className="mt-4 terra-btn text-xs px-4 py-2">
                  Ir al Plan Anual
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {k.byArea.map(({ area, total, done, pct }, i) => (
                  <div key={area}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: AREA_COLORS[i % AREA_COLORS.length] }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{area}</span>
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {done}/{total}
                        </span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: AREA_COLORS[i % AREA_COLORS.length] }}>
                        {pct}%
                      </span>
                    </div>
                    <ProgressBar pct={pct} color={AREA_COLORS[i % AREA_COLORS.length]} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Alertas y estado */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} className="terra-card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Estado del Sistema</h3>
          </div>
          <div className="p-5 space-y-3">

            {[
              {
                label: 'Completadas',
                value: k?.completed ?? 0,
                icon: CheckCircle,
                color: '#10B981',
                bg: 'rgba(16,185,129,0.08)',
              },
              {
                label: 'En progreso / Pendientes',
                value: k?.pending ?? 0,
                icon: Clock,
                color: '#3B82F6',
                bg: 'rgba(59,130,246,0.08)',
              },
              {
                label: 'Vencidas',
                value: k?.expired ?? 0,
                icon: AlertTriangle,
                color: '#EF4444',
                bg: 'rgba(239,68,68,0.08)',
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: bg }}>
                <Icon size={16} style={{ color }} className="flex-shrink-0" />
                <span className="text-sm flex-1" style={{ color: 'var(--text-dim)' }}>{label}</span>
                <span className="text-sm font-bold" style={{ color }}>{value}</span>
              </div>
            ))}

            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between text-xs mb-3"
                style={{ color: 'var(--text-faint)' }}>
                <span>Accesos rápidos</span>
              </div>
              {[
                { label: 'Gestionar usuarios', href: '/dashboard/users', icon: Users },
                { label: 'Plan Anual', href: '/dashboard/plan', icon: CalendarDays },
                { label: 'Biblioteca de cursos', href: '/dashboard/trainings', icon: BookOpen },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1 transition-all"
                  style={{ color: 'var(--text-dim)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <Icon size={14} style={{ color: 'var(--amber)' }} />
                  <span className="text-xs">{label}</span>
                  <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--text-faint)' }} />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Second row */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Próximos a vencer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }} className="terra-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <AlertTriangle size={15} style={{ color: '#F59E0B' }} />
              Vencen en 7 días
            </h3>
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#FCD34D' }}>
              {k?.urgentPending.length ?? 0}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {!k || k.urgentPending.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-8 text-center justify-center">
                <CheckCircle size={16} style={{ color: '#10B981' }} />
                <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Sin vencimientos urgentes</span>
              </div>
            ) : (
              k.urgentPending.map(e => {
                const days = Math.ceil((new Date(e.due_date!).getTime() - Date.now()) / 86400000)
                return (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <Clock size={14} style={{ color: '#EF4444' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {(e.users as any)?.name ?? 'Trabajador'}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                        {(e.trainings as any)?.title ?? 'Capacitación'}
                      </div>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0"
                      style={{ color: days <= 2 ? '#EF4444' : '#F59E0B' }}>
                      {days === 0 ? 'Hoy' : `${days}d`}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Completadas recientemente */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }} className="terra-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <CheckCircle size={15} style={{ color: '#10B981' }} />
              Completadas recientemente
            </h3>
            <Link href="/dashboard/certificates"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              Certificados
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {!k || k.recentCompleted.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-8 text-center justify-center">
                <FileText size={16} style={{ color: 'var(--text-faint)' }} />
                <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Sin actividad reciente</span>
              </div>
            ) : (
              k.recentCompleted.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <UserCheck size={14} style={{ color: '#10B981' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {(e.users as any)?.name ?? 'Trabajador'}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                      {(e.trainings as any)?.title ?? 'Capacitación'}
                    </div>
                  </div>
                  {e.completed_at && (
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                      {new Date(e.completed_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
