import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  // Check if admin already exists — don't overwrite
  const { data: existing } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', 'admin@jimmyacademy.com')
    .single()

  if (existing) {
    return NextResponse.json({ success: true, message: 'Admin user already exists', role: existing.role })
  }

  // Create admin user only if it doesn't exist
  const hash = await bcrypt.hash('admin123', 10)
  const { error: adminError } = await supabase
    .from('users')
    .insert({
      email: 'admin@jimmyacademy.com',
      password: hash,
      name: 'Admin SST',
      role: 'superadmin',
      cedula: '',
      area: 'Administración',
      active: true,
    })

  if (adminError) {
    return NextResponse.json({ success: false, error: adminError.message })
  }

  return NextResponse.json({ success: true, message: 'Admin user created as superadmin' })
}
