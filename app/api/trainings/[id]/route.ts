import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const trainingId = parseInt(params.id)
  const slideIndex = req.nextUrl.searchParams.get('slide')

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
    .select('id, question, options, correct_index, explanation')
    .eq('training_id', trainingId)

  // Load blocks (new experience system) — graceful fallback if table doesn't exist
  let blocks: any[] = []
  let resources: any[] = []
  try {
    const { data: bData } = await supabase
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
    blocks = bData ?? []

    const { data: rData } = await supabase
      .from('training_resources')
      .select('id, resource_type, label, is_master, is_downloadable, sort_order')
      .eq('training_id', trainingId)
      .order('sort_order', { ascending: true })
    resources = rData ?? []
  } catch (_) {}

  return NextResponse.json({
    training,
    slideCount: slides?.length || 0,
    texts: slides?.map(s => s.slide_text) || [],
    questions: questions?.map(q => ({
      id: q.id,
      q: q.question,
      options: q.options,
      correct: q.correct_index,
      explanation: q.explanation,
    })) || [],
    blocks,
    resources,
  })
}
