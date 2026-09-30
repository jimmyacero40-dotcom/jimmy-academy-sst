'use client'

import { PREGUNTAS, CAMPO_MEJORAS, GRUPO_DE_PELIGRO, GRUPOS_PELIGROS, type Participacion } from '@/lib/peligros'

const COLOR_GRUPO = Object.fromEntries(GRUPOS_PELIGROS.map(g => [g.grupo, g.color]))

/** Muestra una participación respondida, conservando el orden de la encuesta. */
export function RespuestasPeligros({ p }: { p: Participacion }) {
  return (
    <div className="space-y-4">
      {/* Identificación tomada al momento de participar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {([
          ['Trabajador', p.trabajador_nombre],
          ['Cédula', p.trabajador_cedula],
          ['Empresa', p.empresa],
          ['Cargo', p.cargo],
          ['Área', p.area],
          ['Finca / centro de trabajo', p.centro_trabajo],
          ['Fecha de participación', p.enviado_at ? new Date(p.enviado_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : null],
          ['Periodo', p.periodo ? String(p.periodo) : null],
        ] as [string, string | null | undefined][]).map(([k, v]) => (
          <div key={k}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k}</p>
            <p className="text-xs font-semibold" style={{ color: v ? 'var(--text)' : 'var(--text-faint)' }}>{v || '—'}</p>
          </div>
        ))}
      </div>

      {PREGUNTAS.map(q => {
        const valor = p[q.campo]
        return (
          <div key={q.n} className="p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                style={{ background: 'var(--primary)', color: '#fff' }}>{q.n}</span>
              <p className="text-xs font-bold leading-snug" style={{ color: 'var(--text)' }}>{q.titulo}</p>
            </div>

            {q.tipo === 'peligros' ? (
              <div className="pl-8.5 space-y-2" style={{ paddingLeft: 34 }}>
                {(p.peligros ?? []).length === 0
                  ? <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Sin respuesta</p>
                  : (
                    <div className="flex flex-wrap gap-1.5">
                      {(p.peligros ?? []).map(x => {
                        const color = COLOR_GRUPO[GRUPO_DE_PELIGRO[x]] ?? 'var(--primary)'
                        return (
                          <span key={x} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: `${color}1F`, color, border: `1px solid ${color}55` }}>{x}</span>
                        )
                      })}
                    </div>
                  )}
                {p.peligros_otro && (
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    <span className="font-bold" style={{ color: 'var(--text-dim)' }}>Otro: </span>{p.peligros_otro}
                  </p>
                )}
              </div>
            ) : q.tipo === 'confirmacion' ? (
              <p className="text-sm font-bold" style={{ paddingLeft: 34, color: p.confirma_participacion ? '#10B981' : '#EF4444' }}>
                {p.confirma_participacion ? 'Confirmó su participación' : 'No confirmó'}
              </p>
            ) : (
              <p className="text-sm whitespace-pre-wrap" style={{ paddingLeft: 34, color: valor ? 'var(--text)' : 'var(--text-faint)' }}>
                {(valor as string) || 'Sin respuesta'}
              </p>
            )}

            {q.campo === 'controles_suficientes' && (
              <div style={{ paddingLeft: 34 }} className="mt-2.5 pt-2.5" >
                <p className="text-[11px] font-bold" style={{ color: 'var(--text-dim)' }}>{CAMPO_MEJORAS.titulo}</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: p.oportunidades_mejora ? 'var(--text)' : 'var(--text-faint)' }}>
                  {p.oportunidades_mejora || 'Sin respuesta'}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
