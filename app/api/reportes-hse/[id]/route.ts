import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { tienePermiso } from '@/lib/permisos'

// Lo único que SST puede tocar. Nada de lo que escribió el trabajador aparece
// aquí: su reporte queda tal como lo envió.
const CAMPOS_GESTION = [
  'estado', 'responsable_id', 'fecha_asignacion', 'observaciones_sst',
  'accion_intervencion', 'fecha_gestion', 'fecha_cierre', 'observaciones_cierre',
  'seguimiento', 'recibe_nombre', 'matriz_mejoras_num',
] as const

// La tarjeta del trabajador. Solo se puede enmendar con permiso aparte, y
// cada enmienda queda en la bitácora con el valor anterior.
const CAMPOS_TARJETA = [
  'fecha_reporte', 'lugar', 'tipos', 'descripcion',
  'acciones_inmediatas', 'otra_accion', 'sugerencia_mejora',
] as const

const ETIQUETAS: Record<string, string> = {
  fecha_reporte: 'Fecha del reporte', lugar: 'Lugar', tipos: 'Tipo de reporte',
  descripcion: '¿Qué sucedió?', acciones_inmediatas: 'Acción inmediata',
  otra_accion: 'Otra acción o sugerencia', sugerencia_mejora: 'Sugerencia de mejora',
  estado: 'Estado', responsable_id: 'Responsable', fecha_asignacion: 'Fecha de asignación',
  observaciones_sst: 'Observaciones de SST', accion_intervencion: 'Acción o intervención',
  fecha_gestion: 'Fecha de gestión', fecha_cierre: 'Fecha de cierre',
  observaciones_cierre: 'Observaciones de cierre', seguimiento: 'Seguimiento',
  recibe_nombre: 'Quien recibe la solicitud', matriz_mejoras_num: 'N.º en Matriz de Mejoras',
}

/** Un reporte con su bitácora, para la vista de detalle de SST. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('sst.reportes.ver', 'sst.reportes.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase.from('hse_reports')
    .select('*').eq('id', params.id).eq('company_id', companyId).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })

  const { data: bitacora } = await supabase.from('hse_report_events')
    .select('*').eq('report_id', params.id).order('created_at', { ascending: false })

  return NextResponse.json({ reporte: data, bitacora: bitacora ?? [] })
}

/** Registra el trámite. Cada cambio queda en la bitácora, nada se pisa en silencio. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, user, companyId } = await requierePermiso('sst.reportes.gestionar')
  if (!authorized || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Enmendar la tarjeta del trabajador es una capacidad aparte de gestionarla.
  const puedeCorregir = tienePermiso(user.role, user.permissions, 'sst.reportes.corregir')

  const { data: actual } = await supabase.from('hse_reports')
    .select('*').eq('id', params.id).eq('company_id', companyId).maybeSingle()
  if (!actual) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const cambios: Record<string, any> = {}
  let corrigioLaTarjeta = false

  for (const campo of CAMPOS_GESTION) {
    if (body[campo] === undefined) continue
    const valor = body[campo] === '' ? null : body[campo]
    if (valor !== actual[campo]) cambios[campo] = valor
  }

  if (puedeCorregir) {
    for (const campo of CAMPOS_TARJETA) {
      if (body[campo] === undefined) continue
      const valor = Array.isArray(body[campo])
        ? body[campo]
        : (body[campo] === '' ? null : body[campo])
      const igual = Array.isArray(valor)
        ? JSON.stringify(valor) === JSON.stringify(actual[campo] ?? [])
        : valor === actual[campo]
      if (!igual) { cambios[campo] = valor; corrigioLaTarjeta = true }
    }
  }
  if (!Object.keys(cambios).length) return NextResponse.json({ reporte: actual, sinCambios: true })

  // El nombre del responsable se guarda junto al id: si la cuenta cambia o se
  // retira, el histórico sigue diciendo a quién se le asignó.
  if (cambios.responsable_id !== undefined) {
    if (cambios.responsable_id) {
      const { data: resp } = await supabase.from('users').select('name').eq('id', cambios.responsable_id).maybeSingle()
      cambios.responsable_nombre = resp?.name ?? null
      if (!actual.fecha_asignacion && cambios.fecha_asignacion === undefined) {
        cambios.fecha_asignacion = new Date().toISOString().slice(0, 10)
      }
    } else {
      cambios.responsable_nombre = null
    }
  }

  const { data, error } = await supabase.from('hse_reports')
    .update({
      ...cambios,
      gestionado_por: user.id,
      gestionado_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const detalle = Object.entries(cambios)
    .filter(([k]) => k !== 'responsable_nombre')
    .map(([k, v]) => ({ campo: ETIQUETAS[k] ?? k, antes: actual[k] ?? null, ahora: v }))

  await supabase.from('hse_report_events').insert({
    report_id: params.id,
    user_id: user.id,
    user_name: user.name,
    accion: corrigioLaTarjeta ? 'Corrigió datos de la tarjeta'
      : cambios.estado ? `Cambió el estado a ${cambios.estado}`
      : 'Actualizó la gestión',
    detalle: { cambios: detalle },
  })

  return NextResponse.json({ reporte: data })
}

/** Borra un reporte. Sin papelera: se exige un permiso propio. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, user, companyId } = await requierePermiso('sst.reportes.eliminar')
  if (!authorized || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase.from('hse_reports')
    .delete().eq('id', params.id).eq('company_id', companyId).select('codigo')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
  return NextResponse.json({ eliminado: data[0].codigo })
}
