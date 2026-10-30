import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { anotar } from '@/lib/auditoria-plan'
import { enviarCorreo, correoConfigurado, plantillaCapacitacion } from '@/lib/correo'

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

/**
 * Deja la lista de asignados de un ítem del plan igual a `idsValidos`.
 *
 * Con `reemplazar`, a quien se desmarcó se le quita -salvo que ya la haya
 * completado: esa persona la hizo y su constancia es soporte del SG-SST-.
 * Sin `reemplazar` solo se agrega, que es lo que hace el asistente de siempre.
 */
/**
 * Avisa a quienes acaban de quedar asignados. Solo a los nuevos: a quien ya
 * estaba no se le vuelve a escribir por haber tocado la lista.
 *
 * Nunca tumba la asignación. Si el correo falla, la persona queda asignada
 * igual y el motivo se guarda en su inscripción, que es donde la pantalla lo
 * muestra.
 */
async function avisarDeNuevas(
  enrollmentIds: string[], itemId: string | null, trainingId: number,
): Promise<{ enviados: number; fallos: { nombre: string; motivo: string }[] }> {
  if (!enrollmentIds.length) return { enviados: 0, fallos: [] }

  const [{ data: filas }, { data: curso }, { data: item }] = await Promise.all([
    supabase.from('enrollments')
      .select('id, due_date, users(name, correo)').in('id', enrollmentIds),
    supabase.from('trainings').select('title, duration').eq('id', trainingId).maybeSingle(),
    itemId
      ? supabase.from('plan_items').select('scheduled_date, modalidad').eq('id', itemId).maybeSingle()
      : Promise.resolve({ data: null as any }),
  ])

  let enviados = 0
  const fallos: { nombre: string; motivo: string }[] = []
  for (const f of (filas ?? []) as any[]) {
    const { asunto, html } = plantillaCapacitacion({
      nombre: f.users?.name ?? '',
      curso: curso?.title ?? 'Capacitación',
      fecha: item?.scheduled_date ?? f.due_date ?? null,
      duracion: curso?.duration ?? null,
      modalidad: item?.modalidad ?? null,
    })
    const r = await enviarCorreo(f.users?.correo ?? '', asunto, html)
    if (r.enviado) enviados++
    else fallos.push({ nombre: f.users?.name ?? '', motivo: r.motivo ?? 'No se pudo enviar' })
    await supabase.from('enrollments').update({
      notificado_at: r.enviado ? new Date().toISOString() : null,
      notificacion_error: r.enviado ? null : (r.motivo ?? 'No se pudo enviar'),
    }).eq('id', f.id)
  }
  return { enviados, fallos }
}

async function sincronizar(
  itemId: string, trainingId: number, companyId: string,
  idsValidos: string[], pedidos: string[], vence: string,
  reemplazar: boolean, titulo: string, porQuien: string | null,
  notificar: boolean,
) {
  const { data: actuales } = await supabase
    .from('enrollments').select('id, user_id, status').eq('plan_item_id', itemId)

  const deseados = new Set(idsValidos)
  const sobran = (actuales ?? []).filter(e =>
    !deseados.has(e.user_id) && (e.status === 'pending' || e.status === 'in_progress'))
  const conservadas = (actuales ?? []).filter(e => !deseados.has(e.user_id) && e.status === 'completed')

  if (reemplazar && sobran.length) {
    const { error } = await supabase.from('enrollments').delete().in('id', sobran.map(e => e.id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('plan_item_targets').delete()
      .eq('plan_item_id', itemId).eq('target_type', 'user')
      .in('target_id', sobran.map(e => e.user_id))
  }

  let asignadas = 0
  let nuevas: string[] = []
  if (idsValidos.length) {
    const { error: eTargets } = await supabase.from('plan_item_targets').upsert(
      idsValidos.map(id => ({ plan_item_id: itemId, target_type: 'user', target_id: id })),
      { onConflict: 'plan_item_id,target_type,target_id', ignoreDuplicates: true },
    )
    if (eTargets) return NextResponse.json({ error: eTargets.message }, { status: 500 })

    const { data: insertadas, error: eIns } = await supabase
      .from('enrollments')
      .upsert(
        idsValidos.map(id => ({
          user_id: id, training_id: trainingId, plan_item_id: itemId,
          company_id: companyId, status: 'pending', due_date: vence,
        })),
        { onConflict: 'user_id,training_id,plan_item_id', ignoreDuplicates: true },
      )
      .select('id')
    if (eIns) return NextResponse.json({ error: eIns.message }, { status: 500 })
    asignadas = insertadas?.length ?? 0
    nuevas = (insertadas ?? []).map((e: any) => e.id)
  }

  const correos = notificar
    ? await avisarDeNuevas(nuevas, itemId, trainingId)
    : null

  return NextResponse.json({
    asignadas,
    correos,
    retiradas: reemplazar ? sobran.length : 0,
    conservadas: reemplazar ? conservadas.length : 0,
    yaLaTenian: idsValidos.length - asignadas,
    descartadas: pedidos.length - idsValidos.length,
    total: idsValidos.length,
    curso: titulo,
    plan_item_id: itemId,
    asignado_por: porQuien,
  }, { status: 201 })
}

export async function POST(req: NextRequest) {
  // Asignar formación es gestionar formación: no hace falta ser administrador
  // de la plataforma, basta con tener esa capacidad.
  const { authorized, user, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso para asignar capacitaciones' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const body = await req.json()
  const userIds: string[] = Array.isArray(body.user_ids) ? [...new Set(body.user_ids)] as string[] : []
  const fecha: string | null = body.scheduled_date || null
  const modalidad: string = body.modalidad || 'presencial'
  const responsable: string | null = body.responsable?.trim() || null

  // ── Asignar sobre una capacitación que ya está en el calendario ──
  // Cuando se abre desde el Plan Anual ya se sabe cuál es y qué día: no hay
  // que volver a elegir el curso ni el mes, y lo asignado tiene que quedar
  // colgando de ese mismo ítem y no de uno nuevo.
  const planItemId: string | null = body.plan_item_id || null
  let itemDelPlan: any = null
  if (planItemId) {
    const { data } = await supabase
      .from('plan_items')
      .select('id, month, training_id, scheduled_date, modalidad, annual_plans!inner(id, year, company_id)')
      .eq('id', planItemId).maybeSingle()
    if (!data || (data.annual_plans as any).company_id !== companyId) {
      return NextResponse.json({ error: 'Capacitación del plan no encontrada' }, { status: 404 })
    }
    itemDelPlan = data
  }

  const trainingId = itemDelPlan ? Number(itemDelPlan.training_id) : Number(body.training_id)
  // La fecha manda sobre el mes: si se corre la capacitación al 3 de marzo,
  // el mes del plan tiene que irse con ella.
  const mes = fecha
    ? Number(fecha.slice(5, 7))
    : itemDelPlan ? Number(itemDelPlan.month) : Number(body.month)

  if (!trainingId) return NextResponse.json({ error: 'Elige una capacitación' }, { status: 400 })
  if (!(mes >= 1 && mes <= 12)) return NextResponse.json({ error: 'Elige el mes' }, { status: 400 })
  // Sincronizando se admite la lista vacía: es quitar a todo el mundo.
  if (!userIds.length && !body.sincronizar) {
    return NextResponse.json({ error: 'Elige al menos una persona' }, { status: 400 })
  }

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
  if (!idsValidos.length && !body.sincronizar) {
    return NextResponse.json({ error: 'Ninguna de las personas elegidas está activa en esta empresa' }, { status: 400 })
  }

  // ── Sobre un ítem que ya existe: ese es el destino, no hay que buscar ──
  if (itemDelPlan) {
    // Si se cambió la fecha, la capacitación se mueve en el calendario -y de
    // mes si hace falta-, porque el plan y lo asignado no pueden decir cosas
    // distintas sobre el mismo día.
    if (fecha && fecha !== itemDelPlan.scheduled_date) {
      const { error } = await supabase.from('plan_items')
        .update({ scheduled_date: fecha, month: mes }).eq('id', itemDelPlan.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      // Las inscripciones que ya existían vencen el día de la capacitación.
      await supabase.from('enrollments').update({ due_date: fecha })
        .eq('plan_item_id', itemDelPlan.id).neq('status', 'completed')
    }
    return sincronizar(itemDelPlan.id, trainingId, companyId!, idsValidos, userIds,
      fecha || itemDelPlan.scheduled_date || finDeMes((itemDelPlan.annual_plans as any).year, mes),
      body.sincronizar === true, curso.title, user?.name ?? null,
      body.notificar === true)
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
  const correos = body.notificar === true
    ? await avisarDeNuevas((insertadas ?? []).map((e: any) => e.id), item!.id, trainingId)
    : null

  return NextResponse.json({
    asignadas,
    correos,
    yaLaTenian: idsValidos.length - asignadas,
    descartadas: userIds.length - idsValidos.length,
    curso: curso.title,
    plan_id: plan!.id,
    plan_item_id: item!.id,
    item_creado: itemCreado,
    asignado_por: user?.name ?? null,
  }, { status: 201 })
}

// ─── Seguimiento: lo que se hace con cada persona ya asignada ─────────
// Anotar asistencia, quitar a alguien, devolverlo y avisar por correo. Todo
// pasa por aquí para que todo quede anotado igual en la auditoría.
export async function PATCH(req: NextRequest) {
  const { authorized, user, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const body = await req.json()
  const accion: string = body.accion
  const ids: string[] = Array.isArray(body.enrollment_ids) ? body.enrollment_ids : []
  const quien = { usuarioId: user?.id ?? null, usuarioNombre: user?.name ?? null }

  // ── Devolver lo retirado (el "Deshacer" del aviso) ──
  if (accion === 'restaurar') {
    const filas: any[] = Array.isArray(body.filas) ? body.filas : []
    if (!filas.length) return NextResponse.json({ error: 'Nada que devolver' }, { status: 400 })
    const { error } = await supabase.from('enrollments').upsert(
      filas.map(f => ({ ...f, company_id: companyId })),
      { onConflict: 'user_id,training_id,plan_item_id', ignoreDuplicates: true },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (body.plan_item_id) {
      await supabase.from('plan_item_targets').upsert(
        filas.map(f => ({ plan_item_id: body.plan_item_id, target_type: 'user', target_id: f.user_id })),
        { onConflict: 'plan_item_id,target_type,target_id', ignoreDuplicates: true })
      await anotar(body.plan_item_id, 'restaurar', { detalle: { personas: filas.length }, ...quien })
    }
    return NextResponse.json({ restauradas: filas.length })
  }

  if (!ids.length) return NextResponse.json({ error: 'Elige al menos una persona' }, { status: 400 })

  // Siempre sobre inscripciones de la empresa activa.
  const { data: filas } = await supabase
    .from('enrollments')
    .select('id, user_id, training_id, plan_item_id, status, due_date, created_at, score, started_at, completed_at, users(name, correo)')
    .in('id', ids).eq('company_id', companyId)
  if (!filas?.length) return NextResponse.json({ error: 'No se encontraron esas asignaciones' }, { status: 404 })

  const itemId = filas[0].plan_item_id as string | null

  // ── Anotar lo que pasó el día de la capacitación ──
  if (accion === 'asistencia') {
    const valor: string | null = body.valor ?? null
    if (valor && !['asistio', 'no_asistio', 'excusado'].includes(valor)) {
      return NextResponse.json({ error: 'Asistencia no válida' }, { status: 400 })
    }
    const cambios: Record<string, any> = {
      asistencia: valor,
      asistencia_nota: body.nota?.trim() || null,
      asistencia_at: valor ? new Date().toISOString() : null,
      asistencia_por: valor ? user?.id ?? null : null,
    }
    // Quien asistió queda como que la hizo: es lo que sostiene el indicador de
    // cobertura y lo que se reporta como ejecutado.
    if (valor === 'asistio') {
      cambios.status = 'completed'
      cambios.completed_at = new Date().toISOString()
    } else if (valor) {
      cambios.status = 'pending'
      cambios.completed_at = null
    }

    const { error } = await supabase.from('enrollments').update(cambios).in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (itemId) {
      await anotar(itemId, 'asistencia', {
        motivo: body.nota?.trim() || null,
        detalle: { valor, personas: filas.map((f: any) => f.users?.name).filter(Boolean) },
        ...quien,
      })
    }
    return NextResponse.json({ marcadas: ids.length, valor })
  }

  // ── Quitar a alguien de la capacitación ──
  if (accion === 'retirar') {
    const completadas = filas.filter((f: any) => f.status === 'completed')
    const retirables = filas.filter((f: any) => f.status !== 'completed')
    if (!retirables.length) {
      return NextResponse.json({ error: 'Ya hicieron la capacitación: no se pueden quitar' }, { status: 400 })
    }
    // El registro completo se guarda antes de borrarlo, que es lo que permite
    // devolverlo igual si fue un error.
    const copia = retirables.map((f: any) => ({
      user_id: f.user_id, training_id: f.training_id, plan_item_id: f.plan_item_id,
      status: f.status, due_date: f.due_date, started_at: f.started_at, score: f.score,
    }))
    const { error } = await supabase.from('enrollments').delete().in('id', retirables.map((f: any) => f.id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (itemId) {
      await supabase.from('plan_item_targets').delete()
        .eq('plan_item_id', itemId).eq('target_type', 'user')
        .in('target_id', retirables.map((f: any) => f.user_id))
      await anotar(itemId, 'retirar', {
        motivo: body.motivo?.trim() || null,
        detalle: { filas: copia, personas: retirables.map((f: any) => f.users?.name).filter(Boolean) },
        ...quien,
      })
    }
    return NextResponse.json({
      retiradas: retirables.length,
      conservadas: completadas.length,
      filas: copia,
      nombres: retirables.map((f: any) => f.users?.name).filter(Boolean),
    })
  }

  // ── Avisar por correo ──
  if (accion === 'notificar') {
    const recordatorio = body.recordatorio === true
    const { data: curso } = await supabase
      .from('trainings').select('title, duration').eq('id', filas[0].training_id).maybeSingle()
    const { data: item } = itemId
      ? await supabase.from('plan_items').select('scheduled_date, modalidad').eq('id', itemId).maybeSingle()
      : { data: null as any }

    let enviados = 0
    const fallos: { nombre: string; motivo: string }[] = []
    for (const f of filas as any[]) {
      const { asunto, html } = plantillaCapacitacion({
        nombre: f.users?.name ?? '',
        curso: curso?.title ?? 'Capacitación',
        fecha: item?.scheduled_date ?? f.due_date ?? null,
        duracion: curso?.duration ?? null,
        modalidad: item?.modalidad ?? null,
        recordatorio,
      })
      const r = await enviarCorreo(f.users?.correo ?? '', asunto, html)
      if (r.enviado) enviados++
      else fallos.push({ nombre: f.users?.name ?? '', motivo: r.motivo ?? 'No se pudo enviar' })
      await supabase.from('enrollments').update({
        notificado_at: r.enviado ? new Date().toISOString() : null,
        notificacion_error: r.enviado ? null : (r.motivo ?? 'No se pudo enviar'),
      }).eq('id', f.id)
    }
    if (itemId) {
      await anotar(itemId, 'notificar', {
        detalle: { enviados, fallidos: fallos.length, recordatorio }, ...quien,
      })
    }
    return NextResponse.json({
      enviados, fallos,
      configurado: correoConfigurado(),
    })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
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

  const params = new URL(req.url).searchParams

  // Por ítem del plan: quiénes están asignados a esa capacitación concreta,
  // con lo que hace falta para mostrarlos sin otra consulta.
  const itemId = params.get('plan_item_id')
  if (itemId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, user_id, status, created_at, due_date, completed_at, score, asistencia, asistencia_nota, asistencia_at, notificado_at, notificacion_error, users(id, name, cedula, cargo, correo, areas(name))')
      .eq('plan_item_id', itemId)
      .eq('company_id', companyId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map((e: any) => ({
      id: e.id,
      user_id: e.user_id,
      status: e.status,
      created_at: e.created_at,
      due_date: e.due_date,
      completed_at: e.completed_at,
      score: e.score,
      asistencia: e.asistencia ?? null,
      asistencia_nota: e.asistencia_nota ?? null,
      asistencia_at: e.asistencia_at ?? null,
      notificado_at: e.notificado_at ?? null,
      notificacion_error: e.notificacion_error ?? null,
      name: e.users?.name ?? '',
      cedula: e.users?.cedula ?? '',
      cargo: e.users?.cargo ?? '',
      correo: e.users?.correo ?? '',
      area: e.users?.areas?.name ?? '',
    })))
  }

  const trainingId = Number(params.get('training_id'))
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
