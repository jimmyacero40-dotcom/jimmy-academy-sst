import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()

  let query = supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()

  const body = await req.json()
  const { code, name, cedula, course, issued, expires, duration, score } = body

  if (!code || !name || !course) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id: user.id,
      company_id: companyId,
      code,
      name,
      cedula: cedula || '',
      course,
      issued,
      expires,
      duration: duration || '8 horas',
      score: score || '100%',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-complete any open enrollment for this user+training
  const numericScore = score ? parseInt(String(score).replace('%', ''), 10) : null
  await supabase
    .from('enrollments')
    .update({ status: 'completed', completed_at: new Date().toISOString(), score: numericScore })
    .eq('user_id', user.id)
    .eq('training_id', body.training_id ?? 0)
    .in('status', ['pending', 'in_progress'])

  return NextResponse.json(data, { status: 201 })
}
