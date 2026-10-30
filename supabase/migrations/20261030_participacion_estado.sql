-- Abrir y cerrar la participación de un periodo.
--
-- Sin esto la participación quedaba abierta para siempre: no había manera de
-- decir "el plazo del 2026 se cerró" y el trabajador podía seguir respondiendo
-- meses después de que el consolidado ya se hubiera reportado.
--
-- Una fila por empresa y año. Si no hay fila, el periodo está abierto: así los
-- años que ya existen siguen funcionando igual que hasta hoy.

create table if not exists participacion_periodos (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete cascade,
  periodo           integer not null,
  estado            text not null default 'abierto',   -- abierto | cerrado
  motivo            text,
  cambiado_at       timestamptz not null default now(),
  cambiado_por      uuid,
  cambiado_por_nombre text,
  constraint participacion_periodos_estado check (estado in ('abierto', 'cerrado')),
  constraint participacion_periodos_unico  unique (company_id, periodo)
);

alter table participacion_periodos enable row level security;

-- Solo se toca con la llave de servicio, igual que el resto del módulo.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'participacion_periodos' and policyname = 'participacion_periodos_servicio'
  ) then
    create policy participacion_periodos_servicio on participacion_periodos
      for all using (false) with check (false);
  end if;
end $$;
