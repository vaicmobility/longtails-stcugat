import { useEffect, useState } from 'react'
import { EditorText } from '../components/EditorText'
import { dataHora } from '../lib/format'
import {
  canviarVisible, desarDocument, desarOrdre, esborrarDocument, llistarDocuments, netejarHtml, type DocumentPrograma,
} from '../lib/documents'

type Edicio = { id?: string; titol: string; contingut_html: string; visible: boolean; ordre: number }

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
      await desarDocument(edicio)
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
          <label className="check">
            <input type="checkbox" checked={edicio.visible} onChange={(e) => setEdicio({ ...edicio, visible: e.target.checked })} />
            <span>Visible al portal de les persones usuàries</span>
          </label>
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
        <button className="btn primary" onClick={() => setEdicio({ titol: '', contingut_html: '', visible: true, ordre: docs?.length ?? 0 })}>+ Nou text</button>
      </div>
      <p className="muted">Textos que es mostren a les persones usuàries al portal, en aquest ordre. Canviar-los no modifica les actes en PDF ni el Word.</p>
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
                <div className="muted small">{d.visible ? 'Visible' : 'Ocult'} · Actualitzat {dataHora(d.updated_at)}</div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <button className="btn small ghost" onClick={() => setObert(obert === d.id ? null : d.id)}>{obert === d.id ? 'Amagar' : 'Veure'}</button>
                <button className="btn small" onClick={() => setEdicio({ id: d.id, titol: d.titol, contingut_html: d.contingut_html, visible: d.visible, ordre: d.ordre })}>Editar</button>
                <button className="btn small ghost" onClick={async () => { await canviarVisible(d.id, !d.visible).catch((e) => setError(e.message)); carregar() }}>
                  {d.visible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button className="btn small ghost" onClick={() => esborrar(d)}>Esborrar</button>
              </div>
            </div>
            {obert === d.id ? <div className="text-doc mt-s" dangerouslySetInnerHTML={{ __html: netejarHtml(d.contingut_html) }} /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
