# badevannweb

`badevannweb` er en webfrontend for badevann-data i Norge.

Prosjektet er bygget som en npm workspace med to apper:

1. `api`: Node + Express + TypeScript API som bruker `badevann@3.x` internt.
2. `web`: Vite + TypeScript SPA med vanilla Web Components.

## Arkitektur

### Backend (`/api`)

API-et eksponerer:

1. `GET /api/health`
2. `GET /api/meta`
3. `GET /api/temperatures?q=&county=&municipality=&sort=&limit=`
4. `GET /api/top?limit=`

Query `sort` støtter:

1. `temperature_desc`
2. `temperature_asc`
3. `name_asc`
4. `newest_desc`

Validering gjores med `zod`.

Dataflyt:

1. API-et importerer interne moduler fra `badevann` npm-pakken.
2. `badevann` sin interne cache settes til `cacheTimeout=0`.
3. API-et bruker egen minnecache med standard TTL 15 minutter.
4. Ved upstream-feil returneres stale cache hvis tilgjengelig, ellers `503`.

Merk: import av `badevann/src/...` er privat API og kan bryte ved fremtidige major-endringer i `badevann`.

### Frontend (`/web`)

SPA med disse custom elements:

1. `badevann-app`
2. `bv-filter-bar`
3. `bv-toplist`
4. `bv-temperature-list`
5. `bv-beach-detail`
6. `bv-status-bar`

Funksjoner i v1:

1. Sok med debounce (250ms)
2. Filtrering per fylke og kommune
3. Sortering
4. Toppliste
5. Detaljpanel for valgt badeplass
6. Loading/error/empty states

## Kom i gang

### Krav

1. Node.js 20+
2. npm 10+

### Installasjon

```bash
npm install
```

### Lokal utvikling

Kjor API og web samtidig:

```bash
npm run dev
```

Standard porter:

1. API: `http://localhost:3000`
2. Web: `http://localhost:5173`

### Miljovariabler

Kopier `.env.example` hvis du vil overstyre defaults:

```bash
cp .env.example .env
```

Stottede variabler:

1. `API_PORT`
2. `CORS_ORIGIN`
3. `API_CACHE_TTL_MS`

## Bygg, test og lint

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

Kjor Playwright-installasjon av nettleser ved forste oppsett:

```bash
npm exec --workspace web playwright install chromium
```

## Testdekning

### Backend

1. Query-logikk: sok/filter/sort/limit
2. Cache-styring + stale fallback
3. API-integrasjon med `supertest`

### Frontend

1. Debounced sok oppdaterer liste
2. Filter oppdaterer visning
3. Klikk i liste viser detaljer
4. Toppliste rangerer varmest forst
5. Error-state vises ved fetch-feil
6. E2E brukerflyt med Playwright:
   - Loading og loaded state
   - Sok med debounce
   - Fylke- og kommune-filtrering
   - Sortering
   - Valg av badeplass fra toppliste og hovedliste
   - Empty state
   - Error og stale status state
   - Skjermbilder for desktop og mobil
