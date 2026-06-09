'use client'

import { motion } from 'framer-motion'
import {
  Users, BookOpen, Award, BarChart2, TrendingUp,
  AlertCircle, CheckCircle, Clock, ArrowUpRight, Brain
} from 'lucide-react'

const stats = [
  {
    label: 'Empleados activos',
    value: '1,248',
    change: '+12% este mes',
    up: true,
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
  },
  {
    label: 'Cumplimiento SST',
    value: '94.2%',
    change: '+2.4% vs anterior',
    up: true,
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
  },
  {
    label: 'Certificados emitidos',
    value: '3,891',
    change: '+37 hoy',
    up: true,
    icon: Award,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10 border-violet-400/20',
  },
  {
    label: 'Capacitaciones pendientes',
    value: '47',
    change: '-8 esta semana',
    up: false,
    icon: BookOpen,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10 border-orange-400/20',
  },
]

const activity = [
  { type: 'success', icon: CheckCircle, msg: 'Carlos Mendoza completó "Trabajo en Alturas Nivel 1"', time: 'Hace 5 min', color: 'text-emerald-400' },
  { type: 'info', icon: Award, msg: 'María López obtuvo certificado COPASST 2025', time: 'Hace 18 min', color: 'text-blue-400' },
  { type: 'warning', icon: AlertCircle, msg: 'Pedro Gómez tiene capacitación vencida hace 3 días', time: 'Hace 1h', color: 'text-orange-400' },
  { type: 'success', icon: CheckCircle, msg: 'Política SST firmada por 24/24 empleados área técnica', time: 'Hace 2h', color: 'text-emerald-400' },
  { type: 'info', icon: BarChart2, msg: 'Reporte mensual de cumplimiento generado automáticamente', time: 'Hace 3h', color: 'text-violet-400' },
  { type: 'info', icon: Brain, msg: 'IA detectó 2 posibles incumplimientos en área de producción', time: 'Hace 5h', color: 'text-cyan-400' },
]

const compliance = [
  { area: 'Capacitaciones', pct: 96, color: 'bg-blue-500' },
  { area: 'Firmas documentos', pct: 88, color: 'bg-emerald-500' },
  { area: 'EPP y equipos', pct: 92, color: 'bg-violet-500' },
  { area: 'Inspecciones', pct: 85, color: 'bg-orange-500' },
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
        <h1 className="text-2xl font-black text-white mb-1">Panel de Control</h1>
        <p className="text-slate-400 text-sm">Resumen general del SG-SST · Actualizado hace 2 minutos</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, change, up, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="stat-card bg-[#0D1629] border border-white/8 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${bg}`}>
                <Icon size={18} className={color} strokeWidth={2} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-400' : 'text-orange-400'}`}>
                <ArrowUpRight size={12} className={up ? '' : 'rotate-90'} />
                {change}
              </div>
            </div>
            <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
            <div className="text-slate-400 text-sm">{label}</div>
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
          className="lg:col-span-2 bg-[#0D1629] border border-white/8 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h3 className="font-bold text-white">Actividad Reciente</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">En vivo</span>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {activity.map(({ icon: Icon, msg, time, color }, i) => (
              <div key={i} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-white/2 transition-colors">
                <Icon size={16} className={`${color} mt-0.5 flex-shrink-0`} strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-sm leading-relaxed">{msg}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-white/8">
            <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors flex items-center gap-1.5">
              Ver toda la actividad <ArrowUpRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* Compliance progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#0D1629] border border-white/8 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/8">
            <h3 className="font-bold text-white">Cumplimiento por Área</h3>
            <p className="text-slate-500 text-xs mt-0.5">Promedio general: 94.2%</p>
          </div>

          <div className="p-5 space-y-5">
            {compliance.map(({ area, pct, color }) => (
              <div key={area}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-slate-300 font-medium">{area}</span>
                  <span className="text-sm font-bold text-white">{pct}%</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    className={`h-full ${color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI insight */}
          <div className="mx-5 mb-5 p-4 bg-cyan-400/8 border border-cyan-400/20 rounded-xl">
            <div className="flex items-start gap-2.5">
              <Brain size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <div className="text-xs font-bold text-cyan-300 mb-1">IA SST detectó</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  2 empleados de producción requieren renovación de capacitación en EPP antes del 15 de enero.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={12} />
              Próxima auditoría: 28 Ene 2026
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
