'use client'

import { Mail, AlertCircle, Loader2 } from 'lucide-react'

/**
 * Lo último antes de que salga un correo.
 *
 * Una reasignación de la inducción le mandó correo a los 52 trabajadores
 * porque la casilla de avisar venía marcada de fábrica. Ahora ninguna viene
 * marcada, y además se pregunta: cuántos correos, a quiénes y por qué.
 *
 * Un correo no se puede devolver. Es la clase de cosa que se pregunta.
 */
export default function ConfirmarEnvio({
  cuantos, que, nombres, enviando, onConfirmar, onCancelar,
}: {
  /** A cuántas personas les llega. */
  cuantos: number
  /** Qué se les manda, en una frase: «el aviso de la capacitación». */
  que: string
  /** Algunos nombres, para que se vea a quién. */
  nombres?: string[]
  enviando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  const muestra = (nombres ?? []).slice(0, 6)
  const resto = (nombres ?? []).length - muestra.length

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Mail size={16} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>
              {cuantos === 1 ? 'Se va a enviar 1 correo' : `Se van a enviar ${cuantos} correos`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{que}</p>
          </div>
        </div>

        {muestra.length > 0 && (
          <p className="text-[11px] leading-relaxed px-3 py-2 rounded-lg"
            style={{ background: 'var(--bg)', color: 'var(--text-faint)' }}>
            {muestra.join(' · ')}{resto > 0 ? ` y ${resto} más` : ''}
          </p>
        )}

        <p className="text-[11px] flex items-start gap-1.5" style={{ color: 'var(--text-faint)' }}>
          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
          Un correo no se puede devolver.
        </p>

        <div className="flex gap-2">
          <button onClick={onCancelar} disabled={enviando}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
            No enviar
          </button>
          <button onClick={onConfirmar} disabled={enviando}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
            style={{ background: '#243C2C', color: '#fff' }}>
            {enviando ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Sí, enviar
          </button>
        </div>
      </div>
    </div>
  )
}
