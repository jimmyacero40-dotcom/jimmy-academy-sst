import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso, getCurrentUser } from '@/lib/get-company'

/**
 * Qué se entrega.
 *
 * Lo define quien entrega, no el programador: hoy es la bebida hidratante de
 * los que fumigan, mañana un respirador o el protector solar. Por eso el tipo
 * es un dato y no una lista fija en el código.
 */

const PERIODICIDADES = ['diaria', 'semanal', 'mensual', 'ninguna']

export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.ver', 'sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let q = supabase
    .from('entrega_tipos')
    .select('id, nombre, descripcion, referencia, unidad, periodicidad, activo, created_at')
    .order('activo', { ascending: false })
    .order('nombre')
  if (companyId) q = q.eq('company_id', companyId)

  // Por defecto solo lo que está en uso; con ?todos=1 también lo archivado.
  if (req.nextUrl.searchParams.get('todos') !== '1') q = q.eq('activo', true)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const nombre = String(b.nombre ?? '').trim()
  if (!nombre) return NextResponse.json({ error: 'Escriba qué se entrega' }, { status: 400 })

  const quien = await getCurrentUser()
  const { data, error } = await supabase
    .from('entrega_tipos')
    .insert({
      company_id: companyId,
      nombre,
      descripcion: String(b.descripcion ?? '').trim() || null,
      referencia: String(b.referencia ?? '').trim() || null,
      unidad: String(b.unidad ?? '').trim() || 'unidad',
      periodicidad: PERIODICIDADES.includes(b.periodicidad) ? b.periodicidad : 'ninguna',
      creado_por: quien?.id ?? null,
    })
    .select('id, nombre, descripcion, referencia, unidad, periodicidad, activo, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('sst.entregas.registrar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  if (!b.id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const cambios: Record<string, any> = { updated_at: new Date().toISOString() }
  if (typeof b.nombre === 'string') {
    if (!b.nombre.trim()) return NextResponse.json({ error: 'El nombre no puede quedar vacío' }, { status: 400 })
    cambios.nombre = b.nombre.trim()
  }
  if (b.descripcion !== undefined) cambios.descripcion = String(b.descripcion ?? '').trim() || null
  if (b.referencia !== undefined) cambios.referencia = String(b.referencia ?? '').trim() || null
  if (typeof b.unidad === 'string' && b.unidad.trim()) cambios.unidad = b.unidad.trim()
  if (PERIODICIDADES.includes(b.periodicidad)) cambios.periodicidad = b.periodicidad
  // No se borra lo que ya tiene entregas detrás: se archiva, y el histórico
  // sigue pudiéndose consultar.
  if (typeof b.activo === 'boolean') cambios.activo = b.activo

  let q = supabase.from('entrega_tipos').update(cambios).eq('id', b.id)
  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q
    .select('id, nombre, descripcion, referencia, unidad, periodicidad, activo, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
