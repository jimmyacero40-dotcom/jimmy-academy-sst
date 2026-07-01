import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

// GET /api/groups/[id]/members — lista miembros del grupo
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase
    .from('user_groups')
    .select('user_id, added_at, users(id, name, email, cedula, cargo, area, area_id, role, active)')
    .eq('group_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = (data ?? []).map((row: any) => ({ ...row.users, added_at: row.added_at }))
  return NextResponse.json(members)
}

// POST /api/groups/[id]/members — agregar miembro(s)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { user_ids } = await req.json()
  if (!user_ids?.length) return NextResponse.json({ error: 'user_ids requerido' }, { status: 400 })

  const rows = user_ids.map((uid: string) => ({ user_id: uid, group_id: params.id }))
  const { error } = await supabase.from('user_groups').upsert(rows, { onConflict: 'user_id,group_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/groups/[id]/members — quitar miembro
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('user_groups')
    .delete()
    .eq('group_id', params.id)
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
