'use client'

/**
 * El panel de control.
 *
 * Antes solo hablaba de formación —matrículas, certificados, vencimientos— y
 * callaba sobre todo lo demás que la plataforma ya registra. Ahora responde,
 * en el orden en que lo preguntan en una reunión de gerencia:
 *
 *   ¿La gente está respondiendo lo que se le pidió?
 *   ¿Cómo va la formación y cuánto se evaluó de verdad?
 *   ¿Qué está reportando la gente?
 *   ¿Qué se entregó y quién lo confirmó?
 *
 * Más gráficos que listas, y cada cifra con su denominador: «22 de 59» se
 * puede defender, un «37 %» suelto no.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users, Loader2, AlertTriangle, ChevronRight, ClipboardList,
  GraduationCap, FileText, Package, MessageSquare, Award, CalendarDays,
} from 'lucide-react'
import { Bloque, Barras, BarraParticipacion, Columnas, Cifra, TINTA, pct } from '@/components/panel/Graficos'

interface Panel {
  trabajadores: number
  formacion: {
    asignadas: number; completadas: number; pendientes: number; vencidas: number
    vencenPronto: number; certificados: number
    evaluadas: number; aprobadas: number; promedio: number | null
    listas: number; asistencias: number
    personasConAlgo: number; personasAlDia: number
  }
  sociodemografica: { completas: number; empezadas: number; sinEmpezar: number }
  tuCuentas: {
    modulos: { id: string; nombre: string; estado: string; enviadas: number; empezadas: number }[]
    peligros: { enviadas: number; empezadas: number }
  }
  reportal: { total: number; porEstado: Record<string, number>; porTipo: Record<string, number> }
  entregas: { total: number; confirmadas: number; personas: number }
  meses: { mes: string; completadas: number }[]
  porArea: { area: string; total: number; hechas: number; pct: number }[]
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

/** Cómo se llama cada estado de un reporte, en palabras. */
const ESTADO_REPORTE: Record<string, string> = {
  nuevo: 'Sin abrir', enviado: 'Sin gestionar', recibido: 'Recibido',
  en_revision: 'En revisión', en_gestion: 'En gestión', asignado: 'Asignado',
  gestionado: 'Gestionado', cerrado: 'Cerrado', borrador: 'Borrador',
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userRole = (session?.user as any)?.role as string | undefined

  const [d, setD] = useState<Panel | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    // Mientras la sesión carga no se sabe el rol: sacar de aquí al
    // administrador antes de saber quién es ya pasó una vez.
    if (status === 'loading') return
    if (userRole === 'worker') { router.replace('/dashboard/my-profile'); return }
    try {
      const r = await fetch('/api/panel')
      const cuerpo = await r.json()
      if (!r.ok) throw new Error(cuerpo.error || 'No se pudo cargar el panel')
      setD(cuerpo)
    } catch (e: any) {
      setError(e.message)
    }
    setCargando(false)
  }, [status, userRole, router])

  useEffect(() => { cargar() }, [cargar])

  const hoy = new Date()
  const mesActual = `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={26} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Reuniendo los indicadores…</p>
    </div>
  )

  if (error || !d) return (
    <div className="p-6">
      <div className="terra-card p-6 flex items-start gap-3">
        <AlertTriangle size={18} style={{ color: '#EF4444' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>No se pudo cargar el panel</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{error}</p>
        </div>
      </div>
    </div>
  )

  const f = d.formacion
  const N = d.trabajadores

  const Ir = ({ href, texto }: { href: string; texto: string }) => (
    <Link href={href} className="text-[11px] font-bold flex items-center gap-0.5 flex-shrink-0"
      style={{ color: 'var(--primary)' }}>
      {texto} <ChevronRight size={12} />
    </Link>
  )

  return (
    <div className="p-4 sm:p-6 w-full space-y-5">

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Panel de Control
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {mesActual} · {N} trabajadores activos
            </p>
          </div>
          {f.vencenPronto > 0 && (
            <Link href="/dashboard/enrollments"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
              <AlertTriangle size={15} />
              {f.vencenPronto} {f.vencenPronto === 1 ? 'vence' : 'vencen'} en 30 días
            </Link>
          )}
        </div>
      </motion.div>

      {/* ── Las cuatro cifras que se preguntan primero ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Cifra valor={f.completadas} de={f.asignadas} color={TINTA.hecho}
          titulo="Capacitaciones completadas"
          pie={`${pct(f.completadas, f.asignadas)} % de lo asignado · ${f.personasAlDia} de ${N} personas con al menos una`} />
        <Cifra valor={d.sociodemografica.completas} de={N} color={TINTA.dato}
          titulo="Fichas sociodemográficas al 100 %"
          pie={`${d.sociodemografica.empezadas} empezadas · ${d.sociodemografica.sinEmpezar} sin abrir`} />
        <Cifra valor={d.reportal.total} color={TINTA.curso}
          titulo="Reportes en RePortal"
          pie={d.reportal.total ? 'Lo que la gente ha reportado' : 'Nadie ha reportado todavía'} />
        <Cifra valor={f.vencidas} color={f.vencidas ? TINTA.vencido : TINTA.hecho}
          titulo="Capacitaciones vencidas"
          pie={f.vencidas ? 'Pasaron de la fecha sin presentarse' : 'Ninguna se pasó de fecha'} />
      </div>

      {/* ── ¿Está respondiendo la gente? ── */}
      <Bloque titulo="¿Está respondiendo la gente?"
        pregunta={`De los ${N} trabajadores activos, cuántos han contestado cada cosa`}
        accion={<Ir href="/dashboard/worker-profiles" texto="Ver detalle" />}>
        <div className="space-y-4">
          <BarraParticipacion titulo="Información sociodemográfica" total={N}
            partes={[
              { etiqueta: 'completa', valor: d.sociodemografica.completas, color: TINTA.hecho },
              { etiqueta: 'empezada', valor: d.sociodemografica.empezadas, color: TINTA.curso },
            ]}
            nota="Completa es al 100 %. Cualquier otra cosa está empezada." />

          <BarraParticipacion titulo="Identificación de peligros" total={N}
            partes={[
              { etiqueta: 'enviada', valor: d.tuCuentas.peligros.enviadas, color: TINTA.hecho },
              { etiqueta: 'en borrador', valor: d.tuCuentas.peligros.empezadas, color: TINTA.curso },
            ]} />

          {d.tuCuentas.modulos.map(m => (
            <BarraParticipacion key={m.id} total={N}
              titulo={`${m.nombre}${m.estado !== 'abierto' ? ' · cerrado' : ''}`}
              partes={[
                { etiqueta: 'enviada', valor: m.enviadas, color: TINTA.hecho },
                { etiqueta: 'en borrador', valor: m.empezadas, color: TINTA.curso },
              ]} />
          ))}

          {d.tuCuentas.modulos.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              No hay módulos de Tú Cuentas creados todavía.
            </p>
          )}
        </div>
      </Bloque>

      {/* ── Formación ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Bloque titulo="Formación: qué se asignó y qué se cumplió"
          pregunta="Estado de todas las matrículas del plan"
          accion={<Ir href="/dashboard/enrollments" texto="Trazabilidad" />}>
          <div className="space-y-4">
            <BarraParticipacion titulo="Matrículas del plan" total={f.asignadas}
              partes={[
                { etiqueta: 'completadas', valor: f.completadas, color: TINTA.hecho },
                { etiqueta: 'pendientes', valor: f.pendientes, color: TINTA.curso },
                { etiqueta: 'vencidas', valor: f.vencidas, color: TINTA.vencido },
              ]} />

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { n: f.evaluadas, t: 'Evaluadas', p: `de ${f.completadas} completadas`, c: TINTA.dato, i: ClipboardList },
                { n: f.aprobadas, t: 'Aprobadas', p: f.evaluadas ? `${pct(f.aprobadas, f.evaluadas)} % de las evaluadas` : 'sin evaluar', c: TINTA.hecho, i: Award },
                { n: f.promedio ?? '—', t: 'Puntaje promedio', p: f.promedio !== null ? 'sobre 100' : 'sin notas', c: TINTA.curso, i: GraduationCap },
              ].map(x => (
                <div key={x.t} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-1.5">
                    <x.i size={12} style={{ color: x.c }} />
                    <span className="text-lg font-black tabular-nums leading-none" style={{ color: x.c }}>{x.n}</span>
                  </div>
                  <p className="text-[11px] font-bold mt-1" style={{ color: 'var(--text)' }}>{x.t}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{x.p}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
              style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <CalendarDays size={13} style={{ color: TINTA.dato }} className="flex-shrink-0" />
                <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  <strong style={{ color: 'var(--text)' }}>{f.listas}</strong> listas de asistencia firmadas,
                  con <strong style={{ color: 'var(--text)' }}>{f.asistencias}</strong> asistentes registrados
                </p>
              </div>
              <Ir href="/dashboard/attendance-lists" texto="Ver" />
            </div>
          </div>
        </Bloque>

        <Bloque titulo="Cuántas se completaron cada mes"
          pregunta="Últimos seis meses, por fecha en que se presentó">
          <Columnas datos={d.meses} />
          <p className="text-[11px] mt-4 pt-3" style={{ color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text)' }}>{f.certificados}</strong> certificados emitidos en total ·{' '}
            <strong style={{ color: 'var(--text)' }}>{f.personasConAlgo}</strong> de {N} personas tienen capacitaciones asignadas
          </p>
        </Bloque>
      </div>

      {/* ── Áreas, reportes y entregas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Bloque titulo="Cumplimiento por área"
          pregunta="Capacitaciones completadas sobre las asignadas en cada área">
          <Barras color={TINTA.hecho}
            filas={d.porArea.map(a => ({ nombre: a.area, valor: a.hechas, de: a.total }))} />
        </Bloque>

        <div className="space-y-5">
          <Bloque titulo="Qué está reportando la gente"
            pregunta={d.reportal.total ? 'Reportes de RePortal por estado de gestión' : 'Todavía no hay reportes'}
            accion={<Ir href="/dashboard/gestion-sst/reportal" texto="Ver reportes" />}>
            {d.reportal.total > 0 ? (
              <div className="space-y-4">
                <Barras color={TINTA.curso}
                  filas={Object.entries(d.reportal.porEstado)
                    .map(([e, n]) => ({ nombre: ESTADO_REPORTE[e] ?? e, valor: n }))
                    .sort((a, b) => b.valor - a.valor)}
                  unidad="" />
                {Object.keys(d.reportal.porTipo).length > 0 && (
                  <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="text-[11px] font-bold mb-2" style={{ color: 'var(--text)' }}>De qué se reporta</p>
                    <Barras color={TINTA.dato}
                      filas={Object.entries(d.reportal.porTipo)
                        .map(([t, n]) => ({ nombre: t, valor: n }))
                        .sort((a, b) => b.valor - a.valor)
                        .slice(0, 6)} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Cuando alguien reporte un acto o condición insegura, aparecerá aquí.
              </p>
            )}
          </Bloque>

          <Bloque titulo="Entregas de elementos"
            pregunta="Cuánto se entregó y cuánto confirmó el trabajador"
            accion={<Ir href="/dashboard/gestion-sst/entregas" texto="Ver entregas" />}>
            {d.entregas.total > 0 ? (
              <BarraParticipacion titulo="Entregas registradas" total={d.entregas.total}
                partes={[
                  { etiqueta: 'confirmadas por el trabajador', valor: d.entregas.confirmadas, color: TINTA.hecho },
                  { etiqueta: 'sin confirmar', valor: d.entregas.total - d.entregas.confirmadas, color: TINTA.curso },
                ]}
                nota={`${d.entregas.personas} ${d.entregas.personas === 1 ? 'persona ha recibido' : 'personas han recibido'} algo`} />
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                No hay entregas registradas en el histórico.
              </p>
            )}
          </Bloque>
        </div>
      </div>

      {/* ── A dónde ir ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        {[
          { t: 'Personas', h: '/dashboard/users', i: Users },
          { t: 'Plan anual', h: '/dashboard/plan', i: CalendarDays },
          { t: 'Biblioteca', h: '/dashboard/trainings', i: GraduationCap },
          { t: 'Sociodemográfica', h: '/dashboard/worker-profiles', i: ClipboardList },
          { t: 'Tú Cuentas', h: '/dashboard/gestion-sst/participacion', i: MessageSquare },
          { t: 'Reportes', h: '/dashboard/reports', i: FileText },
        ].map(a => (
          <Link key={a.t} href={a.h}
            className="terra-card px-3 py-2.5 flex items-center gap-2 text-[11px] font-bold"
            style={{ color: 'var(--text-dim)' }}>
            <a.i size={13} style={{ color: 'var(--primary)' }} />
            <span className="truncate">{a.t}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
