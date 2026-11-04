import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Fotos, Steps } from '../components/Layout'
import { SignaturePad } from '../components/SignaturePad'
import { TextAnnexI, TextAnnexIII, TextDadesAjuntament } from '../components/Documentacio'
import { DocumentacioPrograma } from '../components/DocumentacioPrograma'
import { ELEMENTS_PER_DEFECTE, ESTATS_ELEMENT, PROGRAMA, canalResum } from '../config'
import { cercarBicis, cercarUsuariPerEmail, finalitzarLliurament, getCessio, llistarOrganitzacions } from '../lib/api'
import { ara, identificacioBici, marcaModel } from '../lib/format'
import { darreraPreinscripcio, getPreinscripcio, marcarPreinscripcio, type Preinscripcio } from '../lib/preinscripcio'
import type { ActaLliurament, Bicicleta, ElementLliurat, Organitzacio } from '../lib/types'
import { Resultat } from './Resultat'

const PASSOS = ['Persona', 'Bicicleta', 'Elements i fotos', 'Signatures', 'Document']

const identificacioPerDefecte = (el: string, b: Bicicleta | null) => {
  if (!b) return ''
  if (el === 'Bicicleta') return [b.codi, b.num_bastidor && `Bastidor ${b.num_bastidor}`].filter(Boolean).join(' · ')
  if (el === 'Bateria') return b.num_serie_bateria ?? ''
  if (el === 'Cadenat') return b.codi_cadenat ? `Codi ${b.codi_cadenat}` : ''
  return ''
}

const actaBuida = (): ActaLliurament => ({
  servei_gestor: PROGRAMA.servei_gestor,
  escola_bressol: '',
  beneficiaria_nom: '',
  beneficiaria_document: '',
  beneficiaria_telefon: '',
  beneficiaria_email: '',
  adult_nom: '',
  adult_document: '',
  infant_unitat_familiar: '',
  lliurament_data_hora: ara(),
  lliurament_lloc: PROGRAMA.lloc_lliurament,
  retorn_data_prevista: '',
  retorn_lloc_horari: PROGRAMA.lloc_horari_retorn,
  canal_incidencies: canalResum(),
  bici_marca_model: '',
  bici_identificacio: '',
  elements: ELEMENTS_PER_DEFECTE.map((element) => ({
    element, identificacio: /^cadireta/i.test(element) ? '2 unitats' : '', estat: 'Correcte', conforme: true,
  })),
  observacions: '',
  num_fotos: 0,
  tecnic_nom: localStorage.getItem('vaic_tecnic_nom') ?? '',
  signatures: { benef: null, adult: null, tecnic: null },
})

export function Lliurament() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const cessioId = params.get('cessio')
  const [preinsId, setPreinsId] = useState<string | null>(params.get('preinscripcio'))
  const [pas, setPas] = useState(0)
  const [a, setA] = useState<ActaLliurament>(actaBuida)
  const [clientId, setClientId] = useState<string | null>(null)
  const [orgs, setOrgs] = useState<Organitzacio[]>([])
  const [bici, setBici] = useState<Bicicleta | null>(null)
  const [fotos, setFotos] = useState<File[]>([])
  const [avis, setAvis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [desant, setDesant] = useState(false)
  const [resultat, setResultat] = useState<{ cessioId: string; pdfBlob: Blob; wordBlob: Blob } | null>(null)
  const idNou = useRef(crypto.randomUUID()) // id estable: els reintents no dupliquen la cessió

  const set = <K extends keyof ActaLliurament>(k: K, v: ActaLliurament[K]) => setA((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    llistarOrganitzacions().then(setOrgs).catch(() => {})
  }, [])

  // Organització del programa per defecte quan les dades venen d'una preinscripció
  const orgPrograma = () => orgs.find((o) => /ajuntament/i.test(o.nom) && /sant cugat/i.test(o.nom))?.id ?? null

  const aplicarPreinscripcio = (p: Preinscripcio) => {
    setPreinsId(p.id)
    setA((x) => ({
      ...x,
      beneficiaria_email: p.email,
      beneficiaria_nom: p.nom,
      beneficiaria_document: p.document,
      beneficiaria_telefon: p.telefon ?? x.beneficiaria_telefon,
      escola_bressol: p.escola_bressol ?? x.escola_bressol,
      infant_unitat_familiar: p.infant_unitat_familiar ?? x.infant_unitat_familiar,
      adult_nom: p.adult_nom ?? x.adult_nom,
      adult_document: p.adult_document ?? x.adult_document,
      servei_gestor: p.servei_gestor ?? x.servei_gestor,
      retorn_data_prevista: p.data_retorn_prevista ?? x.retorn_data_prevista,
      lliurament_lloc: p.lloc_lliurament ?? x.lliurament_lloc,
      retorn_lloc_horari: p.lloc_retorn ?? x.retorn_lloc_horari,
    }))
    setAvis(`${p.num_assignacio ? `Assignació núm. ${p.num_assignacio} · ` : ''}Dades de la preinscripció del ${new Date(p.created_at).toLocaleDateString('ca-ES')}. Revisa-les amb la persona.`)
  }

  useEffect(() => {
    const id = params.get('preinscripcio')
    if (!id || cessioId) return
    getPreinscripcio(id).then(aplicarPreinscripcio).catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!clientId && orgs.length) setClientId(orgPrograma() ?? orgs[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preinsId, orgs])

  // Cessió programada des de l'app interna: omplim dades
  useEffect(() => {
    if (!cessioId) return
    getCessio(cessioId).then((c) => {
      setA((x) => ({
        ...x,
        beneficiaria_nom: c.usuari_nom ?? '',
        beneficiaria_email: c.usuari_email ?? '',
        beneficiaria_document: c.usuari_dni ?? '',
        beneficiaria_telefon: c.usuari_telefon ?? '',
        retorn_data_prevista: c.data_fi ?? '',
      }))
      setClientId(c.client_id)
      if (c.bicicletes) triaBici(c.bicicletes)
    }).catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cessioId])

  const buscarEmail = async () => {
    if (!a.beneficiaria_email.includes('@')) return
    const p = await darreraPreinscripcio(a.beneficiaria_email).catch(() => null)
    if (p) { aplicarPreinscripcio(p); return }
    const u = await cercarUsuariPerEmail(a.beneficiaria_email).catch(() => null)
    if (!u) { setAvis('Usuari nou: omple les seves dades.'); return }
    setA((x) => ({
      ...x,
      beneficiaria_nom: x.beneficiaria_nom || u.usuari_nom || '',
      beneficiaria_document: x.beneficiaria_document || u.usuari_dni || '',
      beneficiaria_telefon: x.beneficiaria_telefon || u.usuari_telefon || '',
      escola_bressol: x.escola_bressol || u.escola_bressol || '',
      infant_unitat_familiar: x.infant_unitat_familiar || u.infant_unitat_familiar || '',
      adult_nom: x.adult_nom || u.adult_nom || '',
      adult_document: x.adult_document || u.adult_document || '',
    }))
    if (!clientId && u.client_id) setClientId(u.client_id)
    setAvis('Usuari conegut: dades omplertes a partir de la seva darrera cessió. Revisa-les.')
  }

  function triaBici(b: Bicicleta) {
    setBici(b)
    setA((x) => ({
      ...x,
      bici_marca_model: marcaModel(b),
      bici_identificacio: identificacioBici(b),
      elements: x.elements.map((e) => ({ ...e, identificacio: e.identificacio || identificacioPerDefecte(e.element, b) })),
    }))
  }

  const errorsPas = useMemo(() => {
    const e: string[] = []
    if (pas === 0) {
      if (!/^\S+@\S+\.\S+$/.test(a.beneficiaria_email)) e.push('Correu electrònic vàlid')
      if (!a.beneficiaria_nom.trim()) e.push('Nom i cognoms')
      if (!a.beneficiaria_document.trim()) e.push('DNI/NIE')
      if (!clientId) e.push('Organització')
      if (a.adult_nom.trim() && (a.adult_document ?? '').trim().length < 5) e.push("DNI/NIE de l'adult autoritzat")
    }
    if (pas === 1) {
      if (!bici) e.push('Tria una bicicleta')
      if (!a.retorn_data_prevista) e.push('Data prevista de retorn')
    }
    if (pas === 2 && !a.elements.length) e.push('Com a mínim un element')
    if (pas === 3) {
      if (!a.tecnic_nom.trim()) e.push('Nom i càrrec del tècnic VAIC')
      if (!a.signatures.benef) e.push('Signatura de la persona beneficiària')
      if (a.adult_nom.trim() && !a.signatures.adult) e.push("Signatura de l'adult autoritzat")
      if (!a.signatures.tecnic) e.push('Signatura del tècnic VAIC')
      if (!a.documentacio_llegida_at) e.push('Confirmar la lectura de la documentació')
    }
    return e
  }, [pas, a, bici, clientId])

  const seguent = () => { if (!errorsPas.length) { setPas(pas + 1); window.scrollTo(0, 0) } }

  const generar = async () => {
    if (!bici) return
    setDesant(true)
    setError(null)
    try {
      localStorage.setItem('vaic_tecnic_nom', a.tecnic_nom)
      const r = await finalitzarLliurament({ cessioId: cessioId ?? idNou.current, clientId, bici, acta: a, fotos })
      if (preinsId) await marcarPreinscripcio(preinsId, 'convertida', r.cessioId).catch(() => {})
      setResultat(r)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDesant(false)
    }
  }

  if (resultat)
    return (
      <Resultat titol="Lliurament completat" text={`La bicicleta ${bici?.codi ?? ''} queda cedida a ${a.beneficiaria_nom}.`}
        pdfBlob={resultat.pdfBlob} wordBlob={resultat.wordBlob} nomFitxer={`acta-lliurament-${bici?.codi ?? ''}`}
        onDetall={() => nav(`/botiga/cessio/${resultat.cessioId}`)} />
    )

  const updEl = (i: number, p: Partial<ElementLliurat>) =>
    set('elements', a.elements.map((e, j) => (j === i ? { ...e, ...p } : e)))

  return (
    <div className="wizard">
      <h1>Nou lliurament <span className="muted">· Annex I</span></h1>
      <Steps steps={PASSOS} actual={pas} onGo={setPas} />

      {pas === 0 && (
        <section className="card">
          <h2>Persona que rep la bicicleta</h2>
          <div className="grid2">
            <label className="span2">Correu electrònic *
              <div className="inline">
                <input type="email" inputMode="email" value={a.beneficiaria_email} autoFocus
                  onChange={(e) => set('beneficiaria_email', e.target.value)} onBlur={buscarEmail} placeholder="nom@exemple.cat" />
                <button type="button" className="btn" onClick={buscarEmail}>Buscar</button>
              </div>
            </label>
            {avis ? <div className="alert info span2">{avis}</div> : null}
            <label>Nom i cognoms *<input value={a.beneficiaria_nom} onChange={(e) => set('beneficiaria_nom', e.target.value)} /></label>
            <label>DNI/NIE o document *<input value={a.beneficiaria_document} onChange={(e) => set('beneficiaria_document', e.target.value.toUpperCase())} /></label>
            <label>Telèfon<input type="tel" inputMode="tel" value={a.beneficiaria_telefon} onChange={(e) => set('beneficiaria_telefon', e.target.value)} /></label>
            <label>Organització *
              <select value={clientId ?? ''} onChange={(e) => setClientId(e.target.value || null)}>
                <option value="">— Sense organització —</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
              </select>
            </label>
            <label>Escola bressol municipal<input value={a.escola_bressol} onChange={(e) => set('escola_bressol', e.target.value)} /></label>
            <label>Infant matriculat / unitat familiar<input value={a.infant_unitat_familiar} onChange={(e) => set('infant_unitat_familiar', e.target.value)} /></label>
            <label>Altra persona adulta autoritzada (opcional)
              <input value={a.adult_nom} onChange={(e) => set('adult_nom', e.target.value)} placeholder="Nom i cognoms" />
            </label>
            <label>DNI/NIE de l'adult autoritzat{a.adult_nom.trim() ? ' *' : ''}
              <input value={a.adult_document ?? ''} onChange={(e) => set('adult_document', e.target.value.toUpperCase())} />
            </label>
            <label className="span2">Ajuntament / servei gestor<input value={a.servei_gestor} onChange={(e) => set('servei_gestor', e.target.value)} /></label>
          </div>
        </section>
      )}

      {pas === 1 && (
        <section className="card">
          <h2>Bicicleta assignada</h2>
          <BiciPicker seleccionada={bici} onTria={triaBici} clientId={clientId} cessioId={cessioId} />
          <h2 className="mt">Lliurament i retorn</h2>
          <div className="grid2">
            <label>Data i hora de lliurament<input type="datetime-local" value={a.lliurament_data_hora} onChange={(e) => set('lliurament_data_hora', e.target.value)} /></label>
            <label>Lloc de lliurament<input value={a.lliurament_lloc} onChange={(e) => set('lliurament_lloc', e.target.value)} /></label>
            <label>Data prevista de retorn *<input type="date" value={a.retorn_data_prevista} onChange={(e) => set('retorn_data_prevista', e.target.value)} /></label>
            <label>Lloc i horari de retorn<input value={a.retorn_lloc_horari} onChange={(e) => set('retorn_lloc_horari', e.target.value)} /></label>
            <label className="span2">Canal de comunicació d'incidències<input value={a.canal_incidencies} onChange={(e) => set('canal_incidencies', e.target.value)} /></label>
          </div>
        </section>
      )}

      {pas === 2 && (
        <section className="card">
          <h2>Relació d'elements lliurats</h2>
          <div className="elements">
            {a.elements.map((e, i) => (
              <div className="element" key={i}>
                <input className="el-nom" value={e.element} onChange={(ev) => updEl(i, { element: ev.target.value })} aria-label="Element" />
                <input className="el-id" value={e.identificacio} placeholder="Identificació / observacions" onChange={(ev) => updEl(i, { identificacio: ev.target.value })} />
                <select value={e.estat} onChange={(ev) => updEl(i, { estat: ev.target.value })} aria-label="Estat aparent">
                  {ESTATS_ELEMENT.map((x) => <option key={x}>{x}</option>)}
                </select>
                <label className="toggle"><input type="checkbox" checked={e.conforme} onChange={(ev) => updEl(i, { conforme: ev.target.checked })} /> Conforme</label>
                <button type="button" className="btn ghost small" aria-label="Treure" onClick={() => set('elements', a.elements.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn small" onClick={() => set('elements', [...a.elements, { element: '', identificacio: '', estat: 'Correcte', conforme: true }])}>+ Afegir element</button>
          <label className="mt">Observacions sobre l'estat de conservació i funcionament
            <textarea rows={3} value={a.observacions} onChange={(e) => set('observacions', e.target.value)} />
          </label>
          <h2 className="mt">Fotografies</h2>
          <Fotos fotos={fotos} onChange={setFotos} />
        </section>
      )}

      {pas === 3 && (
        <section className="card">
          <h2>Revisió i signatures</h2>
          <dl className="resum">
            <dt>Persona beneficiària</dt><dd>{a.beneficiaria_nom} · {a.beneficiaria_document}</dd>
            <dt>Bicicleta</dt><dd>{a.bici_marca_model} · {a.bici_identificacio}</dd>
            <dt>Retorn previst</dt><dd>{a.retorn_data_prevista}</dd>
            <dt>Elements</dt><dd>{a.elements.map((e) => e.element).join(', ')}</dd>
            <dt>Fotos</dt><dd>{fotos.length}</dd>
          </dl>
          <h2 className="mt">Documentació per llegir abans de signar</h2>
          <DocumentacioPrograma obrirPrimer perDefecte={<><TextAnnexI obert /><TextAnnexIII /><TextDadesAjuntament /></>} />
          <label className="check">
            <input type="checkbox" checked={!!a.documentacio_llegida_at}
              onChange={(e) => set('documentacio_llegida_at', e.target.checked ? new Date().toISOString() : undefined)} />
            <span>La persona beneficiària (i, si escau, l'adult autoritzat) ha llegit la documentació del programa que es mostra a dalt. *</span>
          </label>
          <label className="mt">Tècnic VAIC: nom, cognoms i càrrec *
            <input value={a.tecnic_nom} onChange={(e) => set('tecnic_nom', e.target.value)} placeholder="Ex.: Jordi Puig – Mecànic" />
          </label>
          <div className="sigs">
            <SignaturePad label="Persona beneficiària" sublabel={a.beneficiaria_nom} value={a.signatures.benef}
              onChange={(v) => setA((x) => ({ ...x, signatures: { ...x.signatures, benef: v } }))} />
            {a.adult_nom.trim() ? (
              <SignaturePad label="Altra persona adulta autoritzada" sublabel={[a.adult_nom, a.adult_document].filter(Boolean).join(' · ')} value={a.signatures.adult}
                onChange={(v) => setA((x) => ({ ...x, signatures: { ...x.signatures, adult: v } }))} />
            ) : null}
            <SignaturePad label="Per compte de l'empresa contractista" sublabel={a.tecnic_nom || PROGRAMA.empresa_nom} value={a.signatures.tecnic}
              onChange={(v) => setA((x) => ({ ...x, signatures: { ...x.signatures, tecnic: v } }))} />
          </div>
        </section>
      )}

      {pas === 4 && (
        <section className="card">
          <h2>Generar l'acta</h2>
          <p>Es crearà la cessió, es generarà l'acta de lliurament (PDF per imprimir) i quedarà tot desat a la base de dades. L'estat de la bicicleta i el contracte amb l'organització no es modifiquen.</p>
          {error ? <div className="alert error">{error}</div> : null}
          <button className="btn primary big" onClick={generar} disabled={desant}>{desant ? 'Generant i desant…' : 'Generar i desar acta'}</button>
        </section>
      )}

      {pas < 4 && (
        <div className="wizard-nav">
          {pas > 0 ? <button className="btn" onClick={() => setPas(pas - 1)}>Enrere</button> : <span />}
          <div className="right">
            {errorsPas.length ? <span className="muted small">Falta: {errorsPas.join(', ')}</span> : null}
            <button className="btn primary" onClick={seguent} disabled={!!errorsPas.length}>Següent</button>
          </div>
        </div>
      )}
    </div>
  )
}

function BiciPicker({ seleccionada, onTria, clientId, cessioId }: {
  seleccionada: Bicicleta | null; onTria: (b: Bicicleta) => void; clientId: string | null; cessioId: string | null
}) {
  const [text, setText] = useState('')
  const [nomesPrograma, setNomesPrograma] = useState(true)
  const [bicis, setBicis] = useState<Bicicleta[]>([])
  const [carregant, setCarregant] = useState(false)

  useEffect(() => {
    setCarregant(true)
    const t = setTimeout(() => {
      cercarBicis(text, clientId, nomesPrograma, PROGRAMA.tipus_bici_programa, cessioId).then(setBicis).catch(() => setBicis([])).finally(() => setCarregant(false))
    }, 250)
    return () => clearTimeout(t)
  }, [text, nomesPrograma, clientId, cessioId])

  return (
    <div>
      {seleccionada ? (
        <div className="bici selected">
          <div><strong>{seleccionada.codi}</strong> · {marcaModel(seleccionada)}</div>
          <div className="muted small">{identificacioBici(seleccionada)}</div>
        </div>
      ) : null}
      <div className="inline mt-s">
        <input placeholder="Cerca per codi, model o bastidor…" value={text} onChange={(e) => setText(e.target.value)} />
        <label className="toggle"><input type="checkbox" checked={nomesPrograma} onChange={(e) => setNomesPrograma(e.target.checked)} /> Només longtail / cargo</label>
      </div>
      <div className="bicis">
        {carregant ? <div className="muted">Cercant…</div> : null}
        {!carregant && !bicis.length ? <div className="muted">{clientId ? "No hi ha bicis lliures al contracte actiu de l'organització amb aquest filtre." : 'Tria primer una organització (pas anterior).'}</div> : null}
        {bicis.map((b) => (
          <button type="button" key={b.id} className={'bici' + (seleccionada?.id === b.id ? ' on' : '')} onClick={() => onTria(b)}>
            <strong>{b.codi}</strong>
            <span>{marcaModel(b)}</span>
            <span className="muted small">{b.tipus}{b.color ? ` · ${b.color}` : ''}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
