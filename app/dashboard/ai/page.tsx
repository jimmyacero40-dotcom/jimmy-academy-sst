'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Send, Sparkles, AlertCircle, TrendingUp,
  Users, BookOpen, Shield, Lightbulb, RotateCcw
} from 'lucide-react'

type Message = { role: 'user' | 'ai'; text: string; time: string }

const SUGGESTIONS = [
  '¿Qué empleados tienen certificados por vencer?',
  '¿Cómo mejorar el cumplimiento en Producción?',
  '¿Cuáles son los riesgos más frecuentes en Colombia?',
  'Genera un plan de capacitaciones para Q1 2026',
]

const AI_RESPONSES: Record<string, string> = {
  default: 'Como asistente IA especializado en SG-SST, puedo ayudarte a analizar riesgos, planificar capacitaciones, revisar cumplimiento normativo según el Decreto 1072 de 2015 y la Resolución 0312 de 2019. ¿En qué puedo ayudarte hoy?',
  certificados: '**Certificados por vencer en los próximos 60 días:**\n\n• Laura Herrera – Manejo de Extintores (vence 15 Jun 2026)\n• Andrés Castro – EPP y Equipos (vence 20 Mar 2026)\n\n**Recomendación:** Programar renovación de certificados antes del 20 de febrero. Considera un taller grupal para optimizar recursos.',
  cumplimiento: '**Análisis de Producción:**\n\nEl área tiene un cumplimiento del 91%, por debajo del promedio empresa (94%).\n\n**Hallazgos principales:**\n• 3 operarios sin completar capacitación de Trabajo en Alturas\n• EPP incompleto reportado en auditoría reciente\n\n**Plan de acción sugerido:**\n1. Reprogramar capacitación alturas para semana del 20 Ene\n2. Verificar dotación EPP con RRHH\n3. Seguimiento semanal por supervisor de área',
  riesgos: '**Riesgos más frecuentes en empresas colombianas (Sector industrial):**\n\n🔴 **Críticos:**\n• Trabajo en alturas (mayor causa de mortalidad laboral)\n• Riesgo eléctrico\n\n🟡 **Moderados:**\n• Ruido industrial\n• Manipulación manual de cargas\n• Sustancias químicas\n\n**Normativa aplicable:** Resolución 1409/2012 (alturas), NTC 2050 (eléctrico), GTC 45 (metodología de riesgo)',
  plan: '**Plan de Capacitaciones Q1 2026 – Propuesta IA:**\n\n**Enero (urgente):**\n• Renovación Primeros Auxilios – 30 empleados\n• Inducción SST nuevos ingresos – 5 personas\n\n**Febrero:**\n• Trabajo en Alturas N1 – Área producción\n• COPASST – Actualización anual\n\n**Marzo:**\n• EPP avanzado\n• Gestión de emergencias\n\n**Costo estimado:** $4.2M COP\n**Horas totales:** 96h\n**Cumplimiento proyectado:** 98%',
}

function getAIResponse(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('certif') || lower.includes('vencer')) return AI_RESPONSES.certificados
  if (lower.includes('cumplimiento') || lower.includes('producción') || lower.includes('produccion')) return AI_RESPONSES.cumplimiento
  if (lower.includes('riesgo') || lower.includes('frecuente')) return AI_RESPONSES.riesgos
  if (lower.includes('plan') || lower.includes('capacitacion') || lower.includes('capacitación')) return AI_RESPONSES.plan
  return AI_RESPONSES.default
}

const INSIGHTS = [
  { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', title: 'Alerta de vencimiento', desc: '2 certificados vencen en los próximos 30 días', action: 'Ver certificados' },
  { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', title: 'Tendencia positiva', desc: 'Cumplimiento SST aumentó 6% en los últimos 3 meses', action: 'Ver reportes' },
  { icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', title: 'Capacitación urgente', desc: '12 empleados de Primeros Auxilios pendientes de recertificación', action: 'Ver usuarios' },
  { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', title: 'Sugerencia IA', desc: 'Agrupa las 3 capacitaciones pendientes en un solo taller para ahorrar 40%', action: 'Ver plan' },
]

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: bold }} />
  })
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: AI_RESPONSES.default, time: 'Ahora' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text: string) => {
    if (!text.trim() || loading) return
    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role: 'user', text, time: now }])
    setInput('')
    setLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: getAIResponse(text), time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }])
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-full flex flex-col">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">IA SST</h1>
            <p className="text-slate-400 text-sm">Asistente inteligente para gestión de seguridad y salud en el trabajo</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5 flex-1 min-h-0">

        {/* Chat */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 flex flex-col bg-[#0D1629] border border-white/8 rounded-2xl overflow-hidden" style={{ minHeight: 400 }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Brain size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user'
                    ? 'bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-sm'
                    : 'bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm'
                  } px-4 py-3`}>
                    <div className={`text-sm space-y-1 ${msg.role === 'ai' ? 'text-slate-200' : 'text-white'}`}>
                      {renderText(msg.text)}
                    </div>
                    <div className="text-slate-600 text-[10px] mt-1.5">{msg.time}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Brain size={14} className="text-white" />
                </div>
                <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map(j => (
                      <motion.div key={j} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="flex-shrink-0 text-xs text-cyan-400 border border-cyan-400/20 bg-cyan-400/5 hover:bg-cyan-400/10 px-3 py-1.5 rounded-lg transition-all">
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-white/8 p-4">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Pregunta sobre SST, capacitaciones, cumplimiento..."
                className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all" />
              <button onClick={() => send(input)} disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all">
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Insights panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={15} className="text-yellow-400" />
            <h3 className="text-white font-bold text-sm">Insights Automáticos</h3>
          </div>
          {INSIGHTS.map(({ icon: Icon, color, bg, title, desc, action }, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
              className="bg-[#0D1629] border border-white/8 rounded-xl p-4 hover:border-white/15 transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${bg}`}>
                  <Icon size={15} className={color} />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{title}</div>
                  <p className="text-slate-400 text-xs mt-0.5 leading-snug">{desc}</p>
                  <button onClick={() => send(desc)}
                    className={`text-xs font-semibold mt-2 ${color} hover:opacity-80 transition-opacity`}>
                    Analizar →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          <button onClick={() => setMessages([{ role: 'ai', text: AI_RESPONSES.default, time: 'Ahora' }])}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-xs font-semibold transition-all">
            <RotateCcw size={13} /> Limpiar conversación
          </button>
        </motion.div>
      </div>
    </div>
  )
}
