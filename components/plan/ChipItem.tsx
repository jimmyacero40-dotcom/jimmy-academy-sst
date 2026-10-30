'use client'

import { createContext, useContext } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Star, Clock } from 'lucide-react'
import { ESTADO_COLOR, ESTADO_NOMBRE, type PlanItem, type Cobertura } from './tipos'

/**
 * La cobertura de todo el plan, por contexto. Los chips están dos y tres
 * niveles adentro de las vistas: pasarla a mano obligaría a que cada vista y
 * cada celda la reenviaran sin usarla para nada.
 */
export const CoberturaCtx = createContext<Cobertura>({})

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

/**
 * El color de la cobertura: verde si todos asistieron, ámbar si va a medias,
 * rojo si no hay nadie asignado o ya pasó el día sin que asistiera nadie.
 */
function colorCobertura(asignados: number, asistieron: number, vencida: boolean): string {
  if (!asignados) return '#EF4444'
  if (asistieron >= asignados) return '#10B981'
  if (vencida && !asistieron) return '#EF4444'
  return '#F59E0B'
}

export default function ChipItem({
  item, compacto = false, seleccionado = false, cobertura: dada, onAbrir,
}: {
  item: PlanItem
  /** En la rejilla del mes el espacio es poco: solo el título. */
  compacto?: boolean
  seleccionado?: boolean
  /** Cuánta gente lleva. Sin esto el chip se pinta como siempre. */
  cobertura?: { asignados: number; asistieron: number }
  onAbrir: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { clase: 'item', itemId: item.id },
  })
  const color = ESTADO_COLOR[item.estado] ?? '#6B7280'
  const delContexto = useContext(CoberturaCtx)
  const cobertura = dada ?? delContexto[item.id]

  // Vencida: el día ya pasó. Se compara en texto para no caer en el desfase
  // de zona horaria que mete `new Date('2026-11-12')`.
  const hoy = new Date()
  const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  const vencida = !!item.scheduled_date && item.scheduled_date < hoyTexto
  const colorCob = cobertura
    ? colorCobertura(cobertura.asignados, cobertura.asistieron, vencida)
    : null

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      title={[
        item.trainings.title,
        ESTADO_NOMBRE[item.estado] ?? item.estado,
        cobertura && (cobertura.asignados
          ? `${cobertura.asistieron} de ${cobertura.asignados} asistieron`
          : 'Sin nadie asignado'),
      ].filter(Boolean).join(' · ')}
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
        {colorCob && (
          <span className="font-bold flex-shrink-0 px-1 rounded"
            style={{
              fontSize: compacto ? 8 : 9, color: colorCob,
              background: colorCob + '1F',
              fontVariantNumeric: 'tabular-nums',
            }}>
            {cobertura!.asignados ? `${cobertura!.asistieron}/${cobertura!.asignados}` : '0'}
          </span>
        )}
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
