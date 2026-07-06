import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper, getActiveCompanyId } from '@/lib/get-company'

export async function GET() {
  const companyId = await getActiveCompanyId()

  const cols = 'id, title, category, duration, description, temario, status, due, slides_count, questions_count, color, file_name, created_by, company_id, valid_from, valid_until, created_at, cover_url'
  let query = supabase.from('trainings').select(cols).order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)

  let { data, error } = await query

  if (error && error.message.includes('timeout')) {
    const retry = await query
    data = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const { authorized, user, companyId } = await isAdminOrSuper()
  if (!authorized || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const body = await req.json()
  const { title, category, duration, description, status, due, slides_count, questions_count, cover_url, color, file_name, valid_from, valid_until } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })

  const { data: training, error } = await supabase
    .from('trainings')
    .insert({
      title: title.trim(),
      category: category || 'Obligatorio',
      duration: duration || '8h',
      description: description || `Capacitación: ${title}`,
      status: status || 'activo',
      due: due || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      slides_count: slides_count || 0,
      questions_count: questions_count || 5,
      cover_url: cover_url || null,
      color: color || null,
      file_name: file_name || null,
      created_by: user.id,
      company_id: companyId,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(training, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = supabase.from('trainings').update(updates).eq('id', id)
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = supabase.from('trainings').delete().eq('id', parseInt(id))
  if (companyId) query = query.eq('company_id', companyId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
