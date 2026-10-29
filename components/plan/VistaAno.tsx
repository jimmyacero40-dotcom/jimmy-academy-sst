'use client'

import { useDroppable } from '@dnd-kit/core'
import { MESES } from '@/lib/plan-fechas'
import ChipItem from './ChipItem'
import type { PlanItem } from './tipos'

// ── Vista Año ─────────────────────────────────────────────────────────────
// Las doce tarjetas de siempre. El nombre del mes abre ese mes en la Vista
// Mes, y la tarjeta recibe temas soltados: queda en el mes, sin día fijo.
// ──────────────────────────────────────────────────────────────────────────

function TarjetaMes({
  mes, items, seleccionado, armado, onAbrirMes, onAbrirItem, onCrearEnMes,
}: {
  mes: number; items: PlanItem[]; seleccionado: string | null; armado: boolean
  onAbrirMes: () => void; onAbrirItem: (i: PlanItem) => void; onCrearEnMes: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `mes-${mes}`, data: { clase: 'mes', mes } })

  return (
    <div ref={setNodeRef}
      onClick={() => { if (armado) onCrearEnMes() }}
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: isOver ? 'rgba(59,130,246,0.06)' : 'var(--bg-surface)',
        border: isOver ? '1.5px dashed var(--primary)' : '1px solid var(--border)',
        minHeight: 140,
        cursor: armado ? 'copy' : 'default',
      }}>
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <button onClick={e => { e.stopPropagation(); onAbrirMes() }}
          className="text-xs font-bold transition-colors"
          style={{ color: 'var(--text)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}>
          {MESES[mes - 1]}
        </button>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
              {items.length}
            </span>
          )}
          {isOver && <span className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>+</span>}
        </div>
      </div>
      <div className="p-1.5 space-y-1">
        {items.map(i => (
          <ChipItem key={i.id} item={i} seleccionado={seleccionado === i.id} onAbrir={() => onAbrirItem(i)} />
        ))}
        {items.length === 0 && !isOver && (
          <div className="h-10 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Sin capacitaciones</span>
            <button onClick={e => { e.stopPropagation(); onCrearEnMes() }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
              + Programar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VistaAno({
  items, seleccionado, armado, onAbrirMes, onAbrirItem, onCrearEnMes,
}: {
  items: PlanItem[]; seleccionado: string | null; armado: boolean
  onAbrirMes: (mes: number) => void
  onAbrirItem: (i: PlanItem) => void
  onCrearEnMes: (mes: number) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pb-3">
      {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
        <TarjetaMes key={mes} mes={mes}
          items={items.filter(i => i.month === mes)}
          seleccionado={seleccionado} armado={armado}
          onAbrirMes={() => onAbrirMes(mes)}
          onAbrirItem={onAbrirItem}
          onCrearEnMes={() => onCrearEnMes(mes)} />
      ))}
    </div>
  )
}
