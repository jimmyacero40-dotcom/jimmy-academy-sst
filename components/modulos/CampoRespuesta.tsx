'use client'

import { CheckCircle, CornerDownRight } from 'lucide-react'
import {
  opcionesVisibles, esOtro, tocaPorque, tocaDecirCual, type Pregunta,
} from '@/lib/modulos'

/**
 * Una respuesta, según el tipo de pregunta.
 *
 * Vive aquí y no dentro del formulario del trabajador porque la vista previa
 * del armador usa exactamente esto: si cada pantalla dibujara lo suyo, lo que
 * el administrador ve al armar y lo que el trabajador contesta acabarían
 * siendo dos cosas distintas sin que nadie se diera cuenta.
 */

const inp = 'w-full text-sm rounded-xl px-3 py-2.5 outline-none'
const estiloInp: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
}

/** El recuadro que se abre debajo para explicar o decir cuál. */
function Aparte({ etiqueta, valor, onCambio, placeholder }: {
  etiqueta: string; valor: string; onCambio: (v: string) => void; placeholder: string
}) {
  return (
    <div className="mt-2.5 pl-3" style={{ borderLeft: '2px solid var(--primary-border)' }}>
      <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1"
        style={{ color: 'var(--primary)' }}>
        <CornerDownRight size={11} /> {etiqueta}
      </p>
      <textarea rows={2} value={valor} onChange={e => onCambio(e.target.value)}
        placeholder={placeholder} className={`${inp} resize-none`} style={estiloInp} />
    </div>
  )
}

export default function CampoRespuesta({ pregunta, valor, onCambio, extras, onExtra }: {
  pregunta: Pregunta
  valor: any
  onCambio: (v: any) => void
  /** Lo que escribió aparte: el porqué y el "cuál" del Otro. */
  extras?: { porque?: string; otro?: string }
  onExtra?: (cual: 'porque' | 'otro', v: string) => void
}) {
  const porque = extras?.porque ?? ''
  const otro   = extras?.otro ?? ''
  const pide = (cual: 'porque' | 'otro', v: string) => onExtra?.(cual, v)

  switch (pregunta.tipo) {
    case 'texto':
      return <input value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        placeholder={pregunta.placeholder ?? ''} className={inp} style={estiloInp} />

    case 'parrafo':
      return <textarea rows={4} value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        placeholder={pregunta.placeholder ?? ''} className={`${inp} resize-none`} style={estiloInp} />

    case 'numero':
      return <input type="number" value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        className={inp} style={estiloInp} />

    case 'fecha':
      return <input type="date" value={valor ?? ''} onChange={e => onCambio(e.target.value)}
        className={inp} style={estiloInp} />

    case 'si_no':
      return (
        <>
          <div className="flex gap-2">
            {[['si', 'Sí'], ['no', 'No']].map(([v, n]) => (
              <button key={v} onClick={() => onCambio(v)}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={valor === v
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                {n}
              </button>
            ))}
          </div>
          {tocaPorque(pregunta, valor) && (
            <Aparte etiqueta="¿Por qué?" valor={porque}
              onCambio={v => pide('porque', v)}
              placeholder="Cuéntenos en una o dos líneas" />
          )}
        </>
      )

    case 'escala':
      return (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onCambio(n)}
              className="flex-1 py-3 rounded-xl text-base font-black"
              style={Number(valor) === n
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {n}
            </button>
          ))}
        </div>
      )

    case 'opcion':
      return (
        <>
          <div className="space-y-1.5">
            {opcionesVisibles(pregunta).map(o => (
              <button key={o} onClick={() => onCambio(o)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm"
                style={valor === o
                  ? { background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--text)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                {o}
              </button>
            ))}
          </div>
          {tocaDecirCual(pregunta, valor) && (
            <Aparte etiqueta="¿Cuál?" valor={otro}
              onCambio={v => pide('otro', v)}
              placeholder="Escriba cuál" />
          )}
        </>
      )

    case 'multiple': {
      const marcadas: string[] = Array.isArray(valor) ? valor : []
      return (
        <>
        <div className="space-y-1.5">
          {opcionesVisibles(pregunta).map(o => {
            const puesta = marcadas.includes(o)
            return (
              <button key={o}
                onClick={() => onCambio(puesta ? marcadas.filter(x => x !== o) : [...marcadas, o])}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5"
                style={puesta
                  ? { background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--text)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: puesta ? 'var(--primary)' : 'transparent',
                    border: `2px solid ${puesta ? 'var(--primary)' : 'var(--border)'}`,
                  }}>
                  {puesta && <CheckCircle size={10} className="text-white" />}
                </span>
                {o}
              </button>
            )
          })}
        </div>
        {tocaDecirCual(pregunta, valor) && (
          <Aparte etiqueta="¿Cuál?" valor={otro}
            onCambio={v => pide('otro', v)}
            placeholder="Escriba cuál" />
        )}
        </>
      )
    }

    case 'confirmacion':
      return (
        <button onClick={() => onCambio(valor !== true)}
          className="w-full text-left px-3 py-3 rounded-xl text-sm flex items-start gap-2.5"
          style={valor === true
            ? { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--text)' }
            : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{
              background: valor === true ? '#10B981' : 'transparent',
              border: `2px solid ${valor === true ? '#10B981' : 'var(--border)'}`,
            }}>
            {valor === true && <CheckCircle size={13} className="text-white" />}
          </span>
          <span>Confirmo que lo que respondí es mío y es verdad.</span>
        </button>
      )

    default:
      return null
  }
}
