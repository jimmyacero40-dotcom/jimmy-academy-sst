import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

// Question schema: id, evaluationId, text, type (SINGLE|MULTIPLE|TRUE_FALSE), points, order
// Options schema:  id, questionId, text, isCorrect, order

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const evaluationId = searchParams.get('evaluation_id')
  if (!evaluationId) return NextResponse.json({ error: 'evaluation_id requerido' }, { status: 400 })

  const { data: questions, error } = await supabaseAdmin
    .from('Question')
    .select(`id, text, type, points, order, Option(id, text, isCorrect, order)`)
    .eq('evaluationId', evaluationId)
    .order('order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalize to frontend shape
  const normalized = (questions || []).map((q: any) => {
    const opts: any[] = (q.Option || []).sort((a: any, b: any) => a.order - b.order)
    return {
      id: q.id,
      evaluation_id: evaluationId,
      text: q.text,
      type: q.type === 'TRUE_FALSE' ? 'true_false' : q.type === 'MULTIPLE' ? 'multiple' : 'single',
      points: q.points ?? 1,
      options: opts.map((o: any) => o.text),
      correct: opts.filter((o: any) => o.isCorrect).map((o: any) => o.text),
    }
  })

  return NextResponse.json(normalized)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { evaluation_id, text, type, points, options, correct } = body

  const questionId = randomUUID()
  const dbType =
    type === 'true_false' ? 'TRUE_FALSE' :
    type === 'multiple' ? 'MULTIPLE' : 'SINGLE'

  // Get current max order
  const { data: existing } = await supabaseAdmin
    .from('Question')
    .select('order')
    .eq('evaluationId', evaluation_id)
    .order('order', { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0] as any)?.order ?? 0) + 1

  const { error: qErr } = await supabaseAdmin
    .from('Question')
    .insert({ id: questionId, evaluationId: evaluation_id, text, type: dbType, points: points ?? 1, order: nextOrder })

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // Insert options
  if (options && options.length > 0) {
    const optRecords = options.map((opt: string, i: number) => ({
      id: randomUUID(),
      questionId,
      text: opt,
      isCorrect: correct?.includes(opt) ?? false,
      order: i + 1,
    }))
    await supabaseAdmin.from('Option').insert(optRecords)
  }

  return NextResponse.json({
    id: questionId,
    evaluation_id,
    text,
    type,
    points: points ?? 1,
    options: options ?? [],
    correct: correct ?? [],
  })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, text, type, points, options, correct } = body

  const dbType =
    type === 'true_false' ? 'TRUE_FALSE' :
    type === 'multiple' ? 'MULTIPLE' : 'SINGLE'

  const { error: qErr } = await supabaseAdmin
    .from('Question')
    .update({ text, type: dbType, points: points ?? 1 })
    .eq('id', id)

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // Replace options: delete old, insert new
  await supabaseAdmin.from('Option').delete().eq('questionId', id)

  if (options && options.length > 0) {
    const optRecords = options.map((opt: string, i: number) => ({
      id: randomUUID(),
      questionId: id,
      text: opt,
      isCorrect: correct?.includes(opt) ?? false,
      order: i + 1,
    }))
    await supabaseAdmin.from('Option').insert(optRecords)
  }

  return NextResponse.json({ id, text, type, points, options, correct })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabaseAdmin.from('Option').delete().eq('questionId', id)
  const { error } = await supabaseAdmin.from('Question').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
