'use client'

import { motion } from 'framer-motion'
import {
  Users, BookOpen, Award, BarChart2, TrendingUp,
  AlertCircle, CheckCircle, Clock, ArrowUpRight, Brain
} from 'lucide-react'

const stats = [
  {
    label: 'Empleados activos',
    value: '0',
    change: 'Importa desde Excel',
    up: true,
    icon: Users,
    accent: 'var(--amber)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    label: 'Cumplimiento SST',
    value: '0%',
    change: 'Sin datos aun',
    up: true,
    icon: TrendingUp,
    accent: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  {
    label: 'Certificados emitidos',
    value: '0',
    change: 'Completa capacitaciones',
    up: true,
    icon: Award,
    accent: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    label: 'Capacitaciones',
    value: '6',
    change: 'Cursos disponibles',
    up: true,
    icon: BookOpen,
    accent: 'var(--red)',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
]

const activity = [
  { icon: CheckCircle, msg: 'Plataforma Jimmy Academy SST configurada correctamente', time: 'Sistema', color: '#10B981' },
  { icon: BookOpen, msg: '6 capacitaciones predefinidas con normativa colombiana vigente', time: 'Contenido', color: 'var(--amber)' },
  { icon: Brain, msg: 'Generador de capacitaciones con IA disponible', time: 'IA SST', color: '#A78BFA' },
  { icon: Users, msg: 'Importa tu nomina desde Excel para comenzar', time: 'Usuarios', color: '#60A5FA' },
  { icon: Award, msg: 'Certificados automaticos al completar evaluaciones', time: 'Certificados', color: '#F472B6' },
]

const compliance = [
  { area: 'Capacitaciones', pct: 0, color: 'var(--amber)' },
  { area: 'Firmas documentos', pct: 0, color: '#10B981' },
  { area: 'EPP y equipos', pct: 0, color: '#A78BFA' },
  { area: 'Inspecciones', pct: 0, color: 'var(--red)' },
]

export default function DashboardPage() {
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

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 terra-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Estado del Sistema</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
              <span className="text-xs font-semibold" style={{ color: '#6EE7B7' }}>Activo</span>
            </div>
          </div>

          <div>
            {activity.map(({ icon: Icon, msg, time, color }, i) => (
              <div key={i} className="flex items-start gap-3.5 px-5 py-3.5 transition-colors"
                style={{ borderBottom: i < activity.length - 1 ? '1px solid rgba(245,158,11,0.05)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Icon size={16} style={{ color }} className="mt-0.5 flex-shrink-0" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{msg}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Compliance progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="terra-card overflow-hidden"
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Cumplimiento por Area</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Comienza importando trabajadores</p>
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

          {/* AI insight */}
          <div className="mx-5 mb-5 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div className="flex items-start gap-2.5">
              <Brain size={16} style={{ color: 'var(--amber)' }} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: '#FCD34D' }}>IA SST disponible</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Genera capacitaciones automaticas sobre cualquier tema SST con normativa colombiana vigente.
                </p>
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
