import { useEffect, useMemo } from 'react'
import type { ResultatCorreu } from '../lib/api'

type Extra = { titol: string; blob: Blob; nomFitxer: string }
type Props = { titol: string; text: string; pdfBlob: Blob; nomFitxer: string; onDetall: () => void; extres?: Extra[]; correu?: ResultatCorreu }

export function Resultat({ titol, text, pdfBlob, nomFitxer, onDetall, extres = [], correu }: Props) {
  const pdfUrl = useMemo(() => URL.createObjectURL(pdfBlob), [pdfBlob])
  useEffect(() => () => URL.revokeObjectURL(pdfUrl), [pdfUrl])

  const imprimir = () => {
    const w = window.open(pdfUrl, '_blank')
    if (w) setTimeout(() => { try { w.print() } catch { /* el visor del navegador té el seu botó d'imprimir */ } }, 800)
  }

  return (
    <div className="wizard">
      <section className="card done-card">
        <div className="done-icon">✓</div>
        <h1>{titol}</h1>
        <p>{text}</p>
        <p className="muted">{extres.length ? "Els documents s'han desat a la cessió." : "L'acta s'ha desat a la cessió."}</p>
        {correu ? (
          correu.ok
            ? <p className="alert info">✉ S'ha enviat un correu a <strong>{correu.a}</strong> amb l'enllaç al portal (longtail.vaic.com).</p>
            : <p className="alert error">No s'ha pogut enviar el correu a la persona usuària: {correu.error}</p>
        ) : null}
        <div className="actions">
          <button className="btn primary big" onClick={imprimir}>Imprimir / obrir PDF</button>
          <a className="btn big" href={pdfUrl} download={`${nomFitxer}.pdf`}>Descarregar PDF</a>
        </div>
        {extres.map((x) => <DocExtra key={x.nomFitxer} {...x} />)}
        <button className="btn ghost" onClick={onDetall}>Veure la cessió</button>
      </section>
      <iframe className="pdf-preview" title="Acta" src={pdfUrl} />
    </div>
  )
}

/** Document addicional (p. ex. manifestacions addicionals): obrir per imprimir o descarregar. */
function DocExtra({ titol, blob, nomFitxer }: Extra) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <div className="actions">
      <a className="btn big" href={url} target="_blank" rel="noreferrer">Obrir {titol} (PDF)</a>
      <a className="btn big" href={url} download={`${nomFitxer}.pdf`}>Descarregar</a>
    </div>
  )
}
