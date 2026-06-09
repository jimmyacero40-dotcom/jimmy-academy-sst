'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, CheckCircle, AlertCircle, Clock,
  Calendar, User, MapPin, ChevronRight, X, Shield, ClipboardList
} from 'lucide-react'

const AUDITS = [
  { id: 'AUD-2026-01', title: 'Auditoría Interna SST Q1 2026', area: 'Toda la empresa', auditor: 'Felipe Torres', date: '2026-01-28', status: 'programada', findings: 0, score: null },
  { id: 'AUD-2025-04', title: 'Auditoría EPP – Producción', area: 'Producción', auditor: 'Diana Ruiz', date: '2025-12-15', status: 'completada', findings: 3, score: 87 },
  { id: 'AUD-2025-03', title: 'Auditoría COPASST Semestral', area: 'COPASST', auditor: 'María López', date: '2025-11-20', status: 'completada', findings: 1, score: 96 },
  { id: 'AUD-2025-02', title: 'Revisión Plan de Emergencias', area: 'Toda la empresa', auditor: 'Felipe Torres', date: '2025-10-10', status: 'completada', findings: 5, score: 74 },
  { id: 'AUD-2025-01', title: 'Auditoría Extintores y Señalización', area: 'Planta principal', auditor: 'Carlos Mendoza', date: '2025-09-05', status: 'completada', findings: 2, score: 91 },
]

const FINDINGS = [
  { id: 1, audit: 'AUD-2025-04', type: 'No conformidad menor', desc: 'EPP incompleto en 3 puestos de trabajo área corte', responsible: 'Juan García', due: '2026-02-01', status: 'abierto' },
  { id: 2, audit: 'AUD-2025-04', type: 'Observación', desc: 'Señalización de rutas de evacuación desactualizada', responsible: 'Laura Herrera', due: '2026-01-25', status: 'cerrado' },
  { id: 3, audit: 'AUD-2025-02', type: 'No conformidad mayor', desc: 'Plan de emergencias sin actualización en 18 meses', responsible: 'Felipe Torres', due: '2025-12-31', status: 'cerrado' },
  { id: 4, audit: 'AUD-2025-02', type: 'No conformidad menor', desc: 'Directorio de emergencias desactualizado', responsible: 'Camila Vargas', due: '2025-11-30', status: 'cerrado' },
]

const statusConfig = {
  programada: { label: 'Programada', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: Clock },
  completada: { label: 'Completada', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  'en-proceso': { label: 'En proceso', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: AlertCircle },
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<typeof AUDITS[0] | null>(null)

  const filtered = AUDITS.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.area.toLowerCase().includes(search.toLowerCase()) ||
    a.auditor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Auditoría</h1>
            <p className="text-slate-400 text-sm">{AUDITS.length} auditorías · próxima: 28 Ene 2026</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start sm:self-auto">
            <Plus size={16} /> Nueva Auditoría
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: AUDITS.length, color: 'text-blue-400' },
          { label: 'Completadas', value: AUDITS.filter(a => a.status === 'completada').length, color: 'text-emerald-400' },
          { label: 'Programadas', value: AUDITS.filter(a => a.status === 'programada').length, color: 'text-violet-400' },
          { label: 'Hallazgos abiertos', value: FINDINGS.filter(f => f.status === 'abierto').length, color: 'text-orange-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[#0D1629] border border-white/8 rounded-xl p-4">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Audits list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar auditoría..."
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all" />
          </div>

          {filtered.map((a, i) => {
            const st = statusConfig[a.status as keyof typeof statusConfig]
            const StIcon = st.icon
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-[#0D1629] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all cursor-pointer"
                onClick={() => setSelected(a)}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{a.title}</h3>
                      <p className="text-slate-500 text-xs mt-0.5 font-mono">{a.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ${st.bg} ${st.color}`}>
                    <StIcon size={10} /> {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1"><MapPin size={11} /> {a.area}</div>
                  <div className="flex items-center gap-1"><User size={11} /> {a.auditor}</div>
                  <div className="flex items-center gap-1"><Calendar size={11} /> {a.date}</div>
                  {a.score !== null && (
                    <div className={`ml-auto font-bold text-sm ${a.score >= 90 ? 'text-emerald-400' : a.score >= 75 ? 'text-blue-400' : 'text-orange-400'}`}>
                      {a.score}%
                    </div>
                  )}
                </div>
                {a.findings > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-400">
                    <AlertCircle size={11} /> {a.findings} hallazgo{a.findings > 1 ? 's' : ''}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Findings panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#0D1629] border border-white/8 rounded-2xl overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-white/8">
            <h3 className="font-bold text-white text-sm">Hallazgos Recientes</h3>
            <p className="text-slate-500 text-xs mt-0.5">{FINDINGS.filter(f => f.status === 'abierto').length} abiertos</p>
          </div>
          <div className="divide-y divide-white/5">
            {FINDINGS.map((f, i) => (
              <div key={f.id} className="px-5 py-3.5 hover:bg-white/2 transition-colors">
                <div className="flex items-start gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${f.status === 'abierto' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                  <p className="text-white/80 text-xs leading-snug">{f.desc}</p>
                </div>
                <div className="flex items-center justify-between ml-3.5">
                  <span className="text-slate-600 text-xs">{f.type}</span>
                  <span className={`text-xs font-semibold ${f.status === 'abierto' ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {f.status === 'abierto' ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* New audit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0D1629] border border-white/12 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-white font-bold">Nueva Auditoría</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Título de la auditoría', placeholder: 'Auditoría Interna SST...' },
                { label: 'Auditor responsable', placeholder: 'Nombre del auditor' },
              ].map(({ label, placeholder }) => (
                <div key={label}>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">{label}</label>
                  <input placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
              ))}
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Área a auditar</label>
                <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all">
                  {['Toda la empresa', 'Producción', 'Mantenimiento', 'Logística', 'COPASST', 'Planta principal'].map(c => (
                    <option key={c} className="bg-[#0D1629]">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Fecha programada</label>
                <input type="date" className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-sm font-semibold transition-all">Cancelar</button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">Programar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
