// Longtails Sant Cugat: correu a la persona usuària quan es signa l'acta de lliurament o de devolució.
// Només admins. Només cessions de l'Ajuntament de Sant Cugat amb l'acta de la fase ja signada.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const dataCat = (d?: string | null) => (d ? new Date(d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' }) : '')

const PORTAL = 'https://longtail.vaic.com'
const IMG = 'https://vaicmobility.github.io/longtails-stcugat/assets/email'
const TEL = '936 75 45 70'
const AVARIES = '679 92 37 56'
const WHATSAPP = '34679923756'
const EMAIL = 'serveis@vaic.com'

function plantilla(p: { nom: string; fase: 'lliurament' | 'retorn'; bici: string; data: string }) {
  const titol = p.fase === 'retorn' ? 'Gràcies per participar!' : 'Acta de lliurament signada'
  const retorn = p.fase === 'retorn'
  const cos = retorn
    ? `<p style="margin:0 0 14px;">Hem registrat la devolució de la bicicleta <strong>${esc(p.bici)}</strong>${p.data ? ` el ${esc(p.data)}` : ''}. La cessió queda finalitzada.</p>
      <p style="margin:0 0 14px;">Moltes gràcies per haver participat en el programa de bicicletes long tail de Sant Cugat. Esperem que t'hagi ajudat a moure't en bici amb la família i que la segueixis fent servir com a mitjà de transport!</p>
      <p style="margin:0 0 22px;">Tota la <strong>documentació de la cessió</strong> (l'acta de lliurament, les manifestacions addicionals i l'acta de devolució signades) continua disponible al teu portal.</p>`
    : `<p style="margin:0 0 14px;">Ja tens la bicicleta <strong>${esc(p.bici)}</strong>${p.data ? `, lliurada el ${esc(p.data)}` : ''}. Esperem que la gaudeixis molt!</p>
      <p style="margin:0 0 22px;">Al teu portal pots consultar en qualsevol moment la <strong>documentació generada</strong> (actes signades i documentació del programa) i fer la <strong>gestió de la teva bicicleta</strong>, com ara comunicar una incidència.</p>`
  return `<!doctype html>
<html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titol}</title></head>
<body style="margin:0;padding:0;background:#f4f5f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f2;">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dfe3dd;font-family:Arial,Helvetica,sans-serif;color:#1d2320;">
    <tr><td style="background:#13224f;padding:26px 28px;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a9b6dc;">Programa de cessió de bicicletes long tail</div>
      <div style="font-size:22px;font-weight:bold;color:#ffffff;margin-top:6px;">${titol}</div>
    </td></tr>
    <tr><td style="padding:28px 28px 8px;font-size:15px;line-height:1.55;">
      <p style="margin:0 0 14px;">Hola ${esc(p.nom)},</p>
      ${cos}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;"><tr><td style="background:#2f7d4f;border-radius:10px;">
        <a href="${PORTAL}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;">${retorn ? 'Consulta la documentació' : 'Accedeix al teu portal'}</a>
      </td></tr></table>
      <p style="margin:0 0 6px;text-align:center;"><a href="${PORTAL}" style="color:#2f7d4f;font-weight:bold;text-decoration:none;">longtail.vaic.com</a></p>
      <p style="margin:0 0 22px;text-align:center;font-size:13px;color:#6a726d;">Entra amb aquest mateix correu electrònic: rebràs un enllaç d'accés, sense contrasenya.</p>
    </td></tr>
    <tr><td style="padding:0 28px 26px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e5f1e8;border-radius:10px;">
        <tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:#1d2320;">
          <strong style="color:#2f7d4f;">Necessites ajuda?</strong><br>
          Botiga VAIC: <a href="tel:+34${TEL.replace(/\s/g, '')}" style="color:#1d2320;">${TEL}</a><br>
          Avaries (telèfon i WhatsApp): <a href="https://wa.me/${WHATSAPP}" style="color:#1d2320;">${AVARIES}</a><br>
          Correu: <a href="mailto:${EMAIL}" style="color:#1d2320;">${EMAIL}</a><br>
          <span style="color:#6a726d;font-size:13px;">De dilluns a divendres: de 10:00 a 14:00 i de 16:00 a 20:00</span>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="border-top:1px solid #dfe3dd;padding:22px 20px 18px;" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding:0 12px;" valign="middle"><a href="https://santcugat.cat"><img src="${IMG}/logo-ajuntament.png" alt="Ajuntament de Sant Cugat" height="34" style="display:block;height:34px;width:auto;border:0;"></a></td>
        <td style="padding:0 12px;" valign="middle"><a href="https://vaic.com"><img src="${IMG}/logo-vaic.png" alt="VAIC · La vida en bici" height="26" style="display:block;height:26px;width:auto;border:0;"></a></td>
        <td style="padding:0 12px;" valign="middle"><a href="https://impulsalabici.com"><img src="${IMG}/logo-impulsa.png" alt="Impulsa la Bici" height="26" style="display:block;height:26px;width:auto;border:0;"></a></td>
      </tr></table>
      <p style="margin:14px 0 0;font-size:11px;color:#8a918c;line-height:1.5;">Has rebut aquest correu perquè participes en el programa de cessió de bicicletes long tail de l'Ajuntament de Sant Cugat del Vallès, gestionat per VAIC Mobility.</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: u } = await userClient.auth.getUser()
    if (!u?.user) return json({ error: 'No autenticat' }, 401)
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: esAdmin } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' })
    if (!esAdmin) return json({ error: 'No autoritzat' }, 403)

    const { cessio_id, fase, prova_email } = await req.json().catch(() => ({}))
    if (typeof cessio_id !== 'string' || cessio_id.length > 64 || !['lliurament', 'retorn'].includes(fase)) return json({ error: 'Paràmetres no vàlids' }, 400)

    const { data: c } = await admin.from('cessions')
      .select('id, usuari_nom, usuari_email, check_in, check_out, bicicletes(codi, marca, model), clients(empresa)')
      .eq('id', cessio_id).maybeSingle()
    if (!c) return json({ error: 'Cessió no trobada' }, 404)
    if (!/^Ajuntament de Sant Cugat/i.test((c as any).clients?.empresa ?? '')) return json({ error: 'Cessió fora del programa' }, 403)
    const { data: acta } = await admin.from('cessio_actes').select('signat_at').eq('cessio_id', cessio_id).eq('fase', fase).maybeSingle()
    if (!acta?.signat_at) return json({ error: "L'acta encara no està signada" }, 400)

    const desti = typeof prova_email === 'string' && /^[^@\s]+@vaic(mobility)?\.com$/i.test(prova_email) ? prova_email : c.usuari_email
    if (!desti || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(desti)) return json({ error: 'La persona usuària no té un correu vàlid' }, 400)

    const b: any = (c as any).bicicletes ?? {}
    const bici = [[b.marca, b.model].filter(Boolean).join(' '), b.codi && `(${b.codi})`].filter(Boolean).join(' ')
    const html = plantilla({ nom: c.usuari_nom ?? '', fase, bici: bici || 'del programa', data: dataCat(fase === 'retorn' ? c.check_out : c.check_in) })
    const assumpte = fase === 'retorn'
      ? 'Bicicleta long tail: devolució registrada, gràcies per participar!'
      : 'Bicicleta long tail: acta de lliurament signada'

    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)
    const { error } = await resend.emails.send({
      from: 'VAIC Sant Cugat <info@vaic.com>', to: [desti], replyTo: EMAIL, subject: assumpte, html,
    })
    if (error) return json({ error: error.message }, 502)
    return json({ ok: true, a: desti })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
