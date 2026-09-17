import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const role = token?.role as string | undefined

    // Superadmin must have an active company context
    if (role === 'superadmin' && path.startsWith('/dashboard')) {
      const activeCompany = req.cookies.get('x-active-company')?.value
      if (!activeCompany) {
        if (token?.companyId) {
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
        return NextResponse.redirect(new URL('/select-company', req.url))
      }
    }

    const isAdmin = role === 'admin' || role === 'superadmin'
    const isPortero = role === 'portero'

    // Admin-only routes: portería admin
    if (path.startsWith('/dashboard/control-operativo/porterias')) {
      if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Admin-only routes: retired workers
    if (path.startsWith('/dashboard/users/retirados')) {
      if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Control Operativo (ingreso/salida/porteria) requires admin OR portero
    if (
      path.startsWith('/dashboard/control-operativo/porteria') ||
      path.startsWith('/dashboard/control-operativo/salida') ||
      path === '/dashboard/control-operativo'
    ) {
      if (!isAdmin && !isPortero) return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  { pages: { signIn: '/login' } }
)

export const config = {
  matcher: ['/dashboard/:path*', '/select-company'],
}
