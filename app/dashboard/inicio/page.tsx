'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CalendarDays, GraduationCap, HeartPulse, HardHat,
  Award, Users, ArrowRight, Megaphone, ShieldCheck, Loader2, PenLine,
  Image as ImageIcon,
} from 'lucide-react'
import { COLOR, TIPO, anchoDe, type Tarjeta } from '@/lib/tablero'
import { useRol } from '@/lib/usar-rol'

const fecha = (d?: string | null) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

/**
 * "martes, 17 de noviembre de 2026" → "Martes, 17 de noviembre de 2026".
 *
 * Solo la primera letra. La regla de CSS `capitalize` toca todas las palabras
 * y dejaría "Martes 17 De Noviembre De 2026".
 */
const conMayuscula = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : '')

export default function InicioPage() {
  const { esAdmin } = useRol()
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  const [cargando, setCargando] = useState(true)
  // La fecha se arma en el navegador y no en el servidor: el servidor corre en
  // UTC, así que entre las 7 de la noche y la medianoche escribía el día
  // siguiente. Queda vacía en el primer pintado y se llena al montar, que es
  // lo que evita que el servidor y el navegador rindan textos distintos.
  const [hoy, setHoy] = useState('')

  useEffect(() => {
    fetch('/api/tablero')
      .then(r => r.json())
      .then(d => setTarjetas(d.tarjetas ?? []))
      .catch(() => setTarjetas([]))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    setHoy(new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }))
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {conMayuscula(hoy) || ' '}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-label)' }}>
            Lo destacado en seguridad y salud en el trabajo
          </p>
        </div>
        {esAdmin && (
          <Link href="/dashboard/inicio/editar"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--primary-dim)', color: 'var(--primary-dark)', border: '1px solid var(--primary-border)' }}>
            <PenLine size={15} /> Editar tablero
          </Link>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 py-16 justify-center text-sm" style={{ color: 'var(--text-label)' }}>
          <Loader2 size={16} className="animate-spin" /> Cargando el tablero…
        </div>
      ) : tarjetas.length === 0 ? (
        <Vacio esAdmin={esAdmin} />
      ) : (
        <div className="tablero-rejilla">
          {tarjetas.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
              className={`tablero-ancho-${anchoDe(t)}`}>
              <Pintar t={t} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Tres columnas en pantalla grande, dos en tableta y una en celular.
          El ancho de cada tarjeta se recorta al número de columnas que haya:
          sin eso, un "span 3" dentro de una rejilla de una sola columna deja
          huecos en blanco donde debería ir la tarjeta siguiente. */}
      <style jsx global>{`
        .tablero-rejilla {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
        }
        .tablero-ancho-1 { grid-column: span 1; }
        .tablero-ancho-2 { grid-column: span 2; }
        .tablero-ancho-3 { grid-column: span 3; }
        @media (max-width: 1100px) {
          .tablero-rejilla { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .tablero-ancho-3 { grid-column: span 2; }
        }
        @media (max-width: 720px) {
          .tablero-rejilla { grid-template-columns: minmax(0, 1fr); }
          .tablero-ancho-2, .tablero-ancho-3 { grid-column: span 1; }
        }
      `}</style>
    </div>
  )
}

function Vacio({ esAdmin }: { esAdmin: boolean }) {
  return (
    <div className="rounded-2xl py-16 px-6 text-center"
      style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)' }}>
      <Megaphone size={32} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
      <p className="font-semibold" style={{ color: 'var(--text)' }}>El tablero está vacío</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-label)' }}>
        {esAdmin
          ? 'Publique el primer anuncio para que lo vea el personal.'
          : 'Todavía no hay anuncios publicados. Vuelva más tarde.'}
      </p>
      {esAdmin && (
        <Link href="/dashboard/inicio/editar"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          <PenLine size={15} /> Editar tablero
        </Link>
      )}
    </div>
  )
}

// ── Cada tipo de tarjeta ───────────────────────────────────────────────────

function Pintar({ t }: { t: Tarjeta }) {
  switch (t.tipo) {
    case 'anuncio':        return <Anuncio t={t} />
    case 'poster':         return <Poster t={t} />
    case 'contador':       return <Contador t={t} />
    case 'alerta':         return <Alerta t={t} />
    case 'capacitaciones': return <Capacitaciones t={t} />
    case 'formacion':      return <Formacion t={t} />
    case 'pausa':          return <Pausa t={t} />
    case 'epp':            return <Epp t={t} />
    case 'reconocimiento': return <Reconocimiento t={t} />
    case 'copasst':        return <Copasst t={t} />
    default:               return <Nota t={t} />
  }
}

/**
 * La imagen de una tarjeta chica: una banda arriba.
 *
 * Va recortada al centro y no completa, porque aquí la imagen acompaña al
 * texto; la que hay que ver entera es la del póster, que tiene su propio
 * trato. Mientras carga se muestra el color de la tarjeta, para que no
 * aparezca un hueco blanco y el texto no salte al terminar.
 */
function Banda({ url, color }: { url: string; color: string }) {
  return (
    <div className="h-[132px] w-full overflow-hidden" style={{ background: color }}>
      <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
    </div>
  )
}

/** Caja blanca estándar: todas las tarjetas chicas comparten esta forma. */
function Caja({ children, color, franja, imagen }: {
  children: React.ReactNode; color?: string; franja?: boolean; imagen?: string | null
}) {
  return (
    <div className="h-full rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        borderLeft: franja && color ? `3px solid ${color}` : undefined,
      }}>
      {imagen && <Banda url={imagen} color={color ?? 'var(--bg-card-hover)'} />}
      <div className="p-5">{children}</div>
    </div>
  )
}

/**
 * El póster: la imagen es el contenido, así que se ve entera.
 *
 * Una cartelera vertical y una infografía horizontal no caben en la misma
 * caja. Recortarlas al centro parte los títulos y las caras, así que la
 * imagen va completa y el hueco que sobra se rellena con una copia suya
 * desenfocada —lo que hacen YouTube y Netflix con los videos que no encajan.
 */
function Poster({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  if (!t.imagen_url) {
    return (
      <Caja>
        <Rotulo icono={ImageIcon} texto={t.titulo || 'Póster'} color="var(--text-label)" />
        <p className="text-[13px]" style={{ color: 'var(--text-label)' }}>Sin imagen todavía.</p>
      </Caja>
    )
  }
  // Altura fija, no la que traiga la imagen: una cartelera vertical de 1350
  // píxeles estiraba su fila hasta ocupar media pantalla y empujaba el resto
  // del tablero fuera de la vista.
  const cuerpo = (
    <div className="rounded-2xl relative overflow-hidden" style={{ background: c.degradado, height: 320 }}>
      <div className="absolute inset-0" aria-hidden style={{
        backgroundImage: `url(${t.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(18px) saturate(1.3)', transform: 'scale(1.2)',
      }} />
      <img src={t.imagen_url} alt={t.titulo ?? ''} loading="lazy"
        className="relative w-full h-full object-contain" />
      {(t.titulo || t.texto) && (
        <div className="absolute inset-x-0 bottom-0 p-4"
          style={{ background: 'linear-gradient(to top, rgba(8,16,36,0.88), rgba(8,16,36,0))' }}>
          {t.titulo && <p className="text-white font-bold text-[15px] leading-snug">{t.titulo}</p>}
          {t.texto && <p className="text-[12.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{t.texto}</p>}
        </div>
      )}
    </div>
  )
  return t.cta_url ? <Link href={t.cta_url} className="block h-full">{cuerpo}</Link> : cuerpo
}

function Rotulo({ icono: Icono, texto, color }: { icono: any; texto: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icono size={13} style={{ color }} />
      <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color }}>{texto}</span>
    </div>
  )
}

function Anuncio({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  return (
    <div className="h-full rounded-2xl relative overflow-hidden" style={{ background: c.degradado }}>
      {t.imagen_url && (
        <img src={t.imagen_url} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
      )}
      {t.destacado && (
        <span aria-hidden
          className="absolute right-4 bottom-0 font-black leading-none select-none"
          style={{ fontSize: 'clamp(72px, 13vw, 140px)', color: 'rgba(255,255,255,0.09)' }}>
          {t.destacado}
        </span>
      )}
      <div className="relative p-6 md:p-7">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
          style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}>
          <Megaphone size={12} /> Anuncio
        </span>
        <h2 className="font-extrabold text-white mt-3 leading-tight" style={{ fontSize: 'clamp(22px, 2.6vw, 32px)' }}>
          {t.titulo}
        </h2>
        {t.texto && (
          <p className="mt-2.5 text-sm md:text-[15px] leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.84)' }}>
            {t.texto}
          </p>
        )}
        {t.cta_texto && t.cta_url && (
          <Link href={t.cta_url}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-sm font-bold bg-white"
            style={{ color: '#0B1736' }}>
            {t.cta_texto} <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  )
}

function Contador({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'verde')
  const dias: number | null = t.datos?.dias ?? null
  const meta = Number(t.datos?.meta) || null
  const avance = dias != null && meta ? Math.min(100, Math.round((dias / meta) * 100)) : null

  return (
    <div className="h-full rounded-2xl p-5 flex flex-col items-center justify-center text-center"
      style={{ background: c.suave, border: `1px solid ${c.borde}` }}>
      <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: c.fuerte }}>
        {t.titulo || 'Récord del equipo'}
      </span>
      <span className="font-black my-1.5 leading-none tabular-nums"
        style={{ fontSize: 'clamp(44px, 6vw, 62px)', color: c.fuerte }}>
        {dias ?? '—'}
      </span>
      <span className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>
        {dias === 1 ? 'día sin accidentes' : 'días sin accidentes'}
      </span>
      {avance != null && (
        <div className="w-full mt-3">
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-label)' }}>
            Meta: {meta} días{avance >= 100 ? ' · ¡cumplida!' : ''}
          </p>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: `${avance}%`, background: c.fuerte }} />
          </div>
        </div>
      )}
      {t.texto && <p className="text-xs mt-2" style={{ color: 'var(--text-label)' }}>{t.texto}</p>}
    </div>
  )
}

/** Caja de color: misma forma que la blanca, pero teñida del color elegido. */
function CajaColor({ color, imagen, children }: {
  color: ReturnType<typeof COLOR>; imagen?: string | null; children: React.ReactNode
}) {
  return (
    <div className="h-full rounded-2xl overflow-hidden"
      style={{ background: color.suave, border: `1px solid ${color.borde}` }}>
      {imagen && <Banda url={imagen} color={color.fuerte} />}
      <div className="p-5">{children}</div>
    </div>
  )
}

function Alerta({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'rojo')
  return (
    <CajaColor color={c} imagen={t.imagen_url}>
      <Rotulo icono={AlertTriangle} texto="Alerta" color={c.fuerte} />
      <p className="font-bold text-[15px] leading-snug" style={{ color: 'var(--text)' }}>{t.titulo}</p>
      {t.texto && <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.texto}</p>}
    </CajaColor>
  )
}

function Capacitaciones({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const proximas: any[] = t.datos?.capacitaciones?.proximas ?? []
  return (
    <Caja>
      <Rotulo icono={CalendarDays} texto={t.titulo || 'Próximas capacitaciones'} color="var(--text-label)" />
      {proximas.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--text-label)' }}>No hay ninguna programada.</p>
      ) : (
        <div className="space-y-2.5">
          {proximas.map((p, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-1 rounded-full flex-shrink-0" style={{ background: c.fuerte, opacity: 0.45 }} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>{p.titulo}</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-label)' }}>
                  {fecha(p.fecha)}{p.modalidad ? ` · ${p.modalidad}` : ''}{p.obligatoria ? ' · obligatoria' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Caja>
  )
}

function Formacion({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const d = t.datos?.formacion ?? {}
  const pct: number | null = d.porcentaje ?? null
  return (
    <Caja>
      <Rotulo icono={GraduationCap} texto={t.titulo || 'Mi formación'} color="var(--text-label)" />
      {pct == null ? (
        <p className="text-[13px]" style={{ color: 'var(--text-label)' }}>Todavía no tiene cursos asignados.</p>
      ) : (
        <>
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--text)' }}>{pct}% al día</p>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-label)' }}>
            {d.pendientes === 0
              ? 'No tiene nada pendiente'
              : `${d.pendientes} ${d.pendientes === 1 ? 'curso pendiente' : 'cursos pendientes'} en SSTudio`}
          </p>
          <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ background: 'rgba(0,0,0,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.fuerte }} />
          </div>
          <Link href="/dashboard/my-plan" className="inline-flex items-center gap-1 text-[12.5px] font-semibold mt-3"
            style={{ color: c.fuerte }}>
            Ver mis cursos <ArrowRight size={13} />
          </Link>
        </>
      )}
    </Caja>
  )
}

function Pausa({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  return (
    <Caja imagen={t.imagen_url} color={c.fuerte}>
      <Rotulo icono={HeartPulse} texto={t.titulo || 'Pausa activa'} color="var(--text-label)" />
      {t.datos?.hora && (
        <p className="text-xl font-extrabold tabular-nums" style={{ color: c.fuerte }}>{t.datos.hora}</p>
      )}
      {t.texto && <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.texto}</p>}
    </Caja>
  )
}

function Epp({ t }: { t: Tarjeta }) {
  const items: string[] = Array.isArray(t.datos?.items) ? t.datos.items : []
  return (
    <Caja imagen={t.imagen_url} color={COLOR(t.color).fuerte}>
      <Rotulo icono={HardHat} texto={t.titulo || 'EPP de hoy'} color="var(--text-label)" />
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((it, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg text-[12px] font-semibold"
              style={{ background: 'var(--bg-card-hover)', color: 'var(--text-strong)', border: '1px solid var(--border)' }}>
              {it}
            </span>
          ))}
        </div>
      )}
      {t.texto && <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.texto}</p>}
    </Caja>
  )
}

function Reconocimiento({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'verde')
  return (
    <CajaColor color={c} imagen={t.imagen_url}>
      <Rotulo icono={Award} texto="Reconocimiento" color={c.fuerte} />
      <p className="font-bold text-[15px] leading-snug" style={{ color: 'var(--text)' }}>{t.titulo}</p>
      {t.texto && <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.texto}</p>}
    </CajaColor>
  )
}

function Copasst({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'azul')
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4 flex-wrap"
      style={{ background: c.suave, border: `1px solid ${c.borde}` }}>
      {/* En una franja horizontal una banda de imagen la partiría en dos, así
          que aquí la imagen reemplaza al icono y queda del mismo tamaño. */}
      {t.imagen_url ? (
        <img src={t.imagen_url} alt="" loading="lazy"
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0" style={{ background: c.fuerte }} />
      ) : (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.fuerte }}>
          <Users size={19} color="#fff" />
        </div>
      )}
      <div className="flex-1 min-w-[200px]">
        <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: c.fuerte }}>
          {t.titulo || 'COPASST'}
        </p>
        <p className="font-bold text-[15px] mt-0.5 leading-snug" style={{ color: 'var(--text)' }}>{t.texto}</p>
      </div>
      {t.cta_texto && t.cta_url && (
        <Link href={t.cta_url}
          className="px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0"
          style={{ background: c.fuerte, color: '#fff' }}>
          {t.cta_texto}
        </Link>
      )}
    </div>
  )
}

function Nota({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  return (
    <Caja color={c.fuerte} franja imagen={t.imagen_url}>
      <Rotulo icono={ShieldCheck} texto={t.titulo || 'Nota'} color="var(--text-label)" />
      {t.texto && <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.texto}</p>}
    </Caja>
  )
}
