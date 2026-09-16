'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, BookOpen, PenTool, Award,
  BarChart2, Brain, Settings, LogOut,
  ChevronLeft, ChevronRight, ChevronDown, Search, Menu, X,
  Layers, UserCheck, Briefcase,
  CalendarDays, GraduationCap, TrendingUp,
  ClipboardList, Home, Activity, FileCheck2,
  HardHat, FileText, ArrowLeftRight, AlertTriangle, MessageSquare,
  Bell, Shield, Leaf
} from 'lucide-react'
import { CommandPalette } from '@/components/CommandPalette'
import { useTheme, THEMES, type ThemeId } from '@/components/ThemeProvider'

// ── Nav type definitions ─────────────────────────────────────────
type NavLeaf = {
  href: string
  icon: React.ElementType
  label: string
  disabled?: false
  superadminOnly?: boolean
} | {
  href: null
  icon: React.ElementType
  label: string
  disabled: true
}

type NavEntry =
  | { kind: 'link';    href: string; icon: React.ElementType; label: string }
  | { kind: 'section'; label: string; items: NavLeaf[] }
  | { kind: 'module';  id: string; icon: React.ElementType; label: string; items: NavLeaf[] }

// ── Admin navigation ─────────────────────────────────────────────
const ADMIN_NAV: NavEntry[] = [
  {
    kind: 'link',
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    kind: 'section',
    label: 'PERSONAL',
    items: [
      { href: '/dashboard/users',           icon: Users,     label: 'Personas' },
      { href: '/dashboard/areas',           icon: Layers,    label: 'Áreas' },
      { href: '/dashboard/groups',          icon: UserCheck, label: 'Grupos' },
      { href: '/dashboard/worker-profiles', icon: Activity,  label: 'Inf. Sociodemográfica' },
    ],
  },
  {
    kind: 'module',
    id: 'sstudio',
    icon: Leaf,
    label: 'SSTudio',
    items: [
      { href: '/dashboard/trainings',        icon: BookOpen,      label: 'Biblioteca' },
      { href: '/dashboard/plan',             icon: CalendarDays,  label: 'Plan Anual' },
      { href: '/dashboard/profiles',         icon: GraduationCap, label: 'Perfiles de Formación' },
      { href: '/dashboard/enrollments',      icon: TrendingUp,    label: 'Trazabilidad' },
      { href: '/dashboard/attendance-lists', icon: FileCheck2,    label: 'Listas de Asistencia' },
      { href: '/dashboard/certificates',     icon: Award,         label: 'Certificados' },
    ],
  },
  {
    kind: 'module',
    id: 'gestion-sst',
    icon: Shield,
    label: 'Gestión SST',
    items: [
      { href: null, icon: HardHat,      label: 'EPP',            disabled: true },
      { href: null, icon: FileText,     label: 'Documentos',     disabled: true },
      { href: null, icon: AlertTriangle,label: 'Emergencias',    disabled: true },
      { href: null, icon: MessageSquare,label: 'Comunicaciones', disabled: true },
    ],
  },
  {
    kind: 'module',
    id: 'control-operativo',
    icon: ArrowLeftRight,
    label: 'Control Operativo',
    items: [
      { href: null, icon: ArrowLeftRight, label: 'Ingreso / Salida', disabled: true },
    ],
  },
  {
    kind: 'section',
    label: 'REPORTES',
    items: [
      { href: '/dashboard/reports', icon: BarChart2, label: 'Reportes' },
    ],
  },
  {
    kind: 'section',
    label: 'SISTEMA',
    items: [
      { href: '/dashboard/audit',        icon: ClipboardList, label: 'Auditoría' },
      { href: '/dashboard/ai',           icon: Brain,         label: 'IA SST' },
      { href: '/dashboard/my-signature', icon: PenTool,       label: 'Mi Firma' },
      { href: '/dashboard/settings',     icon: Settings,      label: 'Configuración' },
    ],
  },
]

// ── Worker navigation ─────────────────────────────────────────────
const WORKER_NAV = [
  { href: '/dashboard/my-plan',      icon: Home,      label: 'Inicio' },
  { href: '/dashboard/certificates', icon: Award,     label: 'Mis Certificados' },
  { href: '/dashboard/my-profile',   icon: Briefcase, label: 'Mi Perfil' },
  { href: '/dashboard/my-signature', icon: PenTool,   label: 'Mi Firma' },
  { href: '/dashboard/settings',     icon: Settings,  label: 'Configuración' },
]

// Hrefs that belong to each module, used to auto-expand on load
const MODULE_HREFS: Record<string, string[]> = {
  'sstudio': [
    '/dashboard/trainings', '/dashboard/plan', '/dashboard/profiles',
    '/dashboard/enrollments', '/dashboard/attendance-lists', '/dashboard/certificates',
  ],
  'gestion-sst': [],
  'control-operativo': [],
}

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
  const { theme, setTheme } = useTheme()

  // Which modules are expanded — auto-open the one matching the current route
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const [id, hrefs] of Object.entries(MODULE_HREFS)) {
      init[id] = hrefs.some(h => pathname.startsWith(h))
    }
    return init
  })

  const toggleModule = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Ctrl+K / Cmd+K
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
              const stored = localStorage.getItem('sst-theme')
              const validThemes: ThemeId[] = ['light', 'verde']
              if (active.color && validThemes.includes(active.color as ThemeId) && !stored) {
                setTheme(active.color as ThemeId, false)
              }
            }
          }
        })
    }
  }, [])

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

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Auto-expand module when navigating into one of its routes
  useEffect(() => {
    for (const [id, hrefs] of Object.entries(MODULE_HREFS)) {
      if (hrefs.some(h => pathname.startsWith(h))) {
        setExpanded(prev => prev[id] ? prev : { ...prev, [id]: true })
      }
    }
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const moduleHasActive = (id: string) =>
    MODULE_HREFS[id]?.some(h => pathname.startsWith(h)) ?? false

  const userInitials = session?.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) ?? 'JA'
  const otherTheme = theme === 'light' ? 'verde' : 'light'
  const otherThemeMeta = THEMES.find(t => t.id === otherTheme)!

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`
        sidebar-shell flex flex-col z-50 flex-shrink-0
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-16' : isAdmin ? 'w-60' : 'w-56'}
      `} style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>

        {/* Logo */}
        <div className="flex items-center h-16 px-3 gap-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex-shrink-0 flex items-center justify-center"
            style={{ width: collapsed ? 36 : 40, height: collapsed ? 36 : 40 }}>
            {activeCompany?.logo_url ? (
              <img src={activeCompany.logo_url} alt={activeCompany.name}
                className="w-full h-full object-contain rounded-lg" style={{ background: 'white', padding: 2 }} />
            ) : (
              <img src="/images/LOGO.png" alt="AgroSafe" className="w-full h-full object-contain" />
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm truncate"
                style={{ color: 'var(--sidebar-text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                {activeCompany?.name || 'AgroSafe'}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--sidebar-active-text)' }}>
                {isAdmin ? 'Gestión del Personal' : 'Portal Trabajador'}
              </div>
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="md:hidden"
            style={{ color: 'var(--sidebar-dim)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {isAdmin ? (
            <div className="space-y-0.5">
              {ADMIN_NAV.map((entry, ei) => {
                // ── Standalone link (Dashboard) ──────────────────
                if (entry.kind === 'link') {
                  const active = isActive(entry.href)
                  const Icon = entry.icon
                  return (
                    <Link key={entry.href} href={entry.href}
                      className={`nav-item mb-0.5 ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? entry.label : undefined}>
                      <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                      {!collapsed && <span className="truncate">{entry.label}</span>}
                      {active && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--sidebar-active-text)' }} />
                      )}
                    </Link>
                  )
                }

                // ── Section header + flat items ──────────────────
                if (entry.kind === 'section') {
                  return (
                    <div key={entry.label} className="mt-3">
                      {!collapsed && (
                        <div className="px-2 pt-1 pb-1.5">
                          <span className="text-[9px] font-bold tracking-widest uppercase"
                            style={{ color: 'var(--sidebar-faint)' }}>
                            {entry.label}
                          </span>
                        </div>
                      )}
                      {entry.items.map((item) => {
                        if ('superadminOnly' in item && item.superadminOnly && !isSuperAdmin) return null
                        const Icon = item.icon
                        if (item.disabled) {
                          return (
                            <div key={item.label}
                              className={`nav-item mb-0.5 opacity-35 cursor-not-allowed ${collapsed ? 'justify-center' : ''}`}
                              title={collapsed ? item.label : undefined}>
                              <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                              {!collapsed && (
                                <>
                                  <span className="truncate">{item.label}</span>
                                  <span className="ml-auto text-[8px] font-bold uppercase tracking-wider flex-shrink-0"
                                    style={{ color: 'var(--sidebar-faint)' }}>Próx.</span>
                                </>
                              )}
                            </div>
                          )
                        }
                        const active = isActive(item.href)
                        return (
                          <Link key={item.href} href={item.href}
                            className={`nav-item mb-0.5 ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? item.label : undefined}>
                            <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {active && !collapsed && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: 'var(--sidebar-active-text)' }} />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )
                }

                // ── Expandable module ────────────────────────────
                if (entry.kind === 'module') {
                  const Icon = entry.icon
                  const isOpen = expanded[entry.id] ?? false
                  const hasActive = moduleHasActive(entry.id)
                  const allDisabled = entry.items.every(i => i.disabled)

                  return (
                    <div key={entry.id} className="mt-3">
                      {/* Module trigger button */}
                      <button
                        onClick={() => !collapsed && toggleModule(entry.id)}
                        className={`nav-item w-full mb-0.5 ${hasActive && !isOpen ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? entry.label : undefined}
                        style={hasActive && !isOpen ? {} : {}}>
                        <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="truncate font-semibold">{entry.label}</span>
                            {allDisabled && (
                              <span className="ml-1 text-[8px] font-bold uppercase tracking-wider flex-shrink-0"
                                style={{ color: 'var(--sidebar-faint)' }}>Próx.</span>
                            )}
                            <ChevronDown
                              size={13}
                              strokeWidth={2.5}
                              className="ml-auto flex-shrink-0 transition-transform duration-200"
                              style={{
                                transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                color: 'var(--sidebar-dim)',
                              }}
                            />
                          </>
                        )}
                      </button>

                      {/* Children — shown when expanded and sidebar not collapsed */}
                      {isOpen && !collapsed && (
                        <div className="ml-3 mt-0.5 mb-1 space-y-0.5"
                          style={{ borderLeft: '1px solid var(--sidebar-border)', paddingLeft: 8 }}>
                          {entry.items.map((item) => {
                            const ChildIcon = item.icon
                            if (item.disabled) {
                              return (
                                <div key={item.label}
                                  className="nav-item mb-0 opacity-35 cursor-not-allowed"
                                  style={{ fontSize: 12, paddingTop: 5, paddingBottom: 5 }}>
                                  <ChildIcon size={14} strokeWidth={2} className="flex-shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                  <span className="ml-auto text-[8px] font-bold uppercase tracking-wider flex-shrink-0"
                                    style={{ color: 'var(--sidebar-faint)' }}>Próx.</span>
                                </div>
                              )
                            }
                            const active = isActive(item.href)
                            return (
                              <Link key={item.href} href={item.href}
                                className={`nav-item mb-0 ${active ? 'active' : ''}`}
                                style={{ fontSize: 12, paddingTop: 5, paddingBottom: 5 }}>
                                <ChildIcon size={14} strokeWidth={2} className="flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                                {active && (
                                  <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--sidebar-active-text)' }} />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return null
              })}
            </div>
          ) : (
            // ── Worker nav ───────────────────────────────────────
            <div className="pt-1 space-y-0.5">
              {WORKER_NAV.map(({ href, icon: Icon, label }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href}
                    className={`nav-item ${active ? 'active' : ''}`}>
                    <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                    <span className="truncate">{label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: 'var(--sidebar-active-text)' }} />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* Theme toggle */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setTheme(otherTheme)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--sidebar-border)',
                color: 'var(--sidebar-dim)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              title={`Cambiar a ${otherThemeMeta.name}`}>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-2 h-5 rounded-sm" style={{ background: otherThemeMeta.preview.sidebar }} />
                <div className="w-2 h-5 rounded-sm" style={{ background: otherThemeMeta.preview.bg }} />
              </div>
              <span className="flex-1 text-left font-medium truncate">{otherThemeMeta.name}</span>
              <span className="text-[9px] uppercase tracking-wider flex-shrink-0"
                style={{ color: 'var(--sidebar-faint)' }}>Cambiar</span>
            </button>
          </div>
        )}

        {/* User + actions */}
        <div className="p-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--grad-main)' }}>
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate" style={{ color: 'var(--sidebar-text)' }}>
                  {session?.user?.name ?? 'Usuario'}
                </div>
                <div className="text-[10px] truncate" style={{ color: 'var(--sidebar-dim)' }}>
                  {session?.user?.email ?? ''}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${collapsed ? 'w-full justify-center' : 'flex-1'}`}
              style={{ color: 'var(--sidebar-dim)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'rgba(239,68,68,0.10)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--sidebar-dim)'; e.currentTarget.style.background = 'transparent' }}>
              <LogOut size={15} strokeWidth={2} />
              {!collapsed && 'Cerrar sesión'}
            </button>
            {isAdmin && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-all flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--sidebar-border)', color: 'var(--sidebar-dim)' }}>
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

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
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Bienvenido, {workerDisplayName ?? session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'trabajador'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/dashboard/notifications"
                className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <Bell size={17} strokeWidth={2} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--red)' }} />
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(26,92,26,0.08)', border: '1px solid rgba(26,92,26,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2D8A2D' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                {isAdmin ? 'Sistema activo' : 'En línea'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
