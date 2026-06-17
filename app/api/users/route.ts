import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

async function isAdmin() {
  const session = await getServerSession()
  if (!session?.user?.email) return false
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()
  return data?.role === 'admin'
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, cedula, role, area, active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { email, password, name, cedula, role, area } = body

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, contraseña y nombre son requeridos' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password: hash,
      name,
      cedula: cedula || '',
      role: role || 'worker',
      area: area || '',
      active: true,
    })
    .select('id, email, name, cedula, role, area, active, created_at')
    .single()

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10)
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, name, cedula, role, area, active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase
    .from('users')
    .update({ active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
