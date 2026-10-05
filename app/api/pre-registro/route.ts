import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { normalizarUsuario, normalizarPerfil } from '@/lib/mayusculas'

/**
 * Pre-registro público de trabajadores.
 *
 * Es el único endpoint sin sesión que crea personas, así que todo lo que
 * llegue se trata como no confiable: el rol se fija aquí (nunca viene del
 * cliente), la cuenta nace inactiva y en estado 'pendiente', y la cédula se
 * comprueba contra la base, que además tiene un índice único por empresa.
 *
 * No devuelve datos de nadie más: ante una cédula ya registrada solo informa
 * que existe, sin decir de quién.
 */

// Lo único que el formulario público puede escribir en el perfil.
const CAMPOS_PERFIL_PUBLICO = [
  'nombres', 'apellidos', 'doc_type', 'fecha_nacimiento', 'sexo', 'estado_civil',
  'telefono', 'email_personal', 'direccion', 'barrio',
  'ciudad_residencia', 'depto_residencia',
  'cargo_confirmado', 'area_confirmada', 'centro_trabajo', 'fecha_ingreso',
  'contacto_emergencia', 'parentesco_contacto', 'tel_contacto',
] as const

const soloDigitos = (s: string) => s.replace(/\D/g, '')

async function empresaActiva(): Promise<string | null> {
  const { data } = await supabase.from('companies')
    .select('id').eq('active', true).order('created_at').limit(1).maybeSingle()
  return data?.id ?? null
}

/**
 * GET ?cedula=123 — ¿esa cédula ya está registrada?
 * Responde sí o no y en qué estado, nunca el nombre ni otros datos.
 */
export async function GET(req: NextRequest) {
  const cedula = soloDigitos(req.nextUrl.searchParams.get('cedula') ?? '')
  if (cedula.length < 5) return NextResponse.json({ error: 'Cédula inválida' }, { status: 400 })

  const companyId = await empresaActiva()
  if (!companyId) return NextResponse.json({ error: 'No hay empresa configurada' }, { status: 400 })

  const { data } = await supabase.from('users')
    .select('estado_registro, active')
    .eq('company_id', companyId).eq('cedula', cedula).is('purged_at', null).maybeSingle()

  if (!data) return NextResponse.json({ existe: false })
  return NextResponse.json({
    existe: true,
    estado: data.estado_registro ?? (data.active ? 'registrado' : 'inactivo'),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const cedula = soloDigitos(String(body.cedula ?? ''))
  const nombres = String(body.nombres ?? '').trim()
  const apellidos = String(body.apellidos ?? '').trim()
  const password = String(body.password ?? '')
  const correo = String(body.correo ?? '').trim().toLowerCase()

  if (cedula.length < 5) return NextResponse.json({ error: 'Escribe un número de documento válido' }, { status: 400 })
  if (!nombres || !apellidos) return NextResponse.json({ error: 'Escribe tus nombres y apellidos' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  if (correo && !/^\S+@\S+\.\S+$/.test(correo)) {
    return NextResponse.json({ error: 'El correo no tiene un formato válido' }, { status: 400 })
  }

  const companyId = await empresaActiva()
  if (!companyId) return NextResponse.json({ error: 'No hay empresa configurada' }, { status: 400 })

  // Duplicado: se comprueba aquí y además lo impide un índice único.
  const { data: yaExiste } = await supabase.from('users')
    .select('id, estado_registro')
    .eq('company_id', companyId).eq('cedula', cedula).is('purged_at', null).maybeSingle()

  if (yaExiste) {
    return NextResponse.json({
      error: yaExiste.estado_registro === 'pendiente'
        ? 'Ya enviaste tu registro con este documento y está en revisión.'
        : 'Ya existe un registro con este documento. Ingresa con tu documento y tu contraseña.',
      existe: true,
      estado: yaExiste.estado_registro ?? 'registrado',
    }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 10)
  // El cargo y el área se copian también a users: son las columnas que
  // muestra la tabla de Trabajadores.
  const basicos = normalizarUsuario({
    name: `${apellidos} ${nombres}`,
    cargo: String(body.cargo_confirmado ?? '').trim() || null,
    area: String(body.area_confirmada ?? '').trim() || '',
  })

  // El rol y el estado los pone el servidor. Nada de lo que mande el
  // formulario puede convertir a nadie en administrador ni activarlo.
  const { data: usuario, error } = await supabase.from('users').insert({
    email: cedula,            // el documento es la llave de acceso del trabajador
    correo: correo || null,
    password: hash,
    name: basicos.name,
    cargo: basicos.cargo,
    area: basicos.area,
    cedula,
    role: 'worker',
    active: false,            // se activa cuando el superadmin lo apruebe
    estado_registro: 'pendiente',
    pre_registro_at: new Date().toISOString(),
    company_id: companyId,
    permissions: null,
  }).select('id').single()

  if (error) {
    // 23505 = chocó contra el índice único: alguien registró esa cédula en medio.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un registro con este documento.', existe: true }, { status: 409 })
    }
    return NextResponse.json({ error: 'No fue posible crear el registro' }, { status: 500 })
  }

  // El perfil se guarda en la misma tabla que usa la encuesta, no en otra.
  const perfil: Record<string, any> = { nombres, apellidos }
  for (const campo of CAMPOS_PERFIL_PUBLICO) {
    if (body[campo] !== undefined && body[campo] !== '') perfil[campo] = body[campo]
  }

  const { error: errPerfil } = await supabase.from('worker_profiles').insert({
    ...normalizarPerfil(perfil),
    user_id: usuario.id,
    company_id: companyId,
  })
  if (errPerfil) {
    // Sin perfil el registro queda a medias: se deshace para que pueda reintentar.
    await supabase.from('users').delete().eq('id', usuario.id)
    return NextResponse.json({ error: 'No fue posible guardar tus datos' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cedula }, { status: 201 })
}
