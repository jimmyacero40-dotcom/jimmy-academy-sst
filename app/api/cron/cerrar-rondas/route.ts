import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cerrarVencidas } from '@/lib/vigencia'

/**
 * Cierra cada día las rondas de capacitación a las que se les venció la
 * ventana, y deja en "No asistió" a quien no alcanzó a ir.
 *
 * También se hace al abrir el plan, así que esto es el respaldo: si nadie
 * entra en una semana, el plan no se queda mostrando rondas abiertas que en
 * realidad vencieron. El secreto evita que lo dispare cualquiera desde fuera.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: empresas } = await supabaseAdmin.from('companies').select('id')

  let rondas = 0
  let ausentes = 0
  for (const e of (empresas ?? []) as any[]) {
    const cerradas = await cerrarVencidas(e.id).catch(() => [])
    rondas += cerradas.length
    ausentes += cerradas.reduce((n, c) => n + c.ausentes, 0)
  }

  return NextResponse.json({ rondas, ausentes })
}
