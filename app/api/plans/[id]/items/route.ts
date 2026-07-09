import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase
    .from('plan_items')
    .select(`
      id, month, scheduled_date, periodicity, required, valid_days, created_at,
      trainings(id, title, duration),
      plan_item_targets(id, target_type, target_id)
    `)
    .eq('plan_id', params.id)
    .order('month')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { training_id, month, scheduled_date, periodicity, required, valid_days, target_type, target_id } = await req.json()
  if (!training_id || !month) return NextResponse.json({ error: 'training_id y month son requeridos' }, { status: 400 })

  const { data: item, error: itemErr } = await supabase
    .from('plan_items')
    .insert({
      plan_id: params.id,
      training_id,
      month: Number(month),
      scheduled_date: scheduled_date || null,
      periodicity: periodicity || 'once',
      required: required !== false,
      valid_days: valid_days || null,
    })
    .select('id')
    .single()

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 })

  // Insert target
  const tType = target_type || 'all'
  await supabase.from('plan_item_targets').insert({
    plan_item_id: item.id,
    target_type: tType,
    target_id: target_id || null,
  })

  // Return full item
  const { data: full } = await supabase
    .from('plan_items')
    .select(`
      id, month, scheduled_date, periodicity, required, valid_days, created_at,
      trainings(id, title, duration),
      plan_item_targets(id, target_type, target_id)
    `)
    .eq('id', item.id)
    .single()

  return NextResponse.json(full, { status: 201 })
}

export async function DELETE(req: NextRequest, _ctx: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { item_id } = await req.json()
  if (!item_id) return NextResponse.json({ error: 'item_id requerido' }, { status: 400 })

  const { error } = await supabase.from('plan_items').delete().eq('id', item_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
