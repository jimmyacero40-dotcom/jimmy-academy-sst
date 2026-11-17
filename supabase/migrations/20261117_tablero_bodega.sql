-- Bodega de imágenes del tablero.
--
-- Público, igual que `training-covers`: son afiches de campaña, no datos
-- personales, y las rutas llevan un identificador que no se adivina. Servirlo
-- firmado obligaría a pedirle una URL temporal al servidor por cada imagen
-- cada vez que alguien abre la pantalla, y en el campo con datos del celular
-- eso se nota.
--
-- Tope de 6 MB por archivo: lo que sube el administrador pasa antes por el
-- compresor del navegador y queda bastante por debajo. El tope está para que
-- una imagen que se escape del compresor —un GIF animado, un SVG— no entre
-- pesada, no porque se espere llegar ahí.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tablero', 'tablero', true, 6291456,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
