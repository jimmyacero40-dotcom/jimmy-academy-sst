/**
 * Los temas de la biblioteca.
 *
 * Antes la categoría hacía dos oficios a la vez: agrupar por asunto y decir
 * si la ley exige el curso. Por eso casi todo terminó en un cajón llamado
 * "SST", que en una plataforma de SST no distingue nada, y la alerta de
 * obligatorios dependía de una palabra escrita a mano.
 *
 * Ahora son dos cosas separadas: el tema agrupa, y `obligatorio` es una
 * casilla aparte que el plan anual lee para avisar lo que falta programar.
 */

export interface Tema {
  id: string
  nombre: string
  /** Para la portada de la fila y el punto del filtro. */
  color: string
  /** Qué va aquí, en una línea, para quien esté clasificando. */
  pista: string
}

export const TEMAS: Tema[] = [
  { id: 'seguridad', nombre: 'Seguridad industrial', color: '#F59E0B',
    pista: 'Alturas, eléctrico, espacios confinados, máquinas, herramientas' },
  { id: 'salud', nombre: 'Salud en el trabajo', color: '#EF4444',
    pista: 'Riesgo cardiovascular, osteomuscular, visual, auditivo, psicosocial' },
  { id: 'estilos', nombre: 'Estilos de vida saludables', color: '#10B981',
    pista: 'Alimentación, actividad física, tabaco, alcohol, descanso' },
  { id: 'emergencias', nombre: 'Emergencias', color: '#F97316',
    pista: 'Primeros auxilios, incendios, evacuación, simulacros, brigadas' },
  { id: 'induccion', nombre: 'Inducción y reinducción', color: '#06B6D4',
    pista: 'Lo que recibe quien entra, y el repaso anual' },
  { id: 'riesgos', nombre: 'Riesgos específicos', color: '#8B5CF6',
    pista: 'Químico, biológico, biomecánico, ruido, vibración, agroquímicos' },
  { id: 'legal', nombre: 'Legal y normativo', color: '#3B82F6',
    pista: 'Copasst, comité de convivencia, reglamento, normas, responsabilidades' },
  { id: 'ambiental', nombre: 'Ambiental', color: '#22C55E',
    pista: 'Residuos, agua, energía, impactos, política ambiental' },
  { id: 'complementario', nombre: 'Complementario', color: '#64748B',
    pista: 'Todo lo demás: lo que no encaja en los anteriores' },
]

export const TEMA_POR_DEFECTO = 'complementario'

export function buscarTema(id: string | null | undefined): Tema {
  return TEMAS.find(t => t.id === id) ?? TEMAS[TEMAS.length - 1]
}

export const nombreTema = (id: string | null | undefined) => buscarTema(id).nombre
export const colorTema = (id: string | null | undefined) => buscarTema(id).color

/**
 * Propone un tema leyendo el título y la descripción.
 *
 * Es una propuesta, no una decisión: sirve para no clasificar sesenta cursos
 * a mano desde cero, pero quien manda es la persona que lo revisa.
 *
 * Se mira primero el título y solo después la descripción. El título dice de
 * qué trata el curso; la descripción nombra de paso medio mundo —"Trabajo en
 * alturas" menciona la resolución que lo regula, y eso lo mandaba a Legal.
 *
 * Dentro de cada pasada el orden va de lo más específico a lo más general.
 */
const PISTAS: Array<{ tema: string; palabras: string[] }> = [
  { tema: 'induccion', palabras: [
    'induccion', 'inducción', 'reinduccion', 'reinducción', 'bienvenida', 'ingreso de personal'] },
  { tema: 'emergencias', palabras: [
    'emergencia', 'primeros auxilios', 'incendio', 'extintor', 'evacuacion', 'evacuación',
    'simulacro', 'brigada', 'rescate', 'rcp', 'desastre'] },
  { tema: 'salud', palabras: [
    'cardiovascular', 'osteomuscular', 'musculoesqueletico', 'musculoesquelético', 'salud visual',
    'auditiv', 'psicosocial', 'estres', 'estrés', 'salud mental', 'salud oral', 'higiene postural',
    'postura', 'ergonom', 'pausas activas', 'manipulacion manual de cargas',
    'manipulación manual de cargas', 'levantamiento de cargas', 'biomecanic', 'biomecánic',
    'examenes medicos', 'exámenes médicos', 'morbilidad'] },
  { tema: 'estilos', palabras: [
    'alimentacion', 'alimentación', 'nutricion', 'nutrición', 'habitos saludables',
    'hábitos saludables', 'actividad fisica', 'actividad física', 'tabaquismo', 'tabaco',
    'alcohol', 'sustancias psicoactivas', 'sueño', 'descanso', 'estilos de vida', 'vida saludable'] },
  { tema: 'ambiental', palabras: [
    'ambiental', 'medio ambiente', 'recurso hidrico', 'recurso hídrico', 'uso eficiente',
    'del agua', 'la energia', 'la energía', 'impactos ambientales', 'codigo de colores',
    'código de colores', 'reciclaje'] },
  { tema: 'legal', palabras: [
    'copasst', 'convivencia', 'reglamento', 'normativ', 'legislacion', 'legislación', 'decreto',
    'resolucion', 'resolución', 'ley ', 'derechos y deberes', 'responsabilidad', 'sg-sst',
    'sistema de gestion', 'sistema de gestión', 'politica', 'política', 'auditoria', 'auditoría'] },
  { tema: 'riesgos', palabras: [
    'quimico', 'químico', 'biologico', 'biológico', 'biomecanico', 'biomecánico', 'agroquimic',
    'agroquímic', 'plaguicida', 'fitosanitario', 'ruido', 'vibracion', 'vibración', 'radiacion',
    'radiación', 'temperatura', 'matriz de riesgo', 'identificacion de peligros',
    'identificación de peligros', 'peligros', 'material particulado', 'sustancias quimicas',
    'sustancias químicas', 'hoja de seguridad', 'residuos'] },
  { tema: 'seguridad', palabras: [
    'altura', 'electric', 'eléctric', 'espacios confinados', 'maquinaria', 'maquina', 'máquina',
    'herramienta', 'epp', 'elementos de proteccion', 'elementos de protección', 'bloqueo',
    'izaje', 'montacarga', 'vehicul', 'vehícul', 'vial', 'conduccion', 'conducción', 'soldadura',
    'trabajo seguro', 'orden y aseo', '5 eses', 'señalizacion', 'señalización', 'caida', 'caída',
    'atrapamiento', 'derrame', 'estanteria', 'estantería', 'locativo', 'inspecciones de seguridad',
    'actos y condiciones', 'operacion segura', 'operación segura', 'bombas, mangueras'] },
]

function sinTildes(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function sugerirTema(titulo: string, descripcion?: string | null): string {
  for (const texto of [sinTildes(titulo ?? ''), sinTildes(descripcion ?? '')]) {
    if (!texto.trim()) continue
    for (const { tema, palabras } of PISTAS) {
      if (palabras.some(p => texto.includes(sinTildes(p)))) return tema
    }
  }
  return TEMA_POR_DEFECTO
}
