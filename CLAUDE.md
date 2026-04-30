# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Internal admin panel for a Chilean digital game reseller. Scrapes deals from PSN, Xbox, Nintendo, and Steam across multiple regions (US, Brazil, Turkey, Japan), converts prices to CLP with configurable markups for three account types (primaria 1, primaria 2, secundaria), and compares against competitor stores. The operator selects games, exports CSV, and publishes to their storefront.

## Commands

```bash
npm run dev      # Start dev server (frontend + backend on :5173)
npm run build    # TypeScript check + Vite production build
npx tsc --noEmit # Type-check only (no output)
```

There are no tests, no linter, and no formatter configured.

## Architecture

**Single-process monolith**: Vite dev server hosts both the React frontend and a Node.js API backend via a Vite plugin (`server/plugin.ts`). No database driver — all state persists to `data/apipsn.json` (gitignored) with debounced writes.

### Backend (`server/`)

- **`plugin.ts`** — Vite middleware mounting `/api/*` routes
- **`api.ts`** — Hand-rolled HTTP router (~780 lines). All business logic lives here: refresh orchestration, game listing with computed prices, CSV export, competitor refresh, watchlist diffing. Routes use `route(method, path, handler)` pattern with `:param` support.
- **`store.ts`** — In-memory store backed by a single JSON file. Contains `DbShape` (the root schema), all data access methods, migration logic (`migrateGames`, `migrateSources`), and `scheduleSave()` (150ms debounce). Games keyed by composite key: `${platform}:${region}:${id}`.
- **`pricing.ts`** — Pure function: `computeSalePrices(priceCents, settings, currency)` → `{costClp, primaria1, primaria2, secundaria}`. Formula: `cost = price × exchangeRate × (1 + fee)`, then `variant = round(cost × multiplier, roundTo)`.
- **`competitors.ts`** — Scrapes competitor stores (Shopify, WooCommerce, HTML/sitemap+JSON-LD). Fuzzy matches competitor products against scraped games using Jaccard similarity (threshold 0.55).
- **`psn.ts`** / **`psn-product.ts`** — PSN-specific: GraphQL persisted queries for category listings, HTML scraping for product detail pages with media extraction.

### Provider Pattern (`server/providers/`)

Each platform implements the `Provider` interface:
```typescript
interface Provider {
  platform: Platform;  // "psn" | "xbox" | "nintendo" | "steam"
  fetchDeals(source: ProviderSource): AsyncGenerator<RawDeal>;
}
```
Async generators yield one deal at a time (memory-efficient pagination). The refresh loop in `api.ts` iterates all enabled sources, calls the appropriate provider, and upserts results.

- **PSN**: GraphQL persisted queries to `web.np.playstation.com` → `categoryGridRetrieve`
- **Xbox**: Two-step — deal IDs from `reco-public.rec.mp.microsoft.com`, then product details from `displaycatalog.mp.microsoft.com` (with fallback endpoints)
- **Nintendo US**: Algolia search API (`store_game_en_us` index) with cascading filter strategies (`generalFilters:Deals` → `percentOff>0` → unfiltered)
- **Steam**: HTML fragment parsing from `store.steampowered.com/search/results/?specials=1&cc={cc}`

### Frontend (`src/`)

React 18, no state library. `App.tsx` manages all top-level state (games, filters, settings, active tab). Key patterns:
- `fetchGames(filters)` sends query params; backend applies filters + computes CLP prices
- Games identified by `dbKey` (composite key) for PATCH operations
- Platform filter chips in `FiltersBar.tsx` control `?platform=` param
- `SettingsPanel.tsx` configures sources (enable/disable per platform+region), exchange rates, competitor stores
- GSAP animations via `anim.ts`

### Data Flow

```
User clicks "Actualizar ofertas"
→ POST /api/refresh
→ For each enabled ProviderSource:
    → provider.fetchDeals() yields RawDeal items
    → Upsert into store.games{} with composite key
    → Mark missing games as inactive
→ Recompute competitor matches
→ Diff watchlist (detect off_sale → on_sale transitions)
→ Response: {totalSeen, new, updated, disappeared, sourceResults[], watchlistAlerts[]}
→ Frontend reloads game list with fresh computed prices
```

## Key Conventions

- **Composite keys**: All games stored as `platform:region:id` (e.g., `psn:us:UP9000-CUSA07408_00-...`). This prevents ID collisions across platforms.
- **Prices in cents**: All prices stored as integers (cents) to avoid floating-point issues. Converted to display values (÷100) only in `toGameOut()`.
- **Multi-currency**: USD, BRL, TRY, JPY supported. Exchange rates configurable in settings. Each game carries its own `currency` field.
- **Spanish UI**: All user-facing text is in Spanish (Chilean market). Variable names and code comments in English.
- **No native deps**: Designed to run in WebContainers (Bolt/StackBlitz). No SQLite, no native modules.
- **Types duplicated**: `ProviderSource`, `PricingSettings`, etc. are defined separately in `server/store.ts` and `src/types.ts`. Keep them in sync manually.

## Important Caveats

- The JSON store has no transaction isolation. Concurrent writes during a refresh can race (debounce-based save).
- Provider APIs are undocumented/unofficial. Hashes, endpoints, and response formats can change without notice. Error messages should include enough context to diagnose (HTTP status + response body snippet).
- `server/api.ts` has a legacy PSN refresh path (`legacyPsnRefresh`) alongside the multi-platform path. The legacy path exists for backward compatibility when no sources are configured.
