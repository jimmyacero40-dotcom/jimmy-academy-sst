import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  const { data } = await supabase
    .from('users')
    .select('id, role, email, name')
    .eq('email', session.user.email)
    .single()
  return data
}

export async function GET() {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado', debug: 'No session found' }, { status: 401 })
  }
  const { data: user } = await supabase
    .from('users')
    .select('id, role, email, name')
    .eq('email', session.user.email)
    .single()
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Solo admin puede crear cursos' }, { status: 403 })

  const body = await req.json()
  const { title, category, duration, description, status, due, slides_count, questions_count, cover_url, color, file_name, slides, texts, questions } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })

  const { data: training, error } = await supabase
    .from('trainings')
    .insert({
      title: title.trim(),
      category: category || 'Obligatorio',
      duration: duration || '8h',
      description: description || `Capacitación: ${title}`,
      status: status || 'activo',
      due: due || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      slides_count: slides_count || 0,
      questions_count: questions_count || 5,
      cover_url: cover_url || null,
      color: color || null,
      file_name: file_name || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Save slides if provided
  if (slides && Array.isArray(slides) && slides.length > 0) {
    const slideRows = slides.map((img: string, i: number) => ({
      training_id: training.id,
      slide_index: i,
      image_data: img,
      slide_text: texts?.[i] || '',
    }))
    await supabase.from('training_slides').insert(slideRows)
  }

  // Save custom questions if provided
  if (questions && Array.isArray(questions) && questions.length > 0) {
    const qRows = questions.map((q: any) => ({
      training_id: training.id,
      question: q.q || q.question,
      options: q.options,
      correct_index: q.correct ?? q.correct_index ?? 0,
      explanation: q.explanation || '',
    }))
    await supabase.from('training_questions').insert(qRows)
  }

  return NextResponse.json(training, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase.from('trainings').delete().eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
