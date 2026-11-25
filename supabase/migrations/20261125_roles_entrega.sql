-- Los dos roles de oficio: el almacén y el analista de SST.
--
-- La restricción traía la lista de roles válidos escrita a mano, así que
-- agregarlos en el código no bastaba: la base rechazaba la cuenta con
-- «violates check constraint users_role_check» justo al crearla.
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check
  check (role = any (array[
    'superadmin', 'admin', 'portero', 'consulta', 'worker',
    'almacen', 'analista_sst'
  ]));
