import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { requierePermiso } from '@/lib/get-company'
import { tienePermiso } from '@/lib/permisos'

/**
 * A quién se le puede asignar un reporte: las cuentas reales de la empresa que
 * pueden gestionar este módulo. No se inventa ningún usuario.
 */
export async function GET() {
  const { authorized, companyId } = await requierePermiso('sst.reportes.ver', 'sst.reportes.gestionar')
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabase.from('users')
    .select('id, name, email, role, permissions, cargo')
    .eq('company_id', companyId).eq('active', true).is('retired_at', null)
    // Además de quien administra, las cuentas de responsable: mantenimiento,
    // el jefe de campo, gerencia. Son cuentas de puesto, creadas para recibir
    // acciones, y antes no aparecían en esta lista.
    .in('role', ['superadmin', 'admin', 'responsable'])
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const responsables = (data ?? [])
    .filter(u => tienePermiso(u.role, u.permissions, 'sst.reportes.gestionar')
      || tienePermiso(u.role, u.permissions, 'sst.reportes.responder'))
    .map(u => ({ id: u.id, nombre: u.name, cargo: u.cargo ?? null }))

  return NextResponse.json({ responsables })
}
