'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

/**
 * Pantalla de un módulo cuya navegación ya existe pero cuyo contenido aún no.
 * Evita que el trabajador se encuentre una ruta en blanco.
 */
export function ModuloEnPreparacion({
  titulo, bajada, descripcion, icono: Icono, acento,
}: {
  titulo: string
  bajada: string
  descripcion: string
  icono: LucideIcon
  acento: string
}) {
  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          {titulo}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{bajada}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="terra-card p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${acento}1A`, color: acento, border: `1px solid ${acento}40` }}>
          <Icono size={28} />
        </div>
        <p className="text-base font-bold" style={{ color: 'var(--text)' }}>Muy pronto</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: 460 }}>
          {descripcion}
        </p>
      </motion.div>
    </div>
  )
}
