export const dataHora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('ca-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : ''

export const data = (iso?: string | null) =>
  iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('ca-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) : ''

/** Valor per a <input type="datetime-local"> en hora local */
export const ara = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export const durada = (inici?: string | null, fi?: string | null) => {
  if (!inici || !fi) return ''
  const a = new Date(inici), b = new Date(fi)
  let mesos = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  let dies = b.getDate() - a.getDate()
  if (dies < 0) {
    mesos -= 1
    dies += new Date(b.getFullYear(), b.getMonth(), 0).getDate()
  }
  const parts = []
  if (mesos > 0) parts.push(`${mesos} ${mesos === 1 ? 'mes' : 'mesos'}`)
  parts.push(`${dies} ${dies === 1 ? 'dia' : 'dies'}`)
  return parts.join(' i ')
}

export const marcaModel = (b?: { marca: string | null; model: string | null } | null) =>
  b ? [b.marca, b.model].filter(Boolean).join(' / ') : ''

export const identificacioBici = (b?: {
  codi: string | null; num_bastidor: string | null; num_serie_bateria: string | null
} | null) =>
  b
    ? [b.codi && `Codi ${b.codi}`, b.num_bastidor && `Bastidor ${b.num_bastidor}`, b.num_serie_bateria && `Bateria ${b.num_serie_bateria}`]
        .filter(Boolean).join(' · ')
    : ''

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
