import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (token?.role === 'superadmin' && path !== '/dashboard/select-company') {
      const activeCompany = req.cookies.get('x-active-company')?.value
      if (!activeCompany) {
        return NextResponse.redirect(new URL('/dashboard/select-company', req.url))
      }
    }

    return NextResponse.next()
  },
  { pages: { signIn: '/login' } }
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
