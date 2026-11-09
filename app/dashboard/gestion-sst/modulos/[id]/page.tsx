'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutList, Loader2, ArrowLeft, HelpCircle, Users, Settings, Lock, Unlock,
  Trash2, AlertCircle, Download, Search, Send, FileText, BarChart2,
  CheckCircle, Clock, X,
} from 'lucide-react'
import { tienePermiso } from '@/lib/permisos'
import EditorPreguntas from '@/components/modulos/EditorPreguntas'
import {
  ESTADO_MODULO, textoCompleto, NOMBRE_TIPO, type Modulo, type Pregunta,
} from '@/lib/modulos'
import { tabular, type FilaModulo } from '@/lib/modulos-tabulacion'
import { exportarRespuestaPDF } from './export-pdf'

type FilaResp = FilaModulo

const inp = 'w-full text-sm rounded-lg px-3 py-2 outline-none'
const estiloInp: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
}

export default function ModuloPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const usuario = session?.user as { role?: string; permissions?: string[] | null } | undefined
  const puedeGestionar = !!usuario?.role && tienePermiso(usuario.role, usuario.permissions, 'sst.modulos.gestionar')

  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [filas, setFilas] = useState<FilaResp[]>([])
  const [pestana, setPestana] = useState<'resumen' | 'preguntas' | 'respuestas' | 'ajustes'>('resumen')
  const [empresa, setEmpresa] = useState('Organización')
  const [fArea, setFArea] = useState('')
  const [fCargo, setFCargo] = useState('')
  const [fCentro, setFCentro] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [porBorrar, setPorBorrar] = useState<FilaResp[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [busca, setBusca] = useState('')
  const [verDe, setVerDe] = useState<FilaResp | null>(null)

  const cargar = async () => {
    const [mRes, rRes] = await Promise.all([
      fetch(`/api/modulos/${params.id}`),
      fetch(`/api/modulos/${params.id}/respuestas`),
    ])
    if (!mRes.ok) {
      setError((await mRes.json().catch(() => ({}))).error ?? 'No se encontró el módulo')
      setCargando(false); return
    }
    const d = await mRes.json()
    setModulo(d.modulo)
    setPreguntas(d.preguntas ?? [])
    if (rRes.ok) setFilas((await rRes.json()).filas ?? [])
    setCargando(false)
  }

  useEffect(() => { cargar() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params.id])

  useEffect(() => {
    fetch('/api/company-info').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setEmpresa(d.name) }).catch(() => {})
  }, [])

  const respondieron = filas.filter(f => f.estado === 'Respondió')

  const opciones = (campo: keyof FilaResp) =>
    [...new Set(filas.map(f => (f[campo] as string | null)?.trim()).filter(Boolean) as string[])].sort()

  // Todo lo de abajo —indicadores, resumen y Excel— se calcula sobre lo
  // filtrado: así se puede mirar un área o una finca por separado.
  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return filas.filter(f => {
      if (q && !`${f.nombre} ${f.cedula}`.toLowerCase().includes(q)) return false
      if (fArea && (f.area?.trim() || 'Sin asignar') !== fArea) return false
      if (fCargo && (f.cargo?.trim() || 'Sin asignar') !== fCargo) return false
      if (fCentro && (f.centro_trabajo?.trim() || 'Sin asignar') !== fCentro) return false
      if (fEstado && f.estado !== fEstado) return false
      return true
    })
  }, [filas, busca, fArea, fCargo, fCentro, fEstado])

  const t = useMemo(() => tabular(visibles, preguntas), [visibles, preguntas])
  const hayFiltro = !!(busca || fArea || fCargo || fCentro || fEstado)

  const borrarRespuestas = async (objetivo: FilaResp[]) => {
    setTrabajando(true); setError(null)
    try {
      const r = await fetch(`/api/modulos/${params.id}/respuestas`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: objetivo.map(f => f.user_id) }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No fue posible eliminar'); return }
      const borrados = new Set(objetivo.map(f => f.user_id))
      setFilas(fs => fs.map(f => borrados.has(f.user_id)
        ? { ...f, estado: 'Pendiente', enviado_at: null, respuestas: null }
        : f))
      setPorBorrar(null); setVerDe(null)
    } finally { setTrabajando(false) }
  }

  const cambiarEstado = async (estado: 'borrador' | 'abierto' | 'cerrado', conMotivo?: string) => {
    setTrabajando(true); setError(null)
    try {
      const r = await fetch(`/api/modulos/${params.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, motivo: conMotivo }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No fue posible cambiar el estado'); return }
      setModulo(d)
      setCerrando(false); setMotivo('')
    } finally { setTrabajando(false) }
  }

  const guardarAjustes = async (cambios: Partial<Modulo>) => {
    setTrabajando(true); setError(null)
    try {
      const r = await fetch(`/api/modulos/${params.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No fue posible guardar'); return }
      setModulo(d)
    } finally { setTrabajando(false) }
  }

  const borrar = async () => {
    setTrabajando(true); setError(null)
    try {
      const r = await fetch(`/api/modulos/${params.id}`, { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No fue posible borrar'); return }
      router.push('/dashboard/gestion-sst/modulos')
    } finally { setTrabajando(false) }
  }

  const exportar = async () => {
    const _mod = await import('xlsx')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const XLSX = (_mod as any).default ?? _mod
    const libro = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(
      visibles.map(f => {
        const fila: Record<string, any> = {
          'TRABAJADOR': f.nombre, 'CÉDULA': f.cedula,
          'CARGO': f.cargo ?? '', 'ÁREA': f.area ?? '', 'FINCA / CENTRO': f.centro_trabajo ?? '',
          'ESTADO': f.estado,
          'RESPONDIÓ EL': f.enviado_at ? new Date(f.enviado_at).toLocaleDateString('es-CO') : '',
        }
        for (const p of preguntas) {
          fila[p.titulo.slice(0, 80).toUpperCase()] = f.respuestas ? textoCompleto(p, f.respuestas) : ''
        }
        return fila
      }),
    ), 'Respuestas')

    // La tabulación ya calculada, para no rehacerla a mano en el Excel.
    const conteos: Record<string, any>[] = []
    for (const r of t.preguntas) {
      for (const c of r.conteos) {
        conteos.push({
          'PREGUNTA': r.pregunta.titulo,
          'TIPO': NOMBRE_TIPO[r.pregunta.tipo],
          'OPCIÓN': c.etiqueta,
          'TRABAJADORES': c.n,
          '% DE LOS QUE RESPONDIERON': c.pct,
        })
      }
      if (r.promedio !== null) {
        conteos.push({
          'PREGUNTA': r.pregunta.titulo, 'TIPO': NOMBRE_TIPO[r.pregunta.tipo],
          'OPCIÓN': 'PROMEDIO', 'TRABAJADORES': r.promedio, '% DE LOS QUE RESPONDIERON': '',
        })
      }
    }
    if (conteos.length) {
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(conteos), 'Tabulación')
    }

    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet([
      ...t.porArea.map(c => ({ 'CORTE': 'ÁREA', 'VALOR': c.etiqueta, 'RESPONDIERON': c.n, '%': c.pct })),
      ...t.porCentro.map(c => ({ 'CORTE': 'FINCA / CENTRO', 'VALOR': c.etiqueta, 'RESPONDIERON': c.n, '%': c.pct })),
      ...t.porCargo.map(c => ({ 'CORTE': 'CARGO', 'VALOR': c.etiqueta, 'RESPONDIERON': c.n, '%': c.pct })),
    ]), 'Participación')

    XLSX.writeFile(libro, `${modulo?.nombre ?? 'MÓDULO'} ${modulo?.periodo ?? ''}.xlsx`)
  }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando…</p>
    </div>
  )

  if (!modulo) return (
    <div className="max-w-xl mx-auto p-4">
      <div className="terra-card p-8 text-center">
        <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{error ?? 'Módulo no encontrado'}</p>
      </div>
    </div>
  )

  const e = ESTADO_MODULO[modulo.estado]

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">

      <button onClick={() => router.push('/dashboard/gestion-sst/modulos')}
        className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={13} /> Todos los módulos
      </button>

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: modulo.color + '1F', color: modulo.color, border: `1px solid ${modulo.color}40` }}>
            <LayoutList size={21} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {modulo.nombre}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: e.color + '20', color: e.color }}>{e.nombre}</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Periodo {modulo.periodo} · {preguntas.length} preguntas · {respondieron.length} de {filas.length} respondieron
            </p>
          </div>
        </div>

        {puedeGestionar && (
          <div className="flex items-center gap-2">
            {modulo.estado === 'abierto' ? (
              <button onClick={() => setCerrando(true)}
                className="flex items-center gap-1.5 rounded-lg font-bold"
                style={{ padding: '8px 14px', fontSize: 12, border: '1px solid rgba(245,158,11,0.35)', color: '#F59E0B' }}>
                <Lock size={13} /> Cerrar
              </button>
            ) : (
              <button onClick={() => cambiarEstado('abierto')} disabled={trabajando}
                className="flex items-center gap-1.5 rounded-lg font-bold"
                style={{ padding: '8px 14px', fontSize: 12, border: '1px solid rgba(16,185,129,0.35)', color: '#10B981' }}>
                {trabajando ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                {modulo.estado === 'cerrado' ? 'Reabrir' : 'Abrir a los trabajadores'}
              </button>
            )}
          </div>
        )}
      </div>

      {modulo.estado === 'cerrado' && (
        <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <Lock size={15} style={{ color: '#EF4444' }} className="mt-0.5 flex-shrink-0" />
          <div className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            <p className="font-bold" style={{ color: '#EF4444' }}>Este módulo está cerrado</p>
            <p className="mt-0.5">
              Ya no recibe respuestas. Lo contestado se conserva.
              {modulo.estado_cambiado_por_nombre && ` Cerrado por ${modulo.estado_cambiado_por_nombre}`}
              {modulo.estado_cambiado_at && ` el ${new Date(modulo.estado_cambiado_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              {modulo.motivo_cierre && ` · ${modulo.motivo_cierre}`}
            </p>
          </div>
        </div>
      )}

      {modulo.estado === 'borrador' && (
        <div className="mb-4 p-3 rounded-xl text-xs leading-relaxed"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          Todavía es un borrador: <b style={{ color: 'var(--text)' }}>ningún trabajador lo ve</b>. Escriba las
          preguntas y ábralo cuando esté listo.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* ── Indicadores ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Les toca', valor: t.total, color: 'var(--primary)', icono: Users },
          { label: 'Respondieron', valor: t.respondieron, color: '#10B981', icono: CheckCircle },
          { label: 'Pendientes', valor: t.pendientes, color: '#F59E0B', icono: Clock },
          { label: '% de participación', valor: `${t.pct}%`, color: '#8B5CF6', icono: BarChart2 },
        ].map(k => (
          <div key={k.label} className="terra-card p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <k.icono size={13} style={{ color: k.color }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k.label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.valor}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="terra-card p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
            <input value={busca} onChange={ev => setBusca(ev.target.value)}
              placeholder="Buscar por nombre o cédula" className={inp} style={{ ...estiloInp, paddingLeft: 30 }} />
          </div>
          <select value={fArea} onChange={ev => setFArea(ev.target.value)} className={inp} style={{ ...estiloInp, width: 'auto' }}>
            <option value="">Todas las áreas</option>
            {opciones('area').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fCargo} onChange={ev => setFCargo(ev.target.value)} className={inp} style={{ ...estiloInp, width: 'auto' }}>
            <option value="">Todos los cargos</option>
            {opciones('cargo').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fCentro} onChange={ev => setFCentro(ev.target.value)} className={inp} style={{ ...estiloInp, width: 'auto' }}>
            <option value="">Todas las fincas</option>
            {opciones('centro_trabajo').map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={fEstado} onChange={ev => setFEstado(ev.target.value)} className={inp} style={{ ...estiloInp, width: 'auto' }}>
            <option value="">Todos los estados</option>
            {['Respondió', 'Empezada', 'Pendiente'].map(o => <option key={o}>{o}</option>)}
          </select>
          <button onClick={exportar} className="terra-btn-outline flex items-center gap-1.5"
            style={{ padding: '8px 14px', fontSize: 12 }}>
            <Download size={13} /> Excel
          </button>
          {puedeGestionar && !!visibles.filter(f => f.respuestas).length && (
            <button onClick={() => setPorBorrar(visibles.filter(f => f.respuestas))}
              className="flex items-center gap-1.5 rounded-lg font-bold"
              style={{ padding: '8px 14px', fontSize: 12, border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444' }}>
              <Trash2 size={13} /> Eliminar {visibles.filter(f => f.respuestas).length}
            </button>
          )}
          {hayFiltro && (
            <button onClick={() => { setBusca(''); setFArea(''); setFCargo(''); setFCentro(''); setFEstado('') }}
              className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
              Quitar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Pestañas ── */}
      <div className="flex gap-1 mb-4 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {([['resumen', 'Resumen', BarChart2], ['respuestas', 'Trabajadores', Users], ['preguntas', 'Preguntas', HelpCircle], ['ajustes', 'Ajustes', Settings]] as const)
          .map(([id, nombre, Icono]) => (
            <button key={id} onClick={() => setPestana(id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold flex-shrink-0"
              style={{
                color: pestana === id ? 'var(--primary)' : 'var(--text-dim)',
                borderBottom: `2px solid ${pestana === id ? 'var(--primary)' : 'transparent'}`,
              }}>
              <Icono size={13} /> {nombre}
            </button>
          ))}
      </div>

      {pestana === 'resumen' ? (
        <Resumen t={t} hayFiltro={hayFiltro} />
      ) : pestana === 'preguntas' ? (
        puedeGestionar ? (
          <EditorPreguntas
            moduloId={params.id}
            iniciales={preguntas}
            bloqueado={respondieron.length > 0}
            onGuardado={setPreguntas}
            nombre={modulo.nombre}
            descripcion={modulo.descripcion}
            color={modulo.color}
          />
        ) : (
          <div className="space-y-2">
            {preguntas.map((p, i) => (
              <div key={p.id} className="terra-card p-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{i + 1}. {p.titulo}</p>
                {p.ayuda && <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{p.ayuda}</p>}
              </div>
            ))}
          </div>
        )
      ) : pestana === 'respuestas' ? (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    {['Trabajador', 'Cargo', 'Área / Finca', 'Estado'].map(h => (
                      <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--text-faint)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {visibles.map(f => (
                    <tr key={f.user_id}
                      onClick={() => f.respuestas && setVerDe(f)}
                      className={f.respuestas ? 'cursor-pointer hover:bg-[var(--bg-card)]' : ''}>
                      <td className="px-3 py-2">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{f.nombre}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{f.cedula}</p>
                      </td>
                      <td className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-dim)' }}>{f.cargo || '—'}</td>
                      <td className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                        {[f.area, f.centro_trabajo].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={f.estado === 'Respondió'
                            ? { background: 'rgba(16,185,129,0.14)', color: '#10B981' }
                            : f.estado === 'Empezada'
                              ? { background: 'rgba(245,158,11,0.14)', color: '#F59E0B' }
                              : { background: 'var(--bg-card)', color: 'var(--text-faint)' }}>
                          {f.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!visibles.length && (
                    <tr><td colSpan={4} className="px-3 py-10 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
                      {filas.length ? 'Nadie coincide con esa búsqueda.' : 'Todavía no le toca a nadie, revise a quién va dirigido en Ajustes.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <Ajustes modulo={modulo} puedeGestionar={puedeGestionar} trabajando={trabajando}
          onGuardar={guardarAjustes} onBorrar={borrar} respondieron={respondieron.length} />
      )}

      {/* ── Lo que respondió una persona ── */}
      {verDe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setVerDe(null)}>
          <div className="terra-card p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={ev => ev.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{verDe.nombre}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  {[verDe.cargo, verDe.area, verDe.centro_trabajo].filter(Boolean).join(' · ')}
                  {verDe.enviado_at && ` · ${new Date(verDe.enviado_at).toLocaleDateString('es-CO')}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => exportarRespuestaPDF(modulo, preguntas, verDe, empresa)}
                  className="terra-btn-outline flex items-center gap-1.5"
                  style={{ padding: '6px 12px', fontSize: 11 }}>
                  <FileText size={12} /> PDF
                </button>
                {puedeGestionar && (
                  <button onClick={() => setPorBorrar([verDe])} aria-label="Eliminar esta respuesta"
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--red-dim)', color: '#FCA5A5' }}>
                    <Trash2 size={13} />
                  </button>
                )}
                <button onClick={() => setVerDe(null)} aria-label="Cerrar"
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {preguntas.map((p, i) => (
                <div key={p.id}>
                  <p className="text-[11px] font-bold" style={{ color: 'var(--text-dim)' }}>{i + 1}. {p.titulo}</p>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                    {textoCompleto(p, verDe.respuestas ?? {}) || <span style={{ color: 'var(--text-faint)' }}>Sin responder</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar el borrado de respuestas ── */}
      {porBorrar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setPorBorrar(null)}>
          <div className="terra-card p-5 w-full max-w-md" onClick={ev => ev.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle size={20} style={{ color: '#EF4444' }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {porBorrar.length === 1
                    ? `Eliminar la respuesta de ${porBorrar[0].nombre}`
                    : `Eliminar ${porBorrar.length} respuestas`}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Se borra lo que {porBorrar.length === 1 ? 'contestó' : 'contestaron'} y {porBorrar.length === 1 ? 'vuelve' : 'vuelven'} a
                  quedar como pendiente. <b style={{ color: 'var(--text)' }}>No tiene vuelta atrás.</b>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPorBorrar(null)} className="terra-btn-outline"
                style={{ padding: '8px 16px', fontSize: 12 }}>Cancelar</button>
              <button onClick={() => borrarRespuestas(porBorrar)} disabled={trabajando}
                className="flex items-center gap-1.5 rounded-lg font-bold text-white"
                style={{ padding: '8px 16px', fontSize: 12, background: '#EF4444' }}>
                {trabajando ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar el cierre ── */}
      {cerrando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setCerrando(false)}>
          <div className="terra-card p-5 w-full max-w-md" onClick={ev => ev.stopPropagation()}>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Cerrar «{modulo.nombre}»</p>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              {filas.length - respondieron.length > 0
                ? `Quedan ${filas.length - respondieron.length} trabajadores sin responder y ya no van a poder hacerlo.`
                : 'Todos los trabajadores ya respondieron.'}
              {' '}Nada se borra, y puede reabrirlo cuando quiera.
            </p>
            <input value={motivo} onChange={ev => setMotivo(ev.target.value)}
              placeholder="Motivo (opcional)" className={`${inp} mb-4`} style={estiloInp} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setCerrando(false)} className="terra-btn-outline"
                style={{ padding: '8px 16px', fontSize: 12 }}>Cancelar</button>
              <button onClick={() => cambiarEstado('cerrado', motivo)} disabled={trabajando}
                className="flex items-center gap-1.5 rounded-lg font-bold text-white"
                style={{ padding: '8px 16px', fontSize: 12, background: '#EF4444' }}>
                {trabajando ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Resumen ──────────────────────────────────────────────────────────

function Barras({ conteos, color }: { conteos: { etiqueta: string; n: number; pct: number }[]; color: string }) {
  const tope = Math.max(1, ...conteos.map(c => c.n))
  return (
    <div className="space-y-1.5">
      {conteos.map(c => (
        <div key={c.etiqueta} className="flex items-center gap-2">
          <span className="text-[11px] flex-1 min-w-0 truncate" style={{ color: 'var(--text-dim)' }}>{c.etiqueta}</span>
          <div className="h-2 rounded-full overflow-hidden" style={{ width: 110, background: 'var(--bg-card)' }}>
            <div className="h-full rounded-full" style={{ width: `${(c.n / tope) * 100}%`, background: color }} />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-right" style={{ color: 'var(--text)', width: 64 }}>
            {c.n} · {c.pct}%
          </span>
        </div>
      ))}
    </div>
  )
}

function Resumen({ t, hayFiltro }: { t: ReturnType<typeof tabular>; hayFiltro: boolean }) {
  if (!t.respondieron) return (
    <div className="terra-card p-10 text-center">
      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Todavía no hay respuestas</p>
      <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
        {hayFiltro
          ? 'Nadie de los que filtró ha respondido. Pruebe quitando los filtros.'
          : 'Cuando los trabajadores empiecen a responder, aquí sale el consolidado.'}
      </p>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        {[
          { titulo: 'Participación por área', datos: t.porArea },
          { titulo: 'Por finca / centro', datos: t.porCentro },
          { titulo: 'Por cargo', datos: t.porCargo },
        ].map(b => (
          <div key={b.titulo} className="terra-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-faint)' }}>
              {b.titulo}
            </p>
            {b.datos.length
              ? <Barras conteos={b.datos.slice(0, 8)} color="#8B5CF6" />
              : <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Sin datos.</p>}
          </div>
        ))}
      </div>

      {t.preguntas.map((r, i) => (
        <div key={r.pregunta.id} className="terra-card p-4">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {i + 1}. {r.pregunta.titulo}
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--bg-card)', color: 'var(--text-faint)' }}>
              {NOMBRE_TIPO[r.pregunta.tipo]}
            </span>
          </div>

          {r.promedio !== null && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
              Promedio: <b style={{ color: '#8B5CF6' }}>{r.promedio}</b> de 5
            </p>
          )}

          {r.conteos.length > 0 && <Barras conteos={r.conteos} color="#10B981" />}

          {/* Con barras arriba, esto son los porqués o los "Otro": lo que
              explica el número y sin lo cual la cuenta no dice nada. */}
          {r.textos.length > 0 && (
            <div className={r.conteos.length ? 'mt-3' : ''}>
              {r.conteos.length > 0 && (
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-faint)' }}>
                  {r.pregunta.tipo === 'si_no' ? 'Lo que explicaron' : 'Los que dijeron Otro'}
                </p>
              )}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {r.textos.map((x, k) => (
                  <div key={k} className="rounded-lg px-2.5 py-2"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{x.texto}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{x.nombre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!r.conteos.length && !r.textos.length && (
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Nadie la respondió.</p>
          )}

          <p className="text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>
            {r.respondieron} de {t.respondieron} la respondieron
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Ajustes ──────────────────────────────────────────────────────────

function Ajustes({
  modulo, puedeGestionar, trabajando, onGuardar, onBorrar, respondieron,
}: {
  modulo: Modulo
  puedeGestionar: boolean
  trabajando: boolean
  onGuardar: (c: Partial<Modulo>) => void
  onBorrar: () => void
  respondieron: number
}) {
  const [form, setForm] = useState({
    nombre: modulo.nombre,
    descripcion: modulo.descripcion ?? '',
    periodo: modulo.periodo,
    dirigido_a: modulo.dirigido_a,
    dirigido_valor: modulo.dirigido_valor ?? '',
  })
  const [confirmaBorrado, setConfirmaBorrado] = useState(false)

  if (!puedeGestionar) return (
    <p className="text-xs py-6" style={{ color: 'var(--text-faint)' }}>
      No tiene permiso para cambiar los ajustes de este módulo.
    </p>
  )

  return (
    <div className="space-y-3 max-w-lg">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Nombre</label>
        <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          className={inp} style={estiloInp} />
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>De qué se trata</label>
        <textarea rows={3} value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          className={`${inp} resize-none`} style={estiloInp} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Periodo</label>
          <select value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: Number(e.target.value) }))}
            className={inp} style={estiloInp}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
              .map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>A quién le aparece</label>
          <select value={form.dirigido_a}
            onChange={e => setForm(f => ({ ...f, dirigido_a: e.target.value as Modulo['dirigido_a'] }))}
            className={inp} style={estiloInp}>
            <option value="todos">Todos los trabajadores</option>
            <option value="area">Solo un área</option>
            <option value="cargo">Solo un cargo</option>
            <option value="finca">Solo una finca o centro</option>
          </select>
        </div>
      </div>

      {form.dirigido_a !== 'todos' && (
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
            Cuál {form.dirigido_a === 'area' ? 'área' : form.dirigido_a === 'cargo' ? 'cargo' : 'finca'}
          </label>
          <input value={form.dirigido_valor}
            onChange={e => setForm(f => ({ ...f, dirigido_valor: e.target.value.toUpperCase() }))}
            placeholder="Tal como está escrito en la ficha del trabajador"
            className={inp} style={estiloInp} />
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>
            Si lo deja vacío le aparece a todos.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button onClick={() => onGuardar(form)} disabled={trabajando}
          className="terra-btn flex items-center gap-1.5" style={{ padding: '9px 18px', fontSize: 12 }}>
          {trabajando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Guardar ajustes
        </button>
      </div>

      <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
        {respondieron > 0 ? (
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            Este módulo ya tiene {respondieron} {respondieron === 1 ? 'respuesta' : 'respuestas'} y por eso no se
            puede borrar. Ciérrelo si ya no lo necesita: así no se pierde lo que la gente contó.
          </p>
        ) : !confirmaBorrado ? (
          <button onClick={() => setConfirmaBorrado(true)}
            className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#FCA5A5' }}>
            <Trash2 size={13} /> Borrar este módulo
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>¿Seguro? No tiene vuelta atrás.</span>
            <button onClick={() => setConfirmaBorrado(false)} className="terra-btn-outline"
              style={{ padding: '6px 12px', fontSize: 11 }}>No</button>
            <button onClick={onBorrar} disabled={trabajando}
              className="rounded-lg font-bold text-white flex items-center gap-1.5"
              style={{ padding: '6px 12px', fontSize: 11, background: '#EF4444' }}>
              {trabajando ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Sí, borrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
