'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCheck, Plus, Edit2, Trash2, X, Loader2, AlertCircle,
  BookOpen, ChevronRight, Check, Minus
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
  duration: number | null
  required?: boolean
}

const EMPTY_FORM = { name: '', cargo: '', description: '' }

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Profile | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Trainings panel
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [assigned, setAssigned] = useState<Training[]>([])
  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [loadingTrainings, setLoadingTrainings] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

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
    if (tRes.ok) setAllTrainings(await tRes.json())
    setLoadingTrainings(false)
  }, [])

  useEffect(() => { loadProfiles() }, [])
  useEffect(() => {
    if (activeProfile) loadTrainings(activeProfile.id)
  }, [activeProfile, loadTrainings])

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true) }
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
    if (!confirm('¿Eliminar este perfil? Los cursos asignados a él se desvinculan.')) return
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

  const assignedIds = new Set(assigned.map(t => t.id))

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-dim)' }}>
              <UserCheck size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Perfiles de Formación</h1>
          </div>
          <p className="text-sm ml-12" style={{ color: 'var(--text-dim)' }}>
            Define qué cursos son obligatorios según el cargo o rol del trabajador
          </p>
        </div>
        <button onClick={openCreate} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
          <Plus size={15} /> Nuevo perfil
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      <div className="flex gap-5">

        {/* Profiles list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : profiles.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--primary-dim)' }}>
                <UserCheck size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin perfiles creados</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
                Crea perfiles para definir qué cursos debe tomar cada tipo de cargo
              </p>
              <button onClick={openCreate} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
                <Plus size={15} /> Crear primer perfil
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile, i) => (
                <motion.div key={profile.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setActiveProfile(activeProfile?.id === profile.id ? null : profile)}
                  className="terra-card p-4 cursor-pointer group"
                  style={{
                    borderColor: activeProfile?.id === profile.id ? 'var(--primary-border)' : undefined,
                    background: activeProfile?.id === profile.id ? 'var(--primary-dim)' : undefined,
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(139,92,246,0.12)' }}>
                      <UserCheck size={16} style={{ color: '#8B5CF6' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{profile.name}</div>
                      <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
                        {profile.cargo && <span>{profile.cargo}</span>}
                        {profile.cargo && profile.description && <span>·</span>}
                        {profile.description && <span className="truncate">{profile.description}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1"
                        style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}>
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
                        transform: activeProfile?.id === profile.id ? 'rotate(90deg)' : 'none',
                        transition: 'transform .2s',
                      }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Trainings panel */}
        <AnimatePresence>
          {activeProfile && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: 360 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="flex-shrink-0 overflow-hidden" style={{ minWidth: 0 }}>
              <div className="w-[360px] rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeProfile.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      {assigned.length} curso{assigned.length !== 1 ? 's' : ''} asignado{assigned.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button onClick={() => setActiveProfile(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-faint)', background: 'var(--bg-card)' }}>
                    <X size={13} />
                  </button>
                </div>

                {loadingTrainings ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : allTrainings.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
                    No hay cursos disponibles.<br />Crea cursos en Capacitaciones primero.
                  </div>
                ) : (
                  <div className="overflow-y-auto p-3" style={{ maxHeight: 520 }}>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1"
                      style={{ color: 'var(--text-faint)' }}>
                      Activar / desactivar cursos
                    </div>
                    {allTrainings.map(t => {
                      const active = assignedIds.has(t.id)
                      const toggling = togglingId === t.id
                      return (
                        <div key={t.id}
                          onClick={() => !toggling && toggleTraining(t)}
                          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all mb-1"
                          style={{
                            background: active ? 'rgba(139,92,246,0.08)' : 'transparent',
                            border: `1px solid ${active ? 'rgba(139,92,246,0.2)' : 'transparent'}`,
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-card)' }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>

                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              background: active ? 'rgba(139,92,246,0.2)' : 'var(--bg-card)',
                              border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                            }}>
                            {toggling ? (
                              <Loader2 size={12} className="animate-spin" style={{ color: '#A78BFA' }} />
                            ) : active ? (
                              <Check size={12} style={{ color: '#A78BFA' }} />
                            ) : (
                              <Minus size={12} style={{ color: 'var(--text-faint)' }} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate"
                              style={{ color: active ? '#C4B5FD' : 'var(--text)' }}>
                              {t.title}
                            </div>
                            {t.duration && (
                              <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                                {t.duration} min
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
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
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="ej. Perfil Operario, Perfil Directivo"
                      className="terra-input"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Cargo asociado (opcional)
                    </label>
                    <input
                      type="text"
                      value={form.cargo}
                      onChange={e => setForm({ ...form, cargo: e.target.value })}
                      placeholder="ej. Auxiliar de producción, Jefe de área"
                      className="terra-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe a quién aplica este perfil..."
                      rows={2}
                      className="terra-input resize-none"
                    />
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
