'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CalendarDays, GraduationCap, HeartPulse, HardHat,
  Award, Users, ArrowRight, Megaphone, ShieldCheck, Loader2, PenLine,
  Image as ImageIcon, GripVertical, Eye, EyeOff, Trash2, Plus, Check,
  ChevronLeft, ChevronRight, List,
} from 'lucide-react'
import {
  COLOR, TIPO, TIPOS, anchoDe, ajusteDe, altoDe, pictogramasDe,
  type Tarjeta, type TipoTarjeta,
} from '@/lib/tablero'
import { Pictograma } from '@/components/tablero/Pictograma'
import { EditorTarjeta, ElegirTipo, type Opciones } from '@/components/tablero/EditorTarjeta'
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
  const [opciones, setOpciones] = useState<Opciones>({ centros: [], areas: [] })
  const [cargando, setCargando] = useState(true)
  // La fecha se arma en el navegador y no en el servidor: el servidor corre en
  // UTC, así que entre las 7 de la noche y la medianoche escribía el día
  // siguiente.
  const [hoy, setHoy] = useState('')

  // Modo diseño: se ve el tablero tal cual, pero cada tarjeta trae sus
  // controles encima. Es lo contrario de una vista previa —no hay dos
  // pantallas que puedan diferir, porque es la misma.
  const [diseñando, setDiseñando] = useState(false)
  const [editando, setEditando] = useState<Tarjeta | null>(null)
  const [eligiendoTipo, setEligiendoTipo] = useState(false)
  const [arrastrando, setArrastrando] = useState<string | null>(null)

  const cargar = (conTodas = diseñando) =>
    fetch(`/api/tablero${conTodas ? '?todas=1' : ''}`)
      .then(r => r.json())
      .then(d => {
        setTarjetas(d.tarjetas ?? [])
        if (d.opciones) setOpciones(d.opciones)
      })
      .catch(() => setTarjetas([]))
      .finally(() => setCargando(false))

  useEffect(() => { cargar(false) }, [])

  useEffect(() => {
    setHoy(new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }))
  }, [])

  const entrarADiseñar = async () => { setDiseñando(true); await cargar(true) }
  const salirDeDiseñar = async () => { setDiseñando(false); setArrastrando(null); await cargar(false) }

  const guardar = async (cambios: Partial<Tarjeta> & { id: string }) => {
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    })
    if (!r.ok) { alert('No se pudo guardar'); return false }
    await cargar(true)
    return true
  }

  const crear = async (tipo: TipoTarjeta) => {
    setEligiendoTipo(false)
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, titulo: TIPO(tipo).nombre, color: 'cian', activa: true }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { alert(d.error ?? 'No se pudo crear'); return }
    await cargar(true)
    setEditando(d.tarjeta)
  }

  const borrar = async (t: Tarjeta) => {
    const nombre = t.titulo || TIPO(t.tipo).nombre
    if (!confirm(`¿Borrar «${nombre}»?\n\nNo se puede deshacer. Si solo quiere que deje de verse, apáguela.`)) return
    await fetch(`/api/tablero/tarjetas?id=${t.id}`, { method: 'DELETE' })
    await cargar(true)
  }

  /** Guarda el orden que quedó en pantalla. */
  const guardarOrden = async (lista: Tarjeta[]) => {
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden: lista.map(t => t.id) }),
    })
    if (!r.ok) { alert('No se pudo guardar el orden'); cargar(true) }
  }

  const mover = (id: string, hacia: -1 | 1) => {
    const i = tarjetas.findIndex(t => t.id === id)
    const j = i + hacia
    if (i < 0 || j < 0 || j >= tarjetas.length) return
    const nuevo = [...tarjetas]
    ;[nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]]
    setTarjetas(nuevo)
    guardarOrden(nuevo)
  }

  /** Suelta la tarjeta arrastrada justo donde está la de destino. */
  const soltarSobre = (destino: string) => {
    if (!arrastrando || arrastrando === destino) return
    const desde = tarjetas.findIndex(t => t.id === arrastrando)
    const hasta = tarjetas.findIndex(t => t.id === destino)
    if (desde < 0 || hasta < 0) return
    const nuevo = [...tarjetas]
    const [movida] = nuevo.splice(desde, 1)
    nuevo.splice(hasta, 0, movida)
    setTarjetas(nuevo)
    setArrastrando(null)
    guardarOrden(nuevo)
  }

  const cambiarAncho = (t: Tarjeta, hacia: -1 | 1) => {
    const actual = anchoDe(t)
    const nuevo = Math.min(3, Math.max(1, actual + hacia))
    if (nuevo === actual) return
    setTarjetas(ts => ts.map(x => x.id === t.id ? { ...x, datos: { ...x.datos, ancho: nuevo } } : x))
    guardar({ id: t.id, datos: { ...t.datos, ancho: nuevo } } as any)
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {conMayuscula(hoy) || ' '}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-label)' }}>
            {diseñando
              ? 'Modo diseño — arrastre para mover, use los controles de cada tarjeta'
              : 'Lo destacado en seguridad y salud en el trabajo'}
          </p>
        </div>

        {esAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {diseñando && (
              <>
                <button onClick={() => setEligiendoTipo(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold"
                  style={{ background: 'var(--primary)', color: '#fff' }}>
                  <Plus size={16} /> Agregar
                </button>
                <Link href="/dashboard/inicio/editar"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                  <List size={15} /> Ver como lista
                </Link>
              </>
            )}
            <button onClick={diseñando ? salirDeDiseñar : entrarADiseñar}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold"
              style={diseñando
                ? { background: '#059669', color: '#fff' }
                : { background: 'var(--primary-dim)', color: 'var(--primary-dark)', border: '1px solid var(--primary-border)' }}>
              {diseñando ? <><Check size={16} /> Listo</> : <><PenLine size={15} /> Diseñar tablero</>}
            </button>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 py-16 justify-center text-sm" style={{ color: 'var(--text-label)' }}>
          <Loader2 size={16} className="animate-spin" /> Cargando el tablero…
        </div>
      ) : tarjetas.length === 0 ? (
        <Vacio esAdmin={esAdmin} onDiseñar={entrarADiseñar} />
      ) : (
        <div className="tablero-rejilla">
          {tarjetas.map((t, i) => (
            <motion.div
              key={t.id}
              layout={diseñando}
              initial={diseñando ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: diseñando ? 0 : Math.min(i, 8) * 0.04, duration: 0.3 }}
              className={`tablero-ancho-${anchoDe(t)} relative`}
              draggable={diseñando}
              onDragStart={() => setArrastrando(t.id)}
              onDragEnd={() => setArrastrando(null)}
              onDragOver={e => { if (diseñando) e.preventDefault() }}
              onDrop={e => { e.preventDefault(); soltarSobre(t.id) }}
              // En modo diseño la tarjeta baja para hacerle sitio a su barra de
              // controles. Antes la barra iba encima y le tapaba el rótulo: no
              // se alcanzaba a leer qué tarjeta se estaba moviendo.
              style={diseñando
                ? { cursor: 'grab', paddingTop: 34, opacity: arrastrando === t.id ? 0.4 : 1 }
                : undefined}>
              {diseñando && (
                <Controles t={t} primera={i === 0} ultima={i === tarjetas.length - 1}
                  onMover={h => mover(t.id, h)} onAncho={h => cambiarAncho(t, h)}
                  onEditar={() => setEditando(t)} onBorrar={() => borrar(t)}
                  onPrender={() => guardar({ id: t.id, activa: !t.activa })} />
              )}
              <div style={diseñando && !t.activa ? { opacity: 0.45 } : undefined}>
                <Pintar t={t} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {eligiendoTipo && <ElegirTipo onElegir={crear} onCerrar={() => setEligiendoTipo(false)} />}
      {editando && (
        <EditorTarjeta tarjeta={editando} opciones={opciones}
          onCerrar={() => setEditando(null)}
          onGuardar={async cambios => {
            if (await guardar({ ...cambios, id: editando.id } as any)) setEditando(null)
          }} />
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
          align-items: start;
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

/** La barra de controles que aparece sobre cada tarjeta en modo diseño. */
function Controles({ t, primera, ultima, onMover, onAncho, onEditar, onBorrar, onPrender }: {
  t: Tarjeta; primera: boolean; ultima: boolean
  onMover: (h: -1 | 1) => void; onAncho: (h: -1 | 1) => void
  onEditar: () => void; onBorrar: () => void; onPrender: () => void
}) {
  const ancho = anchoDe(t)
  const libre = TIPO(t.tipo).anchoLibre
  const boton = 'p-1.5 rounded-md transition-colors'
  const estilo = { color: 'rgba(255,255,255,0.88)' }

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-lg"
      style={{ background: '#0B1736', border: '1px solid rgba(255,255,255,0.14)' }}
      // Arrastrar desde la barra movería el botón, no la tarjeta.
      draggable={false} onDragStart={e => e.preventDefault()}>
      <GripVertical size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
      <button onClick={() => onMover(-1)} disabled={primera} title="Mover antes"
        className={`${boton} disabled:opacity-25`} style={estilo}><ChevronLeft size={15} /></button>
      <button onClick={() => onMover(1)} disabled={ultima} title="Mover después"
        className={`${boton} disabled:opacity-25`} style={estilo}><ChevronRight size={15} /></button>

      {libre && (
        <>
          <span className="w-px h-4 mx-0.5" style={{ background: 'rgba(255,255,255,0.18)' }} />
          <button onClick={() => onAncho(-1)} disabled={ancho === 1} title="Más angosta"
            className={`${boton} disabled:opacity-25 text-[13px] font-bold leading-none px-2`} style={estilo}>−</button>
          <span className="text-[11px] font-bold tabular-nums px-0.5" style={estilo}>{ancho}</span>
          <button onClick={() => onAncho(1)} disabled={ancho === 3} title="Más ancha"
            className={`${boton} disabled:opacity-25 text-[13px] font-bold leading-none px-2`} style={estilo}>+</button>
        </>
      )}

      <span className="flex-1" />
      <button onClick={onPrender} title={t.activa ? 'Apagar' : 'Publicar'} className={boton}
        style={{ color: t.activa ? '#6EE7B7' : 'rgba(255,255,255,0.45)' }}>
        {t.activa ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button onClick={onEditar} title="Editar" className={boton} style={estilo}><PenLine size={14} /></button>
      <button onClick={onBorrar} title="Borrar" className={boton} style={{ color: '#FCA5A5' }}><Trash2 size={14} /></button>
    </div>
  )
}

function Vacio({ esAdmin, onDiseñar }: { esAdmin: boolean; onDiseñar: () => void }) {
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
        <button onClick={onDiseñar}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          <PenLine size={15} /> Diseñar tablero
        </button>
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
 * La imagen de una tarjeta.
 *
 * Por omisión se ve entera y con la altura que ella misma pida: una tira de
 * pictogramas recortada a una banda fija quedaba partida por la mitad, medio
 * dibujo y medio texto. Quien sube la imagen decide si prefiere recortarla
 * —cuando es fondo y no contenido— y hasta dónde.
 *
 * Cuando hay altura fija y la imagen no llena la caja, el hueco se rellena con
 * una copia suya desenfocada en vez de una franja blanca.
 */
function Imagen({ t, color }: { t: Tarjeta; color: string }) {
  if (!t.imagen_url) return null
  const recorta = ajusteDe(t) === 'recortada'
  const alto = altoDe(t)

  if (!alto) {
    return (
      <div className="w-full" style={{ background: color }}>
        <img src={t.imagen_url} alt="" loading="lazy" className="w-full h-auto block" />
      </div>
    )
  }

  return (
    <div className="w-full relative overflow-hidden" style={{ height: alto, background: color }}>
      {!recorta && (
        <div className="absolute inset-0" aria-hidden style={{
          backgroundImage: `url(${t.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(18px) saturate(1.3)', transform: 'scale(1.2)',
        }} />
      )}
      <img src={t.imagen_url} alt="" loading="lazy"
        className={`relative w-full h-full ${recorta ? 'object-cover' : 'object-contain'}`} />
    </div>
  )
}

/** La fila de pictogramas, si la tarjeta tiene alguno. */
function Iconos({ t, color }: { t: Tarjeta; color: string }) {
  const ids = pictogramasDe(t)
  if (!ids.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {ids.map((id, i) => (
        <span key={`${id}-${i}`} className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color }}>
          <Pictograma id={id} size={17} />
        </span>
      ))}
    </div>
  )
}

/** Caja blanca estándar: todas las tarjetas chicas comparten esta forma. */
function Caja({ children, color, franja, t }: {
  children: React.ReactNode; color?: string; franja?: boolean; t?: Tarjeta
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        borderLeft: franja && color ? `3px solid ${color}` : undefined,
      }}>
      {t && <Imagen t={t} color={color ?? 'var(--bg-card-hover)'} />}
      <div className="p-5">
        {children}
        {t && <Iconos t={t} color={color ?? 'var(--text-dim)'} />}
      </div>
    </div>
  )
}

/** Caja de color: misma forma que la blanca, pero teñida del color elegido. */
function CajaColor({ color, t, children }: {
  color: ReturnType<typeof COLOR>; t: Tarjeta; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: color.suave, border: `1px solid ${color.borde}` }}>
      <Imagen t={t} color={color.fuerte} />
      <div className="p-5">
        {children}
        <Iconos t={t} color={color.fuerte} />
      </div>
    </div>
  )
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
  const fondo = ajusteDe(t) === 'recortada'
  return (
    <div className="rounded-2xl relative overflow-hidden" style={{ background: c.degradado }}>
      {/* Recortada, la imagen es fondo y el texto va encima; completa, se ve
          toda y el texto va debajo para no taparla. */}
      {t.imagen_url && fondo && (
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
      {t.imagen_url && !fondo && <Imagen t={t} color={c.fuerte} />}
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
        {pictogramasDe(t).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {pictogramasDe(t).map((id, i) => (
              <span key={`${id}-${i}`} className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                <Pictograma id={id} size={18} />
              </span>
            ))}
          </div>
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

/** El póster: la imagen es el contenido, así que manda ella. */
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
  const cuerpo = (
    <div className="rounded-2xl relative overflow-hidden" style={{ background: c.degradado }}>
      <Imagen t={t} color={c.fuerte} />
      {(t.titulo || t.texto) && (
        <div className="absolute inset-x-0 bottom-0 p-4"
          style={{ background: 'linear-gradient(to top, rgba(8,16,36,0.88), rgba(8,16,36,0))' }}>
          {t.titulo && <p className="text-white font-bold text-[15px] leading-snug">{t.titulo}</p>}
          {t.texto && <p className="text-[12.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{t.texto}</p>}
        </div>
      )}
    </div>
  )
  return t.cta_url ? <Link href={t.cta_url} className="block">{cuerpo}</Link> : cuerpo
}

function Contador({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'verde')
  const dias: number | null = t.datos?.dias ?? null
  const meta = Number(t.datos?.meta) || null
  const avance = dias != null && meta ? Math.min(100, Math.round((dias / meta) * 100)) : null

  return (
    <div className="rounded-2xl p-5 flex flex-col items-center justify-center text-center"
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
      <Iconos t={t} color={c.fuerte} />
    </div>
  )
}

function Alerta({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'rojo')
  return (
    <CajaColor color={c} t={t}>
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
    <Caja t={t} color={c.fuerte}>
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
    <Caja t={t} color={c.fuerte}>
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
    <Caja t={t} color={c.fuerte}>
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
    <Caja t={t} color={COLOR(t.color).fuerte}>
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
    <CajaColor color={c} t={t}>
      <Rotulo icono={Award} texto="Reconocimiento" color={c.fuerte} />
      <p className="font-bold text-[15px] leading-snug" style={{ color: 'var(--text)' }}>{t.titulo}</p>
      {t.texto && <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.texto}</p>}
    </CajaColor>
  )
}

function Copasst({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'azul')
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: c.suave, border: `1px solid ${c.borde}` }}>
      <Imagen t={t} color={c.fuerte} />
      <div className="p-5 flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.fuerte }}>
          <Users size={19} color="#fff" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: c.fuerte }}>
            {t.titulo || 'COPASST'}
          </p>
          <p className="font-bold text-[15px] mt-0.5 leading-snug" style={{ color: 'var(--text)' }}>{t.texto}</p>
          <Iconos t={t} color={c.fuerte} />
        </div>
        {t.cta_texto && t.cta_url && (
          <Link href={t.cta_url}
            className="px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0"
            style={{ background: c.fuerte, color: '#fff' }}>
            {t.cta_texto}
          </Link>
        )}
      </div>
    </div>
  )
}

function Nota({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  return (
    <Caja color={c.fuerte} franja t={t}>
      <Rotulo icono={ShieldCheck} texto={t.titulo || 'Nota'} color="var(--text-label)" />
      {t.texto && <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.texto}</p>}
    </Caja>
  )
}
