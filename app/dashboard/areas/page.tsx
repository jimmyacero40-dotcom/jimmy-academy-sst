'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Plus, Edit2, Trash2, X, Loader2, AlertCircle, Users } from 'lucide-react'

interface Area {
  id: string
  name: string
  description: string | null
  color: string
  company_id: string
  created_at: string
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
]

const EMPTY_FORM = { name: '', description: '', color: '#3B82F6' }

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Area | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/areas')
    if (res.ok) setAreas(await res.json())
    else setError('No se pudieron cargar las áreas')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (area: Area) => {
    setEditItem(area)
    setForm({ name: area.name, description: area.description || '', color: area.color || '#3B82F6' })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    const method = editItem ? 'PUT' : 'POST'
    const body = editItem ? { id: editItem.id, ...form } : form
    const res = await fetch('/api/areas', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    if (res.ok) {
      await load()
      setShowModal(false)
    } else {
      const err = await res.json()
      setError(err.error || 'Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta área? Los usuarios asignados a ella quedarán sin área.')) return
    setDeleting(id)
    const res = await fetch('/api/areas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) setAreas(prev => prev.filter(a => a.id !== id))
    else setError('No se pudo eliminar')
    setDeleting(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

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
            Organiza los trabajadores por áreas o departamentos de tu empresa
          </p>
        </div>
        <button onClick={openCreate} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
          <Plus size={15} />
          Nueva área
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} />
          {error}
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
            <Plus size={15} />
            Crear primera área
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area, i) => (
            <motion.div key={area.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="terra-card p-5 group relative"
            >
              {/* Color stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[20px]" style={{ background: area.color || '#3B82F6' }} />

              <div className="flex items-start justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${area.color || '#3B82F6'}20` }}>
                    <Layers size={16} style={{ color: area.color || '#3B82F6' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{area.name}</div>
                    {area.description && (
                      <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-dim)' }}>{area.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(area)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: 'var(--text-faint)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(area.id)} disabled={deleting === area.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: 'var(--text-faint)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'var(--red-dim)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent' }}>
                    {deleting === area.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                <Users size={11} style={{ color: 'var(--text-faint)' }} />
                <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  {new Date(area.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
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
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Nombre del área *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="ej. Producción, Logística, Administrativo"
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
                      placeholder="Describe el área..."
                      rows={2}
                      className="terra-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
                      Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                          className="w-7 h-7 rounded-lg transition-all"
                          style={{
                            background: c,
                            outline: form.color === c ? `2px solid ${c}` : 'none',
                            outlineOffset: 2,
                            transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                          }} />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="terra-btn-outline flex-1">
                      Cancelar
                    </button>
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
