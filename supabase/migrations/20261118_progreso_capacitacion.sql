-- Dónde quedó cada quien dentro de la capacitación.
--
-- Hasta ahora no se guardaba nada: el trabajador avanzaba veinte diapositivas,
-- salía, volvía a entrar y empezaba en la primera. La barra de progreso medía
-- bien dentro de la sesión, pero no había sesión que durara.
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS progreso int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progreso_total int,
  ADD COLUMN IF NOT EXISTS progreso_at timestamptz;

COMMENT ON COLUMN enrollments.progreso IS 'Última diapositiva vista, contando desde 1.';
COMMENT ON COLUMN enrollments.progreso_total IS 'Cuántas tenía el curso cuando se guardó, para que el porcentaje no mienta si cambia el material.';
