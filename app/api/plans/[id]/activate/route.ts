import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa' }, { status: 400 })

  // 1. Verify plan belongs to this company and is in draft
  const { data: plan, error: planErr } = await supabase
    .from('annual_plans')
    .select('id, status, year')
    .eq('id', params.id)
    .eq('company_id', companyId)
    .single()

  if (planErr || !plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  if (plan.status !== 'draft') return NextResponse.json({ error: 'Solo se pueden activar planes en borrador' }, { status: 400 })

  // 2. Get all plan items with their targets
  const { data: items } = await supabase
    .from('plan_items')
    .select('id, training_id, month, valid_days, plan_item_targets(target_type, target_id)')
    .eq('plan_id', params.id)

  if (!items?.length) return NextResponse.json({ error: 'El plan no tiene ítems' }, { status: 400 })

  // 3. Get all active workers of the company
  const { data: allWorkers } = await supabase
    .from('users')
    .select('id, area_id, cargo')
    .eq('company_id', companyId)
    .eq('active', true)
    .in('role', ['worker', 'admin'])

  if (!allWorkers?.length) return NextResponse.json({ error: 'No hay trabajadores en esta empresa' }, { status: 400 })

  // 4. Generate enrollments
  const enrollments: any[] = []

  for (const item of items) {
    const targets = (item as any).plan_item_targets ?? []
    let targetUsers: string[] = []

    for (const target of targets) {
      if (target.target_type === 'all') {
        targetUsers = allWorkers.map(w => w.id)
        break
      } else if (target.target_type === 'area' && target.target_id) {
        const areaWorkers = allWorkers.filter(w => w.area_id === target.target_id)
        targetUsers.push(...areaWorkers.map(w => w.id))
      } else if (target.target_type === 'group' && target.target_id) {
        const { data: groupMembers } = await supabase
          .from('user_groups')
          .select('user_id')
          .eq('group_id', target.target_id)
        if (groupMembers) targetUsers.push(...groupMembers.map((m: any) => m.user_id))
      } else if (target.target_type === 'user' && target.target_id) {
        targetUsers.push(target.target_id)
      }
    }

    // Deduplicate
    const uniqueUsers = [...new Set(targetUsers)]

    // Calculate due date from month + year
    const dueDate = new Date(plan.year, (item as any).month - 1 + 1, 0) // last day of that month
    if ((item as any).valid_days) {
      dueDate.setDate(dueDate.getDate() + (item as any).valid_days)
    }

    for (const userId of uniqueUsers) {
      enrollments.push({
        user_id: userId,
        training_id: item.training_id,
        plan_item_id: item.id,
        company_id: companyId,
        status: 'pending',
        due_date: dueDate.toISOString().split('T')[0],
      })
    }
  }

  // 5. Insert enrollments (ignore duplicates via UNIQUE constraint)
  let created = 0
  if (enrollments.length > 0) {
    const BATCH = 100
    for (let i = 0; i < enrollments.length; i += BATCH) {
      const { data: inserted } = await supabase
        .from('enrollments')
        .upsert(enrollments.slice(i, i + BATCH), { onConflict: 'user_id,training_id,plan_item_id', ignoreDuplicates: true })
        .select('id')
      created += inserted?.length ?? 0
    }
  }

  // 6. Activate the plan
  await supabase.from('annual_plans').update({ status: 'active' }).eq('id', params.id)

  return NextResponse.json({ success: true, enrollments_created: created })
}
