// ─── Completitud de la ficha sociodemográfica ─────────────────────────
// Una sola definición para la encuesta y para el porcentaje que guarda la
// API. Antes había dos listas parecidas en sitios distintos y cada sección
// se daba por cumplida con uno o dos campos, así que una ficha a medio
// llenar podía marcar 100 %.
// ──────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ficha = Record<string, any>

/** Una respuesta cuenta si tiene contenido. `false` es una respuesta válida. */
function lleno(v: any): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.length > 0
  return true
}

const todos = (d: Ficha, campos: string[]) => campos.every(c => lleno(d[c]))

/** Solo se exige el detalle cuando la respuesta previa lo hace necesario. */
const siAplica = (d: Ficha, condicion: string, detalle: string[]) =>
  lleno(d[condicion]) && (d[condicion] !== true || todos(d, detalle))

/**
 * Las 15 secciones de la ficha, con los campos que cada una exige.
 * Se dejan fuera a propósito los campos declarados opcionales en la
 * encuesta: profesión, estudios formales, otras certificaciones,
 * observaciones de tallas, teléfono alterno, correo personal, jefe
 * inmediato, distancia aproximada y el segundo contacto de emergencia.
 */
export const SECCIONES: Record<string, (d: Ficha) => boolean> = {
  'Foto': d => lleno(d.photo_url),

  'Datos personales': d =>
    todos(d, [
      'nombres', 'apellidos', 'doc_type', 'fecha_nacimiento', 'sexo', 'estado_civil',
      'grupo_sanguineo', 'nacionalidad', 'ciudad_nacimiento', 'depto_nacimiento',
      'telefono', 'direccion', 'barrio', 'ciudad_residencia', 'depto_residencia',
      'poblacion_vulnerable',
    ]) && siAplica(d, 'tiene_discapacidad', ['discapacidad_detalle']),

  'Contacto emergencia': d => todos(d, ['contacto_emergencia', 'parentesco_contacto', 'tel_contacto']),

  'Vivienda': d => todos(d, [
    'tipo_vivienda', 'tenencia_vivienda', 'estrato', 'servicios_publicos', 'acceso_internet',
    'con_quien_vive', 'num_personas_hogar', 'num_hijos', 'dependientes_economicos', 'cabeza_hogar',
  ]),

  'Educación': d => todos(d, ['nivel_educativo', 'actualmente_estudia']),

  'Información laboral': d => todos(d, [
    'cargo_confirmado', 'area_confirmada', 'centro_trabajo', 'fecha_ingreso', 'tipo_contrato',
    'jornada_laboral', 'horario_habitual', 'realiza_horas_extras', 'trabaja_fines_semana',
    'eps', 'arl', 'fondo_pension', 'caja_compensacion',
  ]),

  'Tallas / EPP': d => todos(d, [
    'estatura_cm', 'peso_kg', 'talla_camisa', 'talla_camiseta', 'talla_pantalon',
    'talla_zapato', 'talla_botas', 'talla_guantes',
  ]),

  'Desplazamiento': d =>
    todos(d, ['municipio_vivienda', 'medio_transporte', 'tiempo_desplazamiento']) &&
    siAplica(d, 'conduce_vehiculo', ['tipo_vehiculo']),

  'Hábitos': d =>
    todos(d, [
      'horas_sueno', 'descanso_adecuado', 'desayuna_diariamente', 'comidas_al_dia',
      'consume_frutas', 'consume_verduras', 'consumo_alcohol', 'consume_energizantes',
      'consume_psicoactivos',
    ]) &&
    siAplica(d, 'realiza_actividad_fisica', ['dias_actividad_fisica', 'tipo_actividad_fisica']) &&
    siAplica(d, 'fuma', ['cigarrillos_dia']),

  'Antecedentes médicos': d => todos(d, [
    'enfermedades_diagnosticadas', 'hospitalizado', 'cirugias', 'alergias',
    'medicamentos_permanentes', 'limitacion_fisica',
  ]),

  'Ant. familiares': d => lleno(d.antecedentes_familiares),

  'Salud ocupacional': d => todos(d, [
    'accidentes_trabajo', 'enfermedades_laborales', 'restricciones_medicas',
    'usa_gafas', 'usa_audifonos',
  ]),

  'Riesgo psicosocial': d => todos(d, [
    'trabajo_genera_estres', 'apoyo_familiar', 'otro_empleo', 'es_cuidador',
    'dificultades_economicas', 'equilibrio_trabajo_vida',
  ]),

  'Competencias': d =>
    lleno(d.certificaciones) && siAplica(d, 'licencia_conduccion', ['categoria_licencia']),

  'Consentimientos': d => d.autoriza_datos === true && d.declara_veracidad === true,
}

export const TOTAL_SECCIONES = Object.keys(SECCIONES).length

export function calcSections(d: Ficha): Record<string, boolean> {
  const r: Record<string, boolean> = {}
  for (const [nombre, cumple] of Object.entries(SECCIONES)) r[nombre] = cumple(d ?? {})
  return r
}

export function calcPct(d: Ficha): number {
  const hechas = Object.values(calcSections(d)).filter(Boolean).length
  return Math.round((hechas / TOTAL_SECCIONES) * 100)
}
