import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { cerrarVencidas, estaAbierta } from '@/lib/vigencia'

const MESES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/**
 * Las otras veces que esta misma capacitación se programó, y en qué van.
 *
 * Es para avisar antes de asignar: "ya está programada en octubre, con 6 de
 * 52 asignados y 1 en curso". Así no se arma una ronda encima de otra sin
 * saberlo, y si la de antes ya se cerró se ve que esto es un refuerzo.
 */
export async function GET(req: NextRequest) {
  const { authorized, companyId } = await requierePermiso('formacion.ver')
  if (!authorized || !companyId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = Number(req.nextUrl.searchParams.get('training_id'))
  if (!trainingId) return NextResponse.json({ rondas: [] })

  // Primero se pone al día lo vencido, para no reportar como abierta una
  // ronda que en realidad ya se pasó de fecha.
  await cerrarVencidas(companyId).catch(() => [])

  const excluir = req.nextUrl.searchParams.get('excluir')

  const { data: planes } = await supabase
    .from('annual_plans').select('id').eq('company_id', companyId)
  const idsPlan = (planes ?? []).map((p: any) => p.id)
  if (!idsPlan.length) return NextResponse.json({ rondas: [] })

  const { data: items } = await supabase
    .from('plan_items')
    .select('id, month, scheduled_date, end_date, estado, cerrado_at')
    .eq('training_id', trainingId)
    .in('plan_id', idsPlan)
    .order('month')

  const propias = (items ?? []).filter((i: any) => i.id !== excluir)
  if (!propias.length) return NextResponse.json({ rondas: [] })

  const { data: inscripciones } = await supabase
    .from('enrollments')
    .select('plan_item_id, status, asistencia')
    .in('plan_item_id', propias.map((i: any) => i.id))

  const rondas = propias.map((i: any) => {
    const filas = (inscripciones ?? []).filter((e: any) => e.plan_item_id === i.id)
    return {
      id: i.id,
      mes: MESES[i.month] ?? '',
      fecha: i.scheduled_date,
      cierra: i.end_date,
      estado: i.estado,
      abierta: estaAbierta(i),
      asignados: filas.length,
      asistieron: filas.filter((e: any) => e.asistencia === 'asistio' || e.status === 'completed').length,
      enCurso: filas.filter((e: any) => e.status === 'in_progress').length,
      pendientes: filas.filter((e: any) => e.status === 'pending').length,
      noAsistieron: filas.filter((e: any) => e.asistencia === 'no_asistio').length,
    }
  }).filter(r => r.asignados > 0)

  return NextResponse.json({ rondas })
}
