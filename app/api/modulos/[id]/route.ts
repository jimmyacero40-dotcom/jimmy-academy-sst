import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser, requierePermiso } from '@/lib/get-company'

/** El módulo, comprobando que sea de la empresa del que pregunta. */
async function cargar(id: string, companyId: string) {
  const { data } = await supabase.from('modulos').select('*').eq('id', id).maybeSingle()
  if (!data || data.company_id !== companyId) return null
  return data
}

async function preguntasDe(id: string) {
  const { data } = await supabase.from('modulo_preguntas')
    .select('*').eq('modulo_id', id).order('orden')
  return (data ?? []).map((p: any) => ({ ...p, opciones: p.opciones ?? [] }))
}

/**
 * El módulo con sus preguntas. Al trabajador se le entrega solo si está
 * abierto o si ya respondió, y con su propia respuesta adjunta.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { authorized } = await requierePermiso('sst.modulos.ver')

  const modulo = await cargar(params.id, user.company_id!)
  if (!modulo) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })

  const preguntas = await preguntasDe(params.id)

  if (authorized) return NextResponse.json({ modulo, preguntas })

  // Un trabajador: solo lo abierto, y si ya respondió puede volver a verlo.
  const { data: mia } = await supabase.from('modulo_respuestas')
    .select('*').eq('modulo_id', params.id).eq('user_id', user.id).maybeSingle()

  if (modulo.estado === 'borrador' && !mia) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
  }

  const { data: perfil } = await supabase.from('worker_profiles')
    .select('centro_trabajo, cargo_confirmado, area_confirmada')
    .eq('user_id', user.id).maybeSingle()

  return NextResponse.json({
    modulo, preguntas, respuesta: mia ?? null,
    trabajador: {
      nombre: user.name,
      cedula: (user as any).cedula ?? null,
      cargo: perfil?.cargo_confirmado || (user as any).cargo || null,
      area: perfil?.area_confirmada || (user as any).area || null,
      centro_trabajo: perfil?.centro_trabajo ?? null,
    },
  })
}

/** Cambia los datos del módulo o su estado. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId, user } = await requierePermiso('sst.modulos.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const modulo = await cargar(params.id, companyId)
  if (!modulo) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const cambios: Record<string, any> = { updated_at: new Date().toISOString() }

  if (typeof body.nombre === 'string') {
    if (!body.nombre.trim()) return NextResponse.json({ error: 'El nombre no puede quedar vacío' }, { status: 400 })
    cambios.nombre = body.nombre.trim()
  }
  if (body.descripcion !== undefined) cambios.descripcion = (body.descripcion ?? '').trim() || null
  if (typeof body.color === 'string') cambios.color = body.color
  if (Number.isInteger(body.periodo)) cambios.periodo = body.periodo
  if (['todos', 'area', 'cargo', 'finca'].includes(body.dirigido_a)) cambios.dirigido_a = body.dirigido_a
  if (body.dirigido_valor !== undefined) cambios.dirigido_valor = (body.dirigido_valor ?? '').trim() || null

  if (['borrador', 'abierto', 'cerrado'].includes(body.estado)) {
    // Abrir sin preguntas dejaría al trabajador frente a una pantalla vacía.
    if (body.estado === 'abierto' && (await preguntasDe(params.id)).length === 0) {
      return NextResponse.json({ error: 'Escribe al menos una pregunta antes de abrirlo' }, { status: 400 })
    }
    cambios.estado = body.estado
    cambios.motivo_cierre = body.estado === 'cerrado'
      ? ((body.motivo ?? '').trim() || null)
      : null
    cambios.estado_cambiado_at = new Date().toISOString()
    cambios.estado_cambiado_por_nombre = user?.name ?? null
  }

  const { data, error } = await supabase.from('modulos')
    .update(cambios).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * Borra el módulo. Solo si nadie ha respondido todavía: lo que un trabajador
 * contó no se borra de paso al limpiar un módulo que no gustó.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('sst.modulos.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const modulo = await cargar(params.id, companyId)
  if (!modulo) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })

  const { count } = await supabase.from('modulo_respuestas')
    .select('id', { count: 'exact', head: true })
    .eq('modulo_id', params.id).eq('estado', 'enviado')

  if (count) {
    return NextResponse.json({
      error: `Ya hay ${count} ${count === 1 ? 'respuesta' : 'respuestas'}. Ciérralo en vez de borrarlo, así no se pierde lo que contaron.`,
    }, { status: 409 })
  }

  const { error } = await supabase.from('modulos').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ borrado: true })
}
