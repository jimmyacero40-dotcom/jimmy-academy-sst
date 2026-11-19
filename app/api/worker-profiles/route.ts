import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Todas las columnas, que el tablero de análisis las usa.
  //
  // Sin retirados: quien ya no trabaja aquí no es población, y contarlo
  // desvía todo lo que esta pantalla mide —la completitud, las edades, la
  // distribución por área—. Su ficha no se borra; deja de sumar, que no es lo
  // mismo. `users!inner` obliga a que exista la cuenta, para que el filtro de
  // retiro sí se aplique en vez de dejar pasar las fichas sueltas.
  let q = supabase
    .from('worker_profiles')
    .select('*, users!inner(name, cedula, email, area, retired_at)')
    .is('users.retired_at', null)
    .order('updated_at', { ascending: false })

  if (companyId) q = q.eq('company_id', companyId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
