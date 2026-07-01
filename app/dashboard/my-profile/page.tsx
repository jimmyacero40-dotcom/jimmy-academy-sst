'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Camera, CheckCircle, Clock, AlertCircle, Loader2,
  Save, ChevronDown, ChevronRight, Heart, Briefcase,
  GraduationCap, Activity, Shield, Award, FileText, Home, Car
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────
type BoolOrNull = boolean | null
interface ProfileData {
  photo_url?: string
  doc_type?: string; nombres?: string; apellidos?: string
  fecha_nacimiento?: string; sexo?: string; estado_civil?: string
  nacionalidad?: string; ciudad_nacimiento?: string; depto_nacimiento?: string
  ciudad_residencia?: string; depto_residencia?: string
  direccion?: string; barrio?: string; telefono?: string; email_personal?: string
  con_quien_vive?: string; num_personas_hogar?: number; num_hijos?: number
  dependientes_economicos?: number; cabeza_hogar?: BoolOrNull
  contacto_emergencia?: string; parentesco_contacto?: string; tel_contacto?: string
  tipo_vivienda?: string; tenencia_vivienda?: string; estrato?: number
  servicios_publicos?: string[]; acceso_internet?: BoolOrNull
  nivel_educativo?: string; profesion?: string; estudios_tecnicos?: string
  estudios_tecnologicos?: string; estudios_universitarios?: string
  especializacion?: string; otros_estudios?: string; cursos_certificados?: string
  actualmente_estudia?: BoolOrNull
  cargo_confirmado?: string; area_confirmada?: string; centro_trabajo?: string
  jefe_inmediato?: string; fecha_ingreso?: string; tipo_contrato?: string
  jornada_laboral?: string; horario_habitual?: string
  realiza_horas_extras?: BoolOrNull; trabaja_fines_semana?: BoolOrNull
  estatura_cm?: number; peso_kg?: number
  talla_camisa?: string; talla_camiseta?: string; talla_pantalon?: string
  talla_overol?: string; talla_chaqueta?: string; talla_impermeable?: string
  talla_zapato?: string; talla_botas?: string; talla_guantes?: string; obs_tallas?: string
  municipio_vivienda?: string; medio_transporte?: string
  tiempo_desplazamiento?: string; distancia_aprox?: string
  conduce_vehiculo?: BoolOrNull; tipo_vehiculo?: string
  realiza_actividad_fisica?: BoolOrNull; dias_actividad_fisica?: number
  tipo_actividad_fisica?: string; horas_sueno?: number; descanso_adecuado?: BoolOrNull
  desayuna_diariamente?: BoolOrNull; comidas_al_dia?: number
  consume_frutas?: BoolOrNull; consume_verduras?: BoolOrNull
  fuma?: BoolOrNull; cigarrillos_dia?: number; consumo_alcohol?: string
  consume_energizantes?: BoolOrNull; consume_psicoactivos?: string
  enfermedades_diagnosticadas?: string[]; hospitalizado?: BoolOrNull
  cirugias?: BoolOrNull; cirugias_detalle?: string
  alergias?: BoolOrNull; alergias_detalle?: string
  medicamentos_permanentes?: BoolOrNull; medicamentos_detalle?: string
  limitacion_fisica?: BoolOrNull; limitacion_detalle?: string
  antecedentes_familiares?: string[]
  accidentes_trabajo?: BoolOrNull; enfermedades_laborales?: BoolOrNull
  restricciones_medicas?: BoolOrNull; restricciones_detalle?: string
  usa_gafas?: BoolOrNull; usa_audifonos?: BoolOrNull
  trabajo_genera_estres?: BoolOrNull; apoyo_familiar?: BoolOrNull
  otro_empleo?: BoolOrNull; es_cuidador?: BoolOrNull
  dificultades_economicas?: BoolOrNull; equilibrio_trabajo_vida?: BoolOrNull
  licencia_conduccion?: BoolOrNull; categoria_licencia?: string
  certificaciones?: string[]; otras_certificaciones?: string
  autoriza_datos?: boolean; declara_veracidad?: boolean; firma_electronica?: string
  completion_pct?: number; updated_at?: string
}

// ── Helpers ───────────────────────────────────────────────────────────
function calcCompletion(d: ProfileData) {
  const sections: Record<string, boolean> = {
    'Foto':               !!d.photo_url,
    'Información personal': !!(d.nombres && d.apellidos && d.fecha_nacimiento && d.sexo),
    'Familiar':           !!(d.contacto_emergencia && d.tel_contacto),
    'Vivienda':           !!d.tipo_vivienda,
    'Educación':          !!d.nivel_educativo,
    'Laboral':            !!(d.fecha_ingreso || d.tipo_contrato),
    'Tallas / EPP':       !!(d.estatura_cm && d.talla_camisa && d.talla_zapato),
    'Desplazamiento':     !!d.municipio_vivienda,
    'Estilos de vida':    d.realiza_actividad_fisica !== null && d.realiza_actividad_fisica !== undefined,
    'Antecedentes médicos': d.hospitalizado !== null && d.hospitalizado !== undefined,
    'Ant. familiares':    !!(d.antecedentes_familiares?.length),
    'Salud ocupacional':  d.accidentes_trabajo !== null && d.accidentes_trabajo !== undefined,
    'Riesgo psicosocial': d.trabajo_genera_estres !== null && d.trabajo_genera_estres !== undefined,
    'Competencias':       d.licencia_conduccion !== null && d.licencia_conduccion !== undefined,
    'Consentimientos':    !!(d.autoriza_datos && d.declara_veracidad),
  }
  const done = Object.values(sections).filter(Boolean).length
  return { pct: Math.round((done / 15) * 100), sections }
}

function imc(e?: number, p?: number) {
  if (!e || !p) return null
  return (p / ((e / 100) ** 2)).toFixed(1)
}

function imcLabel(v: number) {
  if (v < 18.5) return 'Bajo peso'
  if (v < 25)   return 'Normal'
  if (v < 30)   return 'Sobrepeso'
  return 'Obesidad'
}

// ── Reusable form field components ────────────────────────────────────
const inp = 'terra-input text-sm'

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2 sm:col-span-1'}>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>{label}</label>
      {children}
    </div>
  )
}

function BoolField({ label, value, onChange }: { label: string; value: BoolOrNull; onChange: (v: boolean) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <div className="flex gap-2">
        {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(({ v, l }) => (
          <button key={l} type="button" onClick={() => onChange(v)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={value === v
              ? { background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--primary)' }
              : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function CheckGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt])
  return (
    <div className="col-span-2">
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
            style={value.includes(opt)
              ? { background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--primary)' }
              : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            {value.includes(opt) ? '✓ ' : ''}{opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── TABS definition ───────────────────────────────────────────────────
const TABS = [
  { id: 'personal',   label: 'Personal',       icon: User },
  { id: 'familia',    label: 'Familia',         icon: Home },
  { id: 'laboral',    label: 'Laboral',         icon: Briefcase },
  { id: 'tallas',     label: 'Tallas / EPP',    icon: Shield },
  { id: 'estilos',    label: 'Estilos de vida', icon: Activity },
  { id: 'salud',      label: 'Salud',           icon: Heart },
  { id: 'cierre',     label: 'Cierre',          icon: Award },
]

const SECTION_KEYS: Record<string, (keyof ProfileData)[]> = {
  personal: ['foto', 'nombres', 'apellidos', 'fecha_nacimiento', 'sexo'] as any,
  familia:  ['contacto_emergencia', 'tel_contacto', 'tipo_vivienda'] as any,
  laboral:  ['nivel_educativo', 'fecha_ingreso', 'tipo_contrato'] as any,
  tallas:   ['estatura_cm', 'talla_camisa', 'talla_zapato'] as any,
  estilos:  ['realiza_actividad_fisica'] as any,
  salud:    ['hospitalizado', 'accidentes_trabajo', 'trabajo_genera_estres'] as any,
  cierre:   ['licencia_conduccion', 'autoriza_datos', 'declara_veracidad'] as any,
}

// ── Main page ─────────────────────────────────────────────────────────
export default function MyProfilePage() {
  const [data, setData]       = useState<ProfileData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [tab, setTab]         = useState('personal')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : {})
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const set = useCallback((key: keyof ProfileData, val: any) =>
    setData(prev => ({ ...prev, [key]: val })), [])

  const setArr = useCallback((key: keyof ProfileData, val: string[]) =>
    setData(prev => ({ ...prev, [key]: val })), [])

  const save = async () => {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Máximo 5 MB'); return }
    setUploadingPhoto(true)
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'profiles')
    const res = await fetch('/api/trainings/cover', { method: 'POST', body: form })
    if (res.ok) {
      const { url } = await res.json()
      set('photo_url', url)
    }
    setUploadingPhoto(false)
    if (photoRef.current) photoRef.current.value = ''
  }

  const { pct, sections } = calcCompletion(data)
  const imcVal = imc(data.estatura_cm, data.peso_kg)

  if (loading) return (
    <div className="flex items-center justify-center h-full py-32">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* ── Header ── */}
      <div className="terra-card p-5 mb-6">
        <div className="flex items-start gap-5 flex-wrap">

          {/* Avatar / foto */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: 'var(--primary-dim)', border: '2px solid var(--primary-border)' }}>
              {data.photo_url
                ? <img src={data.photo_url} alt="foto" className="w-full h-full object-cover" />
                : <User size={32} style={{ color: 'var(--primary)' }} />}
            </div>
            <button onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'var(--primary)', border: '2px solid var(--bg-surface)' }}
              title="Cambiar foto">
              {uploadingPhoto ? <Loader2 size={12} className="animate-spin text-white" /> : <Camera size={12} className="text-white" />}
            </button>
            <input ref={photoRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="hidden" />
          </div>

          {/* Info + progress */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              {data.nombres && data.apellidos ? `${data.nombres} ${data.apellidos}` : 'Mi Perfil Integral'}
            </h1>
            <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
              {data.updated_at
                ? `Última actualización: ${new Date(data.updated_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : 'Completa tu perfil para que el área de SST pueda apoyarte mejor'}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ background: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : 'var(--primary)' }} />
              </div>
              <span className="text-sm font-bold w-10 text-right" style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : 'var(--primary)' }}>{pct}%</span>
            </div>

            {/* Section badges */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(sections).map(([name, done]) => (
                <span key={name} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={done
                    ? { background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }
                    : { background: 'var(--bg-card)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                  {done ? <CheckCircle size={9} /> : <Clock size={9} />} {name}
                </span>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button onClick={save} disabled={saving}
            className="terra-btn flex-shrink-0 self-start"
            style={{ padding: '10px 20px' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={tab === t.id
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* ── PERSONAL ── */}
          {tab === 'personal' && (
            <div className="space-y-6">
              <Section title="Información personal" icon={User}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo de documento">
                    <select value={data.doc_type ?? ''} onChange={e => set('doc_type', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Cédula de ciudadanía','Cédula de extranjería','Tarjeta de identidad','Pasaporte','NIT'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Nombres *">
                    <input className={inp} value={data.nombres ?? ''} onChange={e => set('nombres', e.target.value.toUpperCase())} placeholder="NOMBRES" />
                  </Field>
                  <Field label="Apellidos *">
                    <input className={inp} value={data.apellidos ?? ''} onChange={e => set('apellidos', e.target.value.toUpperCase())} placeholder="APELLIDOS" />
                  </Field>
                  <Field label="Fecha de nacimiento *">
                    <input type="date" className={inp} value={data.fecha_nacimiento ?? ''} onChange={e => set('fecha_nacimiento', e.target.value)} />
                  </Field>
                  <Field label="Sexo *">
                    <select value={data.sexo ?? ''} onChange={e => set('sexo', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Masculino','Femenino','No binario','Prefiero no indicar'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Estado civil">
                    <select value={data.estado_civil ?? ''} onChange={e => set('estado_civil', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Soltero/a','Casado/a','Unión libre','Divorciado/a','Viudo/a','Separado/a'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Nacionalidad">
                    <input className={inp} value={data.nacionalidad ?? 'Colombiana'} onChange={e => set('nacionalidad', e.target.value)} />
                  </Field>
                  <Field label="Ciudad de nacimiento">
                    <input className={inp} value={data.ciudad_nacimiento ?? ''} onChange={e => set('ciudad_nacimiento', e.target.value)} placeholder="Ciudad" />
                  </Field>
                  <Field label="Departamento de nacimiento">
                    <input className={inp} value={data.depto_nacimiento ?? ''} onChange={e => set('depto_nacimiento', e.target.value)} placeholder="Departamento" />
                  </Field>
                  <Field label="Ciudad de residencia">
                    <input className={inp} value={data.ciudad_residencia ?? ''} onChange={e => set('ciudad_residencia', e.target.value)} placeholder="Ciudad" />
                  </Field>
                  <Field label="Departamento de residencia">
                    <input className={inp} value={data.depto_residencia ?? ''} onChange={e => set('depto_residencia', e.target.value)} placeholder="Departamento" />
                  </Field>
                  <Field label="Dirección">
                    <input className={inp} value={data.direccion ?? ''} onChange={e => set('direccion', e.target.value)} placeholder="Dirección completa" />
                  </Field>
                  <Field label="Barrio">
                    <input className={inp} value={data.barrio ?? ''} onChange={e => set('barrio', e.target.value)} placeholder="Barrio" />
                  </Field>
                  <Field label="Teléfono / Celular">
                    <input className={inp} value={data.telefono ?? ''} onChange={e => set('telefono', e.target.value)} placeholder="3XX XXX XXXX" />
                  </Field>
                  <Field label="Correo personal">
                    <input type="email" className={inp} value={data.email_personal ?? ''} onChange={e => set('email_personal', e.target.value)} placeholder="correo@ejemplo.com" />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {/* ── FAMILIA ── */}
          {tab === 'familia' && (
            <div className="space-y-6">
              <Section title="Información familiar" icon={Home}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="¿Con quién vive?">
                    <select value={data.con_quien_vive ?? ''} onChange={e => set('con_quien_vive', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Solo/a','Con pareja','Con pareja e hijos','Con padres','Con familia extendida','Con compañeros de habitación','Otra situación'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Personas en el hogar">
                    <input type="number" min={1} className={inp} value={data.num_personas_hogar ?? ''} onChange={e => set('num_personas_hogar', +e.target.value)} />
                  </Field>
                  <Field label="Número de hijos">
                    <input type="number" min={0} className={inp} value={data.num_hijos ?? ''} onChange={e => set('num_hijos', +e.target.value)} />
                  </Field>
                  <Field label="Personas que dependen económicamente">
                    <input type="number" min={0} className={inp} value={data.dependientes_economicos ?? ''} onChange={e => set('dependientes_economicos', +e.target.value)} />
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿Es cabeza de hogar?" value={data.cabeza_hogar ?? null} onChange={v => set('cabeza_hogar', v)} />
                  </div>
                  <Field label="Contacto de emergencia *">
                    <input className={inp} value={data.contacto_emergencia ?? ''} onChange={e => set('contacto_emergencia', e.target.value.toUpperCase())} placeholder="NOMBRE COMPLETO" />
                  </Field>
                  <Field label="Parentesco">
                    <select value={data.parentesco_contacto ?? ''} onChange={e => set('parentesco_contacto', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Cónyuge/Pareja','Madre','Padre','Hijo/a','Hermano/a','Otro familiar','Amigo/a'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Teléfono de emergencia *">
                    <input className={inp} value={data.tel_contacto ?? ''} onChange={e => set('tel_contacto', e.target.value)} placeholder="3XX XXX XXXX" />
                  </Field>
                </div>
              </Section>

              <Section title="Vivienda" icon={Home}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo de vivienda *">
                    <select value={data.tipo_vivienda ?? ''} onChange={e => set('tipo_vivienda', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Casa','Apartamento','Cuarto','Finca','Otro'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="La vivienda es">
                    <select value={data.tenencia_vivienda ?? ''} onChange={e => set('tenencia_vivienda', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Propia pagada','Propia en crédito','Arrendada','Familiar','Otra'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Estrato socioeconómico">
                    <select value={data.estrato ?? ''} onChange={e => set('estrato', +e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>Estrato {n}</option>)}
                    </select>
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿Tiene acceso a internet en casa?" value={data.acceso_internet ?? null} onChange={v => set('acceso_internet', v)} />
                  </div>
                  <CheckGroup label="Servicios públicos disponibles"
                    options={['Agua','Luz','Gas','Alcantarillado','Internet','Teléfono fijo']}
                    value={data.servicios_publicos ?? []}
                    onChange={v => setArr('servicios_publicos', v)} />
                </div>
              </Section>

              <Section title="Desplazamiento al trabajo" icon={Car}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Municipio donde vive">
                    <input className={inp} value={data.municipio_vivienda ?? ''} onChange={e => set('municipio_vivienda', e.target.value)} placeholder="Municipio" />
                  </Field>
                  <Field label="Medio de transporte">
                    <select value={data.medio_transporte ?? ''} onChange={e => set('medio_transporte', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['A pie','Bicicleta','Moto propia','Carro propio','Transporte público','Servicio empresa','Taxi/Uber','Combinado'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Tiempo promedio de desplazamiento">
                    <select value={data.tiempo_desplazamiento ?? ''} onChange={e => set('tiempo_desplazamiento', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Menos de 15 min','15-30 min','30-60 min','1-2 horas','Más de 2 horas'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Distancia aproximada">
                    <input className={inp} value={data.distancia_aprox ?? ''} onChange={e => set('distancia_aprox', e.target.value)} placeholder="ej. 5 km" />
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿Conduce vehículo propio?" value={data.conduce_vehiculo ?? null} onChange={v => set('conduce_vehiculo', v)} />
                  </div>
                  {data.conduce_vehiculo && (
                    <Field label="Tipo de vehículo">
                      <select value={data.tipo_vehiculo ?? ''} onChange={e => set('tipo_vehiculo', e.target.value)} className={inp}>
                        <option value="">Seleccionar</option>
                        {['Moto','Automóvil','Camioneta','Otro'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* ── LABORAL ── */}
          {tab === 'laboral' && (
            <div className="space-y-6">
              <Section title="Educación" icon={GraduationCap}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nivel educativo *">
                    <select value={data.nivel_educativo ?? ''} onChange={e => set('nivel_educativo', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Primaria','Secundaria','Bachillerato','Técnico','Tecnólogo','Universitario','Especialización','Maestría','Doctorado','Ninguno'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Profesión / Título">
                    <input className={inp} value={data.profesion ?? ''} onChange={e => set('profesion', e.target.value)} placeholder="ej. Ingeniero Industrial" />
                  </Field>
                  <Field label="Estudios técnicos">
                    <input className={inp} value={data.estudios_tecnicos ?? ''} onChange={e => set('estudios_tecnicos', e.target.value)} placeholder="Nombre del programa" />
                  </Field>
                  <Field label="Estudios tecnológicos">
                    <input className={inp} value={data.estudios_tecnologicos ?? ''} onChange={e => set('estudios_tecnologicos', e.target.value)} placeholder="Nombre del programa" />
                  </Field>
                  <Field label="Estudios universitarios">
                    <input className={inp} value={data.estudios_universitarios ?? ''} onChange={e => set('estudios_universitarios', e.target.value)} placeholder="Carrera" />
                  </Field>
                  <Field label="Especialización / Posgrado">
                    <input className={inp} value={data.especializacion ?? ''} onChange={e => set('especializacion', e.target.value)} placeholder="Nombre" />
                  </Field>
                  <Field label="Cursos y certificados relevantes">
                    <textarea className={`${inp} resize-none`} rows={2} value={data.cursos_certificados ?? ''} onChange={e => set('cursos_certificados', e.target.value)} placeholder="Lista los más importantes" />
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿Actualmente estudia?" value={data.actualmente_estudia ?? null} onChange={v => set('actualmente_estudia', v)} />
                  </div>
                </div>
              </Section>

              <Section title="Información laboral" icon={Briefcase}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Cargo actual">
                    <input className={inp} value={data.cargo_confirmado ?? ''} onChange={e => set('cargo_confirmado', e.target.value.toUpperCase())} placeholder="CARGO" />
                  </Field>
                  <Field label="Área">
                    <input className={inp} value={data.area_confirmada ?? ''} onChange={e => set('area_confirmada', e.target.value.toUpperCase())} placeholder="ÁREA" />
                  </Field>
                  <Field label="Centro de trabajo / Sede">
                    <input className={inp} value={data.centro_trabajo ?? ''} onChange={e => set('centro_trabajo', e.target.value)} placeholder="Sede o lugar" />
                  </Field>
                  <Field label="Jefe inmediato">
                    <input className={inp} value={data.jefe_inmediato ?? ''} onChange={e => set('jefe_inmediato', e.target.value.toUpperCase())} placeholder="NOMBRE COMPLETO" />
                  </Field>
                  <Field label="Fecha de ingreso">
                    <input type="date" className={inp} value={data.fecha_ingreso ?? ''} onChange={e => set('fecha_ingreso', e.target.value)} />
                  </Field>
                  <Field label="Tipo de contrato">
                    <select value={data.tipo_contrato ?? ''} onChange={e => set('tipo_contrato', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Término indefinido','Término fijo','Obra o labor','Prestación de servicios','Aprendizaje','Temporal'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Jornada laboral">
                    <select value={data.jornada_laboral ?? ''} onChange={e => set('jornada_laboral', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Diurna','Nocturna','Mixta','Por turnos','Flexible','Teletrabajo'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Horario habitual">
                    <input className={inp} value={data.horario_habitual ?? ''} onChange={e => set('horario_habitual', e.target.value)} placeholder="ej. 7:00am - 5:00pm" />
                  </Field>
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <BoolField label="¿Realiza horas extras?" value={data.realiza_horas_extras ?? null} onChange={v => set('realiza_horas_extras', v)} />
                    <BoolField label="¿Trabaja fines de semana?" value={data.trabaja_fines_semana ?? null} onChange={v => set('trabaja_fines_semana', v)} />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ── TALLAS ── */}
          {tab === 'tallas' && (
            <Section title="Perfil físico y tallas de dotación" icon={Shield}>
              <div className="grid grid-cols-2 gap-4">

                {/* Antropometría */}
                <div className="col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-dim)' }}>Antropometría</p>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Estatura (cm) *">
                      <input type="number" className={inp} value={data.estatura_cm ?? ''} onChange={e => set('estatura_cm', +e.target.value)} placeholder="170" />
                    </Field>
                    <Field label="Peso (kg)">
                      <input type="number" className={inp} value={data.peso_kg ?? ''} onChange={e => set('peso_kg', +e.target.value)} placeholder="70" />
                    </Field>
                    <Field label="IMC (calculado)">
                      <div className="terra-input flex items-center justify-between"
                        style={{ background: 'var(--bg-card)', cursor: 'default' }}>
                        {imcVal ? (
                          <>
                            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{imcVal}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: +imcVal < 25 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: +imcVal < 25 ? '#34D399' : '#FBBF24' }}>
                              {imcLabel(+imcVal)}
                            </span>
                          </>
                        ) : <span style={{ color: 'var(--text-faint)' }}>— Ingresa estatura y peso</span>}
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="col-span-2"><div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} /></div>

                {/* Tallas */}
                <div className="col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-dim)' }}>Tallas de dotación</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      ['talla_camisa',     'Camisa *',       ['XS','S','M','L','XL','XXL','XXXL']],
                      ['talla_camiseta',   'Camiseta',       ['XS','S','M','L','XL','XXL','XXXL']],
                      ['talla_pantalon',   'Pantalón',       ['28','30','32','34','36','38','40','42','44']],
                      ['talla_overol',     'Overol',         ['XS','S','M','L','XL','XXL','XXXL']],
                      ['talla_chaqueta',   'Chaqueta',       ['XS','S','M','L','XL','XXL','XXXL']],
                      ['talla_impermeable','Impermeable',    ['XS','S','M','L','XL','XXL','XXXL']],
                      ['talla_zapato',     'Zapato *',       ['34','35','36','37','38','39','40','41','42','43','44','45','46']],
                      ['talla_botas',      'Botas',          ['34','35','36','37','38','39','40','41','42','43','44','45','46']],
                      ['talla_guantes',    'Guantes',        ['XS','S','M','L','XL']],
                    ].map(([key, label, opts]) => (
                      <Field key={key as string} label={label as string}>
                        <select value={(data as any)[key as string] ?? ''} onChange={e => set(key as keyof ProfileData, e.target.value)} className={inp}>
                          <option value="">— Talla</option>
                          {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                        </select>
                      </Field>
                    ))}
                  </div>
                </div>

                <Field label="Observaciones de tallas">
                  <textarea className={`${inp} resize-none`} rows={3}
                    value={data.obs_tallas ?? ''} onChange={e => set('obs_tallas', e.target.value)}
                    placeholder="Necesidades especiales, restricciones, preferencias..." />
                </Field>
              </div>
            </Section>
          )}

          {/* ── ESTILOS DE VIDA ── */}
          {tab === 'estilos' && (
            <div className="space-y-6">
              <Section title="Actividad física" icon={Activity}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <BoolField label="¿Realiza actividad física regularmente?" value={data.realiza_actividad_fisica ?? null} onChange={v => set('realiza_actividad_fisica', v)} />
                  </div>
                  {data.realiza_actividad_fisica && (
                    <>
                      <Field label="Días por semana">
                        <select value={data.dias_actividad_fisica ?? ''} onChange={e => set('dias_actividad_fisica', +e.target.value)} className={inp}>
                          <option value="">Seleccionar</option>
                          {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día{n > 1 ? 's' : ''}</option>)}
                        </select>
                      </Field>
                      <Field label="Actividad que practica">
                        <input className={inp} value={data.tipo_actividad_fisica ?? ''} onChange={e => set('tipo_actividad_fisica', e.target.value)} placeholder="ej. Natación, fútbol, ciclismo" />
                      </Field>
                    </>
                  )}
                </div>
              </Section>

              <Section title="Sueño y descanso" icon={Activity}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Horas de sueño diarias">
                    <select value={data.horas_sueno ?? ''} onChange={e => set('horas_sueno', +e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {[4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} horas</option>)}
                    </select>
                  </Field>
                  <div>
                    <BoolField label="¿Considera que descansa adecuadamente?" value={data.descanso_adecuado ?? null} onChange={v => set('descanso_adecuado', v)} />
                  </div>
                </div>
              </Section>

              <Section title="Alimentación" icon={Activity}>
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿Desayuna diariamente?" value={data.desayuna_diariamente ?? null} onChange={v => set('desayuna_diariamente', v)} />
                  <Field label="Comidas al día">
                    <select value={data.comidas_al_dia ?? ''} onChange={e => set('comidas_al_dia', +e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <BoolField label="¿Consume frutas diariamente?" value={data.consume_frutas ?? null} onChange={v => set('consume_frutas', v)} />
                  <BoolField label="¿Consume verduras diariamente?" value={data.consume_verduras ?? null} onChange={v => set('consume_verduras', v)} />
                </div>
              </Section>

              <Section title="Hábitos" icon={Activity}>
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿Fuma?" value={data.fuma ?? null} onChange={v => set('fuma', v)} />
                  {data.fuma && (
                    <Field label="Cigarrillos por día">
                      <input type="number" min={1} className={inp} value={data.cigarrillos_dia ?? ''} onChange={e => set('cigarrillos_dia', +e.target.value)} />
                    </Field>
                  )}
                  <Field label="Consumo de bebidas alcohólicas">
                    <select value={data.consumo_alcohol ?? ''} onChange={e => set('consumo_alcohol', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Nunca','Ocasionalmente','Semanalmente','Frecuentemente'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <BoolField label="¿Consume bebidas energizantes?" value={data.consume_energizantes ?? null} onChange={v => set('consume_energizantes', v)} />
                  <Field label="¿Consume sustancias psicoactivas?">
                    <select value={data.consume_psicoactivos ?? ''} onChange={e => set('consume_psicoactivos', e.target.value)} className={inp}>
                      <option value="">Seleccionar</option>
                      {['Sí','No','Prefiero no responder'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {/* ── SALUD ── */}
          {tab === 'salud' && (
            <div className="space-y-6">
              <Section title="Antecedentes médicos personales" icon={Heart}>
                <div className="grid grid-cols-2 gap-4">
                  <CheckGroup label="Enfermedades diagnosticadas (seleccione las que aplican)"
                    options={['Hipertensión','Diabetes','Enf. cardiovasculares','Enf. respiratorias','Enf. osteomusculares','Enf. neurológicas','Alteraciones visuales','Alteraciones auditivas','Enf. mentales','Otra']}
                    value={data.enfermedades_diagnosticadas ?? []}
                    onChange={v => setArr('enfermedades_diagnosticadas', v)} />
                  <BoolField label="¿Ha sido hospitalizado?" value={data.hospitalizado ?? null} onChange={v => set('hospitalizado', v)} />
                  <BoolField label="¿Ha tenido cirugías?" value={data.cirugias ?? null} onChange={v => set('cirugias', v)} />
                  {data.cirugias && (
                    <Field label="¿Cuáles cirugías y en qué año?">
                      <textarea className={`${inp} resize-none`} rows={2} value={data.cirugias_detalle ?? ''} onChange={e => set('cirugias_detalle', e.target.value)} placeholder="ej. Apendicectomía 2019" />
                    </Field>
                  )}
                  <BoolField label="¿Presenta alergias?" value={data.alergias ?? null} onChange={v => set('alergias', v)} />
                  {data.alergias && (
                    <Field label="Describa sus alergias">
                      <textarea className={`${inp} resize-none`} rows={2} value={data.alergias_detalle ?? ''} onChange={e => set('alergias_detalle', e.target.value)} placeholder="Medicamentos, alimentos, materiales..." />
                    </Field>
                  )}
                  <BoolField label="¿Toma medicamentos permanentemente?" value={data.medicamentos_permanentes ?? null} onChange={v => set('medicamentos_permanentes', v)} />
                  {data.medicamentos_permanentes && (
                    <Field label="¿Cuáles medicamentos?">
                      <input className={inp} value={data.medicamentos_detalle ?? ''} onChange={e => set('medicamentos_detalle', e.target.value)} placeholder="Nombre de medicamentos" />
                    </Field>
                  )}
                  <BoolField label="¿Presenta alguna limitación física?" value={data.limitacion_fisica ?? null} onChange={v => set('limitacion_fisica', v)} />
                  {data.limitacion_fisica && (
                    <Field label="Describa la limitación">
                      <textarea className={`${inp} resize-none`} rows={2} value={data.limitacion_detalle ?? ''} onChange={e => set('limitacion_detalle', e.target.value)} />
                    </Field>
                  )}
                </div>
              </Section>

              <Section title="Antecedentes familiares" icon={Heart}>
                <CheckGroup label="Seleccione si existen antecedentes de:"
                  options={['Diabetes','Hipertensión','Cáncer','Enf. cardiovasculares','Enf. mentales','Otros']}
                  value={data.antecedentes_familiares ?? []}
                  onChange={v => setArr('antecedentes_familiares', v)} />
              </Section>

              <Section title="Salud ocupacional" icon={Shield}>
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿Ha sufrido accidentes de trabajo anteriormente?" value={data.accidentes_trabajo ?? null} onChange={v => set('accidentes_trabajo', v)} />
                  <BoolField label="¿Ha tenido enfermedades laborales?" value={data.enfermedades_laborales ?? null} onChange={v => set('enfermedades_laborales', v)} />
                  <BoolField label="¿Tiene restricciones médicas laborales?" value={data.restricciones_medicas ?? null} onChange={v => set('restricciones_medicas', v)} />
                  {data.restricciones_medicas && (
                    <Field label="Describa las restricciones">
                      <textarea className={`${inp} resize-none`} rows={2} value={data.restricciones_detalle ?? ''} onChange={e => set('restricciones_detalle', e.target.value)} />
                    </Field>
                  )}
                  <BoolField label="¿Usa gafas formuladas?" value={data.usa_gafas ?? null} onChange={v => set('usa_gafas', v)} />
                  <BoolField label="¿Usa audífonos?" value={data.usa_audifonos ?? null} onChange={v => set('usa_audifonos', v)} />
                </div>
              </Section>

              <Section title="Riesgo psicosocial" icon={Heart}>
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿Considera que su trabajo le genera estrés?" value={data.trabajo_genera_estres ?? null} onChange={v => set('trabajo_genera_estres', v)} />
                  <BoolField label="¿Cuenta con apoyo familiar?" value={data.apoyo_familiar ?? null} onChange={v => set('apoyo_familiar', v)} />
                  <BoolField label="¿Tiene otro empleo?" value={data.otro_empleo ?? null} onChange={v => set('otro_empleo', v)} />
                  <BoolField label="¿Es cuidador de otra persona?" value={data.es_cuidador ?? null} onChange={v => set('es_cuidador', v)} />
                  <BoolField label="¿Tiene dificultades económicas importantes?" value={data.dificultades_economicas ?? null} onChange={v => set('dificultades_economicas', v)} />
                  <BoolField label="¿Considera adecuado el equilibrio trabajo/vida?" value={data.equilibrio_trabajo_vida ?? null} onChange={v => set('equilibrio_trabajo_vida', v)} />
                </div>
              </Section>
            </div>
          )}

          {/* ── CIERRE ── */}
          {tab === 'cierre' && (
            <div className="space-y-6">
              <Section title="Competencias y certificaciones" icon={Award}>
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿Tiene licencia de conducción?" value={data.licencia_conduccion ?? null} onChange={v => set('licencia_conduccion', v)} />
                  {data.licencia_conduccion && (
                    <Field label="Categoría de licencia">
                      <select value={data.categoria_licencia ?? ''} onChange={e => set('categoria_licencia', e.target.value)} className={inp}>
                        <option value="">Seleccionar</option>
                        {['A1','A2','B1','B2','B3','C1','C2','C3'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                  )}
                  <CheckGroup label="Certificaciones y competencias que posee:"
                    options={['Trabajo en alturas','Brigadista','Primeros auxilios','Montacargas','Espacios confinados','Manejo de químicos','Soldadura','Cargue y descargue']}
                    value={data.certificaciones ?? []}
                    onChange={v => setArr('certificaciones', v)} />
                  <Field label="Otras certificaciones">
                    <textarea className={`${inp} resize-none`} rows={2} value={data.otras_certificaciones ?? ''} onChange={e => set('otras_certificaciones', e.target.value)} placeholder="Otras certificaciones no listadas..." />
                  </Field>
                </div>
              </Section>

              <Section title="Consentimientos" icon={FileText}>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-dim)' }}>
                      La información registrada en este formulario será utilizada exclusivamente por el área de
                      Talento Humano y Seguridad y Salud en el Trabajo de su empresa, para fines de gestión del
                      bienestar, prevención de riesgos y cumplimiento legal. Sus datos son confidenciales y
                      están protegidos según la Ley 1581 de 2012 (Habeas Data).
                    </p>
                  </div>

                  {[
                    { key: 'autoriza_datos',    label: 'Autorizo el tratamiento de mis datos personales conforme a la política de privacidad de la empresa.' },
                    { key: 'declara_veracidad', label: 'Declaro que la información suministrada es verídica y me comprometo a actualizarla cuando haya cambios.' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-all"
                      style={{ background: (data as any)[key] ? 'rgba(16,185,129,0.06)' : 'var(--bg-card)', border: `1px solid ${(data as any)[key] ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
                      <input type="checkbox" checked={(data as any)[key] ?? false}
                        onChange={e => set(key as keyof ProfileData, e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-green-500 flex-shrink-0" />
                      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{label}</span>
                    </label>
                  ))}

                  {data.autoriza_datos && data.declara_veracidad && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl text-center"
                      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle size={28} className="mx-auto mb-2" style={{ color: '#34D399' }} />
                      <p className="font-semibold text-sm" style={{ color: '#34D399' }}>Consentimientos aceptados</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(52,211,153,0.7)' }}>
                        Haz clic en <strong>Guardar</strong> para finalizar tu perfil
                      </p>
                    </motion.div>
                  )}
                </div>
              </Section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating save */}
      <div className="fixed bottom-6 right-6 z-30">
        <button onClick={save} disabled={saving}
          className="terra-btn shadow-lg"
          style={{ padding: '12px 24px', fontSize: 14 }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="terra-card p-5">
      <div className="flex items-center gap-2.5 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-dim)' }}>
          <Icon size={15} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}
