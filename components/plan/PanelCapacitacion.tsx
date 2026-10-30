'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, Loader2, BookOpen, Users, Clock, CalendarDays, Target, UserCheck,
  ClipboardList, Ban, AlertTriangle, CalendarClock, History,
} from 'lucide-react'
import AsignarCapacitacion from '@/components/AsignarCapacitacion'
import PanelAsignacion from './PanelAsignacion'
import Seguimiento, { estadoDe, type Asignado } from './Seguimiento'
import { DialogoReprogramar } from './DialogoReprogramar'
import { Historial } from './Historial'
import { ESTADO_COLOR, ESTADO_NOMBRE, colorCategoria, type PlanItem, type Tema } from './tipos'
import { enPalabras, MESES } from '@/lib/plan-fechas'

// ── La capacitación, abierta ──────────────────────────────────────────────
// Antes, tocar una capacitación del calendario abría un formulario del plan
// que decía "Dirigido a: toda la empresa" sin asignarle nada a nadie, y para
// asignar de verdad tocaba ir a "Asignar a personas" y volver a buscar el
// mismo curso.
//
// Ahora se abre aquí: arriba la ficha con su cobertura, y debajo tres
// pestañas -quiénes la tienen y cómo van, a quién asignarla, y los datos de
// la capacitación dentro del plan-.
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
  item, planId, anioPlan, temas, onCerrar, onGuardado, onEliminado, onRecargarPlan, onAviso,
}: {
  item: PlanItem
  planId: string
  anioPlan: number
  temas: Tema[]
  onCerrar: () => void
  onGuardado: (items: PlanItem[]) => void
  onEliminado: (id: string) => void
  /** Vuelve a leer el plan: la fecha o el estado pudieron cambiar. */
  onRecargarPlan: () => Promise<void> | void
  onAviso: (texto: string, deshacer?: () => void) => void
}) {
  const [pestana, setPestana] = useState<'seguimiento' | 'asignacion' | 'detalles'>('seguimiento')
  const [reprogramando, setReprogramando] = useState(false)
  const [asignados, setAsignados] = useState<Asignado[] | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [avisarCancelacion, setAvisarCancelacion] = useState(true)
  const [guardandoCancelacion, setGuardandoCancelacion] = useState(false)

  const cargar = useCallback(async () => {
    const r = await fetch(`/api/asignaciones?plan_item_id=${item.id}`)
    setAsignados(r.ok ? await r.json() : [])
  }, [item.id])

  useEffect(() => { cargar() }, [cargar])

  // Sin nadie asignado, el seguimiento no tiene nada que seguir: se abre
  // directamente donde se asigna.
  useEffect(() => {
    if (asignados && asignados.length === 0) setPestana(p => (p === 'seguimiento' ? 'asignacion' : p))
  }, [asignados])

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  const cobertura: Cobertura = {
    asignados: asignados?.length ?? 0,
    asistieron: (asignados ?? []).filter(a => estadoDe(a) === 'asistio').length,
    faltan: (asignados ?? []).filter(a => estadoDe(a) !== 'asistio').length,
  }

  const cancelar = async () => {
    if (!motivo.trim()) return
    setGuardandoCancelacion(true)
    const r = await fetch(`/api/plan-items/${item.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cancelar', motivo, notificar: avisarCancelacion }),
    })
    const d = await r.json()
    setGuardandoCancelacion(false)
    if (!r.ok) { onAviso(d.error ?? 'No se pudo cancelar'); return }
    setCancelando(false); setMotivo('')
    await onRecargarPlan()
    onAviso(avisarCancelacion && !d.enviados
      ? 'Capacitación cancelada · no se enviaron correos'
      : `Capacitación cancelada${d.enviados ? ` · ${d.enviados} avisados` : ''}`)
  }

  const color = colorCategoria(item.trainings.category)
  const responsable = responsableDe(item.observaciones)
  const tema = temas.find(t => t.id === item.trainings.id)
  const objetivo = tema?.descripcion ?? undefined
  const cuando = item.scheduled_date ? enPalabras(item.scheduled_date) : MESES[item.month - 1]
  const cancelada = item.estado === 'cancelada'

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
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setReprogramando(true)} aria-label="Reprogramar"
              title="Reprogramar"
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-card)', color: '#F59E0B' }}>
              <CalendarClock size={13} />
            </button>
            {!cancelada && (
              <button onClick={() => setCancelando(true)} aria-label="Cancelar la capacitación"
                title="Cancelar la capacitación"
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--red-dim)', color: '#FCA5A5' }}>
                <Ban size={13} />
              </button>
            )}
            <button onClick={onCerrar} aria-label="Cerrar"
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
              <X size={14} />
            </button>
          </div>
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

        {asignados
          ? <Barra cobertura={cobertura} />
          : <div className="h-8 flex items-center"><Loader2 size={13} className="animate-spin" style={{ color: 'var(--text-faint)' }} /></div>}
      </div>

      {/* ── Cancelar la capacitación ── */}
      {cancelando && (
        <div className="p-3 flex-shrink-0" style={{ background: 'var(--red-dim)', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#FCA5A5' }} />
            <p className="text-[11px]" style={{ color: '#FCA5A5' }}>
              No se borra: queda como <b>Cancelada</b> con su motivo, visible en el historial del plan.
            </p>
          </div>
          <input value={motivo} onChange={e => setMotivo(e.target.value)} autoFocus
            placeholder="Motivo de la cancelación"
            className="w-full text-xs rounded-lg px-3 py-2 outline-none mb-2"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          {cobertura.asignados > 0 && (
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input type="checkbox" checked={avisarCancelacion}
                onChange={e => setAvisarCancelacion(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                Avisar por correo a los {cobertura.asignados} asignados
              </span>
            </label>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setCancelando(false); setMotivo('') }}
              className="terra-btn-outline flex-1 text-xs py-1.5">
              No cancelar
            </button>
            <button onClick={cancelar} disabled={!motivo.trim() || guardandoCancelacion}
              className="flex-1 text-xs py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
              style={{ background: '#EF4444', color: '#fff' }}>
              {guardandoCancelacion ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Pestañas ── */}
      <div className="flex gap-1 px-3 pt-2 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {([
          ['seguimiento', 'Seguimiento', ClipboardList],
          ['asignacion', cobertura.asignados ? 'Editar asignación' : 'Asignar', Users],
          ['detalles', 'Detalles del plan', CalendarDays],
        ] as const).map(([id, nombre, Icono]) => (
          <button key={id} onClick={() => setPestana(id)}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold transition-all whitespace-nowrap"
            style={{
              color: pestana === id ? 'var(--primary)' : 'var(--text-dim)',
              borderBottom: `2px solid ${pestana === id ? 'var(--primary)' : 'transparent'}`,
            }}>
            <Icono size={12} /> {nombre}
            {id === 'seguimiento' && cobertura.asignados > 0 && (
              <span className="text-[9px] font-black px-1.5 rounded-full"
                style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                {cobertura.asignados}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex-1 overflow-hidden">
        {pestana === 'seguimiento' ? (
          <Seguimiento
            item={item}
            asignados={asignados ?? []}
            cargando={asignados === null}
            onRecargar={async () => { await cargar(); await onRecargarPlan() }}
            onAviso={onAviso}
            irAAsignar={() => setPestana('asignacion')}
          />
        ) : pestana === 'asignacion' ? (
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
              await cargar()
              await onRecargarPlan()
              onAviso('Asignación guardada')
            }}
          />
        ) : (
          <div className="h-full overflow-y-auto">
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
            <div className="px-4 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1"
                style={{ color: 'var(--text-dim)' }}>
                <History size={12} /> Historial
              </p>
              <Historial planItemId={item.id} />
            </div>
          </div>
        )}
      </div>

      {reprogramando && (
        <DialogoReprogramar
          item={item}
          fecha={item.scheduled_date ?? null}
          asignados={(asignados ?? []).length}
          onCerrar={() => setReprogramando(false)}
          onHecho={async texto => {
            setReprogramando(false)
            await cargar()
            await onRecargarPlan()
            onAviso(texto)
          }} />
      )}
    </motion.div>
  )
}
