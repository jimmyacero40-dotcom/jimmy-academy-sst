import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso, getCurrentUser } from '@/lib/get-company'
import { personasDePerfil, normaliza } from '@/lib/perfiles-personas'

async function mio(id: string, companyId: string) {
  const { data } = await supabase.from('training_profiles')
    .select('id, company_id, name').eq('id', id).maybeSingle()
  return data && data.company_id === companyId ? data : null
}

/**
 * La gente del perfil, sus cargos, y los cargos que existen en la empresa
 * para poder escoger de una lista en vez de escribirlos a mano.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('formacion.ver')
  if (!authorized || !companyId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!(await mio(params.id, companyId))) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  const [{ data: cargos }, { data: excepciones }, { data: todos }] = await Promise.all([
    supabase.from('profile_cargos').select('cargo').eq('profile_id', params.id),
    supabase.from('profile_excepciones')
      .select('user_id, incluir, motivo, creado_por_nombre').eq('profile_id', params.id),
    supabase.from('users').select('cargo')
      .eq('company_id', companyId).eq('role', 'worker').eq('active', true).is('retired_at', null),
  ])

  // Los cargos que de verdad existen, con cuánta gente hay en cada uno.
  const cuenta = new Map<string, number>()
  for (const u of todos ?? []) {
    const c = (u.cargo ?? '').trim()
    if (!c) continue
    cuenta.set(c, (cuenta.get(c) ?? 0) + 1)
  }

  return NextResponse.json({
    cargos: (cargos ?? []).map(c => c.cargo),
    excepciones: excepciones ?? [],
    personas: await personasDePerfil(params.id, companyId),
    cargosDisponibles: [...cuenta.entries()]
      .map(([cargo, personas]) => ({ cargo, personas }))
      .sort((a, b) => b.personas - a.personas || a.cargo.localeCompare(b.cargo, 'es')),
  })
}

/**
 * Guarda los cargos del perfil de una vez. Se manda la lista completa: así
 * no hay que ir encadenando altas y bajas, y el resultado es el que se ve.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })
  if (!(await mio(params.id, companyId))) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const entrantes: string[] = Array.isArray(body.cargos) ? body.cargos : []

  // Sin repetidos por mayúsculas o tildes: "Aux almacén" y "AUX ALMACEN"
  // meterían a la misma gente dos veces.
  const vistos = new Set<string>()
  const limpios: string[] = []
  for (const c of entrantes) {
    const texto = String(c).trim()
    if (!texto) continue
    const clave = normaliza(texto)
    if (vistos.has(clave)) continue
    vistos.add(clave)
    limpios.push(texto)
  }

  const { error: eBorrar } = await supabase.from('profile_cargos')
    .delete().eq('profile_id', params.id)
  if (eBorrar) return NextResponse.json({ error: eBorrar.message }, { status: 500 })

  if (limpios.length) {
    const { error } = await supabase.from('profile_cargos')
      .insert(limpios.map(cargo => ({ profile_id: params.id, cargo })))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    cargos: limpios,
    personas: await personasDePerfil(params.id, companyId),
  })
}

/** Mete o saca a una persona a mano, sin tocarle el cargo. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })
  if (!(await mio(params.id, companyId))) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  const user = await getCurrentUser()
  const body = await req.json().catch(() => ({}))
  const userId: string = body.user_id
  if (!userId) return NextResponse.json({ error: 'Falta la persona' }, { status: 400 })

  // null quita la excepción y la persona vuelve a decidirse por su cargo.
  if (body.incluir === null) {
    const { error } = await supabase.from('profile_excepciones')
      .delete().eq('profile_id', params.id).eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('profile_excepciones').upsert({
      profile_id: params.id,
      user_id: userId,
      incluir: body.incluir === true,
      motivo: (body.motivo ?? '').trim() || null,
      creado_por_nombre: user?.name ?? null,
    }, { onConflict: 'profile_id,user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ personas: await personasDePerfil(params.id, companyId) })
}
