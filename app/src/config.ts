// Dades fixes del programa i de VAIC. Revisa els valors marcats amb (a definir).
export const PROGRAMA = {
  servei_gestor: 'Ajuntament de Sant Cugat del Vallès',
  empresa_nom: 'VAIC Mobility',
  lloc_lliurament: 'Botiga VAIC',
  lloc_horari_retorn: 'Botiga VAIC · (horari a definir)',
  // Canal únic de comunicació i incidències. Els camps sense valor es mostren com a "—" als annexos.
  canal: {
    telefon: '—',
    email: '—',
    formulari: 'https://longtail.vaic.com',
    horari: '—',
    urgencies: '—',
  },
  // Filtre per defecte en cercar bicis disponibles
  tipus_bici_programa: ['longtail', 'cargo'],
}

export const canalResum = () =>
  [
    PROGRAMA.canal.formulari,
    PROGRAMA.canal.telefon !== '—' && `Tel. ${PROGRAMA.canal.telefon}`,
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
