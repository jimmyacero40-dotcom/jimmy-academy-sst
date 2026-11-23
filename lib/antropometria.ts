/**
 * Estatura, peso e índice de masa corporal.
 *
 * La casilla pide centímetros, pero la gente escribe su estatura como la dice:
 * «1,70». Guardado así, el índice salía 200.692 y el promedio de la empresa
 * 32.525 — números que nadie podía creer y que dañaban el tablero entero.
 *
 * Aquí se arregla en un solo lugar, porque el índice se calculaba suelto en
 * cinco: la ficha del trabajador, el tablero, la tabla, el Excel y el PDF. Con
 * la cuenta repetida cinco veces, corregir una no corregía las otras.
 */

/** Más bajo que esto no es una estatura de adulto; más alto tampoco. */
export const ESTATURA_MINIMA_CM = 120
export const ESTATURA_MAXIMA_CM = 230
export const PESO_MINIMO_KG = 30
export const PESO_MAXIMO_KG = 300

/**
 * La estatura en centímetros, venga como venga.
 *
 * Un número menor que 3 es metros («1,70») y se pasa a centímetros. Lo que
 * quede fuera del rango de una persona no se adivina: se devuelve null, que
 * es más honesto que un dato inventado.
 */
export function estaturaEnCm(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  // «1,70» con coma, como se escribe en Colombia.
  const n = typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null

  const cm = n < 3 ? n * 100 : n
  if (cm < ESTATURA_MINIMA_CM || cm > ESTATURA_MAXIMA_CM) return null
  return Math.round(cm * 10) / 10
}

/** El peso en kilos, si es un peso posible. */
export function pesoEnKg(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const n = typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.'))
  if (!Number.isFinite(n)) return null
  if (n < PESO_MINIMO_KG || n > PESO_MAXIMO_KG) return null
  return Math.round(n * 10) / 10
}

/**
 * El índice de masa corporal, o null si los datos no dan para calcularlo.
 *
 * Nunca devuelve un número imposible: antes de promediar hay que poder
 * confiar en cada sumando.
 */
export function imc(
  estatura: number | string | null | undefined,
  peso: number | string | null | undefined,
): number | null {
  const cm = estaturaEnCm(estatura)
  const kg = pesoEnKg(peso)
  if (!cm || !kg) return null
  const valor = kg / ((cm / 100) ** 2)
  if (!Number.isFinite(valor) || valor < 10 || valor > 80) return null
  return Math.round(valor * 10) / 10
}

/** Cómo se lee ese índice, con el color con que se muestra. */
export function clasificarImc(valor: number | null): { texto: string; color: string } | null {
  if (valor === null) return null
  if (valor < 18.5) return { texto: 'BAJO PESO', color: '#F59E0B' }
  if (valor < 25) return { texto: 'PESO NORMAL', color: '#10B981' }
  if (valor < 30) return { texto: 'SOBREPESO', color: '#F59E0B' }
  return { texto: 'OBESIDAD', color: '#EF4444' }
}
