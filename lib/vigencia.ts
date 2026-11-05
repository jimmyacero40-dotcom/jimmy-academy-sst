import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { hoy } from '@/lib/ventana'

/**
 * Cerrar las rondas vencidas. Las cuentas de la ventana -cuántos días dura y
 * hasta cuándo- están en `ventana.ts`, que también usa el formulario.
 *
 * Una capacitación se programa, se le da un plazo -quince días por defecto- y
 * al vencerse la ronda se cierra. Quien no fue queda en "No asistió" y la
 * ronda deja de contar como vigente, así que a esa gente se le puede asignar
 * un refuerzo más adelante sin que el asistente la bloquee con "Ya la tiene".
 */

export { DIAS_POR_DEFECTO, hoy, sumarDias, calcularCierre, estaAbierta } from '@/lib/ventana'

export type Cerrada = { id: string; titulo: string; ausentes: number }

/**
 * Cierra las rondas que ya se vencieron.
 *
 * A quien quedó pendiente o en curso se le marca "No asistió" -eso es lo que
 * pasó: la ventana se acabó y no fue-. Lo completado no se toca, porque esa
 * persona sí la hizo y su constancia es soporte del SG-SST.
 *
 * Es idempotente: correrla dos veces no cambia nada la segunda. Por eso se
 * puede llamar tanto desde el cron como al abrir el plan.
 */
export async function cerrarVencidas(companyId: string): Promise<Cerrada[]> {
  const { data: planes } = await supabase
    .from('annual_plans').select('id').eq('company_id', companyId)
  const idsPlan = (planes ?? []).map((p: any) => p.id)
  if (!idsPlan.length) return []

  const { data: items } = await supabase
    .from('plan_items')
    .select('id, end_date, estado, trainings(title)')
    .in('plan_id', idsPlan)
    .lt('end_date', hoy())
    .not('end_date', 'is', null)

  const vencidas = (items ?? []).filter((i: any) => i.estado !== 'cerrada' && i.estado !== 'cancelada')
  if (!vencidas.length) return []

  const cerradas: Cerrada[] = []
  for (const item of vencidas as any[]) {
    // Quien no alcanzó: la ventana se venció sin que asistiera.
    const { data: colgados } = await supabase
      .from('enrollments')
      .select('id')
      .eq('plan_item_id', item.id)
      .in('status', ['pending', 'in_progress'])

    const ids = (colgados ?? []).map((e: any) => e.id)
    if (ids.length) {
      await supabase.from('enrollments').update({
        status: 'expired',
        asistencia: 'no_asistio',
        asistencia_nota: 'Se venció la ventana de la capacitación sin que asistiera',
        asistencia_at: new Date().toISOString(),
      }).in('id', ids)
    }

    await supabase.from('plan_items')
      .update({ estado: 'cerrada', cerrado_at: new Date().toISOString() })
      .eq('id', item.id)

    cerradas.push({
      id: item.id,
      titulo: item.trainings?.title ?? 'Capacitación',
      ausentes: ids.length,
    })
  }
  return cerradas
}
