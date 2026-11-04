import { useState } from 'react'
import { Seccions } from '../components/Documentacio'
import { CapcaleraPublica } from '../components/Marca'
import { enviarPreinscripcio, type DadesPreinscripcio } from '../lib/preinscripcio'
import { POLITICA_PRIVACITAT } from '../lib/textos'

const buit: DadesPreinscripcio = { email: '', nom: '', document: '', telefon: '', escola_bressol: '', infant: '', adult_nom: '', adult_document: '' }

/** Formulari públic de preinscripció (sense login). */
export function Inscripcio() {
  const [d, setD] = useState(buit)
  const [privacitat, setPrivacitat] = useState(false)
  const [web, setWeb] = useState('') // camp trampa contra bots (ocult)
  const [enviant, setEnviant] = useState(false)
  const [fet, setFet] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof DadesPreinscripcio, v: string) => setD((x) => ({ ...x, [k]: v }))

  const errors: string[] = []
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) errors.push('correu electrònic vàlid')
  if (d.nom.trim().length < 2) errors.push('nom i cognoms')
  if (d.document.trim().length < 5) errors.push('DNI/NIE')
  if (d.adult_nom.trim() && d.adult_document.trim().length < 5) errors.push("DNI/NIE de l'altra persona adulta")
  if (!privacitat) errors.push('acceptar la política de privacitat')

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.length) { setError('Falta: ' + errors.join(', ') + '.'); return }
    if (web) { setFet(true); return }
    setEnviant(true)
    setError(null)
    try {
      await enviarPreinscripcio(d)
      setFet(true)
      window.scrollTo(0, 0)
    } catch (err) {
      setError((err as Error).message || "No s'ha pogut enviar. Torna-ho a provar.")
    } finally {
      setEnviant(false)
    }
  }

  return (
    <div className="content" style={{ maxWidth: 720 }}>
      <CapcaleraPublica />

      {fet ? (
        <section className="card">
          <h1>Preinscripció enviada</h1>
          <p>Gràcies, {d.nom.split(' ')[0] || 'hem rebut les teves dades'}. Hem rebut les teves dades.</p>
          <p className="muted">El dia del lliurament, a la botiga, només caldrà revisar-les, comprovar la bicicleta i signar l'acta. Porta el teu DNI/NIE.</p>
          <p className="muted">Després del lliurament podràs consultar la teva bicicleta i la documentació signada a <a href="/portal">el teu portal</a>, entrant amb aquest mateix correu.</p>
        </section>
      ) : (
        <form className="card" onSubmit={enviar} noValidate>
          <h1>Preinscripció</h1>
          <p className="muted">Omple les teves dades abans de venir a recollir la bicicleta. Així el lliurament serà molt més ràpid.</p>

          <div className="grid2 mt-s">
            <label className="span2">Correu electrònic *
              <input type="email" inputMode="email" autoComplete="email" value={d.email} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label>Nom i cognoms *<input autoComplete="name" value={d.nom} onChange={(e) => set('nom', e.target.value)} /></label>
            <label>DNI/NIE *<input value={d.document} onChange={(e) => set('document', e.target.value.toUpperCase())} /></label>
            <label>Telèfon<input type="tel" inputMode="tel" autoComplete="tel" value={d.telefon} onChange={(e) => set('telefon', e.target.value)} /></label>
            <label>Escola bressol municipal<input value={d.escola_bressol} onChange={(e) => set('escola_bressol', e.target.value)} /></label>
            <label className="span2">Infant matriculat / unitat familiar<input value={d.infant} onChange={(e) => set('infant', e.target.value)} /></label>
            <label>Altra persona adulta autoritzada (opcional)
              <input value={d.adult_nom} onChange={(e) => set('adult_nom', e.target.value)} placeholder="Nom i cognoms" />
            </label>
            <label>DNI/NIE de l'altra persona adulta{d.adult_nom.trim() ? ' *' : ''}
              <input value={d.adult_document} onChange={(e) => set('adult_document', e.target.value.toUpperCase())} />
            </label>
            <label aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>Web
              <input tabIndex={-1} autoComplete="off" value={web} onChange={(e) => setWeb(e.target.value)} />
            </label>
          </div>

          <h2 className="mt">Política de privacitat i protecció de dades</h2>
          <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10, padding: '.8rem 1rem', background: '#fff', fontSize: '.88rem', lineHeight: 1.45 }}>
            <Seccions seccions={POLITICA_PRIVACITAT} />
          </div>
          <label className="check">
            <input type="checkbox" checked={privacitat} onChange={(e) => setPrivacitat(e.target.checked)} />
            <span>Accepto la política de privacitat. *</span>
          </label>

          {error ? <div className="alert error mt-s">{error}</div> : null}
          <button className="btn primary big mt-s" disabled={enviant} style={{ width: '100%' }}>
            {enviant ? 'Enviant…' : 'Enviar preinscripció'}
          </button>
        </form>
      )}
    </div>
  )
}
