'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, Heart, Shirt, Activity, Download,
  CheckCircle, Clock, FileText, BarChart2, Award, Home,
  Car, Briefcase, GraduationCap, Shield, Loader2, Search, AlertCircle
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
interface WP {
  id: string; user_id: string; completion_pct: number; updated_at: string
  // personal
  nombres?: string; apellidos?: string; fecha_nacimiento?: string; sexo?: string
  estado_civil?: string; ciudad_residencia?: string; depto_residencia?: string; nacionalidad?: string
  // vivienda
  tipo_vivienda?: string; tenencia_vivienda?: string; estrato?: number
  servicios_publicos?: string[]; acceso_internet?: boolean
  // familia
  num_hijos?: number; cabeza_hogar?: boolean; con_quien_vive?: string
  num_personas_hogar?: number; dependientes_economicos?: number
  // educacion
  nivel_educativo?: string; profesion?: string; actualmente_estudia?: boolean
  // laboral
  cargo_confirmado?: string; area_confirmada?: string; tipo_contrato?: string
  jornada_laboral?: string; fecha_ingreso?: string; centro_trabajo?: string
  realiza_horas_extras?: boolean; trabaja_fines_semana?: boolean; horario_habitual?: string
  // desplazamiento
  medio_transporte?: string; tiempo_desplazamiento?: string; conduce_vehiculo?: boolean; tipo_vehiculo?: string
  municipio_vivienda?: string
  // tallas
  estatura_cm?: number; peso_kg?: number
  talla_camisa?: string; talla_camiseta?: string; talla_pantalon?: string
  talla_overol?: string; talla_chaqueta?: string; talla_impermeable?: string
  talla_zapato?: string; talla_botas?: string; talla_guantes?: string
  // estilos
  realiza_actividad_fisica?: boolean; dias_actividad_fisica?: number; tipo_actividad_fisica?: string
  horas_sueno?: number; descanso_adecuado?: boolean; desayuna_diariamente?: boolean
  comidas_al_dia?: number; consume_frutas?: boolean; consume_verduras?: boolean
  fuma?: boolean; cigarrillos_dia?: number; consumo_alcohol?: string
  consume_energizantes?: boolean; consume_psicoactivos?: string
  // salud
  enfermedades_diagnosticadas?: string[]; hospitalizado?: boolean
  cirugias?: boolean; alergias?: boolean; medicamentos_permanentes?: boolean
  limitacion_fisica?: boolean; antecedentes_familiares?: string[]
  // salud ocupacional
  accidentes_trabajo?: boolean; enfermedades_laborales?: boolean
  restricciones_medicas?: boolean; usa_gafas?: boolean; usa_audifonos?: boolean
  // psicosocial
  trabajo_genera_estres?: boolean; apoyo_familiar?: boolean; otro_empleo?: boolean
  es_cuidador?: boolean; dificultades_economicas?: boolean; equilibrio_trabajo_vida?: boolean
  // competencias
  licencia_conduccion?: boolean; categoria_licencia?: string
  certificaciones?: string[]; otras_certificaciones?: string
  // consentimientos
  autoriza_datos?: boolean; declara_veracidad?: boolean
  users?: { name?: string; cedula?: string; email?: string; area?: string }
}

// ── Helpers ───────────────────────────────────────────────────────────
const n0 = (v: unknown) => (v === null || v === undefined || v === '')

function age(dob?: string) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}
function imc(e?: number, p?: number) {
  if (!e || !p) return null
  return +(p / ((e / 100) ** 2)).toFixed(1)
}
function pct(n: number, total: number) { return total ? Math.round((n * 100) / total) : 0 }
function freq(arr: (string | undefined | null)[]) {
  const m: Record<string, number> = {}
  arr.forEach(v => { if (v) m[v] = (m[v] ?? 0) + 1 })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}
function flatFreq(arrays: (string[] | undefined | null)[]) {
  const all: string[] = arrays.flatMap(a => a ?? [])
  return freq(all)
}
function countBool(arr: WP[], fn: (w: WP) => boolean | undefined | null) {
  return arr.filter(w => fn(w) === true).length
}

// ── Mini chart components ─────────────────────────────────────────────
const PALETTE = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#F97316','#EC4899','#14B8A6','#A78BFA']

function DonutChart({ data, size = 120 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <p className="text-xs text-center py-4" style={{ color: 'var(--text-faint)' }}>Sin datos</p>
  let angle = -90
  const r = 40; const cx = size / 2; const cy = size / 2
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 360
    const rad1 = (angle * Math.PI) / 180
    const rad2 = ((angle + sweep) * Math.PI) / 180
    const x1 = cx + r * Math.cos(rad1); const y1 = cy + r * Math.sin(rad1)
    const x2 = cx + r * Math.cos(rad2); const y2 = cy + r * Math.sin(rad2)
    const large = sweep > 180 ? 1 : 0
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    angle += sweep
    return { path, color: PALETTE[i % PALETTE.length], label: d.label, value: d.value }
  })
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="var(--bg-surface)" strokeWidth={2} />)}
        <circle cx={cx} cy={cy} r={20} fill="var(--bg-surface)" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight="bold" fill="var(--text)" style={{ fontFamily: 'inherit' }}>{total}</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="truncate flex-1" style={{ color: 'var(--text-dim)' }} title={s.label}>{s.label}</span>
            <span className="font-bold flex-shrink-0" style={{ color: 'var(--text)' }}>{s.value}</span>
            <span className="w-8 text-right flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{pct(s.value, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HBar({ label, value, max, color = '#3B82F6', total }: { label: string; value: number; max: number; color?: string; total: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex-shrink-0 text-right" style={{ width: 130, color: 'var(--text-dim)' }} title={label}>{label.length > 18 ? label.slice(0, 17) + '…' : label}</span>
      <div className="flex-1 h-5 rounded overflow-hidden relative" style={{ background: 'var(--bg-card)' }}>
        <motion.div className="h-full rounded flex items-center px-1.5"
          initial={{ width: 0 }} animate={{ width: `${pct(value, max)}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }} style={{ background: color }}>
          {pct(value, max) > 15 && <span className="text-white font-bold text-[10px]">{value}</span>}
        </motion.div>
      </div>
      <span className="font-bold w-6 flex-shrink-0" style={{ color: 'var(--text)' }}>{value}</span>
      <span className="w-8 text-right flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{pct(value, total)}%</span>
    </div>
  )
}

function BoolBar({ label, trueCount, total, colorT = '#10B981', colorF = '#EF4444' }: { label: string; trueCount: number; total: number; colorT?: string; colorF?: string }) {
  const falseCount = total - trueCount
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-dim)' }}>{label}</span>
        <span className="font-semibold" style={{ color: 'var(--text)' }}>{pct(trueCount, total)}% Sí</span>
      </div>
      <div className="h-4 rounded overflow-hidden flex">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct(trueCount, total)}%` }}
          transition={{ duration: 0.7 }} style={{ background: colorT }} className="flex items-center justify-center">
          {pct(trueCount, total) > 10 && <span className="text-white text-[9px] font-bold">{trueCount}</span>}
        </motion.div>
        <div className="flex-1 flex items-center justify-center" style={{ background: colorF }}>
          {falseCount > 0 && pct(falseCount, total) > 10 && <span className="text-white text-[9px] font-bold">{falseCount}</span>}
        </div>
      </div>
      <div className="flex gap-3 mt-1">
        <span className="text-[10px] flex items-center gap-1" style={{ color: colorT }}><span className="w-2 h-2 rounded-sm inline-block" style={{ background: colorT }} /> SÍ: {trueCount}</span>
        <span className="text-[10px] flex items-center gap-1" style={{ color: colorF }}><span className="w-2 h-2 rounded-sm inline-block" style={{ background: colorF }} /> NO: {falseCount}</span>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────
function Sec({ title, icon: Icon, children, id }: { title: string; icon: any; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="terra-card p-5 print-section">
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-dim)' }}>
          <Icon size={14} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function KPI({ label, value, sub, color = 'var(--primary)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="terra-card p-4 text-center">
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function WorkerProfilesPage() {
  const [profiles, setProfiles] = useState<WP[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/worker-profiles')
      .then(r => r.ok ? r.json() : [])
      .then((d: WP[]) => { setProfiles(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full py-32">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  )

  const n = profiles.length
  const ages = profiles.map(p => age(p.fecha_nacimiento)).filter(Boolean) as number[]
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null
  const avgPct = n ? Math.round(profiles.reduce((s, p) => s + (p.completion_pct ?? 0), 0) / n) : 0

  // ── Export Excel ────────────────────────────────────────────────────
  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default
    const rows = profiles.map(p => ({
      'NOMBRE COMPLETO':             p.users?.name ?? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim(),
      'CÉDULA':                      p.users?.cedula ?? '',
      'EMAIL':                       p.users?.email ?? '',
      'FECHA NACIMIENTO':            p.fecha_nacimiento ?? '',
      'EDAD':                        age(p.fecha_nacimiento) ?? '',
      'SEXO':                        p.sexo ?? '',
      'ESTADO CIVIL':                p.estado_civil ?? '',
      'CIUDAD RESIDENCIA':           p.ciudad_residencia ?? '',
      'DEPTO RESIDENCIA':            p.depto_residencia ?? '',
      'MUNICIPIO VIVIENDA':          p.municipio_vivienda ?? '',
      'TIPO VIVIENDA':               p.tipo_vivienda ?? '',
      'TENENCIA VIVIENDA':           p.tenencia_vivienda ?? '',
      'ESTRATO':                     p.estrato ?? '',
      'ACCESO INTERNET':             p.acceso_internet === true ? 'SÍ' : p.acceso_internet === false ? 'NO' : '',
      'CON QUIÉN VIVE':              p.con_quien_vive ?? '',
      'PERSONAS EN HOGAR':           p.num_personas_hogar ?? '',
      'NÚMERO DE HIJOS':             p.num_hijos ?? '',
      'DEPENDIENTES ECONÓMICOS':     p.dependientes_economicos ?? '',
      'CABEZA DE HOGAR':             p.cabeza_hogar === true ? 'SÍ' : p.cabeza_hogar === false ? 'NO' : '',
      'NIVEL EDUCATIVO':             p.nivel_educativo ?? '',
      'PROFESIÓN':                   p.profesion ?? '',
      'ESTUDIA ACTUALMENTE':         p.actualmente_estudia === true ? 'SÍ' : p.actualmente_estudia === false ? 'NO' : '',
      'CARGO':                       p.cargo_confirmado ?? '',
      'ÁREA':                        p.area_confirmada ?? p.users?.area ?? '',
      'CENTRO TRABAJO':              p.centro_trabajo ?? '',
      'TIPO CONTRATO':               p.tipo_contrato ?? '',
      'JORNADA LABORAL':             p.jornada_laboral ?? '',
      'HORARIO HABITUAL':            p.horario_habitual ?? '',
      'HORAS EXTRAS':                p.realiza_horas_extras === true ? 'SÍ' : p.realiza_horas_extras === false ? 'NO' : '',
      'TRABAJA FINES SEMANA':        p.trabaja_fines_semana === true ? 'SÍ' : p.trabaja_fines_semana === false ? 'NO' : '',
      'FECHA INGRESO':               p.fecha_ingreso ?? '',
      'MEDIO TRANSPORTE':            p.medio_transporte ?? '',
      'TIEMPO DESPLAZAMIENTO':       p.tiempo_desplazamiento ?? '',
      'CONDUCE VEHÍCULO':            p.conduce_vehiculo === true ? 'SÍ' : p.conduce_vehiculo === false ? 'NO' : '',
      'TIPO VEHÍCULO':               p.tipo_vehiculo ?? '',
      'ESTATURA (cm)':               p.estatura_cm ?? '',
      'PESO (kg)':                   p.peso_kg ?? '',
      'IMC':                         imc(p.estatura_cm, p.peso_kg) ?? '',
      'TALLA CAMISA':                p.talla_camisa ?? '',
      'TALLA CAMISETA':              p.talla_camiseta ?? '',
      'TALLA PANTALÓN':              p.talla_pantalon ?? '',
      'TALLA OVEROL':                p.talla_overol ?? '',
      'TALLA CHAQUETA':              p.talla_chaqueta ?? '',
      'TALLA IMPERMEABLE':           p.talla_impermeable ?? '',
      'TALLA ZAPATO':                p.talla_zapato ?? '',
      'TALLA BOTAS':                 p.talla_botas ?? '',
      'TALLA GUANTES':               p.talla_guantes ?? '',
      'ACTIVIDAD FÍSICA':            p.realiza_actividad_fisica === true ? 'SÍ' : p.realiza_actividad_fisica === false ? 'NO' : '',
      'DÍAS ACTIVIDAD FÍSICA/SEM':   p.dias_actividad_fisica ?? '',
      'TIPO ACTIVIDAD':              p.tipo_actividad_fisica ?? '',
      'HORAS DE SUEÑO':              p.horas_sueno ?? '',
      'DESCANSO ADECUADO':           p.descanso_adecuado === true ? 'SÍ' : p.descanso_adecuado === false ? 'NO' : '',
      'DESAYUNA DIARIO':             p.desayuna_diariamente === true ? 'SÍ' : p.desayuna_diariamente === false ? 'NO' : '',
      'COMIDAS AL DÍA':              p.comidas_al_dia ?? '',
      'CONSUME FRUTAS':              p.consume_frutas === true ? 'SÍ' : p.consume_frutas === false ? 'NO' : '',
      'CONSUME VERDURAS':            p.consume_verduras === true ? 'SÍ' : p.consume_verduras === false ? 'NO' : '',
      'FUMA':                        p.fuma === true ? 'SÍ' : p.fuma === false ? 'NO' : '',
      'CIGARRILLOS/DÍA':             p.cigarrillos_dia ?? '',
      'CONSUMO ALCOHOL':             p.consumo_alcohol ?? '',
      'CONSUME ENERGIZANTES':        p.consume_energizantes === true ? 'SÍ' : p.consume_energizantes === false ? 'NO' : '',
      'CONSUME PSICOACTIVOS':        p.consume_psicoactivos ?? '',
      'ENFERMEDADES DIAGNOSTICADAS': (p.enfermedades_diagnosticadas ?? []).join(', '),
      'HOSPITALIZADO':               p.hospitalizado === true ? 'SÍ' : p.hospitalizado === false ? 'NO' : '',
      'CIRUGÍAS':                    p.cirugias === true ? 'SÍ' : p.cirugias === false ? 'NO' : '',
      'ALERGIAS':                    p.alergias === true ? 'SÍ' : p.alergias === false ? 'NO' : '',
      'MEDICAMENTOS PERMANENTES':    p.medicamentos_permanentes === true ? 'SÍ' : p.medicamentos_permanentes === false ? 'NO' : '',
      'LIMITACIÓN FÍSICA':           p.limitacion_fisica === true ? 'SÍ' : p.limitacion_fisica === false ? 'NO' : '',
      'ANTECEDENTES FAMILIARES':     (p.antecedentes_familiares ?? []).join(', '),
      'ACCIDENTES DE TRABAJO':       p.accidentes_trabajo === true ? 'SÍ' : p.accidentes_trabajo === false ? 'NO' : '',
      'ENFERMEDADES LABORALES':      p.enfermedades_laborales === true ? 'SÍ' : p.enfermedades_laborales === false ? 'NO' : '',
      'RESTRICCIONES MÉDICAS':       p.restricciones_medicas === true ? 'SÍ' : p.restricciones_medicas === false ? 'NO' : '',
      'USA GAFAS':                   p.usa_gafas === true ? 'SÍ' : p.usa_gafas === false ? 'NO' : '',
      'USA AUDÍFONOS':               p.usa_audifonos === true ? 'SÍ' : p.usa_audifonos === false ? 'NO' : '',
      'TRABAJO GENERA ESTRÉS':       p.trabajo_genera_estres === true ? 'SÍ' : p.trabajo_genera_estres === false ? 'NO' : '',
      'APOYO FAMILIAR':              p.apoyo_familiar === true ? 'SÍ' : p.apoyo_familiar === false ? 'NO' : '',
      'OTRO EMPLEO':                 p.otro_empleo === true ? 'SÍ' : p.otro_empleo === false ? 'NO' : '',
      'ES CUIDADOR':                 p.es_cuidador === true ? 'SÍ' : p.es_cuidador === false ? 'NO' : '',
      'DIFICULTADES ECONÓMICAS':     p.dificultades_economicas === true ? 'SÍ' : p.dificultades_economicas === false ? 'NO' : '',
      'EQUILIBRIO TRABAJO/VIDA':     p.equilibrio_trabajo_vida === true ? 'SÍ' : p.equilibrio_trabajo_vida === false ? 'NO' : '',
      'LICENCIA CONDUCCIÓN':         p.licencia_conduccion === true ? 'SÍ' : p.licencia_conduccion === false ? 'NO' : '',
      'CATEGORÍA LICENCIA':          p.categoria_licencia ?? '',
      'CERTIFICACIONES':             (p.certificaciones ?? []).join(', '),
      'OTRAS CERTIFICACIONES':       p.otras_certificaciones ?? '',
      'COMPLETITUD (%)':             p.completion_pct ?? 0,
      'ÚLTIMA ACTUALIZACIÓN':        p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-CO') : '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Perfiles')
    XLSX.writeFile(wb, `perfiles_integrales_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // ── Export PDF via print ─────────────────────────────────────────────
  const exportPDF = () => { window.print() }

  // ── Computed stats ──────────────────────────────────────────────────
  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    return !q || (p.users?.name ?? '').toLowerCase().includes(q)
      || (p.users?.cedula ?? '').includes(q)
      || (p.area_confirmada ?? '').toLowerCase().includes(q)
      || (p.cargo_confirmado ?? '').toLowerCase().includes(q)
  })

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-report, #print-report * { visibility: visible !important; }
          #print-report { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px; }
        }
      `}</style>

      <div className="p-5 max-w-7xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3 no-print">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Perfiles Integrales — Tablero de Analítica</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{n} perfil{n !== 1 ? 'es' : ''} registrado{n !== 1 ? 's' : ''} · Generado {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="terra-btn" style={{ padding: '8px 14px', fontSize: 12, background: '#10B981' }}>
              <Download size={13} /> Excel
            </button>
            <button onClick={exportPDF} className="terra-btn" style={{ padding: '8px 14px', fontSize: 12, background: '#EF4444' }}>
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>

        {/* ── Printable report ── */}
        <div id="print-report" ref={reportRef}>

          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPI label="Trabajadores" value={n} />
            <KPI label="Completitud promedio" value={`${avgPct}%`} color={avgPct >= 80 ? '#10B981' : '#F59E0B'} />
            <KPI label="Edad promedio" value={avgAge ? `${avgAge} a` : '—'} color="#8B5CF6" />
            <KPI label="Con estrés laboral" value={`${pct(countBool(profiles, p => p.trabajo_genera_estres), n)}%`} color="#F59E0B" sub={`${countBool(profiles, p => p.trabajo_genera_estres)} de ${n}`} />
            <KPI label="Completitud 100%" value={profiles.filter(p => (p.completion_pct ?? 0) === 100).length} color="#10B981" />
          </div>

          {/* ══ SECCIÓN 1: DEMOGRAFÍA ══ */}
          <div className="grid lg:grid-cols-2 gap-5">

            <Sec title="Distribución por sexo" icon={Users} id="sec-sexo">
              <DonutChart data={freq(profiles.map(p => p.sexo)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>

            <Sec title="Estado civil" icon={Users} id="sec-civil">
              <DonutChart data={freq(profiles.map(p => p.estado_civil)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Sec title="Distribución por edad" icon={Users} id="sec-edad">
              {(() => {
                const groups = [
                  { label: '18-25 años', fn: (a: number) => a >= 18 && a <= 25 },
                  { label: '26-35 años', fn: (a: number) => a >= 26 && a <= 35 },
                  { label: '36-45 años', fn: (a: number) => a >= 36 && a <= 45 },
                  { label: '46-55 años', fn: (a: number) => a >= 46 && a <= 55 },
                  { label: '56+ años',   fn: (a: number) => a >= 56 },
                ]
                const aged = profiles.map(p => age(p.fecha_nacimiento)).filter(Boolean) as number[]
                const max = Math.max(...groups.map(g => aged.filter(g.fn).length), 1)
                return (
                  <div className="space-y-2">
                    {groups.map((g, i) => {
                      const val = aged.filter(g.fn).length
                      return <HBar key={g.label} label={g.label} value={val} max={max} total={aged.length || 1} color={PALETTE[i]} />
                    })}
                  </div>
                )
              })()}
            </Sec>

            <Sec title="Ciudad de residencia" icon={Home} id="sec-ciudad">
              {(() => {
                const data = freq(profiles.map(p => p.ciudad_residencia || p.municipio_vivienda))
                const max = Math.max(...data.map(d => d[1]), 1)
                return <div className="space-y-2">{data.slice(0, 8).map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i % PALETTE.length]} />)}</div>
              })()}
            </Sec>
          </div>

          {/* ══ SECCIÓN 2: VIVIENDA ══ */}
          <div className="grid lg:grid-cols-3 gap-5">
            <Sec title="Tipo de vivienda" icon={Home} id="sec-vivienda">
              <DonutChart size={100} data={freq(profiles.map(p => p.tipo_vivienda)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>
            <Sec title="Tenencia de vivienda" icon={Home} id="sec-tenencia">
              <DonutChart size={100} data={freq(profiles.map(p => p.tenencia_vivienda)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>
            <Sec title="Estrato socioeconómico" icon={Home} id="sec-estrato">
              {(() => {
                const data = freq(profiles.map(p => p.estrato ? `Estrato ${p.estrato}` : undefined))
                const max = Math.max(...data.map(d => d[1]), 1)
                return <div className="space-y-2">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i]} />)}</div>
              })()}
            </Sec>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Sec title="Composición del hogar" icon={Home} id="sec-hogar">
              <div className="space-y-3">
                <BoolBar label="Cabeza de hogar" trueCount={countBool(profiles, p => p.cabeza_hogar)} total={n} />
                <BoolBar label="Acceso a internet en casa" trueCount={countBool(profiles, p => p.acceso_internet)} total={n} />
                <div className="pt-2 grid grid-cols-3 gap-3 text-center text-xs">
                  {[
                    { label: 'Promedio hijos', val: profiles.filter(p => p.num_hijos !== undefined).length ? (profiles.reduce((s, p) => s + (p.num_hijos ?? 0), 0) / n).toFixed(1) : '—' },
                    { label: 'Promedio personas/hogar', val: profiles.filter(p => p.num_personas_hogar).length ? (profiles.reduce((s, p) => s + (p.num_personas_hogar ?? 0), 0) / n).toFixed(1) : '—' },
                    { label: 'Promedio dependientes', val: profiles.filter(p => p.dependientes_economicos !== undefined).length ? (profiles.reduce((s, p) => s + (p.dependientes_economicos ?? 0), 0) / n).toFixed(1) : '—' },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                      <p className="text-base font-black" style={{ color: 'var(--primary)' }}>{val}</p>
                      <p style={{ color: 'var(--text-faint)' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Sec>
            <Sec title="¿Con quién vive?" icon={Home} id="sec-convivencia">
              <DonutChart size={100} data={freq(profiles.map(p => p.con_quien_vive)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>
          </div>

          {/* ══ SECCIÓN 3: EDUCACIÓN ══ */}
          <Sec title="Nivel educativo" icon={GraduationCap} id="sec-edu">
            {(() => {
              const data = freq(profiles.map(p => p.nivel_educativo))
              const max = Math.max(...data.map(d => d[1]), 1)
              return (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-2">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i % PALETTE.length]} />)}</div>
                  <div className="space-y-3">
                    <BoolBar label="Estudia actualmente" trueCount={countBool(profiles, p => p.actualmente_estudia)} total={n} colorT="#8B5CF6" colorF="var(--bg-card)" />
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>Profesiones más frecuentes</p>
                      {freq(profiles.map(p => p.profesion)).slice(0, 5).map(([l, v]) => (
                        <div key={l} className="flex justify-between text-xs py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>{l}</span>
                          <span className="font-bold" style={{ color: 'var(--text)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
          </Sec>

          {/* ══ SECCIÓN 4: LABORAL ══ */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Sec title="Tipo de contrato" icon={Briefcase} id="sec-contrato">
              <DonutChart data={freq(profiles.map(p => p.tipo_contrato)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>
            <Sec title="Jornada laboral" icon={Briefcase} id="sec-jornada">
              <DonutChart data={freq(profiles.map(p => p.jornada_laboral)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>
          </div>

          <Sec title="Distribución por área / cargo" icon={Briefcase} id="sec-area">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Por área</p>
                {(() => {
                  const data = freq(profiles.map(p => p.area_confirmada || p.users?.area))
                  const max = Math.max(...data.map(d => d[1]), 1)
                  return <div className="space-y-2">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i % PALETTE.length]} />)}</div>
                })()}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Condiciones laborales</p>
                <div className="space-y-3">
                  <BoolBar label="Realiza horas extras" trueCount={countBool(profiles, p => p.realiza_horas_extras)} total={n} colorT="#F59E0B" colorF="var(--bg-card)" />
                  <BoolBar label="Trabaja fines de semana" trueCount={countBool(profiles, p => p.trabaja_fines_semana)} total={n} colorT="#F97316" colorF="var(--bg-card)" />
                </div>
              </div>
            </div>
          </Sec>

          {/* ══ SECCIÓN 5: DESPLAZAMIENTO ══ */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Sec title="Medio de transporte" icon={Car} id="sec-transporte">
              <DonutChart data={freq(profiles.map(p => p.medio_transporte)).map(([l, v]) => ({ label: l, value: v }))} />
            </Sec>
            <Sec title="Desplazamiento y conducción" icon={Car} id="sec-desplaz">
              {(() => {
                const data = freq(profiles.map(p => p.tiempo_desplazamiento))
                const max = Math.max(...data.map(d => d[1]), 1)
                return (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Tiempo de desplazamiento</p>
                    <div className="space-y-2">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i]} />)}</div>
                    <BoolBar label="Conduce vehículo propio" trueCount={countBool(profiles, p => p.conduce_vehiculo)} total={n} colorT="#06B6D4" colorF="var(--bg-card)" />
                  </div>
                )
              })()}
            </Sec>
          </div>

          {/* ══ SECCIÓN 6: TALLAS EPP ══ */}
          <Sec title="Tallas de dotación y perfil físico" icon={Shirt} id="sec-tallas">
            <div className="grid lg:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Promedio estatura', val: profiles.filter(p => p.estatura_cm).length ? (profiles.reduce((s, p) => s + (p.estatura_cm ?? 0), 0) / profiles.filter(p => p.estatura_cm).length).toFixed(0) + ' cm' : '—' },
                { label: 'Promedio peso', val: profiles.filter(p => p.peso_kg).length ? (profiles.reduce((s, p) => s + (p.peso_kg ?? 0), 0) / profiles.filter(p => p.peso_kg).length).toFixed(1) + ' kg' : '—' },
                { label: 'Promedio IMC', val: (() => { const vals = profiles.map(p => imc(p.estatura_cm, p.peso_kg)).filter(Boolean) as number[]; return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—' })() },
                { label: 'Con limitación física', val: `${countBool(profiles, p => p.limitacion_fisica)} (${pct(countBool(profiles, p => p.limitacion_fisica), n)}%)` },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-lg font-black" style={{ color: 'var(--primary)' }}>{val}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                { title: 'Camisa / Camiseta', key: 'talla_camisa' as keyof WP },
                { title: 'Pantalón', key: 'talla_pantalon' as keyof WP },
                { title: 'Calzado (Zapato)', key: 'talla_zapato' as keyof WP },
              ].map(({ title, key }) => {
                const data = freq(profiles.map(p => p[key] as string | undefined))
                const max = Math.max(...data.map(d => d[1]), 1)
                return (
                  <div key={title}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>{title}</p>
                    <div className="space-y-1.5">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i % PALETTE.length]} />)}</div>
                  </div>
                )
              })}
            </div>
          </Sec>

          {/* ══ SECCIÓN 7: ESTILOS DE VIDA ══ */}
          <Sec title="Estilos de vida y hábitos" icon={Activity} id="sec-estilos">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Actividad física y sueño</p>
                <BoolBar label="Realiza actividad física" trueCount={countBool(profiles, p => p.realiza_actividad_fisica)} total={n} colorT="#10B981" colorF="#EF4444" />
                <BoolBar label="Descanso adecuado" trueCount={countBool(profiles, p => p.descanso_adecuado)} total={n} colorT="#10B981" colorF="#EF4444" />
                <BoolBar label="Desayuna diariamente" trueCount={countBool(profiles, p => p.desayuna_diariamente)} total={n} colorT="#10B981" colorF="#EF4444" />
                <BoolBar label="Consume frutas diariamente" trueCount={countBool(profiles, p => p.consume_frutas)} total={n} colorT="#10B981" colorF="#EF4444" />
                <BoolBar label="Consume verduras diariamente" trueCount={countBool(profiles, p => p.consume_verduras)} total={n} colorT="#10B981" colorF="#EF4444" />
                {profiles.filter(p => p.horas_sueno).length > 0 && (
                  <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-card)' }}>
                    <p className="text-lg font-black" style={{ color: '#8B5CF6' }}>
                      {(profiles.filter(p => p.horas_sueno).reduce((s, p) => s + (p.horas_sueno ?? 0), 0) / profiles.filter(p => p.horas_sueno).length).toFixed(1)}h
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Horas de sueño promedio</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Hábitos de riesgo</p>
                <BoolBar label="Fumadores" trueCount={countBool(profiles, p => p.fuma)} total={n} colorT="#EF4444" colorF="#10B981" />
                <BoolBar label="Consume bebidas energizantes" trueCount={countBool(profiles, p => p.consume_energizantes)} total={n} colorT="#F59E0B" colorF="var(--bg-card)" />
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>Consumo de alcohol</p>
                  {(() => {
                    const data = freq(profiles.map(p => p.consumo_alcohol))
                    const max = Math.max(...data.map(d => d[1]), 1)
                    return <div className="space-y-1.5">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i]} />)}</div>
                  })()}
                </div>
              </div>
            </div>
          </Sec>

          {/* ══ SECCIÓN 8: SALUD ══ */}
          <Sec title="Antecedentes médicos personales" icon={Heart} id="sec-salud">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Condiciones médicas</p>
                <BoolBar label="Ha sido hospitalizado" trueCount={countBool(profiles, p => p.hospitalizado)} total={n} colorT="#EF4444" colorF="#10B981" />
                <BoolBar label="Ha tenido cirugías" trueCount={countBool(profiles, p => p.cirugias)} total={n} colorT="#F97316" colorF="#10B981" />
                <BoolBar label="Presenta alergias" trueCount={countBool(profiles, p => p.alergias)} total={n} colorT="#F59E0B" colorF="#10B981" />
                <BoolBar label="Medicamentos permanentes" trueCount={countBool(profiles, p => p.medicamentos_permanentes)} total={n} colorT="#EF4444" colorF="#10B981" />
                <BoolBar label="USA gafas formuladas" trueCount={countBool(profiles, p => p.usa_gafas)} total={n} colorT="#8B5CF6" colorF="var(--bg-card)" />
                <BoolBar label="USA audífonos" trueCount={countBool(profiles, p => p.usa_audifonos)} total={n} colorT="#8B5CF6" colorF="var(--bg-card)" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Enfermedades más frecuentes</p>
                {(() => {
                  const data = flatFreq(profiles.map(p => p.enfermedades_diagnosticadas))
                  const max = Math.max(...data.map(d => d[1]), 1)
                  return data.length
                    ? <div className="space-y-1.5">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i % PALETTE.length]} />)}</div>
                    : <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin datos</p>
                })()}
                <p className="text-xs font-bold uppercase tracking-wider mb-3 mt-4" style={{ color: 'var(--text-faint)' }}>Antecedentes familiares</p>
                {(() => {
                  const data = flatFreq(profiles.map(p => p.antecedentes_familiares))
                  const max = Math.max(...data.map(d => d[1]), 1)
                  return data.length
                    ? <div className="space-y-1.5">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i % PALETTE.length]} />)}</div>
                    : <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin datos</p>
                })()}
              </div>
            </div>
          </Sec>

          {/* ══ SECCIÓN 9: SALUD OCUPACIONAL ══ */}
          <Sec title="Salud ocupacional y riesgo psicosocial" icon={Shield} id="sec-ocup">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Salud ocupacional</p>
                <BoolBar label="Ha sufrido accidentes de trabajo" trueCount={countBool(profiles, p => p.accidentes_trabajo)} total={n} colorT="#EF4444" colorF="#10B981" />
                <BoolBar label="Ha tenido enfermedades laborales" trueCount={countBool(profiles, p => p.enfermedades_laborales)} total={n} colorT="#EF4444" colorF="#10B981" />
                <BoolBar label="Tiene restricciones médicas" trueCount={countBool(profiles, p => p.restricciones_medicas)} total={n} colorT="#F59E0B" colorF="#10B981" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Riesgo psicosocial</p>
                <BoolBar label="El trabajo genera estrés" trueCount={countBool(profiles, p => p.trabajo_genera_estres)} total={n} colorT="#EF4444" colorF="#10B981" />
                <BoolBar label="Cuenta con apoyo familiar" trueCount={countBool(profiles, p => p.apoyo_familiar)} total={n} colorT="#10B981" colorF="#EF4444" />
                <BoolBar label="Tiene otro empleo" trueCount={countBool(profiles, p => p.otro_empleo)} total={n} colorT="#F59E0B" colorF="var(--bg-card)" />
                <BoolBar label="Es cuidador de otra persona" trueCount={countBool(profiles, p => p.es_cuidador)} total={n} colorT="#F97316" colorF="var(--bg-card)" />
                <BoolBar label="Dificultades económicas" trueCount={countBool(profiles, p => p.dificultades_economicas)} total={n} colorT="#EF4444" colorF="#10B981" />
                <BoolBar label="Buen equilibrio trabajo/vida" trueCount={countBool(profiles, p => p.equilibrio_trabajo_vida)} total={n} colorT="#10B981" colorF="#EF4444" />
              </div>
            </div>
          </Sec>

          {/* ══ SECCIÓN 10: COMPETENCIAS ══ */}
          <Sec title="Competencias y certificaciones" icon={Award} id="sec-certs">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <BoolBar label="Tiene licencia de conducción" trueCount={countBool(profiles, p => p.licencia_conduccion)} total={n} colorT="#10B981" colorF="var(--bg-card)" />
                <p className="text-xs font-bold uppercase tracking-wider mt-4 mb-2" style={{ color: 'var(--text-faint)' }}>Tipo de licencia</p>
                <DonutChart size={100} data={freq(profiles.filter(p => p.licencia_conduccion).map(p => p.categoria_licencia)).map(([l, v]) => ({ label: l, value: v }))} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Certificaciones más frecuentes</p>
                {(() => {
                  const data = flatFreq(profiles.map(p => p.certificaciones))
                  const max = Math.max(...data.map(d => d[1]), 1)
                  return data.length
                    ? <div className="space-y-1.5">{data.map(([l, v], i) => <HBar key={l} label={l} value={v} max={max} total={n} color={PALETTE[i % PALETTE.length]} />)}</div>
                    : <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin datos</p>
                })()}
              </div>
            </div>
          </Sec>

          {/* ══ TABLA INDIVIDUAL ══ */}
          <div className="terra-card overflow-hidden no-print">
            <div className="p-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Detalle individual ({filtered.length})</h2>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                <input className="terra-input text-xs py-2 pl-8" style={{ width: 220 }}
                  placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: 900 }}>
                <colgroup>
                  <col style={{ width: '20%' }} /><col style={{ width: '10%' }} />
                  <col style={{ width: '13%' }} /><col style={{ width: '13%' }} />
                  <col style={{ width: '8%' }} /><col style={{ width: '10%' }} />
                  <col style={{ width: '8%' }} /><col style={{ width: '9%' }} /><col style={{ width: '9%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Trabajador','Edad','Área','Cargo','Contrato','Educación','IMC','Completitud','Actualizado'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-semibold text-[11px]" style={{ color: 'var(--text-dim)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-10" style={{ color: 'var(--text-faint)' }}>Sin resultados</td></tr>
                  )}
                  {filtered.map((p, i) => {
                    const a = age(p.fecha_nacimiento)
                    const im = imc(p.estatura_cm, p.peso_kg)
                    const cp = p.completion_pct ?? 0
                    const cc = cp >= 80 ? '#10B981' : cp >= 40 ? '#F59E0B' : '#EF4444'
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{p.users?.name || `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() || '—'}</p>
                          <p className="truncate" style={{ color: 'var(--text-faint)' }}>{p.users?.cedula ?? ''}</p>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-dim)' }}>{a ?? '—'}</td>
                        <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.area_confirmada ?? p.users?.area ?? '—'}</td>
                        <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.cargo_confirmado ?? '—'}</td>
                        <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.tipo_contrato ?? '—'}</td>
                        <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.nivel_educativo ?? '—'}</td>
                        <td className="px-3 py-2.5" style={{ color: im ? (im < 25 ? '#34D399' : im < 30 ? '#FBBF24' : '#F87171') : 'var(--text-dim)' }}>{im ?? '—'}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                              <div className="h-full rounded-full" style={{ width: `${cp}%`, background: cc }} />
                            </div>
                            <span className="font-bold text-[10px]" style={{ color: cc }}>{cp}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-faint)' }}>
                          {p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-CO') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>{/* end print-report */}
      </div>
    </>
  )
}
