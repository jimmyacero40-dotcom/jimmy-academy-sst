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
  | 'anuncio' | 'poster' | 'banner' | 'texto' | 'separador'
  | 'alerta' | 'contador' | 'pausa' | 'epp'
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
  /** Cuántas columnas ocupa en la rejilla de tres, si no se dice otra cosa. */
  ancho: 1 | 2 | 3
  /** El administrador puede elegir cuánto ocupa. */
  anchoLibre?: boolean
  /** Campos que el administrador llena, además de título y texto. */
  campos: string[]
}

export const TIPOS: TipoMeta[] = [
  {
    id: 'anuncio', nombre: 'Anuncio principal', ancho: 2, automatica: false, anchoLibre: true,
    ayuda: 'La tarjeta grande de arriba. Para lo más importante de la semana.',
    campos: ['destacado', 'cta', 'imagen'],
  },
  {
    id: 'poster', nombre: 'Póster', ancho: 1, automatica: false, anchoLibre: true,
    ayuda: 'La imagen y nada más: una cartelera, una infografía, una foto de campaña.',
    campos: ['imagen', 'cta'],
  },
  {
    id: 'banner', nombre: 'Banner', ancho: 3, automatica: false, anchoLibre: true,
    ayuda: 'Una franja de imagen sin caja ni marco. Para logos y cabeceras.',
    campos: ['imagen', 'cta'],
  },
  {
    id: 'texto', nombre: 'Bloque de texto', ancho: 1, automatica: false, anchoLibre: true,
    ayuda: 'Solo palabras: un mensaje destacado, una frase, un recordatorio.',
    campos: ['imagen'],
  },
  {
    id: 'separador', nombre: 'Separador', ancho: 3, automatica: false, anchoLibre: true,
    ayuda: 'Una línea con título, o un espacio en blanco, para dividir el tablero en secciones.',
    campos: [],
  },
  {
    id: 'contador', nombre: 'Días sin accidentes', ancho: 1, automatica: false,
    ayuda: 'Usted pone la fecha del último accidente y la meta. Los días se cuentan solos.',
    campos: ['desde_contador', 'meta'],
  },
  {
    id: 'alerta', nombre: 'Alerta', ancho: 1, automatica: false,
    ayuda: 'Un aviso con fecha de vencimiento: helada, lluvia, vía cerrada.',
    campos: ['imagen'],
  },
  {
    id: 'capacitaciones', nombre: 'Próximas capacitaciones', ancho: 1, automatica: true,
    ayuda: 'Sale del Plan Anual. No hay que escribir nada.',
    campos: [],
  },
  {
    id: 'pausa', nombre: 'Pausa activa', ancho: 1, automatica: false,
    ayuda: 'La hora y el ejercicio del día.',
    campos: ['hora', 'imagen'],
  },
  {
    id: 'formacion', nombre: 'Mi formación', ancho: 1, automatica: true,
    ayuda: 'Lo que cada quien tiene pendiente en SSTudio. Cada uno ve lo suyo.',
    campos: [],
  },
  {
    id: 'reconocimiento', nombre: 'Reconocimiento', ancho: 1, automatica: false,
    ayuda: 'A quién se le reconoce algo bien hecho este mes. Queda mejor con la foto.',
    campos: ['imagen'],
  },
  {
    id: 'epp', nombre: 'EPP de hoy', ancho: 1, automatica: false,
    ayuda: 'Los elementos de protección que toca usar en la labor del día.',
    campos: ['items', 'imagen'],
  },
  {
    id: 'copasst', nombre: 'COPASST', ancho: 3, automatica: false, anchoLibre: true,
    ayuda: 'Franja ancha para la próxima reunión del comité.',
    campos: ['cta', 'imagen'],
  },
  {
    id: 'nota', nombre: 'Nota libre', ancho: 1, automatica: false, anchoLibre: true,
    ayuda: 'Un título, un texto y una imagen si quiere. Para lo que no encaje en los demás.',
    campos: ['imagen'],
  },
]

export const TIPO = (id: string) =>
  TIPOS.find(t => t.id === id) ?? TIPOS[TIPOS.length - 1]

// ── Cómo se muestra la imagen ──────────────────────────────────────────────

export type Ajuste = 'completa' | 'recortada'
export type Alto = 'auto' | 'baja' | 'media' | 'alta'

export const ALTOS: { id: Alto; nombre: string; px: number | null }[] = [
  { id: 'auto',  nombre: 'La imagen manda', px: null },
  { id: 'baja',  nombre: 'Baja',   px: 150 },
  { id: 'media', nombre: 'Media',  px: 230 },
  { id: 'alta',  nombre: 'Alta',   px: 330 },
]

export const AJUSTES: { id: Ajuste; nombre: string; ayuda: string }[] = [
  { id: 'completa',  nombre: 'Completa',  ayuda: 'Se ve toda. Lo que sobre se rellena.' },
  { id: 'recortada', nombre: 'Recortada', ayuda: 'Llena la caja. Puede cortar los bordes.' },
]

/**
 * Por omisión la imagen se ve entera y con la altura que ella misma pida.
 *
 * Antes iba siempre recortada a una banda fija, y una tira de pictogramas
 * quedaba partida por la mitad: se veía medio dibujo y medio texto. Recortar
 * solo tiene sentido cuando la imagen es fondo, y eso lo sabe quien la sube,
 * no el tipo de tarjeta.
 */
export function ajusteDe(t: Pick<Tarjeta, 'datos'>): Ajuste {
  return t.datos?.ajuste === 'recortada' ? 'recortada' : 'completa'
}

export const ALTO_MINIMO = 80
export const ALTO_MAXIMO = 900

/**
 * Qué tan alta se dibuja la imagen, en píxeles. `null` significa que manda la
 * imagen y la tarjeta crece lo que haga falta.
 *
 * `altoPx` gana sobre el preajuste: es lo que queda cuando se estira la imagen
 * con el mouse desde el tablero, y sería raro que arrastrar no mandara sobre
 * una lista de tres opciones.
 */
export function altoDe(t: Pick<Tarjeta, 'datos'>): number | null {
  const suelto = Number(t.datos?.altoPx)
  if (Number.isFinite(suelto) && suelto > 0) {
    return Math.min(ALTO_MAXIMO, Math.max(ALTO_MINIMO, Math.round(suelto)))
  }
  const encontrado = ALTOS.find(a => a.id === t.datos?.alto)
  // Recortar sin una altura fija no significa nada: no habría de dónde recortar.
  if (!encontrado || encontrado.px === null) {
    return ajusteDe(t) === 'recortada' ? 230 : null
  }
  return encontrado.px
}

/**
 * Cuántas columnas ocupa una tarjeta en el tablero.
 *
 * Cada tipo trae un ancho de fábrica, y los que lo permiten dejan que el
 * administrador lo cambie: un póster vertical pide una columna, uno horizontal
 * pide tres, y el tipo de tarjeta no alcanza a saber cuál subieron.
 */
export function anchoDe(t: Pick<Tarjeta, 'tipo' | 'datos'>): 1 | 2 | 3 {
  const meta = TIPO(t.tipo)
  if (!meta.anchoLibre) return meta.ancho
  const elegido = Number(t.datos?.ancho)
  return elegido === 1 || elegido === 2 || elegido === 3 ? elegido : meta.ancho
}

export const TIPOS_AUTOMATICOS = new Set(TIPOS.filter(t => t.automatica).map(t => t.id))

// ── Composición de la tarjeta ──────────────────────────────────────────────

/**
 * Las piezas sueltas de una tarjeta y en qué orden van.
 *
 * Hasta ahora el diseño de cada tarjeta estaba cosido en el código: la imagen
 * siempre arriba, el título siempre después. Eso alcanza para publicar, no
 * para diseñar. Guardar el orden como dato deja mover cada pieza sin tocar el
 * programa, y cada tipo de tarjeta solo tiene que decir qué piezas tiene.
 */
export type Pieza = 'imagen' | 'etiqueta' | 'titulo' | 'texto' | 'iconos' | 'boton'

export const PIEZAS: Record<Pieza, string> = {
  imagen:   'Imagen',
  etiqueta: 'Etiqueta',
  titulo:   'Título',
  texto:    'Descripción',
  iconos:   'Pictogramas',
  boton:    'Botón',
}

const ORDEN_POR_DEFECTO: Pieza[] = ['imagen', 'etiqueta', 'titulo', 'texto', 'iconos', 'boton']

/**
 * El orden guardado, completado con lo que falte.
 *
 * Se vuelve a agregar cualquier pieza que no esté en la lista: si mañana se
 * añade una pieza nueva, las tarjetas de hoy la muestran al final en vez de
 * perderla por no estar nombrada.
 */
export function ordenDe(t: Pick<Tarjeta, 'datos'>): Pieza[] {
  const guardado: Pieza[] = Array.isArray(t.datos?.orden)
    ? t.datos.orden.filter((p: any) => p in PIEZAS)
    : []
  const faltan = ORDEN_POR_DEFECTO.filter(p => !guardado.includes(p))
  return [...guardado, ...faltan]
}

export type Alineacion = 'izquierda' | 'centro' | 'derecha'

export const alineacionDe = (t: Pick<Tarjeta, 'datos'>): Alineacion =>
  t.datos?.alineacion === 'centro' || t.datos?.alineacion === 'derecha'
    ? t.datos.alineacion : 'izquierda'

/** Texto encima de la imagen, en vez de debajo. */
export const superpuestoDe = (t: Pick<Tarjeta, 'datos'>): boolean => !!t.datos?.superpuesto

export type Tamano = 'chico' | 'normal' | 'grande' | 'enorme'

export const TAMANOS: { id: Tamano; nombre: string; titulo: string; texto: string }[] = [
  { id: 'chico',  nombre: 'Chico',  titulo: 'clamp(17px, 1.6vw, 21px)', texto: '13px' },
  { id: 'normal', nombre: 'Normal', titulo: 'clamp(22px, 2.6vw, 32px)', texto: '15px' },
  { id: 'grande', nombre: 'Grande', titulo: 'clamp(28px, 3.4vw, 42px)', texto: '17px' },
  { id: 'enorme', nombre: 'Enorme', titulo: 'clamp(34px, 4.6vw, 58px)', texto: '19px' },
]

export const tamanoDe = (t: Pick<Tarjeta, 'datos'>) =>
  TAMANOS.find(x => x.id === t.datos?.tamano) ?? TAMANOS[1]

export type Aire = 'pegado' | 'normal' | 'suelto' | 'amplio'

export const AIRES: { id: Aire; nombre: string; px: number }[] = [
  { id: 'pegado', nombre: 'Pegado', px: 12 },
  { id: 'normal', nombre: 'Normal', px: 20 },
  { id: 'suelto', nombre: 'Suelto', px: 32 },
  { id: 'amplio', nombre: 'Amplio', px: 48 },
]

/** Cuánto aire lleva la tarjeta por dentro. */
export const aireDe = (t: Pick<Tarjeta, 'datos'>) =>
  (AIRES.find(a => a.id === t.datos?.aire) ?? AIRES[1]).px

// ── Pictogramas ────────────────────────────────────────────────────────────

/**
 * Señales que se pueden colgar en cualquier tarjeta, en una fila bajo el texto.
 *
 * Son los nombres de los iconos de la librería que ya usa toda la plataforma;
 * aquí solo se escoge cuáles tienen sentido en SST y cómo se llaman en
 * español, para que el administrador no tenga que buscar entre dos mil.
 */
export const PICTOGRAMAS: { id: string; nombre: string }[] = [
  { id: 'HardHat',        nombre: 'Casco' },
  { id: 'Glasses',        nombre: 'Gafas' },
  { id: 'Hand',           nombre: 'Guantes' },
  { id: 'Footprints',     nombre: 'Botas' },
  { id: 'Ear',            nombre: 'Oídos' },
  { id: 'Wind',           nombre: 'Respirador' },
  { id: 'Shirt',          nombre: 'Chaleco' },
  { id: 'Anchor',         nombre: 'Arnés' },
  { id: 'AlertTriangle',  nombre: 'Peligro' },
  { id: 'Flame',          nombre: 'Fuego' },
  { id: 'Zap',            nombre: 'Eléctrico' },
  { id: 'Biohazard',      nombre: 'Biológico' },
  { id: 'FlaskConical',   nombre: 'Químico' },
  { id: 'Volume2',        nombre: 'Ruido' },
  { id: 'Sun',            nombre: 'Sol' },
  { id: 'Droplets',       nombre: 'Agua' },
  { id: 'Truck',          nombre: 'Vehículos' },
  { id: 'Ban',            nombre: 'Prohibido' },
  { id: 'HeartPulse',     nombre: 'Salud' },
  { id: 'Stethoscope',    nombre: 'Médico' },
  { id: 'Siren',          nombre: 'Emergencia' },
  { id: 'DoorOpen',       nombre: 'Evacuación' },
  { id: 'Phone',          nombre: 'Teléfono' },
  { id: 'Users',          nombre: 'Personas' },
  { id: 'GraduationCap',  nombre: 'Formación' },
  { id: 'Recycle',        nombre: 'Ambiental' },
  { id: 'Leaf',           nombre: 'Campo' },
  { id: 'ShieldCheck',    nombre: 'Protección' },
]

export const pictogramasDe = (t: Pick<Tarjeta, 'datos'>): string[] =>
  Array.isArray(t.datos?.iconos) ? t.datos.iconos.filter((i: any) => typeof i === 'string') : []

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
