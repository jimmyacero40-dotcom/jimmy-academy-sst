/**
 * El formato AVC-FR06 de la empresa, tal cual.
 *
 * Es por trabajador, no por día: su nombre, su documento y su cargo arriba, y
 * debajo todo lo que ha recibido, con la firma en el recuadro de cada
 * elemento. Al pie, el compromiso que el trabajador acepta al recibirlos.
 *
 * Se replica el formato en papel para que lo que salga de la plataforma sea
 * el mismo documento que la empresa ya tiene aprobado, y no uno parecido.
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
  crema: [236, 230, 157] as [number, number, number],
  gris: [110, 118, 128] as [number, number, number],
  oscuro: [25, 32, 40] as [number, number, number],
  blanco: [255, 255, 255] as [number, number, number],
  borde: [60, 60, 60] as [number, number, number],
}

const W = 215.9, H = 279.4          // Carta, como el resto de los formatos
const ML = 10, MR = 10, CW = W - ML - MR

const COMPROMISO =
  'Declaro que la empresa me ha entregado, al inicio de mis labores, los Elementos de Protección '
  + 'Personal (EPP) correspondientes al cargo que desempeño, conforme a la evaluación de riesgos '
  + 'realizada y a los requisitos establecidos por la normatividad vigente en Seguridad y Salud en '
  + 'el Trabajo. Así mismo, certifico que he recibido capacitación e instrucción sobre el uso '
  + 'adecuado, mantenimiento, almacenamiento, reposición y disposición final de los EPP asignados, '
  + 'comprendiendo que su uso es obligatorio durante la ejecución de mis actividades laborales, con '
  + 'el fin de proteger mi salud e integridad física. Me comprometo a hacer uso correcto y '
  + 'permanente de los EPP entregados, reportar cualquier daño o pérdida, y cumplir con las '
  + 'políticas, procedimientos y normas de la empresa en materia de Seguridad y Salud en el Trabajo.'

const ddmmaa = (iso: string) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`
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
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' })

  let y = 0

  const texto = (
    s: string, x: number, yy: number, tam: number, color: [number, number, number],
    negrilla = false, alinear: 'left' | 'center' | 'right' = 'left',
  ) => {
    doc.setFontSize(tam)
    doc.setFont('helvetica', negrilla ? 'bold' : 'normal')
    doc.setTextColor(...color)
    doc.text(s, x, yy, { align: alinear })
  }

  const celda = (
    x: number, yy: number, w: number, h: number, s: string,
    o?: { bg?: [number, number, number]; color?: [number, number, number]; bold?: boolean; size?: number; align?: 'left' | 'center' },
  ) => {
    if (o?.bg) { doc.setFillColor(...o.bg); doc.rect(x, yy, w, h, 'F') }
    doc.setDrawColor(...C.borde); doc.setLineWidth(0.2); doc.rect(x, yy, w, h, 'S')
    if (!s) return
    const tam = o?.size ?? 7
    const al = o?.align ?? 'center'
    doc.setFontSize(tam)
    doc.setFont('helvetica', o?.bold ? 'bold' : 'normal')
    doc.setTextColor(...(o?.color ?? C.oscuro))
    let t = s
    const max = w - 3
    while (doc.getTextWidth(t) > max && t.length > 1) t = t.slice(0, -1)
    if (t !== s && t.length) t += '…'
    doc.text(t, al === 'center' ? x + w / 2 : x + 1.5, yy + h / 2 + tam * 0.12,
      { align: al === 'center' ? 'center' : 'left' })
  }

  // ── Encabezado del formato ──
  const logoW = 34, altoTitulo = 11
  const fotoLogo = await comoDato(logo ?? null)

  y = 10
  if (fotoLogo) {
    doc.setDrawColor(...C.borde); doc.setLineWidth(0.2); doc.rect(ML, y, logoW, altoTitulo * 2, 'S')
    try {
      doc.addImage(fotoLogo, /^data:image\/png/i.test(fotoLogo) ? 'PNG' : 'JPEG',
        ML + 3, y + 2, logoW - 6, altoTitulo * 2 - 4)
    } catch { /* sin logo sale igual */ }
  } else {
    celda(ML, y, logoW, altoTitulo * 2, empresa, { bold: true, size: 7 })
  }

  celda(ML + logoW, y, CW - logoW, altoTitulo, 'ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL',
    { bold: true, size: 11 })

  // Versión · Código · Área · Fechas, como en la hoja de cálculo.
  const anchos = [22, 30, 20, 44, CW - logoW - 116]
  let x = ML + logoW
  const rotulos = ['Versión', 'Código', 'ÁREA', 'FECHA DE ELABORACIÓN', 'FECHA DE REVISIÓN']
  const valores = ['1', 'AVC-FR06', 'SST', '14/10/2025', '22/01/2026']
  rotulos.forEach((r, i) => {
    celda(x, y + altoTitulo, anchos[i], altoTitulo / 2, r, { bold: true, size: 6 })
    celda(x, y + altoTitulo + altoTitulo / 2, anchos[i], altoTitulo / 2, valores[i], { size: 6.5 })
    x += anchos[i]
  })
  y += altoTitulo * 2 + 4

  // ── El trabajador ──
  const anchoNombre = CW * 0.46, anchoDoc = CW * 0.24, anchoCargo = CW - anchoNombre - anchoDoc
  celda(ML, y, anchoNombre, 6, 'APELLIDOS Y NOMBRES COMPLETOS DEL TRABAJADOR', { bg: C.crema, bold: true, size: 6 })
  celda(ML + anchoNombre, y, anchoDoc, 6, 'DOCUMENTO DE IDENTIDAD', { bg: C.crema, bold: true, size: 6 })
  celda(ML + anchoNombre + anchoDoc, y, anchoCargo, 6, 'CARGO', { bg: C.crema, bold: true, size: 6 })
  y += 6
  celda(ML, y, anchoNombre, 8, trabajador.nombre, { bold: true, size: 8 })
  celda(ML + anchoNombre, y, anchoDoc, 8, trabajador.cedula || '—', { size: 8 })
  celda(ML + anchoNombre + anchoDoc, y, anchoCargo, 8, trabajador.cargo || '—', { size: 7 })
  y += 8 + 4

  // ── La tabla de elementos ──
  const col = [26, CW * 0.40, 44, 0]
  col[3] = CW - col[0] - col[1] - col[2]
  const X = [ML, ML + col[0], ML + col[0] + col[1], ML + col[0] + col[1] + col[2]]

  const encabezadoTabla = () => {
    celda(X[0], y, col[0], 10, 'Fecha de entrega (dd/mm/aa)', { bg: C.crema, bold: true, size: 6 })
    celda(X[1], y, col[1], 10, 'ELEMENTO DE PROTECCIÓN PERSONAL ENTREGADO', { bg: C.crema, bold: true, size: 6.5 })
    celda(X[2], y, col[2], 10, 'Nombre y apellido de quien entregó el EPP', { bg: C.crema, bold: true, size: 6 })
    celda(X[3], y, col[3], 10, 'Firme en el recuadro por cada elemento recibido', { bg: C.crema, bold: true, size: 5.5 })
    y += 10
  }
  encabezadoTabla()

  const alto = 13
  // Siempre quedan renglones en blanco al final: la hoja también se usa en
  // papel cuando se entrega algo que todavía no se alcanzó a registrar.
  const total = Math.max(entregas.length + 3, 12)

  for (let i = 0; i < total; i++) {
    if (y + alto > H - 60) { doc.addPage(); y = 12; encabezadoTabla() }
    const e = entregas[i]

    celda(X[0], y, col[0], alto, e ? ddmmaa(e.entregado_at) : '', { size: 7 })

    const detalle = e
      ? `${e.cantidad} ${e.unidad} · ${e.elemento}${e.referencia ? ` (${e.referencia})` : ''}`
      : ''
    celda(X[1], y, col[1], alto, detalle, { size: 7, align: 'left' })

    celda(X[2], y, col[2], alto, e?.entregado_por_nombre || '', { size: 6.5 })

    // La firma registrada del trabajador va en su recuadro, pero solo si ya
    // confirmó: firmar por alguien que no ha aceptado sería falsear la
    // constancia. Si no ha confirmado, el recuadro queda para firmar a mano.
    doc.setDrawColor(...C.borde); doc.setLineWidth(0.2)
    doc.rect(X[3], y, col[3], alto, 'S')
    if (e?.firma && e.confirmado_at) {
      try {
        doc.setFillColor(...C.blanco); doc.rect(X[3] + 1, y + 1, col[3] - 2, alto - 2, 'F')
        doc.addImage(e.firma, /^data:image\/png/i.test(e.firma) ? 'PNG' : 'JPEG',
          X[3] + 2, y + 1.5, col[3] - 4, alto - 3)
      } catch { /* una firma rota no bota el documento */ }
    } else if (e && !e.confirmado_at) {
      texto('pendiente de confirmar', X[3] + col[3] / 2, y + alto / 2 + 1, 5.5, C.gris, false, 'center')
    }

    y += alto
  }

  // ── El compromiso ──
  y += 5
  const lineas = doc.splitTextToSize(COMPROMISO, CW - 6) as string[]
  const altoTexto = lineas.length * 3.1 + 6
  if (y + altoTexto > H - 12) { doc.addPage(); y = 14 }
  doc.setDrawColor(...C.borde); doc.setLineWidth(0.2); doc.rect(ML, y, CW, altoTexto, 'S')
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.oscuro)
  doc.text(lineas, ML + 3, y + 5)
  y += altoTexto + 2

  texto(
    `Generado por AgroSafe el ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    ML, y + 4, 6, C.gris)
  texto(
    `${entregas.filter(e => e.confirmado_at).length} de ${entregas.length} confirmadas por el trabajador`,
    W - MR, y + 4, 6, C.gris, false, 'right')

  const limpio = trabajador.nombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
  doc.save(`AVC-FR06_${limpio}.pdf`)
}
