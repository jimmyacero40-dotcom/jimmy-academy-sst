import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export async function setupDatabase() {
  // Create users table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        cedula TEXT,
        role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
        area TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  })
}

export async function createAdminUser() {
  const hash = await bcrypt.hash('admin123', 10)
  const { error } = await supabase.from('users').upsert({
    email: 'admin@jimmyacademy.com',
    password: hash,
    name: 'Admin SST',
    role: 'admin',
  }, { onConflict: 'email' })
  return error
}
