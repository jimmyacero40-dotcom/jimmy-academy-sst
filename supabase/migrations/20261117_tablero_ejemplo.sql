-- Contenido de arranque del tablero de inicio.
--
-- Son ejemplos reales de la operación para que la pantalla no nazca vacía y se
-- vea cómo queda cada tipo de tarjeta. El administrador los edita o los apaga
-- desde la misma pantalla. Se inserta una sola vez: si ya hay tarjetas, no
-- toca nada, para no volver a meter los ejemplos cada vez que corra la
-- migración ni pisar lo que ya haya escrito la empresa.

DO $$
DECLARE
  empresa uuid;
BEGIN
  SELECT id INTO empresa FROM companies WHERE name = 'AgroVenture Capital' LIMIT 1;
  IF empresa IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM tablero_tarjetas WHERE company_id = empresa) THEN RETURN; END IF;

  INSERT INTO tablero_tarjetas (company_id, tipo, titulo, texto, destacado, color, datos, orden) VALUES
  (empresa, 'anuncio',
   'Fumigación en el lote 4 este jueves: zona restringida 48 h',
   'Nadie entra sin traje, respirador con filtro para vapores orgánicos y guantes de nitrilo. Respete la señalización roja hasta el sábado a las 6:00 a. m.',
   '48h', 'cian', '{}'::jsonb, 1),

  (empresa, 'contador', 'Récord del equipo', NULL, NULL, 'verde',
   jsonb_build_object('desde_contador', to_char(current_date - 127, 'YYYY-MM-DD'), 'meta', 150), 2),

  (empresa, 'alerta',
   'Helada probable mañana a las 5:00 a. m.',
   'Ropa térmica y guantes para la cosecha temprana.',
   NULL, 'rojo', '{}'::jsonb, 3),

  (empresa, 'capacitaciones', 'Próximas capacitaciones', NULL, NULL, 'cian', '{}'::jsonb, 4),

  (empresa, 'pausa', 'Pausa activa',
   'Estiramiento de espalda y muñecas · 5 minutos',
   NULL, 'cian', '{"hora": "10:30 a. m."}'::jsonb, 5),

  (empresa, 'formacion', 'Mi formación', NULL, NULL, 'cian', '{}'::jsonb, 6),

  (empresa, 'reconocimiento',
   'Cuadrilla de cosecha de Duitama',
   'Reportaron 6 condiciones inseguras antes de que causaran un incidente.',
   NULL, 'verde', '{}'::jsonb, 7),

  (empresa, 'epp', 'EPP de hoy',
   'Revise que estén en buen estado antes de salir a campo.',
   NULL, 'ambar', '{"items": ["Botas", "Guantes", "Gorra", "Gafas UV"]}'::jsonb, 8);

  INSERT INTO tablero_tarjetas (company_id, tipo, titulo, texto, color, cta_texto, cta_url, orden) VALUES
  (empresa, 'copasst', 'COPASST',
   'Reunión del comité el 25 de noviembre · deje su propuesta en el buzón',
   'azul', 'Enviar propuesta', '/dashboard/reportal/nuevo', 9);
END $$;
