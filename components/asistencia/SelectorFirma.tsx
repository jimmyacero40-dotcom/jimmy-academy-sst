'use client'

import { useEffect, useRef, useState } from 'react'
import { PenLine, Upload, Trash2, Loader2, Check } from 'lucide-react'

export interface FirmaCapacitador {
  id: string
  nombre: string
  cargo: string | null
  imagen: string
}

/**
 * Qué firma va al pie de la lista de asistencia.
 *
 * La idea es no tener que buscar el archivo cada vez: las firmas quedan
 * guardadas y al descargar solo se escoge una. Quien dicta casi siempre es la
 * misma persona.
 */
export default function SelectorFirma({
  elegida, onElegir, compacto, soloAdministrar,
}: {
  elegida: FirmaCapacitador | null
  onElegir: (f: FirmaCapacitador | null) => void
  compacto?: boolean
  /** Solo guardar y quitar firmas, sin escoger ninguna para un documento. */
  soloAdministrar?: boolean
}) {
  const [firmas, setFirmas] = useState<FirmaCapacitador[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const archivo = useRef<HTMLInputElement>(null)
  // Los datos de la firma se escriben en el formulario, no en ventanitas del
  // navegador: asi se ve lo que se esta guardando y se puede corregir.
  const [agregando, setAgregando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [cargo, setCargo] = useState('Profesional SST')
  const [imagen, setImagen] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/firmas-capacitador')
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (vivo) { setFirmas(Array.isArray(d) ? d : []); setCargando(false) } })
      .catch(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  async function leerArchivo(file: File) {
    setError(null)
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setError('La firma debe ser una imagen PNG o JPG')
      return
    }
    try {
      const dataUrl: string = await new Promise((ok, mal) => {
        const fr = new FileReader()
        fr.onload = () => ok(String(fr.result))
        fr.onerror = () => mal(new Error('No se pudo leer el archivo'))
        fr.readAsDataURL(file)
      })
      setImagen(dataUrl)
      setAgregando(true)
    } catch (e: any) {
      setError(e.message)
    }
    if (archivo.current) archivo.current.value = ''
  }

  function cancelar() {
    setAgregando(false); setImagen(null); setNombre(''); setCargo('Profesional SST'); setError(null)
  }

  async function guardar() {
    if (!nombre.trim() || !imagen) { setError('Falta el nombre de quien firma'); return }
    setSubiendo(true); setError(null)
    try {
      const res = await fetch('/api/firmas-capacitador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), cargo: cargo.trim() || null, imagen }),
      })
      const cuerpo = await res.json()
      if (!res.ok) throw new Error(cuerpo.error || 'No se pudo guardar la firma')
      setFirmas(prev => [...prev, cuerpo])
      if (!soloAdministrar) onElegir(cuerpo)
      cancelar()
    } catch (e: any) {
      setError(e.message)
    }
    setSubiendo(false)
  }

  async function borrar(f: FirmaCapacitador) {
    if (!window.confirm(`¿Quitar la firma de ${f.nombre} de la lista de firmas guardadas?`)) return
    const res = await fetch(`/api/firmas-capacitador?id=${f.id}`, { method: 'DELETE' })
    if (res.ok) {
      setFirmas(prev => prev.filter(x => x.id !== f.id))
      if (elegida?.id === f.id) onElegir(null)
    }
  }

  const Opcion = ({ activa, onClick, children, alBorrar }: {
    activa: boolean; onClick: () => void; children: React.ReactNode; alBorrar?: () => void
  }) => (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onClick}
        className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all"
        style={{
          background: activa ? 'rgba(16,185,129,0.08)' : 'var(--bg)',
          border: `1px solid ${activa ? 'rgba(16,185,129,0.45)' : 'var(--border)'}`,
        }}>
        {/* Administrando no se escoge nada: sobra la casilla de selección. */}
        {!soloAdministrar && (
          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: `1px solid ${activa ? '#10B981' : 'var(--border-strong)'}`, background: activa ? '#10B981' : 'transparent' }}>
            {activa && <Check size={10} color="#fff" />}
          </div>
        )}
        {children}
      </button>
      {alBorrar && (
        <button type="button" onClick={alBorrar} title="Quitar esta firma guardada"
          className="p-1.5 rounded-lg" style={{ color: '#EF4444' }}>
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-2">
      {!compacto && (
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-label)' }}>
          <PenLine size={12} /> Firma del capacitador
        </p>
      )}

      {cargando ? (
        <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--text-faint)' }}>
          <Loader2 size={12} className="animate-spin" /> Cargando firmas…
        </div>
      ) : (
        <>
          {!soloAdministrar && (
            <Opcion activa={!elegida} onClick={() => onElegir(null)}>
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Sin firma <span style={{ color: 'var(--text-faint)' }}>— se deja la línea en blanco para firmar a mano</span>
              </span>
            </Opcion>
          )}

          {soloAdministrar && firmas.length === 0 && (
            <p className="text-xs py-3 text-center" style={{ color: 'var(--text-faint)' }}>
              Todavía no hay firmas guardadas.
            </p>
          )}

          {firmas.map(f => (
            <Opcion key={f.id} activa={!soloAdministrar && elegida?.id === f.id}
              onClick={() => { if (!soloAdministrar) onElegir(f) }} alBorrar={() => borrar(f)}>
              <img src={f.imagen} alt="" className="h-8 object-contain flex-shrink-0"
                style={{ maxWidth: 110, mixBlendMode: 'multiply' }} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{f.nombre}</span>
                {f.cargo && <span className="block text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>{f.cargo}</span>}
              </span>
            </Opcion>
          ))}
        </>
      )}

      <input ref={archivo} type="file" accept="image/png,image/jpeg" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) leerArchivo(f) }} />

      {agregando && imagen ? (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-center py-1">
            <img src={imagen} alt="" className="h-12 object-contain" style={{ mixBlendMode: 'multiply' }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
              ¿De quién es esta firma? *
            </label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} autoFocus
              placeholder="Ej.: Jimmy J. Acero C." className="terra-input text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Cargo</label>
            <input value={cargo} onChange={e => setCargo(e.target.value)} className="terra-input text-sm" />
          </div>
          <div className="flex gap-2 pt-0.5">
            <button type="button" onClick={cancelar}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={subiendo || !nombre.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
              style={{ background: '#10B981', color: '#fff' }}>
              {subiendo ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Guardar firma
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => archivo.current?.click()}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl w-full justify-center"
          style={{ border: '1px dashed var(--border-strong)', color: 'var(--text-dim)', background: 'transparent' }}>
          <Upload size={12} />
          {firmas.length ? 'Subir otra firma y guardarla' : 'Subir una firma y guardarla'}
        </button>
      )}

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
}
