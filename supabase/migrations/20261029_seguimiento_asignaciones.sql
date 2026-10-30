-- Seguimiento de las capacitaciones asignadas.
--
-- Hasta ahora una inscripción solo sabía estar pendiente, en curso o
-- completada. Eso alcanza para la capacitación que se hace en la plataforma,
-- pero no para la que se dicta en el campo: ahí lo que hay que anotar es si la
-- persona asistió, no asistió o estaba excusada, y quién lo anotó.

alter table enrollments
  add column if not exists asistencia      text,   -- asistio | no_asistio | excusado
  add column if not exists asistencia_nota text,
  add column if not exists asistencia_at   timestamptz,
  add column if not exists asistencia_por  uuid,
  add column if not exists notificado_at   timestamptz,
  add column if not exists notificacion_error text;

comment on column enrollments.asistencia is
  'Lo que pasó el día de la capacitación, anotado a mano. Distinto de status, que es el avance dentro de la plataforma.';

-- ── Qué se hizo con cada capacitación del plan y por qué ──
--
-- Quitar a alguien o cancelar una capacitación no puede ser un dato que
-- desaparece: el SG-SST se audita, y "aquí decía doce personas y ahora dice
-- nueve" tiene que poder explicarse. `detalle` guarda lo retirado completo,
-- para poder devolverlo tal cual.
create table if not exists plan_item_auditoria (
  id              uuid primary key default gen_random_uuid(),
  plan_item_id    uuid not null references plan_items(id) on delete cascade,
  accion          text not null,   -- asignar | retirar | asistencia | notificar | cancelar | reprogramar
  motivo          text,
  detalle         jsonb,
  usuario_id      uuid,
  usuario_nombre  text,
  created_at      timestamptz not null default now()
);

create index if not exists plan_item_auditoria_item
  on plan_item_auditoria (plan_item_id, created_at desc);

alter table plan_item_auditoria enable row level security;

-- Solo se lee y se escribe desde el servidor, con la llave de servicio.
drop policy if exists plan_item_auditoria_servicio on plan_item_auditoria;
create policy plan_item_auditoria_servicio on plan_item_auditoria
  for all using (false) with check (false);
