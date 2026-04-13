# apipsn

Panel interno para extraer las ofertas de la PlayStation Store (región US,
tax-free) y calcular automáticamente precios de reventa en CLP para tres
variantes de cuenta (primaria 1, primaria 2, secundaria).

## Flujo

1. El backend consulta la API GraphQL interna de PSN (`categoryGridRetrieve`,
   persisted queries) con `x-psn-store-locale-override: en-US`.
2. Normaliza los productos y los guarda en SQLite.
3. El panel muestra precio USD → costo estimado CLP → tres precios de venta,
   todos configurables (tipo de cambio, fee, multiplicadores, redondeo).
4. Marcas los juegos que quieres publicar, exportas CSV y los subes a tu tienda.

## Correr localmente

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # editar si hace falta
uvicorn app.main:app --reload
```

Luego abre <http://127.0.0.1:8000/> — el backend sirve el panel estático.

## Configuración (`backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `PSN_REGION` | Locale de la tienda. Default `en-US`. |
| `PSN_DEALS_CATEGORY_ID` | UUID de la categoría de ofertas. Se obtiene de la URL en `store.playstation.com/en-us/category/<UUID>/...`. |
| `PSN_CATEGORY_GRID_HASH` | SHA256 de la persisted query. Si cambia, verás `persisted_query_not_found` al actualizar. |
| `DATABASE_URL` | Por defecto `sqlite:///./apipsn.db`. |

### Actualizar el hash cuando falle

1. Abre <https://store.playstation.com/en-us/category/...> (la categoría de ofertas).
2. DevTools (F12) → Network → filtra `graphql`.
3. Abre una request a `op?operationName=categoryGridRetrieve`.
4. Copia `extensions.persistedQuery.sha256Hash` de los query params.
5. Pégalo en `PSN_CATEGORY_GRID_HASH` en `.env` y reinicia.

## Endpoints

- `POST /api/refresh` → dispara el scraper.
- `GET /api/games?search=&min_discount=&sort=` → lista con precios calculados.
- `PATCH /api/games/{id}` → `{selected, published, notes}`.
- `GET /api/games/export.csv?only_selected=true` → CSV para cargar a tu tienda.
- `GET /api/settings` · `PUT /api/settings` → multiplicadores, TC USD→CLP, fee, redondeo.

## Fórmula de precios

```
costo_clp  = precio_usd * usd_to_clp * (1 + purchase_fee_pct)
primaria_1 = round(costo_clp * primaria_1_mult, round_to)
primaria_2 = round(costo_clp * primaria_2_mult, round_to)
secundaria = round(costo_clp * secundaria_mult, round_to)
```

Defaults: `primaria_1=1.80`, `primaria_2=1.60`, `secundaria=1.10`,
`purchase_fee_pct=0.05`, `round_to=500`.

## Referencias

- [mrt1m/playstation-store-api](https://github.com/mrt1m/playstation-store-api) — cliente PHP de la misma API.
- [AtaCanYmc/playstation-market-search](https://github.com/AtaCanYmc/playstation-market-search) — alternativa vía HTML scraping.

## Notas legales

Uso personal para administrar la reventa propia del operador. No redistribuye
la API de PSN ni se conecta a credenciales de usuarios finales.
