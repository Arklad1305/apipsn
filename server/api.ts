/**
 * Minimal HTTP router for the /api/* namespace. Uses only node:http types so
 * we don't need Express as a dependency.
 *
 * Routes:
 *   GET    /games                      list with computed CLP prices
 *   PATCH  /games/:id                  { selected?, published?, notes? }
 *   POST   /refresh                    scrape PSN and upsert
 *   GET    /games/export.csv           CSV of selected games
 *   GET    /settings                   pricing + psn config
 *   PUT    /settings                   partial update (pricing and/or psn)
 *   POST   /mock/clear                 deactivate all games
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { store, type Game, type WatchedGame, type SupabaseConfig } from "./store";
import { computeSalePrices } from "./pricing";
import {
  inspectProductTypes,
  PersistedQueryNotFoundError,
  PsnApiError,
  debugScrapePage,
} from "./psn";
import {
  fetchCompetitor,
  matchGames,
  CompetitorFetchError,
  tokenize,
  similarity,
  type CompetitorConfig,
  type CompetitorMatch,
} from "./competitors";
import { fetchProductDetail } from "./psn-product";
import {
  getProvider,
  PLATFORM_LABELS,
  PLATFORM_REGIONS,
  ProviderError,
} from "./providers/index";
import type { Platform, ProviderSource } from "./providers/types";
import { fetchExchangeRates } from "./exchange";
import { getLastAutoRefreshAt, reschedule, startScheduler } from "./scheduler";
import { matchPlansWithCompetitors, scrapePsPlusPrices } from "./ps-plus";
import type { ScrapedPlusPrices } from "./ps-plus";

/** Extract a PSN product id from a store URL. Accepts both en-US and other
 *  locales, and tolerates trailing segments / query strings. */
function extractPsnId(input: string): string | null {
  const s = String(input || "").trim();
  if (!s) return null;
  // Already an id (UPXXXX-CUSAXXXXX_00-… or EP… / UC…)
  if (/^[A-Z]{2}[0-9]{4}-[A-Z0-9]+_[0-9]{2}(?:-[A-Z0-9]+)?$/.test(s)) return s;
  const m = /\/product\/([A-Z]{2}[0-9]{4}-[A-Z0-9]+_[0-9]{2}(?:-[A-Z0-9]+)?)/i.exec(
    s
  );
  return m ? m[1].toUpperCase() : null;
}

interface WatchlistAlert {
  id: string;
  name: string;
  discountPercent: number;
  priceDiscountedUsd: number | null;
  storeUrl: string | null;
}

/** Diff the watchlist against the fresh scrape and flag transitions. Updates
 *  each watched entry's lastStatus in place. Returns the list of games that
 *  transitioned off_sale → on_sale this run. */
function diffWatchlist(seen: Set<string>, nowIso: string): WatchlistAlert[] {
  const alerts: WatchlistAlert[] = [];
  for (const w of store.listWatchlist()) {
    const game = store.getGame(w.id);
    const inSaleNow =
      !!game && game.active && game.discountPercent > 0 && seen.has(w.id);
    const transitioned = inSaleNow && w.lastStatus !== "on_sale";

    if (transitioned && game) {
      alerts.push({
        id: w.id,
        name: game.name,
        discountPercent: game.discountPercent,
        priceDiscountedUsd:
          game.priceDiscountedCents != null
            ? game.priceDiscountedCents / 100
            : null,
        storeUrl: game.storeUrl,
      });
    }

    store.patchWatched(w.id, {
      name: game?.name || w.name,
      lastStatus: inSaleNow ? "on_sale" : w.lastStatus === "unseen" ? "unseen" : "off_sale",
      lastSeenOnSaleAt: inSaleNow ? nowIso : w.lastSeenOnSaleAt,
      lastPriceCents: game?.priceDiscountedCents ?? w.lastPriceCents,
      lastDiscountPercent: game?.discountPercent ?? w.lastDiscountPercent,
    });
  }
  return alerts;
}

type Handler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

function route(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/:([a-zA-Z_]+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "$"
  );
  routes.push({ method, pattern, keys, handler });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function gameDbKey(g: Game): string {
  return `${g.platform}:${g.region}:${g.id}`;
}

/** Save product detail and update the game's imageUrl to the portrait if available. */
function saveDetailAndUpdateImage(game: Game, detail: import("./psn-product").ProductDetail): void {
  store.setProductDetail(game.id, detail);
  const portrait = detail.media?.portraitUrl;
  if (portrait && portrait !== game.imageUrl) {
    store.patchGame(gameDbKey(game), { imageUrl: portrait });
  }
}

const ADD_ON_PATTERN = /\b(dlc|season pass|avatar|theme|currency pack|coin pack|point pack)\b/i;
const PREMIUM_EDITION = /\b(deluxe|ultimate|complete|goty|game of the year|digital edition|launch edition)\b/i;

function computeHitScore(g: Game): number {
  // No discount = not viable for resale
  if (g.discountPercent <= 0) return 0;

  let score = 0;
  const priceUsd = (g.priceOriginalCents ?? 0) / 100;

  // AAA price tier
  if (priceUsd >= 60) score += 30;
  else if (priceUsd >= 40) score += 20;
  else if (priceUsd >= 20) score += 10;

  // Discount depth
  if (g.discountPercent >= 40) score += 25;
  else if (g.discountPercent >= 25) score += 15;
  else if (g.discountPercent > 0) score += 5;

  // Known publisher (from enriched product detail)
  const detail = store.getProductDetail(g.id);
  if (detail?.publisher) {
    const hitPubs = store.getHitPublishers();
    const pub = detail.publisher.toLowerCase();
    if (hitPubs.some((p) => pub.includes(p.toLowerCase()))) score += 25;
  }

  // PS5 support
  if (g.platforms?.includes("PS5")) score += 10;

  // Penalty for add-on content (unless it's a premium edition)
  if (ADD_ON_PATTERN.test(g.name) && !PREMIUM_EDITION.test(g.name)) score -= 50;

  return Math.max(0, Math.min(100, score));
}

function generateSku(name: string): string {
  const slug = name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join("-");
  return `PS-${slug}-001`;
}

function toGameOut(g: Game, cfgPricing = store.getSettings()) {
  const sale = computeSalePrices(g.priceDiscountedCents, cfgPricing, g.currency || "USD");
  const dbKey = gameDbKey(g);
  const matches = store.getCompetitorMatches(dbKey) || store.getCompetitorMatches(g.id);
  const marketMin = matches.length
    ? Math.min(...matches.map((m) => m.priceClp))
    : null;
  return {
    id: g.id,
    dbKey,
    platform: g.platform || "psn",
    region: g.region || "us",
    currency: g.currency || "USD",
    name: g.name,
    imageUrl: g.imageUrl,
    storeUrl: g.storeUrl,
    platforms: g.platforms,
    priceOriginal:
      g.priceOriginalCents != null ? g.priceOriginalCents / 100 : null,
    priceDiscounted:
      g.priceDiscountedCents != null ? g.priceDiscountedCents / 100 : null,
    priceOriginalUsd:
      g.priceOriginalCents != null ? g.priceOriginalCents / 100 : null,
    priceDiscountedUsd:
      g.priceDiscountedCents != null ? g.priceDiscountedCents / 100 : null,
    discountPercent: g.discountPercent,
    discountEndAt: g.discountEndAt,
    selected: g.selected,
    published: g.published,
    notes: g.notes,
    youtubeUrl: g.youtubeUrl || "",
    active: g.active,
    costClp: sale?.costClp ?? null,
    primaria: sale?.primaria ?? null,
    secundaria: sale?.secundaria ?? null,
    totalRevenue: sale?.totalRevenue ?? null,
    netProfit: sale?.netProfit ?? null,
    marketMin,
    marketCount: matches.length,
    marketMatches: matches,
    hitScore: computeHitScore(g),
  };
}

// GET /games
route("GET", "/games", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const minDiscount = parseInt(url.searchParams.get("min_discount") || "0", 10) || 0;
  const onlySelected = url.searchParams.get("only_selected") === "true";
  const hidePublished = url.searchParams.get("hide_published") === "true";
  const onlyWithMarket = url.searchParams.get("only_with_market") === "true";
  const includeInactive = url.searchParams.get("include_inactive") === "true";
  const platformFilter = url.searchParams.get("platform") || "";
  const onlyHits = url.searchParams.get("only_hits") === "true";
  const sort = url.searchParams.get("sort") || "discount";

  let games = store.listGames();
  if (!includeInactive) games = games.filter((g) => g.active);
  if (platformFilter) games = games.filter((g) => (g.platform || "psn") === platformFilter);
  if (minDiscount > 0) games = games.filter((g) => g.discountPercent >= minDiscount);
  if (onlySelected) games = games.filter((g) => g.selected);
  if (hidePublished) games = games.filter((g) => !g.published);
  if (onlyHits) games = games.filter((g) => computeHitScore(g) >= 50);
  if (onlyWithMarket) {
    games = games.filter((g) => {
      const key = gameDbKey(g);
      return (store.getCompetitorMatches(key) || store.getCompetitorMatches(g.id)).length > 0;
    });
  }
  if (search) games = games.filter((g) => g.name.toLowerCase().includes(search));

  if (sort === "hit") games.sort((a, b) => computeHitScore(b) - computeHitScore(a));
  else if (sort === "price") games.sort((a, b) => (a.priceDiscountedCents ?? 0) - (b.priceDiscountedCents ?? 0));
  else if (sort === "name") games.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "market") {
    games.sort((a, b) => {
      const am = store.getCompetitorMatches(a.id);
      const bm = store.getCompetitorMatches(b.id);
      const ap = am.length ? Math.min(...am.map((m) => m.priceClp)) : Infinity;
      const bp = bm.length ? Math.min(...bm.map((m) => m.priceClp)) : Infinity;
      return ap - bp;
    });
  }
  else games.sort((a, b) => b.discountPercent - a.discountPercent);

  const cfg = store.getSettings();
  sendJson(res, 200, games.map((g) => toGameOut(g, cfg)));
});

// PATCH /games/:id — id can be a composite dbKey (psn:us:UPXXXX-...) or a bare PSN id
route("PATCH", "/games/:id", async (req, res, params) => {
  const body = (await readBody(req)) as Partial<
    Pick<Game, "selected" | "published" | "notes" | "youtubeUrl">
  >;
  const patch: Partial<Game> = {};
  if (typeof body.selected === "boolean") patch.selected = body.selected;
  if (typeof body.published === "boolean") patch.published = body.published;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.youtubeUrl === "string") patch.youtubeUrl = body.youtubeUrl.trim();
  const id = decodeURIComponent(params.id);
  let updated = store.patchGame(id, patch);
  if (!updated) {
    // Try legacy key (bare PSN id)
    updated = store.patchGame(`psn:us:${id}`, patch);
  }
  if (!updated) return sendJson(res, 404, { error: "not_found" });
  sendJson(res, 200, toGameOut(updated));
});

// POST /refresh — multi-platform refresh. Optional body: { platform?, region? }
// With no body, refreshes all enabled sources. With platform/region, refreshes
// only that specific source.
route("POST", "/refresh", async (req, res) => {
  try {
    const body = await readBody(req);
    const targetPlatform = body.platform as Platform | undefined;
    const targetRegion = body.region as string | undefined;

    const sources = store.getSources().filter((s) => {
      if (!s.enabled) return false;
      if (targetPlatform && s.platform !== targetPlatform) return false;
      if (targetRegion && s.region !== targetRegion) return false;
      return true;
    });

    const nowIso = new Date().toISOString();
    const results: Array<{
      platform: string;
      region: string;
      newCount: number;
      updated: number;
      disappeared: number;
      totalSeen: number;
      error?: string;
    }> = [];
    let allWatchlistAlerts: WatchlistAlert[] = [];

    for (const source of sources) {
      try {
        const provider = getProvider(source.platform);
        const seenKeys = new Set<string>();
        let newCount = 0;
        let updated = 0;
        let totalSeen = 0;

        // For PSN, inject the categoryId from the PSN config if not on source
        const effSource = { ...source };
        if (source.platform === "psn" && !source.categoryId) {
          effSource.categoryId = store.getPsn().dealsCategoryId;
        }

        for await (const deal of provider.fetchDeals(effSource)) {
          totalSeen++;
          const dbKey = `${source.platform}:${source.region}:${deal.id}`;
          seenKeys.add(dbKey);
          const existing = store.getGameByComposite(source.platform, source.region, deal.id);
          if (!existing) {
            store.upsertGame({
              id: deal.id,
              platform: source.platform,
              region: source.region,
              name: deal.name,
              imageUrl: deal.imageUrl,
              storeUrl: deal.storeUrl,
              platforms: deal.hardwarePlatforms,
              currency: deal.currency,
              priceOriginalCents: deal.priceOriginalCents,
              priceDiscountedCents: deal.priceDiscountedCents,
              discountPercent: deal.discountPercent,
              discountEndAt: deal.discountEndAt,
              selected: false,
              published: false,
              notes: "",
              youtubeUrl: "",
              active: true,
              firstSeenAt: nowIso,
              lastSeenAt: nowIso,
              updatedAt: nowIso,
            });
            newCount++;
          } else {
            store.upsertGame({
              ...existing,
              name: deal.name || existing.name,
              imageUrl: deal.imageUrl || existing.imageUrl,
              storeUrl: deal.storeUrl || existing.storeUrl,
              platforms: deal.hardwarePlatforms,
              currency: deal.currency,
              priceOriginalCents: deal.priceOriginalCents,
              priceDiscountedCents: deal.priceDiscountedCents,
              discountPercent: deal.discountPercent,
              discountEndAt: deal.discountEndAt,
              active: true,
              lastSeenAt: nowIso,
              updatedAt: nowIso,
            });
            updated++;
          }
        }

        const disappeared = store.markInactiveIfMissing(
          seenKeys,
          source.platform,
          source.region
        );

        results.push({
          platform: source.platform,
          region: source.region,
          newCount,
          updated,
          disappeared,
          totalSeen,
        });
      } catch (e) {
        const errMsg = (e as Error).message;
        console.error(`[${source.platform}/${source.region}] Error: ${errMsg}`);
        results.push({
          platform: source.platform,
          region: source.region,
          newCount: 0,
          updated: 0,
          disappeared: 0,
          totalSeen: 0,
          error: errMsg,
        });
      }
    }

    recomputeMatches();
    // Diff watchlist for PSN sources
    const psnSeenIds = new Set<string>();
    for (const g of store.listGames()) {
      if (g.active && g.platform === "psn") psnSeenIds.add(g.id);
    }
    allWatchlistAlerts = diffWatchlist(psnSeenIds, nowIso);

    const totalNew = results.reduce((s, r) => s + r.newCount, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalDisappeared = results.reduce((s, r) => s + r.disappeared, 0);
    const totalSeen = results.reduce((s, r) => s + r.totalSeen, 0);
    const totalKept = results.reduce((s, r) => s + r.totalSeen - (r.error ? r.totalSeen : 0), 0);

    sendJson(res, 200, {
      new: totalNew,
      updated: totalUpdated,
      disappeared: totalDisappeared,
      totalSeen,
      kept: totalKept,
      filteredAddOns: 0,
      watchlistAlerts: allWatchlistAlerts,
      sourceResults: results,
    });
  } catch (e) {
    if (e instanceof PersistedQueryNotFoundError) {
      return sendJson(res, 502, {
        error: "persisted_query_not_found",
        message: (e as Error).message,
        hint:
          "Abre DevTools > Network en la página de ofertas de PS Store, busca la " +
          "request a /api/graphql/v1/op?operationName=categoryGridRetrieve y " +
          "actualiza el hash en Ajustes.",
      });
    }
    if (e instanceof PsnApiError || e instanceof ProviderError) {
      return sendJson(res, 502, {
        error: "provider_error",
        message: (e as Error).message,
        hint:
          "Si esto corre en una sandbox (Bolt/StackBlitz) la IP puede estar " +
          "bloqueada. Probá desde tu máquina o servidor.",
      });
    }
    sendJson(res, 500, { error: "internal", message: (e as Error).message });
  }
});

// GET /games/export.csv
// Params: only_selected=true|false, format=sheets (BOM + semicolons for Google Sheets)
route("GET", "/games/export.csv", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const onlySelected = url.searchParams.get("only_selected") !== "false";
  const sheetsFormat = url.searchParams.get("format") === "sheets";
  const sep = sheetsFormat ? ";" : ",";

  let games = store.listGames().filter((g) => g.active);
  if (onlySelected) games = games.filter((g) => g.selected);
  const cfg = store.getSettings();

  const header = [
    "id",
    "plataforma",
    "region",
    "moneda",
    "name",
    "platforms",
    "store_url",
    "precio_original",
    "precio_descuento",
    "descuento_pct",
    "fin_oferta",
    "costo_clp",
    "primaria_clp",
    "secundaria_clp",
    "ingreso_total",
    "ganancia_neta",
    "margen_pct",
    "notas",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    const needsQuote = s.includes(sep) || s.includes('"') || s.includes("\n");
    return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const now = new Date().toISOString().slice(0, 10);
  const metadata = sheetsFormat
    ? `# Exportado: ${now} · TC USD: ${cfg.usdToClp} · Descuento saldo USD: ${cfg.balanceDiscountUsd}\n`
    : "";

  const lines = [header.join(sep)];
  for (const g of games) {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const cost = sale?.costClp ?? null;
    const margen = cost && sale?.netProfit
      ? Math.round((sale.netProfit / cost) * 100)
      : "";
    lines.push(
      [
        g.id,
        g.platform || "psn",
        g.region || "us",
        g.currency || "USD",
        g.name,
        g.platforms,
        g.storeUrl ?? "",
        g.priceOriginalCents != null ? (g.priceOriginalCents / 100).toFixed(2) : "",
        g.priceDiscountedCents != null ? (g.priceDiscountedCents / 100).toFixed(2) : "",
        g.discountPercent,
        g.discountEndAt ?? "",
        cost ?? "",
        sale?.primaria ?? "",
        sale?.secundaria ?? "",
        sale?.totalRevenue ?? "",
        sale?.netProfit ?? "",
        margen,
        g.notes,
      ]
        .map(escape)
        .join(sep)
    );
  }

  const content = metadata + lines.join("\n");
  const bom = sheetsFormat ? "﻿" : "";

  res.statusCode = 200;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", 'attachment; filename="apipsn-games.csv"');
  res.end(bom + content);
});

// GET /games/export-supabase.csv — CSV matching the Supabase products table schema exactly
route("GET", "/games/export-supabase.csv", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const onlySelected = url.searchParams.get("only_selected") !== "false";
  const platformFilter = url.searchParams.get("platform") || "";

  let games = store.listGames().filter((g) => g.active);
  if (onlySelected) games = games.filter((g) => g.selected);
  if (platformFilter) games = games.filter((g) => g.platform === platformFilter);
  const cfg = store.getSettings();

  const header = [
    "sku",
    "display_name",
    "images",
    "platform_availability",
    "pricing_by_platform_and_account",
    "stock_quantity",
    "is_active",
    "sort_order",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    const needsQuote = s.includes(",") || s.includes('"') || s.includes("\n");
    return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [header.join(",")];
  for (const g of games) {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const detail = store.getProductDetail(g.id);

    // SKU: PS-SLUG-001
    const slug = g.name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join("-");
    const sku = `PS-${slug}-001`;

    // Images: [{alt, url}] — portrait (box art) first, then carousel/screenshots
    const images: Array<{ alt: string; url: string }> = [];
    const portraitUrl = detail?.media?.portraitUrl ?? g.imageUrl;
    if (portraitUrl) images.push({ alt: g.name, url: portraitUrl });
    const coverUrl = detail?.media?.coverUrl;
    if (coverUrl && coverUrl !== portraitUrl) images.push({ alt: g.name, url: coverUrl });
    if (detail?.carouselImages) {
      for (const img of detail.carouselImages) {
        if (!images.some((x) => x.url === img)) images.push({ alt: g.name, url: img });
      }
    }
    if (detail?.media?.screenshots) {
      for (const img of detail.media.screenshots) {
        if (!images.some((x) => x.url === img)) images.push({ alt: g.name, url: img });
      }
    }

    // Platform availability: {PS4: true, PS5: true}
    const hwPlatforms = (g.platforms || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const platformAvailability: Record<string, boolean> = {};
    for (const p of hwPlatforms) platformAvailability[p] = true;

    // Pricing: per hardware platform × account type
    const primaria = sale?.primaria ?? null;
    const secundaria = sale?.secundaria ?? null;
    const pricing: Record<string, Record<string, number | null>> = {};
    for (const p of hwPlatforms.length ? hwPlatforms : ["PS4"]) {
      pricing[p] = {
        Primaria: primaria,
        Secundaria: secundaria,
      };
    }

    lines.push(
      [
        sku,
        g.name,
        JSON.stringify(images),
        JSON.stringify(platformAvailability),
        JSON.stringify(pricing),
        0,
        true,
        0,
      ]
        .map(escape)
        .join(",")
    );
  }

  res.statusCode = 200;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", 'attachment; filename="apipsn-supabase.csv"');
  res.end(lines.join("\n"));
});

// GET /games/export.json — Supabase-ready JSON export with enriched product details
// Params: only_selected=true|false, platform=psn|xbox|..., enrich=true (include product detail if cached)
route("GET", "/games/export.json", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const onlySelected = url.searchParams.get("only_selected") !== "false";
  const enrich = url.searchParams.get("enrich") !== "false";
  const platformFilter = url.searchParams.get("platform") || "";

  let games = store.listGames().filter((g) => g.active);
  if (onlySelected) games = games.filter((g) => g.selected);
  if (platformFilter) games = games.filter((g) => g.platform === platformFilter);
  const cfg = store.getSettings();

  const rows = games.map((g) => {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const detail = enrich ? store.getProductDetail(g.id) : undefined;
    const dbKey = `${g.platform}:${g.region}:${g.id}`;
    const matches = store.getCompetitorMatches(dbKey) || store.getCompetitorMatches(g.id);

    return {
      // Core identification
      id: g.id,
      db_key: dbKey,
      platform: g.platform,
      region: g.region,
      currency: g.currency || "USD",

      // Basic info
      name: g.name,
      image_url: g.imageUrl,
      store_url: g.storeUrl,
      hardware_platforms: g.platforms,

      // Pricing
      price_original: g.priceOriginalCents != null ? g.priceOriginalCents / 100 : null,
      price_discounted: g.priceDiscountedCents != null ? g.priceDiscountedCents / 100 : null,
      discount_percent: g.discountPercent,
      discount_end_at: g.discountEndAt || detail?.discountEndAt || null,

      // CLP pricing
      cost_clp: sale?.costClp ?? null,
      primaria_clp: sale?.primaria ?? null,
      secundaria_clp: sale?.secundaria ?? null,

      // Enriched detail (from product page scrape)
      description: detail?.description ?? null,
      short_description: detail?.shortDescription ?? null,
      publisher: detail?.publisher ?? null,
      developer: detail?.developer ?? null,
      release_date: detail?.releaseDate ?? null,
      genres: detail?.genres ?? [],
      age_rating: detail?.ageRating ?? null,
      content_descriptors: detail?.contentDescriptors ?? [],
      interactive_elements: detail?.interactiveElements ?? [],
      player_count: detail?.playerCount ?? null,
      online_player_count: detail?.onlinePlayerCount ?? null,
      ps_plus_required: detail?.psPlusRequired ?? false,
      in_game_purchases: detail?.inGamePurchases ?? null,
      game_features: detail?.gameFeatures ?? [],
      ps_version: detail?.psVersion ?? null,
      file_size: detail?.fileSize ?? null,
      voice_languages: detail?.voiceLanguages ?? [],
      subtitle_languages: detail?.subtitleLanguages ?? [],

      // Media
      portrait_url: detail?.media?.portraitUrl ?? g.imageUrl,
      cover_url: detail?.media?.coverUrl ?? null,
      hero_url: detail?.media?.heroUrl ?? null,
      screenshots: detail?.media?.screenshots ?? [],
      carousel_images: detail?.carouselImages ?? [],
      videos: detail?.media?.videos ?? [],

      // Competition
      market_min_clp: matches.length ? Math.min(...matches.map((m) => m.priceClp)) : null,
      market_count: matches.length,

      // Status
      selected: g.selected,
      published: g.published,
      notes: g.notes,
      active: g.active,
      first_seen_at: g.firstSeenAt,
      last_seen_at: g.lastSeenAt,
    };
  });

  sendJson(res, 200, { games: rows, exported_at: new Date().toISOString(), count: rows.length });
});

// GET /games/export-supabase — export selected games formatted for the Supabase products table
route("GET", "/games/export-supabase", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const onlySelected = url.searchParams.get("only_selected") !== "false";
  const platformFilter = url.searchParams.get("platform") || "";

  let games = store.listGames().filter((g) => g.active);
  if (onlySelected) games = games.filter((g) => g.selected);
  if (platformFilter) games = games.filter((g) => g.platform === platformFilter);
  const cfg = store.getSettings();

  const rows = games.map((g) => {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const detail = store.getProductDetail(g.id);

    const slug = g.name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join("-");
    const sku = `PS-${slug}-001`;

    const hwPlatforms = (g.platforms || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const platformAvailability: Record<string, boolean> = {};
    for (const p of hwPlatforms) platformAvailability[p] = true;

    const images: Array<{ alt: string; url: string }> = [];
    const portraitUrl2 = detail?.media?.portraitUrl ?? g.imageUrl;
    if (portraitUrl2) images.push({ alt: g.name, url: portraitUrl2 });
    const coverUrl2 = detail?.media?.coverUrl;
    if (coverUrl2 && coverUrl2 !== portraitUrl2) images.push({ alt: g.name, url: coverUrl2 });
    if (detail?.carouselImages) {
      for (const img of detail.carouselImages) {
        if (!images.some((x) => x.url === img)) images.push({ alt: g.name, url: img });
      }
    }
    if (detail?.media?.screenshots) {
      for (const img of detail.media.screenshots) {
        if (!images.some((x) => x.url === img)) images.push({ alt: g.name, url: img });
      }
    }

    const primaria = sale?.primaria ?? null;
    const secundaria = sale?.secundaria ?? null;
    const pricing: Record<string, Record<string, number | null>> = {};
    for (const p of hwPlatforms.length ? hwPlatforms : ["PS4"]) {
      pricing[p] = { Primaria: primaria, Secundaria: secundaria };
    }

    return {
      sku,
      display_name: g.name,
      images,
      platform_availability: platformAvailability,
      pricing_by_platform_and_account: pricing,
      stock_quantity: 0,
      is_active: true,
      sort_order: 0,
    };
  });

  sendJson(res, 200, { rows, exported_at: new Date().toISOString(), count: rows.length });
});

// POST /games/publish-supabase — upsert selected games directly to Supabase
route("POST", "/games/publish-supabase", async (req, res) => {
  const supabaseCfg = store.getSupabase();
  if (!supabaseCfg?.url || !supabaseCfg?.serviceKey) {
    return sendJson(res, 400, {
      error: "supabase_not_configured",
      message: "Configura Supabase URL y Service Key en Ajustes antes de publicar.",
    });
  }

  const body = (await readBody(req)) as { ids?: string[] };
  let games = store.listGames().filter((g) => g.active && g.selected);
  if (body.ids?.length) {
    const idSet = new Set(body.ids);
    games = games.filter((g) => idSet.has(gameDbKey(g)));
  }

  if (games.length === 0) {
    return sendJson(res, 400, { error: "no_games", message: "No hay juegos seleccionados para publicar." });
  }

  const cfg = store.getSettings();
  const tableName = supabaseCfg.tableName || "playstation_games";

  // Auto-fetch product details for PSN games missing cached detail
  const psnCfg = store.getPsn();
  for (const g of games) {
    if (g.platform === "psn" && !store.getProductDetail(g.id)) {
      try {
        const d = await fetchProductDetail(g.id, g.storeUrl || "", psnCfg.region);
        saveDetailAndUpdateImage(g, d);
      } catch { /* publish will use g.imageUrl as fallback */ }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const rows = games.map((g) => {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const detail = store.getProductDetail(g.id);

    const hwPlatforms = (g.platforms || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const platformAvailability: Record<string, boolean> = {};
    for (const p of hwPlatforms) platformAvailability[p] = true;

    const images: Array<{ alt: string; url: string }> = [];
    const portraitUrl = detail?.media?.portraitUrl ?? g.imageUrl;
    if (portraitUrl) images.push({ alt: g.name, url: portraitUrl });
    if (detail?.media?.coverUrl && detail.media.coverUrl !== portraitUrl) {
      images.push({ alt: g.name, url: detail.media.coverUrl });
    }
    if (detail?.carouselImages) {
      for (const img of detail.carouselImages) {
        if (!images.some((x) => x.url === img)) images.push({ alt: g.name, url: img });
      }
    }

    const primaria = sale?.primaria ?? null;
    const secundaria = sale?.secundaria ?? null;
    const pricing: Record<string, Record<string, number | null>> = {};
    for (const p of hwPlatforms.length ? hwPlatforms : ["PS4"]) {
      pricing[p] = { Primaria: primaria, Secundaria: secundaria };
    }

    return {
      sku: generateSku(g.name),
      display_name: g.name,
      images,
      platform_availability: platformAvailability,
      pricing_by_platform_and_account: pricing,
      stock_quantity: 0,
      is_active: true,
      sort_order: 0,
    };
  });

  try {
    const endpoint = `${supabaseCfg.url}/rest/v1/${tableName}?on_conflict=sku`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: supabaseCfg.serviceKey,
        Authorization: `Bearer ${supabaseCfg.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) {
      const text = await response.text();
      return sendJson(res, 502, {
        error: "supabase_error",
        message: `Supabase respondió ${response.status}: ${text.slice(0, 300)}`,
      });
    }

    // Mark games as published locally
    for (const g of games) {
      store.patchGame(gameDbKey(g), { published: true });
    }

    sendJson(res, 200, { published: rows.length, skus: rows.map((r) => r.sku) });
  } catch (err) {
    sendJson(res, 502, {
      error: "supabase_network_error",
      message: `Error de conexión: ${(err as Error).message}`,
    });
  }
});

// POST /games/enrich — bulk-fetch product details for selected games that don't have them yet
// Body: { platform?: string, limit?: number }
route("POST", "/games/enrich", async (req, res) => {
  const body = (await readBody(req)) as { platform?: string; limit?: number };
  const limit = Math.min(body.limit ?? 20, 50);
  const games = store.listGames().filter((g) => {
    if (!g.active || !g.selected) return false;
    if (body.platform && g.platform !== body.platform) return false;
    if (store.getProductDetail(g.id)) return false;
    return g.platform === "psn";
  }).slice(0, limit);

  const results: Array<{ id: string; name: string; ok: boolean; error?: string }> = [];
  for (const g of games) {
    try {
      const cfg = store.getPsn();
      const detail = await fetchProductDetail(g.id, g.storeUrl || "", cfg.region);
      saveDetailAndUpdateImage(g, detail);
      results.push({ id: g.id, name: g.name, ok: true });
    } catch (e) {
      results.push({ id: g.id, name: g.name, ok: false, error: (e as Error).message });
    }
    // Rate-limit to avoid hammering PSN
    await new Promise((res) => setTimeout(res, 500));
  }

  sendJson(res, 200, { enriched: results.filter((r) => r.ok).length, total: results.length, results });
});

// GET /settings
route("GET", "/settings", async (_req, res) => {
  sendJson(res, 200, {
    pricing: store.getSettings(),
    psn: store.getPsn(),
    sources: store.getSources(),
    supabase: store.getSupabase(),
    hitPublishers: store.getHitPublishers(),
  });
});

// PUT /settings
route("PUT", "/settings", async (req, res) => {
  const body = (await readBody(req)) as {
    pricing?: Partial<ReturnType<typeof store.getSettings>>;
    psn?: Partial<ReturnType<typeof store.getPsn>>;
    sources?: ProviderSource[];
    supabase?: SupabaseConfig | null;
    hitPublishers?: string[];
  };
  const pricing = body.pricing ? store.updateSettings(body.pricing) : store.getSettings();
  const psn = body.psn ? store.updatePsn(body.psn) : store.getPsn();
  if (body.sources) store.setSources(body.sources);
  if (body.supabase !== undefined) store.setSupabase(body.supabase);
  if (body.hitPublishers) store.setHitPublishers(body.hitPublishers);
  sendJson(res, 200, {
    pricing,
    psn,
    sources: store.getSources(),
    supabase: store.getSupabase(),
    hitPublishers: store.getHitPublishers(),
  });
});

// GET /platforms — static metadata about available platforms + regions
route("GET", "/platforms", async (_req, res) => {
  sendJson(res, 200, { labels: PLATFORM_LABELS, regions: PLATFORM_REGIONS });
});

// POST /mock/clear — remove all games
route("POST", "/mock/clear", async (_req, res) => {
  const games = store.listGames();
  for (const g of games) {
    store.upsertGame({ ...g, active: false });
  }
  // Also wipe entries fully by re-writing the file:
  for (const g of games) store.patchGame(g.id, { active: false });
  sendJson(res, 200, { cleared: games.length });
});

async function runRefresh(): Promise<void> {
  const sources = store.getSources().filter((s) => s.enabled);
  const nowIso = new Date().toISOString();
  for (const source of sources) {
    try {
      const provider = getProvider(source.platform);
      const seenKeys = new Set<string>();
      const effSource = { ...source };
      if (source.platform === "psn" && !source.categoryId) {
        effSource.categoryId = store.getPsn().dealsCategoryId;
      }
      for await (const deal of provider.fetchDeals(effSource)) {
        const dbKey = `${source.platform}:${source.region}:${deal.id}`;
        seenKeys.add(dbKey);
        const existing = store.getGameByComposite(source.platform, source.region, deal.id);
        if (!existing) {
          store.upsertGame({
            id: deal.id, platform: source.platform, region: source.region,
            name: deal.name, imageUrl: deal.imageUrl, storeUrl: deal.storeUrl,
            platforms: deal.hardwarePlatforms, currency: deal.currency,
            priceOriginalCents: deal.priceOriginalCents, priceDiscountedCents: deal.priceDiscountedCents,
            discountPercent: deal.discountPercent, discountEndAt: deal.discountEndAt,
            selected: false, published: false, notes: "", youtubeUrl: "", active: true,
            firstSeenAt: nowIso, lastSeenAt: nowIso, updatedAt: nowIso,
          });
        } else {
          store.upsertGame({
            ...existing, name: deal.name || existing.name, imageUrl: deal.imageUrl || existing.imageUrl,
            storeUrl: deal.storeUrl || existing.storeUrl, platforms: deal.hardwarePlatforms,
            currency: deal.currency, priceOriginalCents: deal.priceOriginalCents,
            priceDiscountedCents: deal.priceDiscountedCents, discountPercent: deal.discountPercent,
            discountEndAt: deal.discountEndAt, active: true, lastSeenAt: nowIso, updatedAt: nowIso,
          });
        }
      }
      store.markInactiveIfMissing(seenKeys, source.platform, source.region);
    } catch (e) {
      console.error(`[scheduler][${source.platform}/${source.region}] ${(e as Error).message}`);
    }
  }
  recomputeMatches();
}

function recomputeMatches(): void {
  const games = store.listGames().filter((g) => g.active);
  const products = store.getAllCompetitorProducts();
  const matches = matchGames(games, products);
  store.setCompetitorMatches(matches);
}

// GET /competitors — list stores + last refresh + match stats
route("GET", "/competitors", async (_req, res) => {
  const competitors = store.getCompetitors();
  const refreshedAt = store.getCompetitorRefreshedAt();
  sendJson(res, 200, {
    competitors: competitors.map((c) => ({
      ...c,
      refreshedAt: refreshedAt[c.key] ?? null,
      productCount: store
        .getAllCompetitorProducts(false)
        .filter((p) => p.storeKey === c.key).length,
    })),
  });
});

// PUT /competitors — replace the full list (used from Ajustes)
route("PUT", "/competitors", async (req, res) => {
  const body = (await readBody(req)) as { competitors?: CompetitorConfig[] };
  if (!Array.isArray(body.competitors)) {
    return sendJson(res, 400, { error: "bad_request", message: "competitors[] required" });
  }
  const clean: CompetitorConfig[] = body.competitors
    .filter((c) => c && typeof c.key === "string" && typeof c.domain === "string")
    .map((c) => ({
      key: c.key.trim(),
      label: (c.label || c.key).trim(),
      domain: c.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim(),
      type: (["shopify", "woocommerce", "html", "jumpseller", "auto"].includes(c.type) ? c.type : "auto"),
      enabled: c.enabled !== false,
    }));
  store.setCompetitors(clean);
  recomputeMatches();
  sendJson(res, 200, { competitors: store.getCompetitors() });
});

// POST /competitors/refresh — scrape all enabled stores and recompute matches
route("POST", "/competitors/refresh", async (_req, res) => {
  const competitors = store.getCompetitors().filter((c) => c.enabled);
  const now = new Date().toISOString();
  const results: Array<{ key: string; label: string; count: number; error?: string }> = [];

  await Promise.all(
    competitors.map(async (c) => {
      try {
        const products = await fetchCompetitor(c);
        store.setCompetitorProducts(c.key, products, now);
        results.push({ key: c.key, label: c.label, count: products.length });
      } catch (e) {
        const msg =
          e instanceof CompetitorFetchError
            ? e.message
            : (e as Error).message || "error";
        results.push({ key: c.key, label: c.label, count: 0, error: msg });
      }
    })
  );

  recomputeMatches();
  sendJson(res, 200, { refreshedAt: now, results });
});

// GET /ps-plus — PS Plus membership prices vs competitors
route("GET", "/ps-plus", async (_req, res) => {
  const cfg = store.getSettings();
  const products = store.getAllCompetitorProducts();
  const scraped = store.getPsPlusPrices() as ScrapedPlusPrices | null;
  const plans = matchPlansWithCompetitors(products, cfg, scraped);
  sendJson(res, 200, { plans, scrapedAt: scraped?.scrapedAt ?? null });
});

// POST /ps-plus/refresh — scrape current PS Plus prices from playstation.com
route("POST", "/ps-plus/refresh", async (_req, res) => {
  try {
    const result = await scrapePsPlusPrices();
    store.setPsPlusPrices(result);
    sendJson(res, 200, result);
  } catch (e) {
    sendJson(res, 500, { error: "scrape_failed", message: (e as Error).message });
  }
});

// POST /games/lookup — bulk fuzzy search: receives a list of {name, priceUsd?}
// items (parsed from pasted competitor text) and matches each against the game DB.
route("POST", "/games/lookup", async (req, res) => {
  const body = await readBody(req);
  const items: Array<{ name: string; priceMin: number | null; priceMax: number | null }> =
    body?.items;
  if (!Array.isArray(items) || !items.length) {
    sendJson(res, 400, { error: "bad_request", message: "items[] required" });
    return;
  }

  const cfg = store.getSettings();
  const allGames = store.listGames().filter((g) => g.active);
  const gameIndex = allGames.map((g) => ({
    game: g,
    tokens: tokenize(g.name),
  }));

  const THRESHOLD = 0.40;
  const results = items.map((item) => {
    const queryTokens = tokenize(item.name);
    let bestGame: Game | null = null;
    let bestScore = 0;

    for (const { game, tokens } of gameIndex) {
      if (!tokens.length) continue;
      const score = similarity(queryTokens, tokens);
      if (score > bestScore) {
        bestScore = score;
        bestGame = game;
      }
    }

    const matched = bestScore >= THRESHOLD && bestGame;
    const out = matched ? toGameOut(bestGame!, cfg) : null;

    return {
      query: item.name,
      priceMin: item.priceMin,
      priceMax: item.priceMax,
      matchScore: Math.round(bestScore * 100) / 100,
      found: !!matched,
      game: out,
    };
  });

  sendJson(res, 200, { results });
});

// GET /debug/product-types — one-shot reconnaissance used to design the
// DLC/add-on filter. Runs a full PSN scrape and reports every classification
// + productType combo it sees, plus all observed top-level keys. The response
// is small (a couple of KB), the scrape itself is the slow part.
route("GET", "/debug/product-types", async (_req, res) => {
  try {
    const cfg = store.getPsn();
    const report = await inspectProductTypes(cfg);
    sendJson(res, 200, report);
  } catch (e) {
    if (e instanceof PsnApiError) {
      return sendJson(res, 502, {
        error: "psn_api_error",
        message: (e as Error).message,
      });
    }
    sendJson(res, 500, { error: "internal", message: (e as Error).message });
  }
});

// GET /debug/scrape-images — test image extraction from PSN HTML.
// Scrapes one page and reports what images were extracted from the grid
// (srcset/src attributes), plus available media roles from the JSON.
route("GET", "/debug/scrape-images", async (_req, res) => {
  try {
    const cfg = store.getPsn();
    const result = await debugScrapePage(cfg);
    sendJson(res, 200, result);
  } catch (e) {
    if (e instanceof PsnApiError) {
      return sendJson(res, 502, {
        error: "psn_api_error",
        message: (e as Error).message,
      });
    }
    sendJson(res, 500, { error: "internal", message: (e as Error).message });
  }
});

// GET /games/:id/detail — cached product detail (imagery, description…).
// Returns 204 No Content if we haven't fetched it yet; the client should
// then POST /games/:id/detail/refresh to trigger the scrape.
route("GET", "/games/:id/detail", async (_req, res, params) => {
  const detail = store.getProductDetail(params.id);
  if (!detail) {
    res.statusCode = 204;
    res.end();
    return;
  }
  sendJson(res, 200, detail);
});

// POST /games/:id/detail/refresh — scrape the product page and cache it.
route("POST", "/games/:id/detail/refresh", async (_req, res, params) => {
  const game = store.getGame(params.id);
  if (!game) return sendJson(res, 404, { error: "not_found" });
  try {
    const cfg = store.getPsn();
    const detail = await fetchProductDetail(
      game.id,
      game.storeUrl || "",
      cfg.region
    );
    saveDetailAndUpdateImage(game, detail);
    sendJson(res, 200, detail);
  } catch (e) {
    if (e instanceof PsnApiError) {
      return sendJson(res, 502, {
        error: "psn_api_error",
        message: (e as Error).message,
      });
    }
    sendJson(res, 500, { error: "internal", message: (e as Error).message });
  }
});

// GET /watchlist — tracked games + current status snapshot.
route("GET", "/watchlist", async (_req, res) => {
  sendJson(res, 200, { items: store.listWatchlist() });
});

// POST /watchlist — add a game by URL or id. Body: { input: string, notes? }
route("POST", "/watchlist", async (req, res) => {
  const body = (await readBody(req)) as { input?: string; notes?: string };
  const id = extractPsnId(body.input ?? "");
  if (!id) {
    return sendJson(res, 400, {
      error: "bad_input",
      message: "Pegá la URL del producto en PSN o un ID tipo UPXXXX-CUSAXXXXX_00-…",
    });
  }
  const existing = store.getWatched(id);
  if (existing) return sendJson(res, 200, existing);

  const game = store.getGame(id);
  const now = new Date().toISOString();
  const entry: WatchedGame = {
    id,
    name: game?.name || id,
    addedAt: now,
    lastStatus: game?.active && game.discountPercent > 0 ? "on_sale" : game ? "off_sale" : "unseen",
    lastSeenOnSaleAt:
      game?.active && game.discountPercent > 0 ? now : null,
    lastPriceCents: game?.priceDiscountedCents ?? null,
    lastDiscountPercent: game?.discountPercent ?? 0,
    notes: (body.notes ?? "").trim(),
  };
  sendJson(res, 201, store.upsertWatched(entry));
});

// PATCH /watchlist/:id — edit notes or name.
route("PATCH", "/watchlist/:id", async (req, res, params) => {
  const body = (await readBody(req)) as Partial<Pick<WatchedGame, "notes" | "name">>;
  const patch: Partial<WatchedGame> = {};
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  const updated = store.patchWatched(params.id, patch);
  if (!updated) return sendJson(res, 404, { error: "not_found" });
  sendJson(res, 200, updated);
});

// DELETE /watchlist/:id
route("DELETE", "/watchlist/:id", async (_req, res, params) => {
  const ok = store.removeWatched(params.id);
  if (!ok) return sendJson(res, 404, { error: "not_found" });
  sendJson(res, 200, { removed: true });
});

// GET /games/:id/matches — all competitor matches for a game (for popovers)
route("GET", "/games/:id/matches", async (_req, res, params) => {
  const matches: CompetitorMatch[] = store.getCompetitorMatches(params.id);
  sendJson(res, 200, { matches });
});

// POST /exchange/refresh — fetch latest USD→CLP from mindicador.cl and save
route("POST", "/exchange/refresh", async (_req, res) => {
  try {
    const rates = await fetchExchangeRates();
    const patch: Record<string, number> = {};
    if (rates.usdToClp != null) patch.usdToClp = Math.round(rates.usdToClp);
    if (Object.keys(patch).length > 0) {
      store.updateSettings(patch);
    }
    sendJson(res, 200, {
      updated: patch,
      fetchedAt: rates.fetchedAt,
      errors: rates.errors,
    });
  } catch (e) {
    sendJson(res, 500, { error: "exchange_error", message: (e as Error).message });
  }
});

// GET /debug/status — diagnostic snapshot of system health
route("GET", "/debug/status", async (_req, res) => {
  const allGames = store.listGames();
  const activeGames = allGames.filter((g) => g.active);

  const gamesByPlatform: Record<string, number> = {};
  for (const g of activeGames) {
    gamesByPlatform[g.platform] = (gamesByPlatform[g.platform] || 0) + 1;
  }

  const sources = store.getSources().map((s) => ({
    platform: s.platform,
    region: s.region,
    enabled: s.enabled,
  }));

  const competitors = store.getCompetitors();
  const allProducts = store.getAllCompetitorProducts(false);
  const refreshedAt = store.getCompetitorRefreshedAt();

  const competitorStatus = competitors.map((c) => ({
    key: c.key,
    label: c.label,
    productCount: allProducts.filter((p) => p.storeKey === c.key).length,
    refreshedAt: refreshedAt[c.key] ?? null,
  }));

  sendJson(res, 200, {
    totalGames: allGames.length,
    activeGames: activeGames.length,
    gamesByPlatform,
    sources,
    competitors: competitorStatus,
    autoRefreshIntervalHours: store.getAutoRefreshInterval(),
    lastAutoRefreshAt: getLastAutoRefreshAt(),
    dbSizeKb: null,
  });
});

// PUT /scheduler — enable/disable periodic auto-refresh
// Body: { intervalHours: number }  (0 = disabled)
route("PUT", "/scheduler", async (req, res) => {
  const body = (await readBody(req)) as { intervalHours?: number };
  const hours = Number(body.intervalHours ?? 0);
  if (!Number.isFinite(hours) || hours < 0) {
    return sendJson(res, 400, { error: "bad_request", message: "intervalHours must be >= 0" });
  }
  store.setAutoRefreshInterval(hours);
  reschedule(runRefresh);
  sendJson(res, 200, { intervalHours: store.getAutoRefreshInterval() });
});

// Start scheduler if configured
startScheduler(runRefresh);

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = new URL(req.url || "/", "http://x");
  const pathname = url.pathname; // Vite strips /api prefix via use()

  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.pattern.exec(pathname);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return r.handler(req, res, params);
  }
  sendJson(res, 404, { error: "not_found", path: pathname });
}
