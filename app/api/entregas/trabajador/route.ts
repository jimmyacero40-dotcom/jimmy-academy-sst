import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'

/**
 * Todo lo que se le ha entregado a una persona.
 *
 * El formato de la empresa (AVC-FR06) es por trabajador y no por día: una
 * hoja con sus datos arriba y debajo la lista de todo lo que ha recibido, con
 * su firma por cada elemento. Esta ruta es lo que esa hoja necesita.
 */
export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.ver', 'sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  const { data: persona } = await supabase
    .from('users')
    .select('id, name, cedula, cargo, area, company_id')
    .eq('id', userId)
    .maybeSingle()

  if (!persona || (companyId && persona.company_id !== companyId)) {
    return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
  }

  let q = supabase
    .from('entregas')
    .select('id, cantidad, referencia, entregado_at, entregado_por_nombre, observacion, firma, confirmado_at, entrega_tipos(nombre, unidad)')
    .eq('user_id', userId)
    .order('entregado_at')
  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    trabajador: {
      nombre: persona.name,
      cedula: persona.cedula,
      cargo: persona.cargo,
      area: persona.area,
    },
    entregas: (data ?? []).map((e: any) => ({
      id: e.id,
      elemento: e.entrega_tipos?.nombre ?? 'Elemento',
      unidad: e.entrega_tipos?.unidad ?? 'unidad',
      cantidad: Number(e.cantidad),
      referencia: e.referencia,
      entregado_at: e.entregado_at,
      entregado_por_nombre: e.entregado_por_nombre,
      observacion: e.observacion,
      confirmado_at: e.confirmado_at,
      firma: e.firma ?? null,
    })),
  })
}
