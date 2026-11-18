import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentUser, getActiveCompanyId, isAdminOrSuper } from '@/lib/get-company'
import {
  visibleParaTrabajador, TIPOS_AUTOMATICOS, diasDesde,
  type Tarjeta, type Persona,
} from '@/lib/tablero'

export const dynamic = 'force-dynamic'

/**
 * Lo que se pinta en la pantalla de inicio.
 *
 * Con `?todas=1` devuelve también las apagadas, las programadas y las vencidas,
 * que es lo que necesita el modo editar. Esa variante es solo para quien
 * administra: un trabajador que llame la misma URL recibe su tablero normal, no
 * un error, porque no está pidiendo nada que no le corresponda —simplemente no
 * se le entrega lo que no es suyo.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({ tarjetas: [] })

  const { authorized: esAdmin } = await isAdminOrSuper()
  const todas = esAdmin && req.nextUrl.searchParams.get('todas') === '1'

  const { data, error } = await supabaseAdmin
    .from('tablero_tarjetas')
    .select('*')
    .eq('company_id', companyId)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tarjetas = (data ?? []) as Tarjeta[]

  // La sede no está en `users`: vive en la ficha sociodemográfica. Si la persona
  // todavía no tiene ficha se queda sin centro, y entonces solo ve lo dirigido a
  // todos —que es lo correcto: no se le adivina una sede.
  const { data: ficha } = await supabaseAdmin
    .from('worker_profiles')
    .select('centro_trabajo')
    .eq('user_id', user.id)
    .maybeSingle()

  const persona: Persona = { centro: ficha?.centro_trabajo ?? null, area: user.area }

  const visibles = todas ? tarjetas : tarjetas.filter(t => visibleParaTrabajador(t, persona))

  // Las automáticas llegan vacías de la base: el contenido se calcula aquí, una
  // sola vez, y solo si alguna está prendida.
  const automaticas = visibles.filter(t => TIPOS_AUTOMATICOS.has(t.tipo))
  if (automaticas.length) {
    const calculado = await calcularAutomaticas(automaticas, companyId, user.id)
    for (const t of automaticas) Object.assign(t, { datos: { ...t.datos, ...calculado[t.tipo] } })
  }

  // El contador no necesita base de datos, pero sí que el día lo ponga el
  // servidor: un celular con la fecha corrida mostraría un récord falso.
  for (const t of visibles) {
    if (t.tipo === 'contador') {
      t.datos = { ...t.datos, dias: diasDesde(t.datos?.desde_contador) }
    }
  }

  // El editor necesita saber a qué sedes y áreas se puede dirigir una tarjeta.
  // Salen de los datos reales y no de una lista escrita a mano: si mañana
  // abren una sede nueva, aparece sola.
  const opciones = todas ? await opcionesDeAudiencia(companyId) : undefined

  const { data: ajustes } = await supabaseAdmin
    .from('tablero_ajustes').select('separacion').eq('company_id', companyId).maybeSingle()

  return NextResponse.json({
    tarjetas: visibles, esAdmin, persona, opciones,
    separacion: ajustes?.separacion ?? 16,
  })
}

/** Guarda los ajustes de todo el tablero. */
export async function PATCH(req: NextRequest) {
  const { authorized, companyId, user } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const { separacion } = await req.json().catch(() => ({ separacion: null }))
  const n = Number(separacion)
  if (!Number.isFinite(n) || n < 0 || n > 64) {
    return NextResponse.json({ error: 'La separación va de 0 a 64 píxeles' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('tablero_ajustes')
    .upsert({
      company_id: companyId,
      separacion: Math.round(n),
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, separacion: Math.round(n) })
}

async function opcionesDeAudiencia(companyId: string) {
  const [{ data: fichas }, { data: areas }] = await Promise.all([
    supabaseAdmin.from('worker_profiles').select('centro_trabajo').eq('company_id', companyId),
    supabaseAdmin.from('areas').select('name').eq('company_id', companyId).order('name'),
  ])

  const centros = Array.from(
    new Set((fichas ?? []).map((f: any) => (f.centro_trabajo ?? '').trim().toUpperCase()).filter(Boolean)),
  ).sort()

  return { centros, areas: (areas ?? []).map((a: any) => a.name) }
}

/** Contenido de las tarjetas que se llenan solas. */
async function calcularAutomaticas(
  pedidas: Tarjeta[],
  companyId: string,
  userId: string,
): Promise<Record<string, any>> {
  const quiere = new Set(pedidas.map(t => t.tipo))
  const salida: Record<string, any> = {}

  if (quiere.has('capacitaciones')) {
    const hoy = new Date().toISOString().slice(0, 10)
    const { data } = await supabaseAdmin
      .from('plan_items')
      .select('scheduled_date, required, modalidad, estado, trainings(title), annual_plans!inner(company_id)')
      .gte('scheduled_date', hoy)
      .neq('estado', 'cancelada')
      .eq('annual_plans.company_id', companyId)
      .order('scheduled_date', { ascending: true })
      .limit(3)

    salida.capacitaciones = {
      proximas: (data ?? []).map((p: any) => ({
        titulo: p.trainings?.title ?? 'Capacitación',
        fecha: p.scheduled_date,
        obligatoria: !!p.required,
        modalidad: p.modalidad ?? null,
      })),
    }
  }

  if (quiere.has('formacion')) {
    const { data } = await supabaseAdmin
      .from('enrollments')
      .select('status, plan_items(estado)')
      .eq('user_id', userId)

    // Una ronda cancelada no le queda pendiente a nadie: se descuenta antes de
    // sacar el porcentaje, igual que en Trazabilidad.
    const mias = (data ?? []).filter((e: any) => e.plan_items?.estado !== 'cancelada')
    const total = mias.length
    const alDia = mias.filter((e: any) => e.status === 'completed').length

    salida.formacion = {
      total,
      pendientes: total - alDia,
      porcentaje: total ? Math.round((alDia / total) * 100) : null,
    }
  }

  return salida
}
