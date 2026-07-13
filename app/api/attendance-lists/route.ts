import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()

  let q = supabase
    .from('attendance_lists')
    .select('id, training_id, training_title, event_date, schedule, intensity, instructor, organized_by, directed_to, generated_by, generated_at, participant_count')
    .order('event_date', { ascending: false })

  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()
  const body = await req.json()
  const {
    training_id, training_title, training_temario,
    event_date, schedule, intensity, instructor, organized_by, directed_to,
    participants,
  } = body

  if (!training_title || !event_date || !schedule || !instructor)
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const { data: list, error: listErr } = await supabase
    .from('attendance_lists')
    .insert({
      training_id:    training_id || null,
      training_title,
      training_temario: training_temario || null,
      event_date,
      schedule,
      intensity:      intensity || '',
      instructor,
      organized_by,
      directed_to,
      company_id:     companyId || null,
      generated_by:   user.name || user.email || 'Admin',
      participant_count: (participants || []).length,
    })
    .select()
    .single()

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  if (participants?.length) {
    const rows = (participants as any[]).map((p: any, i: number) => ({
      list_id:        list.id,
      name:           p.name,
      cedula:         p.cedula || '',
      cargo:          p.cargo  || '',
      signature_data: p.signature || null,
      sort_order:     i,
    }))
    const { error: pErr } = await supabase.from('attendance_list_participants').insert(rows)
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  return NextResponse.json(list, { status: 201 })
}
