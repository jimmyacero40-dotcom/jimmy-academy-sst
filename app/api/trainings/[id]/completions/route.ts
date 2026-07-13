import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

// GET /api/trainings/[id]/completions
// Optional query params:
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD  → filter by certificate issued date
//   (omit both)                      → return ALL completions for this training
//
// Source of truth: `certificates` table — always inserted when a worker completes.
// `enrollments.status` is NOT reliable (update conditions often fail silently).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()
  const trainingId = parseInt(params.id)
  const url  = new URL(req.url)
  const from = url.searchParams.get('from') || null
  const to   = url.searchParams.get('to')   || null

  // 1. Resolve training title from training_id
  const { data: training, error: tErr } = await supabase
    .from('trainings')
    .select('id, title')
    .eq('id', trainingId)
    .single()

  if (tErr || !training)
    return NextResponse.json({ error: 'Capacitación no encontrada' }, { status: 404 })

  // 2. Build certificates query
  //    - Always filter by course title (derived from training_id — user never types it)
  //    - Apply date range on `issued` only when both params are present
  let q = supabase
    .from('certificates')
    .select('user_id, name, cedula, course, issued')
    .eq('course', training.title)

  if (companyId) q = q.eq('company_id', companyId)
  if (from && to) {
    q = q.gte('issued', from).lte('issued', to)
  }

  const { data: certs, error: cErr } = await q
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // 3. Enrich each certificate with cargo (from users) and digital signature
  const participants = []
  for (const c of (certs || [])) {
    let cargo = ''
    let signatureData: string | null = null

    if (c.user_id) {
      const [usrRes, sigRes] = await Promise.all([
        supabase.from('users').select('cargo').eq('id', c.user_id).single(),
        supabase.from('signatures').select('signature_data').eq('user_id', c.user_id).limit(1).single(),
      ])
      cargo         = usrRes.data?.cargo || ''
      signatureData = sigRes.data?.signature_data || null
    }

    participants.push({
      name:      c.name   || '',
      cedula:    c.cedula || '',
      cargo,
      signature: signatureData,
    })
  }

  return NextResponse.json({ participants, total: participants.length })
}
