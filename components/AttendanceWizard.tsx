'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, ChevronLeft, Calendar, Clock, Users,
  Search, Check, Plus, Trash2, Loader2, FileDown, AlertCircle,
} from 'lucide-react'
import { generateAttendancePDF } from '@/lib/generate-attendance-pdf'

interface Participant {
  name: string
  cedula: string
  cargo: string
  signature?: string
  checked: boolean
  manual?: boolean
}

interface Props {
  training: { id: number; title: string; temario?: string; description?: string }
  companyName: string
  companyLogo: string
  onClose: () => void
  onSaved: () => void
}

const STEPS = ['Datos del evento', 'Seleccionar participantes', 'Vista previa']

export default function AttendanceWizard({ training, companyName, companyLogo, onClose, onSaved }: Props) {
  const [step, setStep] = useState(0)

  // Step 1 fields
  const [eventDate,    setEventDate]    = useState('')
  const [schedule,     setSchedule]     = useState('')
  const [intensity,    setIntensity]    = useState('')
  const [instructor,   setInstructor]   = useState('Jimmy J. Acero. C.')
  const [organizedBy,  setOrganizedBy]  = useState('SST-AGROVENTURE CAPITAL')
  const [directedTo,   setDirectedTo]   = useState('TRABAJADORES')

  // Step 2 fields
  const [fromDate,     setFromDate]     = useState('')
  const [toDate,       setToDate]       = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [fetching,     setFetching]     = useState(false)
  const [fetchError,   setFetchError]   = useState('')
  const [fetched,      setFetched]      = useState(false)

  // Manual add
  const [manualName,   setManualName]   = useState('')
  const [manualCedula, setManualCedula] = useState('')
  const [manualCargo,  setManualCargo]  = useState('')

  // Step 3
  const [saving,       setSaving]       = useState(false)

  const selectedParticipants = participants.filter(p => p.checked)

  const displayDate = eventDate
    ? new Date(eventDate + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  const fetchParticipants = useCallback(async () => {
    if (!fromDate || !toDate) { setFetchError('Selecciona ambas fechas'); return }
    setFetching(true); setFetchError(''); setFetched(false)
    try {
      const res = await fetch(
        `/api/trainings/${training.id}/completions?from=${fromDate}&to=${toDate}`
      )
      if (!res.ok) throw new Error('Error al buscar participantes')
      const data = await res.json()
      const fetched = (data.participants || []).map((p: any) => ({ ...p, checked: true }))
      setParticipants(prev => {
        const manuals = prev.filter(p => p.manual)
        return [...fetched, ...manuals]
      })
      setFetched(true)
    } catch (e: any) {
      setFetchError(e.message)
    }
    setFetching(false)
  }, [fromDate, toDate, training.id])

  const addManual = () => {
    if (!manualName.trim()) return
    setParticipants(prev => [...prev, {
      name: manualName.trim(), cedula: manualCedula.trim(),
      cargo: manualCargo.trim(), checked: true, manual: true,
    }])
    setManualName(''); setManualCedula(''); setManualCargo('')
  }

  const toggleParticipant = (i: number) => {
    setParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, checked: !p.checked } : p))
  }

  const removeManual = (i: number) => {
    setParticipants(prev => prev.filter((_, idx) => idx !== i))
  }

  const step1Valid = eventDate && schedule && instructor && organizedBy && directedTo

  const handleGenerate = async () => {
    setSaving(true)
    try {
      const parts = selectedParticipants.map(p => ({
        name: p.name, cedula: p.cedula, cargo: p.cargo, signature: p.signature,
      }))

      // Save to DB first
      const res = await fetch('/api/attendance-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_id:      training.id,
          training_title:   training.title,
          training_temario: training.temario || training.description || '',
          event_date:       eventDate,
          schedule, intensity, instructor, organized_by: organizedBy, directed_to: directedTo,
          participants:     parts,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar en base de datos')

      // Generate and download PDF
      const blob = await generateAttendancePDF({
        trainingTitle:   training.title,
        trainingTemario: training.temario || training.description || '',
        eventDate:       displayDate,
        schedule, intensity, instructor, organizedBy, directedTo,
        participants:    parts,
        companyName, companyLogo,
      })

      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Asistencia_${training.title.replace(/[^a-zA-Z0-9]/g,'_').slice(0,30)}_${eventDate}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      onSaved()
      onClose()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-xl flex flex-col max-h-[90vh] rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
              Generar Lista de Asistencia
            </p>
            <p className="text-sm font-bold truncate max-w-[340px]" style={{ color: 'var(--text)' }}>
              {training.title}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-5 py-3 gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                  style={i === step
                    ? { background: 'var(--primary)', color: '#fff' }
                    : i < step
                      ? { background: '#10B981', color: '#fff' }
                      : { background: 'var(--bg-card)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                  {i < step ? <Check size={10} /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block"
                  style={{ color: i === step ? 'var(--text)' : 'var(--text-faint)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px" style={{ background: 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Fecha del evento *
                    </label>
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                      className="terra-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Horario *
                    </label>
                    <input type="text" value={schedule} onChange={e => setSchedule(e.target.value)}
                      placeholder="8:00 AM - 4:30 PM" className="terra-input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                    Intensidad
                  </label>
                  <input type="text" value={intensity} onChange={e => setIntensity(e.target.value)}
                    placeholder="8 horas" className="terra-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                    Instructor / Realizó *
                  </label>
                  <input type="text" value={instructor} onChange={e => setInstructor(e.target.value)}
                    className="terra-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                    Organizado por *
                  </label>
                  <input type="text" value={organizedBy} onChange={e => setOrganizedBy(e.target.value)}
                    className="terra-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                    Dirigido a *
                  </label>
                  <input type="text" value={directedTo} onChange={e => setDirectedTo(e.target.value)}
                    placeholder="TRABAJADORES" className="terra-input w-full" />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Busca los trabajadores que completaron esta capacitación en el período indicado.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>Fecha desde</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="terra-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>Fecha hasta</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="terra-input w-full" />
                  </div>
                </div>
                <button onClick={fetchParticipants} disabled={fetching || !fromDate || !toDate}
                  className="terra-btn-outline w-full py-2.5 justify-center text-sm flex items-center gap-2"
                  style={fetching ? { opacity: 0.6 } : {}}>
                  {fetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {fetching ? 'Buscando...' : 'Buscar participantes'}
                </button>

                {fetchError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs p-3 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={13} /> {fetchError}
                  </div>
                )}

                {fetched && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
                      {participants.filter(p => !p.manual).length} encontrado(s) · {selectedParticipants.length} seleccionado(s)
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {participants.map((p, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
                          onClick={() => toggleParticipant(i)}>
                          <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                            style={p.checked
                              ? { background: 'var(--primary)', border: '1px solid var(--primary)' }
                              : { background: 'transparent', border: '1px solid var(--border)' }}>
                            {p.checked && <Check size={10} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate" style={{ color: 'var(--text)' }}>
                              {p.name}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                              {[p.cedula, p.cargo].filter(Boolean).join(' · ')}
                              {p.manual && <span className="ml-1 text-amber-400">(manual)</span>}
                            </span>
                          </div>
                          {p.manual && (
                            <button onClick={e => { e.stopPropagation(); removeManual(i) }}
                              className="p-1 rounded hover:bg-red-500/10 transition-colors"
                              style={{ color: 'var(--text-faint)' }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual add */}
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Agregar manualmente</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input value={manualName} onChange={e => setManualName(e.target.value)}
                      placeholder="Nombre *" className="terra-input text-xs py-1.5 col-span-3 sm:col-span-1" />
                    <input value={manualCedula} onChange={e => setManualCedula(e.target.value)}
                      placeholder="Cédula" className="terra-input text-xs py-1.5" />
                    <input value={manualCargo} onChange={e => setManualCargo(e.target.value)}
                      placeholder="Cargo" className="terra-input text-xs py-1.5" />
                  </div>
                  <button onClick={addManual} disabled={!manualName.trim()}
                    className="terra-btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                    style={!manualName.trim() ? { opacity: 0.5 } : {}}>
                    <Plus size={12} /> Agregar
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Vista previa</p>
                <div className="rounded-xl overflow-hidden text-sm" style={{ border: '1px solid var(--border)' }}>
                  {[
                    ['Capacitación', training.title],
                    ['Fecha del evento', displayDate],
                    ['Horario', schedule],
                    ['Intensidad', intensity || '—'],
                    ['Instructor', instructor],
                    ['Organizado por', organizedBy],
                    ['Dirigido a', directedTo],
                    ['Participantes', String(selectedParticipants.length)],
                  ].map(([label, value], i) => (
                    <div key={label} className="flex px-4 py-2.5"
                      style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent', borderBottom: i < 7 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <span className="w-36 shrink-0 text-xs font-medium" style={{ color: 'var(--text-dim)' }}>{label}</span>
                      <span className="text-xs" style={{ color: 'var(--text)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>
                    Participantes ({selectedParticipants.length})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedParticipants.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="w-5 text-center shrink-0" style={{ color: 'var(--text-faint)' }}>{i+1}</span>
                        <span className="flex-1 font-medium" style={{ color: 'var(--text)' }}>{p.name}</span>
                        <span style={{ color: 'var(--text-faint)' }}>{p.cedula}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="terra-btn-outline flex-1 py-2.5 justify-center flex items-center gap-2">
              <ChevronLeft size={15} /> Anterior
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 ? !step1Valid : selectedParticipants.length === 0}
              className="terra-btn flex-1 py-2.5 justify-center flex items-center gap-2"
              style={(step === 0 ? !step1Valid : selectedParticipants.length === 0) ? { opacity: 0.5 } : {}}>
              Siguiente <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={saving}
              className="terra-btn flex-1 py-2.5 justify-center flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              {saving ? 'Generando...' : 'Generar Lista'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
