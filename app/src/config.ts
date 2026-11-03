// Dades fixes del programa i de VAIC. Revisa els valors marcats amb (a definir).
export const PROGRAMA = {
  servei_gestor: 'Ajuntament de Sant Cugat del Vallès',
  empresa_nom: 'VAIC Mobility',
  lloc_lliurament: 'Botiga VAIC',
  lloc_horari_retorn: 'Botiga VAIC · (horari a definir)',
  canal: {
    telefon: '(a definir)',
    email: '(a definir)',
    formulari: "Portal d'usuaris VAIC (enllaç personal enviat al lliurament)",
    horari: '(a definir)',
    urgencies: '(a definir)',
  },
  // Filtre per defecte en cercar bicis disponibles
  tipus_bici_programa: ['longtail', 'cargo'],
}

export const canalResum = () =>
  [`Tel. ${PROGRAMA.canal.telefon}`, PROGRAMA.canal.email, PROGRAMA.canal.formulari].join(' · ')

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
