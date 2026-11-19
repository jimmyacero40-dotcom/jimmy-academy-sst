import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'

// POST — retire or reactivate a worker
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('personal.retirar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const action: 'retire' | 'reactivate' = body.action

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, company_id, role, purged_at')
    .eq('id', params.id)
    .single()

  if (!user || user.company_id !== companyId) {
    return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
  }
  if (user.purged_at) {
    return NextResponse.json({ error: 'Este trabajador fue retirado definitivamente y sus datos se eliminaron' }, { status: 409 })
  }

  if (action === 'retire') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ active: false, retired_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'retired' })
  }

  if (action === 'reactivate') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ active: true, retired_at: null })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'reactivated' })
  }

  return NextResponse.json({ error: 'action debe ser retire o reactivate' }, { status: 400 })
}

/**
 * PATCH — corregir la fecha de retiro.
 *
 * Casi nunca se retira a alguien el mismo día que se fue: el aviso llega
 * después. La fecha que queda es la del clic, no la real, y de esa fecha
 * dependen los informes de rotación. Aquí se corrige.
 *
 * Se guarda al mediodía de Colombia para que la fecha escrita sea la que se
 * ve: guardar la medianoche en UTC devuelve el día anterior.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('personal.retirar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { retired_at } = await req.json()
  if (typeof retired_at !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(retired_at)) {
    return NextResponse.json({ error: 'Escriba la fecha como AAAA-MM-DD' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, company_id, retired_at, purged_at, created_at')
    .eq('id', params.id)
    .single()

  if (!user || user.company_id !== companyId) {
    return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
  }
  if (user.purged_at) {
    return NextResponse.json({ error: 'Este trabajador fue retirado definitivamente' }, { status: 409 })
  }
  if (!user.retired_at) {
    return NextResponse.json({ error: 'Este trabajador no está retirado' }, { status: 409 })
  }

  // Nadie se retira antes de entrar, ni en el futuro: eso no es una corrección,
  // es un error de dedo que después nadie sabe explicar en un informe.
  const nueva = `${retired_at}T12:00:00-05:00`
  if (user.created_at && new Date(nueva) < new Date(user.created_at)) {
    return NextResponse.json({ error: 'El retiro no puede ser anterior al ingreso' }, { status: 400 })
  }
  if (new Date(nueva).getTime() > Date.now() + 86400000) {
    return NextResponse.json({ error: 'La fecha de retiro no puede ser futura' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ retired_at: new Date(nueva).toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, retired_at: new Date(nueva).toISOString() })
}
