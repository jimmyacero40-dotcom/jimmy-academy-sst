'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShieldAlert, ChevronRight, CheckCircle, Clock, Loader2, LayoutList } from 'lucide-react'
import type { Modulo } from '@/lib/modulos'

type MioEstado = 'enviado' | 'borrador' | null

export default function TuCuentasPage() {
  const [estado, setEstado] = useState<'cargando' | 'enviado' | 'borrador' | 'sin empezar'>('cargando')
  const [periodo, setPeriodo] = useState(new Date().getFullYear())
  // Los módulos que la empresa armó y están abiertos para esta persona.
  const [modulos, setModulos] = useState<(Modulo & { mi_estado: MioEstado })[]>([])

  useEffect(() => {
    fetch('/api/participacion-peligros')
      .then(r => r.json())
      .then(d => {
        setPeriodo(d.periodo)
        setEstado(d.participacion?.estado === 'enviado' ? 'enviado'
          : d.participacion ? 'borrador' : 'sin empezar')
      })
      .catch(() => setEstado('sin empezar'))

    fetch('/api/modulos?mios=1')
      .then(r => r.ok ? r.json() : [])
      .then(d => setModulos(Array.isArray(d) ? d : []))
      .catch(() => setModulos([]))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          Tú Cuentas
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          Tu espacio para participar. Lo que usted ve en su trabajo es lo que nos permite prevenir.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard/tu-cuentas/peligros" className="terra-card p-5 flex items-start gap-4 block">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}>
            <ShieldAlert size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
              Participación anual en la identificación de peligros
            </p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              Cuéntenos qué hace, con qué trabaja y a qué riesgos está expuesto. Son doce preguntas y
              puede guardarlas a medias para seguir después.
            </p>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                Periodo {periodo}
              </span>
              {estado === 'cargando' && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-faint)' }} />}
              {estado === 'enviado' && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                  <CheckCircle size={11} /> Ya participaste
                </span>
              )}
              {estado === 'borrador' && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                  <Clock size={11} /> Empezada, sin enviar
                </span>
              )}
              {estado === 'sin empezar' && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary)' }}>
                  Pendiente
                </span>
              )}
            </div>
          </div>

          <ChevronRight size={18} className="flex-shrink-0 mt-1" style={{ color: 'var(--text-faint)' }} />
        </Link>
      </motion.div>

      {/* Lo que la empresa haya abierto además de la identificación de peligros. */}
      {modulos.map((m, i) => (
        <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + i * 0.05 }} className="mt-3">
          <Link href={`/dashboard/tu-cuentas/modulo/${m.id}`} className="terra-card p-5 flex items-start gap-4 block">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: m.color + '1F', color: m.color, border: `1px solid ${m.color}40` }}>
              <LayoutList size={22} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base font-bold" style={{ color: 'var(--text)' }}>{m.nombre}</p>
              {m.descripcion && (
                <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{m.descripcion}</p>
              )}

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  Periodo {m.periodo}
                </span>
                {m.mi_estado === 'enviado' ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                    <CheckCircle size={11} /> Ya respondiste
                  </span>
                ) : m.mi_estado === 'borrador' ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                    <Clock size={11} /> Empezada, sin enviar
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary)' }}>
                    Pendiente
                  </span>
                )}
              </div>
            </div>

            <ChevronRight size={18} className="flex-shrink-0 mt-1" style={{ color: 'var(--text-faint)' }} />
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
