import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper, getCurrentUser } from '@/lib/get-company'

/**
 * Las firmas que se pueden anexar al pie de una lista de asistencia.
 *
 * Solo las ve y las administra quien puede generar listas: la rúbrica de una
 * persona no es un dato que deba circular por el portal del trabajador.
 */
export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let q = supabase
    .from('firmas_capacitador')
    .select('id, nombre, cargo, imagen, created_at')
    .order('created_at')

  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { nombre, cargo, imagen } = await req.json()
  if (!nombre || !imagen) {
    return NextResponse.json({ error: 'Hacen falta el nombre y la imagen de la firma' }, { status: 400 })
  }
  if (!/^data:image\/(png|jpe?g);base64,/.test(imagen)) {
    return NextResponse.json({ error: 'La firma debe ser una imagen PNG o JPG' }, { status: 400 })
  }
  // Medio mega de data URL ya es una firma escaneada enorme; más que eso solo
  // engorda el PDF y la base.
  if (imagen.length > 700_000) {
    return NextResponse.json({ error: 'La imagen pesa demasiado; use una más pequeña' }, { status: 400 })
  }

  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('firmas_capacitador')
    .insert({
      company_id: companyId,
      nombre: String(nombre).trim(),
      cargo: cargo ? String(cargo).trim() : null,
      imagen,
      creada_por: user?.id ?? null,
    })
    .select('id, nombre, cargo, imagen, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  let q = supabase.from('firmas_capacitador').delete().eq('id', id)
  if (companyId) q = q.eq('company_id', companyId)

  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
