import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  // Test 1: join from users side (current approach)
  const { data: joinFromUsers, error: e1 } = await supabaseAdmin
    .from('users')
    .select('id, name, user_groups(groups(id, name))')
    .limit(3)

  // Test 2: query user_groups directly (known-working direction)
  const { data: directGroups, error: e2 } = await supabaseAdmin
    .from('user_groups')
    .select('user_id, group_id, groups(id, name)')
    .limit(10)

  // Test 3: raw user_groups table content
  const { data: rawUserGroups, error: e3 } = await supabaseAdmin
    .from('user_groups')
    .select('*')
    .limit(10)

  // Test 4: raw groups table
  const { data: rawGroups, error: e4 } = await supabaseAdmin
    .from('groups')
    .select('*')
    .limit(10)

  return NextResponse.json({
    test1_joinFromUsers: { data: joinFromUsers, error: e1?.message },
    test2_directGroups: { data: directGroups, error: e2?.message },
    test3_rawUserGroups: { data: rawUserGroups, error: e3?.message },
    test4_rawGroups: { data: rawGroups, error: e4?.message },
  })
}
