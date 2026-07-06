import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

function trainingUuid(intId: number | string) {
  return `00000000-0000-0000-0000-${String(intId).padStart(12, '0')}`
}

export async function POST(req: NextRequest) {
  const { training_id } = await req.json()
  if (!training_id) return NextResponse.json({ error: 'training_id requerido' }, { status: 400 })

  // Fetch training info
  const { data: training, error: trErr } = await supabaseAdmin
    .from('trainings')
    .select('id, title, category')
    .eq('id', training_id)
    .single()
  if (trErr || !training) return NextResponse.json({ error: 'Capacitación no encontrada' }, { status: 404 })

  // Fetch questions from training_questions
  const { data: tqRows, error: tqErr } = await supabaseAdmin
    .from('training_questions')
    .select('id, question, options, correct_index, explanation')
    .eq('training_id', training_id)
    .order('id', { ascending: true })
  if (tqErr) return NextResponse.json({ error: tqErr.message }, { status: 500 })
  if (!tqRows || tqRows.length === 0)
    return NextResponse.json({ error: 'Esta capacitación no tiene preguntas guardadas' }, { status: 400 })

  // Get the Prisma company id
  const { data: prismaCompany } = await supabaseAdmin
    .from('Company')
    .select('id')
    .limit(1)
    .single()
  const prismaCompanyId = (prismaCompany as any)?.id
  if (!prismaCompanyId) return NextResponse.json({ error: 'Empresa no encontrada en el sistema' }, { status: 400 })

  // Upsert bridge Training record
  const prismaTrainingId = trainingUuid(training_id)
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
  const { data: evalData, error: evalErr } = await supabaseAdmin
    .from('Evaluation')
    .insert({
      id: evalId,
      title: training.title,
      description: `Importada desde la capacitación: ${training.title}`,
      trainingId: prismaTrainingId,
      minScore: 70,
      timeLimit: null,
    })
    .select()
    .single()
  if (evalErr) return NextResponse.json({ error: evalErr.message }, { status: 500 })

  // Copy questions + options
  let importedCount = 0
  for (let order = 0; order < tqRows.length; order++) {
    const tq = tqRows[order] as any
    const questionId = randomUUID()
    const options: string[] = Array.isArray(tq.options) ? tq.options : []
    const correctIdx: number = typeof tq.correct_index === 'number' ? tq.correct_index : 0

    // Detect true/false
    const isTF = options.length === 2 &&
      options[0].toLowerCase().trim() === 'verdadero' &&
      options[1].toLowerCase().trim() === 'falso'
    const dbType = isTF ? 'TRUE_FALSE' : 'SINGLE'

    const { error: qErr } = await supabaseAdmin.from('Question').insert({
      id: questionId,
      evaluationId: evalId,
      text: tq.question,
      type: dbType,
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
    importedCount++
  }

  return NextResponse.json({
    id: evalData.id,
    title: evalData.title,
    min_score: evalData.minScore,
    time_limit: evalData.timeLimit,
    is_active: evalData.isActive,
    created_at: evalData.createdAt,
    training_id,
    training_title: training.title,
    training_category: training.category,
    imported_questions: importedCount,
  })
}
