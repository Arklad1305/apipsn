// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";

// server/store.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///home/project/server/store.ts";
var DEFAULT_SETTINGS = {
  usdToClp: 970,
  brlToClp: 170,
  tryToClp: 28,
  jpyToClp: 6.5,
  purchaseFeePct: 0.05,
  primaria1Mult: 1.8,
  primaria2Mult: 1.6,
  secundariaMult: 1.1,
  roundTo: 500
};
var DEFAULT_SOURCES = [
  { platform: "psn", region: "us", enabled: true, categoryId: "" },
  { platform: "psn", region: "br", enabled: true, categoryId: "3f772501-f6f8-49b7-abac-874a88ca4897" },
  { platform: "xbox", region: "us", enabled: false },
  { platform: "xbox", region: "br", enabled: false },
  { platform: "xbox", region: "tr", enabled: false },
  { platform: "nintendo", region: "us", enabled: true },
  { platform: "nintendo", region: "jp", enabled: false },
  { platform: "steam", region: "us", enabled: true },
  { platform: "steam", region: "br", enabled: true },
  { platform: "steam", region: "tr", enabled: true }
];
var DEFAULT_COMPETITORS = [
  { key: "cjm", label: "CJM Digitales", domain: "cjmdigitales.cl", type: "shopify", enabled: true },
  { key: "juegosdigitaleschile", label: "Juegos Digitales Chile", domain: "juegosdigitaleschile.com", type: "html", enabled: true },
  { key: "mj", label: "MJ Digitales", domain: "mjdigitales.cl", type: "shopify", enabled: true },
  { key: "infinity", label: "Infinity Games Chile", domain: "infinitygameschile.cl", type: "html", enabled: true }
];
var DEFAULT_PSN = {
  region: "en-US",
  // Placeholder IDs — the user configures the real ones from DevTools.
  // Panel > Ajustes expone ambos.
  dealsCategoryId: "3f772501-f6f8-49b7-abac-874a88ca4897",
  // Unused by the HTML scraper. Kept for reference in case we ever add a
  // GraphQL fallback. Current value captured from DevTools on 2026-04-13.
  categoryGridHash: "257713466fc3264850aa473409a29088e3a4115e6e69e9fb3e061c8dd5b9f5c6",
  includeAddOns: false
};
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var DATA_FILE = path.resolve(__dirname, "../data/apipsn.json");
function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function migrateGames(games) {
  const migrated = {};
  for (const [key, g] of Object.entries(games)) {
    if (typeof g.youtubeUrl !== "string") g.youtubeUrl = "";
    if (!g.platform) g.platform = "psn";
    if (!g.region) g.region = "us";
    if (!g.currency) g.currency = "USD";
    const compositeKey = `${g.platform}:${g.region}:${g.id}`;
    if (key === g.id && key !== compositeKey) {
      migrated[compositeKey] = g;
    } else {
      migrated[key] = g;
    }
  }
  return migrated;
}
function migrateSources(sources, psn) {
  const existing = sources && sources.length > 0 ? [...sources] : [];
  const existingKeys = new Set(existing.map((s) => `${s.platform}:${s.region}`));
  for (const def of DEFAULT_SOURCES) {
    const key = `${def.platform}:${def.region}`;
    if (!existingKeys.has(key)) {
      existing.push({ ...def });
    }
  }
  if ((!sources || sources.length === 0) && psn.dealsCategoryId) {
    const psnUs = existing.find((s) => s.platform === "psn" && s.region === "us");
    if (psnUs && !psnUs.categoryId) {
      psnUs.categoryId = psn.dealsCategoryId;
    }
  }
  return existing;
}
function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const psn = { ...DEFAULT_PSN, ...parsed.psn ?? {} };
    const games = migrateGames(parsed.games ?? {});
    return {
      games,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings ?? {} },
      psn,
      sources: migrateSources(parsed.sources, psn),
      competitors: parsed.competitors ?? [...DEFAULT_COMPETITORS],
      competitorProducts: parsed.competitorProducts ?? {},
      competitorMatches: parsed.competitorMatches ?? {},
      competitorRefreshedAt: parsed.competitorRefreshedAt ?? {},
      productDetails: parsed.productDetails ?? {},
      watchlist: parsed.watchlist ?? {}
    };
  } catch {
    return {
      games: {},
      settings: { ...DEFAULT_SETTINGS },
      psn: { ...DEFAULT_PSN },
      sources: [...DEFAULT_SOURCES],
      competitors: [...DEFAULT_COMPETITORS],
      competitorProducts: {},
      competitorMatches: {},
      competitorRefreshedAt: {},
      productDetails: {},
      watchlist: {}
    };
  }
}
var db = load();
var saveTimer = null;
try {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
} catch {
}
function persist() {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 150);
}
function gameKey(platform, region, id) {
  return `${platform}:${region}:${id}`;
}
var store = {
  listGames() {
    return Object.values(db.games);
  },
  getGame(id) {
    return db.games[id];
  },
  getGameByComposite(platform, region, id) {
    return db.games[gameKey(platform, region, id)];
  },
  upsertGame(game) {
    const key = gameKey(game.platform, game.region, game.id);
    db.games[key] = game;
    scheduleSave();
  },
  patchGame(id, patch) {
    const existing = db.games[id];
    if (!existing) return void 0;
    const updated = { ...existing, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    db.games[id] = updated;
    scheduleSave();
    return updated;
  },
  markInactiveIfMissing(seenKeys, platform, region) {
    let n = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const [key, g] of Object.entries(db.games)) {
      if (!g.active) continue;
      if (platform && g.platform !== platform) continue;
      if (region && g.region !== region) continue;
      if (!seenKeys.has(key)) {
        g.active = false;
        g.updatedAt = now;
        n++;
      }
    }
    if (n > 0) scheduleSave();
    return n;
  },
  getSettings() {
    return { ...db.settings };
  },
  updateSettings(patch) {
    db.settings = { ...db.settings, ...patch };
    scheduleSave();
    return { ...db.settings };
  },
  getPsn() {
    return { ...db.psn };
  },
  updatePsn(patch) {
    db.psn = { ...db.psn, ...patch };
    scheduleSave();
    return { ...db.psn };
  },
  getCompetitors() {
    return db.competitors.map((c) => ({ ...c }));
  },
  setCompetitors(list) {
    db.competitors = list.map((c) => ({ ...c }));
    scheduleSave();
    return db.competitors.map((c) => ({ ...c }));
  },
  setCompetitorProducts(key, products, refreshedAt) {
    db.competitorProducts[key] = products;
    db.competitorRefreshedAt[key] = refreshedAt;
    scheduleSave();
  },
  getAllCompetitorProducts(enabledOnly = true) {
    const enabled = new Set(
      db.competitors.filter((c) => !enabledOnly || c.enabled).map((c) => c.key)
    );
    const out = [];
    for (const [key, list] of Object.entries(db.competitorProducts)) {
      if (!enabled.has(key)) continue;
      for (const p of list) out.push(p);
    }
    return out;
  },
  getCompetitorRefreshedAt() {
    return { ...db.competitorRefreshedAt };
  },
  setCompetitorMatches(matches) {
    db.competitorMatches = matches;
    scheduleSave();
  },
  getCompetitorMatches(gameId) {
    return db.competitorMatches[gameId] ?? [];
  },
  getProductDetail(id) {
    return db.productDetails[id];
  },
  setProductDetail(id, detail) {
    db.productDetails[id] = detail;
    scheduleSave();
  },
  listWatchlist() {
    return Object.values(db.watchlist);
  },
  getWatched(id) {
    return db.watchlist[id];
  },
  upsertWatched(entry) {
    db.watchlist[entry.id] = entry;
    scheduleSave();
    return { ...entry };
  },
  patchWatched(id, patch) {
    const existing = db.watchlist[id];
    if (!existing) return void 0;
    const updated = { ...existing, ...patch };
    db.watchlist[id] = updated;
    scheduleSave();
    return updated;
  },
  removeWatched(id) {
    if (!db.watchlist[id]) return false;
    delete db.watchlist[id];
    scheduleSave();
    return true;
  },
  getSources() {
    return db.sources.map((s) => ({ ...s }));
  },
  setSources(list) {
    db.sources = list.map((s) => ({ ...s }));
    scheduleSave();
    return db.sources.map((s) => ({ ...s }));
  },
  flush() {
    if (saveTimer) clearTimeout(saveTimer);
    persist();
  }
};

// server/pricing.ts
function roundTo(value, step) {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}
function exchangeRate(currency, cfg) {
  switch (currency) {
    case "BRL":
      return cfg.brlToClp;
    case "TRY":
      return cfg.tryToClp;
    case "JPY":
      return cfg.jpyToClp;
    case "USD":
    default:
      return cfg.usdToClp;
  }
}
function computeSalePrices(priceCents, cfg, currency = "USD") {
  if (priceCents == null) return null;
  const price = priceCents / 100;
  const rate = exchangeRate(currency, cfg);
  const cost = price * rate * (1 + cfg.purchaseFeePct);
  return {
    costClp: roundTo(cost, cfg.roundTo),
    primaria1: roundTo(cost * cfg.primaria1Mult, cfg.roundTo),
    primaria2: roundTo(cost * cfg.primaria2Mult, cfg.roundTo),
    secundaria: roundTo(cost * cfg.secundariaMult, cfg.roundTo)
  };
}

// server/psn.ts
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var PersistedQueryNotFoundError = class extends Error {
  constructor() {
    super("PSN persisted query hash is stale.");
  }
};
var PsnApiError = class extends Error {
};
var GAME_ENUM = /* @__PURE__ */ new Set([
  "FULL_GAME",
  "GAME_BUNDLE",
  "PREMIUM_EDITION",
  "BUNDLE"
]);
var GAME_LABELS = /* @__PURE__ */ new Set([
  "Full Game",
  "Game Bundle",
  "Premium Edition",
  "Bundle"
]);
function isFullGameProduct(raw) {
  const e = String(raw.storeDisplayClassification || "").toUpperCase();
  if (e && GAME_ENUM.has(e)) return true;
  const l = String(raw.localizedStoreDisplayClassification || "").trim();
  return GAME_LABELS.has(l);
}
function priceToCents(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || /^free$/i.test(s) || /^gratis$/i.test(s)) return null;
  const cleaned = s.replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
  const parts = cleaned.split(".");
  const norm = parts.length > 2 ? parts.slice(0, -1).join("") + "." + parts.at(-1) : cleaned;
  const n = Number(norm);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
async function inspectProductTypes(cfg) {
  const byCombo = /* @__PURE__ */ new Map();
  const observedKeys = /* @__PURE__ */ new Map();
  let total = 0;
  for await (const raw of iterCategoryProducts(cfg)) {
    total++;
    for (const [k, v] of Object.entries(raw)) {
      if (observedKeys.has(k)) continue;
      let example;
      if (v == null) example = "null";
      else if (typeof v === "object") example = JSON.stringify(v).slice(0, 120);
      else example = String(v).slice(0, 120);
      observedKeys.set(k, example);
    }
    const cls = raw.localizedStoreDisplayClassification || raw.storeDisplayClassification || "";
    const pt = raw.productType || raw.type || "";
    const key = `${cls}${pt}`;
    const existing = byCombo.get(key);
    if (existing) {
      existing.count++;
      if (existing.samples.length < 3 && raw.name) existing.samples.push(raw.name);
    } else {
      byCombo.set(key, {
        classification: cls,
        productType: pt,
        count: 1,
        samples: raw.name ? [raw.name] : []
      });
    }
  }
  const classifications = [...byCombo.values()].sort((a, b) => b.count - a.count);
  const keys = [...observedKeys.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, example]) => ({ key, example }));
  return { totalSeen: total, classifications, observedKeys: keys };
}
function normalizeProduct(raw, now) {
  const id = raw.id || raw.productId || raw.conceptId;
  if (!id) return null;
  const name = raw.name || raw.title || "";
  if (!name) return null;
  let imageUrl = null;
  const media = raw.media || [];
  for (const m2 of media) {
    const role = String(m2?.role || "").toUpperCase();
    if (["MASTER", "PREVIEW_GAME_ART", "BOXART", "GAMEHUB_COVER_ART"].includes(role)) {
      imageUrl = m2.url ?? null;
      if (imageUrl) break;
    }
  }
  if (!imageUrl && media[0]?.url) imageUrl = media[0].url;
  const platforms = Array.isArray(raw.platforms) ? raw.platforms.join(",") : raw.platforms ?? "";
  const price = raw.webctas?.[0]?.price ?? raw.price ?? {};
  const priceOriginalCents = priceToCents(price.basePriceValue ?? price.basePrice);
  let priceDiscountedCents = priceToCents(
    price.discountedValue ?? price.discountedPrice
  );
  if (priceDiscountedCents == null) priceDiscountedCents = priceOriginalCents;
  let discountPercent = 0;
  const dt = price.discountText || "";
  const m = /(\d+)/.exec(String(dt));
  if (m) discountPercent = parseInt(m[1], 10);
  if (!discountPercent && priceOriginalCents && priceDiscountedCents != null && priceOriginalCents > 0 && priceDiscountedCents < priceOriginalCents) {
    discountPercent = Math.round(
      (priceOriginalCents - priceDiscountedCents) * 100 / priceOriginalCents
    );
  }
  return {
    id: String(id),
    platform: "psn",
    region: "us",
    name,
    imageUrl,
    storeUrl: `https://store.playstation.com/en-us/product/${id}`,
    platforms,
    currency: "USD",
    priceOriginalCents,
    priceDiscountedCents,
    discountPercent,
    discountEndAt: price.endTime || null,
    selected: false,
    published: false,
    notes: "",
    youtubeUrl: "",
    active: true,
    firstSeenAt: now,
    lastSeenAt: now,
    updatedAt: now
  };
}
async function fetchHtml(url, region) {
  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": region.toLowerCase().startsWith("es") ? "es" : "en-US",
          "x-psn-store-locale-override": region
        }
      });
      if (r.status === 404) throw new PsnApiError(`Category not found (404): ${url}`);
      if (r.status === 403)
        throw new PsnApiError("PSN returned 403 (IP/Cloudflare block)");
      if (r.status >= 500) throw new Error(`PSN ${r.status}`);
      return await r.text();
    } catch (e) {
      if (e instanceof PsnApiError) throw e;
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw new PsnApiError(
    `PSN HTML fetch failed after retries: ${lastError?.message || lastError}`
  );
}
function extractNextData(html) {
  const m = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(
    html
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}
function collectProducts(node, out) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const v of node) collectProducts(v, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node;
  const id = obj.id || obj.productId || obj.conceptId;
  const name = obj.name || obj.title;
  const hasPrice = obj.price && typeof obj.price === "object" || Array.isArray(obj.webctas) && obj.webctas.length > 0;
  if (id && typeof id === "string" && /^[A-Z]{2}\d{4}-/.test(id) && name && hasPrice && !out.has(id)) {
    out.set(id, obj);
  }
  for (const v of Object.values(obj)) collectProducts(v, out);
}
function buildCategoryUrl(cfg, page) {
  const regionPath = cfg.region.toLowerCase();
  return `https://store.playstation.com/${regionPath}/category/${cfg.dealsCategoryId}/${page}`;
}
async function* iterCategoryProducts(cfg) {
  const seen = /* @__PURE__ */ new Set();
  const maxPages = 50;
  for (let page = 1; page <= maxPages; page++) {
    const url = buildCategoryUrl(cfg, page);
    const html = await fetchHtml(url, cfg.region);
    const data = extractNextData(html);
    if (!data) {
      if (page === 1) {
        throw new PsnApiError(
          "Could not find __NEXT_DATA__ in PSN HTML \u2014 page layout may have changed."
        );
      }
      break;
    }
    const found = /* @__PURE__ */ new Map();
    collectProducts(data, found);
    let newOnThisPage = 0;
    for (const [id, p] of found) {
      if (seen.has(id)) continue;
      seen.add(id);
      newOnThisPage++;
      yield p;
    }
    if (newOnThisPage === 0) break;
  }
}

// server/competitors.ts
var UA2 = "Mozilla/5.0 (compatible; apipsn/1.0; market-research)";
var CompetitorFetchError = class extends Error {
  constructor(storeKey, message) {
    super(message);
    this.storeKey = storeKey;
  }
};
var NOISE = /* @__PURE__ */ new Set([
  "for",
  "the",
  "of",
  "and",
  "or",
  "a",
  "an",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "ps4",
  "ps5",
  "ps3",
  "psv",
  "psp",
  "xbox",
  "pc",
  "steam",
  "nintendo",
  "switch",
  "edition",
  "ed",
  "deluxe",
  "gold",
  "silver",
  "bronze",
  "platinum",
  "ultimate",
  "goty",
  "standard",
  "digital",
  "cuenta",
  "primaria",
  "secundaria",
  "primaria1",
  "primaria2",
  "game",
  "juego",
  "juegos",
  "bundle",
  "pack",
  "season",
  "pass",
  "collection",
  "complete",
  "remastered",
  "remake",
  "hd",
  "definitive",
  "anniversary",
  "version",
  "vers",
  "ver",
  "inc",
  "incluye",
  "pack"
]);
function tokenize(title) {
  return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[™®©]/g, "").replace(/\[[^\]]*\]/g, " ").replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((t) => t && !NOISE.has(t));
}
function similarity(a, b) {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  if (!inter) return 0;
  const union = sa.size + sb.size - inter;
  const jaccard = inter / union;
  const minSize = Math.min(sa.size, sb.size);
  const containment = inter / minSize;
  return 0.6 * jaccard + 0.4 * containment;
}
var MATCH_THRESHOLD = 0.55;
function parseClp(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.round(v);
  }
  const s = String(v).replace(/[^\d,.-]/g, "");
  if (!s) return null;
  let cleaned = s;
  const decimalTail = /[.,](\d{2})$/.exec(s);
  if (decimalTail) cleaned = s.slice(0, -3);
  cleaned = cleaned.replace(/[.,]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}
async function fetchShopify(storeKey, domain) {
  const products = [];
  for (let page = 1; page <= 40; page++) {
    const url = `https://${domain}/products.json?limit=250&page=${page}`;
    const r = await fetch(url, {
      headers: { "user-agent": UA2, accept: "application/json" }
    });
    if (r.status === 404) {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} no expone /products.json (\xBFno es Shopify?)`
      );
    }
    if (!r.ok) {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} HTTP ${r.status} en /products.json`
      );
    }
    let body;
    try {
      body = await r.json();
    } catch {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} devolvi\xF3 algo que no es JSON en /products.json`
      );
    }
    const batch = body.products ?? [];
    if (!batch.length) break;
    for (const p of batch) {
      const variant = p.variants?.[0];
      const price = parseClp(variant?.price);
      if (price == null) continue;
      products.push({
        storeKey,
        title: p.title,
        url: `https://${domain}/products/${p.handle}`,
        priceClp: price,
        available: variant?.available !== false
      });
    }
    if (batch.length < 250) break;
  }
  return products;
}
var WOO_ENDPOINTS = [
  "/wp-json/wc/store/v1/products",
  "/wp-json/wc/store/products",
  "/?rest_route=/wc/store/v1/products"
];
async function fetchWoo(storeKey, domain) {
  let lastError = "no-attempt";
  for (const basePath of WOO_ENDPOINTS) {
    try {
      return await fetchWooAt(storeKey, domain, basePath);
    } catch (e) {
      if (e instanceof CompetitorFetchError) {
        lastError = e.message;
        continue;
      }
      throw e;
    }
  }
  throw new CompetitorFetchError(
    storeKey,
    `${domain} no expone ning\xFAn endpoint WooCommerce conocido (${lastError})`
  );
}
async function fetchWooAt(storeKey, domain, basePath) {
  const products = [];
  const joiner = basePath.includes("?") ? "&" : "?";
  for (let page = 1; page <= 40; page++) {
    const url = `https://${domain}${basePath}${joiner}per_page=100&page=${page}`;
    const r = await fetch(url, {
      headers: { "user-agent": UA2, accept: "application/json" }
    });
    if (r.status === 404) {
      throw new CompetitorFetchError(storeKey, `${basePath} \u2192 404`);
    }
    if (!r.ok) {
      throw new CompetitorFetchError(storeKey, `${basePath} \u2192 HTTP ${r.status}`);
    }
    let batch;
    try {
      batch = await r.json();
    } catch {
      throw new CompetitorFetchError(storeKey, `${basePath} devolvi\xF3 no-JSON`);
    }
    if (!Array.isArray(batch) || !batch.length) break;
    for (const p of batch) {
      const raw = p.prices?.sale_price || p.prices?.price || p.prices?.regular_price;
      let price = parseClp(raw);
      if (price != null && raw && /^\d+$/.test(String(raw)) && price > 1e6) {
        price = Math.round(price / 100);
      }
      if (price == null) continue;
      products.push({
        storeKey,
        title: p.name,
        url: p.permalink,
        priceClp: price,
        available: p.is_in_stock !== false
      });
    }
    if (batch.length < 100) break;
  }
  if (!products.length) {
    throw new CompetitorFetchError(storeKey, `${basePath} vac\xEDo`);
  }
  return products;
}
var SITEMAP_CANDIDATES = [
  "/product-sitemap.xml",
  "/wp-sitemap-posts-product-1.xml",
  "/sitemap-products.xml",
  "/sitemap_products_1.xml",
  // Shopify-style, but also used by others
  "/sitemap_index.xml",
  "/sitemap.xml"
];
var PRODUCT_URL_HINTS = /\/(producto|productos|product|products|tienda|shop|game|juego|item)\//i;
async function fetchText(url) {
  try {
    const r = await fetch(url, {
      headers: {
        "user-agent": UA2,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}
async function resolveSitemapUrls(domain) {
  const seen = /* @__PURE__ */ new Set();
  const queue = [];
  for (const path2 of SITEMAP_CANDIDATES) {
    queue.push(`https://${domain}${path2}`);
  }
  const urls = [];
  while (queue.length && urls.length < 2e3) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    const xml = await fetchText(current);
    if (!xml) continue;
    const nested = Array.from(
      xml.matchAll(/<sitemap[^>]*>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi)
    ).map((m) => m[1].trim());
    for (const n of nested) {
      if (/product|sitemap-\d+|page-sitemap/i.test(n) || nested.length < 10) {
        queue.push(n);
      }
    }
    const items = Array.from(
      xml.matchAll(/<url[^>]*>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/url>/gi)
    ).map((m) => m[1].trim());
    for (const u of items) urls.push(u);
  }
  const hinted = urls.filter((u) => PRODUCT_URL_HINTS.test(u));
  const pool = hinted.length >= 10 ? hinted : urls;
  const out = [];
  const dedup = /* @__PURE__ */ new Set();
  for (const u of pool) {
    if (dedup.has(u)) continue;
    dedup.add(u);
    out.push(u);
  }
  return out;
}
function isProductNode(n) {
  if (!n || typeof n !== "object") return false;
  const t = n["@type"];
  if (!t) return false;
  if (Array.isArray(t)) return t.some((x) => /product/i.test(x));
  return /product/i.test(String(t));
}
function extractProductFromHtml(html, storeKey, url) {
  const scripts = Array.from(
    html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  );
  for (const m of scripts) {
    let parsed;
    try {
      parsed = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const items = [];
    const graph = parsed?.["@graph"];
    if (Array.isArray(graph)) items.push(...graph);
    else if (Array.isArray(parsed)) items.push(...parsed);
    else items.push(parsed);
    for (const item of items) {
      if (!isProductNode(item)) continue;
      const p = item;
      const name = p.name;
      let priceRaw;
      let availability = "";
      if (Array.isArray(p.offers)) {
        priceRaw = p.offers[0]?.price;
        availability = p.offers[0]?.availability ?? "";
      } else if (p.offers) {
        priceRaw = p.offers.price ?? p.offers.lowPrice;
        availability = p.offers.availability ?? "";
      }
      const price = parseClp(priceRaw);
      if (!name || price == null) continue;
      return {
        storeKey,
        title: String(name),
        url,
        priceClp: price,
        available: !/outofstock/i.test(availability)
      };
    }
  }
  const ogTitle = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(
    html
  )?.[1];
  const ogPrice = /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i.exec(
    html
  )?.[1] || /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
  if (ogTitle && ogPrice) {
    const price = parseClp(ogPrice);
    if (price != null) {
      return { storeKey, title: ogTitle, url, priceClp: price, available: true };
    }
  }
  return null;
}
async function fetchHtmlStorefront(storeKey, domain) {
  const urls = await resolveSitemapUrls(domain);
  if (!urls.length) {
    throw new CompetitorFetchError(
      storeKey,
      `${domain} no expone sitemap.xml con URLs de productos`
    );
  }
  const limit = Math.min(urls.length, 400);
  const concurrency = 6;
  const out = [];
  for (let i = 0; i < limit; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (u) => {
        const html = await fetchText(u);
        if (!html) return null;
        return extractProductFromHtml(html, storeKey, u);
      })
    );
    for (const p of results) if (p) out.push(p);
  }
  if (!out.length) {
    throw new CompetitorFetchError(
      storeKey,
      `${domain}: sitemap encontrado pero no se pudieron extraer productos (sin JSON-LD ni og:price)`
    );
  }
  return out;
}
async function fetchCompetitor(cfg) {
  if (cfg.type === "shopify") return fetchShopify(cfg.key, cfg.domain);
  if (cfg.type === "woocommerce") return fetchWoo(cfg.key, cfg.domain);
  if (cfg.type === "html") return fetchHtmlStorefront(cfg.key, cfg.domain);
  const errors = [];
  for (const fn of [fetchShopify, fetchWoo, fetchHtmlStorefront]) {
    try {
      return await fn(cfg.key, cfg.domain);
    } catch (e) {
      if (!(e instanceof CompetitorFetchError)) throw e;
      errors.push(e.message);
    }
  }
  throw new CompetitorFetchError(
    cfg.key,
    `no se pudo scrapear ${cfg.domain}: ${errors.join(" \xB7 ")}`
  );
}
function matchGames(games, products) {
  const productTokens = products.map((p) => ({ p, tokens: tokenize(p.title) }));
  const out = {};
  for (const g of games) {
    const gTokens = tokenize(g.name);
    if (!gTokens.length) continue;
    const matches = [];
    for (const { p, tokens } of productTokens) {
      if (!tokens.length) continue;
      const score = similarity(gTokens, tokens);
      if (score >= MATCH_THRESHOLD) {
        matches.push({
          storeKey: p.storeKey,
          title: p.title,
          url: p.url,
          priceClp: p.priceClp,
          available: p.available,
          score
        });
      }
    }
    matches.sort((a, b) => a.priceClp - b.priceClp);
    out[g.id] = matches.slice(0, 5);
  }
  return out;
}

// server/psn-product.ts
var UA3 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
async function fetchHtml2(url, region) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "user-agent": UA3,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": region.toLowerCase().startsWith("es") ? "es" : "en-US",
          "x-psn-store-locale-override": region
        }
      });
      if (r.status === 404) throw new PsnApiError(`Product not found (404): ${url}`);
      if (r.status === 403)
        throw new PsnApiError("PSN returned 403 (IP/Cloudflare block)");
      if (r.status >= 500) throw new Error(`PSN ${r.status}`);
      return await r.text();
    } catch (e) {
      if (e instanceof PsnApiError) throw e;
      lastErr = e;
      await new Promise((res) => setTimeout(res, 400 * 2 ** attempt));
    }
  }
  throw new PsnApiError(
    `PSN product fetch failed: ${lastErr?.message || lastErr}`
  );
}
function extractNextData2(html) {
  const m = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(
    html
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}
function findProductRecords(tree, targetId) {
  const out = [];
  const stack = [tree];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (Array.isArray(n)) {
      for (const v of n) stack.push(v);
      continue;
    }
    if (typeof n !== "object") continue;
    const obj = n;
    if (obj.id === targetId || obj.productId === targetId) out.push(obj);
    for (const v of Object.values(obj)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return out;
}
function pickRichest(records) {
  if (!records.length) return null;
  let best = records[0];
  let bestKeys = Object.keys(best).length;
  for (const r of records) {
    const k = Object.keys(r).length;
    if (k > bestKeys) {
      best = r;
      bestKeys = k;
    }
  }
  return best;
}
function mergeRecords(records) {
  const sorted = [...records].sort(
    (a, b) => Object.keys(a).length - Object.keys(b).length
  );
  const merged = {};
  for (const r of sorted) {
    for (const [k, v] of Object.entries(r)) {
      if (v == null) continue;
      if (merged[k] == null) merged[k] = v;
    }
  }
  return merged;
}
function extractMedia(obj) {
  const list = obj.media || [];
  const byRole = {};
  const screenshots = [];
  const videos = [];
  let posterForNextVideo = null;
  for (const m of list) {
    const role = String(m?.role || "").toUpperCase();
    const type = String(m?.type || "").toUpperCase();
    const url = m?.url || m?.source?.url || null;
    if (type.includes("VIDEO") || role === "PROMO") {
      if (!url) continue;
      videos.push({
        url,
        posterUrl: posterForNextVideo,
        mimeType: m?.source?.type || null
      });
      posterForNextVideo = null;
      continue;
    }
    if (!url) continue;
    if (!byRole[role]) byRole[role] = url;
    if (role === "SCREENSHOT") screenshots.push(url);
  }
  return {
    heroUrl: byRole["HERO_BANNER"] || byRole["HEROBANNER"] || byRole["BACKGROUND_IMAGE"] || byRole["BACKGROUND"] || null,
    logoUrl: byRole["LOGO"] || byRole["LOGO_TRANSPARENT"] || null,
    backgroundUrl: byRole["BACKGROUND_IMAGE"] || byRole["BACKGROUND"] || null,
    coverUrl: byRole["MASTER"] || byRole["BOXART"] || byRole["GAMEHUB_COVER_ART"] || byRole["PREVIEW_GAME_ART"] || null,
    screenshots: [...new Set(screenshots)],
    videos
  };
}
var ALLOWED_TAGS = /* @__PURE__ */ new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4"
]);
function sanitizeHtml(raw) {
  if (!raw) return "";
  let s = raw;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const t = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return "";
    return match.startsWith("</") ? `</${t}>` : `<${t}>`;
  });
  s = s.replace(/(?:<p>\s*<\/p>\s*){2,}/gi, "<p></p>");
  return s.trim();
}
function toStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const obj = x;
        return String(obj.name || obj.label || obj.description || "");
      }
      return "";
    }).filter(Boolean);
  }
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}
function str(v) {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "object") {
    const obj = v;
    return typeof obj.name === "string" && obj.name || typeof obj.description === "string" && obj.description || null;
  }
  return String(v) || null;
}
function extractFileSizeFromHtml(html) {
  const labelMatch = /File\s*Size[^<]*<\/[^>]+>\s*<[^>]+>([^<]+)</i.exec(html) || /"fileSize"\s*:\s*"([^"]+)"/i.exec(html);
  if (labelMatch && labelMatch[1]) return labelMatch[1].trim();
  const any = /(\d{1,3}(?:[.,]\d+)?)\s*GB\b/i.exec(html);
  return any ? `${any[1]} GB` : null;
}
async function fetchProductDetail(id, storeUrl, region) {
  const url = storeUrl || `https://store.playstation.com/en-us/product/${id}`;
  const html = await fetchHtml2(url, region);
  const data = extractNextData2(html);
  if (!data) throw new PsnApiError("No __NEXT_DATA__ in PSN product page");
  const records = findProductRecords(data, id);
  const rich = pickRichest(records);
  if (!rich) throw new PsnApiError(`Product ${id} not found in page JSON`);
  const obj = mergeRecords(records);
  const platformsRaw = obj.platforms;
  const platforms = Array.isArray(platformsRaw) ? platformsRaw.join(",") : String(platformsRaw || "");
  const longDesc = typeof obj.longDescription === "string" && obj.longDescription || typeof obj.description === "string" && obj.description || "";
  const shortDesc = typeof obj.shortDescription === "string" && obj.shortDescription || null;
  const fileSize = str(obj.requiredDiskSpaceDescription) || str(obj.fileSize) || extractFileSizeFromHtml(html);
  const contentRating = obj.contentRating;
  const ageRating = str(contentRating?.description) || str(contentRating?.name) || str(obj.ageLimit);
  return {
    id,
    name: String(obj.name || obj.title || ""),
    description: sanitizeHtml(longDesc),
    shortDescription: shortDesc,
    publisher: str(obj.publisherName) || str(obj.publisher) || str(obj.publishedBy),
    developer: str(obj.developerName) || str(obj.developer),
    releaseDate: str(obj.releaseDate) || str(obj.localizedReleaseDate) || str(obj.releaseDateRaw),
    genres: toStringArray(obj.genres),
    voiceLanguages: toStringArray(obj.spokenLanguages || obj.compatibleVoices),
    subtitleLanguages: toStringArray(
      obj.subtitleLanguages || obj.compatibleSubtitles
    ),
    ageRating,
    fileSize,
    platforms,
    media: extractMedia(obj),
    storeUrl: url,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/providers/types.ts
var PLATFORM_LABELS = {
  psn: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  steam: "Steam"
};
var PLATFORM_REGIONS = {
  psn: [
    { code: "us", label: "US", currency: "USD", locale: "en-US" },
    { code: "br", label: "Brasil", currency: "BRL", locale: "pt-BR" }
  ],
  xbox: [
    { code: "us", label: "US", currency: "USD", locale: "en-US" },
    { code: "br", label: "Brasil", currency: "BRL", locale: "pt-BR" },
    { code: "tr", label: "Turqu\xEDa", currency: "TRY", locale: "tr-TR" }
  ],
  nintendo: [
    { code: "us", label: "US", currency: "USD", locale: "en-US" },
    { code: "jp", label: "Jap\xF3n", currency: "JPY", locale: "ja" }
  ],
  steam: [
    { code: "us", label: "US", currency: "USD", locale: "en" },
    { code: "br", label: "Brasil", currency: "BRL", locale: "brazilian" },
    { code: "tr", label: "Turqu\xEDa", currency: "TRY", locale: "turkish" }
  ]
};
var ProviderError = class extends Error {
  constructor(platform, region, message) {
    super(`[${platform}/${region}] ${message}`);
    this.platform = platform;
    this.region = region;
  }
};

// server/providers/psn.ts
var psnProvider = {
  platform: "psn",
  async *fetchDeals(source) {
    const locale = source.region === "br" ? "pt-BR" : "en-US";
    const cfg = {
      region: locale,
      dealsCategoryId: source.categoryId || "",
      categoryGridHash: "",
      includeAddOns: false
    };
    if (!cfg.dealsCategoryId) {
      throw new PsnApiError(
        "No se configur\xF3 un Category ID para PSN " + source.region.toUpperCase()
      );
    }
    const currency = source.region === "br" ? "BRL" : "USD";
    for await (const raw of iterCategoryProducts(cfg)) {
      if (!isFullGameProduct(raw)) continue;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const game = normalizeProduct(raw, now);
      if (!game) continue;
      const regionPath = locale.toLowerCase();
      const storeUrl = `https://store.playstation.com/${regionPath}/product/${game.id}`;
      yield {
        id: game.id,
        name: game.name,
        imageUrl: game.imageUrl,
        storeUrl,
        hardwarePlatforms: game.platforms,
        currency,
        priceOriginalCents: game.priceOriginalCents,
        priceDiscountedCents: game.priceDiscountedCents,
        discountPercent: game.discountPercent,
        discountEndAt: game.discountEndAt
      };
    }
  }
};

// server/providers/xbox.ts
var UA4 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var MARKET_MAP = {
  us: "US",
  br: "BR",
  tr: "TR"
};
var LANG_MAP = {
  us: "en-US",
  br: "pt-BR",
  tr: "tr-TR"
};
var CURRENCY_MAP = {
  us: "USD",
  br: "BRL",
  tr: "TRY"
};
function toCents(price) {
  if (price == null || !Number.isFinite(price)) return null;
  return Math.round(price * 100);
}
async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": UA4, accept: "application/json" }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}
async function fetchDealIds(market, language) {
  const url = `https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed/Deal?Market=${market}&Language=${language}&ItemTypes=Game&deviceFamily=Windows.Xbox&count=2000&skipitems=0`;
  const data = await fetchJson(url);
  const items = data?.Items ?? [];
  return items.map((it) => it.Id).filter(Boolean);
}
async function fetchProductDetails(ids, market, language) {
  const batchSize = 20;
  const all = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const url = `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${batch.join(",")}&market=${market}&languages=${language}&MS-CV=DGU1mcuYo0WMMp+F.1`;
    try {
      const data = await fetchJson(url);
      const products = data?.Products ?? [];
      all.push(...products);
    } catch {
    }
  }
  return all;
}
function extractGameData(product, region) {
  const id = product.ProductId;
  if (!id) return null;
  const lp = product.LocalizedProperties?.[0];
  const name = lp?.ProductTitle;
  if (!name) return null;
  let imageUrl = null;
  const images = lp?.Images ?? [];
  const hero = images.find(
    (img) => img.ImagePurpose === "SuperHeroArt" || img.ImagePurpose === "Poster"
  );
  const boxArt = images.find((img) => img.ImagePurpose === "BoxArt");
  const anyImg = images[0];
  const chosen = hero || boxArt || anyImg;
  if (chosen?.Uri) {
    imageUrl = chosen.Uri.startsWith("//") ? "https:" + chosen.Uri : chosen.Uri;
  }
  const dsa = product.DisplaySkuAvailabilities?.[0];
  const avails = dsa?.Availabilities ?? [];
  let listPrice = null;
  let salePrice = null;
  let endDate = null;
  const currency = CURRENCY_MAP[region] || "USD";
  for (const a of avails) {
    const p = a.OrderManagementData?.Price;
    if (!p) continue;
    const msrp = p.MSRP ?? p.ListPrice;
    const sale = p.ListPrice ?? p.WholesalePrice;
    if (msrp != null && listPrice == null) listPrice = msrp;
    if (sale != null && sale < (msrp ?? Infinity)) {
      salePrice = sale;
      endDate = a.Conditions?.EndDate ?? null;
    }
  }
  if (listPrice == null && salePrice == null) return null;
  const originalCents = toCents(listPrice);
  const discountedCents = toCents(salePrice) ?? originalCents;
  let discountPercent = 0;
  if (originalCents && discountedCents != null && discountedCents < originalCents) {
    discountPercent = Math.round(
      (originalCents - discountedCents) * 100 / originalCents
    );
  }
  const market = MARKET_MAP[region] || "US";
  const storeUrl = `https://www.xbox.com/${market.toLowerCase()}/games/store/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}/${id}`;
  return {
    id,
    name,
    imageUrl,
    storeUrl,
    hardwarePlatforms: "Xbox Series X|S, Xbox One",
    currency,
    priceOriginalCents: originalCents,
    priceDiscountedCents: discountedCents,
    discountPercent,
    discountEndAt: endDate
  };
}
var xboxProvider = {
  platform: "xbox",
  async *fetchDeals(source) {
    const market = MARKET_MAP[source.region];
    const language = LANG_MAP[source.region];
    if (!market || !language) {
      throw new ProviderError("xbox", source.region, `Regi\xF3n no soportada: ${source.region}`);
    }
    const ids = await fetchDealIds(market, language);
    if (ids.length === 0) return;
    const products = await fetchProductDetails(ids, market, language);
    for (const product of products) {
      const deal = extractGameData(product, source.region);
      if (deal && deal.discountPercent > 0) {
        yield deal;
      }
    }
  }
};

// server/providers/steam.ts
var UA5 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var CC_MAP = {
  us: "us",
  br: "br",
  tr: "tr"
};
var CURRENCY_MAP2 = {
  us: "USD",
  br: "BRL",
  tr: "TRY"
};
async function fetchJson2(url) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "user-agent": UA5,
          accept: "application/json, text/javascript, */*"
        }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}
function parseSteamPrice(priceStr) {
  if (!priceStr) return null;
  const s = priceStr.replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "").trim();
  if (!s || /^free/i.test(s) || /gratis/i.test(s)) return null;
  const cleaned = s.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return null;
  const parts = cleaned.split(/[.,]/);
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 2) {
      const whole = parts.slice(0, -1).join("");
      const n2 = Number(whole + "." + lastPart);
      if (Number.isFinite(n2)) return Math.round(n2 * 100);
    }
  }
  const n = Number(cleaned.replace(/,/g, "."));
  if (Number.isFinite(n)) return Math.round(n * 100);
  return null;
}
async function* fetchSteamDeals(cc, currency, region) {
  const pageSize = 100;
  const maxPages = 30;
  const seen = /* @__PURE__ */ new Set();
  for (let page = 0; page < maxPages; page++) {
    const start = page * pageSize;
    const url = `https://store.steampowered.com/search/results/?query&start=${start}&count=${pageSize}&dynamic_data=&sort_by=_ASC&specials=1&snr=1_7_7_230_7&infinite=1&cc=${cc}`;
    let data;
    try {
      data = await fetchJson2(url);
    } catch {
      break;
    }
    const html = data?.results_html ?? "";
    if (!html || html.trim() === "") break;
    const anchors = [];
    const anchorStarts = [...html.matchAll(/<a[^>]*data-ds-appid="(\d+)"/g)];
    for (let i = 0; i < anchorStarts.length; i++) {
      const appId = anchorStarts[i][1];
      const startIdx = anchorStarts[i].index;
      const endIdx = i + 1 < anchorStarts.length ? anchorStarts[i + 1].index : html.length;
      anchors.push({ appId, block: html.slice(startIdx, endIdx) });
    }
    let foundOnPage = 0;
    for (const { appId, block: row } of anchors) {
      if (seen.has(appId)) continue;
      seen.add(appId);
      const nameMatch = /<span class="title">([^<]+)<\/span>/.exec(row);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();
      const pctMatch = /discount_pct[^>]*>([^<]*)</.exec(row);
      const origMatch = /discount_original_price[^>]*>([^<]*)</.exec(row);
      const finalMatch = /discount_final_price[^>]*>([^<]*)</.exec(row);
      const discountPctStr = pctMatch?.[1]?.trim().replace(/[-%]/g, "") ?? "";
      const originalPriceStr = origMatch?.[1]?.trim() ?? "";
      const finalPriceStr = finalMatch?.[1]?.trim() ?? "";
      const discountPercent = parseInt(discountPctStr) || 0;
      const originalCents = parseSteamPrice(originalPriceStr);
      const discountedCents = parseSteamPrice(finalPriceStr);
      if (!originalCents && !discountedCents) continue;
      foundOnPage++;
      yield {
        id: appId,
        name,
        imageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
        storeUrl: `https://store.steampowered.com/app/${appId}/`,
        hardwarePlatforms: "PC",
        currency,
        priceOriginalCents: originalCents,
        priceDiscountedCents: discountedCents ?? originalCents,
        discountPercent,
        discountEndAt: null
      };
    }
    const totalCount = data?.total_count ?? 0;
    if (start + pageSize >= totalCount || foundOnPage === 0) break;
  }
}
var steamProvider = {
  platform: "steam",
  async *fetchDeals(source) {
    const cc = CC_MAP[source.region];
    const currency = CURRENCY_MAP2[source.region];
    if (!cc || !currency) {
      throw new ProviderError(
        "steam",
        source.region,
        `Regi\xF3n no soportada: ${source.region}`
      );
    }
    yield* fetchSteamDeals(cc, currency, source.region);
  }
};

// server/providers/nintendo.ts
var UA6 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var CURRENCY_MAP3 = {
  us: "USD",
  jp: "JPY"
};
async function fetchWithRetry(url, headers) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": UA6, ...headers }
      });
      if (r.status === 403 || r.status === 429) {
        await new Promise((res) => setTimeout(res, 1e3 * 2 ** attempt));
        continue;
      }
      return r;
    } catch (e) {
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}
async function fetchJson3(url, headers) {
  const r = await fetchWithRetry(url, {
    accept: "application/json",
    ...headers
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function fetchHtml3(url) {
  const r = await fetchWithRetry(url, {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "ja"
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
async function postJson(url, body, headers) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "user-agent": UA6,
          "content-type": "application/json",
          accept: "application/json",
          ...headers
        },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}
var ALGOLIA_APP_ID = "U3B6GR4UA3";
var ALGOLIA_API_KEY = "a29c6927638bfd8cee23993e51e721c9";
var ALGOLIA_INDEX = "store_game_en_us";
async function* fetchNintendoUS() {
  const pageSize = 500;
  let page = 0;
  const maxPages = 20;
  while (page < maxPages) {
    const params = [
      `query=`,
      `hitsPerPage=${pageSize}`,
      `page=${page}`,
      `filters=price.discounted:true`,
      `facets=["platform"]`
    ].join("&");
    let data;
    try {
      data = await postJson(
        `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
        { params },
        {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": ALGOLIA_API_KEY
        }
      );
    } catch {
      break;
    }
    const hits = data?.hits ?? [];
    if (hits.length === 0) break;
    for (const hit of hits) {
      const id = hit.nsuid || hit.objectID;
      const name = hit.title;
      if (!name || !id) continue;
      const price = hit.price;
      if (!price) continue;
      const regPrice = price.regPrice;
      const salePrice = price.salePrice;
      if (regPrice == null && salePrice == null) continue;
      const originalCents = regPrice != null ? Math.round(regPrice * 100) : null;
      const discountedCents = salePrice != null ? Math.round(salePrice * 100) : originalCents;
      let discountPercent = price.percentOff ?? 0;
      if (!discountPercent && originalCents && discountedCents != null && discountedCents < originalCents) {
        discountPercent = Math.round(
          (originalCents - discountedCents) * 100 / originalCents
        );
      }
      const imageUrl = hit.productImageSquare || hit.productImage || null;
      const storeUrl = hit.url ? `https://www.nintendo.com${hit.url}` : `https://www.nintendo.com/us/store/products/${id}/`;
      yield {
        id,
        name,
        imageUrl,
        storeUrl,
        hardwarePlatforms: hit.platform || "Nintendo Switch",
        currency: "USD",
        priceOriginalCents: originalCents,
        priceDiscountedCents: discountedCents,
        discountPercent,
        discountEndAt: hit.eshopDetails?.discountPriceEnd || null
      };
    }
    const totalPages = data?.nbPages ?? 0;
    page++;
    if (page >= totalPages) break;
  }
}
function jpYenToCents(s) {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9]/g, "");
  const n = parseInt(cleaned, 10);
  if (!Number.isFinite(n) || n === 0) return null;
  return n * 100;
}
function parseJpStoreHtml(html) {
  const deals = [];
  const seen = /* @__PURE__ */ new Set();
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      const items = Array.isArray(ld) ? ld : ld["@graph"] ? ld["@graph"] : [ld];
      for (const item of items) {
        if (item["@type"] !== "Product" && item["@type"] !== "VideoGame") continue;
        const id = item.sku || item.productID || item.identifier;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        deals.push({
          id: String(id),
          name: item.name || "",
          imageUrl: item.image || null,
          storeUrl: item.url || `https://store-jp.nintendo.com/item/software/${id}`,
          hardwarePlatforms: "Nintendo Switch",
          currency: "JPY",
          priceOriginalCents: null,
          priceDiscountedCents: jpYenToCents(offer?.price || offer?.lowPrice),
          discountPercent: 0,
          discountEndAt: null
        });
      }
    } catch {
    }
  }
  if (deals.length > 0) return deals;
  const nextDataMatch = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      const products = findProductsInTree(data);
      for (const p of products) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        deals.push(p);
      }
    } catch {
    }
  }
  if (deals.length > 0) return deals;
  const tileRegex = /data-pid=["']([^"']+)["'][\s\S]*?<[^>]*class=["'][^"']*product-name[^"']*["'][^>]*>([^<]+)<[\s\S]*?(?:data-price|class=["'][^"']*price[^"']*["'])[^>]*>([^<]*)</gi;
  let tileMatch;
  while ((tileMatch = tileRegex.exec(html)) !== null) {
    const id = tileMatch[1].trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deals.push({
      id,
      name: tileMatch[2].trim(),
      imageUrl: null,
      storeUrl: `https://store-jp.nintendo.com/item/software/${id}`,
      hardwarePlatforms: "Nintendo Switch",
      currency: "JPY",
      priceOriginalCents: null,
      priceDiscountedCents: jpYenToCents(tileMatch[3]),
      discountPercent: 0,
      discountEndAt: null
    });
  }
  const jsonArrayRegex = /\[(\{"[^"]*id[^"]*"[:\s]*"[^"]*"[\s\S]*?\}(?:,\s*\{[\s\S]*?\})*)\]/g;
  let arrMatch;
  while ((arrMatch = jsonArrayRegex.exec(html)) !== null) {
    try {
      const arr = JSON.parse("[" + arrMatch[1] + "]");
      for (const item of arr) {
        const id = item.id || item.nsuid || item.productId || item.pid;
        const name = item.title || item.name || item.productName;
        if (!id || !name || seen.has(String(id))) continue;
        seen.add(String(id));
        const price = item.salePrice || item.price || item.discountPrice;
        const origPrice = item.originalPrice || item.regularPrice || item.listPrice;
        deals.push({
          id: String(id),
          name,
          imageUrl: item.image || item.imageUrl || item.thumbnail || null,
          storeUrl: item.url || `https://store-jp.nintendo.com/item/software/${id}`,
          hardwarePlatforms: "Nintendo Switch",
          currency: "JPY",
          priceOriginalCents: jpYenToCents(String(origPrice ?? "")),
          priceDiscountedCents: jpYenToCents(String(price ?? "")),
          discountPercent: parseInt(item.discountRate || item.discountPercent || "0") || 0,
          discountEndAt: null
        });
      }
    } catch {
    }
  }
  return deals;
}
function findProductsInTree(node, results = []) {
  if (!node || typeof node !== "object") return results;
  if (Array.isArray(node)) {
    for (const v of node) findProductsInTree(v, results);
    return results;
  }
  const obj = node;
  const id = obj.nsuid || obj.id || obj.productId;
  const name = obj.title || obj.name;
  const hasPrice = obj.price != null || obj.salePrice != null || obj.regularPrice != null;
  if (id && name && hasPrice) {
    results.push({
      id: String(id),
      name: String(name),
      imageUrl: obj.image || obj.imageUrl || null,
      storeUrl: obj.url || `https://store-jp.nintendo.com/item/software/${id}`,
      hardwarePlatforms: "Nintendo Switch",
      currency: "JPY",
      priceOriginalCents: jpYenToCents(String(obj.regularPrice ?? obj.originalPrice ?? obj.price ?? "")),
      priceDiscountedCents: jpYenToCents(String(obj.salePrice ?? obj.discountPrice ?? obj.price ?? "")),
      discountPercent: parseInt(obj.discountRate || obj.discountPercent || "0") || 0,
      discountEndAt: null
    });
  }
  for (const v of Object.values(obj)) findProductsInTree(v, results);
  return results;
}
async function* fetchNintendoJP_Store() {
  const maxPages = 50;
  const seen = /* @__PURE__ */ new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://store-jp.nintendo.com/list/software?softType=TITLE&isSale=true&srule=most-popular&page=${page}`;
    let html;
    try {
      html = await fetchHtml3(url);
    } catch {
      break;
    }
    const deals = parseJpStoreHtml(html);
    let newOnPage = 0;
    for (const deal of deals) {
      if (seen.has(deal.id)) continue;
      seen.add(deal.id);
      newOnPage++;
      if (deal.priceOriginalCents && deal.priceDiscountedCents && deal.priceDiscountedCents < deal.priceOriginalCents && !deal.discountPercent) {
        deal.discountPercent = Math.round(
          (deal.priceOriginalCents - deal.priceDiscountedCents) * 100 / deal.priceOriginalCents
        );
      }
      yield deal;
    }
    if (newOnPage === 0) break;
  }
}
async function* fetchNintendoJP_SearchApi() {
  const pageSize = 300;
  let start = 0;
  const maxItems = 6e3;
  while (start < maxItems) {
    const url = `https://search.nintendo.jp/nintendo_soft/search.json?opt_sshow=1&fq=ssitu_s:onsale+hard_s:1_HAC&rows=${pageSize}&start=${start}&sort=score+desc`;
    let data;
    try {
      data = await fetchJson3(url);
    } catch {
      break;
    }
    const docs = data?.result?.items ?? [];
    if (docs.length === 0) break;
    for (const item of docs) {
      const id = item.nsuid || item.id;
      const name = item.title;
      if (!name || !id) continue;
      const originalCents = jpYenToCents(item.ppri);
      const discountedCents = jpYenToCents(item.spri) ?? originalCents;
      let discountPercent = parseInt(item.dsper) || 0;
      if (!discountPercent && originalCents && discountedCents != null && discountedCents < originalCents) {
        discountPercent = Math.round(
          (originalCents - discountedCents) * 100 / originalCents
        );
      }
      if (!originalCents && !discountedCents) continue;
      const imageUrl = item.iurl || null;
      const storeUrl = item.sslurl || `https://store-jp.nintendo.com/item/software/${id}`;
      yield {
        id: String(id),
        name,
        imageUrl,
        storeUrl,
        hardwarePlatforms: "Nintendo Switch",
        currency: "JPY",
        priceOriginalCents: originalCents,
        priceDiscountedCents: discountedCents,
        discountPercent,
        discountEndAt: null
      };
    }
    start += pageSize;
    const totalCount = data?.result?.total ?? 0;
    if (start >= totalCount) break;
  }
}
async function* fetchNintendoJP() {
  let count = 0;
  try {
    for await (const deal of fetchNintendoJP_Store()) {
      count++;
      yield deal;
    }
  } catch {
  }
  if (count === 0) {
    yield* fetchNintendoJP_SearchApi();
  }
}
var nintendoProvider = {
  platform: "nintendo",
  async *fetchDeals(source) {
    const currency = CURRENCY_MAP3[source.region];
    if (!currency) {
      throw new ProviderError(
        "nintendo",
        source.region,
        `Regi\xF3n no soportada: ${source.region}`
      );
    }
    if (source.region === "us") {
      yield* fetchNintendoUS();
    } else if (source.region === "jp") {
      yield* fetchNintendoJP();
    }
  }
};

// server/providers/index.ts
var PROVIDERS = {
  psn: psnProvider,
  xbox: xboxProvider,
  steam: steamProvider,
  nintendo: nintendoProvider
};
function getProvider(platform) {
  return PROVIDERS[platform];
}

// server/api.ts
function extractPsnId(input) {
  const s = String(input || "").trim();
  if (!s) return null;
  if (/^[A-Z]{2}[0-9]{4}-[A-Z0-9]+_[0-9]{2}(?:-[A-Z0-9]+)?$/.test(s)) return s;
  const m = /\/product\/([A-Z]{2}[0-9]{4}-[A-Z0-9]+_[0-9]{2}(?:-[A-Z0-9]+)?)/i.exec(
    s
  );
  return m ? m[1].toUpperCase() : null;
}
function diffWatchlist(seen, nowIso) {
  const alerts = [];
  for (const w of store.listWatchlist()) {
    const game = store.getGame(w.id);
    const inSaleNow = !!game && game.active && game.discountPercent > 0 && seen.has(w.id);
    const transitioned = inSaleNow && w.lastStatus !== "on_sale";
    if (transitioned && game) {
      alerts.push({
        id: w.id,
        name: game.name,
        discountPercent: game.discountPercent,
        priceDiscountedUsd: game.priceDiscountedCents != null ? game.priceDiscountedCents / 100 : null,
        storeUrl: game.storeUrl
      });
    }
    store.patchWatched(w.id, {
      name: game?.name || w.name,
      lastStatus: inSaleNow ? "on_sale" : w.lastStatus === "unseen" ? "unseen" : "off_sale",
      lastSeenOnSaleAt: inSaleNow ? nowIso : w.lastSeenOnSaleAt,
      lastPriceCents: game?.priceDiscountedCents ?? w.lastPriceCents,
      lastDiscountPercent: game?.discountPercent ?? w.lastDiscountPercent
    });
  }
  return alerts;
}
var routes = [];
function route(method, path2, handler) {
  const keys = [];
  const pattern = new RegExp(
    "^" + path2.replace(/:([a-zA-Z_]+)/g, (_, k) => {
      keys.push(k);
      return "([^/]+)";
    }) + "$"
  );
  routes.push({ method, pattern, keys, handler });
}
function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function gameDbKey(g) {
  return `${g.platform}:${g.region}:${g.id}`;
}
function toGameOut(g, cfgPricing = store.getSettings()) {
  const sale = computeSalePrices(g.priceDiscountedCents, cfgPricing, g.currency || "USD");
  const dbKey = gameDbKey(g);
  const matches = store.getCompetitorMatches(dbKey) || store.getCompetitorMatches(g.id);
  const marketMin = matches.length ? Math.min(...matches.map((m) => m.priceClp)) : null;
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
    priceOriginal: g.priceOriginalCents != null ? g.priceOriginalCents / 100 : null,
    priceDiscounted: g.priceDiscountedCents != null ? g.priceDiscountedCents / 100 : null,
    priceOriginalUsd: g.priceOriginalCents != null ? g.priceOriginalCents / 100 : null,
    priceDiscountedUsd: g.priceDiscountedCents != null ? g.priceDiscountedCents / 100 : null,
    discountPercent: g.discountPercent,
    discountEndAt: g.discountEndAt,
    selected: g.selected,
    published: g.published,
    notes: g.notes,
    youtubeUrl: g.youtubeUrl || "",
    active: g.active,
    costClp: sale?.costClp ?? null,
    primaria1: sale?.primaria1 ?? null,
    primaria2: sale?.primaria2 ?? null,
    secundaria: sale?.secundaria ?? null,
    marketMin,
    marketCount: matches.length,
    marketMatches: matches
  };
}
route("GET", "/games", async (req, res) => {
  const url = new URL(req.url || "/", "http://x");
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const minDiscount = parseInt(url.searchParams.get("min_discount") || "0", 10) || 0;
  const onlySelected = url.searchParams.get("only_selected") === "true";
  const hidePublished = url.searchParams.get("hide_published") === "true";
  const onlyWithMarket = url.searchParams.get("only_with_market") === "true";
  const includeInactive = url.searchParams.get("include_inactive") === "true";
  const platformFilter = url.searchParams.get("platform") || "";
  const sort = url.searchParams.get("sort") || "discount";
  let games = store.listGames();
  if (!includeInactive) games = games.filter((g) => g.active);
  if (platformFilter) games = games.filter((g) => (g.platform || "psn") === platformFilter);
  if (minDiscount > 0) games = games.filter((g) => g.discountPercent >= minDiscount);
  if (onlySelected) games = games.filter((g) => g.selected);
  if (hidePublished) games = games.filter((g) => !g.published);
  if (onlyWithMarket) {
    games = games.filter((g) => {
      const key = gameDbKey(g);
      return (store.getCompetitorMatches(key) || store.getCompetitorMatches(g.id)).length > 0;
    });
  }
  if (search) games = games.filter((g) => g.name.toLowerCase().includes(search));
  if (sort === "price") games.sort((a, b) => (a.priceDiscountedCents ?? 0) - (b.priceDiscountedCents ?? 0));
  else if (sort === "name") games.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "market") {
    games.sort((a, b) => {
      const am = store.getCompetitorMatches(a.id);
      const bm = store.getCompetitorMatches(b.id);
      const ap = am.length ? Math.min(...am.map((m) => m.priceClp)) : Infinity;
      const bp = bm.length ? Math.min(...bm.map((m) => m.priceClp)) : Infinity;
      return ap - bp;
    });
  } else games.sort((a, b) => b.discountPercent - a.discountPercent);
  const cfg = store.getSettings();
  sendJson(res, 200, games.map((g) => toGameOut(g, cfg)));
});
route("PATCH", "/games/:id", async (req, res, params) => {
  const body = await readBody(req);
  const patch = {};
  if (typeof body.selected === "boolean") patch.selected = body.selected;
  if (typeof body.published === "boolean") patch.published = body.published;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.youtubeUrl === "string") patch.youtubeUrl = body.youtubeUrl.trim();
  const id = decodeURIComponent(params.id);
  let updated = store.patchGame(id, patch);
  if (!updated) {
    updated = store.patchGame(`psn:us:${id}`, patch);
  }
  if (!updated) return sendJson(res, 404, { error: "not_found" });
  sendJson(res, 200, toGameOut(updated));
});
route("POST", "/refresh", async (req, res) => {
  try {
    const body = await readBody(req);
    const targetPlatform = body.platform;
    const targetRegion = body.region;
    const sources = store.getSources().filter((s) => {
      if (!s.enabled) return false;
      if (targetPlatform && s.platform !== targetPlatform) return false;
      if (targetRegion && s.region !== targetRegion) return false;
      return true;
    });
    if (sources.length === 0 && !targetPlatform) {
      return await legacyPsnRefresh(res);
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const results = [];
    let allWatchlistAlerts = [];
    for (const source of sources) {
      try {
        const provider = getProvider(source.platform);
        const seenKeys = /* @__PURE__ */ new Set();
        let newCount = 0;
        let updated = 0;
        let totalSeen2 = 0;
        const effSource = { ...source };
        if (source.platform === "psn" && !source.categoryId) {
          effSource.categoryId = store.getPsn().dealsCategoryId;
        }
        for await (const deal of provider.fetchDeals(effSource)) {
          totalSeen2++;
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
              updatedAt: nowIso
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
              updatedAt: nowIso
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
          totalSeen: totalSeen2
        });
      } catch (e) {
        results.push({
          platform: source.platform,
          region: source.region,
          newCount: 0,
          updated: 0,
          disappeared: 0,
          totalSeen: 0,
          error: e.message
        });
      }
    }
    recomputeMatches();
    const psnSeenIds = /* @__PURE__ */ new Set();
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
      sourceResults: results
    });
  } catch (e) {
    if (e instanceof PersistedQueryNotFoundError) {
      return sendJson(res, 502, {
        error: "persisted_query_not_found",
        message: e.message,
        hint: "Abre DevTools > Network en la p\xE1gina de ofertas de PS Store, busca la request a /api/graphql/v1/op?operationName=categoryGridRetrieve y actualiza el hash en Ajustes."
      });
    }
    if (e instanceof PsnApiError || e instanceof ProviderError) {
      return sendJson(res, 502, {
        error: "provider_error",
        message: e.message,
        hint: "Si esto corre en una sandbox (Bolt/StackBlitz) la IP puede estar bloqueada. Prob\xE1 desde tu m\xE1quina o servidor."
      });
    }
    sendJson(res, 500, { error: "internal", message: e.message });
  }
});
async function legacyPsnRefresh(res) {
  const cfg = store.getPsn();
  const seenKeys = /* @__PURE__ */ new Set();
  let newCount = 0;
  let updated = 0;
  let totalSeen = 0;
  let filteredAddOns = 0;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  for await (const raw of iterCategoryProducts(cfg)) {
    totalSeen++;
    if (!cfg.includeAddOns && !isFullGameProduct(raw)) {
      filteredAddOns++;
      continue;
    }
    const normalized = normalizeProduct(raw, nowIso);
    if (!normalized) continue;
    normalized.platform = "psn";
    normalized.region = "us";
    normalized.currency = "USD";
    const dbKey = `psn:us:${normalized.id}`;
    seenKeys.add(dbKey);
    const existing = store.getGameByComposite("psn", "us", normalized.id);
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
        updatedAt: nowIso
      });
      updated++;
    }
  }
  const disappeared = store.markInactiveIfMissing(seenKeys, "psn", "us");
  recomputeMatches();
  const watchlistAlerts = diffWatchlist(new Set(
    [...seenKeys].map((k) => k.replace(/^psn:us:/, ""))
  ), nowIso);
  sendJson(res, 200, {
    new: newCount,
    updated,
    disappeared,
    totalSeen,
    kept: seenKeys.size,
    filteredAddOns,
    watchlistAlerts
  });
}
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
    "notes"
  ];
  const escape = (v) => {
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
        g.notes
      ].map(escape).join(",")
    );
  }
  res.statusCode = 200;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", 'attachment; filename="apipsn-games.csv"');
  res.end(lines.join("\n"));
});
route("GET", "/settings", async (_req, res) => {
  sendJson(res, 200, {
    pricing: store.getSettings(),
    psn: store.getPsn(),
    sources: store.getSources()
  });
});
route("PUT", "/settings", async (req, res) => {
  const body = await readBody(req);
  const pricing = body.pricing ? store.updateSettings(body.pricing) : store.getSettings();
  const psn = body.psn ? store.updatePsn(body.psn) : store.getPsn();
  if (body.sources) store.setSources(body.sources);
  sendJson(res, 200, { pricing, psn, sources: store.getSources() });
});
route("GET", "/platforms", async (_req, res) => {
  sendJson(res, 200, { labels: PLATFORM_LABELS, regions: PLATFORM_REGIONS });
});
route("POST", "/mock/clear", async (_req, res) => {
  const games = store.listGames();
  for (const g of games) {
    store.upsertGame({ ...g, active: false });
  }
  for (const g of games) store.patchGame(g.id, { active: false });
  sendJson(res, 200, { cleared: games.length });
});
function recomputeMatches() {
  const games = store.listGames().filter((g) => g.active);
  const products = store.getAllCompetitorProducts();
  const matches = matchGames(games, products);
  store.setCompetitorMatches(matches);
}
route("GET", "/competitors", async (_req, res) => {
  const competitors = store.getCompetitors();
  const refreshedAt = store.getCompetitorRefreshedAt();
  sendJson(res, 200, {
    competitors: competitors.map((c) => ({
      ...c,
      refreshedAt: refreshedAt[c.key] ?? null,
      productCount: store.getAllCompetitorProducts(false).filter((p) => p.storeKey === c.key).length
    }))
  });
});
route("PUT", "/competitors", async (req, res) => {
  const body = await readBody(req);
  if (!Array.isArray(body.competitors)) {
    return sendJson(res, 400, { error: "bad_request", message: "competitors[] required" });
  }
  const clean = body.competitors.filter((c) => c && typeof c.key === "string" && typeof c.domain === "string").map((c) => ({
    key: c.key.trim(),
    label: (c.label || c.key).trim(),
    domain: c.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim(),
    type: ["shopify", "woocommerce", "html", "auto"].includes(c.type) ? c.type : "auto",
    enabled: c.enabled !== false
  }));
  store.setCompetitors(clean);
  recomputeMatches();
  sendJson(res, 200, { competitors: store.getCompetitors() });
});
route("POST", "/competitors/refresh", async (_req, res) => {
  const competitors = store.getCompetitors().filter((c) => c.enabled);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const results = [];
  await Promise.all(
    competitors.map(async (c) => {
      try {
        const products = await fetchCompetitor(c);
        store.setCompetitorProducts(c.key, products, now);
        results.push({ key: c.key, label: c.label, count: products.length });
      } catch (e) {
        const msg = e instanceof CompetitorFetchError ? e.message : e.message || "error";
        results.push({ key: c.key, label: c.label, count: 0, error: msg });
      }
    })
  );
  recomputeMatches();
  sendJson(res, 200, { refreshedAt: now, results });
});
route("GET", "/debug/product-types", async (_req, res) => {
  try {
    const cfg = store.getPsn();
    const report = await inspectProductTypes(cfg);
    sendJson(res, 200, report);
  } catch (e) {
    if (e instanceof PsnApiError) {
      return sendJson(res, 502, {
        error: "psn_api_error",
        message: e.message
      });
    }
    sendJson(res, 500, { error: "internal", message: e.message });
  }
});
route("GET", "/games/:id/detail", async (_req, res, params) => {
  const detail = store.getProductDetail(params.id);
  if (!detail) {
    res.statusCode = 204;
    res.end();
    return;
  }
  sendJson(res, 200, detail);
});
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
    store.setProductDetail(game.id, detail);
    sendJson(res, 200, detail);
  } catch (e) {
    if (e instanceof PsnApiError) {
      return sendJson(res, 502, {
        error: "psn_api_error",
        message: e.message
      });
    }
    sendJson(res, 500, { error: "internal", message: e.message });
  }
});
route("GET", "/watchlist", async (_req, res) => {
  sendJson(res, 200, { items: store.listWatchlist() });
});
route("POST", "/watchlist", async (req, res) => {
  const body = await readBody(req);
  const id = extractPsnId(body.input ?? "");
  if (!id) {
    return sendJson(res, 400, {
      error: "bad_input",
      message: "Peg\xE1 la URL del producto en PSN o un ID tipo UPXXXX-CUSAXXXXX_00-\u2026"
    });
  }
  const existing = store.getWatched(id);
  if (existing) return sendJson(res, 200, existing);
  const game = store.getGame(id);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const entry = {
    id,
    name: game?.name || id,
    addedAt: now,
    lastStatus: game?.active && game.discountPercent > 0 ? "on_sale" : game ? "off_sale" : "unseen",
    lastSeenOnSaleAt: game?.active && game.discountPercent > 0 ? now : null,
    lastPriceCents: game?.priceDiscountedCents ?? null,
    lastDiscountPercent: game?.discountPercent ?? 0,
    notes: (body.notes ?? "").trim()
  };
  sendJson(res, 201, store.upsertWatched(entry));
});
route("PATCH", "/watchlist/:id", async (req, res, params) => {
  const body = await readBody(req);
  const patch = {};
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  const updated = store.patchWatched(params.id, patch);
  if (!updated) return sendJson(res, 404, { error: "not_found" });
  sendJson(res, 200, updated);
});
route("DELETE", "/watchlist/:id", async (_req, res, params) => {
  const ok = store.removeWatched(params.id);
  if (!ok) return sendJson(res, 404, { error: "not_found" });
  sendJson(res, 200, { removed: true });
});
route("GET", "/games/:id/matches", async (_req, res, params) => {
  const matches = store.getCompetitorMatches(params.id);
  sendJson(res, 200, { matches });
});
async function handleRequest(req, res) {
  const url = new URL(req.url || "/", "http://x");
  const pathname = url.pathname;
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.pattern.exec(pathname);
    if (!m) continue;
    const params = {};
    r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1]));
    return r.handler(req, res, params);
  }
  sendJson(res, 404, { error: "not_found", path: pathname });
}

// server/plugin.ts
function apiPlugin() {
  return {
    name: "apipsn-api",
    configureServer(server) {
      server.middlewares.use(
        "/api",
        (req, res, next) => {
          handleRequest(req, res).catch((err) => {
            console.error("[api] unhandled", err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("content-type", "application/json");
              res.end(
                JSON.stringify({
                  error: "internal_error",
                  message: String(err?.message || err)
                })
              );
            } else {
              res.end();
            }
          });
        }
      );
    }
  };
}

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL3N0b3JlLnRzIiwgInNlcnZlci9wcmljaW5nLnRzIiwgInNlcnZlci9wc24udHMiLCAic2VydmVyL2NvbXBldGl0b3JzLnRzIiwgInNlcnZlci9wc24tcHJvZHVjdC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3R5cGVzLnRzIiwgInNlcnZlci9wcm92aWRlcnMvcHNuLnRzIiwgInNlcnZlci9wcm92aWRlcnMveGJveC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3N0ZWFtLnRzIiwgInNlcnZlci9wcm92aWRlcnMvbmludGVuZG8udHMiLCAic2VydmVyL3Byb3ZpZGVycy9pbmRleC50cyIsICJzZXJ2ZXIvYXBpLnRzIiwgInNlcnZlci9wbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgYXBpUGx1Z2luIH0gZnJvbSBcIi4vc2VydmVyL3BsdWdpblwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpUGx1Z2luKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiOy8qKlxuICogSlNPTi1maWxlIHN0b3JhZ2UuIEF2b2lkcyBuYXRpdmUgZGVwcyAoYmV0dGVyLXNxbGl0ZTMgYnJlYWtzIGluIFdlYkNvbnRhaW5lcnMpLlxuICovXG5pbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ29tcGV0aXRvckNvbmZpZyxcbiAgQ29tcGV0aXRvck1hdGNoLFxuICBDb21wZXRpdG9yUHJvZHVjdCxcbn0gZnJvbSBcIi4vY29tcGV0aXRvcnNcIjtcbmltcG9ydCB0eXBlIHsgUHJvZHVjdERldGFpbCB9IGZyb20gXCIuL3Bzbi1wcm9kdWN0XCI7XG5pbXBvcnQgdHlwZSB7IFBsYXRmb3JtLCBQcm92aWRlclNvdXJjZSB9IGZyb20gXCIuL3Byb3ZpZGVycy90eXBlc1wiO1xuXG4vKiogQSBnYW1lIHRoZSB1c2VyIGlzIHRyYWNraW5nIGV2ZW4gd2hlbiBpdCdzIG5vdCBpbiB0aGUgY3VycmVudCBXZWVrbHkgRGVhbHNcbiAqICBjYXRlZ29yeS4gRXZlcnkgL3JlZnJlc2ggZGlmZnMgdGhlc2UgYWdhaW5zdCB0aGUgc2NyYXBlIGFuZCByZXBvcnRzXG4gKiAgdHJhbnNpdGlvbnMgKG9mZl9zYWxlIFx1MjE5MiBvbl9zYWxlKSBiYWNrIHRvIHRoZSBjbGllbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoZWRHYW1lIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBhZGRlZEF0OiBzdHJpbmc7XG4gIC8qKiBcInVuc2VlblwiID0gbmV2ZXIgZm91bmQgaW4gYW55IHJlZnJlc2ggeWV0LiAqL1xuICBsYXN0U3RhdHVzOiBcInVuc2VlblwiIHwgXCJvbl9zYWxlXCIgfCBcIm9mZl9zYWxlXCI7XG4gIGxhc3RTZWVuT25TYWxlQXQ6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RQcmljZUNlbnRzOiBudW1iZXIgfCBudWxsO1xuICBsYXN0RGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIG5vdGVzOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2FtZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgaW1hZ2VVcmw6IHN0cmluZyB8IG51bGw7XG4gIHN0b3JlVXJsOiBzdHJpbmcgfCBudWxsO1xuICBwbGF0Zm9ybXM6IHN0cmluZztcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgcHJpY2VPcmlnaW5hbENlbnRzOiBudW1iZXIgfCBudWxsO1xuICBwcmljZURpc2NvdW50ZWRDZW50czogbnVtYmVyIHwgbnVsbDtcbiAgZGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIGRpc2NvdW50RW5kQXQ6IHN0cmluZyB8IG51bGw7XG4gIHNlbGVjdGVkOiBib29sZWFuO1xuICBwdWJsaXNoZWQ6IGJvb2xlYW47XG4gIG5vdGVzOiBzdHJpbmc7XG4gIHlvdXR1YmVVcmw6IHN0cmluZztcbiAgYWN0aXZlOiBib29sZWFuO1xuICBmaXJzdFNlZW5BdDogc3RyaW5nO1xuICBsYXN0U2VlbkF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByaWNpbmdTZXR0aW5ncyB7XG4gIHVzZFRvQ2xwOiBudW1iZXI7XG4gIGJybFRvQ2xwOiBudW1iZXI7XG4gIHRyeVRvQ2xwOiBudW1iZXI7XG4gIGpweVRvQ2xwOiBudW1iZXI7XG4gIHB1cmNoYXNlRmVlUGN0OiBudW1iZXI7XG4gIHByaW1hcmlhMU11bHQ6IG51bWJlcjtcbiAgcHJpbWFyaWEyTXVsdDogbnVtYmVyO1xuICBzZWN1bmRhcmlhTXVsdDogbnVtYmVyO1xuICByb3VuZFRvOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHNuQ29uZmlnIHtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGRlYWxzQ2F0ZWdvcnlJZDogc3RyaW5nO1xuICBjYXRlZ29yeUdyaWRIYXNoOiBzdHJpbmc7XG4gIC8qKiBXaGVuIGZhbHNlLCBmaWx0ZXIgb3V0IERMQywgY3VycmVuY3ksIGF2YXRhcnMsIHRoZW1lcywgc3Vic2NyaXB0aW9ucy5cbiAgICogIERlZmF1bHQgZmFsc2UgXHUyMDE0IHdlIGFsbW9zdCBhbHdheXMgd2FudCBqdXN0IHRoZSBwbGF5YWJsZSBnYW1lcy4gKi9cbiAgaW5jbHVkZUFkZE9uczogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIERiU2hhcGUge1xuICBnYW1lczogUmVjb3JkPHN0cmluZywgR2FtZT47XG4gIHNldHRpbmdzOiBQcmljaW5nU2V0dGluZ3M7XG4gIHBzbjogUHNuQ29uZmlnO1xuICBzb3VyY2VzOiBQcm92aWRlclNvdXJjZVtdO1xuICBjb21wZXRpdG9yczogQ29tcGV0aXRvckNvbmZpZ1tdO1xuICBjb21wZXRpdG9yUHJvZHVjdHM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JQcm9kdWN0W10+O1xuICBjb21wZXRpdG9yTWF0Y2hlczogUmVjb3JkPHN0cmluZywgQ29tcGV0aXRvck1hdGNoW10+O1xuICBjb21wZXRpdG9yUmVmcmVzaGVkQXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIHByb2R1Y3REZXRhaWxzOiBSZWNvcmQ8c3RyaW5nLCBQcm9kdWN0RGV0YWlsPjtcbiAgd2F0Y2hsaXN0OiBSZWNvcmQ8c3RyaW5nLCBXYXRjaGVkR2FtZT47XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFByaWNpbmdTZXR0aW5ncyA9IHtcbiAgdXNkVG9DbHA6IDk3MCxcbiAgYnJsVG9DbHA6IDE3MCxcbiAgdHJ5VG9DbHA6IDI4LFxuICBqcHlUb0NscDogNi41LFxuICBwdXJjaGFzZUZlZVBjdDogMC4wNSxcbiAgcHJpbWFyaWExTXVsdDogMS44LFxuICBwcmltYXJpYTJNdWx0OiAxLjYsXG4gIHNlY3VuZGFyaWFNdWx0OiAxLjEsXG4gIHJvdW5kVG86IDUwMCxcbn07XG5cbmNvbnN0IERFRkFVTFRfU09VUkNFUzogUHJvdmlkZXJTb3VyY2VbXSA9IFtcbiAgeyBwbGF0Zm9ybTogXCJwc25cIiwgcmVnaW9uOiBcInVzXCIsIGVuYWJsZWQ6IHRydWUsIGNhdGVnb3J5SWQ6IFwiXCIgfSxcbiAgeyBwbGF0Zm9ybTogXCJwc25cIiwgcmVnaW9uOiBcImJyXCIsIGVuYWJsZWQ6IHRydWUsIGNhdGVnb3J5SWQ6IFwiM2Y3NzI1MDEtZjZmOC00OWI3LWFiYWMtODc0YTg4Y2E0ODk3XCIgfSxcbiAgeyBwbGF0Zm9ybTogXCJ4Ym94XCIsIHJlZ2lvbjogXCJ1c1wiLCBlbmFibGVkOiBmYWxzZSB9LFxuICB7IHBsYXRmb3JtOiBcInhib3hcIiwgcmVnaW9uOiBcImJyXCIsIGVuYWJsZWQ6IGZhbHNlIH0sXG4gIHsgcGxhdGZvcm06IFwieGJveFwiLCByZWdpb246IFwidHJcIiwgZW5hYmxlZDogZmFsc2UgfSxcbiAgeyBwbGF0Zm9ybTogXCJuaW50ZW5kb1wiLCByZWdpb246IFwidXNcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IHBsYXRmb3JtOiBcIm5pbnRlbmRvXCIsIHJlZ2lvbjogXCJqcFwiLCBlbmFibGVkOiBmYWxzZSB9LFxuICB7IHBsYXRmb3JtOiBcInN0ZWFtXCIsIHJlZ2lvbjogXCJ1c1wiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsgcGxhdGZvcm06IFwic3RlYW1cIiwgcmVnaW9uOiBcImJyXCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBwbGF0Zm9ybTogXCJzdGVhbVwiLCByZWdpb246IFwidHJcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuXTtcblxuY29uc3QgREVGQVVMVF9DT01QRVRJVE9SUzogQ29tcGV0aXRvckNvbmZpZ1tdID0gW1xuICB7IGtleTogXCJjam1cIiwgbGFiZWw6IFwiQ0pNIERpZ2l0YWxlc1wiLCBkb21haW46IFwiY2ptZGlnaXRhbGVzLmNsXCIsIHR5cGU6IFwic2hvcGlmeVwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsga2V5OiBcImp1ZWdvc2RpZ2l0YWxlc2NoaWxlXCIsIGxhYmVsOiBcIkp1ZWdvcyBEaWdpdGFsZXMgQ2hpbGVcIiwgZG9tYWluOiBcImp1ZWdvc2RpZ2l0YWxlc2NoaWxlLmNvbVwiLCB0eXBlOiBcImh0bWxcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IGtleTogXCJtalwiLCBsYWJlbDogXCJNSiBEaWdpdGFsZXNcIiwgZG9tYWluOiBcIm1qZGlnaXRhbGVzLmNsXCIsIHR5cGU6IFwic2hvcGlmeVwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsga2V5OiBcImluZmluaXR5XCIsIGxhYmVsOiBcIkluZmluaXR5IEdhbWVzIENoaWxlXCIsIGRvbWFpbjogXCJpbmZpbml0eWdhbWVzY2hpbGUuY2xcIiwgdHlwZTogXCJodG1sXCIsIGVuYWJsZWQ6IHRydWUgfSxcbl07XG5cbmNvbnN0IERFRkFVTFRfUFNOOiBQc25Db25maWcgPSB7XG4gIHJlZ2lvbjogXCJlbi1VU1wiLFxuICAvLyBQbGFjZWhvbGRlciBJRHMgXHUyMDE0IHRoZSB1c2VyIGNvbmZpZ3VyZXMgdGhlIHJlYWwgb25lcyBmcm9tIERldlRvb2xzLlxuICAvLyBQYW5lbCA+IEFqdXN0ZXMgZXhwb25lIGFtYm9zLlxuICBkZWFsc0NhdGVnb3J5SWQ6IFwiM2Y3NzI1MDEtZjZmOC00OWI3LWFiYWMtODc0YTg4Y2E0ODk3XCIsXG4gIC8vIFVudXNlZCBieSB0aGUgSFRNTCBzY3JhcGVyLiBLZXB0IGZvciByZWZlcmVuY2UgaW4gY2FzZSB3ZSBldmVyIGFkZCBhXG4gIC8vIEdyYXBoUUwgZmFsbGJhY2suIEN1cnJlbnQgdmFsdWUgY2FwdHVyZWQgZnJvbSBEZXZUb29scyBvbiAyMDI2LTA0LTEzLlxuICBjYXRlZ29yeUdyaWRIYXNoOlxuICAgIFwiMjU3NzEzNDY2ZmMzMjY0ODUwYWE0NzM0MDlhMjkwODhlM2E0MTE1ZTZlNjllOWZiM2UwNjFjOGRkNWI5ZjVjNlwiLFxuICBpbmNsdWRlQWRkT25zOiBmYWxzZSxcbn07XG5cbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuY29uc3QgREFUQV9GSUxFID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9kYXRhL2FwaXBzbi5qc29uXCIpO1xuXG5mdW5jdGlvbiBlbnN1cmVEaXIoKSB7XG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShEQVRBX0ZJTEUpO1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG59XG5cbmZ1bmN0aW9uIG1pZ3JhdGVHYW1lcyhnYW1lczogUmVjb3JkPHN0cmluZywgR2FtZT4pOiBSZWNvcmQ8c3RyaW5nLCBHYW1lPiB7XG4gIGNvbnN0IG1pZ3JhdGVkOiBSZWNvcmQ8c3RyaW5nLCBHYW1lPiA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIGddIG9mIE9iamVjdC5lbnRyaWVzKGdhbWVzKSkge1xuICAgIGlmICh0eXBlb2YgZy55b3V0dWJlVXJsICE9PSBcInN0cmluZ1wiKSBnLnlvdXR1YmVVcmwgPSBcIlwiO1xuICAgIGlmICghZy5wbGF0Zm9ybSkgZy5wbGF0Zm9ybSA9IFwicHNuXCI7XG4gICAgaWYgKCFnLnJlZ2lvbikgZy5yZWdpb24gPSBcInVzXCI7XG4gICAgaWYgKCFnLmN1cnJlbmN5KSBnLmN1cnJlbmN5ID0gXCJVU0RcIjtcbiAgICAvLyBSZS1rZXkgb2xkIFBTTiBlbnRyaWVzIHRvIGNvbXBvc2l0ZSBrZXlcbiAgICBjb25zdCBjb21wb3NpdGVLZXkgPSBgJHtnLnBsYXRmb3JtfToke2cucmVnaW9ufToke2cuaWR9YDtcbiAgICBpZiAoa2V5ID09PSBnLmlkICYmIGtleSAhPT0gY29tcG9zaXRlS2V5KSB7XG4gICAgICBtaWdyYXRlZFtjb21wb3NpdGVLZXldID0gZztcbiAgICB9IGVsc2Uge1xuICAgICAgbWlncmF0ZWRba2V5XSA9IGc7XG4gICAgfVxuICB9XG4gIHJldHVybiBtaWdyYXRlZDtcbn1cblxuZnVuY3Rpb24gbWlncmF0ZVNvdXJjZXMoXG4gIHNvdXJjZXM6IFByb3ZpZGVyU291cmNlW10gfCB1bmRlZmluZWQsXG4gIHBzbjogUHNuQ29uZmlnXG4pOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBzb3VyY2VzICYmIHNvdXJjZXMubGVuZ3RoID4gMCA/IFsuLi5zb3VyY2VzXSA6IFtdO1xuICBjb25zdCBleGlzdGluZ0tleXMgPSBuZXcgU2V0KGV4aXN0aW5nLm1hcCgocykgPT4gYCR7cy5wbGF0Zm9ybX06JHtzLnJlZ2lvbn1gKSk7XG5cbiAgLy8gQWx3YXlzIG1lcmdlIG1pc3Npbmcgc291cmNlcyBmcm9tIGRlZmF1bHRzXG4gIGZvciAoY29uc3QgZGVmIG9mIERFRkFVTFRfU09VUkNFUykge1xuICAgIGNvbnN0IGtleSA9IGAke2RlZi5wbGF0Zm9ybX06JHtkZWYucmVnaW9ufWA7XG4gICAgaWYgKCFleGlzdGluZ0tleXMuaGFzKGtleSkpIHtcbiAgICAgIGV4aXN0aW5nLnB1c2goeyAuLi5kZWYgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2Fycnkgb3ZlciBleGlzdGluZyBQU04gY2F0ZWdvcnkgSUQgaWYgc291cmNlcyB3ZXJlIGVtcHR5XG4gIGlmICgoIXNvdXJjZXMgfHwgc291cmNlcy5sZW5ndGggPT09IDApICYmIHBzbi5kZWFsc0NhdGVnb3J5SWQpIHtcbiAgICBjb25zdCBwc25VcyA9IGV4aXN0aW5nLmZpbmQoKHMpID0+IHMucGxhdGZvcm0gPT09IFwicHNuXCIgJiYgcy5yZWdpb24gPT09IFwidXNcIik7XG4gICAgaWYgKHBzblVzICYmICFwc25Vcy5jYXRlZ29yeUlkKSB7XG4gICAgICBwc25Vcy5jYXRlZ29yeUlkID0gcHNuLmRlYWxzQ2F0ZWdvcnlJZDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZXhpc3Rpbmc7XG59XG5cbmZ1bmN0aW9uIGxvYWQoKTogRGJTaGFwZSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmF3ID0gZnMucmVhZEZpbGVTeW5jKERBVEFfRklMRSwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdykgYXMgUGFydGlhbDxEYlNoYXBlPjtcbiAgICBjb25zdCBwc24gPSB7IC4uLkRFRkFVTFRfUFNOLCAuLi4ocGFyc2VkLnBzbiA/PyB7fSkgfTtcbiAgICBjb25zdCBnYW1lcyA9IG1pZ3JhdGVHYW1lcyhwYXJzZWQuZ2FtZXMgPz8ge30pO1xuICAgIHJldHVybiB7XG4gICAgICBnYW1lcyxcbiAgICAgIHNldHRpbmdzOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MsIC4uLihwYXJzZWQuc2V0dGluZ3MgPz8ge30pIH0sXG4gICAgICBwc24sXG4gICAgICBzb3VyY2VzOiBtaWdyYXRlU291cmNlcyhwYXJzZWQuc291cmNlcywgcHNuKSxcbiAgICAgIGNvbXBldGl0b3JzOiBwYXJzZWQuY29tcGV0aXRvcnMgPz8gWy4uLkRFRkFVTFRfQ09NUEVUSVRPUlNdLFxuICAgICAgY29tcGV0aXRvclByb2R1Y3RzOiBwYXJzZWQuY29tcGV0aXRvclByb2R1Y3RzID8/IHt9LFxuICAgICAgY29tcGV0aXRvck1hdGNoZXM6IHBhcnNlZC5jb21wZXRpdG9yTWF0Y2hlcyA/PyB7fSxcbiAgICAgIGNvbXBldGl0b3JSZWZyZXNoZWRBdDogcGFyc2VkLmNvbXBldGl0b3JSZWZyZXNoZWRBdCA/PyB7fSxcbiAgICAgIHByb2R1Y3REZXRhaWxzOiBwYXJzZWQucHJvZHVjdERldGFpbHMgPz8ge30sXG4gICAgICB3YXRjaGxpc3Q6IHBhcnNlZC53YXRjaGxpc3QgPz8ge30sXG4gICAgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdhbWVzOiB7fSxcbiAgICAgIHNldHRpbmdzOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MgfSxcbiAgICAgIHBzbjogeyAuLi5ERUZBVUxUX1BTTiB9LFxuICAgICAgc291cmNlczogWy4uLkRFRkFVTFRfU09VUkNFU10sXG4gICAgICBjb21wZXRpdG9yczogWy4uLkRFRkFVTFRfQ09NUEVUSVRPUlNdLFxuICAgICAgY29tcGV0aXRvclByb2R1Y3RzOiB7fSxcbiAgICAgIGNvbXBldGl0b3JNYXRjaGVzOiB7fSxcbiAgICAgIGNvbXBldGl0b3JSZWZyZXNoZWRBdDoge30sXG4gICAgICBwcm9kdWN0RGV0YWlsczoge30sXG4gICAgICB3YXRjaGxpc3Q6IHt9LFxuICAgIH07XG4gIH1cbn1cblxubGV0IGRiOiBEYlNoYXBlID0gbG9hZCgpO1xubGV0IHNhdmVUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcblxuLy8gUGVyc2lzdCBtaWdyYXRlZCBkYXRhIG9uIGZpcnN0IGxvYWQgc28gbmV3IHNvdXJjZXMvZmllbGRzIGFyZSBzYXZlZFxudHJ5IHsgZW5zdXJlRGlyKCk7IGZzLndyaXRlRmlsZVN5bmMoREFUQV9GSUxFLCBKU09OLnN0cmluZ2lmeShkYiwgbnVsbCwgMikpOyB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cblxuZnVuY3Rpb24gcGVyc2lzdCgpIHtcbiAgZW5zdXJlRGlyKCk7XG4gIGZzLndyaXRlRmlsZVN5bmMoREFUQV9GSUxFLCBKU09OLnN0cmluZ2lmeShkYiwgbnVsbCwgMikpO1xufVxuXG5mdW5jdGlvbiBzY2hlZHVsZVNhdmUoKSB7XG4gIGlmIChzYXZlVGltZXIpIGNsZWFyVGltZW91dChzYXZlVGltZXIpO1xuICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0KHBlcnNpc3QsIDE1MCk7XG59XG5cbmZ1bmN0aW9uIGdhbWVLZXkocGxhdGZvcm06IFBsYXRmb3JtLCByZWdpb246IHN0cmluZywgaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwbGF0Zm9ybX06JHtyZWdpb259OiR7aWR9YDtcbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0ge1xuICBsaXN0R2FtZXMoKTogR2FtZVtdIHtcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhkYi5nYW1lcyk7XG4gIH0sXG4gIGdldEdhbWUoaWQ6IHN0cmluZyk6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5nYW1lc1tpZF07XG4gIH0sXG4gIGdldEdhbWVCeUNvbXBvc2l0ZShwbGF0Zm9ybTogUGxhdGZvcm0sIHJlZ2lvbjogc3RyaW5nLCBpZDogc3RyaW5nKTogR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGRiLmdhbWVzW2dhbWVLZXkocGxhdGZvcm0sIHJlZ2lvbiwgaWQpXTtcbiAgfSxcbiAgdXBzZXJ0R2FtZShnYW1lOiBHYW1lKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ID0gZ2FtZUtleShnYW1lLnBsYXRmb3JtLCBnYW1lLnJlZ2lvbiwgZ2FtZS5pZCk7XG4gICAgZGIuZ2FtZXNba2V5XSA9IGdhbWU7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gIH0sXG4gIHBhdGNoR2FtZShpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxHYW1lPik6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZGIuZ2FtZXNbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogR2FtZSA9IHsgLi4uZXhpc3RpbmcsIC4uLnBhdGNoLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9O1xuICAgIGRiLmdhbWVzW2lkXSA9IHVwZGF0ZWQ7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHVwZGF0ZWQ7XG4gIH0sXG4gIG1hcmtJbmFjdGl2ZUlmTWlzc2luZyhzZWVuS2V5czogU2V0PHN0cmluZz4sIHBsYXRmb3JtPzogUGxhdGZvcm0sIHJlZ2lvbj86IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGddIG9mIE9iamVjdC5lbnRyaWVzKGRiLmdhbWVzKSkge1xuICAgICAgaWYgKCFnLmFjdGl2ZSkgY29udGludWU7XG4gICAgICBpZiAocGxhdGZvcm0gJiYgZy5wbGF0Zm9ybSAhPT0gcGxhdGZvcm0pIGNvbnRpbnVlO1xuICAgICAgaWYgKHJlZ2lvbiAmJiBnLnJlZ2lvbiAhPT0gcmVnaW9uKSBjb250aW51ZTtcbiAgICAgIGlmICghc2VlbktleXMuaGFzKGtleSkpIHtcbiAgICAgICAgZy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgZy51cGRhdGVkQXQgPSBub3c7XG4gICAgICAgIG4rKztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG4gPiAwKSBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gbjtcbiAgfSxcbiAgZ2V0U2V0dGluZ3MoKTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICByZXR1cm4geyAuLi5kYi5zZXR0aW5ncyB9O1xuICB9LFxuICB1cGRhdGVTZXR0aW5ncyhwYXRjaDogUGFydGlhbDxQcmljaW5nU2V0dGluZ3M+KTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICBkYi5zZXR0aW5ncyA9IHsgLi4uZGIuc2V0dGluZ3MsIC4uLnBhdGNoIH07XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHsgLi4uZGIuc2V0dGluZ3MgfTtcbiAgfSxcbiAgZ2V0UHNuKCk6IFBzbkNvbmZpZyB7XG4gICAgcmV0dXJuIHsgLi4uZGIucHNuIH07XG4gIH0sXG4gIHVwZGF0ZVBzbihwYXRjaDogUGFydGlhbDxQc25Db25maWc+KTogUHNuQ29uZmlnIHtcbiAgICBkYi5wc24gPSB7IC4uLmRiLnBzbiwgLi4ucGF0Y2ggfTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4geyAuLi5kYi5wc24gfTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvcnMoKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvcnMobGlzdDogQ29tcGV0aXRvckNvbmZpZ1tdKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICBkYi5jb21wZXRpdG9ycyA9IGxpc3QubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvclByb2R1Y3RzKGtleTogc3RyaW5nLCBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSwgcmVmcmVzaGVkQXQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JQcm9kdWN0c1trZXldID0gcHJvZHVjdHM7XG4gICAgZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0W2tleV0gPSByZWZyZXNoZWRBdDtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGVuYWJsZWRPbmx5ID0gdHJ1ZSk6IENvbXBldGl0b3JQcm9kdWN0W10ge1xuICAgIGNvbnN0IGVuYWJsZWQgPSBuZXcgU2V0KFxuICAgICAgZGIuY29tcGV0aXRvcnMuZmlsdGVyKChjKSA9PiAhZW5hYmxlZE9ubHkgfHwgYy5lbmFibGVkKS5tYXAoKGMpID0+IGMua2V5KVxuICAgICk7XG4gICAgY29uc3Qgb3V0OiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCBsaXN0XSBvZiBPYmplY3QuZW50cmllcyhkYi5jb21wZXRpdG9yUHJvZHVjdHMpKSB7XG4gICAgICBpZiAoIWVuYWJsZWQuaGFzKGtleSkpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBwIG9mIGxpc3QpIG91dC5wdXNoKHApO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9LFxuICBnZXRDb21wZXRpdG9yUmVmcmVzaGVkQXQoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gICAgcmV0dXJuIHsgLi4uZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0IH07XG4gIH0sXG4gIHNldENvbXBldGl0b3JNYXRjaGVzKG1hdGNoZXM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPik6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JNYXRjaGVzID0gbWF0Y2hlcztcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvck1hdGNoZXMoZ2FtZUlkOiBzdHJpbmcpOiBDb21wZXRpdG9yTWF0Y2hbXSB7XG4gICAgcmV0dXJuIGRiLmNvbXBldGl0b3JNYXRjaGVzW2dhbWVJZF0gPz8gW107XG4gIH0sXG4gIGdldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZyk6IFByb2R1Y3REZXRhaWwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5wcm9kdWN0RGV0YWlsc1tpZF07XG4gIH0sXG4gIHNldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZywgZGV0YWlsOiBQcm9kdWN0RGV0YWlsKTogdm9pZCB7XG4gICAgZGIucHJvZHVjdERldGFpbHNbaWRdID0gZGV0YWlsO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICB9LFxuICBsaXN0V2F0Y2hsaXN0KCk6IFdhdGNoZWRHYW1lW10ge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKGRiLndhdGNobGlzdCk7XG4gIH0sXG4gIGdldFdhdGNoZWQoaWQ6IHN0cmluZyk6IFdhdGNoZWRHYW1lIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gZGIud2F0Y2hsaXN0W2lkXTtcbiAgfSxcbiAgdXBzZXJ0V2F0Y2hlZChlbnRyeTogV2F0Y2hlZEdhbWUpOiBXYXRjaGVkR2FtZSB7XG4gICAgZGIud2F0Y2hsaXN0W2VudHJ5LmlkXSA9IGVudHJ5O1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB7IC4uLmVudHJ5IH07XG4gIH0sXG4gIHBhdGNoV2F0Y2hlZChpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxXYXRjaGVkR2FtZT4pOiBXYXRjaGVkR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBkYi53YXRjaGxpc3RbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogV2F0Y2hlZEdhbWUgPSB7IC4uLmV4aXN0aW5nLCAuLi5wYXRjaCB9O1xuICAgIGRiLndhdGNobGlzdFtpZF0gPSB1cGRhdGVkO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB1cGRhdGVkO1xuICB9LFxuICByZW1vdmVXYXRjaGVkKGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWRiLndhdGNobGlzdFtpZF0pIHJldHVybiBmYWxzZTtcbiAgICBkZWxldGUgZGIud2F0Y2hsaXN0W2lkXTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgZ2V0U291cmNlcygpOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICByZXR1cm4gZGIuc291cmNlcy5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICB9LFxuICBzZXRTb3VyY2VzKGxpc3Q6IFByb3ZpZGVyU291cmNlW10pOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICBkYi5zb3VyY2VzID0gbGlzdC5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiBkYi5zb3VyY2VzLm1hcCgocykgPT4gKHsgLi4ucyB9KSk7XG4gIH0sXG4gIGZsdXNoKCk6IHZvaWQge1xuICAgIGlmIChzYXZlVGltZXIpIGNsZWFyVGltZW91dChzYXZlVGltZXIpO1xuICAgIHBlcnNpc3QoKTtcbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcmljaW5nLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3ByaWNpbmcudHNcIjtpbXBvcnQgdHlwZSB7IFByaWNpbmdTZXR0aW5ncyB9IGZyb20gXCIuL3N0b3JlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2FsZVByaWNlcyB7XG4gIGNvc3RDbHA6IG51bWJlcjtcbiAgcHJpbWFyaWExOiBudW1iZXI7XG4gIHByaW1hcmlhMjogbnVtYmVyO1xuICBzZWN1bmRhcmlhOiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHJvdW5kVG8odmFsdWU6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgaWYgKHN0ZXAgPD0gMCkgcmV0dXJuIE1hdGgucm91bmQodmFsdWUpO1xuICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAvIHN0ZXApICogc3RlcDtcbn1cblxuZnVuY3Rpb24gZXhjaGFuZ2VSYXRlKGN1cnJlbmN5OiBzdHJpbmcsIGNmZzogUHJpY2luZ1NldHRpbmdzKTogbnVtYmVyIHtcbiAgc3dpdGNoIChjdXJyZW5jeSkge1xuICAgIGNhc2UgXCJCUkxcIjpcbiAgICAgIHJldHVybiBjZmcuYnJsVG9DbHA7XG4gICAgY2FzZSBcIlRSWVwiOlxuICAgICAgcmV0dXJuIGNmZy50cnlUb0NscDtcbiAgICBjYXNlIFwiSlBZXCI6XG4gICAgICByZXR1cm4gY2ZnLmpweVRvQ2xwO1xuICAgIGNhc2UgXCJVU0RcIjpcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGNmZy51c2RUb0NscDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVNhbGVQcmljZXMoXG4gIHByaWNlQ2VudHM6IG51bWJlciB8IG51bGwsXG4gIGNmZzogUHJpY2luZ1NldHRpbmdzLFxuICBjdXJyZW5jeSA9IFwiVVNEXCJcbik6IFNhbGVQcmljZXMgfCBudWxsIHtcbiAgaWYgKHByaWNlQ2VudHMgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHByaWNlID0gcHJpY2VDZW50cyAvIDEwMDtcbiAgY29uc3QgcmF0ZSA9IGV4Y2hhbmdlUmF0ZShjdXJyZW5jeSwgY2ZnKTtcbiAgY29uc3QgY29zdCA9IHByaWNlICogcmF0ZSAqICgxICsgY2ZnLnB1cmNoYXNlRmVlUGN0KTtcbiAgcmV0dXJuIHtcbiAgICBjb3N0Q2xwOiByb3VuZFRvKGNvc3QsIGNmZy5yb3VuZFRvKSxcbiAgICBwcmltYXJpYTE6IHJvdW5kVG8oY29zdCAqIGNmZy5wcmltYXJpYTFNdWx0LCBjZmcucm91bmRUbyksXG4gICAgcHJpbWFyaWEyOiByb3VuZFRvKGNvc3QgKiBjZmcucHJpbWFyaWEyTXVsdCwgY2ZnLnJvdW5kVG8pLFxuICAgIHNlY3VuZGFyaWE6IHJvdW5kVG8oY29zdCAqIGNmZy5zZWN1bmRhcmlhTXVsdCwgY2ZnLnJvdW5kVG8pLFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHNuLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi50c1wiOy8qKlxuICogUFNOIFN0b3JlIHNjcmFwZXIuXG4gKlxuICogUFNOIG5vdyBzZXJ2ZXItc2lkZS1yZW5kZXJzIHRoZSBjYXRlZ29yeSBwYWdlcyAoTmV4dC5qcykuIFRoZSBwcm9kdWN0IGdyaWRcbiAqIGlzIGVtYmVkZGVkIGFzIEpTT04gaW5zaWRlIGEgYDxzY3JpcHQgaWQ9XCJfX05FWFRfREFUQV9fXCI+YCB0YWcgXHUyMDE0IHdlIGZldGNoXG4gKiB0aGUgSFRNTCBhbmQgcGFyc2UgdGhhdCBibG9iIGluc3RlYWQgb2YgaGl0dGluZyB0aGUgR3JhcGhRTCBlbmRwb2ludCB3aXRoXG4gKiBwZXJzaXN0ZWQgcXVlcmllcy4gTm8gc2hhMjU2IGhhc2hlcyB0byBrZWVwIHVwIHRvIGRhdGUuXG4gKlxuICogICBHRVQgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vPHJlZ2lvbj4vY2F0ZWdvcnkvPGNhdGVnb3J5SWQ+LzxwYWdlPlxuICpcbiAqIFdlIHBhZ2luYXRlIGJ5IHdhbGtpbmcgLzEsIC8yLCAvMyB1bnRpbCBhIHBhZ2UgcmV0dXJucyBubyBuZXcgcHJvZHVjdHMuXG4gKi9cbmltcG9ydCB0eXBlIHsgR2FtZSwgUHNuQ29uZmlnIH0gZnJvbSBcIi4vc3RvcmVcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuLyoqIEtlcHQgZm9yIEFQSSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIG9sZCBjbGllbnQ7IG5vIGxvbmdlciB0aHJvd24uICovXG5leHBvcnQgY2xhc3MgUGVyc2lzdGVkUXVlcnlOb3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIlBTTiBwZXJzaXN0ZWQgcXVlcnkgaGFzaCBpcyBzdGFsZS5cIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBzbkFwaUVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuLyoqIEVudW0gdmFsdWVzIFBTTiB1c2VzIGZvciByZWFsIGdhbWVzIChub3QgRExDIC8gY3VycmVuY3kgLyB0aGVtZXMgL1xuICogIGF2YXRhcnMgLyBzdWJzY3JpcHRpb25zKS4gYHN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uYCBpcyB0aGUgc3RhYmxlXG4gKiAgbm9uLWxvY2FsaXplZCBmaWVsZDsgd2UgYWxzbyBhY2NlcHQgdGhlIGh1bWFuIHN0cmluZ3MgYXMgZmFsbGJhY2suXG4gKiAgQ29uZmlybWVkIGFnYWluc3QgbGl2ZSBlbi1VUyBjYXRhbG9nIG9uIDIwMjYtMDQtMTMuICovXG5jb25zdCBHQU1FX0VOVU0gPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZVTExfR0FNRVwiLFxuICBcIkdBTUVfQlVORExFXCIsXG4gIFwiUFJFTUlVTV9FRElUSU9OXCIsXG4gIFwiQlVORExFXCIsXG5dKTtcblxuY29uc3QgR0FNRV9MQUJFTFMgPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZ1bGwgR2FtZVwiLFxuICBcIkdhbWUgQnVuZGxlXCIsXG4gIFwiUHJlbWl1bSBFZGl0aW9uXCIsXG4gIFwiQnVuZGxlXCIsXG5dKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVsbEdhbWVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCk6IGJvb2xlYW4ge1xuICBjb25zdCBlID0gU3RyaW5nKHJhdy5zdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbiB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICBpZiAoZSAmJiBHQU1FX0VOVU0uaGFzKGUpKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgbCA9IFN0cmluZyhyYXcubG9jYWxpemVkU3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHwgXCJcIikudHJpbSgpO1xuICByZXR1cm4gR0FNRV9MQUJFTFMuaGFzKGwpO1xufVxuXG5mdW5jdGlvbiBwcmljZVRvQ2VudHModjogdW5rbm93bik6IG51bWJlciB8IG51bGwge1xuICBpZiAodiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcyA9IFN0cmluZyh2KS50cmltKCk7XG4gIGlmICghcyB8fCAvXmZyZWUkL2kudGVzdChzKSB8fCAvXmdyYXRpcyQvaS50ZXN0KHMpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2xlYW5lZCA9IHMucmVwbGFjZSgvW14wLTkuLC1dL2csIFwiXCIpLnJlcGxhY2UoLywvZywgXCIuXCIpO1xuICBjb25zdCBwYXJ0cyA9IGNsZWFuZWQuc3BsaXQoXCIuXCIpO1xuICBjb25zdCBub3JtID1cbiAgICBwYXJ0cy5sZW5ndGggPiAyID8gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4oXCJcIikgKyBcIi5cIiArIHBhcnRzLmF0KC0xKSA6IGNsZWFuZWQ7XG4gIGNvbnN0IG4gPSBOdW1iZXIobm9ybSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIE1hdGgucm91bmQobiAqIDEwMCk7XG59XG5cbmludGVyZmFjZSBSYXdQcm9kdWN0IHtcbiAgaWQ/OiBzdHJpbmc7XG4gIHByb2R1Y3RJZD86IHN0cmluZztcbiAgY29uY2VwdElkPzogc3RyaW5nO1xuICBuYW1lPzogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbiAgcGxhdGZvcm1zPzogc3RyaW5nW10gfCBzdHJpbmc7XG4gIC8qKiBQU04gY2xhc3NpZmllcyBpdGVtcyBoZXJlOiBcIkZ1bGwgR2FtZVwiLCBcIkFkZC1PblwiLCBcIkdhbWUgQnVuZGxlXCIsXG4gICAqICBcIkN1cnJlbmN5XCIsIFwiQXZhdGFyXCIsIFwiVGhlbWVcIiwgXCJQUyBQbHVzIFx1MDBCNyBGdWxsIEdhbWVcIiwgZXRjLiAqL1xuICBsb2NhbGl6ZWRTdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcbiAgc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24/OiBzdHJpbmc7XG4gIC8qKiBFbnVtLWlzaDogR0FNRSAvIEJVTkRMRSAvIEFERE9OIC8gQ1VSUkVOQ1kgLyBUSEVNRSAvIEFQUCAvIFNVQlNDUklQVElPTi4gKi9cbiAgcHJvZHVjdFR5cGU/OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIG1lZGlhPzogQXJyYXk8eyByb2xlPzogc3RyaW5nOyB1cmw/OiBzdHJpbmc7IHR5cGU/OiBzdHJpbmcgfT4gfCBudWxsO1xuICB3ZWJjdGFzPzogQXJyYXk8e1xuICAgIHByaWNlPzoge1xuICAgICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgICBiYXNlUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkVmFsdWU/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudFRleHQ/OiBzdHJpbmc7XG4gICAgICBlbmRUaW1lPzogc3RyaW5nO1xuICAgIH07XG4gIH0+IHwgbnVsbDtcbiAgcHJpY2U/OiB7XG4gICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgYmFzZVByaWNlPzogc3RyaW5nO1xuICAgIGRpc2NvdW50ZWRWYWx1ZT86IHN0cmluZztcbiAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgZGlzY291bnRUZXh0Pzogc3RyaW5nO1xuICAgIGVuZFRpbWU/OiBzdHJpbmc7XG4gIH07XG59XG5cbi8qKiBTaGFwZSByZXR1cm5lZCBieSBgaW5zcGVjdFByb2R1Y3RUeXBlc2AgXHUyMDE0IHVzZWQgYnkgdGhlIGRlYnVnIHJvdXRlIHRvXG4gKiAgZmlndXJlIG91dCB0aGUgcmVhbCBjbGFzc2lmaWNhdGlvbiBmaWVsZCBuYW1lcyBiZWZvcmUgd3JpdGluZyB0aGUgZmlsdGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0VHlwZUluc3BlY3Rpb24ge1xuICB0b3RhbFNlZW46IG51bWJlcjtcbiAgY2xhc3NpZmljYXRpb25zOiBBcnJheTx7XG4gICAgY2xhc3NpZmljYXRpb246IHN0cmluZztcbiAgICBwcm9kdWN0VHlwZTogc3RyaW5nO1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgc2FtcGxlczogc3RyaW5nW107XG4gIH0+O1xuICAvKiogRXZlcnkgdG9wLWxldmVsIGtleSBldmVyIHNlZW4gb24gYSBwcm9kdWN0IG9iamVjdCwgd2l0aCBhbiBleGFtcGxlXG4gICAqICB2YWx1ZSBmcm9tIHRoZSBmaXJzdCBwcm9kdWN0IHRoYXQgaGFkIGl0LiBIZWxwcyBzcG90IGFueSBmaWVsZCBuYW1lXG4gICAqICB2YXJpYXRpb24gd2UgbWlzc2VkLiAqL1xuICBvYnNlcnZlZEtleXM6IEFycmF5PHsga2V5OiBzdHJpbmc7IGV4YW1wbGU6IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3BlY3RQcm9kdWN0VHlwZXMoXG4gIGNmZzogUHNuQ29uZmlnXG4pOiBQcm9taXNlPFByb2R1Y3RUeXBlSW5zcGVjdGlvbj4ge1xuICBjb25zdCBieUNvbWJvID0gbmV3IE1hcDxcbiAgICBzdHJpbmcsXG4gICAgeyBjbGFzc2lmaWNhdGlvbjogc3RyaW5nOyBwcm9kdWN0VHlwZTogc3RyaW5nOyBjb3VudDogbnVtYmVyOyBzYW1wbGVzOiBzdHJpbmdbXSB9XG4gID4oKTtcbiAgY29uc3Qgb2JzZXJ2ZWRLZXlzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgYXdhaXQgKGNvbnN0IHJhdyBvZiBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyhjZmcpKSB7XG4gICAgdG90YWwrKztcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhyYXcpKSB7XG4gICAgICBpZiAob2JzZXJ2ZWRLZXlzLmhhcyhrKSkgY29udGludWU7XG4gICAgICBsZXQgZXhhbXBsZTogc3RyaW5nO1xuICAgICAgaWYgKHYgPT0gbnVsbCkgZXhhbXBsZSA9IFwibnVsbFwiO1xuICAgICAgZWxzZSBpZiAodHlwZW9mIHYgPT09IFwib2JqZWN0XCIpIGV4YW1wbGUgPSBKU09OLnN0cmluZ2lmeSh2KS5zbGljZSgwLCAxMjApO1xuICAgICAgZWxzZSBleGFtcGxlID0gU3RyaW5nKHYpLnNsaWNlKDAsIDEyMCk7XG4gICAgICBvYnNlcnZlZEtleXMuc2V0KGssIGV4YW1wbGUpO1xuICAgIH1cbiAgICBjb25zdCBjbHMgPVxuICAgICAgcmF3LmxvY2FsaXplZFN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uIHx8XG4gICAgICByYXcuc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHxcbiAgICAgIFwiXCI7XG4gICAgY29uc3QgcHQgPSByYXcucHJvZHVjdFR5cGUgfHwgcmF3LnR5cGUgfHwgXCJcIjtcbiAgICBjb25zdCBrZXkgPSBgJHtjbHN9XFx1MDAwMSR7cHR9YDtcbiAgICBjb25zdCBleGlzdGluZyA9IGJ5Q29tYm8uZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICBleGlzdGluZy5jb3VudCsrO1xuICAgICAgaWYgKGV4aXN0aW5nLnNhbXBsZXMubGVuZ3RoIDwgMyAmJiByYXcubmFtZSkgZXhpc3Rpbmcuc2FtcGxlcy5wdXNoKHJhdy5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnlDb21iby5zZXQoa2V5LCB7XG4gICAgICAgIGNsYXNzaWZpY2F0aW9uOiBjbHMsXG4gICAgICAgIHByb2R1Y3RUeXBlOiBwdCxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHNhbXBsZXM6IHJhdy5uYW1lID8gW3Jhdy5uYW1lXSA6IFtdLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY2xhc3NpZmljYXRpb25zID0gWy4uLmJ5Q29tYm8udmFsdWVzKCldLnNvcnQoKGEsIGIpID0+IGIuY291bnQgLSBhLmNvdW50KTtcbiAgY29uc3Qga2V5cyA9IFsuLi5vYnNlcnZlZEtleXMuZW50cmllcygpXVxuICAgIC5zb3J0KChbYV0sIFtiXSkgPT4gYS5sb2NhbGVDb21wYXJlKGIpKVxuICAgIC5tYXAoKFtrZXksIGV4YW1wbGVdKSA9PiAoeyBrZXksIGV4YW1wbGUgfSkpO1xuXG4gIHJldHVybiB7IHRvdGFsU2VlbjogdG90YWwsIGNsYXNzaWZpY2F0aW9ucywgb2JzZXJ2ZWRLZXlzOiBrZXlzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCwgbm93OiBzdHJpbmcpOiBHYW1lIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gcmF3LmlkIHx8IHJhdy5wcm9kdWN0SWQgfHwgcmF3LmNvbmNlcHRJZDtcbiAgaWYgKCFpZCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgbmFtZSA9IHJhdy5uYW1lIHx8IHJhdy50aXRsZSB8fCBcIlwiO1xuICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gIC8vIEltYWdlOiBwcmVmZXIgaGVyby9tYXN0ZXIvYm94YXJ0IGlmIGF2YWlsYWJsZS5cbiAgbGV0IGltYWdlVXJsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgbWVkaWEgPSByYXcubWVkaWEgfHwgW107XG4gIGZvciAoY29uc3QgbSBvZiBtZWRpYSkge1xuICAgIGNvbnN0IHJvbGUgPSBTdHJpbmcobT8ucm9sZSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChcbiAgICAgIFtcIk1BU1RFUlwiLCBcIlBSRVZJRVdfR0FNRV9BUlRcIiwgXCJCT1hBUlRcIiwgXCJHQU1FSFVCX0NPVkVSX0FSVFwiXS5pbmNsdWRlcyhyb2xlKVxuICAgICkge1xuICAgICAgaW1hZ2VVcmwgPSBtLnVybCA/PyBudWxsO1xuICAgICAgaWYgKGltYWdlVXJsKSBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKCFpbWFnZVVybCAmJiBtZWRpYVswXT8udXJsKSBpbWFnZVVybCA9IG1lZGlhWzBdLnVybDtcblxuICBjb25zdCBwbGF0Zm9ybXMgPSBBcnJheS5pc0FycmF5KHJhdy5wbGF0Zm9ybXMpXG4gICAgPyByYXcucGxhdGZvcm1zLmpvaW4oXCIsXCIpXG4gICAgOiByYXcucGxhdGZvcm1zID8/IFwiXCI7XG5cbiAgY29uc3QgcHJpY2UgPSByYXcud2ViY3Rhcz8uWzBdPy5wcmljZSA/PyByYXcucHJpY2UgPz8ge307XG4gIGNvbnN0IHByaWNlT3JpZ2luYWxDZW50cyA9IHByaWNlVG9DZW50cyhwcmljZS5iYXNlUHJpY2VWYWx1ZSA/PyBwcmljZS5iYXNlUHJpY2UpO1xuICBsZXQgcHJpY2VEaXNjb3VudGVkQ2VudHMgPSBwcmljZVRvQ2VudHMoXG4gICAgcHJpY2UuZGlzY291bnRlZFZhbHVlID8/IHByaWNlLmRpc2NvdW50ZWRQcmljZVxuICApO1xuICBpZiAocHJpY2VEaXNjb3VudGVkQ2VudHMgPT0gbnVsbCkgcHJpY2VEaXNjb3VudGVkQ2VudHMgPSBwcmljZU9yaWdpbmFsQ2VudHM7XG5cbiAgbGV0IGRpc2NvdW50UGVyY2VudCA9IDA7XG4gIGNvbnN0IGR0ID0gcHJpY2UuZGlzY291bnRUZXh0IHx8IFwiXCI7XG4gIGNvbnN0IG0gPSAvKFxcZCspLy5leGVjKFN0cmluZyhkdCkpO1xuICBpZiAobSkgZGlzY291bnRQZXJjZW50ID0gcGFyc2VJbnQobVsxXSwgMTApO1xuICBpZiAoXG4gICAgIWRpc2NvdW50UGVyY2VudCAmJlxuICAgIHByaWNlT3JpZ2luYWxDZW50cyAmJlxuICAgIHByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgJiZcbiAgICBwcmljZU9yaWdpbmFsQ2VudHMgPiAwICYmXG4gICAgcHJpY2VEaXNjb3VudGVkQ2VudHMgPCBwcmljZU9yaWdpbmFsQ2VudHNcbiAgKSB7XG4gICAgZGlzY291bnRQZXJjZW50ID0gTWF0aC5yb3VuZChcbiAgICAgICgocHJpY2VPcmlnaW5hbENlbnRzIC0gcHJpY2VEaXNjb3VudGVkQ2VudHMpICogMTAwKSAvIHByaWNlT3JpZ2luYWxDZW50c1xuICAgICk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgIHBsYXRmb3JtOiBcInBzblwiIGFzIGNvbnN0LFxuICAgIHJlZ2lvbjogXCJ1c1wiLFxuICAgIG5hbWUsXG4gICAgaW1hZ2VVcmwsXG4gICAgc3RvcmVVcmw6IGBodHRwczovL3N0b3JlLnBsYXlzdGF0aW9uLmNvbS9lbi11cy9wcm9kdWN0LyR7aWR9YCxcbiAgICBwbGF0Zm9ybXMsXG4gICAgY3VycmVuY3k6IFwiVVNEXCIsXG4gICAgcHJpY2VPcmlnaW5hbENlbnRzLFxuICAgIHByaWNlRGlzY291bnRlZENlbnRzLFxuICAgIGRpc2NvdW50UGVyY2VudCxcbiAgICBkaXNjb3VudEVuZEF0OiBwcmljZS5lbmRUaW1lIHx8IG51bGwsXG4gICAgc2VsZWN0ZWQ6IGZhbHNlLFxuICAgIHB1Ymxpc2hlZDogZmFsc2UsXG4gICAgbm90ZXM6IFwiXCIsXG4gICAgeW91dHViZVVybDogXCJcIixcbiAgICBhY3RpdmU6IHRydWUsXG4gICAgZmlyc3RTZWVuQXQ6IG5vdyxcbiAgICBsYXN0U2VlbkF0OiBub3csXG4gICAgdXBkYXRlZEF0OiBub3csXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSHRtbCh1cmw6IHN0cmluZywgcmVnaW9uOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBsZXQgbGFzdEVycm9yOiB1bmtub3duID0gbnVsbDtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCA0OyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICAgIGFjY2VwdDpcbiAgICAgICAgICAgIFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksKi8qO3E9MC44XCIsXG4gICAgICAgICAgXCJhY2NlcHQtbGFuZ3VhZ2VcIjogcmVnaW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcImVzXCIpID8gXCJlc1wiIDogXCJlbi1VU1wiLFxuICAgICAgICAgIFwieC1wc24tc3RvcmUtbG9jYWxlLW92ZXJyaWRlXCI6IHJlZ2lvbixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgaWYgKHIuc3RhdHVzID09PSA0MDQpIHRocm93IG5ldyBQc25BcGlFcnJvcihgQ2F0ZWdvcnkgbm90IGZvdW5kICg0MDQpOiAke3VybH1gKTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDAzKVxuICAgICAgICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXCJQU04gcmV0dXJuZWQgNDAzIChJUC9DbG91ZGZsYXJlIGJsb2NrKVwiKTtcbiAgICAgIGlmIChyLnN0YXR1cyA+PSA1MDApIHRocm93IG5ldyBFcnJvcihgUFNOICR7ci5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4gYXdhaXQgci50ZXh0KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBQc25BcGlFcnJvcikgdGhyb3cgZTtcbiAgICAgIGxhc3RFcnJvciA9IGU7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNTAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBQc25BcGlFcnJvcihcbiAgICBgUFNOIEhUTUwgZmV0Y2ggZmFpbGVkIGFmdGVyIHJldHJpZXM6ICR7KGxhc3RFcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgfHwgbGFzdEVycm9yfWBcbiAgKTtcbn1cblxuLyoqIEV4dHJhY3QgdGhlIEpTT04gcGF5bG9hZCBmcm9tIGA8c2NyaXB0IGlkPVwiX19ORVhUX0RBVEFfX1wiPlx1MjAyNjwvc2NyaXB0PmAuICovXG5mdW5jdGlvbiBleHRyYWN0TmV4dERhdGEoaHRtbDogc3RyaW5nKTogYW55IHwgbnVsbCB7XG4gIGNvbnN0IG0gPSAvPHNjcmlwdFtePl0qaWQ9W1wiJ11fX05FWFRfREFUQV9fW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi8uZXhlYyhcbiAgICBodG1sXG4gICk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UobVsxXSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgd2FsayBhIEpTT04gdHJlZSBhbmQgY29sbGVjdCBhbnl0aGluZyB0aGF0IGxvb2tzIGxpa2UgYSBQU05cbiAqIHByb2R1Y3QgZW50cnkuIE1hdGNoZXMgb2JqZWN0cyB3aXRoIGFuIGBpZGAvYHByb2R1Y3RJZGAgcGx1cyBlaXRoZXIgYVxuICogYG5hbWVgL2B0aXRsZWAgYW5kIGEgYHByaWNlYC9gd2ViY3Rhc2AuXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RQcm9kdWN0cyhub2RlOiB1bmtub3duLCBvdXQ6IE1hcDxzdHJpbmcsIFJhd1Byb2R1Y3Q+KTogdm9pZCB7XG4gIGlmICghbm9kZSkgcmV0dXJuO1xuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkge1xuICAgIGZvciAoY29uc3QgdiBvZiBub2RlKSBjb2xsZWN0UHJvZHVjdHModiwgb3V0KTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHR5cGVvZiBub2RlICE9PSBcIm9iamVjdFwiKSByZXR1cm47XG4gIGNvbnN0IG9iaiA9IG5vZGUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG5cbiAgY29uc3QgaWQgPSAob2JqLmlkIHx8IG9iai5wcm9kdWN0SWQgfHwgb2JqLmNvbmNlcHRJZCkgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBjb25zdCBuYW1lID0gKG9iai5uYW1lIHx8IG9iai50aXRsZSkgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBjb25zdCBoYXNQcmljZSA9XG4gICAgKG9iai5wcmljZSAmJiB0eXBlb2Ygb2JqLnByaWNlID09PSBcIm9iamVjdFwiKSB8fFxuICAgIChBcnJheS5pc0FycmF5KG9iai53ZWJjdGFzKSAmJiBvYmoud2ViY3Rhcy5sZW5ndGggPiAwKTtcbiAgLy8gUHJvZHVjdCBJRHMgb24gUFNOIGxvb2sgbGlrZSBcIlVQOTAwMC1DVVNBMDc0MDhfMDAtUkVERU1QVElPTjIwMDAwMDBcIlxuICAvLyAoY29udGFpbiBhIGh5cGhlbiArIHVuZGVyc2NvcmUpLiBGaWx0ZXIgb24gdGhhdCB0byBhdm9pZCBwaWNraW5nIHVwXG4gIC8vIGFyYml0cmFyeSBlbnRpdGllcyB3aXRoIGFuIGBpZGAuXG4gIGlmIChcbiAgICBpZCAmJlxuICAgIHR5cGVvZiBpZCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIC9eW0EtWl17Mn1cXGR7NH0tLy50ZXN0KGlkKSAmJlxuICAgIG5hbWUgJiZcbiAgICBoYXNQcmljZSAmJlxuICAgICFvdXQuaGFzKGlkKVxuICApIHtcbiAgICBvdXQuc2V0KGlkLCBvYmogYXMgUmF3UHJvZHVjdCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHYgb2YgT2JqZWN0LnZhbHVlcyhvYmopKSBjb2xsZWN0UHJvZHVjdHModiwgb3V0KTtcbn1cblxuZnVuY3Rpb24gYnVpbGRDYXRlZ29yeVVybChjZmc6IFBzbkNvbmZpZywgcGFnZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgLy8gcmVnaW9uIGxpa2UgXCJlbi1VU1wiIFx1MjE5MiBcImVuLXVzXCJcbiAgY29uc3QgcmVnaW9uUGF0aCA9IGNmZy5yZWdpb24udG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIGBodHRwczovL3N0b3JlLnBsYXlzdGF0aW9uLmNvbS8ke3JlZ2lvblBhdGh9L2NhdGVnb3J5LyR7Y2ZnLmRlYWxzQ2F0ZWdvcnlJZH0vJHtwYWdlfWA7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogaXRlckNhdGVnb3J5UHJvZHVjdHMoXG4gIGNmZzogUHNuQ29uZmlnXG4pOiBBc3luY0dlbmVyYXRvcjxSYXdQcm9kdWN0PiB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWF4UGFnZXMgPSA1MDsgLy8gaGFyZCBzdG9wIHNvIGEgYnVnIGNhbid0IGxvb3AgZm9yZXZlclxuXG4gIGZvciAobGV0IHBhZ2UgPSAxOyBwYWdlIDw9IG1heFBhZ2VzOyBwYWdlKyspIHtcbiAgICBjb25zdCB1cmwgPSBidWlsZENhdGVnb3J5VXJsKGNmZywgcGFnZSk7XG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoSHRtbCh1cmwsIGNmZy5yZWdpb24pO1xuICAgIGNvbnN0IGRhdGEgPSBleHRyYWN0TmV4dERhdGEoaHRtbCk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICBpZiAocGFnZSA9PT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgICAgICAgXCJDb3VsZCBub3QgZmluZCBfX05FWFRfREFUQV9fIGluIFBTTiBIVE1MIFx1MjAxNCBwYWdlIGxheW91dCBtYXkgaGF2ZSBjaGFuZ2VkLlwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgZm91bmQgPSBuZXcgTWFwPHN0cmluZywgUmF3UHJvZHVjdD4oKTtcbiAgICBjb2xsZWN0UHJvZHVjdHMoZGF0YSwgZm91bmQpO1xuXG4gICAgbGV0IG5ld09uVGhpc1BhZ2UgPSAwO1xuICAgIGZvciAoY29uc3QgW2lkLCBwXSBvZiBmb3VuZCkge1xuICAgICAgaWYgKHNlZW4uaGFzKGlkKSkgY29udGludWU7XG4gICAgICBzZWVuLmFkZChpZCk7XG4gICAgICBuZXdPblRoaXNQYWdlKys7XG4gICAgICB5aWVsZCBwO1xuICAgIH1cbiAgICBpZiAobmV3T25UaGlzUGFnZSA9PT0gMCkgYnJlYWs7IC8vIHBhZ2luYXRpb24gZXhoYXVzdGVkXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL2NvbXBldGl0b3JzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL2NvbXBldGl0b3JzLnRzXCI7LyoqXG4gKiBDb21wZXRpdG9yIHNjcmFwZXJzICsgZnV6enkgbWF0Y2hlci5cbiAqXG4gKiBXZSBzdXBwb3J0IHR3byBnZW5lcmljIHN0b3JlZnJvbnQgdHlwZXM6XG4gKiAgIC0gU2hvcGlmeTogICAgIEdFVCBodHRwczovLzxkb21haW4+L3Byb2R1Y3RzLmpzb24/bGltaXQ9MjUwJnBhZ2U9TlxuICogICAtIFdvb0NvbW1lcmNlOiBHRVQgaHR0cHM6Ly88ZG9tYWluPi93cC1qc29uL3djL3N0b3JlL3YxL3Byb2R1Y3RzP3Blcl9wYWdlPTEwMCZwYWdlPU5cbiAqXG4gKiBCb3RoIGV4cG9zZSBwdWJsaWMsIHVuYXV0aGVudGljYXRlZCBKU09OIGZlZWRzLiBBIHRoaXJkIHR5cGUgXCJhdXRvXCIgdHJpZXNcbiAqIFNob3BpZnkgZmlyc3QgYW5kIGZhbGxzIGJhY2sgdG8gV29vQ29tbWVyY2Ugc28gdGhlIHVzZXIgZG9lc24ndCBoYXZlIHRvXG4gKiBndWVzcyB3aGVuIGFkZGluZyBhIG5ldyBzdG9yZS5cbiAqXG4gKiBUaGUgbWF0Y2hlciBub3JtYWxpemVzIHRpdGxlcyAobG93ZXJjYXNlZCwgYWNjZW50LXN0cmlwcGVkLCBub2lzZSB3b3Jkc1xuICogcmVtb3ZlZCkgYW5kIGNvbXBhcmVzIFBTTiBcdTIxOTQgY29tcGV0aXRvciBlbnRyaWVzIHdpdGggSmFjY2FyZCBzaW1pbGFyaXR5LlxuICovXG5pbXBvcnQgdHlwZSB7IEdhbWUgfSBmcm9tIFwiLi9zdG9yZVwiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKGNvbXBhdGlibGU7IGFwaXBzbi8xLjA7IG1hcmtldC1yZXNlYXJjaClcIjtcblxuZXhwb3J0IHR5cGUgQ29tcGV0aXRvclR5cGUgPSBcInNob3BpZnlcIiB8IFwid29vY29tbWVyY2VcIiB8IFwiaHRtbFwiIHwgXCJhdXRvXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGV0aXRvckNvbmZpZyB7XG4gIGtleTogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBkb21haW46IHN0cmluZztcbiAgdHlwZTogQ29tcGV0aXRvclR5cGU7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGV0aXRvclByb2R1Y3Qge1xuICBzdG9yZUtleTogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgcHJpY2VDbHA6IG51bWJlcjtcbiAgYXZhaWxhYmxlOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBldGl0b3JNYXRjaCB7XG4gIHN0b3JlS2V5OiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBwcmljZUNscDogbnVtYmVyO1xuICBhdmFpbGFibGU6IGJvb2xlYW47XG4gIHNjb3JlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wZXRpdG9yRmV0Y2hFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IocHVibGljIHN0b3JlS2V5OiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vcm1hbGl6YXRpb24gKyBzaW1pbGFyaXR5IC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IE5PSVNFID0gbmV3IFNldChbXG4gIFwiZm9yXCIsXCJ0aGVcIixcIm9mXCIsXCJhbmRcIixcIm9yXCIsXCJhXCIsXCJhblwiLFwiZGVcIixcImRlbFwiLFwibGFcIixcImVsXCIsXCJsb3NcIixcImxhc1wiLFxuICBcInBzNFwiLFwicHM1XCIsXCJwczNcIixcInBzdlwiLFwicHNwXCIsXCJ4Ym94XCIsXCJwY1wiLFwic3RlYW1cIixcIm5pbnRlbmRvXCIsXCJzd2l0Y2hcIixcbiAgXCJlZGl0aW9uXCIsXCJlZFwiLFwiZGVsdXhlXCIsXCJnb2xkXCIsXCJzaWx2ZXJcIixcImJyb256ZVwiLFwicGxhdGludW1cIixcInVsdGltYXRlXCIsXG4gIFwiZ290eVwiLFwic3RhbmRhcmRcIixcImRpZ2l0YWxcIixcImN1ZW50YVwiLFwicHJpbWFyaWFcIixcInNlY3VuZGFyaWFcIixcInByaW1hcmlhMVwiLFxuICBcInByaW1hcmlhMlwiLFwiZ2FtZVwiLFwianVlZ29cIixcImp1ZWdvc1wiLFwiYnVuZGxlXCIsXCJwYWNrXCIsXCJzZWFzb25cIixcInBhc3NcIixcbiAgXCJjb2xsZWN0aW9uXCIsXCJjb21wbGV0ZVwiLFwicmVtYXN0ZXJlZFwiLFwicmVtYWtlXCIsXCJoZFwiLFwiZGVmaW5pdGl2ZVwiLFxuICBcImFubml2ZXJzYXJ5XCIsXCJ2ZXJzaW9uXCIsXCJ2ZXJzXCIsXCJ2ZXJcIixcImluY1wiLFwiaW5jbHV5ZVwiLFwicGFja1wiLFxuXSk7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZSh0aXRsZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gdGl0bGVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5ub3JtYWxpemUoXCJORkRcIilcbiAgICAucmVwbGFjZSgvW1xcdTAzMDAtXFx1MDM2Zl0vZywgXCJcIilcbiAgICAucmVwbGFjZSgvW1x1MjEyMlx1MDBBRVx1MDBBOV0vZywgXCJcIilcbiAgICAucmVwbGFjZSgvXFxbW15cXF1dKlxcXS9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvXFwoW14pXSpcXCkvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1teYS16MC05IF0rL2csIFwiIFwiKVxuICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgLmZpbHRlcigodCkgPT4gdCAmJiAhTk9JU0UuaGFzKHQpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNpbWlsYXJpdHkoYTogc3RyaW5nW10sIGI6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgaWYgKCFhLmxlbmd0aCB8fCAhYi5sZW5ndGgpIHJldHVybiAwO1xuICBjb25zdCBzYSA9IG5ldyBTZXQoYSk7XG4gIGNvbnN0IHNiID0gbmV3IFNldChiKTtcbiAgbGV0IGludGVyID0gMDtcbiAgZm9yIChjb25zdCB4IG9mIHNhKSBpZiAoc2IuaGFzKHgpKSBpbnRlcisrO1xuICBpZiAoIWludGVyKSByZXR1cm4gMDtcbiAgY29uc3QgdW5pb24gPSBzYS5zaXplICsgc2Iuc2l6ZSAtIGludGVyO1xuICBjb25zdCBqYWNjYXJkID0gaW50ZXIgLyB1bmlvbjtcbiAgLy8gQ29udGFpbm1lbnQgYm9udXM6IGlmIHRoZSBzbWFsbGVyIHNldCBpcyBmdWxseSBjb250YWluZWQgaW4gdGhlIGxhcmdlcixcbiAgLy8gcmV3YXJkIHRoYXQgKGNvdmVycyBcIlJlZCBEZWFkIFJlZGVtcHRpb24gMlwiIFx1MjI4MiBcIlJlZCBEZWFkIFJlZGVtcHRpb24gMiBQUzRcIikuXG4gIGNvbnN0IG1pblNpemUgPSBNYXRoLm1pbihzYS5zaXplLCBzYi5zaXplKTtcbiAgY29uc3QgY29udGFpbm1lbnQgPSBpbnRlciAvIG1pblNpemU7XG4gIHJldHVybiAwLjYgKiBqYWNjYXJkICsgMC40ICogY29udGFpbm1lbnQ7XG59XG5cbi8qKiBNYXRjaCB0aHJlc2hvbGQgYmVsb3cgd2hpY2ggd2UgaWdub3JlIGEgY2FuZGlkYXRlIHBhaXIuICovXG5leHBvcnQgY29uc3QgTUFUQ0hfVEhSRVNIT0xEID0gMC41NTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gcHJpY2UgcGFyc2luZyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBwYXJzZUNscCh2OiB1bmtub3duKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICh2ID09IG51bGwpIHJldHVybiBudWxsO1xuICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKHYpKSB7XG4gICAgLy8gU2hvcGlmeSBvZnRlbiBnaXZlcyBzdHJpbmdzIGxpa2UgXCIyOTk5MC4wMFwiOyBudW1iZXJzIGFyZSBpbiBtYWpvciB1bml0cy5cbiAgICAvLyBIZXVyaXN0aWM6IHZhbHVlcyA8IDEwMDAgYXJlIHVubGlrZWx5IGZvciBDTFA7IHRyZWF0IGFzLWlzIG90aGVyd2lzZS5cbiAgICByZXR1cm4gTWF0aC5yb3VuZCh2KTtcbiAgfVxuICBjb25zdCBzID0gU3RyaW5nKHYpLnJlcGxhY2UoL1teXFxkLC4tXS9nLCBcIlwiKTtcbiAgaWYgKCFzKSByZXR1cm4gbnVsbDtcbiAgLy8gQ0xQIGhhcyBubyBkZWNpbWFscy4gRG90cyBhbmQgY29tbWFzIGFyZSBhbG1vc3QgYWx3YXlzIHRob3VzYW5kc1xuICAvLyBzZXBhcmF0b3JzIChcIiQ2Ljk5MFwiKS4gVGhlIG9ubHkgZGVjaW1hbC1pc2ggY2FzZSB3ZSBzZWUgaXMgU2hvcGlmeSdzXG4gIC8vIFVTRC1zdHlsZSBcIjc5OTAuMDBcIiAvIFwiNzk5MCwwMFwiIFx1MjAxNCBsYXN0IHNlcGFyYXRvciBmb2xsb3dlZCBieSBleGFjdGx5XG4gIC8vIDIgZGlnaXRzLiBEZXRlY3QgdGhhdCwgZHJvcCB0aGUgZGVjaW1hbCB0YWlsLCBzdHJpcCB0aGUgcmVzdC5cbiAgbGV0IGNsZWFuZWQgPSBzO1xuICBjb25zdCBkZWNpbWFsVGFpbCA9IC9bLixdKFxcZHsyfSkkLy5leGVjKHMpO1xuICBpZiAoZGVjaW1hbFRhaWwpIGNsZWFuZWQgPSBzLnNsaWNlKDAsIC0zKTtcbiAgY2xlYW5lZCA9IGNsZWFuZWQucmVwbGFjZSgvWy4sXS9nLCBcIlwiKTtcbiAgY29uc3QgbiA9IE51bWJlcihjbGVhbmVkKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobikpIHJldHVybiBudWxsO1xuICByZXR1cm4gTWF0aC5yb3VuZChuKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2hvcGlmeSBzY3JhcGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmludGVyZmFjZSBTaG9waWZ5VmFyaWFudCB7XG4gIHByaWNlPzogc3RyaW5nO1xuICBhdmFpbGFibGU/OiBib29sZWFuO1xuICBjb21wYXJlX2F0X3ByaWNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgU2hvcGlmeVByb2R1Y3Qge1xuICBpZDogbnVtYmVyO1xuICB0aXRsZTogc3RyaW5nO1xuICBoYW5kbGU6IHN0cmluZztcbiAgdmFyaWFudHM/OiBTaG9waWZ5VmFyaWFudFtdO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFNob3BpZnkoXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIGRvbWFpbjogc3RyaW5nXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgY29uc3QgcHJvZHVjdHM6IENvbXBldGl0b3JQcm9kdWN0W10gPSBbXTtcbiAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gNDA7IHBhZ2UrKykge1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7ZG9tYWlufS9wcm9kdWN0cy5qc29uP2xpbWl0PTI1MCZwYWdlPSR7cGFnZX1gO1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHsgXCJ1c2VyLWFnZW50XCI6IFVBLCBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgfSk7XG4gICAgaWYgKHIuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIGAke2RvbWFpbn0gbm8gZXhwb25lIC9wcm9kdWN0cy5qc29uIChcdTAwQkZubyBlcyBTaG9waWZ5PylgXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIXIub2spIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIGAke2RvbWFpbn0gSFRUUCAke3Iuc3RhdHVzfSBlbiAvcHJvZHVjdHMuanNvbmBcbiAgICAgICk7XG4gICAgfVxuICAgIGxldCBib2R5OiB7IHByb2R1Y3RzPzogU2hvcGlmeVByb2R1Y3RbXSB9O1xuICAgIHRyeSB7XG4gICAgICBib2R5ID0gKGF3YWl0IHIuanNvbigpKSBhcyB7IHByb2R1Y3RzPzogU2hvcGlmeVByb2R1Y3RbXSB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgYCR7ZG9tYWlufSBkZXZvbHZpXHUwMEYzIGFsZ28gcXVlIG5vIGVzIEpTT04gZW4gL3Byb2R1Y3RzLmpzb25gXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBiYXRjaCA9IGJvZHkucHJvZHVjdHMgPz8gW107XG4gICAgaWYgKCFiYXRjaC5sZW5ndGgpIGJyZWFrO1xuICAgIGZvciAoY29uc3QgcCBvZiBiYXRjaCkge1xuICAgICAgY29uc3QgdmFyaWFudCA9IHAudmFyaWFudHM/LlswXTtcbiAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VDbHAodmFyaWFudD8ucHJpY2UpO1xuICAgICAgaWYgKHByaWNlID09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgcHJvZHVjdHMucHVzaCh7XG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICB0aXRsZTogcC50aXRsZSxcbiAgICAgICAgdXJsOiBgaHR0cHM6Ly8ke2RvbWFpbn0vcHJvZHVjdHMvJHtwLmhhbmRsZX1gLFxuICAgICAgICBwcmljZUNscDogcHJpY2UsXG4gICAgICAgIGF2YWlsYWJsZTogdmFyaWFudD8uYXZhaWxhYmxlICE9PSBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoYmF0Y2gubGVuZ3RoIDwgMjUwKSBicmVhaztcbiAgfVxuICByZXR1cm4gcHJvZHVjdHM7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIFdvb0NvbW1lcmNlIHNjcmFwZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuaW50ZXJmYWNlIFdvb1ByaWNlcyB7XG4gIHByaWNlPzogc3RyaW5nO1xuICByZWd1bGFyX3ByaWNlPzogc3RyaW5nO1xuICBzYWxlX3ByaWNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgV29vUHJvZHVjdCB7XG4gIGlkOiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcGVybWFsaW5rOiBzdHJpbmc7XG4gIHByaWNlcz86IFdvb1ByaWNlcztcbiAgaXNfaW5fc3RvY2s/OiBib29sZWFuO1xuICBpc19wdXJjaGFzYWJsZT86IGJvb2xlYW47XG59XG5cbmNvbnN0IFdPT19FTkRQT0lOVFMgPSBbXG4gIFwiL3dwLWpzb24vd2Mvc3RvcmUvdjEvcHJvZHVjdHNcIixcbiAgXCIvd3AtanNvbi93Yy9zdG9yZS9wcm9kdWN0c1wiLFxuICBcIi8/cmVzdF9yb3V0ZT0vd2Mvc3RvcmUvdjEvcHJvZHVjdHNcIixcbl07XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV29vKFxuICBzdG9yZUtleTogc3RyaW5nLFxuICBkb21haW46IHN0cmluZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGxldCBsYXN0RXJyb3IgPSBcIm5vLWF0dGVtcHRcIjtcbiAgZm9yIChjb25zdCBiYXNlUGF0aCBvZiBXT09fRU5EUE9JTlRTKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBmZXRjaFdvb0F0KHN0b3JlS2V5LCBkb21haW4sIGJhc2VQYXRoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIENvbXBldGl0b3JGZXRjaEVycm9yKSB7XG4gICAgICAgIGxhc3RFcnJvciA9IGUubWVzc2FnZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgc3RvcmVLZXksXG4gICAgYCR7ZG9tYWlufSBubyBleHBvbmUgbmluZ1x1MDBGQW4gZW5kcG9pbnQgV29vQ29tbWVyY2UgY29ub2NpZG8gKCR7bGFzdEVycm9yfSlgXG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV29vQXQoXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIGRvbWFpbjogc3RyaW5nLFxuICBiYXNlUGF0aDogc3RyaW5nXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgY29uc3QgcHJvZHVjdHM6IENvbXBldGl0b3JQcm9kdWN0W10gPSBbXTtcbiAgY29uc3Qgam9pbmVyID0gYmFzZVBhdGguaW5jbHVkZXMoXCI/XCIpID8gXCImXCIgOiBcIj9cIjtcbiAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gNDA7IHBhZ2UrKykge1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7ZG9tYWlufSR7YmFzZVBhdGh9JHtqb2luZXJ9cGVyX3BhZ2U9MTAwJnBhZ2U9JHtwYWdlfWA7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczogeyBcInVzZXItYWdlbnRcIjogVUEsIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICB9KTtcbiAgICBpZiAoci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKHN0b3JlS2V5LCBgJHtiYXNlUGF0aH0gXHUyMTkyIDQwNGApO1xuICAgIH1cbiAgICBpZiAoIXIub2spIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihzdG9yZUtleSwgYCR7YmFzZVBhdGh9IFx1MjE5MiBIVFRQICR7ci5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGxldCBiYXRjaDogV29vUHJvZHVjdFtdO1xuICAgIHRyeSB7XG4gICAgICBiYXRjaCA9IChhd2FpdCByLmpzb24oKSkgYXMgV29vUHJvZHVjdFtdO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKHN0b3JlS2V5LCBgJHtiYXNlUGF0aH0gZGV2b2x2aVx1MDBGMyBuby1KU09OYCk7XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShiYXRjaCkgfHwgIWJhdGNoLmxlbmd0aCkgYnJlYWs7XG4gICAgZm9yIChjb25zdCBwIG9mIGJhdGNoKSB7XG4gICAgICBjb25zdCByYXcgPVxuICAgICAgICBwLnByaWNlcz8uc2FsZV9wcmljZSB8fCBwLnByaWNlcz8ucHJpY2UgfHwgcC5wcmljZXM/LnJlZ3VsYXJfcHJpY2U7XG4gICAgICBsZXQgcHJpY2UgPSBwYXJzZUNscChyYXcpO1xuICAgICAgaWYgKHByaWNlICE9IG51bGwgJiYgcmF3ICYmIC9eXFxkKyQvLnRlc3QoU3RyaW5nKHJhdykpICYmIHByaWNlID4gMV8wMDBfMDAwKSB7XG4gICAgICAgIHByaWNlID0gTWF0aC5yb3VuZChwcmljZSAvIDEwMCk7XG4gICAgICB9XG4gICAgICBpZiAocHJpY2UgPT0gbnVsbCkgY29udGludWU7XG4gICAgICBwcm9kdWN0cy5wdXNoKHtcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIHRpdGxlOiBwLm5hbWUsXG4gICAgICAgIHVybDogcC5wZXJtYWxpbmssXG4gICAgICAgIHByaWNlQ2xwOiBwcmljZSxcbiAgICAgICAgYXZhaWxhYmxlOiBwLmlzX2luX3N0b2NrICE9PSBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoYmF0Y2gubGVuZ3RoIDwgMTAwKSBicmVhaztcbiAgfVxuICBpZiAoIXByb2R1Y3RzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihzdG9yZUtleSwgYCR7YmFzZVBhdGh9IHZhY1x1MDBFRG9gKTtcbiAgfVxuICByZXR1cm4gcHJvZHVjdHM7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIEhUTUwgLyBzaXRlbWFwICsgSlNPTi1MRCBzY3JhcGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IFNJVEVNQVBfQ0FORElEQVRFUyA9IFtcbiAgXCIvcHJvZHVjdC1zaXRlbWFwLnhtbFwiLFxuICBcIi93cC1zaXRlbWFwLXBvc3RzLXByb2R1Y3QtMS54bWxcIixcbiAgXCIvc2l0ZW1hcC1wcm9kdWN0cy54bWxcIixcbiAgXCIvc2l0ZW1hcF9wcm9kdWN0c18xLnhtbFwiLCAvLyBTaG9waWZ5LXN0eWxlLCBidXQgYWxzbyB1c2VkIGJ5IG90aGVyc1xuICBcIi9zaXRlbWFwX2luZGV4LnhtbFwiLFxuICBcIi9zaXRlbWFwLnhtbFwiLFxuXTtcblxuY29uc3QgUFJPRFVDVF9VUkxfSElOVFMgPVxuICAvXFwvKHByb2R1Y3RvfHByb2R1Y3Rvc3xwcm9kdWN0fHByb2R1Y3RzfHRpZW5kYXxzaG9wfGdhbWV8anVlZ298aXRlbSlcXC8vaTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hUZXh0KHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgIGFjY2VwdDogXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gYXdhaXQgci50ZXh0KCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVTaXRlbWFwVXJscyhkb21haW46IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBxdWV1ZTogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBwYXRoIG9mIFNJVEVNQVBfQ0FORElEQVRFUykge1xuICAgIHF1ZXVlLnB1c2goYGh0dHBzOi8vJHtkb21haW59JHtwYXRofWApO1xuICB9XG5cbiAgY29uc3QgdXJsczogc3RyaW5nW10gPSBbXTtcbiAgd2hpbGUgKHF1ZXVlLmxlbmd0aCAmJiB1cmxzLmxlbmd0aCA8IDIwMDApIHtcbiAgICBjb25zdCBjdXJyZW50ID0gcXVldWUuc2hpZnQoKSE7XG4gICAgaWYgKHNlZW4uaGFzKGN1cnJlbnQpKSBjb250aW51ZTtcbiAgICBzZWVuLmFkZChjdXJyZW50KTtcbiAgICBjb25zdCB4bWwgPSBhd2FpdCBmZXRjaFRleHQoY3VycmVudCk7XG4gICAgaWYgKCF4bWwpIGNvbnRpbnVlO1xuXG4gICAgLy8gU2l0ZW1hcCBpbmRleCBcdTIxOTIgPHNpdGVtYXA+PGxvYz4uLi48L2xvYz48L3NpdGVtYXA+XG4gICAgY29uc3QgbmVzdGVkID0gQXJyYXkuZnJvbShcbiAgICAgIHhtbC5tYXRjaEFsbCgvPHNpdGVtYXBbXj5dKj5bXFxzXFxTXSo/PGxvYz4oW1xcc1xcU10qPyk8XFwvbG9jPltcXHNcXFNdKj88XFwvc2l0ZW1hcD4vZ2kpXG4gICAgKS5tYXAoKG0pID0+IG1bMV0udHJpbSgpKTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgbmVzdGVkKSB7XG4gICAgICBpZiAoL3Byb2R1Y3R8c2l0ZW1hcC1cXGQrfHBhZ2Utc2l0ZW1hcC9pLnRlc3QobikgfHwgbmVzdGVkLmxlbmd0aCA8IDEwKSB7XG4gICAgICAgIHF1ZXVlLnB1c2gobik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVVJMIHNldCBcdTIxOTIgPHVybD48bG9jPi4uLjwvbG9jPjwvdXJsPlxuICAgIGNvbnN0IGl0ZW1zID0gQXJyYXkuZnJvbShcbiAgICAgIHhtbC5tYXRjaEFsbCgvPHVybFtePl0qPltcXHNcXFNdKj88bG9jPihbXFxzXFxTXSo/KTxcXC9sb2M+W1xcc1xcU10qPzxcXC91cmw+L2dpKVxuICAgICkubWFwKChtKSA9PiBtWzFdLnRyaW0oKSk7XG4gICAgZm9yIChjb25zdCB1IG9mIGl0ZW1zKSB1cmxzLnB1c2godSk7XG4gIH1cblxuICAvLyBLZWVwIGxpa2VseS1wcm9kdWN0IFVSTHMgZmlyc3QuIEZhbGwgYmFjayB0byBldmVyeXRoaW5nIGlmIG5vIGhpbnQgbWF0Y2hlcy5cbiAgY29uc3QgaGludGVkID0gdXJscy5maWx0ZXIoKHUpID0+IFBST0RVQ1RfVVJMX0hJTlRTLnRlc3QodSkpO1xuICBjb25zdCBwb29sID0gaGludGVkLmxlbmd0aCA+PSAxMCA/IGhpbnRlZCA6IHVybHM7XG5cbiAgLy8gRGVkdXBsaWNhdGUgcHJlc2VydmluZyBvcmRlclxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGRlZHVwID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgdSBvZiBwb29sKSB7XG4gICAgaWYgKGRlZHVwLmhhcyh1KSkgY29udGludWU7XG4gICAgZGVkdXAuYWRkKHUpO1xuICAgIG91dC5wdXNoKHUpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmludGVyZmFjZSBKc29uTGRQcm9kdWN0IHtcbiAgXCJAdHlwZVwiPzogc3RyaW5nIHwgc3RyaW5nW107XG4gIG5hbWU/OiBzdHJpbmc7XG4gIG9mZmVycz86XG4gICAgfCB7XG4gICAgICAgIHByaWNlPzogc3RyaW5nIHwgbnVtYmVyO1xuICAgICAgICBsb3dQcmljZT86IHN0cmluZyB8IG51bWJlcjtcbiAgICAgICAgcHJpY2VDdXJyZW5jeT86IHN0cmluZztcbiAgICAgICAgYXZhaWxhYmlsaXR5Pzogc3RyaW5nO1xuICAgICAgfVxuICAgIHwgQXJyYXk8e1xuICAgICAgICBwcmljZT86IHN0cmluZyB8IG51bWJlcjtcbiAgICAgICAgcHJpY2VDdXJyZW5jeT86IHN0cmluZztcbiAgICAgICAgYXZhaWxhYmlsaXR5Pzogc3RyaW5nO1xuICAgICAgfT47XG59XG5cbmZ1bmN0aW9uIGlzUHJvZHVjdE5vZGUobjogdW5rbm93bik6IG4gaXMgSnNvbkxkUHJvZHVjdCB7XG4gIGlmICghbiB8fCB0eXBlb2YgbiAhPT0gXCJvYmplY3RcIikgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB0ID0gKG4gYXMgSnNvbkxkUHJvZHVjdClbXCJAdHlwZVwiXTtcbiAgaWYgKCF0KSByZXR1cm4gZmFsc2U7XG4gIGlmIChBcnJheS5pc0FycmF5KHQpKSByZXR1cm4gdC5zb21lKCh4KSA9PiAvcHJvZHVjdC9pLnRlc3QoeCkpO1xuICByZXR1cm4gL3Byb2R1Y3QvaS50ZXN0KFN0cmluZyh0KSk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RQcm9kdWN0RnJvbUh0bWwoXG4gIGh0bWw6IHN0cmluZyxcbiAgc3RvcmVLZXk6IHN0cmluZyxcbiAgdXJsOiBzdHJpbmdcbik6IENvbXBldGl0b3JQcm9kdWN0IHwgbnVsbCB7XG4gIGNvbnN0IHNjcmlwdHMgPSBBcnJheS5mcm9tKFxuICAgIGh0bWwubWF0Y2hBbGwoXG4gICAgICAvPHNjcmlwdFtePl0qdHlwZT1bXCInXWFwcGxpY2F0aW9uXFwvbGRcXCtqc29uW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi9naVxuICAgIClcbiAgKTtcbiAgZm9yIChjb25zdCBtIG9mIHNjcmlwdHMpIHtcbiAgICBsZXQgcGFyc2VkOiB1bmtub3duO1xuICAgIHRyeSB7XG4gICAgICBwYXJzZWQgPSBKU09OLnBhcnNlKG1bMV0udHJpbSgpKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBpdGVtczogdW5rbm93bltdID0gW107XG4gICAgY29uc3QgZ3JhcGggPSAocGFyc2VkIGFzIHsgXCJAZ3JhcGhcIj86IHVua25vd25bXSB9KT8uW1wiQGdyYXBoXCJdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGdyYXBoKSkgaXRlbXMucHVzaCguLi5ncmFwaCk7XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXJzZWQpKSBpdGVtcy5wdXNoKC4uLnBhcnNlZCk7XG4gICAgZWxzZSBpdGVtcy5wdXNoKHBhcnNlZCk7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgIGlmICghaXNQcm9kdWN0Tm9kZShpdGVtKSkgY29udGludWU7XG4gICAgICBjb25zdCBwID0gaXRlbSBhcyBKc29uTGRQcm9kdWN0O1xuICAgICAgY29uc3QgbmFtZSA9IHAubmFtZTtcbiAgICAgIGxldCBwcmljZVJhdzogc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgbGV0IGF2YWlsYWJpbGl0eSA9IFwiXCI7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwLm9mZmVycykpIHtcbiAgICAgICAgcHJpY2VSYXcgPSBwLm9mZmVyc1swXT8ucHJpY2U7XG4gICAgICAgIGF2YWlsYWJpbGl0eSA9IHAub2ZmZXJzWzBdPy5hdmFpbGFiaWxpdHkgPz8gXCJcIjtcbiAgICAgIH0gZWxzZSBpZiAocC5vZmZlcnMpIHtcbiAgICAgICAgcHJpY2VSYXcgPSBwLm9mZmVycy5wcmljZSA/PyBwLm9mZmVycy5sb3dQcmljZTtcbiAgICAgICAgYXZhaWxhYmlsaXR5ID0gcC5vZmZlcnMuYXZhaWxhYmlsaXR5ID8/IFwiXCI7XG4gICAgICB9XG4gICAgICBjb25zdCBwcmljZSA9IHBhcnNlQ2xwKHByaWNlUmF3KTtcbiAgICAgIGlmICghbmFtZSB8fCBwcmljZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICB0aXRsZTogU3RyaW5nKG5hbWUpLFxuICAgICAgICB1cmwsXG4gICAgICAgIHByaWNlQ2xwOiBwcmljZSxcbiAgICAgICAgYXZhaWxhYmxlOiAhL291dG9mc3RvY2svaS50ZXN0KGF2YWlsYWJpbGl0eSksXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEZhbGxiYWNrOiBPcGVuR3JhcGggLyBpdGVtcHJvcCBtZXRhXG4gIGNvbnN0IG9nVGl0bGUgPSAvPG1ldGFbXj5dK3Byb3BlcnR5PVtcIiddb2c6dGl0bGVbXCInXVtePl0rY29udGVudD1bXCInXShbXlwiJ10rKVtcIiddL2kuZXhlYyhcbiAgICBodG1sXG4gICk/LlsxXTtcbiAgY29uc3Qgb2dQcmljZSA9XG4gICAgLzxtZXRhW14+XStwcm9wZXJ0eT1bXCInXXByb2R1Y3Q6cHJpY2U6YW1vdW50W1wiJ11bXj5dK2NvbnRlbnQ9W1wiJ10oW15cIiddKylbXCInXS9pLmV4ZWMoXG4gICAgICBodG1sXG4gICAgKT8uWzFdIHx8XG4gICAgLzxtZXRhW14+XStpdGVtcHJvcD1bXCInXXByaWNlW1wiJ11bXj5dK2NvbnRlbnQ9W1wiJ10oW15cIiddKylbXCInXS9pLmV4ZWMoaHRtbCk/LlsxXTtcbiAgaWYgKG9nVGl0bGUgJiYgb2dQcmljZSkge1xuICAgIGNvbnN0IHByaWNlID0gcGFyc2VDbHAob2dQcmljZSk7XG4gICAgaWYgKHByaWNlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB7IHN0b3JlS2V5LCB0aXRsZTogb2dUaXRsZSwgdXJsLCBwcmljZUNscDogcHJpY2UsIGF2YWlsYWJsZTogdHJ1ZSB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEh0bWxTdG9yZWZyb250KFxuICBzdG9yZUtleTogc3RyaW5nLFxuICBkb21haW46IHN0cmluZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGNvbnN0IHVybHMgPSBhd2FpdCByZXNvbHZlU2l0ZW1hcFVybHMoZG9tYWluKTtcbiAgaWYgKCF1cmxzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgIHN0b3JlS2V5LFxuICAgICAgYCR7ZG9tYWlufSBubyBleHBvbmUgc2l0ZW1hcC54bWwgY29uIFVSTHMgZGUgcHJvZHVjdG9zYFxuICAgICk7XG4gIH1cbiAgY29uc3QgbGltaXQgPSBNYXRoLm1pbih1cmxzLmxlbmd0aCwgNDAwKTtcbiAgY29uc3QgY29uY3VycmVuY3kgPSA2O1xuICBjb25zdCBvdXQ6IENvbXBldGl0b3JQcm9kdWN0W10gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbWl0OyBpICs9IGNvbmN1cnJlbmN5KSB7XG4gICAgY29uc3QgYmF0Y2ggPSB1cmxzLnNsaWNlKGksIGkgKyBjb25jdXJyZW5jeSk7XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgYmF0Y2gubWFwKGFzeW5jICh1KSA9PiB7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBmZXRjaFRleHQodSk7XG4gICAgICAgIGlmICghaHRtbCkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBleHRyYWN0UHJvZHVjdEZyb21IdG1sKGh0bWwsIHN0b3JlS2V5LCB1KTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgcmVzdWx0cykgaWYgKHApIG91dC5wdXNoKHApO1xuICB9XG4gIGlmICghb3V0Lmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgIHN0b3JlS2V5LFxuICAgICAgYCR7ZG9tYWlufTogc2l0ZW1hcCBlbmNvbnRyYWRvIHBlcm8gbm8gc2UgcHVkaWVyb24gZXh0cmFlciBwcm9kdWN0b3MgKHNpbiBKU09OLUxEIG5pIG9nOnByaWNlKWBcbiAgICApO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIHB1YmxpYyBBUEkgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQ29tcGV0aXRvcihcbiAgY2ZnOiBDb21wZXRpdG9yQ29uZmlnXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgaWYgKGNmZy50eXBlID09PSBcInNob3BpZnlcIikgcmV0dXJuIGZldGNoU2hvcGlmeShjZmcua2V5LCBjZmcuZG9tYWluKTtcbiAgaWYgKGNmZy50eXBlID09PSBcIndvb2NvbW1lcmNlXCIpIHJldHVybiBmZXRjaFdvbyhjZmcua2V5LCBjZmcuZG9tYWluKTtcbiAgaWYgKGNmZy50eXBlID09PSBcImh0bWxcIikgcmV0dXJuIGZldGNoSHRtbFN0b3JlZnJvbnQoY2ZnLmtleSwgY2ZnLmRvbWFpbik7XG5cbiAgLy8gYXV0bzogc2hvcGlmeSBcdTIxOTIgd29vIFx1MjE5MiBodG1sIChzaXRlbWFwK2pzb24tbGQpIGZhbGxiYWNrIGNoYWluXG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBmbiBvZiBbZmV0Y2hTaG9waWZ5LCBmZXRjaFdvbywgZmV0Y2hIdG1sU3RvcmVmcm9udF0pIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGZuKGNmZy5rZXksIGNmZy5kb21haW4pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBDb21wZXRpdG9yRmV0Y2hFcnJvcikpIHRocm93IGU7XG4gICAgICBlcnJvcnMucHVzaChlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgY2ZnLmtleSxcbiAgICBgbm8gc2UgcHVkbyBzY3JhcGVhciAke2NmZy5kb21haW59OiAke2Vycm9ycy5qb2luKFwiIFx1MDBCNyBcIil9YFxuICApO1xufVxuXG4vKipcbiAqIEJ1aWxkIHtnYW1lSWQgLT4gbWF0Y2hlc1tdfSBmb3IgYSBsaXN0IG9mIFBTTiBnYW1lcyBhbmQgdGhlIGNvbWJpbmVkIHBvb2xcbiAqIG9mIGNvbXBldGl0b3IgcHJvZHVjdHMgKGZyb20gYWxsIGVuYWJsZWQgc3RvcmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoR2FtZXMoXG4gIGdhbWVzOiBHYW1lW10sXG4gIHByb2R1Y3RzOiBDb21wZXRpdG9yUHJvZHVjdFtdXG4pOiBSZWNvcmQ8c3RyaW5nLCBDb21wZXRpdG9yTWF0Y2hbXT4ge1xuICAvLyBQcmVjb21wdXRlIHRva2VucyBvbmNlIHBlciBwcm9kdWN0LlxuICBjb25zdCBwcm9kdWN0VG9rZW5zOiBBcnJheTx7IHA6IENvbXBldGl0b3JQcm9kdWN0OyB0b2tlbnM6IHN0cmluZ1tdIH0+ID1cbiAgICBwcm9kdWN0cy5tYXAoKHApID0+ICh7IHAsIHRva2VuczogdG9rZW5pemUocC50aXRsZSkgfSkpO1xuXG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgQ29tcGV0aXRvck1hdGNoW10+ID0ge307XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgIGNvbnN0IGdUb2tlbnMgPSB0b2tlbml6ZShnLm5hbWUpO1xuICAgIGlmICghZ1Rva2Vucy5sZW5ndGgpIGNvbnRpbnVlO1xuICAgIGNvbnN0IG1hdGNoZXM6IENvbXBldGl0b3JNYXRjaFtdID0gW107XG4gICAgZm9yIChjb25zdCB7IHAsIHRva2VucyB9IG9mIHByb2R1Y3RUb2tlbnMpIHtcbiAgICAgIGlmICghdG9rZW5zLmxlbmd0aCkgY29udGludWU7XG4gICAgICBjb25zdCBzY29yZSA9IHNpbWlsYXJpdHkoZ1Rva2VucywgdG9rZW5zKTtcbiAgICAgIGlmIChzY29yZSA+PSBNQVRDSF9USFJFU0hPTEQpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBzdG9yZUtleTogcC5zdG9yZUtleSxcbiAgICAgICAgICB0aXRsZTogcC50aXRsZSxcbiAgICAgICAgICB1cmw6IHAudXJsLFxuICAgICAgICAgIHByaWNlQ2xwOiBwLnByaWNlQ2xwLFxuICAgICAgICAgIGF2YWlsYWJsZTogcC5hdmFpbGFibGUsXG4gICAgICAgICAgc2NvcmUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBLZWVwIGF0IG1vc3QgdG9wLTUgcGVyIGdhbWUgdG8gbGltaXQgcGF5bG9hZCBzaXplLlxuICAgIG1hdGNoZXMuc29ydCgoYSwgYikgPT4gYS5wcmljZUNscCAtIGIucHJpY2VDbHApO1xuICAgIG91dFtnLmlkXSA9IG1hdGNoZXMuc2xpY2UoMCwgNSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi1wcm9kdWN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi1wcm9kdWN0LnRzXCI7LyoqXG4gKiBQU04gcHJvZHVjdCBkZXRhaWwgc2NyYXBlci5cbiAqXG4gKiBUaGUgcHJvZHVjdCBwYWdlIChzdG9yZS5wbGF5c3RhdGlvbi5jb20vPHJlZ2lvbj4vcHJvZHVjdC88aWQ+KSBpcyBTU1InZFxuICogYnkgTmV4dC5qcyBqdXN0IGxpa2UgdGhlIGNhdGVnb3J5IHBhZ2VzIFx1MjAxNCB0aGUgZnVsbCBwcm9kdWN0IEpTT04gc2l0c1xuICogaW5zaWRlIGA8c2NyaXB0IGlkPVwiX19ORVhUX0RBVEFfX1wiPmAuIFdlIHdhbGsgdGhhdCB0cmVlIHRvIGZpbmQgdGhlXG4gKiBvYmplY3QgbWF0Y2hpbmcgb3VyIHRhcmdldCBpZCBhbmQgbm9ybWFsaXplIGl0cyBmaWVsZHMuXG4gKlxuICogZmlsZVNpemUgaXMgdGhlIG9uZSB0aGluZyBQU04gZG9lc24ndCBwdXQgaW4gc3RydWN0dXJlZCBkYXRhIG9uIGVuLVVTO1xuICogd2UgcmVjb3ZlciBpdCBmcm9tIHRoZSB2aXNpYmxlIEhUTUwgd2l0aCBhIHJlZ2V4IGZhbGxiYWNrLlxuICovXG5pbXBvcnQgeyBQc25BcGlFcnJvciB9IGZyb20gXCIuL3BzblwiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y3RNZWRpYSB7XG4gIGhlcm9Vcmw6IHN0cmluZyB8IG51bGw7XG4gIGxvZ29Vcmw6IHN0cmluZyB8IG51bGw7XG4gIGJhY2tncm91bmRVcmw6IHN0cmluZyB8IG51bGw7XG4gIGNvdmVyVXJsOiBzdHJpbmcgfCBudWxsO1xuICBzY3JlZW5zaG90czogc3RyaW5nW107XG4gIHZpZGVvczogQXJyYXk8eyB1cmw6IHN0cmluZzsgcG9zdGVyVXJsOiBzdHJpbmcgfCBudWxsOyBtaW1lVHlwZTogc3RyaW5nIHwgbnVsbCB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0RGV0YWlsIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nOyAvLyBzYW5pdGl6ZWQgSFRNTFxuICBzaG9ydERlc2NyaXB0aW9uOiBzdHJpbmcgfCBudWxsO1xuICBwdWJsaXNoZXI6IHN0cmluZyB8IG51bGw7XG4gIGRldmVsb3Blcjogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIGdlbnJlczogc3RyaW5nW107XG4gIHZvaWNlTGFuZ3VhZ2VzOiBzdHJpbmdbXTtcbiAgc3VidGl0bGVMYW5ndWFnZXM6IHN0cmluZ1tdO1xuICBhZ2VSYXRpbmc6IHN0cmluZyB8IG51bGw7XG4gIGZpbGVTaXplOiBzdHJpbmcgfCBudWxsO1xuICBwbGF0Zm9ybXM6IHN0cmluZztcbiAgbWVkaWE6IFByb2R1Y3RNZWRpYTtcbiAgc3RvcmVVcmw6IHN0cmluZztcbiAgZmV0Y2hlZEF0OiBzdHJpbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSHRtbCh1cmw6IHN0cmluZywgcmVnaW9uOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBsZXQgbGFzdEVycjogdW5rbm93biA9IG51bGw7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMzsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBhY2NlcHQ6XG4gICAgICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IHJlZ2lvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJlc1wiKSA/IFwiZXNcIiA6IFwiZW4tVVNcIixcbiAgICAgICAgICBcIngtcHNuLXN0b3JlLWxvY2FsZS1vdmVycmlkZVwiOiByZWdpb24sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDA0KSB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoYFByb2R1Y3Qgbm90IGZvdW5kICg0MDQpOiAke3VybH1gKTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDAzKVxuICAgICAgICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXCJQU04gcmV0dXJuZWQgNDAzIChJUC9DbG91ZGZsYXJlIGJsb2NrKVwiKTtcbiAgICAgIGlmIChyLnN0YXR1cyA+PSA1MDApIHRocm93IG5ldyBFcnJvcihgUFNOICR7ci5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4gYXdhaXQgci50ZXh0KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBQc25BcGlFcnJvcikgdGhyb3cgZTtcbiAgICAgIGxhc3RFcnIgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDQwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgYFBTTiBwcm9kdWN0IGZldGNoIGZhaWxlZDogJHsobGFzdEVyciBhcyBFcnJvcik/Lm1lc3NhZ2UgfHwgbGFzdEVycn1gXG4gICk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3ROZXh0RGF0YShodG1sOiBzdHJpbmcpOiBhbnkgfCBudWxsIHtcbiAgY29uc3QgbSA9IC88c2NyaXB0W14+XSppZD1bXCInXV9fTkVYVF9EQVRBX19bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+Ly5leGVjKFxuICAgIGh0bWxcbiAgKTtcbiAgaWYgKCFtKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShtWzFdKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqIFdhbGsgdGhlIHRyZWUgY29sbGVjdGluZyBldmVyeSBvYmplY3Qgd2hvc2UgYGlkYCBtYXRjaGVzIHRhcmdldElkLlxuICogIFRoZSBwYWdlIGVtYmVkcyB0aGUgc2FtZSBwcm9kdWN0IHNldmVyYWwgdGltZXMgKGhlYWRlciwgaGVybywgcmVsYXRlZFxuICogIGxpbmtzKTsgd2UgcGljayB0aGUgcmljaGVzdCByZWNvcmQgYnkgdG90YWwga2V5IGNvdW50LiAqL1xuZnVuY3Rpb24gZmluZFByb2R1Y3RSZWNvcmRzKHRyZWU6IHVua25vd24sIHRhcmdldElkOiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdIHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdID0gW107XG4gIGNvbnN0IHN0YWNrOiB1bmtub3duW10gPSBbdHJlZV07XG4gIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcbiAgICBjb25zdCBuID0gc3RhY2sucG9wKCk7XG4gICAgaWYgKCFuKSBjb250aW51ZTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShuKSkge1xuICAgICAgZm9yIChjb25zdCB2IG9mIG4pIHN0YWNrLnB1c2godik7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBuICE9PSBcIm9iamVjdFwiKSBjb250aW51ZTtcbiAgICBjb25zdCBvYmogPSBuIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIGlmIChvYmouaWQgPT09IHRhcmdldElkIHx8IG9iai5wcm9kdWN0SWQgPT09IHRhcmdldElkKSBvdXQucHVzaChvYmopO1xuICAgIGZvciAoY29uc3QgdiBvZiBPYmplY3QudmFsdWVzKG9iaikpIHtcbiAgICAgIGlmICh2ICYmIHR5cGVvZiB2ID09PSBcIm9iamVjdFwiKSBzdGFjay5wdXNoKHYpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBwaWNrUmljaGVzdChyZWNvcmRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgaWYgKCFyZWNvcmRzLmxlbmd0aCkgcmV0dXJuIG51bGw7XG4gIGxldCBiZXN0ID0gcmVjb3Jkc1swXTtcbiAgbGV0IGJlc3RLZXlzID0gT2JqZWN0LmtleXMoYmVzdCkubGVuZ3RoO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3Jkcykge1xuICAgIGNvbnN0IGsgPSBPYmplY3Qua2V5cyhyKS5sZW5ndGg7XG4gICAgaWYgKGsgPiBiZXN0S2V5cykge1xuICAgICAgYmVzdCA9IHI7XG4gICAgICBiZXN0S2V5cyA9IGs7XG4gICAgfVxuICB9XG4gIHJldHVybiBiZXN0O1xufVxuXG4vKiogTWVyZ2UgZmllbGRzIGFjcm9zcyBldmVyeSByZWNvcmQgd2l0aCB0aGlzIGlkIFx1MjAxNCBvbmUgc2xvdCBtaWdodCBoYXZlXG4gKiAgbWVkaWEsIGFub3RoZXIgbG9uZ0Rlc2NyaXB0aW9uLCBldGMuIFJpY2hlc3Qgd2lucyBvbiBjb25mbGljdHMuICovXG5mdW5jdGlvbiBtZXJnZVJlY29yZHMocmVjb3JkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgc29ydGVkID0gWy4uLnJlY29yZHNdLnNvcnQoXG4gICAgKGEsIGIpID0+IE9iamVjdC5rZXlzKGEpLmxlbmd0aCAtIE9iamVjdC5rZXlzKGIpLmxlbmd0aFxuICApO1xuICBjb25zdCBtZXJnZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGZvciAoY29uc3QgciBvZiBzb3J0ZWQpIHtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhyKSkge1xuICAgICAgaWYgKHYgPT0gbnVsbCkgY29udGludWU7XG4gICAgICBpZiAobWVyZ2VkW2tdID09IG51bGwpIG1lcmdlZFtrXSA9IHY7XG4gICAgfVxuICB9XG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmludGVyZmFjZSBSYXdNZWRpYSB7XG4gIHJvbGU/OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbiAgc291cmNlPzogeyB1cmw/OiBzdHJpbmc7IHR5cGU/OiBzdHJpbmcgfTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE1lZGlhKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBQcm9kdWN0TWVkaWEge1xuICBjb25zdCBsaXN0ID0gKG9iai5tZWRpYSBhcyBSYXdNZWRpYVtdKSB8fCBbXTtcbiAgY29uc3QgYnlSb2xlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGNvbnN0IHNjcmVlbnNob3RzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB2aWRlb3M6IFByb2R1Y3RNZWRpYVtcInZpZGVvc1wiXSA9IFtdO1xuICBsZXQgcG9zdGVyRm9yTmV4dFZpZGVvOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBmb3IgKGNvbnN0IG0gb2YgbGlzdCkge1xuICAgIGNvbnN0IHJvbGUgPSBTdHJpbmcobT8ucm9sZSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IHR5cGUgPSBTdHJpbmcobT8udHlwZSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IHVybCA9IG0/LnVybCB8fCBtPy5zb3VyY2U/LnVybCB8fCBudWxsO1xuXG4gICAgLy8gVmlkZW9zOiB0eXBlIGlzIHVzdWFsbHkgVklERU8gb3IgVklERU9fUFJPTU8sIHJvbGUgaXMgUFJPTU8uXG4gICAgaWYgKHR5cGUuaW5jbHVkZXMoXCJWSURFT1wiKSB8fCByb2xlID09PSBcIlBST01PXCIpIHtcbiAgICAgIGlmICghdXJsKSBjb250aW51ZTtcbiAgICAgIHZpZGVvcy5wdXNoKHtcbiAgICAgICAgdXJsLFxuICAgICAgICBwb3N0ZXJVcmw6IHBvc3RlckZvck5leHRWaWRlbyxcbiAgICAgICAgbWltZVR5cGU6IG0/LnNvdXJjZT8udHlwZSB8fCBudWxsLFxuICAgICAgfSk7XG4gICAgICBwb3N0ZXJGb3JOZXh0VmlkZW8gPSBudWxsO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghdXJsKSBjb250aW51ZTtcblxuICAgIC8vIFN0YXNoIHRoZSBmaXJzdCByb2xlIGhpdCBzbyB3ZSBkb24ndCBvdmVyd3JpdGUgaGVybyB3aXRoIGEgbGF0ZXJcbiAgICAvLyBNQVNURVIgdGhhdCBtaWdodCBiZSBsb3dlciBxdWFsaXR5LlxuICAgIGlmICghYnlSb2xlW3JvbGVdKSBieVJvbGVbcm9sZV0gPSB1cmw7XG5cbiAgICBpZiAocm9sZSA9PT0gXCJTQ1JFRU5TSE9UXCIpIHNjcmVlbnNob3RzLnB1c2godXJsKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaGVyb1VybDpcbiAgICAgIGJ5Um9sZVtcIkhFUk9fQkFOTkVSXCJdIHx8XG4gICAgICBieVJvbGVbXCJIRVJPQkFOTkVSXCJdIHx8XG4gICAgICBieVJvbGVbXCJCQUNLR1JPVU5EX0lNQUdFXCJdIHx8XG4gICAgICBieVJvbGVbXCJCQUNLR1JPVU5EXCJdIHx8XG4gICAgICBudWxsLFxuICAgIGxvZ29Vcmw6IGJ5Um9sZVtcIkxPR09cIl0gfHwgYnlSb2xlW1wiTE9HT19UUkFOU1BBUkVOVFwiXSB8fCBudWxsLFxuICAgIGJhY2tncm91bmRVcmw6IGJ5Um9sZVtcIkJBQ0tHUk9VTkRfSU1BR0VcIl0gfHwgYnlSb2xlW1wiQkFDS0dST1VORFwiXSB8fCBudWxsLFxuICAgIGNvdmVyVXJsOlxuICAgICAgYnlSb2xlW1wiTUFTVEVSXCJdIHx8XG4gICAgICBieVJvbGVbXCJCT1hBUlRcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkdBTUVIVUJfQ09WRVJfQVJUXCJdIHx8XG4gICAgICBieVJvbGVbXCJQUkVWSUVXX0dBTUVfQVJUXCJdIHx8XG4gICAgICBudWxsLFxuICAgIHNjcmVlbnNob3RzOiBbLi4ubmV3IFNldChzY3JlZW5zaG90cyldLFxuICAgIHZpZGVvcyxcbiAgfTtcbn1cblxuLyoqIE1pbmltYWwgSFRNTCBzYW5pdGl6YXRpb24gXHUyMDE0IHN0cmlwcyBzY3JpcHRzL3N0eWxlcy9ldmVudCBoYW5kbGVycyBhbmRcbiAqICBhbnkgdGFnIG91dHNpZGUgdGhlIHdoaXRlbGlzdC4gRW5vdWdoIGZvciBQU04tc291cmNlZCBkZXNjcmlwdGlvbnMuICovXG5jb25zdCBBTExPV0VEX1RBR1MgPSBuZXcgU2V0KFtcbiAgXCJwXCIsIFwiYnJcIiwgXCJzdHJvbmdcIiwgXCJiXCIsIFwiZW1cIiwgXCJpXCIsIFwidVwiLCBcInVsXCIsIFwib2xcIiwgXCJsaVwiLCBcImgyXCIsIFwiaDNcIiwgXCJoNFwiLFxuXSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZUh0bWwocmF3OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXJhdykgcmV0dXJuIFwiXCI7XG4gIGxldCBzID0gcmF3O1xuICAvLyBEcm9wIGVudGlyZSBzY3JpcHQvc3R5bGUgYmxvY2tzLlxuICBzID0gcy5yZXBsYWNlKC88c2NyaXB0W1xcc1xcU10qPzxcXC9zY3JpcHQ+L2dpLCBcIlwiKTtcbiAgcyA9IHMucmVwbGFjZSgvPHN0eWxlW1xcc1xcU10qPzxcXC9zdHlsZT4vZ2ksIFwiXCIpO1xuICAvLyBTdHJpcCBhbnkgdGFnIG5vdCBpbiB0aGUgd2hpdGVsaXN0LiBQcmVzZXJ2ZSBpbm5lciB0ZXh0LlxuICBzID0gcy5yZXBsYWNlKC88XFwvPyhbYS16QS1aXVthLXpBLVowLTldKilcXGJbXj5dKj4vZywgKG1hdGNoLCB0YWcpID0+IHtcbiAgICBjb25zdCB0ID0gU3RyaW5nKHRhZykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIUFMTE9XRURfVEFHUy5oYXModCkpIHJldHVybiBcIlwiO1xuICAgIC8vIEZvciBhbGxvd2VkIHRhZ3MsIGRyb3AgYWxsIGF0dHJpYnV0ZXMgKG5vIGhyZWYvc3R5bGUvb24qIHBvc3NpYmxlKS5cbiAgICByZXR1cm4gbWF0Y2guc3RhcnRzV2l0aChcIjwvXCIpID8gYDwvJHt0fT5gIDogYDwke3R9PmA7XG4gIH0pO1xuICAvLyBDb2xsYXBzZSBydW5zIG9mIGVtcHR5IHBhcmFncmFwaHMuXG4gIHMgPSBzLnJlcGxhY2UoLyg/OjxwPlxccyo8XFwvcD5cXHMqKXsyLH0vZ2ksIFwiPHA+PC9wPlwiKTtcbiAgcmV0dXJuIHMudHJpbSgpO1xufVxuXG5mdW5jdGlvbiB0b1N0cmluZ0FycmF5KHY6IHVua25vd24pOiBzdHJpbmdbXSB7XG4gIGlmICghdikgcmV0dXJuIFtdO1xuICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgIHJldHVybiB2XG4gICAgICAubWFwKCh4KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgeCA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHg7XG4gICAgICAgIGlmICh4ICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgY29uc3Qgb2JqID0geCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgICByZXR1cm4gU3RyaW5nKG9iai5uYW1lIHx8IG9iai5sYWJlbCB8fCBvYmouZGVzY3JpcHRpb24gfHwgXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9KVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpIHJldHVybiB2LnNwbGl0KFwiLFwiKS5tYXAoKHMpID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gc3RyKHY6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHYgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHYudHJpbSgpIHx8IG51bGw7XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IG9iaiA9IHYgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgcmV0dXJuIChcbiAgICAgICh0eXBlb2Ygb2JqLm5hbWUgPT09IFwic3RyaW5nXCIgJiYgb2JqLm5hbWUpIHx8XG4gICAgICAodHlwZW9mIG9iai5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvYmouZGVzY3JpcHRpb24pIHx8XG4gICAgICBudWxsXG4gICAgKTtcbiAgfVxuICByZXR1cm4gU3RyaW5nKHYpIHx8IG51bGw7XG59XG5cbi8qKiBQU04gcmFyZWx5IGV4cG9zZXMgZmlsZSBzaXplIGluIHN0cnVjdHVyZWQgZGF0YSBvbiBlbi1VUy4gU2NyYXBlIGl0XG4gKiAgZnJvbSB0aGUgdmlzaWJsZSBIVE1MIGFzIGEgbGFzdCByZXNvcnQuIE1hdGNoZXMgXCI3OS44IEdCXCIsIFwiMiBHQlwiLCBldGMuICovXG5mdW5jdGlvbiBleHRyYWN0RmlsZVNpemVGcm9tSHRtbChodG1sOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gVGhlIFwiRmlsZSBTaXplXCIgbGFiZWwgaXMgZm9sbG93ZWQgYnkgdGhlIHZhbHVlIGluIHRoZSBcIkFib3V0IHRoaXMgZ2FtZVwiXG4gIC8vIHNlY3Rpb24uIExvb2sgZm9yIHZhcmlhdGlvbnMuXG4gIGNvbnN0IGxhYmVsTWF0Y2ggPVxuICAgIC9GaWxlXFxzKlNpemVbXjxdKjxcXC9bXj5dKz5cXHMqPFtePl0rPihbXjxdKyk8L2kuZXhlYyhodG1sKSB8fFxuICAgIC9cImZpbGVTaXplXCJcXHMqOlxccypcIihbXlwiXSspXCIvaS5leGVjKGh0bWwpO1xuICBpZiAobGFiZWxNYXRjaCAmJiBsYWJlbE1hdGNoWzFdKSByZXR1cm4gbGFiZWxNYXRjaFsxXS50cmltKCk7XG4gIC8vIEdsb2JhbCBmYWxsYmFjazogYW55IFwiPG51bWJlcj4gR0JcIiBuZWFyIGEgc2l6ZS1pc2ggbGFiZWwuIFZlcnkgY29hcnNlXG4gIC8vIFx1MjAxNCBvbmx5IHVzZSBpZiB0aGUgbGFiZWxlZCBzY3JhcGUgbWlzc2VzLlxuICBjb25zdCBhbnkgPSAvKFxcZHsxLDN9KD86Wy4sXVxcZCspPylcXHMqR0JcXGIvaS5leGVjKGh0bWwpO1xuICByZXR1cm4gYW55ID8gYCR7YW55WzFdfSBHQmAgOiBudWxsO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hQcm9kdWN0RGV0YWlsKFxuICBpZDogc3RyaW5nLFxuICBzdG9yZVVybDogc3RyaW5nLFxuICByZWdpb246IHN0cmluZ1xuKTogUHJvbWlzZTxQcm9kdWN0RGV0YWlsPiB7XG4gIGNvbnN0IHVybCA9IHN0b3JlVXJsIHx8IGBodHRwczovL3N0b3JlLnBsYXlzdGF0aW9uLmNvbS9lbi11cy9wcm9kdWN0LyR7aWR9YDtcbiAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoSHRtbCh1cmwsIHJlZ2lvbik7XG4gIGNvbnN0IGRhdGEgPSBleHRyYWN0TmV4dERhdGEoaHRtbCk7XG4gIGlmICghZGF0YSkgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFwiTm8gX19ORVhUX0RBVEFfXyBpbiBQU04gcHJvZHVjdCBwYWdlXCIpO1xuXG4gIGNvbnN0IHJlY29yZHMgPSBmaW5kUHJvZHVjdFJlY29yZHMoZGF0YSwgaWQpO1xuICBjb25zdCByaWNoID0gcGlja1JpY2hlc3QocmVjb3Jkcyk7XG4gIGlmICghcmljaCkgdGhyb3cgbmV3IFBzbkFwaUVycm9yKGBQcm9kdWN0ICR7aWR9IG5vdCBmb3VuZCBpbiBwYWdlIEpTT05gKTtcbiAgY29uc3Qgb2JqID0gbWVyZ2VSZWNvcmRzKHJlY29yZHMpO1xuXG4gIGNvbnN0IHBsYXRmb3Jtc1JhdyA9IG9iai5wbGF0Zm9ybXM7XG4gIGNvbnN0IHBsYXRmb3JtcyA9IEFycmF5LmlzQXJyYXkocGxhdGZvcm1zUmF3KVxuICAgID8gcGxhdGZvcm1zUmF3LmpvaW4oXCIsXCIpXG4gICAgOiBTdHJpbmcocGxhdGZvcm1zUmF3IHx8IFwiXCIpO1xuXG4gIGNvbnN0IGxvbmdEZXNjID1cbiAgICAodHlwZW9mIG9iai5sb25nRGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgJiYgb2JqLmxvbmdEZXNjcmlwdGlvbikgfHxcbiAgICAodHlwZW9mIG9iai5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvYmouZGVzY3JpcHRpb24pIHx8XG4gICAgXCJcIjtcbiAgY29uc3Qgc2hvcnREZXNjID1cbiAgICAodHlwZW9mIG9iai5zaG9ydERlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiICYmIG9iai5zaG9ydERlc2NyaXB0aW9uKSB8fFxuICAgIG51bGw7XG5cbiAgY29uc3QgZmlsZVNpemUgPVxuICAgIHN0cihvYmoucmVxdWlyZWREaXNrU3BhY2VEZXNjcmlwdGlvbikgfHxcbiAgICBzdHIob2JqLmZpbGVTaXplKSB8fFxuICAgIGV4dHJhY3RGaWxlU2l6ZUZyb21IdG1sKGh0bWwpO1xuXG4gIGNvbnN0IGNvbnRlbnRSYXRpbmcgPSBvYmouY29udGVudFJhdGluZyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgY29uc3QgYWdlUmF0aW5nID1cbiAgICBzdHIoY29udGVudFJhdGluZz8uZGVzY3JpcHRpb24pIHx8XG4gICAgc3RyKGNvbnRlbnRSYXRpbmc/Lm5hbWUpIHx8XG4gICAgc3RyKG9iai5hZ2VMaW1pdCk7XG5cbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICBuYW1lOiBTdHJpbmcob2JqLm5hbWUgfHwgb2JqLnRpdGxlIHx8IFwiXCIpLFxuICAgIGRlc2NyaXB0aW9uOiBzYW5pdGl6ZUh0bWwobG9uZ0Rlc2MpLFxuICAgIHNob3J0RGVzY3JpcHRpb246IHNob3J0RGVzYyxcbiAgICBwdWJsaXNoZXI6IHN0cihvYmoucHVibGlzaGVyTmFtZSkgfHwgc3RyKG9iai5wdWJsaXNoZXIpIHx8IHN0cihvYmoucHVibGlzaGVkQnkpLFxuICAgIGRldmVsb3Blcjogc3RyKG9iai5kZXZlbG9wZXJOYW1lKSB8fCBzdHIob2JqLmRldmVsb3BlciksXG4gICAgcmVsZWFzZURhdGU6XG4gICAgICBzdHIob2JqLnJlbGVhc2VEYXRlKSB8fFxuICAgICAgc3RyKG9iai5sb2NhbGl6ZWRSZWxlYXNlRGF0ZSkgfHxcbiAgICAgIHN0cihvYmoucmVsZWFzZURhdGVSYXcpLFxuICAgIGdlbnJlczogdG9TdHJpbmdBcnJheShvYmouZ2VucmVzKSxcbiAgICB2b2ljZUxhbmd1YWdlczogdG9TdHJpbmdBcnJheShvYmouc3Bva2VuTGFuZ3VhZ2VzIHx8IG9iai5jb21wYXRpYmxlVm9pY2VzKSxcbiAgICBzdWJ0aXRsZUxhbmd1YWdlczogdG9TdHJpbmdBcnJheShcbiAgICAgIG9iai5zdWJ0aXRsZUxhbmd1YWdlcyB8fCBvYmouY29tcGF0aWJsZVN1YnRpdGxlc1xuICAgICksXG4gICAgYWdlUmF0aW5nLFxuICAgIGZpbGVTaXplLFxuICAgIHBsYXRmb3JtcyxcbiAgICBtZWRpYTogZXh0cmFjdE1lZGlhKG9iaiksXG4gICAgc3RvcmVVcmw6IHVybCxcbiAgICBmZXRjaGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvdHlwZXMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3R5cGVzLnRzXCI7ZXhwb3J0IHR5cGUgUGxhdGZvcm0gPSBcInBzblwiIHwgXCJ4Ym94XCIgfCBcIm5pbnRlbmRvXCIgfCBcInN0ZWFtXCI7XG5cbmV4cG9ydCBjb25zdCBQTEFURk9STV9MQUJFTFM6IFJlY29yZDxQbGF0Zm9ybSwgc3RyaW5nPiA9IHtcbiAgcHNuOiBcIlBsYXlTdGF0aW9uXCIsXG4gIHhib3g6IFwiWGJveFwiLFxuICBuaW50ZW5kbzogXCJOaW50ZW5kb1wiLFxuICBzdGVhbTogXCJTdGVhbVwiLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBSZWdpb25Db25maWcge1xuICBjb2RlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGN1cnJlbmN5OiBzdHJpbmc7XG4gIGxvY2FsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgUExBVEZPUk1fUkVHSU9OUzogUmVjb3JkPFBsYXRmb3JtLCBSZWdpb25Db25maWdbXT4gPSB7XG4gIHBzbjogW1xuICAgIHsgY29kZTogXCJ1c1wiLCBsYWJlbDogXCJVU1wiLCBjdXJyZW5jeTogXCJVU0RcIiwgbG9jYWxlOiBcImVuLVVTXCIgfSxcbiAgICB7IGNvZGU6IFwiYnJcIiwgbGFiZWw6IFwiQnJhc2lsXCIsIGN1cnJlbmN5OiBcIkJSTFwiLCBsb2NhbGU6IFwicHQtQlJcIiB9LFxuICBdLFxuICB4Ym94OiBbXG4gICAgeyBjb2RlOiBcInVzXCIsIGxhYmVsOiBcIlVTXCIsIGN1cnJlbmN5OiBcIlVTRFwiLCBsb2NhbGU6IFwiZW4tVVNcIiB9LFxuICAgIHsgY29kZTogXCJiclwiLCBsYWJlbDogXCJCcmFzaWxcIiwgY3VycmVuY3k6IFwiQlJMXCIsIGxvY2FsZTogXCJwdC1CUlwiIH0sXG4gICAgeyBjb2RlOiBcInRyXCIsIGxhYmVsOiBcIlR1cnF1XHUwMEVEYVwiLCBjdXJyZW5jeTogXCJUUllcIiwgbG9jYWxlOiBcInRyLVRSXCIgfSxcbiAgXSxcbiAgbmludGVuZG86IFtcbiAgICB7IGNvZGU6IFwidXNcIiwgbGFiZWw6IFwiVVNcIiwgY3VycmVuY3k6IFwiVVNEXCIsIGxvY2FsZTogXCJlbi1VU1wiIH0sXG4gICAgeyBjb2RlOiBcImpwXCIsIGxhYmVsOiBcIkphcFx1MDBGM25cIiwgY3VycmVuY3k6IFwiSlBZXCIsIGxvY2FsZTogXCJqYVwiIH0sXG4gIF0sXG4gIHN0ZWFtOiBbXG4gICAgeyBjb2RlOiBcInVzXCIsIGxhYmVsOiBcIlVTXCIsIGN1cnJlbmN5OiBcIlVTRFwiLCBsb2NhbGU6IFwiZW5cIiB9LFxuICAgIHsgY29kZTogXCJiclwiLCBsYWJlbDogXCJCcmFzaWxcIiwgY3VycmVuY3k6IFwiQlJMXCIsIGxvY2FsZTogXCJicmF6aWxpYW5cIiB9LFxuICAgIHsgY29kZTogXCJ0clwiLCBsYWJlbDogXCJUdXJxdVx1MDBFRGFcIiwgY3VycmVuY3k6IFwiVFJZXCIsIGxvY2FsZTogXCJ0dXJraXNoXCIgfSxcbiAgXSxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmF3RGVhbCB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgaW1hZ2VVcmw6IHN0cmluZyB8IG51bGw7XG4gIHN0b3JlVXJsOiBzdHJpbmcgfCBudWxsO1xuICBoYXJkd2FyZVBsYXRmb3Jtczogc3RyaW5nO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBwcmljZU9yaWdpbmFsQ2VudHM6IG51bWJlciB8IG51bGw7XG4gIHByaWNlRGlzY291bnRlZENlbnRzOiBudW1iZXIgfCBudWxsO1xuICBkaXNjb3VudFBlcmNlbnQ6IG51bWJlcjtcbiAgZGlzY291bnRFbmRBdDogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm92aWRlclNvdXJjZSB7XG4gIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGNhdGVnb3J5SWQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdmlkZXIge1xuICBwbGF0Zm9ybTogUGxhdGZvcm07XG4gIGZldGNoRGVhbHMoc291cmNlOiBQcm92aWRlclNvdXJjZSk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+O1xufVxuXG5leHBvcnQgY2xhc3MgUHJvdmlkZXJFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHBsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICBwdWJsaWMgcmVnaW9uOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogc3RyaW5nXG4gICkge1xuICAgIHN1cGVyKGBbJHtwbGF0Zm9ybX0vJHtyZWdpb259XSAke21lc3NhZ2V9YCk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvcHNuLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9wc24udHNcIjtpbXBvcnQge1xuICBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyxcbiAgaXNGdWxsR2FtZVByb2R1Y3QsXG4gIG5vcm1hbGl6ZVByb2R1Y3QsXG4gIFBzbkFwaUVycm9yLFxufSBmcm9tIFwiLi4vcHNuXCI7XG5pbXBvcnQgdHlwZSB7IFBzbkNvbmZpZyB9IGZyb20gXCIuLi9zdG9yZVwiO1xuaW1wb3J0IHR5cGUgeyBQcm92aWRlciwgUHJvdmlkZXJTb3VyY2UsIFJhd0RlYWwgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgcHNuUHJvdmlkZXI6IFByb3ZpZGVyID0ge1xuICBwbGF0Zm9ybTogXCJwc25cIixcbiAgYXN5bmMgKmZldGNoRGVhbHMoc291cmNlOiBQcm92aWRlclNvdXJjZSk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgICBjb25zdCBsb2NhbGUgPVxuICAgICAgc291cmNlLnJlZ2lvbiA9PT0gXCJiclwiID8gXCJwdC1CUlwiIDogXCJlbi1VU1wiO1xuICAgIGNvbnN0IGNmZzogUHNuQ29uZmlnID0ge1xuICAgICAgcmVnaW9uOiBsb2NhbGUsXG4gICAgICBkZWFsc0NhdGVnb3J5SWQ6IHNvdXJjZS5jYXRlZ29yeUlkIHx8IFwiXCIsXG4gICAgICBjYXRlZ29yeUdyaWRIYXNoOiBcIlwiLFxuICAgICAgaW5jbHVkZUFkZE9uczogZmFsc2UsXG4gICAgfTtcblxuICAgIGlmICghY2ZnLmRlYWxzQ2F0ZWdvcnlJZCkge1xuICAgICAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFxuICAgICAgICBcIk5vIHNlIGNvbmZpZ3VyXHUwMEYzIHVuIENhdGVnb3J5IElEIHBhcmEgUFNOIFwiICsgc291cmNlLnJlZ2lvbi50b1VwcGVyQ2FzZSgpXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbmN5ID0gc291cmNlLnJlZ2lvbiA9PT0gXCJiclwiID8gXCJCUkxcIiA6IFwiVVNEXCI7XG5cbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJhdyBvZiBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyhjZmcpKSB7XG4gICAgICBpZiAoIWlzRnVsbEdhbWVQcm9kdWN0KHJhdykpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgY29uc3QgZ2FtZSA9IG5vcm1hbGl6ZVByb2R1Y3QocmF3LCBub3cpO1xuICAgICAgaWYgKCFnYW1lKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgcmVnaW9uUGF0aCA9IGxvY2FsZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3Qgc3RvcmVVcmwgPSBgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vJHtyZWdpb25QYXRofS9wcm9kdWN0LyR7Z2FtZS5pZH1gO1xuXG4gICAgICB5aWVsZCB7XG4gICAgICAgIGlkOiBnYW1lLmlkLFxuICAgICAgICBuYW1lOiBnYW1lLm5hbWUsXG4gICAgICAgIGltYWdlVXJsOiBnYW1lLmltYWdlVXJsLFxuICAgICAgICBzdG9yZVVybCxcbiAgICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IGdhbWUucGxhdGZvcm1zLFxuICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBnYW1lLnByaWNlT3JpZ2luYWxDZW50cyxcbiAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGdhbWUucHJpY2VEaXNjb3VudGVkQ2VudHMsXG4gICAgICAgIGRpc2NvdW50UGVyY2VudDogZ2FtZS5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGRpc2NvdW50RW5kQXQ6IGdhbWUuZGlzY291bnRFbmRBdCxcbiAgICAgIH07XG4gICAgfVxuICB9LFxufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMveGJveC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMveGJveC50c1wiO2ltcG9ydCB0eXBlIHsgUHJvdmlkZXIsIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5jb25zdCBNQVJLRVRfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICB1czogXCJVU1wiLFxuICBicjogXCJCUlwiLFxuICB0cjogXCJUUlwiLFxufTtcblxuY29uc3QgTEFOR19NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcImVuLVVTXCIsXG4gIGJyOiBcInB0LUJSXCIsXG4gIHRyOiBcInRyLVRSXCIsXG59O1xuXG5jb25zdCBDVVJSRU5DWV9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTRFwiLFxuICBicjogXCJCUkxcIixcbiAgdHI6IFwiVFJZXCIsXG59O1xuXG5pbnRlcmZhY2UgUmVjb0l0ZW0ge1xuICBJZDogc3RyaW5nO1xuICBUaXRsZT86IHN0cmluZztcbiAgSW1hZ2VVcmw/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBDYXRhbG9nUHJvZHVjdCB7XG4gIFByb2R1Y3RJZDogc3RyaW5nO1xuICBMb2NhbGl6ZWRQcm9wZXJ0aWVzPzogQXJyYXk8e1xuICAgIFByb2R1Y3RUaXRsZT86IHN0cmluZztcbiAgICBJbWFnZXM/OiBBcnJheTx7IEltYWdlUHVycG9zZT86IHN0cmluZzsgVXJpPzogc3RyaW5nIH0+O1xuICB9PjtcbiAgRGlzcGxheVNrdUF2YWlsYWJpbGl0aWVzPzogQXJyYXk8e1xuICAgIFNrdT86IHsgUHJvcGVydGllcz86IHsgRnVsZmlsbG1lbnREYXRhPzogeyBQbGF0Zm9ybURlcGVuZGVuY3lJbmZvPzogc3RyaW5nIH0gfSB9O1xuICAgIEF2YWlsYWJpbGl0aWVzPzogQXJyYXk8e1xuICAgICAgQ29uZGl0aW9ucz86IHsgRW5kRGF0ZT86IHN0cmluZyB9O1xuICAgICAgT3JkZXJNYW5hZ2VtZW50RGF0YT86IHtcbiAgICAgICAgUHJpY2U/OiB7XG4gICAgICAgICAgTGlzdFByaWNlPzogbnVtYmVyO1xuICAgICAgICAgIE1TUlA/OiBudW1iZXI7XG4gICAgICAgICAgV2hvbGVzYWxlUHJpY2U/OiBudW1iZXI7XG4gICAgICAgICAgQ3VycmVuY3lDb2RlPzogc3RyaW5nO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9PjtcbiAgfT47XG4gIFByb3BlcnRpZXM/OiB7XG4gICAgQ2F0ZWdvcmllcz86IHN0cmluZ1tdO1xuICAgIENhdGVnb3J5Pzogc3RyaW5nO1xuICB9O1xufVxuXG5mdW5jdGlvbiB0b0NlbnRzKHByaWNlOiBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmIChwcmljZSA9PSBudWxsIHx8ICFOdW1iZXIuaXNGaW5pdGUocHJpY2UpKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIE1hdGgucm91bmQocHJpY2UgKiAxMDApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb24odXJsOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICBsZXQgbGFzdEVycm9yOiB1bmtub3duO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDQ7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIGhlYWRlcnM6IHsgXCJ1c2VyLWFnZW50XCI6IFVBLCBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICB9KTtcbiAgICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4gYXdhaXQgci5qc29uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaERlYWxJZHMoXG4gIG1hcmtldDogc3RyaW5nLFxuICBsYW5ndWFnZTogc3RyaW5nXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IHVybCA9XG4gICAgYGh0dHBzOi8vcmVjby1wdWJsaWMucmVjLm1wLm1pY3Jvc29mdC5jb20vY2hhbm5lbHMvUmVjby9WOC4wL0xpc3RzL0NvbXB1dGVkL0RlYWxgICtcbiAgICBgP01hcmtldD0ke21hcmtldH0mTGFuZ3VhZ2U9JHtsYW5ndWFnZX0mSXRlbVR5cGVzPUdhbWVgICtcbiAgICBgJmRldmljZUZhbWlseT1XaW5kb3dzLlhib3gmY291bnQ9MjAwMCZza2lwaXRlbXM9MGA7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaEpzb24odXJsKTtcbiAgY29uc3QgaXRlbXM6IFJlY29JdGVtW10gPSBkYXRhPy5JdGVtcyA/PyBbXTtcbiAgcmV0dXJuIGl0ZW1zLm1hcCgoaXQpID0+IGl0LklkKS5maWx0ZXIoQm9vbGVhbik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoUHJvZHVjdERldGFpbHMoXG4gIGlkczogc3RyaW5nW10sXG4gIG1hcmtldDogc3RyaW5nLFxuICBsYW5ndWFnZTogc3RyaW5nXG4pOiBQcm9taXNlPENhdGFsb2dQcm9kdWN0W10+IHtcbiAgY29uc3QgYmF0Y2hTaXplID0gMjA7XG4gIGNvbnN0IGFsbDogQ2F0YWxvZ1Byb2R1Y3RbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlkcy5sZW5ndGg7IGkgKz0gYmF0Y2hTaXplKSB7XG4gICAgY29uc3QgYmF0Y2ggPSBpZHMuc2xpY2UoaSwgaSArIGJhdGNoU2l6ZSk7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL2Rpc3BsYXljYXRhbG9nLm1wLm1pY3Jvc29mdC5jb20vdjcuMC9wcm9kdWN0c2AgK1xuICAgICAgYD9iaWdJZHM9JHtiYXRjaC5qb2luKFwiLFwiKX0mbWFya2V0PSR7bWFya2V0fSZsYW5ndWFnZXM9JHtsYW5ndWFnZX1gICtcbiAgICAgIGAmTVMtQ1Y9REdVMW1jdVlvMFdNTXArRi4xYDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgICAgY29uc3QgcHJvZHVjdHM6IENhdGFsb2dQcm9kdWN0W10gPSBkYXRhPy5Qcm9kdWN0cyA/PyBbXTtcbiAgICAgIGFsbC5wdXNoKC4uLnByb2R1Y3RzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFNraXAgZmFpbGVkIGJhdGNoLCBjb250aW51ZSB3aXRoIHJlc3RcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFsbDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEdhbWVEYXRhKFxuICBwcm9kdWN0OiBDYXRhbG9nUHJvZHVjdCxcbiAgcmVnaW9uOiBzdHJpbmdcbik6IFJhd0RlYWwgfCBudWxsIHtcbiAgY29uc3QgaWQgPSBwcm9kdWN0LlByb2R1Y3RJZDtcbiAgaWYgKCFpZCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgbHAgPSBwcm9kdWN0LkxvY2FsaXplZFByb3BlcnRpZXM/LlswXTtcbiAgY29uc3QgbmFtZSA9IGxwPy5Qcm9kdWN0VGl0bGU7XG4gIGlmICghbmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IGltYWdlVXJsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgaW1hZ2VzID0gbHA/LkltYWdlcyA/PyBbXTtcbiAgY29uc3QgaGVybyA9IGltYWdlcy5maW5kKFxuICAgIChpbWcpID0+IGltZy5JbWFnZVB1cnBvc2UgPT09IFwiU3VwZXJIZXJvQXJ0XCIgfHwgaW1nLkltYWdlUHVycG9zZSA9PT0gXCJQb3N0ZXJcIlxuICApO1xuICBjb25zdCBib3hBcnQgPSBpbWFnZXMuZmluZCgoaW1nKSA9PiBpbWcuSW1hZ2VQdXJwb3NlID09PSBcIkJveEFydFwiKTtcbiAgY29uc3QgYW55SW1nID0gaW1hZ2VzWzBdO1xuICBjb25zdCBjaG9zZW4gPSBoZXJvIHx8IGJveEFydCB8fCBhbnlJbWc7XG4gIGlmIChjaG9zZW4/LlVyaSkge1xuICAgIGltYWdlVXJsID0gY2hvc2VuLlVyaS5zdGFydHNXaXRoKFwiLy9cIilcbiAgICAgID8gXCJodHRwczpcIiArIGNob3Nlbi5VcmlcbiAgICAgIDogY2hvc2VuLlVyaTtcbiAgfVxuXG4gIGNvbnN0IGRzYSA9IHByb2R1Y3QuRGlzcGxheVNrdUF2YWlsYWJpbGl0aWVzPy5bMF07XG4gIGNvbnN0IGF2YWlscyA9IGRzYT8uQXZhaWxhYmlsaXRpZXMgPz8gW107XG5cbiAgbGV0IGxpc3RQcmljZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYWxlUHJpY2U6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBsZXQgZW5kRGF0ZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGN1cnJlbmN5ID0gQ1VSUkVOQ1lfTUFQW3JlZ2lvbl0gfHwgXCJVU0RcIjtcblxuICBmb3IgKGNvbnN0IGEgb2YgYXZhaWxzKSB7XG4gICAgY29uc3QgcCA9IGEuT3JkZXJNYW5hZ2VtZW50RGF0YT8uUHJpY2U7XG4gICAgaWYgKCFwKSBjb250aW51ZTtcbiAgICBjb25zdCBtc3JwID0gcC5NU1JQID8/IHAuTGlzdFByaWNlO1xuICAgIGNvbnN0IHNhbGUgPSBwLkxpc3RQcmljZSA/PyBwLldob2xlc2FsZVByaWNlO1xuICAgIGlmIChtc3JwICE9IG51bGwgJiYgbGlzdFByaWNlID09IG51bGwpIGxpc3RQcmljZSA9IG1zcnA7XG4gICAgaWYgKHNhbGUgIT0gbnVsbCAmJiBzYWxlIDwgKG1zcnAgPz8gSW5maW5pdHkpKSB7XG4gICAgICBzYWxlUHJpY2UgPSBzYWxlO1xuICAgICAgZW5kRGF0ZSA9IGEuQ29uZGl0aW9ucz8uRW5kRGF0ZSA/PyBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGlmIChsaXN0UHJpY2UgPT0gbnVsbCAmJiBzYWxlUHJpY2UgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3Qgb3JpZ2luYWxDZW50cyA9IHRvQ2VudHMobGlzdFByaWNlKTtcbiAgY29uc3QgZGlzY291bnRlZENlbnRzID0gdG9DZW50cyhzYWxlUHJpY2UpID8/IG9yaWdpbmFsQ2VudHM7XG4gIGxldCBkaXNjb3VudFBlcmNlbnQgPSAwO1xuICBpZiAoXG4gICAgb3JpZ2luYWxDZW50cyAmJlxuICAgIGRpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgZGlzY291bnRlZENlbnRzIDwgb3JpZ2luYWxDZW50c1xuICApIHtcbiAgICBkaXNjb3VudFBlcmNlbnQgPSBNYXRoLnJvdW5kKFxuICAgICAgKChvcmlnaW5hbENlbnRzIC0gZGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBvcmlnaW5hbENlbnRzXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IG1hcmtldCA9IE1BUktFVF9NQVBbcmVnaW9uXSB8fCBcIlVTXCI7XG4gIGNvbnN0IHN0b3JlVXJsID0gYGh0dHBzOi8vd3d3Lnhib3guY29tLyR7bWFya2V0LnRvTG93ZXJDYXNlKCl9L2dhbWVzL3N0b3JlLyR7ZW5jb2RlVVJJQ29tcG9uZW50KG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKSl9LyR7aWR9YDtcblxuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIG5hbWUsXG4gICAgaW1hZ2VVcmwsXG4gICAgc3RvcmVVcmwsXG4gICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiWGJveCBTZXJpZXMgWHxTLCBYYm94IE9uZVwiLFxuICAgIGN1cnJlbmN5LFxuICAgIHByaWNlT3JpZ2luYWxDZW50czogb3JpZ2luYWxDZW50cyxcbiAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGlzY291bnRlZENlbnRzLFxuICAgIGRpc2NvdW50UGVyY2VudCxcbiAgICBkaXNjb3VudEVuZEF0OiBlbmREYXRlLFxuICB9O1xufVxuXG5leHBvcnQgY29uc3QgeGJveFByb3ZpZGVyOiBQcm92aWRlciA9IHtcbiAgcGxhdGZvcm06IFwieGJveFwiLFxuICBhc3luYyAqZmV0Y2hEZWFscyhzb3VyY2U6IFByb3ZpZGVyU291cmNlKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAgIGNvbnN0IG1hcmtldCA9IE1BUktFVF9NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgY29uc3QgbGFuZ3VhZ2UgPSBMQU5HX01BUFtzb3VyY2UucmVnaW9uXTtcbiAgICBpZiAoIW1hcmtldCB8fCAhbGFuZ3VhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFwieGJveFwiLCBzb3VyY2UucmVnaW9uLCBgUmVnaVx1MDBGM24gbm8gc29wb3J0YWRhOiAke3NvdXJjZS5yZWdpb259YCk7XG4gICAgfVxuXG4gICAgY29uc3QgaWRzID0gYXdhaXQgZmV0Y2hEZWFsSWRzKG1hcmtldCwgbGFuZ3VhZ2UpO1xuICAgIGlmIChpZHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IGZldGNoUHJvZHVjdERldGFpbHMoaWRzLCBtYXJrZXQsIGxhbmd1YWdlKTtcblxuICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBwcm9kdWN0cykge1xuICAgICAgY29uc3QgZGVhbCA9IGV4dHJhY3RHYW1lRGF0YShwcm9kdWN0LCBzb3VyY2UucmVnaW9uKTtcbiAgICAgIGlmIChkZWFsICYmIGRlYWwuZGlzY291bnRQZXJjZW50ID4gMCkge1xuICAgICAgICB5aWVsZCBkZWFsO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3N0ZWFtLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9zdGVhbS50c1wiO2ltcG9ydCB0eXBlIHsgUHJvdmlkZXIsIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5jb25zdCBDQ19NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcInVzXCIsXG4gIGJyOiBcImJyXCIsXG4gIHRyOiBcInRyXCIsXG59O1xuXG5jb25zdCBDVVJSRU5DWV9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTRFwiLFxuICBicjogXCJCUkxcIixcbiAgdHI6IFwiVFJZXCIsXG59O1xuXG5pbnRlcmZhY2UgU3RlYW1TZWFyY2hSZXN1bHQge1xuICBuYW1lOiBzdHJpbmc7XG4gIGxvZ286IHN0cmluZztcbiAgdG90YWxfY291bnQ/OiBudW1iZXI7XG4gIGl0ZW1zPzogQXJyYXk8e1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBpZDogbnVtYmVyO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBsb2dvOiBzdHJpbmc7XG4gICAgbG9nb19wb3NpdGlvbjogbnVtYmVyO1xuICB9Pjtcbn1cblxuaW50ZXJmYWNlIFN0ZWFtU2VhcmNoSXRlbSB7XG4gIG5hbWU6IHN0cmluZztcbiAgbG9nbzogc3RyaW5nO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb24odXJsOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICBsZXQgbGFzdEVycm9yOiB1bmtub3duO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDQ7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgICAgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvamF2YXNjcmlwdCwgKi8qXCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4gYXdhaXQgci5qc29uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN0ZWFtUHJpY2UocHJpY2VTdHI6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKCFwcmljZVN0cikgcmV0dXJuIG51bGw7XG4gIC8vIERlY29kZSBIVE1MIGVudGl0aWVzIGFuZCBzdHJpcCBub24tYnJlYWtpbmcgc3BhY2VzXG4gIGNvbnN0IHMgPSBwcmljZVN0clxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoLyYjXFxkKzsvZywgXCJcIilcbiAgICAudHJpbSgpO1xuICBpZiAoIXMgfHwgL15mcmVlL2kudGVzdChzKSB8fCAvZ3JhdGlzL2kudGVzdChzKSkgcmV0dXJuIG51bGw7XG4gIC8vIFN0cmlwIGN1cnJlbmN5IHN5bWJvbHMgYW5kIGxldHRlcnMsIGtlZXAgZGlnaXRzLCBkb3RzLCBjb21tYXNcbiAgY29uc3QgY2xlYW5lZCA9IHMucmVwbGFjZSgvW14wLTkuLC1dL2csIFwiXCIpO1xuICBpZiAoIWNsZWFuZWQpIHJldHVybiBudWxsO1xuICAvLyBTdGVhbSBmb3JtYXRzOiBcIiQxOS45OVwiIChVUyksIFwiUiQgODksOTBcIiAoQlIpLCBcIjExOSw5OSBUTFwiIChUUilcbiAgLy8gQWxzbyBoYW5kbGVzIFwiMS4wODksOTBcIiAoQlIgdGhvdXNhbmRzIHNlcGFyYXRvcilcbiAgY29uc3QgcGFydHMgPSBjbGVhbmVkLnNwbGl0KC9bLixdLyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggPj0gMikge1xuICAgIGNvbnN0IGxhc3RQYXJ0ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gICAgaWYgKGxhc3RQYXJ0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgY29uc3Qgd2hvbGUgPSBwYXJ0cy5zbGljZSgwLCAtMSkuam9pbihcIlwiKTtcbiAgICAgIGNvbnN0IG4gPSBOdW1iZXIod2hvbGUgKyBcIi5cIiArIGxhc3RQYXJ0KTtcbiAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUobikpIHJldHVybiBNYXRoLnJvdW5kKG4gKiAxMDApO1xuICAgIH1cbiAgfVxuICAvLyBGYWxsYmFjazogdHJlYXQgY29tbWFzIGFzIGRlY2ltYWwgc2VwYXJhdG9yc1xuICBjb25zdCBuID0gTnVtYmVyKGNsZWFuZWQucmVwbGFjZSgvLC9nLCBcIi5cIikpO1xuICBpZiAoTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gTWF0aC5yb3VuZChuICogMTAwKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmludGVyZmFjZSBTdGVhbVNlYXJjaFJlc3VsdEl0ZW0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGFwcGlkOiBzdHJpbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaFN0ZWFtRGVhbHMoXG4gIGNjOiBzdHJpbmcsXG4gIGN1cnJlbmN5OiBzdHJpbmcsXG4gIHJlZ2lvbjogc3RyaW5nXG4pOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gIGNvbnN0IHBhZ2VTaXplID0gMTAwO1xuICBjb25zdCBtYXhQYWdlcyA9IDMwO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChsZXQgcGFnZSA9IDA7IHBhZ2UgPCBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBwYWdlICogcGFnZVNpemU7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vc2VhcmNoL3Jlc3VsdHMvP3F1ZXJ5JnN0YXJ0PSR7c3RhcnR9YCArXG4gICAgICBgJmNvdW50PSR7cGFnZVNpemV9JmR5bmFtaWNfZGF0YT0mc29ydF9ieT1fQVNDJnNwZWNpYWxzPTFgICtcbiAgICAgIGAmc25yPTFfN183XzIzMF83JmluZmluaXRlPTEmY2M9JHtjY31gO1xuXG4gICAgbGV0IGRhdGE6IGFueTtcbiAgICB0cnkge1xuICAgICAgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgaHRtbDogc3RyaW5nID0gZGF0YT8ucmVzdWx0c19odG1sID8/IFwiXCI7XG4gICAgaWYgKCFodG1sIHx8IGh0bWwudHJpbSgpID09PSBcIlwiKSBicmVhaztcblxuICAgIC8vIFNwbGl0IEhUTUwgaW50byBpbmRpdmlkdWFsIHJlc3VsdCByb3dzIGJ5IGFuY2hvciBib3VuZGFyaWVzXG4gICAgY29uc3QgYW5jaG9yczogeyBhcHBJZDogc3RyaW5nOyBibG9jazogc3RyaW5nIH1bXSA9IFtdO1xuICAgIGNvbnN0IGFuY2hvclN0YXJ0cyA9IFsuLi5odG1sLm1hdGNoQWxsKC88YVtePl0qZGF0YS1kcy1hcHBpZD1cIihcXGQrKVwiL2cpXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFuY2hvclN0YXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXBwSWQgPSBhbmNob3JTdGFydHNbaV1bMV07XG4gICAgICBjb25zdCBzdGFydElkeCA9IGFuY2hvclN0YXJ0c1tpXS5pbmRleCE7XG4gICAgICBjb25zdCBlbmRJZHggPSBpICsgMSA8IGFuY2hvclN0YXJ0cy5sZW5ndGggPyBhbmNob3JTdGFydHNbaSArIDFdLmluZGV4ISA6IGh0bWwubGVuZ3RoO1xuICAgICAgYW5jaG9ycy5wdXNoKHsgYXBwSWQsIGJsb2NrOiBodG1sLnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpIH0pO1xuICAgIH1cblxuICAgIGxldCBmb3VuZE9uUGFnZSA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IHsgYXBwSWQsIGJsb2NrOiByb3cgfSBvZiBhbmNob3JzKSB7XG4gICAgICBpZiAoc2Vlbi5oYXMoYXBwSWQpKSBjb250aW51ZTtcbiAgICAgIHNlZW4uYWRkKGFwcElkKTtcblxuICAgICAgY29uc3QgbmFtZU1hdGNoID0gLzxzcGFuIGNsYXNzPVwidGl0bGVcIj4oW148XSspPFxcL3NwYW4+Ly5leGVjKHJvdyk7XG4gICAgICBpZiAoIW5hbWVNYXRjaCkgY29udGludWU7XG4gICAgICBjb25zdCBuYW1lID0gbmFtZU1hdGNoWzFdLnRyaW0oKTtcblxuICAgICAgY29uc3QgcGN0TWF0Y2ggPSAvZGlzY291bnRfcGN0W14+XSo+KFtePF0qKTwvLmV4ZWMocm93KTtcbiAgICAgIGNvbnN0IG9yaWdNYXRjaCA9IC9kaXNjb3VudF9vcmlnaW5hbF9wcmljZVtePl0qPihbXjxdKik8Ly5leGVjKHJvdyk7XG4gICAgICBjb25zdCBmaW5hbE1hdGNoID0gL2Rpc2NvdW50X2ZpbmFsX3ByaWNlW14+XSo+KFtePF0qKTwvLmV4ZWMocm93KTtcblxuICAgICAgY29uc3QgZGlzY291bnRQY3RTdHIgPSBwY3RNYXRjaD8uWzFdPy50cmltKCkucmVwbGFjZSgvWy0lXS9nLCBcIlwiKSA/PyBcIlwiO1xuICAgICAgY29uc3Qgb3JpZ2luYWxQcmljZVN0ciA9IG9yaWdNYXRjaD8uWzFdPy50cmltKCkgPz8gXCJcIjtcbiAgICAgIGNvbnN0IGZpbmFsUHJpY2VTdHIgPSBmaW5hbE1hdGNoPy5bMV0/LnRyaW0oKSA/PyBcIlwiO1xuXG4gICAgICBjb25zdCBkaXNjb3VudFBlcmNlbnQgPSBwYXJzZUludChkaXNjb3VudFBjdFN0cikgfHwgMDtcbiAgICAgIGNvbnN0IG9yaWdpbmFsQ2VudHMgPSBwYXJzZVN0ZWFtUHJpY2Uob3JpZ2luYWxQcmljZVN0cik7XG4gICAgICBjb25zdCBkaXNjb3VudGVkQ2VudHMgPSBwYXJzZVN0ZWFtUHJpY2UoZmluYWxQcmljZVN0cik7XG5cbiAgICAgIGlmICghb3JpZ2luYWxDZW50cyAmJiAhZGlzY291bnRlZENlbnRzKSBjb250aW51ZTtcbiAgICAgIGZvdW5kT25QYWdlKys7XG5cbiAgICAgIHlpZWxkIHtcbiAgICAgICAgaWQ6IGFwcElkLFxuICAgICAgICBuYW1lLFxuICAgICAgICBpbWFnZVVybDogYGh0dHBzOi8vY2RuLmFrYW1haS5zdGVhbXN0YXRpYy5jb20vc3RlYW0vYXBwcy8ke2FwcElkfS9oZWFkZXIuanBnYCxcbiAgICAgICAgc3RvcmVVcmw6IGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vYXBwLyR7YXBwSWR9L2AsXG4gICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIlBDXCIsXG4gICAgICAgIGN1cnJlbmN5LFxuICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG9yaWdpbmFsQ2VudHMsXG4gICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBkaXNjb3VudGVkQ2VudHMgPz8gb3JpZ2luYWxDZW50cyxcbiAgICAgICAgZGlzY291bnRQZXJjZW50LFxuICAgICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB0b3RhbENvdW50ID0gZGF0YT8udG90YWxfY291bnQgPz8gMDtcbiAgICBpZiAoc3RhcnQgKyBwYWdlU2l6ZSA+PSB0b3RhbENvdW50IHx8IGZvdW5kT25QYWdlID09PSAwKSBicmVhaztcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc3RlYW1Qcm92aWRlcjogUHJvdmlkZXIgPSB7XG4gIHBsYXRmb3JtOiBcInN0ZWFtXCIsXG4gIGFzeW5jICpmZXRjaERlYWxzKHNvdXJjZTogUHJvdmlkZXJTb3VyY2UpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gICAgY29uc3QgY2MgPSBDQ19NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgY29uc3QgY3VycmVuY3kgPSBDVVJSRU5DWV9NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgaWYgKCFjYyB8fCAhY3VycmVuY3kpIHtcbiAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFxuICAgICAgICBcInN0ZWFtXCIsXG4gICAgICAgIHNvdXJjZS5yZWdpb24sXG4gICAgICAgIGBSZWdpXHUwMEYzbiBubyBzb3BvcnRhZGE6ICR7c291cmNlLnJlZ2lvbn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIHlpZWxkKiBmZXRjaFN0ZWFtRGVhbHMoY2MsIGN1cnJlbmN5LCBzb3VyY2UucmVnaW9uKTtcbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL25pbnRlbmRvLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9uaW50ZW5kby50c1wiO2ltcG9ydCB0eXBlIHsgUHJvdmlkZXIsIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5jb25zdCBDVVJSRU5DWV9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTRFwiLFxuICBqcDogXCJKUFlcIixcbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV2l0aFJldHJ5KFxuICB1cmw6IHN0cmluZyxcbiAgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCA0OyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBoZWFkZXJzOiB7IFwidXNlci1hZ2VudFwiOiBVQSwgLi4uaGVhZGVycyB9LFxuICAgICAgfSk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwMyB8fCByLnN0YXR1cyA9PT0gNDI5KSB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCAxMDAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb24odXJsOiBzdHJpbmcsIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogUHJvbWlzZTxhbnk+IHtcbiAgY29uc3QgciA9IGF3YWl0IGZldGNoV2l0aFJldHJ5KHVybCwge1xuICAgIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgLi4uaGVhZGVycyxcbiAgfSk7XG4gIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9YCk7XG4gIHJldHVybiByLmpzb24oKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hIdG1sKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgciA9IGF3YWl0IGZldGNoV2l0aFJldHJ5KHVybCwge1xuICAgIGFjY2VwdDogXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcbiAgICBcImFjY2VwdC1sYW5ndWFnZVwiOiBcImphXCIsXG4gIH0pO1xuICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfWApO1xuICByZXR1cm4gci50ZXh0KCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RKc29uKHVybDogc3RyaW5nLCBib2R5OiBhbnksIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogUHJvbWlzZTxhbnk+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCA0OyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgLi4uaGVhZGVycyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgICB9KTtcbiAgICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4gYXdhaXQgci5qc29uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG4vLyAtLS0gVVMgZVNob3AgdmlhIEFsZ29saWEgKHNhbWUgQVBJIHRoZSBOaW50ZW5kbyB3ZWJzaXRlIHVzZXMpIC0tLVxuXG5jb25zdCBBTEdPTElBX0FQUF9JRCA9IFwiVTNCNkdSNFVBM1wiO1xuY29uc3QgQUxHT0xJQV9BUElfS0VZID0gXCJhMjljNjkyNzYzOGJmZDhjZWUyMzk5M2U1MWU3MjFjOVwiO1xuY29uc3QgQUxHT0xJQV9JTkRFWCA9IFwic3RvcmVfZ2FtZV9lbl91c1wiO1xuXG5pbnRlcmZhY2UgQWxnb2xpYUhpdCB7XG4gIG9iamVjdElEOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIG5zdWlkPzogc3RyaW5nO1xuICB1cmw/OiBzdHJpbmc7XG4gIHByb2R1Y3RJbWFnZVNxdWFyZT86IHN0cmluZztcbiAgcHJvZHVjdEltYWdlPzogc3RyaW5nO1xuICBwbGF0Zm9ybT86IHN0cmluZztcbiAgcHJpY2U/OiB7XG4gICAgcmVnUHJpY2U/OiBudW1iZXI7XG4gICAgc2FsZVByaWNlPzogbnVtYmVyO1xuICAgIHBlcmNlbnRPZmY/OiBudW1iZXI7XG4gICAgZGlzY291bnRlZD86IGJvb2xlYW47XG4gIH07XG4gIGVzaG9wRGV0YWlscz86IHtcbiAgICBkaXNjb3VudFByaWNlRW5kPzogc3RyaW5nO1xuICAgIGN1cnJlbmN5Pzogc3RyaW5nO1xuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiogZmV0Y2hOaW50ZW5kb1VTKCk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgY29uc3QgcGFnZVNpemUgPSA1MDA7XG4gIGxldCBwYWdlID0gMDtcbiAgY29uc3QgbWF4UGFnZXMgPSAyMDtcblxuICB3aGlsZSAocGFnZSA8IG1heFBhZ2VzKSB7XG4gICAgY29uc3QgcGFyYW1zID0gW1xuICAgICAgYHF1ZXJ5PWAsXG4gICAgICBgaGl0c1BlclBhZ2U9JHtwYWdlU2l6ZX1gLFxuICAgICAgYHBhZ2U9JHtwYWdlfWAsXG4gICAgICBgZmlsdGVycz1wcmljZS5kaXNjb3VudGVkOnRydWVgLFxuICAgICAgYGZhY2V0cz1bXCJwbGF0Zm9ybVwiXWAsXG4gICAgXS5qb2luKFwiJlwiKTtcblxuICAgIGxldCBkYXRhOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIGRhdGEgPSBhd2FpdCBwb3N0SnNvbihcbiAgICAgICAgYGh0dHBzOi8vJHtBTEdPTElBX0FQUF9JRH0tZHNuLmFsZ29saWEubmV0LzEvaW5kZXhlcy8ke0FMR09MSUFfSU5ERVh9L3F1ZXJ5YCxcbiAgICAgICAgeyBwYXJhbXMgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwieC1hbGdvbGlhLWFwcGxpY2F0aW9uLWlkXCI6IEFMR09MSUFfQVBQX0lELFxuICAgICAgICAgIFwieC1hbGdvbGlhLWFwaS1rZXlcIjogQUxHT0xJQV9BUElfS0VZLFxuICAgICAgICB9XG4gICAgICApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgaGl0czogQWxnb2xpYUhpdFtdID0gZGF0YT8uaGl0cyA/PyBbXTtcbiAgICBpZiAoaGl0cy5sZW5ndGggPT09IDApIGJyZWFrO1xuXG4gICAgZm9yIChjb25zdCBoaXQgb2YgaGl0cykge1xuICAgICAgY29uc3QgaWQgPSBoaXQubnN1aWQgfHwgaGl0Lm9iamVjdElEO1xuICAgICAgY29uc3QgbmFtZSA9IGhpdC50aXRsZTtcbiAgICAgIGlmICghbmFtZSB8fCAhaWQpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBwcmljZSA9IGhpdC5wcmljZTtcbiAgICAgIGlmICghcHJpY2UpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCByZWdQcmljZSA9IHByaWNlLnJlZ1ByaWNlO1xuICAgICAgY29uc3Qgc2FsZVByaWNlID0gcHJpY2Uuc2FsZVByaWNlO1xuICAgICAgaWYgKHJlZ1ByaWNlID09IG51bGwgJiYgc2FsZVByaWNlID09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBvcmlnaW5hbENlbnRzID0gcmVnUHJpY2UgIT0gbnVsbCA/IE1hdGgucm91bmQocmVnUHJpY2UgKiAxMDApIDogbnVsbDtcbiAgICAgIGNvbnN0IGRpc2NvdW50ZWRDZW50cyA9XG4gICAgICAgIHNhbGVQcmljZSAhPSBudWxsID8gTWF0aC5yb3VuZChzYWxlUHJpY2UgKiAxMDApIDogb3JpZ2luYWxDZW50cztcblxuICAgICAgbGV0IGRpc2NvdW50UGVyY2VudCA9IHByaWNlLnBlcmNlbnRPZmYgPz8gMDtcbiAgICAgIGlmIChcbiAgICAgICAgIWRpc2NvdW50UGVyY2VudCAmJlxuICAgICAgICBvcmlnaW5hbENlbnRzICYmXG4gICAgICAgIGRpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgICAgIGRpc2NvdW50ZWRDZW50cyA8IG9yaWdpbmFsQ2VudHNcbiAgICAgICkge1xuICAgICAgICBkaXNjb3VudFBlcmNlbnQgPSBNYXRoLnJvdW5kKFxuICAgICAgICAgICgob3JpZ2luYWxDZW50cyAtIGRpc2NvdW50ZWRDZW50cykgKiAxMDApIC8gb3JpZ2luYWxDZW50c1xuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbWFnZVVybCA9IGhpdC5wcm9kdWN0SW1hZ2VTcXVhcmUgfHwgaGl0LnByb2R1Y3RJbWFnZSB8fCBudWxsO1xuICAgICAgY29uc3Qgc3RvcmVVcmwgPSBoaXQudXJsXG4gICAgICAgID8gYGh0dHBzOi8vd3d3Lm5pbnRlbmRvLmNvbSR7aGl0LnVybH1gXG4gICAgICAgIDogYGh0dHBzOi8vd3d3Lm5pbnRlbmRvLmNvbS91cy9zdG9yZS9wcm9kdWN0cy8ke2lkfS9gO1xuXG4gICAgICB5aWVsZCB7XG4gICAgICAgIGlkLFxuICAgICAgICBuYW1lLFxuICAgICAgICBpbWFnZVVybCxcbiAgICAgICAgc3RvcmVVcmwsXG4gICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBoaXQucGxhdGZvcm0gfHwgXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgICAgY3VycmVuY3k6IFwiVVNEXCIsXG4gICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogb3JpZ2luYWxDZW50cyxcbiAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRpc2NvdW50ZWRDZW50cyxcbiAgICAgICAgZGlzY291bnRQZXJjZW50LFxuICAgICAgICBkaXNjb3VudEVuZEF0OiBoaXQuZXNob3BEZXRhaWxzPy5kaXNjb3VudFByaWNlRW5kIHx8IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBkYXRhPy5uYlBhZ2VzID8/IDA7XG4gICAgcGFnZSsrO1xuICAgIGlmIChwYWdlID49IHRvdGFsUGFnZXMpIGJyZWFrO1xuICB9XG59XG5cbi8vIC0tLSBKYXBhbiBlU2hvcCB2aWEgc3RvcmUtanAubmludGVuZG8uY29tIChTRkNDKSAtLS1cbi8vIFByaW1hcnk6IEhUTUwgc2NyYXBpbmcgb2YgdGhlIG9mZmljaWFsIHN0b3JlIGxpc3RpbmcuXG4vLyBGYWxsYmFjazogc2VhcmNoLm5pbnRlbmRvLmpwIEpTT04gQVBJLlxuXG5mdW5jdGlvbiBqcFllblRvQ2VudHMoczogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXMpIHJldHVybiBudWxsO1xuICBjb25zdCBjbGVhbmVkID0gcy5yZXBsYWNlKC9bXjAtOV0vZywgXCJcIik7XG4gIGNvbnN0IG4gPSBwYXJzZUludChjbGVhbmVkLCAxMCk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pIHx8IG4gPT09IDApIHJldHVybiBudWxsO1xuICAvLyBKUFkgaGFzIG5vIGRlY2ltYWxzOyBzdG9yZSBhcyB5ZW4gXHUwMEQ3IDEwMCBmb3IgY29uc2lzdGVuY3kgd2l0aCBvdGhlciBjdXJyZW5jaWVzXG4gIHJldHVybiBuICogMTAwO1xufVxuXG4vKiogUGFyc2UgcHJvZHVjdHMgZnJvbSB0aGUgc3RvcmUtanAubmludGVuZG8uY29tIEhUTUwgbGlzdGluZy5cbiAqICBUaGUgcGFnZSBlbWJlZHMgcHJvZHVjdCB0aWxlcyB3aXRoIHN0cnVjdHVyZWQgZGF0YSB3ZSBjYW4gcmVnZXgtZXh0cmFjdC4gKi9cbmZ1bmN0aW9uIHBhcnNlSnBTdG9yZUh0bWwoaHRtbDogc3RyaW5nKTogUmF3RGVhbFtdIHtcbiAgY29uc3QgZGVhbHM6IFJhd0RlYWxbXSA9IFtdO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgLy8gU3RyYXRlZ3kgMTogTG9vayBmb3IgSlNPTi1MRCBwcm9kdWN0IGRhdGFcbiAgY29uc3QganNvbkxkUmVnZXggPSAvPHNjcmlwdFtePl0qdHlwZT1bXCInXWFwcGxpY2F0aW9uXFwvbGRcXCtqc29uW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi9naTtcbiAgbGV0IGpzb25MZE1hdGNoO1xuICB3aGlsZSAoKGpzb25MZE1hdGNoID0ganNvbkxkUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbGQgPSBKU09OLnBhcnNlKGpzb25MZE1hdGNoWzFdKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gQXJyYXkuaXNBcnJheShsZCkgPyBsZCA6IGxkW1wiQGdyYXBoXCJdID8gbGRbXCJAZ3JhcGhcIl0gOiBbbGRdO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgIGlmIChpdGVtW1wiQHR5cGVcIl0gIT09IFwiUHJvZHVjdFwiICYmIGl0ZW1bXCJAdHlwZVwiXSAhPT0gXCJWaWRlb0dhbWVcIikgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkID0gaXRlbS5za3UgfHwgaXRlbS5wcm9kdWN0SUQgfHwgaXRlbS5pZGVudGlmaWVyO1xuICAgICAgICBpZiAoIWlkIHx8IHNlZW4uaGFzKGlkKSkgY29udGludWU7XG4gICAgICAgIHNlZW4uYWRkKGlkKTtcbiAgICAgICAgY29uc3Qgb2ZmZXIgPSBBcnJheS5pc0FycmF5KGl0ZW0ub2ZmZXJzKSA/IGl0ZW0ub2ZmZXJzWzBdIDogaXRlbS5vZmZlcnM7XG4gICAgICAgIGRlYWxzLnB1c2goe1xuICAgICAgICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSB8fCBcIlwiLFxuICAgICAgICAgIGltYWdlVXJsOiBpdGVtLmltYWdlIHx8IG51bGwsXG4gICAgICAgICAgc3RvcmVVcmw6IGl0ZW0udXJsIHx8IGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9pdGVtL3NvZnR3YXJlLyR7aWR9YCxcbiAgICAgICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgICAgICBjdXJyZW5jeTogXCJKUFlcIixcbiAgICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG51bGwsXG4gICAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGpwWWVuVG9DZW50cyhvZmZlcj8ucHJpY2UgfHwgb2ZmZXI/Lmxvd1ByaWNlKSxcbiAgICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IDAsXG4gICAgICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IC8qIGlnbm9yZSBtYWxmb3JtZWQgSlNPTi1MRCAqLyB9XG4gIH1cblxuICBpZiAoZGVhbHMubGVuZ3RoID4gMCkgcmV0dXJuIGRlYWxzO1xuXG4gIC8vIFN0cmF0ZWd5IDI6IEV4dHJhY3QgZnJvbSBlbWJlZGRlZCBfX05FWFRfREFUQV9fIG9yIHNpbWlsYXIgSlNPTiBibG9ic1xuICBjb25zdCBuZXh0RGF0YU1hdGNoID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoaHRtbCk7XG4gIGlmIChuZXh0RGF0YU1hdGNoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG5leHREYXRhTWF0Y2hbMV0pO1xuICAgICAgY29uc3QgcHJvZHVjdHMgPSBmaW5kUHJvZHVjdHNJblRyZWUoZGF0YSk7XG4gICAgICBmb3IgKGNvbnN0IHAgb2YgcHJvZHVjdHMpIHtcbiAgICAgICAgaWYgKHNlZW4uaGFzKHAuaWQpKSBjb250aW51ZTtcbiAgICAgICAgc2Vlbi5hZGQocC5pZCk7XG4gICAgICAgIGRlYWxzLnB1c2gocCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XG4gIH1cblxuICBpZiAoZGVhbHMubGVuZ3RoID4gMCkgcmV0dXJuIGRlYWxzO1xuXG4gIC8vIFN0cmF0ZWd5IDM6IFJlZ2V4IHNjcmFwZSBwcm9kdWN0IHRpbGVzIGZyb20gSFRNTFxuICAvLyBOaW50ZW5kbyBKUCBzdG9yZSB0aWxlcyB0eXBpY2FsbHkgaGF2ZSBkYXRhIGF0dHJpYnV0ZXMgb3Igc3RydWN0dXJlZCBjbGFzcyBwYXR0ZXJuc1xuICBjb25zdCB0aWxlUmVnZXggPVxuICAgIC9kYXRhLXBpZD1bXCInXShbXlwiJ10rKVtcIiddW1xcc1xcU10qPzxbXj5dKmNsYXNzPVtcIiddW15cIiddKnByb2R1Y3QtbmFtZVteXCInXSpbXCInXVtePl0qPihbXjxdKyk8W1xcc1xcU10qPyg/OmRhdGEtcHJpY2V8Y2xhc3M9W1wiJ11bXlwiJ10qcHJpY2VbXlwiJ10qW1wiJ10pW14+XSo+KFtePF0qKTwvZ2k7XG4gIGxldCB0aWxlTWF0Y2g7XG4gIHdoaWxlICgodGlsZU1hdGNoID0gdGlsZVJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgaWQgPSB0aWxlTWF0Y2hbMV0udHJpbSgpO1xuICAgIGlmICghaWQgfHwgc2Vlbi5oYXMoaWQpKSBjb250aW51ZTtcbiAgICBzZWVuLmFkZChpZCk7XG4gICAgZGVhbHMucHVzaCh7XG4gICAgICBpZCxcbiAgICAgIG5hbWU6IHRpbGVNYXRjaFsyXS50cmltKCksXG4gICAgICBpbWFnZVVybDogbnVsbCxcbiAgICAgIHN0b3JlVXJsOiBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vaXRlbS9zb2Z0d2FyZS8ke2lkfWAsXG4gICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgIGN1cnJlbmN5OiBcIkpQWVwiLFxuICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBudWxsLFxuICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGpwWWVuVG9DZW50cyh0aWxlTWF0Y2hbM10pLFxuICAgICAgZGlzY291bnRQZXJjZW50OiAwLFxuICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFN0cmF0ZWd5IDQ6IExvb2sgZm9yIGFueSBlbWJlZGRlZCBwcm9kdWN0IEpTT04gYXJyYXlzXG4gIGNvbnN0IGpzb25BcnJheVJlZ2V4ID0gL1xcWyhcXHtcIlteXCJdKmlkW15cIl0qXCJbOlxcc10qXCJbXlwiXSpcIltcXHNcXFNdKj9cXH0oPzosXFxzKlxce1tcXHNcXFNdKj9cXH0pKilcXF0vZztcbiAgbGV0IGFyck1hdGNoO1xuICB3aGlsZSAoKGFyck1hdGNoID0ganNvbkFycmF5UmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYXJyID0gSlNPTi5wYXJzZShcIltcIiArIGFyck1hdGNoWzFdICsgXCJdXCIpO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFycikge1xuICAgICAgICBjb25zdCBpZCA9IGl0ZW0uaWQgfHwgaXRlbS5uc3VpZCB8fCBpdGVtLnByb2R1Y3RJZCB8fCBpdGVtLnBpZDtcbiAgICAgICAgY29uc3QgbmFtZSA9IGl0ZW0udGl0bGUgfHwgaXRlbS5uYW1lIHx8IGl0ZW0ucHJvZHVjdE5hbWU7XG4gICAgICAgIGlmICghaWQgfHwgIW5hbWUgfHwgc2Vlbi5oYXMoU3RyaW5nKGlkKSkpIGNvbnRpbnVlO1xuICAgICAgICBzZWVuLmFkZChTdHJpbmcoaWQpKTtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBpdGVtLnNhbGVQcmljZSB8fCBpdGVtLnByaWNlIHx8IGl0ZW0uZGlzY291bnRQcmljZTtcbiAgICAgICAgY29uc3Qgb3JpZ1ByaWNlID0gaXRlbS5vcmlnaW5hbFByaWNlIHx8IGl0ZW0ucmVndWxhclByaWNlIHx8IGl0ZW0ubGlzdFByaWNlO1xuICAgICAgICBkZWFscy5wdXNoKHtcbiAgICAgICAgICBpZDogU3RyaW5nKGlkKSxcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGltYWdlVXJsOiBpdGVtLmltYWdlIHx8IGl0ZW0uaW1hZ2VVcmwgfHwgaXRlbS50aHVtYm5haWwgfHwgbnVsbCxcbiAgICAgICAgICBzdG9yZVVybDogaXRlbS51cmwgfHwgYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2l0ZW0vc29mdHdhcmUvJHtpZH1gLFxuICAgICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgICAgIGN1cnJlbmN5OiBcIkpQWVwiLFxuICAgICAgICAgIHByaWNlT3JpZ2luYWxDZW50czoganBZZW5Ub0NlbnRzKFN0cmluZyhvcmlnUHJpY2UgPz8gXCJcIikpLFxuICAgICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBqcFllblRvQ2VudHMoU3RyaW5nKHByaWNlID8/IFwiXCIpKSxcbiAgICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IHBhcnNlSW50KGl0ZW0uZGlzY291bnRSYXRlIHx8IGl0ZW0uZGlzY291bnRQZXJjZW50IHx8IFwiMFwiKSB8fCAwLFxuICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyAvKiBub3QgdmFsaWQgSlNPTiBhcnJheSAqLyB9XG4gIH1cblxuICByZXR1cm4gZGVhbHM7XG59XG5cbmZ1bmN0aW9uIGZpbmRQcm9kdWN0c0luVHJlZShub2RlOiB1bmtub3duLCByZXN1bHRzOiBSYXdEZWFsW10gPSBbXSk6IFJhd0RlYWxbXSB7XG4gIGlmICghbm9kZSB8fCB0eXBlb2Ygbm9kZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHJlc3VsdHM7XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSB7XG4gICAgZm9yIChjb25zdCB2IG9mIG5vZGUpIGZpbmRQcm9kdWN0c0luVHJlZSh2LCByZXN1bHRzKTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBjb25zdCBvYmogPSBub2RlIGFzIFJlY29yZDxzdHJpbmcsIGFueT47XG4gIGNvbnN0IGlkID0gb2JqLm5zdWlkIHx8IG9iai5pZCB8fCBvYmoucHJvZHVjdElkO1xuICBjb25zdCBuYW1lID0gb2JqLnRpdGxlIHx8IG9iai5uYW1lO1xuICBjb25zdCBoYXNQcmljZSA9IG9iai5wcmljZSAhPSBudWxsIHx8IG9iai5zYWxlUHJpY2UgIT0gbnVsbCB8fCBvYmoucmVndWxhclByaWNlICE9IG51bGw7XG4gIGlmIChpZCAmJiBuYW1lICYmIGhhc1ByaWNlKSB7XG4gICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgICAgbmFtZTogU3RyaW5nKG5hbWUpLFxuICAgICAgaW1hZ2VVcmw6IG9iai5pbWFnZSB8fCBvYmouaW1hZ2VVcmwgfHwgbnVsbCxcbiAgICAgIHN0b3JlVXJsOiBvYmoudXJsIHx8IGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9pdGVtL3NvZnR3YXJlLyR7aWR9YCxcbiAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgY3VycmVuY3k6IFwiSlBZXCIsXG4gICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGpwWWVuVG9DZW50cyhTdHJpbmcob2JqLnJlZ3VsYXJQcmljZSA/PyBvYmoub3JpZ2luYWxQcmljZSA/PyBvYmoucHJpY2UgPz8gXCJcIikpLFxuICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGpwWWVuVG9DZW50cyhTdHJpbmcob2JqLnNhbGVQcmljZSA/PyBvYmouZGlzY291bnRQcmljZSA/PyBvYmoucHJpY2UgPz8gXCJcIikpLFxuICAgICAgZGlzY291bnRQZXJjZW50OiBwYXJzZUludChvYmouZGlzY291bnRSYXRlIHx8IG9iai5kaXNjb3VudFBlcmNlbnQgfHwgXCIwXCIpIHx8IDAsXG4gICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgIH0pO1xuICB9XG4gIGZvciAoY29uc3QgdiBvZiBPYmplY3QudmFsdWVzKG9iaikpIGZpbmRQcm9kdWN0c0luVHJlZSh2LCByZXN1bHRzKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaE5pbnRlbmRvSlBfU3RvcmUoKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICBjb25zdCBtYXhQYWdlcyA9IDUwO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vbGlzdC9zb2Z0d2FyZWAgK1xuICAgICAgYD9zb2Z0VHlwZT1USVRMRSZpc1NhbGU9dHJ1ZSZzcnVsZT1tb3N0LXBvcHVsYXImcGFnZT0ke3BhZ2V9YDtcblxuICAgIGxldCBodG1sOiBzdHJpbmc7XG4gICAgdHJ5IHtcbiAgICAgIGh0bWwgPSBhd2FpdCBmZXRjaEh0bWwodXJsKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGRlYWxzID0gcGFyc2VKcFN0b3JlSHRtbChodG1sKTtcbiAgICBsZXQgbmV3T25QYWdlID0gMDtcbiAgICBmb3IgKGNvbnN0IGRlYWwgb2YgZGVhbHMpIHtcbiAgICAgIGlmIChzZWVuLmhhcyhkZWFsLmlkKSkgY29udGludWU7XG4gICAgICBzZWVuLmFkZChkZWFsLmlkKTtcbiAgICAgIG5ld09uUGFnZSsrO1xuXG4gICAgICBpZiAoXG4gICAgICAgIGRlYWwucHJpY2VPcmlnaW5hbENlbnRzICYmXG4gICAgICAgIGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMgJiZcbiAgICAgICAgZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cyA8IGRlYWwucHJpY2VPcmlnaW5hbENlbnRzICYmXG4gICAgICAgICFkZWFsLmRpc2NvdW50UGVyY2VudFxuICAgICAgKSB7XG4gICAgICAgIGRlYWwuZGlzY291bnRQZXJjZW50ID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAoKGRlYWwucHJpY2VPcmlnaW5hbENlbnRzIC0gZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cykgKiAxMDApIC9cbiAgICAgICAgICAgIGRlYWwucHJpY2VPcmlnaW5hbENlbnRzXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHlpZWxkIGRlYWw7XG4gICAgfVxuXG4gICAgaWYgKG5ld09uUGFnZSA9PT0gMCkgYnJlYWs7XG4gIH1cbn1cblxuLyoqIEZhbGxiYWNrOiBzZWFyY2gubmludGVuZG8uanAgSlNPTiBBUEkgKi9cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaE5pbnRlbmRvSlBfU2VhcmNoQXBpKCk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgY29uc3QgcGFnZVNpemUgPSAzMDA7XG4gIGxldCBzdGFydCA9IDA7XG4gIGNvbnN0IG1heEl0ZW1zID0gNjAwMDtcblxuICB3aGlsZSAoc3RhcnQgPCBtYXhJdGVtcykge1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9zZWFyY2gubmludGVuZG8uanAvbmludGVuZG9fc29mdC9zZWFyY2guanNvbmAgK1xuICAgICAgYD9vcHRfc3Nob3c9MSZmcT1zc2l0dV9zOm9uc2FsZStoYXJkX3M6MV9IQUNgICtcbiAgICAgIGAmcm93cz0ke3BhZ2VTaXplfSZzdGFydD0ke3N0YXJ0fSZzb3J0PXNjb3JlK2Rlc2NgO1xuXG4gICAgbGV0IGRhdGE6IGFueTtcbiAgICB0cnkge1xuICAgICAgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgZG9jcyA9IGRhdGE/LnJlc3VsdD8uaXRlbXMgPz8gW107XG4gICAgaWYgKGRvY3MubGVuZ3RoID09PSAwKSBicmVhaztcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBkb2NzKSB7XG4gICAgICBjb25zdCBpZCA9IGl0ZW0ubnN1aWQgfHwgaXRlbS5pZDtcbiAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLnRpdGxlO1xuICAgICAgaWYgKCFuYW1lIHx8ICFpZCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IG9yaWdpbmFsQ2VudHMgPSBqcFllblRvQ2VudHMoaXRlbS5wcHJpKTtcbiAgICAgIGNvbnN0IGRpc2NvdW50ZWRDZW50cyA9IGpwWWVuVG9DZW50cyhpdGVtLnNwcmkpID8/IG9yaWdpbmFsQ2VudHM7XG5cbiAgICAgIGxldCBkaXNjb3VudFBlcmNlbnQgPSBwYXJzZUludChpdGVtLmRzcGVyKSB8fCAwO1xuICAgICAgaWYgKFxuICAgICAgICAhZGlzY291bnRQZXJjZW50ICYmXG4gICAgICAgIG9yaWdpbmFsQ2VudHMgJiZcbiAgICAgICAgZGlzY291bnRlZENlbnRzICE9IG51bGwgJiZcbiAgICAgICAgZGlzY291bnRlZENlbnRzIDwgb3JpZ2luYWxDZW50c1xuICAgICAgKSB7XG4gICAgICAgIGRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAgICAgKChvcmlnaW5hbENlbnRzIC0gZGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBvcmlnaW5hbENlbnRzXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmICghb3JpZ2luYWxDZW50cyAmJiAhZGlzY291bnRlZENlbnRzKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgaW1hZ2VVcmwgPSBpdGVtLml1cmwgfHwgbnVsbDtcbiAgICAgIGNvbnN0IHN0b3JlVXJsID1cbiAgICAgICAgaXRlbS5zc2x1cmwgfHxcbiAgICAgICAgYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2l0ZW0vc29mdHdhcmUvJHtpZH1gO1xuXG4gICAgICB5aWVsZCB7XG4gICAgICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgICAgICBuYW1lLFxuICAgICAgICBpbWFnZVVybCxcbiAgICAgICAgc3RvcmVVcmwsXG4gICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgICBjdXJyZW5jeTogXCJKUFlcIixcbiAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBvcmlnaW5hbENlbnRzLFxuICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGlzY291bnRlZENlbnRzLFxuICAgICAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHN0YXJ0ICs9IHBhZ2VTaXplO1xuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBkYXRhPy5yZXN1bHQ/LnRvdGFsID8/IDA7XG4gICAgaWYgKHN0YXJ0ID49IHRvdGFsQ291bnQpIGJyZWFrO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaE5pbnRlbmRvSlAoKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAvLyBUcnkgdGhlIG9mZmljaWFsIHN0b3JlIGZpcnN0LCBmYWxsIGJhY2sgdG8gc2VhcmNoIEFQSVxuICBsZXQgY291bnQgPSAwO1xuICB0cnkge1xuICAgIGZvciBhd2FpdCAoY29uc3QgZGVhbCBvZiBmZXRjaE5pbnRlbmRvSlBfU3RvcmUoKSkge1xuICAgICAgY291bnQrKztcbiAgICAgIHlpZWxkIGRlYWw7XG4gICAgfVxuICB9IGNhdGNoIHsgLyogc3RvcmUgc2NyYXBlIGZhaWxlZCAqLyB9XG5cbiAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgLy8gRmFsbGJhY2sgdG8gc2VhcmNoIEFQSVxuICAgIHlpZWxkKiBmZXRjaE5pbnRlbmRvSlBfU2VhcmNoQXBpKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IG5pbnRlbmRvUHJvdmlkZXI6IFByb3ZpZGVyID0ge1xuICBwbGF0Zm9ybTogXCJuaW50ZW5kb1wiLFxuICBhc3luYyAqZmV0Y2hEZWFscyhzb3VyY2U6IFByb3ZpZGVyU291cmNlKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAgIGNvbnN0IGN1cnJlbmN5ID0gQ1VSUkVOQ1lfTUFQW3NvdXJjZS5yZWdpb25dO1xuICAgIGlmICghY3VycmVuY3kpIHtcbiAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFxuICAgICAgICBcIm5pbnRlbmRvXCIsXG4gICAgICAgIHNvdXJjZS5yZWdpb24sXG4gICAgICAgIGBSZWdpXHUwMEYzbiBubyBzb3BvcnRhZGE6ICR7c291cmNlLnJlZ2lvbn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2UucmVnaW9uID09PSBcInVzXCIpIHtcbiAgICAgIHlpZWxkKiBmZXRjaE5pbnRlbmRvVVMoKTtcbiAgICB9IGVsc2UgaWYgKHNvdXJjZS5yZWdpb24gPT09IFwianBcIikge1xuICAgICAgeWllbGQqIGZldGNoTmludGVuZG9KUCgpO1xuICAgIH1cbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL2luZGV4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9pbmRleC50c1wiO2V4cG9ydCB0eXBlIHsgUGxhdGZvcm0sIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsLCBSZWdpb25Db25maWcgfSBmcm9tIFwiLi90eXBlc1wiO1xuZXhwb3J0IHsgUExBVEZPUk1fTEFCRUxTLCBQTEFURk9STV9SRUdJT05TLCBQcm92aWRlckVycm9yIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuaW1wb3J0IHR5cGUgeyBQbGF0Zm9ybSwgUHJvdmlkZXIgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgcHNuUHJvdmlkZXIgfSBmcm9tIFwiLi9wc25cIjtcbmltcG9ydCB7IHhib3hQcm92aWRlciB9IGZyb20gXCIuL3hib3hcIjtcbmltcG9ydCB7IHN0ZWFtUHJvdmlkZXIgfSBmcm9tIFwiLi9zdGVhbVwiO1xuaW1wb3J0IHsgbmludGVuZG9Qcm92aWRlciB9IGZyb20gXCIuL25pbnRlbmRvXCI7XG5cbmNvbnN0IFBST1ZJREVSUzogUmVjb3JkPFBsYXRmb3JtLCBQcm92aWRlcj4gPSB7XG4gIHBzbjogcHNuUHJvdmlkZXIsXG4gIHhib3g6IHhib3hQcm92aWRlcixcbiAgc3RlYW06IHN0ZWFtUHJvdmlkZXIsXG4gIG5pbnRlbmRvOiBuaW50ZW5kb1Byb3ZpZGVyLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3ZpZGVyKHBsYXRmb3JtOiBQbGF0Zm9ybSk6IFByb3ZpZGVyIHtcbiAgcmV0dXJuIFBST1ZJREVSU1twbGF0Zm9ybV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxQcm92aWRlcnMoKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBPYmplY3QudmFsdWVzKFBST1ZJREVSUyk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9hcGkudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvYXBpLnRzXCI7LyoqXG4gKiBNaW5pbWFsIEhUVFAgcm91dGVyIGZvciB0aGUgL2FwaS8qIG5hbWVzcGFjZS4gVXNlcyBvbmx5IG5vZGU6aHR0cCB0eXBlcyBzb1xuICogd2UgZG9uJ3QgbmVlZCBFeHByZXNzIGFzIGEgZGVwZW5kZW5jeS5cbiAqXG4gKiBSb3V0ZXM6XG4gKiAgIEdFVCAgICAvZ2FtZXMgICAgICAgICAgICAgICAgICAgICAgbGlzdCB3aXRoIGNvbXB1dGVkIENMUCBwcmljZXNcbiAqICAgUEFUQ0ggIC9nYW1lcy86aWQgICAgICAgICAgICAgICAgICB7IHNlbGVjdGVkPywgcHVibGlzaGVkPywgbm90ZXM/IH1cbiAqICAgUE9TVCAgIC9yZWZyZXNoICAgICAgICAgICAgICAgICAgICBzY3JhcGUgUFNOIGFuZCB1cHNlcnRcbiAqICAgR0VUICAgIC9nYW1lcy9leHBvcnQuY3N2ICAgICAgICAgICBDU1Ygb2Ygc2VsZWN0ZWQgZ2FtZXNcbiAqICAgR0VUICAgIC9zZXR0aW5ncyAgICAgICAgICAgICAgICAgICBwcmljaW5nICsgcHNuIGNvbmZpZ1xuICogICBQVVQgICAgL3NldHRpbmdzICAgICAgICAgICAgICAgICAgIHBhcnRpYWwgdXBkYXRlIChwcmljaW5nIGFuZC9vciBwc24pXG4gKiAgIFBPU1QgICAvbW9jay9jbGVhciAgICAgICAgICAgICAgICAgZGVhY3RpdmF0ZSBhbGwgZ2FtZXNcbiAqL1xuaW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSBcIm5vZGU6aHR0cFwiO1xuaW1wb3J0IHsgc3RvcmUsIHR5cGUgR2FtZSwgdHlwZSBXYXRjaGVkR2FtZSB9IGZyb20gXCIuL3N0b3JlXCI7XG5pbXBvcnQgeyBjb21wdXRlU2FsZVByaWNlcyB9IGZyb20gXCIuL3ByaWNpbmdcIjtcbmltcG9ydCB7XG4gIGluc3BlY3RQcm9kdWN0VHlwZXMsXG4gIGlzRnVsbEdhbWVQcm9kdWN0LFxuICBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyxcbiAgbm9ybWFsaXplUHJvZHVjdCxcbiAgUGVyc2lzdGVkUXVlcnlOb3RGb3VuZEVycm9yLFxuICBQc25BcGlFcnJvcixcbn0gZnJvbSBcIi4vcHNuXCI7XG5pbXBvcnQge1xuICBmZXRjaENvbXBldGl0b3IsXG4gIG1hdGNoR2FtZXMsXG4gIENvbXBldGl0b3JGZXRjaEVycm9yLFxuICB0eXBlIENvbXBldGl0b3JDb25maWcsXG4gIHR5cGUgQ29tcGV0aXRvck1hdGNoLFxufSBmcm9tIFwiLi9jb21wZXRpdG9yc1wiO1xuaW1wb3J0IHsgZmV0Y2hQcm9kdWN0RGV0YWlsIH0gZnJvbSBcIi4vcHNuLXByb2R1Y3RcIjtcbmltcG9ydCB7XG4gIGdldFByb3ZpZGVyLFxuICBQTEFURk9STV9MQUJFTFMsXG4gIFBMQVRGT1JNX1JFR0lPTlMsXG4gIFByb3ZpZGVyRXJyb3IsXG59IGZyb20gXCIuL3Byb3ZpZGVycy9pbmRleFwiO1xuaW1wb3J0IHR5cGUgeyBQbGF0Zm9ybSwgUHJvdmlkZXJTb3VyY2UgfSBmcm9tIFwiLi9wcm92aWRlcnMvdHlwZXNcIjtcblxuLyoqIEV4dHJhY3QgYSBQU04gcHJvZHVjdCBpZCBmcm9tIGEgc3RvcmUgVVJMLiBBY2NlcHRzIGJvdGggZW4tVVMgYW5kIG90aGVyXG4gKiAgbG9jYWxlcywgYW5kIHRvbGVyYXRlcyB0cmFpbGluZyBzZWdtZW50cyAvIHF1ZXJ5IHN0cmluZ3MuICovXG5mdW5jdGlvbiBleHRyYWN0UHNuSWQoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzID0gU3RyaW5nKGlucHV0IHx8IFwiXCIpLnRyaW0oKTtcbiAgaWYgKCFzKSByZXR1cm4gbnVsbDtcbiAgLy8gQWxyZWFkeSBhbiBpZCAoVVBYWFhYLUNVU0FYWFhYWF8wMC1cdTIwMjYgb3IgRVBcdTIwMjYgLyBVQ1x1MjAyNilcbiAgaWYgKC9eW0EtWl17Mn1bMC05XXs0fS1bQS1aMC05XStfWzAtOV17Mn0oPzotW0EtWjAtOV0rKT8kLy50ZXN0KHMpKSByZXR1cm4gcztcbiAgY29uc3QgbSA9IC9cXC9wcm9kdWN0XFwvKFtBLVpdezJ9WzAtOV17NH0tW0EtWjAtOV0rX1swLTldezJ9KD86LVtBLVowLTldKyk/KS9pLmV4ZWMoXG4gICAgc1xuICApO1xuICByZXR1cm4gbSA/IG1bMV0udG9VcHBlckNhc2UoKSA6IG51bGw7XG59XG5cbmludGVyZmFjZSBXYXRjaGxpc3RBbGVydCB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIHByaWNlRGlzY291bnRlZFVzZDogbnVtYmVyIHwgbnVsbDtcbiAgc3RvcmVVcmw6IHN0cmluZyB8IG51bGw7XG59XG5cbi8qKiBEaWZmIHRoZSB3YXRjaGxpc3QgYWdhaW5zdCB0aGUgZnJlc2ggc2NyYXBlIGFuZCBmbGFnIHRyYW5zaXRpb25zLiBVcGRhdGVzXG4gKiAgZWFjaCB3YXRjaGVkIGVudHJ5J3MgbGFzdFN0YXR1cyBpbiBwbGFjZS4gUmV0dXJucyB0aGUgbGlzdCBvZiBnYW1lcyB0aGF0XG4gKiAgdHJhbnNpdGlvbmVkIG9mZl9zYWxlIFx1MjE5MiBvbl9zYWxlIHRoaXMgcnVuLiAqL1xuZnVuY3Rpb24gZGlmZldhdGNobGlzdChzZWVuOiBTZXQ8c3RyaW5nPiwgbm93SXNvOiBzdHJpbmcpOiBXYXRjaGxpc3RBbGVydFtdIHtcbiAgY29uc3QgYWxlcnRzOiBXYXRjaGxpc3RBbGVydFtdID0gW107XG4gIGZvciAoY29uc3QgdyBvZiBzdG9yZS5saXN0V2F0Y2hsaXN0KCkpIHtcbiAgICBjb25zdCBnYW1lID0gc3RvcmUuZ2V0R2FtZSh3LmlkKTtcbiAgICBjb25zdCBpblNhbGVOb3cgPVxuICAgICAgISFnYW1lICYmIGdhbWUuYWN0aXZlICYmIGdhbWUuZGlzY291bnRQZXJjZW50ID4gMCAmJiBzZWVuLmhhcyh3LmlkKTtcbiAgICBjb25zdCB0cmFuc2l0aW9uZWQgPSBpblNhbGVOb3cgJiYgdy5sYXN0U3RhdHVzICE9PSBcIm9uX3NhbGVcIjtcblxuICAgIGlmICh0cmFuc2l0aW9uZWQgJiYgZ2FtZSkge1xuICAgICAgYWxlcnRzLnB1c2goe1xuICAgICAgICBpZDogdy5pZCxcbiAgICAgICAgbmFtZTogZ2FtZS5uYW1lLFxuICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IGdhbWUuZGlzY291bnRQZXJjZW50LFxuICAgICAgICBwcmljZURpc2NvdW50ZWRVc2Q6XG4gICAgICAgICAgZ2FtZS5wcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsXG4gICAgICAgICAgICA/IGdhbWUucHJpY2VEaXNjb3VudGVkQ2VudHMgLyAxMDBcbiAgICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgc3RvcmVVcmw6IGdhbWUuc3RvcmVVcmwsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9yZS5wYXRjaFdhdGNoZWQody5pZCwge1xuICAgICAgbmFtZTogZ2FtZT8ubmFtZSB8fCB3Lm5hbWUsXG4gICAgICBsYXN0U3RhdHVzOiBpblNhbGVOb3cgPyBcIm9uX3NhbGVcIiA6IHcubGFzdFN0YXR1cyA9PT0gXCJ1bnNlZW5cIiA/IFwidW5zZWVuXCIgOiBcIm9mZl9zYWxlXCIsXG4gICAgICBsYXN0U2Vlbk9uU2FsZUF0OiBpblNhbGVOb3cgPyBub3dJc28gOiB3Lmxhc3RTZWVuT25TYWxlQXQsXG4gICAgICBsYXN0UHJpY2VDZW50czogZ2FtZT8ucHJpY2VEaXNjb3VudGVkQ2VudHMgPz8gdy5sYXN0UHJpY2VDZW50cyxcbiAgICAgIGxhc3REaXNjb3VudFBlcmNlbnQ6IGdhbWU/LmRpc2NvdW50UGVyY2VudCA/PyB3Lmxhc3REaXNjb3VudFBlcmNlbnQsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGFsZXJ0cztcbn1cblxudHlwZSBIYW5kbGVyID0gKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pID0+IFByb21pc2U8dm9pZD47XG5cbmludGVyZmFjZSBSb3V0ZSB7XG4gIG1ldGhvZDogc3RyaW5nO1xuICBwYXR0ZXJuOiBSZWdFeHA7XG4gIGtleXM6IHN0cmluZ1tdO1xuICBoYW5kbGVyOiBIYW5kbGVyO1xufVxuXG5jb25zdCByb3V0ZXM6IFJvdXRlW10gPSBbXTtcblxuZnVuY3Rpb24gcm91dGUobWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgaGFuZGxlcjogSGFuZGxlcikge1xuICBjb25zdCBrZXlzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICBcIl5cIiArXG4gICAgICBwYXRoLnJlcGxhY2UoLzooW2EtekEtWl9dKykvZywgKF8sIGspID0+IHtcbiAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICByZXR1cm4gXCIoW14vXSspXCI7XG4gICAgICB9KSArXG4gICAgICBcIiRcIlxuICApO1xuICByb3V0ZXMucHVzaCh7IG1ldGhvZCwgcGF0dGVybiwga2V5cywgaGFuZGxlciB9KTtcbn1cblxuZnVuY3Rpb24gc2VuZEpzb24ocmVzOiBTZXJ2ZXJSZXNwb25zZSwgc3RhdHVzOiBudW1iZXIsIGJvZHk6IHVua25vd24pIHtcbiAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpO1xuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZEJvZHkocmVxOiBJbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcmVxKSBjaHVua3MucHVzaChjaHVuayBhcyBCdWZmZXIpO1xuICBjb25zdCByYXcgPSBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGYtOFwiKTtcbiAgaWYgKCFyYXcpIHJldHVybiB7fTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyYXcpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge307XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2FtZURiS2V5KGc6IEdhbWUpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zy5wbGF0Zm9ybX06JHtnLnJlZ2lvbn06JHtnLmlkfWA7XG59XG5cbmZ1bmN0aW9uIHRvR2FtZU91dChnOiBHYW1lLCBjZmdQcmljaW5nID0gc3RvcmUuZ2V0U2V0dGluZ3MoKSkge1xuICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnUHJpY2luZywgZy5jdXJyZW5jeSB8fCBcIlVTRFwiKTtcbiAgY29uc3QgZGJLZXkgPSBnYW1lRGJLZXkoZyk7XG4gIGNvbnN0IG1hdGNoZXMgPSBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhkYktleSkgfHwgc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoZy5pZCk7XG4gIGNvbnN0IG1hcmtldE1pbiA9IG1hdGNoZXMubGVuZ3RoXG4gICAgPyBNYXRoLm1pbiguLi5tYXRjaGVzLm1hcCgobSkgPT4gbS5wcmljZUNscCkpXG4gICAgOiBudWxsO1xuICByZXR1cm4ge1xuICAgIGlkOiBnLmlkLFxuICAgIGRiS2V5LFxuICAgIHBsYXRmb3JtOiBnLnBsYXRmb3JtIHx8IFwicHNuXCIsXG4gICAgcmVnaW9uOiBnLnJlZ2lvbiB8fCBcInVzXCIsXG4gICAgY3VycmVuY3k6IGcuY3VycmVuY3kgfHwgXCJVU0RcIixcbiAgICBuYW1lOiBnLm5hbWUsXG4gICAgaW1hZ2VVcmw6IGcuaW1hZ2VVcmwsXG4gICAgc3RvcmVVcmw6IGcuc3RvcmVVcmwsXG4gICAgcGxhdGZvcm1zOiBnLnBsYXRmb3JtcyxcbiAgICBwcmljZU9yaWdpbmFsOlxuICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZURpc2NvdW50ZWQ6XG4gICAgICBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZU9yaWdpbmFsVXNkOlxuICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZURpc2NvdW50ZWRVc2Q6XG4gICAgICBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBkaXNjb3VudFBlcmNlbnQ6IGcuZGlzY291bnRQZXJjZW50LFxuICAgIGRpc2NvdW50RW5kQXQ6IGcuZGlzY291bnRFbmRBdCxcbiAgICBzZWxlY3RlZDogZy5zZWxlY3RlZCxcbiAgICBwdWJsaXNoZWQ6IGcucHVibGlzaGVkLFxuICAgIG5vdGVzOiBnLm5vdGVzLFxuICAgIHlvdXR1YmVVcmw6IGcueW91dHViZVVybCB8fCBcIlwiLFxuICAgIGFjdGl2ZTogZy5hY3RpdmUsXG4gICAgY29zdENscDogc2FsZT8uY29zdENscCA/PyBudWxsLFxuICAgIHByaW1hcmlhMTogc2FsZT8ucHJpbWFyaWExID8/IG51bGwsXG4gICAgcHJpbWFyaWEyOiBzYWxlPy5wcmltYXJpYTIgPz8gbnVsbCxcbiAgICBzZWN1bmRhcmlhOiBzYWxlPy5zZWN1bmRhcmlhID8/IG51bGwsXG4gICAgbWFya2V0TWluLFxuICAgIG1hcmtldENvdW50OiBtYXRjaGVzLmxlbmd0aCxcbiAgICBtYXJrZXRNYXRjaGVzOiBtYXRjaGVzLFxuICB9O1xufVxuXG4vLyBHRVQgL2dhbWVzXG5yb3V0ZShcIkdFVFwiLCBcIi9nYW1lc1wiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBzZWFyY2ggPSAodXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJzZWFyY2hcIikgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbWluRGlzY291bnQgPSBwYXJzZUludCh1cmwuc2VhcmNoUGFyYW1zLmdldChcIm1pbl9kaXNjb3VudFwiKSB8fCBcIjBcIiwgMTApIHx8IDA7XG4gIGNvbnN0IG9ubHlTZWxlY3RlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9zZWxlY3RlZFwiKSA9PT0gXCJ0cnVlXCI7XG4gIGNvbnN0IGhpZGVQdWJsaXNoZWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcImhpZGVfcHVibGlzaGVkXCIpID09PSBcInRydWVcIjtcbiAgY29uc3Qgb25seVdpdGhNYXJrZXQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcIm9ubHlfd2l0aF9tYXJrZXRcIikgPT09IFwidHJ1ZVwiO1xuICBjb25zdCBpbmNsdWRlSW5hY3RpdmUgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcImluY2x1ZGVfaW5hY3RpdmVcIikgPT09IFwidHJ1ZVwiO1xuICBjb25zdCBwbGF0Zm9ybUZpbHRlciA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwicGxhdGZvcm1cIikgfHwgXCJcIjtcbiAgY29uc3Qgc29ydCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwic29ydFwiKSB8fCBcImRpc2NvdW50XCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCk7XG4gIGlmICghaW5jbHVkZUluYWN0aXZlKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiAoZy5wbGF0Zm9ybSB8fCBcInBzblwiKSA9PT0gcGxhdGZvcm1GaWx0ZXIpO1xuICBpZiAobWluRGlzY291bnQgPiAwKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5kaXNjb3VudFBlcmNlbnQgPj0gbWluRGlzY291bnQpO1xuICBpZiAob25seVNlbGVjdGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5zZWxlY3RlZCk7XG4gIGlmIChoaWRlUHVibGlzaGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gIWcucHVibGlzaGVkKTtcbiAgaWYgKG9ubHlXaXRoTWFya2V0KSB7XG4gICAgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IGdhbWVEYktleShnKTtcbiAgICAgIHJldHVybiAoc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoa2V5KSB8fCBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhnLmlkKSkubGVuZ3RoID4gMDtcbiAgICB9KTtcbiAgfVxuICBpZiAoc2VhcmNoKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoKSk7XG5cbiAgaWYgKHNvcnQgPT09IFwicHJpY2VcIikgZ2FtZXMuc29ydCgoYSwgYikgPT4gKGEucHJpY2VEaXNjb3VudGVkQ2VudHMgPz8gMCkgLSAoYi5wcmljZURpc2NvdW50ZWRDZW50cyA/PyAwKSk7XG4gIGVsc2UgaWYgKHNvcnQgPT09IFwibmFtZVwiKSBnYW1lcy5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKTtcbiAgZWxzZSBpZiAoc29ydCA9PT0gXCJtYXJrZXRcIikge1xuICAgIGdhbWVzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGFtID0gc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoYS5pZCk7XG4gICAgICBjb25zdCBibSA9IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKGIuaWQpO1xuICAgICAgY29uc3QgYXAgPSBhbS5sZW5ndGggPyBNYXRoLm1pbiguLi5hbS5tYXAoKG0pID0+IG0ucHJpY2VDbHApKSA6IEluZmluaXR5O1xuICAgICAgY29uc3QgYnAgPSBibS5sZW5ndGggPyBNYXRoLm1pbiguLi5ibS5tYXAoKG0pID0+IG0ucHJpY2VDbHApKSA6IEluZmluaXR5O1xuICAgICAgcmV0dXJuIGFwIC0gYnA7XG4gICAgfSk7XG4gIH1cbiAgZWxzZSBnYW1lcy5zb3J0KChhLCBiKSA9PiBiLmRpc2NvdW50UGVyY2VudCAtIGEuZGlzY291bnRQZXJjZW50KTtcblxuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgZ2FtZXMubWFwKChnKSA9PiB0b0dhbWVPdXQoZywgY2ZnKSkpO1xufSk7XG5cbi8vIFBBVENIIC9nYW1lcy86aWQgXHUyMDE0IGlkIGNhbiBiZSBhIGNvbXBvc2l0ZSBkYktleSAocHNuOnVzOlVQWFhYWC0uLi4pIG9yIGEgYmFyZSBQU04gaWRcbnJvdXRlKFwiUEFUQ0hcIiwgXCIvZ2FtZXMvOmlkXCIsIGFzeW5jIChyZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgUGFydGlhbDxcbiAgICBQaWNrPEdhbWUsIFwic2VsZWN0ZWRcIiB8IFwicHVibGlzaGVkXCIgfCBcIm5vdGVzXCIgfCBcInlvdXR1YmVVcmxcIj5cbiAgPjtcbiAgY29uc3QgcGF0Y2g6IFBhcnRpYWw8R2FtZT4gPSB7fTtcbiAgaWYgKHR5cGVvZiBib2R5LnNlbGVjdGVkID09PSBcImJvb2xlYW5cIikgcGF0Y2guc2VsZWN0ZWQgPSBib2R5LnNlbGVjdGVkO1xuICBpZiAodHlwZW9mIGJvZHkucHVibGlzaGVkID09PSBcImJvb2xlYW5cIikgcGF0Y2gucHVibGlzaGVkID0gYm9keS5wdWJsaXNoZWQ7XG4gIGlmICh0eXBlb2YgYm9keS5ub3RlcyA9PT0gXCJzdHJpbmdcIikgcGF0Y2gubm90ZXMgPSBib2R5Lm5vdGVzO1xuICBpZiAodHlwZW9mIGJvZHkueW91dHViZVVybCA9PT0gXCJzdHJpbmdcIikgcGF0Y2gueW91dHViZVVybCA9IGJvZHkueW91dHViZVVybC50cmltKCk7XG4gIGNvbnN0IGlkID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5pZCk7XG4gIGxldCB1cGRhdGVkID0gc3RvcmUucGF0Y2hHYW1lKGlkLCBwYXRjaCk7XG4gIGlmICghdXBkYXRlZCkge1xuICAgIC8vIFRyeSBsZWdhY3kga2V5IChiYXJlIFBTTiBpZClcbiAgICB1cGRhdGVkID0gc3RvcmUucGF0Y2hHYW1lKGBwc246dXM6JHtpZH1gLCBwYXRjaCk7XG4gIH1cbiAgaWYgKCF1cGRhdGVkKSByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwibm90X2ZvdW5kXCIgfSk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB0b0dhbWVPdXQodXBkYXRlZCkpO1xufSk7XG5cbi8vIFBPU1QgL3JlZnJlc2ggXHUyMDE0IG11bHRpLXBsYXRmb3JtIHJlZnJlc2guIE9wdGlvbmFsIGJvZHk6IHsgcGxhdGZvcm0/LCByZWdpb24/IH1cbi8vIFdpdGggbm8gYm9keSwgcmVmcmVzaGVzIGFsbCBlbmFibGVkIHNvdXJjZXMuIFdpdGggcGxhdGZvcm0vcmVnaW9uLCByZWZyZXNoZXNcbi8vIG9ubHkgdGhhdCBzcGVjaWZpYyBzb3VyY2UuXG5yb3V0ZShcIlBPU1RcIiwgXCIvcmVmcmVzaFwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcbiAgICBjb25zdCB0YXJnZXRQbGF0Zm9ybSA9IGJvZHkucGxhdGZvcm0gYXMgUGxhdGZvcm0gfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdGFyZ2V0UmVnaW9uID0gYm9keS5yZWdpb24gYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qgc291cmNlcyA9IHN0b3JlLmdldFNvdXJjZXMoKS5maWx0ZXIoKHMpID0+IHtcbiAgICAgIGlmICghcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAodGFyZ2V0UGxhdGZvcm0gJiYgcy5wbGF0Zm9ybSAhPT0gdGFyZ2V0UGxhdGZvcm0pIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICh0YXJnZXRSZWdpb24gJiYgcy5yZWdpb24gIT09IHRhcmdldFJlZ2lvbikgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoc291cmNlcy5sZW5ndGggPT09IDAgJiYgIXRhcmdldFBsYXRmb3JtKSB7XG4gICAgICAvLyBGYWxsYmFjazogbGVnYWN5IFBTTi1vbmx5IHJlZnJlc2ggZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICAgIHJldHVybiBhd2FpdCBsZWdhY3lQc25SZWZyZXNoKHJlcyk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93SXNvID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIGNvbnN0IHJlc3VsdHM6IEFycmF5PHtcbiAgICAgIHBsYXRmb3JtOiBzdHJpbmc7XG4gICAgICByZWdpb246IHN0cmluZztcbiAgICAgIG5ld0NvdW50OiBudW1iZXI7XG4gICAgICB1cGRhdGVkOiBudW1iZXI7XG4gICAgICBkaXNhcHBlYXJlZDogbnVtYmVyO1xuICAgICAgdG90YWxTZWVuOiBudW1iZXI7XG4gICAgICBlcnJvcj86IHN0cmluZztcbiAgICB9PiA9IFtdO1xuICAgIGxldCBhbGxXYXRjaGxpc3RBbGVydHM6IFdhdGNobGlzdEFsZXJ0W10gPSBbXTtcblxuICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVyID0gZ2V0UHJvdmlkZXIoc291cmNlLnBsYXRmb3JtKTtcbiAgICAgICAgY29uc3Qgc2VlbktleXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgbGV0IG5ld0NvdW50ID0gMDtcbiAgICAgICAgbGV0IHVwZGF0ZWQgPSAwO1xuICAgICAgICBsZXQgdG90YWxTZWVuID0gMDtcblxuICAgICAgICAvLyBGb3IgUFNOLCBpbmplY3QgdGhlIGNhdGVnb3J5SWQgZnJvbSB0aGUgUFNOIGNvbmZpZyBpZiBub3Qgb24gc291cmNlXG4gICAgICAgIGNvbnN0IGVmZlNvdXJjZSA9IHsgLi4uc291cmNlIH07XG4gICAgICAgIGlmIChzb3VyY2UucGxhdGZvcm0gPT09IFwicHNuXCIgJiYgIXNvdXJjZS5jYXRlZ29yeUlkKSB7XG4gICAgICAgICAgZWZmU291cmNlLmNhdGVnb3J5SWQgPSBzdG9yZS5nZXRQc24oKS5kZWFsc0NhdGVnb3J5SWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGRlYWwgb2YgcHJvdmlkZXIuZmV0Y2hEZWFscyhlZmZTb3VyY2UpKSB7XG4gICAgICAgICAgdG90YWxTZWVuKys7XG4gICAgICAgICAgY29uc3QgZGJLZXkgPSBgJHtzb3VyY2UucGxhdGZvcm19OiR7c291cmNlLnJlZ2lvbn06JHtkZWFsLmlkfWA7XG4gICAgICAgICAgc2VlbktleXMuYWRkKGRiS2V5KTtcbiAgICAgICAgICBjb25zdCBleGlzdGluZyA9IHN0b3JlLmdldEdhbWVCeUNvbXBvc2l0ZShzb3VyY2UucGxhdGZvcm0sIHNvdXJjZS5yZWdpb24sIGRlYWwuaWQpO1xuICAgICAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIHN0b3JlLnVwc2VydEdhbWUoe1xuICAgICAgICAgICAgICBpZDogZGVhbC5pZCxcbiAgICAgICAgICAgICAgcGxhdGZvcm06IHNvdXJjZS5wbGF0Zm9ybSxcbiAgICAgICAgICAgICAgcmVnaW9uOiBzb3VyY2UucmVnaW9uLFxuICAgICAgICAgICAgICBuYW1lOiBkZWFsLm5hbWUsXG4gICAgICAgICAgICAgIGltYWdlVXJsOiBkZWFsLmltYWdlVXJsLFxuICAgICAgICAgICAgICBzdG9yZVVybDogZGVhbC5zdG9yZVVybCxcbiAgICAgICAgICAgICAgcGxhdGZvcm1zOiBkZWFsLmhhcmR3YXJlUGxhdGZvcm1zLFxuICAgICAgICAgICAgICBjdXJyZW5jeTogZGVhbC5jdXJyZW5jeSxcbiAgICAgICAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBkZWFsLnByaWNlT3JpZ2luYWxDZW50cyxcbiAgICAgICAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMsXG4gICAgICAgICAgICAgIGRpc2NvdW50UGVyY2VudDogZGVhbC5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IGRlYWwuZGlzY291bnRFbmRBdCxcbiAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICBwdWJsaXNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICBub3RlczogXCJcIixcbiAgICAgICAgICAgICAgeW91dHViZVVybDogXCJcIixcbiAgICAgICAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgICBmaXJzdFNlZW5BdDogbm93SXNvLFxuICAgICAgICAgICAgICBsYXN0U2VlbkF0OiBub3dJc28sXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogbm93SXNvLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXdDb3VudCsrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdG9yZS51cHNlcnRHYW1lKHtcbiAgICAgICAgICAgICAgLi4uZXhpc3RpbmcsXG4gICAgICAgICAgICAgIG5hbWU6IGRlYWwubmFtZSB8fCBleGlzdGluZy5uYW1lLFxuICAgICAgICAgICAgICBpbWFnZVVybDogZGVhbC5pbWFnZVVybCB8fCBleGlzdGluZy5pbWFnZVVybCxcbiAgICAgICAgICAgICAgc3RvcmVVcmw6IGRlYWwuc3RvcmVVcmwgfHwgZXhpc3Rpbmcuc3RvcmVVcmwsXG4gICAgICAgICAgICAgIHBsYXRmb3JtczogZGVhbC5oYXJkd2FyZVBsYXRmb3JtcyxcbiAgICAgICAgICAgICAgY3VycmVuY3k6IGRlYWwuY3VycmVuY3ksXG4gICAgICAgICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMsXG4gICAgICAgICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBkZWFsLnByaWNlRGlzY291bnRlZENlbnRzLFxuICAgICAgICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IGRlYWwuZGlzY291bnRQZXJjZW50LFxuICAgICAgICAgICAgICBkaXNjb3VudEVuZEF0OiBkZWFsLmRpc2NvdW50RW5kQXQsXG4gICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgbGFzdFNlZW5BdDogbm93SXNvLFxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5vd0lzbyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdXBkYXRlZCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRpc2FwcGVhcmVkID0gc3RvcmUubWFya0luYWN0aXZlSWZNaXNzaW5nKFxuICAgICAgICAgIHNlZW5LZXlzLFxuICAgICAgICAgIHNvdXJjZS5wbGF0Zm9ybSxcbiAgICAgICAgICBzb3VyY2UucmVnaW9uXG4gICAgICAgICk7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBwbGF0Zm9ybTogc291cmNlLnBsYXRmb3JtLFxuICAgICAgICAgIHJlZ2lvbjogc291cmNlLnJlZ2lvbixcbiAgICAgICAgICBuZXdDb3VudCxcbiAgICAgICAgICB1cGRhdGVkLFxuICAgICAgICAgIGRpc2FwcGVhcmVkLFxuICAgICAgICAgIHRvdGFsU2VlbixcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgcGxhdGZvcm06IHNvdXJjZS5wbGF0Zm9ybSxcbiAgICAgICAgICByZWdpb246IHNvdXJjZS5yZWdpb24sXG4gICAgICAgICAgbmV3Q291bnQ6IDAsXG4gICAgICAgICAgdXBkYXRlZDogMCxcbiAgICAgICAgICBkaXNhcHBlYXJlZDogMCxcbiAgICAgICAgICB0b3RhbFNlZW46IDAsXG4gICAgICAgICAgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZWNvbXB1dGVNYXRjaGVzKCk7XG4gICAgLy8gRGlmZiB3YXRjaGxpc3QgZm9yIFBTTiBzb3VyY2VzXG4gICAgY29uc3QgcHNuU2VlbklkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgZyBvZiBzdG9yZS5saXN0R2FtZXMoKSkge1xuICAgICAgaWYgKGcuYWN0aXZlICYmIGcucGxhdGZvcm0gPT09IFwicHNuXCIpIHBzblNlZW5JZHMuYWRkKGcuaWQpO1xuICAgIH1cbiAgICBhbGxXYXRjaGxpc3RBbGVydHMgPSBkaWZmV2F0Y2hsaXN0KHBzblNlZW5JZHMsIG5vd0lzbyk7XG5cbiAgICBjb25zdCB0b3RhbE5ldyA9IHJlc3VsdHMucmVkdWNlKChzLCByKSA9PiBzICsgci5uZXdDb3VudCwgMCk7XG4gICAgY29uc3QgdG90YWxVcGRhdGVkID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLnVwZGF0ZWQsIDApO1xuICAgIGNvbnN0IHRvdGFsRGlzYXBwZWFyZWQgPSByZXN1bHRzLnJlZHVjZSgocywgcikgPT4gcyArIHIuZGlzYXBwZWFyZWQsIDApO1xuICAgIGNvbnN0IHRvdGFsU2VlbiA9IHJlc3VsdHMucmVkdWNlKChzLCByKSA9PiBzICsgci50b3RhbFNlZW4sIDApO1xuICAgIGNvbnN0IHRvdGFsS2VwdCA9IHJlc3VsdHMucmVkdWNlKChzLCByKSA9PiBzICsgci50b3RhbFNlZW4gLSAoci5lcnJvciA/IHIudG90YWxTZWVuIDogMCksIDApO1xuXG4gICAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICAgIG5ldzogdG90YWxOZXcsXG4gICAgICB1cGRhdGVkOiB0b3RhbFVwZGF0ZWQsXG4gICAgICBkaXNhcHBlYXJlZDogdG90YWxEaXNhcHBlYXJlZCxcbiAgICAgIHRvdGFsU2VlbixcbiAgICAgIGtlcHQ6IHRvdGFsS2VwdCxcbiAgICAgIGZpbHRlcmVkQWRkT25zOiAwLFxuICAgICAgd2F0Y2hsaXN0QWxlcnRzOiBhbGxXYXRjaGxpc3RBbGVydHMsXG4gICAgICBzb3VyY2VSZXN1bHRzOiByZXN1bHRzLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBQZXJzaXN0ZWRRdWVyeU5vdEZvdW5kRXJyb3IpIHtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJwZXJzaXN0ZWRfcXVlcnlfbm90X2ZvdW5kXCIsXG4gICAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgICAgICBoaW50OlxuICAgICAgICAgIFwiQWJyZSBEZXZUb29scyA+IE5ldHdvcmsgZW4gbGEgcFx1MDBFMWdpbmEgZGUgb2ZlcnRhcyBkZSBQUyBTdG9yZSwgYnVzY2EgbGEgXCIgK1xuICAgICAgICAgIFwicmVxdWVzdCBhIC9hcGkvZ3JhcGhxbC92MS9vcD9vcGVyYXRpb25OYW1lPWNhdGVnb3J5R3JpZFJldHJpZXZlIHkgXCIgK1xuICAgICAgICAgIFwiYWN0dWFsaXphIGVsIGhhc2ggZW4gQWp1c3Rlcy5cIixcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZSBpbnN0YW5jZW9mIFBzbkFwaUVycm9yIHx8IGUgaW5zdGFuY2VvZiBQcm92aWRlckVycm9yKSB7XG4gICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDIsIHtcbiAgICAgICAgZXJyb3I6IFwicHJvdmlkZXJfZXJyb3JcIixcbiAgICAgICAgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UsXG4gICAgICAgIGhpbnQ6XG4gICAgICAgICAgXCJTaSBlc3RvIGNvcnJlIGVuIHVuYSBzYW5kYm94IChCb2x0L1N0YWNrQmxpdHopIGxhIElQIHB1ZWRlIGVzdGFyIFwiICtcbiAgICAgICAgICBcImJsb3F1ZWFkYS4gUHJvYlx1MDBFMSBkZXNkZSB0dSBtXHUwMEUxcXVpbmEgbyBzZXJ2aWRvci5cIixcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJpbnRlcm5hbFwiLCBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSB9KTtcbiAgfVxufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIGxlZ2FjeVBzblJlZnJlc2gocmVzOiBTZXJ2ZXJSZXNwb25zZSkge1xuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRQc24oKTtcbiAgY29uc3Qgc2VlbktleXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgbGV0IG5ld0NvdW50ID0gMDtcbiAgbGV0IHVwZGF0ZWQgPSAwO1xuICBsZXQgdG90YWxTZWVuID0gMDtcbiAgbGV0IGZpbHRlcmVkQWRkT25zID0gMDtcbiAgY29uc3Qgbm93SXNvID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuXG4gIGZvciBhd2FpdCAoY29uc3QgcmF3IG9mIGl0ZXJDYXRlZ29yeVByb2R1Y3RzKGNmZykpIHtcbiAgICB0b3RhbFNlZW4rKztcbiAgICBpZiAoIWNmZy5pbmNsdWRlQWRkT25zICYmICFpc0Z1bGxHYW1lUHJvZHVjdChyYXcpKSB7XG4gICAgICBmaWx0ZXJlZEFkZE9ucysrO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQcm9kdWN0KHJhdywgbm93SXNvKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIGNvbnRpbnVlO1xuICAgIG5vcm1hbGl6ZWQucGxhdGZvcm0gPSBcInBzblwiO1xuICAgIG5vcm1hbGl6ZWQucmVnaW9uID0gXCJ1c1wiO1xuICAgIG5vcm1hbGl6ZWQuY3VycmVuY3kgPSBcIlVTRFwiO1xuICAgIGNvbnN0IGRiS2V5ID0gYHBzbjp1czoke25vcm1hbGl6ZWQuaWR9YDtcbiAgICBzZWVuS2V5cy5hZGQoZGJLZXkpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gc3RvcmUuZ2V0R2FtZUJ5Q29tcG9zaXRlKFwicHNuXCIsIFwidXNcIiwgbm9ybWFsaXplZC5pZCk7XG4gICAgaWYgKCFleGlzdGluZykge1xuICAgICAgc3RvcmUudXBzZXJ0R2FtZShub3JtYWxpemVkKTtcbiAgICAgIG5ld0NvdW50Kys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3JlLnVwc2VydEdhbWUoe1xuICAgICAgICAuLi5leGlzdGluZyxcbiAgICAgICAgbmFtZTogbm9ybWFsaXplZC5uYW1lIHx8IGV4aXN0aW5nLm5hbWUsXG4gICAgICAgIGltYWdlVXJsOiBub3JtYWxpemVkLmltYWdlVXJsIHx8IGV4aXN0aW5nLmltYWdlVXJsLFxuICAgICAgICBzdG9yZVVybDogbm9ybWFsaXplZC5zdG9yZVVybCB8fCBleGlzdGluZy5zdG9yZVVybCxcbiAgICAgICAgcGxhdGZvcm1zOiBub3JtYWxpemVkLnBsYXRmb3JtcyxcbiAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBub3JtYWxpemVkLnByaWNlT3JpZ2luYWxDZW50cyxcbiAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IG5vcm1hbGl6ZWQucHJpY2VEaXNjb3VudGVkQ2VudHMsXG4gICAgICAgIGRpc2NvdW50UGVyY2VudDogbm9ybWFsaXplZC5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGRpc2NvdW50RW5kQXQ6IG5vcm1hbGl6ZWQuZGlzY291bnRFbmRBdCxcbiAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICBsYXN0U2VlbkF0OiBub3dJc28sXG4gICAgICAgIHVwZGF0ZWRBdDogbm93SXNvLFxuICAgICAgfSk7XG4gICAgICB1cGRhdGVkKys7XG4gICAgfVxuICB9XG4gIGNvbnN0IGRpc2FwcGVhcmVkID0gc3RvcmUubWFya0luYWN0aXZlSWZNaXNzaW5nKHNlZW5LZXlzLCBcInBzblwiLCBcInVzXCIpO1xuICByZWNvbXB1dGVNYXRjaGVzKCk7XG4gIGNvbnN0IHdhdGNobGlzdEFsZXJ0cyA9IGRpZmZXYXRjaGxpc3QobmV3IFNldChcbiAgICBbLi4uc2VlbktleXNdLm1hcChrID0+IGsucmVwbGFjZSgvXnBzbjp1czovLCBcIlwiKSlcbiAgKSwgbm93SXNvKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICBuZXc6IG5ld0NvdW50LFxuICAgIHVwZGF0ZWQsXG4gICAgZGlzYXBwZWFyZWQsXG4gICAgdG90YWxTZWVuLFxuICAgIGtlcHQ6IHNlZW5LZXlzLnNpemUsXG4gICAgZmlsdGVyZWRBZGRPbnMsXG4gICAgd2F0Y2hsaXN0QWxlcnRzLFxuICB9KTtcbn1cblxuLy8gR0VUIC9nYW1lcy9leHBvcnQuY3N2XG5yb3V0ZShcIkdFVFwiLCBcIi9nYW1lcy9leHBvcnQuY3N2XCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IG9ubHlTZWxlY3RlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9zZWxlY3RlZFwiKSAhPT0gXCJmYWxzZVwiO1xuXG4gIGxldCBnYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBpZiAob25seVNlbGVjdGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5zZWxlY3RlZCk7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3QgaGVhZGVyID0gW1xuICAgIFwiaWRcIixcbiAgICBcIm5hbWVcIixcbiAgICBcInBsYXRmb3Jtc1wiLFxuICAgIFwic3RvcmVfdXJsXCIsXG4gICAgXCJwcmljZV9vcmlnaW5hbF91c2RcIixcbiAgICBcInByaWNlX2Rpc2NvdW50ZWRfdXNkXCIsXG4gICAgXCJkaXNjb3VudF9wZXJjZW50XCIsXG4gICAgXCJkaXNjb3VudF9lbmRfYXRcIixcbiAgICBcImNvc3RfY2xwXCIsXG4gICAgXCJwcmltYXJpYV8xX2NscFwiLFxuICAgIFwicHJpbWFyaWFfMl9jbHBcIixcbiAgICBcInNlY3VuZGFyaWFfY2xwXCIsXG4gICAgXCJub3Rlc1wiLFxuICBdO1xuXG4gIGNvbnN0IGVzY2FwZSA9ICh2OiB1bmtub3duKSA9PiB7XG4gICAgY29uc3QgcyA9IHYgPT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcodik7XG4gICAgcmV0dXJuIC9bXCIsXFxuXS8udGVzdChzKSA/IGBcIiR7cy5yZXBsYWNlKC9cIi9nLCAnXCJcIicpfVwiYCA6IHM7XG4gIH07XG5cbiAgY29uc3QgbGluZXMgPSBbaGVhZGVyLmpvaW4oXCIsXCIpXTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgY29uc3Qgc2FsZSA9IGNvbXB1dGVTYWxlUHJpY2VzKGcucHJpY2VEaXNjb3VudGVkQ2VudHMsIGNmZyk7XG4gICAgbGluZXMucHVzaChcbiAgICAgIFtcbiAgICAgICAgZy5pZCxcbiAgICAgICAgZy5uYW1lLFxuICAgICAgICBnLnBsYXRmb3JtcyxcbiAgICAgICAgZy5zdG9yZVVybCA/PyBcIlwiLFxuICAgICAgICBnLnByaWNlT3JpZ2luYWxDZW50cyAhPSBudWxsID8gKGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwKS50b0ZpeGVkKDIpIDogXCJcIixcbiAgICAgICAgZy5wcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsID8gKGcucHJpY2VEaXNjb3VudGVkQ2VudHMgLyAxMDApLnRvRml4ZWQoMikgOiBcIlwiLFxuICAgICAgICBnLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgZy5kaXNjb3VudEVuZEF0ID8/IFwiXCIsXG4gICAgICAgIHNhbGU/LmNvc3RDbHAgPz8gXCJcIixcbiAgICAgICAgc2FsZT8ucHJpbWFyaWExID8/IFwiXCIsXG4gICAgICAgIHNhbGU/LnByaW1hcmlhMiA/PyBcIlwiLFxuICAgICAgICBzYWxlPy5zZWN1bmRhcmlhID8/IFwiXCIsXG4gICAgICAgIGcubm90ZXMsXG4gICAgICBdXG4gICAgICAgIC5tYXAoZXNjYXBlKVxuICAgICAgICAuam9pbihcIixcIilcbiAgICApO1xuICB9XG5cbiAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJ0ZXh0L2NzdjsgY2hhcnNldD11dGYtOFwiKTtcbiAgcmVzLnNldEhlYWRlcihcImNvbnRlbnQtZGlzcG9zaXRpb25cIiwgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPVwiYXBpcHNuLWdhbWVzLmNzdlwiJyk7XG4gIHJlcy5lbmQobGluZXMuam9pbihcIlxcblwiKSk7XG59KTtcblxuLy8gR0VUIC9zZXR0aW5nc1xucm91dGUoXCJHRVRcIiwgXCIvc2V0dGluZ3NcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIHByaWNpbmc6IHN0b3JlLmdldFNldHRpbmdzKCksXG4gICAgcHNuOiBzdG9yZS5nZXRQc24oKSxcbiAgICBzb3VyY2VzOiBzdG9yZS5nZXRTb3VyY2VzKCksXG4gIH0pO1xufSk7XG5cbi8vIFBVVCAvc2V0dGluZ3NcbnJvdXRlKFwiUFVUXCIsIFwiL3NldHRpbmdzXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHtcbiAgICBwcmljaW5nPzogUGFydGlhbDxSZXR1cm5UeXBlPHR5cGVvZiBzdG9yZS5nZXRTZXR0aW5ncz4+O1xuICAgIHBzbj86IFBhcnRpYWw8UmV0dXJuVHlwZTx0eXBlb2Ygc3RvcmUuZ2V0UHNuPj47XG4gICAgc291cmNlcz86IFByb3ZpZGVyU291cmNlW107XG4gIH07XG4gIGNvbnN0IHByaWNpbmcgPSBib2R5LnByaWNpbmcgPyBzdG9yZS51cGRhdGVTZXR0aW5ncyhib2R5LnByaWNpbmcpIDogc3RvcmUuZ2V0U2V0dGluZ3MoKTtcbiAgY29uc3QgcHNuID0gYm9keS5wc24gPyBzdG9yZS51cGRhdGVQc24oYm9keS5wc24pIDogc3RvcmUuZ2V0UHNuKCk7XG4gIGlmIChib2R5LnNvdXJjZXMpIHN0b3JlLnNldFNvdXJjZXMoYm9keS5zb3VyY2VzKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcHJpY2luZywgcHNuLCBzb3VyY2VzOiBzdG9yZS5nZXRTb3VyY2VzKCkgfSk7XG59KTtcblxuLy8gR0VUIC9wbGF0Zm9ybXMgXHUyMDE0IHN0YXRpYyBtZXRhZGF0YSBhYm91dCBhdmFpbGFibGUgcGxhdGZvcm1zICsgcmVnaW9uc1xucm91dGUoXCJHRVRcIiwgXCIvcGxhdGZvcm1zXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgbGFiZWxzOiBQTEFURk9STV9MQUJFTFMsIHJlZ2lvbnM6IFBMQVRGT1JNX1JFR0lPTlMgfSk7XG59KTtcblxuLy8gUE9TVCAvbW9jay9jbGVhciBcdTIwMTQgcmVtb3ZlIGFsbCBnYW1lc1xucm91dGUoXCJQT1NUXCIsIFwiL21vY2svY2xlYXJcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICBjb25zdCBnYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpO1xuICBmb3IgKGNvbnN0IGcgb2YgZ2FtZXMpIHtcbiAgICBzdG9yZS51cHNlcnRHYW1lKHsgLi4uZywgYWN0aXZlOiBmYWxzZSB9KTtcbiAgfVxuICAvLyBBbHNvIHdpcGUgZW50cmllcyBmdWxseSBieSByZS13cml0aW5nIHRoZSBmaWxlOlxuICBmb3IgKGNvbnN0IGcgb2YgZ2FtZXMpIHN0b3JlLnBhdGNoR2FtZShnLmlkLCB7IGFjdGl2ZTogZmFsc2UgfSk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGNsZWFyZWQ6IGdhbWVzLmxlbmd0aCB9KTtcbn0pO1xuXG5mdW5jdGlvbiByZWNvbXB1dGVNYXRjaGVzKCk6IHZvaWQge1xuICBjb25zdCBnYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBjb25zdCBwcm9kdWN0cyA9IHN0b3JlLmdldEFsbENvbXBldGl0b3JQcm9kdWN0cygpO1xuICBjb25zdCBtYXRjaGVzID0gbWF0Y2hHYW1lcyhnYW1lcywgcHJvZHVjdHMpO1xuICBzdG9yZS5zZXRDb21wZXRpdG9yTWF0Y2hlcyhtYXRjaGVzKTtcbn1cblxuLy8gR0VUIC9jb21wZXRpdG9ycyBcdTIwMTQgbGlzdCBzdG9yZXMgKyBsYXN0IHJlZnJlc2ggKyBtYXRjaCBzdGF0c1xucm91dGUoXCJHRVRcIiwgXCIvY29tcGV0aXRvcnNcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICBjb25zdCBjb21wZXRpdG9ycyA9IHN0b3JlLmdldENvbXBldGl0b3JzKCk7XG4gIGNvbnN0IHJlZnJlc2hlZEF0ID0gc3RvcmUuZ2V0Q29tcGV0aXRvclJlZnJlc2hlZEF0KCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7XG4gICAgY29tcGV0aXRvcnM6IGNvbXBldGl0b3JzLm1hcCgoYykgPT4gKHtcbiAgICAgIC4uLmMsXG4gICAgICByZWZyZXNoZWRBdDogcmVmcmVzaGVkQXRbYy5rZXldID8/IG51bGwsXG4gICAgICBwcm9kdWN0Q291bnQ6IHN0b3JlXG4gICAgICAgIC5nZXRBbGxDb21wZXRpdG9yUHJvZHVjdHMoZmFsc2UpXG4gICAgICAgIC5maWx0ZXIoKHApID0+IHAuc3RvcmVLZXkgPT09IGMua2V5KS5sZW5ndGgsXG4gICAgfSkpLFxuICB9KTtcbn0pO1xuXG4vLyBQVVQgL2NvbXBldGl0b3JzIFx1MjAxNCByZXBsYWNlIHRoZSBmdWxsIGxpc3QgKHVzZWQgZnJvbSBBanVzdGVzKVxucm91dGUoXCJQVVRcIiwgXCIvY29tcGV0aXRvcnNcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgeyBjb21wZXRpdG9ycz86IENvbXBldGl0b3JDb25maWdbXSB9O1xuICBpZiAoIUFycmF5LmlzQXJyYXkoYm9keS5jb21wZXRpdG9ycykpIHtcbiAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwiYmFkX3JlcXVlc3RcIiwgbWVzc2FnZTogXCJjb21wZXRpdG9yc1tdIHJlcXVpcmVkXCIgfSk7XG4gIH1cbiAgY29uc3QgY2xlYW46IENvbXBldGl0b3JDb25maWdbXSA9IGJvZHkuY29tcGV0aXRvcnNcbiAgICAuZmlsdGVyKChjKSA9PiBjICYmIHR5cGVvZiBjLmtleSA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgYy5kb21haW4gPT09IFwic3RyaW5nXCIpXG4gICAgLm1hcCgoYykgPT4gKHtcbiAgICAgIGtleTogYy5rZXkudHJpbSgpLFxuICAgICAgbGFiZWw6IChjLmxhYmVsIHx8IGMua2V5KS50cmltKCksXG4gICAgICBkb21haW46IGMuZG9tYWluLnJlcGxhY2UoL15odHRwcz86XFwvXFwvLywgXCJcIikucmVwbGFjZSgvXFwvLiokLywgXCJcIikudHJpbSgpLFxuICAgICAgdHlwZTogKFtcInNob3BpZnlcIiwgXCJ3b29jb21tZXJjZVwiLCBcImh0bWxcIiwgXCJhdXRvXCJdLmluY2x1ZGVzKGMudHlwZSkgPyBjLnR5cGUgOiBcImF1dG9cIiksXG4gICAgICBlbmFibGVkOiBjLmVuYWJsZWQgIT09IGZhbHNlLFxuICAgIH0pKTtcbiAgc3RvcmUuc2V0Q29tcGV0aXRvcnMoY2xlYW4pO1xuICByZWNvbXB1dGVNYXRjaGVzKCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGNvbXBldGl0b3JzOiBzdG9yZS5nZXRDb21wZXRpdG9ycygpIH0pO1xufSk7XG5cbi8vIFBPU1QgL2NvbXBldGl0b3JzL3JlZnJlc2ggXHUyMDE0IHNjcmFwZSBhbGwgZW5hYmxlZCBzdG9yZXMgYW5kIHJlY29tcHV0ZSBtYXRjaGVzXG5yb3V0ZShcIlBPU1RcIiwgXCIvY29tcGV0aXRvcnMvcmVmcmVzaFwiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGNvbXBldGl0b3JzID0gc3RvcmUuZ2V0Q29tcGV0aXRvcnMoKS5maWx0ZXIoKGMpID0+IGMuZW5hYmxlZCk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3QgcmVzdWx0czogQXJyYXk8eyBrZXk6IHN0cmluZzsgbGFiZWw6IHN0cmluZzsgY291bnQ6IG51bWJlcjsgZXJyb3I/OiBzdHJpbmcgfT4gPSBbXTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICBjb21wZXRpdG9ycy5tYXAoYXN5bmMgKGMpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgZmV0Y2hDb21wZXRpdG9yKGMpO1xuICAgICAgICBzdG9yZS5zZXRDb21wZXRpdG9yUHJvZHVjdHMoYy5rZXksIHByb2R1Y3RzLCBub3cpO1xuICAgICAgICByZXN1bHRzLnB1c2goeyBrZXk6IGMua2V5LCBsYWJlbDogYy5sYWJlbCwgY291bnQ6IHByb2R1Y3RzLmxlbmd0aCB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc3QgbXNnID1cbiAgICAgICAgICBlIGluc3RhbmNlb2YgQ29tcGV0aXRvckZldGNoRXJyb3JcbiAgICAgICAgICAgID8gZS5tZXNzYWdlXG4gICAgICAgICAgICA6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiZXJyb3JcIjtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHsga2V5OiBjLmtleSwgbGFiZWw6IGMubGFiZWwsIGNvdW50OiAwLCBlcnJvcjogbXNnIH0pO1xuICAgICAgfVxuICAgIH0pXG4gICk7XG5cbiAgcmVjb21wdXRlTWF0Y2hlcygpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyByZWZyZXNoZWRBdDogbm93LCByZXN1bHRzIH0pO1xufSk7XG5cbi8vIEdFVCAvZGVidWcvcHJvZHVjdC10eXBlcyBcdTIwMTQgb25lLXNob3QgcmVjb25uYWlzc2FuY2UgdXNlZCB0byBkZXNpZ24gdGhlXG4vLyBETEMvYWRkLW9uIGZpbHRlci4gUnVucyBhIGZ1bGwgUFNOIHNjcmFwZSBhbmQgcmVwb3J0cyBldmVyeSBjbGFzc2lmaWNhdGlvblxuLy8gKyBwcm9kdWN0VHlwZSBjb21ibyBpdCBzZWVzLCBwbHVzIGFsbCBvYnNlcnZlZCB0b3AtbGV2ZWwga2V5cy4gVGhlIHJlc3BvbnNlXG4vLyBpcyBzbWFsbCAoYSBjb3VwbGUgb2YgS0IpLCB0aGUgc2NyYXBlIGl0c2VsZiBpcyB0aGUgc2xvdyBwYXJ0Llxucm91dGUoXCJHRVRcIiwgXCIvZGVidWcvcHJvZHVjdC10eXBlc1wiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0UHNuKCk7XG4gICAgY29uc3QgcmVwb3J0ID0gYXdhaXQgaW5zcGVjdFByb2R1Y3RUeXBlcyhjZmcpO1xuICAgIHNlbmRKc29uKHJlcywgMjAwLCByZXBvcnQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBQc25BcGlFcnJvcikge1xuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICAgIGVycm9yOiBcInBzbl9hcGlfZXJyb3JcIixcbiAgICAgICAgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiaW50ZXJuYWxcIiwgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gIH1cbn0pO1xuXG4vLyBHRVQgL2dhbWVzLzppZC9kZXRhaWwgXHUyMDE0IGNhY2hlZCBwcm9kdWN0IGRldGFpbCAoaW1hZ2VyeSwgZGVzY3JpcHRpb25cdTIwMjYpLlxuLy8gUmV0dXJucyAyMDQgTm8gQ29udGVudCBpZiB3ZSBoYXZlbid0IGZldGNoZWQgaXQgeWV0OyB0aGUgY2xpZW50IHNob3VsZFxuLy8gdGhlbiBQT1NUIC9nYW1lcy86aWQvZGV0YWlsL3JlZnJlc2ggdG8gdHJpZ2dlciB0aGUgc2NyYXBlLlxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvOmlkL2RldGFpbFwiLCBhc3luYyAoX3JlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3QgZGV0YWlsID0gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChwYXJhbXMuaWQpO1xuICBpZiAoIWRldGFpbCkge1xuICAgIHJlcy5zdGF0dXNDb2RlID0gMjA0O1xuICAgIHJlcy5lbmQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgc2VuZEpzb24ocmVzLCAyMDAsIGRldGFpbCk7XG59KTtcblxuLy8gUE9TVCAvZ2FtZXMvOmlkL2RldGFpbC9yZWZyZXNoIFx1MjAxNCBzY3JhcGUgdGhlIHByb2R1Y3QgcGFnZSBhbmQgY2FjaGUgaXQuXG5yb3V0ZShcIlBPU1RcIiwgXCIvZ2FtZXMvOmlkL2RldGFpbC9yZWZyZXNoXCIsIGFzeW5jIChfcmVxLCByZXMsIHBhcmFtcykgPT4ge1xuICBjb25zdCBnYW1lID0gc3RvcmUuZ2V0R2FtZShwYXJhbXMuaWQpO1xuICBpZiAoIWdhbWUpIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiB9KTtcbiAgdHJ5IHtcbiAgICBjb25zdCBjZmcgPSBzdG9yZS5nZXRQc24oKTtcbiAgICBjb25zdCBkZXRhaWwgPSBhd2FpdCBmZXRjaFByb2R1Y3REZXRhaWwoXG4gICAgICBnYW1lLmlkLFxuICAgICAgZ2FtZS5zdG9yZVVybCB8fCBcIlwiLFxuICAgICAgY2ZnLnJlZ2lvblxuICAgICk7XG4gICAgc3RvcmUuc2V0UHJvZHVjdERldGFpbChnYW1lLmlkLCBkZXRhaWwpO1xuICAgIHNlbmRKc29uKHJlcywgMjAwLCBkZXRhaWwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBQc25BcGlFcnJvcikge1xuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICAgIGVycm9yOiBcInBzbl9hcGlfZXJyb3JcIixcbiAgICAgICAgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiaW50ZXJuYWxcIiwgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gIH1cbn0pO1xuXG4vLyBHRVQgL3dhdGNobGlzdCBcdTIwMTQgdHJhY2tlZCBnYW1lcyArIGN1cnJlbnQgc3RhdHVzIHNuYXBzaG90Llxucm91dGUoXCJHRVRcIiwgXCIvd2F0Y2hsaXN0XCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgaXRlbXM6IHN0b3JlLmxpc3RXYXRjaGxpc3QoKSB9KTtcbn0pO1xuXG4vLyBQT1NUIC93YXRjaGxpc3QgXHUyMDE0IGFkZCBhIGdhbWUgYnkgVVJMIG9yIGlkLiBCb2R5OiB7IGlucHV0OiBzdHJpbmcsIG5vdGVzPyB9XG5yb3V0ZShcIlBPU1RcIiwgXCIvd2F0Y2hsaXN0XCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgaW5wdXQ/OiBzdHJpbmc7IG5vdGVzPzogc3RyaW5nIH07XG4gIGNvbnN0IGlkID0gZXh0cmFjdFBzbklkKGJvZHkuaW5wdXQgPz8gXCJcIik7XG4gIGlmICghaWQpIHtcbiAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHtcbiAgICAgIGVycm9yOiBcImJhZF9pbnB1dFwiLFxuICAgICAgbWVzc2FnZTogXCJQZWdcdTAwRTEgbGEgVVJMIGRlbCBwcm9kdWN0byBlbiBQU04gbyB1biBJRCB0aXBvIFVQWFhYWC1DVVNBWFhYWFhfMDAtXHUyMDI2XCIsXG4gICAgfSk7XG4gIH1cbiAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5nZXRXYXRjaGVkKGlkKTtcbiAgaWYgKGV4aXN0aW5nKSByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIGV4aXN0aW5nKTtcblxuICBjb25zdCBnYW1lID0gc3RvcmUuZ2V0R2FtZShpZCk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3QgZW50cnk6IFdhdGNoZWRHYW1lID0ge1xuICAgIGlkLFxuICAgIG5hbWU6IGdhbWU/Lm5hbWUgfHwgaWQsXG4gICAgYWRkZWRBdDogbm93LFxuICAgIGxhc3RTdGF0dXM6IGdhbWU/LmFjdGl2ZSAmJiBnYW1lLmRpc2NvdW50UGVyY2VudCA+IDAgPyBcIm9uX3NhbGVcIiA6IGdhbWUgPyBcIm9mZl9zYWxlXCIgOiBcInVuc2VlblwiLFxuICAgIGxhc3RTZWVuT25TYWxlQXQ6XG4gICAgICBnYW1lPy5hY3RpdmUgJiYgZ2FtZS5kaXNjb3VudFBlcmNlbnQgPiAwID8gbm93IDogbnVsbCxcbiAgICBsYXN0UHJpY2VDZW50czogZ2FtZT8ucHJpY2VEaXNjb3VudGVkQ2VudHMgPz8gbnVsbCxcbiAgICBsYXN0RGlzY291bnRQZXJjZW50OiBnYW1lPy5kaXNjb3VudFBlcmNlbnQgPz8gMCxcbiAgICBub3RlczogKGJvZHkubm90ZXMgPz8gXCJcIikudHJpbSgpLFxuICB9O1xuICBzZW5kSnNvbihyZXMsIDIwMSwgc3RvcmUudXBzZXJ0V2F0Y2hlZChlbnRyeSkpO1xufSk7XG5cbi8vIFBBVENIIC93YXRjaGxpc3QvOmlkIFx1MjAxNCBlZGl0IG5vdGVzIG9yIG5hbWUuXG5yb3V0ZShcIlBBVENIXCIsIFwiL3dhdGNobGlzdC86aWRcIiwgYXN5bmMgKHJlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyBQYXJ0aWFsPFBpY2s8V2F0Y2hlZEdhbWUsIFwibm90ZXNcIiB8IFwibmFtZVwiPj47XG4gIGNvbnN0IHBhdGNoOiBQYXJ0aWFsPFdhdGNoZWRHYW1lPiA9IHt9O1xuICBpZiAodHlwZW9mIGJvZHkubm90ZXMgPT09IFwic3RyaW5nXCIpIHBhdGNoLm5vdGVzID0gYm9keS5ub3RlcztcbiAgaWYgKHR5cGVvZiBib2R5Lm5hbWUgPT09IFwic3RyaW5nXCIgJiYgYm9keS5uYW1lLnRyaW0oKSkgcGF0Y2gubmFtZSA9IGJvZHkubmFtZS50cmltKCk7XG4gIGNvbnN0IHVwZGF0ZWQgPSBzdG9yZS5wYXRjaFdhdGNoZWQocGFyYW1zLmlkLCBwYXRjaCk7XG4gIGlmICghdXBkYXRlZCkgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIm5vdF9mb3VuZFwiIH0pO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgdXBkYXRlZCk7XG59KTtcblxuLy8gREVMRVRFIC93YXRjaGxpc3QvOmlkXG5yb3V0ZShcIkRFTEVURVwiLCBcIi93YXRjaGxpc3QvOmlkXCIsIGFzeW5jIChfcmVxLCByZXMsIHBhcmFtcykgPT4ge1xuICBjb25zdCBvayA9IHN0b3JlLnJlbW92ZVdhdGNoZWQocGFyYW1zLmlkKTtcbiAgaWYgKCFvaykgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIm5vdF9mb3VuZFwiIH0pO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyByZW1vdmVkOiB0cnVlIH0pO1xufSk7XG5cbi8vIEdFVCAvZ2FtZXMvOmlkL21hdGNoZXMgXHUyMDE0IGFsbCBjb21wZXRpdG9yIG1hdGNoZXMgZm9yIGEgZ2FtZSAoZm9yIHBvcG92ZXJzKVxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvOmlkL21hdGNoZXNcIiwgYXN5bmMgKF9yZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IG1hdGNoZXM6IENvbXBldGl0b3JNYXRjaFtdID0gc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMocGFyYW1zLmlkKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgbWF0Y2hlcyB9KTtcbn0pO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVxdWVzdChcbiAgcmVxOiBJbmNvbWluZ01lc3NhZ2UsXG4gIHJlczogU2VydmVyUmVzcG9uc2Vcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IHBhdGhuYW1lID0gdXJsLnBhdGhuYW1lOyAvLyBWaXRlIHN0cmlwcyAvYXBpIHByZWZpeCB2aWEgdXNlKClcblxuICBmb3IgKGNvbnN0IHIgb2Ygcm91dGVzKSB7XG4gICAgaWYgKHIubWV0aG9kICE9PSByZXEubWV0aG9kKSBjb250aW51ZTtcbiAgICBjb25zdCBtID0gci5wYXR0ZXJuLmV4ZWMocGF0aG5hbWUpO1xuICAgIGlmICghbSkgY29udGludWU7XG4gICAgY29uc3QgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgci5rZXlzLmZvckVhY2goKGssIGkpID0+IChwYXJhbXNba10gPSBkZWNvZGVVUklDb21wb25lbnQobVtpICsgMV0pKSk7XG4gICAgcmV0dXJuIHIuaGFuZGxlcihyZXEsIHJlcywgcGFyYW1zKTtcbiAgfVxuICBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiwgcGF0aDogcGF0aG5hbWUgfSk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wbHVnaW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcGx1Z2luLnRzXCI7LyoqXG4gKiBWaXRlIHBsdWdpbiB0aGF0IG1vdW50cyB0aGUgYXBpcHNuIEpTT04gQVBJIG9uIHRoZSBkZXYgc2VydmVyLlxuICogRXZlcnl0aGluZyBydW5zIGluIGEgc2luZ2xlIE5vZGUgcHJvY2VzcyBcdTIwMTQgaWRlYWwgZm9yIEJvbHQgLyBTdGFja0JsaXR6LlxuICovXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiwgVml0ZURldlNlcnZlciB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tIFwibm9kZTpodHRwXCI7XG5pbXBvcnQgeyBoYW5kbGVSZXF1ZXN0IH0gZnJvbSBcIi4vYXBpXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGlQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImFwaXBzbi1hcGlcIixcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFxuICAgICAgICBcIi9hcGlcIixcbiAgICAgICAgKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlLCBuZXh0OiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgaGFuZGxlUmVxdWVzdChyZXEsIHJlcykuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlthcGldIHVuaGFuZGxlZFwiLCBlcnIpO1xuICAgICAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiBcImludGVybmFsX2Vycm9yXCIsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBTdHJpbmcoKGVyciBhcyBFcnJvcik/Lm1lc3NhZ2UgfHwgZXJyKSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH0sXG4gIH07XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVzs7O0FDRWxCLE9BQU8sUUFBUTtBQUNmLE9BQU8sVUFBVTtBQUNqQixTQUFTLHFCQUFxQjtBQUw0RyxJQUFNLDJDQUEyQztBQXNGM0wsSUFBTSxtQkFBb0M7QUFBQSxFQUN4QyxVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQUEsRUFDZixlQUFlO0FBQUEsRUFDZixnQkFBZ0I7QUFBQSxFQUNoQixTQUFTO0FBQ1g7QUFFQSxJQUFNLGtCQUFvQztBQUFBLEVBQ3hDLEVBQUUsVUFBVSxPQUFPLFFBQVEsTUFBTSxTQUFTLE1BQU0sWUFBWSxHQUFHO0FBQUEsRUFDL0QsRUFBRSxVQUFVLE9BQU8sUUFBUSxNQUFNLFNBQVMsTUFBTSxZQUFZLHVDQUF1QztBQUFBLEVBQ25HLEVBQUUsVUFBVSxRQUFRLFFBQVEsTUFBTSxTQUFTLE1BQU07QUFBQSxFQUNqRCxFQUFFLFVBQVUsUUFBUSxRQUFRLE1BQU0sU0FBUyxNQUFNO0FBQUEsRUFDakQsRUFBRSxVQUFVLFFBQVEsUUFBUSxN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Q0FBQztBQUNoQyxDQUFDO0FBRUQsZUFBc0IsY0FDcEIsS0FDQSxLQUNlO0FBQ2YsUUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLE9BQU8sS0FBSyxVQUFVO0FBQzlDLFFBQU0sV0FBVyxJQUFJO0FBRXJCLGFBQVcsS0FBSyxRQUFRO0FBQ3RCLFFBQUksRUFBRSxXQUFXLElBQUksT0FBUTtBQUM3QixVQUFNLElBQUksRUFBRSxRQUFRLEtBQUssUUFBUTtBQUNqQyxRQUFJLENBQUMsRUFBRztBQUNSLFVBQU0sU0FBaUMsQ0FBQztBQUN4QyxNQUFFLEtBQUssUUFBUSxDQUFDLEdBQUcsTUFBTyxPQUFPLENBQUMsSUFBSSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFO0FBQ25FLFdBQU8sRUFBRSxRQUFRLEtBQUssS0FBSyxNQUFNO0FBQUEsRUFDbkM7QUFDQSxXQUFTLEtBQUssS0FBSyxFQUFFLE9BQU8sYUFBYSxNQUFNLFNBQVMsQ0FBQztBQUMzRDs7O0FDL3ZCTyxTQUFTLFlBQW9CO0FBQ2xDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGdCQUFnQixRQUF1QjtBQUNyQyxhQUFPLFlBQVk7QUFBQSxRQUNqQjtBQUFBLFFBQ0EsQ0FBQyxLQUFzQixLQUFxQixTQUFxQjtBQUMvRCx3QkFBYyxLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUTtBQUNyQyxvQkFBUSxNQUFNLG1CQUFtQixHQUFHO0FBQ3BDLGdCQUFJLENBQUMsSUFBSSxhQUFhO0FBQ3BCLGtCQUFJLGFBQWE7QUFDakIsa0JBQUksVUFBVSxnQkFBZ0Isa0JBQWtCO0FBQ2hELGtCQUFJO0FBQUEsZ0JBQ0YsS0FBSyxVQUFVO0FBQUEsa0JBQ2IsT0FBTztBQUFBLGtCQUNQLFNBQVMsT0FBUSxLQUFlLFdBQVcsR0FBRztBQUFBLGdCQUNoRCxDQUFDO0FBQUEsY0FDSDtBQUFBLFlBQ0YsT0FBTztBQUNMLGtCQUFJLElBQUk7QUFBQSxZQUNWO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOzs7QWI5QkEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7QUFBQSxFQUM5QixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbIm0iLCAiVUEiLCAicGF0aCIsICJVQSIsICJmZXRjaEh0bWwiLCAiZXh0cmFjdE5leHREYXRhIiwgIlVBIiwgIlVBIiwgIkNVUlJFTkNZX01BUCIsICJmZXRjaEpzb24iLCAibiIsICJVQSIsICJDVVJSRU5DWV9NQVAiLCAiZmV0Y2hKc29uIiwgImZldGNoSHRtbCIsICJwYXRoIiwgInRvdGFsU2VlbiJdCn0K
