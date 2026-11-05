// PDF de les actes (Annex I i II) generat a partir de les dades. Format proper al Word oficial.
import { Document, Font, Image, Line, Link, Page, StyleSheet, Svg, Text, View, pdf } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { PROGRAMA } from '../config'
import { data, dataHora } from './format'
import type { Reglament } from './documents'
import { ANNEX_I_MANIFESTACIONS } from './textos'
import type { ActaLliurament, ActaRetorn } from './types'

// Sense partició automàtica de paraules: evita talls incorrectes en català i en les URL (enllaços trencats).
Font.registerHyphenationCallback((paraula) => [paraula])

const LABEL_BG = '#ececec'
const HEAD_BG = '#d9e2f3'
const BORDER = '#9a9a9a'

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 44, paddingHorizontal: 54, fontSize: 8.5, fontFamily: 'Helvetica', lineHeight: 1.35 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  logo: { width: 112, height: 38.6 },
  adreca: { width: 72, height: 45.6 },
  h1: { fontFamily: 'Helvetica-BoldOblique', fontSize: 9.5, marginBottom: 8 },
  h2: { fontFamily: 'Helvetica-BoldOblique', fontSize: 8.5, marginTop: 12, marginBottom: 6 },
  p: { fontFamily: 'Helvetica-Oblique', textAlign: 'justify', marginBottom: 5 },
  table: { borderTop: `0.6pt solid ${BORDER}`, borderLeft: `0.6pt solid ${BORDER}` },
  row: { flexDirection: 'row' },
  cell: { borderRight: `0.6pt solid ${BORDER}`, borderBottom: `0.6pt solid ${BORDER}`, padding: 3.5, fontFamily: 'Helvetica-Oblique' },
  label: { backgroundColor: LABEL_BG, fontFamily: 'Helvetica-BoldOblique' },
  head: { backgroundColor: HEAD_BG, fontFamily: 'Helvetica-BoldOblique', textAlign: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  box: { width: 7.5, height: 7.5, border: '0.7pt solid #000', marginRight: 4, alignItems: 'center', justifyContent: 'center' },
  sig: { width: 120, height: 42, objectFit: 'contain' },
  sigEmpty: { width: 120, height: 42 },
  footer: { position: 'absolute', bottom: 22, right: 54, fontSize: 7, color: '#555' },
  footerLeft: { position: 'absolute', bottom: 22, left: 54, fontSize: 6.5, color: '#777' },
})

// Marges laterals de la plantilla de l'Ajuntament: text vertical i dues marques horitzontals
// (posicions preses de la capçalera del Word: centre x≈43,5pt, y≈393pt, llargada 336,8pt)
const LATERAL = 'Document signat electrònicament. La seva autenticitat es pot verificar a https://seu.santcugat.cat/seu/validacio'
const SideMarks = () => (
  <>
    <View fixed style={{ position: 'absolute', left: 0, top: 217, width: 31, borderTop: '0.6pt solid #000' }} />
    <View fixed style={{ position: 'absolute', left: 0, top: 567, width: 31, borderTop: '0.6pt solid #000' }} />
    <View fixed style={{ position: 'absolute', left: 43.5 - 185, top: 393 - 4.5, width: 370, height: 9, transform: 'rotate(-90deg)' }}>
      <Text style={{ fontSize: 6.8, fontFamily: 'Helvetica', textAlign: 'center', lineHeight: 1 }}>{LATERAL}</Text>
    </View>
  </>
)

const Header = () => (
  <>
    <SideMarks />
    <View style={s.header} fixed>
      <Image style={s.logo} src={`${import.meta.env.BASE_URL}assets/logo-santcugat.png`} />
      <Image style={s.adreca} src={`${import.meta.env.BASE_URL}assets/adreca-santcugat.png`} />
    </View>
  </>
)

const Footer = ({ refDoc }: { refDoc: string }) => (
  <>
    <Text style={s.footerLeft} fixed>{refDoc}</Text>
    <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
  </>
)

// Casella dibuixada amb vectors (un text "X" dins d'una caixa tan petita queda retallat i no es veu).
/** Converteix les URL en enllaços clicables dins del PDF. */
const TextAmbEnllacos = ({ text }: { text: string }) => (
  <>{text.split(/(https?:\/\/[^\s,]+)/g).map((t, i) => (i % 2 ? <Link key={i} src={t} style={{ color: '#1f4e9c' }}>{t}</Link> : t))}</>
)

const Box = ({ on }: { on: boolean }) => (
  <View style={s.box}>
    {on ? (
      <Svg style={{ width: 6.1, height: 6.1 }} viewBox="0 0 6 6">
        <Line x1="1" y1="1" x2="5" y2="5" stroke="#000" strokeWidth={1.1} />
        <Line x1="5" y1="1" x2="1" y2="5" stroke="#000" strokeWidth={1.1} />
      </Svg>
    ) : null}
  </View>
)

const Check = ({ on, children }: { on: boolean; children: ReactNode }) => (
  <View style={s.check}>
    <Box on={on} />
    <Text style={{ fontFamily: 'Helvetica-Oblique', flex: 1 }}>{children}</Text>
  </View>
)

/** Taula de dues columnes etiqueta / valor */
const KV = ({ rows }: { rows: [string, ReactNode][] }) => (
  <View style={s.table}>
    {rows.map(([k, v], i) => (
      <View style={s.row} key={i} wrap={false}>
        <Text style={[s.cell, s.label, { width: '40%' }]}>{k}</Text>
        <View style={[s.cell, { width: '60%' }]}>{typeof v === 'string' ? <Text>{v}</Text> : v}</View>
      </View>
    ))}
  </View>
)

const Grid = ({ cols, widths, rows }: { cols: string[]; widths: string[]; rows: string[][] }) => (
  <View style={s.table}>
    <View style={s.row}>
      {cols.map((c, i) => <Text key={i} style={[s.cell, s.head, { width: widths[i] }]}>{c}</Text>)}
    </View>
    {rows.map((r, ri) => (
      <View style={s.row} key={ri} wrap={false}>
        {r.map((c, i) => <Text key={i} style={[s.cell, { width: widths[i] }]}>{c}</Text>)}
      </View>
    ))}
  </View>
)

const SigImg = ({ src }: { src: string | null }) =>
  src ? <Image style={s.sig} src={src} /> : <View style={s.sigEmpty} />

const SigBlock = ({ title, src, lines }: { title: string; src: string | null; lines: string[] }) => (
  <View style={{ flex: 1, borderRight: `0.6pt solid ${BORDER}`, borderBottom: `0.6pt solid ${BORDER}` }}>
    <Text style={[s.cell, s.label, { textAlign: 'center', borderRight: 0 }]}>{title}</Text>
    <View style={{ padding: 4 }}>
      <Text style={{ fontFamily: 'Helvetica-Oblique' }}>Signatura:</Text>
      <SigImg src={src} />
      {lines.map((l, i) => <Text key={i} style={{ fontFamily: 'Helvetica-Oblique' }}>{l}</Text>)}
    </View>
  </View>
)

const Box2 = ({ si }: { si: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text>Fotografies incorporades a l'acta:  </Text>
    <Box on={si} /><Text>Sí   </Text><Box on={!si} /><Text>No</Text>
  </View>
)

// ---------------------------------------------------------------- Reglament (davant de l'Annex I)
const PaginesReglament = ({ r, refDoc }: { r: Reglament; refDoc: string }) => (
  <Page size="A4" style={s.page}>
    <Header />
    <Footer refDoc={refDoc} />
    <Text style={[s.h1, { textAlign: 'center', fontSize: 10, marginBottom: 12 }]}>{r.titol}</Text>
    {r.blocs.map((b, i) =>
      b.tipus === 'capitol' ? (
        <Text key={i} style={[s.h1, { marginTop: 10, marginBottom: 4 }]} minPresenceAhead={50}>{b.text}</Text>
      ) : b.tipus === 'article' ? (
        <Text key={i} style={[s.h2, { marginTop: 7, marginBottom: 3 }]} minPresenceAhead={40}>{b.text}</Text>
      ) : (
        <Text key={i} style={/^[a-z]\) /.test(b.text) ? [s.p, { marginLeft: 10, marginBottom: 2 }] : s.p}>{b.text}</Text>
      ),
    )}
  </Page>
)

// ---------------------------------------------------------------- Annex I
const AnnexI = ({ a, refDoc }: { a: ActaLliurament; refDoc: string }) => (
  <Page size="A4" style={s.page}>
    <Header />
    <Footer refDoc={refDoc} />
    <Text style={s.h1}>Annex I. Model d'acta de lliurament</Text>
    <KV
      rows={[
        ['Ajuntament / servei gestor', a.servei_gestor],
        ['Escola bressol municipal', a.escola_bressol],
        ['Persona beneficiària', a.beneficiaria_nom],
        ['Altres persones adultes autoritzades', [a.adult_nom, a.adult_document && `DNI/NIE: ${a.adult_document}`].filter(Boolean).join(' · ')],
        ['DNI/NIE o document identificatiu', a.beneficiaria_document],
        ['Telèfon i correu electrònic', [a.beneficiaria_telefon, a.beneficiaria_email].filter(Boolean).join(' · ')],
        ['Infant matriculat / unitat familiar', [a.infant_unitat_familiar, a.infant2].map((x) => x?.trim()).filter(Boolean).join('\n')],
        ['Data i hora de lliurament', dataHora(a.lliurament_data_hora)],
        ['Lloc de lliurament', a.lliurament_lloc],
        ['Data prevista de retorn', data(a.retorn_data_prevista)],
        ['Lloc i horari de retorn', a.retorn_lloc_horari],
        ['Bicicleta assignada (marca/model, si escau)', a.bici_marca_model],
        ["Número d'inventari, sèrie o identificació", a.bici_identificacio],
        ["Canal de comunicació d'incidències (telèfon, correu electrònic...)", a.canal_incidencies],
        [' ', <Box2 si={a.num_fotos > 0} />],
        ['Nombre de fotografies', a.num_fotos ? String(a.num_fotos) : ''],
      ]}
    />

    <Text style={s.h2}>Relació d'elements materials lliurats</Text>
    <Grid
      cols={['Element', 'Identificació / observacions', 'Estat aparent', 'Conforme']}
      widths={['26%', '40%', '20%', '14%']}
      rows={a.elements.map((e) => [e.element, e.identificacio, e.estat, e.conforme ? 'Sí' : 'No'])}
    />

    <Text style={s.h2}>Observacions sobre l'estat de conservació i funcionament</Text>
    <View style={[s.table]}>
      <Text style={[s.cell, { minHeight: 34 }]}>{a.observacions || ' '}</Text>
    </View>

    {/* Manifestacions (Reglament definitiu). Cada punt es manté sencer a la mateixa pàgina. */}
    <Text style={s.h2} minPresenceAhead={60}>Manifestacions</Text>
    {ANNEX_I_MANIFESTACIONS.map((m, i) => (
      <View key={i} wrap={false} style={{ marginBottom: 2 }}>
        <Text style={s.p}>• {m.text}</Text>
        {m.detalls?.map((d, j) => <Text key={j} style={[s.p, { marginLeft: 8 }]}><TextAmbEnllacos text={d} /></Text>)}
      </View>
    ))}

    <View wrap={false} style={{ marginTop: 10 }}>
      <View style={[s.row, { borderTop: `0.6pt solid ${BORDER}`, borderLeft: `0.6pt solid ${BORDER}` }]}>
        <SigBlock title="Persona beneficiària" src={a.signatures.benef}
          lines={[`Nom i cognoms: ${a.beneficiaria_nom}`, `Data: ${data(a.lliurament_data_hora)}`]} />
        <SigBlock title="Persona que actua per compte de l'empresa contractista" src={a.signatures.tecnic}
          lines={[`Nom, cognoms i càrrec: ${a.tecnic_nom}`, `Empresa: ${PROGRAMA.empresa_nom}`]} />
      </View>
      {a.adult_nom ? (
        <View style={[s.row, { borderLeft: `0.6pt solid ${BORDER}`, width: '50%' }]}>
          <SigBlock title="Altres persones adultes autoritzades" src={a.signatures.adult}
            lines={[`Nom i cognoms: ${a.adult_nom}`, `DNI/NIE: ${a.adult_document ?? ''}`, `Data: ${data(a.lliurament_data_hora)}`]} />
        </View>
      ) : null}
    </View>
  </Page>
)

// ---------------------------------------------------------------- Annex II
const AnnexII = ({ l, r, refDoc }: { l: ActaLliurament; r: ActaRetorn; refDoc: string }) => (
  <Page size="A4" style={s.page}>
    <Header />
    <Footer refDoc={refDoc} />
    <Text style={s.h1}>Annex II. Model d'acta de devolució</Text>
    <KV
      rows={[
        ['Ajuntament / servei gestor', l.servei_gestor],
        ['Escola bressol municipal', l.escola_bressol],
        ['Persona beneficiària o Persona que efectua materialment el retorn, si és diferent de la beneficiària', r.retorn_persona],
        ['Data i hora de devolució', dataHora(r.retorn_data_hora)],
        ['Bicicleta retornada (marca/model, si escau)', l.bici_marca_model],
        ["Número d'inventari, sèrie o identificació", l.bici_identificacio],
        ['Durada efectiva de la cessió', r.durada_cessio],
        [' ', <Box2 si={r.num_fotos > 0} />],
        ['Nombre de fotografies', r.num_fotos ? String(r.num_fotos) : ''],
      ]}
    />

    <Text style={s.h2}>Comprovació dels elements materials retornats</Text>
    <Grid
      cols={['Element', 'Retornat', 'Estat aparent', 'Incidències / desperfectes', 'Observacions']}
      widths={['22%', '12%', '18%', '24%', '24%']}
      rows={r.elements.map((e) => [e.element, e.retornat, e.estat, e.incidencies, e.observacions])}
    />

    <Text style={s.h2}>Valoració final del retorn</Text>
    <Check on={r.val_complet}>Material retornat completament i en estat compatible amb el desgast ordinari derivat d'un ús correcte.</Check>
    <Check on={r.val_incidencies}>Material retornat amb incidències o desperfectes que es descriuen en aquesta acta.</Check>
    <Check on={r.val_manca}>Manca de devolució total o parcial d'elements materials objecte de cessió.</Check>

    <Text style={s.h2}>Observacions finals</Text>
    <View style={s.table}>
      <Text style={[s.cell, { minHeight: 34 }]}>{r.observacions || ' '}</Text>
    </View>

    <View style={{ marginTop: 8 }}>
      {[
        "Aquesta acta acredita la recepció material i l'estat aparent de la bicicleta i dels seus accessoris en el moment de la devolució, però no determina per si sola l'existència ni la imputació de responsabilitat.",
        "La recepció material de la bicicleta i dels accessoris queda subjecta, quan sigui necessari, a una revisió tècnica posterior. Els desperfectes o anomalies no apreciables en el moment del retorn podran ser constatats mitjançant informe tècnic, sempre que la revisió es realitzi dins d'un termini raonable i se'n deixi constància documental.",
        "Quan es detectin danys, desperfectes o mancances susceptibles de generar responsabilitat, s'aplicarà el procediment previst al Reglament, amb valoració tècnica, determinació de la cobertura asseguradora, audiència de la persona interessada i resolució motivada de l'òrgan municipal competent.",
      ].map((t, i) => <Text key={i} style={s.p}>{t}</Text>)}
    </View>

    <View wrap={false} style={[s.row, { marginTop: 8, borderTop: `0.6pt solid ${BORDER}`, borderLeft: `0.6pt solid ${BORDER}` }]}>
      <View style={{ flex: 1, borderRight: `0.6pt solid ${BORDER}`, borderBottom: `0.6pt solid ${BORDER}` }}>
        <Text style={[s.cell, s.label, { textAlign: 'center', borderRight: 0 }]}>Persona que efectua materialment el retorn</Text>
        <View style={{ padding: 4 }}>
          <Text style={{ fontFamily: 'Helvetica-Oblique' }}>Nom i cognoms: {r.retorn_persona}</Text>
          <Text style={{ fontFamily: 'Helvetica-Oblique' }}>DNI/NIE: {r.retorn_persona_document}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginVertical: 2 }}>
            <Text style={{ fontFamily: 'Helvetica-Oblique' }}>Condició:  </Text>
            <Box on={r.condicio === 'beneficiaria'} /><Text style={{ fontFamily: 'Helvetica-Oblique' }}>Persona beneficiària  </Text>
            <Box on={r.condicio === 'autoritzada'} /><Text style={{ fontFamily: 'Helvetica-Oblique' }}>Persona adulta autoritzada</Text>
          </View>
          <Text style={{ fontFamily: 'Helvetica-Oblique' }}>Data i hora: {dataHora(r.retorn_data_hora)}</Text>
          <Text style={{ fontFamily: 'Helvetica-Oblique' }}>Signatura:</Text>
          <SigImg src={r.signatures.persona} />
        </View>
      </View>
      <SigBlock title="Persona que actua per compte de l'empresa contractista" src={r.signatures.tecnic}
        lines={[
          `Nom, cognoms i càrrec: ${r.tecnic_nom}`,
          `Empresa: ${PROGRAMA.empresa_nom}`,
          `Data i hora: ${dataHora(r.retorn_data_hora)}`,
          `Lloc de devolució: ${r.retorn_lloc}`,
        ]} />
    </View>
  </Page>
)

// ---------------------------------------------------------------- Annex III (informatiu, es lliura amb l'Annex I)
const AnnexIII = ({ refDoc }: { refDoc: string }) => (
  <Page size="A4" style={s.page}>
    <Header />
    <Footer refDoc={refDoc} />
    <Text style={s.h1}>Annex III. Protocol operatiu mínim d'incidències i sinistres</Text>
    <Text style={s.h2}>1. Incidències que s'han de comunicar</Text>
    <Text style={s.p}>S'han de comunicar, com a mínim, les incidències següents:</Text>
    {[
      'a) Avaries o funcionament anòmal de la bicicleta o dels accessoris.',
      'b) Accidents amb danys materials o personals.',
      'c) Danys causats a terceres persones o als seus béns.',
      "d) Furt, robatori, intent de sostracció o pèrdua de la bicicleta, de les claus o dels accessoris.",
      "e) Desperfectes que puguin afectar la seguretat, l'estabilitat, els frens, la direcció, les rodes, la bateria, els sistemes de retenció o el transport d'infants.",
      'f) Pèrdua o deteriorament dels elements materials lliurats.',
      "g) Qualsevol altra circumstància que pugui afectar la seguretat de les persones, la integritat de la bicicleta o la cobertura asseguradora.",
    ].map((t, i) => <Text key={i} style={[s.p, { marginBottom: 1 }]}>{t}</Text>)}
    <Text style={s.h2}>2. Canal i termini de comunicació</Text>
    <Text style={s.p}>
      La persona beneficiària ha de comunicar la incidència a través del canal únic indicat a l'acta de lliurament. Aquest canal podrà ser gestionat pel servei municipal o per l'empresa contractista, en funció de les prestacions incloses en el contracte.
    </Text>
    <Text style={s.p}>Telèfon: {PROGRAMA.canal.telefon}{'\n'}Correu electrònic: {PROGRAMA.canal.email}{'\n'}Formulari o aplicació, si escau: {PROGRAMA.canal.formulari}{'\n'}Horari d'atenció: {PROGRAMA.canal.horari}{'\n'}Telèfon d'urgències fora d'horari, si escau: {PROGRAMA.canal.urgencies}</Text>
    <Text style={s.h2}>3. Mesures immediates de seguretat</Text>
    <Text style={s.p}>• Si la incidència pot afectar la seguretat de la circulació o l'estat de la bicicleta, s'ha de cessar immediatament l'ús del vehicle.</Text>
    <Text style={s.p}>La bicicleta s'ha de custodiar adequadament fins que el servei gestor o l'empresa contractista indiqui com procedir.</Text>
    <Text style={s.h2}>4. Furt, robatori, intent de sostracció o pèrdua</Text>
    <Text style={s.p}>• Quan es produeixi un furt o robatori, la persona beneficiària ha de formular denúncia davant el cos policial competent.</Text>
    <Text style={s.p}>• S'ha d'aportar còpia de la denúncia a l'Ajuntament dins el termini que s'indiqui en la documentació del programa o, si no consta, tan aviat com sigui possible.</Text>
    <Text style={s.p}>• En cas d'intent de sostracció o de pèrdua de la bicicleta, de les claus o dels accessoris, la persona beneficiària ho ha de comunicar sense demora al servei gestor o a l'empresa contractista i ha de seguir les instruccions que se li facilitin, sens perjudici de formular denúncia quan correspongui.</Text>
    <Text style={s.h2}>5. Tramitació municipal i assegurança</Text>
    <Text style={s.p}>• L'empresa contractista, en els termes previstos en el contracte, ha de valorar tècnicament la incidència i executar, quan correspongui, les actuacions materials d'immobilització, recollida, revisió o reparació de la bicicleta, sens perjudici que les decisions administratives de suspensió, revocació o determinació de responsabilitats corresponen a l'òrgan municipal competent.</Text>
    <Text style={s.p}>• La informació sobre l'abast i les condicions de la cobertura asseguradora, si n'hi ha, s'ha de facilitar a la persona beneficiària en el moment del lliurament.</Text>
    <Text style={s.h2}>6. Registre de la incidència</Text>
    <Text style={s.p}>Fitxa interna d'incidències:</Text>
    <Grid cols={['Camp mínim', 'Contingut']} widths={['30%', '70%']} rows={[
      ['Data i hora', 'Moment en què es produeix o es coneix la incidència.'],
      ['Persona comunicant', 'Identificació i dades de contacte.'],
      ['Bicicleta afectada', "Número d'inventari, sèrie o codi identificatiu."],
      ["Tipus d'incidència", 'Avaria, accident, furt, robatori, pèrdua o altra incidència.'],
      ['Descripció resumida', 'Fets ocorreguts i circumstàncies rellevants.'],
      ['Mesures adoptades', 'Immobilització, recollida, reparació o altres actuacions.'],
    ]} />
    <Text style={[s.p, { marginTop: 10, fontSize: 7 }]}>
      Us informem que les vostres dades seran incorporades al tractament T218 Campanyes de sensibilització ambiental responsabilitat de l'Ajuntament de Sant de Cugat de Vallès per a portar a terme l'autorització indicada. Les vostres dades seran conservades com a part dels procediments administratius de l'Ajuntament. Les vostres dades no seran cedides a tercers excepte que sigui necessari per portar a terme el tràmit sol·licitat, d'acord amb la legislació vigent. Així mateix s'informa de la possibilitat d'exercir els seus drets d'accés, rectificació, supressió, oposició, portabilitat i limitació de les dades mitjançant la remissió d'un escrit dirigit a Ajuntament de Sant Cugat del Vallès, Atenció Ciutadana, Plaça de la Vila, 1, 08172 Sant Cugat del Vallès, indicant "Ref. Protecció de dades" o bé exercir el seu dret a través de la Seu Electrònica. Per a més informació consulteu la pàgina web: https://www.santcugat.cat/web/proteccio-de-dades
    </Text>
  </Page>
)

/** Acta de lliurament: Reglament (si es passa) + Annex I + Annex III. */
export const pdfLliurament = (a: ActaLliurament, refDoc: string, reglament?: Reglament | null) =>
  pdf(
    <Document title={`Acta de lliurament ${refDoc}`} author={PROGRAMA.empresa_nom} language="ca">
      {reglament ? <PaginesReglament r={reglament} refDoc={refDoc} /> : null}
      <AnnexI a={a} refDoc={refDoc} />
      <AnnexIII refDoc={refDoc} />
    </Document>,
  ).toBlob()

export const pdfRetorn = (l: ActaLliurament, r: ActaRetorn, refDoc: string) =>
  pdf(
    <Document title={`Acta de devolució ${refDoc}`} author={PROGRAMA.empresa_nom} language="ca">
      <AnnexII l={l} r={r} refDoc={refDoc} />
    </Document>,
  ).toBlob()
