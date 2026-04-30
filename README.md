# apipsn

Panel interno para extraer las ofertas de la **PlayStation Store US** (en-US,
tax-free) y calcular automáticamente precios de reventa en CLP para tres
variantes de cuenta (primaria 1, primaria 2, secundaria).

Stack: **Vite + React + TypeScript** en el frontend y un **servidor Node embebido
como plugin de Vite** en el backend. Todo corre con un solo `npm run dev`, sin
módulos nativos, así que funciona en Bolt / StackBlitz / WebContainers.

## Correr en Bolt (o StackBlitz)

1. Abrí el repo en Bolt/StackBlitz importando desde GitHub:
   `https://github.com/Arklad1305/apipsn` (rama `claude/playstation-store-scraper-B4yd2`).
2. Bolt detecta `package.json` y corre `npm install && npm run dev` solo.
3. Al abrirse el preview, hacé clic en **Seed demo** para poblar el panel con
   datos de ejemplo (el scraping real a PSN normalmente falla desde la sandbox
   de Bolt porque PSN bloquea IPs de datacenter).

## Correr localmente

```bash
npm install
npm run dev
```

Abrí <http://localhost:5173/>. Para el scraping real:

1. Clic en **Actualizar ofertas**.
2. Si ves `persisted_query_not_found`, abrí **Ajustes** y actualizá el
   `SHA256 persisted query`:
   - Entrá a <https://store.playstation.com/en-us/category/...>
   - DevTools (F12) → Network → filtrá `graphql`.
   - Abrí una request a `op?operationName=categoryGridRetrieve`.
   - Copiá `extensions.persistedQuery.sha256Hash` y pegalo en Ajustes.

## Flujo

1. **Actualizar ofertas** llama al GraphQL de PSN (`categoryGridRetrieve`) con
   `x-psn-store-locale-override: en-US` y upserta los productos en
   `data/apipsn.json` (persistencia por archivo, simple y sin deps nativas).
2. El panel muestra precio USD → costo estimado CLP → tres precios de venta,
   todos **recalculados en vivo** al cambiar ajustes.
3. Marcás los juegos que vas a publicar, exportás CSV y los subís a tu tienda.

## Fórmula de precios

```
costo_clp    = precio_usd × usd_to_clp × (1 + purchase_fee_pct)
primaria_1   = round(costo_clp × primaria1Mult, roundTo)
primaria_2   = round(costo_clp × primaria2Mult, roundTo)
secundaria   = round(costo_clp × secundariaMult, roundTo)
```

Defaults: `primaria1Mult=1.80`, `primaria2Mult=1.60`, `secundariaMult=1.10`,
`purchaseFeePct=0.05`, `roundTo=500`. Todo editable desde el panel **Ajustes**.

## Endpoints

| Método | Path                              | Descripción                                |
| ------ | --------------------------------- | ------------------------------------------ |
| GET    | `/api/games?search=&sort=…`       | Lista con precios calculados.              |
| PATCH  | `/api/games/:id`                  | `{ selected?, published?, notes? }`.       |
| POST   | `/api/refresh`                    | Dispara scraper contra PSN.                |
| GET    | `/api/settings`                   | Config de pricing + PSN.                   |
| PUT    | `/api/settings`                   | `{ pricing?, psn? }` (parcial).            |
| GET    | `/api/games/export.csv`           | CSV con seleccionados (por defecto).       |
| POST   | `/api/mock/seed`                  | Carga un set demo para explorar el panel.  |
| POST   | `/api/mock/clear`                 | Desactiva todos los juegos.                |

## Estructura

```
/package.json                 monorepo único (deps front + back)
/vite.config.ts               plugin apiPlugin() monta /api/*
/index.html + /src/*.tsx      frontend React + TypeScript
/server/
  plugin.ts                   wrapper Vite → handleRequest()
  api.ts                      router + rutas /api
  psn.ts                      cliente GraphQL persisted queries
  pricing.ts                  fórmula de precios
  store.ts                    persistencia JSON (sin SQLite)
  demo-data.ts                juegos demo para Bolt
/data/apipsn.json             DB local (auto-generada, gitignored)
```

## Referencias

- [mrt1m/playstation-store-api](https://github.com/mrt1m/playstation-store-api) — cliente PHP de la misma API.
- [AtaCanYmc/playstation-market-search](https://github.com/AtaCanYmc/playstation-market-search) — alternativa vía HTML scraping.

## Notas legales

Uso personal para administrar la reventa propia del operador. No redistribuye
la API de PSN ni se conecta a credenciales de usuarios finales.
