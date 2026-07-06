'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, GripVertical, Plus, Trash2, Save, Eye,
  BookOpen, FileCheck, Settings, Download, AlertCircle,
  Clock, ToggleLeft, CheckSquare, Loader2, X, Check,
  SlidersHorizontal, Layers, Sparkles
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  id: number
  slide_index: number
  slide_text: string
}

interface Question {
  id: number
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

interface Block {
  id: string
  block_type: 'slide' | 'question'
  position: number
  title: string | null
  description: string | null
  is_active: boolean
  is_required: boolean
  minimum_seconds: number
  slide_id: number | null
  question_id: number | null
  // Joined data
  training_slides?: { id: number; slide_index: number; slide_text: string } | null
  training_questions?: Question | null
  // UI only — temp id before save
  _tempId?: string
  _unsaved?: boolean
}

interface Training {
  id: number
  title: string
  eval_mode?: string
  version?: number
}

const EVAL_MODES = [
  { value: 'final_only',  label: 'Solo evaluación final',        desc: 'Flujo actual. Quiz al terminar todas las diapositivas.' },
  { value: 'inline_only', label: 'Solo preguntas en experiencia', desc: 'Preguntas inline durante la capacitación. Sin quiz final.' },
  { value: 'mixed',       label: 'Mixto',                        desc: 'Preguntas inline + evaluación final al terminar.' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ExperienceDesigner() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const trainingId = parseInt(id as string)

  const [training, setTraining]   = useState<Training | null>(null)
  const [slides, setSlides]       = useState<Slide[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [blocks, setBlocks]       = useState<Block[]>([])
  const [evalMode, setEvalMode]   = useState('final_only')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Drag state
  const [dragging, setDragging]   = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState<number | null>(null)

  // Selected block for properties panel
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Question picker
  const [showQPicker, setShowQPicker]       = useState(false)
  const [insertAfterPos, setInsertAfterPos] = useState<number | null>(null)

  // ─── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => { loadAll() }, [trainingId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [trRes, qRes] = await Promise.all([
        fetch(`/api/trainings/${trainingId}`),
        fetch(`/api/trainings/${trainingId}`), // same endpoint has questions + blocks
      ])
      const trData = await trRes.json()
      setTraining(trData.training)
      setEvalMode(trData.training?.eval_mode ?? 'final_only')
      setQuestions(trData.questions ?? [])

      const rawBlocks: Block[] = trData.blocks ?? []

      if (rawBlocks.length > 0) {
        setBlocks(rawBlocks)
      } else {
        // Auto-seed blocks from slides
        const slidesRaw = await fetch(`/api/trainings/${trainingId}`)
          .then(r => r.json())
        const allSlides: Slide[] = (slidesRaw.texts ?? []).map((_: string, i: number) => ({
          id: 0, slide_index: i, slide_text: _,
        }))

        // Fetch actual slide ids
        const slideIds = await fetchSlideIds(trainingId)
        const seeded: Block[] = slideIds.map((s: Slide, i: number) => ({
          id: `temp-${i}`,
          _tempId: `temp-${i}`,
          _unsaved: true,
          block_type: 'slide',
          position: i + 1,
          title: null,
          description: null,
          is_active: true,
          is_required: true,
          minimum_seconds: 0,
          slide_id: s.id,
          question_id: null,
          training_slides: { id: s.id, slide_index: s.slide_index, slide_text: s.slide_text },
        }))
        setBlocks(seeded)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSlideIds = async (tid: number) => {
    // Call the slide API to get actual DB slide records with ids
    const res = await fetch(`/api/trainings/${tid}/slides-list`)
    if (!res.ok) return []
    return res.json()
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragStart = (id: string) => setDragging(id)
  const handleDragEnd   = () => { setDragging(null); setDragOver(null) }

  const handleDrop = (targetPos: number) => {
    if (!dragging) return
    const from = blocks.find(b => b.id === dragging)
    if (!from || from.position === targetPos) return

    setBlocks(prev => {
      const reordered = [...prev]
      const fromIdx = reordered.findIndex(b => b.id === dragging)
      const [moved] = reordered.splice(fromIdx, 1)
      const toIdx = reordered.findIndex(b => b.position >= targetPos)
      reordered.splice(toIdx === -1 ? reordered.length : toIdx, 0, moved)
      return reordered.map((b, i) => ({ ...b, position: i + 1 }))
    })
    setDragging(null)
    setDragOver(null)
  }

  // ─── Insert question ──────────────────────────────────────────────────────

  const openQPicker = (afterPos: number) => {
    setInsertAfterPos(afterPos)
    setShowQPicker(true)
  }

  const insertQuestion = (q: Question) => {
    if (insertAfterPos === null) return
    const newBlock: Block = {
      id: `temp-q-${Date.now()}`,
      _tempId: `temp-q-${Date.now()}`,
      _unsaved: true,
      block_type: 'question',
      position: insertAfterPos + 1,
      title: `Pregunta: ${q.question.slice(0, 40)}…`,
      description: null,
      is_active: true,
      is_required: true,
      minimum_seconds: 0,
      slide_id: null,
      question_id: q.id,
      training_questions: q,
    }
    setBlocks(prev => {
      const updated = prev.map(b =>
        b.position > insertAfterPos ? { ...b, position: b.position + 1 } : b
      )
      return [...updated, newBlock].sort((a, b) => a.position - b.position)
    })
    setShowQPicker(false)
    setInsertAfterPos(null)
  }

  // ─── Remove block ─────────────────────────────────────────────────────────

  const removeBlock = async (block: Block) => {
    if (!block._unsaved && !block.id.startsWith('temp-')) {
      await fetch(`/api/trainings/${trainingId}/blocks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: block.id }),
      })
    }
    setBlocks(prev =>
      prev
        .filter(b => b.id !== block.id)
        .map((b, i) => ({ ...b, position: i + 1 }))
    )
    if (selectedId === block.id) setSelectedId(null)
  }

  // ─── Update block property ────────────────────────────────────────────────

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch, _unsaved: true } : b))
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      // 1. Delete all existing blocks for this training
      const existingSaved = blocks.filter(b => !b._tempId && !b.id.startsWith('temp-'))
      // 2. Upsert all blocks in one call (POST array)
      const payload = blocks.map((b, i) => ({
        block_type: b.block_type,
        position: i + 1,
        title: b.title,
        description: b.description,
        is_active: b.is_active,
        is_required: b.is_required,
        minimum_seconds: b.minimum_seconds,
        slide_id: b.slide_id,
        question_id: b.question_id,
        resource_id: null,
        config: {},
      }))

      // Delete all existing
      if (existingSaved.length > 0) {
        await fetch(`/api/trainings/${trainingId}/blocks/reset`, {
          method: 'DELETE',
        })
      }

      // Post all at once
      const res = await fetch(`/api/trainings/${trainingId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error al guardar bloques')
      }

      // Save eval_mode to training
      await fetch(`/api/trainings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trainingId, eval_mode: evalMode }),
      })

      // Reload to get real IDs
      await loadAll()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Selected block ───────────────────────────────────────────────────────

  const selected = blocks.find(b => b.id === selectedId)

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  const userRole = (session?.user as any)?.role
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: 'var(--text-dim)' }}>Acceso restringido a administradores.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push('/dashboard/trainings')}
          className="p-2 rounded-xl border transition-all hover:bg-white/5 flex-shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>Experience Designer</span>
          </div>
          <h1 className="text-lg font-black truncate" style={{ color: 'var(--text)' }}>
            {training?.title ?? 'Capacitación'}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push(`/dashboard/trainings/${trainingId}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <Eye size={13} /> Vista previa
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: saved ? '#10B981' : '#8B5CF6', color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar experiencia'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5' }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      <div className="flex gap-5">

        {/* ── Left: timeline ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Eval mode */}
          <div className="terra-card p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal size={14} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                Modalidad de evaluación
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {EVAL_MODES.map(m => (
                <button key={m.value} onClick={() => setEvalMode(m.value)}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={evalMode === m.value
                    ? { borderColor: '#8B5CF6', background: 'rgba(139,92,246,.1)' }
                    : { borderColor: 'var(--border)', background: 'transparent' }}>
                  <div className="text-xs font-bold mb-0.5"
                    style={{ color: evalMode === m.value ? '#c4b5fd' : 'var(--text)' }}>
                    {m.label}
                  </div>
                  <div className="text-[10px] leading-tight" style={{ color: 'var(--text-faint)' }}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Block list */}
          <div className="terra-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={14} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                Línea de tiempo — {blocks.length} bloques
              </span>
              <span className="ml-auto text-[10px]" style={{ color: 'var(--text-faint)' }}>
                ⠿ arrastra para reordenar
              </span>
            </div>

            {blocks.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--text-faint)' }}>
                No hay bloques. Sube un PPTX primero para generar la secuencia.
              </div>
            )}

            <div className="space-y-0">
              {blocks.map((block, idx) => (
                <div key={block.id}>
                  {/* Drop zone between blocks */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(block.position) }}
                    onDrop={() => handleDrop(block.position)}
                    className="h-1 rounded-full transition-all mx-8"
                    style={{
                      background: dragOver === block.position ? '#8B5CF6' : 'transparent',
                      height: dragOver === block.position ? 4 : 2,
                    }}
                  />

                  {/* Block row */}
                  <motion.div
                    layout
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedId(block.id === selectedId ? null : block.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-1"
                    style={{
                      background: selectedId === block.id
                        ? block.block_type === 'question' ? 'rgba(139,92,246,.12)' : 'rgba(59,130,246,.1)'
                        : dragging === block.id ? 'rgba(255,255,255,.03)' : 'var(--bg-card)',
                      border: `1px solid ${selectedId === block.id
                        ? block.block_type === 'question' ? 'rgba(139,92,246,.5)' : 'rgba(59,130,246,.4)'
                        : 'var(--border)'}`,
                      opacity: dragging === block.id ? 0.4 : 1,
                    }}
                  >
                    <GripVertical size={14} className="cursor-grab flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                    <span className="text-[10px] font-bold w-5 text-right flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                      {idx + 1}
                    </span>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                      style={{
                        background: block.block_type === 'question' ? 'rgba(139,92,246,.15)' : 'rgba(59,130,246,.12)',
                      }}>
                      {block.block_type === 'question' ? '❓' : '🖼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate"
                        style={{ color: block.block_type === 'question' ? '#c4b5fd' : '#93c5fd' }}>
                        {block.block_type === 'slide'
                          ? (block.title ?? `Diapositiva ${block.training_slides?.slide_index != null ? block.training_slides.slide_index + 1 : idx + 1}`)
                          : (block.title ?? block.training_questions?.question?.slice(0, 50) ?? 'Pregunta')}
                      </div>
                      {block.training_slides?.slide_text && (
                        <div className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                          {block.training_slides.slide_text.slice(0, 60)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {block.minimum_seconds > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: 'rgba(245,158,11,.12)', color: '#fcd34d' }}>
                          ⏱ {block.minimum_seconds}s
                        </span>
                      )}
                      {!block.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: 'rgba(148,163,184,.1)', color: '#64748b' }}>
                          inactivo
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); removeBlock(block) }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/15 transition-colors"
                        style={{ color: '#64748b' }}>
                        <X size={11} />
                      </button>
                    </div>
                  </motion.div>

                  {/* Insert question button after slide blocks */}
                  {block.block_type === 'slide' && (
                    <button
                      onClick={() => openQPicker(block.position)}
                      className="w-full flex items-center justify-center gap-1.5 py-1 mb-1 rounded-lg text-[10px] font-semibold transition-all hover:opacity-100 opacity-40 hover:bg-violet-500/5"
                      style={{ border: '1px dashed rgba(139,92,246,.3)', color: '#a78bfa' }}>
                      <Plus size={10} /> insertar pregunta aquí
                    </button>
                  )}
                </div>
              ))}

              {/* Final drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(99999) }}
                onDrop={() => handleDrop(blocks.length + 1)}
                className="h-2 rounded-full transition-all"
                style={{ background: dragOver === 99999 ? '#8B5CF6' : 'transparent' }}
              />
            </div>
          </div>
        </div>

        {/* ── Right: properties panel ─────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 space-y-3">

          {selected ? (
            <div className="terra-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: selected.block_type === 'question' ? 'rgba(139,92,246,.15)' : 'rgba(59,130,246,.12)' }}>
                  {selected.block_type === 'question' ? '❓' : '🖼'}
                </div>
                <span className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: selected.block_type === 'question' ? '#c4b5fd' : '#93c5fd' }}>
                  {selected.block_type === 'question' ? 'Pregunta' : 'Diapositiva'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Título (admin)
                  </label>
                  <input
                    value={selected.title ?? ''}
                    onChange={e => updateBlock(selected.id, { title: e.target.value || null })}
                    placeholder="Nombre interno…"
                    className="terra-input text-xs py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Tiempo mínimo (seg)
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {[0, 5, 8, 10, 12, 15].map(s => (
                      <button key={s}
                        onClick={() => updateBlock(selected.id, { minimum_seconds: s })}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                        style={selected.minimum_seconds === s
                          ? { background: '#f59e0b', color: '#000' }
                          : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                        {s === 0 ? 'libre' : `${s}s`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Activo</span>
                  <button onClick={() => updateBlock(selected.id, { is_active: !selected.is_active })}
                    className="w-10 h-5 rounded-full transition-all relative"
                    style={{ background: selected.is_active ? '#10B981' : '#374151' }}>
                    <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                      style={{ left: selected.is_active ? '22px' : '2px' }} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Obligatorio</span>
                  <button onClick={() => updateBlock(selected.id, { is_required: !selected.is_required })}
                    className="w-10 h-5 rounded-full transition-all relative"
                    style={{ background: selected.is_required ? '#3B82F6' : '#374151' }}>
                    <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                      style={{ left: selected.is_required ? '22px' : '2px' }} />
                  </button>
                </div>

                {selected.block_type === 'question' && selected.training_questions && (
                  <div className="mt-2 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.2)' }}>
                    <p className="text-[10px] font-bold mb-1" style={{ color: '#a78bfa' }}>Pregunta</p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)', lineHeight: 1.5 }}>
                      {selected.training_questions.question}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {selected.training_questions.options.map((opt, i) => (
                        <div key={i} className="text-[10px] flex items-center gap-1"
                          style={{ color: i === selected.training_questions!.correct_index ? '#6ee7b7' : 'var(--text-faint)' }}>
                          {i === selected.training_questions!.correct_index ? '✓' : '○'} {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="terra-card p-4 text-center">
              <Settings size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Selecciona un bloque para editar sus propiedades
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="terra-card p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-dim)' }}>
              Resumen
            </div>
            <div className="space-y-2">
              {[
                { label: 'Diapositivas', value: blocks.filter(b => b.block_type === 'slide').length, color: '#93c5fd' },
                { label: 'Preguntas inline', value: blocks.filter(b => b.block_type === 'question').length, color: '#c4b5fd' },
                { label: 'Con timer', value: blocks.filter(b => b.minimum_seconds > 0).length, color: '#fcd34d' },
                { label: 'Inactivos', value: blocks.filter(b => !b.is_active).length, color: '#64748b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</span>
                  <span className="text-sm font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question picker modal */}
      <AnimatePresence>
        {showQPicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <FileCheck size={15} style={{ color: '#c4b5fd' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Seleccionar pregunta</span>
                </div>
                <button onClick={() => setShowQPicker(false)} style={{ color: 'var(--text-dim)' }}><X size={16} /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={{ color: 'var(--text-faint)' }}>
                    No hay preguntas guardadas para esta capacitación.
                    <br />Ve a la vista de capacitación y crea preguntas primero.
                  </div>
                ) : (
                  questions.map(q => (
                    <button key={q.id}
                      onClick={() => insertQuestion(q)}
                      className="w-full p-3 rounded-xl border text-left transition-all hover:border-violet-500/50 hover:bg-violet-500/5"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{q.question}</p>
                      <div className="flex flex-wrap gap-1">
                        {q.options.map((opt, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded"
                            style={i === q.correct_index
                              ? { background: 'rgba(16,185,129,.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,.3)' }
                              : { background: 'var(--bg-surface)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                            {i === q.correct_index ? '✓ ' : ''}{opt}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
