import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

/**
 * Formación automática del trabajador nuevo.
 *
 * Qué recibe se define en un perfil de formación —el "perfil de ingreso"— y no
 * en el código: el responsable de SST arrastra cursos a ese perfil y los que
 * entren después los reciben solos. Hoy ese perfil contiene la inducción;
 * mañana puede contener lo que haga falta, sin tocar nada aquí.
 *
 * Si la empresa no tiene perfil de ingreso, se recurre al curso marcado como
 * inducción, para que siga funcionando sin configurar nada.
 *
 * Se apoya en enrollments, que es lo que ya usa SSTudio: la formación aparece
 * en el plan del trabajador como cualquier otra y conserva su trazabilidad.
 */

/**
 * La fecha límite es el último día del mes en curso.
 *
 * El plan del trabajador agrupa por mes y deja bloqueadas, bajo "Próximamente",
 * las capacitaciones que vencen más adelante. Con un plazo de 30 días la
 * inducción caía al mes siguiente y el trabajador la veía con candado el día
 * que entraba, que es justo lo contrario de lo que debe pasar.
 */
function finDeMes(): string {
  const h = new Date()
  return new Date(h.getFullYear(), h.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export interface ResultadoAsignacion {
  /** Cuántas se crearon ahora. */
  creadas: number
  /** Cuántas ya tenía. */
  existentes: number
  cursos: number[]
  motivo: 'asignada' | 'ya_la_tenia' | 'sin_configurar' | 'error'
  detalle?: string
}

/** El perfil de formación que reciben los trabajadores nuevos. */
export async function perfilDeIngreso(companyId: string): Promise<string | null> {
  const { data: empresa } = await supabase
    .from('companies').select('perfil_ingreso_id').eq('id', companyId).maybeSingle()
  if (empresa?.perfil_ingreso_id) return empresa.perfil_ingreso_id

  // Sin configurar: se busca por nombre el perfil de ingreso habitual.
  const { data: perfil } = await supabase
    .from('training_profiles').select('id')
    .eq('company_id', companyId).ilike('name', '%inducc%')
    .order('created_at').limit(1).maybeSingle()

  return perfil?.id ?? null
}

/** Los cursos que debe recibir un trabajador nuevo, vengan del perfil o no. */
export async function cursosDeIngreso(companyId: string): Promise<number[]> {
  const perfilId = await perfilDeIngreso(companyId)

  if (perfilId) {
    const { data } = await supabase
      .from('profile_trainings').select('training_id')
      .eq('profile_id', perfilId).order('sort_order')
    const ids = (data ?? []).map(x => x.training_id)
    if (ids.length) return ids
  }

  // Respaldo: el curso marcado como inducción para esa empresa.
  const { data: empresa } = await supabase
    .from('companies').select('induccion_training_id').eq('id', companyId).maybeSingle()
  if (empresa?.induccion_training_id) return [empresa.induccion_training_id]

  const { data: curso } = await supabase
    .from('trainings').select('id')
    .eq('company_id', companyId).eq('status', 'activo')
    .or('category.ilike.%induc%,title.ilike.%inducc%')
    .order('id').limit(1).maybeSingle()

  return curso ? [curso.id] : []
}

/**
 * Le asigna al trabajador la formación de ingreso. Es idempotente: lo que ya
 * tenga no se duplica, así que se puede llamar las veces que haga falta.
 */
export async function asignarInduccion(userId: string, companyId: string): Promise<ResultadoAsignacion> {
  const cursos = await cursosDeIngreso(companyId)
  if (!cursos.length) {
    return { creadas: 0, existentes: 0, cursos: [], motivo: 'sin_configurar' }
  }

  const { data: yaTiene } = await supabase
    .from('enrollments').select('training_id')
    .eq('user_id', userId).in('training_id', cursos)
  const suyos = new Set((yaTiene ?? []).map(e => e.training_id))

  const faltantes = cursos.filter(id => !suyos.has(id))
  if (!faltantes.length) {
    return { creadas: 0, existentes: suyos.size, cursos, motivo: 'ya_la_tenia' }
  }

  const vence = finDeMes()
  const { data, error } = await supabase.from('enrollments').insert(
    faltantes.map(training_id => ({
      user_id: userId, training_id, company_id: companyId,
      status: 'pending', due_date: vence,
    })),
  ).select('id')

  if (error) {
    // 23505: dos procesos a la vez; el otro ya las creó.
    if (error.code === '23505') {
      return { creadas: 0, existentes: cursos.length, cursos, motivo: 'ya_la_tenia' }
    }
    return { creadas: 0, existentes: suyos.size, cursos, motivo: 'error', detalle: error.message }
  }

  return { creadas: data?.length ?? faltantes.length, existentes: suyos.size, cursos, motivo: 'asignada' }
}

/** Cómo va la inducción de un trabajador, para el lado administrativo. */
export async function estadoInduccion(userId: string, companyId: string) {
  const cursos = await cursosDeIngreso(companyId)
  if (!cursos.length) return null

  const { data } = await supabase.from('enrollments')
    .select('id, training_id, status, started_at, completed_at, score, due_date, created_at')
    .eq('user_id', userId).in('training_id', cursos)

  return data ?? null
}

export const ETIQUETA_INDUCCION: Record<string, string> = {
  pending: 'Inducción pendiente',
  in_progress: 'Inducción en progreso',
  completed: 'Inducción completada',
  expired: 'Inducción vencida',
}
