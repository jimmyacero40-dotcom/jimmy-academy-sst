'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenTool, Search, Plus, CheckCircle, Clock, AlertCircle,
  FileText, Calendar, Download, X, Eye, Trash2, RotateCcw,
  User, Shield, Send
} from 'lucide-react'

const DOCS = [
  { id: 1, title: 'Política de Seguridad y Salud en el Trabajo 2026', type: 'Política SST', signed: 48, total: 48, created: '2026-01-05', status: 'completado' },
  { id: 2, title: 'Reglamento de Higiene y Seguridad Industrial', type: 'Reglamento', signed: 35, total: 48, created: '2026-01-08', status: 'pendiente' },
  { id: 3, title: 'Compromiso EPP – Área de Producción', type: 'Compromiso', signed: 18, total: 24, created: '2026-01-10', status: 'pendiente' },
  { id: 4, title: 'Acta COPASST Reunión Enero 2026', type: 'Acta', signed: 8, total: 8, created: '2026-01-12', status: 'completado' },
  { id: 5, title: 'Plan de Emergencias y Evacuación', type: 'Plan', signed: 12, total: 56, created: '2026-01-14', status: 'pendiente' },
  { id: 6, title: 'Inducción SST – Nuevos Empleados Q1 2026', type: 'Inducción', signed: 5, total: 5, created: '2026-01-15', status: 'completado' },
]

const PENDING_SIGNATURES = [
  { id: 1, name: 'Pedro Gómez', area: 'Mantenimiento', doc: 'Reglamento de Higiene y Seguridad Industrial', due: '2026-01-20', days: 5 },
  { id: 2, name: 'Andrés Castro', area: 'Logística', doc: 'Política SST 2026', due: '2026-01-18', days: 3 },
  { id: 3, name: 'Camila Vargas', area: 'Producción', doc: 'Compromiso EPP – Área de Producción', due: '2026-01-22', days: 7 },
  { id: 4, name: 'Luis Mora', area: 'Producción', doc: 'Plan de Emergencias y Evacuación', due: '2026-01-19', days: 4 },
]

const statusConfig = {
  completado: { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  pendiente: { label: 'Pendiente', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: Clock },
}

// ── Signature Canvas Component ──
function SignatureCanvas({ onSave, onCancel }: { onSave: (data: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    drawing.current = true
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsEmpty(false)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDraw = () => { drawing.current = false }

  const clear = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const save = () => {
    if (isEmpty) return
    const data = canvasRef.current!.toDataURL('image/png')
    onSave(data)
  }

  return (
    <div className="space-y-3">
      <div className="relative border border-[var(--border-strong)] rounded-xl overflow-hidden bg-white/[0.02]">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full cursor-crosshair touch-none block"
          style={{ height: 160 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-[var(--text-faint)]">
              <PenTool size={24} />
              <p className="text-sm">Dibuja tu firma aquí</p>
              <p className="text-xs">Con el dedo o el mouse</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-0 right-0 border-b border-dashed border-[var(--border)] mx-4" />
      </div>

      <div className="flex gap-2">
        <button onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-xs font-semibold transition-all">
          <RotateCcw size={13} /> Borrar
        </button>
        <div className="flex-1" />
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-sm font-semibold transition-all">
          Cancelar
        </button>
        <button onClick={save} disabled={isEmpty}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--amber)] hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text)] text-sm font-semibold transition-all">
          <CheckCircle size={14} /> Confirmar firma
        </button>
      </div>
    </div>
  )
}

// ── Sign Document Modal ──
function SignModal({
  person,
  onClose,
  onSigned,
}: {
  person: typeof PENDING_SIGNATURES[0]
  onClose: () => void
  onSigned: (id: number) => void
}) {
  const [step, setStep] = useState<'preview' | 'sign' | 'done'>('preview')
  const [signatureImg, setSignatureImg] = useState('')
  const [agreed, setAgreed] = useState(false)

  const handleSave = (data: string) => {
    setSignatureImg(data)
    setStep('done')
    setTimeout(() => {
      onSigned(person.id)
      onClose()
    }, 2200)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-surface)] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <PenTool size={15} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-[var(--text)] font-bold text-sm">Firma de Documento</h2>
              <p className="text-[var(--text-faint)] text-xs">{person.name}</p>
            </div>
          </div>
          {step !== 'done' && (
            <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === 'done' ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-[var(--text)] font-black text-lg mb-1">¡Documento firmado!</h3>
              <p className="text-[var(--text-dim)] text-sm">La firma de <span className="text-[var(--text)] font-semibold">{person.name}</span> fue registrada exitosamente.</p>
              {signatureImg && (
                <div className="mt-4 bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)] inline-block">
                  <img src={signatureImg} alt="Firma" className="h-12 mx-auto opacity-80" />
                </div>
              )}
              <p className="text-[var(--text-faint)] text-xs mt-3">Cerrando automáticamente...</p>
            </motion.div>
          ) : step === 'preview' ? (
            <>
              {/* Document preview */}
              <div className="bg-white/[0.03] border border-[var(--border)] rounded-xl p-5 mb-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-[var(--text)] font-semibold text-sm leading-snug">{person.doc}</h3>
                    <p className="text-[var(--text-faint)] text-xs mt-0.5">Documento SST · Fecha límite: {person.due}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[var(--text-dim)] leading-relaxed">
                  <p>Al firmar este documento, <span className="text-[var(--text)] font-semibold">{person.name}</span> declara haber leído, entendido y aceptado el contenido del presente documento en cumplimiento con el SG-SST de la empresa.</p>
                  <p>Esta firma tiene validez legal según la <span className="text-[var(--text-dim)]">Ley 527 de 1999</span> (Comercio Electrónico) y el <span className="text-[var(--text-dim)]">Decreto 1072 de 2015</span>.</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-faint)]">
                  <div className="flex items-center gap-1.5"><User size={11} /> {person.name}</div>
                  <div className="flex items-center gap-1.5"><Shield size={11} /> Firma con validez jurídica</div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-5 group">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${agreed ? 'bg-[var(--amber)] border-blue-600' : 'bg-[var(--bg-card)] border-[var(--border-strong)] group-hover:border-white/25'}`}
                  onClick={() => setAgreed(!agreed)}>
                  {agreed && <CheckCircle size={13} className="text-[var(--text)]" />}
                </div>
                <span className="text-[var(--text-dim)] text-xs leading-relaxed">
                  He leído y comprendo el contenido del documento. Acepto firmarlo digitalmente como señal de mi conformidad y compromiso con el SG-SST.
                </span>
              </label>

              <button onClick={() => setStep('sign')} disabled={!agreed}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--amber)] hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text)] font-bold text-sm transition-all">
                <PenTool size={15} /> Continuar para firmar
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-[var(--text)] font-semibold text-sm mb-1">Dibuja tu firma</h3>
                <p className="text-[var(--text-faint)] text-xs">Usa el dedo (móvil) o el mouse (PC) para dibujar tu firma en el recuadro</p>
              </div>
              <SignatureCanvas onSave={handleSave} onCancel={() => setStep('preview')} />
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ──
export default function SignaturesPage() {
  const [search, setSearch] = useState('')
  const [showNewDoc, setShowNewDoc] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<typeof DOCS[0] | null>(null)
  const [signPerson, setSignPerson] = useState<typeof PENDING_SIGNATURES[0] | null>(null)
  const [signed, setSigned] = useState<number[]>([])
  const [docs, setDocs] = useState(DOCS)

  const pending = PENDING_SIGNATURES.filter(p => !signed.includes(p.id))

  const filtered = docs.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  )

  const handleSigned = (id: number) => {
    setSigned(prev => [...prev, id])
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)] mb-1">Firmas Digitales</h1>
            <p className="text-[var(--text-dim)] text-sm">{docs.length} documentos · {pending.length} firmas pendientes</p>
          </div>
          <button onClick={() => setShowNewDoc(true)}
            className="flex items-center gap-2 bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start sm:self-auto">
            <Plus size={16} /> Nuevo Documento
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Documentos', value: docs.length, color: 'text-amber-400' },
          { label: 'Firmas totales', value: docs.reduce((a, d) => a + d.signed, 0) + signed.length, color: 'text-emerald-400' },
          { label: 'Pendientes', value: pending.length, color: 'text-orange-400' },
          { label: 'Completados', value: docs.filter(d => d.status === 'completado').length, color: 'text-violet-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[var(--text-dim)] text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Documents list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2">
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documento..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-amber-500/40 transition-all" />
          </div>

          <div className="space-y-3">
            {filtered.map((doc, i) => {
              const st = statusConfig[doc.status as keyof typeof statusConfig]
              const StIcon = st.icon
              const progress = Math.round((doc.signed / doc.total) * 100)
              return (
                <motion.div key={doc.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-strong)] transition-all cursor-pointer"
                  onClick={() => setSelectedDoc(doc)}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-[var(--text)] text-sm font-semibold leading-snug line-clamp-1">{doc.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border flex-shrink-0 ${st.bg} ${st.color}`}>
                          <StIcon size={10} /> {st.label}
                        </span>
                      </div>
                      <p className="text-[var(--text-faint)] text-xs mb-2">{doc.type} · {doc.created}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-dim)] flex-shrink-0">{doc.signed}/{doc.total} firmas</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Pending signatures panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[var(--text)] text-sm">Firmas Pendientes</h3>
              <p className="text-[var(--text-faint)] text-xs mt-0.5">{pending.length} empleados sin firmar</p>
            </div>
            {pending.length > 0 && (
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[var(--text)] text-[10px] font-bold">
                {pending.length}
              </div>
            )}
          </div>

          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {pending.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 1 }} exit={{ opacity: 0, x: 20 }}
                  className="px-5 py-3.5 hover:bg-[var(--bg-card-hover)] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-[var(--text)] text-sm font-semibold">{p.name}</div>
                      <div className="text-[var(--text-faint)] text-xs mt-0.5">{p.area}</div>
                      <div className="text-[var(--text-faint)] text-xs mt-0.5 line-clamp-1">{p.doc}</div>
                    </div>
                    <div className={`text-xs font-bold flex-shrink-0 ${p.days <= 3 ? 'text-rose-400' : 'text-orange-400'}`}>
                      {p.days}d
                    </div>
                  </div>
                  <button
                    onClick={() => setSignPerson(p)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--amber)]/15 border border-amber-500/25 text-amber-400 hover:bg-[var(--amber)]/25 text-xs font-semibold transition-all">
                    <PenTool size={12} /> Firmar ahora
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {pending.length === 0 && (
            <div className="px-5 py-8 text-center">
              <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-emerald-400 text-sm font-semibold">¡Todo firmado!</p>
              <p className="text-[var(--text-faint)] text-xs mt-0.5">No hay firmas pendientes</p>
            </div>
          )}

          {pending.length > 0 && (
            <div className="p-4 border-t border-[var(--border)]">
              <button className="w-full py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold hover:bg-orange-500/20 transition-all flex items-center justify-center gap-2">
                <Send size={13} /> Enviar recordatorios
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sign modal */}
      {signPerson && (
        <SignModal
          person={signPerson}
          onClose={() => setSignPerson(null)}
          onSigned={handleSigned}
        />
      )}

      {/* Doc detail modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDoc(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text)] font-bold text-sm">Detalle del Documento</h2>
              <button onClick={() => setSelectedDoc(null)} className="text-[var(--text-dim)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <FileText size={22} className="text-amber-400" />
              </div>
              <h3 className="text-[var(--text)] font-bold mb-1">{selectedDoc.title}</h3>
              <p className="text-[var(--text-dim)] text-sm mb-4">{selectedDoc.type}</p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)]">Firmas recolectadas</span>
                  <span className="text-[var(--text)] font-semibold">{selectedDoc.signed} / {selectedDoc.total}</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((selectedDoc.signed / selectedDoc.total) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)]">Fecha creación</span>
                  <span className="text-[var(--text)]">{selectedDoc.created}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-sm font-semibold transition-all">
                  <Eye size={14} /> Ver
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] text-sm font-semibold transition-all">
                  <Download size={14} /> Descargar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* New doc modal */}
      {showNewDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text)] font-bold">Nuevo Documento</h2>
              <button onClick={() => setShowNewDoc(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Título del documento</label>
                <input placeholder="Política de Seguridad..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-amber-500/40 transition-all" />
              </div>
              <div>
                <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Tipo</label>
                <select className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                  {['Política SST', 'Reglamento', 'Compromiso', 'Acta', 'Plan', 'Inducción'].map(c => (
                    <option key={c} className="bg-[var(--bg-surface)]">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Fecha límite de firma</label>
                <input type="date" className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
              </div>
              <div>
                <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Subir documento (PDF)</label>
                <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center hover:border-amber-500/30 transition-all cursor-pointer">
                  <FileText size={24} className="mx-auto text-[var(--text-faint)] mb-2" />
                  <p className="text-[var(--text-faint)] text-xs">Arrastra o haz clic para subir</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowNewDoc(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] text-sm font-semibold transition-all">Cancelar</button>
              <button onClick={() => setShowNewDoc(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)] text-sm font-semibold transition-all">Crear Documento</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
