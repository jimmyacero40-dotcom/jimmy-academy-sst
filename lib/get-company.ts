import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { tienePermiso } from '@/lib/permisos'

export async function getActiveCompanyId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  const role = (session.user as any).role
  const sessionCompanyId = (session.user as any).companyId

  if (role === 'superadmin') {
    const cookieStore = cookies()
    const cookieCompanyId = cookieStore.get('x-active-company')?.value
    // Cookie takes precedence; fall back to session companyId for auto-resolved context
    return cookieCompanyId || sessionCompanyId || null
  }

  if (sessionCompanyId) return sessionCompanyId

  const { data: user } = await supabase
    .from('users')
    .select('company_id')
    .eq('email', session.user.email)
    .single()

  return user?.company_id || null
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  const { data } = await supabase
    .from('users')
    .select('id, role, email, name, cedula, cargo, area, company_id, permissions')
    .eq('email', session.user.email)
    .single()

  return data
}

export async function isAdminOrSuper() {
  const user = await getCurrentUser()
  if (!user) return { authorized: false, user: null, companyId: null } as const

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return { authorized: false, user, companyId: null } as const
  }

  let companyId = user.company_id
  if (user.role === 'superadmin') {
    const cookieStore = cookies()
    companyId = cookieStore.get('x-active-company')?.value || user.company_id || null
  }

  return { authorized: true, user, companyId } as const
}

/**
 * Autoriza por permiso, no por rol. Basta con tener UNO de los permisos pedidos,
 * porque hay recursos que varias capacidades necesitan: el portero, por ejemplo,
 * requiere leer trabajadores para poder registrar un ingreso, sin que eso le dé
 * acceso al módulo de personal.
 *
 * El superadmin siempre pasa, y quien no tenga lista propia guardada hereda la
 * plantilla de su rol, de modo que las cuentas existentes no cambian.
 */
export async function requierePermiso(...permisos: string[]) {
  const user = await getCurrentUser()
  if (!user) return { authorized: false, user: null, companyId: null, isAdmin: false } as const

  const autorizado = permisos.some(p => tienePermiso(user.role, user.permissions, p))
  const isAdmin = user.role === 'admin' || user.role === 'superadmin'
  if (!autorizado) return { authorized: false, user, companyId: null, isAdmin } as const

  let companyId = user.company_id
  if (user.role === 'superadmin') {
    const cookieStore = cookies()
    companyId = cookieStore.get('x-active-company')?.value || user.company_id || null
  }

  return { authorized: true, user, companyId, isAdmin } as const
}

/** Porterías asignadas a una persona en gatehouse_operators. */
async function porteriasAsignadas(userId: string): Promise<string[]> {
  const { data } = await supabase.from('gatehouse_operators').select('gatehouse_id').eq('user_id', userId)
  return (data ?? []).map((o: any) => o.gatehouse_id)
}

/**
 * Porterías en las que puede REGISTRAR ingresos y salidas. `null` significa
 * todas (admin y superadmin). Un portero queda limitado a las que tiene
 * asignadas; si no tiene ninguna, la lista es vacía y no opera en ninguna.
 */
export async function porteriasPermitidas(userId: string, isAdmin: boolean): Promise<string[] | null> {
  if (isAdmin) return null
  return porteriasAsignadas(userId)
}

/**
 * Porterías cuyo movimiento puede CONSULTAR. Se separó de la anterior porque
 * mirar y operar no son lo mismo: antes el alcance se decidía por el rol, así
 * que para ver los movimientos de toda la empresa había que ser administrador o
 * tener porterías asignadas. Quien solo necesitaba consultar terminaba con rol
 * de portero, y al quitarle ingreso y salida se quedaba sin ver nada.
 *
 * Ahora lo decide el permiso `accesos.ver.todas`. Sin él no cambia nada: el
 * portero sigue viendo únicamente lo de sus porterías.
 */
export async function porteriasQuePuedeConsultar(
  user: { id: string; role: string; permissions?: string[] | null },
  isAdmin: boolean,
): Promise<string[] | null> {
  if (isAdmin) return null
  if (tienePermiso(user.role, user.permissions, 'accesos.ver.todas')) return null
  return porteriasAsignadas(user.id)
}

// Portero OR admin — for access to ingreso/salida operations
export async function isOperatorOrAdmin() {
  const user = await getCurrentUser()
  if (!user) return { authorized: false, user: null, companyId: null, isAdmin: false } as const

  const isAdmin = user.role === 'admin' || user.role === 'superadmin'
  const isPortero = user.role === 'portero'

  if (!isAdmin && !isPortero) {
    return { authorized: false, user, companyId: null, isAdmin: false } as const
  }

  let companyId = user.company_id
  if (user.role === 'superadmin') {
    const cookieStore = cookies()
    companyId = cookieStore.get('x-active-company')?.value || user.company_id || null
  }

  return { authorized: true, user, companyId, isAdmin } as const
}
