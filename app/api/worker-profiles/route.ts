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

  // La firma vive en su propia tabla, no en la ficha. Se trae aquí para que la
  // completitud la tenga en cuenta y para que la hoja de vida la muestre: sin
  // esto, una ficha llegaba al 100 % sin que la persona hubiera firmado nunca.
  const ids = (data ?? []).map((p: any) => p.user_id).filter(Boolean)
  const firmaDe: Record<string, string> = {}
  if (ids.length) {
    const { data: firmas } = await supabase
      .from('signatures').select('user_id, signature_data').in('user_id', ids)
    for (const f of firmas ?? []) if (f.signature_data) firmaDe[f.user_id] = f.signature_data
  }

  return NextResponse.json((data ?? []).map((p: any) => ({
    ...p,
    firma_electronica: firmaDe[p.user_id] ?? null,
  })))
}
