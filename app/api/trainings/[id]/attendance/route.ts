import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin'))
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const companyId = await getActiveCompanyId()
  const trainingId = parseInt(params.id)
  const url = new URL(req.url)
  const sessionDate = url.searchParams.get('date')   // YYYY-MM-DD — filter to one session
  const sessionsOnly = url.searchParams.get('sessions') === '1'  // return session list only

  const { data: training } = await supabase
    .from('trainings')
    .select('id, title, duration, description, temario, created_at')
    .eq('id', trainingId)
    .single()

  if (!training) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  let certQuery = supabase
    .from('certificates')
    .select('user_id, name, cedula, course, issued, duration')
    .eq('course', training.title)

  if (companyId) certQuery = certQuery.eq('company_id', companyId)
  if (sessionDate) certQuery = certQuery.eq('issued', sessionDate)

  const { data: certs } = await certQuery

  // Return grouped session list (dates + counts) without fetching signatures
  if (sessionsOnly) {
    const counts: Record<string, number> = {}
    for (const c of (certs || [])) {
      const d = c.issued || 'sin-fecha'
      counts[d] = (counts[d] || 0) + 1
    }
    const sessions = Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
    return NextResponse.json({ training, sessions })
  }

  const participants = []
  for (const cert of (certs || [])) {
    let signatureData = null
    if (cert.user_id) {
      const { data: sig } = await supabase
        .from('signatures')
        .select('signature_data')
        .eq('user_id', cert.user_id)
        .limit(1)
        .single()
      if (sig) signatureData = sig.signature_data
    }

    const { data: usr } = cert.user_id
      ? await supabase.from('users').select('cargo').eq('id', cert.user_id).single()
      : { data: null }

    participants.push({
      name: cert.name,
      cedula: cert.cedula,
      cargo: usr?.cargo || '',
      issued: cert.issued,
      signature: signatureData,
    })
  }

  let companyName = ''
  let companyLogo = ''
  if (companyId) {
    const { data: co } = await supabase.from('companies').select('name, logo_url').eq('id', companyId).single()
    if (co) { companyName = co.name; companyLogo = co.logo_url || '' }
  }

  return NextResponse.json({ training, participants, companyName, companyLogo })
}
