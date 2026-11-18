import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('personal.ver')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const userId = params.id

  // Fetch user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, name, email, cedula, role, area, cargo, active, created_at')
    .eq('id', userId)
    .single()

  if (userErr || !user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Las capacitaciones de la persona.
  //
  // Se trae el estado de la ronda para poder descartar las canceladas: cancelar
  // una ronda no borra las inscripciones, así que una capacitación que el
  // administrador ya quitó seguía apareciendo en la hoja de vida del trabajador
  // como si estuviera pendiente. Es el mismo filtro que ya tiene Trazabilidad.
  const { data: todas } = await supabase
    .from('enrollments')
    .select(`
      id, status, due_date, started_at, completed_at, score, created_at,
      trainings(id, title, category, duration),
      plan_items(estado)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const enrollments = (todas ?? [])
    .filter((e: any) => e.plan_items?.estado !== 'cancelada')
    .map(({ plan_items, ...resto }: any) => resto)

  // Fetch certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, code, course, issued, expires, score, duration')
    .eq('user_id', userId)
    .order('issued', { ascending: false })

  // Fetch groups
  const { data: groupLinks } = await supabase
    .from('user_groups')
    .select('groups(id, name, color)')
    .eq('user_id', userId)

  const groups = (groupLinks || []).map((g: any) => g.groups).filter(Boolean)

  // Fetch sociodemographic profile
  const { data: workerProfile } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return NextResponse.json({
    user,
    enrollments,
    certificates: certificates ?? [],
    groups,
    workerProfile: workerProfile ?? null,
  })
}
