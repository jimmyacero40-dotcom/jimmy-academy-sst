-- El responsable de acción: quien ejecuta lo que sale de un reporte.
--
-- Hasta hoy solo podía asignarse un reporte a una cuenta de administrador, así
-- que para encargarle algo al jefe de mantenimiento había que volverlo
-- administrador de toda la plataforma. La cuenta es del puesto —«Mantenimiento»,
-- «Gerencia»— y no de la persona, igual que se hizo con el almacén: si quien
-- ocupa el cargo se va, la cuenta sigue, y quién ejecutó de verdad queda escrito
-- en cada acción.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY[
    'superadmin', 'admin', 'portero', 'consulta', 'worker',
    'almacen', 'analista_sst', 'responsable'
  ])
);

-- Quien ejecuta no es quien verifica: el responsable deja constancia de lo que
-- hizo y SST lo revisa y lo cierra. Por eso la ejecución tiene sus propios
-- campos y no reescribe los que diligencia SST.
ALTER TABLE hse_reports
  ADD COLUMN IF NOT EXISTS ejecucion_descripcion text,
  ADD COLUMN IF NOT EXISTS ejecucion_at          timestamptz,
  ADD COLUMN IF NOT EXISTS ejecutado_por         uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ejecutado_por_nombre  text;

-- Para que «mis acciones» no tenga que recorrer toda la tabla.
CREATE INDEX IF NOT EXISTS hse_reports_responsable_idx
  ON hse_reports (responsable_id, estado);
