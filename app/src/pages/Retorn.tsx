import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Fotos, Steps } from '../components/Layout'
import { SignaturePad } from '../components/SignaturePad'
import { TextAnnexII } from '../components/Documentacio'
import { DocumentacioPrograma } from '../components/DocumentacioPrograma'
import { ESTATS_ELEMENT, PROGRAMA } from '../config'
import { finalitzarRetorn, getActes, getCessio } from '../lib/api'
import { ara, data, durada } from '../lib/format'
import type { ActaLliurament, ActaRetorn, Cessio, ElementRetornat } from '../lib/types'
import { Resultat } from './Resultat'

const PASSOS = ['Retorn', 'Elements i valoració', 'Signatures', 'Document']

export function Retorn() {
  const { id } = useParams()
  const nav = useNavigate()
  const [cessio, setCessio] = useState<Cessio | null>(null)
  const [lliurament, setLliurament] = useState<ActaLliurament | null>(null)
  const [r, setR] = useState<ActaRetorn | null>(null)
  const [pas, setPas] = useState(0)
  const [fotos, setFotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [desant, setDesant] = useState(false)
  const [resultat, setResultat] = useState<{ pdfBlob: Blob } | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getCessio(id), getActes(id)]).then(([c, actes]) => {
      const l = actes.find((x) => x.fase === 'lliurament')?.dades as ActaLliurament | undefined
      if (!l) { setError("Aquesta cessió no té acta de lliurament feta amb aquesta eina. No es pot generar l'Annex II."); return }
      setCessio(c)
      setLliurament(l)
      setR({
        retorn_persona: l.beneficiaria_nom,
        retorn_persona_document: l.beneficiaria_document,
        condicio: 'beneficiaria',
        retorn_data_hora: ara(),
        retorn_lloc: PROGRAMA.lloc_lliurament,
        durada_cessio: '',
        elements: l.elements.map((e) => ({ element: e.element, retornat: 'Sí', estat: e.estat, incidencies: '', observacions: '' })),
        val_complet: true,
        val_incidencies: false,
        val_manca: false,
        observacions: '',
        num_fotos: 0,
        tecnic_nom: localStorage.getItem('vaic_tecnic_nom') ?? '',
        signatures: { persona: null, tecnic: null },
      })
    }).catch((e) => setError(e.message))
  }, [id])

  // Valoració suggerida a partir dels elements
  const suggerida = useMemo(() => {
    if (!r) return null
    const manca = r.elements.some((e) => e.retornat !== 'Sí')
    const inc = r.elements.some((e) => e.incidencies.trim() || e.estat === 'Amb desperfectes' || e.estat === 'No funciona')
    return { val_complet: !manca && !inc, val_incidencies: inc, val_manca: manca }
  }, [r])

  if (error && !r) return <div className="wizard"><div className="alert error">{error}</div></div>
  if (!cessio || !lliurament || !r) return <div className="center muted">Carregant…</div>

  const set = <K extends keyof ActaRetorn>(k: K, v: ActaRetorn[K]) => setR((x) => (x ? { ...x, [k]: v } : x))
  const updEl = (i: number, p: Partial<ElementRetornat>) => set('elements', r.elements.map((e, j) => (j === i ? { ...e, ...p } : e)))

  const errorsPas: string[] = []
  if (pas === 0 && !r.retorn_persona.trim()) errorsPas.push('Persona que retorna')
  if (pas === 1 && !r.val_complet && !r.val_incidencies && !r.val_manca) errorsPas.push('Valoració final')
  if (pas === 2) {
    if (!r.tecnic_nom.trim()) errorsPas.push('Nom del tècnic VAIC')
    if (!r.signatures.persona) errorsPas.push('Signatura de qui retorna')
    if (!r.signatures.tecnic) errorsPas.push('Signatura del tècnic')
    if (!r.documentacio_llegida_at) errorsPas.push('Confirmar la lectura de les condicions')
  }

  const generar = async () => {
    setDesant(true)
    setError(null)
    try {
      localStorage.setItem('vaic_tecnic_nom', r.tecnic_nom)
      const inici = cessio.check_in ?? lliurament.lliurament_data_hora
      const acta = { ...r, durada_cessio: durada(inici, r.retorn_data_hora) }
      setResultat(await finalitzarRetorn({ cessio, lliurament, acta, fotos }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDesant(false)
    }
  }

  if (resultat)
    return (
      <Resultat titol="Retorn completat" text={`Cessió finalitzada. La bicicleta torna a estar lliure per a una nova cessió.`}
        pdfBlob={resultat.pdfBlob} nomFitxer={`acta-devolucio-${cessio.bicicletes?.codi ?? ''}`}
        onDetall={() => nav(`/botiga/cessio/${cessio.id}`)} />
    )

  return (
    <div className="wizard">
      <h1>Retorn <span className="muted">· Annex II</span></h1>
      <p className="muted">{lliurament.beneficiaria_nom} · {lliurament.bici_marca_model} ({cessio.bicicletes?.codi}) · lliurada el {data(lliurament.lliurament_data_hora)}</p>
      <Steps steps={PASSOS} actual={pas} onGo={setPas} />

      {pas === 0 && (
        <section className="card">
          <h2>Qui retorna la bicicleta</h2>
          <div className="seg">
            <button type="button" className={r.condicio === 'beneficiaria' ? 'on' : ''}
              onClick={() => setR({ ...r, condicio: 'beneficiaria', retorn_persona: lliurament.beneficiaria_nom, retorn_persona_document: lliurament.beneficiaria_document })}>
              Persona beneficiària
            </button>
            <button type="button" className={r.condicio === 'autoritzada' ? 'on' : ''}
              onClick={() => setR({ ...r, condicio: 'autoritzada', retorn_persona: lliurament.adult_nom, retorn_persona_document: lliurament.adult_document ?? '' })}>
              Persona adulta autoritzada
            </button>
          </div>
          <div className="grid2 mt">
            <label>Nom i cognoms *<input value={r.retorn_persona} onChange={(e) => set('retorn_persona', e.target.value)} /></label>
            <label>DNI/NIE<input value={r.retorn_persona_document} onChange={(e) => set('retorn_persona_document', e.target.value.toUpperCase())} /></label>
            <label>Data i hora de devolució<input type="datetime-local" value={r.retorn_data_hora} onChange={(e) => set('retorn_data_hora', e.target.value)} /></label>
            <label>Lloc de devolució<input value={r.retorn_lloc} onChange={(e) => set('retorn_lloc', e.target.value)} /></label>
          </div>
          <p className="muted small">Durada efectiva: {durada(cessio.check_in ?? lliurament.lliurament_data_hora, r.retorn_data_hora)}</p>
        </section>
      )}

      {pas === 1 && (
        <section className="card">
          <h2>Comprovació dels elements retornats</h2>
          <div className="elements">
            {r.elements.map((e, i) => (
              <div className="element ret" key={i}>
                <strong className="el-nom">{e.element}</strong>
                <div className="seg small">
                  {(['Sí', 'Parcial', 'No'] as const).map((v) => (
                    <button type="button" key={v} className={e.retornat === v ? 'on' : ''} onClick={() => updEl(i, { retornat: v })}>{v}</button>
                  ))}
                </div>
                <select value={e.estat} onChange={(ev) => updEl(i, { estat: ev.target.value })} aria-label="Estat aparent">
                  {[...ESTATS_ELEMENT, '—'].map((x) => <option key={x}>{x}</option>)}
                </select>
                <input placeholder="Incidències / desperfectes" value={e.incidencies} onChange={(ev) => updEl(i, { incidencies: ev.target.value })} />
                <input placeholder="Observacions" value={e.observacions} onChange={(ev) => updEl(i, { observacions: ev.target.value })} />
              </div>
            ))}
          </div>
          <h2 className="mt">Valoració final del retorn</h2>
          {suggerida && (suggerida.val_complet !== r.val_complet || suggerida.val_incidencies !== r.val_incidencies || suggerida.val_manca !== r.val_manca) ? (
            <button type="button" className="btn small" onClick={() => setR({ ...r, ...suggerida })}>Aplicar valoració segons els elements</button>
          ) : null}
          <label className="check"><input type="checkbox" checked={r.val_complet} onChange={(e) => set('val_complet', e.target.checked)} /> Material retornat completament i en estat compatible amb el desgast ordinari.</label>
          <label className="check"><input type="checkbox" checked={r.val_incidencies} onChange={(e) => set('val_incidencies', e.target.checked)} /> Material retornat amb incidències o desperfectes.</label>
          <label className="check"><input type="checkbox" checked={r.val_manca} onChange={(e) => set('val_manca', e.target.checked)} /> Manca de devolució total o parcial d'elements.</label>
          <label className="mt">Observacions finals<textarea rows={3} value={r.observacions} onChange={(e) => set('observacions', e.target.value)} /></label>
          <h2 className="mt">Fotografies</h2>
          <Fotos fotos={fotos} onChange={setFotos} />
        </section>
      )}

      {pas === 2 && (
        <section className="card">
          <h2>Documentació per llegir abans de signar</h2>
          <DocumentacioPrograma obrirPrimer fase="retorn" perDefecte={<TextAnnexII obert />} />
          <label className="check">
            <input type="checkbox" checked={!!r.documentacio_llegida_at}
              onChange={(e) => set('documentacio_llegida_at', e.target.checked ? new Date().toISOString() : undefined)} />
            <span>La persona que retorna la bicicleta ha llegit la documentació de la devolució que es mostra a dalt. *</span>
          </label>
          <h2 className="mt">Signatures</h2>
          <label>Tècnic VAIC: nom, cognoms i càrrec *<input value={r.tecnic_nom} onChange={(e) => set('tecnic_nom', e.target.value)} /></label>
          <div className="sigs">
            <SignaturePad label="Persona que efectua el retorn" sublabel={r.retorn_persona} value={r.signatures.persona}
              onChange={(v) => setR((x) => (x ? { ...x, signatures: { ...x.signatures, persona: v } } : x))} />
            <SignaturePad label="Per compte de l'empresa contractista" sublabel={r.tecnic_nom || PROGRAMA.empresa_nom} value={r.signatures.tecnic}
              onChange={(v) => setR((x) => (x ? { ...x, signatures: { ...x.signatures, tecnic: v } } : x))} />
          </div>
        </section>
      )}

      {pas === 3 && (
        <section className="card">
          <h2>Generar l'acta de devolució</h2>
          <p>Es generarà l'acta de devolució (Annex II, PDF). La cessió quedarà <strong>finalitzada</strong>.</p>
          {error ? <div className="alert error">{error}</div> : null}
          <button className="btn primary big" onClick={generar} disabled={desant}>{desant ? 'Generant i desant…' : 'Generar i desar acta'}</button>
        </section>
      )}

      {pas < 3 && (
        <div className="wizard-nav">
          {pas > 0 ? <button className="btn" onClick={() => setPas(pas - 1)}>Enrere</button> : <span />}
          <div className="right">
            {errorsPas.length ? <span className="muted small">Falta: {errorsPas.join(', ')}</span> : null}
            <button className="btn primary" onClick={() => { if (!errorsPas.length) { setPas(pas + 1); window.scrollTo(0, 0) } }} disabled={!!errorsPas.length}>Següent</button>
          </div>
        </div>
      )}
    </div>
  )
}
