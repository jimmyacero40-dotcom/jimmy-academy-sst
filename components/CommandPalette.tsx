'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, BookOpen, Clock, CheckCircle, AlertCircle, Archive, ChevronRight, Layers, Zap } from 'lucide-react'

interface Training {
  id: number
  title: string
  category: string
  description?: string
  status: string
  slides_count?: number
  questions_count?: number
  valid_until?: string
  duration?: string
  risk_type?: string
  cover_url?: string
}

const STATUS_META: Record<string, { label: string; color: string; Icon: any }> = {
  activo:     { label: 'Vigente',    color: '#60A5FA', Icon: Clock },
  completado: { label: 'Completado', color: '#10B981', Icon: CheckCircle },
  vencido:    { label: 'Vencido',    color: '#F87171', Icon: AlertCircle },
  archivado:  { label: 'Archivado',  color: '#94A3B8', Icon: Archive },
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(245,158,11,0.25)', color: '#FCD34D', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function scoreMatch(t: Training, q: string): number {
  if (!q) return 0
  const ql = q.toLowerCase()
  if (t.title.toLowerCase().startsWith(ql)) return 3
  if (t.title.toLowerCase().includes(ql)) return 2
  if ((t.category || '').toLowerCase().includes(ql)) return 1
  if ((t.description || '').toLowerCase().includes(ql)) return 0.5
  return -1
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Fetch on first open
  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(0)
    setTimeout(() => inputRef.current?.focus(), 50)
    if (trainings.length > 0) return
    setLoading(true)
    fetch('/api/trainings')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTrainings(data) })
      .finally(() => setLoading(false))
  }, [open])

  // Filtered + scored results
  const now = new Date().toISOString().split('T')[0]
  const results = (() => {
    if (!query.trim()) {
      // Show recent active courses when no query
      return trainings.filter(t => t.status !== 'archivado').slice(0, 8)
    }
    return trainings
      .map(t => ({ t, score: scoreMatch(t, query) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(({ t }) => t)
      .slice(0, 10)
  })()

  useEffect(() => { setSelected(0) }, [query])

  // Keyboard navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) {
      navigateTo(results[selected])
    }
  }, [open, results, selected])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const navigateTo = (t: Training) => {
    onClose()
    router.push(`/dashboard/trainings?highlight=${t.id}`)
  }

  const getStatus = (t: Training) => {
    if (t.status === 'archivado') return 'archivado'
    if (t.valid_until && t.valid_until < now) return 'vencido'
    return t.status || 'activo'
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[12vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>

      <div
        className="w-full max-w-xl mx-4 overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          {loading
            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ color: 'var(--amber)' }} />
            : <Search size={16} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar cursos..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text)', caretColor: 'var(--amber)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--text-faint)' }}>
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 380 }}>
          {!loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <BookOpen size={32} style={{ color: 'var(--text-faint)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                Sin resultados para &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {!query.trim() && results.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                Cursos recientes
              </span>
            </div>
          )}

          {results.map((t, i) => {
            const status = getStatus(t)
            const meta = STATUS_META[status] || STATUS_META.activo
            const StatusIcon = meta.Icon
            const isSelected = i === selected
            return (
              <button
                key={t.id}
                data-idx={i}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{
                  background: isSelected ? 'rgba(245,158,11,0.07)' : 'transparent',
                  borderLeft: isSelected ? '2px solid var(--amber)' : '2px solid transparent',
                }}
                onMouseEnter={() => setSelected(i)}
                onClick={() => navigateTo(t)}>

                {/* Icon */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <BookOpen size={15} style={{ color: 'var(--amber)' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {highlightMatch(t.title, query)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {t.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#6EE7B7' }}>
                        {highlightMatch(t.category, query)}
                      </span>
                    )}
                    {t.slides_count ? (
                      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {t.slides_count} diapositivas
                      </span>
                    ) : null}
                    {t.questions_count ? (
                      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        · {t.questions_count} preguntas
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <StatusIcon size={11} style={{ color: meta.color }} />
                  <span className="text-[10px] font-medium" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <ChevronRight size={12} style={{ color: 'var(--text-faint)', opacity: isSelected ? 1 : 0 }} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-faint)' }}>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>↵</kbd>
              abrir
            </span>
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
          </div>
        </div>
      </div>
    </div>
  )
}
