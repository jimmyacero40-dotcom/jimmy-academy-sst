'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutList, Loader2, ArrowLeft, HelpCircle, Users, Settings, Lock, Unlock,
  Trash2, AlertCircle, Download, Search, Send,
} from 'lucide-react'
import { tienePermiso } from '@/lib/permisos'
import EditorPreguntas from '@/components/modulos/EditorPreguntas'
import {
  ESTADO_MODULO, comoTexto, type Modulo, type Pregunta,
} from '@/lib/modulos'

interface FilaResp {
  user_id: string; nombre: string; cedula: string
  cargo: string | null; area: string | null; centro_trabajo: string | null
  estado: string; enviado_at: string | null
  respuestas: Record<string, any> | null
}

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
  const [pestana, setPestana] = useState<'preguntas' | 'respuestas' | 'ajustes'>('preguntas')
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

  const respondieron = filas.filter(f => f.estado === 'Respondió')
  const visibles = respondieron.length || filas.length
    ? filas.filter(f => !busca || `${f.nombre} ${f.cedula}`.toLowerCase().includes(busca.toLowerCase()))
    : []

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
      filas.map(f => {
        const fila: Record<string, any> = {
          'TRABAJADOR': f.nombre, 'CÉDULA': f.cedula,
          'CARGO': f.cargo ?? '', 'ÁREA': f.area ?? '', 'FINCA / CENTRO': f.centro_trabajo ?? '',
          'ESTADO': f.estado,
          'RESPONDIÓ EL': f.enviado_at ? new Date(f.enviado_at).toLocaleDateString('es-CO') : '',
        }
        for (const p of preguntas) {
          fila[p.titulo.slice(0, 80).toUpperCase()] = f.respuestas ? comoTexto(p, f.respuestas[p.id]) : ''
        }
        return fila
      }),
    ), 'Respuestas')

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

      {/* ── Pestañas ── */}
      <div className="flex gap-1 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {([['preguntas', 'Preguntas', HelpCircle], ['respuestas', 'Respuestas', Users], ['ajustes', 'Ajustes', Settings]] as const)
          .map(([id, nombre, Icono]) => (
            <button key={id} onClick={() => setPestana(id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold"
              style={{
                color: pestana === id ? 'var(--primary)' : 'var(--text-dim)',
                borderBottom: `2px solid ${pestana === id ? 'var(--primary)' : 'transparent'}`,
              }}>
              <Icono size={13} /> {nombre}
            </button>
          ))}
      </div>

      {pestana === 'preguntas' ? (
        puedeGestionar ? (
          <EditorPreguntas
            moduloId={params.id}
            iniciales={preguntas}
            bloqueado={respondieron.length > 0}
            onGuardado={setPreguntas}
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
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input value={busca} onChange={ev => setBusca(ev.target.value)}
                placeholder="Buscar por nombre o cédula" className={inp} style={{ ...estiloInp, paddingLeft: 28 }} />
            </div>
            <button onClick={exportar} className="terra-btn-outline flex items-center gap-1.5"
              style={{ padding: '8px 14px', fontSize: 12 }}>
              <Download size={13} /> Excel
            </button>
          </div>

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
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{verDe.nombre}</p>
            <p className="text-[11px] mb-4" style={{ color: 'var(--text-faint)' }}>
              {[verDe.cargo, verDe.area, verDe.centro_trabajo].filter(Boolean).join(' · ')}
              {verDe.enviado_at && ` · ${new Date(verDe.enviado_at).toLocaleDateString('es-CO')}`}
            </p>
            <div className="space-y-3">
              {preguntas.map((p, i) => (
                <div key={p.id}>
                  <p className="text-[11px] font-bold" style={{ color: 'var(--text-dim)' }}>{i + 1}. {p.titulo}</p>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                    {comoTexto(p, verDe.respuestas?.[p.id]) || <span style={{ color: 'var(--text-faint)' }}>Sin responder</span>}
                  </p>
                </div>
              ))}
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
