import { redirect } from 'next/navigation'

// La gestión de sedes y porterías se administra desde Configuración. Esta ruta
// se conserva para que los enlaces guardados sigan funcionando.
export default function PorteriasRedirect() {
  redirect('/dashboard/settings?seccion=sedes')
}
