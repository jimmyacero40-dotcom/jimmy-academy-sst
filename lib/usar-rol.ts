'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

/**
 * Quién es el que está mirando la pantalla.
 *
 * Antes cada pantalla hacía `session?.user?.role || 'worker'`. Eso convierte
 * "todavía no sé quién es" en "es un trabajador", y el administrador veía por
 * momentos la pantalla de un trabajador sin haberse salido: le desaparecían
 * los botones de administración.
 *
 * Pasaba al volver a la pestaña. La librería de sesión vuelve a preguntar
 * quién es uno cada vez que la ventana recupera el foco, y si esa pregunta se
 * cae —un corte de red, el servidor despertando— la respuesta queda vacía por
 * un rato. La cookie seguía buena; solo se había perdido el camino.
 *
 * Aquí no se adivina. Mientras no se sepa, se dice que no se sabe, y se
 * recuerda el último rol conocido para que una caída pasajera no cambie la
 * pantalla debajo de los pies.
 *
 * Quien manda de verdad es el middleware, que revisa el token en cada
 * navegación: si no sirviera, no se llegaría hasta aquí.
 */

const LLAVE = 'rol-conocido'

export interface Rol {
  /** El rol, o null mientras no se sepa. Nunca un valor inventado. */
  rol: string | null
  /** Todavía no se sabe: conviene mostrar un esqueleto, no una pantalla. */
  cargando: boolean
  esAdmin: boolean
  esSuperAdmin: boolean
  esTrabajador: boolean
  esPortero: boolean
  esConsulta: boolean
}

export function useRol(): Rol {
  const { data: session, status } = useSession()
  const deLaSesion = (session?.user as any)?.role as string | undefined

  // El último que se supo, para que un tropiezo de red no vacíe la pantalla.
  const [recordado, setRecordado] = useState<string | null>(null)
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(LLAVE)
      if (v) setRecordado(v)
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!deLaSesion) return
    setRecordado(deLaSesion)
    try { sessionStorage.setItem(LLAVE, deLaSesion) } catch (_) {}
  }, [deLaSesion])

  const rol = deLaSesion ?? recordado ?? null

  return {
    rol,
    cargando: !rol,
    esAdmin: rol === 'admin' || rol === 'superadmin',
    esSuperAdmin: rol === 'superadmin',
    esTrabajador: rol === 'worker',
    esPortero: rol === 'portero',
    esConsulta: rol === 'consulta',
  }
}
