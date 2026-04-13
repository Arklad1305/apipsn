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
 *   GET    /mock/seed                  populate with demo games (Bolt preview)
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { store, type Game } from "./store";
import { computeSalePrices } from "./pricing";
import {
  iterCategoryProducts,
  normalizeProduct,
  PersistedQueryNotFoundError,
  PsnApiError,
} from "./psn";
import { demoGames } from "./demo-data";

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

function toGameOut(g: Game, cfgPricing = store.getSettings()) {
  const sale = computeSalePrices(g.priceDiscountedCents, cfgPricing);
  return {
    id: g.id,
    name: g.name,
    imageUrl: g.imageUrl,
    storeUrl: g.storeUrl,
    platforms: g.platforms,
    priceOriginalUsd:
      g.priceOriginalCents != null ? g.priceOriginalCents / 100 : null,
    priceDiscountedUsd:
      g.priceDiscountedCents != null ? g.priceDiscountedCents / 100 : null,
    discountPercent: g.discountPercent,
    discountEndAt: g.discountEndAt,
    selected: g.selected,
    published: g.published,
    notes: g.notes,
    active: g.active,
    costClp: sale?.costClp ?? null,
    primaria1: sale?.primaria1 ?? null,
    primaria2: sale?.primaria2 ?? null,
    secundaria: sale?.secundaria ?? null,
  };
}

// GET /games
route("GET", "/games", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const minDiscount = parseInt(url.searchParams.get("min_discount") || "0", 10) || 0;
  const onlySelected = url.searchParams.get("only_selected") === "true";
  const hidePublished = url.searchParams.get("hide_published") === "true";
  const includeInactive = url.searchParams.get("include_inactive") === "true";
  const sort = url.searchParams.get("sort") || "discount";

  let games = store.listGames();
  if (!includeInactive) games = games.filter((g) => g.active);
  if (minDiscount > 0) games = games.filter((g) => g.discountPercent >= minDiscount);
  if (onlySelected) games = games.filter((g) => g.selected);
  if (hidePublished) games = games.filter((g) => !g.published);
  if (search) games = games.filter((g) => g.name.toLowerCase().includes(search));

  if (sort === "price") games.sort((a, b) => (a.priceDiscountedCents ?? 0) - (b.priceDiscountedCents ?? 0));
  else if (sort === "name") games.sort((a, b) => a.name.localeCompare(b.name));
  else games.sort((a, b) => b.discountPercent - a.discountPercent);

  const cfg = store.getSettings();
  sendJson(res, 200, games.map((g) => toGameOut(g, cfg)));
});

// PATCH /games/:id
route("PATCH", "/games/:id", async (req, res, params) => {
  const body = (await readBody(req)) as Partial<Pick<Game, "selected" | "published" | "notes">>;
  const patch: Partial<Game> = {};
  if (typeof body.selected === "boolean") patch.selected = body.selected;
  if (typeof body.published === "boolean") patch.published = body.published;
  if (typeof body.notes === "string") patch.notes = body.notes;
  const updated = store.patchGame(params.id, patch);
  if (!updated) return sendJson(res, 404, { error: "not_found" });
  sendJson(res, 200, toGameOut(updated));
});

// POST /refresh
route("POST", "/refresh", async (_req, res) => {
  try {
    const cfg = store.getPsn();
    const seen = new Set<string>();
    let newCount = 0;
    let updated = 0;
    const nowIso = new Date().toISOString();

    for await (const raw of iterCategoryProducts(cfg)) {
      const normalized = normalizeProduct(raw, nowIso);
      if (!normalized) continue;
      seen.add(normalized.id);
      const existing = store.getGame(normalized.id);
      if (!existing) {
        store.upsertGame(normalized);
        newCount++;
      } else {
        store.upsertGame({
          ...existing,
          name: normalized.name || existing.name,
          imageUrl: normalized.imageUrl || existing.imageUrl,
          storeUrl: normalized.storeUrl || existing.storeUrl,
          platforms: normalized.platforms,
          priceOriginalCents: normalized.priceOriginalCents,
          priceDiscountedCents: normalized.priceDiscountedCents,
          discountPercent: normalized.discountPercent,
          discountEndAt: normalized.discountEndAt,
          active: true,
          lastSeenAt: nowIso,
          updatedAt: nowIso,
        });
        updated++;
      }
    }
    const disappeared = store.markInactiveIfMissing(seen);
    sendJson(res, 200, {
      new: newCount,
      updated,
      disappeared,
      totalSeen: seen.size,
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
    if (e instanceof PsnApiError) {
      return sendJson(res, 502, {
        error: "psn_api_error",
        message: (e as Error).message,
        hint:
          "Si esto corre en Bolt/StackBlitz la IP de la sandbox puede estar " +
          "bloqueada por PSN. Usa 'Seed demo' para ver el panel con datos de ejemplo.",
      });
    }
    sendJson(res, 500, { error: "internal", message: (e as Error).message });
  }
});

// GET /games/export.csv
route("GET", "/games/export.csv", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const onlySelected = url.searchParams.get("only_selected") !== "false";

  let games = store.listGames().filter((g) => g.active);
  if (onlySelected) games = games.filter((g) => g.selected);
  const cfg = store.getSettings();

  const header = [
    "id",
    "name",
    "platforms",
    "store_url",
    "price_original_usd",
    "price_discounted_usd",
    "discount_percent",
    "discount_end_at",
    "cost_clp",
    "primaria_1_clp",
    "primaria_2_clp",
    "secundaria_clp",
    "notes",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [header.join(",")];
  for (const g of games) {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg);
    lines.push(
      [
        g.id,
        g.name,
        g.platforms,
        g.storeUrl ?? "",
        g.priceOriginalCents != null ? (g.priceOriginalCents / 100).toFixed(2) : "",
        g.priceDiscountedCents != null ? (g.priceDiscountedCents / 100).toFixed(2) : "",
        g.discountPercent,
        g.discountEndAt ?? "",
        sale?.costClp ?? "",
        sale?.primaria1 ?? "",
        sale?.primaria2 ?? "",
        sale?.secundaria ?? "",
        g.notes,
      ]
        .map(escape)
        .join(",")
    );
  }

  res.statusCode = 200;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", 'attachment; filename="apipsn-games.csv"');
  res.end(lines.join("\n"));
});

// GET /settings
route("GET", "/settings", async (_req, res) => {
  sendJson(res, 200, {
    pricing: store.getSettings(),
    psn: store.getPsn(),
  });
});

// PUT /settings
route("PUT", "/settings", async (req, res) => {
  const body = (await readBody(req)) as {
    pricing?: Partial<ReturnType<typeof store.getSettings>>;
    psn?: Partial<ReturnType<typeof store.getPsn>>;
  };
  const pricing = body.pricing ? store.updateSettings(body.pricing) : store.getSettings();
  const psn = body.psn ? store.updatePsn(body.psn) : store.getPsn();
  sendJson(res, 200, { pricing, psn });
});

// POST /mock/seed — populate demo data so the panel is usable in Bolt
route("POST", "/mock/seed", async (_req, res) => {
  const now = new Date().toISOString();
  let n = 0;
  for (const g of demoGames(now)) {
    store.upsertGame(g);
    n++;
  }
  sendJson(res, 200, { seeded: n });
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
