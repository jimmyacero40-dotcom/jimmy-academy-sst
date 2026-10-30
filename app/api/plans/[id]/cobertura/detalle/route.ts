import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper, getActiveCompanyId } from '@/lib/get-company'

/**
 * La cobertura del plan, fila por fila: una por cada par de persona y
 * capacitación, más las capacitaciones a las que todavía no va nadie.
 *
 * Se manda cruda y los filtros se hacen en la pantalla. Son unos cientos de
 * filas —cincuenta trabajadores por las capacitaciones del año— y así se puede
 * filtrar y reordenar sin volver a consultar en cada clic.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const { data: items, error: eItems } = await supabase
    .from('plan_items')
    .select('id, month, scheduled_date, estado, trainings(id, title, category, duration)')
    .eq('plan_id', params.id)
    .order('month')
  if (eItems) return NextResponse.json({ error: eItems.message }, { status: 500 })

  const ids = (items ?? []).map(i => i.id)

  const [{ data: inscripciones }, { data: perfiles }] = await Promise.all([
    ids.length
      ? supabase.from('enrollments')
          .select('plan_item_id, user_id, status, asistencia, users(id, name, cedula, cargo, area)')
          .in('plan_item_id', ids)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('worker_profiles')
      .select('user_id, centro_trabajo, cargo_confirmado, area_confirmada')
      .eq('company_id', companyId),
  ])

  const perfilDe = new Map((perfiles ?? []).map((p: any) => [p.user_id, p]))

  const filas = ((inscripciones ?? []) as any[]).map(e => {
    const perfil = perfilDe.get(e.user_id)
    return {
      plan_item_id: e.plan_item_id,
      user_id: e.user_id,
      nombre: e.users?.name ?? '',
      cedula: e.users?.cedula ?? '',
      cargo: perfil?.cargo_confirmado || e.users?.cargo || '',
      area: perfil?.area_confirmada || e.users?.area || '',
      finca: perfil?.centro_trabajo ?? '',
      asistencia: e.asistencia ?? null,
      status: e.status,
    }
  })

  return NextResponse.json({
    items: (items ?? []).map((i: any) => ({
      id: i.id, month: i.month, scheduled_date: i.scheduled_date, estado: i.estado,
      titulo: i.trainings?.title ?? '', categoria: i.trainings?.category ?? '',
      duracion: i.trainings?.duration ?? '',
    })),
    filas,
  })
}
