import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const trainingId = parseInt(params.id)
  const { data, error } = await supabase
    .from('training_slides')
    .select('id, slide_index, slide_text')
    .eq('training_id', trainingId)
    .order('slide_index', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
