// ─── Paleta del certificado ───────────────────────────────────────────
// Sale de la identidad de AgroSafe, no del verde y dorado de AgroVenture:
// el certificado lo emite la plataforma y tiene que leerse como suya.
//
// La marca tiene dos vestidos -Navy y Green- y el certificado se pone el
// mismo que lleve puesto la plataforma, para que el documento que descarga
// el trabajador no vaya de un color y la pantalla de otro.
type Paleta = {
  base: string; baseOscuro: string; baseMedio: string; baseClaro: string
  acento: string; acentoClaro: string; acentoOscuro: string
  papel: string; white: string
  texto: string; textoMedio: string; textoTenue: string
  tarjeta: string; tarjetaBorde: string
}

const PALETAS: Record<string, Paleta> = {
  // AgroSafe Navy — el recomendado, y el que viste la pantalla de ingreso.
  light: {
    base: '#0B1736', baseOscuro: '#060E22', baseMedio: '#16284F', baseClaro: '#24406F',
    acento: '#06B6D4', acentoClaro: '#7DD9EA', acentoOscuro: '#0E7490',
    papel: '#FBFCFE', white: '#FFFFFF',
    texto: '#0F172A', textoMedio: '#33415C', textoTenue: '#6B7A90',
    tarjeta: '#F1F5FA', tarjetaBorde: '#D5E0EC',
  },
  // AgroSafe Green.
  verde: {
    base: '#234B27', baseOscuro: '#16301A', baseMedio: '#2F6435', baseClaro: '#3F8347',
    acento: '#6BA644', acentoClaro: '#A9CF86', acentoOscuro: '#4A7A2C',
    papel: '#FBFDFA', white: '#FFFFFF',
    texto: '#16210F', textoMedio: '#3A472C', textoTenue: '#6E7C5E',
    tarjeta: '#F2F7EE', tarjetaBorde: '#D8E4CD',
  },
}

/** La paleta en uso. Se fija al empezar a dibujar. */
let C: Paleta = PALETAS.light

function paletaActiva(): Paleta {
  try {
    const tema = document.documentElement.getAttribute('data-theme') ?? 'light'
    return PALETAS[tema] ?? PALETAS.light
  } catch {
    return PALETAS.light
  }
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

  C = paletaActiva()

  await loadFonts()
  const titleFont = '"Cinzel", "Playfair Display", Georgia, serif'
  const elegantFont = '"Cormorant Garamond", "Playfair Display", Georgia, serif'
  const dataFont = '"Montserrat", "Segoe UI", sans-serif'
  const CX = W / 2
  const FRAME = 52

  // ═══ BACKGROUND ═══
  ctx.fillStyle = C.papel
  ctx.fillRect(0, 0, W, H)

  // Subtle topographic texture
  ctx.globalAlpha = 0.025
  ctx.strokeStyle = C.base
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
  // Solo las dos de abajo: arriba el peso lo lleva la banda del logo, y
  // cuatro esquinas macizas además de la banda cargaban el documento.
  for (const [ox, oy, dx, dy] of [[0, H, 1, -1], [W, H, -1, -1]] as [number, number, number, number][]) {
    ctx.fillStyle = C.base
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + dx * 420, oy)
    ctx.lineTo(ox, oy + dy * 420)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = C.acento
    ctx.beginPath()
    ctx.moveTo(ox + dx * 330, oy)
    ctx.lineTo(ox + dx * 440, oy)
    ctx.lineTo(ox, oy + dy * 440)
    ctx.lineTo(ox, oy + dy * 330)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = C.baseOscuro
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + dx * 170, oy)
    ctx.lineTo(ox, oy + dy * 170)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = C.acentoClaro
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + dx * 80, oy)
    ctx.lineTo(ox, oy + dy * 80)
    ctx.closePath()
    ctx.fill()
  }

  // ═══ DOUBLE FRAME ═══
  ctx.strokeStyle = C.base
  ctx.lineWidth = 6
  ctx.strokeRect(35, 35, W - 70, H - 70)
  ctx.strokeStyle = C.acento
  ctx.lineWidth = 3
  ctx.strokeRect(FRAME, FRAME, W - FRAME * 2, H - FRAME * 2)

  // Subtle dots left
  ctx.globalAlpha = 0.08
  ctx.fillStyle = C.base
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
  fGrd.addColorStop(0, C.base)
  fGrd.addColorStop(0.5, C.baseMedio)
  fGrd.addColorStop(1, C.baseOscuro)
  ctx.fillStyle = fGrd
  ctx.fillRect(FRAME, footerY, W - FRAME * 2, footerH)
  ctx.fillStyle = C.acento
  ctx.fillRect(FRAME, footerY, W - FRAME * 2, 4)

  // Footer content
  const fsy = footerY + footerH / 2 + 2
  // Shield
  const fsx = FRAME + 110
  ctx.beginPath()
  ctx.arc(fsx, fsy, 40, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fill()
  ctx.strokeStyle = C.acentoClaro
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
  ctx.fillStyle = C.base
  ctx.fillRect(fsx - 8, fsy - 2, 16, 4)
  ctx.fillRect(fsx - 2, fsy - 8, 4, 16)

  ctx.textAlign = 'left'
  ctx.fillStyle = C.acentoClaro
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
  ctx.fillStyle = C.acento
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

  // ── BANDA DEL LOGO ──
  // El logo de AgroSafe es blanco sobre transparente, hecho para fondos
  // oscuros: sobre el papel del certificado sería invisible. Va sobre una
  // banda del color de la marca, que es además como se ve en la plataforma.
  const bandaH = Math.round(usableH * 0.20)
  const bandaY = usableTop
  const bGrd = ctx.createLinearGradient(0, bandaY, 0, bandaY + bandaH)
  bGrd.addColorStop(0, C.baseOscuro)
  bGrd.addColorStop(1, C.base)
  ctx.fillStyle = bGrd
  ctx.fillRect(FRAME, bandaY, W - FRAME * 2, bandaH)
  ctx.fillStyle = C.acento
  ctx.fillRect(FRAME, bandaY + bandaH - 5, W - FRAME * 2, 5)

  let logoImg: HTMLImageElement | null = null
  if (data.logoUrl) { try { logoImg = await loadImage(data.logoUrl) } catch (_) {} }
  if (logoImg) {
    const logoH = bandaH * 0.62
    const lw = logoH * (logoImg.width / logoImg.height)
    ctx.drawImage(logoImg, CX - lw / 2, bandaY + (bandaH - logoH) / 2, lw, logoH)
  } else {
    drawFallbackLogo(ctx, CX, bandaY + bandaH / 2, dataFont)
  }

  // El resto del contenido se reparte bajo la banda.
  const contTop = bandaY + bandaH
  const contH = usableBot - contTop
  const q = (frac: number) => contTop + contH * frac

  // ── CERTIFICADO ──
  ctx.fillStyle = C.base
  ctx.font = `700 240px ${titleFont}`
  ctx.fillText('CERTIFICADO', CX, q(0.10))

  // DE CAPACITACIÓN
  const subY = q(0.138)
  ctx.fillStyle = C.acentoOscuro
  ctx.font = `600 60px ${dataFont}`
  ctx.letterSpacing = '30px'
  ctx.fillText('DE   CAPACITACIÓN', CX + 15, subY)
  // El ancho se mide CON el espaciado puesto. Midiéndolo después de quitarlo
  // salía más corto de lo que ocupa, y las rayitas se montaban sobre el texto.
  const tw = ctx.measureText('DE   CAPACITACIÓN').width + 60
  ctx.letterSpacing = '0px'
  drawLine(ctx, CX - tw / 2 - 190, CX - tw / 2 - 40, subY - 18, C.acento, 3)
  drawLine(ctx, CX + tw / 2 + 40, CX + tw / 2 + 190, subY - 18, C.acento, 3)

  // ── Otorgado a: ──
  ctx.fillStyle = C.textoMedio
  ctx.font = `italic 62px ${elegantFont}`
  ctx.fillText('Otorgado a:', CX, q(0.195))

  // ── NOMBRE ──
  ctx.fillStyle = C.base
  ctx.font = `700 200px ${dataFont}`
  const nameLines = wrapText(ctx, data.employeeName.toUpperCase(), W - 700)
  let nameY = q(0.275)
  // El salto va ENTRE renglones, no después del último. Sumándolo siempre, un
  // nombre de dos líneas dejaba un vacío de más bajo el nombre y el documento
  // quedaba descompensado según lo largo que fuera.
  nameLines.forEach((line, i) => {
    ctx.fillText(line, CX, nameY)
    if (i < nameLines.length - 1) nameY += 210
  })

  // Rombo + cédula
  const cedulaY = nameY + 160
  drawDiamond(ctx, CX, cedulaY - 62, 14, C.acento)
  ctx.fillStyle = C.textoMedio
  ctx.font = `400 48px ${dataFont}`
  ctx.fillText(`Cédula de Ciudadanía N° ${data.employeeCedula}`, CX, cedulaY)

  // ── Ha participado (relative to cédula) ──
  const haParticY = cedulaY + 105
  ctx.fillStyle = C.textoMedio
  ctx.font = `italic 48px ${elegantFont}`
  ctx.fillText('Ha participado y aprobado satisfactoriamente la capacitación en:', CX, haParticY)

  // ── COURSE BAR ──
  const barH = 130
  const barW = W - 280
  const barX = CX - barW / 2
  const barY = haParticY + 45

  const barGrd = ctx.createLinearGradient(barX, barY, barX + barW, barY)
  barGrd.addColorStop(0, C.base)
  barGrd.addColorStop(0.5, C.baseMedio)
  barGrd.addColorStop(1, C.baseOscuro)
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
  ctx.strokeStyle = C.base
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
  const infoY = barY + barH + 70
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
    ctx.fillStyle = C.base
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
    ctx.fillStyle = C.textoTenue
    ctx.font = `500 30px ${dataFont}`
    ctx.fillText(infoItems[i].label, bx + 112, by + 44)
    ctx.fillStyle = C.texto
    ctx.font = `700 42px ${dataFont}`
    ctx.fillText(infoItems[i].value, bx + 112, by + 88)
  }
  ctx.textAlign = 'center'

  // ── Code + Normative ──
  const codeY = infoY + cardH + 75
  ctx.fillStyle = C.texto
  ctx.font = `700 38px ${dataFont}`
  ctx.fillText(`Código de autenticidad: ${data.code}`, CX, codeY)
  ctx.fillStyle = C.textoTenue
  ctx.font = `italic 32px ${elegantFont}`
  ctx.fillText('Conforme al Decreto 1072 de 2015 y la Resolución 0312 de 2019 — Ministerio del Trabajo de Colombia', CX, codeY + 45)

  // ── SIGNATURES ──
  const sigLineW = 760
  const empX = 320 + sigLineW / 2
  const instrX = W - 320 - sigLineW / 2
  const sigImgH = 170
  // Las firmas se anclan abajo, a una distancia fija del pie, en vez de
  // colgar de lo que haya encima. Si no, un nombre de una línea subía todo el
  // bloque y dejaba un vacío al final; uno de dos líneas lo bajaba. Así el
  // certificado se ve igual de equilibrado sea quien sea el trabajador, y el
  // `max` evita que se monte sobre el código cuando el nombre es largo.
  const altoFirma = sigImgH + 5 + 156
  const sigImgTop = Math.max(codeY + 110, usableBot - 60 - altoFirma)

  if (data.employeeSignature) {
    try {
      const sig = await loadImage(data.employeeSignature)
      const sw = sigImgH * (sig.width / sig.height)
      ctx.drawImage(sig, empX - sw / 2, sigImgTop, sw, sigImgH)
    } catch (_) {
      // signature image failed to load — draw placeholder
      ctx.fillStyle = C.textoTenue
      ctx.font = `italic 34px ${elegantFont}`
      ctx.textAlign = 'center'
      ctx.fillText('Firma no registrada', empX, sigImgTop + sigImgH / 2)
    }
  } else {
    ctx.fillStyle = C.textoTenue
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
  ctx.strokeStyle = C.textoMedio
  ctx.lineWidth = 2.5
  for (const sx of [empX, instrX]) {
    ctx.beginPath()
    ctx.moveTo(sx - sigLineW / 2, sigLineY)
    ctx.lineTo(sx + sigLineW / 2, sigLineY)
    ctx.stroke()
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = C.texto
  ctx.font = `700 36px ${dataFont}`
  ctx.fillText('FIRMA DEL PARTICIPANTE', empX, sigLineY + 46)
  ctx.fillStyle = C.textoMedio
  ctx.font = `400 32px ${dataFont}`
  ctx.fillText(data.employeeName, empX, sigLineY + 84)
  ctx.fillText(`C.C. ${data.employeeCedula}`, empX, sigLineY + 118)

  ctx.fillStyle = C.texto
  ctx.font = `700 36px ${dataFont}`
  ctx.fillText('JIMMY JOANNY ACERO CHAPETÓN', instrX, sigLineY + 46)
  ctx.fillStyle = C.textoMedio
  ctx.font = `400 32px ${dataFont}`
  ctx.fillText('C.C. 1.052.392.965', instrX, sigLineY + 84)
  ctx.fillText('Profesional en Seguridad y Salud en el Trabajo', instrX, sigLineY + 118)
  ctx.fillStyle = C.base
  ctx.font = `700 30px ${dataFont}`
  ctx.fillText('Instructor — Responsable de la Capacitación', instrX, sigLineY + 156)

  return canvas.toDataURL('image/png', 1.0)
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
  ctx.fillStyle = C.base
  const a = 'AGRO', v = 'VENTURE'
  const wa = ctx.measureText(a).width, wv = ctx.measureText(v).width
  const t = wa + 14 + wv
  ctx.fillText(a, x - t / 2 + wa / 2, y)
  ctx.fillStyle = C.acento
  ctx.fillText(v, x - t / 2 + wa + 14 + wv / 2, y)
  roundRect(ctx, x - 130, y + 16, 260, 48, 8)
  ctx.fillStyle = C.base
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
