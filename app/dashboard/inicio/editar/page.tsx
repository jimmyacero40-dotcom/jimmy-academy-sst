'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, Pencil, Trash2, Plus,
  Loader2, X, Upload, AlertCircle, Check,
} from 'lucide-react'
import {
  TIPOS, TIPO, COLORES, COLOR, estadoDe, diasDesde, anchoDe,
  type Tarjeta, type TipoTarjeta, type ColorTarjeta,
} from '@/lib/tablero'
import { comprimirImagen } from '@/lib/comprimir-imagen'

interface Opciones { centros: string[]; areas: string[] }

const ESTADOS: Record<string, { texto: string; color: string }> = {
  publicada:  { texto: 'Publicada',  color: '#059669' },
  apagada:    { texto: 'Apagada',    color: '#6B778C' },
  programada: { texto: 'Programada', color: '#B45309' },
  vencida:    { texto: 'Vencida',    color: '#DC2626' },
}

export default function EditarTableroPage() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  const [opciones, setOpciones] = useState<Opciones>({ centros: [], areas: [] })
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<Tarjeta | null>(null)
  const [eligiendoTipo, setEligiendoTipo] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'bien' | 'mal'; texto: string } | null>(null)

  const cargar = () =>
    fetch('/api/tablero?todas=1')
      .then(r => r.json())
      .then(d => {
        setTarjetas(d.tarjetas ?? [])
        if (d.opciones) setOpciones(d.opciones)
      })
      .catch(() => setAviso({ tono: 'mal', texto: 'No se pudo cargar el tablero' }))
      .finally(() => setCargando(false))

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  const guardar = async (cambios: Partial<Tarjeta> & { id: string }) => {
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setAviso({ tono: 'mal', texto: d.error ?? 'No se pudo guardar' }); return false }
    await cargar()
    return true
  }

  const prender = (t: Tarjeta) => guardar({ id: t.id, activa: !t.activa })

  const mover = async (i: number, hacia: -1 | 1) => {
    const j = i + hacia
    if (j < 0 || j >= tarjetas.length) return
    const nuevo = [...tarjetas]
    ;[nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]]
    setTarjetas(nuevo)   // se mueve de una, sin esperar al servidor
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden: nuevo.map(t => t.id) }),
    })
    if (!r.ok) { setAviso({ tono: 'mal', texto: 'No se pudo guardar el orden' }); cargar() }
  }

  const borrar = async (t: Tarjeta) => {
    const nombre = t.titulo || TIPO(t.tipo).nombre
    if (!confirm(`¿Borrar «${nombre}»?\n\nNo se puede deshacer. Si solo quiere que deje de verse, apáguela.`)) return
    const r = await fetch(`/api/tablero/tarjetas?id=${t.id}`, { method: 'DELETE' })
    if (!r.ok) { setAviso({ tono: 'mal', texto: 'No se pudo borrar' }); return }
    setAviso({ tono: 'bien', texto: 'Tarjeta borrada' })
    cargar()
  }

  const crear = async (tipo: TipoTarjeta) => {
    setEligiendoTipo(false)
    const r = await fetch('/api/tablero/tarjetas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, titulo: TIPO(tipo).nombre, color: 'cian', activa: false }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setAviso({ tono: 'mal', texto: d.error ?? 'No se pudo crear' }); return }
    await cargar()
    setEditando(d.tarjeta)
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/inicio"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-1"
            style={{ color: 'var(--primary-dark)' }}>
            <ArrowLeft size={14} /> Volver al tablero
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Editar tablero</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-label)' }}>
            Lo que esté publicado es lo que ve el personal al entrar
          </p>
        </div>
        <button onClick={() => setEligiendoTipo(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          <Plus size={16} /> Agregar tarjeta
        </button>
      </div>

      {aviso && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{
            background: aviso.tono === 'bien' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: aviso.tono === 'bien' ? '#059669' : '#DC2626',
            border: `1px solid ${aviso.tono === 'bien' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
          {aviso.tono === 'bien' ? <Check size={15} /> : <AlertCircle size={15} />}
          {aviso.texto}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center gap-2 py-16 justify-center text-sm" style={{ color: 'var(--text-label)' }}>
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : (
        <div className="space-y-2">
          {tarjetas.map((t, i) => (
            <Fila key={t.id} t={t} primera={i === 0} ultima={i === tarjetas.length - 1}
              onSubir={() => mover(i, -1)} onBajar={() => mover(i, 1)}
              onPrender={() => prender(t)} onEditar={() => setEditando(t)} onBorrar={() => borrar(t)} />
          ))}
          {tarjetas.length === 0 && (
            <p className="text-sm py-10 text-center" style={{ color: 'var(--text-label)' }}>
              Todavía no hay tarjetas. Agregue la primera.
            </p>
          )}
        </div>
      )}

      {eligiendoTipo && <ElegirTipo onElegir={crear} onCerrar={() => setEligiendoTipo(false)} />}
      {editando && (
        <Editor tarjeta={editando} opciones={opciones}
          onCerrar={() => setEditando(null)}
          onGuardar={async cambios => {
            const ok = await guardar({ ...cambios, id: editando.id })
            if (ok) { setEditando(null); setAviso({ tono: 'bien', texto: 'Guardado' }) }
          }} />
      )}
    </div>
  )
}

// ── Una fila de la lista ───────────────────────────────────────────────────

function Fila({ t, primera, ultima, onSubir, onBajar, onPrender, onEditar, onBorrar }: {
  t: Tarjeta; primera: boolean; ultima: boolean
  onSubir: () => void; onBajar: () => void
  onPrender: () => void; onEditar: () => void; onBorrar: () => void
}) {
  const meta = TIPO(t.tipo)
  const c = COLOR(t.color)
  const est = ESTADOS[estadoDe(t)]
  const aud = t.audiencia as any
  const dirigida = aud?.todos || (!aud?.centros?.length && !aud?.areas?.length)
    ? 'Todos'
    : [...(aud.centros ?? []), ...(aud.areas ?? [])].join(', ')

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl flex-wrap"
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${c.fuerte}`, opacity: t.activa ? 1 : 0.62,
      }}>
      <div className="flex flex-col gap-0.5">
        <button onClick={onSubir} disabled={primera} aria-label="Subir"
          className="p-1 rounded disabled:opacity-25" style={{ color: 'var(--text-faint)' }}>
          <ArrowUp size={14} />
        </button>
        <button onClick={onBajar} disabled={ultima} aria-label="Bajar"
          className="p-1 rounded disabled:opacity-25" style={{ color: 'var(--text-faint)' }}>
          <ArrowDown size={14} />
        </button>
      </div>

      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: c.suave, color: c.fuerte }}>{meta.nombre}</span>
          <span className="text-[11px] font-bold" style={{ color: est.color }}>● {est.texto}</span>
          {meta.automatica && (
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>se llena sola</span>
          )}
        </div>
        <p className="font-semibold text-[14px] mt-1 leading-snug" style={{ color: 'var(--text)' }}>
          {t.titulo || <span style={{ color: 'var(--text-faint)' }}>Sin título</span>}
        </p>
        <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-label)' }}>
          Para: {dirigida}
          {t.hasta ? ` · hasta el ${new Date(t.hasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onPrender} title={t.activa ? 'Apagar' : 'Publicar'}
          className="p-2 rounded-lg" style={{ color: t.activa ? '#059669' : 'var(--text-faint)' }}>
          {t.activa ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button onClick={onEditar} title="Editar" className="p-2 rounded-lg" style={{ color: 'var(--text-dim)' }}>
          <Pencil size={15} />
        </button>
        <button onClick={onBorrar} title="Borrar" className="p-2 rounded-lg" style={{ color: '#DC2626' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Elegir qué tarjeta agregar ─────────────────────────────────────────────

function ElegirTipo({ onElegir, onCerrar }: { onElegir: (t: TipoTarjeta) => void; onCerrar: () => void }) {
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

// ── El editor de una tarjeta ───────────────────────────────────────────────

function Editor({ tarjeta, opciones, onGuardar, onCerrar }: {
  tarjeta: Tarjeta; opciones: Opciones
  onGuardar: (cambios: Partial<Tarjeta>) => Promise<void>; onCerrar: () => void
}) {
  const meta = TIPO(tarjeta.tipo)
  const tiene = (campo: string) => meta.campos.includes(campo)

  const [f, setF] = useState({
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
  // el administrador cierra sin guardar, esos archivos se borran: si no,
  // quedarían en la bodega sin que ninguna tarjeta los nombre, y ya no habría
  // forma de saber que sobran.
  const [sueltas, setSueltas] = useState<string[]>([])

  const descartar = (urls: string[]) => {
    for (const u of urls) {
      if (u && u !== tarjeta.imagen_url) {
        fetch(`/api/tablero/imagen?url=${encodeURIComponent(u)}`, { method: 'DELETE' }).catch(() => {})
      }
    }
  }

  // Lo que había al abrir, para saber si hay algo que perder al cerrar. La
  // audiencia va aparte de `f`, así que entra también: cambiar solo las sedes
  // y cerrar perdía el cambio sin avisar.
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
    // La que estaba a medio poner tampoco se queda: solo sobrevive la última.
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
        <Campo etiqueta={meta.automatica ? 'Rótulo de la tarjeta' : 'Título'}>
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
          <Campo etiqueta="Imagen de fondo" nota="Opcional. Se aligera sola antes de subirla.">
            <div className="flex items-center gap-3 flex-wrap">
              {f.imagen_url && (
                <img src={f.imagen_url} alt="" className="w-24 h-16 object-cover rounded-lg"
                  style={{ border: '1px solid var(--border)' }} />
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
        )}

        {meta.anchoLibre && (
          <Campo etiqueta="Qué tan ancha" nota="En celular todas ocupan el ancho completo.">
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(n => (
                <button key={n} onClick={() => set('ancho', n)}
                  className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold"
                  style={{
                    background: f.ancho === n ? 'var(--primary-dim)' : 'var(--bg-card-hover)',
                    color: f.ancho === n ? 'var(--primary-dark)' : 'var(--text-dim)',
                    border: `1px solid ${f.ancho === n ? 'var(--primary-border)' : 'var(--border)'}`,
                  }}>
                  {n === 1 ? 'Angosta' : n === 2 ? 'Mediana' : 'Todo el ancho'}
                </button>
              ))}
            </div>
          </Campo>
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
          <div className="flex gap-2 mb-2">
            {[[true, 'Todos'], [false, 'Solo algunos']].map(([v, txt]) => (
              <button key={String(v)} onClick={() => setParaTodos(v as boolean)}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold"
                style={{
                  background: paraTodos === v ? 'var(--primary-dim)' : 'var(--bg-card-hover)',
                  color: paraTodos === v ? 'var(--primary-dark)' : 'var(--text-dim)',
                  border: `1px solid ${paraTodos === v ? 'var(--primary-border)' : 'var(--border)'}`,
                }}>
                {txt as string}
              </button>
            ))}
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

// ── Piezas sueltas ─────────────────────────────────────────────────────────

const estiloCampo: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1px solid var(--border-strong)', background: 'var(--bg-surface)',
  color: 'var(--text)', fontSize: 14,
}

function Campo({ etiqueta, nota, children }: { etiqueta: string; nota?: string; children: React.ReactNode }) {
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
 * cerrarla. En el editor van en falso: escribir un anuncio toma minutos, y
 * picar por fuera sin querer borraba todo lo escrito sin preguntar. Ahí solo
 * se sale por Guardar, por Cancelar o por la equis. En la lista de tipos sí,
 * porque no hay nada que perder.
 */
function Telon({ titulo, ayuda, children, onCerrar, descartable = true }: {
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
