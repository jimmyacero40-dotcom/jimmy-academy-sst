import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const trainingId = parseInt(params.id)

  // Find the master resource (original PPTX)
  const { data: resource, error } = await supabaseAdmin
    .from('training_resources')
    .select('storage_path, label, mime_type, file_name')
    .eq('training_id', trainingId)
    .eq('is_master', true)
    .single()

  if (error || !resource?.storage_path) {
    return NextResponse.json(
      { error: 'No se encontró el archivo original de esta capacitación' },
      { status: 404 }
    )
  }

  // Generate a signed URL valid for 1 hour
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from('training-files')
    .createSignedUrl(resource.storage_path, 3600)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: 'No se pudo generar el enlace de descarga' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    url: signed.signedUrl,
    label: resource.label,
    mime_type: resource.mime_type,
  })
}
