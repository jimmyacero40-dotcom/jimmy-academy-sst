-- El plazo de cada módulo de Tú Cuentas: desde cuándo y hasta cuándo se
-- responde. Igual que en la identificación de peligros: sin esto, cerrar a
-- tiempo depende de que alguien se acuerde el día exacto del corte.
alter table modulos add column if not exists abre date;
alter table modulos add column if not exists cierra date;
