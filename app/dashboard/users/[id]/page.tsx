'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, User, Mail, CreditCard, Briefcase, MapPin,
  BookOpen, CheckCircle, Clock, AlertCircle, Award,
  Users, Calendar, TrendingUp, FileText, Loader2, X,
  BarChart2, Star
} from 'lucide-react'

interface Enrollment {
  id: string
  status: string
  due_date: string | null
  started_at: string | null
  completed_at: string | null
  score: number | null
  created_at: string
  trainings: { id: number; title: string; category: string | null; duration: string | null } | null
}

interface Certificate {
  id: string
  code: string
  course: string
  issued: string
  expires: string | null
  score: number | null
  duration: string | null
}

interface UserProfile {
  id: string
  name: string
  email: string
  cedula: string
  role: string
  area: string | null
  active: boolean
  created_at: string
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  completed: { label: 'Completado', color: '#6EE7B7', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  in_progress: { label: 'En curso',    color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  icon: Clock },
  pending:     { label: 'Pendiente',   color: '#FCD34D', bg: 'rgba(245,158,11,0.1)',  icon: AlertCircle },
  overdue:     { label: 'Vencido',     color: '#FCA5A5', bg: 'rgba(239,68,68,0.1)',   icon: AlertCircle },
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<{ user: UserProfile; enrollments: Enrollment[]; certificates: Certificate[]; groups: any[]; workerProfile: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'entrenamientos' | 'certificados' | 'perfil'>('entrenamientos')
  const [statusFilter, setStatusFilter] = useState('todos')

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  if (!data?.user) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--text-faint)' }}>Usuario no encontrado</p>
        <button onClick={() => router.back()} className="terra-btn mt-4">Volver</button>
      </div>
    )
  }

  const { user, enrollments, certificates, groups, workerProfile } = data

  const total      = enrollments.length
  const completed  = enrollments.filter(e => e.status === 'completed').length
  const inProgress = enrollments.filter(e => e.status === 'in_progress').length
  const pending    = enrollments.filter(e => e.status === 'pending').length
  const overdue    = enrollments.filter(e => e.status === 'overdue').length
  const compliance = total > 0 ? Math.round((completed / total) * 100) : 0
  const avgScore   = enrollments.filter(e => e.score !== null).length > 0
    ? Math.round(enrollments.reduce((a, e) => a + (e.score ?? 0), 0) / enrollments.filter(e => e.score !== null).length)
    : null

  const filtered = statusFilter === 'todos'
    ? enrollments
    : enrollments.filter(e => e.status === statusFilter)

  const initials = getInitials(user.name)
  const hue = user.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm mb-5 transition-colors"
        style={{ color: 'var(--text-dim)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)' }}>
        <ArrowLeft size={15} /> Volver a Usuarios
      </button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="terra-card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
            style={{ background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue+40)%360},70%,45%))` }}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {user.name}
            </h1>
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="flex items-center gap-1"><Mail size={11} /> {user.email}</span>
              {user.cedula && <span className="flex items-center gap-1"><CreditCard size={11} /> {user.cedula}</span>}
              {user.role && <span className="flex items-center gap-1"><Briefcase size={11} /> {user.role}</span>}
              {user.area && <span className="flex items-center gap-1"><MapPin size={11} /> {user.area}</span>}
              <span className="flex items-center gap-1"><Calendar size={11} /> Ingresó {fmtDate(user.created_at)}</span>
            </div>

            {/* Groups */}
            {groups.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {groups.map((g: any) => (
                  <span key={g.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: (g.color || '#8B5CF6') + '20', color: g.color || '#A78BFA', border: `1px solid ${(g.color || '#8B5CF6')}35` }}>
                    <Users size={8} /> {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${user.active ? '' : 'opacity-60'}`}
              style={user.active
                ? { background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'rgba(148,163,184,0.1)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.25)' }}>
              <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'animate-pulse' : ''}`}
                style={{ background: user.active ? '#10B981' : '#64748B' }} />
              {user.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Cumplimiento',  value: `${compliance}%`, color: compliance >= 80 ? '#10B981' : compliance >= 50 ? '#F59E0B' : '#EF4444', icon: TrendingUp },
          { label: 'Completados',   value: completed,         color: '#6EE7B7', icon: CheckCircle },
          { label: 'En curso',      value: inProgress,        color: '#60A5FA', icon: Clock },
          { label: 'Pendientes',    value: pending,           color: '#FCD34D', icon: AlertCircle },
          { label: 'Certificados',  value: certificates.length, color: '#F59E0B', icon: Award },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="terra-card p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={13} style={{ color }} />
              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Compliance bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="terra-card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Nivel de cumplimiento formativo</span>
          <div className="flex items-center gap-2">
            {avgScore !== null && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                <Star size={11} className="text-amber-400" fill="#FBBF24" /> Nota promedio: {avgScore}%
              </span>
            )}
            <span className="text-sm font-black" style={{ color: compliance >= 80 ? '#10B981' : compliance >= 50 ? '#F59E0B' : '#EF4444' }}>
              {compliance}%
            </span>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${compliance}%` }} transition={{ duration: 1, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: compliance >= 80 ? 'linear-gradient(90deg,#10B981,#34D399)' : compliance >= 50 ? 'linear-gradient(90deg,#F59E0B,#FCD34D)' : 'linear-gradient(90deg,#EF4444,#FCA5A5)' }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
          <span>{completed} completados</span>
          <span>{total} asignados en total</span>
        </div>

        {/* Mini breakdown */}
        {total > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { key: 'completed',   label: 'Completados', count: completed,  color: '#10B981' },
              { key: 'in_progress', label: 'En curso',    count: inProgress, color: '#60A5FA' },
              { key: 'pending',     label: 'Pendientes',  count: pending,    color: '#F59E0B' },
              { key: 'overdue',     label: 'Vencidos',    count: overdue,    color: '#EF4444' },
            ].filter(s => s.count > 0).map(s => (
              <div key={s.key} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label}: <span className="font-bold" style={{ color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4 self-start w-fit"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {[
          { key: 'entrenamientos', label: `Entrenamientos (${total})`, icon: BookOpen },
          { key: 'certificados',   label: `Certificados (${certificates.length})`, icon: Award },
          { key: 'perfil',         label: 'Perfil Sociodemográfico', icon: User },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={tab === key
              ? { background: 'var(--amber)', color: '#000' }
              : { color: 'var(--text-dim)' }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Entrenamientos tab */}
      {tab === 'entrenamientos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap mb-4">
            {['todos', 'completed', 'in_progress', 'pending', 'overdue'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize"
                style={statusFilter === f
                  ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                {f === 'todos' ? 'Todos' : STATUS_CFG[f]?.label ?? f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen size={28} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p style={{ color: 'var(--text-faint)' }}>Sin entrenamientos {statusFilter !== 'todos' ? 'en este estado' : 'asignados'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((e, i) => {
                const cfg = STATUS_CFG[e.status] || STATUS_CFG.pending
                const Icon = cfg.icon
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="terra-card px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                      <Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                        {e.trainings?.title ?? 'Curso eliminado'}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-0.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {e.trainings?.category && (
                          <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)' }}>{e.trainings.category}</span>
                        )}
                        {e.trainings?.duration && <span>{e.trainings.duration}</span>}
                        {e.due_date && <span className="flex items-center gap-0.5"><Calendar size={9} /> Vence {fmtDate(e.due_date)}</span>}
                        {e.completed_at && <span className="flex items-center gap-0.5"><CheckCircle size={9} className="text-emerald-400" /> {fmtDate(e.completed_at)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {e.score !== null && (
                        <div className="text-right">
                          <div className="text-sm font-black" style={{ color: e.score >= 70 ? '#10B981' : '#EF4444' }}>{e.score}%</div>
                          <div className="text-[9px]" style={{ color: 'var(--text-faint)' }}>nota</div>
                        </div>
                      )}
                      <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Perfil Sociodemográfico tab */}
      {tab === 'perfil' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!workerProfile ? (
            <div className="py-16 text-center">
              <User size={28} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p style={{ color: 'var(--text-faint)' }}>Este usuario aún no ha completado su perfil sociodemográfico</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  title: 'Información Personal', color: '#60A5FA',
                  fields: [
                    ['Fecha de nacimiento', workerProfile.birth_date ? fmtDate(workerProfile.birth_date) : null],
                    ['Género', workerProfile.gender],
                    ['Estado civil', workerProfile.marital_status],
                    ['Nivel educativo', workerProfile.education_level],
                    ['Estrato socioeconómico', workerProfile.stratum != null ? `Estrato ${workerProfile.stratum}` : null],
                    ['Municipio de residencia', workerProfile.municipality],
                    ['Dirección', workerProfile.address],
                  ],
                },
                {
                  title: 'Núcleo Familiar', color: '#A78BFA',
                  fields: [
                    ['Número de personas a cargo', workerProfile.dependents != null ? String(workerProfile.dependents) : null],
                    ['Tipo de vivienda', workerProfile.housing_type],
                    ['Tenencia de vivienda', workerProfile.housing_tenure],
                  ],
                },
                {
                  title: 'Salud', color: '#34D399',
                  fields: [
                    ['Grupo sanguíneo', workerProfile.blood_type],
                    ['EPS', workerProfile.eps],
                    ['ARL', workerProfile.arl],
                    ['Fondo de pensiones', workerProfile.pension_fund],
                    ['Caja de compensación', workerProfile.compensation_fund],
                    ['Discapacidad / Condición especial', workerProfile.disability],
                    ['Enfermedad crónica', workerProfile.chronic_disease],
                  ],
                },
                {
                  title: 'Transporte', color: '#FCD34D',
                  fields: [
                    ['Medio de transporte', workerProfile.transport_type],
                    ['Tiempo de desplazamiento', workerProfile.commute_time ? `${workerProfile.commute_time} min` : null],
                  ],
                },
                {
                  title: 'Datos Laborales', color: '#F9A8D4',
                  fields: [
                    ['Cargo', workerProfile.position],
                    ['Área / Proceso', workerProfile.department],
                    ['Tipo de contrato', workerProfile.contract_type],
                    ['Fecha de ingreso', workerProfile.hire_date ? fmtDate(workerProfile.hire_date) : null],
                    ['Antigüedad', workerProfile.seniority],
                    ['Turno de trabajo', workerProfile.work_shift],
                    ['Modalidad', workerProfile.work_modality],
                  ],
                },
              ].map(({ title, color, fields }) => {
                const visible = fields.filter(([, v]) => v)
                if (visible.length === 0) return null
                return (
                  <div key={title} className="terra-card p-5">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      {title}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                      {visible.map(([label, value]) => (
                        <div key={label} className="flex items-start justify-between py-1.5 border-b border-white/5 last:border-0">
                          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</span>
                          <span className="text-xs font-semibold text-right ml-4" style={{ color: 'var(--text)' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Certificados tab */}
      {tab === 'certificados' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {certificates.length === 0 ? (
            <div className="py-16 text-center">
              <Award size={28} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p style={{ color: 'var(--text-faint)' }}>Sin certificados aún</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {certificates.map((c, i) => {
                const expired = c.expires && c.expires < new Date().toISOString().split('T')[0]
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="terra-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: expired ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${expired ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                        <Award size={15} style={{ color: expired ? '#FCA5A5' : '#FCD34D' }} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={expired
                          ? { background: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }
                          : { background: 'rgba(16,185,129,0.1)', color: '#6EE7B7' }}>
                        {expired ? 'Vencido' : 'Vigente'}
                      </span>
                    </div>
                    <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{c.course}</div>
                    <div className="text-[10px] space-y-0.5" style={{ color: 'var(--text-faint)' }}>
                      <div className="flex items-center gap-1"><FileText size={9} /> Código: <span className="font-mono">{c.code}</span></div>
                      <div className="flex items-center gap-1"><Calendar size={9} /> Emitido: {fmtDate(c.issued)}</div>
                      {c.expires && <div className="flex items-center gap-1"><Calendar size={9} /> Vence: {fmtDate(c.expires)}</div>}
                      {c.score !== null && (
                        <div className="flex items-center gap-1">
                          <Star size={9} className="text-amber-400" /> Nota: {c.score}%
                        </div>
                      )}
                      {c.duration && <div className="flex items-center gap-1"><Clock size={9} /> {c.duration}</div>}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
