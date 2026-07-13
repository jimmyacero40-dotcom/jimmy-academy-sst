'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Search, Download, Trash2, Loader2, Users, Calendar, User, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { generateAttendancePDF } from '@/lib/generate-attendance-pdf'

interface AttendanceList {
  id: number
  training_id: number | null
  training_title: string
  event_date: string
  schedule: string
  intensity: string
  instructor: string
  organized_by: string
  directed_to: string
  generated_by: string
  generated_at: string
  participant_count: number
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AttendanceListsPage() {
  const [lists, setLists]         = useState<AttendanceList[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [expanded, setExpanded]   = useState<number | null>(null)

  // Group by training title
  const grouped = lists
    .filter(l => !search || l.training_title.toLowerCase().includes(search.toLowerCase()))
    .reduce<Record<string, AttendanceList[]>>((acc, l) => {
      acc[l.training_title] = acc[l.training_title] || []
      acc[l.training_title].push(l)
      return acc
    }, {})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/attendance-lists')
      if (res.ok) setLists(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta lista de asistencia? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    try {
      await fetch(`/api/attendance-lists/${id}`, { method: 'DELETE' })
      setLists(prev => prev.filter(l => l.id !== id))
    } catch {}
    setDeleting(null)
  }

  const handleDownload = async (list: AttendanceList) => {
    setDownloading(list.id)
    try {
      const res = await fetch(`/api/attendance-lists/${list.id}`)
      if (!res.ok) throw new Error('Error al cargar datos')
      const data = await res.json()

      const blob = await generateAttendancePDF({
        trainingTitle:   data.training_title,
        trainingTemario: data.training_temario || '',
        eventDate:       formatDate(data.event_date),
        schedule:        data.schedule,
        intensity:       data.intensity,
        instructor:      data.instructor,
        organizedBy:     data.organized_by,
        directedTo:      data.directed_to,
        participants:    data.participants || [],
        companyName:     data.companyName  || '',
        companyLogo:     data.companyLogo  || '',
      })

      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Asistencia_${data.training_title.replace(/[^a-zA-Z0-9]/g,'_').slice(0,30)}_${data.event_date}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setDownloading(null)
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <ClipboardList size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Listas de Asistencia
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Registro histórico de sesiones de capacitación
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Listas generadas', value: lists.length,   color: '#10B981' },
          { label: 'Capacitaciones',   value: Object.keys(grouped).length, color: '#60A5FA' },
          { label: 'Participantes',    value: lists.reduce((s,l) => s + l.participant_count, 0), color: '#A78BFA' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="terra-card p-4">
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por capacitación..."
          className="terra-input pl-9" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2" style={{ color: 'var(--text-dim)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando listas...</span>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-24">
          <ClipboardList size={48} className="mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>
            {search ? 'Sin resultados' : 'Aún no hay listas generadas'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {search ? 'Intenta con otro término de búsqueda.' : 'Genera la primera desde la Biblioteca de Capacitaciones.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([title, sessions], gi) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}>

              {/* Training group header */}
              <button className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                style={{ background: 'var(--bg-card)' }}
                onClick={() => setExpanded(expanded === gi ? null : gi)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <ClipboardList size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      {sessions.length} lista{sessions.length !== 1 ? 's' : ''} · {sessions.reduce((s,l) => s + l.participant_count, 0)} participantes en total
                    </p>
                  </div>
                </div>
                {expanded === gi
                  ? <ChevronUp size={15} style={{ color: 'var(--text-faint)' }} />
                  : <ChevronDown size={15} style={{ color: 'var(--text-faint)' }} />}
              </button>

              {/* Session rows */}
              {expanded === gi && (
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {sessions.map((list, si) => (
                    <div key={list.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                      style={{
                        background: si % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        borderBottom: si < sessions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                            <Calendar size={11} className="text-emerald-400" />
                            <strong>{formatDate(list.event_date)}</strong>
                          </span>
                          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                            <Users size={11} />
                            {list.participant_count} participante{list.participant_count !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                            <User size={11} />
                            {list.instructor}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {list.schedule}{list.intensity ? ` · ${list.intensity}` : ''} · Generado {formatDateTime(list.generated_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDownload(list)}
                          disabled={downloading === list.id}
                          title="Descargar PDF"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                          {downloading === list.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Download size={12} />}
                          PDF
                        </button>
                        <button
                          onClick={() => handleDelete(list.id)}
                          disabled={deleting === list.id}
                          title="Eliminar lista"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                          {deleting === list.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
