import { ESTADOS, type ReporteHSE } from '@/lib/reportes-hse'

// Misma identidad visual que el resto de informes de la plataforma.
const C = {
  navy:  [15, 36, 86]    as [number, number, number],
  blue:  [37, 99, 235]   as [number, number, number],
  teal:  [20, 184, 166]  as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  gray:  [100, 116, 139] as [number, number, number],
  dark:  [15, 23, 42]    as [number, number, number],
}

const W = 210, H = 297, ML = 18, MR = 18, CW = W - ML - MR
const TOPE = H - 18

const fecha = (s?: string | null) =>
  s ? new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

export async function exportarTarjetaPDF(r: ReporteHSE, empresa = 'Organización') {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  let pagina = 0
  let y = 0

  const texto = (s: string, x: number, yy: number, size: number, color: [number, number, number],
                 bold = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color); doc.text(s, x, yy, { align })
  }
  const caja = (x: number, yy: number, w: number, h: number, color: [number, number, number]) => {
    doc.setFillColor(...color); doc.rect(x, yy, w, h, 'F')
  }

  function cabecera() {
    caja(0, 0, W, 18, C.navy)
    texto(`AgroSafe  ·  ${empresa}`, ML, 8, 7, C.teal, true)
    texto('AVC-FR54  ·  TARJETA DE REPORTE HSE', ML, 13.5, 8, C.white, true)
    if (r.codigo) texto(r.codigo, W - MR, 13.5, 8, C.white, true, 'right')
    pagina++
    texto(`Pág. ${pagina}`, W - MR, H - 6, 7, C.gray, false, 'right')
    texto(`Generado: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`, ML, H - 6, 7, C.gray)
    caja(ML, H - 10, CW, 0.3, C.teal)
    return 26
  }
  function nuevaHoja() { doc.addPage(); y = cabecera() }
  const espacio = (alto: number) => { if (y + alto > TOPE) nuevaHoja() }

  y = cabecera()

  const seccion = (titulo: string) => {
    espacio(14)
    caja(ML, y, CW, 7, C.light); caja(ML, y, 3, 7, C.blue)
    texto(titulo, ML + 6, y + 5, 9, C.navy, true)
    y += 11
  }
  const parrafo = (s: string, sangria = 6, color = C.dark) => {
    for (const l of doc.splitTextToSize(s, CW - sangria)) { espacio(6); texto(l, ML + sangria, y, 9, color); y += 4.6 }
  }
  const rejilla = (datos: [string, string][]) => {
    datos.forEach(([k, v], i) => {
      if (i % 2 === 0) espacio(10)
      const x = ML + (i % 2) * (CW / 2)
      const yy = y
      texto(k.toUpperCase(), x, yy, 6.5, C.gray, true)
      texto(doc.splitTextToSize(v, CW / 2 - 6)[0], x, yy + 4.5, 9, C.dark)
      if (i % 2 === 1 || i === datos.length - 1) y += 10
    })
    y += 2
  }

  // ── Encabezado de la tarjeta ─────────────────────────────────────────
  seccion('DATOS DEL REPORTE')
  rejilla([
    ['Fecha del reporte', fecha(r.fecha_reporte)],
    ['Lugar', r.lugar || '—'],
    ['Nombre y apellido de quien reporta', r.reporta_nombre || '—'],
    ['Cédula', r.reporta_cedula || '—'],
    ['Cargo', r.cargo || '—'],
    ['Área', r.area || '—'],
    ['Finca / centro de trabajo', r.centro_trabajo || '—'],
    ['Estado', ESTADOS[(r.estado ?? 'nuevo') as keyof typeof ESTADOS]?.label ?? '—'],
  ])

  // ── 1. Tipo de reporte ───────────────────────────────────────────────
  seccion('1. TIPO DE REPORTE')
  const tipos = r.tipos ?? []
  if (!tipos.length) parrafo('Sin diligenciar', 6, C.gray)
  else for (const t of tipos) { espacio(5); texto(`•  ${t}`, ML + 6, y, 9, C.dark); y += 4.6 }
  y += 3

  // ── 2. ¿Qué sucedió? ─────────────────────────────────────────────────
  seccion('2. ¿QUÉ SUCEDIÓ? INDIQUE CLARAMENTE LO QUE DESEA REPORTAR')
  parrafo(r.descripcion || 'Sin diligenciar', 6, r.descripcion ? C.dark : C.gray)
  y += 3

  // ── 3. Acción inmediata ──────────────────────────────────────────────
  seccion('3. ACCIÓN INMEDIATA')
  const acciones = r.acciones_inmediatas ?? []
  if (!acciones.length) parrafo('Sin diligenciar', 6, C.gray)
  else for (const a of acciones) { espacio(5); texto(`•  ${a}`, ML + 6, y, 9, C.dark); y += 4.6 }
  espacio(10)
  texto('¿OTRA ACCIÓN O SUGERENCIA?', ML + 6, y, 6.5, C.gray, true); y += 4.6
  parrafo(r.otra_accion || 'Sin diligenciar', 10, r.otra_accion ? C.dark : C.gray)
  y += 3

  // ── 4. Sugerencia de mejora ──────────────────────────────────────────
  seccion('4. SUGERENCIA DE MEJORA O INTERVENCIÓN')
  parrafo(r.sugerencia_mejora || 'Sin diligenciar', 6, r.sugerencia_mejora ? C.dark : C.gray)
  y += 3

  // ── 5. Seguimiento (lo diligencia SST) ───────────────────────────────
  seccion('5. SEGUIMIENTO')
  const sst: [string, string][] = [
    ['Responsable de la gestión', r.responsable_nombre || '—'],
    ['Fecha de asignación', fecha(r.fecha_asignacion)],
    ['Fecha de gestión', fecha(r.fecha_gestion)],
    ['Fecha de cierre', fecha(r.fecha_cierre)],
    ['Nombre de quien recibe la solicitud', r.recibe_nombre || '—'],
    ['N.º de seguimiento en Matriz de Mejoras', r.matriz_mejoras_num || '—'],
  ]
  rejilla(sst)

  for (const [titulo, valor] of [
    ['Observaciones de SST', r.observaciones_sst],
    ['Acción o intervención realizada', r.accion_intervencion],
    ['Observaciones de cierre', r.observaciones_cierre],
  ] as [string, string | null | undefined][]) {
    espacio(10)
    texto(titulo.toUpperCase(), ML + 6, y, 6.5, C.gray, true); y += 4.6
    parrafo(valor || 'Sin diligenciar', 10, valor ? C.dark : C.gray)
    y += 2
  }

  const nombre = (r.codigo || 'reporte').replace(/\s+/g, '_')
  doc.save(`Tarjeta_HSE_${nombre}.pdf`)
}
