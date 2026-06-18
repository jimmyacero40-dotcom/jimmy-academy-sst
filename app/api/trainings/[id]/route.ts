import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const trainingId = parseInt(params.id)
  const slideIndex = req.nextUrl.searchParams.get('slide')

  // If requesting a specific slide, return just that image
  if (slideIndex !== null) {
    const { data } = await supabase
      .from('training_slides')
      .select('image_data')
      .eq('training_id', trainingId)
      .eq('slide_index', parseInt(slideIndex))
      .single()

    if (!data) return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    return NextResponse.json({ image: data.image_data })
  }

  // Otherwise return training metadata + texts (no heavy images)
  const { data: training } = await supabase
    .from('trainings')
    .select('*')
    .eq('id', trainingId)
    .single()

  if (!training) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: slides } = await supabase
    .from('training_slides')
    .select('slide_index, slide_text')
    .eq('training_id', trainingId)
    .order('slide_index', { ascending: true })

  const { data: questions } = await supabase
    .from('training_questions')
    .select('question, options, correct_index, explanation')
    .eq('training_id', trainingId)

  return NextResponse.json({
    training,
    slideCount: slides?.length || 0,
    texts: slides?.map(s => s.slide_text) || [],
    questions: questions?.map(q => ({
      q: q.question,
      options: q.options,
      correct: q.correct_index,
      explanation: q.explanation,
    })) || [],
  })
}
