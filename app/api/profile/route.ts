import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getActiveCompanyId } from '@/lib/get-company'

function calcCompletion(d: Record<string, any>): number {
  const checks = [
    !!d.photo_url,
    !!(d.nombres && d.apellidos && d.fecha_nacimiento && d.sexo),
    !!(d.contacto_emergencia && d.tel_contacto),
    !!d.tipo_vivienda,
    !!d.nivel_educativo,
    !!(d.fecha_ingreso || d.tipo_contrato),
    !!(d.estatura_cm && d.talla_camisa && d.talla_zapato),
    !!d.municipio_vivienda,
    d.realiza_actividad_fisica !== null && d.realiza_actividad_fisica !== undefined,
    !!(d.enfermedades_diagnosticadas?.length || d.hospitalizado !== null),
    !!(d.antecedentes_familiares?.length),
    d.accidentes_trabajo !== null && d.accidentes_trabajo !== undefined,
    d.trabajo_genera_estres !== null && d.trabajo_genera_estres !== undefined,
    !!(d.certificaciones?.length || d.licencia_conduccion !== null),
    !!(d.autoriza_datos && d.declara_veracidad),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

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
])

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  const body = await req.json()

  const completion_pct = calcCompletion(body)

  // Strip any client-side-only fields that don't exist as DB columns
  const sanitized: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_COLS.has(k)) sanitized[k] = v
  }

  const payload = {
    ...sanitized,
    user_id: user.id,
    company_id: companyId,
    completion_pct,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('worker_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
