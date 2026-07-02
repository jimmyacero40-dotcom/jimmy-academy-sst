'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  PenTool, CheckCircle, Upload, RotateCcw, Save,
  Shield, FileText, Calendar, Loader2, AlertCircle, X
} from 'lucide-react'

export default function MySignaturePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'draw' | 'upload'>('draw')
  const [drawing, setDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [savedSignature, setSavedSignature] = useState<string | null>(null)
  const [consent, setConsent] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showConsent, setShowConsent] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [saved, setSaved] = useState(false)

  const [cedula, setCedula] = useState(user?.cedula || '')
  const [fullName, setFullName] = useState(user?.name || '')

  useEffect(() => {
    loadSignature()
    fetch('/api/signatures?profile=1')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          if (data.profile.cedula) setCedula(data.profile.cedula)
          if (data.profile.name) setFullName(data.profile.name)
        }
      })
      .catch(() => {})
  }, [])

  const loadSignature = async () => {
    try {
      const res = await fetch('/api/signatures')
      if (res.ok) {
        const data = await res.json()
        if (data.signature?.signature_data) {
          setSavedSignature(data.signature.signature_data)
        }
        if (data.consent) {
          setConsent(data.consent)
        }
      }
    } catch {}
    setLoading(false)
  }

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0) return
    const dpr = window.devicePixelRatio || 1
    // Set internal buffer to physical pixels. No ctx.scale — we work in raw
    // canvas pixels so getPos can always use canvas.width/rect.width directly.
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.5 * dpr
    ctx.strokeStyle = '#1A1207'
  }, [])

  useEffect(() => {
    if (mode !== 'draw') return
    const timer = setTimeout(initCanvas, 100)
    // Re-init when canvas container resizes (sidebar toggle, window resize)
    const canvas = canvasRef.current
    if (!canvas) return () => clearTimeout(timer)
    const ro = new ResizeObserver(() => initCanvas())
    ro.observe(canvas)
    return () => { clearTimeout(timer); ro.disconnect() }
  }, [mode, initCanvas])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    // canvas.width / rect.width = actual pixels-per-CSS-pixel ratio at this instant.
    // Using the live ratio (not a stored dpr) guarantees alignment after any resize.
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const endDraw = () => {
    setDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setSignatureData(ev.target!.result as string)
    }
    reader.readAsDataURL(file)
  }

  const prepareSignature = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) return
      setSignatureData(canvas.toDataURL('image/png'))
    }
    if (!signatureData && mode === 'upload') return
    setShowConsent(true)
  }

  const handleSave = async () => {
    const sigData = mode === 'draw' ? canvasRef.current?.toDataURL('image/png') : signatureData
    if (!sigData) return

    setSaving(true)
    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureData: sigData,
          fullName: fullName,
          cedula: cedula,
        })
      })
      if (res.ok) {
        setSavedSignature(sigData)
        setShowConsent(false)
        setSaved(true)
        await loadSignature()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {}
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Mi Firma Digital</h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Registra tu firma para certificados y documentos del SG-SST
        </p>
      </motion.div>

      {/* Saved success */}
      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 mb-5 text-sm font-medium flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
          <CheckCircle size={16} /> Firma guardada exitosamente con autorización de tratamiento de datos
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Current signature */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="terra-card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Firma Actual</h3>
          </div>
          <div className="p-5">
            {savedSignature ? (
              <div className="space-y-4">
                <div className="rounded-xl p-4 flex items-center justify-center" style={{ background: '#fff', border: '1px solid var(--border)', minHeight: 120 }}>
                  <img src={savedSignature} alt="Firma" className="max-h-24 object-contain" />
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#6EE7B7' }}>
                  <CheckCircle size={14} /> Firma registrada
                </div>
                {consent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                      <Shield size={12} /> Consentimiento firmado
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                      <Calendar size={12} /> {new Date(consent.created_at).toLocaleString('es-CO')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <PenTool size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-faint)' }} />
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Sin firma registrada</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Crea o sube tu firma abajo</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Create/update signature */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 terra-card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {savedSignature ? 'Actualizar Firma' : 'Crear Firma'}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setMode('draw')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={mode === 'draw'
                  ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <PenTool size={12} className="inline mr-1" /> Dibujar
              </button>
              <button onClick={() => setMode('upload')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={mode === 'upload'
                  ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <Upload size={12} className="inline mr-1" /> Subir imagen
              </button>
            </div>
          </div>

          <div className="p-5">
            {mode === 'draw' ? (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Dibuja tu firma con el mouse o el dedo en la pantalla táctil
                </p>
                <div className="rounded-xl overflow-hidden" style={{ border: '2px dashed var(--border-strong)', background: '#fff' }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full cursor-crosshair touch-none"
                    style={{ height: 180, display: 'block' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={clearCanvas}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                    <RotateCcw size={14} /> Limpiar
                  </button>
                  <button onClick={prepareSignature} disabled={!hasDrawn}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all terra-btn disabled:opacity-40">
                    <Save size={14} /> Guardar firma
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Sube una imagen PNG o JPG de tu firma (fondo blanco o transparente)
                </p>
                <label className="block rounded-xl p-8 text-center cursor-pointer transition-all"
                  style={{ border: '2px dashed var(--border-strong)', background: 'var(--bg-card)' }}>
                  {signatureData ? (
                    <div>
                      <img src={signatureData} alt="Firma" className="max-h-24 mx-auto mb-3 object-contain" />
                      <p className="text-xs" style={{ color: '#6EE7B7' }}>Imagen cargada — click para cambiar</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--text-faint)' }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>Click para seleccionar imagen</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>PNG, JPG — max 2MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileUpload} />
                </label>
                {signatureData && (
                  <button onClick={prepareSignature}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all terra-btn">
                    <Save size={14} /> Guardar firma
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Legal info card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="terra-card overflow-hidden mt-5">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Shield size={15} style={{ color: 'var(--amber)' }} /> Marco Legal
          </h3>
        </div>
        <div className="p-5 grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Ley 1581 de 2012', desc: 'Protección de Datos Personales — tu firma se almacena con autorización expresa' },
            { title: 'Ley 527 de 1999', desc: 'Validez jurídica de firmas electrónicas y documentos digitales en Colombia' },
            { title: 'Decreto 1072 de 2015', desc: 'SG-SST — evidencia documental para auditorías y cumplimiento normativo' },
          ].map(({ title, desc }) => (
            <div key={title} className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-bold mb-1" style={{ color: 'var(--amber)' }}>{title}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Consent modal */}
      {showConsent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>

            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <FileText size={15} style={{ color: 'var(--amber)' }} />
                </div>
                <h2 className="font-bold" style={{ color: 'var(--text)' }}>Autorización de Tratamiento de Datos</h2>
              </div>
              <button onClick={() => { setShowConsent(false); setConsentAccepted(false) }} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} style={{ color: 'var(--amber)' }} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    Para cumplir con la <strong style={{ color: 'var(--text)' }}>Ley 1581 de 2012</strong> de Protección de Datos Personales
                    y los requisitos de auditoría del <strong style={{ color: 'var(--text)' }}>SG-SST (Decreto 1072/2015)</strong>,
                    es necesario que autorices el uso de tu firma digital.
                  </p>
                </div>
              </div>

              <div className="rounded-xl p-4 text-xs leading-relaxed space-y-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)', maxHeight: 250, overflowY: 'auto' }}>

                <p style={{ color: 'var(--text)' }} className="font-bold">
                  AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES Y USO DE FIRMA DIGITAL
                </p>

                <p>
                  En cumplimiento de la <strong>Ley 1581 de 2012</strong> "Ley de Protección de Datos Personales",
                  el <strong>Decreto 1377 de 2013</strong>, y demás normatividad vigente en la República de Colombia,
                  yo <strong style={{ color: 'var(--text)' }}>{fullName}</strong>, identificado(a) con cédula de ciudadanía
                  No. <strong style={{ color: 'var(--text)' }}>{cedula}</strong>, de manera libre, voluntaria, previa,
                  expresa e informada, AUTORIZO a <strong>AGROVENTURE CAPITAL S.A.S.</strong> y su plataforma
                  Jimmy Academy SST para:
                </p>

                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Recolectar, almacenar, usar, circular y suprimir mis datos personales, incluyendo mi firma digital,
                    con el fin de gestionar el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)
                    conforme al <strong>Decreto 1072 de 2015</strong> y la <strong>Resolución 0312 de 2019</strong>.
                  </li>
                  <li>
                    Utilizar mi firma digital registrada en esta plataforma para la suscripción de certificados de
                    capacitación, actas, compromisos, políticas y demás documentos del SG-SST, con la misma validez
                    que mi firma manuscrita conforme a la <strong>Ley 527 de 1999</strong>.
                  </li>
                  <li>
                    Conservar registro de esta autorización como evidencia para auditorías internas y externas del SG-SST.
                  </li>
                </ol>

                <p>
                  Declaro que he sido informado(a) sobre mis derechos como titular de datos personales
                  (acceso, actualización, rectificación, supresión y revocatoria) y que puedo ejercerlos
                  contactando al responsable del tratamiento.
                </p>

                <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <p><strong>Titular:</strong> {fullName}</p>
                  <p><strong>Cédula:</strong> {cedula}</p>
                  <p><strong>Fecha:</strong> {new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
                </div>
              </div>

              {/* Name and cedula fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-dim)' }}>Nombre completo</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    className="terra-input text-sm" placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-dim)' }}>Cédula de ciudadanía</label>
                  <input value={cedula} onChange={e => setCedula(e.target.value.replace(/\D/g, ''))}
                    className="terra-input text-sm font-mono" placeholder="1234567890" inputMode="numeric" />
                </div>
              </div>

              {/* Preview signature */}
              <div className="rounded-xl p-3 flex items-center justify-center" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                <img src={mode === 'draw' ? canvasRef.current?.toDataURL('image/png') : signatureData!}
                  alt="Tu firma" className="max-h-16 object-contain" />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-amber-500" />
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  He leído y acepto la autorización para el tratamiento de mis datos personales y el uso de mi firma digital
                  conforme a la Ley 1581 de 2012 y la normativa del SG-SST.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => { setShowConsent(false); setConsentAccepted(false) }}
                  className="terra-btn-outline flex-1 py-2.5 justify-center">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!consentAccepted || saving || !fullName.trim() || !cedula.trim()}
                  className="terra-btn flex-1 py-2.5 justify-center disabled:opacity-40"
                  title={!fullName.trim() || !cedula.trim() ? 'Completa nombre y cédula' : ''}>
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                  ) : (
                    <><Shield size={14} /> Firmar y Autorizar</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
