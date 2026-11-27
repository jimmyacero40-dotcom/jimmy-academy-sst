import { CAMPO_MEJORAS } from '@/lib/peligros'
import type { Resumen, RespuestasDePregunta } from '@/lib/peligros-tabulacion'
import { logoAgrosafeBlanco, marcaEnFranja } from '@/lib/pdf-marca'

/**
 * El consolidado en PDF: lo que se adjunta a la matriz de peligros y lo que
 * pide un auditor como evidencia de la participación.
 *
 * El Excel sirve para seguir calculando; esto sirve para firmar y archivar.
 * Por eso aquí van los números y las respuestas escritas, no las tablas
 * crudas: un auditor lee el documento, no una hoja de cálculo.
 *
 * Misma identidad visual que el formulario individual.
 */
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

export async function exportarResultadosPDF(
  t: Resumen,
  preguntas: RespuestasDePregunta[],
  mejoras: { texto: string; nombre: string }[],
  periodo: number,
  empresa = 'Organización',
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const marca = await logoAgrosafeBlanco()
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
    const xt = marcaEnFranja(doc, marca, ML, 4.5, 9)
    texto(empresa, xt, 8, 7, C.teal, true)
    texto('CONSOLIDADO DE LA IDENTIFICACIÓN DE PELIGROS', xt, 13.5, 8, C.white, true)
    pagina++
    texto(`Pág. ${pagina}`, W - MR, H - 6, 7, C.gray, false, 'right')
    texto(`Periodo ${periodo}  ·  Generado el ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ML, H - 6, 7, C.gray)
    y = 26
  }

  /** Pide sitio; si no cabe, abre página. Evita cortar un bloque por la mitad. */
  const sitio = (alto: number) => { if (y + alto > TOPE) cabecera() }

  cabecera()

  // ── Los cuatro números de arriba ──
  const tarjetas: [string, string][] = [
    ['Total de trabajadores', String(t.totalTrabajadores)],
    ['Participaron', String(t.participantes)],
    ['Pendientes', String(t.pendientes)],
    ['% de participación', `${t.pctParticipacion}%`],
  ]
  const ancho = (CW - 9) / 4
  tarjetas.forEach(([rotulo, valor], i) => {
    const x = ML + i * (ancho + 3)
    caja(x, y, ancho, 17, C.light)
    texto(rotulo.toUpperCase(), x + 3, y + 6, 5.5, C.gray, true)
    texto(valor, x + 3, y + 13.5, 12, C.navy, true)
  })
  y += 24

  const titulo = (s: string) => {
    sitio(14)
    caja(ML, y, CW, 7, C.navy)
    texto(s.toUpperCase(), ML + 3, y + 4.8, 7.5, C.white, true)
    y += 11
  }

  const barras = (filas: { etiqueta: string; n: number; pct: number }[], base: string) => {
    if (!filas.length) { texto('Sin datos.', ML, y, 8, C.gray); y += 7; return }
    const max = Math.max(1, ...filas.map(f => f.n))
    for (const f of filas) {
      sitio(9)
      const etiqueta = doc.splitTextToSize(f.etiqueta, CW - 34)[0]
      texto(etiqueta, ML, y + 3, 8, C.dark)
      texto(`${f.n} · ${f.pct}%`, W - MR, y + 3, 8, C.blue, true, 'right')
      caja(ML, y + 4.5, CW, 1.6, C.light)
      caja(ML, y + 4.5, Math.max(0.5, (f.n / max) * CW), 1.6, C.blue)
      y += 9
    }
    texto(base, ML, y + 2, 6.5, C.gray)
    y += 7
  }

  const respuestas = (lista: { texto: string; nombre: string }[]) => {
    if (!lista.length) { texto('Nadie la respondió.', ML, y, 8, C.gray); y += 7; return }
    for (const r of lista) {
      const lineas = doc.splitTextToSize(r.texto, CW - 6) as string[]
      sitio(lineas.length * 4 + 8)
      caja(ML, y, CW, lineas.length * 4 + 6, C.light)
      texto(lineas.join('\n'), ML + 3, y + 4.5, 7.5, C.dark)
      texto(r.nombre, ML + 3, y + lineas.length * 4 + 4, 6, C.gray)
      y += lineas.length * 4 + 9
    }
  }

  // ── Participación por segmento ──
  titulo('Participación por área')
  barras(t.porArea, 'El porcentaje es sobre el total de cada área.')
  titulo('Participación por finca o centro')
  barras(t.porCentro, 'El porcentaje es sobre el total de cada centro.')

  // ── Pregunta por pregunta ──
  for (const r of preguntas) {
    titulo(`${r.pregunta.n}. ${r.pregunta.titulo}`)
    if (r.conteos.length) {
      barras(r.conteos, `${r.respondieron} de ${t.participantes} la respondieron. El porcentaje es sobre los que participaron.`)
    }
    if (r.textos.length) {
      respuestas(r.textos)
      texto(`${r.respondieron} de ${t.participantes} la respondieron.`, ML, y, 6.5, C.gray)
      y += 7
    }
    if (!r.conteos.length && !r.textos.length) { texto('Nadie la respondió.', ML, y, 8, C.gray); y += 8 }

    // Lo que se podría mejorar va pegado a su pregunta, que es donde se
    // preguntó; suelto al final no se sabría de qué está hablando.
    if (r.pregunta.campo === CAMPO_MEJORAS.campo || (r.pregunta.campo === 'controles_suficientes' && mejoras.length)) {
      titulo(CAMPO_MEJORAS.titulo)
      respuestas(mejoras)
    }
  }

  doc.save(`consolidado-peligros-${periodo}.pdf`)
}
