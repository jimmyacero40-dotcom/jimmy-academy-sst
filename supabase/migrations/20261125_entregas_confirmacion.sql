-- La confirmación del trabajador.
--
-- Sin esto la trazabilidad es a medias: queda dicho que se entregó, pero no
-- que la persona lo recibió. El formato en papel resolvía eso con la firma en
-- el recuadro; aquí lo resuelve el propio trabajador desde su portal.
alter table entregas add column if not exists confirmado_at timestamptz;
alter table entregas add column if not exists confirmado_nota text;

create index if not exists entregas_sin_confirmar_idx
  on entregas (user_id, confirmado_at);
