WA Opt-in Demo
===============

Sistema minimale per raccogliere numeri WhatsApp dai siti dei ristoranti tramite snippet incorporabile, salvare consensi su DB e inviare un messaggio WhatsApp di benvenuto (template) via WhatsApp Cloud API.

Requisiti
--------
- Node.js 18+
- npm

Setup
-----
1. Clona o crea la cartella del progetto `~/wa-optin`.
2. Crea il file `.env` nella root del progetto con queste variabili (senza virgolette attorno ai valori):

```
DATABASE_URL=file:./dev.db
WHATSAPP_TOKEN=your_token
WABA_PHONE_NUMBER_ID=your_phone_number_id
WELCOME_TEMPLATE_NAME=offerta_di_benvenuto
WELCOME_TEMPLATE_LANG=it
DEV_API_KEY=change_me_for_local_dev
# Alias supportati (fallback, opzionali):
# WHATSAPP_ACCESS_TOKEN=your_token
# PHONE_NUMBER_ID=your_phone_number_id

In sviluppo puoi creare anche `.env.local` (non committare) per valori locali, ad es.:

```
WEBHOOK_VERIFY_TOKEN=my-verify-token-CHANGE-ME
WABA_APP_SECRET=CHANGE-ME
```
```
   - Next.js 15 legge automaticamente `.env` dalla root in sviluppo, non serve `dotenv` manuale.
   - Dopo ogni modifica a `.env` riavvia il dev server (`npm run dev`).

3. Installa dipendenze e inizializza DB:

```
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Avvio in locale
---------------

```
npm run dev
```

- Apri `http://localhost:3000/demo` per la pagina demo con menù e snippet.
- Nota: se vedi il messaggio "Port 3000 is in use, using 3001", apri `http://localhost:3001/demo`.
- Lo snippet carica `public/optin.js` dalla stessa origine, evitando problemi CORS.

Snippet incorporabile
---------------------

Esempio di uso su una pagina del ristorante (stessa origine in dev):

```html
<script src="/optin.js"
  data-tenant="RISTO_DEMO"
  data-policy-version="v1"
  data-api="/api">
</script>
```

- Attributi:
  - `data-tenant`: ID ristorante (tenant). Esempio: `RISTO_DEMO`.
  - `data-policy-version`: versione informativa privacy visualizzata.
  - `data-api`: base URL delle API (ad es. `/api` in locale, oppure URL assoluto in produzione).

Endpoint
--------

`POST /api/subscribe`

- Body JSON:

```json
{
  "tenant_id": "RISTO_DEMO",
  "phone": "+39 333 1234567",
  "wa_optin": true,
  "policy_version": "v1",
  "source": "qr-menu",
  "first_name": "Mario"
}
```

- Risposte:
  - `200 { ok: true, contactId: "..." }`
  - Errori: `400 invalid_request`, `404 tenant_not_found`, `429 rate_limited`.
  - Se mancano env critiche per WhatsApp, la risposta continua ad essere `200` con campi aggiuntivi: `{ ok: true, waSkipped: true, reason: "missing_env", missing: ["WHATSAPP_TOKEN", ...] }`.

Normalizzazione telefono (Italia)
--------------------------------
- Rimozione spazi; se manca prefisso, viene aggiunto `+39`.

Rate limit
---------
- 15 richieste per IP/minuto (memoria in-process). In produzione valuta uno store esterno.

CORS
----
- In dev, stessa origine evita CORS. In produzione, servi lo snippet da dominio tuo e limita l’endpoint a domini whitelist tramite un middleware (non incluso in questa versione base).

WhatsApp Cloud API
------------------
- Env richieste: `WHATSAPP_TOKEN`, `WABA_PHONE_NUMBER_ID`.
- Template usato: `offerta_di_benvenuto`, lingua `it`.
- Variabili BODY (4):
  1. nome cliente (fallback "Amico")
  2. nome ristorante
  3. etichetta omaggio (es. "calice di vino")
  4. codice promo (generato, es. `VOUCH-ABCDE`)

Se l'invio fallisce, viene loggato (inclusa la risposta testuale della Graph API) ma la subscribe risponde comunque `{ ok: true }`.

Debug env
---------
- `GET /debug/env`: mostra una tabella HTML con presenza (true/false) di variabili ufficiali e alias: `WHATSAPP_TOKEN` (alias `WHATSAPP_ACCESS_TOKEN`), `WABA_PHONE_NUMBER_ID` (alias `PHONE_NUMBER_ID`), `WELCOME_TEMPLATE_NAME`, `WELCOME_TEMPLATE_LANG`. I valori non vengono mai stampati.
- La pagina indica dove l'app legge gli env in dev: `.env.local` (prioritario) e `.env` in root, oltre a `process.cwd()` e link diretto alla demo.
- Nota: le variabili sono lette centralmente da `src/lib/env.ts` (con alias supportati). Non usare `process.env.*` direttamente altrove.

Troubleshooting WhatsApp env
---------------------------
1) Vai su `/debug/env` e verifica `present=true` per i nomi ufficiali o per gli alias (es. `WHATSAPP_TOKEN` oppure `WHATSAPP_ACCESS_TOKEN`; `WABA_PHONE_NUMBER_ID` oppure `PHONE_NUMBER_ID`).
2) Se non vuoi configurare subito `.env`, in development puoi testare l'invio via `POST /api/debug/wa-test` usando `dev_overrides` e `dev_key`.

Normalizzazione numero telefono
------------------------------

Troubleshooting 405 / Unexpected end of JSON
-------------------------------------------
- Verifica che `src/app/api/subscribe/route.ts` esporti sia `POST` che `OPTIONS` (nessun default export).
- Test rapido: `GET /api/health` deve rispondere `{ "ok": true }` con `Content-Type: application/json`.
- Conferma che la demo usi lo snippet con `data-api="/api"` (stessa origine). Così funziona anche se Next usa una porta diversa (3001/3003).
- L'input utente può essere sia `3331234567` sia `+39 333 123 4567` (con spazi o senza).
- Il numero viene salvato sempre in DB in formato E.164 con `+` (es. `+393331234567`).
- L'invio a WhatsApp Cloud API usa il formato senza `+` (es. `393331234567`).

Esempio cURL (dev overrides)
----------------------------
```bash
curl -sS -X POST http://localhost:3000/api/debug/wa-test \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "+393331234567",
    "dev_key": "'$DEV_API_KEY'",
    "dev_overrides": {
      "waToken": "<TEMP_TOKEN>",
      "phoneId": "<PHONE_NUMBER_ID>"
    }
  }'
```
Se gli overrides sono validi (solo in `NODE_ENV=development`), l'endpoint proverà l'invio e ritornerà il JSON della Graph API o un errore strutturato.

Modello dati (Prisma)
--------------------
- `Tenant(id, name, giftLabel, defaultLanguage?, wabaPhoneNumberId?, createdAt, updatedAt)`
- `Contact(tenantId, phoneE164, status, firstName?, policyVersion?, source?, timestamps)` con unique `(tenantId, phoneE164)`
- `ConsentLog(tenantId, contactId, phoneE164, waOptIn, policyVersion?, ip?, userAgent?, source?, createdAt)`

Esempi cURL
-----------

```bash
curl -sS -X POST http://localhost:3000/api/subscribe \
  -H 'Content-Type: application/json' \
  -d '{
    "tenant_id": "RISTO_DEMO",
    "phone": "3331234567",
    "wa_optin": true,
    "policy_version": "v1",
    "source": "qr-menu",
    "first_name": "Mario"
  }'
```

Deploy (es. Vercel)
-------------------
- Imposta env su Vercel: `DATABASE_URL` (Neon o Postgres), `WHATSAPP_TOKEN`, `WABA_PHONE_NUMBER_ID`, `WELCOME_TEMPLATE_NAME`, `WELCOME_TEMPLATE_LANG`.
- Esegui `npm run build` su Vercel. Usa `prisma migrate deploy` come step di migrazione.
- Servi `public/optin.js` e integra lo snippet sulle pagine dei ristoranti con `data-api` puntato all'URL pubblico delle API.

Note DX
------
- Logging errori su invio WhatsApp ed operazioni DB base via `console`.
- Codice modulare: `src/lib/whatsapp.ts`, `src/lib/db.ts`, `src/lib/rateLimit.ts`, API in `src/app/api/subscribe/route.ts`.

