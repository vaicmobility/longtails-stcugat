import { useEffect, useState } from 'react'
import { EditorText } from '../components/EditorText'
import { dataHora } from '../lib/format'
import {
  canviarVisible, desarDocument, desarOrdre, esborrarDocument, llistarDocuments, netejarHtml, obrirPdfDocument, pujarPdfDocument,
  type DocumentPrograma,
} from '../lib/documents'

type Edicio = {
  id?: string; titol: string; contingut_html: string; visible: boolean; ordre: number
  mostrar_lliurament: boolean; mostrar_retorn: boolean; clau?: string | null
  fitxer_path: string | null; fitxer_nom: string | null; pdfNou?: File | null
}

/** Gestió dels textos del programa que es mostren al portal (només admin). No afecta els PDF de les actes. */
export function DocumentsPrograma() {
  const [docs, setDocs] = useState<DocumentPrograma[] | null>(null)
  const [edicio, setEdicio] = useState<Edicio | null>(null)
  const [desant, setDesant] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [obert, setObert] = useState<string | null>(null)

  const carregar = () => llistarDocuments().then(setDocs).catch((e) => setError(e.message))
  useEffect(() => { carregar() }, [])

  const moure = async (i: number, d: number) => {
    if (!docs) return
    const nous = [...docs]
    const j = i + d
    if (j < 0 || j >= nous.length) return
    ;[nous[i], nous[j]] = [nous[j], nous[i]]
    setDocs(nous)
    await desarOrdre(nous.map((x) => x.id)).catch((e) => setError(e.message))
  }

  const desar = async () => {
    if (!edicio) return
    if (!edicio.titol.trim()) { setError('Cal un títol.'); return }
    setDesant(true)
    setError(null)
    try {
      const pdf = edicio.pdfNou ? await pujarPdfDocument(edicio.pdfNou) : { fitxer_path: edicio.fitxer_path, fitxer_nom: edicio.fitxer_nom }
      await desarDocument({ ...edicio, ...pdf })
      setEdicio(null)
      await carregar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDesant(false)
    }
  }

  const esborrar = async (d: DocumentPrograma) => {
    if (!window.confirm(`Esborrar el text "${d.titol}"? Aquesta acció no es pot desfer.`)) return
    await esborrarDocument(d.id).catch((e) => setError(e.message))
    carregar()
  }

  if (edicio) {
    return (
      <div>
        <div className="page-head">
          <h1>{edicio.id ? 'Editar text' : 'Nou text'}</h1>
        </div>
        <section className="card">
          <label>Títol *<input value={edicio.titol} onChange={(e) => setEdicio({ ...edicio, titol: e.target.value })} /></label>
          <div className="mt-s" style={{ fontWeight: 600, marginBottom: '.3rem' }}>Text</div>
          <EditorText valor={edicio.contingut_html} onChange={(h) => setEdicio({ ...edicio, contingut_html: h })} />
          <p className="muted small">Pots enganxar text des de Word o d'una web: es manté el format bàsic (negretes, títols, llistes, enllaços) i es treu la resta.</p>
          <div className="mt-s" style={{ fontWeight: 600, marginBottom: '.3rem' }}>PDF adjunt (opcional)</div>
          <div className="card" style={{ padding: '.7rem .9rem', marginBottom: '.6rem', display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {edicio.pdfNou ? (
              <span style={{ flex: 1 }}>📄 {edicio.pdfNou.name} <span className="muted small">({Math.round(edicio.pdfNou.size / 1024)} KB, es pujarà en desar)</span></span>
            ) : edicio.fitxer_path ? (
              <span style={{ flex: 1 }}>📄 {edicio.fitxer_nom || 'document.pdf'}{' '}
                <button type="button" className="btn ghost small" onClick={() => obrirPdfDocument(edicio.fitxer_path!, edicio.fitxer_nom).catch((e) => setError(e.message))}>Obrir</button>
              </span>
            ) : <span className="muted" style={{ flex: 1 }}>Cap PDF adjunt.</span>}
            <label className="btn small" style={{ margin: 0 }}>
              {edicio.fitxer_path || edicio.pdfNou ? 'Substituir PDF' : 'Adjuntar PDF'}
              <input type="file" accept="application/pdf,.pdf" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setEdicio({ ...edicio, pdfNou: f }); e.target.value = '' }} />
            </label>
            {edicio.fitxer_path || edicio.pdfNou ? (
              <button type="button" className="btn ghost small" onClick={() => setEdicio({ ...edicio, pdfNou: null, fitxer_path: null, fitxer_nom: null })}>Treure PDF</button>
            ) : null}
          </div>
          <p className="muted small" style={{ marginTop: 0 }}>Al portal es mostrarà un botó per descarregar-lo. El text de dalt pot quedar buit si només vols el PDF.</p>
          <label className="check">
            <input type="checkbox" checked={edicio.visible} onChange={(e) => setEdicio({ ...edicio, visible: e.target.checked })} />
            <span>Visible al portal de les persones usuàries</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={edicio.mostrar_lliurament} onChange={(e) => setEdicio({ ...edicio, mostrar_lliurament: e.target.checked })} />
            <span>Mostrar per llegir durant l'acta de lliurament</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={edicio.mostrar_retorn} onChange={(e) => setEdicio({ ...edicio, mostrar_retorn: e.target.checked })} />
            <span>Mostrar per llegir durant l'acta de devolució (retorn)</span>
          </label>
          {edicio.clau === 'manifestacions_addicionals' ? (
            <p className="alert info small">Aquest text s'imprimeix al PDF de manifestacions addicionals que signa la persona beneficiària. Els canvis s'aplicaran als lliuraments que es facin a partir d'ara.</p>
          ) : null}
          {error ? <div className="alert error mt-s">{error}</div> : null}
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn ghost" onClick={() => { setEdicio(null); setError(null) }}>Cancel·lar</button>
            <button className="btn primary" disabled={desant} onClick={desar}>{desant ? 'Desant…' : 'Desar'}</button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <div className="page-head">
        <h1>Documentació del programa</h1>
        <button className="btn primary" onClick={() => setEdicio({ titol: '', contingut_html: '', visible: true, ordre: docs?.length ?? 0, fitxer_path: null, fitxer_nom: null, mostrar_lliurament: true, mostrar_retorn: false })}>+ Nou text</button>
      </div>
      <p className="muted">Textos que es mostren a les persones usuàries al portal, en aquest ordre, i per llegir abans de signar el lliurament o el retorn segons s'indiqui a cada text. Les manifestacions addicionals també s'imprimeixen al seu PDF; la resta no modifica les actes.</p>
      {error ? <div className="alert error">{error}</div> : null}
      {!docs ? <div className="muted">Carregant…</div> : null}
      {docs && !docs.length ? <div className="empty card">Encara no hi ha cap text. Mentrestant el portal mostra els textos per defecte.</div> : null}
      <div className="list">
        {docs?.map((d, i) => (
          <div className="card" key={d.id} style={{ opacity: d.visible ? 1 : 0.6 }}>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button className="btn ghost small" aria-label="Pujar" disabled={i === 0} onClick={() => moure(i, -1)}>▲</button>
                <button className="btn ghost small" aria-label="Baixar" disabled={i === docs.length - 1} onClick={() => moure(i, 1)}>▼</button>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="row-title">{i + 1}. {d.titol}</div>
                <div className="muted small">{d.visible ? 'Visible' : 'Ocult'}{d.mostrar_lliurament ? ' · Lliurament' : ''}{d.mostrar_retorn ? ' · Retorn' : ''}{d.clau === 'manifestacions_addicionals' ? ' · Va al PDF' : ''}{d.fitxer_path ? ' · 📄 PDF adjunt' : ''} · Actualitzat {dataHora(d.updated_at)}</div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <button className="btn small ghost" onClick={() => setObert(obert === d.id ? null : d.id)}>{obert === d.id ? 'Amagar' : 'Veure'}</button>
                <button className="btn small" onClick={() => setEdicio({ id: d.id, titol: d.titol, contingut_html: d.contingut_html, visible: d.visible, ordre: d.ordre, fitxer_path: d.fitxer_path, fitxer_nom: d.fitxer_nom, mostrar_lliurament: d.mostrar_lliurament, mostrar_retorn: d.mostrar_retorn, clau: d.clau })}>Editar</button>
                <button className="btn small ghost" onClick={async () => { await canviarVisible(d.id, !d.visible).catch((e) => setError(e.message)); carregar() }}>
                  {d.visible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button className="btn small ghost" onClick={() => esborrar(d)}>Esborrar</button>
              </div>
            </div>
            {obert === d.id ? (
              <div className="mt-s">
                <div className="text-doc" dangerouslySetInnerHTML={{ __html: netejarHtml(d.contingut_html) }} />
                {d.fitxer_path ? <button className="btn small mt-s" onClick={() => obrirPdfDocument(d.fitxer_path!, d.fitxer_nom).catch((e) => setError(e.message))}>Obrir el PDF ({d.fitxer_nom})</button> : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
