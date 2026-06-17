import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  const { data } = await supabase
    .from('users')
    .select('id, role, email, name, cedula')
    .eq('email', session.user.email)
    .single()
  return data
}

// Get signature for a user
export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const userId = req.nextUrl.searchParams.get('userId') || user.id

  // Workers can only see their own signature
  if (user.role !== 'admin' && userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: sig } = await supabase
    .from('signatures')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: consent } = await supabase
    .from('consent_records')
    .select('id, consent_type, accepted, full_name, cedula, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ signature: sig, consent, profile: { name: user.name, cedula: user.cedula } })
}

// Save signature + consent
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { signatureData, fullName, cedula, userId: targetUserId } = body

  const userId = (user.role === 'admin' && targetUserId) ? targetUserId : user.id

  if (!signatureData || !fullName || !cedula) {
    return NextResponse.json({ error: 'Firma, nombre y cédula son requeridos' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  const ua = req.headers.get('user-agent') || ''

  const legalText = `AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES Y USO DE FIRMA DIGITAL

En cumplimiento de la Ley 1581 de 2012 "Ley de Protección de Datos Personales", el Decreto 1377 de 2013, y demás normatividad vigente en la República de Colombia, yo ${fullName}, identificado(a) con cédula de ciudadanía No. ${cedula}, de manera libre, voluntaria, previa, expresa e informada, AUTORIZO a AGROVENTURE CAPITAL S.A.S. y su plataforma Jimmy Academy SST para:

1. Recolectar, almacenar, usar, circular y suprimir mis datos personales, incluyendo mi firma digital, con el fin de gestionar el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) conforme al Decreto 1072 de 2015 y la Resolución 0312 de 2019.

2. Utilizar mi firma digital registrada en esta plataforma para la suscripción de certificados de capacitación, actas, compromisos, políticas y demás documentos del SG-SST, con la misma validez que mi firma manuscrita conforme a la Ley 527 de 1999.

3. Conservar registro de esta autorización como evidencia para auditorías internas y externas del SG-SST.

Declaro que he sido informado(a) sobre mis derechos como titular de datos personales (acceso, actualización, rectificación, supresión y revocatoria) y que puedo ejercerlos contactando al responsable del tratamiento.

Fecha de autorización: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
IP de registro: ${ip}
Plataforma: Jimmy Academy SST`

  // Save signature
  const { error: sigError } = await supabase
    .from('signatures')
    .upsert({
      user_id: userId,
      signature_data: signatureData,
      ip_address: ip,
      user_agent: ua,
    }, { onConflict: 'user_id' })

  // If upsert fails (no unique constraint on user_id), delete old and insert new
  if (sigError) {
    await supabase.from('signatures').delete().eq('user_id', userId)
    await supabase.from('signatures').insert({
      user_id: userId,
      signature_data: signatureData,
      ip_address: ip,
      user_agent: ua,
    })
  }

  // Save consent record (always insert new - audit trail)
  const { error: consentError } = await supabase
    .from('consent_records')
    .insert({
      user_id: userId,
      consent_type: 'firma_digital',
      accepted: true,
      full_name: fullName,
      cedula,
      legal_text: legalText,
      signature_data: signatureData,
      ip_address: ip,
      user_agent: ua,
    })

  if (consentError) {
    return NextResponse.json({ error: consentError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
