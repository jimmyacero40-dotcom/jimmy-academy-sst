import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase
    .from('plan_items')
    .select(`
      id, month, scheduled_date, end_date, periodicity, required, valid_days, estado, reinduccion, observaciones, modalidad, created_at,
      trainings(id, title, duration, category),
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

  const body = await req.json()
  const {
    training_id, month, scheduled_date, end_date, periodicity, required, valid_days,
    estado, modalidad, reinduccion, observaciones, target_type, target_id,
  } = body
  if (!training_id || !month) return NextResponse.json({ error: 'training_id y month son requeridos' }, { status: 400 })

  // Una periodicidad distinta de "una vez" crea varias sesiones. El cliente
  // manda las que ya mostró en la vista previa, para que lo que se guarda sea
  // exactamente lo que la persona vio antes de pulsar Guardar.
  const pedidas: { month: number; scheduled_date: string | null }[] =
    Array.isArray(body.ocurrencias) && body.ocurrencias.length
      ? body.ocurrencias
      : [{ month: Number(month), scheduled_date: scheduled_date || null }]

  const ocurrencias = pedidas
    .map(o => ({ month: Number(o.month), scheduled_date: o.scheduled_date || null }))
    .filter(o => o.month >= 1 && o.month <= 12)

  if (!ocurrencias.length) return NextResponse.json({ error: 'Mes inválido' }, { status: 400 })

  const comun = {
    plan_id: params.id,
    training_id,
    end_date: end_date || null,
    periodicity: periodicity || 'once',
    required: required !== false,
    valid_days: valid_days || null,
    estado: estado || 'pendiente',
    modalidad: modalidad || 'presencial',
    reinduccion: reinduccion === true,
    observaciones: observaciones || null,
  }

  const { data: creados, error: itemErr } = await supabase
    .from('plan_items')
    .insert(ocurrencias.map(o => ({ ...comun, month: o.month, scheduled_date: o.scheduled_date })))
    .select('id')

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 })

  // Insert target
  const tType = target_type || 'all'
  const { error: eTarget } = await supabase.from('plan_item_targets').insert(
    (creados ?? []).map(c => ({
      plan_item_id: c.id,
      target_type: tType,
      target_id: target_id || null,
    })),
  )
  if (eTarget) return NextResponse.json({ error: eTarget.message }, { status: 500 })

  // Return full items
  const { data: full } = await supabase
    .from('plan_items')
    .select(`
      id, month, scheduled_date, end_date, periodicity, required, valid_days, estado, reinduccion, observaciones, modalidad, created_at,
      trainings(id, title, duration, category),
      plan_item_targets(id, target_type, target_id)
    `)
    .in('id', (creados ?? []).map(c => c.id))
    .order('month')

  // Un solo objeto cuando se pidió una sola sesión: así sigue sirviendo a quien
  // ya llamaba esta ruta esperando el ítem suelto.
  return NextResponse.json(
    ocurrencias.length === 1 ? (full ?? [])[0] : full ?? [],
    { status: 201 },
  )
}

// PATCH — update a single plan item (side panel edits)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { item_id, target_type, target_id, ...rest } = await req.json()
  if (!item_id) return NextResponse.json({ error: 'item_id requerido' }, { status: 400 })

  const ALLOWED = ['month','scheduled_date','end_date','periodicity','required','valid_days','estado','reinduccion','observaciones','modalidad']
  const updates: Record<string, any> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (ALLOWED.includes(k)) updates[k] = v === '' ? null : v
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('plan_items').update(updates).eq('id', item_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update target if provided
  if (target_type !== undefined) {
    await supabase.from('plan_item_targets').delete().eq('plan_item_id', item_id)
    await supabase.from('plan_item_targets').insert({
      plan_item_id: item_id,
      target_type: target_type || 'all',
      target_id: target_id || null,
    })
  }

  // Return updated item
  const { data } = await supabase
    .from('plan_items')
    .select('id, month, scheduled_date, end_date, periodicity, required, valid_days, estado, reinduccion, observaciones, modalidad, trainings(id, title, duration), plan_item_targets(id, target_type, target_id)')
    .eq('id', item_id)
    .single()

  return NextResponse.json(data)
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
