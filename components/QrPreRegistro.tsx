'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, Check, Download, Printer, QrCode, Loader2 } from 'lucide-react'

/**
 * El enlace público de pre-registro, con su código QR.
 *
 * La dirección se toma del navegador, así que el QR apunta siempre al sitio
 * donde está corriendo la plataforma: en producción al dominio real y en
 * pruebas a localhost, sin tener que configurar nada.
 */

const RUTA = '/pre-registro'

export function QrPreRegistro({ onClose }: { onClose: () => void }) {
  const [enlace, setEnlace] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [generando, setGenerando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const url = `${window.location.origin}${RUTA}`
    setEnlace(url)
    ;(async () => {
      try {
        const QR = (await import('qrcode')).default
        if (lienzo.current) {
          await QR.toCanvas(lienzo.current, url, {
            width: 320, margin: 1,
            // Corrección alta: el cartel se imprime y se mancha en campo.
            errorCorrectionLevel: 'H',
            color: { dark: '#0B1829', light: '#FFFFFF' },
          })
        }
      } catch {
        setError('No fue posible generar el código QR')
      } finally { setGenerando(false) }
    })()
  }, [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch { /* sin portapapeles: queda el texto a la vista para copiarlo a mano */ }
  }

  const descargarImagen = () => {
    const a = document.createElement('a')
    a.href = lienzo.current!.toDataURL('image/png')
    a.download = 'QR-registro-AgroSafe.png'
    a.click()
  }

  /** Hoja tamaño carta para imprimir y pegar en la finca. */
  const descargarCartel = async () => {
    const { default: jsPDF } = await import('jspdf')
    const QR = (await import('qrcode')).default
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' })
    const W = 215.9, H = 279.4

    const navy: [number, number, number] = [11, 24, 41]
    const texto = (s: string, y: number, size: number, bold = false, color: [number, number, number] = [15, 23, 42]) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(...color)
      doc.text(s, W / 2, y, { align: 'center' })
    }

    // Franja superior con la marca. La franja entera se dibuja como una sola
    // imagen: si el logo fuera una imagen aparte sobre un rectángulo navy, el
    // tono del lienzo y el del PDF no coinciden del todo y al imprimir se nota
    // un recuadro alrededor.
    try {
      const franja = await franjaConLogo('/images/agrosafe-completo.png', navy)
      doc.addImage(franja, 'PNG', 0, 0, W, 46, undefined, 'FAST')
    } catch {
      doc.setFillColor(...navy)
      doc.rect(0, 0, W, 46, 'F')
      texto('AgroSafe', 28, 22, true, [255, 255, 255])
    }

    texto('COMPLETA TUS DATOS', 70, 24, true, navy)
    texto('PARA INGRESAR A AGROSAFE', 83, 24, true, navy)

    doc.setDrawColor(132, 204, 22)
    doc.setLineWidth(1.2)
    doc.line(W / 2 - 30, 92, W / 2 + 30, 92)

    texto('Apunta la cámara de tu celular al código', 106, 13, false, [71, 85, 105])

    // El QR es blanco y negro sin transparencia: entra comprimido y liviano.
    const qr = await QR.toDataURL(enlace, {
      width: 700, margin: 1, errorCorrectionLevel: 'H',
      color: { dark: '#0B1829', light: '#FFFFFF' },
    })
    const lado = 95
    doc.addImage(qr, 'PNG', (W - lado) / 2, 114, lado, lado, undefined, 'FAST')

    texto('o entra a:', 222, 11, false, [100, 116, 139])
    texto(enlace, 231, 13, true, navy)

    doc.setFillColor(241, 245, 249)
    doc.roundedRect(24, 241, W - 48, 24, 3, 3, 'F')
    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text('Ten a la mano tu documento de identidad. Son cuatro pasos cortos y', W / 2, 251, { align: 'center' })
    doc.text('no tarda más de cinco minutos.', W / 2, 258, { align: 'center' })

    doc.save('Cartel-registro-AgroSafe.pdf')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()} className="terra-card w-full max-w-md p-5 my-8">

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(132,204,22,0.14)', color: '#84CC16' }}>
              <QrCode size={19} />
            </div>
            <div>
              <p className="text-base font-black" style={{ color: 'var(--text)' }}>Enlace de registro</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                Compártelo con los trabajadores para que diligencien sus datos ellos mismos.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-faint)' }}><X size={18} /></button>
        </div>

        {/* El código */}
        <div className="flex justify-center p-5 rounded-xl mb-3" style={{ background: '#FFFFFF' }}>
          {generando && <Loader2 size={26} className="animate-spin" style={{ color: '#0B1829' }} />}
          <canvas ref={lienzo} style={{ display: generando || error ? 'none' : 'block', maxWidth: '100%' }} />
          {error && <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{error}</p>}
        </div>

        {/* El enlace */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl mb-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <span className="text-xs font-mono truncate flex-1" style={{ color: 'var(--text)' }}>{enlace}</span>
          <button onClick={copiar}
            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0"
            style={{ background: copiado ? 'rgba(16,185,129,0.14)' : 'var(--bg-card)', border: '1px solid var(--border)', color: copiado ? '#10B981' : 'var(--primary)' }}>
            {copiado ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={descargarImagen} disabled={generando || !!error}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl disabled:opacity-40"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <Download size={13} /> Imagen del QR
          </button>
          <button onClick={descargarCartel} disabled={generando || !!error}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl disabled:opacity-40"
            style={{ background: '#84CC16', color: '#0B1829' }}>
            <Printer size={13} /> Cartel para imprimir
          </button>
        </div>

        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
          Quien se registre por aquí queda como <strong style={{ color: 'var(--text-dim)' }}>Pendiente de validación</strong>:
          no entra a la plataforma hasta que lo apruebes en esta misma pantalla.
        </p>
      </motion.div>
    </div>
  )
}

/**
 * Compone la franja superior del cartel: el fondo navy y el logo centrado,
 * en una sola imagen sin transparencia. jsPDF incrusta los PNG con canal
 * alfa sin comprimir, y así el cartel baja de varios megas a unas decenas
 * de kilobytes.
 */
function franjaConLogo(ruta: string, fondo: [number, number, number]): Promise<string> {
  return new Promise((ok, falla) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // 215,9 x 46 mm a unos 170 px por pulgada.
      const c = document.createElement('canvas')
      c.width = 1440; c.height = Math.round(1440 * 46 / 215.9)
      const ctx = c.getContext('2d')!
      ctx.fillStyle = `rgb(${fondo[0]},${fondo[1]},${fondo[2]})`
      ctx.fillRect(0, 0, c.width, c.height)

      const ancho = Math.round(c.width * 0.34)
      const alto = Math.round(ancho * img.naturalHeight / img.naturalWidth)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, (c.width - ancho) / 2, (c.height - alto) / 2, ancho, alto)
      ok(c.toDataURL('image/png'))
    }
    img.onerror = () => falla(new Error('sin logo'))
    img.src = ruta
  })
}
