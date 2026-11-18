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
 * Cómo se llama la tarjeta para quien la administra.
 *
 * No se ve en el tablero. Hace falta porque el título es texto que lee el
 * trabajador, y ponerle «Banner» a un recuadro para reconocerlo en la lista
 * terminaba con la palabra «Banner» escrita en la pantalla de todos.
 */
export const nombreDe = (t: Pick<Tarjeta, 'tipo' | 'titulo' | 'datos'>): string => {
  const propio = typeof t.datos?.nombre === 'string' ? t.datos.nombre.trim() : ''
  return propio || (t.titulo ?? '').trim() || TIPO(t.tipo).nombre
}

/**
 * Las piezas que el administrador apagó.
 *
 * Apagar no es lo mismo que borrar el texto: la etiqueta «ANUNCIO» no es un
 * campo que se pueda vaciar, y el rótulo «PRÓXIMAS CAPACITACIONES» se escribe
 * solo. Para que no se vean hace falta decirlo aparte.
 */
export const ocultosDe = (t: Pick<Tarjeta, 'datos'>): string[] =>
  Array.isArray(t.datos?.ocultos) ? t.datos.ocultos.filter((p: any) => typeof p === 'string') : []

export const seVe = (t: Pick<Tarjeta, 'datos'>, pieza: string): boolean =>
  !ocultosDe(t).includes(pieza)

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

/**
 * Cómo se reparten el espacio la imagen y el texto.
 *
 * Apilado es lo de siempre: uno debajo del otro, en el orden que diga la
 * tarjeta. Al lado los pone en dos columnas, y superpuesto manda el texto
 * sobre la imagen.
 */
export type Disposicion = 'apilado' | 'izquierda' | 'derecha' | 'superpuesto'

export const DISPOSICIONES: { id: Disposicion; nombre: string }[] = [
  { id: 'apilado',     nombre: 'Uno debajo del otro' },
  { id: 'izquierda',   nombre: 'Imagen a la izquierda' },
  { id: 'derecha',     nombre: 'Imagen a la derecha' },
  { id: 'superpuesto', nombre: 'Texto sobre la imagen' },
]

export function disposicionDe(t: Pick<Tarjeta, 'datos'>): Disposicion {
  const d = t.datos?.disposicion
  if (d === 'izquierda' || d === 'derecha' || d === 'superpuesto' || d === 'apilado') return d
  // Antes solo había una casilla de "texto encima"; las tarjetas que la tengan
  // marcada siguen viéndose igual sin que nadie las vuelva a tocar.
  return t.datos?.superpuesto ? 'superpuesto' : 'apilado'
}

/** Cuánto del ancho se lleva la imagen cuando van lado a lado. */
export type Proporcion = 'tercio' | 'mitad' | 'dos_tercios'

export const PROPORCIONES: { id: Proporcion; nombre: string; parte: string }[] = [
  { id: 'tercio',      nombre: 'Un tercio',  parte: '33%' },
  { id: 'mitad',       nombre: 'La mitad',   parte: '50%' },
  { id: 'dos_tercios', nombre: 'Dos tercios', parte: '66%' },
]

export const proporcionDe = (t: Pick<Tarjeta, 'datos'>) =>
  PROPORCIONES.find(p => p.id === t.datos?.proporcion) ?? PROPORCIONES[1]

/**
 * La paleta para el texto.
 *
 * Son colores sueltos, no los cinco de la tarjeta: aquí no se está marcando
 * una alerta ni un logro, se está escogiendo con qué se lee mejor sobre el
 * fondo que haya quedado. Además del muestrario, se puede escribir cualquier
 * color, porque una empresa tiene los suyos y no van a estar en una lista de
 * dieciocho.
 */
export const PALETA_TEXTO: { nombre: string; hex: string }[] = [
  { nombre: 'Blanco',    hex: '#FFFFFF' },
  { nombre: 'Hueso',     hex: '#E8EDF7' },
  { nombre: 'Gris',      hex: '#8595AD' },
  { nombre: 'Pizarra',   hex: '#42526E' },
  { nombre: 'Oscuro',    hex: '#0B1736' },
  { nombre: 'Negro',     hex: '#000000' },
  { nombre: 'Cian',      hex: '#22D3EE' },
  { nombre: 'Turquesa',  hex: '#06B6D4' },
  { nombre: 'Azul',      hex: '#3B82F6' },
  { nombre: 'Azul hondo', hex: '#1D4ED8' },
  { nombre: 'Morado',    hex: '#8B5CF6' },
  { nombre: 'Rosa',      hex: '#EC4899' },
  { nombre: 'Rojo',      hex: '#EF4444' },
  { nombre: 'Naranja',   hex: '#F97316' },
  { nombre: 'Ámbar',     hex: '#F59E0B' },
  { nombre: 'Amarillo',  hex: '#FACC15' },
  { nombre: 'Lima',      hex: '#84CC16' },
  { nombre: 'Verde',     hex: '#10B981' },
  { nombre: 'Verde SST', hex: '#6BA644' },
  { nombre: 'Oliva',     hex: '#4D7A2E' },
]

/** Los textos que se pueden pintar por separado. */
export type PiezaTexto = 'rotulo' | 'titulo' | 'numero' | 'texto'

export const PIEZAS_TEXTO: { id: PiezaTexto; nombre: string }[] = [
  { id: 'rotulo', nombre: 'Rótulo' },
  { id: 'titulo', nombre: 'Título' },
  { id: 'numero', nombre: 'Número' },
  { id: 'texto',  nombre: 'Descripción' },
]

const esHex = (v: any): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)

/**
 * El color de un texto concreto.
 *
 * Primero el que se le haya puesto a esa pieza, después el general de la
 * tarjeta, y si no hay ninguno, `null` para que mande el que le corresponde al
 * fondo. Así cambiar el color de todo sigue siendo un solo gesto, y pintar el
 * número de otro color no obliga a repintar lo demás.
 */
export function tintaDe(t: Pick<Tarjeta, 'datos'>, pieza: PiezaTexto): string | null {
  const propio = t.datos?.tintas?.[pieza]
  if (esHex(propio)) return propio
  return colorTextoDe(t)
}

/** El color general del texto de la tarjeta, o `null` para el automático. */
export function colorTextoDe(t: Pick<Tarjeta, 'datos'>): string | null {
  const v = t.datos?.colorTexto
  return esHex(v) ? v : null
}

export type Tamano = 'chico' | 'normal' | 'grande' | 'enorme'

/**
 * Cuatro escalas, y cada texto sube con ellas.
 *
 * El número va en su propia escala y no en la del título: en la tarjeta de
 * accidentalidad el número es el mensaje, y con el tamaño del título se
 * perdería entre las letras.
 */
export const TAMANOS: {
  id: Tamano; nombre: string; titulo: string; texto: string; rotulo: string; numero: string
}[] = [
  { id: 'chico',  nombre: 'Chico',  titulo: 'clamp(17px, 1.6vw, 21px)', texto: '13px', rotulo: '10px', numero: 'clamp(30px, 4vw, 40px)' },
  { id: 'normal', nombre: 'Normal', titulo: 'clamp(22px, 2.6vw, 32px)', texto: '15px', rotulo: '11px', numero: 'clamp(44px, 6vw, 62px)' },
  { id: 'grande', nombre: 'Grande', titulo: 'clamp(28px, 3.4vw, 42px)', texto: '17px', rotulo: '12px', numero: 'clamp(58px, 8vw, 86px)' },
  { id: 'enorme', nombre: 'Enorme', titulo: 'clamp(34px, 4.6vw, 58px)', texto: '19px', rotulo: '13px', numero: 'clamp(76px, 11vw, 124px)' },
]

export const tamanoDe = (t: Pick<Tarjeta, 'datos'>) =>
  TAMANOS.find(x => x.id === t.datos?.tamano) ?? TAMANOS[1]

/**
 * El tamaño de un texto concreto.
 *
 * Primero el que se le haya puesto a esa pieza, y si no, el general de la
 * tarjeta. Igual que con los colores: subir todo sigue siendo un solo gesto, y
 * agrandar solo el número no obliga a tocar lo demás.
 *
 * Cada pieza lee su propia columna de la escala, así que «Grande» en el número
 * y «Grande» en el rótulo no son el mismo número de píxeles: un rótulo del
 * tamaño de un número dejaría de ser un rótulo.
 */
export const PX_MINIMO = 8
export const PX_MAXIMO = 200

/**
 * La medida de una pieza, leyendo la columna que se le indique.
 *
 * Hace falta porque un mismo nombre de pieza no pesa igual en cada tarjeta: el
 * título del anuncio es un titular, y el «días sin accidentes» del contador es
 * un pie del número. Los dos los manda el control «Título», pero con la
 * columna que le corresponda a cada uno; si no, poner el contador en normal
 * le ponía el pie en treinta y dos píxeles.
 *
 * El número escrito a mano manda sobre todo: es lo más concreto que puede
 * pedir quien diseña, y las escalas solo están para no tener que pensar en
 * píxeles cuando no hace falta.
 */
export function medidaComo(
  t: Pick<Tarjeta, 'datos'>, pieza: PiezaTexto, columna: PiezaTexto,
): string {
  const px = Number(t.datos?.px?.[pieza])
  if (Number.isFinite(px) && px >= PX_MINIMO && px <= PX_MAXIMO) return `${Math.round(px)}px`

  const propio = TAMANOS.find(x => x.id === t.datos?.tamanos?.[pieza])
  return (propio ?? tamanoDe(t))[columna]
}

export const medidaDe = (t: Pick<Tarjeta, 'datos'>, pieza: PiezaTexto): string =>
  medidaComo(t, pieza, pieza)

/**
 * El grosor de un texto, si se pidió uno.
 *
 * `undefined` deja el que trae la pieza: el título ya nace grueso y la
 * descripción delgada, y forzar un valor a todas las igualaría.
 */
export function grosorDe(t: Pick<Tarjeta, 'datos'>, pieza: PiezaTexto): number | undefined {
  const v = t.datos?.negritas?.[pieza]
  if (v === true) return 800
  if (v === false) return 400
  return undefined
}

/**
 * Los píxeles que de verdad está usando una pieza, para mostrarlos en el
 * casillero del editor aunque nadie haya escrito un número todavía.
 */
export function pxDe(t: Pick<Tarjeta, 'datos'>, pieza: PiezaTexto): number | null {
  const px = Number(t.datos?.px?.[pieza])
  if (Number.isFinite(px) && px >= PX_MINIMO && px <= PX_MAXIMO) return Math.round(px)
  return null
}

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

export const TAMANOS_ICONO: { id: string; nombre: string; caja: number; dibujo: number }[] = [
  { id: 'chico',  nombre: 'Chicos',  caja: 26, dibujo: 14 },
  { id: 'normal', nombre: 'Normales', caja: 34, dibujo: 18 },
  { id: 'grande', nombre: 'Grandes', caja: 46, dibujo: 24 },
  { id: 'enorme', nombre: 'Enormes', caja: 62, dibujo: 32 },
]

export const tamanoIconosDe = (t: Pick<Tarjeta, 'datos'>) =>
  TAMANOS_ICONO.find(x => x.id === t.datos?.tamanoIconos) ?? TAMANOS_ICONO[1]

/**
 * Dónde se posa la fila de pictogramas.
 *
 * `null` los deja en el flujo de la tarjeta, debajo del texto, que es donde
 * estaban. Un par de porcentajes los suelta en cualquier punto de la tarjeta.
 *
 * Se guardan en porcentaje y no en píxeles a propósito: la misma tarjeta mide
 * distinto en el escritorio y en el celular, y un punto fijo en píxeles que en
 * el escritorio cae sobre la esquina de la imagen, en el celular cae fuera de
 * la tarjeta.
 */
export function posicionIconosDe(t: Pick<Tarjeta, 'datos'>): { x: number; y: number } | null {
  const p = t.datos?.iconosPos
  if (!p || typeof p !== 'object') return null
  const x = Number(p.x), y = Number(p.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) }
}

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
