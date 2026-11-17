import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Las imágenes del tablero, cuando dejan de usarse.
 *
 * Supabase Storage no tiene papelera: lo que se borra no vuelve. Por eso esto
 * nunca borra a ciegas —antes comprueba que ninguna tarjeta siga apuntando a
 * esa misma imagen— y se traga sus propios errores: que una imagen vieja se
 * quede ocupando espacio es un problema; que no se pueda cambiar una tarjeta
 * porque falló el borrado del archivo anterior es peor.
 */

export const BODEGA = 'tablero'

/**
 * De la dirección pública a la ruta dentro del bucket.
 *
 * Se corta la parte de la consulta: las direcciones a veces llevan `?v=` para
 * forzar la recarga del caché, y comparar la dirección completa hacía ver como
 * huérfano un archivo que sí estaba en uso.
 */
export function rutaEnBodega(url?: string | null): string | null {
  if (!url) return null
  const limpia = url.split('?')[0]
  const marca = `/${BODEGA}/`
  const i = limpia.indexOf(marca)
  if (i === -1) return null
  const ruta = limpia.slice(i + marca.length)
  return ruta || null
}

export async function borrarImagenDelTablero(url?: string | null): Promise<void> {
  const ruta = rutaEnBodega(url)
  if (!ruta) return
  try {
    // La misma imagen puede estar en dos tarjetas si una se duplicó. Mientras
    // alguna la use, no se toca.
    const { count } = await supabaseAdmin
      .from('tablero_tarjetas')
      .select('id', { count: 'exact', head: true })
      .like('imagen_url', `%${ruta}%`)

    if ((count ?? 0) > 0) return
    await supabaseAdmin.storage.from(BODEGA).remove([ruta])
  } catch {
    // Ver arriba: una imagen suelta no justifica tumbar la operación.
  }
}
