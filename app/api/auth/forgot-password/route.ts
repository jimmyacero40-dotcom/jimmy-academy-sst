import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) {
    return NextResponse.json({ error: 'El correo es requerido' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email.toLowerCase().trim())
    .eq('active', true)
    .single()

  // Always return success to avoid email enumeration
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

  await supabase
    .from('users')
    .update({ reset_token: token, reset_token_expires: expires })
    .eq('id', user.id)

  // Use the actual request origin so the link works in any environment
  // (local, Vercel preview, production) without needing NEXTAUTH_URL configured.
  const origin = req.headers.get('origin') || req.headers.get('x-forwarded-proto') && req.headers.get('x-forwarded-host')
    ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('x-forwarded-host')}`
    : process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${origin}/reset-password?token=${token}`

  // Send email via Resend if API key is configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Campus SST <noreply@jimmyacademy.co>',
        to: user.email,
        subject: 'Recuperación de contraseña — Campus SST',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f8fafc;border-radius:12px">
            <div style="margin-bottom:24px">
              <span style="background:#3b82f6;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600">Campus SST</span>
            </div>
            <h1 style="font-size:22px;font-weight:600;margin:0 0 8px">Recupera tu contraseña</h1>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
              Hola ${user.name}, recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Si no fuiste tú, puedes ignorar este mensaje.
            </p>
            <a href="${resetUrl}"
              style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:24px">
              Restablecer contraseña
            </a>
            <p style="color:#475569;font-size:12px;line-height:1.5;margin:0">
              Este enlace expira en <strong style="color:#94a3b8">1 hora</strong>.<br>
              Si el botón no funciona, copia este enlace: <span style="color:#60a5fa">${resetUrl}</span>
            </p>
          </div>
        `,
      }),
    })
  } else {
    // Development fallback — log the link (visible in Vercel function logs)
    console.log('[forgot-password] reset link:', resetUrl)
  }

  return NextResponse.json({ ok: true })
}
