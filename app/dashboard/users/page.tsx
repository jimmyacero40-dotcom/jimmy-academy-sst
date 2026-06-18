'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import {
  Users, Search, MoreVertical, CheckCircle, Clock,
  Building2, X, Edit2, Trash2, Download, ChevronDown,
  UserPlus, FileSpreadsheet, AlertCircle
} from 'lucide-react'

type UserStatus = 'activo' | 'inactivo'

interface AppUser {
  id: string
  name: string
  email: string
  empresa: string
  role: string
  cedula: string
  status: UserStatus
  createdAt: string
}

const COLORS = [
  'from-amber-500 to-red-500', 'from-emerald-500 to-cyan-500',
  'from-orange-500 to-rose-500', 'from-violet-500 to-pink-500',
  'from-cyan-500 to-blue-500', 'from-rose-500 to-orange-500',
]

const STORAGE_KEY = 'jimmy_academy_users'

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function colorForUser(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[sum % COLORS.length]
}

const EMPTY_FORM = { name: '', email: '', password: '', empresa: '', role: '', cedula: '', status: 'activo' as UserStatus, emailManual: false }

function generateEmail(name: string): string {
  if (!name.trim()) return ''
  const parts = name.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return `${parts[0]}@jimmyacademy.com`
  return `${parts[0]}.${parts[parts.length - 1]}@jimmyacademy.com`
}

function parseExcel(buffer: ArrayBuffer): Omit<AppUser, 'id' | 'createdAt' | 'email'>[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  return rows.map(row => {
    const col = (...keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase())
        if (found !== undefined && String(row[found]).trim() !== '') return String(row[found]).trim()
      }
      return ''
    }
    return {
      name: col('nombre de trabajador', 'nombre', 'name', 'nombres'),
      empresa: col('empresa', 'company', 'razon social'),
      cedula: col('cedula', 'cc', 'documento', 'identificacion', 'nro documento'),
      role: col('cargo', 'role', 'rol', 'puesto'),
      status: 'activo' as UserStatus,
    }
  }).filter(u => u.name !== '')
}

function downloadTemplate() {
  const data = [
    { EMPRESA: 'AGROVENTURE', 'NOMBRE DE TRABAJADOR': 'JUAN PEREZ GOMEZ', CEDULA: '12345678', CARGO: 'OPERARIO' },
    { EMPRESA: 'AGROVENTURE', 'NOMBRE DE TRABAJADOR': 'MARIA LOPEZ TORRES', CEDULA: '87654321', CARGO: 'SUPERVISORA SST' },
    { EMPRESA: 'AGROVENTURE', 'NOMBRE DE TRABAJADOR': 'CARLOS BASTO ARLEY', CEDULA: '11223344', CARGO: 'SUPERVISOR DE OBRA' },
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 20 }, { wch: 34 }, { wch: 14 }, { wch: 30 }]
  const wb2 = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb2, ws, 'Trabajadores')
  XLSX.writeFile(wb2, 'plantilla_trabajadores.xlsx')
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [excelError, setExcelError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          empresa: u.area || '',
          role: u.role === 'admin' ? 'Administrador' : (u.area || 'Trabajador'),
          cedula: u.cedula || '',
          status: u.active ? 'activo' as UserStatus : 'inactivo' as UserStatus,
          createdAt: new Date(u.created_at).toLocaleDateString('es-CO'),
        })))
      }
    } catch {}
  }

  useEffect(() => { loadUsers() }, [])

  const openNew = () => { setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true) }
  const openEdit = (u: AppUser) => {
    setEditUser(u); setForm({ name: u.name, email: (u as any).email || '', password: '', empresa: u.empresa, role: u.role, cedula: u.cedula, status: u.status, emailManual: true })
    setFormErrors({}); setShowModal(true); setMenuOpen(null)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nombre requerido'
    if (!form.cedula.trim()) e.cedula = 'Cédula requerida'
    if (!form.email.trim()) e.email = 'Correo requerido'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido'
    return e
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    try {
      if (editUser) {
        const body: any = {
          id: editUser.id,
          name: form.name,
          email: form.email,
          cedula: form.cedula,
          area: form.empresa,
          active: form.status === 'activo',
        }
        if (form.password.trim()) body.password = form.password
        const res = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) { const d = await res.json(); setFormErrors({ name: d.error || 'Error al guardar' }); setSaving(false); return }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.cedula,
            cedula: form.cedula,
            role: 'worker',
            area: form.empresa,
          })
        })
        if (!res.ok) { const d = await res.json(); setFormErrors({ email: d.error || 'Error al crear' }); setSaving(false); return }
      }
      await loadUsers()
      setShowModal(false)
    } catch { setFormErrors({ name: 'Error de conexión' }) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await loadUsers()
    setDeleteConfirm(null); setMenuOpen(null)
  }

  const toggleStatus = async (id: string) => {
    const u = users.find(u => u.id === id)
    if (!u) return
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: u.status !== 'activo' })
    })
    await loadUsers()
    setMenuOpen(null)
  }

  const handleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcelError('')
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const parsed = parseExcel(ev.target!.result as ArrayBuffer)
        if (!parsed.length) { setExcelError('No se encontraron datos. Verifica que el archivo tenga filas con Nombre, Cedula y Cargo.'); return }
        let created = 0
        for (const p of parsed) {
          const email = generateEmail(p.name)
          const password = p.cedula
          if (!email || !password) continue
          try {
            const res = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: p.name, email, password, cedula: p.cedula, role: 'worker', area: p.empresa }),
            })
            if (res.ok) created++
          } catch {}
        }
        await loadUsers()
        if (created > 0) alert(`${created} trabajador(es) creado(s) exitosamente`)
      } catch { setExcelError('Error al leer el archivo. Asegurate de que sea un Excel valido (.xlsx)') }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const match = u.name.toLowerCase().includes(q) || u.cedula.includes(q) || u.role.toLowerCase().includes(q) || u.empresa.toLowerCase().includes(q)
    return match && (filter === 'todos' || u.status === filter)
  })

  const activos = users.filter(u => u.status === 'activo').length

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Usuarios</h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {users.length === 0 ? 'Sin trabajadores — agrega el primero o importa desde Excel' : `${users.length} registrados · ${activos} activos`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadTemplate} className="terra-btn-outline text-xs py-2 px-3">
              <Download size={15} /> Plantilla
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
              <FileSpreadsheet size={15} /> Importar Excel
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
            <button onClick={openNew} className="terra-btn text-xs py-2 px-4">
              <UserPlus size={16} /> Nuevo
            </button>
          </div>
        </div>
        {excelError && (
          <div className="mt-3 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
            <AlertCircle size={14} /> {excelError}
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: users.length, color: 'var(--amber)' },
          { label: 'Activos', value: activos, color: '#10B981' },
          { label: 'Inactivos', value: users.filter(u => u.status === 'inactivo').length, color: 'var(--text-dim)' },
          { label: 'Empresas', value: new Set(users.map(u => u.empresa).filter(Boolean)).size, color: '#A78BFA' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="terra-card p-4">
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cedula, cargo o empresa..."
            className="terra-input pl-9" />
        </div>
        <div className="flex gap-2">
          {['todos', 'activo', 'inactivo'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? '' : ''}`}
              style={filter === f
                ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="terra-card py-20 text-center" style={{ borderStyle: 'dashed', borderWidth: 2 }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Users size={28} style={{ color: 'var(--amber)' }} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Sin trabajadores registrados</h3>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-dim)' }}>
            Importa tu nomina desde Excel o agrega trabajadores uno a uno.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={openNew} className="terra-btn text-sm py-2.5 px-5">
              <UserPlus size={16} /> Agregar trabajador
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
              <FileSpreadsheet size={16} /> Importar desde Excel
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      {users.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="terra-card overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full terra-table">
              <thead>
                <tr><th>Trabajador</th><th>Correo</th><th>Cédula</th><th>Área</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="font-semibold leading-snug" style={{ color: 'var(--text)' }}>{u.name}</div>
                        </div>
                      </td>
                      <td><span className="text-xs" style={{ color: 'var(--text-dim)' }}>{u.email || '—'}</span></td>
                      <td><span className="font-mono">{u.cedula || '—'}</span></td>
                      <td>{u.empresa || '—'}</td>
                      <td>
                        <span className={u.status === 'activo' ? 'badge-green' : 'badge-red'}>
                          {u.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                            className="p-1 rounded-lg transition-colors" style={{ color: 'var(--text-faint)' }}>
                            <MoreVertical size={16} />
                          </button>
                          {menuOpen === u.id && (
                            <div className="absolute right-0 top-8 rounded-xl shadow-xl z-20 w-44 py-1"
                              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
                              <button onClick={() => openEdit(u)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all"
                                style={{ color: 'var(--text-dim)' }}>
                                <Edit2 size={13} /> Editar
                              </button>
                              <button onClick={() => toggleStatus(u.id)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all"
                                style={{ color: 'var(--text-dim)' }}>
                                <CheckCircle size={13} /> {u.status === 'activo' ? 'Desactivar' : 'Activar'}
                              </button>
                              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                              <button onClick={() => { setDeleteConfirm(u.id); setMenuOpen(null) }}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all" style={{ color: '#FCA5A5' }}>
                                <Trash2 size={13} /> Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            <AnimatePresence>
              {filtered.map(u => (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-4" style={{ borderBottom: '1px solid rgba(245,158,11,0.05)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{u.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{u.role}</div>
                        <div className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>CC: {u.cedula || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={u.status === 'activo' ? 'badge-green' : 'badge-red'}>{u.status === 'activo' ? 'Activo' : 'Inactivo'}</span>
                      <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)} style={{ color: 'var(--text-faint)' }}>
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </div>
                  {menuOpen === u.id && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(u)} className="terra-btn-outline flex-1 text-xs py-2 justify-center"><Edit2 size={12} /> Editar</button>
                      <button onClick={() => toggleStatus(u.id)} className="terra-btn-outline flex-1 text-xs py-2 justify-center"><CheckCircle size={12} /> {u.status === 'activo' ? 'Desactivar' : 'Activar'}</button>
                      <button onClick={() => setDeleteConfirm(u.id)} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--red-dim)', color: '#FCA5A5' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && users.length > 0 && (
            <div className="py-12 text-center">
              <Users size={28} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No se encontraron trabajadores</p>
            </div>
          )}
        </motion.div>
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <UserPlus size={15} style={{ color: 'var(--amber)' }} />
                  </div>
                  <h2 className="font-bold" style={{ color: 'var(--text)' }}>{editUser ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h2>
                </div>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'name', label: 'Nombre completo *', placeholder: 'JUAN CARLOS PEREZ GOMEZ', mono: false, type: 'text' },
                  { key: 'cedula', label: 'Cédula * (será la contraseña)', placeholder: '1052392965', mono: true, type: 'text' },
                  { key: 'email', label: 'Correo electrónico * (se sugiere automáticamente)', placeholder: 'juan.perez@jimmyacademy.com', mono: false, type: 'email' },
                  { key: 'role', label: 'Cargo', placeholder: 'SUPERVISOR DE MONTAJE', mono: false, type: 'text' },
                  { key: 'empresa', label: 'Empresa / Área', placeholder: 'AGROVENTURE', mono: false, type: 'text' },
                ].map(({ key, label, placeholder, mono, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => {
                        const val = key === 'cedula' ? e.target.value.replace(/\D/g, '') : e.target.value
                        if (key === 'name') {
                          const suggested = generateEmail(val)
                          setForm(f => ({ ...f, name: val, ...(!f.emailManual ? { email: suggested } : {}), password: f.cedula || f.password }))
                        } else if (key === 'cedula') {
                          setForm(f => ({ ...f, cedula: val, password: val }))
                        } else if (key === 'email') {
                          setForm(f => ({ ...f, email: e.target.value, emailManual: true }))
                        } else {
                          setForm(f => ({ ...f, [key]: val }))
                        }
                      }}
                      placeholder={placeholder}
                      inputMode={key === 'cedula' ? 'numeric' : undefined}
                      className={`terra-input ${mono ? 'font-mono' : ''}`}
                      style={(formErrors as any)[key] ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {(formErrors as any)[key] && <p className="text-xs mt-1" style={{ color: '#FCA5A5' }}>{(formErrors as any)[key]}</p>}
                  </div>
                ))}
                {editUser && (
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Estado</label>
                    <div className="flex gap-2">
                      {(['activo', 'inactivo'] as UserStatus[]).map(s => (
                        <button key={s} onClick={() => setForm({ ...form, status: s })}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                          style={form.status === s
                            ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }
                            : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setShowModal(false)} className="terra-btn-outline flex-1 py-2.5 justify-center">Cancelar</button>
                <button onClick={handleSubmit} disabled={saving} className="terra-btn flex-1 py-2.5 justify-center">
                  <UserPlus size={15} /> {saving ? 'Guardando...' : editUser ? 'Guardar' : 'Agregar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 w-full max-w-sm text-center rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <Trash2 size={22} style={{ color: '#FCA5A5' }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Eliminar trabajador?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
                Se eliminara <span className="font-semibold" style={{ color: 'var(--text)' }}>{users.find(u => u.id === deleteConfirm)?.name}</span>. Esta accion no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="terra-btn-outline flex-1 py-2.5 justify-center">Cancelar</button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ background: 'var(--red)' }}>
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
