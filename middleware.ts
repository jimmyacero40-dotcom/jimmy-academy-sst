import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (token?.role === 'superadmin' && path.startsWith('/dashboard')) {
      const activeCompany = req.cookies.get('x-active-company')?.value
      if (!activeCompany) {
        return NextResponse.redirect(new URL('/select-company', req.url))
      }
    }

    // Legal gate: if accessing dashboard without having signed all required docs
    if (path.startsWith('/dashboard') && token?.email) {
      const ldOk = req.cookies.get('ld_ok')?.value
      if (!ldOk || ldOk !== token.email) {
        return NextResponse.redirect(new URL('/legal-gate', req.url))
      }
    }

    return NextResponse.next()
  },
  { pages: { signIn: '/login' } }
)

export const config = {
  matcher: ['/dashboard/:path*', '/select-company', '/legal-gate'],
}
