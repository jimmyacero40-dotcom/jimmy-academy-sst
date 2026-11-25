'use client'

/**
 * El filtro de estado, en botones y no en una lista desplegable.
 *
 * En una lista hay que abrirla para saber qué opciones hay y cuál está
 * puesta. En botones se ve de una: cuál está activo y cuántos hay de cada
 * cosa. Es el mismo que ya tenía Trazabilidad, que es el que funciona.
 */
export default function FiltroEstado({ valor, onCambio, opciones }: {
  valor: string
  onCambio: (v: string) => void
  /** `{ id: '' }` es «todos». El conteo es opcional. */
  opciones: { id: string; label: string; n?: number }[]
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {opciones.map(o => (
        <button key={o.id || 'todos'} onClick={() => onCambio(o.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
          style={valor === o.id
            ? { background: 'var(--primary)', color: '#fff' }
            : { color: 'var(--text-dim)' }}>
          {o.label}
          {o.n !== undefined && (
            <span className="ml-1.5 opacity-70">{o.n}</span>
          )}
        </button>
      ))}
    </div>
  )
}
