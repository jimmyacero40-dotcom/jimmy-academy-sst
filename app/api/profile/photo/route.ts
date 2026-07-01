import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/get-company'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  // Accept JPEG/PNG/WEBP only, max 4MB (already compressed client-side)
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se aceptan imágenes JPG, PNG o WEBP' }, { status: 400 })
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 4 MB' }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const fileName = `profiles/${user.id}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Create bucket if needed
  await supabase.storage.createBucket('worker-photos', { public: true }).catch(() => {})

  const { error: uploadError } = await supabase.storage
    .from('worker-photos')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('worker-photos').getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl })
}
