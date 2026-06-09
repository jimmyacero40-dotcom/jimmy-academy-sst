'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState('')
  const [showHint, setShowHint] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido'
    if (!form.password) e.password = 'La contraseña es requerida'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setAuthError('')
    setLoading(true)
    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setAuthError('Correo o contraseña incorrectos')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="dark min-h-screen bg-[#070C1A] flex relative overflow-hidden">

      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-[#070C1A] to-emerald-900/20" />
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #059669 0%, transparent 70%)', filter: 'blur(60px)' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-white font-extrabold text-lg leading-none">Jimmy Academy</div>
              <div className="text-emerald-400 text-xs font-semibold">SST Platform</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Gestiona la seguridad<br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                de tu empresa
              </span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-sm">
              La plataforma #1 en Colombia para SG-SST. Capacitaciones, certificados y cumplimiento normativo en un solo lugar.
            </p>

            <div className="space-y-3">
              {[
                { icon: '🛡️', text: 'Cumplimiento Decreto 1072 de 2015' },
                { icon: '📋', text: 'Resolución 0312 de 2019 integrada' },
                { icon: '🤖', text: 'Asistente IA especializado en SST' },
                { icon: '📱', text: 'Acceso desde cualquier dispositivo' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-slate-300 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['CM', 'ML', 'DR', 'FT'].map((init, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#070C1A] bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                {init}
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm">
            <span className="text-white font-semibold">+1,200 empresas</span> ya confían en nosotros
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (login form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
            style={{ filter: 'blur(80px)', background: 'radial-gradient(circle, #1B4FD8, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-10"
            style={{ filter: 'blur(70px)', background: 'radial-gradient(circle, #10B981, transparent 70%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center">
              <Shield size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-white font-extrabold text-base">Jimmy Academy</div>
              <div className="text-emerald-400 text-xs font-semibold">SST Platform</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-white mb-1.5">Iniciar sesión</h1>
            <p className="text-slate-500 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          {authError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm font-medium flex items-center gap-2">
              <Lock size={14} /> {authError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setAuthError('') }}
                  placeholder="tu@empresa.com"
                  autoComplete="email"
                  className={`w-full bg-white/[0.04] border rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none transition-all ${
                    errors.email ? 'border-red-500/50' : 'border-white/[0.08] focus:border-blue-500/60 focus:bg-white/[0.07]'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Contraseña
                </label>
                <Link href="/forgot-password"
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium no-underline transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setAuthError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full bg-white/[0.04] border rounded-xl pl-10 pr-11 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none transition-all ${
                    errors.password ? 'border-red-500/50' : 'border-white/[0.08] focus:border-blue-500/60 focus:bg-white/[0.07]'
                  }`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>Ingresar al sistema <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Demo access — collapsed by default */}
          <div className="mt-6">
            <button onClick={() => setShowHint(!showHint)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/[0.06] text-slate-500 hover:text-slate-400 text-xs transition-all hover:bg-white/[0.02]">
              <span>Acceso de demostración</span>
              <ChevronDown size={13} className={`transition-transform ${showHint ? 'rotate-180' : ''}`} />
            </button>
            {showHint && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
                {[
                  { role: 'Admin', email: 'admin@jimmyacademy.com', pass: 'admin123' },
                  { role: 'Coordinadora', email: 'diana@jimmyacademy.com', pass: 'sst2026' },
                ].map(({ role, email, pass }) => (
                  <button key={role} onClick={() => { setForm({ email, password: pass }); setAuthError(''); setShowHint(false) }}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all group">
                    <div>
                      <span className="text-slate-300 text-xs font-medium">{role}</span>
                      <span className="text-slate-600 text-xs ml-2">{email}</span>
                    </div>
                    <span className="text-emerald-500/70 font-mono text-xs">{pass}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold no-underline transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
