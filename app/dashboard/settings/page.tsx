'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Settings, Building2, Bell, Shield, Globe, Palette,
  Save, ChevronRight, Mail, Phone, MapPin,
  FileText, Lock, Users, Database, CheckCircle, User, Check, AlertCircle, Loader2,
  DoorOpen, UserPlus, KeyRound, RefreshCw, Trash2, RotateCcw, Search
} from 'lucide-react'
import { useTheme, THEMES, type ThemeId } from '@/components/ThemeProvider'
import { CATALOGO_PERMISOS, PERMISOS_POR_ROL, permisosEfectivos } from '@/lib/permisos'
import SedesPorterias from '@/components/SedesPorterias'
import { generarClave } from '@/lib/claves'

const ADMIN_SECTIONS = [
  { id: 'empresa',        label: 'Empresa',      icon: Building2, superadminOnly: false },
  { id: 'tema',           label: 'Tema Visual',   icon: Palette,   superadminOnly: false },
  { id: 'notificaciones', label: 'Notificaciones',icon: Bell,      superadminOnly: false },
  { id: 'seguridad',      label: 'Seguridad',     icon: Shield,    superadminOnly: false },
  { id: 'usuarios',       label: 'Usuarios',      icon: Users,     superadminOnly: true  },
  { id: 'sedes',          label: 'Sedes y Porterías', icon: DoorOpen, superadminOnly: true },
  { id: 'sistema',        label: 'Sistema',        icon: Settings,  superadminOnly: false },
]

// "Preferencias" (sistema) removed — no value for workers
const WORKER_SECTIONS = [
  { id: 'perfil',         label: 'Mi Perfil',     icon: User   },
  { id: 'seguridad',      label: 'Seguridad',     icon: Shield },
  { id: 'notificaciones', label: 'Notificaciones',icon: Bell   },
]

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button onClick={() => setOn(!on)}
      className={`rounded-full transition-all relative flex-shrink-0 ${on ? 'bg-[var(--amber)]' : 'bg-white/15'}`}
      style={{ height: 22, width: 40 }}>
      <div className={`absolute top-0.5 rounded-full bg-white shadow transition-all`}
        style={{ width: 18, height: 18, left: on ? 20 : 2 }} />
    </button>
  )
}

interface PlatformUser {
  id: string; name: string; email: string; correo?: string | null; role: string; active: boolean; cedula: string
  permissions?: string[] | null
}

function PermisosGrid({ seleccionados, bloqueado, onToggle }: {
  seleccionados: string[]; bloqueado?: boolean; onToggle: (id: string) => void
}) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {CATALOGO_PERMISOS.map(({ grupo, permisos }) => (
        <div key={grupo} className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-label)' }}>{grupo}</div>
          <div className="space-y-1.5">
            {permisos.map(p => {
              const activo = seleccionados.includes(p.id)
              return (
                <label key={p.id} className={`flex items-start gap-2 ${bloqueado ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" checked={activo} disabled={bloqueado}
                    onChange={() => onToggle(p.id)}
                    className="mt-0.5 w-3.5 h-3.5 rounded accent-amber-500 flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-medium leading-tight" style={{ color: activo ? 'var(--text)' : 'var(--text-dim)' }}>{p.label}</span>
                    <span className="block text-[10px] leading-tight" style={{ color: 'var(--text-faint)' }}>{p.descripcion}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'worker'
  const isWorker = userRole === 'worker'
  const isSuperAdmin = userRole === 'superadmin'
  const SECTIONS = isWorker
    ? WORKER_SECTIONS
    : ADMIN_SECTIONS.filter(s => !s.superadminOnly || isSuperAdmin)

  const [active, setActive] = useState('')

  // Permite enlazar una sección concreta, p. ej. /dashboard/settings?seccion=sedes
  useEffect(() => {
    const pedida = new URLSearchParams(window.location.search).get('seccion')
    if (pedida && SECTIONS.some(s => s.id === pedida)) setActive(pedida)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)
  const { theme, setTheme } = useTheme()

  // ── Profile form (workers) ────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ nombre: '', email: '', telefono: '', ciudad: '', cargo: '' })
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    if (!isWorker) return
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : {})
      .then((d: any) => {
        setProfileForm({
          nombre:   [d.nombres, d.apellidos].filter(Boolean).join(' '),
          email:    d.email_personal    || '',
          telefono: d.telefono          || '',
          ciudad:   d.ciudad_residencia || '',
          cargo:    d.cargo_confirmado  || '',
        })
        setProfileLoaded(true)
      })
      .catch(() => setProfileLoaded(true))
  }, [isWorker])

  // ── Company form (admins) ─────────────────────────────────────────────
  const [companyForm, setCompanyForm] = useState({
    name: '', nit: '', correo: '', telefono: '', ciudad: '', sector: '',
    responsable_nombre: '', responsable_cargo: '', responsable_email: '', responsable_licencia: '',
  })
  const [companyLoaded, setCompanyLoaded] = useState(false)

  useEffect(() => {
    if (isWorker) return
    fetch('/api/company-info')
      .then(r => r.ok ? r.json() : {})
      .then((d: any) => {
        setCompanyForm({
          name:                 d.name                 || '',
          nit:                  d.nit                  || '',
          correo:               d.correo               || '',
          telefono:             d.telefono             || '',
          ciudad:               d.ciudad               || '',
          sector:               d.sector               || '',
          responsable_nombre:   d.responsable_nombre   || '',
          responsable_cargo:    d.responsable_cargo    || '',
          responsable_email:    d.responsable_email    || '',
          responsable_licencia: d.responsable_licencia || '',
        })
        setCompanyLoaded(true)
      })
      .catch(() => setCompanyLoaded(true))
  }, [isWorker])

  // ── Password form ─────────────────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({ current: '', nueva: '', confirm: '' })
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess] = useState(false)

  // ── Platform users (superadmin only) ─────────────────────────────────
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([])
  const [puLoading, setPuLoading] = useState(false)
  const [puForm, setPuForm] = useState({
    name: '', email: '', correo: '', password: '', role: 'portero', cedula: '',
    permissions: PERMISOS_POR_ROL['portero'],
  })
  const [permEditando, setPermEditando] = useState<string | null>(null)
  const [permBorrador, setPermBorrador] = useState<string[]>([])
  const [permGuardando, setPermGuardando] = useState(false)
  const [claveAsignada, setClaveAsignada] = useState<{ nombre: string; usuario: string; clave: string } | null>(null)
  const [datosBorrador, setDatosBorrador] = useState({ name: '', email: '', correo: '', cedula: '', role: '', active: true, password: '' })

  // Filtros de la lista de usuarios
  const [uBusqueda, setUBusqueda] = useState('')
  const [uRol, setURol] = useState('')
  const [uEstado, setUEstado] = useState('')
  const [uOrden, setUOrden] = useState<'nombre' | 'rol' | 'permisos'>('nombre')

  const usuariosFiltrados = platformUsers.filter(u => {
    if (uRol && u.role !== uRol) return false
    if (uEstado && String(u.active) !== uEstado) return false
    if (!uBusqueda) return true
    const q = uBusqueda.trim().toLowerCase()
    return u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.cedula || '').includes(q)
  }).sort((a, b) => {
    if (uOrden === 'rol') return a.role.localeCompare(b.role) || a.name.localeCompare(b.name, 'es')
    if (uOrden === 'permisos') return permisosEfectivos(b.role, b.permissions).length - permisosEfectivos(a.role, a.permissions).length
    return a.name.localeCompare(b.name, 'es')
  })
  const uHayFiltros = !!(uBusqueda || uRol || uEstado || uOrden !== 'nombre')

  /** Al cambiar el rol se propone su plantilla; el usuario puede ajustarla. */
  function cambiarRol(role: string) {
    setPuForm(p => ({ ...p, role, permissions: PERMISOS_POR_ROL[role] ?? [] }))
  }

  function alternarPermiso(lista: string[], id: string) {
    return lista.includes(id) ? lista.filter(p => p !== id) : [...lista, id]
  }

  function abrirEdicion(u: PlatformUser) {
    if (permEditando === u.id) { setPermEditando(null); return }
    setPermEditando(u.id)
    setPermBorrador(permisosEfectivos(u.role, u.permissions))
    setDatosBorrador({ name: u.name, email: u.email, correo: u.correo || '', cedula: u.cedula || '', role: u.role, active: u.active, password: '' })
  }

  async function guardarUsuario(userId: string) {
    setPermGuardando(true); setPuError(null)
    const cambios: Record<string, any> = {
      id: userId,
      name: datosBorrador.name,
      email: datosBorrador.email,
      correo: datosBorrador.correo.trim() || null,
      cedula: datosBorrador.cedula,
      role: datosBorrador.role,
      active: datosBorrador.active,
      permissions: permBorrador,
    }
    // La contraseña solo se envía si se escribió una nueva; el API la cifra.
    if (datosBorrador.password.trim()) cambios.password = datosBorrador.password.trim()

    const res = await fetch('/api/users', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    })
    if (!res.ok) setPuError((await res.json().catch(() => ({}))).error || 'No fue posible guardar')
    else {
      // Se muestra aquí porque, una vez cifrada, no se puede volver a consultar.
      if (cambios.password) setClaveAsignada({ nombre: datosBorrador.name, usuario: datosBorrador.email, clave: cambios.password })
      setPermEditando(null)
    }
    await loadPlatformUsers()
    setPermGuardando(false)
  }
  const [puSaving, setPuSaving] = useState(false)
  const [puError, setPuError] = useState<string | null>(null)
  const [puSuccess, setPuSuccess] = useState(false)

  async function loadPlatformUsers() {
    setPuLoading(true)
    const res = await fetch('/api/users?role=all')
    if (res.ok) setPlatformUsers(await res.json())
    setPuLoading(false)
  }

  async function createPlatformUser() {
    setPuError(null)
    if (!puForm.name || !puForm.email || !puForm.password) {
      setPuError('Nombre, email y contraseña son obligatorios'); return
    }
    setPuSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(puForm),
    })
    if (res.ok) {
      setPuForm({ name: '', email: '', correo: '', password: '', role: 'portero', cedula: '', permissions: PERMISOS_POR_ROL['portero'] })
      setPuSuccess(true)
      setTimeout(() => setPuSuccess(false), 2500)
      await loadPlatformUsers()
    } else {
      const b = await res.json().catch(() => ({}))
      setPuError(b.error ?? 'Error al crear usuario')
    }
    setPuSaving(false)
  }

  const effectiveActive = active || (isWorker ? 'perfil' : 'empresa')

  useEffect(() => {
    if (effectiveActive === 'usuarios' && isSuperAdmin) loadPlatformUsers()
  }, [effectiveActive])

  const handleThemeChange = async (id: ThemeId) => {
    setTheme(id)
    setThemeSaving(true)
    try {
      await fetch('/api/companies/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: id }),
      })
      setThemeSaved(true)
      setTimeout(() => setThemeSaved(false), 2000)
    } catch (_) {}
    setThemeSaving(false)
  }

  // ── Save dispatcher ───────────────────────────────────────────────────
  const save = async () => {
    setSaveError(null)

    if (effectiveActive === 'perfil') {
      setSaving(true)
      try {
        const parts = profileForm.nombre.trim().split(/\s+/)
        const nombres   = parts[0] || ''
        const apellidos = parts.slice(1).join(' ')
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombres,
            apellidos,
            email_personal:    profileForm.email,
            telefono:          profileForm.telefono,
            ciudad_residencia: profileForm.ciudad,
            cargo_confirmado:  profileForm.cargo,
          }),
        })
        if (res.ok) {
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        } else {
          const b = await res.json().catch(() => ({}))
          setSaveError(b.error ?? `Error ${res.status}`)
        }
      } catch (e: any) {
        setSaveError(e?.message ?? 'Error de red')
      } finally {
        setSaving(false)
      }
      return
    }

    if (effectiveActive === 'empresa') {
      setSaving(true)
      try {
        const res = await fetch('/api/company-info', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyForm),
        })
        if (res.ok) {
          const updated = await res.json()
          setCompanyForm(prev => ({ ...prev, ...updated }))
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        } else {
          const b = await res.json().catch(() => ({}))
          setSaveError(b.error ?? `Error ${res.status}`)
        }
      } catch (e: any) {
        setSaveError(e?.message ?? 'Error de red')
      } finally {
        setSaving(false)
      }
      return
    }

    if (effectiveActive === 'seguridad') {
      setPwdError(null)
      if (!pwdForm.current) { setPwdError('Ingresa tu contraseña actual'); return }
      if (pwdForm.nueva.length < 8) { setPwdError('La nueva contraseña debe tener al menos 8 caracteres'); return }
      if (pwdForm.nueva !== pwdForm.confirm) { setPwdError('Las contraseñas no coinciden'); return }
      setSaving(true)
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.nueva }),
        })
        if (res.ok) {
          setPwdForm({ current: '', nueva: '', confirm: '' })
          setPwdSuccess(true)
          setTimeout(() => setPwdSuccess(false), 3000)
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        } else {
          const b = await res.json().catch(() => ({}))
          setPwdError(b.error ?? `Error ${res.status}`)
        }
      } catch (e: any) {
        setPwdError(e?.message ?? 'Error de red')
      } finally {
        setSaving(false)
      }
      return
    }

    // Sections without persistence (notificaciones, sistema): no fake toast
  }

  return (
    <div className="p-4 sm:p-6 w-full">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-[var(--text)] mb-1">Configuración</h1>
        <p className="text-[var(--text-dim)] text-sm">{isWorker ? 'Ajustes de tu cuenta' : 'Ajustes del sistema SG-SST'}</p>
      </motion.div>

      <div className="grid lg:grid-cols-[250px_minmax(0,1fr)] gap-5 items-start">

        {/* Sidebar nav */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          >
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-2 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setActive(id); setSaveError(null); setPwdError(null); setPuError(null) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${effectiveActive === id ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'text-[var(--text-dim)] hover:bg-[var(--bg-card)] hover:text-[var(--text)]'}`}>
                <Icon size={16} />
                <span>{label}</span>
                {effectiveActive === id && <ChevronRight size={13} className="ml-auto" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-4 min-w-0">

          {/* ── PERFIL ─────────────────────────────────────────────────── */}
          {effectiveActive === 'perfil' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2">
                <User size={16} className="text-amber-400" /> Información Personal
              </h2>
              {!profileLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-[var(--text-faint)]" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {([
                    { key: 'nombre',   label: 'Nombre completo',       placeholder: 'Tu nombre completo',  icon: User   },
                    { key: 'email',    label: 'Correo electrónico',    placeholder: 'tu@correo.com',       icon: Mail   },
                    { key: 'telefono', label: 'Teléfono',              placeholder: '+57 300 000 0000',    icon: Phone  },
                    { key: 'ciudad',   label: 'Ciudad de residencia',  placeholder: 'Bogotá',              icon: MapPin },
                    { key: 'cargo',    label: 'Cargo',                 placeholder: 'Tu cargo en la empresa', icon: FileText },
                  ] as const).map(({ key, label, placeholder, icon: Icon }) => (
                    <div key={key}>
                      <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                        <input
                          value={profileForm[key]}
                          onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-8 pr-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] mt-4" style={{ color: 'var(--text-faint)' }}>
                Para actualizar tu cédula o datos laborales, contacta al administrador de tu empresa.
              </p>
            </div>
          )}

          {/* ── EMPRESA (admin) ─────────────────────────────────────────── */}
          {effectiveActive === 'empresa' && !isWorker && (
            <>
              {!companyLoaded ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[var(--text-faint)]" />
                </div>
              ) : (
                <>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                    <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Building2 size={16} className="text-amber-400" /> Información de la Empresa</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {([
                        { key: 'name',   label: 'Razón Social',       placeholder: 'Nombre legal de la empresa', icon: Building2 },
                        { key: 'nit',    label: 'NIT',                placeholder: '900.000.000-0',              icon: FileText  },
                        { key: 'correo', label: 'Correo corporativo', placeholder: 'correo@empresa.co',          icon: Mail      },
                        { key: 'telefono', label: 'Teléfono',         placeholder: '+57 (1) 000 0000',           icon: Phone     },
                        { key: 'ciudad', label: 'Ciudad',             placeholder: 'Bogotá D.C.',                icon: MapPin    },
                        { key: 'sector', label: 'Sector económico',   placeholder: 'Ej: Manufactura',            icon: Globe     },
                      ] as const).map(({ key, label, placeholder, icon: Icon }) => (
                        <div key={key}>
                          <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                          <div className="relative">
                            <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                            <input
                              value={companyForm[key]}
                              onChange={e => setCompanyForm(p => ({ ...p, [key]: e.target.value }))}
                              placeholder={placeholder}
                              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-8 pr-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                    <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-amber-400" /> Responsable SST</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {([
                        { key: 'responsable_nombre',   label: 'Nombre completo', placeholder: 'Nombre del responsable SST' },
                        { key: 'responsable_cargo',    label: 'Cargo',           placeholder: 'Ej: Coordinadora SST' },
                        { key: 'responsable_email',    label: 'Correo',          placeholder: 'responsable@empresa.co' },
                        { key: 'responsable_licencia', label: 'Licencia SSO N°', placeholder: '00000-COL' },
                      ] as const).map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                          <input
                            value={companyForm[key]}
                            onChange={e => setCompanyForm(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── NOTIFICACIONES ──────────────────────────────────────────── */}
          {effectiveActive === 'notificaciones' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Bell size={16} className="text-amber-400" /> Preferencias de Notificación</h2>
              <div className="space-y-4">
                {[
                  { label: 'Certificados por vencer',   desc: 'Alerta 30 días antes del vencimiento',          on: true  },
                  { label: 'Capacitaciones vencidas',   desc: 'Notificar cuando una capacitación expire',       on: true  },
                  { label: 'Firmas pendientes',          desc: 'Recordatorio diario de documentos sin firmar',  on: true  },
                  { label: 'Reportes automáticos',      desc: 'Enviar reporte mensual por correo',              on: false },
                  { label: 'Alertas IA SST',            desc: 'Notificaciones de la inteligencia artificial',   on: true  },
                  { label: 'Notificaciones por correo', desc: 'Recibir alertas al correo corporativo',          on: false },
                ].map(({ label, desc, on }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-[var(--text)] text-sm font-medium">{label}</div>
                      <div className="text-[var(--text-faint)] text-xs mt-0.5">{desc}</div>
                    </div>
                    <Toggle defaultOn={on} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SEGURIDAD ───────────────────────────────────────────────── */}
          {effectiveActive === 'seguridad' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2">
                <Lock size={16} className="text-amber-400" /> Cambiar Contraseña
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Contraseña actual</label>
                  <input
                    type="password"
                    value={pwdForm.current}
                    onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Nueva contraseña</label>
                  <input
                    type="password"
                    value={pwdForm.nueva}
                    onChange={e => setPwdForm(p => ({ ...p, nueva: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={pwdForm.confirm}
                    onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repetir nueva contraseña"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>

                {pwdError && (
                  <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-2.5">
                    <AlertCircle size={14} /> {pwdError}
                  </div>
                )}
                {pwdSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-2.5">
                    <CheckCircle size={14} /> Contraseña actualizada correctamente
                  </div>
                )}

                {!isWorker && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-[var(--text)] text-sm font-medium">Autenticación de dos factores</div>
                        <div className="text-[var(--text-faint)] text-xs mt-0.5">Seguridad adicional por SMS o app</div>
                      </div>
                      <Toggle defaultOn={false} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TEMA (admin) ────────────────────────────────────────────── */}
          {effectiveActive === 'tema' && (
            <div className="space-y-5">
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Palette size={16} style={{ color: 'var(--primary)' }} /> Identidad Visual
                  </h2>
                  {themeSaved && (
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      <Check size={12} /> Guardado
                    </span>
                  )}
                  {themeSaving && (
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Guardando...</span>
                  )}
                </div>
                <p className="text-sm mb-5" style={{ color: 'var(--text-dim)' }}>
                  El tema seleccionado aplica a toda la plataforma y se guarda por empresa.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {THEMES.map(t => {
                    const isActive = theme === t.id
                    return (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className="relative text-left rounded-2xl p-4 transition-all overflow-hidden"
                        style={{
                          background: t.preview.bg,
                          border: `2px solid ${isActive ? t.preview.primary : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: isActive ? `0 0 0 4px ${t.preview.primary}22` : 'none',
                        }}>
                        {isActive && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: t.preview.primary }}>
                            <Check size={11} color="white" strokeWidth={3} />
                          </div>
                        )}
                        <div className="flex gap-2 mb-3">
                          <div className="w-6 rounded-md flex flex-col gap-1 p-1" style={{ background: t.preview.sidebar }}>
                            <div className="w-full h-1 rounded-sm" style={{ background: t.preview.primary, opacity: 0.9 }} />
                            <div className="w-full h-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.12)' }} />
                            <div className="w-full h-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.12)' }} />
                            <div className="w-full h-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.12)' }} />
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.1)', width: '70%' }} />
                            <div className="flex gap-1">
                              <div className="h-5 flex-1 rounded" style={{ background: t.preview.primary, opacity: 0.8 }} />
                              <div className="h-5 flex-1 rounded" style={{ background: t.preview.accent, opacity: 0.6 }} />
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-sm" style={{ color: t.preview.primary }}>{t.name}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.description}</div>
                        <div className="flex gap-1.5 mt-2.5">
                          {[t.preview.primary, t.preview.accent, t.preview.sidebar, t.preview.bg].map((c, i) => (
                            <div key={i} className="w-3 h-3 rounded-full border border-white/10" style={{ background: c }} />
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── USUARIOS DEL SISTEMA (superadmin only) ─────────────────────── */}
          {effectiveActive === 'usuarios' && isSuperAdmin && (
            <div className="space-y-5">
              {/* Create user form */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2">
                  <UserPlus size={16} className="text-amber-400" /> Crear Usuario de Plataforma
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
                  Los usuarios de plataforma son cuentas de acceso. Son independientes de los trabajadores de la empresa.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {[
                    { key: 'name',     label: 'Nombre completo *', placeholder: 'Ej: Juan Portero' },
                    { key: 'email',    label: 'Usuario * (documento o correo)', placeholder: '1052392965' },
                    { key: 'correo',   label: 'Correo electrónico (contacto)', placeholder: 'correo@empresa.co' },
                    { key: 'password', label: 'Contraseña *', placeholder: 'Mínimo 8 caracteres' },
                    { key: 'cedula',   label: 'Cédula (opcional)', placeholder: 'N° documento' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                      <input
                        type={key === 'password' ? 'password' : 'text'}
                        value={(puForm as any)[key]}
                        onChange={e => setPuForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Rol *</label>
                  <select value={puForm.role} onChange={e => cambiarRol(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                    <option value="portero">Portero — acceso solo a portería/ingreso/salida</option>
                    <option value="admin">Administrador — gestión del personal y SSTudio</option>
                    <option value="superadmin">Superadministrador — control total de la plataforma</option>
                    <option value="worker">Trabajador — experiencia del trabajador</option>
                  </select>
                </div>

                {/* Permisos */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-[var(--text-dim)] text-xs font-semibold">Permisos</label>
                    <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      {puForm.role === 'superadmin'
                        ? 'El superadministrador siempre tiene todos los permisos'
                        : `${puForm.permissions.length} seleccionados · el rol propone una plantilla que puedes ajustar`}
                    </span>
                  </div>
                  <PermisosGrid
                    seleccionados={puForm.role === 'superadmin' ? PERMISOS_POR_ROL.superadmin : puForm.permissions}
                    bloqueado={puForm.role === 'superadmin'}
                    onToggle={id => setPuForm(p => ({ ...p, permissions: alternarPermiso(p.permissions, id) }))}
                  />
                  <p className="text-[11px] mt-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
                    Los permisos se verifican en el servidor: quien no los tenga recibe un rechazo aunque abra la dirección directamente.
                  </p>
                </div>
                {puError && (
                  <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-2.5 mb-3">
                    <AlertCircle size={14} /> {puError}
                  </div>
                )}
                {puSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-2.5 mb-3">
                    <CheckCircle size={14} /> Usuario creado correctamente
                  </div>
                )}
                <button onClick={createPlatformUser} disabled={puSaving}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'var(--primary)', color: '#fff' }}>
                  {puSaving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Crear usuario
                </button>
              </div>

              {/* Users list */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[var(--text)] font-bold flex items-center gap-2">
                    <Users size={16} className="text-amber-400" />
                    Usuarios ({usuariosFiltrados.length}{usuariosFiltrados.length !== platformUsers.length ? ` de ${platformUsers.length}` : ''})
                  </h2>
                  <button onClick={loadPlatformUsers} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                    style={{ color: 'var(--text-dim)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <RefreshCw size={12} /> Actualizar
                  </button>
                </div>
                {claveAsignada && (
                  <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)' }}>
                    <div className="flex items-start gap-2">
                      <KeyRound size={15} style={{ color: '#10B981' }} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#10B981' }}>Contraseña asignada a {claveAsignada.nombre}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                          Usuario: <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>{claveAsignada.usuario}</span>
                          {'  ·  '}Contraseña: <span className="font-mono font-bold text-base" style={{ color: 'var(--text)' }}>{claveAsignada.clave}</span>
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>
                          Cópiala ahora: queda cifrada y el sistema no puede volver a mostrarla.
                        </p>
                      </div>
                      <button onClick={() => navigator.clipboard?.writeText(claveAsignada.clave)}
                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: '#10B981', color: '#fff' }}>Copiar</button>
                      <button onClick={() => setClaveAsignada(null)} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Filtros de la lista */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                    <input value={uBusqueda} onChange={e => setUBusqueda(e.target.value)}
                      placeholder="Buscar por nombre, documento o correo…"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40" />
                  </div>
                  <select value={uRol} onChange={e => setURol(e.target.value)} aria-label="Rol"
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none">
                    <option value="">Todos los roles</option>
                    {[...new Set(platformUsers.map(u => u.role))].sort().map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={uEstado} onChange={e => setUEstado(e.target.value)} aria-label="Estado"
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none">
                    <option value="">Activos e inactivos</option>
                    <option value="true">Solo activos</option>
                    <option value="false">Solo inactivos</option>
                  </select>
                  <select value={uOrden} onChange={e => setUOrden(e.target.value as any)} aria-label="Orden"
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none">
                    <option value="nombre">Nombre (A-Z)</option>
                    <option value="rol">Rol</option>
                    <option value="permisos">Más permisos primero</option>
                  </select>
                  {uHayFiltros && (
                    <button onClick={() => { setUBusqueda(''); setURol(''); setUEstado(''); setUOrden('nombre') }}
                      className="px-3 py-2 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                      Limpiar
                    </button>
                  )}
                </div>

                {puLoading ? (
                  <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
                ) : (
                  <div className="space-y-2">
                    {usuariosFiltrados.map(u => (
                      <div key={u.id} className="rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--primary)' }}>
                            {u.name.split(' ').slice(0,2).map((w: string) => w[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{u.name}</div>
                            <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{u.email}</div>
                          </div>
                          <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-faint)' }}>
                            {permisosEfectivos(u.role, u.permissions).length} permisos
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: u.role === 'superadmin' ? 'rgba(239,68,68,0.12)' : u.role === 'admin' ? 'rgba(245,158,11,0.12)' : u.role === 'portero' ? 'rgba(6,182,212,0.12)' : 'rgba(16,185,129,0.12)',
                              color: u.role === 'superadmin' ? '#EF4444' : u.role === 'admin' ? '#F59E0B' : u.role === 'portero' ? '#06B6D4' : '#10B981',
                            }}>
                            {u.role}
                          </span>
                          {!u.active && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>inactivo</span>
                          )}
                          <button onClick={() => abrirEdicion(u)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg-surface)' }}>
                            {permEditando === u.id ? 'Cerrar' : 'Editar'}
                          </button>
                        </div>

                        {permEditando === u.id && (
                          <div className="px-3 pb-4 pt-3 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
                            {/* Datos de la cuenta */}
                            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                              {([
                                ['name',     'Nombre completo'],
                                ['email',    'Usuario (documento o correo)'],
                                ['correo',   'Correo electrónico (contacto)'],
                                ['cedula',   'Cédula'],
                                ['password', 'Nueva contraseña (opcional)'],
                              ] as const).map(([campo, etiqueta]) => (
                                <div key={campo}>
                                  <label className="text-[var(--text-dim)] text-[11px] font-semibold mb-1 block">{etiqueta}</label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      value={(datosBorrador as any)[campo]}
                                      placeholder={campo === 'password' ? 'Dejar vacío para no cambiarla' : undefined}
                                      onChange={e => setDatosBorrador(p => ({ ...p, [campo]: e.target.value }))}
                                      className={`w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 ${campo === 'password' ? 'font-mono' : ''}`}
                                    />
                                    {campo === 'password' && (
                                      <button type="button" onClick={() => setDatosBorrador(p => ({ ...p, password: generarClave() }))}
                                        className="px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap"
                                        style={{ border: '1px solid var(--border)', color: 'var(--primary)', background: 'var(--bg-card)' }}>
                                        Generar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div>
                                <label className="text-[var(--text-dim)] text-[11px] font-semibold mb-1 block">Rol</label>
                                <select value={datosBorrador.role}
                                  onChange={e => { const r = e.target.value; setDatosBorrador(p => ({ ...p, role: r })); setPermBorrador(PERMISOS_POR_ROL[r] ?? []) }}
                                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40">
                                  <option value="portero">Portero</option>
                                  <option value="admin">Administrador</option>
                                  <option value="superadmin">Superadministrador</option>
                                  <option value="worker">Trabajador</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[var(--text-dim)] text-[11px] font-semibold mb-1 block">Estado</label>
                                <select value={datosBorrador.active ? 'si' : 'no'}
                                  onChange={e => setDatosBorrador(p => ({ ...p, active: e.target.value === 'si' }))}
                                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40">
                                  <option value="si">Activo</option>
                                  <option value="no">Inactivo — no puede iniciar sesión</option>
                                </select>
                              </div>
                            </div>

                            {/* Permisos */}
                            {datosBorrador.role === 'superadmin' ? (
                              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', color: 'var(--text-faint)' }}>
                                El superadministrador tiene todos los permisos y no se le pueden restringir.
                              </p>
                            ) : (
                              <div>
                                <div className="flex items-baseline justify-between mb-2">
                                  <span className="text-[var(--text-dim)] text-[11px] font-semibold">Permisos</span>
                                  <button onClick={() => setPermBorrador(PERMISOS_POR_ROL[datosBorrador.role] ?? [])}
                                    className="text-[11px]" style={{ color: 'var(--primary)' }}>
                                    Restaurar plantilla del rol
                                  </button>
                                </div>
                                <PermisosGrid
                                  seleccionados={permBorrador}
                                  onToggle={id => setPermBorrador(prev => alternarPermiso(prev, id))}
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <button onClick={() => guardarUsuario(u.id)} disabled={permGuardando}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                                style={{ background: 'var(--primary)', color: '#fff' }}>
                                {permGuardando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Guardar cambios
                              </button>
                              <button onClick={() => setPermEditando(null)}
                                className="text-xs px-3 py-1.5 rounded-lg"
                                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {usuariosFiltrados.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--text-faint)' }}>No hay usuarios registrados</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SEDES Y PORTERÍAS (superadmin only) ──────────────────────── */}
          {effectiveActive === 'sedes' && isSuperAdmin && (
            <SedesPorterias />
          )}

          {/* ── SISTEMA (admin only) ─────────────────────────────────────── */}
          {effectiveActive === 'sistema' && !isWorker && (
            <>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Globe size={16} className="text-amber-400" /> Preferencias del Sistema</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Idioma</label>
                    <select className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                      <option className="bg-[var(--bg-surface)]">Español (Colombia)</option>
                      <option className="bg-[var(--bg-surface)]">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Zona horaria</label>
                    <select className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                      <option className="bg-[var(--bg-surface)]">America/Bogota (UTC-5)</option>
                    </select>
                  </div>
                  {[
                    { label: 'Modo oscuro',              desc: 'Interfaz oscura (activo por defecto)',                  on: true  },
                    { label: 'Actualización automática', desc: 'Actualizar datos del dashboard en tiempo real',         on: true  },
                  ].map(({ label, desc, on }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-t border-white/5">
                      <div>
                        <div className="text-[var(--text)] text-sm font-medium">{label}</div>
                        <div className="text-[var(--text-faint)] text-xs mt-0.5">{desc}</div>
                      </div>
                      <Toggle defaultOn={on} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-[var(--text)] font-bold mb-3 flex items-center gap-2"><Database size={16} className="text-amber-400" /> Datos y Respaldo</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Exportar todos los datos',  color: 'text-amber-400 border-blue-400/20 hover:bg-blue-400/10'    },
                    { label: 'Crear copia de seguridad',  color: 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10' },
                  ].map(({ label, color }) => (
                    <button key={label} className={`w-full py-2.5 rounded-xl border text-sm font-semibold transition-all ${color}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Error banner */}
          {saveError && (
            <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} /> {saveError}
            </div>
          )}

          {/* Save button — hidden for tema (auto-saves) and for admin-only sections */}
          {effectiveActive !== 'tema' && effectiveActive !== 'usuarios' && effectiveActive !== 'sedes' && (
            <motion.div animate={saved ? { scale: [1, 0.97, 1] } : {}}>
              <button
                onClick={save}
                disabled={saving}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                  saved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)]'
                }`}>
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  : saved
                    ? <><CheckCircle size={16} /> Guardado exitosamente</>
                    : <><Save size={16} /> Guardar cambios</>}
              </button>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  )
}
