'use client'

import { useEffect, useState } from 'react'
import { History, Loader2 } from 'lucide-react'
import { enPalabras } from '@/lib/plan-fechas'

interface Anotacion {
  id: string
  accion: string
  motivo: string | null
  detalle: any
  usuario_nombre: string | null
  created_at: string
}

/** Lo que se le ha hecho a esta capacitación: quién, cuándo y por qué. */
export function Historial({ planItemId }: { planItemId: string }) {
  const [filas, setFilas] = useState<Anotacion[] | null>(null)

  useEffect(() => {
    let vigente = true
    fetch(`/api/plan-items/${planItemId}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (vigente) setFilas(Array.isArray(d) ? d : []) })
      .catch(() => { if (vigente) setFilas([]) })
    return () => { vigente = false }
  }, [planItemId])

  if (filas === null) return (
    <div className="flex items-center gap-2 py-4 text-xs" style={{ color: 'var(--text-faint)' }}>
      <Loader2 size={13} className="animate-spin" /> Cargando el historial…
    </div>
  )

  if (!filas.length) return (
    <p className="text-xs py-4" style={{ color: 'var(--text-faint)' }}>
      Todavía no se le ha hecho nada a esta capacitación.
    </p>
  )

  return (
    <div className="space-y-2 py-2">
      {filas.map(f => (
        <div key={f.id} className="rounded-lg p-2.5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {describir(f)}
          </p>
          {f.motivo && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{f.motivo}</p>
          )}
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
            {f.usuario_nombre ?? 'Alguien'} · {new Date(f.created_at).toLocaleString('es-CO', {
              day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Una línea en español por cada cosa que se anotó. */
function describir(f: Anotacion): string {
  const d = f.detalle ?? {}
  switch (f.accion) {
    case 'reprogramar':
      return d.de
        ? `Reprogramada del ${enPalabras(d.de)} al ${enPalabras(d.a)}`
        : `Programada para el ${enPalabras(d.a)}`
    case 'cancelar':   return 'Capacitación cancelada'
    case 'retirar':    return `Se quitó a ${d.nombres?.length ?? d.cuantas ?? ''} ${(d.nombres?.length ?? 0) === 1 ? 'persona' : 'personas'}`.replace('  ', ' ')
    case 'restaurar':  return 'Se devolvió a quien se había quitado'
    case 'asistencia': return `Asistencia marcada: ${d.valor ?? ''}`
    case 'notificar':  return `Correos enviados: ${d.enviados ?? 0}${d.fallidos ? ` · ${d.fallidos} sin enviar` : ''}`
    default:           return f.accion
  }
}
