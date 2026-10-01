// ─── Tarjeta de reporte HSE (formato AVC-FR54) ────────────────────────
// Una sola definición de la estructura de la tarjeta, usada por el formulario
// del trabajador, la consulta de sus reportes y lo que después gestione SST.
// ──────────────────────────────────────────────────────────────────────

export interface ReporteHSE {
  id?: string
  codigo?: string
  user_id?: string

  fecha_reporte?: string | null
  lugar?: string | null
  reporta_nombre?: string | null
  reporta_cedula?: string | null
  cargo?: string | null
  area?: string | null
  centro_trabajo?: string | null

  tipos?: string[] | null
  descripcion?: string | null
  acciones_inmediatas?: string[] | null
  otra_accion?: string | null
  sugerencia_mejora?: string | null

  // Gestión posterior de SST. El trabajador no diligencia nada de esto.
  estado?: EstadoReporte
  responsable_id?: string | null
  responsable_nombre?: string | null
  fecha_asignacion?: string | null
  observaciones_sst?: string | null
  accion_intervencion?: string | null
  fecha_gestion?: string | null
  fecha_cierre?: string | null
  observaciones_cierre?: string | null
  seguimiento?: string | null
  recibe_nombre?: string | null
  recibe_firma?: string | null
  matriz_mejoras_num?: string | null
  gestionado_at?: string | null

  enviado_at?: string | null
  created_at?: string | null
}

export type EstadoReporte = 'borrador' | 'nuevo' | 'en_revision' | 'en_gestion' | 'cerrado'

/** La bandeja de SST avanza en este orden: nuevo → revisar → gestionar → cerrar. */
export const ESTADOS: Record<EstadoReporte, { label: string; color: string; paraTrabajador: string }> = {
  borrador:    { label: 'Sin enviar',   color: '#94A3B8', paraTrabajador: 'Sin enviar' },
  nuevo:       { label: 'Nuevo',        color: '#3B82F6', paraTrabajador: 'Recibido' },
  en_revision: { label: 'En revisión',  color: '#8B5CF6', paraTrabajador: 'En revisión' },
  en_gestion:  { label: 'En gestión',   color: '#F59E0B', paraTrabajador: 'En gestión' },
  cerrado:     { label: 'Cerrado',      color: '#10B981', paraTrabajador: 'Cerrado' },
}

/** Los estados que SST puede asignar; 'borrador' no es uno de ellos. */
export const ESTADOS_GESTION: EstadoReporte[] = ['nuevo', 'en_revision', 'en_gestion', 'cerrado']

/** Los ocho tipos de la tarjeta, con una explicación en palabras del trabajador. */
export const TIPOS_REPORTE: { id: string; titulo: string; ayuda: string; icono: string; color: string }[] = [
  { id: 'Acto inseguro',       titulo: 'Acto inseguro',       ayuda: 'Alguien hizo algo de forma riesgosa',             icono: '⚠️', color: '#EF4444' },
  { id: 'Condición insegura',  titulo: 'Condición insegura',  ayuda: 'Algo del sitio o del equipo está en mal estado',   icono: '🔧', color: '#F59E0B' },
  { id: 'Reporte de incidente', titulo: 'Incidente',          ayuda: 'Pasó algo que pudo terminar en accidente',         icono: '❗', color: '#F97316' },
  { id: 'Evento no deseado',   titulo: 'Evento no deseado',   ayuda: 'Ocurrió algo que no debía ocurrir',               icono: '🚨', color: '#DC2626' },
  { id: 'Rehúso de actividad', titulo: 'Rehúso de actividad', ayuda: 'Me negué a hacer una tarea por ser peligrosa',    icono: '✋', color: '#8B5CF6' },
  { id: 'Reporte ambiental',   titulo: 'Reporte ambiental',   ayuda: 'Un derrame, un residuo mal dispuesto, etc.',      icono: '🌱', color: '#059669' },
  { id: 'Sugerencia ambiental', titulo: 'Sugerencia ambiental', ayuda: 'Una idea para cuidar mejor el ambiente',        icono: '♻️', color: '#10B981' },
  { id: 'Sugerencia SST',      titulo: 'Sugerencia SST',      ayuda: 'Una idea para trabajar más seguros',              icono: '💡', color: '#3B82F6' },
]

export const ACCIONES_INMEDIATAS = [
  'Se detuvo la tarea',
  'Se corrigió de inmediato',
  'Se informó al supervisor',
  'Se señalizó o aisló el área',
]

/** Un reporte se puede enviar cuando tiene lo mínimo para ser gestionable. */
export function faltantes(r: ReporteHSE): string[] {
  const faltan: string[] = []
  if (!r.fecha_reporte) faltan.push('la fecha')
  if (!r.lugar?.trim()) faltan.push('el lugar')
  if (!(r.tipos ?? []).length) faltan.push('el tipo de reporte')
  if (!r.descripcion?.trim()) faltan.push('la descripción de lo que sucedió')
  return faltan
}

export const puedeEnviarse = (r: ReporteHSE) => faltantes(r).length === 0
