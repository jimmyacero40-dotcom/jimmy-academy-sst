'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Sparkles, ClipboardPaste, Save, X, Loader2,
  CheckCircle2, Circle, ChevronDown, ChevronUp, GripVertical,
  RotateCcw, AlertCircle, Check
} from 'lucide-react'
import { parseQuestionsFromText, type ParsedQuestion } from '@/lib/question-parser'

// ─── Types ────────────────────────────────────────────────────────────────────

type QType = 'single' | 'true_false'

interface Question {
  id?: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  type: QType
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABELS = 'ABCDEFGH'.split('')
const DEFAULT_OPTS = () => ['', '', '', '']
const TF_OPTS = ['Verdadero', 'Falso']

function detectType(q: { options: string[] }): QType {
  if (q.options.length === 2 && q.options[0] === 'Verdadero') return 'true_false'
  return 'single'
}

function blankQ(): Question {
  return { question: '', options: DEFAULT_OPTS(), correct_index: 0, explanation: '', type: 'single' }
}

// ─── Type Chip ───────────────────────────────────────────────────────────────

function TypeChip({ value, active, onClick, label }: { value: QType; active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: active ? 'var(--primary)' : 'var(--bg-card)',
        color: active ? '#fff' : 'var(--text-dim)',
        border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
      }}>
      {label}
    </button>
  )
}

// ─── Question Form ────────────────────────────────────────────────────────────

function QuestionForm({ initial, onSave, onCancel, saveLabel = 'Guardar pregunta' }: {
  initial?: Partial<Question>
  onSave: (q: Question) => void
  onCancel: () => void
  saveLabel?: string
}) {
  const [q, setQ] = useState<Question>({ ...blankQ(), ...initial })

  const switchType = (type: QType) => {
    setQ(prev => ({
      ...prev, type,
      options: type === 'true_false' ? TF_OPTS : (prev.options.length === 2 ? DEFAULT_OPTS() : prev.options),
      correct_index: 0,
    }))
  }

  const setOpt = (i: number, v: string) =>
    setQ(prev => { const o = [...prev.options]; o[i] = v; return { ...prev, options: o } })

  const addOpt = () => setQ(prev => ({ ...prev, options: [...prev.options, ''] }))

  const removeOpt = (i: number) => setQ(prev => {
    const o = prev.options.filter((_, idx) => idx !== i)
    return { ...prev, options: o, correct_index: Math.min(prev.correct_index, o.length - 1) }
  })

  const canSave = q.question.trim().length > 3 && q.options.filter(o => o.trim()).length >= 2

  return (
    <div className="space-y-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Type */}
      <div className="flex gap-2">
        <TypeChip value="single" active={q.type === 'single'} onClick={() => switchType('single')} label="Opción única" />
        <TypeChip value="true_false" active={q.type === 'true_false'} onClick={() => switchType('true_false')} label="Verdadero / Falso" />
      </div>

      {/* Question text */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
          Pregunta *
        </label>
        <textarea value={q.question}
          onChange={e => setQ(p => ({ ...p, question: e.target.value }))}
          placeholder="Escribe aquí la pregunta..." rows={2}
          className="terra-input resize-none w-full text-sm" />
      </div>

      {/* Options */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-dim)' }}>
          Respuestas — haz clic en el círculo para marcar la correcta
        </label>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setQ(p => ({ ...p, correct_index: i }))}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  borderColor: q.correct_index === i ? '#10B981' : 'var(--border-strong)',
                  background: q.correct_index === i ? '#10B981' : 'transparent',
                }}>
                {q.correct_index === i && <Check size={10} color="#fff" strokeWidth={3} />}
              </button>
              <span className="text-xs font-bold w-4 flex-shrink-0 text-center" style={{ color: 'var(--text-dim)' }}>
                {LABELS[i]}
              </span>
              {q.type === 'true_false'
                ? <div className="terra-input flex-1 py-2 text-sm" style={{ background: 'var(--bg-surface)' }}>{opt}</div>
                : <input value={opt} onChange={e => setOpt(i, e.target.value)}
                    placeholder={`Respuesta ${LABELS[i]}…`}
                    className="terra-input flex-1 text-sm py-2" />
              }
              {q.type !== 'true_false' && q.options.length > 2 && (
                <button onClick={() => removeOpt(i)} className="flex-shrink-0 opacity-50 hover:opacity-100">
                  <X size={13} style={{ color: '#EF4444' }} />
                </button>
              )}
            </div>
          ))}
        </div>
        {q.type !== 'true_false' && q.options.length < 6 && (
          <button onClick={addOpt} className="mt-2 text-xs flex items-center gap-1.5 opacity-60 hover:opacity-100" style={{ color: 'var(--text-dim)' }}>
            <Plus size={12} /> Agregar respuesta
          </button>
        )}
      </div>

      {/* Explanation */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
          Retroalimentación (opcional)
        </label>
        <input value={q.explanation} onChange={e => setQ(p => ({ ...p, explanation: e.target.value }))}
          placeholder="¿Por qué esa es la respuesta correcta?" className="terra-input w-full text-sm" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="terra-btn-outline flex-1 py-2 text-sm justify-center">Cancelar</button>
        <button onClick={() => canSave && onSave(q)} disabled={!canSave}
          className="terra-btn flex-1 py-2 text-sm justify-center disabled:opacity-40">
          <Save size={13} /> {saveLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Question Card (collapsed view) ──────────────────────────────────────────

function QuestionCard({ q, index, onEdit, onDelete }: {
  q: Question; index: number; onEdit: () => void; onDelete: () => void
}) {
  const correct = q.options[q.correct_index] || '—'
  return (
    <div className="group rounded-xl p-3.5 transition-all"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
          style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary)' }}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
            {q.question}
          </p>
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}>
            <Check size={11} strokeWidth={3} /> {correct}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {q.type === 'true_false' ? 'Verdadero / Falso' : `${q.options.filter(o => o.trim()).length} opciones`}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-dim)', background: 'var(--bg-surface)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Paste Preview ─────────────────────────────────────────────────────────────

function PastePreview({ parsed, onImport, onBack }: {
  parsed: ParsedQuestion[]
  onImport: (qs: Question[]) => void
  onBack: () => void
}) {
  const [list, setList] = useState<ParsedQuestion[]>(parsed)
  const [selecting, setSelecting] = useState<Set<number>>(new Set(Array.from({ length: parsed.length }, (_, i) => i)))

  const setCorrect = (qi: number, ci: number) =>
    setList(prev => prev.map((q, i) => i === qi ? { ...q, correct_index: ci } : q))

  const toggleSelect = (i: number) =>
    setSelecting(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })

  const canImport = [...selecting].every(i => list[i].correct_index >= 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            Se detectaron {list.length} preguntas
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Selecciona la respuesta correcta de cada una antes de importar.
          </p>
        </div>
        <button onClick={onBack} className="text-xs flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
          <RotateCcw size={12} /> Editar texto
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {list.map((q, qi) => (
          <div key={qi}
            className="rounded-xl p-3.5 space-y-2"
            style={{
              background: selecting.has(qi) ? 'var(--bg-card)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selecting.has(qi) ? 'var(--border)' : 'var(--border)'}`,
              opacity: selecting.has(qi) ? 1 : 0.45,
            }}>
            <div className="flex items-start gap-2.5">
              <button onClick={() => toggleSelect(qi)}
                className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                style={{ borderColor: selecting.has(qi) ? 'var(--primary)' : 'var(--border-strong)', background: selecting.has(qi) ? 'var(--primary)' : 'transparent' }}>
                {selecting.has(qi) && <Check size={9} color="#fff" strokeWidth={3} />}
              </button>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                <span className="font-bold mr-1.5" style={{ color: 'var(--text-faint)' }}>{qi + 1}.</span>
                {q.question}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 ml-6">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => setCorrect(qi, oi)}
                  className="text-left px-2.5 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: q.correct_index === oi ? 'rgba(16,185,129,0.15)' : 'var(--bg-surface)',
                    border: `1px solid ${q.correct_index === oi ? '#10B981' : 'var(--border)'}`,
                    color: q.correct_index === oi ? '#10B981' : 'var(--text)',
                  }}>
                  <span className="font-bold mr-1" style={{ color: 'var(--text-faint)' }}>{LABELS[oi]}.</span>
                  {opt}
                </button>
              ))}
            </div>
            {q.correct_index < 0 && selecting.has(qi) && (
              <p className="text-[10px] ml-6" style={{ color: '#F59E0B' }}>⚠ Selecciona la respuesta correcta</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="terra-btn-outline flex-1 py-2 text-sm justify-center">Volver</button>
        <button onClick={() => {
          const qs: Question[] = [...selecting]
            .sort((a, b) => a - b)
            .map(i => ({
              question: list[i].question,
              options: list[i].options,
              correct_index: Math.max(0, list[i].correct_index),
              explanation: list[i].explanation,
              type: list[i].type,
            }))
          onImport(qs)
        }} disabled={!canImport || selecting.size === 0}
          className="terra-btn flex-1 py-2 text-sm justify-center disabled:opacity-40">
          <Check size={13} /> Importar {selecting.size} pregunta{selecting.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}

// ─── Main QuestionBuilder ─────────────────────────────────────────────────────

type Mode = 'list' | 'add' | 'edit' | 'paste' | 'ai'

export function QuestionBuilder({ trainingId, trainingTitle, slideTexts }: {
  trainingId: number
  trainingTitle: string
  slideTexts?: string[]
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState<Mode>('list')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [parsed, setParsed] = useState<ParsedQuestion[] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trainings/${trainingId}`)
      if (res.ok) {
        const data = await res.json()
        const qs: Question[] = (data.questions || []).map((q: any) => ({
          id: q.id,
          question: q.q || q.question || '',
          options: Array.isArray(q.options) ? q.options : [],
          correct_index: q.correct ?? q.correct_index ?? 0,
          explanation: q.explanation || '',
          type: detectType({ options: Array.isArray(q.options) ? q.options : [] }),
        }))
        setQuestions(qs)
      }
    } catch {}
    setLoading(false)
  }, [trainingId])

  useEffect(() => { load() }, [load])

  const saveAll = async (qs: Question[]) => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/trainings/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_id: trainingId, questions: qs }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {}
    setSaving(false)
  }

  const addQuestions = (incoming: Question[]) => {
    const merged = [...questions, ...incoming]
    setQuestions(merged)
    setMode('list')
    setParsed(null)
    setPasteText('')
    saveAll(merged)
  }

  const updateQuestion = (idx: number, q: Question) => {
    const updated = questions.map((old, i) => i === idx ? q : old)
    setQuestions(updated)
    setMode('list')
    setEditIdx(null)
    saveAll(updated)
  }

  const deleteQuestion = (idx: number) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    const updated = questions.filter((_, i) => i !== idx)
    setQuestions(updated)
    saveAll(updated)
  }

  const handleParse = () => {
    const result = parseQuestionsFromText(pasteText)
    if (result.length === 0) {
      alert('No se detectaron preguntas. Revisa el formato del texto.')
      return
    }
    setParsed(result)
  }

  const generateWithAI = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const content = slideTexts?.filter(Boolean).join('\n\n').slice(0, 8000) || trainingTitle
      const res = await fetch('/api/generate-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, topic: trainingTitle }),
      })
      const data = await res.json()
      const quiz = data.training?.quiz || []
      if (quiz.length === 0) { setAiError('La IA no generó preguntas. Intenta de nuevo.'); setAiLoading(false); return }
      const parsedAI: ParsedQuestion[] = quiz.map((q: any) => ({
        question: q.q || q.question || '',
        options: Array.isArray(q.options) ? q.options : [],
        correct_index: q.correct ?? q.correct_index ?? 0,
        explanation: q.explanation || '',
        type: 'single' as const,
      }))
      setParsed(parsedAI)
      setMode('ai')
    } catch (e: any) {
      setAiError('Error al conectar con la IA. Intenta de nuevo.')
    }
    setAiLoading(false)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-faint)' }} />
    </div>
  )

  // Edit existing question
  if (mode === 'edit' && editIdx !== null) return (
    <div>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-dim)' }}>Editando pregunta {editIdx + 1}</p>
      <QuestionForm
        initial={questions[editIdx]}
        saveLabel="Guardar cambios"
        onSave={q => updateQuestion(editIdx, q)}
        onCancel={() => { setMode('list'); setEditIdx(null) }}
      />
    </div>
  )

  // Add new question
  if (mode === 'add') return (
    <div>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-dim)' }}>Nueva pregunta</p>
      <QuestionForm
        saveLabel="Agregar pregunta"
        onSave={q => addQuestions([q])}
        onCancel={() => setMode('list')}
      />
    </div>
  )

  // Smart paste / AI preview
  if ((mode === 'paste' || mode === 'ai') && parsed) return (
    <PastePreview parsed={parsed}
      onImport={addQuestions}
      onBack={() => { setParsed(null); if (mode === 'ai') setMode('list'); else setParsed(null) }} />
  )

  // Smart paste input
  if (mode === 'paste') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Pegar preguntas</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            Copia desde Word, PDF, ChatGPT, Google Docs o cualquier editor.
          </p>
        </div>
        <button onClick={() => setMode('list')} style={{ color: 'var(--text-dim)' }}><X size={16} /></button>
      </div>

      <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--text-dim)' }}>
        <p className="font-semibold" style={{ color: 'var(--text)' }}>Formatos reconocidos automáticamente:</p>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {['A) B) C) D)', 'A. B. C. D.', '1. 2. 3. 4.', '• viñetas', '- guiones', 'Verdadero / Falso'].map(f => (
            <span key={f} className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)' }}>{f}</span>
          ))}
        </div>
      </div>

      <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
        placeholder={`¿Cuál es el EPP obligatorio para trabajo en alturas?\n\nA) Casco de seguridad\nB) Arnés de cuerpo completo\nC) Guantes de cuero\nD) Tapones auditivos\n\n¿Qué norma regula el trabajo en alturas?\n\nA) Resolución 1409 de 2012\nB) Resolución 2400 de 1979\n...`}
        rows={12} className="terra-input w-full resize-none text-sm font-mono" />

      <div className="flex gap-2">
        <button onClick={() => setMode('list')} className="terra-btn-outline flex-1 py-2.5 text-sm justify-center">Cancelar</button>
        <button onClick={handleParse} disabled={!pasteText.trim()}
          className="terra-btn flex-1 py-2.5 text-sm justify-center disabled:opacity-40">
          <ClipboardPaste size={14} /> Detectar preguntas
        </button>
      </div>
    </div>
  )

  // ─── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1">
          <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
            {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
          </span>
          {saved && (
            <span className="ml-2 text-xs" style={{ color: '#10B981' }}>✓ Guardadas</span>
          )}
          {saving && (
            <span className="ml-2 text-xs flex items-center gap-1 inline-flex" style={{ color: 'var(--text-faint)' }}>
              <Loader2 size={10} className="animate-spin" /> Guardando...
            </span>
          )}
        </div>
        <button onClick={() => generateWithAI()} disabled={aiLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.25)' }}>
          {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generar con IA
        </button>
        <button onClick={() => setMode('paste')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <ClipboardPaste size={12} /> Pegar texto
        </button>
        <button onClick={() => setMode('add')}
          className="terra-btn px-3 py-1.5 text-xs">
          <Plus size={12} /> Agregar
        </button>
      </div>

      {aiError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle size={13} /> {aiError}
        </div>
      )}

      {/* Question list */}
      {questions.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ border: '2px dashed var(--border)' }}>
          <CheckCircle2 size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Sin preguntas todavía</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            Agrega preguntas manualmente, pega texto desde cualquier fuente o genera con IA.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setMode('paste')} className="terra-btn-outline px-3 py-1.5 text-xs">
              <ClipboardPaste size={12} /> Pegar texto
            </button>
            <button onClick={() => setMode('add')} className="terra-btn px-3 py-1.5 text-xs">
              <Plus size={12} /> Agregar pregunta
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <QuestionCard key={i} q={q} index={i}
              onEdit={() => { setEditIdx(i); setMode('edit') }}
              onDelete={() => deleteQuestion(i)} />
          ))}
        </div>
      )}
    </div>
  )
}
