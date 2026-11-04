import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser, requierePermiso } from '@/lib/get-company'
import { estaCompleta, type Pregunta } from '@/lib/modulos'

async function preguntasDe(id: string): Promise<Pregunta[]> {
  const { data } = await supabase.from('modulo_preguntas')
    .select('*').eq('modulo_id', id).order('orden')
  return (data ?? []).map((p: any) => ({ ...p, opciones: p.opciones ?? [] }))
}

/**
 * Quién respondió y quién no.
 *
 * Devuelve a todos los trabajadores a quienes les toca, hayan respondido o
 * no: un consolidado que solo muestre a los que contestaron no sirve para
 * perseguir a los que faltan.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('sst.modulos.ver')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const { data: modulo } = await supabase.from('modulos')
    .select('*').eq('id', params.id).maybeSingle()
  if (!modulo || modulo.company_id !== companyId) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
  }

  const [{ data: trabajadores }, { data: respuestas }, { data: perfiles }] = await Promise.all([
    supabase.from('users').select('id, name, cedula, cargo, area')
      .eq('company_id', companyId).eq('role', 'worker').eq('active', true)
      .is('retired_at', null).order('name'),
    supabase.from('modulo_respuestas').select('*').eq('modulo_id', params.id),
    supabase.from('worker_profiles')
      .select('user_id, centro_trabajo, cargo_confirmado, area_confirmada')
      .eq('company_id', companyId),
  ])

  const perfilDe = new Map((perfiles ?? []).map((p: any) => [p.user_id, p]))
  const respDe = new Map((respuestas ?? []).map((r: any) => [r.user_id, r]))

  const aQuienLeToca = (t: any) => {
    if (modulo.dirigido_a === 'todos') return true
    const valor = (modulo.dirigido_valor ?? '').trim().toUpperCase()
    if (!valor) return true
    const perfil = perfilDe.get(t.id)
    const propio = modulo.dirigido_a === 'area' ? (perfil?.area_confirmada || t.area)
      : modulo.dirigido_a === 'cargo' ? (perfil?.cargo_confirmado || t.cargo)
        : perfil?.centro_trabajo
    return (propio ?? '').trim().toUpperCase() === valor
  }

  const filas = (trabajadores ?? []).filter(aQuienLeToca).map((t: any) => {
    const perfil = perfilDe.get(t.id)
    const r = respDe.get(t.id)
    const enviada = r?.estado === 'enviado'
    return {
      user_id: t.id,
      // Lo que era entonces si ya respondió; lo vigente si todavía no.
      nombre: enviada ? (r.trabajador_nombre ?? t.name) : t.name,
      cedula: enviada ? (r.trabajador_cedula ?? t.cedula) : t.cedula,
      cargo:  enviada ? (r.cargo ?? t.cargo) : (perfil?.cargo_confirmado || t.cargo || null),
      area:   enviada ? (r.area ?? t.area)  : (perfil?.area_confirmada  || t.area  || null),
      centro_trabajo: enviada ? r.centro_trabajo : (perfil?.centro_trabajo ?? null),
      estado: enviada ? 'Respondió' : r ? 'Empezada' : 'Pendiente',
      enviado_at: r?.enviado_at ?? null,
      respuestas: enviada ? (r.respuestas ?? {}) : null,
    }
  })

  return NextResponse.json({ modulo, preguntas: await preguntasDe(params.id), filas })
}

/** El trabajador guarda lo suyo. Nadie responde por otro. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: modulo } = await supabase.from('modulos')
    .select('*').eq('id', params.id).maybeSingle()
  if (!modulo || modulo.company_id !== user.company_id) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
  }

  // El cierre se comprueba aquí y no solo en la pantalla: dejar la página
  // abierta desde antes no sirve para colarse.
  if (modulo.estado !== 'abierto') {
    return NextResponse.json(
      { error: modulo.estado === 'cerrado' ? 'Este módulo ya está cerrado' : 'Este módulo todavía no está disponible' },
      { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const enviar = body.enviar === true
  const entrantes = (body.respuestas && typeof body.respuestas === 'object') ? body.respuestas : {}

  const { data: actual } = await supabase.from('modulo_respuestas')
    .select('*').eq('modulo_id', params.id).eq('user_id', user.id).maybeSingle()

  // Una vez enviada no se reabre: el histórico queda firme.
  if (actual?.estado === 'enviado') {
    return NextResponse.json({ error: 'Ya respondiste este módulo' }, { status: 409 })
  }

  const preguntas = await preguntasDe(params.id)
  // Solo se guarda lo que corresponde a una pregunta que existe.
  const validas = new Set(preguntas.map(p => p.id))
  const respuestas: Record<string, any> = { ...(actual?.respuestas ?? {}) }
  for (const [k, v] of Object.entries(entrantes)) if (validas.has(k)) respuestas[k] = v

  if (enviar && !estaCompleta(preguntas, respuestas)) {
    return NextResponse.json({ error: 'Faltan respuestas obligatorias' }, { status: 400 })
  }

  const { data: perfil } = await supabase.from('worker_profiles')
    .select('centro_trabajo, cargo_confirmado, area_confirmada')
    .eq('user_id', user.id).maybeSingle()
  const { data: datos } = await supabase.from('users')
    .select('name, cedula, cargo, area').eq('id', user.id).maybeSingle()

  const payload = {
    modulo_id: params.id,
    user_id: user.id,
    company_id: user.company_id,
    estado: enviar ? 'enviado' : 'borrador',
    respuestas,
    trabajador_nombre: datos?.name ?? null,
    trabajador_cedula: datos?.cedula ?? null,
    cargo: perfil?.cargo_confirmado || datos?.cargo || null,
    area: perfil?.area_confirmada || datos?.area || null,
    centro_trabajo: perfil?.centro_trabajo ?? null,
    enviado_at: enviar ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = actual
    ? await supabase.from('modulo_respuestas').update(payload).eq('id', actual.id).select().single()
    : await supabase.from('modulo_respuestas').insert(payload).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ respuesta: data })
}
