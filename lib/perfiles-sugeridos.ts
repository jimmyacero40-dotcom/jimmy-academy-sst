/**
 * Perfiles de formación sugeridos y los cursos que debería traer cada uno.
 *
 * Antes la sugerencia solo rellenaba el nombre y el cargo, así que el perfil
 * nacía vacío: se elegía "Inducción General" y quedaba sin formaciones. Aquí
 * se dice, con palabras clave, qué cursos de la biblioteca le corresponden; el
 * servidor las resuelve contra los cursos que esa empresa tenga de verdad,
 * porque los identificadores no son iguales entre empresas.
 */

export interface PerfilSugerido {
  name: string
  cargo: string
  /** Se busca en el título y en la categoría del curso, sin acentos ni mayúsculas. */
  claves: string[]
}

export const PERFILES_SUGERIDOS: PerfilSugerido[] = [
  { name: 'Inducción General', cargo: 'Nuevo ingreso',
    claves: ['induc'] },
  { name: 'Brigadista SST', cargo: 'Brigadista de emergencias',
    claves: ['brigada', 'emergencia', 'extintor', 'evacuacion', 'primeros auxilios'] },
  { name: 'Miembro COPASST', cargo: 'Comité Paritario SST',
    claves: ['copasst', 'vigia', 'investigacion de incidentes', 'inspeccion', 'marco normativo', 'comunicacion efectiva'] },
  { name: 'Trabajo en Alturas', cargo: 'Operario alturas',
    claves: ['altura', 'arnes', 'rescate'] },
  { name: 'Conductor SST', cargo: 'Conductor / Operador',
    claves: ['vial', 'transito', 'conduccion', 'vehicul', 'maquinaria'] },
  { name: 'Operario Producción', cargo: 'Auxiliar de producción',
    claves: ['herramienta', 'maquinaria', 'locativo', 'quimico', 'ergonom', 'pausas activas', 'proteccion personal'] },
  { name: 'Personal Administrativo', cargo: 'Administrativo / Oficina',
    claves: ['ergonom', 'pausas activas', 'psicosocial', 'cardiovascular', 'estres'] },
  { name: 'Primeros Auxilios', cargo: 'Socorrista certificado',
    claves: ['primeros auxilios', 'rcp', 'emergencia'] },
]

/** Quita acentos y pasa a minúscula, para comparar sin sorpresas. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function perfilSugerido(nombre: string): PerfilSugerido | undefined {
  const n = normalizar(nombre)
  return PERFILES_SUGERIDOS.find(p => normalizar(p.name) === n)
}

/** Los cursos de la empresa que encajan con las palabras clave del perfil. */
export function cursosQueEncajan<T extends { id: number; title: string | null; category: string | null }>(
  cursos: T[], claves: string[],
): T[] {
  return cursos.filter(c => {
    const texto = normalizar(`${c.title ?? ''} ${c.category ?? ''}`)
    return claves.some(k => texto.includes(normalizar(k)))
  })
}
