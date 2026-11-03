import { supabase } from './supabase'

/** Canvia la versió cada cop que es modifiqui el text, perquè quedi constància de què va acceptar cadascú. */
export const PRIVACITAT_VERSIO = 'AJ-STCUGAT-T218-2026-11'

// Text de la clàusula de l'Ajuntament (plantilla oficial d'annexos). PENDENT de validar amb l'Ajuntament / DPD.
export const PRIVACITAT_TEXT = [
  "Les dades que facilites en aquest formulari s'utilitzaran per preparar la cessió de la bicicleta del programa de longtails i l'acta de lliurament corresponent.",
  "Us informem que les vostres dades seran incorporades al tractament T218 Campanyes de sensibilització ambiental responsabilitat de l'Ajuntament de Sant Cugat del Vallès per a portar a terme l'autorització indicada. Les vostres dades seran conservades com a part dels procediments administratius de l'Ajuntament. Les vostres dades no seran cedides a tercers excepte que sigui necessari per portar a terme el tràmit sol·licitat, d'acord amb la legislació vigent.",
  "Així mateix s'informa de la possibilitat d'exercir els seus drets d'accés, rectificació, supressió, oposició, portabilitat i limitació de les dades mitjançant la remissió d'un escrit dirigit a Ajuntament de Sant Cugat del Vallès, Atenció Ciutadana, Plaça de la Vila, 1, 08172 Sant Cugat del Vallès, indicant \"Ref. Protecció de dades\" o bé exercir el seu dret a través de la Seu Electrònica. Per a més informació consulteu la pàgina web: https://www.santcugat.cat/web/proteccio-de-dades",
]

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
  privacitat_acceptada_at: string
  estat: 'pendent' | 'convertida' | 'descartada'
  cessio_id: string | null
  created_at: string
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
