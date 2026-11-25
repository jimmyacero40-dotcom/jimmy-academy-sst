import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso, getCurrentUser } from '@/lib/get-company'

/**
 * El catálogo de lo que se entrega.
 *
 * Lo define quien entrega, no el programador: hoy es la bebida hidratante de
 * los que fumigan, mañana un respirador o el protector solar. Cada ítem
 * lleva su ficha —norma, talla, proveedor, vida útil, cómo se usa— porque
 * quien pide el EPP necesita saber cuál es, no solo cómo se llama.
 */

const PERIODICIDADES = ['diaria', 'semanal', 'mensual', 'ninguna']
const CATEGORIAS = ['EPP', 'Hidratación', 'Dotación', 'Aseo', 'Otro']

const CAMPOS = `id, nombre, descripcion, referencia, unidad, periodicidad, activo,
  categoria, especificacion, talla, proveedor, vida_util_dias, instrucciones,
  cantidad_sugerida, creado_por_nombre, created_at,
  actualizado_por_nombre, updated_at`

/** Lo que el cliente puede escribir, y cómo se limpia cada cosa. */
function saneado(b: any): Record<string, any> {
  const texto = (v: any, max = 400) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
  const cambios: Record<string, any> = {}

  if (b.nombre !== undefined) cambios.nombre = texto(b.nombre, 120)
  if (b.descripcion !== undefined) cambios.descripcion = texto(b.descripcion, 600)
  if (b.referencia !== undefined) cambios.referencia = texto(b.referencia, 200)
  if (b.especificacion !== undefined) cambios.especificacion = texto(b.especificacion, 300)
  if (b.talla !== undefined) cambios.talla = texto(b.talla, 60)
  if (b.proveedor !== undefined) cambios.proveedor = texto(b.proveedor, 160)
  if (b.instrucciones !== undefined) cambios.instrucciones = texto(b.instrucciones, 1200)
  if (typeof b.unidad === 'string' && b.unidad.trim()) cambios.unidad = b.unidad.trim().slice(0, 40)
  if (PERIODICIDADES.includes(b.periodicidad)) cambios.periodicidad = b.periodicidad
  if (CATEGORIAS.includes(b.categoria)) cambios.categoria = b.categoria

  // Números: en blanco es «no aplica», no cero.
  if (b.vida_util_dias !== undefined) {
    const n = Number(b.vida_util_dias)
    cambios.vida_util_dias = Number.isFinite(n) && n > 0 ? Math.round(n) : null
  }
  if (b.cantidad_sugerida !== undefined) {
    const n = Number(b.cantidad_sugerida)
    cambios.cantidad_sugerida = Number.isFinite(n) && n > 0 ? n : 1
  }
  if (typeof b.activo === 'boolean') cambios.activo = b.activo

  return cambios
}

export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.ver', 'sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let q = supabase
    .from('entrega_tipos')
    .select(CAMPOS)
    .order('activo', { ascending: false })
    .order('nombre')
  if (companyId) q = q.eq('company_id', companyId)

  // Por defecto solo lo que está en uso; con ?todos=1 también lo archivado.
  if (req.nextUrl.searchParams.get('todos') !== '1') q = q.eq('activo', true)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cuántas entregas tiene detrás cada ítem: con eso la pantalla sabe si se
  // puede borrar o si solo se puede archivar.
  const ids = (data ?? []).map((t: any) => t.id)
  const usos: Record<string, number> = {}
  if (ids.length) {
    const { data: filas } = await supabase
      .from('entregas').select('tipo_id').in('tipo_id', ids)
    for (const f of filas ?? []) usos[f.tipo_id] = (usos[f.tipo_id] ?? 0) + 1
  }

  return NextResponse.json((data ?? []).map((t: any) => ({ ...t, entregas: usos[t.id] ?? 0 })))
}

export async function POST(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const cambios = saneado(b)
  if (!cambios.nombre) return NextResponse.json({ error: 'Escriba el nombre del ítem' }, { status: 400 })

  const quien = await getCurrentUser()
  const { data, error } = await supabase
    .from('entrega_tipos')
    .insert({
      ...cambios,
      company_id: companyId,
      unidad: cambios.unidad ?? 'unidad',
      periodicidad: cambios.periodicidad ?? 'ninguna',
      creado_por: quien?.id ?? null,
      creado_por_nombre: quien?.name ?? null,
    })
    .select(CAMPOS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, entregas: 0 }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  if (!b.id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const cambios = saneado(b)
  if (b.nombre !== undefined && !cambios.nombre) {
    return NextResponse.json({ error: 'El nombre no puede quedar vacío' }, { status: 400 })
  }

  const quien = await getCurrentUser()
  cambios.actualizado_por = quien?.id ?? null
  cambios.actualizado_por_nombre = quien?.name ?? null
  cambios.updated_at = new Date().toISOString()

  let q = supabase.from('entrega_tipos').update(cambios).eq('id', b.id)
  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q.select(CAMPOS).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await supabase
    .from('entregas').select('id', { count: 'exact', head: true }).eq('tipo_id', b.id)

  return NextResponse.json({ ...data, entregas: count ?? 0 })
}

/**
 * Borrar un ítem del catálogo.
 *
 * Solo si nunca se entregó: borrarlo con entregas detrás se llevaría por
 * delante la constancia de que esa persona lo recibió. Lo que ya tiene
 * historia se archiva, que es dejar de ofrecerlo sin borrar nada.
 */
export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { count } = await supabase
    .from('entregas').select('id', { count: 'exact', head: true }).eq('tipo_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({
      error: `Ese ítem ya se entregó ${count} ${count === 1 ? 'vez' : 'veces'}. `
        + 'Archívelo en vez de borrarlo: así deja de ofrecerse y la constancia de quienes lo '
        + 'recibieron se conserva.',
    }, { status: 409 })
  }

  let q = supabase.from('entrega_tipos').delete().eq('id', id)
  if (companyId) q = q.eq('company_id', companyId)

  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
