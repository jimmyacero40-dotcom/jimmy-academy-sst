import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser, requierePermiso } from '@/lib/get-company'
import { enviarCorreo, direccionDe, correoConfigurado } from '@/lib/correo'
import {
  MODULOS, plantillaRecordatorio, comoSeLeDice,
  esModuloDinamico, moduloDinamico, type Modulo,
} from '@/lib/recordatorios'

/**
 * De la clave que manda la pantalla al módulo concreto. Los fijos están en la
 * tabla; los de Tú Cuentas se leen de la base, porque los crea el usuario.
 */
async function resolver(clave: string, companyId?: string | null): Promise<Modulo | null> {
  let base: Modulo | null = MODULOS[clave] ?? null
  if (!base) {
    const id = esModuloDinamico(clave)
    if (!id) return null
    const { data } = await supabase.from('modulos').select('id, nombre').eq('id', id).maybeSingle()
    base = data ? moduloDinamico(data) : null
  }
  if (!base || !companyId) return base

  // Lo que la empresa haya escrito manda sobre el texto de fábrica. Si solo
  // cambió el asunto, lo demás se queda como venía.
  const { data: propia } = await supabase
    .from('recordatorio_plantillas')
    .select('asunto, frase, boton')
    .eq('company_id', companyId).eq('modulo', clave).maybeSingle()

  if (!propia) return base
  return {
    ...base,
    asunto: propia.asunto?.trim() || base.asunto,
    frase: propia.frase?.trim() || base.frase,
    boton: propia.boton?.trim() || base.boton,
  }
}

/** El dominio desde el que se está sirviendo, para armar el enlace del correo. */
function origen(req: NextRequest): string {
  return (
    req.headers.get('origin') ||
    (req.headers.get('x-forwarded-host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('x-forwarded-host')}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000')
  )
}

/**
 * GET ?modulo=… — a quién ya se le avisó y cuándo.
 *
 * La pantalla lo usa para no dejar que se mande el mismo aviso tres veces el
 * mismo día sin darse cuenta.
 */
export async function GET(req: NextRequest) {
  const clave = req.nextUrl.searchParams.get('modulo') ?? ''
  const base = await resolver(clave)
  if (!base) return NextResponse.json({ error: 'Módulo desconocido' }, { status: 400 })

  const { authorized, companyId } = await requierePermiso(base.permiso)
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Con la empresa ya resuelta se vuelve a armar, ahora con su texto propio.
  // Es lo que la pantalla muestra en las casillas para editar.
  const modulo = (await resolver(clave, companyId)) ?? base

  let q = supabase
    .from('recordatorios')
    .select('user_id, enviado, created_at, enviado_por_nombre')
    .eq('modulo', clave)
    .order('created_at', { ascending: false })
    .limit(500)
  if (companyId) q = q.eq('company_id', companyId)

  const periodo = Number(req.nextUrl.searchParams.get('periodo'))
  if (Number.isInteger(periodo) && periodo > 2000) q = q.eq('periodo', periodo)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Solo el último de cada persona: es lo único que la pantalla muestra.
  const ultimos: Record<string, any> = {}
  for (const r of data ?? []) if (!ultimos[r.user_id]) ultimos[r.user_id] = r

  // Quién tiene a dónde escribirle. La pantalla lo necesita antes de mandar,
  // para no dejar seleccionado a quien no tiene correo y luego decirle que no
  // salió. La dirección en sí no se devuelve: no hace falta para decidir.
  const correos: Record<string, boolean> = {}
  let qu = supabase
    .from('users')
    .select('id, correo, worker_profiles(email_personal)')
    .eq('role', 'worker')
    .is('retired_at', null)
  if (companyId) qu = qu.eq('company_id', companyId)
  const { data: personas } = await qu
  for (const p of personas ?? []) {
    const d = direccionDe(p as any)
    correos[p.id] = Boolean(d) && !/@anonimizado\.invalid$/i.test(d)
  }

  return NextResponse.json({
    ultimos,
    correos,
    // El texto con el que saldría el correo si se mandara ahora mismo: es lo
    // que la pantalla pone en las casillas para que se pueda cambiar.
    texto: { asunto: modulo.asunto, frase: modulo.frase, boton: modulo.boton },
    nombreModulo: modulo.nombre,
  })
}

/** POST — manda el recordatorio a los seleccionados. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const clave = String(body.modulo ?? '')
  const base = await resolver(clave)
  if (!base) return NextResponse.json({ error: 'Módulo desconocido' }, { status: 400 })

  const { authorized, companyId } = await requierePermiso(base.permiso)
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // El texto: el que viene escrito en el recuadro; si no, el que la empresa
  // guardó; si tampoco, el de fábrica. Y si pidió guardarlo, queda puesto
  // para la próxima vez que se avise de este mismo módulo.
  const guardada = (await resolver(clave, companyId)) ?? base
  const texto = (v: any, porDefecto: string) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, 2000) : porDefecto
  const modulo: Modulo = {
    ...guardada,
    asunto: texto(body.asunto, guardada.asunto),
    frase: texto(body.frase, guardada.frase),
    boton: texto(body.boton, guardada.boton),
  }

  if (body.guardar_plantilla === true && companyId) {
    const quienEscribe = await getCurrentUser()
    await supabase.from('recordatorio_plantillas').upsert({
      company_id: companyId,
      modulo: clave,
      asunto: modulo.asunto,
      frase: modulo.frase,
      boton: modulo.boton,
      actualizado_at: new Date().toISOString(),
      actualizado_por_nombre: quienEscribe?.name ?? null,
    }, { onConflict: 'company_id,modulo' })
  }

  if (!correoConfigurado()) {
    return NextResponse.json(
      { error: 'El envío de correo no está configurado; revise Configuración → Notificaciones' },
      { status: 409 })
  }

  const ids: string[] = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean).slice(0, 300) : []
  if (!ids.length) return NextResponse.json({ error: 'No se seleccionó a nadie' }, { status: 400 })

  const nota = typeof body.mensaje === 'string' && body.mensaje.trim()
    ? body.mensaje.trim().slice(0, 600)
    : null
  const plazo = typeof body.plazo === 'string' && body.plazo.trim() ? body.plazo.trim() : null
  const periodo = Number.isInteger(body.periodo) ? body.periodo : null

  // Se vuelve a leer de la base a quién se le escribe: si el cliente manda un
  // id de otra empresa o de alguien retirado, aquí se cae.
  let q = supabase
    .from('users')
    .select('id, name, correo, email, retired_at, company_id, worker_profiles(email_personal)')
    .in('id', ids)
    .is('retired_at', null)
  if (companyId) q = q.eq('company_id', companyId)

  const { data: personas, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const quien = await getCurrentUser()
  const enlace = origen(req) + modulo.ruta

  const resultados: { user_id: string; nombre: string; enviado: boolean; motivo?: string }[] = []
  const constancias: any[] = []

  for (const p of personas ?? []) {
    const destino = direccionDe(p as any)
    if (!destino || /@anonimizado\.invalid$/i.test(destino)) {
      resultados.push({ user_id: p.id, nombre: p.name, enviado: false, motivo: 'No tiene correo registrado' })
      constancias.push({
        company_id: companyId, modulo: modulo.clave, periodo, user_id: p.id,
        enviado_a: null, enviado: false, motivo: 'No tiene correo registrado', mensaje: nota,
        enviado_por: quien?.id ?? null, enviado_por_nombre: quien?.name ?? null,
      })
      continue
    }

    const envio = await enviarCorreo(
      destino,
      modulo.asunto,
      plantillaRecordatorio({ nombre: comoSeLeDice(p.name), modulo, enlace, plazo, nota }),
    )

    resultados.push({ user_id: p.id, nombre: p.name, enviado: envio.enviado, motivo: envio.motivo })
    constancias.push({
      company_id: companyId, modulo: modulo.clave, periodo, user_id: p.id,
      enviado_a: destino, enviado: envio.enviado, motivo: envio.motivo ?? null, mensaje: nota,
      enviado_por: quien?.id ?? null, enviado_por_nombre: quien?.name ?? null,
    })
  }

  if (constancias.length) await supabase.from('recordatorios').insert(constancias)

  // Un id que se pidió y no volvió de la base: de otra empresa, o retirado.
  const vistos = new Set((personas ?? []).map(p => p.id))
  for (const id of ids) {
    if (!vistos.has(id)) {
      resultados.push({ user_id: id, nombre: '—', enviado: false, motivo: 'La persona ya no está activa' })
    }
  }

  return NextResponse.json({
    enviados: resultados.filter(r => r.enviado).length,
    fallidos: resultados.filter(r => !r.enviado).length,
    resultados,
  })
}
