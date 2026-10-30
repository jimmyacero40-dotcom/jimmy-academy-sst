import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

// ─── El rastro de lo que se hace con una capacitación del plan ────────
// Quitar a alguien, anotar una asistencia, cancelar o reprogramar no pueden
// ser cambios mudos: el SG-SST se audita y hay que poder decir quién, cuándo
// y por qué. Guardar el detalle completo además deja devolver lo retirado tal
// como estaba.
// ──────────────────────────────────────────────────────────────────────

export type AccionPlan =
  | 'asignar' | 'retirar' | 'restaurar' | 'asistencia'
  | 'notificar' | 'cancelar' | 'reprogramar'

export async function anotar(
  planItemId: string,
  accion: AccionPlan,
  datos: { motivo?: string | null; detalle?: unknown; usuarioId?: string | null; usuarioNombre?: string | null },
) {
  // Que falle la anotación no puede tumbar la operación que la originó: se
  // registra lo que se pueda y la acción sigue su curso.
  const { error } = await supabase.from('plan_item_auditoria').insert({
    plan_item_id: planItemId,
    accion,
    motivo: datos.motivo ?? null,
    detalle: datos.detalle ?? null,
    usuario_id: datos.usuarioId ?? null,
    usuario_nombre: datos.usuarioNombre ?? null,
  })
  if (error) console.error('[auditoria]', accion, error.message)
}
