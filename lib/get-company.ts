import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function getActiveCompanyId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  const role = (session.user as any).role

  if (role === 'superadmin') {
    const cookieStore = cookies()
    const activeCompany = cookieStore.get('x-active-company')?.value
    return activeCompany || null
  }

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
    .select('id, role, email, name, company_id')
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
    companyId = cookieStore.get('x-active-company')?.value || null
  }

  return { authorized: true, user, companyId } as const
}
