import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

export async function POST(req: NextRequest) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const trainingId = formData.get('training_id') as string

  if (!file || !trainingId) {
    return NextResponse.json({ error: 'Archivo y training_id requeridos' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `covers/${trainingId}_${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Try to create bucket if it doesn't exist
  await supabase.storage.createBucket('training-covers', { public: true }).catch(() => {})

  const { error: uploadError } = await supabase.storage
    .from('training-covers')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('training-covers')
    .getPublicUrl(fileName)

  const coverUrl = urlData.publicUrl

  // Save only the URL string (small) in the trainings table
  const { error: updateError } = await supabase
    .from('trainings')
    .update({ cover_url: coverUrl })
    .eq('id', parseInt(trainingId))

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ cover_url: coverUrl })
}
