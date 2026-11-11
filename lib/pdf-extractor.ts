/**
 * Convierte cada página de un PDF en una imagen.
 *
 * Antes se guardaba en PNG al doble de tamaño: cada página pesaba varios
 * megas y una sola no cabía en un envío, por más que se mandaran por tandas.
 * Ahora sale en JPEG con el ancho topado, que es lo mismo que ya se hacía con
 * los PowerPoint: se ve igual en pantalla y pesa veinte veces menos.
 */

/** Más de esto no se alcanza a ver en pantalla, solo pesa. */
const ANCHO_MAXIMO = 1600
const CALIDAD = 0.82

export async function extractPDFImages(file: File): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const images: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    // Se dibuja al doble para que el texto salga nítido, pero sin pasarse del
    // ancho que de verdad se va a mostrar.
    const base = page.getViewport({ scale: 1 })
    const escala = Math.min(2, ANCHO_MAXIMO / Math.max(base.width, 1))
    const viewport = page.getViewport({ scale: escala })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')!
    // El JPEG no tiene transparencia: sin fondo blanco, lo vacío sale negro.
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg', CALIDAD))
    canvas.remove()
  }

  return images
}
