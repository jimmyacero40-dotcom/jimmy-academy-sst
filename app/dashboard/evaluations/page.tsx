'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileCheck, Search, Plus, X, ChevronRight, Edit2, Trash2,
  CheckSquare, Circle, ToggleLeft, Clock, Award, BookOpen,
  MoreVertical, AlertCircle, Check, GripVertical, Tag,
  RefreshCw, ChevronDown, ChevronUp, Layers, Upload, FileText,
  CheckCircle2
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type QType = 'single' | 'multiple' | 'true_false'

interface Question {
  id: string
  evaluation_id: string
  text: string
  type: QType
  options: string[]
  correct: string[]
  points: number
}

interface Evaluation {
  id: string
  title: string
  min_score: number
  time_limit: number | null
  training_id: string | null
  created_at: string
  trainings?: { id: string; title: string; category: string } | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const Q_TYPES: { value: QType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'single',     label: 'Opción única',   icon: Circle,      color: '#3B82F6' },
  { value: 'multiple',   label: 'Múltiple',        icon: CheckSquare, color: '#8B5CF6' },
  { value: 'true_false', label: 'Verdadero / Falso', icon: ToggleLeft, color: '#10B981' },
]

const EMPTY_Q = (): Omit<Question, 'id' | 'evaluation_id'> => ({
  text: '',
  type: 'single',
  options: ['', ''],
  correct: [],
  points: 1,
})

// ─── Question Editor ──────────────────────────────────────────────────────────

function QuestionEditor({
  q, index, onSave, onDelete, saving
}: {
  q: Question
  index: number
  onSave: (q: Question) => Promise<void>
  onDelete: (id: string) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<Question>(q)
  const [dirty, setDirty] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setForm(q); setDirty(false) }, [q.id])

  const update = (patch: Partial<Question>) => {
    setForm(f => ({ ...f, ...patch }))
    setDirty(true)
  }

  const setOption = (i: number, val: string) => {
    const opts = [...form.options]
    opts[i] = val
    update({ options: opts })
  }

  const addOption = () => update({ options: [...form.options, ''] })

  const removeOption = (i: number) => {
    const opts = form.options.filter((_, j) => j !== i)
    const correct = form.correct.filter(c => c !== form.options[i])
    update({ options: opts, correct })
  }

  const toggleCorrect = (val: string) => {
    if (form.type === 'single' || form.type === 'true_false') {
      update({ correct: [val] })
    } else {
      const already = form.correct.includes(val)
      update({ correct: already ? form.correct.filter(c => c !== val) : [...form.correct, val] })
    }
  }

  const typeInfo = Q_TYPES.find(t => t.value === form.type)!
  const opts = form.type === 'true_false' ? ['Verdadero', 'Falso'] : form.options

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <GripVertical size={14} className="text-[var(--text-faint)] flex-shrink-0" />
        <span className="text-xs font-bold text-[var(--text-faint)] w-5 flex-shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text)] truncate font-medium">
            {form.text || <span className="text-[var(--text-faint)] italic">Sin pregunta…</span>}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-md font-semibold flex-shrink-0"
          style={{ color: typeInfo.color, background: `${typeInfo.color}18` }}>
          {typeInfo.label}
        </span>
        <span className="text-xs text-[var(--text-faint)] flex-shrink-0">{form.points}pt</span>
        {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
        {expanded ? <ChevronUp size={14} className="text-[var(--text-faint)]" /> : <ChevronDown size={14} className="text-[var(--text-faint)]" />}
      </div>

      {/* Expanded editor */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border)]"
          >
            <div className="p-4 space-y-4">
              {/* Question text */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 block">Enunciado</label>
                <textarea
                  value={form.text}
                  onChange={e => update({ text: e.target.value })}
                  rows={2}
                  placeholder="Escribe la pregunta aquí…"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/40 resize-none transition-all"
                />
              </div>

              {/* Type + points */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 block">Tipo</label>
                  <div className="flex gap-2">
                    {Q_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => update({ type: t.value, correct: [] })}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                        style={form.type === t.value
                          ? { background: `${t.color}25`, borderColor: `${t.color}60`, color: t.color }
                          : { borderColor: 'var(--border)', color: 'var(--text-dim)', background: 'transparent' }
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-20">
                  <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 block">Puntos</label>
                  <input
                    type="number" min={1} max={10} value={form.points}
                    onChange={e => update({ points: Number(e.target.value) })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text)] focus:outline-none focus:border-blue-500/40 text-center transition-all"
                  />
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-dim)] mb-2 block">
                  Opciones <span className="text-[var(--text-faint)] font-normal">(marca la(s) correcta(s))</span>
                </label>
                <div className="space-y-2">
                  {opts.map((opt, i) => {
                    const isCorrect = form.correct.includes(form.type === 'true_false' ? opt : opt)
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCorrect(form.type === 'true_false' ? opt : opt)}
                          className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border transition-all"
                          style={isCorrect
                            ? { background: '#10B98130', borderColor: '#10B981', color: '#10B981' }
                            : { background: 'transparent', borderColor: 'var(--border)', color: 'transparent' }
                          }
                        >
                          <Check size={12} />
                        </button>
                        {form.type === 'true_false' ? (
                          <span className="text-sm text-[var(--text)] flex-1 py-1.5">{opt}</span>
                        ) : (
                          <input
                            value={opt}
                            onChange={e => setOption(i, e.target.value)}
                            placeholder={`Opción ${i + 1}`}
                            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/40 transition-all"
                          />
                        )}
                        {form.type !== 'true_false' && opts.length > 2 && (
                          <button onClick={() => removeOption(i)} className="text-[var(--text-faint)] hover:text-rose-400 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                {form.type !== 'true_false' && form.options.length < 6 && (
                  <button onClick={addOption}
                    className="mt-2 text-xs text-[var(--text-faint)] hover:text-blue-400 transition-colors flex items-center gap-1">
                    <Plus size={12} /> Agregar opción
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {dirty && (
                  <button
                    onClick={async () => { await onSave(form); setDirty(false) }}
                    disabled={saving || !form.text.trim() || form.correct.length === 0}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: '#3B82F6', color: '#fff', opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? 'Guardando…' : 'Guardar pregunta'}
                  </button>
                )}
                <button
                  onClick={() => onDelete(form.id)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{ borderColor: 'var(--border)', color: '#F87171', background: 'rgba(248,113,113,0.08)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── New Question Form ────────────────────────────────────────────────────────

function NewQuestionForm({ evaluationId, onCreated }: { evaluationId: string; onCreated: (q: Question) => void }) {
  const [form, setForm] = useState(EMPTY_Q())
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const update = (patch: Partial<typeof form>) => setForm(f => ({ ...f, ...patch }))

  const setOption = (i: number, val: string) => {
    const opts = [...form.options]; opts[i] = val; update({ options: opts })
  }
  const addOption = () => update({ options: [...form.options, ''] })
  const removeOption = (i: number) => {
    const opts = form.options.filter((_, j) => j !== i)
    const correct = form.correct.filter(c => c !== form.options[i])
    update({ options: opts, correct })
  }
  const toggleCorrect = (val: string) => {
    if (form.type === 'single' || form.type === 'true_false') {
      update({ correct: [val] })
    } else {
      const already = form.correct.includes(val)
      update({ correct: already ? form.correct.filter(c => c !== val) : [...form.correct, val] })
    }
  }

  const save = async () => {
    if (!form.text.trim() || form.correct.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/evaluations/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, evaluation_id: evaluationId }),
      })
      const data = await res.json()
      if (data.id) {
        onCreated(data)
        setForm(EMPTY_Q())
        setOpen(false)
      }
    } finally { setSaving(false) }
  }

  const opts = form.type === 'true_false' ? ['Verdadero', 'Falso'] : form.options
  const typeInfo = Q_TYPES.find(t => t.value === form.type)!

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-dim)] hover:border-blue-500/40 hover:text-blue-400 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
      >
        <Plus size={15} /> Agregar pregunta
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-card)] border-2 border-blue-500/30 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-blue-400">Nueva pregunta</span>
        <button onClick={() => setOpen(false)} className="text-[var(--text-faint)] hover:text-[var(--text)]"><X size={14} /></button>
      </div>

      <textarea
        value={form.text}
        onChange={e => update({ text: e.target.value })}
        rows={2}
        placeholder="Escribe la pregunta…"
        className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/40 resize-none transition-all"
        autoFocus
      />

      <div className="flex gap-3">
        <div className="flex-1 flex gap-2">
          {Q_TYPES.map(t => (
            <button key={t.value} onClick={() => update({ type: t.value, correct: [] })}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={form.type === t.value
                ? { background: `${t.color}25`, borderColor: `${t.color}60`, color: t.color }
                : { borderColor: 'var(--border)', color: 'var(--text-dim)', background: 'transparent' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <input type="number" min={1} max={10} value={form.points}
          onChange={e => update({ points: Number(e.target.value) })}
          className="w-16 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-[var(--text)] focus:outline-none text-center"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--text-dim)]">
          Opciones <span className="text-[var(--text-faint)] font-normal">(✓ = correcta)</span>
        </label>
        {opts.map((opt, i) => {
          const isCorrect = form.correct.includes(opt)
          return (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => toggleCorrect(opt)}
                className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border transition-all"
                style={isCorrect
                  ? { background: '#10B98130', borderColor: '#10B981', color: '#10B981' }
                  : { background: 'transparent', borderColor: 'var(--border)', color: 'transparent' }
                }
              ><Check size={12} /></button>
              {form.type === 'true_false' ? (
                <span className="text-sm text-[var(--text)] flex-1 py-1.5">{opt}</span>
              ) : (
                <input value={opt} onChange={e => setOption(i, e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/40 transition-all"
                />
              )}
              {form.type !== 'true_false' && opts.length > 2 && (
                <button onClick={() => removeOption(i)} className="text-[var(--text-faint)] hover:text-rose-400 transition-colors"><X size={14} /></button>
              )}
            </div>
          )
        })}
        {form.type !== 'true_false' && form.options.length < 6 && (
          <button onClick={addOption} className="text-xs text-[var(--text-faint)] hover:text-blue-400 transition-colors flex items-center gap-1">
            <Plus size={12} /> Agregar opción
          </button>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving || !form.text.trim() || form.correct.length === 0}
        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
        style={{ background: '#3B82F6', color: '#fff', opacity: saving || !form.text.trim() || form.correct.length === 0 ? 0.5 : 1 }}
      >
        {saving ? 'Guardando…' : 'Guardar pregunta'}
      </button>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_EVAL = { title: '', training_id: '', min_score: 70, time_limit: '' }

export default function EvaluationsPage() {
  const [evals, setEvals] = useState<Evaluation[]>([])
  const [trainings, setTrainings] = useState<{ id: string; title: string; category: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Evaluation | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editModal, setEditModal] = useState<Evaluation | null>(null)
  const [form, setForm] = useState(EMPTY_EVAL)
  const [saving, setSaving] = useState(false)
  const [savingQ, setSavingQ] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; error?: string } | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [showSql, setShowSql] = useState(false)

  const SETUP_SQL = `-- Ejecuta esto en Supabase → SQL Editor
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  training_id uuid REFERENCES trainings(id) ON DELETE SET NULL,
  title text NOT NULL,
  min_score integer NOT NULL DEFAULT 70,
  time_limit integer DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid REFERENCES evaluations(id) ON DELETE CASCADE,
  text text NOT NULL,
  type text NOT NULL DEFAULT 'single',
  options jsonb NOT NULL DEFAULT '[]',
  correct jsonb NOT NULL DEFAULT '[]',
  points integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);`

  const load = useCallback(async () => {
    setLoading(true)
    const [evRes, trRes] = await Promise.all([
      fetch('/api/evaluations'),
      fetch('/api/trainings'),
    ])
    const [evData, trData] = await Promise.all([evRes.json(), trRes.json()])
    if (evData?.error && evData.error.includes('does not exist')) {
      setNeedsSetup(true)
    }
    setEvals(Array.isArray(evData) ? evData : [])
    setTrainings(Array.isArray(trData) ? trData.filter((t: any) => t.status !== 'archivado') : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const loadQuestions = async (evalId: string) => {
    setLoadingQ(true)
    const res = await fetch(`/api/evaluations/questions?evaluation_id=${evalId}`)
    const data = await res.json()
    setQuestions(Array.isArray(data) ? data : [])
    setLoadingQ(false)
  }

  const selectEval = (ev: Evaluation) => {
    setSelected(ev)
    loadQuestions(ev.id)
  }

  const createEval = async () => {
    setSaving(true)
    setModalError(null)
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          training_id: form.training_id || null,
          min_score: Number(form.min_score),
          time_limit: form.time_limit ? Number(form.time_limit) : null,
        }),
      })
      const data = await res.json()
      if (data.id) {
        setEvals(prev => [data, ...prev])
        setShowModal(false)
        setForm(EMPTY_EVAL)
        selectEval(data)
      } else {
        const msg = data.error ?? 'Error desconocido'
        setModalError(msg)
        if (msg.includes('does not exist')) setNeedsSetup(true)
      }
    } catch (e: any) {
      setModalError(e.message ?? 'Error de red')
    } finally { setSaving(false) }
  }

  const updateEval = async () => {
    if (!editModal) return
    setSaving(true)
    setModalError(null)
    try {
      const res = await fetch('/api/evaluations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.id,
          title: form.title,
          training_id: form.training_id || null,
          min_score: Number(form.min_score),
          time_limit: form.time_limit ? Number(form.time_limit) : null,
        }),
      })
      const data = await res.json()
      if (data.id) {
        setEvals(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e))
        if (selected?.id === data.id) setSelected(s => s ? { ...s, ...data } : s)
        setEditModal(null)
      } else {
        setModalError(data.error ?? 'Error al guardar')
      }
    } catch (e: any) {
      setModalError(e.message ?? 'Error de red')
    } finally { setSaving(false) }
  }

  const deleteEval = async (id: string) => {
    await fetch('/api/evaluations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setEvals(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) { setSelected(null); setQuestions([]) }
    setDeleteConfirm(null)
  }

  const saveQuestion = async (q: Question) => {
    setSavingQ(true)
    try {
      await fetch('/api/evaluations/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      })
      setQuestions(prev => prev.map(x => x.id === q.id ? q : x))
    } finally { setSavingQ(false) }
  }

  const deleteQuestion = async (id: string) => {
    await fetch('/api/evaluations/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const handleImport = async (file: File) => {
    if (!selected) return
    setImporting(true)
    setImportResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('evaluation_id', selected.id)
    try {
      const res = await fetch('/api/evaluations/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.imported > 0) {
        setQuestions(prev => [...prev, ...(data.questions ?? [])])
        setImportResult({ imported: data.imported })
        setTimeout(() => { setShowImport(false); setImportResult(null) }, 3000)
      } else {
        setImportResult({ imported: 0, error: data.error ?? 'No se encontraron preguntas en el archivo' })
      }
    } catch (e: any) {
      setImportResult({ imported: 0, error: e.message })
    } finally { setImporting(false) }
  }

  const openEdit = (ev: Evaluation) => {
    setEditModal(ev)
    setForm({
      title: ev.title,
      training_id: ev.training_id ?? '',
      min_score: ev.min_score,
      time_limit: ev.time_limit?.toString() ?? '',
    })
    setMenuOpen(null)
  }

  const filtered = evals.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.trainings?.title ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPoints = questions.reduce((a, q) => a + q.points, 0)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto" onClick={() => setMenuOpen(null)}>

      {/* Setup banner */}
      {needsSetup && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border p-4"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-bold text-sm mb-0.5">Las tablas de evaluaciones no existen aún en Supabase</p>
                <p className="text-amber-400/70 text-xs">Copia el SQL y ejecútalo en <strong>Supabase → SQL Editor</strong>, luego recarga la página.</p>
              </div>
            </div>
            <button onClick={() => setShowSql(s => !s)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#FCD34D' }}>
              {showSql ? 'Ocultar SQL' : 'Ver SQL'}
            </button>
          </div>
          {showSql && (
            <div className="mt-3 relative">
              <pre className="text-xs text-emerald-300 bg-black/40 rounded-lg p-3 overflow-x-auto leading-relaxed">{SETUP_SQL}</pre>
              <button
                onClick={() => navigator.clipboard.writeText(SETUP_SQL)}
                className="absolute top-2 right-2 text-xs px-2 py-1 rounded font-semibold transition-all"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7' }}>
                Copiar
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)] mb-1">Banco de Evaluaciones</h1>
            <p className="text-[var(--text-dim)] text-sm">
              {evals.length} evaluación{evals.length !== 1 ? 'es' : ''} · Crea y gestiona preguntas por capacitación
            </p>
          </div>
          <button onClick={() => { setShowModal(true); setForm(EMPTY_EVAL); setModalError(null) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start sm:self-auto"
            style={{ background: '#8B5CF6', color: '#fff' }}>
            <Plus size={16} /> Nueva Evaluación
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Evaluaciones', value: evals.length, color: '#8B5CF6' },
          { label: 'Total preguntas', value: evals.length > 0 ? '—' : 0, color: '#3B82F6', note: 'selecciona una' },
          { label: 'Prom. puntaje mín.', value: evals.length ? `${Math.round(evals.reduce((a, e) => a + e.min_score, 0) / evals.length)}%` : '—', color: '#10B981' },
          { label: 'Con capacitación', value: evals.filter(e => e.training_id).length, color: '#F59E0B' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-[var(--text-dim)] text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-5 min-h-[60vh]">

        {/* Left: evaluation list */}
        <div className="w-80 flex-shrink-0 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar evaluación…"
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-violet-500/40 transition-all" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
              <FileCheck size={32} className="mx-auto mb-3 text-[var(--text-faint)]" />
              <p className="text-[var(--text-dim)] text-sm font-semibold mb-1">Sin evaluaciones</p>
              <p className="text-[var(--text-faint)] text-xs">Crea la primera para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((ev, i) => (
                <motion.div key={ev.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => selectEval(ev)}
                  className="group relative bg-[var(--bg-surface)] border rounded-xl p-4 cursor-pointer transition-all"
                  style={selected?.id === ev.id
                    ? { borderColor: '#8B5CF6', background: 'rgba(139,92,246,0.08)' }
                    : { borderColor: 'var(--border)' }
                  }
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                        <FileCheck size={15} style={{ color: '#8B5CF6' }} />
                      </div>
                      <span className="text-sm font-semibold text-[var(--text)] truncate">{ev.title}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(open => open === ev.id ? null : ev.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/8 text-[var(--text-faint)] transition-all flex-shrink-0"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  {ev.trainings && (
                    <div className="flex items-center gap-1 mb-2">
                      <BookOpen size={11} className="text-[var(--text-faint)]" />
                      <span className="text-xs text-[var(--text-faint)] truncate">{ev.trainings.title}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[var(--text-dim)]">
                    <span className="flex items-center gap-1">
                      <Award size={11} style={{ color: '#10B981' }} /> Min. {ev.min_score}%
                    </span>
                    {ev.time_limit && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} style={{ color: '#F59E0B' }} /> {ev.time_limit} min
                      </span>
                    )}
                  </div>

                  {/* Dropdown */}
                  {menuOpen === ev.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute right-2 top-10 z-20 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-xl shadow-xl overflow-hidden w-40"
                    >
                      <button onClick={() => openEdit(ev)}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-[var(--text-dim)]">
                        <Edit2 size={13} /> Editar
                      </button>
                      <button onClick={() => { setDeleteConfirm(ev.id); setMenuOpen(null) }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-rose-400">
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: question bank */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center py-20 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl"
            >
              <Layers size={48} className="mb-4 text-[var(--text-faint)]" />
              <p className="text-[var(--text-dim)] font-semibold mb-1">Selecciona una evaluación</p>
              <p className="text-[var(--text-faint)] text-sm">para gestionar su banco de preguntas</p>
            </motion.div>
          ) : (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {/* Panel header */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-[var(--text)] mb-1">{selected.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-dim)]">
                      {selected.trainings && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={11} /> {selected.trainings.title}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Award size={11} style={{ color: '#10B981' }} /> Mín. {selected.min_score}%
                      </span>
                      {selected.time_limit && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} style={{ color: '#F59E0B' }} /> {selected.time_limit} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2">
                      <div className="text-xl font-black text-[var(--text)]">{questions.length}</div>
                      <div className="text-[var(--text-faint)] text-xs">preguntas</div>
                    </div>
                    <div className="text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2">
                      <div className="text-xl font-black" style={{ color: '#8B5CF6' }}>{totalPoints}</div>
                      <div className="text-[var(--text-faint)] text-xs">puntos</div>
                    </div>
                  </div>
                </div>

                {/* Type distribution */}
                {questions.length > 0 && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                    {Q_TYPES.map(t => {
                      const n = questions.filter(q => q.type === t.value).length
                      return (
                        <div key={t.value} className="flex items-center gap-1.5 text-xs">
                          <t.icon size={12} style={{ color: t.color }} />
                          <span className="text-[var(--text-dim)]">{t.label}</span>
                          <span className="font-bold" style={{ color: t.color }}>{n}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Questions */}
              {loadingQ ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <QuestionEditor
                      key={q.id}
                      q={q}
                      index={i}
                      onSave={saveQuestion}
                      onDelete={deleteQuestion}
                      saving={savingQ}
                    />
                  ))}
                  {/* Import button */}
                  <button
                    onClick={() => { setShowImport(true); setImportResult(null) }}
                    className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{ borderColor: 'rgba(139,92,246,0.35)', color: '#A78BFA' }}
                  >
                    <Upload size={15} /> Importar preguntas desde Word o PDF
                  </button>

                  <NewQuestionForm
                    evaluationId={selected.id}
                    onCreated={q => setQuestions(prev => [...prev, q])}
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {(showModal || editModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text)] font-bold">
                {editModal ? 'Editar evaluación' : 'Nueva evaluación'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditModal(null); setModalError(null) }} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{modalError.includes('does not exist') ? 'La tabla aún no existe en Supabase. Ejecuta el SQL que aparece en la parte superior de la página.' : modalError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 block">Nombre *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Evaluación Trabajo en Alturas"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-violet-500/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 block">Capacitación asociada</label>
                <select
                  value={form.training_id}
                  onChange={e => setForm(f => ({ ...f, training_id: e.target.value }))}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-violet-500/40 transition-all"
                >
                  <option value="">— Sin capacitación —</option>
                  {trainings.map(t => (
                    <option key={t.id} value={t.id} className="bg-[var(--bg-surface)]">{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 block">Puntaje mínimo (%)</label>
                  <input
                    type="number" min={0} max={100} value={form.min_score}
                    onChange={e => setForm(f => ({ ...f, min_score: Number(e.target.value) }))}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-violet-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-dim)] mb-1.5 block">Tiempo límite (min)</label>
                  <input
                    type="number" min={0} value={form.time_limit}
                    onChange={e => setForm(f => ({ ...f, time_limit: e.target.value }))}
                    placeholder="Sin límite"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-violet-500/40 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowModal(false); setEditModal(null) }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-sm font-semibold transition-all">
                Cancelar
              </button>
              <button
                onClick={editModal ? updateEval : createEval}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: '#8B5CF6', color: '#fff', opacity: saving || !form.title.trim() ? 0.5 : 1 }}
              >
                {saving ? 'Guardando…' : editModal ? 'Guardar cambios' : 'Crear evaluación'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-sm p-6 text-center">
            <AlertCircle size={40} className="mx-auto mb-4 text-rose-400" />
            <h3 className="text-[var(--text)] font-bold mb-2">¿Eliminar evaluación?</h3>
            <p className="text-[var(--text-dim)] text-sm mb-6">Se borrarán también todas sus preguntas. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] text-sm font-semibold">
                Cancelar
              </button>
              <button onClick={() => deleteEval(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#EF4444', color: '#fff' }}>
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Upload size={16} style={{ color: '#A78BFA' }} />
                <h2 className="text-[var(--text)] font-bold">Importar preguntas</h2>
              </div>
              <button onClick={() => { setShowImport(false); setImportResult(null) }}
                className="text-[var(--text-dim)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Format guide */}
              <div className="rounded-xl p-4 text-xs space-y-1.5"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p className="font-bold text-[#A78BFA] mb-2 flex items-center gap-1.5">
                  <FileText size={13} /> Formato del documento
                </p>
                <p className="text-[var(--text-dim)] font-mono leading-relaxed">
                  {'1. Texto de la pregunta\na) Opción incorrecta\nb) Opción correcta *\nc) Opción incorrecta\n\n2. Afirmación V/F\nVerdadero *\nFalso'}
                </p>
                <p className="text-[var(--text-faint)] mt-2">
                  Marca la respuesta correcta con <strong className="text-[#A78BFA]">*</strong> al final. Separa cada pregunta con una línea en blanco.
                </p>
              </div>

              {/* Result */}
              {importResult && (
                <div className="rounded-xl p-3 flex items-start gap-2 text-sm"
                  style={importResult.imported > 0
                    ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }
                    : { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }
                  }>
                  {importResult.imported > 0
                    ? <><CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" /> <span>✓ {importResult.imported} preguntas importadas exitosamente</span></>
                    : <><AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> <span>{importResult.error}</span></>
                  }
                </div>
              )}

              {/* Drop zone */}
              <label
                className="block w-full cursor-pointer"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) handleImport(file)
                }}
              >
                <div className="w-full py-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all"
                  style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.04)' }}>
                  {importing ? (
                    <>
                      <RefreshCw size={28} className="animate-spin" style={{ color: '#A78BFA' }} />
                      <p className="text-sm text-[var(--text-dim)]">Procesando archivo…</p>
                    </>
                  ) : (
                    <>
                      <Upload size={28} style={{ color: '#A78BFA' }} />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[var(--text)]">Arrastra el archivo aquí</p>
                        <p className="text-xs text-[var(--text-faint)] mt-0.5">o haz clic para seleccionar</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold"
                        style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                        .docx · .pdf · .txt
                      </span>
                    </>
                  )}
                </div>
                <input type="file" accept=".docx,.doc,.pdf,.txt" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }}
                  disabled={importing} />
              </label>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
