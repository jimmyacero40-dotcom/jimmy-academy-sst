import type { WP, Analytics } from '@/lib/profile-analytics'

function bool(v?: boolean | null) { return v === true ? 'SÍ' : v === false ? 'NO' : '' }
function arr(v?: string[] | null) { return (v ?? []).join(', ') }
function imc(e?: number, p?: number) {
  if (!e || !p) return ''
  return (p / ((e / 100) ** 2)).toFixed(1)
}
function age(dob?: string) {
  if (!dob) return ''
  return String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)))
}
function antig(fi?: string) {
  if (!fi) return ''
  return String(Math.floor((Date.now() - new Date(fi).getTime()) / (365.25 * 24 * 3600 * 1000)))
}

export async function exportToExcel(profiles: WP[], analytics: Analytics, company = 'Empresa') {
  const XLSX = (await import('xlsx')).default

  // ── HOJA 1: BASE COMPLETA ────────────────────────────────────────────
  const base = profiles.map(p => ({
    'NOMBRE COMPLETO':            p.users?.name || `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim(),
    'CÉDULA':                     p.users?.cedula ?? '',
    'EMAIL':                      p.users?.email ?? '',
    'FECHA NACIMIENTO':           p.fecha_nacimiento ?? '',
    'EDAD (años)':                age(p.fecha_nacimiento),
    'SEXO':                       p.sexo ?? '',
    'ESTADO CIVIL':               p.estado_civil ?? '',
    'CIUDAD RESIDENCIA':          p.ciudad_residencia ?? '',
    'DEPTO RESIDENCIA':           p.depto_residencia ?? '',
    'MUNICIPIO VIVIENDA':         p.municipio_vivienda ?? '',
    'TIPO VIVIENDA':              p.tipo_vivienda ?? '',
    'TENENCIA VIVIENDA':          p.tenencia_vivienda ?? '',
    'ESTRATO':                    p.estrato ?? '',
    'CON QUIÉN VIVE':             p.con_quien_vive ?? '',
    'PERSONAS EN HOGAR':          p.num_personas_hogar ?? '',
    'N° HIJOS':                   p.num_hijos ?? '',
    'DEPENDIENTES ECONÓMICOS':    p.dependientes_economicos ?? '',
    'CABEZA DE HOGAR':            bool(p.cabeza_hogar),
    'ACCESO INTERNET':            bool(p.acceso_internet),
    'SERVICIOS PÚBLICOS':         arr(p.servicios_publicos),
    'NIVEL EDUCATIVO':            p.nivel_educativo ?? '',
    'PROFESIÓN':                  p.profesion ?? '',
    'ACTUALMENTE ESTUDIA':        bool(p.actualmente_estudia),
    'CARGO':                      p.cargo_confirmado ?? '',
    'ÁREA':                       p.area_confirmada ?? p.users?.area ?? '',
    'CENTRO TRABAJO / SEDE':      p.centro_trabajo ?? '',
    'TIPO CONTRATO':              p.tipo_contrato ?? '',
    'JORNADA LABORAL':            p.jornada_laboral ?? '',
    'HORARIO HABITUAL':           p.horario_habitual ?? '',
    'FECHA INGRESO':              p.fecha_ingreso ?? '',
    'ANTIGÜEDAD (años)':          antig(p.fecha_ingreso),
    'HORAS EXTRAS':               bool(p.realiza_horas_extras),
    'TRABAJA FINES DE SEMANA':    bool(p.trabaja_fines_semana),
    'MEDIO TRANSPORTE':           p.medio_transporte ?? '',
    'TIEMPO DESPLAZAMIENTO':      p.tiempo_desplazamiento ?? '',
    'CONDUCE VEHÍCULO':           bool(p.conduce_vehiculo),
    'TIPO VEHÍCULO':              p.tipo_vehiculo ?? '',
    'ESTATURA (cm)':              p.estatura_cm ?? '',
    'PESO (kg)':                  p.peso_kg ?? '',
    'IMC':                        imc(p.estatura_cm, p.peso_kg),
    'TALLA CAMISA':               p.talla_camisa ?? '',
    'TALLA CAMISETA':             p.talla_camiseta ?? '',
    'TALLA PANTALÓN':             p.talla_pantalon ?? '',
    'TALLA OVEROL':               p.talla_overol ?? '',
    'TALLA CHAQUETA':             p.talla_chaqueta ?? '',
    'TALLA IMPERMEABLE':          p.talla_impermeable ?? '',
    'TALLA ZAPATO':               p.talla_zapato ?? '',
    'TALLA BOTAS':                p.talla_botas ?? '',
    'TALLA GUANTES':              p.talla_guantes ?? '',
    'REALIZA ACTIVIDAD FÍSICA':   bool(p.realiza_actividad_fisica),
    'DÍAS ACT. FÍSICA/SEM':       p.dias_actividad_fisica ?? '',
    'TIPO ACTIVIDAD':             p.tipo_actividad_fisica ?? '',
    'HORAS SUEÑO':                p.horas_sueno ?? '',
    'DESCANSO ADECUADO':          bool(p.descanso_adecuado),
    'DESAYUNA DIARIO':            bool(p.desayuna_diariamente),
    'COMIDAS AL DÍA':             p.comidas_al_dia ?? '',
    'CONSUME FRUTAS':             bool(p.consume_frutas),
    'CONSUME VERDURAS':           bool(p.consume_verduras),
    'FUMA':                       bool(p.fuma),
    'CIGARRILLOS/DÍA':            p.cigarrillos_dia ?? '',
    'CONSUMO ALCOHOL':            p.consumo_alcohol ?? '',
    'CONSUME ENERGIZANTES':       bool(p.consume_energizantes),
    'CONSUME PSICOACTIVOS':       p.consume_psicoactivos ?? '',
    'ENFERMEDADES DIAGNOSTICADAS':arr(p.enfermedades_diagnosticadas),
    'HOSPITALIZADO':              bool(p.hospitalizado),
    'CIRUGÍAS':                   bool(p.cirugias),
    'ALERGIAS':                   bool(p.alergias),
    'MEDICAMENTOS PERMANENTES':   bool(p.medicamentos_permanentes),
    'LIMITACIÓN FÍSICA':          bool(p.limitacion_fisica),
    'ANTECEDENTES FAMILIARES':    arr(p.antecedentes_familiares),
    'ACCIDENTES DE TRABAJO':      bool(p.accidentes_trabajo),
    'ENFERMEDADES LABORALES':     bool(p.enfermedades_laborales),
    'RESTRICCIONES MÉDICAS':      bool(p.restricciones_medicas),
    'USA GAFAS':                  bool(p.usa_gafas),
    'USA AUDÍFONOS':              bool(p.usa_audifonos),
    'TRABAJO GENERA ESTRÉS':      bool(p.trabajo_genera_estres),
    'APOYO FAMILIAR':             bool(p.apoyo_familiar),
    'OTRO EMPLEO':                bool(p.otro_empleo),
    'ES CUIDADOR':                bool(p.es_cuidador),
    'DIFICULTADES ECONÓMICAS':    bool(p.dificultades_economicas),
    'EQUILIBRIO TRABAJO/VIDA':    bool(p.equilibrio_trabajo_vida),
    'LICENCIA CONDUCCIÓN':        bool(p.licencia_conduccion),
    'CATEGORÍA LICENCIA':         p.categoria_licencia ?? '',
    'CERTIFICACIONES':            arr(p.certificaciones),
    'OTRAS CERTIFICACIONES':      p.otras_certificaciones ?? '',
    'COMPLETITUD (%)':            p.completion_pct ?? 0,
    'ÚLTIMA ACTUALIZACIÓN':       p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-CO') : '',
  }))

  const ws1 = XLSX.utils.json_to_sheet(base)
  ws1['!autofilter'] = { ref: `A1:BW1` }
  // Column widths
  ws1['!cols'] = [
    { wch: 28 },{ wch: 14 },{ wch: 28 },{ wch: 16 },{ wch: 10 },
    { wch: 12 },{ wch: 16 },{ wch: 18 },{ wch: 18 },{ wch: 18 },
    ...Array(60).fill({ wch: 18 }),
  ]

  // ── HOJA 2: INDICADORES ──────────────────────────────────────────────
  const indicadores: (string | number)[][] = [
    ['INDICADORES DE CARACTERIZACIÓN SOCIODEMOGRÁFICA'],
    [`Empresa: ${company}`, '', `Fecha: ${new Date().toLocaleDateString('es-CO')}`],
    [],
    ['INDICADOR', 'VALOR', 'UNIDAD'],
    ['Total de trabajadores con ficha', analytics.total, 'trabajadores'],
    ['Avance promedio de diligenciamiento', analytics.avgPct, '%'],
    ['Fichas con completitud ≥ 80%', analytics.complete80, 'fichas'],
    ['Edad promedio', analytics.avgAge ?? 'Sin datos', 'años'],
    ['Antigüedad promedio', analytics.avgAntiguedad ?? 'Sin datos', 'años'],
    ['Promedio hijos por trabajador', analytics.avgHijos, 'hijos'],
    ['Promedio personas en el hogar', analytics.avgPersonasHogar, 'personas'],
    ['Estatura promedio', analytics.avgEstatura ?? 'Sin datos', 'cm'],
    ['Peso promedio', analytics.avgPeso ?? 'Sin datos', 'kg'],
    ['IMC promedio', analytics.avgImc ?? 'Sin datos', 'kg/m²'],
    ['Horas de sueño promedio', analytics.avgHorasSueno ?? 'Sin datos', 'horas'],
    ['Trabajan en horas extras', analytics.horasExtras.pctSi, '%'],
    ['Realizan actividad física', analytics.actividadFisica.pctSi, '%'],
    ['Fumadores', analytics.fuma.pctSi, '%'],
    ['Con estrés laboral', analytics.estres.pctSi, '%'],
    ['Con accidentes de trabajo previos', analytics.accidentesTrabajo.pctSi, '%'],
    ['Con enfermedades laborales', analytics.enfermedadesLaborales.pctSi, '%'],
    ['Cabeza de hogar', analytics.cabezaHogar.pctSi, '%'],
    ['Con limitación física', analytics.limitacionFisica.pctSi, '%'],
    ['Con restricciones médicas', analytics.restriccionesMedicas.pctSi, '%'],
    ['Tienen licencia de conducción', analytics.licenciaConduccion.pctSi, '%'],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(indicadores)
  ws2['!cols'] = [{ wch: 42 }, { wch: 14 }, { wch: 14 }]

  // ── HOJA 3: FRECUENCIAS ──────────────────────────────────────────────
  const makeFreqBlock = (title: string, rows: { label: string; n: number; pct: number }[]) => [
    [title, 'N', '%'],
    ...rows.map(r => [r.label, r.n, r.pct]),
    [],
  ]

  const freqs: (string | number)[][] = [
    ['DISTRIBUCIONES DE FRECUENCIA'],
    [],
    ...makeFreqBlock('SEXO', analytics.sexo),
    ...makeFreqBlock('GRUPOS DE EDAD', analytics.ageGroups),
    ...makeFreqBlock('ESTADO CIVIL', analytics.estadoCivil),
    ...makeFreqBlock('CIUDAD DE RESIDENCIA', analytics.ciudad.slice(0, 10)),
    ...makeFreqBlock('TIPO DE VIVIENDA', analytics.tipoVivienda),
    ...makeFreqBlock('TENENCIA DE VIVIENDA', analytics.tenenciaVivienda),
    ...makeFreqBlock('ESTRATO', analytics.estrato),
    ...makeFreqBlock('CON QUIÉN VIVE', analytics.conQuienVive),
    ...makeFreqBlock('NIVEL EDUCATIVO', analytics.nivelEducativo),
    ...makeFreqBlock('TIPO DE CONTRATO', analytics.tipoContrato),
    ...makeFreqBlock('JORNADA LABORAL', analytics.jornadaLaboral),
    ...makeFreqBlock('MEDIO DE TRANSPORTE', analytics.medioTransporte),
    ...makeFreqBlock('TIEMPO DE DESPLAZAMIENTO', analytics.tiempoDesplaz),
    ...makeFreqBlock('ÁREAS', analytics.areas),
    ...makeFreqBlock('CARGOS', analytics.cargos.slice(0, 15)),
    ...makeFreqBlock('CONSUMO DE ALCOHOL', analytics.consumoAlcohol),
    ...makeFreqBlock('ENFERMEDADES DIAGNOSTICADAS', analytics.enfermedades),
    ...makeFreqBlock('ANTECEDENTES FAMILIARES', analytics.antecedentes),
    ...makeFreqBlock('CERTIFICACIONES', analytics.certificaciones),
    ...makeFreqBlock('TALLA CAMISA', analytics.tallaCamisa),
    ...makeFreqBlock('TALLA PANTALÓN', analytics.tallaPantalon),
    ...makeFreqBlock('TALLA ZAPATO', analytics.tallaZapato),
    ...makeFreqBlock('TALLA BOTAS', analytics.tallaBotas),
    ...makeFreqBlock('TALLA GUANTES', analytics.tallaGuantes),
  ]
  const ws3 = XLSX.utils.aoa_to_sheet(freqs)
  ws3['!cols'] = [{ wch: 36 }, { wch: 8 }, { wch: 8 }]

  // ── HOJA 4: RESUMEN BOOLEANOS ────────────────────────────────────────
  const boolRows: (string | number)[][] = [
    ['VARIABLE', 'SÍ', 'NO', '% SÍ', '% NO'],
    ...([
      ['Cabeza de hogar', analytics.cabezaHogar],
      ['Acceso a internet', { si: 0, no: 0, pctSi: 0 }],
      ['Actualmente estudia', analytics.estudiaActualmente],
      ['Realiza horas extras', analytics.horasExtras],
      ['Trabaja fines de semana', analytics.trabFinesSemana],
      ['Conduce vehículo', analytics.conduceVehiculo],
      ['Realiza actividad física', analytics.actividadFisica],
      ['Descanso adecuado', analytics.descansoAdecuado],
      ['Desayuna diariamente', analytics.desayunaDisario],
      ['Consume frutas', analytics.consumeFrutas],
      ['Consume verduras', analytics.consumeVerduras],
      ['Fuma', analytics.fuma],
      ['Consume energizantes', analytics.consumeEnergizantes],
      ['Hospitalizado', analytics.hospitalizado],
      ['Cirugías', analytics.cirugias],
      ['Alergias', analytics.alergias],
      ['Medicamentos permanentes', analytics.medicamentosPerm],
      ['Limitación física', analytics.limitacionFisica],
      ['USA gafas', analytics.usaGafas],
      ['USA audífonos', analytics.usaAudifonos],
      ['Accidentes de trabajo', analytics.accidentesTrabajo],
      ['Enfermedades laborales', analytics.enfermedadesLaborales],
      ['Restricciones médicas', analytics.restriccionesMedicas],
      ['Trabajo genera estrés', analytics.estres],
      ['Apoyo familiar', analytics.apoyoFamiliar],
      ['Otro empleo', analytics.otroEmpleo],
      ['Es cuidador', analytics.esCuidador],
      ['Dificultades económicas', analytics.dificultadesEconomicas],
      ['Equilibrio trabajo/vida', analytics.equilibrioVida],
      ['Licencia de conducción', analytics.licenciaConduccion],
    ] as [string, { si: number; no: number; pctSi: number }][]).map(([label, b]) =>
      [label, b.si, b.no, b.pctSi, 100 - b.pctSi]
    ),
  ]
  const ws4 = XLSX.utils.aoa_to_sheet(boolRows)
  ws4['!cols'] = [{ wch: 32 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }]

  // ── Assemble workbook ────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, '1. Base de datos')
  XLSX.utils.book_append_sheet(wb, ws2, '2. Indicadores')
  XLSX.utils.book_append_sheet(wb, ws3, '3. Frecuencias')
  XLSX.utils.book_append_sheet(wb, ws4, '4. Variables booleanas')

  XLSX.writeFile(wb, `Caracterizacion_${company.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
