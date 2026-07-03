import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, reset_token_expires')
    .eq('reset_token', token)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return NextResponse.json({ error: 'El enlace ha expirado' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()

  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, reset_token_expires')
    .eq('reset_token', token)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 })
  }

  const hash = await bcrypt.hash(newPassword, 12)

  const { error } = await supabase
    .from('users')
    .update({ password: hash, reset_token: null, reset_token_expires: null })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar la contraseña' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
