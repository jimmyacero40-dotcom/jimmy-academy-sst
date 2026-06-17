import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  // Create users table
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        cedula TEXT DEFAULT '',
        role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
        area TEXT DEFAULT '',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  })

  // If RPC doesn't exist, try direct SQL via REST
  if (tableError) {
    // Table might already exist or we need to create it via dashboard
    // Let's try inserting the admin user directly
  }

  // Create admin user
  const hash = await bcrypt.hash('admin123', 10)
  const { error: adminError } = await supabase
    .from('users')
    .upsert({
      email: 'admin@jimmyacademy.com',
      password: hash,
      name: 'Admin SST',
      role: 'admin',
      cedula: '',
      area: 'Administración',
      active: true,
    }, { onConflict: 'email' })

  if (adminError) {
    return NextResponse.json({
      success: false,
      error: adminError.message,
      hint: 'Debes crear la tabla "users" manualmente en Supabase SQL Editor. Ve a SQL Editor en tu dashboard de Supabase y ejecuta el SQL que se muestra abajo.',
      sql: `CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  cedula TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  area TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for simplicity (enable later for production)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);`
    })
  }

  return NextResponse.json({ success: true, message: 'Admin user created' })
}
