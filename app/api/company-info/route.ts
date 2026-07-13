import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

const FIELDS = [
  'name', 'nit', 'logo_url', 'color',
  'correo', 'telefono', 'ciudad', 'sector',
  'responsable_nombre', 'responsable_cargo', 'responsable_email', 'responsable_licencia',
]

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({})

  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({})

  const { data } = await supabase
    .from('companies')
    .select(FIELDS.join(', '))
    .eq('id', companyId)
    .single()

  return NextResponse.json(data ?? {})
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const body = await req.json()
  const allowed: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (FIELDS.includes(k)) allowed[k] = v === '' ? null : v
  }

  if (Object.keys(allowed).length === 0)
    return NextResponse.json({ error: 'Sin campos válidos' }, { status: 400 })

  const { data, error } = await supabase
    .from('companies')
    .update(allowed)
    .eq('id', companyId)
    .select(FIELDS.join(', '))
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
