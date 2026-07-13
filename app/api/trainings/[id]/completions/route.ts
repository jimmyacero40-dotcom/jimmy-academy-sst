import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/get-company'

// GET /api/trainings/[id]/completions?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = parseInt(params.id)
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to   = url.searchParams.get('to')

  if (!from || !to) return NextResponse.json({ error: 'Se requieren from y to' }, { status: 400 })

  // Fetch ALL completed enrollments for this training — no company_id filter here
  // (enrollments may not have company_id set). Date range applied in memory below.
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('id, user_id, completed_at, updated_at, users(id, name, cedula, area)')
    .eq('training_id', trainingId)
    .eq('status', 'completed')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const fromMs = new Date(from + 'T00:00:00').getTime()
  const toMs   = new Date(to   + 'T23:59:59').getTime()

  const participants = []
  for (const e of (enrollments || [])) {
    // Use completed_at if set, otherwise fall back to updated_at
    const dateStr = (e.completed_at || e.updated_at || '') as string
    if (dateStr) {
      const ms = new Date(dateStr).getTime()
      if (ms < fromMs || ms > toMs) continue  // outside selected range
    }

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
