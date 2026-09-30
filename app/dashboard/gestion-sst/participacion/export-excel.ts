import { PREGUNTAS, CAMPO_MEJORAS, PELIGROS, GRUPO_DE_PELIGRO } from '@/lib/peligros'
import { tabular, type Fila } from '@/lib/peligros-tabulacion'

const fecha = (s?: string | null) => (s ? new Date(s).toLocaleDateString('es-CO') : '')

/**
 * Libro con tres miradas: la base completa para filtrar, el detalle de
 * respuestas y la tabulación ya calculada.
 */
export async function exportarResultadosExcel(filas: Fila[], periodo: number, empresa = 'Empresa') {
  const _mod = await import('xlsx')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const XLSX = (_mod as any).default ?? _mod
  const t = tabular(filas)

  // ── HOJA 1: BASE COMPLETA (una fila por trabajador, participe o no) ──
  const base = filas.map(f => {
    const p = f.participacion
    const fila: Record<string, any> = {
      'TRABAJADOR': f.nombre ?? '',
      'CÉDULA': f.cedula ?? '',
      'CARGO': f.cargo ?? '',
      'ÁREA': f.area ?? '',
      'FINCA / CENTRO DE TRABAJO': f.centro_trabajo ?? '',
      'ESTADO': f.estado,
      'FECHA DE PARTICIPACIÓN': fecha(f.enviado_at),
      'PERIODO': periodo,
    }
    for (const q of PREGUNTAS) {
      if (q.tipo === 'peligros') {
        fila[`${q.n}. PELIGROS IDENTIFICADOS`] = (p?.peligros ?? []).join(' | ')
        fila['4b. OTRO PELIGRO'] = p?.peligros_otro ?? ''
      } else if (q.tipo === 'confirmacion') {
        fila[`${q.n}. CONFIRMA PARTICIPACIÓN`] = p ? (p.confirma_participacion ? 'SÍ' : 'NO') : ''
      } else {
        fila[`${q.n}. ${q.titulo.toUpperCase()}`] = (p?.[q.campo] as string) ?? ''
      }
      if (q.campo === 'controles_suficientes') {
        fila[`8b. ${CAMPO_MEJORAS.titulo.toUpperCase()}`] = p?.oportunidades_mejora ?? ''
      }
    }
    return fila
  })

  const ws1 = XLSX.utils.json_to_sheet(base)
  const nCols = Object.keys(base[0] ?? {}).length || 1
  ws1['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(nCols - 1)}1` }
  ws1['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 24 }, { wch: 12 }, { wch: 18 }, { wch: 9 },
    ...Array(Math.max(nCols - 8, 0)).fill({ wch: 42 })]

  // ── HOJA 2: MATRIZ DE PELIGROS (un 1 por trabajador y peligro) ───────
  // Pensada para tabla dinámica: cada columna es un peligro y cada fila un
  // trabajador, así el conteo nunca confunde marcas con personas.
  const marcados = new Set(t.peligros.map(p => p.etiqueta))
  const columnas = [...PELIGROS.filter(p => marcados.has(p)), ...t.peligros.map(p => p.etiqueta).filter(p => !PELIGROS.includes(p))]
  const matriz = filas.filter(f => f.estado === 'Participó').map(f => {
    const suyos = new Set(f.participacion?.peligros ?? [])
    const fila: Record<string, any> = {
      'TRABAJADOR': f.nombre ?? '', 'CÉDULA': f.cedula ?? '', 'CARGO': f.cargo ?? '',
      'ÁREA': f.area ?? '', 'FINCA / CENTRO DE TRABAJO': f.centro_trabajo ?? '',
      'TOTAL PELIGROS MARCADOS': suyos.size,
    }
    for (const c of columnas) fila[c] = suyos.has(c) ? 1 : 0
    return fila
  })
  const ws2 = XLSX.utils.json_to_sheet(matriz.length ? matriz : [{ 'SIN PARTICIPACIONES': '' }])
  ws2['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 24 }, { wch: 12 },
    ...Array(columnas.length).fill({ wch: 26 })]

  // ── HOJA 3: TABULACIÓN ───────────────────────────────────────────────
  const bloque = (titulo: string, filas2: { etiqueta: string; n: number; pct: number; grupo?: string }[], nota: string) => ([
    [titulo],
    [nota],
    ['RESPUESTA', 'TRABAJADORES', '% SOBRE PARTICIPANTES', 'DETALLE'],
    ...filas2.map(c => [c.etiqueta, c.n, c.pct, c.grupo ?? '']),
    [],
  ])

  const notaParticipantes = `Porcentaje calculado sobre ${t.participantes} participantes. Un trabajador puede marcar varios peligros, por eso la suma de los porcentajes puede pasar de 100 %.`

  const tab: (string | number)[][] = [
    ['TABULACIÓN DE RESULTADOS — IDENTIFICACIÓN DE PELIGROS'],
    [`Empresa: ${empresa}`, '', `Periodo: ${periodo}`, '', `Generado: ${new Date().toLocaleDateString('es-CO')}`],
    [],
    ['INDICADOR', 'VALOR', 'UNIDAD'],
    ['Total de trabajadores', t.totalTrabajadores, 'trabajadores'],
    ['Participaron', t.participantes, 'trabajadores'],
    ['Pendientes', t.pendientes, 'trabajadores'],
    ['Participación', t.pctParticipacion, '%'],
    ['Promedio de peligros marcados por participante', t.promedioPeligros, 'peligros'],
    [],
    ...bloque('PELIGROS MÁS IDENTIFICADOS', t.peligros, notaParticipantes),
    ...bloque('POR CLASE DE PELIGRO', t.porGrupoPeligro, `Un trabajador cuenta una sola vez por clase. Base: ${t.participantes} participantes.`),
    ...bloque('FRECUENCIA DE EXPOSICIÓN', t.frecuencia, `Base: ${t.participantes} participantes.`),
    ...bloque('SUFICIENCIA DE LOS CONTROLES', t.suficiencia, `Base: ${t.participantes} participantes.`),
    ...bloque('CAMBIOS EN EL ÚLTIMO AÑO', t.cambios, `Base: ${t.participantes} participantes.`),
    ...bloque('PARTICIPACIÓN POR ÁREA', t.porArea, 'Porcentaje sobre el total de trabajadores del área.'),
    ...bloque('PARTICIPACIÓN POR FINCA / CENTRO DE TRABAJO', t.porCentro, 'Porcentaje sobre el total de trabajadores del centro.'),
    ...bloque('PARTICIPACIÓN POR CARGO', t.porCargo, 'Porcentaje sobre el total de trabajadores del cargo.'),
  ]
  const ws3 = XLSX.utils.aoa_to_sheet(tab)
  ws3['!cols'] = [{ wch: 52 }, { wch: 14 }, { wch: 22 }, { wch: 18 }]

  // ── HOJA 4: PELIGROS POR ÁREA (cruce) ────────────────────────────────
  const areas = [...new Set(filas.filter(f => f.estado === 'Participó').map(f => f.area?.trim() || 'Sin asignar'))].sort()
  const cruce: (string | number)[][] = [
    ['PELIGROS POR ÁREA'],
    ['Cada celda es el número de trabajadores de esa área que marcaron el peligro.'],
    [],
    ['PELIGRO', 'CLASE', ...areas, 'TOTAL'],
    ...t.peligros.map(p => {
      const porArea = areas.map(a => filas.filter(f =>
        f.estado === 'Participó' &&
        (f.area?.trim() || 'Sin asignar') === a &&
        (f.participacion?.peligros ?? []).includes(p.etiqueta)).length)
      return [p.etiqueta, GRUPO_DE_PELIGRO[p.etiqueta] ?? 'Otros', ...porArea, p.n]
    }),
    [],
    ['PARTICIPANTES POR ÁREA', '', ...areas.map(a => filas.filter(f => f.estado === 'Participó' && (f.area?.trim() || 'Sin asignar') === a).length), t.participantes],
  ]
  const ws4 = XLSX.utils.aoa_to_sheet(cruce)
  ws4['!cols'] = [{ wch: 46 }, { wch: 28 }, ...areas.map(() => ({ wch: 16 })), { wch: 10 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, '1. Base completa')
  XLSX.utils.book_append_sheet(wb, ws2, '2. Matriz de peligros')
  XLSX.utils.book_append_sheet(wb, ws3, '3. Tabulación')
  XLSX.utils.book_append_sheet(wb, ws4, '4. Peligros por área')

  XLSX.writeFile(wb, `Participacion_Peligros_${empresa.replace(/\s+/g, '_')}_${periodo}.xlsx`)
}
