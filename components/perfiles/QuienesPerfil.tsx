'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  X, Loader2, Save, Users, Search, UserMinus, UserPlus, AlertCircle, Check,
} from 'lucide-react'

interface Persona {
  id: string; name: string; cedula: string | null
  cargo: string | null; area: string | null
  motivo: 'cargo' | 'a mano'
}
interface CargoDisponible { cargo: string; personas: number }

const inp = 'w-full text-sm rounded-lg px-3 py-2 outline-none'
const estiloInp: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
}

/**
 * Quién pertenece a un perfil: los cargos que lo forman, la gente que queda
 * dentro, y las correcciones de a una.
 */
export default function QuienesPerfil({
  profileId, nombrePerfil, onCerrar, onCambio,
}: {
  profileId: string
  nombrePerfil: string
  onCerrar: () => void
  /** Para refrescar el conteo en la lista de perfiles. */
  onCambio?: (personas: number) => void
}) {
  const [cargos, setCargos] = useState<string[]>([])
  const [disponibles, setDisponibles] = useState<CargoDisponible[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [excepciones, setExcepciones] = useState<{ user_id: string; incluir: boolean }[]>([])
  const [todos, setTodos] = useState<Persona[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [agregando, setAgregando] = useState(false)

  const cargar = async () => {
    const r = await fetch(`/api/profiles/${profileId}/personas`)
    if (!r.ok) { setError((await r.json().catch(() => ({}))).error ?? 'No se pudo cargar'); setCargando(false); return }
    const d = await r.json()
    setCargos(d.cargos ?? [])
    setDisponibles(d.cargosDisponibles ?? [])
    setPersonas(d.personas ?? [])
    setExcepciones(d.excepciones ?? [])
    setCargando(false)
    onCambio?.((d.personas ?? []).length)
  }

  useEffect(() => {
    cargar()
    fetch('/api/users').then(r => r.ok ? r.json() : []).then((us: any[]) => {
      setTodos((us ?? [])
        .filter(u => u.role === 'worker' && u.active !== false && !u.retired_at)
        .map(u => ({
          id: u.id, name: u.name, cedula: u.cedula ?? null,
          cargo: u.cargo ?? null, area: u.area ?? null, motivo: 'a mano' as const,
        })))
    }).catch(() => {})
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [profileId])

  const alternarCargo = (c: string) =>
    setCargos(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])

  const guardarCargos = async () => {
    setGuardando(true); setError(null); setGuardado(false)
    try {
      const r = await fetch(`/api/profiles/${profileId}/personas`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargos }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'No se pudo guardar'); return }
      setPersonas(d.personas ?? [])
      onCambio?.((d.personas ?? []).length)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
    } finally { setGuardando(false) }
  }

  const corregir = async (userId: string, incluir: boolean | null) => {
    setError(null)
    const r = await fetch(`/api/profiles/${profileId}/personas`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, incluir }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setError(d.error ?? 'No se pudo cambiar'); return }
    setPersonas(d.personas ?? [])
    onCambio?.((d.personas ?? []).length)
    setExcepciones(ex => incluir === null
      ? ex.filter(e => e.user_id !== userId)
      : [...ex.filter(e => e.user_id !== userId), { user_id: userId, incluir }])
  }

  const dentro = useMemo(() => new Set(personas.map(p => p.id)), [personas])
  const sacadas = useMemo(
    () => new Set(excepciones.filter(e => !e.incluir).map(e => e.user_id)), [excepciones])

  const candidatos = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return []
    return todos
      .filter(p => !dentro.has(p.id))
      .filter(p => `${p.name} ${p.cedula ?? ''} ${p.cargo ?? ''}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [todos, dentro, busca])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCerrar}>
      <div className="terra-card w-full max-w-2xl max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Quiénes son «{nombrePerfil}»
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              Los cursos de este perfil le aplican a esta gente.
            </p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ color: 'var(--text-faint)' }}>
            <X size={16} />
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {error && (
              <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            {/* ── Los cargos que forman el perfil ── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
                Cargos que entran
              </p>
              <p className="text-[11px] mb-2.5 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                Escoja de los cargos que de verdad existen hoy. Quien tenga uno de estos queda dentro,
                y el que entre mañana con ese cargo también, sin que nadie lo meta a mano.
              </p>

              {!disponibles.length ? (
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Todavía no hay trabajadores con cargo registrado.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {disponibles.map(c => {
                    const puesto = cargos.includes(c.cargo)
                    return (
                      <button key={c.cargo} onClick={() => alternarCargo(c.cargo)}
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                        style={puesto
                          ? { background: 'var(--primary)', color: '#fff' }
                          : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                        {puesto && <Check size={11} />}
                        {c.cargo}
                        <span style={{ opacity: 0.7 }}>· {c.personas}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Un cargo guardado que ya no existe en ninguna ficha: se avisa,
                  porque es justo lo que tenía a los perfiles vacíos. */}
              {cargos.filter(c => !disponibles.some(d => d.cargo === c)).map(c => (
                <p key={c} className="text-[11px] mt-2 flex items-start gap-1.5" style={{ color: '#F59E0B' }}>
                  <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                  <span>
                    «{c}» no coincide con el cargo de ningún trabajador, así que no mete a nadie.
                    <button onClick={() => alternarCargo(c)} className="ml-1 font-bold underline">Quitarlo</button>
                  </span>
                </p>
              ))}

              <div className="flex items-center justify-end gap-2 mt-3">
                {guardado && <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Guardado</span>}
                <button onClick={guardarCargos} disabled={guardando}
                  className="terra-btn flex items-center gap-1.5" style={{ padding: '8px 16px', fontSize: 12 }}>
                  {guardando ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Guardar cargos
                </button>
              </div>
            </div>

            {/* ── La gente que queda ── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--text-dim)' }}>
                  <Users size={12} /> {personas.length} {personas.length === 1 ? 'persona' : 'personas'}
                </p>
                <button onClick={() => setAgregando(a => !a)}
                  className="text-[11px] font-bold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                  <UserPlus size={12} /> Meter a alguien
                </button>
              </div>

              {agregando && (
                <div className="mb-3">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
                    <input value={busca} onChange={e => setBusca(e.target.value)} autoFocus
                      placeholder="Buscar por nombre, cédula o cargo"
                      className={inp} style={{ ...estiloInp, paddingLeft: 28 }} />
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {candidatos.map(p => (
                      <button key={p.id} onClick={() => { corregir(p.id, true); setBusca('') }}
                        className="w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <UserPlus size={12} style={{ color: 'var(--primary)' }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                            {[p.cedula, p.cargo].filter(Boolean).join(' · ')}
                            {sacadas.has(p.id) && ' · la había sacado'}
                          </p>
                        </div>
                      </button>
                    ))}
                    {busca && !candidatos.length && (
                      <p className="text-[11px] py-2" style={{ color: 'var(--text-faint)' }}>
                        Nadie coincide, o ya está dentro.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!personas.length ? (
                <div className="rounded-xl p-5 text-center"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Este perfil no tiene a nadie</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>
                    Sus cursos no le aplican a ningún trabajador. Escoja arriba los cargos que lo forman.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden divide-y"
                  style={{ border: '1px solid var(--border)', borderColor: 'var(--border)' }}>
                  {personas.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                          {[p.cedula, p.cargo, p.area].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      {p.motivo === 'a mano' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: 'rgba(139,92,246,0.14)', color: '#8B5CF6' }}>
                          METIDA A MANO
                        </span>
                      )}
                      <button
                        onClick={() => corregir(p.id, p.motivo === 'a mano' ? null : false)}
                        title={p.motivo === 'a mano' ? 'Deshacer: vuelve a decidirse por su cargo' : 'Sacar del perfil'}
                        aria-label={`Sacar a ${p.name}`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ color: '#FCA5A5' }}>
                        <UserMinus size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Los sacados a mano, para que no se olviden ahí escondidos. */}
              {!!sacadas.size && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
                  Hay {sacadas.size} {sacadas.size === 1 ? 'persona sacada' : 'personas sacadas'} a mano, aunque su cargo calce.
                  Búsquela en «Meter a alguien» para devolverla.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
