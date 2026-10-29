import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()

  let query = supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * Número del certificado.
 *
 * Antes lo armaba el navegador como AVC-{año}-{MMDD}-{idCurso}, sin nada de la
 * persona, y la columna es única: el primero que terminaba un curso en el día
 * se quedaba con el número y a los demás les reventaba la inserción. Como el
 * error se tragaba en silencio, perdían el certificado Y el avance.
 *
 * Ahora lo asigna el servidor, con un consecutivo dentro del día, y se
 * reintenta si dos personas terminan a la vez.
 */
async function siguienteCodigo(trainingId: number, intento: number): Promise<string> {
  const hoy = new Date()
  const prefijo = `AVC-${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}-${String(trainingId).padStart(3, '0')}`

  const { count } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .like('code', `${prefijo}%`)

  return `${prefijo}-${String((count ?? 0) + 1 + intento).padStart(3, '0')}`
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()

  const body = await req.json()
  const { name, cedula, course, issued, expires, duration, score } = body
  const trainingId = Number(body.training_id) || 0

  if (!name || !course) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Repetir la capacitación no emite un certificado nuevo: se devuelve el que
  // ya tiene. Antes cada intento trataba de insertar otra fila.
  const { data: yaTiene } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('course', course)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle()

  let data = yaTiene
  if (!data) {
    // Dos personas pueden terminar en el mismo instante y pedir el mismo
    // consecutivo. Se reintenta en vez de darle el fallo a quien estudió.
    let error: any = null
    for (let intento = 0; intento < 5 && !data; intento++) {
      const codigo = await siguienteCodigo(trainingId, intento)
      const r = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          company_id: companyId,
          code: codigo,
          name,
          cedula: cedula || '',
          course,
          issued,
          expires,
          duration: duration || '8 horas',
          score: score || '100%',
        })
        .select()
        .single()
      data = r.data
      error = r.error
      // 23505 = clave duplicada. Cualquier otro error no se reintenta.
      if (error && error.code !== '23505') break
    }
    if (!data) return NextResponse.json({ error: error?.message ?? 'No fue posible emitir el certificado' }, { status: 500 })
  }

  // Auto-complete any open enrollment for this user+training
  const numericScore = score ? parseInt(String(score).replace('%', ''), 10) : null
  await supabase
    .from('enrollments')
    .update({ status: 'completed', completed_at: new Date().toISOString(), score: numericScore })
    .eq('user_id', user.id)
    .eq('training_id', trainingId)
    .in('status', ['pending', 'in_progress'])

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const companyId = await getActiveCompanyId()
  let query = supabase.from('certificates').delete().eq('id', id)
  if (companyId) query = query.eq('company_id', companyId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
