'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, CheckCircle, AlertCircle, Clock,
  Calendar, User, MapPin, ChevronRight, X, Shield, ClipboardList
} from 'lucide-react'

const AUDITS: { id: string; title: string; area: string; auditor: string; date: string; status: string; findings: number; score: number | null }[] = []

const FINDINGS: { id: number; audit: string; type: string; desc: string; responsible: string; due: string; status: string }[] = []

const statusConfig = {
  programada: { label: 'Programada', color: 'text-amber-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: Clock },
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
            <h1 className="text-2xl font-black text-[var(--text)] mb-1">Auditoría</h1>
            <p className="text-[var(--text-dim)] text-sm">{AUDITS.length} auditorías · próxima: 28 Ene 2026</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start sm:self-auto">
            <Plus size={16} /> Nueva Auditoría
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: AUDITS.length, color: 'text-amber-400' },
          { label: 'Completadas', value: AUDITS.filter(a => a.status === 'completada').length, color: 'text-emerald-400' },
          { label: 'Programadas', value: AUDITS.filter(a => a.status === 'programada').length, color: 'text-violet-400' },
          { label: 'Hallazgos abiertos', value: FINDINGS.filter(f => f.status === 'abierto').length, color: 'text-orange-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[var(--text-dim)] text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Audits list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar auditoría..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-amber-500/40 transition-all" />
          </div>

          {filtered.map((a, i) => {
            const st = statusConfig[a.status as keyof typeof statusConfig]
            const StIcon = st.icon
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border-strong)] transition-all cursor-pointer"
                onClick={() => setSelected(a)}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-[var(--text)] font-semibold text-sm">{a.title}</h3>
                      <p className="text-[var(--text-faint)] text-xs mt-0.5 font-mono">{a.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ${st.bg} ${st.color}`}>
                    <StIcon size={10} /> {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-faint)]">
                  <div className="flex items-center gap-1"><MapPin size={11} /> {a.area}</div>
                  <div className="flex items-center gap-1"><User size={11} /> {a.auditor}</div>
                  <div className="flex items-center gap-1"><Calendar size={11} /> {a.date}</div>
                  {a.score !== null && (
                    <div className={`ml-auto font-bold text-sm ${a.score >= 90 ? 'text-emerald-400' : a.score >= 75 ? 'text-amber-400' : 'text-orange-400'}`}>
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
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--text)] text-sm">Hallazgos Recientes</h3>
            <p className="text-[var(--text-faint)] text-xs mt-0.5">{FINDINGS.filter(f => f.status === 'abierto').length} abiertos</p>
          </div>
          <div className="divide-y divide-white/5">
            {FINDINGS.map((f, i) => (
              <div key={f.id} className="px-5 py-3.5 hover:bg-[var(--bg-card-hover)] transition-colors">
                <div className="flex items-start gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${f.status === 'abierto' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                  <p className="text-[var(--text)]/80 text-xs leading-snug">{f.desc}</p>
                </div>
                <div className="flex items-center justify-between ml-3.5">
                  <span className="text-[var(--text-faint)] text-xs">{f.type}</span>
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
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text)] font-bold">Nueva Auditoría</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Título de la auditoría', placeholder: 'Auditoría Interna SST...' },
                { label: 'Auditor responsable', placeholder: 'Nombre del auditor' },
              ].map(({ label, placeholder }) => (
                <div key={label}>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                  <input placeholder={placeholder}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-amber-500/40 transition-all" />
                </div>
              ))}
              <div>
                <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Área a auditar</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                  {['Toda la empresa', 'Producción', 'Mantenimiento', 'Logística', 'COPASST', 'Planta principal'].map(c => (
                    <option key={c} className="bg-[var(--bg-surface)]">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Fecha programada</label>
                <input type="date" className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-sm font-semibold transition-all">Cancelar</button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] text-sm font-semibold transition-all">Programar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
