'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Camera, CheckCircle, Clock, Loader2, Save,
  Heart, Briefcase, GraduationCap, Activity, Shield, Award,
  FileText, Home, Car, ChevronRight, Info, AlertCircle
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────
type Nullable<T> = T | null | undefined
interface ProfileData {
  photo_url?: string
  doc_type?: string; nombres?: string; apellidos?: string
  fecha_nacimiento?: string; sexo?: string; estado_civil?: string
  nacionalidad?: string; ciudad_nacimiento?: string; depto_nacimiento?: string
  ciudad_residencia?: string; depto_residencia?: string
  direccion?: string; barrio?: string; telefono?: string; email_personal?: string
  con_quien_vive?: string; num_personas_hogar?: number; num_hijos?: number
  dependientes_economicos?: number; cabeza_hogar?: Nullable<boolean>
  contacto_emergencia?: string; parentesco_contacto?: string; tel_contacto?: string
  tipo_vivienda?: string; tenencia_vivienda?: string; estrato?: number
  servicios_publicos?: string[]; acceso_internet?: Nullable<boolean>
  nivel_educativo?: string; profesion?: string; estudios_tecnicos?: string
  estudios_tecnologicos?: string; estudios_universitarios?: string
  especializacion?: string; otros_estudios?: string; cursos_certificados?: string
  actualmente_estudia?: Nullable<boolean>
  cargo_confirmado?: string; area_confirmada?: string; centro_trabajo?: string
  jefe_inmediato?: string; fecha_ingreso?: string; tipo_contrato?: string
  jornada_laboral?: string; horario_habitual?: string
  realiza_horas_extras?: Nullable<boolean>; trabaja_fines_semana?: Nullable<boolean>
  estatura_cm?: number; peso_kg?: number
  talla_camisa?: string; talla_camiseta?: string; talla_pantalon?: string
  talla_overol?: string; talla_chaqueta?: string; talla_impermeable?: string
  talla_zapato?: string; talla_botas?: string; talla_guantes?: string; obs_tallas?: string
  municipio_vivienda?: string; medio_transporte?: string
  tiempo_desplazamiento?: string; distancia_aprox?: string
  conduce_vehiculo?: Nullable<boolean>; tipo_vehiculo?: string
  realiza_actividad_fisica?: Nullable<boolean>; dias_actividad_fisica?: number
  tipo_actividad_fisica?: string; horas_sueno?: number; descanso_adecuado?: Nullable<boolean>
  desayuna_diariamente?: Nullable<boolean>; comidas_al_dia?: number
  consume_frutas?: Nullable<boolean>; consume_verduras?: Nullable<boolean>
  fuma?: Nullable<boolean>; cigarrillos_dia?: number; consumo_alcohol?: string
  consume_energizantes?: Nullable<boolean>; consume_psicoactivos?: string
  enfermedades_diagnosticadas?: string[]; enfermedades_otra?: string
  hospitalizado?: Nullable<boolean>
  cirugias?: Nullable<boolean>; cirugias_detalle?: string
  alergias?: Nullable<boolean>; alergias_detalle?: string
  medicamentos_permanentes?: Nullable<boolean>; medicamentos_detalle?: string
  limitacion_fisica?: Nullable<boolean>; limitacion_detalle?: string
  antecedentes_familiares?: string[]; antecedentes_familiares_otra?: string
  accidentes_trabajo?: Nullable<boolean>; enfermedades_laborales?: Nullable<boolean>
  restricciones_medicas?: Nullable<boolean>; restricciones_detalle?: string
  usa_gafas?: Nullable<boolean>; usa_audifonos?: Nullable<boolean>
  trabajo_genera_estres?: Nullable<boolean>; apoyo_familiar?: Nullable<boolean>
  otro_empleo?: Nullable<boolean>; es_cuidador?: Nullable<boolean>
  dificultades_economicas?: Nullable<boolean>; equilibrio_trabajo_vida?: Nullable<boolean>
  licencia_conduccion?: Nullable<boolean>; categoria_licencia?: string
  certificaciones?: string[]; otras_certificaciones?: string
  autoriza_datos?: boolean; declara_veracidad?: boolean
  completion_pct?: number; updated_at?: string
}

const LS_KEY = 'sst_profile_draft'

// ─── Completion calc ─────────────────────────────────────────────────
function calcSections(d: ProfileData) {
  return {
    'Foto':               !!d.photo_url,
    'Datos personales':   !!(d.nombres && d.apellidos && d.fecha_nacimiento && d.sexo),
    'Contacto emergencia':!!(d.contacto_emergencia && d.tel_contacto),
    'Vivienda':           !!d.tipo_vivienda,
    'Educación':          !!d.nivel_educativo,
    'Información laboral':!!(d.fecha_ingreso || d.tipo_contrato),
    'Tallas / EPP':       !!(d.estatura_cm && d.talla_camisa && d.talla_zapato),
    'Desplazamiento':     !!d.municipio_vivienda,
    'Hábitos':            d.realiza_actividad_fisica != null,
    'Antecedentes médicos': d.hospitalizado != null,
    'Ant. familiares':    !!(d.antecedentes_familiares?.length),
    'Salud ocupacional':  d.accidentes_trabajo != null,
    'Riesgo psicosocial': d.trabajo_genera_estres != null,
    'Competencias':       d.licencia_conduccion != null,
    'Consentimientos':    !!(d.autoriza_datos && d.declara_veracidad),
  }
}
function calcPct(d: ProfileData) {
  const s = calcSections(d)
  return Math.round((Object.values(s).filter(Boolean).length / 15) * 100)
}

// ─── Client-side image compression ───────────────────────────────────
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 600
      let { width, height } = img
      if (width > height) { if (width > MAX) { height = Math.round(height * MAX / width); width = MAX } }
      else { if (height > MAX) { width = Math.round(width * MAX / height); height = MAX } }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compresión fallida')), 'image/jpeg', 0.72)
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── Tiny helpers ─────────────────────────────────────────────────────
const UP = (s: string) => s.toUpperCase()
const inp = 'terra-input text-sm'

function Tip({ text }: { text: string }) {
  return <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-faint)' }}><Info size={10} />{text}</p>
}

function Field({ label, tip, span2, children }: { label: string; tip?: string; span2?: boolean; children: React.ReactNode }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>{label}</label>
      {children}
      {tip && <Tip text={tip} />}
    </div>
  )
}

function BoolField({ label, value, onChange, tip }: { label: string; value: Nullable<boolean>; onChange: (v: boolean) => void; tip?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <div className="flex gap-2">
        {[{ v: true, l: '✓  SÍ' }, { v: false, l: '✗  NO' }].map(({ v, l }) => (
          <button key={l} type="button" onClick={() => onChange(v)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={value === v
              ? { background: v ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', border: `1px solid ${v ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)'}`, color: v ? '#34D399' : '#F87171' }
              : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
            {l}
          </button>
        ))}
      </div>
      {tip && <Tip text={tip} />}
    </div>
  )
}

function CheckGroup({ label, options, value, onChange, tip, otherValue, onOtherChange, otherLabel }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void
  tip?: string; otherValue?: string; onOtherChange?: (v: string) => void; otherLabel?: string
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt])
  // detect if any selected option is an "OTRA/OTRO/OTRAS" variant
  const showOther = onOtherChange && value.some(v => /^OTRA[S]?$|^OTRO[S]?$/.test(v.trim()))
  return (
    <div className="col-span-2">
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className="text-xs px-3 py-2 rounded-xl font-semibold transition-all"
            style={value.includes(opt)
              ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#60A5FA' }
              : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            {value.includes(opt) ? '✓ ' : ''}{opt}
          </button>
        ))}
      </div>
      {showOther && (
        <div className="mt-3">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
            {otherLabel ?? '¿CUÁL(ES)? ESPECIFICA AQUÍ:'}
          </label>
          <input className="terra-input text-sm w-full" value={otherValue ?? ''}
            onChange={e => onOtherChange!(UP(e.target.value))}
            placeholder="DESCRIBE LAS OPCIONES ADICIONALES..." spellCheck={false} />
        </div>
      )}
      {tip && <Tip text={tip} />}
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, accent }: { title: string; icon: any; children: React.ReactNode; accent?: string }) {
  return (
    <div className="terra-card p-5">
      <div className="flex items-center gap-2.5 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent ? `${accent}18` : 'var(--primary-dim)' }}>
          <Icon size={15} style={{ color: accent ?? 'var(--primary)' }} />
        </div>
        <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'personal', label: 'Personal',       icon: User,          color: '#3B82F6' },
  { id: 'familia',  label: 'Familia',         icon: Home,          color: '#8B5CF6' },
  { id: 'laboral',  label: 'Laboral',         icon: Briefcase,     color: '#06B6D4' },
  { id: 'tallas',   label: 'Tallas / EPP',    icon: Shield,        color: '#10B981' },
  { id: 'estilos',  label: 'Estilos de vida', icon: Activity,      color: '#F59E0B' },
  { id: 'salud',    label: 'Salud',           icon: Heart,         color: '#EF4444' },
  { id: 'cierre',   label: 'Cierre',          icon: Award,         color: '#EC4899' },
]

// which sections map to each tab (for per-tab progress dot)
const TAB_SECTIONS: Record<string, string[]> = {
  personal: ['Foto', 'Datos personales'],
  familia:  ['Contacto emergencia', 'Vivienda', 'Desplazamiento'],
  laboral:  ['Educación', 'Información laboral'],
  tallas:   ['Tallas / EPP'],
  estilos:  ['Hábitos'],
  salud:    ['Antecedentes médicos', 'Ant. familiares', 'Salud ocupacional', 'Riesgo psicosocial'],
  cierre:   ['Competencias', 'Consentimientos'],
}

export default function MyProfilePage() {
  const [data, setData]             = useState<ProfileData>({})
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState<'saved' | 'local' | null>(null)
  const [serverErr, setServerErr]   = useState<string | null>(null)
  const [tab, setTab]               = useState('personal')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load: API first, fall back to localStorage draft
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : {})
      .then((remote: ProfileData) => {
        const remotePct = remote?.completion_pct ?? 0
        const draft = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} } })()
        const draftPct = calcPct(draft)
        // Use whichever is more complete
        setData(draftPct > remotePct ? { ...remote, ...draft } : remote ?? {})
        setLoading(false)
      })
      .catch(() => {
        try { const d = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); setData(d) } catch {}
        setLoading(false)
      })
  }, [])

  const set = useCallback((key: keyof ProfileData, val: any) =>
    setData(prev => ({ ...prev, [key]: val })), [])

  const setArr = useCallback((key: keyof ProfileData, val: string[]) =>
    setData(prev => ({ ...prev, [key]: val })), [])

  // Auto-save to localStorage on every change (debounced 800ms)
  useEffect(() => {
    if (loading) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(data))
    }, 800)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [data, loading])

  const save = async (silent = false) => {
    if (!silent) setSaving(true)
    // Always persist locally first — data is never lost
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        localStorage.removeItem(LS_KEY)
        setServerErr(null)
        if (!silent) { setSaveMsg('saved'); setTimeout(() => setSaveMsg(null), 2500) }
      } else {
        const body = await res.json().catch(() => ({}))
        const msg = body?.error ?? `HTTP ${res.status}`
        setServerErr(msg)
        if (!silent) { setSaveMsg('local'); setTimeout(() => setSaveMsg(null), 3500) }
      }
    } catch (e: any) {
      setServerErr(e?.message ?? 'Error de red')
      if (!silent) { setSaveMsg('local'); setTimeout(() => setSaveMsg(null), 3500) }
    } finally {
      if (!silent) setSaving(false)
    }
  }

  // Save to server when switching tabs
  const switchTab = (t: string) => {
    save(true)
    setTab(t)
  }

  // Photo upload with client-side compression
  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setPhotoError('Solo se aceptan imágenes JPG, PNG o WEBP')
      if (photoRef.current) photoRef.current.value = ''
      return
    }

    setUploadingPhoto(true)
    try {
      // Compress on client before sending
      const compressed = await compressImage(file)
      const form = new FormData()
      form.append('file', compressed, 'photo.jpg')
      const res = await fetch('/api/profile/photo', { method: 'POST', body: form })
      if (res.ok) {
        const { url } = await res.json()
        set('photo_url', url)
      } else {
        const err = await res.json()
        setPhotoError(err.error ?? 'Error al subir la foto')
      }
    } catch {
      setPhotoError('Error al procesar la imagen')
    } finally {
      setUploadingPhoto(false)
      if (photoRef.current) photoRef.current.value = ''
    }
  }

  const sections = calcSections(data)
  const pct      = calcPct(data)
  const doneCount = Object.values(sections).filter(Boolean).length

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando tu perfil...</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">

      {/* ── Header card ── */}
      <div className="terra-card p-5 mb-5">
        <div className="flex items-start gap-4 flex-wrap">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: 'var(--primary-dim)', border: '2px solid var(--primary-border)' }}>
              {data.photo_url
                ? <img src={data.photo_url} alt="foto de perfil" className="w-full h-full object-cover" />
                : (
                  <div className="flex flex-col items-center gap-1">
                    <User size={26} style={{ color: 'var(--primary)' }} />
                    <span className="text-[9px] font-semibold" style={{ color: 'var(--primary)' }}>SIN FOTO</span>
                  </div>
                )}
            </div>
            <button onClick={() => photoRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              style={{ background: 'var(--primary)', border: '2px solid var(--bg-surface)' }}
              title="Cambiar foto de perfil">
              {uploadingPhoto
                ? <Loader2 size={13} className="animate-spin text-white" />
                : <Camera size={13} className="text-white" />}
            </button>
            <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={uploadPhoto} className="hidden" />
          </div>

          {/* Name + progress */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
              {data.nombres && data.apellidos
                ? `${data.nombres} ${data.apellidos}`
                : <span style={{ color: 'var(--text-faint)' }}>COMPLETA TU NOMBRE EN LA PESTAÑA PERSONAL</span>}
            </h1>
            {data.cargo_confirmado && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{data.cargo_confirmado}</p>
            )}

            {/* Progress bar */}
            <div className="mt-3 mb-2">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
                  Perfil completado — {doneCount} de 15 secciones
                </span>
                <span className="text-sm font-bold" style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}>{pct}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{ background: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }} />
              </div>
            </div>

            {photoError && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#F87171' }}>
                <AlertCircle size={11} />{photoError}
              </p>
            )}
            {serverErr && (
              <div className="mt-2 px-3 py-2 rounded-lg text-xs flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span><strong>Error al guardar en servidor:</strong> {serverErr}</span>
              </div>
            )}
            {!data.photo_url && !photoError && (
              <p className="text-[11px] mt-1 flex items-center gap-1 cursor-pointer hover:underline"
                style={{ color: 'var(--primary)' }} onClick={() => photoRef.current?.click()}>
                <Camera size={11} />Toca aquí para agregar tu foto — JPG/PNG, máximo 5 MB
              </p>
            )}
          </div>

          {/* Save button */}
          <button onClick={() => save(false)} disabled={saving}
            className="terra-btn flex-shrink-0 self-start gap-1.5"
            style={{ padding: '10px 18px', fontSize: 13,
              background: saveMsg === 'saved' ? '#10B981' : saveMsg === 'local' ? '#F59E0B' : undefined }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saveMsg === 'saved' ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? 'GUARDANDO...' : saveMsg === 'saved' ? '¡GUARDADO!' : saveMsg === 'local' ? '¡GUARDADO LOCALMENTE!' : 'GUARDAR'}
          </button>
        </div>

        {/* Section status chips */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          {Object.entries(sections).map(([name, done]) => (
            <span key={name}
              className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-semibold"
              style={done
                ? { background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'var(--bg-card)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
              {done ? <CheckCircle size={9} /> : <Clock size={9} />} {name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const tabSecs = TAB_SECTIONS[t.id] ?? []
          const done = tabSecs.every(s => sections[s as keyof typeof sections])
          const partial = !done && tabSecs.some(s => sections[s as keyof typeof sections])
          return (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 relative"
              style={tab === t.id
                ? { background: t.color, color: '#fff', boxShadow: `0 4px 12px ${t.color}40` }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Icon size={13} />
              {t.label}
              {done && (
                <span className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5"
                  style={{ background: '#10B981', border: '1px solid var(--bg-surface)' }} />
              )}
              {partial && !done && (
                <span className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5"
                  style={{ background: '#F59E0B', border: '1px solid var(--bg-surface)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.16 }}>

          {/* ════ PERSONAL ════ */}
          {tab === 'personal' && (
            <SectionCard title="Información personal" icon={User} accent="#3B82F6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="TIPO DE DOCUMENTO">
                  <select value={data.doc_type ?? ''} onChange={e => set('doc_type', e.target.value)} className={inp}>
                    <option value="">— Seleccionar —</option>
                    {['CÉDULA DE CIUDADANÍA','CÉDULA DE EXTRANJERÍA','TARJETA DE IDENTIDAD','PASAPORTE','NIT'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="NOMBRES *" tip="Escribe exactamente como aparece en tu documento">
                  <input className={inp} value={data.nombres ?? ''}
                    onChange={e => set('nombres', UP(e.target.value))}
                    placeholder="TUS NOMBRES" autoComplete="given-name" spellCheck={false} />
                </Field>
                <Field label="APELLIDOS *" tip="Escribe exactamente como aparece en tu documento">
                  <input className={inp} value={data.apellidos ?? ''}
                    onChange={e => set('apellidos', UP(e.target.value))}
                    placeholder="TUS APELLIDOS" autoComplete="family-name" spellCheck={false} />
                </Field>
                <Field label="FECHA DE NACIMIENTO *">
                  <input type="date" className={inp} value={data.fecha_nacimiento ?? ''}
                    onChange={e => set('fecha_nacimiento', e.target.value)} />
                </Field>
                <Field label="SEXO *">
                  <select value={data.sexo ?? ''} onChange={e => set('sexo', e.target.value)} className={inp}>
                    <option value="">— Seleccionar —</option>
                    {['MASCULINO','FEMENINO','NO BINARIO','PREFIERO NO INDICAR'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="ESTADO CIVIL">
                  <select value={data.estado_civil ?? ''} onChange={e => set('estado_civil', e.target.value)} className={inp}>
                    <option value="">— Seleccionar —</option>
                    {['SOLTERO/A','CASADO/A','UNIÓN LIBRE','DIVORCIADO/A','VIUDO/A','SEPARADO/A'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="NACIONALIDAD">
                  <input className={inp} value={data.nacionalidad ?? 'COLOMBIANA'}
                    onChange={e => set('nacionalidad', UP(e.target.value))} spellCheck={false} />
                </Field>
                <Field label="CIUDAD DE NACIMIENTO">
                  <input className={inp} value={data.ciudad_nacimiento ?? ''}
                    onChange={e => set('ciudad_nacimiento', UP(e.target.value))} placeholder="EJ: BOGOTÁ" spellCheck={false} />
                </Field>
                <Field label="DEPARTAMENTO DE NACIMIENTO">
                  <input className={inp} value={data.depto_nacimiento ?? ''}
                    onChange={e => set('depto_nacimiento', UP(e.target.value))} placeholder="EJ: CUNDINAMARCA" spellCheck={false} />
                </Field>
                <Field label="CIUDAD DE RESIDENCIA ACTUAL">
                  <input className={inp} value={data.ciudad_residencia ?? ''}
                    onChange={e => set('ciudad_residencia', UP(e.target.value))} placeholder="EJ: MEDELLÍN" spellCheck={false} />
                </Field>
                <Field label="DEPARTAMENTO DE RESIDENCIA">
                  <input className={inp} value={data.depto_residencia ?? ''}
                    onChange={e => set('depto_residencia', UP(e.target.value))} placeholder="EJ: ANTIOQUIA" spellCheck={false} />
                </Field>
                <Field label="DIRECCIÓN COMPLETA" span2>
                  <input className={inp} value={data.direccion ?? ''}
                    onChange={e => set('direccion', UP(e.target.value))} placeholder="EJ: CALLE 45 # 23-10 APTO 301" spellCheck={false} />
                </Field>
                <Field label="BARRIO">
                  <input className={inp} value={data.barrio ?? ''}
                    onChange={e => set('barrio', UP(e.target.value))} placeholder="NOMBRE DEL BARRIO" spellCheck={false} />
                </Field>
                <Field label="TELÉFONO / CELULAR" tip="Número de 10 dígitos">
                  <input className={inp} value={data.telefono ?? ''}
                    onChange={e => set('telefono', e.target.value)} placeholder="300 123 4567"
                    type="tel" inputMode="numeric" maxLength={15} />
                </Field>
                <Field label="CORREO ELECTRÓNICO PERSONAL" span2>
                  <input type="email" className={inp} value={data.email_personal ?? ''}
                    onChange={e => set('email_personal', e.target.value.toLowerCase())} placeholder="correo@ejemplo.com"
                    autoComplete="email" />
                </Field>
              </div>
              <TabNav onNext={() => switchTab('familia')} nextLabel="Siguiente: Familia" />
            </SectionCard>
          )}

          {/* ════ FAMILIA ════ */}
          {tab === 'familia' && (
            <div className="space-y-5">
              <SectionCard title="Composición familiar" icon={Home} accent="#8B5CF6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="¿CON QUIÉN VIVE?">
                    <select value={data.con_quien_vive ?? ''} onChange={e => set('con_quien_vive', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['SOLO/A','CON PAREJA','CON PAREJA E HIJOS','CON PADRES','CON FAMILIA EXTENDIDA','CON COMPAÑEROS DE HABITACIÓN','OTRA SITUACIÓN'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="N.° DE PERSONAS EN EL HOGAR">
                    <input type="number" min={1} max={20} className={inp} value={data.num_personas_hogar ?? ''}
                      onChange={e => set('num_personas_hogar', +e.target.value)} inputMode="numeric" />
                  </Field>
                  <Field label="N.° DE HIJOS">
                    <input type="number" min={0} max={20} className={inp} value={data.num_hijos ?? ''}
                      onChange={e => set('num_hijos', +e.target.value)} inputMode="numeric" />
                  </Field>
                  <Field label="PERSONAS QUE DEPENDEN ECONÓMICAMENTE DE USTED">
                    <input type="number" min={0} max={20} className={inp} value={data.dependientes_economicos ?? ''}
                      onChange={e => set('dependientes_economicos', +e.target.value)} inputMode="numeric" />
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿ES CABEZA DE HOGAR?" value={data.cabeza_hogar ?? null} onChange={v => set('cabeza_hogar', v)}
                      tip="Persona que aporta el ingreso principal del hogar" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Contacto de emergencia *" icon={AlertCircle} accent="#EF4444">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NOMBRE COMPLETO DEL CONTACTO *">
                    <input className={inp} value={data.contacto_emergencia ?? ''}
                      onChange={e => set('contacto_emergencia', UP(e.target.value))} placeholder="NOMBRE COMPLETO" spellCheck={false} />
                  </Field>
                  <Field label="PARENTESCO O RELACIÓN *">
                    <select value={data.parentesco_contacto ?? ''} onChange={e => set('parentesco_contacto', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['CÓNYUGE / PAREJA','MADRE','PADRE','HIJO/A','HERMANO/A','OTRO FAMILIAR','AMIGO/A'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="TELÉFONO DE EMERGENCIA *" tip="Debe ser diferente al tuyo">
                    <input className={inp} value={data.tel_contacto ?? ''}
                      onChange={e => set('tel_contacto', e.target.value)} placeholder="300 123 4567"
                      type="tel" inputMode="numeric" maxLength={15} />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Información de vivienda" icon={Home} accent="#8B5CF6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="TIPO DE VIVIENDA *">
                    <select value={data.tipo_vivienda ?? ''} onChange={e => set('tipo_vivienda', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['CASA','APARTAMENTO','CUARTO','FINCA','OTRO'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="LA VIVIENDA ES…">
                    <select value={data.tenencia_vivienda ?? ''} onChange={e => set('tenencia_vivienda', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['PROPIA PAGADA','PROPIA EN CRÉDITO','ARRENDADA','FAMILIAR','OTRA'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="ESTRATO SOCIOECONÓMICO">
                    <select value={data.estrato ?? ''} onChange={e => set('estrato', +e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>ESTRATO {n}</option>)}
                    </select>
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿TIENE INTERNET EN CASA?" value={data.acceso_internet ?? null} onChange={v => set('acceso_internet', v)} />
                  </div>
                  <CheckGroup label="SERVICIOS PÚBLICOS DISPONIBLES EN SU VIVIENDA"
                    options={['AGUA','LUZ','GAS','ALCANTARILLADO','INTERNET','TELÉFONO FIJO']}
                    value={data.servicios_publicos ?? []}
                    onChange={v => setArr('servicios_publicos', v)} />
                </div>
              </SectionCard>

              <SectionCard title="Desplazamiento al trabajo" icon={Car} accent="#06B6D4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="MUNICIPIO DONDE VIVE *" tip="Ciudad o municipio desde donde se desplaza al trabajo">
                    <input className={inp} value={data.municipio_vivienda ?? ''}
                      onChange={e => set('municipio_vivienda', UP(e.target.value))} placeholder="EJ: ITAGÜÍ" spellCheck={false} />
                  </Field>
                  <Field label="MEDIO DE TRANSPORTE PRINCIPAL">
                    <select value={data.medio_transporte ?? ''} onChange={e => set('medio_transporte', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['A PIE','BICICLETA','MOTO PROPIA','CARRO PROPIO','TRANSPORTE PÚBLICO','SERVICIO DE LA EMPRESA','TAXI / UBER','COMBINADO'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="TIEMPO PROMEDIO DE DESPLAZAMIENTO">
                    <select value={data.tiempo_desplazamiento ?? ''} onChange={e => set('tiempo_desplazamiento', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['MENOS DE 15 MIN','15 - 30 MIN','30 - 60 MIN','1 A 2 HORAS','MÁS DE 2 HORAS'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="DISTANCIA APROXIMADA">
                    <input className={inp} value={data.distancia_aprox ?? ''}
                      onChange={e => set('distancia_aprox', UP(e.target.value))} placeholder="EJ: 5 KM" spellCheck={false} />
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿CONDUCE UN VEHÍCULO PROPIO PARA IR AL TRABAJO?" value={data.conduce_vehiculo ?? null} onChange={v => set('conduce_vehiculo', v)} />
                  </div>
                  {data.conduce_vehiculo && (
                    <Field label="TIPO DE VEHÍCULO">
                      <select value={data.tipo_vehiculo ?? ''} onChange={e => set('tipo_vehiculo', e.target.value)} className={inp}>
                        <option value="">— Seleccionar —</option>
                        {['MOTO','AUTOMÓVIL','CAMIONETA','OTRO'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                  )}
                </div>
              </SectionCard>
              <TabNav onPrev={() => switchTab('personal')} onNext={() => switchTab('laboral')} nextLabel="Siguiente: Laboral" />
            </div>
          )}

          {/* ════ LABORAL ════ */}
          {tab === 'laboral' && (
            <div className="space-y-5">
              <SectionCard title="Nivel educativo" icon={GraduationCap} accent="#06B6D4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NIVEL EDUCATIVO MÁS ALTO ALCANZADO *">
                    <select value={data.nivel_educativo ?? ''} onChange={e => set('nivel_educativo', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['PRIMARIA','SECUNDARIA','BACHILLERATO','TÉCNICO','TECNÓLOGO','UNIVERSITARIO','ESPECIALIZACIÓN','MAESTRÍA','DOCTORADO','NINGUNO'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="PROFESIÓN / TÍTULO OBTENIDO" tip="Si no tiene título, deje en blanco">
                    <input className={inp} value={data.profesion ?? ''}
                      onChange={e => set('profesion', UP(e.target.value))} placeholder="EJ: INGENIERO INDUSTRIAL" spellCheck={false} />
                  </Field>
                  <Field label="ESTUDIOS TÉCNICOS (SI APLICA)">
                    <input className={inp} value={data.estudios_tecnicos ?? ''}
                      onChange={e => set('estudios_tecnicos', UP(e.target.value))} placeholder="NOMBRE DEL PROGRAMA" spellCheck={false} />
                  </Field>
                  <Field label="ESTUDIOS TECNOLÓGICOS (SI APLICA)">
                    <input className={inp} value={data.estudios_tecnologicos ?? ''}
                      onChange={e => set('estudios_tecnologicos', UP(e.target.value))} placeholder="NOMBRE DEL PROGRAMA" spellCheck={false} />
                  </Field>
                  <Field label="CARRERA UNIVERSITARIA (SI APLICA)">
                    <input className={inp} value={data.estudios_universitarios ?? ''}
                      onChange={e => set('estudios_universitarios', UP(e.target.value))} placeholder="NOMBRE DE LA CARRERA" spellCheck={false} />
                  </Field>
                  <Field label="ESPECIALIZACIÓN / POSGRADO (SI APLICA)">
                    <input className={inp} value={data.especializacion ?? ''}
                      onChange={e => set('especializacion', UP(e.target.value))} placeholder="NOMBRE" spellCheck={false} />
                  </Field>
                  <Field label="CURSOS Y CERTIFICADOS RELEVANTES" span2 tip="Lista los más importantes, separados por coma">
                    <textarea className={`${inp} resize-none`} rows={2}
                      value={data.cursos_certificados ?? ''}
                      onChange={e => set('cursos_certificados', UP(e.target.value))}
                      placeholder="EJ: PRIMEROS AUXILIOS, TRABAJO EN ALTURAS, EXCEL AVANZADO" spellCheck={false} />
                  </Field>
                  <div className="col-span-2">
                    <BoolField label="¿ACTUALMENTE ESTÁ ESTUDIANDO?" value={data.actualmente_estudia ?? null} onChange={v => set('actualmente_estudia', v)} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Información del cargo actual" icon={Briefcase} accent="#06B6D4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CARGO ACTUAL">
                    <input className={inp} value={data.cargo_confirmado ?? ''}
                      onChange={e => set('cargo_confirmado', UP(e.target.value))} placeholder="EJ: OPERARIO DE PRODUCCIÓN" spellCheck={false} />
                  </Field>
                  <Field label="ÁREA O DEPARTAMENTO">
                    <input className={inp} value={data.area_confirmada ?? ''}
                      onChange={e => set('area_confirmada', UP(e.target.value))} placeholder="EJ: LOGÍSTICA" spellCheck={false} />
                  </Field>
                  <Field label="SEDE / CENTRO DE TRABAJO">
                    <input className={inp} value={data.centro_trabajo ?? ''}
                      onChange={e => set('centro_trabajo', UP(e.target.value))} placeholder="EJ: PLANTA NORTE" spellCheck={false} />
                  </Field>
                  <Field label="NOMBRE DEL JEFE INMEDIATO">
                    <input className={inp} value={data.jefe_inmediato ?? ''}
                      onChange={e => set('jefe_inmediato', UP(e.target.value))} placeholder="NOMBRE COMPLETO" spellCheck={false} />
                  </Field>
                  <Field label="FECHA DE INGRESO A LA EMPRESA *">
                    <input type="date" className={inp} value={data.fecha_ingreso ?? ''} onChange={e => set('fecha_ingreso', e.target.value)} />
                  </Field>
                  <Field label="TIPO DE CONTRATO *">
                    <select value={data.tipo_contrato ?? ''} onChange={e => set('tipo_contrato', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['TÉRMINO INDEFINIDO','TÉRMINO FIJO','OBRA O LABOR','PRESTACIÓN DE SERVICIOS','APRENDIZAJE','TEMPORAL'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="JORNADA LABORAL">
                    <select value={data.jornada_laboral ?? ''} onChange={e => set('jornada_laboral', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['DIURNA','NOCTURNA','MIXTA','POR TURNOS','FLEXIBLE','TELETRABAJO'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="HORARIO HABITUAL" tip="Ej: Lunes a viernes 7am - 5pm">
                    <input className={inp} value={data.horario_habitual ?? ''}
                      onChange={e => set('horario_habitual', UP(e.target.value))} placeholder="EJ: LUN-VIE 7AM - 5PM" spellCheck={false} />
                  </Field>
                  <BoolField label="¿HACE HORAS EXTRAS CON FRECUENCIA?" value={data.realiza_horas_extras ?? null} onChange={v => set('realiza_horas_extras', v)} />
                  <BoolField label="¿TRABAJA FINES DE SEMANA?" value={data.trabaja_fines_semana ?? null} onChange={v => set('trabaja_fines_semana', v)} />
                </div>
              </SectionCard>
              <TabNav onPrev={() => switchTab('familia')} onNext={() => switchTab('tallas')} nextLabel="Siguiente: Tallas / EPP" />
            </div>
          )}

          {/* ════ TALLAS ════ */}
          {tab === 'tallas' && (
            <SectionCard title="Medidas físicas y tallas de dotación" icon={Shield} accent="#10B981">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }}>
                  <strong>¿Para qué sirve esto?</strong> La empresa usa esta información para comprar la dotación exacta que necesitas. ¡Llénala con cuidado para que te quede bien!
                </div>

                <p className="col-span-2 text-[11px] font-bold uppercase tracking-wider pt-2" style={{ color: 'var(--text-faint)' }}>📏 Medidas corporales</p>
                <Field label="ESTATURA EN CENTÍMETROS *" tip="Ej: 170 para 1.70 m">
                  <input type="number" min={100} max={220} className={inp} value={data.estatura_cm ?? ''}
                    onChange={e => set('estatura_cm', +e.target.value)} placeholder="170" inputMode="numeric" />
                </Field>
                <Field label="PESO EN KILOGRAMOS">
                  <input type="number" min={30} max={200} className={inp} value={data.peso_kg ?? ''}
                    onChange={e => set('peso_kg', +e.target.value)} placeholder="70" inputMode="numeric" />
                </Field>
                {data.estatura_cm && data.peso_kg && (() => {
                  const imc = (data.peso_kg! / ((data.estatura_cm! / 100) ** 2))
                  const label = imc < 18.5 ? 'BAJO PESO' : imc < 25 ? 'PESO NORMAL' : imc < 30 ? 'SOBREPESO' : 'OBESIDAD'
                  const col   = imc < 25 ? '#10B981' : imc < 30 ? '#F59E0B' : '#EF4444'
                  return (
                    <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ background: `${col}10`, border: `1px solid ${col}30` }}>
                      <span style={{ color: 'var(--text-dim)' }}>IMC CALCULADO:</span>
                      <span className="font-bold text-base" style={{ color: col }}>{imc.toFixed(1)}</span>
                      <span className="font-semibold" style={{ color: col }}>{label}</span>
                    </div>
                  )
                })()}

                <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', marginTop: 4 }} />
                <p className="col-span-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>👕 Ropa de trabajo</p>

                {([
                  ['talla_camisa',      'TALLA CAMISA / CAMISETA *',  ['XS','S','M','L','XL','XXL','XXXL']],
                  ['talla_pantalon',    'TALLA PANTALÓN',              ['28','30','32','34','36','38','40','42','44','46']],
                  ['talla_overol',      'TALLA OVEROL / MONO',         ['XS','S','M','L','XL','XXL','XXXL']],
                  ['talla_chaqueta',    'TALLA CHAQUETA / CHALECO',    ['XS','S','M','L','XL','XXL','XXXL']],
                  ['talla_impermeable', 'TALLA IMPERMEABLE / ROPA LLUVIA', ['XS','S','M','L','XL','XXL','XXXL']],
                ] as [keyof ProfileData, string, string[]][]).map(([key, label, opts]) => (
                  <Field key={key} label={label}>
                    <select value={(data[key] as string) ?? ''} onChange={e => set(key, e.target.value)} className={inp}>
                      <option value="">— TALLA —</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                ))}

                <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', marginTop: 4 }} />
                <p className="col-span-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>👟 Calzado y guantes</p>

                {([
                  ['talla_zapato', 'TALLA ZAPATO DE SEGURIDAD *', ['34','35','36','37','38','39','40','41','42','43','44','45','46']],
                  ['talla_botas',  'TALLA BOTAS',                  ['34','35','36','37','38','39','40','41','42','43','44','45','46']],
                  ['talla_guantes','TALLA GUANTES',                 ['XS','S','M','L','XL']],
                ] as [keyof ProfileData, string, string[]][]).map(([key, label, opts]) => (
                  <Field key={key} label={label}>
                    <select value={(data[key] as string) ?? ''} onChange={e => set(key, e.target.value)} className={inp}>
                      <option value="">— TALLA —</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                ))}

                <Field label="OBSERVACIONES SOBRE TALLAS" span2 tip="Si tienes alguna particularidad (pie ancho, manga larga, etc.) escríbela aquí">
                  <textarea className={`${inp} resize-none`} rows={2} value={data.obs_tallas ?? ''}
                    onChange={e => set('obs_tallas', UP(e.target.value))}
                    placeholder="EJ: PREFIERO MANGA LARGA, PIE ANCHO" spellCheck={false} />
                </Field>
              </div>
              <TabNav onPrev={() => switchTab('laboral')} onNext={() => switchTab('estilos')} nextLabel="Siguiente: Estilos de vida" />
            </SectionCard>
          )}

          {/* ════ ESTILOS ════ */}
          {tab === 'estilos' && (
            <div className="space-y-5">
              <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#FBBF24' }}>
                <strong>CONFIDENCIAL:</strong> Esta información es para que el área de SST pueda apoyar tu bienestar. Responde con sinceridad.
              </div>

              <SectionCard title="Actividad física y descanso" icon={Activity} accent="#F59E0B">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <BoolField label="¿HACE ACTIVIDAD FÍSICA O EJERCICIO REGULARMENTE?" value={data.realiza_actividad_fisica ?? null} onChange={v => set('realiza_actividad_fisica', v)}
                      tip="Mínimo 30 minutos, al menos 2 veces por semana" />
                  </div>
                  {data.realiza_actividad_fisica && (
                    <>
                      <Field label="¿CUÁNTOS DÍAS A LA SEMANA?">
                        <select value={data.dias_actividad_fisica ?? ''} onChange={e => set('dias_actividad_fisica', +e.target.value)} className={inp}>
                          <option value="">— Seleccionar —</option>
                          {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} DÍA{n > 1 ? 'S' : ''}</option>)}
                        </select>
                      </Field>
                      <Field label="¿QUÉ ACTIVIDAD PRACTICA?">
                        <input className={inp} value={data.tipo_actividad_fisica ?? ''}
                          onChange={e => set('tipo_actividad_fisica', UP(e.target.value))} placeholder="EJ: NATACIÓN, FÚTBOL, GYM" spellCheck={false} />
                      </Field>
                    </>
                  )}
                  <Field label="¿CUÁNTAS HORAS DUERME NORMALMENTE?" tip="En una noche normal de sueño">
                    <select value={data.horas_sueno ?? ''} onChange={e => set('horas_sueno', +e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {[4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} HORAS</option>)}
                    </select>
                  </Field>
                  <div>
                    <BoolField label="¿SE SIENTE DESCANSADO AL DESPERTAR?" value={data.descanso_adecuado ?? null} onChange={v => set('descanso_adecuado', v)} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Alimentación" icon={Activity} accent="#F59E0B">
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿DESAYUNA TODOS LOS DÍAS?" value={data.desayuna_diariamente ?? null} onChange={v => set('desayuna_diariamente', v)} />
                  <Field label="¿CUÁNTAS COMIDAS HACE AL DÍA?">
                    <select value={data.comidas_al_dia ?? ''} onChange={e => set('comidas_al_dia', +e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} COMIDA{n > 1 ? 'S' : ''}</option>)}
                    </select>
                  </Field>
                  <BoolField label="¿CONSUME FRUTAS A DIARIO?" value={data.consume_frutas ?? null} onChange={v => set('consume_frutas', v)} />
                  <BoolField label="¿CONSUME VERDURAS A DIARIO?" value={data.consume_verduras ?? null} onChange={v => set('consume_verduras', v)} />
                </div>
              </SectionCard>

              <SectionCard title="Hábitos" icon={Activity} accent="#F59E0B">
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿FUMA CIGARRILLOS?" value={data.fuma ?? null} onChange={v => set('fuma', v)} />
                  {data.fuma && (
                    <Field label="¿CUÁNTOS CIGARRILLOS AL DÍA?">
                      <input type="number" min={1} max={100} className={inp} value={data.cigarrillos_dia ?? ''}
                        onChange={e => set('cigarrillos_dia', +e.target.value)} inputMode="numeric" />
                    </Field>
                  )}
                  <Field label="CONSUMO DE BEBIDAS ALCOHÓLICAS" span2>
                    <select value={data.consumo_alcohol ?? ''} onChange={e => set('consumo_alcohol', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['NUNCA','OCASIONALMENTE (MENOS DE 1 VEZ/MES)','MENSUALMENTE','SEMANALMENTE','FRECUENTEMENTE (VARIOS DÍAS A LA SEMANA)'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <BoolField label="¿CONSUME BEBIDAS ENERGIZANTES REGULARMENTE?" value={data.consume_energizantes ?? null} onChange={v => set('consume_energizantes', v)} />
                  <Field label="¿CONSUME SUSTANCIAS PSICOACTIVAS?" tip="Respuesta confidencial y sin consecuencias disciplinarias">
                    <select value={data.consume_psicoactivos ?? ''} onChange={e => set('consume_psicoactivos', e.target.value)} className={inp}>
                      <option value="">— Seleccionar —</option>
                      {['NO','SÍ','PREFIERO NO RESPONDER'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
              </SectionCard>
              <TabNav onPrev={() => switchTab('tallas')} onNext={() => switchTab('salud')} nextLabel="Siguiente: Salud" />
            </div>
          )}

          {/* ════ SALUD ════ */}
          {tab === 'salud' && (
            <div className="space-y-5">
              <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                <strong>INFORMACIÓN MÉDICA CONFIDENCIAL.</strong> Solo la verá el área de SST y Medicina del Trabajo. Es importante para proteger tu salud en el trabajo.
              </div>

              <SectionCard title="Antecedentes médicos personales" icon={Heart} accent="#EF4444">
                <div className="grid grid-cols-2 gap-4">
                  <CheckGroup label="¿LE HAN DIAGNOSTICADO ALGUNA DE ESTAS ENFERMEDADES? (SELECCIONA TODAS LAS QUE APLIQUEN)"
                    options={['HIPERTENSIÓN','DIABETES','ENF. CARDIOVASCULARES','ENF. RESPIRATORIAS','ENF. OSTEOMUSCULARES (COLUMNA, ARTICULACIONES)','ENF. NEUROLÓGICAS','PROBLEMAS VISUALES','PROBLEMAS AUDITIVOS','ENF. MENTALES / PSIQUIÁTRICAS','OTRA']}
                    value={data.enfermedades_diagnosticadas ?? []}
                    onChange={v => setArr('enfermedades_diagnosticadas', v)}
                    otherValue={data.enfermedades_otra ?? ''}
                    onOtherChange={v => set('enfermedades_otra', v)}
                    otherLabel="¿QUÉ OTRA(S) ENFERMEDAD(ES) LE HAN DIAGNOSTICADO?" />
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <BoolField label="¿HA SIDO HOSPITALIZADO ALGUNA VEZ?" value={data.hospitalizado ?? null} onChange={v => set('hospitalizado', v)} />
                    <BoolField label="¿HA TENIDO CIRUGÍAS?" value={data.cirugias ?? null} onChange={v => set('cirugias', v)} />
                  </div>
                  {data.cirugias && (
                    <Field label="¿QUÉ CIRUGÍAS Y EN QUÉ AÑO?" span2>
                      <textarea className={`${inp} resize-none`} rows={2} value={data.cirugias_detalle ?? ''}
                        onChange={e => set('cirugias_detalle', UP(e.target.value))} placeholder="EJ: APENDICECTOMÍA 2019, RODILLA DERECHA 2022" spellCheck={false} />
                    </Field>
                  )}
                  <BoolField label="¿TIENE ALERGIAS CONOCIDAS?" value={data.alergias ?? null} onChange={v => set('alergias', v)} />
                  {data.alergias && (
                    <Field label="¿A QUÉ ES ALÉRGICO/A?">
                      <input className={inp} value={data.alergias_detalle ?? ''}
                        onChange={e => set('alergias_detalle', UP(e.target.value))} placeholder="EJ: PENICILINA, POLVO, LÁTEX" spellCheck={false} />
                    </Field>
                  )}
                  <BoolField label="¿TOMA MEDICAMENTOS DE FORMA PERMANENTE?" value={data.medicamentos_permanentes ?? null} onChange={v => set('medicamentos_permanentes', v)} />
                  {data.medicamentos_permanentes && (
                    <Field label="¿CUÁLES MEDICAMENTOS?">
                      <input className={inp} value={data.medicamentos_detalle ?? ''}
                        onChange={e => set('medicamentos_detalle', UP(e.target.value))} placeholder="NOMBRE DE LOS MEDICAMENTOS" spellCheck={false} />
                    </Field>
                  )}
                  <div className="col-span-2">
                    <BoolField label="¿TIENE ALGUNA LIMITACIÓN FÍSICA O SENSORIAL?" value={data.limitacion_fisica ?? null} onChange={v => set('limitacion_fisica', v)}
                      tip="Limitación en movilidad, visión, audición, etc." />
                  </div>
                  {data.limitacion_fisica && (
                    <Field label="DESCRIBA LA LIMITACIÓN" span2>
                      <textarea className={`${inp} resize-none`} rows={2} value={data.limitacion_detalle ?? ''}
                        onChange={e => set('limitacion_detalle', UP(e.target.value))} placeholder="DESCRIPCIÓN DE LA LIMITACIÓN" spellCheck={false} />
                    </Field>
                  )}
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <BoolField label="¿USA GAFAS FORMULADAS?" value={data.usa_gafas ?? null} onChange={v => set('usa_gafas', v)} />
                    <BoolField label="¿USA AUDÍFONOS?" value={data.usa_audifonos ?? null} onChange={v => set('usa_audifonos', v)} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Antecedentes familiares" icon={Heart} accent="#EF4444">
                <CheckGroup label="¿ALGÚN FAMILIAR DIRECTO (PADRES, HERMANOS, HIJOS) HA TENIDO ALGUNA DE ESTAS ENFERMEDADES?"
                  options={['DIABETES','HIPERTENSIÓN','CÁNCER','ENF. CARDIOVASCULARES','ENF. MENTALES','ARTRITIS / REUMATISMO','OTRA']}
                  value={data.antecedentes_familiares ?? []}
                  onChange={v => setArr('antecedentes_familiares', v)}
                  tip="Selecciona todas las que apliquen"
                  otherValue={data.antecedentes_familiares_otra ?? ''}
                  onOtherChange={v => set('antecedentes_familiares_otra', v)}
                  otherLabel="¿QUÉ OTRA(S) ENFERMEDAD(ES) TIENEN SUS FAMILIARES?" />
              </SectionCard>

              <SectionCard title="Salud ocupacional" icon={Shield} accent="#F59E0B">
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿HA SUFRIDO ACCIDENTES DE TRABAJO ANTERIORMENTE?" value={data.accidentes_trabajo ?? null} onChange={v => set('accidentes_trabajo', v)} />
                  <BoolField label="¿HA TENIDO ENFERMEDADES LABORALES RECONOCIDAS?" value={data.enfermedades_laborales ?? null} onChange={v => set('enfermedades_laborales', v)} />
                  <div className="col-span-2">
                    <BoolField label="¿TIENE RESTRICCIONES MÉDICAS PARA CIERTAS ACTIVIDADES LABORALES?" value={data.restricciones_medicas ?? null} onChange={v => set('restricciones_medicas', v)} />
                  </div>
                  {data.restricciones_medicas && (
                    <Field label="DESCRIBA LAS RESTRICCIONES" span2>
                      <textarea className={`${inp} resize-none`} rows={2} value={data.restricciones_detalle ?? ''}
                        onChange={e => set('restricciones_detalle', UP(e.target.value))}
                        placeholder="EJ: NO PUEDE LEVANTAR MÁS DE 10 KG, NO PUEDE TRABAJAR EN ALTURAS" spellCheck={false} />
                    </Field>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Factores psicosociales" icon={Heart} accent="#8B5CF6">
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿SU TRABAJO LE GENERA ESTRÉS FRECUENTEMENTE?" value={data.trabajo_genera_estres ?? null} onChange={v => set('trabajo_genera_estres', v)} />
                  <BoolField label="¿CUENTA CON APOYO EMOCIONAL DE SU FAMILIA?" value={data.apoyo_familiar ?? null} onChange={v => set('apoyo_familiar', v)} />
                  <BoolField label="¿TIENE OTRO EMPLEO ADEMÁS DE ESTE?" value={data.otro_empleo ?? null} onChange={v => set('otro_empleo', v)} />
                  <BoolField label="¿ES CUIDADOR DE UN FAMILIAR ENFERMO O CON DISCAPACIDAD?" value={data.es_cuidador ?? null} onChange={v => set('es_cuidador', v)} />
                  <BoolField label="¿TIENE DIFICULTADES ECONÓMICAS IMPORTANTES?" value={data.dificultades_economicas ?? null} onChange={v => set('dificultades_economicas', v)} />
                  <BoolField label="¿SIENTE QUE TIENE BUEN EQUILIBRIO ENTRE TRABAJO Y VIDA PERSONAL?" value={data.equilibrio_trabajo_vida ?? null} onChange={v => set('equilibrio_trabajo_vida', v)} />
                </div>
              </SectionCard>
              <TabNav onPrev={() => switchTab('estilos')} onNext={() => switchTab('cierre')} nextLabel="Siguiente: Cierre" />
            </div>
          )}

          {/* ════ CIERRE ════ */}
          {tab === 'cierre' && (
            <div className="space-y-5">
              <SectionCard title="Competencias y certificaciones" icon={Award} accent="#EC4899">
                <div className="grid grid-cols-2 gap-4">
                  <BoolField label="¿TIENE LICENCIA DE CONDUCCIÓN VIGENTE?" value={data.licencia_conduccion ?? null} onChange={v => set('licencia_conduccion', v)} />
                  {data.licencia_conduccion && (
                    <Field label="CATEGORÍA DE LA LICENCIA">
                      <select value={data.categoria_licencia ?? ''} onChange={e => set('categoria_licencia', e.target.value)} className={inp}>
                        <option value="">— Seleccionar —</option>
                        {['A1 - MOTO HASTA 125CC','A2 - MOTO MÁS DE 125CC','B1 - AUTOMÓVIL','B2 - CAMIÓN','B3 - BUS','C1 - VEHÍCULO ARTICULADO','C2 - TRACTOCAMIÓN','C3 - COMBINACIÓN'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                  )}
                  <CheckGroup label="¿CUÁL DE ESTAS CERTIFICACIONES TIENE VIGENTES? (SELECCIONA TODAS LAS QUE APLICAN)"
                    options={['TRABAJO EN ALTURAS','BRIGADISTA DE EMERGENCIAS','PRIMEROS AUXILIOS','OPERACIÓN DE MONTACARGAS','ESPACIOS CONFINADOS','MANEJO DE QUÍMICOS PELIGROSOS','SOLDADURA','CARGUE Y DESCARGUE','MANEJO SEGURO DE MAQUINARIA']}
                    value={data.certificaciones ?? []}
                    onChange={v => setArr('certificaciones', v)} />
                  <Field label="OTRAS CERTIFICACIONES NO LISTADAS" span2>
                    <textarea className={`${inp} resize-none`} rows={2} value={data.otras_certificaciones ?? ''}
                      onChange={e => set('otras_certificaciones', UP(e.target.value))}
                      placeholder="EJ: CURSO BÁSICO DE ELECTRICIDAD 2023" spellCheck={false} />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Autorización y consentimientos *" icon={FileText} accent="#EC4899">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                    La información registrada en este formulario será utilizada <strong style={{ color: 'var(--text)' }}>exclusivamente</strong> por el área de Talento Humano y Seguridad y Salud en el Trabajo de su empresa, para fines de gestión del bienestar, prevención de riesgos y cumplimiento de la normatividad colombiana (Decreto 1072 de 2015 y Ley 1581 de 2012 — Habeas Data). Sus datos son <strong style={{ color: 'var(--text)' }}>confidenciales</strong>.
                  </div>

                  {[
                    { key: 'autoriza_datos', label: 'Autorizo el tratamiento de mis datos personales conforme a la política de privacidad de la empresa y a la Ley 1581 de 2012.' },
                    { key: 'declara_veracidad', label: 'Declaro bajo juramento que toda la información suministrada es verídica, completa y actualizada. Me comprometo a notificar cualquier cambio.' },
                  ].map(({ key, label }) => {
                    const checked = !!(data as any)[key]
                    return (
                      <label key={key}
                        className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-all"
                        style={{ background: checked ? 'rgba(16,185,129,0.07)' : 'var(--bg-card)', border: `1px solid ${checked ? 'rgba(16,185,129,0.25)' : 'var(--border)'}` }}>
                        <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: checked ? '#10B981' : 'var(--bg-surface)', border: `2px solid ${checked ? '#10B981' : 'var(--border)'}` }}>
                          {checked && <CheckCircle size={13} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={checked}
                          onChange={e => set(key as keyof ProfileData, e.target.checked)} className="sr-only" />
                        <span className="text-sm leading-relaxed" style={{ color: checked ? 'var(--text)' : 'var(--text-dim)' }}>{label}</span>
                      </label>
                    )
                  })}

                  {data.autoriza_datos && data.declara_veracidad && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-xl text-center"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <CheckCircle size={30} className="mx-auto mb-2" style={{ color: '#34D399' }} />
                      <p className="font-bold" style={{ color: '#34D399' }}>¡TODO LISTO!</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(52,211,153,0.75)' }}>
                        Haz clic en <strong>GUARDAR</strong> para enviar tu perfil al área de SST.
                      </p>
                    </motion.div>
                  )}
                </div>
              </SectionCard>

              <TabNav onPrev={() => switchTab('salud')} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Floating save ── */}
      <div className="fixed bottom-5 right-5 z-40">
        <button onClick={() => save(false)} disabled={saving}
          className="terra-btn shadow-xl gap-2 font-bold"
          style={{ padding: '13px 22px', fontSize: 14,
            background: saveMsg === 'saved' ? '#10B981' : saveMsg === 'local' ? '#F59E0B' : undefined,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saveMsg === 'saved' ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? 'GUARDANDO...' : saveMsg === 'saved' ? '¡GUARDADO!' : saveMsg === 'local' ? '¡GUARDADO LOCALMENTE!' : 'GUARDAR PERFIL'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab navigation helper ────────────────────────────────────────────
function TabNav({ onPrev, onNext, nextLabel }: { onPrev?: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="flex justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      {onPrev
        ? <button onClick={onPrev} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            ← ANTERIOR
          </button>
        : <span />}
      {onNext && (
        <button onClick={onNext} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          {nextLabel ?? 'SIGUIENTE'} <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
