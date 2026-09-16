import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Superadmin must have an active company context to use the dashboard.
    // Auto-set the cookie from their session's companyId if it's missing —
    // this eliminates the /select-company redirect for single-company deployments.
    if (token?.role === 'superadmin' && path.startsWith('/dashboard')) {
      const activeCompany = req.cookies.get('x-active-company')?.value
      if (!activeCompany) {
        if (token.companyId) {
          // Auto-set from the JWT so they land directly on the dashboard
          const response = NextResponse.next()
          response.cookies.set('x-active-company', token.companyId as string, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
          })
          return response
        }
        // Only redirect if there is truly no company context at all
        return NextResponse.redirect(new URL('/select-company', req.url))
      }
    }

    return NextResponse.next()
  },
  { pages: { signIn: '/login' } }
)

export const config = {
  matcher: ['/dashboard/:path*', '/select-company'],
}
