'use client'

import { useState, useEffect } from 'react'
import {
  DoorOpen, Plus, Edit2, ToggleLeft, ToggleRight, Users,
  X, Save, Loader2, Trash2, RefreshCw, UserPlus, UserMinus, ChevronDown
} from 'lucide-react'

interface Gatehouse {
  id: string
  name: string
  location: string | null
  description: string | null
  is_active: boolean
  created_at: string
  gatehouse_operators: { user_id: string; users: Operator }[]
}

interface Operator {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

const EMPTY_FORM = { name: '', location: '', description: '', is_active: true }

export default function SedesPorterias() {
  const [gatehouses, setGatehouses] = useState<Gatehouse[]>([])
  const [allUsers, setAllUsers]     = useState<User[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [modal, setModal]           = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing]       = useState<Gatehouse | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [operatorsPanel, setOperatorsPanel] = useState<string | null>(null)
  const [assigningUser, setAssigningUser]   = useState('')
  const [assigningSaving, setAssigningSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function load() {
    setLoading(true)
    const [ghRes, uRes] = await Promise.all([fetch('/api/gatehouses'), fetch('/api/users?role=all')])
    if (ghRes.ok) setGatehouses(await ghRes.json())
    if (uRes.ok)  setAllUsers(await uRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setModal('create')
  }

  function openEdit(gh: Gatehouse) {
    setForm({ name: gh.name, location: gh.location || '', description: gh.description || '', is_active: gh.is_active })
    setEditing(gh)
    setModal('edit')
  }

  async function save() {
    if (!form.name.trim()) return showToast('El nombre es obligatorio', 'err')
    setSaving(true)
    if (modal === 'create') {
      const res = await fetch('/api/gatehouses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) { showToast('Portería creada', 'ok'); await load() }
      else showToast((await res.json()).error || 'Error', 'err')
    } else if (editing) {
      const res = await fetch(`/api/gatehouses/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) { showToast('Portería actualizada', 'ok'); await load() }
      else showToast((await res.json()).error || 'Error', 'err')
    }
    setSaving(false)
    setModal(null)
  }

  async function toggleActive(gh: Gatehouse) {
    const res = await fetch(`/api/gatehouses/${gh.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !gh.is_active }),
    })
    if (res.ok) { showToast(`Portería ${!gh.is_active ? 'activada' : 'desactivada'}`, 'ok'); await load() }
    else showToast('Error al actualizar', 'err')
  }

  async function assignOperator(gateId: string) {
    if (!assigningUser) return
    setAssigningSaving(true)
    const res = await fetch(`/api/gatehouses/${gateId}/operators`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: assigningUser }),
    })
    if (res.ok) { showToast('Operador asignado', 'ok'); setAssigningUser(''); await load() }
    else showToast((await res.json()).error || 'Error', 'err')
    setAssigningSaving(false)
  }

  async function removeOperator(gateId: string, userId: string) {
    const res = await fetch(`/api/gatehouses/${gateId}/operators`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) { showToast('Operador removido', 'ok'); await load() }
    else showToast('Error', 'err')
  }

  const assignedIds = gatehouses.find(g => g.id === operatorsPanel)?.gatehouse_operators.map(o => o.user_id) ?? []
  const availableForAssign = allUsers.filter(u => !assignedIds.includes(u.id) && u.active)

  return (
    <div className="w-full space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'ok' ? '#10B981' : '#EF4444', color: '#fff', maxWidth: 360 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>Sedes</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Administra los puntos de control de acceso de la empresa
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          <Plus size={15} /> Nueva sede
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
      ) : gatehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <DoorOpen size={40} style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No hay sedes configuradas</p>
          <button onClick={openCreate} className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>+ Crear la primera sede</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gatehouses.map(gh => (
            <div key={gh.id} className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: `1px solid ${gh.is_active ? 'var(--border)' : 'var(--border)'}`, boxShadow: 'var(--shadow-card)', opacity: gh.is_active ? 1 : 0.7 }}>
              {/* Card header */}
              <div className="px-4 py-3 flex items-start justify-between gap-2"
                style={{ borderBottom: '1px solid var(--border)', background: gh.is_active ? 'var(--bg-card)' : 'var(--bg)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: gh.is_active ? 'var(--primary-dim)' : 'var(--bg-card-hover)' }}>
                    <DoorOpen size={18} style={{ color: gh.is_active ? 'var(--primary)' : 'var(--text-faint)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>{gh.name}</div>
                    {gh.location && <div className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{gh.location}</div>}
                  </div>
                </div>
                <span className={gh.is_active ? 'badge-success' : 'badge-gray'} style={{ fontSize: 11 }}>
                  {gh.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {/* Body */}
              <div className="px-4 py-3 space-y-3">
                {gh.description && (
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{gh.description}</p>
                )}

                {/* Operators */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-label)' }}>
                      Operadores ({gh.gatehouse_operators.length})
                    </span>
                    <button
                      onClick={() => setOperatorsPanel(operatorsPanel === gh.id ? null : gh.id)}
                      className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                      {operatorsPanel === gh.id ? 'Cerrar' : 'Gestionar'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gh.gatehouse_operators.length === 0
                      ? <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin operadores asignados</span>
                      : gh.gatehouse_operators.map(op => (
                        <span key={op.user_id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                          {op.users?.name?.split(' ')[0] ?? 'Usuario'}
                          <button onClick={() => removeOperator(gh.id, op.user_id)} className="hover:opacity-70 transition-opacity">
                            <X size={10} />
                          </button>
                        </span>
                      ))
                    }
                  </div>

                  {/* Assign panel */}
                  {operatorsPanel === gh.id && (
                    <div className="mt-2 flex gap-2">
                      <select value={assigningUser} onChange={e => setAssigningUser(e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                        <option value="">Seleccionar usuario…</option>
                        {availableForAssign.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                      <button onClick={() => assignOperator(gh.id)} disabled={!assigningUser || assigningSaving}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                        style={{ background: 'var(--primary)', color: '#fff' }}>
                        {assigningSaving ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-2 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => openEdit(gh)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-dim)', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <Edit2 size={11} /> Editar
                </button>
                <button onClick={() => toggleActive(gh)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                  style={{
                    color: gh.is_active ? '#F59E0B' : '#10B981',
                    border: `1px solid ${gh.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    background: gh.is_active ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                  }}>
                  {gh.is_active ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
                  {gh.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create/edit */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-strong)' }}>
                {modal === 'create' ? 'Nueva sede' : 'Editar sede'}
              </h2>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-faint)' }}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Nombre *', key: 'name', placeholder: 'Ej: Sede Norte' },
                { label: 'Centro de trabajo / Ubicación', key: 'location', placeholder: 'Ej: Finca El Rosal' },
                { label: 'Descripción', key: 'description', placeholder: 'Descripción opcional' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>{label}</label>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Sede activa
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {modal === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
