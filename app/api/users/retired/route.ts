import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'

export async function GET() {
  const { authorized, companyId } = await requierePermiso('personal.ver', 'personal.retirar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, cedula, role, area, cargo, area_id, active, company_id, created_at, retired_at')
    .eq('company_id', companyId)
    .not('retired_at', 'is', null)
    .is('purged_at', null)
    .order('retired_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch groups
  const ids = (data ?? []).map((u: any) => u.id)
  const { data: ugData } = await supabaseAdmin
    .from('user_groups')
    .select('user_id, groups(id, name, color)')
    .in('user_id', ids.length ? ids : ['_'])

  const groupsByUser: Record<string, any[]> = {}
  for (const row of ugData ?? []) {
    if (!groupsByUser[row.user_id]) groupsByUser[row.user_id] = []
    if (row.groups) groupsByUser[row.user_id].push(row.groups)
  }

  const result = (data ?? []).map((u: any) => ({
    ...u,
    user_groups: (groupsByUser[u.id] ?? []).map(g => ({ groups: g })),
  }))

  return NextResponse.json(result)
}
