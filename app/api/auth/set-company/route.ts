import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-company'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { companyId } = await req.json()
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 })

  const res = NextResponse.json({ success: true })
  res.cookies.set('x-active-company', companyId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return res
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.delete('x-active-company')
  return res
}
