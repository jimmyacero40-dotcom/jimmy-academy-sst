'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, Edit2, Trash2, X, Loader2, AlertCircle,
  ChevronLeft, GripVertical, Star, Clock, Tag, Check, Save,
  ChevronRight, LayoutGrid, Columns, AlertTriangle, BookOpen,
  ToggleLeft, ToggleRight, RotateCcw, FileText, Users, ArrowRight,
  GraduationCap
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────
interface Plan {
  id: string
  name: string
  year: number
  status: string
  profile_id: string | null
  item_count: number
}

interface TrainingProfile {
  id: string
  name: string
}

interface ProfileTraining {
  id: number
  title: string
  duration: string | null
  category: string | null
  required: boolean
  sort_order: number
}

interface PlanItem {
  id: string
  plan_id?: string
  month: number
  scheduled_date: string | null
  end_date: string | null
  periodicity: string
  required: boolean
  valid_days: number | null
  estado: string
  reinduccion: boolean
  observaciones: string | null
  modalidad: string
  trainings: { id: number; title: string; duration: string | null; category: string | null }
  plan_item_targets: { id: string; target_type: string; target_id: string | null }[]
}

const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_OPTS = ['pendiente','programada','en_curso','completada','cancelada','postergada']
const ESTADO_LABELS: Record<string,string> = {
  pendiente:'Pendiente', programada:'Programada', en_curso:'En curso',
  completada:'Completada', cancelada:'Cancelada', postergada:'Postergada',
}
const ESTADO_COLORS: Record<string,string> = {
  pendiente:'#6B7280', programada:'#3B82F6', en_curso:'#F59E0B',
  completada:'#10B981', cancelada:'#EF4444', postergada:'#8B5CF6',
}

const PERIOD_OPTS = ['once','monthly','quarterly','biannual','annual']
const PERIOD_LABELS: Record<string,string> = {
  once:'Una vez', monthly:'Mensual', quarterly:'Trimestral',
  biannual:'Semestral', annual:'Anual',
}

const CAT_COLORS: Record<string,string> = {
  'SST':'#10B981','Seguridad':'#EF4444','Salud':'#EC4899',
  'Ambiental':'#84CC16','Calidad':'#3B82F6','Alturas':'#F59E0B',
  'Primeros Auxilios':'#F97316',
}
function catColor(cat: string | null) { return CAT_COLORS[cat ?? ''] ?? '#8B5CF6' }

// ── Pill component ─────────────────────────────────────────────────────────
function StatePill({ estado }: { estado: string }) {
  const color = ESTADO_COLORS[estado] ?? '#6B7280'
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '20', color, border: `1px solid ${color}30` }}>
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  )
}

// ── Plan-item card in calendar ─────────────────────────────────────────────
function ItemChip({
  item, selected, onClick, onRemove, dragging, onDragStart, onDragEnd,
}: {
  item: PlanItem; selected: boolean; dragging: boolean
  onClick: () => void; onRemove: () => void
  onDragStart: () => void; onDragEnd: () => void
}) {
  const color = catColor(item.trainings.category)
  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart() }}
      onDragEnd={e => { e.stopPropagation(); onDragEnd() }}
      onClick={e => { e.stopPropagation(); onClick() }}
      className="group/chip relative select-none"
      style={{ opacity: dragging ? 0.4 : 1, cursor: 'grab' }}>
      <div className="rounded-lg px-2 py-1.5 transition-all"
        style={{
          background: selected ? color + '22' : color + '12',
          border: `1px solid ${selected ? color + '60' : color + '30'}`,
        }}>
        <div className="flex items-center gap-1 min-w-0">
          {item.required && <Star size={8} style={{ color: '#FCD34D', flexShrink: 0 }} fill="#FCD34D" />}
          <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)', flex: 1, minWidth: 0 }}>
            {item.trainings.title}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FCA5A5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}>
            <X size={9} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StatePill estado={item.estado} />
          {item.trainings.duration && (
            <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--text-faint)' }}>
              <Clock size={7} />{item.trainings.duration}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Side panel ─────────────────────────────────────────────────────────────
function SidePanel({
  item, planId, onClose, onSaved, onDeleted,
}: {
  item: PlanItem; planId: string
  onClose: () => void
  onSaved: (updated: PlanItem) => void
  onDeleted: (id: string) => void
}) {
  const [form, setForm] = useState({
    month: item.month,
    scheduled_date: item.scheduled_date ?? '',
    end_date: item.end_date ?? '',
    estado: item.estado,
    required: item.required,
    reinduccion: item.reinduccion,
    periodicity: item.periodicity,
    valid_days: item.valid_days ?? '',
    modalidad: item.modalidad,
    observaciones: item.observaciones ?? '',
    target_type: item.plan_item_targets[0]?.target_type ?? 'all',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/plans/${planId}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: item.id,
        month: form.month,
        scheduled_date: form.scheduled_date || null,
        end_date: form.end_date || null,
        estado: form.estado,
        required: form.required,
        reinduccion: form.reinduccion,
        periodicity: form.periodicity,
        valid_days: form.valid_days !== '' ? Number(form.valid_days) : null,
        modalidad: form.modalidad,
        observaciones: form.observaciones || null,
        target_type: form.target_type,
      }),
    })
    if (res.ok) onSaved(await res.json())
    setSaving(false)
  }

  const remove = async () => {
    if (!confirm('¿Eliminar esta capacitación del plan?')) return
    setDeleting(true)
    const res = await fetch(`/api/plans/${planId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id }),
    })
    if (res.ok) onDeleted(item.id)
    setDeleting(false)
  }

  const color = catColor(item.trainings.category)

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden shadow-2xl"
      style={{ width: 360, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>

      {/* Header */}
      <div className="flex items-start gap-3 p-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: color + '18', border: `1px solid ${color}30` }}>
          <BookOpen size={14} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm leading-snug" style={{ color: 'var(--text)' }}>
            {item.trainings.title}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {item.trainings.category}{item.trainings.duration ? ` · ${item.trainings.duration}` : ''}
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mes */}
        <div>
          <label className="field-label">Mes</label>
          <select value={form.month} onChange={e => f('month', Number(e.target.value))} className="terra-input">
            {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Fecha inicio</label>
            <input type="date" value={form.scheduled_date} onChange={e => f('scheduled_date', e.target.value)} className="terra-input" />
          </div>
          <div>
            <label className="field-label">Fecha fin</label>
            <input type="date" value={form.end_date} onChange={e => f('end_date', e.target.value)} className="terra-input" />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="field-label">Estado</label>
          <select value={form.estado} onChange={e => f('estado', e.target.value)} className="terra-input">
            {ESTADO_OPTS.map(s => <option key={s} value={s}>{ESTADO_LABELS[s]}</option>)}
          </select>
        </div>

        {/* Modalidad + Periodicidad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Modalidad</label>
            <select value={form.modalidad} onChange={e => f('modalidad', e.target.value)} className="terra-input">
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="mixta">Mixta</option>
              <option value="e-learning">E-learning</option>
            </select>
          </div>
          <div>
            <label className="field-label">Periodicidad</label>
            <select value={form.periodicity} onChange={e => f('periodicity', e.target.value)} className="terra-input">
              {PERIOD_OPTS.map(p => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
            </select>
          </div>
        </div>

        {/* Dirigido a */}
        <div>
          <label className="field-label">Dirigido a</label>
          <select value={form.target_type} onChange={e => f('target_type', e.target.value)} className="terra-input">
            <option value="all">Toda la empresa</option>
            <option value="area">Por área</option>
            <option value="group">Por grupo</option>
            <option value="profile">Por perfil</option>
          </select>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          {[
            { key: 'required', label: 'Obligatoria', tc: '#FCD34D' },
            { key: 'reinduccion', label: 'Es reinducción', tc: '#A78BFA' },
          ].map(({ key, label, tc }) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
              <button onClick={() => f(key, !(form as any)[key])}>
                {(form as any)[key]
                  ? <ToggleRight size={20} style={{ color: tc }} />
                  : <ToggleLeft size={20} style={{ color: 'var(--text-faint)' }} />}
              </button>
            </div>
          ))}
        </div>

        {/* Observaciones */}
        <div>
          <label className="field-label">Observaciones</label>
          <textarea rows={3} value={form.observaciones}
            onChange={e => f('observaciones', e.target.value)}
            placeholder="Notas adicionales..."
            className="terra-input resize-none" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={remove} disabled={deleting}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'var(--red-dim)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
        <button onClick={save} disabled={saving} className="terra-btn flex-1 text-sm">
          {saving ? <><Loader2 size={13} className="animate-spin" />Guardando...</> : <><Save size={13} />Guardar</>}
        </button>
      </div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PlanPage() {
  const [plans, setPlans]               = useState<Plan[]>([])
  const [profiles, setProfiles]         = useState<TrainingProfile[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  // Create modal
  const [showCreate, setShowCreate]     = useState(false)
  const [form, setForm]                 = useState({ name: '', year: new Date().getFullYear(), profile_id: '' })
  const [saving, setSaving]             = useState(false)

  // Editor
  const [editingPlan, setEditingPlan]     = useState<Plan | null>(null)
  const [items, setItems]                 = useState<PlanItem[]>([])
  const [profileTrainings, setProfileTrainings] = useState<ProfileTraining[]>([])
  const [loadingEditor, setLoadingEditor] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [selectedItem, setSelectedItem]   = useState<PlanItem | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  // Active profile in the left panel (can be changed without affecting the plan record)
  const [activePanelProfile, setActivePanelProfile] = useState<string>('')

  // DnD
  const [dragSrc, setDragSrc]             = useState<{ type: 'pool' | 'item'; id: number | string } | null>(null)
  const [dragOverMonth, setDragOverMonth] = useState<number | null>(null)
  const dragCounter                       = useRef<Record<number, number>>({})

  // ── Load ────────────────────────────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    setLoading(true)
    const [pRes, prRes] = await Promise.all([
      fetch('/api/plans'),
      fetch('/api/profiles'),
    ])
    if (pRes.ok) setPlans(await pRes.json())
    if (prRes.ok) setProfiles(await prRes.json())
    setLoading(false)
  }, [])

  const openEditor = useCallback(async (plan: Plan) => {
    setEditingPlan(plan)
    setLoadingEditor(true)
    setSelectedItem(null)
    setItems([])
    setProfileTrainings([])

    const startProfileId = plan.profile_id ?? ''
    setActivePanelProfile(startProfileId)

    const [iRes, ptRes] = await Promise.all([
      fetch(`/api/plans/${plan.id}/items`),
      startProfileId ? fetch(`/api/profiles/${startProfileId}/trainings`) : Promise.resolve(null),
    ])
    if (iRes.ok) setItems(await iRes.json())
    if (ptRes?.ok) {
      const data = await ptRes.json()
      setProfileTrainings([...data].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
    }
    setLoadingEditor(false)
  }, [])

  // Switch profile in the left panel
  const switchPanelProfile = useCallback(async (profileId: string) => {
    setActivePanelProfile(profileId)
    if (!profileId) { setProfileTrainings([]); return }
    setLoadingProfile(true)
    const res = await fetch(`/api/profiles/${profileId}/trainings`)
    if (res.ok) {
      const data = await res.json()
      setProfileTrainings([...data].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
    }
    setLoadingProfile(false)
  }, [])

  useEffect(() => { loadPlans() }, [loadPlans])

  // ── Plan CRUD ────────────────────────────────────────────────────────────
  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, year: form.year, profile_id: form.profile_id || null }),
    })
    if (res.ok) {
      const plan = await res.json()
      setPlans(prev => [plan, ...prev])
      setShowCreate(false)
      openEditor(plan)
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Error al crear')
    }
    setSaving(false)
  }

  const deletePlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan anual y todos sus items?')) return
    setDeleting(id)
    const res = await fetch('/api/plans', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    if (res.ok) setPlans(prev => prev.filter(p => p.id !== id))
    else setError('No se pudo eliminar el plan')
    setDeleting(null)
  }

  // ── Item operations ──────────────────────────────────────────────────────
  const addItem = async (trainingId: number, month: number) => {
    if (!editingPlan) return
    // If this training is already scheduled, move it instead of duplicating
    const existing = items.find(i => i.trainings.id === trainingId)
    if (existing) {
      if (existing.month !== month) await moveItem(existing.id, month)
      return
    }
    const res = await fetch(`/api/plans/${editingPlan.id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ training_id: trainingId, month }),
    })
    if (res.ok) {
      const newItem = await res.json()
      setItems(prev => [...prev, newItem])
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Error al agregar')
    }
  }

  const moveItem = async (itemId: string, newMonth: number) => {
    if (!editingPlan) return
    const res = await fetch(`/api/plans/${editingPlan.id}/items`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, month: newMonth }),
    })
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, month: newMonth } : i))
      if (selectedItem?.id === itemId) setSelectedItem(si => si ? { ...si, month: newMonth } : si)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!editingPlan) return
    const res = await fetch(`/api/plans/${editingPlan.id}/items`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId }),
    })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== itemId))
      if (selectedItem?.id === itemId) setSelectedItem(null)
    }
  }

  // ── DnD handlers ─────────────────────────────────────────────────────────
  const onMonthDragOver = (e: React.DragEvent, month: number) => {
    e.preventDefault()
    if (dragSrc) setDragOverMonth(month)
  }

  const onMonthDragEnter = (month: number) => {
    dragCounter.current[month] = (dragCounter.current[month] ?? 0) + 1
    if (dragSrc) setDragOverMonth(month)
  }

  const onMonthDragLeave = (month: number) => {
    dragCounter.current[month] = Math.max(0, (dragCounter.current[month] ?? 0) - 1)
    if (dragCounter.current[month] === 0 && dragOverMonth === month) setDragOverMonth(null)
  }

  const onMonthDrop = (e: React.DragEvent, month: number) => {
    e.preventDefault()
    setDragOverMonth(null)
    dragCounter.current = {}
    if (!dragSrc) return
    if (dragSrc.type === 'pool') {
      addItem(dragSrc.id as number, month)
    } else {
      moveItem(dragSrc.id as string, month)
    }
    setDragSrc(null)
  }

  // ── Map training id → scheduled month ───────────────────────────────────
  const trainingMonthMap = new Map(items.map(i => [i.trainings.id, i.month]))

  // ── EDITOR VIEW ──────────────────────────────────────────────────────────
  if (editingPlan) {
    const itemsByMonth: Record<number, PlanItem[]> = {}
    for (let m = 1; m <= 12; m++) itemsByMonth[m] = items.filter(i => i.month === m)
    const totalCompleted = items.filter(i => i.estado === 'completada').length

    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingPlan(null); setSelectedItem(null) }}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)' }}>
              <ChevronLeft size={15} /> Planes
            </button>
            <span style={{ color: 'var(--border)' }}>/</span>
            <div>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{editingPlan.name}</span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-faint)' }}>{editingPlan.year}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-faint)' }}>
            <span>{items.length} capacitaciones</span>
            {totalCompleted > 0 && (
              <span className="flex items-center gap-1">
                <Check size={10} className="text-emerald-400" />{totalCompleted} completadas
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
              {editingPlan.status}
            </span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT: Profile selector + courses ────────────────────────── */}
          <div className="flex flex-col overflow-hidden border-r flex-shrink-0"
            style={{ width: 236, borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>

            {/* Profile selector */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Perfil
              </div>
              <select
                value={activePanelProfile}
                onChange={e => switchPanelProfile(e.target.value)}
                className="terra-input text-xs py-1.5 w-full">
                <option value="">— Selecciona un perfil —</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Course list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {loadingProfile ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              ) : !activePanelProfile ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                  <GraduationCap size={22} className="mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                    Selecciona un perfil para ver sus cursos y arrastrarlos al calendario
                  </p>
                </div>
              ) : profileTrainings.length === 0 ? (
                <p className="text-[10px] text-center py-8 px-3" style={{ color: 'var(--text-faint)' }}>
                  Este perfil no tiene cursos asignados. Ve a Perfiles de Formación para agregarlos.
                </p>
              ) : (
                profileTrainings.map(t => {
                  const color = catColor(t.category)
                  const scheduledMonth = trainingMonthMap.get(t.id)
                  const isScheduled = scheduledMonth !== undefined
                  return (
                    <div key={t.id}
                      draggable
                      onDragStart={() => setDragSrc({ type: 'pool', id: t.id })}
                      onDragEnd={() => setDragSrc(null)}
                      style={{ cursor: 'grab' }}>
                      <div className="rounded-xl px-2 py-1.5 transition-all"
                        style={{
                          background: isScheduled ? color + '18' : color + '0d',
                          border: `1px solid ${isScheduled ? color + '40' : color + '20'}`,
                        }}>
                        <div className="flex items-center gap-1 min-w-0">
                          {t.required && <Star size={8} fill="#FCD34D" style={{ color: '#FCD34D', flexShrink: 0 }} />}
                          <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)' }}>{t.title}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[9px] truncate" style={{ color: 'var(--text-faint)' }}>{t.category}</span>
                          {isScheduled ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1"
                              style={{ background: color + '20', color, border: `1px solid ${color}30` }}>
                              {MONTHS_FULL[scheduledMonth - 1].slice(0, 3)}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1 rounded flex-shrink-0 ml-1" style={{ color: 'var(--text-faint)' }}>
                              Sin prog.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {activePanelProfile && profileTrainings.length > 0 && (
              <div className="px-2 pb-2 text-[9px] text-center flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                Arrastra a un mes → · arrastrar reprograma
              </div>
            )}
          </div>

          {/* ── RIGHT: Calendar grid ────────────────────────────────────── */}
          <div className="flex-1 overflow-auto p-3">
            {loadingEditor ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2" style={{ minWidth: 640 }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                  const monthItems = itemsByMonth[month] ?? []
                  const isOver = dragOverMonth === month
                  return (
                    <div key={month}
                      onDragOver={e => onMonthDragOver(e, month)}
                      onDragEnter={() => onMonthDragEnter(month)}
                      onDragLeave={() => onMonthDragLeave(month)}
                      onDrop={e => onMonthDrop(e, month)}
                      className="rounded-xl overflow-hidden transition-all"
                      style={{
                        background: isOver ? 'rgba(59,130,246,0.06)' : 'var(--bg-surface)',
                        border: isOver ? '1.5px dashed #3B82F6' : '1px solid var(--border)',
                        minHeight: 140,
                      }}>
                      <div className="flex items-center justify-between px-3 py-2"
                        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                        <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                          {MONTHS_FULL[month - 1]}
                        </span>
                        <div className="flex items-center gap-1">
                          {monthItems.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
                              {monthItems.length}
                            </span>
                          )}
                          {isOver && <span className="text-[10px] font-bold" style={{ color: '#3B82F6' }}>+</span>}
                        </div>
                      </div>
                      <div className="p-1.5 space-y-1">
                        {monthItems.map(item => (
                          <ItemChip
                            key={item.id}
                            item={item}
                            selected={selectedItem?.id === item.id}
                            dragging={dragSrc?.type === 'item' && dragSrc.id === item.id}
                            onClick={() => setSelectedItem(s => s?.id === item.id ? null : item)}
                            onRemove={() => removeItem(item.id)}
                            onDragStart={() => setDragSrc({ type: 'item', id: item.id })}
                            onDragEnd={() => { setDragSrc(null); setDragOverMonth(null) }}
                          />
                        ))}
                        {monthItems.length === 0 && !isOver && (
                          <div className="h-10 flex items-center justify-center">
                            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Sin capacitaciones</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {selectedItem && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.3)' }}
                onClick={() => setSelectedItem(null)} />
              <SidePanel
                key={selectedItem.id}
                item={selectedItem}
                planId={editingPlan.id}
                onClose={() => setSelectedItem(null)}
                onSaved={updated => {
                  setItems(prev => prev.map(i =>
                    i.id === updated.id
                      ? { ...updated, trainings: i.trainings, plan_item_targets: updated.plan_item_targets ?? i.plan_item_targets }
                      : i
                  ))
                  setSelectedItem(null)
                }}
                onDeleted={id => {
                  setItems(prev => prev.filter(i => i.id !== id))
                  setSelectedItem(null)
                }}
              />
            </>
          )}
        </AnimatePresence>

        {error && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl text-sm shadow-xl"
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
            <AlertCircle size={13} /> {error}
            <button onClick={() => setError('')} className="ml-2"><X size={12} /></button>
          </div>
        )}
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear()
  const plansByYear: Record<number, Plan[]> = {}
  for (const p of plans) {
    if (!plansByYear[p.year]) plansByYear[p.year] = []
    plansByYear[p.year].push(p)
  }
  const years = Object.keys(plansByYear).map(Number).sort((a, b) => b - a)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Plan Anual de Capacitaciones
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Organiza las capacitaciones por mes con drag & drop.
            </p>
          </div>
          <button onClick={() => {
            setForm({ name: `Plan SST ${currentYear}`, year: currentYear, profile_id: '' })
            setShowCreate(true)
          }} className="terra-btn self-start" style={{ padding: '10px 18px', fontSize: 13 }}>
            <Plus size={15} /> Nuevo plan
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : plans.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
            style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Calendar size={24} style={{ color: '#3B82F6' }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin planes creados</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Crea el primer plan anual y empieza a programar capacitaciones
          </p>
          <button onClick={() => {
            setForm({ name: `Plan SST ${currentYear}`, year: currentYear, profile_id: '' })
            setShowCreate(true)
          }} className="terra-btn mx-auto">
            <Plus size={14} /> Crear plan {currentYear}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {years.map(year => (
            <div key={year}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                  {year}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="grid gap-2">
                {plansByYear[year].map((plan, i) => {
                  const profile = profiles.find(p => p.id === plan.profile_id)
                  return (
                    <motion.div key={plan.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openEditor(plan)}
                      className="terra-card p-4 cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                          <Calendar size={16} style={{ color: '#3B82F6' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{plan.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                              style={{ background: 'rgba(59,130,246,0.08)', color: '#93C5FD' }}>
                              {plan.status}
                            </span>
                          </div>
                          <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-faint)' }}>
                            <span className="flex items-center gap-1">
                              <BookOpen size={9} /> {plan.item_count} capacitaciones
                            </span>
                            {profile && (
                              <span className="flex items-center gap-1">
                                <GraduationCap size={9} /> {profile.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => deletePlan(plan.id)} disabled={deleting === plan.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FCA5A5'; (e.currentTarget as HTMLElement).style.background = 'var(--red-dim)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                            {deleting === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                        <ArrowRight size={14} style={{ color: 'var(--text-faint)' }} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create plan modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-md pointer-events-auto rounded-2xl p-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Nuevo plan anual</h2>
                  <button onClick={() => setShowCreate(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
                    <X size={15} />
                  </button>
                </div>
                <form onSubmit={createPlan} className="space-y-4">
                  <div>
                    <label className="field-label">Nombre del plan *</label>
                    <input type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="ej. Plan SST 2026"
                      className="terra-input" autoFocus />
                  </div>
                  <div>
                    <label className="field-label">Año *</label>
                    <input type="number" value={form.year} min={2020} max={2040}
                      onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                      className="terra-input" />
                  </div>
                  <div>
                    <label className="field-label">
                      Perfil de formación <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <select value={form.profile_id}
                      onChange={e => setForm({ ...form, profile_id: e.target.value })} className="terra-input">
                      <option value="">Sin perfil — plan libre</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
                      Si eliges un perfil, sus cursos aparecerán en el panel lateral para arrastrarlos al calendario.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="terra-btn-outline flex-1">Cancelar</button>
                    <button type="submit" disabled={saving || !form.name.trim()} className="terra-btn flex-1">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : 'Crear y programar →'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
