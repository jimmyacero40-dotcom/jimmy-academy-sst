import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { name, email, password, companyName } = await req.json()

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Nombre, correo y contraseña son requeridos' }, { status: 400 })
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  // ¿Ya tiene cuenta? Se busca por los tres lados donde puede estar su correo.
  //
  // Antes solo se miraba `users.email`. Pero el trabajador que crea el
  // administrador entra con su cédula —ahí va el `email`— y su correo de
  // verdad queda en `correo` o en la ficha. Entonces alguien que ya tenía
  // cuenta se registraba con su propio correo, no chocaba con nada, y
  // quedaba dos veces en la empresa: una con su historial y otra vacía que
  // además contaba como un trabajador más en todos los indicadores.
  const buzon = email.toLowerCase().trim()

  const { data: porCorreo } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${buzon},correo.eq.${buzon}`)
    .limit(1)
    .maybeSingle()

  let yaExiste = porCorreo?.id ?? null

  if (!yaExiste) {
    const { data: enFicha } = await supabase
      .from('worker_profiles')
      .select('user_id')
      .ilike('email_personal', buzon)
      .limit(1)
      .maybeSingle()
    yaExiste = enFicha?.user_id ?? null
  }

  if (yaExiste) {
    return NextResponse.json({
      error: 'Ya hay una cuenta con ese correo. Entre con su cédula, '
        + 'o use «¿Olvidaste tu contraseña?» para volver a entrar.',
    }, { status: 409 })
  }

  // Resolve company: find by name or fall back to the first active company
  let companyId: string | null = null
  if (companyName?.trim()) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', `%${companyName.trim()}%`)
      .eq('active', true)
      .single()
    companyId = company?.id ?? null
  }

  if (!companyId) {
    const { data: first } = await supabase
      .from('companies')
      .select('id')
      .eq('active', true)
      .order('created_at')
      .limit(1)
      .single()
    companyId = first?.id ?? null
  }

  if (!companyId) {
    return NextResponse.json({ error: 'No se encontró una empresa activa. Contacta al administrador.' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      role: 'worker',
      active: true,
      company_id: companyId,
    })
    .select('id, email, name, role')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
  }

  return NextResponse.json({ success: true, user }, { status: 201 })
}
