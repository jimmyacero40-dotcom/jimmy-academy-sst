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

  // Check if email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 })
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
