import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveCompanyId } from '@/lib/get-company'
import { randomUUID } from 'crypto'

// Deterministic UUID for a trainings.id (integer) → Training.id (uuid)
function trainingUuid(intId: number | string) {
  return `00000000-0000-0000-0000-${String(intId).padStart(12, '0')}`
}

export async function GET() {
  const companyId = await getActiveCompanyId()

  // Get evaluations via Training.companyId filter
  let q = supabaseAdmin
    .from('Evaluation')
    .select(`
      id, title, description, timeLimit, maxAttempts, minScore,
      isRandom, questionCount, isActive, createdAt,
      Training(id, title, category)
    `)
    .order('createdAt', { ascending: false })

  if (companyId) {
    q = q.eq('Training.companyId', companyId)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalize to snake_case for the frontend
  const normalized = (data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    time_limit: e.timeLimit,
    min_score: e.minScore,
    max_attempts: e.maxAttempts,
    is_random: e.isRandom,
    question_count: e.questionCount,
    is_active: e.isActive,
    created_at: e.createdAt,
    training_id: e.Training?.id ?? null,
    training_title: e.Training?.title ?? null,
    training_category: e.Training?.category ?? null,
  }))

  return NextResponse.json(normalized)
}

export async function POST(req: NextRequest) {
  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa' }, { status: 400 })

  const body = await req.json()
  const { title, description, training_id, min_score, time_limit } = body

  // Upsert a Training record bridging our trainings table int id → Prisma Training uuid
  let prismaTrainingId: string
  if (training_id) {
    prismaTrainingId = trainingUuid(training_id)

    // Fetch title from our trainings table
    const { data: tr } = await supabaseAdmin
      .from('trainings')
      .select('title, category')
      .eq('id', training_id)
      .single()

    await supabaseAdmin
      .from('Training')
      .upsert({
        id: prismaTrainingId,
        title: tr?.title ?? 'Capacitación',
        category: tr?.category ?? 'SST',
        duration: 60,
        updatedAt: new Date().toISOString(),
        companyId,
      }, { onConflict: 'id' })
  } else {
    // Create a generic Training placeholder for this company
    prismaTrainingId = trainingUuid(`${companyId.replace(/-/g, '').slice(0, 12)}`)
    await supabaseAdmin
      .from('Training')
      .upsert({
        id: prismaTrainingId,
        title: 'General',
        category: 'SST',
        duration: 60,
        updatedAt: new Date().toISOString(),
        companyId,
      }, { onConflict: 'id' })
  }

  const evalId = randomUUID()
  const { data, error } = await supabaseAdmin
    .from('Evaluation')
    .insert({
      id: evalId,
      title,
      description: description ?? null,
      trainingId: prismaTrainingId,
      minScore: min_score ?? 70,
      timeLimit: time_limit ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    id: data.id,
    title: data.title,
    min_score: data.minScore,
    time_limit: data.timeLimit,
    is_active: data.isActive,
    created_at: data.createdAt,
    training_id,
    training_title: body.training_title ?? null,
  })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, title, description, min_score, time_limit } = body

  const { data, error } = await supabaseAdmin
    .from('Evaluation')
    .update({
      title,
      description: description ?? null,
      minScore: min_score ?? 70,
      timeLimit: time_limit ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, title: data.title, min_score: data.minScore })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()

  // Delete options first, then questions, then evaluation
  const { data: questions } = await supabaseAdmin
    .from('Question')
    .select('id')
    .eq('evaluationId', id)

  if (questions?.length) {
    const qIds = questions.map((q: any) => q.id)
    await supabaseAdmin.from('Option').delete().in('questionId', qIds)
  }

  await supabaseAdmin.from('Question').delete().eq('evaluationId', id)
  const { error } = await supabaseAdmin.from('Evaluation').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
