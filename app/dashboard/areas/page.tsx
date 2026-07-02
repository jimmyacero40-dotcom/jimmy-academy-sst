'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Plus, Edit2, Trash2, X, Loader2, AlertCircle,
  Users, UserPlus, UserMinus, ChevronRight, Search
} from 'lucide-react'

interface Area {
  id: string
  name: string
  description: string | null
  color: string
  company_id: string
  created_at: string
}

interface AreaMember {
  id: string
  name: string
  email: string
  cedula: string
  area: string | null
  role: string
  active: boolean
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
]

const EMPTY_FORM = { name: '', description: '', color: '#3B82F6' }

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function AreasPage() {
  const [areas, setAreas]     = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Create/edit modal
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState<Area | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)

  // Members panel
  const [activeArea, setActiveArea]         = useState<Area | null>(null)
  const [members, setMembers]               = useState<AreaMember[]>([])
  const [allUsers, setAllUsers]             = useState<AreaMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [memberSearch, setMemberSearch]     = useState('')
  const [addSearch, setAddSearch]           = useState('')
  const [savingMember, setSavingMember]     = useState<string | null>(null)

  const loadAreas = async () => {
    setLoading(true)
    const res = await fetch('/api/areas')
    if (res.ok) setAreas(await res.json())
    else setError('No se pudieron cargar las áreas')
    setLoading(false)
  }

  const loadAllUsers = async () => {
    const res = await fetch('/api/users')
    if (res.ok) setAllUsers(await res.json())
  }

  useEffect(() => { loadAreas(); loadAllUsers() }, [])

  const loadMembers = useCallback(async (areaId: string) => {
    setLoadingMembers(true)
    const res = await fetch('/api/users')
    if (res.ok) {
      const data: any[] = await res.json()
      const areaName = areas.find(a => a.id === areaId)?.name
      setMembers(data.filter((u: any) => u.area === areaName))
    }
    setLoadingMembers(false)
  }, [areas])

  const openPanel = (area: Area) => {
    setActiveArea(area)
    setMemberSearch('')
    setAddSearch('')
    loadMembers(area.id)
  }

  // Add user to area — update user's area field
  const addToArea = async (userId: string) => {
    if (!activeArea) return
    setSavingMember(userId)
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, area: activeArea.name }),
    })
    // Refresh
    const res = await fetch('/api/users')
    if (res.ok) {
      const data: any[] = await res.json()
      setAllUsers(data)
      setMembers(data.filter((u: any) => u.area === activeArea.name))
    }
    setSavingMember(null)
  }

  // Remove user from area
  const removeFromArea = async (userId: string) => {
    setSavingMember(userId)
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, area: '' }),
    })
    const res = await fetch('/api/users')
    if (res.ok) {
      const data: any[] = await res.json()
      setAllUsers(data)
      if (activeArea) setMembers(data.filter((u: any) => u.area === activeArea.name))
    }
    setSavingMember(null)
  }

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit   = (area: Area) => {
    setEditItem(area)
    setForm({ name: area.name, description: area.description || '', color: area.color || '#3B82F6' })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const method = editItem ? 'PUT' : 'POST'
    const body   = editItem ? { id: editItem.id, ...form } : form
    const res = await fetch('/api/areas', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { await loadAreas(); setShowModal(false) }
    else { const err = await res.json(); setError(err.error || 'Error al guardar') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta área? Los usuarios asignados quedarán sin área.')) return
    setDeleting(id)
    const res = await fetch('/api/areas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) { setAreas(prev => prev.filter(a => a.id !== id)); if (activeArea?.id === id) setActiveArea(null) }
    else setError('No se pudo eliminar')
    setDeleting(null)
  }

  // Users NOT in this area (candidates to add)
  const candidates = allUsers.filter((u: any) => {
    const inArea = u.area === activeArea?.name
    if (inArea) return false
    if (!addSearch.trim()) return true
    return u.name.toLowerCase().includes(addSearch.toLowerCase()) || u.cedula.includes(addSearch)
  })

  const filteredMembers = members.filter(u =>
    !memberSearch || u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.cedula.includes(memberSearch)
  )

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>

      {/* ── Left: Area grid ── */}
      <div className={`flex-1 p-6 overflow-y-auto transition-all ${activeArea ? 'max-w-[560px]' : ''}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-dim)' }}>
                <Layers size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Áreas</h1>
            </div>
            <p className="text-sm ml-12" style={{ color: 'var(--text-dim)' }}>
              Haz clic en un área para ver y gestionar sus trabajadores
            </p>
          </div>
          <button onClick={openCreate} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
            <Plus size={15} /> Nueva área
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm"
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
            <AlertCircle size={14} />{error}
            <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : areas.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--primary-dim)' }}>
              <Layers size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin áreas creadas</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Crea la primera área para organizar a tus trabajadores</p>
            <button onClick={openCreate} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
              <Plus size={15} /> Crear primera área
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {areas.map((area, i) => {
              const count = allUsers.filter((u: any) => u.area === area.name).length
              const isActive = activeArea?.id === area.id
              return (
                <motion.button key={area.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openPanel(area)}
                  className="terra-card p-5 text-left group relative w-full transition-all"
                  style={isActive ? { border: `1px solid ${area.color || '#3B82F6'}60`, boxShadow: `0 0 0 1px ${area.color || '#3B82F6'}40` } : {}}>

                  {/* Color stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[20px]" style={{ background: area.color || '#3B82F6' }} />

                  <div className="flex items-start justify-between mt-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${area.color || '#3B82F6'}20` }}>
                        <Layers size={16} style={{ color: area.color || '#3B82F6' }} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{area.name}</div>
                        {area.description && (
                          <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-dim)' }}>{area.description}</div>
                        )}
                      </div>
                    </div>

                    {/* Edit/delete (stop propagation) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openEdit(area) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ color: 'var(--text-faint)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(area.id) }} disabled={deleting === area.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ color: 'var(--text-faint)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'var(--red-dim)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                        {deleting === area.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} style={{ color: area.color || 'var(--text-faint)' }} />
                      <span className="text-xs font-semibold" style={{ color: area.color || 'var(--text-faint)' }}>
                        {count} {count === 1 ? 'trabajador' : 'trabajadores'}
                      </span>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Right: Members panel ── */}
      <AnimatePresence>
        {activeArea && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0 overflow-hidden"
            style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)' }}>

            <div className="w-[380px] h-full flex flex-col overflow-hidden">

              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${activeArea.color}20` }}>
                    <Layers size={14} style={{ color: activeArea.color }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{activeArea.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      {members.length} {members.length === 1 ? 'trabajador' : 'trabajadores'}
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveArea(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">

                {/* Current members */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={13} style={{ color: 'var(--text-dim)' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                      Trabajadores en esta área
                    </span>
                  </div>

                  {/* Search members */}
                  {members.length > 4 && (
                    <div className="relative mb-3">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                      <input type="text" placeholder="Buscar..." value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        className="terra-input pl-8 py-1.5 text-xs" />
                    </div>
                  )}

                  {loadingMembers ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-6 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <Users size={20} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin trabajadores en esta área</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>Agrega uno desde abajo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMembers.map(u => (
                        <div key={u.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: activeArea.color || 'var(--primary)' }}>
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{u.name}</div>
                              <div className="text-[10px] font-mono" style={{ color: 'var(--text-faint)' }}>CC: {u.cedula || '—'}</div>
                            </div>
                          </div>
                          <button onClick={() => removeFromArea(u.id)} disabled={savingMember === u.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 transition-all"
                            style={{ color: 'var(--text-faint)', border: '1px solid var(--border)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
                            title="Quitar del área">
                            {savingMember === u.id ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add workers section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus size={13} style={{ color: 'var(--primary)' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                      Agregar trabajadores
                    </span>
                  </div>

                  <div className="relative mb-3">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                    <input type="text" placeholder="Buscar por nombre o cédula..."
                      value={addSearch} onChange={e => setAddSearch(e.target.value)}
                      className="terra-input pl-8 py-1.5 text-xs" />
                  </div>

                  {candidates.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--text-faint)' }}>
                      {addSearch ? 'Sin resultados' : 'Todos los trabajadores ya están en esta área'}
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {candidates.slice(0, 20).map(u => (
                        <div key={u.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                              style={{ background: 'var(--bg-card-hover, #1e2a3a)', border: '1px solid var(--border-strong)', color: 'var(--text-dim)' }}>
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{u.name}</div>
                              {(u as any).area && (
                                <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                                  Área actual: {(u as any).area}
                                </div>
                              )}
                            </div>
                          </div>
                          <button onClick={() => addToArea(u.id)} disabled={savingMember === u.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-2"
                            style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--primary)' }}>
                            {savingMember === u.id ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-md pointer-events-auto rounded-2xl p-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                    {editItem ? 'Editar área' : 'Nueva área'}
                  </h2>
                  <button onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Nombre del área *</label>
                    <input type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                      placeholder="ej. PRODUCCIÓN, LOGÍSTICA, ADMINISTRATIVO"
                      className="terra-input" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Descripción (opcional)</label>
                    <textarea value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe el área..." rows={2} className="terra-input resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                          className="w-7 h-7 rounded-lg transition-all"
                          style={{ background: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, transform: form.color === c ? 'scale(1.15)' : 'scale(1)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="terra-btn-outline flex-1">Cancelar</button>
                    <button type="submit" disabled={saving || !form.name.trim()} className="terra-btn flex-1">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : editItem ? 'Guardar cambios' : 'Crear área'}
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
