'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CheckCircle, X, Award, Download,
  List, QrCode, Shield, RotateCcw, BookOpen
} from 'lucide-react'

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type SlideType = 'cover' | 'info' | 'legal' | 'steps' | 'list' | 'danger' | 'summary'
type Slide = {
  type: SlideType; title: string; subtitle?: string; body?: string; icon: string
  image?: string; points?: string[]; items?: { title: string; desc: string; color: string }[]
  risks?: { level: 'ALTO' | 'MEDIO' | 'BAJO'; item: string }[]; steps?: string[]; highlight?: string; norm?: string
}
type Question = { q: string; options: string[]; correct: number; explanation: string }
type Training = { title: string; color: string; cover: string; duration: string; rating: number; slides: Slide[]; quiz: Question[] }

// ─── CONTENIDO POR CURSO ──────────────────────────────────────────────────────
const DB: Record<number, Training> = {

  // ══════════════════════════════════════════════════════════════════════════
  // CURSO 1 — TRABAJO EN ALTURAS
  // ══════════════════════════════════════════════════════════════════════════
  1: {
    title: 'Trabajo en Alturas – Nivel 1',
    color: 'from-blue-600 to-cyan-500',
    cover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    duration: '8h', rating: 4.8,
    slides: [
      {
        type: 'cover', icon: '🏗️',
        title: 'Trabajo en Alturas',
        subtitle: 'Nivel 1 – Capacitación Obligatoria',
        body: 'Resolución 4272 de 2021 · Ministerio de Trabajo de Colombia',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80',
      },
      {
        type: 'legal', icon: '⚖️',
        title: 'Marco Normativo Vigente',
        norm: 'Resolución 4272 de 2021 – Ministerio de Trabajo (deroga Res. 1409/2012)',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        points: [
          '<strong>Resolución 4272 de 2021 (vigente):</strong> Reglamento de Seguridad para la protección contra caídas en trabajo en alturas. Derogó la Resolución 1409 de 2012. Establece requisitos mínimos de seguridad a partir de los <strong>2 metros</strong> sobre el plano de los pies del trabajador.',
          '<strong>Decreto 1072 de 2015 – Art. 2.2.4.6.8:</strong> El SG-SST debe incluir el programa de protección contra caídas como elemento obligatorio del sistema de gestión.',
          '<strong>Resolución 0312 de 2019 – Estándar 2.11.1:</strong> La empresa debe garantizar la capacitación y certificación del 100% de los trabajadores expuestos antes de ejecutar la tarea.',
          '<strong>Ley 1562 de 2012 – Art. 3:</strong> Las caídas en alturas son la primera causa de muerte por accidente laboral en Colombia, representando más del 20% de los decesos.',
        ],
        highlight: '⛔ PROHIBIDO ejecutar trabajo en alturas sin capacitación y certificación vigente (Res. 4272/2021 Art. 10)',
      },
      {
        type: 'info', icon: '📏',
        title: '¿Qué es Trabajo en Alturas?',
        image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
        points: [
          'Según la <strong>Resolución 4272 de 2021, Art. 3:</strong> toda actividad o desplazamiento que se realice a <strong>2 metros o más</strong> sobre el plano de los pies del trabajador.',
          'Es la <strong>primera causa de muerte</strong> por accidente de trabajo en Colombia, representando más del 20% de los decesos laborales anuales (Fasecolda 2023).',
          'Aplica a todos los sectores económicos: construcción, telecomunicaciones, minería, agropecuario, manufactura, energía y cualquier otra actividad con exposición al riesgo.',
          'Incluye trabajos en tejados, andamios, escaleras fijas, plataformas elevadas, torres, postes y estructuras a 2 metros o más sobre el plano de los pies.',
        ],
        highlight: '📌 La obligación aplica aunque el trabajo sea de corta duración o se realice esporádicamente (Res. 4272/2021)',
      },
      {
        type: 'list', icon: '🎓',
        title: 'Niveles de Formación Obligatoria',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
        items: [
          { title: 'Trabajador Nivel Básico', desc: 'Para quienes laboran ocasionalmente en alturas. Incluye uso correcto de EPP, inspección de equipos y medidas preventivas básicas.', color: 'bg-blue-500' },
          { title: 'Trabajador Nivel Avanzado', desc: 'Para quienes realizan trabajo en alturas de forma permanente o en condiciones críticas (pendientes, estructuras complejas, espacios confinados en altura).', color: 'bg-violet-500' },
          { title: 'Coordinador de Alturas', desc: 'Para quien planifica, organiza, supervisa y controla las actividades en alturas. Debe conocer toda la normativa, sistemas de protección y planes de rescate.', color: 'bg-emerald-500' },
          { title: 'Vigencia de la certificación', desc: 'Máximo 3 años. Vencida la certificación, el trabajador NO puede realizar la tarea hasta renovarla (Res. 4272/2021 Art. 12).', color: 'bg-orange-500' },
        ],
      },
      {
        type: 'info', icon: '⛑️',
        title: 'EPP Obligatorio para Alturas',
        image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=600&q=80',
        points: [
          '<strong>Arnés de cuerpo completo:</strong> Certificado bajo norma ANSI Z359.11 o EN 361. Debe inspeccionarse antes de cada uso. Se retira de servicio si ha sufrido una caída.',
          '<strong>Línea de vida con absorbedor de energía:</strong> Limita la fuerza de impacto a máximo 6 kN. Longitud máxima 1,80 m (Res. 4272/2021 Art. 17).',
          '<strong>Punto de anclaje:</strong> Debe soportar mínimo <strong>5.000 libras (2.268 kg)</strong> de carga estática por trabajador conectado.',
          '<strong>Casco clase E con barbuquejo:</strong> Protege contra impactos, penetración y riesgos eléctricos hasta 20.000 voltios.',
          '<strong>Calzado de seguridad:</strong> Con puntera de acero o composite, suela antideslizante y antiestática (NTC 2396).',
        ],
        highlight: '🔍 El empleador es responsable de suministrar, mantener y certificar el EPP (Res. 4272/2021 Art. 7 – Obligaciones del empleador)',
      },
      {
        type: 'steps', icon: '📋',
        title: 'Permiso de Trabajo en Alturas',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        steps: [
          '<strong>Identificación del riesgo:</strong> Descripción de la tarea, altura específica, riesgos asociados (eléctrico, climático, materiales) y medidas de control.',
          '<strong>Verificación de competencias:</strong> Confirmar que el trabajador tiene certificación vigente de trabajo en alturas del nivel requerido.',
          '<strong>Inspección de EPP:</strong> Revisar arnés, líneas de vida, conectores y punto de anclaje antes de firmar el permiso.',
          '<strong>Demarcación del área:</strong> Instalar barreras, cinta de seguridad y señales de "Peligro – Trabajo en Alturas" en el área inferior.',
          '<strong>Firmas obligatorias:</strong> Trabajador, supervisor directo y responsable del SG-SST de la empresa.',
          '<strong>Vigencia:</strong> Máximo 8 horas. Si cambian las condiciones (clima, personal, tarea), se debe emitir un nuevo permiso.',
        ],
        highlight: '📁 El permiso diligenciado debe conservarse en el archivo del SG-SST por mínimo 20 años (Res. 0312/2019)',
      },
      {
        type: 'danger', icon: '⚠️',
        title: 'Factores de Riesgo – Clasificación',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
        risks: [
          { level: 'ALTO', item: 'EPP defectuoso, no certificado o vencido – causa directa de caídas fatales' },
          { level: 'ALTO', item: 'Puntos de anclaje inadecuados o con capacidad inferior a 2.268 kg' },
          { level: 'ALTO', item: 'Trabajo en alturas sin permiso firmado ni supervisión del coordinador' },
          { level: 'ALTO', item: 'Condiciones climáticas adversas: lluvia, viento > 50 km/h, tormenta eléctrica' },
          { level: 'MEDIO', item: 'Superficies inestables, mojadas o inclinadas en el punto de trabajo' },
          { level: 'MEDIO', item: 'Fatiga, consumo de alcohol o medicamentos que alteren el estado del trabajador' },
          { level: 'BAJO', item: 'Herramientas manuales sin sistema anticaída (driza de seguridad)' },
        ],
      },
      {
        type: 'steps', icon: '🚨',
        title: 'Protocolo de Rescate en Altura',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
        steps: [
          '<strong>ALERTA:</strong> Quien detecta la emergencia activa la alarma, llama al 123 y notifica al coordinador de alturas y brigada.',
          '<strong>EVALUACIÓN SEGURA:</strong> Evaluar el estado de la víctima SIN exponer al rescatista a riesgo adicional.',
          '<strong>RESCATE por personal entrenado:</strong> Solo la brigada certificada en rescate en alturas realiza la maniobra.',
          '<strong>SÍNDROME DE ARNÉS:</strong> Quien queda suspendido puede sufrir colapso circulatorio en <15 minutos. Posición de rescate: semi-sentado, piernas elevadas.',
          '<strong>PRIMEROS AUXILIOS y traslado:</strong> Atención inmediata y remisión urgente a la IPS para evaluación médica.',
          '<strong>REPORTE:</strong> Diligenciar el Formato de Reporte de Accidente de Trabajo (FURAT) ante la ARL en las primeras 48 horas (Decreto 1530/1996).',
        ],
      },
      {
        type: 'info', icon: '🏢',
        title: 'Obligaciones del Empleador',
        image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
        points: [
          '<strong>Art. 7 Res. 4272/2021:</strong> Elaborar, implementar y mantener un programa de protección contra caídas actualizado dentro del SG-SST.',
          '<strong>Art. 7 Res. 4272/2021:</strong> Garantizar la capacitación y certificación de todos los trabajadores expuestos antes de ejecutar la tarea.',
          '<strong>Decreto 1072/2015 Art. 2.2.4.6.8:</strong> Suministrar los EPP sin ningún costo para el trabajador y garantizar su buen estado.',
          '<strong>Resolución 0312/2019 Estándar 6.1:</strong> Realizar inspecciones periódicas a los puestos de trabajo y equipos de protección contra caídas.',
        ],
        highlight: '💰 Sanción por incumplimiento: hasta 1.000 SMMLV según Ley 1562/2012 Art. 30 – graduada según gravedad',
      },
      {
        type: 'info', icon: '👷',
        title: 'Obligaciones del Trabajador',
        image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=600&q=80',
        points: [
          '<strong>Art. 8 Res. 4272/2021:</strong> Asistir a las capacitaciones y mantener vigente la certificación requerida según el nivel de exposición.',
          '<strong>Art. 8 Res. 4272/2021:</strong> Usar correctamente los EPP asignados, inspeccionarlos antes de cada uso y reportar deficiencias al empleador.',
          '<strong>Decreto 1072/2015 Art. 2.2.4.6.11:</strong> Participar en la elaboración y seguimiento del permiso de trabajo en alturas.',
          '<strong>Ley 1562/2012 Art. 4:</strong> Reportar condiciones y actos inseguros al supervisor. El trabajador puede negar la ejecución si las condiciones no son seguras.',
        ],
        highlight: '⚠️ Negarse a usar el EPP o a cumplir el procedimiento es causal de sanción disciplinaria (CST Art. 58)',
      },
      {
        type: 'summary', icon: '🎯',
        title: 'Puntos Clave – Resolución 4272 de 2021 (Vigente)',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
        points: [
          'Trabajo en alturas = toda actividad a 2 metros o más sobre el plano de los pies del trabajador',
          'Res. 4272/2021 derogó la Resolución 1409 de 2012 – es la norma vigente en Colombia',
          'Capacitación obligatoria: Nivel Básico, Avanzado o Coordinador según exposición al riesgo',
          'Certificación válida por máximo 3 años – debe renovarse antes del vencimiento (Art. 12)',
          'Permiso de trabajo obligatorio, vigencia máxima 8 horas, firmas del trabajador y supervisor',
          'Reporte de accidente ante ARL en las primeras 48 horas – FURAT (Decreto 1530/1996)',
        ],
      },
    ],
    quiz: [
      { q: '¿Cuál es la normativa VIGENTE que regula el trabajo en alturas en Colombia?', options: ['Resolución 1409 de 2012', 'Resolución 4272 de 2021', 'Decreto 1072 de 2015', 'Resolución 0312 de 2019'], correct: 1, explanation: 'La Resolución 4272 de 2021 del Ministerio de Trabajo es la norma vigente para trabajo en alturas en Colombia. Derogó la Resolución 1409 de 2012.' },
      { q: '¿A partir de qué altura se considera "trabajo en alturas" según la Resolución 4272 de 2021?', options: ['1,00 metro', '1,50 metros', '2,00 metros', '2,50 metros'], correct: 2, explanation: 'El Art. 3 de la Resolución 4272 de 2021 define trabajo en alturas como toda actividad a 2 metros o más sobre el plano de los pies del trabajador.' },
      { q: '¿Cuánto tiempo tiene vigencia la certificación de trabajo en alturas según la Res. 4272 de 2021?', options: ['1 año', '2 años', '3 años', '5 años'], correct: 2, explanation: 'Según el Art. 12 de la Resolución 4272 de 2021, la certificación de trabajo en alturas tiene vigencia máxima de 3 años.' },
      { q: '¿Cuál es la carga mínima que debe soportar un punto de anclaje para trabajo en alturas?', options: ['1.000 kg', '1.500 kg', '2.268 kg (5.000 lb)', '3.000 kg'], correct: 2, explanation: 'Los puntos de anclaje deben soportar mínimo 5.000 libras = 2.268 kg por trabajador conectado (Res. 4272/2021 Art. 17).' },
      { q: '¿Cuál es la vigencia máxima de un Permiso de Trabajo en Alturas?', options: ['4 horas', '8 horas', '12 horas', '24 horas'], correct: 1, explanation: 'El permiso de trabajo en alturas tiene vigencia máxima de 8 horas. Si cambian las condiciones (clima, personal, tarea) se debe emitir uno nuevo.' },
      { q: '¿En qué tiempo debe reportarse un accidente de trabajo ante la ARL según el Decreto 1530 de 1996?', options: ['24 horas', '48 horas', '72 horas', '5 días hábiles'], correct: 1, explanation: 'El Decreto 1530 de 1996 establece que el empleador debe reportar el accidente de trabajo a la ARL dentro de las primeras 48 horas.' },
      { q: '¿Qué norma derogó la Resolución 4272 de 2021?', options: ['Decreto 1072 de 2015', 'Resolución 2400 de 1979', 'Resolución 1409 de 2012', 'Resolución 0312 de 2019'], correct: 2, explanation: 'La Resolución 4272 de 2021 derogó expresamente la Resolución 1409 de 2012, actualizando el reglamento de seguridad para trabajo en alturas en Colombia.' },
      { q: '¿Cuál es el estándar de la Resolución 0312 de 2019 que obliga la capacitación en trabajo en alturas?', options: ['Estándar 1.1.1', 'Estándar 2.11.1', 'Estándar 4.2.2', 'Estándar 6.1.1'], correct: 1, explanation: 'El Estándar 2.11.1 de la Resolución 0312 de 2019 exige que el 100% de los trabajadores expuestos a caídas de alturas estén capacitados y certificados.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CURSO 2 — PRIMEROS AUXILIOS
  // ══════════════════════════════════════════════════════════════════════════
  2: {
    title: 'Primeros Auxilios en el Trabajo',
    color: 'from-rose-600 to-pink-500',
    cover: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    duration: '16h', rating: 4.9,
    slides: [
      { type: 'cover', icon: '🏥', title: 'Primeros Auxilios en el Trabajo', subtitle: 'Respuesta de Emergencia Laboral', body: 'Decreto 1072/2015 · Resolución 0312/2019 · GTC 45 · Ley 1562/2012', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900&q=80' },
      {
        type: 'legal', icon: '⚖️', title: 'Obligación Legal en Colombia',
        norm: 'Decreto 1072 de 2015 – Art. 2.2.4.6.25 y Resolución 0312 de 2019',
        image: 'https://images.unsplash.com/photo-1571772996211-2d02c9ecf6f7?w=600&q=80',
        points: [
          '<strong>Decreto 1072/2015 Art. 2.2.4.6.25:</strong> El empleador debe garantizar que en cada turno de trabajo exista al menos un trabajador entrenado en primeros auxilios.',
          '<strong>Resolución 0312/2019 Estándar 3.1.1:</strong> Evaluación médica ocupacional de ingreso, periódica y de egreso. Los primeros auxilios son parte del sistema de vigilancia.',
          '<strong>Resolución 2400 de 1979 Art. 98:</strong> Todo establecimiento de trabajo debe contar con botiquín de primeros auxilios dotado y accesible las 24 horas.',
          '<strong>Ley 1562/2012 Art. 3:</strong> El empleador debe reportar todo accidente de trabajo a la ARL máximo 48 horas después de ocurrido (FURAT).',
        ],
        highlight: '🏥 Número de emergencias unificado en Colombia: <strong>123</strong> (Policía, Bomberos, Ambulancia)',
      },
      { type: 'steps', icon: '🚨', title: 'Protocolo PAS – Base de Todo Auxiliador', image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80', steps: ['<strong>P – PROTEGER la escena:</strong> Garantiza que el lugar sea seguro para ti y la víctima. Retira el agente de riesgo o aleja a la persona. Nunca pongas en riesgo tu propia vida.', '<strong>A – AVISAR al 123:</strong> Indica: qué ocurrió, cuántas víctimas, edad aproximada, estado de consciencia y dirección exacta con referencia. No cuelgues hasta que te indiquen.', '<strong>S – SOCORRER según entrenamiento:</strong> Aplica los primeros auxilios que correspondan. No realices maniobras para las que no estás entrenado. Acompaña a la víctima hasta la llegada de la ambulancia.'] },
      {
        type: 'info', icon: '❤️', title: 'RCP – Reanimación Cardiopulmonar',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
        points: [
          '<strong>Verificar seguridad</strong> de la escena y llama al 123 antes de iniciar.',
          '<strong>30 compresiones torácicas</strong> en el centro del pecho: profundidad 5–6 cm, frecuencia 100–120/min (Guías AHA 2020, adoptadas por ACEMI Colombia).',
          '<strong>2 ventilaciones de rescate</strong> si estás entrenado. Si no, aplica solo compresiones – igualmente efectivo.',
          'Continuar hasta que: llegue el DEA, arribe personal médico o la víctima recupere signos vitales.',
          '<strong>DEA (Desfibrilador):</strong> Ley 1831 de 2017 obliga a tener DEA en lugares con más de 500 personas o acceso público masivo.',
        ],
        highlight: '⏱️ Por cada minuto sin RCP, la probabilidad de supervivencia disminuye 10%. Los primeros 4 minutos son críticos.',
      },
      {
        type: 'list', icon: '🩹', title: 'Manejo de Heridas y Hemorragias',
        image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80',
        items: [
          { title: 'Herida leve', desc: 'Lavar con agua limpia corriente min. 5 min, aplicar antiséptico (yodo povidona) y cubrir con apósito estéril.', color: 'bg-emerald-500' },
          { title: 'Hemorragia externa', desc: 'Presión directa y continua con gasa estéril mínimo 10 minutos sin retirar. Elevar el miembro si no hay fractura.', color: 'bg-blue-500' },
          { title: 'Hemorragia arterial grave', desc: 'Torniquete 5–7 cm proximal a la herida. Anotar HORA exacta de aplicación. No retirar hasta atención médica.', color: 'bg-orange-500' },
          { title: 'Hemorragia interna sospechada', desc: 'No manipular. Inmovilizar, abrigar, posición de choque (piernas elevadas) y trasladar urgente.', color: 'bg-rose-500' },
        ],
      },
      { type: 'steps', icon: '🦴', title: 'Fracturas – Inmovilización de Emergencia', image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=600&q=80', steps: ['<strong>NO mover</strong> si se sospecha fractura de columna, pelvis o cadera. Esperar personal médico.', 'Inmovilizar la fractura en la posición en que se encuentra usando férula improvisada (tablas, revistas, cartón rígido).', 'Acolchar la férula con tela o ropa. Fijar por encima y por debajo de la lesión, sin comprimir.', 'Si hay fractura abierta: cubrir con gasa estéril húmeda. NO intentar reducir el hueso ni extraer objetos incrustados.', 'Evaluar circulación distal: temperatura, color de piel y sensibilidad por debajo de la inmovilización cada 10 min.', 'Trasladar en posición estable en ambulancia. Reportar mecanismo de la lesión al personal médico.'], highlight: '⚠️ Una fractura de columna mal manejada puede causar parálisis permanente (Resolución 2400/1979 Cap. I)' },
      {
        type: 'danger', icon: '🌡️', title: 'Emergencias por Calor – Riesgo Frecuente en Colombia',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
        risks: [
          { level: 'ALTO', item: 'Golpe de calor (hipotermia): T° corporal > 40°C, piel seca y caliente, confusión o pérdida de consciencia – EMERGENCIA MÉDICA' },
          { level: 'ALTO', item: 'Quemaduras 2° y 3° grado: enfriar con agua corriente fría 15–20 min. NUNCA cremas, hielo, mantequilla ni pasta dental' },
          { level: 'MEDIO', item: 'Agotamiento por calor: piel pálida y húmeda, debilidad. Trasladar a lugar fresco, ropa suelta, hidratación oral lenta' },
          { level: 'BAJO', item: 'Calambres por calor: masaje suave, reposo, hidratación con sales minerales (suero oral)' },
        ],
      },
      {
        type: 'info', icon: '💊', title: 'Botiquín de Primeros Auxilios',
        norm: 'Resolución 2400 de 1979 Art. 98 – Ministerio de Trabajo',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
        points: [
          '<strong>Materiales de curación:</strong> Gasas estériles, vendas de diferentes calibres, esparadrapo, apósitos, curas adhesivas.',
          '<strong>Antisépticos:</strong> Yodo povidona al 10%, alcohol al 70%, solución salina fisiológica 0,9%.',
          '<strong>Medicamentos básicos:</strong> Solo los autorizados por médico ocupacional. No se administra medicación sin prescripción.',
          '<strong>Otros elementos:</strong> Guantes de látex, tijeras de punta roma, pinzas, termómetro, tensiómetro, DEA si aplica (Ley 1831/2017).',
        ],
        highlight: '📋 El botiquín debe revisarse mensualmente y reponerse inmediatamente tras cada uso (Res. 2400/1979)',
      },
      {
        type: 'summary', icon: '🎯', title: 'Resumen Normativo – Primeros Auxilios Laborales',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
        points: [
          'Decreto 1072/2015: al menos 1 trabajador por turno entrenado en primeros auxilios',
          'Protocolo PAS: Proteger → Avisar al 123 → Socorrer según entrenamiento',
          'RCP: 30 compresiones + 2 ventilaciones a 100–120/min (Guías AHA 2020)',
          'Ley 1831/2017: DEA obligatorio en lugares con > 500 personas o acceso masivo',
          'Reporte FURAT a la ARL dentro de las 48 horas del accidente (Decreto 1530/1996)',
          'Resolución 2400/1979: botiquín dotado y accesible en todo establecimiento de trabajo',
        ],
      },
    ],
    quiz: [
      { q: '¿Cuántos trabajadores entrenados en primeros auxilios exige el Decreto 1072 de 2015 por turno?', options: ['Ninguno obligatorio', 'Al menos 1', 'Al menos 2', 'Al menos 5'], correct: 1, explanation: 'El Art. 2.2.4.6.25 del Decreto 1072 de 2015 establece que debe haber al menos un trabajador entrenado en primeros auxilios por cada turno de trabajo.' },
      { q: '¿Cuál es el número de emergencias unificado en Colombia?', options: ['112', '119', '123', '125'], correct: 2, explanation: 'En Colombia el número de emergencias unificado es el 123, conecta con Policía, Bomberos y Ambulancias del SAMU.' },
      { q: '¿Qué profundidad deben tener las compresiones en RCP para un adulto?', options: ['2–3 cm', '3–4 cm', '5–6 cm', '7–8 cm'], correct: 2, explanation: 'Las Guías AHA 2020 (adoptadas en Colombia) establecen una profundidad de compresión de 5 a 6 cm para adultos.' },
      { q: '¿Qué ley en Colombia obliga a tener DEA (Desfibrilador) en lugares de acceso público masivo?', options: ['Ley 1562 de 2012', 'Ley 1831 de 2017', 'Ley 100 de 1993', 'Ley 9 de 1979'], correct: 1, explanation: 'La Ley 1831 de 2017 obliga a instalar DEA en lugares con más de 500 personas o de acceso público masivo en Colombia.' },
      { q: 'Ante una hemorragia externa severa, ¿cuánto tiempo mínimo debe mantenerse la presión directa?', options: ['3 minutos', '5 minutos', '10 minutos', '20 minutos'], correct: 2, explanation: 'Se debe mantener presión directa y continua durante mínimo 10 minutos sin retirar la gasa para permitir la coagulación.' },
      { q: '¿Qué norma obliga al botiquín de primeros auxilios en lugares de trabajo en Colombia?', options: ['Decreto 1072/2015', 'Resolución 0312/2019', 'Resolución 2400/1979 Art. 98', 'NTC 1700'], correct: 2, explanation: 'La Resolución 2400 de 1979, Art. 98 del Ministerio de Trabajo obliga a tener botiquín de primeros auxilios dotado en todo establecimiento de trabajo.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CURSO 3 — EXTINTORES
  // ══════════════════════════════════════════════════════════════════════════
  3: {
    title: 'Manejo de Extintores y Contra Incendios',
    color: 'from-orange-600 to-red-500',
    cover: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&q=80',
    duration: '4h', rating: 4.5,
    slides: [
      { type: 'cover', icon: '🧯', title: 'Extintores y Contra Incendios', subtitle: 'Prevención y Control del Fuego', body: 'NTC 1931 · Resolución 2400/1979 · NSR-10 · Decreto 1072/2015', image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=900&q=80' },
      {
        type: 'legal', icon: '⚖️', title: 'Marco Normativo Contra Incendios',
        norm: 'NTC 1931 de 2011 – ICONTEC y Resolución 2400 de 1979',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        points: [
          '<strong>NTC 1931 de 2011:</strong> Protección contra incendios en edificaciones. Establece tipos, ubicación, señalización y mantenimiento de extintores en Colombia.',
          '<strong>Resolución 2400/1979 Art. 98 y ss.:</strong> Obligación del empleador de dotar el lugar de trabajo con equipos contra incendios en buen estado y señalizados.',
          '<strong>NSR-10 Título J:</strong> Norma Sismo Resistente – Requisitos de protección contra incendios para edificaciones nuevas y existentes en Colombia.',
          '<strong>Decreto 1072/2015 Art. 2.2.4.6.10:</strong> El Plan de Emergencias del SG-SST debe incluir el procedimiento de evacuación y uso de equipos contra incendios.',
        ],
        highlight: '🔥 En Colombia el 35% de los siniestros industriales son incendios – FASECOLDA 2023',
      },
      {
        type: 'list', icon: '🔥', title: 'Clases de Fuego – Norma NTC 1931',
        image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&q=80',
        items: [
          { title: 'Clase A – Sólidos', desc: 'Madera, papel, textiles, plásticos. Extintor: agua, polvo ABC. Símbolo: triángulo verde.', color: 'bg-emerald-500' },
          { title: 'Clase B – Líquidos', desc: 'Gasolina, aceites, pinturas, solventes. Extintor: CO₂, polvo BC o ABC. Símbolo: cuadrado rojo.', color: 'bg-red-500' },
          { title: 'Clase C – Eléctrico', desc: 'Equipos energizados, tableros, motores. Extintor: CO₂ o polvo BC (NO usar agua). Símbolo: círculo azul.', color: 'bg-blue-500' },
          { title: 'Clase K – Cocinas', desc: 'Aceites y grasas vegetales/animales a alta temperatura. Extintor especial Clase K. Símbolo: hexágono negro.', color: 'bg-slate-600' },
        ],
      },
      { type: 'steps', icon: '🧯', title: 'Técnica PASS para Uso del Extintor', image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&q=80', steps: ['<strong>P – JALAR (Pull):</strong> Jalar el pasador o seguro metálico del extintor. Romper el precinto de seguridad.', '<strong>A – APUNTAR (Aim):</strong> Apuntar la boquilla o manguera a la BASE de las llamas, no a la parte alta del fuego.', '<strong>S – PRESIONAR (Squeeze):</strong> Presionar el maneral o palanca con firmeza para liberar el agente extintor.', '<strong>S – BARRER (Sweep):</strong> Barrer de lado a lado en movimiento de "Z" o semicircular, siempre a la BASE del fuego.'], highlight: '⏱️ Un extintor de 2,5 kg descarga en solo 8–12 segundos. Practica la técnica PASS antes de necesitarla.' },
      {
        type: 'info', icon: '📍', title: 'Ubicación y Señalización – NTC 1931',
        image: 'https://images.unsplash.com/photo-1586281380426-4ed26c2e87e2?w=600&q=80',
        points: [
          'Distancia máxima de recorrido: <strong>15 metros</strong> hasta el extintor más cercano para fuegos Clase A.',
          'Altura de instalación: parte superior del extintor a máximo <strong>1,53 metros</strong> del piso (NTC 1931 Sec. 6.1).',
          'Señal de ubicación: flecha roja con pictograma a <strong>2,5 metros</strong> de altura, visible desde 10 metros.',
          'Los extintores <strong>NO deben estar bloqueados</strong> por muebles, cajas ni material de trabajo.',
        ],
        highlight: '🔴 Inspección mensual obligatoria: verificar presión, seguro, boquilla y etiqueta de mantenimiento (NTC 1931)',
      },
      {
        type: 'danger', icon: '⚠️', title: 'Errores Críticos en el Uso del Extintor',
        image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&q=80',
        risks: [
          { level: 'ALTO', item: 'Usar extintor de agua o espuma en fuego Clase C (eléctrico) – riesgo de electrocución fatal' },
          { level: 'ALTO', item: 'Intentar combatir un incendio sin haber activado primero la alarma y el protocolo de evacuación' },
          { level: 'ALTO', item: 'Dar la espalda al fuego después de aparentemente extinguirlo – el fuego puede reavivarse' },
          { level: 'MEDIO', item: 'Apuntar al centro de las llamas en vez de a la base – el fuego no se extingue correctamente' },
          { level: 'MEDIO', item: 'Usar un extintor vencido o sin mantenimiento anual certificado (NTC 1931)' },
          { level: 'BAJO', item: 'No conocer la clase de fuego antes de seleccionar el extintor' },
        ],
      },
      {
        type: 'summary', icon: '🎯', title: 'Resumen – Claves Normativas Colombia',
        image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&q=80',
        points: [
          'NTC 1931/2011: extintor a máx. 15 m, instalado a máx. 1,53 m del piso',
          'Clases de fuego: A (sólidos), B (líquidos), C (eléctrico), K (grasas cocina)',
          'Técnica PASS: Jalar – Apuntar a la BASE – Presionar – Barrer',
          'NUNCA usar agua/espuma en fuego eléctrico Clase C',
          'Inspección mensual y mantenimiento anual certificado obligatorio',
          'Plan de Emergencias con uso de extintores incluido en el SG-SST (Decreto 1072/2015)',
        ],
      },
    ],
    quiz: [
      { q: '¿Qué norma colombiana regula la protección contra incendios y el uso de extintores en edificaciones?', options: ['NTC 1700', 'NTC 1931 de 2011', 'Resolución 1409/2012', 'NSR-10 Título A'], correct: 1, explanation: 'La NTC 1931 de 2011 de ICONTEC establece los requisitos de protección contra incendios, incluyendo tipos, ubicación y mantenimiento de extintores.' },
      { q: '¿Qué tipo de extintor NO se debe usar en un fuego eléctrico (Clase C)?', options: ['CO₂', 'Polvo químico BC', 'Agua o espuma', 'Polvo ABC'], correct: 2, explanation: 'Usar agua o espuma en fuego eléctrico puede causar electrocución fatal. Para fuegos Clase C se usa CO₂ o polvo BC.' },
      { q: '¿A qué parte del fuego se debe apuntar el extintor con la técnica PASS?', options: ['A la punta de las llamas', 'Al centro de las llamas', 'A la base del fuego', 'Al material combustible alejado del fuego'], correct: 2, explanation: 'La técnica PASS indica apuntar siempre a la BASE del fuego donde está el combustible, no a las llamas.' },
      { q: '¿A qué altura máxima del piso debe instalarse la parte superior del extintor según la NTC 1931?', options: ['1,00 metro', '1,20 metros', '1,53 metros', '2,00 metros'], correct: 2, explanation: 'La NTC 1931 Sección 6.1 establece que la parte superior del extintor debe estar a máximo 1,53 metros del piso.' },
      { q: '¿Cuál es la distancia máxima de recorrido hasta un extintor para fuegos Clase A según NTC 1931?', options: ['5 metros', '10 metros', '15 metros', '25 metros'], correct: 2, explanation: 'La NTC 1931 establece que la distancia máxima de recorrido hasta un extintor para fuego Clase A es de 15 metros.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CURSO 4 — EPP
  // ══════════════════════════════════════════════════════════════════════════
  4: {
    title: 'EPP – Equipos de Protección Personal',
    color: 'from-violet-600 to-purple-500',
    cover: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=800&q=80',
    duration: '6h', rating: 4.3,
    slides: [
      { type: 'cover', icon: '⛑️', title: 'Equipos de Protección Personal', subtitle: 'Selección, Uso y Mantenimiento', body: 'Resolución 2400/1979 · Decreto 1072/2015 · NTC 1733 · GTC 45', image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=900&q=80' },
      {
        type: 'legal', icon: '⚖️', title: 'Base Legal del EPP en Colombia',
        norm: 'Resolución 2400 de 1979 y Decreto 1072 de 2015',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        points: [
          '<strong>Resolución 2400/1979 Art. 176:</strong> El empleador está obligado a suministrar gratuitamente a todos los trabajadores los EPP adecuados al riesgo al que están expuestos.',
          '<strong>Decreto 1072/2015 Art. 2.2.4.6.8:</strong> El empleador debe asegurar que los EPP se usen correctamente y estén en buen estado. El trabajador está obligado a usarlos.',
          '<strong>Resolución 0312/2019 Estándar 6.1:</strong> La empresa debe llevar registro actualizado de la entrega de EPP por trabajador con firma de recibido.',
          '<strong>NTC 1733:</strong> Norma técnica colombiana para cascos de seguridad industrial – especificaciones y métodos de ensayo.',
        ],
        highlight: '❌ No suministrar EPP o permitir trabajo sin EPP es infracción sancionable con hasta 1.000 SMMLV (Ley 1562/2012)',
      },
      {
        type: 'list', icon: '🦺', title: 'EPP por Parte del Cuerpo – NTC y ANSI',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
        items: [
          { title: 'Protección de la cabeza', desc: 'Casco NTC 1733 o ANSI Z89.1. Clase E: hasta 20.000V. Clase G: hasta 2.200V. Reemplazar tras impacto o cada 5 años.', color: 'bg-yellow-500' },
          { title: 'Protección ocular y facial', desc: 'Gafas NTC 3610 o ANSI Z87.1. Careta facial para salpicaduras. Protección UV para soldadura (filtro DIN 10–14).', color: 'bg-blue-500' },
          { title: 'Protección respiratoria', desc: 'N95 para partículas. Media cara con cartuchos para vapores orgánicos. Equipo autónomo SCBA para atmósferas IDLH.', color: 'bg-cyan-500' },
          { title: 'Protección de manos y pies', desc: 'Guantes por riesgo (cuero, nitrilo, neopreno). Calzado NTC 2396 con puntera de acero (200J) y suela antideslizante.', color: 'bg-orange-500' },
        ],
      },
      { type: 'steps', icon: '🔍', title: 'Inspección de EPP Antes de Cada Uso', image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=600&q=80', steps: ['<strong>Identificar el EPP correcto</strong> para el riesgo específico de la tarea según la matriz de peligros GTC 45.', '<strong>Revisar visualmente:</strong> fisuras, grietas, deformaciones, decoloración, olor químico atípico o degradación por UV.', '<strong>Verificar certificación:</strong> etiqueta legible con norma técnica (NTC/ANSI/EN), fecha de fabricación y fecha de vencimiento.', '<strong>Probar funcionalidad:</strong> cierres, hebillas, válvulas, filtros y sistema de ajuste. Todo debe operar sin esfuerzo.', '<strong>Si hay duda sobre el estado:</strong> RETIRAR del servicio y solicitar reemplazo inmediato al empleador.', '<strong>Registrar en bitácora:</strong> fecha de inspección, estado y nombre del trabajador (Res. 0312/2019 Estándar 6.1).'] },
      {
        type: 'info', icon: '📦', title: 'Mantenimiento y Vida Útil del EPP',
        image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=600&q=80',
        points: [
          '<strong>Cascos:</strong> Reemplazar cada 5 años o inmediatamente tras un impacto fuerte, aunque no se vean daños externos.',
          '<strong>Arneses y líneas de vida:</strong> Inspección visual diaria. Retirar si ha sufrido caída. Vida útil máxima 10 años desde fabricación.',
          '<strong>Respiradores:</strong> Cambio de filtros según indicación del fabricante o si se detecta olor del contaminante.',
          '<strong>Guantes:</strong> Inspeccionar en busca de perforaciones inflando antes de usar. Descartar si hay daño.',
        ],
        highlight: '📋 El empleador debe llevar inventario actualizado de EPP entregado por trabajador con fecha y firma (Res. 0312/2019)',
      },
      {
        type: 'summary', icon: '🎯', title: 'Resumen – EPP en el SG-SST Colombia',
        image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=600&q=80',
        points: [
          'Res. 2400/1979: EPP gratuito obligatorio según el riesgo de cada cargo',
          'Decreto 1072/2015: El trabajador DEBE usar el EPP asignado – es obligación legal',
          'Seleccionar EPP según GTC 45: identificar peligro → valorar riesgo → elegir protección',
          'Casco NTC 1733/ANSI Z89.1 · Calzado NTC 2396 · Gafas NTC 3610',
          'Registro escrito de entrega con firma por trabajador (Res. 0312/2019 Est. 6.1)',
          'EPP dañado o vencido: RETIRAR y reemplazar de inmediato',
        ],
      },
    ],
    quiz: [
      { q: '¿Qué norma colombiana obliga al empleador a suministrar gratuitamente el EPP?', options: ['Decreto 1072/2015', 'Resolución 2400/1979 Art. 176', 'Ley 1562/2012', 'Resolución 0312/2019'], correct: 1, explanation: 'La Resolución 2400 de 1979, Art. 176 establece la obligación del empleador de suministrar gratuitamente los EPP adecuados al riesgo.' },
      { q: '¿Qué norma técnica colombiana rige los cascos de seguridad industrial?', options: ['NTC 2396', 'NTC 3610', 'NTC 1733', 'NTC 1931'], correct: 2, explanation: 'La NTC 1733 establece las especificaciones y métodos de ensayo para cascos de seguridad industrial en Colombia.' },
      { q: '¿Cada cuántos años como máximo debe reemplazarse un casco de seguridad aunque no presente daños visibles?', options: ['2 años', '3 años', '5 años', '10 años'], correct: 2, explanation: 'Los cascos de seguridad deben reemplazarse cada 5 años o inmediatamente después de un impacto fuerte.' },
      { q: '¿Qué documento exige la Resolución 0312 de 2019 respecto a la entrega de EPP?', options: ['Solo inventario de bodega', 'Registro con firma del trabajador por cada EPP entregado', 'Póliza de seguros del EPP', 'Certificación ISO del fabricante'], correct: 1, explanation: 'La Resolución 0312 de 2019, Estándar 6.1 exige llevar registro actualizado con firma del trabajador de cada EPP entregado.' },
      { q: '¿Qué metodología se usa en Colombia para identificar peligros y seleccionar el EPP adecuado?', options: ['NTC 4114', 'GTC 45', 'ISO 45001', 'OHSAS 18001'], correct: 1, explanation: 'La GTC 45 (Guía Técnica Colombiana) es la metodología estándar para identificación de peligros y valoración de riesgos, base para la selección del EPP.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CURSO 5 — COPASST
  // ══════════════════════════════════════════════════════════════════════════
  5: {
    title: 'COPASST – Comité Paritario SST',
    color: 'from-emerald-600 to-teal-500',
    cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    duration: '12h', rating: 4.7,
    slides: [
      { type: 'cover', icon: '🤝', title: 'COPASST', subtitle: 'Comité Paritario de Seguridad y Salud en el Trabajo', body: 'Decreto 1072/2015 · Resolución 2013/1986 · Ley 1562/2012', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=80' },
      {
        type: 'legal', icon: '⚖️', title: 'Marco Legal del COPASST',
        norm: 'Decreto 1072 de 2015 Art. 2.2.4.6.8 y Resolución 2013 de 1986',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        points: [
          '<strong>Resolución 2013 de 1986:</strong> Crea el Comité Paritario de Salud Ocupacional (hoy COPASST). Establece funciones, composición y elección.',
          '<strong>Decreto 1072/2015 Art. 2.2.4.6.8 numeral 8:</strong> El COPASST es uno de los 7 componentes obligatorios del SG-SST en toda empresa colombiana.',
          '<strong>Resolución 0312/2019 Estándar 1.1.6:</strong> Conformación, convocatoria y funcionamiento del COPASST es requisito de cumplimiento mínimo para todas las empresas.',
          '<strong>Ley 1562 de 2012 Art. 35:</strong> Las empresas que no constituyan el COPASST pueden ser sancionadas hasta con 500 SMMLV.',
        ],
        highlight: '📌 Empresas con < 10 trabajadores: Vigía de SST (1 persona). Empresas con ≥ 10 trabajadores: COPASST',
      },
      {
        type: 'list', icon: '👥', title: 'Composición y Elección del COPASST',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
        items: [
          { title: '10–49 trabajadores', desc: '1 representante del empleador + 1 representante de los trabajadores (elegido por votación secreta). Total: 2 miembros.', color: 'bg-blue-500' },
          { title: '50–499 trabajadores', desc: '2 representantes del empleador + 2 representantes de los trabajadores elegidos por voto. Total: 4 miembros principales.', color: 'bg-violet-500' },
          { title: '500 o más trabajadores', desc: '4 representantes del empleador + 4 elegidos por los trabajadores. Total: 8 miembros principales + suplentes.', color: 'bg-emerald-500' },
          { title: 'Período y reelección', desc: 'Período de 2 años. Los representantes del empleador son designados. Los de los trabajadores son elegidos por voto secreto. Reelección permitida.', color: 'bg-orange-500' },
        ],
      },
      {
        type: 'steps', icon: '🗳️', title: 'Proceso de Elección del COPASST',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
        steps: [
          '<strong>Convocatoria:</strong> El empleador publica aviso de elecciones con mínimo 5 días de anticipación (carteleras, correo, comunicado oficial).',
          '<strong>Inscripción de candidatos:</strong> Plazo mínimo de 3 días hábiles. Cualquier trabajador puede postularse voluntariamente.',
          '<strong>Votación secreta:</strong> Todos los trabajadores votan. Se levanta acta con número de votantes y votos por candidato.',
          '<strong>Comunicación al Ministerio de Trabajo:</strong> El acta de conformación debe enviarse al Ministerio de Trabajo dentro de los 8 días siguientes.',
          '<strong>Primer reunión:</strong> Elección interna del presidente y secretario del COPASST. Establecer calendario de reuniones mensuales.',
          '<strong>Registro en el SG-SST:</strong> Incluir actas de elección, actas de reunión y plan de trabajo en el archivo del sistema.',
        ],
      },
      {
        type: 'info', icon: '📋', title: 'Funciones del COPASST',
        norm: 'Resolución 2013 de 1986 Art. 11 – Funciones obligatorias',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
        points: [
          '<strong>Inspecciones periódicas:</strong> Visitar mensualmente las instalaciones para identificar condiciones inseguras y actos inseguros. Elaborar informe con hallazgos.',
          '<strong>Investigación de accidentes:</strong> Participar en la investigación de todos los accidentes e incidentes. Proponer medidas correctivas al empleador.',
          '<strong>Seguimiento al plan de mejora:</strong> Verificar que el empleador implemente las recomendaciones formuladas dentro de los plazos acordados.',
          '<strong>Vigilancia del Programa de SST:</strong> Evaluar que el SG-SST se esté implementando y que se cumplan los estándares de la Res. 0312/2019.',
        ],
        highlight: '⏰ Reunión ordinaria mensual OBLIGATORIA. Reunión extraordinaria cuando ocurra un accidente de trabajo grave.',
      },
      {
        type: 'summary', icon: '🎯', title: 'Resumen – COPASST en Colombia',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
        points: [
          'Resolución 2013/1986: crea el COPASST y establece sus funciones',
          'Decreto 1072/2015: el COPASST es obligatorio en el SG-SST de toda empresa',
          'Empresas < 10 trabajadores: Vigía de SST. ≥ 10 trabajadores: COPASST',
          'Elección por voto secreto cada 2 años. Acta al Ministerio de Trabajo en 8 días',
          'Funciones: inspecciones mensuales, investigación de accidentes, seguimiento al plan de mejora',
          'Sanción por no conformar el COPASST: hasta 500 SMMLV (Ley 1562/2012)',
        ],
      },
    ],
    quiz: [
      { q: '¿Qué norma creó el Comité Paritario de Salud Ocupacional (hoy COPASST) en Colombia?', options: ['Decreto 1072 de 2015', 'Resolución 2013 de 1986', 'Ley 1562 de 2012', 'Resolución 0312 de 2019'], correct: 1, explanation: 'La Resolución 2013 de 1986 del Ministerio de Trabajo creó el Comité Paritario de Salud Ocupacional, hoy denominado COPASST.' },
      { q: '¿Cuántos miembros tiene el COPASST en una empresa entre 50 y 499 trabajadores?', options: ['2 miembros', '4 miembros principales', '6 miembros', '8 miembros'], correct: 1, explanation: 'En empresas de 50–499 trabajadores el COPASST tiene 2 representantes del empleador + 2 de los trabajadores = 4 miembros principales, más suplentes.' },
      { q: '¿Cuántos días tiene el empleador para notificar al Ministerio de Trabajo la conformación del COPASST?', options: ['3 días', '5 días', '8 días', '15 días'], correct: 2, explanation: 'El acta de conformación del COPASST debe enviarse al Ministerio de Trabajo dentro de los 8 días siguientes a la elección.' },
      { q: '¿Con qué frecuencia mínima debe reunirse el COPASST según la normativa colombiana?', options: ['Cada 3 meses', 'Cada 2 meses', 'Mensualmente', 'Semanalmente'], correct: 2, explanation: 'La reunión ordinaria del COPASST es mensual obligatoria. Adicionalmente, debe reunirse de forma extraordinaria cuando ocurra un accidente grave.' },
      { q: '¿Qué debe hacer una empresa con menos de 10 trabajadores en lugar del COPASST?', options: ['No requiere ningún comité', 'Nombrar un Vigía de SST', 'Crear un comité de 2 personas', 'Contratar un asesor externo'], correct: 1, explanation: 'Las empresas con menos de 10 trabajadores deben nombrar un Vigía de Seguridad y Salud en el Trabajo en lugar del COPASST.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CURSO 6 — RIESGO ELÉCTRICO
  // ══════════════════════════════════════════════════════════════════════════
  6: {
    title: 'Riesgo Eléctrico Industrial',
    color: 'from-yellow-500 to-orange-500',
    cover: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80',
    duration: '8h', rating: 4.6,
    slides: [
      { type: 'cover', icon: '⚡', title: 'Riesgo Eléctrico Industrial', subtitle: 'Identificación, Control y Seguridad', body: 'RETIE 2013 · NTC 2050 · Resolución 2400/1979 · Decreto 1072/2015', image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=900&q=80' },
      {
        type: 'legal', icon: '⚖️', title: 'Marco Legal del Riesgo Eléctrico',
        norm: 'RETIE 2013 y NTC 2050 – Ministerio de Minas y Energía',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        points: [
          '<strong>RETIE (Reglamento Técnico de Instalaciones Eléctricas) Resolución 9 0708 de 2013:</strong> Obligatorio para instalaciones eléctricas en Colombia. Establece condiciones de seguridad para diseño, instalación, inspección y mantenimiento.',
          '<strong>NTC 2050 (Código Eléctrico Nacional):</strong> Norma técnica colombiana equivalente al NEC de EE.UU. Regula instalaciones eléctricas seguras.',
          '<strong>Resolución 2400/1979 Cap. VI:</strong> Disposiciones sobre instalaciones eléctricas en lugares de trabajo – puesta a tierra, protección de conductores, señalización.',
          '<strong>Decreto 1072/2015:</strong> El riesgo eléctrico debe estar identificado en la matriz de peligros GTC 45 con sus controles específicos.',
        ],
        highlight: '⚡ En Colombia, el riesgo eléctrico causa el 8% de los accidentes mortales laborales (Fasecolda 2023)',
      },
      {
        type: 'list', icon: '⚡', title: 'Efectos de la Corriente Eléctrica en el Cuerpo',
        image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&q=80',
        items: [
          { title: '1 mA – Percepción', desc: 'El trabajador siente un hormigueo leve. No hay lesión pero indica contacto con la corriente.', color: 'bg-yellow-500' },
          { title: '10 mA – No-soltar', desc: 'Contracción muscular involuntaria. La persona no puede soltar el conductor. Inicia el peligro real.', color: 'bg-orange-500' },
          { title: '100 mA – Fibrilación', desc: 'Fibrilación ventricular. Altamente letal. Es el umbral de muerte por electrocución.', color: 'bg-red-500' },
          { title: '> 1 A – Quemaduras', desc: 'Quemaduras internas y externas severas, paro cardíaco, daño neurológico irreversible.', color: 'bg-rose-600' },
        ],
      },
      { type: 'steps', icon: '🔒', title: 'Procedimiento LOTO – Bloqueo y Etiquetado', image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&q=80', steps: ['<strong>L – LISTAR</strong> todas las fuentes de energía (eléctrica, hidráulica, neumática, mecánica) del equipo a intervenir.', '<strong>O – AISLAR</strong> cada fuente energizando el dispositivo de bloqueo (breaker, válvula, interruptor) en posición OFF.', '<strong>T – TRABA:</strong> Instalar el candado personal intransferible en cada dispositivo bloqueado. Solo el propietario del candado puede retirarlo.', '<strong>O – ETIQUETA (Tag):</strong> Colocar tarjeta con: nombre del trabajador, fecha, hora, contacto. NADIE retira una etiqueta que no es suya.', 'Verificar ausencia de energía: probar con multímetro certificado antes de tocar cualquier componente.', 'Al terminar: restaurar energía solo después de retirar candados, herramientas y notificar a todos los involucrados.'], highlight: '🔒 LOTO es obligatorio en toda intervención de mantenimiento a equipos energizados (RETIE 2013 Art. 30)' },
      {
        type: 'danger', icon: '⚠️', title: 'Riesgos y Causas Frecuentes',
        image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&q=80',
        risks: [
          { level: 'ALTO', item: 'Trabajar en equipos energizados sin aplicar LOTO – causa principal de electrocuciones en mantenimiento' },
          { level: 'ALTO', item: 'Instalaciones sin puesta a tierra o con tierra defectuosa – riesgo de electrocución por contacto indirecto' },
          { level: 'ALTO', item: 'Conductores con aislamiento deteriorado o empalmes improvisados sin cinta certificada' },
          { level: 'MEDIO', item: 'Uso de herramientas no dieléctricas cerca de conductores energizados' },
          { level: 'MEDIO', item: 'Tableros eléctricos sin señalización o con acceso desprotegido a personas no autorizadas' },
          { level: 'BAJO', item: 'Sobrecargas en tomas eléctricas con extensiones o regletas sin protección de sobrecorriente' },
        ],
      },
      {
        type: 'summary', icon: '🎯', title: 'Resumen – Riesgo Eléctrico en Colombia',
        image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&q=80',
        points: [
          'RETIE 2013: reglamento obligatorio para instalaciones eléctricas en Colombia',
          'NTC 2050: Código Eléctrico Nacional – base de diseño e instalaciones seguras',
          'A 100 mA se produce fibrilación ventricular – umbral de muerte por electrocución',
          'LOTO obligatorio en toda intervención de mantenimiento (RETIE 2013 Art. 30)',
          'Puesta a tierra correcta es la principal defensa contra contacto eléctrico indirecto',
          'El riesgo eléctrico debe incluirse en la Matriz de Peligros GTC 45 del SG-SST',
        ],
      },
    ],
    quiz: [
      { q: '¿Qué reglamento técnico rige las instalaciones eléctricas en Colombia?', options: ['NTC 2050', 'RETIE – Resolución 9 0708 de 2013', 'NSR-10 Título F', 'Resolución 2400/1979'], correct: 1, explanation: 'El RETIE (Reglamento Técnico de Instalaciones Eléctricas), adoptado mediante Resolución 9 0708 de 2013, es el reglamento obligatorio para instalaciones eléctricas en Colombia.' },
      { q: '¿A partir de qué valor de corriente se produce fibrilación ventricular (umbral de muerte)?', options: ['10 mA', '50 mA', '100 mA', '500 mA'], correct: 2, explanation: 'A partir de 100 mA la corriente eléctrica puede producir fibrilación ventricular, que es el principal mecanismo de muerte por electrocución.' },
      { q: '¿Qué significa LOTO en el contexto del riesgo eléctrico?', options: ['Localizar, Organizar, Trazar, Operar', 'Lock Out – Tag Out (Bloqueo y Etiquetado)', 'Lista, Operar, Transferir, Observar', 'Limitar, Aislar, Testear, Operar'], correct: 1, explanation: 'LOTO significa Lock Out – Tag Out (Bloqueo y Etiquetado de energías). Es el procedimiento obligatorio para intervenir equipos energizados de forma segura.' },
      { q: '¿Quién puede retirar el candado de un dispositivo LOTO?', options: ['Cualquier técnico de mantenimiento', 'El supervisor de turno', 'Solo el trabajador propietario del candado', 'El jefe de planta'], correct: 2, explanation: 'En el procedimiento LOTO cada trabajador instala su candado personal intransferible. Solo ese trabajador puede retirarlo, garantizando que la energía no se restablece sin su conocimiento.' },
      { q: '¿Qué norma técnica colombiana es el equivalente al Código Eléctrico Nacional (NEC)?', options: ['RETIE', 'NTC 1733', 'NTC 2050', 'GTC 45'], correct: 2, explanation: 'La NTC 2050 es el Código Eléctrico Nacional colombiano, equivalente al NEC de EE.UU., y regula las instalaciones eléctricas seguras.' },
    ],
  },
}

const getTraining = (id: number): Training => DB[id] ?? DB[1]

// ─── Slide Renderer ───────────────────────────────────────────────────────────
function SlideView({ slide }: { slide: Slide }) {
  const riskColor = (level: string) =>
    level === 'ALTO' ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' :
    level === 'MEDIO' ? 'bg-orange-500/15 border-orange-500/30 text-orange-300' :
    'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'

  if (slide.type === 'cover') return (
    <div className="relative h-full flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl">
      <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E]/80 via-[#0A0F1E]/50 to-[#0A0F1E]/90" />
      <div className="relative z-10 px-6 max-w-2xl">
        <div className="text-7xl mb-5">{slide.icon}</div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">{slide.title}</h1>
        {slide.subtitle && <p className="text-blue-300 text-lg font-semibold mb-3">{slide.subtitle}</p>}
        {slide.body && <p className="text-slate-400 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2 inline-block">{slide.body}</p>}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-[#0D1629] border border-white/8">
      {slide.image && (
        <div className="lg:w-[38%] h-48 lg:h-full flex-shrink-0 overflow-hidden relative">
          <img src={slide.image} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0D1629] hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D1629] lg:hidden" />
        </div>
      )}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
        {slide.norm && (
          <div className="flex items-center gap-2 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
            <Shield size={12} className="text-blue-400 flex-shrink-0" />
            <span className="text-blue-300 text-xs font-semibold">{slide.norm}</span>
          </div>
        )}
        <div className="flex items-start gap-2.5 mb-4">
          <span className="text-2xl leading-none mt-0.5">{slide.icon}</span>
          <h2 className="text-white font-black text-lg sm:text-xl leading-tight">{slide.title}</h2>
        </div>

        {(slide.type === 'info' || slide.type === 'legal') && (
          <div className="space-y-3">
            {slide.points?.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <p className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: p }} />
              </motion.div>
            ))}
            {slide.highlight && (
              <div className="mt-4 bg-amber-400/10 border border-amber-400/25 rounded-xl p-3.5">
                <p className="text-amber-200 text-sm font-medium" dangerouslySetInnerHTML={{ __html: slide.highlight }} />
              </div>
            )}
          </div>
        )}

        {slide.type === 'list' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {slide.items?.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} mb-2`} />
                <div className="text-white font-bold text-sm mb-1">{item.title}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        )}

        {slide.type === 'danger' && (
          <div className="space-y-2">
            {slide.risks?.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className={`flex items-center gap-3 rounded-xl p-3 border ${riskColor(r.level)}`}>
                <span className="text-xs font-black w-12 flex-shrink-0 text-center">{r.level}</span>
                <p className="text-sm leading-snug">{r.item}</p>
              </motion.div>
            ))}
          </div>
        )}

        {slide.type === 'steps' && (
          <div className="space-y-3">
            {slide.steps?.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09 }}
                className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: s }} />
              </motion.div>
            ))}
            {slide.highlight && (
              <div className="mt-3 bg-amber-400/10 border border-amber-400/25 rounded-xl p-3.5">
                <p className="text-amber-200 text-sm font-medium" dangerouslySetInnerHTML={{ __html: slide.highlight }} />
              </div>
            )}
          </div>
        )}

        {slide.type === 'summary' && (
          <div className="space-y-2.5">
            {slide.points?.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl p-3">
                <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                <p className="text-slate-300 text-sm">{p}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
function QuizSection({ questions, onFinish }: { questions: Question[]; onFinish: (score: number) => void }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const q = questions[current]

  const choose = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    const a = [...answers]; a[current] = i; setAnswers(a)
  }

  const next = () => {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(answers[current + 1]) }
    else {
      const correct = answers.filter((a, i) => a === questions[i].correct).length
      onFinish(Math.round((correct / questions.length) * 100))
    }
  }

  return (
    <div className="h-full flex flex-col p-5 sm:p-6 max-w-2xl mx-auto w-full">
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Pregunta {current + 1} de {questions.length}</span>
          <span>{Math.round((current / questions.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(current / questions.length) * 100}%` }} className="h-full bg-blue-500 rounded-full" />
        </div>
      </div>
      <h3 className="text-white font-bold text-base sm:text-lg mb-5 leading-snug flex-shrink-0">{q.q}</h3>
      <div className="space-y-2.5 flex-1">
        {q.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === q.correct
          const show = selected !== null
          return (
            <motion.button key={i} onClick={() => choose(i)} whileTap={{ scale: 0.99 }}
              className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all ${
                !show ? 'border-white/8 bg-white/[0.03] text-slate-300 hover:border-blue-500/40 hover:bg-blue-500/5'
                : isCorrect ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                : isSelected ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                : 'border-white/5 bg-white/[0.02] text-slate-600'
              }`}>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  !show ? 'border-white/20 text-slate-400' : isCorrect ? 'border-emerald-400 text-emerald-400' : isSelected ? 'border-rose-400 text-rose-400' : 'border-white/10 text-slate-600'
                }`}>{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{opt}</span>
                {show && isCorrect && <CheckCircle size={15} className="text-emerald-400" />}
                {show && isSelected && !isCorrect && <X size={15} className="text-rose-400" />}
              </div>
            </motion.button>
          )
        })}
      </div>
      {selected !== null && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-300 text-xs leading-relaxed">💡 {q.explanation}</p>
        </motion.div>
      )}
      <button onClick={next} disabled={selected === null}
        className="mt-4 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
        {current === questions.length - 1 ? <><Award size={15} /> Ver resultado</> : <>Siguiente <ChevronRight size={15} /></>}
      </button>
    </div>
  )
}

// ─── Certificate ──────────────────────────────────────────────────────────────
function Certificate({ title, score, onRetry }: { title: string; score: number; onRetry: () => void }) {
  const passed = score >= 70
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const expires = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const code = `CERT-${Date.now().toString(36).toUpperCase().slice(-8)}`

  if (!passed) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl mb-4">😔</div>
      <h2 className="text-white font-black text-2xl mb-2">No alcanzaste el mínimo</h2>
      <p className="text-slate-400 mb-1">Obtuviste <span className="text-rose-400 font-bold text-xl">{score}%</span></p>
      <p className="text-slate-500 text-sm mb-6">Se requiere mínimo <span className="text-white font-semibold">70%</span> para obtener el certificado</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all">
        <RotateCcw size={15} /> Reintentar evaluación
      </button>
    </div>
  )

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="bg-gradient-to-br from-[#0D1629] to-[#0f1f3a] border-2 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10">
          <div className="bg-gradient-to-r from-blue-700 to-violet-700 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3">
              <Award size={32} className="text-white" />
            </div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Jimmy Academy · SG-SST Colombia</p>
            <h2 className="text-white font-black text-xl">Certificado de Competencia</h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-slate-400 text-sm mb-1">Se certifica que</p>
            <h3 className="text-white font-black text-2xl mb-1">Admin SST</h3>
            <p className="text-slate-400 text-sm mb-4">completó satisfactoriamente la capacitación en</p>
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-4 mb-5">
              <p className="text-blue-200 font-bold text-base leading-snug">{title}</p>
              <div className="mt-2 text-yellow-400 font-bold">Calificación: {score}% ✓</div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
              {[
                { label: 'Fecha emisión', value: today },
                { label: 'Válido hasta', value: expires },
                { label: 'Código', value: code },
                { label: 'Verificación', value: 'QR' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl p-2.5">
                  <p className="text-slate-500 text-[10px] mb-0.5">{label}</p>
                  {label === 'Verificación' ? <QrCode size={28} className="text-slate-400" /> : <p className="text-white text-xs font-semibold font-mono">{value}</p>}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <Shield size={12} className="text-emerald-400" />
              <p className="text-emerald-400 text-xs font-semibold">Decreto 1072/2015 · Resolución 0312/2019 · SG-SST Colombia</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={onRetry} className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-sm font-semibold transition-all">Cerrar</button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all">
                <Download size={14} /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrainingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const training = getTraining(Number(id))
  const slides = training.slides
  const quiz = training.quiz

  const [phase, setPhase] = useState<'slides' | 'quiz' | 'certificate'>('slides')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [showIndex, setShowIndex] = useState(false)

  const isLast = currentSlide === slides.length - 1
  const progress = Math.round(((currentSlide + 1) / slides.length) * 100)

  return (
    <div className="flex flex-col h-screen bg-[#0A0F1E] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 h-14 bg-[#0D1629]/90 backdrop-blur-xl border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <ChevronLeft size={16} />
          </button>
          <div>
            <p className="text-white font-bold text-sm truncate max-w-[180px] sm:max-w-xs">{training.title}</p>
            <p className="text-slate-500 text-xs">
              {phase === 'slides' ? `Diapositiva ${currentSlide + 1}/${slides.length}` : phase === 'quiz' ? 'Evaluación final' : 'Certificado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'slides' && (
            <button onClick={() => setShowIndex(!showIndex)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <List size={14} />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/8 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${phase === 'slides' ? progress : phase === 'quiz' ? 90 : 100}%` }} className="h-full bg-blue-500 rounded-full" />
            </div>
            <span className="text-slate-400 text-xs w-7">{phase === 'slides' ? `${progress}%` : phase === 'quiz' ? '90%' : '100%'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence>
          {showIndex && (
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'tween' }}
              className="absolute left-0 top-0 bottom-0 w-60 bg-[#0D1629] border-r border-white/8 z-20 overflow-y-auto">
              <div className="p-3">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Índice</p>
                {slides.map((s, i) => (
                  <button key={i} onClick={() => { setCurrentSlide(i); setShowIndex(false) }}
                    className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg mb-0.5 text-xs transition-all ${currentSlide === i ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                    <span className="flex-shrink-0">{s.icon}</span>
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
                <div className="mt-2 pt-2 border-t border-white/8">
                  <button onClick={() => { setPhase('quiz'); setShowIndex(false) }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                    <BookOpen size={12} /> Evaluación
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase === 'slides' && (
            <motion.div key={`s${currentSlide}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full p-3 sm:p-5">
              <SlideView slide={slides[currentSlide]} />
            </motion.div>
          )}
          {phase === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-y-auto">
              <QuizSection questions={quiz} onFinish={(s) => { setFinalScore(s); setPhase('certificate') }} />
            </motion.div>
          )}
          {phase === 'certificate' && (
            <motion.div key="cert" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-y-auto">
              <Certificate title={training.title} score={finalScore} onRetry={() => setPhase('quiz')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {phase === 'slides' && (
        <div className="flex items-center justify-between px-4 sm:px-5 h-16 bg-[#0D1629]/90 backdrop-blur-xl border-t border-white/8 flex-shrink-0">
          <button onClick={() => currentSlide > 0 && setCurrentSlide(c => c - 1)} disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/8 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold transition-all">
            <ChevronLeft size={15} /> Anterior
          </button>
          <div className="hidden sm:flex items-center gap-1">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${i === currentSlide ? 'w-4 h-2 bg-blue-400' : 'w-2 h-2 bg-white/15 hover:bg-white/30'}`} />
            ))}
          </div>
          <button onClick={() => isLast ? setPhase('quiz') : setCurrentSlide(c => c + 1)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all text-white ${isLast ? 'bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg shadow-blue-600/20' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {isLast ? <><Award size={14} /> Ir a Evaluación</> : <>Siguiente <ChevronRight size={15} /></>}
          </button>
        </div>
      )}
    </div>
  )
}
