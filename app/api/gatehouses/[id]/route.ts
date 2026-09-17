import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('gatehouses')
    .select(`
      id, name, location, description, is_active, created_at, updated_at,
      gatehouse_operators(user_id, users!gatehouse_operators_user_id_fkey(id, name, email, role, active))
    `)
    .eq('id', params.id)
    .eq('company_id', companyId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Portería no encontrada' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const allowed = ['name', 'location', 'description', 'is_active']
  const updates: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) updates[k] = body[k]
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('gatehouses')
    .update(updates)
    .eq('id', params.id)
    .eq('company_id', companyId)
    .select('id, name, location, description, is_active, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('gatehouses')
    .delete()
    .eq('id', params.id)
    .eq('company_id', companyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
