import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'

// ─── Asignar una capacitación a personas concretas ────────────────────
// Vía corta a lo que ya hacían los Perfiles de Formación: en vez de armar un
// perfil, elegir el curso, las personas y el mes.
//
// Se apoya en el modelo que ya existe -plan del año → ítem del mes → a quién
// va → inscripción- y no en una tabla aparte, para que lo asignado así
// aparezca en el Plan Anual y en la ficha del trabajador como cualquier otra
// capacitación, y se le pueda sacar lista de asistencia igual.
// ──────────────────────────────────────────────────────────────────────

/** Último día del mes, armado como texto para no pasar por UTC. */
function finDeMes(anio: number, mes: number): string {
  const d = new Date(anio, mes, 0)
  return `${anio}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  // Asignar formación es gestionar formación: no hace falta ser administrador
  // de la plataforma, basta con tener esa capacidad.
  const { authorized, user, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso para asignar capacitaciones' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const body = await req.json()
  const trainingId = Number(body.training_id)
  const userIds: string[] = Array.isArray(body.user_ids) ? [...new Set(body.user_ids)] as string[] : []
  const mes = Number(body.month)
  const fecha: string | null = body.scheduled_date || null
  const modalidad: string = body.modalidad || 'presencial'
  const responsable: string | null = body.responsable?.trim() || null

  if (!trainingId) return NextResponse.json({ error: 'Elige una capacitación' }, { status: 400 })
  if (!userIds.length) return NextResponse.json({ error: 'Elige al menos una persona' }, { status: 400 })
  if (!(mes >= 1 && mes <= 12)) return NextResponse.json({ error: 'Elige el mes' }, { status: 400 })

  // ── El curso tiene que ser de la empresa ──
  const { data: curso } = await supabase
    .from('trainings').select('id, title, company_id').eq('id', trainingId).maybeSingle()
  if (!curso || (curso.company_id && curso.company_id !== companyId)) {
    return NextResponse.json({ error: 'Capacitación no encontrada' }, { status: 404 })
  }

  // ── Las personas también, y solo las activas ──
  const { data: personas } = await supabase
    .from('users').select('id')
    .in('id', userIds).eq('company_id', companyId).eq('active', true).is('retired_at', null)
  const idsValidos = (personas ?? []).map(p => p.id)
  if (!idsValidos.length) {
    return NextResponse.json({ error: 'Ninguna de las personas elegidas está activa en esta empresa' }, { status: 400 })
  }

  // ── Plan del año ──
  // Se engancha al plan vigente. Si la empresa todavía no tiene uno para este
  // año, se crea activo: la asignación es una decisión ya tomada, no un
  // borrador que alguien tenga que activar después para que surta efecto.
  const anio = new Date().getFullYear()
  let { data: plan } = await supabase
    .from('annual_plans').select('id, year, status')
    .eq('company_id', companyId).eq('year', anio)
    .order('status', { ascending: true })
    .limit(1).maybeSingle()

  if (!plan) {
    const { data: nuevo, error: ePlan } = await supabase
      .from('annual_plans')
      .insert({ name: `PLAN SST ${anio}`, year: anio, status: 'active', company_id: companyId })
      .select('id, year, status').single()
    if (ePlan) return NextResponse.json({ error: ePlan.message }, { status: 500 })
    plan = nuevo
  }

  // ── Ítem del mes para ese curso ──
  // Si el curso ya está programado ese mes se reutiliza, para no partir en dos
  // la misma capacitación dentro del Plan Anual.
  let { data: item } = await supabase
    .from('plan_items').select('id, origen')
    .eq('plan_id', plan!.id).eq('training_id', trainingId).eq('month', mes)
    .limit(1).maybeSingle()

  let itemCreado = false
  if (!item) {
    const { data: nuevo, error: eItem } = await supabase
      .from('plan_items')
      .insert({
        plan_id: plan!.id,
        training_id: trainingId,
        month: mes,
        scheduled_date: fecha,
        modalidad,
        estado: 'programada',
        periodicity: 'once',
        required: true,
        origen: 'asignacion_directa',
        observaciones: responsable ? `Responsable: ${responsable}` : null,
      })
      .select('id, origen').single()
    if (eItem) return NextResponse.json({ error: eItem.message }, { status: 500 })
    item = nuevo
    itemCreado = true
  } else if (fecha) {
    await supabase.from('plan_items').update({ scheduled_date: fecha, modalidad }).eq('id', item.id)
  }

  // ── A quiénes va ──
  // Queda escrito que fue nominal, no "a toda la empresa".
  const { error: eTargets } = await supabase.from('plan_item_targets').upsert(
    idsValidos.map(id => ({ plan_item_id: item!.id, target_type: 'user', target_id: id })),
    { onConflict: 'plan_item_id,target_type,target_id', ignoreDuplicates: true },
  )
  if (eTargets) return NextResponse.json({ error: eTargets.message }, { status: 500 })

  // ── Las inscripciones, en un solo lote ──
  // `ignoreDuplicates` se apoya en el índice único que ya existe: reasignar a
  // alguien que ya la tenía no la duplica ni le pisa el avance.
  const { data: insertadas, error: eIns } = await supabase
    .from('enrollments')
    .upsert(
      idsValidos.map(id => ({
        user_id: id,
        training_id: trainingId,
        plan_item_id: item!.id,
        company_id: companyId,
        status: 'pending',
        due_date: fecha || finDeMes(plan!.year, mes),
      })),
      { onConflict: 'user_id,training_id,plan_item_id', ignoreDuplicates: true },
    )
    .select('id, user_id')

  if (eIns) return NextResponse.json({ error: eIns.message }, { status: 500 })

  const asignadas = insertadas?.length ?? 0
  return NextResponse.json({
    asignadas,
    yaLaTenian: idsValidos.length - asignadas,
    descartadas: userIds.length - idsValidos.length,
    curso: curso.title,
    plan_id: plan!.id,
    plan_item_id: item!.id,
    item_creado: itemCreado,
    asignado_por: user?.name ?? null,
  }, { status: 201 })
}

// ─── Retirar una capacitación asignada ────────────────────────────────
// Para cuando se asignó por equivocación o a quien no era.
//
// Solo se retira lo que está pendiente o en curso. Lo ya completado no se
// toca: esa persona hizo la capacitación, y su certificado y su constancia
// son el soporte del SG-SST. Si de verdad hay que borrar un historial, se
// hace desde Certificados, a conciencia y no de paso.
export async function DELETE(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso para retirar capacitaciones' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const body = await req.json()
  const trainingId = Number(body.training_id)
  const userIds: string[] = Array.isArray(body.user_ids) ? body.user_ids : []
  if (!trainingId || !userIds.length) {
    return NextResponse.json({ error: 'Falta la capacitación o las personas' }, { status: 400 })
  }

  // Qué se puede retirar y qué no, antes de tocar nada.
  const { data: inscripciones } = await supabase
    .from('enrollments')
    .select('id, user_id, status, plan_item_id')
    .eq('training_id', trainingId)
    .eq('company_id', companyId)
    .in('user_id', userIds)

  const retirables = (inscripciones ?? []).filter(e => e.status === 'pending' || e.status === 'in_progress')
  const completadas = (inscripciones ?? []).filter(e => e.status === 'completed')

  if (retirables.length) {
    const { error } = await supabase.from('enrollments').delete().in('id', retirables.map(e => e.id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // También deja de figurar como destinatario del ítem del plan: si no, al
    // activar el plan se le volvería a asignar lo que se acaba de retirar.
    const items = [...new Set(retirables.map(e => e.plan_item_id).filter(Boolean))] as string[]
    if (items.length) {
      await supabase.from('plan_item_targets').delete()
        .in('plan_item_id', items).eq('target_type', 'user')
        .in('target_id', retirables.map(e => e.user_id))
    }
  }

  return NextResponse.json({
    retiradas: retirables.length,
    conservadas: completadas.length,
    noTenian: userIds.length - (inscripciones ?? []).length,
  })
}

// ─── Quién ya tiene una capacitación este año ─────────────────────────
// Para pintar en gris a quien no hay que volver a asignar.
export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = Number(new URL(req.url).searchParams.get('training_id'))
  if (!trainingId) return NextResponse.json([])

  const anio = new Date().getFullYear()
  const { data, error } = await supabase
    .from('enrollments')
    .select('user_id, status, created_at, due_date')
    .eq('training_id', trainingId)
    .eq('company_id', companyId)
    .gte('created_at', `${anio}-01-01`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
