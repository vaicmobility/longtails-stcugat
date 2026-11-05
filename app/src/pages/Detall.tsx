import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../components/Auth'
import { getActes, getCessio, refCessio } from '../lib/api'
import { BUCKET, supabase } from '../lib/supabase'
import { data, dataHora, identificacioBici, marcaModel } from '../lib/format'
import type { ActaLliurament, Cessio, CessioActa } from '../lib/types'

export function Detall() {
  const { id } = useParams()
  const { admin } = useAuth()
  const [c, setC] = useState<Cessio | null>(null)
  const [actes, setActes] = useState<CessioActa[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getCessio(id), getActes(id)]).then(([c, a]) => { setC(c); setActes(a) }).catch((e) => setError(e.message))
  }, [id])

  /**
   * Descarrega el fitxer amb la sessió de l'usuari (sense enllaços compartibles):
   * el contingut arriba com a blob i s'obre amb una URL local (blob:) que només funciona en aquest navegador.
   */
  const obrir = async (path: string | null, nom?: string) => {
    if (!path) return
    const esPdf = path.toLowerCase().endsWith('.pdf')
    const finestra = esPdf || !nom ? window.open('', '_blank') : null // obrir abans de l'await (bloqueig de popups)
    try {
      const { data: blob, error } = await supabase.storage.from(BUCKET).download(path)
      if (error || !blob) throw new Error(error?.message || "No s'ha pogut descarregar el fitxer")
      const url = URL.createObjectURL(blob)
      if (finestra) {
        finestra.location.href = url
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = nom || path.split('/').pop() || 'document'
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      finestra?.close()
      setError((e as Error).message)
    }
  }

  if (error) return <div className="alert error">{error}</div>
  if (!c) return <div className="muted">Carregant…</div>
  const l = actes.find((a) => a.fase === 'lliurament')
  const r = actes.find((a) => a.fase === 'retorn')
  const ld = l?.dades as ActaLliurament | undefined
  const org = c.clients?.empresa || c.clients?.nom

  return (
    <div className="wizard">
      <p><Link to="/botiga">← Cessions</Link></p>
      <div className="page-head">
        <h1>{c.usuari_nom} <span className="muted">· {refCessio(c)}</span></h1>
        <span className={`pill ${c.estat}`}>{c.estat}</span>
      </div>
      <div className="grid2">
        <section className="card">
          <h2>Persona</h2>
          <dl className="resum">
            <dt>Email</dt><dd>{c.usuari_email}</dd>
            <dt>DNI/NIE</dt><dd>{c.usuari_dni}</dd>
            <dt>Telèfon</dt><dd>{c.usuari_telefon}</dd>
            {org ? <><dt>Organització</dt><dd>{org}</dd></> : null}
            {ld?.escola_bressol ? <><dt>Escola bressol</dt><dd>{ld.escola_bressol}</dd></> : null}
            {ld?.adult_nom ? <><dt>Adult autoritzat</dt><dd>{ld.adult_nom}</dd></> : null}
          </dl>
        </section>
        <section className="card">
          <h2>Bicicleta i dates</h2>
          <dl className="resum">
            <dt>Bicicleta</dt><dd>{c.bicicletes?.codi} · {marcaModel(c.bicicletes)}</dd>
            <dt>Identificació</dt><dd>{identificacioBici(c.bicicletes)}</dd>
            <dt>Lliurament</dt><dd>{dataHora(c.check_in) || data(c.data_inici)}</dd>
            <dt>Retorn previst</dt><dd>{data(c.data_fi)}</dd>
            {c.check_out ? <><dt>Retornada</dt><dd>{dataHora(c.check_out)}</dd></> : null}
          </dl>
        </section>
      </div>

      <section className="card">
        <h2>Documents</h2>
        {!actes.length ? <p className="muted">Encara no hi ha actes generades.</p> : null}
        <div className="docs">
          {l ? (
            <div className="doc">
              <div><strong>Acta de lliurament (Annex I)</strong><div className="muted small">Signada {dataHora(l.signat_at)} · {l.fotos.length} fotos</div></div>
              <button className="btn small" onClick={() => obrir(l.pdf_path)}>PDF</button>
            </div>
          ) : null}
          {ld?.manifestacions_pdf_path ? (
            <div className="doc">
              <div><strong>Manifestacions addicionals</strong><div className="muted small">Signades amb l'acta de lliurament</div></div>
              <button className="btn small" onClick={() => obrir(ld.manifestacions_pdf_path!)}>PDF</button>
            </div>
          ) : null}
          {r ? (
            <div className="doc">
              <div><strong>Acta de devolució (Annex II)</strong><div className="muted small">Signada {dataHora(r.signat_at)} · {r.fotos.length} fotos</div></div>
              <button className="btn small" onClick={() => obrir(r.pdf_path)}>PDF</button>
            </div>
          ) : null}
        </div>
        {[...(l?.fotos ?? []), ...(r?.fotos ?? [])].length ? (
          <>
            <h2 className="mt">Fotos</h2>
            <div className="chips">
              {[...(l?.fotos ?? []).map((p) => ['Lliurament', p]), ...(r?.fotos ?? []).map((p) => ['Retorn', p])].map(([f, p], i) => (
                <button key={p} className="btn ghost small" onClick={() => obrir(p)}>{f} {i + 1}</button>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <div className="actions">
        {admin && c.estat === 'programada' ? <Link className="btn primary" to={`/botiga/nova?cessio=${c.id}`}>Fer lliurament</Link> : null}
        {admin && c.estat === 'activa' && l ? <Link className="btn primary" to={`/botiga/retorn/${c.id}`}>Registrar retorn</Link> : null}
      </div>
    </div>
  )
}
