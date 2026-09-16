'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Building2, CheckCircle, Sun, Moon } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', companyName: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'El nombre es requerido'
    if (!form.email) e.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido'
    if (!form.password) e.password = 'La contraseña es requerida'
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setLoading(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setApiError(data.error || 'Error al crear la cuenta')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  const t = dark ? {
    pageBg:      '#071009',
    leftBg:      '#0C1A0E',
    rightBg:     '#0F1F12',
    rightBorder: '#1A3020',
    eyebrow:     '#7EC800',
    h1:          '#EDF7ED',
    h1Accent:    '#7EC800',
    desc:        '#6B9475',
    label:       '#6B9475',
    inputBg:     '#071009',
    inputBorder: '#1A3020',
    inputText:   '#EDF7ED',
    iconColor:   '#2D4A35',
    noteColor:   '#2D4A35',
    toggleBg:    '#1A3020',
    toggleIcon:  '#6B9475',
    errorText:   '#fca5a5',
    errorBg:     'rgba(239,68,68,0.08)',
    errorBorder: 'rgba(239,68,68,0.25)',
  } : {
    pageBg:      '#F2F7EE',
    leftBg:      '#EBF3E4',
    rightBg:     '#FFFFFF',
    rightBorder: '#D4E8C8',
    eyebrow:     '#1A5C1A',
    h1:          '#0D2410',
    h1Accent:    '#1A5C1A',
    desc:        '#4D6E50',
    label:       '#4D6E50',
    inputBg:     '#F8FAF6',
    inputBorder: '#C8DEC0',
    inputText:   '#0D2410',
    iconColor:   '#A8C4A0',
    noteColor:   '#A8C4A0',
    toggleBg:    '#D4E8C8',
    toggleIcon:  '#5B8A5B',
    errorText:   '#dc2626',
    errorBg:     'rgba(239,68,68,0.06)',
    errorBorder: 'rgba(239,68,68,0.2)',
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.pageBg }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(126,200,0,0.12)', border: '1px solid rgba(126,200,0,0.3)' }}>
            <CheckCircle size={32} style={{ color: '#7EC800' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: t.h1 }}>¡Cuenta creada!</h2>
          <p className="text-sm" style={{ color: t.desc }}>Redirigiendo al inicio de sesión...</p>
        </motion.div>
      </div>
    )
  }

  const field = (
    id: keyof typeof form,
    label: string,
    type: string,
    placeholder: string,
    Icon: any,
    extra?: React.ReactNode
  ) => (
    <div>
      <label className="block text-[12px] font-medium mb-2" style={{ color: t.label }}>{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: t.iconColor }} />
        <input
          type={type}
          value={form[id]}
          onChange={ev => { setForm({ ...form, [id]: ev.target.value }); setApiError('') }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: `11px 14px 11px ${extra ? '36px' : '36px'}`,
            paddingRight: extra ? 42 : 14,
            borderRadius: 10,
            border: `1px solid ${errors[id] ? 'rgba(239,68,68,0.5)' : t.inputBorder}`,
            background: t.inputBg,
            color: t.inputText,
            fontSize: 14,
            outline: 'none',
          }}
        />
        {extra}
      </div>
      {errors[id] && <p className="text-xs mt-1.5 pl-1" style={{ color: t.errorText }}>{errors[id]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: t.pageBg, transition: 'background 0.3s' }}>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: t.leftBg }}>
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: dark ? 'rgba(45,138,45,0.10)' : 'rgba(26,92,26,0.08)', filter: 'blur(60px)' }} />

        <div className="relative z-10">
          <img src="/images/LOGO.png" alt="AgroSafe" className="h-16 w-auto object-contain" />
        </div>

        <motion.div className="relative z-10"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[11px] uppercase tracking-[0.12em] mb-5 font-bold" style={{ color: t.eyebrow }}>
            Plataforma Integral de Gestión del Personal
          </p>
          <h1 className="text-[36px] font-medium leading-[1.15] mb-5" style={{ color: t.h1 }}>
            Protege.<br />
            <span style={{ color: t.h1Accent }}>Gestiona.</span><br />
            Certifica.
          </h1>
          <p className="text-[13px] leading-[1.8] max-w-[300px]" style={{ color: t.desc }}>
            Crea tu cuenta y accede a la plataforma de gestión de personal más completa del sector agroindustrial.
          </p>
        </motion.div>

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: t.desc }}>
            La cultura que nos protege
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 lg:w-[460px] lg:flex-none flex flex-col relative"
        style={{ background: t.rightBg, borderLeft: `1px solid ${t.rightBorder}` }}>

        <div className="flex justify-end p-5">
          <button onClick={() => setDark(!dark)}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: t.toggleBg, color: t.toggleIcon }}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-10 pb-8">
          <motion.div className="w-full max-w-[360px]"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/images/LOGO.png" alt="AgroSafe" className="h-14 w-auto object-contain" />
            </div>

            <div className="mb-7">
              <div className="text-[11px] uppercase tracking-[0.12em] mb-3 font-bold"
                style={{ color: dark ? '#7EC800' : '#1A5C1A' }}>
                Nueva cuenta
              </div>
              <h2 className="text-[24px] font-medium mb-1" style={{ color: t.h1 }}>Crear cuenta</h2>
              <p className="text-[13px]" style={{ color: t.desc }}>
                Completa los datos para registrarte en AgroSafe.
              </p>
            </div>

            {apiError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg px-3 py-3 mb-5 text-sm"
                style={{ background: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText }}>
                <Lock size={13} className="flex-shrink-0" />
                {apiError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {field('name', 'Nombre completo', 'text', 'Tu nombre completo', User)}
              {field('email', 'Correo electrónico', 'email', 'tu@empresa.com', Mail)}
              {field('companyName', 'Empresa (opcional)', 'text', 'Nombre de tu empresa', Building2)}
              {field(
                'password', 'Contraseña', showPass ? 'text' : 'password', '••••••••', Lock,
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: t.iconColor }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg,#2D8A2D,#7EC800)',
                  color: '#fff',
                  border: 'none',
                  padding: '13px 20px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  marginTop: 8,
                }}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>Crear cuenta <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <p className="text-[11px] text-center mt-6" style={{ color: t.noteColor }}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold hover:underline underline-offset-2"
                style={{ color: dark ? '#7EC800' : '#1A5C1A' }}>
                Iniciar sesión
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
