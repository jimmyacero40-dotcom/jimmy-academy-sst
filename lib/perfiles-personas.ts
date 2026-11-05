// ─── Quién pertenece a qué perfil ─────────────────────────────────────
// Una sola regla, usada por la pantalla de Perfiles, por el asistente de
// asignación y por los avisos de cobertura. Si la regla cambia, cambia aquí.
//
// La regla: una persona está en un perfil si su cargo es uno de los cargos
// del perfil, o si se la metió a mano. Y no está si se la sacó a mano, aunque
// su cargo calce.
// ──────────────────────────────────────────────────────────────────────

import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export interface PersonaDePerfil {
  id: string
  name: string
  cedula: string | null
  cargo: string | null
  area: string | null
  /** Por qué está: su cargo, o porque alguien la metió. */
  motivo: 'cargo' | 'a mano'
}

/** Compara cargos sin pelear por mayúsculas, tildes ni espacios de más. */
export function normaliza(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toUpperCase().replace(/\s+/g, ' ')
}

interface Cargas {
  cargos: Map<string, Set<string>>        // profile_id → cargos normalizados
  excepciones: Map<string, Map<string, boolean>>  // profile_id → user_id → incluir
  personas: any[]
}

/** Trae de una sola vez lo que hace falta para resolver toda la empresa. */
async function cargar(companyId: string): Promise<Cargas> {
  const [{ data: perfiles }, { data: cargos }, { data: excep }, { data: personas }] = await Promise.all([
    supabase.from('training_profiles').select('id').eq('company_id', companyId),
    supabase.from('profile_cargos').select('profile_id, cargo'),
    supabase.from('profile_excepciones').select('profile_id, user_id, incluir'),
    supabase.from('users')
      .select('id, name, cedula, cargo, area')
      .eq('company_id', companyId).eq('role', 'worker').eq('active', true)
      .is('retired_at', null).order('name'),
  ])

  const mios = new Set((perfiles ?? []).map(p => p.id))

  const mapaCargos = new Map<string, Set<string>>()
  for (const c of cargos ?? []) {
    if (!mios.has(c.profile_id)) continue
    if (!mapaCargos.has(c.profile_id)) mapaCargos.set(c.profile_id, new Set())
    mapaCargos.get(c.profile_id)!.add(normaliza(c.cargo))
  }

  const mapaExcep = new Map<string, Map<string, boolean>>()
  for (const e of excep ?? []) {
    if (!mios.has(e.profile_id)) continue
    if (!mapaExcep.has(e.profile_id)) mapaExcep.set(e.profile_id, new Map())
    mapaExcep.get(e.profile_id)!.set(e.user_id, e.incluir)
  }

  return { cargos: mapaCargos, excepciones: mapaExcep, personas: personas ?? [] }
}

function resolver(profileId: string, datos: Cargas): PersonaDePerfil[] {
  const cargos = datos.cargos.get(profileId) ?? new Set<string>()
  const excep = datos.excepciones.get(profileId) ?? new Map<string, boolean>()

  const lista: PersonaDePerfil[] = []
  for (const u of datos.personas) {
    const sacada = excep.get(u.id) === false
    if (sacada) continue
    const metida = excep.get(u.id) === true
    const porCargo = cargos.has(normaliza(u.cargo))
    if (!metida && !porCargo) continue
    lista.push({
      id: u.id, name: u.name, cedula: u.cedula, cargo: u.cargo, area: u.area,
      motivo: porCargo ? 'cargo' : 'a mano',
    })
  }
  return lista
}

/** La gente de un perfil. */
export async function personasDePerfil(profileId: string, companyId: string) {
  return resolver(profileId, await cargar(companyId))
}

/** Cuánta gente tiene cada perfil, por id. Para pintar la lista. */
export async function conteoPorPerfil(companyId: string): Promise<Record<string, number>> {
  const datos = await cargar(companyId)
  const salida: Record<string, number> = {}
  for (const profileId of new Set([...datos.cargos.keys(), ...datos.excepciones.keys()])) {
    salida[profileId] = resolver(profileId, datos).length
  }
  return salida
}

/**
 * A quién le toca una capacitación según los perfiles: la unión de la gente
 * de todos los perfiles que la tienen en su plantilla.
 *
 * Es lo que se pre-marca al abrir el asistente, para no volver a escoger a
 * mano lo que el perfil ya dice.
 */
export async function aQuienLeTocaPorPerfil(
  trainingId: number, companyId: string,
): Promise<{ userIds: string[]; perfiles: { id: string; name: string; personas: number }[] }> {
  const { data: enPlantilla } = await supabase
    .from('profile_trainings').select('profile_id').eq('training_id', trainingId)

  const ids = [...new Set((enPlantilla ?? []).map(p => p.profile_id))]
  if (!ids.length) return { userIds: [], perfiles: [] }

  const { data: nombres } = await supabase
    .from('training_profiles').select('id, name').in('id', ids).eq('company_id', companyId)

  const datos = await cargar(companyId)
  const union = new Set<string>()
  const perfiles: { id: string; name: string; personas: number }[] = []

  for (const p of nombres ?? []) {
    const gente = resolver(p.id, datos)
    gente.forEach(u => union.add(u.id))
    perfiles.push({ id: p.id, name: p.name, personas: gente.length })
  }

  return { userIds: [...union], perfiles }
}

/** Los perfiles a los que pertenece cada una de estas personas. */
export async function perfilesDePersonas(
  userIds: string[], companyId: string,
): Promise<{ id: string; name: string; personas: number }[]> {
  const { data: perfiles } = await supabase
    .from('training_profiles').select('id, name').eq('company_id', companyId).order('name')

  const datos = await cargar(companyId)
  const buscados = new Set(userIds)
  const salida: { id: string; name: string; personas: number }[] = []

  for (const p of perfiles ?? []) {
    const dentro = resolver(p.id, datos).filter(u => buscados.has(u.id))
    if (dentro.length) salida.push({ id: p.id, name: p.name, personas: dentro.length })
  }
  return salida
}
