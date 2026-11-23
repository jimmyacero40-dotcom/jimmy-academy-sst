/**
 * Los recordatorios que el administrador le puede mandar a quien va atrasado.
 *
 * Son siempre la misma idea —«le falta esto, entre aquí»— pero cada módulo
 * tiene su nombre, su pantalla y su frase. Teniéndolos en una sola tabla, un
 * módulo nuevo es una entrada más y no otra pantalla de correo.
 */

export interface Modulo {
  clave: string
  nombre: string
  /** A dónde se le manda a la persona. Relativo, para pegarlo al dominio. */
  ruta: string
  asunto: string
  /** Lo que se le dice. `{nombre}` se reemplaza con el de la persona. */
  frase: string
  /** El texto del botón del correo. */
  boton: string
  /** El permiso que hay que tener para mandar este recordatorio. */
  permiso: string
}

export const MODULOS: Record<string, Modulo> = {
  sociodemografica: {
    clave: 'sociodemografica',
    nombre: 'Información sociodemográfica',
    ruta: '/dashboard/my-profile',
    asunto: 'Le falta completar su información — AgroSafe',
    frase:
      'Su ficha de información sociodemográfica está incompleta. Es la base del '
      + 'diagnóstico de condiciones de salud de la empresa, y mientras falte la suya '
      + 'el informe sale con un vacío.',
    boton: 'Completar mi información',
    permiso: 'personal.ver',
  },
  'tu-cuentas': {
    clave: 'tu-cuentas',
    nombre: 'Tú Cuentas · Identificación de peligros',
    ruta: '/dashboard/tu-cuentas/peligros',
    asunto: 'Falta su participación en la identificación de peligros — AgroSafe',
    frase:
      'Todavía no ha registrado su participación en la identificación de peligros. '
      + 'Nadie conoce los riesgos de su puesto mejor que usted: lo que responda entra '
      + 'directo a la matriz de peligros de la empresa.',
    boton: 'Responder ahora',
    permiso: 'sst.participacion.administrar',
  },
  formacion: {
    clave: 'formacion',
    nombre: 'Capacitaciones pendientes',
    ruta: '/dashboard/my-plan',
    asunto: 'Tiene capacitaciones pendientes — AgroSafe',
    frase:
      'Tiene capacitaciones asignadas que todavía no ha terminado. Son obligatorias '
      + 'dentro del plan anual de formación de la empresa.',
    boton: 'Ver mis capacitaciones',
    permiso: 'formacion.gestionar',
  },
}

/**
 * Texto de una persona metido dentro de un HTML. Hay que escaparlo: un «&» o
 * un «<» en la nota del administrador rompía el correo, y lo que uno escribe
 * en una casilla no debe poder convertirse en etiquetas.
 */
function escapar(t: string): string {
  return t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Lo que se escribió en varias líneas se ve en varias líneas. */
function enParrafo(t: string): string {
  return escapar(t).replace(/\r?\n/g, '<br>')
}

/** El correo del recordatorio, con el mismo aire que los demás de la plataforma. */
export function plantillaRecordatorio(opciones: {
  nombre: string
  modulo: Modulo
  enlace: string
  /** Hasta cuándo tiene plazo, si el módulo lo tiene. */
  plazo?: string | null
  /** Lo que el administrador quiso agregar de su puño. */
  nota?: string | null
}): string {
  const { nombre, modulo, enlace, plazo, nota } = opciones

  // El texto puede traer {nombre} donde quiera el saludo. Si no lo trae, se
  // antepone como siempre: «DIANA ROCÍO, todavía no ha respondido…».
  const escrito = modulo.frase
  const cuerpo = escrito.includes('{nombre}')
    ? enParrafo(escrito).split('{nombre}').join(escapar(nombre))
    : `${escapar(nombre)}, ${enParrafo(escrito)}`
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;padding:28px;background:#F7F9F7;color:#1F2937;border-radius:14px">
    <div style="margin-bottom:20px">
      <span style="background:#243C2C;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:.5px">AGROSAFE</span>
    </div>
    <h1 style="font-size:19px;margin:0 0 12px;color:#111827">${escapar(modulo.nombre)}</h1>
    <p style="font-size:14px;line-height:1.65;margin:0 0 16px;color:#374151">
      ${cuerpo}
    </p>
    ${plazo ? `<p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#B45309;background:#FEF3C7;border-radius:8px;padding:10px 14px">
      <strong>Tiene plazo hasta el ${plazo}.</strong>
    </p>` : ''}
    ${nota ? `<p style="font-size:14px;line-height:1.65;margin:0 0 18px;color:#374151;border-left:3px solid #243C2C;padding-left:12px">
      ${enParrafo(nota)}
    </p>` : ''}
    <a href="${enlace}" style="display:inline-block;background:#243C2C;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:14px;font-weight:700">
      ${escapar(modulo.boton)}
    </a>
    <p style="font-size:12px;line-height:1.6;margin:22px 0 0;color:#6B7280">
      Entra con su cédula. Si no recuerda la contraseña, use «¿Olvidaste tu contraseña?» en la pantalla de ingreso.<br>
      Si el botón no abre, copie esta dirección: <span style="color:#1D4ED8;word-break:break-all">${enlace}</span>
    </p>
  </div>`
}

/** El primer nombre, para saludar sin el apellido delante. */
export function comoSeLeDice(nombreCompleto: string | null | undefined): string {
  const partes = String(nombreCompleto ?? '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return 'Hola'
  // Los trabajadores se guardan como APELLIDOS NOMBRES.
  return partes.length >= 3 ? partes.slice(2).join(' ') : partes[partes.length - 1]
}

/**
 * Los módulos de Tú Cuentas no son fijos: el administrador crea los que
 * necesite. Su clave de recordatorio es `modulo:<id>`, y el nombre y la
 * pantalla salen de la fila, no de la tabla de arriba.
 */
export const PREFIJO_MODULO = 'modulo:'

export function esModuloDinamico(clave: string): string | null {
  return clave.startsWith(PREFIJO_MODULO) ? clave.slice(PREFIJO_MODULO.length) : null
}

export function moduloDinamico(fila: { id: string; nombre: string }): Modulo {
  return {
    clave: PREFIJO_MODULO + fila.id,
    nombre: fila.nombre,
    ruta: `/dashboard/tu-cuentas/modulo/${fila.id}`,
    asunto: `Falta su respuesta: ${fila.nombre} — AgroSafe`,
    frase:
      `todavía no ha respondido «${fila.nombre}». Es parte del Sistema de Gestión `
      + 'de Seguridad y Salud en el Trabajo de la empresa, y su respuesta hace falta '
      + 'para cerrar el consolidado.',
    boton: 'Responder ahora',
    permiso: 'sst.modulos.gestionar',
  }
}
