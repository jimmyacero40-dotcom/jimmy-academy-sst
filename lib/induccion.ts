import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

/**
 * Asignación automática de la inducción a todo trabajador nuevo.
 *
 * Se apoya en lo que ya existe —la tabla enrollments de SSTudio— en vez de
 * montar un sistema paralelo: la inducción aparece en el plan del trabajador
 * igual que cualquier otra capacitación, y la trazabilidad (estado, avance,
 * resultado, fecha de finalización) es la misma de siempre.
 *
 * Cuál es el curso de inducción se configura por empresa en
 * companies.induccion_training_id, no está escrito a mano en el código.
 */

/**
 * La fecha límite es el último día del mes en curso.
 *
 * No es un capricho: el plan del trabajador agrupa por mes y deja bloqueadas,
 * bajo "Próximamente", las capacitaciones que vencen más adelante. Con un
 * plazo de 30 días la inducción caía al mes siguiente y el trabajador la veía
 * con candado el día que entraba, que es justo lo contrario de lo que debe
 * pasar: tiene que poder hacerla de una vez.
 */
function finDeMes(): string {
  const h = new Date()
  return new Date(h.getFullYear(), h.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export interface ResultadoAsignacion {
  asignada: boolean
  motivo: 'creada' | 'ya_tenia' | 'sin_curso_configurado' | 'error'
  trainingId?: number
  enrollmentId?: string
  detalle?: string
}

/**
 * El curso configurado como inducción. Si la empresa no lo tiene definido,
 * se usa el curso activo marcado como inducción, de modo que funcione desde
 * el primer día sin configurar nada.
 */
export async function cursoDeInduccion(companyId: string): Promise<number | null> {
  const { data: empresa } = await supabase
    .from('companies').select('induccion_training_id').eq('id', companyId).maybeSingle()
  if (empresa?.induccion_training_id) return empresa.induccion_training_id

  const { data: curso } = await supabase
    .from('trainings').select('id')
    .eq('company_id', companyId).eq('status', 'activo')
    .or('category.ilike.%induc%,title.ilike.%inducc%')
    .order('id').limit(1).maybeSingle()

  return curso?.id ?? null
}

/**
 * Le asigna la inducción a un trabajador. Es idempotente: si ya la tiene,
 * no crea una segunda. Se puede llamar las veces que haga falta.
 */
export async function asignarInduccion(userId: string, companyId: string): Promise<ResultadoAsignacion> {
  const trainingId = await cursoDeInduccion(companyId)
  if (!trainingId) {
    return { asignada: false, motivo: 'sin_curso_configurado' }
  }

  // Si ya la tiene —por esta vía o puesta a mano— no se toca.
  const { data: existente } = await supabase
    .from('enrollments').select('id')
    .eq('user_id', userId).eq('training_id', trainingId).limit(1).maybeSingle()

  if (existente) {
    return { asignada: false, motivo: 'ya_tenia', trainingId, enrollmentId: existente.id }
  }

  const { data, error } = await supabase.from('enrollments').insert({
    user_id: userId,
    training_id: trainingId,
    company_id: companyId,
    status: 'pending',
    due_date: finDeMes(),
  }).select('id').single()

  if (error) {
    // 23505: dos procesos a la vez intentaron asignarla. El otro ya la creó.
    if (error.code === '23505') {
      const { data: suya } = await supabase.from('enrollments').select('id')
        .eq('user_id', userId).eq('training_id', trainingId).limit(1).maybeSingle()
      return { asignada: false, motivo: 'ya_tenia', trainingId, enrollmentId: suya?.id }
    }
    return { asignada: false, motivo: 'error', trainingId, detalle: error.message }
  }

  return { asignada: true, motivo: 'creada', trainingId, enrollmentId: data.id }
}

/**
 * Cómo va la inducción de un trabajador, para mostrarlo del lado administrativo.
 * Devuelve null si no la tiene asignada.
 */
export async function estadoInduccion(userId: string, companyId: string) {
  const trainingId = await cursoDeInduccion(companyId)
  if (!trainingId) return null

  const { data } = await supabase.from('enrollments')
    .select('id, status, started_at, completed_at, score, due_date, created_at')
    .eq('user_id', userId).eq('training_id', trainingId).limit(1).maybeSingle()

  return data ?? null
}

/** Lo que entiende una persona, sin jerga del sistema. */
export const ETIQUETA_INDUCCION: Record<string, string> = {
  pending: 'Inducción pendiente',
  in_progress: 'Inducción en progreso',
  completed: 'Inducción completada',
  expired: 'Inducción vencida',
}
