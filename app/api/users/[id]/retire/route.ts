import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'

// POST — retire or reactivate a worker
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const action: 'retire' | 'reactivate' = body.action

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, company_id, role')
    .eq('id', params.id)
    .single()

  if (!user || user.company_id !== companyId) {
    return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
  }

  if (action === 'retire') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ active: false, retired_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'retired' })
  }

  if (action === 'reactivate') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ active: true, retired_at: null })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'reactivated' })
  }

  return NextResponse.json({ error: 'action debe ser retire o reactivate' }, { status: 400 })
}
