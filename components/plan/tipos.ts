// Tipos y etiquetas compartidos por la pantalla del Plan Anual.

export interface Tema {
  id: number
  title: string
  duration: string | null
  category: string | null
  /** Obligatorio según el perfil activo, o por categoría cuando no hay perfil. */
  obligatorio: boolean
}

export interface PlanItem {
  id: string
  plan_id?: string
  month: number
  scheduled_date: string | null
  end_date: string | null
  periodicity: string
  required: boolean
  valid_days: number | null
  estado: string
  reinduccion: boolean
  observaciones: string | null
  modalidad: string
  trainings: { id: number; title: string; duration: string | null; category: string | null }
  plan_item_targets: { id: string; target_type: string; target_id: string | null }[]
}

export const ESTADOS = ['pendiente', 'programada', 'en_curso', 'completada', 'cancelada', 'postergada']

export const ESTADO_NOMBRE: Record<string, string> = {
  pendiente: 'Pendiente', programada: 'Programada', en_curso: 'En curso',
  completada: 'Completada', cancelada: 'Cancelada', postergada: 'Postergada',
}

export const ESTADO_COLOR: Record<string, string> = {
  pendiente: '#6B7280', programada: 'var(--primary)', en_curso: '#F59E0B',
  completada: '#10B981', cancelada: '#EF4444', postergada: '#8B5CF6',
}

export const PERIODICIDADES = ['once', 'monthly', 'quarterly', 'biannual', 'annual']

export const PERIODICIDAD_NOMBRE: Record<string, string> = {
  once: 'Una vez', monthly: 'Mensual', quarterly: 'Trimestral',
  biannual: 'Semestral', annual: 'Anual',
}

const COLOR_CATEGORIA: Record<string, string> = {
  'SST': '#10B981', 'Seguridad': '#EF4444', 'Salud': '#EC4899',
  'Ambiental': '#84CC16', 'Calidad': 'var(--primary)', 'Alturas': '#F59E0B',
  'Primeros Auxilios': '#F97316', 'Obligatorio': '#F59E0B',
  'Induccion': '#06B6D4', 'Especializado': '#8B5CF6',
}

export function colorCategoria(categoria: string | null): string {
  return COLOR_CATEGORIA[categoria ?? ''] ?? '#8B5CF6'
}
