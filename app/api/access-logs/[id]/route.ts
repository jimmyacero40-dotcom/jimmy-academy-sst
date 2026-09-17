import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isOperatorOrAdmin } from '@/lib/get-company'

// PATCH — registrar salida
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, user, companyId } = await isOperatorOrAdmin()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: log } = await supabaseAdmin
    .from('access_logs')
    .select('id, company_id, exit_time')
    .eq('id', params.id)
    .single()

  if (!log) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
  if (log.company_id !== companyId) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  if (log.exit_time) return NextResponse.json({ error: 'Salida ya registrada' }, { status: 409 })

  const { data, error } = await supabaseAdmin
    .from('access_logs')
    .update({ exit_time: new Date().toISOString(), exit_by: user.id })
    .eq('id', params.id)
    .select('id, exit_time')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
