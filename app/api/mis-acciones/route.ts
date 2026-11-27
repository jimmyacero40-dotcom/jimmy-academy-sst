import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser } from '@/lib/get-company'
import { tienePermiso } from '@/lib/permisos'

/**
 * Las acciones que le asignaron a quien pregunta.
 *
 * Esta ruta es la única puerta del responsable, y por eso filtra siempre por
 * su propio identificador: nadie ve los reportes de otro. Un reporte puede
 * nombrar a un trabajador o describir una situación delicada, y quien va a
 * cambiar una guarda rota no tiene por qué leer los demás.
 *
 * Quien ejecuta no cierra. Aquí se deja constancia de lo que se hizo; SST lo
 * verifica y lo cierra desde RePortal. Así quedan dos fechas y dos nombres,
 * que es lo que pide una auditoría.
 */

/** Lo que el responsable puede ver de un reporte: lo necesario para actuar. */
const CAMPOS = `id, codigo, fecha_reporte, lugar, area, centro_trabajo, tipos,
  descripcion, acciones_inmediatas, sugerencia_mejora, estado,
  responsable_id, responsable_nombre, fecha_asignacion,
  accion_intervencion, observaciones_sst,
  ejecucion_descripcion, ejecucion_at, ejecutado_por_nombre,
  fecha_cierre, observaciones_cierre, created_at`

async function quien() {
  const user = await getCurrentUser()
  if (!user) return null
  const puede = user.role === 'responsable'
    || tienePermiso(user.role, (user as any).permissions, 'sst.reportes.responder')
  return puede ? user : null
}

export async function GET() {
  const user = await quien()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase
    .from('hse_reports')
    .select(CAMPOS)
    .eq('responsable_id', user.id)
    .neq('estado', 'borrador')
    .order('fecha_asignacion', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ acciones: data ?? [], quien: { id: user.id, nombre: user.name } })
}

/**
 * Dejar constancia de lo que se hizo.
 *
 * No toca el estado «cerrado»: lo más que hace es pasar el reporte a «en
 * gestión» para que SST vea que ya hay algo hecho. Y no se puede reescribir lo
 * que ya cerró SST.
 */
export async function POST(req: NextRequest) {
  const user = await quien()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const id = String(b.id ?? '')
  const texto = String(b.ejecucion_descripcion ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Falta el reporte' }, { status: 400 })
  if (!texto) return NextResponse.json({ error: 'Escriba qué se hizo' }, { status: 400 })

  // Solo lo suyo, y solo lo que no esté cerrado.
  const { data: actual, error: eLeer } = await supabase
    .from('hse_reports')
    .select('id, estado, responsable_id, codigo')
    .eq('id', id)
    .eq('responsable_id', user.id)
    .maybeSingle()

  if (eLeer) return NextResponse.json({ error: eLeer.message }, { status: 500 })
  if (!actual) return NextResponse.json({ error: 'Esa acción no es suya' }, { status: 404 })
  if (actual.estado === 'cerrado') {
    return NextResponse.json({
      error: 'Ese reporte ya lo cerró SST. Si falta algo, avísele al profesional de SST.',
    }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('hse_reports')
    .update({
      ejecucion_descripcion: texto.slice(0, 4000),
      ejecucion_at: new Date().toISOString(),
      ejecutado_por: user.id,
      ejecutado_por_nombre: user.name ?? null,
      // Queda en gestión: hecho está, pero cerrarlo es de quien verifica.
      estado: 'en_gestion',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('responsable_id', user.id)
    .select(CAMPOS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // La bitácora del reporte: quién hizo qué y cuándo.
  await supabase.from('hse_report_events').insert({
    report_id: id,
    user_id: user.id,
    user_name: user.name ?? null,
    accion: 'ejecucion_registrada',
    detalle: { texto: texto.slice(0, 500) },
  }).select('id').maybeSingle()

  return NextResponse.json(data)
}
