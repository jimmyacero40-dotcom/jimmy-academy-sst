-- Se dejan de preguntar la jornada laboral, el horario habitual, las horas
-- extras y el trabajo en fin de semana.
--
-- No aportaban a la gestión de SST lo suficiente para justificar cuatro
-- preguntas más en una encuesta que ya es larga, y la decisión fue quitarlas
-- por completo, no solo esconderlas.
--
-- OJO: esto borra lo que habían respondido 16 trabajadores. Antes de correrlo
-- se les entregó a los responsables de SST un respaldo de esas respuestas, por
-- fuera del repositorio por tratarse de datos personales.

alter table worker_profiles
  drop column if exists jornada_laboral,
  drop column if exists horario_habitual,
  drop column if exists realiza_horas_extras,
  drop column if exists trabaja_fines_semana;
