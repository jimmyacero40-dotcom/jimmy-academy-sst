import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import bcrypt from 'bcryptjs'

export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let query = supabaseAdmin
    .from('users')
    .select('id, email, name, cedula, role, area, active, company_id, created_at')
    .order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch all user_groups → groups in one query (FK user_groups.group_id → groups exists)
  const userIds = (data ?? []).map((u: any) => u.id)
  const { data: ugData } = await supabaseAdmin
    .from('user_groups')
    .select('user_id, groups(id, name, color)')
    .in('user_id', userIds.length ? userIds : ['_'])

  // Build a map: user_id → groups[]
  const groupsByUser: Record<string, any[]> = {}
  for (const row of ugData ?? []) {
    if (!groupsByUser[row.user_id]) groupsByUser[row.user_id] = []
    if (row.groups) groupsByUser[row.user_id].push(row.groups)
  }

  // Fetch photo_url from user_profiles
  const { data: profilesData } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, photo_url')
    .in('user_id', userIds.length ? userIds : ['_'])

  const photoByUser: Record<string, string> = {}
  for (const p of profilesData ?? []) {
    if (p.photo_url) photoByUser[p.user_id] = p.photo_url
  }

  const result = (data ?? []).map((u: any) => ({
    ...u,
    photo_url: photoByUser[u.id] || null,
    user_groups: (groupsByUser[u.id] ?? []).map(g => ({ groups: g })),
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const body = await req.json()
  const { email, password, name, cedula, role, area } = body

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, contraseña y nombre son requeridos' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password: hash,
      name,
      cedula: cedula || '',
      role: role || 'worker',
      area: area || '',
      active: true,
      company_id: companyId,
    })
    .select('id, email, name, cedula, role, area, active, company_id, created_at')
    .single()

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10)
  }

  let query = supabase.from('users').update(updates).eq('id', id)
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.select('id, email, name, cedula, role, area, active, company_id, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, ids } = await req.json()
  const deleteIds: string[] = ids || (id ? [id] : [])
  if (!deleteIds.length) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = supabase.from('users').delete().in('id', deleteIds)
  if (companyId) query = query.eq('company_id', companyId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
