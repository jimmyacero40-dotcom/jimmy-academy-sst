'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'

/**
 * La confirmación de archivar o eliminar un curso.
 *
 * Antes eran los `confirm()` del navegador: no se puede leer bien qué curso
 * es, no se parecen a nada del resto de la plataforma, y en algunos
 * navegadores salen arriba del todo donde nadie mira. Aquí el nombre del
 * curso se ve, y la advertencia también.
 */
export default function ConfirmarAccion({
  titulo, mensaje, nombre, confirmar, peligro, trabajando, onCerrar, onConfirmar,
}: {
  titulo: string
  mensaje: string
  /** El curso del que se está hablando, para que no haya equivocación. */
  nombre?: string
  confirmar: string
  peligro?: boolean
  trabajando?: boolean
  onCerrar: () => void
  onConfirmar: () => void
}) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar() } }
    document.addEventListener('keydown', t)
    return () => document.removeEventListener('keydown', t)
  }, [onCerrar])

  const tono = peligro ? '#EF4444' : 'var(--primary)'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <motion.div role="alertdialog" aria-modal="true" aria-label={titulo}
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${tono}1F`, border: `1px solid ${tono}4D` }}>
              <AlertTriangle size={16} style={{ color: tono }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{titulo}</p>
              {nombre && (
                <p className="text-sm font-semibold mt-1.5 break-words" style={{ color: tono }}>{nombre}</p>
              )}
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{mensaje}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onCerrar} className="terra-btn-outline flex-1 py-2 text-sm">Cancelar</button>
          <button onClick={onConfirmar} disabled={trabajando} autoFocus
            className="flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
            style={{ background: tono, color: '#fff', opacity: trabajando ? 0.6 : 1 }}>
            {trabajando && <Loader2 size={13} className="animate-spin" />}
            {confirmar}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
