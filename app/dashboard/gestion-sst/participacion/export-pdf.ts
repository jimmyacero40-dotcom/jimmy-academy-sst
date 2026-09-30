import { PREGUNTAS, CAMPO_MEJORAS, GRUPO_DE_PELIGRO, type Participacion } from '@/lib/peligros'

// Misma identidad visual que el resto de informes de la plataforma.
const C = {
  navy:  [15, 36, 86]    as [number, number, number],
  blue:  [37, 99, 235]   as [number, number, number],
  teal:  [20, 184, 166]  as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  gray:  [100, 116, 139] as [number, number, number],
  dark:  [15, 23, 42]    as [number, number, number],
  green: [16, 185, 129]  as [number, number, number],
  red:   [239, 68, 68]   as [number, number, number],
}

const W = 210, H = 297, ML = 18, MR = 18, CW = W - ML - MR

export async function exportarFormularioPDF(p: Participacion, empresa = 'Organización') {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  let pagina = 0

  const texto = (s: string, x: number, y: number, size: number, color: [number, number, number],
                 bold = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color); doc.text(s, x, y, { align })
  }
  const caja = (x: number, y: number, w: number, h: number, color: [number, number, number]) => {
    doc.setFillColor(...color); doc.rect(x, y, w, h, 'F')
  }

  function cabecera() {
    caja(0, 0, W, 18, C.navy)
    texto(`AgroSafe  ·  ${empresa}`, ML, 8, 7, C.teal, true)
    texto('PARTICIPACIÓN ANUAL EN LA IDENTIFICACIÓN DE PELIGROS', ML, 13.5, 8, C.white, true)
    pagina++
    texto(`Pág. ${pagina}`, W - MR, H - 6, 7, C.gray, false, 'right')
    texto(`Generado: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`, ML, H - 6, 7, C.gray)
    caja(ML, H - 10, CW, 0.3, C.teal)
    return 26
  }

  let y = cabecera()

  /** Salta de página cuando lo que viene no cabe. */
  const espacio = (alto: number) => { if (y + alto > H - 16) y = cabecera() }

  // ── Identificación ───────────────────────────────────────────────────
  caja(ML, y, CW, 7, C.light); caja(ML, y, 3, 7, C.blue)
  texto('IDENTIFICACIÓN DEL TRABAJADOR', ML + 6, y + 5, 9, C.navy, true)
  y += 11

  const datos: [string, string][] = [
    ['Trabajador', p.trabajador_nombre || '—'],
    ['Cédula', p.trabajador_cedula || '—'],
    ['Empresa', p.empresa || empresa],
    ['Cargo', p.cargo || '—'],
    ['Área', p.area || '—'],
    ['Finca / centro de trabajo', p.centro_trabajo || '—'],
    ['Periodo', p.periodo ? String(p.periodo) : '—'],
    ['Fecha de participación', p.enviado_at
      ? new Date(p.enviado_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—'],
  ]
  datos.forEach(([k, v], i) => {
    const col = i % 2, fila = Math.floor(i / 2)
    const x = ML + col * (CW / 2)
    const yy = y + fila * 10
    texto(k.toUpperCase(), x, yy, 6.5, C.gray, true)
    texto(doc.splitTextToSize(v, CW / 2 - 6)[0], x, yy + 4.5, 9, C.dark)
  })
  y += Math.ceil(datos.length / 2) * 10 + 4

  // ── Respuestas ───────────────────────────────────────────────────────
  caja(ML, y, CW, 7, C.light); caja(ML, y, 3, 7, C.blue)
  texto('RESPUESTAS', ML + 6, y + 5, 9, C.navy, true)
  y += 11

  const parrafo = (s: string, size = 9, color = C.dark, sangria = 6) => {
    const lineas = doc.splitTextToSize(s, CW - sangria)
    for (const l of lineas) { espacio(6); texto(l, ML + sangria, y, size, color); y += 4.6 }
  }

  for (const q of PREGUNTAS) {
    espacio(16)
    texto(`${q.n}. ${q.titulo}`, ML, y, 8.5, C.navy, true)
    y += 5

    if (q.tipo === 'peligros') {
      const lista = p.peligros ?? []
      if (!lista.length) parrafo('Sin respuesta', 9, C.gray)
      else {
        // Agrupados por clase de peligro, que es como se analizan después.
        const porGrupo = new Map<string, string[]>()
        for (const x of lista) {
          const g = GRUPO_DE_PELIGRO[x] ?? 'Otros'
          porGrupo.set(g, [...(porGrupo.get(g) ?? []), x])
        }
        for (const [grupo, items] of porGrupo) {
          espacio(6)
          texto(grupo.toUpperCase(), ML + 6, y, 7, C.teal, true); y += 4.2
          for (const it of items) { espacio(5); texto(`•  ${it}`, ML + 10, y, 8.5, C.dark); y += 4.4 }
          y += 1
        }
      }
      if (p.peligros_otro) { espacio(6); texto('Otro:', ML + 6, y, 8, C.gray, true); y += 4.4; parrafo(p.peligros_otro, 9, C.dark, 10) }
    } else if (q.tipo === 'confirmacion') {
      const ok = p.confirma_participacion === true
      texto(ok ? 'Confirmó su participación' : 'No confirmó', ML + 6, y, 9, ok ? C.green : C.red, true)
      y += 5
    } else {
      parrafo((p[q.campo] as string) || 'Sin respuesta', 9, (p[q.campo] ? C.dark : C.gray))
    }

    if (q.campo === 'controles_suficientes') {
      espacio(10)
      texto(CAMPO_MEJORAS.titulo, ML + 6, y, 8, C.gray, true); y += 4.6
      parrafo(p.oportunidades_mejora || 'Sin respuesta', 9, p.oportunidades_mejora ? C.dark : C.gray, 10)
    }

    y += 3
  }

  const nombre = (p.trabajador_nombre || 'trabajador').replace(/\s+/g, '_')
  doc.save(`Participacion_Peligros_${nombre}_${p.periodo ?? ''}.pdf`)
}
