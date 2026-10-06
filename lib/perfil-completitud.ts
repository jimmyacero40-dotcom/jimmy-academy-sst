// ─── Completitud de la ficha sociodemográfica ─────────────────────────
// Una sola definición para la encuesta y para el porcentaje que guarda la
// API. Antes había dos listas parecidas en sitios distintos y cada sección
// se daba por cumplida con uno o dos campos, así que una ficha a medio
// llenar podía marcar 100 %.
//
// Lo que se exige ya no se escribe aquí: se lee de `lib/ficha-campos`, que
// es el catálogo de la encuesta. Así el porcentaje, la ficha que ve el
// responsable de SST y el detalle de lo pendiente salen del mismo sitio y
// no pueden contradecirse.
// ──────────────────────────────────────────────────────────────────────

import { FICHA, type CampoFicha } from './ficha-campos'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ficha = Record<string, any>

/** Una respuesta cuenta si tiene contenido. `false` es una respuesta válida. */
export function lleno(v: any): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.length > 0
  return true
}

/**
 * ¿Hay que pedir este campo? Lo opcional nunca; el detalle condicionado
 * solo cuando se respondió que sí a la pregunta de la que depende.
 */
function seExige(c: CampoFicha, d: Ficha): boolean {
  if (c.opcional) return false
  if (c.soloSi) return d[c.soloSi] === true
  return true
}

/** ¿Está resuelto este campo? El consentimiento solo cuenta si se aceptó. */
function respondido(c: CampoFicha, d: Ficha): boolean {
  return c.debeSerCierto ? d[c.campo] === true : lleno(d[c.campo])
}

/** Los campos que la persona todavía no ha respondido, sección por sección. */
export function faltantes(d: Ficha): { seccion: string; campos: CampoFicha[] }[] {
  const ficha = d ?? {}
  return FICHA
    .map(s => ({ seccion: s.nombre, campos: s.campos.filter(c => seExige(c, ficha) && !respondido(c, ficha)) }))
    .filter(s => s.campos.length > 0)
}

export const TOTAL_SECCIONES = FICHA.length

export function calcSections(d: Ficha): Record<string, boolean> {
  const ficha = d ?? {}
  const r: Record<string, boolean> = {}
  for (const s of FICHA) r[s.nombre] = s.campos.every(c => !seExige(c, ficha) || respondido(c, ficha))
  return r
}

export function calcPct(d: Ficha): number {
  const hechas = Object.values(calcSections(d)).filter(Boolean).length
  return Math.round((hechas / TOTAL_SECCIONES) * 100)
}

/** Un resumen corto para decirle a la persona qué le falta. */
export function resumenFaltantes(d: Ficha, maxSecciones = 3): string {
  const f = faltantes(d)
  if (f.length === 0) return 'Ficha completa'
  const nombres = f.slice(0, maxSecciones).map(s => s.seccion)
  const resto = f.length - nombres.length
  return nombres.join(', ') + (resto > 0 ? ` y ${resto} más` : '')
}
