import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { asignarInduccion } from '@/lib/induccion'

/**
 * Aprobar o rechazar un pre-registro.
 *
 * Al aprobar se activa la cuenta y el trabajador entra al flujo normal.
 * Al rechazar la cuenta queda inactiva con el motivo, de modo que no puede
 * entrar pero el registro no se pierde y se puede revisar o corregir después.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, user, companyId } = await requierePermiso('personal.editar', 'config.usuarios')
  if (!authorized || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { decision, motivo } = await req.json().catch(() => ({}))
  if (decision !== 'aprobar' && decision !== 'rechazar') {
    return NextResponse.json({ error: 'Decisión inválida' }, { status: 400 })
  }

  let q = supabase.from('users').select('id, estado_registro, role').eq('id', params.id)
  if (companyId) q = q.eq('company_id', companyId)
  const { data: objetivo } = await q.maybeSingle()

  if (!objetivo) return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
  if (!objetivo.estado_registro) {
    return NextResponse.json({ error: 'Ese trabajador no viene de un pre-registro' }, { status: 400 })
  }
  // Validar no es un camino para tocar cuentas administrativas.
  if (objetivo.role !== 'worker') {
    return NextResponse.json({ error: 'Solo se validan trabajadores' }, { status: 400 })
  }

  const aprobado = decision === 'aprobar'
  const { data, error } = await supabase.from('users').update({
    estado_registro: aprobado ? 'aprobado' : 'rechazado',
    active: aprobado,
    motivo_rechazo: aprobado ? null : (String(motivo ?? '').trim() || null),
    validado_por: user.id,
    validado_at: new Date().toISOString(),
  }).eq('id', params.id).select('id, name, cedula, estado_registro, active').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Se vuelve a intentar al aprobar: cubre los registros anteriores a esta
  // automatización y cualquier caso en que no se hubiera podido asignar.
  let induccion
  if (aprobado && companyId) induccion = (await asignarInduccion(params.id, companyId)).motivo

  return NextResponse.json({ usuario: data, induccion })
}
