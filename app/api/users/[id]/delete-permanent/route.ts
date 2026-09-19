import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getActiveCompanyId } from '@/lib/get-company'

/**
 * Retiro definitivo = anonimización, no borrado físico.
 *
 * Un trabajador está referenciado por certificados, firmas, consentimientos de
 * datos, inscripciones y movimientos de portería. Varias de esas relaciones no
 * admiten quedar sin dueño, y además son registros que SST obliga a conservar.
 * Borrar la fila de users o bien falla o bien arrastra esa evidencia.
 *
 * Lo que se hace: se eliminan los datos personales (nombre, correo, cédula,
 * contraseña, perfiles y fotos), la cuenta queda inactiva sin posibilidad de
 * reactivarse ni de iniciar sesión, y desaparece de Retirados. Los registros
 * históricos quedan asociados a un titular anónimo.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo el superadmin puede retirar definitivamente' }, { status: 403 })
  }

  const companyId = await getActiveCompanyId()
  const { id } = params

  const { data: user } = await supabaseAdmin
    .from('users').select('id, company_id, role, retired_at, purged_at').eq('id', id).maybeSingle()

  if (!user || (companyId && user.company_id !== companyId)) {
    return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
  }
  if (user.role !== 'worker') {
    return NextResponse.json({ error: 'Solo se pueden retirar definitivamente trabajadores' }, { status: 400 })
  }
  if (!user.retired_at) {
    return NextResponse.json({ error: 'Primero hay que retirarlo; el retiro definitivo se hace desde Retirados' }, { status: 409 })
  }
  if (user.purged_at) return NextResponse.json({ success: true })

  // Datos personales accesorios: se eliminan por completo.
  await supabaseAdmin.from('worker_profiles').delete().eq('user_id', id)
  await supabaseAdmin.from('user_groups').delete().eq('user_id', id)
  await supabaseAdmin.from('gatehouse_operators').delete().eq('user_id', id)

  const sufijo = id.slice(0, 8)
  const claveInservible = await bcrypt.hash(randomBytes(32).toString('hex'), 10)

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      name: `TRABAJADOR RETIRADO ${sufijo.toUpperCase()}`,
      email: `retirado-${id}@anonimizado.invalid`,
      cedula: null,
      cargo: null,
      area: '',
      area_id: null,
      password: claveInservible,
      permissions: null,
      reset_token: null,
      reset_token_expires: null,
      active: false,
      purged_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
