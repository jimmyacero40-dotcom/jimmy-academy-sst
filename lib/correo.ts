// ─── Envío de correo ──────────────────────────────────────────────────
// La plataforma usa Resend, igual que la recuperación de contraseña. Sin la
// clave configurada no se envía nada, y eso se dice: avisar "notificado" sin
// que haya salido un correo sería peor que no avisar.
// ──────────────────────────────────────────────────────────────────────

export interface Envio { enviado: boolean; motivo?: string }

export function correoConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY
}

export async function enviarCorreo(
  para: string, asunto: string, html: string,
): Promise<Envio> {
  const clave = process.env.RESEND_API_KEY
  if (!clave) return { enviado: false, motivo: 'El envío de correo no está configurado' }
  if (!para?.trim()) return { enviado: false, motivo: 'La persona no tiene correo registrado' }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clave}` },
      body: JSON.stringify({
        from: process.env.CORREO_REMITENTE || 'AgroSafe <onboarding@resend.dev>',
        to: [para],
        subject: asunto,
        html,
      }),
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
