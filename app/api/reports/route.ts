import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId } from '@/lib/get-company'

export async function GET(req: NextRequest) {
  const companyId = await getActiveCompanyId()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'summary'

  if (type === 'summary') {
    // KPIs globales
    let uQ = supabase.from('users').select('id, name, area, role, status', { count: 'exact', head: false })
    let eQ = supabase.from('enrollments').select('id, status, score, user_id, training_id, completed_at, created_at', { count: 'exact', head: false })
    let cQ = supabase.from('certificates').select('id, expires, user_id', { count: 'exact', head: false })

    if (companyId) {
      uQ = uQ.eq('company_id', companyId)
      eQ = eQ.eq('company_id', companyId)
      cQ = cQ.eq('company_id', companyId)
    }

    const [{ data: users }, { data: enrollments }, { data: certs }] = await Promise.all([uQ, eQ, cQ])

    const now = new Date()
    const activeUsers = (users ?? []).filter((u: any) => u.status === 'activo' || u.active)
    const completed = (enrollments ?? []).filter((e: any) => e.status === 'completed')
    const inProgress = (enrollments ?? []).filter((e: any) => e.status === 'in_progress')
    const pending = (enrollments ?? []).filter((e: any) => e.status === 'pending')
    const overdue = (enrollments ?? []).filter((e: any) => e.status === 'overdue')
    const scores = completed.filter((e: any) => e.score != null).map((e: any) => e.score)
    const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null
    const expiredCerts = (certs ?? []).filter((c: any) => c.expires && new Date(c.expires) < now)
    const compliance = (enrollments ?? []).length
      ? Math.round((completed.length / (enrollments ?? []).length) * 100)
      : 0

    // By area
    const areaMap: Record<string, { total: number; completed: number }> = {}
    for (const u of (users ?? [])) {
      const area = (u as any).area || 'Sin área'
      if (!areaMap[area]) areaMap[area] = { total: 0, completed: 0 }
      areaMap[area].total++
    }
    for (const e of completed) {
      const u = (users ?? []).find((u: any) => u.id === (e as any).user_id) as any
      if (u) {
        const area = u.area || 'Sin área'
        if (areaMap[area]) areaMap[area].completed++
      }
    }
    const byArea = Object.entries(areaMap).map(([area, d]) => ({ area, ...d, pct: d.total ? Math.round(d.completed / d.total * 100) : 0 }))

    // Monthly trend (last 6 months)
    const monthly: { month: string; completed: number; enrolled: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthEnrolled = (enrollments ?? []).filter((e: any) => (e.created_at ?? '').startsWith(monthStr)).length
      const monthCompleted = completed.filter((e: any) => (e.completed_at ?? '').startsWith(monthStr)).length
      monthly.push({ month: label, completed: monthCompleted, enrolled: monthEnrolled })
    }

    return NextResponse.json({
      users: (users ?? []).length,
      activeUsers: activeUsers.length,
      enrollments: (enrollments ?? []).length,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      overdue: overdue.length,
      avgScore,
      compliance,
      certificates: (certs ?? []).length,
      expiredCerts: expiredCerts.length,
      byArea,
      monthly,
    })
  }

  if (type === 'workers') {
    let uQ = supabase.from('users').select('id, name, email, cedula, area, role, status')
    if (companyId) uQ = uQ.eq('company_id', companyId)
    const { data: users } = await uQ

    let eQ = supabase.from('enrollments').select('user_id, status, score, completed_at, trainings(title, category)')
    if (companyId) eQ = eQ.eq('company_id', companyId)
    const { data: enrollments } = await eQ

    const rows = (users ?? []).map((u: any) => {
      const enr = (enrollments ?? []).filter((e: any) => e.user_id === u.id)
      const done = enr.filter((e: any) => e.status === 'completed')
      const scores = done.filter((e: any) => e.score != null).map((e: any) => e.score)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        cedula: u.cedula ?? '',
        area: u.area ?? '',
        role: u.role,
        status: u.status ?? (u.active ? 'activo' : 'inactivo'),
        total: enr.length,
        completed: done.length,
        compliance: enr.length ? Math.round(done.length / enr.length * 100) : 0,
        avgScore: scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null,
      }
    })

    return NextResponse.json(rows)
  }

  if (type === 'trainings') {
    let tQ = supabase.from('trainings').select('id, title, category, duration, status, valid_until')
    if (companyId) tQ = tQ.eq('company_id', companyId)
    const { data: trainings } = await tQ

    let eQ = supabase.from('enrollments').select('training_id, status, score, user_id')
    if (companyId) eQ = eQ.eq('company_id', companyId)
    const { data: enrollments } = await eQ

    const rows = (trainings ?? []).map((t: any) => {
      const enr = (enrollments ?? []).filter((e: any) => e.training_id === t.id)
      const done = enr.filter((e: any) => e.status === 'completed')
      const scores = done.filter((e: any) => e.score != null).map((e: any) => e.score)
      return {
        id: t.id,
        title: t.title,
        category: t.category ?? '',
        duration: t.duration ?? '',
        status: t.status ?? 'activo',
        valid_until: t.valid_until ?? '',
        enrolled: enr.length,
        completed: done.length,
        passRate: enr.length ? Math.round(done.length / enr.length * 100) : 0,
        avgScore: scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null,
      }
    })

    return NextResponse.json(rows)
  }

  return NextResponse.json({ error: 'Tipo no soportado' }, { status: 400 })
}
