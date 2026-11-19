import { NextResponse } from 'next/server'
import { isAdminOrSuper } from '@/lib/get-company'
import { correoConfigurado, probarCorreo, remitenteTapado } from '@/lib/correo'

export const dynamic = 'force-dynamic'

/**
 * Si el envío de correo funciona EN ESTE SERVIDOR.
 *
 * Importa el «este»: las credenciales viven en variables de entorno, y las del
 * computador donde se programa no son las del sitio publicado. Se puede tener
 * el correo andando en pruebas y el sitio de verdad sin mandar nada, que es
 * exactamente lo que estaba pasando y no había forma de verlo.
 *
 * No devuelve la clave ni el buzón completo, y no le escribe a nadie: solo
 * abre la sesión con Google y la cierra.
 */
export async function GET() {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const configurado = correoConfigurado()
  const prueba = await probarCorreo()

  return NextResponse.json({
    configurado,
    sirve: prueba.sirve,
    motivo: prueba.motivo ?? null,
    proveedor: prueba.proveedor,
    remitente: configurado ? remitenteTapado() : null,
    // Para no confundir el servidor de pruebas con el publicado.
    entorno: process.env.VERCEL_ENV ?? (process.env.NODE_ENV === 'production' ? 'producción' : 'local'),
  })
}
