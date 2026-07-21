import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper, getCurrentUser } from '@/lib/get-company'

// GET — list documents (admin: all; worker: active+required)
export async function GET() {
  const { user } = await isAdminOrSuper().catch(() => ({ user: null, authorized: false, companyId: null }))
  const currentUser = user ?? await getCurrentUser()
  if (!currentUser) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.role === 'admin'

  let query = supabase.from('legal_documents').select('*').order('created_at', { ascending: false })
  if (!isSuperAdmin) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — create document (superadmin only)
export async function POST(req: NextRequest) {
  const { authorized, user } = await isAdminOrSuper()
  if (!authorized || user?.role !== 'superadmin') return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })

  const body = await req.json()
  const { title, content, version = '1.0', requires_signature = true, slug } = body
  if (!title?.trim() || !content?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'title, slug y content son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .insert({ title: title.trim(), slug: slug.trim(), content, version, requires_signature, is_active: true, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Record initial version
  await supabase.from('legal_document_versions').insert({
    document_id: data.id, version: data.version, content: data.content, published_by: user.id,
  })

  return NextResponse.json(data, { status: 201 })
}

// PUT — update document or publish new version (superadmin only)
export async function PUT(req: NextRequest) {
  const { authorized, user } = await isAdminOrSuper()
  if (!authorized || user?.role !== 'superadmin') return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })

  const { id, title, content, version, requires_signature, is_active } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (title     !== undefined) updates.title              = title.trim()
  if (content   !== undefined) updates.content            = content
  if (version   !== undefined) updates.version            = version
  if (requires_signature !== undefined) updates.requires_signature = requires_signature
  if (is_active !== undefined) updates.is_active          = is_active

  const { data, error } = await supabase
    .from('legal_documents').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If version changed, save to history
  if (version !== undefined) {
    await supabase.from('legal_document_versions').upsert({
      document_id: id, version, content: content ?? data.content, published_by: user.id,
    }, { onConflict: 'document_id,version' })
  }

  return NextResponse.json(data)
}
