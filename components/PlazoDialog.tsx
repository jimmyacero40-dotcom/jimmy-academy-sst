'use client'

import { useState } from 'react'
import { Loader2, CalendarRange } from 'lucide-react'

/**
 * Desde cuándo y hasta cuándo se puede responder.
 *
 * El mismo recuadro para la identificación de peligros y para cualquier
 * módulo de Tú Cuentas: la regla es la misma, así que la pantalla también.
 */
export default function PlazoDialog({
  titulo, abre, cierra, onGuardar, onCerrar,
}: {
  titulo: string
  abre: string
  cierra: string
  /** Devuelve el mensaje de error, o null si salió bien. */
  onGuardar: (abre: string | null, cierra: string | null) => Promise<string | null>
  onCerrar: () => void
}) {
  const [desde, setDesde] = useState(abre)
  const [hasta, setHasta] = useState(cierra)
  const [guardando, setGuardando] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const campo = 'w-full px-3 py-2 rounded-lg text-sm outline-none'
  const estilo = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(36,60,44,0.10)', border: '1px solid rgba(36,60,44,0.25)' }}>
            <CalendarRange size={16} style={{ color: '#243C2C' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>Plazo para responder</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{titulo}</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          Fuera de estas fechas el trabajador lo ve cerrado, sin que usted tenga que
          cerrarlo a mano. Deje una casilla vacía si por ese lado no hay límite.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>Abre el</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={campo} style={estilo} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>Cierra el</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={campo} style={estilo} />
          </div>
        </div>

        {err && <p className="text-xs" style={{ color: '#EF4444' }}>{err}</p>}

        <div className="flex gap-2">
          <button onClick={onCerrar}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
            Cancelar
          </button>
          <button
            onClick={async () => {
              setGuardando(true); setErr(null)
              const fallo = await onGuardar(desde || null, hasta || null)
              if (fallo) setErr(fallo)
              setGuardando(false)
            }}
            disabled={guardando}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
            style={{ background: '#243C2C', color: '#fff' }}>
            {guardando && <Loader2 size={14} className="animate-spin" />}
            Guardar plazo
          </button>
        </div>
      </div>
    </div>
  )
}
