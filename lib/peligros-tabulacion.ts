// ─── Tabulación de las participaciones ────────────────────────────────
// Una sola cuenta para la pantalla de resultados y para el Excel.
//
// La regla que gobierna todo esto: en una pregunta de selección múltiple el
// denominador es el número de TRABAJADORES que participaron, no el número de
// respuestas marcadas. Si 50 participaron y 20 marcaron "ruido", son 20
// trabajadores y 40 %, aunque entre todos hayan marcado 300 opciones.
// ──────────────────────────────────────────────────────────────────────

import { PELIGROS, GRUPO_DE_PELIGRO, GRUPOS_PELIGROS, FRECUENCIAS, SUFICIENCIA_CONTROLES, CAMBIOS_ULTIMO_ANO, type Participacion } from './peligros'

export interface Fila {
  user_id: string
  nombre: string | null
  cedula: string | null
  cargo: string | null
  area: string | null
  centro_trabajo: string | null
  estado: 'Participó' | 'Pendiente'
  enviado_at: string | null
  participacion: Participacion | null
}

export interface Conteo { etiqueta: string; n: number; pct: number; grupo?: string }

/** n = trabajadores; pct = sobre los participantes, nunca sobre las marcas. */
function porParticipantes(n: number, participantes: number): number {
  return participantes ? Math.round((n / participantes) * 1000) / 10 : 0
}

export interface Resumen {
  totalTrabajadores: number
  participantes: number
  pendientes: number
  pctParticipacion: number
  porArea: Conteo[]
  porCentro: Conteo[]
  porCargo: Conteo[]
  peligros: Conteo[]
  porGrupoPeligro: Conteo[]
  frecuencia: Conteo[]
  suficiencia: Conteo[]
  cambios: Conteo[]
  /** Promedio de peligros marcados por participante. */
  promedioPeligros: number
}

/**
 * Cobertura por segmento: cuántos hay y cuántos participaron. Aquí el
 * porcentaje sí es sobre el total del segmento, porque mide participación.
 */
function cobertura(filas: Fila[], campo: keyof Fila): Conteo[] {
  const mapa = new Map<string, { total: number; part: number }>()
  for (const f of filas) {
    const k = (f[campo] as string | null)?.trim() || 'Sin asignar'
    const a = mapa.get(k) ?? { total: 0, part: 0 }
    a.total++
    if (f.estado === 'Participó') a.part++
    mapa.set(k, a)
  }
  return [...mapa.entries()]
    .map(([etiqueta, v]) => ({ etiqueta, n: v.part, pct: v.total ? Math.round((v.part / v.total) * 1000) / 10 : 0, grupo: `${v.part} de ${v.total}` }))
    .sort((a, b) => b.n - a.n || a.etiqueta.localeCompare(b.etiqueta))
}

/** Respuesta de opción única: el denominador sigue siendo los participantes. */
function opcionUnica(parts: Participacion[], campo: keyof Participacion, opciones: string[]): Conteo[] {
  const n = parts.length
  const cuenta = new Map<string, number>()
  for (const p of parts) {
    const v = (p[campo] as string | null)?.trim()
    if (v) cuenta.set(v, (cuenta.get(v) ?? 0) + 1)
  }
  // Se listan las opciones del catálogo en su orden, más las que ya no estén.
  const extras = [...cuenta.keys()].filter(k => !opciones.includes(k))
  return [...opciones, ...extras].map(o => ({ etiqueta: o, n: cuenta.get(o) ?? 0, pct: porParticipantes(cuenta.get(o) ?? 0, n) }))
}

export function tabular(filas: Fila[]): Resumen {
  const participadas = filas.filter(f => f.estado === 'Participó' && f.participacion)
  const parts = participadas.map(f => f.participacion!) as Participacion[]
  const participantes = parts.length

  // Cada trabajador cuenta una sola vez por peligro, aunque venga repetido.
  const porPeligro = new Map<string, number>()
  const porGrupo = new Map<string, number>()
  let marcasTotales = 0

  for (const p of parts) {
    const unicos = [...new Set(p.peligros ?? [])]
    marcasTotales += unicos.length
    const gruposDeEste = new Set<string>()
    for (const x of unicos) {
      porPeligro.set(x, (porPeligro.get(x) ?? 0) + 1)
      const g = GRUPO_DE_PELIGRO[x]
      if (g) gruposDeEste.add(g)
    }
    // Un trabajador cuenta una vez por grupo, no una por cada peligro del grupo.
    for (const g of gruposDeEste) porGrupo.set(g, (porGrupo.get(g) ?? 0) + 1)
  }

  const extras = [...porPeligro.keys()].filter(k => !PELIGROS.includes(k))

  return {
    totalTrabajadores: filas.length,
    participantes,
    pendientes: filas.length - participantes,
    pctParticipacion: filas.length ? Math.round((participantes / filas.length) * 1000) / 10 : 0,

    porArea:   cobertura(filas, 'area'),
    porCentro: cobertura(filas, 'centro_trabajo'),
    porCargo:  cobertura(filas, 'cargo'),

    peligros: [...PELIGROS, ...extras]
      .map(x => ({ etiqueta: x, grupo: GRUPO_DE_PELIGRO[x] ?? 'Otros', n: porPeligro.get(x) ?? 0, pct: porParticipantes(porPeligro.get(x) ?? 0, participantes) }))
      .filter(c => c.n > 0)
      .sort((a, b) => b.n - a.n || a.etiqueta.localeCompare(b.etiqueta)),

    porGrupoPeligro: GRUPOS_PELIGROS
      .map(g => ({ etiqueta: g.grupo, n: porGrupo.get(g.grupo) ?? 0, pct: porParticipantes(porGrupo.get(g.grupo) ?? 0, participantes) }))
      .sort((a, b) => b.n - a.n),

    frecuencia:  opcionUnica(parts, 'frecuencia', FRECUENCIAS),
    suficiencia: opcionUnica(parts, 'controles_suficientes', SUFICIENCIA_CONTROLES),
    cambios:     opcionUnica(parts, 'cambios_ultimo_ano', CAMBIOS_ULTIMO_ANO),

    promedioPeligros: participantes ? Math.round((marcasTotales / participantes) * 10) / 10 : 0,
  }
}
