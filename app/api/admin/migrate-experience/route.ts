import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const SQL_STEPS = [
  {
    name: 'alter_trainings',
    sql: `ALTER TABLE trainings
  ADD COLUMN IF NOT EXISTS eval_mode text DEFAULT 'final_only',
  ADD COLUMN IF NOT EXISTS version   integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES trainings(id) ON DELETE SET NULL;`,
  },
  {
    name: 'create_training_resources',
    sql: `CREATE TABLE IF NOT EXISTS training_resources (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id     integer     NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  resource_type   text        NOT NULL,
  label           text        NOT NULL,
  storage_path    text,
  url             text,
  mime_type       text,
  file_size_bytes bigint,
  is_downloadable boolean     DEFAULT true,
  is_master       boolean     DEFAULT false,
  sort_order      integer     DEFAULT 0,
  uploaded_by     uuid,
  created_at      timestamptz DEFAULT now()
);`,
  },
  {
    name: 'create_training_blocks',
    sql: `CREATE TABLE IF NOT EXISTS training_blocks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id     integer     NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  block_type      text        NOT NULL,
  position        integer     NOT NULL,
  title           text,
  description     text,
  is_active       boolean     DEFAULT true,
  is_required     boolean     DEFAULT true,
  minimum_seconds integer     DEFAULT 0,
  slide_id        bigint      REFERENCES training_slides(id) ON DELETE SET NULL,
  question_id     bigint      REFERENCES training_questions(id) ON DELETE SET NULL,
  resource_id     uuid        REFERENCES training_resources(id) ON DELETE SET NULL,
  config          jsonb       DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blocks_training ON training_blocks(training_id, position);`,
  },
  {
    name: 'create_training_results',
    sql: `CREATE TABLE IF NOT EXISTS training_results (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id      integer     NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  user_id          uuid,
  training_version integer     DEFAULT 1,
  slide_times      jsonb       DEFAULT '{}',
  block_sequence   jsonb       DEFAULT '[]',
  inline_correct   integer     DEFAULT 0,
  inline_incorrect integer     DEFAULT 0,
  final_score      integer,
  attempts         integer     DEFAULT 1,
  completed        boolean     DEFAULT false,
  started_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  total_seconds    integer,
  device           text,
  browser          text,
  ip_hash          text,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_results_user ON training_results(user_id, training_id);`,
  },
]

export async function POST() {
  const results: Record<string, string> = {}

  for (const step of SQL_STEPS) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { query: step.sql })
      results[step.name] = error ? `rpc_error: ${error.message}` : 'ok'
    } catch {
      results[step.name] = 'rpc_unavailable'
    }
  }

  return NextResponse.json({
    results,
    sql: SQL_STEPS.map(s => s.sql).join('\n\n'),
    note: 'Si rpc_unavailable, ejecuta el SQL en Supabase → SQL Editor',
  })
}

export async function GET() {
  const { error: blocksErr } = await supabaseAdmin.from('training_blocks').select('id').limit(1)
  const { error: resourcesErr } = await supabaseAdmin.from('training_resources').select('id').limit(1)
  const { error: resultsErr } = await supabaseAdmin.from('training_results').select('id').limit(1)

  const { data: tr } = await supabaseAdmin.from('trainings').select('eval_mode').limit(1)
  const hasEvalMode = tr !== null && !('error' in (tr?.[0] ?? {}))

  return NextResponse.json({
    training_blocks: !blocksErr,
    training_resources: !resourcesErr,
    training_results: !resultsErr,
    trainings_eval_mode: hasEvalMode,
    ready: !blocksErr && !resourcesErr && !resultsErr,
  })
}
