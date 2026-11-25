import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser } from '@/lib/get-company'

/**
 * Lo que le han entregado al trabajador, y su confirmación.
 *
 * Sin esto la trazabilidad era a medias: quedaba escrito que se entregó,
 * pero no que la persona lo recibió. El formato en papel lo resolvía con la
 * firma en el recuadro; aquí lo resuelve el propio trabajador.
 *
 * Nadie confirma por otro: la ruta solo toca las entregas de quien pregunta.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('entregas')
    .select('id, cantidad, referencia, entregado_at, entregado_por_nombre, observacion, confirmado_at, entrega_tipos(nombre, unidad)')
    .eq('user_id', user.id)
    .order('entregado_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []).map((e: any) => ({
    id: e.id,
    elemento: e.entrega_tipos?.nombre ?? 'Elemento',
    unidad: e.entrega_tipos?.unidad ?? 'unidad',
    cantidad: Number(e.cantidad),
    referencia: e.referencia,
    entregado_at: e.entregado_at,
    entregado_por_nombre: e.entregado_por_nombre,
    observacion: e.observacion,
    confirmado_at: e.confirmado_at,
  })))
}

/** El trabajador confirma que lo recibió. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(b.ids) ? b.ids.filter(Boolean).slice(0, 100) : []
  if (!ids.length) return NextResponse.json({ error: 'No se indicó qué confirmar' }, { status: 400 })

  // Acotado a lo suyo y a lo que no esté confirmado: confirmar dos veces no
  // puede reescribir la fecha de la primera vez, que es la que vale.
  const { data, error } = await supabase
    .from('entregas')
    .update({
      confirmado_at: new Date().toISOString(),
      confirmado_nota: typeof b.nota === 'string' && b.nota.trim() ? b.nota.trim().slice(0, 300) : null,
    })
    .in('id', ids)
    .eq('user_id', user.id)
    .is('confirmado_at', null)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ confirmadas: data?.length ?? 0 })
}
