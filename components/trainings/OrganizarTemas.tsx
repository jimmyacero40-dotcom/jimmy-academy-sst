'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, Check, Tag, AlertTriangle, Wand2 } from 'lucide-react'
import { TEMAS, sugerirTema, colorTema } from '@/lib/temas'

/**
 * Repartir la biblioteca en temas, de una sentada.
 *
 * La categoría vieja hacía dos oficios y el 77% de los cursos terminó en un
 * cajón llamado "SST". Clasificarlos de a uno es media mañana, así que aquí
 * se propone un tema para cada uno leyendo el título, y quien revisa corrige
 * lo que no cuadre. Nada se guarda hasta que lo confirmen.
 *
 * La obligación es aparte: la ley exige el curso o no, y eso no depende del
 * tema. Por eso va en su propia casilla, que es la que lee el plan anual.
 */

interface Curso {
  id: number
  title: string
  description?: string | null
  tema?: string | null
  obligatorio?: boolean | null
  category?: string | null
}

export default function OrganizarTemas({ cursos, onCerrar, onGuardado }: {
  cursos: Curso[]
  onCerrar: () => void
  onGuardado: () => void
}) {
  // Lo que se va a guardar, empezando por lo que ya está puesto o lo que se
  // propone. Se toca aquí y solo se manda al confirmar.
  const [temas, setTemas] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    for (const c of cursos) m[c.id] = c.tema || sugerirTema(c.title, c.description)
    return m
  })
  const [obligatorios, setObligatorios] = useState<Record<number, boolean>>(() => {
    const m: Record<number, boolean> = {}
    for (const c of cursos) m[c.id] = c.obligatorio ?? (c.category === 'Obligatorio')
    return m
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [soloPropuestos, setSoloPropuestos] = useState(false)

  const lista = useMemo(() => {
    const orden = [...cursos].sort((a, b) => {
      const ta = temas[a.id] ?? '', tb = temas[b.id] ?? ''
      if (ta !== tb) return TEMAS.findIndex(x => x.id === ta) - TEMAS.findIndex(x => x.id === tb)
      return a.title.localeCompare(b.title, 'es')
    })
    return soloPropuestos ? orden.filter(c => !c.tema) : orden
  }, [cursos, temas, soloPropuestos])

  const propuestos = cursos.filter(c => !c.tema).length

  const cambios = cursos.filter(c =>
    temas[c.id] !== (c.tema ?? null)
    || obligatorios[c.id] !== (c.obligatorio ?? (c.category === 'Obligatorio')))

  const guardar = async () => {
    if (!cambios.length) { onCerrar(); return }
    setGuardando(true); setError(null)
    const res = await fetch('/api/trainings/temas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cursos: cambios.map(c => ({ id: c.id, tema: temas[c.id], obligatorio: !!obligatorios[c.id] })),
      }),
    }).catch(() => null)
    const detalle = await res?.json().catch(() => null)
    setGuardando(false)
    if (!res?.ok) { setError(detalle?.error ?? 'No se pudieron guardar los temas'); return }
    onGuardado()
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onCerrar}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>

        <div className="p-5 flex items-start gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)' }}>
            <Tag size={16} style={{ color: '#C4B5FD' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold" style={{ color: 'var(--text)' }}>Organizar por temas</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              {propuestos > 0
                ? <>Hay <strong style={{ color: '#C4B5FD' }}>{propuestos}</strong> cursos sin tema fijado. Abajo va una propuesta
                  para cada uno, leída del título: corrija lo que no cuadre y confirme.</>
                : <>Todos los cursos ya tienen tema. Puede cambiarlos aquí.</>}
            </p>
          </div>
          <button onClick={onCerrar} style={{ color: 'var(--text-faint)' }}><X size={18} /></button>
        </div>

        {propuestos > 0 && (
          <div className="px-5 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setSoloPropuestos(v => !v)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              style={soloPropuestos
                ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#C4B5FD' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Wand2 size={11} /> Solo los propuestos ({propuestos})
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="space-y-1.5">
            {lista.map(c => {
              const tema = temas[c.id]
              const esPropuesta = !c.tema
              return (
                <div key={c.id} className="flex items-center gap-3 py-2 px-2 rounded-lg"
                  style={{ background: 'var(--bg-card)' }}>
                  <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: colorTema(tema) }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }} title={c.title}>
                      {c.title}
                    </p>
                    {esPropuesta && (
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>propuesto</p>
                    )}
                  </div>

                  <label className="flex items-center gap-1.5 text-[11px] font-semibold flex-shrink-0 cursor-pointer"
                    title="La ley lo exige: el plan anual avisa si no está programado"
                    style={{ color: obligatorios[c.id] ? '#FCD34D' : 'var(--text-faint)' }}>
                    <input type="checkbox" checked={!!obligatorios[c.id]}
                      onChange={e => setObligatorios(o => ({ ...o, [c.id]: e.target.checked }))} />
                    Obligatorio
                  </label>

                  <select value={tema} onChange={e => setTemas(t => ({ ...t, [c.id]: e.target.value }))}
                    className="text-xs rounded-lg px-2 py-1.5 flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: 190 }}>
                    {TEMAS.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="px-5 py-2 text-xs flex items-center gap-2" style={{ color: '#FCA5A5' }}>
            <AlertTriangle size={12} /> {error}
          </div>
        )}

        <div className="flex gap-2 items-center px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {cambios.length
              ? `${cambios.length} curso${cambios.length === 1 ? '' : 's'} por guardar`
              : 'Nada por guardar'}
          </p>
          <button onClick={onCerrar} className="terra-btn-outline py-2 px-4 text-sm ml-auto">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !cambios.length}
            className="py-2 px-4 text-sm font-semibold rounded-lg flex items-center gap-2"
            style={{ background: '#8B5CF6', color: '#fff', opacity: guardando || !cambios.length ? 0.5 : 1 }}>
            {guardando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Guardar temas
          </button>
        </div>
      </motion.div>
    </div>
  )
}
