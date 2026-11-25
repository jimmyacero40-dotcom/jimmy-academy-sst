/**
 * El formato AVC-FR06 de la empresa, tal cual.
 *
 * No es una lista: es una matriz. Las columnas son los elementos —gafas,
 * guantes, botas, respirador— y las filas son las fechas de entrega. En el
 * cruce va la firma del trabajador por ese elemento en esa fecha, que es lo
 * que el formato pide: «firme en el recuadro por cada elemento recibido».
 *
 * Va en horizontal, con el compromiso arriba y no abajo, y la fecha de
 * revisión en blanco, como en la hoja de la empresa.
 *
 * Se pasa de hoja por los mismos dos motivos que en papel: porque se
 * llenaron las columnas —apareció un elemento nuevo— o porque se acabaron
 * las filas. En los dos casos la hoja nueva repite todos los encabezados.
 */

interface Fila {
  elemento: string
  unidad: string
  cantidad: number
  referencia: string | null
  entregado_at: string
  entregado_por_nombre: string | null
  confirmado_at: string | null
  firma: string | null
}

interface Trabajador {
  nombre: string
  cedula: string | null
  cargo: string | null
  area: string | null
}

const C = {
  verde: [31, 61, 42] as [number, number, number],
  crema: [241, 234, 170] as [number, number, number],
  rojo: [192, 0, 0] as [number, number, number],
  gris: [120, 126, 132] as [number, number, number],
  oscuro: [20, 26, 33] as [number, number, number],
  blanco: [255, 255, 255] as [number, number, number],
  borde: [40, 40, 40] as [number, number, number],
}

// Carta en horizontal, como la hoja de cálculo.
const W = 279.4, H = 215.9
const ML = 8, MR = 8, CW = W - ML - MR

/** Las columnas de elementos que trae el formato en papel. */
const COLUMNAS_EPP = 7

const COMPROMISO =
  'Declaro que la empresa me ha entregado, al inicio de mis labores, los Elementos de Protección Personal (EPP) '
  + 'correspondientes al cargo que desempeño, conforme a la evaluación de riesgos realizada y a los requisitos '
  + 'establecidos por la normatividad vigente en Seguridad y Salud en el Trabajo. Así mismo, certifico que he '
  + 'recibido capacitación e instrucción sobre el uso adecuado, mantenimiento, almacenamiento, reposición y '
  + 'disposición final de los EPP asignados, comprendiendo que su uso es obligatorio durante la ejecución de mis '
  + 'actividades laborales, con el fin de proteger mi salud e integridad física. Me comprometo a hacer uso correcto '
  + 'y permanente de los EPP entregados, reportar cualquier daño o pérdida, y cumplir con las políticas, '
  + 'procedimientos y normas de la empresa en materia de Seguridad y Salud en el Trabajo.'

const ddmmaaaa = (iso: string) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** El día, para agrupar en una sola fila todo lo entregado esa fecha. */
const soloDia = (iso: string) => {
  const d = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

/** La imagen como data URL, que es lo que jsPDF sabe meter. */
async function comoDato(src: string | null): Promise<string | null> {
  if (!src) return null
  try {
    if (src.startsWith('data:')) return src
    const r = await fetch(src)
    if (!r.ok) return null
    const blob = await r.blob()
    return await new Promise(ok => {
      const fr = new FileReader()
      fr.onload = () => ok(String(fr.result))
      fr.onerror = () => ok(null as any)
      fr.readAsDataURL(blob)
    })
  } catch { return null }
}

export async function exportarFR06(
  trabajador: Trabajador,
  entregas: Fila[],
  empresa = 'AgroVenture Capital',
  logo?: string | null,
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  const fotoLogo = await comoDato(logo ?? null)

  const texto = (
    s: string, x: number, yy: number, tam: number, color: [number, number, number],
    negrilla = false, alinear: 'left' | 'center' | 'right' = 'left',
  ) => {
    doc.setFontSize(tam)
    doc.setFont('helvetica', negrilla ? 'bold' : 'normal')
    doc.setTextColor(...color)
    doc.text(s, x, yy, { align: alinear })
  }

  /** Una celda del formato: borde siempre, y el texto recortado si no cabe. */
  const celda = (
    x: number, y: number, w: number, h: number, s: string,
    o?: {
      bg?: [number, number, number]; color?: [number, number, number]
      bold?: boolean; size?: number; align?: 'left' | 'center'; lineas?: boolean
    },
  ) => {
    if (o?.bg) { doc.setFillColor(...o.bg); doc.rect(x, y, w, h, 'F') }
    doc.setDrawColor(...C.borde); doc.setLineWidth(0.2); doc.rect(x, y, w, h, 'S')
    if (!s) return
    const tam = o?.size ?? 6.5
    const al = o?.align ?? 'center'
    doc.setFontSize(tam)
    doc.setFont('helvetica', o?.bold ? 'bold' : 'normal')
    doc.setTextColor(...(o?.color ?? C.oscuro))

    if (o?.lineas) {
      // Los rótulos largos del formato van en varias líneas dentro del alto.
      const ls = doc.splitTextToSize(s, w - 2) as string[]
      const alto = ls.length * (tam * 0.42)
      ls.forEach((l, i) => {
        doc.text(l, al === 'center' ? x + w / 2 : x + 1.5,
          y + h / 2 - alto / 2 + (i + 1) * (tam * 0.42),
          { align: al === 'center' ? 'center' : 'left' })
      })
      return
    }

    let t = s
    while (doc.getTextWidth(t) > w - 2.5 && t.length > 1) t = t.slice(0, -1)
    if (t !== s && t.length) t += '…'
    doc.text(t, al === 'center' ? x + w / 2 : x + 1.5, y + h / 2 + tam * 0.12,
      { align: al === 'center' ? 'center' : 'left' })
  }

  // ── Qué columnas lleva la hoja ──
  // Un elemento por columna, en el orden en que se entregó por primera vez.
  const elementos: string[] = []
  for (const e of entregas) if (!elementos.includes(e.elemento)) elementos.push(e.elemento)

  // Siete por hoja, como el formato en papel. Si aparece un elemento nuevo y
  // ya no cabe, se sigue en otra hoja.
  const bloques: string[][] = []
  for (let i = 0; i < Math.max(elementos.length, 1); i += COLUMNAS_EPP) {
    bloques.push(elementos.slice(i, i + COLUMNAS_EPP))
  }

  const dias = [...new Set(entregas.map(e => soloDia(e.entregado_at)))].sort()

  // Medidas de la rejilla
  const anchoFecha = 26
  const anchoQuien = 34
  const anchoEpp = (CW - anchoFecha - anchoQuien) / COLUMNAS_EPP
  const logoW = 40, altoT = 8
  const altoTituloEpp = 6
  const altoNombres = 13
  const altoFirmeAqui = 4.5
  const altoFila = 11

  let primera = true

  /**
   * Una hoja con todo el encabezado: el membrete, el compromiso, los datos
   * del trabajador y los títulos de la rejilla. Es lo que se hace en papel
   * cuando se acaba la hoja y se coge otra.
   */
  const abrirHoja = (columnas: string[]): { y: number; yTabla: number } => {
    if (!primera) doc.addPage()
    primera = false

    let y = 8

    // ── Membrete ──
    if (fotoLogo) {
      doc.setDrawColor(...C.borde); doc.setLineWidth(0.2); doc.rect(ML, y, logoW, altoT * 2, 'S')
      try {
        doc.addImage(fotoLogo, /^data:image\/png/i.test(fotoLogo) ? 'PNG' : 'JPEG',
          ML + 3, y + 1.5, logoW - 6, altoT * 2 - 3)
      } catch { /* sin logo sale igual */ }
    } else {
      celda(ML, y, logoW, altoT * 2, empresa, { bold: true, size: 7 })
    }

    celda(ML + logoW, y, CW - logoW, altoT, 'ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL',
      { bold: true, size: 9 })

    // Los cinco rótulos reparten el ancho que queda después del logo.
    const libre = CW - logoW
    const anchos = [0.14, 0.20, 0.12, 0.27, 0.27].map(f => libre * f)
    const rotulos = ['Versión', 'Código', 'ÁREA', 'FECHA DE ELABORACIÓN', 'FECHA DE REVISIÓN']
    // La fecha de revisión va en blanco: así está en la hoja de la empresa.
    const valores = ['1', 'AVC-FR06', 'SST', '14/10/2025', '']
    let x = ML + logoW
    rotulos.forEach((r, i) => {
      celda(x, y + altoT, anchos[i], altoT / 2, r, { bold: true, size: 5.5 })
      celda(x, y + altoT + altoT / 2, anchos[i], altoT / 2, valores[i], { size: 5.5 })
      x += anchos[i]
    })
    y += altoT * 2

    // ── El compromiso, arriba ──
    const ls = doc.splitTextToSize(COMPROMISO, CW - 4) as string[]
    const altoC = ls.length * 2.9 + 3
    doc.setDrawColor(...C.borde); doc.setLineWidth(0.2); doc.rect(ML, y, CW, altoC, 'S')
    doc.setFontSize(5.4); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.oscuro)
    ls.forEach((l, i) => doc.text(l, ML + 2, y + 4 + i * 2.9))
    y += altoC

    // ── El trabajador ──
    const alto1 = 9
    const wRotNombre = 56, wValNombre = CW * 0.30
    const wRotDoc = 34, wValDoc = CW * 0.14
    const wRotCargo = 24
    const wValCargo = CW - wRotNombre - wValNombre - wRotDoc - wValDoc - wRotCargo
    let cx = ML
    celda(cx, y, wRotNombre, alto1, 'APELLIDOS Y NOMBRES COMPLETOS DEL TRABAJADOR:',
      { bg: C.verde, color: C.blanco, bold: true, size: 5.8, lineas: true }); cx += wRotNombre
    celda(cx, y, wValNombre, alto1, trabajador.nombre, { bold: true, size: 8 }); cx += wValNombre
    celda(cx, y, wRotDoc, alto1, 'DOCUMENTO DE IDENTIDAD',
      { bg: C.verde, color: C.blanco, bold: true, size: 5.8, lineas: true }); cx += wRotDoc
    celda(cx, y, wValDoc, alto1, trabajador.cedula || '', { size: 8 }); cx += wValDoc
    celda(cx, y, wRotCargo, alto1, 'CARGO',
      { bg: C.verde, color: C.blanco, bold: true, size: 5.8 }); cx += wRotCargo
    celda(cx, y, wValCargo, alto1, trabajador.cargo || '', { size: 7 })
    y += alto1

    // ── Títulos de la rejilla ──
    const yTabla = y
    celda(ML + anchoFecha, y, anchoEpp * COLUMNAS_EPP, altoTituloEpp,
      'ELEMENTO DE PROTECCIÓN PERSONAL ENTREGADO', { bg: C.crema, bold: true, size: 8 })

    const altoEncabezado = altoTituloEpp + altoNombres + altoFirmeAqui
    celda(ML, y, anchoFecha, altoEncabezado, 'Fecha de entrega (dd/mm/aa)',
      { bold: true, size: 7, lineas: true })
    celda(ML + anchoFecha + anchoEpp * COLUMNAS_EPP, y, anchoQuien, altoEncabezado,
      'Nombre y apellido de quien entregó el EPP', { bold: true, size: 7, lineas: true })

    y += altoTituloEpp
    for (let i = 0; i < COLUMNAS_EPP; i++) {
      celda(ML + anchoFecha + i * anchoEpp, y, anchoEpp, altoNombres, columnas[i] ?? '',
        { bg: C.crema, color: C.rojo, bold: true, size: 7, lineas: true })
    }
    y += altoNombres

    celda(ML + anchoFecha, y, anchoEpp * COLUMNAS_EPP, altoFirmeAqui,
      'Firme en el recuadro por cada elemento de protección personal recibido',
      { bg: C.crema, size: 6 })
    y += altoFirmeAqui

    return { y, yTabla }
  }

  /** El borde exterior, para que la rejilla se lea como una sola tabla. */
  const cerrarHoja = (yTabla: number, y: number) => {
    doc.setDrawColor(...C.borde); doc.setLineWidth(0.5)
    doc.rect(ML, yTabla, CW, y - yTabla, 'S')
  }

  /** Una fila: la fecha, las firmas de ese día y quién entregó. */
  const dibujarFila = (y: number, columnas: string[], dia: string | undefined) => {
    const delDia = dia ? entregas.filter(e => soloDia(e.entregado_at) === dia) : []

    celda(ML, y, anchoFecha, altoFila, dia ? ddmmaaaa(`${dia}T12:00:00`) : '',
      { color: C.rojo, bold: true, size: 7.5 })

    for (let i = 0; i < COLUMNAS_EPP; i++) {
      const x2 = ML + anchoFecha + i * anchoEpp
      const nombre = columnas[i]
      const e = nombre ? delDia.find(d => d.elemento === nombre) : undefined

      doc.setDrawColor(...C.borde); doc.setLineWidth(0.2)
      doc.rect(x2, y, anchoEpp, altoFila, 'S')

      if (!e) continue
      // La firma solo si el trabajador ya confirmó: firmar por quien no ha
      // aceptado sería falsear la constancia.
      if (e.firma && e.confirmado_at) {
        try {
          doc.setFillColor(...C.blanco); doc.rect(x2 + 0.8, y + 0.8, anchoEpp - 1.6, altoFila - 1.6, 'F')
          doc.addImage(e.firma, /^data:image\/png/i.test(e.firma) ? 'PNG' : 'JPEG',
            x2 + 1.5, y + 1.2, anchoEpp - 3, altoFila - 2.4)
        } catch { /* una firma rota no bota el documento */ }
      } else {
        texto('pendiente', x2 + anchoEpp / 2, y + altoFila / 2 + 1, 5, C.gris, false, 'center')
      }
    }

    const quien = [...new Set(delDia.map(d => d.entregado_por_nombre).filter(Boolean))].join(' · ')
    celda(ML + anchoFecha + anchoEpp * COLUMNAS_EPP, y, anchoQuien, altoFila, quien,
      { color: C.rojo, bold: true, size: 6.5, lineas: true })
  }

  // ── A dibujar ──
  for (const columnas of bloques) {
    let { y, yTabla } = abrirHoja(columnas)
    let f = 0

    for (;;) {
      // Se acabó la hoja: se cierra y se coge otra, con los encabezados.
      if (y + altoFila > H - 6) {
        cerrarHoja(yTabla, y)
        const nueva = abrirHoja(columnas)
        y = nueva.y
        yTabla = nueva.yTabla
      }

      dibujarFila(y, columnas, dias[f])
      y += altoFila
      f++

      // Pintadas todas las fechas, se siguen poniendo renglones en blanco
      // hasta llenar la hoja —se entrega con espacio para escribir a mano— y
      // ahí se para.
      if (f >= dias.length && y + altoFila > H - 6) break
    }

    cerrarHoja(yTabla, y)
  }

  const limpio = trabajador.nombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
  doc.save(`AVC-FR06_${limpio}.pdf`)
}
