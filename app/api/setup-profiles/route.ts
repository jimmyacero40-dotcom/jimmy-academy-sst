import { NextResponse } from 'next/server'

export async function GET() {
  const sql = `
-- ════════════════════════════════════════════════════
--  PERFIL INTEGRAL DEL TRABAJADOR — Campus SST
--  Ejecutar en Supabase SQL Editor
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS worker_profiles (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id                UUID NOT NULL,

  -- § 1  Foto
  photo_url                 TEXT,

  -- § 2  Información personal
  doc_type                  TEXT,
  nombres                   TEXT,
  apellidos                 TEXT,
  fecha_nacimiento          DATE,
  sexo                      TEXT,
  estado_civil              TEXT,
  nacionalidad              TEXT DEFAULT 'Colombiana',
  ciudad_nacimiento         TEXT,
  depto_nacimiento          TEXT,
  ciudad_residencia         TEXT,
  depto_residencia          TEXT,
  direccion                 TEXT,
  barrio                    TEXT,
  telefono                  TEXT,
  email_personal            TEXT,

  -- § 3  Familiar
  con_quien_vive            TEXT,
  num_personas_hogar        INTEGER,
  num_hijos                 INTEGER,
  dependientes_economicos   INTEGER,
  cabeza_hogar              BOOLEAN,
  contacto_emergencia       TEXT,
  parentesco_contacto       TEXT,
  tel_contacto              TEXT,

  -- § 4  Vivienda
  tipo_vivienda             TEXT,
  tenencia_vivienda         TEXT,
  estrato                   INTEGER,
  servicios_publicos        TEXT[],
  acceso_internet           BOOLEAN,

  -- § 5  Educación
  nivel_educativo           TEXT,
  profesion                 TEXT,
  estudios_tecnicos         TEXT,
  estudios_tecnologicos     TEXT,
  estudios_universitarios   TEXT,
  especializacion           TEXT,
  otros_estudios            TEXT,
  cursos_certificados       TEXT,
  actualmente_estudia       BOOLEAN,

  -- § 6  Laboral
  cargo_confirmado          TEXT,
  area_confirmada           TEXT,
  centro_trabajo            TEXT,
  jefe_inmediato            TEXT,
  fecha_ingreso             DATE,
  tipo_contrato             TEXT,
  jornada_laboral           TEXT,
  horario_habitual          TEXT,
  realiza_horas_extras      BOOLEAN,
  trabaja_fines_semana      BOOLEAN,

  -- § 7  Físico / Tallas
  estatura_cm               NUMERIC(5,1),
  peso_kg                   NUMERIC(5,1),
  talla_camisa              TEXT,
  talla_camiseta            TEXT,
  talla_pantalon            TEXT,
  talla_overol              TEXT,
  talla_chaqueta            TEXT,
  talla_impermeable         TEXT,
  talla_zapato              TEXT,
  talla_botas               TEXT,
  talla_guantes             TEXT,
  obs_tallas                TEXT,

  -- § 8  Desplazamiento
  municipio_vivienda        TEXT,
  medio_transporte          TEXT,
  tiempo_desplazamiento     TEXT,
  distancia_aprox           TEXT,
  conduce_vehiculo          BOOLEAN,
  tipo_vehiculo             TEXT,

  -- § 9  Estilos de vida
  realiza_actividad_fisica  BOOLEAN,
  dias_actividad_fisica     INTEGER,
  tipo_actividad_fisica     TEXT,
  horas_sueno               NUMERIC(3,1),
  descanso_adecuado         BOOLEAN,
  desayuna_diariamente      BOOLEAN,
  comidas_al_dia            INTEGER,
  consume_frutas            BOOLEAN,
  consume_verduras          BOOLEAN,
  fuma                      BOOLEAN,
  cigarrillos_dia           INTEGER,
  consumo_alcohol           TEXT,
  consume_energizantes      BOOLEAN,
  consume_psicoactivos      TEXT,

  -- § 10  Antecedentes médicos personales
  enfermedades_diagnosticadas TEXT[],
  enfermedades_otra           TEXT,
  hospitalizado               BOOLEAN,
  cirugias                    BOOLEAN,
  cirugias_detalle            TEXT,
  alergias                    BOOLEAN,
  alergias_detalle            TEXT,
  medicamentos_permanentes    BOOLEAN,
  medicamentos_detalle        TEXT,
  limitacion_fisica           BOOLEAN,
  limitacion_detalle          TEXT,

  -- § 11  Antecedentes familiares
  antecedentes_familiares       TEXT[],
  antecedentes_familiares_otra  TEXT,

  -- § 12  Salud ocupacional
  accidentes_trabajo        BOOLEAN,
  enfermedades_laborales    BOOLEAN,
  restricciones_medicas     BOOLEAN,
  restricciones_detalle     TEXT,
  usa_gafas                 BOOLEAN,
  usa_audifonos             BOOLEAN,

  -- § 13  Riesgo psicosocial
  trabajo_genera_estres     BOOLEAN,
  apoyo_familiar            BOOLEAN,
  otro_empleo               BOOLEAN,
  es_cuidador               BOOLEAN,
  dificultades_economicas   BOOLEAN,
  equilibrio_trabajo_vida   BOOLEAN,

  -- § 14  Competencias
  licencia_conduccion       BOOLEAN,
  categoria_licencia        TEXT,
  certificaciones           TEXT[],
  otras_certificaciones     TEXT,

  -- § 15  Consentimientos
  autoriza_datos            BOOLEAN DEFAULT FALSE,
  declara_veracidad         BOOLEAN DEFAULT FALSE,
  firma_electronica         TEXT,
  fecha_consentimiento      TIMESTAMPTZ,

  -- Meta
  completion_pct            INTEGER DEFAULT 0,
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  created_at                TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

ALTER TABLE worker_profiles DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wp_company ON worker_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_wp_user    ON worker_profiles(user_id);
`
  return new Response(sql, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
