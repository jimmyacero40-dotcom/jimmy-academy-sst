'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail, Sun, Moon, CheckCircle } from 'lucide-react'

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

  // ── Theme tokens ──────────────────────────────────────────────
  const t = dark ? {
    pageBg:       '#0f172a',
    leftBg:       '#0f172a',
    rightBg:      '#0d1f3c',
    rightBorder:  '#1e293b',
    orbColor:     'rgba(59,130,246,0.08)',
    logoName:     '#f8fafc',
    logoSub:      '#475569',
    eyebrow:      '#3b82f6',
    h1:           '#f8fafc',
    h1Accent:     '#3b82f6',
    desc:         '#64748b',
    pillText:     '#475569',
    formTitle:    '#f8fafc',
    formSub:      '#475569',
    label:        '#64748b',
    inputBg:      '#0a0f1e',
    inputBorder:  '#1e293b',
    inputText:    '#f8fafc',
    inputPh:      '#334155',
    iconColor:    '#334155',
    badgeBg:      'rgba(16,185,129,0.08)',
    badgeColor:   '#34d399',
    badgeBorder:  'rgba(16,185,129,0.2)',
    noteColor:    '#334155',
    toggleBg:     '#1e293b',
    toggleIcon:   '#64748b',
    errorBg:      'rgba(239,68,68,0.08)',
    errorBorder:  'rgba(239,68,68,0.25)',
    errorText:    '#fca5a5',
  } : {
    pageBg:       '#f1f5f9',
    leftBg:       '#eff6ff',
    rightBg:      '#ffffff',
    rightBorder:  '#e2e8f0',
    orbColor:     'rgba(59,130,246,0.12)',
    logoName:     '#0f172a',
    logoSub:      '#94a3b8',
    eyebrow:      '#3b82f6',
    h1:           '#0f172a',
    h1Accent:     '#2563eb',
    desc:         '#64748b',
    pillText:     '#94a3b8',
    formTitle:    '#0f172a',
    formSub:      '#94a3b8',
    label:        '#64748b',
    inputBg:      '#f8fafc',
    inputBorder:  '#e2e8f0',
    inputText:    '#0f172a',
    inputPh:      '#cbd5e1',
    iconColor:    '#cbd5e1',
    badgeBg:      'rgba(16,185,129,0.07)',
    badgeColor:   '#059669',
    badgeBorder:  'rgba(16,185,129,0.2)',
    noteColor:    '#cbd5e1',
    toggleBg:     '#e2e8f0',
    toggleIcon:   '#94a3b8',
    errorBg:      'rgba(239,68,68,0.06)',
    errorBorder:  'rgba(239,68,68,0.2)',
    errorText:    '#dc2626',
  }

  const BADGES = ['Decreto 1072', 'Res. 0312', 'Datos seguros']
  const PILLS  = ['Cursos SST', 'Evaluaciones', 'Certificados']

  return (
    <div className="min-h-screen flex" style={{ background: t.pageBg, transition: 'background 0.3s' }}>

      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: t.leftBg, transition: 'background 0.3s' }}>

        {/* Orb */}
        <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: t.orbColor }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#3b82f6' }}>
            <Shield size={20} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[15px] font-medium tracking-wide" style={{ color: t.logoName }}>CAMPUS SST</div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: t.logoSub }}>
              Seguridad y Salud en el Trabajo
            </div>
          </div>
        </div>

        {/* Hero */}
        <motion.div className="relative z-10"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <p className="text-[11px] uppercase tracking-[0.1em] mb-5" style={{ color: t.eyebrow }}>
            Plataforma integral de formación
          </p>
          <h1 className="text-[32px] font-medium leading-[1.2] mb-5" style={{ color: t.h1 }}>
            Aprende.<br />
            <span style={{ color: t.h1Accent }}>Evalúa.</span><br />
            Certifica.
          </h1>
          <p className="text-[13px] leading-[1.75] mb-8 max-w-[300px]" style={{ color: t.desc }}>
            Accede a tus cursos, completa tus evaluaciones y obtén tus certificados desde un solo lugar.
            Tu proceso de formación comienza aquí.
          </p>
          <div className="flex gap-5 flex-wrap">
            {PILLS.map(p => (
              <div key={p} className="flex items-center gap-2" style={{ color: t.pillText, fontSize: 12 }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#3b82f6' }} />
                {p}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom spacer — intentionally empty, stats removed */}
        <div />
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────── */}
      <div className="flex-1 lg:w-[400px] lg:flex-none flex flex-col relative"
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
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#3b82f6' }}>
                <Shield size={18} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-medium tracking-wide" style={{ color: t.logoName }}>CAMPUS SST</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: t.logoSub }}>SG-SST Colombia</div>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="text-[11px] uppercase tracking-[0.1em] mb-3" style={{ color: '#3b82f6' }}>
                Acceso seguro
              </div>
              <h2 className="text-[24px] font-medium mb-2" style={{ color: t.formTitle }}>Bienvenido</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: t.formSub }}>
                Ingresa tus credenciales para acceder a tu plataforma de formación SST.
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
