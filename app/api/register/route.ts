import { NextResponse } from 'next/server'

/**
 * El registro abierto está cerrado.
 *
 * Creaba un trabajador ACTIVO, sin cédula y sin que nadie lo aprobara, con
 * solo tener el enlace. Así quedó Leydi Carolina dos veces en la empresa: le
 * llegó un recordatorio, no se supo la clave, se registró, y la cuenta nueva
 * pasó a contar como una persona más en todos los indicadores.
 *
 * Para los que sí entran de la calle está `/api/pre-registro`, que es otra
 * cosa: pide la cédula, la compara contra la base, deja la cuenta INACTIVA y
 * en estado 'pendiente', y no existe nadie hasta que el administrador la
 * aprueba. Las cuentas de la empresa las crea el administrador.
 */
export async function POST() {
  return NextResponse.json({
    error: 'El registro abierto está cerrado. Las cuentas las crea el administrador de '
      + 'su empresa. Si ya tiene cuenta, entre con su cédula o use «¿Olvidaste tu contraseña?».',
  }, { status: 403 })
}
