import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentUser, getActiveCompanyId } from '@/lib/get-company'

// GET — groups this user belongs to
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('user_groups')
    .select('group_id, groups(id, name, color)')
    .eq('user_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data ?? []).map((r: any) => r.groups).filter(Boolean))
}

// PUT — replace all groups for this user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  const { group_ids } = await req.json() as { group_ids: string[] }

  // Delete existing (admin bypasses RLS)
  const { error: delErr } = await supabaseAdmin
    .from('user_groups')
    .delete()
    .eq('user_id', params.id)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Insert new
  if (group_ids?.length) {
    const rows = group_ids.map(gid => ({
      user_id: params.id,
      group_id: gid,
      ...(companyId ? { company_id: companyId } : {}),
    }))
    const { error } = await supabaseAdmin.from('user_groups').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
