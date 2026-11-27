'use client'

/**
 * Las piezas con las que se dibuja el panel: columnas, barras y circulares de
 * verdad, con su eje, su rejilla y su leyenda.
 *
 * Antes eran barritas de progreso, que dicen poco: no se ve la escala, no se
 * comparan dos cosas entre sí y no se parecen a nada de lo que la gente lee en
 * un informe. Tres reglas que se siguen en todas:
 *
 * 1. Cada cifra va con su denominador. «34 de 58» se puede defender en una
 *    reunión; un «59 %» suelto no.
 * 2. El color nunca es la única señal: cada columna lleva su número escrito y
 *    su nombre, para quien no distingue el verde del amarillo y para cuando el
 *    informe se imprime en blanco y negro.
 * 3. El tamaño es la proporción de verdad, medida contra la escala del eje.
 */

export const TINTA = {
  hecho:   '#10B981',   // completado, enviado
  curso:   '#F59E0B',   // empezado, en borrador, pendiente
  vencido: '#EF4444',
  falta:   '#CBD5E1',   // sin abrir: gris a propósito, no es un estado bueno
  dato:    '#3B82F6',   // magnitud sin juicio de valor
}

export function pct(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

/** Una escala redonda para el eje: 7 no se lee, 10 sí. */
function tope(valores: number[]): number {
  const max = Math.max(1, ...valores)
  const paso = max <= 10 ? 2 : max <= 50 ? 10 : max <= 200 ? 25 : 100
  return Math.ceil(max / paso) * paso
}

function Leyenda({ series }: { series: { nombre: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
      {series.map(s => (
        <span key={s.nombre} className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
          {s.nombre}
        </span>
      ))}
    </div>
  )
}

/** Una cifra grande con lo que significa debajo. */
export function Cifra({ valor, de, titulo, pie, color = 'var(--text)' }: {
  valor: number | string
  de?: number
  titulo: string
  pie?: string
  color?: string
}) {
  return (
    <div className="terra-card p-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black tabular-nums leading-none" style={{ color }}>{valor}</span>
        {de !== undefined && (
          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-faint)' }}>de {de}</span>
        )}
      </div>
      <p className="text-xs font-bold mt-2" style={{ color: 'var(--text)' }}>{titulo}</p>
      {pie && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{pie}</p>}
    </div>
  )
}

/**
 * Columnas agrupadas: varias cosas comparadas entre sí, cada una con sus
 * partes una al lado de la otra.
 *
 * Es el gráfico que responde «¿cuál va mejor?» de un vistazo, que con barras
 * de progreso sueltas había que calcularlo mentalmente.
 */
export function ColumnasAgrupadas({ grupos, series, alto = 190, unidad }: {
  grupos: { nombre: string; valores: number[]; pie?: string }[]
  series: { nombre: string; color: string }[]
  alto?: number
  unidad?: string
}) {
  if (!grupos.length) {
    return <p className="text-xs py-6 text-center" style={{ color: 'var(--text-faint)' }}>Todavía no hay datos.</p>
  }
  const max = tope(grupos.flatMap(g => g.valores))
  const marcas = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(max * f))

  return (
    <div>
      <Leyenda series={series} />
      <div className="flex gap-2">
        {/* Eje de la izquierda */}
        <div className="flex flex-col justify-between text-right flex-shrink-0"
          style={{ height: alto, paddingBottom: 1 }}>
          {[...marcas].reverse().map(m => (
            <span key={m} className="text-[10px] tabular-nums leading-none" style={{ color: 'var(--text-faint)' }}>{m}</span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative" style={{ height: alto }}>
            {/* Rejilla discreta: ayuda a leer la altura sin robar atención */}
            {marcas.map((m, i) => (
              <div key={m} className="absolute left-0 right-0"
                style={{
                  bottom: `${(i / (marcas.length - 1)) * 100}%`,
                  borderTop: i === 0 ? '1px solid var(--border-strong)' : '1px dashed var(--border-subtle)',
                }} />
            ))}

            <div className="absolute inset-0 flex items-end justify-around gap-3">
              {grupos.map(g => (
                <div key={g.nombre} className="flex-1 flex items-end justify-center gap-[3px] h-full">
                  {g.valores.map((v, i) => (
                    <div key={series[i].nombre} className="flex-1 flex flex-col items-center justify-end h-full"
                      style={{ maxWidth: 46 }}
                      title={`${g.nombre} · ${series[i].nombre}: ${v}${unidad ? ' ' + unidad : ''}`}>
                      <span className="text-[10px] font-bold tabular-nums mb-0.5"
                        style={{ color: v ? 'var(--text)' : 'var(--text-faint)' }}>{v}</span>
                      <div className="w-full rounded-t"
                        style={{
                          height: `${(v / max) * 100}%`,
                          minHeight: v ? 3 : 1,
                          background: v ? series[i].color : 'var(--border)',
                        }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-around gap-3 mt-1.5">
            {grupos.map(g => (
              <div key={g.nombre} className="flex-1 text-center min-w-0">
                <p className="text-[11px] font-bold leading-tight" style={{ color: 'var(--text)' }}>{g.nombre}</p>
                {g.pie && <p className="text-[10px] leading-tight" style={{ color: 'var(--text-faint)' }}>{g.pie}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Una sola serie en columnas: sirve para el mes a mes. */
export function Columnas({ datos, color = TINTA.hecho, alto = 150 }: {
  datos: { mes: string; completadas: number }[]
  color?: string
  alto?: number
}) {
  return (
    <ColumnasAgrupadas alto={alto}
      series={[{ nombre: 'Completadas', color }]}
      grupos={datos.map(d => ({ nombre: d.mes, valores: [d.completadas] }))} />
  )
}

/**
 * Barras horizontales, para cuando los nombres son largos —las áreas, los
 * tipos de reporte— y en vertical no cabrían.
 */
export function BarrasH({ filas, color = TINTA.dato }: {
  filas: { nombre: string; valor: number; de?: number }[]
  color?: string
}) {
  if (!filas.length) {
    return <p className="text-xs py-6 text-center" style={{ color: 'var(--text-faint)' }}>Todavía no hay datos.</p>
  }
  const max = tope(filas.map(f => (f.de !== undefined ? f.de : f.valor)))
  return (
    <div>
      <div className="space-y-2">
        {filas.map(f => (
          <div key={f.nombre} className="flex items-center gap-2">
            <span className="text-[11px] font-semibold truncate text-right flex-shrink-0"
              style={{ width: 110, color: 'var(--text)' }} title={f.nombre}>{f.nombre}</span>
            <div className="flex-1 min-w-0 relative" style={{ height: 20 }}>
              {/* El fondo marca hasta dónde llega la escala */}
              <div className="absolute inset-y-0 left-0 right-0 rounded"
                style={{ background: 'var(--bg-card)' }} />
              {f.de !== undefined && (
                <div className="absolute inset-y-0 left-0 rounded"
                  style={{ width: `${(f.de / max) * 100}%`, background: 'var(--border-subtle)' }} />
              )}
              <div className="absolute inset-y-[2px] left-0 rounded"
                style={{ width: `${Math.max((f.valor / max) * 100, f.valor ? 1.5 : 0)}%`, background: color }}
                title={`${f.nombre}: ${f.valor}${f.de !== undefined ? ' de ' + f.de : ''}`} />
            </div>
            <span className="text-[11px] font-bold tabular-nums flex-shrink-0 text-right"
              style={{ width: f.de !== undefined ? 86 : 30, color }}>
              {f.valor}{f.de !== undefined ? ` de ${f.de}` : ''}
              {f.de !== undefined && (
                <span className="font-semibold ml-1" style={{ color: 'var(--text-faint)' }}>{pct(f.valor, f.de)} %</span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] mt-2 pl-[118px]" style={{ color: 'var(--text-faint)' }}>
        Escala hasta {max}
      </p>
    </div>
  )
}

/**
 * Circular (de anillo): para una sola cosa partida en pocas partes.
 *
 * El hueco del centro lleva la cifra que importa, que es lo que la gente mira
 * primero.
 */
export function Circular({ partes, centro, pie, tamano = 150 }: {
  partes: { etiqueta: string; valor: number; color: string }[]
  centro?: string
  pie?: string
  tamano?: number
}) {
  const total = partes.reduce((s, p) => s + p.valor, 0)
  const R = 54, GROSOR = 22, C = 2 * Math.PI * R
  let acumulado = 0

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={tamano} height={tamano} viewBox="0 0 140 140" className="flex-shrink-0">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--bg-card)" strokeWidth={GROSOR} />
        {total > 0 && partes.filter(p => p.valor > 0).map(p => {
          const largo = (p.valor / total) * C
          // Un hilo de separación entre partes: pegadas se leen como una sola.
          const trazo = Math.max(largo - 2, 1)
          const el = (
            <circle key={p.etiqueta} cx="70" cy="70" r={R} fill="none"
              stroke={p.color} strokeWidth={GROSOR}
              strokeDasharray={`${trazo} ${C - trazo}`}
              strokeDashoffset={-acumulado}
              transform="rotate(-90 70 70)">
              <title>{`${p.etiqueta}: ${p.valor} de ${total}`}</title>
            </circle>
          )
          acumulado += largo
          return el
        })}
        {centro && (
          <text x="70" y="70" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 24, fontWeight: 900, fill: 'var(--text)' }}>{centro}</text>
        )}
      </svg>

      <div className="min-w-0 space-y-1.5">
        {partes.map(p => (
          <div key={p.etiqueta} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color }} />
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text)' }}>{p.valor}</span>
            <span className="text-[11px] truncate" style={{ color: 'var(--text-dim)' }}>{p.etiqueta}</span>
            <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-faint)' }}>{pct(p.valor, total)} %</span>
          </div>
        ))}
        {pie && <p className="text-[10px] pt-0.5" style={{ color: 'var(--text-faint)' }}>{pie}</p>}
      </div>
    </div>
  )
}

/** El recuadro que agrupa un módulo, con su título en palabras entendibles. */
export function Bloque({ titulo, pregunta, accion, children }: {
  titulo: string
  pregunta?: string
  accion?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="terra-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-black" style={{ color: 'var(--text)' }}>{titulo}</h2>
          {pregunta && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{pregunta}</p>}
        </div>
        {accion}
      </div>
      {children}
    </div>
  )
}
