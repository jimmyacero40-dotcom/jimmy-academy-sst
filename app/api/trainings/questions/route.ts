import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { training_id, questions } = body

  if (!training_id || !Array.isArray(questions)) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Delete existing questions for this training
  await supabase.from('training_questions').delete().eq('training_id', training_id)

  // Insert new questions
  if (questions.length > 0) {
    const rows = questions.map((q: any) => ({
      training_id,
      question: q.q || q.question,
      options: q.options,
      correct_index: q.correct ?? q.correct_index ?? 0,
      explanation: q.explanation || '',
    }))

    const { error } = await supabase.from('training_questions').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
