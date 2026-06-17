import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/lib/supabase'

async function getUser() {
  const session = await getServerSession()
  if (!session?.user?.email) return null
  const { data } = await supabase
    .from('users')
    .select('id, role, email, name')
    .eq('email', session.user.email)
    .single()
  return data
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const trainingId = parseInt(params.id)

  const { data: training } = await supabase
    .from('trainings')
    .select('*')
    .eq('id', trainingId)
    .single()

  if (!training) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: slides } = await supabase
    .from('training_slides')
    .select('slide_index, image_data, slide_text')
    .eq('training_id', trainingId)
    .order('slide_index', { ascending: true })

  const { data: questions } = await supabase
    .from('training_questions')
    .select('question, options, correct_index, explanation')
    .eq('training_id', trainingId)

  return NextResponse.json({
    training,
    images: slides?.map(s => s.image_data) || [],
    texts: slides?.map(s => s.slide_text) || [],
    questions: questions?.map(q => ({
      q: q.question,
      options: q.options,
      correct: q.correct_index,
      explanation: q.explanation,
    })) || [],
  })
}
