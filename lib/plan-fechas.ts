// Fechas del Plan Anual.
//
// Todo se trabaja con año/mes/día sueltos y textos 'YYYY-MM-DD'. Pasar por
// `new Date('2026-11-12')` lo interpretaría como UTC y en Colombia mostraría
// el 11, así que aquí no se usa ese camino en ninguna parte.

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** 'YYYY-MM-DD' a partir de las tres partes. */
export function aTexto(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Partes de un 'YYYY-MM-DD'. Devuelve null si no es una fecha con forma. */
export function partes(fecha: string | null): { anio: number; mes: number; dia: number } | null {
  if (!fecha) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha)
  if (!m) return null
  return { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) }
}

export function diasEnMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate()
}

/** 0 = lunes … 6 = domingo, para que la semana empiece donde la empieza la gente. */
function diaSemanaLunes(anio: number, mes: number, dia: number): number {
  return (new Date(anio, mes - 1, dia).getDay() + 6) % 7
}

export interface Celda {
  fecha: string | null   // null = relleno antes del 1 o después del último
  dia: number
  finDeSemana: boolean
  hoy: boolean
}

/** La rejilla del mes, de lunes a domingo, con relleno en los extremos. */
export function rejillaMes(anio: number, mes: number): Celda[] {
  const n = diasEnMes(anio, mes)
  const antes = diaSemanaLunes(anio, mes, 1)
  const ahora = new Date()
  const celdas: Celda[] = []

  for (let i = 0; i < antes; i++) celdas.push({ fecha: null, dia: 0, finDeSemana: false, hoy: false })
  for (let d = 1; d <= n; d++) {
    const sem = diaSemanaLunes(anio, mes, d)
    celdas.push({
      fecha: aTexto(anio, mes, d),
      dia: d,
      finDeSemana: sem >= 5,
      hoy: ahora.getFullYear() === anio && ahora.getMonth() + 1 === mes && ahora.getDate() === d,
    })
  }
  while (celdas.length % 7 !== 0) celdas.push({ fecha: null, dia: 0, finDeSemana: false, hoy: false })
  return celdas
}

/** '12 de nov' — como se lee en un aviso, no como se guarda. */
export function enPalabras(fecha: string | null): string {
  const p = partes(fecha)
  return p ? `${p.dia} de ${MESES_CORTOS[p.mes - 1]}` : ''
}

export const PASO_MESES: Record<string, number> = {
  once: 0, monthly: 1, quarterly: 3, biannual: 6, annual: 12,
}

export interface Ocurrencia { month: number; scheduled_date: string | null }

/**
 * Las sesiones que genera una periodicidad dentro del año del plan.
 *
 * Siempre incluye la primera. Mantiene el mismo día del mes y lo recorta al
 * último día cuando el mes es más corto -un 31 de enero mensual cae el 28 ó 29
 * de febrero, no se salta el mes-.
 */
export function ocurrencias(
  anioPlan: number,
  mes: number,
  fecha: string | null,
  periodicidad: string,
): Ocurrencia[] {
  const paso = PASO_MESES[periodicidad] ?? 0
  const primera: Ocurrencia = { month: mes, scheduled_date: fecha || null }
  if (paso <= 0) return [primera]

  const diaBase = partes(fecha)?.dia ?? null
  const lista: Ocurrencia[] = [primera]
  for (let m = mes + paso; m <= 12; m += paso) {
    lista.push({
      month: m,
      scheduled_date: diaBase === null
        ? null
        : aTexto(anioPlan, m, Math.min(diaBase, diasEnMes(anioPlan, m))),
    })
  }
  return lista
}

/** Las horas de un 'duration' como '8h', '1.5 h', '45 min'. */
export function horas(duracion: string | null): number {
  if (!duracion) return 0
  const n = parseFloat(duracion.replace(',', '.'))
  if (!isFinite(n)) return 0
  return /min/i.test(duracion) ? n / 60 : n
}
