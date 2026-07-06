import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

function trainingUuid(intId: number | string) {
  return `00000000-0000-0000-0000-${String(intId).padStart(12, '0')}`
}

export async function POST() {
  // 1. Get all distinct training_ids that have questions
  const { data: tqGroups, error: tqErr } = await supabaseAdmin
    .from('training_questions')
    .select('training_id, question, options, correct_index')
    .order('training_id', { ascending: true })

  if (tqErr) return NextResponse.json({ error: tqErr.message }, { status: 500 })
  if (!tqGroups || tqGroups.length === 0)
    return NextResponse.json({ message: 'No hay preguntas en training_questions', created: [] })

  // Group by training_id
  const byTraining = new Map<number, typeof tqGroups>()
  for (const row of tqGroups) {
    const tid = (row as any).training_id
    if (!byTraining.has(tid)) byTraining.set(tid, [])
    byTraining.get(tid)!.push(row)
  }

  // 2. Get training info for each
  const trainingIds = [...byTraining.keys()]
  const { data: trainings, error: trErr } = await supabaseAdmin
    .from('trainings')
    .select('id, title, category')
    .in('id', trainingIds)

  if (trErr) return NextResponse.json({ error: trErr.message }, { status: 500 })

  // 3. Get Prisma company id
  const { data: prismaCompany } = await supabaseAdmin
    .from('Company').select('id').limit(1).single()
  const prismaCompanyId = (prismaCompany as any)?.id
  if (!prismaCompanyId) return NextResponse.json({ error: 'Empresa Prisma no encontrada' }, { status: 400 })

  // 4. Check which evaluations already exist (avoid duplicates)
  const { data: existingEvals } = await supabaseAdmin
    .from('Evaluation')
    .select('id, trainingId')
  const existingTrainingIds = new Set((existingEvals ?? []).map((e: any) => e.trainingId))

  const created: { training_id: number; title: string; questions: number }[] = []
  const skipped: { training_id: number; title: string; reason: string }[] = []

  for (const training of (trainings ?? [])) {
    const rows = byTraining.get(training.id as number) ?? []
    if (rows.length === 0) { skipped.push({ training_id: training.id, title: training.title, reason: 'sin preguntas' }); continue }

    const prismaTrainingId = trainingUuid(training.id)

    // Skip if evaluation for this training already exists
    if (existingTrainingIds.has(prismaTrainingId)) {
      skipped.push({ training_id: training.id, title: training.title, reason: 'ya existe evaluación' })
      continue
    }

    // Upsert bridge Training
    await supabaseAdmin.from('Training').upsert({
      id: prismaTrainingId,
      title: training.title,
      category: training.category ?? 'SST',
      duration: 60,
      updatedAt: new Date().toISOString(),
      companyId: prismaCompanyId,
    }, { onConflict: 'id' })

    // Create Evaluation
    const evalId = randomUUID()
    const { error: evalErr } = await supabaseAdmin.from('Evaluation').insert({
      id: evalId,
      title: training.title,
      description: `Importada desde: ${training.title}`,
      trainingId: prismaTrainingId,
      minScore: 70,
      timeLimit: null,
    })
    if (evalErr) { skipped.push({ training_id: training.id, title: training.title, reason: evalErr.message }); continue }

    // Insert questions + options
    let count = 0
    for (let order = 0; order < rows.length; order++) {
      const tq = rows[order] as any
      const questionId = randomUUID()
      const options: string[] = Array.isArray(tq.options) ? tq.options : []
      const correctIdx: number = typeof tq.correct_index === 'number' ? tq.correct_index : 0
      const isTF = options.length === 2 &&
        options[0]?.toLowerCase().trim() === 'verdadero' &&
        options[1]?.toLowerCase().trim() === 'falso'

      const { error: qErr } = await supabaseAdmin.from('Question').insert({
        id: questionId,
        evaluationId: evalId,
        text: tq.question,
        type: isTF ? 'TRUE_FALSE' : 'SINGLE',
        points: 1,
        order: order + 1,
      })
      if (qErr) continue

      if (options.length > 0) {
        await supabaseAdmin.from('Option').insert(
          options.map((opt: string, i: number) => ({
            id: randomUUID(),
            questionId,
            text: opt,
            isCorrect: i === correctIdx,
            order: i + 1,
          }))
        )
      }
      count++
    }

    created.push({ training_id: training.id, title: training.title, questions: count })
  }

  return NextResponse.json({ created, skipped })
}
