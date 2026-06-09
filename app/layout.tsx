import type { Metadata } from 'next'
import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'

export const metadata: Metadata = {
  title: 'Jimmy Academy SST — Plataforma #1 en Colombia para SG-SST',
  description:
    'Gestiona la Seguridad y Salud en el Trabajo de tu empresa con IA. Capacitaciones digitales, firma electrónica con validez legal y certificados automáticos.',
  keywords: 'SG-SST, seguridad salud trabajo, capacitaciones SST, firma electronica, Colombia',
  authors: [{ name: 'Jimmy Academy' }],
  openGraph: {
    title: 'Jimmy Academy SST',
    description: 'La plataforma más avanzada para gestión SST en Colombia',
    type: 'website',
    locale: 'es_CO',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  )
}
