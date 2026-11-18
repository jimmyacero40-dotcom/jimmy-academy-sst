-- El nombre del tipo deja de ser el título visible.
--
-- Al crear una tarjeta se le ponía como título el nombre de su tipo —«Banner»,
-- «Póster», «Nota libre»— para poder reconocerla en la lista. Pero el título
-- es texto que lee el trabajador, así que la palabra «Banner» terminaba
-- escrita en la pantalla de todo el personal, ocupando un renglón entero.
--
-- Ahora ese nombre vive aparte, en `datos.nombre`, y solo lo ve quien
-- administra. Esta migración mueve los que ya estaban: solo los que son
-- exactamente el nombre de un tipo, porque un título que alguien escribió a
-- mano es contenido y no se toca.

UPDATE tablero_tarjetas
SET datos = jsonb_set(datos, '{nombre}', to_jsonb(titulo)),
    titulo = NULL
WHERE titulo IN (
  'Anuncio principal', 'Póster', 'Banner', 'Bloque de texto', 'Separador',
  'Días sin accidentes', 'Alerta', 'Próximas capacitaciones', 'Pausa activa',
  'Mi formación', 'Reconocimiento', 'EPP de hoy', 'COPASST', 'Nota libre'
)
AND (datos->>'nombre') IS NULL;
