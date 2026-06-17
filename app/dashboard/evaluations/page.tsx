'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileCheck, Search, Plus, Clock, CheckCircle, AlertCircle,
  Users, BarChart2, Trophy, X, ChevronRight, Star
} from 'lucide-react'

const EVALS: { id: number; title: string; course: string; questions: number; avgScore: number; passed: number; total: number; due: string; status: string }[] = []

const RECENT_RESULTS: { name: string; eval: string; score: number; passed: boolean; date: string }[] = []

const statusConfig = {
  activo: { label: 'Activo', color: 'text-amber-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  completado: { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
}

export default function EvaluationsPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<typeof EVALS[0] | null>(null)

  const filtered = EVALS.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.course.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)] mb-1">Evaluaciones</h1>
            <p className="text-[var(--text-dim)] text-sm">{EVALS.length} evaluaciones · promedio general {Math.round(EVALS.reduce((a, e) => a + e.avgScore, 0) / EVALS.length)}%</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start sm:self-auto">
            <Plus size={16} /> Nueva Evaluación
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Evaluaciones', value: EVALS.length, color: 'text-amber-400' },
          { label: 'Promedio', value: `${Math.round(EVALS.reduce((a, e) => a + e.avgScore, 0) / EVALS.length)}%`, color: 'text-violet-400' },
          { label: 'Aprobados hoy', value: RECENT_RESULTS.filter(r => r.passed).length, color: 'text-emerald-400' },
          { label: 'Reprobados hoy', value: RECENT_RESULTS.filter(r => !r.passed).length, color: 'text-rose-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[var(--text-dim)] text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Evaluations list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar evaluación..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-amber-500/40 transition-all" />
          </div>

          {filtered.map((ev, i) => {
            const st = statusConfig[ev.status as keyof typeof statusConfig]
            const passRate = Math.round((ev.passed / ev.total) * 100)
            return (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border-strong)] transition-all cursor-pointer"
                onClick={() => setSelected(ev)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <FileCheck size={18} className="text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-[var(--text)] font-semibold text-sm">{ev.title}</h3>
                      <p className="text-[var(--text-faint)] text-xs mt-0.5">{ev.questions} preguntas · Vence {ev.due}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ${st.bg} ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-black text-[var(--text)]">{ev.avgScore}%</div>
                    <div className="text-[var(--text-faint)] text-xs">Promedio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-400">{ev.passed}</div>
                    <div className="text-[var(--text-faint)] text-xs">Aprobados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-amber-400">{ev.total}</div>
                    <div className="text-[var(--text-faint)] text-xs">Total</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${passRate}%` }} transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${passRate >= 90 ? 'bg-emerald-500' : passRate >= 70 ? 'bg-amber-500' : 'bg-orange-500'}`} />
                  </div>
                  <span className="text-xs text-[var(--text-dim)]">{passRate}% aprobados</span>
                  <ChevronRight size={14} className="text-[var(--text-faint)]" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Recent results */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--text)] text-sm">Resultados Recientes</h3>
          </div>
          <div className="divide-y divide-white/5">
            {RECENT_RESULTS.map((r, i) => (
              <div key={i} className="px-5 py-3.5 hover:bg-[var(--bg-card-hover)] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[var(--text)] text-sm font-semibold truncate">{r.name}</div>
                    <div className="text-[var(--text-faint)] text-xs truncate">{r.eval}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-black ${r.score >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>{r.score}%</div>
                    <div className={`text-xs ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r.passed ? '✓ Aprobado' : '✗ Reprobado'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* New eval modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text)] font-bold">Nueva Evaluación</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nombre de la evaluación', placeholder: 'Test de Seguridad...' },
                { label: 'Número de preguntas', placeholder: '20' },
                { label: 'Puntaje mínimo para aprobar (%)', placeholder: '70' },
              ].map(({ label, placeholder }) => (
                <div key={label}>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                  <input placeholder={placeholder}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-amber-500/40 transition-all" />
                </div>
              ))}
              <div>
                <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Capacitación asociada</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                  {['Trabajo en Alturas', 'Primeros Auxilios', 'Extintores', 'EPP', 'COPASST'].map(c => (
                    <option key={c} className="bg-[var(--bg-surface)]">{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-sm font-semibold transition-all">Cancelar</button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] text-sm font-semibold transition-all">Crear Evaluación</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
