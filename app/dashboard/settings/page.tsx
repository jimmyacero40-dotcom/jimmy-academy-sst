'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Building2, Bell, Shield, Globe, Palette,
  Save, ChevronRight, Moon, Mail, Phone, MapPin,
  FileText, Lock, Users, Database, CheckCircle
} from 'lucide-react'

const SECTIONS = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
  { id: 'sistema', label: 'Sistema', icon: Settings },
]

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button onClick={() => setOn(!on)}
      className={`w-10 h-5.5 rounded-full transition-all relative flex-shrink-0 ${on ? 'bg-blue-600' : 'bg-white/15'}`}
      style={{ height: 22, width: 40 }}>
      <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
        style={{ width: 18, height: 18, left: on ? 20 : 2 }} />
    </button>
  )
}

export default function SettingsPage() {
  const [active, setActive] = useState('empresa')
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Configuración</h1>
        <p className="text-slate-400 text-sm">Ajustes del sistema SG-SST</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-5">

        {/* Sidebar nav */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-1">
          <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-2 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active === id ? 'bg-blue-600/20 text-blue-300 border border-blue-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={16} />
                <span>{label}</span>
                {active === id && <ChevronRight size={13} className="ml-auto" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 space-y-4">

          {active === 'empresa' && (
            <>
              <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Building2 size={16} className="text-blue-400" /> Información de la Empresa</h2>
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
                      <label className="text-slate-400 text-xs font-semibold mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input defaultValue={value}
                          className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-blue-400" /> Responsable SST</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Nombre completo', value: 'Diana Ruiz Morales' },
                    { label: 'Cargo', value: 'Coordinadora SST' },
                    { label: 'Correo', value: 'd.ruiz@jimmyacademy.co' },
                    { label: 'Licencia SSO N°', value: '12345-COL' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="text-slate-400 text-xs font-semibold mb-1.5 block">{label}</label>
                      <input defaultValue={value}
                        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {active === 'notificaciones' && (
            <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Bell size={16} className="text-blue-400" /> Preferencias de Notificación</h2>
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
                      <div className="text-white text-sm font-medium">{label}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                    </div>
                    <Toggle defaultOn={on} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'seguridad' && (
            <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Lock size={16} className="text-blue-400" /> Seguridad de la Cuenta</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Contraseña actual</label>
                  <input type="password" placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Nueva contraseña</label>
                  <input type="password" placeholder="Mínimo 8 caracteres"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Confirmar contraseña</label>
                  <input type="password" placeholder="Repetir nueva contraseña"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <div className="pt-2 border-t border-white/8">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-white text-sm font-medium">Autenticación de dos factores</div>
                      <div className="text-slate-500 text-xs mt-0.5">Seguridad adicional por SMS o app</div>
                    </div>
                    <Toggle defaultOn={false} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'sistema' && (
            <>
              <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Globe size={16} className="text-blue-400" /> Preferencias del Sistema</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Idioma</label>
                    <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all">
                      <option className="bg-[#0D1629]">Español (Colombia)</option>
                      <option className="bg-[#0D1629]">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Zona horaria</label>
                    <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all">
                      <option className="bg-[#0D1629]">America/Bogota (UTC-5)</option>
                    </select>
                  </div>
                  {[
                    { label: 'Modo oscuro', desc: 'Interfaz oscura (activo por defecto)', on: true },
                    { label: 'Actualización automática', desc: 'Actualizar datos del dashboard en tiempo real', on: true },
                  ].map(({ label, desc, on }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-t border-white/5">
                      <div>
                        <div className="text-white text-sm font-medium">{label}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                      </div>
                      <Toggle defaultOn={on} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Database size={16} className="text-blue-400" /> Datos y Respaldo</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Exportar todos los datos', color: 'text-blue-400 border-blue-400/20 hover:bg-blue-400/10' },
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
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
              {saved ? <><CheckCircle size={16} /> Guardado exitosamente</> : <><Save size={16} /> Guardar cambios</>}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
