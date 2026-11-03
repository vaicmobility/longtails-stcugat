import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../components/Auth'
import { llistarCessions, refCessio } from '../lib/api'
import { data, marcaModel } from '../lib/format'
import type { Cessio } from '../lib/types'

const FILTRES = [
  ['', 'Totes'],
  ['programada', 'Programades'],
  ['activa', 'Actives'],
  ['finalitzada', 'Finalitzades'],
] as const

export function Cessions() {
  const { admin } = useAuth()
  const [estat, setEstat] = useState<string>('')
  const [text, setText] = useState('')
  const [cessions, setCessions] = useState<Cessio[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCessions(null)
    llistarCessions(estat || undefined).then(setCessions).catch((e) => setError(e.message))
  }, [estat])

  const t = text.trim().toLowerCase()
  const visibles = (cessions ?? []).filter((c) =>
    !t || [c.usuari_nom, c.usuari_email, c.usuari_dni, c.bicicletes?.codi].some((x) => x?.toLowerCase().includes(t)))

  return (
    <div>
      <div className="page-head">
        <h1>Cessions</h1>
        {admin ? <Link to="/botiga/nova" className="btn primary">+ Nou lliurament</Link> : null}
      </div>
      <div className="toolbar">
        <div className="seg">
          {FILTRES.map(([v, l]) => <button key={v} className={estat === v ? 'on' : ''} onClick={() => setEstat(v)}>{l}</button>)}
        </div>
        <input placeholder="Cerca per nom, email, DNI o codi de bici…" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      {!cessions ? <div className="muted">Carregant…</div> : null}
      {cessions && !visibles.length ? <div className="empty card">Encara no hi ha cessions amb aquest filtre.</div> : null}
      <div className="list">
        {visibles.map((c) => (
          <div className="row card" key={c.id}>
            <div className="row-main">
              <Link to={`/botiga/cessio/${c.id}`} className="row-title">{c.usuari_nom || c.usuari_email || '(sense nom)'}</Link>
              <div className="muted small">
                {refCessio(c)} · {c.bicicletes?.codi} {marcaModel(c.bicicletes)} · {data(c.data_inici)} → {data(c.data_fi)}
              </div>
            </div>
            <span className={`pill ${c.estat}`}>{c.estat}</span>
            <div className="row-actions">
              {admin && c.estat === 'programada' ? <Link className="btn primary small" to={`/botiga/nova?cessio=${c.id}`}>Fer lliurament</Link> : null}
              {admin && c.estat === 'activa' ? <Link className="btn primary small" to={`/botiga/retorn/${c.id}`}>Retorn</Link> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
