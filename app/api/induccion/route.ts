import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { asignarInduccion, cursosDeIngreso } from '@/lib/induccion'

/**
 * Asignar la inducción a mano.
 *
 * La asignación automática solo alcanza a quien entra de ahora en adelante;
 * los trabajadores que ya estaban se quedaron sin ella. Esto permite ponerla
 * de un clic, a los seleccionados o a todos los que les falte, y como la
 * asignación es idempotente no pasa nada si se repite.
 */

/** GET: cuántos trabajadores activos no tienen todavía la formación de ingreso. */
export async function GET() {
  const { authorized, companyId } = await requierePermiso('formacion.ver', 'formacion.gestionar')
  if (!authorized || !companyId) return NextResponse.json({ pendientes: 0, cursos: 0 })

  const cursos = await cursosDeIngreso(companyId)
  if (!cursos.length) return NextResponse.json({ pendientes: 0, cursos: 0, sinConfigurar: true })

  const { data: trabajadores } = await supabase.from('users')
    .select('id').eq('company_id', companyId).eq('role', 'worker')
    .eq('active', true).is('retired_at', null)

  const { data: yaTienen } = await supabase.from('enrollments')
    .select('user_id').eq('company_id', companyId).in('training_id', cursos)

  const conInduccion = new Set((yaTienen ?? []).map(e => e.user_id))
  const pendientes = (trabajadores ?? []).filter(u => !conInduccion.has(u.id))

  return NextResponse.json({ pendientes: pendientes.length, cursos: cursos.length })
}

/**
 * POST { user_ids } — a esos trabajadores.
 * POST { todos: true } — a todo activo que no la tenga.
 */
export async function POST(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso para asignar formación' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const cursos = await cursosDeIngreso(companyId)
  if (!cursos.length) {
    return NextResponse.json({
      error: 'No hay formación de ingreso configurada. Crea el perfil "Inducción General" y agrégale los cursos.',
    }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  let ids: string[] = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean) : []

  if (body.todos) {
    const { data } = await supabase.from('users')
      .select('id').eq('company_id', companyId).eq('role', 'worker')
      .eq('active', true).is('retired_at', null)
    ids = (data ?? []).map(u => u.id)
  }

  if (!ids.length) return NextResponse.json({ error: 'No se indicó a quién asignarla' }, { status: 400 })

  // Solo trabajadores de esta empresa: no se asigna a cuentas administrativas
  // ni a gente de otra empresa aunque lleguen sus identificadores.
  const { data: validos } = await supabase.from('users')
    .select('id').eq('company_id', companyId).eq('role', 'worker').in('id', ids)

  let asignados = 0, yaTenian = 0
  const fallos: string[] = []

  for (const u of validos ?? []) {
    const r = await asignarInduccion(u.id, companyId)
    if (r.motivo === 'asignada') asignados++
    else if (r.motivo === 'ya_la_tenia') yaTenian++
    else fallos.push(u.id)
  }

  return NextResponse.json({ asignados, yaTenian, fallos: fallos.length, cursos: cursos.length })
}
