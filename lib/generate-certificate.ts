export function generateCertificatePNG(data: {
  name: string
  course: string
  date: string
  expiry: string
  score: string
  code: string
  duration: string
}): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const W = 1400
    const H = 1000
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#1a0f04')
    bg.addColorStop(0.5, '#1f1108')
    bg.addColorStop(1, '#0f0a02')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Decorative border
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 3
    ctx.strokeRect(30, 30, W - 60, H - 60)
    ctx.strokeStyle = 'rgba(245,158,11,0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(40, 40, W - 80, H - 80)

    // Corner ornaments
    const corners = [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]]
    corners.forEach(([x, y]) => {
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#F59E0B'
      ctx.fill()
    })

    // Top accent line
    const topGrad = ctx.createLinearGradient(200, 0, W - 200, 0)
    topGrad.addColorStop(0, 'transparent')
    topGrad.addColorStop(0.3, '#F59E0B')
    topGrad.addColorStop(0.7, '#EF4444')
    topGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = topGrad
    ctx.fillRect(200, 80, W - 400, 2)

    // Logo circle
    ctx.beginPath()
    ctx.arc(W / 2, 150, 40, 0, Math.PI * 2)
    const logoGrad = ctx.createLinearGradient(W / 2 - 40, 110, W / 2 + 40, 190)
    logoGrad.addColorStop(0, '#F59E0B')
    logoGrad.addColorStop(1, '#EF4444')
    ctx.fillStyle = logoGrad
    ctx.fill()

    // Award icon (star shape)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('★', W / 2, 162)

    // "CERTIFICADO"
    ctx.fillStyle = '#F59E0B'
    ctx.font = '600 14px Arial'
    ctx.letterSpacing = '8px'
    ctx.textAlign = 'center'
    ctx.fillText('C E R T I F I C A D O   D E   C O M P E T E N C I A', W / 2, 220)

    // Institution
    ctx.fillStyle = 'rgba(232,213,181,0.6)'
    ctx.font = '13px Arial'
    ctx.fillText('Jimmy Academy — Sistema de Gestión de Seguridad y Salud en el Trabajo', W / 2, 248)

    // Divider
    ctx.fillStyle = 'rgba(245,158,11,0.3)'
    ctx.fillRect(300, 270, W - 600, 1)

    // "Se certifica que"
    ctx.fillStyle = 'rgba(232,213,181,0.7)'
    ctx.font = '16px Arial'
    ctx.fillText('Se otorga el presente certificado a', W / 2, 310)

    // Name
    ctx.fillStyle = '#E8D5B5'
    ctx.font = 'bold 42px Georgia, serif'
    ctx.fillText(data.name, W / 2, 365)

    // Underline under name
    const nameWidth = ctx.measureText(data.name).width
    ctx.fillStyle = 'rgba(245,158,11,0.4)'
    ctx.fillRect(W / 2 - nameWidth / 2 - 20, 380, nameWidth + 40, 1)

    // "Por haber completado..."
    ctx.fillStyle = 'rgba(232,213,181,0.7)'
    ctx.font = '15px Arial'
    ctx.fillText('Por haber completado satisfactoriamente la capacitación en:', W / 2, 420)

    // Course name
    ctx.fillStyle = '#F59E0B'
    ctx.font = 'bold 30px Georgia, serif'
    // Word wrap if needed
    const maxCourseWidth = W - 200
    if (ctx.measureText(data.course).width > maxCourseWidth) {
      const words = data.course.split(' ')
      let line1 = ''
      let line2 = ''
      let onLine1 = true
      for (const word of words) {
        const test = line1 + (line1 ? ' ' : '') + word
        if (onLine1 && ctx.measureText(test).width > maxCourseWidth) {
          onLine1 = false
        }
        if (onLine1) line1 = test
        else line2 += (line2 ? ' ' : '') + word
      }
      ctx.fillText(line1, W / 2, 465)
      if (line2) ctx.fillText(line2, W / 2, 500)
    } else {
      ctx.fillText(data.course, W / 2, 470)
    }

    // Duration + Score box
    ctx.fillStyle = 'rgba(245,158,11,0.08)'
    ctx.strokeStyle = 'rgba(245,158,11,0.2)'
    ctx.lineWidth = 1
    const boxY = 520
    const boxW = 180
    const boxH = 70
    const gap = 30

    // Duration box
    const box1X = W / 2 - boxW - gap / 2 - boxW / 2 - gap / 2
    roundRect(ctx, box1X, boxY, boxW, boxH, 10)
    ctx.fill()
    ctx.stroke()

    // Score box
    const box2X = W / 2 - boxW / 2
    roundRect(ctx, box2X, boxY, boxW, boxH, 10)
    ctx.fill()
    ctx.stroke()

    // Code box
    const box3X = W / 2 + boxW / 2 + gap
    roundRect(ctx, box3X, boxY, boxW, boxH, 10)
    ctx.fill()
    ctx.stroke()

    // Duration text
    ctx.fillStyle = 'rgba(232,213,181,0.5)'
    ctx.font = '11px Arial'
    ctx.fillText('Duración', box1X + boxW / 2, boxY + 25)
    ctx.fillStyle = '#E8D5B5'
    ctx.font = 'bold 22px Arial'
    ctx.fillText(data.duration, box1X + boxW / 2, boxY + 52)

    // Score text
    ctx.fillStyle = 'rgba(232,213,181,0.5)'
    ctx.font = '11px Arial'
    ctx.fillText('Calificación', box2X + boxW / 2, boxY + 25)
    ctx.fillStyle = '#10B981'
    ctx.font = 'bold 22px Arial'
    ctx.fillText(data.score, box2X + boxW / 2, boxY + 52)

    // Code text
    ctx.fillStyle = 'rgba(232,213,181,0.5)'
    ctx.font = '11px Arial'
    ctx.fillText('Código', box3X + boxW / 2, boxY + 25)
    ctx.fillStyle = '#E8D5B5'
    ctx.font = 'bold 14px Courier New, monospace'
    ctx.fillText(data.code, box3X + boxW / 2, boxY + 52)

    // Dates
    ctx.fillStyle = 'rgba(232,213,181,0.5)'
    ctx.font = '13px Arial'
    ctx.fillText(`Fecha de emisión: ${data.date}  ·  Válido hasta: ${data.expiry}`, W / 2, 630)

    // Normative reference
    ctx.fillStyle = 'rgba(16,185,129,0.7)'
    ctx.font = '12px Arial'
    ctx.fillText('Este certificado acredita la competencia del participante conforme al', W / 2, 670)
    ctx.fillText('Decreto 1072 de 2015 y la Resolución 0312 de 2019 del Ministerio de Trabajo de Colombia.', W / 2, 688)

    // Signature lines
    ctx.strokeStyle = 'rgba(232,213,181,0.3)'
    ctx.lineWidth = 1

    // Left signature
    ctx.beginPath()
    ctx.moveTo(250, 790)
    ctx.lineTo(550, 790)
    ctx.stroke()
    ctx.fillStyle = 'rgba(232,213,181,0.6)'
    ctx.font = '13px Arial'
    ctx.fillText('Coordinador(a) SST', 400, 812)
    ctx.fillStyle = '#E8D5B5'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('Diana Ruiz Morales', 400, 835)
    ctx.fillStyle = 'rgba(232,213,181,0.4)'
    ctx.font = '11px Arial'
    ctx.fillText('Lic. SST No. 12345-COL', 400, 855)

    // Right signature
    ctx.beginPath()
    ctx.moveTo(850, 790)
    ctx.lineTo(1150, 790)
    ctx.stroke()
    ctx.fillStyle = 'rgba(232,213,181,0.6)'
    ctx.font = '13px Arial'
    ctx.fillText('Representante Legal', 1000, 812)
    ctx.fillStyle = '#E8D5B5'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('Jimmy Academy S.A.S', 1000, 835)
    ctx.fillStyle = 'rgba(232,213,181,0.4)'
    ctx.font = '11px Arial'
    ctx.fillText('NIT: 900.123.456-7', 1000, 855)

    // Bottom accent
    const botGrad = ctx.createLinearGradient(200, 0, W - 200, 0)
    botGrad.addColorStop(0, 'transparent')
    botGrad.addColorStop(0.3, '#F59E0B')
    botGrad.addColorStop(0.7, '#EF4444')
    botGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = botGrad
    ctx.fillRect(200, H - 80, W - 400, 2)

    // Footer
    ctx.fillStyle = 'rgba(232,213,181,0.3)'
    ctx.font = '10px Arial'
    ctx.fillText('Jimmy Academy SG-SST · www.jimmyacademy.co · Bogotá D.C., Colombia', W / 2, H - 50)

    resolve(canvas.toDataURL('image/png', 1.0))
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
