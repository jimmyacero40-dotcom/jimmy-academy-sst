import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import { TIPOS, COLORES, type TipoTarjeta } from '@/lib/tablero'
import { borrarImagenDelTablero } from '@/lib/tablero-bodega'

export const dynamic = 'force-dynamic'

const TIPOS_VALIDOS = new Set(TIPOS.map(t => t.id))
const COLORES_VALIDOS = new Set(Object.keys(COLORES))

/**
 * Lo que el administrador puede escribir. Es una lista blanca a propósito: el
 * cuerpo de la petición llega del navegador, y sin esta lista bastaría con
 * mandar `company_id` para publicar una tarjeta en otra empresa.
 */
const CAMPOS = [
  'tipo', 'titulo', 'texto', 'destacado', 'cta_texto', 'cta_url',
  'color', 'imagen_url', 'datos', 'orden', 'activa', 'desde', 'hasta', 'audiencia',
] as const

function limpiar(cuerpo: any): Record<string, any> | { error: string } {
  const out: Record<string, any> = {}
  for (const campo of CAMPOS) {
    if (!(campo in cuerpo)) continue
    out[campo] = cuerpo[campo]
  }

  if ('tipo' in out && !TIPOS_VALIDOS.has(out.tipo as TipoTarjeta)) {
    return { error: `Tipo de tarjeta desconocido: ${out.tipo}` }
  }
  if ('color' in out && !COLORES_VALIDOS.has(out.color)) {
    return { error: `Color desconocido: ${out.color}` }
  }
  // Una tarjeta que empieza después de terminar no se vería nunca, y el
  // administrador se quedaría esperando a que apareciera.
  if (out.desde && out.hasta && new Date(out.desde) > new Date(out.hasta)) {
    return { error: 'La fecha de inicio es posterior a la de fin' }
  }
  for (const f of ['desde', 'hasta'] as const) {
    if (f in out && !out[f]) out[f] = null
  }
  if ('datos' in out && (typeof out.datos !== 'object' || out.datos === null)) out.datos = {}

  out.updated_at = new Date().toISOString()
  return out
}

/** Crear una tarjeta. Entra apagada: nadie publica sin querer mientras escribe. */
export async function POST(req: NextRequest) {
  const { authorized, companyId, user } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const cuerpo = await req.json().catch(() => ({}))
  const campos = limpiar(cuerpo)
  if ('error' in campos) return NextResponse.json(campos, { status: 400 })
  if (!campos.tipo) return NextResponse.json({ error: 'Falta el tipo de tarjeta' }, { status: 400 })

  // Va al final, para no empujar lo que ya estaba publicado.
  const { data: ultima } = await supabaseAdmin
    .from('tablero_tarjetas').select('orden')
    .eq('company_id', companyId).order('orden', { ascending: false }).limit(1).maybeSingle()

  const { data, error } = await supabaseAdmin
    .from('tablero_tarjetas')
    .insert({
      ...campos,
      company_id: companyId,
      created_by: user?.id ?? null,
      orden: campos.orden ?? ((ultima?.orden ?? 0) + 1),
      activa: campos.activa ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tarjeta: data })
}

/** Guardar cambios de una tarjeta. */
export async function PATCH(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, ...resto } = await req.json().catch(() => ({ id: null }))
  if (!id) return NextResponse.json({ error: 'Falta el identificador' }, { status: 400 })

  const campos = limpiar(resto)
  if ('error' in campos) return NextResponse.json(campos, { status: 400 })

  // Cambiar la imagen deja la anterior ocupando bodega. Se anota antes para
  // borrarla después de que el cambio quede guardado, nunca antes: si la
  // escritura falla, la tarjeta sigue apuntando a una imagen que todavía está.
  let anterior: string | null = null
  if ('imagen_url' in campos) {
    const { data } = await supabaseAdmin
      .from('tablero_tarjetas').select('imagen_url')
      .eq('id', id).eq('company_id', companyId).maybeSingle()
    if (data?.imagen_url && data.imagen_url !== campos.imagen_url) anterior = data.imagen_url
  }

  const { data, error } = await supabaseAdmin
    .from('tablero_tarjetas')
    .update(campos)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (anterior) await borrarImagenDelTablero(anterior)
  return NextResponse.json({ tarjeta: data })
}

/** Reordenar. Llega la lista completa de identificadores en el orden nuevo. */
export async function PUT(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { orden } = await req.json().catch(() => ({ orden: null }))
  if (!Array.isArray(orden)) return NextResponse.json({ error: 'Falta el orden' }, { status: 400 })

  for (let i = 0; i < orden.length; i++) {
    const { error } = await supabaseAdmin
      .from('tablero_tarjetas')
      .update({ orden: i + 1 })
      .eq('id', orden[i])
      .eq('company_id', companyId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, guardadas: orden.length })
}

/** Borrar una tarjeta, y con ella su imagen. */
export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el identificador' }, { status: 400 })

  const { data: antes } = await supabaseAdmin
    .from('tablero_tarjetas').select('imagen_url')
    .eq('id', id).eq('company_id', companyId).maybeSingle()

  const { error } = await supabaseAdmin
    .from('tablero_tarjetas').delete()
    .eq('id', id).eq('company_id', companyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await borrarImagenDelTablero(antes?.imagen_url)
  return NextResponse.json({ ok: true })
}
