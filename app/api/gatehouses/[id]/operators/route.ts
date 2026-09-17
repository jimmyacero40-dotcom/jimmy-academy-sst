import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Verify gatehouse belongs to company
  const { data: gh } = await supabaseAdmin.from('gatehouses').select('id').eq('id', params.id).eq('company_id', companyId).single()
  if (!gh) return NextResponse.json({ error: 'Portería no encontrada' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('gatehouse_operators')
    .select('id, user_id, created_at, users!gatehouse_operators_user_id_fkey(id, name, email, role, active)')
    .eq('gatehouse_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — assign operator
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  const { data: gh } = await supabaseAdmin.from('gatehouses').select('id').eq('id', params.id).eq('company_id', companyId).single()
  if (!gh) return NextResponse.json({ error: 'Portería no encontrada' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('gatehouse_operators')
    .insert({ gatehouse_id: params.id, user_id })
    .select('id, user_id, created_at')
    .single()

  if (error) {
    if (error.message.includes('unique')) return NextResponse.json({ error: 'Usuario ya asignado a esta portería' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

// DELETE — remove operator
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { user_id } = await req.json()
  const { data: gh } = await supabaseAdmin.from('gatehouses').select('id').eq('id', params.id).eq('company_id', companyId).single()
  if (!gh) return NextResponse.json({ error: 'Portería no encontrada' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('gatehouse_operators')
    .delete()
    .eq('gatehouse_id', params.id)
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
