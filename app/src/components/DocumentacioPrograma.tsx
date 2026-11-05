import { useEffect, useState, type ReactNode } from 'react'
import { llistarDocuments, netejarHtml, obrirPdfDocument, type DocumentPrograma } from '../lib/documents'
import { Text } from './Documentacio'

/**
 * Textos del programa gestionats des de la botiga (Documentació), amb els PDF adjunts.
 * Es fa servir al portal i abans de signar el lliurament. Si encara no hi ha cap text, mostra `perDefecte`.
 */
export function DocumentacioPrograma({ perDefecte, obrirPrimer, fase }: { perDefecte: ReactNode; obrirPrimer?: boolean; fase?: 'lliurament' | 'retorn' }) {
  const [docs, setDocs] = useState<DocumentPrograma[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    llistarDocuments()
      .then((d) => setDocs(d.filter((x) => x.visible && (!fase || (fase === 'lliurament' ? x.mostrar_lliurament : x.mostrar_retorn)))))
      .catch(() => setDocs([]))
  }, [fase])

  if (docs === null) return <div className="muted">Carregant…</div>
  if (!docs.length) return <>{perDefecte}</>

  const obrir = (d: DocumentPrograma, descarregar = false) => {
    setError(null)
    if (d.fitxer_path) obrirPdfDocument(d.fitxer_path, d.fitxer_nom, descarregar).catch((e) => setError((e as Error).message))
  }
  const ambPdf = docs.filter((d) => d.fitxer_path)

  return (
    <>
      {ambPdf.length ? (
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
          {ambPdf.map((d) => (
            <button key={d.id} type="button" className="btn primary small" onClick={() => obrir(d, true)}>
              ⬇ Descarregar {d.titol} (PDF)
            </button>
          ))}
        </div>
      ) : null}
      {error ? <div className="alert error" style={{ marginBottom: '.6rem' }}>{error}</div> : null}
      {docs.map((d, i) => (
        <Text key={d.id} titol={d.titol + (d.fitxer_path ? ' · PDF' : '')} obert={obrirPrimer && i === 0}>
          {d.contingut_html ? <div className="text-doc" dangerouslySetInnerHTML={{ __html: netejarHtml(d.contingut_html) }} /> : null}
          {d.fitxer_path ? (
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: d.contingut_html ? '.6rem' : 0 }}>
              <button type="button" className="btn small" onClick={() => obrir(d)}>Obrir el PDF</button>
              <button type="button" className="btn small ghost" onClick={() => obrir(d, true)}>Descarregar</button>
            </div>
          ) : null}
        </Text>
      ))}
    </>
  )
}
