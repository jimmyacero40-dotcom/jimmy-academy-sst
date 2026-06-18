'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Building2, Plus, ArrowRight, Users, BookOpen, Loader2, X } from 'lucide-react'

interface Company {
  id: string
  name: string
  nit: string | null
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
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (role && role !== 'superadmin') {
      router.replace('/dashboard')
      return
    }
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

  const createCompany = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), nit: newNit.trim() || null }),
    })
    if (res.ok) {
      const company = await res.json()
      setCompanies(prev => [...prev, company])
      setNewName('')
      setNewNit('')
      setShowCreate(false)
    }
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          Seleccionar Empresa
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>
          Elige la empresa en la que deseas trabajar
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.filter(c => c.active).map((company, i) => (
          <motion.button
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => selectCompany(company.id)}
            disabled={!!selecting}
            className="terra-card terra-card-lift p-6 text-left group relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--grad-main)' }}>
                <Building2 size={24} className="text-white" />
              </div>
              {selecting === company.id ? (
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--amber)' }} />
              ) : (
                <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--amber)' }} />
              )}
            </div>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>{company.name}</h3>
            {company.nit && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>NIT: {company.nit}</p>
            )}
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="flex items-center gap-1"><Users size={12} /> Usuarios</span>
              <span className="flex items-center gap-1"><BookOpen size={12} /> Capacitaciones</span>
            </div>
          </motion.button>
        ))}

        {/* Create new company */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: companies.length * 0.05 }}
          onClick={() => setShowCreate(true)}
          className="terra-card p-6 flex flex-col items-center justify-center gap-3 min-h-[180px] group"
          style={{ border: '2px dashed var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Plus size={24} style={{ color: 'var(--text-dim)' }} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>Nueva Empresa</span>
        </motion.button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="terra-card p-6 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Nueva Empresa</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
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
