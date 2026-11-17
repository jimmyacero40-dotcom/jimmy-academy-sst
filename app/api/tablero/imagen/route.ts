import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import { BODEGA } from '@/lib/tablero-bodega'

export const dynamic = 'force-dynamic'

const TIPOS_OK = new Set(['image/png', 'image/jpeg', 'image/webp'])

// El navegador ya comprime antes de subir. Este tope es la red por debajo, por
// si llega algo que el compresor no supo tocar; Vercel además corta las
// peticiones por encima de 4,5 MB, así que no tiene sentido aceptar más.
const TOPE = 4_000_000

/** Sube la imagen de una tarjeta y devuelve su dirección pública. */
export async function POST(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const form = await req.formData().catch(() => null)
  const archivo = form?.get('archivo') as File | null
  if (!archivo) return NextResponse.json({ error: 'No llegó ninguna imagen' }, { status: 400 })

  if (!TIPOS_OK.has(archivo.type)) {
    return NextResponse.json({ error: 'Solo se aceptan imágenes PNG, JPG o WebP' }, { status: 400 })
  }
  if (archivo.size > TOPE) {
    const mb = (archivo.size / 1_048_576).toFixed(1)
    return NextResponse.json(
      { error: `La imagen pesa ${mb} MB y el tope son 4 MB. Pruebe con una más liviana.` },
      { status: 413 },
    )
  }

  const ext = archivo.type === 'image/png' ? 'png' : archivo.type === 'image/webp' ? 'webp' : 'jpg'
  // El nombre no se reutiliza nunca: así el navegador no muestra la imagen
  // vieja en caché cuando se cambia la de una tarjeta.
  const ruta = `${companyId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from(BODEGA)
    .upload(ruta, Buffer.from(await archivo.arrayBuffer()), { contentType: archivo.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from(BODEGA).getPublicUrl(ruta)
  return NextResponse.json({ imagen_url: data.publicUrl })
}
