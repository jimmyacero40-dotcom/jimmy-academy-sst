import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso, getCurrentUser } from '@/lib/get-company'

/**
 * Las entregas: quién recibió qué, cuándo y de manos de quién.
 *
 * Se registra cuando ocurre. No hay programación ni plazo: si un día no se
 * aplicó agroquímico, no hubo entrega y no falta nada. Lo que sí se calcula
 * es a quién le hace falta según la periodicidad del tipo, que es una ayuda
 * para no dejar a nadie por fuera, no una obligación que se incumpla.
 */

/** Hoy en Colombia, 'YYYY-MM-DD'. Sin pasar por UTC, que corre el día. */
function hoy(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Desde cuándo cuenta «ya recibió», según cada cuánto se entrega. */
function desdeCuando(periodicidad: string): string | null {
  const dias = periodicidad === 'diaria' ? 0
    : periodicidad === 'semanal' ? 6
      : periodicidad === 'mensual' ? 29
        : -1
  if (dias < 0) return null
  const d = new Date(Date.now() - 5 * 60 * 60 * 1000 - dias * 86400000)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.ver', 'sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const p = req.nextUrl.searchParams
  const tipoId = p.get('tipo_id')
  if (!tipoId) return NextResponse.json({ error: 'tipo_id requerido' }, { status: 400 })

  const { data: tipo } = await supabase
    .from('entrega_tipos')
    .select('id, nombre, referencia, unidad, periodicidad, company_id')
    .eq('id', tipoId)
    .maybeSingle()

  if (!tipo || (companyId && tipo.company_id !== companyId)) {
    return NextResponse.json({ error: 'Ese entregable no existe' }, { status: 404 })
  }

  // La ventana que se consulta. Por defecto, hoy.
  const desde = p.get('desde') || hoy()
  const hasta = p.get('hasta') || hoy()

  let q = supabase
    .from('entregas')
    // `users!entregas_user_id_fkey`: la tabla apunta dos veces a users —quien
    // recibe y quien entrega—, así que hay que decir por cuál se une.
    .select('id, user_id, cantidad, referencia, entregado_at, entregado_por_nombre, observacion, firma, confirmado_at, users!entregas_user_id_fkey(name, cedula, cargo, area)')
    .eq('tipo_id', tipoId)
    .gte('entregado_at', `${desde}T00:00:00-05:00`)
    .lte('entregado_at', `${hasta}T23:59:59-05:00`)
    .order('entregado_at', { ascending: false })
  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Quién ya recibió dentro del periodo que marca la periodicidad: es lo que
  // la pantalla usa para no entregarle dos veces al mismo el mismo día.
  const corte = desdeCuando(tipo.periodicidad)
  const recientes: Record<string, string> = {}
  if (corte) {
    let qr = supabase
      .from('entregas')
      .select('user_id, entregado_at')
      .eq('tipo_id', tipoId)
      .gte('entregado_at', `${corte}T00:00:00-05:00`)
      .order('entregado_at', { ascending: false })
    if (companyId) qr = qr.eq('company_id', companyId)
    const { data: ult } = await qr
    for (const e of ult ?? []) if (!recientes[e.user_id]) recientes[e.user_id] = e.entregado_at
  }

  return NextResponse.json({
    tipo,
    desde,
    hasta,
    recientes,
    entregas: (data ?? []).map((e: any) => ({
      id: e.id,
      user_id: e.user_id,
      nombre: e.users?.name ?? '',
      cedula: e.users?.cedula ?? '',
      cargo: e.users?.cargo ?? '',
      area: e.users?.area ?? '',
      cantidad: Number(e.cantidad),
      referencia: e.referencia,
      entregado_at: e.entregado_at,
      entregado_por_nombre: e.entregado_por_nombre,
      observacion: e.observacion,
      tiene_firma: Boolean(e.firma),
      confirmado_at: e.confirmado_at ?? null,
      // La firma solo cuando se pide: son imágenes y el listado se consulta
      // muchas veces, el soporte se arma una.
      firma: p.get('firmas') === '1' ? (e.firma ?? null) : undefined,
    })),
  })
}

/** Registrar la entrega a varias personas de una vez. */
export async function POST(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(b.user_ids) ? b.user_ids.filter(Boolean).slice(0, 300) : []
  if (!b.tipo_id) return NextResponse.json({ error: 'tipo_id requerido' }, { status: 400 })
  if (!ids.length) return NextResponse.json({ error: 'No se marcó a nadie' }, { status: 400 })

  const { data: tipo } = await supabase
    .from('entrega_tipos')
    .select('id, nombre, referencia, unidad, company_id')
    .eq('id', b.tipo_id)
    .maybeSingle()
  if (!tipo || (companyId && tipo.company_id !== companyId)) {
    return NextResponse.json({ error: 'Ese entregable no existe' }, { status: 404 })
  }

  // Se vuelve a leer de la base a quién se le entrega: un id de otra empresa
  // o de alguien retirado se cae aquí.
  let qu = supabase
    .from('users')
    .select('id, name')
    .in('id', ids)
    .is('retired_at', null)
  if (companyId) qu = qu.eq('company_id', companyId)
  const { data: personas } = await qu
  if (!personas?.length) return NextResponse.json({ error: 'Nadie de esa lista está activo' }, { status: 400 })

  // La firma que cada uno tiene registrada, copiada al soporte. Si mañana
  // cambia su firma, la de ayer no puede cambiar con ella.
  const { data: firmas } = await supabase
    .from('signatures')
    .select('user_id, signature_data')
    .in('user_id', personas.map(p => p.id))
  const firmaDe = new Map((firmas ?? []).map((f: any) => [f.user_id, f.signature_data]))

  const quien = await getCurrentUser()
  const cantidad = Number(b.cantidad)
  const cuando = typeof b.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.fecha)
    ? `${b.fecha}T12:00:00-05:00`
    : new Date().toISOString()

  const { data, error } = await supabase
    .from('entregas')
    .insert(personas.map(p => ({
      company_id: companyId,
      tipo_id: tipo.id,
      user_id: p.id,
      cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
      referencia: String(b.referencia ?? '').trim() || tipo.referencia || null,
      entregado_at: cuando,
      entregado_por: quien?.id ?? null,
      entregado_por_nombre: quien?.name ?? null,
      firma: firmaDe.get(p.id) ?? null,
      observacion: String(b.observacion ?? '').trim() || null,
    })))
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    registradas: data?.length ?? 0,
    sinFirma: personas.filter(p => !firmaDe.get(p.id)).map(p => p.name),
  }, { status: 201 })
}

/** Deshacer una entrega mal registrada. */
export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  let q = supabase.from('entregas').delete().eq('id', id)
  if (companyId) q = q.eq('company_id', companyId)

  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
