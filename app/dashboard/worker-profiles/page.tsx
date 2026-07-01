'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, Heart, Shirt, Activity, Download,
  CheckCircle, Clock, AlertCircle, Loader2, BarChart2, Award
} from 'lucide-react'

interface WorkerProfile {
  id: string; user_id: string; completion_pct: number; updated_at: string
  sexo?: string; estado_civil?: string; nivel_educativo?: string; estrato?: number
  tipo_contrato?: string; jornada_laboral?: string
  realiza_actividad_fisica?: boolean; fuma?: boolean; consumo_alcohol?: string
  horas_sueno?: number; enfermedades_diagnosticadas?: string[]
  accidentes_trabajo?: boolean; enfermedades_laborales?: boolean
  talla_camisa?: string; talla_camiseta?: string; talla_pantalon?: string
  talla_overol?: string; talla_chaqueta?: string; talla_impermeable?: string
  talla_zapato?: string; talla_botas?: string; talla_guantes?: string
  fecha_nacimiento?: string; cargo_confirmado?: string; area_confirmada?: string
  certificaciones?: string[]; trabajo_genera_estres?: boolean
  users?: { name?: string; cedula?: string; email?: string; area?: string }
}

function count<T>(arr: T[], fn: (v: T) => boolean) { return arr.filter(fn).length }
function pct(n: number, total: number) { return total ? Math.round((n / total) * 100) : 0 }

function freq<T>(arr: T[], key: (v: T) => string | undefined) {
  const map: Record<string, number> = {}
  arr.forEach(v => { const k = key(v); if (k) map[k] = (map[k] ?? 0) + 1 })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

function age(dob?: string) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function DistBar({ label, value, max, color = 'var(--primary)' }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 truncate flex-shrink-0" style={{ color: 'var(--text-dim)' }} title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
          animate={{ width: `${pct(value, max)}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ background: color }} />
      </div>
      <span className="w-8 text-right font-bold" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

function StatCard({ title, value, sub, icon: Icon, color = 'var(--primary)' }: { title: string; value: string | number; sub?: string; icon: any; color?: string }) {
  return (
    <div className="terra-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{title}</p>
      {sub && <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>{sub}</p>}
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="terra-card p-5">
      <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <Icon size={15} style={{ color: 'var(--primary)' }} />
        <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function WorkerProfilesPage() {
  const [profiles, setProfiles] = useState<WorkerProfile[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    fetch('/api/worker-profiles')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setProfiles(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full py-32">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  )

  const n        = profiles.length
  const complete = profiles.filter(p => (p.completion_pct ?? 0) >= 80)
  const avgPct   = n ? Math.round(profiles.reduce((s, p) => s + (p.completion_pct ?? 0), 0) / n) : 0

  // Demographics
  const ages     = profiles.map(p => age(p.fecha_nacimiento)).filter(Boolean) as number[]
  const avgAge   = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null

  // Health
  const stressCount = count(profiles, p => p.trabajo_genera_estres === true)
  const fumaCount   = count(profiles, p => p.fuma === true)
  const accCount    = count(profiles, p => p.accidentes_trabajo === true)
  const enfLabCount = count(profiles, p => p.enfermedades_laborales === true)
  const actFisica   = count(profiles, p => p.realiza_actividad_fisica === true)

  // Top diseases across all workers
  const allDiseases: string[] = profiles.flatMap(p => p.enfermedades_diagnosticadas ?? [])
  const diseaseFreq = freq(allDiseases.map(d => ({ v: d })), x => x.v)

  // Top certs
  const allCerts   = profiles.flatMap(p => p.certificaciones ?? [])
  const certFreq   = freq(allCerts.map(c => ({ v: c })), x => x.v)

  const sexoFreq   = freq(profiles, p => p.sexo)
  const eduFreq    = freq(profiles, p => p.nivel_educativo)
  const contratoFreq = freq(profiles, p => p.tipo_contrato)
  const alcoholFreq  = freq(profiles, p => p.consumo_alcohol)

  // Tallas
  const tallasCamisa = freq(profiles, p => p.talla_camisa)
  const tallasZapato = freq(profiles, p => p.talla_zapato)
  const tallasPantalon = freq(profiles, p => p.talla_pantalon)

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    return !q || p.users?.name?.toLowerCase().includes(q) || p.users?.cedula?.includes(q) || p.area_confirmada?.toLowerCase().includes(q)
  })

  const exportCsv = () => {
    const cols = ['Nombre','Cédula','Área','Cargo','Completion %','Sexo','Nivel educativo','Tipo contrato','Estrés','Fuma','Accidente laboral','Talla camisa','Talla zapato']
    const rows = profiles.map(p => [
      p.users?.name ?? '', p.users?.cedula ?? '',
      p.area_confirmada ?? p.users?.area ?? '', p.cargo_confirmado ?? '',
      p.completion_pct ?? 0, p.sexo ?? '', p.nivel_educativo ?? '', p.tipo_contrato ?? '',
      p.trabajo_genera_estres ? 'Sí' : 'No', p.fuma ? 'Sí' : 'No',
      p.accidentes_trabajo ? 'Sí' : 'No', p.talla_camisa ?? '', p.talla_zapato ?? ''
    ])
    const csv = [cols, ...rows].map(r => r.join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'perfiles_trabajadores.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Perfiles Integrales</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Analítica de bienestar y perfil de la fuerza laboral</p>
        </div>
        <button onClick={exportCsv} className="terra-btn" style={{ padding: '8px 16px', fontSize: 13 }}>
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Trabajadores con perfil" value={n} sub={`${n} registros totales`} icon={Users} />
        <StatCard title="Completion promedio" value={`${avgPct}%`} sub={`${complete.length} perfiles ≥ 80%`} icon={TrendingUp} color="#10B981" />
        <StatCard title="Edad promedio" value={avgAge ? `${avgAge} años` : '—'} icon={Users} color="#8B5CF6" />
        <StatCard title="Con estrés laboral" value={n ? `${pct(stressCount, n)}%` : '—'} sub={`${stressCount} de ${n}`} icon={Heart} color="#F59E0B" />
      </div>

      {/* ── Row 1 ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Completion breakdown */}
        <Section title="Completitud por trabajador" icon={TrendingUp}>
          <div className="space-y-3">
            {[
              { label: 'Completo ≥80%',  val: complete.length,                                 color: '#10B981' },
              { label: 'Parcial 40-79%', val: count(profiles, p => (p.completion_pct ?? 0) >= 40 && (p.completion_pct ?? 0) < 80), color: '#F59E0B' },
              { label: 'Inicio <40%',    val: count(profiles, p => (p.completion_pct ?? 0) < 40), color: '#EF4444' },
            ].map(({ label, val, color }) => (
              <DistBar key={label} label={label} value={val} max={n || 1} color={color} />
            ))}
          </div>
        </Section>

        {/* Sexo & Educación */}
        <Section title="Distribución demográfica" icon={Users}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Sexo</p>
          <div className="space-y-2 mb-4">
            {sexoFreq.map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} />)}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Nivel educativo</p>
          <div className="space-y-2">
            {eduFreq.slice(0, 5).map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} />)}
          </div>
        </Section>

        {/* Contrato & jornada */}
        <Section title="Perfil laboral" icon={BarChart2}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Tipo de contrato</p>
          <div className="space-y-2 mb-4">
            {contratoFreq.slice(0, 5).map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} />)}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Consumo de alcohol</p>
          <div className="space-y-2">
            {alcoholFreq.slice(0, 4).map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} />)}
          </div>
        </Section>
      </div>

      {/* ── Row 2: Health ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Salud y hábitos" icon={Heart}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Actividad física', val: actFisica, icon: Activity, color: '#10B981' },
              { label: 'Fumadores',         val: fumaCount,   icon: AlertCircle, color: '#EF4444' },
              { label: 'Estrés laboral',    val: stressCount, icon: Heart, color: '#F59E0B' },
              { label: 'Acc. laborales',    val: accCount,    icon: AlertCircle, color: '#EF4444' },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Icon size={18} className="mx-auto mb-1" style={{ color }} />
                <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{val} <span className="text-xs font-normal" style={{ color: 'var(--text-dim)' }}>({pct(val, n)}%)</span></p>
                <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{label}</p>
              </div>
            ))}
          </div>
          {diseaseFreq.length > 0 && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Enfermedades más frecuentes</p>
              <div className="space-y-2">
                {diseaseFreq.slice(0, 5).map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} color="#EF4444" />)}
              </div>
            </>
          )}
        </Section>

        {/* Competencias */}
        <Section title="Certificaciones y competencias" icon={Award}>
          {certFreq.length > 0 ? (
            <div className="space-y-2">
              {certFreq.slice(0, 8).map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} color="#8B5CF6" />)}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>Sin datos de certificaciones aún</p>
          )}
        </Section>
      </div>

      {/* ── Row 3: Tallas ── */}
      <Section title="Tallas de dotación (para compras)" icon={Shirt}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Camisa / Camiseta</p>
            <div className="space-y-2">
              {tallasCamisa.map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} color="#06B6D4" />)}
              {tallasCamisa.length === 0 && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin datos</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Pantalón</p>
            <div className="space-y-2">
              {tallasPantalon.map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} color="#06B6D4" />)}
              {tallasPantalon.length === 0 && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin datos</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Calzado (Zapato / Botas)</p>
            <div className="space-y-2">
              {tallasZapato.map(([k, v]) => <DistBar key={k} label={k} value={v} max={n || 1} color="#06B6D4" />)}
              {tallasZapato.length === 0 && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Sin datos</p>}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Table ── */}
      <div className="terra-card overflow-hidden">
        <div className="p-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Detalle por trabajador</h2>
          <input
            className="terra-input text-xs py-2"
            style={{ width: 220 }}
            placeholder="Buscar nombre, cédula, área..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: 700 }}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                {['Trabajador','Área','Cargo','Completion','Educación','Contrato','Actualizado'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: 'var(--text-dim)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10" style={{ color: 'var(--text-faint)' }}>Sin perfiles disponibles</td></tr>
              )}
              {filtered.map((p, i) => {
                const pctVal = p.completion_pct ?? 0
                const pctColor = pctVal >= 80 ? '#10B981' : pctVal >= 40 ? '#F59E0B' : '#EF4444'
                return (
                  <tr key={p.id}
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold truncate" style={{ color: 'var(--text)' }} title={p.users?.name}>{p.users?.name ?? '—'}</p>
                      <p className="truncate" style={{ color: 'var(--text-faint)' }}>{p.users?.cedula ?? ''}</p>
                    </td>
                    <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.area_confirmada ?? p.users?.area ?? '—'}</td>
                    <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.cargo_confirmado ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pctVal}%`, background: pctColor }} />
                        </div>
                        <span className="font-bold w-8 text-right" style={{ color: pctColor }}>{pctVal}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.nivel_educativo ?? '—'}</td>
                    <td className="px-3 py-2.5 truncate" style={{ color: 'var(--text-dim)' }}>{p.tipo_contrato ?? '—'}</td>
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
    </div>
  )
}
