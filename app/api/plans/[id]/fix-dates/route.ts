import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

// Recalcula y corrige los due_date de todos los enrollments de un plan
// Útil para corregir enrollments creados con valid_days sumado incorrectamente
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: plan } = await supabase
    .from('annual_plans')
    .select('id, year')
    .eq('id', params.id)
    .eq('company_id', companyId!)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

  const { data: items } = await supabase
    .from('plan_items')
    .select('id, month')
    .eq('plan_id', params.id)

  if (!items?.length) return NextResponse.json({ error: 'Sin ítems' }, { status: 400 })

  let fixed = 0
  for (const item of items) {
    const lastDay = new Date(plan.year, item.month, 0)
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0')
    const dd = String(lastDay.getDate()).padStart(2, '0')
    const correctDate = `${plan.year}-${mm}-${dd}`

    const { data } = await supabase
      .from('enrollments')
      .update({ due_date: correctDate })
      .eq('plan_item_id', item.id)
      .neq('due_date', correctDate)  // solo actualiza si la fecha es incorrecta
      .select('id')

    fixed += data?.length ?? 0
  }

  return NextResponse.json({ success: true, fixed })
}
