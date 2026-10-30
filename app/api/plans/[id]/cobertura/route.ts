import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'

/**
 * Cuánta gente lleva cada capacitación del plan y cuánta ya asistió.
 *
 * Va en una sola consulta para todo el plan. Preguntarlo capacitación por
 * capacitación serían cincuenta consultas cada vez que se abre el calendario.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: items, error: eItems } = await supabase
    .from('plan_items').select('id').eq('plan_id', params.id)
  if (eItems) return NextResponse.json({ error: eItems.message }, { status: 500 })

  const ids = (items ?? []).map(i => i.id)
  if (!ids.length) return NextResponse.json({})

  const { data, error } = await supabase
    .from('enrollments')
    .select('plan_item_id, asistencia')
    .in('plan_item_id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const cobertura: Record<string, { asignados: number; asistieron: number }> = {}
  for (const id of ids) cobertura[id] = { asignados: 0, asistieron: 0 }
  for (const e of data ?? []) {
    const c = cobertura[e.plan_item_id as string]
    if (!c) continue
    c.asignados++
    if (e.asistencia === 'asistio') c.asistieron++
  }

  return NextResponse.json(cobertura)
}
