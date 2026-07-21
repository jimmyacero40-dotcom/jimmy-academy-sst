import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper, getCurrentUser } from '@/lib/get-company'

// GET — list all signatures for a document (admin) or own signature (worker)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const isAdmin = user.role === 'admin' || user.role === 'superadmin'

  let query = supabase
    .from('legal_document_signatures')
    .select(`
      id, document_id, document_version, user_id, company_id,
      user_name, user_cargo, signature_data, ip_address, doc_hash, signed_at,
      companies(name)
    `)
    .eq('document_id', params.id)
    .order('signed_at', { ascending: false })

  if (!isAdmin) query = query.eq('user_id', user.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
