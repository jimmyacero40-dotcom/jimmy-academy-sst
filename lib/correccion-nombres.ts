// ─── Correcciones rápidas sobre los datos del personal ────────────────
// Arreglos que antes había que hacer campo por campo, abriendo la ficha de
// cada persona: pasar a mayúscula, intercambiar el nombre con el apellido
// y quitar los espacios de más que deja una importación de Excel.
//
// La lógica vive aquí, separada de la pantalla, para poder comprobarla con
// casos reales sin abrir el navegador.
// ──────────────────────────────────────────────────────────────────────

export type Correccion = 'mayusculas' | 'intercambiar' | 'espacios'

export const CORRECCIONES: { id: Correccion; label: string; descripcion: string }[] = [
  { id: 'mayusculas',   label: 'MAYÚSCULAS',  descripcion: 'Nombre y cargo en mayúscula sostenida' },
  { id: 'intercambiar', label: 'Intercambiar nombres y apellidos', descripcion: 'Para quien quedó al revés: pasa "Edna Rocío Pacheco" a "Pacheco Edna Rocío"' },
  { id: 'espacios',     label: 'Quitar espacios de más', descripcion: 'Espacios dobles y al principio o al final' },
]

/** Datos de una persona que estas correcciones pueden tocar. */
export interface DatosPersona {
  name: string
  cargo?: string | null
  /** De worker_profiles, cuando la ficha existe. */
  nombres?: string | null
  apellidos?: string | null
}

const limpiar = (s: string) => s.trim().replace(/\s+/g, ' ')
const mayus = (s: string) => limpiar(s).toLocaleUpperCase('es-CO')

/**
 * Parte el nombre completo en dos mitades: lo que va primero y lo que va
 * después.
 *
 * El corte se saca de la ficha cuando existe —cuántas palabras tiene el
 * apellido que la persona diligenció—, y si no, de la convención de la casa:
 * dos apellidos primero, salvo que el nombre tenga tres palabras o menos.
 *
 * Se corta sobre el nombre completo, no se copia el texto de la ficha. La
 * ficha dice DÓNDE cortar, no CON QUÉ reemplazar: de lo contrario un
 * "ACERO CHAPETÓN" guardado sin tilde en la ficha le borraba la tilde al
 * nombre al intercambiarlo.
 */
export function partirNombre(d: DatosPersona): { apellidos: string; nombres: string } {
  const partes = limpiar(d.name ?? '').split(' ').filter(Boolean)
  if (partes.length < 2) return { apellidos: partes[0] ?? '', nombres: '' }

  const enLaFicha = limpiar(d.apellidos ?? '').split(' ').filter(Boolean).length
  const corte = enLaFicha > 0 && enLaFicha < partes.length
    ? enLaFicha
    : (partes.length >= 4 ? 2 : 1)

  return { apellidos: partes.slice(0, corte).join(' '), nombres: partes.slice(corte).join(' ') }
}

export interface Propuesta {
  name: string
  cargo?: string | null
  nombres?: string | null
  apellidos?: string | null
}

/** Aplica las correcciones elegidas y devuelve cómo quedarían los datos. */
export function proponer(d: DatosPersona, acciones: Correccion[]): Propuesta {
  let name = d.name ?? ''
  let cargo = d.cargo ?? null
  let nombres = d.nombres ?? null
  let apellidos = d.apellidos ?? null

  if (acciones.includes('intercambiar')) {
    const p = partirNombre({ name, cargo, nombres, apellidos })
    // El nombre completo se arma al revés de como está: lo que iba primero
    // pasa al final. Y si la ficha tiene los campos aparte, se intercambian
    // también, que es donde está el error de origen.
    name = [p.nombres, p.apellidos].filter(Boolean).join(' ')
    if (nombres?.trim() || apellidos?.trim()) {
      const antes = { nombres, apellidos }
      nombres = antes.apellidos
      apellidos = antes.nombres
    }
  }

  if (acciones.includes('espacios')) {
    name = limpiar(name)
    if (cargo) cargo = limpiar(cargo)
    if (nombres) nombres = limpiar(nombres)
    if (apellidos) apellidos = limpiar(apellidos)
  }

  if (acciones.includes('mayusculas')) {
    name = mayus(name)
    if (cargo) cargo = mayus(cargo)
    if (nombres) nombres = mayus(nombres)
    if (apellidos) apellidos = mayus(apellidos)
  }

  return { name, cargo, nombres, apellidos }
}

/** ¿La propuesta cambia algo? Lo que no cambia no se guarda ni se muestra. */
export function hayCambio(d: DatosPersona, p: Propuesta): boolean {
  return p.name !== (d.name ?? '')
    || (p.cargo ?? null) !== (d.cargo ?? null)
    || (p.nombres ?? null) !== (d.nombres ?? null)
    || (p.apellidos ?? null) !== (d.apellidos ?? null)
}
