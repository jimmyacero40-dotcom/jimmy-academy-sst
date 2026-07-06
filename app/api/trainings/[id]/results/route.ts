import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { createHash } from 'crypto'

type Params = { params: { id: string } }

function hashIp(ip: string, secret: string): string {
  return createHash('sha256').update(ip + secret).digest('hex').slice(0, 16)
}

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile'
  return 'desktop'
}

function simplifyBrowser(ua: string): string {
  if (/edg/i.test(ua)) return 'Edge'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Other'
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const trainingId = parseInt(params.id)
  const body = await req.json()

  const ua = req.headers.get('user-agent') ?? ''
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip') ?? ''
  const secret = process.env.NEXTAUTH_SECRET ?? 'sst-secret'

  // Get training version
  const { data: training } = await supabaseAdmin
    .from('trainings')
    .select('version')
    .eq('id', trainingId)
    .single()

  const { data, error } = await supabaseAdmin
    .from('training_results')
    .insert({
      id: randomUUID(),
      training_id: trainingId,
      user_id: (session?.user as any)?.id ?? null,
      training_version: (training as any)?.version ?? 1,
      slide_times: body.slide_times ?? {},
      block_sequence: body.block_sequence ?? [],
      inline_correct: body.inline_correct ?? 0,
      inline_incorrect: body.inline_incorrect ?? 0,
      final_score: body.final_score ?? null,
      attempts: body.attempts ?? 1,
      completed: body.completed ?? false,
      started_at: body.started_at ?? new Date().toISOString(),
      finished_at: body.completed ? new Date().toISOString() : null,
      total_seconds: body.total_seconds ?? null,
      device: detectDevice(ua),
      browser: simplifyBrowser(ua),
      ip_hash: ip ? hashIp(ip, secret) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
