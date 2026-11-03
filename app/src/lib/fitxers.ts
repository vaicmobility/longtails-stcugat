import { BUCKET, supabase } from './supabase'

/**
 * Descarrega un fitxer del bucket privat amb la sessió de l'usuari (sense enllaços compartibles).
 * Els PDF i les fotos s'obren en una pestanya nova; la resta es desa amb el nom indicat.
 */
export async function obrirFitxer(path: string, nom?: string) {
  const esPdf = path.toLowerCase().endsWith('.pdf')
  const finestra = esPdf || !nom ? window.open('', '_blank') : null // abans de l'await (bloqueig de popups)
  try {
    const { data: blob, error } = await supabase.storage.from(BUCKET).download(path)
    if (error || !blob) throw new Error(error?.message || "No s'ha pogut descarregar el fitxer")
    const url = URL.createObjectURL(blob)
    if (finestra) {
      finestra.location.href = url
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = nom || path.split('/').pop() || 'document'
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    finestra?.close()
    throw e
  }
}
