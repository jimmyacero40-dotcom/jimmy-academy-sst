'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Loader2, Search, Download, X, Save, History,
  Inbox, Eye, Wrench, CheckCircle, Layers,
} from 'lucide-react'
import { TarjetaHSE } from '@/components/TarjetaHSE'
import {
  ESTADOS, ESTADOS_GESTION, TIPOS_REPORTE,
  type ReporteHSE, type EstadoReporte,
} from '@/lib/reportes-hse'
import { exportarTarjetaPDF } from './export-pdf'

const sel = 'bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]'
const inp = 'w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]'
const COLOR_TIPO = Object.fromEntries(TIPOS_REPORTE.map(t => [t.id, t.color]))

interface Evento { id: string; user_name: string | null; accion: string; detalle: any; created_at: string }
interface Responsable { id: string; nombre: string; cargo: string | null }

const soloFecha = (s?: string | null) => (s ? s.slice(0, 10) : '')

export default function BandejaReportalPage() {
  const [reportes, setReportes] = useState<ReporteHSE[]>([])
  const [responsables, setResponsables] = useState<Responsable[]>([])
  const [empresa, setEmpresa] = useState('Empresa')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [abierto, setAbierto] = useState<ReporteHSE | null>(null)
  const [bitacora, setBitacora] = useState<Evento[]>([])
  const [borrador, setBorrador] = useState<Record<string, any>>({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [errorGestion, setErrorGestion] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fTipo, setFTipo] = useState('')
  const [fArea, setFArea] = useState('')
  const [fCentro, setFCentro] = useState('')
  const [fResp, setFResp] = useState('')
  const [fDesde, setFDesde] = useState('')
  const [fHasta, setFHasta] = useState('')

  const cargar = useCallback(() => {
    setCargando(true); setError(null)
    fetch('/api/reportes-hse?alcance=empresa')
      .then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Error'); return r.json() })
      .then(d => setReportes(d.reportes ?? []))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    fetch('/api/reportes-hse/responsables').then(r => r.ok ? r.json() : null)
      .then(d => setResponsables(d?.responsables ?? [])).catch(() => {})
    fetch('/api/company-info').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setEmpresa(d.name) }).catch(() => {})
  }, [])

  const abrir = async (r: ReporteHSE) => {
    setAbierto(r); setBitacora([]); setGuardado(false); setErrorGestion(null)
    setBorrador({
      estado: r.estado ?? 'nuevo',
      responsable_id: r.responsable_id ?? '',
      fecha_asignacion: soloFecha(r.fecha_asignacion),
      observaciones_sst: r.observaciones_sst ?? '',
      accion_intervencion: r.accion_intervencion ?? '',
      fecha_gestion: soloFecha(r.fecha_gestion),
      fecha_cierre: soloFecha(r.fecha_cierre),
      observaciones_cierre: r.observaciones_cierre ?? '',
      recibe_nombre: r.recibe_nombre ?? '',
      matriz_mejoras_num: r.matriz_mejoras_num ?? '',
    })
    const res = await fetch(`/api/reportes-hse/${r.id}`)
    if (res.ok) { const d = await res.json(); setAbierto(d.reporte); setBitacora(d.bitacora ?? []) }
  }

  const guardarGestion = async () => {
    if (!abierto) return
    setGuardando(true); setErrorGestion(null); setGuardado(false)
    try {
      const res = await fetch(`/api/reportes-hse/${abierto.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(borrador),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setErrorGestion(body.error ?? 'No fue posible guardar'); return }
      setAbierto(body.reporte)
      setReportes(rs => rs.map(x => (x.id === body.reporte.id ? body.reporte : x)))
      const bit = await fetch(`/api/reportes-hse/${abierto.id}`)
      if (bit.ok) setBitacora((await bit.json()).bitacora ?? [])
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
    } finally { setGuardando(false) }
  }

  const opciones = (campo: keyof ReporteHSE) =>
    [...new Set(reportes.map(r => (r[campo] as string | null)?.trim()).filter(Boolean) as string[])].sort()

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return reportes.filter(r => {
      if (q && !`${r.codigo ?? ''} ${r.reporta_nombre ?? ''} ${r.reporta_cedula ?? ''} ${r.descripcion ?? ''} ${r.lugar ?? ''}`
        .toLowerCase().includes(q)) return false
      if (fEstado && r.estado !== fEstado) return false
      if (fTipo && !(r.tipos ?? []).includes(fTipo)) return false
      if (fArea && (r.area?.trim() || 'Sin asignar') !== fArea) return false
      if (fCentro && (r.centro_trabajo?.trim() || 'Sin asignar') !== fCentro) return false
      if (fResp && (r.responsable_id ?? 'sin') !== fResp) return false
      if (fDesde && soloFecha(r.fecha_reporte) < fDesde) return false
      if (fHasta && soloFecha(r.fecha_reporte) > fHasta) return false
      return true
    })
  }, [reportes, busqueda, fEstado, fTipo, fArea, fCentro, fResp, fDesde, fHasta])

  const cuenta = (e: EstadoReporte) => visibles.filter(r => r.estado === e).length
  const hayFiltro = !!(busqueda || fEstado || fTipo || fArea || fCentro || fResp || fDesde || fHasta)

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando reportes…</p>
    </div>
  )
  if (error) return (
    <div className="max-w-xl mx-auto p-4"><div className="terra-card p-8 text-center">
      <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{error}</p>
    </div></div>
  )

  return (
    <div className="p-4 pb-24 max-w-[1500px] mx-auto">

      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}>
          <FileText size={21} />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            RePortal
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Tarjetas de reporte HSE enviadas por los trabajadores
          </p>
        </div>
      </div>

      {/* ── Indicadores ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {([
          ['Nuevos', cuenta('nuevo'), ESTADOS.nuevo.color, Inbox],
          ['En revisión', cuenta('en_revision'), ESTADOS.en_revision.color, Eye],
          ['En gestión', cuenta('en_gestion'), ESTADOS.en_gestion.color, Wrench],
          ['Cerrados', cuenta('cerrado'), ESTADOS.cerrado.color, CheckCircle],
          ['Total de reportes', visibles.length, 'var(--primary)', Layers],
        ] as [string, number, string, any][]).map(([label, valor, color, Icono]) => (
          <div key={label} className="terra-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icono size={14} style={{ color }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{valor}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="terra-card p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por n.º, trabajador, cédula o texto del reporte"
              className={`${sel} w-full`} style={{ paddingLeft: 30 }} />
          </div>
          <select value={fEstado} onChange={e => setFEstado(e.target.value)} className={sel}>
            <option value="">Todos los estados</option>
            {ESTADOS_GESTION.map(e => <option key={e} value={e}>{ESTADOS[e].label}</option>)}
          </select>
          <select value={fTipo} onChange={e => setFTipo(e.target.value)} className={sel}>
            <option value="">Todos los tipos</option>
            {TIPOS_REPORTE.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
          </select>
          <select value={fArea} onChange={e => setFArea(e.target.value)} className={sel}>
            <option value="">Todas las áreas</option>
            {opciones('area').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fCentro} onChange={e => setFCentro(e.target.value)} className={sel}>
            <option value="">Todas las fincas</option>
            {opciones('centro_trabajo').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fResp} onChange={e => setFResp(e.target.value)} className={sel}>
            <option value="">Todos los responsables</option>
            <option value="sin">Sin asignar</option>
            {responsables.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <input type="date" value={fDesde} onChange={e => setFDesde(e.target.value)} className={sel} title="Desde" />
          <input type="date" value={fHasta} onChange={e => setFHasta(e.target.value)} className={sel} title="Hasta" />
          {hayFiltro && (
            <button onClick={() => { setBusqueda(''); setFEstado(''); setFTipo(''); setFArea(''); setFCentro(''); setFResp(''); setFDesde(''); setFHasta('') }}
              className="text-xs font-bold px-3 py-2 rounded-lg"
              style={{ color: 'var(--primary)', border: '1px solid var(--border)' }}>Limpiar</button>
          )}
        </div>
      </div>

      {/* ── Bandeja ── */}
      <div className="terra-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 1150 }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {['N.º', 'Fecha', 'Trabajador', 'Cédula', 'Área', 'Cargo', 'Finca / centro', 'Tipo', 'Descripción', 'Estado', 'Responsable', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map(r => {
                const est = ESTADOS[(r.estado ?? 'nuevo') as EstadoReporte]
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold whitespace-nowrap" style={{ color: 'var(--primary)' }}>{r.codigo}</td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
                      {r.fecha_reporte ? new Date(r.fecha_reporte + 'T12:00:00').toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: 'var(--text)' }}>{r.reporta_nombre ?? '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--text-dim)' }}>{r.reporta_cedula ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{r.area ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{r.cargo ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{r.centro_trabajo ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1" style={{ maxWidth: 180 }}>
                        {(r.tipos ?? []).map(t => (
                          <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: `${COLOR_TIPO[t] ?? '#64748B'}18`, color: COLOR_TIPO[t] ?? '#64748B' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-dim)', maxWidth: 260 }}>
                      <span className="line-clamp-2">{r.descripcion}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                        style={{ background: `${est.color}1F`, color: est.color }}>{est.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap"
                      style={{ color: r.responsable_nombre ? 'var(--text)' : 'var(--text-faint)' }}>
                      {r.responsable_nombre ?? 'Sin asignar'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => abrir(r)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap"
                          style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}>
                          <Eye size={11} /> Ver y gestionar
                        </button>
                        <button onClick={() => exportarTarjetaPDF(r, empresa)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                          <Download size={11} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!visibles.length && (
                <tr><td colSpan={12} className="px-3 py-12 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
                  {reportes.length ? 'Ningún reporte coincide con los filtros.' : 'Todavía no hay reportes de los trabajadores.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detalle y trámite ── */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setAbierto(null)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()} className="terra-card w-full max-w-4xl my-8 p-5">

            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-base font-black font-mono" style={{ color: 'var(--text)' }}>{abierto.codigo}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Tarjeta de reporte HSE · {abierto.reporta_nombre}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportarTarjetaPDF(abierto, empresa)}
                  className="terra-btn-outline flex items-center gap-1.5" style={{ padding: '7px 12px', fontSize: 12 }}>
                  <Download size={12} /> Descargar reporte
                </button>
                <button onClick={() => setAbierto(null)} style={{ color: 'var(--text-faint)' }}><X size={18} /></button>
              </div>
            </div>

            {/* Lo que envió el trabajador: solo lectura */}
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
              Lo que reportó el trabajador · no se modifica
            </p>
            <TarjetaHSE r={abierto} />

            {/* Lo que agrega SST */}
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.3)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Wrench size={15} style={{ color: '#06B6D4' }} />
                <p className="text-sm font-black" style={{ color: 'var(--text)' }}>Gestión de SST</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text)' }}>Estado</p>
                  <select className={inp} value={borrador.estado ?? 'nuevo'}
                    onChange={e => setBorrador(b => ({ ...b, estado: e.target.value }))}>
                    {ESTADOS_GESTION.map(e => <option key={e} value={e}>{ESTADOS[e].label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text)' }}>Responsable de la gestión</p>
                  <select className={inp} value={borrador.responsable_id ?? ''}
                    onChange={e => setBorrador(b => ({ ...b, responsable_id: e.target.value }))}>
                    <option value="">Sin asignar</option>
                    {responsables.map(r => <option key={r.id} value={r.id}>{r.nombre}{r.cargo ? ` · ${r.cargo}` : ''}</option>)}
                  </select>
                </div>
                {([
                  ['fecha_asignacion', 'Fecha de asignación'],
                  ['fecha_gestion', 'Fecha de gestión'],
                  ['fecha_cierre', 'Fecha de cierre'],
                  ['recibe_nombre', 'Nombre de quien recibe la solicitud'],
                  ['matriz_mejoras_num', 'N.º de seguimiento en Matriz de Mejoras'],
                ] as [string, string][]).map(([campo, label]) => (
                  <div key={campo}>
                    <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text)' }}>{label}</p>
                    <input type={campo.startsWith('fecha') ? 'date' : 'text'} className={inp}
                      value={borrador[campo] ?? ''}
                      onChange={e => setBorrador(b => ({ ...b, [campo]: e.target.value }))} />
                  </div>
                ))}
                {([
                  ['observaciones_sst', 'Observaciones de SST'],
                  ['accion_intervencion', 'Acción o intervención realizada'],
                  ['observaciones_cierre', 'Observaciones de cierre'],
                ] as [string, string][]).map(([campo, label]) => (
                  <div key={campo} className="sm:col-span-2">
                    <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text)' }}>{label}</p>
                    <textarea rows={3} className={`${inp} resize-none`} value={borrador[campo] ?? ''}
                      onChange={e => setBorrador(b => ({ ...b, [campo]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3">
                {errorGestion && <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{errorGestion}</p>}
                {guardado && (
                  <p className="text-xs font-bold flex items-center gap-1" style={{ color: '#10B981' }}>
                    <CheckCircle size={12} /> Guardado
                  </p>
                )}
                <div className="flex-1" />
                <button onClick={guardarGestion} disabled={guardando}
                  className="terra-btn flex items-center gap-1.5 font-bold" style={{ padding: '10px 18px', fontSize: 13 }}>
                  {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {guardando ? 'Guardando…' : 'Guardar gestión'}
                </button>
              </div>
            </div>

            {/* Trazabilidad */}
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
                <History size={12} /> Trazabilidad
              </p>
              {!bitacora.length && (
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Todavía no hay movimientos administrativos sobre este reporte.
                </p>
              )}
              <div className="space-y-1.5">
                {bitacora.map(ev => (
                  <div key={ev.id} className="p-2.5 rounded-lg text-xs"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text)' }}>
                      <strong>{ev.user_name ?? 'Alguien'}</strong> · {ev.accion}
                      <span style={{ color: 'var(--text-faint)' }}> · {new Date(ev.created_at).toLocaleString('es-CO')}</span>
                    </p>
                    {!!ev.detalle?.cambios?.length && (
                      <ul className="mt-1 space-y-0.5">
                        {ev.detalle.cambios.map((c: any, i: number) => (
                          <li key={i} style={{ color: 'var(--text-dim)' }}>
                            {c.campo}: <span style={{ color: 'var(--text-faint)' }}>{String(c.antes ?? '—')}</span> → <strong style={{ color: 'var(--text)' }}>{String(c.ahora ?? '—')}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
