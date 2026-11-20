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
  elegida, onElegir, compacto,
}: {
  elegida: FirmaCapacitador | null
  onElegir: (f: FirmaCapacitador | null) => void
  compacto?: boolean
}) {
  const [firmas, setFirmas] = useState<FirmaCapacitador[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const archivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/firmas-capacitador')
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (vivo) { setFirmas(Array.isArray(d) ? d : []); setCargando(false) } })
      .catch(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  async function subir(file: File) {
    setError(null)
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setError('La firma debe ser una imagen PNG o JPG')
      return
    }
    setSubiendo(true)
    try {
      const dataUrl: string = await new Promise((ok, mal) => {
        const fr = new FileReader()
        fr.onload = () => ok(String(fr.result))
        fr.onerror = () => mal(new Error('No se pudo leer el archivo'))
        fr.readAsDataURL(file)
      })
      const nombre = window.prompt('¿De quién es esta firma?', '')
      if (!nombre) { setSubiendo(false); return }
      const cargo = window.prompt('Cargo (opcional)', 'Profesional SST') || null

      const res = await fetch('/api/firmas-capacitador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, cargo, imagen: dataUrl }),
      })
      const cuerpo = await res.json()
      if (!res.ok) throw new Error(cuerpo.error || 'No se pudo guardar la firma')
      setFirmas(prev => [...prev, cuerpo])
      onElegir(cuerpo)
    } catch (e: any) {
      setError(e.message)
    }
    setSubiendo(false)
    if (archivo.current) archivo.current.value = ''
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
        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: `1px solid ${activa ? '#10B981' : 'var(--border-strong)'}`, background: activa ? '#10B981' : 'transparent' }}>
          {activa && <Check size={10} color="#fff" />}
        </div>
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
          <Opcion activa={!elegida} onClick={() => onElegir(null)}>
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Sin firma <span style={{ color: 'var(--text-faint)' }}>— se deja la línea en blanco para firmar a mano</span>
            </span>
          </Opcion>

          {firmas.map(f => (
            <Opcion key={f.id} activa={elegida?.id === f.id} onClick={() => onElegir(f)} alBorrar={() => borrar(f)}>
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
        onChange={e => { const f = e.target.files?.[0]; if (f) subir(f) }} />
      <button type="button" onClick={() => archivo.current?.click()} disabled={subiendo}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl w-full justify-center"
        style={{ border: '1px dashed var(--border-strong)', color: 'var(--text-dim)', background: 'transparent' }}>
        {subiendo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        Subir otra firma y guardarla
      </button>

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
}
