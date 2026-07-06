'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { extractPPTXImages, extractPPTXTexts, getCourseData, getCustomQuestions } from '@/lib/pptx-extractor'
import {
  BookOpen, Plus, Search, Clock, CheckCircle, AlertCircle,
  Users, Star, Play, Upload, ChevronRight, X, Award, Zap,
  FileText, Layers, Trash2, Loader2, Calendar, Save, Download,
  ImagePlus, Copy, Archive, ArchiveRestore, Tag, Filter, RotateCcw,
  Pencil, RefreshCw, FileUp, AlignLeft
} from 'lucide-react'

const GRADIENTS = [
  'from-amber-500 to-red-500', 'from-red-500 to-rose-500', 'from-orange-500 to-amber-500',
  'from-amber-600 to-orange-500', 'from-emerald-500 to-teal-500', 'from-yellow-500 to-amber-500',
  'from-violet-500 to-purple-500', 'from-cyan-500 to-blue-500',
]

const CATEGORIES = ['Obligatorio', 'Especializado', 'Induccion', 'Reinduccion', 'Complementario']
const RISK_TYPES = ['Alto riesgo', 'Riesgo físico', 'Riesgo químico', 'Riesgo biomecánico', 'Riesgo psicosocial', 'General']

const statusStyles: Record<string, { label: string; color: string; bg: string; border: string }> = {
  activo:     { label: 'Vigente',     color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
  completado: { label: 'Completado',  color: '#6EE7B7', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  vencido:    { label: 'Vencido',     color: '#FCA5A5', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  archivado:  { label: 'Archivado',   color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
}

async function downloadAttendanceList(training: any) {
  const horario = prompt('Ingrese el HORARIO (ej: 8:00 AM - 12:00 PM):')
  if (horario === null) return
  const intensidad = prompt('Ingrese la INTENSIDAD (ej: 4 horas):')
  if (intensidad === null) return
  try {
    const res = await fetch(`/api/trainings/${training.id}/attendance`)
    if (!res.ok) { alert('Error API: ' + res.status); return }
    const data = await res.json()
    if (!data?.training) { alert('Sin datos'); return }
    const jsPDF = (await import('jspdf')).default
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    const { training: tr, participants, companyName, companyLogo } = data
    const W = 279.4, M = 8, usable = W - 2 * M
    const today = new Date().toLocaleDateString('es-CO')
    const CG: [number,number,number] = [56,118,29], CO: [number,number,number] = [230,145,56]
    const CLO: [number,number,number] = [248,216,176], CLG: [number,number,number] = [198,224,180]
    const CW: [number,number,number] = [255,255,255], CB: [number,number,number] = [0,0,0]
    const rawW = [16,18,18,20,20,20,20,30,30,30,41]
    const tot = rawW.reduce((a,b)=>a+b,0)
    const cols = rawW.map(w=>(w/tot)*usable)
    const colX = cols.reduce((a: number[],w,i)=>{a.push(i===0?M:a[i-1]+cols[i-1]);return a},[] as number[])
    const cX = (c:number)=>colX[c]
    const cW = (f:number,t:number)=>{let w=0;for(let i=f;i<=t;i++)w+=cols[i];return w}
    const fl = (x:number,yy:number,w:number,h:number,c:[number,number,number])=>{doc.setFillColor(c[0],c[1],c[2]);doc.rect(x,yy,w,h,'F')}
    const bd = (x:number,yy:number,w:number,h:number)=>{doc.setDrawColor(80,80,80);doc.setLineWidth(0.25);doc.rect(x,yy,w,h,'S')}
    const cl = (x:number,yy:number,w:number,h:number,txt:string,o?:{bg?:[number,number,number],color?:[number,number,number],bold?:boolean,size?:number,align?:'left'|'center'})=>{
      if(o?.bg)fl(x,yy,w,h,o.bg);bd(x,yy,w,h);if(!txt)return
      const sz=o?.size||7,b=o?.bold||false,c=o?.color||CB,al=o?.align||'center'
      doc.setFontSize(sz);doc.setFont('helvetica',b?'bold':'normal');doc.setTextColor(c[0],c[1],c[2])
      const tx=al==='center'?x+w/2:x+2,ty=yy+h/2+sz*0.12
      let ft=txt;const mw=w-4;while(doc.getTextWidth(ft)>mw&&ft.length>1)ft=ft.slice(0,-1);if(ft!==txt&&ft.length>0)ft+='..'
      doc.text(ft,tx,ty,{align:al==='center'?'center':'left'})
    }
    let y = M
    const r0H=14,logoW=cW(0,1)
    if(companyLogo){bd(cX(0),y,logoW,r0H);try{doc.addImage(companyLogo,'PNG',cX(0)+2,y+1,logoW-4,r0H-2)}catch{}}
    else cl(cX(0),y,logoW,r0H,companyName||'',{bold:true,size:8})
    cl(cX(2),y,cW(2,10),r0H,'REGISTRO DE ASISTENCIA A CAPACITACIÓN Y/O EVENTOS',{bold:true,size:12});y+=r0H
    cl(cX(0),y,logoW,6,'');cl(cX(2),y,cols[2],6,'Versión',{bold:true,size:6.5});cl(cX(3),y,cW(3,4),6,'Código',{bold:true,size:6.5})
    cl(cX(5),y,cols[5],6,'Área',{bold:true,size:6.5});cl(cX(6),y,cW(6,8),6,'Fecha de Elaboración',{bold:true,size:6.5})
    cl(cX(9),y,cW(9,10),6,'Fecha de Revisión',{bold:true,size:6.5});y+=6
    cl(cX(0),y,logoW,6,'');cl(cX(2),y,cols[2],6,'1',{size:7});cl(cX(3),y,cW(3,4),6,'AVC-FR05',{size:7})
    cl(cX(5),y,cols[5],6,'CEO',{size:7});cl(cX(6),y,cW(6,8),6,'14/10/2025',{size:7});cl(cX(9),y,cW(9,10),6,'22/01/2026',{size:7});y+=6
    cl(cX(0),y,cW(0,1),9,'FECHA',{bg:CG,color:CW,bold:true,size:8});cl(cX(2),y,cW(2,3),9,today,{size:8})
    cl(cX(4),y,cW(4,5),9,'HORARIO',{bg:CG,color:CW,bold:true,size:8});cl(cX(6),y,cW(6,7),9,horario,{size:7})
    cl(cX(8),y,cW(8,9),9,'INTENSIDAD',{bg:CG,color:CW,bold:true,size:8});cl(cX(10),y,cols[10],9,intensidad,{size:7});y+=9
    cl(cX(0),y,cW(0,1),9,'ORGANIZADO POR',{bg:CG,color:CW,bold:true,size:7});cl(cX(2),y,cW(2,3),9,'SST-AGROVENTURE CAPITAL',{size:6})
    cl(cX(4),y,cW(4,5),9,'REALIZADO POR',{bg:CG,color:CW,bold:true,size:7})
    const rpX=cX(6),rpW=cW(6,7);fl(rpX,y,rpW,9,CW);bd(rpX,y,rpW,9)
    doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(0,0,0)
    doc.text('Jimmy J. Acero. C.',rpX+rpW/2,y+3.5,{align:'center'})
    doc.setFontSize(5.5);doc.setFont('helvetica','normal')
    doc.text('Profesional SST',rpX+rpW/2,y+7,{align:'center'})
    cl(cX(8),y,cW(8,9),9,'DIRIGIDO A',{bg:CG,color:CW,bold:true,size:7});cl(cX(10),y,cols[10],9,'TRABAJADORES',{size:7});y+=9
    cl(cX(0),y,usable,7,'TEMARIO DEL EVENTO',{bg:CO,color:CW,bold:true,size:9});y+=7
    cl(cX(0),y,usable,6,tr.title,{bold:true,size:8,align:'left'});y+=6
    const temarioContent = tr.temario || tr.description || ''
    const dl=temarioContent?doc.splitTextToSize(temarioContent,usable-6):[]
    for(let i=0;i<8;i++){if(!dl[i]&&i>0&&!dl[i-1])break;cl(cX(0),y,usable,6,dl[i]||'',{size:7,align:'left'});y+=6}
    cl(cX(0),y,usable,7,'REGISTRO DE PARTICIPANTES',{bg:CO,color:CW,bold:true,size:9});y+=7
    const thH=8
    const drawTH=()=>{cl(cX(0),y,cols[0],thH,'Nº',{bg:CLO,bold:true,size:8});cl(cX(1),y,cW(1,2),thH,'CÉDULA',{bg:CLO,bold:true,size:8})
      cl(cX(3),y,cW(3,6),thH,'NOMBRES Y APELLIDOS',{bg:CLO,bold:true,size:8});cl(cX(7),y,cW(7,9),thH,'CARGO',{bg:CLO,bold:true,size:8})
      cl(cX(10),y,cols[10],thH,'FIRMA',{bg:CLO,bold:true,size:8});y+=thH}
    drawTH()
    const rowH=10,totalR=Math.max(participants.length,25)
    for(let r=0;r<totalR;r++){
      if(y+rowH>215.9-M){doc.addPage();y=M;drawTH()}
      const p=participants[r],bg=r%2===1?CLG:CW
      cl(cX(0),y,cols[0],rowH,String(r+1),{bg,bold:true,size:8});cl(cX(1),y,cW(1,2),rowH,p?.cedula||'',{bg,size:8})
      cl(cX(3),y,cW(3,6),rowH,p?.name||'',{bg,size:8,align:'left'});cl(cX(7),y,cW(7,9),rowH,p?.cargo||'',{bg,size:7,align:'left'})
      fl(cX(10),y,cols[10],rowH,bg);bd(cX(10),y,cols[10],rowH)
      if(p?.signature){try{doc.addImage(p.signature,'PNG',cX(10)+2,y+1,cols[10]-4,rowH-2)}catch{}}
      y+=rowH
    }
    const fname = 'Asistencia_'+tr.title.replace(/[^a-zA-Z0-9]/g,'_').slice(0,30)+'.pdf'
    doc.save(fname)
    alert('PDF descargado: ' + fname)
  } catch (err: any) {
    console.error('Error PDF:', err)
    alert('Error: ' + (err?.message || err))
  }
}

export default function BibliotecaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'worker'
  const isAdmin = userRole === 'superadmin' || userRole === 'admin'
  const [trainings, setTrainings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('activos')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [newCourse, setNewCourse] = useState({ name: '', duration: '', description: '', category: 'Obligatorio', risk_type: '', valid_from: '', valid_until: '' })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [migrating, setMigrating] = useState(false)
  const [duplicating, setDuplicating] = useState<number | null>(null)

  const [editingTraining, setEditingTraining] = useState<any>(null)
  const [editValidFrom, setEditValidFrom] = useState('')
  const [editValidUntil, setEditValidUntil] = useState('')
  const [savingValidity, setSavingValidity] = useState(false)

  // ── Edit training full modal ──────────────────────────────────────────────
  const [editCourse, setEditCourse] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    title: '', category: 'Obligatorio', description: '', duration: '8h',
    status: 'activo', temario: '', valid_from: '', valid_until: '',
  })
  const [editFile, setEditFile] = useState<File | null>(null)
  const editFileRef = useRef<HTMLInputElement>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editProgress, setEditProgress] = useState('')
  const [showPPTXSection, setShowPPTXSection] = useState(false)

  const openEditCourse = (t: any) => {
    setEditCourse(t)
    setEditForm({
      title: t.title || '',
      category: t.category || 'Obligatorio',
      description: t.description || '',
      duration: t.duration || '8h',
      status: t.status || 'activo',
      temario: t.temario || '',
      valid_from: t.valid_from || '',
      valid_until: t.valid_until || '',
    })
    setEditFile(null)
    setShowPPTXSection(false)
    setEditProgress('')
  }

  const handleEditSave = async () => {
    if (!editCourse || !editForm.title.trim()) return
    setSavingEdit(true)
    setEditProgress('Guardando información...')

    try {
      // 1. Save general info
      const res = await fetch('/api/trainings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editCourse.id,
          title: editForm.title.trim(),
          category: editForm.category,
          description: editForm.description,
          duration: editForm.duration,
          status: editForm.status,
          temario: editForm.temario || null,
          valid_from: editForm.valid_from || null,
          valid_until: editForm.valid_until || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert('Error al guardar: ' + (d.error || 'desconocido'))
        setSavingEdit(false)
        setEditProgress('')
        return
      }

      // 2. Replace PPTX if a new file was selected
      if (editFile && /\.(pptx|pdf)$/i.test(editFile.name)) {
        setEditProgress('Extrayendo diapositivas...')
        let slides: string[] = []
        let texts: string[] = []

        if (/\.pptx$/i.test(editFile.name)) {
          try {
            slides = await extractPPTXImages(editFile)
            texts = await extractPPTXTexts(editFile)
          } catch (e) { console.error('PPTX extract error', e) }
        } else if (/\.pdf$/i.test(editFile.name)) {
          try {
            const { extractPDFImages } = await import('@/lib/pdf-extractor')
            slides = await extractPDFImages(editFile)
          } catch (e) { console.error('PDF extract error', e) }
        }

        if (slides.length > 0) {
          setEditProgress(`Reemplazando ${slides.length} diapositivas...`)
          // Replace slides in DB
          const slidesPayload = slides.map((img, i) => ({
            slide_index: i, image_data: img, slide_text: texts[i] || '',
          }))
          await fetch(`/api/trainings/${editCourse.id}/slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slides: slidesPayload, slides_count: slides.length }),
          })
        }

        // Upload original PPTX to storage
        if (/\.pptx$/i.test(editFile.name)) {
          setEditProgress('Guardando archivo original...')
          const fd = new FormData()
          fd.append('file', editFile)
          await fetch(`/api/trainings/${editCourse.id}/upload-pptx`, {
            method: 'POST',
            body: fd,
          })
        }

        // Update local state
        const updatedCover = slides[0] || editCourse.cover_url
        setTrainings(prev => prev.map(t => t.id === editCourse.id
          ? { ...t, ...editForm, cover_url: updatedCover, slides_count: slides.length, file_name: editFile.name }
          : t
        ))
      } else {
        setTrainings(prev => prev.map(t => t.id === editCourse.id
          ? { ...t, ...editForm }
          : t
        ))
      }

      setEditCourse(null)
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setSavingEdit(false)
      setEditProgress('')
    }
  }

  const downloadPPTX = async (e: React.MouseEvent, t: any) => {
    e.stopPropagation()
    if (!t.file_name) { alert('Esta capacitación no tiene un PowerPoint guardado.'); return }
    try {
      const res = await fetch(`/api/trainings/${t.id}/download`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'No se encontró el archivo PowerPoint original. Sube o reemplaza la presentación para habilitarlo.')
        return
      }
      const { url } = await res.json()
      const a = document.createElement('a')
      a.href = url
      a.download = t.file_name
      a.click()
    } catch (e: any) {
      alert('Error al descargar: ' + e.message)
    }
  }

  useEffect(() => {
    async function loadAndMigrate() {
      let apiTrainings: any[] = []
      try {
        const res = await fetch('/api/trainings')
        const data = await res.json()
        if (Array.isArray(data)) apiTrainings = data
      } catch (_) {}

      try {
        const saved = localStorage.getItem('sst-trainings')
        if (saved) {
          const localTrainings = JSON.parse(saved)
          if (Array.isArray(localTrainings) && localTrainings.length > 0 && apiTrainings.length === 0) {
            setMigrating(true)
            for (const t of localTrainings) {
              let slides: string[] = []
              let texts: string[] = []
              try {
                const courseData = await getCourseData(t.id)
                slides = courseData.images || []
                texts = courseData.texts || []
              } catch (_) {}
              let questions: any[] = []
              try {
                const customQ = await getCustomQuestions(t.id)
                if (customQ.length > 0) questions = customQ
              } catch (_) {}
              try {
                const res = await fetch('/api/trainings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: t.title, category: t.category || 'Obligatorio',
                    duration: t.duration || '8h', description: t.description || '',
                    status: t.status || 'activo', slides_count: slides.length || t.slides || 0,
                    questions_count: t.questions || 5, cover_url: slides[0] || t.cover || null,
                    color: t.color || null, file_name: t.fileName || null, slides, texts, questions,
                  }),
                })
                const created = await res.json()
                if (res.ok) apiTrainings.push(created)
              } catch (_) {}
            }
            localStorage.removeItem('sst-trainings')
            setMigrating(false)
          }
        }
      } catch (_) {}

      setTrainings(apiTrainings)
      setLoading(false)
    }
    loadAndMigrate()
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadedFile(file)
    e.target.value = ''
  }

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim()) return
    setCreating(true)
    setUploadProgress('Extrayendo diapositivas...')

    let slides: string[] = []
    let texts: string[] = []

    if (uploadedFile && /\.pptx$/i.test(uploadedFile.name)) {
      try {
        slides = await extractPPTXImages(uploadedFile)
        texts = await extractPPTXTexts(uploadedFile)
      } catch (e) { console.error('Error extracting PPTX:', e) }
    } else if (uploadedFile && /\.pdf$/i.test(uploadedFile.name)) {
      try {
        setUploadProgress('Extrayendo páginas del PDF...')
        const { extractPDFImages } = await import('@/lib/pdf-extractor')
        slides = await extractPDFImages(uploadedFile)
      } catch (e) { console.error('Error extracting PDF:', e) }
    }

    try {
      setUploadProgress('Creando curso...')
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.name,
          category: newCourse.category,
          duration: newCourse.duration || '8h',
          description: newCourse.description,
          slides_count: slides.length,
          cover_url: slides[0] || null,
          color: GRADIENTS[trainings.length % GRADIENTS.length],
          file_name: uploadedFile?.name,
          valid_from: newCourse.valid_from || null,
          valid_until: newCourse.valid_until || null,
        }),
      })
      const training = await res.json()
      if (!res.ok) {
        alert(`Error al crear curso: ${training.error || 'Error desconocido'}`)
        setCreating(false)
        setUploadProgress('')
        return
      }

      if (slides.length > 0) {
        for (let i = 0; i < slides.length; i++) {
          setUploadProgress(`Subiendo diapositiva ${i + 1} de ${slides.length}...`)
          try {
            await fetch('/api/trainings/slides', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                training_id: training.id, slide_index: i,
                image_data: slides[i], slide_text: texts[i] || '',
              }),
            })
          } catch (e) { console.error(`Error uploading slide ${i}:`, e) }
        }
      }

      if (slides[0]) training.cover_url = slides[0]

      setTrainings(prev => [training, ...prev])
      setShowModal(false)
      setNewCourse({ name: '', duration: '', description: '', category: 'Obligatorio', risk_type: '', valid_from: '', valid_until: '' })
      setUploadedFile(null)
    } catch (e) {
      console.error('Error creating course:', e)
      alert('Error de conexión al crear el curso')
    }

    setCreating(false)
    setUploadProgress('')
  }

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('¿Eliminar este curso de la biblioteca? Esta acción no se puede deshacer.')) return
    try {
      await fetch(`/api/trainings?id=${id}`, { method: 'DELETE' })
      setTrainings(prev => prev.filter(t => t.id !== id))
    } catch (_) {}
  }

  const handleDuplicateCourse = async (e: React.MouseEvent, t: any) => {
    e.stopPropagation()
    setDuplicating(t.id)
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${t.title} (copia)`,
          category: t.category,
          duration: t.duration,
          description: t.description,
          slides_count: t.slides_count,
          questions_count: t.questions_count,
          cover_url: t.cover_url,
          color: t.color,
          file_name: t.file_name,
          valid_from: t.valid_from,
          valid_until: t.valid_until,
          status: 'activo',
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setTrainings(prev => [created, ...prev])
      }
    } catch (_) {}
    setDuplicating(null)
  }

  const handleArchiveCourse = async (e: React.MouseEvent, t: any) => {
    e.stopPropagation()
    const newStatus = t.status === 'archivado' ? 'activo' : 'archivado'
    try {
      const res = await fetch('/api/trainings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, status: newStatus }),
      })
      if (res.ok) {
        setTrainings(prev => prev.map(tr => tr.id === t.id ? { ...tr, status: newStatus } : tr))
      }
    } catch (_) {}
  }

  const openEditValidity = (e: React.MouseEvent, t: any) => {
    e.stopPropagation()
    setEditingTraining(t)
    setEditValidFrom(t.valid_from || '')
    setEditValidUntil(t.valid_until || '')
  }

  const saveValidity = async () => {
    if (!editingTraining) return
    setSavingValidity(true)
    try {
      const res = await fetch('/api/trainings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTraining.id,
          valid_from: editValidFrom || null,
          valid_until: editValidUntil || null,
        }),
      })
      if (res.ok) {
        setTrainings(prev => prev.map(t =>
          t.id === editingTraining.id ? { ...t, valid_from: editValidFrom || null, valid_until: editValidUntil || null } : t
        ))
        setEditingTraining(null)
      }
    } catch (_) {}
    setSavingValidity(false)
  }

  const now = new Date().toISOString().split('T')[0]

  const filtered = trainings.filter(t => {
    if (!t || !t.title) return false
    const q = search.toLowerCase()
    const matchSearch = !q
      || (t.title || '').toLowerCase().includes(q)
      || (t.category || '').toLowerCase().includes(q)
      || (t.description || '').toLowerCase().includes(q)
      || (t.risk_type || '').toLowerCase().includes(q)

    const effectiveStatus = t.valid_until && t.valid_until < now ? 'vencido' : (t.status || 'activo')
    const matchStatus = statusFilter === 'archivados'
      ? t.status === 'archivado'
      : statusFilter === 'activos'
        ? t.status !== 'archivado'
        : effectiveStatus === statusFilter

    const matchCategory = categoryFilter === 'todos' || t.category === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  const activeTrainings = trainings.filter(t => t.status !== 'archivado')
  const archivedCount = trainings.filter(t => t.status === 'archivado').length

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Biblioteca de Cursos
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {activeTrainings.length} cursos activos
              {archivedCount > 0 && ` · ${archivedCount} archivados`}
              {' · '}evaluación y certificado automático
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => router.push('/dashboard/trainings/create')} className="terra-btn text-sm py-2.5 px-4">
                <Zap size={15} /> Generar con IA
              </button>
              <button onClick={() => setShowModal(true)} className="terra-btn-outline text-sm py-2.5 px-4">
                <Plus size={16} /> Agregar Curso
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total activos',  value: activeTrainings.length,                                       icon: BookOpen,      color: 'var(--amber)' },
          { label: 'Completados',    value: activeTrainings.filter(t => t.status === 'completado').length, icon: CheckCircle,   color: '#10B981' },
          { label: 'Vigentes',       value: activeTrainings.filter(t => t.status === 'activo').length,     icon: Clock,         color: '#60A5FA' },
          { label: 'Archivados',     value: archivedCount,                                                 icon: Archive,       color: '#94A3B8' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="terra-card p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, categoría, descripción, tipo de riesgo..."
            className="terra-input pl-9" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-faint)' }}><X size={14} /></button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs flex items-center gap-1 mr-1" style={{ color: 'var(--text-faint)' }}>
            <Filter size={11} /> Estado:
          </span>
          {[
            { key: 'activos',    label: 'Activos' },
            { key: 'vencido',    label: 'Vencidos' },
            { key: 'completado', label: 'Completados' },
            { key: 'archivados', label: 'Archivados' },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={statusFilter === f.key
                ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {f.label}
            </button>
          ))}

          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

          <span className="text-xs flex items-center gap-1 mr-1" style={{ color: 'var(--text-faint)' }}>
            <Tag size={11} /> Categoría:
          </span>
          {['todos', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={categoryFilter === c
                ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {c === 'todos' ? 'Todos' : c}
            </button>
          ))}

          {(search || statusFilter !== 'activos' || categoryFilter !== 'todos') && (
            <button onClick={() => { setSearch(''); setStatusFilter('activos'); setCategoryFilter('todos') }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ml-auto transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
              <RotateCcw size={11} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Migrating */}
      {migrating && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--amber)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Migrando capacitaciones al servidor...</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Esto solo ocurre una vez. Después podrás verlas desde cualquier dispositivo.</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !migrating && (
        <div className="py-16 text-center">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin" style={{ color: 'var(--amber)' }} />
          <p style={{ color: 'var(--text-dim)' }}>Cargando biblioteca...</p>
        </div>
      )}

      {/* Search result count */}
      {!loading && search && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Cards Grid */}
      {!loading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t, i) => {
            const isExpired = t.valid_until && t.valid_until < now
            const notYetValid = t.valid_from && t.valid_from > now
            const effectiveStatus = isExpired ? 'vencido' : (t.status || 'activo')
            const st = statusStyles[effectiveStatus as keyof typeof statusStyles] || statusStyles.activo
            const progress = (t.enrolled || 0) > 0 ? Math.round(((t.completed || 0) / t.enrolled) * 100) : 0
            const gradColor = t.color || GRADIENTS[t.id % GRADIENTS.length]
            const isArchived = t.status === 'archivado'
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`terra-card terra-card-lift overflow-hidden cursor-pointer group ${isArchived ? 'opacity-60' : ''}`}
                onClick={() => !isArchived && router.push(`/dashboard/trainings/${t.id}`)}>

                <div className="relative h-44 overflow-hidden">
                  {t.cover_url && t.cover_url.startsWith('http') ? (
                    <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradColor} flex items-center justify-center`}>
                      <BookOpen size={48} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-surface), rgba(17,9,0,0.4), transparent)' }} />

                  {!isArchived && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <Play size={22} className="text-white ml-1" fill="white" />
                      </div>
                    </div>
                  )}

                  {isArchived && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Archive size={36} className="text-white/40" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm"
                      style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="badge-amber">{t.category}</span>
                    {t.risk_type && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-sm"
                        style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)', color: '#C4B5FD' }}>
                        <Tag size={8} />{t.risk_type}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/80 text-xs"><Layers size={11} /> {t.slides_count || 0} diapositivas</div>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs"><FileText size={11} /> {t.questions_count || 5} preguntas</div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[15px] mb-1.5 leading-snug" style={{ color: 'var(--text)' }}>{t.title}</h3>
                  <p className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t.description}</p>

                  {(t.valid_from || t.valid_until) && (
                    <div className="text-[10px] mb-2 px-2 py-1 rounded-lg inline-block"
                      style={{
                        background: isExpired ? 'rgba(239,68,68,0.1)' : notYetValid ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isExpired ? '#FCA5A5' : notYetValid ? '#FCD34D' : '#6EE7B7'
                      }}>
                      Vigencia: {t.valid_from || '...'} → {t.valid_until || '...'}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
                    <div className="flex items-center gap-1"><Clock size={11} /> {t.duration}</div>
                    <div className="flex items-center gap-1"><Users size={11} /> {t.enrolled || 0}</div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Award size={11} className="text-amber-400" />
                      <span className="text-white font-semibold">{t.rating || 0}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Progreso</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{progress}%</span>
                    </div>
                    <div className="terra-progress-track">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.5 }}
                        className={`terra-progress-fill bg-gradient-to-r ${gradColor}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={13} className="text-emerald-400" />
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Certificado al completar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin && <>
                        {/* Upload cover */}
                        <label onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-blue-500/15 transition-colors cursor-pointer" title="Subir portada">
                          <ImagePlus size={13} className="text-blue-400" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return
                            const fd = new FormData(); fd.append('file', file); fd.append('training_id', String(t.id))
                            const res = await fetch('/api/trainings/cover', { method: 'POST', body: fd })
                            if (res.ok) { const d = await res.json(); setTrainings(prev => prev.map(tr => tr.id === t.id ? { ...tr, cover_url: d.cover_url } : tr)) }
                            else { const d = await res.json().catch(()=>({})); alert('Error al subir portada: ' + (d.error || res.status)) }
                          }} />
                        </label>

                        {/* Duplicate */}
                        <button onClick={(e) => handleDuplicateCourse(e, t)} disabled={duplicating === t.id}
                          className="p-1.5 rounded-lg hover:bg-violet-500/15 transition-colors" title="Duplicar curso">
                          {duplicating === t.id
                            ? <Loader2 size={13} className="animate-spin text-violet-400" />
                            : <Copy size={13} className="text-violet-400" />}
                        </button>

                        {/* Download attendance */}
                        <button onClick={(e) => { e.stopPropagation(); downloadAttendanceList(t) }}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/15 transition-colors" title="Lista de asistencia PDF">
                          <Download size={13} className="text-emerald-400" />
                        </button>

                        {/* Download original PPTX */}
                        {t.file_name && (
                          <button onClick={(e) => downloadPPTX(e, t)}
                            className="p-1.5 rounded-lg hover:bg-orange-500/15 transition-colors" title="Descargar PowerPoint original">
                            <FileUp size={13} className="text-orange-400" style={{ transform: 'rotate(180deg)' }} />
                          </button>
                        )}

                        {/* Edit training */}
                        <button onClick={(e) => { e.stopPropagation(); openEditCourse(t) }}
                          className="p-1.5 rounded-lg hover:bg-blue-500/15 transition-colors" title="Editar capacitación">
                          <Pencil size={13} className="text-blue-400" />
                        </button>

                        {/* Experience Designer */}
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/trainings/${t.id}/experience`) }}
                          className="p-1.5 rounded-lg hover:bg-violet-500/15 transition-colors" title="Diseñar experiencia">
                          <span style={{ fontSize: 13 }}>✨</span>
                        </button>

                        {/* Edit validity */}
                        <button onClick={(e) => openEditValidity(e, t)}
                          className="p-1.5 rounded-lg hover:bg-amber-500/15 transition-colors" title="Editar vigencia">
                          <Calendar size={13} className="text-amber-400" />
                        </button>

                        {/* Archive / restore */}
                        <button onClick={(e) => handleArchiveCourse(e, t)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: isArchived ? '#6EE7B7' : '#94A3B8' }}
                          onMouseEnter={e => { e.currentTarget.style.background = isArchived ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                          title={isArchived ? 'Restaurar curso' : 'Archivar curso'}>
                          {isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                        </button>

                        {/* Delete */}
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(t.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors" title="Eliminar curso">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </>}
                      {!isArchived && (
                        <button className="flex items-center gap-0.5 text-xs font-bold text-amber-400 hover:text-amber-300 ml-1">
                          Ver <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-faint)' }} />
          <p style={{ color: 'var(--text-faint)' }}>
            {search ? `Sin resultados para "${search}"` : 'No hay cursos en esta vista'}
          </p>
          {statusFilter === 'archivados' && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Los cursos archivados aparecen aquí</p>
          )}
        </div>
      )}

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Plus size={15} style={{ color: 'var(--amber)' }} />
                </div>
                <h2 className="font-bold" style={{ color: 'var(--text)' }}>Agregar Curso a la Biblioteca</h2>
              </div>
              <button onClick={() => { setShowModal(false); setUploadedFile(null); setNewCourse({ name: '', duration: '', description: '', category: 'Obligatorio', risk_type: '', valid_from: '', valid_until: '' }) }}
                style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Nombre del curso *</label>
                <input placeholder="Ej: Trabajo en Alturas, Uso de EPP..."
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="terra-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Duración</label>
                  <select value={newCourse.duration} onChange={e => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className="terra-input" style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>
                    <option value="" style={{ backgroundColor: '#1a1207' }}>Seleccionar</option>
                    {['2h','4h','6h','8h','12h','16h','20h','24h','40h'].map(d => (
                      <option key={d} value={d} style={{ backgroundColor: '#1a1207', color: '#e8d5b5' }}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Categoría</label>
                  <select className="terra-input" value={newCourse.category}
                    onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}>
                    {CATEGORIES.map(c => (
                      <option key={c} style={{ background: 'var(--bg-surface)' }}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                  Tipo de riesgo <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <select className="terra-input" value={newCourse.risk_type}
                  onChange={e => setNewCourse({ ...newCourse, risk_type: e.target.value })}>
                  <option value="" style={{ background: 'var(--bg-surface)' }}>Sin clasificar</option>
                  {RISK_TYPES.map(r => (
                    <option key={r} style={{ background: 'var(--bg-surface)' }}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Descripción</label>
                <textarea rows={3} placeholder="Describe el contenido del curso..."
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="terra-input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Vigencia desde</label>
                  <input type="date" value={newCourse.valid_from}
                    onChange={e => setNewCourse({ ...newCourse, valid_from: e.target.value })}
                    className="terra-input" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Vigencia hasta</label>
                  <input type="date" value={newCourse.valid_until}
                    onChange={e => setNewCourse({ ...newCourse, valid_until: e.target.value })}
                    className="terra-input" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Material del curso</label>
                <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.ppt,.mp4,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                {uploadedFile ? (
                  <div className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} style={{ color: '#6EE7B7' }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{uploadedFile.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="p-1.5 rounded-lg" style={{ color: '#FCA5A5' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl p-6 text-center cursor-pointer transition-all hover:opacity-80"
                    style={{ border: '2px dashed var(--border-strong)', background: 'var(--bg-card)' }}>
                    <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--amber)' }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Haz clic para subir archivo</p>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>PDF, PPTX, DOC, MP4 hasta 500 MB</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowModal(false); setUploadedFile(null); setNewCourse({ name: '', duration: '', description: '', category: 'Obligatorio', risk_type: '', valid_from: '', valid_until: '' }) }}
                className="terra-btn-outline flex-1 py-2.5 justify-center">Cancelar</button>
              <button onClick={handleCreateCourse} disabled={!newCourse.name.trim() || creating}
                className="terra-btn flex-1 py-2.5 justify-center">
                {creating ? (uploadProgress || 'Procesando...') : 'Agregar a Biblioteca'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Edit Training Full Modal ──────────────────────────────────── */}
      {editCourse && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !savingEdit && setEditCourse(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl rounded-2xl flex flex-col max-h-[90vh]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Pencil size={14} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Editar Capacitación</h2>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Todos los cambios se reflejan inmediatamente</p>
                </div>
              </div>
              <button onClick={() => setEditCourse(null)} disabled={savingEdit} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Título *
                  </label>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="terra-input w-full" placeholder="Nombre de la capacitación" />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Categoría
                  </label>
                  <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="terra-input w-full" style={{ background: 'var(--bg-card)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Duración
                  </label>
                  <select value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                    className="terra-input w-full" style={{ background: 'var(--bg-card)' }}>
                    {['1h','2h','3h','4h','6h','8h','12h','16h','20h','24h','40h'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Estado
                  </label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="terra-input w-full" style={{ background: 'var(--bg-card)' }}>
                    {Object.entries(statusStyles).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Vigencia desde
                  </label>
                  <input type="date" value={editForm.valid_from} onChange={e => setEditForm(f => ({ ...f, valid_from: e.target.value }))}
                    className="terra-input w-full" style={{ colorScheme: 'dark' }} />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Vigencia hasta
                  </label>
                  <input type="date" value={editForm.valid_until} onChange={e => setEditForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="terra-input w-full" style={{ colorScheme: 'dark' }} />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-dim)' }}>
                    Descripción
                  </label>
                  <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} className="terra-input w-full resize-none" placeholder="Descripción general del curso..." />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                    <AlignLeft size={10} style={{ color: '#f59e0b' }} />
                    Temario <span className="text-[9px] normal-case font-normal ml-1" style={{ color: 'var(--text-faint)' }}>— aparece en la planilla de asistencia</span>
                  </label>
                  <textarea value={editForm.temario} onChange={e => setEditForm(f => ({ ...f, temario: e.target.value }))}
                    rows={5} className="terra-input w-full resize-none"
                    placeholder={'• Definición y marco normativo\n• Identificación de riesgos\n• Controles y medidas preventivas\n• Procedimientos de emergencia\n• Evaluación y compromisos'} />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                    Escribe los temas desarrollados. Este resumen quedará registrado como evidencia en la planilla de asistencia.
                  </p>
                </div>
              </div>

              {/* PPTX replacement section */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button onClick={() => setShowPPTXSection(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ color: 'var(--text-dim)' }}>
                  <div className="flex items-center gap-2">
                    <RefreshCw size={13} style={{ color: '#f59e0b' }} />
                    {editCourse.slides_count > 0 ? 'Reemplazar presentación' : 'Subir presentación'}
                    {editCourse.slides_count > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}>
                        {editCourse.slides_count} diapositivas actuales
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className={`transition-transform ${showPPTXSection ? 'rotate-90' : ''}`} />
                </button>

                {showPPTXSection && (
                  <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <input ref={editFileRef} type="file" accept=".pptx,.pdf" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setEditFile(f); e.target.value = '' }} />

                    {editFile ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <FileUp size={18} className="text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{editFile.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                            {(editFile.size / 1024 / 1024).toFixed(1)} MB · Se procesará al guardar
                          </div>
                        </div>
                        <button onClick={() => setEditFile(null)} style={{ color: '#FCA5A5' }}><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => editFileRef.current?.click()}
                        className="w-full py-6 rounded-xl border-2 border-dashed text-sm transition-all hover:opacity-80"
                        style={{ borderColor: 'var(--border-strong)', color: 'var(--text-faint)' }}>
                        <FileUp size={20} className="mx-auto mb-1.5 opacity-50" />
                        Haz clic para seleccionar PPTX o PDF
                      </button>
                    )}

                    {editCourse.slides_count > 0 && (
                      <p className="text-[10px] mt-2 text-center" style={{ color: 'rgba(239,68,68,0.7)' }}>
                        ⚠ Las {editCourse.slides_count} diapositivas actuales serán reemplazadas
                      </p>
                    )}
                    {!editCourse.slides_count && (
                      <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--text-faint)' }}>
                        El archivo PPTX también se guardará para poder descargarlo después
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setEditCourse(null)} disabled={savingEdit}
                className="terra-btn-outline flex-1 py-2.5 justify-center text-sm">
                Cancelar
              </button>
              <button onClick={handleEditSave} disabled={savingEdit || !editForm.title.trim()}
                className="terra-btn flex-1 py-2.5 justify-center text-sm disabled:opacity-40">
                {savingEdit
                  ? <><Loader2 size={14} className="animate-spin" /> {editProgress || 'Guardando...'}</>
                  : <><Save size={14} /> Guardar cambios</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit validity modal */}
      {editingTraining && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingTraining(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Calendar size={15} style={{ color: 'var(--amber)' }} />
                </div>
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Editar Vigencia</h2>
              </div>
              <button onClick={() => setEditingTraining(null)} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{editingTraining.title}</div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Vigencia desde</label>
                <input type="date" value={editValidFrom} onChange={e => setEditValidFrom(e.target.value)}
                  className="terra-input w-full" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Vigencia hasta</label>
                <input type="date" value={editValidUntil} onChange={e => setEditValidUntil(e.target.value)}
                  className="terra-input w-full" style={{ colorScheme: 'dark' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingTraining(null)} className="terra-btn-outline flex-1 py-2.5 justify-center">Cancelar</button>
                <button onClick={saveValidity} disabled={savingValidity}
                  className="terra-btn flex-1 py-2.5 justify-center flex items-center gap-2">
                  {savingValidity ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Guardar</>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
