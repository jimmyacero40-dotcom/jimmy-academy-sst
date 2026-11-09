import { textoCompleto, type Pregunta, type Modulo } from '@/lib/modulos'
import type { FilaModulo } from '@/lib/modulos-tabulacion'

// Misma identidad visual que el resto de informes de la plataforma.
const C = {
  navy:  [15, 36, 86]    as [number, number, number],
  teal:  [20, 184, 166]  as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  gray:  [100, 116, 139] as [number, number, number],
  dark:  [15, 23, 42]    as [number, number, number],
}

const W = 210, H = 297, ML = 18, MR = 18, CW = W - ML - MR
const TOPE = H - 18

/** El formulario de una persona, para imprimir o archivar. */
export async function exportarRespuestaPDF(
  modulo: Modulo, preguntas: Pregunta[], fila: FilaModulo, empresa = 'Organización',
) {
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
    texto(modulo.nombre.toUpperCase().slice(0, 70), ML, 13.5, 8, C.white, true)
    pagina++
    texto(`Pág. ${pagina}`, W - MR, H - 6, 7, C.gray, false, 'right')
    texto(
      `Generado: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ML, H - 6, 7, C.gray)
    y = 26
  }

  /** Abre página nueva si lo que viene no cabe. */
  const sitio = (alto: number) => {
    if (y + alto > TOPE) { doc.addPage(); cabecera() }
  }

  cabecera()

  // ── Quién responde ──
  caja(ML, y, CW, 22, C.light)
  texto(fila.nombre || '', ML + 4, y + 7, 11, C.dark, true)
  texto([
    fila.cedula && `C.C. ${fila.cedula}`,
    fila.cargo,
    fila.area,
    fila.centro_trabajo,
  ].filter(Boolean).join('   ·   ').slice(0, 95), ML + 4, y + 13, 8, C.gray)
  texto(
    fila.enviado_at
      ? `Respondido el ${new Date(fila.enviado_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : 'Sin enviar',
    ML + 4, y + 18.5, 8, C.gray)
  y += 30

  if (modulo.descripcion) {
    const lineas = doc.splitTextToSize(modulo.descripcion, CW) as string[]
    sitio(lineas.length * 4.6 + 4)
    texto(lineas.join('\n'), ML, y, 8.5, C.gray)
    y += lineas.length * 4.6 + 6
  }

  // ── Las preguntas, con lo que respondió ──
  preguntas.forEach((p, i) => {
    const enunciado = doc.splitTextToSize(`${i + 1}. ${p.titulo}`, CW) as string[]
    const valor = textoCompleto(p, fila.respuestas ?? {}) || 'Sin responder'
    // Las de escoger varias se leen mejor una debajo de otra.
    const cuerpo = doc.splitTextToSize(
      p.tipo === 'multiple' ? valor.split(' · ').map(v => `•  ${v}`).join('\n') : valor,
      CW - 4) as string[]

    sitio(enunciado.length * 5 + cuerpo.length * 5 + 10)

    texto(enunciado.join('\n'), ML, y, 9.5, C.dark, true)
    y += enunciado.length * 5 + 1.5

    doc.setDrawColor(...C.light)
    doc.setLineWidth(0.6)
    doc.line(ML, y - 1, ML, y + cuerpo.length * 5 - 2)

    texto(cuerpo.join('\n'), ML + 4, y + 3, 9.5,
      fila.respuestas?.[p.id] ? C.dark : C.gray)
    y += cuerpo.length * 5 + 7
  })

  const limpio = (s: string) => s.replace(/[\\/:*?"<>|]/g, '').trim()
  doc.save(`${limpio(modulo.nombre)} - ${limpio(fila.nombre || 'SIN NOMBRE')}.pdf`)
}
