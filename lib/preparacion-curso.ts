// ─── Qué tan listo está un curso para dictarse ────────────────────────
// Una biblioteca con sesenta cursos no se revisa a ojo. Esto dice, por
// tarjeta, qué le falta a cada uno para poder usarse de verdad.
//
// Son tres revisiones y no cuatro a propósito: la portada se genera de la
// primera diapositiva, así que "sin portada" y "sin material" son siempre lo
// mismo y poner los dos solo ocupaba espacio diciendo dos veces lo mismo.
// ──────────────────────────────────────────────────────────────────────

export type EstadoPreparacion = 'listo' | 'incompleto' | 'borrador'

export interface Revision {
  id: 'material' | 'evaluacion' | 'descripcion'
  nombre: string
  ok: boolean
  /** Qué hacer para arreglarlo. Es lo que sale al pasar el mouse por el ✕. */
  falta: string
}

export interface Preparacion {
  status: EstadoPreparacion
  /** Lo que se muestra en el badge: dice qué falta, no solo que falta. */
  etiqueta: string
  checks: Revision[]
  pendientes: number
}

export interface CursoParaRevisar {
  title?: string | null
  description?: string | null
  slides_count?: number | null
  questions_count?: number | null
  cover_url?: string | null
}

/** Mínimo para que una descripción le diga algo a quien va a recibir el curso. */
const LARGO_MINIMO = 80

/**
 * La descripción que pone el sistema al crear un curso, del estilo
 * "Capacitación SST: Trabajo en alturas". Está ahí para que la tarjeta no
 * salga vacía, no porque alguien la haya escrito.
 */
function esGenerica(descripcion: string, titulo: string): boolean {
  const d = descripcion.trim()
  if (/^capacitaci[oó]n\s+sst\s*[:\-]/i.test(d)) return true
  // "Trabajo en alturas" a secas, repitiendo el título, tampoco es descripción.
  const sinTitulo = d.toLowerCase().replace((titulo ?? '').toLowerCase().trim(), '').trim()
  return sinTitulo.length < 10
}

export function getCourseReadiness(curso: CursoParaRevisar): Preparacion {
  const titulo = curso.title ?? ''
  const descripcion = curso.description ?? ''
  const laminas = curso.slides_count ?? 0
  const preguntas = curso.questions_count ?? 0

  const checks: Revision[] = [
    {
      id: 'material',
      nombre: 'Material',
      ok: laminas > 0,
      falta: 'No tiene diapositivas. Suba el PDF o el PowerPoint del curso.',
    },
    {
      id: 'evaluacion',
      nombre: 'Evaluación',
      ok: preguntas > 0,
      falta: 'No tiene preguntas. Sin evaluación no se puede certificar a nadie.',
    },
    {
      id: 'descripcion',
      nombre: 'Descripción',
      ok: descripcion.trim().length >= LARGO_MINIMO && !esGenerica(descripcion, titulo),
      falta: 'La descripción es la que puso el sistema. Escriba de qué trata el curso.',
    },
  ]

  const faltantes = checks.filter(c => !c.ok)
  const pendientes = faltantes.length

  // Sin material no hay curso, por mucho que lo demás esté: eso es un borrador.
  const status: EstadoPreparacion =
    laminas === 0 || pendientes >= 3 ? 'borrador'
    : pendientes === 0 ? 'listo'
    : 'incompleto'

  // El badge nombra la tarea concreta. Con cincuenta cursos vacíos, un
  // "Borrador" a secas no le dice a nadie qué tiene que hacer.
  const etiqueta =
    status === 'listo' ? 'Listo'
    : pendientes === 1 ? `Falta ${faltantes[0].nombre.toLowerCase()}`
    : laminas === 0 ? 'Sin material'
    : `Faltan ${pendientes}`

  return { status, etiqueta, checks, pendientes }
}

/** Los colores del badge, en la misma gama que el resto de la biblioteca. */
export const COLOR_PREPARACION: Record<EstadoPreparacion, { color: string; fondo: string; borde: string }> = {
  listo:      { color: '#6EE7B7', fondo: 'rgba(16,185,129,0.12)',  borde: 'rgba(16,185,129,0.3)' },
  incompleto: { color: '#FCD34D', fondo: 'rgba(245,158,11,0.12)',  borde: 'rgba(245,158,11,0.3)' },
  borrador:   { color: '#94A3B8', fondo: 'rgba(148,163,184,0.12)', borde: 'rgba(148,163,184,0.3)' },
}

export const NOMBRE_PREPARACION: Record<EstadoPreparacion, string> = {
  listo: 'Listo', incompleto: 'Incompleto', borrador: 'Borrador',
}
