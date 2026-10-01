import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { subirDiapositiva } from '@/lib/subir-diapositiva'

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

  // La imagen va al almacenamiento; en la base queda solo su URL.
  let url: string | null
  try {
    url = await subirDiapositiva(image_data, training_id, slide_index)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  const { error } = await supabase
    .from('training_slides')
    .insert({
      training_id,
      slide_index,
      image_data: url,
      slide_text: slide_text || '',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
