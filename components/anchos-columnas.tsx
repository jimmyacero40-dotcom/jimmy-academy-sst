'use client'

// ─── Columnas que se pueden ensanchar y angostar ──────────────────────
// Como en una hoja de cálculo: se arrastra la línea que separa dos títulos
// y la columna cambia de ancho. Antes los anchos estaban escritos en el
// código, así que un cargo largo o un correo largo salían cortados y no
// había manera de verlos sin abrir la ficha.
//
// El ancho que sobra se le quita a las columnas de la derecha, de modo que
// la tabla siempre cabe en la tarjeta y nunca aparece una barra horizontal.
// Eso importa aquí: la tarjeta tiene `overflow: visible` para que el menú
// de grupos pueda salirse, y poner desbordamiento horizontal lo cortaría.
//
// Lo que cada quien acomoda se recuerda en su propio navegador. Es una
// comodidad de quien mira, no un dato del sistema: si no se puede guardar
// -modo privado, permisos-, la tabla sigue funcionando con los anchos de
// fábrica.
// ──────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'

export interface ColumnaAncho {
  /** Identificador estable. Si cambia, se descartan los anchos guardados. */
  id: string
  /** Ancho de fábrica, en porcentaje del total. */
  ancho: number
  /** Mínimo al que se puede angostar, en porcentaje. Por defecto 3. */
  min?: number
}

const CLAVE = (tablaId: string) => `sst_anchos_columnas:${tablaId}`
const MIN_POR_DEFECTO = 3

/** Reparte el sobrante para que la suma vuelva a ser exactamente 100. */
function normalizar(anchos: number[]): number[] {
  const suma = anchos.reduce((a, b) => a + b, 0)
  if (suma <= 0) return anchos
  return anchos.map(a => (a * 100) / suma)
}

export function useAnchosColumnas(tablaId: string, base: ColumnaAncho[]) {
  const firma = base.map(c => c.id).join('|')
  const [anchos, setAnchos] = useState<number[]>(() => base.map(c => c.ancho))
  const [acomodado, setAcomodado] = useState(false)
  const contenedor = useRef<HTMLDivElement | null>(null)

  // Se lee después del primer pintado: en el servidor no hay localStorage, y
  // leerlo durante el render daría un HTML distinto al del cliente.
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE(tablaId))
      if (!crudo) return
      const g = JSON.parse(crudo)
      // La firma protege de aplicar anchos viejos cuando las columnas
      // cambiaron: si se agrega una, los guardados ya no corresponden.
      if (g?.firma === firma && Array.isArray(g.anchos) && g.anchos.length === base.length) {
        setAnchos(normalizar(g.anchos))
        setAcomodado(true)
      }
    } catch {
      /* Sin acceso al almacenamiento se usan los anchos de fábrica. */
    }
  }, [tablaId, firma, base.length])

  const guardar = useCallback((nuevos: number[]) => {
    try { localStorage.setItem(CLAVE(tablaId), JSON.stringify({ firma, anchos: nuevos })) } catch {}
  }, [tablaId, firma])

  const restablecer = useCallback(() => {
    setAnchos(base.map(c => c.ancho))
    setAcomodado(false)
    try { localStorage.removeItem(CLAVE(tablaId)) } catch {}
  }, [base, tablaId])

  /**
   * Arrastre de la línea que hay a la derecha de la columna `i`.
   * Lo que gana esa columna se lo ceden las de su derecha, de izquierda a
   * derecha y sin bajar del mínimo de cada una.
   */
  const empezarArrastre = useCallback((i: number, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ancho = contenedor.current?.offsetWidth ?? 0
    if (!ancho || i >= base.length - 1) return

    const xInicial = e.clientX
    const inicio = [...anchos]
    const minimos = base.map(c => c.min ?? MIN_POR_DEFECTO)

    const mover = (ev: PointerEvent) => {
      const deltaPct = ((ev.clientX - xInicial) / ancho) * 100
      const siguiente = [...inicio]

      // Cuánto puede ceder -o absorber- todo lo que está a la derecha.
      let pendiente = deltaPct
      if (pendiente > 0) {
        for (let j = i + 1; j < siguiente.length && pendiente > 0; j++) {
          const cede = Math.min(pendiente, inicio[j] - minimos[j])
          if (cede <= 0) continue
          siguiente[j] = inicio[j] - cede
          pendiente -= cede
        }
      } else {
        // Al angostar, lo que suelta esta columna se lo lleva su vecina.
        const suelta = Math.min(-pendiente, inicio[i] - minimos[i])
        siguiente[i + 1] = inicio[i + 1] + suelta
        pendiente = -suelta
      }
      siguiente[i] = inicio[i] + (deltaPct > 0 ? deltaPct - pendiente : pendiente)
      setAnchos(siguiente)
    }

    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setAnchos(actuales => { guardar(actuales); return actuales })
      setAcomodado(true)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }, [anchos, base, guardar])

  return { anchos, contenedor, empezarArrastre, restablecer, acomodado }
}

/**
 * La línea que se arrastra. Va dentro del <th>, pegada a su borde derecho.
 * Se ve al pasar el puntero por encima para no ensuciar el encabezado.
 */
export function ManijaColumna({ onArrastrar, onRestablecer }: {
  onArrastrar: (e: React.PointerEvent) => void
  /** Doble clic: devuelve todas las columnas a su ancho de fábrica. */
  onRestablecer?: () => void
}) {
  const [resaltada, setResaltada] = useState(false)
  return (
    <div
      onPointerDown={onArrastrar}
      onDoubleClick={e => { e.stopPropagation(); onRestablecer?.() }}
      onMouseEnter={() => setResaltada(true)}
      onMouseLeave={() => setResaltada(false)}
      title="Arrastra para cambiar el ancho · doble clic para restablecer"
      style={{
        position: 'absolute', top: 0, right: -3, bottom: 0,
        width: 7, cursor: 'col-resize', zIndex: 2,
        touchAction: 'none',
      }}>
      <div style={{
        position: 'absolute', top: 6, bottom: 6, left: 3, width: 1,
        background: resaltada ? 'var(--primary)' : 'var(--border)',
        boxShadow: resaltada ? '0 0 0 1px var(--primary)' : undefined,
        transition: 'background 120ms',
      }} />
    </div>
  )
}
