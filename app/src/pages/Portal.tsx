import { useEffect, useState } from 'react'
import { useAuth } from '../components/Auth'
import { CapcaleraPublica } from '../components/Marca'
import { TextAnnexI, TextAnnexII, TextAnnexIII, TextDadesAjuntament, TextManifestacionsAddicionals, TextPrivacitat } from '../components/Documentacio'
import { DocumentacioPrograma } from '../components/DocumentacioPrograma'
import { PROGRAMA } from '../config'
import { obrirFitxer } from '../lib/fitxers'
import { data, dataHora, marcaModel } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { ActaLliurament, Cessio, CessioActa } from '../lib/types'

type CessioPortal = Cessio & { actes: CessioActa[] }

const ESTAT: Record<string, string> = {
  programada: 'Programada', activa: 'En curs', finalitzada: 'Finalitzada', 'cancel·lada': 'Cancel·lada',
}

/** Portal de la persona usuària: entra amb el seu correu (enllaç d'accés) i veu les seves cessions. */
export function Portal() {
  const { session, carregant } = useAuth()
  if (carregant) return <div className="center muted">Carregant…</div>
  return (
    <div className="content" style={{ maxWidth: 820 }}>
      <CapcaleraPublica>
        {session ? (
          <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
            <span className="muted small">{session.user.email}</span>
            <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>Sortir</button>
          </div>
        ) : null}
      </CapcaleraPublica>
      {session ? <LesMevesCessions email={session.user.email ?? ''} /> : <Acces />}
    </div>
  )
}

function Acces() {
  const [email, setEmail] = useState('')
  const [enviat, setEnviat] = useState(false)
  const [enviant, setEnviant] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Escriu un correu electrònic vàlid.'); return }
    setEnviant(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`, shouldCreateUser: true },
    })
    setEnviant(false)
    if (error) setError("No s'ha pogut enviar el correu. Torna-ho a provar d'aquí a uns minuts.")
    else setEnviat(true)
  }

  return (
    <form className="card" onSubmit={enviar} noValidate style={{ maxWidth: 480, margin: '2rem auto' }}>
      <h1>La meva bicicleta</h1>
      {enviat ? (
        <>
          <p>T'hem enviat un correu a <strong>{email}</strong> amb un enllaç per entrar.</p>
          <p className="muted">Obre'l des d'aquest mateix dispositiu. Si no el trobes, mira la carpeta de correu brossa.</p>
        </>
      ) : (
        <>
          <p className="muted">Escriu el correu electrònic que vas donar al lliurament de la bicicleta. Rebràs un enllaç per entrar, sense contrasenya.</p>
          <label>Correu electrònic<input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {error ? <div className="alert error mt-s">{error}</div> : null}
          <button className="btn primary mt-s" disabled={enviant} style={{ width: '100%' }}>{enviant ? 'Enviant…' : "Enviar l'enllaç d'accés"}</button>
        </>
      )}
    </form>
  )
}

function LesMevesCessions({ email }: { email: string }) {
  const [cessions, setCessions] = useState<CessioPortal[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const e = email.trim().toLowerCase()
    Promise.all([
      supabase.from('cessions')
        .select('*, bicicletes(id,codi,marca,model,tipus,color,num_bastidor,num_serie_bateria,codi_cadenat,estat), cessio_actes(*)')
        .ilike('usuari_email', e).neq('estat', 'cancel·lada').order('created_at', { ascending: false }),
    ]).then(([c]) => {
      if (c.error) throw new Error(c.error.message)
      setCessions((c.data ?? []).map((x) => ({ ...x, actes: x.cessio_actes ?? [] })) as CessioPortal[])
    }).catch((err) => setError(err.message))
  }, [email])

  const obrir = (path: string | null, nom?: string) => {
    if (path) obrirFitxer(path, nom).catch((e) => setError((e as Error).message))
  }

  if (error) return <div className="alert error">{error}</div>
  if (!cessions) return <div className="muted">Carregant…</div>

  return (
    <div>
      <h1>La meva bicicleta</h1>
      {!cessions.length ? (
        <div className="card">
          <p>Estem preparant la cessió de la teva bicicleta. Mentrestant, revisa i llegeix la documentació del programa per agilitzar els tràmits en el moment del lliurament.</p>
          <a className="btn small" href="#documentacio">Veure la documentació del programa</a>
        </div>
      ) : null}

      {cessions.map((c) => {
        const l = c.actes.find((a) => a.fase === 'lliurament')
        const r = c.actes.find((a) => a.fase === 'retorn')
        const b = c.bicicletes
        return (
          <section className="card" key={c.id}>
            <div className="page-head" style={{ marginBottom: '.6rem' }}>
              <h2 style={{ margin: 0 }}>{b?.codi ? `Bicicleta ${b.codi}` : 'Bicicleta'}</h2>
              <span className={`pill ${c.estat}`}>{ESTAT[c.estat] ?? c.estat}</span>
            </div>
            <dl className="resum">
              <dt>Model</dt><dd>{[marcaModel(b), b?.tipus, b?.color].filter(Boolean).join(' · ') || '—'}</dd>
              <dt>Inici de la cessió</dt><dd>{dataHora(c.check_in) || data(c.data_inici) || '—'}</dd>
              <dt>{c.check_out ? 'Retorn' : 'Retorn previst'}</dt><dd>{c.check_out ? dataHora(c.check_out) : data(c.data_fi) || '—'}</dd>
            </dl>

            <h2 className="mt">Documentació signada</h2>
            {!l && !r ? <p className="muted">Encara no hi ha documents signats.</p> : null}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {l?.pdf_path ? <button className="btn small" onClick={() => obrir(l.pdf_path)}>Acta de lliurament (PDF)</button> : null}
              {(l?.dades as ActaLliurament | undefined)?.manifestacions_pdf_path ? (
                <button className="btn small" onClick={() => obrir((l!.dades as ActaLliurament).manifestacions_pdf_path!)}>Manifestacions addicionals (PDF)</button>
              ) : null}
              {r?.pdf_path ? <button className="btn small" onClick={() => obrir(r.pdf_path)}>Acta de devolució (PDF)</button> : null}
            </div>
          </section>
        )
      })}

      <Incidencies cessions={cessions.filter((c) => c.estat === 'activa')} />

      <section className="card" id="documentacio">
        <h2>Documentació del programa</h2>
        <DocumentacioPrograma perDefecte={<><TextAnnexI /><TextManifestacionsAddicionals /><TextAnnexII /><TextAnnexIII /><TextDadesAjuntament /><TextPrivacitat /></>} />
      </section>
    </div>
  )
}

const CATEGORIA: Record<string, string> = {
  avaria: 'Avaria (mecànica o elèctrica)',
  accident: 'Accident',
  danys_tercers: 'Danys a terceres persones o béns',
  robatori_perdua: 'Robatori o pèrdua de la bicicleta',
  desperfecte_seguretat: 'Desperfecte que afecta la seguretat',
  perdua_material: 'Pèrdua de material (bateria, cadenat, claus…)',
}
const ESTAT_INC: Record<string, string> = { oberta: 'Rebuda', en_curs: 'En curs', resolta: 'Resolta' }

type Incidencia = { id: string; categoria: string; descripcio: string; estat: string; created_at: string }

function ContacteBotiga() {
  return (
    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
      <a className="btn" href={`tel:${PROGRAMA.canal.telefon.replace(/\s/g, '')}`}>Trucar a la botiga · {PROGRAMA.canal.telefon}</a>
      <a className="btn" href={`https://wa.me/${PROGRAMA.canal.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>
    </div>
  )
}

function Incidencies({ cessions }: { cessions: CessioPortal[] }) {
  const [obert, setObert] = useState(false)
  const [llista, setLlista] = useState<Incidencia[]>([])
  const [avis, setAvis] = useState<string | null>(null)

  const carregar = () => {
    if (!cessions.length) return
    supabase.from('incidencies').select('id,categoria,descripcio,estat,created_at')
      .in('cessio_id', cessions.map((c) => c.id)).order('created_at', { ascending: false })
      .then(({ data }) => setLlista((data ?? []) as Incidencia[]))
  }
  useEffect(carregar, [cessions.map((c) => c.id).join()])

  return (
    <section className="card">
      <h2>Incidències</h2>
      {cessions.length ? (
        <>
          <p>Si tens una avaria, un accident, un robatori o qualsevol altre problema amb la bicicleta, comunica-ho aquí.</p>
          <button className="btn primary" onClick={() => { setAvis(null); setObert(true) }}>Comunicar una incidència</button>
        </>
      ) : <p className="muted">Quan tinguis una bicicleta en cessió podràs comunicar incidències des d'aquí.</p>}
      {avis ? <div className="alert info mt-s">{avis}</div> : null}
      <p className="mt-s" style={{ marginBottom: '.5rem' }}>També pots contactar directament amb la botiga VAIC:</p>
      <ContacteBotiga />

      {llista.length ? (
        <>
          <h2 className="mt">Incidències comunicades</h2>
          <div className="list">
            {llista.map((i) => (
              <div key={i.id} style={{ borderTop: '1px solid var(--line)', padding: '.6rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                  <strong>{CATEGORIA[i.categoria] ?? i.categoria}</strong>
                  <span className="pill">{ESTAT_INC[i.estat] ?? i.estat}</span>
                </div>
                <div className="muted small">{dataHora(i.created_at)}</div>
                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{i.descripcio}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {obert ? (
        <DialegIncidencia
          cessions={cessions}
          onTancar={() => setObert(false)}
          onEnviada={() => { setObert(false); setAvis("Hem rebut la incidència. L'equip de VAIC es posarà en contacte amb tu."); carregar() }}
        />
      ) : null}
    </section>
  )
}

function DialegIncidencia({ cessions, onTancar, onEnviada }: { cessions: CessioPortal[]; onTancar: () => void; onEnviada: () => void }) {
  const [categories, setCategories] = useState<string[] | null>(null)
  const [cessioId, setCessioId] = useState(cessions[0]?.id ?? '')
  const [categoria, setCategoria] = useState('')
  const [descripcio, setDescripcio] = useState('')
  const [enviant, setEnviant] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.rpc('incidencia_categories').then(({ data, error }) => {
      if (error) setError("No s'han pogut carregar les categories.")
      setCategories((data as string[] | null) ?? Object.keys(CATEGORIA))
    })
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTancar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoria) { setError('Tria la categoria de la incidència.'); return }
    if (descripcio.trim().length < 10) { setError('Descriu una mica més què ha passat.'); return }
    setEnviant(true)
    setError(null)
    const { error } = await supabase.rpc('reportar_incidencia_portal', { p_cessio_id: cessioId, p_categoria: categoria, p_descripcio: descripcio })
    setEnviant(false)
    if (error) setError(error.message || "No s'ha pogut enviar. Torna-ho a provar o truca a la botiga.")
    else onEnviada()
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titol-incidencia" onClick={onTancar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
      <form className="card" onSubmit={enviar} noValidate onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', margin: 0 }}>
        <h2 id="titol-incidencia" style={{ marginTop: 0 }}>Comunicar una incidència</h2>
        {cessions.length > 1 ? (
          <label>Bicicleta
            <select value={cessioId} onChange={(e) => setCessioId(e.target.value)}>
              {cessions.map((c) => <option key={c.id} value={c.id}>{c.bicicletes?.codi ? `Bicicleta ${c.bicicletes.codi}` : 'Bicicleta'}</option>)}
            </select>
          </label>
        ) : null}
        <label className="mt-s">Categoria *
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={!categories}>
            <option value="">{categories ? 'Tria una categoria…' : 'Carregant…'}</option>
            {(categories ?? []).map((c) => <option key={c} value={c}>{CATEGORIA[c] ?? c}</option>)}
          </select>
        </label>
        <label className="mt-s">Descripció *
          <textarea rows={6} maxLength={4000} value={descripcio} onChange={(e) => setDescripcio(e.target.value)}
            placeholder="Explica què ha passat, quan i on, i en quin estat és ara la bicicleta." />
        </label>
        {error ? <div className="alert error mt-s">{error}</div> : null}
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn ghost" onClick={onTancar}>Cancel·lar</button>
          <button className="btn primary" disabled={enviant}>{enviant ? 'Enviant…' : 'Enviar incidència'}</button>
        </div>
        <div className="muted small mt" style={{ borderTop: '1px solid var(--line)', paddingTop: '.8rem', marginBottom: '.5rem' }}>
          Si és urgent o prefereixes parlar-ne, contacta amb la botiga VAIC:
        </div>
        <ContacteBotiga />
      </form>
    </div>
  )
}

