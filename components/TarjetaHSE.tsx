'use client'

import { Lock } from 'lucide-react'
import { TIPOS_REPORTE, type ReporteHSE } from '@/lib/reportes-hse'

const COLOR = Object.fromEntries(TIPOS_REPORTE.map(t => [t.id, t.color]))
const ICONO = Object.fromEntries(TIPOS_REPORTE.map(t => [t.id, t.icono]))

const fecha = (s?: string | null) =>
  s ? new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

function Dato({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k}</p>
      <p className="text-sm font-semibold" style={{ color: v ? 'var(--text)' : 'var(--text-faint)' }}>{v || '—'}</p>
    </div>
  )
}

function Bloque({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-2.5 mb-2">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
          style={{ background: 'var(--primary)', color: '#fff' }}>{n}</span>
        <p className="text-xs font-bold leading-snug pt-1" style={{ color: 'var(--text)' }}>{titulo}</p>
      </div>
      <div style={{ paddingLeft: 34 }}>{children}</div>
    </div>
  )
}

const Texto = ({ v }: { v?: string | null }) => (
  <p className="text-sm whitespace-pre-wrap" style={{ color: v ? 'var(--text)' : 'var(--text-faint)' }}>
    {v || 'Sin diligenciar'}
  </p>
)

/**
 * La tarjeta tal como la diligenció el trabajador, en el orden del formato
 * AVC-FR54. Es de solo lectura: lo que agregue SST se muestra aparte.
 */
export function TarjetaHSE({ r }: { r: ReporteHSE }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Dato k="N.º del reporte" v={r.codigo} />
        <Dato k="Fecha del reporte" v={fecha(r.fecha_reporte)} />
        <Dato k="Lugar" v={r.lugar} />
        <Dato k="Quien reporta" v={r.reporta_nombre} />
        <Dato k="Cédula" v={r.reporta_cedula} />
        <Dato k="Cargo" v={r.cargo} />
        <Dato k="Área" v={r.area} />
        <Dato k="Finca / centro de trabajo" v={r.centro_trabajo} />
        <Dato k="Enviado" v={r.enviado_at ? new Date(r.enviado_at).toLocaleString('es-CO') : null} />
      </div>

      <Bloque n="1" titulo="Tipo de reporte">
        {(r.tipos ?? []).length ? (
          <div className="flex flex-wrap gap-1.5">
            {(r.tipos ?? []).map(t => (
              <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: `${COLOR[t] ?? '#64748B'}1F`, color: COLOR[t] ?? '#64748B', border: `1px solid ${COLOR[t] ?? '#64748B'}55` }}>
                {ICONO[t] ?? ''} {t}
              </span>
            ))}
          </div>
        ) : <Texto v={null} />}
      </Bloque>

      <Bloque n="2" titulo="¿Qué sucedió? Indique claramente lo que desea reportar">
        <Texto v={r.descripcion} />
      </Bloque>

      <Bloque n="3" titulo="Acción inmediata">
        {(r.acciones_inmediatas ?? []).length ? (
          <ul className="space-y-0.5">
            {(r.acciones_inmediatas ?? []).map(a => (
              <li key={a} className="text-sm" style={{ color: 'var(--text)' }}>· {a}</li>
            ))}
          </ul>
        ) : <Texto v={null} />}
        <p className="text-[10px] font-bold uppercase tracking-wider mt-2.5" style={{ color: 'var(--text-faint)' }}>
          ¿Otra acción o sugerencia?
        </p>
        <Texto v={r.otra_accion} />
      </Bloque>

      <Bloque n="4" titulo="Sugerencia de mejora o intervención">
        <Texto v={r.sugerencia_mejora} />
      </Bloque>

      <div className="p-3.5 rounded-xl" style={{ background: 'rgba(148,163,184,0.08)', border: '1px dashed var(--border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
          <Lock size={10} /> 5. Seguimiento — lo diligencia Seguridad y Salud en el Trabajo
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>
          Nombre y firma de quien recibe la solicitud y n.º de seguimiento en la Matriz de Mejoras.
        </p>
      </div>
    </div>
  )
}
