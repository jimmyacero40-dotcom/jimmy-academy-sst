import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { randomBytes } from 'crypto'
import { enviarCorreo, direccionDe } from '@/lib/correo'

/**
 * Recuperar la contraseña.
 *
 * Dos cosas que antes no servían:
 *
 * 1. El correo salía por Resend directamente desde aquí, con su propia
 *    plantilla, mientras el resto de la plataforma ya manda por Gmail. Como
 *    Resend está en modo de prueba, el enlace no le llegaba a nadie —y sin
 *    error visible—. Ahora pasa por `enviarCorreo`, que es por donde salen
 *    los demás avisos, y si falla queda dicho en el registro del servidor.
 *
 * 2. Buscaba solo por `users.email`. El trabajador entra con su cédula y su
 *    correo de verdad casi siempre está en `correo` o en la ficha, así que
 *    escribir su propio correo no encontraba nada. Ahora se busca por los
 *    tres campos y también por cédula, que es lo que la gente se sabe.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const dato = String(email ?? '').toLowerCase().trim()
  if (!dato) {
    return NextResponse.json({ error: 'Escriba su correo o su cédula' }, { status: 400 })
  }

  // Siempre se responde que sí, haya o no cuenta: decir «ese correo no
  // existe» le regala a cualquiera la lista de quién está registrado.
  const ok = () => NextResponse.json({ ok: true })

  const soloNumeros = /^\d{5,15}$/.test(dato)

  const { data: candidatos } = await supabase
    .from('users')
    .select('id, name, email, correo, cedula, active, retired_at, worker_profiles(email_personal)')
    .or(
      soloNumeros
        ? `cedula.eq.${dato},email.eq.${dato},correo.eq.${dato}`
        : `email.eq.${dato},correo.eq.${dato}`,
    )
    .limit(5)

  let user: (typeof candidatos extends (infer T)[] | null ? T : any) | null =
    (candidatos ?? [])[0] ?? null

  // El correo personal vive en la ficha, que no se puede filtrar en el `or`
  // de arriba; se busca aparte.
  if (!user && !soloNumeros) {
    const { data: ficha } = await supabase
      .from('worker_profiles')
      .select('user_id, email_personal')
      .ilike('email_personal', dato)
      .limit(1)
      .maybeSingle()
    if (ficha?.user_id) {
      const { data: u } = await supabase
        .from('users')
        .select('id, name, email, correo, cedula, active, retired_at, worker_profiles(email_personal)')
        .eq('id', ficha.user_id)
        .maybeSingle()
      user = u ?? null
    }
  }

  // Quien ya no trabaja aquí no recupera su acceso.
  if (!user || user.active === false || user.retired_at) return ok()

  const destino = direccionDe(user as any) || (user.email ?? '')
  if (!destino || /@anonimizado\.invalid$/i.test(destino)) {
    console.log('[recuperar] sin correo donde escribirle:', user.id)
    return ok()
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()   // una hora

  await supabase
    .from('users')
    .update({ reset_token: token, reset_token_expires: expires })
    .eq('id', user.id)

  const origin =
    req.headers.get('origin') ||
    (req.headers.get('x-forwarded-host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('x-forwarded-host')}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000')
  const enlace = `${origin}/reset-password?token=${token}`

  const primerNombre = (user.name ?? '').split(/\s+/).slice(-2).join(' ') || 'Hola'

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#F7F9F7;color:#1F2937;border-radius:14px">
    <div style="margin-bottom:20px">
      <span style="background:#243C2C;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:.5px">AGROSAFE</span>
    </div>
    <h1 style="font-size:20px;margin:0 0 10px;color:#111827">Recupere su contraseña</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#4B5563">
      ${primerNombre}, alguien pidió restablecer la contraseña de su cuenta en AgroSafe.
      Si no fue usted, no haga nada: su contraseña sigue igual.
    </p>
    <a href="${enlace}" style="display:inline-block;background:#243C2C;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:14px;font-weight:700">
      Crear una contraseña nueva
    </a>
    <p style="font-size:12px;line-height:1.6;margin:22px 0 0;color:#6B7280">
      El enlace vence en <strong>una hora</strong>.<br>
      Si el botón no abre, copie esta dirección en su navegador:<br>
      <span style="color:#1D4ED8;word-break:break-all">${enlace}</span>
    </p>
  </div>`

  const envio = await enviarCorreo(destino, 'Recupere su contraseña — AgroSafe', html)
  if (!envio.enviado) {
    // No se le cuenta al visitante —sería decirle si la cuenta existe—, pero
    // sí queda en el registro para que el administrador sepa por qué no llegó.
    console.log('[recuperar] no se pudo enviar a', user.id, '·', envio.motivo)
  }

  return ok()
}
