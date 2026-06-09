'use client'

import { motion } from 'framer-motion'
import {
  BarChart2, Download, TrendingUp, TrendingDown, Users,
  Award, BookOpen, AlertCircle, Calendar, FileText, ArrowUpRight
} from 'lucide-react'

const MONTHLY = [
  { month: 'Ago', val: 78 }, { month: 'Sep', val: 82 }, { month: 'Oct', val: 85 },
  { month: 'Nov', val: 88 }, { month: 'Dic', val: 91 }, { month: 'Ene', val: 94 },
]

const REPORTS = [
  { title: 'Reporte Mensual SST – Enero 2026', type: 'Mensual', date: '2026-01-31', size: '2.4 MB', status: 'listo' },
  { title: 'Cumplimiento de Capacitaciones Q4 2025', type: 'Trimestral', date: '2026-01-05', size: '4.1 MB', status: 'listo' },
  { title: 'Informe de Incidentes 2025', type: 'Anual', date: '2026-01-10', size: '8.7 MB', status: 'listo' },
  { title: 'Estadísticas COPASST – Enero 2026', type: 'Mensual', date: '2026-01-28', size: '1.2 MB', status: 'listo' },
  { title: 'Reporte de Certificados Vencidos', type: 'Alerta', date: '2026-01-15', size: '0.8 MB', status: 'alerta' },
]

const INDICATORS = [
  { label: 'Índice de Frecuencia Accidentes', value: '0.8', change: '-0.3', up: false, good: true, icon: AlertCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { label: 'Índice de Severidad', value: '12', change: '-4', up: false, good: true, icon: TrendingDown, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { label: 'Cobertura Capacitaciones', value: '94%', change: '+6%', up: true, good: true, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { label: 'Empleados certificados', value: '87%', change: '+3%', up: true, good: true, icon: Award, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
]

const maxVal = Math.max(...MONTHLY.map(m => m.val))

export default function ReportsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Reportes</h1>
            <p className="text-slate-400 text-sm">Indicadores y estadísticas del SG-SST</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start sm:self-auto">
            <BarChart2 size={16} /> Generar Reporte
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {INDICATORS.map(({ label, value, change, up, good, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-[#0D1629] border border-white/8 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bg}`}>
                <Icon size={15} className={color} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-semibold ${good ? 'text-emerald-400' : 'text-rose-400'}`}>
                <ArrowUpRight size={11} className={up ? '' : 'rotate-90'} />
                {change}
              </div>
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-slate-400 text-xs mt-0.5 leading-snug">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">

        {/* Trend chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-[#0D1629] border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white">Evolución Cumplimiento SST</h3>
              <p className="text-slate-500 text-xs mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              <TrendingUp size={16} /> +16% anual
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-2 h-36 mb-3">
            {MONTHLY.map(({ month, val }, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-white/70">{val}%</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / maxVal) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                  className={`w-full rounded-t-lg ${i === MONTHLY.length - 1 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-white/10'}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {MONTHLY.map(({ month }) => (
              <div key={month} className="flex-1 text-center text-xs text-slate-500">{month}</div>
            ))}
          </div>
        </motion.div>

        {/* Area breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4 text-sm">Cumplimiento por Área</h3>
          <div className="space-y-4">
            {[
              { area: 'Producción', pct: 91, color: 'bg-blue-500' },
              { area: 'Mantenimiento', pct: 88, color: 'bg-violet-500' },
              { area: 'Logística', pct: 96, color: 'bg-emerald-500' },
              { area: 'RRHH', pct: 100, color: 'bg-cyan-500' },
              { area: 'SST', pct: 100, color: 'bg-green-500' },
            ].map(({ area, pct, color }) => (
              <div key={area}>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 text-xs">{area}</span>
                  <span className="text-white text-xs font-bold">{pct}%</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full ${color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reports list */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-[#0D1629] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h3 className="font-bold text-white">Reportes Generados</h3>
        </div>
        <div className="divide-y divide-white/5">
          {REPORTS.map((r, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.status === 'alerta' ? 'bg-orange-400/10 border border-orange-400/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                <FileText size={16} className={r.status === 'alerta' ? 'text-orange-400' : 'text-blue-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{r.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${r.status === 'alerta' ? 'bg-orange-400/10 text-orange-400' : 'bg-blue-400/10 text-blue-400'}`}>{r.type}</span>
                  <span className="text-slate-500 text-xs flex items-center gap-1"><Calendar size={10} /> {r.date}</span>
                  <span className="text-slate-600 text-xs">{r.size}</span>
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors text-xs font-semibold flex-shrink-0">
                <Download size={14} /> <span className="hidden sm:inline">Descargar</span>
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
