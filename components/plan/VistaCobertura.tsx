'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Download, Loader2, GraduationCap, Users, ChevronRight } from 'lucide-react'
import { MESES, enPalabras } from '@/lib/plan-fechas'
import { ESTADO_COLOR, ESTADO_NOMBRE, type PlanItem } from './tipos'

interface ItemCob {
  id: string; month: number; scheduled_date: string | null; estado: string
  titulo: string; categoria: string; duracion: string
}
interface FilaCob {
  plan_item_id: string; user_id: string
  nombre: string; cedula: string; cargo: string; area: string; finca: string
  asistencia: string | null; status: string
}

const sel = 'text-xs rounded-lg px-2.5 py-1.5 outline-none'
const estiloSel: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
}

/** Verde si está completo, ámbar si va a medias, rojo si no hay nadie. */
function color(asistieron: number, asignados: number): string {
  if (!asignados) return '#EF4444'
  if (asistieron >= asignados) return '#10B981'
  return '#F59E0B'
}

function Barra({ hechas, total }: { hechas: number; total: number }) {
  const c = color(hechas, total)
  const pct = total ? Math.round((hechas / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 rounded-full flex-1 overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color: c, minWidth: 44 }}>
        {hechas}/{total}
      </span>
    </div>
  )
}

export default function VistaCobertura({
  planId, anioPlan, items, onAbrirItem,
}: {
  planId: string
  anioPlan: number
  /** Los ítems que ya tiene el calendario, para abrir el panel al tocar una fila. */
  items: PlanItem[]
  onAbrirItem: (item: PlanItem) => void
}) {
  const [datos, setDatos] = useState<{ items: ItemCob[]; filas: FilaCob[] } | null>(null)
  const [modo, setModo] = useState<'capacitacion' | 'persona'>('capacitacion')
  const [busca, setBusca] = useState('')
  const [fMes, setFMes] = useState('')
  const [fCategoria, setFCategoria] = useState('')
  const [fArea, setFArea] = useState('')
  const [fCargo, setFCargo] = useState('')
  const [fFinca, setFFinca] = useState('')

  useEffect(() => {
    let vigente = true
    setDatos(null)
    fetch(`/api/plans/${planId}/cobertura/detalle`)
      .then(r => r.ok ? r.json() : { items: [], filas: [] })
      .then(d => { if (vigente) setDatos(d) })
      .catch(() => { if (vigente) setDatos({ items: [], filas: [] }) })
    return () => { vigente = false }
  }, [planId])

  const opciones = useMemo(() => {
    const unicos = (lista: string[]) => [...new Set(lista.map(s => s?.trim()).filter(Boolean))].sort()
    return {
      categorias: unicos((datos?.items ?? []).map(i => i.categoria)),
      areas: unicos((datos?.filas ?? []).map(f => f.area)),
      cargos: unicos((datos?.filas ?? []).map(f => f.cargo)),
      fincas: unicos((datos?.filas ?? []).map(f => f.finca)),
    }
  }, [datos])

  // Los filtros de persona recortan las filas; los de capacitación, los ítems.
  const itemsVisibles = useMemo(() => (datos?.items ?? []).filter(i => {
    if (fMes && i.month !== Number(fMes)) return false
    if (fCategoria && (i.categoria?.trim() || 'Sin categoría') !== fCategoria) return false
    if (modo === 'capacitacion' && busca && !i.titulo.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  }), [datos, fMes, fCategoria, busca, modo])

  const filasVisibles = useMemo(() => {
    const permitidos = new Set(itemsVisibles.map(i => i.id))
    return (datos?.filas ?? []).filter(f => {
      if (!permitidos.has(f.plan_item_id)) return false
      if (fArea && (f.area?.trim() || 'Sin asignar') !== fArea) return false
      if (fCargo && (f.cargo?.trim() || 'Sin asignar') !== fCargo) return false
      if (fFinca && (f.finca?.trim() || 'Sin asignar') !== fFinca) return false
      if (modo === 'persona' && busca
        && !`${f.nombre} ${f.cedula}`.toLowerCase().includes(busca.toLowerCase())) return false
      return true
    })
  }, [datos, itemsVisibles, fArea, fCargo, fFinca, busca, modo])

  // ── Por capacitación ──
  const porItem = useMemo(() => {
    const cuenta = new Map<string, { asignados: number; asistieron: number }>()
    for (const i of itemsVisibles) cuenta.set(i.id, { asignados: 0, asistieron: 0 })
    for (const f of filasVisibles) {
      const c = cuenta.get(f.plan_item_id)!
      c.asignados++
      if (f.asistencia === 'asistio') c.asistieron++
    }
    return itemsVisibles.map(i => ({ item: i, ...cuenta.get(i.id)! }))
  }, [itemsVisibles, filasVisibles])

  // ── Por persona ──
  const porPersona = useMemo(() => {
    const m = new Map<string, { nombre: string; cedula: string; cargo: string; area: string; finca: string; asignadas: number; asistidas: number }>()
    for (const f of filasVisibles) {
      if (!m.has(f.user_id)) {
        m.set(f.user_id, {
          nombre: f.nombre, cedula: f.cedula, cargo: f.cargo, area: f.area, finca: f.finca,
          asignadas: 0, asistidas: 0,
        })
      }
      const p = m.get(f.user_id)!
      p.asignadas++
      if (f.asistencia === 'asistio') p.asistidas++
    }
    return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [filasVisibles])

  const totales = useMemo(() => ({
    asignados: filasVisibles.length,
    asistieron: filasVisibles.filter(f => f.asistencia === 'asistio').length,
    sinNadie: porItem.filter(p => p.asignados === 0).length,
  }), [filasVisibles, porItem])

  const exportar = async () => {
    const _mod = await import('xlsx')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const XLSX = (_mod as any).default ?? _mod
    const libro = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(
      porItem.map(p => ({
        'CAPACITACIÓN': p.item.titulo,
        'CATEGORÍA': p.item.categoria || '',
        'MES': MESES[p.item.month - 1],
        'FECHA': p.item.scheduled_date ? enPalabras(p.item.scheduled_date) : 'Sin fecha',
        'ESTADO': ESTADO_NOMBRE[p.item.estado] ?? p.item.estado,
        'ASIGNADOS': p.asignados,
        'ASISTIERON': p.asistieron,
        '% COBERTURA': p.asignados ? Math.round((p.asistieron / p.asignados) * 100) : 0,
      })),
    ), 'Por capacitación')

    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(
      porPersona.map(p => ({
        'TRABAJADOR': p.nombre, 'CÉDULA': p.cedula, 'CARGO': p.cargo,
        'ÁREA': p.area, 'FINCA / CENTRO': p.finca,
        'ASIGNADAS': p.asignadas, 'ASISTIDAS': p.asistidas, 'PENDIENTES': p.asignadas - p.asistidas,
        '% COBERTURA': p.asignadas ? Math.round((p.asistidas / p.asignadas) * 100) : 0,
      })),
    ), 'Por persona')

    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(
      filasVisibles.map(f => {
        const i = (datos?.items ?? []).find(x => x.id === f.plan_item_id)
        return {
          'TRABAJADOR': f.nombre, 'CÉDULA': f.cedula, 'CARGO': f.cargo,
          'ÁREA': f.area, 'FINCA / CENTRO': f.finca,
          'CAPACITACIÓN': i?.titulo ?? '', 'MES': i ? MESES[i.month - 1] : '',
          'FECHA': i?.scheduled_date ? enPalabras(i.scheduled_date) : 'Sin fecha',
          'ASISTENCIA': f.asistencia === 'asistio' ? 'Asistió'
            : f.asistencia === 'no_asistio' ? 'No asistió'
              : f.asistencia === 'excusado' ? 'Excusado' : 'Sin marcar',
        }
      }),
    ), 'Detalle')

    XLSX.writeFile(libro, `COBERTURA PLAN SST ${anioPlan}.xlsx`)
  }

  if (!datos) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Calculando la cobertura…</p>
    </div>
  )

  return (
    <div className="p-3 sm:p-4 space-y-3">

      {/* ── Indicadores ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: 'Capacitaciones', valor: porItem.length, c: 'var(--primary)' },
          { label: 'Asignaciones', valor: totales.asignados, c: '#8B5CF6' },
          { label: 'Asistieron', valor: totales.asistieron, c: '#10B981' },
          { label: 'Sin nadie asignado', valor: totales.sinNadie, c: totales.sinNadie ? '#EF4444' : 'var(--text-dim)' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k.label}</p>
            <p className="text-xl font-black tabular-nums" style={{ color: k.c }}>{k.valor}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {([['capacitacion', 'Por capacitación', GraduationCap], ['persona', 'Por persona', Users]] as const).map(([k, n, Ico]) => (
            <button key={k} onClick={() => setModo(k)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold"
              style={{
                background: modo === k ? 'var(--primary)' : 'transparent',
                color: modo === k ? '#fff' : 'var(--text-dim)',
              }}>
              <Ico size={11} /> {n}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder={modo === 'persona' ? 'Buscar persona o cédula' : 'Buscar capacitación'}
            className={`${sel} w-full`} style={{ ...estiloSel, paddingLeft: 26 }} />
        </div>

        <select value={fMes} onChange={e => setFMes(e.target.value)} className={sel} style={estiloSel}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={fCategoria} onChange={e => setFCategoria(e.target.value)} className={sel} style={estiloSel}>
          <option value="">Todas las categorías</option>
          {opciones.categorias.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={fFinca} onChange={e => setFFinca(e.target.value)} className={sel} style={estiloSel}>
          <option value="">Todas las fincas</option>
          {opciones.fincas.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={fArea} onChange={e => setFArea(e.target.value)} className={sel} style={estiloSel}>
          <option value="">Todas las áreas</option>
          {opciones.areas.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={fCargo} onChange={e => setFCargo(e.target.value)} className={sel} style={estiloSel}>
          <option value="">Todos los cargos</option>
          {opciones.cargos.map(o => <option key={o}>{o}</option>)}
        </select>

        <button onClick={exportar} className="terra-btn-outline flex items-center gap-1.5"
          style={{ padding: '6px 12px', fontSize: 11 }}>
          <Download size={12} /> Excel
        </button>
      </div>

      {/* ── Tabla ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          {modo === 'capacitacion' ? (
            <table className="w-full text-left" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  {['Capacitación', 'Mes', 'Fecha', 'Estado', 'Cobertura'].map(h => (
                    <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {porItem.map(p => {
                  const item = items.find(i => i.id === p.item.id)
                  const c = ESTADO_COLOR[p.item.estado] ?? '#6B7280'
                  return (
                    <tr key={p.item.id}
                      onClick={() => item && onAbrirItem(item)}
                      className="cursor-pointer transition-colors hover:bg-[var(--bg-card)]">
                      <td className="px-3 py-2">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{p.item.titulo}</p>
                        {p.item.categoria && (
                          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{p.item.categoria}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-dim)' }}>{MESES[p.item.month - 1]}</td>
                      <td className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                        {p.item.scheduled_date ? enPalabras(p.item.scheduled_date) : 'Sin fecha'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: c + '20', color: c, border: `1px solid ${c}30` }}>
                          {ESTADO_NOMBRE[p.item.estado] ?? p.item.estado}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Barra hechas={p.asistieron} total={p.asignados} />
                          <ChevronRight size={12} style={{ color: 'var(--text-faint)' }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!porItem.length && (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
                    Nada coincide con esos filtros.
                  </td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  {['Trabajador', 'Cargo', 'Área / Finca', 'Pendientes', 'Cobertura'].map(h => (
                    <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {porPersona.map(p => (
                  <tr key={p.cedula + p.nombre}>
                    <td className="px-3 py-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{p.nombre}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{p.cedula}</p>
                    </td>
                    <td className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-dim)' }}>{p.cargo || '—'}</td>
                    <td className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                      {[p.area, p.finca].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-[11px] font-bold tabular-nums"
                      style={{ color: p.asignadas - p.asistidas ? '#F59E0B' : '#10B981' }}>
                      {p.asignadas - p.asistidas}
                    </td>
                    <td className="px-3 py-2"><Barra hechas={p.asistidas} total={p.asignadas} /></td>
                  </tr>
                ))}
                {!porPersona.length && (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
                    Nadie coincide con esos filtros.
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
