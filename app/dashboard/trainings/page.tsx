'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Plus, Search, Clock, CheckCircle, AlertCircle,
  Users, Star, Play, Upload, ChevronRight, X, Award, Zap,
  FileText, Video, Layers
} from 'lucide-react'

const TRAININGS_DATA = [
  {
    id: 1,
    title: 'Trabajo en Alturas – Nivel 1',
    category: 'Obligatorio',
    duration: '8h',
    enrolled: 24,
    completed: 20,
    due: '2026-02-15',
    status: 'activo',
    rating: 4.8,
    cover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    color: 'from-blue-600 to-cyan-500',
    description: 'Capacitación obligatoria según Resolución 4272 de 2021 (vigente). Aprende técnicas seguras para trabajar en alturas superiores a 2 metros sobre el plano de los pies.',
    slides: 12,
    questions: 15,
  },
  {
    id: 2,
    title: 'Primeros Auxilios Básicos',
    category: 'Obligatorio',
    duration: '16h',
    enrolled: 30,
    completed: 12,
    due: '2026-01-20',
    status: 'vencido',
    rating: 4.9,
    cover: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    color: 'from-rose-600 to-pink-500',
    description: 'Aprende a responder ante emergencias médicas en el lugar de trabajo: RCP, manejo de heridas, atención de fracturas y más.',
    slides: 14,
    questions: 20,
  },
  {
    id: 3,
    title: 'Manejo de Extintores y Contra Incendios',
    category: 'Obligatorio',
    duration: '4h',
    enrolled: 48,
    completed: 48,
    due: '2026-01-30',
    status: 'completado',
    rating: 4.5,
    cover: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&q=80',
    color: 'from-orange-600 to-red-500',
    description: 'Conoce los tipos de extintores, su clasificación y la técnica correcta PASS para combatir incendios en clase A, B y C.',
    slides: 10,
    questions: 12,
  },
  {
    id: 4,
    title: 'EPP – Equipos de Protección Personal',
    category: 'Obligatorio',
    duration: '6h',
    enrolled: 56,
    completed: 51,
    due: '2026-03-10',
    status: 'activo',
    rating: 4.3,
    cover: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=800&q=80',
    color: 'from-violet-600 to-purple-500',
    description: 'Selección, uso, mantenimiento e inspección de equipos de protección individual según la norma NTC 1733.',
    slides: 11,
    questions: 15,
  },
  {
    id: 5,
    title: 'COPASST – Comité Paritario SST',
    category: 'Especializado',
    duration: '12h',
    enrolled: 8,
    completed: 8,
    due: '2026-04-01',
    status: 'completado',
    rating: 4.7,
    cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    color: 'from-emerald-600 to-teal-500',
    description: 'Funciones, responsabilidades y marco legal del Comité Paritario de Seguridad y Salud en el Trabajo según Decreto 1072 de 2015.',
    slides: 13,
    questions: 18,
  },
  {
    id: 6,
    title: 'Riesgo Eléctrico Industrial',
    category: 'Especializado',
    duration: '8h',
    enrolled: 15,
    completed: 9,
    due: '2026-02-28',
    status: 'activo',
    rating: 4.6,
    cover: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80',
    color: 'from-yellow-500 to-orange-500',
    description: 'Identificación de riesgos eléctricos, medidas de control, LOTO (Lock Out – Tag Out) y normativa NTC 2050.',
    slides: 12,
    questions: 16,
  },
]

const statusConfig = {
  activo: { label: 'En curso', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  completado: { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  vencido: { label: 'Vencido', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
}

export default function TrainingsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showAutoModal, setShowAutoModal] = useState(false)

  const filtered = TRAININGS_DATA.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || t.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Capacitaciones</h1>
            <p className="text-slate-400 text-sm">{TRAININGS_DATA.length} cursos disponibles · evaluación y certificado automático</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => router.push('/dashboard/trainings/create')}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start">
              <Zap size={15} /> Generar con IA
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all self-start">
              <Plus size={16} /> Subir Capacitación
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total cursos', value: TRAININGS_DATA.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
          { label: 'Completados', value: TRAININGS_DATA.filter(t => t.status === 'completado').length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
          { label: 'En curso', value: TRAININGS_DATA.filter(t => t.status === 'activo').length, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
          { label: 'Vencidos', value: TRAININGS_DATA.filter(t => t.status === 'vencido').length, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[#0D1629] border border-white/8 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bg} mb-2`}>
              <Icon size={15} className={color} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar capacitación..."
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['todos', 'activo', 'completado', 'vencido'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${filter === f ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/8 text-slate-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((t, i) => {
          const st = statusConfig[t.status as keyof typeof statusConfig]
          const progress = Math.round((t.completed / t.enrolled) * 100)
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-[#0D1629] border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 hover:-translate-y-1 transition-all group cursor-pointer"
              onClick={() => router.push(`/dashboard/trainings/${t.id}`)}>

              {/* Cover image */}
              <div className="relative h-44 overflow-hidden">
                <img src={t.cover} alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className={`absolute inset-0 bg-gradient-to-t from-[#0D1629] via-[#0D1629]/40 to-transparent`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-30`} />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <Play size={22} className="text-white ml-1" fill="white" />
                  </div>
                </div>

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${st.bg} ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                {/* Category */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/40 backdrop-blur-sm text-white border border-white/10">
                    {t.category}
                  </span>
                </div>

                {/* Bottom info on image */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <Layers size={11} /> {t.slides} diapositivas
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <FileText size={11} /> {t.questions} preguntas
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-bold text-sm mb-1.5 leading-snug group-hover:text-blue-300 transition-colors">{t.title}</h3>
                <p className="text-slate-500 text-xs mb-3 line-clamp-2 leading-relaxed">{t.description}</p>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1"><Clock size={11} /> {t.duration}</div>
                  <div className="flex items-center gap-1"><Users size={11} /> {t.enrolled}</div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-slate-300">{t.rating}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">Progreso</span>
                    <span className="text-xs font-bold text-white">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full bg-gradient-to-r ${t.color} rounded-full`} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award size={13} className="text-violet-400" />
                    <span className="text-xs text-slate-500">Certificado al completar</span>
                  </div>
                  <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors">
                    Iniciar <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0D1629] border border-white/12 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Upload size={15} className="text-blue-400" />
                </div>
                <h2 className="text-white font-bold">Subir Capacitación</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nombre del curso', placeholder: 'Trabajo en Alturas...' },
                { label: 'Duración estimada', placeholder: 'Ej: 8 horas' },
              ].map(({ label, placeholder }) => (
                <div key={label}>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">{label}</label>
                  <input placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
              ))}
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Categoría</label>
                <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all">
                  {['Obligatorio', 'Especializado', 'Inducción', 'Reinducción'].map(c => (
                    <option key={c} className="bg-[#0D1629]">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Descripción</label>
                <textarea rows={3} placeholder="Describe el contenido del curso..."
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none" />
              </div>
              {[
                { label: 'Imagen de portada', icon: <Video size={24} className="text-slate-500" />, text: 'JPG, PNG hasta 5 MB' },
                { label: 'Material del curso', icon: <FileText size={24} className="text-slate-500" />, text: 'PDF, PPTX, MP4 hasta 500 MB' },
              ].map(({ label, icon, text }) => (
                <div key={label}>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">{label}</label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-blue-500/30 transition-all cursor-pointer group">
                    <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">{icon}</div>
                    <p className="text-slate-500 text-xs">{text}</p>
                    <p className="text-slate-600 text-xs mt-1">Arrastra o haz clic para subir</p>
                  </div>
                </div>
              ))}
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Fecha límite</label>
                <input type="date" className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-sm font-semibold transition-all">Cancelar</button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">Crear Curso</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAutoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0D1629] border border-white/12 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <Zap size={15} className="text-white" />
                </div>
                <h2 className="text-white font-bold">Generar Capacitación con IA</h2>
              </div>
              <button onClick={() => setShowAutoModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Tema de la capacitación</label>
                <input placeholder="Ej: Riesgo Químico en Laboratorios..."
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Nivel</label>
                <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all">
                  {['Básico', 'Intermedio', 'Avanzado'].map(c => <option key={c} className="bg-[#0D1629]">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Número de diapositivas</label>
                <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all">
                  {['8 diapositivas', '12 diapositivas', '16 diapositivas', '20 diapositivas'].map(c => <option key={c} className="bg-[#0D1629]">{c}</option>)}
                </select>
              </div>
              <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-3.5">
                <p className="text-violet-300 text-xs font-semibold mb-1">✨ La IA generará automáticamente:</p>
                <ul className="text-slate-400 text-xs space-y-0.5">
                  <li>• Diapositivas con contenido verídico SST</li>
                  <li>• Imágenes relevantes al tema</li>
                  <li>• Evaluación con preguntas del contenido</li>
                  <li>• Certificado personalizado al aprobar</li>
                </ul>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowAutoModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white text-sm font-semibold transition-all">Cancelar</button>
              <button onClick={() => { setShowAutoModal(false); window.location.href = '/dashboard/trainings/1' }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                <Zap size={14} /> Generar ahora
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
