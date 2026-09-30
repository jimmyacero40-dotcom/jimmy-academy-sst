import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser, getActiveCompanyId, requierePermiso } from '@/lib/get-company'
import { estaCompleta } from '@/lib/peligros'

/** El periodo es el año: la participación es anual. */
function periodoActual(req: NextRequest): number {
  const p = Number(req.nextUrl.searchParams.get('periodo'))
  return Number.isInteger(p) && p > 2000 ? p : new Date().getFullYear()
}

// Solo estas columnas se aceptan del cliente; el resto se calcula en el servidor.
const CAMPOS_RESPUESTA = [
  'actividades', 'herramientas', 'situaciones_riesgo', 'peligros', 'peligros_otro',
  'donde_cuando', 'frecuencia', 'controles_existentes', 'controles_suficientes',
  'oportunidades_mejora', 'cambios_ultimo_ano', 'peligro_prioritario',
  'otros_peligros', 'confirma_participacion',
] as const

/**
 * GET sin parámetros: la participación del propio trabajador.
 * GET ?alcance=empresa: el consolidado, solo para quien pueda consultarlas.
 */
export async function GET(req: NextRequest) {
  const periodo = periodoActual(req)

  if (req.nextUrl.searchParams.get('alcance') === 'empresa') {
    const { authorized, companyId } = await requierePermiso('sst.participacion.ver')
    if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

    // La plantilla vigente sale de users; la participación trae su propia
    // instantánea, que es la que vale para el histórico.
    const [{ data: trabajadores }, { data: participaciones }, { data: perfiles }] = await Promise.all([
      supabase.from('users')
        .select('id, name, cedula, cargo, area')
        .eq('company_id', companyId).eq('role', 'worker').eq('active', true)
        .is('retired_at', null).order('name'),
      supabase.from('hazard_participations')
        .select('*').eq('company_id', companyId).eq('periodo', periodo),
      supabase.from('worker_profiles')
        .select('user_id, centro_trabajo, cargo_confirmado, area_confirmada').eq('company_id', companyId),
    ])

    const perfilDe = new Map((perfiles ?? []).map((p: any) => [p.user_id, p]))
    const partDe = new Map((participaciones ?? []).map((p: any) => [p.user_id, p]))

    const filas = (trabajadores ?? []).map((t: any) => {
      const perfil = perfilDe.get(t.id)
      const part = partDe.get(t.id)
      const enviada = part?.estado === 'enviado'
      return {
        user_id: t.id,
        // Lo vigente si no participó; lo que era entonces si ya participó.
        nombre: enviada ? (part.trabajador_nombre ?? t.name) : t.name,
        cedula: enviada ? (part.trabajador_cedula ?? t.cedula) : t.cedula,
        cargo:  enviada ? (part.cargo ?? t.cargo) : (perfil?.cargo_confirmado || t.cargo || null),
        area:   enviada ? (part.area ?? t.area)  : (perfil?.area_confirmada  || t.area  || null),
        centro_trabajo: enviada ? part.centro_trabajo : (perfil?.centro_trabajo ?? null),
        estado: enviada ? 'Participó' : 'Pendiente',
        enviado_at: part?.enviado_at ?? null,
        participacion: enviada ? part : null,
      }
    })

    return NextResponse.json({ periodo, filas })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [{ data, error }, { data: perfil }, { data: empresa }] = await Promise.all([
    supabase.from('hazard_participations')
      .select('*').eq('user_id', user.id).eq('periodo', periodo).maybeSingle(),
    supabase.from('worker_profiles')
      .select('centro_trabajo, cargo_confirmado, area_confirmada').eq('user_id', user.id).maybeSingle(),
    supabase.from('companies').select('name').eq('id', user.company_id).maybeSingle(),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sus datos ya están en la plataforma: no se le vuelven a pedir.
  const trabajador = {
    nombre: user.name,
    cedula: (user as any).cedula ?? null,
    empresa: empresa?.name ?? null,
    cargo: perfil?.cargo_confirmado || (user as any).cargo || null,
    area: perfil?.area_confirmada || (user as any).area || null,
    centro_trabajo: perfil?.centro_trabajo || null,
  }

  return NextResponse.json({ periodo, participacion: data ?? null, trabajador })
}

/**
 * Borra participaciones ya registradas. Existe sobre todo para limpiar las
 * pruebas del arranque; no hay papelera, así que se exige la lista explícita
 * de trabajadores y el periodo.
 */
export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.participacion.eliminar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const userIds: string[] = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean) : []
  const periodo = Number.isInteger(body.periodo) ? body.periodo : new Date().getFullYear()
  if (!userIds.length) return NextResponse.json({ error: 'No se indicó a quién borrar' }, { status: 400 })

  // Acotado a la empresa activa: nunca toca datos de otra.
  const { data, error } = await supabase
    .from('hazard_participations')
    .delete()
    .eq('company_id', companyId).eq('periodo', periodo).in('user_id', userIds)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ eliminadas: data?.length ?? 0 })
}

/** Guarda la participación del propio trabajador. Nadie responde por otro. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const periodo = Number.isInteger(body.periodo) ? body.periodo : new Date().getFullYear()
  const enviar = body.enviar === true

  const respuestas: Record<string, any> = {}
  for (const campo of CAMPOS_RESPUESTA) {
    if (body[campo] === undefined) continue
    respuestas[campo] = campo === 'peligros'
      ? (Array.isArray(body.peligros) ? body.peligros : [])
      : body[campo]
  }

  const { data: actual } = await supabase.from('hazard_participations')
    .select('*').eq('user_id', user.id).eq('periodo', periodo).maybeSingle()

  // Una vez enviada no se reabre desde aquí: el histórico queda firme.
  if (actual?.estado === 'enviado') {
    return NextResponse.json({ error: 'Ya registraste tu participación de este año' }, { status: 409 })
  }

  const fusionada = { ...(actual ?? {}), ...respuestas }
  if (enviar && !estaCompleta(fusionada as any)) {
    return NextResponse.json({ error: 'Faltan respuestas obligatorias' }, { status: 400 })
  }

  // La instantánea del trabajador se toma en el momento del envío.
  const { data: perfil } = await supabase.from('worker_profiles')
    .select('centro_trabajo, cargo_confirmado, area_confirmada').eq('user_id', user.id).maybeSingle()
  const { data: empresa } = await supabase.from('companies').select('name').eq('id', companyId).maybeSingle()
  const { data: datosUsuario } = await supabase.from('users')
    .select('name, cedula, cargo, area').eq('id', user.id).maybeSingle()

  const payload = {
    ...respuestas,
    company_id: companyId,
    user_id: user.id,
    periodo,
    trabajador_nombre: datosUsuario?.name ?? null,
    trabajador_cedula: datosUsuario?.cedula ?? null,
    empresa: empresa?.name ?? null,
    cargo: perfil?.cargo_confirmado || datosUsuario?.cargo || null,
    area: perfil?.area_confirmada || datosUsuario?.area || null,
    centro_trabajo: perfil?.centro_trabajo ?? null,
    estado: enviar ? 'enviado' : 'borrador',
    enviado_at: enviar ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = actual
    ? await supabase.from('hazard_participations').update(payload).eq('id', actual.id).select().single()
    : await supabase.from('hazard_participations').insert(payload).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ participacion: data })
}
