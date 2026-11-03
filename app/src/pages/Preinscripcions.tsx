import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { data } from '../lib/format'
import { llistarPreinscripcions, marcarPreinscripcio, type Preinscripcio } from '../lib/preinscripcio'

const FILTRES = [['pendent', 'Pendents'], ['convertida', 'Amb cessió'], ['descartada', 'Descartades'], ['', 'Totes']] as const

export function Preinscripcions() {
  const [estat, setEstat] = useState<string>('pendent')
  const [text, setText] = useState('')
  const [llista, setLlista] = useState<Preinscripcio[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const carregar = () => {
    setLlista(null)
    llistarPreinscripcions(estat || undefined).then(setLlista).catch((e) => setError(e.message))
  }
  useEffect(carregar, [estat])

  const descartar = async (p: Preinscripcio) => {
    if (!window.confirm(`Descartar la preinscripció de ${p.nom}?`)) return
    await marcarPreinscripcio(p.id, 'descartada').catch((e) => setError(e.message))
    carregar()
  }

  const t = text.trim().toLowerCase()
  const visibles = (llista ?? []).filter((p) =>
    !t || [p.nom, p.email, p.document, p.escola_bressol].some((x) => x?.toLowerCase().includes(t)))

  return (
    <div>
      <div className="page-head">
        <h1>Preinscripcions</h1>
        <a className="btn" href="/inscripcio" target="_blank" rel="noreferrer">Obrir formulari públic ↗</a>
      </div>
      <div className="toolbar">
        <div className="seg">
          {FILTRES.map(([v, l]) => <button key={v} className={estat === v ? 'on' : ''} onClick={() => setEstat(v)}>{l}</button>)}
        </div>
        <input placeholder="Cerca per nom, email, DNI o escola…" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      {!llista ? <div className="muted">Carregant…</div> : null}
      {llista && !visibles.length ? <div className="empty card">No hi ha preinscripcions amb aquest filtre.</div> : null}
      <div className="list">
        {visibles.map((p) => (
          <div className="row card" key={p.id}>
            <div className="row-main">
              <div className="row-title">{p.nom}</div>
              <div className="muted small">
                {p.email} · {p.document}{p.telefon ? ` · ${p.telefon}` : ''}
                {p.escola_bressol ? ` · ${p.escola_bressol}` : ''} · {data(p.created_at)}
              </div>
            </div>
            <span className="pill">{p.estat}</span>
            <div className="row-actions" style={{ display: 'flex', gap: '.4rem' }}>
              {p.estat === 'pendent' ? (
                <>
                  <Link className="btn primary small" to={`/botiga/nova?preinscripcio=${p.id}`}>Fer lliurament</Link>
                  <button className="btn ghost small" onClick={() => descartar(p)}>Descartar</button>
                </>
              ) : null}
              {p.cessio_id ? <Link className="btn small" to={`/botiga/cessio/${p.cessio_id}`}>Veure cessió</Link> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
