'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle, LogOut, Loader2, AlertCircle,
  Shield, ChevronDown, Check, Clock
} from 'lucide-react'
import { SignatureCanvas } from '@/components/SignatureCanvas'

interface PendingDoc {
  id: string
  slug: string
  title: string
  version: string
  content: string
}

// Simple markdown-to-HTML renderer (headers, lists, paragraphs)
function renderContent(md: string) {
  const lines = md.split('\n')
  const html: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h2>${line.slice(3)}</h2>`)
    } else if (line.startsWith('• ') || line.startsWith('* ')) {
      if (!inList) { html.push('<ul>'); inList = true }
      html.push(`<li>${line.slice(2)}</li>`)
    } else if (line === '') {
      if (inList) { html.push('</ul>'); inList = false }
      html.push('<br/>')
    } else {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<p>${line}</p>`)
    }
  }
  if (inList) html.push('</ul>')
  return html.join('')
}

// Generate a simple PDF using jsPDF (client-side)
async function generatePDF(doc: PendingDoc, signer: {
  name: string; cargo: string; company: string; signatureData: string; signedAt: string
}): Promise<string> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = pdf.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 20

  // Header
  pdf.setFontSize(9)
  pdf.setTextColor(100)
  pdf.text('Agro Venture Capital S.A.S.', margin, y)
  pdf.text(`Versión ${doc.version}`, pageW - margin, y, { align: 'right' })
  y += 6
  pdf.setDrawColor(200)
  pdf.line(margin, y, pageW - margin, y)
  y += 10

  // Title
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(20)
  const titleLines = pdf.splitTextToSize(doc.title, contentW)
  pdf.text(titleLines, margin, y)
  y += titleLines.length * 6 + 8

  // Content (strip markdown)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(40)
  const plainContent = doc.content
    .replace(/^## /gm, '')
    .replace(/^[•*] /gm, '  • ')
  const contentLines = pdf.splitTextToSize(plainContent, contentW)
  for (const line of contentLines) {
    if (y > 260) { pdf.addPage(); y = 20 }
    pdf.text(line, margin, y)
    y += 4.5
  }

  y += 10
  if (y > 240) { pdf.addPage(); y = 20 }

  // Signature block
  pdf.setDrawColor(200)
  pdf.line(margin, y, pageW - margin, y)
  y += 8

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FIRMA ELECTRÓNICA', margin, y)
  y += 6

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(60)
  const fields = [
    ['Empresa',   signer.company],
    ['Usuario',   signer.name],
    ['Cargo',     signer.cargo],
    ['Fecha',     signer.signedAt],
    ['Versión',   doc.version],
  ]
  for (const [label, value] of fields) {
    pdf.setFont('helvetica', 'bold'); pdf.text(`${label}:`, margin, y)
    pdf.setFont('helvetica', 'normal'); pdf.text(value || '—', margin + 28, y)
    y += 5
  }
  y += 4

  // Embed signature image
  try {
    pdf.addImage(signer.signatureData, 'PNG', margin, y, 70, 22)
    y += 26
  } catch { /* skip if image fails */ }

  pdf.setFontSize(7)
  pdf.setTextColor(140)
  pdf.text('Este documento fue firmado electrónicamente a través de la plataforma Jimmy Academy SST.', margin, y)
  pdf.text('La firma electrónica tiene plena validez conforme a la Ley 527 de 1999.', margin, y + 4)

  return pdf.output('datauristring')
}

export default function LegalGatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pending, setPending]       = useState<PendingDoc[]>([])
  const [current, setCurrent]       = useState<PendingDoc | null>(null)
  const [idx, setIdx]               = useState(0)
  const [loading, setLoading]       = useState(true)
  const [step, setStep]             = useState<'reading' | 'signing' | 'done'>('reading')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  const checkPending = useCallback(async () => {
    const res = await fetch('/api/legal-docs/pending')
    if (!res.ok) { setLoading(false); return }
    const docs: PendingDoc[] = await res.json()
    if (docs.length === 0) {
      // All signed — set session cookie and go to dashboard
      document.cookie = `ld_ok=${session?.user?.email ?? '1'};path=/;samesite=strict`
      router.replace('/dashboard')
      return
    }
    setPending(docs)
    setCurrent(docs[0])
    setIdx(0)
    setStep('reading')
    setScrolledToBottom(false)
    setLoading(false)
  }, [session, router])

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return }
    if (status === 'authenticated') checkPending()
  }, [status, checkPending, router])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setScrolledToBottom(true)
  }

  const handleSign = async () => {
    if (!signatureData || !current) return
    setSubmitting(true)
    setError('')

    const user = session?.user as any
    const signedAt = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'medium' })

    try {
      const pdfDataUri = await generatePDF(current, {
        name:          user?.name ?? '',
        cargo:         user?.cargo ?? '',
        company:       user?.company ?? '',
        signatureData,
        signedAt,
      })
      // Strip data:application/pdf;filename=generated.pdf;base64, prefix if present
      const pdfBase64 = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri

      const res = await fetch(`/api/legal-docs/${current.id}/sign`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data:    signatureData,
          pdf_data:          pdfBase64,
          document_version:  current.version,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'Error al guardar la firma')
        setSubmitting(false)
        return
      }

      // Move to next document or finish
      const nextIdx = idx + 1
      if (nextIdx < pending.length) {
        setIdx(nextIdx)
        setCurrent(pending[nextIdx])
        setStep('reading')
        setSignatureData(null)
        setScrolledToBottom(false)
      } else {
        setStep('done')
        setTimeout(() => {
          document.cookie = `ld_ok=${session?.user?.email ?? '1'};path=/;samesite=strict`
          router.replace('/dashboard')
        }, 2000)
      }
    } catch {
      setError('Error generando el PDF. Intenta de nuevo.')
    }
    setSubmitting(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #0A0F1E)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #0A0F1E)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={36} style={{ color: '#10B981' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text, #fff)' }}>Documentos firmados</h2>
          <p className="text-sm" style={{ color: 'var(--text-dim, #9CA3AF)' }}>Ingresando al sistema…</p>
          <Loader2 size={20} className="animate-spin" style={{ color: '#3B82F6' }} />
        </motion.div>
      </div>
    )
  }

  if (!current) return null

  const totalDocs = pending.length
  const progress  = ((idx) / totalDocs) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base, #0A0F1E)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Shield size={16} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text, #fff)' }}>
              Agro Venture Capital S.A.S.
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-faint, #6B7280)' }}>
              Plataforma de Gestión SST
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {totalDocs > 1 && (
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
              {idx + 1} de {totalDocs}
            </span>
          )}
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-dim, #9CA3AF)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FCA5A5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-dim, #9CA3AF)' }}>
            <LogOut size={12} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {totalDocs > 1 && (
        <div className="h-0.5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: '#3B82F6' }} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 overflow-hidden">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl flex flex-col"
          style={{ maxHeight: 'calc(100vh - 120px)' }}>

          {/* Document card */}
          <div className="rounded-2xl flex flex-col overflow-hidden flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: step === 'reading' ? 'calc(100vh - 200px)' : '50vh',
            }}>

            {/* Doc header */}
            <div className="px-6 pt-5 pb-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <FileText size={18} style={{ color: '#3B82F6' }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: '#3B82F6' }}>
                    Documento requerido · v{current.version}
                  </div>
                  <h1 className="font-bold text-sm leading-snug" style={{ color: 'var(--text, #fff)' }}>
                    {current.title}
                  </h1>
                </div>
              </div>
              {step === 'reading' && !scrolledToBottom && (
                <div className="flex items-center gap-1.5 mt-3 text-[11px]"
                  style={{ color: 'var(--text-faint, #6B7280)' }}>
                  <ChevronDown size={12} className="animate-bounce" />
                  Desplázate hasta el final para firmar
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4"
              onScroll={handleScroll}
              style={{ color: 'var(--text-dim, #9CA3AF)', fontSize: 13, lineHeight: 1.7 }}>
              <div
                className="prose-legal"
                dangerouslySetInnerHTML={{ __html: renderContent(current.content) }}
                style={{ '--prose-h2': 'var(--text, #fff)' } as any}
              />
            </div>
          </div>

          {/* Signature area */}
          <AnimatePresence mode="wait">
            {step === 'reading' && scrolledToBottom && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Check size={12} style={{ color: '#10B981' }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text, #fff)' }}>
                    He leído y acepto el documento
                  </span>
                </div>
                <button
                  onClick={() => setStep('signing')}
                  className="terra-btn w-full justify-center py-3 text-sm font-bold">
                  Proceder a firmar
                </button>
              </motion.div>
            )}

            {step === 'signing' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold" style={{ color: 'var(--text, #fff)' }}>
                    Firma electrónica
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
                    v{current.version}
                  </span>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                    <AlertCircle size={13} /> {error}
                  </div>
                )}

                {!signatureData ? (
                  <SignatureCanvas
                    onSave={data => setSignatureData(data)}
                    onCancel={() => setStep('reading')}
                    confirmLabel="Guardar firma"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden border"
                      style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                      <img src={signatureData} alt="Tu firma" className="w-full" style={{ maxHeight: 100, objectFit: 'contain' }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSignatureData(null)}
                        className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-dim, #9CA3AF)' }}>
                        Cambiar firma
                      </button>
                      <button onClick={handleSign} disabled={submitting}
                        className="terra-btn flex-1 justify-center py-2.5 text-sm font-bold">
                        {submitting
                          ? <><Loader2 size={14} className="animate-spin" />Firmando…</>
                          : <><CheckCircle size={14} />Firmar y continuar</>}
                      </button>
                    </div>
                    <p className="text-[10px] text-center" style={{ color: 'var(--text-faint, #6B7280)' }}>
                      Al firmar declaras haber leído y aceptado el documento en su versión {current.version}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Inline prose styles */}
      <style jsx global>{`
        .prose-legal h2 { font-weight: 700; font-size: 0.85rem; color: #F9FAFB; margin: 1.2em 0 0.4em; }
        .prose-legal p  { margin: 0.5em 0; }
        .prose-legal ul { padding-left: 1.2em; margin: 0.5em 0; }
        .prose-legal li { margin: 0.25em 0; list-style: disc; }
        .prose-legal br { display: block; margin: 0.3em 0; content: ''; }
      `}</style>
    </div>
  )
}
