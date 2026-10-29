'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus, CalendarClock } from 'lucide-react'
import { MESES, DIAS_CORTOS, rejillaMes, partes, type Celda } from '@/lib/plan-fechas'
import ChipItem from './ChipItem'
import type { PlanItem } from './tipos'

// ── Vista Mes ─────────────────────────────────────────────────────────────
// La rejilla de lunes a domingo. Arriba, la franja de lo que tiene mes pero
// todavía no tiene día: los datos del plan venían programados por mes, y no
// se pueden quedar sin verse solo porque les falte la fecha exacta.
// ──────────────────────────────────────────────────────────────────────────

interface Props {
  anio: number
  mes: number
  items: PlanItem[]           // ya filtrados a este mes
  seleccionado: string | null
  armado: boolean             // hay un tema armado esperando día
  onMes: (mes: number) => void
  onAbrirItem: (item: PlanItem) => void
  onCrearEnDia: (fecha: string | null) => void
}

function Celdilla({
  celda, items, seleccionado, armado, onAbrirItem, onCrearEnDia,
}: {
  celda: Celda; items: PlanItem[]; seleccionado: string | null; armado: boolean
  onAbrirItem: (i: PlanItem) => void; onCrearEnDia: (f: string | null) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dia-${celda.fecha ?? 'relleno'}`,
    disabled: !celda.fecha,
    data: { clase: 'dia', fecha: celda.fecha },
  })
  const [verTodo, setVerTodo] = useState(false)

  if (!celda.fecha) {
    return <div style={{ background: 'var(--bg-card)', opacity: 0.35, minHeight: 92, borderRadius: 10 }} />
  }

  const visibles = verTodo ? items : items.slice(0, 3)
  const ocultos = items.length - visibles.length

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      tabIndex={0}
      aria-label={`${celda.dia} de ${MESES[(partes(celda.fecha)!.mes) - 1]}`}
      onClick={() => { if (armado) onCrearEnDia(celda.fecha) }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCrearEnDia(celda.fecha) }
      }}
      className="group/dia relative rounded-[10px] p-1 flex flex-col gap-1 transition-all outline-none focus-visible:ring-2"
      style={{
        minHeight: 92,
        cursor: armado ? 'copy' : 'default',
        background: isOver
          ? 'rgba(59,130,246,0.10)'
          : celda.finDeSemana ? 'var(--bg-card)' : 'var(--bg-surface)',
        border: isOver
          ? '1.5px dashed var(--primary)'
          : celda.hoy ? '1.5px solid var(--primary)' : '1px solid var(--border)',
      }}>

      <div className="flex items-center justify-between px-0.5 flex-shrink-0">
        <span className="text-[10px] font-bold"
          style={{
            color: celda.hoy ? 'var(--primary)' : celda.finDeSemana ? 'var(--text-faint)' : 'var(--text-dim)',
          }}>
          {celda.dia}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onCrearEnDia(celda.fecha) }}
          aria-label={`Programar el ${celda.dia}`}
          className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover/dia:opacity-100 transition-opacity"
          style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
          <Plus size={9} />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        {visibles.map(i => (
          <ChipItem key={i.id} item={i} compacto seleccionado={seleccionado === i.id}
            onAbrir={() => onAbrirItem(i)} />
        ))}
        {ocultos > 0 && (
          <button onClick={e => { e.stopPropagation(); setVerTodo(true) }}
            className="text-[9px] font-bold text-left px-1" style={{ color: 'var(--primary)' }}>
            +{ocultos} más
          </button>
        )}
      </div>
    </div>
  )
}

function FranjaSinFecha({
  items, seleccionado, mes, armado, onAbrirItem, onCrearEnDia,
}: {
  items: PlanItem[]; seleccionado: string | null; mes: number; armado: boolean
  onAbrirItem: (i: PlanItem) => void; onCrearEnDia: (f: string | null) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'sin-fecha', data: { clase: 'sin_fecha', mes } })

  return (
    <div
      ref={setNodeRef}
      onClick={() => { if (armado) onCrearEnDia(null) }}
      className="rounded-xl p-2 mb-2 transition-all"
      style={{
        background: isOver ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
        border: isOver ? '1.5px dashed var(--primary)' : '1px solid var(--border)',
        cursor: armado ? 'copy' : 'default',
      }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <CalendarClock size={11} style={{ color: 'var(--text-faint)' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          Sin fecha este mes
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
          Suelta aquí un tema para dejarlo en {MESES[mes - 1]} sin día fijo.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map(i => (
            <div key={i.id} style={{ maxWidth: 220 }}>
              <ChipItem item={i} seleccionado={seleccionado === i.id} onAbrir={() => onAbrirItem(i)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VistaMes({
  anio, mes, items, seleccionado, armado, onMes, onAbrirItem, onCrearEnDia,
}: Props) {
  const celdas = rejillaMes(anio, mes)
  const ahora = new Date()
  const esMesDeHoy = ahora.getFullYear() === anio && ahora.getMonth() + 1 === mes

  const porDia = new Map<string, PlanItem[]>()
  const sinFecha: PlanItem[] = []
  for (const i of items) {
    const p = partes(i.scheduled_date)
    if (!p || p.mes !== mes || p.anio !== anio) { sinFecha.push(i); continue }
    const k = i.scheduled_date as string
    if (!porDia.has(k)) porDia.set(k, [])
    porDia.get(k)!.push(i)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navegación del mes */}
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <button onClick={() => onMes(mes === 1 ? 12 : mes - 1)} aria-label="Mes anterior"
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <ChevronLeft size={14} />
        </button>
        <span className="font-black text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          {MESES[mes - 1]} <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>{anio}</span>
        </span>
        <button onClick={() => onMes(mes === 12 ? 1 : mes + 1)} aria-label="Mes siguiente"
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <ChevronRight size={14} />
        </button>
        {!esMesDeHoy && (
          <button onClick={() => onMes(ahora.getMonth() + 1)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg"
            style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
            Hoy
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: 560 }}>
          <FranjaSinFecha items={sinFecha} seleccionado={seleccionado} mes={mes} armado={armado}
            onAbrirItem={onAbrirItem} onCrearEnDia={onCrearEnDia} />

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_CORTOS.map(d => (
              <div key={d} className="text-[9px] font-bold uppercase tracking-widest text-center py-1"
                style={{ color: 'var(--text-faint)' }}>
                {d}
              </div>
            ))}
          </div>

          <div role="grid" className="grid grid-cols-7 gap-1 pb-3">
            {celdas.map((c, idx) => (
              <Celdilla key={c.fecha ?? `r${idx}`} celda={c}
                items={c.fecha ? (porDia.get(c.fecha) ?? []) : []}
                seleccionado={seleccionado} armado={armado}
                onAbrirItem={onAbrirItem} onCrearEnDia={onCrearEnDia} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
