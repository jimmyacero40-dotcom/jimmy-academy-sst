'use client'

import { useRef, useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

export default function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a1a'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDrawing(true)
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasContent(true)
  }

  const endDraw = () => {
    setDrawing(false)
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
  }

  const save = () => {
    if (!hasContent) return
    const dataUrl = canvasRef.current!.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden border-2 border-dashed"
        style={{ borderColor: 'var(--border)', background: '#FFFFFF' }}>
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height: 180, touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-gray-400">Firma aquí con el mouse o el dedo</span>
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-3">
        <button onClick={clear}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          <Trash2 size={14} /> Limpiar
        </button>
        <button onClick={save} disabled={!hasContent}
          className="terra-btn flex-1 py-2 justify-center disabled:opacity-40">
          Confirmar Firma
        </button>
      </div>
    </div>
  )
}
