// ─── Catálogo de la ficha sociodemográfica ─────────────────────────────
// Qué pregunta la encuesta, en su orden, con el nombre con que se le
// muestra a la persona. De aquí salen tres cosas que antes se escribían
// por separado y se desincronizaban: el porcentaje de avance, la ficha
// completa que ve el responsable de SST y el detalle de lo que falta.
//
// `opcional` marca lo que la encuesta no exige: se muestra en la ficha,
// pero no cuenta para el avance ni aparece como pendiente.
// `soloSi` es el detalle que únicamente tiene sentido cuando se respondió
// que sí a la pregunta anterior (p. ej. la categoría de la licencia).
// ──────────────────────────────────────────────────────────────────────

export type CampoFicha = {
  campo: string
  etiqueta: string
  opcional?: boolean
  soloSi?: string
  /** No basta con responder: hay que haber dicho que sí (consentimientos). */
  debeSerCierto?: boolean
}

export type SeccionFicha = { nombre: string; campos: CampoFicha[] }

export const FICHA: SeccionFicha[] = [
  {
    nombre: 'Foto',
    campos: [
      { campo: 'photo_url', etiqueta: 'Fotografía' },
    ],
  },
  {
    nombre: 'Datos personales',
    campos: [
      { campo: 'nombres', etiqueta: 'Nombres' },
      { campo: 'apellidos', etiqueta: 'Apellidos' },
      { campo: 'doc_type', etiqueta: 'Tipo de documento' },
      { campo: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento' },
      { campo: 'sexo', etiqueta: 'Sexo' },
      { campo: 'estado_civil', etiqueta: 'Estado civil' },
      { campo: 'grupo_sanguineo', etiqueta: 'Grupo sanguíneo y RH' },
      { campo: 'nacionalidad', etiqueta: 'Nacionalidad' },
      { campo: 'ciudad_nacimiento', etiqueta: 'Ciudad de nacimiento' },
      { campo: 'depto_nacimiento', etiqueta: 'Departamento de nacimiento' },
      { campo: 'telefono', etiqueta: 'Teléfono / celular' },
      { campo: 'direccion', etiqueta: 'Dirección completa' },
      { campo: 'barrio', etiqueta: 'Barrio' },
      { campo: 'ciudad_residencia', etiqueta: 'Ciudad de residencia actual' },
      { campo: 'depto_residencia', etiqueta: 'Departamento de residencia' },
      { campo: 'poblacion_vulnerable', etiqueta: '¿Pertenece a algún grupo étnico o población vulnerable?' },
      { campo: 'tiene_discapacidad', etiqueta: '¿Tiene alguna condición de discapacidad reconocida?' },
      { campo: 'discapacidad_detalle', etiqueta: '¿Cuál condición?', soloSi: 'tiene_discapacidad' },
      { campo: 'telefono_alterno', etiqueta: 'Teléfono alterno', opcional: true },
      { campo: 'email_personal', etiqueta: 'Correo electrónico personal', opcional: true },
    ],
  },
  {
    nombre: 'Contacto de emergencia',
    campos: [
      { campo: 'contacto_emergencia', etiqueta: 'Nombre completo del contacto' },
      { campo: 'parentesco_contacto', etiqueta: 'Parentesco o relación' },
      { campo: 'tel_contacto', etiqueta: 'Teléfono de emergencia' },
      { campo: 'contacto_emergencia2', etiqueta: 'Segundo contacto (opcional)', opcional: true },
      { campo: 'parentesco_contacto2', etiqueta: 'Parentesco del segundo contacto', opcional: true },
      { campo: 'tel_contacto2', etiqueta: 'Teléfono del segundo contacto', opcional: true },
    ],
  },
  {
    nombre: 'Vivienda y hogar',
    campos: [
      { campo: 'tipo_vivienda', etiqueta: 'Tipo de vivienda' },
      { campo: 'tenencia_vivienda', etiqueta: 'La vivienda es…' },
      { campo: 'estrato', etiqueta: 'Estrato socioeconómico' },
      { campo: 'servicios_publicos', etiqueta: 'Servicios públicos disponibles en su vivienda' },
      { campo: 'acceso_internet', etiqueta: '¿Tiene internet en casa?' },
      { campo: 'con_quien_vive', etiqueta: '¿Con quién vive?' },
      { campo: 'num_personas_hogar', etiqueta: 'N.° de personas en el hogar' },
      { campo: 'num_hijos', etiqueta: 'N.° de hijos' },
      { campo: 'dependientes_economicos', etiqueta: 'Personas que dependen económicamente de usted' },
      { campo: 'cabeza_hogar', etiqueta: '¿Es cabeza de hogar?' },
    ],
  },
  {
    nombre: 'Educación',
    campos: [
      { campo: 'nivel_educativo', etiqueta: 'Nivel educativo más alto alcanzado' },
      { campo: 'actualmente_estudia', etiqueta: '¿Actualmente está estudiando?' },
      { campo: 'profesion', etiqueta: 'Profesión / título obtenido', opcional: true },
      { campo: 'estudios_tecnicos', etiqueta: 'Estudios técnicos (si aplica)', opcional: true },
      { campo: 'estudios_tecnologicos', etiqueta: 'Estudios tecnológicos (si aplica)', opcional: true },
      { campo: 'estudios_universitarios', etiqueta: 'Carrera universitaria (si aplica)', opcional: true },
      { campo: 'especializacion', etiqueta: 'Especialización / posgrado (si aplica)', opcional: true },
      { campo: 'otros_estudios', etiqueta: 'Otros estudios', opcional: true },
      { campo: 'cursos_certificados', etiqueta: 'Cursos y certificados relevantes', opcional: true },
    ],
  },
  {
    nombre: 'Información laboral',
    campos: [
      { campo: 'cargo_confirmado', etiqueta: 'Cargo actual' },
      { campo: 'area_confirmada', etiqueta: 'Área o departamento' },
      { campo: 'centro_trabajo', etiqueta: 'Sede / centro de trabajo' },
      { campo: 'fecha_ingreso', etiqueta: 'Fecha de ingreso a la empresa' },
      { campo: 'tipo_contrato', etiqueta: 'Tipo de contrato' },
      { campo: 'jornada_laboral', etiqueta: 'Jornada laboral' },
      { campo: 'horario_habitual', etiqueta: 'Horario habitual' },
      { campo: 'realiza_horas_extras', etiqueta: '¿Hace horas extras con frecuencia?' },
      { campo: 'trabaja_fines_semana', etiqueta: '¿Trabaja fines de semana?' },
      { campo: 'eps', etiqueta: 'EPS (salud)' },
      { campo: 'arl', etiqueta: 'ARL (riesgos laborales)' },
      { campo: 'fondo_pension', etiqueta: 'Fondo de pensiones' },
      { campo: 'caja_compensacion', etiqueta: 'Caja de compensación' },
      { campo: 'jefe_inmediato', etiqueta: 'Nombre del jefe inmediato', opcional: true },
    ],
  },
  {
    nombre: 'Tallas y dotación',
    campos: [
      { campo: 'estatura_cm', etiqueta: 'Estatura en centímetros' },
      { campo: 'peso_kg', etiqueta: 'Peso en kilogramos' },
      { campo: 'talla_camisa', etiqueta: 'Talla camisa / camiseta' },
      { campo: 'talla_pantalon', etiqueta: 'Talla pantalón' },
      { campo: 'talla_zapato', etiqueta: 'Talla zapato de seguridad' },
      { campo: 'talla_botas', etiqueta: 'Talla botas' },
      { campo: 'talla_guantes', etiqueta: 'Talla guantes' },
      { campo: 'talla_overol', etiqueta: 'Talla overol / mono', opcional: true },
      { campo: 'talla_chaqueta', etiqueta: 'Talla chaqueta / chaleco', opcional: true },
      { campo: 'talla_impermeable', etiqueta: 'Talla impermeable / ropa lluvia', opcional: true },
      { campo: 'obs_tallas', etiqueta: 'Observaciones sobre tallas', opcional: true },
    ],
  },
  {
    nombre: 'Desplazamiento',
    campos: [
      { campo: 'municipio_vivienda', etiqueta: 'Municipio donde vive' },
      { campo: 'medio_transporte', etiqueta: 'Medio de transporte principal' },
      { campo: 'tiempo_desplazamiento', etiqueta: 'Tiempo promedio de desplazamiento' },
      { campo: 'conduce_vehiculo', etiqueta: '¿Conduce un vehículo propio para ir al trabajo?' },
      { campo: 'tipo_vehiculo', etiqueta: 'Tipo de vehículo', soloSi: 'conduce_vehiculo' },
      { campo: 'distancia_aprox', etiqueta: 'Distancia aproximada', opcional: true },
    ],
  },
  {
    nombre: 'Hábitos y estilo de vida',
    campos: [
      { campo: 'horas_sueno', etiqueta: '¿Cuántas horas duerme normalmente?' },
      { campo: 'descanso_adecuado', etiqueta: '¿Se siente descansado al despertar?' },
      { campo: 'desayuna_diariamente', etiqueta: '¿Desayuna todos los días?' },
      { campo: 'comidas_al_dia', etiqueta: '¿Cuántas comidas hace al día?' },
      { campo: 'consume_frutas', etiqueta: '¿Consume frutas a diario?' },
      { campo: 'consume_verduras', etiqueta: '¿Consume verduras a diario?' },
      { campo: 'consumo_alcohol', etiqueta: 'Consumo de bebidas alcohólicas' },
      { campo: 'consume_energizantes', etiqueta: '¿Consume bebidas energizantes regularmente?' },
      { campo: 'consume_psicoactivos', etiqueta: '¿Consume sustancias psicoactivas?' },
      { campo: 'realiza_actividad_fisica', etiqueta: '¿Hace actividad física o ejercicio regularmente?' },
      { campo: 'dias_actividad_fisica', etiqueta: '¿Cuántos días a la semana?', soloSi: 'realiza_actividad_fisica' },
      { campo: 'tipo_actividad_fisica', etiqueta: '¿Qué actividad practica?', soloSi: 'realiza_actividad_fisica' },
      { campo: 'fuma', etiqueta: '¿Fuma cigarrillos?' },
      { campo: 'cigarrillos_dia', etiqueta: '¿Cuántos cigarrillos al día?', soloSi: 'fuma' },
    ],
  },
  {
    nombre: 'Antecedentes médicos',
    campos: [
      { campo: 'enfermedades_diagnosticadas', etiqueta: 'Enfermedades diagnosticadas' },
      { campo: 'hospitalizado', etiqueta: '¿Ha sido hospitalizado alguna vez?' },
      { campo: 'cirugias', etiqueta: '¿Ha tenido cirugías?' },
      { campo: 'alergias', etiqueta: '¿Tiene alergias conocidas?' },
      { campo: 'medicamentos_permanentes', etiqueta: '¿Toma medicamentos de forma permanente?' },
      { campo: 'limitacion_fisica', etiqueta: '¿Tiene alguna limitación física o sensorial?' },
      { campo: 'cirugias_detalle', etiqueta: '¿Qué cirugías y en qué año?', opcional: true },
      { campo: 'alergias_detalle', etiqueta: '¿A qué es alérgico/a?', opcional: true },
      { campo: 'medicamentos_detalle', etiqueta: '¿Cuáles medicamentos?', opcional: true },
      { campo: 'limitacion_detalle', etiqueta: 'Describa la limitación', opcional: true },
    ],
  },
  {
    nombre: 'Antecedentes familiares',
    campos: [
      { campo: 'antecedentes_familiares', etiqueta: 'Antecedentes familiares' },
    ],
  },
  {
    nombre: 'Salud ocupacional',
    campos: [
      { campo: 'accidentes_trabajo', etiqueta: '¿Ha sufrido accidentes de trabajo anteriormente?' },
      { campo: 'enfermedades_laborales', etiqueta: '¿Ha tenido enfermedades laborales reconocidas?' },
      { campo: 'restricciones_medicas', etiqueta: '¿Tiene restricciones médicas para ciertas actividades laborales?' },
      { campo: 'usa_gafas', etiqueta: '¿Usa gafas formuladas?' },
      { campo: 'usa_audifonos', etiqueta: '¿Usa audífonos?' },
      { campo: 'restricciones_detalle', etiqueta: 'Describa las restricciones', opcional: true },
    ],
  },
  {
    nombre: 'Riesgo psicosocial',
    campos: [
      { campo: 'trabajo_genera_estres', etiqueta: '¿Su trabajo le genera estrés frecuentemente?' },
      { campo: 'apoyo_familiar', etiqueta: '¿Cuenta con apoyo emocional de su familia?' },
      { campo: 'otro_empleo', etiqueta: '¿Tiene otro empleo además de este?' },
      { campo: 'es_cuidador', etiqueta: '¿Es cuidador de un familiar enfermo o con discapacidad?' },
      { campo: 'dificultades_economicas', etiqueta: '¿Tiene dificultades económicas importantes?' },
      { campo: 'equilibrio_trabajo_vida', etiqueta: '¿Siente que tiene buen equilibrio entre trabajo y vida personal?' },
    ],
  },
  {
    nombre: 'Competencias',
    campos: [
      { campo: 'certificaciones', etiqueta: '¿Cuál de estas certificaciones tiene vigentes? (selecciona todas las que aplican)' },
      { campo: 'licencia_conduccion', etiqueta: '¿Tiene licencia de conducción vigente?' },
      { campo: 'categoria_licencia', etiqueta: 'Categoría de la licencia', soloSi: 'licencia_conduccion' },
      { campo: 'otras_certificaciones', etiqueta: 'Otras certificaciones no listadas', opcional: true },
    ],
  },
  {
    nombre: 'Consentimientos',
    campos: [
      { campo: 'autoriza_datos', etiqueta: 'Autoriza el tratamiento de sus datos', debeSerCierto: true },
      { campo: 'declara_veracidad', etiqueta: 'Declara que la información es veraz', debeSerCierto: true },
      { campo: 'firma_electronica', etiqueta: 'Firma', opcional: true },
      { campo: 'fecha_consentimiento', etiqueta: 'Fecha del consentimiento', opcional: true },
    ],
  },
]

/** Etiqueta de un campo suelto, para mensajes y exportaciones. */
export const ETIQUETA: Record<string, string> = Object.fromEntries(
  FICHA.flatMap(s => s.campos.map(c => [c.campo, c.etiqueta]))
)
