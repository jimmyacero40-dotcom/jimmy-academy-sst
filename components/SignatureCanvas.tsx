'use client'

import { useRef, useState, useEffect } from 'react'
import { PenTool, RotateCcw, CheckCircle } from 'lucide-react'

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  onCancel?: () => void
  confirmLabel?: string
  strokeColor?: string
}

export function SignatureCanvas({
  onSave,
  onCancel,
  confirmLabel = 'Confirmar firma',
  strokeColor = '#60a5fa',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = strokeColor
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }, [strokeColor])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    drawing.current = true
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsEmpty(false)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const pos    = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDraw = () => { drawing.current = false }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Re-apply styles after clear
    ctx.strokeStyle = strokeColor
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    setIsEmpty(true)
  }

  const save = () => {
    if (isEmpty) return
    onSave(canvasRef.current!.toDataURL('image/png'))
  }

  return (
    <div className="space-y-3">
      <div className="relative border border-[var(--border-strong,var(--border))] rounded-xl overflow-hidden bg-white/[0.02]">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full cursor-crosshair touch-none block"
          style={{ height: 160 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-faint)' }}>
              <PenTool size={24} />
              <p className="text-sm">Dibuja tu firma aquí</p>
              <p className="text-xs">Con el dedo o el mouse</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-0 right-0 border-b border-dashed mx-4" style={{ borderColor: 'var(--border)' }} />
      </div>

      <div className="flex gap-2">
        <button onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          <RotateCcw size={13} /> Borrar
        </button>
        <div className="flex-1" />
        {onCancel && (
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg border text-sm font-semibold transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
            Cancelar
          </button>
        )}
        <button onClick={save} disabled={isEmpty}
          className="terra-btn">
          <CheckCircle size={14} /> {confirmLabel}
        </button>
      </div>
    </div>
  )
}
