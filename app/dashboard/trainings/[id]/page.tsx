'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CheckCircle, X, Award, Download,
  BookOpen, RotateCcw, AlertCircle, Clock, Loader2, QrCode, Shield,
  User, Calendar, Plus, Trash2, Save, Edit3, FileText
} from 'lucide-react'
import { getCustomQuestions, saveCustomQuestions, type CustomQuestion } from '@/lib/pptx-extractor'
import { generateCertificatePNG } from '@/lib/generate-certificate'
import SignaturePad from '@/components/SignaturePad'

type Phase = 'slides' | 'edit-questions' | 'quiz' | 'result' | 'signing' | 'certificate'
type Question = { q: string; options: string[]; correct: number; explanation: string }

function generateQuestionsFromContent(texts: string[], title: string): Question[] {
  const allText = texts.join(' ').replace(/\s+/g, ' ')
  const questions: Question[] = []
  const used = new Set<number>()

  const sentences = allText
    .replace(/\n/g, '. ')
    .split(/[.;:!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 250 && !/^[\d\s]+$/.test(s))

  const keyFacts = sentences.filter(s =>
    /\b(debe|deben|es|son|se debe|hay que|importante|obligatori|necesari|siempre|nunca|prohibi|requiere|incluye|consiste|significa|permite|evita|previene|protege|garantiza|asegura|según|conforme|establece)\b/i.test(s)
  )

  const definitions = sentences.filter(s =>
    /\b(es un|es una|es el|es la|son los|son las|se define|se entiende|se refiere|se denomina|consiste en|se conoce|significa)\b/i.test(s)
  )

  const procedures = sentences.filter(s =>
    /\b(paso|primero|segundo|antes de|después de|procedimiento|proceso|método|técnica|forma correcta|se realiza|se aplica|se ejecuta|pasos)\b/i.test(s)
  )

  const prohibitions = sentences.filter(s =>
    /\b(no se debe|nunca|prohibi|evitar|no usar|no hacer|no permit|está prohibido|no tocar|no manipular|riesgo|peligro)\b/i.test(s)
  )

  const numbers = sentences.filter(s =>
    /\b(\d+\s*(metros|cm|kg|horas|minutos|segundos|grados|%|por ciento|personas|veces|días|años|resolución|decreto|ley|norma|artículo|NTC))\b/i.test(s)
  )

  function pickUnique(arr: string[]): string | null {
    for (let i = 0; i < arr.length; i++) {
      if (!used.has(i)) { used.add(i); return arr[i] }
    }
    return null
  }

  function truncate(s: string, max: number): string {
    if (s.length <= max) return s
    return s.substring(0, max - 3) + '...'
  }

  function shuffleCorrect(opts: string[], correctIdx: number): { options: string[]; correct: number } {
    const positions = [0, 1, 2, 3]
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }
    const newOpts = positions.map(p => opts[p])
    const newCorrect = positions.indexOf(correctIdx)
    return { options: newOpts, correct: newCorrect }
  }

  // Type 1: Definition questions from actual content
  for (const def of definitions.slice(0, 3)) {
    if (questions.length >= 7) break
    const s = shuffleCorrect([
      truncate(def, 140),
      'Es un procedimiento administrativo sin relación con la seguridad',
      'No tiene una definición específica en la normativa colombiana',
      'Es un concepto que solo aplica en países europeos',
    ], 0)
    questions.push({
      q: `Según la capacitación "${title}", ¿cuál de las siguientes definiciones es correcta?`,
      ...s,
      explanation: `Según el contenido presentado en las diapositivas: "${truncate(def, 200)}"`,
    })
  }

  // Type 2: Key fact questions - what does the content say?
  for (const fact of keyFacts.slice(0, 4)) {
    if (questions.length >= 7) break
    if (definitions.includes(fact)) continue
    const s = shuffleCorrect([
      truncate(fact, 140),
      'No se mencionó ningún requisito específico sobre este tema',
      'Solo aplica para empresas del sector público',
      'Este aspecto fue eliminado de la normativa vigente',
    ], 0)
    questions.push({
      q: `De acuerdo con el contenido de "${title}", ¿qué información se presentó?`,
      ...s,
      explanation: `El contenido de la capacitación indica: "${truncate(fact, 200)}"`,
    })
  }

  // Type 3: Procedure questions
  for (const proc of procedures.slice(0, 2)) {
    if (questions.length >= 7) break
    if (definitions.includes(proc) || keyFacts.includes(proc)) continue
    const s = shuffleCorrect([
      truncate(proc, 140),
      'No existe un procedimiento establecido para esta actividad',
      'El procedimiento es opcional según criterio del trabajador',
      'Se debe consultar únicamente al supervisor sin tomar acción',
    ], 0)
    questions.push({
      q: `¿Cuál es el procedimiento correcto según la capacitación "${title}"?`,
      ...s,
      explanation: `Según las diapositivas: "${truncate(proc, 200)}"`,
    })
  }

  // Type 4: Prohibition/risk questions
  for (const prob of prohibitions.slice(0, 2)) {
    if (questions.length >= 7) break
    const s = shuffleCorrect([
      truncate(prob, 140),
      'No existen restricciones o prohibiciones para esta actividad',
      'Las restricciones solo aplican en jornada nocturna',
      'Las medidas de prevención son opcionales',
    ], 0)
    questions.push({
      q: `Respecto a los riesgos y precauciones en "${title}", ¿qué se indica?`,
      ...s,
      explanation: `Según el contenido: "${truncate(prob, 200)}"`,
    })
  }

  // Type 5: Numeric/normative questions
  for (const num of numbers.slice(0, 2)) {
    if (questions.length >= 7) break
    const s = shuffleCorrect([
      truncate(num, 140),
      'No se establecen valores numéricos específicos',
      'Los valores dependen exclusivamente del criterio del empleador',
      'La normativa no define parámetros medibles para este tema',
    ], 0)
    questions.push({
      q: `¿Qué dato específico se menciona en la capacitación "${title}"?`,
      ...s,
      explanation: `Dato presentado en las diapositivas: "${truncate(num, 200)}"`,
    })
  }

  // Type 6: General comprehension from remaining sentences
  const remaining = sentences.filter(s => !definitions.includes(s) && !keyFacts.includes(s) && !procedures.includes(s) && !prohibitions.includes(s))
  for (const rem of remaining.slice(0, 3)) {
    if (questions.length >= 7) break
    const s = shuffleCorrect([
      truncate(rem, 140),
      'Este tema no fue abordado en la capacitación',
      'La información presentada contradice la normativa vigente',
      'No se proporcionó información relevante sobre este aspecto',
    ], 0)
    questions.push({
      q: `¿Cuál de los siguientes temas fue tratado en "${title}"?`,
      ...s,
      explanation: `En la capacitación se presentó: "${truncate(rem, 200)}"`,
    })
  }

  // If not enough content-based questions, add title-based fallbacks
  if (questions.length < 5) {
    const tl = title.toLowerCase()
    const fallbacks: Question[] = [
      {
        q: `¿Cuál es el objetivo principal de la capacitación "${title}"?`,
        options: [
          `Formar a los trabajadores en prácticas seguras relacionadas con ${tl}`,
          'Cumplir un trámite administrativo sin impacto real',
          'Reducir los costos operativos de la empresa',
          'Reemplazar la experiencia práctica del trabajador',
        ],
        correct: 0,
        explanation: `El objetivo es formar al trabajador para prevenir accidentes y enfermedades laborales en el contexto de ${tl}.`,
      },
      {
        q: `¿Qué debe hacer el trabajador al identificar un riesgo relacionado con "${title}"?`,
        options: [
          'Ignorarlo si no afecta directamente su puesto',
          'Esperar a que el supervisor lo descubra',
          'Reportarlo inmediatamente y tomar medidas preventivas',
          'Documentarlo por escrito pero no informar a nadie',
        ],
        correct: 2,
        explanation: 'Todo trabajador debe reportar inmediatamente condiciones inseguras y tomar medidas preventivas según el SG-SST.',
      },
      {
        q: `Según el SG-SST, ¿quién es responsable de aplicar lo aprendido en "${title}"?`,
        options: [
          'Solo el departamento de seguridad',
          'Únicamente el empleador',
          'Tanto el empleador como el trabajador tienen responsabilidades',
          'Solo los supervisores directos',
        ],
        correct: 2,
        explanation: 'El Decreto 1072 de 2015 establece responsabilidades tanto para el empleador como para el trabajador en materia de SST.',
      },
      {
        q: `¿Cuál es la importancia de la capacitación en "${title}" dentro del SG-SST?`,
        options: [
          'No tiene relevancia si el trabajador tiene experiencia',
          'Es fundamental para la prevención de accidentes y el cumplimiento normativo',
          'Solo es importante para trabajadores nuevos',
          'Es un requisito opcional según la normativa colombiana',
        ],
        correct: 1,
        explanation: 'La capacitación es obligatoria y fundamental dentro del SG-SST para prevenir accidentes y cumplir con el Decreto 1072 de 2015.',
      },
      {
        q: `¿Qué normativa colombiana respalda la obligatoriedad de capacitaciones como "${title}"?`,
        options: [
          'No existe normativa que lo exija',
          'Decreto 1072 de 2015 y Resolución 0312 de 2019',
          'Solo aplican normas internacionales, no colombianas',
          'La Constitución Política únicamente',
        ],
        correct: 1,
        explanation: 'El Decreto 1072 de 2015 y la Resolución 0312 de 2019 establecen los estándares mínimos del SG-SST incluyendo capacitaciones obligatorias.',
      },
      {
        q: `¿Qué consecuencia puede tener no aplicar los conocimientos de "${title}" en el trabajo?`,
        options: [
          'Ninguna, las capacitaciones son solo informativas',
          'Aumento del riesgo de accidentes, enfermedades laborales y sanciones',
          'Solo afecta la evaluación de desempeño',
          'Únicamente genera una amonestación verbal',
        ],
        correct: 1,
        explanation: 'No aplicar las medidas de seguridad aumenta el riesgo de accidentes, enfermedades laborales y puede generar sanciones según la normativa colombiana.',
      },
      {
        q: `¿Con qué frecuencia se deben actualizar los conocimientos sobre "${title}"?`,
        options: [
          'Una sola vez en la vida laboral es suficiente',
          'Solo cuando ocurra un accidente',
          'Periódicamente según el plan anual de capacitación del SG-SST',
          'Cada 10 años',
        ],
        correct: 2,
        explanation: 'Las capacitaciones deben reprogramarse periódicamente según el plan anual del SG-SST y cuando cambien las condiciones de riesgo.',
      },
    ]
    for (const fb of fallbacks) {
      if (questions.length >= 5) break
      questions.push(fb)
    }
  }

  // Shuffle all questions and take 5
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]]
  }

  return questions
}

export default function TrainingDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const courseId = parseInt(params.id as string)

  const userRole = (session?.user as any)?.role
  const isWorker = userRole === 'worker'
  // Workers always go back to Mi Formación; admins to the library
  const backPath = isWorker ? '/dashboard/my-plan' : '/dashboard/trainings'

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

  const passed = questions.length > 0 ? score >= Math.ceil(questions.length * 0.6) : false

  // Question editor state
  const [editQuestions, setEditQuestions] = useState<Question[]>([])
  const [savingQuestions, setSavingQuestions] = useState(false)
  const [hasCustomQuestions, setHasCustomQuestions] = useState(false)
  const emptyQ = (): Question => ({ q: '', options: ['', '', '', ''], correct: 0, explanation: '' })

  const [slideCount, setSlideCount] = useState(0)
  const slideCacheRef = useRef<Record<number, string>>({})
  const fetchingRef = useRef<Record<number, boolean>>({})
  const [currentSlideImage, setCurrentSlideImage] = useState<string | null>(null)
  const [loadingSlide, setLoadingSlide] = useState(false)

  const fetchSlide = async (index: number): Promise<string | null> => {
    if (slideCacheRef.current[index]) return slideCacheRef.current[index]
    if (fetchingRef.current[index]) return null
    fetchingRef.current[index] = true
    try {
      const res = await fetch(`/api/trainings/${courseId}?slide=${index}`)
      if (res.ok) {
        const data = await res.json()
        if (data.image) {
          slideCacheRef.current[index] = data.image
          return data.image
        }
      }
    } catch (_) {}
    finally { fetchingRef.current[index] = false }
    return null
  }

  const showSlide = async (index: number) => {
    const cached = slideCacheRef.current[index]
    if (cached) {
      setCurrentSlideImage(cached)
      setLoadingSlide(false)
    } else {
      setLoadingSlide(true)
      const img = await fetchSlide(index)
      if (img) setCurrentSlideImage(img)
      setLoadingSlide(false)
    }
    // Prefetch neighbors
    const prefetchIndexes = [index + 1, index + 2, index - 1].filter(i => i >= 0 && i < slideCount)
    prefetchIndexes.forEach(i => { if (!slideCacheRef.current[i]) fetchSlide(i) })
  }

  const loadSlide = showSlide

  const goToSlide = (index: number) => {
    if (index < 0 || index >= slideCount || index === currentSlide) return
    const cached = slideCacheRef.current[index]
    if (cached) {
      setCurrentSlideImage(cached)
      setLoadingSlide(false)
    } else {
      setCurrentSlideImage(null)
      setLoadingSlide(true)
    }
    setCurrentSlide(index)
  }

  const loadTraining = async (retries = 0) => {
    try {
      const res = await fetch(`/api/trainings/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setTraining(data.training)
        const count = data.slideCount || 0
        setSlideCount(count)
        setSlides(new Array(count).fill(''))
        const title = data.training?.title || 'Capacitación SST'

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions)
          setEditQuestions(data.questions)
          setHasCustomQuestions(true)
        } else {
          const custom = await getCustomQuestions(courseId)
          if (custom.length > 0) {
            setQuestions(custom)
            setEditQuestions(custom)
            setHasCustomQuestions(true)
          }
        }

        if (count === 0 && data.training?.slides_count > 0 && retries < 3) {
          setTimeout(() => loadTraining(retries + 1), 3000)
          return
        }

        if (count > 0) {
          loadSlide(0)
        }
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    loadTraining()
  }, [courseId])

  // Workers: validate this training is in their assigned enrollments
  useEffect(() => {
    if (!isWorker || !courseId) return
    fetch('/api/enrollments')
      .then(r => r.ok ? r.json() : [])
      .then((enrs: any[]) => {
        const assigned = enrs.some((e: any) => e.trainings?.id === courseId)
        if (!assigned) router.replace('/dashboard/my-plan')
      })
  }, [isWorker, courseId])

  useEffect(() => {
    if (phase === 'slides' && slideCount > 0 && !slideCacheRef.current[currentSlide]) {
      showSlide(currentSlide)
    }
  }, [currentSlide, phase, slideCount])

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

  const [certImage, setCertImage] = useState<string | null>(null)
  const [generatingCert, setGeneratingCert] = useState(false)
  const employeeName = session?.user?.name || ''
  const [employeeCedula, setEmployeeCedula] = useState((session?.user as any)?.cedula || '')
  const [employeeSignature, setEmployeeSignature] = useState<string | null>(null)
  const [savedSignatureLoaded, setSavedSignatureLoaded] = useState(false)

  useEffect(() => {
    if (phase === 'signing' && !savedSignatureLoaded) {
      fetch('/api/signatures')
        .then(r => r.json())
        .then(data => {
          if (data.signature?.signature_data) {
            setEmployeeSignature(data.signature.signature_data)
          }
          setSavedSignatureLoaded(true)
        })
        .catch(() => setSavedSignatureLoaded(true))
    }
  }, [phase, savedSignatureLoaded])
  const certCode = `AVC-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(courseId).padStart(3, '0')}`

  const handleGenerateCert = async () => {
    if (!employeeName.trim() || !employeeCedula.trim() || !employeeSignature) return
    setGeneratingCert(true)
    const durationMap: Record<string, string> = { '2h': '2 horas', '4h': '4 horas', '6h': '6 horas', '8h': '8 horas', '12h': '12 horas', '16h': '16 horas', '20h': '20 horas', '24h': '24 horas', '40h': '40 horas' }
    const dur = training?.duration || '8h'
    const img = await generateCertificatePNG({
      employeeName: employeeName.trim(),
      employeeCedula: employeeCedula.trim(),
      course: training?.title || 'Capacitación SST',
      date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
      duration: durationMap[dur] || dur,
      score: `${Math.round((score / questions.length) * 100)}%`,
      code: certCode,
      employeeSignature: employeeSignature,
      logoUrl: '/images/LOGO.png',
      instructorSignatureUrl: '/images/FIRMA FIRMA.png',
    })
    setCertImage(img)
    setGeneratingCert(false)
    setPhase('certificate')

    try {
      const durationLabel = durationMap[dur] || dur
      const userId = (session?.user as any)?.id
      if (userId) {
        await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            training_id: courseId,
            code: certCode,
            name: employeeName.trim(),
            cedula: employeeCedula.trim(),
            course: training?.title || 'Capacitación SST',
            issued: new Date().toISOString().split('T')[0],
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: durationLabel,
            score: `${Math.round((score / questions.length) * 100)}%`,
          })
        })
      }
    } catch (_) {}
  }

  const downloadCert = () => {
    if (!certImage) return
    const link = document.createElement('a')
    link.download = `Certificado_${(training?.title || 'SST').replace(/\s+/g, '_')}_${certCode}.png`
    link.href = certImage
    link.click()
  }

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

  const now = new Date().toISOString().split('T')[0]
  const isExpired = training?.valid_until && training.valid_until < now
  const notYetValid = training?.valid_from && training.valid_from > now
  const isOutOfRange = isExpired || notYetValid

  if (isOutOfRange) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: `2px solid ${isExpired ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
            <Clock size={36} style={{ color: isExpired ? '#FCA5A5' : '#FCD34D' }} />
          </div>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            {isExpired ? 'Capacitación vencida' : 'Capacitación no disponible aún'}
          </h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>
            {isExpired
              ? `Esta capacitación estuvo disponible hasta el ${training.valid_until}. Ya no es posible realizarla.`
              : `Esta capacitación estará disponible a partir del ${training.valid_from}.`}
          </p>
          {training.valid_from && training.valid_until && (
            <p className="text-xs mb-6" style={{ color: 'var(--text-faint)' }}>
              Período de vigencia: {training.valid_from} → {training.valid_until}
            </p>
          )}
          <button onClick={() => router.push(backPath)}
            className="terra-btn-primary px-6 py-2.5">
            ← {isWorker ? 'Volver a Mi Formación' : 'Volver a capacitaciones'}
          </button>
        </div>
      </div>
    )
  }

  if (slideCount === 0) {
    const isProcessing = (training?.slides_count ?? 0) > 0
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center max-w-md">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-faint)' }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
            {isProcessing ? 'Presentación en preparación' : 'Contenido no disponible'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            {isProcessing
              ? 'La presentación aún está siendo procesada. Por favor regresa en unos minutos.'
              : 'Esta capacitación aún no tiene contenido disponible.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push(backPath)}
              className="terra-btn-outline px-5 py-2.5">
              <ChevronLeft size={16} /> Volver
            </button>
            <button onClick={() => { setLoading(true); loadTraining() }}
              className="terra-btn px-5 py-2.5">
              <RotateCcw size={16} /> Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push(backPath)}
            className="p-2 rounded-xl border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>
              {training?.title || 'Capacitación'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {phase === 'slides' && `Diapositiva ${currentSlide + 1} de ${slideCount}`}
              {phase === 'quiz' && `Evaluación — Pregunta ${currentQ + 1} de ${questions.length}`}
              {phase === 'result' && 'Resultado de la Evaluación'}
              {phase === 'signing' && 'Constancia de Capacitación — Firma del Participante'}
              {phase === 'certificate' && 'Certificado de Capacitación'}
            </p>
          </div>
          {phase === 'slides' && (
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => { if (editQuestions.length === 0) setEditQuestions([emptyQ()]); setPhase('edit-questions') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7' }}>
                <Edit3 size={12} /> {hasCustomQuestions ? 'Editar Preguntas' : 'Crear Preguntas'}
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--amber)', color: 'var(--text)' }}>
                <Clock size={12} /> {training?.duration || '8h'}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {(phase === 'slides' || phase === 'quiz') && (
          <div className="terra-progress-track">
            <motion.div
              className={`terra-progress-fill bg-gradient-to-r ${phase === 'slides' ? 'from-amber-500 to-red-500' : 'from-emerald-500 to-teal-500'}`}
              animate={{ width: `${phase === 'slides' ? ((currentSlide + 1) / slideCount) * 100 : ((currentQ + 1) / questions.length) * 100}%` }}
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
                {loadingSlide && !currentSlideImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando diapositiva...</p>
                  </div>
                ) : (
                  <img
                    src={currentSlideImage || ''}
                    alt={`Diapositiva ${currentSlide + 1}`}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => goToSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-30"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
              <ChevronLeft size={16} /> Anterior
            </button>

            <div className="flex gap-1.5 flex-wrap justify-center max-w-[50%]">
              {slides.map((_, i) => (
                <button key={i} onClick={() => goToSlide(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: i === currentSlide ? 'var(--amber)' : i < currentSlide ? 'rgba(245,158,11,0.4)' : 'var(--border)',
                    transform: i === currentSlide ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {currentSlide < slideCount - 1 ? (
              <button onClick={() => goToSlide(currentSlide + 1)} className="terra-btn px-4 py-2.5">
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { if (editQuestions.length === 0) setEditQuestions([emptyQ()]); setPhase('edit-questions') }}
                  className="sm:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => setPhase('quiz')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
                  Iniciar Evaluación <CheckCircle size={16} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ EDIT QUESTIONS PHASE ═══ */}
      {phase === 'edit-questions' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="terra-card p-6 sm:p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <FileText size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Gestionar Preguntas</h2>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Agrega preguntas de selección múltiple para la evaluación de este curso ({editQuestions.length} preguntas)
                </p>
              </div>
            </div>

            <div className="space-y-6 mb-6 max-h-[60vh] overflow-y-auto pr-2">
              {editQuestions.map((eq, qi) => (
                <div key={qi} className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D' }}>
                      Pregunta {qi + 1}
                    </span>
                    <button onClick={() => setEditQuestions(prev => prev.filter((_, i) => i !== qi))}
                      className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors" title="Eliminar pregunta">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>

                  <textarea
                    value={eq.q}
                    onChange={e => setEditQuestions(prev => prev.map((p, i) => i === qi ? { ...p, q: e.target.value } : p))}
                    placeholder="Escribe la pregunta aquí..."
                    rows={2}
                    className="terra-input resize-none mb-3 text-sm"
                  />

                  <div className="space-y-2 mb-3">
                    {eq.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => setEditQuestions(prev => prev.map((p, i) => i === qi ? { ...p, correct: oi } : p))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                          style={{
                            background: eq.correct === oi ? '#10B981' : 'transparent',
                            border: `2px solid ${eq.correct === oi ? '#10B981' : 'var(--border)'}`,
                            color: eq.correct === oi ? 'white' : 'var(--text-dim)',
                          }}
                          title={eq.correct === oi ? 'Respuesta correcta' : 'Marcar como correcta'}>
                          {String.fromCharCode(65 + oi)}
                        </button>
                        <input
                          value={opt}
                          onChange={e => setEditQuestions(prev => prev.map((p, i) => i === qi ? { ...p, options: p.options.map((o, j) => j === oi ? e.target.value : o) } : p))}
                          placeholder={`Opción ${String.fromCharCode(65 + oi)}...`}
                          className="terra-input text-sm flex-1"
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    value={eq.explanation}
                    onChange={e => setEditQuestions(prev => prev.map((p, i) => i === qi ? { ...p, explanation: e.target.value } : p))}
                    placeholder="Explicación de la respuesta correcta (opcional)"
                    className="terra-input text-xs"
                    style={{ color: 'var(--text-dim)' }}
                  />
                </div>
              ))}
            </div>

            <button onClick={() => setEditQuestions(prev => [...prev, emptyQ()])}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:opacity-80 mb-4 flex items-center justify-center gap-2"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--text-dim)' }}>
              <Plus size={16} /> Agregar Pregunta
            </button>

            <div className="flex gap-3">
              <button onClick={() => setPhase('slides')}
                className="terra-btn-outline flex-1 py-2.5 justify-center text-sm">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const valid = editQuestions.filter(q => q.q.trim() && q.options.every(o => o.trim()))
                  if (valid.length === 0) return
                  setSavingQuestions(true)
                  await fetch('/api/trainings/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ training_id: courseId, questions: valid }),
                  })
                  setQuestions(valid)
                  setHasCustomQuestions(true)
                  setSavingQuestions(false)
                  setPhase('slides')
                }}
                disabled={savingQuestions || editQuestions.filter(q => q.q.trim() && q.options.every(o => o.trim())).length === 0}
                className="terra-btn flex-1 py-2.5 justify-center text-sm disabled:opacity-40">
                {savingQuestions ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar {editQuestions.filter(q => q.q.trim() && q.options.every(o => o.trim())).length} Preguntas</>}
              </button>
            </div>
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
              <button onClick={() => setPhase('signing')} className="terra-btn w-full py-3 justify-center">
                <Award size={18} /> Firmar y Generar Certificado
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => router.push(backPath)}
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

      {/* ═══ SIGNING PHASE ═══ */}
      {phase === 'signing' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="terra-card p-6 sm:p-8 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Award size={18} style={{ color: 'var(--amber)' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Constancia de Capacitación</h2>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Completa tus datos y firma para generar el certificado</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-faint)' }}>Participante</div>
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  <User size={14} className="inline mr-1.5" style={{ color: '#10B981' }} />
                  {employeeName || 'Sin sesión activa'}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Número de cédula *</label>
                <input value={employeeCedula} onChange={e => setEmployeeCedula(e.target.value)}
                  placeholder="Ej: 1.234.567.890"
                  className="terra-input" />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-dim)' }}>Firma del participante *</label>
              {employeeSignature ? (
                <div>
                  <div className="p-3 rounded-xl bg-white border" style={{ borderColor: 'var(--border)' }}>
                    <img src={employeeSignature} alt="Firma" className="h-20 mx-auto" />
                  </div>
                  <button onClick={() => setEmployeeSignature(null)}
                    className="text-xs mt-2 font-semibold transition-colors" style={{ color: 'var(--amber)' }}>
                    Volver a firmar
                  </button>
                </div>
              ) : (
                <SignaturePad onSave={(sig) => setEmployeeSignature(sig)} />
              )}
            </div>

            <div className="p-3 rounded-xl mb-6 text-xs"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--text-dim)' }}>
              📋 Al firmar, confirmas tu asistencia y participación en la capacitación <strong style={{ color: 'var(--text)' }}>{training?.title}</strong>.
              Esta constancia se registra para los indicadores del SG-SST conforme al Decreto 1072 de 2015.
            </div>

            <button onClick={handleGenerateCert}
              disabled={!employeeName || !employeeCedula.trim() || !employeeSignature || generatingCert}
              className="terra-btn w-full py-3 justify-center disabled:opacity-40">
              {generatingCert
                ? <><Loader2 size={18} className="animate-spin" /> Generando Certificado...</>
                : <><Award size={18} /> Generar Certificado</>
              }
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ CERTIFICATE PHASE ═══ */}
      {phase === 'certificate' && certImage && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="max-w-7xl mx-auto">
            <div className="terra-card overflow-hidden p-2">
              <img src={certImage} alt="Certificado" className="w-full rounded-lg" />
            </div>
            <div className="flex gap-3 mt-4 max-w-md mx-auto">
              <button onClick={() => router.push(backPath)}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                Volver a Cursos
              </button>
              <button onClick={downloadCert} className="terra-btn flex-1 py-3 justify-center">
                <Download size={16} /> Descargar Certificado
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
