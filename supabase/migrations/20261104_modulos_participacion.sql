-- Módulos de participación hechos por la empresa.
--
-- Hasta hoy "Participación de trabajadores" era una sola encuesta escrita a
-- mano en el código: la identificación de peligros. Esto permite que el
-- superadmin arme otras consultas —clima laboral, inspecciones, lo que
-- necesite— con sus propias preguntas, sin tocar el código.
--
-- La identificación de peligros se queda aparte, como está: tiene su PDF, su
-- Excel y su tabulación por la GTC 45, que no se pueden sacar de una encuesta
-- genérica sin perderlos.

create table if not exists modulos (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  nombre        text not null,
  descripcion   text,
  color         text not null default '#8B5CF6',
  periodo       integer not null,
  -- borrador: se está armando y nadie lo ve. abierto: recibe respuestas.
  -- cerrado: se ve lo respondido pero ya no entra nada.
  estado        text not null default 'borrador',
  -- A quién le aparece. 'todos', o el nombre de un área, cargo o finca.
  dirigido_a    text not null default 'todos',
  dirigido_valor text,
  motivo_cierre text,
  creado_por        uuid,
  creado_por_nombre text,
  estado_cambiado_at    timestamptz,
  estado_cambiado_por_nombre text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint modulos_estado check (estado in ('borrador', 'abierto', 'cerrado')),
  constraint modulos_dirigido check (dirigido_a in ('todos', 'area', 'cargo', 'finca'))
);

create index if not exists modulos_empresa on modulos (company_id, periodo);

create table if not exists modulo_preguntas (
  id          uuid primary key default gen_random_uuid(),
  modulo_id   uuid not null references modulos(id) on delete cascade,
  orden       integer not null,
  titulo      text not null,
  ayuda       text,
  -- texto: una línea. parrafo: varias. opcion: una de la lista.
  -- multiple: varias de la lista. si_no, numero, fecha, escala (1 a 5),
  -- confirmacion: la casilla de "confirmo que esto es mío y es verdad".
  tipo        text not null default 'parrafo',
  opciones    jsonb not null default '[]'::jsonb,
  obligatoria boolean not null default true,
  placeholder text,
  constraint modulo_preguntas_tipo check (tipo in
    ('texto', 'parrafo', 'opcion', 'multiple', 'si_no', 'numero', 'fecha', 'escala', 'confirmacion'))
);

create index if not exists modulo_preguntas_modulo on modulo_preguntas (modulo_id, orden);

create table if not exists modulo_respuestas (
  id          uuid primary key default gen_random_uuid(),
  modulo_id   uuid not null references modulos(id) on delete cascade,
  user_id     uuid not null,
  company_id  uuid not null,
  estado      text not null default 'borrador',
  -- Las respuestas, con el id de la pregunta como llave. Se guarda así y no en
  -- columnas porque cada módulo tiene las preguntas que su autor quiso.
  respuestas  jsonb not null default '{}'::jsonb,
  -- La foto del trabajador en el momento de enviar: lo que vale para el
  -- histórico es lo que era entonces, no lo que diga hoy su ficha.
  trabajador_nombre text,
  trabajador_cedula text,
  cargo             text,
  area              text,
  centro_trabajo    text,
  enviado_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint modulo_respuestas_estado check (estado in ('borrador', 'enviado')),
  constraint modulo_respuestas_unico unique (modulo_id, user_id)
);

create index if not exists modulo_respuestas_modulo on modulo_respuestas (modulo_id, estado);

alter table modulos           enable row level security;
alter table modulo_preguntas  enable row level security;
alter table modulo_respuestas enable row level security;

-- Todo pasa por el servidor con la llave de servicio, igual que el resto.
do $$
declare t text;
begin
  foreach t in array array['modulos', 'modulo_preguntas', 'modulo_respuestas'] loop
    if not exists (
      select 1 from pg_policies where tablename = t and policyname = t || '_servicio'
    ) then
      execute format('create policy %I on %I for all using (false) with check (false)',
        t || '_servicio', t);
    end if;
  end loop;
end $$;
