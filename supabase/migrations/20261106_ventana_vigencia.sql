-- La ronda de una capacitación dura un tiempo y después se cierra.
--
-- Hasta ahora una asignación quedaba abierta para siempre, así que el
-- asistente bloqueaba a esa persona con "Ya la tiene" aunque hubiera pasado
-- medio año. Con una ventana, al vencerse la ronda se cierra: quien no fue
-- queda en "No asistió", y todos quedan libres para que en un mes posterior
-- se les pueda asignar un refuerzo sin pelear con la ronda vieja.

alter table plan_items add column if not exists dias_vigencia integer;
alter table plan_items add column if not exists cerrado_at    timestamptz;

comment on column plan_items.dias_vigencia is
  'Cuántos días queda abierta la ronda desde la fecha programada. Lo que de verdad manda es end_date; esto queda para saber con qué número se calculó.';
comment on column plan_items.cerrado_at is
  'Cuándo se cerró la ronda por vencimiento. Nulo mientras siga abierta.';

-- Buscar lo vencido es lo que se hace a cada rato, y sin esto toca leer todo.
create index if not exists plan_items_por_vencer
  on plan_items (end_date) where end_date is not null;
