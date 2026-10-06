'use client'

// ─── Ficha sociodemográfica completa ──────────────────────────────────
// Muestra TODO lo que la encuesta pregunta, sección por sección, no un
// resumen escogido a mano. Las vistas de antes listaban una docena de
// campos fijos, así que lo que el trabajador respondía en el resto de la
// encuesta no se podía consultar desde ninguna parte.
//
// Como se arma desde `lib/ficha-campos`, agregar una pregunta a la
// encuesta la hace aparecer aquí sola, y lo pendiente que se marca es
// exactamente lo que cuenta para el porcentaje de avance.
// ──────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react'
import { Check, AlertCircle, Copy, ListChecks, FileText } from 'lucide-react'
import { FICHA, type CampoFicha } from '@/lib/ficha-campos'
import { calcPct, faltantes } from '@/lib/perfil-completitud'

/** Cómo se lee cada respuesta. Lo que está vacío se decide fuera. */
function mostrar(campo: string, v: any): string | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (Array.isArray(v)) return v.length ? v.join(', ') : null
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const [a, m, d] = v.slice(0, 10).split('-')
    return `${d}/${m}/${a}`
  }
  if (campo === 'estatura_cm') return `${v} cm`
  if (campo === 'peso_kg') return `${v} kg`
  if (campo === 'estrato') return `Estrato ${v}`
  return String(v)
}

const esImagen = (c: string) => c === 'photo_url' || c === 'firma_electronica'

export default function FichaCompleta({
  ficha,
  nombre,
}: {
  ficha: Record<string, any> | null | undefined
  nombre?: string
}) {
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const d = ficha ?? {}

  const pct = useMemo(() => calcPct(d), [d])
  const pendientes = useMemo(() => faltantes(d), [d])
  const porSeccion = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const s of pendientes) m.set(s.seccion, new Set(s.campos.map(c => c.campo)))
    return m
  }, [pendientes])
  const totalPendientes = pendientes.reduce((n, s) => n + s.campos.length, 0)

  /** El texto que el responsable de SST le pasa al trabajador. */
  const copiarPendientes = async () => {
    const lineas = [
      `${nombre ?? 'Trabajador'} — ficha sociodemográfica al ${pct}%`,
      '',
      'Para completarla faltan estos datos:',
      ...pendientes.flatMap(s => [``, `${s.seccion}:`, ...s.campos.map(c => `  • ${c.etiqueta}`)]),
    ]
    try {
      await navigator.clipboard.writeText(lineas.join('\n'))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* Sin permiso al portapapeles no se puede hacer más; el detalle ya está en pantalla. */
    }
  }

  const color = pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="space-y-3">
      {/* ── Encabezado: avance y qué falta ── */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <span className="text-sm font-black" style={{ color }}>{pct}%</span>
        <div className="h-1.5 rounded-full overflow-hidden flex-1 min-w-[120px]" style={{ background: 'var(--bg-card)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {totalPendientes === 0
            ? 'Sin datos pendientes'
            : `${totalPendientes} ${totalPendientes === 1 ? 'dato pendiente' : 'datos pendientes'} en ${pendientes.length} ${pendientes.length === 1 ? 'sección' : 'secciones'}`}
        </span>

        {totalPendientes > 0 && (
          <>
            <button onClick={() => setSoloPendientes(v => !v)}
              className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all"
              style={soloPendientes
                ? { background: 'var(--primary)', color: '#fff' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {soloPendientes ? <FileText size={12} /> : <ListChecks size={12} />}
              {soloPendientes ? 'Ver ficha completa' : 'Ver solo lo que falta'}
            </button>
            <button onClick={copiarPendientes}
              className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Copy size={12} />{copiado ? 'Copiado' : 'Copiar lo que falta'}
            </button>
          </>
        )}
      </div>

      {/* ── Las 15 secciones ── */}
      {/* `items-start` evita que una sección corta, como la foto, se estire
          hasta la altura de la que tiene al lado y deje un hueco vacío. */}
      <div className="grid gap-3 lg:grid-cols-2 items-start">
        {FICHA.map(sec => {
          const faltanAqui = porSeccion.get(sec.nombre)
          if (soloPendientes && !faltanAqui) return null

          const visibles = sec.campos.filter(c => (soloPendientes ? faltanAqui?.has(c.campo) : true))
          if (visibles.length === 0) return null

          return (
            <div key={sec.nombre} className="terra-card overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between gap-2"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{sec.nombre}</span>
                {faltanAqui
                  ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ background: '#F59E0B20', color: '#F59E0B' }}>
                      <AlertCircle size={9} />Faltan {faltanAqui.size}
                    </span>
                  : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ background: '#10B98120', color: '#10B981' }}>
                      <Check size={9} />Completa
                    </span>}
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {visibles.map((c: CampoFicha) => {
                  const valor = mostrar(c.campo, d[c.campo])
                  const pendiente = faltanAqui?.has(c.campo) ?? false
                  return (
                    <div key={c.campo} className="px-3 py-1.5 flex items-start gap-3 text-xs">
                      <span className="flex-1 min-w-0" style={{ color: 'var(--text-faint)' }}>
                        {c.etiqueta}
                        {c.opcional && <span className="ml-1 text-[9px] opacity-60">(opcional)</span>}
                      </span>
                      <span className="flex-1 min-w-0 text-right font-semibold break-words"
                        style={{ color: pendiente ? '#F59E0B' : valor ? 'var(--text)' : 'var(--text-faint)' }}>
                        {valor
                          ? (esImagen(c.campo)
                              ? <img src={d[c.campo]} alt={c.etiqueta} className="inline-block max-h-12 rounded ml-auto"
                                  style={{ background: c.campo === 'firma_electronica' ? '#fff' : undefined }} />
                              : valor)
                          : pendiente ? 'Pendiente' : 'Sin responder'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
