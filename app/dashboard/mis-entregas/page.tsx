'use client'

/**
 * Lo que la empresa me entregó.
 *
 * Es la otra mitad de la trazabilidad: en la consola queda escrito que se
 * entregó, y aquí el trabajador dice que lo recibió. En el formato de papel
 * eso era la firma en el recuadro.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HardHat, Loader2, Check, CheckCircle, Clock, ShieldCheck } from 'lucide-react'

interface Entrega {
  id: string
  elemento: string
  unidad: string
  cantidad: number
  referencia: string | null
  entregado_at: string
  entregado_por_nombre: string | null
  observacion: string | null
  confirmado_at: string | null
}

const COMPROMISO =
  'Declaro que la empresa me entregó los elementos relacionados, que recibí instrucción sobre su '
  + 'uso, mantenimiento y reposición, y me comprometo a usarlos correctamente durante mis labores '
  + 'y a reportar cualquier daño o pérdida.'

function cuando(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MisEntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [cargando, setCargando] = useState(true)
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await fetch('/api/mis-entregas')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo cargar')
      setEntregas(d)
      // Lo que falta por confirmar viene marcado: es lo que la persona vino a
      // hacer, y confirmar de a una cuando le dieron tres cosas es un castigo.
      setMarcadas(new Set(d.filter((e: Entrega) => !e.confirmado_at).map((e: Entrega) => e.id)))
    } catch (e: any) {
      setError(e.message)
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const pendientes = useMemo(() => entregas.filter(e => !e.confirmado_at), [entregas])
  const confirmadas = useMemo(() => entregas.filter(e => e.confirmado_at), [entregas])

  async function confirmar() {
    setConfirmando(true); setError(null)
    try {
      const r = await fetch('/api/mis-entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...marcadas] }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo confirmar')
      await cargar()
    } catch (e: any) {
      setError(e.message)
    }
    setConfirmando(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(36,60,44,0.10)', border: '1px solid rgba(36,60,44,0.25)' }}>
          <HardHat size={18} style={{ color: '#243C2C' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            Mis entregas
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Lo que la empresa te ha entregado. Confirma lo que ya recibiste.
          </p>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : entregas.length === 0 ? (
        <div className="terra-card p-12 text-center">
          <HardHat size={30} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>Todavía no te han entregado nada</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Cuando recibas un elemento, aparecerá aquí para que lo confirmes.
          </p>
        </div>
      ) : (
        <>
          {pendientes.length > 0 && (
            <div className="terra-card overflow-hidden" style={{ borderLeft: '3px solid #F59E0B' }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.07)', borderBottom: '1px solid var(--border)' }}>
                <Clock size={14} style={{ color: '#F59E0B' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {pendientes.length === 1
                    ? 'Tienes 1 entrega por confirmar'
                    : `Tienes ${pendientes.length} entregas por confirmar`}
                </p>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {pendientes.map(e => {
                  const act = marcadas.has(e.id)
                  return (
                    <button key={e.id} type="button"
                      onClick={() => setMarcadas(prev => {
                        const s = new Set(prev); s.has(e.id) ? s.delete(e.id) : s.add(e.id); return s
                      })}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left">
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          border: `1px solid ${act ? '#10B981' : 'var(--border-strong)'}`,
                          background: act ? '#10B981' : 'transparent',
                        }}>
                        {act && <Check size={13} color="#fff" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                          {e.cantidad} {e.unidad} · {e.elemento}
                        </p>
                        {e.referencia && (
                          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{e.referencia}</p>
                        )}
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                          {cuando(e.entregado_at)}
                          {e.entregado_por_nombre ? ` · te lo entregó ${e.entregado_por_nombre}` : ''}
                        </p>
                        {e.observacion && (
                          <p className="text-[11px] mt-0.5 italic" style={{ color: 'var(--text-faint)' }}>
                            {e.observacion}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="px-4 py-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-[11px] leading-relaxed flex items-start gap-1.5"
                  style={{ color: 'var(--text-dim)' }}>
                  <ShieldCheck size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#243C2C' }} />
                  {COMPROMISO}
                </p>
                {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
                <button onClick={confirmar} disabled={confirmando || marcadas.size === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: '#243C2C', color: '#fff' }}>
                  {confirmando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Confirmo que recibí {marcadas.size === 1 ? 'esta entrega' : `estas ${marcadas.size}`}
                </button>
              </div>
            </div>
          )}

          {confirmadas.length > 0 && (
            <div className="terra-card overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <CheckCircle size={14} style={{ color: '#10B981' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Ya confirmadas</p>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {confirmadas.map(e => (
                  <div key={e.id} className="px-4 py-3 flex items-start gap-3">
                    <CheckCircle size={15} style={{ color: '#10B981' }} className="flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {e.cantidad} {e.unidad} · {e.elemento}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        Entregado el {cuando(e.entregado_at)} · confirmado el {cuando(e.confirmado_at!)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
