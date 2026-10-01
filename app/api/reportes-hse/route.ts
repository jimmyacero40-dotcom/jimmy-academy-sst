import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { getCurrentUser, getActiveCompanyId, requierePermiso } from '@/lib/get-company'
import { puedeEnviarse, faltantes } from '@/lib/reportes-hse'

// Lo único que el trabajador puede escribir. El bloque de seguimiento queda
// fuera a propósito: lo diligencia después el responsable de SST.
const CAMPOS_TRABAJADOR = [
  'fecha_reporte', 'lugar', 'tipos', 'descripcion',
  'acciones_inmediatas', 'otra_accion', 'sugerencia_mejora',
] as const

/** Número legible del reporte: AVC-2026-0007, correlativo dentro de la empresa. */
async function siguienteCodigo(companyId: string): Promise<string> {
  const anio = new Date().getFullYear()
  const { data } = await supabase
    .from('hse_reports')
    .select('codigo')
    .eq('company_id', companyId)
    .like('codigo', `HSE-${anio}-%`)
    .order('codigo', { ascending: false })
    .limit(1)

  const ultimo = data?.[0]?.codigo
  const n = ultimo ? Number(ultimo.split('-')[2]) + 1 : 1
  return `HSE-${anio}-${String(n).padStart(4, '0')}`
}

/**
 * GET: los reportes del propio trabajador.
 * GET ?alcance=empresa: todos, solo para quien pueda gestionarlos. Queda listo
 * para la consola de SST, que se construye después.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('alcance') === 'empresa') {
    const { authorized, companyId } = await requierePermiso('sst.reportes.ver')
    if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { data, error } = await supabase.from('hse_reports')
      .select('*').eq('company_id', companyId).neq('estado', 'borrador')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ reportes: data ?? [] })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Acotado al propio usuario: nadie ve los reportes de otro por esta vía.
  const { data, error } = await supabase.from('hse_reports')
    .select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: perfil } = await supabase.from('worker_profiles')
    .select('centro_trabajo, cargo_confirmado, area_confirmada').eq('user_id', user.id).maybeSingle()

  return NextResponse.json({
    reportes: data ?? [],
    // Lo que AgroSafe ya sabe del trabajador: no se le vuelve a preguntar.
    trabajador: {
      nombre: user.name,
      cedula: (user as any).cedula ?? null,
      cargo: perfil?.cargo_confirmado || (user as any).cargo || null,
      area: perfil?.area_confirmada || (user as any).area || null,
      centro_trabajo: perfil?.centro_trabajo || null,
    },
  })
}

/** Crea un reporte a nombre de quien está autenticado. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 })

  const body = await req.json().catch(() => ({}))

  const datos: Record<string, any> = {}
  for (const campo of CAMPOS_TRABAJADOR) {
    if (body[campo] === undefined) continue
    datos[campo] = (campo === 'tipos' || campo === 'acciones_inmediatas')
      ? (Array.isArray(body[campo]) ? body[campo] : [])
      : body[campo]
  }

  if (!puedeEnviarse(datos)) {
    return NextResponse.json({ error: `Falta ${faltantes(datos).join(', ')}` }, { status: 400 })
  }

  const { data: perfil } = await supabase.from('worker_profiles')
    .select('centro_trabajo, cargo_confirmado, area_confirmada').eq('user_id', user.id).maybeSingle()

  const base = {
    ...datos,
    company_id: companyId,
    user_id: user.id,
    reporta_nombre: user.name,
    reporta_cedula: (user as any).cedula ?? null,
    cargo: perfil?.cargo_confirmado || (user as any).cargo || null,
    area: perfil?.area_confirmada || (user as any).area || null,
    centro_trabajo: perfil?.centro_trabajo || null,
    // Entra a la bandeja de SST como nuevo.
    estado: 'nuevo' as const,
    enviado_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Dos reportes a la vez pueden pedir el mismo consecutivo; si choca, se
  // vuelve a calcular en lugar de perder el reporte del trabajador.
  for (let intento = 0; intento < 5; intento++) {
    const codigo = await siguienteCodigo(companyId)
    const { data, error } = await supabase.from('hse_reports')
      .insert({ ...base, codigo }).select().single()

    if (!error) return NextResponse.json({ reporte: data })
    if (error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ error: 'No fue posible asignar el número del reporte' }, { status: 500 })
}
