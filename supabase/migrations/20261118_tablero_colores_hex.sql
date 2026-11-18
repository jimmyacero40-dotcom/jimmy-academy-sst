-- El color del texto pasa de un nombre a un color.
--
-- Antes había ocho colores con nombre —'blanco', 'verde', 'ambar'…— y el
-- programa los traducía. Ahora se guarda el color mismo, de modo que la paleta
-- pueda crecer y que se pueda escribir cualquier otro sin tocar código.
--
-- Las tarjetas ya guardadas traen el nombre viejo. Sin esto, el programa no lo
-- reconocería y les devolvería el color automático: el administrador vería su
-- anuncio cambiar de color solo, sin haber tocado nada.

UPDATE tablero_tarjetas
SET datos = jsonb_set(
  datos, '{colorTexto}',
  to_jsonb(CASE datos->>'colorTexto'
    WHEN 'blanco' THEN '#FFFFFF'
    WHEN 'oscuro' THEN '#0B1736'
    WHEN 'cian'   THEN '#22D3EE'
    WHEN 'verde'  THEN '#34D399'
    WHEN 'ambar'  THEN '#FBBF24'
    WHEN 'rojo'   THEN '#F87171'
    WHEN 'azul'   THEN '#60A5FA'
  END)
)
WHERE datos->>'colorTexto' IN ('blanco','oscuro','cian','verde','ambar','rojo','azul');

-- 'auto' era el valor por omisión; ahora eso se dice no guardando nada.
UPDATE tablero_tarjetas
SET datos = datos - 'colorTexto'
WHERE datos->>'colorTexto' = 'auto';
