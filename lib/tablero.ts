/**
 * El tablero de inicio: qué tarjetas existen y quién ve cada una.
 *
 * Todo lo que se publica en la cartelera es una tarjeta. Las que llena el
 * administrador y las que se calculan solas comparten tabla y comparten reglas
 * de visibilidad; lo único que cambia es de dónde sale el contenido.
 *
 * Este archivo es el que manda: la pantalla del trabajador, la del
 * administrador y el API leen el catálogo de aquí para no describir los mismos
 * campos en tres sitios y que se desincronicen.
 */

export type TipoTarjeta =
  | 'anuncio' | 'alerta' | 'contador' | 'pausa' | 'epp'
  | 'reconocimiento' | 'copasst' | 'nota'
  | 'capacitaciones' | 'formacion'

export interface Tarjeta {
  id: string
  company_id: string
  tipo: TipoTarjeta
  titulo: string | null
  texto: string | null
  destacado: string | null
  cta_texto: string | null
  cta_url: string | null
  color: ColorTarjeta
  imagen_url: string | null
  datos: Record<string, any>
  orden: number
  activa: boolean
  desde: string | null
  hasta: string | null
  audiencia: Audiencia
  created_at?: string
  updated_at?: string
}

export type Audiencia =
  | { todos: true }
  | { todos?: false; centros?: string[]; areas?: string[] }

// ── Colores ────────────────────────────────────────────────────────────────
// Cinco y no más. Cada uno dice algo: el rojo es alerta, el ámbar es "ponga
// cuidado", el verde es que vamos bien. Si se vuelven decorativos dejan de
// avisar, y un tablero donde todo grita no avisa de nada.

export type ColorTarjeta = 'cian' | 'ambar' | 'rojo' | 'verde' | 'azul'

export const COLORES: Record<ColorTarjeta, {
  nombre: string
  fuerte: string      // el color plano, para la franja y el texto de acento
  suave: string       // fondo de la tarjeta
  borde: string
  degradado: string   // para el anuncio grande, donde el texto va en blanco
  sobreOscuro: string // acento legible sobre el degradado
}> = {
  cian: {
    nombre: 'Cian · informativo',
    fuerte: '#0891B2', suave: 'rgba(6,182,212,0.08)', borde: 'rgba(6,182,212,0.22)',
    degradado: 'linear-gradient(135deg, #0B2B52 0%, #0E4A6E 55%, #0891B2 100%)',
    sobreOscuro: '#67E8F9',
  },
  azul: {
    nombre: 'Azul · institucional',
    fuerte: '#2563EB', suave: 'rgba(37,99,235,0.08)', borde: 'rgba(37,99,235,0.22)',
    degradado: 'linear-gradient(135deg, #0B1736 0%, #16306B 60%, #2563EB 100%)',
    sobreOscuro: '#93C5FD',
  },
  verde: {
    nombre: 'Verde · logro',
    fuerte: '#059669', suave: 'rgba(16,185,129,0.09)', borde: 'rgba(16,185,129,0.24)',
    degradado: 'linear-gradient(135deg, #072E26 0%, #0C5B45 55%, #10B981 100%)',
    sobreOscuro: '#6EE7B7',
  },
  ambar: {
    nombre: 'Ámbar · atención',
    fuerte: '#B45309', suave: 'rgba(245,158,11,0.11)', borde: 'rgba(245,158,11,0.28)',
    degradado: 'linear-gradient(135deg, #3B2206 0%, #7C4A0B 55%, #F59E0B 100%)',
    sobreOscuro: '#FCD34D',
  },
  rojo: {
    nombre: 'Rojo · alerta',
    fuerte: '#DC2626', suave: 'rgba(239,68,68,0.09)', borde: 'rgba(239,68,68,0.24)',
    degradado: 'linear-gradient(135deg, #3B0A0A 0%, #8C1414 55%, #EF4444 100%)',
    sobreOscuro: '#FCA5A5',
  },
}

export const COLOR = (c?: string | null) => COLORES[(c as ColorTarjeta)] ?? COLORES.cian

// ── Catálogo de tipos ──────────────────────────────────────────────────────

export interface TipoMeta {
  id: TipoTarjeta
  nombre: string
  ayuda: string
  /** Se calcula sola; el administrador solo la prende, la apaga y la ordena. */
  automatica: boolean
  /** Cuántas columnas ocupa en la rejilla de tres. */
  ancho: 1 | 2 | 3
  /** Campos que el administrador llena, además de título y texto. */
  campos: string[]
}

export const TIPOS: TipoMeta[] = [
  {
    id: 'anuncio', nombre: 'Anuncio principal', ancho: 2, automatica: false,
    ayuda: 'La tarjeta grande de arriba. Para lo más importante de la semana.',
    campos: ['destacado', 'cta', 'imagen'],
  },
  {
    id: 'contador', nombre: 'Días sin accidentes', ancho: 1, automatica: false,
    ayuda: 'Usted pone la fecha del último accidente y la meta. Los días se cuentan solos.',
    campos: ['desde_contador', 'meta'],
  },
  {
    id: 'alerta', nombre: 'Alerta', ancho: 1, automatica: false,
    ayuda: 'Un aviso con fecha de vencimiento: helada, lluvia, vía cerrada.',
    campos: [],
  },
  {
    id: 'capacitaciones', nombre: 'Próximas capacitaciones', ancho: 1, automatica: true,
    ayuda: 'Sale del Plan Anual. No hay que escribir nada.',
    campos: [],
  },
  {
    id: 'pausa', nombre: 'Pausa activa', ancho: 1, automatica: false,
    ayuda: 'La hora y el ejercicio del día.',
    campos: ['hora'],
  },
  {
    id: 'formacion', nombre: 'Mi formación', ancho: 1, automatica: true,
    ayuda: 'Lo que cada quien tiene pendiente en SSTudio. Cada uno ve lo suyo.',
    campos: [],
  },
  {
    id: 'reconocimiento', nombre: 'Reconocimiento', ancho: 1, automatica: false,
    ayuda: 'A quién se le reconoce algo bien hecho este mes.',
    campos: [],
  },
  {
    id: 'epp', nombre: 'EPP de hoy', ancho: 1, automatica: false,
    ayuda: 'Los elementos de protección que toca usar en la labor del día.',
    campos: ['items'],
  },
  {
    id: 'copasst', nombre: 'COPASST', ancho: 3, automatica: false,
    ayuda: 'Franja ancha para la próxima reunión del comité.',
    campos: ['cta'],
  },
  {
    id: 'nota', nombre: 'Nota libre', ancho: 1, automatica: false,
    ayuda: 'Un título y un texto. Para lo que no encaje en los demás.',
    campos: [],
  },
]

export const TIPO = (id: string) =>
  TIPOS.find(t => t.id === id) ?? TIPOS[TIPOS.length - 1]

export const TIPOS_AUTOMATICOS = new Set(TIPOS.filter(t => t.automatica).map(t => t.id))

// ── Visibilidad ────────────────────────────────────────────────────────────

export interface Persona {
  centro?: string | null   // worker_profiles.centro_trabajo — PAIPA, DUITAMA, MULTISEDE
  area?: string | null     // users.area
}

/**
 * Quien trabaja en varias sedes ve lo de todas. Es lo contrario de lo que haría
 * una coincidencia exacta de texto, que lo dejaría sin ver ni lo de Paipa ni lo
 * de Duitama justamente por estar en las dos.
 */
const MULTISEDE = 'MULTISEDE'

const norm = (v?: string | null) => (v ?? '').trim().toUpperCase()

export function dirigidaA(audiencia: Audiencia | null | undefined, persona: Persona): boolean {
  const a = audiencia ?? { todos: true }
  if ((a as any).todos) return true

  const centros = ((a as any).centros ?? []).map(norm).filter(Boolean)
  const areas = ((a as any).areas ?? []).map(norm).filter(Boolean)

  // Sin ningún filtro marcado la tarjeta no es de nadie en particular: se trata
  // como dirigida a todos, para que un descuido al editar no la haga invisible.
  if (!centros.length && !areas.length) return true

  const miCentro = norm(persona.centro)
  const miArea = norm(persona.area)

  if (centros.length && (centros.includes(miCentro) || miCentro === MULTISEDE)) return true
  if (areas.length && areas.includes(miArea)) return true
  return false
}

export function enVentana(t: Pick<Tarjeta, 'desde' | 'hasta'>, ahora = new Date()): boolean {
  if (t.desde && new Date(t.desde).getTime() > ahora.getTime()) return false
  if (t.hasta && new Date(t.hasta).getTime() < ahora.getTime()) return false
  return true
}

export function visibleParaTrabajador(t: Tarjeta, persona: Persona, ahora = new Date()): boolean {
  return t.activa && enVentana(t, ahora) && dirigidaA(t.audiencia, persona)
}

/** Estado legible para la pantalla del administrador. */
export function estadoDe(t: Tarjeta, ahora = new Date()): 'apagada' | 'programada' | 'vencida' | 'publicada' {
  if (!t.activa) return 'apagada'
  if (t.desde && new Date(t.desde).getTime() > ahora.getTime()) return 'programada'
  if (t.hasta && new Date(t.hasta).getTime() < ahora.getTime()) return 'vencida'
  return 'publicada'
}

// ── Contador de días ───────────────────────────────────────────────────────

/**
 * Días cumplidos desde la fecha, contando por día de calendario y no por
 * múltiplos de 24 horas: si el último accidente fue ayer a las 11 de la noche,
 * hoy es 1 día, no 0.
 */
export function diasDesde(fecha?: string | null, ahora = new Date()): number | null {
  if (!fecha) return null
  const [y, m, d] = String(fecha).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const inicio = new Date(y, m - 1, d)
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const dias = Math.round((hoy.getTime() - inicio.getTime()) / 86400000)
  return dias >= 0 ? dias : null
}
