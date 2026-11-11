import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subirDiapositiva } from '@/lib/subir-diapositiva'

type Params = { params: { id: string } }

/**
 * Subir diez imágenes a la bodega lleva más de los diez segundos que Vercel
 * le da a una función por defecto. Al cortarse, el navegador solo ve
 * "Failed to fetch" y el material no cambia, que es lo que estaba pasando.
 */
export const maxDuration = 60

// Replace all slides for a training (delete existing + bulk insert)
// Atomically: old slides deleted, new ones inserted, training.slides_count updated
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin' && role !== 'superadmin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = parseInt(params.id)

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido o demasiado grande' }, { status: 400 })
  }

  const { slides = [] } = body
  // Las diapositivas llegan por tandas: todas juntas pesaban decenas de megas
  // y el servidor rechazaba la petición antes de leerla. La primera tanda
  // reemplaza lo que había, las siguientes agregan, y la última cierra.
  const reemplazar = body.reemplazar !== false
  const esFinal = body.final !== false

  // Only insert slides that have image data; text-only slides are skipped
  const validSlides = slides.filter((s: any) => s.image_data)

  if (reemplazar) {
    const { error: delErr } = await supabaseAdmin
      .from('training_slides')
      .delete()
      .eq('training_id', trainingId)

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  let insertedCount = 0

  // De a cuatro a la vez: una por una no cabía en el tiempo de la función, y
  // todas de golpe hace que la bodega empiece a rechazar. El error dice qué
  // diapositiva falló, no un "algo salió mal".
  const urls: (string | null)[] = new Array(validSlides.length).fill(null)
  const A_LA_VEZ = 4
  for (let i = 0; i < validSlides.length; i += A_LA_VEZ) {
    const tanda = validSlides.slice(i, i + A_LA_VEZ)
    try {
      const hechas = await Promise.all(tanda.map((s: any) =>
        subirDiapositiva(s.image_data, trainingId, s.slide_index)))
      hechas.forEach((u, k) => { urls[i + k] = u })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (validSlides.length > 0) {
    const rows = validSlides.map((s: any, i: number) => ({
      training_id: trainingId,
      slide_index: s.slide_index,
      image_data: urls[i],
      slide_text: s.slide_text || '',
    }))

    const { error: insErr, data: inserted } = await supabaseAdmin
      .from('training_slides')
      .insert(rows)
      .select('id')

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    insertedCount = inserted?.length ?? validSlides.length
  }

  // La cuenta y la portada se dejan al cerrar, contando lo que de verdad
  // quedó guardado: si una tanda se cayó, el número no puede mentir.
  if (esFinal) {
    const { count } = await supabaseAdmin
      .from('training_slides')
      .select('id', { count: 'exact', head: true })
      .eq('training_id', trainingId)

    // La portada sale de la primera diapositiva solo si nadie la escogió a
    // mano: una portada puesta a propósito no se pierde por reemplazar el
    // material.
    const { data: curso } = await supabaseAdmin
      .from('trainings')
      .select('portada_manual')
      .eq('id', trainingId)
      .maybeSingle()

    const cambios: Record<string, any> = { slides_count: count ?? 0 }
    if (!curso?.portada_manual) {
      const { data: primera } = await supabaseAdmin
        .from('training_slides')
        .select('image_data')
        .eq('training_id', trainingId)
        .order('slide_index')
        .limit(1)
        .maybeSingle()
      cambios.cover_url = primera?.image_data ?? null
    }

    await supabaseAdmin.from('trainings').update(cambios).eq('id', trainingId)

    return NextResponse.json({ ok: true, count: count ?? 0 })
  }

  return NextResponse.json({ ok: true, count: insertedCount })
}

// Delete all slides
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin' && role !== 'superadmin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const trainingId = parseInt(params.id)
  const { error } = await supabaseAdmin
    .from('training_slides')
    .delete()
    .eq('training_id', trainingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si la portada la escogió una persona, borrar el material no se la quita.
  const { data: curso } = await supabaseAdmin
    .from('trainings')
    .select('portada_manual')
    .eq('id', trainingId)
    .maybeSingle()

  await supabaseAdmin
    .from('trainings')
    .update(curso?.portada_manual ? { slides_count: 0 } : { slides_count: 0, cover_url: null })
    .eq('id', trainingId)

  return NextResponse.json({ ok: true })
}
