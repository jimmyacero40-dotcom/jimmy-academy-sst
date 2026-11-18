-- Que las tarjetas de una misma fila queden del mismo alto.
--
-- Con `align-items: start` cada una medía lo que midiera su contenido, así que
-- dos avisos uno al lado del otro quedaban desparejos y no había forma de
-- cuadrarlos: arrastrar el alto de uno no movía el del otro.
ALTER TABLE tablero_ajustes
  ADD COLUMN IF NOT EXISTS igualar boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN tablero_ajustes.igualar IS 'Las tarjetas de una fila comparten el alto de la más alta.';
