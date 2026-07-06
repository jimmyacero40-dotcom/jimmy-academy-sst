import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type Params = { params: { id: string } }

// Replace all slides for a training (delete existing + bulk insert)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin' && role !== 'superadmin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = parseInt(params.id)
  const body = await req.json()
  // body: { slides: [{ slide_index, image_data, slide_text }], slides_count }

  const { slides = [], slides_count } = body

  // Delete all existing slides for this training
  const { error: delErr } = await supabaseAdmin
    .from('training_slides')
    .delete()
    .eq('training_id', trainingId)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Insert new slides
  if (slides.length > 0) {
    const rows = slides.map((s: any) => ({
      training_id: trainingId,
      slide_index: s.slide_index,
      image_data: s.image_data,
      slide_text: s.slide_text || '',
    }))

    const { error: insErr } = await supabaseAdmin
      .from('training_slides')
      .insert(rows)

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  // Update training metadata
  const updatePayload: any = {
    slides_count: slides_count ?? slides.length,
    cover_url: slides[0]?.image_data || null,
  }

  await supabaseAdmin
    .from('trainings')
    .update(updatePayload)
    .eq('id', trainingId)

  return NextResponse.json({ ok: true, count: slides.length })
}

// Delete all slides (used when replacing)
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
  return NextResponse.json({ ok: true })
}
