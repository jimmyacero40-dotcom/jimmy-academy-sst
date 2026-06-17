'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { extractPPTXImages, extractPPTXTexts } from '@/lib/pptx-extractor'
import {
  BookOpen, Plus, Search, Clock, CheckCircle, AlertCircle,
  Users, Star, Play, Upload, ChevronRight, X, Award, Zap,
  FileText, Video, Layers, Trash2, Loader2
} from 'lucide-react'

const GRADIENTS = [
  'from-amber-500 to-red-500', 'from-red-500 to-rose-500', 'from-orange-500 to-amber-500',
  'from-amber-600 to-orange-500', 'from-emerald-500 to-teal-500', 'from-yellow-500 to-amber-500',
  'from-violet-500 to-purple-500', 'from-cyan-500 to-blue-500',
]
const COVERS = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
  'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&q=80',
  'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=800&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80',
]

const statusStyles: Record<string, { label: string; color: string; bg: string; border: string }> = {
  activo:     { label: 'En curso',    color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  completado: { label: 'Completado',  color: '#6EE7B7', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  vencido:    { label: 'Vencido',     color: '#FCA5A5', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
}

export default function TrainingsPage() {
  const router = useRouter()
  const [trainings, setTrainings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [newCourse, setNewCourse] = useState({ name: '', duration: '', description: '', category: 'Obligatorio' })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/trainings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTrainings(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadedFile(file)
    e.target.value = ''
  }

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim()) return
    setCreating(true)

    let slides: string[] = []
    let texts: string[] = []

    if (uploadedFile && /\.pptx$/i.test(uploadedFile.name)) {
      try {
        slides = await extractPPTXImages(uploadedFile)
        texts = await extractPPTXTexts(uploadedFile)
      } catch (e) {
        console.error('Error extracting PPTX:', e)
      }
    }

    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.name,
          category: newCourse.category,
          duration: newCourse.duration || '8h',
          description: newCourse.description,
          slides_count: slides.length,
          cover_url: slides[0] || COVERS[trainings.length % COVERS.length],
          color: GRADIENTS[trainings.length % GRADIENTS.length],
          file_name: uploadedFile?.name,
          slides,
          texts,
        }),
      })
      const training = await res.json()
      if (res.ok) {
        setTrainings(prev => [training, ...prev])
      }
    } catch (e) {
      console.error('Error creating course:', e)
    }

    setShowModal(false)
    setNewCourse({ name: '', duration: '', description: '', category: 'Obligatorio' })
    setUploadedFile(null)
    setCreating(false)
  }

  const handleDeleteCourse = async (id: number) => {
    try {
      await fetch(`/api/trainings?id=${id}`, { method: 'DELETE' })
      setTrainings(prev => prev.filter(t => t.id !== id))
    } catch (_) {}
  }

  const filtered = trainings.filter(t => {
    if (!t || !t.title) return false
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase()) || (t.category || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filter === 'todos' || t.status === filter)
  })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Capacitaciones</h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{trainings.length} cursos disponibles · evaluacion y certificado automatico</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => router.push('/dashboard/trainings/create')} className="terra-btn text-sm py-2.5 px-4">
              <Zap size={15} /> Generar con IA
            </button>
            <button onClick={() => setShowModal(true)} className="terra-btn-outline text-sm py-2.5 px-4">
              <Plus size={16} /> Subir Capacitacion
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total cursos', value: trainings.length, icon: BookOpen, color: 'var(--amber)' },
          { label: 'Completados', value: trainings.filter(t => t.status === 'completado').length, icon: CheckCircle, color: '#10B981' },
          { label: 'En curso', value: trainings.filter(t => t.status === 'activo').length, icon: Clock, color: '#60A5FA' },
          { label: 'Vencidos', value: trainings.filter(t => t.status === 'vencido').length, icon: AlertCircle, color: '#FCA5A5' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="terra-card p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar capacitacion..."
            className="terra-input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['todos', 'activo', 'completado', 'vencido'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={filter === f
                ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin" style={{ color: 'var(--amber)' }} />
          <p style={{ color: 'var(--text-dim)' }}>Cargando capacitaciones...</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t, i) => {
            const st = statusStyles[t.status as keyof typeof statusStyles] || statusStyles.activo
            const progress = (t.enrolled || 0) > 0 ? Math.round(((t.completed || 0) / t.enrolled) * 100) : 0
            const coverImg = t.cover_url || COVERS[t.id % COVERS.length]
            const gradColor = t.color || GRADIENTS[t.id % GRADIENTS.length]
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="terra-card terra-card-lift overflow-hidden cursor-pointer group"
                onClick={() => router.push(`/dashboard/trainings/${t.id}`)}>

                <div className="relative h-44 overflow-hidden">
                  <img src={coverImg} alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-surface), rgba(17,9,0,0.4), transparent)' }} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradColor} opacity-20`} />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <Play size={22} className="text-white ml-1" fill="white" />
                    </div>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm"
                      style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="badge-amber">{t.category}</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/80 text-xs"><Layers size={11} /> {t.slides_count || 0} diapositivas</div>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs"><FileText size={11} /> {t.questions_count || 5} preguntas</div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[15px] mb-1.5 leading-snug transition-colors text-white">{t.title}</h3>
                  <p className="text-xs mb-3 line-clamp-2 leading-relaxed text-gray-300">{t.description}</p>

                  <div className="flex items-center gap-3 text-xs mb-3 text-gray-400">
                    <div className="flex items-center gap-1"><Clock size={11} /> {t.duration}</div>
                    <div className="flex items-center gap-1"><Users size={11} /> {t.enrolled || 0}</div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="text-white font-semibold">{t.rating || 0}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Progreso</span>
                      <span className="text-xs font-bold text-white">{progress}%</span>
                    </div>
                    <div className="terra-progress-track">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.5 }}
                        className={`terra-progress-fill bg-gradient-to-r ${gradColor}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Award size={13} className="text-amber-400" />
                      <span className="text-xs text-gray-300">Certificado al completar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(t.id) }}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors" title="Eliminar curso">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                      <button className="flex items-center gap-1 text-xs font-bold transition-colors text-amber-400 hover:text-amber-300">
                        Iniciar <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-faint)' }} />
          <p style={{ color: 'var(--text-faint)' }}>No hay capacitaciones{search ? ' que coincidan con la búsqueda' : ''}</p>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Upload size={15} style={{ color: 'var(--amber)' }} />
                </div>
                <h2 className="font-bold" style={{ color: 'var(--text)' }}>Subir Capacitacion</h2>
              </div>
              <button onClick={() => { setShowModal(false); setUploadedFile(null); setNewCourse({ name: '', duration: '', description: '', category: 'Obligatorio' }) }}
                style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Nombre del curso *</label>
                <input placeholder="Ej: Trabajo en Alturas, Uso de EPP..."
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="terra-input" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Duración estimada</label>
                <select
                  value={newCourse.duration}
                  onChange={e => setNewCourse({ ...newCourse, duration: e.target.value })}
                  className="terra-input"
                  style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>
                  <option value="" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>Seleccionar duración</option>
                  <option value="2h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>2 horas</option>
                  <option value="4h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>4 horas</option>
                  <option value="6h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>6 horas</option>
                  <option value="8h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>8 horas</option>
                  <option value="12h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>12 horas</option>
                  <option value="16h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>16 horas</option>
                  <option value="20h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>20 horas</option>
                  <option value="24h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>24 horas</option>
                  <option value="40h" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>40 horas</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Categoria</label>
                <select className="terra-input"
                  value={newCourse.category}
                  onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}>
                  {['Obligatorio', 'Especializado', 'Induccion', 'Reinduccion'].map(c => (
                    <option key={c} style={{ background: 'var(--bg-surface)' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Descripcion</label>
                <textarea rows={3} placeholder="Describe el contenido del curso..."
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="terra-input resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Material del curso</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx,.ppt,.mp4,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {uploadedFile ? (
                  <div className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} style={{ color: '#6EE7B7' }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{uploadedFile.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setUploadedFile(null)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: '#FCA5A5' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl p-6 text-center cursor-pointer transition-all hover:opacity-80"
                    style={{ border: '2px dashed var(--border-strong)', background: 'var(--bg-card)' }}>
                    <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--amber)' }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Haz clic para subir archivo</p>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>PDF, PPTX, DOC, MP4 hasta 500 MB</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowModal(false); setUploadedFile(null); setNewCourse({ name: '', duration: '', description: '', category: 'Obligatorio' }) }}
                className="terra-btn-outline flex-1 py-2.5 justify-center">Cancelar</button>
              <button onClick={handleCreateCourse}
                disabled={!newCourse.name.trim() || creating}
                className="terra-btn flex-1 py-2.5 justify-center">{creating ? 'Procesando archivo...' : 'Crear Curso'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
