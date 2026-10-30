import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'

/**
 * Quién ya tiene otra capacitación ese mismo día.
 *
 * Programar dos cosas el mismo día para la misma persona no está prohibido
 * —puede ser por la mañana y por la tarde—, pero casi siempre es un descuido,
 * así que se avisa antes de guardar en vez de bloquearlo.
 */
export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized || !companyId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const fecha = req.nextUrl.searchParams.get('fecha')
  const excluir = req.nextUrl.searchParams.get('excluir')
  if (!fecha) return NextResponse.json([])

  // Las capacitaciones de la empresa ese día, menos la que se está editando.
  const { data: items } = await supabase
    .from('plan_items')
    .select('id, trainings(title), annual_plans!inner(company_id)')
    .eq('scheduled_date', fecha)

  const delDia = (items ?? []).filter((i: any) =>
    i.annual_plans?.company_id === companyId && i.id !== excluir)
  if (!delDia.length) return NextResponse.json([])

  const tituloDe = new Map(delDia.map((i: any) => [i.id, i.trainings?.title ?? 'otra capacitación']))

  const { data: inscritos } = await supabase
    .from('enrollments')
    .select('user_id, plan_item_id, users(name)')
    .in('plan_item_id', delDia.map((i: any) => i.id))
    .neq('status', 'completed')

  return NextResponse.json((inscritos ?? []).map((e: any) => ({
    user_id: e.user_id,
    nombre: e.users?.name ?? '',
    curso: tituloDe.get(e.plan_item_id) ?? '',
  })))
}
