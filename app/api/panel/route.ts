import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import { calcSections, TOTAL_SECCIONES } from '@/lib/perfil-completitud'

export const dynamic = 'force-dynamic'

/**
 * Los números del panel de control, de todos los módulos y en una sola
 * consulta.
 *
 * El panel traía solo matrículas, usuarios y certificados: hablaba de
 * formación y callaba sobre la encuesta sociodemográfica, Tú Cuentas, los
 * reportes y las entregas. Quien dirige necesita ver de un vistazo en qué va
 * cada frente, no un solo módulo bien contado.
 *
 * Cada cifra dice contra qué se mide: «22 de 59» vale, un «37 %» suelto no.
 */

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Hoy en Colombia. */
function hoyCol(): Date {
  return new Date(Date.now() - 5 * 60 * 60 * 1000)
}

export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const dela = <T>(q: any): any => (companyId ? q.eq('company_id', companyId) : q)

  // ── Quién está activo: es el denominador de casi todo ──
  let qu = supabase.from('users')
    .select('id, name, area, cargo, role, active, retired_at')
    .eq('active', true).is('retired_at', null)
  if (companyId) qu = qu.eq('company_id', companyId)
  const { data: gente } = await qu
  const activos = (gente ?? []).filter(u => u.role !== 'almacen')
  const idsActivos = new Set(activos.map(u => u.id))
  const trabajadores = activos.length

  // ── Formación ──
  const { data: matriculas } = await dela(
    supabase.from('enrollments')
      .select('id, status, score, completed_at, due_date, user_id, trainings(title)')
  )
  const mats = matriculas ?? []
  const completadas = mats.filter((e: any) => e.status === 'completed')
  const vencidas = mats.filter((e: any) => e.status === 'expired')
  const evaluadas = mats.filter((e: any) => e.score !== null && e.score !== undefined)
  const aprobadas = evaluadas.filter((e: any) => Number(e.score) >= 70)

  const { count: certificados } = await dela(
    supabase.from('certificates').select('id', { count: 'exact', head: true })
  )

  // Asistencia presencial: las listas firmadas y a cuánta gente cubren.
  const { data: listas } = await dela(
    supabase.from('attendance_lists').select('id, participant_count, event_date')
  )
  const asistencias = (listas ?? []).reduce((s: number, l: any) => s + (l.participant_count ?? 0), 0)

  // ── Información sociodemográfica ──
  let qp = supabase.from('worker_profiles').select('*')
  if (companyId) qp = qp.eq('company_id', companyId)
  const { data: fichas } = await qp
  const mias = (fichas ?? []).filter((f: any) => idsActivos.has(f.user_id))
  let fichasCompletas = 0, fichasEmpezadas = 0
  for (const f of mias) {
    const hechas = Object.values(calcSections(f as any)).filter(Boolean).length
    if (hechas >= TOTAL_SECCIONES) fichasCompletas++
    else if (hechas > 0) fichasEmpezadas++
  }

  // ── Tú Cuentas: los módulos y la identificación de peligros ──
  const { data: modulos } = await dela(
    supabase.from('modulos').select('id, nombre, estado, periodo')
  )
  const { data: respuestas } = await dela(
    supabase.from('modulo_respuestas').select('id, modulo_id, user_id, estado')
  )
  const porModulo = (modulos ?? []).map((m: any) => {
    const suyas = (respuestas ?? []).filter((r: any) => r.modulo_id === m.id && idsActivos.has(r.user_id))
    return {
      id: m.id,
      nombre: m.nombre,
      estado: m.estado,
      enviadas: suyas.filter((r: any) => r.estado === 'enviado').length,
      empezadas: suyas.filter((r: any) => r.estado !== 'enviado').length,
    }
  })

  const { data: peligros } = await dela(
    supabase.from('hazard_participations').select('id, user_id, estado')
  )
  const peligrosMios = (peligros ?? []).filter((p: any) => idsActivos.has(p.user_id))

  // ── RePortal ──
  const { data: reportes } = await dela(
    supabase.from('hse_reports').select('id, estado, created_at, tipos')
  )
  const reps = reportes ?? []
  const porEstado: Record<string, number> = {}
  for (const r of reps) porEstado[r.estado || 'sin estado'] = (porEstado[r.estado || 'sin estado'] ?? 0) + 1
  // De qué se reporta: un reporte puede marcar varios tipos.
  const porTipo: Record<string, number> = {}
  for (const r of reps) {
    for (const t of Array.isArray(r.tipos) ? r.tipos : []) {
      porTipo[String(t)] = (porTipo[String(t)] ?? 0) + 1
    }
  }

  // ── Entregas ──
  const { data: entregas } = await dela(
    supabase.from('entregas').select('id, user_id, confirmado_at, entregado_at')
  )
  const ents = entregas ?? []
  const confirmadas = ents.filter((e: any) => e.confirmado_at).length

  // ── Cómo va mes a mes: lo completado en los últimos seis meses ──
  const hoy = hoyCol()
  const meses: { mes: string; completadas: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    meses.push({
      mes: MESES[d.getMonth()],
      completadas: completadas.filter((e: any) => {
        if (!e.completed_at) return false
        const c = new Date(e.completed_at)
        return c >= d && c < fin
      }).length,
    })
  }

  // ── Cumplimiento por área, sobre las personas activas ──
  const areaDe = new Map(activos.map(u => [u.id, u.area || 'Sin área']))
  const areas: Record<string, { total: number; hechas: number }> = {}
  for (const e of mats) {
    const a = areaDe.get((e as any).user_id)
    if (!a) continue   // matrícula de alguien retirado: no cuenta
    areas[a] = areas[a] ?? { total: 0, hechas: 0 }
    areas[a].total++
    if ((e as any).status === 'completed') areas[a].hechas++
  }
  const porArea = Object.entries(areas)
    .map(([area, v]) => ({ area, ...v, pct: v.total ? Math.round((v.hechas / v.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)

  // ── Lo que vence pronto ──
  const en30 = new Date(hoy.getTime() + 30 * 86400000)
  const vencenPronto = mats.filter((e: any) => {
    if (e.status === 'completed' || !e.due_date) return false
    const d = new Date(e.due_date)
    return d >= hoy && d <= en30
  }).length

  return NextResponse.json({
    trabajadores,
    formacion: {
      asignadas: mats.length,
      completadas: completadas.length,
      pendientes: mats.length - completadas.length - vencidas.length,
      vencidas: vencidas.length,
      vencenPronto,
      certificados: certificados ?? 0,
      evaluadas: evaluadas.length,
      aprobadas: aprobadas.length,
      promedio: evaluadas.length
        ? Math.round(evaluadas.reduce((s: number, e: any) => s + Number(e.score), 0) / evaluadas.length)
        : null,
      listas: (listas ?? []).length,
      asistencias,
      // Solo gente activa: contando también a los retirados salía «62 de 58».
      personasConAlgo: new Set(mats.filter((e: any) => idsActivos.has(e.user_id)).map((e: any) => e.user_id)).size,
      personasAlDia: new Set(completadas.filter((e: any) => idsActivos.has(e.user_id)).map((e: any) => e.user_id)).size,
    },
    sociodemografica: {
      completas: fichasCompletas,
      empezadas: fichasEmpezadas,
      sinEmpezar: Math.max(0, trabajadores - fichasCompletas - fichasEmpezadas),
    },
    tuCuentas: {
      modulos: porModulo,
      peligros: {
        enviadas: peligrosMios.filter((p: any) => p.estado === 'enviado').length,
        empezadas: peligrosMios.filter((p: any) => p.estado !== 'enviado').length,
      },
    },
    reportal: { total: reps.length, porEstado, porTipo },
    entregas: { total: ents.length, confirmadas, personas: new Set(ents.map((e: any) => e.user_id)).size },
    meses,
    porArea,
  })
}
