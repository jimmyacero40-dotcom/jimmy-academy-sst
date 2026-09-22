'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Consulta atada a un contexto (portería, fechas, filtros): la `url` ES el contexto.
 *
 * Garantiza que nunca se muestren datos de un contexto anterior:
 * - Al cambiar la url, los datos vuelven a `vacio` ANTES de consultar, así que la
 *   vista pasa a estado de carga en vez de seguir pintando la sede anterior.
 * - La petición anterior se aborta. Si una respuesta lenta de la sede anterior
 *   llega tarde, se descarta en lugar de pisar la nueva.
 * - Con `url` null no se consulta: sirve para esperar a que el contexto esté listo
 *   (por ejemplo, a conocer las porterías del usuario).
 *
 * `recargar` repite la consulta del contexto actual sin vaciar la vista, porque
 * los datos siguen siendo del mismo contexto.
 */
export function useConsulta<T>(url: string | null, vacio: T) {
  const [datos, setDatos] = useState<T>(vacio)
  const [cargando, setCargando] = useState(url !== null)
  const [error, setError] = useState<string | null>(null)
  const controlador = useRef<AbortController | null>(null)
  const vacioRef = useRef(vacio)

  const consultar = useCallback(async (limpiar: boolean) => {
    controlador.current?.abort()
    if (!url) { setCargando(false); return }
    const c = new AbortController()
    controlador.current = c

    if (limpiar) setDatos(vacioRef.current)
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(url, { signal: c.signal, cache: 'no-store' })
      const cuerpo = await res.json().catch(() => null)
      if (c.signal.aborted) return
      if (!res.ok) throw new Error(cuerpo?.error || `Error ${res.status}`)
      setDatos(cuerpo as T)
    } catch (e: any) {
      if (c.signal.aborted || e?.name === 'AbortError') return
      setError(e?.message || 'No fue posible cargar la información')
      setDatos(vacioRef.current)
    }
    if (!c.signal.aborted) setCargando(false)
  }, [url])

  useEffect(() => {
    consultar(true)
    return () => controlador.current?.abort()
  }, [consultar])

  const recargar = useCallback(() => consultar(false), [consultar])

  return { datos, setDatos, cargando, error, recargar }
}
