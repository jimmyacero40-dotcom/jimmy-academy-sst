import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper, isOperatorOrAdmin } from '@/lib/get-company'
import {
  inicioJornada, inicioJornadaDeFecha, siguienteJornada, finJornada, horaColombia,
  MOTIVO_OTRA_PORTERIA, MOTIVO_FIN_JORNADA,
} from '@/lib/jornada'

export async function GET(req: NextRequest) {
  const { authorized, user, companyId, isAdmin } = await isOperatorOrAdmin()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // El portero solo ve el movimiento de las porterías que opera, no el de toda
  // la empresa.
  let porteriasPropias: string[] | null = null
  if (!isAdmin) {
    const { data: ops } = await supabaseAdmin
      .from('gatehouse_operators').select('gatehouse_id').eq('user_id', user.id)
    porteriasPropias = (ops ?? []).map((o: any) => o.gatehouse_id)
  }

  const { searchParams } = new URL(req.url)
  const period      = searchParams.get('period') || 'day'
  const dateFrom    = searchParams.get('from')
  const dateTo      = searchParams.get('to')
  const userId      = searchParams.get('user_id')
  const areaId      = searchParams.get('area_id')
  const gateId      = searchParams.get('gatehouse_id')

  // El día operativo corre de 00:00 a 23:59:59 de Colombia, no de medianoche UTC:
  // con el corte UTC, un ingreso de las 8 p.m. caía en el día siguiente.
  let desde: Date, hasta: Date
  if (period === 'day') {
    desde = inicioJornada()
    hasta = siguienteJornada(desde)
  } else if (period === 'week') {
    const hoy = inicioJornada()
    const diaSemana = new Date(hoy.getTime() - 5 * 60 * 60 * 1000).getUTCDay()
    desde = new Date(hoy.getTime() + (diaSemana === 0 ? -6 : 1 - diaSemana) * 24 * 60 * 60 * 1000)
    hasta = new Date(desde.getTime() + 7 * 24 * 60 * 60 * 1000)
  } else {
    desde = dateFrom ? inicioJornadaDeFecha(dateFrom) : inicioJornada()
    hasta = siguienteJornada(dateTo ? inicioJornadaDeFecha(dateTo) : inicioJornada())
  }
  const from = desde.toISOString()
  const to   = hasta.toISOString()

  let query = supabaseAdmin
    .from('access_logs')
    .select(`
      id, entry_time, exit_time, notes, created_at, auto_exit, auto_exit_reason,
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
  if (porteriasPropias) query = query.in('gatehouse_id', porteriasPropias.length ? porteriasPropias : ['_'])

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

  // Una persona solo puede estar en un sitio a la vez: como máximo un ingreso abierto.
  const now = new Date()
  const jornada = inicioJornada(now)
  const porteriaNueva = gatehouse_id || null

  const { data: abiertos } = await supabaseAdmin
    .from('access_logs')
    .select('id, entry_time, gatehouse_id')
    .eq('company_id', companyId)
    .eq('user_id', user_id)
    .is('exit_time', null)

  const deHoy   = (abiertos ?? []).filter(a => new Date(a.entry_time) >= jornada)
  const deAyer  = (abiertos ?? []).filter(a => new Date(a.entry_time) <  jornada)

  const mismaPorteria = deHoy.find(a => (a.gatehouse_id || null) === porteriaNueva)
  if (mismaPorteria) {
    return NextResponse.json({
      error: `Ya tiene un ingreso abierto en esta portería desde las ${horaColombia(mismaPorteria.entry_time)}. Registre la salida antes de un nuevo ingreso.`,
    }, { status: 409 })
  }

  // Entrar por otra portería prueba que ya salió de la anterior.
  const enOtraPorteria = deHoy.filter(a => (a.gatehouse_id || null) !== porteriaNueva)
  if (enOtraPorteria.length) {
    await supabaseAdmin
      .from('access_logs')
      .update({
        exit_time: now.toISOString(),
        exit_by: user.id,
        auto_exit: true,
        auto_exit_reason: MOTIVO_OTRA_PORTERIA,
      })
      .in('id', enOtraPorteria.map(a => a.id))
  }

  // Ingresos que quedaron abiertos de días anteriores: se cierran al final de su jornada.
  for (const a of deAyer) {
    await supabaseAdmin
      .from('access_logs')
      .update({
        exit_time: finJornada(new Date(a.entry_time)).toISOString(),
        auto_exit: true,
        auto_exit_reason: MOTIVO_FIN_JORNADA,
      })
      .eq('id', a.id)
  }

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
