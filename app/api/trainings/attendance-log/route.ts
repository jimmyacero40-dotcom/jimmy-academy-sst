import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

// Returns all certificate sessions grouped by (course title, issued date)
export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()

  let query = supabase
    .from('certificates')
    .select('course, issued, training_id')
    .order('issued', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data: certs, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by course + issued date
  const map = new Map<string, { course: string; date: string; trainingId: number | null; count: number }>()
  for (const c of (certs || [])) {
    const key = `${c.course}||${c.issued || 'sin-fecha'}`
    if (map.has(key)) {
      map.get(key)!.count++
    } else {
      map.set(key, { course: c.course, date: c.issued || 'sin-fecha', trainingId: c.training_id || null, count: 1 })
    }
  }

  // Also fetch training IDs by title for sessions that have training_id = null
  const titles = [...new Set([...map.values()].filter(v => !v.trainingId).map(v => v.course))]
  const titleToId: Record<string, number> = {}
  if (titles.length > 0) {
    const { data: trs } = await supabase.from('trainings').select('id, title').in('title', titles)
    for (const t of (trs || [])) titleToId[t.title] = t.id
  }

  const sessions = [...map.values()].map(v => ({
    course: v.course,
    date: v.date,
    trainingId: v.trainingId ?? titleToId[v.course] ?? null,
    count: v.count,
  })).sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({ sessions })
}
