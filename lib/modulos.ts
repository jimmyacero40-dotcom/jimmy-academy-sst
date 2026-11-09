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
  /**
   * Solo en "sí o no": cuándo pedirle que explique. Un No sin el porqué no
   * sirve para corregir nada. Nulo = no se le pide.
   */
  pedir_porque?: 'siempre' | 'si' | 'no' | null
  /** En las de escoger: agrega "Otro" y, al marcarla, pide que diga cuál. */
  permite_otro?: boolean
}

/**
 * Lo que la persona escribe además de su respuesta -el porqué, o qué es ese
 * "Otro"- se guarda al lado, con una clave derivada de la pregunta. Así lo ya
 * contestado no se toca y la tabulación sigue contando por el valor de antes.
 */
export const clavePorque = (p: Pregunta | string) =>
  `${typeof p === 'string' ? p : p.id}__porque`
export const claveOtro = (p: Pregunta | string) =>
  `${typeof p === 'string' ? p : p.id}__otro`

export const ETIQUETA_OTRO = 'Otro'

/** Las opciones que de verdad se le muestran, con "Otro" si se habilitó. */
export function opcionesVisibles(p: Pregunta): string[] {
  if (!p.permite_otro) return p.opciones
  const yaEsta = p.opciones.some(o => o.trim().toLowerCase() === ETIQUETA_OTRO.toLowerCase())
  return yaEsta ? p.opciones : [...p.opciones, ETIQUETA_OTRO]
}

/** ¿La opción marcada es la de "Otro"? */
export const esOtro = (o: string) => o.trim().toLowerCase() === ETIQUETA_OTRO.toLowerCase()

/** ¿A esta respuesta de sí o no hay que pedirle el porqué? */
export function tocaPorque(p: Pregunta, valor: any): boolean {
  if (p.tipo !== 'si_no' || !p.pedir_porque) return false
  if (p.pedir_porque === 'siempre') return respondida(p, valor)
  const dijoSi = valor === true || valor === 'si'
  return p.pedir_porque === 'si' ? dijoSi : respondida(p, valor) && !dijoSi
}

/** ¿Marcó "Otro" y todavía no ha dicho cuál? */
export function tocaDecirCual(p: Pregunta, valor: any): boolean {
  if (!p.permite_otro || (p.tipo !== 'opcion' && p.tipo !== 'multiple')) return false
  const marcadas = Array.isArray(valor) ? valor : valor ? [valor] : []
  return marcadas.some(o => esOtro(String(o)))
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

/**
 * Lo que falta de una pregunta, contando el porqué y el "cuál" cuando aplican.
 * Devuelve el aviso que se le muestra, o '' si está completa.
 */
export function queFalta(p: Pregunta, respuestas: Record<string, any>): string {
  const valor = respuestas[p.id]
  if (p.obligatoria && !respondida(p, valor)) return 'Esta pregunta es obligatoria.'
  if (tocaPorque(p, valor) && !String(respuestas[clavePorque(p)] ?? '').trim()) {
    return 'Falta que explique por qué.'
  }
  if (tocaDecirCual(p, valor) && !String(respuestas[claveOtro(p)] ?? '').trim()) {
    return 'Marcó "Otro": falta que diga cuál.'
  }
  return ''
}

export function estaCompleta(preguntas: Pregunta[], respuestas: Record<string, any>): boolean {
  return preguntas.every(p => !queFalta(p, respuestas))
}

export function avance(preguntas: Pregunta[], respuestas: Record<string, any>) {
  const obligatorias = preguntas.filter(p => p.obligatoria)
  const total = obligatorias.length
  const hechas = obligatorias.filter(p => respondida(p, respuestas[p.id])).length
  return { hechas, total, pct: total ? Math.round((hechas / total) * 100) : 0 }
}

/**
 * La respuesta entera, con el porqué o el "cuál" pegados. Es lo que va al
 * Excel, al PDF y a la ficha de cada quien: el valor suelto se queda corto.
 */
export function textoCompleto(p: Pregunta, respuestas: Record<string, any>): string {
  const base = comoTexto(p, respuestas?.[p.id])
  const razon = String(respuestas?.[clavePorque(p)] ?? '').trim()
  const cual  = String(respuestas?.[claveOtro(p)] ?? '').trim()
  if (cual && base) return razon ? `${base} (${cual}) — ${razon}` : `${base} (${cual})`
  if (razon && base) return `${base} — ${razon}`
  return base
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
