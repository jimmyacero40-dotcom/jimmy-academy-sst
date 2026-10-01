'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, AlertCircle } from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Campo de texto con dictado por voz.
 *
 * La transcripción ocurre en el navegador (Web Speech API): no se envía audio a
 * ningún servidor y lo que se guarda es texto, venga de la voz o del teclado.
 * Si el navegador no reconoce voz, el campo sigue siendo un campo de texto
 * normal y ni siquiera aparece el micrófono.
 *
 * El permiso del micrófono se pide al pulsar "Dictar", nunca antes.
 */

function reconocedor(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

export function hayDictado(): boolean {
  return reconocedor() !== null
}

interface Props {
  value: string
  onChange: (texto: string) => void
  placeholder?: string
  rows?: number
  className?: string
  /** Una sola línea en vez de área de texto. */
  linea?: boolean
  disabled?: boolean
  'aria-label'?: string
}

export function CampoDictado({
  value, onChange, placeholder, rows = 4, className = '', linea = false, disabled,
  'aria-label': etiqueta,
}: Props) {
  const [soportado, setSoportado] = useState(false)
  const [escuchando, setEscuchando] = useState(false)
  const [parcial, setParcial] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)

  const motor = useRef<any>(null)
  const base = useRef('')          // texto que había al empezar a dictar
  const acumulado = useRef('')     // lo ya transcrito en esta sesión de dictado
  const queriaSeguir = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // El soporte se mira en el cliente: en el servidor no existe window.
  useEffect(() => { setSoportado(hayDictado()) }, [])

  const detener = useCallback(() => {
    queriaSeguir.current = false
    try { motor.current?.stop() } catch { /* ya estaba detenido */ }
    setEscuchando(false)
    setParcial('')
  }, [])

  // Si el campo se desmonta a mitad del dictado, se corta el micrófono.
  useEffect(() => () => { queriaSeguir.current = false; try { motor.current?.stop() } catch {} }, [])

  const unir = (previo: string, nuevo: string) => {
    const a = previo.trimEnd()
    const b = nuevo.trim()
    if (!a) return b
    if (!b) return a
    // Se separa con espacio, salvo que lo anterior termine en salto de línea.
    return /\n$/.test(previo) ? previo + b : `${a} ${b}`
  }

  const arrancar = useCallback(() => {
    const SR = reconocedor()
    if (!SR) return
    setAviso(null)

    const r = new SR()
    r.lang = 'es-CO'
    r.continuous = true
    r.interimResults = true

    base.current = value
    acumulado.current = ''
    queriaSeguir.current = true

    r.onresult = (e: any) => {
      let finales = ''
      let enCurso = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finales += t
        else enCurso += t
      }
      if (finales) {
        acumulado.current = unir(acumulado.current, finales)
        onChangeRef.current(unir(base.current, acumulado.current))
      }
      setParcial(enCurso.trim())
    }

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setAviso('No se pudo usar el micrófono. Permite el acceso en tu navegador.')
        queriaSeguir.current = false
      } else if (e.error === 'no-speech') {
        setAviso('No se escuchó nada. Intenta de nuevo más cerca del micrófono.')
      } else if (e.error !== 'aborted') {
        setAviso('El dictado se interrumpió. Puedes intentarlo otra vez.')
      }
    }

    // En el celular el reconocimiento se corta solo cada pocos segundos; si el
    // trabajador no ha pulsado Detener, se vuelve a abrir.
    r.onend = () => {
      if (!queriaSeguir.current) { setEscuchando(false); setParcial(''); return }
      try { r.start() } catch { setEscuchando(false) }
    }

    motor.current = r
    try {
      r.start()
      setEscuchando(true)
    } catch {
      setAviso('No fue posible iniciar el dictado.')
      setEscuchando(false)
    }
  }, [value])

  const comun = {
    value,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => onChange(e.target.value),
    placeholder,
    disabled,
    'aria-label': etiqueta,
    className: `${className} ${soportado ? (linea ? 'pr-11' : 'pr-12') : ''}`,
    spellCheck: false as const,
  }

  return (
    <div>
      <div className="relative">
        {linea
          ? <input type="text" {...comun} />
          : <textarea rows={rows} {...comun} className={`${comun.className} resize-none`} />}

        {soportado && (
          <button type="button"
            onClick={escuchando ? detener : arrancar}
            disabled={disabled}
            title={escuchando ? 'Detener el dictado' : 'Dictar por voz'}
            aria-label={escuchando ? 'Detener el dictado' : 'Dictar por voz'}
            aria-pressed={escuchando}
            className="absolute rounded-xl flex items-center justify-center transition-all"
            style={{
              right: 7, top: linea ? '50%' : 7,
              transform: linea ? 'translateY(-50%)' : undefined,
              width: 34, height: 34,
              background: escuchando ? '#EF4444' : 'var(--bg-card)',
              border: `1px solid ${escuchando ? '#EF4444' : 'var(--border)'}`,
              color: escuchando ? '#fff' : 'var(--primary)',
            }}>
            {escuchando
              ? <Square size={13} fill="currentColor" />
              : <Mic size={15} />}
          </button>
        )}
      </div>

      {soportado && (
        <div className="mt-1.5 min-h-[18px]">
          {escuchando ? (
            <p className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#EF4444' }} />
              Escuchando… habla con normalidad y pulsa el cuadro para terminar.
              {parcial && <span className="font-normal italic" style={{ color: 'var(--text-faint)' }}>{parcial}</span>}
            </p>
          ) : aviso ? (
            <p className="text-[11px] flex items-center gap-1" style={{ color: '#F59E0B' }}>
              <AlertCircle size={11} /> {aviso}
            </p>
          ) : (
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              Puedes escribir o pulsar el micrófono para dictar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
