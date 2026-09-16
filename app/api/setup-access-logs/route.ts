import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  // Check if table already exists
  const { error: checkErr } = await supabaseAdmin
    .from('access_logs')
    .select('id')
    .limit(1)

  if (!checkErr) {
    return NextResponse.json({ success: true, message: 'Tabla access_logs ya existe' })
  }

  // Try to create via pg extension (supabase exposes pg schema for service_role)
  const queries = [
    `CREATE TABLE IF NOT EXISTS access_logs (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id    UUID NOT NULL,
      user_id       UUID NOT NULL,
      entry_time    TIMESTAMPTZ NOT NULL DEFAULT now(),
      exit_time     TIMESTAMPTZ,
      area_id       UUID,
      registered_by UUID,
      exit_by       UUID,
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS access_logs_company_id_idx ON access_logs(company_id)`,
    `CREATE INDEX IF NOT EXISTS access_logs_user_id_idx    ON access_logs(user_id)`,
    `CREATE INDEX IF NOT EXISTS access_logs_entry_time_idx ON access_logs(entry_time DESC)`,
    `ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY`,
    `GRANT ALL ON access_logs TO service_role`,
  ]

  for (const sql of queries) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql }).single()
    if (error) {
      // exec_sql may not exist — try pg_query approach
      const { error: e2 } = await (supabaseAdmin as any).rpc('pg_query', { query: sql })
      if (e2) {
        return NextResponse.json({ success: false, error: `${e2.message} | SQL: ${sql.slice(0, 80)}` }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true, message: 'Tabla access_logs creada correctamente' })
}
