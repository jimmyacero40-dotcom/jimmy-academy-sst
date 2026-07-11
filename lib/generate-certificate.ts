const C = {
  green: '#0F4D24',
  greenDark: '#0A3318',
  greenMid: '#1B6B35',
  greenLight: '#2E8B4A',
  gold: '#C89B3C',
  goldLight: '#D4AD4E',
  goldDark: '#A67E1F',
  ivory: '#FDFBF5',
  white: '#FFFFFF',
  black: '#111111',
  text: '#1A1A1A',
  textMid: '#3A3A3A',
  textLight: '#666666',
}

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
  const W = 4200
  const H = 2970
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  await loadFonts()
  const titleFont = '"Cinzel", "Playfair Display", Georgia, serif'
  const elegantFont = '"Cormorant Garamond", "Playfair Display", Georgia, serif'
  const dataFont = '"Montserrat", "Segoe UI", sans-serif'
  const CX = W / 2
  const FRAME = 52

  // ═══ BACKGROUND ═══
  ctx.fillStyle = C.ivory
  ctx.fillRect(0, 0, W, H)

  // Subtle topographic texture
  ctx.globalAlpha = 0.025
  ctx.strokeStyle = C.green
  ctx.lineWidth = 1.5
  for (let i = 0; i < 45; i++) {
    ctx.beginPath()
    const baseY = i * 72 - 100
    for (let x = 0; x <= W; x += 15) {
      const y = baseY + Math.sin(x * 0.002 + i * 0.7) * 50 + Math.cos(x * 0.004 + i) * 30
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1.0

  // ═══ GEOMETRIC CORNER BLOCKS ═══
  for (const [ox, oy, dx, dy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]] as [number, number, number, number][]) {
    ctx.fillStyle = C.green
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + dx * 480, oy)
    ctx.lineTo(ox, oy + dy * 480)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = C.gold
    ctx.beginPath()
    ctx.moveTo(ox + dx * 370, oy)
    ctx.lineTo(ox + dx * 500, oy)
    ctx.lineTo(ox, oy + dy * 500)
    ctx.lineTo(ox, oy + dy * 370)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = C.greenDark
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + dx * 200, oy)
    ctx.lineTo(ox, oy + dy * 200)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = C.goldLight
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + dx * 90, oy)
    ctx.lineTo(ox, oy + dy * 90)
    ctx.closePath()
    ctx.fill()
  }

  // ═══ DOUBLE FRAME ═══
  ctx.strokeStyle = C.green
  ctx.lineWidth = 6
  ctx.strokeRect(35, 35, W - 70, H - 70)
  ctx.strokeStyle = C.gold
  ctx.lineWidth = 3
  ctx.strokeRect(FRAME, FRAME, W - FRAME * 2, H - FRAME * 2)

  // Subtle dots left
  ctx.globalAlpha = 0.08
  ctx.fillStyle = C.green
  for (let row = 0; row < 55; row++) {
    for (let col = 0; col < 4; col++) {
      const dx = 72 + col * 16
      const dy = 160 + row * 48
      if (dy < H - 160) {
        ctx.beginPath()
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.globalAlpha = 1

  // ═══ FOOTER BAR (draw first so we know exact position) ═══
  const footerH = 130
  const footerY = H - FRAME - footerH
  const fGrd = ctx.createLinearGradient(0, footerY, W, footerY)
  fGrd.addColorStop(0, C.green)
  fGrd.addColorStop(0.5, C.greenMid)
  fGrd.addColorStop(1, C.greenDark)
  ctx.fillStyle = fGrd
  ctx.fillRect(FRAME, footerY, W - FRAME * 2, footerH)
  ctx.fillStyle = C.gold
  ctx.fillRect(FRAME, footerY, W - FRAME * 2, 4)

  // Footer content
  const fsy = footerY + footerH / 2 + 2
  // Shield
  const fsx = FRAME + 110
  ctx.beginPath()
  ctx.arc(fsx, fsy, 40, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fill()
  ctx.strokeStyle = C.goldLight
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.fillStyle = C.white
  ctx.beginPath()
  ctx.moveTo(fsx, fsy - 22)
  ctx.lineTo(fsx + 18, fsy - 12)
  ctx.lineTo(fsx + 16, fsy + 12)
  ctx.quadraticCurveTo(fsx, fsy + 24, fsx, fsy + 24)
  ctx.quadraticCurveTo(fsx, fsy + 24, fsx - 16, fsy + 12)
  ctx.lineTo(fsx - 18, fsy - 12)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = C.green
  ctx.fillRect(fsx - 8, fsy - 2, 16, 4)
  ctx.fillRect(fsx - 2, fsy - 8, 4, 16)

  ctx.textAlign = 'left'
  ctx.fillStyle = C.goldLight
  ctx.font = `italic 42px ${elegantFont}`
  ctx.fillText('Capacitar hoy,', FRAME + 170, fsy - 4)
  ctx.font = `italic 700 42px ${elegantFont}`
  ctx.fillText('prevenir siempre.', FRAME + 170, fsy + 40)

  ctx.textAlign = 'right'
  ctx.fillStyle = C.white
  ctx.font = `400 24px ${dataFont}`
  ctx.fillText('Este certificado es propiedad de AgroVenture Capital S.A.S.', W - FRAME - 40, fsy - 4)
  ctx.fillText('Prohibida su reproducción sin autorización.', W - FRAME - 40, fsy + 30)

  const copW = ctx.measureText('Este certificado es propiedad de AgroVenture Capital S.A.S.').width
  const chkX = W - FRAME - 40 - copW - 35
  ctx.beginPath()
  ctx.arc(chkX, fsy + 10, 20, 0, Math.PI * 2)
  ctx.fillStyle = C.gold
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(chkX - 7, fsy + 10)
  ctx.lineTo(chkX - 2, fsy + 16)
  ctx.lineTo(chkX + 8, fsy + 4)
  ctx.strokeStyle = C.white
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  // ═══ LAYOUT ALL CONTENT PROPORTIONALLY ═══
  const usableTop = FRAME + 20
  const usableBot = footerY - 10
  const usableH = usableBot - usableTop
  const p = (frac: number) => usableTop + usableH * frac

  ctx.textAlign = 'center'

  // ── LOGO 0%-20% ──
  const logoH = usableH * 0.20
  let logoImg: HTMLImageElement | null = null
  if (data.logoUrl) { try { logoImg = await loadImage(data.logoUrl) } catch (_) {} }
  if (logoImg) {
    const lw = logoH * (logoImg.width / logoImg.height)
    ctx.drawImage(logoImg, CX - lw / 2, p(0), lw, logoH)
  } else {
    drawFallbackLogo(ctx, CX, p(0.10), dataFont)
  }

  // ── CERTIFICADO 17%-25% ──
  ctx.fillStyle = C.green
  ctx.font = `700 240px ${titleFont}`
  ctx.fillText('CERTIFICADO', CX, p(0.23))

  // DE CAPACITACIÓN
  ctx.fillStyle = C.gold
  ctx.font = `600 60px ${dataFont}`
  ctx.letterSpacing = '30px'
  ctx.fillText('DE   CAPACITACIÓN', CX + 15, p(0.265))
  ctx.letterSpacing = '0px'
  const tw = ctx.measureText('DE   CAPACITACIÓN').width + 50
  drawLine(ctx, CX - tw / 2 - 180, CX - tw / 2 - 15, p(0.265) - 14, C.gold, 3)
  drawLine(ctx, CX + tw / 2 + 15, CX + tw / 2 + 180, p(0.265) - 14, C.gold, 3)

  // ── Otorgado a: 28% ──
  ctx.fillStyle = C.textMid
  ctx.font = `italic 62px ${elegantFont}`
  ctx.fillText('Otorgado a:', CX, p(0.30))

  // ── NAME 32%-40% ──
  ctx.fillStyle = C.green
  ctx.font = `700 200px ${dataFont}`
  const nameLines = wrapText(ctx, data.employeeName.toUpperCase(), W - 700)
  let nameY = p(0.37)
  for (const line of nameLines) {
    ctx.fillText(line, CX, nameY)
    nameY += 210
  }

  // Laurel branches
  drawLaurel(ctx, 380, p(0.30), usableH * 0.14, true)
  drawLaurel(ctx, W - 380, p(0.30), usableH * 0.14, false)

  // Diamond + cédula
  const cedulaY = nameY + 75
  drawDiamond(ctx, CX, nameY + 15, 14, C.gold)
  ctx.fillStyle = C.textMid
  ctx.font = `400 48px ${dataFont}`
  ctx.fillText(`Cédula de Ciudadanía N° ${data.employeeCedula}`, CX, cedulaY)

  // ── Ha participado (relative to cédula) ──
  const haParticY = cedulaY + 100
  ctx.fillStyle = C.textMid
  ctx.font = `italic 48px ${elegantFont}`
  ctx.fillText('Ha participado y aprobado satisfactoriamente la capacitación en:', CX, haParticY)

  // ── COURSE BAR ──
  const barH = 120
  const barW = W - 280
  const barX = CX - barW / 2
  const barY = haParticY + 40

  const barGrd = ctx.createLinearGradient(barX, barY, barX + barW, barY)
  barGrd.addColorStop(0, C.green)
  barGrd.addColorStop(0.5, C.greenMid)
  barGrd.addColorStop(1, C.greenDark)
  roundRect(ctx, barX, barY, barW, barH, 60)
  ctx.fillStyle = barGrd
  ctx.fill()

  // Helmet icon left
  const hlmX = barX + 80
  const hlmY = barY + barH / 2
  ctx.beginPath()
  ctx.arc(hlmX, hlmY, 38, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fill()
  ctx.fillStyle = C.white
  ctx.beginPath()
  ctx.ellipse(hlmX, hlmY - 4, 18, 15, 0, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(hlmX - 20, hlmY + 6, 40, 5)

  // Shield icon right
  const shdX = barX + barW - 80
  ctx.beginPath()
  ctx.arc(shdX, hlmY, 38, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fill()
  ctx.fillStyle = C.white
  ctx.beginPath()
  ctx.moveTo(shdX, hlmY - 18)
  ctx.lineTo(shdX + 16, hlmY - 9)
  ctx.lineTo(shdX + 14, hlmY + 12)
  ctx.quadraticCurveTo(shdX, hlmY + 22, shdX, hlmY + 22)
  ctx.quadraticCurveTo(shdX, hlmY + 22, shdX - 14, hlmY + 12)
  ctx.lineTo(shdX - 16, hlmY - 9)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = C.green
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(shdX - 6, hlmY)
  ctx.lineTo(shdX - 1, hlmY + 6)
  ctx.lineTo(shdX + 8, hlmY - 5)
  ctx.stroke()

  // Course text
  ctx.fillStyle = C.white
  ctx.font = `700 70px ${dataFont}`
  ctx.textAlign = 'center'
  const cLines = wrapText(ctx, data.course.toUpperCase(), barW - 340)
  if (cLines.length === 1) {
    ctx.fillText(cLines[0], CX, barY + barH / 2 + 26)
  } else {
    let cl = barY + 42
    for (const l of cLines) { ctx.fillText(l, CX, cl); cl += 68 }
  }

  // ── INFO CARDS ──
  const infoY = barY + barH + 50
  const cardW = (W - 600) / 2
  const cardH = 120
  const cardGap = 60
  const totalCardsW = cardW * 2 + cardGap
  const cardStartX = CX - totalCardsW / 2

  const infoItems = [
    { icon: 'calendar', label: 'Fecha:', value: data.date },
    { icon: 'clock', label: 'Intensidad:', value: data.duration },
  ]

  for (let i = 0; i < 2; i++) {
    const bx = cardStartX + i * (cardW + cardGap)
    const by = infoY

    roundRect(ctx, bx, by, cardW, cardH, 16)
    ctx.fillStyle = '#F5F3ED'
    ctx.fill()
    ctx.strokeStyle = '#D4CDB8'
    ctx.lineWidth = 2
    ctx.stroke()

    const iconX = bx + 64
    const iconY = by + cardH / 2
    ctx.beginPath()
    ctx.arc(iconX, iconY, 34, 0, Math.PI * 2)
    ctx.fillStyle = C.green
    ctx.fill()

    ctx.strokeStyle = C.white
    ctx.fillStyle = C.white
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    if (infoItems[i].icon === 'calendar') {
      ctx.strokeRect(iconX - 13, iconY - 11, 26, 24)
      ctx.beginPath()
      ctx.moveTo(iconX - 13, iconY - 1)
      ctx.lineTo(iconX + 13, iconY - 1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(iconX - 6, iconY - 15)
      ctx.lineTo(iconX - 6, iconY - 8)
      ctx.moveTo(iconX + 6, iconY - 15)
      ctx.lineTo(iconX + 6, iconY - 8)
      ctx.stroke()
    } else if (infoItems[i].icon === 'clock') {
      ctx.beginPath()
      ctx.arc(iconX, iconY, 15, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(iconX, iconY - 8)
      ctx.lineTo(iconX, iconY)
      ctx.lineTo(iconX + 7, iconY + 5)
      ctx.stroke()
    } else {
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(iconX - 10, iconY)
      ctx.lineTo(iconX - 3, iconY + 9)
      ctx.lineTo(iconX + 10, iconY - 9)
      ctx.stroke()
    }

    ctx.textAlign = 'left'
    ctx.fillStyle = C.textLight
    ctx.font = `500 30px ${dataFont}`
    ctx.fillText(infoItems[i].label, bx + 112, by + 44)
    ctx.fillStyle = C.text
    ctx.font = `700 42px ${dataFont}`
    ctx.fillText(infoItems[i].value, bx + 112, by + 88)
  }
  ctx.textAlign = 'center'

  // ── Code + Normative ──
  const codeY = infoY + cardH + 50
  ctx.fillStyle = C.text
  ctx.font = `700 38px ${dataFont}`
  ctx.fillText(`Código de autenticidad: ${data.code}`, CX, codeY)
  ctx.fillStyle = C.textLight
  ctx.font = `italic 32px ${elegantFont}`
  ctx.fillText('Conforme al Decreto 1072 de 2015 y la Resolución 0312 de 2019 — Ministerio del Trabajo de Colombia', CX, codeY + 45)

  // ── SIGNATURES ──
  const sigLineW = 680
  const empX = 200 + sigLineW / 2
  const instrX = W - 200 - sigLineW / 2
  const sigImgH = 170
  const sigImgTop = codeY + 80

  if (data.employeeSignature) {
    try {
      const sig = await loadImage(data.employeeSignature)
      const sw = sigImgH * (sig.width / sig.height)
      ctx.drawImage(sig, empX - sw / 2, sigImgTop, sw, sigImgH)
    } catch (_) {
      // signature image failed to load — draw placeholder
      ctx.fillStyle = C.textLight
      ctx.font = `italic 34px ${elegantFont}`
      ctx.textAlign = 'center'
      ctx.fillText('Firma no registrada', empX, sigImgTop + sigImgH / 2)
    }
  } else {
    ctx.fillStyle = C.textLight
    ctx.font = `italic 34px ${elegantFont}`
    ctx.textAlign = 'center'
    ctx.fillText('Firma no registrada', empX, sigImgTop + sigImgH / 2)
  }
  if (data.instructorSignatureUrl) {
    try {
      const sig = await loadImage(data.instructorSignatureUrl)
      const sw = sigImgH * (sig.width / sig.height)
      ctx.drawImage(sig, instrX - sw / 2, sigImgTop, sw, sigImgH)
    } catch (_) {}
  }

  const sigLineY = sigImgTop + sigImgH + 5
  ctx.strokeStyle = C.textMid
  ctx.lineWidth = 2.5
  for (const sx of [empX, instrX]) {
    ctx.beginPath()
    ctx.moveTo(sx - sigLineW / 2, sigLineY)
    ctx.lineTo(sx + sigLineW / 2, sigLineY)
    ctx.stroke()
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = C.text
  ctx.font = `700 36px ${dataFont}`
  ctx.fillText('FIRMA DEL PARTICIPANTE', empX, sigLineY + 46)
  ctx.fillStyle = C.textMid
  ctx.font = `400 32px ${dataFont}`
  ctx.fillText(data.employeeName, empX, sigLineY + 84)
  ctx.fillText(`C.C. ${data.employeeCedula}`, empX, sigLineY + 118)

  ctx.fillStyle = C.text
  ctx.font = `700 36px ${dataFont}`
  ctx.fillText('JIMMY JOANNY ACERO CHAPETÓN', instrX, sigLineY + 46)
  ctx.fillStyle = C.textMid
  ctx.font = `400 32px ${dataFont}`
  ctx.fillText('C.C. 1.052.392.965', instrX, sigLineY + 84)
  ctx.fillText('Profesional en Seguridad y Salud en el Trabajo', instrX, sigLineY + 118)
  ctx.fillStyle = C.green
  ctx.font = `700 30px ${dataFont}`
  ctx.fillText('Instructor — Responsable de la Capacitación', instrX, sigLineY + 156)

  // ── SEAL centered ──
  drawPremiumSeal(ctx, CX, sigLineY - 10, dataFont)

  return canvas.toDataURL('image/png', 1.0)
}

// ═══ LAUREL BRANCHES ═══
function drawLaurel(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, left: boolean) {
  ctx.save()
  ctx.globalAlpha = 0.35
  const dir = left ? 1 : -1
  const leaves = Math.max(6, Math.floor(h / 35))
  for (let i = 0; i < leaves; i++) {
    const ly = y + (h / leaves) * (i + 0.5)
    const spread = 0.35 + (i / leaves) * 0.15
    ctx.save()
    ctx.translate(x, ly)
    ctx.rotate(dir * spread)
    ctx.fillStyle = C.gold
    ctx.beginPath()
    ctx.ellipse(dir * 28, 0, 24, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.strokeStyle = C.gold
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y + 10)
  ctx.lineTo(x, y + h - 10)
  ctx.stroke()
  ctx.restore()
}

// ═══ PREMIUM SEAL ═══
function drawPremiumSeal(ctx: CanvasRenderingContext2D, x: number, y: number, sans: string) {
  const r = 140
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 25
  ctx.shadowOffsetY = 6

  // Outer gold ring
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = C.gold
  ctx.fill()
  ctx.restore()

  // Inner green body
  ctx.beginPath()
  ctx.arc(x, y, r - 9, 0, Math.PI * 2)
  ctx.fillStyle = C.green
  ctx.fill()

  // Inner gold ring
  ctx.beginPath()
  ctx.arc(x, y, r - 20, 0, Math.PI * 2)
  ctx.strokeStyle = C.gold
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Decorative zigzag border top and bottom
  ctx.strokeStyle = C.gold
  ctx.lineWidth = 2
  for (const side of [-1, 1]) {
    ctx.beginPath()
    const zy = y + side * 55
    for (let i = -6; i <= 6; i++) {
      const zx = x + i * 12
      const zyy = zy + (i % 2 === 0 ? -4 : 4) * side
      if (i === -6) ctx.moveTo(zx, zyy)
      else ctx.lineTo(zx, zyy)
    }
    ctx.stroke()
  }

  // "REPUBLICA DE" text
  ctx.textAlign = 'center'
  ctx.fillStyle = C.gold
  ctx.font = `700 22px ${sans}`
  ctx.letterSpacing = '6px'
  ctx.fillText('REPÚBLICA DE', x + 3, y - 68)
  ctx.letterSpacing = '0px'

  // "COLOMBIA" text
  ctx.fillStyle = C.white
  ctx.font = `700 42px ${sans}`
  ctx.letterSpacing = '4px'
  ctx.fillText('COLOMBIA', x + 2, y - 32)
  ctx.letterSpacing = '0px'

  // Divider line top
  ctx.strokeStyle = C.gold
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x - 80, y - 20)
  ctx.lineTo(x + 80, y - 20)
  ctx.stroke()

  // "SG-SST" large
  ctx.fillStyle = C.white
  ctx.font = `700 72px ${sans}`
  ctx.fillText('SG-SST', x, y + 30)

  // Divider line bottom
  ctx.beginPath()
  ctx.moveTo(x - 80, y + 42)
  ctx.lineTo(x + 80, y + 42)
  ctx.stroke()

  // "SEGURIDAD Y SALUD"
  ctx.fillStyle = C.gold
  ctx.font = `600 20px ${sans}`
  ctx.letterSpacing = '3px'
  ctx.fillText('SEGURIDAD Y SALUD', x + 2, y + 70)
  ctx.fillText('EN EL TRABAJO', x + 2, y + 95)
  ctx.letterSpacing = '0px'
}

// ═══ UTILITIES ═══
function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - s)
  ctx.lineTo(x + s, y)
  ctx.lineTo(x, y + s)
  ctx.lineTo(x - s, y)
  ctx.closePath()
  ctx.fill()
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string, w: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = w
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}


function drawFallbackLogo(ctx: CanvasRenderingContext2D, x: number, y: number, sans: string) {
  ctx.textAlign = 'center'
  ctx.font = `700 90px ${sans}`
  ctx.fillStyle = C.green
  const a = 'AGRO', v = 'VENTURE'
  const wa = ctx.measureText(a).width, wv = ctx.measureText(v).width
  const t = wa + 14 + wv
  ctx.fillText(a, x - t / 2 + wa / 2, y)
  ctx.fillStyle = C.gold
  ctx.fillText(v, x - t / 2 + wa + 14 + wv / 2, y)
  roundRect(ctx, x - 130, y + 16, 260, 48, 8)
  ctx.fillStyle = C.green
  ctx.fill()
  ctx.fillStyle = C.white
  ctx.font = `700 26px ${sans}`
  ctx.letterSpacing = '10px'
  ctx.fillText('CAPITAL', x + 5, y + 48)
  ctx.letterSpacing = '0px'
}

async function loadFonts() {
  try {
    const urls: [string, string, FontFaceDescriptors][] = [
      ['Cinzel', 'https://fonts.gstatic.com/s/cinzel/v23/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYrvDE5ZdqU.woff2', { weight: '700' }],
      ['Cinzel', 'https://fonts.gstatic.com/s/cinzel/v23/8vIU7ww63mVu7gtR-kwKxNvkNOjw-j7nTYrvDE5ZdqU.woff2', {}],
      ['Cormorant Garamond', 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.woff2', {}],
      ['Cormorant Garamond', 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3WmX5slCNuHLi8bLeY9MK7whWMhyjYrEPjuw-NxBKL_y94.woff2', { style: 'italic' }],
      ['Playfair Display', 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd1unDXbtM.woff2', { weight: '700' }],
      ['Playfair Display', 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2rA0s.woff2', { style: 'italic' }],
      ['Montserrat', 'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.woff2', {}],
      ['Montserrat', 'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aXo.woff2', { weight: '700' }],
      ['Montserrat', 'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu170w5aXo.woff2', { weight: '600' }],
    ]
    const results = await Promise.allSettled(urls.map(([name, url, desc]) =>
      new FontFace(name, `url(${url})`, desc).load()
    ))
    results.forEach(r => { if (r.status === 'fulfilled') document.fonts.add(r.value) })
  } catch (_) {}
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
    if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word }
    else current = test
  }
  if (current) lines.push(current)
  return lines
}
