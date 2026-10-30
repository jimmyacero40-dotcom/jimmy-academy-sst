// ─── Envío de correo ──────────────────────────────────────────────────
// Sale por el Gmail de la empresa (CORREO_USUARIO + CORREO_CLAVE, que es una
// contraseña de aplicación, no la clave de entrar). Si ese par no está, se
// intenta Resend, que es lo que usa la recuperación de contraseña.
//
// Sin ninguno de los dos no se envía nada, y eso se dice: avisar "notificado"
// sin que haya salido un correo sería peor que no avisar.
// ──────────────────────────────────────────────────────────────────────

import nodemailer, { type Transporter } from 'nodemailer'

export interface Envio { enviado: boolean; motivo?: string }

function porGmail(): boolean {
  return !!(process.env.CORREO_USUARIO && process.env.CORREO_CLAVE)
}

export function correoConfigurado(): boolean {
  return porGmail() || !!process.env.RESEND_API_KEY
}

/** Quién aparece como remitente. */
export function remitente(): string {
  if (process.env.CORREO_REMITENTE) return process.env.CORREO_REMITENTE
  if (porGmail()) return `AgroSafe SST <${process.env.CORREO_USUARIO}>`
  return 'AgroSafe <onboarding@resend.dev>'
}

// La conexión se reusa: abrir una por cada correo hace que Google corte a la
// mitad de un envío de cuarenta personas.
let transporte: Transporter | null = null
function conexion(): Transporter {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.CORREO_USUARIO,
        // Google la entrega en cuatro grupos; si quedó con espacios, igual sirve.
        pass: (process.env.CORREO_CLAVE || '').replace(/\s+/g, ''),
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
    })
  }
  return transporte
}

/** Traduce al español lo que Google contesta cuando algo sale mal. */
function motivoLegible(e: any): string {
  const texto = String(e?.response || e?.message || '')
  if (/Invalid login|535|BadCredentials/i.test(texto)) {
    return 'Google rechazó la contraseña de aplicación. Hay que generarla de nuevo.'
  }
  if (/Daily user sending (limit|quota) exceeded|550 5\.4\.5/i.test(texto)) {
    return 'Se llegó al tope de correos que Google deja enviar hoy. Vuelva a intentar mañana.'
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(texto)) {
    return 'No hubo conexión con el servidor de correo.'
  }
  return texto.slice(0, 150) || 'Error enviando el correo'
}

export async function enviarCorreo(
  para: string, asunto: string, html: string,
): Promise<Envio> {
  if (!correoConfigurado()) {
    return { enviado: false, motivo: 'El envío de correo no está configurado' }
  }
  if (!para?.trim()) return { enviado: false, motivo: 'La persona no tiene correo registrado' }

  if (porGmail()) {
    try {
      await conexion().sendMail({ from: remitente(), to: para, subject: asunto, html })
      return { enviado: true }
    } catch (e: any) {
      return { enviado: false, motivo: motivoLegible(e) }
    }
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: remitente(), to: [para], subject: asunto, html }),
    })
    if (!r.ok) {
      const d = await r.text()
      return { enviado: false, motivo: `Resend: ${d.slice(0, 120)}` }
    }
    return { enviado: true }
  } catch (e: any) {
    return { enviado: false, motivo: e?.message ?? 'Error de conexión' }
  }
}

/** El aviso de una capacitación, en el tono en que se le habla al trabajador. */
export function plantillaCapacitacion(opciones: {
  nombre: string
  curso: string
  fecha: string | null
  duracion: string | null
  modalidad: string | null
  recordatorio?: boolean
}): { asunto: string; html: string } {
  const { nombre, curso, fecha, duracion, modalidad, recordatorio } = opciones
  const cuando = fecha
    ? new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Por confirmar'

  const asunto = recordatorio
    ? `Recordatorio: ${curso}`
    : `Capacitación asignada: ${curso}`

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:560px">
      <h2 style="color:#047857;margin:0 0 4px">${recordatorio ? 'Recordatorio de capacitación' : 'Le asignaron una capacitación'}</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:13px">AgroSafe · Seguridad y Salud en el Trabajo</p>
      <p>Buen día, <b>${nombre}</b>.</p>
      <p>${recordatorio
        ? 'Le recordamos que tiene pendiente la siguiente capacitación:'
        : 'Se le asignó la siguiente capacitación:'}</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#6B7280">Tema</td><td style="padding:4px 0"><b>${curso}</b></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6B7280">Fecha</td><td style="padding:4px 0">${cuando}</td></tr>
        ${duracion ? `<tr><td style="padding:4px 12px 4px 0;color:#6B7280">Duración</td><td style="padding:4px 0">${duracion}</td></tr>` : ''}
        ${modalidad ? `<tr><td style="padding:4px 12px 4px 0;color:#6B7280">Modalidad</td><td style="padding:4px 0">${modalidad}</td></tr>` : ''}
      </table>
      <p style="font-size:13px;color:#6B7280">Su asistencia es parte del Sistema de Gestión de Seguridad y Salud en el Trabajo.</p>
    </div>`

  return { asunto, html }
}
