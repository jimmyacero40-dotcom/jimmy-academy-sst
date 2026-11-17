'use client'

import { SessionProvider } from 'next-auth/react'

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  /**
   * No se vuelve a preguntar quién es uno cada vez que la ventana recupera el
   * foco.
   *
   * Esa pregunta se hacía sola al volver a la pestaña, y si se caía —un corte
   * de red, el servidor despertando— la sesión quedaba vacía un rato y la
   * pantalla se degradaba a la de un trabajador sin que nadie se hubiera
   * salido.
   *
   * No hace falta: el middleware revisa el token en cada navegación, así que
   * una sesión que de verdad se venció se detecta ahí, que es donde importa.
   */
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
}
