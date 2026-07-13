import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

// GET /api/trainings/[id]/completions?from=YYYY-MM-DD&to=YYYY-MM-DD
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

  let q = supabase
    .from('enrollments')
    .select('id, user_id, completed_at, users(id, name, cedula, area)')
    .eq('training_id', trainingId)
    .eq('status', 'completed')
    .gte('completed_at', `${from}T00:00:00`)
    .lte('completed_at', `${to}T23:59:59`)

  if (companyId) q = q.eq('company_id', companyId)

  const { data: enrollments, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const participants = []
  for (const e of (enrollments || [])) {
    const usr = e.users as any
    let signatureData: string | null = null
    if (e.user_id) {
      const { data: sig } = await supabase
        .from('signatures')
        .select('signature_data')
        .eq('user_id', e.user_id)
        .limit(1)
        .single()
      if (sig) signatureData = sig.signature_data
    }
    participants.push({
      name:      usr?.name    || '',
      cedula:    usr?.cedula  || '',
      cargo:     usr?.area    || '',
      signature: signatureData,
    })
  }

  return NextResponse.json({ participants })
}
