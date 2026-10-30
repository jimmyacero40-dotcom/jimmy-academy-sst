'use client'

import { useState } from 'react'
import { CalendarClock, Loader2, AlertCircle } from 'lucide-react'
import { enPalabras } from '@/lib/plan-fechas'
import type { PlanItem } from './tipos'

/**
 * Confirma el cambio de fecha de una capacitación que ya tiene gente.
 *
 * Se abre al arrastrarla en el calendario y desde el botón Reprogramar del
 * panel. Pregunta antes de mover porque detrás de un chip hay personas que ya
 * tienen ese día apartado.
 */
export function DialogoReprogramar({
  item, fecha, asignados, onCerrar, onHecho,
}: {
  item: PlanItem
  fecha: string | null
  asignados: number
  onCerrar: () => void
  onHecho: (aviso: string) => void
}) {
  const [nueva, setNueva] = useState(fecha ?? item.scheduled_date ?? '')
  const [motivo, setMotivo] = useState('')
  const [notificar, setNotificar] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardar = async () => {
    if (!nueva) { setError('Elige la nueva fecha'); return }
    setGuardando(true); setError(null)
    try {
      const r = await fetch(`/api/plan-items/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'reprogramar', scheduled_date: nueva, motivo, notificar }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No fue posible reprogramar'); return }

      const correo = notificar
        ? d.enviados > 0
          ? ` · se avisó a ${d.enviados}`
          : d.fallos?.length ? ` · ${d.fallos[0].motivo}` : ''
        : ''
      onHecho(`Movida al ${enPalabras(nueva)}${correo}`)
    } catch {
      setError('Error de conexión')
    } finally { setGuardando(false) }
  }

  const inp = 'w-full text-xs rounded-lg px-3 py-2 outline-none'
  const estiloInp: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <div className="terra-card p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
            <CalendarClock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Reprogramar</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
              {item.trainings.title}
            </p>
          </div>
        </div>

        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {item.scheduled_date
            ? <>Estaba para el <b style={{ color: 'var(--text)' }}>{enPalabras(item.scheduled_date)}</b>. </>
            : <>No tenía fecha. </>}
          {asignados === 1
            ? 'Hay 1 persona asignada.'
            : `Hay ${asignados} personas asignadas.`}
        </p>

        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
          Nueva fecha
        </label>
        <input type="date" value={nueva} onChange={e => setNueva(e.target.value)}
          className={`${inp} mb-3`} style={estiloInp} />

        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
          Motivo <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--text-faint)' }}>(opcional)</span>
        </label>
        <input value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Se cruzó con la cosecha" className={`${inp} mb-3`} style={estiloInp} />

        <label className="flex items-start gap-2.5 cursor-pointer mb-4">
          <input type="checkbox" checked={notificar} onChange={e => setNotificar(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            Avisarles la nueva fecha por correo
          </span>
        </label>

        {error && (
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#FCA5A5' }}>
            <AlertCircle size={13} /> {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onCerrar} className="terra-btn-outline" style={{ padding: '8px 16px', fontSize: 12 }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando}
            className="flex items-center gap-1.5 rounded-lg font-bold text-white"
            style={{ padding: '8px 16px', fontSize: 12, background: 'var(--primary)' }}>
            {guardando ? <Loader2 size={13} className="animate-spin" /> : <CalendarClock size={13} />}
            Reprogramar
          </button>
        </div>
      </div>
    </div>
  )
}
