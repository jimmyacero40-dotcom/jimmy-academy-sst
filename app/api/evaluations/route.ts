import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveCompanyId } from '@/lib/get-company'
import { randomUUID } from 'crypto'

// Deterministic UUID for a trainings.id (integer) → Training.id (uuid)
function trainingUuid(intId: number | string) {
  return `00000000-0000-0000-0000-${String(intId).padStart(12, '0')}`
}

export async function GET() {
  // All evaluations — filtered client-side or show all for now
  const { data, error } = await supabaseAdmin
    .from('Evaluation')
    .select(`
      id, title, description, timeLimit, maxAttempts, minScore,
      isRandom, questionCount, isActive, createdAt,
      Training(id, title, category)
    `)
    .order('createdAt', { ascending: false })
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
  const body = await req.json()
  const { title, description, training_id, min_score, time_limit } = body

  // The Prisma Company table has a different ID than our custom companies table.
  // Fetch the correct Prisma Company.id to use as FK in Training.
  const { data: prismaCompanies } = await supabaseAdmin
    .from('Company')
    .select('id')
    .limit(1)
    .single()

  const prismaCompanyId = (prismaCompanies as any)?.id
  if (!prismaCompanyId) return NextResponse.json({ error: 'Empresa no encontrada en el sistema' }, { status: 400 })

  // Upsert a Training record bridging our trainings table int id → Prisma Training uuid
  let prismaTrainingId: string
  let trainingTitle = ''

  if (training_id) {
    prismaTrainingId = trainingUuid(training_id)

    // Fetch title from our trainings table
    const { data: tr } = await supabaseAdmin
      .from('trainings')
      .select('title, category')
      .eq('id', training_id)
      .single()

    trainingTitle = (tr as any)?.title ?? 'Capacitación'

    const { error: trErr } = await supabaseAdmin
      .from('Training')
      .upsert({
        id: prismaTrainingId,
        title: trainingTitle,
        category: (tr as any)?.category ?? 'SST',
        duration: 60,
        updatedAt: new Date().toISOString(),
        companyId: prismaCompanyId,
      }, { onConflict: 'id' })

    if (trErr) return NextResponse.json({ error: `Error al crear Training puente: ${trErr.message}` }, { status: 500 })
  } else {
    // Generic placeholder Training per company
    prismaTrainingId = trainingUuid(prismaCompanyId.replace(/-/g, '').slice(0, 12))
    trainingTitle = 'General'

    const { error: trErr } = await supabaseAdmin
      .from('Training')
      .upsert({
        id: prismaTrainingId,
        title: 'General',
        category: 'SST',
        duration: 60,
        updatedAt: new Date().toISOString(),
        companyId: prismaCompanyId,
      }, { onConflict: 'id' })

    if (trErr) return NextResponse.json({ error: `Error al crear Training genérico: ${trErr.message}` }, { status: 500 })
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
    training_title: trainingTitle,
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
