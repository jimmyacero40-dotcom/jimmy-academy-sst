'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, ArrowRight, Lock, Mail, CheckCircle,
  Users, GraduationCap, DoorOpen, Award,
} from 'lucide-react'
import Link from 'next/link'

// Identidad AgroSafe: el mismo navy del panel, para que el acceso ya se sienta
// parte de la plataforma y no una página aparte.
const C = {
  navy:        '#0B1829',
  navyDeep:    '#081221',
  text:        '#E8EEF7',
  textDim:     '#9AAAC0',
  textFaint:   '#62748C',
  line:        'rgba(255,255,255,0.08)',
  lime:        '#8CCB1E',
  limeSoft:    'rgba(140,203,30,0.12)',
  orange:      '#F39A1E',
  inputBg:     'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.12)',
  error:       '#FCA5A5',
}

// Sobre navy el verde oscuro de "AGRO" y del lema se pierde. Un contorno claro de
// un píxel lo devuelve a la vista sin encerrarlo en una tarjeta.
const CONTORNO_AGROSAFE: React.CSSProperties = {
  filter:
    'drop-shadow(0 0 1px rgba(255,255,255,0.95)) drop-shadow(0 0 1px rgba(255,255,255,0.95)) drop-shadow(0 6px 18px rgba(0,0,0,0.35))',
}
// AgroVenture ya contrasta con el navy; el contorno solo le emborronaba las letras.
const SOMBRA_AGROVENTURE: React.CSSProperties = { filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }

const MODULOS = [
  { icon: Users,         titulo: 'Gestión del personal',       texto: 'Hojas de vida, áreas, grupos y retiros.' },
  { icon: GraduationCap, titulo: 'SSTudio y formación SST',    texto: 'Capacitaciones, inscripciones y asistencia.' },
  { icon: DoorOpen,      titulo: 'Control operativo',          texto: 'Ingresos y salidas por portería y sede.' },
  { icon: Award,         titulo: 'Certificados y trazabilidad', texto: 'Certificados, firmas y reportes.' },
]

const NORMAS = ['Decreto 1072', 'Res. 0312', 'Datos protegidos']

function Logos({ grande }: { grande?: boolean }) {
  return (
    <div className="flex items-center" style={{ gap: grande ? 32 : 18 }}>
      <img src="/images/agrosafe-logo.png" alt="AgroSafe"
        className="w-auto object-contain"
        style={{ height: grande ? 'clamp(104px, 11vh, 132px)' : 64, ...CONTORNO_AGROSAFE }} />
      <div className="self-stretch w-px" style={{ background: 'rgba(255,255,255,0.14)', margin: '10px 0' }} />
      {/* AgroVenture es el contexto corporativo: más pequeño que la marca de la plataforma. */}
      <img src="/images/agroventure-logo.png" alt="AgroVenture Capital"
        className="w-auto object-contain"
        style={{ height: grande ? 'clamp(58px, 6vh, 72px)' : 38, ...SOMBRA_AGROVENTURE }} />
    </div>
  )
}

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
      document.cookie = 'x-active-company=; path=/; max-age=0'
      router.push('/dashboard')
      router.refresh()
    }
  }

  const inputStyle = (conError: boolean): React.CSSProperties => ({
    width: '100%',
    borderRadius: 10,
    border: `1px solid ${conError ? 'rgba(239,68,68,0.55)' : C.inputBorder}`,
    background: C.inputBg,
    color: C.text,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
  })

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: C.navy }}>
      {/* Atmósfera: luces tenues con los colores del logo, sin cortar la pantalla en dos. */}
      <div className="absolute pointer-events-none" aria-hidden
        style={{ top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(140,203,30,0.10), transparent 60%)' }} />
      <div className="absolute pointer-events-none" aria-hidden
        style={{ bottom: '-25%', right: '-10%', width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(243,154,30,0.07), transparent 60%)' }} />

      <div className="relative z-10 min-h-screen flex items-center">
        <div className="w-full mx-auto px-6 sm:px-10 lg:px-16 py-10 lg:py-14"
          style={{ maxWidth: 1320 }}>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-12 xl:gap-24 items-center">

            {/* ── IDENTIDAD + PROPUESTA DE VALOR ───────────────────── */}
            <div className="hidden lg:block">
              <Logos grande />

              <p className="mt-14 text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: C.lime }}>
                Plataforma Integral de Gestión del Personal
              </p>
              <h1 className="mt-4 font-semibold leading-[1.15]"
                style={{ color: C.text, fontSize: 'clamp(30px, 2.6vw, 48px)', maxWidth: 700, textWrap: 'balance' as any }}>
                Gestiona tu personal, su formación y su seguridad desde un solo lugar.
              </h1>
              <p className="mt-5 text-[15px] leading-[1.7]" style={{ color: C.textDim, maxWidth: 580 }}>
                AgroSafe reúne la administración del personal, la formación en Seguridad y Salud en el
                Trabajo y el control de acceso a las sedes, con la trazabilidad que exige el SG-SST.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6" style={{ maxWidth: 620 }}>
                {MODULOS.map(({ icon: Icon, titulo, texto }) => (
                  <div key={titulo} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: C.limeSoft, color: C.lime }}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: C.text }}>{titulo}</div>
                      <div className="text-[12.5px] mt-0.5 leading-snug" style={{ color: C.textFaint }}>{texto}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FORMULARIO ───────────────────────────────────────── */}
            <div className="w-full mx-auto" style={{ maxWidth: 440 }}>

              {/* En móvil la identidad va encima del formulario. */}
              <div className="lg:hidden flex flex-col items-center text-center mb-8">
                <Logos />
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C.lime }}>
                  Plataforma Integral de Gestión del Personal
                </p>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.textDim }}>
                  Personal, formación SST y control de acceso en un solo lugar.
                </p>
              </div>

              <div className="rounded-2xl p-7 sm:p-9"
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: `1px solid ${C.line}`,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(6px)',
                }}>
                <div className="mb-7">
                  <div className="text-[11px] uppercase tracking-[0.14em] mb-2 font-bold" style={{ color: C.lime }}>
                    Acceso seguro
                  </div>
                  <h2 className="text-[24px] font-semibold mb-1.5" style={{ color: C.text }}>Bienvenido</h2>
                  <p className="text-[13px] leading-relaxed" style={{ color: C.textDim }}>
                    Ingresa tus credenciales para acceder a la plataforma.
                  </p>
                </div>

                {authError && (
                  <div role="alert"
                    className="flex items-center gap-2 rounded-lg px-3 py-3 mb-5 text-sm"
                    style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)', color: C.error }}>
                    <Lock size={13} className="flex-shrink-0" />
                    {authError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label className="block text-[12px] font-medium mb-2" style={{ color: C.textDim }}>
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: C.textFaint }} />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => { setForm({ ...form, email: e.target.value }); setAuthError('') }}
                        placeholder="tu@empresa.com"
                        autoComplete="email"
                        className="placeholder:text-[#4E5F76] focus:border-[#8CCB1E]"
                        style={{ ...inputStyle(!!errors.email), padding: '12px 14px 12px 36px' }}
                      />
                    </div>
                    {errors.email && <p className="text-xs mt-1.5 pl-1" style={{ color: C.error }}>{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-2" style={{ color: C.textDim }}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: C.textFaint }} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => { setForm({ ...form, password: e.target.value }); setAuthError('') }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="placeholder:text-[#4E5F76] focus:border-[#8CCB1E]"
                        style={{ ...inputStyle(!!errors.password), padding: '12px 42px 12px 36px' }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: C.textFaint }}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs mt-1.5 pl-1" style={{ color: C.error }}>{errors.password}</p>}
                  </div>

                  <div className="flex justify-end -mt-2">
                    <Link href="/forgot-password" className="text-[12px] hover:underline underline-offset-2"
                      style={{ color: C.lime }}>
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg,#2D8A2D,#8CCB1E)',
                      color: '#fff',
                      border: 'none',
                      padding: '13px 20px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.8 : 1,
                      marginTop: 4,
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

                <p className="text-[12px] text-center mt-6" style={{ color: C.textFaint }}>
                  ¿No tienes cuenta?{' '}
                  <Link href="/register" className="font-semibold underline-offset-2 hover:underline" style={{ color: C.lime }}>
                    Registrarse
                  </Link>
                </p>
              </div>

              {/* Información secundaria */}
              <div className="flex items-center justify-center gap-2 flex-wrap mt-5">
                {NORMAS.map(n => (
                  <span key={n} className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textFaint }}>
                    <CheckCircle size={11} style={{ color: C.lime }} /> {n}
                  </span>
                ))}
              </div>
              <p className="text-center mt-3 text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: C.textFaint }}>
                La cultura que nos <span style={{ color: C.orange }}>protege</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
