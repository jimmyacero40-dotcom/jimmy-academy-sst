'use client'

import * as Iconos from 'lucide-react'
import { ShieldCheck } from 'lucide-react'

/**
 * Dibuja un pictograma por su nombre.
 *
 * El nombre se guarda como texto en la tarjeta —no el componente—, porque lo
 * elige una persona y queda escrito en la base. Si mañana la librería de
 * iconos cambia y uno desaparece, aquí se cae a un escudo en vez de tumbar la
 * pantalla entera con un error de React.
 */
export function Pictograma({ id, size = 20, color }: { id: string; size?: number; color?: string }) {
  const Icono = (Iconos as any)[id]
  const Dibujo = typeof Icono === 'function' || typeof Icono === 'object' ? Icono : ShieldCheck
  return <Dibujo size={size} color={color} strokeWidth={2} aria-hidden />
}
