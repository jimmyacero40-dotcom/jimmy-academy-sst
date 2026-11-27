'use client'

/**
 * Las piezas con las que se dibuja el panel.
 *
 * Nada de librerías: son barras y columnas hechas con lo que ya tiene el
 * proyecto. Tres reglas que se siguen en todas:
 *
 * 1. Cada cifra va con su denominador. «22 de 59» se puede defender en una
 *    reunión; un «37 %» suelto no.
 * 2. El color nunca es la única señal: cada parte lleva su número y su
 *    nombre escritos, para quien no distingue el verde del amarillo y para
 *    cuando el informe se imprime en blanco y negro.
 * 3. El largo de la barra es la proporción de verdad. Barras del mismo largo
 *    para cifras distintas fue un error que ya se cometió aquí.
 */

export const TINTA = {
  hecho:   '#10B981',   // completado
  curso:   '#F59E0B',   // empezado, pendiente
  vencido: '#EF4444',
  falta:   '#94A3B8',   // sin empezar: gris a propósito, no es un estado bueno
  dato:    '#3B82F6',   // magnitud sin juicio de valor
}

export function pct(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0
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
 * Cuántos de cuántos, en una barra partida.
 *
 * Sirve para la pregunta que más se hace en SST: de la gente que debía
 * responder, cuántos respondieron, cuántos empezaron y cuántos no han abierto.
 */
export function BarraParticipacion({ titulo, total, partes, nota }: {
  titulo: string
  total: number
  partes: { etiqueta: string; valor: number; color: string }[]
  nota?: string
}) {
  const suma = partes.reduce((s, p) => s + p.valor, 0)
  const base = Math.max(total, suma)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{titulo}</p>
        <p className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: partes[0]?.color }}>
          {partes[0]?.valor ?? 0} de {base}
          <span className="font-semibold ml-1" style={{ color: 'var(--text-faint)' }}>
            · {pct(partes[0]?.valor ?? 0, base)} %
          </span>
        </p>
      </div>

      {/* Las partes van separadas por un hilo del color del fondo: pegadas,
          dos colores vecinos se leen como uno solo. */}
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        {partes.filter(p => p.valor > 0).map((p, i) => (
          <div key={p.etiqueta} title={`${p.etiqueta}: ${p.valor} de ${base}`}
            style={{
              width: `${pct(p.valor, base)}%`,
              background: p.color,
              marginLeft: i > 0 ? 2 : 0,
            }} />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {partes.map(p => (
          <span key={p.etiqueta} className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{p.valor}</strong> {p.etiqueta}
          </span>
        ))}
        {base > suma && (
          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }} />
            <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{base - suma}</strong> sin abrir
          </span>
        )}
      </div>
      {nota && <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>{nota}</p>}
    </div>
  )
}

/** Una fila por cosa, ordenadas de mayor a menor. El largo es la proporción. */
export function Barras({ filas, color = TINTA.dato, unidad }: {
  filas: { nombre: string; valor: number; de?: number }[]
  color?: string
  unidad?: string
}) {
  const tope = Math.max(1, ...filas.map(f => (f.de !== undefined ? f.de : f.valor)))
  if (!filas.length) {
    return <p className="text-xs py-4 text-center" style={{ color: 'var(--text-faint)' }}>Todavía no hay datos.</p>
  }
  return (
    <div className="space-y-2.5">
      {filas.map(f => {
        const base = f.de !== undefined ? f.de : tope
        const ancho = pct(f.valor, base)
        return (
          <div key={f.nombre}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)' }}>{f.nombre}</span>
              <span className="text-[11px] font-bold tabular-nums flex-shrink-0" style={{ color }}>
                {f.valor}{f.de !== undefined ? ` de ${f.de}` : ''}{unidad ? ` ${unidad}` : ''}
                {f.de !== undefined && <span className="font-semibold ml-1" style={{ color: 'var(--text-faint)' }}>· {ancho} %</span>}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}
              title={`${f.nombre}: ${f.valor}${f.de !== undefined ? ' de ' + f.de : ''}`}>
              {f.valor > 0 && (
                <div className="h-full rounded-full" style={{ width: `${Math.max(ancho, 2)}%`, background: color }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Cómo viene el mes a mes. Una sola serie, así que no hace falta leyenda. */
export function Columnas({ datos, color = TINTA.hecho, titulo }: {
  datos: { mes: string; completadas: number }[]
  color?: string
  titulo?: string
}) {
  const tope = Math.max(1, ...datos.map(d => d.completadas))
  return (
    <div>
      {titulo && <p className="text-[11px] mb-2" style={{ color: 'var(--text-dim)' }}>{titulo}</p>}
      <div className="flex items-end gap-2" style={{ height: 110 }}>
        {datos.map(d => (
          <div key={d.mes} className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
            title={`${d.mes}: ${d.completadas}`}>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: d.completadas ? 'var(--text)' : 'var(--text-faint)' }}>
              {d.completadas}
            </span>
            <div className="w-full rounded-t"
              style={{
                height: `${Math.max((d.completadas / tope) * 100, d.completadas ? 4 : 1)}%`,
                background: d.completadas ? color : 'var(--border)',
                minHeight: 2,
              }} />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>{d.mes}</span>
          </div>
        ))}
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
