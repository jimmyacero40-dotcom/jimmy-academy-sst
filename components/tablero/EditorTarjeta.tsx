'use client'

import { useEffect, useState } from 'react'
import { X, Upload, AlertCircle, Loader2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import {
  TIPOS, TIPO, COLORES, ALTOS, AJUSTES, PICTOGRAMAS, PIEZAS, TAMANOS, AIRES,
  DISPOSICIONES, PROPORCIONES, PALETA_TEXTO, PIEZAS_TEXTO, TAMANOS_ICONO, DONDE_TEXTO, FUENTES,
  diasDesde, anchoDe, ajusteDe, pictogramasDe,
  ordenDe, alineacionDe, disposicionDe, proporcionDe,
  tamanoIconosDe, posicionIconosDe, ocultosDe, dondeTextoDe, textosDe, nombreCampoTitulo,
  columnaInicial,
  PX_MINIMO, PX_MAXIMO,
  type Tarjeta, type TipoTarjeta, type ColorTarjeta, type Ajuste, type Alto,
  type Pieza, type PiezaTexto, type Alineacion, type Tamano, type Aire,
  type Disposicion, type Proporcion,
} from '@/lib/tablero'
import { comprimirImagen } from '@/lib/comprimir-imagen'
import { Pictograma } from '@/components/tablero/Pictograma'

export interface Opciones { centros: string[]; areas: string[] }

/** Cambia de puesto un elemento de la lista con su vecino. */
const intercambiar = <T,>(lista: T[], i: number, hacia: -1 | 1): T[] => {
  const j = i + hacia
  if (j < 0 || j >= lista.length) return lista
  const copia = [...lista]
  ;[copia[i], copia[j]] = [copia[j], copia[i]]
  return copia
}

/**
 * El formulario de una tarjeta.
 *
 * Vive aquí y no dentro de una pantalla porque se abre desde dos sitios: la
 * lista de «Editar tablero» y el tablero mismo cuando está en modo diseño.
 * Tenerlo duplicado era garantía de que un campo nuevo apareciera en uno y no
 * en el otro.
 */
export function EditorTarjeta({ tarjeta, opciones, onGuardar, onCerrar }: {
  tarjeta: Tarjeta
  opciones: Opciones
  onGuardar: (cambios: Partial<Tarjeta>) => Promise<void>
  onCerrar: () => void
}) {
  const meta = TIPO(tarjeta.tipo)
  const tiene = (campo: string) => meta.campos.includes(campo)

  // Los textos que esta tarjeta tiene de verdad, con el nombre que les
  // corresponde aquí. El editor mostraba los cuatro siempre, incluidos los que
  // no movían nada.
  const textos = textosDe(tarjeta.tipo)
  const [pieza, setPieza] = useState<PiezaTexto>(textos[0].pieza)

  const [f, setF] = useState({
    nombre: (tarjeta.datos?.nombre ?? '') as string,
    ocultos: ocultosDe(tarjeta),
    titulo: tarjeta.titulo ?? '',
    texto: tarjeta.texto ?? '',
    destacado: tarjeta.destacado ?? '',
    cta_texto: tarjeta.cta_texto ?? '',
    cta_url: tarjeta.cta_url ?? '',
    color: (tarjeta.color ?? 'cian') as ColorTarjeta,
    imagen_url: tarjeta.imagen_url ?? '',
    hora: tarjeta.datos?.hora ?? '',
    items: Array.isArray(tarjeta.datos?.items) ? tarjeta.datos.items.join(', ') : '',
    desde_contador: tarjeta.datos?.desde_contador ?? '',
    meta: tarjeta.datos?.meta ?? '',
    ancho: anchoDe(tarjeta),
    ajuste: ajusteDe(tarjeta) as Ajuste,
    alto: (tarjeta.datos?.alto ?? 'auto') as Alto,
    iconos: pictogramasDe(tarjeta),
    tamanoIconos: tamanoIconosDe(tarjeta).id,
    iconosPos: posicionIconosDe(tarjeta),
    orden: ordenDe(tarjeta),
    alineacion: alineacionDe(tarjeta) as Alineacion,
    disposicion: disposicionDe(tarjeta) as Disposicion,
    proporcion: proporcionDe(tarjeta).id as Proporcion,
    colorTexto: (tarjeta.datos?.colorTexto ?? null) as string | null,
    tintas: (tarjeta.datos?.tintas ?? {}) as Record<string, string | null>,
    tamanos: (tarjeta.datos?.tamanos ?? {}) as Record<string, string | null>,
    px: (tarjeta.datos?.px ?? {}) as Record<string, number | null>,
    negritas: (tarjeta.datos?.negritas ?? {}) as Record<string, boolean | null>,
    leyenda: (tarjeta.datos?.leyenda ?? '') as string,
    dondeTexto: dondeTextoDe(tarjeta) as string,
    pieArriba: tarjeta.datos?.pieArriba === true,
    letraElastica: tarjeta.datos?.letraElastica === true,
    col: columnaInicial(tarjeta) as number | null,
    fuente: (tarjeta.datos?.fuente ?? 'sistema') as string,
    grosorLinea: (Number(tarjeta.datos?.grosorLinea) || 2) as number,
    estiloLinea: (tarjeta.datos?.estiloLinea ?? 'solida') as string,
    tamano: (tarjeta.datos?.tamano ?? 'normal') as Tamano,
    aire: (tarjeta.datos?.aire ?? 'normal') as Aire,
    activa: tarjeta.activa,
    desde: (tarjeta.desde ?? '').slice(0, 10),
    hasta: (tarjeta.hasta ?? '').slice(0, 10),
  })

  const audInicial = tarjeta.audiencia as any
  const [paraTodos, setParaTodos] = useState(
    !!audInicial?.todos || (!audInicial?.centros?.length && !audInicial?.areas?.length))
  const [centros, setCentros] = useState<string[]>(audInicial?.centros ?? [])
  const [areas, setAreas] = useState<string[]>(audInicial?.areas ?? [])

  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const alternar = (lista: string[], poner: (v: string[]) => void, v: string) =>
    poner(lista.includes(v) ? lista.filter(x => x !== v) : [...lista, v])

  // Lo que se subió en esta sesión de edición y todavía no se ha guardado. Si
  // se cierra sin guardar, esos archivos se borran: si no, quedarían en la
  // bodega sin que ninguna tarjeta los nombre.
  const [sueltas, setSueltas] = useState<string[]>([])

  const descartar = (urls: string[]) => {
    for (const u of urls) {
      if (u && u !== tarjeta.imagen_url) {
        fetch(`/api/tablero/imagen?url=${encodeURIComponent(u)}`, { method: 'DELETE' }).catch(() => {})
      }
    }
  }

  // Lo que había al abrir, para saber si hay algo que perder al cerrar. La
  // audiencia va aparte de `f`, así que entra también.
  const retrato = () => JSON.stringify([f, paraTodos, centros, areas])
  const [inicial] = useState(retrato)

  const cerrarSinGuardar = () => {
    const cambiado = retrato() !== inicial || sueltas.length > 0
    if (cambiado && !confirm('Hay cambios sin guardar. ¿Cerrar y perderlos?')) return
    descartar(sueltas)
    onCerrar()
  }

  const subir = async (archivo: File) => {
    setError(null)
    const antes = archivo.size
    setSubiendo('Aligerando la imagen…')
    const liviano = await comprimirImagen(archivo)
    setSubiendo(`Subiendo… ${(antes / 1048576).toFixed(1)} MB → ${(liviano.size / 1024).toFixed(0)} KB`)

    const fd = new FormData()
    fd.append('archivo', liviano)
    const r = await fetch('/api/tablero/imagen', { method: 'POST', body: fd })
    const d = await r.json().catch(() => ({}))
    setSubiendo(null)
    if (!r.ok) { setError(d.error ?? 'No se pudo subir la imagen'); return }
    descartar([f.imagen_url])
    setSueltas(s => [...s.filter(u => u !== f.imagen_url), d.imagen_url])
    set('imagen_url', d.imagen_url)
  }

  const quitarImagen = () => {
    descartar([f.imagen_url])
    setSueltas(s => s.filter(u => u !== f.imagen_url))
    set('imagen_url', '')
  }

  const enviar = async () => {
    setError(null)
    if (f.desde && f.hasta && f.desde > f.hasta) {
      setError('La fecha de inicio va después de la de fin')
      return
    }
    if (f.activa && !paraTodos && !centros.length && !areas.length) {
      setError('Marque al menos una sede o un área, o publíquela para todos')
      return
    }

    const datos: Record<string, any> = { ...tarjeta.datos }
    if (tiene('hora')) datos.hora = f.hora || null
    if (tiene('items')) datos.items = f.items.split(',').map(s => s.trim()).filter(Boolean)
    if (tiene('desde_contador')) {
      datos.desde_contador = f.desde_contador || null
      datos.meta = Number(f.meta) || null
    }
    if (meta.anchoLibre) datos.ancho = f.ancho
    if (tiene('imagen')) { datos.ajuste = f.ajuste; datos.alto = f.alto }
    datos.iconos = f.iconos
    datos.tamanoIconos = f.tamanoIconos
    datos.iconosPos = f.iconosPos
    datos.orden = f.orden
    datos.alineacion = f.alineacion
    datos.disposicion = f.disposicion
    datos.proporcion = f.proporcion
    datos.colorTexto = f.colorTexto
    datos.tintas = f.tintas
    datos.tamanos = f.tamanos
    datos.px = f.px
    if (tiene('leyenda')) datos.leyenda = f.leyenda
    if (tarjeta.tipo === 'contador') { datos.dondeTexto = f.dondeTexto; datos.pieArriba = f.pieArriba }
    datos.negritas = f.negritas
    datos.letraElastica = f.letraElastica
    datos.fuente = f.fuente
    if (meta.anchoLibre) datos.col = f.col
    if (tarjeta.tipo === 'separador') {
      datos.grosorLinea = f.grosorLinea
      datos.estiloLinea = f.estiloLinea
    }
    datos.nombre = f.nombre.trim() || null
    datos.ocultos = f.ocultos
    datos.tamano = f.tamano
    datos.aire = f.aire

    setGuardando(true)
    await onGuardar({
      titulo: f.titulo.trim() || null,
      texto: f.texto.trim() || null,
      destacado: tiene('destacado') ? (f.destacado.trim() || null) : tarjeta.destacado,
      cta_texto: tiene('cta') ? (f.cta_texto.trim() || null) : tarjeta.cta_texto,
      cta_url: tiene('cta') ? (f.cta_url.trim() || null) : tarjeta.cta_url,
      color: f.color,
      imagen_url: tiene('imagen') ? (f.imagen_url || null) : tarjeta.imagen_url,
      datos,
      activa: f.activa,
      desde: f.desde ? `${f.desde}T00:00:00` : null,
      hasta: f.hasta ? `${f.hasta}T23:59:59` : null,
      audiencia: paraTodos ? { todos: true } : { centros, areas },
    } as any)
    setGuardando(false)
  }

  const dias = tiene('desde_contador') ? diasDesde(f.desde_contador) : null

  return (
    <Telon onCerrar={cerrarSinGuardar} titulo={meta.nombre} ayuda={meta.ayuda} descartable={false}>
      <div className="space-y-4">
        <Campo etiqueta="Nombre de la tarjeta"
          nota="Solo para usted. No se ve en el tablero.">
          <input value={f.nombre} onChange={e => set('nombre', e.target.value)}
            placeholder={meta.nombre} style={estiloCampo} />
        </Campo>

        <Campo etiqueta={nombreCampoTitulo(tarjeta.tipo)}
          nota="Esto sí lo lee el trabajador. Déjelo vacío si no quiere que salga.">
          <input value={f.titulo} onChange={e => set('titulo', e.target.value)} style={estiloCampo} />
        </Campo>

        {!meta.automatica && (
          <Campo etiqueta="Texto">
            <textarea value={f.texto} onChange={e => set('texto', e.target.value)} rows={3}
              style={{ ...estiloCampo, resize: 'vertical' }} />
          </Campo>
        )}

        {tiene('destacado') && (
          <Campo etiqueta="Número grande de fondo" nota="Opcional. Tres o cuatro caracteres, como «48h» o «3».">
            <input value={f.destacado} onChange={e => set('destacado', e.target.value)} maxLength={6}
              style={{ ...estiloCampo, maxWidth: 140 }} />
          </Campo>
        )}

        {tiene('hora') && (
          <Campo etiqueta="Hora">
            <input value={f.hora} onChange={e => set('hora', e.target.value)} placeholder="10:30 a. m."
              style={{ ...estiloCampo, maxWidth: 180 }} />
          </Campo>
        )}

        {tiene('items') && (
          <Campo etiqueta="Elementos" nota="Separados por coma. Salen como etiquetas.">
            <input value={f.items} onChange={e => set('items', e.target.value)}
              placeholder="Botas, Guantes, Gorra, Gafas UV" style={estiloCampo} />
          </Campo>
        )}

        {tiene('leyenda') && (
          <Campo etiqueta="Frase bajo el número"
            nota="Lo que va pegado a la cifra. Déjelo vacío para dejar el número solo.">
            <input value={f.leyenda} onChange={e => set('leyenda', e.target.value)}
              placeholder="días sin accidentes" style={estiloCampo} />
          </Campo>
        )}

        {tiene('desde_contador') && (
          <div className="flex gap-3 flex-wrap">
            <Campo etiqueta="Fecha del último accidente">
              <input type="date" value={f.desde_contador} onChange={e => set('desde_contador', e.target.value)}
                style={{ ...estiloCampo, maxWidth: 190 }} />
            </Campo>
            <Campo etiqueta="Meta de días">
              <input type="number" min={1} value={f.meta} onChange={e => set('meta', e.target.value)}
                style={{ ...estiloCampo, maxWidth: 120 }} />
            </Campo>
            {dias != null && (
              <div className="self-end pb-2 text-[13px] font-semibold" style={{ color: '#059669' }}>
                Van {dias} {dias === 1 ? 'día' : 'días'}
              </div>
            )}
          </div>
        )}

        {tiene('cta') && (
          <div className="flex gap-3 flex-wrap">
            <Campo etiqueta="Texto del botón">
              <input value={f.cta_texto} onChange={e => set('cta_texto', e.target.value)}
                placeholder="Enviar propuesta" style={{ ...estiloCampo, maxWidth: 220 }} />
            </Campo>
            <Campo etiqueta="A dónde lleva">
              <input value={f.cta_url} onChange={e => set('cta_url', e.target.value)}
                placeholder="/dashboard/reportal/nuevo" style={{ ...estiloCampo, minWidth: 240 }} />
            </Campo>
          </div>
        )}

        {tiene('imagen') && (
          <>
            <Campo etiqueta="Imagen" nota="Se aligera sola antes de subirla.">
              <div className="flex items-center gap-3 flex-wrap">
                {f.imagen_url && (
                  <img src={f.imagen_url} alt="" className="w-24 h-16 object-contain rounded-lg"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-card-hover)' }} />
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer"
                  style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  <Upload size={14} /> {f.imagen_url ? 'Cambiar' : 'Subir imagen'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={e => { const a = e.target.files?.[0]; if (a) subir(a) }} />
                </label>
                {f.imagen_url && (
                  <button onClick={quitarImagen} className="text-[13px] font-semibold"
                    style={{ color: '#DC2626' }}>Quitar</button>
                )}
                {subiendo && (
                  <span className="text-[12.5px] inline-flex items-center gap-1.5" style={{ color: 'var(--text-label)' }}>
                    <Loader2 size={13} className="animate-spin" /> {subiendo}
                  </span>
                )}
              </div>
            </Campo>

            {f.imagen_url && (
              <div className="flex gap-3 flex-wrap">
                <Campo etiqueta="Cómo se ve">
                  <Botones opciones={AJUSTES.map(a => ({ id: a.id, texto: a.nombre, titulo: a.ayuda }))}
                    valor={f.ajuste} onElegir={v => set('ajuste', v)} />
                </Campo>
                <Campo etiqueta="Alto">
                  <Botones opciones={ALTOS.map(a => ({ id: a.id, texto: a.nombre }))}
                    valor={f.alto} onElegir={v => set('alto', v)} />
                </Campo>
              </div>
            )}
          </>
        )}

        {f.iconos.length > 0 && (
          <Campo etiqueta="Los que eligió" nota="En este orden salen. Use las flechas para cambiarlo.">
            <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl"
              style={{ background: 'var(--bg-card-hover)' }}>
              {f.iconos.map((id: string, i: number) => (
                <div key={`${id}-${i}`} className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <button onClick={() => set('iconos', intercambiar(f.iconos, i, -1))} disabled={i === 0}
                    aria-label="Mover antes" className="p-0.5 disabled:opacity-20"
                    style={{ color: 'var(--text-faint)' }}>‹</button>
                  <span style={{ color: 'var(--text-dim)' }}><Pictograma id={id} size={18} /></span>
                  <button onClick={() => set('iconos', intercambiar(f.iconos, i, 1))}
                    disabled={i === f.iconos.length - 1} aria-label="Mover después"
                    className="p-0.5 disabled:opacity-20" style={{ color: 'var(--text-faint)' }}>›</button>
                </div>
              ))}
            </div>
          </Campo>
        )}

        {f.iconos.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            <Campo etiqueta="Tamaño de los pictogramas">
              <Botones valor={f.tamanoIconos} onElegir={v => set('tamanoIconos', v)}
                opciones={TAMANOS_ICONO.map(x => ({ id: x.id, texto: x.nombre }))} />
            </Campo>
            <Campo etiqueta="Dónde van" nota="Arrástrelos sobre el tablero para soltarlos en otro punto.">
              <Botones valor={!f.iconosPos} onElegir={v => set('iconosPos', v ? null : { x: 50, y: 50 })}
                opciones={[
                  { id: true, texto: 'Debajo del texto' },
                  { id: false, texto: 'Sueltos en la tarjeta' },
                ]} />
            </Campo>
          </div>
        )}

        <Campo etiqueta="Pictogramas" nota="Opcional. Toque uno para ponerlo o quitarlo.">
          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl max-h-[168px] overflow-y-auto"
            style={{ background: 'var(--bg-card-hover)' }}>
            {PICTOGRAMAS.map(p => {
              const on = f.iconos.includes(p.id)
              return (
                <button key={p.id} title={p.nombre} aria-pressed={on}
                  onClick={() => set('iconos', f.iconos.includes(p.id)
                    ? f.iconos.filter((i: string) => i !== p.id)
                    : [...f.iconos, p.id])}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg w-[66px]"
                  style={{
                    background: on ? 'var(--primary-dim)' : 'var(--bg-surface)',
                    color: on ? 'var(--primary-dark)' : 'var(--text-dim)',
                    border: `1px solid ${on ? 'var(--primary-border)' : 'var(--border)'}`,
                  }}>
                  <Pictograma id={p.id} size={17} />
                  <span className="text-[10px] font-semibold truncate w-full text-center">{p.nombre}</span>
                </button>
              )
            })}
          </div>
        </Campo>

        {meta.anchoLibre && (
          <div className="flex gap-3 flex-wrap">
            <Campo etiqueta="Qué tan ancha" nota="En celular todas ocupan el ancho completo.">
              <Botones valor={f.ancho} onElegir={v => set('ancho', v)} opciones={[
                { id: 1, texto: 'Angosta' }, { id: 2, texto: 'Mediana' }, { id: 3, texto: 'Todo el ancho' },
              ]} />
            </Campo>
            <Campo etiqueta="En qué columna empieza" nota="«Suelta» la acomoda detrás de la anterior.">
              <Botones valor={f.col} onElegir={v => set('col', v)} opciones={[
                { id: null, texto: 'Suelta' },
                { id: 1, texto: 'Izquierda' }, { id: 2, texto: 'Centro' }, { id: 3, texto: 'Derecha' },
              ]} />
            </Campo>
          </div>
        )}

        <Campo etiqueta="Tipografía" nota="Toque una y vea cómo queda al cerrar.">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}>
            {FUENTES.map(fu => {
              const on = f.fuente === fu.id
              return (
                // Cada opción se dibuja con su propia letra: leer el nombre
                // «Garamond» en Arial no dice nada de cómo va a quedar.
                <button key={fu.id} onClick={() => set('fuente', fu.id)}
                  className="px-2.5 py-2 rounded-lg text-left"
                  style={{
                    fontFamily: fu.css,
                    background: on ? 'var(--primary-dim)' : 'var(--bg-card-hover)',
                    color: on ? 'var(--primary-dark)' : 'var(--text-dim)',
                    border: `1px solid ${on ? 'var(--primary-border)' : 'var(--border)'}`,
                  }}>
                  <span className="block text-[15px] font-bold leading-none">Aa</span>
                  <span className="block text-[11px] mt-1 truncate">{fu.nombre}</span>
                </button>
              )
            })}
          </div>
        </Campo>

        <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }} />
        <p className="text-[12px] font-bold -mb-1" style={{ color: 'var(--text-dim)' }}>Composición</p>

        <div className="flex gap-3 flex-wrap">
          <Campo etiqueta="Alineación">
            <Botones valor={f.alineacion} onElegir={v => set('alineacion', v)} opciones={[
              { id: 'izquierda', texto: 'Izquierda' }, { id: 'centro', texto: 'Centro' }, { id: 'derecha', texto: 'Derecha' },
            ]} />
          </Campo>
          <Campo etiqueta="Tamaño de todo el texto">
            <Botones valor={f.tamano} onElegir={v => set('tamano', v)}
              opciones={TAMANOS.map(t => ({ id: t.id, texto: t.nombre }))} />
          </Campo>
        </div>

        {/* Un solo sitio por texto: se escoge cuál se está editando y debajo
            salen todas sus propiedades. Antes el tamaño estaba en un bloque y
            el color en otro, y había que acordarse de cuál renglón era cuál. */}
        <Campo etiqueta="Formato del texto" nota="Escoja qué texto quiere cambiar.">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="flex flex-wrap gap-1 p-2" style={{ background: 'var(--bg-card-hover)' }}>
              {textos.map(tx => {
                const on = pieza === tx.pieza
                return (
                  <button key={tx.pieza} onClick={() => setPieza(tx.pieza)}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold"
                    style={{
                      background: on ? 'var(--bg-surface)' : 'transparent',
                      color: on ? 'var(--primary-dark)' : 'var(--text-dim)',
                      border: `1px solid ${on ? 'var(--primary-border)' : 'transparent'}`,
                      boxShadow: on ? '0 1px 2px rgba(15,23,42,.08)' : undefined,
                    }}>
                    {tx.nombre}
                  </button>
                )
              })}
            </div>

            <div className="p-3 space-y-2.5" style={{ background: 'var(--bg-surface)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11.5px] font-bold w-[52px]" style={{ color: 'var(--text-dim)' }}>Tamaño</span>
                <input type="number" min={PX_MINIMO} max={PX_MAXIMO} placeholder="auto"
                  value={f.px[pieza] ?? ''}
                  onChange={e => {
                    const v = e.target.value.trim()
                    set('px', { ...f.px, [pieza]: v === '' ? null : Number(v) })
                  }}
                  style={{ ...estiloCampo, width: 76, padding: '5px 8px', fontSize: 13 }} />
                <span className="text-[11px] mr-1" style={{ color: 'var(--text-faint)' }}>px</span>
                {[
                  { id: null, texto: 'Auto' },
                  { id: true, texto: 'Negrilla' },
                  { id: false, texto: 'Normal' },
                ].map(o => {
                  const on = f.negritas[pieza] === o.id
                  return (
                    <button key={String(o.id)}
                      onClick={() => set('negritas', { ...f.negritas, [pieza]: o.id })}
                      className="px-2.5 py-1 rounded-md text-[11.5px]"
                      style={{
                        fontWeight: o.id === true ? 800 : 600,
                        background: on ? 'var(--primary-dim)' : 'var(--bg-card-hover)',
                        color: on ? 'var(--primary-dark)' : 'var(--text-faint)',
                        border: `1px solid ${on ? 'var(--primary-border)' : 'var(--border)'}`,
                      }}>
                      {o.texto}
                    </button>
                  )
                })}
              </div>

              <Paleta nombre="Color" valor={f.tintas[pieza] ?? null}
                onElegir={v => set('tintas', { ...f.tintas, [pieza]: v })} />
            </div>
          </div>
        </Campo>

        {tarjeta.tipo === 'separador' && (
          <div className="flex gap-3 flex-wrap">
            <Campo etiqueta="Grosor de la línea">
              <div className="flex items-center gap-2">
                <input type="range" min={1} max={12} step={1} value={f.grosorLinea}
                  onChange={e => set('grosorLinea', Number(e.target.value))} className="w-28" />
                <span className="text-[11.5px] font-bold tabular-nums w-10"
                  style={{ color: 'var(--text-label)' }}>{f.grosorLinea} px</span>
              </div>
            </Campo>
            <Campo etiqueta="Estilo de la línea">
              <Botones valor={f.estiloLinea} onElegir={v => set('estiloLinea', v)}
                opciones={[
                  { id: 'solida', texto: 'Sólida' },
                  { id: 'punteada', texto: 'Rayas' },
                  { id: 'puntos', texto: 'Puntos' },
                  { id: 'doble', texto: 'Doble' },
                ]} />
            </Campo>
          </div>
        )}

        <Campo etiqueta="Aire por dentro" nota="Cuánto espacio deja alrededor del texto.">
          <Botones valor={f.aire} onElegir={v => set('aire', v)}
            opciones={AIRES.map(a => ({ id: a.id, texto: a.nombre }))} />
        </Campo>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={f.letraElastica}
            onChange={e => set('letraElastica', e.target.checked)} className="w-4 h-4 mt-0.5" />
          <span>
            <span className="text-[13.5px] font-semibold block" style={{ color: 'var(--text)' }}>
              La letra se encoge con la tarjeta
            </span>
            <span className="text-[11.5px]" style={{ color: 'var(--text-label)' }}>
              Al angostarla, el texto baja de tamaño solo. Los tamaños que escriba
              siguen mandando; esto solo los estira o los encoge alrededor de ellos.
            </span>
          </span>
        </label>

        {tarjeta.tipo === 'contador' && (
          <Campo etiqueta="Dónde va el texto" nota="Respecto del número.">
            <Botones valor={f.dondeTexto} onElegir={v => set('dondeTexto', v)}
              opciones={DONDE_TEXTO.map(d => ({ id: d.id, texto: d.nombre }))} />
          </Campo>
        )}

        {tarjeta.tipo === 'contador' && (
          <Campo etiqueta="La meta y la nota" nota="La barra de la meta y el renglón de abajo.">
            <Botones valor={f.pieArriba} onElegir={v => set('pieArriba', v)}
              opciones={[{ id: false, texto: 'Debajo del número' }, { id: true, texto: 'Encima del número' }]} />
          </Campo>
        )}

        <Campo etiqueta="Qué se ve" nota="Lo que apague desaparece de la tarjeta, y su espacio también.">
          <div className="flex gap-1.5 flex-wrap">
            {/* Solo las piezas que esta tarjeta tiene. Antes salían las siete
                siempre, y apagar una que no existía no hacía nada. */}
            {([
              ...textos.map(x => x.pieza as string),
              ...(tarjeta.tipo === 'anuncio' ? ['etiqueta'] : []),
              ...(tiene('imagen') ? ['imagen'] : []),
              'iconos',
              ...(tiene('cta') ? ['boton'] : []),
            ]).map(pz => {
              const on = !f.ocultos.includes(pz)
              const nombres: Record<string, string> = {
                ...Object.fromEntries(textos.map(x => [x.pieza, x.nombre])),
                etiqueta: 'Etiqueta', imagen: 'Imagen', iconos: 'Pictogramas', boton: 'Botón',
              }
              return (
                <button key={pz} aria-pressed={on}
                  onClick={() => set('ocultos', on
                    ? [...f.ocultos, pz]
                    : f.ocultos.filter((x: string) => x !== pz))}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-bold"
                  style={{
                    background: on ? 'var(--primary-dim)' : 'var(--bg-card-hover)',
                    color: on ? 'var(--primary-dark)' : 'var(--text-faint)',
                    border: `1px solid ${on ? 'var(--primary-border)' : 'var(--border)'}`,
                    textDecoration: on ? undefined : 'line-through',
                  }}>
                  {on ? <Eye size={13} /> : <EyeOff size={13} />}
                  {nombres[pz]}
                </button>
              )
            })}
          </div>
        </Campo>

        <Campo etiqueta="Color de todo el texto"
          nota="El de abajo; cada texto puede llevar el suyo encima de este.">
          <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-card-hover)' }}>
            <Paleta nombre="Toda la tarjeta" valor={f.colorTexto} onElegir={v => set('colorTexto', v)} />
          </div>
        </Campo>

        {tarjeta.tipo === 'anuncio' && (
          <>
            {f.imagen_url && (
              <div className="flex gap-3 flex-wrap">
                <Campo etiqueta="Dónde va la imagen">
                  <Botones valor={f.disposicion} onElegir={v => set('disposicion', v)}
                    opciones={DISPOSICIONES.map(d => ({ id: d.id, texto: d.nombre }))} />
                </Campo>
                {(f.disposicion === 'izquierda' || f.disposicion === 'derecha') && (
                  <Campo etiqueta="Cuánto ocupa la imagen">
                    <Botones valor={f.proporcion} onElegir={v => set('proporcion', v)}
                      opciones={PROPORCIONES.map(p => ({ id: p.id, texto: p.nombre }))} />
                  </Campo>
                )}
              </div>
            )}
            <Campo etiqueta="Orden de los elementos" nota="Suba o baje cada pieza.">
              <OrdenPiezas orden={f.orden} onCambiar={v => set('orden', v)} />
            </Campo>
          </>
        )}

        <Campo etiqueta="Color">
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(COLORES) as ColorTarjeta[]).map(id => (
              <button key={id} onClick={() => set('color', id)} title={COLORES[id].nombre}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold"
                style={{
                  background: COLORES[id].suave, color: COLORES[id].fuerte,
                  border: `2px solid ${f.color === id ? COLORES[id].fuerte : 'transparent'}`,
                }}>
                {COLORES[id].nombre.split(' · ')[0]}
              </button>
            ))}
          </div>
        </Campo>

        <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }} />

        <Campo etiqueta="¿Quién la ve?">
          <div className="mb-2">
            <Botones valor={paraTodos} onElegir={v => setParaTodos(v)}
              opciones={[{ id: true, texto: 'Todos' }, { id: false, texto: 'Solo algunos' }]} />
          </div>
          {!paraTodos && (
            <div className="space-y-2.5 p-3 rounded-xl" style={{ background: 'var(--bg-card-hover)' }}>
              <Casillas titulo="Sedes" lista={opciones.centros} marcadas={centros}
                onAlternar={v => alternar(centros, setCentros, v)} />
              <Casillas titulo="Áreas" lista={opciones.areas} marcadas={areas}
                onAlternar={v => alternar(areas, setAreas, v)} />
              <p className="text-[11.5px]" style={{ color: 'var(--text-label)' }}>
                Quien esté en MULTISEDE ve lo de todas las sedes.
              </p>
            </div>
          )}
        </Campo>

        <div className="flex gap-3 flex-wrap">
          <Campo etiqueta="Desde" nota="Opcional">
            <input type="date" value={f.desde} onChange={e => set('desde', e.target.value)}
              style={{ ...estiloCampo, maxWidth: 190 }} />
          </Campo>
          <Campo etiqueta="Hasta" nota="Se apaga sola ese día">
            <input type="date" value={f.hasta} onChange={e => set('hasta', e.target.value)}
              style={{ ...estiloCampo, maxWidth: 190 }} />
          </Campo>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={f.activa} onChange={e => set('activa', e.target.checked)}
            className="w-4 h-4" />
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
            Publicada — el personal la ve
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#DC2626' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button onClick={cerrarSinGuardar} className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ color: 'var(--text-dim)' }}>Cancelar</button>
          <button onClick={enviar} disabled={guardando || !!subiendo}
            className="px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            {guardando && <Loader2 size={14} className="animate-spin" />} Guardar
          </button>
        </div>
      </div>
    </Telon>
  )
}

// ── Elegir qué tarjeta agregar ─────────────────────────────────────────────

export function ElegirTipo({ onElegir, onCerrar }: {
  onElegir: (t: TipoTarjeta) => void; onCerrar: () => void
}) {
  return (
    <Telon onCerrar={onCerrar} titulo="¿Qué quiere agregar?">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {TIPOS.map(t => (
          <button key={t.id} onClick={() => onElegir(t.id)}
            className="text-left p-3.5 rounded-xl transition-colors"
            style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-[13.5px]" style={{ color: 'var(--text)' }}>{t.nombre}</p>
            <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--text-label)' }}>{t.ayuda}</p>
          </button>
        ))}
      </div>
    </Telon>
  )
}

// ── Piezas sueltas ─────────────────────────────────────────────────────────

export const estiloCampo: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1px solid var(--border-strong)', background: 'var(--bg-surface)',
  color: 'var(--text)', fontSize: 14,
}

function Botones<T>({ opciones, valor, onElegir }: {
  opciones: { id: T; texto: string; titulo?: string }[]
  valor: T
  onElegir: (v: T) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {opciones.map(o => {
        const on = o.id === valor
        return (
          <button key={String(o.id)} onClick={() => onElegir(o.id)} title={o.titulo}
            className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold"
            style={{
              background: on ? 'var(--primary-dim)' : 'var(--bg-card-hover)',
              color: on ? 'var(--primary-dark)' : 'var(--text-dim)',
              border: `1px solid ${on ? 'var(--primary-border)' : 'var(--border)'}`,
            }}>
            {o.texto}
          </button>
        )
      })}
    </div>
  )
}

/**
 * La lista de piezas de la tarjeta, para subirlas y bajarlas.
 *
 * Con flechas y no arrastrando: son seis renglones cortos, y arrastrar dentro
 * de una ventana que ya se desplaza sola termina peleando con el desplazamiento
 * justo cuando se quiere mover la última pieza hacia arriba.
 */
function OrdenPiezas({ orden, onCambiar }: { orden: Pieza[]; onCambiar: (v: Pieza[]) => void }) {
  const mover = (i: number, hacia: -1 | 1) => {
    const j = i + hacia
    if (j < 0 || j >= orden.length) return
    const nuevo = [...orden]
    ;[nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]]
    onCambiar(nuevo)
  }
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {orden.map((p, i) => (
        <div key={p} className="flex items-center gap-2 px-3 py-1.5"
          style={{
            background: i % 2 ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
            borderTop: i ? '1px solid var(--border)' : undefined,
          }}>
          <span className="text-[11px] font-bold tabular-nums w-4" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
          <span className="flex-1 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{PIEZAS[p]}</span>
          <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${PIEZAS[p]}`}
            className="p-1 rounded disabled:opacity-25" style={{ color: 'var(--text-dim)' }}><ArrowUp size={14} /></button>
          <button onClick={() => mover(i, 1)} disabled={i === orden.length - 1} aria-label={`Bajar ${PIEZAS[p]}`}
            className="p-1 rounded disabled:opacity-25" style={{ color: 'var(--text-dim)' }}><ArrowDown size={14} /></button>
        </div>
      ))}
    </div>
  )
}

/**
 * Un renglón de colores para un texto.
 *
 * El muestrario cubre lo corriente; el cuadrito del final abre el selector del
 * sistema, porque una empresa tiene sus colores y no van a estar en una lista
 * de veinte. «Auto» devuelve el que le corresponde al fondo de la tarjeta.
 */
function Paleta({ nombre, valor, onElegir }: {
  nombre: string; valor: string | null; onElegir: (v: string | null) => void
}) {
  const propio = valor && !PALETA_TEXTO.some(c => c.hex.toLowerCase() === valor.toLowerCase())
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11.5px] font-bold w-[86px] flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
        {nombre}
      </span>
      <button onClick={() => onElegir(null)} title="El que le va al fondo"
        className="px-1.5 py-0.5 rounded text-[10.5px] font-bold flex-shrink-0"
        style={{
          background: !valor ? 'var(--primary-dim)' : 'var(--bg-surface)',
          color: !valor ? 'var(--primary-dark)' : 'var(--text-faint)',
          border: `1px solid ${!valor ? 'var(--primary-border)' : 'var(--border)'}`,
        }}>
        Auto
      </button>
      {PALETA_TEXTO.map(c => {
        const on = valor?.toLowerCase() === c.hex.toLowerCase()
        return (
          <button key={c.hex} onClick={() => onElegir(c.hex)} title={c.nombre} aria-label={c.nombre}
            className="w-[18px] h-[18px] rounded-full flex-shrink-0"
            style={{
              background: c.hex,
              border: on ? '2px solid var(--primary)' : '1px solid var(--border-strong)',
              boxShadow: on ? '0 0 0 2px var(--primary-dim)' : undefined,
            }} />
        )
      })}
      <label title="Otro color"
        className="w-[18px] h-[18px] rounded-full flex-shrink-0 cursor-pointer relative overflow-hidden"
        style={{
          background: propio ? valor! : 'conic-gradient(#EF4444,#F59E0B,#FACC15,#10B981,#06B6D4,#3B82F6,#8B5CF6,#EC4899,#EF4444)',
          border: propio ? '2px solid var(--primary)' : '1px solid var(--border-strong)',
        }}>
        <input type="color" value={valor ?? '#3B82F6'} onChange={e => onElegir(e.target.value)}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
      </label>
    </div>
  )
}

export function Campo({ etiqueta, nota, children }: {
  etiqueta: string; nota?: string; children: React.ReactNode
}) {
  return (
    <div className="flex-1">
      <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--text-dim)' }}>
        {etiqueta}
        {nota && <span className="font-normal ml-1.5" style={{ color: 'var(--text-faint)' }}>{nota}</span>}
      </label>
      {children}
    </div>
  )
}

function Casillas({ titulo, lista, marcadas, onAlternar }: {
  titulo: string; lista: string[]; marcadas: string[]; onAlternar: (v: string) => void
}) {
  if (!lista.length) return null
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {lista.map(v => {
          const on = marcadas.includes(v)
          return (
            <button key={v} onClick={() => onAlternar(v)}
              className="px-2.5 py-1 rounded-lg text-[12px] font-semibold"
              style={{
                background: on ? 'var(--primary-dim)' : 'var(--bg-surface)',
                color: on ? 'var(--primary-dark)' : 'var(--text-dim)',
                border: `1px solid ${on ? 'var(--primary-border)' : 'var(--border)'}`,
              }}>
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * El fondo oscuro con la ventana encima.
 *
 * `descartable` dice si un clic por fuera o la tecla Esc alcanzan para
 * cerrarla. En el editor va en falso: escribir un anuncio toma minutos, y
 * picar por fuera sin querer borraba todo lo escrito sin preguntar.
 */
export function Telon({ titulo, ayuda, children, onCerrar, descartable = true }: {
  titulo: string; ayuda?: string; children: React.ReactNode
  onCerrar: () => void; descartable?: boolean
}) {
  useEffect(() => {
    if (!descartable) return
    const salir = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', salir)
    return () => window.removeEventListener('keydown', salir)
  }, [onCerrar, descartable])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(11,23,54,0.55)' }}
      onClick={e => { if (descartable && e.target === e.currentTarget) onCerrar() }}>
      <div role="dialog" aria-modal="true" aria-label={titulo}
        className="w-full max-w-2xl rounded-2xl my-8"
        style={{ background: 'var(--bg-surface)', boxShadow: '0 24px 60px rgba(11,23,54,0.3)' }}>
        <div className="flex items-start justify-between gap-4 p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{titulo}</h2>
            {ayuda && <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-label)' }}>{ayuda}</p>}
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="p-1.5 rounded-lg"
            style={{ color: 'var(--text-faint)' }}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
