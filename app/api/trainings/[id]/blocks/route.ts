import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const trainingId = parseInt(params.id)
  const { data, error } = await supabaseAdmin
    .from('training_blocks')
    .select(`
      id, block_type, position, title, description,
      is_active, is_required, minimum_seconds,
      slide_id, question_id, resource_id, config,
      training_slides(id, slide_index, slide_text),
      training_questions(id, question, options, correct_index, explanation)
    `)
    .eq('training_id', trainingId)
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: Params) {
  const trainingId = parseInt(params.id)
  const body = await req.json()

  // Bulk create (seed from slides) or single block
  if (Array.isArray(body)) {
    const rows = body.map((b: any, i: number) => ({
      id: randomUUID(),
      training_id: trainingId,
      block_type: b.block_type,
      position: b.position ?? i + 1,
      title: b.title ?? null,
      description: b.description ?? null,
      is_active: b.is_active ?? true,
      is_required: b.is_required ?? true,
      minimum_seconds: b.minimum_seconds ?? 0,
      slide_id: b.slide_id ?? null,
      question_id: b.question_id ?? null,
      resource_id: b.resource_id ?? null,
      config: b.config ?? {},
    }))
    const { data, error } = await supabaseAdmin
      .from('training_blocks')
      .insert(rows)
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  // Single block
  const { data, error } = await supabaseAdmin
    .from('training_blocks')
    .insert({
      id: randomUUID(),
      training_id: trainingId,
      block_type: body.block_type,
      position: body.position,
      title: body.title ?? null,
      description: body.description ?? null,
      is_active: body.is_active ?? true,
      is_required: body.is_required ?? true,
      minimum_seconds: body.minimum_seconds ?? 0,
      slide_id: body.slide_id ?? null,
      question_id: body.question_id ?? null,
      resource_id: body.resource_id ?? null,
      config: body.config ?? {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const trainingId = parseInt(params.id)
  const body = await req.json()

  // Bulk reorder: [{ id, position }, ...]
  if (Array.isArray(body)) {
    const updates = await Promise.all(
      body.map(({ id, position }: { id: string; position: number }) =>
        supabaseAdmin
          .from('training_blocks')
          .update({ position, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('training_id', trainingId)
      )
    )
    const failed = updates.find(u => u.error)
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Single update
  const { id, ...fields } = body
  const { data, error } = await supabaseAdmin
    .from('training_blocks')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('training_id', trainingId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const trainingId = parseInt(params.id)
  const { id } = await req.json()
  const { error } = await supabaseAdmin
    .from('training_blocks')
    .delete()
    .eq('id', id)
    .eq('training_id', trainingId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
