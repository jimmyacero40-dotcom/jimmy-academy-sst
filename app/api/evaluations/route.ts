import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper, getActiveCompanyId } from '@/lib/get-company'

export async function GET() {
  const companyId = await getActiveCompanyId()

  let query = supabase
    .from('evaluations')
    .select('id, title, min_score, time_limit, created_at, training_id, trainings(id, title, category)')
    .order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa' }, { status: 400 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('evaluations')
    .insert({ ...body, company_id: companyId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, ...rest } = await req.json()
  const { data, error } = await supabase
    .from('evaluations')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  await supabase.from('questions').delete().eq('evaluation_id', id)
  const { error } = await supabase.from('evaluations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
