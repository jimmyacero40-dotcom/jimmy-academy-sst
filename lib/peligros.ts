// ─── Participación anual en la identificación de peligros ─────────────
// Una sola definición de las preguntas y del catálogo de peligros, usada por
// la encuesta del trabajador, la consulta del administrador, el PDF y el Excel.
// Si las preguntas cambian, cambian en un solo sitio.
// ──────────────────────────────────────────────────────────────────────

export interface Participacion {
  id?: string
  user_id?: string
  periodo?: number
  trabajador_nombre?: string | null
  trabajador_cedula?: string | null
  empresa?: string | null
  cargo?: string | null
  area?: string | null
  centro_trabajo?: string | null

  actividades?: string | null
  herramientas?: string | null
  situaciones_riesgo?: string | null
  peligros?: string[] | null
  peligros_otro?: string | null
  donde_cuando?: string | null
  frecuencia?: string | null
  controles_existentes?: string | null
  controles_suficientes?: string | null
  oportunidades_mejora?: string | null
  cambios_ultimo_ano?: string | null
  peligro_prioritario?: string | null
  otros_peligros?: string | null
  confirma_participacion?: boolean | null

  estado?: 'borrador' | 'enviado'
  enviado_at?: string | null
  updated_at?: string | null
}

/**
 * Catálogo de peligros agrupado por las clases de la GTC 45, pero redactado
 * en las palabras que usa el trabajador. El valor guardado es la etiqueta:
 * así el histórico sigue siendo legible aunque el catálogo cambie después.
 */
export const GRUPOS_PELIGROS: { grupo: string; color: string; opciones: string[] }[] = [
  {
    grupo: 'Condiciones de seguridad', color: '#EF4444',
    opciones: [
      'Caídas al mismo nivel (resbalones, tropiezos)',
      'Caídas de altura (escaleras, andamios, techos)',
      'Golpes o atrapamientos con máquinas o herramientas',
      'Cortes con herramientas o elementos filosos',
      'Contacto con electricidad',
      'Accidentes de tránsito o con vehículos y maquinaria',
      'Caída de objetos o materiales',
      'Incendio o explosión',
      'Espacios confinados',
      'Robos, atracos o agresiones de terceros',
    ],
  },
  {
    grupo: 'Biomecánico (esfuerzo del cuerpo)', color: '#F59E0B',
    opciones: [
      'Levantar o mover cargas pesadas',
      'Movimientos repetitivos',
      'Posturas forzadas o incómodas',
      'Estar mucho tiempo de pie o sentado',
    ],
  },
  {
    grupo: 'Físico (el ambiente de trabajo)', color: '#3B82F6',
    opciones: [
      'Ruido',
      'Vibraciones',
      'Calor excesivo',
      'Frío excesivo',
      'Iluminación deficiente',
      'Radiación solar (trabajo a la intemperie)',
    ],
  },
  {
    grupo: 'Químico', color: '#8B5CF6',
    opciones: [
      'Plaguicidas o agroquímicos',
      'Polvos o material particulado',
      'Gases, vapores o humos',
      'Combustibles, aceites o solventes',
      'Productos de limpieza o desinfección',
    ],
  },
  {
    grupo: 'Biológico', color: '#10B981',
    opciones: [
      'Contacto con animales',
      'Picaduras o mordeduras (insectos, serpientes)',
      'Hongos, bacterias o virus',
      'Aguas residuales o residuos orgánicos',
    ],
  },
  {
    grupo: 'Psicosocial', color: '#EC4899',
    opciones: [
      'Carga de trabajo o afán por cumplir tiempos',
      'Jornadas largas o turnos',
      'Trato difícil con compañeros o jefes',
      'Trabajo aislado o solo',
    ],
  },
  {
    grupo: 'Fenómenos naturales', color: '#06B6D4',
    opciones: [
      'Tormentas eléctricas',
      'Inundaciones o crecientes',
      'Deslizamientos o terrenos inestables',
      'Sismos',
    ],
  },
]

/** Lista plana, en el orden del catálogo: así se tabula siempre igual. */
export const PELIGROS = GRUPOS_PELIGROS.flatMap(g => g.opciones)

export const GRUPO_DE_PELIGRO: Record<string, string> = Object.fromEntries(
  GRUPOS_PELIGROS.flatMap(g => g.opciones.map(o => [o, g.grupo])),
)

export const FRECUENCIAS = [
  'Todos los días',
  'Varias veces a la semana',
  'Una vez a la semana',
  'Algunas veces al mes',
  'Solo en tareas ocasionales',
]

export const SUFICIENCIA_CONTROLES = [
  'Sí, son suficientes',
  'Son suficientes solo en parte',
  'No son suficientes',
  'No sé',
]

export const CAMBIOS_ULTIMO_ANO = [
  'No hubo cambios',
  'Cambió la tarea que hago',
  'Cambiaron las herramientas o máquinas',
  'Cambió el lugar de trabajo',
  'Entró personal nuevo',
  'Otro cambio',
]

/** Las doce preguntas, en orden, tal como se definieron. */
export interface Pregunta {
  n: number
  campo: keyof Participacion
  titulo: string
  ayuda?: string
  tipo: 'texto' | 'peligros' | 'opcion' | 'confirmacion'
  opciones?: string[]
  obligatoria?: boolean
  placeholder?: string
}

export const PREGUNTAS: Pregunta[] = [
  { n: 1, campo: 'actividades', tipo: 'texto', obligatoria: true,
    titulo: '¿Cuáles son las principales actividades que usted realiza?',
    ayuda: 'Cuente con sus palabras qué hace en un día normal de trabajo.',
    placeholder: 'Ej: fumigo los lotes, cargo bultos, manejo el tractor…' },

  { n: 2, campo: 'herramientas', tipo: 'texto', obligatoria: true,
    titulo: '¿Qué herramientas, equipos, máquinas, vehículos o elementos especiales usa?',
    ayuda: 'Incluya todo lo que maneja, aunque sea de vez en cuando.',
    placeholder: 'Ej: guadaña, fumigadora de espalda, motosierra, camioneta…' },

  { n: 3, campo: 'situaciones_riesgo', tipo: 'texto', obligatoria: true,
    titulo: '¿Qué situaciones cree que podrían causar un accidente, una lesión o afectar su salud?',
    ayuda: 'Piense en lo que ha pasado o en lo que estuvo cerca de pasar.',
    placeholder: 'Ej: el piso queda resbaloso cuando llueve…' },

  { n: 4, campo: 'peligros', tipo: 'peligros', obligatoria: true,
    titulo: '¿A cuáles de estos peligros está expuesto en su trabajo?',
    ayuda: 'Marque todos los que apliquen. Puede marcar varios.' },

  { n: 5, campo: 'donde_cuando', tipo: 'texto', obligatoria: true,
    titulo: '¿Dónde y cuándo se presentan esos peligros?',
    ayuda: 'En qué lote, zona o momento de la jornada.',
    placeholder: 'Ej: en la bodega, al descargar por la mañana…' },

  { n: 6, campo: 'frecuencia', tipo: 'opcion', opciones: FRECUENCIAS, obligatoria: true,
    titulo: '¿Con qué frecuencia está expuesto a ellos?' },

  { n: 7, campo: 'controles_existentes', tipo: 'texto', obligatoria: true,
    titulo: '¿Qué medidas existen hoy para protegerlo?',
    ayuda: 'Elementos de protección, capacitaciones, señalización, procedimientos…',
    placeholder: 'Ej: me dan guantes y careta, hubo capacitación de alturas…' },

  { n: 8, campo: 'controles_suficientes', tipo: 'opcion', opciones: SUFICIENCIA_CONTROLES, obligatoria: true,
    titulo: '¿Esas medidas le parecen suficientes?',
    ayuda: 'Después podrá contarnos qué se podría mejorar.' },

  { n: 9, campo: 'cambios_ultimo_ano', tipo: 'opcion', opciones: CAMBIOS_ULTIMO_ANO, obligatoria: true,
    titulo: '¿Hubo cambios en su trabajo durante el último año?' },

  { n: 10, campo: 'peligro_prioritario', tipo: 'texto', obligatoria: true,
    titulo: 'De todo lo anterior, ¿qué peligro debería recibir mayor atención?',
    ayuda: 'El que usted considera más importante de atender primero.',
    placeholder: 'Ej: las caídas en el beneficiadero cuando está mojado' },

  { n: 11, campo: 'otros_peligros', tipo: 'texto',
    titulo: '¿Hay algún otro peligro o situación que no se haya mencionado?',
    ayuda: 'Opcional. Si no hay nada más, escriba NINGUNO.',
    placeholder: 'Escriba aquí lo que falte' },

  { n: 12, campo: 'confirma_participacion', tipo: 'confirmacion',
    titulo: 'Confirmación de participación',
    ayuda: 'Confirme que la información que entregó es suya y es verdadera.' },
]

/** Campo extra de la pregunta 8, que se muestra pegado a ella. */
export const CAMPO_MEJORAS: { campo: keyof Participacion; titulo: string; placeholder: string } = {
  campo: 'oportunidades_mejora',
  titulo: '¿Qué se podría mejorar?',
  placeholder: 'Ej: que la escalera tenga barandas',
}

export function estaCompleta(p: Participacion): boolean {
  for (const q of PREGUNTAS) {
    if (!q.obligatoria) continue
    const v = p[q.campo]
    if (Array.isArray(v) ? v.length === 0 : !v) return false
  }
  return p.confirma_participacion === true
}

/** Cuántas de las preguntas obligatorias ya tienen respuesta. */
export function avance(p: Participacion): { hechas: number; total: number; pct: number } {
  const obligatorias = PREGUNTAS.filter(q => q.obligatoria)
  const total = obligatorias.length + 1  // + la confirmación
  const hechas = obligatorias.filter(q => {
    const v = p[q.campo]
    return Array.isArray(v) ? v.length > 0 : !!v
  }).length + (p.confirma_participacion ? 1 : 0)
  return { hechas, total, pct: Math.round((hechas / total) * 100) }
}
