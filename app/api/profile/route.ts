import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser, getActiveCompanyId } from '@/lib/get-company'
import { tienePermiso } from '@/lib/permisos'
import { calcPct } from '@/lib/perfil-completitud'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? {})
}

// Exact columns that exist in the worker_profiles table
const ALLOWED_COLS = new Set([
  'photo_url','doc_type','nombres','apellidos','fecha_nacimiento','sexo','estado_civil',
  'nacionalidad','ciudad_nacimiento','depto_nacimiento','ciudad_residencia','depto_residencia',
  'direccion','barrio','telefono','email_personal',
  'con_quien_vive','num_personas_hogar','num_hijos','dependientes_economicos','cabeza_hogar',
  'contacto_emergencia','parentesco_contacto','tel_contacto',
  'tipo_vivienda','tenencia_vivienda','estrato','servicios_publicos','acceso_internet',
  'nivel_educativo','profesion','estudios_tecnicos','estudios_tecnologicos',
  'estudios_universitarios','especializacion','otros_estudios','cursos_certificados','actualmente_estudia',
  'cargo_confirmado','area_confirmada','centro_trabajo','jefe_inmediato','fecha_ingreso',
  'tipo_contrato','jornada_laboral','horario_habitual','realiza_horas_extras','trabaja_fines_semana',
  'estatura_cm','peso_kg','talla_camisa','talla_camiseta','talla_pantalon','talla_overol',
  'talla_chaqueta','talla_impermeable','talla_zapato','talla_botas','talla_guantes','obs_tallas',
  'municipio_vivienda','medio_transporte','tiempo_desplazamiento','distancia_aprox',
  'conduce_vehiculo','tipo_vehiculo',
  'realiza_actividad_fisica','dias_actividad_fisica','tipo_actividad_fisica','horas_sueno',
  'descanso_adecuado','desayuna_diariamente','comidas_al_dia','consume_frutas','consume_verduras',
  'fuma','cigarrillos_dia','consumo_alcohol','consume_energizantes','consume_psicoactivos',
  'enfermedades_diagnosticadas','hospitalizado','cirugias','cirugias_detalle',
  'alergias','alergias_detalle','medicamentos_permanentes','medicamentos_detalle',
  'limitacion_fisica','limitacion_detalle','antecedentes_familiares',
  'accidentes_trabajo','enfermedades_laborales','restricciones_medicas','restricciones_detalle',
  'usa_gafas','usa_audifonos',
  'trabajo_genera_estres','apoyo_familiar','otro_empleo','es_cuidador',
  'dificultades_economicas','equilibrio_trabajo_vida',
  'licencia_conduccion','categoria_licencia','certificaciones','otras_certificaciones',
  'autoriza_datos','declara_veracidad','firma_electronica','fecha_consentimiento',
  // Seguridad social, condición de discapacidad y contactos adicionales
  'grupo_sanguineo','eps','arl','fondo_pension','caja_compensacion',
  'tiene_discapacidad','discapacidad_detalle','poblacion_vulnerable',
  'telefono_alterno','contacto_emergencia2','parentesco_contacto2','tel_contacto2',
])

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  const body = await req.json()

  // El superadmin puede editar el perfil de cualquier trabajador de su empresa;
  // cualquier otro rol solo puede escribir sobre el suyo.
  let targetUserId = user.id
  if (body.user_id && body.user_id !== user.id) {
    if (!tienePermiso(user.role, user.permissions, 'personal.editar')) {
      return NextResponse.json({ error: 'No tiene permiso para editar el perfil de otro trabajador' }, { status: 403 })
    }
    const { data: target } = await supabase
      .from('users').select('id, company_id').eq('id', body.user_id).maybeSingle()
    if (!target || (companyId && target.company_id !== companyId)) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
    }
    targetUserId = target.id
  }

  // Strip any client-side-only fields that don't exist as DB columns
  const sanitized: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_COLS.has(k)) sanitized[k] = v
  }

  // Una edición parcial (por ejemplo solo la sede desde administración) no puede
  // recalcular el avance sobre lo recibido: hay que medirlo sobre el perfil completo.
  const { data: actual } = await supabase
    .from('worker_profiles').select('*').eq('user_id', targetUserId).maybeSingle()

  const payload = {
    ...sanitized,
    user_id: targetUserId,
    company_id: companyId,
    completion_pct: calcPct({ ...(actual ?? {}), ...sanitized }),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('worker_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Keep users.cargo in sync — it is the single source of truth consumed by
  // attendance lists, certificates, and all admin views.
  if (sanitized.cargo_confirmado !== undefined) {
    await supabase
      .from('users')
      .update({ cargo: sanitized.cargo_confirmado || null })
      .eq('id', targetUserId)
  }

  return NextResponse.json(data)
}
