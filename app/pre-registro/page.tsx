'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Loader2, CheckCircle, ChevronLeft, ChevronRight, AlertCircle,
  CreditCard, User, Briefcase, Phone, Send, Eye, EyeOff,
} from 'lucide-react'

/**
 * Enlace público para que el propio trabajador diligencie sus datos.
 * Queda en estado pendiente: el superadmin revisa y aprueba.
 */

const C = {
  fondo: '#0B1829',
  texto: '#F1F5F9',
  tenue: 'rgba(241,245,249,0.70)',
  debil: 'rgba(241,245,249,0.45)',
  linea: 'rgba(255,255,255,0.12)',
  verde: '#84CC16',
  error: '#FCA5A5',
}

const inp = 'w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-colors'
const estiloInput = {
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${C.linea}`,
  color: C.texto,
}

const OPCIONES = {
  doc_type: ['CÉDULA DE CIUDADANÍA', 'CÉDULA DE EXTRANJERÍA', 'TARJETA DE IDENTIDAD', 'PASAPORTE', 'PERMISO POR PROTECCIÓN TEMPORAL'],
  sexo: ['MASCULINO', 'FEMENINO', 'OTRO'],
  estado_civil: ['SOLTERO(A)', 'CASADO(A)', 'UNIÓN LIBRE', 'SEPARADO(A)', 'DIVORCIADO(A)', 'VIUDO(A)'],
  parentesco_contacto: ['CÓNYUGE / PAREJA', 'MADRE', 'PADRE', 'HIJO/A', 'HERMANO/A', 'OTRO FAMILIAR', 'AMIGO/A'],
}

const PASOS = ['Documento', 'Datos', 'Trabajo', 'Contacto'] as const

/**
 * Un campo del formulario. Vive aquí y no dentro de la página porque, si se
 * declarara en cada render, React lo trataría como un componente distinto,
 * destruiría el <input> y el foco se perdería a cada letra.
 */
function Campo({ k, label, valor, onChange, tipo = 'text', may = true, opciones, ayuda, req }: {
  k: string; label: string; valor: string
  onChange: (k: string, v: string, may?: boolean) => void
  tipo?: string; may?: boolean; opciones?: string[]; ayuda?: string; req?: boolean
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.tenue }}>
        {label}{req && <span style={{ color: C.error }}> *</span>}
      </label>
      {opciones ? (
        <select className={inp} style={estiloInput} value={valor} onChange={e => onChange(k, e.target.value, false)}>
          <option value="">— Seleccionar —</option>
          {opciones.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input className={inp} style={estiloInput} type={tipo} value={valor}
          inputMode={tipo === 'tel' ? 'numeric' : undefined}
          onChange={e => onChange(k, e.target.value, may)} />
      )}
      {ayuda && <p className="text-[11px] mt-1" style={{ color: C.debil }}>{ayuda}</p>}
    </div>
  )
}

export default function PreRegistroPage() {
  const [paso, setPaso] = useState(0)
  const [d, setD] = useState<Record<string, string>>({ doc_type: 'CÉDULA DE CIUDADANÍA' })
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revisando, setRevisando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  // Se escribe en mayúscula a la vista; el servidor normaliza igual al guardar.
  const set = (k: string, v: string, mayuscula = true) => {
    setD(p => ({ ...p, [k]: mayuscula ? v.toLocaleUpperCase('es-CO') : v }))
    setError(null)
  }

  /** La cédula se consulta contra el servidor antes de dejar avanzar. */
  const revisarCedula = async () => {
    const cedula = (d.cedula ?? '').replace(/\D/g, '')
    if (cedula.length < 5) { setError('Escribe tu número de documento'); return }
    setRevisando(true); setError(null)
    try {
      const r = await fetch(`/api/pre-registro?cedula=${cedula}`)
      const b = await r.json()
      if (b.existe) {
        setError(b.estado === 'pendiente'
          ? 'Ya enviaste tu registro con este documento y está en revisión.'
          : 'Ya existe un registro con este documento. Ingresa con tu documento y tu contraseña.')
        return
      }
      setPaso(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Sin conexión. Intenta de nuevo.')
    } finally { setRevisando(false) }
  }

  const completo = (n: number) => {
    if (n === 0) return (d.cedula ?? '').replace(/\D/g, '').length >= 5 && (d.password ?? '').length >= 6
    if (n === 1) return !!d.nombres?.trim() && !!d.apellidos?.trim()
    return true
  }

  const siguiente = () => {
    if (!completo(paso)) {
      setError(paso === 0 ? 'Completa tu documento y una contraseña de al menos 6 caracteres'
        : 'Escribe tus nombres y apellidos')
      return
    }
    if (paso === 0) { revisarCedula(); return }
    setError(null)
    setPaso(p => Math.min(p + 1, PASOS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const enviar = async () => {
    setEnviando(true); setError(null)
    try {
      const r = await fetch('/api/pre-registro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d),
      })
      const b = await r.json()
      if (!r.ok) { setError(b.error ?? 'No fue posible enviar tu registro'); return }
      setListo(true)
    } catch {
      setError('Sin conexión. Intenta de nuevo.')
    } finally { setEnviando(false) }
  }

  if (listo) return (
    <main className="min-h-screen flex items-center justify-center p-5" style={{ background: C.fondo }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-8 text-center flex flex-col items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.linea}` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(132,204,22,0.15)', color: C.verde }}>
          <CheckCircle size={30} />
        </div>
        <p className="text-lg font-black" style={{ color: C.texto }}>¡Datos enviados!</p>
        <p className="text-sm leading-relaxed" style={{ color: C.tenue }}>
          Tu registro quedó <strong style={{ color: C.texto }}>pendiente de validación</strong>. El área de
          Seguridad y Salud en el Trabajo lo revisará y te habilitará el acceso.
        </p>
        <p className="text-xs mt-1" style={{ color: C.debil }}>
          Cuando te aprueben, entra con tu documento <strong style={{ color: C.tenue }}>{d.cedula}</strong> y la
          contraseña que acabas de crear.
        </p>
        <Link href="/login" className="mt-3 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: C.verde, color: '#0B1829' }}>
          Ir al inicio de sesión
        </Link>
      </motion.div>
    </main>
  )

  return (
    <main className="min-h-screen py-8 px-5" style={{ background: C.fondo }}>
      <div className="w-full mx-auto" style={{ maxWidth: 480 }}>

        <div className="text-center mb-6">
          <img src="/images/agrosafe-completo.png" alt="AgroSafe"
            className="h-auto mx-auto mb-5" style={{ width: 'min(260px, 70vw)' }} />
          <h1 className="text-xl font-black leading-tight" style={{ color: C.texto }}>
            Completa tus datos para ingresar a AgroSafe
          </h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: C.tenue }}>
            Son cuatro pasos cortos. Al terminar, tu registro queda en revisión.
          </p>
        </div>

        {/* Avance */}
        <div className="flex gap-1.5 mb-5">
          {PASOS.map((p, i) => (
            <div key={p} className="flex-1">
              <div className="h-1.5 rounded-full transition-all"
                style={{ background: i <= paso ? C.verde : 'rgba(255,255,255,0.12)' }} />
              <p className="text-[10px] font-bold mt-1 text-center truncate"
                style={{ color: i === paso ? C.verde : C.debil }}>{p}</p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={paso}
            initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -22 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.linea}` }}>

            {paso === 0 && (
              <>
                <Encabezado icono={CreditCard} titulo="Tu documento y tu clave"
                  texto="Con estos datos entrarás a la plataforma cuando te aprueben." />
                <Campo k="doc_type" label="Tipo de documento" opciones={OPCIONES.doc_type}  valor={d.doc_type ?? ''} onChange={set} />
                <Campo k="cedula" label="Número de documento" tipo="tel" may={false} req
                  ayuda="Este será tu usuario para entrar."  valor={d.cedula ?? ''} onChange={set} />
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.tenue }}>
                    Crea tu contraseña <span style={{ color: C.error }}>*</span>
                  </label>
                  <div className="relative">
                    <input className={inp} style={estiloInput} type={verClave ? 'text' : 'password'}
                      value={d.password ?? ''} onChange={e => set('password', e.target.value, false)} />
                    <button type="button" onClick={() => setVerClave(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.debil }}>
                      {verClave ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: C.debil }}>Mínimo 6 caracteres. Anótala, la vas a necesitar.</p>
                </div>
              </>
            )}

            {paso === 1 && (
              <>
                <Encabezado icono={User} titulo="Tus datos personales" texto="Como aparecen en tu documento." />
                <Campo k="nombres" label="Nombres" req  valor={d.nombres ?? ''} onChange={set} />
                <Campo k="apellidos" label="Apellidos" req  valor={d.apellidos ?? ''} onChange={set} />
                <Campo k="fecha_nacimiento" label="Fecha de nacimiento" tipo="date" may={false}  valor={d.fecha_nacimiento ?? ''} onChange={set} />
                <Campo k="sexo" label="Sexo" opciones={OPCIONES.sexo}  valor={d.sexo ?? ''} onChange={set} />
                <Campo k="estado_civil" label="Estado civil" opciones={OPCIONES.estado_civil}  valor={d.estado_civil ?? ''} onChange={set} />
                <Campo k="telefono" label="Teléfono" tipo="tel" may={false}  valor={d.telefono ?? ''} onChange={set} />
                <Campo k="correo" label="Correo electrónico" tipo="email" may={false}
                  ayuda="Opcional. Se guarda tal cual lo escribes."  valor={d.correo ?? ''} onChange={set} />
                <Campo k="direccion" label="Dirección"  valor={d.direccion ?? ''} onChange={set} />
                <Campo k="barrio" label="Barrio"  valor={d.barrio ?? ''} onChange={set} />
                <Campo k="ciudad_residencia" label="Ciudad donde vives"  valor={d.ciudad_residencia ?? ''} onChange={set} />
              </>
            )}

            {paso === 2 && (
              <>
                <Encabezado icono={Briefcase} titulo="Tu trabajo" texto="Si no sabes alguno, déjalo en blanco." />
                <Campo k="cargo_confirmado" label="Cargo" ayuda="Ej: OPERARIO DE CAMPO"  valor={d.cargo_confirmado ?? ''} onChange={set} />
                <Campo k="area_confirmada" label="Área" ayuda="Ej: PRODUCCIÓN"  valor={d.area_confirmada ?? ''} onChange={set} />
                <Campo k="centro_trabajo" label="Finca o centro de trabajo"  valor={d.centro_trabajo ?? ''} onChange={set} />
                <Campo k="fecha_ingreso" label="Fecha de ingreso a la empresa" tipo="date" may={false}  valor={d.fecha_ingreso ?? ''} onChange={set} />
              </>
            )}

            {paso === 3 && (
              <>
                <Encabezado icono={Phone} titulo="¿A quién avisamos si pasa algo?"
                  texto="Una persona de confianza a la que podamos llamar." />
                <Campo k="contacto_emergencia" label="Nombre completo"  valor={d.contacto_emergencia ?? ''} onChange={set} />
                <Campo k="parentesco_contacto" label="Parentesco" opciones={OPCIONES.parentesco_contacto}  valor={d.parentesco_contacto ?? ''} onChange={set} />
                <Campo k="tel_contacto" label="Teléfono" tipo="tel" may={false}  valor={d.tel_contacto ?? ''} onChange={set} />

                <div className="p-3 rounded-xl text-xs leading-relaxed"
                  style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.25)', color: C.tenue }}>
                  Al enviar, tus datos quedan <strong style={{ color: C.texto }}>pendientes de validación</strong>.
                  Podrás entrar cuando el área de SST apruebe tu registro.
                </div>
              </>
            )}

            {error && (
              <p className="text-xs font-bold flex items-start gap-1.5" style={{ color: C.error }}>
                <AlertCircle size={13} className="mt-px flex-shrink-0" /> {error}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2 mt-4">
          {paso > 0 && (
            <button onClick={() => { setError(null); setPaso(p => p - 1) }}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.linea}`, color: C.tenue }}>
              <ChevronLeft size={14} /> Atrás
            </button>
          )}
          <div className="flex-1" />
          {paso < PASOS.length - 1 ? (
            <button onClick={siguiente} disabled={revisando}
              className="flex items-center gap-1.5 font-bold px-6 py-3 rounded-xl"
              style={{ background: C.verde, color: '#0B1829', fontSize: 14 }}>
              {revisando ? <Loader2 size={15} className="animate-spin" /> : null}
              {revisando ? 'Verificando…' : 'Siguiente'} {!revisando && <ChevronRight size={15} />}
            </button>
          ) : (
            <button onClick={enviar} disabled={enviando}
              className="flex items-center gap-1.5 font-bold px-6 py-3 rounded-xl disabled:opacity-50"
              style={{ background: C.verde, color: '#0B1829', fontSize: 14 }}>
              {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {enviando ? 'Enviando…' : 'Enviar mis datos'}
            </button>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: C.debil }}>
          ¿Ya tienes acceso? <Link href="/login" className="font-bold" style={{ color: C.verde }}>Inicia sesión</Link>
        </p>
      </div>
    </main>
  )
}

function Encabezado({ icono: Icono, titulo, texto }: { icono: any; titulo: string; texto: string }) {
  return (
    <div className="flex items-start gap-3 pb-1">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(132,204,22,0.14)', color: C.verde }}>
        <Icono size={17} />
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: C.texto }}>{titulo}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: C.tenue }}>{texto}</p>
      </div>
    </div>
  )
}
