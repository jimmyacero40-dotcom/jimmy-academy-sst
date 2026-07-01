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

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  const body = await req.json()

  const completion_pct = calcCompletion(body)

  const payload = {
    ...body,
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
