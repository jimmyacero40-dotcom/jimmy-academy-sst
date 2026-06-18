'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Building2, Plus, ArrowRight, Users, BookOpen, Loader2, X, Shield, LogOut, Upload, Image } from 'lucide-react'

interface Company {
  id: string
  name: string
  nit: string | null
  logo_url: string | null
  color: string | null
  active: boolean
  created_at: string
}

export default function SelectCompanyPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNit, setNewNit] = useState('')
  const [newLogo, setNewLogo] = useState('')
  const [newColor, setNewColor] = useState('from-amber-500 to-orange-500')
  const [creating, setCreating] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (role && role !== 'superadmin') {
      router.replace('/dashboard')
      return
    }
    document.cookie = 'x-active-company=; path=/; max-age=0'
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCompanies(data) })
      .finally(() => setLoading(false))
  }, [role, router])

  const selectCompany = async (id: string) => {
    setSelecting(id)
    await fetch('/api/auth/set-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: id }),
    })
    router.push('/dashboard')
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      alert('El logo debe ser menor a 500KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setNewLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  const createCompany = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        nit: newNit.trim() || null,
        logo_url: newLogo || null,
        color: newColor,
      }),
    })
    if (res.ok) {
      const company = await res.json()
      setCompanies(prev => [...prev, company])
      setNewName('')
      setNewNit('')
      setNewLogo('')
      setNewColor('from-amber-500 to-orange-500')
      setShowCreate(false)
    }
    setCreating(false)
  }

  const COLORS = [
    { label: 'Naranja', value: 'from-amber-500 to-orange-500', css: 'linear-gradient(135deg, #f59e0b, #f97316)' },
    { label: 'Azul', value: 'from-blue-500 to-cyan-500', css: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { label: 'Verde', value: 'from-emerald-500 to-teal-500', css: 'linear-gradient(135deg, #10b981, #14b8a6)' },
    { label: 'Rojo', value: 'from-red-500 to-rose-500', css: 'linear-gradient(135deg, #ef4444, #f43f5e)' },
    { label: 'Morado', value: 'from-violet-500 to-purple-500', css: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
    { label: 'Amarillo', value: 'from-yellow-500 to-amber-500', css: 'linear-gradient(135deg, #eab308, #f59e0b)' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--grad-main)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
            <Shield size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-extrabold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Jimmy Academy</div>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--amber)' }}>SG-SST · Super Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-dim)' }}>{session?.user?.name || 'Super Admin'}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {loading ? (
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
        ) : (
          <div className="w-full max-w-4xl">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Seleccionar Empresa
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Elige la empresa en la que deseas trabajar
              </p>
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
              {companies.filter(c => c.active).map((company, i) => (
                <motion.button
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => selectCompany(company.id)}
                  disabled={!!selecting}
                  className="terra-card terra-card-lift p-6 text-left group relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name}
                        className="w-14 h-14 rounded-xl object-contain" style={{ background: 'var(--bg-card)', padding: '4px' }} />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${company.color || 'from-amber-500 to-orange-500'}`}>
                        <Building2 size={28} className="text-white" />
                      </div>
                    )}
                    {selecting === company.id ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--amber)' }} />
                    ) : (
                      <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--amber)' }} />
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>{company.name}</h3>
                  {company.nit && (
                    <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>NIT: {company.nit}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
                    <span className="flex items-center gap-1"><Users size={12} /> Usuarios</span>
                    <span className="flex items-center gap-1"><BookOpen size={12} /> Capacitaciones</span>
                  </div>
                </motion.button>
              ))}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: companies.length * 0.07 }}
                onClick={() => setShowCreate(true)}
                className="terra-card p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] group"
                style={{ border: '2px dashed var(--border)' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <Plus size={28} style={{ color: 'var(--text-dim)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>Nueva Empresa</span>
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="terra-card p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Nueva Empresa</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {/* Logo upload */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Logo de la empresa</label>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {newLogo ? (
                  <div className="flex items-center gap-3">
                    <img src={newLogo} alt="Logo" className="w-16 h-16 rounded-xl object-contain" style={{ background: 'var(--bg-card)', padding: '4px', border: '1px solid var(--border)' }} />
                    <div className="flex-1">
                      <p className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Logo cargado</p>
                      <div className="flex gap-2">
                        <button onClick={() => logoInputRef.current?.click()} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--amber)' }}>Cambiar</button>
                        <button onClick={() => setNewLogo('')} className="text-xs px-2 py-1 rounded" style={{ color: '#FCA5A5' }}>Quitar</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => logoInputRef.current?.click()}
                    className="rounded-xl p-4 text-center cursor-pointer transition-all hover:opacity-80"
                    style={{ border: '2px dashed var(--border)', background: 'var(--bg-card)' }}>
                    <Image size={24} className="mx-auto mb-1.5" style={{ color: 'var(--text-faint)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Click para subir logo</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>PNG, JPG, SVG — Max 500KB</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Nombre de la empresa *</label>
                <input
                  className="terra-input w-full"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: AgroVenture Capital"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>NIT</label>
                <input
                  className="terra-input w-full"
                  value={newNit}
                  onChange={e => setNewNit(e.target.value)}
                  placeholder="Ej: 900.123.456-7"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Color de la empresa</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c.value} onClick={() => setNewColor(c.value)}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: c.css,
                        outline: newColor === c.value ? '2px solid var(--amber)' : 'none',
                        outlineOffset: '2px',
                      }}
                      title={c.label} />
                  ))}
                </div>
              </div>

              <button
                onClick={createCompany}
                disabled={creating || !newName.trim()}
                className="terra-btn-primary w-full py-2.5"
              >
                {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Crear Empresa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
