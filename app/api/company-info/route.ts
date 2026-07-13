import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getActiveCompanyId, getCurrentUser } from '@/lib/get-company'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({})

  const companyId = await getActiveCompanyId()
  if (!companyId) return NextResponse.json({})

  const { data } = await supabase
    .from('companies')
    .select('name, logo_url')
    .eq('id', companyId)
    .single()

  return NextResponse.json(data ?? {})
}
