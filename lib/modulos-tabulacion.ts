// ─── Tabulación de un módulo ──────────────────────────────────────────
// Una sola cuenta para la pantalla de resumen y para el Excel.
//
// La regla, la misma de la identificación de peligros: en una pregunta de
// escoger varias el denominador son los TRABAJADORES que respondieron, no las
// marcas. Si respondieron 50 y 20 marcaron "el transporte", son 20
// trabajadores y 40 %, aunque entre todos hayan marcado 300 opciones.
// ──────────────────────────────────────────────────────────────────────

import { comoTexto, type Pregunta } from './modulos'

export interface FilaModulo {
  user_id: string
  nombre: string
  cedula: string
  cargo: string | null
  area: string | null
  centro_trabajo: string | null
  estado: string
  enviado_at: string | null
  respuestas: Record<string, any> | null
}

export interface Conteo { etiqueta: string; n: number; pct: number }

export interface ResumenPregunta {
  pregunta: Pregunta
  /** Cuántos la respondieron, de los que enviaron el módulo. */
  respondieron: number
  /** Para las de escoger, sí/no y escala. */
  conteos: Conteo[]
  /** Para las abiertas: lo que escribieron, sin repetir vacíos. */
  textos: { nombre: string; texto: string }[]
  /** Solo en las de 1 a 5. */
  promedio: number | null
}

export interface ResumenModulo {
  total: number
  respondieron: number
  pendientes: number
  pct: number
  porArea: Conteo[]
  porCentro: Conteo[]
  porCargo: Conteo[]
  preguntas: ResumenPregunta[]
}

const pctDe = (n: number, base: number) => (base ? Math.round((n / base) * 1000) / 10 : 0)

function agrupar(filas: FilaModulo[], campo: keyof FilaModulo, base: number): Conteo[] {
  const m = new Map<string, number>()
  for (const f of filas) {
    const k = ((f[campo] as string | null)?.trim() || 'Sin asignar')
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()]
    .map(([etiqueta, n]) => ({ etiqueta, n, pct: pctDe(n, base) }))
    .sort((a, b) => b.n - a.n || a.etiqueta.localeCompare(b.etiqueta, 'es'))
}

export function tabular(filas: FilaModulo[], preguntas: Pregunta[]): ResumenModulo {
  const contestaron = filas.filter(f => f.respuestas)
  const base = contestaron.length

  const resumenPregunta = (p: Pregunta): ResumenPregunta => {
    const conteos: Conteo[] = []
    const textos: { nombre: string; texto: string }[] = []
    let respondieron = 0
    let suma = 0

    if (p.tipo === 'opcion' || p.tipo === 'multiple') {
      const m = new Map<string, number>(p.opciones.map(o => [o, 0]))
      for (const f of contestaron) {
        const v = f.respuestas![p.id]
        const marcadas = Array.isArray(v) ? v : v ? [v] : []
        if (marcadas.length) respondieron++
        for (const o of marcadas) m.set(String(o), (m.get(String(o)) ?? 0) + 1)
      }
      conteos.push(...[...m.entries()]
        .map(([etiqueta, n]) => ({ etiqueta, n, pct: pctDe(n, base) }))
        .sort((a, b) => b.n - a.n))
    } else if (p.tipo === 'si_no') {
      const m = new Map<string, number>([['Sí', 0], ['No', 0]])
      for (const f of contestaron) {
        const v = f.respuestas![p.id]
        if (v === undefined || v === null || v === '') continue
        respondieron++
        const k = v === true || v === 'si' ? 'Sí' : 'No'
        m.set(k, (m.get(k) ?? 0) + 1)
      }
      conteos.push(...[...m.entries()].map(([etiqueta, n]) => ({ etiqueta, n, pct: pctDe(n, base) })))
    } else if (p.tipo === 'escala') {
      const m = new Map<string, number>([1, 2, 3, 4, 5].map(n => [String(n), 0]))
      for (const f of contestaron) {
        const v = Number(f.respuestas![p.id])
        if (!Number.isFinite(v) || v < 1 || v > 5) continue
        respondieron++; suma += v
        m.set(String(v), (m.get(String(v)) ?? 0) + 1)
      }
      conteos.push(...[...m.entries()].map(([etiqueta, n]) => ({ etiqueta, n, pct: pctDe(n, base) })))
    } else {
      for (const f of contestaron) {
        const texto = comoTexto(p, f.respuestas![p.id]).trim()
        if (!texto) continue
        respondieron++
        textos.push({ nombre: f.nombre, texto })
      }
    }

    return {
      pregunta: p,
      respondieron,
      conteos,
      textos,
      promedio: p.tipo === 'escala' && respondieron
        ? Math.round((suma / respondieron) * 10) / 10
        : null,
    }
  }

  return {
    total: filas.length,
    respondieron: base,
    pendientes: filas.length - base,
    pct: pctDe(base, filas.length),
    porArea:   agrupar(contestaron, 'area', base),
    porCentro: agrupar(contestaron, 'centro_trabajo', base),
    porCargo:  agrupar(contestaron, 'cargo', base),
    preguntas: preguntas.map(resumenPregunta),
  }
}
