'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Plus, Edit2, Trash2, X, Loader2, AlertCircle,
  Search, Star, Shield, HardHat, Truck, Flame, Heart, Wrench,
  Users, BookOpen, ChevronLeft, Save, GripVertical, AlertTriangle,
  Check, ArrowRight, Tag, Clock
} from 'lucide-react'

interface Profile {
  id: string
  name: string
  cargo: string | null
  description: string | null
  training_count: number
  company_id: string
}

interface Training {
  id: number
  title: string
  description: string | null
  duration: string | null
  category: string | null
}

interface Assignment extends Training {
  required: boolean
  sort_order: number
}

const SUGGESTED_PROFILES = [
  { name: 'Brigadista SST',          cargo: 'Brigadista de emergencias',  icon: Flame,  color: '#EF4444' },
  { name: 'Miembro COPASST',         cargo: 'Comité Paritario SST',        icon: Shield, color: '#3B82F6' },
  { name: 'Trabajo en Alturas',      cargo: 'Operario alturas',            icon: HardHat,color: '#F59E0B' },
  { name: 'Conductor SST',           cargo: 'Conductor / Operador',        icon: Truck,  color: '#8B5CF6' },
  { name: 'Operario Producción',     cargo: 'Auxiliar de producción',      icon: Wrench, color: '#10B981' },
  { name: 'Personal Administrativo', cargo: 'Administrativo / Oficina',    icon: Users,  color: '#06B6D4' },
  { name: 'Primeros Auxilios',       cargo: 'Socorrista certificado',      icon: Heart,  color: '#EC4899' },
  { name: 'Inducción General',       cargo: 'Nuevo ingreso',               icon: GraduationCap, color: '#A78BFA' },
]

const PROFILE_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#06B6D4','#F97316','#EF4444']

const CAT_COLORS: Record<string, string> = {
  'SST': '#10B981', 'Seguridad': '#EF4444', 'Salud': '#EC4899',
  'Ambiental': '#84CC16', 'Calidad': '#3B82F6', 'Alturas': '#F59E0B',
  'Primeros Auxilios': '#F97316', 'Sin categoría': '#6B7280',
}
function catColor(cat: string | null) { return CAT_COLORS[cat ?? ''] ?? '#8B5CF6' }

// ── Profile list card ──────────────────────────────────────────────────────
function ProfileCard({
  profile, index, isSelected, onSelect, onEdit, onDelete, deleting,
}: {
  profile: Profile; index: number; isSelected: boolean
  onSelect: () => void; onEdit: () => void
  onDelete: () => void; deleting: boolean
}) {
  const color = PROFILE_COLORS[index % PROFILE_COLORS.length]
  const warn = profile.training_count === 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      onClick={onSelect}
      className="terra-card p-4 cursor-pointer group"
      style={{ borderColor: isSelected ? color + '60' : undefined, background: isSelected ? color + '0a' : undefined }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '18', border: `1px solid ${color}30` }}>
          <GraduationCap size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{profile.name}</span>
            {warn && <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" aria-label="Sin cursos asignados" />}
          </div>
          <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
            <BookOpen size={9} />
            <span>{profile.training_count} curso{profile.training_count !== 1 ? 's' : ''}</span>
            {profile.cargo && <><span>·</span><span className="truncate opacity-75">{profile.cargo}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}>
          <button onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
            <Edit2 size={12} />
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'var(--red-dim)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
        <ChevronLeft size={13} style={{
          color: 'var(--text-faint)',
          transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .2s',
        }} />
      </div>
    </motion.div>
  )
}

// ── Training mini-card ─────────────────────────────────────────────────────
function TrainingCard({
  training, dragging, onDragStart, onDragEnd, assigned, onClick, required, onToggleRequired, onRemove,
  showHandle,
}: {
  training: Training; dragging: boolean; assigned: boolean; showHandle?: boolean
  required?: boolean
  onDragStart: () => void; onDragEnd: () => void
  onClick?: () => void; onToggleRequired?: () => void; onRemove?: () => void
}) {
  const color = catColor(training.category)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="select-none transition-all"
      style={{
        opacity: dragging ? 0.4 : 1,
        cursor: dragging ? 'grabbing' : 'grab',
      }}>
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl group/card"
        style={{
          background: assigned ? `${color}10` : 'var(--bg-card)',
          border: `1px solid ${assigned ? color + '30' : 'var(--border)'}`,
        }}
        onMouseEnter={e => { if (!dragging) (e.currentTarget as HTMLElement).style.borderColor = color + '60' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = assigned ? color + '30' : 'var(--border)' }}>

        {showHandle && (
          <GripVertical size={13} className="flex-shrink-0 cursor-grab" style={{ color: 'var(--text-faint)' }} />
        )}

        {/* Color dot = category */}
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />

        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{training.title}</div>
          <div className="text-[10px] flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {training.category && <span>{training.category}</span>}
            {training.duration && <><span>·</span><Clock size={8} /><span>{training.duration}</span></>}
          </div>
        </div>

        {assigned && onToggleRequired && (
          <button
            onClick={e => { e.stopPropagation(); onToggleRequired() }}
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all opacity-0 group/card-hover:opacity-100"
            style={{
              background: required ? 'rgba(245,158,11,0.15)' : 'var(--bg-surface)',
              border: `1px solid ${required ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
            }}
            title={required ? 'Obligatorio — clic para hacer opcional' : 'Opcional — clic para hacer obligatorio'}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { }}>
            <Star size={9} style={{ color: required ? '#FCD34D' : 'var(--text-faint)' }} fill={required ? '#FCD34D' : 'none'} />
          </button>
        )}
        {assigned && onRemove && (
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)' }}>
            <X size={10} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ProfilesPage() {
  const [profiles, setProfiles]       = useState<Profile[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [deleting, setDeleting]       = useState<string | null>(null)

  // Modal (create/edit profile metadata)
  const [showModal, setShowModal]     = useState(false)
  const [editItem, setEditItem]       = useState<Profile | null>(null)
  const [form, setForm]               = useState({ name: '', cargo: '', description: '' })
  const [saving, setSaving]           = useState(false)

  // Editor
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [allTrainings, setAllTrainings]     = useState<Training[]>([])
  const [assigned, setAssigned]             = useState<Assignment[]>([])
  const [loadingEditor, setLoadingEditor]   = useState(false)
  const [search, setSearch]                 = useState('')
  const [savingEditor, setSavingEditor]     = useState(false)
  const [editorSaved, setEditorSaved]       = useState(false)

  // DnD state
  const [dragSrc, setDragSrc]         = useState<{ col: 'pool' | 'assigned'; id: number } | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null) // insert before this index in assigned
  const [dragOverPool, setDragOverPool] = useState(false)
  const dragCounter                     = useRef(0)
  // Sync dedup guard: tracks IDs currently being inserted (survives React state batching)
  const insertingIds                    = useRef<Set<number>>(new Set())

  // ── Data loading ────────────────────────────────────────────────────────
  const loadProfiles = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/profiles')
    if (res.ok) setProfiles(await res.json())
    else setError('No se pudieron cargar los perfiles')
    setLoading(false)
  }, [])

  const openEditor = useCallback(async (profile: Profile) => {
    setEditingProfile(profile)
    setLoadingEditor(true)
    const [aRes, tRes] = await Promise.all([
      fetch(`/api/profiles/${profile.id}/trainings`),
      fetch('/api/trainings'),
    ])
    const aData = aRes.ok ? await aRes.json() : []
    const tData = tRes.ok ? await tRes.json() : []
    const active = Array.isArray(tData) ? tData.filter((t: any) => t.status !== 'archivado') : []

    // Build assigned list sorted by sort_order
    const sorted = [...aData].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    setAssigned(sorted.map((t: any, i: number) => ({ ...t, required: t.required !== false, sort_order: i })))
    setAllTrainings(active)
    setLoadingEditor(false)
    setSearch('')
    setEditorSaved(false)
  }, [])

  useEffect(() => { loadProfiles() }, [loadProfiles])

  // ── Profile CRUD ─────────────────────────────────────────────────────────
  const openCreate = (prefill?: Partial<typeof form>) => {
    setEditItem(null)
    setForm(prefill ? { name: prefill.name || '', cargo: prefill.cargo || '', description: prefill.description || '' } : { name: '', cargo: '', description: '' })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const method = editItem ? 'PUT' : 'POST'
    const body   = editItem ? { id: editItem.id, ...form } : form
    const res = await fetch('/api/profiles', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      await loadProfiles()
      setShowModal(false)
      if (!editItem) {
        // Auto-open editor for new profile
        const created = await res.json().catch(() => null)
        if (created?.id) openEditor({ ...created, training_count: 0 })
      }
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este perfil? Los cursos asignados se desvinculan.')) return
    setDeleting(id)
    const res = await fetch('/api/profiles', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setProfiles(prev => prev.filter(p => p.id !== id))
      if (editingProfile?.id === id) setEditingProfile(null)
    } else setError('No se pudo eliminar')
    setDeleting(null)
  }

  // ── Editor: save bulk assignment ─────────────────────────────────────────
  const saveAssignments = async () => {
    if (!editingProfile) return
    setSavingEditor(true)
    const res = await fetch(`/api/profiles/${editingProfile.id}/trainings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: assigned.map((t, i) => ({ training_id: t.id, required: t.required, sort_order: i })),
      }),
    })
    if (res.ok) {
      setEditorSaved(true)
      setTimeout(() => setEditorSaved(false), 2500)
      // Update count in list
      setProfiles(prev => prev.map(p =>
        p.id === editingProfile.id ? { ...p, training_count: assigned.length } : p
      ))
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Error al guardar')
    }
    setSavingEditor(false)
  }

  // ── DnD helpers ──────────────────────────────────────────────────────────
  const assignedIds = new Set(assigned.map(t => t.id))

  // Pool: ALL trainings (library never loses courses), filtered by search only
  const pool = allTrainings.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.title.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)
  })

  // Categories for pool
  const categories = [...new Set(pool.map(t => t.category || 'Sin categoría'))]

  const moveFromPoolToAssigned = (trainingId: number, beforeIndex?: number) => {
    const training = allTrainings.find(t => t.id === trainingId)
    if (!training) return
    // Sync guard: block if already inserting this id (survives React state batching)
    if (insertingIds.current.has(trainingId)) return
    // State guard: block if already in the assigned list
    if (assignedIds.has(trainingId)) return
    insertingIds.current.add(trainingId)
    const newAssignment: Assignment = { ...training, required: true, sort_order: assigned.length }
    if (beforeIndex !== undefined && beforeIndex >= 0 && beforeIndex <= assigned.length) {
      const next = [...assigned]
      next.splice(beforeIndex, 0, newAssignment)
      setAssigned(next)
    } else {
      setAssigned(prev => {
        // Final guard inside functional updater (catches any remaining race)
        if (prev.some(t => t.id === trainingId)) return prev
        return [...prev, newAssignment]
      })
    }
    // Release after React flushes the update
    setTimeout(() => insertingIds.current.delete(trainingId), 0)
  }

  const moveFromAssignedToPool = (trainingId: number) => {
    setAssigned(prev => prev.filter(t => t.id !== trainingId))
  }

  const reorderAssigned = (fromId: number, beforeIndex: number | null) => {
    const fromIdx = assigned.findIndex(t => t.id === fromId)
    if (fromIdx === -1) return
    const item = assigned[fromIdx]
    const without = assigned.filter(t => t.id !== fromId)
    if (beforeIndex === null || beforeIndex >= without.length) {
      setAssigned([...without, item])
    } else {
      const result = [...without]
      const targetIdx = beforeIndex > fromIdx ? beforeIndex - 1 : beforeIndex
      result.splice(Math.max(0, targetIdx), 0, item)
      setAssigned(result)
    }
  }

  const toggleRequired = (trainingId: number) => {
    setAssigned(prev => prev.map(t => t.id === trainingId ? { ...t, required: !t.required } : t))
  }

  // ── Pool DnD handlers ─────────────────────────────────────────────────────
  const onPoolDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (dragSrc?.col === 'assigned') setDragOverPool(true)
  }
  const onPoolDragLeave = () => { dragCounter.current--; if (dragCounter.current <= 0) setDragOverPool(false) }
  const onPoolDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPool(false)
    dragCounter.current = 0
    if (dragSrc?.col === 'assigned') moveFromAssignedToPool(dragSrc.id)
    setDragSrc(null)
  }

  // ── Assigned column DnD handlers ──────────────────────────────────────────
  const onAssignedDragOver = (e: React.DragEvent, beforeIndex: number) => {
    e.preventDefault()
    setDragOverSlot(beforeIndex)
  }
  const onAssignedColumnDrop = (e: React.DragEvent, beforeIndex: number | null) => {
    e.preventDefault()
    e.stopPropagation() // prevent bubbling to parent drop zones
    setDragOverSlot(null)
    if (!dragSrc) return
    if (dragSrc.col === 'pool') {
      moveFromPoolToAssigned(dragSrc.id, beforeIndex ?? undefined)
    } else {
      reorderAssigned(dragSrc.id, beforeIndex)
    }
    setDragSrc(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const noProfiles = !loading && profiles.length === 0

  // ── EDITOR VIEW ──────────────────────────────────────────────────────────
  if (editingProfile) {
    const obligatory = assigned.filter(t => t.required).length
    const optional   = assigned.filter(t => !t.required).length

    return (
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">

        {/* Editor header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingProfile(null)}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)' }}>
              <ChevronLeft size={15} /> Perfiles
            </button>
            <span style={{ color: 'var(--border)' }}>/</span>
            <div>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{editingProfile.name}</span>
              {editingProfile.cargo && (
                <span className="text-xs ml-2" style={{ color: 'var(--text-faint)' }}>{editingProfile.cargo}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-faint)' }}>
              <span className="flex items-center gap-1">
                <Star size={10} className="text-amber-400" fill="#FCD34D" /> {obligatory} obligatorio{obligatory !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Star size={10} style={{ color: 'var(--text-faint)' }} /> {optional} opcional{optional !== 1 ? 'es' : ''}
              </span>
            </div>
            <button
              onClick={saveAssignments}
              disabled={savingEditor}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={editorSaved
                ? { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }
                : { background: 'var(--amber)', color: '#000' }}>
              {savingEditor
                ? <><Loader2 size={13} className="animate-spin" />Guardando...</>
                : editorSaved
                  ? <><Check size={13} />Guardado</>
                  : <><Save size={13} />Guardar ({assigned.length} cursos)</>}
            </button>
          </div>
        </div>

        {loadingEditor ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (

          /* Two-column editor */
          <div className="flex-1 flex overflow-hidden">

            {/* ── LEFT: Pool ──────────────────────────────────────────── */}
            <div
              className="flex flex-col overflow-hidden border-r"
              style={{
                width: 340, flexShrink: 0,
                borderColor: 'var(--border)',
                background: dragOverPool ? 'rgba(239,68,68,0.04)' : 'var(--bg-surface)',
                transition: 'background .15s',
              }}
              onDragOver={onPoolDragOver}
              onDragEnter={() => { dragCounter.current++; if (dragSrc?.col === 'assigned') setDragOverPool(true) }}
              onDragLeave={onPoolDragLeave}
              onDrop={onPoolDrop}>

              {/* Pool header */}
              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                    Biblioteca ({allTrainings.length} cursos)
                  </span>
                  {dragSrc?.col === 'assigned' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                      ← suelta aquí para quitar
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar cursos..."
                    className="terra-input pl-8 py-1.5 text-xs w-full"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-4">
                {categories.length === 0 && search ? (
                  <p className="text-center py-8 text-xs" style={{ color: 'var(--text-faint)' }}>
                    Sin resultados para "{search}"
                  </p>
                ) : categories.length === 0 ? (
                  <p className="text-center py-8 text-xs" style={{ color: 'var(--text-faint)' }}>
                    La biblioteca no tiene cursos activos
                  </p>
                ) : (
                  categories.map(cat => {
                    const items = pool.filter(t => (t.category || 'Sin categoría') === cat)
                    if (!items.length) return null
                    return (
                      <div key={cat} className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: catColor(cat) }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                            {cat}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {items.map(t => {
                            const alreadyIn = assignedIds.has(t.id)
                            return (
                              <div key={t.id} className="relative">
                                <TrainingCard
                                  training={t}
                                  dragging={dragSrc?.id === t.id && dragSrc.col === 'pool'}
                                  assigned={false}
                                  onDragStart={() => !alreadyIn && setDragSrc({ col: 'pool', id: t.id })}
                                  onDragEnd={() => { setDragSrc(null); setDragOverSlot(null) }}
                                  onClick={() => {
                                    if (!alreadyIn) moveFromPoolToAssigned(t.id)
                                  }}
                                />
                                {alreadyIn && (
                                  <div className="absolute inset-0 rounded-xl flex items-center justify-end pr-2 pointer-events-none"
                                    style={{ background: 'rgba(16,185,129,0.07)' }}>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                                      <Check size={7} /> En perfil
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT: Assigned ─────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                    Perfil: {editingProfile.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>
                    {assigned.length} cursos
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--text-faint)' }}>
                    ★ = obligatorio · arrastra para reordenar
                  </span>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 pb-4"
                onDragOver={e => onAssignedDragOver(e, assigned.length)}
                onDrop={e => onAssignedColumnDrop(e, null)}>

                {assigned.length === 0 ? (
                  <div
                    className="h-full min-h-40 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverSlot(0) }}
                    onDrop={e => { e.stopPropagation(); onAssignedColumnDrop(e, 0) }}>
                    <ArrowRight size={24} className="mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Arrastra cursos aquí</p>
                    <p className="text-xs mt-1 opacity-60">o haz clic en un curso de la izquierda</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {assigned.map((t, i) => (
                      <div key={t.id}>
                        {/* Drop slot BEFORE this item */}
                        <div
                          className="transition-all"
                          style={{ height: dragOverSlot === i && dragSrc ? 36 : 4 }}
                          onDragOver={e => { e.stopPropagation(); onAssignedDragOver(e, i) }}
                          onDrop={e => { e.stopPropagation(); onAssignedColumnDrop(e, i) }}>
                          {dragOverSlot === i && dragSrc && (
                            <div className="mx-2 h-8 rounded-xl border-2 border-dashed flex items-center justify-center"
                              style={{ borderColor: 'var(--primary)', background: 'var(--primary-dim)' }}>
                              <span className="text-xs" style={{ color: 'var(--primary)' }}>Soltar aquí</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold w-5 text-right flex-shrink-0"
                            style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
                          <div className="flex-1">
                            <TrainingCard
                              training={t}
                              dragging={dragSrc?.id === t.id && dragSrc.col === 'assigned'}
                              assigned
                              required={t.required}
                              showHandle
                              onDragStart={() => setDragSrc({ col: 'assigned', id: t.id })}
                              onDragEnd={() => { setDragSrc(null); setDragOverSlot(null) }}
                              onToggleRequired={() => toggleRequired(t.id)}
                              onRemove={() => moveFromAssignedToPool(t.id)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Drop slot at the END */}
                    <div
                      className="transition-all"
                      style={{ height: dragOverSlot === assigned.length && dragSrc ? 36 : 8 }}
                      onDragOver={e => { e.stopPropagation(); onAssignedDragOver(e, assigned.length) }}
                      onDrop={e => { e.stopPropagation(); onAssignedColumnDrop(e, null) }}>
                      {dragOverSlot === assigned.length && dragSrc && (
                        <div className="mx-2 h-8 rounded-xl border-2 border-dashed flex items-center justify-center"
                          style={{ borderColor: 'var(--primary)', background: 'var(--primary-dim)' }}>
                          <span className="text-xs" style={{ color: 'var(--primary)' }}>Agregar al final</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Perfiles de Formación
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Define qué cursos debe recibir cada cargo. Haz clic en un perfil para editarlo.
            </p>
          </div>
          <button onClick={() => openCreate()} className="terra-btn self-start" style={{ padding: '10px 18px', fontSize: 13 }}>
            <Plus size={15} /> Nuevo perfil
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
      ) : noProfiles ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center py-8 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
              style={{ background: 'rgba(139,92,246,0.1)' }}>
              <GraduationCap size={24} style={{ color: '#8B5CF6' }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin perfiles creados</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
              Elige un perfil sugerido o crea uno personalizado
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUGGESTED_PROFILES.map(s => (
              <button key={s.name} onClick={() => openCreate({ name: s.name, cargo: s.cargo })}
                className="terra-card p-4 text-left hover:opacity-90 transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                  <s.icon size={15} style={{ color: s.color }} />
                </div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{s.name}</div>
                <div className="text-[10px] mt-0.5 opacity-60" style={{ color: 'var(--text-dim)' }}>{s.cargo}</div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Flow guide */}
          <div className="flex items-center gap-2 mb-5 text-xs px-3 py-2 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--text-dim)' }}>
            <Tag size={11} className="text-blue-400 flex-shrink-0" />
            <span>Haz clic en un perfil para abrir el editor de cursos con drag & drop</span>
          </div>

          <div className="space-y-2 mb-6">
            {profiles.map((profile, i) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                index={i}
                isSelected={false}
                onSelect={() => openEditor(profile)}
                onEdit={() => {
                  setEditItem(profile)
                  setForm({ name: profile.name, cargo: profile.cargo || '', description: profile.description || '' })
                  setShowModal(true)
                }}
                onDelete={() => handleDelete(profile.id)}
                deleting={deleting === profile.id}
              />
            ))}
          </div>

          {/* Suggested remaining */}
          {SUGGESTED_PROFILES.some(s => !profiles.find(p => p.name === s.name)) && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
                Agregar perfil sugerido
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROFILES.filter(s => !profiles.find(p => p.name === s.name)).map(s => (
                  <button key={s.name} onClick={() => openCreate({ name: s.name, cargo: s.cargo })}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: `${s.color}10`, border: `1px solid ${s.color}25`, color: s.color }}>
                    <s.icon size={11} /> {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/edit profile modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-md pointer-events-auto rounded-2xl p-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                    {editItem ? 'Editar perfil' : 'Nuevo perfil de formación'}
                  </h2>
                  <button onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
                    <X size={15} />
                  </button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Nombre del perfil *</label>
                    <input type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="ej. Operario de Producción, Brigadista SST"
                      className="terra-input" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Cargo asociado <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input type="text" value={form.cargo}
                      onChange={e => setForm({ ...form, cargo: e.target.value })}
                      placeholder="ej. Auxiliar de producción"
                      className="terra-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Descripción <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <textarea value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe a quién aplica este perfil..."
                      rows={2} className="terra-input resize-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="terra-btn-outline flex-1">Cancelar</button>
                    <button type="submit" disabled={saving || !form.name.trim()} className="terra-btn flex-1">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : editItem ? 'Guardar cambios' : 'Crear y editar cursos →'}
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
