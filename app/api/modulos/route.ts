import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser, requierePermiso } from '@/lib/get-company'

/**
 * GET: los módulos de la empresa.
 *   ?mios=1  → los que le tocan al trabajador que consulta, ya abiertos,
 *              con el estado de su propia respuesta. No necesita permiso:
 *              cualquiera puede ver lo suyo.
 *   sin eso  → todos, para administrarlos. Requiere permiso.
 */
export async function GET(req: NextRequest) {
  const mios = req.nextUrl.searchParams.get('mios') === '1'

  if (mios) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: modulos } = await supabase
      .from('modulos').select('*')
      .eq('company_id', user.company_id).eq('estado', 'abierto')
      .order('created_at', { ascending: false })

    // "Dirigido a" se compara con lo que diga su ficha, y si no, con users.
    const { data: perfil } = await supabase.from('worker_profiles')
      .select('centro_trabajo, cargo_confirmado, area_confirmada')
      .eq('user_id', user.id).maybeSingle()

    const suyos = (modulos ?? []).filter(m => {
      if (m.dirigido_a === 'todos') return true
      const valor = (m.dirigido_valor ?? '').trim().toUpperCase()
      if (!valor) return true
      const propio = m.dirigido_a === 'area'  ? (perfil?.area_confirmada || (user as any).area)
        : m.dirigido_a === 'cargo' ? (perfil?.cargo_confirmado || (user as any).cargo)
          : perfil?.centro_trabajo
      return (propio ?? '').trim().toUpperCase() === valor
    })

    const ids = suyos.map(m => m.id)
    const { data: mias } = ids.length
      ? await supabase.from('modulo_respuestas')
          .select('modulo_id, estado').eq('user_id', user.id).in('modulo_id', ids)
      : { data: [] as any[] }
    const estadoDe = new Map((mias ?? []).map((r: any) => [r.modulo_id, r.estado]))

    return NextResponse.json(suyos.map(m => ({ ...m, mi_estado: estadoDe.get(m.id) ?? null })))
  }

  const { authorized, companyId } = await requierePermiso('sst.modulos.ver')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const { data: modulos, error } = await supabase
    .from('modulos').select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (modulos ?? []).map(m => m.id)
  const [{ data: preguntas }, { data: respuestas }] = await Promise.all([
    ids.length ? supabase.from('modulo_preguntas').select('modulo_id').in('modulo_id', ids)
      : Promise.resolve({ data: [] as any[] }),
    ids.length ? supabase.from('modulo_respuestas').select('modulo_id, estado').in('modulo_id', ids)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const cuenta = (lista: any[], filtro?: (x: any) => boolean) => {
    const m = new Map<string, number>()
    for (const x of lista) {
      if (filtro && !filtro(x)) continue
      m.set(x.modulo_id, (m.get(x.modulo_id) ?? 0) + 1)
    }
    return m
  }
  const nPreguntas = cuenta(preguntas ?? [])
  const nEnviadas = cuenta(respuestas ?? [], r => r.estado === 'enviado')

  return NextResponse.json((modulos ?? []).map(m => ({
    ...m,
    preguntas: nPreguntas.get(m.id) ?? 0,
    respondieron: nEnviadas.get(m.id) ?? 0,
  })))
}

/** Crea un módulo vacío. Las preguntas se le ponen después. */
export async function POST(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.modulos.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const user = await getCurrentUser()
  const body = await req.json().catch(() => ({}))
  const nombre = (body.nombre ?? '').trim()
  if (!nombre) return NextResponse.json({ error: 'Ponle un nombre al módulo' }, { status: 400 })

  const { data, error } = await supabase.from('modulos').insert({
    company_id: companyId,
    nombre,
    descripcion: (body.descripcion ?? '').trim() || null,
    color: body.color || '#8B5CF6',
    periodo: Number.isInteger(body.periodo) ? body.periodo : new Date().getFullYear(),
    dirigido_a: ['todos', 'area', 'cargo', 'finca'].includes(body.dirigido_a) ? body.dirigido_a : 'todos',
    dirigido_valor: (body.dirigido_valor ?? '').trim() || null,
    creado_por: user?.id ?? null,
    creado_por_nombre: user?.name ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export const dynamic = 'force-dynamic'
