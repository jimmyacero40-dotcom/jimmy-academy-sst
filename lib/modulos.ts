// ─── Módulos de participación ─────────────────────────────────────────
// La definición que comparten el armador del administrador, el formulario
// del trabajador y la exportación. Si se agrega un tipo de pregunta, se
// agrega aquí y las tres pantallas lo entienden.
// ──────────────────────────────────────────────────────────────────────

export type TipoPregunta =
  | 'texto' | 'parrafo' | 'opcion' | 'multiple'
  | 'si_no' | 'numero' | 'fecha' | 'escala' | 'confirmacion'

export interface Pregunta {
  id: string
  orden: number
  titulo: string
  ayuda?: string | null
  tipo: TipoPregunta
  opciones: string[]
  obligatoria: boolean
  placeholder?: string | null
}

export interface Modulo {
  id: string
  nombre: string
  descripcion: string | null
  color: string
  periodo: number
  estado: 'borrador' | 'abierto' | 'cerrado'
  dirigido_a: 'todos' | 'area' | 'cargo' | 'finca'
  dirigido_valor: string | null
  motivo_cierre: string | null
  creado_por_nombre: string | null
  estado_cambiado_at: string | null
  estado_cambiado_por_nombre: string | null
  created_at: string
}

export interface Respuesta {
  id?: string
  modulo_id?: string
  user_id?: string
  estado: 'borrador' | 'enviado'
  respuestas: Record<string, any>
  trabajador_nombre?: string | null
  trabajador_cedula?: string | null
  cargo?: string | null
  area?: string | null
  centro_trabajo?: string | null
  enviado_at?: string | null
}

/** Los tipos de pregunta, como se le ofrecen a quien arma el módulo. */
export const TIPOS: { id: TipoPregunta; nombre: string; ayuda: string; conOpciones?: boolean }[] = [
  { id: 'parrafo',      nombre: 'Respuesta larga',  ayuda: 'Para que cuente algo con sus palabras' },
  { id: 'texto',        nombre: 'Respuesta corta',  ayuda: 'Una línea: un nombre, un lugar' },
  { id: 'opcion',       nombre: 'Escoger una',      ayuda: 'Una sola de la lista', conOpciones: true },
  { id: 'multiple',     nombre: 'Escoger varias',   ayuda: 'Las que quiera de la lista', conOpciones: true },
  { id: 'si_no',        nombre: 'Sí o no',          ayuda: 'Dos respuestas y ya' },
  { id: 'escala',       nombre: 'De 1 a 5',         ayuda: 'Para calificar algo' },
  { id: 'numero',       nombre: 'Un número',        ayuda: 'Cantidades, años, veces' },
  { id: 'fecha',        nombre: 'Una fecha',        ayuda: 'Día, mes y año' },
  { id: 'confirmacion', nombre: 'Confirmación',     ayuda: 'La casilla de "confirmo que esto es mío y es verdad"' },
]

export const NOMBRE_TIPO: Record<TipoPregunta, string> =
  Object.fromEntries(TIPOS.map(t => [t.id, t.nombre])) as Record<TipoPregunta, string>

export const usaOpciones = (t: TipoPregunta) => t === 'opcion' || t === 'multiple'

export const ESTADO_MODULO: Record<string, { nombre: string; color: string }> = {
  borrador: { nombre: 'Borrador', color: '#6B7280' },
  abierto:  { nombre: 'Abierto',  color: '#10B981' },
  cerrado:  { nombre: 'Cerrado',  color: '#EF4444' },
}

/** ¿Esta respuesta cuenta como dada? Vale el 0 y vale el "no". */
export function respondida(p: Pregunta, valor: any): boolean {
  if (p.tipo === 'confirmacion') return valor === true
  if (p.tipo === 'multiple') return Array.isArray(valor) && valor.length > 0
  if (p.tipo === 'numero' || p.tipo === 'escala') return valor !== null && valor !== undefined && valor !== ''
  if (p.tipo === 'si_no') return valor === true || valor === false || valor === 'si' || valor === 'no'
  return typeof valor === 'string' ? valor.trim() !== '' : valor !== null && valor !== undefined
}

export function estaCompleta(preguntas: Pregunta[], respuestas: Record<string, any>): boolean {
  return preguntas.every(p => !p.obligatoria || respondida(p, respuestas[p.id]))
}

export function avance(preguntas: Pregunta[], respuestas: Record<string, any>) {
  const obligatorias = preguntas.filter(p => p.obligatoria)
  const total = obligatorias.length
  const hechas = obligatorias.filter(p => respondida(p, respuestas[p.id])).length
  return { hechas, total, pct: total ? Math.round((hechas / total) * 100) : 0 }
}

/** Cómo se lee una respuesta en una tabla o en el Excel. */
export function comoTexto(p: Pregunta, valor: any): string {
  if (valor === null || valor === undefined || valor === '') return ''
  switch (p.tipo) {
    case 'multiple':     return Array.isArray(valor) ? valor.join(' · ') : String(valor)
    case 'si_no':        return valor === true || valor === 'si' ? 'Sí' : 'No'
    case 'confirmacion': return valor === true ? 'Confirmado' : ''
    case 'fecha':        return new Date(`${valor}T12:00:00`).toLocaleDateString('es-CO')
    default:             return String(valor)
  }
}
