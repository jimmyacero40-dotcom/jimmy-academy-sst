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
}

function getImgDims(src: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload  = () => resolve({ w: img.naturalWidth,  h: img.naturalHeight })
    img.onerror = () => resolve({ w: 4, h: 1 })
    img.src = src
  })
}

export async function generateAttendancePDF(p: AttendancePDFParams): Promise<Blob> {
  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  const W = 279.4, M = 8, usable = W - 2 * M
  const CG: [number,number,number] = [56,118,29]
  const CO: [number,number,number] = [230,145,56]
  const CLO: [number,number,number] = [248,216,176]
  const CW: [number,number,number] = [255,255,255]
  const CB: [number,number,number] = [0,0,0]
  const rawW = [16,18,18,20,20,20,20,30,30,30,41]
  const tot  = rawW.reduce((a,b) => a+b, 0)
  const cols = rawW.map(w => (w/tot)*usable)
  const colX = cols.reduce((a: number[], w, i) => {
    a.push(i === 0 ? M : a[i-1] + cols[i-1]); return a
  }, [] as number[])
  const cX = (c: number) => colX[c]
  const cW = (f: number, t: number) => { let w = 0; for (let i = f; i <= t; i++) w += cols[i]; return w }
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

  // Pre-load signature dimensions
  const sigDims: Record<number, { w: number; h: number }> = {}
  for (let r = 0; r < p.participants.length; r++) {
    if (p.participants[r]?.signature) {
      sigDims[r] = await getImgDims(p.participants[r].signature!)
    }
  }

  const justifyLine = (line: string, x: number, y: number, maxW: number, isLast: boolean) => {
    const words = line.trim().split(' ')
    if (isLast || words.length <= 1) { doc.text(line, x+2, y); return }
    const totalW = words.reduce((s, w) => s + doc.getTextWidth(w), 0)
    const gap = (maxW - 4 - totalW) / (words.length - 1)
    let cx = x + 2
    words.forEach(w => { doc.text(w, cx, y); cx += doc.getTextWidth(w) + gap })
  }

  let y = M
  const r0H = 14, logoW = cW(0, 1)

  // Logo + title
  if (p.companyLogo) {
    bd(cX(0), y, logoW, r0H)
    try { doc.addImage(p.companyLogo, 'PNG', cX(0)+2, y+1, logoW-4, r0H-2) } catch {}
  } else {
    cl(cX(0), y, logoW, r0H, p.companyName || '', { bold: true, size: 8 })
  }
  cl(cX(2), y, cW(2,10), r0H, 'REGISTRO DE ASISTENCIA A CAPACITACIÓN Y/O EVENTOS', { bold: true, size: 12 })
  y += r0H

  // Version/code labels
  cl(cX(0), y, logoW, 6, '')
  cl(cX(2), y, cols[2], 6, 'Versión', { bold: true, size: 6.5 })
  cl(cX(3), y, cW(3,4), 6, 'Código',  { bold: true, size: 6.5 })
  cl(cX(5), y, cols[5], 6, 'Área',    { bold: true, size: 6.5 })
  cl(cX(6), y, cW(6,8), 6, 'Fecha de Elaboración', { bold: true, size: 6.5 })
  cl(cX(9), y, cW(9,10), 6, 'Fecha de Revisión',   { bold: true, size: 6.5 })
  y += 6

  // Version/code values
  cl(cX(0), y, logoW, 6, '')
  cl(cX(2), y, cols[2], 6, '1',          { size: 7 })
  cl(cX(3), y, cW(3,4), 6, 'AVC-FR05',  { size: 7 })
  cl(cX(5), y, cols[5], 6, 'CEO',        { size: 7 })
  cl(cX(6), y, cW(6,8), 6, '14/10/2025',{ size: 7 })
  cl(cX(9), y, cW(9,10), 6, '22/01/2026',{ size: 7 })
  y += 6

  // Fecha / Horario / Intensidad
  cl(cX(0), y, cW(0,1), 9, 'FECHA',      { bg: CG, color: CW, bold: true, size: 8 })
  cl(cX(2), y, cW(2,3), 9, p.eventDate,  { size: 8 })
  cl(cX(4), y, cW(4,5), 9, 'HORARIO',    { bg: CG, color: CW, bold: true, size: 8 })
  cl(cX(6), y, cW(6,7), 9, p.schedule,   { size: 7 })
  cl(cX(8), y, cW(8,9), 9, 'INTENSIDAD', { bg: CG, color: CW, bold: true, size: 8 })
  cl(cX(10), y, cols[10], 9, p.intensity, { size: 7 })
  y += 9

  // Organizado / Realizado / Dirigido
  cl(cX(0), y, cW(0,1), 9, 'ORGANIZADO POR', { bg: CG, color: CW, bold: true, size: 7 })
  cl(cX(2), y, cW(2,3), 9, p.organizedBy,    { size: 6 })
  cl(cX(4), y, cW(4,5), 9, 'REALIZADO POR',  { bg: CG, color: CW, bold: true, size: 7 })
  const rpX = cX(6), rpW = cW(6,7)
  fl(rpX, y, rpW, 9, CW); bd(rpX, y, rpW, 9)
  doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(0,0,0)
  doc.text(p.instructor, rpX + rpW/2, y+3.5, { align: 'center' })
  doc.setFontSize(5.5); doc.setFont('helvetica','normal')
  doc.text('Profesional SST', rpX + rpW/2, y+7, { align: 'center' })
  cl(cX(8), y, cW(8,9), 9, 'DIRIGIDO A', { bg: CG, color: CW, bold: true, size: 7 })
  cl(cX(10), y, cols[10], 9, p.directedTo.toUpperCase(), { size: 7 })
  y += 9

  // Temario
  cl(cX(0), y, usable, 7, 'TEMARIO DEL EVENTO', { bg: CO, color: CW, bold: true, size: 9 })
  y += 7
  cl(cX(0), y, usable, 6, p.trainingTitle, { bold: true, size: 8, align: 'left' })
  y += 6
  const dl: string[] = p.trainingTemario ? doc.splitTextToSize(p.trainingTemario, usable-4) : []
  for (let i = 0; i < 8; i++) {
    if (!dl[i] && i > 0 && !dl[i-1]) break
    fl(cX(0), y, usable, 6, CW); bd(cX(0), y, usable, 6)
    if (dl[i]) {
      doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0)
      justifyLine(dl[i], cX(0), y+4.5, usable, i === dl.length-1)
    }
    y += 6
  }

  // Participants
  cl(cX(0), y, usable, 7, 'REGISTRO DE PARTICIPANTES', { bg: CO, color: CW, bold: true, size: 9 })
  y += 7
  const thH = 8
  const drawTH = () => {
    cl(cX(0),  y, cols[0],  thH, 'Nº',                 { bg: CLO, bold: true, size: 8 })
    cl(cX(1),  y, cW(1,2),  thH, 'CÉDULA',             { bg: CLO, bold: true, size: 8 })
    cl(cX(3),  y, cW(3,6),  thH, 'NOMBRES Y APELLIDOS',{ bg: CLO, bold: true, size: 8 })
    cl(cX(7),  y, cW(7,9),  thH, 'CARGO',              { bg: CLO, bold: true, size: 8 })
    cl(cX(10), y, cols[10], thH, 'FIRMA',              { bg: CLO, bold: true, size: 8 })
    y += thH
  }
  drawTH()

  const rowH = 10, totalR = Math.max(p.participants.length, 20)
  for (let r = 0; r < totalR; r++) {
    if (y + rowH > 215.9 - M) { doc.addPage(); y = M; drawTH() }
    const part = p.participants[r]
    cl(cX(0), y, cols[0],  rowH, String(r+1),       { bg: CW, bold: true, size: 8 })
    cl(cX(1), y, cW(1,2),  rowH, part?.cedula || '', { bg: CW, size: 8 })
    cl(cX(3), y, cW(3,6),  rowH, part?.name   || '', { bg: CW, size: 8, align: 'left' })
    cl(cX(7), y, cW(7,9),  rowH, part?.cargo  || '', { bg: CW, size: 7, align: 'left' })
    fl(cX(10), y, cols[10], rowH, CW); bd(cX(10), y, cols[10], rowH)
    if (part?.signature && sigDims[r]) {
      try {
        const { w: iw, h: ih } = sigDims[r]
        const aspect = iw / (ih || 1)
        const maxH = rowH - 2, maxW = cols[10] - 4
        const drawH = Math.min(maxH, maxW / aspect)
        const drawW = drawH * aspect
        doc.addImage(part.signature, 'PNG',
          cX(10) + (cols[10] - drawW) / 2,
          y      + (rowH    - drawH) / 2,
          drawW, drawH)
      } catch {}
    }
    y += rowH
  }

  return doc.output('blob')
}
