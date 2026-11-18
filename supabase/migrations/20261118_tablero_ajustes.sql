-- Ajustes del tablero que no son de una tarjeta sino de todo el conjunto.
--
-- Va en su propia tabla y no en una fila disfrazada de tarjeta: una fila con
-- `tipo = 'ajustes'` dentro de `tablero_tarjetas` habría que esquivarla en
-- cada consulta, y el día que se olvide una, el trabajador ve una tarjeta en
-- blanco en el tablero.
--
-- Una sola fila por empresa, por eso `company_id` es la llave primaria.

CREATE TABLE IF NOT EXISTS tablero_ajustes (
  company_id  uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  -- Píxeles de separación entre tarjetas.
  separacion  int NOT NULL DEFAULT 16 CHECK (separacion BETWEEN 0 AND 64),
  updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tablero_ajustes IS 'Ajustes de todo el tablero: separación entre tarjetas.';
