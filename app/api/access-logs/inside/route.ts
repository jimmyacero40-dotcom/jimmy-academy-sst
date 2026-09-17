import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isOperatorOrAdmin } from '@/lib/get-company'

export async function GET(req: NextRequest) {
  const { authorized, companyId } = await isOperatorOrAdmin()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const areaId    = searchParams.get('area_id')
  const gateId    = searchParams.get('gatehouse_id')

  const todayStart = new Date(); todayStart.setHours(0,0,0,0)

  let query = supabaseAdmin
    .from('access_logs')
    .select(`
      id, entry_time, notes,
      gatehouse:gatehouses!access_logs_gatehouse_id_fkey(id, name, location),
      user:users!access_logs_user_id_fkey(id, name, cedula, cargo, area_id, active, retired_at),
      area:areas!access_logs_area_id_fkey(id, name, color),
      registered_by_user:users!access_logs_registered_by_fkey(id, name)
    `)
    .eq('company_id', companyId)
    .gte('entry_time', todayStart.toISOString())
    .is('exit_time', null)
    .order('entry_time', { ascending: false })

  if (areaId) query = query.eq('area_id', areaId)
  if (gateId) query = query.eq('gatehouse_id', gateId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
