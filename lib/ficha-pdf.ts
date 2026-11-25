/**
 * La hoja de vida de un trabajador, en PDF.
 *
 * La ficha sociodemográfica se podía consultar en pantalla, pero no sacar.
 * Para una auditoría, para la carpeta del trabajador o para entregársela a
 * él, hacía falta el documento: todas las secciones, con su foto y su firma,
 * y el pie de página que diga de dónde salió y cuándo.
 *
 * Se arma desde `lib/ficha-campos`, igual que la pantalla: agregar una
 * pregunta a la encuesta la hace aparecer aquí sola.
 */

import { FICHA, type CampoFicha } from '@/lib/ficha-campos'
import { calcPct } from '@/lib/perfil-completitud'

const C = {
  verde: [36, 60, 44] as [number, number, number],
  crema: [236, 230, 157] as [number, number, number],
  claro: [243, 246, 243] as [number, number, number],
  gris: [110, 118, 128] as [number, number, number],
  oscuro: [25, 32, 40] as [number, number, number],
  blanco: [255, 255, 255] as [number, number, number],
  ambar: [180, 83, 9] as [number, number, number],
}

const W = 210, H = 297, ML = 15, MR = 15, CW = W - ML - MR

/** Cómo se lee cada respuesta. Lo mismo que muestra la pantalla. */
function comoSeLee(campo: string, v: any): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const [a, m, d] = v.slice(0, 10).split('-')
    return `${d}/${m}/${a}`
  }
  if (campo === 'estatura_cm') return `${v} cm`
  if (campo === 'peso_kg') return `${v} kg`
  if (campo === 'estrato') return `Estrato ${v}`
  return String(v)
}

const esImagen = (c: string) => c === 'photo_url' || c === 'firma_electronica'

/** Las medidas de una imagen, para no deformarla al meterla. */
function medir(src: string): Promise<{ w: number; h: number } | null> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Una imagen de la web, como data URL, que es lo que jsPDF sabe meter. */
async function comoDato(src: string): Promise<string | null> {
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
  } catch {
    return null
  }
}

export async function exportarFichaPDF(
  ficha: Record<string, any>,
  nombre = 'Trabajador',
  empresa = 'Organización',
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

  const pct = calcPct(ficha)
  let pagina = 0
  let y = 0

  const texto = (
    s: string, x: number, yy: number, tam: number,
    color: [number, number, number], negrilla = false,
    alinear: 'left' | 'center' | 'right' = 'left',
  ) => {
    doc.setFontSize(tam)
    doc.setFont('helvetica', negrilla ? 'bold' : 'normal')
    doc.setTextColor(...color)
    doc.text(s, x, yy, { align: alinear })
  }

  const caja = (x: number, yy: number, w: number, h: number, color: [number, number, number]) => {
    doc.setFillColor(...color); doc.rect(x, yy, w, h, 'F')
  }

  function encabezado() {
    pagina++
    caja(0, 0, W, 20, C.verde)
    texto('HOJA DE VIDA DEL TRABAJADOR', ML, 9, 10, C.blanco, true)
    texto(`${empresa}  ·  Información sociodemográfica`, ML, 15, 7.5, C.crema)
    texto(`Pág. ${pagina}`, W - MR, 15, 7.5, C.crema, false, 'right')
    y = 28
  }

  function pie() {
    doc.setDrawColor(...C.verde); doc.setLineWidth(0.3)
    doc.line(ML, H - 12, W - MR, H - 12)
    texto(
      `Generado por AgroSafe el ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ML, H - 7, 7, C.gris)
    texto(nombre, W - MR, H - 7, 7, C.gris, false, 'right')
  }

  /** Deja listo el espacio pedido; si no cabe, pasa de página. */
  function espacio(alto: number) {
    if (y + alto > H - 18) { pie(); doc.addPage(); encabezado() }
  }

  encabezado()

  // ── Identificación, con la foto ──
  const foto = ficha.photo_url ? await comoDato(ficha.photo_url) : null
  const medidas = foto ? await medir(foto) : null

  const altoFicha = 34
  caja(ML, y, CW, altoFicha, C.claro)
  doc.setDrawColor(220, 224, 220); doc.setLineWidth(0.2)
  doc.rect(ML, y, CW, altoFicha, 'S')

  let xTexto = ML + 5
  if (foto) {
    const alto = altoFicha - 8
    const prop = medidas && medidas.h ? medidas.w / medidas.h : 0.78
    const ancho = Math.min(alto * prop, 26)
    try {
      doc.addImage(foto, /^data:image\/png/i.test(foto) ? 'PNG' : 'JPEG',
        ML + 5, y + 4, ancho, alto)
      xTexto = ML + 5 + ancho + 6
    } catch { /* si la foto no se puede meter, la ficha sale igual */ }
  }

  const nombres = [ficha.nombres, ficha.apellidos].filter(Boolean).join(' ') || nombre
  texto(nombres.toUpperCase(), xTexto, y + 11, 12, C.oscuro, true)
  const renglon = [
    ficha.doc_type ? `${ficha.doc_type}` : null,
    ficha.cargo_confirmado,
    ficha.area_confirmada,
    ficha.centro_trabajo,
  ].filter(Boolean).join('  ·  ')
  if (renglon) texto(renglon, xTexto, y + 17.5, 8, C.gris)
  texto(`Ficha diligenciada al ${pct}%`, xTexto, y + 24, 8,
    pct >= 100 ? C.verde : C.ambar, true)

  y += altoFicha + 6

  // ── Las secciones, tal como las pregunta la encuesta ──
  for (const sec of FICHA) {
    const campos = sec.campos.filter((c: CampoFicha) => !esImagen(c.campo))
    const imagenes = sec.campos.filter((c: CampoFicha) => esImagen(c.campo) && ficha[c.campo])

    if (!campos.length && !imagenes.length) continue

    espacio(16)
    caja(ML, y, CW, 7, C.verde)
    texto(sec.nombre.toUpperCase(), ML + 3, y + 4.8, 8, C.blanco, true)
    y += 7

    let alterna = false
    for (const c of campos) {
      const valor = comoSeLee(c.campo, ficha[c.campo])
      const lineas = doc.splitTextToSize(valor, CW - 78) as string[]
      const alto = Math.max(6, lineas.length * 4 + 2)
      espacio(alto)

      if (alterna) caja(ML, y, CW, alto, [250, 251, 250])
      alterna = !alterna

      texto(c.etiqueta, ML + 3, y + 4.2, 7.5, C.gris)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', valor === '—' ? 'normal' : 'bold')
      doc.setTextColor(...(valor === '—' ? C.gris : C.oscuro))
      doc.text(lineas, ML + 72, y + 4.2)
      y += alto
    }

    // La foto y la firma van como imagen, no como texto.
    for (const c of imagenes) {
      const dato = await comoDato(ficha[c.campo])
      if (!dato) continue
      const m = await medir(dato)
      const alto = c.campo === 'firma_electronica' ? 16 : 30
      const prop = m && m.h ? m.w / m.h : 2
      const ancho = Math.min(alto * prop, CW - 76)
      espacio(alto + 4)
      texto(c.etiqueta, ML + 3, y + 5, 7.5, C.gris)
      try {
        if (c.campo === 'firma_electronica') caja(ML + 72, y + 1, ancho, alto, C.blanco)
        doc.addImage(dato, /^data:image\/png/i.test(dato) ? 'PNG' : 'JPEG',
          ML + 72, y + 1, ancho, alto)
      } catch { /* una imagen rota no bota el documento */ }
      y += alto + 4
    }

    y += 4
  }

  pie()

  const limpio = nombres.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
  doc.save(`Hoja_de_vida_${limpio}.pdf`)
}
