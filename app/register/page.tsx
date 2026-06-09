'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'El nombre es requerido'
    if (!form.email) e.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido'
    if (!form.company.trim()) e.company = 'El nombre de la empresa es requerido'
    if (!form.password) e.password = 'La contraseña es requerida'
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (done) {
    return (
      <div className="dark min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-white text-xl font-black mb-2">¡Registro exitoso!</h2>
          <p className="text-slate-400 text-sm">Redirigiendo al login...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="dark min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4 py-8 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ filter: 'blur(80px)', background: 'radial-gradient(circle, #1B4FD8, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ filter: 'blur(70px)', background: 'radial-gradient(circle, #10B981, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-md">

        <div className="bg-[#0D1629] border border-white/10 rounded-2xl p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(27,79,216,0.4)]">
              <Shield size={26} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-white">Crea tu cuenta</h1>
            <p className="text-slate-400 text-sm mt-1.5">Empieza gratis con Jimmy Academy SST</p>
          </div>

          {/* Benefits */}
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5 mb-6">
            <p className="text-emerald-300 text-xs font-semibold mb-2">✓ Plan gratuito incluye:</p>
            <div className="space-y-1 text-slate-400 text-xs">
              <p>• Hasta 10 empleados</p>
              <p>• Todos los módulos SST</p>
              <p>• Certificados digitales ilimitados</p>
              <p>• Acceso desde celular y PC</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {[
              { key: 'name', label: 'Nombre completo', placeholder: 'Juan Pérez', type: 'text' },
              { key: 'email', label: 'Correo electrónico', placeholder: 'juan@empresa.co', type: 'email' },
              { key: 'company', label: 'Nombre de la empresa', placeholder: 'Mi Empresa S.A.S', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none transition-all ${
                    errors[key] ? 'border-red-400/60' : 'border-white/10 focus:border-blue-500/60 focus:bg-white/8'
                  }`}
                />
                {errors[key] && <p className="text-red-400 text-xs mt-1.5">{errors[key]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-11 text-white placeholder:text-slate-500 text-sm focus:outline-none transition-all ${
                    errors.password ? 'border-red-400/60' : 'border-white/10 focus:border-blue-500/60 focus:bg-white/8'
                  }`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ boxShadow: '0 0 30px rgba(16,185,129,0.25)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>Crear cuenta gratis <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold no-underline transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
