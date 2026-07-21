import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/get-company'

// GET — returns active required documents that the current user has NOT signed (current version)
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Get all active required documents
  const { data: docs, error: docsErr } = await supabase
    .from('legal_documents')
    .select('id, slug, title, version, content, requires_signature')
    .eq('is_active', true)
    .eq('requires_signature', true)

  if (docsErr) return NextResponse.json({ error: docsErr.message }, { status: 500 })
  if (!docs?.length) return NextResponse.json([])

  // Get existing signatures for this user
  const { data: sigs } = await supabase
    .from('legal_document_signatures')
    .select('document_id, document_version')
    .eq('user_id', user.id)

  const signedMap = new Map((sigs ?? []).map(s => [`${s.document_id}:${s.document_version}`, true]))

  // Return documents where the CURRENT version is not yet signed
  const pending = docs.filter(d => !signedMap.has(`${d.id}:${d.version}`))

  return NextResponse.json(pending)
}
