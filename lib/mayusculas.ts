/**
 * Normaliza a mayúscula sostenida lo que se guarda del trabajador.
 *
 * Se aplica en el servidor, no solo en la pantalla: así el dato queda
 * normalizado venga de donde venga —el formulario del superadmin, la
 * importación de Excel, el pre-registro público o la encuesta—.
 *
 * Quedan fuera a propósito el correo, la contraseña y todo lo numérico o de
 * fecha: ahí la mayúscula no corresponde y además rompería el valor.
 */

/** Campos de users que van en mayúscula. */
export const CAMPOS_USUARIO = ['name', 'cargo', 'area'] as const

/** Campos de worker_profiles que van en mayúscula. */
export const CAMPOS_PERFIL = [
  'nombres', 'apellidos', 'doc_type', 'sexo', 'estado_civil',
  'nacionalidad', 'ciudad_nacimiento', 'depto_nacimiento',
  'ciudad_residencia', 'depto_residencia', 'direccion', 'barrio',
  'municipio_vivienda', 'tipo_vivienda', 'tenencia_vivienda', 'con_quien_vive',
  'contacto_emergencia', 'parentesco_contacto',
  'contacto_emergencia2', 'parentesco_contacto2',
  'grupo_sanguineo', 'poblacion_vulnerable', 'discapacidad_detalle',
  'eps', 'arl', 'fondo_pension', 'caja_compensacion',
  'nivel_educativo', 'profesion', 'estudios_tecnicos', 'estudios_tecnologicos',
  'estudios_universitarios', 'especializacion', 'otros_estudios', 'cursos_certificados',
  'cargo_confirmado', 'area_confirmada', 'centro_trabajo', 'jefe_inmediato',
  'tipo_contrato', 'jornada_laboral', 'horario_habitual',
  'medio_transporte', 'tiempo_desplazamiento', 'tipo_vehiculo', 'distancia_aprox',
  'tipo_actividad_fisica', 'consumo_alcohol', 'consume_psicoactivos',
  'categoria_licencia', 'otras_certificaciones',
  'enfermedades_otra', 'antecedentes_familiares_otra',
  'cirugias_detalle', 'alergias_detalle', 'medicamentos_detalle',
  'limitacion_detalle', 'restricciones_detalle',
  'obs_tallas',
  // Preguntas de selección múltiple: se guardan como arreglo de texto.
  'servicios_publicos', 'enfermedades_diagnosticadas',
  'antecedentes_familiares', 'certificaciones',
] as const

/** Nunca se tocan: perderían su significado o dejarían de funcionar. */
export const CAMPOS_INTOCABLES = new Set([
  'email', 'correo', 'email_personal', 'password',
  'cedula', 'telefono', 'telefono_alterno', 'tel_contacto', 'tel_contacto2',
  'photo_url', 'firma_electronica', 'logo_url',
])

/** Mayúscula sostenida respetando los acentos del español. */
export function aMayuscula(v: unknown): unknown {
  if (typeof v !== 'string') return v
  const limpio = v.trim().replace(/\s+/g, ' ')
  return limpio.toLocaleUpperCase('es-CO')
}

/**
 * Devuelve una copia del objeto con los campos indicados en mayúscula.
 * Los valores vacíos se dejan como están y los intocables nunca se tocan.
 */
export function normalizar<T extends Record<string, any>>(
  datos: T,
  campos: readonly string[],
): T {
  const salida: Record<string, any> = { ...datos }
  for (const campo of campos) {
    if (CAMPOS_INTOCABLES.has(campo)) continue
    const v = salida[campo]
    // Solo se toca lo que está en la lista. Antes, además, se recorría el objeto
    // entero poniendo en mayúscula cualquier arreglo de texto que apareciera.
    // Eso alcanzaba a `users.permissions`: los permisos quedaban guardados como
    // 'ACCESOS.VER', no coincidían con los identificadores -que van en
    // minúscula- y la cuenta se quedaba sin ninguno, aunque en la pantalla se
    // vieran todos los chulos marcados.
    if (Array.isArray(v)) {
      salida[campo] = v.map(x => (typeof x === 'string' ? aMayuscula(x) : x))
      continue
    }
    if (typeof v !== 'string' || v.trim() === '') continue
    salida[campo] = aMayuscula(v)
  }
  return salida as T
}

export const normalizarUsuario = <T extends Record<string, any>>(d: T) => normalizar(d, CAMPOS_USUARIO)
export const normalizarPerfil  = <T extends Record<string, any>>(d: T) => normalizar(d, CAMPOS_PERFIL)
