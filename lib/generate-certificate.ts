export async function generateCertificatePNG(data: {
  employeeName: string
  employeeCedula: string
  course: string
  date: string
  duration: string
  score: string
  code: string
  employeeSignature?: string
  logoUrl?: string
  instructorSignatureUrl?: string
}): Promise<string> {
  const canvas = document.createElement('canvas')
  const W = 1600
  const H = 1200
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ─── WHITE BACKGROUND ───
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // ─── GREEN/GOLD CORNER ACCENTS ───
  // Top-right green diagonal
  ctx.beginPath()
  ctx.moveTo(W - 350, 0)
  ctx.lineTo(W, 0)
  ctx.lineTo(W, 350)
  ctx.closePath()
  ctx.fillStyle = '#5B8C3E'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(W - 280, 0)
  ctx.lineTo(W, 0)
  ctx.lineTo(W, 280)
  ctx.closePath()
  ctx.fillStyle = '#C8922A'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(W - 200, 0)
  ctx.lineTo(W, 0)
  ctx.lineTo(W, 200)
  ctx.closePath()
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(W - 160, 0)
  ctx.lineTo(W, 0)
  ctx.lineTo(W, 160)
  ctx.closePath()
  ctx.fillStyle = '#5B8C3E'
  ctx.fill()

  // Bottom-left green diagonal
  ctx.beginPath()
  ctx.moveTo(0, H - 350)
  ctx.lineTo(0, H)
  ctx.lineTo(350, H)
  ctx.closePath()
  ctx.fillStyle = '#5B8C3E'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, H - 280)
  ctx.lineTo(0, H)
  ctx.lineTo(280, H)
  ctx.closePath()
  ctx.fillStyle = '#C8922A'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, H - 200)
  ctx.lineTo(0, H)
  ctx.lineTo(200, H)
  ctx.closePath()
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, H - 160)
  ctx.lineTo(0, H)
  ctx.lineTo(160, H)
  ctx.closePath()
  ctx.fillStyle = '#5B8C3E'
  ctx.fill()

  // Bottom-right accent
  ctx.beginPath()
  ctx.moveTo(W, H - 200)
  ctx.lineTo(W, H)
  ctx.lineTo(W - 200, H)
  ctx.closePath()
  ctx.fillStyle = '#5B8C3E'
  ctx.fill()

  // ─── THIN GOLD BORDER ───
  ctx.strokeStyle = '#C8922A'
  ctx.lineWidth = 3
  ctx.strokeRect(25, 25, W - 50, H - 50)

  ctx.textAlign = 'center'

  // ─── LOGO ───
  if (data.logoUrl) {
    try {
      const logo = await loadImage(data.logoUrl)
      const logoH = 140
      const logoW = logoH * (logo.width / logo.height)
      ctx.drawImage(logo, W / 2 - logoW / 2, 50, logoW, logoH)
    } catch (_) {
      drawTextLogo(ctx, W / 2, 120)
    }
  } else {
    drawTextLogo(ctx, W / 2, 120)
  }

  // ─── "CERTIFICADO" ───
  ctx.fillStyle = '#5B8C3E'
  ctx.font = 'bold 72px Georgia, "Times New Roman", serif'
  ctx.fillText('CERTIFICADO', W / 2, 280)

  ctx.fillStyle = '#333333'
  ctx.font = '28px Georgia, "Times New Roman", serif'
  ctx.fillText('DE CAPACITACIÓN', W / 2, 320)

  // ─── Horizontal lines ───
  ctx.strokeStyle = '#5B8C3E'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W / 2 - 200, 345)
  ctx.lineTo(W / 2 + 200, 345)
  ctx.stroke()

  // ─── "Se certifica que:" ───
  ctx.fillStyle = '#666666'
  ctx.font = 'italic 22px Georgia, "Times New Roman", serif'
  ctx.fillText('Se certifica que:', W / 2, 390)

  // ─── EMPLOYEE NAME ───
  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 48px Georgia, "Times New Roman", serif'
  ctx.fillText(data.employeeName, W / 2, 450)

  // ─── Cédula ───
  ctx.fillStyle = '#555555'
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText(`Con cédula de ciudadanía N° ${data.employeeCedula}`, W / 2, 490)

  // ─── "Participó y aprobó..." ───
  ctx.fillStyle = '#555555'
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText('Participó y aprobó satisfactoriamente la capacitación:', W / 2, 540)

  // ─── COURSE NAME ───
  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 36px Georgia, "Times New Roman", serif'
  const maxCourseW = W - 300
  const courseLines = wrapText(ctx, data.course.toUpperCase(), maxCourseW)
  let courseY = 590
  for (const line of courseLines) {
    ctx.fillText(line, W / 2, courseY)
    courseY += 42
  }

  // ─── Date and duration ───
  ctx.fillStyle = '#555555'
  ctx.font = 'italic 20px Georgia, "Times New Roman", serif'
  ctx.fillText(`Realizada el ${data.date},`, W / 2, courseY + 20)
  ctx.fillText(`con una duración de ${data.duration}.`, W / 2, courseY + 48)

  // ─── GOLD SEAL / BADGE (right side) ───
  const sealX = W - 250
  const sealY = 450
  drawSeal(ctx, sealX, sealY, 110)

  // ─── Info boxes (right side) ───
  const boxX = W - 350
  const boxW = 220
  const boxes = [
    { label: 'Fecha:', value: data.date },
    { label: 'Calificación:', value: data.score },
    { label: 'Código de verificación:', value: data.code },
  ]
  let boxY = sealY + 140
  for (const box of boxes) {
    ctx.fillStyle = '#F0EDE8'
    roundRect(ctx, boxX, boxY, boxW, 55, 8)
    ctx.fill()
    ctx.fillStyle = '#888888'
    ctx.font = '12px Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(box.label, boxX + 15, boxY + 22)
    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 14px Arial, sans-serif'
    ctx.fillText(box.value, boxX + 15, boxY + 42)
    ctx.textAlign = 'center'
    boxY += 65
  }

  // ─── INSTRUCTOR SIGNATURE ───
  const sigY = courseY + 100
  if (data.instructorSignatureUrl) {
    try {
      const sig = await loadImage(data.instructorSignatureUrl)
      const sigH = 80
      const sigW = sigH * (sig.width / sig.height)
      ctx.drawImage(sig, W / 2 - sigW / 2, sigY - 40, sigW, sigH)
    } catch (_) {}
  }

  // Signature line
  ctx.strokeStyle = '#AAAAAA'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 180, sigY + 50)
  ctx.lineTo(W / 2 + 180, sigY + 50)
  ctx.stroke()

  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText('JIMMY JOANNY ACERO CHAPETÓN', W / 2, sigY + 75)

  ctx.fillStyle = '#555555'
  ctx.font = '13px Arial, sans-serif'
  ctx.fillText('Cédula: 1052392965', W / 2, sigY + 95)
  ctx.fillText('Profesional en Seguridad y Salud en el Trabajo', W / 2, sigY + 113)
  ctx.fillText('Instructor – Responsable de la Capacitación', W / 2, sigY + 131)

  // ─── EMPLOYEE SIGNATURE (left side) ───
  if (data.employeeSignature) {
    try {
      const empSig = await loadImage(data.employeeSignature)
      const empSigH = 70
      const empSigW = empSigH * (empSig.width / empSig.height)
      ctx.drawImage(empSig, 200 - empSigW / 2, sigY - 30, empSigW, empSigH)
    } catch (_) {}
  }

  ctx.strokeStyle = '#AAAAAA'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, sigY + 50)
  ctx.lineTo(320, sigY + 50)
  ctx.stroke()

  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 14px Arial, sans-serif'
  ctx.fillText('FIRMA DEL PARTICIPANTE', 200, sigY + 75)

  ctx.fillStyle = '#555555'
  ctx.font = '13px Arial, sans-serif'
  ctx.fillText(data.employeeName, 200, sigY + 95)
  ctx.fillText(`C.C. ${data.employeeCedula}`, 200, sigY + 113)

  // ─── FOOTER ───
  // Shield icon + text
  ctx.fillStyle = '#5B8C3E'
  ctx.font = '13px Arial, sans-serif'
  const footY = H - 60
  ctx.fillText('Capacitar hoy, prevenir siempre.', 180, footY)

  ctx.fillStyle = '#888888'
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('Conforme al Decreto 1072 de 2015 y la Resolución 0312 de 2019 – Ministerio de Trabajo de Colombia', W / 2, H - 35)

  return canvas.toDataURL('image/png', 1.0)
}

function drawTextLogo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.font = 'bold 40px Arial, sans-serif'
  ctx.fillStyle = '#5B8C3E'
  ctx.fillText('AGRO', x - 80, y)
  ctx.fillStyle = '#C8922A'
  ctx.fillText('VENTURE', x + 60, y)

  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, x - 55, y + 10, 110, 28, 4)
  ctx.fillStyle = '#5B8C3E'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Arial, sans-serif'
  ctx.fillText('C A P I T A L', x, y + 30)
}

function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // Outer gold ring with teeth
  const teeth = 24
  ctx.beginPath()
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i * Math.PI) / teeth
    const radius = i % 2 === 0 ? r + 12 : r - 2
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  const goldGrad = ctx.createRadialGradient(x, y, r - 20, x, y, r + 15)
  goldGrad.addColorStop(0, '#D4A843')
  goldGrad.addColorStop(0.5, '#C8922A')
  goldGrad.addColorStop(1, '#A07520')
  ctx.fillStyle = goldGrad
  ctx.fill()

  // Inner green circle
  ctx.beginPath()
  ctx.arc(x, y, r - 18, 0, Math.PI * 2)
  ctx.fillStyle = '#4A7A2E'
  ctx.fill()

  // Inner dark green circle
  ctx.beginPath()
  ctx.arc(x, y, r - 30, 0, Math.PI * 2)
  ctx.fillStyle = '#3D6B25'
  ctx.fill()

  // Shield icon (simplified)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '36px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('🛡️', x, y - 10)

  // Star
  ctx.fillStyle = '#D4A843'
  ctx.font = '24px Arial'
  ctx.fillText('★', x, y + 25)

  // Text around seal
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 9px Arial, sans-serif'
  const sealText = 'COMPROMETIDOS CON LA SEGURIDAD, LA PREVENCIÓN Y EL BIENESTAR'
  const arcRadius = r - 6
  ctx.save()
  ctx.translate(x, y)
  const startAngle = -Math.PI * 0.75
  const arcLen = Math.PI * 1.5
  for (let i = 0; i < sealText.length; i++) {
    const angle = startAngle + (i / sealText.length) * arcLen
    ctx.save()
    ctx.rotate(angle)
    ctx.translate(0, -arcRadius)
    ctx.rotate(Math.PI / 2)
    ctx.fillText(sealText[i], 0, 0)
    ctx.restore()
  }
  ctx.restore()

  // Laurel wreath (simplified with leaf shapes)
  ctx.strokeStyle = '#5B8C3E'
  ctx.lineWidth = 2
  for (let side = -1; side <= 1; side += 2) {
    for (let j = 0; j < 6; j++) {
      const a = (side === -1 ? Math.PI * 0.6 : Math.PI * 0.4) - side * j * 0.18
      const lx = x + Math.cos(a) * (r + 20) * 0.85
      const ly = y + Math.sin(a) * (r + 20) * 0.85
      ctx.beginPath()
      ctx.ellipse(lx, ly, 8, 4, a + Math.PI / 2, 0, Math.PI * 2)
      ctx.fillStyle = '#5B8C3E'
      ctx.fill()
    }
  }

  // Green ribbon
  ctx.fillStyle = '#5B8C3E'
  ctx.beginPath()
  ctx.moveTo(x - 25, y + r + 5)
  ctx.lineTo(x - 35, y + r + 40)
  ctx.lineTo(x - 15, y + r + 30)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(x + 25, y + r + 5)
  ctx.lineTo(x + 35, y + r + 40)
  ctx.lineTo(x + 15, y + r + 30)
  ctx.closePath()
  ctx.fill()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}
