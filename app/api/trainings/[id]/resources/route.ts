import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const trainingId = parseInt(params.id)
  const { data, error } = await supabaseAdmin
    .from('training_resources')
    .select('*')
    .eq('training_id', trainingId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const trainingId = parseInt(params.id)
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('training_resources')
    .insert({
      id: randomUUID(),
      training_id: trainingId,
      resource_type: body.resource_type,
      label: body.label,
      storage_path: body.storage_path ?? null,
      url: body.url ?? null,
      mime_type: body.mime_type ?? null,
      file_size_bytes: body.file_size_bytes ?? null,
      is_downloadable: body.is_downloadable ?? true,
      is_master: body.is_master ?? false,
      sort_order: body.sort_order ?? 0,
      uploaded_by: (session?.user as any)?.id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const trainingId = parseInt(params.id)
  const { id } = await req.json()

  // Get storage path first to delete from storage
  const { data: resource } = await supabaseAdmin
    .from('training_resources')
    .select('storage_path, is_master')
    .eq('id', id)
    .eq('training_id', trainingId)
    .single()

  if (resource?.storage_path && !resource.is_master) {
    await supabaseAdmin.storage
      .from('training-files')
      .remove([resource.storage_path])
  }

  const { error } = await supabaseAdmin
    .from('training_resources')
    .delete()
    .eq('id', id)
    .eq('training_id', trainingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
