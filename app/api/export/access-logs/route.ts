import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdminOrSuper } from '@/lib/get-company'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

export async function GET(req: NextRequest) {
  const { authorized, companyId } = await isAdminOrSuper()
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'pdf'
  const dateFrom = searchParams.get('from')
  const dateTo = searchParams.get('to')
  const areaId = searchParams.get('area_id')
  const gateId = searchParams.get('gatehouse_id')

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: 'Parámetros from/to requeridos' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('access_logs')
    .select(`
      id, entry_time, exit_time, notes,
      gatehouse:gatehouses!access_logs_gatehouse_id_fkey(id, name),
      user:users!access_logs_user_id_fkey(id, name, cedula, cargo),
      area:areas!access_logs_area_id_fkey(id, name, color)
    `)
    .eq('company_id', companyId)
    .gte('entry_time', new Date(dateFrom).toISOString())
    .lt('entry_time', new Date(new Date(dateTo).getTime() + 86400000).toISOString())
    .order('entry_time', { ascending: false })

  if (areaId) query = query.eq('area_id', areaId)
  if (gateId) query = query.eq('gatehouse_id', gateId)

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const data = logs ?? []
  const tableData = data.map((log: any, idx: number) => {
    const entry = new Date(log.entry_time)
    const exit = log.exit_time ? new Date(log.exit_time) : null
    const duration = exit ? Math.floor((exit.getTime() - entry.getTime()) / 60000) : 0
    const durationStr = duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`
    return [
      idx + 1,
      log.user?.name || '—',
      log.user?.cedula || '—',
      log.gatehouse?.name || '—',
      entry.toLocaleDateString('es-CO'),
      entry.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      exit ? exit.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
      log.exit_time ? durationStr : '—',
      log.exit_time ? 'Salió' : 'Dentro',
    ]
  })

  if (format === 'excel') {
    return exportExcel(tableData)
  } else {
    return exportPDF(tableData)
  }
}

function exportExcel(tableData: any[]) {
  const headers = ['N°', 'Trabajador', 'Cédula', 'Portería', 'Fecha', 'Ingreso', 'Salida', 'Duración', 'Estado']
  const ws = XLSX.utils.aoa_to_sheet([headers, ...tableData])
  ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 14 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Registros')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new NextResponse(new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="registro-ingresos-${new Date().getTime()}.xlsx"`,
    },
  })
}

function exportPDF(tableData: any[]) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const colWidths = [8, 28, 18, 20, 18, 15, 15, 15, 12]

  doc.setFontSize(14)
  doc.text('Registro de Ingresos y Salidas', margin, margin + 5)
  doc.setFontSize(8)
  doc.text(`AgroSafe - Control Operativo | ${new Date().toLocaleDateString('es-CO')}`, margin, margin + 12)

  const headers = ['N°', 'Trabajador', 'Cédula', 'Portería', 'Fecha', 'Ingreso', 'Salida', 'Duración', 'Estado']
  let y = margin + 20
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(59, 130, 246)
  doc.setTextColor(255, 255, 255)

  let x = margin
  headers.forEach((h, i) => {
    doc.text(h, x, y, { maxWidth: colWidths[i] })
    x += colWidths[i]
  })

  y += 5
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFillColor(245, 245, 245)

  tableData.forEach((row, idx) => {
    if (y > pageHeight - 15) {
      doc.addPage()
      y = margin
    }

    x = margin
    row.forEach((cell: string, colIdx: number) => {
      const isEven = idx % 2 === 0
      if (isEven) doc.setFillColor(245, 245, 245)
      else doc.setFillColor(255, 255, 255)
      doc.rect(x, y - 4, colWidths[colIdx], 5, 'F')

      doc.setFontSize(7)
      doc.text(String(cell), x + 1, y, { maxWidth: colWidths[colIdx] - 2 })
      x += colWidths[colIdx]
    })
    y += 5
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="registro-ingresos-${new Date().getTime()}.pdf"`,
    },
  })
}
