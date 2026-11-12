import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Recoge lo que queda tirado en la bodega.
 *
 * Al reemplazar el material de un curso se borraban las filas de la base,
 * pero las imágenes se quedaban guardadas para siempre. Una inducción subida
 * tres veces dejó 95 MB de diapositivas que ya nadie miraba; en total se
 * habían acumulado 138 MB de archivos sueltos.
 *
 * Esto borra las imágenes al mismo tiempo que sus filas. Nunca borra algo
 * que todavía esté nombrado en la base: antes de quitar un archivo se
 * pregunta si alguien más lo usa.
 */

export const BALDE = 'training-covers'

/**
 * De una dirección completa saca la ruta dentro del balde.
 *
 * Las fotos de perfil llevan un `?v=...` al final para que el navegador no
 * muestre la vieja; comparando la dirección entera parecían no estar en uso.
 */
export function rutaEnBodega(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null
  const sin = url.split('?')[0]
  const marca = `/${BALDE}/`
  const i = sin.indexOf(marca)
  return i < 0 ? null : sin.slice(i + marca.length)
}

/** Las rutas que la base todavía nombra, para no borrar nada que esté en uso. */
async function rutasEnUso(): Promise<Set<string>> {
  const vivas = new Set<string>()
  const agregar = (filas: any[] | null, campo: string) => {
    for (const f of filas ?? []) {
      const r = rutaEnBodega(f?.[campo])
      if (r) vivas.add(r)
    }
  }

  const [portadas, diapositivas, fotos] = await Promise.all([
    supabaseAdmin.from('trainings').select('cover_url'),
    supabaseAdmin.from('training_slides').select('image_data'),
    supabaseAdmin.from('worker_profiles').select('photo_url'),
  ])
  agregar(portadas.data as any[], 'cover_url')
  agregar(diapositivas.data as any[], 'image_data')
  agregar(fotos.data as any[], 'photo_url')
  return vivas
}

/**
 * Borra de la bodega las direcciones que se le pasen, saltándose las que
 * todavía estén en uso. Devuelve cuántas se borraron.
 *
 * Si falla, no interrumpe nada: dejar un archivo de más es un problema
 * pequeño; que no se pueda reemplazar el material de un curso, no.
 */
export async function borrarDeBodega(urls: Array<string | null | undefined>): Promise<number> {
  try {
    const candidatas = Array.from(new Set(
      urls.map(rutaEnBodega).filter((r): r is string => !!r)))
    if (!candidatas.length) return 0

    const enUso = await rutasEnUso()
    const sobran = candidatas.filter(r => !enUso.has(r))
    if (!sobran.length) return 0

    let borradas = 0
    for (let i = 0; i < sobran.length; i += 50) {
      const tanda = sobran.slice(i, i + 50)
      const { error } = await supabaseAdmin.storage.from(BALDE).remove(tanda)
      if (!error) borradas += tanda.length
    }
    return borradas
  } catch (_) {
    return 0
  }
}

/**
 * Las direcciones de las imágenes de un curso: sus diapositivas y, si salió
 * de una de ellas, su portada.
 */
export async function imagenesDelCurso(trainingId: number): Promise<string[]> {
  const [{ data: slides }, { data: curso }] = await Promise.all([
    supabaseAdmin.from('training_slides').select('image_data').eq('training_id', trainingId),
    supabaseAdmin.from('trainings').select('cover_url, portada_manual').eq('id', trainingId).maybeSingle(),
  ])
  const urls = (slides ?? []).map((s: any) => s.image_data).filter(Boolean)
  // La portada escogida a mano es un archivo aparte y también se va con el
  // curso; la automática ya viene en la lista de diapositivas.
  if (curso?.cover_url) urls.push(curso.cover_url)
  return urls
}
