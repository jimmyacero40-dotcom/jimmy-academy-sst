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
    .select('id, role, email, name, company_id, permissions')
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
