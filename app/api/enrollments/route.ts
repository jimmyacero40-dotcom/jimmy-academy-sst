import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper, getCurrentUser } from '@/lib/get-company'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  if (user.role === 'worker') {
    // Workers see only their own enrollments
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id, status, due_date, started_at, completed_at, score, created_at,
        trainings(id, title, description, duration, cover_url, category)
      `)
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Admin/superadmin see all enrollments for their company
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let query = supabase
    .from('enrollments')
    .select(`
      id, status, due_date, started_at, completed_at, score, created_at,
      users(id, name, email, cedula, area),
      trainings(id, title, duration)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
