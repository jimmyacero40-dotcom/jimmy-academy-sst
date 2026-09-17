import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'

export async function GET() {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const results: Record<string, string> = {}

  // Check / create gatehouses table
  const { error: ghCheck } = await supabaseAdmin.from('gatehouses').select('id').limit(1)
  if (ghCheck) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: `
      CREATE TABLE IF NOT EXISTS gatehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL, name TEXT NOT NULL,
        location TEXT, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS gatehouses_company_id_idx ON gatehouses(company_id);
      ALTER TABLE gatehouses ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON gatehouses TO service_role;
    ` })
    results.gatehouses = error ? `error: ${error.message}` : 'created'
  } else {
    results.gatehouses = 'exists'
  }

  // Check / create gatehouse_operators
  const { error: goCheck } = await supabaseAdmin.from('gatehouse_operators').select('id').limit(1)
  if (goCheck) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: `
      CREATE TABLE IF NOT EXISTS gatehouse_operators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gatehouse_id UUID NOT NULL REFERENCES gatehouses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(gatehouse_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS gatehouse_operators_user_id_idx ON gatehouse_operators(user_id);
      CREATE INDEX IF NOT EXISTS gatehouse_operators_gatehouse_id_idx ON gatehouse_operators(gatehouse_id);
      ALTER TABLE gatehouse_operators ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON gatehouse_operators TO service_role;
    ` })
    results.gatehouse_operators = error ? `error: ${error.message}` : 'created'
  } else {
    results.gatehouse_operators = 'exists'
  }

  // Add gatehouse_id to access_logs if missing
  try {
    await supabaseAdmin.rpc('exec_sql', { sql: `
      ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS gatehouse_id UUID REFERENCES gatehouses(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS access_logs_gatehouse_id_idx ON access_logs(gatehouse_id);
    ` })
    results.access_logs_gatehouse_id = 'added'
  } catch (e: any) {
    results.access_logs_gatehouse_id = `error: ${e.message}`
  }

  // Add retired_at to users if missing
  try {
    await supabaseAdmin.rpc('exec_sql', { sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS users_retired_at_idx ON users(retired_at);
    ` })
    results.users_retired_at = 'added'
  } catch (e: any) {
    results.users_retired_at = `error: ${e.message}`
  }

  // Seed initial gatehouses for this company if none exist
  const { data: existing } = await supabaseAdmin.from('gatehouses').select('id').eq('company_id', companyId).limit(1)
  if (!existing?.length) {
    await supabaseAdmin.from('gatehouses').insert([
      { company_id: companyId, name: 'La Esmeralda',  location: 'Finca Blue Esmeralda', is_active: true },
      { company_id: companyId, name: 'Casa de Teja',  location: 'Casa de Teja',          is_active: true },
    ])
    results.seed = 'seeded La Esmeralda + Casa de Teja'
  } else {
    results.seed = 'already has gatehouses'
  }

  return NextResponse.json({ success: true, results })
}
