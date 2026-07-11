'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Settings, Building2, Bell, Shield, Globe, Palette,
  Save, ChevronRight, Moon, Mail, Phone, MapPin,
  FileText, Lock, Users, Database, CheckCircle, User, Check
} from 'lucide-react'
import { useTheme, THEMES, type ThemeId } from '@/components/ThemeProvider'

const ADMIN_SECTIONS = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'tema', label: 'Tema Visual', icon: Palette },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
  { id: 'sistema', label: 'Sistema', icon: Settings },
]

const WORKER_SECTIONS = [
  { id: 'perfil', label: 'Mi Perfil', icon: User },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'sistema', label: 'Preferencias', icon: Settings },
]

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button onClick={() => setOn(!on)}
      className={`w-10 h-5.5 rounded-full transition-all relative flex-shrink-0 ${on ? 'bg-[var(--amber)]' : 'bg-white/15'}`}
      style={{ height: 22, width: 40 }}>
      <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
        style={{ width: 18, height: 18, left: on ? 20 : 2 }} />
    </button>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'worker'
  const isWorker = userRole === 'worker'
  const SECTIONS = isWorker ? WORKER_SECTIONS : ADMIN_SECTIONS

  const [active, setActive] = useState('')
  const [saved, setSaved] = useState(false)
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)
  const { theme, setTheme } = useTheme()

  const effectiveActive = active || (isWorker ? 'perfil' : 'empresa')

  const handleThemeChange = async (id: ThemeId) => {
    setTheme(id)
    setThemeSaving(true)
    try {
      await fetch('/api/companies/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: id }),
      })
      setThemeSaved(true)
      setTimeout(() => setThemeSaved(false), 2000)
    } catch (_) {}
    setThemeSaving(false)
  }

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-[var(--text)] mb-1">Configuración</h1>
        <p className="text-[var(--text-dim)] text-sm">{isWorker ? 'Ajustes de tu cuenta' : 'Ajustes del sistema SG-SST'}</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-5">

        {/* Sidebar nav */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-1">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-2 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${effectiveActive === id ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'text-[var(--text-dim)] hover:bg-[var(--bg-card)] hover:text-[var(--text)]'}`}>
                <Icon size={16} />
                <span>{label}</span>
                {effectiveActive === id && <ChevronRight size={13} className="ml-auto" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 space-y-4">

          {effectiveActive === 'perfil' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><User size={16} className="text-amber-400" /> Información Personal</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nombre completo', placeholder: 'Tu nombre completo', icon: User },
                  { label: 'Correo electrónico', placeholder: 'tu@correo.com', icon: Mail },
                  { label: 'Teléfono', placeholder: '+57 300 000 0000', icon: Phone },
                  { label: 'Ciudad de residencia', placeholder: 'Bogotá', icon: MapPin },
                ].map(({ label, placeholder, icon: Icon }) => (
                  <div key={label}>
                    <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                    <div className="relative">
                      <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                      <input placeholder={placeholder}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-8 pr-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-4" style={{ color: 'var(--text-faint)' }}>
                Para actualizar tu cédula o datos laborales, contacta al administrador de tu empresa.
              </p>
            </div>
          )}

          {effectiveActive === 'empresa' && !isWorker && (
            <>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Building2 size={16} className="text-amber-400" /> Información de la Empresa</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Razón Social', value: 'Jimmy Academy S.A.S', icon: Building2 },
                    { label: 'NIT', value: '900.123.456-7', icon: FileText },
                    { label: 'Correo corporativo', value: 'sst@jimmyacademy.co', icon: Mail },
                    { label: 'Teléfono', value: '+57 (1) 234 5678', icon: Phone },
                    { label: 'Ciudad', value: 'Bogotá D.C.', icon: MapPin },
                    { label: 'Sector económico', value: 'Educación y Capacitación', icon: Globe },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                        <input defaultValue={value}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-8 pr-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-amber-400" /> Responsable SST</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Nombre completo', value: 'Diana Ruiz Morales' },
                    { label: 'Cargo', value: 'Coordinadora SST' },
                    { label: 'Correo', value: 'd.ruiz@jimmyacademy.co' },
                    { label: 'Licencia SSO N°', value: '12345-COL' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">{label}</label>
                      <input defaultValue={value}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {effectiveActive === 'notificaciones' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Bell size={16} className="text-amber-400" /> Preferencias de Notificación</h2>
              <div className="space-y-4">
                {[
                  { label: 'Certificados por vencer', desc: 'Alerta 30 días antes del vencimiento', on: true },
                  { label: 'Capacitaciones vencidas', desc: 'Notificar cuando una capacitación expire', on: true },
                  { label: 'Firmas pendientes', desc: 'Recordatorio diario de documentos sin firmar', on: true },
                  { label: 'Reportes automáticos', desc: 'Enviar reporte mensual por correo', on: false },
                  { label: 'Alertas IA SST', desc: 'Notificaciones de la inteligencia artificial', on: true },
                  { label: 'Notificaciones por correo', desc: 'Recibir alertas al correo corporativo', on: false },
                ].map(({ label, desc, on }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-[var(--text)] text-sm font-medium">{label}</div>
                      <div className="text-[var(--text-faint)] text-xs mt-0.5">{desc}</div>
                    </div>
                    <Toggle defaultOn={on} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {effectiveActive === 'seguridad' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Lock size={16} className="text-amber-400" /> Seguridad de la Cuenta</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Contraseña actual</label>
                  <input type="password" placeholder="••••••••"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Nueva contraseña</label>
                  <input type="password" placeholder="Mínimo 8 caracteres"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Confirmar contraseña</label>
                  <input type="password" placeholder="Repetir nueva contraseña"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all" />
                </div>
                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[var(--text)] text-sm font-medium">Autenticación de dos factores</div>
                      <div className="text-[var(--text-faint)] text-xs mt-0.5">Seguridad adicional por SMS o app</div>
                    </div>
                    <Toggle defaultOn={false} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {effectiveActive === 'tema' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Palette size={16} style={{ color: 'var(--primary)' }} /> Identidad Visual
                  </h2>
                  {themeSaved && (
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      <Check size={12} /> Guardado
                    </span>
                  )}
                  {themeSaving && (
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Guardando...</span>
                  )}
                </div>
                <p className="text-sm mb-5" style={{ color: 'var(--text-dim)' }}>
                  El tema seleccionado aplica a toda la plataforma y se guarda por empresa.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {THEMES.map(t => {
                    const isActive = theme === t.id
                    return (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className="relative text-left rounded-2xl p-4 transition-all overflow-hidden"
                        style={{
                          background: t.preview.bg,
                          border: `2px solid ${isActive ? t.preview.primary : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: isActive ? `0 0 0 4px ${t.preview.primary}22` : 'none',
                        }}>

                        {/* Active check */}
                        {isActive && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: t.preview.primary }}>
                            <Check size={11} color="white" strokeWidth={3} />
                          </div>
                        )}

                        {/* Mini UI preview */}
                        <div className="flex gap-2 mb-3">
                          {/* Sidebar */}
                          <div className="w-6 rounded-md flex flex-col gap-1 p-1" style={{ background: t.preview.sidebar }}>
                            <div className="w-full h-1 rounded-sm" style={{ background: t.preview.primary, opacity: 0.9 }} />
                            <div className="w-full h-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.12)' }} />
                            <div className="w-full h-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.12)' }} />
                            <div className="w-full h-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.12)' }} />
                          </div>
                          {/* Content */}
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.1)', width: '70%' }} />
                            <div className="flex gap-1">
                              <div className="h-5 flex-1 rounded" style={{ background: t.preview.primary, opacity: 0.8 }} />
                              <div className="h-5 flex-1 rounded" style={{ background: t.preview.accent, opacity: 0.6 }} />
                            </div>
                            <div className="flex gap-1">
                              <div className="h-4 w-1/3 rounded-sm" style={{ background: 'rgba(255,255,255,0.08)' }} />
                              <div className="h-4 flex-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            </div>
                          </div>
                        </div>

                        {/* Theme name + description */}
                        <div className="font-bold text-sm" style={{ color: t.preview.primary }}>
                          {t.name}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {t.description}
                        </div>

                        {/* Color dots */}
                        <div className="flex gap-1.5 mt-2.5">
                          {[t.preview.primary, t.preview.accent, t.preview.sidebar, t.preview.bg].map((c, i) => (
                            <div key={i} className="w-3 h-3 rounded-full border border-white/10"
                              style={{ background: c }} />
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Token preview */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>Vista previa — tema actual</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Primary', bg: 'var(--primary)', text: '#fff' },
                    { label: 'Accent', bg: 'var(--accent)', text: '#fff' },
                    { label: 'Surface', bg: 'var(--bg-surface)', text: 'var(--text)', border: true },
                    { label: 'Card', bg: 'var(--bg-card)', text: 'var(--text)', border: true },
                  ].map(({ label, bg, text, border }) => (
                    <div key={label} className="rounded-xl p-3 flex flex-col gap-1"
                      style={{ background: bg, border: border ? '1px solid var(--border)' : 'none' }}>
                      <div className="w-full h-1 rounded-full" style={{ background: text, opacity: 0.3 }} />
                      <div className="text-[10px] font-semibold mt-1" style={{ color: text, opacity: 0.7 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="terra-btn text-xs py-2 px-4">Botón primario</button>
                  <button className="terra-btn-outline text-xs py-2 px-4">Botón outline</button>
                  <input className="terra-input text-xs py-2" style={{ width: 160 }} placeholder="Input de texto..." readOnly />
                </div>
              </div>
            </div>
          )}

          {effectiveActive === 'sistema' && (
            <>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-[var(--text)] font-bold mb-4 flex items-center gap-2"><Globe size={16} className="text-amber-400" /> Preferencias del Sistema</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Idioma</label>
                    <select className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                      <option className="bg-[var(--bg-surface)]">Español (Colombia)</option>
                      <option className="bg-[var(--bg-surface)]">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[var(--text-dim)] text-xs font-semibold mb-1.5 block">Zona horaria</label>
                    <select className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-amber-500/40 transition-all">
                      <option className="bg-[var(--bg-surface)]">America/Bogota (UTC-5)</option>
                    </select>
                  </div>
                  {[
                    { label: 'Modo oscuro', desc: 'Interfaz oscura (activo por defecto)', on: true },
                    { label: 'Actualización automática', desc: 'Actualizar datos del dashboard en tiempo real', on: true },
                  ].map(({ label, desc, on }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-t border-white/5">
                      <div>
                        <div className="text-[var(--text)] text-sm font-medium">{label}</div>
                        <div className="text-[var(--text-faint)] text-xs mt-0.5">{desc}</div>
                      </div>
                      <Toggle defaultOn={on} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-[var(--text)] font-bold mb-3 flex items-center gap-2"><Database size={16} className="text-amber-400" /> Datos y Respaldo</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Exportar todos los datos', color: 'text-amber-400 border-blue-400/20 hover:bg-blue-400/10' },
                    { label: 'Crear copia de seguridad', color: 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10' },
                  ].map(({ label, color }) => (
                    <button key={label} className={`w-full py-2.5 rounded-xl border text-sm font-semibold transition-all ${color}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Save button */}
          <motion.div animate={saved ? { scale: [1, 0.97, 1] } : {}}>
            <button onClick={save}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-600 text-[var(--text)]' : 'bg-[var(--amber)] hover:bg-amber-500 text-[var(--text)]'}`}>
              {saved ? <><CheckCircle size={16} /> Guardado exitosamente</> : <><Save size={16} /> Guardar cambios</>}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
