'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CheckCircle, X, Award, Download,
  BookOpen, RotateCcw, AlertCircle, Clock, Loader2
} from 'lucide-react'
import { getSlides } from '@/lib/pptx-extractor'

type Phase = 'slides' | 'quiz' | 'result' | 'certificate'

function generateQuestions(title: string) {
  return [
    {
      q: `¿Cuál es el objetivo principal de la capacitación "${title}"?`,
      options: [
        'Cumplir con la normativa vigente y proteger la salud de los trabajadores',
        'Reducir costos operativos de la empresa',
        'Aumentar la producción mensual',
        'Obtener beneficios tributarios',
      ],
      correct: 0,
      explanation: 'El objetivo principal es cumplir con la normativa de SST y garantizar la seguridad y salud de los trabajadores.',
    },
    {
      q: '¿Qué decreto reglamenta el Sistema de Gestión de SST en Colombia?',
      options: [
        'Decreto 2400 de 1979',
        'Decreto 1072 de 2015',
        'Decreto 614 de 1984',
        'Decreto 1295 de 1994',
      ],
      correct: 1,
      explanation: 'El Decreto 1072 de 2015 (Decreto Único Reglamentario del Sector Trabajo) establece el SG-SST.',
    },
    {
      q: '¿Qué resolución define los estándares mínimos del SG-SST?',
      options: [
        'Resolución 1016 de 1989',
        'Resolución 2400 de 1979',
        'Resolución 0312 de 2019',
        'Resolución 1409 de 2012',
      ],
      correct: 2,
      explanation: 'La Resolución 0312 de 2019 establece los estándares mínimos del SG-SST según el tamaño y riesgo de la empresa.',
    },
    {
      q: '¿Cuál es la responsabilidad del trabajador frente al SST?',
      options: [
        'Solo asistir a las capacitaciones programadas',
        'Participar activamente, reportar condiciones inseguras y usar EPP',
        'Únicamente firmar los documentos requeridos',
        'Delegar su seguridad al coordinador SST',
      ],
      correct: 1,
      explanation: 'El trabajador debe participar activamente, reportar peligros, usar EPP y cumplir las normas de seguridad.',
    },
    {
      q: '¿Qué se debe hacer ante un accidente de trabajo?',
      options: [
        'Esperar al siguiente día hábil para reportarlo',
        'Reportarlo inmediatamente a la ARL y al empleador',
        'Solo informar al jefe directo verbalmente',
        'No reportarlo si no es grave',
      ],
      correct: 1,
      explanation: 'Todo accidente de trabajo debe reportarse inmediatamente a la ARL y al empleador, según el Decreto 1072 de 2015.',
    },
  ]
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

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])

  const questions = generateQuestions(training?.title || 'Capacitación SST')
  const passed = score >= 3

  useEffect(() => {
    async function load() {
      // Load training data from localStorage
      const saved = localStorage.getItem('sst-trainings')
      if (saved) {
        const all = JSON.parse(saved)
        const found = all.find((t: any) => t.id === courseId)
        if (found) setTraining(found)
      }

      // Load slides from IndexedDB
      try {
        const imgs = await getSlides(courseId)
        setSlides(imgs)
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

  const certRef = useRef<HTMLDivElement>(null)

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
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--amber)', color: 'var(--text)' }}>
                <Clock size={12} /> {training?.duration || '8h'}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {phase === 'slides' && (
          <div className="terra-progress-track">
            <motion.div
              className="terra-progress-fill bg-gradient-to-r from-amber-500 to-red-500"
              animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        {phase === 'quiz' && (
          <div className="terra-progress-track">
            <motion.div
              className="terra-progress-fill bg-gradient-to-r from-emerald-500 to-teal-500"
              animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
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

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-30"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
              <ChevronLeft size={16} /> Anterior
            </button>

            <div className="flex gap-1.5">
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
              <button
                onClick={() => setCurrentSlide(s => s + 1)}
                className="terra-btn px-4 py-2.5">
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => setPhase('quiz')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
                Iniciar Evaluación <CheckCircle size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ QUIZ PHASE ═══ */}
      {phase === 'quiz' && (
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
                    borderColor = '#10B981'
                    bg = 'rgba(16,185,129,0.1)'
                  } else if (i === selected && i !== questions[currentQ].correct) {
                    borderColor = '#EF4444'
                    bg = 'rgba(239,68,68,0.1)'
                  }
                } else if (i === selected) {
                  borderColor = 'var(--amber)'
                  bg = 'rgba(245,158,11,0.08)'
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(i)}
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
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    {questions[currentQ].explanation}
                  </p>
                </div>
                <button onClick={nextQuestion} className="terra-btn w-full py-3 justify-center">
                  {currentQ < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultado'}
                  <ChevronRight size={16} />
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
              {passed
                ? <CheckCircle size={36} className="text-emerald-400" />
                : <AlertCircle size={36} className="text-red-400" />
              }
            </div>

            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>
              {passed ? '¡Aprobado!' : 'No Aprobado'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
              {passed
                ? 'Has completado exitosamente la evaluación. Puedes descargar tu certificado.'
                : 'Necesitas al menos 3 respuestas correctas para aprobar. Vuelve a intentarlo.'
              }
            </p>

            <div className="flex items-center justify-center gap-6 mb-6">
              <div>
                <div className="text-3xl font-black" style={{ color: passed ? '#10B981' : '#EF4444' }}>
                  {score}/{questions.length}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Respuestas correctas</div>
              </div>
              <div className="w-px h-12" style={{ background: 'var(--border)' }} />
              <div>
                <div className="text-3xl font-black" style={{ color: passed ? '#10B981' : '#EF4444' }}>
                  {Math.round((score / questions.length) * 100)}%
                </div>
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
                  {correct
                    ? <CheckCircle size={14} className="text-emerald-400" />
                    : <X size={14} className="text-red-400" />
                  }
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
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                  Volver
                </button>
                <button onClick={retryQuiz}
                  className="terra-btn flex-1 py-3 justify-center">
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
          <div ref={certRef} className="terra-card overflow-hidden max-w-2xl mx-auto">
            {/* Certificate header */}
            <div className="p-8 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
                <Award size={30} className="text-white" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--amber)' }}>
                Certificado de Competencia
              </div>
              <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>
                {training?.title || 'Capacitación SST'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Sistema de Gestión de Seguridad y Salud en el Trabajo
              </p>
            </div>

            {/* Certificate body */}
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>Se certifica que</p>
                <p className="text-xl font-black" style={{ color: 'var(--text)' }}>Admin SST</p>
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>admin@jimmyacademy.com</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Fecha de emisión', value: new Date().toLocaleDateString('es-CO') },
                  { label: 'Fecha de vencimiento', value: new Date(Date.now() + 365 * 86400000).toLocaleDateString('es-CO') },
                  { label: 'Calificación', value: `${Math.round((score / questions.length) * 100)}%` },
                  { label: 'Código', value: `CERT-${courseId}-${Date.now().toString(36).toUpperCase()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>{label}</div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl text-center text-xs mb-6"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
                ✓ Este certificado acredita la competencia del participante en el tema evaluado, conforme al Decreto 1072 de 2015 y la Resolución 0312 de 2019.
              </div>

              <div className="flex gap-3">
                <button onClick={() => router.push('/dashboard/trainings')}
                  className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                  Volver a Cursos
                </button>
                <button onClick={() => {
                  if (typeof window !== 'undefined') window.print()
                }} className="terra-btn flex-1 py-3 justify-center">
                  <Download size={16} /> Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
