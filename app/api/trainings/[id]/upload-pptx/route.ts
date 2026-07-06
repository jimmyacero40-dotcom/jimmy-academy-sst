import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'

type Params = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin' && role !== 'superadmin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = parseInt(params.id)

  // Ensure bucket exists
  const { error: bucketErr } = await supabaseAdmin.storage.createBucket('training-files', {
    public: false,
    fileSizeLimit: 524288000, // 500 MB
  })
  // Ignore 'already exists' error
  if (bucketErr && !bucketErr.message.toLowerCase().includes('already exist')) {
    console.warn('Bucket creation warning:', bucketErr.message)
  }

  // Parse multipart form
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const storagePath = `trainings/${trainingId}/${randomUUID()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  // Upload to Supabase Storage
  const { error: uploadErr } = await supabaseAdmin.storage
    .from('training-files')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      upsert: true,
    })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  // Delete any previous master resource for this training
  await supabaseAdmin
    .from('training_resources')
    .delete()
    .eq('training_id', trainingId)
    .eq('is_master', true)

  // Create training_resources record
  const { data: resource, error: resErr } = await supabaseAdmin
    .from('training_resources')
    .insert({
      id: randomUUID(),
      training_id: trainingId,
      resource_type: 'pptx',
      label: file.name,
      storage_path: storagePath,
      mime_type: file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      file_size_bytes: buffer.byteLength,
      is_master: true,
      is_downloadable: true,
      sort_order: 0,
      uploaded_by: (session?.user as any)?.id ?? null,
    })
    .select()
    .single()

  if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 })

  // Update training file_name
  await supabaseAdmin
    .from('trainings')
    .update({ file_name: file.name })
    .eq('id', trainingId)

  return NextResponse.json({ ok: true, storage_path: storagePath, resource })
}
