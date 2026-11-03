// Omple la plantilla Word oficial (public/assets/plantilla_annexos_longtail.docx) mantenint-ne el format.
import Docxtemplater from 'docxtemplater'
import ImageModule from 'docxtemplater-image-module-free'
import PizZip from 'pizzip'
import { PROGRAMA } from '../config'
import { data, dataHora } from './format'
import type { ActaLliurament, ActaRetorn } from './types'

const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
const box = (v: boolean) => (v ? '☒' : '☐')

export async function generarWord(l: ActaLliurament, r?: ActaRetorn | null): Promise<Blob> {
  const tpl = await fetch('/assets/plantilla_annexos_longtail.docx').then((res) => res.arrayBuffer())
  const imageModule = new ImageModule({
    centered: false,
    getImage: (v: string) => b64ToBytes(v ? v.replace(/^data:image\/\w+;base64,/, '') : PIXEL),
    getSize: (_img: unknown, v: string) => (v ? [130, 45] : [1, 1]),
  })
  const doc = new Docxtemplater(new PizZip(tpl), {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })
  doc.render({
    servei_gestor: l.servei_gestor,
    escola_bressol: l.escola_bressol,
    beneficiaria_nom: l.beneficiaria_nom,
    altres_adults: l.adult_nom,
    beneficiaria_document: l.beneficiaria_document,
    beneficiaria_contacte: [l.beneficiaria_telefon, l.beneficiaria_email].filter(Boolean).join(' · '),
    infant_unitat_familiar: l.infant_unitat_familiar,
    lliurament_data_hora: dataHora(l.lliurament_data_hora),
    lliurament_lloc: l.lliurament_lloc,
    retorn_data_prevista: data(l.retorn_data_prevista),
    retorn_lloc_horari: l.retorn_lloc_horari,
    bici_marca_model: l.bici_marca_model,
    bici_identificacio: l.bici_identificacio,
    canal_incidencies: l.canal_incidencies,
    lliurament_fotos_si: box(l.num_fotos > 0),
    lliurament_fotos_no: box(!(l.num_fotos > 0)),
    lliurament_num_fotos: l.num_fotos ? String(l.num_fotos) : '',
    elements_lliurament: l.elements.map((e) => ({ ...e, conforme: e.conforme ? 'Sí' : 'No' })),
    lliurament_observacions: l.observacions,
    benef_nom: l.beneficiaria_nom,
    benef_data: data(l.lliurament_data_hora),
    benef_signatura: l.signatures.benef ?? '',
    adult_nom: l.adult_nom,
    adult_data: l.adult_nom ? data(l.lliurament_data_hora) : '',
    adult_signatura: l.signatures.adult ?? '',
    tecnic_lliurament_nom: l.tecnic_nom,
    tecnic_lliurament_signatura: l.signatures.tecnic ?? '',
    empresa_nom: PROGRAMA.empresa_nom,

    retorn_persona: r?.retorn_persona ?? '',
    retorn_persona_document: r?.retorn_persona_document ?? '',
    retorn_data_hora: r ? dataHora(r.retorn_data_hora) : '',
    retorn_lloc: r?.retorn_lloc ?? '',
    durada_cessio: r?.durada_cessio ?? '',
    retorn_fotos_si: box(!!r && r.num_fotos > 0),
    retorn_fotos_no: box(!!r && !(r.num_fotos > 0)),
    retorn_num_fotos: r?.num_fotos ? String(r.num_fotos) : '',
    elements_retorn: r?.elements ?? [],
    val_complet: box(!!r?.val_complet),
    val_incidencies: box(!!r?.val_incidencies),
    val_manca: box(!!r?.val_manca),
    retorn_observacions: r?.observacions ?? '',
    cond_beneficiaria: box(r?.condicio === 'beneficiaria'),
    cond_autoritzada: box(r?.condicio === 'autoritzada'),
    retorn_persona_signatura: r?.signatures.persona ?? '',
    tecnic_retorn_nom: r?.tecnic_nom ?? '',
    tecnic_retorn_signatura: r?.signatures.tecnic ?? '',

    canal_telefon: PROGRAMA.canal.telefon,
    canal_email: PROGRAMA.canal.email,
    canal_formulari: PROGRAMA.canal.formulari,
    canal_horari: PROGRAMA.canal.horari,
    canal_urgencies: PROGRAMA.canal.urgencies,
  })
  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  }) as Blob
}
