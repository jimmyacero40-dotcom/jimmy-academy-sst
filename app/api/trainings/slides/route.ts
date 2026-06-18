import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { training_id, slide_index, image_data, slide_text } = body

  if (!training_id || slide_index === undefined || !image_data) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('training_slides')
    .insert({
      training_id,
      slide_index,
      image_data,
      slide_text: slide_text || '',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
