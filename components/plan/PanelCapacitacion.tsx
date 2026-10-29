'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, Loader2, BookOpen, Users, Clock, CalendarDays, Target, UserCheck,
} from 'lucide-react'
import AsignarCapacitacion from '@/components/AsignarCapacitacion'
import PanelAsignacion from './PanelAsignacion'
import { ESTADO_COLOR, ESTADO_NOMBRE, colorCategoria, type PlanItem, type Tema } from './tipos'
import { enPalabras, MESES } from '@/lib/plan-fechas'

// ── La capacitación, abierta ──────────────────────────────────────────────
// Antes, tocar una capacitación del calendario abría un formulario del plan
// que decía "Dirigido a: toda la empresa" sin asignarle nada a nadie, y para
// asignar de verdad tocaba ir a "Asignar a personas" y volver a buscar el
// mismo curso.
//
// Ahora se abre aquí: arriba la ficha con su cobertura, y debajo el mismo
// asistente de asignación -el de siempre, sin el paso de elegir curso, que ya
// se sabe cuál es-.
// ──────────────────────────────────────────────────────────────────────────

export interface Cobertura { asignados: number; asistieron: number; faltan: number }

/** Lo que el plan guarda como "Responsable: FULANO" dentro de observaciones. */
function responsableDe(observaciones: string | null): string {
  const m = /Responsable:\s*(.+)/i.exec(observaciones ?? '')
  return m ? m[1].trim() : ''
}

function Barra({ cobertura }: { cobertura: Cobertura }) {
  const { asignados, asistieron } = cobertura
  const pct = asignados ? Math.round((asistieron / asignados) * 100) : 0
  const color = asignados === 0 ? '#EF4444' : pct === 100 ? '#10B981' : '#F59E0B'

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          Cobertura
        </span>
        <span className="text-[11px] font-black ml-auto" style={{ color }}>
          {asignados === 0 ? 'Sin asignar' : `${asistieron}/${asignados}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${asignados === 0 ? 100 : pct}%`, background: color, opacity: asignados === 0 ? 0.25 : 1 }} />
      </div>
      <div className="flex gap-3 mt-1.5">
        {[
          { n: 'Asignados', v: cobertura.asignados, c: 'var(--primary)' },
          { n: 'Asistieron', v: cobertura.asistieron, c: '#10B981' },
          { n: 'Faltan', v: cobertura.faltan, c: '#F59E0B' },
        ].map(x => (
          <span key={x.n} className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {x.n} <b style={{ color: x.c }}>{x.v}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PanelCapacitacion({
  item, planId, anioPlan, temas, onCerrar, onGuardado, onEliminado, onCambioAsignacion,
}: {
  item: PlanItem
  planId: string
  anioPlan: number
  temas: Tema[]
  onCerrar: () => void
  onGuardado: (items: PlanItem[]) => void
  onEliminado: (id: string) => void
  /** Tras asignar: la pantalla de atrás recarga el plan y sus contadores. */
  onCambioAsignacion: (aviso: string) => void
}) {
  const [pestana, setPestana] = useState<'asignacion' | 'detalles'>('asignacion')
  const [cobertura, setCobertura] = useState<Cobertura | null>(null)

  const cargarCobertura = useCallback(async () => {
    const r = await fetch(`/api/asignaciones?plan_item_id=${item.id}`)
    if (!r.ok) { setCobertura({ asignados: 0, asistieron: 0, faltan: 0 }); return }
    const d: any[] = await r.json()
    const asistieron = d.filter(e => e.status === 'completed').length
    setCobertura({ asignados: d.length, asistieron, faltan: d.length - asistieron })
  }, [item.id])

  useEffect(() => { cargarCobertura() }, [cargarCobertura])

  // Esc cierra el panel.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  const color = colorCategoria(item.trainings.category)
  const responsable = responsableDe(item.observaciones)
  const tema = temas.find(t => t.id === item.trainings.id)
  const objetivo = (tema as any)?.descripcion as string | undefined
  const cuando = item.scheduled_date ? enPalabras(item.scheduled_date) : MESES[item.month - 1]

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      role="dialog" aria-label={item.trainings.title}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden shadow-2xl"
      style={{ width: 'min(520px, 100vw)', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>

      {/* ── Ficha de la capacitación, siempre a la vista ── */}
      <div className="p-4 flex-shrink-0 space-y-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: color + '18', border: `1px solid ${color}30` }}>
            <BookOpen size={16} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-snug" style={{ color: 'var(--text)' }}>
              {item.trainings.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {item.trainings.category && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: color + '20', color }}>
                  {item.trainings.category}
                </span>
              )}
              {item.trainings.duration && (
                <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-faint)' }}>
                  <Clock size={9} />{item.trainings.duration}
                </span>
              )}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: (ESTADO_COLOR[item.estado] ?? '#6B7280') + '20',
                  color: ESTADO_COLOR[item.estado] ?? '#6B7280',
                }}>
                {ESTADO_NOMBRE[item.estado] ?? item.estado}
              </span>
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-faint)' }}>
                <CalendarDays size={9} />{cuando}
              </span>
            </div>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar"
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
            <X size={14} />
          </button>
        </div>

        {(objetivo || responsable) && (
          <div className="space-y-1">
            {objetivo && (
              <p className="text-[11px] flex items-start gap-1.5" style={{ color: 'var(--text-dim)' }}>
                <Target size={11} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-faint)' }} />
                <span className="line-clamp-2">{objetivo}</span>
              </p>
            )}
            {responsable && (
              <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                <UserCheck size={11} style={{ color: 'var(--text-faint)' }} /> {responsable}
              </p>
            )}
          </div>
        )}

        {cobertura
          ? <Barra cobertura={cobertura} />
          : <div className="h-8 flex items-center"><Loader2 size={13} className="animate-spin" style={{ color: 'var(--text-faint)' }} /></div>}
      </div>

      {/* ── Pestañas ── */}
      <div className="flex gap-1 px-3 pt-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {([['asignacion', 'Asignación', Users], ['detalles', 'Detalles del plan', CalendarDays]] as const).map(([id, nombre, Icono]) => (
          <button key={id} onClick={() => setPestana(id)}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold transition-all"
            style={{
              color: pestana === id ? 'var(--primary)' : 'var(--text-dim)',
              borderBottom: `2px solid ${pestana === id ? 'var(--primary)' : 'transparent'}`,
            }}>
            <Icono size={12} /> {nombre}
          </button>
        ))}
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex-1 overflow-hidden">
        {pestana === 'asignacion' ? (
          <AsignarCapacitacion
            abierto
            variante="panel"
            cursoFijado={{
              id: item.trainings.id, title: item.trainings.title,
              category: item.trainings.category, duration: item.trainings.duration,
            }}
            planItemId={item.id}
            publicoInicial={(item.plan_item_targets ?? []).map(t => ({ tipo: t.target_type, id: t.target_id }))}
            mesInicial={item.month}
            fechaInicial={item.scheduled_date ?? ''}
            onCerrar={onCerrar}
            onListo={async () => {
              await cargarCobertura()
              onCambioAsignacion('Asignación guardada')
            }}
          />
        ) : (
          <PanelAsignacion
            variante="panel"
            modo="editar"
            planId={planId}
            anioPlan={anioPlan}
            item={item}
            temas={temas}
            onCerrar={onCerrar}
            onGuardado={onGuardado}
            onEliminado={onEliminado}
          />
        )}
      </div>
    </motion.div>
  )
}
