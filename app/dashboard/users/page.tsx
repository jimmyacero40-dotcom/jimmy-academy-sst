'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import {
  Users, Search, MoreVertical, CheckCircle, Clock,
  Building2, X, Edit2, Trash2, Download, ChevronDown,
  UserPlus, FileSpreadsheet, AlertCircle, Loader2,
  Layers, UserCheck, Tag, ChevronRight, Plus, BookOpen,
  Filter, Eye
} from 'lucide-react'

type UserStatus = 'activo' | 'inactivo'

interface AppUser {
  id: string
  name: string
  email: string
  empresa: string
  area_id: string
  area_name: string
  role: string
  cedula: string
  status: UserStatus
  createdAt: string
  groups: { id: string; name: string; color?: string }[]
}

interface Area  { id: string; name: string; color?: string }
interface Group { id: string; name: string; color?: string }

const COLORS = [
  'from-amber-500 to-red-500', 'from-emerald-500 to-cyan-500',
  'from-orange-500 to-rose-500', 'from-violet-500 to-pink-500',
  'from-cyan-500 to-blue-500', 'from-rose-500 to-orange-500',
]

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function colorForUser(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[sum % COLORS.length]
}

const EMPTY_FORM = {
  name: '', email: '', password: '', empresa: '', area_id: '', role: '', cedula: '',
  status: 'activo' as UserStatus, emailManual: false, selectedGroups: [] as string[],
}

function generateEmail(name: string): string {
  if (!name.trim()) return ''
  const parts = name.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return `${parts[0]}@jimmyacademy.com`
  return `${parts[0]}.${parts[parts.length - 1]}@jimmyacademy.com`
}

function parseExcel(buffer: ArrayBuffer): Omit<AppUser, 'id' | 'createdAt' | 'email' | 'area_id' | 'area_name' | 'groups'>[] {
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
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 20 }, { wch: 34 }, { wch: 14 }, { wch: 30 }]
  const wb2 = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb2, ws, 'Trabajadores')
  XLSX.writeFile(wb2, 'plantilla_trabajadores.xlsx')
}

// Groups cell: max 2 visible chips + overflow badge
function GroupsCell({ u, groups, cellSaving, groupAdd, setGroupAdd, autoSaveGroups }: {
  u: AppUser
  groups: Group[]
  cellSaving: string | null
  groupAdd: string | null
  setGroupAdd: (id: string | null) => void
  autoSaveGroups: (userId: string, groupIds: string[]) => void
}) {
  const MAX = 2
  const visible = u.groups.slice(0, MAX)
  const hidden = u.groups.slice(MAX)
  const available = groups.filter(g => !u.groups.find(ug => ug.id === g.id))

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visible.map(g => (
        <span key={g.id}
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
          style={{ background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
          {g.name}
          <button
            onClick={() => autoSaveGroups(u.id, u.groups.filter(x => x.id !== g.id).map(x => x.id))}
            disabled={cellSaving === u.id}
            className="leading-none opacity-50 hover:opacity-100 ml-0.5 transition-opacity">×</button>
        </span>
      ))}

      {hidden.length > 0 && (
        <span
          title={hidden.map(g => g.name).join(', ')}
          className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold cursor-help"
          style={{ background: 'rgba(148,163,184,0.12)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
          +{hidden.length}
        </span>
      )}

      {available.length > 0 && (
        <div className="relative">
          {groupAdd === u.id ? (
            <select autoFocus
              onChange={e => {
                if (!e.target.value) { setGroupAdd(null); return }
                autoSaveGroups(u.id, [...u.groups.map(g => g.id), e.target.value])
                setGroupAdd(null)
              }}
              onBlur={() => setGroupAdd(null)}
              className="text-[11px] rounded-lg px-1.5 py-0.5 absolute left-0 top-0 z-30 min-w-[160px]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary-border)', color: 'var(--text)', colorScheme: 'dark' }}
              defaultValue="">
              <option value="">Agregar grupo...</option>
              {available.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <button
              onClick={() => setGroupAdd(u.id)}
              disabled={cellSaving === u.id}
              title="Agregar grupo"
              className="w-5 h-5 rounded-full text-[11px] font-bold leading-none flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
              +
            </button>
          )}
        </div>
      )}

      {u.groups.length === 0 && groupAdd !== u.id && (
        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>—</span>
      )}
      {cellSaving === u.id && <Loader2 size={10} className="animate-spin" style={{ color: 'var(--primary)' }} />}
    </div>
  )
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers]     = useState<AppUser[]>([])
  const [areas, setAreas]     = useState<Area[]>([])
  const [groups, setGroups]   = useState<Group[]>([])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('todos')
  const [filterArea, setFilterArea]   = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterRole, setFilterRole]   = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [showModal, setShowModal]     = useState(false)
  const [editUser, setEditUser]       = useState<AppUser | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]   = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [menuOpen, setMenuOpen]       = useState<string | null>(null)
  const [excelError, setExcelError]   = useState('')
  const [saving, setSaving]           = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [cellSaving, setCellSaving] = useState<string | null>(null)
  const [groupAdd, setGroupAdd] = useState<string | null>(null)

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) return
      const data = await res.json()
      const userList: AppUser[] = data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        empresa: u.area || '',
        area_id: u.area_id || '',
        area_name: u.area || '',
        role: u.role === 'admin' ? 'Administrador' : (u.area || 'Trabajador'),
        cedula: u.cedula || '',
        status: u.active ? 'activo' as UserStatus : 'inactivo' as UserStatus,
        createdAt: new Date(u.created_at).toLocaleDateString('es-CO'),
        groups: (u.user_groups ?? []).map((ug: any) => ug.groups).filter(Boolean),
      }))
      setUsers(userList)
    } catch {}
  }

  useEffect(() => {
    loadUsers()
    fetch('/api/areas').then(r => r.ok ? r.json() : []).then(setAreas)
    fetch('/api/groups').then(r => r.ok ? r.json() : []).then(setGroups)
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const match = u.name.toLowerCase().includes(q) || u.cedula.includes(q) || u.role.toLowerCase().includes(q) || u.empresa.toLowerCase().includes(q)
    if (!match) return false
    if (filter !== 'todos' && u.status !== filter) return false
    if (filterArea && u.area_id !== filterArea) return false
    if (filterGroup && !u.groups.some(g => g.id === filterGroup)) return false
    if (filterRole && u.role.toLowerCase() !== filterRole.toLowerCase()) return false
    return true
  })

  const uniqueRoles = [...new Set(users.map(u => u.role).filter(Boolean))]
  const activeCount = users.filter(u => u.status === 'activo').length
  const inactiveCount = users.filter(u => u.status === 'inactivo').length
  const hasSecondaryFilters = !!(filterArea || filterGroup || filterRole)

  const openNew = () => { setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true) }

  const openEdit = async (u: AppUser) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email || '', password: '', empresa: u.empresa, area_id: u.area_id || '', role: u.role, cedula: u.cedula, status: u.status, emailManual: true, selectedGroups: [] })
    setFormErrors({})
    setShowModal(true)
    setMenuOpen(null)
    setLoadingGroups(true)
    try {
      const res = await fetch(`/api/users/${u.id}/groups`)
      if (res.ok) {
        const gList = await res.json()
        setForm(f => ({ ...f, selectedGroups: gList.map((g: any) => g.id) }))
      }
    } catch {}
    setLoadingGroups(false)
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
      const selectedArea = areas.find(a => a.id === form.area_id)
      const areaText = selectedArea?.name || form.empresa

      if (editUser) {
        const body: any = { id: editUser.id, name: form.name, email: form.email, cedula: form.cedula, area: areaText, active: form.status === 'activo' }
        if (form.password.trim()) body.password = form.password
        const res = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) { const d = await res.json(); setFormErrors({ name: d.error || 'Error al guardar' }); setSaving(false); return }
        await fetch(`/api/users/${editUser.id}/groups`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_ids: form.selectedGroups }) })
      } else {
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, email: form.email, password: form.cedula, cedula: form.cedula, role: 'worker', area: areaText }) })
        if (!res.ok) { const d = await res.json(); setFormErrors({ email: d.error || 'Error al crear' }); setSaving(false); return }
        const created = await res.json()
        if (form.selectedGroups.length && created.id) {
          await fetch(`/api/users/${created.id}/groups`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_ids: form.selectedGroups }) })
        }
      }
      await loadUsers()
      setShowModal(false)
    } catch { setFormErrors({ name: 'Error de conexión' }) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await loadUsers()
    setDeleteConfirm(null); setMenuOpen(null); setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const toggleSelect    = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(u => u.id)))
  }

  const handleBulkDelete = async () => {
    if (!selected.size) return
    if (!confirm(`¿Eliminar ${selected.size} usuario(s) permanentemente?`)) return
    for (const id of selected) {
      await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    }
    await loadUsers()
    setSelected(new Set())
  }

  const toggleStatus = async (id: string) => {
    const u = users.find(u => u.id === id)
    if (!u) return
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: u.status !== 'activo' }) })
    setMenuOpen(null)
    await loadUsers()
  }

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExcelError('')
    try {
      const buf = await file.arrayBuffer()
      const rows = parseExcel(buf)
      if (!rows.length) { setExcelError('No se encontraron trabajadores en el archivo'); return }
      let created = 0
      for (const row of rows) {
        if (!row.name || !row.cedula) continue
        const email = generateEmail(row.name)
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: row.name, email, password: row.cedula, cedula: row.cedula, role: 'worker', area: row.empresa }) })
        if (res.ok) created++
      }
      await loadUsers()
      alert(`${created} trabajador(es) importados correctamente`)
    } catch { setExcelError('Error al leer el archivo Excel') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const toggleGroup = (gid: string) => {
    setForm(f => ({
      ...f,
      selectedGroups: f.selectedGroups.includes(gid) ? f.selectedGroups.filter(x => x !== gid) : [...f.selectedGroups, gid],
    }))
  }

  const autoSaveArea = async (userId: string, areaName: string) => {
    setCellSaving(userId)
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, area: areaName }) })
    await loadUsers()
    setCellSaving(null)
  }

  const autoSaveGroups = async (userId: string, groupIds: string[]) => {
    setCellSaving(userId)
    await fetch(`/api/users/${userId}/groups`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_ids: groupIds }) })
    await loadUsers()
    setCellSaving(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Trabajadores</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{users.length} registrados</span>
              {activeCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {activeCount} activos
                </span>
              )}
              {inactiveCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {inactiveCount} inactivos
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="terra-btn-outline" style={{ padding: '8px 14px', fontSize: 12 }}>
            <Download size={13} /> Plantilla
          </button>
          <label className="terra-btn-outline cursor-pointer" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={13} /> Importar Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleExcel} className="hidden" />
          </label>
          <button onClick={openNew} className="terra-btn" style={{ padding: '8px 16px', fontSize: 13 }}>
            <UserPlus size={14} /> Nuevo
          </button>
        </div>
      </div>

      {excelError && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} /> {excelError}
          <button onClick={() => setExcelError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* ── Search + Status filter row ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula, cargo o área..."
            className="terra-input pl-9 py-2 text-sm"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}><X size={13} /></button>}
        </div>
        <div className="flex gap-1 p-1 rounded-xl flex-shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {(['todos', 'activo', 'inactivo'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{ background: filter === f ? 'var(--primary)' : 'transparent', color: filter === f ? '#fff' : 'var(--text-dim)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Compact secondary filters ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Area filter pill */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
          style={{
            background: filterArea ? 'var(--primary-dim)' : 'var(--bg-card)',
            border: `1px solid ${filterArea ? 'var(--primary-border)' : 'var(--border)'}`,
          }}>
          <Building2 size={11} style={{ color: filterArea ? 'var(--primary)' : 'var(--text-faint)' }} />
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="bg-transparent outline-none text-xs cursor-pointer"
            style={{ color: filterArea ? 'var(--primary)' : 'var(--text-dim)', colorScheme: 'dark', appearance: 'none' }}>
            <option value="">Área</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown size={10} style={{ color: filterArea ? 'var(--primary)' : 'var(--text-faint)' }} />
        </label>

        {/* Group filter pill */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
          style={{
            background: filterGroup ? 'var(--primary-dim)' : 'var(--bg-card)',
            border: `1px solid ${filterGroup ? 'var(--primary-border)' : 'var(--border)'}`,
          }}>
          <Users size={11} style={{ color: filterGroup ? 'var(--primary)' : 'var(--text-faint)' }} />
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="bg-transparent outline-none text-xs cursor-pointer"
            style={{ color: filterGroup ? 'var(--primary)' : 'var(--text-dim)', colorScheme: 'dark', appearance: 'none' }}>
            <option value="">Grupo</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <ChevronDown size={10} style={{ color: filterGroup ? 'var(--primary)' : 'var(--text-faint)' }} />
        </label>

        {/* Role/Cargo filter pill */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
          style={{
            background: filterRole ? 'var(--primary-dim)' : 'var(--bg-card)',
            border: `1px solid ${filterRole ? 'var(--primary-border)' : 'var(--border)'}`,
          }}>
          <Tag size={11} style={{ color: filterRole ? 'var(--primary)' : 'var(--text-faint)' }} />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="bg-transparent outline-none text-xs cursor-pointer"
            style={{ color: filterRole ? 'var(--primary)' : 'var(--text-dim)', colorScheme: 'dark', appearance: 'none' }}>
            <option value="">Cargo</option>
            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={10} style={{ color: filterRole ? 'var(--primary)' : 'var(--text-faint)' }} />
        </label>

        {hasSecondaryFilters && (
          <button onClick={() => { setFilterArea(''); setFilterGroup(''); setFilterRole('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <X size={11} /> Limpiar
          </button>
        )}

        {filtered.length !== users.length && (
          <span className="ml-auto text-xs" style={{ color: 'var(--text-faint)' }}>
            {filtered.length} de {users.length}
          </span>
        )}
      </div>

      {/* ── Bulk actions banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto"
              style={{ background: 'var(--red-dim)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Trash2 size={12} /> Eliminar seleccionados
            </button>
            <button onClick={() => setSelected(new Set())} style={{ color: 'var(--text-dim)' }}><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {users.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center terra-card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Users size={28} style={{ color: 'var(--text-faint)' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin trabajadores registrados</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-dim)' }}>Agrega el primero manualmente o importa desde Excel</p>
          <button onClick={openNew} className="terra-btn"><UserPlus size={14} /> Agregar trabajador</button>
        </motion.div>
      ) : (
        <>
          {/* ── Desktop table ───────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="terra-card overflow-hidden hidden md:block">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: 40 }} />
                <col />
                <col style={{ width: 130 }} />
                <col style={{ width: 220 }} />
                <col style={{ width: 82 }} />
                <col style={{ width: 44 }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-blue-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Trabajador</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Área</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Grupos</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((u, i) => (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }} transition={{ delay: Math.min(i * 0.015, 0.25) }}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)}
                          className="w-4 h-4 rounded accent-blue-500" />
                      </td>

                      {/* Trabajador: avatar + nombre + email + cédula + cargo */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text)' }}>
                              {u.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>{u.email || '—'}</span>
                              {u.cedula && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                                  {u.cedula}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Área — compact pill select */}
                      <td className="px-3 py-3.5">
                        <div className="relative inline-flex items-center">
                          <select
                            value={areas.find(a => a.name === u.area_name)?.id || ''}
                            onChange={e => {
                              const a = areas.find(x => x.id === e.target.value)
                              autoSaveArea(u.id, a?.name || '')
                            }}
                            disabled={cellSaving === u.id}
                            className="text-[11px] font-medium rounded-lg pl-2 pr-6 py-1 transition-all"
                            style={{
                              background: u.area_name ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
                              border: `1px solid ${u.area_name ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`,
                              color: u.area_name ? 'var(--primary)' : 'var(--text-faint)',
                              cursor: 'pointer',
                              appearance: 'none',
                              colorScheme: 'dark',
                              maxWidth: 110,
                            }}>
                            <option value="">Sin área</option>
                            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 pointer-events-none"
                            style={{ color: u.area_name ? 'var(--primary)' : 'var(--text-faint)' }} />
                        </div>
                      </td>

                      {/* Grupos — chips with overflow */}
                      <td className="px-3 py-3.5">
                        <GroupsCell
                          u={u} groups={groups}
                          cellSaving={cellSaving} groupAdd={groupAdd}
                          setGroupAdd={setGroupAdd} autoSaveGroups={autoSaveGroups}
                        />
                      </td>

                      {/* Estado */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={u.status === 'activo'
                            ? { background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
                            : { background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: u.status === 'activo' ? '#10B981' : '#EF4444' }} />
                          {u.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-2 py-3.5">
                        <div className="relative flex justify-center">
                          <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => e.currentTarget.classList.add('opacity-100')}>
                            <MoreVertical size={15} />
                          </button>
                          {menuOpen === u.id && (
                            <div className="absolute right-0 top-8 rounded-xl shadow-xl z-20 w-44 py-1 overflow-hidden"
                              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
                              <button onClick={() => { setMenuOpen(null); router.push(`/dashboard/users/${u.id}`) }}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all hover:opacity-80"
                                style={{ color: 'var(--text-dim)' }}>
                                <BookOpen size={13} /> Ver hoja de vida
                              </button>
                              <button onClick={() => openEdit(u)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all hover:opacity-80"
                                style={{ color: 'var(--text-dim)' }}>
                                <Edit2 size={13} /> Editar datos
                              </button>
                              <button onClick={() => toggleStatus(u.id)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all hover:opacity-80"
                                style={{ color: 'var(--text-dim)' }}>
                                <CheckCircle size={13} /> {u.status === 'activo' ? 'Desactivar' : 'Activar'}
                              </button>
                              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                              <button onClick={() => { setDeleteConfirm(u.id); setMenuOpen(null) }}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all hover:opacity-80"
                                style={{ color: '#FCA5A5' }}>
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

            {filtered.length === 0 && users.length > 0 && (
              <div className="py-14 text-center">
                <Search size={24} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-faint)' }} />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Sin resultados</p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Ajusta los filtros o el término de búsqueda</p>
              </div>
            )}
          </motion.div>

          {/* ── Mobile cards ─────────────────────────────────────────── */}
          <div className="md:hidden space-y-2">
            <AnimatePresence>
              {filtered.map(u => (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="terra-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{u.name}</div>
                        <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-faint)' }}>CC: {u.cedula || '—'}</div>
                        {u.area_name && (
                          <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-dim)' }}>
                            <Layers size={10} style={{ color: 'var(--primary)' }} />{u.area_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={u.status === 'activo'
                          ? { background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
                          : { background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: u.status === 'activo' ? '#10B981' : '#EF4444' }} />
                        {u.status === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                      <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)} style={{ color: 'var(--text-faint)' }}>
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </div>
                  {menuOpen === u.id && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button onClick={() => { setMenuOpen(null); router.push(`/dashboard/users/${u.id}`) }}
                        className="terra-btn flex-1 text-xs py-2 justify-center"><BookOpen size={12} /> Hoja de vida</button>
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
        </>
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      {/* ── Add/Edit Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>

              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}>
                    <UserPlus size={15} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 className="font-bold" style={{ color: 'var(--text)' }}>{editUser ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h2>
                </div>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {([
                  { key: 'name',   label: 'Nombre completo *',                       placeholder: 'JUAN CARLOS PEREZ GOMEZ',   mono: false, type: 'text'  },
                  { key: 'cedula', label: 'Cédula * (será la contraseña inicial)',   placeholder: '1052392965',                 mono: true,  type: 'text'  },
                  { key: 'email',  label: 'Correo electrónico *',                    placeholder: 'juan.perez@jimmyacademy.com', mono: false, type: 'email' },
                  { key: 'role',   label: 'Cargo',                                   placeholder: 'SUPERVISOR DE MONTAJE',      mono: false, type: 'text'  },
                ] as const).map(({ key, label, placeholder, mono, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => {
                        const val = key === 'cedula' ? e.target.value.replace(/\D/g, '') : e.target.value
                        if (key === 'name') {
                          const upper = val.toUpperCase()
                          setForm(f => ({ ...f, name: upper, ...(!f.emailManual ? { email: generateEmail(upper) } : {}) }))
                        } else if (key === 'cedula') {
                          setForm(f => ({ ...f, cedula: val, password: val }))
                        } else if (key === 'role') {
                          setForm(f => ({ ...f, role: val.toUpperCase() }))
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

                <div>
                  <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                    <Layers size={12} style={{ color: 'var(--primary)' }} /> Área
                  </label>
                  <select value={form.area_id} onChange={e => setForm(f => ({ ...f, area_id: e.target.value }))} className="terra-input">
                    <option value="">Sin área asignada</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                {groups.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                      <UserCheck size={12} style={{ color: 'var(--primary)' }} /> Grupos
                      {loadingGroups && <Loader2 size={11} className="animate-spin ml-1" style={{ color: 'var(--text-faint)' }} />}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {groups.map(g => {
                        const checked = form.selectedGroups.includes(g.id)
                        return (
                          <button key={g.id} type="button" onClick={() => toggleGroup(g.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all"
                            style={{
                              background: checked ? 'var(--primary-dim)' : 'var(--bg-card)',
                              border: `1px solid ${checked ? 'var(--primary-border)' : 'var(--border)'}`,
                              color: checked ? 'var(--primary)' : 'var(--text-dim)',
                            }}>
                            <div className="w-3 h-3 rounded flex items-center justify-center flex-shrink-0"
                              style={{ background: checked ? 'var(--primary)' : 'var(--border)' }}>
                              {checked && <span className="text-white text-[8px]">✓</span>}
                            </div>
                            <span className="truncate">{g.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {editUser && (
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Estado</label>
                    <div className="flex gap-2">
                      {(['activo', 'inactivo'] as UserStatus[]).map(s => (
                        <button key={s} onClick={() => setForm({ ...form, status: s })}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                          style={form.status === s
                            ? { background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--primary)' }
                            : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setShowModal(false)} className="terra-btn-outline flex-1 py-2.5 justify-center">Cancelar</button>
                <button onClick={handleSubmit} disabled={saving} className="terra-btn flex-1 py-2.5 justify-center">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><UserPlus size={14} /> {editUser ? 'Guardar cambios' : 'Agregar'}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 w-full max-w-sm text-center rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <Trash2 size={22} style={{ color: '#FCA5A5' }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>¿Eliminar trabajador?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
                Se eliminará <span className="font-semibold" style={{ color: 'var(--text)' }}>{users.find(u => u.id === deleteConfirm)?.name}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="terra-btn-outline flex-1 py-2.5 justify-center">Cancelar</button>
                <button onClick={() => handleDelete(deleteConfirm!)}
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
