import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

/**
 * El área de una persona vive en dos columnas de `users`:
 *
 *   `area`     — el texto, que es lo que se muestra en la tabla de personas.
 *   `area_id`  — la llave al área de verdad, que es lo que usan los filtros,
 *                los reportes y los registros de portería.
 *
 * Quien escriba una sola de las dos deja a esa persona "sin área" para todo
 * lo que cuenta por `area_id`, aunque en la lista se le vea su área puesta.
 * Eso ya pasó: ocho trabajadores salían con área en Personas y como "Sin
 * área" en los ingresos. Por eso la conversión vive aquí y no suelta en cada
 * ruta: todo sitio que guarde un área tiene que pasar por esto.
 */

/** Normaliza para comparar: sin tildes, sin dobles espacios, en mayúscula. */
function normaliza(s: string): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toUpperCase().replace(/\s+/g, ' ')
}

/**
 * El id del área que se llama así, o null si ninguna coincide.
 * Compara sin tildes ni espacios de más: "Labores  culturales" encuentra
 * "LABORES CULTURALES", que escrito a mano es lo que suele llegar.
 */
export async function idDeArea(nombre: string, companyId: string | null): Promise<string | null> {
  const buscado = normaliza(nombre)
  if (!buscado) return null

  let q = supabase.from('areas').select('id, name')
  if (companyId) q = q.eq('company_id', companyId)
  const { data } = await q

  return (data ?? []).find((a: any) => normaliza(a.name) === buscado)?.id ?? null
}

/** El nombre del área con ese id, o '' si no existe. */
export async function nombreDeArea(areaId: string | null): Promise<string> {
  if (!areaId) return ''
  const { data } = await supabase.from('areas').select('name').eq('id', areaId).maybeSingle()
  return data?.name ?? ''
}

/**
 * Completa el campo que falte, sobre el mismo objeto que se va a guardar.
 * Da igual si llega el texto o el id: al salir de aquí están los dos.
 */
export async function sincronizarArea(
  cambios: Record<string, any>, companyId: string | null,
): Promise<void> {
  const traeTexto = cambios.area !== undefined
  const traeId    = cambios.area_id !== undefined

  if (traeTexto && !traeId) {
    cambios.area_id = await idDeArea(String(cambios.area || ''), companyId)
    return
  }
  if (traeId && !traeTexto) {
    cambios.area = await nombreDeArea(cambios.area_id || null)
    return
  }
  // Llegaron los dos: manda el id, que es el que usan filtros y reportes.
  if (traeTexto && traeId && cambios.area_id) {
    cambios.area = await nombreDeArea(cambios.area_id)
  }
}
