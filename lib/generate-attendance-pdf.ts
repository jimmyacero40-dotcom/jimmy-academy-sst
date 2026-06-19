import jsPDF from 'jspdf'

interface Participant {
  name: string
  cedula: string
  cargo: string
  issued: string
  signature: string | null
}

interface AttendanceData {
  training: { title: string; duration: string; description: string; created_at: string }
  participants: Participant[]
  companyName: string
  companyLogo: string
}

export function generateAttendancePDF(data: AttendanceData) {
  const { training, participants, companyName, companyLogo } = data
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const W = 279.4
  const H = 215.9
  const M = 10
  const today = new Date().toLocaleDateString('es-CO')
  let y = M

  const darkGreen = [56, 118, 29] as [number, number, number]
  const orange = [230, 145, 56] as [number, number, number]
  const lightOrange = [253, 228, 196] as [number, number, number]
  const lightGreen = [198, 224, 180] as [number, number, number]
  const white = [255, 255, 255] as [number, number, number]
  const black = [0, 0, 0] as [number, number, number]

  function fillRect(x: number, yy: number, w: number, h: number, color: [number, number, number]) {
    doc.setFillColor(color[0], color[1], color[2])
    doc.rect(x, yy, w, h, 'F')
  }

  function drawRect(x: number, yy: number, w: number, h: number) {
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.3)
    doc.rect(x, yy, w, h, 'S')
  }

  function text(str: string, x: number, yy: number, opts?: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'center' | 'right'; maxW?: number }) {
    const size = opts?.size || 8
    const bold = opts?.bold || false
    const color = opts?.color || black
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(color[0], color[1], color[2])
    let txt = str
    if (opts?.maxW) {
      while (doc.getTextWidth(txt) > opts.maxW && txt.length > 3) txt = txt.slice(0, -1)
      if (txt !== str) txt += '...'
    }
    doc.text(txt, x, yy, { align: opts?.align || 'left' })
  }

  // === HEADER ROW 1: Logo + Title ===
  const headerH = 16
  drawRect(M, y, 45, headerH)

  if (companyLogo) {
    try { doc.addImage(companyLogo, 'PNG', M + 5, y + 2, 35, 12) } catch {}
  } else {
    text(companyName || 'EMPRESA', M + 22.5, y + 10, { size: 8, bold: true, align: 'center' })
  }

  drawRect(M + 45, y, W - 2 * M - 45, headerH)
  text('REGISTRO DE ASISTENCIA A CAPACITACIÓN Y/O EVENTOS', W / 2 + 20, y + 10, { size: 14, bold: true, align: 'center' })
  y += headerH

  // === HEADER ROW 2: Version info ===
  const infoH = 10
  drawRect(M, y, 45, infoH)
  const vCols = ['Versión', 'Código', 'Área', 'Fecha de Elaboración', 'Fecha de Revisión']
  const vVals = ['1', 'AVC-FR05', 'CEO', '14/10/2025', '22/01/2026']
  const vW = (W - 2 * M - 45) / 5
  for (let i = 0; i < 5; i++) {
    drawRect(M + 45 + i * vW, y, vW, infoH / 2)
    text(vCols[i], M + 45 + i * vW + vW / 2, y + 3.5, { size: 6, bold: true, align: 'center' })
    drawRect(M + 45 + i * vW, y + infoH / 2, vW, infoH / 2)
    text(vVals[i], M + 45 + i * vW + vW / 2, y + infoH / 2 + 3.5, { size: 6, align: 'center' })
  }
  y += infoH

  // === ROW 3: FECHA / HORARIO / INTENSIDAD ===
  const row3H = 10
  const col3W = (W - 2 * M) / 3
  for (let i = 0; i < 3; i++) {
    const labels = ['FECHA', 'HORARIO', 'INTENSIDAD']
    const values = [today, '', training.duration || '4h']
    // Label cell
    const labelW = 30
    fillRect(M + i * col3W, y, labelW, row3H, darkGreen)
    drawRect(M + i * col3W, y, labelW, row3H)
    text(labels[i], M + i * col3W + labelW / 2, y + 6.5, { size: 8, bold: true, color: white, align: 'center' })
    // Value cell
    drawRect(M + i * col3W + labelW, y, col3W - labelW, row3H)
    text(values[i], M + i * col3W + labelW + 3, y + 6.5, { size: 8 })
  }
  y += row3H

  // === ROW 4: ORGANIZADO POR / REALIZADO POR / DIRIGIDO A ===
  const row4H = 10
  for (let i = 0; i < 3; i++) {
    const labels = ['ORGANIZADO POR', 'REALIZADO POR', 'DIRIGIDO A']
    const values = [companyName || 'JIMMY ACADEMY', companyName || 'JIMMY ACADEMY', 'TRABAJADORES']
    const labelW = 30
    fillRect(M + i * col3W, y, labelW, row4H, darkGreen)
    drawRect(M + i * col3W, y, labelW, row4H)
    text(labels[i], M + i * col3W + labelW / 2, y + 6.5, { size: 6.5, bold: true, color: white, align: 'center' })
    drawRect(M + i * col3W + labelW, y, col3W - labelW, row4H)
    text(values[i], M + i * col3W + labelW + 3, y + 6.5, { size: 7 })
  }
  y += row4H

  // === TEMARIO DEL EVENTO ===
  fillRect(M, y, W - 2 * M, 7, orange)
  drawRect(M, y, W - 2 * M, 7)
  text('TEMARIO DEL EVENTO', W / 2, y + 5, { size: 9, bold: true, color: white, align: 'center' })
  y += 7

  const temarioH = 20
  drawRect(M, y, W - 2 * M, temarioH)
  text(training.title, M + 3, y + 6, { size: 9, bold: true })
  const desc = training.description || ''
  const descLines = doc.splitTextToSize(desc, W - 2 * M - 6)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(descLines.slice(0, 3), M + 3, y + 11)
  y += temarioH

  // === REGISTRO DE PARTICIPANTES header ===
  y += 2
  fillRect(M, y, W - 2 * M, 7, orange)
  drawRect(M, y, W - 2 * M, 7)
  text('REGISTRO DE PARTICIPANTES', W / 2, y + 5, { size: 9, bold: true, color: white, align: 'center' })
  y += 7

  // === TABLE HEADER ===
  const colWidths = [10, 30, 95, 55, 69.4]
  const colLabels = ['Nº', 'CÉDULA', 'NOMBRES Y APELLIDOS', 'CARGO', 'FIRMA']
  const tableH = 8
  let xPos = M
  for (let i = 0; i < colLabels.length; i++) {
    fillRect(xPos, y, colWidths[i], tableH, lightOrange)
    drawRect(xPos, y, colWidths[i], tableH)
    text(colLabels[i], xPos + colWidths[i] / 2, y + 5.5, { size: 8, bold: true, align: 'center' })
    xPos += colWidths[i]
  }
  y += tableH

  // === PARTICIPANT ROWS ===
  const rowH = 12
  const totalRows = Math.max(participants.length, 15)
  for (let r = 0; r < totalRows; r++) {
    if (y + rowH > H - M) {
      doc.addPage()
      y = M
      // Repeat table header on new page
      xPos = M
      for (let i = 0; i < colLabels.length; i++) {
        fillRect(xPos, y, colWidths[i], tableH, lightOrange)
        drawRect(xPos, y, colWidths[i], tableH)
        text(colLabels[i], xPos + colWidths[i] / 2, y + 5.5, { size: 8, bold: true, align: 'center' })
        xPos += colWidths[i]
      }
      y += tableH
    }

    const p = participants[r]
    xPos = M
    const rowColor = r % 2 === 0 ? white : lightGreen

    for (let i = 0; i < colWidths.length; i++) {
      fillRect(xPos, y, colWidths[i], rowH, rowColor)
      drawRect(xPos, y, colWidths[i], rowH)
      xPos += colWidths[i]
    }

    xPos = M
    text(String(r + 1), xPos + colWidths[0] / 2, y + rowH / 2 + 1.5, { size: 8, bold: true, align: 'center' })
    xPos += colWidths[0]
    if (p) {
      text(p.cedula || '', xPos + 3, y + rowH / 2 + 1.5, { size: 8 })
      xPos += colWidths[1]
      text(p.name || '', xPos + 3, y + rowH / 2 + 1.5, { size: 8, maxW: colWidths[2] - 6 })
      xPos += colWidths[2]
      text(p.cargo || '', xPos + 3, y + rowH / 2 + 1.5, { size: 7, maxW: colWidths[3] - 6 })
      xPos += colWidths[3]

      if (p.signature) {
        try { doc.addImage(p.signature, 'PNG', xPos + 5, y + 1, colWidths[4] - 10, rowH - 2) } catch {}
      }
    }

    y += rowH
  }

  doc.save(`Lista_Asistencia_${training.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`)
}
