// ─── Shared analytics layer for Perfil Integral del Trabajador ───────
// Used by: dashboard, Excel export, PDF export
// ─────────────────────────────────────────────────────────────────────

export interface WP {
  id: string; user_id: string; completion_pct: number; updated_at: string
  nombres?: string; apellidos?: string; fecha_nacimiento?: string; sexo?: string
  estado_civil?: string; ciudad_residencia?: string; depto_residencia?: string
  municipio_vivienda?: string; nacionalidad?: string
  tipo_vivienda?: string; tenencia_vivienda?: string; estrato?: number
  servicios_publicos?: string[]; acceso_internet?: boolean
  con_quien_vive?: string; num_hijos?: number; num_personas_hogar?: number
  dependientes_economicos?: number; cabeza_hogar?: boolean
  nivel_educativo?: string; profesion?: string; actualmente_estudia?: boolean
  cargo_confirmado?: string; area_confirmada?: string; tipo_contrato?: string
  jornada_laboral?: string; fecha_ingreso?: string; centro_trabajo?: string
  realiza_horas_extras?: boolean; trabaja_fines_semana?: boolean; horario_habitual?: string
  medio_transporte?: string; tiempo_desplazamiento?: string
  conduce_vehiculo?: boolean; tipo_vehiculo?: string
  estatura_cm?: number; peso_kg?: number
  talla_camisa?: string; talla_camiseta?: string; talla_pantalon?: string
  talla_overol?: string; talla_chaqueta?: string; talla_impermeable?: string
  talla_zapato?: string; talla_botas?: string; talla_guantes?: string
  realiza_actividad_fisica?: boolean; dias_actividad_fisica?: number; tipo_actividad_fisica?: string
  horas_sueno?: number; descanso_adecuado?: boolean; desayuna_diariamente?: boolean
  comidas_al_dia?: number; consume_frutas?: boolean; consume_verduras?: boolean
  fuma?: boolean; cigarrillos_dia?: number; consumo_alcohol?: string
  consume_energizantes?: boolean; consume_psicoactivos?: string
  enfermedades_diagnosticadas?: string[]; hospitalizado?: boolean
  cirugias?: boolean; alergias?: boolean; medicamentos_permanentes?: boolean
  limitacion_fisica?: boolean; antecedentes_familiares?: string[]
  accidentes_trabajo?: boolean; enfermedades_laborales?: boolean
  restricciones_medicas?: boolean; usa_gafas?: boolean; usa_audifonos?: boolean
  trabajo_genera_estres?: boolean; apoyo_familiar?: boolean; otro_empleo?: boolean
  es_cuidador?: boolean; dificultades_economicas?: boolean; equilibrio_trabajo_vida?: boolean
  licencia_conduccion?: boolean; categoria_licencia?: string
  certificaciones?: string[]; otras_certificaciones?: string
  autoriza_datos?: boolean; declara_veracidad?: boolean
  users?: { name?: string; cedula?: string; email?: string; area?: string }
}

export interface FreqRow { label: string; n: number; pct: number }
export interface BoolStat { si: number; no: number; pctSi: number }

export interface Analytics {
  // ── meta ──
  total: number
  nProfiles: number
  avgPct: number
  complete80: number
  lastUpdate: string | null
  // ── demografia ──
  avgAge: number | null
  avgAntiguedad: number | null
  sexo: FreqRow[]
  ageGroups: FreqRow[]
  estadoCivil: FreqRow[]
  ciudad: FreqRow[]
  // ── vivienda ──
  tipoVivienda: FreqRow[]
  tenenciaVivienda: FreqRow[]
  estrato: FreqRow[]
  avgHijos: number
  avgPersonasHogar: number
  cabezaHogar: BoolStat
  conQuienVive: FreqRow[]
  // ── educacion ──
  nivelEducativo: FreqRow[]
  profesiones: FreqRow[]
  estudiaActualmente: BoolStat
  // ── laboral ──
  areas: FreqRow[]
  cargos: FreqRow[]
  tipoContrato: FreqRow[]
  jornadaLaboral: FreqRow[]
  horasExtras: BoolStat
  trabFinesSemana: BoolStat
  // ── desplazamiento ──
  medioTransporte: FreqRow[]
  tiempoDesplaz: FreqRow[]
  conduceVehiculo: BoolStat
  // ── tallas ──
  avgEstatura: number | null
  avgPeso: number | null
  avgImc: number | null
  tallaCamisa: FreqRow[]; tallaCamiseta: FreqRow[]; tallaPantalon: FreqRow[]
  tallaOverol: FreqRow[]; tallaChaqueta: FreqRow[]; tallaImpermeable: FreqRow[]
  tallaZapato: FreqRow[]; tallaBotas: FreqRow[]; tallaGuantes: FreqRow[]
  // ── estilos de vida ──
  actividadFisica: BoolStat
  avgDiasActividad: number
  avgHorasSueno: number | null
  descansoAdecuado: BoolStat
  desayunaDisario: BoolStat
  consumeFrutas: BoolStat
  consumeVerduras: BoolStat
  fuma: BoolStat
  consumoAlcohol: FreqRow[]
  consumeEnergizantes: BoolStat
  // ── salud ──
  enfermedades: FreqRow[]
  hospitalizado: BoolStat
  cirugias: BoolStat
  alergias: BoolStat
  medicamentosPerm: BoolStat
  limitacionFisica: BoolStat
  antecedentes: FreqRow[]
  usaGafas: BoolStat
  usaAudifonos: BoolStat
  // ── salud ocupacional ──
  accidentesTrabajo: BoolStat
  enfermedadesLaborales: BoolStat
  restriccionesMedicas: BoolStat
  // ── psicosocial ──
  estres: BoolStat
  apoyoFamiliar: BoolStat
  otroEmpleo: BoolStat
  esCuidador: BoolStat
  dificultadesEconomicas: BoolStat
  equilibrioVida: BoolStat
  // ── competencias ──
  licenciaConduccion: BoolStat
  categoriaLicencia: FreqRow[]
  certificaciones: FreqRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────
function p(n: number, total: number) { return total ? Math.round((n * 100) / total) : 0 }

function freq(vals: (string | number | undefined | null)[]): FreqRow[] {
  const m: Record<string, number> = {}
  vals.forEach(v => { if (v !== null && v !== undefined && v !== '') { const k = String(v); m[k] = (m[k] ?? 0) + 1 } })
  const total = Object.values(m).reduce((a, b) => a + b, 0)
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n, pct: p(n, total) }))
}

function flatFreq(arrays: (string[] | undefined | null)[]): FreqRow[] {
  return freq(arrays.flatMap(a => a ?? []))
}

function boolStat(arr: WP[], fn: (w: WP) => boolean | undefined | null, base?: number): BoolStat {
  const answered = arr.filter(w => fn(w) !== null && fn(w) !== undefined)
  const si = answered.filter(w => fn(w) === true).length
  const total = base ?? answered.length
  return { si, no: total - si, pctSi: p(si, total) }
}

function avgNum(arr: WP[], fn: (w: WP) => number | undefined | null): number | null {
  const vals = arr.map(fn).filter(v => v !== null && v !== undefined) as number[]
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
}

function ageOf(dob?: string): number | null {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function antiguedadYears(fechaIngreso?: string): number | null {
  if (!fechaIngreso) return null
  return Math.floor((Date.now() - new Date(fechaIngreso).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function imc(e?: number, p2?: number): number | null {
  if (!e || !p2) return null
  return Math.round((p2 / ((e / 100) ** 2)) * 10) / 10
}

// ── Main computation ──────────────────────────────────────────────────
export function computeAnalytics(profiles: WP[]): Analytics {
  const n = profiles.length

  const ages = profiles.map(w => ageOf(w.fecha_nacimiento)).filter(Boolean) as number[]
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null

  const ants = profiles.map(w => antiguedadYears(w.fecha_ingreso)).filter(Boolean) as number[]
  const avgAntiguedad = ants.length ? Math.round(ants.reduce((a, b) => a + b, 0) / ants.length) : null

  const ageGroups: FreqRow[] = [
    { label: '18-25 años', n: ages.filter(a => a >= 18 && a <= 25).length, pct: 0 },
    { label: '26-35 años', n: ages.filter(a => a >= 26 && a <= 35).length, pct: 0 },
    { label: '36-45 años', n: ages.filter(a => a >= 36 && a <= 45).length, pct: 0 },
    { label: '46-55 años', n: ages.filter(a => a >= 46 && a <= 55).length, pct: 0 },
    { label: '56+ años',   n: ages.filter(a => a >= 56).length, pct: 0 },
  ].map(g => ({ ...g, pct: p(g.n, ages.length || 1) }))

  const icmVals = profiles.map(w => imc(w.estatura_cm, w.peso_kg)).filter(Boolean) as number[]
  const avgImc = icmVals.length ? Math.round(icmVals.reduce((a, b) => a + b, 0) / icmVals.length * 10) / 10 : null

  const sorted = [...profiles].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  return {
    total: n,
    nProfiles: n,
    avgPct: n ? Math.round(profiles.reduce((s, p2) => s + (p2.completion_pct ?? 0), 0) / n) : 0,
    complete80: profiles.filter(p2 => (p2.completion_pct ?? 0) >= 80).length,
    lastUpdate: sorted[0]?.updated_at ?? null,
    avgAge,
    avgAntiguedad,
    sexo: freq(profiles.map(w => w.sexo)),
    ageGroups,
    estadoCivil: freq(profiles.map(w => w.estado_civil)),
    ciudad: freq(profiles.map(w => w.ciudad_residencia || w.municipio_vivienda)),
    tipoVivienda: freq(profiles.map(w => w.tipo_vivienda)),
    tenenciaVivienda: freq(profiles.map(w => w.tenencia_vivienda)),
    estrato: freq(profiles.map(w => w.estrato ? `Estrato ${w.estrato}` : undefined)),
    avgHijos: avgNum(profiles, w => w.num_hijos) ?? 0,
    avgPersonasHogar: avgNum(profiles, w => w.num_personas_hogar) ?? 0,
    cabezaHogar: boolStat(profiles, w => w.cabeza_hogar),
    conQuienVive: freq(profiles.map(w => w.con_quien_vive)),
    nivelEducativo: freq(profiles.map(w => w.nivel_educativo)),
    profesiones: freq(profiles.map(w => w.profesion)),
    estudiaActualmente: boolStat(profiles, w => w.actualmente_estudia),
    areas: freq(profiles.map(w => w.area_confirmada || w.users?.area)),
    cargos: freq(profiles.map(w => w.cargo_confirmado)),
    tipoContrato: freq(profiles.map(w => w.tipo_contrato)),
    jornadaLaboral: freq(profiles.map(w => w.jornada_laboral)),
    horasExtras: boolStat(profiles, w => w.realiza_horas_extras),
    trabFinesSemana: boolStat(profiles, w => w.trabaja_fines_semana),
    medioTransporte: freq(profiles.map(w => w.medio_transporte)),
    tiempoDesplaz: freq(profiles.map(w => w.tiempo_desplazamiento)),
    conduceVehiculo: boolStat(profiles, w => w.conduce_vehiculo),
    avgEstatura: avgNum(profiles, w => w.estatura_cm),
    avgPeso: avgNum(profiles, w => w.peso_kg),
    avgImc,
    tallaCamisa: freq(profiles.map(w => w.talla_camisa)),
    tallaCamiseta: freq(profiles.map(w => w.talla_camiseta)),
    tallaPantalon: freq(profiles.map(w => w.talla_pantalon)),
    tallaOverol: freq(profiles.map(w => w.talla_overol)),
    tallaChaqueta: freq(profiles.map(w => w.talla_chaqueta)),
    tallaImpermeable: freq(profiles.map(w => w.talla_impermeable)),
    tallaZapato: freq(profiles.map(w => w.talla_zapato)),
    tallaBotas: freq(profiles.map(w => w.talla_botas)),
    tallaGuantes: freq(profiles.map(w => w.talla_guantes)),
    actividadFisica: boolStat(profiles, w => w.realiza_actividad_fisica),
    avgDiasActividad: avgNum(profiles.filter(w => w.realiza_actividad_fisica), w => w.dias_actividad_fisica) ?? 0,
    avgHorasSueno: avgNum(profiles, w => w.horas_sueno),
    descansoAdecuado: boolStat(profiles, w => w.descanso_adecuado),
    desayunaDisario: boolStat(profiles, w => w.desayuna_diariamente),
    consumeFrutas: boolStat(profiles, w => w.consume_frutas),
    consumeVerduras: boolStat(profiles, w => w.consume_verduras),
    fuma: boolStat(profiles, w => w.fuma),
    consumoAlcohol: freq(profiles.map(w => w.consumo_alcohol)),
    consumeEnergizantes: boolStat(profiles, w => w.consume_energizantes),
    enfermedades: flatFreq(profiles.map(w => w.enfermedades_diagnosticadas)),
    hospitalizado: boolStat(profiles, w => w.hospitalizado),
    cirugias: boolStat(profiles, w => w.cirugias),
    alergias: boolStat(profiles, w => w.alergias),
    medicamentosPerm: boolStat(profiles, w => w.medicamentos_permanentes),
    limitacionFisica: boolStat(profiles, w => w.limitacion_fisica),
    antecedentes: flatFreq(profiles.map(w => w.antecedentes_familiares)),
    usaGafas: boolStat(profiles, w => w.usa_gafas),
    usaAudifonos: boolStat(profiles, w => w.usa_audifonos),
    accidentesTrabajo: boolStat(profiles, w => w.accidentes_trabajo),
    enfermedadesLaborales: boolStat(profiles, w => w.enfermedades_laborales),
    restriccionesMedicas: boolStat(profiles, w => w.restricciones_medicas),
    estres: boolStat(profiles, w => w.trabajo_genera_estres),
    apoyoFamiliar: boolStat(profiles, w => w.apoyo_familiar),
    otroEmpleo: boolStat(profiles, w => w.otro_empleo),
    esCuidador: boolStat(profiles, w => w.es_cuidador),
    dificultadesEconomicas: boolStat(profiles, w => w.dificultades_economicas),
    equilibrioVida: boolStat(profiles, w => w.equilibrio_trabajo_vida),
    licenciaConduccion: boolStat(profiles, w => w.licencia_conduccion),
    categoriaLicencia: freq(profiles.filter(w => w.licencia_conduccion).map(w => w.categoria_licencia)),
    certificaciones: flatFreq(profiles.map(w => w.certificaciones)),
  }
}

// ── Auto-text generator ───────────────────────────────────────────────
export function generateAutoText(a: Analytics, company = 'la organización') {
  const top = (arr: FreqRow[], i = 0) => arr[i]
  const pctSi = (b: BoolStat) => b.pctSi

  const resumen = [
    `${company} cuenta con ${a.total} trabajador${a.total !== 1 ? 'es' : ''} con ficha de caracterización diligenciada, ` +
    `representando un avance promedio de ${a.avgPct}% en el diligenciamiento del perfil.`,
    a.avgAge ? `La edad promedio de la población es de ${a.avgAge} años.` : '',
    a.sexo[0] ? `El ${a.sexo[0].pct}% de los trabajadores corresponde al sexo ${a.sexo[0].label.toLowerCase()}.` : '',
    a.nivelEducativo[0] ? `El nivel educativo predominante es ${a.nivelEducativo[0].label} (${a.nivelEducativo[0].pct}%).` : '',
    a.tipoContrato[0] ? `La modalidad contractual más frecuente es ${a.tipoContrato[0].label.toLowerCase()} (${a.tipoContrato[0].pct}%).` : '',
    a.medioTransporte[0] ? `El ${a.medioTransporte[0].pct}% utiliza ${a.medioTransporte[0].label.toLowerCase()} como medio de transporte.` : '',
    pctSi(a.actividadFisica) > 0 ? `El ${pctSi(a.actividadFisica)}% reporta realizar actividad física regularmente.` : '',
    pctSi(a.fuma) > 0 ? `El ${pctSi(a.fuma)}% de los trabajadores consume tabaco.` : '',
    pctSi(a.estres) > 0 ? `El ${pctSi(a.estres)}% manifiesta que su trabajo le genera estrés.` : '',
  ].filter(Boolean).join(' ')

  const conclusiones: string[] = []
  if (pctSi(a.estres) >= 40) conclusiones.push(`Alto nivel de estrés laboral (${pctSi(a.estres)}%): se recomienda implementar pausas activas, programa de manejo del estrés y revisión de cargas laborales.`)
  if (pctSi(a.actividadFisica) < 50) conclusiones.push(`Sedentarismo elevado (${100 - pctSi(a.actividadFisica)}% no realiza actividad física): se sugiere promover pausas activas y programas de bienestar físico.`)
  if (pctSi(a.fuma) >= 15) conclusiones.push(`Prevalencia de tabaquismo significativa (${pctSi(a.fuma)}%): implementar programa de cesación de tabaquismo.`)
  if (pctSi(a.accidentesTrabajo) > 0) conclusiones.push(`El ${pctSi(a.accidentesTrabajo)}% ha sufrido accidentes de trabajo previos: revisar protocolos de seguridad y programas de prevención.`)
  if (pctSi(a.dificultadesEconomicas) >= 30) conclusiones.push(`El ${pctSi(a.dificultadesEconomicas)}% reporta dificultades económicas: considerar auxilio de alimentación, transporte y programas de bienestar económico.`)
  if (a.avgImc && a.avgImc >= 25) conclusiones.push(`El IMC promedio es ${a.avgImc} (${a.avgImc >= 30 ? 'Obesidad' : 'Sobrepeso'}): promover hábitos alimenticios saludables y actividad física.`)
  if (pctSi(a.hospitalizado) >= 20) conclusiones.push(`Alta tasa de hospitalizaciones previas (${pctSi(a.hospitalizado)}%): fortalecer vigilancia médica periódica.`)
  if (pctSi(a.esCuidador) >= 20) conclusiones.push(`El ${pctSi(a.esCuidador)}% es cuidador de otra persona: considerar políticas de flexibilidad horaria y apoyo emocional.`)
  if (conclusiones.length === 0) conclusiones.push('No se identificaron alertas de riesgo significativas en la población. Continuar con la vigilancia periódica.')

  return { resumen, conclusiones }
}
