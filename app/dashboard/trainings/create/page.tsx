'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Upload, FileText, X, ChevronRight, ChevronLeft,
  CheckCircle, Award, Download, Shield, QrCode, RotateCcw,
  Layers, AlertTriangle, BookOpen, Play, Sparkles, Brain,
  FileUp, Type, Loader2, ArrowLeft
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type SlideType = 'cover' | 'info' | 'legal' | 'steps' | 'list' | 'danger' | 'summary'
type Slide = {
  type: SlideType; icon: string; title: string; subtitle?: string; body?: string
  norm?: string; points?: string[]; items?: { title: string; desc: string; color: string }[]
  risks?: { level: 'ALTO' | 'MEDIO' | 'BAJO'; item: string }[]; steps?: string[]
  highlight?: string; image?: string
}
type Question = { q: string; options: string[]; correct: number; explanation: string }
type GeneratedTraining = {
  title: string; category: string; duration: string; objective: string
  norm?: string; color: string; slides: Slide[]; quiz: Question[]
}

// ─── Image picker por palabras clave ─────────────────────────────────────────
const IMAGE_MAP: { keywords: string[]; url: string }[] = [
  { keywords: ['altura', 'alturas', 'andamio', 'escalera', 'tejado', 'techo', 'tower'], url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80' },
  { keywords: ['fuego', 'incendio', 'extintor', 'contra incendio', 'llama', 'flama'], url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=700&q=80' },
  { keywords: ['eléctric', 'electric', 'tablero', 'corriente', 'voltio', 'loto', 'lock'], url: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=700&q=80' },
  { keywords: ['epp', 'protección', 'casco', 'arnés', 'guante', 'gafas', 'equipo protec'], url: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=700&q=80' },
  { keywords: ['primeros auxilios', 'emergencia médica', 'rcp', 'herida', 'botiquín', 'ambulancia'], url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&q=80' },
  { keywords: ['copasst', 'comité', 'reunión', 'paritario', 'equipo', 'meeting'], url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80' },
  { keywords: ['minería', 'mina', 'sostenimiento', 'galería', 'puntales', 'arcos'], url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=700&q=80' },
  { keywords: ['química', 'químico', 'sustancias', 'laboratorio', 'reactivo', 'derrame'], url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=700&q=80' },
  { keywords: ['vial', 'tránsito', 'vehiculo', 'conductor', 'manejo', 'transporte'], url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=700&q=80' },
  { keywords: ['ergonomía', 'biomecánico', 'postura', 'levantamiento', 'carga', 'espalda'], url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=80' },
  { keywords: ['legal', 'norma', 'normativa', 'marco', 'decreto', 'resolución', 'ley'], url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&q=80' },
  { keywords: ['riesgo', 'peligro', 'accidente', 'incidente', 'señal', 'advertencia'], url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80' },
  { keywords: ['procedimiento', 'paso', 'proceso', 'instrucción', 'checklist'], url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=80' },
  { keywords: ['resumen', 'conclusión', 'objetivo', 'meta', 'logro', 'clave', 'punto'], url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80' },
  { keywords: ['trabajo', 'trabajador', 'empleado', 'operario', 'obrero', 'industrial'], url: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=700&q=80' },
  { keywords: ['construcción', 'obra', 'edificio', 'estructura', 'concreto', 'ciment'], url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80' },
  { keywords: ['salud', 'medicina', 'médico', 'enfermedad', 'ocupacional', 'bienestar'], url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&q=80' },
  { keywords: ['capacitación', 'formación', 'entrenamiento', 'aprendizaje', 'educación'], url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80' },
]

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=700&q=80',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&q=80',
]

function pickImage(slide: Slide, idx: number): string {
  if (slide.image) return slide.image
  const text = (slide.title + ' ' + (slide.subtitle ?? '') + ' ' + (slide.body ?? '')).toLowerCase()
  for (const { keywords, url } of IMAGE_MAP) {
    if (keywords.some(k => text.includes(k))) return url
  }
  return DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length]
}

// ─── Slide Renderer ───────────────────────────────────────────────────────────
function SlideView({ slide, idx }: { slide: Slide; idx: number }) {
  const img = pickImage(slide, idx)
  const riskColor = (l: string) =>
    l === 'ALTO' ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' :
    l === 'MEDIO' ? 'bg-orange-500/15 border-orange-500/30 text-orange-300' :
    'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'

  // ── COVER ──────────────────────────────────────────────────────────────────
  if (slide.type === 'cover') return (
    <div className="relative h-full flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl">
      <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      <div className="relative z-10 px-6 max-w-2xl">
        <div className="text-7xl mb-4 drop-shadow-2xl">{slide.icon}</div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight drop-shadow-lg">{slide.title}</h1>
        {slide.subtitle && <p className="text-blue-300 text-lg font-semibold mb-3">{slide.subtitle}</p>}
        {slide.body && <p className="text-slate-300 text-sm bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 inline-block">{slide.body}</p>}
      </div>
    </div>
  )

  // ── ALL OTHER TYPES ────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-[#0D1629] border border-white/8">

      {/* Image panel */}
      <div className="relative lg:w-[38%] h-44 lg:h-full flex-shrink-0 overflow-hidden">
        <img src={img} alt={slide.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D1629] lg:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0D1629] hidden lg:block" />
        {/* Icon badge */}
        <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl">
          {slide.icon}
        </div>
        {/* Type label */}
        <div className="absolute bottom-3 left-3 lg:hidden">
          <span className="text-xs font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
            {slide.title}
          </span>
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
        {slide.norm && (
          <div className="flex items-center gap-2 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 flex-shrink-0">
            <Shield size={12} className="text-blue-400 flex-shrink-0" />
            <span className="text-blue-300 text-xs font-semibold">{slide.norm}</span>
          </div>
        )}
        <h2 className="text-white font-black text-lg sm:text-xl leading-tight mb-4">{slide.title}</h2>

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
              <div className="mt-3 bg-amber-400/10 border border-amber-400/25 rounded-xl p-3">
                <p className="text-amber-200 text-sm font-medium" dangerouslySetInnerHTML={{ __html: slide.highlight }} />
              </div>
            )}
          </div>
        )}

        {slide.type === 'list' && (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {slide.items?.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                className="bg-white/[0.04] border border-white/8 rounded-xl p-3.5">
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
                <span className="text-xs font-black w-12 text-center flex-shrink-0 px-1 py-0.5 rounded bg-current/20">{r.level}</span>
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
              <div className="mt-3 bg-amber-400/10 border border-amber-400/25 rounded-xl p-3">
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
    setSelected(i); const a = [...answers]; a[current] = i; setAnswers(a)
  }
  const next = () => {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(answers[current + 1]) }
    else { const c = answers.filter((a, i) => a === questions[i].correct).length; onFinish(Math.round((c / questions.length) * 100)) }
  }

  return (
    <div className="flex flex-col p-5 sm:p-6 max-w-2xl mx-auto w-full h-full">
      <div className="mb-5 flex-shrink-0">
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
          const show = selected !== null; const isCorrect = i === q.correct; const isSel = selected === i
          return (
            <motion.button key={i} onClick={() => choose(i)} whileTap={{ scale: 0.99 }}
              className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all ${
                !show ? 'border-white/8 bg-white/[0.03] text-slate-300 hover:border-blue-500/40 hover:bg-blue-500/5'
                : isCorrect ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                : isSel ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                : 'border-white/5 bg-white/[0.02] text-slate-600'}`}>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-black flex-shrink-0 ${!show ? 'border-white/20 text-slate-400' : isCorrect ? 'border-emerald-400 text-emerald-400' : isSel ? 'border-rose-400 text-rose-400' : 'border-white/10 text-slate-600'}`}>{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{opt}</span>
                {show && isCorrect && <CheckCircle size={14} className="text-emerald-400" />}
                {show && isSel && !isCorrect && <X size={14} className="text-rose-400" />}
              </div>
            </motion.button>
          )
        })}
      </div>
      {selected !== null && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3 flex-shrink-0">
          <p className="text-blue-300 text-xs leading-relaxed">💡 {q.explanation}</p>
        </motion.div>
      )}
      <button onClick={next} disabled={selected === null}
        className="mt-4 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2 flex-shrink-0">
        {current === questions.length - 1 ? <><Award size={14} /> Ver resultado</> : <>Siguiente <ChevronRight size={14} /></>}
      </button>
    </div>
  )
}

// ─── Certificate ──────────────────────────────────────────────────────────────
function Certificate({ training, score, userName, onRetry }: { training: GeneratedTraining; score: number; userName: string; onRetry: () => void }) {
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
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <div id="certificate-content" className="bg-gradient-to-br from-[#0D1629] to-[#0f1f3a] border-2 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-700 to-violet-700 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3">
              <Award size={32} className="text-white" />
            </div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Jimmy Academy · SG-SST Colombia</p>
            <h2 className="text-white font-black text-xl">Certificado de Competencia</h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-slate-400 text-sm mb-1">Se certifica que</p>
            <h3 className="text-white font-black text-2xl mb-1">{userName}</h3>
            <p className="text-slate-400 text-sm mb-4">completó satisfactoriamente la capacitación en</p>
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-4 mb-4">
              <p className="text-blue-200 font-bold text-base leading-snug">{training.title}</p>
              {training.norm && <p className="text-slate-400 text-xs mt-1">{training.norm}</p>}
              <div className="mt-2">
                <span className="text-yellow-400 font-bold">Calificación: {score}% ✓</span>
                <span className="text-slate-500 text-xs ml-3">· {training.duration}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4 text-left">
              {[
                { label: 'Fecha de emisión', value: today },
                { label: 'Válido hasta', value: expires },
                { label: 'Código único', value: code },
                { label: 'Verificación QR', value: 'scan' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl p-2.5">
                  <p className="text-slate-500 text-[10px] mb-0.5">{label}</p>
                  {value === 'scan' ? <QrCode size={28} className="text-slate-400" /> : <p className="text-white text-xs font-semibold">{value}</p>}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-5">
              <Shield size={12} className="text-emerald-400" />
              <p className="text-emerald-400 text-xs font-semibold">Decreto 1072/2015 · Resolución 0312/2019 · SG-SST Colombia</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={onRetry} className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-sm font-semibold transition-all">
                Nueva eval.
              </button>
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

// ─── Processing Steps ─────────────────────────────────────────────────────────
const STEPS = [
  { icon: '🔍', text: 'Analizando el contenido...' },
  { icon: '📚', text: 'Identificando objetivos de aprendizaje...' },
  { icon: '⚖️', text: 'Detectando normativa aplicable...' },
  { icon: '🎨', text: 'Diseñando diapositivas profesionales...' },
  { icon: '📝', text: 'Generando evaluación alineada al contenido...' },
  { icon: '🏆', text: 'Preparando certificado de aprobación...' },
  { icon: '✅', text: 'Capacitación lista. ¡Todo listo!' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateTrainingPage() {
  const router = useRouter()

  // Input state
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  const [textContent, setTextContent] = useState('')
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('Intermedio')
  const [numSlides, setNumSlides] = useState('10')
  const [userName, setUserName] = useState('Admin SST')
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Processing state
  const [phase, setPhase] = useState<'input' | 'processing' | 'viewer' | 'quiz' | 'certificate'>('input')
  const [processingStep, setProcessingStep] = useState(0)
  const [error, setError] = useState('')

  // Training state
  const [training, setTraining] = useState<GeneratedTraining | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [finalScore, setFinalScore] = useState(0)

  // File drag
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    setFileContent(text.slice(0, 8000))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const generate = async () => {
    const content = inputMode === 'text' ? textContent : fileContent
    if (!content && !topic) { setError('Ingresa un tema o pega el contenido del documento'); return }
    setError(''); setPhase('processing'); setProcessingStep(0)

    // Animate steps
    for (let i = 0; i < STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 900))
      setProcessingStep(i + 1)
    }

    try {
      const res = await fetch('/api/generate-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content || undefined, topic: topic || undefined, level, numSlides: parseInt(numSlides) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error generando capacitación')
      setTraining(data.training)
      setProcessingStep(STEPS.length - 1)
      await new Promise(r => setTimeout(r, 800))
      setCurrentSlide(0)
      setPhase('viewer')
    } catch (err: any) {
      setError(err.message)
      setPhase('input')
    }
  }

  const isLast = training ? currentSlide === training.slides.length - 1 : false

  // ── INPUT SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'input') return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={15} /> Volver a Capacitaciones
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Generar Capacitación con IA</h1>
            <p className="text-slate-400 text-sm">Pega un texto, sube un documento o escribe un tema — la IA hace el resto</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Mode toggle */}
          <div className="flex gap-2 bg-white/5 border border-white/8 rounded-xl p-1">
            {[{ id: 'text', icon: Type, label: 'Texto / Tema' }, { id: 'file', icon: FileUp, label: 'Subir Archivo' }].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setInputMode(id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${inputMode === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {inputMode === 'text' ? (
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Tema de la capacitación</label>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Ej: Manejo de sustancias químicas peligrosas, Seguridad vial, Riesgo biomecánico..."
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">O pega el contenido del documento</label>
                <textarea value={textContent} onChange={e => setTextContent(e.target.value)} rows={8}
                  placeholder="Pega aquí el contenido de tu procedimiento, reglamento, manual, normativa, ATS, PETS, investigación de accidente o cualquier documento técnico...

La IA analizará el contenido y generará automáticamente la capacitación completa con diapositivas, evaluación y certificado."
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-violet-500/50 transition-all resize-none leading-relaxed" />
              </div>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? 'border-violet-500/60 bg-violet-500/5' : 'border-white/12 hover:border-violet-500/40 hover:bg-white/[0.02]'}`}>
              <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.doc,.pptx,.xlsx,.csv" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {fileName ? (
                <div>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-white font-semibold mb-1">{fileName}</p>
                  <p className="text-emerald-400 text-sm">Archivo cargado · {Math.round(fileContent.length / 1000)}K caracteres</p>
                  <button onClick={e => { e.stopPropagation(); setFileName(''); setFileContent('') }}
                    className="mt-2 text-slate-500 hover:text-rose-400 text-xs transition-colors">Cambiar archivo</button>
                </div>
              ) : (
                <div>
                  <FileUp size={36} className="text-slate-500 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-1">Arrastra o haz clic para subir</p>
                  <p className="text-slate-500 text-sm">PDF, Word (.docx), PowerPoint, Excel, TXT</p>
                  <p className="text-slate-600 text-xs mt-2">Procedimientos SST · Manuales · ATS · PETS · Normativas · Investigaciones de accidentes</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Config panel */}
        <div className="space-y-4">
          <div className="bg-[#0D1629] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <Sparkles size={15} className="text-violet-400" /> Configuración
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Nivel de complejidad</label>
                <select value={level} onChange={e => setLevel(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all">
                  {['Básico', 'Intermedio', 'Avanzado'].map(l => <option key={l} className="bg-[#0D1629]">{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">N° de diapositivas</label>
                <select value={numSlides} onChange={e => setNumSlides(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all">
                  {['8', '10', '12', '14'].map(n => <option key={n} className="bg-[#0D1629]">{n} diapositivas</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Nombre del participante</label>
                <input value={userName} onChange={e => setUserName(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-4">
            <p className="text-violet-300 text-xs font-bold mb-2">✨ La IA generará automáticamente:</p>
            {['Diapositivas con contenido organizado', 'Imágenes y diseño profesional', 'Normativa colombiana vigente', 'Evaluación alineada al contenido', 'Certificado con código QR'].map(item => (
              <div key={item} className="flex items-center gap-2 mb-1.5">
                <CheckCircle size={11} className="text-violet-400 flex-shrink-0" />
                <span className="text-slate-400 text-xs">{item}</span>
              </div>
            ))}
          </div>

          <button onClick={generate} disabled={!textContent && !topic && !fileContent}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm transition-all shadow-lg shadow-violet-600/20">
            <Zap size={18} /> Generar Capacitación
          </button>
        </div>
      </div>
    </div>
  )

  // ── PROCESSING SCREEN ─────────────────────────────────────────────────────
  if (phase === 'processing') return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-600/30">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Zap size={36} className="text-white" />
          </motion.div>
        </div>
        <h2 className="text-white font-black text-2xl mb-2">Generando capacitación</h2>
        <p className="text-slate-400 text-sm mb-8">La IA está procesando el contenido...</p>

        <div className="space-y-3 text-left mb-8">
          {STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: i <= processingStep ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${i === processingStep ? 'bg-violet-500/15 border border-violet-500/30' : i < processingStep ? 'bg-white/[0.03]' : ''}`}>
              <span className="text-lg">{step.icon}</span>
              <span className={`text-sm ${i === processingStep ? 'text-violet-200 font-semibold' : i < processingStep ? 'text-emerald-400' : 'text-slate-600'}`}>
                {step.text}
              </span>
              {i < processingStep && <CheckCircle size={14} className="text-emerald-400 ml-auto" />}
              {i === processingStep && <Loader2 size={14} className="text-violet-400 ml-auto animate-spin" />}
            </motion.div>
          ))}
        </div>

        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${Math.round((processingStep / (STEPS.length - 1)) * 100)}%` }}
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" />
        </div>
      </motion.div>
    </div>
  )

  if (!training) return null

  // ── VIEWER ────────────────────────────────────────────────────────────────
  if (phase === 'viewer') return (
    <div className="flex flex-col h-screen bg-[#0A0F1E] overflow-hidden">
      <div className="flex items-center justify-between px-4 h-14 bg-[#0D1629]/90 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('input')} className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <ChevronLeft size={15} />
          </button>
          <div>
            <p className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-sm">{training.title}</p>
            <p className="text-slate-500 text-xs">{currentSlide + 1}/{training.slides.length} · {training.duration}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-slate-500">{training.category}</span>
          <div className="w-20 h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.round(((currentSlide + 1) / training.slides.length) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="h-full p-3 sm:p-5">
            <SlideView slide={training.slides[currentSlide]} idx={currentSlide} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-4 h-16 bg-[#0D1629]/90 border-t border-white/8 flex-shrink-0">
        <button onClick={() => currentSlide > 0 && setCurrentSlide(c => c - 1)} disabled={currentSlide === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/8 text-slate-400 hover:text-white disabled:opacity-30 text-sm font-semibold transition-all">
          <ChevronLeft size={15} /> Anterior
        </button>
        <div className="hidden sm:flex gap-1">
          {training.slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all ${i === currentSlide ? 'w-4 h-2 bg-blue-400' : 'w-2 h-2 bg-white/15 hover:bg-white/30'}`} />
          ))}
        </div>
        <button onClick={() => isLast ? setPhase('quiz') : setCurrentSlide(c => c + 1)}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all text-white ${isLast ? 'bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg' : 'bg-blue-600 hover:bg-blue-500'}`}>
          {isLast ? <><Award size={14} /> Ir a Evaluación</> : <>Siguiente <ChevronRight size={15} /></>}
        </button>
      </div>
    </div>
  )

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  if (phase === 'quiz') return (
    <div className="flex flex-col h-screen bg-[#0A0F1E] overflow-hidden">
      <div className="flex items-center justify-between px-4 h-14 bg-[#0D1629]/90 border-b border-white/8 flex-shrink-0">
        <button onClick={() => setPhase('viewer')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ChevronLeft size={15} /> Volver a diapositivas
        </button>
        <span className="text-white font-bold text-sm">Evaluación Final</span>
        <div />
      </div>
      <div className="flex-1 overflow-y-auto">
        <QuizSection questions={training.quiz} onFinish={(s) => { setFinalScore(s); setPhase('certificate') }} />
      </div>
    </div>
  )

  // ── CERTIFICATE ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0A0F1E] overflow-hidden">
      <div className="flex items-center justify-between px-4 h-14 bg-[#0D1629]/90 border-b border-white/8 flex-shrink-0">
        <button onClick={() => setPhase('quiz')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ChevronLeft size={15} /> Evaluación
        </button>
        <span className="text-white font-bold text-sm">Certificado</span>
        <div />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Certificate training={training} score={finalScore} userName={userName} onRetry={() => setPhase('quiz')} />
      </div>
    </div>
  )
}
