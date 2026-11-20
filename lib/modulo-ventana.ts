/**
 * El plazo de un módulo de Tú Cuentas.
 *
 * El módulo se abría y se cerraba a mano. Eso obliga a acordarse de venir a
 * cerrarlo el día del corte, y si se pasa sigue entrando respuesta después.
 * Con fechas se cierra solo.
 *
 * Vive aparte porque lo necesitan tres rutas —el listado, el módulo y el
 * guardado de la respuesta— y la regla tiene que ser una sola: si cada una la
 * escribe a su manera, una pantalla dice abierto y la otra no deja responder.
 */

/** Hoy en Colombia, como 'YYYY-MM-DD'. Sin pasar por UTC, que corre el día. */
export function hoyCol(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export interface ConVentana {
  estado?: string | null
  abre?: string | null
  cierra?: string | null
  motivo_cierre?: string | null
}

/**
 * El estado que de verdad rige. Cerrar a mano cierra siempre; estar «abierto»
 * no sirve de nada si la ventana no ha empezado o ya pasó.
 */
export function estadoVigente(m: ConVentana): {
  estado: string
  motivo: string | null
  /** El interruptor tal como está guardado, para la pantalla del administrador. */
  guardado: string
} {
  const guardado = m.estado ?? 'borrador'
  if (guardado !== 'abierto') {
    return { estado: guardado, motivo: m.motivo_cierre ?? null, guardado }
  }

  const hoy = hoyCol()
  if (m.abre && hoy < m.abre) {
    return { estado: 'cerrado', motivo: `Se abre el ${m.abre}`, guardado }
  }
  if (m.cierra && hoy > m.cierra) {
    return { estado: 'cerrado', motivo: `Cerró el ${m.cierra}`, guardado }
  }
  return { estado: 'abierto', motivo: null, guardado }
}

/** Una fecha 'YYYY-MM-DD' como se lee en Colombia. */
export function enLetras(f?: string | null): string {
  if (!f) return ''
  return new Date(f + 'T12:00:00')
    .toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}
