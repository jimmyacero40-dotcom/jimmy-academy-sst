'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import AsignarCapacitacion from '@/components/AsignarCapacitacion'
import BibliotecaTemas, { type FiltroTemas } from '@/components/plan/BibliotecaTemas'
import { CoberturaCtx } from '@/components/plan/ChipItem'
import VistaMes from '@/components/plan/VistaMes'
import VistaAno from '@/components/plan/VistaAno'
import PanelAsignacion, { type ValoresIniciales } from '@/components/plan/PanelAsignacion'
import PanelCapacitacion from '@/components/plan/PanelCapacitacion'
import { colorCategoria, type PlanItem, type Tema, type Cobertura } from '@/components/plan/tipos'
import { MESES, partes, enPalabras, horas } from '@/lib/plan-fechas'
import { DialogoReprogramar } from '@/components/plan/DialogoReprogramar'
import {
  Calendar, Plus, Trash2, X, Loader2, AlertCircle, ChevronLeft,
  BookOpen, ArrowRight, GraduationCap, LayoutGrid, CalendarDays,
  Check, Clock, AlertTriangle, Undo2, Users,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────
interface Plan {
  id: string
  name: string
  year: number
  status: string
  profile_id: string | null
  item_count: number
}

interface TrainingProfile { id: string; name: string }

interface Vista { clase: 'mes' | 'ano' }

type Panel =
  | { modo: 'crear'; tema: Tema | null; inicial: ValoresIniciales }
  | { modo: 'editar'; item: PlanItem }

export default function PlanPage() {
  // Asistente de asignación nominal (el de "Asignar capacitación").
  const [asignarMes, setAsignarMes] = useState<number | null>(null)

  const [plans, setPlans]       = useState<Plan[]>([])
  const [profiles, setProfiles] = useState<TrainingProfile[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Crear plan
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]   = useState({ name: '', year: new Date().getFullYear(), profile_id: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Editor
  const [editingPlan, setEditingPlan]   = useState<Plan | null>(null)
  const [items, setItems]               = useState<PlanItem[]>([])
  const [biblioteca, setBiblioteca]     = useState<Tema[]>([])
  const [perfilActivo, setPerfilActivo] = useState('')
  const [idsPerfil, setIdsPerfil]       = useState<Map<number, boolean> | null>(null)
  const [loadingEditor, setLoadingEditor] = useState(false)
  const [loadingPerfil, setLoadingPerfil] = useState(false)

  // Calendario
  const [vista, setVista]   = useState<Vista>({ clase: 'mes' })
  const [mesVisible, setMes] = useState(new Date().getMonth() + 1)
  const [filtroTemas, setFiltroTemas] = useState<FiltroTemas>('todos')
  const [armado, setArmado] = useState<number | null>(null)
  const [panel, setPanel]   = useState<Panel | null>(null)
  const [arrastrando, setArrastrando] = useState<{ clase: string; etiqueta: string; color: string } | null>(null)
  const [aviso, setAviso]   = useState<{ texto: string; deshacer?: () => void } | null>(null)
  // Cuánta gente lleva cada capacitación: alimenta el 12/40 de los chips y
  // decide si mover una por arrastre merece preguntar antes.
  const [cobertura, setCobertura] = useState<Cobertura>({})
  const [porReprogramar, setPorReprogramar] = useState<
    { item: PlanItem; mes: number; fecha: string | null } | null>(null)

  const sensores = useSensors(
    // Un umbral pequeño: así un clic sigue siendo un clic y no empieza a
    // arrastrar, que es lo que rompe el modo de dos toques en celular.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  // ── Cargar ──────────────────────────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    setLoading(true)
    const [pRes, prRes] = await Promise.all([fetch('/api/plans'), fetch('/api/profiles')])
    if (pRes.ok) setPlans(await pRes.json())
    if (prRes.ok) setProfiles(await prRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadPlans() }, [loadPlans])

  const cargarPerfil = useCallback(async (profileId: string) => {
    setPerfilActivo(profileId)
    if (!profileId) { setIdsPerfil(null); return }
    setLoadingPerfil(true)
    const res = await fetch(`/api/profiles/${profileId}/trainings`)
    if (res.ok) {
      const data = await res.json()
      setIdsPerfil(new Map(data.map((t: any) => [t.id as number, t.required !== false])))
    }
    setLoadingPerfil(false)
  }, [])

  const openEditor = useCallback(async (plan: Plan) => {
    setEditingPlan(plan)
    setLoadingEditor(true)
    setPanel(null); setArmado(null); setItems([]); setBiblioteca([])
    setVista({ clase: 'mes' })
    // Si el plan es del año en curso se abre en el mes de hoy; si es de otro
    // año, en enero, porque "hoy" no dice nada dentro de ese plan.
    setMes(plan.year === new Date().getFullYear() ? new Date().getMonth() + 1 : 1)

    const perfil = plan.profile_id ?? ''
    setPerfilActivo(perfil)

    const [iRes, tRes, pRes, cRes] = await Promise.all([
      fetch(`/api/plans/${plan.id}/items`),
      fetch('/api/trainings'),
      perfil ? fetch(`/api/profiles/${perfil}/trainings`) : Promise.resolve(null),
      fetch(`/api/plans/${plan.id}/cobertura`),
    ])
    if (iRes.ok) setItems(await iRes.json())
    setCobertura(cRes.ok ? await cRes.json() : {})
    if (tRes.ok) {
      const data = await tRes.json()
      setBiblioteca(
        (data as any[])
          .filter(t => t.status !== 'inactivo')
          .map(t => ({
            id: t.id, title: t.title, duration: t.duration, category: t.category,
            descripcion: t.description ?? null,
            obligatorio: t.category === 'Obligatorio',
          }))
          .sort((a, b) => a.title.localeCompare(b.title, 'es')),
      )
    }
    if (pRes?.ok) {
      const data = await pRes.json()
      setIdsPerfil(new Map(data.map((t: any) => [t.id as number, t.required !== false])))
    } else setIdsPerfil(null)
    setLoadingEditor(false)
  }, [])

  // ── Temas visibles y sus conteos ────────────────────────────────────────
  // El ×N sale del arreglo de ítems que ya se cargó con el plan: no hay una
  // consulta por tema.
  const temas: Tema[] = useMemo(() => {
    if (!idsPerfil) return biblioteca
    return biblioteca
      .filter(t => idsPerfil.has(t.id))
      .map(t => ({ ...t, obligatorio: idsPerfil.get(t.id) === true }))
  }, [biblioteca, idsPerfil])

  const conteos = useMemo(() => {
    const m = new Map<number, number>()
    for (const i of items) m.set(i.trainings.id, (m.get(i.trainings.id) ?? 0) + 1)
    return m
  }, [items])

  const obligatoriosSinProgramar = useMemo(
    () => temas.filter(t => t.obligatorio && (conteos.get(t.id) ?? 0) === 0).length,
    [temas, conteos],
  )

  const delMes = useMemo(() => items.filter(i => i.month === mesVisible), [items, mesVisible])

  const resumen = useMemo(() => ({
    total: delMes.length,
    ejecutadas: delMes.filter(i => i.estado === 'completada').length,
    programadas: delMes.filter(i => i.estado === 'programada').length,
    pendientes: delMes.filter(i => i.estado === 'pendiente').length,
    horas: delMes.reduce((s, i) => s + horas(i.trainings.duration), 0),
  }), [delMes])

  // ── Mover una capacitación ──────────────────────────────────────────────
  /** Vuelve a traer las capacitaciones del plan y su cobertura. */
  const recargarItems = useCallback(async (): Promise<PlanItem[] | null> => {
    if (!editingPlan) return null
    const [iRes, cRes] = await Promise.all([
      fetch(`/api/plans/${editingPlan.id}/items`),
      fetch(`/api/plans/${editingPlan.id}/cobertura`),
    ])
    if (cRes.ok) setCobertura(await cRes.json())
    if (!iRes.ok) return null
    const frescos: PlanItem[] = await iRes.json()
    setItems(frescos)
    return frescos
  }, [editingPlan])

  const moverItem = useCallback(async (
    item: PlanItem, mes: number, fecha: string | null, conAviso = true,
  ) => {
    if (!editingPlan) return
    if (item.month === mes && (item.scheduled_date ?? null) === fecha) return

    const antes = { month: item.month, scheduled_date: item.scheduled_date }
    // Actualización optimista: el chip se mueve ya, y si Supabase falla vuelve.
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, month: mes, scheduled_date: fecha } : i))

    const res = await fetch(`/api/plans/${editingPlan.id}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id, month: mes, scheduled_date: fecha }),
    })

    if (!res.ok) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...antes } : i))
      setError('No se pudo mover la capacitación')
      return
    }

    if (conAviso) {
      setAviso({
        texto: `Movida a ${fecha ? enPalabras(fecha) : MESES[mes - 1]}`,
        deshacer: () => {
          setAviso(null)
          moverItem({ ...item, month: mes, scheduled_date: fecha }, antes.month, antes.scheduled_date, false)
        },
      })
    }
  }, [editingPlan])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 6000)
    return () => clearTimeout(t)
  }, [aviso])

  // Esc cancela el tema armado.
  useEffect(() => {
    if (armado === null) return
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') setArmado(null) }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [armado])

  // ── Abrir el panel en modo creación ─────────────────────────────────────
  const crearEn = useCallback((temaId: number | null, mes: number, fecha: string | null) => {
    const tema = temaId !== null ? (temas.find(t => t.id === temaId) ?? null) : null
    setPanel({ modo: 'crear', tema, inicial: { month: mes, scheduled_date: fecha, required: tema?.obligatorio } })
    setArmado(null)
  }, [temas])

  // ── Arrastrar y soltar ──────────────────────────────────────────────────
  const alEmpezar = (e: DragStartEvent) => {
    const d = e.active.data.current as any
    if (d?.clase === 'tema') {
      const t = temas.find(x => x.id === d.temaId)
      setArrastrando({ clase: 'tema', etiqueta: t?.title ?? '', color: colorCategoria(t?.category ?? null) })
    } else {
      const i = items.find(x => x.id === d?.itemId)
      setArrastrando({ clase: 'item', etiqueta: i?.trainings.title ?? '', color: colorCategoria(i?.trainings.category ?? null) })
    }
  }

  const alSoltar = (e: DragEndEvent) => {
    setArrastrando(null)
    const origen = e.active.data.current as any
    const destino = e.over?.data.current as any
    if (!origen || !destino) return

    // ¿A qué mes y fecha corresponde el destino?
    let mes: number, fecha: string | null
    if (destino.clase === 'dia' && destino.fecha) {
      fecha = destino.fecha
      mes = partes(destino.fecha)!.mes
    } else if (destino.clase === 'mes') {
      mes = destino.mes; fecha = null
    } else if (destino.clase === 'sin_fecha') {
      mes = destino.mes; fecha = null
    } else return

    if (origen.clase === 'tema') {
      crearEn(origen.temaId, mes, fecha)
    } else {
      const item = items.find(i => i.id === origen.itemId)
      if (!item) return
      if (item.month === mes && (item.scheduled_date ?? null) === fecha) return
      // Mover una capacitación que ya tiene gente asignada no es acomodar el
      // calendario: es cambiarle el día a cuarenta personas. Eso se pregunta.
      if ((cobertura[item.id]?.asignados ?? 0) > 0) setPorReprogramar({ item, mes, fecha })
      else moverItem(item, mes, fecha)
    }
  }

  // ── Resultado del panel ─────────────────────────────────────────────────
  const alGuardar = (guardados: PlanItem[]) => {
    setItems(prev => {
      const mapa = new Map(prev.map(i => [i.id, i]))
      for (const g of guardados) {
        const viejo = mapa.get(g.id)
        // El PATCH devuelve el ítem sin la categoría del curso; se conserva la
        // que ya se tenía para que el chip no cambie de color al guardar.
        mapa.set(g.id, viejo
          ? { ...g, trainings: { ...viejo.trainings, ...g.trainings }, plan_item_targets: g.plan_item_targets ?? viejo.plan_item_targets }
          : g)
      }
      return [...mapa.values()]
    })
    // Que se vea lo que se acabó de crear, aunque cayera en otro mes.
    const primero = guardados[0]
    if (primero && vista.clase === 'mes') setMes(primero.month)
    setPanel(null)
  }

  const asistente = (
    <AsignarCapacitacion
      abierto={asignarMes !== null}
      mesInicial={asignarMes ?? undefined}
      onCerrar={() => setAsignarMes(null)}
      onListo={async () => {
        await loadPlans()
        if (editingPlan) {
          const r = await fetch(`/api/plans/${editingPlan.id}/items`)
          if (r.ok) setItems(await r.json())
        }
      }}
    />
  )

  // ── EDITOR ──────────────────────────────────────────────────────────────
  if (editingPlan) {
    const temaArmado = armado !== null ? temas.find(t => t.id === armado) : null

    const INDICADORES = [
      { nombre: 'Del mes', valor: resumen.total, icono: Calendar, color: 'var(--primary)' },
      { nombre: 'Ejecutadas', valor: resumen.ejecutadas, icono: Check, color: '#10B981' },
      { nombre: 'Programadas', valor: resumen.programadas, icono: CalendarDays, color: 'var(--primary)' },
      { nombre: 'Pendientes', valor: resumen.pendientes, icono: Clock, color: '#6B7280' },
      { nombre: 'Horas', valor: resumen.horas % 1 === 0 ? resumen.horas : resumen.horas.toFixed(1), icono: Clock, color: '#F59E0B' },
    ]

    return (
      <DndContext sensors={sensores} collisionDetection={closestCenter}
        onDragStart={alEmpezar} onDragEnd={alSoltar} onDragCancel={() => setArrastrando(null)}>
        <CoberturaCtx.Provider value={cobertura}>
        <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">

          {/* Barra superior */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => { setEditingPlan(null); setPanel(null); setArmado(null) }}
                className="flex items-center gap-1 text-sm flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
                <ChevronLeft size={15} /> Planes
              </button>
              <span style={{ color: 'var(--border)' }}>/</span>
              <span className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{editingPlan.name}</span>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{editingPlan.year}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Mes | Año */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {([['mes', 'Mes', CalendarDays], ['ano', 'Año', LayoutGrid]] as const).map(([k, nombre, Icono]) => (
                  <button key={k} onClick={() => setVista({ clase: k })}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold transition-all"
                    style={{
                      background: vista.clase === k ? 'var(--primary)' : 'transparent',
                      color: vista.clase === k ? '#fff' : 'var(--text-dim)',
                    }}>
                    <Icono size={11} /> {nombre}
                  </button>
                ))}
              </div>
              <button onClick={() => setAsignarMes(mesVisible)}
                className="terra-btn-outline flex items-center gap-1" style={{ padding: '6px 12px', fontSize: 11 }}>
                <Users size={12} /> Asignar a personas
              </button>
            </div>
          </div>

          {/* Indicadores */}
          <div className="flex flex-wrap items-center gap-1.5 px-3 sm:px-5 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            {INDICADORES.map(({ nombre, valor, icono: Icono, color }) => (
              <div key={nombre} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Icono size={11} style={{ color }} />
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{nombre}</span>
                <span className="text-xs font-black" style={{ color: 'var(--text)' }}>{valor}</span>
              </div>
            ))}
            {obligatoriosSinProgramar > 0 && (
              <button onClick={() => setFiltroTemas('sin_programar')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all"
                style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertTriangle size={11} style={{ color: '#FCA5A5' }} />
                <span className="text-[10px]" style={{ color: '#FCA5A5' }}>Obligatorios sin programar</span>
                <span className="text-xs font-black" style={{ color: '#FCA5A5' }}>{obligatoriosSinProgramar}</span>
              </button>
            )}
          </div>

          {/* Barra del modo "dos toques" */}
          <AnimatePresence>
            {temaArmado && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 flex-shrink-0 overflow-hidden"
                style={{ background: 'var(--primary-dim)', borderBottom: '1px solid rgba(59,130,246,0.3)' }}>
                <CalendarDays size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                  Toca un día para programar «{temaArmado.title}»
                </span>
                <button onClick={() => setArmado(null)}
                  className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
                  Cancelar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cuerpo: temas + calendario. En pantallas chicas, temas arriba. */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            <div className="flex flex-col flex-shrink-0 lg:border-r overflow-hidden"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="lg:w-[244px] flex flex-col overflow-hidden max-h-[38vh] lg:max-h-none lg:h-full">
                <div className="px-3 pt-2.5 pb-2 flex-shrink-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>
                    Perfil
                  </div>
                  <select value={perfilActivo} onChange={e => cargarPerfil(e.target.value)}
                    className="terra-input text-xs py-1.5 w-full" aria-label="Filtrar temas por perfil">
                    <option value="">Toda la Biblioteca</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {loadingPerfil ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : (
                  <BibliotecaTemas temas={temas} conteos={conteos}
                    filtro={filtroTemas} onFiltro={setFiltroTemas}
                    armado={armado} onArmar={setArmado} />
                )}
              </div>
            </div>

            {/* Calendario */}
            <div className="flex-1 overflow-auto p-2 sm:p-3">
              {loadingEditor ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              ) : vista.clase === 'mes' ? (
                <VistaMes
                  anio={editingPlan.year} mes={mesVisible} items={delMes}
                  seleccionado={panel?.modo === 'editar' ? panel.item.id : null}
                  armado={armado !== null}
                  onMes={setMes}
                  onAbrirItem={item => setPanel({ modo: 'editar', item })}
                  onCrearEnDia={fecha => crearEn(armado, fecha ? partes(fecha)!.mes : mesVisible, fecha)}
                />
              ) : (
                <VistaAno
                  items={items}
                  seleccionado={panel?.modo === 'editar' ? panel.item.id : null}
                  armado={armado !== null}
                  onAbrirMes={m => { setMes(m); setVista({ clase: 'mes' }) }}
                  onAbrirItem={item => setPanel({ modo: 'editar', item })}
                  onCrearEnMes={m => crearEn(armado, m, null)}
                />
              )}
            </div>
          </div>

          {/* Panel */}
          <AnimatePresence>
            {panel && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }}
                  onClick={() => setPanel(null)} />
                {panel.modo === 'editar' ? (
                  <PanelCapacitacion
                    key={panel.item.id}
                    item={panel.item}
                    planId={editingPlan.id}
                    anioPlan={editingPlan.year}
                    temas={temas}
                    onCerrar={() => setPanel(null)}
                    onGuardado={alGuardar}
                    onEliminado={id => {
                      setItems(prev => prev.filter(i => i.id !== id))
                      setPanel(null)
                    }}
                    onRecargarPlan={async () => {
                      // La fecha o el estado pudieron cambiar, así que el
                      // calendario y los contadores se rehacen con lo que hay
                      // en la base.
                      const frescos = await recargarItems()
                      if (!frescos) return
                      const actual = frescos.find(i => i.id === panel.item.id)
                      if (actual) {
                        setPanel({ modo: 'editar', item: actual })
                        if (vista.clase === 'mes') setMes(actual.month)
                      }
                    }}
                    onAviso={(texto, deshacer) => setAviso({ texto, deshacer })}
                  />
                ) : (
                  <PanelAsignacion
                    key="nueva"
                    modo="crear"
                    planId={editingPlan.id}
                    anioPlan={editingPlan.year}
                    tema={panel.tema}
                    temas={temas}
                    inicial={panel.inicial}
                    onCerrar={() => setPanel(null)}
                    onGuardado={alGuardar}
                  />
                )}
              </>
            )}
          </AnimatePresence>

          {/* Lo que se arrastra */}
          <DragOverlay dropAnimation={null}>
            {arrastrando && (
              <div className="rounded-lg px-2 py-1 text-[11px] font-bold shadow-xl"
                style={{
                  background: arrastrando.color + '28',
                  border: `1px solid ${arrastrando.color}`,
                  color: 'var(--text)', maxWidth: 220,
                }}>
                <span className="block truncate">{arrastrando.etiqueta}</span>
              </div>
            )}
          </DragOverlay>

          {asistente}

          {porReprogramar && (
            <DialogoReprogramar
              item={porReprogramar.item}
              fecha={porReprogramar.fecha}
              asignados={cobertura[porReprogramar.item.id]?.asignados ?? 0}
              onCerrar={() => setPorReprogramar(null)}
              onHecho={async texto => {
                setPorReprogramar(null)
                setAviso({ texto })
                await recargarItems()
              }} />
          )}

          {/* Aviso con Deshacer */}
          <AnimatePresence>
            {aviso && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-2xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{aviso.texto}</span>
                {aviso.deshacer && (
                  <button onClick={aviso.deshacer}
                    className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                    <Undo2 size={11} /> Deshacer
                  </button>
                )}
                <button onClick={() => setAviso(null)} aria-label="Cerrar aviso" style={{ color: 'var(--text-faint)' }}>
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2 rounded-xl text-sm shadow-xl"
              style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              <AlertCircle size={13} /> {error}
              <button onClick={() => setError('')} className="ml-2"><X size={12} /></button>
            </div>
          )}
        </div>
        </CoberturaCtx.Provider>
      </DndContext>
    )
  }

  // ── LISTA DE PLANES ─────────────────────────────────────────────────────
  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, year: form.year, profile_id: form.profile_id || null }),
    })
    if (res.ok) {
      const plan = await res.json()
      setPlans(prev => [plan, ...prev])
      setShowCreate(false)
      openEditor(plan)
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Error al crear')
    }
    setSaving(false)
  }

  const deletePlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan anual y todos sus items?')) return
    setDeleting(id)
    const res = await fetch('/api/plans', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    if (res.ok) setPlans(prev => prev.filter(p => p.id !== id))
    else setError('No se pudo eliminar el plan')
    setDeleting(null)
  }

  const currentYear = new Date().getFullYear()
  const plansByYear: Record<number, Plan[]> = {}
  for (const p of plans) {
    if (!plansByYear[p.year]) plansByYear[p.year] = []
    plansByYear[p.year].push(p)
  }
  const years = Object.keys(plansByYear).map(Number).sort((a, b) => b - a)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {asistente}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Plan Anual de Capacitaciones
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Arrastra los temas de la Biblioteca al calendario para programarlos.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button onClick={() => setAsignarMes(new Date().getMonth() + 1)}
              className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
              <Plus size={15} /> Asignar capacitación
            </button>
            <button onClick={() => {
              setForm({ name: `Plan SST ${currentYear}`, year: currentYear, profile_id: '' })
              setShowCreate(true)
            }} className="terra-btn-outline" style={{ padding: '10px 18px', fontSize: 13 }}>
              <Plus size={15} /> Nuevo plan
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : plans.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
            style={{ background: 'var(--primary-dim)' }}>
            <Calendar size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin planes creados</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Crea el primer plan anual y empieza a programar capacitaciones
          </p>
          <button onClick={() => {
            setForm({ name: `Plan SST ${currentYear}`, year: currentYear, profile_id: '' })
            setShowCreate(true)
          }} className="terra-btn mx-auto">
            <Plus size={14} /> Crear plan {currentYear}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {years.map(year => (
            <div key={year}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                  {year}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="grid gap-2">
                {plansByYear[year].map((plan, i) => {
                  const profile = profiles.find(p => p.id === plan.profile_id)
                  return (
                    <motion.div key={plan.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openEditor(plan)}
                      className="terra-card p-4 cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.2)' }}>
                          <Calendar size={16} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{plan.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                              style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                              {plan.status}
                            </span>
                          </div>
                          <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-faint)' }}>
                            <span className="flex items-center gap-1">
                              <BookOpen size={9} /> {plan.item_count} capacitaciones
                            </span>
                            {profile && (
                              <span className="flex items-center gap-1">
                                <GraduationCap size={9} /> {profile.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => deletePlan(plan.id)} disabled={deleting === plan.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ color: 'var(--text-faint)' }}>
                            {deleting === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                        <ArrowRight size={14} style={{ color: 'var(--text-faint)' }} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crear plan */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-md pointer-events-auto rounded-2xl p-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Nuevo plan anual</h2>
                  <button onClick={() => setShowCreate(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
                    <X size={15} />
                  </button>
                </div>
                <form onSubmit={createPlan} className="space-y-4">
                  <div>
                    <label className="field-label">Nombre del plan *</label>
                    <input type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="ej. Plan SST 2026" className="terra-input" autoFocus />
                  </div>
                  <div>
                    <label className="field-label">Año *</label>
                    <input type="number" value={form.year} min={2020} max={2040}
                      onChange={e => setForm({ ...form, year: Number(e.target.value) })} className="terra-input" />
                  </div>
                  <div>
                    <label className="field-label">
                      Perfil de formación <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <select value={form.profile_id}
                      onChange={e => setForm({ ...form, profile_id: e.target.value })} className="terra-input">
                      <option value="">Sin perfil — toda la Biblioteca</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
                      El perfil solo filtra los temas del panel; siempre puedes cambiarlo o ver la Biblioteca completa.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="terra-btn-outline flex-1">Cancelar</button>
                    <button type="submit" disabled={saving || !form.name.trim()} className="terra-btn flex-1">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : 'Crear y programar →'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
