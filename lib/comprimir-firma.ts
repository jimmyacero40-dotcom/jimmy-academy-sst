/**
 * Deja una firma en un tamaño razonable antes de guardarla.
 *
 * Una firma dibujada en el lienzo pesa entre 7 y 33 KB, pero una foto de una
 * firma en papel llegaba entera a la base de datos: 1536x1024 y 2 MB cada una.
 * Aquí se recorta el margen vacío, se reduce el ancho y se elige el formato
 * que menos ocupe, con lo que una firma termina pesando unas decenas de KB.
 */

const ANCHO_MAXIMO = 600
const ALTO_MAXIMO = 300
/** Por encima de esto conviene JPEG: la foto tiene ruido y el PNG no lo comprime. */
const LIMITE_PNG = 60 * 1024

/** Quita el borde en blanco o transparente que rodea al trazo. */
function recortar(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const { width: w, height: h } = canvas
  let datos: ImageData
  try { datos = ctx.getImageData(0, 0, w, h) } catch { return canvas }
  const p = datos.data

  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const alfa = p[i + 3]
      // Se considera trazo lo que no sea transparente ni casi blanco.
      const claro = p[i] > 243 && p[i + 1] > 243 && p[i + 2] > 243
      if (alfa > 24 && !claro) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < x0 || y1 < y0) return canvas   // lienzo vacío: se deja igual

  const margen = 8
  x0 = Math.max(0, x0 - margen); y0 = Math.max(0, y0 - margen)
  x1 = Math.min(w - 1, x1 + margen); y1 = Math.min(h - 1, y1 + margen)

  const salida = document.createElement('canvas')
  salida.width = x1 - x0 + 1
  salida.height = y1 - y0 + 1
  salida.getContext('2d')!.drawImage(canvas, x0, y0, salida.width, salida.height, 0, 0, salida.width, salida.height)
  return salida
}

/** ¿Queda algún píxel no opaco? Entonces el PNG es obligatorio. */
function tieneTransparencia(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return true
  try {
    const p = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    for (let i = 3; i < p.length; i += 4) if (p[i] < 250) return true
    return false
  } catch {
    return true   // ante la duda, no se pierde el fondo
  }
}

export async function comprimirFirma(entrada: File | string): Promise<string> {
  const origen = typeof entrada === 'string' ? entrada : await leerArchivo(entrada)

  const img = await new Promise<HTMLImageElement>((ok, falla) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = () => falla(new Error('No se pudo leer la imagen'))
    i.src = origen
  })

  const lienzo = document.createElement('canvas')
  lienzo.width = img.naturalWidth
  lienzo.height = img.naturalHeight
  lienzo.getContext('2d')!.drawImage(img, 0, 0)

  const recortado = recortar(lienzo)

  const escala = Math.min(1, ANCHO_MAXIMO / recortado.width, ALTO_MAXIMO / recortado.height)
  const final = document.createElement('canvas')
  final.width = Math.max(1, Math.round(recortado.width * escala))
  final.height = Math.max(1, Math.round(recortado.height * escala))
  const ctx = final.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(recortado, 0, 0, final.width, final.height)

  const png = final.toDataURL('image/png')
  // Una firma con fondo transparente tiene que seguir en PNG: en JPEG el fondo
  // se vuelve blanco y aparece un recuadro sobre el certificado o el documento.
  if (tieneTransparencia(final) || png.length * 0.75 <= LIMITE_PNG) return png

  // Para JPEG hace falta fondo: si no, lo transparente sale negro.
  const conFondo = document.createElement('canvas')
  conFondo.width = final.width
  conFondo.height = final.height
  const c2 = conFondo.getContext('2d')!
  c2.fillStyle = '#FFFFFF'
  c2.fillRect(0, 0, conFondo.width, conFondo.height)
  c2.drawImage(final, 0, 0)
  const jpeg = conFondo.toDataURL('image/jpeg', 0.85)

  return jpeg.length < png.length ? jpeg : png
}

function leerArchivo(file: File): Promise<string> {
  return new Promise((ok, falla) => {
    const r = new FileReader()
    r.onload = () => ok(r.result as string)
    r.onerror = () => falla(new Error('No se pudo leer el archivo'))
    r.readAsDataURL(file)
  })
}
