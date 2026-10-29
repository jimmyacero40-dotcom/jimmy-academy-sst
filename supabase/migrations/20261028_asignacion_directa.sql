-- Asignar una capacitación directamente a unas personas, sin pasar por los
-- Perfiles de Formación.
--
-- No hace falta tabla nueva: la cadena annual_plans → plan_items →
-- plan_item_targets → enrollments ya cubre el caso, y `plan_item_targets`
-- ya admite target_type = 'user'.

-- De dónde salió el ítem del plan.
--
-- Hace falta distinguirlos: al activar un plan, la rutina reparte cada ítem
-- entre quienes digan sus targets. Un ítem nacido de una asignación nominal
-- no debe reprocesarse como si fuera parte del plan del año, porque podría
-- terminar alcanzando a gente que nadie eligió.
alter table plan_items
  add column if not exists origen text not null default 'plan';

comment on column plan_items.origen is
  'plan = planeado para el año | asignacion_directa = creado al asignar a personas concretas';

-- Reasignar a la misma persona no debe acumular filas.
--
-- Sobre columnas planas y no sobre una expresión: un upsert solo puede
-- engancharse a un índice de columnas. Con `coalesce(...)` el índice existía
-- pero el upsert no lo encontraba, fallaba en silencio y los destinatarios no
-- se guardaban.
--
-- target_id solo es nulo cuando target_type = 'all', y ahí no hay nada que
-- duplicar: es una sola fila por ítem.
create unique index if not exists plan_item_targets_unico
  on plan_item_targets (plan_item_id, target_type, target_id);
