import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper, isOperatorOrAdmin } from '@/lib/get-company'

export async function GET(req: NextRequest) {
  const { authorized, companyId } = await isOperatorOrAdmin()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const period      = searchParams.get('period') || 'day'
  const dateFrom    = searchParams.get('from')
  const dateTo      = searchParams.get('to')
  const userId      = searchParams.get('user_id')
  const areaId      = searchParams.get('area_id')
  const gateId      = searchParams.get('gatehouse_id')

  let from: string, to: string
  const now = new Date()
  if (period === 'day') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString()
    to   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)).toISOString()
  } else if (period === 'week') {
    const utcDay = new Date(now).getUTCDay()
    const diffToMon = (utcDay === 0 ? -6 : 1 - utcDay)
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMon))
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 7))
    from = monday.toISOString(); to = sunday.toISOString()
  } else {
    from = dateFrom ? new Date(dateFrom).toISOString() : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString()
    const dateToParsed = dateTo ? new Date(dateTo) : new Date()
    to   = dateTo ? new Date(Date.UTC(dateToParsed.getUTCFullYear(), dateToParsed.getUTCMonth(), dateToParsed.getUTCDate() + 1)).toISOString() : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString()
  }

  let query = supabaseAdmin
    .from('access_logs')
    .select(`
      id, entry_time, exit_time, notes, created_at,
      gatehouse:gatehouses!access_logs_gatehouse_id_fkey(id, name, location),
      user:users!access_logs_user_id_fkey(id, name, cedula, cargo, area_id),
      area:areas!access_logs_area_id_fkey(id, name, color),
      registered_by_user:users!access_logs_registered_by_fkey(id, name),
      exit_by_user:users!access_logs_exit_by_fkey(id, name)
    `)
    .eq('company_id', companyId)
    .gte('entry_time', from)
    .lt('entry_time', to)
    .order('entry_time', { ascending: false })

  if (userId)  query = query.eq('user_id', userId)
  if (areaId)  query = query.eq('area_id', areaId)
  if (gateId)  query = query.eq('gatehouse_id', gateId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { authorized, user, companyId } = await isOperatorOrAdmin()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { user_id, area_id, gatehouse_id, notes } = body
  if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  // Verify worker is active and NOT retired
  const { data: worker } = await supabaseAdmin
    .from('users')
    .select('id, active, retired_at, company_id')
    .eq('id', user_id)
    .single()

  if (!worker || worker.company_id !== companyId)
    return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
  if (worker.retired_at)
    return NextResponse.json({ error: 'Trabajador retirado — no puede registrar ingreso' }, { status: 409 })
  if (!worker.active)
    return NextResponse.json({ error: 'Trabajador inactivo' }, { status: 409 })

  const { data, error } = await supabaseAdmin
    .from('access_logs')
    .insert({
      company_id: companyId,
      user_id,
      area_id: area_id || null,
      gatehouse_id: gatehouse_id || null,
      notes: notes || null,
      registered_by: user.id,
    })
    .select('id, entry_time')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
