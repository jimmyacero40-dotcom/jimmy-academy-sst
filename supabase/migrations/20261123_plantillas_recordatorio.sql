-- El texto del recordatorio de cada módulo, escrito por quien lo manda.
--
-- La plataforma trae un texto por defecto para que funcione desde el primer
-- día, pero quien conoce a su gente es el profesional de SST: él sabe si le
-- habla de usted o de tú, si cita la resolución o si pide el favor. Lo que
-- guarde aquí reemplaza al de fábrica para ese módulo y esa empresa.
create table if not exists recordatorio_plantillas (
  company_id uuid not null references companies(id) on delete cascade,
  modulo text not null,                    -- 'sociodemografica', 'modulo:<id>', …
  asunto text,
  frase text,
  boton text,
  actualizado_at timestamptz not null default now(),
  actualizado_por_nombre text,
  primary key (company_id, modulo)
);
