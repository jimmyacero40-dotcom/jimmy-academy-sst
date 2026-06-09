'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError('Ingresa un correo válido'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="dark min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ filter: 'blur(80px)', background: 'radial-gradient(circle, #1B4FD8, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-md">

        <div className="bg-[#0D1629] border border-white/10 rounded-2xl p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Shield size={26} className="text-white" strokeWidth={2.5} />
            </div>
            {sent ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <h1 className="text-xl font-black text-white mb-2">Correo enviado</h1>
                <p className="text-slate-400 text-sm">Revisa tu bandeja de entrada en <span className="text-white font-semibold">{email}</span> y sigue las instrucciones.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-black text-white">Recuperar contraseña</h1>
                <p className="text-slate-400 text-sm mt-1.5">Te enviaremos un enlace para restablecer tu contraseña</p>
              </>
            )}
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="tu@empresa.co"
                    className={`w-full bg-white/5 border rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none transition-all ${
                      error ? 'border-red-400/60' : 'border-white/10 focus:border-blue-500/60 focus:bg-white/8'
                    }`}
                  />
                </div>
                {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 0 30px rgba(37,99,235,0.35)' }}>
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                ) : (
                  <>Enviar enlace <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold no-underline transition-colors">
              <ArrowLeft size={14} /> Volver al login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
