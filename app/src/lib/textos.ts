// Textos íntegres dels annexos de l'Ajuntament (plantilla oficial "ANNEXOS DEFINITIUS LONGTAIL")
// i de la política de privacitat, per mostrar-los abans de signar i al portal d'usuaris.
import { PROGRAMA } from '../config'

export type Seccio = { titol: string; paras?: string[]; items?: string[]; despres?: string[] }

export const ANNEX_I_MANIFESTACIONS = [
  "La persona beneficiària declara que rep la bicicleta i els elements materials associats en estat aparent de funcionament correcte, llevat de les incidències que consten expressament en aquesta acta.",
  "La persona beneficiària i, si escau, les altres persones adultes autoritzades declaren haver realitzat la formació prèvia obligatòria prevista en el Reglament.",
  "La persona beneficiària declara haver rebut informació sobre l'abast i les condicions bàsiques de l'assegurança, així com sobre els canals i els terminis de comunicació dels sinistres.",
  "La persona beneficiària i, si escau, les altres persones adultes autoritzades declaren haver rebut les instruccions d'ús i seguretat de la bicicleta, així com informació sobre els límits de pes, càrrega, ocupació i transport d'infants aplicables al model assignat.",
  "La persona beneficiària declara haver rebut la informació relativa al tractament de les dades personals vinculades a la gestió del programa i haver estat informada sobre el responsable del tractament, la finalitat, la base jurídica, els destinataris, el termini de conservació i l'exercici dels seus drets.",
  "La persona beneficiària declara haver comprovat l'estat aparent de la bicicleta i dels accessoris lliurats i manifesta la seva conformitat, llevat de les observacions expressament consignades en aquesta acta.",
]

export const ANNEX_II_CLAUSULES = [
  "Aquesta acta acredita la recepció material i l'estat aparent de la bicicleta i dels seus accessoris en el moment de la devolució, però no determina per si sola l'existència ni la imputació de responsabilitat.",
  "La recepció material de la bicicleta i dels accessoris queda subjecta, quan sigui necessari, a una revisió tècnica posterior. Els desperfectes o anomalies no apreciables en el moment del retorn podran ser constatats mitjançant informe tècnic, sempre que la revisió es realitzi dins d'un termini raonable i se'n deixi constància documental.",
  "Quan es detectin danys, desperfectes o mancances susceptibles de generar responsabilitat, s'aplicarà el procediment previst al Reglament, amb valoració tècnica, determinació de la cobertura asseguradora, audiència de la persona interessada i resolució motivada de l'òrgan municipal competent.",
]

export const annexIII = (): Seccio[] => [
  {
    titol: "1. Incidències que s'han de comunicar",
    paras: ["S'han de comunicar, com a mínim, les incidències següents:"],
    items: [
      'a) Avaries o funcionament anòmal de la bicicleta o dels accessoris.',
      'b) Accidents amb danys materials o personals.',
      'c) Danys causats a terceres persones o als seus béns.',
      'd) Furt, robatori, intent de sostracció o pèrdua de la bicicleta, de les claus o dels accessoris.',
      "e) Desperfectes que puguin afectar la seguretat, l'estabilitat, els frens, la direcció, les rodes, la bateria, els sistemes de retenció o el transport d'infants.",
      'f) Pèrdua o deteriorament dels elements materials lliurats.',
      "g) Qualsevol altra circumstància que pugui afectar la seguretat de les persones, la integritat de la bicicleta o la cobertura asseguradora.",
    ],
  },
  {
    titol: '2. Canal i termini de comunicació',
    paras: [
      "La persona beneficiària ha de comunicar la incidència a través del canal únic indicat a l'acta de lliurament. Aquest canal podrà ser gestionat pel servei municipal o per l'empresa contractista, en funció de les prestacions incloses en el contracte.",
    ],
    items: [
      `Telèfon: ${PROGRAMA.canal.telefon}`,
      `Correu electrònic: ${PROGRAMA.canal.email}`,
      `Formulari o aplicació, si escau: ${PROGRAMA.canal.formulari}`,
      `Horari d'atenció: ${PROGRAMA.canal.horari}`,
      `Telèfon d'urgències fora d'horari, si escau: ${PROGRAMA.canal.urgencies}`,
    ],
  },
  {
    titol: '3. Mesures immediates de seguretat',
    items: [
      "Si la incidència pot afectar la seguretat de la circulació o l'estat de la bicicleta, s'ha de cessar immediatament l'ús del vehicle.",
      "La bicicleta s'ha de custodiar adequadament fins que el servei gestor o l'empresa contractista indiqui com procedir.",
    ],
  },
  {
    titol: '4. Furt, robatori, intent de sostracció o pèrdua',
    items: [
      'Quan es produeixi un furt o robatori, la persona beneficiària ha de formular denúncia davant el cos policial competent.',
      "S'ha d'aportar còpia de la denúncia a l'Ajuntament dins el termini que s'indiqui en la documentació del programa o, si no consta, tan aviat com sigui possible.",
      "En cas d'intent de sostracció o de pèrdua de la bicicleta, de les claus o dels accessoris, la persona beneficiària ho ha de comunicar sense demora al servei gestor o a l'empresa contractista i ha de seguir les instruccions que se li facilitin, sens perjudici de formular denúncia quan correspongui.",
    ],
  },
  {
    titol: '5. Tramitació municipal i assegurança',
    items: [
      "L'empresa contractista, en els termes previstos en el contracte, ha de valorar tècnicament la incidència i executar, quan correspongui, les actuacions materials d'immobilització, recollida, revisió o reparació de la bicicleta, sens perjudici que les decisions administratives de suspensió, revocació o determinació de responsabilitats corresponen a l'òrgan municipal competent.",
      "La informació sobre l'abast i les condicions de la cobertura asseguradora, si n'hi ha, s'ha de facilitar a la persona beneficiària en el moment del lliurament.",
    ],
  },
  {
    titol: '6. Registre de la incidència',
    paras: ['Fitxa interna d\'incidències (camps mínims):'],
    items: [
      'Data i hora: moment en què es produeix o es coneix la incidència.',
      'Persona comunicant: identificació i dades de contacte.',
      "Bicicleta afectada: número d'inventari, sèrie o codi identificatiu.",
      'Tipus d\'incidència: avaria, accident, furt, robatori, pèrdua o altra incidència.',
      'Descripció resumida: fets ocorreguts i circumstàncies rellevants.',
      'Mesures adoptades: immobilització, recollida, reparació o altres actuacions.',
    ],
  },
]

export const CLAUSULA_DADES_AJUNTAMENT =
  "Us informem que les vostres dades seran incorporades al tractament T218 Campanyes de sensibilització ambiental responsabilitat de l'Ajuntament de Sant Cugat del Vallès per a portar a terme l'autorització indicada. Les vostres dades seran conservades com a part dels procediments administratius de l'Ajuntament. Les vostres dades no seran cedides a tercers excepte que sigui necessari per portar a terme el tràmit sol·licitat, d'acord amb la legislació vigent. Així mateix s'informa de la possibilitat d'exercir els seus drets d'accés, rectificació, supressió, oposició, portabilitat i limitació de les dades mitjançant la remissió d'un escrit dirigit a Ajuntament de Sant Cugat del Vallès, Atenció Ciutadana, Plaça de la Vila, 1, 08172 Sant Cugat del Vallès, indicant \"Ref. Protecció de dades\" o bé exercir el seu dret a través de la Seu Electrònica. Per a més informació consulteu la pàgina web: https://www.santcugat.cat/web/proteccio-de-dades"

// Política de privacitat de VAIC MOBILITY SL (formulari de preinscripció). Darrera actualització: 3/11/2026.
// Si es modifica, canvia també PRIVACITAT_VERSIO a lib/preinscripcio.ts.
export const POLITICA_PRIVACITAT: Seccio[] = [
  {
    titol: '1. Identificació del Responsable del Tractament',
    items: [
      'Empresa: VAIC MOBILITY SL',
      'CIF: B65956567',
      'Domicili social: PLAÇA LLUIS MILLET 13, 08172 SANT CUGAT DEL VALLES (BARCELONA)',
      'Representant Legal: JORDI CASTELLÓ SANTAMARIA',
      'DNI Representant: 52597161W',
    ],
  },
  {
    titol: '2. Dades que es Recullen',
    paras: ['Mitjançant aquest formulari de registre, VAIC MOBILITY SL recull les següents categories de dades personals:'],
    items: [
      "Dades d'identificació: Nom, cognoms, CIF/NIF/NIE/Passaport",
      'Dades de contacte: Correu electrònic, telèfon, adreça completa, ciutat, codi postal, país',
      "Credencials d'accés: Correu electrònic i contrasenya per accedir a la plataforma",
    ],
  },
  {
    titol: '3. Finalitats del Tractament',
    paras: ['Les dades personals que ens proporciones seran tractades amb les següents finalitats:'],
    items: [
      "Gestió de l'alta com a client de VAIC MOBILITY SL",
      'Gestió i execució de contractes de renting de bicicletes',
      'Gestió de mandats SEPA i domiciliacions bancàries per al pagament dels serveis',
      'Enviament de comunicacions relacionades amb el servei contractat',
      "Gestió d'incidències, revisions i manteniment de les bicicletes",
      "Compliment d'obligacions legals, fiscals i mercantils",
      'Millora dels serveis oferts per VAIC MOBILITY SL',
    ],
  },
  {
    titol: '4. Base Legal del Tractament',
    paras: ["El tractament de les teves dades personals es basa en les següents bases legals d'acord amb el Reglament General de Protecció de Dades (RGPD):"],
    items: [
      "Consentiment de l'interessat (Art. 6.1.a RGPD): Per a l'alta i creació del compte d'usuari a la plataforma",
      'Execució del contracte (Art. 6.1.b RGPD): Per a la gestió dels contractes de renting i la prestació del servei',
      'Obligació legal (Art. 6.1.c RGPD): Per al compliment de normativa fiscal, mercantil i altres obligacions legals',
      'Interès legítim (Art. 6.1.f RGPD): Per a la millora dels serveis i la gestió eficient de la relació comercial',
    ],
  },
  {
    titol: '5. Conservació de les Dades',
    paras: ['Les teves dades personals es conservaran durant el temps necessari per complir amb les finalitats per a les quals es van recollir. En concret:'],
    items: [
      'Mentre duri la relació contractual i el servei de renting estigui actiu',
      'Després de la finalització del contracte, les dades es conservaran bloquejades durant els terminis legals exigits (mínim 6 anys segons la normativa fiscal espanyola)',
      'Un cop transcorreguts els terminis legals, les dades seran eliminades de forma segura',
      'Durant el període de conservació legal, les dades només estaran disponibles per a les autoritats competents en cas de requeriment',
    ],
  },
  {
    titol: '6. Destinataris de les Dades',
    paras: ['Les teves dades personals no seran cedides a tercers, excepte en els següents casos:'],
    items: [
      'Entitats bancàries: Per a la gestió de domiciliacions bancàries SEPA i processament de pagaments',
      'Administracions públiques: Quan existeixi una obligació legal (Agència Tributària, Seguretat Social, etc.)',
      "Proveïdors de serveis tecnològics: Empreses que presten serveis d'allotjament web (hosting), gestió de bases de dades i altres serveis tecnològics necessaris per al funcionament de la plataforma, sempre sota contracte d'encarregat del tractament que garanteixi la confidencialitat i seguretat de les dades",
    ],
    despres: ['VAIC MOBILITY SL garanteix que tots els destinataris de les dades compleixen amb la normativa de protecció de dades vigent.'],
  },
  {
    titol: '7. Els Teus Drets',
    paras: ['Com a titular de les dades personals, tens els següents drets reconeguts pel RGPD i la LOPDGDD:'],
    items: [
      "Dret d'accés: Obtenir informació sobre les teves dades personals que estem tractant",
      'Dret de rectificació: Sol·licitar la correcció de dades inexactes o incompletes',
      "Dret de supressió (\"dret a l'oblit\"): Sol·licitar l'eliminació de les teves dades quan ja no siguin necessàries o el tractament sigui il·lícit",
      "Dret d'oposició: Oposar-te al tractament de les teves dades en determinades circumstàncies",
      'Dret a la limitació del tractament: Sol·licitar la suspensió del tractament de les teves dades',
      "Dret a la portabilitat: Rebre les teves dades en un format estructurat, d'ús comú i lectura mecànica, i transmetre-les a un altre responsable",
      'Dret a retirar el consentiment: Retirar el consentiment atorgat en qualsevol moment, sense que això afecti la licitud del tractament previ',
    ],
    despres: [
      'Per exercir aquests drets, pots contactar-nos mitjançant:',
      '📧 Correu electrònic: info@vaic.com',
      '📮 Correu postal: PLAÇA LLUIS MILLET 13, 08172 SANT CUGAT DEL VALLES (BARCELONA)',
      'En la teva sol·licitud, inclou una còpia del teu DNI o document equivalent per verificar la teva identitat.',
    ],
  },
  {
    titol: '8. Cessió de Dades Bancàries i Mandat SEPA',
    paras: ["Per a la gestió dels pagaments dels serveis de renting, serà necessari que proporciones les teves dades bancàries i signis un mandat SEPA (Single Euro Payments Area). Mitjançant l'acceptació d'aquesta política, autoritzes expressament:"],
    items: [
      'La cessió de les teves dades bancàries (IBAN, BIC i nom del titular del compte) a VAIC MOBILITY SL i a la nostra entitat bancària per a la gestió de les domiciliacions bancàries SEPA',
      "El tractament d'aquestes dades bancàries per part de l'entitat bancària corresponent únicament amb la finalitat de processar els càrrecs periòdics dels serveis de renting contractats",
      "L'ús d'un sistema de pagament segur conforme a la Directiva de Serveis de Pagament (PSD2) i la normativa europea SEPA",
    ],
    despres: ['Les dades bancàries seran tractades amb el màxim nivell de seguretat i no es compartiran amb tercers aliens a la gestió de pagaments. Tens dret a cancel·lar el mandat SEPA en qualsevol moment contactant amb VAIC MOBILITY SLU.'],
  },
  {
    titol: '9. Mesures de Seguretat',
    paras: ["VAIC MOBILITY SLU ha implementat mesures de seguretat tècniques i organitzatives adequades per protegir les teves dades personals contra l'accés no autoritzat, la pèrdua, l'alteració o la destrucció accidental. Entre d'altres:"],
    items: [
      'Xifratge de contrasenyes i dades sensibles',
      "Control d'accés restringit a les dades per part del personal autoritzat",
      'Còpies de seguretat periòdiques per prevenir la pèrdua de dades',
      'Protocols de resposta davant de possibles violacions de seguretat',
      'Utilització de connexions segures (SSL/TLS) per a la transmissió de dades',
      'Revisió i actualització periòdica de les mesures de seguretat',
    ],
  },
  {
    titol: '10. Reclamacions i Dret a Presentar una Queixa',
    paras: ["Si consideres que VAIC MOBILITY SLU no ha tractat les teves dades personals d'acord amb la normativa vigent, tens dret a presentar una reclamació davant les autoritats de protecció de dades:"],
    items: [
      'Autoritat Catalana de Protecció de Dades (APDCAT): Si resideixes a Catalunya. Web: apdcat.gencat.cat',
      "Agència Espanyola de Protecció de Dades (AEPD): Per a la resta d'Espanya. Web: www.aepd.es",
    ],
    despres: ["No obstant això, et recomanem que, abans de presentar una reclamació davant l'autoritat de control, et posis en contacte amb nosaltres per intentar resoldre qualsevol incidència de manera amistosa."],
  },
  {
    titol: '11. Actualitzacions de la Política de Privacitat',
    paras: [
      'VAIC MOBILITY SLU es reserva el dret a modificar i actualitzar aquesta Política de Privacitat per adaptar-la a novetats legislatives, jurisprudencials o de la pràctica empresarial. Qualsevol modificació substancial serà comunicada als usuaris registrats a través del correu electrònic proporcionat o mitjançant un avís destacat a la plataforma.',
      'Última actualització: 3 de novembre del 2026',
    ],
  },
  {
    titol: 'Acceptació de la Política de Privacitat',
    paras: ['En marcar la casella "Accepto la política de privacitat" i completar el formulari de registre, declares que has llegit, comprès i acceptat íntegrament aquesta Política de Privacitat i Protecció de Dades, així com el tractament de les teves dades personals en els termes aquí descrits.'],
  },
]
