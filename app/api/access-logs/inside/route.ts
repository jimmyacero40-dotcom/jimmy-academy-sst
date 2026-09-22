import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requierePermiso, porteriasPermitidas } from '@/lib/get-company'
import { inicioJornada } from '@/lib/jornada'

export async function GET(req: NextRequest) {
  const { authorized, user, companyId, isAdmin } = await requierePermiso('accesos.ver', 'accesos.ingreso', 'accesos.salida')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso para consultar la portería' }, { status: 403 })
  const permitidas = await porteriasPermitidas(user.id, isAdmin)

  const { searchParams } = new URL(req.url)
  const areaId    = searchParams.get('area_id')
  const gateId    = searchParams.get('gatehouse_id')
  if (permitidas && gateId && !permitidas.includes(gateId)) {
    return NextResponse.json({ error: 'No tiene acceso a esa portería' }, { status: 403 })
  }

  // Inicio de la jornada en hora de Colombia: medianoche UTC son las 7 p.m. aquí,
  // y con ese corte los ingresos de la tarde desaparecían del tablero.
  const todayStart = inicioJornada()

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
  // Sin portería pedida, el portero igual solo recibe las suyas.
  if (permitidas) query = query.in('gatehouse_id', permitidas.length ? permitidas : ['00000000-0000-0000-0000-000000000000'])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
