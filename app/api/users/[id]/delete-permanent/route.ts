import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo el superadmin puede eliminar permanentemente' }, { status: 403 })
  }

  const { id } = params

  // Step 1: Nullify user_id in access_logs to preserve movement history
  await supabaseAdmin.from('access_logs').update({ user_id: null }).eq('user_id', id)

  // Step 2: Remove from user_groups
  await supabaseAdmin.from('user_groups').delete().eq('user_id', id)

  // Step 3: Remove from gatehouse_operators
  await supabaseAdmin.from('gatehouse_operators').delete().eq('user_id', id)

  // Step 4: Remove profile
  await supabaseAdmin.from('user_profiles').delete().eq('user_id', id)

  // Step 5: Physical delete from users
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
