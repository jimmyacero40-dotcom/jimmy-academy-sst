/**
 * La ventana de una ronda, en cuentas puras: cuántos días dura y hasta
 * cuándo. Vive aparte de `vigencia.ts` porque eso toca la base de datos y
 * esto lo necesita también el formulario, que corre en el navegador.
 */

export const DIAS_POR_DEFECTO = 15

/** Hoy en Colombia, como 'YYYY-MM-DD'. Sin pasar por UTC, que corre el día. */
export function hoy(): string {
  const d = new Date(Date.now() - 5 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

/** Suma días a una fecha 'YYYY-MM-DD' sin que UTC le mueva el día. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number)
  if (!a || !m || !d) return fecha
  const r = new Date(a, m - 1, d + dias)
  return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, '0')}-${String(r.getDate()).padStart(2, '0')}`
}

/**
 * Hasta cuándo queda abierta una ronda.
 * Sin fecha programada no hay de dónde contar, y la ronda no vence.
 */
export function calcularCierre(programada: string | null, dias: number | null): string | null {
  if (!programada) return null
  const n = dias == null ? DIAS_POR_DEFECTO : dias
  if (n <= 0) return null   // 0 o menos = que no se cierre sola
  return sumarDias(programada, n)
}

/** Días enteros entre dos fechas 'YYYY-MM-DD'. */
export function diasEntre(desde: string, hasta: string): number | null {
  const [a1, m1, d1] = desde.split('-').map(Number)
  const [a2, m2, d2] = hasta.split('-').map(Number)
  if (!a1 || !m1 || !d1 || !a2 || !m2 || !d2) return null
  const uno = new Date(a1, m1 - 1, d1), dos = new Date(a2, m2 - 1, d2)
  return Math.round((dos.getTime() - uno.getTime()) / 86400000)
}

/**
 * Cuántos días dura de verdad la ronda.
 *
 * Si nadie guardó el plazo, no se asume el de siempre: se cuenta contra la
 * fecha de cierre que tiene puesta. La inducción decía «se cierra a los 15
 * días» y «queda abierta hasta el 26» mientras su cierre guardado era el 14;
 * se cerró el 15 y nadie entendió por qué. El formulario mostraba una regla
 * y la base guardaba otra.
 */
export function diasReales(item: {
  dias_vigencia?: number | null
  scheduled_date?: string | null
  end_date?: string | null
}): number {
  if (item.dias_vigencia != null) return item.dias_vigencia
  if (item.scheduled_date && item.end_date) {
    const n = diasEntre(item.scheduled_date, item.end_date)
    if (n != null && n >= 0) return n
  }
  return DIAS_POR_DEFECTO
}

/** Una ronda cuenta como vigente mientras no esté cerrada ni cancelada. */
export function estaAbierta(item: { estado?: string | null; end_date?: string | null }): boolean {
  if (item.estado === 'cerrada' || item.estado === 'cancelada') return false
  if (item.end_date && item.end_date < hoy()) return false
  return true
}
