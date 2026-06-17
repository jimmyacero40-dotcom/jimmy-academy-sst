import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/lib/supabase'

async function getUser() {
  const session = await getServerSession()
  if (!session?.user?.email) return null
  const { data } = await supabase
    .from('users')
    .select('id, role, email, name, cedula')
    .eq('email', session.user.email)
    .single()
  return data
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let query = supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })

  if (user.role !== 'admin') {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { code, name, cedula, course, issued, expires, duration, score } = body

  if (!code || !name || !course) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id: user.id,
      code,
      name,
      cedula: cedula || '',
      course,
      issued,
      expires,
      duration: duration || '8 horas',
      score: score || '100%',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
