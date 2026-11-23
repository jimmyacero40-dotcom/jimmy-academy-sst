'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, KeyRound } from 'lucide-react'

/**
 * El registro abierto está cerrado.
 *
 * Creaba un trabajador activo, sin cédula y sin que nadie lo aprobara, con
 * solo tener el enlace. Una trabajadora que ya tenía cuenta recibió un
 * recordatorio, no se supo la clave, se registró aquí, y quedó dos veces en
 * la empresa: una con su historial y otra vacía que además contaba como una
 * persona más en todos los indicadores.
 *
 * La página no se borra para que el enlace viejo —que está en correos y en
 * mensajes ya enviados— no muera en un 404, sino que diga qué hacer.
 */
export default function RegistroCerradoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0B1829' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="rounded-2xl p-8" style={{ background: '#0d1629', border: '1px solid #1e293b' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Lock size={20} style={{ color: '#F59E0B' }} />
          </div>

          <h1 className="text-xl font-semibold text-white mb-3">Aquí no se crean cuentas</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#94a3b8' }}>
            Las cuentas las crea el responsable de SST de su empresa. Si ya trabaja aquí,
            su cuenta ya existe: entre con su <strong className="text-white">cédula</strong>.
          </p>

          <Link href="/login"
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold mb-3"
            style={{ background: '#243C2C', color: '#fff', padding: '13px 20px' }}>
            <ArrowLeft size={14} /> Ir al inicio de sesión
          </Link>

          <Link href="/forgot-password"
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold"
            style={{ border: '1px solid #1e293b', color: '#94a3b8', padding: '13px 20px' }}>
            <KeyRound size={14} /> No recuerdo mi contraseña
          </Link>

          <p className="text-[11px] leading-relaxed mt-6" style={{ color: '#475569' }}>
            ¿Es nuevo en la empresa y le pasaron un enlace para diligenciar sus datos?
            Ese es otro: pídaselo a quien lo contrató.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
