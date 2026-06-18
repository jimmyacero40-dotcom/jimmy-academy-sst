import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
  const res = NextResponse.json({ success: true })
  res.cookies.delete('x-active-company')
  return res
}
