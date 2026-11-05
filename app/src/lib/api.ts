import { carregarManifestacionsAddicionals } from './documents'
import { pdfLliurament, pdfManifestacionsAddicionals, pdfRetorn } from './pdf'
import { BUCKET, supabase } from './supabase'
import type { ActaLliurament, ActaRetorn, Bicicleta, Cessio, CessioActa, Organitzacio } from './types'

const SELECT_CESSIO =
  '*, bicicletes(id,codi,marca,model,num_bastidor,num_serie_bateria,codi_cadenat,tipus,color,estat), clients(empresa,nom,logo_url)'

const ok = <T,>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

export const refCessio = (c: Pick<Cessio, 'id'>) => 'CES-' + c.id.slice(0, 8).toUpperCase()

export async function esAdmin(userId: string) {
  const r = await supabase.from('user_roles').select('role').eq('user_id', userId)
  return !!r.data?.some((x) => x.role === 'admin')
}

/**
 * Aquesta app només treballa amb el programa de l'Ajuntament de Sant Cugat. La taula `cessions`
 * és compartida amb el portal VAIC Renting, així que tot es filtra per aquesta organització.
 */
let _idPrograma: Promise<string | null> | null = null
export function idOrganitzacioPrograma() {
  _idPrograma ??= (async () => {
    const r = ok(
      await supabase.from('clients').select('id').eq('tipus', 'organitzacio')
        .ilike('empresa', 'Ajuntament de Sant Cugat%').order('created_at').limit(1),
    ) as { id: string }[]
    return r[0]?.id ?? null
  })().catch((e) => { _idPrograma = null; throw e })
  return _idPrograma
}

export async function llistarCessions(estat?: string) {
  const org = await idOrganitzacioPrograma()
  if (!org) return [] as Cessio[]
  let q = supabase.from('cessions').select(SELECT_CESSIO).eq('client_id', org).order('created_at', { ascending: false }).limit(200)
  if (estat) q = q.eq('estat', estat)
  return ok(await q) as Cessio[]
}

export async function getCessio(id: string) {
  const org = await idOrganitzacioPrograma()
  const r = ok(await supabase.from('cessions').select(SELECT_CESSIO).eq('id', id).eq('client_id', org ?? '').maybeSingle()) as Cessio | null
  if (!r) throw new Error("Aquesta cessió no és del programa de l'Ajuntament de Sant Cugat.")
  return r
}

export async function getActes(cessioId: string) {
  return ok(await supabase.from('cessio_actes').select('*').eq('cessio_id', cessioId)) as CessioActa[]
}

/** Darrera cessió d'aquest email, per omplir dades conegudes */
export async function cercarUsuariPerEmail(email: string) {
  const org = await idOrganitzacioPrograma()
  if (!org) return null
  const r = ok(
    await supabase.from('cessions').select('id, usuari_nom, usuari_dni, usuari_telefon, client_id')
      .eq('client_id', org).ilike('usuari_email', email.trim()).order('created_at', { ascending: false }).limit(1),
  ) as Pick<Cessio, 'id' | 'usuari_nom' | 'usuari_dni' | 'usuari_telefon' | 'client_id'>[]
  if (!r.length) return null
  const actes = await getActes(r[0].id)
  const l = actes.find((a) => a.fase === 'lliurament')?.dades as ActaLliurament | undefined
  return { ...r[0], escola_bressol: l?.escola_bressol, infant_unitat_familiar: l?.infant_unitat_familiar, infant2: l?.infant2, adult_nom: l?.adult_nom, adult_document: l?.adult_document }
}

/**
 * Bicis que l'organització té en contracte actiu (contractes.bicicleta_id o contracte_bicicletes)
 * i que no tenen cap cessió programada o activa. L'estat de la bici (assignada) no es toca mai:
 * les cessions són una capa per sobre del contracte.
 */
export async function cercarBicis(
  text: string, clientId: string | null, nomesPrograma: boolean, tipusPrograma: string[], excepteCessioId?: string | null,
) {
  if (!clientId) return [] as Bicicleta[]
  const contractes = ok(
    await supabase.from('contractes').select('id, bicicleta_id').eq('client_id', clientId).eq('estat', 'actiu'),
  ) as { id: string; bicicleta_id: string | null }[]
  if (!contractes.length) return [] as Bicicleta[]
  const ids = new Set(contractes.map((c) => c.bicicleta_id).filter(Boolean) as string[])
  const cb = ok(
    await supabase.from('contracte_bicicletes').select('bicicleta_id').in('contracte_id', contractes.map((c) => c.id)),
  ) as { bicicleta_id: string }[]
  cb.forEach((x) => ids.add(x.bicicleta_id))
  if (!ids.size) return [] as Bicicleta[]

  const ocupades = ok(
    await supabase.from('cessions').select('id, bicicleta_id').in('bicicleta_id', [...ids]).in('estat', ['programada', 'activa']),
  ) as { id: string; bicicleta_id: string }[]
  ocupades.filter((o) => o.id !== excepteCessioId).forEach((o) => ids.delete(o.bicicleta_id))
  if (!ids.size) return [] as Bicicleta[]

  let q = supabase.from('bicicletes')
    .select('id,codi,marca,model,num_bastidor,num_serie_bateria,codi_cadenat,tipus,color,estat')
    .in('id', [...ids]).not('estat', 'in', '(robada,venuda,fora_de_servei)').order('codi').limit(40)
  if (text.trim()) {
    const t = text.trim().replace(/[%,()]/g, '')
    q = q.or(`codi.ilike.%${t}%,model.ilike.%${t}%,marca.ilike.%${t}%,num_bastidor.ilike.%${t}%`)
  }
  if (nomesPrograma) q = q.or(tipusPrograma.map((x) => `tipus.ilike.%${x}%`).join(','))
  return ok(await q) as Bicicleta[]
}

/** Només l'organització del programa (Ajuntament de Sant Cugat). */
export async function llistarOrganitzacions() {
  const org = await idOrganitzacioPrograma()
  if (!org) return [] as Organitzacio[]
  const r = ok(
    await supabase.from('clients').select('id, empresa, nom, cognoms, logo_url').eq('id', org),
  ) as { id: string; empresa: string | null; nom: string | null; cognoms: string | null; logo_url: string | null }[]
  return r.map((c) => ({ id: c.id, nom: c.empresa || [c.nom, c.cognoms].filter(Boolean).join(' '), logo_url: c.logo_url })) as Organitzacio[]
}

async function pujar(path: string, file: Blob, contentType: string) {
  ok(await supabase.storage.from(BUCKET).upload(path, file, { contentType, upsert: true }))
  return path
}

async function pujarFotos(cessioId: string, fase: string, fotos: File[]) {
  const paths: string[] = []
  for (const [i, f] of fotos.entries()) {
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
    paths.push(await pujar(`${cessioId}/${fase}/foto-${i + 1}-${Date.now()}.${ext}`, f, f.type || 'image/jpeg'))
  }
  return paths
}

export type ResultatCorreu = { ok: true; a: string } | { ok: false; error: string }

/** Envia a la persona usuària el correu de l'acta signada (enllaç al portal). Mai fa fallar el procés. */
export async function notificarActa(cessioId: string, fase: 'lliurament' | 'retorn'): Promise<ResultatCorreu> {
  try {
    const { data, error } = await supabase.functions.invoke('longtails-notificar-acta', { body: { cessio_id: cessioId, fase } })
    if (error) {
      const cos = await (error as { context?: Response }).context?.json?.().catch(() => null)
      return { ok: false, error: cos?.error ?? error.message }
    }
    return data?.ok ? { ok: true, a: data.a } : { ok: false, error: data?.error ?? 'Error desconegut' }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Lliurament: crea (o actualitza una cessió programada), genera l'acta i les manifestacions addicionals (PDF), desa-ho tot. No toca l'estat de la bici. */
export async function finalitzarLliurament(params: {
  cessioId?: string | null
  clientId: string | null
  bici: Bicicleta
  acta: ActaLliurament
  fotos: File[]
}) {
  const { acta, bici } = params
  const camps = {
    bicicleta_id: bici.id,
    client_id: params.clientId,
    usuari_nom: acta.beneficiaria_nom,
    usuari_email: acta.beneficiaria_email.trim().toLowerCase(),
    usuari_dni: acta.beneficiaria_document,
    usuari_telefon: acta.beneficiaria_telefon,
    data_inici: acta.lliurament_data_hora.slice(0, 10),
    data_fi: acta.retorn_data_prevista || null,
    check_in: new Date(acta.lliurament_data_hora).toISOString(),
    estat: 'activa',
    acta_cessio_signada: true,
    signatura_cessio: acta.signatures.benef,
    data_signatura_cessio: new Date().toISOString(),
  }
  // 1) Primer es generen els documents (si falla, no s'ha escrit res a la base de dades).
  //    L'id de la cessió ve donat (cessió programada o id nou generat a la pantalla), de manera
  //    que si cal reintentar s'actualitza la mateixa cessió en lloc de crear-ne una altra.
  const cessio = { id: params.cessioId ?? crypto.randomUUID() }
  const ref = refCessio(cessio)
  // Text vigent de les manifestacions addicionals (Documentació). Se'n desa una còpia amb l'acta: és el que s'ha signat.
  const manifestacionsHtml = await carregarManifestacionsAddicionals().catch(() => null)
  const final: ActaLliurament = { ...acta, num_fotos: params.fotos.length, manifestacions_html: manifestacionsHtml ?? undefined }
  const pdfBlob = await pdfLliurament(final, ref)
  const pdfManifestacions = await pdfManifestacionsAddicionals(final, ref, manifestacionsHtml)

  // 2) Després es desa la cessió (insereix o actualitza), les fotos, els fitxers i l'acta.
  ok(await supabase.from('cessions').upsert({ id: cessio.id, ...camps }, { onConflict: 'id' }).select('id').single())
  const fotos = await pujarFotos(cessio.id, 'lliurament', params.fotos)
  const pdf_path = await pujar(`${cessio.id}/${ref}-acta-lliurament.pdf`, pdfBlob, 'application/pdf')
  final.manifestacions_pdf_path = await pujar(`${cessio.id}/${ref}-manifestacions-addicionals.pdf`, pdfManifestacions, 'application/pdf')

  ok(await supabase.from('cessio_actes').upsert(
    { cessio_id: cessio.id, fase: 'lliurament', dades: final, pdf_path, docx_path: null, fotos, signat_at: new Date().toISOString() },
    { onConflict: 'cessio_id,fase' },
  ))
  const correu = await notificarActa(cessio.id, 'lliurament')
  return { cessioId: cessio.id, pdfBlob, pdfManifestacions, correu }
}

/** Retorn: genera l'acta de devolució (Annex II) i tanca la cessió. No toca l'estat de la bici. */
export async function finalitzarRetorn(params: {
  cessio: Cessio; lliurament: ActaLliurament; acta: ActaRetorn; fotos: File[]
}) {
  const { cessio, lliurament, acta } = params
  const ref = refCessio(cessio)
  const fotos = await pujarFotos(cessio.id, 'retorn', params.fotos)
  const final = { ...acta, num_fotos: params.fotos.length }
  const pdfBlob = await pdfRetorn(lliurament, final, ref)
  const pdf_path = await pujar(`${cessio.id}/${ref}-acta-devolucio.pdf`, pdfBlob, 'application/pdf')

  ok(await supabase.from('cessio_actes').upsert(
    { cessio_id: cessio.id, fase: 'retorn', dades: final, pdf_path, docx_path: null, fotos, signat_at: new Date().toISOString() },
    { onConflict: 'cessio_id,fase' },
  ))
  ok(await supabase.from('cessions').update({
    estat: 'finalitzada',
    check_out: new Date(acta.retorn_data_hora).toISOString(),
    acta_retorn_signada: true,
    signatura_retorn: acta.signatures.persona,
    data_signatura_retorn: new Date().toISOString(),
  }).eq('id', cessio.id))
  const correu = await notificarActa(cessio.id, 'retorn')
  return { pdfBlob, correu }
}
