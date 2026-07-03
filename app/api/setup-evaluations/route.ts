import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const steps: string[] = []

  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS evaluations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
        training_id uuid REFERENCES trainings(id) ON DELETE SET NULL,
        title text NOT NULL,
        min_score integer NOT NULL DEFAULT 70,
        time_limit integer DEFAULT NULL,
        created_at timestamptz DEFAULT now()
      );
    `
  })
  steps.push(e1 ? `evaluations ERROR: ${e1.message}` : 'evaluations OK')

  const { error: e2 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS questions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluation_id uuid REFERENCES evaluations(id) ON DELETE CASCADE,
        text text NOT NULL,
        type text NOT NULL DEFAULT 'single',
        options jsonb NOT NULL DEFAULT '[]',
        correct jsonb NOT NULL DEFAULT '[]',
        points integer NOT NULL DEFAULT 1,
        created_at timestamptz DEFAULT now()
      );
    `
  })
  steps.push(e2 ? `questions ERROR: ${e2.message}` : 'questions OK')

  return NextResponse.json({ steps })
}
