'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Award, Search, Plus, Download, CheckCircle, Clock,
  AlertCircle, Calendar, User, X, QrCode, Shield, Loader2, Trash2
} from 'lucide-react'
import { generateCertificatePNG } from '@/lib/generate-certificate'

type Cert = { id: string; name: string; cedula?: string; course: string; issued: string; expires: string; status: string; code: string; duration?: string; score?: string }

const statusConfig = {
  vigente: { label: 'Vigente', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  vencido: { label: 'Vencido', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', icon: AlertCircle },
  'por-vencer': { label: 'Por vencer', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: Clock },
}

function computeStatus(cert: Cert): Cert {
  const now = Date.now()
  const exp = new Date(cert.expires).getTime()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  if (exp < now) return { ...cert, status: 'vencido' }
  if (exp - now < thirtyDays) return { ...cert, status: 'por-vencer' }
  return { ...cert, status: 'vigente' }
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Cert[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [selected, setSelected] = useState<Cert | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Cert | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    await fetch('/api/certificates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteConfirm.id }),
    })
    setCerts(prev => prev.filter(c => c.id !== deleteConfirm.id))
    setDeleteConfirm(null)
    setDeleting(false)
  }

  const handleDownload = async (cert: Cert) => {
    if (downloading) return
    setDownloading(true)
    try {
      const img = await generateCertificatePNG({
        employeeName: cert.name,
        employeeCedula: cert.cedula || '',
        course: cert.course,
        date: new Date(cert.issued).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        duration: cert.duration || '8 horas',
        score: cert.score || '100%',
        code: cert.code,
        logoUrl: '/images/LOGO.png',
        instructorSignatureUrl: '/images/FIRMA FIRMA.png',
      })
      const link = document.createElement('a')
      link.download = `Certificado_${cert.course.replace(/\s+/g, '_')}_${cert.code}.png`
      link.href = img
      link.click()
    } catch (e) {
      console.error('Error generating certificate:', e)
    }
    setDownloading(false)
  }

  useEffect(() => {
    fetch('/api/certificates')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setCerts(data.map((c: any) => computeStatus({
            id: c.id,
            name: c.name,
            cedula: c.cedula,
            course: c.course,
            issued: c.issued,
            expires: c.expires,
            status: 'vigente',
            code: c.code,
            duration: c.duration,
            score: c.score,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const filtered = certs.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.course.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)] mb-1">Certificados</h1>
            <p className="text-[var(--text-dim)] text-sm">{certs.length} certificados emitidos</p>
          </div>
          <Link href="/dashboard/trainings"
            className="flex items-center gap-2 bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start sm:self-auto">
            <Plus size={16} /> Emitir Certificado
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total emitidos', value: certs.length, color: 'text-amber-400' },
          { label: 'Vigentes', value: certs.filter(c => c.status === 'vigente').length, color: 'text-emerald-400' },
          { label: 'Por vencer', value: certs.filter(c => c.status === 'por-vencer').length, color: 'text-orange-400' },
          { label: 'Vencidos', value: certs.filter(c => c.status === 'vencido').length, color: 'text-rose-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[var(--text-dim)] text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, curso o código..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-amber-500/40 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['todos', 'vigente', 'por-vencer', 'vencido'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${filter === f ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['ID Certificado', 'Empleado', 'Curso', 'Emisión', 'Vencimiento', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((c, i) => {
                const st = statusConfig[c.status as keyof typeof statusConfig]
                const StIcon = st.icon
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                          <Award size={14} className="text-violet-400" />
                        </div>
                        <span className="text-[var(--text-dim)] text-xs font-mono">{c.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-[var(--text-faint)]" />
                        <span className="text-[var(--text)] text-sm font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-dim)] text-sm max-w-[200px] truncate">{c.course}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[var(--text-dim)] text-xs"><Calendar size={11} /> {c.issued}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[var(--text-dim)] text-xs"><Calendar size={11} /> {c.expires}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${st.bg} ${st.color}`}>
                        <StIcon size={11} /> {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-[var(--text-faint)] hover:text-amber-400 transition-colors" onClick={e => { e.stopPropagation(); setSelected(c) }} title="Descargar">
                          <Download size={15} />
                        </button>
                        <button className="text-[var(--text-faint)] hover:text-rose-400 transition-colors" onClick={e => { e.stopPropagation(); setDeleteConfirm(c) }} title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-white/5">
          {filtered.map((c, i) => {
            const st = statusConfig[c.status as keyof typeof statusConfig]
            const StIcon = st.icon
            return (
              <div key={c.id} className="p-4 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[var(--text)] font-semibold text-sm">{c.name}</div>
                    <div className="text-[var(--text-faint)] text-xs mt-0.5 line-clamp-1">{c.course}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border flex-shrink-0 ${st.bg} ${st.color}`}>
                    <StIcon size={10} /> {st.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-faint)]">
                  <span className="font-mono truncate max-w-[160px]">{c.id}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span>Vence {c.expires}</span>
                    <button onClick={e => { e.stopPropagation(); setDeleteConfirm(c) }} className="text-rose-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--text-faint)]">
            <Award size={32} className="mx-auto mb-3 opacity-30" />
            <p>No se encontraron certificados</p>
          </div>
        )}
      </motion.div>

      {/* Certificate detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>

            {/* Certificate card design */}
            <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-amber-500/20 rounded-t-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-3">
                <Award size={26} className="text-[var(--text)]" />
              </div>
              <div className="text-xs text-amber-300 font-semibold mb-1">CERTIFICADO DE COMPETENCIA</div>
              <h2 className="text-[var(--text)] font-black text-lg leading-snug">{selected.course}</h2>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)] flex items-center gap-1.5"><User size={12} /> Empleado</span>
                  <span className="text-[var(--text)] font-semibold">{selected.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)] flex items-center gap-1.5"><Calendar size={12} /> Emisión</span>
                  <span className="text-[var(--text)]">{selected.issued}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)] flex items-center gap-1.5"><Clock size={12} /> Vencimiento</span>
                  <span className="text-[var(--text)]">{selected.expires}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)] flex items-center gap-1.5"><Shield size={12} /> Código</span>
                  <span className="text-[var(--text)] font-mono text-xs">{selected.code}</span>
                </div>
              </div>

              {/* QR placeholder */}
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
                  <QrCode size={40} className="text-[var(--text-dim)]" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-sm font-semibold transition-all">
                  Cerrar
                </button>
                <button onClick={() => selected && handleDownload(selected)} disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] text-sm font-semibold transition-all disabled:opacity-50">
                  {downloading ? <><Loader2 size={14} className="animate-spin" /> Generando...</> : <><Download size={14} /> Descargar</>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Trash2 size={22} className="text-rose-400" />
            </div>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>¿Eliminar certificado?</h3>
            <p className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{deleteConfirm.name}</span>
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--text-faint)' }}>{deleteConfirm.course}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold transition-all"
                style={{ color: 'var(--text-dim)' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all text-white disabled:opacity-50"
                style={{ background: '#EF4444' }}>
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
