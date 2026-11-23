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

/**
 * Las inscripciones de una ronda siguen a la ronda.
 *
 * Al reprogramar la inducción pasó esto: el ítem quedó abierto del 23 al 30,
 * pero las inscripciones conservaron el vencimiento viejo y su estado
 * «vencida». El trabajador entraba y le salía «Periodo vencido» para una
 * capacitación que la empresa acababa de reabrirle.
 *
 * Eran dos errores a la vez: al reprogramar se ponía como vencimiento la
 * fecha de inicio en vez de la de cierre, y a nadie se le quitaba el estado
 * de vencida. Esto corrige los dos y se llama desde todos los sitios donde se
 * puede mover la ventana, para que no vuelva a depender de que cada ruta se
 * acuerde.
 */
export async function sincronizarRonda(itemId: string): Promise<{
  vencimiento: string | null; reactivadas: number; reabierta: boolean
}> {
  const { data: item } = await supabase
    .from('plan_items')
    .select('id, estado, scheduled_date, end_date')
    .eq('id', itemId)
    .maybeSingle()

  if (!item) return { vencimiento: null, reactivadas: 0, reabierta: false }

  // El plazo del trabajador es hasta cuándo se puede responder, que es el
  // cierre de la ronda. Si no tiene cierre, no vence.
  const vencimiento = item.end_date ?? null

  await supabase
    .from('enrollments')
    .update({ due_date: vencimiento })
    .eq('plan_item_id', itemId)
    .neq('status', 'completed')

  // Quien quedó marcado como vencido vuelve a poder entrar, si la nueva
  // ventana todavía no se ha pasado. Lo completado no se toca nunca.
  let reactivadas = 0
  const sigueAbierta = !vencimiento || vencimiento >= hoy()
  if (sigueAbierta) {
    const { data } = await supabase
      .from('enrollments')
      .update({ status: 'pending' })
      .eq('plan_item_id', itemId)
      .eq('status', 'expired')
      .select('id')
    reactivadas = data?.length ?? 0
  }

  // Una ronda cerrada que se reprograma al futuro vuelve a estar viva: si no,
  // se le movió la fecha a algo que sigue sin admitir respuestas.
  let reabierta = false
  if (sigueAbierta && item.estado === 'cerrada') {
    await supabase
      .from('plan_items')
      .update({ estado: 'programada', cerrado_at: null })
      .eq('id', itemId)
    reabierta = true
  }

  return { vencimiento, reactivadas, reabierta }
}
