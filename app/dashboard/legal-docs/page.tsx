'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, Edit2, CheckCircle, Clock, Shield, Eye,
  Download, Search, X, Loader2, AlertCircle, Save,
  ChevronDown, ChevronUp, History, Users, Check,
  ToggleLeft, ToggleRight, PenTool, RefreshCw
} from 'lucide-react'
import { SignatureCanvas } from '@/components/SignatureCanvas'

// ── Types ───────────────────────────────────────────────────────────────────
interface LegalDoc {
  id: string; slug: string; title: string; content: string
  version: string; requires_signature: boolean; is_active: boolean; created_at: string
}
interface Signature {
  id: string; document_version: string; user_name: string; user_cargo: string
  company_id: string; ip_address: string; doc_hash: string; signed_at: string
  companies: { name: string } | null; signature_data: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderMd(md: string) {
  return md
    .split('\n')
    .map(line => {
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
      if (line.startsWith('• ') || line.startsWith('* ')) return `<li>${line.slice(2)}</li>`
      if (line === '') return '<br/>'
      return `<p>${line}</p>`
    })
    .join('')
}

function StatusBadge({ signed, version, sigVersion }: { signed: boolean; version: string; sigVersion?: string }) {
  if (!signed) return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(251,191,36,0.1)', color: '#FCD34D', border: '1px solid rgba(251,191,36,0.2)' }}>
      <Clock size={10} /> Pendiente
    </span>
  )
  const outdated = sigVersion && sigVersion !== version
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: outdated ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)', color: outdated ? '#FCD34D' : '#34D399', border: `1px solid ${outdated ? 'rgba(251,191,36,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
      {outdated ? <><Clock size={10} /> Requiere nueva firma (v{version})</> : <><CheckCircle size={10} /> Firmado v{sigVersion}</>}
    </span>
  )
}

// ── Admin: Create/Edit Modal ─────────────────────────────────────────────────
function DocModal({ doc, onClose, onSaved }: {
  doc: LegalDoc | null; onClose: () => void; onSaved: (d: LegalDoc) => void
}) {
  const isEdit = !!doc
  const [form, setForm] = useState({
    title:              doc?.title ?? '',
    slug:               doc?.slug  ?? '',
    content:            doc?.content ?? '',
    version:            doc?.version ?? '1.0',
    requires_signature: doc?.requires_signature ?? true,
    is_active:          doc?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setError('Título, slug y contenido son requeridos'); return
    }
    setSaving(true); setError('')
    const method = isEdit ? 'PUT' : 'POST'
    const body   = isEdit ? { id: doc!.id, ...form } : form
    const res = await fetch('/api/legal-docs', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { onSaved(await res.json()); onClose() }
    else { const e = await res.json().catch(() => ({})); setError(e.error || 'Error al guardar') }
    setSaving(false)
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto rounded-2xl flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', maxHeight: '90vh' }}>
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-bold" style={{ color: 'var(--text)' }}>
              {isEdit ? 'Editar documento' : 'Nuevo documento legal'}
            </h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}><X size={14} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                <AlertCircle size={13} />{error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Título *</label>
                <input value={form.title} onChange={e => f('title', e.target.value)}
                  placeholder="Nombre del documento" className="terra-input" />
              </div>
              <div>
                <label className="field-label">Slug (único) *</label>
                <input value={form.slug} onChange={e => f('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="acuerdo-uso-plataforma" className="terra-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Versión *</label>
                <input value={form.version} onChange={e => f('version', e.target.value)}
                  placeholder="1.0" className="terra-input" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="field-label">Opciones</label>
                {[
                  { k: 'requires_signature', label: 'Requiere firma obligatoria' },
                  { k: 'is_active',          label: 'Activo' },
                ].map(({ k, label }) => (
                  <div key={k} className="flex items-center justify-between px-3 py-1.5 rounded-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--text)' }}>{label}</span>
                    <button onClick={() => f(k, !(form as any)[k])}>
                      {(form as any)[k]
                        ? <ToggleRight size={18} style={{ color: '#3B82F6' }} />
                        : <ToggleLeft size={18} style={{ color: 'var(--text-faint)' }} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Contenido (Markdown) *</label>
              <textarea value={form.content} onChange={e => f('content', e.target.value)}
                rows={16} className="terra-input resize-none font-mono text-xs" />
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={onClose} className="terra-btn-outline flex-1">Cancelar</button>
            <button onClick={save} disabled={saving} className="terra-btn flex-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isEdit ? 'Guardar cambios' : 'Crear documento'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Signature History Panel ──────────────────────────────────────────────────
function SignaturePanel({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) {
  const [sigs, setSigs]         = useState<Signature[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/legal-docs/${doc.id}/signatures`).then(r => r.json()).then(d => {
      setSigs(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [doc.id])

  const filtered = sigs.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.user_name?.toLowerCase().includes(q) ||
      s.companies?.name?.toLowerCase().includes(q) ||
      s.document_version?.includes(q)
    )
  })

  const downloadPdf = async (sig: Signature) => {
    const res = await fetch(`/api/legal-docs/${doc.id}/pdf?user_id=${sig.user_id ?? ''}&version=${sig.document_version}`)
    if (!res.ok) return
    const { pdf_data } = await res.json()
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdf_data}`
    link.download = `${doc.slug}-v${sig.document_version}-${sig.user_name?.replace(/\s/g, '-')}.pdf`
    link.click()
  }

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col shadow-2xl"
      style={{ width: 480, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>

      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Historial de firmas</div>
          <div className="text-xs mt-0.5 truncate max-w-[320px]" style={{ color: 'var(--text-faint)' }}>{doc.title}</div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}><X size={14} /></button>
      </div>

      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa, usuario, versión…"
            className="terra-input pl-8 py-1.5 text-xs w-full" />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
          <span>{filtered.length} firma{filtered.length !== 1 ? 's' : ''}</span>
          <span>Versión actual: <strong style={{ color: 'var(--text)' }}>v{doc.version}</strong></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-faint)' }}>Sin firmas registradas</p>
        ) : (
          filtered.map(sig => (
            <div key={sig.id} className="terra-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{sig.user_name || '—'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: sig.document_version === doc.version ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', color: sig.document_version === doc.version ? '#34D399' : '#FCD34D' }}>
                      v{sig.document_version}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {sig.companies?.name ?? '—'} · {sig.user_cargo ?? '—'}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                    {new Date(sig.signed_at).toLocaleString('es-CO')}
                    {sig.ip_address && <> · IP: {sig.ip_address}</>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setExpanded(expanded === sig.id ? null : sig.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
                    <Eye size={12} />
                  </button>
                  <button onClick={() => downloadPdf(sig)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
                    <Download size={12} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === sig.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-[10px] mb-1 font-bold uppercase" style={{ color: 'var(--text-faint)' }}>Firma</div>
                      <img src={sig.signature_data} alt="Firma" className="rounded-lg max-h-16 w-auto"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }} />
                      {sig.doc_hash && (
                        <div className="text-[9px] mt-2 break-all" style={{ color: 'var(--text-faint)' }}>
                          SHA-256: {sig.doc_hash}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function LegalDocsPage() {
  const { data: session } = useSession()
  const userRole  = (session?.user as any)?.role ?? 'worker'
  const isAdmin   = userRole === 'admin' || userRole === 'superadmin'
  const isSuperAdmin = userRole === 'superadmin'

  const [docs, setDocs]               = useState<LegalDoc[]>([])
  const [mySigs, setMySigs]           = useState<Map<string, Signature>>(new Map())
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')

  // Admin states
  const [editDoc, setEditDoc]         = useState<LegalDoc | null | 'new'>()
  const [historyDoc, setHistoryDoc]   = useState<LegalDoc | null>(null)
  const [expanded, setExpanded]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [docsRes, sigsRes] = await Promise.all([
      fetch('/api/legal-docs'),
      fetch('/api/legal-docs/pending'), // just used to know what's pending
    ])
    if (docsRes.ok) setDocs(await docsRes.json())

    // Load own signatures for each doc
    if (!isAdmin) {
      // We'll load per-doc on expand
    }
    setLoading(false)
  }, [isAdmin])

  // Load own signature status
  useEffect(() => {
    if (!isAdmin) {
      // Fetch signatures for current user across all docs
      Promise.all(
        docs.map(d => fetch(`/api/legal-docs/${d.id}/signatures`).then(r => r.ok ? r.json() : []))
      ).then(results => {
        const map = new Map<string, Signature>()
        results.forEach((sigs, i) => {
          if (Array.isArray(sigs) && sigs.length > 0) map.set(docs[i].id, sigs[0])
        })
        setMySigs(map)
      })
    }
  }, [docs, isAdmin])

  useEffect(() => { load() }, [load])

  const filtered = docs.filter(d => {
    if (!isAdmin && !d.is_active) return false
    if (!search) return true
    const q = search.toLowerCase()
    return d.title.toLowerCase().includes(q) || d.slug.includes(q)
  })

  const downloadMyPdf = async (doc: LegalDoc) => {
    const res = await fetch(`/api/legal-docs/${doc.id}/pdf`)
    if (!res.ok) return
    const { pdf_data } = await res.json()
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdf_data}`
    link.download = `${doc.slug}-firmado.pdf`
    link.click()
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={20} style={{ color: '#3B82F6' }} />
              <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Documentos Legales
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {isAdmin
                ? 'Administra los documentos legales de la plataforma'
                : 'Documentos que debes leer, aceptar y firmar electrónicamente'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <RefreshCw size={13} />
            </button>
            {isSuperAdmin && (
              <button onClick={() => setEditDoc('new')} className="terra-btn">
                <Plus size={14} /> Nuevo documento
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} />{error}
          <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar documentos…" className="terra-input pl-9" />
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Sin documentos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc, i) => {
            const mySig   = mySigs.get(doc.id)
            const signed  = !!mySig
            const isOpen  = expanded === doc.id

            return (
              <motion.div key={doc.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <div className="terra-card overflow-hidden">
                  {/* Row header */}
                  <div className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : doc.id)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <FileText size={16} style={{ color: '#3B82F6' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{doc.title}</span>
                        {!doc.is_active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(107,114,128,0.15)', color: '#9CA3AF' }}>Inactivo</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>v{doc.version}</span>
                        {!isAdmin && doc.requires_signature && (
                          <StatusBadge signed={signed} version={doc.version} sigVersion={mySig?.document_version} />
                        )}
                        {isAdmin && doc.requires_signature && (
                          <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                            <Shield size={9} /> Firma obligatoria
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {new Date(doc.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0"
                      onClick={e => e.stopPropagation()}>
                      {isAdmin && (
                        <>
                          <button onClick={() => setHistoryDoc(doc)}
                            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-all"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                            <Users size={11} /> Firmas
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => setEditDoc(doc)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                              <Edit2 size={12} />
                            </button>
                          )}
                        </>
                      )}
                      {!isAdmin && signed && (
                        <button onClick={() => downloadMyPdf(doc)}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-all"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                          <Download size={11} /> PDF
                        </button>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                             : <ChevronDown size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />}
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden">
                        <div style={{ borderTop: '1px solid var(--border)' }}>
                          {/* Document text */}
                          <div className="px-5 py-4 max-h-80 overflow-y-auto text-xs leading-relaxed prose-legal"
                            style={{ color: 'var(--text-dim)' }}
                            dangerouslySetInnerHTML={{ __html: renderMd(doc.content) }} />

                          {/* Signature info for worker */}
                          {!isAdmin && mySig && (
                            <div className="px-5 pb-4">
                              <div className="rounded-xl p-3"
                                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle size={13} style={{ color: '#10B981' }} />
                                  <span className="text-xs font-bold" style={{ color: '#34D399' }}>
                                    Firmado el {new Date(mySig.signed_at).toLocaleString('es-CO')}
                                  </span>
                                </div>
                                <img src={mySig.signature_data} alt="Tu firma"
                                  className="rounded-lg max-h-14 w-auto"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modals & panels */}
      <AnimatePresence>
        {(editDoc === 'new' || (editDoc && editDoc !== 'new')) && (
          <DocModal
            doc={editDoc === 'new' ? null : editDoc as LegalDoc}
            onClose={() => setEditDoc(undefined)}
            onSaved={saved => {
              setDocs(prev => {
                const idx = prev.findIndex(d => d.id === saved.id)
                if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
                return [saved, ...prev]
              })
            }}
          />
        )}
        {historyDoc && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40" onClick={() => setHistoryDoc(null)} />
            <SignaturePanel doc={historyDoc} onClose={() => setHistoryDoc(null)} />
          </>
        )}
      </AnimatePresence>

      {/* Inline prose styles */}
      <style jsx global>{`
        .prose-legal h2 { font-weight: 700; font-size: 0.8rem; color: var(--text); margin: 1em 0 0.4em; }
        .prose-legal p  { margin: 0.4em 0; }
        .prose-legal li { margin: 0.2em 0; }
      `}</style>
    </div>
  )
}
