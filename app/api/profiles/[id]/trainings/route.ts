import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

// GET — cursos asignados al perfil
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase
    .from('profile_trainings')
    .select('required, training_id, trainings(id, title, description, duration)')
    .eq('profile_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data ?? []).map((row: any) => ({
    ...row.trainings,
    required: row.required,
  }))
  return NextResponse.json(result)
}

// POST — agregar curso al perfil
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { training_id, required = true } = await req.json()
  if (!training_id) return NextResponse.json({ error: 'training_id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('profile_trainings')
    .upsert({ profile_id: params.id, training_id, required }, { onConflict: 'profile_id,training_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — quitar curso del perfil
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { training_id } = await req.json()
  if (!training_id) return NextResponse.json({ error: 'training_id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('profile_trainings')
    .delete()
    .eq('profile_id', params.id)
    .eq('training_id', training_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
