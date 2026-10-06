import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import { perfilSugerido, cursosQueEncajan } from '@/lib/perfiles-sugeridos'

export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let query = supabase
    .from('training_profiles')
    .select(`
      id, name, cargo, description, company_id, created_at,
      profile_trainings(count)
    `)
    .order('name')
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data ?? []).map((p: any) => ({
    ...p,
    training_count: p.profile_trainings?.[0]?.count ?? 0,
    profile_trainings: undefined,
  }))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const { name, cargo, description } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('training_profiles')
    .insert({ name: name.trim(), cargo: cargo?.trim() || null, description: description?.trim() || null, company_id: companyId })
    .select('id, name, cargo, description, company_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si es uno de los perfiles sugeridos, nace con los cursos que le
  // corresponden en vez de quedar vacío, que era lo que pasaba antes.
  let cursosCargados = 0
  const sugerido = perfilSugerido(data.name)
  if (sugerido) {
    const { data: biblioteca } = await supabase
      .from('trainings').select('id, title, category')
      .eq('company_id', companyId).eq('status', 'activo')

    const elegidos = cursosQueEncajan(biblioteca ?? [], sugerido.claves)
    if (elegidos.length) {
      const { error: errCursos } = await supabase.from('profile_trainings').insert(
        elegidos.map((c, i) => ({ profile_id: data.id, training_id: c.id, required: true, sort_order: i })))
      if (!errCursos) cursosCargados = elegidos.length
    }
  }

  return NextResponse.json({ ...data, training_count: cursosCargados }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, name, cargo, description } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = supabase
    .from('training_profiles')
    .update({ name: name?.trim(), cargo: cargo?.trim() || null, description: description?.trim() || null })
    .eq('id', id)
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.select('id, name, cargo, description, company_id, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  let query = supabase.from('training_profiles').delete().eq('id', id)
  if (companyId) query = query.eq('company_id', companyId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
