'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CheckCircle, X, Award, Download,
  BookOpen, RotateCcw, AlertCircle, Clock, Loader2, QrCode, Shield,
  User, Calendar
} from 'lucide-react'
import { getCourseData } from '@/lib/pptx-extractor'

type Phase = 'slides' | 'quiz' | 'result' | 'certificate'
type Question = { q: string; options: string[]; correct: number; explanation: string }

// Generate questions from actual slide text content
function generateQuestionsFromContent(texts: string[], title: string): Question[] {
  const allText = texts.join(' ').toLowerCase()
  const questions: Question[] = []

  // Extract key concepts from the text to build relevant questions
  const concepts: { keyword: string; topic: string; question: Question }[] = [
    {
      keyword: 'epp',
      topic: 'EPP',
      question: {
        q: `Según la capacitación "${title}", ¿cuál es la importancia del EPP?`,
        options: [
          'Proteger al trabajador de riesgos que no pueden eliminarse en la fuente',
          'Es opcional según el criterio del trabajador',
          'Solo se usa en emergencias',
          'Es responsabilidad exclusiva de la ARL',
        ],
        correct: 0,
        explanation: 'El EPP (Equipo de Protección Personal) es la última barrera de protección del trabajador cuando los riesgos no pueden eliminarse o controlarse en la fuente o en el medio.',
      },
    },
    {
      keyword: 'altura',
      topic: 'alturas',
      question: {
        q: `Según el contenido presentado sobre "${title}", ¿a partir de qué altura aplica la normativa?`,
        options: [
          'A partir de 1 metro',
          'A partir de 2 metros sobre el plano de los pies',
          'A partir de 3 metros',
          'Solo en andamios superiores a 5 metros',
        ],
        correct: 1,
        explanation: 'Según la Resolución 4272 de 2021, trabajo en alturas aplica a toda actividad realizada a 2 metros o más sobre el plano de los pies del trabajador.',
      },
    },
    {
      keyword: 'riesgo',
      topic: 'riesgos',
      question: {
        q: `De acuerdo con la capacitación "${title}", ¿cuál es el primer paso en la gestión de riesgos?`,
        options: [
          'Comprar equipos de protección',
          'Identificar los peligros y valorar los riesgos',
          'Capacitar a los trabajadores',
          'Reportar a la ARL',
        ],
        correct: 1,
        explanation: 'El primer paso siempre es la identificación de peligros y valoración de riesgos (IPVR), según la GTC 45 y el Decreto 1072 de 2015.',
      },
    },
    {
      keyword: 'extintor',
      topic: 'extintores',
      question: {
        q: `Según lo presentado en "${title}", ¿cuál es la técnica correcta para usar un extintor?`,
        options: [
          'Técnica ABCD',
          'Técnica PASS (Pull, Aim, Squeeze, Sweep)',
          'Apuntar directamente a la llama',
          'Usar solo en incendios clase A',
        ],
        correct: 1,
        explanation: 'La técnica PASS consiste en: Pull (Jalar el pasador), Aim (Apuntar a la base del fuego), Squeeze (Apretar la palanca), Sweep (Barrer de lado a lado).',
      },
    },
    {
      keyword: 'primeros auxilios',
      topic: 'primeros auxilios',
      question: {
        q: `Según la capacitación "${title}", ¿cuál es la primera acción ante una emergencia médica?`,
        options: [
          'Administrar medicamentos inmediatamente',
          'Evaluar la escena y garantizar la seguridad propia',
          'Mover al paciente a un lugar seguro',
          'Llamar a la familia del afectado',
        ],
        correct: 1,
        explanation: 'Siempre lo primero es evaluar la seguridad de la escena. No se debe atender a la víctima si la escena no es segura para el primer respondiente.',
      },
    },
    {
      keyword: 'copasst',
      topic: 'COPASST',
      question: {
        q: `Según el contenido de "${title}", ¿cuál es la función principal del COPASST?`,
        options: [
          'Aprobar el presupuesto de SST',
          'Promover y vigilar el cumplimiento del SG-SST',
          'Contratar al coordinador de SST',
          'Reemplazar al vigía de SST',
        ],
        correct: 1,
        explanation: 'El COPASST (Comité Paritario de Seguridad y Salud en el Trabajo) tiene como función principal promover, divulgar y vigilar el cumplimiento del SG-SST.',
      },
    },
    {
      keyword: 'señalización',
      topic: 'señalización',
      question: {
        q: `Según "${title}", ¿qué color de señalización indica prohibición?`,
        options: [
          'Amarillo',
          'Verde',
          'Rojo',
          'Azul',
        ],
        correct: 2,
        explanation: 'El color rojo indica prohibición y peligro inmediato. Amarillo = precaución, Verde = seguridad/evacuación, Azul = obligación.',
      },
    },
    {
      keyword: 'ergon',
      topic: 'ergonomía',
      question: {
        q: `De acuerdo con la capacitación "${title}", ¿cuál es un factor de riesgo ergonómico?`,
        options: [
          'Exposición a ruido industrial',
          'Movimientos repetitivos y posturas forzadas',
          'Contacto con sustancias químicas',
          'Trabajo en espacios confinados',
        ],
        correct: 1,
        explanation: 'Los factores de riesgo ergonómico incluyen movimientos repetitivos, posturas forzadas, manipulación manual de cargas y trabajo estático prolongado.',
      },
    },
    {
      keyword: 'químic',
      topic: 'químicos',
      question: {
        q: `Según "${title}", ¿qué sistema se usa para identificar peligros de sustancias químicas?`,
        options: [
          'Sistema PASS',
          'Sistema GHS (Sistema Globalmente Armonizado)',
          'Sistema ISO 9001',
          'Sistema HACCP',
        ],
        correct: 1,
        explanation: 'El SGA/GHS (Sistema Globalmente Armonizado) clasifica y etiqueta sustancias químicas con pictogramas, palabras de advertencia e indicaciones de peligro.',
      },
    },
    {
      keyword: 'emergencia',
      topic: 'emergencias',
      question: {
        q: `Según la capacitación "${title}", ¿qué debe contener un plan de emergencias?`,
        options: [
          'Solo números de teléfono de emergencia',
          'Procedimientos de evacuación, brigadas, rutas de escape y puntos de encuentro',
          'Solo la ubicación de extintores',
          'Solo el protocolo de llamada al 123',
        ],
        correct: 1,
        explanation: 'Un plan de emergencias integral incluye: análisis de amenazas, procedimientos operativos, conformación de brigadas, rutas de evacuación y puntos de encuentro.',
      },
    },
  ]

  // Match questions based on content
  for (const concept of concepts) {
    if (allText.includes(concept.keyword)) {
      questions.push(concept.question)
    }
  }

  // Always add these general SST questions relevant to any training
  const generalQuestions: Question[] = [
    {
      q: `¿Cuál es la responsabilidad del trabajador respecto a "${title}"?`,
      options: [
        'No tiene ninguna responsabilidad, es del empleador',
        'Participar en la capacitación, aplicar lo aprendido y reportar condiciones inseguras',
        'Solo firmar la asistencia',
        'Delegar al compañero más experimentado',
      ],
      correct: 1,
      explanation: 'Según el Decreto 1072 de 2015, el trabajador debe participar activamente en las capacitaciones, aplicar lo aprendido y reportar condiciones peligrosas.',
    },
    {
      q: `¿Por qué es obligatoria la capacitación en "${title}"?`,
      options: [
        'Para cumplir con el SG-SST según el Decreto 1072 de 2015',
        'Es voluntaria, no obligatoria',
        'Solo para trabajadores nuevos',
        'Solo si la empresa tiene más de 50 empleados',
      ],
      correct: 0,
      explanation: 'El Decreto 1072 de 2015 y la Resolución 0312 de 2019 establecen la obligatoriedad de capacitar a todos los trabajadores en los riesgos asociados a sus actividades.',
    },
    {
      q: `Al completar esta capacitación sobre "${title}", ¿qué debe hacer el trabajador?`,
      options: [
        'Nada, la capacitación es solo teórica',
        'Aplicar lo aprendido en su puesto de trabajo y reportar novedades',
        'Esperar a que el supervisor le indique',
        'Repetir la capacitación cada semana',
      ],
      correct: 1,
      explanation: 'El objetivo de toda capacitación SST es que el trabajador aplique los conocimientos adquiridos en su actividad diaria y contribuya a un ambiente de trabajo seguro.',
    },
  ]

  // Add general questions to fill up to 5
  for (const gq of generalQuestions) {
    if (questions.length >= 5) break
    questions.push(gq)
  }

  // If still less than 5, add more
  if (questions.length < 5) {
    questions.push({
      q: `¿Qué norma colombiana establece los estándares mínimos del SG-SST aplicables a "${title}"?`,
      options: [
        'Resolución 2400 de 1979',
        'Resolución 0312 de 2019',
        'Ley 100 de 1993',
        'Decreto 614 de 1984',
      ],
      correct: 1,
      explanation: 'La Resolución 0312 de 2019 define los estándares mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST).',
    })
  }

  return questions.slice(0, 5)
}

export default function TrainingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = parseInt(params.id as string)

  const [slides, setSlides] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [phase, setPhase] = useState<Phase>('slides')
  const [training, setTraining] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])

  const passed = score >= 3

  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('sst-trainings')
      if (saved) {
        const all = JSON.parse(saved)
        const found = all.find((t: any) => t.id === courseId)
        if (found) setTraining(found)
      }

      try {
        const data = await getCourseData(courseId)
        setSlides(data.images)
        const title = JSON.parse(localStorage.getItem('sst-trainings') || '[]').find((t: any) => t.id === courseId)?.title || 'Capacitación SST'
        setQuestions(generateQuestionsFromContent(data.texts, title))
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [courseId])

  const handleAnswer = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const isCorrect = idx === questions[currentQ].correct
    if (isCorrect) setScore(s => s + 1)
    setAnswers(prev => [...prev, isCorrect])
  }

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setPhase('result')
    }
  }

  const retryQuiz = () => {
    setCurrentQ(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)
    setAnswers([])
    setPhase('quiz')
  }

  const certCode = `CERT-${courseId}-${Date.now().toString(36).toUpperCase()}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--amber)' }} />
          <p style={{ color: 'var(--text-dim)' }}>Cargando capacitación...</p>
        </div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center max-w-md">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-faint)' }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Sin diapositivas</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Este curso no tiene un archivo PPTX con diapositivas. Sube un archivo PowerPoint al crear el curso.
          </p>
          <button onClick={() => router.push('/dashboard/trainings')}
            className="terra-btn px-6 py-2.5">
            <ChevronLeft size={16} /> Volver a Capacitaciones
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/dashboard/trainings')}
            className="p-2 rounded-xl border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>
              {training?.title || 'Capacitación'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {phase === 'slides' && `Diapositiva ${currentSlide + 1} de ${slides.length}`}
              {phase === 'quiz' && `Evaluación — Pregunta ${currentQ + 1} de ${questions.length}`}
              {phase === 'result' && 'Resultado de la Evaluación'}
              {phase === 'certificate' && 'Certificado de Competencia'}
            </p>
          </div>
          {phase === 'slides' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--amber)', color: 'var(--text)' }}>
              <Clock size={12} /> {training?.duration || '8h'}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {(phase === 'slides' || phase === 'quiz') && (
          <div className="terra-progress-track">
            <motion.div
              className={`terra-progress-fill bg-gradient-to-r ${phase === 'slides' ? 'from-amber-500 to-red-500' : 'from-emerald-500 to-teal-500'}`}
              animate={{ width: `${phase === 'slides' ? ((currentSlide + 1) / slides.length) * 100 : ((currentQ + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </motion.div>

      {/* ═══ SLIDES PHASE ═══ */}
      {phase === 'slides' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="terra-card overflow-hidden" style={{ minHeight: 400 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-center p-2 sm:p-4"
                style={{ minHeight: 400 }}
              >
                <img
                  src={slides[currentSlide]}
                  alt={`Diapositiva ${currentSlide + 1}`}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-30"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
              <ChevronLeft size={16} /> Anterior
            </button>

            <div className="flex gap-1.5 flex-wrap justify-center max-w-[50%]">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: i === currentSlide ? 'var(--amber)' : i < currentSlide ? 'rgba(245,158,11,0.4)' : 'var(--border)',
                    transform: i === currentSlide ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {currentSlide < slides.length - 1 ? (
              <button onClick={() => setCurrentSlide(s => s + 1)} className="terra-btn px-4 py-2.5">
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={() => setPhase('quiz')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
                Iniciar Evaluación <CheckCircle size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ QUIZ PHASE ═══ */}
      {phase === 'quiz' && questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="terra-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <BookOpen size={18} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>
                  Pregunta {currentQ + 1} de {questions.length}
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  {questions[currentQ].q}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {questions[currentQ].options.map((opt, i) => {
                let borderColor = 'var(--border)'
                let bg = 'transparent'
                if (answered) {
                  if (i === questions[currentQ].correct) {
                    borderColor = '#10B981'; bg = 'rgba(16,185,129,0.1)'
                  } else if (i === selected && i !== questions[currentQ].correct) {
                    borderColor = '#EF4444'; bg = 'rgba(239,68,68,0.1)'
                  }
                }
                return (
                  <motion.button key={i} onClick={() => handleAnswer(i)}
                    whileHover={!answered ? { scale: 1.01 } : {}}
                    className="w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3"
                    style={{ borderColor, background: bg }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{
                        background: answered && i === questions[currentQ].correct ? '#10B981' : answered && i === selected ? '#EF4444' : 'var(--bg-card)',
                        color: answered && (i === questions[currentQ].correct || i === selected) ? 'white' : 'var(--text-dim)',
                        border: `1px solid ${borderColor}`,
                      }}>
                      {answered && i === questions[currentQ].correct ? '✓' : answered && i === selected ? '✗' : String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{opt}</span>
                  </motion.button>
                )
              })}
            </div>

            {answered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                <div className="p-4 rounded-xl border mb-4"
                  style={{
                    background: selected === questions[currentQ].correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    borderColor: selected === questions[currentQ].correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                  }}>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{questions[currentQ].explanation}</p>
                </div>
                <button onClick={nextQuestion} className="terra-btn w-full py-3 justify-center">
                  {currentQ < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultado'} <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ RESULT PHASE ═══ */}
      {phase === 'result' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="terra-card p-8 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `2px solid ${passed ? '#10B981' : '#EF4444'}`,
              }}>
              {passed ? <CheckCircle size={36} className="text-emerald-400" /> : <AlertCircle size={36} className="text-red-400" />}
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>
              {passed ? '¡Aprobado!' : 'No Aprobado'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
              {passed ? 'Has completado exitosamente la evaluación. Puedes descargar tu certificado.' : 'Necesitas al menos 3 respuestas correctas para aprobar. Vuelve a intentarlo.'}
            </p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <div>
                <div className="text-3xl font-black" style={{ color: passed ? '#10B981' : '#EF4444' }}>{score}/{questions.length}</div>
                <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Correctas</div>
              </div>
              <div className="w-px h-12" style={{ background: 'var(--border)' }} />
              <div>
                <div className="text-3xl font-black" style={{ color: passed ? '#10B981' : '#EF4444' }}>{Math.round((score / questions.length) * 100)}%</div>
                <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Calificación</div>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {answers.map((correct, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm"
                  style={{
                    background: correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                  {correct ? <CheckCircle size={14} className="text-emerald-400" /> : <X size={14} className="text-red-400" />}
                  <span style={{ color: 'var(--text-dim)' }}>Pregunta {i + 1}</span>
                  <span className="ml-auto font-semibold" style={{ color: correct ? '#10B981' : '#EF4444' }}>
                    {correct ? 'Correcta' : 'Incorrecta'}
                  </span>
                </div>
              ))}
            </div>
            {passed ? (
              <button onClick={() => setPhase('certificate')} className="terra-btn w-full py-3 justify-center">
                <Award size={18} /> Ver Certificado
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => router.push('/dashboard/trainings')}
                  className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>Volver</button>
                <button onClick={retryQuiz} className="terra-btn flex-1 py-3 justify-center">
                  <RotateCcw size={16} /> Reintentar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ CERTIFICATE PHASE ═══ */}
      {phase === 'certificate' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="max-w-sm mx-auto">
            <div className="terra-card overflow-hidden">
              {/* Certificate card top */}
              <div className="p-6 text-center"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(168,85,247,0.15))' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #A855F7)' }}>
                  <Award size={26} className="text-white" />
                </div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--amber)' }}>CERTIFICADO DE COMPETENCIA</div>
                <h2 className="text-lg font-black leading-snug" style={{ color: 'var(--text)' }}>
                  {training?.title || 'Capacitación SST'}
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}><User size={12} /> Empleado</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>Admin SST</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}><Calendar size={12} /> Emisión</span>
                    <span style={{ color: 'var(--text)' }}>{new Date().toLocaleDateString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}><Clock size={12} /> Vencimiento</span>
                    <span style={{ color: 'var(--text)' }}>{new Date(Date.now() + 365 * 86400000).toLocaleDateString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}><Shield size={12} /> Código</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text)' }}>{certCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}><CheckCircle size={12} /> Calificación</span>
                    <span className="font-bold" style={{ color: '#10B981' }}>{Math.round((score / questions.length) * 100)}%</span>
                  </div>
                </div>

                {/* QR placeholder */}
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <QrCode size={40} style={{ color: 'var(--text-dim)' }} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => router.push('/dashboard/trainings')}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                    Cerrar
                  </button>
                  <button onClick={() => window.print()}
                    className="terra-btn flex-1 py-2.5 justify-center">
                    <Download size={14} /> Descargar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
