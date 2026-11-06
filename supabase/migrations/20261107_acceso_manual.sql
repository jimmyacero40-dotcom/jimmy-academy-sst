-- Un movimiento que no se marcó en su momento y hay que dejar registrado.
--
-- Pasa: alguien entra y en portería se olvidó marcarlo. El movimiento existió
-- y el SG-SST necesita la trazabilidad, así que se registra después con las
-- horas reales. Pero no puede confundirse con lo que sí se marcó en el
-- momento: por eso queda señalado como manual, con quién lo hizo y por qué.

alter table access_logs add column if not exists manual        boolean not null default false;
alter table access_logs add column if not exists manual_motivo text;
alter table access_logs add column if not exists manual_por    uuid;
alter table access_logs add column if not exists manual_at     timestamptz;

comment on column access_logs.manual is
  'true cuando el movimiento se registró después, a mano, y no en la portería en el momento.';
comment on column access_logs.manual_motivo is
  'Por qué hubo que registrarlo a mano. Es lo que sustenta el registro ante una auditoría.';

create index if not exists access_logs_manual on access_logs (company_id) where manual;
