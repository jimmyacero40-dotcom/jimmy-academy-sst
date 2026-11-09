'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, LayoutList, ChevronLeft, ChevronRight, Send, Eye, Save,
  AlertCircle, RotateCcw,
} from 'lucide-react'
import { avance, type Pregunta } from '@/lib/modulos'
import CampoRespuesta from '@/components/modulos/CampoRespuesta'

/**
 * Cómo le va a quedar el formulario al trabajador, sin tener que publicarlo
 * ni entrar con su cuenta.
 *
 * Dibuja lo que hay en el armador en este momento, incluso lo que todavía no
 * se ha guardado: la idea es ver cómo va quedando mientras se arma. Se puede
 * contestar para probarlo y nada de eso se guarda en ningún lado.
 */
export default function VistaPrevia({ nombre, descripcion, color, preguntas, onCerrar }: {
  nombre: string
  descripcion?: string | null
  color: string
  preguntas: Pregunta[]
  onCerrar: () => void
}) {
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState<Record<string, any>>({})

  // Las que de verdad se le mostrarían: una pregunta sin título todavía no
  // existe para el trabajador.
  const visibles = useMemo(
    () => preguntas.filter(p => (p.titulo ?? '').trim()),
    [preguntas])

  const { hechas, total, pct } = avance(visibles, datos)
  const pregunta = visibles[Math.min(paso, Math.max(visibles.length - 1, 0))]
  const esUltima = paso >= visibles.length - 1

  const marco = (contenido: React.ReactNode) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Eye size={15} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Vista previa</p>
              <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                Así lo va a ver el trabajador. Nada de lo que escriba aquí se guarda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Object.keys(datos).length > 0 && (
              <button onClick={() => { setDatos({}); setPaso(0) }}
                title="Empezar de nuevo" className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-dim)' }}>
                <RotateCcw size={14} />
              </button>
            )}
            <button onClick={onCerrar} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto p-4" style={{ background: 'var(--bg)' }}>
          {contenido}
        </div>
      </motion.div>
    </div>
  )

  if (!visibles.length) {
    return marco(
      <div className="terra-card p-8 text-center">
        <LayoutList size={28} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Todavía no hay nada que mostrar</p>
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          Escríbale el título a alguna pregunta y aquí va a ver cómo le queda.
        </p>
      </div>,
    )
  }

  return marco(
    <>
      {/* La cabecera que ve el trabajador */}
      <div className="terra-card p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: color + '1F', color }}>
            <LayoutList size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
              {nombre || 'Módulo sin nombre'}
            </p>
            {descripcion && (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{descripcion}</p>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-dim)' }}>
              Pregunta {paso + 1} de {visibles.length}
              {total > 0 && ` · ${hechas} de ${total} obligatorias`}
            </span>
            <span className="text-xs font-bold"
              style={{ color: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : 'var(--text-dim)' }}>
              {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : 'var(--primary)' }} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={pregunta.id}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="terra-card p-5">
          <p className="text-base font-bold leading-snug" style={{ color: 'var(--text)' }}>
            {pregunta.titulo}
            {!pregunta.obligatoria && (
              <span className="text-xs font-normal ml-1.5" style={{ color: 'var(--text-faint)' }}>(opcional)</span>
            )}
          </p>
          {pregunta.ayuda && (
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{pregunta.ayuda}</p>
          )}

          <div className="mt-4">
            <CampoRespuesta pregunta={pregunta} valor={datos[pregunta.id]}
              onCambio={v => setDatos(d => ({ ...d, [pregunta.id]: v }))} />
          </div>

          {/* Una pregunta de escoger sin opciones no se puede contestar: en
              la vista previa se ve el hueco antes de publicarlo. */}
          {(pregunta.tipo === 'opcion' || pregunta.tipo === 'multiple') && !pregunta.opciones.length && (
            <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: '#FCA5A5' }}>
              <AlertCircle size={13} /> Esta pregunta no tiene opciones todavía: el trabajador no podría responderla.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => setPaso(p => Math.max(0, p - 1))} disabled={paso === 0}
          className="terra-btn-outline flex items-center gap-1.5 disabled:opacity-30"
          style={{ padding: '10px 16px', fontSize: 12 }}>
          <ChevronLeft size={13} /> Atrás
        </button>

        <span className="flex items-center gap-1.5 rounded-lg text-xs font-semibold opacity-50"
          style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <Save size={12} /> Guardar
        </span>

        <div className="ml-auto">
          {esUltima ? (
            <span className="terra-btn flex items-center gap-1.5 opacity-60"
              style={{ padding: '10px 20px', fontSize: 12 }}>
              <Send size={13} /> Enviar
            </span>
          ) : (
            <button onClick={() => setPaso(p => Math.min(visibles.length - 1, p + 1))}
              className="terra-btn flex items-center gap-1.5" style={{ padding: '10px 20px', fontSize: 12 }}>
              Siguiente <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-center mt-4" style={{ color: 'var(--text-faint)' }}>
        Guardar y Enviar están apagados: esto es solo para mirar.
      </p>
    </>,
  )
}
