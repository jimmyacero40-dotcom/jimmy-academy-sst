'use client'

import { useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Search, Star, Clock, AlertTriangle, GripVertical } from 'lucide-react'
import { colorCategoria, type Tema } from './tipos'

// ── La columna de Temas ───────────────────────────────────────────────────
// La Biblioteca entera a la izquierda del calendario: de aquí salen los temas
// que se arrastran -o se tocan dos veces- para programarlos.
// ──────────────────────────────────────────────────────────────────────────

export type FiltroTemas = 'todos' | 'obligatorios' | 'sin_programar'

interface Props {
  temas: Tema[]
  /** Cuántas veces está programado cada tema en el año del plan. */
  conteos: Map<number, number>
  filtro: FiltroTemas
  onFiltro: (f: FiltroTemas) => void
  /** El tema "armado" para el modo de dos toques. */
  armado: number | null
  onArmar: (id: number | null) => void
}

function TarjetaTema({
  tema, veces, armado, onArmar,
}: { tema: Tema; veces: number; armado: boolean; onArmar: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tema-${tema.id}`,
    data: { clase: 'tema', temaId: tema.id },
  })
  const color = colorCategoria(tema.category)
  const sinProgramar = veces === 0
  const alerta = tema.obligatorio && sinProgramar

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-pressed={armado}
      onClick={onArmar}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onArmar() }
      }}
      className="rounded-xl px-2 py-1.5 transition-all outline-none focus-visible:ring-2"
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        background: armado ? color + '28' : veces > 0 ? color + '14' : color + '08',
        border: `1px solid ${armado ? color : veces > 0 ? color + '38' : color + '1c'}`,
        boxShadow: armado ? `0 0 0 1px ${color}` : undefined,
      }}>
      <div className="flex items-center gap-1 min-w-0">
        <GripVertical size={9} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        {tema.obligatorio && <Star size={8} fill="#FCD34D" style={{ color: '#FCD34D', flexShrink: 0 }} />}
        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)', flex: 1, minWidth: 0 }}>
          {tema.title}
        </span>
        {veces > 0 && (
          <span className="text-[9px] font-black px-1.5 rounded-full flex-shrink-0"
            style={{ background: color + '28', color }}>
            ×{veces}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5 pl-3">
        {tema.duration && (
          <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--text-faint)' }}>
            <Clock size={7} />{tema.duration}
          </span>
        )}
        {alerta ? (
          <span className="text-[9px] font-bold flex items-center gap-0.5" style={{ color: '#FCA5A5' }}>
            <AlertTriangle size={7} /> Sin programar
          </span>
        ) : sinProgramar ? (
          <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>Sin programar</span>
        ) : null}
      </div>
    </div>
  )
}

export default function BibliotecaTemas({
  temas, conteos, filtro, onFiltro, armado, onArmar,
}: Props) {
  const [busca, setBusca] = useState('')

  const cuenta = useMemo(() => ({
    todos: temas.length,
    obligatorios: temas.filter(t => t.obligatorio).length,
    sin_programar: temas.filter(t => (conteos.get(t.id) ?? 0) === 0).length,
  }), [temas, conteos])

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return temas.filter(t => {
      if (q && !t.title.toLowerCase().includes(q)) return false
      if (filtro === 'obligatorios' && !t.obligatorio) return false
      if (filtro === 'sin_programar' && (conteos.get(t.id) ?? 0) > 0) return false
      return true
    })
  }, [temas, busca, filtro, conteos])

  // Agrupados por categoría, en el orden en que aparecen.
  const grupos = useMemo(() => {
    const m = new Map<string, Tema[]>()
    for (const t of visibles) {
      const k = t.category ?? 'Sin categoría'
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(t)
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'))
  }, [visibles])

  const CHIPS: { id: FiltroTemas; nombre: string }[] = [
    { id: 'todos', nombre: 'Todos' },
    { id: 'obligatorios', nombre: 'Obligatorios' },
    { id: 'sin_programar', nombre: 'Sin programar' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Buscador y filtros */}
      <div className="px-3 pt-2.5 pb-2 flex-shrink-0 space-y-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar tema..." aria-label="Buscar tema"
            className="terra-input pl-8 text-xs py-1.5" />
        </div>
        <div className="flex flex-wrap gap-1">
          {CHIPS.map(c => {
            const activo = filtro === c.id
            return (
              <button key={c.id} onClick={() => onFiltro(c.id)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                style={{
                  background: activo ? 'var(--primary)' : 'var(--bg-card)',
                  color: activo ? '#fff' : 'var(--text-dim)',
                  border: `1px solid ${activo ? 'var(--primary)' : 'var(--border)'}`,
                }}>
                {c.nombre} <span style={{ opacity: 0.7 }}>{cuenta[c.id]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista agrupada, con su propio scroll */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {grupos.length === 0 ? (
          <p className="text-[10px] text-center py-8 px-3" style={{ color: 'var(--text-faint)' }}>
            {temas.length === 0
              ? 'La Biblioteca está vacía. Crea capacitaciones en Biblioteca para poder programarlas.'
              : 'Ningún tema coincide con la búsqueda.'}
          </p>
        ) : grupos.map(([categoria, lista]) => (
          <div key={categoria}>
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colorCategoria(categoria) }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                {categoria}
              </span>
              <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{lista.length}</span>
            </div>
            <div className="space-y-1">
              {lista.map(t => (
                <TarjetaTema key={t.id} tema={t}
                  veces={conteos.get(t.id) ?? 0}
                  armado={armado === t.id}
                  onArmar={() => onArmar(armado === t.id ? null : t.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-2 pb-2 pt-1 text-[9px] text-center flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
        Arrastra un tema a un día · o tócalo y luego toca el día
      </div>
    </div>
  )
}
