'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, Heart, Shirt, Activity, FileSpreadsheet,
  FileText, BarChart2, Award, Home, Car, Briefcase,
  GraduationCap, Shield, Loader2, Search, ChevronUp, ChevronDown,
  AlertTriangle, CheckCircle, Eye
} from 'lucide-react'
import { computeAnalytics, type WP, type FreqRow, type Analytics } from '@/lib/profile-analytics'
import { exportToExcel } from './export-excel'
import { exportToPDF } from './export-pdf'

// ── Chart primitives ──────────────────────────────────────────────────
const PAL = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#F97316','#EC4899','#14B8A6','#A78BFA']

function HBar({ label, n, pct, max, color = '#3B82F6', total }: FreqRow & { max: number; total: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex-shrink-0 truncate text-right" style={{ width: 130, color: 'var(--text-dim)' }} title={label}>{label}</span>
      <div className="flex-1 h-6 rounded-lg overflow-hidden relative" style={{ background: 'var(--bg-card)' }}>
        <motion.div className="h-full rounded-lg flex items-center pl-2"
          initial={{ width: 0 }} animate={{ width: `${max ? (n / max) * 100 : 0}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }} style={{ background: color }}>
          {max > 0 && (n / max) > 0.15 && <span className="text-white font-bold text-[10px]">{n}</span>}
        </motion.div>
      </div>
      <span className="font-bold text-[11px] flex-shrink-0 w-6 text-right" style={{ color: 'var(--text)' }}>{n}</span>
      <span className="text-[10px] flex-shrink-0 w-9 text-right" style={{ color: 'var(--text-faint)' }}>{pct}%</span>
    </div>
  )
}

function DonutChart({ data, size = 130 }: { data: FreqRow[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.n, 0)
  if (!total) return <p className="text-xs py-6 text-center" style={{ color: 'var(--text-faint)' }}>Sin datos aún</p>
  let angle = -90; const r = 44; const cx = size / 2; const cy = size / 2
  const slices = data.slice(0, 8).map((d, i) => {
    const sweep = (d.n / total) * 360
    const r1 = (angle * Math.PI) / 180
    const r2 = ((angle + sweep) * Math.PI) / 180
    const path = `M${cx} ${cy} L${cx + r * Math.cos(r1)} ${cy + r * Math.sin(r1)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${cx + r * Math.cos(r2)} ${cy + r * Math.sin(r2)}Z`
    angle += sweep
    return { path, color: PAL[i % PAL.length], label: d.label, n: d.n, pct: d.pct }
  })
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="var(--bg-surface)" strokeWidth={2} />)}
        <circle cx={cx} cy={cy} r={22} fill="var(--bg-surface)" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="var(--text-color, #fff)">{total}</text>
      </svg>
      <div className="flex-1 space-y-1.5 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="truncate" style={{ color: 'var(--text-dim)' }}>{s.label}</span>
            <span className="font-bold ml-auto flex-shrink-0" style={{ color: 'var(--text)' }}>{s.n}</span>
            <span className="w-8 text-right flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BoolBar({ label, si, no, pctSi, colorT = '#10B981', colorF = '#EF4444' }: { label: string; si: number; no: number; pctSi: number; colorT?: string; colorF?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-dim)' }}>{label}</span>
        <span className="font-bold" style={{ color: pctSi >= 50 ? colorT : colorF }}>{pctSi}% SÍ</span>
      </div>
      <div className="h-5 rounded-lg overflow-hidden flex">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pctSi}%` }}
          transition={{ duration: 0.6 }} className="flex items-center justify-center"
          style={{ background: colorT }}>
          {pctSi > 10 && <span className="text-white text-[9px] font-bold">{si}</span>}
        </motion.div>
        <div className="flex-1 flex items-center justify-center" style={{ background: colorF }}>
          {(100 - pctSi) > 10 && <span className="text-white text-[9px] font-bold">{no}</span>}
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color = 'var(--primary)', alert }: { label: string; value: string | number; sub?: string; color?: string; alert?: boolean }) {
  return (
    <div className="terra-card p-4 relative overflow-hidden">
      {alert && <div className="absolute top-2 right-2"><AlertTriangle size={14} style={{ color: '#F59E0B' }} /></div>}
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>}
    </div>
  )
}

function Sec({ title, children, accent = 'var(--primary)' }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="terra-card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="h-5 w-1 rounded-full flex-shrink-0" style={{ background: accent }} />
        <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function FreqTable({ data, color = '#3B82F6' }: { data: FreqRow[]; color?: string }) {
  if (!data.length) return <p className="text-xs py-4" style={{ color: 'var(--text-faint)' }}>Sin datos aún</p>
  const max = data[0]?.n ?? 1
  return <div className="space-y-2">{data.slice(0, 10).map((r, i) => <HBar key={r.label} {...r} max={max} total={data.reduce((s, d) => s + d.n, 0)} color={PAL[i % PAL.length] ?? color} />)}</div>
}

// ── Tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'resumen',     label: 'Resumen',         icon: BarChart2 },
  { id: 'demografia',  label: 'Demografía',       icon: Users },
  { id: 'laboral',     label: 'Laboral',          icon: Briefcase },
  { id: 'salud',       label: 'Salud',            icon: Heart },
  { id: 'estilos',     label: 'Estilos de vida',  icon: Activity },
  { id: 'dotacion',    label: 'Dotación / EPP',   icon: Shirt },
  { id: 'competencias',label: 'Competencias',     icon: Award },
  { id: 'tabla',       label: 'Detalle',          icon: Eye },
]

// ── Main ──────────────────────────────────────────────────────────────
export default function WorkerProfilesPage() {
  const [profiles, setProfiles] = useState<WP[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('resumen')
  const [company, setCompany]   = useState('Organización')
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  // Table state
  const [search, setSearch]   = useState('')
  const [sortCol, setSortCol] = useState<string>('completion_pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage]       = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const PER = 15

  useEffect(() => {
    fetch('/api/worker-profiles')
      .then(r => r.ok ? r.json() : [])
      .then((d: WP[]) => { setProfiles(d); setLoading(false) })
    fetch('/api/companies').then(r => r.json()).then((d: any[]) => {
      if (d?.[0]?.name) setCompany(d[0].name)
    }).catch(() => {})
  }, [])

  const a: Analytics = computeAnalytics(profiles)

  const doExcelExport = async () => {
    setExporting('excel')
    await exportToExcel(profiles, a, company).finally(() => setExporting(null))
  }
  const doPdfExport = async () => {
    setExporting('pdf')
    await exportToPDF(a, company).finally(() => setExporting(null))
  }

  // ── Table ──────────────────────────────────────────────────────────
  function imc(e?: number, p?: number) { return e && p ? +(p / ((e / 100) ** 2)).toFixed(1) : null }
  function ageOf(dob?: string) { return dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : null }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    return !q || (p.users?.name ?? '').toLowerCase().includes(q)
      || (p.users?.cedula ?? '').includes(q)
      || (p.area_confirmada ?? '').toLowerCase().includes(q)
      || (p.cargo_confirmado ?? '').toLowerCase().includes(q)
      || (p.sexo ?? '').toLowerCase().includes(q)
  })
  const sorted = [...filtered].sort((a, b) => {
    const av = (a as any)[sortCol] ?? ''
    const bv = (b as any)[sortCol] ?? ''
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })
  const paged = sorted.slice((page - 1) * PER, page * PER)
  const totalPages = Math.ceil(sorted.length / PER)

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: string }) => sortCol === col
    ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
    : null

  const selected = profiles.find(p => p.id === selectedId)

  if (loading) return (
    <div className="flex items-center justify-center h-full py-40">
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  )

  if (!profiles.length) return (
    <div className="flex flex-col items-center justify-center h-full py-40 gap-4">
      <Users size={48} style={{ color: 'var(--text-faint)' }} />
      <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>Sin perfiles aún</p>
      <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-dim)' }}>Los trabajadores deben completar su Perfil Integral desde el menú "Mi Perfil".</p>
    </div>
  )

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>Centro de Inteligencia Sociodemográfica</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {a.total} trabajador{a.total !== 1 ? 'es' : ''} · Completitud promedio: <strong>{a.avgPct}%</strong> · Última actualización: {a.lastUpdate ? new Date(a.lastUpdate).toLocaleDateString('es-CO') : '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={doExcelExport} disabled={!!exporting}
            className="terra-btn text-xs" style={{ padding: '8px 14px', background: '#059669' }}>
            {exporting === 'excel' ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
            Excel
          </button>
          <button onClick={doPdfExport} disabled={!!exporting}
            className="terra-btn text-xs" style={{ padding: '8px 14px', background: '#DC2626' }}>
            {exporting === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            PDF
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={tab === t.id
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Icon size={12} />{t.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ════ RESUMEN ════ */}
          {tab === 'resumen' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KPI label="Trabajadores" value={a.total} />
                <KPI label="Completitud prom." value={`${a.avgPct}%`} color={a.avgPct >= 80 ? '#10B981' : '#F59E0B'} sub={`${a.complete80} al 80%+`} />
                <KPI label="Edad promedio" value={a.avgAge ? `${a.avgAge} a` : '—'} color="#8B5CF6" />
                <KPI label="Antigüedad prom." value={a.avgAntiguedad ? `${a.avgAntiguedad} a` : '—'} color="#06B6D4" />
                <KPI label="Áreas" value={a.areas.length} color="#F59E0B" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KPI label="Estrés laboral" value={`${a.estres.pctSi}%`} color={a.estres.pctSi >= 40 ? '#EF4444' : '#10B981'} sub={`${a.estres.si} personas`} alert={a.estres.pctSi >= 40} />
                <KPI label="Actividad física" value={`${a.actividadFisica.pctSi}%`} color={a.actividadFisica.pctSi >= 50 ? '#10B981' : '#F59E0B'} />
                <KPI label="Fumadores" value={`${a.fuma.pctSi}%`} color={a.fuma.pctSi >= 20 ? '#EF4444' : '#10B981'} alert={a.fuma.pctSi >= 20} />
                <KPI label="Acc. laborales" value={`${a.accidentesTrabajo.pctSi}%`} color={a.accidentesTrabajo.pctSi > 0 ? '#EF4444' : '#10B981'} alert={a.accidentesTrabajo.pctSi > 0} />
                <KPI label="IMC promedio" value={a.avgImc ?? '—'} color={a.avgImc && a.avgImc >= 30 ? '#EF4444' : a.avgImc && a.avgImc >= 25 ? '#F59E0B' : '#10B981'} sub={a.avgImc ? (a.avgImc >= 30 ? 'Obesidad' : a.avgImc >= 25 ? 'Sobrepeso' : 'Normal') : ''} />
              </div>

              {/* Alerts */}
              {a.estres.pctSi >= 40 && (
                <div className="terra-card p-4 flex items-start gap-3" style={{ borderLeft: '3px solid #F59E0B' }}>
                  <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Alerta de riesgo psicosocial</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>El {a.estres.pctSi}% de los trabajadores manifiesta estrés laboral. Se recomienda revisar cargas de trabajo e implementar pausas activas.</p>
                  </div>
                </div>
              )}
              {a.actividadFisica.pctSi < 40 && (
                <div className="terra-card p-4 flex items-start gap-3" style={{ borderLeft: '3px solid #3B82F6' }}>
                  <Activity size={16} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Sedentarismo elevado</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Solo el {a.actividadFisica.pctSi}% realiza actividad física. Promover programas de bienestar físico y deporte.</p>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-4">
                <Sec title="Distribución por sexo"><DonutChart data={a.sexo} /></Sec>
                <Sec title="Nivel educativo" accent="#8B5CF6"><FreqTable data={a.nivelEducativo} color="#8B5CF6" /></Sec>
                <Sec title="Tipo de contrato" accent="#10B981"><FreqTable data={a.tipoContrato} color="#10B981" /></Sec>
              </div>
            </div>
          )}

          {/* ════ DEMOGRAFÍA ════ */}
          {tab === 'demografia' && (
            <div className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Distribución por sexo"><DonutChart data={a.sexo} size={150} /></Sec>
                <Sec title="Estado civil" accent="#F59E0B"><FreqTable data={a.estadoCivil} color="#F59E0B" /></Sec>
              </div>
              <Sec title="Grupos de edad"><FreqTable data={a.ageGroups} color="#3B82F6" /></Sec>
              <Sec title="Ciudad de residencia (top 10)" accent="#06B6D4"><FreqTable data={a.ciudad} color="#06B6D4" /></Sec>
              <div className="grid lg:grid-cols-3 gap-4">
                <Sec title="Tipo de vivienda"><FreqTable data={a.tipoVivienda} /></Sec>
                <Sec title="Tenencia de vivienda" accent="#10B981"><FreqTable data={a.tenenciaVivienda} color="#10B981" /></Sec>
                <Sec title="Estrato socioeconómico" accent="#F59E0B"><FreqTable data={a.estrato} color="#F59E0B" /></Sec>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Con quién vive" accent="#8B5CF6"><FreqTable data={a.conQuienVive} color="#8B5CF6" /></Sec>
                <Sec title="Indicadores del hogar">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: 'Hijos promedio', v: a.avgHijos },
                      { l: 'Personas/hogar', v: a.avgPersonasHogar },
                      { l: 'Cabeza de hogar', v: `${a.cabezaHogar.pctSi}%` },
                    ].map(({ l, v }) => (
                      <div key={l} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)' }}>
                        <p className="text-xl font-black" style={{ color: 'var(--primary)' }}>{v}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  <BoolBar label="Acceso a internet en casa" si={profiles.filter(p => p.acceso_internet === true).length} no={profiles.filter(p => p.acceso_internet === false).length} pctSi={profiles.filter(p => p.acceso_internet !== undefined).length ? Math.round(profiles.filter(p => p.acceso_internet === true).length / profiles.filter(p => p.acceso_internet !== undefined).length * 100) : 0} />
                </Sec>
              </div>
            </div>
          )}

          {/* ════ LABORAL ════ */}
          {tab === 'laboral' && (
            <div className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Distribución por área"><FreqTable data={a.areas} /></Sec>
                <Sec title="Distribución por cargo" accent="#8B5CF6"><FreqTable data={a.cargos} color="#8B5CF6" /></Sec>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Tipo de contrato" accent="#10B981"><DonutChart data={a.tipoContrato} /></Sec>
                <Sec title="Jornada laboral" accent="#F59E0B"><DonutChart data={a.jornadaLaboral} /></Sec>
              </div>
              <Sec title="Nivel educativo" accent="#06B6D4"><FreqTable data={a.nivelEducativo} color="#06B6D4" /></Sec>
              <Sec title="Condiciones de trabajo">
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <BoolBar label="Realiza horas extras" si={a.horasExtras.si} no={a.horasExtras.no} pctSi={a.horasExtras.pctSi} colorT="#F59E0B" colorF="var(--bg-card)" />
                    <BoolBar label="Trabaja fines de semana" si={a.trabFinesSemana.si} no={a.trabFinesSemana.no} pctSi={a.trabFinesSemana.pctSi} colorT="#F97316" colorF="var(--bg-card)" />
                    <BoolBar label="Actualmente estudia" si={a.estudiaActualmente.si} no={a.estudiaActualmente.no} pctSi={a.estudiaActualmente.pctSi} colorT="#8B5CF6" colorF="var(--bg-card)" />
                  </div>
                  <div className="space-y-3">
                    {a.avgAntiguedad !== null && (
                      <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-card)' }}>
                        <p className="text-2xl font-black" style={{ color: '#06B6D4' }}>{a.avgAntiguedad} años</p>
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Antigüedad promedio</p>
                      </div>
                    )}
                  </div>
                </div>
              </Sec>
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Medio de transporte" accent="#06B6D4"><FreqTable data={a.medioTransporte} color="#06B6D4" /></Sec>
                <Sec title="Tiempo de desplazamiento" accent="#F59E0B">
                  <FreqTable data={a.tiempoDesplaz} color="#F59E0B" />
                  <div className="mt-3">
                    <BoolBar label="Conduce vehículo propio" si={a.conduceVehiculo.si} no={a.conduceVehiculo.no} pctSi={a.conduceVehiculo.pctSi} colorT="#06B6D4" colorF="var(--bg-card)" />
                  </div>
                </Sec>
              </div>
            </div>
          )}

          {/* ════ SALUD ════ */}
          {tab === 'salud' && (
            <div className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Antecedentes médicos personales" accent="#EF4444">
                  <div className="space-y-3">
                    {[
                      { l: 'Hospitalizado anteriormente', b: a.hospitalizado },
                      { l: 'Ha tenido cirugías', b: a.cirugias },
                      { l: 'Presenta alergias', b: a.alergias },
                      { l: 'Medicamentos permanentes', b: a.medicamentosPerm },
                      { l: 'Limitación física', b: a.limitacionFisica },
                      { l: 'USA gafas formuladas', b: a.usaGafas },
                      { l: 'USA audífonos', b: a.usaAudifonos },
                    ].map(({ l, b }) => <BoolBar key={l} label={l} si={b.si} no={b.no} pctSi={b.pctSi} />)}
                  </div>
                </Sec>
                <Sec title="Enfermedades más frecuentes" accent="#EF4444">
                  <FreqTable data={a.enfermedades} color="#EF4444" />
                </Sec>
              </div>
              <Sec title="Antecedentes familiares" accent="#8B5CF6">
                <FreqTable data={a.antecedentes} color="#8B5CF6" />
              </Sec>
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Salud ocupacional" accent="#F59E0B">
                  <div className="space-y-3">
                    <BoolBar label="Accidentes de trabajo previos" si={a.accidentesTrabajo.si} no={a.accidentesTrabajo.no} pctSi={a.accidentesTrabajo.pctSi} />
                    <BoolBar label="Enfermedades laborales" si={a.enfermedadesLaborales.si} no={a.enfermedadesLaborales.no} pctSi={a.enfermedadesLaborales.pctSi} />
                    <BoolBar label="Restricciones médicas" si={a.restriccionesMedicas.si} no={a.restriccionesMedicas.no} pctSi={a.restriccionesMedicas.pctSi} />
                  </div>
                </Sec>
                <Sec title="Riesgo psicosocial" accent="#EF4444">
                  <div className="space-y-3">
                    {[
                      { l: 'Trabajo genera estrés', b: a.estres },
                      { l: 'Apoyo familiar', b: a.apoyoFamiliar },
                      { l: 'Tiene otro empleo', b: a.otroEmpleo },
                      { l: 'Es cuidador de otra persona', b: a.esCuidador },
                      { l: 'Dificultades económicas', b: a.dificultadesEconomicas },
                      { l: 'Equilibrio trabajo/vida', b: a.equilibrioVida },
                    ].map(({ l, b }) => (
                      <BoolBar key={l} label={l} si={b.si} no={b.no} pctSi={b.pctSi}
                        colorT={l === 'Apoyo familiar' || l === 'Equilibrio trabajo/vida' ? '#10B981' : '#EF4444'}
                        colorF={l === 'Apoyo familiar' || l === 'Equilibrio trabajo/vida' ? '#EF4444' : '#10B981'} />
                    ))}
                  </div>
                </Sec>
              </div>
            </div>
          )}

          {/* ════ ESTILOS DE VIDA ════ */}
          {tab === 'estilos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPI label="Realizan actividad física" value={`${a.actividadFisica.pctSi}%`} color={a.actividadFisica.pctSi >= 50 ? '#10B981' : '#EF4444'} sub={`${a.actividadFisica.si} personas`} />
                <KPI label="Horas de sueño prom." value={a.avgHorasSueno ? `${a.avgHorasSueno}h` : '—'} color={a.avgHorasSueno && a.avgHorasSueno >= 7 ? '#10B981' : '#F59E0B'} />
                <KPI label="Fumadores" value={`${a.fuma.pctSi}%`} color={a.fuma.pctSi >= 20 ? '#EF4444' : '#10B981'} alert={a.fuma.pctSi >= 20} />
                <KPI label="Consumen energizantes" value={`${a.consumeEnergizantes.pctSi}%`} color="#F59E0B" />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Actividad física y descanso" accent="#10B981">
                  <div className="space-y-3">
                    <BoolBar label="Realiza actividad física regularmente" si={a.actividadFisica.si} no={a.actividadFisica.no} pctSi={a.actividadFisica.pctSi} />
                    <BoolBar label="Considera que descansa adecuadamente" si={a.descansoAdecuado.si} no={a.descansoAdecuado.no} pctSi={a.descansoAdecuado.pctSi} />
                  </div>
                </Sec>
                <Sec title="Alimentación" accent="#10B981">
                  <div className="space-y-3">
                    <BoolBar label="Desayuna diariamente" si={a.desayunaDisario.si} no={a.desayunaDisario.no} pctSi={a.desayunaDisario.pctSi} />
                    <BoolBar label="Consume frutas diariamente" si={a.consumeFrutas.si} no={a.consumeFrutas.no} pctSi={a.consumeFrutas.pctSi} />
                    <BoolBar label="Consume verduras diariamente" si={a.consumeVerduras.si} no={a.consumeVerduras.no} pctSi={a.consumeVerduras.pctSi} />
                  </div>
                </Sec>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Sec title="Hábitos de riesgo" accent="#EF4444">
                  <div className="space-y-3">
                    <BoolBar label="Fuma tabaco" si={a.fuma.si} no={a.fuma.no} pctSi={a.fuma.pctSi} />
                    <BoolBar label="Consume bebidas energizantes" si={a.consumeEnergizantes.si} no={a.consumeEnergizantes.no} pctSi={a.consumeEnergizantes.pctSi} colorT="#F59E0B" colorF="#10B981" />
                  </div>
                </Sec>
                <Sec title="Consumo de alcohol" accent="#F59E0B">
                  <FreqTable data={a.consumoAlcohol} color="#F59E0B" />
                </Sec>
              </div>
            </div>
          )}

          {/* ════ DOTACIÓN ════ */}
          {tab === 'dotacion' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPI label="Estatura promedio" value={a.avgEstatura ? `${a.avgEstatura}cm` : '—'} />
                <KPI label="Peso promedio" value={a.avgPeso ? `${a.avgPeso}kg` : '—'} />
                <KPI label="IMC promedio" value={a.avgImc ?? '—'} color={a.avgImc && a.avgImc >= 30 ? '#EF4444' : a.avgImc && a.avgImc >= 25 ? '#F59E0B' : '#10B981'} sub={a.avgImc ? (a.avgImc >= 30 ? 'Obesidad' : a.avgImc >= 25 ? 'Sobrepeso' : 'Normal') : ''} />
                <KPI label="Con limitación física" value={`${a.limitacionFisica.pctSi}%`} color={a.limitacionFisica.pctSi > 0 ? '#F59E0B' : '#10B981'} />
              </div>
              <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                  { title: 'Camisa', data: a.tallaCamisa },
                  { title: 'Camiseta', data: a.tallaCamiseta },
                  { title: 'Pantalón', data: a.tallaPantalon },
                  { title: 'Overol', data: a.tallaOverol },
                  { title: 'Chaqueta', data: a.tallaChaqueta },
                  { title: 'Impermeable', data: a.tallaImpermeable },
                  { title: 'Zapato', data: a.tallaZapato },
                  { title: 'Botas', data: a.tallaBotas },
                  { title: 'Guantes', data: a.tallaGuantes },
                ].filter(t => t.data.length > 0).map(({ title, data }, i) => (
                  <Sec key={title} title={`Talla ${title}`} accent={PAL[i % PAL.length]}>
                    <FreqTable data={data} color={PAL[i % PAL.length]} />
                  </Sec>
                ))}
              </div>
            </div>
          )}

          {/* ════ COMPETENCIAS ════ */}
          {tab === 'competencias' && (
            <div className="space-y-4">
              <Sec title="Licencias de conducción">
                <BoolBar label="Tiene licencia de conducción" si={a.licenciaConduccion.si} no={a.licenciaConduccion.no} pctSi={a.licenciaConduccion.pctSi} colorT="#10B981" colorF="var(--bg-card)" />
                {a.categoriaLicencia.length > 0 && <div className="mt-4"><FreqTable data={a.categoriaLicencia} /></div>}
              </Sec>
              <Sec title="Certificaciones y competencias" accent="#10B981">
                <FreqTable data={a.certificaciones} color="#10B981" />
              </Sec>
            </div>
          )}

          {/* ════ TABLA DETALLE ════ */}
          {tab === 'tabla' && (
            <div className="space-y-3">
              <div className="flex gap-2 items-center flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                  <input className="terra-input text-xs pl-9 w-full" placeholder="Buscar nombre, cédula, área, cargo..."
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="terra-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: 1000 }}>
                    <colgroup>
                      <col style={{ width: '18%' }} /><col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} /><col style={{ width: '12%' }} />
                      <col style={{ width: '8%' }} /><col style={{ width: '8%' }} />
                      <col style={{ width: '10%' }} /><col style={{ width: '10%' }} />
                      <col style={{ width: '7%' }} /><col style={{ width: '5%' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                        {[
                          { label: 'Trabajador',   col: 'nombres' },
                          { label: 'Cédula',        col: 'cedula' },
                          { label: 'Área',          col: 'area_confirmada' },
                          { label: 'Cargo',         col: 'cargo_confirmado' },
                          { label: 'Edad',          col: 'fecha_nacimiento' },
                          { label: 'Sexo',          col: 'sexo' },
                          { label: 'Educación',     col: 'nivel_educativo' },
                          { label: 'Contrato',      col: 'tipo_contrato' },
                          { label: 'Completitud',   col: 'completion_pct' },
                          { label: 'Ver',           col: '' },
                        ].map(({ label, col }) => (
                          <th key={label} className="text-left px-3 py-2.5 font-semibold select-none"
                            style={{ color: 'var(--text-dim)', cursor: col ? 'pointer' : 'default' }}
                            onClick={() => col && toggleSort(col)}>
                            <span className="flex items-center gap-1">{label}{col && <SortIcon col={col} />}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.length === 0 && (
                        <tr><td colSpan={10} className="text-center py-12" style={{ color: 'var(--text-faint)' }}>Sin resultados</td></tr>
                      )}
                      {paged.map((p, i) => {
                        const a2 = ageOf(p.fecha_nacimiento)
                        const cp = p.completion_pct ?? 0
                        const cc = cp >= 80 ? '#10B981' : cp >= 40 ? '#F59E0B' : '#EF4444'
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                            <td className="px-3 py-2">
                              <p className="font-semibold truncate" style={{ color: 'var(--text)' }} title={p.users?.name}>{p.users?.name || `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() || '—'}</p>
                            </td>
                            <td className="px-3 py-2 truncate" style={{ color: 'var(--text-dim)' }}>{p.users?.cedula ?? '—'}</td>
                            <td className="px-3 py-2 truncate" style={{ color: 'var(--text-dim)' }}>{p.area_confirmada ?? p.users?.area ?? '—'}</td>
                            <td className="px-3 py-2 truncate" style={{ color: 'var(--text-dim)' }}>{p.cargo_confirmado ?? '—'}</td>
                            <td className="px-3 py-2" style={{ color: 'var(--text-dim)' }}>{a2 ?? '—'}</td>
                            <td className="px-3 py-2" style={{ color: 'var(--text-dim)' }}>{p.sexo ?? '—'}</td>
                            <td className="px-3 py-2 truncate" style={{ color: 'var(--text-dim)' }}>{p.nivel_educativo ?? '—'}</td>
                            <td className="px-3 py-2 truncate" style={{ color: 'var(--text-dim)' }}>{p.tipo_contrato ?? '—'}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${cp}%`, background: cc }} />
                                </div>
                                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: cc }}>{cp}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <button onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: selectedId === p.id ? 'var(--primary)' : 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <Eye size={12} style={{ color: selectedId === p.id ? '#fff' : 'var(--text-dim)' }} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Página {page} de {totalPages} · {filtered.length} registros</span>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const pg = totalPages <= 7 ? i + 1 : i === 0 ? 1 : i === 6 ? totalPages : page - 3 + i
                        return (
                          <button key={pg} onClick={() => setPage(pg)}
                            className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                            style={pg === page ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                            {pg}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Ficha expandida ── */}
              <AnimatePresence>
                {selected && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="terra-card overflow-hidden">
                    <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold" style={{ color: 'var(--text)' }}>{selected.users?.name ?? `${selected.nombres ?? ''} ${selected.apellidos ?? ''}`}</h3>
                        <button onClick={() => setSelectedId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>Cerrar</button>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-xs">
                      {[
                        ['Cédula', selected.users?.cedula],
                        ['Sexo', selected.sexo],
                        ['Estado civil', selected.estado_civil],
                        ['Edad', ageOf(selected.fecha_nacimiento) ? `${ageOf(selected.fecha_nacimiento)} años` : undefined],
                        ['Ciudad', selected.ciudad_residencia],
                        ['Tipo vivienda', selected.tipo_vivienda],
                        ['Estrato', selected.estrato ? `Estrato ${selected.estrato}` : undefined],
                        ['Área', selected.area_confirmada ?? selected.users?.area],
                        ['Cargo', selected.cargo_confirmado],
                        ['Contrato', selected.tipo_contrato],
                        ['Jornada', selected.jornada_laboral],
                        ['Educación', selected.nivel_educativo],
                        ['Transporte', selected.medio_transporte],
                        ['Talla camisa', selected.talla_camisa],
                        ['Talla zapato', selected.talla_zapato],
                        ['IMC', imc(selected.estatura_cm, selected.peso_kg) ? `${imc(selected.estatura_cm, selected.peso_kg)}` : undefined],
                      ].map(([k, v]) => v ? (
                        <div key={k as string}>
                          <span style={{ color: 'var(--text-faint)' }}>{k}: </span>
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>{v}</span>
                        </div>
                      ) : null)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
