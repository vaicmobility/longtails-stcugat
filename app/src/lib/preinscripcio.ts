import { supabase } from './supabase'

/** Canvia la versió cada cop que es modifiqui el text, perquè quedi constància de què va acceptar cadascú. */
// El text de la política és a lib/textos.ts (POLITICA_PRIVACITAT).
export const PRIVACITAT_VERSIO = 'VAIC-PRIVACITAT-2026-11-03'

export type Preinscripcio = {
  id: string
  email: string
  nom: string
  document: string
  telefon: string | null
  escola_bressol: string | null
  infant_unitat_familiar: string | null
  adult_nom: string | null
  adult_document: string | null
  privacitat_versio: string
  privacitat_acceptada_at: string | null
  estat: 'pendent' | 'convertida' | 'descartada'
  cessio_id: string | null
  created_at: string
  // Dades del llistat de l'Ajuntament (importació)
  num_assignacio?: number | null
  servei_gestor?: string | null
  data_lliurament?: string | null
  data_retorn_prevista?: string | null
  lloc_lliurament?: string | null
  lloc_retorn?: string | null
  origen?: 'formulari' | 'importacio'
}

export type DadesPreinscripcio = {
  email: string; nom: string; document: string; telefon: string
  escola_bressol: string; infant: string; adult_nom: string; adult_document: string
}

/** Públic (sense login): només insereix, no retorna dades. */
export async function enviarPreinscripcio(d: DadesPreinscripcio) {
  const { error } = await supabase.rpc('crear_preinscripcio_v2', {
    _email: d.email, _nom: d.nom, _document: d.document, _telefon: d.telefon,
    _escola_bressol: d.escola_bressol, _infant: d.infant, _adult_nom: d.adult_nom, _adult_document: d.adult_document,
    _privacitat_versio: PRIVACITAT_VERSIO,
  })
  if (error) throw new Error(error.message)
}

// ---- Personal de botiga (admin) ----

export async function llistarPreinscripcions(estat?: string) {
  let q = supabase.from('preinscripcions').select('*').order('created_at', { ascending: false }).limit(300)
  if (estat) q = q.eq('estat', estat)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data as Preinscripcio[]
}

export async function getPreinscripcio(id: string) {
  const { data, error } = await supabase.from('preinscripcions').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as Preinscripcio
}

/** Darrera preinscripció pendent d'aquest correu. */
export async function darreraPreinscripcio(email: string) {
  const { data } = await supabase.from('preinscripcions').select('*')
    .eq('email', email.trim().toLowerCase()).eq('estat', 'pendent')
    .order('created_at', { ascending: false }).limit(1)
  return (data?.[0] as Preinscripcio | undefined) ?? null
}

export async function marcarPreinscripcio(id: string, estat: Preinscripcio['estat'], cessioId?: string) {
  const { error } = await supabase.from('preinscripcions').update({ estat, cessio_id: cessioId ?? null }).eq('id', id)
  if (error) throw new Error(error.message)
}
