'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Ingresa tu correo electrónico'); return }
    setError('')
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('Error al enviar el correo. Intenta de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f172a' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#3b82f6' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="text-[15px] font-medium text-white">CAMPUS SST</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: '#475569' }}>Seguridad y Salud en el Trabajo</div>
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#0d1629', border: '1px solid #1e293b' }}>
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={28} style={{ color: '#34d399' }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Revisa tu correo</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#64748b' }}>
                Si existe una cuenta con <strong className="text-white">{email}</strong>, recibirás
                un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-xs" style={{ color: '#475569' }}>¿No llegó? Revisa la carpeta de spam.</p>
            </motion.div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="text-xl font-semibold text-white mb-2">¿Olvidaste tu contraseña?</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
                </p>
              </div>

              {error && (
                <div className="rounded-lg px-3 py-3 mb-5 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#64748b' }}>Correo electrónico</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#334155' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="tu@empresa.com"
                      autoComplete="email"
                      autoFocus
                      style={{
                        width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10,
                        border: '1px solid #1e293b', background: '#0a0f1e', color: '#f8fafc',
                        fontSize: 14, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '13px 20px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
                    : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid #1e293b' }}>
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm" style={{ color: '#475569' }}>
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
