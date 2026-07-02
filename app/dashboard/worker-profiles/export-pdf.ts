import type { Analytics } from '@/lib/profile-analytics'
import { generateAutoText } from '@/lib/profile-analytics'

// ── Colors ────────────────────────────────────────────────────────────
const C = {
  navy:    [15,  36,  86]  as [number,number,number],
  blue:    [37,  99,  235] as [number,number,number],
  teal:    [20,  184, 166] as [number,number,number],
  white:   [255, 255, 255] as [number,number,number],
  light:   [241, 245, 249] as [number,number,number],
  gray:    [100, 116, 139] as [number,number,number],
  dark:    [15,  23,  42]  as [number,number,number],
  green:   [16,  185, 129] as [number,number,number],
  red:     [239, 68,  68]  as [number,number,number],
  amber:   [245, 158, 11]  as [number,number,number],
  palette: [
    [37,99,235],[16,185,129],[245,158,11],[139,92,246],
    [239,68,68],[6,182,212],[249,115,22],[236,72,153],
  ] as [number,number,number][],
}

const W = 210; const H = 297
const ML = 18; const MR = 18; const CW = W - ML - MR  // content width = 174mm

export async function exportToPDF(analytics: Analytics, company = 'Organización') {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

  let pageNum = 0

  // ── Helpers ──────────────────────────────────────────────────────────
  const fill = (r: number, g: number, b: number) => doc.setFillColor(r, g, b)
  const stroke = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b)
  const textColor = (r: number, g: number, b: number) => doc.setTextColor(r, g, b)

  function rect(x: number, y: number, w: number, h: number, color: [number,number,number], style: 'F'|'S'|'FD' = 'F') {
    fill(...color); doc.rect(x, y, w, h, style)
  }

  function text(str: string, x: number, y: number, size: number, color: [number,number,number], bold = false, align: 'left'|'center'|'right' = 'left') {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    textColor(...color)
    doc.text(str, x, y, { align })
  }

  function header(title: string, sub = '') {
    rect(0, 0, W, 18, C.navy)
    text(`CAMPUS SST  ·  ${company}`, ML, 8, 7, C.teal, true)
    text(title.toUpperCase(), ML, 13.5, 8, C.white, true)
    if (sub) { text(sub, W - MR, 13.5, 7, [180,200,220], false, 'right') }
    pageNum++
    text(`Pág. ${pageNum}`, W - MR, H - 6, 7, C.gray, false, 'right')
    text(`Generado: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`, ML, H - 6, 7, C.gray)
    rect(ML, H - 10, CW, 0.3, C.teal)
  }

  function sectionTitle(title: string, y: number): number {
    rect(ML, y, CW, 7, C.light)
    rect(ML, y, 3, 7, C.blue)
    text(title, ML + 6, y + 5, 9, C.navy, true)
    return y + 10
  }

  // Horizontal bar chart
  function hBarChart(
    data: { label: string; n: number; pct: number }[],
    x: number, y: number, maxW: number, barH: number,
    color: [number,number,number] = C.blue,
    limit = 10
  ): number {
    const rows = data.slice(0, limit)
    const maxN = Math.max(...rows.map(r => r.n), 1)
    const labelW = 52; const valueW = 20
    rows.forEach((row, i) => {
      const ry = y + i * (barH + 3)
      const bw = ((row.n / maxN) * (maxW - labelW - valueW))
      // label
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); textColor(...C.gray)
      const lbl = row.label.length > 26 ? row.label.slice(0, 25) + '…' : row.label
      doc.text(lbl, x, ry + barH - 0.5)
      // bar bg
      fill(...C.light); doc.rect(x + labelW, ry, maxW - labelW - valueW, barH, 'F')
      // bar fill
      fill(...color); doc.rect(x + labelW, ry, bw, barH, 'F')
      // value
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); textColor(...C.dark)
      doc.text(`${row.n}  (${row.pct}%)`, x + labelW + bw + 2, ry + barH - 0.5)
    })
    return y + rows.length * (barH + 3) + 3
  }

  // Boolean bar (two-color)
  function boolBar(
    label: string, si: number, no: number, pctSi: number,
    x: number, y: number, w: number, barH = 5
  ): number {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); textColor(...C.gray)
    doc.text(label, x, y + barH - 0.5)
    const bx = x + 60; const bw = w - 60
    const siW = (pctSi / 100) * bw
    fill(...C.green); doc.rect(bx, y, siW, barH, 'F')
    fill(...C.red);   doc.rect(bx + siW, y, bw - siW, barH, 'F')
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold')
    if (siW > 12) { textColor(...C.white); doc.text(`SÍ ${si}`, bx + 2, y + barH - 0.8) }
    if (bw - siW > 12) { textColor(...C.white); doc.text(`NO ${no}`, bx + siW + 2, y + barH - 0.8) }
    doc.setFontSize(7); textColor(...C.dark)
    doc.text(`${pctSi}%`, x + w + 2, y + barH - 0.5)
    return y + barH + 4
  }

  function kpiBox(label: string, value: string, x: number, y: number, w: number, h: number, color: [number,number,number] = C.blue) {
    rect(x, y, w, h, C.light)
    rect(x, y, w, 1.5, color)
    text(value, x + w / 2, y + h / 2 + 1, 12, color, true, 'center')
    text(label, x + w / 2, y + h - 4, 6.5, C.gray, false, 'center')
  }

  function wrapText(str: string, x: number, y: number, maxW: number, lineH: number, size: number, color: [number,number,number]): number {
    doc.setFontSize(size); doc.setFont('helvetica', 'normal'); textColor(...color)
    const lines = doc.splitTextToSize(str, maxW) as string[]
    lines.forEach((line: string, i: number) => doc.text(line, x, y + i * lineH))
    return y + lines.length * lineH + 2
  }

  const newPage = (title: string, sub = '') => {
    doc.addPage(); header(title, sub)
  }

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 1 — PORTADA
  // ══════════════════════════════════════════════════════════════════════
  rect(0, 0, W, 80, C.navy)
  rect(0, 78, W, 3, C.teal)
  text('CARACTERIZACIÓN', W / 2, 32, 22, C.white, true, 'center')
  text('SOCIODEMOGRÁFICA', W / 2, 44, 22, C.white, true, 'center')
  text('DE LA POBLACIÓN TRABAJADORA', W / 2, 54, 13, C.teal, false, 'center')
  rect(0, 83, W, H - 83, C.light)

  // Info boxes
  const boxW = (CW - 10) / 3
  const bx = [ML, ML + boxW + 5, ML + (boxW + 5) * 2]
  const by = 92
  ;[
    ['Empresa', company],
    ['Período', new Date().getFullYear().toString()],
    ['Fecha', new Date().toLocaleDateString('es-CO')],
  ].forEach(([lbl, val], i) => {
    rect(bx[i], by, boxW, 22, C.white)
    rect(bx[i], by, boxW, 1.5, C.blue)
    text(lbl.toUpperCase(), bx[i] + boxW / 2, by + 9, 7, C.gray, false, 'center')
    text(val, bx[i] + boxW / 2, by + 17, 9, C.navy, true, 'center')
  })

  // Big KPIs
  const kW = (CW - 15) / 4
  const ky = 126
  ;[
    { lbl: 'Trabajadores', val: String(analytics.total), color: C.blue },
    { lbl: 'Completitud promedio', val: `${analytics.avgPct}%`, color: C.teal },
    { lbl: 'Edad promedio', val: analytics.avgAge ? `${analytics.avgAge} años` : '—', color: [139,92,246] as [number,number,number] },
    { lbl: 'Fichas al 100%', val: String(analytics.complete80), color: C.green },
  ].forEach(({ lbl, val, color }, i) => {
    kpiBox(lbl, val, ML + i * (kW + 5), ky, kW, 26, color)
  })

  // Disclaimer
  text('Informe generado automáticamente por Campus SST', W / 2, H - 20, 8, C.gray, false, 'center')
  text('Confidencial — Uso interno', W / 2, H - 15, 8, C.gray, false, 'center')
  pageNum = 1

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 2 — RESUMEN EJECUTIVO
  // ══════════════════════════════════════════════════════════════════════
  newPage('Resumen Ejecutivo')
  const { resumen, conclusiones } = generateAutoText(analytics, company)

  let y = 24
  y = sectionTitle('Hallazgos principales', y)
  y = wrapText(resumen, ML, y, CW, 5.5, 8.5, C.dark)
  y += 4

  // Summary KPI grid
  const kpis = [
    { lbl: '% Con estrés laboral', val: `${analytics.estres.pctSi}%`, c: C.red },
    { lbl: '% Actividad física', val: `${analytics.actividadFisica.pctSi}%`, c: C.green },
    { lbl: '% Fumadores', val: `${analytics.fuma.pctSi}%`, c: C.amber },
    { lbl: 'Acc. laborales previos', val: `${analytics.accidentesTrabajo.pctSi}%`, c: C.red },
    { lbl: 'IMC promedio', val: analytics.avgImc ? String(analytics.avgImc) : '—', c: analytics.avgImc && analytics.avgImc >= 25 ? C.amber : C.green },
    { lbl: 'Horas sueño promedio', val: analytics.avgHorasSueno ? `${analytics.avgHorasSueno}h` : '—', c: C.blue },
  ]
  const kw2 = (CW - 10) / 3
  kpis.forEach(({ lbl, val, c }, i) => {
    const col = i % 3; const row = Math.floor(i / 3)
    kpiBox(lbl, val, ML + col * (kw2 + 5), y + row * 26, kw2, 22, c)
  })
  y += 58

  y = sectionTitle('Alertas y recomendaciones', y)
  conclusiones.forEach(c => {
    fill(...C.amber); doc.rect(ML, y, 2.5, 5.5, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); textColor(...C.dark)
    const lines = doc.splitTextToSize(c, CW - 8) as string[]
    lines.forEach((l: string, li: number) => doc.text(l, ML + 5, y + 4.5 + li * 4.5))
    y += Math.max(lines.length * 4.5, 7) + 4
    if (y > H - 25) { newPage('Resumen Ejecutivo (cont.)'); y = 24 }
  })

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 3 — DEMOGRAFÍA
  // ══════════════════════════════════════════════════════════════════════
  newPage('Información Demográfica')
  y = 24
  const half = CW / 2 - 4

  // Sexo (left) + Estado civil (right)
  y = sectionTitle('Distribución por sexo y estado civil', y)
  text('Sexo', ML, y + 4, 8, C.navy, true)
  hBarChart(analytics.sexo, ML, y + 6, half, 5, C.blue)
  text('Estado civil', ML + half + 8, y + 4, 8, C.navy, true)
  hBarChart(analytics.estadoCivil, ML + half + 8, y + 6, half, 5, C.teal)
  y += analytics.sexo.length * 8 + 18

  if (y > H - 60) { newPage('Demografía (cont.)'); y = 24 }
  y = sectionTitle('Grupos de edad', y)
  y = hBarChart(analytics.ageGroups, ML, y, CW, 6, C.blue, 6) + 4

  if (y > H - 50) { newPage('Demografía (cont.)'); y = 24 }
  y = sectionTitle('Ciudad de residencia (top 10)', y)
  y = hBarChart(analytics.ciudad, ML, y, CW, 5, [139,92,246], 10) + 4

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 4 — VIVIENDA
  // ══════════════════════════════════════════════════════════════════════
  newPage('Vivienda y composición del hogar')
  y = 24
  y = sectionTitle('Tipo y tenencia de vivienda', y)
  text('Tipo de vivienda', ML, y + 4, 8, C.navy, true)
  hBarChart(analytics.tipoVivienda, ML, y + 6, half, 5, C.blue)
  text('Tenencia', ML + half + 8, y + 4, 8, C.navy, true)
  hBarChart(analytics.tenenciaVivienda, ML + half + 8, y + 6, half, 5, C.teal)
  y += Math.max(analytics.tipoVivienda.length, analytics.tenenciaVivienda.length) * 8 + 18

  y = sectionTitle('Estrato socioeconómico', y)
  y = hBarChart(analytics.estrato, ML, y, CW, 5, C.amber) + 4

  y = sectionTitle('Con quién vive', y)
  y = hBarChart(analytics.conQuienVive, ML, y, CW, 5, [139,92,246]) + 4

  // Averages
  y = sectionTitle('Indicadores del hogar', y)
  ;[
    { lbl: 'Promedio de hijos', val: String(analytics.avgHijos) },
    { lbl: 'Personas promedio en hogar', val: String(analytics.avgPersonasHogar) },
    { lbl: 'Cabeza de hogar', val: `${analytics.cabezaHogar.pctSi}%` },
  ].forEach(({ lbl, val }, i) => kpiBox(lbl, val, ML + i * (kW + 5), y, kW, 22, C.blue))

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 5 — EDUCACIÓN Y LABORAL
  // ══════════════════════════════════════════════════════════════════════
  newPage('Educación y Perfil Laboral')
  y = 24
  y = sectionTitle('Nivel educativo', y)
  y = hBarChart(analytics.nivelEducativo, ML, y, CW, 5.5, C.blue) + 4

  y = sectionTitle('Tipo de contrato y jornada laboral', y)
  text('Tipo de contrato', ML, y + 4, 8, C.navy, true)
  hBarChart(analytics.tipoContrato, ML, y + 6, half, 5, C.teal)
  text('Jornada', ML + half + 8, y + 4, 8, C.navy, true)
  hBarChart(analytics.jornadaLaboral, ML + half + 8, y + 6, half, 5, [139,92,246])
  y += Math.max(analytics.tipoContrato.length, analytics.jornadaLaboral.length) * 8 + 18

  if (y > H - 60) { newPage('Laboral (cont.)'); y = 24 }
  y = sectionTitle('Distribución por áreas', y)
  y = hBarChart(analytics.areas, ML, y, CW, 5, C.blue) + 4

  if (y > H - 40) { newPage('Laboral (cont.)'); y = 24 }
  y = sectionTitle('Condiciones laborales', y)
  y = boolBar('Realiza horas extras', analytics.horasExtras.si, analytics.horasExtras.no, analytics.horasExtras.pctSi, ML, y, CW)
  y = boolBar('Trabaja fines de semana', analytics.trabFinesSemana.si, analytics.trabFinesSemana.no, analytics.trabFinesSemana.pctSi, ML, y, CW)

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 6 — DESPLAZAMIENTO
  // ══════════════════════════════════════════════════════════════════════
  newPage('Desplazamiento al trabajo')
  y = 24
  y = sectionTitle('Medio de transporte', y)
  y = hBarChart(analytics.medioTransporte, ML, y, CW, 5.5, C.teal) + 4
  y = sectionTitle('Tiempo de desplazamiento', y)
  y = hBarChart(analytics.tiempoDesplaz, ML, y, CW, 5.5, C.amber) + 4
  y = sectionTitle('Conducción de vehículo', y)
  y = boolBar('Conduce vehículo propio', analytics.conduceVehiculo.si, analytics.conduceVehiculo.no, analytics.conduceVehiculo.pctSi, ML, y, CW)

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 7 — ESTILOS DE VIDA
  // ══════════════════════════════════════════════════════════════════════
  newPage('Estilos de Vida y Hábitos')
  y = 24
  y = sectionTitle('Actividad física y bienestar', y)
  y = boolBar('Realiza actividad física regularmente', analytics.actividadFisica.si, analytics.actividadFisica.no, analytics.actividadFisica.pctSi, ML, y, CW, 5)
  y = boolBar('Descanso adecuado', analytics.descansoAdecuado.si, analytics.descansoAdecuado.no, analytics.descansoAdecuado.pctSi, ML, y, CW, 5)
  y = boolBar('Desayuna diariamente', analytics.desayunaDisario.si, analytics.desayunaDisario.no, analytics.desayunaDisario.pctSi, ML, y, CW, 5)
  y = boolBar('Consume frutas diariamente', analytics.consumeFrutas.si, analytics.consumeFrutas.no, analytics.consumeFrutas.pctSi, ML, y, CW, 5)
  y = boolBar('Consume verduras diariamente', analytics.consumeVerduras.si, analytics.consumeVerduras.no, analytics.consumeVerduras.pctSi, ML, y, CW, 5)
  if (analytics.avgHorasSueno) {
    kpiBox('Horas de sueño promedio', `${analytics.avgHorasSueno}h`, ML, y + 2, kW, 20, C.blue)
    y += 26
  }

  y = sectionTitle('Hábitos de riesgo', y)
  y = boolBar('Fuma tabaco', analytics.fuma.si, analytics.fuma.no, analytics.fuma.pctSi, ML, y, CW, 5)
  y = boolBar('Consume bebidas energizantes', analytics.consumeEnergizantes.si, analytics.consumeEnergizantes.no, analytics.consumeEnergizantes.pctSi, ML, y, CW, 5)
  y += 4
  y = sectionTitle('Consumo de alcohol', y)
  y = hBarChart(analytics.consumoAlcohol, ML, y, CW, 5, C.amber) + 4

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 8 — SALUD
  // ══════════════════════════════════════════════════════════════════════
  newPage('Antecedentes Médicos y Salud')
  y = 24
  y = sectionTitle('Condiciones médicas personales', y)
  ;[
    ['Hospitalizado anteriormente', analytics.hospitalizado],
    ['Ha tenido cirugías', analytics.cirugias],
    ['Presenta alergias', analytics.alergias],
    ['Medicamentos permanentes', analytics.medicamentosPerm],
    ['Limitación física', analytics.limitacionFisica],
    ['USA gafas formuladas', analytics.usaGafas],
    ['USA audífonos', analytics.usaAudifonos],
  ].forEach(([lbl, b]) => {
    const bs = b as { si: number; no: number; pctSi: number }
    y = boolBar(lbl as string, bs.si, bs.no, bs.pctSi, ML, y, CW, 5)
  })
  y += 4

  if (analytics.enfermedades.length > 0) {
    y = sectionTitle('Enfermedades diagnosticadas más frecuentes', y)
    y = hBarChart(analytics.enfermedades, ML, y, CW, 5, C.red) + 4
  }
  if (analytics.antecedentes.length > 0) {
    if (y > H - 50) { newPage('Salud (cont.)'); y = 24 }
    y = sectionTitle('Antecedentes familiares', y)
    y = hBarChart(analytics.antecedentes, ML, y, CW, 5, [139,92,246]) + 4
  }

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 9 — SALUD OCUPACIONAL Y PSICOSOCIAL
  // ══════════════════════════════════════════════════════════════════════
  newPage('Salud Ocupacional y Riesgo Psicosocial')
  y = 24
  y = sectionTitle('Salud ocupacional', y)
  y = boolBar('Ha sufrido accidentes de trabajo', analytics.accidentesTrabajo.si, analytics.accidentesTrabajo.no, analytics.accidentesTrabajo.pctSi, ML, y, CW, 5)
  y = boolBar('Ha tenido enfermedades laborales', analytics.enfermedadesLaborales.si, analytics.enfermedadesLaborales.no, analytics.enfermedadesLaborales.pctSi, ML, y, CW, 5)
  y = boolBar('Tiene restricciones médicas', analytics.restriccionesMedicas.si, analytics.restriccionesMedicas.no, analytics.restriccionesMedicas.pctSi, ML, y, CW, 5)
  y += 6

  y = sectionTitle('Factores de riesgo psicosocial', y)
  ;[
    ['Trabajo genera estrés', analytics.estres],
    ['Cuenta con apoyo familiar', analytics.apoyoFamiliar],
    ['Tiene otro empleo', analytics.otroEmpleo],
    ['Es cuidador de otra persona', analytics.esCuidador],
    ['Dificultades económicas', analytics.dificultadesEconomicas],
    ['Buen equilibrio trabajo/vida', analytics.equilibrioVida],
  ].forEach(([lbl, b]) => {
    const bs = b as { si: number; no: number; pctSi: number }
    y = boolBar(lbl as string, bs.si, bs.no, bs.pctSi, ML, y, CW, 5)
  })

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 10 — DOTACIÓN / TALLAS
  // ══════════════════════════════════════════════════════════════════════
  newPage('Dotación — Distribución de Tallas')
  y = 24
  const k4 = (CW - 15) / 4
  ;[
    { lbl: 'Estatura promedio', val: analytics.avgEstatura ? `${analytics.avgEstatura}cm` : '—' },
    { lbl: 'Peso promedio', val: analytics.avgPeso ? `${analytics.avgPeso}kg` : '—' },
    { lbl: 'IMC promedio', val: analytics.avgImc ? String(analytics.avgImc) : '—' },
    { lbl: 'Con limitación física', val: `${analytics.limitacionFisica.pctSi}%` },
  ].forEach(({ lbl, val }, i) => kpiBox(lbl, val, ML + i * (k4 + 5), y, k4, 22, C.blue))
  y += 28

  const tallasData = [
    { title: 'Camisa', data: analytics.tallaCamisa },
    { title: 'Pantalón', data: analytics.tallaPantalon },
    { title: 'Zapato', data: analytics.tallaZapato },
    { title: 'Botas', data: analytics.tallaBotas },
    { title: 'Overol', data: analytics.tallaOverol },
    { title: 'Chaqueta', data: analytics.tallaChaqueta },
    { title: 'Impermeable', data: analytics.tallaImpermeable },
    { title: 'Guantes', data: analytics.tallaGuantes },
  ]
  const tw = (CW - 6) / 2
  let leftY = y; let rightY = y
  tallasData.forEach(({ title, data }, i) => {
    if (!data.length) return
    const col = i % 2
    const cy = col === 0 ? leftY : rightY
    const cx = col === 0 ? ML : ML + tw + 6
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); textColor(...C.navy)
    doc.text(title, cx, cy)
    const ny = hBarChart(data, cx, cy + 3, tw, 4.5, C.teal[0] > 0 ? C.teal : C.blue) + 2
    if (col === 0) leftY = ny; else rightY = ny
    if (cy > H - 30) { newPage('Dotación (cont.)'); leftY = 24; rightY = 24 }
  })

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 11 — COMPETENCIAS
  // ══════════════════════════════════════════════════════════════════════
  newPage('Competencias y Certificaciones')
  y = 24
  y = sectionTitle('Licencias de conducción', y)
  y = boolBar('Tiene licencia de conducción', analytics.licenciaConduccion.si, analytics.licenciaConduccion.no, analytics.licenciaConduccion.pctSi, ML, y, CW, 5)
  if (analytics.categoriaLicencia.length) {
    y += 4
    y = hBarChart(analytics.categoriaLicencia, ML, y, CW, 5, C.blue) + 6
  }
  if (analytics.certificaciones.length) {
    y = sectionTitle('Certificaciones y competencias', y)
    y = hBarChart(analytics.certificaciones, ML, y, CW, 5.5, C.green) + 4
  }

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 12 — CONCLUSIONES Y RECOMENDACIONES
  // ══════════════════════════════════════════════════════════════════════
  newPage('Conclusiones y Recomendaciones')
  y = 24
  y = sectionTitle('Síntesis de hallazgos', y)
  y = wrapText(resumen, ML, y, CW, 5.5, 8.5, C.dark) + 6

  y = sectionTitle('Recomendaciones para Talento Humano y SG-SST', y)
  conclusiones.forEach((c, idx) => {
    if (y > H - 25) { newPage('Recomendaciones (cont.)'); y = 24 }
    // number circle
    fill(...C.blue); doc.circle(ML + 3.5, y + 3.5, 3.5, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); textColor(...C.white)
    doc.text(String(idx + 1), ML + 3.5, y + 4.8, { align: 'center' })
    // text
    const lines = doc.splitTextToSize(c, CW - 12) as string[]
    doc.setFont('helvetica', 'normal'); textColor(...C.dark); doc.setFontSize(8.5)
    lines.forEach((l: string, li: number) => doc.text(l, ML + 9, y + 4 + li * 5))
    y += Math.max(lines.length * 5, 10) + 5
  })

  // ── Footer last page ──
  y += 10
  if (y > H - 30) { newPage('Cierre'); y = 24 }
  rect(ML, y, CW, 0.5, C.navy)
  y += 5
  text('Este informe fue generado automáticamente por Campus SST a partir de la información suministrada por los trabajadores.', W / 2, y, 7.5, C.gray, false, 'center')
  y += 5
  text('La información contenida es confidencial y de uso exclusivo para gestión interna de Talento Humano y SG-SST.', W / 2, y, 7.5, C.gray, false, 'center')

  doc.save(`Informe_Caracterizacion_${company.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
