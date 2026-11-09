import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requierePermiso, porteriasPermitidas, porteriasQuePuedeConsultar } from '@/lib/get-company'
import {
  inicioJornada, inicioJornadaDeFecha, siguienteJornada, finJornada, horaColombia,
  MOTIVO_OTRA_PORTERIA, MOTIVO_FIN_JORNADA,
} from '@/lib/jornada'

export async function GET(req: NextRequest) {
  const { authorized, user, companyId, isAdmin } = await requierePermiso('accesos.ver')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso para consultar movimientos' }, { status: 403 })

  // El portero solo ve el movimiento de las porterías que opera, no el de toda
  // la empresa. Una cuenta de consulta sí ve el de todas, sin operar ninguna.
  const porteriasPropias = await porteriasQuePuedeConsultar(user, isAdmin)

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
      id, entry_time, exit_time, notes, created_at, auto_exit, auto_exit_reason, manual, manual_motivo,
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
  if (porteriasPropias) query = query.in('gatehouse_id', porteriasPropias.length ? porteriasPropias : ['00000000-0000-0000-0000-000000000000'])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Que un movimiento se haya repuesto a mano solo lo ve quien puede
  // reponerlos. Para los demás el movimiento es uno más: el dato se guarda y
  // queda la trazabilidad, pero no se envía, así que no hay nada que mostrar
  // ni que se escape a un export.
  const { authorized: veLoManual } = await requierePermiso('accesos.manual')
  if (!veLoManual) {
    return NextResponse.json((data ?? []).map((l: any) => {
      const { manual, manual_motivo, ...resto } = l
      return resto
    }))
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { authorized, user, companyId, isAdmin } = await requierePermiso('accesos.ingreso')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso para registrar ingresos' }, { status: 403 })

  const body = await req.json()
  const { user_id, area_id, gatehouse_id, notes } = body
  if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  // ── Registro a mano ──────────────────────────────────────────────────
  // El movimiento existió pero no se marcó en portería. Se deja con sus horas
  // reales, señalado como manual y con el motivo, para que una auditoría
  // distinga lo que se marcó en el momento de lo que se repuso después.
  const aMano = !!body.manual
  if (aMano) {
    const { authorized: puede } = await requierePermiso('accesos.manual')
    if (!puede) return NextResponse.json({ error: 'No tiene permiso para registrar movimientos a mano' }, { status: 403 })

    const entrada = body.entry_time ? new Date(body.entry_time) : null
    const salida  = body.exit_time  ? new Date(body.exit_time)  : null
    if (!entrada || isNaN(entrada.getTime()))
      return NextResponse.json({ error: 'Escriba la fecha y la hora de entrada' }, { status: 400 })
    if (salida && isNaN(salida.getTime()))
      return NextResponse.json({ error: 'La hora de salida no es válida' }, { status: 400 })
    if (salida && salida <= entrada)
      return NextResponse.json({ error: 'La salida tiene que ser después de la entrada' }, { status: 400 })
    if (entrada > new Date())
      return NextResponse.json({ error: 'No se puede registrar un ingreso en el futuro' }, { status: 400 })
    if (!String(body.manual_motivo ?? '').trim())
      return NextResponse.json({ error: 'Escriba por qué se registra a mano' }, { status: 400 })

    const { data: quien } = await supabaseAdmin
      .from('users').select('id, active, retired_at, company_id, area_id').eq('id', user_id).single()
    if (!quien || quien.company_id !== companyId)
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })

    // Dos movimientos no se pueden pisar: la persona no estuvo en dos sitios.
    const { data: vecinos } = await supabaseAdmin
      .from('access_logs').select('id, entry_time, exit_time')
      .eq('company_id', companyId).eq('user_id', user_id)
      .gte('entry_time', new Date(entrada.getTime() - 36 * 60 * 60 * 1000).toISOString())
    const fin = salida ?? entrada
    const choca = (vecinos ?? []).find((v: any) => {
      const vi = new Date(v.entry_time)
      const vf = v.exit_time ? new Date(v.exit_time) : vi
      return vi <= fin && entrada <= vf
    })
    if (choca) {
      return NextResponse.json({
        error: `Ya hay un movimiento suyo que se cruza con ese horario, desde las ${horaColombia(choca.entry_time)}.`,
      }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('access_logs')
      .insert({
        company_id: companyId, user_id,
        area_id: area_id || quien.area_id || null, gatehouse_id: gatehouse_id || null,
        entry_time: entrada.toISOString(),
        exit_time: salida ? salida.toISOString() : null,
        notes: notes || null,
        registered_by: user.id,
        exit_by: salida ? user.id : null,
        manual: true,
        manual_motivo: String(body.manual_motivo).trim(),
        manual_por: user.id,
        manual_at: new Date().toISOString(),
      })
      .select('id, entry_time, exit_time')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  const permitidas = await porteriasPermitidas(user.id, isAdmin)
  if (permitidas && !permitidas.includes(gatehouse_id)) {
    return NextResponse.json({ error: 'No puede registrar ingresos en otra portería' }, { status: 403 })
  }

  // Verify worker is active and NOT retired
  const { data: worker } = await supabaseAdmin
    .from('users')
    .select('id, active, retired_at, company_id, area_id')
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
      // Si la portería no mandó área, se toma la del trabajador. Antes
      // quedaba en nulo y el ingreso salía como "Sin área" en los reportes
      // aunque la persona tuviera la suya puesta.
      area_id: area_id || worker.area_id || null,
      gatehouse_id: gatehouse_id || null,
      notes: notes || null,
      registered_by: user.id,
    })
    .select('id, entry_time')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
