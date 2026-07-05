import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  // Get a real user id and group id to test with
  const { data: users } = await supabaseAdmin.from('users').select('id').limit(1)
  const { data: groups } = await supabaseAdmin.from('groups').select('id, name').limit(1)

  const testUserId = users?.[0]?.id
  const testGroupId = groups?.[0]?.id

  // Test A: describe user_groups columns
  const { data: rawUserGroups, error: e_raw } = await supabaseAdmin
    .from('user_groups').select('*').limit(5)

  // Test B: try INSERT with only user_id + group_id (no company_id)
  let insertResultA: any = null
  if (testUserId && testGroupId) {
    const { data, error } = await supabaseAdmin
      .from('user_groups')
      .insert({ user_id: testUserId, group_id: testGroupId })
      .select()
    insertResultA = { data, error: error?.message, code: error?.code, details: error?.details, hint: error?.hint }
    // Clean up
    if (!error) await supabaseAdmin.from('user_groups').delete().eq('user_id', testUserId).eq('group_id', testGroupId)
  }

  // Test C: try INSERT with company_id
  const { data: company } = await supabaseAdmin.from('companies').select('id').limit(1)
  const companyId = company?.[0]?.id
  let insertResultB: any = null
  if (testUserId && testGroupId) {
    const { data, error } = await supabaseAdmin
      .from('user_groups')
      .insert({ user_id: testUserId, group_id: testGroupId, company_id: companyId })
      .select()
    insertResultB = { data, error: error?.message, code: error?.code, details: error?.details, hint: error?.hint }
    if (!error) await supabaseAdmin.from('user_groups').delete().eq('user_id', testUserId).eq('group_id', testGroupId)
  }

  return NextResponse.json({
    testUserId,
    testGroupId,
    companyId,
    rawUserGroups: { data: rawUserGroups, error: e_raw?.message },
    insertWithoutCompany: insertResultA,
    insertWithCompany: insertResultB,
  })
}
