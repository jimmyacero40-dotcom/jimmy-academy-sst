// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE DATOS DE CAPACITACIONES SST — NORMATIVA COLOMBIANA VIGENTE
// Cada plantilla tiene contenido REAL, ESPECÍFICO y DIFERENTE
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrainingTemplate {
  keywords: string[]
  title: string
  category: string
  duration: string
  objective: string
  norm: string
  color: string
  slides: any[]
  quiz: any[]
}

const TEMPLATES: TrainingTemplate[] = [

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. RIESGO QUÍMICO
  // ══════════════════════════════════════════════════════════════════════════════
  {
    keywords: ['químico','quimico','sustancia','sds','hoja seguridad','derrame','tóxico','toxico','reactivo','solvente','ácido','acido','corrosivo'],
    title: 'Manejo Seguro de Sustancias Químicas',
    category: 'Obligatorio', duration: '6h',
    objective: 'Capacitar al trabajador en la identificación, manipulación y almacenamiento seguro de sustancias químicas según el SGA y la normativa colombiana vigente.',
    norm: 'Decreto 1496 de 2018 · GTC 45 · NTC 4435',
    color: 'from-violet-600 to-purple-500',
    slides: [
      { type:'cover', icon:'🧪', title:'Manejo Seguro de Sustancias Químicas', subtitle:'Sistema Globalmente Armonizado (SGA) · Colombia', body:'Decreto 1496/2018 · NTC 4435 · GTC 45' },
      { type:'legal', icon:'⚖️', title:'Marco Normativo – Riesgo Químico', norm:'Decreto 1496 de 2018 – Ministerio de Trabajo', points:[
        '<strong>Decreto 1496 de 2018:</strong> Adopta el Sistema Globalmente Armonizado de Clasificación y Etiquetado de Productos Químicos (SGA/GHS) en Colombia. OBLIGATORIO desde 2022.',
        '<strong>NTC 4435:</strong> Norma para la elaboración de Hojas de Datos de Seguridad (HDS/SDS) de sustancias químicas.',
        '<strong>Decreto 1072/2015 Art. 2.2.4.6.15:</strong> El empleador debe identificar y evaluar los riesgos químicos dentro de la matriz de peligros del SG-SST.',
        '<strong>Resolución 0312/2019 Estándar 4.1.4:</strong> La empresa debe implementar medidas de prevención y control frente a peligros químicos identificados.'
      ], highlight:'⛔ Todo producto químico en el lugar de trabajo DEBE tener su Hoja de Datos de Seguridad (HDS) accesible las 24 horas' },
      { type:'list', icon:'☠️', title:'Clasificación de Peligros – SGA (GHS)', items:[
        { title:'Peligros para la salud', desc:'Toxicidad aguda, irritación, sensibilización, carcinogenicidad, toxicidad reproductiva, toxicidad para órganos. Pictograma: calavera, signo de exclamación, silueta humana.', color:'bg-rose-500' },
        { title:'Peligros físicos', desc:'Inflamables, explosivos, oxidantes, gases a presión, corrosivos para metales. Pictograma: llama, bomba explotando, llama sobre círculo.', color:'bg-orange-500' },
        { title:'Peligros para el medio ambiente', desc:'Toxicidad acuática aguda y crónica. Pictograma: pez y árbol muerto. Requiere disposición especial de residuos.', color:'bg-emerald-500' },
        { title:'Palabra de advertencia', desc:'PELIGRO = categorías más severas. ATENCIÓN = categorías menos severas. Siempre en la etiqueta SGA junto al pictograma.', color:'bg-blue-500' }
      ]},
      { type:'steps', icon:'📋', title:'Cómo Leer una Hoja de Datos de Seguridad (HDS)', steps:[
        '<strong>Sección 1-3:</strong> Identificación del producto, peligros y composición. Lo PRIMERO que debes revisar antes de manipular.',
        '<strong>Sección 4:</strong> Primeros auxilios por vía de exposición (inhalación, contacto dérmico, ingestión, contacto ocular).',
        '<strong>Sección 5-6:</strong> Medidas contra incendio y control de derrames. Agentes de extinción compatibles.',
        '<strong>Sección 7-8:</strong> Manipulación, almacenamiento y EPP requerido. Límites de exposición permisibles.',
        '<strong>Sección 9-11:</strong> Propiedades físico-químicas, estabilidad, información toxicológica.',
        '<strong>Sección 12-16:</strong> Información ecológica, eliminación de desechos, transporte y regulación.'
      ], highlight:'📌 La HDS tiene 16 secciones obligatorias según la NTC 4435. El trabajador debe conocer al menos las secciones 1 a 8.' },
      { type:'info', icon:'🧤', title:'EPP para Riesgo Químico', points:[
        '<strong>Protección respiratoria:</strong> Mascarilla con filtros específicos según el contaminante (vapores orgánicos, gases ácidos, partículas). Verificar filtro correcto en la HDS Sección 8.',
        '<strong>Protección ocular:</strong> Gafas herméticas tipo googles o careta facial completa para salpicaduras. Las gafas comunes NO protegen contra vapores.',
        '<strong>Guantes:</strong> Material según la sustancia (nitrilo para solventes, neopreno para ácidos, PVC para bases). Consultar tabla de resistencia química del fabricante.',
        '<strong>Ropa de protección:</strong> Overol anti-salpicaduras o traje encapsulado según nivel de peligro. Botas de caucho resistentes a químicos.'
      ], highlight:'🔍 NUNCA usar un guante "genérico" para todas las sustancias. Cada químico requiere un material de guante específico.' },
      { type:'danger', icon:'⚠️', title:'Riesgos Críticos en el Manejo de Químicos', risks:[
        { level:'ALTO', item:'Mezclar sustancias incompatibles: ácidos con bases, oxidantes con inflamables – puede causar reacción explosiva o gases tóxicos' },
        { level:'ALTO', item:'Manipular químicos sin leer la HDS: desconocer los peligros específicos puede ser fatal' },
        { level:'ALTO', item:'Almacenar sustancias incompatibles juntas: ácidos con cianuros, oxidantes con orgánicos' },
        { level:'MEDIO', item:'Trasvasar sustancias sin embudo ni ventilación: exposición a vapores tóxicos por inhalación' },
        { level:'MEDIO', item:'No etiquetar recipientes secundarios: otro trabajador puede confundir el contenido' },
        { level:'BAJO', item:'Falta de kit de derrames en el área: retrasa la respuesta y amplía la contaminación' }
      ]},
      { type:'steps', icon:'🚨', title:'Procedimiento ante Derrame Químico', steps:[
        '<strong>EVACUAR</strong> la zona inmediata. Alertar a compañeros. No caminar sobre el derrame.',
        '<strong>NOTIFICAR</strong> al supervisor y a la brigada de emergencias. Activar el plan de emergencias del SG-SST.',
        '<strong>CONSULTAR la HDS</strong> Sección 6: medidas de control de derrame específicas para esa sustancia.',
        '<strong>EPP COMPLETO</strong> antes de intervenir: respirador, guantes, gafas, overol. Solo personal entrenado.',
        '<strong>CONTENER</strong> con material absorbente del kit de derrames. NO usar agua si la sustancia es reactiva.',
        '<strong>RECOGER y DISPONER</strong> el residuo como material peligroso (RESPEL) según Decreto 4741/2005.'
      ], highlight:'📋 Reportar el incidente en el FURAT si hubo exposición del trabajador. Notificar a la ARL en máximo 48 horas.' },
      { type:'summary', icon:'🎯', title:'Puntos Clave – Riesgo Químico Colombia', points:[
        'Decreto 1496/2018: SGA obligatorio en Colombia – todo químico debe tener etiqueta y HDS',
        'La HDS tiene 16 secciones (NTC 4435) – conocer al menos las secciones 1 a 8',
        '9 pictogramas SGA identifican los peligros: calavera, llama, corrosivo, etc.',
        'EPP específico según la sustancia – consultar siempre la HDS Sección 8',
        'NUNCA mezclar sustancias sin verificar compatibilidad química',
        'Ante derrame: evacuar → notificar → consultar HDS → EPP → contener → disponer como RESPEL'
      ]}
    ],
    quiz: [
      { q:'¿Qué decreto adoptó el Sistema Globalmente Armonizado (SGA) de clasificación de químicos en Colombia?', options:['Decreto 1072/2015','Decreto 1496 de 2018','Resolución 0312/2019','Decreto 4741/2005'], correct:1, explanation:'El Decreto 1496 de 2018 adopta el SGA (GHS) en Colombia para la clasificación y etiquetado de productos químicos.' },
      { q:'¿Cuántas secciones obligatorias tiene una Hoja de Datos de Seguridad (HDS) según la NTC 4435?', options:['8 secciones','12 secciones','16 secciones','20 secciones'], correct:2, explanation:'La NTC 4435, alineada con el SGA, establece 16 secciones obligatorias para la Hoja de Datos de Seguridad.' },
      { q:'Si la etiqueta SGA dice "PELIGRO", ¿qué significa respecto a la severidad?', options:['Peligro leve','Categoría intermedia','Categorías más severas del peligro','Solo aplica a inflamables'], correct:2, explanation:'La palabra "PELIGRO" en el SGA indica las categorías más severas. "ATENCIÓN" indica categorías menos severas.' },
      { q:'¿Qué sección de la HDS indica el EPP requerido para manipular la sustancia?', options:['Sección 4','Sección 6','Sección 8','Sección 11'], correct:2, explanation:'La Sección 8 de la HDS contiene los controles de exposición y el equipo de protección personal requerido.' },
      { q:'¿Cómo deben disponerse los residuos de un derrame químico?', options:['En la basura común','Por el alcantarillado con agua','Como residuo peligroso (RESPEL) según Decreto 4741/2005','Incineración en sitio'], correct:2, explanation:'Los residuos químicos deben disponerse como RESPEL (residuos peligrosos) según el Decreto 4741 de 2005 a través de gestores autorizados.' },
      { q:'¿Por qué NO se debe usar un guante genérico para todas las sustancias químicas?', options:['Por costo','Cada químico requiere un material de guante con resistencia específica','No hay diferencia real','Solo aplica para ácidos'], correct:1, explanation:'Cada sustancia química requiere un material de guante específico (nitrilo, neopreno, PVC, etc.) según su tabla de resistencia química. Un guante inadecuado se degrada y no protege.' },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. RIESGO BIOMECÁNICO / ERGONOMÍA
  // ══════════════════════════════════════════════════════════════════════════════
  {
    keywords: ['ergonomía','ergonomia','biomecánico','biomecanico','postura','lumbar','espalda','levantamiento','carga','túnel carpiano','carpal','movimiento repetitivo','escritorio','oficina','pantalla'],
    title: 'Riesgo Biomecánico y Ergonomía Laboral',
    category: 'Obligatorio', duration: '4h',
    objective: 'Identificar los riesgos biomecánicos en el puesto de trabajo y aplicar medidas preventivas para evitar desórdenes musculoesqueléticos.',
    norm: 'Decreto 1072/2015 · GTC 45 · Resolución 2844/2007',
    color: 'from-cyan-600 to-blue-500',
    slides: [
      { type:'cover', icon:'🦴', title:'Riesgo Biomecánico y Ergonomía', subtitle:'Prevención de Desórdenes Musculoesqueléticos', body:'Decreto 1072/2015 · Resolución 2844/2007 · GTC 45' },
      { type:'legal', icon:'⚖️', title:'Marco Normativo – Ergonomía en Colombia', norm:'Resolución 2844 de 2007 – Ministerio de Salud', points:[
        '<strong>Resolución 2844 de 2007:</strong> Guías de Atención Integral en Salud Ocupacional (GATISO). Incluye guía para desórdenes musculoesqueléticos (DME) de miembros superiores y dolor lumbar.',
        '<strong>Decreto 1072/2015 Art. 2.2.4.6.15:</strong> El empleador debe identificar los peligros biomecánicos en la matriz de riesgos y aplicar controles.',
        '<strong>GTC 45:</strong> Metodología para identificar peligros biomecánicos: posturas forzadas, movimientos repetitivos, manipulación manual de cargas, vibración.',
        '<strong>Resolución 0312/2019 Estándar 4.1.4:</strong> Implementar medidas de prevención y control frente a los riesgos biomecánicos identificados en el SVE.'
      ], highlight:'📊 Los desórdenes musculoesqueléticos (DME) son la 1ª causa de enfermedad laboral en Colombia, representando el 85% de los diagnósticos (Fasecolda 2023)' },
      { type:'list', icon:'🔍', title:'Factores de Riesgo Biomecánico – GTC 45', items:[
        { title:'Posturas forzadas', desc:'Mantener posiciones incómodas por tiempo prolongado: cuello inclinado, espalda flexionada, brazos por encima del hombro, muñeca desviada.', color:'bg-rose-500' },
        { title:'Movimientos repetitivos', desc:'Realizar el mismo movimiento más de 2 veces por minuto durante más del 50% de la jornada. Principal causa de síndrome del túnel carpiano.', color:'bg-orange-500' },
        { title:'Manipulación de cargas', desc:'Levantar, empujar o halar objetos pesados. Límite recomendado: 25 kg hombres, 12.5 kg mujeres (sin ayuda mecánica).', color:'bg-blue-500' },
        { title:'Vibración cuerpo entero', desc:'Exposición a vibraciones transmitidas al cuerpo por máquinas, vehículos o herramientas. Causa dolor lumbar y lesiones en columna.', color:'bg-violet-500' }
      ]},
      { type:'steps', icon:'💺', title:'Ergonomía en el Puesto de Oficina', steps:[
        '<strong>Monitor:</strong> Borde superior a la altura de los ojos, distancia 50-70 cm. Evita reflejos laterales.',
        '<strong>Silla:</strong> Altura regulable para que los pies queden planos en el piso. Soporte lumbar ajustable. Codos a 90°.',
        '<strong>Teclado y ratón:</strong> Muñecas en posición neutra (rectas). Usar reposamuñecas. Ratón al mismo nivel del teclado.',
        '<strong>Pausas activas:</strong> Cada 2 horas máximo: 5 minutos de estiramiento de cuello, hombros, muñecas y espalda.',
        '<strong>Regla 20-20-20:</strong> Cada 20 minutos, mirar un objeto a 20 pies (6m) durante 20 segundos. Previene fatiga visual.'
      ], highlight:'⏰ Las pausas activas son OBLIGATORIAS en el programa de vigilancia epidemiológica de DME (Res. 2844/2007)' },
      { type:'steps', icon:'📦', title:'Técnica Correcta de Levantamiento de Cargas', steps:[
        '<strong>PLANIFICAR:</strong> Evalúa el peso, tamaño y destino de la carga. Si pesa más de 25 kg, pide ayuda o usa ayuda mecánica.',
        '<strong>POSICIÓN:</strong> Pies separados al ancho de hombros, un pie ligeramente adelante. Acércate lo más posible a la carga.',
        '<strong>AGARRE:</strong> Agarra firmemente con ambas manos. Mantén la carga pegada al cuerpo.',
        '<strong>LEVANTAR:</strong> Flexiona las rodillas (NO la espalda). Levanta con la fuerza de las piernas. Espalda recta.',
        '<strong>GIRAR:</strong> NUNCA gires el tronco con la carga. Gira moviendo los pies completos.',
        '<strong>BAJAR:</strong> Invierte el proceso: flexiona rodillas, espalda recta, deposita suavemente.'
      ], highlight:'🚫 NUNCA levantes una carga con la espalda flexionada. Es la causa #1 de lumbalgia laboral en Colombia.' },
      { type:'danger', icon:'⚠️', title:'Señales de Alerta – Cuándo Consultar', risks:[
        { level:'ALTO', item:'Dolor lumbar que no cede en reposo o se irradia a las piernas (ciática) – posible hernia discal' },
        { level:'ALTO', item:'Hormigueo nocturno en dedos pulgar, índice y medio – posible síndrome del túnel carpiano' },
        { level:'MEDIO', item:'Dolor persistente en hombros o cuello después de la jornada laboral – posible tendinitis del manguito rotador' },
        { level:'MEDIO', item:'Inflamación y dolor en codos al agarrar objetos – posible epicondilitis (codo de tenista)' },
        { level:'BAJO', item:'Fatiga visual, dolor de cabeza y ojos secos al final del día – síndrome de visión por computador' }
      ]},
      { type:'summary', icon:'🎯', title:'Puntos Clave – Ergonomía Laboral Colombia', points:[
        'Los DME son el 85% de las enfermedades laborales en Colombia (Fasecolda 2023)',
        'Resolución 2844/2007: guías GATISO para prevención de DME y dolor lumbar',
        'GTC 45 identifica 4 factores: postura forzada, repetitividad, carga y vibración',
        'Levantamiento: máximo 25 kg hombres / 12.5 kg mujeres sin ayuda mecánica',
        'Pausas activas obligatorias cada 2 horas como mínimo',
        'Ante dolor que no cede en reposo: remisión a medicina ocupacional de la EPS'
      ]}
    ],
    quiz: [
      { q:'¿Cuál es la primera causa de enfermedad laboral en Colombia?', options:['Hipoacusia','Enfermedades respiratorias','Desórdenes musculoesqueléticos (DME)','Intoxicaciones químicas'], correct:2, explanation:'Los DME representan el 85% de los diagnósticos de enfermedad laboral en Colombia según Fasecolda 2023.' },
      { q:'¿Qué norma colombiana contiene las guías GATISO para prevención de DME?', options:['Decreto 1072/2015','Resolución 2844 de 2007','Resolución 0312/2019','NTC 5723'], correct:1, explanation:'La Resolución 2844 de 2007 contiene las Guías de Atención Integral en Salud Ocupacional (GATISO) para DME.' },
      { q:'¿Cuál es el peso máximo recomendado para levantamiento manual por un hombre sin ayuda mecánica?', options:['15 kg','20 kg','25 kg','35 kg'], correct:2, explanation:'El límite recomendado es 25 kg para hombres y 12.5 kg para mujeres sin ayuda mecánica.' },
      { q:'¿Con qué frecuencia mínima deben realizarse pausas activas?', options:['Cada 30 minutos','Cada 1 hora','Cada 2 horas','Cada 4 horas'], correct:2, explanation:'Las pausas activas deben realizarse al menos cada 2 horas como parte del programa de vigilancia epidemiológica de DME.' },
      { q:'¿Cuál es la principal causa de lumbalgia laboral?', options:['Trabajar sentado','Levantar cargas con la espalda flexionada','Usar computador','Caminar mucho'], correct:1, explanation:'Levantar cargas con la espalda flexionada en lugar de usar la fuerza de las piernas es la causa principal de lumbalgia laboral.' },
      { q:'¿Qué es la regla 20-20-20 en ergonomía de oficina?', options:['20 pausas de 20 segundos cada 20 minutos de pie','Cada 20 minutos mirar a 6 metros durante 20 segundos','20 ejercicios de 20 repeticiones cada 20 minutos','Monitor a 20 cm, silla a 20° e iluminación a 20 lux'], correct:1, explanation:'La regla 20-20-20 consiste en que cada 20 minutos de trabajo en pantalla, se mire un objeto a 20 pies (6 metros) durante 20 segundos para prevenir fatiga visual.' },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. SEGURIDAD VIAL
  // ══════════════════════════════════════════════════════════════════════════════
  {
    keywords: ['vial','tránsito','transito','conductor','vehículo','vehiculo','manejo defensivo','accidente vial','motocicleta','moto','pesv','plan estratégico'],
    title: 'Seguridad Vial – Plan Estratégico (PESV)',
    category: 'Obligatorio', duration: '8h',
    objective: 'Capacitar a conductores y personal expuesto al riesgo vial en las medidas de prevención y el marco normativo del PESV en Colombia.',
    norm: 'Resolución 1565 de 2014 · Ley 1503 de 2011 · Decreto 1072/2015',
    color: 'from-emerald-600 to-teal-500',
    slides: [
      { type:'cover', icon:'🚗', title:'Seguridad Vial – PESV', subtitle:'Plan Estratégico de Seguridad Vial', body:'Resolución 1565/2014 · Ley 1503/2011 · Decreto 1072/2015' },
      { type:'legal', icon:'⚖️', title:'Marco Legal del PESV en Colombia', norm:'Ley 1503 de 2011 y Resolución 1565 de 2014', points:[
        '<strong>Ley 1503 de 2011:</strong> Toda empresa con más de 10 vehículos (propios o contratados) o que generen riesgo vial DEBE implementar un Plan Estratégico de Seguridad Vial (PESV).',
        '<strong>Resolución 1565 de 2014:</strong> Guía metodológica para elaborar el PESV. Define los 5 pilares obligatorios del plan.',
        '<strong>Decreto 1072/2015:</strong> El riesgo vial debe incluirse en la matriz de peligros GTC 45. Los accidentes in itinere son accidente de trabajo (Art. 3, Ley 1562/2012).',
        '<strong>Resolución 40595 de 2022:</strong> Actualiza lineamientos del PESV. Refuerza la formación en conducción segura.'
      ], highlight:'🚨 Los accidentes de tránsito son la 2ª causa de muerte por accidente laboral en Colombia después de las caídas de alturas (Fasecolda 2023)' },
      { type:'list', icon:'🏛️', title:'Los 5 Pilares del PESV', items:[
        { title:'1. Gestión Institucional', desc:'Comité de seguridad vial, política de SV, diagnóstico del riesgo vial, objetivos y metas medibles. Responsable asignado.', color:'bg-blue-500' },
        { title:'2. Comportamiento Humano', desc:'Capacitación a conductores, pruebas de aptitud, control de alcohol y drogas, exámenes médicos ocupacionales.', color:'bg-emerald-500' },
        { title:'3. Vehículos Seguros', desc:'Plan de mantenimiento preventivo, inspección preoperacional diaria, documentación vigente (SOAT, revisión técnico-mecánica).', color:'bg-violet-500' },
        { title:'4. Infraestructura Segura', desc:'Evaluación de rutas, señalización interna, control de velocidad, parqueaderos seguros, zonas de carga/descarga.', color:'bg-orange-500' }
      ]},
      { type:'steps', icon:'🔍', title:'Inspección Preoperacional del Vehículo', steps:[
        '<strong>Neumáticos:</strong> Presión correcta, labrado mínimo 1.6 mm, sin abultamientos. Incluir repuesto y herramientas.',
        '<strong>Luces:</strong> Farolas delanteras, direccionales, stop, reversa y placa. Todas funcionando correctamente.',
        '<strong>Frenos:</strong> Probar freno de servicio y freno de emergencia. Verificar nivel de líquido de frenos.',
        '<strong>Documentos:</strong> Licencia de conducción vigente, SOAT vigente, revisión técnico-mecánica, tarjeta de propiedad.',
        '<strong>Elementos de seguridad:</strong> Extintor vigente, botiquín, triángulos reflectivos, chaleco, linterna.',
        '<strong>Registrar:</strong> Firmar el formato de inspección preoperacional antes de salir. Si hay falla crítica: NO conducir.'
      ], highlight:'📋 La inspección preoperacional es DIARIA y OBLIGATORIA. Debe quedar registrada en el formato del PESV.' },
      { type:'info', icon:'🛡️', title:'Manejo Defensivo – 5 Reglas de Oro', points:[
        '<strong>Mantener distancia:</strong> Regla de los 3 segundos con el vehículo de adelante. En lluvia o noche: 6 segundos.',
        '<strong>Anticiparse:</strong> Mirar 15 segundos adelante (equivale a una cuadra). Prever el comportamiento de otros conductores.',
        '<strong>Punto ciego:</strong> Revisar espejos + girar la cabeza antes de cambiar de carril. Motos y bicicletas desaparecen en puntos ciegos.',
        '<strong>Cero distracciones:</strong> Celular PROHIBIDO al conducir (Ley 1696/2013). Una distracción de 5 segundos a 60 km/h = recorrer 83 metros a ciegas.',
        '<strong>Cinturón SIEMPRE:</strong> Reduce el riesgo de muerte en un 50%. Obligatorio para todos los ocupantes (Art. 82, Código Nacional de Tránsito).'
      ], highlight:'📱 Ley 1696 de 2013: usar celular al conducir puede ser sancionado con inmovilización del vehículo y suspensión de la licencia.' },
      { type:'danger', icon:'⚠️', title:'Principales Causas de Accidentes Viales Laborales', risks:[
        { level:'ALTO', item:'Exceso de velocidad: causa el 35% de las muertes viales en Colombia. Cada 10 km/h adicionales duplica el riesgo.' },
        { level:'ALTO', item:'Conducir bajo efectos del alcohol o drogas: tolerancia cero para conductores laborales (0.00 g de alcohol en sangre).' },
        { level:'ALTO', item:'Fatiga al volante: conducir más de 4 horas continuas sin descanso. Efecto similar a conducir ebrio.' },
        { level:'MEDIO', item:'No respetar señales de PARE y semáforos: causa principal de colisiones en intersecciones.' },
        { level:'MEDIO', item:'Adelantar en curva o con línea continua: causa frecuente de choques frontales en vías rurales.' },
        { level:'BAJO', item:'No usar cinturón o casco (motos): multiplica x5 la gravedad de las lesiones en caso de accidente.' }
      ]},
      { type:'summary', icon:'🎯', title:'Puntos Clave – Seguridad Vial Colombia', points:[
        'Ley 1503/2011: PESV obligatorio para empresas con +10 vehículos o riesgo vial',
        '5 pilares del PESV: gestión, comportamiento, vehículos, infraestructura + atención a víctimas',
        'Inspección preoperacional DIARIA obligatoria antes de conducir',
        'Distancia de seguridad: regla de 3 segundos (6 en lluvia/noche)',
        'Celular PROHIBIDO al conducir (Ley 1696/2013)',
        'Accidente in itinere = accidente de trabajo (Ley 1562/2012 Art. 3)'
      ]}
    ],
    quiz: [
      { q:'¿Qué ley obliga a las empresas colombianas a implementar un PESV?', options:['Ley 769/2002','Ley 1503 de 2011','Ley 1562/2012','Ley 1696/2013'], correct:1, explanation:'La Ley 1503 de 2011 obliga a implementar el Plan Estratégico de Seguridad Vial (PESV) a empresas con más de 10 vehículos o que generen riesgo vial.' },
      { q:'¿Cuántos pilares tiene el PESV según la Resolución 1565 de 2014?', options:['3 pilares','4 pilares','5 pilares','7 pilares'], correct:2, explanation:'El PESV tiene 5 pilares: gestión institucional, comportamiento humano, vehículos seguros, infraestructura segura y atención a víctimas.' },
      { q:'¿Cuál es la regla de distancia de seguridad con el vehículo de adelante?', options:['1 segundo','2 segundos','3 segundos','5 segundos'], correct:2, explanation:'La regla de los 3 segundos es el estándar de distancia de seguimiento. En lluvia o noche se duplica a 6 segundos.' },
      { q:'¿Qué ley prohíbe el uso del celular al conducir en Colombia?', options:['Ley 1503/2011','Ley 769/2002','Ley 1696 de 2013','Resolución 1565/2014'], correct:2, explanation:'La Ley 1696 de 2013 prohíbe el uso del celular al conducir y establece sanciones de inmovilización del vehículo y suspensión de licencia.' },
      { q:'¿Cuál es la tolerancia de alcohol para conductores laborales?', options:['0.20 g','0.10 g','0.04 g','0.00 g (tolerancia cero)'], correct:3, explanation:'Para conductores en función laboral la tolerancia es cero: 0.00 gramos de alcohol en sangre.' },
      { q:'Un trabajador tiene un accidente de tránsito yendo de su casa al trabajo. ¿Es accidente laboral?', options:['No, es accidente común','Sí, es accidente in itinere','Solo si iba en vehículo de la empresa','Solo si la empresa paga transporte'], correct:1, explanation:'Según la Ley 1562/2012 Art. 3, el accidente que ocurre durante el traslado casa-trabajo-casa (in itinere) se considera accidente de trabajo.' },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. ESPACIOS CONFINADOS
  // ══════════════════════════════════════════════════════════════════════════════
  {
    keywords: ['confinado','espacio confinado','tanque','silo','cisterna','pozo','alcantarilla','atmósfera','atmosfera','ventilación','detector gases','rescate confinado'],
    title: 'Trabajo en Espacios Confinados',
    category: 'Especializado', duration: '8h',
    objective: 'Capacitar en la identificación, evaluación y control de riesgos asociados al ingreso y trabajo en espacios confinados.',
    norm: 'Resolución 0491 de 2020 · Decreto 1072/2015 · GTC 45',
    color: 'from-slate-600 to-zinc-500',
    slides: [
      { type:'cover', icon:'🕳️', title:'Trabajo en Espacios Confinados', subtitle:'Identificación, Control y Rescate', body:'Resolución 0491/2020 · Decreto 1072/2015 · GTC 45' },
      { type:'legal', icon:'⚖️', title:'Marco Normativo – Espacios Confinados', norm:'Resolución 0491 de 2020 – Ministerio de Trabajo', points:[
        '<strong>Resolución 0491 de 2020:</strong> Establece los requisitos mínimos de seguridad para trabajo en espacios confinados en Colombia. Define roles, permisos y procedimientos.',
        '<strong>Decreto 1072/2015 Art. 2.2.4.6.15:</strong> Los espacios confinados deben estar identificados en la matriz de peligros del SG-SST.',
        '<strong>GTC 45:</strong> Metodología para valorar los riesgos específicos de cada espacio confinado (atmósfera, atrapamiento, engullimiento, caída).',
        '<strong>NTC 4116:</strong> Guía para realizar el análisis de peligros en espacios confinados.'
      ], highlight:'☠️ Un espacio confinado puede ser MORTAL en segundos: la deficiencia de oxígeno (<19.5%) causa pérdida de conciencia en 10-15 segundos.' },
      { type:'info', icon:'🔍', title:'¿Qué es un Espacio Confinado?', points:[
        '<strong>Definición (Res. 0491/2020):</strong> Espacio cerrado o parcialmente cerrado, NO diseñado para ocupación humana continua, con acceso restringido y que puede contener atmósfera peligrosa.',
        '<strong>Ejemplos:</strong> Tanques de almacenamiento, silos, cisternas, reactores, calderas, pozos, alcantarillas, bóvedas, tolvas, tuberías de gran diámetro.',
        '<strong>3 características:</strong> (1) Lo suficientemente grande para que entre una persona, (2) tiene acceso/salida restringido, (3) NO está diseñado para ocupación continua.',
        '<strong>Riesgos principales:</strong> Atmósfera deficiente de O₂, gases tóxicos (H₂S, CO), atmósfera explosiva, engullimiento por material sólido, atrapamiento.'
      ], highlight:'⚠️ El 60% de las muertes en espacios confinados son de RESCATISTAS que ingresan sin preparación. NUNCA ingrese a rescatar sin equipo.' },
      { type:'steps', icon:'📋', title:'Procedimiento de Ingreso Seguro', steps:[
        '<strong>PERMISO DE TRABAJO:</strong> Emitir permiso firmado por el supervisor de entrada, los entrantes y el vigía. Vigencia máxima por turno.',
        '<strong>MONITOREO ATMOSFÉRICO:</strong> Medir con detector 4 gases ANTES de entrar: Oxígeno (19.5%-23.5%), LEL (<10%), H₂S (<10 ppm), CO (<25 ppm).',
        '<strong>VENTILACIÓN:</strong> Ventilar mecánicamente de forma continua durante toda la operación. Nunca usar oxígeno puro para ventilar.',
        '<strong>VIGÍA PERMANENTE:</strong> Una persona SIEMPRE afuera con comunicación directa. El vigía NO entra bajo ninguna circunstancia.',
        '<strong>EQUIPO DE RESCATE:</strong> Trípode + línea de vida retráctil en la entrada. El equipo de rescate debe estar listo ANTES de que alguien entre.',
        '<strong>COMUNICACIÓN:</strong> Contacto visual o por radio cada 5 minutos entre entrante y vigía.'
      ], highlight:'🚨 Si el detector de gases ALARMA: evacuar INMEDIATAMENTE. No investigar la causa adentro.' },
      { type:'danger', icon:'⚠️', title:'Peligros Mortales en Espacios Confinados', risks:[
        { level:'ALTO', item:'Deficiencia de oxígeno (<19.5%): pérdida de conciencia en segundos. Principal causa de muerte en espacios confinados.' },
        { level:'ALTO', item:'Ácido sulfhídrico (H₂S): gas incoloro, olor a huevo podrido. A 100 ppm paraliza el olfato. A 300 ppm es letal.' },
        { level:'ALTO', item:'Atmósfera explosiva (>10% LEL): cualquier fuente de ignición causa explosión. Prohibidas herramientas que generen chispa.' },
        { level:'ALTO', item:'Engullimiento: material sólido (granos, arena) que atrapa al trabajador. Muerte por asfixia en minutos.' },
        { level:'MEDIO', item:'Monóxido de carbono (CO): gas inodoro e incoloro. Causa confusión progresiva y muerte silenciosa.' },
        { level:'MEDIO', item:'Atrapamiento mecánico: agitadores, tornillos sin fin u otros mecanismos que puedan activarse. Aplicar LOTO obligatorio.' }
      ]},
      { type:'summary', icon:'🎯', title:'Puntos Clave – Espacios Confinados', points:[
        'Resolución 0491/2020: norma vigente para espacios confinados en Colombia',
        'SIEMPRE monitorear atmósfera con detector 4 gases ANTES de entrar',
        'Oxígeno seguro: 19.5% – 23.5%. Por debajo de 19.5% = PELIGRO MORTAL',
        'Vigía permanente afuera que NUNCA entra al espacio bajo ninguna circunstancia',
        'El 60% de las muertes son de rescatistas sin preparación – NUNCA entrar a rescatar sin equipo',
        'Permiso de trabajo obligatorio, ventilación continua y equipo de rescate listo ANTES del ingreso'
      ]}
    ],
    quiz: [
      { q:'¿Cuál es la resolución vigente en Colombia para trabajo en espacios confinados?', options:['Resolución 1409/2012','Resolución 0491 de 2020','Resolución 4272/2021','Resolución 2400/1979'], correct:1, explanation:'La Resolución 0491 de 2020 establece los requisitos mínimos de seguridad para trabajo en espacios confinados en Colombia.' },
      { q:'¿Cuál es el rango seguro de oxígeno para ingresar a un espacio confinado?', options:['15% - 18%','19.5% - 23.5%','21% - 25%','23% - 30%'], correct:1, explanation:'El rango seguro de oxígeno es entre 19.5% y 23.5%. Por debajo de 19.5% hay riesgo de pérdida de conciencia y muerte.' },
      { q:'¿Qué porcentaje del LEL es el límite máximo permitido para ingresar?', options:['5%','10%','20%','50%'], correct:1, explanation:'El Límite Inferior de Explosividad (LEL) debe estar por debajo del 10% para que sea seguro ingresar al espacio confinado.' },
      { q:'¿Qué debe hacer el vigía si el trabajador dentro del espacio pierde la conciencia?', options:['Ingresar a rescatarlo inmediatamente','Activar el equipo de rescate y llamar al 123','Gritar para despertarlo','Esperar 5 minutos'], correct:1, explanation:'El vigía NUNCA debe ingresar al espacio confinado. Debe activar el equipo de rescate preparado previamente y llamar al número de emergencias 123.' },
      { q:'¿Qué gas tiene olor a huevo podrido y paraliza el olfato a concentraciones altas?', options:['Monóxido de carbono (CO)','Metano (CH₄)','Ácido sulfhídrico (H₂S)','Dióxido de carbono (CO₂)'], correct:2, explanation:'El H₂S huele a huevo podrido a bajas concentraciones, pero a 100 ppm paraliza el olfato, haciéndolo indetectable. A 300 ppm es letal.' },
    ]
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// SELECCIÓN INTELIGENTE DE PLANTILLA
// ══════════════════════════════════════════════════════════════════════════════
export function findTemplate(input: string): TrainingTemplate | null {
  const text = input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  let best: TrainingTemplate | null = null
  let bestScore = 0
  for (const t of TEMPLATES) {
    let score = 0
    for (const kw of t.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (text.includes(kwNorm)) score += kwNorm.length // longer match = more specific
    }
    if (score > bestScore) { bestScore = score; best = t }
  }
  return best
}

export function getAllTemplateKeywords(): string[] {
  return TEMPLATES.flatMap(t => t.keywords)
}

export { TEMPLATES }
