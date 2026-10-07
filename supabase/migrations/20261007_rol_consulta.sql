-- Rol de consulta: cuentas de solo lectura.
--
-- Hasta ahora, para que alguien pudiera mirar el movimiento de las porterías
-- había que darle rol de portero. Pero el alcance de lo que se veía se decidía
-- por el rol y por las porterías asignadas, así que al quitarle "registrar
-- ingresos" y "registrar salidas" dejaba de ver los movimientos, que era justo
-- lo único que necesitaba.
--
-- El rol 'consulta' consulta el movimiento de toda la empresa sin tener ninguna
-- portería asignada, mediante el permiso 'accesos.ver.todas', y no puede
-- registrar nada. El comportamiento del portero no cambia.

alter table users drop constraint if exists users_role_check;

alter table users add constraint users_role_check
  check (role = any (array['superadmin', 'admin', 'portero', 'consulta', 'worker']));
