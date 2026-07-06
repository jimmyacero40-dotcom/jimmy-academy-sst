import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  // Check training_slides columns
  const { data: slidesSample } = await supabaseAdmin
    .from('training_slides')
    .select('*')
    .limit(1)

  // Check if training_blocks exists
  const { error: blocksErr } = await supabaseAdmin
    .from('training_blocks')
    .select('id')
    .limit(1)

  // Check if training_resources exists
  const { error: resourcesErr } = await supabaseAdmin
    .from('training_resources')
    .select('id')
    .limit(1)

  // Check if training_results exists
  const { error: resultsErr } = await supabaseAdmin
    .from('training_results')
    .select('id')
    .limit(1)

  // Check trainings columns
  const { data: trainingsSample } = await supabaseAdmin
    .from('trainings')
    .select('*')
    .limit(1)

  const { data: questionsSample } = await supabaseAdmin
    .from('training_questions')
    .select('*')
    .limit(1)

  return NextResponse.json({
    training_questions_columns: questionsSample ? Object.keys(questionsSample[0] ?? {}) : [],
    training_slides_columns: slidesSample ? Object.keys(slidesSample[0] ?? {}) : [],
    training_blocks_exists: !blocksErr,
    training_resources_exists: !resourcesErr,
    training_results_exists: !resultsErr,
    trainings_columns: trainingsSample ? Object.keys(trainingsSample[0] ?? {}) : [],
  })
}
