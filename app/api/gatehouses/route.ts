import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'

// GET — list gatehouses (admin: all; portero: only assigned)
export async function GET() {
  const { authorized, user, companyId, isAdmin } = await requierePermiso('accesos.ver', 'accesos.ingreso', 'accesos.salida', 'accesos.sedes')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  if (isAdmin) {
    // Admin sees all gatehouses for the company
    const { data, error } = await supabaseAdmin
      .from('gatehouses')
      .select(`
        id, name, location, description, is_active, created_at, updated_at,
        gatehouse_operators(user_id, users!gatehouse_operators_user_id_fkey(id, name, email, role))
      `)
      .eq('company_id', companyId)
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Portero: only assigned gatehouses
  const { data: ops } = await supabaseAdmin
    .from('gatehouse_operators')
    .select('gatehouse_id, gatehouses(id, name, location, description, is_active, company_id)')
    .eq('user_id', user.id)

  const gatehouses = (ops ?? [])
    .map((o: any) => o.gatehouses)
    .filter((g: any) => g && g.company_id === companyId && g.is_active)

  return NextResponse.json(gatehouses)
}

// POST — create gatehouse (admin only)
export async function POST(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('accesos.sedes')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { name, location, description, is_active } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('gatehouses')
    .insert({ company_id: companyId, name: name.trim(), location: location || null, description: description || null, is_active: is_active ?? true })
    .select('id, name, location, description, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
