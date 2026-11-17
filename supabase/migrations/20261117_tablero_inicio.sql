-- ════════════════════════════════════════════════════════════════════════════
-- Tablero de inicio — la cartelera de la empresa
-- AgroSafe · 2026-11-17
-- ════════════════════════════════════════════════════════════════════════════
--
-- Una sola tabla para todo lo que se publica en la pantalla de inicio. No hay
-- una tabla por tipo de tarjeta porque todas comparten lo mismo: un título, un
-- texto, un color, desde cuándo y hasta cuándo se ven, y a quién. Lo propio de
-- cada tipo —la hora de la pausa activa, la fecha del último accidente, la
-- lista de EPP— vive en `datos`, que es jsonb justamente para no pedir una
-- migración cada vez que se agregue un tipo de tarjeta.
--
-- Sobre RLS: este proyecto no usa Supabase Auth. La identidad la maneja
-- NextAuth contra la tabla `users`, así que dentro de Postgres `auth.uid()` es
-- siempre nulo y una política basada en él no filtraría nada. La migración
-- 20260729 ya le revocó todo acceso a `anon` y `authenticated` —postura más
-- fuerte que cualquier política— y el app entra con la llave de servicio desde
-- los route handlers. La guardia real está ahí y en el middleware.

CREATE TABLE IF NOT EXISTS tablero_tarjetas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Qué clase de tarjeta es. Define cómo se dibuja y qué campos de `datos` usa.
  tipo        text NOT NULL,

  titulo      text,
  texto       text,
  -- Palabra o número gigante detrás del anuncio principal, tipo "48h".
  destacado   text,
  cta_texto   text,
  cta_url     text,
  color       text NOT NULL DEFAULT 'cian',
  imagen_url  text,
  datos       jsonb NOT NULL DEFAULT '{}'::jsonb,

  orden       int  NOT NULL DEFAULT 0,
  activa      boolean NOT NULL DEFAULT true,

  -- Ventana de publicación. Ambas pueden ser nulas: sin fecha, se ve siempre.
  desde       timestamptz,
  hasta       timestamptz,

  -- A quién se le muestra:
  --   {"todos": true}
  --   {"centros": ["PAIPA"], "areas": ["LABORES CULTURALES"]}
  -- Centros y áreas suman: estar en cualquiera de los dos alcanza.
  audiencia   jsonb NOT NULL DEFAULT '{"todos": true}'::jsonb,

  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- La consulta del trabajador siempre pregunta lo mismo: las de mi empresa,
-- activas, ordenadas. Un índice solo de company_id obligaría a revisar también
-- las apagadas y las vencidas.
CREATE INDEX IF NOT EXISTS tablero_visible_idx
  ON tablero_tarjetas (company_id, activa, orden);

CREATE INDEX IF NOT EXISTS tablero_ventana_idx
  ON tablero_tarjetas (desde, hasta);

COMMENT ON TABLE  tablero_tarjetas IS 'Cartelera de la pantalla de inicio. Una fila = una tarjeta.';
COMMENT ON COLUMN tablero_tarjetas.datos IS 'Campos propios del tipo: hora de la pausa, fecha del último accidente, lista de EPP…';
COMMENT ON COLUMN tablero_tarjetas.destacado IS 'Número o palabra grande de fondo en el anuncio principal.';
