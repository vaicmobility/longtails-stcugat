export type Bicicleta = {
  id: string
  codi: string | null
  marca: string | null
  model: string | null
  num_bastidor: string | null
  num_serie_bateria: string | null
  codi_cadenat: string | null
  tipus: string | null
  color: string | null
  estat: string
}

export type Organitzacio = { id: string; nom: string; logo_url: string | null }

export type Cessio = {
  id: string
  bicicleta_id: string
  client_id: string | null
  usuari_nom: string | null
  usuari_email: string | null
  usuari_dni: string | null
  usuari_telefon: string | null
  data_inici: string | null
  data_fi: string | null
  check_in: string | null
  check_out: string | null
  estat: 'programada' | 'activa' | 'finalitzada' | 'cancel·lada'
  token_signatura: string | null
  created_at: string
  bicicletes?: Bicicleta | null
  clients?: { empresa: string | null; nom: string | null; logo_url: string | null } | null
}

export type Signatures = Record<string, string | null> // PNG data URL

export type ElementLliurat = { element: string; identificacio: string; estat: string; conforme: boolean }
export type ElementRetornat = {
  element: string
  retornat: 'Sí' | 'No' | 'Parcial'
  estat: string
  incidencies: string
  observacions: string
}

export type ActaLliurament = {
  servei_gestor: string
  escola_bressol: string
  beneficiaria_nom: string
  beneficiaria_document: string
  beneficiaria_telefon: string
  beneficiaria_email: string
  adult_nom: string // altra persona adulta autoritzada (signa)
  adult_document?: string // DNI/NIE de l'adult autoritzat (actes antigues no en tenen)
  infant_unitat_familiar: string
  infant2?: string // segon infant matriculat (opcional); surt a la mateixa casella de l'acta
  manifestacions_pdf_path?: string // PDF de les manifestacions addicionals (mateixa carpeta que l'acta)
  lliurament_data_hora: string // ISO
  lliurament_lloc: string
  retorn_data_prevista: string // yyyy-mm-dd
  retorn_lloc_horari: string
  canal_incidencies: string
  bici_marca_model: string
  bici_identificacio: string
  elements: ElementLliurat[]
  observacions: string
  num_fotos: number
  tecnic_nom: string
  signatures: { benef: string | null; adult: string | null; tecnic: string | null }
  documentacio_llegida_at?: string // quan la persona confirma que ha llegit els annexos
}

export type ActaRetorn = {
  retorn_persona: string
  retorn_persona_document: string
  condicio: 'beneficiaria' | 'autoritzada'
  retorn_data_hora: string // ISO
  retorn_lloc: string
  durada_cessio: string
  elements: ElementRetornat[]
  val_complet: boolean
  val_incidencies: boolean
  val_manca: boolean
  observacions: string
  num_fotos: number
  tecnic_nom: string
  signatures: { persona: string | null; tecnic: string | null }
  documentacio_llegida_at?: string
}

export type CessioActa = {
  id: string
  cessio_id: string
  fase: 'lliurament' | 'retorn'
  dades: ActaLliurament | ActaRetorn
  pdf_path: string | null
  docx_path: string | null
  fotos: string[]
  signat_at: string | null
  created_at: string
}
