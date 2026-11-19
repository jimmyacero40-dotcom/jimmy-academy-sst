import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { estaAbierta } from '@/lib/ventana'
import { isAdminOrSuper, getCurrentUser } from '@/lib/get-company'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  if (user.role === 'worker') {
    // Workers see only their own enrollments
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id, status, due_date, started_at, completed_at, score, created_at, progreso, progreso_total,
        trainings(id, title, description, duration, cover_url, category),
        plan_items(estado, scheduled_date, end_date)
      `)
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Una ronda cancelada no es una obligación: se canceló. Al trabajador le
    // seguía apareciendo su tarjeta, así que veía dos veces la misma
    // capacitación, una de la ronda viva y otra de la que se dio de baja.
    return NextResponse.json((data ?? [])
      .filter((e: any) => e.plan_items?.estado !== 'cancelada')
      .map(({ plan_items, ...resto }: any) => ({
        ...resto,
        // Cerrada no es lo mismo que cancelada: la cancelada desaparece, la
        // cerrada se sigue viendo —hace falta saber que pasó y no se hizo—
        // pero ya no se puede contestar. Sin esto el trabajador entraba a una
        // ronda vencida y la respondía como si nada.
        abierta: !plan_items || estaAbierta(plan_items),
        cierra: plan_items?.end_date ?? null,
        // Una inscripción ya terminada no se vuelve a abrir aunque la ronda
        // siga viva: el certificado ya se emitió.
        puedeResponder: resto.status !== 'completed'
          && (!plan_items || estaAbierta(plan_items)),
      })))
  }

  // Admin/superadmin see all enrollments for their company
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let query = supabase
    .from('enrollments')
    .select(`
      id, status, due_date, started_at, completed_at, score, created_at, progreso, progreso_total,
      users!inner(id, name, email, cedula, area, retired_at),
      trainings(id, title, duration),
      plan_items(estado)
    `)
    // Las capacitaciones de los retirados se quedan en su hoja de vida, pero
    // no en los pendientes de la empresa: inflaban el atraso con gente que ya
    // no viene.
    .is('users.retired_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Lo mismo que para el trabajador: una ronda cancelada no le queda
  // pendiente a nadie, y en trazabilidad seguía contando e inflando los
  // pendientes del plan.
  return NextResponse.json((data ?? [])
    .filter((e: any) => e.plan_items?.estado !== 'cancelada')
    .map(({ plan_items, ...resto }: any) => resto))
}
