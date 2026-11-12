import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import { borrarDeBodega } from '@/lib/bodega'

export async function POST(req: NextRequest) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const trainingId = formData.get('training_id') as string

  if (!file || !trainingId) {
    return NextResponse.json({ error: 'Archivo y training_id requeridos' }, { status: 400 })
  }

  // La portada que había se anota para borrarla: cambiarla cinco veces
  // dejaba cinco archivos guardados y solo uno se veía.
  const { data: antes } = await supabase
    .from('trainings')
    .select('cover_url')
    .eq('id', parseInt(trainingId))
    .maybeSingle()

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

  // Se guarda solo la dirección (es corta), y se deja dicho que la portada
  // la escogió una persona: desde aquí ya no se pisa al subir material.
  const { error: updateError } = await supabase
    .from('trainings')
    .update({ cover_url: coverUrl, portada_manual: true })
    .eq('id', parseInt(trainingId))

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Solo se va si de verdad quedó suelta: si esa misma imagen era una
  // diapositiva del curso, sigue en uso y no se toca.
  await borrarDeBodega([antes?.cover_url])

  return NextResponse.json({ cover_url: coverUrl })
}
