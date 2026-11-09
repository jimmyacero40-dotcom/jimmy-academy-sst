import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { usaOpciones, type TipoPregunta } from '@/lib/modulos'

const TIPOS_VALIDOS: TipoPregunta[] = [
  'texto', 'parrafo', 'opcion', 'multiple', 'si_no', 'numero', 'fecha', 'escala', 'confirmacion',
]

/**
 * Guarda el cuestionario entero de una vez.
 *
 * Se manda completo y no pregunta por pregunta: así el orden y los borrados
 * quedan consistentes sin ir encadenando llamadas, y si algo falla a la mitad
 * no queda un cuestionario a medio cambiar.
 *
 * Las preguntas que conservan su id conservan también las respuestas que ya
 * estén guardadas bajo ese id; las nuevas nacen vacías.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized, companyId } = await requierePermiso('sst.modulos.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No tiene permiso' }, { status: 403 })
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const { data: modulo } = await supabase.from('modulos')
    .select('id, company_id').eq('id', params.id).maybeSingle()
  if (!modulo || modulo.company_id !== companyId) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const entrantes: any[] = Array.isArray(body.preguntas) ? body.preguntas : []

  const limpias = []
  for (const [i, p] of entrantes.entries()) {
    const titulo = (p.titulo ?? '').trim()
    if (!titulo) return NextResponse.json({ error: `La pregunta ${i + 1} no tiene enunciado` }, { status: 400 })

    const tipo: TipoPregunta = TIPOS_VALIDOS.includes(p.tipo) ? p.tipo : 'parrafo'
    const opciones = Array.isArray(p.opciones)
      ? p.opciones.map((o: any) => String(o).trim()).filter(Boolean)
      : []
    if (usaOpciones(tipo) && opciones.length < 2) {
      return NextResponse.json(
        { error: `La pregunta ${i + 1} es de escoger, así que necesita al menos dos opciones` }, { status: 400 })
    }

    limpias.push({
      // Un id que ya existía se respeta para no perder lo respondido.
      ...(typeof p.id === 'string' && p.id.length === 36 ? { id: p.id } : {}),
      modulo_id: params.id,
      orden: i + 1,
      titulo,
      ayuda: (p.ayuda ?? '').trim() || null,
      tipo,
      opciones,
      obligatoria: p.obligatoria !== false,
      placeholder: (p.placeholder ?? '').trim() || null,
      // Solo tienen sentido donde aplican: un "Otro" en una pregunta de fecha
      // o un porqué en una de texto confundirían al que responde.
      pedir_porque: tipo === 'si_no' && ['siempre', 'si', 'no'].includes(p.pedir_porque)
        ? p.pedir_porque : null,
      permite_otro: usaOpciones(tipo) && p.permite_otro === true,
    })
  }

  const conservar = limpias.map(p => (p as any).id).filter(Boolean)
  const { data: actuales } = await supabase.from('modulo_preguntas')
    .select('id').eq('modulo_id', params.id)
  const sobran = (actuales ?? []).map(p => p.id).filter(id => !conservar.includes(id))

  if (sobran.length) {
    const { error } = await supabase.from('modulo_preguntas').delete().in('id', sobran)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Las que ya existían y las nuevas van por separado a propósito.
  // Mandadas juntas, PostgREST iguala las columnas de todas las filas y a las
  // nuevas les mete un id nulo, que la tabla rechaza: agregar una pregunta a
  // un módulo que ya tenía otras guardadas fallaba siempre.
  const conId = limpias.filter(p => (p as any).id)
  const sinId = limpias.filter(p => !(p as any).id)

  if (conId.length) {
    const { error } = await supabase.from('modulo_preguntas')
      .upsert(conId, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (sinId.length) {
    const { error } = await supabase.from('modulo_preguntas').insert(sinId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('modulos')
    .update({ updated_at: new Date().toISOString() }).eq('id', params.id)

  const { data } = await supabase.from('modulo_preguntas')
    .select('*').eq('modulo_id', params.id).order('orden')

  return NextResponse.json((data ?? []).map((p: any) => ({ ...p, opciones: p.opciones ?? [] })))
}
