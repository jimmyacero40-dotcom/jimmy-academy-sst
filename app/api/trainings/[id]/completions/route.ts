import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

// GET /api/trainings/[id]/completions?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Source of truth is the `certificates` table — it is ALWAYS inserted when a worker
// completes a training. The `enrollments` table is NOT reliable because the
// status update has conditions that often silently fail.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()
  const trainingId = parseInt(params.id)
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to   = url.searchParams.get('to')

  if (!from || !to) return NextResponse.json({ error: 'Se requieren from y to' }, { status: 400 })

  // 1. Get training title from training_id (the user never types a name)
  const { data: training, error: tErr } = await supabase
    .from('trainings')
    .select('id, title')
    .eq('id', trainingId)
    .single()

  if (tErr || !training) return NextResponse.json({ error: 'Capacitación no encontrada' }, { status: 404 })

  // 2. Query certificates by course title + date range on `issued`
  //    `issued` is a DATE column (YYYY-MM-DD), so simple string comparison works.
  let q = supabase
    .from('certificates')
    .select('user_id, name, cedula, course, issued')
    .eq('course', training.title)
    .gte('issued', from)
    .lte('issued', to)

  if (companyId) q = q.eq('company_id', companyId)

  const { data: certs, error: cErr } = await q
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // 3. For each certificate, fetch cargo from users table and signature
  const participants = []
  for (const c of (certs || [])) {
    let cargo = ''
    let signatureData: string | null = null

    if (c.user_id) {
      const { data: usr } = await supabase
        .from('users')
        .select('area')
        .eq('id', c.user_id)
        .single()
      cargo = usr?.area || ''

      const { data: sig } = await supabase
        .from('signatures')
        .select('signature_data')
        .eq('user_id', c.user_id)
        .limit(1)
        .single()
      if (sig) signatureData = sig.signature_data
    }

    participants.push({
      name:      c.name   || '',
      cedula:    c.cedula || '',
      cargo,
      signature: signatureData,
    })
  }

  return NextResponse.json({ participants })
}
