/**
 * Catálogo de permisos por capacidad.
 *
 * OJO: por ahora estos permisos solo se guardan y se muestran. Todavía NO se
 * verifican en los endpoints del API, así que no restringen nada de verdad:
 * quien conozca la URL puede ejecutar la acción igual. Para que protejan hay que
 * llamar a `tienePermiso` en cada ruta que consulta o modifica datos.
 */

export interface Permiso { id: string; label: string; descripcion: string }
export interface GrupoPermisos { grupo: string; permisos: Permiso[] }

export const CATALOGO_PERMISOS: GrupoPermisos[] = [
  {
    grupo: 'Personal',
    permisos: [
      { id: 'personal.ver',     label: 'Consultar trabajadores', descripcion: 'Ver el listado y las hojas de vida' },
      { id: 'personal.crear',   label: 'Crear trabajadores',     descripcion: 'Registrar personas nuevas e importar desde Excel' },
      { id: 'personal.editar',  label: 'Editar trabajadores',    descripcion: 'Modificar datos, cargo, sede y grupos' },
      { id: 'personal.retirar', label: 'Retirar y reactivar',    descripcion: 'Dar de baja trabajadores y reincorporarlos' },
    ],
  },
  {
    grupo: 'Control operativo',
    permisos: [
      { id: 'accesos.ver',      label: 'Consultar movimientos', descripcion: 'Ver el registro de ingresos y salidas' },
      { id: 'accesos.ingreso',  label: 'Registrar ingresos',    descripcion: 'Marcar entradas en portería' },
      { id: 'accesos.salida',   label: 'Registrar salidas',     descripcion: 'Marcar salidas en portería' },
      { id: 'accesos.exportar', label: 'Exportar reportes',     descripcion: 'Descargar los movimientos en PDF y Excel' },
      { id: 'accesos.sedes',    label: 'Administrar sedes',     descripcion: 'Crear y editar porterías y sus operadores' },
    ],
  },
  {
    grupo: 'Formación',
    permisos: [
      { id: 'formacion.ver',       label: 'Consultar formación', descripcion: 'Ver capacitaciones, asistencia y certificados' },
      { id: 'formacion.gestionar', label: 'Gestionar formación', descripcion: 'Crear capacitaciones, inscribir y emitir certificados' },
    ],
  },
  {
    grupo: 'Gestión SST',
    permisos: [
      { id: 'sst.participacion.ver',      label: 'Consultar participaciones', descripcion: 'Ver quién participó en la identificación de peligros y sus respuestas' },
      { id: 'sst.participacion.exportar', label: 'Exportar participaciones',  descripcion: 'Descargar formularios en PDF y los resultados en Excel' },
      { id: 'sst.participacion.eliminar', label: 'Eliminar participaciones',  descripcion: 'Borrar respuestas ya registradas. Sirve para limpiar pruebas y no tiene vuelta atrás' },
      { id: 'sst.reportes.ver',           label: 'Consultar reportes HSE',    descripcion: 'Ver las tarjetas de reporte que envían los trabajadores' },
      { id: 'sst.reportes.gestionar',     label: 'Gestionar reportes HSE',    descripcion: 'Registrar el seguimiento y relacionarlos con la matriz de mejoras' },
      { id: 'sst.reportes.corregir',      label: 'Corregir reportes HSE',     descripcion: 'Enmendar lo que escribió el trabajador cuando quedó mal diligenciado' },
      { id: 'sst.reportes.eliminar',      label: 'Eliminar reportes HSE',     descripcion: 'Borrar reportes. Sirve para limpiar pruebas y no tiene vuelta atrás' },
    ],
  },
  {
    grupo: 'Configuración',
    permisos: [
      { id: 'config.usuarios', label: 'Administrar usuarios', descripcion: 'Crear cuentas de acceso y asignar permisos' },
      { id: 'config.empresa',  label: 'Ajustes de empresa',   descripcion: 'Datos de la empresa, tema visual y notificaciones' },
    ],
  },
]

export const TODOS_LOS_PERMISOS = CATALOGO_PERMISOS.flatMap(g => g.permisos.map(p => p.id))

/** Plantilla inicial que se propone al elegir un rol. Es editable. */
/** Capacidades que no se heredan por ser admin: el superadmin las concede a mano. */
const SOLO_SUPERADMIN = [
  'config.empresa',
  'sst.participacion.eliminar',
  'sst.reportes.corregir',
  'sst.reportes.eliminar',
]

export const PERMISOS_POR_ROL: Record<string, string[]> = {
  superadmin: TODOS_LOS_PERMISOS,
  admin: TODOS_LOS_PERMISOS.filter(p => !SOLO_SUPERADMIN.includes(p)),
  portero: ['accesos.ver', 'accesos.ingreso', 'accesos.salida'],
  worker: [],
}

/**
 * El superadmin siempre puede todo, según regla del negocio. Para los demás, si
 * no se ha guardado una lista propia se usa la plantilla de su rol.
 */
export function permisosEfectivos(role: string, permissions?: string[] | null): string[] {
  if (role === 'superadmin') return TODOS_LOS_PERMISOS
  if (permissions && permissions.length) return permissions
  return PERMISOS_POR_ROL[role] ?? []
}

export function tienePermiso(role: string, permissions: string[] | null | undefined, permiso: string): boolean {
  return permisosEfectivos(role, permissions).includes(permiso)
}
