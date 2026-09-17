import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { finJornada, MOTIVO_FIN_JORNADA } from '@/lib/jornada'

/**
 * Cierra los ingresos que quedaron abiertos al terminar el día, para que el panel
 * de personas actualmente dentro arranque limpio cada jornada.
 * Lo invoca Vercel Cron a las 00:00 de Colombia (05:00 UTC) y sella la salida a las
 * 23:59:59 del día que se cerró. Corre después del corte, y no antes, porque Vercel
 * puede disparar el cron en cualquier momento dentro de la hora programada: si se
 * ejecutara a las 23:xx cerraría la jornada antes de tiempo.
 * El secreto evita que se dispare desde fuera, porque a media jornada sacaría gente
 * que sigue adentro.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const ahora = new Date()
  const { data: abiertos, error } = await supabaseAdmin
    .from('access_logs')
    .select('id, entry_time')
    .is('exit_time', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  for (const log of abiertos ?? []) {
    const cierre = finJornada(new Date(log.entry_time))
    await supabaseAdmin
      .from('access_logs')
      .update({
        exit_time: (cierre < ahora ? cierre : ahora).toISOString(),
        auto_exit: true,
        auto_exit_reason: MOTIVO_FIN_JORNADA,
      })
      .eq('id', log.id)
  }

  return NextResponse.json({ cerrados: abiertos?.length ?? 0 })
}
