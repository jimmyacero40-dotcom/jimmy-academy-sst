-- Que un perfil tenga gente de verdad.
--
-- Hasta hoy el perfil guardaba un cargo suelto en texto, escrito a mano, que
-- no coincidía con ningún cargo real: los cinco perfiles de la empresa tenían
-- cero personas dentro. Por eso asignar una capacitación nunca podía alimentar
-- el perfil, ni el perfil podía decir a quién le toca.
--
-- Ahora un perfil agrupa varios cargos, escogidos de los que de verdad existen,
-- y además se puede meter o sacar a una persona concreta sin tocar su cargo.

create table if not exists profile_cargos (
  profile_id uuid not null references training_profiles(id) on delete cascade,
  cargo      text not null,
  primary key (profile_id, cargo)
);

-- Para "qué perfiles le tocan a este cargo", que es la consulta de cada día.
create index if not exists profile_cargos_cargo on profile_cargos (cargo);

create table if not exists profile_excepciones (
  profile_id uuid not null references training_profiles(id) on delete cascade,
  user_id    uuid not null,
  -- true: entra aunque su cargo no esté. false: no entra aunque su cargo esté.
  incluir    boolean not null,
  motivo     text,
  creado_por_nombre text,
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);

-- El cargo que ya estaba escrito se conserva como primer cargo del perfil: es
-- dato del usuario, aunque hoy no calce con nadie.
insert into profile_cargos (profile_id, cargo)
select id, trim(cargo) from training_profiles
where cargo is not null and trim(cargo) <> ''
on conflict do nothing;

alter table profile_cargos      enable row level security;
alter table profile_excepciones enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profile_cargos', 'profile_excepciones'] loop
    if not exists (
      select 1 from pg_policies where tablename = t and policyname = t || '_servicio'
    ) then
      execute format('create policy %I on %I for all using (false) with check (false)',
        t || '_servicio', t);
    end if;
  end loop;
end $$;
