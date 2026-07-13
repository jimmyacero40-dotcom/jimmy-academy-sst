import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let query = supabase
    .from('annual_plans')
    .select('id, name, year, status, profile_id, company_id, created_at, plan_items(count)')
    .order('year', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data ?? []).map((p: any) => ({
    ...p,
    item_count: p.plan_items?.[0]?.count ?? 0,
    plan_items: undefined,
  }))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const { name, year, profile_id } = await req.json()
  if (!name?.trim() || !year) return NextResponse.json({ error: 'Nombre y año son requeridos' }, { status: 400 })

  const { data, error } = await supabase
    .from('annual_plans')
    .insert({ name: name.trim(), year: Number(year), status: 'draft', company_id: companyId, profile_id: profile_id || null })
    .select('id, name, year, status, profile_id, company_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, item_count: 0 }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, name, year } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = supabase
    .from('annual_plans')
    .update({ name: name?.trim(), year: Number(year) })
    .eq('id', id).eq('status', 'draft')
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.select('id, name, year, status, company_id, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = supabase.from('annual_plans').delete().eq('id', id).eq('status', 'draft')
  if (companyId) query = query.eq('company_id', companyId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
