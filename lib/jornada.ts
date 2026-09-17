/**
 * Límites de la jornada operativa en hora de Colombia (UTC-5, sin horario de verano).
 * El resto de consultas usa medianoche UTC, que en Colombia son las 7 p.m.: para
 * decidir si un ingreso "es de hoy" o quedó de ayer eso no sirve.
 */
const COT_OFFSET_HORAS = 5
const MS_DIA = 24 * 60 * 60 * 1000

/** Instante UTC correspondiente a las 00:00 en Colombia del día que contiene `ref`. */
export function inicioJornada(ref: Date = new Date()): Date {
  const cot = new Date(ref.getTime() - COT_OFFSET_HORAS * 60 * 60 * 1000)
  return new Date(Date.UTC(cot.getUTCFullYear(), cot.getUTCMonth(), cot.getUTCDate(), COT_OFFSET_HORAS, 0, 0))
}

/** Instante UTC correspondiente a las 23:59:59 en Colombia del día que contiene `ref`. */
export function finJornada(ref: Date = new Date()): Date {
  return new Date(inicioJornada(ref).getTime() + MS_DIA - 1000)
}

/** Instante UTC de las 00:00 en Colombia para una fecha 'YYYY-MM-DD' del calendario local. */
export function inicioJornadaDeFecha(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, COT_OFFSET_HORAS, 0, 0))
}

/** Instante UTC del corte siguiente: sirve como límite superior exclusivo. */
export function siguienteJornada(ref: Date): Date {
  return new Date(ref.getTime() + MS_DIA)
}

export function horaColombia(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
  })
}

export const MOTIVO_OTRA_PORTERIA = 'ingreso_otra_porteria'
export const MOTIVO_FIN_JORNADA = 'fin_jornada'
