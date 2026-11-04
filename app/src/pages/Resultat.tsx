import { useEffect, useMemo } from 'react'

// El Word (plantilla de l'Ajuntament) es continua generant i desant internament, però no es mostra.
type Props = { titol: string; text: string; pdfBlob: Blob; wordBlob?: Blob; nomFitxer: string; onDetall: () => void }

export function Resultat({ titol, text, pdfBlob, nomFitxer, onDetall }: Props) {
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
        <p className="muted">L'acta s'ha desat a la cessió.</p>
        <div className="actions">
          <button className="btn primary big" onClick={imprimir}>Imprimir / obrir PDF</button>
          <a className="btn big" href={pdfUrl} download={`${nomFitxer}.pdf`}>Descarregar PDF</a>
        </div>
        <button className="btn ghost" onClick={onDetall}>Veure la cessió</button>
      </section>
      <iframe className="pdf-preview" title="Acta" src={pdfUrl} />
    </div>
  )
}
