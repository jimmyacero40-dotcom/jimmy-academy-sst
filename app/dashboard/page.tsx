'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, Award, TrendingUp,
  CheckCircle, Clock, Brain
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'worker'
  const [trainings, setTrainings] = useState<any[]>([])

  useEffect(() => {
    if (userRole === 'worker') {
      router.replace('/dashboard/my-plan')
      return
    }
    if (userRole === 'admin') {
      // admins go to dashboard (they can see it)
    }
    fetch('/api/trainings')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTrainings(data) })
      .catch(() => {})
  }, [userRole, router])

  const totalCourses = trainings.length
  const completed = trainings.filter(t => t.status === 'completado').length
  const compliancePct = totalCourses > 0 ? Math.round((completed / totalCourses) * 100) : 0

  const stats = [
    {
      label: 'Empleados activos',
      value: '0',
      change: 'Importa desde Excel',
      icon: Users,
      accent: 'var(--amber)',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
    },
    {
      label: 'Cumplimiento SST',
      value: `${compliancePct}%`,
      change: totalCourses > 0 ? `${completed}/${totalCourses} completados` : 'Sin datos aún',
      icon: TrendingUp,
      accent: '#10B981',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.2)',
    },
    {
      label: 'Certificados emitidos',
      value: String(completed),
      change: completed > 0 ? 'Cursos completados' : 'Completa capacitaciones',
      icon: Award,
      accent: '#A78BFA',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.2)',
    },
    {
      label: 'Capacitaciones',
      value: String(totalCourses),
      change: totalCourses > 0 ? 'Cursos subidos' : 'Sube tu primer curso',
      icon: BookOpen,
      accent: 'var(--red)',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
    },
  ]

  const compliance = [
    { area: 'Capacitaciones', pct: compliancePct, color: 'var(--amber)' },
    { area: 'Firmas documentos', pct: 0, color: '#10B981' },
    { area: 'EPP y equipos', pct: 0, color: '#A78BFA' },
    { area: 'Inspecciones', pct: 0, color: 'var(--red)' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Panel de Control</h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Resumen general del SG-SST · Jimmy Academy</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, change, icon: Icon, accent, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="terra-card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon size={18} style={{ color: accent }} strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
                {change}
              </div>
            </div>
            <div className="text-3xl font-black mb-1" style={{ color: accent }}>{value}</div>
            <div className="text-sm" style={{ color: 'var(--text-dim)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Compliance progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 terra-card overflow-hidden"
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Cumplimiento por Área</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Progreso del SG-SST según módulos</p>
          </div>

          <div className="p-5 space-y-5">
            {compliance.map(({ area, pct, color }) => (
              <div key={area}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>{area}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{pct}%</span>
                </div>
                <div className="terra-progress-track">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    className="terra-progress-fill"
                    style={{ background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI insight card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="terra-card overflow-hidden"
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Herramientas</h3>
          </div>

          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-start gap-2.5">
                <Brain size={16} style={{ color: 'var(--amber)' }} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <div className="text-xs font-bold mb-1" style={{ color: '#FCD34D' }}>IA SST disponible</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    Genera capacitaciones automáticas sobre cualquier tema SST con normativa colombiana vigente.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="flex items-start gap-2.5">
                <CheckCircle size={16} style={{ color: '#10B981' }} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <div className="text-xs font-bold mb-1" style={{ color: '#6EE7B7' }}>Evaluaciones automáticas</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    Crea preguntas personalizadas para cada curso o deja que el sistema las genere.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <div className="flex items-start gap-2.5">
                <Award size={16} style={{ color: '#A78BFA' }} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <div className="text-xs font-bold mb-1" style={{ color: '#C4B5FD' }}>Certificados</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    Certificados profesionales con firma del participante al aprobar la evaluación.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
              <Clock size={12} />
              Decreto 1072/2015 · Res. 0312/2019
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
