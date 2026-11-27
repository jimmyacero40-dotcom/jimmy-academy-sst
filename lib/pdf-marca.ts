/**
 * El encabezado de marca de los PDF de la plataforma.
 *
 * Un informe que sale de aquí y llega a una reunión o a una auditoría tiene
 * que decir de dónde salió. Antes salían con el título en negrita y nada más.
 *
 * OJO: esto no se le pone a los formatos controlados de la empresa —el
 * AVC-FR05 de asistencia y el AVC-FR06 de entrega de EPP—. Esos llevan su
 * propio membrete, con código, versión y fecha de revisión; meterles otro logo
 * los dejaría de parecer al documento aprobado, que es justo lo que no se
 * puede tocar.
 */

const RUTA_LOGO = '/images/agrosafe-pdf.jpg'
/** La misma marca en blanco, para las franjas oscuras de los informes. */
const RUTA_LOGO_BLANCO = '/images/agrosafe-completo.png'

/** Proporción del logo (ancho ÷ alto), para no deformarlo. */
const PROPORCION = 1000 / 338

const memoria: Record<string, string> = {}

/** Se lee una vez por pestaña: no vale la pena pedirlo en cada descarga. */
async function cargar(ruta: string): Promise<string | null> {
  if (memoria[ruta]) return memoria[ruta]
  try {
    const r = await fetch(ruta)
    if (!r.ok) return null
    const blob = await r.blob()
    memoria[ruta] = await new Promise<string>((ok, mal) => {
      const fr = new FileReader()
      fr.onload = () => ok(String(fr.result))
      fr.onerror = () => mal(new Error('no se pudo leer el logo'))
      fr.readAsDataURL(blob)
    })
    return memoria[ruta]
  } catch {
    // Sin logo el informe se genera igual: vale más el dato que el adorno.
    return null
  }
}

/** La marca en color, para encabezados sobre blanco. */
export const logoAgrosafe = () => cargar(RUTA_LOGO)

/** La marca en blanco, para las franjas oscuras. */
export const logoAgrosafeBlanco = () => cargar(RUTA_LOGO_BLANCO)

/** Cuánto mide de ancho la marca para un alto dado, sin deformarla. */
export const anchoMarca = (alto: number) => alto * PROPORCION

/**
 * Pone la marca dentro de una franja de color y devuelve en qué x sigue el
 * texto. Si el logo no cargó, el texto arranca donde siempre.
 */
export function marcaEnFranja(doc: any, logo: string | null, x: number, y: number, alto: number): number {
  if (!logo) return x
  try {
    doc.addImage(logo, 'PNG', x, y, anchoMarca(alto), alto)
    return x + anchoMarca(alto) + 5
  } catch {
    return x
  }
}

export interface Encabezado {
  titulo: string
  subtitulo?: string
  /** Ancho de la hoja en milímetros; el margen se resta aquí. */
  anchoHoja: number
  margen?: number
  /** Arriba de dónde empieza a dibujarse. */
  y?: number
  altoLogo?: number
}

/**
 * Dibuja el logo arriba a la izquierda, el título al lado y una línea debajo.
 * Devuelve la altura ocupada, para que quien llame sepa dónde seguir.
 */
export function encabezadoMarca(doc: any, logo: string | null, o: Encabezado): number {
  const M = o.margen ?? 10
  const y = o.y ?? 8
  const altoLogo = o.altoLogo ?? 11
  const anchoLogo = altoLogo * PROPORCION
  const derecha = o.anchoHoja - M

  if (logo) {
    try { doc.addImage(logo, 'JPEG', M, y, anchoLogo, altoLogo) } catch { /* se sigue sin logo */ }
  }

  const xTexto = logo ? M + anchoLogo + 6 : M
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 42, 32)
  doc.text(o.titulo, xTexto, y + (o.subtitulo ? altoLogo / 2 - 0.5 : altoLogo / 2 + 1.5))

  if (o.subtitulo) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(90, 90, 90)
    doc.text(o.subtitulo, xTexto, y + altoLogo / 2 + 4.5)
  }

  const yLinea = y + altoLogo + 3
  doc.setDrawColor(15, 42, 32)
  doc.setLineWidth(0.6)
  doc.line(M, yLinea, derecha, yLinea)

  doc.setTextColor(0, 0, 0)
  return yLinea + 4
}

/** El pie: quién lo generó, cuándo y en qué página. */
export function pieMarca(doc: any, o: { anchoHoja: number; altoHoja: number; margen?: number; pagina?: number }) {
  const M = o.margen ?? 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(130, 130, 130)
  doc.text(
    `AgroSafe · Sistema de Gestión de Seguridad y Salud en el Trabajo · generado el ${new Date().toLocaleString('es-CO')}`,
    M, o.altoHoja - 5,
  )
  if (o.pagina) {
    doc.text(`Página ${o.pagina}`, o.anchoHoja - M, o.altoHoja - 5, { align: 'right' })
  }
  doc.setTextColor(0, 0, 0)
}

/**
 * Un gráfico de barras dibujado dentro del PDF.
 *
 * Lo que el gerente mira primero es de dónde viene la gente, no la lista de
 * cuarenta nombres. Se dibuja con líneas y rectángulos, sin imágenes, para que
 * el PDF siga pesando lo que pesa.
 */
export function barrasPDF(doc: any, o: {
  x: number; y: number; ancho: number
  filas: { nombre: string; valor: number }[]
  titulo?: string
  color?: [number, number, number]
  altoFila?: number
}): number {
  const { x, ancho } = o
  let y = o.y
  const alto = o.altoFila ?? 6
  const color = o.color ?? [16, 109, 73]
  const anchoRotulo = Math.min(48, ancho * 0.32)
  const anchoCifra = 14
  const anchoBarra = ancho - anchoRotulo - anchoCifra - 4

  if (o.titulo) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 42, 32)
    doc.text(o.titulo, x, y)
    y += 5
  }

  const max = Math.max(1, ...o.filas.map(f => f.valor))

  for (const f of o.filas) {
    const largo = Math.max((f.valor / max) * anchoBarra, f.valor > 0 ? 1 : 0)

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(40, 40, 40)
    let rotulo = f.nombre
    while (doc.getTextWidth(rotulo) > anchoRotulo - 2 && rotulo.length > 1) rotulo = rotulo.slice(0, -1)
    if (rotulo !== f.nombre) rotulo += '…'
    doc.text(rotulo, x + anchoRotulo - 2, y + alto / 2 + 1, { align: 'right' })

    // El carril completo, para que se vea contra qué se compara.
    doc.setFillColor(238, 242, 240)
    doc.rect(x + anchoRotulo, y + 0.8, anchoBarra, alto - 1.6, 'F')
    if (largo > 0) {
      doc.setFillColor(color[0], color[1], color[2])
      doc.rect(x + anchoRotulo, y + 0.8, largo, alto - 1.6, 'F')
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(color[0], color[1], color[2])
    doc.text(String(f.valor), x + anchoRotulo + anchoBarra + 3, y + alto / 2 + 1)

    y += alto
  }

  doc.setTextColor(0, 0, 0)
  return y
}
