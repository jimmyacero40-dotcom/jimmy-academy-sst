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

/**
 * A qué dirección se le escribe a una persona.
 *
 * Hay dos sitios donde puede estar: `users.correo`, que llena quien administra
 * al crear la cuenta, y `worker_profiles.email_personal`, que llena el
 * trabajador en su propia ficha. Los avisos leían solo el primero, así que
 * quien escribió su correo en la ficha —que es lo que la plataforma le pide
 * hacer— seguía sin recibir nada, y el sistema anotaba «no tiene correo
 * registrado» cuando sí lo tenía.
 *
 * Manda el de la cuenta si lo hay; si no, el de la ficha.
 */
export function direccionDe(persona: {
  correo?: string | null
  worker_profiles?: { email_personal?: string | null } | { email_personal?: string | null }[] | null
  email_personal?: string | null
} | null | undefined): string {
  if (!persona) return ''
  const deLaCuenta = (persona.correo ?? '').trim()
  if (deLaCuenta) return deLaCuenta

  const ficha = Array.isArray(persona.worker_profiles) ? persona.worker_profiles[0] : persona.worker_profiles
  return ((ficha?.email_personal ?? persona.email_personal) ?? '').trim()
}

/**
 * El buzón y la clave de Gmail, con los nombres que puedan traer.
 *
 * El otro proyecto de la misma cuenta los guarda como `GMAIL_USER` y
 * `GMAIL_APP_PASSWORD`, y el remitente como `EMAIL_FROM`. Aceptar los dos
 * juegos de nombres evita que el correo quede mudo por haber escrito el
 * rótulo que se usaba en el proyecto de al lado.
 */
const usuarioGmail = () => process.env.CORREO_USUARIO || process.env.GMAIL_USER || ''
const claveGmail = () => process.env.CORREO_CLAVE || process.env.GMAIL_APP_PASSWORD || ''

function porGmail(): boolean {
  return !!(usuarioGmail() && claveGmail())
}

export function correoConfigurado(): boolean {
  return porGmail() || !!process.env.RESEND_API_KEY
}

/** Quién aparece como remitente. */
export function remitente(): string {
  const propio = process.env.CORREO_REMITENTE || process.env.EMAIL_FROM
  if (propio) return propio
  if (porGmail()) return `AgroSafe SST <${usuarioGmail()}>`
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
        user: usuarioGmail(),
        // Google la entrega en cuatro grupos; si quedó con espacios, igual sirve.
        pass: claveGmail().replace(/\s+/g, ''),
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
    })
  }
  return transporte
}

/**
 * Comprueba que la cuenta de correo sirve, sin mandarle nada a nadie.
 *
 * Abre la sesión con Google y la cierra. Hace falta porque hasta ahora la
 * única forma de saber si el envío estaba bien configurado era asignarle una
 * capacitación a alguien y ver si le llegaba: un aviso de verdad, a una
 * persona de verdad, para averiguar algo del servidor.
 */
export async function probarCorreo(): Promise<{
  sirve: boolean; motivo?: string; proveedor: 'gmail' | 'resend' | null
}> {
  if (!correoConfigurado()) {
    return { sirve: false, proveedor: null, motivo: 'No hay credenciales de correo en este servidor' }
  }

  if (porGmail()) {
    try {
      await conexion().verify()
      return { sirve: true, proveedor: 'gmail' }
    } catch (e) {
      return { sirve: false, proveedor: 'gmail', motivo: motivoLegible(e) }
    }
  }

  // Resend sin dominio verificado solo le escribe a la dueña de la cuenta.
  // Acepta la llave, contesta que todo bien al probarla, y después rechaza
  // cada correo dirigido a otra persona: por fuera parece configurado y por
  // dentro no le llega a nadie. Por eso aquí se miran los dominios y no solo
  // si la llave existe.
  try {
    const r = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })
    if (r.status === 401 || r.status === 403) {
      return { sirve: false, proveedor: 'resend', motivo: 'Resend no acepta la llave: hay que generarla de nuevo.' }
    }
    const d = await r.json().catch(() => null)
    const dominios: any[] = d?.data ?? []
    const verificado = dominios.find(x => x?.status === 'verified')
    if (!verificado) {
      return {
        sirve: false, proveedor: 'resend',
        motivo: 'Resend está en modo de prueba: solo le escribe a la dirección dueña de la cuenta, '
          + 'y a los demás les dice que sí pero no les llega. Hay que verificar un dominio propio, '
          + 'o usar la cuenta de Gmail poniendo CORREO_USUARIO y CORREO_CLAVE en este servidor.',
      }
    }
    return { sirve: true, proveedor: 'resend' }
  } catch (e: any) {
    return { sirve: false, proveedor: 'resend', motivo: e?.message ?? 'No hubo conexión con Resend' }
  }
}

/** El remitente, con el buzón tapado: sirve para reconocerlo, no para copiarlo. */
export function remitenteTapado(): string {
  const dir = porGmail()
    ? usuarioGmail().trim()
    : remitente().replace(/^.*<|>$/g, '').trim()
  if (!dir) return '—'
  return dir.replace(/^(.{2}).*(@.*)$/, '$1•••$2')
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
      // Se saca el mensaje del JSON en vez de cortar el texto crudo: la
      // versión anterior guardaba «Resend: {"message":"You can only send…» y
      // tijereteaba justo antes de la parte que decía qué hacer.
      const crudo = await r.text()
      let detalle = crudo
      try { detalle = JSON.parse(crudo)?.message ?? crudo } catch {}
      if (/only send testing emails/i.test(detalle)) {
        detalle = 'Resend está en modo de prueba: solo le escribe a la dirección dueña de la cuenta. '
          + 'A los demás no les llega, aunque el envío no dé error visible.'
      }
      return { enviado: false, motivo: `Resend: ${detalle.slice(0, 220)}` }
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
