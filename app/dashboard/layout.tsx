'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, BookOpen, PenTool, Award,
  BarChart2, Brain, Bell, Settings, LogOut, Shield,
  ChevronLeft, ChevronRight, FileCheck, Search, Menu, X
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/users', icon: Users, label: 'Usuarios' },
  { href: '/dashboard/trainings', icon: BookOpen, label: 'Capacitaciones' },
  { href: '/dashboard/signatures', icon: PenTool, label: 'Firmas' },
  { href: '/dashboard/certificates', icon: Award, label: 'Certificados' },
  { href: '/dashboard/evaluations', icon: FileCheck, label: 'Evaluaciones' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Reportes' },
  { href: '/dashboard/audit', icon: Search, label: 'Auditoria' },
  { href: '/dashboard/ai', icon: Brain, label: 'IA SST' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notificaciones' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuracion' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad-main)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
            <Shield size={16} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm truncate" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Jimmy Academy</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>SG-SST</div>
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="md:hidden" style={{ color: 'var(--text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {navItems.map(({ href, icon: Icon, label }) => {
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
          style={{ background: 'rgba(17,9,0,0.8)', borderBottom: '1px solid var(--border)' }}>
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
            <button className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Bell size={17} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }} />
            </button>

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
