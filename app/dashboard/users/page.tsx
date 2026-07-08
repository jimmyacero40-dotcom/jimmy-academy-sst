'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import {
  Users, Search, MoreVertical, CheckCircle,
  Building2, X, Edit2, Trash2, Download, ChevronDown,
  UserPlus, FileSpreadsheet, AlertCircle, Loader2,
  Layers, UserCheck, Tag, Eye, BookOpen
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
  photo_url?: string | null
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

// ── Compact filter input ─────────────────────────────────────────────────────
function FilterInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="relative mt-1.5">
      <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-6 pr-2 py-1 text-[11px] rounded-md outline-none transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          colorScheme: 'dark',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--primary-border)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>
          <X size={10} />
        </button>
      )}
    </div>
  )
}

// ── Compact filter select ────────────────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder: string
}) {
  return (
    <div className="relative mt-1.5">
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full pl-2 pr-6 py-1 text-[11px] rounded-md outline-none transition-colors appearance-none cursor-pointer"
        style={{
          background: value ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
          border: `1px solid ${value ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
          color: value ? 'var(--primary)' : 'var(--text-faint)',
          colorScheme: 'dark',
        }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: value ? 'var(--primary)' : 'var(--text-faint)' }} />
    </div>
  )
}

// ── Groups cell with popover ─────────────────────────────────────────────────
function GroupsCell({ u, groups, cellSaving, groupPopover, setGroupPopover, autoSaveGroups }: {
  u: AppUser
  groups: Group[]
  cellSaving: string | null
  groupPopover: string | null
  setGroupPopover: (id: string | null) => void
  autoSaveGroups: (userId: string, groupIds: string[]) => void
}) {
  const available = groups.filter(g => !u.groups.find(ug => ug.id === g.id))
  const MAX_VISIBLE = 2
  const visible = u.groups.slice(0, MAX_VISIBLE)
  const overflow = u.groups.slice(MAX_VISIBLE)

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visible.map(g => (
        <span key={g.id}
          className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }}>
          {g.name}
          <button
            onMouseDown={e => { e.preventDefault(); autoSaveGroups(u.id, u.groups.filter(x => x.id !== g.id).map(x => x.id)) }}
            disabled={cellSaving === u.id}
            className="ml-0.5 opacity-40 hover:opacity-90 transition-opacity leading-none">×</button>
        </span>
      ))}

      {overflow.length > 0 && (
        <span title={overflow.map(g => g.name).join(', ')}
          className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-semibold cursor-help"
          style={{ background: 'var(--bg-card)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
          +{overflow.length}
        </span>
      )}

      {/* Add group button + popover */}
      {available.length > 0 && (
        <div className="relative">
          <button
            onMouseDown={e => { e.preventDefault(); setGroupPopover(groupPopover === u.id ? null : u.id) }}
            disabled={cellSaving === u.id}
            title="Agregar grupo"
            className="w-5 h-5 rounded-full text-[11px] font-bold leading-none flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
            +
          </button>

          {groupPopover === u.id && (
            <div className="absolute left-0 top-6 z-50 rounded-xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', minWidth: 200 }}>
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--border)' }}>
                Agregar al grupo
              </div>
              <div className="py-1 max-h-48 overflow-y-auto">
                {available.map(g => (
                  <button key={g.id}
                    onMouseDown={e => {
                      e.preventDefault()
                      autoSaveGroups(u.id, [...u.groups.map(x => x.id), g.id])
                      setGroupPopover(null)
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left transition-colors"
                    style={{ color: 'var(--text)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {u.groups.length === 0 && groupPopover !== u.id && (
        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>—</span>
      )}
      {cellSaving === u.id && <Loader2 size={10} className="animate-spin" style={{ color: 'var(--primary)' }} />}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers]   = useState<AppUser[]>([])
  const [areas, setAreas]   = useState<Area[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  // Filters
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterArea, setFilterArea]   = useState('')
  const [sortField, setSortField] = useState<'name' | 'cedula' | 'status' | 'area_name' | null>('name')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterRole, setFilterRole]   = useState('')

  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Modals & UI state
  const [showModal, setShowModal]         = useState(false)
  const [editUser, setEditUser]           = useState<AppUser | null>(null)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]       = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [excelError, setExcelError]       = useState('')
  const [saving, setSaving]               = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [cellSaving, setCellSaving] = useState<string | null>(null)
  const [groupPopover, setGroupPopover] = useState<string | null>(null)

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) return
      const data = await res.json()
      setUsers(data.map((u: any) => ({
        id: u.id, name: u.name, email: u.email,
        empresa: u.area || '', area_id: u.area_id || '', area_name: u.area || '',
        role: u.role === 'admin' ? 'Administrador' : (u.area || 'Trabajador'),
        cedula: u.cedula || '',
        status: u.active ? 'activo' as UserStatus : 'inactivo' as UserStatus,
        createdAt: new Date(u.created_at).toLocaleDateString('es-CO'),
        photo_url: u.photo_url || null,
        groups: (u.user_groups ?? []).map((ug: any) => ug.groups).filter(Boolean),
      })))
    } catch {}
  }

  useEffect(() => {
    loadUsers()
    fetch('/api/areas').then(r => r.ok ? r.json() : []).then(setAreas)
    fetch('/api/groups').then(r => r.ok ? r.json() : []).then(setGroups)
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    if (q && !u.name.toLowerCase().includes(q) && !u.cedula.includes(q) && !u.role.toLowerCase().includes(q) && !u.empresa.toLowerCase().includes(q)) return false
    if (filterStatus && u.status !== filterStatus) return false
    if (filterArea && u.area_id !== filterArea) return false
    if (filterGroup && !u.groups.some(g => g.id === filterGroup)) return false
    if (filterRole && u.role.toLowerCase() !== filterRole.toLowerCase()) return false
    return true
  })

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0
    let va = '', vb = ''
    if (sortField === 'name')      { va = a.name;      vb = b.name }
    if (sortField === 'cedula')    { va = a.cedula;    vb = b.cedula }
    if (sortField === 'status')    { va = a.status;    vb = b.status }
    if (sortField === 'area_name') { va = a.area_name; vb = b.area_name }
    const cmp = va.localeCompare(vb, 'es', { sensitivity: 'base' })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const uniqueRoles = [...new Set(users.map(u => u.role).filter(Boolean))]
  const activeCount   = users.filter(u => u.status === 'activo').length
  const inactiveCount = users.filter(u => u.status === 'inactivo').length
  const hasFilters    = !!(search || filterStatus || filterArea || filterGroup || filterRole)

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const openNew = () => { setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true) }

  const openEdit = async (u: AppUser) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email || '', password: '', empresa: u.empresa, area_id: u.area_id || '', role: u.role, cedula: u.cedula, status: u.status, emailManual: true, selectedGroups: [] })
    setFormErrors({}); setShowModal(true)
    setLoadingGroups(true)
    try {
      const res = await fetch(`/api/users/${u.id}/groups`)
      if (res.ok) { const gList = await res.json(); setForm(f => ({ ...f, selectedGroups: gList.map((g: any) => g.id) })) }
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
      const areaText = areas.find(a => a.id === form.area_id)?.name || form.empresa
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
      await loadUsers(); setShowModal(false)
    } catch { setFormErrors({ name: 'Error de conexión' }) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await loadUsers()
    setDeleteConfirm(null); setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const toggleSelect    = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => { if (selected.size === sorted.length) setSelected(new Set()); else setSelected(new Set(sorted.map(u => u.id))) }

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`¿Eliminar ${selected.size} usuario(s) permanentemente?`)) return
    for (const id of selected) await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await loadUsers(); setSelected(new Set())
  }

  const toggleStatus = async (id: string) => {
    const u = users.find(u => u.id === id); if (!u) return
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: u.status !== 'activo' }) })
    await loadUsers()
  }

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setExcelError('')
    try {
      const rows = parseExcel(await file.arrayBuffer())
      if (!rows.length) { setExcelError('No se encontraron trabajadores en el archivo'); return }
      let created = 0
      for (const row of rows) {
        if (!row.name || !row.cedula) continue
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: row.name, email: generateEmail(row.name), password: row.cedula, cedula: row.cedula, role: 'worker', area: row.empresa }) })
        if (res.ok) created++
      }
      await loadUsers(); alert(`${created} trabajador(es) importados correctamente`)
    } catch { setExcelError('Error al leer el archivo Excel') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const toggleGroup = (gid: string) => setForm(f => ({ ...f, selectedGroups: f.selectedGroups.includes(gid) ? f.selectedGroups.filter(x => x !== gid) : [...f.selectedGroups, gid] }))

  const autoSaveArea = async (userId: string, areaName: string) => {
    setCellSaving(userId)
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, area: areaName }) })
    await loadUsers(); setCellSaving(null)
  }

  const autoSaveGroups = async (userId: string, groupIds: string[]) => {
    setCellSaving(userId)
    await fetch(`/api/users/${userId}/groups`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_ids: groupIds }) })
    await loadUsers(); setCellSaving(null)
  }

  // ── TH helper ────────────────────────────────────────────────────────────
  const TH = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <th className={`px-4 py-0 text-left align-top ${className}`}
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="py-3">{children}</div>
    </th>
  )

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    const active = sortField === field
    return (
      <span className="inline-flex flex-col ml-1 leading-none" style={{ verticalAlign: 'middle' }}>
        <span style={{ opacity: active && sortDir === 'asc' ? 1 : 0.25, fontSize: 8, lineHeight: '9px', color: active ? 'var(--primary)' : 'var(--text-faint)' }}>▲</span>
        <span style={{ opacity: active && sortDir === 'desc' ? 1 : 0.25, fontSize: 8, lineHeight: '9px', color: active ? 'var(--primary)' : 'var(--text-faint)' }}>▼</span>
      </span>
    )
  }

  const ColLabel = ({ children, field }: { children: React.ReactNode; field?: typeof sortField }) => (
    field
      ? <button onClick={() => handleSort(field)}
          className="flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-widest transition-colors hover:opacity-80"
          style={{ color: sortField === field ? 'var(--primary)' : 'var(--text-faint)' }}>
          {children}<SortIcon field={field} />
        </button>
      : <span className="text-[10px] font-semibold uppercase tracking-widest block" style={{ color: 'var(--text-faint)' }}>
          {children}
        </span>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
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
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterArea(''); setFilterGroup(''); setFilterRole(''); setSortField('name'); setSortDir('asc') }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <X size={11} /> Limpiar filtros
            </button>
          )}
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

      {/* Bulk actions */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
            </span>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto"
              style={{ background: 'var(--red-dim)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Trash2 size={12} /> Eliminar seleccionados
            </button>
            <button onClick={() => setSelected(new Set())} style={{ color: 'var(--text-dim)' }}><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
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
          {/* ── Desktop table ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="terra-card hidden md:block"
            style={{ borderRadius: 16, overflow: 'visible' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: 40 }} />
                <col />                        {/* Trabajador — flexible */}
                <col style={{ width: 115 }} /> {/* Cédula */}
                <col style={{ width: 145 }} /> {/* Área */}
                <col style={{ width: 210 }} /> {/* Grupos */}
                <col style={{ width: 110 }} /> {/* Estado */}
                <col style={{ width: 100 }} /> {/* Acciones */}
              </colgroup>

              {/* ── Table header with embedded filters ───────────────── */}
              <thead>
                <tr>
                  {/* Checkbox */}
                  <th className="px-4 py-3 text-left align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                    <input type="checkbox"
                      checked={selected.size === sorted.length && sorted.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-blue-500" />
                  </th>

                  {/* Trabajador + search */}
                  <TH>
                    <ColLabel field="name">Trabajador</ColLabel>
                    <FilterInput value={search} onChange={setSearch} placeholder="Buscar..." />
                  </TH>

                  {/* Cédula */}
                  <TH>
                    <ColLabel field="cedula">Cédula</ColLabel>
                    <div className="mt-1.5 h-6" />
                  </TH>

                  {/* Área */}
                  <TH>
                    <ColLabel field="area_name">Área</ColLabel>
                    <FilterSelect
                      value={filterArea} onChange={setFilterArea}
                      placeholder="Todas"
                      options={areas.map(a => ({ value: a.id, label: a.name }))}
                    />
                  </TH>

                  {/* Grupos */}
                  <TH>
                    <ColLabel>Grupos</ColLabel>
                    <FilterSelect
                      value={filterGroup} onChange={setFilterGroup}
                      placeholder="Todos"
                      options={groups.map(g => ({ value: g.id, label: g.name }))}
                    />
                  </TH>

                  {/* Estado */}
                  <TH>
                    <ColLabel field="status">Estado</ColLabel>
                    <FilterSelect
                      value={filterStatus} onChange={setFilterStatus}
                      placeholder="Todos"
                      options={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]}
                    />
                  </TH>

                  {/* Acciones */}
                  <th className="px-4 py-3 text-right align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Acciones</span>
                  </th>
                </tr>
              </thead>

              {/* ── Rows ─────────────────────────────────────────────── */}
              <tbody>
                <AnimatePresence>
                  {sorted.map((u, i) => (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }} transition={{ delay: Math.min(i * 0.012, 0.2) }}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)}
                          className="w-4 h-4 rounded accent-blue-500" />
                      </td>

                      {/* Trabajador: avatar + nombre + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.photo_url
                            ? <img src={u.photo_url} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            : <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>{getInitials(u.name)}</div>
                          }
                          <div className="min-w-0">
                            <div className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--text)' }}>
                              {u.name}
                            </div>
                            <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-faint)' }}>
                              {u.email || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px]" style={{ color: 'var(--text-dim)' }}>
                          {u.cedula || '—'}
                        </span>
                      </td>

                      {/* Área — compact inline select */}
                      <td className="px-4 py-3">
                        <div className="relative inline-flex items-center w-full">
                          <select
                            value={areas.find(a => a.name === u.area_name)?.id || ''}
                            onChange={e => { const a = areas.find(x => x.id === e.target.value); autoSaveArea(u.id, a?.name || '') }}
                            disabled={cellSaving === u.id}
                            className="w-full text-[11px] font-medium rounded-lg pl-2.5 pr-6 py-1.5 transition-all appearance-none cursor-pointer"
                            style={{
                              background: u.area_name ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
                              border: `1px solid ${u.area_name ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`,
                              color: u.area_name ? '#93C5FD' : 'var(--text-faint)',
                              colorScheme: 'dark',
                            }}>
                            <option value="">Sin área</option>
                            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 pointer-events-none"
                            style={{ color: u.area_name ? '#93C5FD' : 'var(--text-faint)' }} />
                        </div>
                      </td>

                      {/* Grupos */}
                      <td className="px-4 py-3" style={{ overflow: 'visible', position: 'relative' }}>
                        <GroupsCell
                          u={u} groups={groups}
                          cellSaving={cellSaving} groupPopover={groupPopover}
                          setGroupPopover={setGroupPopover} autoSaveGroups={autoSaveGroups}
                        />
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={u.status === 'activo'
                            ? { background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
                            : { background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: u.status === 'activo' ? '#10B981' : '#EF4444' }} />
                          {u.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acciones inline */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => router.push(`/dashboard/users/${u.id}`)}
                            title="Ver hoja de vida"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--primary)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openEdit(u)}
                            title="Editar datos"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--primary)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => toggleStatus(u.id)}
                            title={u.status === 'activo' ? 'Desactivar' : 'Activar'}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = u.status === 'activo' ? '#FCA5A5' : '#6EE7B7' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                            <CheckCircle size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(u.id)}
                            title="Eliminar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#FCA5A5' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {sorted.length === 0 && users.length > 0 && (
              <div className="py-16 text-center">
                <Search size={24} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-faint)' }} />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Sin resultados</p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Ajusta los filtros o el término de búsqueda</p>
              </div>
            )}

            {/* Footer with count */}
            {sorted.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {sorted.length === users.length
                    ? `${users.length} trabajadores`
                    : `${sorted.length} de ${users.length} trabajadores`}
                </span>
                {selected.size > 0 && (
                  <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                    {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* ── Mobile cards ─────────────────────────────────────────── */}
          <div className="md:hidden space-y-2">
            {/* Mobile search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar trabajador..."
                className="terra-input pl-9 py-2 text-sm" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}><X size={13} /></button>}
            </div>
            <AnimatePresence>
              {sorted.map(u => (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="terra-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.photo_url
                        ? <img src={u.photo_url} alt={u.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        : <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorForUser(u.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{getInitials(u.name)}</div>
                      }
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{u.name}</div>
                        <div className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--text-faint)' }}>CC: {u.cedula || '—'}</div>
                        {u.area_name && (
                          <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-dim)' }}>
                            <Layers size={10} style={{ color: 'var(--primary)' }} />{u.area_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={u.status === 'activo'
                        ? { background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
                        : { background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: u.status === 'activo' ? '#10B981' : '#EF4444' }} />
                      {u.status === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button onClick={() => router.push(`/dashboard/users/${u.id}`)}
                      className="terra-btn flex-1 text-xs py-2 justify-center"><BookOpen size={12} /> Hoja de vida</button>
                    <button onClick={() => openEdit(u)} className="terra-btn-outline flex-1 text-xs py-2 justify-center"><Edit2 size={12} /> Editar</button>
                    <button onClick={() => toggleStatus(u.id)} className="terra-btn-outline flex-1 text-xs py-2 justify-center"><CheckCircle size={12} /> {u.status === 'activo' ? 'Desactivar' : 'Activar'}</button>
                    <button onClick={() => setDeleteConfirm(u.id)} className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--red-dim)', color: '#FCA5A5' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Close popovers on outside click */}
      {groupPopover && <div className="fixed inset-0 z-40" onClick={() => setGroupPopover(null)} />}

      {/* ── Add/Edit Modal ──────────────────────────────────────────── */}
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
                  { key: 'name',   label: 'Nombre completo *',                      placeholder: 'JUAN CARLOS PEREZ GOMEZ',   mono: false, type: 'text'  },
                  { key: 'cedula', label: 'Cédula * (será la contraseña inicial)',  placeholder: '1052392965',                 mono: true,  type: 'text'  },
                  { key: 'email',  label: 'Correo electrónico *',                   placeholder: 'juan.perez@jimmyacademy.com', mono: false, type: 'email' },
                  { key: 'role',   label: 'Cargo',                                  placeholder: 'SUPERVISOR DE MONTAJE',      mono: false, type: 'text'  },
                ] as const).map(({ key, label, placeholder, mono, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>{label}</label>
                    <input type={type} value={(form as any)[key]}
                      onChange={e => {
                        const val = key === 'cedula' ? e.target.value.replace(/\D/g, '') : e.target.value
                        if (key === 'name') { const upper = val.toUpperCase(); setForm(f => ({ ...f, name: upper, ...(!f.emailManual ? { email: generateEmail(upper) } : {}) })) }
                        else if (key === 'cedula') { setForm(f => ({ ...f, cedula: val, password: val })) }
                        else if (key === 'role') { setForm(f => ({ ...f, role: val.toUpperCase() })) }
                        else if (key === 'email') { setForm(f => ({ ...f, email: e.target.value, emailManual: true })) }
                        else { setForm(f => ({ ...f, [key]: val })) }
                      }}
                      placeholder={placeholder} inputMode={key === 'cedula' ? 'numeric' : undefined}
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

      {/* ── Delete confirm ──────────────────────────────────────────── */}
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
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'var(--red)' }}>Eliminar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
