export interface AttendancePDFParams {
  trainingTitle: string
  trainingTemario?: string
  eventDate: string       // Display string, e.g. "20/07/2026"
  schedule: string        // e.g. "8:00 AM - 4:30 PM"
  intensity: string       // e.g. "8 horas"
  instructor: string
  organizedBy: string
  directedTo: string
  participants: { name: string; cedula: string; cargo: string; signature?: string }[]
  companyName: string
  companyLogo: string
  /** Firma de quien dictó la capacitación, para el espacio del final. */
  capacitadorFirma?: string
  capacitadorNombre?: string
  capacitadorCargo?: string
  /**
   * Anular con una línea los renglones que quedaron sin firmar.
   *
   * Es lo que se hace en papel cuando el registro se cierra: se raya lo que
   * sobra para que nadie agregue un nombre después. Por defecto va sellado;
   * se apaga cuando la lista se imprime en blanco para firmar en la jornada.
   */
  sellarVacias?: boolean
}

function getImgDims(src: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload  = () => resolve({ w: img.naturalWidth,  h: img.naturalHeight })
    img.onerror = () => resolve({ w: 4, h: 1 })
    img.src = src
  })
}

/**
 * El AVC-FR05 tal como está en papel: hoja carta, vertical, y el formato
 * completo —encabezado, temario, los veinte renglones de participantes y la
 * firma del capacitador— en una sola hoja. Quien lo imprime para la charla
 * lleva una página, no dos; si asisten más de veinte, ahí sí continúa en la
 * siguiente con todos los encabezados repetidos.
 */
export async function generateAttendancePDF(p: AttendancePDFParams): Promise<Blob> {
  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  const W = 215.9, H = 279.4, M = 8
  const usable = W - 2 * M          // 199.9
  const fondo  = H - M              // el borde inferior de la caja útil

  // Los colores del formato impreso de AVC.
  const CG: [number,number,number] = [36,60,44]      // verde de los rótulos
  const CLO: [number,number,number] = [236,230,157]  // crema del encabezado
  const CW: [number,number,number] = [255,255,255]
  const CB: [number,number,number] = [0,0,0]

  const fl = (x: number, y: number, w: number, h: number, c: [number,number,number]) => {
    doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, y, w, h, 'F')
  }
  const bd = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(80,80,80); doc.setLineWidth(0.25); doc.rect(x, y, w, h, 'S')
  }
  const cl = (x: number, y: number, w: number, h: number, txt: string,
    o?: { bg?: [number,number,number]; color?: [number,number,number]; bold?: boolean; size?: number; align?: 'left'|'center' }) => {
    if (o?.bg) fl(x, y, w, h, o.bg)
    bd(x, y, w, h)
    if (!txt) return
    const sz = o?.size || 7, b = o?.bold || false, c = o?.color || CB, al = o?.align || 'center'
    doc.setFontSize(sz); doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setTextColor(c[0], c[1], c[2])
    const tx = al === 'center' ? x + w/2 : x + 2
    const ty = y + h/2 + sz * 0.12
    let ft = txt; const mw = w - 4
    while (doc.getTextWidth(ft) > mw && ft.length > 1) ft = ft.slice(0, -1)
    if (ft !== txt && ft.length > 0) ft += '..'
    doc.text(ft, tx, ty, { align: al === 'center' ? 'center' : 'left' })
  }

  // ── Las columnas de la tabla de participantes, en milímetros ──
  const COL = { n: 10, ced: 28, nom: 66, cargo: 45, firma: usable - 10 - 28 - 66 - 45 }
  const xN = M, xCed = xN + COL.n, xNom = xCed + COL.ced,
        xCar = xNom + COL.nom, xFir = xCar + COL.cargo

  // Firmas de los participantes: se miden antes para no deformarlas.
  const sigDims: Record<number, { w: number; h: number }> = {}
  for (let r = 0; r < p.participants.length; r++) {
    if (p.participants[r]?.signature) sigDims[r] = await getImgDims(p.participants[r].signature!)
  }

  const justifyLine = (line: string, x: number, y: number, maxW: number, isLast: boolean) => {
    const words = line.trim().split(' ')
    if (isLast || words.length <= 1) { doc.text(line, x+2, y); return }
    const totalW = words.reduce((s, w) => s + doc.getTextWidth(w), 0)
    const gap = (maxW - 4 - totalW) / (words.length - 1)
    let cx = x + 2
    words.forEach(w => { doc.text(w, cx, y); cx += doc.getTextWidth(w) + gap })
  }

  // Medidas fijas del formato, las mismas en todas las hojas.
  const thH = 6.5, temH = 4.8, RENGLONES_TEMARIO = 5, FIRMA_H = 28
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal')
  const lineasTemario: string[] = p.trainingTemario
    ? doc.splitTextToSize(p.trainingTemario, usable - 4)
    : []

  // Las imágenes se miden una sola vez: el encabezado y el pie se repiten en
  // cada hoja y no se puede estar preguntando por el tamaño en cada dibujo.
  const dimsLogo = p.companyLogo ? await getImgDims(p.companyLogo) : null
  const dimsFirma = p.capacitadorFirma ? await getImgDims(p.capacitadorFirma) : null

  let y = M

  /**
   * El encabezado completo del formato: logo, título, ficha del documento,
   * los datos del evento, el temario y la cabecera de la tabla.
   *
   * Va en cada hoja. En papel, cuando se acaba una hoja se toma otro formato
   * en blanco —que viene con todo impreso—, no media hoja; una hoja suelta
   * con nombres y sin encabezado no acredita de qué capacitación se trata.
   */
  const abrirHoja = () => {
    y = M

    const tituloH = 11, fichaH = 5.5, logoW = 42
    const bloqueLogoH = tituloH + fichaH * 2

    if (p.companyLogo) {
      bd(M, y, logoW, bloqueLogoH)
      try {
        const fmt = /^data:image\/jpe?g/i.test(p.companyLogo) ? 'JPEG' : 'PNG'
        const iw = dimsLogo?.w ?? 0, ih = dimsLogo?.h ?? 0
        const maxW = logoW - 5, maxH = bloqueLogoH - 4
        const ok = iw > 0 && ih > 0 && isFinite(iw) && isFinite(ih)
        const escala = ok ? Math.min(maxW / iw, maxH / ih) : 0
        const w = ok ? iw * escala : maxW
        const h = ok ? ih * escala : maxH
        doc.addImage(p.companyLogo, fmt, M + (logoW - w) / 2, y + (bloqueLogoH - h) / 2, w, h)
      } catch {}
    } else {
      cl(M, y, logoW, bloqueLogoH, p.companyName || '', { bold: true, size: 8 })
    }

    const xd = M + logoW, wd = usable - logoW
    cl(xd, y, wd, tituloH, 'REGISTRO DE ASISTENCIA A CAPACITACIÓN Y/O EVENTOS', { bold: true, size: 10.5 })
    y += tituloH

    const fw = [wd * 0.13, wd * 0.20, wd * 0.14, wd * 0.265, wd * 0.265]
    const fx = fw.reduce((a: number[], w, i) => { a.push(i === 0 ? xd : a[i-1] + fw[i-1]); return a }, [])
    const rot = ['Versión', 'Código', 'Área', 'Fecha de Elaboración', 'Fecha de Revisión']
    const val = ['1', 'AVC-FR05', 'CEO', '14/10/2025', '22/01/2026']
    rot.forEach((t, i) => cl(fx[i], y, fw[i], fichaH, t, { bold: true, size: 6 }))
    y += fichaH
    val.forEach((t, i) => cl(fx[i], y, fw[i], fichaH, t, { size: 6.5 }))
    y += fichaH

    // Fecha / Horario / Intensidad
    const datoH = 8
    const rotW = 30, campoW = (usable - rotW * 3) / 3
    const par = (i: number) => M + i * (rotW + campoW)
    const datos: [string, string][] = [
      ['FECHA', p.eventDate], ['HORARIO', p.schedule], ['INTENSIDAD', p.intensity],
    ]
    datos.forEach(([rotulo, valor], i) => {
      cl(par(i), y, rotW, datoH, rotulo, { bg: CG, color: CW, bold: true, size: 6.5 })
      cl(par(i) + rotW, y, campoW, datoH, valor, { size: 6.5 })
    })
    y += datoH

    // Organizado / Realizado / Dirigido
    cl(par(0), y, rotW, datoH, 'ORGANIZADO POR', { bg: CG, color: CW, bold: true, size: 6 })
    cl(par(0) + rotW, y, campoW, datoH, p.organizedBy, { size: 6 })
    cl(par(1), y, rotW, datoH, 'REALIZADO POR', { bg: CG, color: CW, bold: true, size: 6 })
    const rpX = par(1) + rotW
    fl(rpX, y, campoW, datoH, CW); bd(rpX, y, campoW, datoH)
    doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(0,0,0)
    doc.text(p.instructor, rpX + campoW/2, y + 3.4, { align: 'center' })
    doc.setFontSize(5); doc.setFont('helvetica','normal')
    doc.text('Profesional SST', rpX + campoW/2, y + 6.4, { align: 'center' })
    cl(par(2), y, rotW, datoH, 'DIRIGIDO A', { bg: CG, color: CW, bold: true, size: 6 })
    cl(par(2) + rotW, y, campoW, datoH, p.directedTo.toUpperCase(), { size: 6 })
    y += datoH

    // Temario
    cl(M, y, usable, 6, 'TEMARIO DEL EVENTO', { bg: CG, color: CW, bold: true, size: 8 })
    y += 6
    cl(M, y, usable, 6, p.trainingTitle, { bold: true, size: 7.5, align: 'left' })
    y += 6
    doc.setFontSize(6.5); doc.setFont('helvetica','normal')
    for (let i = 0; i < RENGLONES_TEMARIO; i++) {
      fl(M, y, usable, temH, CW); bd(M, y, usable, temH)
      if (lineasTemario[i]) {
        doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0)
        justifyLine(lineasTemario[i], M, y + 3.4, usable,
          i === lineasTemario.length - 1 || i === RENGLONES_TEMARIO - 1)
      }
      y += temH
    }

    // Cabecera de la tabla de participantes
    cl(M, y, usable, 6, 'REGISTRO DE PARTICIPANTES', { bg: CG, color: CW, bold: true, size: 8 })
    y += 6
    cl(xN,   y, COL.n,     thH, 'Nº',                  { bg: CLO, bold: true, size: 7 })
    cl(xCed, y, COL.ced,   thH, 'CÉDULA',              { bg: CLO, bold: true, size: 7 })
    cl(xNom, y, COL.nom,   thH, 'NOMBRES Y APELLIDOS', { bg: CLO, bold: true, size: 7 })
    cl(xCar, y, COL.cargo, thH, 'CARGO',               { bg: CLO, bold: true, size: 7 })
    cl(xFir, y, COL.firma, thH, 'FIRMA',               { bg: CLO, bold: true, size: 7 })
    y += thH
  }

  /** El pie de la hoja: la firma del capacitador y el número de hoja. */
  const cerrarHoja = (hoja: number, hojas: number) => {
    y += 7

    const lineaW = 70
    const lineaX = M + (usable - lineaW) / 2

    if (p.capacitadorFirma) {
      try {
        const fmt = /^data:image\/jpe?g/i.test(p.capacitadorFirma) ? 'JPEG' : 'PNG'
        const aspect = (dimsFirma?.w || 4) / (dimsFirma?.h || 1)
        const h = Math.min(12, lineaW / aspect)
        const w = h * aspect
        doc.addImage(p.capacitadorFirma, fmt, M + (usable - w) / 2, y - 2, w, h)
        y += h - 2
      } catch { y += 9 }
    } else {
      y += 10
    }

    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.4)
    doc.line(lineaX, y, lineaX + lineaW, y)
    y += 4.5
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
    doc.text('CAPACITADOR', M + usable / 2, y, { align: 'center' })

    if (p.capacitadorNombre) {
      y += 4
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
      doc.text(p.capacitadorNombre, M + usable / 2, y, { align: 'center' })
      if (p.capacitadorCargo) {
        y += 3.5
        doc.setFontSize(6.5); doc.setTextColor(90, 90, 90)
        doc.text(p.capacitadorCargo, M + usable / 2, y, { align: 'center' })
      }
    }

    // Cuántas hojas son, como se numera a mano cuando se toma otra.
    if (hojas > 1) {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
      doc.text(`Hoja ${hoja} de ${hojas}`, W - M, H - M + 1, { align: 'right' })
    }
  }

  // ── Cuánto cabe por hoja ──
  // Se arma una hoja en vacío para saber dónde empieza la tabla; de ahí sale
  // el alto de renglón que deja caber veinte y la firma del final.
  abrirHoja()
  const yTabla = y
  const MINIMO = 20
  const disponible = fondo - yTabla - FIRMA_H
  const rowH = Math.max(6, Math.min(9, disponible / MINIMO))
  const porHoja = Math.max(MINIMO, Math.floor(disponible / rowH))

  const sellar = p.sellarVacias !== false
  const totalR = Math.max(p.participants.length, MINIMO)
  const hojas = Math.ceil(totalR / porHoja)

  for (let hoja = 0; hoja < hojas; hoja++) {
    if (hoja > 0) { doc.addPage(); abrirHoja() }

    // La hoja se dibuja entera, con sus renglones numerados hasta abajo, como
    // el formato en blanco. Lo que sobre se anula más abajo, salvo que se pida
    // dejarlo libre para firmar a mano en la jornada.
    const desde = hoja * porHoja
    const hasta = desde + porHoja
    const yPrimeraFila = y

    for (let r = desde; r < hasta; r++) {
      const part = p.participants[r]
      cl(xN,   y, COL.n,     rowH, String(r+1),        { bg: CW, bold: true, size: 7 })
      cl(xCed, y, COL.ced,   rowH, part?.cedula || '', { bg: CW, size: 7 })
      cl(xNom, y, COL.nom,   rowH, part?.name   || '', { bg: CW, size: 7, align: 'left' })
      cl(xCar, y, COL.cargo, rowH, part?.cargo  || '', { bg: CW, size: 6, align: 'left' })
      fl(xFir, y, COL.firma, rowH, CW); bd(xFir, y, COL.firma, rowH)
      if (part?.signature && sigDims[r]) {
        try {
          const { w: iw, h: ih } = sigDims[r]
          const aspect = iw / (ih || 1)
          const maxH = rowH - 1.5, maxW = COL.firma - 4
          const drawH = Math.min(maxH, maxW / aspect)
          const drawW = drawH * aspect
          doc.addImage(part.signature, 'PNG',
            xFir + (COL.firma - drawW) / 2, y + (rowH - drawH) / 2, drawW, drawH)
        } catch {}
      }
      y += rowH
    }

    // Sellar lo que sobró: una diagonal sobre los renglones sin firmar, como
    // se raya en papel para cerrar el registro y que nadie agregue un nombre
    // después. Se marcan solo las casillas, no la numeración.
    const vacíasDesde = Math.max(desde, p.participants.length)
    if (sellar && vacíasDesde < hasta) {
      const yArriba = yPrimeraFila + (vacíasDesde - desde) * rowH
      const yAbajo  = yPrimeraFila + (hasta - desde) * rowH
      const x1 = xCed, x2 = M + usable
      doc.setDrawColor(70, 70, 70); doc.setLineWidth(0.5)
      doc.line(x1, yArriba, x2, yAbajo)
      doc.line(x1, yAbajo, x2, yArriba)
      doc.setFontSize(7); doc.setFont('helvetica', 'bold')
      const rot = 'ESPACIO ANULADO'
      const anchoRot = doc.getTextWidth(rot)
      const cx = (x1 + x2) / 2, cy = (yArriba + yAbajo) / 2
      // Un respiro blanco detrás del rótulo, que si no se lee sobre las aspas.
      fl(cx - anchoRot / 2 - 2, cy - 2.4, anchoRot + 4, 4.8, CW)
      doc.setTextColor(70, 70, 70)
      doc.text(rot, cx, cy + 1.3, { align: 'center' })
    }

    cerrarHoja(hoja + 1, hojas)
  }

  return doc.output('blob')
}
