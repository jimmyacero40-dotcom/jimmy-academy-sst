import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()
  const id = parseInt(params.id)

  let q = supabase
    .from('attendance_lists')
    .select('*')
    .eq('id', id)

  if (companyId) q = q.eq('company_id', companyId)

  const { data: list, error } = await q.single()
  if (error || !list) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: participants } = await supabase
    .from('attendance_list_participants')
    .select('name, cedula, cargo, signature_data')
    .eq('list_id', id)
    .order('sort_order')

  // Fetch company info for PDF regeneration
  let companyName = '', companyLogo = ''
  if (companyId) {
    const { data: co } = await supabase
      .from('companies').select('name, logo_url').eq('id', companyId).single()
    if (co) { companyName = co.name; companyLogo = co.logo_url || '' }
  }

  return NextResponse.json({
    ...list,
    participants: (participants || []).map(p => ({
      name:      p.name,
      cedula:    p.cedula,
      cargo:     p.cargo,
      signature: p.signature_data,
    })),
    companyName,
    companyLogo,
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()
  const id = parseInt(params.id)

  // Verify ownership
  let q = supabase.from('attendance_lists').select('id').eq('id', id)
  if (companyId) q = q.eq('company_id', companyId)
  const { data } = await q.single()
  if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { error } = await supabase.from('attendance_lists').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
