import jsPDF from 'jspdf'

interface Participant {
  name: string
  cedula: string
  cargo: string
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
  const M = 8
  const usable = W - 2 * M
  const today = new Date().toLocaleDateString('es-CO')

  // Colors
  const C_GREEN: [number, number, number] = [56, 118, 29]
  const C_ORANGE: [number, number, number] = [230, 145, 56]
  const C_LIGHT_ORANGE: [number, number, number] = [248, 216, 176]
  const C_LIGHT_GREEN: [number, number, number] = [198, 224, 180]
  const C_WHITE: [number, number, number] = [255, 255, 255]
  const C_BLACK: [number, number, number] = [0, 0, 0]

  // Column positions (11 columns like the Excel: A-K)
  // Proportional widths based on the original format
  const colW = [16, 18, 18, 20, 20, 20, 20, 30, 30, 30, 41]
  // Normalize to usable width
  const totalRaw = colW.reduce((a, b) => a + b, 0)
  const cols = colW.map(w => (w / totalRaw) * usable)
  const colX = cols.reduce((acc: number[], w, i) => { acc.push(i === 0 ? M : acc[i - 1] + cols[i - 1]); return acc }, [] as number[])

  function cellX(col: number) { return colX[col] }
  function cellW(from: number, to: number) { let w = 0; for (let i = from; i <= to; i++) w += cols[i]; return w }

  function fill(x: number, y: number, w: number, h: number, color: [number, number, number]) {
    doc.setFillColor(color[0], color[1], color[2])
    doc.rect(x, y, w, h, 'F')
  }

  function border(x: number, y: number, w: number, h: number) {
    doc.setDrawColor(80, 80, 80)
    doc.setLineWidth(0.25)
    doc.rect(x, y, w, h, 'S')
  }

  function cell(x: number, y: number, w: number, h: number, txt: string, opts?: {
    bg?: [number, number, number]; color?: [number, number, number]; bold?: boolean; size?: number; align?: 'left' | 'center'
  }) {
    if (opts?.bg) fill(x, y, w, h, opts.bg)
    border(x, y, w, h)
    if (!txt) return
    const size = opts?.size || 7
    const bold = opts?.bold || false
    const color = opts?.color || C_BLACK
    const align = opts?.align || 'center'
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(color[0], color[1], color[2])
    const tx = align === 'center' ? x + w / 2 : x + 2
    const ty = y + h / 2 + size * 0.12
    let finalTxt = txt
    const maxW = w - 4
    while (doc.getTextWidth(finalTxt) > maxW && finalTxt.length > 1) finalTxt = finalTxt.slice(0, -1)
    if (finalTxt !== txt && finalTxt.length > 0) finalTxt += '..'
    doc.text(finalTxt, tx, ty, { align: align === 'center' ? 'center' : 'left' })
  }

  let y = M

  // ==========================================
  // ROW 0: Logo (A:B) + Title (C:K) — height 14mm
  // ==========================================
  const r0H = 14
  // Logo area
  const logoW = cellW(0, 1)
  if (companyLogo) {
    border(cellX(0), y, logoW, r0H)
    try { doc.addImage(companyLogo, 'PNG', cellX(0) + 2, y + 1, logoW - 4, r0H - 2) } catch {}
  } else {
    cell(cellX(0), y, logoW, r0H, companyName || '', { bold: true, size: 8 })
  }
  // Title
  cell(cellX(2), y, cellW(2, 10), r0H, 'REGISTRO DE ASISTENCIA A CAPACITACIÓN Y/O EVENTOS', { bold: true, size: 12 })
  y += r0H

  // ==========================================
  // ROW 1: Headers — Versión | Código | Área | Fecha Elaboración | Fecha Revisión
  // ==========================================
  const r1H = 6
  cell(cellX(0), y, logoW, r1H, '') // empty logo continuation
  cell(cellX(2), y, cols[2], r1H, 'Versión', { bold: true, size: 6.5 })
  cell(cellX(3), y, cellW(3, 4), r1H, 'Código', { bold: true, size: 6.5 })
  cell(cellX(5), y, cols[5], r1H, 'Área', { bold: true, size: 6.5 })
  cell(cellX(6), y, cellW(6, 8), r1H, 'Fecha de Elaboración', { bold: true, size: 6.5 })
  cell(cellX(9), y, cellW(9, 10), r1H, 'Fecha de Revisión', { bold: true, size: 6.5 })
  y += r1H

  // ROW 2: Values
  const r2H = 6
  cell(cellX(0), y, logoW, r2H, '') // logo bottom
  cell(cellX(2), y, cols[2], r2H, '1', { size: 7 })
  cell(cellX(3), y, cellW(3, 4), r2H, 'AVC-FR05', { size: 7 })
  cell(cellX(5), y, cols[5], r2H, 'CEO', { size: 7 })
  cell(cellX(6), y, cellW(6, 8), r2H, '14/10/2025', { size: 7 })
  cell(cellX(9), y, cellW(9, 10), r2H, '22/01/2026', { size: 7 })
  y += r2H

  // ==========================================
  // ROW 3: FECHA | HORARIO | INTENSIDAD  (3 label+value pairs)
  // ==========================================
  const r3H = 9
  // FECHA label (A:B)
  cell(cellX(0), y, cellW(0, 1), r3H, 'FECHA', { bg: C_GREEN, color: C_WHITE, bold: true, size: 8 })
  // FECHA value (C:D)
  cell(cellX(2), y, cellW(2, 3), r3H, today, { size: 8 })
  // HORARIO label (E:F)
  cell(cellX(4), y, cellW(4, 5), r3H, 'HORARIO', { bg: C_GREEN, color: C_WHITE, bold: true, size: 8 })
  // HORARIO value (G:H)
  cell(cellX(6), y, cellW(6, 7), r3H, '', { size: 8 })
  // INTENSIDAD label (I)
  cell(cellX(8), y, cellW(8, 9), r3H, 'INTENSIDAD', { bg: C_GREEN, color: C_WHITE, bold: true, size: 8 })
  // INTENSIDAD value (J:K)
  cell(cellX(10), y, cols[10], r3H, training.duration || '4h', { size: 8 })
  y += r3H

  // ==========================================
  // ROW 4: ORGANIZADO POR | REALIZADO POR | DIRIGIDO A
  // ==========================================
  const r4H = 9
  cell(cellX(0), y, cellW(0, 1), r4H, 'ORGANIZADO POR', { bg: C_GREEN, color: C_WHITE, bold: true, size: 7 })
  cell(cellX(2), y, cellW(2, 3), r4H, companyName || '', { size: 7 })
  cell(cellX(4), y, cellW(4, 5), r4H, 'REALIZADO POR', { bg: C_GREEN, color: C_WHITE, bold: true, size: 7 })
  cell(cellX(6), y, cellW(6, 7), r4H, companyName || '', { size: 7 })
  cell(cellX(8), y, cellW(8, 9), r4H, 'DIRIGIDO A', { bg: C_GREEN, color: C_WHITE, bold: true, size: 7 })
  cell(cellX(10), y, cols[10], r4H, 'TRABAJADORES', { size: 7 })
  y += r4H

  // ==========================================
  // ROW 5: TEMARIO DEL EVENTO (full width, orange)
  // ==========================================
  const r5H = 7
  cell(cellX(0), y, usable, r5H, 'TEMARIO DEL EVENTO', { bg: C_ORANGE, color: C_WHITE, bold: true, size: 9 })
  y += r5H

  // ==========================================
  // ROWS 6-11: Temario content (6 rows, full width)
  // ==========================================
  const temarioH = 6
  // First row: training title
  cell(cellX(0), y, usable, temarioH, training.title, { bold: true, size: 8, align: 'left' })
  y += temarioH
  // Description rows
  const descLines = training.description ? doc.splitTextToSize(training.description, usable - 6) : []
  for (let i = 0; i < 5; i++) {
    cell(cellX(0), y, usable, temarioH, descLines[i] || '', { size: 7, align: 'left' })
    y += temarioH
  }

  // ==========================================
  // ROW 12: REGISTRO DE PARTICIPANTES (full width, orange)
  // ==========================================
  cell(cellX(0), y, usable, r5H, 'REGISTRO DE PARTICIPANTES', { bg: C_ORANGE, color: C_WHITE, bold: true, size: 9 })
  y += r5H

  // ==========================================
  // ROW 13: Table header — Nº | CÉDULA (B:C) | NOMBRES Y APELLIDOS (D:G) | CARGO (H:J) | FIRMA (K)
  // ==========================================
  const thH = 8
  cell(cellX(0), y, cols[0], thH, 'Nº', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
  cell(cellX(1), y, cellW(1, 2), thH, 'CÉDULA', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
  cell(cellX(3), y, cellW(3, 6), thH, 'NOMBRES Y APELLIDOS', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
  cell(cellX(7), y, cellW(7, 9), thH, 'CARGO', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
  cell(cellX(10), y, cols[10], thH, 'FIRMA', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
  y += thH

  // ==========================================
  // ROWS 14+: Participant data rows (25 rows)
  // ==========================================
  const rowH = 10
  const totalRows = Math.max(participants.length, 25)

  for (let r = 0; r < totalRows; r++) {
    // New page if needed
    if (y + rowH > 215.9 - M) {
      doc.addPage()
      y = M
      // Repeat header on new page
      cell(cellX(0), y, cols[0], thH, 'Nº', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
      cell(cellX(1), y, cellW(1, 2), thH, 'CÉDULA', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
      cell(cellX(3), y, cellW(3, 6), thH, 'NOMBRES Y APELLIDOS', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
      cell(cellX(7), y, cellW(7, 9), thH, 'CARGO', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
      cell(cellX(10), y, cols[10], thH, 'FIRMA', { bg: C_LIGHT_ORANGE, bold: true, size: 8 })
      y += thH
    }

    const p = participants[r]
    const bg = r % 2 === 1 ? C_LIGHT_GREEN : C_WHITE

    cell(cellX(0), y, cols[0], rowH, String(r + 1), { bg, bold: true, size: 8 })
    cell(cellX(1), y, cellW(1, 2), rowH, p?.cedula || '', { bg, size: 8 })
    cell(cellX(3), y, cellW(3, 6), rowH, p?.name || '', { bg, size: 8, align: 'left' })
    cell(cellX(7), y, cellW(7, 9), rowH, p?.cargo || '', { bg, size: 7, align: 'left' })

    // Firma column
    const fX = cellX(10)
    const fW = cols[10]
    fill(fX, y, fW, rowH, bg)
    border(fX, y, fW, rowH)
    if (p?.signature) {
      try { doc.addImage(p.signature, 'PNG', fX + 2, y + 1, fW - 4, rowH - 2) } catch {}
    }

    y += rowH
  }

  doc.save(`Lista_Asistencia_${training.title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_').slice(0, 40)}.pdf`)
}
