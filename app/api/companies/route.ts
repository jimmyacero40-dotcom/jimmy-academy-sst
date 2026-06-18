import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/get-company'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (user.role === 'superadmin') {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  if (user.role === 'admin' && user.company_id) {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', user.company_id)
      .single()
    return NextResponse.json(data ? [data] : [])
  }

  return NextResponse.json([])
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { name, nit, logo_url, color } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('companies')
    .insert({ name: name.trim(), nit: nit?.trim() || null, logo_url: logo_url || null, color: color || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase.from('companies').update({ active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
