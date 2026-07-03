'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, Shield, KeyRound } from 'lucide-react'

export default function ConfiguracionPage() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.next.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres'); return }
    if (form.next !== form.confirm) { setError('Las contraseñas nuevas no coinciden'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al cambiar la contraseña'); setLoading(false); return }
      setSuccess(true)
      setForm({ current: '', next: '', confirm: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          Configuración
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Administra la seguridad de tu cuenta</p>
      </motion.div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 mb-5 text-sm font-medium flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
          <CheckCircle size={16} /> Contraseña actualizada exitosamente
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="terra-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <KeyRound size={15} style={{ color: 'var(--amber)' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Cambiar contraseña</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Actualiza tu contraseña de acceso</p>
          </div>
        </div>

        <div className="p-5">
          {error && (
            <div className="rounded-xl px-4 py-3 mb-5 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                Contraseña actual
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }} />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={form.current}
                  onChange={e => { setForm(f => ({ ...f, current: e.target.value })); setError('') }}
                  placeholder="Tu contraseña actual"
                  autoComplete="current-password"
                  required
                  className="terra-input pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }} />
                <input
                  type={showNext ? 'text' : 'password'}
                  value={form.next}
                  onChange={e => { setForm(f => ({ ...f, next: e.target.value })); setError('') }}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  className="terra-input pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowNext(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>
                  {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.next && form.next.length < 8 && (
                <p className="text-xs mt-1" style={{ color: '#f87171' }}>Mínimo 8 caracteres</p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }} />
                <input
                  type={showNext ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setError('') }}
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                  required
                  className="terra-input pl-9"
                  style={form.confirm && form.confirm !== form.next
                    ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                />
              </div>
              {form.confirm && form.confirm !== form.next && (
                <p className="text-xs mt-1" style={{ color: '#f87171' }}>Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading || !form.current || !form.next || !form.confirm}
                className="terra-btn px-6 py-2.5 disabled:opacity-40">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                  : <><Shield size={14} />Actualizar contraseña</>}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="terra-card overflow-hidden mt-4 p-5">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          <strong style={{ color: 'var(--text)' }}>Recomendaciones de seguridad:</strong> Usa una contraseña de al menos
          12 caracteres con mayúsculas, números y símbolos. No compartas tu contraseña con nadie y cámbiala
          periódicamente según la política de seguridad de tu empresa.
        </p>
      </motion.div>
    </div>
  )
}
