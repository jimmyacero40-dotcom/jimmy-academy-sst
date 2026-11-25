'use client'

/**
 * El catálogo de lo que se entrega.
 *
 * Antes era una casilla con el nombre y la unidad. Pero quien pide el EPP
 * necesita saber cuál es: la norma que cumple, la talla, el proveedor, cada
 * cuánto se repone y cómo se usa. Así el catálogo sirve para comprar y para
 * capacitar, y no solo para marcar una casilla.
 *
 * Es una lista a la izquierda y la ficha del ítem a la derecha, como una
 * carpeta: se escoge uno y se ve y se edita todo lo suyo.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  X, Plus, Loader2, Trash2, Archive, ArchiveRestore, Package,
  Search, Save, AlertCircle, Clock,
} from 'lucide-react'

export interface Item {
  id: string
  nombre: string
  descripcion: string | null
  referencia: string | null
  unidad: string
  periodicidad: 'diaria' | 'semanal' | 'mensual' | 'ninguna'
  activo: boolean
  categoria: string | null
  especificacion: string | null
  talla: string | null
  proveedor: string | null
  vida_util_dias: number | null
  instrucciones: string | null
  cantidad_sugerida: number | null
  creado_por_nombre: string | null
  created_at: string
  actualizado_por_nombre: string | null
  updated_at: string | null
  entregas: number
}

const PERIODOS: Record<string, string> = {
  diaria: 'Diaria — uno por jornada',
  semanal: 'Semanal',
  mensual: 'Mensual',
  ninguna: 'Sin periodicidad — cuando haga falta',
}

const CATEGORIAS = ['EPP', 'Dotación', 'Higiene y bienestar', 'Hidratación', 'Aseo', 'Otro']

const inp = 'px-3 py-2 rounded-lg text-sm outline-none w-full'
const estilo = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }

const cuando = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

/** El ítem vacío con el que arranca uno nuevo. */
const NUEVO = (): Partial<Item> => ({
  nombre: '', referencia: '', unidad: 'unidad', periodicidad: 'ninguna',
  categoria: 'EPP', especificacion: '', talla: '', proveedor: '',
  vida_util_dias: null, instrucciones: '', descripcion: '', cantidad_sugerida: 1,
})

export default function CatalogoItems({ items, onCerrar, onCambio }: {
  items: Item[]
  onCerrar: () => void
  onCambio: (items: Item[]) => void
}) {
  const [lista, setLista] = useState<Item[]>(items)
  const [verArchivados, setVerArchivados] = useState(false)
  const [busca, setBusca] = useState('')
  const [seleccion, setSeleccion] = useState<string | 'nuevo' | null>(items[0]?.id ?? 'nuevo')
  const [borrador, setBorrador] = useState<Partial<Item>>(items[0] ?? NUEVO())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Los archivados solo se piden cuando se quieren ver: el catálogo del día
  // a día es el de lo que está en uso.
  useEffect(() => {
    if (!verArchivados) return
    fetch('/api/entregas/tipos?todos=1')
      .then(r => (r.ok ? r.json() : []))
      .then((d: Item[]) => setLista(d))
      .catch(() => {})
  }, [verArchivados])

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return lista.filter(i => {
      if (!verArchivados && !i.activo) return false
      if (!q) return true
      return `${i.nombre} ${i.referencia ?? ''} ${i.categoria ?? ''}`.toLowerCase().includes(q)
    })
  }, [lista, busca, verArchivados])

  const esNuevo = seleccion === 'nuevo'
  const actual = esNuevo ? null : lista.find(i => i.id === seleccion) ?? null

  function escoger(id: string | 'nuevo') {
    setSeleccion(id)
    setError(null); setAviso(null)
    setBorrador(id === 'nuevo' ? NUEVO() : (lista.find(i => i.id === id) ?? NUEVO()))
  }

  const campo = (k: keyof Item, v: any) => setBorrador(b => ({ ...b, [k]: v }))

  /** Solo lo activos se ofrecen al registrar; es lo que ve la otra pantalla. */
  const propagar = (nuevos: Item[]) => {
    setLista(nuevos)
    onCambio(nuevos.filter(i => i.activo))
  }

  async function guardar() {
    if (!String(borrador.nombre ?? '').trim()) { setError('Escriba el nombre del ítem'); return }
    setGuardando(true); setError(null); setAviso(null)
    try {
      const r = await fetch('/api/entregas/tipos', {
        method: esNuevo ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(esNuevo ? borrador : { ...borrador, id: seleccion }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo guardar')
      const nuevos = esNuevo ? [...lista, d] : lista.map(i => (i.id === d.id ? d : i))
      propagar(nuevos)
      setSeleccion(d.id)
      setBorrador(d)
      setAviso('Guardado')
    } catch (e: any) {
      setError(e.message)
    }
    setGuardando(false)
  }

  async function archivar(i: Item) {
    const r = await fetch('/api/entregas/tipos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: i.id, activo: !i.activo }),
    })
    if (!r.ok) return
    const d = await r.json()
    propagar(lista.map(x => (x.id === d.id ? d : x)))
    if (seleccion === i.id) setBorrador(d)
  }

  async function borrar(i: Item) {
    if (!window.confirm(`¿Borrar «${i.nombre}» del catálogo?`)) return
    setError(null)
    const r = await fetch(`/api/entregas/tipos?id=${i.id}`, { method: 'DELETE' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setError(d.error || 'No se pudo borrar'); return }
    const nuevos = lista.filter(x => x.id !== i.id)
    propagar(nuevos)
    escoger(nuevos[0]?.id ?? 'nuevo')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(36,60,44,0.10)', border: '1px solid rgba(36,60,44,0.25)' }}>
            <Package size={16} style={{ color: '#243C2C' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-strong)' }}>Catálogo de ítems</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              La ficha de cada cosa que se entrega: qué es, qué norma cumple y cada cuánto se repone
            </p>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg" style={{ color: 'var(--text-faint)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex" style={{ minHeight: 420 }}>
          {/* ── La lista ── */}
          <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
            <div className="p-3 space-y-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-faint)' }} />
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ítem"
                  className={inp + ' pl-8'} style={estilo} />
              </div>
              <button onClick={() => escoger('nuevo')}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold"
                style={esNuevo
                  ? { background: '#243C2C', color: '#fff' }
                  : { border: '1px dashed var(--border-strong)', color: 'var(--text-dim)' }}>
                <Plus size={13} /> Ítem nuevo
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
              {visibles.length === 0 && (
                <p className="text-xs p-4 text-center" style={{ color: 'var(--text-faint)' }}>
                  {busca ? 'Nada coincide' : 'Todavía no hay ítems'}
                </p>
              )}
              {visibles.map(i => (
                <button key={i.id} onClick={() => escoger(i.id)}
                  className="w-full text-left px-3 py-2.5"
                  style={{
                    background: seleccion === i.id ? 'rgba(36,60,44,0.08)' : 'transparent',
                    opacity: i.activo ? 1 : 0.55,
                  }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{i.nombre}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                    {[i.categoria, i.referencia, !i.activo ? 'archivado' : null].filter(Boolean).join(' · ')}
                  </p>
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 px-3 py-2.5 text-[11px] cursor-pointer"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <input type="checkbox" checked={verArchivados} onChange={e => setVerArchivados(e.target.checked)} />
              Ver también los archivados
            </label>
          </div>

          {/* ── La ficha ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Rotulo>Nombre del ítem *</Rotulo>
                <input value={borrador.nombre ?? ''} onChange={e => campo('nombre', e.target.value)}
                  placeholder="Ej.: Respirador media cara con filtro P100"
                  className={inp} style={estilo} />
              </div>

              <div>
                <Rotulo>Categoría</Rotulo>
                <select value={borrador.categoria ?? 'EPP'} onChange={e => campo('categoria', e.target.value)}
                  className={inp} style={estilo}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Rotulo>Referencia · marca y modelo</Rotulo>
                <input value={borrador.referencia ?? ''} onChange={e => campo('referencia', e.target.value)}
                  placeholder="Ej.: 3M 6200 · lote 2411" className={inp} style={estilo} />
              </div>

              <div>
                <Rotulo>Norma o especificación</Rotulo>
                <input value={borrador.especificacion ?? ''} onChange={e => campo('especificacion', e.target.value)}
                  placeholder="Ej.: NIOSH P100 · ANSI Z87.1" className={inp} style={estilo} />
              </div>
              <div>
                <Rotulo>Talla</Rotulo>
                <input value={borrador.talla ?? ''} onChange={e => campo('talla', e.target.value)}
                  placeholder="Ej.: M · 38 · única" className={inp} style={estilo} />
              </div>

              <div>
                <Rotulo>Proveedor</Rotulo>
                <input value={borrador.proveedor ?? ''} onChange={e => campo('proveedor', e.target.value)}
                  placeholder="A quién se le compra" className={inp} style={estilo} />
              </div>
              <div>
                <Rotulo>Vida útil</Rotulo>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={borrador.vida_util_dias ?? ''}
                    onChange={e => campo('vida_util_dias', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="—" className={inp} style={{ ...estilo, width: 100 }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>días antes de reponerlo</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                Cómo se entrega
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Rotulo>Unidad</Rotulo>
                  <input value={borrador.unidad ?? ''} onChange={e => campo('unidad', e.target.value)}
                    placeholder="sobre, par, unidad" className={inp} style={estilo} />
                </div>
                <div>
                  <Rotulo>Cantidad por defecto</Rotulo>
                  <input type="number" min={1} step="any" value={borrador.cantidad_sugerida ?? 1}
                    onChange={e => campo('cantidad_sugerida', Number(e.target.value))}
                    className={inp} style={estilo} />
                </div>
                <div>
                  <Rotulo>Cada cuánto</Rotulo>
                  <select value={borrador.periodicidad ?? 'ninguna'}
                    onChange={e => campo('periodicidad', e.target.value)} className={inp} style={estilo}>
                    {Object.entries(PERIODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                «Cada cuánto» no obliga a nada: solo sirve para marcar «ya recibió» y no entregarle dos
                veces al mismo. Si un día no se aplicó, no hay que entregar.
              </p>
            </div>

            <div>
              <Rotulo>Para qué sirve</Rotulo>
              <textarea value={borrador.descripcion ?? ''} onChange={e => campo('descripcion', e.target.value)}
                rows={2} placeholder="Contra qué riesgo protege y en qué tarea se usa"
                className={inp} style={{ ...estilo, resize: 'vertical' }} />
            </div>

            <div>
              <Rotulo>Uso y cuidado</Rotulo>
              <textarea value={borrador.instrucciones ?? ''} onChange={e => campo('instrucciones', e.target.value)}
                rows={3} placeholder="Cómo se pone, cómo se guarda, cuándo se cambia"
                className={inp} style={{ ...estilo, resize: 'vertical' }} />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                Es lo que hay que explicarle al trabajador cuando se lo entrega.
              </p>
            </div>

            {/* ── Quién lo creó y quién lo tocó ── */}
            {actual && (
              <div className="rounded-xl p-3 text-[11px] leading-relaxed flex items-start gap-2"
                style={{ background: 'var(--bg)', color: 'var(--text-faint)' }}>
                <Clock size={12} className="flex-shrink-0 mt-0.5" />
                <span>
                  Creado por <strong style={{ color: 'var(--text-dim)' }}>{actual.creado_por_nombre ?? 'alguien'}</strong>
                  {' '}el {cuando(actual.created_at)}.
                  {actual.actualizado_por_nombre && (
                    <> Última modificación de <strong style={{ color: 'var(--text-dim)' }}>{actual.actualizado_por_nombre}</strong>
                      {' '}el {cuando(actual.updated_at)}.</>
                  )}
                  {' '}
                  {actual.entregas > 0
                    ? `Se ha entregado ${actual.entregas} ${actual.entregas === 1 ? 'vez' : 'veces'}.`
                    : 'Todavía no se ha entregado.'}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs flex items-start gap-1.5" style={{ color: '#EF4444' }}>
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> {error}
              </p>
            )}
            {aviso && <p className="text-xs" style={{ color: '#10B981' }}>{aviso}</p>}
          </div>
        </div>

        {/* ── Pie ── */}
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          {actual && (
            <>
              <button onClick={() => archivar(actual)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                {actual.activo ? <><Archive size={13} /> Archivar</> : <><ArchiveRestore size={13} /> Reactivar</>}
              </button>
              {/* Borrar solo lo que nunca se entregó: lo que tiene historia se
                  archiva, que es dejar de ofrecerlo sin borrar la constancia. */}
              {actual.entregas === 0 && (
                <button onClick={() => borrar(actual)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                  <Trash2 size={13} /> Borrar
                </button>
              )}
            </>
          )}
          <div className="flex-1" />
          <button onClick={onCerrar} className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
            Cerrar
          </button>
          <button onClick={guardar} disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
            style={{ background: '#243C2C', color: '#fff' }}>
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {esNuevo ? 'Crear ítem' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
      style={{ color: 'var(--text-faint)' }}>
      {children}
    </label>
  )
}
