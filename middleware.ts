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

    // El portero no tiene nada que hacer en el tablero general: entra directo a
    // su portería en vez de pasar por una pantalla que no puede usar.
    if (isPortero && path === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/control-operativo/porteria', req.url))
    }

    // Admin-only routes: portería admin
    if (path.startsWith('/dashboard/control-operativo/porterias')) {
      if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Admin-only routes: retired workers
    if (path.startsWith('/dashboard/users/retirados')) {
      if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Un trabajador solo entra a su portal. Antes el menú no mostraba el resto,
    // pero escribiendo la dirección se abría la biblioteca de cursos, Personas o
    // Reportes: ocultar el botón no era suficiente.
    // Ojo: /dashboard se compara exacta. Si se tratara como prefijo dejaría pasar
    // todo el sitio, que es justo lo que se quiere impedir.
    const permite = (rutas: string[]) =>
      rutas.some(r => path === r || (r !== '/dashboard' && path.startsWith(r + '/')))

    const RUTAS_TRABAJADOR = [
      '/dashboard', '/dashboard/my-plan', '/dashboard/my-profile',
      '/dashboard/my-signature', '/dashboard/certificates',
      '/dashboard/settings', '/dashboard/configuracion',
    ]
    if (role === 'worker' && !permite(RUTAS_TRABAJADOR)) {
      return NextResponse.redirect(new URL('/dashboard/my-plan', req.url))
    }

    // El portero se mueve en control operativo y en su configuración.
    const RUTAS_PORTERO = ['/dashboard', '/dashboard/control-operativo', '/dashboard/settings', '/dashboard/configuracion']
    if (isPortero && !permite(RUTAS_PORTERO)) {
      return NextResponse.redirect(new URL('/dashboard/control-operativo/porteria', req.url))
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
