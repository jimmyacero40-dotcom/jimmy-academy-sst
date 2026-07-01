'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, BookOpen, PenTool, Award,
  BarChart2, Brain, Bell, Settings, LogOut, Shield,
  ChevronLeft, ChevronRight, FileCheck, Search, Menu, X,
  Sun, Moon, Building2, Layers, UserCheck, Briefcase, CalendarDays, GraduationCap, TrendingUp
} from 'lucide-react'

// roles: which roles can see this item (empty = all)
const allNavItems = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard',        roles: ['superadmin', 'admin'] },
  { href: '/select-company',       icon: Building2,       label: 'Cambiar Empresa',  roles: ['superadmin'] },
  { href: '/dashboard/users',      icon: Users,           label: 'Usuarios',         roles: ['superadmin', 'admin'] },
  { href: '/dashboard/areas',      icon: Layers,          label: 'Áreas',            roles: ['superadmin', 'admin'] },
  { href: '/dashboard/groups',     icon: UserCheck,       label: 'Grupos',           roles: ['superadmin', 'admin'] },
  { href: '/dashboard/profiles',   icon: Briefcase,       label: 'Perfiles',         roles: ['superadmin', 'admin'] },
  { href: '/dashboard/plan',        icon: CalendarDays,    label: 'Plan Anual',       roles: ['superadmin', 'admin'] },
  { href: '/dashboard/enrollments', icon: TrendingUp,     label: 'Trazabilidad',     roles: ['superadmin', 'admin'] },
  { href: '/dashboard/trainings',   icon: BookOpen,       label: 'Capacitaciones',   roles: ['superadmin', 'admin'] },
  { href: '/dashboard/my-plan',     icon: GraduationCap,  label: 'Mi Formación',     roles: ['worker'] },
  { href: '/dashboard/my-signature', icon: PenTool,       label: 'Mi Firma',         roles: [] },
  { href: '/dashboard/signatures', icon: PenTool,         label: 'Firmas Docs',      roles: ['superadmin', 'admin'] },
  { href: '/dashboard/certificates', icon: Award,         label: 'Certificados',     roles: [] },
  { href: '/dashboard/evaluations', icon: FileCheck,      label: 'Evaluaciones',     roles: ['superadmin', 'admin'] },
  { href: '/dashboard/reports',    icon: BarChart2,       label: 'Reportes',         roles: ['superadmin', 'admin'] },
  { href: '/dashboard/audit',      icon: Search,          label: 'Auditoria',        roles: ['superadmin', 'admin'] },
  { href: '/dashboard/ai',         icon: Brain,           label: 'IA SST',           roles: ['superadmin', 'admin'] },
  { href: '/dashboard/notifications', icon: Bell,         label: 'Notificaciones',   roles: ['superadmin', 'admin'] },
  { href: '/dashboard/settings',   icon: Settings,        label: 'Configuracion',    roles: ['superadmin', 'admin'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'worker'
  const isAdmin = userRole === 'admin' || userRole === 'superadmin'
  const isSuperAdmin = userRole === 'superadmin'
  const [activeCompany, setActiveCompany] = useState<{ name: string; logo_url?: string; color?: string } | null>(null)

  useEffect(() => {
    const match = document.cookie.match(/x-active-company=([^;]+)/)
    if (match) {
      fetch('/api/companies')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const active = data.find((c: any) => c.id === match[1])
            if (active) setActiveCompany({ name: active.name, logo_url: active.logo_url, color: active.color })
          }
        })
    }
  }, [])
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('sst-theme') as 'dark' | 'light' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('sst-theme', next)
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        flex flex-col z-50 flex-shrink-0
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-16' : 'w-60'}
      `} style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center h-16 px-4 gap-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {activeCompany?.logo_url ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'white' }}>
              <img src={activeCompany.logo_url} alt={activeCompany.name} className="w-7 h-7 object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad-main)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
              <Shield size={16} className="text-white" strokeWidth={2.5} />
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm truncate" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {activeCompany?.name || 'Jimmy Academy'}
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>SG-SST</div>
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="md:hidden" style={{ color: 'var(--text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {allNavItems.filter(item => {
            if (!item.roles || item.roles.length === 0) return true
            return item.roles.includes(userRole)
          }).map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`nav-item mb-0.5 ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? label : undefined}
              >
                <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--amber)' }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + collapse */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'var(--grad-main)' }}>
                {session?.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) ?? 'JA'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{session?.user?.name ?? 'Usuario'}</div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>{session?.user?.email ?? ''}</div>
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
              {!collapsed && 'Cerrar sesion'}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-all flex-shrink-0"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-5 backdrop-blur-xl flex-shrink-0"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
            >
              <Menu size={18} />
            </button>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input
                type="text"
                placeholder="Buscar empleados, cursos..."
                className="terra-input pl-8 py-2 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              {theme === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
            </button>

            <Link href="/dashboard/notifications" className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Bell size={17} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }} />
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
              <span className="text-xs font-semibold" style={{ color: '#6EE7B7' }}>Sistema activo</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
