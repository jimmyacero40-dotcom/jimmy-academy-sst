import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, password')
    .eq('email', (session.user as any).email)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
  }

  const hash = await bcrypt.hash(newPassword, 12)
  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hash })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Error al actualizar la contraseña' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
