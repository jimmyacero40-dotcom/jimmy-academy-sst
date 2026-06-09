'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import {
  Users, Search, MoreVertical, CheckCircle, Clock,
  Building2, X, Edit2, Trash2, Download, ChevronDown,
  UserPlus, FileSpreadsheet, AlertCircle
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type UserStatus = 'activo' | 'inactivo'

interface AppUser {
  id: string
  name: string
  empresa: string
  role: string
  cedula: string
  status: UserStatus
  createdAt: string
}

const COLORS = [
  'from-blue-500 to-violet-500', 'from-emerald-500 to-cyan-500',
  'from-orange-500 to-rose-500', 'from-violet-500 to-pink-500',
  'from-cyan-500 to-blue-500', 'from-rose-500 to-orange-500',
]

const statusConfig = {
  activo:   { label: 'Activo',   color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  inactivo: { label: 'Inactivo', color: 'text-slate-400',   bg: 'bg-slate-400/10 border-slate-400/20',     icon: Clock },
}

const STORAGE_KEY = 'jimmy_academy_users'

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function colorForUser(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[sum % COLORS.length]
}

const EMPTY_FORM = { name: '', empresa: '', role: '', cedula: '', status: 'activo' as UserStatus }

// ─── Excel parser — solo lee EMPRESA, NOMBRE DE TRABAJADOR, CEDULA, CARGO ────
function parseExcel(buffer: ArrayBuffer): Omit<AppUser, 'id' | 'createdAt'>[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  return rows.map(row => {
    const col = (...keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(row).find(
          rk => rk.trim().toLowerCase() === k.toLowerCase()
        )
        if (found !== undefined && String(row[found]).trim() !== '') {
          return String(row[found]).trim()
        }
      }
      return ''
    }
    return {
      name:    col('nombre de trabajador', 'nombre', 'name', 'nombres'),
      empresa: col('empresa', 'company', 'razón social', 'razon social'),
      cedula:  col('cedula', 'cédula', 'cc', 'documento', 'identificacion', 'nro documento'),
      role:    col('cargo', 'role', 'rol', 'puesto'),
      status:  'activo' as UserStatus,
    }
  }).filter(u => u.name !== '')
}

function downloadTemplate() {
  const data = [
    { EMPRESA: 'AGROVENTURE', 'NOMBRE DE TRABAJADOR': 'JUAN PÉREZ GÓMEZ',          CEDULA: '12345678',  CARGO: 'OPERARIO' },
    { EMPRESA: 'AGROVENTURE', 'NOMBRE DE TRABAJADOR': 'MARÍA LÓPEZ TORRES',         CEDULA: '87654321',  CARGO: 'SUPERVISORA SST' },
    { EMPRESA: 'AGROVENTURE', 'NOMBRE DE TRABAJADOR': 'CARLOS BASTO ARLEY',         CEDULA: '11223344',  CARGO: 'SUPERVISOR DE OBRA' },
    { EMPRESA: 'AGROVENTURE', 'NOMBRE DE TRABAJADOR': 'ANDRES BUSTOS RODRIGUEZ',    CEDULA: '55667788',  CARGO: 'DIRECTOR DE TALENTO HUMANO' },
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 20 }, { wch: 34 }, { wch: 14 }, { wch: 30 }]
  const wb2 = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb2, ws, 'Trabajadores')
  XLSX.writeFile(wb2, 'plantilla_trabajadores.xlsx')
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]             = useState<AppUser[]>([])
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('todos')
  const [showModal, setShowModal]     = useState(false)
  const [editUser, setEditUser]       = useState<AppUser | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]   = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [menuOpen, setMenuOpen]       = useState<string | null>(null)
  const [excelError, setExcelError]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setUsers(JSON.parse(s)) } catch {}
  }, [])

  const save = (u: AppUser[]) => { setUsers(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const openNew = () => {
    setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true)
  }
  const openEdit = (u: AppUser) => {
    setEditUser(u)
    setForm({ name: u.name, empresa: u.empresa, role: u.role, cedula: u.cedula, status: u.status })
    setFormErrors({}); setShowModal(true); setMenuOpen(null)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())   e.name   = 'Nombre requerido'
    if (!form.cedula.trim()) e.cedula = 'Cédula requerida'
    if (!form.role.trim())   e.role   = 'Cargo requerido'
    const dup = users.find(u => u.cedula === form.cedula && u.id !== editUser?.id)
    if (dup) e.cedula = 'Ya existe un usuario con esa cédula'
    return e
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    if (editUser) {
      save(users.map(u => u.id === editUser.id ? { ...u, ...form } : u))
    } else {
      save([...users, {
        id: `usr_${Date.now()}`,
        ...form,
        createdAt: new Date().toLocaleDateString('es-CO'),
      }])
    }
    setShowModal(false)
  }

  const handleDelete  = (id: string) => { save(users.filter(u => u.id !== id)); setDeleteConfirm(null); setMenuOpen(null) }
  const toggleStatus  = (id: string) => { save(users.map(u => u.id === id ? { ...u, status: u.status === 'activo' ? 'inactivo' : 'activo' } : u)); setMenuOpen(null) }

  const handleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcelError('')
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseExcel(ev.target!.result as ArrayBuffer)
        if (!parsed.length) { setExcelError('No se encontraron datos. Verifica que el archivo tenga filas con Nombre, Cédula y Cargo.'); return }
        const newUsers: AppUser[] = parsed.map(p => ({
          id: `usr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          ...p,
          createdAt: new Date().toLocaleDateString('es-CO'),
        }))
        save([...users, ...newUsers])
      } catch { setExcelError('Error al leer el archivo. Asegúrate de que sea un Excel válido (.xlsx)') }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const match = u.name.toLowerCase().includes(q) || u.cedula.includes(q) ||
      u.role.toLowerCase().includes(q) || u.empresa.toLowerCase().includes(q)
    return match && (filter === 'todos' || u.status === filter)
  })

  const activos = users.filter(u => u.status === 'activo').length

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Usuarios</h1>
            <p className="text-slate-400 text-sm">
              {users.length === 0
                ? 'Sin trabajadores — agrega el primero o importa desde Excel'
                : `${users.length} registrados · ${activos} activos`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <Download size={15} /> Plantilla Excel
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 text-emerald-300 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <FileSpreadsheet size={15} /> Importar Excel
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
            <button onClick={openNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <UserPlus size={16} /> Nuevo Usuario
            </button>
          </div>
        </div>

        {excelError && (
          <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5 text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {excelError}
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',     value: users.length,                                      color: 'text-blue-400' },
          { label: 'Activos',   value: activos,                                           color: 'text-emerald-400' },
          { label: 'Inactivos', value: users.filter(u => u.status === 'inactivo').length, color: 'text-slate-400' },
          { label: 'Empresas',  value: new Set(users.map(u => u.empresa).filter(Boolean)).size, color: 'text-violet-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[#0D1629] border border-white/8 rounded-xl p-4">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula, cargo o empresa..."
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all" />
        </div>
        <div className="flex gap-2">
          {['todos', 'activo', 'inactivo'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${filter === f ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/8 text-slate-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#0D1629] border-2 border-dashed border-white/8 rounded-2xl py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-blue-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Sin trabajadores registrados</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Importa tu nómina desde Excel o agrega trabajadores uno a uno.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={openNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <UserPlus size={16} /> Agregar trabajador
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 text-emerald-300 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <FileSpreadsheet size={16} /> Importar desde Excel
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      {users.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#0D1629] border border-white/8 rounded-2xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Trabajador', 'Cédula', 'Cargo', 'Empresa', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {filtered.map((u, i) => {
                    const st = statusConfig[u.status]
                    const StIcon = st.icon
                    return (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {getInitials(u.name)}
                            </div>
                            <div className="text-white text-sm font-semibold leading-snug">{u.name}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300 text-sm font-mono">{u.cedula || '—'}</td>
                        <td className="px-5 py-4 text-slate-300 text-sm">{u.role || '—'}</td>
                        <td className="px-5 py-4">
                          {u.empresa
                            ? <div className="flex items-center gap-1.5 text-slate-400 text-sm"><Building2 size={13} className="text-slate-500" /> {u.empresa}</div>
                            : <span className="text-slate-600 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${st.bg} ${st.color}`}>
                            <StIcon size={11} /> {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative">
                            <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                              className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                              <MoreVertical size={16} />
                            </button>
                            {menuOpen === u.id && (
                              <div className="absolute right-0 top-8 bg-[#111827] border border-white/12 rounded-xl shadow-xl z-20 w-44 py-1">
                                <button onClick={() => openEdit(u)}
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-all">
                                  <Edit2 size={13} /> Editar
                                </button>
                                <button onClick={() => toggleStatus(u.id)}
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-all">
                                  <CheckCircle size={13} /> {u.status === 'activo' ? 'Desactivar' : 'Activar'}
                                </button>
                                <div className="border-t border-white/8 my-1" />
                                <button onClick={() => { setDeleteConfirm(u.id); setMenuOpen(null) }}
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-rose-400 hover:bg-rose-400/5 text-sm transition-all">
                                  <Trash2 size={13} /> Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            <AnimatePresence>
              {filtered.map(u => {
                const st = statusConfig[u.status]; const StIcon = st.icon
                return (
                  <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm">{u.name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{u.role}</div>
                          <div className="text-slate-600 text-xs font-mono">CC: {u.cedula || '—'}</div>
                          {u.empresa && <div className="text-slate-600 text-xs">{u.empresa}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${st.bg} ${st.color}`}>
                          <StIcon size={10} /> {st.label}
                        </span>
                        <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                          className="text-slate-500 hover:text-white p-1">
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                    {menuOpen === u.id && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => openEdit(u)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold transition-all">
                          <Edit2 size={12} /> Editar
                        </button>
                        <button onClick={() => toggleStatus(u.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold transition-all">
                          <CheckCircle size={12} /> {u.status === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => setDeleteConfirm(u.id)} className="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && users.length > 0 && (
            <div className="py-12 text-center text-slate-500">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No se encontraron trabajadores</p>
            </div>
          )}
        </motion.div>
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1629] border border-white/12 rounded-2xl w-full max-w-md">

              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <UserPlus size={15} className="text-blue-400" />
                  </div>
                  <h2 className="text-white font-bold">{editUser ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Nombre completo *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="JUAN CARLOS PÉREZ GÓMEZ"
                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${formErrors.name ? 'border-rose-500/50' : 'border-white/8 focus:border-blue-500/50'}`} />
                  {formErrors.name && <p className="text-rose-400 text-xs mt-1">{formErrors.name}</p>}
                </div>

                {/* Cédula */}
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Cédula *</label>
                  <input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value.replace(/\D/g, '') })}
                    placeholder="1052392965" inputMode="numeric"
                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono ${formErrors.cedula ? 'border-rose-500/50' : 'border-white/8 focus:border-blue-500/50'}`} />
                  {formErrors.cedula && <p className="text-rose-400 text-xs mt-1">{formErrors.cedula}</p>}
                </div>

                {/* Cargo */}
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Cargo *</label>
                  <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    placeholder="SUPERVISOR DE MONTAJE Y MANTENIMIENTO"
                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${formErrors.role ? 'border-rose-500/50' : 'border-white/8 focus:border-blue-500/50'}`} />
                  {formErrors.role && <p className="text-rose-400 text-xs mt-1">{formErrors.role}</p>}
                </div>

                {/* Empresa */}
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Empresa</label>
                  <input value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })}
                    placeholder="AGROVENTURE"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>

                {/* Estado (solo en edición) */}
                {editUser && (
                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Estado</label>
                    <div className="flex gap-2">
                      {(['activo', 'inactivo'] as UserStatus[]).map(s => (
                        <button key={s} onClick={() => setForm({ ...form, status: s })}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all border ${form.status === s ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/8 text-slate-400 hover:text-white'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-sm font-semibold transition-all">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <UserPlus size={15} /> {editUser ? 'Guardar cambios' : 'Agregar'}
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
              className="bg-[#0D1629] border border-white/12 rounded-2xl p-6 w-full max-w-sm text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-rose-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">¿Eliminar trabajador?</h3>
              <p className="text-slate-400 text-sm mb-6">
                Se eliminará <span className="text-white font-semibold">{users.find(u => u.id === deleteConfirm)?.name}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-sm font-semibold transition-all">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all">
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
