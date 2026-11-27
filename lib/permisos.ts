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
      { id: 'accesos.ver.todas', label: 'Consultar todas las porterías', descripcion: 'Ver el movimiento de toda la empresa sin tener porterías asignadas. Sin esto, solo se ve el de las porterías que la persona opera' },
      { id: 'accesos.ingreso',  label: 'Registrar ingresos',    descripcion: 'Marcar entradas en portería' },
      { id: 'accesos.salida',   label: 'Registrar salidas',     descripcion: 'Marcar salidas en portería' },
      { id: 'accesos.exportar', label: 'Exportar reportes',     descripcion: 'Descargar los movimientos en PDF y Excel' },
      { id: 'accesos.sedes',    label: 'Administrar sedes',     descripcion: 'Crear y editar porterías y sus operadores' },
      { id: 'accesos.manual',   label: 'Registrar a mano',      descripcion: 'Dejar un movimiento que no se marcó en portería, escribiendo la hora de entrada y de salida. Queda señalado como manual, con el motivo' },
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
      { id: 'sst.participacion.administrar', label: 'Abrir y cerrar la participación', descripcion: 'Cerrar el periodo para que nadie más pueda responder, y volverlo a abrir' },
      { id: 'sst.modulos.ver',        label: 'Consultar módulos',   descripcion: 'Ver los módulos de participación y lo que respondieron los trabajadores' },
      { id: 'sst.modulos.gestionar',  label: 'Gestionar módulos',   descripcion: 'Crear módulos de participación, escribir sus preguntas y abrirlos o cerrarlos' },
      { id: 'sst.reportes.ver',           label: 'Consultar reportes HSE',    descripcion: 'Ver las tarjetas de reporte que envían los trabajadores' },
      { id: 'sst.reportes.gestionar',     label: 'Gestionar reportes HSE',    descripcion: 'Registrar el seguimiento y relacionarlos con la matriz de mejoras' },
      { id: 'sst.reportes.responder',     label: 'Responder acciones asignadas', descripcion: 'Ver únicamente los reportes que se le asignaron y dejar constancia de lo que se hizo. No cierra el reporte: eso lo verifica SST' },
      { id: 'sst.reportes.corregir',      label: 'Corregir reportes HSE',     descripcion: 'Enmendar lo que escribió el trabajador cuando quedó mal diligenciado' },
      { id: 'sst.reportes.eliminar',      label: 'Eliminar reportes HSE',     descripcion: 'Borrar reportes. Sirve para limpiar pruebas y no tiene vuelta atrás' },
      { id: 'sst.entregas.ver',       label: 'Consultar entregas',  descripcion: 'Ver qué se le ha entregado a cada trabajador y descargar el soporte' },
      { id: 'sst.entregas.registrar', label: 'Registrar entregas',  descripcion: 'Anotar la entrega de bebida hidratante, EPP o dotación, y definir qué se entrega' },
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
  // Escribir una hora de entrada o de salida a mano reescribe la evidencia de
  // quién estuvo en la finca, así que no lo puede hacer quien opera la portería.
  'accesos.manual',
  'sst.participacion.eliminar',
  'sst.reportes.corregir',
  'sst.reportes.eliminar',
]

export const PERMISOS_POR_ROL: Record<string, string[]> = {
  superadmin: TODOS_LOS_PERMISOS,
  admin: TODOS_LOS_PERMISOS.filter(p => !SOLO_SUPERADMIN.includes(p)),
  portero: ['accesos.ver', 'accesos.ingreso', 'accesos.salida'],
  // Cuenta de solo lectura: consulta el movimiento de todas las porterías sin
  // tener ninguna asignada y sin poder registrar ingresos ni salidas. Es lo que
  // antes obligaba a darle rol de portero a quien solo necesitaba mirar, con el
  // efecto de que al quitarle ingreso y salida dejaba de ver los movimientos.
  consulta: [
    'accesos.ver', 'accesos.ver.todas', 'accesos.exportar',
    'personal.ver', 'formacion.ver',
    'sst.participacion.ver', 'sst.modulos.ver', 'sst.reportes.ver',
    'sst.entregas.ver',
  ],
  worker: [],
  // Dos cuentas de oficio, no de persona: el almacén y el analista de SST.
  // Antes esto colgaba del perfil personal del almacenista, que además es
  // trabajador; si él se va, la cuenta se va con él. La cuenta es del puesto,
  // y quién entrega de verdad se escribe en cada entrega.
  almacen: [
    'personal.ver',
    'sst.entregas.ver', 'sst.entregas.registrar',
  ],
  // Quien ejecuta lo que sale de un reporte: mantenimiento, el jefe de campo,
  // gerencia. Solo ve lo que se le asignó y no cierra nada.
  responsable: ['sst.reportes.responder'],
  analista_sst: [
    'personal.ver', 'formacion.ver',
    'sst.entregas.ver', 'sst.entregas.registrar',
    'sst.participacion.ver', 'sst.modulos.ver', 'sst.reportes.ver',
  ],
}

/** Los roles de plataforma, para no repetir nombres y colores en cada pantalla. */
export const ROLES: { id: string; label: string; descripcion: string; color: string }[] = [
  { id: 'consulta',   label: 'Consulta',           color: '#8B5CF6', descripcion: 'solo lectura, sin registrar nada' },
  { id: 'portero',    label: 'Portero',            color: '#06B6D4', descripcion: 'acceso solo a portería/ingreso/salida' },
  { id: 'almacen',    label: 'Almacén',            color: '#0EA5E9', descripcion: 'entrega de EPP y elementos, nada más' },
  { id: 'analista_sst', label: 'Analista SST',     color: '#14B8A6', descripcion: 'entregas y consulta de lo del SG-SST' },
  { id: 'responsable', label: 'Responsable de acción', color: '#6366F1', descripcion: 'ejecuta las acciones de los reportes que se le asignan' },
  { id: 'admin',      label: 'Administrador',      color: '#F59E0B', descripcion: 'gestión del personal y SSTudio' },
  { id: 'superadmin', label: 'Superadministrador', color: '#EF4444', descripcion: 'control total de la plataforma' },
]

export const ROL = (id: string) =>
  ROLES.find(r => r.id === id) ?? { id, label: 'Trabajador', color: '#10B981', descripcion: '' }

/** Ningún rol de consulta debe poder escribir, por mucho que se marque la casilla. */
export const SOLO_LECTURA = new Set(['consulta'])

/**
 * Lo que una cuenta de consulta puede tener. Se filtra aquí y no solo en la
 * pantalla: si alguien marca por error "Registrar ingresos" en una cuenta de
 * consulta, o lo manda directo al API, no debe surtir efecto.
 */
const PERMISOS_DE_LECTURA = new Set(
  TODOS_LOS_PERMISOS.filter(p => p.endsWith('.ver') || p.endsWith('.ver.todas') || p.endsWith('.exportar'))
)

/**
 * El superadmin siempre puede todo, según regla del negocio. Para los demás, si
 * no se ha guardado una lista propia se usa la plantilla de su rol.
 */
export function permisosEfectivos(role: string, permissions?: string[] | null): string[] {
  if (role === 'superadmin') return TODOS_LOS_PERMISOS
  const propios = permissions && permissions.length ? permissions : (PERMISOS_POR_ROL[role] ?? [])
  if (SOLO_LECTURA.has(role)) return propios.filter(p => PERMISOS_DE_LECTURA.has(p))
  return propios
}

export function tienePermiso(role: string, permissions: string[] | null | undefined, permiso: string): boolean {
  return permisosEfectivos(role, permissions).includes(permiso)
}
