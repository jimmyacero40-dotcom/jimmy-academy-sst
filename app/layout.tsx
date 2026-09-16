import type { Metadata } from 'next'
import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'AgroSafe — Plataforma Integral de Gestión del Personal',
  description:
    'AgroSafe: plataforma profesional para la gestión integral del personal agroindustrial. Seguridad y Salud en el Trabajo, capacitaciones SSTudio, firma electrónica y certificados.',
  keywords: 'AgroSafe, SG-SST, gestión personal, seguridad agroindustrial, capacitaciones, Colombia',
  authors: [{ name: 'AgroSafe' }],
  openGraph: {
    title: 'AgroSafe — La cultura que nos protege',
    description: 'Plataforma integral de gestión del personal para el sector agroindustrial',
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
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('sst-theme');
              var valid = ['dark','light','navy','verde','academy'];
              if (t && valid.indexOf(t) !== -1) document.documentElement.setAttribute('data-theme', t);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="antialiased">
        <SessionProviderWrapper>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
