'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

/**
 * El menú de acciones de una tarjeta de curso.
 *
 * Antes eran nueve iconos sueltos en fila, sin una sola palabra: había que
 * pasar el mouse por cada uno para saber cuál era cuál, y en el teléfono no
 * cabían. El proyecto no usa ninguna librería de componentes, así que esto
 * está hecho a mano con lo mismo que el resto: teclado, Esc y clic afuera.
 */

export interface AccionMenu {
  id: string
  texto: string
  icono: React.ReactNode
  onClick: () => void
  /** Pinta la opción en rojo: borrar, archivar. */
  peligro?: boolean
  oculta?: boolean
  /** Para "Cambiar portada", que abre un selector de archivo, no una acción. */
  comoArchivo?: { accept: string; onArchivo: (f: File) => void }
}

export interface GrupoMenu {
  titulo: string
  acciones: AccionMenu[]
}

export default function MenuCurso({ grupos, etiqueta }: {
  grupos: GrupoMenu[]
  etiqueta: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [marcada, setMarcada] = useState(-1)
  // El menú se dibuja fuera de la tarjeta, en el body: la tarjeta recorta lo
  // que se sale de ella (lo necesita para las esquinas redondeadas de la
  // portada), y el menú quedaba cortado por arriba. Por eso va posicionado a
  // mano, a partir de dónde está el botón.
  const [sitio, setSitio] = useState<{ top: number; right: number; haciaArriba: boolean } | null>(null)
  const caja = useRef<HTMLDivElement>(null)

  const visibles = grupos
    .map(g => ({ ...g, acciones: g.acciones.filter(a => !a.oculta) }))
    .filter(g => g.acciones.length)
  const planas = visibles.flatMap(g => g.acciones)

  const cerrar = useCallback(() => { setAbierto(false); setMarcada(-1) }, [])

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node
      if (caja.current?.contains(t)) return
      if ((t as HTMLElement)?.closest?.('[role="menu"]')) return
      cerrar()
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setMarcada(i => (i + 1) % planas.length) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMarcada(i => (i <= 0 ? planas.length : i) - 1) }
      if (e.key === 'Enter' && marcada >= 0) {
        e.preventDefault()
        const a = planas[marcada]
        if (a && !a.comoArchivo) { cerrar(); a.onClick() }
      }
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto, marcada, planas, cerrar])

  let indice = -1

  return (
    <div ref={caja} className="relative" onClick={e => e.stopPropagation()}>
      <button
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={e => {
          e.stopPropagation()
          const r = caja.current?.getBoundingClientRect()
          if (r) {
            const alto = Math.min(420, planas.length * 34 + visibles.length * 26 + 16)
            const arriba = r.top > alto + 12
            setSitio({
              top: arriba ? r.top - alto - 4 : r.bottom + 4,
              right: window.innerWidth - r.right,
              haciaArriba: arriba,
            })
          }
          setAbierto(v => !v)
        }}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-dim)', background: abierto ? 'var(--bg-card)' : 'transparent' }}>
        <MoreHorizontal size={16} />
      </button>

      {abierto && sitio && createPortal(
        <div role="menu" aria-label={etiqueta}
          onClick={e => e.stopPropagation()}
          className="fixed z-[70] rounded-xl overflow-hidden py-1"
          style={{
            top: sitio.top, right: sitio.right,
            minWidth: 236, maxHeight: '70vh', overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)', boxShadow: '0 10px 32px rgba(0,0,0,0.45)',
          }}>
          {visibles.map((g, gi) => (
            <div key={g.titulo}>
              {gi > 0 && <div className="my-1 h-px" style={{ background: 'var(--border)' }} />}
              <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: g.acciones[0]?.peligro ? '#FCA5A5' : 'var(--text-faint)' }}>
                {g.titulo}
              </p>
              {g.acciones.map(a => {
                indice++
                const i = indice
                const estilo: React.CSSProperties = {
                  color: a.peligro ? '#FCA5A5' : 'var(--text)',
                  background: marcada === i ? 'var(--bg-card)' : 'transparent',
                }
                const contenido = (
                  <>
                    <span className="flex-shrink-0 w-4 flex items-center justify-center">{a.icono}</span>
                    {a.texto}
                  </>
                )
                const clases = 'w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer'

                if (a.comoArchivo) {
                  return (
                    <label key={a.id} role="menuitem" tabIndex={0} className={clases} style={estilo}
                      onMouseEnter={() => setMarcada(i)}>
                      {contenido}
                      <input type="file" accept={a.comoArchivo.accept} className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          cerrar()
                          if (f) a.comoArchivo!.onArchivo(f)
                        }} />
                    </label>
                  )
                }
                return (
                  <button key={a.id} role="menuitem" className={clases} style={estilo}
                    onMouseEnter={() => setMarcada(i)}
                    onClick={e => { e.stopPropagation(); cerrar(); a.onClick() }}>
                    {contenido}
                  </button>
                )
              })}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
