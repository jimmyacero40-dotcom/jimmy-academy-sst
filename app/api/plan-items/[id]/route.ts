import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { anotar } from '@/lib/auditoria-plan'
import { enviarCorreo, correoConfigurado, plantillaCapacitacion } from '@/lib/correo'

// ─── Acciones sobre una capacitación del plan ─────────────────────────
// Cancelarla, y el rastro de lo que se le ha hecho.
// ──────────────────────────────────────────────────────────────────────

/** El ítem, comprobando que sea de la empresa activa. */
async function cargar(id: string, companyId: string) {
  const { data } = await supabase
    .from('plan_items')
    .select('id, month, estado, scheduled_date, modalidad, training_id, trainings(title, duration), annual_plans!inner(company_id)')
    .eq('id', id).maybeSingle()
  if (!data || (data.annual_plans as any).company_id !== companyId) return null
  return data as any
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized || !companyId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const item = await cargar(params.id, companyId)
  if (!item) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const { data } = await supabase
    .from('plan_item_auditoria')
    .select('id, accion, motivo, detalle, usuario_nombre, created_at')
    .eq('plan_item_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, user, companyId } = await requierePermiso('formacion.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Selecciona una empresa primero' }, { status: 400 })

  const item = await cargar(params.id, companyId)
  if (!item) return NextResponse.json({ error: 'Capacitación no encontrada' }, { status: 404 })

  const body = await req.json()
  const quien = { usuarioId: user?.id ?? null, usuarioNombre: user?.name ?? null }

  // ── Cancelar ──
  // No se borra: queda cancelada y con su motivo. Una capacitación que se
  // programó y no se dictó es justamente lo que una auditoría quiere ver.
  if (body.accion === 'cancelar') {
    const motivo: string = (body.motivo ?? '').trim()
    if (!motivo) return NextResponse.json({ error: 'Escribe el motivo de la cancelación' }, { status: 400 })

    const { error } = await supabase.from('plan_items')
      .update({ estado: 'cancelada' }).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let enviados = 0
    const fallos: { nombre: string; motivo: string }[] = []
    if (body.notificar === true) {
      const { data: inscritos } = await supabase
        .from('enrollments')
        .select('id, users(name, correo)')
        .eq('plan_item_id', params.id).neq('status', 'completed')

      for (const e of (inscritos ?? []) as any[]) {
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:560px">
            <h2 style="color:#B45309;margin:0 0 4px">Capacitación cancelada</h2>
            <p style="margin:0 0 16px;color:#6B7280;font-size:13px">AgroSafe · Seguridad y Salud en el Trabajo</p>
            <p>Buen día, <b>${e.users?.name ?? ''}</b>.</p>
            <p>La capacitación <b>${item.trainings?.title ?? ''}</b> fue cancelada.</p>
            <p style="color:#6B7280"><b>Motivo:</b> ${motivo}</p>
            <p style="font-size:13px;color:#6B7280">Le avisaremos cuando se reprograme.</p>
          </div>`
        const r = await enviarCorreo(e.users?.correo ?? '', `Capacitación cancelada: ${item.trainings?.title ?? ''}`, html)
        if (r.enviado) enviados++
        else fallos.push({ nombre: e.users?.name ?? '', motivo: r.motivo ?? 'No se pudo enviar' })
      }
    }

    await anotar(params.id, 'cancelar', {
      motivo,
      detalle: { notificados: enviados, fallidos: fallos.length },
      ...quien,
    })

    return NextResponse.json({ estado: 'cancelada', enviados, fallos, configurado: correoConfigurado() })
  }

  // ── Reprogramar ──
  if (body.accion === 'reprogramar') {
    const fecha: string | null = body.scheduled_date || null
    if (!fecha) return NextResponse.json({ error: 'Elige la nueva fecha' }, { status: 400 })
    const mes = Number(fecha.slice(5, 7))
    const antes = item.scheduled_date

    const { error } = await supabase.from('plan_items')
      .update({ scheduled_date: fecha, month: mes, estado: item.estado === 'cancelada' ? 'programada' : item.estado })
      .eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('enrollments').update({ due_date: fecha })
      .eq('plan_item_id', params.id).neq('status', 'completed')

    let enviados = 0
    const fallos: { nombre: string; motivo: string }[] = []
    if (body.notificar === true) {
      const { data: inscritos } = await supabase
        .from('enrollments').select('id, users(name, correo)')
        .eq('plan_item_id', params.id).neq('status', 'completed')
      for (const e of (inscritos ?? []) as any[]) {
        const { asunto, html } = plantillaCapacitacion({
          nombre: e.users?.name ?? '',
          curso: item.trainings?.title ?? 'Capacitación',
          fecha, duracion: item.trainings?.duration ?? null, modalidad: item.modalidad,
          recordatorio: true,
        })
        const r = await enviarCorreo(e.users?.correo ?? '', `Nueva fecha · ${asunto}`, html)
        if (r.enviado) enviados++
        else fallos.push({ nombre: e.users?.name ?? '', motivo: r.motivo ?? 'No se pudo enviar' })
      }
    }

    await anotar(params.id, 'reprogramar', {
      motivo: body.motivo?.trim() || null,
      detalle: { de: antes, a: fecha, notificados: enviados },
      ...quien,
    })

    return NextResponse.json({ scheduled_date: fecha, month: mes, enviados, fallos, configurado: correoConfigurado() })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
