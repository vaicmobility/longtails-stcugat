// Textos del programa (taula programa_documents): títol + text formatat (HTML net), amb ordre i visibilitat.
import { supabase } from './supabase'

export type DocumentPrograma = {
  id: string
  titol: string
  contingut_html: string
  ordre: number
  visible: boolean
  mostrar_lliurament: boolean
  mostrar_retorn: boolean
  clau: string | null
  updated_at: string
  fitxer_path: string | null
  fitxer_nom: string | null
}

const BUCKET_PROGRAMA = 'programa'

const ok = <T,>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

/** Admin: tots. Persones usuàries: només els visibles (ho garanteix la RLS). */
export async function llistarDocuments() {
  return ok(await supabase.from('programa_documents').select('id,titol,contingut_html,ordre,visible,mostrar_lliurament,mostrar_retorn,clau,updated_at,fitxer_path,fitxer_nom')
    .order('ordre').order('created_at')) as DocumentPrograma[]
}

export async function desarDocument(d: Partial<DocumentPrograma> & { titol: string; contingut_html: string }) {
  const camps = {
    titol: d.titol.trim(), contingut_html: netejarHtml(d.contingut_html), visible: d.visible ?? true, ordre: d.ordre ?? 0,
    fitxer_path: d.fitxer_path ?? null, fitxer_nom: d.fitxer_nom ?? null,
    mostrar_lliurament: d.mostrar_lliurament ?? true, mostrar_retorn: d.mostrar_retorn ?? false,
  }
  if (d.id) return ok(await supabase.from('programa_documents').update(camps).eq('id', d.id).select().single()) as DocumentPrograma
  return ok(await supabase.from('programa_documents').insert(camps).select().single()) as DocumentPrograma
}

export async function canviarVisible(id: string, visible: boolean) {
  ok(await supabase.from('programa_documents').update({ visible }).eq('id', id))
}

export async function esborrarDocument(id: string) {
  ok(await supabase.from('programa_documents').delete().eq('id', id))
}

/** Desa l'ordre de la llista tal com es mostra (0, 1, 2…). */
export async function desarOrdre(ids: string[]) {
  await Promise.all(ids.map((id, i) => supabase.from('programa_documents').update({ ordre: i }).eq('id', id).then(ok)))
}

// ---------------------------------------------------------------- Manifestacions addicionals (s'imprimeixen en un PDF a part)
/** Text vigent de les manifestacions addicionals, tal com està a la Documentació. Null si no hi és. */
export async function carregarManifestacionsAddicionals(): Promise<string | null> {
  const r = ok(await supabase.from('programa_documents').select('contingut_html').eq('clau', 'manifestacions_addicionals').maybeSingle()) as { contingut_html: string } | null
  const html = r?.contingut_html?.trim()
  return html ? netejarHtml(html) : null
}

// ---------------------------------------------------------------- Reglament (s'imprimeix a l'acta de lliurament)
/** Text del Reglament a la Documentació. Es fa servir per imprimir-lo al PDF de l'acta, davant de l'Annex I. */
export const ID_REGLAMENT = '5e9a1c00-0000-4000-8000-00000000a001'

export type BlocReglament = { tipus: 'capitol' | 'article' | 'paragraf'; text: string }
export type Reglament = { titol: string; blocs: BlocReglament[] }

export async function carregarReglament(): Promise<Reglament> {
  const r = await supabase.from('programa_documents').select('titol, contingut_html').eq('id', ID_REGLAMENT).maybeSingle()
  if (r.error || !r.data?.contingut_html) throw new Error("No s'ha pogut carregar el text del Reglament per a l'acta. Torna-ho a provar.")
  const doc = new DOMParser().parseFromString(`<body>${r.data.contingut_html}</body>`, 'text/html')
  const blocs: BlocReglament[] = []
  const net = (t: string | null) => (t ?? '').replace(/\s+/g, ' ').trim()
  doc.body.childNodes.forEach((n) => {
    if (n.nodeType !== Node.ELEMENT_NODE) return
    const el = n as Element
    const tag = el.tagName.toUpperCase()
    if (tag === 'UL' || tag === 'OL') {
      el.querySelectorAll(':scope > li').forEach((li, i) => blocs.push({ tipus: 'paragraf', text: (tag === 'OL' ? `${i + 1}. ` : '• ') + net(li.textContent) }))
      return
    }
    const text = net(el.textContent)
    if (!text) return
    blocs.push({ tipus: tag === 'H3' ? 'capitol' : tag === 'H4' ? 'article' : 'paragraf', text })
  })
  return { titol: r.data.titol, blocs }
}

// ---------------------------------------------------------------- PDF adjunt
/** Puja un PDF al bucket privat `programa` (només admin) i en retorna la ruta i el nom original. */
export async function pujarPdfDocument(fitxer: File) {
  if (fitxer.type !== 'application/pdf' && !/\.pdf$/i.test(fitxer.name)) throw new Error('Només es poden adjuntar fitxers PDF.')
  if (fitxer.size > 25 * 1024 * 1024) throw new Error('El PDF no pot superar els 25 MB.')
  const path = `${crypto.randomUUID()}.pdf`
  ok(await supabase.storage.from(BUCKET_PROGRAMA).upload(path, fitxer, { contentType: 'application/pdf' }))
  return { fitxer_path: path, fitxer_nom: fitxer.name }
}

/** Obre (pestanya nova) o descarrega el PDF adjunt, amb la sessió de l'usuari. */
export async function obrirPdfDocument(path: string, nom: string | null, descarregar = false) {
  const finestra = descarregar ? null : window.open('', '_blank') // abans de l'await (bloqueig de popups)
  try {
    const { data: blob, error } = await supabase.storage.from(BUCKET_PROGRAMA).download(path)
    if (error || !blob) throw new Error(error?.message || "No s'ha pogut obrir el PDF")
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    if (finestra) finestra.location.href = url
    else {
      const a = document.createElement('a')
      a.href = url
      a.download = nom || 'document.pdf'
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    finestra?.close()
    throw e
  }
}

// ---------------------------------------------------------------- HTML net
const PERMESOS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H3', 'H4', 'A', 'BLOCKQUOTE'])
const FORA = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'HEAD', 'META', 'LINK', 'TITLE', 'svg', 'SVG'])

/** Deixa només etiquetes de format bàsiques, sense atributs (excepte href segurs als enllaços). */
export function netejarHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const net = (node: Node, desti: Node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) { desti.appendChild(document.createTextNode(n.textContent ?? '')); return }
      if (n.nodeType !== Node.ELEMENT_NODE) return
      const el = n as Element
      const tag = el.tagName.toUpperCase()
      if (FORA.has(el.tagName) || FORA.has(tag)) return
      let nou: Element | null = null
      if (PERMESOS.has(tag)) nou = document.createElement(tag === 'B' ? 'strong' : tag === 'I' ? 'em' : tag.toLowerCase())
      else if (['DIV', 'H1', 'H2', 'H5', 'H6', 'SECTION', 'ARTICLE'].includes(tag)) nou = document.createElement(/^H[12]$/.test(tag) ? 'h3' : 'p')
      if (nou && tag === 'A') {
        const href = el.getAttribute('href') ?? ''
        if (/^(https?:|mailto:|tel:)/i.test(href)) { nou.setAttribute('href', href); nou.setAttribute('target', '_blank'); nou.setAttribute('rel', 'noreferrer') }
      }
      net(el, nou ?? desti)
      if (nou) desti.appendChild(nou)
    })
  }
  const arrel = document.createElement('div')
  net(doc.body, arrel)
  return arrel.innerHTML.replace(/<p>\s*<\/p>/g, '').trim()
}
