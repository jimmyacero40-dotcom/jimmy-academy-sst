'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Edit2, Trash2, X, Loader2, AlertCircle, UserPlus, UserMinus, ChevronRight } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
  member_count: number
  company_id: string
  created_at: string
}

interface Member {
  id: string
  name: string
  email: string
  cedula: string
  cargo: string | null
  area: string | null
  role: string
  active: boolean
  added_at: string
}

interface AppUser {
  id: string
  name: string
  email: string
  cedula: string
  cargo: string | null
  area: string | null
  role: string
}

const EMPTY_FORM = { name: '', description: '' }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Group | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Members panel
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [allUsers, setAllUsers] = useState<AppUser[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [addingUser, setAddingUser] = useState<string | null>(null)
  const [removingUser, setRemovingUser] = useState<string | null>(null)

  const loadGroups = async () => {
    setLoading(true)
    const res = await fetch('/api/groups')
    if (res.ok) setGroups(await res.json())
    else setError('No se pudieron cargar los grupos')
    setLoading(false)
  }

  const loadMembers = useCallback(async (groupId: string) => {
    setLoadingMembers(true)
    const [mRes, uRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/members`),
      fetch('/api/users'),
    ])
    if (mRes.ok) setMembers(await mRes.json())
    if (uRes.ok) setAllUsers(await uRes.json())
    setLoadingMembers(false)
  }, [])

  useEffect(() => { loadGroups() }, [])

  useEffect(() => {
    if (activeGroup) loadMembers(activeGroup.id)
  }, [activeGroup, loadMembers])

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (g: Group) => { setEditItem(g); setForm({ name: g.name, description: g.description || '' }); setShowModal(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const method = editItem ? 'PUT' : 'POST'
    const body = editItem ? { id: editItem.id, ...form } : form
    const res = await fetch('/api/groups', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { await loadGroups(); setShowModal(false) }
    else { const err = await res.json(); setError(err.error || 'Error al guardar') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este grupo? Los miembros no serán eliminados.')) return
    setDeleting(id)
    const res = await fetch('/api/groups', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) {
      setGroups(prev => prev.filter(g => g.id !== id))
      if (activeGroup?.id === id) setActiveGroup(null)
    } else setError('No se pudo eliminar')
    setDeleting(null)
  }

  const addMember = async (userId: string) => {
    if (!activeGroup) return
    setAddingUser(userId)
    const res = await fetch(`/api/groups/${activeGroup.id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: [userId] }),
    })
    if (res.ok) await loadMembers(activeGroup.id)
    setAddingUser(null)
    // update count
    setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, member_count: g.member_count + 1 } : g))
  }

  const removeMember = async (userId: string) => {
    if (!activeGroup) return
    setRemovingUser(userId)
    const res = await fetch(`/api/groups/${activeGroup.id}/members`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== userId))
      setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g))
    }
    setRemovingUser(null)
  }

  const memberIds = new Set(members.map(m => m.id))
  const nonMembers = allUsers.filter(u => !memberIds.has(u.id) && u.role !== 'superadmin')

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-dim)' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Grupos</h1>
          </div>
          <p className="text-sm ml-12" style={{ color: 'var(--text-dim)' }}>
            Crea grupos de aprendizaje para asignar capacitaciones en conjunto
          </p>
        </div>
        <button onClick={openCreate} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
          <Plus size={15} />
          Nuevo grupo
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
        {/* Groups list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : groups.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--primary-dim)' }}>
                <Users size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin grupos</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Crea el primer grupo para organizar capacitaciones</p>
              <button onClick={openCreate} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
                <Plus size={15} /> Crear primer grupo
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {groups.map((group, i) => (
                <motion.div key={group.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setActiveGroup(activeGroup?.id === group.id ? null : group)}
                  className="terra-card p-4 cursor-pointer group"
                  style={{ borderColor: activeGroup?.id === group.id ? 'var(--primary-border)' : undefined,
                           background: activeGroup?.id === group.id ? 'var(--primary-dim)' : undefined }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--primary-dim)' }}>
                      <Users size={16} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{group.name}</div>
                      {group.description && (
                        <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-dim)' }}>{group.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                        {group.member_count} miembro{group.member_count !== 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(group)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: 'var(--text-faint)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(group.id)} disabled={deleting === group.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: 'var(--text-faint)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'var(--red-dim)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                          {deleting === group.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--text-faint)', transform: activeGroup?.id === group.id ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Members panel */}
        <AnimatePresence>
          {activeGroup && (
            <motion.div initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: 340 }} exit={{ opacity: 0, x: 20, width: 0 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ minWidth: 0 }}>
              <div className="w-[340px] rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeGroup.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{members.length} miembros</div>
                  </div>
                  <button onClick={() => setActiveGroup(null)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-faint)', background: 'var(--bg-card)' }}>
                    <X size={13} />
                  </button>
                </div>

                {loadingMembers ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: 500 }}>

                    {/* Current members */}
                    {members.length > 0 && (
                      <div className="p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-faint)' }}>
                          Miembros actuales
                        </div>
                        {members.map(m => (
                          <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg group/m">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: 'var(--grad-main)' }}>
                              {m.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{m.name}</div>
                              <div className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>{m.cargo || m.area || m.email}</div>
                            </div>
                            <button onClick={() => removeMember(m.id)} disabled={removingUser === m.id}
                              className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/m:opacity-100 transition-opacity"
                              title="Quitar del grupo"
                              style={{ color: '#FCA5A5' }}>
                              {removingUser === m.id ? <Loader2 size={11} className="animate-spin" /> : <UserMinus size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add members */}
                    {nonMembers.length > 0 && (
                      <div className="p-3" style={{ borderTop: members.length > 0 ? '1px solid var(--border)' : 'none' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-faint)' }}>
                          Agregar trabajadores
                        </div>
                        {nonMembers.map(u => (
                          <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-lg group/u">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                              {u.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{u.name}</div>
                              <div className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>{u.cargo || u.area || u.email}</div>
                            </div>
                            <button onClick={() => addMember(u.id)} disabled={addingUser === u.id}
                              className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/u:opacity-100 transition-opacity"
                              title="Agregar al grupo"
                              style={{ color: 'var(--primary)' }}>
                              {addingUser === u.id ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {members.length === 0 && nonMembers.length === 0 && (
                      <div className="py-10 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
                        No hay trabajadores disponibles
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal create/edit */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-md pointer-events-auto rounded-2xl p-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                    {editItem ? 'Editar grupo' : 'Nuevo grupo'}
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
                      Nombre del grupo *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="ej. Brigadistas 2026, Alta dirección"
                      className="terra-input"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe el propósito del grupo..."
                      rows={2}
                      className="terra-input resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="terra-btn-outline flex-1">Cancelar</button>
                    <button type="submit" disabled={saving || !form.name.trim()} className="terra-btn flex-1">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : editItem ? 'Guardar cambios' : 'Crear grupo'}
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
