/**
 * Deja una imagen en un tamaño razonable antes de subirla.
 *
 * Las portadas se subían tal cual salían del diseñador: PNG de 1536 píxeles
 * de ancho y casi dos megas cada una, para una caja de 290. Dieciséis
 * portadas sumaban 27 MB que el navegador baja cada vez que alguien abre la
 * biblioteca —en el campo, con datos del celular, eso es que no cargue.
 *
 * En JPEG y con el ancho topado pesan una novena parte y se ven igual.
 */

/** Más ancho que esto no se alcanza a ver; solo pesa. */
export const ANCHO_PORTADA = 1600
export const CALIDAD_PORTADA = 0.84

export async function comprimirImagen(
  archivo: File,
  ancho = ANCHO_PORTADA,
  calidad = CALIDAD_PORTADA,
): Promise<File> {
  // Un GIF animado o un SVG se dañan al redibujarlos: se dejan como están.
  if (!/^image\/(png|jpe?g|webp)$/i.test(archivo.type)) return archivo
  if (typeof document === 'undefined') return archivo

  const url = URL.createObjectURL(archivo)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })

    const escala = img.width > ancho ? ancho / img.width : 1
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * escala)
    canvas.height = Math.round(img.height * escala)
    const ctx = canvas.getContext('2d')
    if (!ctx) return archivo
    // El JPEG no tiene transparencia: sin fondo blanco, lo vacío sale negro.
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', calidad))
    if (!blob) return archivo
    // Si comprimir no ayudó —ya venía liviana—, se queda la original.
    if (blob.size >= archivo.size) return archivo

    const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], nombre, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (_) {
    return archivo
  } finally {
    URL.revokeObjectURL(url)
  }
}
