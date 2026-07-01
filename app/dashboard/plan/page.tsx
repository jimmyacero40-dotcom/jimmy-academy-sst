'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import {
  CalendarDays, Plus, Trash2, X, Loader2, AlertCircle,
  BookOpen, ChevronRight, Zap, CheckCircle, Edit2, Users, Layers, UserCheck,
  LayoutGrid, List, FileSpreadsheet, Upload
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  year: number
  status: 'draft' | 'active' | 'closed'
  item_count: number
  company_id: string
  created_at: string
}

interface PlanItem {
  id: string
  month: number
  periodicity: string
  required: boolean
  valid_days: number
  trainings: { id: number; title: string; duration: number | null }
  plan_item_targets: { target_type: string; target_id: string | null }[]
}

interface Training { id: number; title: string; duration: number | null }
interface Area     { id: string; name: string }
interface Group    { id: string; name: string }

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTH_COLORS = [
  '#3B82F6','#8B5CF6','#EC4899','#F59E0B',
  '#10B981','#06B6D4','#F97316','#EF4444',
  '#84CC16','#A855F7','#14B8A6','#6366F1',
]

const PERIODICITIES = [
  { value: 'once',           label: 'Una vez'           },
  { value: 'monthly',        label: 'Mensual'           },
  { value: 'bimestral',      label: 'Bimestral (c/2m)' },
  { value: 'trimestral',     label: 'Trimestral (c/3m)' },
  { value: 'cuatrimestral',  label: 'Cuatrimestral (c/4m)' },
  { value: 'semestral',      label: 'Semestral (c/6m)' },
  { value: 'anual',          label: 'Anual'             },
  { value: 'cada_dos_anos',  label: 'Cada 2 años'       },
]

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft:  { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8', label: 'Borrador' },
  active: { bg: 'rgba(16,185,129,0.12)',  color: '#34D399', label: 'Activo'   },
  closed: { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', label: 'Cerrado'  },
}

const EMPTY_PLAN = { name: '', year: new Date().getFullYear() }
const EMPTY_ITEM = { training_id: '', month: 1, periodicity: 'once', required: true, valid_days: 365, target_type: 'all', target_id: '' }

// Excel import parser for PLAN DE FORMACIÓN HSE format
// Handles merged cells, combined headers and P/E subcolumns
function parsePlanExcel(buffer: ArrayBuffer): { title: string; month: number; periodicity: string; population: string }[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]

  // ── STEP 1: Expand all merged cell ranges ──────────────────────────
  // XLSX only fills the top-left cell of a merge; we replicate that value
  // into every cell of the range so we can read them as normal cells.
  const merges: XLSX.Range[] = (ws['!merges'] as XLSX.Range[]) || []
  for (const merge of merges) {
    const topLeft = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })
    const srcCell = ws[topLeft]
    if (!srcCell) continue
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!ws[addr]) ws[addr] = { t: srcCell.t, v: srcCell.v, w: srcCell.w }
      }
    }
  }

  // ── STEP 2: Read as 2-D array ──────────────────────────────────────
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' }) as any[][]

  const MONTH_ABBR = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  const results: { title: string; month: number; periodicity: string; population: string }[] = []

  // ── STEP 3: Find the row that contains the 12 month names ──────────
  let monthHeaderRow = -1
  // monthColMap[0..11] = column index of the P (programado) sub-column for that month
  const monthColMap: Record<number, number> = {}

  for (let r = 0; r < Math.min(25, raw.length); r++) {
    const row = raw[r]
    const found: Record<number, number> = {} // monthIndex → first col seen
    row.forEach((cell: any, ci: number) => {
      const s = String(cell ?? '').toUpperCase().trim()
      const mi = MONTH_ABBR.indexOf(s)
      if (mi >= 0 && !(mi in found)) found[mi] = ci
    })
    if (Object.keys(found).length >= 6) {   // at least 6 months found
      monthHeaderRow = r
      Object.assign(monthColMap, found)
      break
    }
  }

  if (monthHeaderRow < 0) return results   // couldn't find month row → bail

  // ── STEP 4: Find the P/E sub-row (one or two rows below month row) ──
  // The sub-row has "P" and "E" labels. We want the "P" (Programado) column
  // for each month. If there is no P/E row, we use the month column itself.
  let pRowIndex = -1
  for (let r = monthHeaderRow + 1; r <= monthHeaderRow + 3 && r < raw.length; r++) {
    const row = raw[r]
    const peCount = row.filter((c: any) => {
      const s = String(c ?? '').toUpperCase().trim()
      return s === 'P' || s === 'E'
    }).length
    if (peCount >= 6) { pRowIndex = r; break }
  }

  if (pRowIndex >= 0) {
    // Re-map: for each month, find the "P" column at or after the month column
    const peRow = raw[pRowIndex]
    Object.entries(monthColMap).forEach(([miStr, startCol]) => {
      const mi = parseInt(miStr)
      // Search from startCol onward for the first "P"
      for (let c = startCol; c <= startCol + 3; c++) {
        const s = String(peRow[c] ?? '').toUpperCase().trim()
        if (s === 'P') { monthColMap[mi] = c; break }
      }
    })
  }

  // ── STEP 5: Find where actual data rows start ──────────────────────
  // Skip header/sub-header rows (anything before the first row that has
  // a title in column B with length > 3 and is not a known header keyword)
  const SKIP_KEYWORDS = ['ACTIVIDAD','CAPACITACIÓN','CAPACITACION','RECURSOS','RESPONSABLE','OBSERV','TOTAL','FUENTE','P','E']
  const dataStart = (() => {
    for (let r = monthHeaderRow + 1; r < raw.length; r++) {
      const col1 = String(raw[r][1] ?? '').trim()
      if (col1.length > 3 && !SKIP_KEYWORDS.some(k => col1.toUpperCase().startsWith(k))) return r
    }
    return monthHeaderRow + 2
  })()

  // ── STEP 6: Parse data rows ────────────────────────────────────────
  let currentPopulation = 'all'

  for (let r = dataStart; r < raw.length; r++) {
    const row = raw[r]
    const col0 = String(row[0] ?? '').trim()
    const col1 = String(row[1] ?? '').trim()

    // Update population whenever col 0 has content (now always set due to merge expansion)
    if (col0) {
      const up = col0.toUpperCase()
      if (up.includes('TODOS') || up.includes('COLABOR'))     currentPopulation = 'all'
      else if (up.includes('ADMINIST'))                        currentPopulation = 'ADMINISTRATIVO'
      else if (up.includes('MANTENIM'))                        currentPopulation = 'MANTENIMIENTO'
      else if (up.includes('CULTIVO'))                         currentPopulation = 'CULTIVO'
      else if (up.includes('OPERATIV'))                        currentPopulation = 'OPERATIVO'
      else if (col0.length > 3)                                currentPopulation = col0
    }

    // Skip rows without a valid title in col B
    if (!col1 || col1.length < 3) continue
    if (SKIP_KEYWORDS.some(k => col1.toUpperCase().startsWith(k))) continue

    const title = col1

    // Frequency — look in columns 2, 3, 4 for a frequency keyword
    let periodicity = 'once'
    for (let fc = 2; fc <= 5; fc++) {
      const f = String(row[fc] ?? '').toUpperCase().trim()
      if (!f || f.length < 4) continue
      if (f.includes('ANUAL'))      { periodicity = 'anual';        break }
      if (f.includes('SEMEST'))     { periodicity = 'semestral';    break }
      if (f.includes('TRIMEST'))    { periodicity = 'trimestral';   break }
      if (f.includes('BIMEST'))     { periodicity = 'bimestral';    break }
      if (f.includes('CUATRIM'))    { periodicity = 'cuatrimestral';break }
      if (f.includes('MENSUAL'))    { periodicity = 'monthly';      break }
    }

    // Check planned months: value in P column > 0 means this training is scheduled that month
    MONTH_ABBR.forEach((_m, mi) => {
      const colIdx = monthColMap[mi]
      if (colIdx === undefined) return
      const val = row[colIdx]
      const num = typeof val === 'number' ? val : parseFloat(String(val ?? '').replace(',', '.')) || 0
      if (num > 0) {
        results.push({ title, month: mi + 1, periodicity, population: currentPopulation })
      }
    })
  }

  return results
}

export default function PlanPage() {
  const [plans, setPlans]     = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [view, setView]       = useState<'list' | 'board'>('list')

  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planForm, setPlanForm]           = useState(EMPTY_PLAN)
  const [savingPlan, setSavingPlan]       = useState(false)

  const [activePlan, setActivePlan]     = useState<Plan | null>(null)
  const [items, setItems]               = useState<PlanItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [deletingItem, setDeletingItem] = useState<string | null>(null)
  const [activating, setActivating]     = useState(false)

  const [showItemForm, setShowItemForm] = useState(false)
  const [itemForm, setItemForm]         = useState(EMPTY_ITEM)
  const [savingItem, setSavingItem]     = useState(false)

  const [trainings, setTrainings] = useState<Training[]>([])
  const [areas, setAreas]         = useState<Area[]>([])
  const [groups, setGroups]       = useState<Group[]>([])

  const [importing, setImporting] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const loadPlans = async () => {
    setLoading(true)
    const res = await fetch('/api/plans')
    if (res.ok) setPlans(await res.json())
    else setError('No se pudieron cargar los planes')
    setLoading(false)
  }

  const loadItems = useCallback(async (planId: string) => {
    setLoadingItems(true)
    const res = await fetch(`/api/plans/${planId}/items`)
    if (res.ok) setItems(await res.json())
    setLoadingItems(false)
  }, [])

  useEffect(() => {
    loadPlans()
    Promise.all([
      fetch('/api/trainings').then(r => r.ok ? r.json() : []),
      fetch('/api/areas').then(r => r.ok ? r.json() : []),
      fetch('/api/groups').then(r => r.ok ? r.json() : []),
    ]).then(([t, a, g]) => { setTrainings(t); setAreas(a); setGroups(g) })
  }, [])

  useEffect(() => {
    if (activePlan) loadItems(activePlan.id)
  }, [activePlan, loadItems])

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planForm.name.trim()) return
    setSavingPlan(true)
    const res = await fetch('/api/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planForm),
    })
    if (res.ok) { await loadPlans(); setShowPlanModal(false); setPlanForm(EMPTY_PLAN) }
    else { const err = await res.json(); setError(err.error || 'Error al crear') }
    setSavingPlan(false)
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan? Solo se pueden eliminar planes en borrador.')) return
    const res = await fetch('/api/plans', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setPlans(prev => prev.filter(p => p.id !== id))
      if (activePlan?.id === id) setActivePlan(null)
    } else setError('No se pudo eliminar (solo borradores)')
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.training_id || !activePlan) return
    setSavingItem(true)
    const res = await fetch(`/api/plans/${activePlan.id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...itemForm,
        training_id: Number(itemForm.training_id),
        target_id: itemForm.target_type !== 'all' ? itemForm.target_id || null : null,
      }),
    })
    if (res.ok) {
      const newItem = await res.json()
      setItems(prev => [...prev, newItem].sort((a, b) => a.month - b.month))
      setPlans(prev => prev.map(p => p.id === activePlan.id ? { ...p, item_count: p.item_count + 1 } : p))
      setShowItemForm(false)
      setItemForm(EMPTY_ITEM)
    } else { const err = await res.json(); setError(err.error || 'Error al agregar') }
    setSavingItem(false)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!activePlan) return
    setDeletingItem(itemId)
    const res = await fetch(`/api/plans/${activePlan.id}/items`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_id: itemId }),
    })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== itemId))
      setPlans(prev => prev.map(p => p.id === activePlan.id ? { ...p, item_count: Math.max(0, p.item_count - 1) } : p))
    }
    setDeletingItem(null)
  }

  const handleActivate = async () => {
    if (!activePlan) return
    if (!confirm(`¿Activar "${activePlan.name}"? Se generarán las matrículas automáticamente.`)) return
    setActivating(true)
    const res = await fetch(`/api/plans/${activePlan.id}/activate`, { method: 'POST' })
    if (res.ok) {
      const result = await res.json()
      setPlans(prev => prev.map(p => p.id === activePlan.id ? { ...p, status: 'active' } : p))
      setActivePlan(prev => prev ? { ...prev, status: 'active' } : null)
      alert(`Plan activado. Se crearon ${result.enrollments_created} matrículas.`)
    } else { const err = await res.json(); setError(err.error || 'Error al activar') }
    setActivating(false)
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activePlan) return
    if (activePlan.status !== 'draft') { setError('Solo se puede importar en planes en borrador'); return }
    setImporting(true)
    try {
      const buf = await file.arrayBuffer()
      const rows = parsePlanExcel(buf)
      if (!rows.length) { setError('No se encontraron actividades en el archivo'); setImporting(false); return }

      // Build a local map title→id (existing + newly created)
      const titleMap: Record<string, number> = {}
      trainings.forEach(t => { titleMap[t.title.trim().toLowerCase()] = t.id })

      // Get unique titles from the Excel
      const uniqueTitles = [...new Set(rows.map(r => r.title.trim()))]

      let created = 0
      for (const title of uniqueTitles) {
        const key = title.toLowerCase()
        // Try to find existing training (fuzzy match)
        const existing = Object.entries(titleMap).find(([k]) =>
          k.includes(key.slice(0, 25)) || key.includes(k.slice(0, 25))
        )
        if (existing) {
          titleMap[key] = existing[1]
          continue
        }
        // Create new training from the Excel title
        const res = await fetch('/api/trainings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            category: 'SST',
            duration: '8h',
            description: `Capacitación SST: ${title}`,
            status: 'activo',
          }),
        })
        if (res.ok) {
          const t = await res.json()
          titleMap[key] = t.id
          created++
        }
      }

      // Refresh trainings list in state
      const freshTrainings = await fetch('/api/trainings').then(r => r.ok ? r.json() : trainings)
      setTrainings(freshTrainings)

      // Create plan items
      let added = 0
      for (const row of rows) {
        const key = row.title.trim().toLowerCase()
        const trainingId = titleMap[key] ?? Object.entries(titleMap).find(([k]) =>
          k.includes(key.slice(0, 25)) || key.includes(k.slice(0, 25))
        )?.[1]
        if (!trainingId) continue

        const res = await fetch(`/api/plans/${activePlan.id}/items`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            training_id: trainingId,
            month: row.month,
            periodicity: row.periodicity,
            required: true,
            valid_days: 365,
            target_type: 'all',
            target_id: null,
          }),
        })
        if (res.ok) added++
      }

      await loadItems(activePlan.id)
      setPlans(prev => prev.map(p => p.id === activePlan!.id ? { ...p, item_count: p.item_count + added } : p))
      alert(
        `✅ Importación completa:\n` +
        `• ${created} capacitación(es) nueva(s) creada(s)\n` +
        `• ${added} ítem(s) agregados al plan\n\n` +
        `Puedes editar las capacitaciones en Menú → Capacitaciones.`
      )
    } catch (err) { setError('Error al leer el archivo') }
    setImporting(false)
    if (importRef.current) importRef.current.value = ''
  }

  const targetLabel = (item: PlanItem) => {
    const t = item.plan_item_targets?.[0]
    if (!t || t.target_type === 'all') return 'Todos'
    if (t.target_type === 'area')  return areas.find(a => a.id === t.target_id)?.name ?? 'Área'
    if (t.target_type === 'group') return groups.find(g => g.id === t.target_id)?.name ?? 'Grupo'
    return t.target_type
  }

  const perioLabel = (v: string) => PERIODICITIES.find(p => p.value === v)?.label ?? v

  const itemsByMonth: Record<number, PlanItem[]> = {}
  items.forEach(item => {
    if (!itemsByMonth[item.month]) itemsByMonth[item.month] = []
    itemsByMonth[item.month].push(item)
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
              <CalendarDays size={18} style={{ color: '#8B5CF6' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Plan Anual de Capacitación</h1>
          </div>
          <p className="text-sm ml-12" style={{ color: 'var(--text-dim)' }}>
            Programa los cursos del año y asígnalos automáticamente a tus trabajadores
          </p>
        </div>
        <button onClick={() => setShowPlanModal(true)} className="terra-btn" style={{ padding: '10px 18px', fontSize: 13 }}>
          <Plus size={15} /> Nuevo plan
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      <div className="flex gap-5">

        {/* Plans list */}
        <div style={{ width: 280, flexShrink: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : plans.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(139,92,246,0.1)' }}>
                <CalendarDays size={20} style={{ color: '#8B5CF6' }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Sin planes</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>Crea tu primer plan anual</p>
              <button onClick={() => setShowPlanModal(true)} className="terra-btn" style={{ padding: '8px 16px', fontSize: 12 }}>
                <Plus size={13} /> Crear plan
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan, i) => {
                const s = STATUS_STYLES[plan.status]
                const isActive = activePlan?.id === plan.id
                return (
                  <motion.div key={plan.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActivePlan(isActive ? null : plan)}
                    className="terra-card p-3.5 cursor-pointer group"
                    style={{ borderColor: isActive ? 'var(--primary-border)' : undefined, background: isActive ? 'var(--primary-dim)' : undefined }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{plan.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          Año {plan.year} · {plan.item_count} ítem{plan.item_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        {plan.status === 'draft' && (
                          <button onClick={e => { e.stopPropagation(); handleDeletePlan(plan.id) }}
                            className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ color: '#FCA5A5' }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={13} className="mt-1.5"
                      style={{ color: 'var(--text-faint)', transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Plan detail panel */}
        <AnimatePresence>
          {activePlan && (
            <motion.div className="flex-1 min-w-0"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                {/* Plan header */}
                <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--text)' }}>{activePlan.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      {items.length} ítems · Año {activePlan.year}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">

                    {/* View toggle */}
                    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <button onClick={() => setView('list')}
                        className="w-7 h-7 rounded flex items-center justify-center transition-all"
                        style={{ background: view === 'list' ? 'var(--primary)' : 'transparent', color: view === 'list' ? '#fff' : 'var(--text-faint)' }}>
                        <List size={13} />
                      </button>
                      <button onClick={() => setView('board')}
                        className="w-7 h-7 rounded flex items-center justify-center transition-all"
                        style={{ background: view === 'board' ? 'var(--primary)' : 'transparent', color: view === 'board' ? '#fff' : 'var(--text-faint)' }}>
                        <LayoutGrid size={13} />
                      </button>
                    </div>

                    {activePlan.status === 'draft' && (
                      <>
                        {/* Import Excel */}
                        <label className="terra-btn-outline cursor-pointer"
                          style={{ padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {importing ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                          Importar Excel
                          <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                        </label>
                        <button
                          onClick={() => { setShowItemForm(true); setItemForm(EMPTY_ITEM) }}
                          className="terra-btn-outline"
                          style={{ padding: '7px 14px', fontSize: 12 }}>
                          <Plus size={13} /> Agregar ítem
                        </button>
                        <button
                          onClick={handleActivate}
                          disabled={activating || items.length === 0}
                          className="terra-btn"
                          style={{ padding: '7px 14px', fontSize: 12, background: 'linear-gradient(135deg, #8B5CF6, #10B981)' }}>
                          {activating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                          Activar plan
                        </button>
                      </>
                    )}
                    {activePlan.status === 'active' && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>
                        <CheckCircle size={12} /> Plan activo
                      </span>
                    )}
                  </div>
                </div>

                {/* Add item form */}
                <AnimatePresence>
                  {showItemForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
                      <form onSubmit={handleAddItem} className="p-5">
                        <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-faint)' }}>
                          Nuevo ítem del plan
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Curso *</label>
                            <select value={itemForm.training_id} onChange={e => setItemForm({ ...itemForm, training_id: e.target.value })}
                              className="terra-input" required>
                              <option value="">Selecciona un curso...</option>
                              {trainings.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Mes *</label>
                            <select value={itemForm.month} onChange={e => setItemForm({ ...itemForm, month: Number(e.target.value) })}
                              className="terra-input">
                              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Periodicidad</label>
                            <select value={itemForm.periodicity} onChange={e => setItemForm({ ...itemForm, periodicity: e.target.value })}
                              className="terra-input">
                              {PERIODICITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Aplica a</label>
                            <select value={itemForm.target_type} onChange={e => setItemForm({ ...itemForm, target_type: e.target.value, target_id: '' })}
                              className="terra-input">
                              <option value="all">Todos los trabajadores</option>
                              <option value="area">Área específica</option>
                              <option value="group">Grupo específico</option>
                            </select>
                          </div>
                          {itemForm.target_type === 'area' && (
                            <div>
                              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Área</label>
                              <select value={itemForm.target_id} onChange={e => setItemForm({ ...itemForm, target_id: e.target.value })}
                                className="terra-input" required>
                                <option value="">Selecciona un área...</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                            </div>
                          )}
                          {itemForm.target_type === 'group' && (
                            <div>
                              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Grupo</label>
                              <select value={itemForm.target_id} onChange={e => setItemForm({ ...itemForm, target_id: e.target.value })}
                                className="terra-input" required>
                                <option value="">Selecciona un grupo...</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Validez (días)</label>
                            <input type="number" value={itemForm.valid_days}
                              onChange={e => setItemForm({ ...itemForm, valid_days: Number(e.target.value) })}
                              className="terra-input" min={1} />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setShowItemForm(false)} className="terra-btn-outline" style={{ padding: '7px 14px', fontSize: 12 }}>
                            Cancelar
                          </button>
                          <button type="submit" disabled={savingItem || !itemForm.training_id} className="terra-btn" style={{ padding: '7px 14px', fontSize: 12 }}>
                            {savingItem ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Agregar
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content */}
                {loadingItems ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen size={28} className="mb-3" style={{ color: 'var(--text-faint)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Sin ítems</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-dim)' }}>
                      Agrega ítems manualmente o importa desde el Excel del plan HSE
                    </p>
                  </div>
                ) : view === 'list' ? (

                  /* ── LIST VIEW ── */
                  <div className="p-5">
                    <div className="grid grid-cols-1 gap-2">
                      {Array.from({ length: 12 }, (_, mi) => mi + 1).map(month => {
                        const monthItems = itemsByMonth[month]
                        if (!monthItems?.length) return null
                        return (
                          <div key={month}>
                            <div className="flex items-center gap-2 mb-2 mt-1">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                                style={{ background: MONTH_COLORS[month - 1] }}>
                                {month}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest"
                                style={{ color: 'var(--text-faint)' }}>{MONTHS[month - 1]}</span>
                              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>· {monthItems.length} ítem{monthItems.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="space-y-1.5 ml-7">
                              {monthItems.map(item => (
                                <motion.div key={item.id}
                                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
                                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${MONTH_COLORS[month - 1]}20` }}>
                                    <BookOpen size={11} style={{ color: MONTH_COLORS[month - 1] }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                                      {item.trainings?.title}
                                    </div>
                                    <div className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color: 'var(--text-faint)' }}>
                                      <span>{perioLabel(item.periodicity)}</span>
                                      <span>·</span>
                                      <span className="flex items-center gap-1">
                                        {item.plan_item_targets?.[0]?.target_type === 'all' ? <Users size={9} /> :
                                         item.plan_item_targets?.[0]?.target_type === 'area' ? <Layers size={9} /> :
                                         <UserCheck size={9} />}
                                        {targetLabel(item)}
                                      </span>
                                    </div>
                                  </div>
                                  {activePlan.status === 'draft' && (
                                    <button onClick={() => handleDeleteItem(item.id)} disabled={deletingItem === item.id}
                                      className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ color: '#FCA5A5' }}>
                                      {deletingItem === item.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                ) : (

                  /* ── BOARD VIEW ── */
                  <div className="p-4 overflow-x-auto">
                    <div className="flex gap-3" style={{ minWidth: 1100 }}>
                      {Array.from({ length: 12 }, (_, mi) => mi + 1).map(month => {
                        const monthItems = itemsByMonth[month] ?? []
                        const color = MONTH_COLORS[month - 1]
                        return (
                          <div key={month} className="flex-1 min-w-0" style={{ minWidth: 140 }}>
                            {/* Column header */}
                            <div className="rounded-xl px-3 py-2 mb-2 text-center"
                              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                              <div className="text-xs font-bold" style={{ color }}>{MONTHS[month - 1]}</div>
                              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                                {monthItems.length} ítem{monthItems.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            {/* Cards */}
                            <div className="space-y-2">
                              <AnimatePresence>
                                {monthItems.map(item => (
                                  <motion.div key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="rounded-xl p-2.5 group relative"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}` }}>
                                    <div className="text-[11px] font-semibold leading-snug mb-1" style={{ color: 'var(--text)' }}>
                                      {item.trainings?.title}
                                    </div>
                                    <div className="text-[9px] flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                                      {item.plan_item_targets?.[0]?.target_type === 'all' ? <Users size={8} /> :
                                       item.plan_item_targets?.[0]?.target_type === 'area' ? <Layers size={8} /> :
                                       <UserCheck size={8} />}
                                      <span>{targetLabel(item)}</span>
                                      <span className="ml-auto opacity-70">{perioLabel(item.periodicity).split(' ')[0]}</span>
                                    </div>
                                    {activePlan.status === 'draft' && (
                                      <button onClick={() => handleDeleteItem(item.id)} disabled={deletingItem === item.id}
                                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'var(--red-dim)', color: '#FCA5A5' }}>
                                        {deletingItem === item.id ? <Loader2 size={9} className="animate-spin" /> : <X size={9} />}
                                      </button>
                                    )}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create plan modal */}
      <AnimatePresence>
        {showPlanModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPlanModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-md pointer-events-auto rounded-2xl p-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Nuevo Plan Anual</h2>
                  <button onClick={() => setShowPlanModal(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--text-dim)', background: 'var(--bg-card)' }}>
                    <X size={15} />
                  </button>
                </div>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      Nombre del plan *
                    </label>
                    <input type="text" value={planForm.name}
                      onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="ej. PAC 2026 — HSE Producción"
                      className="terra-input" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>Año *</label>
                    <input type="number" value={planForm.year}
                      onChange={e => setPlanForm({ ...planForm, year: Number(e.target.value) })}
                      className="terra-input" min={2020} max={2035} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowPlanModal(false)} className="terra-btn-outline flex-1">Cancelar</button>
                    <button type="submit" disabled={savingPlan || !planForm.name.trim()} className="terra-btn flex-1">
                      {savingPlan ? <Loader2 size={14} className="animate-spin" /> : 'Crear plan'}
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
