'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, BookOpen, PenTool, Award,
  BarChart2, Brain, Bell, Settings, LogOut, Shield,
  ChevronLeft, ChevronRight, Search, Menu, X,
  Palette, Building2, Layers, UserCheck, Briefcase,
  CalendarDays, GraduationCap, TrendingUp,
  ClipboardList, Home, Activity, FileCheck2, FileText
} from 'lucide-react'
import { CommandPalette } from '@/components/CommandPalette'
import { useTheme, THEMES, type ThemeId } from '@/components/ThemeProvider'

// ── Admin navigation (grouped) ────────────────────────────────────
const ADMIN_NAV = [
  {
    items: [
      { href: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/select-company',    icon: Building2,        label: 'Cambiar Empresa', superadminOnly: true },
    ]
  },
  {
    section: 'ORGANIZACIÓN',
    items: [
      { href: '/dashboard/users',            icon: Users,     label: 'Usuarios' },
      { href: '/dashboard/areas',            icon: Layers,    label: 'Áreas' },
      { href: '/dashboard/groups',           icon: UserCheck, label: 'Grupos' },
      { href: '/dashboard/worker-profiles',  icon: Activity,  label: 'Inf. Sociodemográfica' },
    ]
  },
  {
    section: 'FORMACIÓN',
    items: [
      { href: '/dashboard/trainings',          icon: BookOpen,      label: 'Biblioteca' },
      { href: '/dashboard/plan',               icon: CalendarDays,  label: 'Plan Anual' },
      { href: '/dashboard/profiles',           icon: GraduationCap, label: 'Perfiles de Formación' },
      { href: '/dashboard/enrollments',        icon: TrendingUp,    label: 'Trazabilidad' },
      { href: '/dashboard/attendance-lists',   icon: FileCheck2,    label: 'Listas de Asistencia' },
    ]
  },
  {
    section: 'GESTIÓN',
    items: [
      { href: '/dashboard/certificates',   icon: Award,         label: 'Certificados' },
      { href: '/dashboard/legal-docs',     icon: FileText,      label: 'Documentos Legales' },
      { href: '/dashboard/reports',        icon: BarChart2,     label: 'Reportes' },
    ]
  },
  {
    section: 'SISTEMA',
    items: [
      { href: '/dashboard/audit',          icon: ClipboardList, label: 'Auditoría' },
      { href: '/dashboard/ai',             icon: Brain,         label: 'IA SST' },
      { href: '/dashboard/my-signature',   icon: PenTool,       label: 'Mi Firma' },
      { href: '/dashboard/settings',       icon: Settings,      label: 'Configuración' },
    ]
  },
]

// ── Worker navigation ─────────────────────────────────────────────
const WORKER_NAV = [
  { href: '/dashboard/my-plan',      icon: Home,         label: 'Inicio' },
  { href: '/dashboard/certificates', icon: Award,        label: 'Mis Certificados' },
  { href: '/dashboard/legal-docs',   icon: FileText,     label: 'Documentos Legales' },
  { href: '/dashboard/my-profile',   icon: Briefcase,    label: 'Mi Perfil' },
  { href: '/dashboard/my-signature', icon: PenTool,      label: 'Mi Firma' },
  { href: '/dashboard/settings',     icon: Settings,     label: 'Configuración' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'worker'
  const isAdmin = userRole === 'admin' || userRole === 'superadmin'
  const isSuperAdmin = userRole === 'superadmin'

  const [activeCompany, setActiveCompany] = useState<{ name: string; logo_url?: string; color?: string } | null>(null)
  const [workerDisplayName, setWorkerDisplayName] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, right: 0 })
  const [mounted, setMounted] = useState(false)
  const themeButtonRef = useRef<HTMLButtonElement>(null)
  const { theme, setTheme } = useTheme()

  const openThemePicker = () => {
    if (themeButtonRef.current) {
      const r = themeButtonRef.current.getBoundingClientRect()
      setPickerPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setThemePickerOpen(o => !o)
  }

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const match = document.cookie.match(/x-active-company=([^;]+)/)
    if (match) {
      fetch('/api/companies')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const active = data.find((c: any) => c.id === match[1])
            if (active) {
              setActiveCompany({ name: active.name, logo_url: active.logo_url, color: active.color })
              // Apply company theme if not already overridden by localStorage
              const stored = localStorage.getItem('sst-theme')
              const validThemes = ['dark', 'light', 'navy', 'verde', 'academy']
              if (active.color && validThemes.includes(active.color) && !stored) {
                setTheme(active.color as ThemeId, false)
              }
            }
          }
        })
    }
  }, [])

  // Load worker's first name from their profile so the greeting shows the real name,
  // not whatever was stored in the users.name column at registration.
  useEffect(() => {
    if (isAdmin) return
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : {})
      .then((d: any) => {
        const first = d?.nombres?.trim()
        if (first) setWorkerDisplayName(first)
      })
      .catch(() => {})
  }, [isAdmin])

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const userInitials = session?.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) ?? 'JA'

  return (
    <>
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`
        flex flex-col z-50 flex-shrink-0
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-16' : isAdmin ? 'w-60' : 'w-56'}
      `} style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center h-16 px-4 gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          {activeCompany?.logo_url ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: 'white' }}>
              <img src={activeCompany.logo_url} alt={activeCompany.name} className="w-7 h-7 object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--grad-main)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
              <Shield size={16} className="text-white" strokeWidth={2.5} />
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm truncate"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {activeCompany?.name || 'Jimmy Academy'}
              </div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--amber)' }}>
                {isAdmin ? 'Administrador SST' : 'Portal Trabajador'}
              </div>
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="md:hidden" style={{ color: 'var(--text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {isAdmin ? (
            // ── Admin navigation with section headers ──
            ADMIN_NAV.map((group, gi) => (
              <div key={gi} className={gi > 0 ? 'mt-2' : ''}>
                {group.section && !collapsed && (
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[9px] font-bold tracking-widest uppercase"
                      style={{ color: 'var(--text-faint)' }}>
                      {group.section}
                    </span>
                  </div>
                )}
                {group.items.map(({ href, icon: Icon, label, superadminOnly }: any) => {
                  if (superadminOnly && !isSuperAdmin) return null
                  const active = isActive(href)
                  return (
                    <Link key={href} href={href}
                      className={`nav-item mb-0.5 ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? label : undefined}>
                      <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {active && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--amber)' }} />
                      )}
                    </Link>
                  )
                })}
              </div>
            ))
          ) : (
            // ── Worker navigation — clean and simple ──
            <div className="pt-1">
              {WORKER_NAV.map(({ href, icon: Icon, label }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href}
                    className={`nav-item mb-1 ${active ? 'active' : ''}`}>
                    <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                    <span className="truncate">{label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: 'var(--amber)' }} />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* User + actions */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg"
              style={{ background: 'var(--bg-card)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--grad-main)' }}>
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {session?.user?.name ?? 'Usuario'}
                </div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                  {session?.user?.email ?? ''}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${collapsed ? 'w-full justify-center' : 'flex-1'}`}
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}>
              <LogOut size={15} strokeWidth={2} />
              {!collapsed && 'Cerrar sesión'}
            </button>
            {isAdmin && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-all flex-shrink-0"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-5 backdrop-blur-xl flex-shrink-0"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>

          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Menu size={18} />
            </button>

            {isAdmin ? (
              <button
                onClick={() => setSearchOpen(true)}
                className="relative hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl transition-all w-64"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                <Search size={14} />
                <span className="text-sm flex-1 text-left">Buscar cursos...</span>
                <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  ⌘K
                </kbd>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Bienvenido, {workerDisplayName ?? session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'trabajador'}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme picker */}
            <div className="relative">
              <button
                ref={themeButtonRef}
                onClick={openThemePicker}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: themePickerOpen ? 'var(--primary-dim)' : 'var(--bg-card)',
                  border: `1px solid ${themePickerOpen ? 'var(--primary-border)' : 'var(--border)'}`,
                  color: themePickerOpen ? 'var(--primary)' : 'var(--text-dim)',
                }}
                title="Cambiar tema">
                <Palette size={17} strokeWidth={2} />
              </button>
            </div>


            {isAdmin && (
              <Link href="/dashboard/notifications"
                className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <Bell size={17} strokeWidth={2} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }} />
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
              <span className="text-xs font-semibold" style={{ color: '#6EE7B7' }}>
                {isAdmin ? 'Sistema activo' : 'En línea'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>

    {/* Theme picker — rendered into document.body via Portal so it escapes the
        header's backdrop-filter stacking context (which otherwise hijacks
        position:fixed children and positions them relative to the header). */}
    {mounted && themePickerOpen && createPortal(
      <>
        <div
          className="fixed inset-0"
          style={{ zIndex: 9998 }}
          onClick={() => setThemePickerOpen(false)}
        />
        <div
          className="fixed"
          style={{
            top: pickerPos.top,
            right: pickerPos.right,
            zIndex: 9999,
            width: 232,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            padding: 10,
          }}>

          <p className="text-[10px] font-bold uppercase tracking-widest px-2 py-1.5"
            style={{ color: 'var(--text-faint)' }}>
            Tema visual
          </p>

          {THEMES.map(t => {
            const active = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setThemePickerOpen(false) }}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left"
                style={{
                  background: active ? 'var(--primary-dim)' : 'transparent',
                  border: `1px solid ${active ? 'var(--primary-border)' : 'transparent'}`,
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = active ? 'var(--primary-dim)' : 'transparent'
                }}>

                <div className="flex-shrink-0 flex items-center gap-1">
                  <div className="w-2 h-8 rounded" style={{ background: t.preview.sidebar }} />
                  <div className="flex flex-col gap-1">
                    <div className="w-3.5 h-3.5 rounded-sm" style={{ background: t.preview.primary }} />
                    <div className="w-3.5 h-3.5 rounded-sm" style={{ background: t.preview.accent }} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: active ? 'var(--primary)' : 'var(--text)' }}>
                    {t.name}
                  </div>
                  <div className="text-[9px] leading-tight mt-0.5 opacity-60" style={{ color: 'var(--text)' }}>
                    {t.description}
                  </div>
                </div>

                {active && (
                  <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--primary)' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </>,
      document.body
    )}
    </>
  )
}
