/**
 * El soporte de las entregas, en PDF.
 *
 * Es el reemplazo del formato en papel: la misma constancia, pero sin tener
 * que escribir a cada rato el nombre, la cédula y el cargo de quien recibe.
 * Lleva la firma que cada trabajador tenía registrada el día de la entrega.
 */

interface Fila {
  id: string
  nombre: string
  cedula: string
  cargo: string
  cantidad: number
  referencia: string | null
  entregado_at: string
  entregado_por_nombre: string | null
  observacion: string | null
  firma?: string | null
}

const C = {
  verde: [36, 60, 44] as [number, number, number],
  crema: [236, 230, 157] as [number, number, number],
  gris: [110, 118, 128] as [number, number, number],
  oscuro: [25, 32, 40] as [number, number, number],
  blanco: [255, 255, 255] as [number, number, number],
}

const W = 210, H = 297, ML = 14, MR = 14, CW = W - ML - MR

const enLetras = (f: string) =>
  new Date(`${f}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

export async function exportarEntregasPDF(
  listado: Fila[],
  tipo: { id: string; nombre: string; unidad: string },
  desde: string,
  hasta: string,
) {
  // Las firmas no vienen en el listado de pantalla: se piden solo aquí.
  let filas = listado
  try {
    const r = await fetch(`/api/entregas?tipo_id=${tipo.id}&desde=${desde}&hasta=${hasta}&firmas=1`)
    if (r.ok) {
      const d = await r.json()
      if (Array.isArray(d.entregas)) filas = d.entregas
    }
  } catch { /* si falla, sale sin firmas antes que no salir */ }

  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

  let pagina = 0
  let y = 0

  const texto = (
    s: string, x: number, yy: number, tam: number, color: [number, number, number],
    negrilla = false, alinear: 'left' | 'center' | 'right' = 'left',
  ) => {
    doc.setFontSize(tam)
    doc.setFont('helvetica', negrilla ? 'bold' : 'normal')
    doc.setTextColor(...color)
    doc.text(s, x, yy, { align: alinear })
  }

  const caja = (x: number, yy: number, w: number, h: number, c: [number, number, number]) => {
    doc.setFillColor(...c); doc.rect(x, yy, w, h, 'F')
  }

  // Las columnas: Nº, trabajador, cédula, cargo, cantidad, firma.
  const anchos = [8, 52, 24, 44, 20, 34]
  const X = anchos.reduce((a: number[], w, i) => { a.push(i ? a[i - 1] + anchos[i - 1] : ML); return a }, [])

  function encabezado() {
    pagina++
    caja(0, 0, W, 20, C.verde)
    texto('REGISTRO DE ENTREGA', ML, 9, 10, C.blanco, true)
    texto(tipo.nombre.toUpperCase(), ML, 15, 8, C.crema)
    texto(`Pág. ${pagina}`, W - MR, 15, 7.5, C.crema, false, 'right')

    y = 26
    const rango = desde === hasta ? enLetras(desde) : `del ${enLetras(desde)} al ${enLetras(hasta)}`
    texto(rango.charAt(0).toUpperCase() + rango.slice(1), ML, y, 8.5, C.oscuro, true)
    y += 7

    caja(ML, y, CW, 7, C.crema)
    const titulos = ['Nº', 'TRABAJADOR', 'CÉDULA', 'CARGO', 'CANTIDAD', 'FIRMA']
    titulos.forEach((t, i) => texto(t, X[i] + 2, y + 4.8, 7, C.oscuro, true))
    y += 7
  }

  function pie() {
    doc.setDrawColor(...C.verde); doc.setLineWidth(0.3)
    doc.line(ML, H - 12, W - MR, H - 12)
    texto(`Generado por AgroSafe el ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ML, H - 7, 7, C.gris)
    texto(`${filas.length} ${filas.length === 1 ? 'entrega' : 'entregas'}`, W - MR, H - 7, 7, C.gris, false, 'right')
  }

  encabezado()

  const alto = 16
  for (let i = 0; i < filas.length; i++) {
    if (y + alto > H - 18) { pie(); doc.addPage(); encabezado() }
    const f = filas[i]

    if (i % 2) caja(ML, y, CW, alto, [250, 251, 250])
    doc.setDrawColor(224, 228, 224); doc.setLineWidth(0.15)
    doc.rect(ML, y, CW, alto, 'S')

    texto(String(i + 1), X[0] + 2, y + 7, 7.5, C.gris)
    texto(f.nombre.slice(0, 32), X[1] + 2, y + 6, 7.5, C.oscuro, true)
    texto(new Date(f.entregado_at).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    }), X[1] + 2, y + 11, 6.5, C.gris)
    texto(f.cedula || '—', X[2] + 2, y + 7, 7.5, C.oscuro)
    texto((f.cargo || '—').slice(0, 28), X[3] + 2, y + 7, 7, C.oscuro)
    texto(`${f.cantidad} ${tipo.unidad}`, X[4] + 2, y + 7, 7.5, C.oscuro, true)
    if (f.referencia) texto(f.referencia.slice(0, 18), X[4] + 2, y + 11, 6, C.gris)

    if (f.firma) {
      try {
        caja(X[5] + 2, y + 2, anchos[5] - 4, alto - 4, C.blanco)
        doc.addImage(f.firma, /^data:image\/png/i.test(f.firma) ? 'PNG' : 'JPEG',
          X[5] + 3, y + 3, anchos[5] - 6, alto - 6)
      } catch { /* una firma rota no bota el documento */ }
    } else {
      texto('sin firma registrada', X[5] + 2, y + 9, 6, C.gris)
    }

    y += alto
  }

  // Quién entregó: va una vez al final, no en cada renglón.
  const quienes = [...new Set(filas.map(f => f.entregado_por_nombre).filter(Boolean))] as string[]
  if (quienes.length) {
    if (y + 24 > H - 18) { pie(); doc.addPage(); encabezado() }
    y += 10
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.4)
    doc.line(ML + 20, y, ML + 90, y)
    texto('QUIEN ENTREGA', ML + 55, y + 4.5, 8, C.oscuro, true, 'center')
    texto(quienes.join(' · '), ML + 55, y + 9, 7, C.gris, false, 'center')
  }

  pie()
  doc.save(`Entregas_${tipo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${desde}.pdf`)
}
