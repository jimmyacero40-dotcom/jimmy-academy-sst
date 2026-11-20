-- Firmas de capacitador, para anexar al pie de la lista de asistencia.
--
-- No se reutiliza `signatures`: esa es la firma personal del trabajador, con
-- su consentimiento de tratamiento de datos detrás, y se usa para acreditar
-- que él asistió. Esta es otra cosa: la rúbrica de quien dicta, que el
-- profesional de SST escoge al descargar y que puede ser de alguien que ni
-- siquiera tiene cuenta en la plataforma (un capacitador externo, la ARL).
create table if not exists firmas_capacitador (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  nombre text not null,
  cargo text,
  imagen text not null,              -- data URL (png/jpeg)
  creada_por uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists firmas_capacitador_company_idx
  on firmas_capacitador (company_id, nombre);
