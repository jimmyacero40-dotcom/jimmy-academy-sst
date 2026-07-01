import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminOrSuper } from '@/lib/get-company'

export async function POST() {
  const { authorized } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const steps: string[] = []
  const errors: string[] = []

  const run = async (label: string, sql: string) => {
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).single()
    if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
      errors.push(`${label}: ${error.message}`)
    } else {
      steps.push(label)
    }
  }

  // We'll use direct table operations instead of raw SQL since Supabase anon key
  // doesn't have DDL permissions. Return the SQL for the user to run manually.
  const sqlScript = `
-- ════════════════════════════════════════════════
--  CAMPUS SST — FASE 1: Capa Organizacional
--  Ejecutar en Supabase SQL Editor
-- ════════════════════════════════════════════════

-- 1. Áreas
CREATE TABLE IF NOT EXISTS areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#3B82F6',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Grupos
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Relación usuario ↔ grupo (many-to-many)
CREATE TABLE IF NOT EXISTS user_groups (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

-- 4. Perfiles de formación
CREATE TABLE IF NOT EXISTS training_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  cargo       TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. Cursos obligatorios por perfil (training_id es INTEGER porque trainings.id es serial)
CREATE TABLE IF NOT EXISTS profile_trainings (
  profile_id  UUID    NOT NULL REFERENCES training_profiles(id) ON DELETE CASCADE,
  training_id INTEGER NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  required    BOOLEAN DEFAULT true,
  PRIMARY KEY (profile_id, training_id)
);

-- 6. Nuevos campos en users (ignorar si ya existen)
ALTER TABLE users ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo TEXT;

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_areas_company    ON areas(company_id);
CREATE INDEX IF NOT EXISTS idx_groups_company   ON groups(company_id);
CREATE INDEX IF NOT EXISTS idx_users_area_id    ON users(area_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_user ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON training_profiles(company_id);
`

  return NextResponse.json({
    message: 'Copia y ejecuta este SQL en el Editor SQL de Supabase (tu clave anon no tiene permisos DDL)',
    sql: sqlScript,
    steps,
    errors,
  })
}
