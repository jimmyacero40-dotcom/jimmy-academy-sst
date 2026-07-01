import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Profiles joined with user name/cedula
  let q = supabase
    .from('worker_profiles')
    .select(`
      id, user_id, completion_pct, updated_at,
      sexo, estado_civil, nivel_educativo, estrato, tipo_vivienda, cabeza_hogar,
      tipo_contrato, jornada_laboral,
      realiza_actividad_fisica, fuma, consumo_alcohol, consume_energizantes, consume_psicoactivos,
      horas_sueno, enfermedades_diagnosticadas, alergias, cirugias, accidentes_trabajo,
      enfermedades_laborales, restricciones_medicas,
      talla_camisa, talla_camiseta, talla_pantalon, talla_overol,
      talla_chaqueta, talla_impermeable, talla_zapato, talla_botas, talla_guantes,
      fecha_nacimiento, cargo_confirmado, area_confirmada, certificaciones,
      users(name, cedula, email, area)
    `)
    .order('updated_at', { ascending: false })

  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
