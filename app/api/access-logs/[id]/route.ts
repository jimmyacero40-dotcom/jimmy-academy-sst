import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requierePermiso, porteriasPermitidas } from '@/lib/get-company'

// PATCH — registrar salida, o corregir las horas a mano
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cuerpo = await req.json().catch(() => ({} as any))
  const aMano = !!cuerpo.manual

  const { authorized, user, companyId, isAdmin } = await requierePermiso(
    aMano ? 'accesos.manual' : 'accesos.salida')
  if (!authorized) {
    return NextResponse.json({
      error: aMano
        ? 'No tiene permiso para corregir las horas de un movimiento'
        : 'No tiene permiso para registrar salidas',
    }, { status: 403 })
  }

  const { data: log } = await supabaseAdmin
    .from('access_logs')
    .select('id, company_id, entry_time, exit_time, gatehouse_id')
    .eq('id', params.id)
    .single()

  if (!log) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

  // Corrección a mano: se escriben las horas reales, y el movimiento queda
  // señalado como tocado, con el motivo. Puede ser uno ya cerrado.
  if (aMano) {
    if (log.company_id !== companyId) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

    const entrada = cuerpo.entry_time ? new Date(cuerpo.entry_time) : new Date(log.entry_time)
    const salida  = cuerpo.exit_time  ? new Date(cuerpo.exit_time)  : null
    if (isNaN(entrada.getTime()))
      return NextResponse.json({ error: 'La hora de entrada no es válida' }, { status: 400 })
    if (salida && isNaN(salida.getTime()))
      return NextResponse.json({ error: 'La hora de salida no es válida' }, { status: 400 })
    if (salida && salida <= entrada)
      return NextResponse.json({ error: 'La salida tiene que ser después de la entrada' }, { status: 400 })
    if (!String(cuerpo.manual_motivo ?? '').trim())
      return NextResponse.json({ error: 'Escriba por qué se corrige' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('access_logs')
      .update({
        entry_time: entrada.toISOString(),
        exit_time: salida ? salida.toISOString() : null,
        exit_by: salida ? user.id : null,
        // Una hora escrita a mano ya no es una salida automática.
        auto_exit: false,
        auto_exit_reason: null,
        manual: true,
        manual_motivo: String(cuerpo.manual_motivo).trim(),
        manual_por: user.id,
        manual_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id, entry_time, exit_time')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (log.company_id !== companyId) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  if (log.exit_time) return NextResponse.json({ error: 'Salida ya registrada' }, { status: 409 })
  const permitidas = await porteriasPermitidas(user.id, isAdmin)
  if (permitidas && !permitidas.includes(log.gatehouse_id)) {
    return NextResponse.json({ error: 'Ese ingreso pertenece a otra portería' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('access_logs')
    .update({ exit_time: new Date().toISOString(), exit_by: user.id })
    .eq('id', params.id)
    .select('id, exit_time')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
