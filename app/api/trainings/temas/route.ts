import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import { TEMAS } from '@/lib/temas'

/**
 * Guarda de una vez el tema y la obligación de varios cursos.
 *
 * Va por lotes porque repartir sesenta cursos de a una petición es lento y
 * deja la biblioteca a medio clasificar si algo se cae por el camino.
 */
export async function POST(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { cursos } = await req.json().catch(() => ({ cursos: null }))
  if (!Array.isArray(cursos) || !cursos.length) {
    return NextResponse.json({ error: 'No llegó ningún curso' }, { status: 400 })
  }

  const validos = new Set(TEMAS.map(t => t.id))

  // Se agrupa por lo que se va a escribir: sesenta cursos no son sesenta
  // consultas, son una por cada combinación distinta de tema y obligación.
  const grupos = new Map<string, number[]>()
  for (const c of cursos) {
    const id = Number(c?.id)
    if (!Number.isFinite(id)) continue
    if (!validos.has(c?.tema)) {
      return NextResponse.json({ error: `Tema desconocido: ${c?.tema}` }, { status: 400 })
    }
    const clave = `${c.tema}|${c.obligatorio ? '1' : '0'}`
    const ya = grupos.get(clave)
    if (ya) ya.push(id)
    else grupos.set(clave, [id])
  }

  let guardados = 0
  for (const [clave, ids] of grupos) {
    const [tema, obl] = clave.split('|')
    let q = supabaseAdmin
      .from('trainings')
      .update({ tema, obligatorio: obl === '1' })
      .in('id', ids)
    if (companyId) q = q.eq('company_id', companyId)

    const { error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    guardados += ids.length
  }

  return NextResponse.json({ ok: true, guardados, consultas: grupos.size })
}
