'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, Pencil, Trash2, Plus,
  Loader2, AlertCircle, Check, LayoutGrid,
} from 'lucide-react'
import { TIPO, COLOR, estadoDe, type Tarjeta, type TipoTarjeta } from '@/lib/tablero'
import { EditorTarjeta, ElegirTipo, type Opciones } from '@/components/tablero/EditorTarjeta'

const ESTADOS: Record<string, { texto: string; color: string }> = {
  publicada:  { texto: 'Publicada',  color: '#059669' },
  apagada:    { texto: 'Apagada',    color: '#6B778C' },
  programada: { texto: 'Programada', color: '#B45309' },
  vencida:    { texto: 'Vencida',    color: '#DC2626' },
}

export default function EditarTableroPage() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  const [opciones, setOpciones] = useState<Opciones>({ centros: [], areas: [] })
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<Tarjeta | null>(null)
  const [eligiendoTipo, setEligiendoTipo] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'bien' | 'mal'; texto: string } | null>(null)

  const cargar = () =>
    fetch('/api/tablero?todas=1')
      .then(r => r.json())
      .then(d => {
        setTarjetas(d.tarjetas ?? [])
        if (d.opciones) setOpciones(d.opciones)
      })
      .catch(() => setAviso({ tono: 'mal', texto: 'No se pudo cargar el tablero' }))
      .finally(() => setCargando(false))

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  const guardar = async (cambios: Partial<Tarjeta> & { id: string }) => {
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setAviso({ tono: 'mal', texto: d.error ?? 'No se pudo guardar' }); return false }
    await cargar()
    return true
  }

  const prender = (t: Tarjeta) => guardar({ id: t.id, activa: !t.activa })

  const mover = async (i: number, hacia: -1 | 1) => {
    const j = i + hacia
    if (j < 0 || j >= tarjetas.length) return
    const nuevo = [...tarjetas]
    ;[nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]]
    setTarjetas(nuevo)   // se mueve de una, sin esperar al servidor
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden: nuevo.map(t => t.id) }),
    })
    if (!r.ok) { setAviso({ tono: 'mal', texto: 'No se pudo guardar el orden' }); cargar() }
  }

  const borrar = async (t: Tarjeta) => {
    const nombre = t.titulo || TIPO(t.tipo).nombre
    if (!confirm(`¿Borrar «${nombre}»?\n\nNo se puede deshacer. Si solo quiere que deje de verse, apáguela.`)) return
    const r = await fetch(`/api/tablero/tarjetas?id=${t.id}`, { method: 'DELETE' })
    if (!r.ok) { setAviso({ tono: 'mal', texto: 'No se pudo borrar' }); return }
    setAviso({ tono: 'bien', texto: 'Tarjeta borrada' })
    cargar()
  }

  const crear = async (tipo: TipoTarjeta) => {
    setEligiendoTipo(false)
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, titulo: TIPO(tipo).nombre, color: 'cian', activa: false }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setAviso({ tono: 'mal', texto: d.error ?? 'No se pudo crear' }); return }
    await cargar()
    setEditando(d.tarjeta)
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/inicio"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-1"
            style={{ color: 'var(--primary-dark)' }}>
            <ArrowLeft size={14} /> Volver al tablero
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tablero en lista</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-label)' }}>
            Para ver de un vistazo qué está publicado, apagado, programado o vencido
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/inicio"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--bg-card)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            <LayoutGrid size={15} /> Diseñar sobre el tablero
          </Link>
          <button onClick={() => setEligiendoTipo(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            <Plus size={16} /> Agregar tarjeta
          </button>
        </div>
      </div>

      {aviso && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{
            background: aviso.tono === 'bien' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: aviso.tono === 'bien' ? '#059669' : '#DC2626',
            border: `1px solid ${aviso.tono === 'bien' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
          {aviso.tono === 'bien' ? <Check size={15} /> : <AlertCircle size={15} />}
          {aviso.texto}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center gap-2 py-16 justify-center text-sm" style={{ color: 'var(--text-label)' }}>
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : (
        <div className="space-y-2">
          {tarjetas.map((t, i) => (
            <Fila key={t.id} t={t} primera={i === 0} ultima={i === tarjetas.length - 1}
              onSubir={() => mover(i, -1)} onBajar={() => mover(i, 1)}
              onPrender={() => prender(t)} onEditar={() => setEditando(t)} onBorrar={() => borrar(t)} />
          ))}
          {tarjetas.length === 0 && (
            <p className="text-sm py-10 text-center" style={{ color: 'var(--text-label)' }}>
              Todavía no hay tarjetas. Agregue la primera.
            </p>
          )}
        </div>
      )}

      {eligiendoTipo && <ElegirTipo onElegir={crear} onCerrar={() => setEligiendoTipo(false)} />}
      {editando && (
        <EditorTarjeta tarjeta={editando} opciones={opciones}
          onCerrar={() => setEditando(null)}
          onGuardar={async cambios => {
            const ok = await guardar({ ...cambios, id: editando.id })
            if (ok) { setEditando(null); setAviso({ tono: 'bien', texto: 'Guardado' }) }
          }} />
      )}
    </div>
  )
}

// ── Una fila de la lista ───────────────────────────────────────────────────

function Fila({ t, primera, ultima, onSubir, onBajar, onPrender, onEditar, onBorrar }: {
  t: Tarjeta; primera: boolean; ultima: boolean
  onSubir: () => void; onBajar: () => void
  onPrender: () => void; onEditar: () => void; onBorrar: () => void
}) {
  const meta = TIPO(t.tipo)
  const c = COLOR(t.color)
  const est = ESTADOS[estadoDe(t)]
  const aud = t.audiencia as any
  const dirigida = aud?.todos || (!aud?.centros?.length && !aud?.areas?.length)
    ? 'Todos'
    : [...(aud.centros ?? []), ...(aud.areas ?? [])].join(', ')

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl flex-wrap"
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${c.fuerte}`, opacity: t.activa ? 1 : 0.62,
      }}>
      <div className="flex flex-col gap-0.5">
        <button onClick={onSubir} disabled={primera} aria-label="Subir"
          className="p-1 rounded disabled:opacity-25" style={{ color: 'var(--text-faint)' }}>
          <ArrowUp size={14} />
        </button>
        <button onClick={onBajar} disabled={ultima} aria-label="Bajar"
          className="p-1 rounded disabled:opacity-25" style={{ color: 'var(--text-faint)' }}>
          <ArrowDown size={14} />
        </button>
      </div>

      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: c.suave, color: c.fuerte }}>{meta.nombre}</span>
          <span className="text-[11px] font-bold" style={{ color: est.color }}>● {est.texto}</span>
          {meta.automatica && (
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>se llena sola</span>
          )}
        </div>
        <p className="font-semibold text-[14px] mt-1 leading-snug" style={{ color: 'var(--text)' }}>
          {t.titulo || <span style={{ color: 'var(--text-faint)' }}>Sin título</span>}
        </p>
        <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-label)' }}>
          Para: {dirigida}
          {t.hasta ? ` · hasta el ${new Date(t.hasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onPrender} title={t.activa ? 'Apagar' : 'Publicar'}
          className="p-2 rounded-lg" style={{ color: t.activa ? '#059669' : 'var(--text-faint)' }}>
          {t.activa ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button onClick={onEditar} title="Editar" className="p-2 rounded-lg" style={{ color: 'var(--text-dim)' }}>
          <Pencil size={15} />
        </button>
        <button onClick={onBorrar} title="Borrar" className="p-2 rounded-lg" style={{ color: '#DC2626' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

