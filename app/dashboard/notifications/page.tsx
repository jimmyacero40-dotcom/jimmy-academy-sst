'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, CheckCircle, AlertCircle, Info, Award,
  BookOpen, Shield, Trash2, CheckCheck, Clock, X
} from 'lucide-react'

type Notif = {
  id: number; type: string; title: string; body: string;
  time: string; read: boolean; icon: any; color: string; bg: string
}

const INITIAL: Notif[] = [
  { id: 1, type: 'alerta', title: 'Certificado próximo a vencer', body: 'Laura Herrera tiene su certificado de Extintores venciendo en 15 días.', time: 'Hace 5 min', read: false, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { id: 2, type: 'logro', title: 'Capacitación completada', body: 'Carlos Mendoza completó exitosamente "Trabajo en Alturas Nivel 1" con 95%.', time: 'Hace 18 min', read: false, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { id: 3, type: 'info', title: 'Nuevo documento para firmar', body: 'Se publicó el Reglamento de Higiene 2026. Pendiente de firma por 13 empleados.', time: 'Hace 1h', read: false, icon: Info, color: 'text-amber-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 4, type: 'alerta', title: 'Capacitación vencida', body: 'Pedro Gómez tiene la capacitación de Primeros Auxilios vencida hace 3 días.', time: 'Hace 2h', read: true, icon: BookOpen, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
  { id: 5, type: 'sistema', title: 'Reporte mensual generado', body: 'El reporte de cumplimiento SST de enero 2026 está listo para descarga.', time: 'Hace 3h', read: true, icon: Shield, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
  { id: 6, type: 'logro', title: 'Auditoría programada', body: 'La Auditoría Interna SST Q1 2026 fue agendada para el 28 de enero.', time: 'Hace 5h', read: true, icon: CheckCircle, color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 7, type: 'info', title: 'IA SST detectó incumplimiento', body: '2 empleados de producción requieren renovación de EPP antes del 15 de febrero.', time: 'Hace 8h', read: true, icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
]

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL)
  const [filter, setFilter] = useState('todas')

  const unread = notifs.filter(n => !n.read).length

  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const markOne = (id: number) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const remove = (id: number) => setNotifs(prev => prev.filter(n => n.id !== id))

  const filtered = notifs.filter(n => {
    if (filter === 'no-leidas') return !n.read
    if (filter === 'alertas') return n.type === 'alerta'
    return true
  })

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={24} className="text-[var(--text)]" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[var(--text)] text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--text)]">Notificaciones</h1>
              <p className="text-[var(--text-dim)] text-sm">{unread} sin leer</p>
            </div>
          </div>
          {unread > 0 && (
            <button onClick={markAll}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors">
              <CheckCheck size={15} /> Marcar todas
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'todas', label: 'Todas' },
          { key: 'no-leidas', label: `No leídas${unread > 0 ? ` (${unread})` : ''}` },
          { key: 'alertas', label: 'Alertas' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${filter === key ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
            {label}
          </button>
        ))}
      </motion.div>

      {/* Notifications */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--text-faint)]">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p>No hay notificaciones</p>
          </div>
        )}
        {filtered.map((n, i) => {
          const Icon = n.icon
          return (
            <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group
                ${n.read ? 'bg-[var(--bg-card-hover)] border-white/5 hover:bg-white/4' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-strong)]'}`}
              onClick={() => markOne(n.id)}>

              {!n.read && (
                <div className="absolute top-4 right-10 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              )}

              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${n.bg}`}>
                <Icon size={16} className={n.color} />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className={`text-sm font-semibold ${n.read ? 'text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>{n.title}</div>
                <p className="text-[var(--text-faint)] text-xs mt-0.5 leading-relaxed">{n.body}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[var(--text-faint)] text-xs">
                  <Clock size={10} /> {n.time}
                </div>
              </div>

              <button onClick={e => { e.stopPropagation(); remove(n.id) }}
                className="opacity-0 group-hover:opacity-100 text-[var(--text-faint)] hover:text-rose-400 transition-all flex-shrink-0 mt-1">
                <X size={15} />
              </button>
            </motion.div>
          )
        })}
      </div>

      {notifs.length > 0 && filtered.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-4 text-center">
          <button onClick={() => setNotifs([])}
            className="flex items-center gap-1.5 text-[var(--text-faint)] hover:text-rose-400 text-xs font-semibold mx-auto transition-colors">
            <Trash2 size={13} /> Limpiar todas las notificaciones
          </button>
        </motion.div>
      )}
    </div>
  )
}
