'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText, Plus, Loader2, MapPin, Calendar, ChevronDown, Lock,
} from 'lucide-react'
import { TarjetaHSE } from '@/components/TarjetaHSE'
import { ESTADOS, TIPOS_REPORTE, type ReporteHSE, type EstadoReporte } from '@/lib/reportes-hse'

const COLOR_TIPO = Object.fromEntries(TIPOS_REPORTE.map(t => [t.id, t.color]))
const ICONO_TIPO = Object.fromEntries(TIPOS_REPORTE.map(t => [t.id, t.icono]))

export default function RePortalPage() {
  const [reportes, setReportes] = useState<ReporteHSE[]>([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/reportes-hse').then(r => r.json())
      .then(d => setReportes(d.reportes ?? []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            RePortal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Reporte lo que vea. Un acto inseguro, una condición peligrosa o una idea para mejorar.
          </p>
        </div>
        <Link href="/dashboard/reportal/nuevo" className="terra-btn flex items-center gap-1.5 font-bold"
          style={{ padding: '12px 20px', fontSize: 14 }}>
          <Plus size={16} /> Nuevo reporte
        </Link>
      </div>

      <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-faint)' }}>
        Mis reportes
      </p>

      {cargando && (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
      )}

      {!cargando && !reportes.length && (
        <div className="terra-card p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}>
            <FileText size={24} />
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Todavía no ha hecho reportes</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: 380 }}>
            Cuando reporte algo, aquí verá el número de su reporte y en qué va.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {reportes.map(r => {
          const estado = ESTADOS[(r.estado ?? 'enviado') as EstadoReporte]
          const expandido = abierto === r.id
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="terra-card overflow-hidden">
              <button onClick={() => setAbierto(expandido ? null : r.id!)} className="w-full text-left p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold" style={{ color: 'var(--primary)' }}>{r.codigo}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: `${estado.color}1F`, color: estado.color }}>{estado.paraTrabajador}</span>
                    </div>
                    <p className="text-sm mt-1.5 line-clamp-2" style={{ color: 'var(--text)' }}>{r.descripcion}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      <span className="flex items-center gap-1"><Calendar size={10} />
                        {r.fecha_reporte ? new Date(r.fecha_reporte + 'T12:00:00').toLocaleDateString('es-CO') : '—'}</span>
                      {r.lugar && <span className="flex items-center gap-1"><MapPin size={10} />{r.lugar}</span>}
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(r.tipos ?? []).map(t => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: `${COLOR_TIPO[t] ?? '#64748B'}18`, color: COLOR_TIPO[t] ?? '#64748B' }}>
                          {ICONO_TIPO[t] ?? ''} {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronDown size={16} className="flex-shrink-0 mt-1 transition-transform"
                    style={{ color: 'var(--text-faint)', transform: expandido ? 'rotate(180deg)' : undefined }} />
                </div>
              </button>

              {expandido && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  {/* La misma tarjeta que ve SST, para que no haya dos versiones. */}
                  <TarjetaHSE r={r} />

                  <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(148,163,184,0.08)', border: '1px dashed var(--border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
                      <Lock size={10} /> Cómo va su reporte
                    </p>
                    {r.responsable_nombre || r.observaciones_sst || r.accion_intervencion || r.matriz_mejoras_num ? (
                      <div className="mt-1.5 space-y-1">
                        {r.responsable_nombre && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>A cargo de: {r.responsable_nombre}</p>}
                        {r.observaciones_sst && <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{r.observaciones_sst}</p>}
                        {r.accion_intervencion && <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{r.accion_intervencion}</p>}
                        {r.matriz_mejoras_num && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Matriz de Mejoras: {r.matriz_mejoras_num}</p>}
                      </div>
                    ) : (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                        Todavía sin seguimiento registrado. Aquí aparecerá cuando SST atienda el reporte.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
