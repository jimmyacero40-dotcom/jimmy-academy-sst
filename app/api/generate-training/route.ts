import { NextRequest, NextResponse } from 'next/server'
import { findTemplate, TEMPLATES } from '@/lib/training-templates'

// ═══════════════════════════════════════════════════════════════════════════════
// GENERADOR DE CAPACITACIONES SST
// Usa plantillas reales con normativa colombiana vigente
// Si hay API Key de Anthropic, genera contenido personalizado con IA
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Eres un experto en diseño instruccional y SST en Colombia. Genera capacitaciones en JSON con normativa colombiana vigente real. Responde SOLO con JSON válido, sin markdown.

Formato exacto:
{"title":"...","category":"...","duration":"...","objective":"...","norm":"...","color":"from-amber-500 to-red-500","slides":[{"type":"cover","icon":"emoji","title":"...","subtitle":"...","body":"..."},{"type":"legal","icon":"⚖️","title":"...","norm":"...","points":["..."],"highlight":"..."},{"type":"info","icon":"emoji","title":"...","points":["..."],"highlight":"..."},{"type":"list","icon":"emoji","title":"...","items":[{"title":"...","desc":"...","color":"bg-blue-500"}]},{"type":"steps","icon":"emoji","title":"...","steps":["..."],"highlight":"..."},{"type":"danger","icon":"⚠️","title":"...","risks":[{"level":"ALTO","item":"..."}]},{"type":"summary","icon":"🎯","title":"...","points":["..."]}],"quiz":[{"q":"...","options":["..."],"correct":0,"explanation":"..."}]}

Genera 8-12 slides y 6-8 preguntas. Usa <strong> para negritas. Cita normas colombianas reales con número y año.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, topic, level = 'Intermedio' } = body
    const input = (topic || content || '').trim()

    if (!input) {
      return NextResponse.json({ error: 'Se requiere un tema o contenido' }, { status: 400 })
    }

    // 1) Intentar con API Key si existe
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey && apiKey !== 'sk-ant-placeholder' && apiKey.startsWith('sk-ant-')) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const client = new Anthropic({ apiKey })
        const userMsg = content
          ? `Analiza este contenido y genera la capacitación completa:\n\n${content}`
          : `Genera una capacitación profesional sobre: ${topic}\nNivel: ${level}. Incluye normativa colombiana vigente.`

        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMsg }],
        })
        const raw = (message.content[0] as any).text
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return NextResponse.json({ training: JSON.parse(jsonMatch[0]) })
        }
      } catch (e) {
        console.error('API call failed, falling back to templates:', e)
      }
    }

    // 2) Buscar plantilla específica por palabras clave
    const template = findTemplate(input)
    if (template) {
      return NextResponse.json({
        training: {
          title: template.title,
          category: template.category,
          duration: template.duration,
          objective: template.objective,
          norm: template.norm,
          color: template.color,
          slides: template.slides,
          quiz: template.quiz,
        }
      })
    }

    // 3) Generar contenido adaptado al tema ingresado (no genérico)
    const name = input.length > 80 ? input.slice(0, 80) + '...' : input
    const customTraining = {
      title: name,
      category: 'Capacitación SST',
      duration: '4h',
      objective: `Capacitar al personal en: ${name}, aplicando la normativa colombiana vigente del SG-SST.`,
      norm: 'Decreto 1072 de 2015 · Resolución 0312 de 2019',
      color: 'from-amber-500 to-red-500',
      slides: [
        { type:'cover', icon:'📋', title: name, subtitle:`Nivel ${level} · Capacitación SG-SST`, body:'Decreto 1072/2015 · Resolución 0312/2019 · SG-SST Colombia' },
        { type:'legal', icon:'⚖️', title:'Marco Normativo Aplicable', norm:'Decreto 1072 de 2015 – Decreto Único del Sector Trabajo', points:[
          `<strong>Decreto 1072 de 2015:</strong> Obliga a todas las empresas colombianas a implementar el SG-SST. El tema "${name}" debe estar cubierto dentro del plan anual de capacitaciones.`,
          '<strong>Resolución 0312 de 2019:</strong> Estándares Mínimos del SG-SST. Exige capacitación del 100% de los trabajadores expuestos a los riesgos identificados.',
          '<strong>GTC 45 (ICONTEC):</strong> Metodología obligatoria para identificar peligros y valorar riesgos. Esta capacitación responde a los riesgos identificados en la matriz.',
          '<strong>Ley 1562 de 2012 Art. 30:</strong> Sanciones de hasta 1.000 SMMLV por incumplir las obligaciones del SG-SST.'
        ], highlight:`⛔ Esta capacitación es obligatoria dentro del Plan Anual de Capacitaciones del SG-SST (Decreto 1072/2015 Art. 2.2.4.6.11)` },
        { type:'info', icon:'🎯', title:`Objetivos de Aprendizaje`, points:[
          `<strong>Objetivo general:</strong> Que el trabajador conozca, comprenda y aplique las medidas de seguridad relacionadas con: <strong>${name}</strong>.`,
          '<strong>Identificar los peligros</strong> asociados a esta actividad según la metodología GTC 45 del SG-SST.',
          '<strong>Conocer los controles</strong> de ingeniería, administrativos y de EPP aplicables al riesgo.',
          '<strong>Saber actuar</strong> ante una emergencia: protocolo PAS (Proteger – Avisar al 123 – Socorrer).'
        ] },
        { type:'list', icon:'📚', title:'Contenido Temático', items:[
          { title:'Conceptos fundamentales', desc:`Definiciones, principios y alcance de ${name} en el contexto laboral colombiano.`, color:'bg-amber-500' },
          { title:'Identificación de riesgos', desc:'Peligros específicos, consecuencias potenciales y medidas preventivas según la GTC 45.', color:'bg-rose-500' },
          { title:'Procedimientos seguros', desc:'Paso a paso para ejecutar la actividad de forma segura. Uso correcto de EPP requerido.', color:'bg-blue-500' },
          { title:'Respuesta ante emergencias', desc:'Qué hacer ante un incidente o accidente. Protocolo PAS, reporte FURAT, notificación a la ARL.', color:'bg-emerald-500' }
        ]},
        { type:'danger', icon:'⚠️', title:'Riesgos Asociados – Matriz GTC 45', risks:[
          { level:'ALTO', item:'No seguir los procedimientos de seguridad establecidos en el SG-SST para esta actividad' },
          { level:'ALTO', item:'Ejecutar la tarea sin la capacitación ni los EPP requeridos' },
          { level:'MEDIO', item:'Condiciones inseguras del entorno no identificadas ni reportadas al supervisor' },
          { level:'MEDIO', item:'Desconocer el plan de emergencias y las rutas de evacuación' },
          { level:'BAJO', item:'Señalización insuficiente o demarcación ausente en el área de trabajo' }
        ]},
        { type:'steps', icon:'✅', title:'Procedimiento de Trabajo Seguro', steps:[
          `<strong>Antes de iniciar:</strong> Verificar que tienes la capacitación vigente, el EPP asignado y el permiso de trabajo si aplica.`,
          '<strong>Inspección del área:</strong> Revisar condiciones del entorno, herramientas y equipos. Reportar anomalías al supervisor.',
          '<strong>Ejecución:</strong> Seguir estrictamente el procedimiento establecido. No improvisar ni tomar atajos.',
          '<strong>Supervisión:</strong> Mantener comunicación con el equipo. Si las condiciones cambian, DETENER la tarea.',
          '<strong>Cierre:</strong> Dejar el área ordenada. Diligenciar registros del SG-SST y reportar novedades.'
        ], highlight:'📋 Ante cualquier accidente: reportar a la ARL en máximo 48 horas mediante el FURAT (Decreto 1530/1996)' },
        { type:'info', icon:'👷', title:'Obligaciones del Trabajador', points:[
          '<strong>Decreto 1072/2015 Art. 2.2.4.6.10:</strong> Cumplir las normas de seguridad del SG-SST y los procedimientos establecidos por la empresa.',
          '<strong>Ley 1562/2012 Art. 4:</strong> Informar oportunamente al empleador sobre los peligros latentes en su puesto de trabajo.',
          '<strong>CST Art. 58:</strong> Usar y conservar en buen estado el EPP suministrado por el empleador.',
          '<strong>Participar activamente</strong> en las capacitaciones, simulacros y actividades de prevención del SG-SST.'
        ], highlight:'⚠️ Negarse a usar el EPP o incumplir los procedimientos de seguridad es causal de sanción disciplinaria (CST Art. 58)' },
        { type:'summary', icon:'🎯', title:'Puntos Clave – Recuerda Siempre', points:[
          `${name}: conocer, cumplir y aplicar los procedimientos es responsabilidad de TODOS`,
          'Decreto 1072/2015 y Resolución 0312/2019: bases legales del SG-SST en Colombia',
          'GTC 45: la herramienta para identificar peligros y valorar los riesgos de tu puesto',
          'Usar SIEMPRE el EPP asignado e inspeccionarlo antes de cada uso',
          'Reportar condiciones inseguras ANTES de que ocurra un accidente',
          'Ante emergencia: Proteger → Avisar al 123 → Socorrer → Reportar a la ARL en 48 horas'
        ]}
      ],
      quiz: [
        { q:'¿Cuál es el decreto que regula el SG-SST en Colombia?', options:['Ley 100 de 1993','Decreto 1072 de 2015','Resolución 2400/1979','Ley 9 de 1979'], correct:1, explanation:'El Decreto 1072 de 2015 es el Decreto Único Reglamentario del Sector Trabajo y establece la obligación del SG-SST.' },
        { q:'¿Qué resolución define los Estándares Mínimos del SG-SST?', options:['Resolución 1409/2012','Resolución 2400/1979','Resolución 0312 de 2019','Resolución 4272/2021'], correct:2, explanation:'La Resolución 0312 de 2019 define los Estándares Mínimos del SG-SST según tamaño y riesgo de la empresa.' },
        { q:'¿Qué metodología colombiana se usa para identificar peligros y valorar riesgos?', options:['ISO 45001','OHSAS 18001','GTC 45','NTC 1931'], correct:2, explanation:'La GTC 45 de ICONTEC es la metodología estándar para identificación de peligros y valoración de riesgos en Colombia.' },
        { q:'¿En cuánto tiempo debe reportarse un accidente de trabajo a la ARL?', options:['24 horas','48 horas','72 horas','5 días hábiles'], correct:1, explanation:'El Decreto 1530/1996 establece que el accidente debe reportarse a la ARL dentro de las primeras 48 horas.' },
        { q:'¿Cuál es la sanción máxima por incumplir las normas SST?', options:['100 SMMLV','500 SMMLV','1.000 SMMLV','Solo llamado de atención'], correct:2, explanation:'La Ley 1562/2012 Art. 30 establece sanciones de hasta 1.000 SMMLV por infracciones graves a las normas SST.' },
        { q:'¿Qué debe hacer un trabajador si identifica una condición insegura?', options:['Ignorarla si es leve','Reportarla al empleador oportunamente','Corregirla él mismo','Esperar la auditoría'], correct:1, explanation:'Según la Ley 1562/2012, el trabajador debe informar oportunamente al empleador sobre peligros latentes.' },
      ],
    }

    return NextResponse.json({ training: customTraining })
  } catch (err: any) {
    console.error('Error generando capacitación:', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
