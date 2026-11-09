-- Dos cosas que una pregunta necesita para que la respuesta sirva de algo.
--
-- "¿Escuchaste la alarma?" contestado con un No no dice nada: lo que importa
-- es por qué no la escuchó. Y una lista de opciones con "Otro" sin decir cuál
-- es una respuesta perdida.
--
-- Lo que la persona escriba se guarda al lado de su respuesta, en una clave
-- aparte dentro del mismo jsonb, para no tocar lo ya contestado ni romper la
-- tabulación que cuenta por el valor principal.

alter table modulo_preguntas add column if not exists pedir_porque text;
alter table modulo_preguntas add column if not exists permite_otro boolean not null default false;

alter table modulo_preguntas drop constraint if exists modulo_preguntas_porque_check;
alter table modulo_preguntas add constraint modulo_preguntas_porque_check
  check (pedir_porque is null or pedir_porque in ('siempre', 'si', 'no'));

comment on column modulo_preguntas.pedir_porque is
  'Solo en preguntas de sí o no. Cuándo pedirle que explique: siempre, solo si contesta sí, o solo si contesta no. Nulo = no se le pide.';
comment on column modulo_preguntas.permite_otro is
  'En preguntas de escoger: agrega la opción "Otro" y, al marcarla, le pide que diga cuál.';
