'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail, Sun, Moon, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState('')

  // Persist theme preference
  useEffect(() => {
    const saved = localStorage.getItem('campus-sst-theme')
    if (saved) setDark(saved === 'dark')
  }, [])
  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('campus-sst-theme', next ? 'dark' : 'light')
  }

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
      document.cookie = 'x-active-company=; path=/; max-age=0'
      router.push('/dashboard')
      router.refresh()
    }
  }

  // ── AgroSafe Theme tokens ─────────────────────────────────────
  const t = dark ? {
    pageBg:       '#071009',
    leftBg:       '#0C1A0E',
    rightBg:      '#0F1F12',
    rightBorder:  '#1A3020',
    orbColor:     'rgba(45,138,45,0.10)',
    logoName:     '#EDF7ED',
    logoSub:      '#4D7A55',
    eyebrow:      '#7EC800',
    h1:           '#EDF7ED',
    h1Accent:     '#7EC800',
    desc:         '#6B9475',
    pillText:     '#4D7A55',
    formTitle:    '#EDF7ED',
    formSub:      '#4D7A55',
    label:        '#6B9475',
    inputBg:      '#071009',
    inputBorder:  '#1A3020',
    inputText:    '#EDF7ED',
    inputPh:      '#2D4A35',
    iconColor:    '#2D4A35',
    badgeBg:      'rgba(126,200,0,0.08)',
    badgeColor:   '#7EC800',
    badgeBorder:  'rgba(126,200,0,0.2)',
    noteColor:    '#2D4A35',
    toggleBg:     '#1A3020',
    toggleIcon:   '#6B9475',
    errorBg:      'rgba(239,68,68,0.08)',
    errorBorder:  'rgba(239,68,68,0.25)',
    errorText:    '#fca5a5',
  } : {
    pageBg:       '#F2F7EE',
    leftBg:       '#EBF3E4',
    rightBg:      '#FFFFFF',
    rightBorder:  '#D4E8C8',
    orbColor:     'rgba(26,92,26,0.08)',
    logoName:     '#0D2410',
    logoSub:      '#5B8A5B',
    eyebrow:      '#1A5C1A',
    h1:           '#0D2410',
    h1Accent:     '#1A5C1A',
    desc:         '#4D6E50',
    pillText:     '#5B8A5B',
    formTitle:    '#0D2410',
    formSub:      '#5B8A5B',
    label:        '#4D6E50',
    inputBg:      '#F8FAF6',
    inputBorder:  '#C8DEC0',
    inputText:    '#0D2410',
    inputPh:      '#A8C4A0',
    iconColor:    '#A8C4A0',
    badgeBg:      'rgba(26,92,26,0.07)',
    badgeColor:   '#1A5C1A',
    badgeBorder:  'rgba(26,92,26,0.2)',
    noteColor:    '#A8C4A0',
    toggleBg:     '#D4E8C8',
    toggleIcon:   '#5B8A5B',
    errorBg:      'rgba(239,68,68,0.06)',
    errorBorder:  'rgba(239,68,68,0.2)',
    errorText:    '#dc2626',
  }

  const BADGES = ['Decreto 1072', 'Res. 0312', 'Datos seguros']
  const PILLS  = ['Gestión del Personal', 'SSTudio Formación', 'Certificados']

  return (
    <div className="min-h-screen flex" style={{ background: t.pageBg, transition: 'background 0.3s' }}>

      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: t.leftBg, transition: 'background 0.3s' }}>

        {/* Fondo decorativo */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: t.orbColor, filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: dark ? 'rgba(126,200,0,0.05)' : 'rgba(26,92,26,0.06)', filter: 'blur(50px)' }} />

        {/* Logo AgroSafe */}
        <div className="relative z-10">
          <img src="/images/LOGO.png" alt="AgroSafe" className="h-16 w-auto object-contain" />
        </div>

        {/* Hero */}
        <motion.div className="relative z-10"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <p className="text-[11px] uppercase tracking-[0.12em] mb-5 font-bold" style={{ color: t.eyebrow }}>
            Plataforma Integral de Gestión del Personal
          </p>
          <h1 className="text-[36px] font-medium leading-[1.15] mb-5" style={{ color: t.h1 }}>
            Protege.<br />
            <span style={{ color: t.h1Accent }}>Gestiona.</span><br />
            Certifica.
          </h1>
          <p className="text-[13px] leading-[1.8] mb-8 max-w-[300px]" style={{ color: t.desc }}>
            La cultura que nos protege. Gestión del personal, formación SST y cumplimiento normativo
            desde un solo lugar.
          </p>
          <div className="flex flex-col gap-3">
            {PILLS.map(p => (
              <div key={p} className="flex items-center gap-2.5" style={{ color: t.pillText, fontSize: 12 }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#2D8A2D,#7EC800)' }} />
                <span className="font-medium">{p}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: t.pillText }}>
            La cultura que nos protege
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────── */}
      <div className="flex-1 lg:w-[420px] lg:flex-none flex flex-col relative"
        style={{ background: t.rightBg, borderLeft: `1px solid ${t.rightBorder}`, transition: 'background 0.3s, border-color 0.3s' }}>

        {/* Theme toggle */}
        <div className="flex justify-end p-5">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: t.toggleBg, color: t.toggleIcon }}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center px-10 pb-8">
          <motion.div className="w-full max-w-[340px]"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-10">
              <img src="/images/LOGO.png" alt="AgroSafe" className="h-14 w-auto object-contain" />
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="text-[11px] uppercase tracking-[0.12em] mb-3 font-bold"
                style={{ color: dark ? '#7EC800' : '#1A5C1A' }}>
                Acceso seguro
              </div>
              <h2 className="text-[24px] font-medium mb-2" style={{ color: t.formTitle }}>Bienvenido</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: t.formSub }}>
                Ingresa tus credenciales para acceder a la plataforma AgroSafe.
              </p>
            </div>

            {/* Auth error */}
            {authError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg px-3 py-3 mb-6 text-sm"
                style={{ background: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText }}>
                <Lock size={13} className="flex-shrink-0" />
                {authError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: t.label }}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: t.iconColor }} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => { setForm({ ...form, email: e.target.value }); setAuthError('') }}
                    placeholder="tu@empresa.com"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 36px',
                      borderRadius: 10,
                      border: `1px solid ${errors.email ? 'rgba(239,68,68,0.5)' : t.inputBorder}`,
                      background: t.inputBg,
                      color: t.inputText,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                </div>
                {errors.email && <p className="text-xs mt-1.5 pl-1" style={{ color: t.errorText }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: t.label }}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: t.iconColor }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => { setForm({ ...form, password: e.target.value }); setAuthError('') }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '11px 42px 11px 36px',
                      borderRadius: 10,
                      border: `1px solid ${errors.password ? 'rgba(239,68,68,0.5)' : t.inputBorder}`,
                      background: t.inputBg,
                      color: t.inputText,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: t.iconColor }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1.5 pl-1" style={{ color: t.errorText }}>{errors.password}</p>}
              </div>

              {/* Forgot password */}
              <div className="flex justify-end -mt-2">
                <Link href="/forgot-password" className="text-[12px] transition-colors"
                  style={{ color: '#3b82f6' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: '13px 20px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  marginTop: 8,
                }}
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

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: t.inputBorder }} />
              <span className="text-[11px]" style={{ color: t.noteColor }}>cumplimiento normativo</span>
              <div className="flex-1 h-px" style={{ background: t.inputBorder }} />
            </div>

            {/* Compliance badges */}
            <div className="flex gap-2 flex-wrap">
              {BADGES.map(b => (
                <div key={b} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg"
                  style={{ background: t.badgeBg, color: t.badgeColor, border: `1px solid ${t.badgeBorder}` }}>
                  <CheckCircle size={11} />
                  {b}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-center mt-6 leading-relaxed" style={{ color: t.noteColor }}>
              ¿No tienes acceso? Contacta al administrador SST de tu empresa.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
