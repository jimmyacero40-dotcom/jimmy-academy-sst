'use client'

import { useMemo } from 'react'
import { DEPARTAMENTOS, municipiosDe, claveUbicacion } from '@/lib/divipola'

/**
 * Departamento y municipio, en dos listas encadenadas.
 *
 * Escrito a mano, el mismo municipio entraba de varias formas —«CAJICÁ» y
 * «CAJICA» salían como dos— y una vez entró «52418», que es el código DANE
 * que alguien copió en lugar del nombre. Con listas eso no puede pasar.
 *
 * Lo que ya estaba escrito no se pierde: si el valor guardado no está en la
 * lista, se le agrega como una opción más, marcada, para que la persona lo
 * vea y escoja el correcto cuando vuelva a entrar.
 */
export default function SelectorUbicacion({
  departamento, municipio, onCambio, etiquetaDepto, etiquetaMunicipio, requerido, clase,
}: {
  departamento: string | null | undefined
  municipio: string | null | undefined
  onCambio: (departamento: string | null, municipio: string | null) => void
  etiquetaDepto?: string
  etiquetaMunicipio?: string
  requerido?: boolean
  /** La clase del proyecto para campos, para que se vea como los demás. */
  clase: string
}) {
  const dep = (departamento ?? '').trim()
  const mun = (municipio ?? '').trim()

  // El departamento guardado puede venir sin tilde («BOYACA»); se busca el
  // oficial para que la lista lo muestre seleccionado.
  const depOficial = useMemo(() => {
    const k = claveUbicacion(dep)
    return DEPARTAMENTOS.find(d => claveUbicacion(d.nombre) === k)?.nombre ?? dep
  }, [dep])

  const municipios = useMemo(() => municipiosDe(depOficial), [depOficial])

  const munOficial = useMemo(() => {
    const k = claveUbicacion(mun)
    return municipios.find(m => claveUbicacion(m) === k) ?? mun
  }, [mun, municipios])

  // Un valor viejo que no está en la lista: se ofrece igual, para no borrarlo
  // por la espalda.
  const depraro = dep && !DEPARTAMENTOS.some(d => claveUbicacion(d.nombre) === claveUbicacion(dep))
  const munRaro = mun && !municipios.some(m => claveUbicacion(m) === claveUbicacion(mun))

  // Los dos van juntos en la misma fila: separados, «ciudad de nacimiento»
  // quedaba al lado de «departamento de residencia» y se prestaba a confusión.
  return (
    <div className="col-span-2 grid grid-cols-2 gap-4">
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>
          {etiquetaDepto ?? 'DEPARTAMENTO'}{requerido ? ' *' : ''}
        </label>
        <select className={clase} value={depraro ? dep : depOficial}
          onChange={e => {
            // Al cambiar de departamento el municipio deja de valer: el que
            // estaba es de otro lado.
            onCambio(e.target.value || null, null)
          }}>
          <option value="">— DEPARTAMENTO —</option>
          {depraro && <option value={dep}>{dep} (no está en la lista)</option>}
          {DEPARTAMENTOS.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>
          {etiquetaMunicipio ?? 'MUNICIPIO'}{requerido ? ' *' : ''}
        </label>
        <select className={clase} value={munRaro ? mun : munOficial}
          disabled={!depOficial && !munRaro}
          onChange={e => onCambio(depOficial || null, e.target.value || null)}>
          <option value="">
            {depOficial ? '— MUNICIPIO —' : 'Escoge primero el departamento'}
          </option>
          {munRaro && <option value={mun}>{mun} (no está en la lista)</option>}
          {municipios.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {depOficial && municipios.length > 0 && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
            {municipios.length} municipios en {depOficial}
          </p>
        )}
      </div>
    </div>
  )
}
