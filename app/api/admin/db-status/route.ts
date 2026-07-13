import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/db-status
// Returns the existence and row count of all tables needed by the attendance module.
// Safe read-only endpoint — never modifies anything.
export async function GET() {
  const tables = [
    'attendance_lists',
    'attendance_list_participants',
    'trainings',
    'certificates',
    'users',
    'companies',
    'signatures',
  ]

  const results: Record<string, { exists: boolean; count?: number; error?: string }> = {}

  for (const table of tables) {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      results[table] = {
        exists: !error.message.includes('schema cache'),
        error: error.message,
      }
    } else {
      results[table] = { exists: true, count: count ?? 0 }
    }
  }

  const allReady = results['attendance_lists']?.exists && results['attendance_list_participants']?.exists

  return NextResponse.json({
    ready: allReady,
    tables: results,
    message: allReady
      ? 'Base de datos lista. El módulo puede operar.'
      : 'ACCIÓN REQUERIDA: ejecuta el SQL de supabase/migrations/20260713_attendance_lists.sql en Supabase SQL Editor.',
  })
}
