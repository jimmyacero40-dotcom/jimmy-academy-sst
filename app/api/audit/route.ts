import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveCompanyId } from '@/lib/get-company'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page    = parseInt(searchParams.get('page') ?? '1')
  const limit   = parseInt(searchParams.get('limit') ?? '50')
  const action  = searchParams.get('action') ?? ''
  const search  = searchParams.get('search') ?? ''
  const from    = searchParams.get('from') ?? ''
  const to      = searchParams.get('to') ?? ''
  const offset  = (page - 1) * limit

  let q = supabaseAdmin
    .from('AuditLog')
    .select(`
      id, action, resource, resourceId, detail,
      ipAddress, userAgent, createdAt,
      User:userId(id, name, email, role)
    `, { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) q = q.eq('action', action)
  if (search) q = q.or(`detail.ilike.%${search}%,resource.ilike.%${search}%`)
  if (from)   q = q.gte('createdAt', from)
  if (to)     q = q.lte('createdAt', to + 'T23:59:59')

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ logs: data ?? [], total: count ?? 0 })
}

export async function POST(req: NextRequest) {
  const companyId = await getActiveCompanyId()
  const body = await req.json()
  const { userId, action, resource, resourceId, detail, ipAddress, userAgent } = body

  const { error } = await supabaseAdmin.from('AuditLog').insert({
    id: randomUUID(),
    userId,
    action,
    resource,
    resourceId: resourceId ?? null,
    detail,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
