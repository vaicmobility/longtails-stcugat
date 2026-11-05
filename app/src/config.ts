// Dades fixes del programa i de VAIC. Revisa els valors marcats amb (a definir).
export const PROGRAMA = {
  servei_gestor: 'Ajuntament de Sant Cugat del Vallès',
  empresa_nom: 'VAIC Mobility',
  lloc_lliurament: 'Botiga VAIC',
  lloc_horari_retorn: 'Botiga VAIC · De dilluns a divendres: de 10:00 a 14:00 i de 16:00 a 20:00',
  // Canal únic de comunicació i incidències. Els camps sense valor es mostren com a "—" als annexos.
  canal: {
    telefon: '936 75 45 70',
    avaries: '679 92 37 56', // telèfon d'avaries (també és el WhatsApp del portal)
    whatsapp: '34679923756', // número internacional sense '+' (per a wa.me)
    email: 'serveis@vaic.com',
    formulari: 'https://longtail.vaic.com',
    horari: 'De dilluns a divendres: de 10:00 a 14:00 i de 16:00 a 20:00',
    urgencies: '936 75 45 70',
  },
  // Filtre per defecte en cercar bicis disponibles
  tipus_bici_programa: ['longtail', 'cargo'],
}

export const canalResum = () =>
  [
    PROGRAMA.canal.formulari,
    PROGRAMA.canal.telefon !== '—' && `Tel. ${PROGRAMA.canal.telefon}`,
    `Avaries (tel. i WhatsApp) ${PROGRAMA.canal.avaries}`,
    PROGRAMA.canal.email !== '—' && PROGRAMA.canal.email,
  ].filter(Boolean).join(' · ')

// Elements que es proposen per defecte a l'acta de lliurament
export const ELEMENTS_PER_DEFECTE = [
  'Bicicleta',
  'Bateria',
  'Carregador',
  'Cadenat',
  'Claus',
  'Cadireta / seient infantil',
  'Casc',
]

export const ESTATS_ELEMENT = ['Correcte', 'Desgast normal', 'Amb desperfectes', 'No funciona']
