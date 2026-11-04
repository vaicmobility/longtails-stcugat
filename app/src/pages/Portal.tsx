import { useEffect, useState } from 'react'
import { useAuth } from '../components/Auth'
import { CapcaleraPublica } from '../components/Marca'
import { TextAnnexI, TextAnnexII, TextAnnexIII, TextDadesAjuntament, TextPrivacitat } from '../components/Documentacio'
import { PROGRAMA } from '../config'
import { obrirFitxer } from '../lib/fitxers'
import { data, dataHora, marcaModel } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Cessio, CessioActa } from '../lib/types'

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
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.6rem', alignItems: 'center' }}>
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
      options: { emailRedirectTo: `${window.location.origin}/portal`, shouldCreateUser: true },
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
  const [preinscrit, setPreinscrit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const e = email.trim().toLowerCase()
    Promise.all([
      supabase.from('cessions')
        .select('*, bicicletes(id,codi,marca,model,tipus,color,num_bastidor,num_serie_bateria,codi_cadenat,estat), cessio_actes(*)')
        .ilike('usuari_email', e).neq('estat', 'cancel·lada').order('created_at', { ascending: false }),
      supabase.from('preinscripcions').select('id').eq('email', e).eq('estat', 'pendent').limit(1),
    ]).then(([c, p]) => {
      if (c.error) throw new Error(c.error.message)
      setCessions((c.data ?? []).map((x) => ({ ...x, actes: x.cessio_actes ?? [] })) as CessioPortal[])
      setPreinscrit(!!p.data?.length)
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
          {preinscrit
            ? <p>Hem rebut la teva preinscripció. Quan es faci el lliurament de la bicicleta, aquí en veuràs les dades i la documentació signada.</p>
            : <p>No hi ha cap cessió de bicicleta associada al correu <strong>{email}</strong>. Si creus que és un error, contacta amb nosaltres a {PROGRAMA.canal.formulari}.</p>}
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
              {r?.pdf_path ? <button className="btn small" onClick={() => obrir(r.pdf_path)}>Acta de devolució (PDF)</button> : null}
              {(r ?? l)?.docx_path ? <button className="btn small" onClick={() => obrir((r ?? l)!.docx_path, 'annexos-cessio.docx')}>Annexos (Word)</button> : null}
            </div>
          </section>
        )
      })}

      <section className="card">
        <h2>Incidències</h2>
        <p>Per comunicar qualsevol incidència (avaria, accident, robatori, pèrdua…), fes-ho a través de <a href={PROGRAMA.canal.formulari} target="_blank" rel="noreferrer">{PROGRAMA.canal.formulari}</a>.</p>
      </section>

      <section className="card">
        <h2>Textos del programa</h2>
        <TextAnnexI />
        <TextAnnexII />
        <TextAnnexIII />
        <TextDadesAjuntament />
        <TextPrivacitat />
      </section>
    </div>
  )
}
