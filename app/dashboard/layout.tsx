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
  { href: '/dashboard/audit', icon: Search, label: 'Auditoría' },
  { href: '/dashboard/ai', icon: Brain, label: 'IA SST' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notificaciones' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
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
    <div className="dark flex h-screen bg-[#0A0F1E] overflow-hidden">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        flex flex-col bg-[#0D1629] border-r border-white/8 z-50 flex-shrink-0
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-16' : 'w-60'}
      `}>

        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/8 gap-3 flex-shrink-0`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-white text-sm truncate">Jimmy Academy</div>
              <div className="text-emerald-400 text-xs font-semibold">SST Platform</div>
            </div>
          )}
          {/* Close on mobile */}
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg mb-0.5 font-medium text-[0.83rem] transition-all no-underline group
                  ${active
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? label : undefined}
              >
                <Icon size={17} strokeWidth={2} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-white/8 p-3">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {session?.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) ?? 'JA'}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-semibold truncate">{session?.user?.name ?? 'Usuario'}</div>
                <div className="text-slate-500 text-[10px] truncate">{session?.user?.email ?? ''}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/8 transition-all text-xs ${collapsed ? 'w-full justify-center' : 'flex-1'}`}>
              <LogOut size={15} strokeWidth={2} />
              {!collapsed && 'Cerrar sesión'}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex w-8 h-8 rounded-lg bg-white/5 border border-white/8 items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-5 bg-[#0D1629]/80 backdrop-blur-xl border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <Menu size={18} />
            </button>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar empleados, cursos..."
                className="bg-white/5 border border-white/8 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Bell size={17} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
            </button>

            {/* Status */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">Sistema activo</span>
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
