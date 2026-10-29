'use client'

import { useDraggable } from '@dnd-kit/core'
import { Star, Clock } from 'lucide-react'
import { ESTADO_COLOR, ESTADO_NOMBRE, type PlanItem } from './tipos'

// Una capacitación dentro del calendario. El color va por estado, que es lo
// que se mira de lejos en una planeación: qué falta y qué ya se hizo.

export function Estado({ estado }: { estado: string }) {
  const color = ESTADO_COLOR[estado] ?? '#6B7280'
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '20', color, border: `1px solid ${color}30` }}>
      {ESTADO_NOMBRE[estado] ?? estado}
    </span>
  )
}

export default function ChipItem({
  item, compacto = false, seleccionado = false, onAbrir,
}: {
  item: PlanItem
  /** En la rejilla del mes el espacio es poco: solo el título. */
  compacto?: boolean
  seleccionado?: boolean
  onAbrir: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { clase: 'item', itemId: item.id },
  })
  const color = ESTADO_COLOR[item.estado] ?? '#6B7280'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      title={`${item.trainings.title} · ${ESTADO_NOMBRE[item.estado] ?? item.estado}`}
      onClick={e => { e.stopPropagation(); onAbrir() }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onAbrir() }
      }}
      className="rounded-lg transition-all outline-none focus-visible:ring-2"
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        padding: compacto ? '2px 4px' : '6px 8px',
        background: seleccionado ? color + '28' : color + '14',
        border: `1px solid ${seleccionado ? color + '70' : color + '35'}`,
      }}>
      <div className="flex items-center gap-1 min-w-0">
        {item.required && <Star size={compacto ? 7 : 8} fill="#FCD34D" style={{ color: '#FCD34D', flexShrink: 0 }} />}
        <span className="font-semibold truncate"
          style={{ color: 'var(--text)', flex: 1, minWidth: 0, fontSize: compacto ? 9 : 11 }}>
          {item.trainings.title}
        </span>
      </div>
      {!compacto && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <Estado estado={item.estado} />
          {item.trainings.duration && (
            <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--text-faint)' }}>
              <Clock size={7} />{item.trainings.duration}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
