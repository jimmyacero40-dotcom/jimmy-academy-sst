'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'success'>('checking')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.ok ? setStatus('valid') : setStatus('invalid'))
      .catch(() => setStatus('invalid'))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al cambiar la contraseña'); setLoading(false); return }
      setStatus('success')
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
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

          {status === 'checking' && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm" style={{ color: '#64748b' }}>Verificando enlace...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={28} style={{ color: '#f87171' }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Enlace inválido o expirado</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#64748b' }}>
                Este enlace ya fue usado o expiró. Los enlaces son válidos por 1 hora.
              </p>
              <Link href="/forgot-password"
                className="inline-block rounded-xl text-sm font-semibold px-5 py-3"
                style={{ background: '#3b82f6', color: '#fff' }}>
                Solicitar nuevo enlace
              </Link>
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={28} style={{ color: '#34d399' }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Contraseña actualizada</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Tu contraseña fue cambiada exitosamente. Redirigiendo al inicio de sesión...
              </p>
            </motion.div>
          )}

          {status === 'valid' && (
            <>
              <div className="mb-7">
                <h2 className="text-xl font-semibold text-white mb-2">Nueva contraseña</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  Elige una contraseña segura de al menos 8 caracteres.
                </p>
              </div>

              {error && (
                <div className="rounded-lg px-3 py-3 mb-5 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#64748b' }}>Nueva contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#334155' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError('') }}
                      placeholder="Mínimo 8 caracteres"
                      autoFocus
                      style={{
                        width: '100%', padding: '11px 42px 11px 36px', borderRadius: 10,
                        border: '1px solid #1e293b', background: '#0a0f1e', color: '#f8fafc',
                        fontSize: 14, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#334155' }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#64748b' }}>Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#334155' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setError('') }}
                      placeholder="Repite la contraseña"
                      style={{
                        width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10,
                        border: `1px solid ${form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.5)' : '#1e293b'}`,
                        background: '#0a0f1e', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold mt-2"
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '13px 20px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                    : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}

          {status !== 'success' && (
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid #1e293b' }}>
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm" style={{ color: '#475569' }}>
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
