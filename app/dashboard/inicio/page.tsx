'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CalendarDays, GraduationCap, HeartPulse, HardHat,
  Award, Users, ArrowRight, Megaphone, ShieldCheck, Loader2, PenLine,
  Image as ImageIcon, GripVertical, Eye, EyeOff, Trash2, Plus, Check,
  ChevronLeft, ChevronRight, List,
} from 'lucide-react'
import {
  COLOR, TIPO, anchoDe, ajusteDe, altoDe, pictogramasDe,
  ordenDe, alineacionDe, tamanoDe, aireDe,
  disposicionDe, proporcionDe, colorTextoDe, tintaDe, nombreDe, seVe,
  medidaDe, medidaComo, medida, grosorDe, dondeTextoDe, leyendaDe, esElastica,
  columnaInicial, fuenteDe,
  posicionIconosDe, tamanoIconosDe,
  ALTO_MINIMO, ALTO_MAXIMO,
  type Tarjeta, type TipoTarjeta,
} from '@/lib/tablero'
import { Pictograma } from '@/components/tablero/Pictograma'
import { EditorTarjeta, ElegirTipo, type Opciones } from '@/components/tablero/EditorTarjeta'
import { useRol } from '@/lib/usar-rol'

const fecha = (d?: string | null) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : ''


/**
 * El modo diseño, disponible para cualquier tarjeta sin pasarlo de mano en
 * mano. Las tarjetas están anidadas tres niveles —rejilla, caja, imagen— y
 * llevar dos propiedades por toda esa cadena ensuciaba diez componentes que
 * no tienen nada que ver con editar.
 */
const Diseno = createContext<{
  activo: boolean
  guardarAlto: (t: Tarjeta, px: number | null) => void
  guardarIconos: (t: Tarjeta, pos: { x: number; y: number } | null) => void
  /**
   * Suelta el arrastre de la tarjeta mientras se usa una manija.
   *
   * La tarjeta entera es arrastrable para reordenarla. Al mover el mouse sobre
   * una manija, el navegador arrancaba ese arrastre nativo, y con él se llevaba
   * el control del puntero: la manija se quedaba sin recibir el movimiento y
   * sin enterarse de que se había soltado, así que no guardaba nada.
   */
  bloquear: (b: boolean) => void
  /** Enciende las rayas de las columnas mientras se ensancha una tarjeta. */
  guias: (b: boolean) => void
  /** Las rayas horizontales: las alturas de las demás tarjetas. */
  guiasAlto: (g: { desde: number; altos: number[]; pegada: number | null } | null) => void
}>({
  activo: false, guardarAlto: () => {}, guardarIconos: () => {},
  bloquear: () => {}, guias: () => {}, guiasAlto: () => {},
})

export default function InicioPage() {
  const { esAdmin } = useRol()
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  const [opciones, setOpciones] = useState<Opciones>({ centros: [], areas: [] })
  const [cargando, setCargando] = useState(true)

  // Modo diseño: se ve el tablero tal cual, pero cada tarjeta trae sus
  // controles encima. Es lo contrario de una vista previa —no hay dos
  // pantallas que puedan diferir, porque es la misma.
  const [diseñando, setDiseñando] = useState(false)
  const [editando, setEditando] = useState<Tarjeta | null>(null)
  const [eligiendoTipo, setEligiendoTipo] = useState(false)
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [separacion, setSeparacion] = useState(16)
  const [bloqueado, setBloqueado] = useState(false)
  const [guiando, setGuiando] = useState(false)
  const [rayasAlto, setRayasAlto] = useState<{ desde: number; altos: number[]; pegada: number | null } | null>(null)

  const cargar = (conTodas = diseñando) =>
    fetch(`/api/tablero${conTodas ? '?todas=1' : ''}`)
      .then(r => r.json())
      .then(d => {
        setTarjetas(d.tarjetas ?? [])
        if (d.opciones) setOpciones(d.opciones)
        if (typeof d.separacion === 'number') setSeparacion(d.separacion)
      })
      .catch(() => setTarjetas([]))
      .finally(() => setCargando(false))

  useEffect(() => { cargar(false) }, [])

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
      // El nombre del tipo va al nombre interno, no al título: como título se
      // veía la palabra «Banner» escrita en la pantalla de todo el personal.
      body: JSON.stringify({
        tipo, color: 'cian', activa: true, datos: { nombre: TIPO(tipo).nombre },
      }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { alert(d.error ?? 'No se pudo crear'); return }
    await cargar(true)
    setEditando(d.tarjeta)
  }

  const borrar = async (t: Tarjeta) => {
    const nombre = nombreDe(t)
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

  const guardarSeparacion = (px: number) => {
    fetch('/api/tablero', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ separacion: px }),
    }).catch(() => {})
  }

  /** Guarda el alto que quedó tras estirar la imagen con el mouse. */
  const guardarAlto = (t: Tarjeta, px: number | null) => {
    const datos = { ...t.datos, altoPx: px }
    setTarjetas(ts => ts.map(x => x.id === t.id ? { ...x, datos } : x))
    guardar({ id: t.id, datos } as any)
  }

  /** Dónde quedaron los pictogramas tras arrastrarlos. */
  const guardarIconos = (t: Tarjeta, pos: { x: number; y: number } | null) => {
    const datos = { ...t.datos, iconosPos: pos }
    setTarjetas(ts => ts.map(x => x.id === t.id ? { ...x, datos } : x))
    guardar({ id: t.id, datos } as any)
  }

  /** El ancho que quedó tras arrastrar el borde derecho. */
  const ponerAncho = (t: Tarjeta, n: 1 | 2 | 3) => {
    const datos = { ...t.datos, ancho: n }
    setTarjetas(ts => ts.map(x => x.id === t.id ? { ...x, datos } : x))
    guardar({ id: t.id, datos } as any)
  }

  /** El alto mínimo que quedó tras arrastrar el borde de abajo. */
  const ponerAltoTarjeta = (t: Tarjeta, px: number | null) => {
    const datos = { ...t.datos, altoTarjeta: px }
    setTarjetas(ts => ts.map(x => x.id === t.id ? { ...x, datos } : x))
    guardar({ id: t.id, datos } as any)
  }

  const cambiarAncho = (t: Tarjeta, hacia: -1 | 1) => {
    const actual = anchoDe(t)
    const nuevo = Math.min(3, Math.max(1, actual + hacia))
    if (nuevo === actual) return
    setTarjetas(ts => ts.map(x => x.id === t.id ? { ...x, datos: { ...x.datos, ancho: nuevo } } : x))
    guardar({ id: t.id, datos: { ...t.datos, ancho: nuevo } } as any)
  }

  return (
    <Diseno.Provider value={{ activo: diseñando, guardarAlto, guardarIconos, bloquear: setBloqueado, guias: setGuiando, guiasAlto: setRayasAlto }}>
    <div className="space-y-5 pb-10">
      {/* Sin encabezado: la fecha y el subtítulo ocupaban dos renglones que no
          decían nada que el tablero no dijera mejor. El espacio es del
          contenido. Al diseñar sí aparece una línea, porque ahí hace falta
          saber en qué modo se está. */}
      {esAdmin && (
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-label)' }}>
          {diseñando ? 'Modo diseño — arrastre para mover, use los controles de cada tarjeta' : ' '}
        </p>

        {esAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {diseñando && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <label htmlFor="separacion" className="text-[12px] font-bold whitespace-nowrap"
                    style={{ color: 'var(--text-dim)' }}>Separación</label>
                  <input id="separacion" type="range" min={0} max={64} step={4} value={separacion}
                    onChange={e => setSeparacion(Number(e.target.value))}
                    // Se guarda al soltar y no en cada píxel: arrastrar la
                    // barra dispararía sesenta escrituras seguidas.
                    onPointerUp={() => guardarSeparacion(separacion)}
                    onKeyUp={() => guardarSeparacion(separacion)}
                    className="w-24" />
                  <span className="text-[11px] font-bold tabular-nums w-7" style={{ color: 'var(--text-label)' }}>
                    {separacion}
                  </span>
                </div>
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
      )}

      {cargando ? (
        <div className="flex items-center gap-2 py-16 justify-center text-sm" style={{ color: 'var(--text-label)' }}>
          <Loader2 size={16} className="animate-spin" /> Cargando el tablero…
        </div>
      ) : tarjetas.length === 0 ? (
        <Vacio esAdmin={esAdmin} onDiseñar={entrarADiseñar} />
      ) : (
        <div className="tablero-rejilla relative" style={{ '--tablero-aire': `${separacion}px` } as any}>
          {guiando && <Guias />}
          {rayasAlto && <GuiasAlto g={rayasAlto} />}
          {tarjetas.map((t, i) => (
            <EnElTablero
              key={t.id} t={t} indice={i} total={tarjetas.length}
              diseñando={diseñando} arrastrando={arrastrando} bloqueado={bloqueado}
              onArrastrar={setArrastrando} onSoltar={soltarSobre}
              onMover={h => mover(t.id, h)}
              onAncho={h => cambiarAncho(t, h)}
              onAnchoExacto={n => ponerAncho(t, n)}
              onAltoTarjeta={px => ponerAltoTarjeta(t, px)}
              onEditar={() => setEditando(t)} onBorrar={() => borrar(t)}
              onPrender={() => guardar({ id: t.id, activa: !t.activa })} />
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
          gap: var(--tablero-aire, 16px);
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: start;
        }
        /* Una tarjeta a la que se le dio alto estira su caja y reparte el
           contenido en vertical, en lugar de dejarlo pegado arriba. */
        .tablero-estirar { display: flex; flex-direction: column; }
        .tablero-estirar > * { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .tablero-rejilla > [data-col="1"] { grid-column-start: 1; }
        .tablero-rejilla > [data-col="2"] { grid-column-start: 2; }
        .tablero-rejilla > [data-col="3"] { grid-column-start: 3; }
        .tablero-ancho-1 { grid-column-end: span 1; }
        .tablero-ancho-2 { grid-column-end: span 2; }
        .tablero-ancho-3 { grid-column-end: span 3; }
        @media (max-width: 1100px) {
          .tablero-rejilla { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .tablero-ancho-3 { grid-column-end: span 2; }
          .tablero-rejilla > [data-col="3"] { grid-column-start: 2; }
        }
        @media (max-width: 720px) {
          .tablero-rejilla { grid-template-columns: minmax(0, 1fr); }
          .tablero-ancho-2, .tablero-ancho-3 { grid-column-end: span 1; }
          /* En celular no hay columnas que escoger: todas van en una sola. */
          .tablero-rejilla > [data-col] { grid-column-start: 1; }
          /* Dos columnas en un celular dejan el texto en una tira de letras
             sueltas, así que lado a lado pasa a uno debajo del otro. */
          .tablero-fila { flex-direction: column; }
          .tablero-lado { flex-basis: auto !important; width: 100%; }
        }
      `}</style>
    </div>
    </Diseno.Provider>
  )
}

/**
 * Las rayas de las columnas, mientras se ensancha una tarjeta.
 *
 * Son las dos divisiones de la rejilla de tres. Verlas al arrastrar es la
 * diferencia entre saber dónde va a caer la tarjeta y tener que soltar para
 * averiguarlo.
 */
function Guias() {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none" aria-hidden>
      {[1, 2].map(i => (
        <div key={i} className="absolute top-0 bottom-0 w-px"
          style={{ left: `${(i / 3) * 100}%`, background: 'var(--primary)', opacity: 0.4 }} />
      ))}
    </div>
  )
}

/**
 * Las rayas horizontales: a qué altura terminan las demás tarjetas.
 *
 * La que está pegada se pinta llena; las otras, tenues. Así se ve de una cuál
 * altura va a quedar y cuáles hay cerca, sin tener que soltar para saberlo.
 */
function GuiasAlto({ g }: { g: { desde: number; altos: number[]; pegada: number | null } }) {
  const [tope, setTope] = useState(0)
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const r = caja.current?.parentElement?.getBoundingClientRect()
    if (r) setTope(g.desde - r.top)
  }, [g.desde])

  return (
    <div ref={caja} className="absolute inset-0 z-40 pointer-events-none" aria-hidden>
      {g.altos.map(a => {
        const pegada = g.pegada === a
        return (
          <div key={a} className="absolute left-0 right-0 h-px"
            style={{
              top: tope + a,
              background: 'var(--primary)',
              opacity: pegada ? 1 : 0.28,
              boxShadow: pegada ? '0 0 0 1px rgba(6,182,212,0.4)' : undefined,
            }} />
        )
      })}
    </div>
  )
}

/** Una tarjeta en su sitio del tablero, con sus controles si se está diseñando. */
function EnElTablero({
  t, indice, total, diseñando, arrastrando, bloqueado,
  onArrastrar, onSoltar, onMover, onAncho, onAnchoExacto, onAltoTarjeta,
  onEditar, onBorrar, onPrender,
}: {
  t: Tarjeta; indice: number; total: number
  diseñando: boolean; arrastrando: string | null; bloqueado: boolean
  onArrastrar: (id: string | null) => void
  onSoltar: (id: string) => void
  onMover: (h: -1 | 1) => void
  onAncho: (h: -1 | 1) => void
  onAnchoExacto: (n: 1 | 2 | 3) => void
  onAltoTarjeta: (px: number | null) => void
  onEditar: () => void; onBorrar: () => void; onPrender: () => void
}) {
  const caja = useRef<HTMLDivElement>(null)
  const alto = Number(t.datos?.altoTarjeta) || null

  return (
    <motion.div
      ref={caja}
      layout={diseñando}
      initial={diseñando ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: diseñando ? 0 : Math.min(indice, 8) * 0.04, duration: 0.3 }}
      className={`tablero-ancho-${anchoDe(t)} relative group`}
      // Fijar la columna deja huecos a la izquierda, y eso es a propósito: los
      // espacios en blanco son parte del diseño, no un error que la rejilla
      // tenga que rellenar sola.
      data-col={columnaInicial(t) ?? undefined}
      draggable={diseñando && !bloqueado}
      onDragStart={() => onArrastrar(t.id)}
      onDragEnd={() => onArrastrar(null)}
      onDragOver={e => { if (diseñando) e.preventDefault() }}
      onDrop={e => { e.preventDefault(); onSoltar(t.id) }}
      // En modo diseño la tarjeta baja para hacerle sitio a su barra de
      // controles. Antes la barra iba encima y le tapaba el rótulo: no se
      // alcanzaba a leer qué tarjeta se estaba moviendo.
      style={diseñando
        ? { cursor: 'grab', paddingTop: 34, opacity: arrastrando === t.id ? 0.4 : 1 }
        : undefined}>
      {diseñando && (
        <>
          <Controles t={t} primera={indice === 0} ultima={indice === total - 1}
            onMover={onMover} onAncho={onAncho}
            onEditar={onEditar} onBorrar={onBorrar} onPrender={onPrender} />
          <ManijasTarjeta t={t} columna={caja} onAncho={onAnchoExacto} onAlto={onAltoTarjeta} />
        </>
      )}
      {/* El alto no se queda en esta envoltura: baja hasta la caja que pinta
          el fondo y hasta su contenido. Si se quedara aquí, la tarjeta crecía
          pero su color no, y el texto se apelotonaba arriba dejando media
          tarjeta vacía debajo. */}
      {/* `container-type: inline-size` convierte la tarjeta en la referencia
          contra la que se mide la letra elástica. Sin esto, `cqi` se mediría
          contra el contenedor de más arriba y la letra no cambiaría al
          angostar la tarjeta. */}
      <div className={alto ? 'tablero-estirar' : undefined}
        style={{
          opacity: diseñando && !t.activa ? 0.45 : undefined,
          minHeight: alto ?? undefined,
          containerType: esElastica(t) ? 'inline-size' : undefined,
          fontFamily: fuenteDe(t),
        }}>
        <Pintar t={t} />
      </div>
    </motion.div>
  )
}

/**
 * Las manijas del borde de la tarjeta.
 *
 * Aparecen al pasar el mouse por encima: la del lado derecho la ensancha o la
 * angosta, y la de abajo le pone un alto mínimo. Los botones de la barra
 * siguen estando —son los que sirven con el teclado y en pantalla táctil—,
 * pero agarrar el borde es lo que uno intenta primero.
 */
function ManijasTarjeta({ t, onAncho, onAlto, columna }: {
  t: Tarjeta
  onAncho: (n: 1 | 2 | 3) => void
  onAlto: (px: number | null) => void
  columna: React.RefObject<HTMLDivElement>
}) {
  const { bloquear, guias, guiasAlto } = useContext(Diseno)
  const [fantasma, setFantasma] = useState<{ ancho?: number; alto?: number } | null>(null)
  const libre = TIPO(t.tipo).anchoLibre
  const ancho = anchoDe(t)

  const estirarAncho = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    bloquear(true); guias(true)
    const caja = columna.current?.getBoundingClientRect()
    if (!caja) return
    // Una columna mide, más o menos, lo que mide la tarjeta entre el número de
    // columnas que ocupa. Con eso se sabe en cuál cae el mouse.
    const unaColumna = caja.width / ancho
    let destino: 1 | 2 | 3 = ancho
    const mover = (ev: PointerEvent) => {
      const n = Math.round((ev.clientX - caja.left) / unaColumna)
      destino = Math.min(3, Math.max(1, n || 1)) as 1 | 2 | 3
      setFantasma({ ancho: destino })
    }
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      bloquear(false); guias(false)
      setFantasma(null)
      if (destino !== ancho) onAncho(destino)
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  const estirarAlto = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    bloquear(true)
    const inicioY = e.clientY
    const yo = columna.current
    const caja = yo?.getBoundingClientRect()
    const inicio = caja?.height ?? 200

    // Los bordes de abajo de las demás tarjetas, medidos desde el borde de
    // arriba de esta. Son las alturas con las que vale la pena cuadrar.
    const rejilla = yo?.parentElement
    const lineas: number[] = []
    if (caja && rejilla) {
      for (const otra of Array.from(rejilla.children)) {
        if (otra === yo) continue
        const r = otra.getBoundingClientRect()
        const alto = Math.round(r.bottom - caja.top)
        if (alto > 60 && alto < 1200) lineas.push(alto)
      }
    }
    const unicas = [...new Set(lineas)].sort((a, b) => a - b)
    guiasAlto(unicas.length ? { desde: caja!.top, altos: unicas, pegada: null } : null)

    let ultimo = inicio
    const mover = (ev: PointerEvent) => {
      const bruto = Math.min(1200, Math.max(60, inicio + (ev.clientY - inicioY)))
      // Imán: a menos de diez píxeles de la altura de otra tarjeta, se pega a
      // ella. Cuadrar dos tarjetas a ojo con el mouse no se logra nunca.
      const cerca = unicas.find(a => Math.abs(a - bruto) <= 10)
      ultimo = cerca ?? bruto
      guiasAlto(unicas.length ? { desde: caja!.top, altos: unicas, pegada: cerca ?? null } : null)
      setFantasma({ alto: ultimo })
    }
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      bloquear(false)
      guiasAlto(null)
      setFantasma(null)
      onAlto(Math.round(ultimo))
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  // `pointer-events-none` mientras no se pasa el mouse: transparente no es lo
  // mismo que ausente, y una manija invisible pegada al borde derecho seguía
  // atrapando los clics de lo que tuviera debajo —los pictogramas, entre otros.
  // En las tarjetas que son solo la imagen, el alto de la tarjeta y el de la
  // imagen son la misma cosa. Tener dos manijas una encima de la otra obligaba
  // a adivinar cuál se estaba agarrando, así que ahí manda la de la imagen.
  const soloImagen = (t.tipo === 'banner' || t.tipo === 'poster') && !!t.imagen_url

  const comun = 'absolute z-20 opacity-0 pointer-events-none group-hover:opacity-100'
    + ' group-hover:pointer-events-auto transition-opacity flex items-center justify-center'
  const barra = { background: 'rgba(11,23,54,0.75)' }

  return (
    <>
      {libre && (
        <div onPointerDown={estirarAncho} draggable={false}
          onDragStart={e => { e.preventDefault(); e.stopPropagation() }}
          title="Arrastre para ensanchar o angostar la tarjeta"
          className={`${comun} top-9 bottom-0 right-0 w-2.5 rounded-l`}
          style={{ ...barra, cursor: 'ew-resize' }}>
          <span className="w-0.5 h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.85)' }} />
        </div>
      )}
      {!soloImagen && (
        <div onPointerDown={estirarAlto} draggable={false}
          onDragStart={e => { e.preventDefault(); e.stopPropagation() }}
          title="Arrastre para dar más alto a la tarjeta"
          className={`${comun} left-0 right-0 bottom-0 h-2.5 rounded-t`}
          style={{ ...barra, cursor: 'ns-resize' }}>
          <span className="h-0.5 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.85)' }} />
        </div>
      )}

      {/* La guía: mientras se ensancha, se dibuja la raya de la columna donde
          va a caer la tarjeta. Sin ella hay que soltar para saber si quedó
          alineada con la de al lado, y volver a intentar si no. */}
      {fantasma?.ancho && (
        <div className="absolute inset-0 z-30 pointer-events-none" aria-hidden>
          <div className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${(fantasma.ancho / anchoDe(t)) * 100}%`,
              background: 'var(--primary)',
              boxShadow: '0 0 0 1px rgba(6,182,212,0.35)',
            }} />
        </div>
      )}

      {fantasma && (
        <span className="absolute right-2 bottom-5 z-30 px-2 py-0.5 rounded text-[11px] font-bold"
          style={{ background: '#0B1736', color: '#fff' }}>
          {fantasma.ancho
            ? `${fantasma.ancho} ${fantasma.ancho === 1 ? 'columna' : 'columnas'}`
            : `${Math.round(fantasma.alto ?? 0)} px de alto`}
        </span>
      )}
    </>
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
      <span className="text-[11px] font-bold truncate max-w-[180px] mr-1"
        style={{ color: 'rgba(255,255,255,0.72)' }} title={nombreDe(t)}>{nombreDe(t)}</span>
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
    case 'banner':         return <Banner t={t} />
    case 'texto':          return <Texto t={t} />
    case 'titulo':         return <Titular t={t} />
    case 'separador':      return <Separador t={t} />
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
  const { activo, guardarAlto, bloquear } = useContext(Diseno)
  const caja = useRef<HTMLDivElement>(null)
  // Mientras se arrastra, la altura vive aquí: así la imagen sigue al mouse sin
  // escribir en la base en cada píxel.
  const [estirando, setEstirando] = useState<number | null>(null)

  if (!t.imagen_url) return null
  const recorta = ajusteDe(t) === 'recortada'
  const alto = estirando ?? altoDe(t)

  const agarrar = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    bloquear(true)
    const inicioY = e.clientY
    // Si venía en "la imagen manda" no hay número de dónde partir: se toma el
    // alto que tiene puesto en pantalla en este momento.
    const inicioAlto = alto ?? caja.current?.getBoundingClientRect().height ?? 240

    // Las escuchas van en la ventana y no en la manija: el mouse se sale de
    // esos veinte píxeles de alto apenas se empieza a arrastrar, y entonces el
    // soltar caía en otro elemento y el alto quedaba a medio camino, sin
    // guardarse.
    let ultimo = inicioAlto
    const mover = (ev: PointerEvent) => {
      ultimo = Math.min(ALTO_MAXIMO, Math.max(ALTO_MINIMO, inicioAlto + (ev.clientY - inicioY)))
      setEstirando(ultimo)
    }
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      bloquear(false)
      window.removeEventListener('pointercancel', soltar)
      setEstirando(null)
      guardarAlto(t, Math.round(ultimo))
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
  }

  const manija = activo && (
    <>
      <div
        onPointerDown={agarrar}
        // La tarjeta entera es arrastrable para reordenar; sin esto, agarrar
        // la manija la arrancaba de su sitio en vez de estirar la imagen.
        draggable={false} onDragStart={e => { e.preventDefault(); e.stopPropagation() }}
        title="Arrastre para estirar o achicar la imagen"
        className="absolute inset-x-0 bottom-0 h-5 z-10 flex items-center justify-center"
        style={{ cursor: 'ns-resize', background: 'linear-gradient(to top, rgba(11,23,54,0.55), transparent)' }}>
        <span className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.85)' }} />
      </div>
      {alto != null && (
        <button
          onClick={e => { e.stopPropagation(); guardarAlto(t, null) }}
          title="Volver al alto natural de la imagen"
          className="absolute right-1.5 bottom-6 z-10 px-2 py-0.5 rounded text-[10.5px] font-bold"
          style={{ background: 'rgba(11,23,54,0.8)', color: '#fff' }}>
          {estirando != null ? `${Math.round(estirando)} px` : 'alto natural'}
        </button>
      )}
    </>
  )

  if (alto == null) {
    return (
      <div ref={caja} className="w-full relative" style={{ background: color }}>
        <img src={t.imagen_url} alt="" loading="lazy" className="w-full h-auto block" />
        {manija}
      </div>
    )
  }

  return (
    <div ref={caja} className="w-full relative overflow-hidden" style={{ height: alto, background: color }}>
      {!recorta && (
        <div className="absolute inset-0" aria-hidden style={{
          backgroundImage: `url(${t.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(18px) saturate(1.3)', transform: 'scale(1.2)',
        }} />
      )}
      <img src={t.imagen_url} alt="" loading="lazy"
        className={`relative w-full h-full ${recorta ? 'object-cover' : 'object-contain'}`} />
      {manija}
    </div>
  )
}

/**
 * La fila de pictogramas.
 *
 * Vive en el flujo de la tarjeta, debajo del texto, hasta que alguien la
 * arrastra: desde ahí queda suelta en el punto donde se soltó, guardado en
 * porcentaje del alto y el ancho de la tarjeta para que no se salga de ella
 * al cambiar de pantalla.
 */
function Iconos({ t, color, sobreOscuro }: { t: Tarjeta; color: string; sobreOscuro?: boolean }) {
  const { activo, guardarIconos, bloquear } = useContext(Diseno)
  const [fantasma, setFantasma] = useState<{ x: number; y: number } | null>(null)

  const ids = pictogramasDe(t)
  const tam = tamanoIconosDe(t)
  const pos = fantasma ?? posicionIconosDe(t)
  if (!ids.length) return null

  const agarrar = (e: React.PointerEvent) => {
    if (!activo) return
    e.preventDefault(); e.stopPropagation()
    bloquear(true)
    // El ancestro posicionado es la caja de la tarjeta: es contra ella que se
    // mide el porcentaje, no contra la ventana.
    const tarjeta = (e.currentTarget as HTMLElement).offsetParent as HTMLElement | null
    const caja = tarjeta?.getBoundingClientRect()
    if (!caja) return

    let ultimo = { x: 50, y: 50 }
    const mover = (ev: PointerEvent) => {
      ultimo = {
        x: Math.min(100, Math.max(0, ((ev.clientX - caja.left) / caja.width) * 100)),
        y: Math.min(100, Math.max(0, ((ev.clientY - caja.top) / caja.height) * 100)),
      }
      setFantasma(ultimo)
    }
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      bloquear(false)
      setFantasma(null)
      guardarIconos(t, { x: Math.round(ultimo.x), y: Math.round(ultimo.y) })
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  const fila = (
    <div
      onPointerDown={agarrar}
      draggable={false}
      onDragStart={e => { e.preventDefault(); e.stopPropagation() }}
      title={activo ? 'Arrastre los pictogramas a donde los quiera' : undefined}
      className={`flex flex-wrap items-center gap-2 ${pos ? '' : 'mt-3'}`}
      style={{
        cursor: activo ? 'move' : undefined,
        // Un recuadro punteado mientras se diseña, para que se vea que esto se
        // puede agarrar aunque esté sobre una imagen.
        outline: activo ? '1px dashed rgba(255,255,255,0.55)' : undefined,
        outlineOffset: activo ? 4 : undefined,
        borderRadius: 10,
      }}>
      {ids.map((id, i) => (
        <span key={`${id}-${i}`} className="rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            width: tam.caja, height: tam.caja,
            background: sobreOscuro ? 'rgba(255,255,255,0.14)' : 'var(--bg-card-hover)',
            border: sobreOscuro ? 'none' : '1px solid var(--border)',
            color: sobreOscuro ? '#fff' : color,
          }}>
          <Pictograma id={id} size={tam.dibujo} />
        </span>
      ))}
    </div>
  )

  if (!pos) return fila

  return (
    // Por encima de las manijas del borde mientras se diseña: si no, agarrar
    // los pictogramas que caen cerca del borde agarraba la manija.
    <div className={`absolute ${activo ? 'z-30' : 'z-10'}`} style={{
      left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)',
    }}>
      {fila}
    </div>
  )
}

/** Caja blanca estándar: todas las tarjetas chicas comparten esta forma. */
function Caja({ children, color, franja, t }: {
  children: React.ReactNode; color?: string; franja?: boolean; t?: Tarjeta
}) {
  return (
    <div className="rounded-2xl overflow-hidden relative"
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
    <div className="rounded-2xl overflow-hidden relative"
      style={{ background: color.suave, border: `1px solid ${color.borde}` }}>
      <Imagen t={t} color={color.fuerte} />
      <div className="p-5">
        {children}
        <Iconos t={t} color={color.fuerte} />
      </div>
    </div>
  )
}

function Rotulo({ icono: Icono, texto, color, tam, t, pieza = 'rotulo' }: {
  icono: any; texto: string; color: string; tam?: string; t?: Tarjeta; pieza?: 'rotulo' | 'titulo'
}) {
  // El rótulo se puede apagar: en una tarjeta con imagen propia, el letrero
  // «PRÓXIMAS CAPACITACIONES» a veces sobra. Y en las tarjetas donde ese
  // letrero ES el título, se apaga desde «Título», no desde «Rótulo».
  if (t && !seVe(t, pieza)) return null
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icono size={13} style={{ color }} />
      <span className="font-bold tracking-wider uppercase"
        style={{ color, fontSize: tam ?? '11px' }}>{texto}</span>
    </div>
  )
}

/**
 * El anuncio, armado por piezas.
 *
 * El orden de título, texto, imagen, etiqueta, pictogramas y botón sale de la
 * tarjeta, no del código: así el mismo tipo de tarjeta sirve para poner el
 * título encima de la imagen, debajo o superpuesto, sin un tipo nuevo por cada
 * arreglo posible.
 */
function Anuncio({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const fondo = ajusteDe(t) === 'recortada'
  const disposicion = disposicionDe(t)
  const superpuesto = disposicion === 'superpuesto'
  const alLado = disposicion === 'izquierda' || disposicion === 'derecha'
  const alinear = alineacionDe(t)
  const tam = tamanoDe(t)
  const aire = aireDe(t)
  const tinta = colorTextoDe(t)

  const centro = alinear === 'centro'
  const clasesAlineacion = centro ? 'items-center text-center'
    : alinear === 'derecha' ? 'items-end text-right' : 'items-start text-left'

  const piezas: Record<string, React.ReactNode> = {
    etiqueta: (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
        style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}>
        <Megaphone size={12} /> Anuncio
      </span>
    ),
    titulo: t.titulo ? (
      <h2 className="font-extrabold leading-tight"
        style={{ fontSize: medida(t, 'titulo'), fontWeight: grosorDe(t, 'titulo'), color: tinta ?? '#FFFFFF' }}>{t.titulo}</h2>
    ) : null,
    texto: t.texto ? (
      <p className="leading-relaxed" style={{
        // Sin color propio, el cuerpo va un punto más tenue que el título:
        // ayuda a que se lea primero el título y después el resto.
        color: tinta ?? 'rgba(255,255,255,0.84)', opacity: tinta ? 0.88 : 1,
        fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'),
        maxWidth: alLado ? undefined : centro ? '46rem' : '36rem',
      }}>{t.texto}</p>
    ) : null,
    iconos: (
      <div className={`flex ${centro ? 'justify-center' : alinear === 'derecha' ? 'justify-end' : ''}`}>
        <Iconos t={t} color="#fff" sobreOscuro />
      </div>
    ),
    boton: t.cta_texto && t.cta_url ? (
      <Link href={t.cta_url}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white"
        style={{ color: '#0B1736' }}>
        {t.cta_texto} <ArrowRight size={15} />
      </Link>
    ) : null,
  }

  // La imagen de fondo, la superpuesta y la de al lado no entran en la
  // columna: cada una va en su propia capa o su propia columna.
  const imagenSuelta = fondo || superpuesto || alLado
  // Los pictogramas, cuando están sueltos, flotan sobre toda la tarjeta y no
  // dentro de la columna: si se quedaran en la columna, el porcentaje se
  // mediría contra ella y no contra la tarjeta.
  const iconosSueltos = !!posicionIconosDe(t)
  const orden = ordenDe(t).filter(p =>
    seVe(t, p) && !(p === 'imagen' && imagenSuelta) && !(p === 'iconos' && iconosSueltos))

  const columna = (
    <div className={`relative flex flex-col ${clasesAlineacion}`}
      style={{ gap: Math.round(aire * 0.6), padding: aire }}>
      {orden.map(p => {
        if (p === 'imagen') {
          return t.imagen_url ? (
            <div key="imagen" className="w-full rounded-xl overflow-hidden"><Imagen t={t} color={c.fuerte} /></div>
          ) : null
        }
        return piezas[p] ? <div key={p}>{piezas[p]}</div> : null
      })}
    </div>
  )

  // Lado a lado. En celular se apilan: dos columnas en 360 píxeles de ancho
  // dejan el texto en una tira de letras sueltas.
  if (alLado && t.imagen_url) {
    const prop = proporcionDe(t)
    const imagen = (
      <div className="tablero-lado" style={{ flexBasis: prop.parte }}>
        <Imagen t={t} color={c.fuerte} />
      </div>
    )
    return (
      <div className="rounded-2xl relative overflow-hidden" style={{ background: c.degradado }}>
        <div className="tablero-fila flex items-stretch">
          {disposicion === 'izquierda' && imagen}
          <div className="tablero-lado flex-1 flex flex-col justify-center">{columna}</div>
          {disposicion === 'derecha' && imagen}
        </div>
        {iconosSueltos && <Iconos t={t} color="#fff" sobreOscuro />}
      </div>
    )
  }

  return (
    <div className="rounded-2xl relative overflow-hidden" style={{ background: c.degradado }}>
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

      {superpuesto && t.imagen_url ? (
        <div className="relative">
          <Imagen t={t} color={c.fuerte} />
          {/* Un velo oscuro: sin él, el texto blanco desaparece sobre las
              partes claras de la imagen. */}
          <div className="absolute inset-0" aria-hidden
            style={{ background: 'linear-gradient(to top, rgba(8,16,36,0.85), rgba(8,16,36,0.15))' }} />
          <div className="absolute inset-0 flex flex-col justify-end">{columna}</div>
        </div>
      ) : columna}
      {iconosSueltos && <Iconos t={t} color="#fff" sobreOscuro />}
    </div>
  )
}

/** Una franja de imagen sin caja: para logos y cabeceras. */
function Banner({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const alinear = alineacionDe(t)
  const tam = tamanoDe(t)
  const cuerpo = (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: c.suave }}>
      <Imagen t={t} color={c.suave} />
      {/* Sin texto visible, ni el recuadro: antes la franja de relleno se
          quedaba igual y robaba un renglón entero debajo de la imagen. */}
      {((t.titulo && seVe(t, 'titulo')) || (t.texto && seVe(t, 'texto'))) && (
        <div className="p-4" style={{
          textAlign: alinear === 'centro' ? 'center' : alinear === 'derecha' ? 'right' : 'left',
        }}>
          {t.titulo && seVe(t, 'titulo') && (
            <p className="font-extrabold leading-tight"
              style={{ color: tintaDe(t, 'titulo') ?? c.fuerte, fontSize: medida(t, 'titulo'), fontWeight: grosorDe(t, 'titulo') }}>{t.titulo}</p>
          )}
          {t.texto && seVe(t, 'texto') && (
            <p className="mt-1 leading-relaxed"
              style={{ color: tintaDe(t, 'texto') ?? 'var(--text-dim)', fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto') }}>{t.texto}</p>
          )}
          <Iconos t={t} color={c.fuerte} />
        </div>
      )}
    </div>
  )
  return t.cta_url ? <Link href={t.cta_url} className="block">{cuerpo}</Link> : cuerpo
}

/** Solo palabras: un mensaje destacado, una frase, un recordatorio. */
function Texto({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const alinear = alineacionDe(t)
  const tam = tamanoDe(t)
  const aire = aireDe(t)
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: c.suave, border: `1px solid ${c.borde}` }}>
      <Imagen t={t} color={c.fuerte} />
      <div style={{
        padding: aire,
        textAlign: alinear === 'centro' ? 'center' : alinear === 'derecha' ? 'right' : 'left',
      }}>
        {t.titulo && seVe(t, 'titulo') && (
          <p className="font-extrabold leading-tight"
            style={{ color: tintaDe(t, 'titulo') ?? c.fuerte, fontSize: medida(t, 'titulo'), fontWeight: grosorDe(t, 'titulo') }}>{t.titulo}</p>
        )}
        {t.texto && (
          <p className="leading-relaxed" style={{
            color: colorTextoDe(t) ?? 'var(--text-strong)',
            fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), marginTop: t.titulo ? 8 : 0,
          }}>{t.texto}</p>
        )}
        <Iconos t={t} color={c.fuerte} />
      </div>
    </div>
  )
}

/**
 * Una línea con título, o puro espacio, para partir el tablero en secciones.
 *
 * La primera versión dibujaba un pelo de un píxel que no se notaba entre dos
 * tarjetas. Ahora la línea tiene grosor y estilo propios, y el espacio de
 * arriba y abajo lo decide el aire, para que de verdad separe.
 */
/**
 * Un encabezado para abrir una sección del tablero.
 *
 * Sin caja, sin borde y sin fondo: es texto sobre el tablero. Una caja lo
 * volvería otra tarjeta más, y lo que se busca es que se lea como un título de
 * los que separan, no como un recuadro con letras.
 */
function Titular({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const alinear = alineacionDe(t)
  const aire = aireDe(t)
  return (
    <div style={{
      paddingTop: aire / 2, paddingBottom: aire / 2,
      textAlign: alinear === 'centro' ? 'center' : alinear === 'derecha' ? 'right' : 'left',
    }}>
      {t.titulo && seVe(t, 'titulo') && (
        <p className="font-black leading-tight" style={{
          fontSize: medida(t, 'titulo'), fontWeight: grosorDe(t, 'titulo') ?? 900,
          color: tintaDe(t, 'titulo') ?? c.fuerte,
        }}>{t.titulo}</p>
      )}
      {t.texto && seVe(t, 'texto') && (
        <p className="leading-relaxed mt-1" style={{
          fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'),
          color: tintaDe(t, 'texto') ?? 'var(--text-dim)',
        }}>{t.texto}</p>
      )}
      <Iconos t={t} color={c.fuerte} />
    </div>
  )
}

function Separador({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const aire = aireDe(t)
  const grosor = Math.min(12, Math.max(1, Number(t.datos?.grosorLinea) || 2))
  const estilo: 'solid' | 'dashed' | 'dotted' | 'double' =
    t.datos?.estiloLinea === 'punteada' ? 'dashed'
      : t.datos?.estiloLinea === 'puntos' ? 'dotted'
        : t.datos?.estiloLinea === 'doble' ? 'double' : 'solid'
  const tinta = tintaDe(t, 'titulo') ?? c.fuerte
  // La línea se dibuja con un borde y no con un fondo: un fondo no puede ser
  // punteado ni doble, y ahí se acababan los estilos posibles.
  const linea = {
    borderTopWidth: estilo === 'double' ? Math.max(3, grosor) : grosor,
    borderTopStyle: estilo,
    borderTopColor: tinta,
    opacity: 0.85,
  } as const

  if (!t.titulo || !seVe(t, 'titulo')) {
    return (
      <div style={{ paddingTop: aire / 2, paddingBottom: aire / 2 }} aria-hidden>
        <div style={linea} />
      </div>
    )
  }

  // La alineación mueve el texto de verdad: a la izquierda la línea va detrás,
  // a la derecha delante, y al centro queda partida en dos con el texto en
  // medio. Antes el control estaba y no hacía nada.
  const alinear = alineacionDe(t)
  const rotulo = (
    <span className="font-bold tracking-wider uppercase whitespace-nowrap"
      style={{ fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo') ?? 800, color: tinta }}>
      {t.titulo}
    </span>
  )
  const nota = t.texto && (
    <span className="whitespace-nowrap" style={{
      fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo'),
      color: tintaDe(t, 'texto') ?? 'var(--text-label)',
    }}>{t.texto}</span>
  )

  return (
    <div className="flex items-center gap-3" style={{ paddingTop: aire / 2, paddingBottom: aire / 2 }}>
      {alinear !== 'izquierda' && <span className="flex-1" style={linea} />}
      {rotulo}
      {nota}
      {alinear !== 'derecha' && <span className="flex-1" style={linea} />}
    </div>
  )
}

/** El póster: la imagen es el contenido, así que manda ella. */
function Poster({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  if (!t.imagen_url) {
    return (
      <Caja>
        <Rotulo t={t} pieza="titulo" icono={ImageIcon} texto={t.titulo || 'Póster'}
        color={tintaDe(t, 'titulo') ?? 'var(--text-label)'} tam={medida(t, 'titulo')} />
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
          {t.titulo && seVe(t, 'titulo') && (
            <p className="font-bold leading-snug"
              style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'titulo') ?? '#fff' }}>{t.titulo}</p>
          )}
          {t.texto && seVe(t, 'texto') && (
            <p className="mt-0.5"
              style={{ fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo'), color: tintaDe(t, 'texto') ?? 'rgba(255,255,255,0.8)' }}>{t.texto}</p>
          )}
        </div>
      )}
    </div>
  )
  return t.cta_url ? <Link href={t.cta_url} className="block">{cuerpo}</Link> : cuerpo
}

/**
 * El contador de días.
 *
 * Con imagen se vuelve otra cosa: la foto va de fondo, desenfocada y bajo un
 * velo oscuro, y el número encima en blanco. Sin imagen se queda en la caja
 * de color de siempre. Esa es la diferencia entre una cifra en una caja lisa y
 * algo que la gente mira al pasar.
 */
function Contador({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'verde')
  const dias: number | null = t.datos?.dias ?? null
  const meta = Number(t.datos?.meta) || null
  const avance = dias != null && meta ? Math.min(100, Math.round((dias / meta) * 100)) : null
  const aire = aireDe(t)
  const conFoto = !!t.imagen_url && seVe(t, 'imagen')
  const donde = dondeTextoDe(t)
  const leyenda = leyendaDe(t, dias)
  const alinear = alineacionDe(t)
  const alineado = alinear === 'izquierda' ? 'text-left items-start'
    : alinear === 'derecha' ? 'text-right items-end' : 'text-center items-center'
  const centrado = alinear === 'izquierda' ? 'justify-start'
    : alinear === 'derecha' ? 'justify-end' : 'justify-center'

  // Sobre una foto el texto va claro por omisión; sobre la caja de color, con
  // los colores de la tarjeta. Lo que se elija a mano manda sobre los dos.
  const tinta = (p: Parameters<typeof tintaDe>[1], claro: string, oscuro: string) =>
    tintaDe(t, p) ?? (conFoto ? claro : oscuro)

  const numero = (
    <span className="font-black leading-none tabular-nums block"
      style={{
        fontSize: medida(t, 'numero'), fontWeight: grosorDe(t, 'numero'),
        color: tinta('numero', '#FFFFFF', c.fuerte),
        textShadow: conFoto ? '0 2px 18px rgba(0,0,0,0.45)' : undefined,
      }}>
      {dias ?? '—'}
    </span>
  )

  const textos = (
    <>
      {seVe(t, 'rotulo') && t.titulo && (
        <span className="font-bold tracking-wider uppercase block"
          style={{
            fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo'),
            color: tinta('rotulo', 'rgba(255,255,255,0.85)', c.fuerte),
          }}>
          {t.titulo}
        </span>
      )}
      {seVe(t, 'titulo') && leyenda && (
        <span className="font-semibold block"
          style={{
            fontSize: medida(t, 'titulo'), fontWeight: grosorDe(t, 'titulo') ?? 600,
            color: tinta('titulo', '#FFFFFF', 'var(--text-strong)'),
          }}>
          {leyenda}
        </span>
      )}
    </>
  )

  const pie = seVe(t, 'texto') && (
    <>
      {avance != null && (
        <div className="w-full mt-3">
          <p className="mb-1.5" style={{
            fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo'),
            color: tinta('texto', 'rgba(255,255,255,0.8)', 'var(--text-label)'),
          }}>
            Meta: {meta} días{avance >= 100 ? ' · ¡cumplida!' : ''}
          </p>
          <div className="h-1.5 rounded-full overflow-hidden"
            style={{ background: conFoto ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.07)' }}>
            <div className="h-full rounded-full"
              style={{ width: `${avance}%`, background: conFoto ? '#FFFFFF' : c.fuerte }} />
          </div>
        </div>
      )}
      {t.texto && (
        <p className="mt-2" style={{
          fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo'),
          color: tinta('texto', 'rgba(255,255,255,0.8)', 'var(--text-label)'),
        }}>
          {t.texto}
        </p>
      )}
    </>
  )

  // Con el texto al lado, número y palabras van en fila; si no, uno sobre otro
  // y en el orden que se pida.
  const alLado = donde === 'izquierda' || donde === 'derecha'
  const cuerpo = alLado ? (
    <div className={`flex items-center gap-4 flex-wrap ${centrado}`}>
      {donde === 'izquierda' && <div className="text-right">{textos}</div>}
      {numero}
      {donde === 'derecha' && <div className="text-left">{textos}</div>}
    </div>
  ) : donde === 'arriba' ? (
    <><div className="mb-1.5">{textos}</div>{numero}</>
  ) : (
    <>{numero}<div className="mt-1.5">{textos}</div></>
  )

  // El pie —la meta y la nota— puede ir arriba de todo o abajo, porque con el
  // número a la izquierda la barra de la meta encima se leía antes que la
  // cifra, que es justo al revés de lo que se quiere contar.
  const pieArriba = t.datos?.pieArriba === true


  return (
    <div className="rounded-2xl relative overflow-hidden"
      style={conFoto
        ? { background: c.degradado }
        : { background: c.suave, border: `1px solid ${c.borde}` }}>
      {conFoto && (
        <>
          <div className="absolute inset-0" aria-hidden style={{
            backgroundImage: `url(${t.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          {/* El velo no es decoración: sin él, el número blanco desaparece
              sobre las partes claras de la foto. */}
          <div className="absolute inset-0" aria-hidden style={{
            background: 'linear-gradient(to top, rgba(8,16,36,0.85), rgba(8,16,36,0.45))',
            backdropFilter: 'blur(2px)',
          }} />
        </>
      )}
      <div className={`relative flex flex-col justify-center ${alineado}`} style={{ padding: aire }}>
        {pieArriba && <div className="w-full mb-2">{pie}</div>}
        {cuerpo}
        {!pieArriba && pie}
        <Iconos t={t} color={conFoto ? '#fff' : c.fuerte} sobreOscuro={conFoto} />
      </div>
    </div>
  )
}

function Alerta({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'rojo')
  return (
    <CajaColor color={c} t={t}>
      <Rotulo t={t} icono={AlertTriangle} texto="Alerta" color={tintaDe(t, 'rotulo') ?? c.fuerte} tam={medida(t, 'rotulo')} />
      <p className="font-bold leading-snug"
        style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'titulo') ?? 'var(--text)' }}>{t.titulo}</p>
      {t.texto && (
        <p className="mt-1.5 leading-relaxed"
          style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-dim)' }}>{t.texto}</p>
      )}
    </CajaColor>
  )
}

function Capacitaciones({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const proximas: any[] = t.datos?.capacitaciones?.proximas ?? []
  return (
    <Caja t={t} color={c.fuerte}>
      <Rotulo t={t} pieza="titulo" icono={CalendarDays} texto={t.titulo || 'Próximas capacitaciones'}
        color={tintaDe(t, 'titulo') ?? 'var(--text-label)'} tam={medida(t, 'titulo')} />
      {proximas.length === 0 ? (
        <p style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-label)' }}>
          No hay ninguna programada.
        </p>
      ) : (
        <div className="space-y-2.5">
          {proximas.map((p, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-1 rounded-full flex-shrink-0" style={{ background: c.fuerte, opacity: 0.45 }} />
              <div className="min-w-0">
                <p className="font-semibold leading-snug"
                  style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'titulo') ?? 'var(--text)' }}>{p.titulo}</p>
                <p className="mt-0.5"
                  style={{ fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo'), color: tintaDe(t, 'texto') ?? 'var(--text-label)' }}>
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
      <Rotulo t={t} pieza="titulo" icono={GraduationCap} texto={t.titulo || 'Mi formación'}
        color={tintaDe(t, 'titulo') ?? 'var(--text-label)'} tam={medida(t, 'titulo')} />
      {pct == null ? (
        <p style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-label)' }}>
          Todavía no tiene cursos asignados.
        </p>
      ) : (
        <>
          <p className="font-extrabold tabular-nums leading-none"
            style={{ fontSize: `calc(${medida(t, 'numero')} * 0.42)`, fontWeight: grosorDe(t, 'numero'), color: tintaDe(t, 'numero') ?? 'var(--text)' }}>
            {pct}% al día
          </p>
          <p className="mt-1" style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-label)' }}>
            {d.pendientes === 0
              ? 'No tiene nada pendiente'
              : `${d.pendientes} ${d.pendientes === 1 ? 'curso pendiente' : 'cursos pendientes'} en SSTudio`}
          </p>
          <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ background: 'rgba(0,0,0,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.fuerte }} />
          </div>
          <Link href="/dashboard/my-plan" className="inline-flex items-center gap-1 font-semibold mt-3"
            style={{ fontSize: medida(t, 'rotulo'), fontWeight: grosorDe(t, 'rotulo'), color: c.fuerte }}>
            Ver mis cursos <ArrowRight size={13} />
          </Link>
        </>
      )}
    </Caja>
  )
}

function Pausa({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color)
  const tam = tamanoDe(t)
  return (
    <Caja t={t} color={c.fuerte}>
      <Rotulo t={t} pieza="titulo" icono={HeartPulse} texto={t.titulo || 'Pausa activa'}
        color={tintaDe(t, 'titulo') ?? 'var(--text-label)'} tam={medida(t, 'titulo')} />
      {t.datos?.hora && (
        // La hora es el número de esta tarjeta, pero escrita: a escala plena
        // se desborda de la caja, así que va a poco menos de la mitad.
        <p className="font-extrabold tabular-nums leading-none"
          style={{ fontSize: `calc(${medida(t, 'numero')} * 0.42)`, fontWeight: grosorDe(t, 'numero'), color: tintaDe(t, 'numero') ?? c.fuerte }}>
          {t.datos.hora}
        </p>
      )}
      {t.texto && (
        <p className="mt-1.5 leading-relaxed"
          style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-dim)' }}>{t.texto}</p>
      )}
    </Caja>
  )
}

function Epp({ t }: { t: Tarjeta }) {
  const items: string[] = Array.isArray(t.datos?.items) ? t.datos.items : []
  return (
    <Caja t={t} color={COLOR(t.color).fuerte}>
      <Rotulo t={t} pieza="titulo" icono={HardHat} texto={t.titulo || 'EPP de hoy'}
        color={tintaDe(t, 'titulo') ?? 'var(--text-label)'} tam={medida(t, 'titulo')} />
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((it, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg font-semibold"
              style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), background: 'var(--bg-card-hover)',
                color: tintaDe(t, 'texto') ?? 'var(--text-strong)', border: '1px solid var(--border)' }}>
              {it}
            </span>
          ))}
        </div>
      )}
      {t.texto && (
        <p className="leading-relaxed"
          style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-dim)' }}>{t.texto}</p>
      )}
    </Caja>
  )
}

function Reconocimiento({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'verde')
  return (
    <CajaColor color={c} t={t}>
      <Rotulo t={t} icono={Award} texto="Reconocimiento" color={tintaDe(t, 'rotulo') ?? c.fuerte} tam={medida(t, 'rotulo')} />
      <p className="font-bold leading-snug"
        style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'titulo') ?? 'var(--text)' }}>{t.titulo}</p>
      {t.texto && (
        <p className="mt-1.5 leading-relaxed"
          style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-dim)' }}>{t.texto}</p>
      )}
    </CajaColor>
  )
}

function Copasst({ t }: { t: Tarjeta }) {
  const c = COLOR(t.color ?? 'azul')
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: c.suave, border: `1px solid ${c.borde}` }}>
      <Imagen t={t} color={c.fuerte} />
      <div className="p-5 flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.fuerte }}>
          <Users size={19} color="#fff" />
        </div>
        <div className="flex-1 min-w-[200px]">
          {t.titulo && seVe(t, 'titulo') && (
            <p className="font-bold tracking-wider uppercase"
              style={{ fontSize: medida(t, 'titulo'), fontWeight: grosorDe(t, 'titulo'),
                color: tintaDe(t, 'titulo') ?? c.fuerte }}>
              {t.titulo}
            </p>
          )}
          <p className="font-bold mt-0.5 leading-snug"
            style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text)' }}>{t.texto}</p>
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
      <Rotulo t={t} pieza="titulo" icono={ShieldCheck} texto={t.titulo || 'Nota'}
        color={tintaDe(t, 'titulo') ?? 'var(--text-label)'} tam={medida(t, 'titulo')} />
      {t.texto && (
        <p className="leading-relaxed"
          style={{ fontSize: medida(t, 'texto'), fontWeight: grosorDe(t, 'texto'), color: tintaDe(t, 'texto') ?? 'var(--text-dim)' }}>{t.texto}</p>
      )}
    </Caja>
  )
}
