import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

/**
 * Las diapositivas se guardan como archivos, no dentro de la base de datos.
 *
 * Guardarlas en base64 en una columna de texto costaba un 33 % extra por el
 * propio base64, se llevaba casi toda la cuota de la base y hacía que cada
 * vista de un curso saliera desde Postgres en vez de la CDN.
 */

const BUCKET = 'training-covers'

const TIPOS: Record<string, string> = {
  jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif', 'svg+xml': 'image/svg+xml',
}

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/svg+xml': 'svg',
}

/**
 * Recibe lo que manda el navegador y devuelve una URL.
 * Si ya viene una URL (una diapositiva que no se cambió), se deja igual.
 */
export async function subirDiapositiva(
  valor: string | null | undefined,
  trainingId: number | string,
  indice: number,
): Promise<string | null> {
  if (!valor) return null
  if (!valor.startsWith('data:')) return valor   // ya es una URL

  const m = /^data:image\/([a-z0-9+.-]+);base64,/i.exec(valor)
  const contentType = TIPOS[(m?.[1] ?? 'jpeg').toLowerCase()] ?? 'image/jpeg'
  const ext = EXTENSIONES[contentType] ?? 'jpg'

  const buffer = Buffer.from(valor.slice(valor.indexOf(',') + 1), 'base64')
  // El sufijo evita que una diapositiva reemplazada quede servida desde la caché.
  const ruta = `slides/${trainingId}/${trainingId}-${String(indice).padStart(3, '0')}-${Date.now()}.${ext}`

  // Subir cuarenta imágenes seguidas hace que de vez en cuando una se caiga
  // por la red ("fetch failed"). Antes esa sola tumbaba el curso entero y la
  // persona se quedaba sin material. Se reintenta antes de darla por perdida.
  let ultimo = ''
  for (let intento = 1; intento <= 3; intento++) {
    const { error } = await supabase.storage.from(BUCKET)
      .upload(ruta, buffer, { contentType, upsert: true })
    if (!error) return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl
    ultimo = error.message
    if (intento < 3) await new Promise(r => setTimeout(r, intento * 700))
  }
  throw new Error(`No se pudo guardar la diapositiva ${indice + 1}: ${ultimo}`)
}
