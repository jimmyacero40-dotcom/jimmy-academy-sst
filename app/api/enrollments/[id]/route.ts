import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser } from '@/lib/get-company'

/**
 * Actualiza una inscripción: arrancarla, guardar por dónde va o terminarla.
 *
 * El progreso se guarda aparte del estado porque llega muchas veces —una por
 * diapositiva— mientras que el estado cambia dos veces en todo el curso.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { status, score, progreso, progreso_total } = await req.json()
  const updates: Record<string, any> = {}

  if (status) {
    updates.status = status
    if (status === 'in_progress') {
      // Solo la primera vez: `started_at` es cuándo empezó, no cuándo volvió a
      // entrar. La versión anterior preguntaba por un campo que acababa de
      // crear, así que siempre daba vacío y la fecha se reescribía en cada
      // visita.
      const { data: antes } = await supabase
        .from('enrollments').select('started_at').eq('id', params.id).maybeSingle()
      if (!antes?.started_at) updates.started_at = new Date().toISOString()
    }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
      if (score !== undefined) updates.score = score
    }
  }

  if (progreso !== undefined) {
    const n = Number(progreso)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'Progreso inválido' }, { status: 400 })
    }
    updates.progreso = Math.round(n)
    updates.progreso_at = new Date().toISOString()
    if (progreso_total !== undefined) updates.progreso_total = Math.round(Number(progreso_total)) || null
    // Guardar progreso es, por sí solo, prueba de que empezó. Sin esto una
    // capacitación a medias seguía figurando como pendiente.
    if (!status) updates.status = 'in_progress'
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  // El trabajador solo toca lo suyo.
  let query = supabase.from('enrollments').update(updates).eq('id', params.id)
  if (user.role === 'worker') query = query.eq('user_id', user.id)

  const { data, error } = await query
    .select('id, status, score, completed_at, progreso, progreso_total')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
