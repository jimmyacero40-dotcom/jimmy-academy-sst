'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldAlert, Loader2, Search, Download, FileText, Eye, X,
  CheckCircle, Clock, BarChart2, Users, Table2,
} from 'lucide-react'
import { RespuestasPeligros } from '@/components/RespuestasPeligros'
import { tabular, type Fila, type Conteo } from '@/lib/peligros-tabulacion'
import { GRUPOS_PELIGROS } from '@/lib/peligros'
import { exportarFormularioPDF } from './export-pdf'
import { exportarResultadosExcel } from './export-excel'

const COLOR_GRUPO = Object.fromEntries(GRUPOS_PELIGROS.map(g => [g.grupo, g.color]))
const sel = 'bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]'

export default function ParticipacionAdminPage() {
  const [filas, setFilas] = useState<Fila[]>([])
  const [periodo, setPeriodo] = useState(new Date().getFullYear())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<'resumen' | 'trabajadores' | 'resultados'>('resumen')
  const [detalle, setDetalle] = useState<Fila | null>(null)
  const [empresa, setEmpresa] = useState('Empresa')

  const [busqueda, setBusqueda] = useState('')
  const [fArea, setFArea] = useState('')
  const [fCargo, setFCargo] = useState('')
  const [fCentro, setFCentro] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fDesde, setFDesde] = useState('')
  const [fHasta, setFHasta] = useState('')

  useEffect(() => {
    setCargando(true); setError(null)
    fetch(`/api/participacion-peligros?alcance=empresa&periodo=${periodo}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Error')
        return r.json()
      })
      .then(d => setFilas(d.filas ?? []))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [periodo])

  useEffect(() => {
    fetch('/api/company-info').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setEmpresa(d.name) }).catch(() => {})
  }, [])

  const opciones = (campo: keyof Fila) =>
    [...new Set(filas.map(f => (f[campo] as string | null)?.trim()).filter(Boolean) as string[])].sort()

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return filas.filter(f => {
      if (q && !(`${f.nombre ?? ''} ${f.cedula ?? ''}`.toLowerCase().includes(q))) return false
      if (fArea && (f.area?.trim() || 'Sin asignar') !== fArea) return false
      if (fCargo && (f.cargo?.trim() || 'Sin asignar') !== fCargo) return false
      if (fCentro && (f.centro_trabajo?.trim() || 'Sin asignar') !== fCentro) return false
      if (fEstado && f.estado !== fEstado) return false
      if (fDesde || fHasta) {
        if (!f.enviado_at) return false
        const d = f.enviado_at.slice(0, 10)
        if (fDesde && d < fDesde) return false
        if (fHasta && d > fHasta) return false
      }
      return true
    })
  }, [filas, busqueda, fArea, fCargo, fCentro, fEstado, fDesde, fHasta])

  // La tabulación se calcula sobre lo filtrado: así se analiza por área o finca.
  const t = useMemo(() => tabular(visibles), [visibles])
  const hayFiltro = !!(busqueda || fArea || fCargo || fCentro || fEstado || fDesde || fHasta)

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando participaciones…</p>
    </div>
  )

  if (error) return (
    <div className="max-w-xl mx-auto p-4">
      <div className="terra-card p-8 text-center">
        <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{error}</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 pb-24 max-w-[1400px] mx-auto">

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
            <ShieldAlert size={21} />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Participación de trabajadores
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Identificación de peligros · Periodo {periodo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select value={periodo} onChange={e => setPeriodo(Number(e.target.value))} className={sel}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => exportarResultadosExcel(visibles, periodo, empresa)}
            className="terra-btn-outline flex items-center gap-1.5" style={{ padding: '8px 14px', fontSize: 12 }}>
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      {/* ── Indicadores ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total de trabajadores', valor: t.totalTrabajadores, color: 'var(--primary)', icono: Users },
          { label: 'Participaron', valor: t.participantes, color: '#10B981', icono: CheckCircle },
          { label: 'Pendientes', valor: t.pendientes, color: '#F59E0B', icono: Clock },
          { label: '% de participación', valor: `${t.pctParticipacion}%`, color: '#8B5CF6', icono: BarChart2 },
        ].map(k => (
          <div key={k.label} className="terra-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <k.icono size={14} style={{ color: k.color }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k.label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.valor}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="terra-card p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o cédula"
              className={`${sel} w-full`} style={{ paddingLeft: 30 }} />
          </div>
          <select value={fArea} onChange={e => setFArea(e.target.value)} className={sel}>
            <option value="">Todas las áreas</option>
            {opciones('area').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fCargo} onChange={e => setFCargo(e.target.value)} className={sel}>
            <option value="">Todos los cargos</option>
            {opciones('cargo').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fCentro} onChange={e => setFCentro(e.target.value)} className={sel}>
            <option value="">Todas las fincas</option>
            {opciones('centro_trabajo').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fEstado} onChange={e => setFEstado(e.target.value)} className={sel}>
            <option value="">Todos los estados</option>
            <option>Participó</option>
            <option>Pendiente</option>
          </select>
          <input type="date" value={fDesde} onChange={e => setFDesde(e.target.value)} className={sel} title="Desde" />
          <input type="date" value={fHasta} onChange={e => setFHasta(e.target.value)} className={sel} title="Hasta" />
          {hayFiltro && (
            <button onClick={() => { setBusqueda(''); setFArea(''); setFCargo(''); setFCentro(''); setFEstado(''); setFDesde(''); setFHasta('') }}
              className="text-xs font-bold px-3 py-2 rounded-lg"
              style={{ color: 'var(--primary)', border: '1px solid var(--border)' }}>
              Limpiar
            </button>
          )}
        </div>
        {hayFiltro && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
            Mostrando {visibles.length} de {filas.length} trabajadores. Los indicadores y los resultados
            se calculan sobre lo filtrado.
          </p>
        )}
      </div>

      {/* ── Vistas ── */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {([
          ['resumen', 'Resumen', BarChart2],
          ['trabajadores', 'Trabajadores', Users],
          ['resultados', 'Resultados', Table2],
        ] as const).map(([id, label, Icono]) => (
          <button key={id} onClick={() => setVista(id)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={vista === id
              ? { background: 'var(--primary)', color: '#fff' }
              : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <Icono size={13} /> {label}
          </button>
        ))}
      </div>

      {vista === 'resumen' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Bloque titulo="Participación por área" filas={t.porArea} sufijo="participaron" />
          <Bloque titulo="Participación por finca / centro" filas={t.porCentro} sufijo="participaron" />
          <Bloque titulo="Participación por cargo" filas={t.porCargo} sufijo="participaron" />
        </div>
      )}

      {vista === 'trabajadores' && (
        <div className="terra-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  {['Trabajador', 'Cédula', 'Cargo', 'Área', 'Finca / centro', 'Fecha', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.map(f => (
                  <tr key={f.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: 'var(--text)' }}>{f.nombre ?? '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--text-dim)' }}>{f.cedula ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{f.cargo ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{f.area ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{f.centro_trabajo ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>
                      {f.enviado_at ? new Date(f.enviado_at).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                        style={f.estado === 'Participó'
                          ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                          : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {f.participacion ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => setDetalle(f)}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}>
                            <Eye size={11} /> Ver respuestas
                          </button>
                          <button onClick={() => exportarFormularioPDF(f.participacion!, empresa)}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                            <FileText size={11} /> PDF
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Sin respuestas</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!visibles.length && (
                  <tr><td colSpan={8} className="px-3 py-10 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
                    Ningún trabajador coincide con los filtros.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista === 'resultados' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-xs leading-relaxed"
            style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--text-dim)' }}>
            <strong style={{ color: 'var(--text)' }}>Cómo leer estos números:</strong> el porcentaje es sobre los{' '}
            <strong style={{ color: 'var(--text)' }}>{t.participantes} trabajadores que participaron</strong>, no sobre
            el total de marcas. Como cada persona puede señalar varios peligros, los porcentajes pueden sumar más de 100 %.
            En promedio cada participante marcó {t.promedioPeligros} peligros.
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Bloque titulo="Peligros más identificados" filas={t.peligros} base={t.participantes} colorPorGrupo limite={40} />
            <div className="space-y-4">
              <Bloque titulo="Por clase de peligro" filas={t.porGrupoPeligro} base={t.participantes} colorPorGrupo />
              <Bloque titulo="Frecuencia de exposición" filas={t.frecuencia} base={t.participantes} />
              <Bloque titulo="¿Los controles son suficientes?" filas={t.suficiencia} base={t.participantes} />
              <Bloque titulo="Cambios en el último año" filas={t.cambios} base={t.participantes} />
            </div>
          </div>
        </div>
      )}

      {/* ── Respuestas de un trabajador ── */}
      {detalle?.participacion && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setDetalle(null)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            className="terra-card w-full max-w-3xl my-8 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-base font-black" style={{ color: 'var(--text)' }}>{detalle.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Participación en la identificación de peligros · {detalle.participacion.periodo}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportarFormularioPDF(detalle.participacion!, empresa)}
                  className="terra-btn-outline flex items-center gap-1.5" style={{ padding: '7px 12px', fontSize: 12 }}>
                  <Download size={12} /> Descargar
                </button>
                <button onClick={() => setDetalle(null)} style={{ color: 'var(--text-faint)' }}><X size={18} /></button>
              </div>
            </div>
            <RespuestasPeligros p={detalle.participacion} />
          </motion.div>
        </div>
      )}
    </div>
  )
}

/** Barras horizontales con el conteo de trabajadores y su porcentaje. */
function Bloque({ titulo, filas, base, sufijo, colorPorGrupo, limite = 100 }: {
  titulo: string
  filas: Conteo[]
  base?: number
  sufijo?: string
  colorPorGrupo?: boolean
  limite?: number
}) {
  const visibles = filas.slice(0, limite)
  const max = Math.max(1, ...visibles.map(f => f.n))
  return (
    <div className="terra-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-dim)' }}>{titulo}</p>
      {!visibles.length && <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Sin datos todavía.</p>}
      <div className="space-y-2">
        {visibles.map(f => {
          const color = colorPorGrupo ? (COLOR_GRUPO[f.grupo ?? f.etiqueta] ?? 'var(--primary)') : 'var(--primary)'
          return (
            <div key={f.etiqueta}>
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <span className="text-xs truncate" style={{ color: 'var(--text)' }}>{f.etiqueta}</span>
                <span className="text-[11px] font-bold whitespace-nowrap" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
                  {f.n}{sufijo ? '' : ' trab.'} · {f.pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                <div className="h-full rounded-full" style={{ width: `${(f.n / max) * 100}%`, background: color }} />
              </div>
              {f.grupo && sufijo && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{f.grupo} {sufijo}</p>
              )}
            </div>
          )
        })}
      </div>
      {base !== undefined && !!visibles.length && (
        <p className="text-[10px] mt-3 pt-2" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--border)' }}>
          Base: {base} participantes.
        </p>
      )}
    </div>
  )
}
