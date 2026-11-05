import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { aQuienLeTocaPorPerfil, perfilesDePersonas } from '@/lib/perfiles-personas'

/**
 * Lo que el perfil ya sabe y el asistente no tenía que volver a preguntar.
 *
 *  ?training_id=N        → a quién le toca esa capacitación por su perfil, y
 *                          desde qué perfiles. Es lo que se pre-marca.
 *  &user_ids=a,b,c       → además, a qué perfiles pertenece esa gente y si la
 *                          capacitación ya está en la plantilla de cada uno.
 */
export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('formacion.ver')
  if (!authorized || !companyId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = Number(req.nextUrl.searchParams.get('training_id'))
  if (!trainingId) return NextResponse.json({ error: 'Falta la capacitación' }, { status: 400 })

  const { userIds, perfiles } = await aQuienLeTocaPorPerfil(trainingId, companyId)

  const pedidos = (req.nextUrl.searchParams.get('user_ids') ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)

  let deLaGente: { id: string; name: string; personas: number; yaLaTiene: boolean }[] = []
  if (pedidos.length) {
    const conLaCapacitacion = new Set(perfiles.map(p => p.id))
    deLaGente = (await perfilesDePersonas(pedidos, companyId))
      .map(p => ({ ...p, yaLaTiene: conLaCapacitacion.has(p.id) }))
  }

  return NextResponse.json({ userIds, perfiles, perfilesDeLaGente: deLaGente })
}

/** Agrega la capacitación a la plantilla de los perfiles indicados. */
export async function POST(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const trainingId = Number(body.training_id)
  const perfiles: string[] = Array.isArray(body.profile_ids) ? body.profile_ids.filter(Boolean) : []
  if (!trainingId || !perfiles.length) return NextResponse.json({ agregados: 0 })

  // Solo perfiles de esta empresa: un id suelto no mete cursos en otra.
  const { data: mios } = await supabase.from('training_profiles')
    .select('id').eq('company_id', companyId).in('id', perfiles)
  const validos = (mios ?? []).map(p => p.id)
  if (!validos.length) return NextResponse.json({ agregados: 0 })

  const { data, error } = await supabase.from('profile_trainings')
    .upsert(
      validos.map(profile_id => ({
        profile_id, training_id: trainingId, required: body.required !== false,
      })),
      { onConflict: 'profile_id,training_id', ignoreDuplicates: true },
    )
    .select('profile_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agregados: data?.length ?? 0 })
}
