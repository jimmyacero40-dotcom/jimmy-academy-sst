import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/get-company'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { signature_data, pdf_data, document_version } = await req.json()
  if (!signature_data || !document_version) {
    return NextResponse.json({ error: 'signature_data y document_version requeridos' }, { status: 400 })
  }

  // Verify document exists and version matches
  const { data: doc, error: docErr } = await supabase
    .from('legal_documents')
    .select('id, version, title, content')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (docErr || !doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  if (doc.version !== document_version) {
    return NextResponse.json({ error: 'Versión del documento desactualizada' }, { status: 409 })
  }

  // Get user's cargo and company
  const { data: userData } = await supabase
    .from('users')
    .select('name, cargo, company_id')
    .eq('id', user.id)
    .single()

  // Compute simple hash of document content
  const encoder   = new TextEncoder()
  const data      = encoder.encode(doc.content)
  const hashBuf   = await crypto.subtle.digest('SHA-256', data)
  const hashArr   = Array.from(new Uint8Array(hashBuf))
  const doc_hash  = hashArr.map(b => b.toString(16).padStart(2, '0')).join('')

  // Get IP from headers
  const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? null

  const { data: sig, error: sigErr } = await supabase
    .from('legal_document_signatures')
    .upsert({
      document_id:      params.id,
      document_version: document_version,
      user_id:          user.id,
      company_id:       userData?.company_id ?? null,
      user_name:        userData?.name ?? user.name ?? null,
      user_cargo:       userData?.cargo ?? null,
      signature_data,
      pdf_data:         pdf_data ?? null,
      ip_address,
      doc_hash,
      signed_at:        new Date().toISOString(),
    }, { onConflict: 'document_id,document_version,user_id' })
    .select()
    .single()

  if (sigErr) return NextResponse.json({ error: sigErr.message }, { status: 500 })

  return NextResponse.json({ success: true, signature_id: sig.id }, { status: 201 })
}
