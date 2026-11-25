-- La ficha técnica de cada entregable.
--
-- «Qué se entrega» era un nombre y una unidad. Pero quien pide el EPP
-- necesita saber qué EPP es: la norma que cumple, la talla, el proveedor,
-- cada cuánto se repone y cómo se usa. Eso es lo que hace que el catálogo
-- sirva para comprar y para capacitar, y no solo para marcar una casilla.
alter table entrega_tipos add column if not exists categoria text;
alter table entrega_tipos add column if not exists especificacion text;
alter table entrega_tipos add column if not exists talla text;
alter table entrega_tipos add column if not exists proveedor text;
alter table entrega_tipos add column if not exists vida_util_dias integer;
alter table entrega_tipos add column if not exists instrucciones text;
alter table entrega_tipos add column if not exists cantidad_sugerida numeric(10,2) default 1;

-- Quién lo creó y quién lo tocó por última vez. Un catálogo que nadie firma
-- no se puede auditar: hay que poder preguntarle a alguien por qué ese ítem
-- dice lo que dice.
alter table entrega_tipos add column if not exists creado_por_nombre text;
alter table entrega_tipos add column if not exists actualizado_por uuid references users(id) on delete set null;
alter table entrega_tipos add column if not exists actualizado_por_nombre text;
