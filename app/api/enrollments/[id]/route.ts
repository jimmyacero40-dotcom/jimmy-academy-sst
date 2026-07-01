import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/get-company'

// PATCH — update enrollment status (start or complete)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { status, score } = await req.json()
  if (!status) return NextResponse.json({ error: 'status requerido' }, { status: 400 })

  const updates: Record<string, any> = { status }
  if (status === 'in_progress' && !updates.started_at) updates.started_at = new Date().toISOString()
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
    if (score !== undefined) updates.score = score
  }

  // Workers can only update their own enrollments
  let query = supabase.from('enrollments').update(updates).eq('id', params.id)
  if (user.role === 'worker') query = query.eq('user_id', user.id)

  const { data, error } = await query.select('id, status, score, completed_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
