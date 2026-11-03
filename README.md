# VAIC Cessions – Eina de botiga (programa longtail Sant Cugat)

App web per a tauleta o ordinador perquè el personal de VAIC registri el **lliurament** i el **retorn** de les bicicletes en cessió. El personal entra amb el seu usuari de VAIC Renting (cal tenir el rol `admin`).

Què fa:

1. **Nou lliurament (Annex I)**: correu de l'usuari (si ja ha tingut cessions, les dades s'omplen soles), dades de la persona, assignació d'una bici disponible, elements lliurats i fotos, signatures amb el dit, i generació de l'acta.
2. **Retorn (Annex II)**: elements retornats (es parteix del que es va lliurar), valoració, fotos, signatures i generació de l'acta. La cessió passa a *finalitzada* i la bici torna a *disponible* o passa a *fora de servei*.
3. **Documents**: per a cada acta es genera un **PDF per imprimir** i el **Word oficial** de l'Ajuntament amb els camps omplerts. Tots dos es guarden al bucket privat `cessions`, junt amb les fotos.

## Posar-la en marxa

```bash
cd app
cp .env.example .env      # URL i clau pública de Supabase (ja omplertes)
npm install
npm run dev               # http://localhost:5173
npm run build             # genera dist/ per publicar
```

**Publicació**: `dist/` és una web estàtica. Es pot publicar a Vercel, Netlify o Cloudflare Pages amb build `npm run build`, sortida `dist` i *SPA fallback* (totes les rutes han de servir `index.html`). A Vercel n'hi ha prou d'importar el repositori i definir les variables `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`.

## Base de dades

La migració ja està **aplicada** al projecte Vaic_Renting (03/11/2026). Per a un altre entorn, cal aplicar `supabase/migrations/20261102_cessio_actes.sql`. Fa el següent:

- crea la taula `cessio_actes` (una fila per acta: dades en jsonb, rutes del PDF, del Word i de les fotos), amb accés només per a administradors;
- crea el bucket **privat** `cessions` (PDF, Word i imatges, fins a 20 MB) amb polítiques d'accés només per a administradors;
- afegeix índexs a `cessions(lower(usuari_email))` i a `cessions(bicicleta_id)`.

No modifica cap taula ni cap política existent.

## Configuració del programa

A `app/src/config.ts` hi ha:

- el servei gestor;
- el nom de l'empresa;
- els llocs per defecte;
- el **canal d'incidències** (telèfon, email, horari, urgències): ara posa "(a definir)" i s'ha d'omplir;
- la llista d'elements per defecte;
- el filtre de tipus de bici (longtail / cargo).

## Fitxers clau

| Fitxer | Funció |
|---|---|
| `app/src/pages/Lliurament.tsx` | Assistent de lliurament (5 passos) |
| `app/src/pages/Retorn.tsx` | Assistent de retorn (4 passos) |
| `app/src/lib/pdf.tsx` | PDF de les actes (Annex I + III, Annex II) |
| `app/src/lib/docx.ts` | Omple la plantilla Word oficial |
| `app/public/assets/plantilla_annexos_longtail.docx` | Plantilla Word amb marcadors `{camp}` |
| `app/src/lib/api.ts` | Lectures i escriptures a Supabase |

## Pendent / següents passos

- Portal d'usuaris (`/c/:token`): consulta de la cessió i formulari d'incidències.
- Enviar per email el PDF i l'enllaç al portal en acabar el lliurament.
- Donar d'alta "Ajuntament de Sant Cugat" com a organització (client) a VAIC Renting.
- Passar a privat el bucket `contractes`, que ara és públic.
