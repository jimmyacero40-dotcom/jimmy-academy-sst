'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  MessageSquare, ShieldAlert, LayoutList, Plus, Loader2, X,
  ChevronRight, Users, HelpCircle, AlertCircle, CheckCircle,
} from 'lucide-react'
import { tienePermiso } from '@/lib/permisos'
import { ESTADO_MODULO, type Modulo } from '@/lib/modulos'

interface FilaModulo extends Modulo { preguntas: number; respondieron: number }

const inp = 'w-full text-sm rounded-lg px-3 py-2 outline-none'
const estiloInp: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
}

/**
 * La consola de Tú Cuentas: todo lo que se le pregunta al trabajador en un
 * solo sitio. La identificación de peligros va de primera, porque es la que
 * exige la ley, y debajo las consultas que arme la empresa.
 */
export default function ConsolaTuCuentasPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const usuario = session?.user as { role?: string; permissions?: string[] | null } | undefined
  const puedeGestionar = !!usuario?.role && tienePermiso(usuario.role, usuario.permissions, 'sst.modulos.gestionar')

  const [modulos, setModulos] = useState<FilaModulo[] | null>(null)
  const [peligros, setPeligros] = useState<{ participantes: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const anio = new Date().getFullYear()

  useEffect(() => {
    fetch('/api/modulos')
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Error')
        return r.json()
      })
      .then(setModulos)
      .catch(e => { setError(e.message); setModulos([]) })

    fetch(`/api/participacion-peligros?alcance=empresa&periodo=${anio}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.filas) return
        setPeligros({
          participantes: d.filas.filter((f: any) => f.estado === 'Participó').length,
          total: d.filas.length,
        })
      })
      .catch(() => {})
  }, [anio])

  const crear = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true); setError(null)
    try {
      const r = await fetch('/api/modulos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No fue posible crear el módulo'); return }
      router.push(`/dashboard/gestion-sst/modulos/${d.id}`)
    } finally { setGuardando(false) }
  }

  if (modulos === null) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Cargando…</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">

      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
            <MessageSquare size={21} />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Tú Cuentas
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Todo lo que se le pregunta al trabajador, y lo que respondió.
            </p>
          </div>
        </div>
        {puedeGestionar && (
          <button onClick={() => setCreando(true)} className="terra-btn flex items-center gap-1.5"
            style={{ padding: '9px 16px', fontSize: 12 }}>
            <Plus size={14} /> Nuevo módulo
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* ── La que exige la ley ── */}
      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push('/dashboard/gestion-sst/participacion')}
        className="terra-card p-5 w-full text-left flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}>
          <ShieldAlert size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
              Identificación de peligros
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(59,130,246,0.14)', color: 'var(--primary)' }}>
              DE LEY
            </span>
          </div>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            La participación anual obligatoria. Doce preguntas, con su tabulación por la GTC 45,
            el formulario en PDF y los resultados en Excel.
          </p>
          <div className="flex items-center gap-3 mt-2.5 text-[11px]" style={{ color: 'var(--text-faint)' }}>
            <span>Periodo {anio}</span>
            {peligros
              ? <span className="flex items-center gap-1"><Users size={11} />{peligros.participantes} de {peligros.total} participaron</span>
              : <Loader2 size={11} className="animate-spin" />}
          </div>
        </div>
        <ChevronRight size={18} className="flex-shrink-0 mt-1" style={{ color: 'var(--text-faint)' }} />
      </motion.button>

      {/* ── Las que arma la empresa ── */}
      <p className="text-[11px] font-bold uppercase tracking-wider mt-6 mb-2" style={{ color: 'var(--text-faint)' }}>
        Módulos de la empresa
      </p>

      {!modulos.length ? (
        <div className="terra-card p-8 text-center">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Todavía no hay módulos propios</p>
          <p className="text-xs mt-1.5 leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-dim)' }}>
            Un módulo es una consulta suya: usted escribe las preguntas y el trabajador las responde
            desde el celular, en el mismo sitio donde hace la de peligros.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {modulos.map((m, i) => {
            const e = ESTADO_MODULO[m.estado]
            return (
              <motion.button key={m.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/dashboard/gestion-sst/modulos/${m.id}`)}
                className="terra-card p-4 w-full text-left flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: m.color + '1F', color: m.color, border: `1px solid ${m.color}40` }}>
                  <LayoutList size={19} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{m.nombre}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: e.color + '20', color: e.color }}>{e.nombre}</span>
                  </div>
                  {m.descripcion && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-dim)' }}>{m.descripcion}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                    <span className="flex items-center gap-1"><HelpCircle size={11} />{m.preguntas} preguntas</span>
                    <span className="flex items-center gap-1"><CheckCircle size={11} />{m.respondieron} respondieron</span>
                    <span>Periodo {m.periodo}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="flex-shrink-0 mt-1" style={{ color: 'var(--text-faint)' }} />
              </motion.button>
            )
          })}
        </div>
      )}

      {/* ── Nuevo módulo ── */}
      {creando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setCreando(false)}>
          <div className="terra-card p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Nuevo módulo</p>
              <button onClick={() => setCreando(false)} style={{ color: 'var(--text-faint)' }}><X size={16} /></button>
            </div>

            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
              Nombre
            </label>
            <input value={form.nombre} autoFocus
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Clima laboral 2026" className={`${inp} mb-3`} style={estiloInp} />

            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
              De qué se trata <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--text-faint)' }}>(opcional)</span>
            </label>
            <textarea value={form.descripcion} rows={3}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Lo que el trabajador lee antes de empezar"
              className={`${inp} mb-4 resize-none`} style={estiloInp} />

            <p className="text-[11px] mb-4 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
              Nace como borrador: nadie lo ve hasta que usted escriba las preguntas y lo abra.
            </p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setCreando(false)} className="terra-btn-outline"
                style={{ padding: '8px 16px', fontSize: 12 }}>Cancelar</button>
              <button onClick={crear} disabled={guardando || !form.nombre.trim()}
                className="terra-btn flex items-center gap-1.5 disabled:opacity-40"
                style={{ padding: '8px 16px', fontSize: 12 }}>
                {guardando ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Crear y escribir preguntas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
