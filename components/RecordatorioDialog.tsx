'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mail, MailWarning, Loader2, Check, X, Send, CheckCircle, AlertTriangle, Pencil, RotateCcw } from 'lucide-react'

export interface Candidato {
  user_id: string
  nombre: string
  detalle?: string | null     // cargo, área, qué le falta… lo que ayude a reconocerlo
}

interface Ultimo { enviado: boolean; created_at: string; enviado_por_nombre: string | null }

function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

/**
 * «Avísele a los que faltan».
 *
 * Se usa igual desde cualquier módulo: se le pasa la clave del módulo y la
 * lista de quienes están pendientes. El recuadro se encarga de saber a quién
 * se le puede escribir, a quién ya se le escribió y de contar cómo salió.
 */
export default function RecordatorioDialog({
  modulo, titulo, candidatos, periodo, plazo, onCerrar,
}: {
  modulo: string
  titulo: string
  candidatos: Candidato[]
  periodo?: number
  /** Hasta cuándo tienen plazo, ya en texto legible. Va dentro del correo. */
  plazo?: string | null
  onCerrar: () => void
}) {
  const [correos, setCorreos] = useState<Record<string, boolean>>({})
  const [ultimos, setUltimos] = useState<Record<string, Ultimo>>({})
  const [cargando, setCargando] = useState(true)
  const [elegidos, setElegidos] = useState<Set<string>>(new Set())
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // El texto del correo, editable. Llega el que rige —el de la empresa si ya
  // lo escribió, si no el de fábrica— y desde aquí se cambia.
  const [asunto, setAsunto] = useState('')
  const [frase, setFrase] = useState('')
  const [boton, setBoton] = useState('')
  const [original, setOriginal] = useState({ asunto: '', frase: '', boton: '' })
  const [editando, setEditando] = useState(false)
  const [guardarTexto, setGuardarTexto] = useState(false)
  const cambiado = asunto !== original.asunto || frase !== original.frase || boton !== original.boton

  useEffect(() => {
    const url = `/api/recordatorios?modulo=${encodeURIComponent(modulo)}${periodo ? `&periodo=${periodo}` : ''}`
    fetch(url)
      .then(r => (r.ok ? r.json() : { ultimos: {}, correos: {} }))
      .then(d => {
        setCorreos(d.correos ?? {})
        setUltimos(d.ultimos ?? {})
        const t = d.texto ?? { asunto: '', frase: '', boton: '' }
        setAsunto(t.asunto ?? ''); setFrase(t.frase ?? ''); setBoton(t.boton ?? '')
        setOriginal({ asunto: t.asunto ?? '', frase: t.frase ?? '', boton: t.boton ?? '' })
        // Vienen marcados los que tienen correo: es lo que uno quiere hacer.
        setElegidos(new Set(candidatos.filter(c => d.correos?.[c.user_id]).map(c => c.user_id)))
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [modulo, periodo, candidatos])

  const conCorreo = useMemo(() => candidatos.filter(c => correos[c.user_id]), [candidatos, correos])
  const sinCorreo = useMemo(() => candidatos.filter(c => !correos[c.user_id]), [candidatos, correos])

  function alternar(id: string) {
    setElegidos(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  async function enviar() {
    setEnviando(true); setError(null)
    try {
      const res = await fetch('/api/recordatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo, periodo, plazo,
          user_ids: [...elegidos],
          mensaje: nota.trim() || null,
          asunto, frase, boton,
          guardar_plantilla: guardarTexto && cambiado,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'No se pudo enviar')
      setResultado(d)
    } catch (e: any) {
      setError(e.message)
    }
    setEnviando(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Encabezado */}
        <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(36,60,44,0.10)', border: '1px solid rgba(36,60,44,0.25)' }}>
            <Mail size={16} style={{ color: '#243C2C' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-strong)' }}>Avisar a quienes faltan</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{titulo}</p>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg" style={{ color: 'var(--text-faint)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {resultado ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#10B981' }}>
                <CheckCircle size={16} /> Se enviaron {resultado.enviados} de {resultado.resultados.length}
              </div>
              {resultado.fallidos > 0 && (
                <div className="rounded-xl p-3 space-y-1.5"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
                    <AlertTriangle size={12} /> No salieron {resultado.fallidos}
                  </p>
                  {resultado.resultados.filter((r: any) => !r.enviado).map((r: any) => (
                    <p key={r.user_id} className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                      <strong>{r.nombre}</strong> — {r.motivo}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : cargando ? (
            <div className="flex items-center gap-2 text-sm py-6 justify-center" style={{ color: 'var(--text-faint)' }}>
              <Loader2 size={14} className="animate-spin" /> Cargando…
            </div>
          ) : (
            <>
              {candidatos.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: 'var(--text-faint)' }}>
                  No hay nadie pendiente. Nada que recordar.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-label)' }}>
                      {elegidos.size} de {conCorreo.length} seleccionados
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setElegidos(new Set(conCorreo.map(c => c.user_id)))}
                        className="text-[11px] font-semibold px-2 py-1 rounded-md"
                        style={{ color: 'var(--primary)' }}>Todos</button>
                      <button onClick={() => setElegidos(new Set())}
                        className="text-[11px] font-semibold px-2 py-1 rounded-md"
                        style={{ color: 'var(--text-faint)' }}>Ninguno</button>
                    </div>
                  </div>

                  {/* La lista lleva su propio tope de alto: con cincuenta
                      personas, lo de abajo —la nota y el mensaje— quedaba
                      fuera de la pantalla y nadie lo encontraba. */}
                  <div className="rounded-xl divide-y overflow-y-auto"
                    style={{ border: '1px solid var(--border)', borderColor: 'var(--border)', maxHeight: 260 }}>
                    {conCorreo.map(c => {
                      const act = elegidos.has(c.user_id)
                      const u = ultimos[c.user_id]
                      return (
                        <button key={c.user_id} onClick={() => alternar(c.user_id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                          style={{ borderColor: 'var(--border)' }}>
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              border: `1px solid ${act ? '#10B981' : 'var(--border-strong)'}`,
                              background: act ? '#10B981' : 'transparent',
                            }}>
                            {act && <Check size={11} color="#fff" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{c.nombre}</p>
                            {c.detalle && (
                              <p className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>{c.detalle}</p>
                            )}
                          </div>
                          {u && (
                            <span className="text-[10px] flex-shrink-0 px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--bg)', color: 'var(--text-faint)' }}
                              title={`Último aviso: ${new Date(u.created_at).toLocaleString('es-CO')}`}>
                              avisado {haceCuanto(u.created_at)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {sinCorreo.length > 0 && (
                    <div className="rounded-xl p-3"
                      style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)' }}>
                      <p className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: '#B45309' }}>
                        <MailWarning size={12} /> {sinCorreo.length} sin correo registrado
                      </p>
                      <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-dim)' }}>
                        A estas personas hay que avisarles de otra forma, o registrarles el correo en su ficha:
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        {sinCorreo.map(c => c.nombre).join(' · ')}
                      </p>
                    </div>
                  )}

                  {/* El texto del correo. Se muestra plegado para no estorbar
                      cuando solo se quiere mandar el de siempre. */}
                  <div className="rounded-xl" style={{ border: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => setEditando(v => !v)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                      <Pencil size={12} style={{ color: 'var(--text-faint)' }} />
                      <span className="text-xs font-semibold flex-1" style={{ color: 'var(--text-label)' }}>
                        Mensaje del correo
                      </span>
                      <span className="text-[11px]" style={{ color: cambiado ? '#10B981' : 'var(--text-faint)' }}>
                        {cambiado ? 'modificado' : (editando ? 'ocultar' : 'ver y editar')}
                      </span>
                    </button>

                    {editando && (
                      <div className="px-3 pb-3 space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="pt-2.5">
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-faint)' }}>
                            Asunto
                          </label>
                          <input value={asunto} onChange={e => setAsunto(e.target.value)} maxLength={160}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-faint)' }}>
                            Cuerpo del mensaje
                          </label>
                          <textarea value={frase} onChange={e => setFrase(e.target.value)} rows={5} maxLength={2000}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                          <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                            Escriba <code>{'{nombre}'}</code> donde quiera que aparezca el nombre de la persona.
                            Si no lo escribe, el correo empieza saludándola igual.
                          </p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-faint)' }}>
                            Texto del botón
                          </label>
                          <input value={boton} onChange={e => setBoton(e.target.value)} maxLength={40}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <label className="flex items-center gap-2 text-[11px] cursor-pointer"
                            style={{ color: 'var(--text-dim)' }}>
                            <input type="checkbox" checked={guardarTexto} disabled={!cambiado}
                              onChange={e => setGuardarTexto(e.target.checked)} />
                            Dejarlo guardado para la próxima vez
                          </label>
                          {cambiado && (
                            <button type="button"
                              onClick={() => { setAsunto(original.asunto); setFrase(original.frase); setBoton(original.boton); setGuardarTexto(false) }}
                              className="flex items-center gap-1 text-[11px] font-semibold"
                              style={{ color: 'var(--text-faint)' }}>
                              <RotateCcw size={10} /> Deshacer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>
                      Nota para agregar al correo (opcional)
                    </label>
                    <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} maxLength={600}
                      placeholder="Ej.: lo necesitamos antes del comité del viernes."
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                  </div>

                  {plazo && (
                    <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      El correo les dirá que tienen plazo hasta el <strong>{plazo}</strong>.
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
        </div>

        {/* Pie */}
        <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onCerrar}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
            {resultado ? 'Cerrar' : 'Cancelar'}
          </button>
          {!resultado && (
            <button onClick={enviar} disabled={enviando || elegidos.size === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
              style={{ background: '#243C2C', color: '#fff' }}>
              {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar a {elegidos.size}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
