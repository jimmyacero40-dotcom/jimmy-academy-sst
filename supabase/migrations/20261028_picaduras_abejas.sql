-- Antecedentes frente a picaduras de abejas y avispas.
--
-- Es un riesgo prioritario en la operación, así que la ficha sociodemográfica
-- tiene que dejar constancia de quién ya ha sido picado, qué le pasó y si hay
-- una alergia diagnosticada. De ahí sale a quién hay que vigilar de cerca y
-- quién necesita medidas especiales en campo.
--
-- Los síntomas van como arreglo porque una misma picadura produce varios a la
-- vez, y porque hace falta poder contar cuántas personas presentaron cada uno.

alter table worker_profiles
  add column if not exists picadura_abeja          text,
  add column if not exists sintomas_picadura       text[],
  add column if not exists alergia_picadura_dx     text,
  add column if not exists urgencia_picadura       text,
  add column if not exists recomendacion_picadura  text,
  add column if not exists recomendacion_picadura_detalle text;

comment on column worker_profiles.picadura_abeja is
  'Si alguna vez recibió una picadura de abeja o avispa: SÍ / NO / NO RECUERDA';
comment on column worker_profiles.sintomas_picadura is
  'Síntomas presentados tras la picadura. Selección múltiple';
comment on column worker_profiles.alergia_picadura_dx is
  'Si un profesional de la salud le diagnosticó alergia: SÍ / NO / NO ESTÁ SEGURO';
comment on column worker_profiles.urgencia_picadura is
  'Si requirió atención médica de urgencia: SÍ / NO / NO RECUERDA';
comment on column worker_profiles.recomendacion_picadura is
  'Si tiene recomendación médica o precauciones especiales: SÍ / NO / NO ESTÁ SEGURO';
comment on column worker_profiles.recomendacion_picadura_detalle is
  'Cuál es esa recomendación. Solo aplica cuando la anterior es SÍ';
