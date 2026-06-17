'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState('')

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
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── LEFT PANEL (desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), transparent 50%, rgba(239,68,68,0.05))' }} />
        <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-100px] right-[-60px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(245,158,11,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.3) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--grad-main)', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}>
              <Shield size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-extrabold text-lg leading-none" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Jimmy Academy</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>Plataforma SG-SST</div>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h2 className="text-4xl leading-tight mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--text)' }}>
              Gestiona la seguridad<br />
              <span style={{ background: 'var(--grad-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                de tu empresa
              </span>
            </h2>
            <p className="text-base leading-relaxed mb-8 max-w-sm" style={{ color: 'var(--text-dim)' }}>
              La plataforma #1 en Colombia para SG-SST. Capacitaciones, certificados y cumplimiento normativo en un solo lugar.
            </p>

            <div className="space-y-3">
              {[
                { icon: '🛡', text: 'Cumplimiento Decreto 1072 de 2015' },
                { icon: '📋', text: 'Resolucion 0312 de 2019 integrada' },
                { icon: '🤖', text: 'Asistente IA especializado en SST' },
                { icon: '📱', text: 'Acceso desde cualquier dispositivo' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['CM', 'ML', 'DR', 'FT'].map((init, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold"
                style={{ borderColor: 'var(--bg)', background: 'var(--grad-main)' }}>
                {init}
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>+1,200 empresas</span> ya confian en nosotros
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (login form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
            style={{ filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(245,158,11,0.5), transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-10"
            style={{ filter: 'blur(70px)', background: 'radial-gradient(circle, rgba(239,68,68,0.5), transparent 70%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--grad-main)' }}>
              <Shield size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-extrabold text-base" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Jimmy Academy</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>Plataforma SG-SST</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black mb-1.5" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Iniciar sesion</h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Ingresa tus credenciales para continuar</p>
          </div>

          {authError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-4 py-3 mb-5 text-sm font-medium flex items-center gap-2"
              style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
              <Lock size={14} /> {authError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-dim)' }}>
                Correo electronico
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setAuthError('') }}
                  placeholder="tu@empresa.com"
                  autoComplete="email"
                  className="terra-input pl-10"
                  style={errors.email ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                />
              </div>
              {errors.email && <p className="text-xs mt-1.5 pl-1" style={{ color: '#FCA5A5' }}>{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                  Contrasena
                </label>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setAuthError('') }}
                  placeholder="--------"
                  autoComplete="current-password"
                  className="terra-input pl-10 pr-11"
                  style={errors.password ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-faint)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1.5 pl-1" style={{ color: '#FCA5A5' }}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="terra-btn w-full justify-center py-3.5 text-sm"
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

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Contacta al administrador SST si no tienes credenciales
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
