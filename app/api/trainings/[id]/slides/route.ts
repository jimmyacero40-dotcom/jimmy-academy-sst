import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type Params = { params: { id: string } }

// Replace all slides for a training (delete existing + bulk insert)
// Atomically: old slides deleted, new ones inserted, training.slides_count updated
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin' && role !== 'superadmin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = parseInt(params.id)

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido o demasiado grande' }, { status: 400 })
  }

  const { slides = [] } = body

  // Only insert slides that have image data; text-only slides are skipped
  const validSlides = slides.filter((s: any) => s.image_data)

  // Delete all existing slides for this training
  const { error: delErr } = await supabaseAdmin
    .from('training_slides')
    .delete()
    .eq('training_id', trainingId)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  let insertedCount = 0

  if (validSlides.length > 0) {
    const rows = validSlides.map((s: any) => ({
      training_id: trainingId,
      slide_index: s.slide_index,
      image_data: s.image_data,
      slide_text: s.slide_text || '',
    }))

    const { error: insErr, data: inserted } = await supabaseAdmin
      .from('training_slides')
      .insert(rows)
      .select('id')

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    insertedCount = inserted?.length ?? validSlides.length
  }

  // Update training: slides_count = actual stored count, cover = first slide image
  const firstImage = validSlides[0]?.image_data || null
  await supabaseAdmin
    .from('trainings')
    .update({ slides_count: insertedCount, cover_url: firstImage })
    .eq('id', trainingId)

  return NextResponse.json({ ok: true, count: insertedCount })
}

// Delete all slides
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin' && role !== 'superadmin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = parseInt(params.id)
  const { error } = await supabaseAdmin
    .from('training_slides')
    .delete()
    .eq('training_id', trainingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin
    .from('trainings')
    .update({ slides_count: 0, cover_url: null })
    .eq('id', trainingId)

  return NextResponse.json({ ok: true })
}
