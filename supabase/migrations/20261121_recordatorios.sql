-- 1. La ventana de Tú Cuentas: desde cuándo y hasta cuándo se puede responder.
--
-- Hasta ahora el periodo se abría y se cerraba a mano. Eso obliga a acordarse
-- de cerrarlo el día exacto, y si a uno se le pasa, sigue entrando respuesta
-- después del corte. Con las fechas el periodo se cierra solo.
alter table participacion_periodos add column if not exists abre date;
alter table participacion_periodos add column if not exists cierra date;

-- 2. Los recordatorios enviados.
--
-- Queda constancia de a quién se le avisó, cuándo y si el correo salió. Sirve
-- para dos cosas: no volver a escribirle al mismo tres veces el mismo día, y
-- poder mostrarle a una auditoría que sí se convocó a la gente.
create table if not exists recordatorios (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  modulo text not null,                  -- 'sociodemografica', 'tu-cuentas', …
  periodo integer,                       -- el año, cuando el módulo lo tiene
  user_id uuid references users(id) on delete cascade,
  enviado_a text,                        -- la dirección a la que salió
  enviado boolean not null default false,
  motivo text,                           -- por qué no salió, si no salió
  mensaje text,                          -- la nota que escribió el administrador
  enviado_por uuid references users(id) on delete set null,
  enviado_por_nombre text,
  created_at timestamptz not null default now()
);

create index if not exists recordatorios_busqueda_idx
  on recordatorios (company_id, modulo, user_id, created_at desc);
