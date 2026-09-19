'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { UserX, Search, RefreshCw, RotateCcw, Calendar, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface RetiredUser {
  id: string
  name: string
  email: string
  cedula: string
  role: string
  area: string | null
  cargo: string | null
  area_id: string | null
  active: boolean
  retired_at: string
  created_at: string
  user_groups: { groups: { id: string; name: string; color?: string } }[]
}

const AVATAR_COLORS = ['#06B6D4','#0891B2','#6BA644','#10B981','#F59E0B','#8595AD']
function avatarColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function RetiradosPage() {
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === 'superadmin'

  const [workers, setWorkers] = useState<RetiredUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reactivating, setReactivating] = useState<string | null>(null)
  const [deletingPermanent, setDeletingPermanent] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [confirm, setConfirm] = useState<RetiredUser | null>(null)
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<RetiredUser | null>(null)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/users/retired')
    if (res.ok) setWorkers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function reactivate(worker: RetiredUser) {
    setReactivating(worker.id)
    const res = await fetch(`/api/users/${worker.id}/retire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reactivate' }),
    })
    if (res.ok) {
      showToast(`✓ ${worker.name} reactivado — vuelve a la lista de Personas`, 'ok')
      setWorkers(prev => prev.filter(w => w.id !== worker.id))
    } else {
      showToast((await res.json()).error || 'Error al reactivar', 'err')
    }
    setReactivating(null)
    setConfirm(null)
  }

  async function deletePermanent(worker: RetiredUser) {
    setDeletingPermanent(true)
    const res = await fetch(`/api/users/${worker.id}/delete-permanent`, { method: 'DELETE' })
    if (res.ok) {
      showToast(`${worker.name} eliminado permanentemente`, 'ok')
      setWorkers(prev => prev.filter(w => w.id !== worker.id))
    } else {
      showToast((await res.json()).error || 'Error al eliminar', 'err')
    }
    setDeletingPermanent(false)
    setPermanentDeleteConfirm(null)
  }

  const filtered = workers.filter(w => {
    if (!search) return true
    const q = search.toLowerCase()
    return w.name.toLowerCase().includes(q) || w.cedula.includes(q) || (w.cargo || '').toLowerCase().includes(q)
  })

  return (
    <div className="p-6 w-full space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'ok' ? '#10B981' : '#EF4444', color: '#fff', maxWidth: 360 }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm reactivate modal */}
      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-strong)' }}>¿Reactivar trabajador?</h3>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              <strong>{confirm.name}</strong> volverá a aparecer en la lista de Personas activas y estará disponible en porterías.
              Su historial se conserva completo.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                Cancelar
              </button>
              <button onClick={() => reactivate(confirm)} disabled={reactivating === confirm.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
                style={{ background: '#10B981', color: '#fff' }}>
                {reactivating === confirm.id ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Reactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent delete confirmation modal */}
      {permanentDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '2px solid #EF4444' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={20} color="#EF4444" />
              </div>
              <h3 className="text-base font-bold" style={{ color: '#EF4444' }}>⚠️ Retirar Definitivamente</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Vas a borrar los datos personales de{' '}
              <strong style={{ color: 'var(--text)' }}>{permanentDeleteConfirm.name}</strong>.
              Esta acción es <strong>irreversible</strong>.
            </p>
            <ul className="text-xs space-y-1 pl-4" style={{ color: 'var(--text-dim)', listStyle: 'disc' }}>
              <li>Se eliminan nombre, correo, cédula, perfil y foto; no podrá volver a ingresar ni reactivarse</li>
              <li>Desaparece de este repositorio</li>
              <li>Certificados, firmas, consentimientos y movimientos de portería se conservan como registro anónimo, porque son evidencia del SG-SST</li>
            </ul>
            <p className="text-xs font-bold" style={{ color: '#EF4444' }}>
              Esta acción solo puede ejecutarla un superadministrador.
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setPermanentDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                Cancelar
              </button>
              <button onClick={() => deletePermanent(permanentDeleteConfirm)} disabled={deletingPermanent}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
                style={{ background: '#EF4444', color: '#fff' }}>
                {deletingPermanent ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/users"
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <ArrowLeft size={14} /> Personas
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>Repositorio de Retirados</h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Trabajadores que ya no pertenecen a la empresa · Historial conservado
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* KPI */}
      <div className="rounded-xl p-4 flex items-center gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <UserX size={28} style={{ color: 'var(--text-faint)' }} />
        <div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>{workers.length}</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-label)' }}>Trabajadores retirados en total</div>
        </div>
        <div className="ml-auto relative flex-1 max-w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula, cargo…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <UserX size={32} style={{ color: 'var(--text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              {workers.length === 0 ? 'No hay trabajadores retirados' : 'Sin resultados para la búsqueda'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="terra-table w-full">
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 110 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Trabajador</th>
                  <th className="px-4 py-3 text-left">Cédula</th>
                  <th className="px-4 py-3 text-left">Cargo</th>
                  <th className="px-4 py-3 text-left">Grupos</th>
                  <th className="px-4 py-3 text-left">Fecha ingreso</th>
                  <th className="px-4 py-3 text-left">Fecha retiro</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 opacity-60"
                          style={{ background: avatarColor(w.id) }}>
                          {initials(w.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-dim)' }}>{w.name}</div>
                          <div className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>{w.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>{w.cedula || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{w.cargo || w.role || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.user_groups.slice(0,2).map(ug => (
                          <span key={ug.groups.id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${ug.groups.color || '#8595AD'}18`, color: ug.groups.color || '#8595AD' }}>
                            {ug.groups.name}
                          </span>
                        ))}
                        {w.user_groups.length > 2 && (
                          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>+{w.user_groups.length - 2}</span>
                        )}
                        {w.user_groups.length === 0 && <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        {w.created_at ? fmtDate(w.created_at) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#EF4444' }}>
                        <Calendar size={11} /> {fmtDate(w.retired_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setConfirm(w)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
                          <RotateCcw size={12} /> Reactivar
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => setPermanentDeleteConfirm(w)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <Trash2 size={12} /> Retirar definitivamente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
