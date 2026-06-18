'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Building2, Plus, ArrowRight, Users, BookOpen, Loader2, X, Shield, LogOut, Image, Edit3 } from 'lucide-react'

interface Company {
  id: string
  name: string
  nit: string | null
  logo_url: string | null
  color: string | null
  active: boolean
  created_at: string
}

const COLORS = [
  { label: 'Naranja', value: 'from-amber-500 to-orange-500', css: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  { label: 'Azul', value: 'from-blue-500 to-cyan-500', css: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { label: 'Verde', value: 'from-emerald-500 to-teal-500', css: 'linear-gradient(135deg, #10b981, #14b8a6)' },
  { label: 'Rojo', value: 'from-red-500 to-rose-500', css: 'linear-gradient(135deg, #ef4444, #f43f5e)' },
  { label: 'Morado', value: 'from-violet-500 to-purple-500', css: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
  { label: 'Amarillo', value: 'from-yellow-500 to-amber-500', css: 'linear-gradient(135deg, #eab308, #f59e0b)' },
]

export default function SelectCompanyPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  // Modal state (create or edit)
  const [showModal, setShowModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formName, setFormName] = useState('')
  const [formNit, setFormNit] = useState('')
  const [formLogo, setFormLogo] = useState('')
  const [formColor, setFormColor] = useState('from-amber-500 to-orange-500')
  const [saving, setSaving] = useState(false)
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

  const openCreate = () => {
    setEditingCompany(null)
    setFormName('')
    setFormNit('')
    setFormLogo('')
    setFormColor('from-amber-500 to-orange-500')
    setShowModal(true)
  }

  const openEdit = (e: React.MouseEvent, company: Company) => {
    e.stopPropagation()
    setEditingCompany(company)
    setFormName(company.name)
    setFormNit(company.nit || '')
    setFormLogo(company.logo_url || '')
    setFormColor(company.color || 'from-amber-500 to-orange-500')
    setShowModal(true)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) { alert('El logo debe ser menor a 500KB'); return }
    const reader = new FileReader()
    reader.onload = () => setFormLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)

    if (editingCompany) {
      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCompany.id,
          name: formName.trim(),
          nit: formNit.trim() || null,
          logo_url: formLogo || null,
          color: formColor,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c))
        setShowModal(false)
      }
    } else {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          nit: formNit.trim() || null,
          logo_url: formLogo || null,
          color: formColor,
        }),
      })
      if (res.ok) {
        const company = await res.json()
        setCompanies(prev => [...prev, company])
        setShowModal(false)
      }
    }
    setSaving(false)
  }

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
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => !selecting && selectCompany(company.id)}
                  className="terra-card terra-card-lift p-6 text-left group relative cursor-pointer"
                >
                  {/* Edit button */}
                  <button
                    onClick={(e) => openEdit(e, company)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    title="Editar empresa"
                  >
                    <Edit3 size={13} style={{ color: 'var(--amber)' }} />
                  </button>

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
                </motion.div>
              ))}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: companies.length * 0.07 }}
                onClick={openCreate}
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

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="terra-card p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {/* Logo upload */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Logo de la empresa</label>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {formLogo ? (
                  <div className="flex items-center gap-3">
                    <img src={formLogo} alt="Logo" className="w-16 h-16 rounded-xl object-contain" style={{ background: 'var(--bg-card)', padding: '4px', border: '1px solid var(--border)' }} />
                    <div className="flex-1">
                      <p className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Logo cargado</p>
                      <div className="flex gap-2">
                        <button onClick={() => logoInputRef.current?.click()} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--amber)' }}>Cambiar</button>
                        <button onClick={() => setFormLogo('')} className="text-xs px-2 py-1 rounded" style={{ color: '#FCA5A5' }}>Quitar</button>
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
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: AgroVenture Capital"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>NIT</label>
                <input
                  className="terra-input w-full"
                  value={formNit}
                  onChange={e => setFormNit(e.target.value)}
                  placeholder="Ej: 900.123.456-7"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Color de la empresa</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c.value} onClick={() => setFormColor(c.value)}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: c.css,
                        outline: formColor === c.value ? '2px solid var(--amber)' : 'none',
                        outlineOffset: '2px',
                      }}
                      title={c.label} />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="terra-btn-primary w-full py-2.5"
              >
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingCompany ? 'Guardar Cambios' : 'Crear Empresa')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
