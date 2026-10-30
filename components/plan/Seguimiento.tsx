'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, MoreHorizontal, Check, X, Mail, UserMinus, Loader2,
  AlertTriangle, UserPlus, CircleSlash,
} from 'lucide-react'
import type { PlanItem } from './tipos'

// ── Seguimiento de una capacitación ───────────────────────────────────────
// Quién la tiene, en qué va cada uno y qué se puede hacer con ellos sin salir
// de la pantalla: anotar la asistencia del día, avisar por correo o quitar a
// quien se asignó por error.
//
// Nada se pierde: quitar a alguien guarda su registro completo, así que el
// "Deshacer" del aviso lo devuelve tal como estaba.
// ──────────────────────────────────────────────────────────────────────────

export interface Asignado {
  id: string
  user_id: string
  status: string
  asistencia: string | null
  asistencia_nota: string | null
  notificado_at: string | null
  notificacion_error: string | null
  name: string
  cedula: string
  cargo: string
  area: string
  correo: string
}

type Estado = 'asignado' | 'notificado' | 'asistio' | 'no_asistio' | 'excusado'

const ESTADO: Record<Estado, { nombre: string; color: string }> = {
  asignado:   { nombre: 'Asignado',   color: '#6B7280' },
  notificado: { nombre: 'Notificado', color: '#3B82F6' },
  asistio:    { nombre: 'Asistió',    color: '#10B981' },
  no_asistio: { nombre: 'No asistió', color: '#EF4444' },
  excusado:   { nombre: 'Excusado',   color: '#F59E0B' },
}

function estadoDe(a: Asignado): Estado {
  if (a.asistencia === 'asistio' || a.asistencia === 'no_asistio' || a.asistencia === 'excusado') {
    return a.asistencia
  }
  if (a.status === 'completed') return 'asistio'
  if (a.notificado_at) return 'notificado'
  return 'asignado'
}

export default function Seguimiento({
  item, asignados, cargando, onRecargar, onAviso, irAAsignar,
}: {
  item: PlanItem
  asignados: Asignado[]
  cargando: boolean
  onRecargar: () => Promise<void> | void
  onAviso: (texto: string, deshacer?: () => void) => void
  /** Para mandar a la pestaña de asignación cuando no hay nadie. */
  irAAsignar: () => void
}) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Estado | 'todos'>('todos')
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [menu, setMenu] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [confirmaQuitar, setConfirmaQuitar] = useState<{ ids: string[]; nombres: string[] } | null>(null)
  const [nota, setNota] = useState<{ ids: string[]; valor: Estado } | null>(null)
  const [faltantes, setFaltantes] = useState<any[] | null>(null)
  const cajaMenu = useRef<HTMLDivElement | null>(null)

  // Cerrar el menú al tocar afuera.
  useEffect(() => {
    if (!menu) return
    const fuera = (e: MouseEvent) => {
      if (!cajaMenu.current?.contains(e.target as Node)) setMenu(null)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [menu])

  // ── Quiénes faltan ──
  // Para lo obligatorio o lo que tiene un público definido, la lista de los
  // que deberían estar y no están. Sin eso, "12 asignados" no dice nada: lo
  // que importa es 12 de cuántos.
  const publico = (item.plan_item_targets ?? [])
  const tienePublico = item.required || publico.length > 0
  useEffect(() => {
    if (!tienePublico) { setFaltantes([]); return }
    // Mientras los asignados no hayan llegado no se calcula nada: hacerlo
    // daría "faltan todos", y esa respuesta tardía pisaba a la buena.
    if (cargando) return
    let vigente = true
    fetch('/api/users').then(r => r.ok ? r.json() : []).then((us: any[]) => {
      if (!vigente) return
      const asignadosIds = new Set(asignados.map(a => a.user_id))
      const deben = us.filter(u => {
        if (u.role && u.role !== 'worker') return false
        if (u.active === false) return false
        if (!publico.length) return true          // obligatoria sin público: todos
        return publico.some(t =>
          t.target_type === 'all' ||
          (t.target_type === 'area' && u.area_id === t.target_id) ||
          (t.target_type === 'user' && u.id === t.target_id) ||
          (t.target_type === 'group' && (u.user_groups ?? []).some((g: any) => g.groups?.id === t.target_id)))
      })
      setFaltantes(deben.filter(u => !asignadosIds.has(u.id)))
    }).catch(() => { if (vigente) setFaltantes([]) })
    return () => { vigente = false }
  }, [asignados, cargando, tienePublico, JSON.stringify(publico)])

  const cuentas = useMemo(() => {
    const c: Record<string, number> = { todos: asignados.length }
    for (const a of asignados) {
      const e = estadoDe(a)
      c[e] = (c[e] ?? 0) + 1
    }
    return c
  }, [asignados])

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return asignados.filter(a => {
      if (q && !`${a.name} ${a.cedula} ${a.cargo} ${a.area}`.toLowerCase().includes(q)) return false
      if (filtro !== 'todos' && estadoDe(a) !== filtro) return false
      return true
    })
  }, [asignados, busca, filtro])

  const pedir = useCallback(async (cuerpo: any) => {
    setOcupado(true)
    try {
      const r = await fetch('/api/asignaciones', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      const d = await r.json()
      if (!r.ok) { onAviso(d.error ?? 'No se pudo completar la acción'); return null }
      return d
    } catch {
      onAviso('Error de conexión')
      return null
    } finally {
      setOcupado(false)
      setMenu(null)
    }
  }, [onAviso])

  // ── Acciones ──
  const marcarAsistencia = async (ids: string[], valor: Estado, texto?: string) => {
    const d = await pedir({ accion: 'asistencia', enrollment_ids: ids, valor, nota: texto ?? null })
    if (!d) return
    setMarcados(new Set())
    setNota(null)
    await onRecargar()
    onAviso(`${d.marcadas} ${d.marcadas === 1 ? 'persona' : 'personas'} · ${ESTADO[valor].nombre}`)
  }

  const quitar = async (ids: string[]) => {
    const d = await pedir({ accion: 'retirar', enrollment_ids: ids })
    if (!d) return
    setMarcados(new Set())
    setConfirmaQuitar(null)
    await onRecargar()
    onAviso(
      `${d.retiradas} ${d.retiradas === 1 ? 'persona quitada' : 'personas quitadas'}${d.conservadas ? ` · ${d.conservadas} ya la hicieron y se dejaron` : ''}`,
      async () => {
        await fetch('/api/asignaciones', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion: 'restaurar', filas: d.filas, plan_item_id: item.id }),
        })
        await onRecargar()
      },
    )
  }

  const notificar = async (ids: string[], recordatorio = false) => {
    const d = await pedir({ accion: 'notificar', enrollment_ids: ids, recordatorio })
    if (!d) return
    setMarcados(new Set())
    await onRecargar()
    if (d.enviados) onAviso(`${d.enviados} ${d.enviados === 1 ? 'correo enviado' : 'correos enviados'}`)
    else onAviso(d.configurado
      ? `No se pudo enviar: ${d.fallos?.[0]?.motivo ?? 'sin correo registrado'}`
      : 'El envío de correo no está configurado todavía')
  }

  const asignarFaltantes = async () => {
    if (!faltantes?.length) return
    setOcupado(true)
    const r = await fetch('/api/asignaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_item_id: item.id, user_ids: faltantes.map(f => f.id) }),
    })
    setOcupado(false)
    const d = await r.json()
    if (!r.ok) { onAviso(d.error ?? 'No se pudo asignar'); return }
    await onRecargar()
    onAviso(`${d.asignadas} ${d.asignadas === 1 ? 'persona asignada' : 'personas asignadas'}`)
  }

  const pendientes = useMemo(
    () => asignados.filter(a => estadoDe(a) === 'asignado' || estadoDe(a) === 'notificado'),
    [asignados])

  const seleccion = [...marcados]

  const CHIPS: { id: Estado | 'todos'; nombre: string }[] = [
    { id: 'todos', nombre: 'Todos' },
    { id: 'asignado', nombre: 'Asignados' },
    { id: 'notificado', nombre: 'Notificados' },
    { id: 'asistio', nombre: 'Asistieron' },
    { id: 'no_asistio', nombre: 'No asistieron' },
    { id: 'excusado', nombre: 'Excusados' },
  ]

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Buscador y filtros ── */}
      <div className="px-4 pt-3 pb-2 space-y-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Nombre, cédula, cargo o área…" aria-label="Buscar persona"
            className="w-full text-xs rounded-lg pl-8 pr-3 py-2 outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        <div className="flex flex-wrap gap-1">
          {CHIPS.map(ch => {
            const n = cuentas[ch.id] ?? 0
            if (ch.id !== 'todos' && n === 0) return null
            const activo = filtro === ch.id
            const color = ch.id === 'todos' ? 'var(--primary)' : ESTADO[ch.id as Estado].color
            return (
              <button key={ch.id} onClick={() => setFiltro(ch.id)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                style={{
                  background: activo ? color : 'var(--bg-card)',
                  color: activo ? '#fff' : 'var(--text-dim)',
                  border: `1px solid ${activo ? color : 'var(--border)'}`,
                }}>
                {ch.nombre} <span style={{ opacity: 0.75 }}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Barra de acciones en bloque ── */}
      {seleccion.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-1.5 flex-wrap flex-shrink-0"
          style={{ background: 'var(--primary-dim)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
            {seleccion.length} seleccionad{seleccion.length === 1 ? 'a' : 'as'}
          </span>
          <button onClick={() => marcarAsistencia(seleccion, 'asistio')} disabled={ocupado}
            className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: '#10B98120', color: '#10B981' }}>
            <Check size={10} /> Asistió
          </button>
          <button onClick={() => setNota({ ids: seleccion, valor: 'no_asistio' })} disabled={ocupado}
            className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: '#EF444420', color: '#EF4444' }}>
            <X size={10} /> No asistió
          </button>
          <button onClick={() => setNota({ ids: seleccion, valor: 'excusado' })} disabled={ocupado}
            className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: '#F59E0B20', color: '#F59E0B' }}>
            <CircleSlash size={10} /> Excusado
          </button>
          <button onClick={() => notificar(seleccion)} disabled={ocupado}
            className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
            <Mail size={10} /> Correo
          </button>
          <button
            onClick={() => setConfirmaQuitar({
              ids: seleccion,
              nombres: asignados.filter(a => marcados.has(a.id)).map(a => a.name),
            })}
            disabled={ocupado}
            className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: 'var(--red-dim)', color: '#FCA5A5' }}>
            <UserMinus size={10} /> Quitar
          </button>
          <button onClick={() => setMarcados(new Set())}
            className="ml-auto text-[10px] font-semibold" style={{ color: 'var(--text-dim)' }}>
            Limpiar
          </button>
        </div>
      )}

      {/* ── Lista ── */}
      <div className="flex-1 overflow-y-auto" ref={cajaMenu}>
        {asignados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
            <UserPlus size={26} style={{ color: 'var(--text-faint)' }} />
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Todavía no hay nadie asignado a esta capacitación.
            </p>
            <button onClick={irAAsignar} className="terra-btn text-xs" style={{ padding: '6px 14px' }}>
              Asignar personas
            </button>
          </div>
        ) : (
          <>
            {/* Marcar todas las visibles */}
            <label className="flex items-center gap-3 px-4 py-2 cursor-pointer"
              style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <input type="checkbox"
                checked={visibles.length > 0 && visibles.every(v => marcados.has(v.id))}
                onChange={e => setMarcados(prev => {
                  const n = new Set(prev)
                  visibles.forEach(v => e.target.checked ? n.add(v.id) : n.delete(v.id))
                  return n
                })}
                className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                {visibles.length} {visibles.length === 1 ? 'persona' : 'personas'}
              </span>
            </label>

            {visibles.map(a => {
              const e = estadoDe(a)
              const { nombre, color } = ESTADO[e]
              const abierto = menu === a.id
              return (
                <div key={a.id} className="relative flex items-center gap-3 px-4 py-2"
                  style={{ borderBottom: '1px solid var(--border)', background: marcados.has(a.id) ? 'var(--primary-dim)' : 'transparent' }}>
                  <input type="checkbox" checked={marcados.has(a.id)}
                    onChange={() => setMarcados(prev => {
                      const n = new Set(prev); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n
                    })}
                    className="w-4 h-4 rounded accent-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{a.name}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                      {[a.cargo, a.area].filter(Boolean).join(' · ') || a.cedula}
                    </p>
                    {a.asistencia_nota && (
                      <p className="text-[10px] italic truncate" style={{ color: 'var(--text-faint)' }}>“{a.asistencia_nota}”</p>
                    )}
                    {a.notificacion_error && (
                      <p className="text-[10px] truncate" style={{ color: '#FCA5A5' }}>
                        Correo: {a.notificacion_error}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: color + '20', color }}>
                    {nombre}
                  </span>
                  <button onClick={() => setMenu(abierto ? null : a.id)}
                    aria-label={`Acciones para ${a.name}`}
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ color: 'var(--text-dim)', background: abierto ? 'var(--bg-card)' : 'transparent' }}>
                    <MoreHorizontal size={14} />
                  </button>

                  {abierto && (
                    <div className="absolute right-3 top-full z-20 rounded-xl overflow-hidden shadow-xl"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', minWidth: 190 }}>
                      {[
                        { n: 'Marcar: Asistió', i: Check, c: '#10B981', f: () => marcarAsistencia([a.id], 'asistio') },
                        { n: 'Marcar: No asistió', i: X, c: '#EF4444', f: () => setNota({ ids: [a.id], valor: 'no_asistio' }) },
                        { n: 'Marcar: Excusado', i: CircleSlash, c: '#F59E0B', f: () => setNota({ ids: [a.id], valor: 'excusado' }) },
                        { n: a.notificado_at ? 'Reenviar recordatorio' : 'Avisar por correo', i: Mail, c: 'var(--primary)', f: () => notificar([a.id], !!a.notificado_at) },
                        { n: 'Quitar de la capacitación', i: UserMinus, c: '#EF4444', f: () => setConfirmaQuitar({ ids: [a.id], nombres: [a.name] }) },
                      ].map(o => (
                        <button key={o.n} onClick={o.f} disabled={ocupado}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-left transition-colors hover:bg-[var(--bg-card)]"
                          style={{ color: 'var(--text)' }}>
                          <o.i size={11} style={{ color: o.c }} /> {o.n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ── Faltan por asignar ── */}
        {faltantes && faltantes.length > 0 && (
          <div className="m-3 rounded-xl p-3"
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={12} style={{ color: '#FCA5A5' }} />
              <span className="text-[11px] font-bold" style={{ color: '#FCA5A5' }}>
                Faltan por asignar: {faltantes.length}
              </span>
            </div>
            <p className="text-[10px] mb-2 line-clamp-2" style={{ color: 'var(--text-dim)' }}>
              {faltantes.slice(0, 6).map(f => f.name).join(' · ')}
              {faltantes.length > 6 ? ` y ${faltantes.length - 6} más` : ''}
            </p>
            <button onClick={asignarFaltantes} disabled={ocupado}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {ocupado ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
              Asignar a los que faltan
            </button>
          </div>
        )}

        {/* Recordatorio a los pendientes */}
        {pendientes.length > 0 && (
          <div className="px-4 py-3">
            <button onClick={() => notificar(pendientes.map(p => p.id), true)} disabled={ocupado}
              className="w-full text-[11px] font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <Mail size={11} /> Enviar recordatorio a {pendientes.length} pendiente{pendientes.length === 1 ? '' : 's'}
            </button>
          </div>
        )}
      </div>

      {/* ── Confirmar quitar ── */}
      {confirmaQuitar && (
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--red-dim)' }}>
          <p className="text-[11px] mb-2" style={{ color: '#FCA5A5' }}>
            ¿Quitar a {confirmaQuitar.nombres.slice(0, 3).join(', ')}
            {confirmaQuitar.nombres.length > 3 ? ` y ${confirmaQuitar.nombres.length - 3} más` : ''} de esta
            capacitación? Queda anotado quién lo hizo y se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmaQuitar(null)} className="terra-btn-outline flex-1 text-xs py-1.5">
              No, dejarlos
            </button>
            <button onClick={() => quitar(confirmaQuitar.ids)} disabled={ocupado}
              className="flex-1 text-xs py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
              style={{ background: '#EF4444', color: '#fff' }}>
              {ocupado ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />} Sí, quitar
            </button>
          </div>
        </div>
      )}

      {/* ── Nota opcional al marcar ── */}
      {nota && (
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
            {ESTADO[nota.valor].nombre} · nota (opcional)
          </label>
          <input id="nota-asistencia" autoFocus
            placeholder={nota.valor === 'excusado' ? 'Incapacidad, permiso…' : 'Por qué no asistió'}
            className="w-full text-xs rounded-lg px-3 py-2 outline-none mb-2"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onKeyDown={e => {
              if (e.key === 'Enter') marcarAsistencia(nota.ids, nota.valor, (e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setNota(null)
            }} />
          <div className="flex gap-2">
            <button onClick={() => setNota(null)} className="terra-btn-outline flex-1 text-xs py-1.5">Cancelar</button>
            <button
              onClick={() => marcarAsistencia(
                nota.ids, nota.valor,
                (document.getElementById('nota-asistencia') as HTMLInputElement)?.value)}
              disabled={ocupado}
              className="flex-1 text-xs py-1.5 rounded-xl font-bold"
              style={{ background: ESTADO[nota.valor].color, color: '#fff' }}>
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { estadoDe, ESTADO, type Estado }
