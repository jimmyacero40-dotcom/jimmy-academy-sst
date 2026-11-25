/**
 * El catálogo de EPP y dotación de AgroVenture, tal como lo entregó el
 * profesional de SST. Una referencia por talla, que es como se pide y como
 * se entrega.
 *
 * Los «igual anterior» de su tabla quedan escritos completos: una ficha que
 * dice «igual anterior» no sirve cuando se consulta una sola.
 */

const EPP = 'EPP'
const DOT = 'Dotación'
const HIG = 'Higiene y bienestar'

const items = []
const agregar = (nombre, categoria, unidad, sirve, cuidado, talla = null) =>
  items.push({ nombre, categoria, unidad, sirve, cuidado, talla })

// ── 1. Vestuario y protección corporal ──
const TALLAS_ROPA = ['S', 'M', 'L', 'XL', 'XXL']

for (const t of TALLAS_ROPA) {
  agregar(`OVEROL DE FUMIGACIÓN TALLA ${t}`, EPP, 'Unidad',
    'Protege el cuerpo frente a salpicaduras y contacto con productos químicos, según su especificación.',
    'Usar completamente cerrado. Revisar costuras y cierres. Lavar según fabricante.', t)
}
for (const t of TALLAS_ROPA) {
  agregar(`CHAQUETA DE FUMIGACIÓN TALLA ${t}`, EPP, 'Unidad',
    'Protege torso y brazos frente a salpicaduras químicas compatibles.',
    'Revisar integridad y limpiar según fabricante.', t)
}
for (const t of TALLAS_ROPA) {
  agregar(`PIJAMA TALLA ${t}`, DOT, 'Conjunto',
    'Prenda de dotación para actividades laborales.',
    'Mantener limpia y en buen estado.', t)
}
for (const t of TALLAS_ROPA) {
  agregar(`TRAJE TYCHEM 4 TALLA ${t}`, EPP, 'Unidad',
    'Protege frente a determinados riesgos químicos según certificación y fabricante.',
    'Revisar costuras, cierres e integridad.', t)
}
agregar('DELANTAL DE PVC', EPP, 'Unidad',
  'Protege el cuerpo frente a salpicaduras de líquidos y sustancias compatibles.',
  'Revisar perforaciones, lavar y secar después de usar.')
agregar('TOALLA', HIG, 'Unidad',
  'Facilita el secado personal después de actividades de aseo.',
  'Mantener limpia y seca.')

// ── 2. Protección de pies ──
for (let t = 34; t <= 43; t++) {
  agregar(`BOTAS DE SEGURIDAD TALLA ${t}`, EPP, 'Par',
    'Protegen los pies frente a impactos, compresión y riesgos mecánicos, según sus características.',
    'Revisar suela, puntera y estructura. Mantener limpias y secas.', String(t))
}
for (let t = 34; t <= 43; t++) {
  agregar(`BOTAS DE SOLDADOR TALLA ${t}`, EPP, 'Par',
    'Protegen los pies frente a chispas, partículas calientes y riesgos propios de la soldadura.',
    'Revisar suela, puntera, costuras y elementos de protección.', String(t))
}

// ── 3. Protección facial y ocular ──
agregar('CARETA PARA ESMERILAR', EPP, 'Unidad',
  'Protege el rostro frente a partículas proyectadas durante el esmerilado.',
  'Revisar visor y sujeción. Limpiar sin rayar.')
agregar('CARETA DE SOLDADOR', EPP, 'Unidad',
  'Protege ojos y rostro frente a radiación, chispas y proyecciones de soldadura.',
  'Revisar filtro, visor y estructura.')
agregar('GAFAS DE SEGURIDAD LENTE OSCURO', EPP, 'Unidad',
  'Protegen los ojos frente a partículas y luminosidad, según filtro.',
  'Revisar rayaduras y limpiar con paño adecuado.')
agregar('GAFAS DE SEGURIDAD LENTE CLARO', EPP, 'Unidad',
  'Protegen los ojos frente a partículas y proyecciones.',
  'Revisar rayaduras y limpiar con paño adecuado.')

// ── 4. Protección de manos ──
for (const t of ['7', '8', '9', '10']) {
  agregar(`GUANTES SOLVEX VERDES TALLA ${t}`, EPP, 'Par',
    'Protegen frente a sustancias químicas compatibles con el material.',
    'Revisar perforaciones y compatibilidad química. Limpiar según fabricante.', t)
}
for (const t of ['7', '8', '9', '10']) {
  agregar(`GUANTES DE NITRILO TALLA ${t}`, EPP, 'Par',
    'Protegen frente a determinados líquidos y contaminantes, según material y espesor.',
    'Revisar perforaciones y cambiar cuando pierdan integridad.', t)
}
for (const t of TALLAS_ROPA) {
  agregar(`GUANTES ANTICORTE TALLA ${t}`, EPP, 'Par',
    'Reducen el riesgo de lesiones por cortes durante la manipulación de materiales.',
    'Revisar desgaste, perforaciones y deterioro.', t)
}
for (const t of ['7', '7 1/2', '8', '8 1/2', '9', '9 1/2', '10']) {
  agregar(`GUANTES DE CAUCHO CALIBRE 25 TALLA ${t}`, EPP, 'Par',
    'Protegen frente a humedad y sustancias compatibles con el material.',
    'Revisar perforaciones. Lavar y secar.', t)
}
agregar('GUANTES DE KEVLAR PARA SOLDADOR', EPP, 'Par',
  'Protegen frente al calor, chispas y abrasión según diseño.',
  'Revisar costuras y desgaste. Mantener secos.')
agregar('GUANTES DE VAQUETA 3/4', EPP, 'Par',
  'Protegen frente a abrasión y riesgos mecánicos.',
  'Revisar costuras y desgaste. Mantener secos.')

// ── 5. Protección respiratoria ──
agregar('RESPIRADOR N95', EPP, 'Unidad',
  'Filtra partículas suspendidas en el aire.',
  'Revisar ajuste, humedad y deterioro.')
agregar('FILTRO P100', EPP, 'Unidad',
  'Filtra partículas con eficiencia P100.',
  'Verificar compatibilidad y reemplazar según fabricante.')
agregar('FILTRO 7093', EPP, 'Unidad',
  'Proporciona protección frente a partículas en respiradores compatibles.',
  'Revisar conexión e integridad.')
agregar('CARTUCHO 6003', EPP, 'Unidad',
  'Protege frente a determinados vapores orgánicos y gases ácidos.',
  'Revisar compatibilidad, vencimiento y condiciones de uso.')
agregar('FILTRO 5N11', EPP, 'Unidad',
  'Filtra partículas en configuraciones compatibles.',
  'Instalar con accesorios correspondientes.')
agregar('RESPIRADOR DE MEDIA CARA', EPP, 'Unidad',
  'Protege las vías respiratorias mediante filtros o cartuchos compatibles.',
  'Revisar válvulas, sellos y ajuste.')
agregar('COPA NASAL FULL FACE', EPP, 'Unidad',
  'Componente interno de respiradores de cara completa.',
  'Revisar compatibilidad y limpiar según fabricante.')
agregar('RETENEDOR 502', EPP, 'Unidad',
  'Sujeta filtros compatibles en sistemas de protección respiratoria.',
  'Revisar deformaciones y daños.')

// ── 6. Protección auditiva ──
agregar('PROTECTOR AUDITIVO DE INSERCIÓN', EPP, 'Par',
  'Reduce la exposición al ruido según su nivel de atenuación.',
  'Insertar correctamente. Limpiar si es reutilizable o desechar si es desechable.')

module.exports = items
