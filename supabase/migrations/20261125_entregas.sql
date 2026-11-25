-- Entregas de elementos al trabajador.
--
-- Nace por la bebida hidratante del personal que fumiga, pero no se construye
-- para la bebida: es la misma forma que entregar un EPP, la dotación o el
-- protector solar, y el menú ya tenía «EPP» esperando. Quien entrega define
-- qué entrega.
--
-- La entrega se registra cuando ocurre; no se programa. Si un día no
-- aplicaron, no hay entrega y no falta nada. La periodicidad del tipo es solo
-- para saber a quién le hace falta hoy, no para exigir nada.

create table if not exists entrega_tipos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  nombre text not null,
  descripcion text,
  -- Lo que se entrega de verdad: marca, presentación, lote. Se propone en
  -- cada entrega y allí se puede cambiar, porque el lote cambia.
  referencia text,
  unidad text not null default 'unidad',          -- sobre, par, unidad…
  periodicidad text not null default 'ninguna',   -- diaria | semanal | mensual | ninguna
  activo boolean not null default true,
  creado_por uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entregas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  tipo_id uuid not null references entrega_tipos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  cantidad numeric(10,2) not null default 1,
  -- La referencia de lo que salió ese día. Se copia del tipo y se puede
  -- cambiar: el soporte tiene que decir qué se entregó, no qué se suele
  -- entregar.
  referencia text,
  entregado_at timestamptz not null default now(),
  entregado_por uuid references users(id) on delete set null,
  entregado_por_nombre text,
  -- La firma del trabajador tal como estaba el día de la entrega. Se guarda
  -- copiada y no por referencia: si mañana cambia su firma, el soporte de
  -- ayer no puede cambiar con ella.
  firma text,
  observacion text,
  created_at timestamptz not null default now()
);

create index if not exists entregas_busqueda_idx
  on entregas (company_id, tipo_id, entregado_at desc);
create index if not exists entregas_persona_idx
  on entregas (user_id, tipo_id, entregado_at desc);

-- El primero, que es el que motivó todo esto.
insert into entrega_tipos (company_id, nombre, descripcion, unidad, periodicidad)
select c.id, 'Bebida hidratante',
       'Sobre de hidratación para el personal que realiza aplicación de agroquímicos',
       'sobre', 'diaria'
from companies c
where not exists (
  select 1 from entrega_tipos t
  where t.company_id = c.id and lower(t.nombre) = 'bebida hidratante'
);
