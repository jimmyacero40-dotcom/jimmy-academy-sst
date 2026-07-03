'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Plus, Edit2, Trash2, X, Loader2, AlertCircle,
  BookOpen, ChevronRight, Check, Minus, Search, Star, Shield,
  HardHat, Truck, Flame, Heart, Wrench, Users, Tag
} from 'lucide-react'

interface Profile {
  id: string
  name: string
  cargo: string | null
  description: string | null
  training_count: number
  company_id: string
  created_at: string
}

interface Training {
  id: number
  title: string
  description: string | null
  duration: string | null
  category: string | null
  required?: boolean
}

const EMPTY_FORM = { name: '', cargo: '', description: '' }

// SST standard profiles with suggested names and cargos
const SUGGESTED_PROFILES = [
  { name: 'Brigadista SST',          cargo: 'Brigadista de emergencias',  icon: Flame,      color: '#EF4444', desc: 'Manejo de emergencias, primeros auxilios, evacuación' },
  { name: 'Miembro COPASST',         cargo: 'Comité Paritario SST',        icon: Shield,     color: '#3B82F6', desc: 'Investigación de incidentes, inspecciones, capacitación' },
  { name: 'Trabajo en Alturas',      cargo: 'Operario alturas',            icon: HardHat,    color: '#F59E0B', desc: 'Acceso y rescate en alturas, uso de EPP especializado' },
  { name: 'Conductor SST',           cargo: 'Conductor / Operador',        icon: Truck,      color: '#8B5CF6', desc: 'Seguridad vial, manejo defensivo, revisión de vehículo' },
  { name: 'Operario Producción',     cargo: 'Auxiliar de producción',      icon: Wrench,     color: '#10B981', desc: 'Riesgo físico, biomecánico, uso de EPP general' },
  { name: 'Personal Administrativo', cargo: 'Administrativo / Oficina',    icon: Users,      color: '#06B6D4', desc: 'Riesgo ergonómico, psicosocial, evacuación' },
  { name: 'Primeros Auxilios',       cargo: 'Socorrista certificado',      icon: Heart,      color: '#EC4899', desc: 'RCP, manejo de heridas, quemaduras, movilización de víctimas' },
  { name: 'Inducción General',       cargo: 'Nuevo ingreso',               icon: Star,       color: '#A78BFA', desc: 'Requisito de ingreso para todos los trabajadores' },
]

const PROFILE_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#06B6D4','#F97316','#EF4444','#84CC16','#A855F7']

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Profile | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [assigned, setAssigned] = useState<Training[]>([])
  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [loadingTrainings, setLoadingTrainings] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [trainingSearch, setTrainingSearch] = useState('')
  const [requiringId, setRequiringId] = useState<number | null>(null)

  const loadProfiles = async () => {
    setLoading(true)
    const res = await fetch('/api/profiles')
    if (res.ok) setProfiles(await res.json())
    else setError('No se pudieron cargar los perfiles')
    setLoading(false)
  }

  const loadTrainings = useCallback(async (profileId: string) => {
    setLoadingTrainings(true)
    const [aRes, tRes] = await Promise.all([
      fetch(`/api/profiles/${profileId}/trainings`),
      fetch('/api/trainings'),
    ])
    if (aRes.ok) setAssigned(await aRes.json())
    if (tRes.ok) {
      const data = await tRes.json()
      setAllTrainings(Array.isArray(data) ? data.filter((t: any) => t.status !== 'archivado') : [])
    }
    setLoadingTrainings(false)
  }, [])

  useEffect(() => { loadProfiles() }, [])
  useEffect(() => {
    if (activeProfile) { setTrainingSearch(''); loadTrainings(activeProfile.id) }
  }, [activeProfile, loadTrainings])

  const openCreate = (prefill?: Partial<typeof EMPTY_FORM>) => {
    setEditItem(null)
    setForm(prefill ? { name: prefill.name || '', cargo: prefill.cargo || '', description: prefill.description || '' } : EMPTY_FORM)
    setShowModal(true)
  }
  const openEdit = (p: Profile) => {
    setEditItem(p)
    setForm({ name: p.name, cargo: p.cargo || '', description: p.description || '' })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const method = editItem ? 'PUT' : 'POST'
    const body = editItem ? { id: editItem.id, ...form } : form
    const res = await fetch('/api/profiles', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await loadProfiles(); setShowModal(false) }
    else { const err = await res.json(); setError(err.error || 'Error al guardar') }
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
      if (activeProfile?.id === id) setActiveProfile(null)
    } else setError('No se pudo eliminar')
    setDeleting(null)
  }

  const assignedIds = new Set(assigned.map(t => t.id))
  const requiredIds = new Set(assigned.filter(t => t.required !== false).map(t => t.id))

  const toggleTraining = async (training: Training) => {
    if (!activeProfile) return
    const isAssigned = assignedIds.has(training.id)
    setTogglingId(training.id)
    if (isAssigned) {
      await fetch(`/api/profiles/${activeProfile.id}/trainings`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_id: training.id }),
      })
      setAssigned(prev => prev.filter(t => t.id !== training.id))
      setProfiles(prev => prev.map(p =>
        p.id === activeProfile.id ? { ...p, training_count: Math.max(0, p.training_count - 1) } : p
      ))
    } else {
      await fetch(`/api/profiles/${activeProfile.id}/trainings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_id: training.id, required: true }),
      })
      setAssigned(prev => [...prev, { ...training, required: true }])
      setProfiles(prev => prev.map(p =>
        p.id === activeProfile.id ? { ...p, training_count: p.training_count + 1 } : p
      ))
    }
    setTogglingId(null)
  }

  const toggleRequired = async (training: Training, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!activeProfile || !assignedIds.has(training.id)) return
    const currentlyRequired = requiredIds.has(training.id)
    setRequiringId(training.id)
    await fetch(`/api/profiles/${activeProfile.id}/trainings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ training_id: training.id, required: !currentlyRequired }),
    })
    setAssigned(prev => prev.map(t => t.id === training.id ? { ...t, required: !currentlyRequired } : t))
    setRequiringId(null)
  }

  // Group trainings by category
  const categories = [...new Set(allTrainings.map(t => t.category || 'Sin categoría'))]
  const filteredTrainings = allTrainings.filter(t => {
    const q = trainingSearch.toLowerCase()
    return !q || (t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)
  })
  const filteredByCategory = (cat: string) => filteredTrainings.filter(t => (t.category || 'Sin categoría') === cat)

  const profileColor = (i: number) => PROFILE_COLORS[i % PROFILE_COLORS.length]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Perfiles de Formación
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Define qué cursos son obligatorios según el cargo o rol del trabajador
            </p>
          </div>
          <button onClick={() => openCreate()} className="terra-btn self-start" style={{ padding: '10px 18px', fontSize: 13 }}>
            <Plus size={15} /> Nuevo perfil
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      <div className="flex gap-5 flex-col lg:flex-row">

        {/* Left: profiles */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : profiles.length === 0 ? (

            /* Empty state: suggested profiles grid */
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
                  style={{ background: 'rgba(139,92,246,0.1)' }}>
                  <GraduationCap size={24} style={{ color: '#8B5CF6' }} />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin perfiles creados</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
                  Elige uno de los perfiles sugeridos o crea uno personalizado
                </p>
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
                  Perfiles SST sugeridos
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SUGGESTED_PROFILES.map(s => (
                    <button key={s.name} onClick={() => openCreate({ name: s.name, cargo: s.cargo, description: s.desc })}
                      className="terra-card p-3 text-left hover:opacity-90 transition-all group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                        style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                        <s.icon size={15} style={{ color: s.color }} />
                      </div>
                      <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>{s.name}</div>
                      <div className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-faint)' }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

          ) : (
            <>
              {/* Profile cards */}
              <div className="space-y-2 mb-6">
                {profiles.map((profile, i) => {
                  const color = profileColor(i)
                  const isSelected = activeProfile?.id === profile.id
                  return (
                    <motion.div key={profile.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => setActiveProfile(isSelected ? null : profile)}
                      className="terra-card p-4 cursor-pointer group"
                      style={{ borderColor: isSelected ? color + '60' : undefined, background: isSelected ? color + '0a' : undefined }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: color + '18', border: `1px solid ${color}30` }}>
                          <GraduationCap size={16} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{profile.name}</div>
                          <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
                            {profile.cargo && <span className="truncate">{profile.cargo}</span>}
                            {profile.description && (
                              <>
                                {profile.cargo && <span>·</span>}
                                <span className="truncate opacity-70">{profile.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1"
                            style={{ background: color + '18', color }}>
                            <BookOpen size={10} />
                            {profile.training_count} curso{profile.training_count !== 1 ? 's' : ''}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(profile)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ color: 'var(--text-faint)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(profile.id)} disabled={deleting === profile.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ color: 'var(--text-faint)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'var(--red-dim)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                              {deleting === profile.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                          <ChevronRight size={14} style={{
                            color: 'var(--text-faint)',
                            transform: isSelected ? 'rotate(90deg)' : 'none',
                            transition: 'transform .2s',
                          }} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Suggested profiles (collapsed section) */}
              <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
                  Agregar perfil sugerido
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUGGESTED_PROFILES.filter(s => !profiles.some(p => p.name === s.name)).map(s => (
                    <button key={s.name} onClick={() => openCreate({ name: s.name, cargo: s.cargo, description: s.desc })}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all"
                      style={{ background: `${s.color}10`, border: `1px solid ${s.color}25`, color: s.color }}>
                      <s.icon size={12} />
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                  {SUGGESTED_PROFILES.every(s => profiles.some(p => p.name === s.name)) && (
                    <p className="text-xs col-span-4 text-center py-2" style={{ color: 'var(--text-faint)' }}>
                      Todos los perfiles sugeridos ya están creados
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: training assignment panel */}
        <AnimatePresence>
          {activeProfile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="flex-shrink-0" style={{ width: 380 }}>
              <div className="rounded-2xl overflow-hidden sticky top-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeProfile.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      {assigned.length} curso{assigned.length !== 1 ? 's' : ''} asignado{assigned.length !== 1 ? 's' : ''}
                      {' · '}{assigned.filter(t => t.required !== false).length} obligatorio{assigned.filter(t => t.required !== false).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button onClick={() => setActiveProfile(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-faint)', background: 'var(--bg-card)' }}>
                    <X size={13} />
                  </button>
                </div>

                {/* Assigned summary chips */}
                {assigned.length > 0 && (
                  <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex flex-wrap gap-1.5">
                      {assigned.slice(0, 6).map(t => (
                        <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={t.required !== false
                            ? { background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.25)' }
                            : { background: 'var(--bg-card)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                          {t.required !== false ? <Star size={8} fill="currentColor" /> : <Minus size={8} />}
                          {t.title.slice(0, 22)}{t.title.length > 22 ? '…' : ''}
                        </span>
                      ))}
                      {assigned.length > 6 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--text-faint)', background: 'var(--bg-card)' }}>
                          +{assigned.length - 6} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Search */}
                <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                    <input value={trainingSearch} onChange={e => setTrainingSearch(e.target.value)}
                      placeholder="Buscar cursos..."
                      className="terra-input pl-8 py-1.5 text-xs" />
                  </div>
                </div>

                {/* Legend */}
                <div className="px-3 py-1.5 flex items-center gap-3 flex-shrink-0"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                    <Star size={9} className="text-violet-400" fill="currentColor" /> = Obligatorio
                  </span>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                    <Minus size={9} className="text-slate-400" /> = Opcional
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--text-faint)' }}>
                    Clic izq = asignar · Clic ★ = cambiar tipo
                  </span>
                </div>

                {loadingTrainings ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : allTrainings.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
                    No hay cursos activos en la Biblioteca.
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 p-2">
                    {categories.map(cat => {
                      const catTrainings = filteredByCategory(cat)
                      if (!catTrainings.length) return null
                      return (
                        <div key={cat} className="mb-3">
                          <div className="flex items-center gap-1.5 px-1 mb-1.5">
                            <Tag size={9} style={{ color: 'var(--text-faint)' }} />
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{cat}</span>
                          </div>
                          {catTrainings.map(t => {
                            const isAssigned = assignedIds.has(t.id)
                            const isRequired = requiredIds.has(t.id)
                            const toggling = togglingId === t.id
                            const requiring = requiringId === t.id
                            return (
                              <div key={t.id}
                                onClick={() => !toggling && toggleTraining(t)}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all mb-1"
                                style={{
                                  background: isAssigned ? 'rgba(139,92,246,0.08)' : 'transparent',
                                  border: `1px solid ${isAssigned ? 'rgba(139,92,246,0.2)' : 'transparent'}`,
                                }}
                                onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = 'var(--bg-card)' }}
                                onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.background = 'transparent' }}>

                                {/* Check box */}
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                                  style={{
                                    background: isAssigned ? 'rgba(139,92,246,0.2)' : 'var(--bg-card)',
                                    border: `1px solid ${isAssigned ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                                  }}>
                                  {toggling ? (
                                    <Loader2 size={11} className="animate-spin" style={{ color: '#A78BFA' }} />
                                  ) : isAssigned ? (
                                    <Check size={11} style={{ color: '#A78BFA' }} />
                                  ) : (
                                    <Minus size={11} style={{ color: 'var(--text-faint)' }} />
                                  )}
                                </div>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold truncate"
                                    style={{ color: isAssigned ? '#C4B5FD' : 'var(--text)' }}>
                                    {t.title}
                                  </div>
                                  {t.duration && (
                                    <div className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{t.duration}</div>
                                  )}
                                </div>

                                {/* Required toggle (only shown when assigned) */}
                                {isAssigned && (
                                  <button
                                    onClick={e => toggleRequired(t, e)}
                                    disabled={requiring}
                                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                                    title={isRequired ? 'Obligatorio — clic para hacer opcional' : 'Opcional — clic para hacer obligatorio'}
                                    style={{
                                      background: isRequired ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
                                      border: `1px solid ${isRequired ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                                    }}>
                                    {requiring
                                      ? <Loader2 size={9} className="animate-spin" style={{ color: '#FCD34D' }} />
                                      : <Star size={9} style={{ color: isRequired ? '#FCD34D' : 'var(--text-faint)' }} fill={isRequired ? '#FCD34D' : 'none'} />
                                    }
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                    {filteredTrainings.length === 0 && trainingSearch && (
                      <div className="py-8 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
                        Sin resultados para &ldquo;{trainingSearch}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
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
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Nombre del perfil *
                    </label>
                    <input type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="ej. Perfil Operario, Brigadista SST"
                      className="terra-input" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Cargo asociado <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input type="text" value={form.cargo}
                      onChange={e => setForm({ ...form, cargo: e.target.value })}
                      placeholder="ej. Auxiliar de producción, Jefe de área"
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
                    <button type="button" onClick={() => setShowModal(false)} className="terra-btn-outline flex-1">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving || !form.name.trim()} className="terra-btn flex-1">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : editItem ? 'Guardar cambios' : 'Crear perfil'}
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
