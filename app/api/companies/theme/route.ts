import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper, getActiveCompanyId } from '@/lib/get-company'

const VALID_THEMES = ['dark', 'light', 'navy', 'verde', 'academy']

export async function PATCH(req: NextRequest) {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const { theme } = await req.json()
  if (!theme || !VALID_THEMES.includes(theme)) {
    return NextResponse.json({ error: 'Tema inválido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('companies')
    .update({ color: theme })
    .eq('id', companyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, theme })
}
