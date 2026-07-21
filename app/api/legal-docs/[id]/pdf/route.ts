import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/get-company'

// GET — return pdf_data for a specific signature (own or admin)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const url       = new URL(req.url)
  const version   = url.searchParams.get('version')
  const userId    = url.searchParams.get('user_id') ?? user.id
  const isAdmin   = user.role === 'admin' || user.role === 'superadmin'

  if (userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let query = supabase
    .from('legal_document_signatures')
    .select('pdf_data, signed_at, document_version')
    .eq('document_id', params.id)
    .eq('user_id', userId)

  if (version) query = query.eq('document_version', version)
  const { data, error } = await query.order('signed_at', { ascending: false }).limit(1).single()

  if (error || !data?.pdf_data) return NextResponse.json({ error: 'PDF no encontrado' }, { status: 404 })
  return NextResponse.json({ pdf_data: data.pdf_data, signed_at: data.signed_at, version: data.document_version })
}
