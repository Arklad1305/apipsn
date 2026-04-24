// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";

// server/store.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///home/project/server/store.ts";
var DEFAULT_SETTINGS = {
  usdToClp: 890,
  brlToClp: 170,
  tryToClp: 28,
  jpyToClp: 6.5,
  balanceDiscountUsd: 0.8,
  balanceDiscountBrl: 1,
  balanceDiscountTry: 1,
  primariaMult: 1.25,
  secundariaMult: 0.7,
  roundTo: 500,
  commercialRounding: true
};
var DEFAULT_HIT_PUBLISHERS = [
  "Sony Interactive Entertainment",
  "Insomniac Games",
  "Naughty Dog",
  "Santa Monica Studio",
  "Guerrilla",
  "Sucker Punch Productions",
  "Rockstar Games",
  "Ubisoft",
  "Electronic Arts",
  "Capcom",
  "Square Enix",
  "Bandai Namco",
  "Warner Bros",
  "Activision",
  "Bethesda",
  "FromSoftware",
  "Konami",
  "SEGA",
  "2K Games",
  "CD Projekt Red",
  "Remedy Entertainment",
  "Team Ninja"
];
var DEFAULT_SOURCES = [
  { platform: "psn", region: "us", enabled: true, categoryId: "" },
  { platform: "psn", region: "br", enabled: true, categoryId: "3f772501-f6f8-49b7-abac-874a88ca4897" },
  { platform: "xbox", region: "us", enabled: true },
  { platform: "xbox", region: "br", enabled: true },
  { platform: "xbox", region: "tr", enabled: true },
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
var TMP_FILE = path.resolve(__dirname, "../data/apipsn.json.tmp");
var BACKUP_FILE = path.resolve(__dirname, "../data/apipsn.backup.json");
var writing = false;
var pendingWrite = false;
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
    } else if (def.enabled) {
      const src = existing.find((s) => s.platform === def.platform && s.region === def.region);
      if (src && !src.enabled) src.enabled = true;
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
function buildDb(parsed) {
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
    watchlist: parsed.watchlist ?? {},
    autoRefreshIntervalHours: parsed.autoRefreshIntervalHours ?? 0,
    psPlusPrices: parsed.psPlusPrices ?? null,
    supabase: parsed.supabase ?? null,
    hitPublishers: parsed.hitPublishers ?? [...DEFAULT_HIT_PUBLISHERS]
  };
}
function emptyDb() {
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
    watchlist: {},
    autoRefreshIntervalHours: 0,
    psPlusPrices: null,
    supabase: null,
    hitPublishers: [...DEFAULT_HIT_PUBLISHERS]
  };
}
function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    try {
      const parsed = JSON.parse(raw);
      return buildDb(parsed);
    } catch {
      console.warn("[store] Main data file corrupted, loading backup");
      try {
        const backupRaw = fs.readFileSync(BACKUP_FILE, "utf-8");
        const backupParsed = JSON.parse(backupRaw);
        return buildDb(backupParsed);
      } catch {
        return emptyDb();
      }
    }
  } catch {
    return emptyDb();
  }
}
function maybeBackup() {
  try {
    const stat = fs.statSync(DATA_FILE);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs > 60 * 60 * 1e3) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }
  } catch {
  }
}
function persist() {
  if (writing) {
    pendingWrite = true;
    return;
  }
  writing = true;
  try {
    ensureDir();
    maybeBackup();
    fs.writeFileSync(TMP_FILE, JSON.stringify(db, null, 2));
    fs.renameSync(TMP_FILE, DATA_FILE);
  } finally {
    writing = false;
    if (pendingWrite) {
      pendingWrite = false;
      persist();
    }
  }
}
var db = load();
var saveTimer = null;
try {
  persist();
} catch {
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
  getAutoRefreshInterval() {
    return db.autoRefreshIntervalHours ?? 0;
  },
  setAutoRefreshInterval(hours) {
    db.autoRefreshIntervalHours = Math.max(0, hours);
    scheduleSave();
  },
  getPsPlusPrices() {
    return db.psPlusPrices;
  },
  setPsPlusPrices(data) {
    db.psPlusPrices = data;
    scheduleSave();
  },
  getSupabase() {
    return db.supabase ? { ...db.supabase } : null;
  },
  setSupabase(cfg) {
    db.supabase = cfg ? { ...cfg } : null;
    scheduleSave();
  },
  getHitPublishers() {
    return [...db.hitPublishers];
  },
  setHitPublishers(list) {
    db.hitPublishers = [...list];
    scheduleSave();
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
function roundCommercial(value) {
  if (value < 1e3) return Math.round(value / 100) * 100;
  return Math.ceil(value / 1e3) * 1e3 - 10;
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
function balanceDiscount(currency, cfg) {
  switch (currency) {
    case "BRL":
      return cfg.balanceDiscountBrl ?? 1;
    case "TRY":
      return cfg.balanceDiscountTry ?? 1;
    case "USD":
    default:
      return cfg.balanceDiscountUsd ?? 1;
  }
}
function computeSalePrices(priceCents, cfg, currency = "USD") {
  if (priceCents == null) return null;
  const price = priceCents / 100;
  const rate = exchangeRate(currency, cfg);
  const discount = balanceDiscount(currency, cfg);
  const cost = price * discount * rate;
  const costClp = roundTo(cost, cfg.roundTo);
  const primariaRaw = cost * cfg.primariaMult;
  const secundariaRaw = cost * cfg.secundariaMult;
  const primaria = cfg.commercialRounding !== false ? roundCommercial(primariaRaw) : roundTo(primariaRaw, cfg.roundTo);
  const secundaria = cfg.commercialRounding !== false ? roundCommercial(secundariaRaw) : roundTo(secundariaRaw, cfg.roundTo);
  const totalRevenue = primaria * 2 + secundaria;
  return {
    costClp,
    primaria,
    secundaria,
    totalRevenue,
    netProfit: totalRevenue - costClp
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
  let imageUrl = raw.tileImageUrl || null;
  if (!imageUrl) {
    const media = raw.media || [];
    const preferredPortrait = ["PORTRAIT_BANNER", "GAMEHUB_COVER_ART", "BOXART"];
    const fallbackRoles = ["MASTER", "PREVIEW_GAME_ART"];
    for (const m2 of media) {
      const role = String(m2?.role || "").toUpperCase();
      if (preferredPortrait.includes(role)) {
        imageUrl = m2.url ?? null;
        if (imageUrl) break;
      }
    }
    if (!imageUrl) {
      for (const m2 of media) {
        const role = String(m2?.role || "").toUpperCase();
        if (fallbackRoles.includes(role)) {
          imageUrl = m2.url ?? null;
          if (imageUrl) break;
        }
      }
    }
    if (!imageUrl && media[0]?.url) imageUrl = media[0].url;
  }
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
function extractTileImages(html) {
  const map = /* @__PURE__ */ new Map();
  const metas = [];
  const metaRe = /data-telemetry-meta=["'](\{[^"']*\})["']/g;
  let m;
  while ((m = metaRe.exec(html)) !== null) {
    try {
      const raw = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      const json = JSON.parse(raw);
      if (json.id) metas.push({ id: json.id, pos: m.index });
    } catch {
    }
  }
  const imgs = [];
  const imgRe = /data-qa="[^"]*game-art[^"]*image[^"]*"[^>]*(?:srcset="([^"]*\?w=440[^"]*)"|src="([^"]+)")/g;
  while ((m = imgRe.exec(html)) !== null) {
    let url = m[1] || m[2];
    if (!url) continue;
    if (url.includes(",")) url = url.split(",")[0].trim().split(/\s+/)[0];
    url = url.replace(/&amp;/g, "&");
    imgs.push({ url, pos: m.index });
  }
  for (let i = 0; i < metas.length; i++) {
    const meta = metas[i];
    const nextPos = metas[i + 1]?.pos ?? Infinity;
    const img = imgs.find((x) => x.pos > meta.pos && x.pos < nextPos);
    if (img) {
      const qIdx = img.url.indexOf("?");
      map.set(meta.id, qIdx > 0 ? img.url.substring(0, qIdx) : img.url);
    }
  }
  return map;
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
    const tileImages = extractTileImages(html);
    let newOnThisPage = 0;
    for (const [id, p] of found) {
      if (seen.has(id)) continue;
      seen.add(id);
      newOnThisPage++;
      const tileImg = tileImages.get(id);
      if (tileImg) p.tileImageUrl = tileImg;
      yield p;
    }
    if (newOnThisPage === 0) break;
  }
}

// server/competitors.ts
var UA2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
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
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "es-CL,es;q=0.9,en;q=0.8",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none"
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
      if (/product|sitemap[-_]\d+|page-sitemap/i.test(n) || nested.length < 10) {
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
  const titleTag = /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1]?.trim();
  const h1Tag = /<h1[^>]*>([^<]+)<\/h1>/i.exec(html)?.[1]?.trim();
  const productTitle = h1Tag || titleTag;
  if (productTitle) {
    const pricePatterns = [
      /class=["'][^"']*(?:price|precio)[^"']*["'][^>]*>\s*\$?\s*([\d.,]+)/i,
      /itemprop=["']price["'][^>]*>\s*\$?\s*([\d.,]+)/i,
      /data-price=["']([\d.,]+)["']/i,
      /\bprecio[^<]*\$\s*([\d.,]+)/i
    ];
    for (const re of pricePatterns) {
      const pm = re.exec(html);
      if (pm) {
        const price = parseClp(pm[1]);
        if (price != null) {
          const cleanTitle = productTitle.replace(/\s*[-–|·].*$/, "").trim();
          return { storeKey, title: cleanTitle, url, priceClp: price, available: true };
        }
      }
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
async function fetchJumpseller(storeKey, domain) {
  const base = `https://${domain}`;
  const homeHtml = await fetchText(base + "/");
  const categories = [];
  if (homeHtml) {
    const catRegex = /href=["'](\/categorias\/[^"'?#]+)["']/gi;
    let m;
    const seen = /* @__PURE__ */ new Set();
    while ((m = catRegex.exec(homeHtml)) !== null) {
      const path2 = m[1].replace(/\/+$/, "");
      if (!seen.has(path2)) {
        seen.add(path2);
        categories.push(path2);
      }
    }
  }
  if (!categories.includes("/categorias")) categories.unshift("/categorias");
  const products = [];
  const seenUrls = /* @__PURE__ */ new Set();
  const maxCategories = 20;
  const maxPages = 50;
  for (const cat of categories.slice(0, maxCategories)) {
    for (let page = 1; page <= maxPages; page++) {
      const url = `${base}${cat}?page=${page}`;
      const html = await fetchText(url);
      if (!html) break;
      let foundOnPage = 0;
      const productBlockRegex = /href=["'](\/productos\/[^"'?#]+)["'][^]*?(?=href=["']\/productos\/|$)/gi;
      let block;
      const productLinks = [];
      const linkRegex = /href=["'](\/productos\/[^"'?#]+)["']/gi;
      let lm;
      while ((lm = linkRegex.exec(html)) !== null) {
        const pUrl = base + lm[1];
        if (!seenUrls.has(pUrl)) {
          seenUrls.add(pUrl);
          productLinks.push(lm[1]);
        }
      }
      for (const link of productLinks) {
        const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const ctxRegex = new RegExp(
          `href=["']${escapedLink}["'][\\s\\S]{0,1000}`
        );
        const ctx = ctxRegex.exec(html)?.[0] ?? "";
        const titleMatch = /class=["'][^"']*(?:title|nombre|name)[^"']*["'][^>]*>([^<]{3,100})</.exec(ctx) || /alt=["']([^"']{3,100})["']/.exec(ctx) || /<span[^>]*>([^<]{3,80})<\/span>/.exec(ctx);
        const title = titleMatch?.[1]?.trim();
        const priceMatch = /class=["'][^"']*(?:price|precio)[^"']*["'][^>]*>[\s$]*([\d.,]+)/.exec(ctx) || /\$\s*([\d.,]+)/.exec(ctx) || /data-price=["']([\d.,]+)["']/.exec(ctx);
        const price = parseClp(priceMatch?.[1]);
        if (title && price != null) {
          products.push({
            storeKey,
            title,
            url: base + link,
            priceClp: price,
            available: true
          });
          foundOnPage++;
        }
      }
      if (foundOnPage === 0) break;
    }
  }
  if (!products.length) {
    throw new CompetitorFetchError(
      storeKey,
      `${domain}: no se encontraron productos en Jumpseller (sin /productos/ en el HTML)`
    );
  }
  return products;
}
async function fetchCompetitor(cfg) {
  if (cfg.type === "shopify") return fetchShopify(cfg.key, cfg.domain);
  if (cfg.type === "woocommerce") return fetchWoo(cfg.key, cfg.domain);
  if (cfg.type === "html") return fetchHtmlStorefront(cfg.key, cfg.domain);
  if (cfg.type === "jumpseller") return fetchJumpseller(cfg.key, cfg.domain);
  const homeHtml = await fetchText(`https://${cfg.domain}/`);
  if (homeHtml && (/\/productos\//i.test(homeHtml) || /\/categorias\//i.test(homeHtml))) {
    try {
      return await fetchJumpseller(cfg.key, cfg.domain);
    } catch (e) {
      if (!(e instanceof CompetitorFetchError)) throw e;
    }
  }
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
    portraitUrl: byRole["PORTRAIT_BANNER"] || byRole["GAMEHUB_COVER_ART"] || byRole["BOXART"] || null,
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
function extractContentDescriptors(obj) {
  const cr = obj.contentRating;
  if (cr?.contentDescriptors) return toStringArray(cr.contentDescriptors);
  if (cr?.descriptions) return toStringArray(cr.descriptions);
  return [];
}
function extractInteractiveElements(obj) {
  const cr = obj.contentRating;
  if (cr?.interactiveElements) return toStringArray(cr.interactiveElements);
  return [];
}
function extractGameFeatures(obj, html) {
  const features = [];
  for (const key of ["features", "upsellFeatures", "gameplayFeatures", "conceptFeatures"]) {
    const v = obj[key];
    if (v) features.push(...toStringArray(v));
  }
  if (features.length > 0) return features;
  const featureRegex = /data-qa="mfe[^"]*#checks?[^"]*"[^>]*>([^<]+)</gi;
  let m;
  while ((m = featureRegex.exec(html)) !== null) {
    const text = m[1].trim();
    if (text && !features.includes(text)) features.push(text);
  }
  const altRegex = /class="[^"]*(?:game-feature|psw-c-t-3)[^"]*"[^>]*>([^<]{5,120})</gi;
  while ((m = altRegex.exec(html)) !== null) {
    const text = m[1].trim();
    if (text && !features.includes(text)) features.push(text);
  }
  return features;
}
function extractPlayerInfo(obj, html) {
  let playerCount = str(obj.playerCount) || str(obj.localPlayerCount);
  let onlinePlayerCount = str(obj.onlinePlayerCount);
  let psPlusRequired = false;
  let inGamePurchases = null;
  const allText = html;
  const playerMatch = /(\d+\s*-\s*\d+)\s*player/i.exec(allText);
  if (!playerCount && playerMatch) playerCount = playerMatch[1].replace(/\s/g, "") + " players";
  const onlineMatch = /supports?\s+up\s+to\s+(\d+)\s+online\s+players?/i.exec(allText);
  if (!onlinePlayerCount && onlineMatch) onlinePlayerCount = `Up to ${onlineMatch[1]} online players`;
  if (/ps\s*plus\s*required/i.test(allText)) psPlusRequired = true;
  if (/in-game\s+purchases?\s+optional/i.test(allText)) inGamePurchases = "optional";
  else if (/in-game\s+purchases/i.test(allText)) inGamePurchases = "yes";
  return { playerCount, onlinePlayerCount, psPlusRequired, inGamePurchases };
}
function extractPsVersion(obj, html) {
  const classification = str(obj.localizedStoreDisplayClassification);
  if (classification && /ps[45]/i.test(classification)) return classification;
  const versionMatch = /(PS[45]\s+Version)/i.exec(html);
  return versionMatch ? versionMatch[1] : null;
}
function extractDiscountEndAt(obj, html) {
  const webctas = obj.webctas;
  const endTime = webctas?.[0]?.price?.endTime;
  if (endTime) return endTime;
  const price = obj.price;
  if (price?.endTime) return String(price.endTime);
  const offerMatch = /offer\s+ends?\s+(\d{1,2}\/\d{1,2}\/\d{4}[^<]*)/i.exec(html);
  if (offerMatch) return offerMatch[1].trim();
  return null;
}
function extractCarouselImages(obj, html) {
  const images = [];
  const seen = /* @__PURE__ */ new Set();
  const media = obj.media || [];
  for (const m2 of media) {
    const url = m2?.url;
    if (!url) continue;
    const role = String(m2?.role || "").toUpperCase();
    if (role === "SCREENSHOT" || role === "PREVIEW" || role === "PREVIEW_IMAGE") {
      if (!seen.has(url)) {
        seen.add(url);
        images.push(url);
      }
    }
  }
  const imgRegex = /data-qa="mfe-media-carousel[^"]*"[^>]*src="([^"]+)"/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    const url = m[1].replace(/&amp;/g, "&");
    if (!seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }
  const srcsetRegex = /data-qa="mfe-media-carousel[^"]*"[^>]*srcset="([^"]+)"/gi;
  while ((m = srcsetRegex.exec(html)) !== null) {
    const srcset = m[1].replace(/&amp;/g, "&");
    const urls = srcset.split(",").map((s) => s.trim().split(/\s+/)[0]);
    for (const url of urls) {
      if (url && !seen.has(url)) {
        seen.add(url);
        images.push(url);
      }
    }
  }
  return images;
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
  const playerInfo = extractPlayerInfo(obj, html);
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
    contentDescriptors: extractContentDescriptors(obj),
    interactiveElements: extractInteractiveElements(obj),
    playerCount: playerInfo.playerCount,
    onlinePlayerCount: playerInfo.onlinePlayerCount,
    psPlusRequired: playerInfo.psPlusRequired,
    inGamePurchases: playerInfo.inGamePurchases,
    gameFeatures: extractGameFeatures(obj, html),
    psVersion: extractPsVersion(obj, html),
    fileSize,
    platforms,
    media: extractMedia(obj),
    carouselImages: extractCarouselImages(obj, html),
    storeUrl: url,
    discountEndAt: extractDiscountEndAt(obj, html),
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
async function fetchWithRetry(url, init) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": UA4, accept: "application/json" },
        ...init
      });
      if (r.status === 429) {
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
async function fetchJson(url) {
  const r = await fetchWithRetry(url);
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json();
}
function extractIdsFromTree(node, seen, ids) {
  if (!node || typeof node !== "object") {
    if (typeof node === "string" && /^9[A-Z0-9]{11}$/.test(node) && !seen.has(node)) {
      seen.add(node);
      ids.push(node);
    }
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) extractIdsFromTree(v, seen, ids);
    return;
  }
  for (const v of Object.values(node)) {
    extractIdsFromTree(v, seen, ids);
  }
}
async function fetchDealIds(market, language) {
  const errors = [];
  try {
    const url = `https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed/Deal?Market=${market}&Language=${language}&ItemTypes=Game&deviceFamily=Windows.Xbox&count=2000&skipitems=0`;
    const data = await fetchJson(url);
    const items = data?.Items ?? [];
    const ids = items.map((it) => it.Id).filter(Boolean);
    if (ids.length > 0) return ids;
  } catch (e) {
    errors.push(`Reco: ${e.message}`);
  }
  const DEAL_LIST_ID = "f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e";
  try {
    const url = `https://catalog.gamepass.com/sigls/v2?id=${DEAL_LIST_ID}&language=${language.split("-")[0]}&market=${market}`;
    const data = await fetchJson(url);
    const items = Array.isArray(data) ? data : [];
    const ids = items.map((it) => it.id).filter((id) => !!id);
    if (ids.length > 0) return ids;
  } catch (e) {
    errors.push(`Sigls: ${e.message}`);
  }
  try {
    const url = `https://displaycatalog.mp.microsoft.com/v7.0/products/search?query=deal&market=${market}&languages=${language}&fieldsTemplate=details&top=200`;
    const data = await fetchJson(url);
    const products = data?.Products ?? [];
    const ids = products.map((p) => p.ProductId).filter(Boolean);
    if (ids.length > 0) return ids;
  } catch (e) {
    errors.push(`Search: ${e.message}`);
  }
  try {
    const browseUrl = `https://www.xbox.com/en-US/games/browse?FilteredByIds=DynamicChannel.GameDeals`;
    const r = await fetchWithRetry(browseUrl, {
      headers: {
        "user-agent": UA4,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": language
      }
    });
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }
    const html = await r.text();
    const ids = [];
    const seen = /* @__PURE__ */ new Set();
    const nextDataMatch = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(html);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        extractIdsFromTree(nextData, seen, ids);
      } catch {
      }
    }
    if (ids.length === 0) {
      const attrRegex = /data-[a-z-]*id=["']([A-Z0-9]{12})["']/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(html)) !== null) {
        const id = attrMatch[1];
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    if (ids.length === 0) {
      const idRegex = /\b(9[A-Z0-9]{11})\b/g;
      let idMatch;
      while ((idMatch = idRegex.exec(html)) !== null) {
        const id = idMatch[1];
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    if (ids.length > 0) return ids;
    errors.push(`HTML scrape: found 0 product IDs in ${html.length} bytes of HTML`);
  } catch (e) {
    errors.push(`HTML scrape: ${e.message}`);
  }
  throw new Error(`All Xbox deal endpoints failed: ${errors.join(" | ")}`);
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
          accept: "application/json, text/javascript, */*",
          cookie: "wants_mature_content=1; birthtime=568022401; Steam_Language=english"
        }
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
      }
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
    } catch (e) {
      if (page === 0) {
        throw new ProviderError("steam", region, `Steam search failed: ${e.message}`);
      }
      break;
    }
    const html = data?.results_html ?? "";
    if (!html || html.trim() === "") {
      if (page === 0) {
        const total = data?.total_count ?? "?";
        throw new ProviderError("steam", region, `Steam returned empty HTML (total_count=${total}, preview: ${html.slice(0, 200)})`);
      }
      break;
    }
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
async function fetchWithRetry2(url, headers) {
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
  const r = await fetchWithRetry2(url, {
    accept: "application/json",
    ...headers
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function fetchHtml3(url) {
  const r = await fetchWithRetry2(url, {
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
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
      }
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
var FILTER_STRATEGIES = [
  `facetFilters=${encodeURIComponent('[["generalFilters:Deals"]]')}`,
  `facetFilters=${encodeURIComponent('[["generalFilters:On sale"]]')}`,
  `numericFilters=${encodeURIComponent('["price.percentOff>0"]')}`,
  ""
  // no filter — fetch everything and filter in code
];
async function algoliaQuery(params) {
  return postJson(
    `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
    { params },
    {
      "x-algolia-application-id": ALGOLIA_APP_ID,
      "x-algolia-api-key": ALGOLIA_API_KEY
    }
  );
}
async function findWorkingFilter() {
  for (const filter of FILTER_STRATEGIES) {
    const extra = filter ? `&${filter}` : "";
    const params = `query=&hitsPerPage=5&page=0${extra}`;
    try {
      const data = await algoliaQuery(params);
      const nbHits = data?.nbHits ?? 0;
      if (nbHits > 0) {
        console.log(`[nintendo/us] Filter OK (nbHits=${nbHits}): ${filter || "(sin filtro)"}`);
        return filter;
      }
      console.log(`[nintendo/us] Filter miss (nbHits=0): ${filter || "(sin filtro)"}`);
    } catch (e) {
      console.log(`[nintendo/us] Filter error: ${filter || "(sin filtro)"} \u2192 ${e.message}`);
    }
  }
  console.warn("[nintendo/us] Ning\xFAn filtro de Algolia funcion\xF3");
  return "";
}
function parseNintendoHit(hit) {
  const id = hit.nsuid || hit.objectID;
  const name = hit.title;
  if (!name || !id) return null;
  const price = hit.price;
  if (!price || !price.salePrice) return null;
  const regPrice = price.regPrice;
  const salePrice = price.salePrice;
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
  return {
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
async function* fetchNintendoUS() {
  const filter = await findWorkingFilter();
  const pageSize = 500;
  const maxPages = 50;
  let emitted = 0;
  let pagesWithoutNew = 0;
  for (let page = 0; page < maxPages; page++) {
    const extra = filter ? `&${filter}` : "";
    const params = `query=&hitsPerPage=${pageSize}&page=${page}${extra}`;
    let data;
    try {
      data = await algoliaQuery(params);
    } catch (e) {
      if (page === 0) {
        throw new ProviderError("nintendo", "us", `Algolia request failed: ${e.message}`);
      }
      break;
    }
    const hits = data?.hits ?? [];
    if (hits.length === 0) {
      if (page === 0) {
        const msg = data?.message || `0 hits (nbHits=${data?.nbHits})`;
        throw new ProviderError("nintendo", "us", `Algolia returned no results: ${msg}`);
      }
      break;
    }
    let pageDeals = 0;
    for (const hit of hits) {
      const deal = parseNintendoHit(hit);
      if (deal) {
        pageDeals++;
        emitted++;
        yield deal;
      }
    }
    if (!filter && pageDeals === 0) {
      pagesWithoutNew++;
      if (pagesWithoutNew >= 3) break;
    } else {
      pagesWithoutNew = 0;
    }
    const totalPages = data?.nbPages ?? 0;
    if (page + 1 >= totalPages) break;
  }
  if (emitted === 0) {
    throw new ProviderError("nintendo", "us", "No se encontraron juegos en oferta en Nintendo US");
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

// server/exchange.ts
async function fetchIndicador(codigo) {
  const url = `https://mindicador.cl/api/${codigo}`;
  try {
    const r = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "apipsn/1.0" }
    });
    if (!r.ok) return null;
    const data = await r.json();
    const value = data?.serie?.[0]?.valor;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
async function fetchExchangeRates() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const errors = [];
  const usd = await fetchIndicador("dolar");
  if (usd == null) errors.push("USD no disponible en mindicador.cl");
  return {
    usdToClp: usd,
    brlToClp: null,
    tryToClp: null,
    fetchedAt: now,
    errors
  };
}

// server/scheduler.ts
var timer = null;
var lastAutoRefreshAt = null;
function getLastAutoRefreshAt() {
  return lastAutoRefreshAt;
}
function startScheduler(refreshFn) {
  reschedule(refreshFn);
}
function reschedule(refreshFn) {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const intervalHours = store.getAutoRefreshInterval();
  if (!intervalHours || intervalHours <= 0) return;
  const ms = intervalHours * 60 * 60 * 1e3;
  timer = setInterval(async () => {
    try {
      await refreshFn();
      lastAutoRefreshAt = (/* @__PURE__ */ new Date()).toISOString();
    } catch {
    }
  }, ms);
}

// server/ps-plus.ts
var PLAN_DEFS = [
  { tier: "essential", duration: "1m", label: "PS Plus Essential \u2014 1 Mes", searchTerms: ["playstation plus essential 1 mes", "ps plus essential 1 mes", "ps plus essential 1 month", "psn plus essential mensual"] },
  { tier: "essential", duration: "3m", label: "PS Plus Essential \u2014 3 Meses", searchTerms: ["playstation plus essential 3 meses", "ps plus essential 3 meses", "ps plus essential 3 month", "psn plus essential trimestral"] },
  { tier: "essential", duration: "12m", label: "PS Plus Essential \u2014 12 Meses", searchTerms: ["playstation plus essential 12 meses", "ps plus essential 12 meses", "ps plus essential 1 a\xF1o", "ps plus essential anual", "ps plus essential 1 year"] },
  { tier: "extra", duration: "1m", label: "PS Plus Extra \u2014 1 Mes", searchTerms: ["playstation plus extra 1 mes", "ps plus extra 1 mes", "ps plus extra 1 month"] },
  { tier: "extra", duration: "3m", label: "PS Plus Extra \u2014 3 Meses", searchTerms: ["playstation plus extra 3 meses", "ps plus extra 3 meses", "ps plus extra 3 month"] },
  { tier: "extra", duration: "12m", label: "PS Plus Extra \u2014 12 Meses", searchTerms: ["playstation plus extra 12 meses", "ps plus extra 12 meses", "ps plus extra 1 a\xF1o", "ps plus extra anual"] },
  { tier: "premium", duration: "1m", label: "PS Plus Premium \u2014 1 Mes", searchTerms: ["playstation plus premium 1 mes", "ps plus premium 1 mes", "ps plus premium 1 month"] },
  { tier: "premium", duration: "3m", label: "PS Plus Premium \u2014 3 Meses", searchTerms: ["playstation plus premium 3 meses", "ps plus premium 3 meses", "ps plus premium 3 month"] },
  { tier: "premium", duration: "12m", label: "PS Plus Premium \u2014 12 Meses", searchTerms: ["playstation plus premium 12 meses", "ps plus premium 12 meses", "ps plus premium 1 a\xF1o", "ps plus premium anual"] }
];
var FALLBACK_PRICES = {
  us: {
    essential: { "1m": 9.99, "3m": 24.99, "12m": 79.99 },
    extra: { "1m": 14.99, "3m": 39.99, "12m": 134.99 },
    premium: { "1m": 17.99, "3m": 49.99, "12m": 159.99 }
  },
  br: {
    essential: { "1m": 34.9, "3m": 89.9, "12m": 199.9 },
    extra: { "1m": 52.9, "3m": 139.9, "12m": 339.9 },
    premium: { "1m": 59.9, "3m": 165.9, "12m": 399.9 }
  },
  tr: {
    essential: { "1m": 130, "3m": 340, "12m": 900 },
    extra: { "1m": 200, "3m": 530, "12m": 1400 },
    premium: { "1m": 250, "3m": 650, "12m": 1700 }
  }
};
var UA7 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var REGION_LOCALE = {
  us: "en-us",
  br: "pt-br",
  tr: "en-tr"
};
var REGION_CURRENCY = {
  us: "USD",
  br: "BRL",
  tr: "TRY"
};
var TIER_ORDER = ["essential", "extra", "premium"];
var DURATION_ORDER = ["1m", "3m", "12m"];
async function fetchPsPlusPage(region) {
  const locale = REGION_LOCALE[region];
  const url = `https://www.playstation.com/${locale}/ps-plus/`;
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "user-agent": UA7,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": region === "br" ? "pt-BR,pt;q=0.9" : "en-US,en;q=0.9"
        }
      });
      if (r.status === 403) throw new Error(`403 Forbidden (${url})`);
      if (!r.ok) throw new Error(`HTTP ${r.status} (${url})`);
      return await r.text();
    } catch (e) {
      lastErr = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw new Error(`Failed to fetch PS Plus page for ${region}: ${lastErr?.message || lastErr}`);
}
function extractNextData3(html) {
  const m = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}
function parsePrice(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const parts = cleaned.split(/[.,]/);
  if (parts.length <= 1) {
    return Number(cleaned) || null;
  }
  const lastPart = parts[parts.length - 1];
  if (lastPart.length <= 2) {
    const intPart = parts.slice(0, -1).join("");
    return Number(`${intPart}.${lastPart}`) || null;
  }
  return Number(parts.join("")) || null;
}
var TIER_PATTERNS = {
  essential: /essential/i,
  extra: /extra/i,
  premium: /premium|deluxe/i
};
var DURATION_PATTERNS = {
  "1m": /\b1\s*(?:month|mes|m(?:ê|e)s|ay)\b/i,
  "3m": /\b3\s*(?:month|mes|m(?:ê|e)s|meses|ay)\b/i,
  "12m": /\b(?:12\s*(?:month|mes|m(?:ê|e)s|meses|ay)|1\s*(?:year|año|ano))\b/i
};
function classifyTier(text) {
  for (const t of TIER_ORDER) {
    if (TIER_PATTERNS[t].test(text)) return t;
  }
  return null;
}
function classifyDuration(text) {
  for (const d of DURATION_ORDER) {
    if (DURATION_PATTERNS[d].test(text)) return d;
  }
  return null;
}
function walkForPrices(node, results, depth = 0) {
  if (depth > 30 || !node) return;
  if (Array.isArray(node)) {
    for (const item of node) walkForPrices(item, results, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node;
  const name = String(obj.name || obj.title || obj.label || obj.planName || "");
  const priceStr = String(
    obj.price || obj.formattedPrice || obj.displayPrice || obj.basePrice || obj.basePriceValue || ""
  );
  if (name && priceStr) {
    const tier = classifyTier(name);
    const dur = classifyDuration(name);
    if (tier && dur) {
      const price = parsePrice(priceStr);
      if (price && price > 0) {
        const key = `${tier}:${dur}`;
        if (!results.has(key)) results.set(key, price);
      }
    }
  }
  for (const v of Object.values(obj)) {
    walkForPrices(v, results, depth + 1);
  }
}
function extractFromHtmlFallback(html, region) {
  const results = /* @__PURE__ */ new Map();
  const priceRe = region === "br" ? /R\$\s*([\d.,]+)/g : region === "tr" ? /(?:₺|TL|TRY)\s*([\d.,]+)/g : /\$\s*([\d.,]+)/g;
  const sections = html.split(/(?=essential|extra|premium)/gi);
  for (const section of sections) {
    const tier = classifyTier(section.slice(0, 200));
    if (!tier) continue;
    const durBlocks = section.split(/(?=\b(?:1|3|12)\s*(?:month|mes|m[êe]s|ay|year|año|ano))/gi);
    for (const block of durBlocks) {
      const dur = classifyDuration(block.slice(0, 100));
      if (!dur) continue;
      const match = priceRe.exec(block);
      if (match) {
        const price = parsePrice(match[1]);
        if (price && price > 0) {
          const key = `${tier}:${dur}`;
          if (!results.has(key)) results.set(key, price);
        }
      }
      priceRe.lastIndex = 0;
    }
  }
  return results;
}
function parsePsPlusHtml(html, region) {
  const result = {};
  const nextData = extractNextData3(html);
  let found = /* @__PURE__ */ new Map();
  if (nextData) {
    walkForPrices(nextData, found);
  }
  if (found.size < 9) {
    const htmlFallback = extractFromHtmlFallback(html, region);
    for (const [k, v] of htmlFallback) {
      if (!found.has(k)) found.set(k, v);
    }
  }
  if (found.size === 0) return null;
  for (const [key, price] of found) {
    const [tier, dur] = key.split(":");
    if (!result[tier]) result[tier] = {};
    result[tier][dur] = price;
  }
  return result;
}
async function scrapePsPlusPrices() {
  const regions = ["us", "br", "tr"];
  const prices = structuredClone(FALLBACK_PRICES);
  const errors = [];
  for (const region of regions) {
    try {
      const html = await fetchPsPlusPage(region);
      const parsed = parsePsPlusHtml(html, region);
      if (parsed) {
        let count = 0;
        for (const tier of TIER_ORDER) {
          for (const dur of DURATION_ORDER) {
            if (parsed[tier]?.[dur]) {
              prices[region][tier][dur] = parsed[tier][dur];
              count++;
            }
          }
        }
        if (count === 0) {
          errors.push(`${region.toUpperCase()}: p\xE1gina cargada pero no se encontraron precios, usando valores de respaldo`);
        } else if (count < 9) {
          errors.push(`${region.toUpperCase()}: solo ${count}/9 precios extra\xEDdos, el resto usa respaldo`);
        }
      } else {
        errors.push(`${region.toUpperCase()}: no se pudo parsear la p\xE1gina, usando valores de respaldo`);
      }
    } catch (e) {
      errors.push(`${region.toUpperCase()}: ${e.message}`);
    }
  }
  return { prices, scrapedAt: (/* @__PURE__ */ new Date()).toISOString(), errors };
}
var PLUS_MATCH_THRESHOLD = 0.45;
function bestMatchScore(searchTerms, productTitle) {
  const productTokens = tokenize(productTitle);
  if (!productTokens.length) return 0;
  let best = 0;
  for (const term of searchTerms) {
    const termTokens = tokenize(term);
    if (!termTokens.length) continue;
    const score = similarity(termTokens, productTokens);
    if (score > best) best = score;
  }
  return best;
}
function toClp(price, currency, cfg) {
  let rate;
  let discount;
  switch (currency) {
    case "BRL":
      rate = cfg.brlToClp;
      discount = cfg.balanceDiscountBrl ?? 1;
      break;
    case "TRY":
      rate = cfg.tryToClp;
      discount = cfg.balanceDiscountTry ?? 1;
      break;
    default:
      rate = cfg.usdToClp;
      discount = cfg.balanceDiscountUsd ?? 1;
      break;
  }
  return Math.round(price * discount * rate);
}
function matchPlansWithCompetitors(products, cfg, scraped) {
  const priceData = scraped?.prices ?? FALLBACK_PRICES;
  return PLAN_DEFS.map((def) => {
    const regions = ["us", "br", "tr"];
    const regionPrices = regions.map((r) => {
      const currency = REGION_CURRENCY[r];
      const price = priceData[r]?.[def.tier]?.[def.duration] ?? FALLBACK_PRICES[r][def.tier][def.duration];
      return {
        region: r,
        currency,
        price,
        priceClp: toClp(price, currency, cfg)
      };
    });
    let cheapestRegion = null;
    let cheapestClp = null;
    for (const rp of regionPrices) {
      if (rp.priceClp != null && (cheapestClp == null || rp.priceClp < cheapestClp)) {
        cheapestClp = rp.priceClp;
        cheapestRegion = rp.region;
      }
    }
    const matches = [];
    for (const p of products) {
      const score = bestMatchScore(def.searchTerms, p.title);
      if (score >= PLUS_MATCH_THRESHOLD) {
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
    const top = matches.slice(0, 8);
    return {
      tier: def.tier,
      duration: def.duration,
      label: def.label,
      regionPrices,
      cheapestRegion,
      cheapestClp,
      searchTerms: def.searchTerms,
      competitorMatches: top,
      bestPrice: top.length ? top[0].priceClp : null,
      bestStore: top.length ? top[0].storeKey : null
    };
  });
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
function saveDetailAndUpdateImage(game, detail) {
  store.setProductDetail(game.id, detail);
}
var ADD_ON_PATTERN = /\b(dlc|season pass|avatar|theme|currency pack|coin pack|point pack)\b/i;
var PREMIUM_EDITION = /\b(deluxe|ultimate|complete|goty|game of the year|digital edition|launch edition)\b/i;
function computeHitScore(g) {
  if (g.discountPercent <= 0) return 0;
  let score = 0;
  const priceUsd = (g.priceOriginalCents ?? 0) / 100;
  if (priceUsd >= 60) score += 30;
  else if (priceUsd >= 40) score += 20;
  else if (priceUsd >= 20) score += 10;
  if (g.discountPercent >= 40) score += 25;
  else if (g.discountPercent >= 25) score += 15;
  else if (g.discountPercent > 0) score += 5;
  const detail = store.getProductDetail(g.id);
  if (detail?.publisher) {
    const hitPubs = store.getHitPublishers();
    const pub = detail.publisher.toLowerCase();
    if (hitPubs.some((p) => pub.includes(p.toLowerCase()))) score += 25;
  }
  if (g.platforms?.includes("PS5")) score += 10;
  if (ADD_ON_PATTERN.test(g.name) && !PREMIUM_EDITION.test(g.name)) score -= 50;
  return Math.max(0, Math.min(100, score));
}
function generateSku(name) {
  const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9\s]/g, "").trim().split(/\s+/).slice(0, 5).join("-");
  return `PS-${slug}-001`;
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
    primaria: sale?.primaria ?? null,
    secundaria: sale?.secundaria ?? null,
    totalRevenue: sale?.totalRevenue ?? null,
    netProfit: sale?.netProfit ?? null,
    marketMin,
    marketCount: matches.length,
    marketMatches: matches,
    hitScore: computeHitScore(g)
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
        const errMsg = e.message;
        console.error(`[${source.platform}/${source.region}] Error: ${errMsg}`);
        results.push({
          platform: source.platform,
          region: source.region,
          newCount: 0,
          updated: 0,
          disappeared: 0,
          totalSeen: 0,
          error: errMsg
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
    "notas"
  ];
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    const needsQuote = s.includes(sep) || s.includes('"') || s.includes("\n");
    return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const metadata = sheetsFormat ? `# Exportado: ${now} \xB7 TC USD: ${cfg.usdToClp} \xB7 Descuento saldo USD: ${cfg.balanceDiscountUsd}
` : "";
  const lines = [header.join(sep)];
  for (const g of games) {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const cost = sale?.costClp ?? null;
    const margen = cost && sale?.netProfit ? Math.round(sale.netProfit / cost * 100) : "";
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
        g.notes
      ].map(escape).join(sep)
    );
  }
  const content = metadata + lines.join("\n");
  const bom = sheetsFormat ? "\uFEFF" : "";
  res.statusCode = 200;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", 'attachment; filename="apipsn-games.csv"');
  res.end(bom + content);
});
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
    "sort_order"
  ];
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    const needsQuote = s.includes(",") || s.includes('"') || s.includes("\n");
    return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const g of games) {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const detail = store.getProductDetail(g.id);
    const slug = g.name.toUpperCase().replace(/[^A-Z0-9\s]/g, "").trim().split(/\s+/).slice(0, 4).join("-");
    const sku = `PS-${slug}-001`;
    const images = [];
    if (g.imageUrl) images.push({ alt: g.name, url: g.imageUrl });
    if (detail?.media?.heroUrl && !images.some((x) => x.url === detail.media.heroUrl)) {
      images.push({ alt: g.name, url: detail.media.heroUrl });
    }
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
    const hwPlatforms = (g.platforms || "").split(",").map((p) => p.trim()).filter(Boolean);
    const platformAvailability = {};
    for (const p of hwPlatforms) platformAvailability[p] = true;
    const primaria = sale?.primaria ?? null;
    const secundaria = sale?.secundaria ?? null;
    const pricing = {};
    for (const p of hwPlatforms.length ? hwPlatforms : ["PS4"]) {
      pricing[p] = {
        Primaria: primaria,
        Secundaria: secundaria
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
        0
      ].map(escape).join(",")
    );
  }
  res.statusCode = 200;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", 'attachment; filename="apipsn-supabase.csv"');
  res.end(lines.join("\n"));
});
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
    const detail = enrich ? store.getProductDetail(g.id) : void 0;
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
      portrait_url: g.imageUrl,
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
      last_seen_at: g.lastSeenAt
    };
  });
  sendJson(res, 200, { games: rows, exported_at: (/* @__PURE__ */ new Date()).toISOString(), count: rows.length });
});
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
    const slug = g.name.toUpperCase().replace(/[^A-Z0-9\s]/g, "").trim().split(/\s+/).slice(0, 4).join("-");
    const sku = `PS-${slug}-001`;
    const hwPlatforms = (g.platforms || "").split(",").map((p) => p.trim()).filter(Boolean);
    const platformAvailability = {};
    for (const p of hwPlatforms) platformAvailability[p] = true;
    const images = [];
    if (g.imageUrl) images.push({ alt: g.name, url: g.imageUrl });
    if (detail?.media?.heroUrl && !images.some((x) => x.url === detail.media.heroUrl)) {
      images.push({ alt: g.name, url: detail.media.heroUrl });
    }
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
    const pricing = {};
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
      sort_order: 0
    };
  });
  sendJson(res, 200, { rows, exported_at: (/* @__PURE__ */ new Date()).toISOString(), count: rows.length });
});
route("POST", "/games/publish-supabase", async (req, res) => {
  const supabaseCfg = store.getSupabase();
  if (!supabaseCfg?.url || !supabaseCfg?.serviceKey) {
    return sendJson(res, 400, {
      error: "supabase_not_configured",
      message: "Configura Supabase URL y Service Key en Ajustes antes de publicar."
    });
  }
  const body = await readBody(req);
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
  const psnCfg = store.getPsn();
  for (const g of games) {
    if (g.platform === "psn" && !store.getProductDetail(g.id)) {
      try {
        const d = await fetchProductDetail(g.id, g.storeUrl || "", psnCfg.region);
        saveDetailAndUpdateImage(g, d);
      } catch {
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  const rows = games.map((g) => {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const detail = store.getProductDetail(g.id);
    const hwPlatforms = (g.platforms || "").split(",").map((p) => p.trim()).filter(Boolean);
    const platformAvailability = {};
    for (const p of hwPlatforms) platformAvailability[p] = true;
    const images = [];
    if (g.imageUrl) images.push({ alt: g.name, url: g.imageUrl });
    if (detail?.media?.heroUrl && !images.some((x) => x.url === detail.media.heroUrl)) {
      images.push({ alt: g.name, url: detail.media.heroUrl });
    }
    if (detail?.carouselImages) {
      for (const img of detail.carouselImages) {
        if (!images.some((x) => x.url === img)) images.push({ alt: g.name, url: img });
      }
    }
    const primaria = sale?.primaria ?? null;
    const secundaria = sale?.secundaria ?? null;
    const pricing = {};
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
      sort_order: 0
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
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify(rows)
    });
    if (!response.ok) {
      const text = await response.text();
      return sendJson(res, 502, {
        error: "supabase_error",
        message: `Supabase respondi\xF3 ${response.status}: ${text.slice(0, 300)}`
      });
    }
    for (const g of games) {
      store.patchGame(gameDbKey(g), { published: true });
    }
    sendJson(res, 200, { published: rows.length, skus: rows.map((r) => r.sku) });
  } catch (err) {
    sendJson(res, 502, {
      error: "supabase_network_error",
      message: `Error de conexi\xF3n: ${err.message}`
    });
  }
});
route("POST", "/games/enrich", async (req, res) => {
  const body = await readBody(req);
  const limit = Math.min(body.limit ?? 20, 50);
  const games = store.listGames().filter((g) => {
    if (!g.active || !g.selected) return false;
    if (body.platform && g.platform !== body.platform) return false;
    if (store.getProductDetail(g.id)) return false;
    return g.platform === "psn";
  }).slice(0, limit);
  const results = [];
  for (const g of games) {
    try {
      const cfg = store.getPsn();
      const detail = await fetchProductDetail(g.id, g.storeUrl || "", cfg.region);
      saveDetailAndUpdateImage(g, detail);
      results.push({ id: g.id, name: g.name, ok: true });
    } catch (e) {
      results.push({ id: g.id, name: g.name, ok: false, error: e.message });
    }
    await new Promise((res2) => setTimeout(res2, 500));
  }
  sendJson(res, 200, { enriched: results.filter((r) => r.ok).length, total: results.length, results });
});
route("GET", "/settings", async (_req, res) => {
  sendJson(res, 200, {
    pricing: store.getSettings(),
    psn: store.getPsn(),
    sources: store.getSources(),
    supabase: store.getSupabase(),
    hitPublishers: store.getHitPublishers()
  });
});
route("PUT", "/settings", async (req, res) => {
  const body = await readBody(req);
  const pricing = body.pricing ? store.updateSettings(body.pricing) : store.getSettings();
  const psn = body.psn ? store.updatePsn(body.psn) : store.getPsn();
  if (body.sources) store.setSources(body.sources);
  if (body.supabase !== void 0) store.setSupabase(body.supabase);
  if (body.hitPublishers) store.setHitPublishers(body.hitPublishers);
  sendJson(res, 200, {
    pricing,
    psn,
    sources: store.getSources(),
    supabase: store.getSupabase(),
    hitPublishers: store.getHitPublishers()
  });
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
async function runRefresh() {
  const sources = store.getSources().filter((s) => s.enabled);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  for (const source of sources) {
    try {
      const provider = getProvider(source.platform);
      const seenKeys = /* @__PURE__ */ new Set();
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
        }
      }
      store.markInactiveIfMissing(seenKeys, source.platform, source.region);
    } catch (e) {
      console.error(`[scheduler][${source.platform}/${source.region}] ${e.message}`);
    }
  }
  recomputeMatches();
}
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
    type: ["shopify", "woocommerce", "html", "jumpseller", "auto"].includes(c.type) ? c.type : "auto",
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
route("GET", "/ps-plus", async (_req, res) => {
  const cfg = store.getSettings();
  const products = store.getAllCompetitorProducts();
  const scraped = store.getPsPlusPrices();
  const plans = matchPlansWithCompetitors(products, cfg, scraped);
  sendJson(res, 200, { plans, scrapedAt: scraped?.scrapedAt ?? null });
});
route("POST", "/ps-plus/refresh", async (_req, res) => {
  try {
    const result = await scrapePsPlusPrices();
    store.setPsPlusPrices(result);
    sendJson(res, 200, result);
  } catch (e) {
    sendJson(res, 500, { error: "scrape_failed", message: e.message });
  }
});
route("POST", "/games/lookup", async (req, res) => {
  const body = await readBody(req);
  const items = body?.items;
  if (!Array.isArray(items) || !items.length) {
    sendJson(res, 400, { error: "bad_request", message: "items[] required" });
    return;
  }
  const cfg = store.getSettings();
  const allGames = store.listGames().filter((g) => g.active);
  const gameIndex = allGames.map((g) => ({
    game: g,
    tokens: tokenize(g.name)
  }));
  const THRESHOLD = 0.4;
  const results = items.map((item) => {
    const queryTokens = tokenize(item.name);
    let bestGame = null;
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
    const out = matched ? toGameOut(bestGame, cfg) : null;
    return {
      query: item.name,
      priceMin: item.priceMin,
      priceMax: item.priceMax,
      matchScore: Math.round(bestScore * 100) / 100,
      found: !!matched,
      game: out
    };
  });
  sendJson(res, 200, { results });
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
    saveDetailAndUpdateImage(game, detail);
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
route("POST", "/exchange/refresh", async (_req, res) => {
  try {
    const rates = await fetchExchangeRates();
    const patch = {};
    if (rates.usdToClp != null) patch.usdToClp = Math.round(rates.usdToClp);
    if (Object.keys(patch).length > 0) {
      store.updateSettings(patch);
    }
    sendJson(res, 200, {
      updated: patch,
      fetchedAt: rates.fetchedAt,
      errors: rates.errors
    });
  } catch (e) {
    sendJson(res, 500, { error: "exchange_error", message: e.message });
  }
});
route("GET", "/debug/status", async (_req, res) => {
  const allGames = store.listGames();
  const activeGames = allGames.filter((g) => g.active);
  const gamesByPlatform = {};
  for (const g of activeGames) {
    gamesByPlatform[g.platform] = (gamesByPlatform[g.platform] || 0) + 1;
  }
  const sources = store.getSources().map((s) => ({
    platform: s.platform,
    region: s.region,
    enabled: s.enabled
  }));
  const competitors = store.getCompetitors();
  const allProducts = store.getAllCompetitorProducts(false);
  const refreshedAt = store.getCompetitorRefreshedAt();
  const competitorStatus = competitors.map((c) => ({
    key: c.key,
    label: c.label,
    productCount: allProducts.filter((p) => p.storeKey === c.key).length,
    refreshedAt: refreshedAt[c.key] ?? null
  }));
  sendJson(res, 200, {
    totalGames: allGames.length,
    activeGames: activeGames.length,
    gamesByPlatform,
    sources,
    competitors: competitorStatus,
    autoRefreshIntervalHours: store.getAutoRefreshInterval(),
    lastAutoRefreshAt: getLastAutoRefreshAt(),
    dbSizeKb: null
  });
});
route("PUT", "/scheduler", async (req, res) => {
  const body = await readBody(req);
  const hours = Number(body.intervalHours ?? 0);
  if (!Number.isFinite(hours) || hours < 0) {
    return sendJson(res, 400, { error: "bad_request", message: "intervalHours must be >= 0" });
  }
  store.setAutoRefreshInterval(hours);
  reschedule(runRefresh);
  sendJson(res, 200, { intervalHours: store.getAutoRefreshInterval() });
});
startScheduler(runRefresh);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL3N0b3JlLnRzIiwgInNlcnZlci9wcmljaW5nLnRzIiwgInNlcnZlci9wc24udHMiLCAic2VydmVyL2NvbXBldGl0b3JzLnRzIiwgInNlcnZlci9wc24tcHJvZHVjdC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3R5cGVzLnRzIiwgInNlcnZlci9wcm92aWRlcnMvcHNuLnRzIiwgInNlcnZlci9wcm92aWRlcnMveGJveC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3N0ZWFtLnRzIiwgInNlcnZlci9wcm92aWRlcnMvbmludGVuZG8udHMiLCAic2VydmVyL3Byb3ZpZGVycy9pbmRleC50cyIsICJzZXJ2ZXIvZXhjaGFuZ2UudHMiLCAic2VydmVyL3NjaGVkdWxlci50cyIsICJzZXJ2ZXIvcHMtcGx1cy50cyIsICJzZXJ2ZXIvYXBpLnRzIiwgInNlcnZlci9wbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgYXBpUGx1Z2luIH0gZnJvbSBcIi4vc2VydmVyL3BsdWdpblwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpUGx1Z2luKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiOy8qKlxuICogSlNPTi1maWxlIHN0b3JhZ2UuIEF2b2lkcyBuYXRpdmUgZGVwcyAoYmV0dGVyLXNxbGl0ZTMgYnJlYWtzIGluIFdlYkNvbnRhaW5lcnMpLlxuICovXG5pbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ29tcGV0aXRvckNvbmZpZyxcbiAgQ29tcGV0aXRvck1hdGNoLFxuICBDb21wZXRpdG9yUHJvZHVjdCxcbn0gZnJvbSBcIi4vY29tcGV0aXRvcnNcIjtcbmltcG9ydCB0eXBlIHsgUHJvZHVjdERldGFpbCB9IGZyb20gXCIuL3Bzbi1wcm9kdWN0XCI7XG5pbXBvcnQgdHlwZSB7IFBsYXRmb3JtLCBQcm92aWRlclNvdXJjZSB9IGZyb20gXCIuL3Byb3ZpZGVycy90eXBlc1wiO1xuXG4vKiogQSBnYW1lIHRoZSB1c2VyIGlzIHRyYWNraW5nIGV2ZW4gd2hlbiBpdCdzIG5vdCBpbiB0aGUgY3VycmVudCBXZWVrbHkgRGVhbHNcbiAqICBjYXRlZ29yeS4gRXZlcnkgL3JlZnJlc2ggZGlmZnMgdGhlc2UgYWdhaW5zdCB0aGUgc2NyYXBlIGFuZCByZXBvcnRzXG4gKiAgdHJhbnNpdGlvbnMgKG9mZl9zYWxlIFx1MjE5MiBvbl9zYWxlKSBiYWNrIHRvIHRoZSBjbGllbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoZWRHYW1lIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBhZGRlZEF0OiBzdHJpbmc7XG4gIC8qKiBcInVuc2VlblwiID0gbmV2ZXIgZm91bmQgaW4gYW55IHJlZnJlc2ggeWV0LiAqL1xuICBsYXN0U3RhdHVzOiBcInVuc2VlblwiIHwgXCJvbl9zYWxlXCIgfCBcIm9mZl9zYWxlXCI7XG4gIGxhc3RTZWVuT25TYWxlQXQ6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RQcmljZUNlbnRzOiBudW1iZXIgfCBudWxsO1xuICBsYXN0RGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIG5vdGVzOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2FtZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgaW1hZ2VVcmw6IHN0cmluZyB8IG51bGw7XG4gIHN0b3JlVXJsOiBzdHJpbmcgfCBudWxsO1xuICBwbGF0Zm9ybXM6IHN0cmluZztcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgcHJpY2VPcmlnaW5hbENlbnRzOiBudW1iZXIgfCBudWxsO1xuICBwcmljZURpc2NvdW50ZWRDZW50czogbnVtYmVyIHwgbnVsbDtcbiAgZGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIGRpc2NvdW50RW5kQXQ6IHN0cmluZyB8IG51bGw7XG4gIHNlbGVjdGVkOiBib29sZWFuO1xuICBwdWJsaXNoZWQ6IGJvb2xlYW47XG4gIG5vdGVzOiBzdHJpbmc7XG4gIHlvdXR1YmVVcmw6IHN0cmluZztcbiAgYWN0aXZlOiBib29sZWFuO1xuICBmaXJzdFNlZW5BdDogc3RyaW5nO1xuICBsYXN0U2VlbkF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByaWNpbmdTZXR0aW5ncyB7XG4gIHVzZFRvQ2xwOiBudW1iZXI7XG4gIGJybFRvQ2xwOiBudW1iZXI7XG4gIHRyeVRvQ2xwOiBudW1iZXI7XG4gIGpweVRvQ2xwOiBudW1iZXI7XG4gIC8qKiBGcmFjdGlvbiBvZiBmYWNlIHZhbHVlIHBhaWQgZm9yIFBTTiBiYWxhbmNlIChlLmcuIDAuODAgPSBidXkgJDEwIHNhbGRvIGZvciAkOCkuXG4gICAqICBQZXItY3VycmVuY3kuIFVzZSAxLjAgaWYgYnV5aW5nIGF0IGZ1bGwgcHJpY2UuICovXG4gIGJhbGFuY2VEaXNjb3VudFVzZDogbnVtYmVyO1xuICBiYWxhbmNlRGlzY291bnRCcmw6IG51bWJlcjtcbiAgYmFsYW5jZURpc2NvdW50VHJ5OiBudW1iZXI7XG4gIC8qKiBQcmljZSBtdWx0aXBsaWVyIGZvciBQcmltYXJpYSAoc29sZCBcdTAwRDcyIHBlciBwdXJjaGFzZSkuICovXG4gIHByaW1hcmlhTXVsdDogbnVtYmVyO1xuICAvKiogUHJpY2UgbXVsdGlwbGllciBmb3IgU2VjdW5kYXJpYSAoc29sZCBcdTAwRDcxIHBlciBwdXJjaGFzZSwgY2hlYXBlcikuICovXG4gIHNlY3VuZGFyaWFNdWx0OiBudW1iZXI7XG4gIHJvdW5kVG86IG51bWJlcjtcbiAgLyoqIFdoZW4gdHJ1ZSwgY29uc3VtZXItZmFjaW5nIHByaWNlcyAocHJpbWFyaWEvc2VjdW5kYXJpYSkgdXNlIFguOTkwIGVuZGluZ3MuICovXG4gIGNvbW1lcmNpYWxSb3VuZGluZzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdXBhYmFzZUNvbmZpZyB7XG4gIHVybDogc3RyaW5nO1xuICBzZXJ2aWNlS2V5OiBzdHJpbmc7XG4gIHRhYmxlTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBzbkNvbmZpZyB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBkZWFsc0NhdGVnb3J5SWQ6IHN0cmluZztcbiAgY2F0ZWdvcnlHcmlkSGFzaDogc3RyaW5nO1xuICAvKiogV2hlbiBmYWxzZSwgZmlsdGVyIG91dCBETEMsIGN1cnJlbmN5LCBhdmF0YXJzLCB0aGVtZXMsIHN1YnNjcmlwdGlvbnMuXG4gICAqICBEZWZhdWx0IGZhbHNlIFx1MjAxNCB3ZSBhbG1vc3QgYWx3YXlzIHdhbnQganVzdCB0aGUgcGxheWFibGUgZ2FtZXMuICovXG4gIGluY2x1ZGVBZGRPbnM6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBEYlNoYXBlIHtcbiAgZ2FtZXM6IFJlY29yZDxzdHJpbmcsIEdhbWU+O1xuICBzZXR0aW5nczogUHJpY2luZ1NldHRpbmdzO1xuICBwc246IFBzbkNvbmZpZztcbiAgc291cmNlczogUHJvdmlkZXJTb3VyY2VbXTtcbiAgY29tcGV0aXRvcnM6IENvbXBldGl0b3JDb25maWdbXTtcbiAgY29tcGV0aXRvclByb2R1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBDb21wZXRpdG9yUHJvZHVjdFtdPjtcbiAgY29tcGV0aXRvck1hdGNoZXM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPjtcbiAgY29tcGV0aXRvclJlZnJlc2hlZEF0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBwcm9kdWN0RGV0YWlsczogUmVjb3JkPHN0cmluZywgUHJvZHVjdERldGFpbD47XG4gIHdhdGNobGlzdDogUmVjb3JkPHN0cmluZywgV2F0Y2hlZEdhbWU+O1xuICAvKiogMCA9IGRpc2FibGVkLiBTdG9yZWQgc2VwYXJhdGVseSBzbyBpdCBzdXJ2aXZlcyBzZXR0aW5ncyByZXNldHMuICovXG4gIGF1dG9SZWZyZXNoSW50ZXJ2YWxIb3VyczogbnVtYmVyO1xuICAvKiogU2NyYXBlZCBQUyBQbHVzIHByaWNlcywgcGVyc2lzdGVkIHNvIHRoZXkgc3Vydml2ZSByZXN0YXJ0cy4gKi9cbiAgcHNQbHVzUHJpY2VzOiB7XG4gICAgcHJpY2VzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+Pj47XG4gICAgc2NyYXBlZEF0OiBzdHJpbmc7XG4gICAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgfSB8IG51bGw7XG4gIC8qKiBTdXBhYmFzZSBjb25uZWN0aW9uIGZvciBkaXJlY3QgcHVibGlzaGluZy4gKi9cbiAgc3VwYWJhc2U6IFN1cGFiYXNlQ29uZmlnIHwgbnVsbDtcbiAgLyoqIFB1Ymxpc2hlcnMgY29uc2lkZXJlZCBcImhpdFwiIHRpZXIgZm9yIGF1dG8tZmlsdGVyaW5nLiAqL1xuICBoaXRQdWJsaXNoZXJzOiBzdHJpbmdbXTtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogUHJpY2luZ1NldHRpbmdzID0ge1xuICB1c2RUb0NscDogODkwLFxuICBicmxUb0NscDogMTcwLFxuICB0cnlUb0NscDogMjgsXG4gIGpweVRvQ2xwOiA2LjUsXG4gIGJhbGFuY2VEaXNjb3VudFVzZDogMC44MCxcbiAgYmFsYW5jZURpc2NvdW50QnJsOiAxLjAsXG4gIGJhbGFuY2VEaXNjb3VudFRyeTogMS4wLFxuICBwcmltYXJpYU11bHQ6IDEuMjUsXG4gIHNlY3VuZGFyaWFNdWx0OiAwLjcwLFxuICByb3VuZFRvOiA1MDAsXG4gIGNvbW1lcmNpYWxSb3VuZGluZzogdHJ1ZSxcbn07XG5cbmNvbnN0IERFRkFVTFRfSElUX1BVQkxJU0hFUlM6IHN0cmluZ1tdID0gW1xuICBcIlNvbnkgSW50ZXJhY3RpdmUgRW50ZXJ0YWlubWVudFwiLCBcIkluc29tbmlhYyBHYW1lc1wiLCBcIk5hdWdodHkgRG9nXCIsXG4gIFwiU2FudGEgTW9uaWNhIFN0dWRpb1wiLCBcIkd1ZXJyaWxsYVwiLCBcIlN1Y2tlciBQdW5jaCBQcm9kdWN0aW9uc1wiLFxuICBcIlJvY2tzdGFyIEdhbWVzXCIsIFwiVWJpc29mdFwiLCBcIkVsZWN0cm9uaWMgQXJ0c1wiLCBcIkNhcGNvbVwiLFxuICBcIlNxdWFyZSBFbml4XCIsIFwiQmFuZGFpIE5hbWNvXCIsIFwiV2FybmVyIEJyb3NcIiwgXCJBY3RpdmlzaW9uXCIsXG4gIFwiQmV0aGVzZGFcIiwgXCJGcm9tU29mdHdhcmVcIiwgXCJLb25hbWlcIiwgXCJTRUdBXCIsIFwiMksgR2FtZXNcIixcbiAgXCJDRCBQcm9qZWt0IFJlZFwiLCBcIlJlbWVkeSBFbnRlcnRhaW5tZW50XCIsIFwiVGVhbSBOaW5qYVwiLFxuXTtcblxuY29uc3QgREVGQVVMVF9TT1VSQ0VTOiBQcm92aWRlclNvdXJjZVtdID0gW1xuICB7IHBsYXRmb3JtOiBcInBzblwiLCByZWdpb246IFwidXNcIiwgZW5hYmxlZDogdHJ1ZSwgY2F0ZWdvcnlJZDogXCJcIiB9LFxuICB7IHBsYXRmb3JtOiBcInBzblwiLCByZWdpb246IFwiYnJcIiwgZW5hYmxlZDogdHJ1ZSwgY2F0ZWdvcnlJZDogXCIzZjc3MjUwMS1mNmY4LTQ5YjctYWJhYy04NzRhODhjYTQ4OTdcIiB9LFxuICB7IHBsYXRmb3JtOiBcInhib3hcIiwgcmVnaW9uOiBcInVzXCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBwbGF0Zm9ybTogXCJ4Ym94XCIsIHJlZ2lvbjogXCJiclwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsgcGxhdGZvcm06IFwieGJveFwiLCByZWdpb246IFwidHJcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IHBsYXRmb3JtOiBcIm5pbnRlbmRvXCIsIHJlZ2lvbjogXCJ1c1wiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsgcGxhdGZvcm06IFwibmludGVuZG9cIiwgcmVnaW9uOiBcImpwXCIsIGVuYWJsZWQ6IGZhbHNlIH0sXG4gIHsgcGxhdGZvcm06IFwic3RlYW1cIiwgcmVnaW9uOiBcInVzXCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBwbGF0Zm9ybTogXCJzdGVhbVwiLCByZWdpb246IFwiYnJcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IHBsYXRmb3JtOiBcInN0ZWFtXCIsIHJlZ2lvbjogXCJ0clwiLCBlbmFibGVkOiB0cnVlIH0sXG5dO1xuXG5jb25zdCBERUZBVUxUX0NPTVBFVElUT1JTOiBDb21wZXRpdG9yQ29uZmlnW10gPSBbXG4gIHsga2V5OiBcImNqbVwiLCBsYWJlbDogXCJDSk0gRGlnaXRhbGVzXCIsIGRvbWFpbjogXCJjam1kaWdpdGFsZXMuY2xcIiwgdHlwZTogXCJzaG9waWZ5XCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBrZXk6IFwianVlZ29zZGlnaXRhbGVzY2hpbGVcIiwgbGFiZWw6IFwiSnVlZ29zIERpZ2l0YWxlcyBDaGlsZVwiLCBkb21haW46IFwianVlZ29zZGlnaXRhbGVzY2hpbGUuY29tXCIsIHR5cGU6IFwiaHRtbFwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsga2V5OiBcIm1qXCIsIGxhYmVsOiBcIk1KIERpZ2l0YWxlc1wiLCBkb21haW46IFwibWpkaWdpdGFsZXMuY2xcIiwgdHlwZTogXCJzaG9waWZ5XCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBrZXk6IFwiaW5maW5pdHlcIiwgbGFiZWw6IFwiSW5maW5pdHkgR2FtZXMgQ2hpbGVcIiwgZG9tYWluOiBcImluZmluaXR5Z2FtZXNjaGlsZS5jbFwiLCB0eXBlOiBcImh0bWxcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuXTtcblxuY29uc3QgREVGQVVMVF9QU046IFBzbkNvbmZpZyA9IHtcbiAgcmVnaW9uOiBcImVuLVVTXCIsXG4gIC8vIFBsYWNlaG9sZGVyIElEcyBcdTIwMTQgdGhlIHVzZXIgY29uZmlndXJlcyB0aGUgcmVhbCBvbmVzIGZyb20gRGV2VG9vbHMuXG4gIC8vIFBhbmVsID4gQWp1c3RlcyBleHBvbmUgYW1ib3MuXG4gIGRlYWxzQ2F0ZWdvcnlJZDogXCIzZjc3MjUwMS1mNmY4LTQ5YjctYWJhYy04NzRhODhjYTQ4OTdcIixcbiAgLy8gVW51c2VkIGJ5IHRoZSBIVE1MIHNjcmFwZXIuIEtlcHQgZm9yIHJlZmVyZW5jZSBpbiBjYXNlIHdlIGV2ZXIgYWRkIGFcbiAgLy8gR3JhcGhRTCBmYWxsYmFjay4gQ3VycmVudCB2YWx1ZSBjYXB0dXJlZCBmcm9tIERldlRvb2xzIG9uIDIwMjYtMDQtMTMuXG4gIGNhdGVnb3J5R3JpZEhhc2g6XG4gICAgXCIyNTc3MTM0NjZmYzMyNjQ4NTBhYTQ3MzQwOWEyOTA4OGUzYTQxMTVlNmU2OWU5ZmIzZTA2MWM4ZGQ1YjlmNWM2XCIsXG4gIGluY2x1ZGVBZGRPbnM6IGZhbHNlLFxufTtcblxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5jb25zdCBEQVRBX0ZJTEUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uL2RhdGEvYXBpcHNuLmpzb25cIik7XG5jb25zdCBUTVBfRklMRSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vZGF0YS9hcGlwc24uanNvbi50bXBcIik7XG5jb25zdCBCQUNLVVBfRklMRSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vZGF0YS9hcGlwc24uYmFja3VwLmpzb25cIik7XG5cbi8qKiBTaW1wbGUgd3JpdGUtbG9jazogcHJldmVudHMgb3ZlcmxhcHBpbmcgd3JpdGVzLiAqL1xubGV0IHdyaXRpbmcgPSBmYWxzZTtcbmxldCBwZW5kaW5nV3JpdGUgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlRGlyKCkge1xuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoREFUQV9GSUxFKTtcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xufVxuXG5mdW5jdGlvbiBtaWdyYXRlR2FtZXMoZ2FtZXM6IFJlY29yZDxzdHJpbmcsIEdhbWU+KTogUmVjb3JkPHN0cmluZywgR2FtZT4ge1xuICBjb25zdCBtaWdyYXRlZDogUmVjb3JkPHN0cmluZywgR2FtZT4gPSB7fTtcbiAgZm9yIChjb25zdCBba2V5LCBnXSBvZiBPYmplY3QuZW50cmllcyhnYW1lcykpIHtcbiAgICBpZiAodHlwZW9mIGcueW91dHViZVVybCAhPT0gXCJzdHJpbmdcIikgZy55b3V0dWJlVXJsID0gXCJcIjtcbiAgICBpZiAoIWcucGxhdGZvcm0pIGcucGxhdGZvcm0gPSBcInBzblwiO1xuICAgIGlmICghZy5yZWdpb24pIGcucmVnaW9uID0gXCJ1c1wiO1xuICAgIGlmICghZy5jdXJyZW5jeSkgZy5jdXJyZW5jeSA9IFwiVVNEXCI7XG4gICAgLy8gUmUta2V5IG9sZCBQU04gZW50cmllcyB0byBjb21wb3NpdGUga2V5XG4gICAgY29uc3QgY29tcG9zaXRlS2V5ID0gYCR7Zy5wbGF0Zm9ybX06JHtnLnJlZ2lvbn06JHtnLmlkfWA7XG4gICAgaWYgKGtleSA9PT0gZy5pZCAmJiBrZXkgIT09IGNvbXBvc2l0ZUtleSkge1xuICAgICAgbWlncmF0ZWRbY29tcG9zaXRlS2V5XSA9IGc7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1pZ3JhdGVkW2tleV0gPSBnO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWlncmF0ZWQ7XG59XG5cbmZ1bmN0aW9uIG1pZ3JhdGVTb3VyY2VzKFxuICBzb3VyY2VzOiBQcm92aWRlclNvdXJjZVtdIHwgdW5kZWZpbmVkLFxuICBwc246IFBzbkNvbmZpZ1xuKTogUHJvdmlkZXJTb3VyY2VbXSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gc291cmNlcyAmJiBzb3VyY2VzLmxlbmd0aCA+IDAgPyBbLi4uc291cmNlc10gOiBbXTtcbiAgY29uc3QgZXhpc3RpbmdLZXlzID0gbmV3IFNldChleGlzdGluZy5tYXAoKHMpID0+IGAke3MucGxhdGZvcm19OiR7cy5yZWdpb259YCkpO1xuXG4gIC8vIEFsd2F5cyBtZXJnZSBtaXNzaW5nIHNvdXJjZXMgZnJvbSBkZWZhdWx0c1xuICBmb3IgKGNvbnN0IGRlZiBvZiBERUZBVUxUX1NPVVJDRVMpIHtcbiAgICBjb25zdCBrZXkgPSBgJHtkZWYucGxhdGZvcm19OiR7ZGVmLnJlZ2lvbn1gO1xuICAgIGlmICghZXhpc3RpbmdLZXlzLmhhcyhrZXkpKSB7XG4gICAgICBleGlzdGluZy5wdXNoKHsgLi4uZGVmIH0pO1xuICAgIH0gZWxzZSBpZiAoZGVmLmVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IHNyYyA9IGV4aXN0aW5nLmZpbmQoKHMpID0+IHMucGxhdGZvcm0gPT09IGRlZi5wbGF0Zm9ybSAmJiBzLnJlZ2lvbiA9PT0gZGVmLnJlZ2lvbik7XG4gICAgICBpZiAoc3JjICYmICFzcmMuZW5hYmxlZCkgc3JjLmVuYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhcnJ5IG92ZXIgZXhpc3RpbmcgUFNOIGNhdGVnb3J5IElEIGlmIHNvdXJjZXMgd2VyZSBlbXB0eVxuICBpZiAoKCFzb3VyY2VzIHx8IHNvdXJjZXMubGVuZ3RoID09PSAwKSAmJiBwc24uZGVhbHNDYXRlZ29yeUlkKSB7XG4gICAgY29uc3QgcHNuVXMgPSBleGlzdGluZy5maW5kKChzKSA9PiBzLnBsYXRmb3JtID09PSBcInBzblwiICYmIHMucmVnaW9uID09PSBcInVzXCIpO1xuICAgIGlmIChwc25VcyAmJiAhcHNuVXMuY2F0ZWdvcnlJZCkge1xuICAgICAgcHNuVXMuY2F0ZWdvcnlJZCA9IHBzbi5kZWFsc0NhdGVnb3J5SWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGV4aXN0aW5nO1xufVxuXG5mdW5jdGlvbiBidWlsZERiKHBhcnNlZDogUGFydGlhbDxEYlNoYXBlPik6IERiU2hhcGUge1xuICBjb25zdCBwc24gPSB7IC4uLkRFRkFVTFRfUFNOLCAuLi4ocGFyc2VkLnBzbiA/PyB7fSkgfTtcbiAgY29uc3QgZ2FtZXMgPSBtaWdyYXRlR2FtZXMocGFyc2VkLmdhbWVzID8/IHt9KTtcbiAgcmV0dXJuIHtcbiAgICBnYW1lcyxcbiAgICBzZXR0aW5nczogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLCAuLi4ocGFyc2VkLnNldHRpbmdzID8/IHt9KSB9LFxuICAgIHBzbixcbiAgICBzb3VyY2VzOiBtaWdyYXRlU291cmNlcyhwYXJzZWQuc291cmNlcywgcHNuKSxcbiAgICBjb21wZXRpdG9yczogcGFyc2VkLmNvbXBldGl0b3JzID8/IFsuLi5ERUZBVUxUX0NPTVBFVElUT1JTXSxcbiAgICBjb21wZXRpdG9yUHJvZHVjdHM6IHBhcnNlZC5jb21wZXRpdG9yUHJvZHVjdHMgPz8ge30sXG4gICAgY29tcGV0aXRvck1hdGNoZXM6IHBhcnNlZC5jb21wZXRpdG9yTWF0Y2hlcyA/PyB7fSxcbiAgICBjb21wZXRpdG9yUmVmcmVzaGVkQXQ6IHBhcnNlZC5jb21wZXRpdG9yUmVmcmVzaGVkQXQgPz8ge30sXG4gICAgcHJvZHVjdERldGFpbHM6IHBhcnNlZC5wcm9kdWN0RGV0YWlscyA/PyB7fSxcbiAgICB3YXRjaGxpc3Q6IHBhcnNlZC53YXRjaGxpc3QgPz8ge30sXG4gICAgYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzOiBwYXJzZWQuYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzID8/IDAsXG4gICAgcHNQbHVzUHJpY2VzOiBwYXJzZWQucHNQbHVzUHJpY2VzID8/IG51bGwsXG4gICAgc3VwYWJhc2U6IHBhcnNlZC5zdXBhYmFzZSA/PyBudWxsLFxuICAgIGhpdFB1Ymxpc2hlcnM6IHBhcnNlZC5oaXRQdWJsaXNoZXJzID8/IFsuLi5ERUZBVUxUX0hJVF9QVUJMSVNIRVJTXSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZW1wdHlEYigpOiBEYlNoYXBlIHtcbiAgcmV0dXJuIHtcbiAgICBnYW1lczoge30sXG4gICAgc2V0dGluZ3M6IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9LFxuICAgIHBzbjogeyAuLi5ERUZBVUxUX1BTTiB9LFxuICAgIHNvdXJjZXM6IFsuLi5ERUZBVUxUX1NPVVJDRVNdLFxuICAgIGNvbXBldGl0b3JzOiBbLi4uREVGQVVMVF9DT01QRVRJVE9SU10sXG4gICAgY29tcGV0aXRvclByb2R1Y3RzOiB7fSxcbiAgICBjb21wZXRpdG9yTWF0Y2hlczoge30sXG4gICAgY29tcGV0aXRvclJlZnJlc2hlZEF0OiB7fSxcbiAgICBwcm9kdWN0RGV0YWlsczoge30sXG4gICAgd2F0Y2hsaXN0OiB7fSxcbiAgICBhdXRvUmVmcmVzaEludGVydmFsSG91cnM6IDAsXG4gICAgcHNQbHVzUHJpY2VzOiBudWxsLFxuICAgIHN1cGFiYXNlOiBudWxsLFxuICAgIGhpdFB1Ymxpc2hlcnM6IFsuLi5ERUZBVUxUX0hJVF9QVUJMSVNIRVJTXSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbG9hZCgpOiBEYlNoYXBlIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByYXcgPSBmcy5yZWFkRmlsZVN5bmMoREFUQV9GSUxFLCBcInV0Zi04XCIpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdykgYXMgUGFydGlhbDxEYlNoYXBlPjtcbiAgICAgIHJldHVybiBidWlsZERiKHBhcnNlZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBNYWluIGZpbGUgaXMgY29ycnVwdGVkIFx1MjAxNCB0cnkgYmFja3VwXG4gICAgICBjb25zb2xlLndhcm4oXCJbc3RvcmVdIE1haW4gZGF0YSBmaWxlIGNvcnJ1cHRlZCwgbG9hZGluZyBiYWNrdXBcIik7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBiYWNrdXBSYXcgPSBmcy5yZWFkRmlsZVN5bmMoQkFDS1VQX0ZJTEUsIFwidXRmLThcIik7XG4gICAgICAgIGNvbnN0IGJhY2t1cFBhcnNlZCA9IEpTT04ucGFyc2UoYmFja3VwUmF3KSBhcyBQYXJ0aWFsPERiU2hhcGU+O1xuICAgICAgICByZXR1cm4gYnVpbGREYihiYWNrdXBQYXJzZWQpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBlbXB0eURiKCk7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZW1wdHlEYigpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlQmFja3VwKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhEQVRBX0ZJTEUpO1xuICAgIGNvbnN0IGFnZU1zID0gRGF0ZS5ub3coKSAtIHN0YXQubXRpbWVNcztcbiAgICBpZiAoYWdlTXMgPiA2MCAqIDYwICogMTAwMCkge1xuICAgICAgZnMuY29weUZpbGVTeW5jKERBVEFfRklMRSwgQkFDS1VQX0ZJTEUpO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gRmlsZSBtYXkgbm90IGV4aXN0IHlldCBcdTIwMTQgbm90aGluZyB0byBiYWNrIHVwLlxuICB9XG59XG5cbmZ1bmN0aW9uIHBlcnNpc3QoKSB7XG4gIGlmICh3cml0aW5nKSB7XG4gICAgcGVuZGluZ1dyaXRlID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgd3JpdGluZyA9IHRydWU7XG4gIHRyeSB7XG4gICAgZW5zdXJlRGlyKCk7XG4gICAgbWF5YmVCYWNrdXAoKTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKFRNUF9GSUxFLCBKU09OLnN0cmluZ2lmeShkYiwgbnVsbCwgMikpO1xuICAgIGZzLnJlbmFtZVN5bmMoVE1QX0ZJTEUsIERBVEFfRklMRSk7XG4gIH0gZmluYWxseSB7XG4gICAgd3JpdGluZyA9IGZhbHNlO1xuICAgIGlmIChwZW5kaW5nV3JpdGUpIHtcbiAgICAgIHBlbmRpbmdXcml0ZSA9IGZhbHNlO1xuICAgICAgcGVyc2lzdCgpO1xuICAgIH1cbiAgfVxufVxuXG5sZXQgZGI6IERiU2hhcGUgPSBsb2FkKCk7XG5sZXQgc2F2ZVRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuXG4vLyBQZXJzaXN0IG1pZ3JhdGVkIGRhdGEgb24gZmlyc3QgbG9hZCBzbyBuZXcgc291cmNlcy9maWVsZHMgYXJlIHNhdmVkXG50cnkgeyBwZXJzaXN0KCk7IH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxuXG5mdW5jdGlvbiBzY2hlZHVsZVNhdmUoKSB7XG4gIGlmIChzYXZlVGltZXIpIGNsZWFyVGltZW91dChzYXZlVGltZXIpO1xuICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0KHBlcnNpc3QsIDE1MCk7XG59XG5cbmZ1bmN0aW9uIGdhbWVLZXkocGxhdGZvcm06IFBsYXRmb3JtLCByZWdpb246IHN0cmluZywgaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwbGF0Zm9ybX06JHtyZWdpb259OiR7aWR9YDtcbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0ge1xuICBsaXN0R2FtZXMoKTogR2FtZVtdIHtcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhkYi5nYW1lcyk7XG4gIH0sXG4gIGdldEdhbWUoaWQ6IHN0cmluZyk6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5nYW1lc1tpZF07XG4gIH0sXG4gIGdldEdhbWVCeUNvbXBvc2l0ZShwbGF0Zm9ybTogUGxhdGZvcm0sIHJlZ2lvbjogc3RyaW5nLCBpZDogc3RyaW5nKTogR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGRiLmdhbWVzW2dhbWVLZXkocGxhdGZvcm0sIHJlZ2lvbiwgaWQpXTtcbiAgfSxcbiAgdXBzZXJ0R2FtZShnYW1lOiBHYW1lKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ID0gZ2FtZUtleShnYW1lLnBsYXRmb3JtLCBnYW1lLnJlZ2lvbiwgZ2FtZS5pZCk7XG4gICAgZGIuZ2FtZXNba2V5XSA9IGdhbWU7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gIH0sXG4gIHBhdGNoR2FtZShpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxHYW1lPik6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZGIuZ2FtZXNbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogR2FtZSA9IHsgLi4uZXhpc3RpbmcsIC4uLnBhdGNoLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9O1xuICAgIGRiLmdhbWVzW2lkXSA9IHVwZGF0ZWQ7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHVwZGF0ZWQ7XG4gIH0sXG4gIG1hcmtJbmFjdGl2ZUlmTWlzc2luZyhzZWVuS2V5czogU2V0PHN0cmluZz4sIHBsYXRmb3JtPzogUGxhdGZvcm0sIHJlZ2lvbj86IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGddIG9mIE9iamVjdC5lbnRyaWVzKGRiLmdhbWVzKSkge1xuICAgICAgaWYgKCFnLmFjdGl2ZSkgY29udGludWU7XG4gICAgICBpZiAocGxhdGZvcm0gJiYgZy5wbGF0Zm9ybSAhPT0gcGxhdGZvcm0pIGNvbnRpbnVlO1xuICAgICAgaWYgKHJlZ2lvbiAmJiBnLnJlZ2lvbiAhPT0gcmVnaW9uKSBjb250aW51ZTtcbiAgICAgIGlmICghc2VlbktleXMuaGFzKGtleSkpIHtcbiAgICAgICAgZy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgZy51cGRhdGVkQXQgPSBub3c7XG4gICAgICAgIG4rKztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG4gPiAwKSBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gbjtcbiAgfSxcbiAgZ2V0U2V0dGluZ3MoKTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICByZXR1cm4geyAuLi5kYi5zZXR0aW5ncyB9O1xuICB9LFxuICB1cGRhdGVTZXR0aW5ncyhwYXRjaDogUGFydGlhbDxQcmljaW5nU2V0dGluZ3M+KTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICBkYi5zZXR0aW5ncyA9IHsgLi4uZGIuc2V0dGluZ3MsIC4uLnBhdGNoIH07XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHsgLi4uZGIuc2V0dGluZ3MgfTtcbiAgfSxcbiAgZ2V0UHNuKCk6IFBzbkNvbmZpZyB7XG4gICAgcmV0dXJuIHsgLi4uZGIucHNuIH07XG4gIH0sXG4gIHVwZGF0ZVBzbihwYXRjaDogUGFydGlhbDxQc25Db25maWc+KTogUHNuQ29uZmlnIHtcbiAgICBkYi5wc24gPSB7IC4uLmRiLnBzbiwgLi4ucGF0Y2ggfTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4geyAuLi5kYi5wc24gfTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvcnMoKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvcnMobGlzdDogQ29tcGV0aXRvckNvbmZpZ1tdKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICBkYi5jb21wZXRpdG9ycyA9IGxpc3QubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvclByb2R1Y3RzKGtleTogc3RyaW5nLCBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSwgcmVmcmVzaGVkQXQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JQcm9kdWN0c1trZXldID0gcHJvZHVjdHM7XG4gICAgZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0W2tleV0gPSByZWZyZXNoZWRBdDtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGVuYWJsZWRPbmx5ID0gdHJ1ZSk6IENvbXBldGl0b3JQcm9kdWN0W10ge1xuICAgIGNvbnN0IGVuYWJsZWQgPSBuZXcgU2V0KFxuICAgICAgZGIuY29tcGV0aXRvcnMuZmlsdGVyKChjKSA9PiAhZW5hYmxlZE9ubHkgfHwgYy5lbmFibGVkKS5tYXAoKGMpID0+IGMua2V5KVxuICAgICk7XG4gICAgY29uc3Qgb3V0OiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCBsaXN0XSBvZiBPYmplY3QuZW50cmllcyhkYi5jb21wZXRpdG9yUHJvZHVjdHMpKSB7XG4gICAgICBpZiAoIWVuYWJsZWQuaGFzKGtleSkpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBwIG9mIGxpc3QpIG91dC5wdXNoKHApO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9LFxuICBnZXRDb21wZXRpdG9yUmVmcmVzaGVkQXQoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gICAgcmV0dXJuIHsgLi4uZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0IH07XG4gIH0sXG4gIHNldENvbXBldGl0b3JNYXRjaGVzKG1hdGNoZXM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPik6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JNYXRjaGVzID0gbWF0Y2hlcztcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvck1hdGNoZXMoZ2FtZUlkOiBzdHJpbmcpOiBDb21wZXRpdG9yTWF0Y2hbXSB7XG4gICAgcmV0dXJuIGRiLmNvbXBldGl0b3JNYXRjaGVzW2dhbWVJZF0gPz8gW107XG4gIH0sXG4gIGdldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZyk6IFByb2R1Y3REZXRhaWwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5wcm9kdWN0RGV0YWlsc1tpZF07XG4gIH0sXG4gIHNldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZywgZGV0YWlsOiBQcm9kdWN0RGV0YWlsKTogdm9pZCB7XG4gICAgZGIucHJvZHVjdERldGFpbHNbaWRdID0gZGV0YWlsO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICB9LFxuICBsaXN0V2F0Y2hsaXN0KCk6IFdhdGNoZWRHYW1lW10ge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKGRiLndhdGNobGlzdCk7XG4gIH0sXG4gIGdldFdhdGNoZWQoaWQ6IHN0cmluZyk6IFdhdGNoZWRHYW1lIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gZGIud2F0Y2hsaXN0W2lkXTtcbiAgfSxcbiAgdXBzZXJ0V2F0Y2hlZChlbnRyeTogV2F0Y2hlZEdhbWUpOiBXYXRjaGVkR2FtZSB7XG4gICAgZGIud2F0Y2hsaXN0W2VudHJ5LmlkXSA9IGVudHJ5O1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB7IC4uLmVudHJ5IH07XG4gIH0sXG4gIHBhdGNoV2F0Y2hlZChpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxXYXRjaGVkR2FtZT4pOiBXYXRjaGVkR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBkYi53YXRjaGxpc3RbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogV2F0Y2hlZEdhbWUgPSB7IC4uLmV4aXN0aW5nLCAuLi5wYXRjaCB9O1xuICAgIGRiLndhdGNobGlzdFtpZF0gPSB1cGRhdGVkO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB1cGRhdGVkO1xuICB9LFxuICByZW1vdmVXYXRjaGVkKGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWRiLndhdGNobGlzdFtpZF0pIHJldHVybiBmYWxzZTtcbiAgICBkZWxldGUgZGIud2F0Y2hsaXN0W2lkXTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgZ2V0U291cmNlcygpOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICByZXR1cm4gZGIuc291cmNlcy5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICB9LFxuICBzZXRTb3VyY2VzKGxpc3Q6IFByb3ZpZGVyU291cmNlW10pOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICBkYi5zb3VyY2VzID0gbGlzdC5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiBkYi5zb3VyY2VzLm1hcCgocykgPT4gKHsgLi4ucyB9KSk7XG4gIH0sXG4gIGdldEF1dG9SZWZyZXNoSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gZGIuYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzID8/IDA7XG4gIH0sXG4gIHNldEF1dG9SZWZyZXNoSW50ZXJ2YWwoaG91cnM6IG51bWJlcik6IHZvaWQge1xuICAgIGRiLmF1dG9SZWZyZXNoSW50ZXJ2YWxIb3VycyA9IE1hdGgubWF4KDAsIGhvdXJzKTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0UHNQbHVzUHJpY2VzKCk6IERiU2hhcGVbXCJwc1BsdXNQcmljZXNcIl0ge1xuICAgIHJldHVybiBkYi5wc1BsdXNQcmljZXM7XG4gIH0sXG4gIHNldFBzUGx1c1ByaWNlcyhkYXRhOiBEYlNoYXBlW1wicHNQbHVzUHJpY2VzXCJdKTogdm9pZCB7XG4gICAgZGIucHNQbHVzUHJpY2VzID0gZGF0YTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0U3VwYWJhc2UoKTogU3VwYWJhc2VDb25maWcgfCBudWxsIHtcbiAgICByZXR1cm4gZGIuc3VwYWJhc2UgPyB7IC4uLmRiLnN1cGFiYXNlIH0gOiBudWxsO1xuICB9LFxuICBzZXRTdXBhYmFzZShjZmc6IFN1cGFiYXNlQ29uZmlnIHwgbnVsbCk6IHZvaWQge1xuICAgIGRiLnN1cGFiYXNlID0gY2ZnID8geyAuLi5jZmcgfSA6IG51bGw7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gIH0sXG4gIGdldEhpdFB1Ymxpc2hlcnMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBbLi4uZGIuaGl0UHVibGlzaGVyc107XG4gIH0sXG4gIHNldEhpdFB1Ymxpc2hlcnMobGlzdDogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBkYi5oaXRQdWJsaXNoZXJzID0gWy4uLmxpc3RdO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICB9LFxuICBmbHVzaCgpOiB2b2lkIHtcbiAgICBpZiAoc2F2ZVRpbWVyKSBjbGVhclRpbWVvdXQoc2F2ZVRpbWVyKTtcbiAgICBwZXJzaXN0KCk7XG4gIH0sXG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJpY2luZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcmljaW5nLnRzXCI7aW1wb3J0IHR5cGUgeyBQcmljaW5nU2V0dGluZ3MgfSBmcm9tIFwiLi9zdG9yZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNhbGVQcmljZXMge1xuICBjb3N0Q2xwOiBudW1iZXI7XG4gIHByaW1hcmlhOiBudW1iZXI7XG4gIHNlY3VuZGFyaWE6IG51bWJlcjtcbiAgLyoqIFJldmVudWUgaWYgYm90aCBwcmltYXJpYSBzbG90cyBzZWxsICsgMSBzZWN1bmRhcmlhICovXG4gIHRvdGFsUmV2ZW51ZTogbnVtYmVyO1xuICAvKiogTmV0IHByb2ZpdCBmcm9tIGEgZnVsbCBzZWxsLXRocm91Z2ggKDJcdTAwRDcgcHJpbWFyaWEgKyAxXHUwMEQ3IHNlY3VuZGFyaWEpICovXG4gIG5ldFByb2ZpdDogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiByb3VuZFRvKHZhbHVlOiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7XG4gIGlmIChzdGVwIDw9IDApIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlKTtcbiAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgLyBzdGVwKSAqIHN0ZXA7XG59XG5cbi8qKiBQc3ljaG9sb2dpY2FsIHByaWNpbmc6IHJvdW5kcyB0byBuZWFyZXN0IFguOTkwIGZvciBjb25zdW1lci1mYWNpbmcgcHJpY2VzLlxuICogIGUuZy4gMTQyNDAgXHUyMTkyIDE0OTkwLCA4ODAwIFx1MjE5MiA4OTkwLCAzMjAwIFx1MjE5MiAyOTkwICovXG5mdW5jdGlvbiByb3VuZENvbW1lcmNpYWwodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICh2YWx1ZSA8IDEwMDApIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlIC8gMTAwKSAqIDEwMDtcbiAgcmV0dXJuIE1hdGguY2VpbCh2YWx1ZSAvIDEwMDApICogMTAwMCAtIDEwO1xufVxuXG5mdW5jdGlvbiBleGNoYW5nZVJhdGUoY3VycmVuY3k6IHN0cmluZywgY2ZnOiBQcmljaW5nU2V0dGluZ3MpOiBudW1iZXIge1xuICBzd2l0Y2ggKGN1cnJlbmN5KSB7XG4gICAgY2FzZSBcIkJSTFwiOiByZXR1cm4gY2ZnLmJybFRvQ2xwO1xuICAgIGNhc2UgXCJUUllcIjogcmV0dXJuIGNmZy50cnlUb0NscDtcbiAgICBjYXNlIFwiSlBZXCI6IHJldHVybiBjZmcuanB5VG9DbHA7XG4gICAgY2FzZSBcIlVTRFwiOlxuICAgIGRlZmF1bHQ6ICAgIHJldHVybiBjZmcudXNkVG9DbHA7XG4gIH1cbn1cblxuZnVuY3Rpb24gYmFsYW5jZURpc2NvdW50KGN1cnJlbmN5OiBzdHJpbmcsIGNmZzogUHJpY2luZ1NldHRpbmdzKTogbnVtYmVyIHtcbiAgc3dpdGNoIChjdXJyZW5jeSkge1xuICAgIGNhc2UgXCJCUkxcIjogcmV0dXJuIGNmZy5iYWxhbmNlRGlzY291bnRCcmwgPz8gMS4wO1xuICAgIGNhc2UgXCJUUllcIjogcmV0dXJuIGNmZy5iYWxhbmNlRGlzY291bnRUcnkgPz8gMS4wO1xuICAgIGNhc2UgXCJVU0RcIjpcbiAgICBkZWZhdWx0OiAgICByZXR1cm4gY2ZnLmJhbGFuY2VEaXNjb3VudFVzZCA/PyAxLjA7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVTYWxlUHJpY2VzKFxuICBwcmljZUNlbnRzOiBudW1iZXIgfCBudWxsLFxuICBjZmc6IFByaWNpbmdTZXR0aW5ncyxcbiAgY3VycmVuY3kgPSBcIlVTRFwiXG4pOiBTYWxlUHJpY2VzIHwgbnVsbCB7XG4gIGlmIChwcmljZUNlbnRzID09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBwcmljZSA9IHByaWNlQ2VudHMgLyAxMDA7XG4gIGNvbnN0IHJhdGUgPSBleGNoYW5nZVJhdGUoY3VycmVuY3ksIGNmZyk7XG4gIGNvbnN0IGRpc2NvdW50ID0gYmFsYW5jZURpc2NvdW50KGN1cnJlbmN5LCBjZmcpO1xuICBjb25zdCBjb3N0ID0gcHJpY2UgKiBkaXNjb3VudCAqIHJhdGU7XG4gIGNvbnN0IGNvc3RDbHAgPSByb3VuZFRvKGNvc3QsIGNmZy5yb3VuZFRvKTtcblxuICBjb25zdCBwcmltYXJpYVJhdyA9IGNvc3QgKiBjZmcucHJpbWFyaWFNdWx0O1xuICBjb25zdCBzZWN1bmRhcmlhUmF3ID0gY29zdCAqIGNmZy5zZWN1bmRhcmlhTXVsdDtcblxuICBjb25zdCBwcmltYXJpYSA9IGNmZy5jb21tZXJjaWFsUm91bmRpbmcgIT09IGZhbHNlXG4gICAgPyByb3VuZENvbW1lcmNpYWwocHJpbWFyaWFSYXcpXG4gICAgOiByb3VuZFRvKHByaW1hcmlhUmF3LCBjZmcucm91bmRUbyk7XG4gIGNvbnN0IHNlY3VuZGFyaWEgPSBjZmcuY29tbWVyY2lhbFJvdW5kaW5nICE9PSBmYWxzZVxuICAgID8gcm91bmRDb21tZXJjaWFsKHNlY3VuZGFyaWFSYXcpXG4gICAgOiByb3VuZFRvKHNlY3VuZGFyaWFSYXcsIGNmZy5yb3VuZFRvKTtcblxuICBjb25zdCB0b3RhbFJldmVudWUgPSBwcmltYXJpYSAqIDIgKyBzZWN1bmRhcmlhO1xuICByZXR1cm4ge1xuICAgIGNvc3RDbHAsXG4gICAgcHJpbWFyaWEsXG4gICAgc2VjdW5kYXJpYSxcbiAgICB0b3RhbFJldmVudWUsXG4gICAgbmV0UHJvZml0OiB0b3RhbFJldmVudWUgLSBjb3N0Q2xwLFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHNuLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi50c1wiOy8qKlxuICogUFNOIFN0b3JlIHNjcmFwZXIuXG4gKlxuICogUFNOIG5vdyBzZXJ2ZXItc2lkZS1yZW5kZXJzIHRoZSBjYXRlZ29yeSBwYWdlcyAoTmV4dC5qcykuIFRoZSBwcm9kdWN0IGdyaWRcbiAqIGlzIGVtYmVkZGVkIGFzIEpTT04gaW5zaWRlIGEgYDxzY3JpcHQgaWQ9XCJfX05FWFRfREFUQV9fXCI+YCB0YWcgXHUyMDE0IHdlIGZldGNoXG4gKiB0aGUgSFRNTCBhbmQgcGFyc2UgdGhhdCBibG9iIGluc3RlYWQgb2YgaGl0dGluZyB0aGUgR3JhcGhRTCBlbmRwb2ludCB3aXRoXG4gKiBwZXJzaXN0ZWQgcXVlcmllcy4gTm8gc2hhMjU2IGhhc2hlcyB0byBrZWVwIHVwIHRvIGRhdGUuXG4gKlxuICogICBHRVQgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vPHJlZ2lvbj4vY2F0ZWdvcnkvPGNhdGVnb3J5SWQ+LzxwYWdlPlxuICpcbiAqIFdlIHBhZ2luYXRlIGJ5IHdhbGtpbmcgLzEsIC8yLCAvMyB1bnRpbCBhIHBhZ2UgcmV0dXJucyBubyBuZXcgcHJvZHVjdHMuXG4gKi9cbmltcG9ydCB0eXBlIHsgR2FtZSwgUHNuQ29uZmlnIH0gZnJvbSBcIi4vc3RvcmVcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuLyoqIEtlcHQgZm9yIEFQSSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIG9sZCBjbGllbnQ7IG5vIGxvbmdlciB0aHJvd24uICovXG5leHBvcnQgY2xhc3MgUGVyc2lzdGVkUXVlcnlOb3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIlBTTiBwZXJzaXN0ZWQgcXVlcnkgaGFzaCBpcyBzdGFsZS5cIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBzbkFwaUVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuLyoqIEVudW0gdmFsdWVzIFBTTiB1c2VzIGZvciByZWFsIGdhbWVzIChub3QgRExDIC8gY3VycmVuY3kgLyB0aGVtZXMgL1xuICogIGF2YXRhcnMgLyBzdWJzY3JpcHRpb25zKS4gYHN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uYCBpcyB0aGUgc3RhYmxlXG4gKiAgbm9uLWxvY2FsaXplZCBmaWVsZDsgd2UgYWxzbyBhY2NlcHQgdGhlIGh1bWFuIHN0cmluZ3MgYXMgZmFsbGJhY2suXG4gKiAgQ29uZmlybWVkIGFnYWluc3QgbGl2ZSBlbi1VUyBjYXRhbG9nIG9uIDIwMjYtMDQtMTMuICovXG5jb25zdCBHQU1FX0VOVU0gPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZVTExfR0FNRVwiLFxuICBcIkdBTUVfQlVORExFXCIsXG4gIFwiUFJFTUlVTV9FRElUSU9OXCIsXG4gIFwiQlVORExFXCIsXG5dKTtcblxuY29uc3QgR0FNRV9MQUJFTFMgPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZ1bGwgR2FtZVwiLFxuICBcIkdhbWUgQnVuZGxlXCIsXG4gIFwiUHJlbWl1bSBFZGl0aW9uXCIsXG4gIFwiQnVuZGxlXCIsXG5dKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVsbEdhbWVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCk6IGJvb2xlYW4ge1xuICBjb25zdCBlID0gU3RyaW5nKHJhdy5zdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbiB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICBpZiAoZSAmJiBHQU1FX0VOVU0uaGFzKGUpKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgbCA9IFN0cmluZyhyYXcubG9jYWxpemVkU3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHwgXCJcIikudHJpbSgpO1xuICByZXR1cm4gR0FNRV9MQUJFTFMuaGFzKGwpO1xufVxuXG5mdW5jdGlvbiBwcmljZVRvQ2VudHModjogdW5rbm93bik6IG51bWJlciB8IG51bGwge1xuICBpZiAodiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcyA9IFN0cmluZyh2KS50cmltKCk7XG4gIGlmICghcyB8fCAvXmZyZWUkL2kudGVzdChzKSB8fCAvXmdyYXRpcyQvaS50ZXN0KHMpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2xlYW5lZCA9IHMucmVwbGFjZSgvW14wLTkuLC1dL2csIFwiXCIpLnJlcGxhY2UoLywvZywgXCIuXCIpO1xuICBjb25zdCBwYXJ0cyA9IGNsZWFuZWQuc3BsaXQoXCIuXCIpO1xuICBjb25zdCBub3JtID1cbiAgICBwYXJ0cy5sZW5ndGggPiAyID8gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4oXCJcIikgKyBcIi5cIiArIHBhcnRzLmF0KC0xKSA6IGNsZWFuZWQ7XG4gIGNvbnN0IG4gPSBOdW1iZXIobm9ybSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIE1hdGgucm91bmQobiAqIDEwMCk7XG59XG5cbmludGVyZmFjZSBSYXdQcm9kdWN0IHtcbiAgaWQ/OiBzdHJpbmc7XG4gIHByb2R1Y3RJZD86IHN0cmluZztcbiAgY29uY2VwdElkPzogc3RyaW5nO1xuICBuYW1lPzogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbiAgcGxhdGZvcm1zPzogc3RyaW5nW10gfCBzdHJpbmc7XG4gIC8qKiBQU04gY2xhc3NpZmllcyBpdGVtcyBoZXJlOiBcIkZ1bGwgR2FtZVwiLCBcIkFkZC1PblwiLCBcIkdhbWUgQnVuZGxlXCIsXG4gICAqICBcIkN1cnJlbmN5XCIsIFwiQXZhdGFyXCIsIFwiVGhlbWVcIiwgXCJQUyBQbHVzIFx1MDBCNyBGdWxsIEdhbWVcIiwgZXRjLiAqL1xuICBsb2NhbGl6ZWRTdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcbiAgc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24/OiBzdHJpbmc7XG4gIC8qKiBFbnVtLWlzaDogR0FNRSAvIEJVTkRMRSAvIEFERE9OIC8gQ1VSUkVOQ1kgLyBUSEVNRSAvIEFQUCAvIFNVQlNDUklQVElPTi4gKi9cbiAgcHJvZHVjdFR5cGU/OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIG1lZGlhPzogQXJyYXk8eyByb2xlPzogc3RyaW5nOyB1cmw/OiBzdHJpbmc7IHR5cGU/OiBzdHJpbmcgfT4gfCBudWxsO1xuICB3ZWJjdGFzPzogQXJyYXk8e1xuICAgIHByaWNlPzoge1xuICAgICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgICBiYXNlUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkVmFsdWU/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudFRleHQ/OiBzdHJpbmc7XG4gICAgICBlbmRUaW1lPzogc3RyaW5nO1xuICAgIH07XG4gIH0+IHwgbnVsbDtcbiAgcHJpY2U/OiB7XG4gICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgYmFzZVByaWNlPzogc3RyaW5nO1xuICAgIGRpc2NvdW50ZWRWYWx1ZT86IHN0cmluZztcbiAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgZGlzY291bnRUZXh0Pzogc3RyaW5nO1xuICAgIGVuZFRpbWU/OiBzdHJpbmc7XG4gIH07XG4gIC8qKiBDb3Zlci9wb3J0cmFpdCBpbWFnZSBleHRyYWN0ZWQgZnJvbSB0aGUgSFRNTCBncmlkIHRpbGUgKDQ0MFx1MDBENzQ0MCkuXG4gICAqICBUaGlzIGlzIHRoZSBhY3R1YWwgYm94IGFydCBzaG93biBpbiB0aGUgc3RvcmUsIG5vdCB0aGUgYmFubmVyLiAqL1xuICB0aWxlSW1hZ2VVcmw/OiBzdHJpbmc7XG59XG5cbi8qKiBTaGFwZSByZXR1cm5lZCBieSBgaW5zcGVjdFByb2R1Y3RUeXBlc2AgXHUyMDE0IHVzZWQgYnkgdGhlIGRlYnVnIHJvdXRlIHRvXG4gKiAgZmlndXJlIG91dCB0aGUgcmVhbCBjbGFzc2lmaWNhdGlvbiBmaWVsZCBuYW1lcyBiZWZvcmUgd3JpdGluZyB0aGUgZmlsdGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0VHlwZUluc3BlY3Rpb24ge1xuICB0b3RhbFNlZW46IG51bWJlcjtcbiAgY2xhc3NpZmljYXRpb25zOiBBcnJheTx7XG4gICAgY2xhc3NpZmljYXRpb246IHN0cmluZztcbiAgICBwcm9kdWN0VHlwZTogc3RyaW5nO1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgc2FtcGxlczogc3RyaW5nW107XG4gIH0+O1xuICAvKiogRXZlcnkgdG9wLWxldmVsIGtleSBldmVyIHNlZW4gb24gYSBwcm9kdWN0IG9iamVjdCwgd2l0aCBhbiBleGFtcGxlXG4gICAqICB2YWx1ZSBmcm9tIHRoZSBmaXJzdCBwcm9kdWN0IHRoYXQgaGFkIGl0LiBIZWxwcyBzcG90IGFueSBmaWVsZCBuYW1lXG4gICAqICB2YXJpYXRpb24gd2UgbWlzc2VkLiAqL1xuICBvYnNlcnZlZEtleXM6IEFycmF5PHsga2V5OiBzdHJpbmc7IGV4YW1wbGU6IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3BlY3RQcm9kdWN0VHlwZXMoXG4gIGNmZzogUHNuQ29uZmlnXG4pOiBQcm9taXNlPFByb2R1Y3RUeXBlSW5zcGVjdGlvbj4ge1xuICBjb25zdCBieUNvbWJvID0gbmV3IE1hcDxcbiAgICBzdHJpbmcsXG4gICAgeyBjbGFzc2lmaWNhdGlvbjogc3RyaW5nOyBwcm9kdWN0VHlwZTogc3RyaW5nOyBjb3VudDogbnVtYmVyOyBzYW1wbGVzOiBzdHJpbmdbXSB9XG4gID4oKTtcbiAgY29uc3Qgb2JzZXJ2ZWRLZXlzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgYXdhaXQgKGNvbnN0IHJhdyBvZiBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyhjZmcpKSB7XG4gICAgdG90YWwrKztcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhyYXcpKSB7XG4gICAgICBpZiAob2JzZXJ2ZWRLZXlzLmhhcyhrKSkgY29udGludWU7XG4gICAgICBsZXQgZXhhbXBsZTogc3RyaW5nO1xuICAgICAgaWYgKHYgPT0gbnVsbCkgZXhhbXBsZSA9IFwibnVsbFwiO1xuICAgICAgZWxzZSBpZiAodHlwZW9mIHYgPT09IFwib2JqZWN0XCIpIGV4YW1wbGUgPSBKU09OLnN0cmluZ2lmeSh2KS5zbGljZSgwLCAxMjApO1xuICAgICAgZWxzZSBleGFtcGxlID0gU3RyaW5nKHYpLnNsaWNlKDAsIDEyMCk7XG4gICAgICBvYnNlcnZlZEtleXMuc2V0KGssIGV4YW1wbGUpO1xuICAgIH1cbiAgICBjb25zdCBjbHMgPVxuICAgICAgcmF3LmxvY2FsaXplZFN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uIHx8XG4gICAgICByYXcuc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHxcbiAgICAgIFwiXCI7XG4gICAgY29uc3QgcHQgPSByYXcucHJvZHVjdFR5cGUgfHwgcmF3LnR5cGUgfHwgXCJcIjtcbiAgICBjb25zdCBrZXkgPSBgJHtjbHN9XFx1MDAwMSR7cHR9YDtcbiAgICBjb25zdCBleGlzdGluZyA9IGJ5Q29tYm8uZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICBleGlzdGluZy5jb3VudCsrO1xuICAgICAgaWYgKGV4aXN0aW5nLnNhbXBsZXMubGVuZ3RoIDwgMyAmJiByYXcubmFtZSkgZXhpc3Rpbmcuc2FtcGxlcy5wdXNoKHJhdy5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnlDb21iby5zZXQoa2V5LCB7XG4gICAgICAgIGNsYXNzaWZpY2F0aW9uOiBjbHMsXG4gICAgICAgIHByb2R1Y3RUeXBlOiBwdCxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHNhbXBsZXM6IHJhdy5uYW1lID8gW3Jhdy5uYW1lXSA6IFtdLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY2xhc3NpZmljYXRpb25zID0gWy4uLmJ5Q29tYm8udmFsdWVzKCldLnNvcnQoKGEsIGIpID0+IGIuY291bnQgLSBhLmNvdW50KTtcbiAgY29uc3Qga2V5cyA9IFsuLi5vYnNlcnZlZEtleXMuZW50cmllcygpXVxuICAgIC5zb3J0KChbYV0sIFtiXSkgPT4gYS5sb2NhbGVDb21wYXJlKGIpKVxuICAgIC5tYXAoKFtrZXksIGV4YW1wbGVdKSA9PiAoeyBrZXksIGV4YW1wbGUgfSkpO1xuXG4gIHJldHVybiB7IHRvdGFsU2VlbjogdG90YWwsIGNsYXNzaWZpY2F0aW9ucywgb2JzZXJ2ZWRLZXlzOiBrZXlzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCwgbm93OiBzdHJpbmcpOiBHYW1lIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gcmF3LmlkIHx8IHJhdy5wcm9kdWN0SWQgfHwgcmF3LmNvbmNlcHRJZDtcbiAgaWYgKCFpZCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgbmFtZSA9IHJhdy5uYW1lIHx8IHJhdy50aXRsZSB8fCBcIlwiO1xuICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gIC8vIEltYWdlOiBwcmVmZXIgdGhlIHRpbGUgaW1hZ2UgZXh0cmFjdGVkIGZyb20gdGhlIEhUTUwgZ3JpZCAodGhlIGFjdHVhbFxuICAvLyA0NDBcdTAwRDc0NDAgY292ZXIgYXJ0IHRoZSBzdG9yZSBkaXNwbGF5cykuIEZhbGwgYmFjayB0byBtZWRpYSByb2xlcyBmcm9tIEpTT04uXG4gIGxldCBpbWFnZVVybDogc3RyaW5nIHwgbnVsbCA9IHJhdy50aWxlSW1hZ2VVcmwgfHwgbnVsbDtcbiAgaWYgKCFpbWFnZVVybCkge1xuICAgIGNvbnN0IG1lZGlhID0gcmF3Lm1lZGlhIHx8IFtdO1xuICAgIGNvbnN0IHByZWZlcnJlZFBvcnRyYWl0ID0gW1wiUE9SVFJBSVRfQkFOTkVSXCIsIFwiR0FNRUhVQl9DT1ZFUl9BUlRcIiwgXCJCT1hBUlRcIl07XG4gICAgY29uc3QgZmFsbGJhY2tSb2xlcyA9IFtcIk1BU1RFUlwiLCBcIlBSRVZJRVdfR0FNRV9BUlRcIl07XG4gICAgZm9yIChjb25zdCBtIG9mIG1lZGlhKSB7XG4gICAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICAgIGlmIChwcmVmZXJyZWRQb3J0cmFpdC5pbmNsdWRlcyhyb2xlKSkge1xuICAgICAgICBpbWFnZVVybCA9IG0udXJsID8/IG51bGw7XG4gICAgICAgIGlmIChpbWFnZVVybCkgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaW1hZ2VVcmwpIHtcbiAgICAgIGZvciAoY29uc3QgbSBvZiBtZWRpYSkge1xuICAgICAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKGZhbGxiYWNrUm9sZXMuaW5jbHVkZXMocm9sZSkpIHtcbiAgICAgICAgICBpbWFnZVVybCA9IG0udXJsID8/IG51bGw7XG4gICAgICAgICAgaWYgKGltYWdlVXJsKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWltYWdlVXJsICYmIG1lZGlhWzBdPy51cmwpIGltYWdlVXJsID0gbWVkaWFbMF0udXJsO1xuICB9XG5cbiAgY29uc3QgcGxhdGZvcm1zID0gQXJyYXkuaXNBcnJheShyYXcucGxhdGZvcm1zKVxuICAgID8gcmF3LnBsYXRmb3Jtcy5qb2luKFwiLFwiKVxuICAgIDogcmF3LnBsYXRmb3JtcyA/PyBcIlwiO1xuXG4gIGNvbnN0IHByaWNlID0gcmF3LndlYmN0YXM/LlswXT8ucHJpY2UgPz8gcmF3LnByaWNlID8/IHt9O1xuICBjb25zdCBwcmljZU9yaWdpbmFsQ2VudHMgPSBwcmljZVRvQ2VudHMocHJpY2UuYmFzZVByaWNlVmFsdWUgPz8gcHJpY2UuYmFzZVByaWNlKTtcbiAgbGV0IHByaWNlRGlzY291bnRlZENlbnRzID0gcHJpY2VUb0NlbnRzKFxuICAgIHByaWNlLmRpc2NvdW50ZWRWYWx1ZSA/PyBwcmljZS5kaXNjb3VudGVkUHJpY2VcbiAgKTtcbiAgaWYgKHByaWNlRGlzY291bnRlZENlbnRzID09IG51bGwpIHByaWNlRGlzY291bnRlZENlbnRzID0gcHJpY2VPcmlnaW5hbENlbnRzO1xuXG4gIGxldCBkaXNjb3VudFBlcmNlbnQgPSAwO1xuICBjb25zdCBkdCA9IHByaWNlLmRpc2NvdW50VGV4dCB8fCBcIlwiO1xuICBjb25zdCBtID0gLyhcXGQrKS8uZXhlYyhTdHJpbmcoZHQpKTtcbiAgaWYgKG0pIGRpc2NvdW50UGVyY2VudCA9IHBhcnNlSW50KG1bMV0sIDEwKTtcbiAgaWYgKFxuICAgICFkaXNjb3VudFBlcmNlbnQgJiZcbiAgICBwcmljZU9yaWdpbmFsQ2VudHMgJiZcbiAgICBwcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgcHJpY2VPcmlnaW5hbENlbnRzID4gMCAmJlxuICAgIHByaWNlRGlzY291bnRlZENlbnRzIDwgcHJpY2VPcmlnaW5hbENlbnRzXG4gICkge1xuICAgIGRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAoKHByaWNlT3JpZ2luYWxDZW50cyAtIHByaWNlRGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBwcmljZU9yaWdpbmFsQ2VudHNcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpZDogU3RyaW5nKGlkKSxcbiAgICBwbGF0Zm9ybTogXCJwc25cIiBhcyBjb25zdCxcbiAgICByZWdpb246IFwidXNcIixcbiAgICBuYW1lLFxuICAgIGltYWdlVXJsLFxuICAgIHN0b3JlVXJsOiBgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vZW4tdXMvcHJvZHVjdC8ke2lkfWAsXG4gICAgcGxhdGZvcm1zLFxuICAgIGN1cnJlbmN5OiBcIlVTRFwiLFxuICAgIHByaWNlT3JpZ2luYWxDZW50cyxcbiAgICBwcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgZGlzY291bnRFbmRBdDogcHJpY2UuZW5kVGltZSB8fCBudWxsLFxuICAgIHNlbGVjdGVkOiBmYWxzZSxcbiAgICBwdWJsaXNoZWQ6IGZhbHNlLFxuICAgIG5vdGVzOiBcIlwiLFxuICAgIHlvdXR1YmVVcmw6IFwiXCIsXG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIGZpcnN0U2VlbkF0OiBub3csXG4gICAgbGFzdFNlZW5BdDogbm93LFxuICAgIHVwZGF0ZWRBdDogbm93LFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEh0bWwodXJsOiBzdHJpbmcsIHJlZ2lvbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93biA9IG51bGw7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNDsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBhY2NlcHQ6XG4gICAgICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IHJlZ2lvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJlc1wiKSA/IFwiZXNcIiA6IFwiZW4tVVNcIixcbiAgICAgICAgICBcIngtcHNuLXN0b3JlLWxvY2FsZS1vdmVycmlkZVwiOiByZWdpb24sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDA0KSB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoYENhdGVnb3J5IG5vdCBmb3VuZCAoNDA0KTogJHt1cmx9YCk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwMylcbiAgICAgICAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFwiUFNOIHJldHVybmVkIDQwMyAoSVAvQ2xvdWRmbGFyZSBibG9jaylcIik7XG4gICAgICBpZiAoci5zdGF0dXMgPj0gNTAwKSB0aHJvdyBuZXcgRXJyb3IoYFBTTiAke3Iuc3RhdHVzfWApO1xuICAgICAgcmV0dXJuIGF3YWl0IHIudGV4dCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHRocm93IGU7XG4gICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgYFBTTiBIVE1MIGZldGNoIGZhaWxlZCBhZnRlciByZXRyaWVzOiAkeyhsYXN0RXJyb3IgYXMgRXJyb3IpPy5tZXNzYWdlIHx8IGxhc3RFcnJvcn1gXG4gICk7XG59XG5cbi8qKiBFeHRyYWN0IHRoZSBKU09OIHBheWxvYWQgZnJvbSBgPHNjcmlwdCBpZD1cIl9fTkVYVF9EQVRBX19cIj5cdTIwMjY8L3NjcmlwdD5gLiAqL1xuZnVuY3Rpb24gZXh0cmFjdE5leHREYXRhKGh0bWw6IHN0cmluZyk6IGFueSB8IG51bGwge1xuICBjb25zdCBtID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoXG4gICAgaHRtbFxuICApO1xuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKG1bMV0pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHdhbGsgYSBKU09OIHRyZWUgYW5kIGNvbGxlY3QgYW55dGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgUFNOXG4gKiBwcm9kdWN0IGVudHJ5LiBNYXRjaGVzIG9iamVjdHMgd2l0aCBhbiBgaWRgL2Bwcm9kdWN0SWRgIHBsdXMgZWl0aGVyIGFcbiAqIGBuYW1lYC9gdGl0bGVgIGFuZCBhIGBwcmljZWAvYHdlYmN0YXNgLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvZHVjdHMobm9kZTogdW5rbm93biwgb3V0OiBNYXA8c3RyaW5nLCBSYXdQcm9kdWN0Pik6IHZvaWQge1xuICBpZiAoIW5vZGUpIHJldHVybjtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICBmb3IgKGNvbnN0IHYgb2Ygbm9kZSkgY29sbGVjdFByb2R1Y3RzKHYsIG91dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlb2Ygbm9kZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuICBjb25zdCBvYmogPSBub2RlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXG4gIGNvbnN0IGlkID0gKG9iai5pZCB8fCBvYmoucHJvZHVjdElkIHx8IG9iai5jb25jZXB0SWQpIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgbmFtZSA9IChvYmoubmFtZSB8fCBvYmoudGl0bGUpIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgaGFzUHJpY2UgPVxuICAgIChvYmoucHJpY2UgJiYgdHlwZW9mIG9iai5wcmljZSA9PT0gXCJvYmplY3RcIikgfHxcbiAgICAoQXJyYXkuaXNBcnJheShvYmoud2ViY3RhcykgJiYgb2JqLndlYmN0YXMubGVuZ3RoID4gMCk7XG4gIC8vIFByb2R1Y3QgSURzIG9uIFBTTiBsb29rIGxpa2UgXCJVUDkwMDAtQ1VTQTA3NDA4XzAwLVJFREVNUFRJT04yMDAwMDAwXCJcbiAgLy8gKGNvbnRhaW4gYSBoeXBoZW4gKyB1bmRlcnNjb3JlKS4gRmlsdGVyIG9uIHRoYXQgdG8gYXZvaWQgcGlja2luZyB1cFxuICAvLyBhcmJpdHJhcnkgZW50aXRpZXMgd2l0aCBhbiBgaWRgLlxuICBpZiAoXG4gICAgaWQgJiZcbiAgICB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIgJiZcbiAgICAvXltBLVpdezJ9XFxkezR9LS8udGVzdChpZCkgJiZcbiAgICBuYW1lICYmXG4gICAgaGFzUHJpY2UgJiZcbiAgICAhb3V0LmhhcyhpZClcbiAgKSB7XG4gICAgb3V0LnNldChpZCwgb2JqIGFzIFJhd1Byb2R1Y3QpO1xuICB9XG5cbiAgZm9yIChjb25zdCB2IG9mIE9iamVjdC52YWx1ZXMob2JqKSkgY29sbGVjdFByb2R1Y3RzKHYsIG91dCk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjb3Zlci9wb3J0cmFpdCBpbWFnZSBVUkxzIGZyb20gdGhlIEhUTUwgZ3JpZCB0aWxlcy5cbiAqIEVhY2ggdGlsZSBoYXMgYSBgZGF0YS10ZWxlbWV0cnktbWV0YWAgd2l0aCB0aGUgcHJvZHVjdCBJRCBhbmQgYW4gYDxpbWc+YFxuICogd2l0aCB0aGUgYWN0dWFsIGNvdmVyIGFydCAodGhlIDQ0MFx1MDBENzQ0MCBwb3J0cmFpdCBpbWFnZSB0aGUgc3RvcmUgZGlzcGxheXMpLlxuICovXG5mdW5jdGlvbiBleHRyYWN0VGlsZUltYWdlcyhodG1sOiBzdHJpbmcpOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICBjb25zdCBtZXRhczogQXJyYXk8eyBpZDogc3RyaW5nOyBwb3M6IG51bWJlciB9PiA9IFtdO1xuICBjb25zdCBtZXRhUmUgPSAvZGF0YS10ZWxlbWV0cnktbWV0YT1bXCInXShcXHtbXlwiJ10qXFx9KVtcIiddL2c7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBtZXRhUmUuZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmF3ID0gbVsxXS5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJykucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpO1xuICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UocmF3KTtcbiAgICAgIGlmIChqc29uLmlkKSBtZXRhcy5wdXNoKHsgaWQ6IGpzb24uaWQsIHBvczogbS5pbmRleCB9KTtcbiAgICB9IGNhdGNoIHsgLyogc2tpcCBtYWxmb3JtZWQgKi8gfVxuICB9XG5cbiAgY29uc3QgaW1nczogQXJyYXk8eyB1cmw6IHN0cmluZzsgcG9zOiBudW1iZXIgfT4gPSBbXTtcbiAgLy8gTWF0Y2ggYm90aCBzcmMgKGZhbGxiYWNrKSBhbmQgc3Jjc2V0IGF0dHJpYnV0ZXMgd2l0aCB3PTQ0MCB2YXJpYW50XG4gIGNvbnN0IGltZ1JlID0gL2RhdGEtcWE9XCJbXlwiXSpnYW1lLWFydFteXCJdKmltYWdlW15cIl0qXCJbXj5dKig/OnNyY3NldD1cIihbXlwiXSpcXD93PTQ0MFteXCJdKilcInxzcmM9XCIoW15cIl0rKVwiKS9nO1xuICB3aGlsZSAoKG0gPSBpbWdSZS5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIC8vIFByZWZlciBzcmNzZXQgdz00NDAgdmVyc2lvbiAobVsxXSksIGZhbGxiYWNrIHRvIHNyYyAobVsyXSlcbiAgICBsZXQgdXJsID0gbVsxXSB8fCBtWzJdO1xuICAgIGlmICghdXJsKSBjb250aW51ZTtcbiAgICAvLyBFeHRyYWN0IGZpcnN0IFVSTCBmcm9tIHNyY3NldCBpZiBpdCBjb250YWlucyBtdWx0aXBsZSAoY29tbWEtc2VwYXJhdGVkKVxuICAgIGlmICh1cmwuaW5jbHVkZXMoXCIsXCIpKSB1cmwgPSB1cmwuc3BsaXQoXCIsXCIpWzBdLnRyaW0oKS5zcGxpdCgvXFxzKy8pWzBdO1xuICAgIHVybCA9IHVybC5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIik7XG4gICAgaW1ncy5wdXNoKHsgdXJsLCBwb3M6IG0uaW5kZXggfSk7XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1ldGFzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbWV0YSA9IG1ldGFzW2ldO1xuICAgIGNvbnN0IG5leHRQb3MgPSBtZXRhc1tpICsgMV0/LnBvcyA/PyBJbmZpbml0eTtcbiAgICBjb25zdCBpbWcgPSBpbWdzLmZpbmQoKHgpID0+IHgucG9zID4gbWV0YS5wb3MgJiYgeC5wb3MgPCBuZXh0UG9zKTtcbiAgICBpZiAoaW1nKSB7XG4gICAgICAvLyBTdHJpcCA/dz00NDAgcmVzaXplIHBhcmFtIFx1MjE5MiBmdWxsIHJlc29sdXRpb24gYmFzZSBVUkxcbiAgICAgIGNvbnN0IHFJZHggPSBpbWcudXJsLmluZGV4T2YoXCI/XCIpO1xuICAgICAgbWFwLnNldChtZXRhLmlkLCBxSWR4ID4gMCA/IGltZy51cmwuc3Vic3RyaW5nKDAsIHFJZHgpIDogaW1nLnVybCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXA7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ2F0ZWdvcnlVcmwoY2ZnOiBQc25Db25maWcsIHBhZ2U6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIHJlZ2lvbiBsaWtlIFwiZW4tVVNcIiBcdTIxOTIgXCJlbi11c1wiXG4gIGNvbnN0IHJlZ2lvblBhdGggPSBjZmcucmVnaW9uLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vJHtyZWdpb25QYXRofS9jYXRlZ29yeS8ke2NmZy5kZWFsc0NhdGVnb3J5SWR9LyR7cGFnZX1gO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24qIGl0ZXJDYXRlZ29yeVByb2R1Y3RzKFxuICBjZmc6IFBzbkNvbmZpZ1xuKTogQXN5bmNHZW5lcmF0b3I8UmF3UHJvZHVjdD4ge1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG1heFBhZ2VzID0gNTA7IC8vIGhhcmQgc3RvcCBzbyBhIGJ1ZyBjYW4ndCBsb29wIGZvcmV2ZXJcblxuICBmb3IgKGxldCBwYWdlID0gMTsgcGFnZSA8PSBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgY29uc3QgdXJsID0gYnVpbGRDYXRlZ29yeVVybChjZmcsIHBhZ2UpO1xuICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBmZXRjaEh0bWwodXJsLCBjZmcucmVnaW9uKTtcbiAgICBjb25zdCBkYXRhID0gZXh0cmFjdE5leHREYXRhKGh0bWwpO1xuICAgIGlmICghZGF0YSkge1xuICAgICAgaWYgKHBhZ2UgPT09IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFxuICAgICAgICAgIFwiQ291bGQgbm90IGZpbmQgX19ORVhUX0RBVEFfXyBpbiBQU04gSFRNTCBcdTIwMTQgcGFnZSBsYXlvdXQgbWF5IGhhdmUgY2hhbmdlZC5cIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGZvdW5kID0gbmV3IE1hcDxzdHJpbmcsIFJhd1Byb2R1Y3Q+KCk7XG4gICAgY29sbGVjdFByb2R1Y3RzKGRhdGEsIGZvdW5kKTtcblxuICAgIC8vIEV4dHJhY3QgdGhlIHBvcnRyYWl0L2NvdmVyIGltYWdlcyByZW5kZXJlZCBpbiB0aGUgSFRNTCBncmlkIHRpbGVzLlxuICAgIGNvbnN0IHRpbGVJbWFnZXMgPSBleHRyYWN0VGlsZUltYWdlcyhodG1sKTtcblxuICAgIGxldCBuZXdPblRoaXNQYWdlID0gMDtcbiAgICBmb3IgKGNvbnN0IFtpZCwgcF0gb2YgZm91bmQpIHtcbiAgICAgIGlmIChzZWVuLmhhcyhpZCkpIGNvbnRpbnVlO1xuICAgICAgc2Vlbi5hZGQoaWQpO1xuICAgICAgbmV3T25UaGlzUGFnZSsrO1xuICAgICAgY29uc3QgdGlsZUltZyA9IHRpbGVJbWFnZXMuZ2V0KGlkKTtcbiAgICAgIGlmICh0aWxlSW1nKSBwLnRpbGVJbWFnZVVybCA9IHRpbGVJbWc7XG4gICAgICB5aWVsZCBwO1xuICAgIH1cbiAgICBpZiAobmV3T25UaGlzUGFnZSA9PT0gMCkgYnJlYWs7IC8vIHBhZ2luYXRpb24gZXhoYXVzdGVkXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL2NvbXBldGl0b3JzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL2NvbXBldGl0b3JzLnRzXCI7LyoqXG4gKiBDb21wZXRpdG9yIHNjcmFwZXJzICsgZnV6enkgbWF0Y2hlci5cbiAqXG4gKiBXZSBzdXBwb3J0IHR3byBnZW5lcmljIHN0b3JlZnJvbnQgdHlwZXM6XG4gKiAgIC0gU2hvcGlmeTogICAgIEdFVCBodHRwczovLzxkb21haW4+L3Byb2R1Y3RzLmpzb24/bGltaXQ9MjUwJnBhZ2U9TlxuICogICAtIFdvb0NvbW1lcmNlOiBHRVQgaHR0cHM6Ly88ZG9tYWluPi93cC1qc29uL3djL3N0b3JlL3YxL3Byb2R1Y3RzP3Blcl9wYWdlPTEwMCZwYWdlPU5cbiAqXG4gKiBCb3RoIGV4cG9zZSBwdWJsaWMsIHVuYXV0aGVudGljYXRlZCBKU09OIGZlZWRzLiBBIHRoaXJkIHR5cGUgXCJhdXRvXCIgdHJpZXNcbiAqIFNob3BpZnkgZmlyc3QgYW5kIGZhbGxzIGJhY2sgdG8gV29vQ29tbWVyY2Ugc28gdGhlIHVzZXIgZG9lc24ndCBoYXZlIHRvXG4gKiBndWVzcyB3aGVuIGFkZGluZyBhIG5ldyBzdG9yZS5cbiAqXG4gKiBUaGUgbWF0Y2hlciBub3JtYWxpemVzIHRpdGxlcyAobG93ZXJjYXNlZCwgYWNjZW50LXN0cmlwcGVkLCBub2lzZSB3b3Jkc1xuICogcmVtb3ZlZCkgYW5kIGNvbXBhcmVzIFBTTiBcdTIxOTQgY29tcGV0aXRvciBlbnRyaWVzIHdpdGggSmFjY2FyZCBzaW1pbGFyaXR5LlxuICovXG5pbXBvcnQgdHlwZSB7IEdhbWUgfSBmcm9tIFwiLi9zdG9yZVwiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5leHBvcnQgdHlwZSBDb21wZXRpdG9yVHlwZSA9IFwic2hvcGlmeVwiIHwgXCJ3b29jb21tZXJjZVwiIHwgXCJodG1sXCIgfCBcImp1bXBzZWxsZXJcIiB8IFwiYXV0b1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBldGl0b3JDb25maWcge1xuICBrZXk6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbiAgZG9tYWluOiBzdHJpbmc7XG4gIHR5cGU6IENvbXBldGl0b3JUeXBlO1xuICBlbmFibGVkOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBldGl0b3JQcm9kdWN0IHtcbiAgc3RvcmVLZXk6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHByaWNlQ2xwOiBudW1iZXI7XG4gIGF2YWlsYWJsZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wZXRpdG9yTWF0Y2gge1xuICBzdG9yZUtleTogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgcHJpY2VDbHA6IG51bWJlcjtcbiAgYXZhaWxhYmxlOiBib29sZWFuO1xuICBzY29yZTogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgQ29tcGV0aXRvckZldGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzdG9yZUtleTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBub3JtYWxpemF0aW9uICsgc2ltaWxhcml0eSAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jb25zdCBOT0lTRSA9IG5ldyBTZXQoW1xuICBcImZvclwiLFwidGhlXCIsXCJvZlwiLFwiYW5kXCIsXCJvclwiLFwiYVwiLFwiYW5cIixcImRlXCIsXCJkZWxcIixcImxhXCIsXCJlbFwiLFwibG9zXCIsXCJsYXNcIixcbiAgXCJwczRcIixcInBzNVwiLFwicHMzXCIsXCJwc3ZcIixcInBzcFwiLFwieGJveFwiLFwicGNcIixcInN0ZWFtXCIsXCJuaW50ZW5kb1wiLFwic3dpdGNoXCIsXG4gIFwiZWRpdGlvblwiLFwiZWRcIixcImRlbHV4ZVwiLFwiZ29sZFwiLFwic2lsdmVyXCIsXCJicm9uemVcIixcInBsYXRpbnVtXCIsXCJ1bHRpbWF0ZVwiLFxuICBcImdvdHlcIixcInN0YW5kYXJkXCIsXCJkaWdpdGFsXCIsXCJjdWVudGFcIixcInByaW1hcmlhXCIsXCJzZWN1bmRhcmlhXCIsXCJwcmltYXJpYTFcIixcbiAgXCJwcmltYXJpYTJcIixcImdhbWVcIixcImp1ZWdvXCIsXCJqdWVnb3NcIixcImJ1bmRsZVwiLFwicGFja1wiLFwic2Vhc29uXCIsXCJwYXNzXCIsXG4gIFwiY29sbGVjdGlvblwiLFwiY29tcGxldGVcIixcInJlbWFzdGVyZWRcIixcInJlbWFrZVwiLFwiaGRcIixcImRlZmluaXRpdmVcIixcbiAgXCJhbm5pdmVyc2FyeVwiLFwidmVyc2lvblwiLFwidmVyc1wiLFwidmVyXCIsXCJpbmNcIixcImluY2x1eWVcIixcInBhY2tcIixcbl0pO1xuXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5pemUodGl0bGU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIHRpdGxlXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAubm9ybWFsaXplKFwiTkZEXCIpXG4gICAgLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1tcdTIxMjJcdTAwQUVcdTAwQTldL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1xcW1teXFxdXSpcXF0vZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xcKFteKV0qXFwpL2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOSBdKy9nLCBcIiBcIilcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5maWx0ZXIoKHQpID0+IHQgJiYgIU5PSVNFLmhhcyh0KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaW1pbGFyaXR5KGE6IHN0cmluZ1tdLCBiOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGlmICghYS5sZW5ndGggfHwgIWIubGVuZ3RoKSByZXR1cm4gMDtcbiAgY29uc3Qgc2EgPSBuZXcgU2V0KGEpO1xuICBjb25zdCBzYiA9IG5ldyBTZXQoYik7XG4gIGxldCBpbnRlciA9IDA7XG4gIGZvciAoY29uc3QgeCBvZiBzYSkgaWYgKHNiLmhhcyh4KSkgaW50ZXIrKztcbiAgaWYgKCFpbnRlcikgcmV0dXJuIDA7XG4gIGNvbnN0IHVuaW9uID0gc2Euc2l6ZSArIHNiLnNpemUgLSBpbnRlcjtcbiAgY29uc3QgamFjY2FyZCA9IGludGVyIC8gdW5pb247XG4gIC8vIENvbnRhaW5tZW50IGJvbnVzOiBpZiB0aGUgc21hbGxlciBzZXQgaXMgZnVsbHkgY29udGFpbmVkIGluIHRoZSBsYXJnZXIsXG4gIC8vIHJld2FyZCB0aGF0IChjb3ZlcnMgXCJSZWQgRGVhZCBSZWRlbXB0aW9uIDJcIiBcdTIyODIgXCJSZWQgRGVhZCBSZWRlbXB0aW9uIDIgUFM0XCIpLlxuICBjb25zdCBtaW5TaXplID0gTWF0aC5taW4oc2Euc2l6ZSwgc2Iuc2l6ZSk7XG4gIGNvbnN0IGNvbnRhaW5tZW50ID0gaW50ZXIgLyBtaW5TaXplO1xuICByZXR1cm4gMC42ICogamFjY2FyZCArIDAuNCAqIGNvbnRhaW5tZW50O1xufVxuXG4vKiogTWF0Y2ggdGhyZXNob2xkIGJlbG93IHdoaWNoIHdlIGlnbm9yZSBhIGNhbmRpZGF0ZSBwYWlyLiAqL1xuZXhwb3J0IGNvbnN0IE1BVENIX1RIUkVTSE9MRCA9IDAuNTU7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIHByaWNlIHBhcnNpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gcGFyc2VDbHAodjogdW5rbm93bik6IG51bWJlciB8IG51bGwge1xuICBpZiAodiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgaWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2KSkge1xuICAgIC8vIFNob3BpZnkgb2Z0ZW4gZ2l2ZXMgc3RyaW5ncyBsaWtlIFwiMjk5OTAuMDBcIjsgbnVtYmVycyBhcmUgaW4gbWFqb3IgdW5pdHMuXG4gICAgLy8gSGV1cmlzdGljOiB2YWx1ZXMgPCAxMDAwIGFyZSB1bmxpa2VseSBmb3IgQ0xQOyB0cmVhdCBhcy1pcyBvdGhlcndpc2UuXG4gICAgcmV0dXJuIE1hdGgucm91bmQodik7XG4gIH1cbiAgY29uc3QgcyA9IFN0cmluZyh2KS5yZXBsYWNlKC9bXlxcZCwuLV0vZywgXCJcIik7XG4gIGlmICghcykgcmV0dXJuIG51bGw7XG4gIC8vIENMUCBoYXMgbm8gZGVjaW1hbHMuIERvdHMgYW5kIGNvbW1hcyBhcmUgYWxtb3N0IGFsd2F5cyB0aG91c2FuZHNcbiAgLy8gc2VwYXJhdG9ycyAoXCIkNi45OTBcIikuIFRoZSBvbmx5IGRlY2ltYWwtaXNoIGNhc2Ugd2Ugc2VlIGlzIFNob3BpZnknc1xuICAvLyBVU0Qtc3R5bGUgXCI3OTkwLjAwXCIgLyBcIjc5OTAsMDBcIiBcdTIwMTQgbGFzdCBzZXBhcmF0b3IgZm9sbG93ZWQgYnkgZXhhY3RseVxuICAvLyAyIGRpZ2l0cy4gRGV0ZWN0IHRoYXQsIGRyb3AgdGhlIGRlY2ltYWwgdGFpbCwgc3RyaXAgdGhlIHJlc3QuXG4gIGxldCBjbGVhbmVkID0gcztcbiAgY29uc3QgZGVjaW1hbFRhaWwgPSAvWy4sXShcXGR7Mn0pJC8uZXhlYyhzKTtcbiAgaWYgKGRlY2ltYWxUYWlsKSBjbGVhbmVkID0gcy5zbGljZSgwLCAtMyk7XG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL1suLF0vZywgXCJcIik7XG4gIGNvbnN0IG4gPSBOdW1iZXIoY2xlYW5lZCk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIE1hdGgucm91bmQobik7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIFNob3BpZnkgc2NyYXBlciAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5pbnRlcmZhY2UgU2hvcGlmeVZhcmlhbnQge1xuICBwcmljZT86IHN0cmluZztcbiAgYXZhaWxhYmxlPzogYm9vbGVhbjtcbiAgY29tcGFyZV9hdF9wcmljZT86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFNob3BpZnlQcm9kdWN0IHtcbiAgaWQ6IG51bWJlcjtcbiAgdGl0bGU6IHN0cmluZztcbiAgaGFuZGxlOiBzdHJpbmc7XG4gIHZhcmlhbnRzPzogU2hvcGlmeVZhcmlhbnRbXTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hTaG9waWZ5KFxuICBzdG9yZUtleTogc3RyaW5nLFxuICBkb21haW46IHN0cmluZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGNvbnN0IHByb2R1Y3RzOiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG4gIGZvciAobGV0IHBhZ2UgPSAxOyBwYWdlIDw9IDQwOyBwYWdlKyspIHtcbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly8ke2RvbWFpbn0vcHJvZHVjdHMuanNvbj9saW1pdD0yNTAmcGFnZT0ke3BhZ2V9YDtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICBoZWFkZXJzOiB7IFwidXNlci1hZ2VudFwiOiBVQSwgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgIH0pO1xuICAgIGlmIChyLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICBgJHtkb21haW59IG5vIGV4cG9uZSAvcHJvZHVjdHMuanNvbiAoXHUwMEJGbm8gZXMgU2hvcGlmeT8pYFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKCFyLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICBgJHtkb21haW59IEhUVFAgJHtyLnN0YXR1c30gZW4gL3Byb2R1Y3RzLmpzb25gXG4gICAgICApO1xuICAgIH1cbiAgICBsZXQgYm9keTogeyBwcm9kdWN0cz86IFNob3BpZnlQcm9kdWN0W10gfTtcbiAgICB0cnkge1xuICAgICAgYm9keSA9IChhd2FpdCByLmpzb24oKSkgYXMgeyBwcm9kdWN0cz86IFNob3BpZnlQcm9kdWN0W10gfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIGAke2RvbWFpbn0gZGV2b2x2aVx1MDBGMyBhbGdvIHF1ZSBubyBlcyBKU09OIGVuIC9wcm9kdWN0cy5qc29uYFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgYmF0Y2ggPSBib2R5LnByb2R1Y3RzID8/IFtdO1xuICAgIGlmICghYmF0Y2gubGVuZ3RoKSBicmVhaztcbiAgICBmb3IgKGNvbnN0IHAgb2YgYmF0Y2gpIHtcbiAgICAgIGNvbnN0IHZhcmlhbnQgPSBwLnZhcmlhbnRzPy5bMF07XG4gICAgICBjb25zdCBwcmljZSA9IHBhcnNlQ2xwKHZhcmlhbnQ/LnByaWNlKTtcbiAgICAgIGlmIChwcmljZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgIHByb2R1Y3RzLnB1c2goe1xuICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgdGl0bGU6IHAudGl0bGUsXG4gICAgICAgIHVybDogYGh0dHBzOi8vJHtkb21haW59L3Byb2R1Y3RzLyR7cC5oYW5kbGV9YCxcbiAgICAgICAgcHJpY2VDbHA6IHByaWNlLFxuICAgICAgICBhdmFpbGFibGU6IHZhcmlhbnQ/LmF2YWlsYWJsZSAhPT0gZmFsc2UsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGJhdGNoLmxlbmd0aCA8IDI1MCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHByb2R1Y3RzO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBXb29Db21tZXJjZSBzY3JhcGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmludGVyZmFjZSBXb29QcmljZXMge1xuICBwcmljZT86IHN0cmluZztcbiAgcmVndWxhcl9wcmljZT86IHN0cmluZztcbiAgc2FsZV9wcmljZT86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFdvb1Byb2R1Y3Qge1xuICBpZDogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIHBlcm1hbGluazogc3RyaW5nO1xuICBwcmljZXM/OiBXb29QcmljZXM7XG4gIGlzX2luX3N0b2NrPzogYm9vbGVhbjtcbiAgaXNfcHVyY2hhc2FibGU/OiBib29sZWFuO1xufVxuXG5jb25zdCBXT09fRU5EUE9JTlRTID0gW1xuICBcIi93cC1qc29uL3djL3N0b3JlL3YxL3Byb2R1Y3RzXCIsXG4gIFwiL3dwLWpzb24vd2Mvc3RvcmUvcHJvZHVjdHNcIixcbiAgXCIvP3Jlc3Rfcm91dGU9L3djL3N0b3JlL3YxL3Byb2R1Y3RzXCIsXG5dO1xuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFdvbyhcbiAgc3RvcmVLZXk6IHN0cmluZyxcbiAgZG9tYWluOiBzdHJpbmdcbik6IFByb21pc2U8Q29tcGV0aXRvclByb2R1Y3RbXT4ge1xuICBsZXQgbGFzdEVycm9yID0gXCJuby1hdHRlbXB0XCI7XG4gIGZvciAoY29uc3QgYmFzZVBhdGggb2YgV09PX0VORFBPSU5UUykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZmV0Y2hXb29BdChzdG9yZUtleSwgZG9tYWluLCBiYXNlUGF0aCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBDb21wZXRpdG9yRmV0Y2hFcnJvcikge1xuICAgICAgICBsYXN0RXJyb3IgPSBlLm1lc3NhZ2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgIHN0b3JlS2V5LFxuICAgIGAke2RvbWFpbn0gbm8gZXhwb25lIG5pbmdcdTAwRkFuIGVuZHBvaW50IFdvb0NvbW1lcmNlIGNvbm9jaWRvICgke2xhc3RFcnJvcn0pYFxuICApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFdvb0F0KFxuICBzdG9yZUtleTogc3RyaW5nLFxuICBkb21haW46IHN0cmluZyxcbiAgYmFzZVBhdGg6IHN0cmluZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGNvbnN0IHByb2R1Y3RzOiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG4gIGNvbnN0IGpvaW5lciA9IGJhc2VQYXRoLmluY2x1ZGVzKFwiP1wiKSA/IFwiJlwiIDogXCI/XCI7XG4gIGZvciAobGV0IHBhZ2UgPSAxOyBwYWdlIDw9IDQwOyBwYWdlKyspIHtcbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly8ke2RvbWFpbn0ke2Jhc2VQYXRofSR7am9pbmVyfXBlcl9wYWdlPTEwMCZwYWdlPSR7cGFnZX1gO1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHsgXCJ1c2VyLWFnZW50XCI6IFVBLCBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgfSk7XG4gICAgaWYgKHIuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihzdG9yZUtleSwgYCR7YmFzZVBhdGh9IFx1MjE5MiA0MDRgKTtcbiAgICB9XG4gICAgaWYgKCFyLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3Ioc3RvcmVLZXksIGAke2Jhc2VQYXRofSBcdTIxOTIgSFRUUCAke3Iuc3RhdHVzfWApO1xuICAgIH1cbiAgICBsZXQgYmF0Y2g6IFdvb1Byb2R1Y3RbXTtcbiAgICB0cnkge1xuICAgICAgYmF0Y2ggPSAoYXdhaXQgci5qc29uKCkpIGFzIFdvb1Byb2R1Y3RbXTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihzdG9yZUtleSwgYCR7YmFzZVBhdGh9IGRldm9sdmlcdTAwRjMgbm8tSlNPTmApO1xuICAgIH1cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYmF0Y2gpIHx8ICFiYXRjaC5sZW5ndGgpIGJyZWFrO1xuICAgIGZvciAoY29uc3QgcCBvZiBiYXRjaCkge1xuICAgICAgY29uc3QgcmF3ID1cbiAgICAgICAgcC5wcmljZXM/LnNhbGVfcHJpY2UgfHwgcC5wcmljZXM/LnByaWNlIHx8IHAucHJpY2VzPy5yZWd1bGFyX3ByaWNlO1xuICAgICAgbGV0IHByaWNlID0gcGFyc2VDbHAocmF3KTtcbiAgICAgIGlmIChwcmljZSAhPSBudWxsICYmIHJhdyAmJiAvXlxcZCskLy50ZXN0KFN0cmluZyhyYXcpKSAmJiBwcmljZSA+IDFfMDAwXzAwMCkge1xuICAgICAgICBwcmljZSA9IE1hdGgucm91bmQocHJpY2UgLyAxMDApO1xuICAgICAgfVxuICAgICAgaWYgKHByaWNlID09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgcHJvZHVjdHMucHVzaCh7XG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICB0aXRsZTogcC5uYW1lLFxuICAgICAgICB1cmw6IHAucGVybWFsaW5rLFxuICAgICAgICBwcmljZUNscDogcHJpY2UsXG4gICAgICAgIGF2YWlsYWJsZTogcC5pc19pbl9zdG9jayAhPT0gZmFsc2UsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGJhdGNoLmxlbmd0aCA8IDEwMCkgYnJlYWs7XG4gIH1cbiAgaWYgKCFwcm9kdWN0cy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3Ioc3RvcmVLZXksIGAke2Jhc2VQYXRofSB2YWNcdTAwRURvYCk7XG4gIH1cbiAgcmV0dXJuIHByb2R1Y3RzO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBIVE1MIC8gc2l0ZW1hcCArIEpTT04tTEQgc2NyYXBlciAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jb25zdCBTSVRFTUFQX0NBTkRJREFURVMgPSBbXG4gIFwiL3Byb2R1Y3Qtc2l0ZW1hcC54bWxcIixcbiAgXCIvd3Atc2l0ZW1hcC1wb3N0cy1wcm9kdWN0LTEueG1sXCIsXG4gIFwiL3NpdGVtYXAtcHJvZHVjdHMueG1sXCIsXG4gIFwiL3NpdGVtYXBfcHJvZHVjdHNfMS54bWxcIiwgLy8gU2hvcGlmeS1zdHlsZSwgYnV0IGFsc28gdXNlZCBieSBvdGhlcnNcbiAgXCIvc2l0ZW1hcF9pbmRleC54bWxcIixcbiAgXCIvc2l0ZW1hcC54bWxcIixcbl07XG5cbmNvbnN0IFBST0RVQ1RfVVJMX0hJTlRTID1cbiAgL1xcLyhwcm9kdWN0b3xwcm9kdWN0b3N8cHJvZHVjdHxwcm9kdWN0c3x0aWVuZGF8c2hvcHxnYW1lfGp1ZWdvfGl0ZW0pXFwvL2k7XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoVGV4dCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICBhY2NlcHQ6IFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksKi8qO3E9MC44XCIsXG4gICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IFwiZXMtQ0wsZXM7cT0wLjksZW47cT0wLjhcIixcbiAgICAgICAgXCJzZWMtZmV0Y2gtZGVzdFwiOiBcImRvY3VtZW50XCIsXG4gICAgICAgIFwic2VjLWZldGNoLW1vZGVcIjogXCJuYXZpZ2F0ZVwiLFxuICAgICAgICBcInNlYy1mZXRjaC1zaXRlXCI6IFwibm9uZVwiLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHJldHVybiBudWxsO1xuICAgIHJldHVybiBhd2FpdCByLnRleHQoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVNpdGVtYXBVcmxzKGRvbWFpbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHF1ZXVlOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IHBhdGggb2YgU0lURU1BUF9DQU5ESURBVEVTKSB7XG4gICAgcXVldWUucHVzaChgaHR0cHM6Ly8ke2RvbWFpbn0ke3BhdGh9YCk7XG4gIH1cblxuICBjb25zdCB1cmxzOiBzdHJpbmdbXSA9IFtdO1xuICB3aGlsZSAocXVldWUubGVuZ3RoICYmIHVybHMubGVuZ3RoIDwgMjAwMCkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBxdWV1ZS5zaGlmdCgpITtcbiAgICBpZiAoc2Vlbi5oYXMoY3VycmVudCkpIGNvbnRpbnVlO1xuICAgIHNlZW4uYWRkKGN1cnJlbnQpO1xuICAgIGNvbnN0IHhtbCA9IGF3YWl0IGZldGNoVGV4dChjdXJyZW50KTtcbiAgICBpZiAoIXhtbCkgY29udGludWU7XG5cbiAgICAvLyBTaXRlbWFwIGluZGV4IFx1MjE5MiA8c2l0ZW1hcD48bG9jPi4uLjwvbG9jPjwvc2l0ZW1hcD5cbiAgICBjb25zdCBuZXN0ZWQgPSBBcnJheS5mcm9tKFxuICAgICAgeG1sLm1hdGNoQWxsKC88c2l0ZW1hcFtePl0qPltcXHNcXFNdKj88bG9jPihbXFxzXFxTXSo/KTxcXC9sb2M+W1xcc1xcU10qPzxcXC9zaXRlbWFwPi9naSlcbiAgICApLm1hcCgobSkgPT4gbVsxXS50cmltKCkpO1xuICAgIGZvciAoY29uc3QgbiBvZiBuZXN0ZWQpIHtcbiAgICAgIGlmICgvcHJvZHVjdHxzaXRlbWFwWy1fXVxcZCt8cGFnZS1zaXRlbWFwL2kudGVzdChuKSB8fCBuZXN0ZWQubGVuZ3RoIDwgMTApIHtcbiAgICAgICAgcXVldWUucHVzaChuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVUkwgc2V0IFx1MjE5MiA8dXJsPjxsb2M+Li4uPC9sb2M+PC91cmw+XG4gICAgY29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKFxuICAgICAgeG1sLm1hdGNoQWxsKC88dXJsW14+XSo+W1xcc1xcU10qPzxsb2M+KFtcXHNcXFNdKj8pPFxcL2xvYz5bXFxzXFxTXSo/PFxcL3VybD4vZ2kpXG4gICAgKS5tYXAoKG0pID0+IG1bMV0udHJpbSgpKTtcbiAgICBmb3IgKGNvbnN0IHUgb2YgaXRlbXMpIHVybHMucHVzaCh1KTtcbiAgfVxuXG4gIC8vIEtlZXAgbGlrZWx5LXByb2R1Y3QgVVJMcyBmaXJzdC4gRmFsbCBiYWNrIHRvIGV2ZXJ5dGhpbmcgaWYgbm8gaGludCBtYXRjaGVzLlxuICBjb25zdCBoaW50ZWQgPSB1cmxzLmZpbHRlcigodSkgPT4gUFJPRFVDVF9VUkxfSElOVFMudGVzdCh1KSk7XG4gIGNvbnN0IHBvb2wgPSBoaW50ZWQubGVuZ3RoID49IDEwID8gaGludGVkIDogdXJscztcblxuICAvLyBEZWR1cGxpY2F0ZSBwcmVzZXJ2aW5nIG9yZGVyXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZGVkdXAgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCB1IG9mIHBvb2wpIHtcbiAgICBpZiAoZGVkdXAuaGFzKHUpKSBjb250aW51ZTtcbiAgICBkZWR1cC5hZGQodSk7XG4gICAgb3V0LnB1c2godSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuaW50ZXJmYWNlIEpzb25MZFByb2R1Y3Qge1xuICBcIkB0eXBlXCI/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbiAgbmFtZT86IHN0cmluZztcbiAgb2ZmZXJzPzpcbiAgICB8IHtcbiAgICAgICAgcHJpY2U/OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgICAgIGxvd1ByaWNlPzogc3RyaW5nIHwgbnVtYmVyO1xuICAgICAgICBwcmljZUN1cnJlbmN5Pzogc3RyaW5nO1xuICAgICAgICBhdmFpbGFiaWxpdHk/OiBzdHJpbmc7XG4gICAgICB9XG4gICAgfCBBcnJheTx7XG4gICAgICAgIHByaWNlPzogc3RyaW5nIHwgbnVtYmVyO1xuICAgICAgICBwcmljZUN1cnJlbmN5Pzogc3RyaW5nO1xuICAgICAgICBhdmFpbGFiaWxpdHk/OiBzdHJpbmc7XG4gICAgICB9Pjtcbn1cblxuZnVuY3Rpb24gaXNQcm9kdWN0Tm9kZShuOiB1bmtub3duKTogbiBpcyBKc29uTGRQcm9kdWN0IHtcbiAgaWYgKCFuIHx8IHR5cGVvZiBuICE9PSBcIm9iamVjdFwiKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHQgPSAobiBhcyBKc29uTGRQcm9kdWN0KVtcIkB0eXBlXCJdO1xuICBpZiAoIXQpIHJldHVybiBmYWxzZTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodCkpIHJldHVybiB0LnNvbWUoKHgpID0+IC9wcm9kdWN0L2kudGVzdCh4KSk7XG4gIHJldHVybiAvcHJvZHVjdC9pLnRlc3QoU3RyaW5nKHQpKTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFByb2R1Y3RGcm9tSHRtbChcbiAgaHRtbDogc3RyaW5nLFxuICBzdG9yZUtleTogc3RyaW5nLFxuICB1cmw6IHN0cmluZ1xuKTogQ29tcGV0aXRvclByb2R1Y3QgfCBudWxsIHtcbiAgY29uc3Qgc2NyaXB0cyA9IEFycmF5LmZyb20oXG4gICAgaHRtbC5tYXRjaEFsbChcbiAgICAgIC88c2NyaXB0W14+XSp0eXBlPVtcIiddYXBwbGljYXRpb25cXC9sZFxcK2pzb25bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+L2dpXG4gICAgKVxuICApO1xuICBmb3IgKGNvbnN0IG0gb2Ygc2NyaXB0cykge1xuICAgIGxldCBwYXJzZWQ6IHVua25vd247XG4gICAgdHJ5IHtcbiAgICAgIHBhcnNlZCA9IEpTT04ucGFyc2UobVsxXS50cmltKCkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGl0ZW1zOiB1bmtub3duW10gPSBbXTtcbiAgICBjb25zdCBncmFwaCA9IChwYXJzZWQgYXMgeyBcIkBncmFwaFwiPzogdW5rbm93bltdIH0pPy5bXCJAZ3JhcGhcIl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZ3JhcGgpKSBpdGVtcy5wdXNoKC4uLmdyYXBoKTtcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcnNlZCkpIGl0ZW1zLnB1c2goLi4ucGFyc2VkKTtcbiAgICBlbHNlIGl0ZW1zLnB1c2gocGFyc2VkKTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgaWYgKCFpc1Byb2R1Y3ROb2RlKGl0ZW0pKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHAgPSBpdGVtIGFzIEpzb25MZFByb2R1Y3Q7XG4gICAgICBjb25zdCBuYW1lID0gcC5uYW1lO1xuICAgICAgbGV0IHByaWNlUmF3OiBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICBsZXQgYXZhaWxhYmlsaXR5ID0gXCJcIjtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHAub2ZmZXJzKSkge1xuICAgICAgICBwcmljZVJhdyA9IHAub2ZmZXJzWzBdPy5wcmljZTtcbiAgICAgICAgYXZhaWxhYmlsaXR5ID0gcC5vZmZlcnNbMF0/LmF2YWlsYWJpbGl0eSA/PyBcIlwiO1xuICAgICAgfSBlbHNlIGlmIChwLm9mZmVycykge1xuICAgICAgICBwcmljZVJhdyA9IHAub2ZmZXJzLnByaWNlID8/IHAub2ZmZXJzLmxvd1ByaWNlO1xuICAgICAgICBhdmFpbGFiaWxpdHkgPSBwLm9mZmVycy5hdmFpbGFiaWxpdHkgPz8gXCJcIjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VDbHAocHJpY2VSYXcpO1xuICAgICAgaWYgKCFuYW1lIHx8IHByaWNlID09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIHRpdGxlOiBTdHJpbmcobmFtZSksXG4gICAgICAgIHVybCxcbiAgICAgICAgcHJpY2VDbHA6IHByaWNlLFxuICAgICAgICBhdmFpbGFibGU6ICEvb3V0b2ZzdG9jay9pLnRlc3QoYXZhaWxhYmlsaXR5KSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLy8gRmFsbGJhY2s6IE9wZW5HcmFwaCAvIGl0ZW1wcm9wIG1ldGFcbiAgY29uc3Qgb2dUaXRsZSA9IC88bWV0YVtePl0rcHJvcGVydHk9W1wiJ11vZzp0aXRsZVtcIiddW14+XStjb250ZW50PVtcIiddKFteXCInXSspW1wiJ10vaS5leGVjKFxuICAgIGh0bWxcbiAgKT8uWzFdO1xuICBjb25zdCBvZ1ByaWNlID1cbiAgICAvPG1ldGFbXj5dK3Byb3BlcnR5PVtcIiddcHJvZHVjdDpwcmljZTphbW91bnRbXCInXVtePl0rY29udGVudD1bXCInXShbXlwiJ10rKVtcIiddL2kuZXhlYyhcbiAgICAgIGh0bWxcbiAgICApPy5bMV0gfHxcbiAgICAvPG1ldGFbXj5dK2l0ZW1wcm9wPVtcIiddcHJpY2VbXCInXVtePl0rY29udGVudD1bXCInXShbXlwiJ10rKVtcIiddL2kuZXhlYyhodG1sKT8uWzFdO1xuICBpZiAob2dUaXRsZSAmJiBvZ1ByaWNlKSB7XG4gICAgY29uc3QgcHJpY2UgPSBwYXJzZUNscChvZ1ByaWNlKTtcbiAgICBpZiAocHJpY2UgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHsgc3RvcmVLZXksIHRpdGxlOiBvZ1RpdGxlLCB1cmwsIHByaWNlQ2xwOiBwcmljZSwgYXZhaWxhYmxlOiB0cnVlIH07XG4gICAgfVxuICB9XG5cbiAgLy8gRmFsbGJhY2s6IEhUTUwgdGl0bGUgKyBwcmljZSBwYXR0ZXJuICh3b3JrcyBmb3IgSnVtcHNlbGxlciBhbmQgb3RoZXIgcGxhdGZvcm1zKVxuICBjb25zdCB0aXRsZVRhZyA9IC88dGl0bGVbXj5dKj4oW148XSspPFxcL3RpdGxlPi9pLmV4ZWMoaHRtbCk/LlsxXT8udHJpbSgpO1xuICBjb25zdCBoMVRhZyA9IC88aDFbXj5dKj4oW148XSspPFxcL2gxPi9pLmV4ZWMoaHRtbCk/LlsxXT8udHJpbSgpO1xuICBjb25zdCBwcm9kdWN0VGl0bGUgPSBoMVRhZyB8fCB0aXRsZVRhZztcbiAgaWYgKHByb2R1Y3RUaXRsZSkge1xuICAgIC8vIExvb2sgZm9yIHByaWNlIGluIGNvbW1vbiBwYXR0ZXJuczogJFhYLlhYWCBvciAkWFgsWFhYIChDTFAgZm9ybWF0KVxuICAgIGNvbnN0IHByaWNlUGF0dGVybnMgPSBbXG4gICAgICAvY2xhc3M9W1wiJ11bXlwiJ10qKD86cHJpY2V8cHJlY2lvKVteXCInXSpbXCInXVtePl0qPlxccypcXCQ/XFxzKihbXFxkLixdKykvaSxcbiAgICAgIC9pdGVtcHJvcD1bXCInXXByaWNlW1wiJ11bXj5dKj5cXHMqXFwkP1xccyooW1xcZC4sXSspL2ksXG4gICAgICAvZGF0YS1wcmljZT1bXCInXShbXFxkLixdKylbXCInXS9pLFxuICAgICAgL1xcYnByZWNpb1tePF0qXFwkXFxzKihbXFxkLixdKykvaSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgcmUgb2YgcHJpY2VQYXR0ZXJucykge1xuICAgICAgY29uc3QgcG0gPSByZS5leGVjKGh0bWwpO1xuICAgICAgaWYgKHBtKSB7XG4gICAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VDbHAocG1bMV0pO1xuICAgICAgICBpZiAocHJpY2UgIT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGNsZWFuVGl0bGUgPSBwcm9kdWN0VGl0bGVcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMqWy1cdTIwMTN8XHUwMEI3XS4qJC8sIFwiXCIpXG4gICAgICAgICAgICAudHJpbSgpO1xuICAgICAgICAgIHJldHVybiB7IHN0b3JlS2V5LCB0aXRsZTogY2xlYW5UaXRsZSwgdXJsLCBwcmljZUNscDogcHJpY2UsIGF2YWlsYWJsZTogdHJ1ZSB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSHRtbFN0b3JlZnJvbnQoXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIGRvbWFpbjogc3RyaW5nXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgY29uc3QgdXJscyA9IGF3YWl0IHJlc29sdmVTaXRlbWFwVXJscyhkb21haW4pO1xuICBpZiAoIXVybHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgICAgc3RvcmVLZXksXG4gICAgICBgJHtkb21haW59IG5vIGV4cG9uZSBzaXRlbWFwLnhtbCBjb24gVVJMcyBkZSBwcm9kdWN0b3NgXG4gICAgKTtcbiAgfVxuICBjb25zdCBsaW1pdCA9IE1hdGgubWluKHVybHMubGVuZ3RoLCA0MDApO1xuICBjb25zdCBjb25jdXJyZW5jeSA9IDY7XG4gIGNvbnN0IG91dDogQ29tcGV0aXRvclByb2R1Y3RbXSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGltaXQ7IGkgKz0gY29uY3VycmVuY3kpIHtcbiAgICBjb25zdCBiYXRjaCA9IHVybHMuc2xpY2UoaSwgaSArIGNvbmN1cnJlbmN5KTtcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICBiYXRjaC5tYXAoYXN5bmMgKHUpID0+IHtcbiAgICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoVGV4dCh1KTtcbiAgICAgICAgaWYgKCFodG1sKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIGV4dHJhY3RQcm9kdWN0RnJvbUh0bWwoaHRtbCwgc3RvcmVLZXksIHUpO1xuICAgICAgfSlcbiAgICApO1xuICAgIGZvciAoY29uc3QgcCBvZiByZXN1bHRzKSBpZiAocCkgb3V0LnB1c2gocCk7XG4gIH1cbiAgaWYgKCFvdXQubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgICAgc3RvcmVLZXksXG4gICAgICBgJHtkb21haW59OiBzaXRlbWFwIGVuY29udHJhZG8gcGVybyBubyBzZSBwdWRpZXJvbiBleHRyYWVyIHByb2R1Y3RvcyAoc2luIEpTT04tTEQgbmkgb2c6cHJpY2UpYFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gSnVtcHNlbGxlciBzY3JhcGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSnVtcHNlbGxlcihcbiAgc3RvcmVLZXk6IHN0cmluZyxcbiAgZG9tYWluOiBzdHJpbmdcbik6IFByb21pc2U8Q29tcGV0aXRvclByb2R1Y3RbXT4ge1xuICBjb25zdCBiYXNlID0gYGh0dHBzOi8vJHtkb21haW59YDtcblxuICAvLyBTdGVwIDE6IEZldGNoIGhvbWVwYWdlIHRvIGRpc2NvdmVyIGNhdGVnb3J5IGxpbmtzXG4gIGNvbnN0IGhvbWVIdG1sID0gYXdhaXQgZmV0Y2hUZXh0KGJhc2UgKyBcIi9cIik7XG4gIGNvbnN0IGNhdGVnb3JpZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChob21lSHRtbCkge1xuICAgIGNvbnN0IGNhdFJlZ2V4ID0gL2hyZWY9W1wiJ10oXFwvY2F0ZWdvcmlhc1xcL1teXCInPyNdKylbXCInXS9naTtcbiAgICBsZXQgbTtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgd2hpbGUgKChtID0gY2F0UmVnZXguZXhlYyhob21lSHRtbCkpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBwYXRoID0gbVsxXS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgICAgaWYgKCFzZWVuLmhhcyhwYXRoKSkge1xuICAgICAgICBzZWVuLmFkZChwYXRoKTtcbiAgICAgICAgY2F0ZWdvcmllcy5wdXNoKHBhdGgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEFsd2F5cyBpbmNsdWRlIC9jYXRlZ29yaWFzLyByb290IGFzIGZhbGxiYWNrXG4gIGlmICghY2F0ZWdvcmllcy5pbmNsdWRlcyhcIi9jYXRlZ29yaWFzXCIpKSBjYXRlZ29yaWVzLnVuc2hpZnQoXCIvY2F0ZWdvcmlhc1wiKTtcblxuICBjb25zdCBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSA9IFtdO1xuICBjb25zdCBzZWVuVXJscyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBtYXhDYXRlZ29yaWVzID0gMjA7XG4gIGNvbnN0IG1heFBhZ2VzID0gNTA7XG5cbiAgZm9yIChjb25zdCBjYXQgb2YgY2F0ZWdvcmllcy5zbGljZSgwLCBtYXhDYXRlZ29yaWVzKSkge1xuICAgIGZvciAobGV0IHBhZ2UgPSAxOyBwYWdlIDw9IG1heFBhZ2VzOyBwYWdlKyspIHtcbiAgICAgIGNvbnN0IHVybCA9IGAke2Jhc2V9JHtjYXR9P3BhZ2U9JHtwYWdlfWA7XG4gICAgICBjb25zdCBodG1sID0gYXdhaXQgZmV0Y2hUZXh0KHVybCk7XG4gICAgICBpZiAoIWh0bWwpIGJyZWFrO1xuXG4gICAgICAvLyBFeHRyYWN0IHByb2R1Y3QgY2FyZHMgXHUyMDE0IEp1bXBzZWxsZXIgdXNlcyB2YXJpb3VzIHBhdHRlcm5zXG4gICAgICBsZXQgZm91bmRPblBhZ2UgPSAwO1xuXG4gICAgICAvLyBQYXR0ZXJuIEE6IHByb2R1Y3QgbGlua3Mgd2l0aCAvcHJvZHVjdG9zLyBocmVmXG4gICAgICBjb25zdCBwcm9kdWN0QmxvY2tSZWdleCA9XG4gICAgICAgIC9ocmVmPVtcIiddKFxcL3Byb2R1Y3Rvc1xcL1teXCInPyNdKylbXCInXVteXSo/KD89aHJlZj1bXCInXVxcL3Byb2R1Y3Rvc1xcL3wkKS9naTtcbiAgICAgIGxldCBibG9jazogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgICAgIGNvbnN0IHByb2R1Y3RMaW5rczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IGxpbmtSZWdleCA9IC9ocmVmPVtcIiddKFxcL3Byb2R1Y3Rvc1xcL1teXCInPyNdKylbXCInXS9naTtcbiAgICAgIGxldCBsbTtcbiAgICAgIHdoaWxlICgobG0gPSBsaW5rUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgcFVybCA9IGJhc2UgKyBsbVsxXTtcbiAgICAgICAgaWYgKCFzZWVuVXJscy5oYXMocFVybCkpIHtcbiAgICAgICAgICBzZWVuVXJscy5hZGQocFVybCk7XG4gICAgICAgICAgcHJvZHVjdExpbmtzLnB1c2gobG1bMV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBlYWNoIHByb2R1Y3QgbGluaywgZXh0cmFjdCB0aXRsZSArIHByaWNlIGZyb20gaXRzIHN1cnJvdW5kaW5nIGNvbnRleHRcbiAgICAgIGZvciAoY29uc3QgbGluayBvZiBwcm9kdWN0TGlua3MpIHtcbiAgICAgICAgY29uc3QgZXNjYXBlZExpbmsgPSBsaW5rLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgICAgICAgY29uc3QgY3R4UmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgIGBocmVmPVtcIiddJHtlc2NhcGVkTGlua31bXCInXVtcXFxcc1xcXFxTXXswLDEwMDB9YFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBjdHggPSBjdHhSZWdleC5leGVjKGh0bWwpPy5bMF0gPz8gXCJcIjtcblxuICAgICAgICAvLyBUaXRsZTogbG9vayBmb3IgcHJvZHVjdCBuYW1lIHBhdHRlcm5zXG4gICAgICAgIGNvbnN0IHRpdGxlTWF0Y2ggPVxuICAgICAgICAgIC9jbGFzcz1bXCInXVteXCInXSooPzp0aXRsZXxub21icmV8bmFtZSlbXlwiJ10qW1wiJ11bXj5dKj4oW148XXszLDEwMH0pPC8uZXhlYyhjdHgpIHx8XG4gICAgICAgICAgL2FsdD1bXCInXShbXlwiJ117MywxMDB9KVtcIiddLy5leGVjKGN0eCkgfHxcbiAgICAgICAgICAvPHNwYW5bXj5dKj4oW148XXszLDgwfSk8XFwvc3Bhbj4vLmV4ZWMoY3R4KTtcbiAgICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZU1hdGNoPy5bMV0/LnRyaW0oKTtcblxuICAgICAgICAvLyBQcmljZTogbG9vayBmb3IgQ0xQIHByaWNlIHBhdHRlcm5zXG4gICAgICAgIGNvbnN0IHByaWNlTWF0Y2ggPVxuICAgICAgICAgIC9jbGFzcz1bXCInXVteXCInXSooPzpwcmljZXxwcmVjaW8pW15cIiddKltcIiddW14+XSo+W1xccyRdKihbXFxkLixdKykvLmV4ZWMoY3R4KSB8fFxuICAgICAgICAgIC9cXCRcXHMqKFtcXGQuLF0rKS8uZXhlYyhjdHgpIHx8XG4gICAgICAgICAgL2RhdGEtcHJpY2U9W1wiJ10oW1xcZC4sXSspW1wiJ10vLmV4ZWMoY3R4KTtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBwYXJzZUNscChwcmljZU1hdGNoPy5bMV0pO1xuXG4gICAgICAgIGlmICh0aXRsZSAmJiBwcmljZSAhPSBudWxsKSB7XG4gICAgICAgICAgcHJvZHVjdHMucHVzaCh7XG4gICAgICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgdXJsOiBiYXNlICsgbGluayxcbiAgICAgICAgICAgIHByaWNlQ2xwOiBwcmljZSxcbiAgICAgICAgICAgIGF2YWlsYWJsZTogdHJ1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBmb3VuZE9uUGFnZSsrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChmb3VuZE9uUGFnZSA9PT0gMCkgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFwcm9kdWN0cy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgICBzdG9yZUtleSxcbiAgICAgIGAke2RvbWFpbn06IG5vIHNlIGVuY29udHJhcm9uIHByb2R1Y3RvcyBlbiBKdW1wc2VsbGVyIChzaW4gL3Byb2R1Y3Rvcy8gZW4gZWwgSFRNTClgXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcHJvZHVjdHM7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIHB1YmxpYyBBUEkgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQ29tcGV0aXRvcihcbiAgY2ZnOiBDb21wZXRpdG9yQ29uZmlnXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgaWYgKGNmZy50eXBlID09PSBcInNob3BpZnlcIikgcmV0dXJuIGZldGNoU2hvcGlmeShjZmcua2V5LCBjZmcuZG9tYWluKTtcbiAgaWYgKGNmZy50eXBlID09PSBcIndvb2NvbW1lcmNlXCIpIHJldHVybiBmZXRjaFdvbyhjZmcua2V5LCBjZmcuZG9tYWluKTtcbiAgaWYgKGNmZy50eXBlID09PSBcImh0bWxcIikgcmV0dXJuIGZldGNoSHRtbFN0b3JlZnJvbnQoY2ZnLmtleSwgY2ZnLmRvbWFpbik7XG4gIGlmIChjZmcudHlwZSA9PT0gXCJqdW1wc2VsbGVyXCIpIHJldHVybiBmZXRjaEp1bXBzZWxsZXIoY2ZnLmtleSwgY2ZnLmRvbWFpbik7XG5cbiAgLy8gYXV0bzogZGV0ZWN0IEp1bXBzZWxsZXIgYnkgaG9tZXBhZ2UgZmluZ2VycHJpbnQsIHRoZW4gc2hvcGlmeSBcdTIxOTIgd29vIFx1MjE5MiBodG1sIGZhbGxiYWNrXG4gIGNvbnN0IGhvbWVIdG1sID0gYXdhaXQgZmV0Y2hUZXh0KGBodHRwczovLyR7Y2ZnLmRvbWFpbn0vYCk7XG4gIGlmIChob21lSHRtbCAmJiAoL1xcL3Byb2R1Y3Rvc1xcLy9pLnRlc3QoaG9tZUh0bWwpIHx8IC9cXC9jYXRlZ29yaWFzXFwvL2kudGVzdChob21lSHRtbCkpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBmZXRjaEp1bXBzZWxsZXIoY2ZnLmtleSwgY2ZnLmRvbWFpbik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIENvbXBldGl0b3JGZXRjaEVycm9yKSkgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgZm4gb2YgW2ZldGNoU2hvcGlmeSwgZmV0Y2hXb28sIGZldGNoSHRtbFN0b3JlZnJvbnRdKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBmbihjZmcua2V5LCBjZmcuZG9tYWluKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgQ29tcGV0aXRvckZldGNoRXJyb3IpKSB0aHJvdyBlO1xuICAgICAgZXJyb3JzLnB1c2goZS5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgIGNmZy5rZXksXG4gICAgYG5vIHNlIHB1ZG8gc2NyYXBlYXIgJHtjZmcuZG9tYWlufTogJHtlcnJvcnMuam9pbihcIiBcdTAwQjcgXCIpfWBcbiAgKTtcbn1cblxuLyoqXG4gKiBCdWlsZCB7Z2FtZUlkIC0+IG1hdGNoZXNbXX0gZm9yIGEgbGlzdCBvZiBQU04gZ2FtZXMgYW5kIHRoZSBjb21iaW5lZCBwb29sXG4gKiBvZiBjb21wZXRpdG9yIHByb2R1Y3RzIChmcm9tIGFsbCBlbmFibGVkIHN0b3JlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaEdhbWVzKFxuICBnYW1lczogR2FtZVtdLFxuICBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXVxuKTogUmVjb3JkPHN0cmluZywgQ29tcGV0aXRvck1hdGNoW10+IHtcbiAgLy8gUHJlY29tcHV0ZSB0b2tlbnMgb25jZSBwZXIgcHJvZHVjdC5cbiAgY29uc3QgcHJvZHVjdFRva2VuczogQXJyYXk8eyBwOiBDb21wZXRpdG9yUHJvZHVjdDsgdG9rZW5zOiBzdHJpbmdbXSB9PiA9XG4gICAgcHJvZHVjdHMubWFwKChwKSA9PiAoeyBwLCB0b2tlbnM6IHRva2VuaXplKHAudGl0bGUpIH0pKTtcblxuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPiA9IHt9O1xuICBmb3IgKGNvbnN0IGcgb2YgZ2FtZXMpIHtcbiAgICBjb25zdCBnVG9rZW5zID0gdG9rZW5pemUoZy5uYW1lKTtcbiAgICBpZiAoIWdUb2tlbnMubGVuZ3RoKSBjb250aW51ZTtcbiAgICBjb25zdCBtYXRjaGVzOiBDb21wZXRpdG9yTWF0Y2hbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgeyBwLCB0b2tlbnMgfSBvZiBwcm9kdWN0VG9rZW5zKSB7XG4gICAgICBpZiAoIXRva2Vucy5sZW5ndGgpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzaW1pbGFyaXR5KGdUb2tlbnMsIHRva2Vucyk7XG4gICAgICBpZiAoc2NvcmUgPj0gTUFUQ0hfVEhSRVNIT0xEKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgc3RvcmVLZXk6IHAuc3RvcmVLZXksXG4gICAgICAgICAgdGl0bGU6IHAudGl0bGUsXG4gICAgICAgICAgdXJsOiBwLnVybCxcbiAgICAgICAgICBwcmljZUNscDogcC5wcmljZUNscCxcbiAgICAgICAgICBhdmFpbGFibGU6IHAuYXZhaWxhYmxlLFxuICAgICAgICAgIHNjb3JlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gS2VlcCBhdCBtb3N0IHRvcC01IHBlciBnYW1lIHRvIGxpbWl0IHBheWxvYWQgc2l6ZS5cbiAgICBtYXRjaGVzLnNvcnQoKGEsIGIpID0+IGEucHJpY2VDbHAgLSBiLnByaWNlQ2xwKTtcbiAgICBvdXRbZy5pZF0gPSBtYXRjaGVzLnNsaWNlKDAsIDUpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wc24tcHJvZHVjdC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wc24tcHJvZHVjdC50c1wiOy8qKlxuICogUFNOIHByb2R1Y3QgZGV0YWlsIHNjcmFwZXIuXG4gKlxuICogVGhlIHByb2R1Y3QgcGFnZSAoc3RvcmUucGxheXN0YXRpb24uY29tLzxyZWdpb24+L3Byb2R1Y3QvPGlkPikgaXMgU1NSJ2RcbiAqIGJ5IE5leHQuanMganVzdCBsaWtlIHRoZSBjYXRlZ29yeSBwYWdlcyBcdTIwMTQgdGhlIGZ1bGwgcHJvZHVjdCBKU09OIHNpdHNcbiAqIGluc2lkZSBgPHNjcmlwdCBpZD1cIl9fTkVYVF9EQVRBX19cIj5gLiBXZSB3YWxrIHRoYXQgdHJlZSB0byBmaW5kIHRoZVxuICogb2JqZWN0IG1hdGNoaW5nIG91ciB0YXJnZXQgaWQgYW5kIG5vcm1hbGl6ZSBpdHMgZmllbGRzLlxuICpcbiAqIGZpbGVTaXplIGlzIHRoZSBvbmUgdGhpbmcgUFNOIGRvZXNuJ3QgcHV0IGluIHN0cnVjdHVyZWQgZGF0YSBvbiBlbi1VUztcbiAqIHdlIHJlY292ZXIgaXQgZnJvbSB0aGUgdmlzaWJsZSBIVE1MIHdpdGggYSByZWdleCBmYWxsYmFjay5cbiAqL1xuaW1wb3J0IHsgUHNuQXBpRXJyb3IgfSBmcm9tIFwiLi9wc25cIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0TWVkaWEge1xuICBoZXJvVXJsOiBzdHJpbmcgfCBudWxsO1xuICBsb2dvVXJsOiBzdHJpbmcgfCBudWxsO1xuICBiYWNrZ3JvdW5kVXJsOiBzdHJpbmcgfCBudWxsO1xuICBjb3ZlclVybDogc3RyaW5nIHwgbnVsbDtcbiAgcG9ydHJhaXRVcmw6IHN0cmluZyB8IG51bGw7XG4gIHNjcmVlbnNob3RzOiBzdHJpbmdbXTtcbiAgdmlkZW9zOiBBcnJheTx7IHVybDogc3RyaW5nOyBwb3N0ZXJVcmw6IHN0cmluZyB8IG51bGw7IG1pbWVUeXBlOiBzdHJpbmcgfCBudWxsIH0+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y3REZXRhaWwge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7IC8vIHNhbml0aXplZCBIVE1MXG4gIHNob3J0RGVzY3JpcHRpb246IHN0cmluZyB8IG51bGw7XG4gIHB1Ymxpc2hlcjogc3RyaW5nIHwgbnVsbDtcbiAgZGV2ZWxvcGVyOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlRGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgZ2VucmVzOiBzdHJpbmdbXTtcbiAgdm9pY2VMYW5ndWFnZXM6IHN0cmluZ1tdO1xuICBzdWJ0aXRsZUxhbmd1YWdlczogc3RyaW5nW107XG4gIGFnZVJhdGluZzogc3RyaW5nIHwgbnVsbDtcbiAgY29udGVudERlc2NyaXB0b3JzOiBzdHJpbmdbXTtcbiAgaW50ZXJhY3RpdmVFbGVtZW50czogc3RyaW5nW107XG4gIHBsYXllckNvdW50OiBzdHJpbmcgfCBudWxsO1xuICBvbmxpbmVQbGF5ZXJDb3VudDogc3RyaW5nIHwgbnVsbDtcbiAgcHNQbHVzUmVxdWlyZWQ6IGJvb2xlYW47XG4gIGluR2FtZVB1cmNoYXNlczogc3RyaW5nIHwgbnVsbDtcbiAgZ2FtZUZlYXR1cmVzOiBzdHJpbmdbXTtcbiAgcHNWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICBmaWxlU2l6ZTogc3RyaW5nIHwgbnVsbDtcbiAgcGxhdGZvcm1zOiBzdHJpbmc7XG4gIG1lZGlhOiBQcm9kdWN0TWVkaWE7XG4gIGNhcm91c2VsSW1hZ2VzOiBzdHJpbmdbXTtcbiAgc3RvcmVVcmw6IHN0cmluZztcbiAgZGlzY291bnRFbmRBdDogc3RyaW5nIHwgbnVsbDtcbiAgZmV0Y2hlZEF0OiBzdHJpbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSHRtbCh1cmw6IHN0cmluZywgcmVnaW9uOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBsZXQgbGFzdEVycjogdW5rbm93biA9IG51bGw7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMzsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBhY2NlcHQ6XG4gICAgICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IHJlZ2lvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJlc1wiKSA/IFwiZXNcIiA6IFwiZW4tVVNcIixcbiAgICAgICAgICBcIngtcHNuLXN0b3JlLWxvY2FsZS1vdmVycmlkZVwiOiByZWdpb24sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDA0KSB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoYFByb2R1Y3Qgbm90IGZvdW5kICg0MDQpOiAke3VybH1gKTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDAzKVxuICAgICAgICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXCJQU04gcmV0dXJuZWQgNDAzIChJUC9DbG91ZGZsYXJlIGJsb2NrKVwiKTtcbiAgICAgIGlmIChyLnN0YXR1cyA+PSA1MDApIHRocm93IG5ldyBFcnJvcihgUFNOICR7ci5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4gYXdhaXQgci50ZXh0KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBQc25BcGlFcnJvcikgdGhyb3cgZTtcbiAgICAgIGxhc3RFcnIgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDQwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgYFBTTiBwcm9kdWN0IGZldGNoIGZhaWxlZDogJHsobGFzdEVyciBhcyBFcnJvcik/Lm1lc3NhZ2UgfHwgbGFzdEVycn1gXG4gICk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3ROZXh0RGF0YShodG1sOiBzdHJpbmcpOiBhbnkgfCBudWxsIHtcbiAgY29uc3QgbSA9IC88c2NyaXB0W14+XSppZD1bXCInXV9fTkVYVF9EQVRBX19bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+Ly5leGVjKFxuICAgIGh0bWxcbiAgKTtcbiAgaWYgKCFtKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShtWzFdKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqIFdhbGsgdGhlIHRyZWUgY29sbGVjdGluZyBldmVyeSBvYmplY3Qgd2hvc2UgYGlkYCBtYXRjaGVzIHRhcmdldElkLlxuICogIFRoZSBwYWdlIGVtYmVkcyB0aGUgc2FtZSBwcm9kdWN0IHNldmVyYWwgdGltZXMgKGhlYWRlciwgaGVybywgcmVsYXRlZFxuICogIGxpbmtzKTsgd2UgcGljayB0aGUgcmljaGVzdCByZWNvcmQgYnkgdG90YWwga2V5IGNvdW50LiAqL1xuZnVuY3Rpb24gZmluZFByb2R1Y3RSZWNvcmRzKHRyZWU6IHVua25vd24sIHRhcmdldElkOiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdIHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdID0gW107XG4gIGNvbnN0IHN0YWNrOiB1bmtub3duW10gPSBbdHJlZV07XG4gIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcbiAgICBjb25zdCBuID0gc3RhY2sucG9wKCk7XG4gICAgaWYgKCFuKSBjb250aW51ZTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShuKSkge1xuICAgICAgZm9yIChjb25zdCB2IG9mIG4pIHN0YWNrLnB1c2godik7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBuICE9PSBcIm9iamVjdFwiKSBjb250aW51ZTtcbiAgICBjb25zdCBvYmogPSBuIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIGlmIChvYmouaWQgPT09IHRhcmdldElkIHx8IG9iai5wcm9kdWN0SWQgPT09IHRhcmdldElkKSBvdXQucHVzaChvYmopO1xuICAgIGZvciAoY29uc3QgdiBvZiBPYmplY3QudmFsdWVzKG9iaikpIHtcbiAgICAgIGlmICh2ICYmIHR5cGVvZiB2ID09PSBcIm9iamVjdFwiKSBzdGFjay5wdXNoKHYpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBwaWNrUmljaGVzdChyZWNvcmRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgaWYgKCFyZWNvcmRzLmxlbmd0aCkgcmV0dXJuIG51bGw7XG4gIGxldCBiZXN0ID0gcmVjb3Jkc1swXTtcbiAgbGV0IGJlc3RLZXlzID0gT2JqZWN0LmtleXMoYmVzdCkubGVuZ3RoO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3Jkcykge1xuICAgIGNvbnN0IGsgPSBPYmplY3Qua2V5cyhyKS5sZW5ndGg7XG4gICAgaWYgKGsgPiBiZXN0S2V5cykge1xuICAgICAgYmVzdCA9IHI7XG4gICAgICBiZXN0S2V5cyA9IGs7XG4gICAgfVxuICB9XG4gIHJldHVybiBiZXN0O1xufVxuXG4vKiogTWVyZ2UgZmllbGRzIGFjcm9zcyBldmVyeSByZWNvcmQgd2l0aCB0aGlzIGlkIFx1MjAxNCBvbmUgc2xvdCBtaWdodCBoYXZlXG4gKiAgbWVkaWEsIGFub3RoZXIgbG9uZ0Rlc2NyaXB0aW9uLCBldGMuIFJpY2hlc3Qgd2lucyBvbiBjb25mbGljdHMuICovXG5mdW5jdGlvbiBtZXJnZVJlY29yZHMocmVjb3JkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgc29ydGVkID0gWy4uLnJlY29yZHNdLnNvcnQoXG4gICAgKGEsIGIpID0+IE9iamVjdC5rZXlzKGEpLmxlbmd0aCAtIE9iamVjdC5rZXlzKGIpLmxlbmd0aFxuICApO1xuICBjb25zdCBtZXJnZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGZvciAoY29uc3QgciBvZiBzb3J0ZWQpIHtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhyKSkge1xuICAgICAgaWYgKHYgPT0gbnVsbCkgY29udGludWU7XG4gICAgICBpZiAobWVyZ2VkW2tdID09IG51bGwpIG1lcmdlZFtrXSA9IHY7XG4gICAgfVxuICB9XG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmludGVyZmFjZSBSYXdNZWRpYSB7XG4gIHJvbGU/OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbiAgc291cmNlPzogeyB1cmw/OiBzdHJpbmc7IHR5cGU/OiBzdHJpbmcgfTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE1lZGlhKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBQcm9kdWN0TWVkaWEge1xuICBjb25zdCBsaXN0ID0gKG9iai5tZWRpYSBhcyBSYXdNZWRpYVtdKSB8fCBbXTtcbiAgY29uc3QgYnlSb2xlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGNvbnN0IHNjcmVlbnNob3RzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB2aWRlb3M6IFByb2R1Y3RNZWRpYVtcInZpZGVvc1wiXSA9IFtdO1xuICBsZXQgcG9zdGVyRm9yTmV4dFZpZGVvOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBmb3IgKGNvbnN0IG0gb2YgbGlzdCkge1xuICAgIGNvbnN0IHJvbGUgPSBTdHJpbmcobT8ucm9sZSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IHR5cGUgPSBTdHJpbmcobT8udHlwZSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IHVybCA9IG0/LnVybCB8fCBtPy5zb3VyY2U/LnVybCB8fCBudWxsO1xuXG4gICAgLy8gVmlkZW9zOiB0eXBlIGlzIHVzdWFsbHkgVklERU8gb3IgVklERU9fUFJPTU8sIHJvbGUgaXMgUFJPTU8uXG4gICAgaWYgKHR5cGUuaW5jbHVkZXMoXCJWSURFT1wiKSB8fCByb2xlID09PSBcIlBST01PXCIpIHtcbiAgICAgIGlmICghdXJsKSBjb250aW51ZTtcbiAgICAgIHZpZGVvcy5wdXNoKHtcbiAgICAgICAgdXJsLFxuICAgICAgICBwb3N0ZXJVcmw6IHBvc3RlckZvck5leHRWaWRlbyxcbiAgICAgICAgbWltZVR5cGU6IG0/LnNvdXJjZT8udHlwZSB8fCBudWxsLFxuICAgICAgfSk7XG4gICAgICBwb3N0ZXJGb3JOZXh0VmlkZW8gPSBudWxsO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghdXJsKSBjb250aW51ZTtcblxuICAgIC8vIFN0YXNoIHRoZSBmaXJzdCByb2xlIGhpdCBzbyB3ZSBkb24ndCBvdmVyd3JpdGUgaGVybyB3aXRoIGEgbGF0ZXJcbiAgICAvLyBNQVNURVIgdGhhdCBtaWdodCBiZSBsb3dlciBxdWFsaXR5LlxuICAgIGlmICghYnlSb2xlW3JvbGVdKSBieVJvbGVbcm9sZV0gPSB1cmw7XG5cbiAgICBpZiAocm9sZSA9PT0gXCJTQ1JFRU5TSE9UXCIpIHNjcmVlbnNob3RzLnB1c2godXJsKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaGVyb1VybDpcbiAgICAgIGJ5Um9sZVtcIkhFUk9fQkFOTkVSXCJdIHx8XG4gICAgICBieVJvbGVbXCJIRVJPQkFOTkVSXCJdIHx8XG4gICAgICBieVJvbGVbXCJCQUNLR1JPVU5EX0lNQUdFXCJdIHx8XG4gICAgICBieVJvbGVbXCJCQUNLR1JPVU5EXCJdIHx8XG4gICAgICBudWxsLFxuICAgIGxvZ29Vcmw6IGJ5Um9sZVtcIkxPR09cIl0gfHwgYnlSb2xlW1wiTE9HT19UUkFOU1BBUkVOVFwiXSB8fCBudWxsLFxuICAgIGJhY2tncm91bmRVcmw6IGJ5Um9sZVtcIkJBQ0tHUk9VTkRfSU1BR0VcIl0gfHwgYnlSb2xlW1wiQkFDS0dST1VORFwiXSB8fCBudWxsLFxuICAgIGNvdmVyVXJsOlxuICAgICAgYnlSb2xlW1wiTUFTVEVSXCJdIHx8XG4gICAgICBieVJvbGVbXCJCT1hBUlRcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkdBTUVIVUJfQ09WRVJfQVJUXCJdIHx8XG4gICAgICBieVJvbGVbXCJQUkVWSUVXX0dBTUVfQVJUXCJdIHx8XG4gICAgICBudWxsLFxuICAgIHBvcnRyYWl0VXJsOlxuICAgICAgYnlSb2xlW1wiUE9SVFJBSVRfQkFOTkVSXCJdIHx8XG4gICAgICBieVJvbGVbXCJHQU1FSFVCX0NPVkVSX0FSVFwiXSB8fFxuICAgICAgYnlSb2xlW1wiQk9YQVJUXCJdIHx8XG4gICAgICBudWxsLFxuICAgIHNjcmVlbnNob3RzOiBbLi4ubmV3IFNldChzY3JlZW5zaG90cyldLFxuICAgIHZpZGVvcyxcbiAgfTtcbn1cblxuLyoqIE1pbmltYWwgSFRNTCBzYW5pdGl6YXRpb24gXHUyMDE0IHN0cmlwcyBzY3JpcHRzL3N0eWxlcy9ldmVudCBoYW5kbGVycyBhbmRcbiAqICBhbnkgdGFnIG91dHNpZGUgdGhlIHdoaXRlbGlzdC4gRW5vdWdoIGZvciBQU04tc291cmNlZCBkZXNjcmlwdGlvbnMuICovXG5jb25zdCBBTExPV0VEX1RBR1MgPSBuZXcgU2V0KFtcbiAgXCJwXCIsIFwiYnJcIiwgXCJzdHJvbmdcIiwgXCJiXCIsIFwiZW1cIiwgXCJpXCIsIFwidVwiLCBcInVsXCIsIFwib2xcIiwgXCJsaVwiLCBcImgyXCIsIFwiaDNcIiwgXCJoNFwiLFxuXSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZUh0bWwocmF3OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXJhdykgcmV0dXJuIFwiXCI7XG4gIGxldCBzID0gcmF3O1xuICAvLyBEcm9wIGVudGlyZSBzY3JpcHQvc3R5bGUgYmxvY2tzLlxuICBzID0gcy5yZXBsYWNlKC88c2NyaXB0W1xcc1xcU10qPzxcXC9zY3JpcHQ+L2dpLCBcIlwiKTtcbiAgcyA9IHMucmVwbGFjZSgvPHN0eWxlW1xcc1xcU10qPzxcXC9zdHlsZT4vZ2ksIFwiXCIpO1xuICAvLyBTdHJpcCBhbnkgdGFnIG5vdCBpbiB0aGUgd2hpdGVsaXN0LiBQcmVzZXJ2ZSBpbm5lciB0ZXh0LlxuICBzID0gcy5yZXBsYWNlKC88XFwvPyhbYS16QS1aXVthLXpBLVowLTldKilcXGJbXj5dKj4vZywgKG1hdGNoLCB0YWcpID0+IHtcbiAgICBjb25zdCB0ID0gU3RyaW5nKHRhZykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIUFMTE9XRURfVEFHUy5oYXModCkpIHJldHVybiBcIlwiO1xuICAgIC8vIEZvciBhbGxvd2VkIHRhZ3MsIGRyb3AgYWxsIGF0dHJpYnV0ZXMgKG5vIGhyZWYvc3R5bGUvb24qIHBvc3NpYmxlKS5cbiAgICByZXR1cm4gbWF0Y2guc3RhcnRzV2l0aChcIjwvXCIpID8gYDwvJHt0fT5gIDogYDwke3R9PmA7XG4gIH0pO1xuICAvLyBDb2xsYXBzZSBydW5zIG9mIGVtcHR5IHBhcmFncmFwaHMuXG4gIHMgPSBzLnJlcGxhY2UoLyg/OjxwPlxccyo8XFwvcD5cXHMqKXsyLH0vZ2ksIFwiPHA+PC9wPlwiKTtcbiAgcmV0dXJuIHMudHJpbSgpO1xufVxuXG5mdW5jdGlvbiB0b1N0cmluZ0FycmF5KHY6IHVua25vd24pOiBzdHJpbmdbXSB7XG4gIGlmICghdikgcmV0dXJuIFtdO1xuICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgIHJldHVybiB2XG4gICAgICAubWFwKCh4KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgeCA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHg7XG4gICAgICAgIGlmICh4ICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgY29uc3Qgb2JqID0geCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgICByZXR1cm4gU3RyaW5nKG9iai5uYW1lIHx8IG9iai5sYWJlbCB8fCBvYmouZGVzY3JpcHRpb24gfHwgXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9KVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpIHJldHVybiB2LnNwbGl0KFwiLFwiKS5tYXAoKHMpID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gc3RyKHY6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHYgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHYudHJpbSgpIHx8IG51bGw7XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IG9iaiA9IHYgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgcmV0dXJuIChcbiAgICAgICh0eXBlb2Ygb2JqLm5hbWUgPT09IFwic3RyaW5nXCIgJiYgb2JqLm5hbWUpIHx8XG4gICAgICAodHlwZW9mIG9iai5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvYmouZGVzY3JpcHRpb24pIHx8XG4gICAgICBudWxsXG4gICAgKTtcbiAgfVxuICByZXR1cm4gU3RyaW5nKHYpIHx8IG51bGw7XG59XG5cbi8qKiBQU04gcmFyZWx5IGV4cG9zZXMgZmlsZSBzaXplIGluIHN0cnVjdHVyZWQgZGF0YSBvbiBlbi1VUy4gU2NyYXBlIGl0XG4gKiAgZnJvbSB0aGUgdmlzaWJsZSBIVE1MIGFzIGEgbGFzdCByZXNvcnQuIE1hdGNoZXMgXCI3OS44IEdCXCIsIFwiMiBHQlwiLCBldGMuICovXG5mdW5jdGlvbiBleHRyYWN0RmlsZVNpemVGcm9tSHRtbChodG1sOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gVGhlIFwiRmlsZSBTaXplXCIgbGFiZWwgaXMgZm9sbG93ZWQgYnkgdGhlIHZhbHVlIGluIHRoZSBcIkFib3V0IHRoaXMgZ2FtZVwiXG4gIC8vIHNlY3Rpb24uIExvb2sgZm9yIHZhcmlhdGlvbnMuXG4gIGNvbnN0IGxhYmVsTWF0Y2ggPVxuICAgIC9GaWxlXFxzKlNpemVbXjxdKjxcXC9bXj5dKz5cXHMqPFtePl0rPihbXjxdKyk8L2kuZXhlYyhodG1sKSB8fFxuICAgIC9cImZpbGVTaXplXCJcXHMqOlxccypcIihbXlwiXSspXCIvaS5leGVjKGh0bWwpO1xuICBpZiAobGFiZWxNYXRjaCAmJiBsYWJlbE1hdGNoWzFdKSByZXR1cm4gbGFiZWxNYXRjaFsxXS50cmltKCk7XG4gIC8vIEdsb2JhbCBmYWxsYmFjazogYW55IFwiPG51bWJlcj4gR0JcIiBuZWFyIGEgc2l6ZS1pc2ggbGFiZWwuIFZlcnkgY29hcnNlXG4gIC8vIFx1MjAxNCBvbmx5IHVzZSBpZiB0aGUgbGFiZWxlZCBzY3JhcGUgbWlzc2VzLlxuICBjb25zdCBhbnkgPSAvKFxcZHsxLDN9KD86Wy4sXVxcZCspPylcXHMqR0JcXGIvaS5leGVjKGh0bWwpO1xuICByZXR1cm4gYW55ID8gYCR7YW55WzFdfSBHQmAgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0Q29udGVudERlc2NyaXB0b3JzKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNyID0gb2JqLmNvbnRlbnRSYXRpbmcgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gIGlmIChjcj8uY29udGVudERlc2NyaXB0b3JzKSByZXR1cm4gdG9TdHJpbmdBcnJheShjci5jb250ZW50RGVzY3JpcHRvcnMpO1xuICBpZiAoY3I/LmRlc2NyaXB0aW9ucykgcmV0dXJuIHRvU3RyaW5nQXJyYXkoY3IuZGVzY3JpcHRpb25zKTtcbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SW50ZXJhY3RpdmVFbGVtZW50cyhvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogc3RyaW5nW10ge1xuICBjb25zdCBjciA9IG9iai5jb250ZW50UmF0aW5nIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICBpZiAoY3I/LmludGVyYWN0aXZlRWxlbWVudHMpIHJldHVybiB0b1N0cmluZ0FycmF5KGNyLmludGVyYWN0aXZlRWxlbWVudHMpO1xuICByZXR1cm4gW107XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RHYW1lRmVhdHVyZXMob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgaHRtbDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAvLyBGcm9tIEpTT046IGxvb2sgZm9yIGZlYXR1cmVzLCB1cHNlbGxGZWF0dXJlcywgZ2FtZXBsYXlGZWF0dXJlcywgZXRjLlxuICBjb25zdCBmZWF0dXJlczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBrZXkgb2YgW1wiZmVhdHVyZXNcIiwgXCJ1cHNlbGxGZWF0dXJlc1wiLCBcImdhbWVwbGF5RmVhdHVyZXNcIiwgXCJjb25jZXB0RmVhdHVyZXNcIl0pIHtcbiAgICBjb25zdCB2ID0gb2JqW2tleV07XG4gICAgaWYgKHYpIGZlYXR1cmVzLnB1c2goLi4udG9TdHJpbmdBcnJheSh2KSk7XG4gIH1cbiAgaWYgKGZlYXR1cmVzLmxlbmd0aCA+IDApIHJldHVybiBmZWF0dXJlcztcblxuICAvLyBGcm9tIEhUTUw6IGV4dHJhY3QgZmVhdHVyZSBiYWRnZXMgbGlrZSBcIlBTIFBsdXMgcmVxdWlyZWRcIiwgXCIxIC0gMiBwbGF5ZXJzXCIsIGV0Yy5cbiAgY29uc3QgZmVhdHVyZVJlZ2V4ID1cbiAgICAvZGF0YS1xYT1cIm1mZVteXCJdKiNjaGVja3M/W15cIl0qXCJbXj5dKj4oW148XSspPC9naTtcbiAgbGV0IG07XG4gIHdoaWxlICgobSA9IGZlYXR1cmVSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHRleHQgPSBtWzFdLnRyaW0oKTtcbiAgICBpZiAodGV4dCAmJiAhZmVhdHVyZXMuaW5jbHVkZXModGV4dCkpIGZlYXR1cmVzLnB1c2godGV4dCk7XG4gIH1cblxuICAvLyBBbHRlcm5hdGl2ZTogZXh0cmFjdCBmcm9tIGFyaWEtbGFiZWwgb3IgdGV4dCBub2RlcyBuZWFyIGZlYXR1cmUgaWNvbnNcbiAgY29uc3QgYWx0UmVnZXggPVxuICAgIC9jbGFzcz1cIlteXCJdKig/OmdhbWUtZmVhdHVyZXxwc3ctYy10LTMpW15cIl0qXCJbXj5dKj4oW148XXs1LDEyMH0pPC9naTtcbiAgd2hpbGUgKChtID0gYWx0UmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCB0ZXh0ID0gbVsxXS50cmltKCk7XG4gICAgaWYgKHRleHQgJiYgIWZlYXR1cmVzLmluY2x1ZGVzKHRleHQpKSBmZWF0dXJlcy5wdXNoKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIGZlYXR1cmVzO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0UGxheWVySW5mbyhvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBodG1sOiBzdHJpbmcpOiB7XG4gIHBsYXllckNvdW50OiBzdHJpbmcgfCBudWxsO1xuICBvbmxpbmVQbGF5ZXJDb3VudDogc3RyaW5nIHwgbnVsbDtcbiAgcHNQbHVzUmVxdWlyZWQ6IGJvb2xlYW47XG4gIGluR2FtZVB1cmNoYXNlczogc3RyaW5nIHwgbnVsbDtcbn0ge1xuICBsZXQgcGxheWVyQ291bnQgPSBzdHIob2JqLnBsYXllckNvdW50KSB8fCBzdHIob2JqLmxvY2FsUGxheWVyQ291bnQpO1xuICBsZXQgb25saW5lUGxheWVyQ291bnQgPSBzdHIob2JqLm9ubGluZVBsYXllckNvdW50KTtcbiAgbGV0IHBzUGx1c1JlcXVpcmVkID0gZmFsc2U7XG4gIGxldCBpbkdhbWVQdXJjaGFzZXM6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIC8vIFBhcnNlIGZyb20gZmVhdHVyZXMvSFRNTCB0ZXh0XG4gIGNvbnN0IGFsbFRleHQgPSBodG1sO1xuICBjb25zdCBwbGF5ZXJNYXRjaCA9IC8oXFxkK1xccyotXFxzKlxcZCspXFxzKnBsYXllci9pLmV4ZWMoYWxsVGV4dCk7XG4gIGlmICghcGxheWVyQ291bnQgJiYgcGxheWVyTWF0Y2gpIHBsYXllckNvdW50ID0gcGxheWVyTWF0Y2hbMV0ucmVwbGFjZSgvXFxzL2csIFwiXCIpICsgXCIgcGxheWVyc1wiO1xuXG4gIGNvbnN0IG9ubGluZU1hdGNoID0gL3N1cHBvcnRzP1xccyt1cFxccyt0b1xccysoXFxkKylcXHMrb25saW5lXFxzK3BsYXllcnM/L2kuZXhlYyhhbGxUZXh0KTtcbiAgaWYgKCFvbmxpbmVQbGF5ZXJDb3VudCAmJiBvbmxpbmVNYXRjaCkgb25saW5lUGxheWVyQ291bnQgPSBgVXAgdG8gJHtvbmxpbmVNYXRjaFsxXX0gb25saW5lIHBsYXllcnNgO1xuXG4gIGlmICgvcHNcXHMqcGx1c1xccypyZXF1aXJlZC9pLnRlc3QoYWxsVGV4dCkpIHBzUGx1c1JlcXVpcmVkID0gdHJ1ZTtcblxuICBpZiAoL2luLWdhbWVcXHMrcHVyY2hhc2VzP1xccytvcHRpb25hbC9pLnRlc3QoYWxsVGV4dCkpIGluR2FtZVB1cmNoYXNlcyA9IFwib3B0aW9uYWxcIjtcbiAgZWxzZSBpZiAoL2luLWdhbWVcXHMrcHVyY2hhc2VzL2kudGVzdChhbGxUZXh0KSkgaW5HYW1lUHVyY2hhc2VzID0gXCJ5ZXNcIjtcblxuICByZXR1cm4geyBwbGF5ZXJDb3VudCwgb25saW5lUGxheWVyQ291bnQsIHBzUGx1c1JlcXVpcmVkLCBpbkdhbWVQdXJjaGFzZXMgfTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFBzVmVyc2lvbihvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBodG1sOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgY2xhc3NpZmljYXRpb24gPSBzdHIob2JqLmxvY2FsaXplZFN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uKTtcbiAgaWYgKGNsYXNzaWZpY2F0aW9uICYmIC9wc1s0NV0vaS50ZXN0KGNsYXNzaWZpY2F0aW9uKSkgcmV0dXJuIGNsYXNzaWZpY2F0aW9uO1xuXG4gIC8vIEZyb20gSFRNTFxuICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSAvKFBTWzQ1XVxccytWZXJzaW9uKS9pLmV4ZWMoaHRtbCk7XG4gIHJldHVybiB2ZXJzaW9uTWF0Y2ggPyB2ZXJzaW9uTWF0Y2hbMV0gOiBudWxsO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0RGlzY291bnRFbmRBdChvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBodG1sOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gRnJvbSBKU09OOiB3ZWJjdGFzIHByaWNlIGVuZFRpbWVcbiAgY29uc3Qgd2ViY3RhcyA9IG9iai53ZWJjdGFzIGFzIEFycmF5PHsgcHJpY2U/OiB7IGVuZFRpbWU/OiBzdHJpbmcgfSB9PiB8IHVuZGVmaW5lZDtcbiAgY29uc3QgZW5kVGltZSA9IHdlYmN0YXM/LlswXT8ucHJpY2U/LmVuZFRpbWU7XG4gIGlmIChlbmRUaW1lKSByZXR1cm4gZW5kVGltZTtcblxuICBjb25zdCBwcmljZSA9IG9iai5wcmljZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgaWYgKHByaWNlPy5lbmRUaW1lKSByZXR1cm4gU3RyaW5nKHByaWNlLmVuZFRpbWUpO1xuXG4gIC8vIEZyb20gSFRNTDogXCJPZmZlciBlbmRzIDQvMjMvMjAyNiAwMjo1OSBhLiBtLiBDTFRcIlxuICBjb25zdCBvZmZlck1hdGNoID0gL29mZmVyXFxzK2VuZHM/XFxzKyhcXGR7MSwyfVxcL1xcZHsxLDJ9XFwvXFxkezR9W148XSopL2kuZXhlYyhodG1sKTtcbiAgaWYgKG9mZmVyTWF0Y2gpIHJldHVybiBvZmZlck1hdGNoWzFdLnRyaW0oKTtcblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdENhcm91c2VsSW1hZ2VzKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGh0bWw6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgaW1hZ2VzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgLy8gRnJvbSBKU09OIG1lZGlhOiBnZXQgYWxsIHNjcmVlbnNob3QgVVJMc1xuICBjb25zdCBtZWRpYSA9IChvYmoubWVkaWEgYXMgQXJyYXk8eyByb2xlPzogc3RyaW5nOyB1cmw/OiBzdHJpbmcgfT4pIHx8IFtdO1xuICBmb3IgKGNvbnN0IG0gb2YgbWVkaWEpIHtcbiAgICBjb25zdCB1cmwgPSBtPy51cmw7XG4gICAgaWYgKCF1cmwpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHJvbGUgPSBTdHJpbmcobT8ucm9sZSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChyb2xlID09PSBcIlNDUkVFTlNIT1RcIiB8fCByb2xlID09PSBcIlBSRVZJRVdcIiB8fCByb2xlID09PSBcIlBSRVZJRVdfSU1BR0VcIikge1xuICAgICAgaWYgKCFzZWVuLmhhcyh1cmwpKSB7IHNlZW4uYWRkKHVybCk7IGltYWdlcy5wdXNoKHVybCk7IH1cbiAgICB9XG4gIH1cblxuICAvLyBGcm9tIEhUTUw6IGV4dHJhY3QgY2Fyb3VzZWwgaW1hZ2Ugc3JjL3NyY3NldFxuICBjb25zdCBpbWdSZWdleCA9IC9kYXRhLXFhPVwibWZlLW1lZGlhLWNhcm91c2VsW15cIl0qXCJbXj5dKnNyYz1cIihbXlwiXSspXCIvZ2k7XG4gIGxldCBtO1xuICB3aGlsZSAoKG0gPSBpbWdSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHVybCA9IG1bMV0ucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpO1xuICAgIGlmICghc2Vlbi5oYXModXJsKSkgeyBzZWVuLmFkZCh1cmwpOyBpbWFnZXMucHVzaCh1cmwpOyB9XG4gIH1cblxuICAvLyBBbHNvIGdldCBoaWdoLXJlcyB2ZXJzaW9ucyBmcm9tIHNyY3NldFxuICBjb25zdCBzcmNzZXRSZWdleCA9IC9kYXRhLXFhPVwibWZlLW1lZGlhLWNhcm91c2VsW15cIl0qXCJbXj5dKnNyY3NldD1cIihbXlwiXSspXCIvZ2k7XG4gIHdoaWxlICgobSA9IHNyY3NldFJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc3Jjc2V0ID0gbVsxXS5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIik7XG4gICAgY29uc3QgdXJscyA9IHNyY3NldC5zcGxpdChcIixcIikubWFwKChzKSA9PiBzLnRyaW0oKS5zcGxpdCgvXFxzKy8pWzBdKTtcbiAgICBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XG4gICAgICBpZiAodXJsICYmICFzZWVuLmhhcyh1cmwpKSB7IHNlZW4uYWRkKHVybCk7IGltYWdlcy5wdXNoKHVybCk7IH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaW1hZ2VzO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hQcm9kdWN0RGV0YWlsKFxuICBpZDogc3RyaW5nLFxuICBzdG9yZVVybDogc3RyaW5nLFxuICByZWdpb246IHN0cmluZ1xuKTogUHJvbWlzZTxQcm9kdWN0RGV0YWlsPiB7XG4gIGNvbnN0IHVybCA9IHN0b3JlVXJsIHx8IGBodHRwczovL3N0b3JlLnBsYXlzdGF0aW9uLmNvbS9lbi11cy9wcm9kdWN0LyR7aWR9YDtcbiAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoSHRtbCh1cmwsIHJlZ2lvbik7XG4gIGNvbnN0IGRhdGEgPSBleHRyYWN0TmV4dERhdGEoaHRtbCk7XG4gIGlmICghZGF0YSkgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFwiTm8gX19ORVhUX0RBVEFfXyBpbiBQU04gcHJvZHVjdCBwYWdlXCIpO1xuXG4gIGNvbnN0IHJlY29yZHMgPSBmaW5kUHJvZHVjdFJlY29yZHMoZGF0YSwgaWQpO1xuICBjb25zdCByaWNoID0gcGlja1JpY2hlc3QocmVjb3Jkcyk7XG4gIGlmICghcmljaCkgdGhyb3cgbmV3IFBzbkFwaUVycm9yKGBQcm9kdWN0ICR7aWR9IG5vdCBmb3VuZCBpbiBwYWdlIEpTT05gKTtcbiAgY29uc3Qgb2JqID0gbWVyZ2VSZWNvcmRzKHJlY29yZHMpO1xuXG4gIGNvbnN0IHBsYXRmb3Jtc1JhdyA9IG9iai5wbGF0Zm9ybXM7XG4gIGNvbnN0IHBsYXRmb3JtcyA9IEFycmF5LmlzQXJyYXkocGxhdGZvcm1zUmF3KVxuICAgID8gcGxhdGZvcm1zUmF3LmpvaW4oXCIsXCIpXG4gICAgOiBTdHJpbmcocGxhdGZvcm1zUmF3IHx8IFwiXCIpO1xuXG4gIGNvbnN0IGxvbmdEZXNjID1cbiAgICAodHlwZW9mIG9iai5sb25nRGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgJiYgb2JqLmxvbmdEZXNjcmlwdGlvbikgfHxcbiAgICAodHlwZW9mIG9iai5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvYmouZGVzY3JpcHRpb24pIHx8XG4gICAgXCJcIjtcbiAgY29uc3Qgc2hvcnREZXNjID1cbiAgICAodHlwZW9mIG9iai5zaG9ydERlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiICYmIG9iai5zaG9ydERlc2NyaXB0aW9uKSB8fFxuICAgIG51bGw7XG5cbiAgY29uc3QgZmlsZVNpemUgPVxuICAgIHN0cihvYmoucmVxdWlyZWREaXNrU3BhY2VEZXNjcmlwdGlvbikgfHxcbiAgICBzdHIob2JqLmZpbGVTaXplKSB8fFxuICAgIGV4dHJhY3RGaWxlU2l6ZUZyb21IdG1sKGh0bWwpO1xuXG4gIGNvbnN0IGNvbnRlbnRSYXRpbmcgPSBvYmouY29udGVudFJhdGluZyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgY29uc3QgYWdlUmF0aW5nID1cbiAgICBzdHIoY29udGVudFJhdGluZz8uZGVzY3JpcHRpb24pIHx8XG4gICAgc3RyKGNvbnRlbnRSYXRpbmc/Lm5hbWUpIHx8XG4gICAgc3RyKG9iai5hZ2VMaW1pdCk7XG5cbiAgY29uc3QgcGxheWVySW5mbyA9IGV4dHJhY3RQbGF5ZXJJbmZvKG9iaiwgaHRtbCk7XG5cbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICBuYW1lOiBTdHJpbmcob2JqLm5hbWUgfHwgb2JqLnRpdGxlIHx8IFwiXCIpLFxuICAgIGRlc2NyaXB0aW9uOiBzYW5pdGl6ZUh0bWwobG9uZ0Rlc2MpLFxuICAgIHNob3J0RGVzY3JpcHRpb246IHNob3J0RGVzYyxcbiAgICBwdWJsaXNoZXI6IHN0cihvYmoucHVibGlzaGVyTmFtZSkgfHwgc3RyKG9iai5wdWJsaXNoZXIpIHx8IHN0cihvYmoucHVibGlzaGVkQnkpLFxuICAgIGRldmVsb3Blcjogc3RyKG9iai5kZXZlbG9wZXJOYW1lKSB8fCBzdHIob2JqLmRldmVsb3BlciksXG4gICAgcmVsZWFzZURhdGU6XG4gICAgICBzdHIob2JqLnJlbGVhc2VEYXRlKSB8fFxuICAgICAgc3RyKG9iai5sb2NhbGl6ZWRSZWxlYXNlRGF0ZSkgfHxcbiAgICAgIHN0cihvYmoucmVsZWFzZURhdGVSYXcpLFxuICAgIGdlbnJlczogdG9TdHJpbmdBcnJheShvYmouZ2VucmVzKSxcbiAgICB2b2ljZUxhbmd1YWdlczogdG9TdHJpbmdBcnJheShvYmouc3Bva2VuTGFuZ3VhZ2VzIHx8IG9iai5jb21wYXRpYmxlVm9pY2VzKSxcbiAgICBzdWJ0aXRsZUxhbmd1YWdlczogdG9TdHJpbmdBcnJheShcbiAgICAgIG9iai5zdWJ0aXRsZUxhbmd1YWdlcyB8fCBvYmouY29tcGF0aWJsZVN1YnRpdGxlc1xuICAgICksXG4gICAgYWdlUmF0aW5nLFxuICAgIGNvbnRlbnREZXNjcmlwdG9yczogZXh0cmFjdENvbnRlbnREZXNjcmlwdG9ycyhvYmopLFxuICAgIGludGVyYWN0aXZlRWxlbWVudHM6IGV4dHJhY3RJbnRlcmFjdGl2ZUVsZW1lbnRzKG9iaiksXG4gICAgcGxheWVyQ291bnQ6IHBsYXllckluZm8ucGxheWVyQ291bnQsXG4gICAgb25saW5lUGxheWVyQ291bnQ6IHBsYXllckluZm8ub25saW5lUGxheWVyQ291bnQsXG4gICAgcHNQbHVzUmVxdWlyZWQ6IHBsYXllckluZm8ucHNQbHVzUmVxdWlyZWQsXG4gICAgaW5HYW1lUHVyY2hhc2VzOiBwbGF5ZXJJbmZvLmluR2FtZVB1cmNoYXNlcyxcbiAgICBnYW1lRmVhdHVyZXM6IGV4dHJhY3RHYW1lRmVhdHVyZXMob2JqLCBodG1sKSxcbiAgICBwc1ZlcnNpb246IGV4dHJhY3RQc1ZlcnNpb24ob2JqLCBodG1sKSxcbiAgICBmaWxlU2l6ZSxcbiAgICBwbGF0Zm9ybXMsXG4gICAgbWVkaWE6IGV4dHJhY3RNZWRpYShvYmopLFxuICAgIGNhcm91c2VsSW1hZ2VzOiBleHRyYWN0Q2Fyb3VzZWxJbWFnZXMob2JqLCBodG1sKSxcbiAgICBzdG9yZVVybDogdXJsLFxuICAgIGRpc2NvdW50RW5kQXQ6IGV4dHJhY3REaXNjb3VudEVuZEF0KG9iaiwgaHRtbCksXG4gICAgZmV0Y2hlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3R5cGVzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy90eXBlcy50c1wiO2V4cG9ydCB0eXBlIFBsYXRmb3JtID0gXCJwc25cIiB8IFwieGJveFwiIHwgXCJuaW50ZW5kb1wiIHwgXCJzdGVhbVwiO1xuXG5leHBvcnQgY29uc3QgUExBVEZPUk1fTEFCRUxTOiBSZWNvcmQ8UGxhdGZvcm0sIHN0cmluZz4gPSB7XG4gIHBzbjogXCJQbGF5U3RhdGlvblwiLFxuICB4Ym94OiBcIlhib3hcIixcbiAgbmludGVuZG86IFwiTmludGVuZG9cIixcbiAgc3RlYW06IFwiU3RlYW1cIixcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVnaW9uQ29uZmlnIHtcbiAgY29kZTogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBsb2NhbGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX1JFR0lPTlM6IFJlY29yZDxQbGF0Zm9ybSwgUmVnaW9uQ29uZmlnW10+ID0ge1xuICBwc246IFtcbiAgICB7IGNvZGU6IFwidXNcIiwgbGFiZWw6IFwiVVNcIiwgY3VycmVuY3k6IFwiVVNEXCIsIGxvY2FsZTogXCJlbi1VU1wiIH0sXG4gICAgeyBjb2RlOiBcImJyXCIsIGxhYmVsOiBcIkJyYXNpbFwiLCBjdXJyZW5jeTogXCJCUkxcIiwgbG9jYWxlOiBcInB0LUJSXCIgfSxcbiAgXSxcbiAgeGJveDogW1xuICAgIHsgY29kZTogXCJ1c1wiLCBsYWJlbDogXCJVU1wiLCBjdXJyZW5jeTogXCJVU0RcIiwgbG9jYWxlOiBcImVuLVVTXCIgfSxcbiAgICB7IGNvZGU6IFwiYnJcIiwgbGFiZWw6IFwiQnJhc2lsXCIsIGN1cnJlbmN5OiBcIkJSTFwiLCBsb2NhbGU6IFwicHQtQlJcIiB9LFxuICAgIHsgY29kZTogXCJ0clwiLCBsYWJlbDogXCJUdXJxdVx1MDBFRGFcIiwgY3VycmVuY3k6IFwiVFJZXCIsIGxvY2FsZTogXCJ0ci1UUlwiIH0sXG4gIF0sXG4gIG5pbnRlbmRvOiBbXG4gICAgeyBjb2RlOiBcInVzXCIsIGxhYmVsOiBcIlVTXCIsIGN1cnJlbmN5OiBcIlVTRFwiLCBsb2NhbGU6IFwiZW4tVVNcIiB9LFxuICAgIHsgY29kZTogXCJqcFwiLCBsYWJlbDogXCJKYXBcdTAwRjNuXCIsIGN1cnJlbmN5OiBcIkpQWVwiLCBsb2NhbGU6IFwiamFcIiB9LFxuICBdLFxuICBzdGVhbTogW1xuICAgIHsgY29kZTogXCJ1c1wiLCBsYWJlbDogXCJVU1wiLCBjdXJyZW5jeTogXCJVU0RcIiwgbG9jYWxlOiBcImVuXCIgfSxcbiAgICB7IGNvZGU6IFwiYnJcIiwgbGFiZWw6IFwiQnJhc2lsXCIsIGN1cnJlbmN5OiBcIkJSTFwiLCBsb2NhbGU6IFwiYnJhemlsaWFuXCIgfSxcbiAgICB7IGNvZGU6IFwidHJcIiwgbGFiZWw6IFwiVHVycXVcdTAwRURhXCIsIGN1cnJlbmN5OiBcIlRSWVwiLCBsb2NhbGU6IFwidHVya2lzaFwiIH0sXG4gIF0sXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFJhd0RlYWwge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGltYWdlVXJsOiBzdHJpbmcgfCBudWxsO1xuICBzdG9yZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgaGFyZHdhcmVQbGF0Zm9ybXM6IHN0cmluZztcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgcHJpY2VPcmlnaW5hbENlbnRzOiBudW1iZXIgfCBudWxsO1xuICBwcmljZURpc2NvdW50ZWRDZW50czogbnVtYmVyIHwgbnVsbDtcbiAgZGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIGRpc2NvdW50RW5kQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdmlkZXJTb3VyY2Uge1xuICBwbGF0Zm9ybTogUGxhdGZvcm07XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBlbmFibGVkOiBib29sZWFuO1xuICBjYXRlZ29yeUlkPzogc3RyaW5nO1xuICB1cmw/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdmlkZXIge1xuICBwbGF0Zm9ybTogUGxhdGZvcm07XG4gIGZldGNoRGVhbHMoc291cmNlOiBQcm92aWRlclNvdXJjZSk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+O1xufVxuXG5leHBvcnQgY2xhc3MgUHJvdmlkZXJFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHBsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICBwdWJsaWMgcmVnaW9uOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogc3RyaW5nXG4gICkge1xuICAgIHN1cGVyKGBbJHtwbGF0Zm9ybX0vJHtyZWdpb259XSAke21lc3NhZ2V9YCk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvcHNuLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9wc24udHNcIjtpbXBvcnQge1xuICBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyxcbiAgaXNGdWxsR2FtZVByb2R1Y3QsXG4gIG5vcm1hbGl6ZVByb2R1Y3QsXG4gIFBzbkFwaUVycm9yLFxufSBmcm9tIFwiLi4vcHNuXCI7XG5pbXBvcnQgdHlwZSB7IFBzbkNvbmZpZyB9IGZyb20gXCIuLi9zdG9yZVwiO1xuaW1wb3J0IHR5cGUgeyBQcm92aWRlciwgUHJvdmlkZXJTb3VyY2UsIFJhd0RlYWwgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgcHNuUHJvdmlkZXI6IFByb3ZpZGVyID0ge1xuICBwbGF0Zm9ybTogXCJwc25cIixcbiAgYXN5bmMgKmZldGNoRGVhbHMoc291cmNlOiBQcm92aWRlclNvdXJjZSk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgICBjb25zdCBsb2NhbGUgPVxuICAgICAgc291cmNlLnJlZ2lvbiA9PT0gXCJiclwiID8gXCJwdC1CUlwiIDogXCJlbi1VU1wiO1xuICAgIGNvbnN0IGNmZzogUHNuQ29uZmlnID0ge1xuICAgICAgcmVnaW9uOiBsb2NhbGUsXG4gICAgICBkZWFsc0NhdGVnb3J5SWQ6IHNvdXJjZS5jYXRlZ29yeUlkIHx8IFwiXCIsXG4gICAgICBjYXRlZ29yeUdyaWRIYXNoOiBcIlwiLFxuICAgICAgaW5jbHVkZUFkZE9uczogZmFsc2UsXG4gICAgfTtcblxuICAgIGlmICghY2ZnLmRlYWxzQ2F0ZWdvcnlJZCkge1xuICAgICAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFxuICAgICAgICBcIk5vIHNlIGNvbmZpZ3VyXHUwMEYzIHVuIENhdGVnb3J5IElEIHBhcmEgUFNOIFwiICsgc291cmNlLnJlZ2lvbi50b1VwcGVyQ2FzZSgpXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbmN5ID0gc291cmNlLnJlZ2lvbiA9PT0gXCJiclwiID8gXCJCUkxcIiA6IFwiVVNEXCI7XG5cbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJhdyBvZiBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyhjZmcpKSB7XG4gICAgICBpZiAoIWlzRnVsbEdhbWVQcm9kdWN0KHJhdykpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgY29uc3QgZ2FtZSA9IG5vcm1hbGl6ZVByb2R1Y3QocmF3LCBub3cpO1xuICAgICAgaWYgKCFnYW1lKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgcmVnaW9uUGF0aCA9IGxvY2FsZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3Qgc3RvcmVVcmwgPSBgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vJHtyZWdpb25QYXRofS9wcm9kdWN0LyR7Z2FtZS5pZH1gO1xuXG4gICAgICB5aWVsZCB7XG4gICAgICAgIGlkOiBnYW1lLmlkLFxuICAgICAgICBuYW1lOiBnYW1lLm5hbWUsXG4gICAgICAgIGltYWdlVXJsOiBnYW1lLmltYWdlVXJsLFxuICAgICAgICBzdG9yZVVybCxcbiAgICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IGdhbWUucGxhdGZvcm1zLFxuICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBnYW1lLnByaWNlT3JpZ2luYWxDZW50cyxcbiAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGdhbWUucHJpY2VEaXNjb3VudGVkQ2VudHMsXG4gICAgICAgIGRpc2NvdW50UGVyY2VudDogZ2FtZS5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGRpc2NvdW50RW5kQXQ6IGdhbWUuZGlzY291bnRFbmRBdCxcbiAgICAgIH07XG4gICAgfVxuICB9LFxufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMveGJveC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMveGJveC50c1wiO2ltcG9ydCB0eXBlIHsgUHJvdmlkZXIsIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5jb25zdCBNQVJLRVRfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICB1czogXCJVU1wiLFxuICBicjogXCJCUlwiLFxuICB0cjogXCJUUlwiLFxufTtcblxuY29uc3QgTEFOR19NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcImVuLVVTXCIsXG4gIGJyOiBcInB0LUJSXCIsXG4gIHRyOiBcInRyLVRSXCIsXG59O1xuXG5jb25zdCBDVVJSRU5DWV9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTRFwiLFxuICBicjogXCJCUkxcIixcbiAgdHI6IFwiVFJZXCIsXG59O1xuXG5pbnRlcmZhY2UgQ2F0YWxvZ1Byb2R1Y3Qge1xuICBQcm9kdWN0SWQ6IHN0cmluZztcbiAgTG9jYWxpemVkUHJvcGVydGllcz86IEFycmF5PHtcbiAgICBQcm9kdWN0VGl0bGU/OiBzdHJpbmc7XG4gICAgSW1hZ2VzPzogQXJyYXk8eyBJbWFnZVB1cnBvc2U/OiBzdHJpbmc7IFVyaT86IHN0cmluZyB9PjtcbiAgfT47XG4gIERpc3BsYXlTa3VBdmFpbGFiaWxpdGllcz86IEFycmF5PHtcbiAgICBTa3U/OiB7IFByb3BlcnRpZXM/OiB7IEZ1bGZpbGxtZW50RGF0YT86IHsgUGxhdGZvcm1EZXBlbmRlbmN5SW5mbz86IHN0cmluZyB9IH0gfTtcbiAgICBBdmFpbGFiaWxpdGllcz86IEFycmF5PHtcbiAgICAgIENvbmRpdGlvbnM/OiB7IEVuZERhdGU/OiBzdHJpbmcgfTtcbiAgICAgIE9yZGVyTWFuYWdlbWVudERhdGE/OiB7XG4gICAgICAgIFByaWNlPzoge1xuICAgICAgICAgIExpc3RQcmljZT86IG51bWJlcjtcbiAgICAgICAgICBNU1JQPzogbnVtYmVyO1xuICAgICAgICAgIFdob2xlc2FsZVByaWNlPzogbnVtYmVyO1xuICAgICAgICAgIEN1cnJlbmN5Q29kZT86IHN0cmluZztcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfT47XG4gIH0+O1xuICBQcm9wZXJ0aWVzPzoge1xuICAgIENhdGVnb3JpZXM/OiBzdHJpbmdbXTtcbiAgICBDYXRlZ29yeT86IHN0cmluZztcbiAgfTtcbn1cblxuZnVuY3Rpb24gdG9DZW50cyhwcmljZTogbnVtYmVyIHwgdW5kZWZpbmVkIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAocHJpY2UgPT0gbnVsbCB8fCAhTnVtYmVyLmlzRmluaXRlKHByaWNlKSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBNYXRoLnJvdW5kKHByaWNlICogMTAwKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hXaXRoUmV0cnkodXJsOiBzdHJpbmcsIGluaXQ/OiBSZXF1ZXN0SW5pdCk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCA0OyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBoZWFkZXJzOiB7IFwidXNlci1hZ2VudFwiOiBVQSwgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgICAuLi5pbml0LFxuICAgICAgfSk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgMTAwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxhc3RFcnJvciA9IGU7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNTAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgfVxuICB9XG4gIHRocm93IGxhc3RFcnJvcjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hKc29uKHVybDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgY29uc3QgciA9IGF3YWl0IGZldGNoV2l0aFJldHJ5KHVybCk7XG4gIGlmICghci5vaykge1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCByLnRleHQoKS5jYXRjaCgoKSA9PiBcIlwiKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyLnN0YXR1c306ICR7dGV4dC5zbGljZSgwLCAyMDApfWApO1xuICB9XG4gIHJldHVybiByLmpzb24oKTtcbn1cblxuLyoqIFJlY3Vyc2l2ZWx5IHdhbGsgYSBKU09OIHRyZWUgbG9va2luZyBmb3IgWGJveCBwcm9kdWN0IElEcyAoMTItY2hhciBhbHBoYW51bWVyaWMgc3RhcnRpbmcgd2l0aCA5KS4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RJZHNGcm9tVHJlZShub2RlOiB1bmtub3duLCBzZWVuOiBTZXQ8c3RyaW5nPiwgaWRzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBpZiAoIW5vZGUgfHwgdHlwZW9mIG5vZGUgIT09IFwib2JqZWN0XCIpIHtcbiAgICBpZiAodHlwZW9mIG5vZGUgPT09IFwic3RyaW5nXCIgJiYgL145W0EtWjAtOV17MTF9JC8udGVzdChub2RlKSAmJiAhc2Vlbi5oYXMobm9kZSkpIHtcbiAgICAgIHNlZW4uYWRkKG5vZGUpO1xuICAgICAgaWRzLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkge1xuICAgIGZvciAoY29uc3QgdiBvZiBub2RlKSBleHRyYWN0SWRzRnJvbVRyZWUodiwgc2VlbiwgaWRzKTtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCB2IG9mIE9iamVjdC52YWx1ZXMobm9kZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikpIHtcbiAgICBleHRyYWN0SWRzRnJvbVRyZWUodiwgc2VlbiwgaWRzKTtcbiAgfVxufVxuXG4vLyBUcnkgbXVsdGlwbGUgZW5kcG9pbnRzIHRvIGdldCBkZWFsIHByb2R1Y3QgSURzLlxuLy8gUHJpbWFyeTogcmVjby1wdWJsaWMgKE1pY3Jvc29mdCBSZWNvbW1lbmRhdGlvbnMgQVBJKVxuLy8gRmFsbGJhY2s6IGNhdGFsb2cuZ2FtZXBhc3MuY29tL3NpZ2xzIChHYW1lIFBhc3Mgc2lnbmFscyBcdTIwMTQgY29udGFpbnMgZGVhbCBsaXN0cylcbmFzeW5jIGZ1bmN0aW9uIGZldGNoRGVhbElkcyhcbiAgbWFya2V0OiBzdHJpbmcsXG4gIGxhbmd1YWdlOiBzdHJpbmdcbik6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIEF0dGVtcHQgMTogUmVjbyBBUElcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vcmVjby1wdWJsaWMucmVjLm1wLm1pY3Jvc29mdC5jb20vY2hhbm5lbHMvUmVjby9WOC4wL0xpc3RzL0NvbXB1dGVkL0RlYWxgICtcbiAgICAgIGA/TWFya2V0PSR7bWFya2V0fSZMYW5ndWFnZT0ke2xhbmd1YWdlfSZJdGVtVHlwZXM9R2FtZWAgK1xuICAgICAgYCZkZXZpY2VGYW1pbHk9V2luZG93cy5YYm94JmNvdW50PTIwMDAmc2tpcGl0ZW1zPTBgO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaEpzb24odXJsKTtcbiAgICBjb25zdCBpdGVtczogQXJyYXk8eyBJZDogc3RyaW5nIH0+ID0gZGF0YT8uSXRlbXMgPz8gW107XG4gICAgY29uc3QgaWRzID0gaXRlbXMubWFwKChpdCkgPT4gaXQuSWQpLmZpbHRlcihCb29sZWFuKTtcbiAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHJldHVybiBpZHM7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvcnMucHVzaChgUmVjbzogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgfVxuXG4gIC8vIEF0dGVtcHQgMjogWGJveCBjYXRhbG9nIGRlYWxzIHZpYSBzaWdscyAoc2lnbmFsIGxpc3RzKVxuICAvLyBEZWFsIGxpc3QgSUQga25vd24gZnJvbSBYYm94IHdlYnNpdGUgc291cmNlXG4gIGNvbnN0IERFQUxfTElTVF9JRCA9IFwiZjZmMWY5OWYtOWI0OS00Y2NkLWIzYmYtNGQ5NzY3YTc3ZjVlXCI7XG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL2NhdGFsb2cuZ2FtZXBhc3MuY29tL3NpZ2xzL3YyYCArXG4gICAgICBgP2lkPSR7REVBTF9MSVNUX0lEfSZsYW5ndWFnZT0ke2xhbmd1YWdlLnNwbGl0KFwiLVwiKVswXX0mbWFya2V0PSR7bWFya2V0fWA7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgIGNvbnN0IGl0ZW1zOiBBcnJheTx7IGlkPzogc3RyaW5nIH0+ID0gQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBbXTtcbiAgICBjb25zdCBpZHMgPSBpdGVtcy5tYXAoKGl0KSA9PiBpdC5pZCkuZmlsdGVyKChpZCk6IGlkIGlzIHN0cmluZyA9PiAhIWlkKTtcbiAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHJldHVybiBpZHM7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvcnMucHVzaChgU2lnbHM6ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gIH1cblxuICAvLyBBdHRlbXB0IDM6IFNlYXJjaCBkaXNwbGF5Y2F0YWxvZyBmb3IgZ2FtZXMgd2l0aCBkZWFsc1xuICB0cnkge1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9kaXNwbGF5Y2F0YWxvZy5tcC5taWNyb3NvZnQuY29tL3Y3LjAvcHJvZHVjdHMvc2VhcmNoYCArXG4gICAgICBgP3F1ZXJ5PWRlYWwmbWFya2V0PSR7bWFya2V0fSZsYW5ndWFnZXM9JHtsYW5ndWFnZX1gICtcbiAgICAgIGAmZmllbGRzVGVtcGxhdGU9ZGV0YWlscyZ0b3A9MjAwYDtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZmV0Y2hKc29uKHVybCk7XG4gICAgY29uc3QgcHJvZHVjdHM6IENhdGFsb2dQcm9kdWN0W10gPSBkYXRhPy5Qcm9kdWN0cyA/PyBbXTtcbiAgICBjb25zdCBpZHMgPSBwcm9kdWN0cy5tYXAoKHApID0+IHAuUHJvZHVjdElkKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgaWYgKGlkcy5sZW5ndGggPiAwKSByZXR1cm4gaWRzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3JzLnB1c2goYFNlYXJjaDogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgfVxuXG4gIC8vIEF0dGVtcHQgNDogSFRNTCBmYWxsYmFjayBcdTIwMTQgc2NyYXBlIHhib3guY29tIGRlYWxzIHBhZ2UgZm9yIHByb2R1Y3QgSURzXG4gIHRyeSB7XG4gICAgY29uc3QgYnJvd3NlVXJsID1cbiAgICAgIGBodHRwczovL3d3dy54Ym94LmNvbS9lbi1VUy9nYW1lcy9icm93c2U/RmlsdGVyZWRCeUlkcz1EeW5hbWljQ2hhbm5lbC5HYW1lRGVhbHNgO1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeShicm93c2VVcmwsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICBhY2NlcHQ6IFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksKi8qO3E9MC44XCIsXG4gICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IGxhbmd1YWdlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfWApO1xuICAgIH1cbiAgICBjb25zdCBodG1sID0gYXdhaXQgci50ZXh0KCk7XG4gICAgY29uc3QgaWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIC8vIFN0cmF0ZWd5IEE6IFBhcnNlIF9fTkVYVF9EQVRBX18gSlNPTiBibG9iIGZvciBwcm9kdWN0IElEc1xuICAgIGNvbnN0IG5leHREYXRhTWF0Y2ggPSAvPHNjcmlwdFtePl0qaWQ9W1wiJ11fX05FWFRfREFUQV9fW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi8uZXhlYyhodG1sKTtcbiAgICBpZiAobmV4dERhdGFNYXRjaCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbmV4dERhdGEgPSBKU09OLnBhcnNlKG5leHREYXRhTWF0Y2hbMV0pO1xuICAgICAgICBleHRyYWN0SWRzRnJvbVRyZWUobmV4dERhdGEsIHNlZW4sIGlkcyk7XG4gICAgICB9IGNhdGNoIHsgLyogbWFsZm9ybWVkIEpTT04gKi8gfVxuICAgIH1cblxuICAgIC8vIFN0cmF0ZWd5IEI6IExvb2sgZm9yIDEyLWNoYXJhY3RlciBhbHBoYW51bWVyaWMgcHJvZHVjdCBJRHMgaW4gZGF0YSBhdHRyaWJ1dGVzXG4gICAgaWYgKGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IGF0dHJSZWdleCA9IC9kYXRhLVthLXotXSppZD1bXCInXShbQS1aMC05XXsxMn0pW1wiJ10vZ2k7XG4gICAgICBsZXQgYXR0ck1hdGNoO1xuICAgICAgd2hpbGUgKChhdHRyTWF0Y2ggPSBhdHRyUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgaWQgPSBhdHRyTWF0Y2hbMV07XG4gICAgICAgIGlmICghc2Vlbi5oYXMoaWQpKSB7XG4gICAgICAgICAgc2Vlbi5hZGQoaWQpO1xuICAgICAgICAgIGlkcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFN0cmF0ZWd5IEM6IEZpbmQgYW55IDEyLWNoYXIgdXBwZXJjYXNlIGFscGhhbnVtZXJpYyBzdHJpbmdzIHRoYXQgbG9vayBsaWtlIFhib3ggcHJvZHVjdCBJRHNcbiAgICBpZiAoaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgaWRSZWdleCA9IC9cXGIoOVtBLVowLTldezExfSlcXGIvZztcbiAgICAgIGxldCBpZE1hdGNoO1xuICAgICAgd2hpbGUgKChpZE1hdGNoID0gaWRSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBpZCA9IGlkTWF0Y2hbMV07XG4gICAgICAgIGlmICghc2Vlbi5oYXMoaWQpKSB7XG4gICAgICAgICAgc2Vlbi5hZGQoaWQpO1xuICAgICAgICAgIGlkcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpZHMubGVuZ3RoID4gMCkgcmV0dXJuIGlkcztcbiAgICBlcnJvcnMucHVzaChgSFRNTCBzY3JhcGU6IGZvdW5kIDAgcHJvZHVjdCBJRHMgaW4gJHtodG1sLmxlbmd0aH0gYnl0ZXMgb2YgSFRNTGApO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3JzLnB1c2goYEhUTUwgc2NyYXBlOiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKGBBbGwgWGJveCBkZWFsIGVuZHBvaW50cyBmYWlsZWQ6ICR7ZXJyb3JzLmpvaW4oXCIgfCBcIil9YCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoUHJvZHVjdERldGFpbHMoXG4gIGlkczogc3RyaW5nW10sXG4gIG1hcmtldDogc3RyaW5nLFxuICBsYW5ndWFnZTogc3RyaW5nXG4pOiBQcm9taXNlPENhdGFsb2dQcm9kdWN0W10+IHtcbiAgY29uc3QgYmF0Y2hTaXplID0gMjA7XG4gIGNvbnN0IGFsbDogQ2F0YWxvZ1Byb2R1Y3RbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlkcy5sZW5ndGg7IGkgKz0gYmF0Y2hTaXplKSB7XG4gICAgY29uc3QgYmF0Y2ggPSBpZHMuc2xpY2UoaSwgaSArIGJhdGNoU2l6ZSk7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL2Rpc3BsYXljYXRhbG9nLm1wLm1pY3Jvc29mdC5jb20vdjcuMC9wcm9kdWN0c2AgK1xuICAgICAgYD9iaWdJZHM9JHtiYXRjaC5qb2luKFwiLFwiKX0mbWFya2V0PSR7bWFya2V0fSZsYW5ndWFnZXM9JHtsYW5ndWFnZX1gICtcbiAgICAgIGAmTVMtQ1Y9REdVMW1jdVlvMFdNTXArRi4xYDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgICAgY29uc3QgcHJvZHVjdHM6IENhdGFsb2dQcm9kdWN0W10gPSBkYXRhPy5Qcm9kdWN0cyA/PyBbXTtcbiAgICAgIGFsbC5wdXNoKC4uLnByb2R1Y3RzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFNraXAgZmFpbGVkIGJhdGNoLCBjb250aW51ZSB3aXRoIHJlc3RcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFsbDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEdhbWVEYXRhKFxuICBwcm9kdWN0OiBDYXRhbG9nUHJvZHVjdCxcbiAgcmVnaW9uOiBzdHJpbmdcbik6IFJhd0RlYWwgfCBudWxsIHtcbiAgY29uc3QgaWQgPSBwcm9kdWN0LlByb2R1Y3RJZDtcbiAgaWYgKCFpZCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgbHAgPSBwcm9kdWN0LkxvY2FsaXplZFByb3BlcnRpZXM/LlswXTtcbiAgY29uc3QgbmFtZSA9IGxwPy5Qcm9kdWN0VGl0bGU7XG4gIGlmICghbmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IGltYWdlVXJsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgaW1hZ2VzID0gbHA/LkltYWdlcyA/PyBbXTtcbiAgY29uc3QgaGVybyA9IGltYWdlcy5maW5kKFxuICAgIChpbWcpID0+IGltZy5JbWFnZVB1cnBvc2UgPT09IFwiU3VwZXJIZXJvQXJ0XCIgfHwgaW1nLkltYWdlUHVycG9zZSA9PT0gXCJQb3N0ZXJcIlxuICApO1xuICBjb25zdCBib3hBcnQgPSBpbWFnZXMuZmluZCgoaW1nKSA9PiBpbWcuSW1hZ2VQdXJwb3NlID09PSBcIkJveEFydFwiKTtcbiAgY29uc3QgYW55SW1nID0gaW1hZ2VzWzBdO1xuICBjb25zdCBjaG9zZW4gPSBoZXJvIHx8IGJveEFydCB8fCBhbnlJbWc7XG4gIGlmIChjaG9zZW4/LlVyaSkge1xuICAgIGltYWdlVXJsID0gY2hvc2VuLlVyaS5zdGFydHNXaXRoKFwiLy9cIilcbiAgICAgID8gXCJodHRwczpcIiArIGNob3Nlbi5VcmlcbiAgICAgIDogY2hvc2VuLlVyaTtcbiAgfVxuXG4gIGNvbnN0IGRzYSA9IHByb2R1Y3QuRGlzcGxheVNrdUF2YWlsYWJpbGl0aWVzPy5bMF07XG4gIGNvbnN0IGF2YWlscyA9IGRzYT8uQXZhaWxhYmlsaXRpZXMgPz8gW107XG5cbiAgbGV0IGxpc3RQcmljZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYWxlUHJpY2U6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBsZXQgZW5kRGF0ZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGN1cnJlbmN5ID0gQ1VSUkVOQ1lfTUFQW3JlZ2lvbl0gfHwgXCJVU0RcIjtcblxuICBmb3IgKGNvbnN0IGEgb2YgYXZhaWxzKSB7XG4gICAgY29uc3QgcCA9IGEuT3JkZXJNYW5hZ2VtZW50RGF0YT8uUHJpY2U7XG4gICAgaWYgKCFwKSBjb250aW51ZTtcbiAgICBjb25zdCBtc3JwID0gcC5NU1JQID8/IHAuTGlzdFByaWNlO1xuICAgIGNvbnN0IHNhbGUgPSBwLkxpc3RQcmljZSA/PyBwLldob2xlc2FsZVByaWNlO1xuICAgIGlmIChtc3JwICE9IG51bGwgJiYgbGlzdFByaWNlID09IG51bGwpIGxpc3RQcmljZSA9IG1zcnA7XG4gICAgaWYgKHNhbGUgIT0gbnVsbCAmJiBzYWxlIDwgKG1zcnAgPz8gSW5maW5pdHkpKSB7XG4gICAgICBzYWxlUHJpY2UgPSBzYWxlO1xuICAgICAgZW5kRGF0ZSA9IGEuQ29uZGl0aW9ucz8uRW5kRGF0ZSA/PyBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGlmIChsaXN0UHJpY2UgPT0gbnVsbCAmJiBzYWxlUHJpY2UgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3Qgb3JpZ2luYWxDZW50cyA9IHRvQ2VudHMobGlzdFByaWNlKTtcbiAgY29uc3QgZGlzY291bnRlZENlbnRzID0gdG9DZW50cyhzYWxlUHJpY2UpID8/IG9yaWdpbmFsQ2VudHM7XG4gIGxldCBkaXNjb3VudFBlcmNlbnQgPSAwO1xuICBpZiAoXG4gICAgb3JpZ2luYWxDZW50cyAmJlxuICAgIGRpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgZGlzY291bnRlZENlbnRzIDwgb3JpZ2luYWxDZW50c1xuICApIHtcbiAgICBkaXNjb3VudFBlcmNlbnQgPSBNYXRoLnJvdW5kKFxuICAgICAgKChvcmlnaW5hbENlbnRzIC0gZGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBvcmlnaW5hbENlbnRzXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IG1hcmtldCA9IE1BUktFVF9NQVBbcmVnaW9uXSB8fCBcIlVTXCI7XG4gIGNvbnN0IHN0b3JlVXJsID0gYGh0dHBzOi8vd3d3Lnhib3guY29tLyR7bWFya2V0LnRvTG93ZXJDYXNlKCl9L2dhbWVzL3N0b3JlLyR7ZW5jb2RlVVJJQ29tcG9uZW50KG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKSl9LyR7aWR9YDtcblxuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIG5hbWUsXG4gICAgaW1hZ2VVcmwsXG4gICAgc3RvcmVVcmwsXG4gICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiWGJveCBTZXJpZXMgWHxTLCBYYm94IE9uZVwiLFxuICAgIGN1cnJlbmN5LFxuICAgIHByaWNlT3JpZ2luYWxDZW50czogb3JpZ2luYWxDZW50cyxcbiAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGlzY291bnRlZENlbnRzLFxuICAgIGRpc2NvdW50UGVyY2VudCxcbiAgICBkaXNjb3VudEVuZEF0OiBlbmREYXRlLFxuICB9O1xufVxuXG5leHBvcnQgY29uc3QgeGJveFByb3ZpZGVyOiBQcm92aWRlciA9IHtcbiAgcGxhdGZvcm06IFwieGJveFwiLFxuICBhc3luYyAqZmV0Y2hEZWFscyhzb3VyY2U6IFByb3ZpZGVyU291cmNlKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAgIGNvbnN0IG1hcmtldCA9IE1BUktFVF9NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgY29uc3QgbGFuZ3VhZ2UgPSBMQU5HX01BUFtzb3VyY2UucmVnaW9uXTtcbiAgICBpZiAoIW1hcmtldCB8fCAhbGFuZ3VhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFwieGJveFwiLCBzb3VyY2UucmVnaW9uLCBgUmVnaVx1MDBGM24gbm8gc29wb3J0YWRhOiAke3NvdXJjZS5yZWdpb259YCk7XG4gICAgfVxuXG4gICAgY29uc3QgaWRzID0gYXdhaXQgZmV0Y2hEZWFsSWRzKG1hcmtldCwgbGFuZ3VhZ2UpO1xuICAgIGlmIChpZHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBjb25zdCBwcm9kdWN0cyA9IGF3YWl0IGZldGNoUHJvZHVjdERldGFpbHMoaWRzLCBtYXJrZXQsIGxhbmd1YWdlKTtcblxuICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBwcm9kdWN0cykge1xuICAgICAgY29uc3QgZGVhbCA9IGV4dHJhY3RHYW1lRGF0YShwcm9kdWN0LCBzb3VyY2UucmVnaW9uKTtcbiAgICAgIGlmIChkZWFsICYmIGRlYWwuZGlzY291bnRQZXJjZW50ID4gMCkge1xuICAgICAgICB5aWVsZCBkZWFsO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3N0ZWFtLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9zdGVhbS50c1wiO2ltcG9ydCB0eXBlIHsgUHJvdmlkZXIsIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5jb25zdCBDQ19NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcInVzXCIsXG4gIGJyOiBcImJyXCIsXG4gIHRyOiBcInRyXCIsXG59O1xuXG5jb25zdCBDVVJSRU5DWV9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTRFwiLFxuICBicjogXCJCUkxcIixcbiAgdHI6IFwiVFJZXCIsXG59O1xuXG5pbnRlcmZhY2UgU3RlYW1TZWFyY2hSZXN1bHQge1xuICBuYW1lOiBzdHJpbmc7XG4gIGxvZ286IHN0cmluZztcbiAgdG90YWxfY291bnQ/OiBudW1iZXI7XG4gIGl0ZW1zPzogQXJyYXk8e1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBpZDogbnVtYmVyO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBsb2dvOiBzdHJpbmc7XG4gICAgbG9nb19wb3NpdGlvbjogbnVtYmVyO1xuICB9Pjtcbn1cblxuaW50ZXJmYWNlIFN0ZWFtU2VhcmNoSXRlbSB7XG4gIG5hbWU6IHN0cmluZztcbiAgbG9nbzogc3RyaW5nO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb24odXJsOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICBsZXQgbGFzdEVycm9yOiB1bmtub3duO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDQ7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgICAgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvamF2YXNjcmlwdCwgKi8qXCIsXG4gICAgICAgICAgY29va2llOiBcIndhbnRzX21hdHVyZV9jb250ZW50PTE7IGJpcnRodGltZT01NjgwMjI0MDE7IFN0ZWFtX0xhbmd1YWdlPWVuZ2xpc2hcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgaWYgKCFyLm9rKSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByLnRleHQoKS5jYXRjaCgoKSA9PiBcIlwiKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9OiAke3RleHQuc2xpY2UoMCwgMjAwKX1gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhd2FpdCByLmpzb24oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBsYXN0RXJyb3I7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3RlYW1QcmljZShwcmljZVN0cjogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXByaWNlU3RyKSByZXR1cm4gbnVsbDtcbiAgLy8gRGVjb2RlIEhUTUwgZW50aXRpZXMgYW5kIHN0cmlwIG5vbi1icmVha2luZyBzcGFjZXNcbiAgY29uc3QgcyA9IHByaWNlU3RyXG4gICAgLnJlcGxhY2UoLyZuYnNwOy9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvJiNcXGQrOy9nLCBcIlwiKVxuICAgIC50cmltKCk7XG4gIGlmICghcyB8fCAvXmZyZWUvaS50ZXN0KHMpIHx8IC9ncmF0aXMvaS50ZXN0KHMpKSByZXR1cm4gbnVsbDtcbiAgLy8gU3RyaXAgY3VycmVuY3kgc3ltYm9scyBhbmQgbGV0dGVycywga2VlcCBkaWdpdHMsIGRvdHMsIGNvbW1hc1xuICBjb25zdCBjbGVhbmVkID0gcy5yZXBsYWNlKC9bXjAtOS4sLV0vZywgXCJcIik7XG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIG51bGw7XG4gIC8vIFN0ZWFtIGZvcm1hdHM6IFwiJDE5Ljk5XCIgKFVTKSwgXCJSJCA4OSw5MFwiIChCUiksIFwiMTE5LDk5IFRMXCIgKFRSKVxuICAvLyBBbHNvIGhhbmRsZXMgXCIxLjA4OSw5MFwiIChCUiB0aG91c2FuZHMgc2VwYXJhdG9yKVxuICBjb25zdCBwYXJ0cyA9IGNsZWFuZWQuc3BsaXQoL1suLF0vKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA+PSAyKSB7XG4gICAgY29uc3QgbGFzdFBhcnQgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXTtcbiAgICBpZiAobGFzdFBhcnQubGVuZ3RoID09PSAyKSB7XG4gICAgICBjb25zdCB3aG9sZSA9IHBhcnRzLnNsaWNlKDAsIC0xKS5qb2luKFwiXCIpO1xuICAgICAgY29uc3QgbiA9IE51bWJlcih3aG9sZSArIFwiLlwiICsgbGFzdFBhcnQpO1xuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShuKSkgcmV0dXJuIE1hdGgucm91bmQobiAqIDEwMCk7XG4gICAgfVxuICB9XG4gIC8vIEZhbGxiYWNrOiB0cmVhdCBjb21tYXMgYXMgZGVjaW1hbCBzZXBhcmF0b3JzXG4gIGNvbnN0IG4gPSBOdW1iZXIoY2xlYW5lZC5yZXBsYWNlKC8sL2csIFwiLlwiKSk7XG4gIGlmIChOdW1iZXIuaXNGaW5pdGUobikpIHJldHVybiBNYXRoLnJvdW5kKG4gKiAxMDApO1xuICByZXR1cm4gbnVsbDtcbn1cblxuaW50ZXJmYWNlIFN0ZWFtU2VhcmNoUmVzdWx0SXRlbSB7XG4gIG5hbWU6IHN0cmluZztcbiAgYXBwaWQ6IHN0cmluZztcbn1cblxuYXN5bmMgZnVuY3Rpb24qIGZldGNoU3RlYW1EZWFscyhcbiAgY2M6IHN0cmluZyxcbiAgY3VycmVuY3k6IHN0cmluZyxcbiAgcmVnaW9uOiBzdHJpbmdcbik6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgY29uc3QgcGFnZVNpemUgPSAxMDA7XG4gIGNvbnN0IG1heFBhZ2VzID0gMzA7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGxldCBwYWdlID0gMDsgcGFnZSA8IG1heFBhZ2VzOyBwYWdlKyspIHtcbiAgICBjb25zdCBzdGFydCA9IHBhZ2UgKiBwYWdlU2l6ZTtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vc3RvcmUuc3RlYW1wb3dlcmVkLmNvbS9zZWFyY2gvcmVzdWx0cy8/cXVlcnkmc3RhcnQ9JHtzdGFydH1gICtcbiAgICAgIGAmY291bnQ9JHtwYWdlU2l6ZX0mZHluYW1pY19kYXRhPSZzb3J0X2J5PV9BU0Mmc3BlY2lhbHM9MWAgK1xuICAgICAgYCZzbnI9MV83XzdfMjMwXzcmaW5maW5pdGU9MSZjYz0ke2NjfWA7XG5cbiAgICBsZXQgZGF0YTogYW55O1xuICAgIHRyeSB7XG4gICAgICBkYXRhID0gYXdhaXQgZmV0Y2hKc29uKHVybCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKHBhZ2UgPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXCJzdGVhbVwiLCByZWdpb24sIGBTdGVhbSBzZWFyY2ggZmFpbGVkOiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgaHRtbDogc3RyaW5nID0gZGF0YT8ucmVzdWx0c19odG1sID8/IFwiXCI7XG4gICAgaWYgKCFodG1sIHx8IGh0bWwudHJpbSgpID09PSBcIlwiKSB7XG4gICAgICBpZiAocGFnZSA9PT0gMCkge1xuICAgICAgICBjb25zdCB0b3RhbCA9IGRhdGE/LnRvdGFsX2NvdW50ID8/IFwiP1wiO1xuICAgICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcInN0ZWFtXCIsIHJlZ2lvbiwgYFN0ZWFtIHJldHVybmVkIGVtcHR5IEhUTUwgKHRvdGFsX2NvdW50PSR7dG90YWx9LCBwcmV2aWV3OiAke2h0bWwuc2xpY2UoMCwgMjAwKX0pYCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBTcGxpdCBIVE1MIGludG8gaW5kaXZpZHVhbCByZXN1bHQgcm93cyBieSBhbmNob3IgYm91bmRhcmllc1xuICAgIGNvbnN0IGFuY2hvcnM6IHsgYXBwSWQ6IHN0cmluZzsgYmxvY2s6IHN0cmluZyB9W10gPSBbXTtcbiAgICBjb25zdCBhbmNob3JTdGFydHMgPSBbLi4uaHRtbC5tYXRjaEFsbCgvPGFbXj5dKmRhdGEtZHMtYXBwaWQ9XCIoXFxkKylcIi9nKV07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbmNob3JTdGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGFwcElkID0gYW5jaG9yU3RhcnRzW2ldWzFdO1xuICAgICAgY29uc3Qgc3RhcnRJZHggPSBhbmNob3JTdGFydHNbaV0uaW5kZXghO1xuICAgICAgY29uc3QgZW5kSWR4ID0gaSArIDEgPCBhbmNob3JTdGFydHMubGVuZ3RoID8gYW5jaG9yU3RhcnRzW2kgKyAxXS5pbmRleCEgOiBodG1sLmxlbmd0aDtcbiAgICAgIGFuY2hvcnMucHVzaCh7IGFwcElkLCBibG9jazogaHRtbC5zbGljZShzdGFydElkeCwgZW5kSWR4KSB9KTtcbiAgICB9XG5cbiAgICBsZXQgZm91bmRPblBhZ2UgPSAwO1xuXG4gICAgZm9yIChjb25zdCB7IGFwcElkLCBibG9jazogcm93IH0gb2YgYW5jaG9ycykge1xuICAgICAgaWYgKHNlZW4uaGFzKGFwcElkKSkgY29udGludWU7XG4gICAgICBzZWVuLmFkZChhcHBJZCk7XG5cbiAgICAgIGNvbnN0IG5hbWVNYXRjaCA9IC88c3BhbiBjbGFzcz1cInRpdGxlXCI+KFtePF0rKTxcXC9zcGFuPi8uZXhlYyhyb3cpO1xuICAgICAgaWYgKCFuYW1lTWF0Y2gpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgbmFtZSA9IG5hbWVNYXRjaFsxXS50cmltKCk7XG5cbiAgICAgIGNvbnN0IHBjdE1hdGNoID0gL2Rpc2NvdW50X3BjdFtePl0qPihbXjxdKik8Ly5leGVjKHJvdyk7XG4gICAgICBjb25zdCBvcmlnTWF0Y2ggPSAvZGlzY291bnRfb3JpZ2luYWxfcHJpY2VbXj5dKj4oW148XSopPC8uZXhlYyhyb3cpO1xuICAgICAgY29uc3QgZmluYWxNYXRjaCA9IC9kaXNjb3VudF9maW5hbF9wcmljZVtePl0qPihbXjxdKik8Ly5leGVjKHJvdyk7XG5cbiAgICAgIGNvbnN0IGRpc2NvdW50UGN0U3RyID0gcGN0TWF0Y2g/LlsxXT8udHJpbSgpLnJlcGxhY2UoL1stJV0vZywgXCJcIikgPz8gXCJcIjtcbiAgICAgIGNvbnN0IG9yaWdpbmFsUHJpY2VTdHIgPSBvcmlnTWF0Y2g/LlsxXT8udHJpbSgpID8/IFwiXCI7XG4gICAgICBjb25zdCBmaW5hbFByaWNlU3RyID0gZmluYWxNYXRjaD8uWzFdPy50cmltKCkgPz8gXCJcIjtcblxuICAgICAgY29uc3QgZGlzY291bnRQZXJjZW50ID0gcGFyc2VJbnQoZGlzY291bnRQY3RTdHIpIHx8IDA7XG4gICAgICBjb25zdCBvcmlnaW5hbENlbnRzID0gcGFyc2VTdGVhbVByaWNlKG9yaWdpbmFsUHJpY2VTdHIpO1xuICAgICAgY29uc3QgZGlzY291bnRlZENlbnRzID0gcGFyc2VTdGVhbVByaWNlKGZpbmFsUHJpY2VTdHIpO1xuXG4gICAgICBpZiAoIW9yaWdpbmFsQ2VudHMgJiYgIWRpc2NvdW50ZWRDZW50cykgY29udGludWU7XG4gICAgICBmb3VuZE9uUGFnZSsrO1xuXG4gICAgICB5aWVsZCB7XG4gICAgICAgIGlkOiBhcHBJZCxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgaW1hZ2VVcmw6IGBodHRwczovL2Nkbi5ha2FtYWkuc3RlYW1zdGF0aWMuY29tL3N0ZWFtL2FwcHMvJHthcHBJZH0vaGVhZGVyLmpwZ2AsXG4gICAgICAgIHN0b3JlVXJsOiBgaHR0cHM6Ly9zdG9yZS5zdGVhbXBvd2VyZWQuY29tL2FwcC8ke2FwcElkfS9gLFxuICAgICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJQQ1wiLFxuICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBvcmlnaW5hbENlbnRzLFxuICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGlzY291bnRlZENlbnRzID8/IG9yaWdpbmFsQ2VudHMsXG4gICAgICAgIGRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgdG90YWxDb3VudCA9IGRhdGE/LnRvdGFsX2NvdW50ID8/IDA7XG4gICAgaWYgKHN0YXJ0ICsgcGFnZVNpemUgPj0gdG90YWxDb3VudCB8fCBmb3VuZE9uUGFnZSA9PT0gMCkgYnJlYWs7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0ZWFtUHJvdmlkZXI6IFByb3ZpZGVyID0ge1xuICBwbGF0Zm9ybTogXCJzdGVhbVwiLFxuICBhc3luYyAqZmV0Y2hEZWFscyhzb3VyY2U6IFByb3ZpZGVyU291cmNlKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAgIGNvbnN0IGNjID0gQ0NfTUFQW3NvdXJjZS5yZWdpb25dO1xuICAgIGNvbnN0IGN1cnJlbmN5ID0gQ1VSUkVOQ1lfTUFQW3NvdXJjZS5yZWdpb25dO1xuICAgIGlmICghY2MgfHwgIWN1cnJlbmN5KSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcbiAgICAgICAgXCJzdGVhbVwiLFxuICAgICAgICBzb3VyY2UucmVnaW9uLFxuICAgICAgICBgUmVnaVx1MDBGM24gbm8gc29wb3J0YWRhOiAke3NvdXJjZS5yZWdpb259YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB5aWVsZCogZmV0Y2hTdGVhbURlYWxzKGNjLCBjdXJyZW5jeSwgc291cmNlLnJlZ2lvbik7XG4gIH0sXG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9uaW50ZW5kby50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvbmludGVuZG8udHNcIjtpbXBvcnQgdHlwZSB7IFByb3ZpZGVyLCBQcm92aWRlclNvdXJjZSwgUmF3RGVhbCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBQcm92aWRlckVycm9yIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuY29uc3QgQ1VSUkVOQ1lfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICB1czogXCJVU0RcIixcbiAganA6IFwiSlBZXCIsXG59O1xuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFdpdGhSZXRyeShcbiAgdXJsOiBzdHJpbmcsXG4gIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGxldCBsYXN0RXJyb3I6IHVua25vd247XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNDsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczogeyBcInVzZXItYWdlbnRcIjogVUEsIC4uLmhlYWRlcnMgfSxcbiAgICAgIH0pO1xuICAgICAgaWYgKHIuc3RhdHVzID09PSA0MDMgfHwgci5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgMTAwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxhc3RFcnJvciA9IGU7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNTAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgfVxuICB9XG4gIHRocm93IGxhc3RFcnJvcjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hKc29uKHVybDogc3RyaW5nLCBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IHIgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeSh1cmwsIHtcbiAgICBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIC4uLmhlYWRlcnMsXG4gIH0pO1xuICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfWApO1xuICByZXR1cm4gci5qc29uKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSHRtbCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHIgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeSh1cmwsIHtcbiAgICBhY2NlcHQ6IFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksKi8qO3E9MC44XCIsXG4gICAgXCJhY2NlcHQtbGFuZ3VhZ2VcIjogXCJqYVwiLFxuICB9KTtcbiAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyLnN0YXR1c31gKTtcbiAgcmV0dXJuIHIudGV4dCgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwb3N0SnNvbih1cmw6IHN0cmluZywgYm9keTogYW55LCBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IFByb21pc2U8YW55PiB7XG4gIGxldCBsYXN0RXJyb3I6IHVua25vd247XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNDsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIC4uLmhlYWRlcnMsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICAgICAgfSk7XG4gICAgICBpZiAoIXIub2spIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHIudGV4dCgpLmNhdGNoKCgpID0+IFwiXCIpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyLnN0YXR1c306ICR7dGV4dC5zbGljZSgwLCAyMDApfWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGF3YWl0IHIuanNvbigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxhc3RFcnJvciA9IGU7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNTAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgfVxuICB9XG4gIHRocm93IGxhc3RFcnJvcjtcbn1cblxuLy8gLS0tIFVTIGVTaG9wIHZpYSBBbGdvbGlhIChzYW1lIEFQSSB0aGUgTmludGVuZG8gd2Vic2l0ZSB1c2VzKSAtLS1cblxuY29uc3QgQUxHT0xJQV9BUFBfSUQgPSBcIlUzQjZHUjRVQTNcIjtcbmNvbnN0IEFMR09MSUFfQVBJX0tFWSA9IFwiYTI5YzY5Mjc2MzhiZmQ4Y2VlMjM5OTNlNTFlNzIxYzlcIjtcbmNvbnN0IEFMR09MSUFfSU5ERVggPSBcInN0b3JlX2dhbWVfZW5fdXNcIjtcblxuaW50ZXJmYWNlIEFsZ29saWFIaXQge1xuICBvYmplY3RJRDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBuc3VpZD86IHN0cmluZztcbiAgdXJsPzogc3RyaW5nO1xuICBwcm9kdWN0SW1hZ2VTcXVhcmU/OiBzdHJpbmc7XG4gIHByb2R1Y3RJbWFnZT86IHN0cmluZztcbiAgcGxhdGZvcm0/OiBzdHJpbmc7XG4gIHByaWNlPzoge1xuICAgIHJlZ1ByaWNlPzogbnVtYmVyO1xuICAgIHNhbGVQcmljZT86IG51bWJlcjtcbiAgICBwZXJjZW50T2ZmPzogbnVtYmVyO1xuICAgIGRpc2NvdW50ZWQ/OiBib29sZWFuO1xuICB9O1xuICBlc2hvcERldGFpbHM/OiB7XG4gICAgZGlzY291bnRQcmljZUVuZD86IHN0cmluZztcbiAgICBjdXJyZW5jeT86IHN0cmluZztcbiAgfTtcbn1cblxuLy8gVHJ5IG11bHRpcGxlIEFsZ29saWEgZmlsdGVyIHN0cmF0ZWdpZXM7IE5pbnRlbmRvIGRvZXNuJ3QgZG9jdW1lbnQgd2hpY2hcbi8vIGF0dHJpYnV0ZXMgYXJlIGNvbmZpZ3VyZWQgYXMgZmlsdGVyYWJsZSwgc28gd2UgY2FzY2FkZSB1bnRpbCBvbmUgd29ya3MuXG5jb25zdCBGSUxURVJfU1RSQVRFR0lFUyA9IFtcbiAgYGZhY2V0RmlsdGVycz0ke2VuY29kZVVSSUNvbXBvbmVudCgnW1tcImdlbmVyYWxGaWx0ZXJzOkRlYWxzXCJdXScpfWAsXG4gIGBmYWNldEZpbHRlcnM9JHtlbmNvZGVVUklDb21wb25lbnQoJ1tbXCJnZW5lcmFsRmlsdGVyczpPbiBzYWxlXCJdXScpfWAsXG4gIGBudW1lcmljRmlsdGVycz0ke2VuY29kZVVSSUNvbXBvbmVudCgnW1wicHJpY2UucGVyY2VudE9mZj4wXCJdJyl9YCxcbiAgXCJcIiwgLy8gbm8gZmlsdGVyIFx1MjAxNCBmZXRjaCBldmVyeXRoaW5nIGFuZCBmaWx0ZXIgaW4gY29kZVxuXTtcblxuYXN5bmMgZnVuY3Rpb24gYWxnb2xpYVF1ZXJ5KFxuICBwYXJhbXM6IHN0cmluZyxcbik6IFByb21pc2U8YW55PiB7XG4gIHJldHVybiBwb3N0SnNvbihcbiAgICBgaHR0cHM6Ly8ke0FMR09MSUFfQVBQX0lEfS1kc24uYWxnb2xpYS5uZXQvMS9pbmRleGVzLyR7QUxHT0xJQV9JTkRFWH0vcXVlcnlgLFxuICAgIHsgcGFyYW1zIH0sXG4gICAge1xuICAgICAgXCJ4LWFsZ29saWEtYXBwbGljYXRpb24taWRcIjogQUxHT0xJQV9BUFBfSUQsXG4gICAgICBcIngtYWxnb2xpYS1hcGkta2V5XCI6IEFMR09MSUFfQVBJX0tFWSxcbiAgICB9XG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmRXb3JraW5nRmlsdGVyKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGZvciAoY29uc3QgZmlsdGVyIG9mIEZJTFRFUl9TVFJBVEVHSUVTKSB7XG4gICAgY29uc3QgZXh0cmEgPSBmaWx0ZXIgPyBgJiR7ZmlsdGVyfWAgOiBcIlwiO1xuICAgIGNvbnN0IHBhcmFtcyA9IGBxdWVyeT0maGl0c1BlclBhZ2U9NSZwYWdlPTAke2V4dHJhfWA7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBhbGdvbGlhUXVlcnkocGFyYW1zKTtcbiAgICAgIGNvbnN0IG5iSGl0cyA9IGRhdGE/Lm5iSGl0cyA/PyAwO1xuICAgICAgaWYgKG5iSGl0cyA+IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtuaW50ZW5kby91c10gRmlsdGVyIE9LIChuYkhpdHM9JHtuYkhpdHN9KTogJHtmaWx0ZXIgfHwgXCIoc2luIGZpbHRybylcIn1gKTtcbiAgICAgICAgcmV0dXJuIGZpbHRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGBbbmludGVuZG8vdXNdIEZpbHRlciBtaXNzIChuYkhpdHM9MCk6ICR7ZmlsdGVyIHx8IFwiKHNpbiBmaWx0cm8pXCJ9YCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5sb2coYFtuaW50ZW5kby91c10gRmlsdGVyIGVycm9yOiAke2ZpbHRlciB8fCBcIihzaW4gZmlsdHJvKVwifSBcdTIxOTIgJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cbiAgY29uc29sZS53YXJuKFwiW25pbnRlbmRvL3VzXSBOaW5nXHUwMEZBbiBmaWx0cm8gZGUgQWxnb2xpYSBmdW5jaW9uXHUwMEYzXCIpO1xuICByZXR1cm4gXCJcIjtcbn1cblxuZnVuY3Rpb24gcGFyc2VOaW50ZW5kb0hpdChoaXQ6IEFsZ29saWFIaXQpOiBSYXdEZWFsIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gaGl0Lm5zdWlkIHx8IGhpdC5vYmplY3RJRDtcbiAgY29uc3QgbmFtZSA9IGhpdC50aXRsZTtcbiAgaWYgKCFuYW1lIHx8ICFpZCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcHJpY2UgPSBoaXQucHJpY2U7XG4gIGlmICghcHJpY2UgfHwgIXByaWNlLnNhbGVQcmljZSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcmVnUHJpY2UgPSBwcmljZS5yZWdQcmljZTtcbiAgY29uc3Qgc2FsZVByaWNlID0gcHJpY2Uuc2FsZVByaWNlO1xuXG4gIGNvbnN0IG9yaWdpbmFsQ2VudHMgPSByZWdQcmljZSAhPSBudWxsID8gTWF0aC5yb3VuZChyZWdQcmljZSAqIDEwMCkgOiBudWxsO1xuICBjb25zdCBkaXNjb3VudGVkQ2VudHMgPVxuICAgIHNhbGVQcmljZSAhPSBudWxsID8gTWF0aC5yb3VuZChzYWxlUHJpY2UgKiAxMDApIDogb3JpZ2luYWxDZW50cztcblxuICBsZXQgZGlzY291bnRQZXJjZW50ID0gcHJpY2UucGVyY2VudE9mZiA/PyAwO1xuICBpZiAoXG4gICAgIWRpc2NvdW50UGVyY2VudCAmJlxuICAgIG9yaWdpbmFsQ2VudHMgJiZcbiAgICBkaXNjb3VudGVkQ2VudHMgIT0gbnVsbCAmJlxuICAgIGRpc2NvdW50ZWRDZW50cyA8IG9yaWdpbmFsQ2VudHNcbiAgKSB7XG4gICAgZGlzY291bnRQZXJjZW50ID0gTWF0aC5yb3VuZChcbiAgICAgICgob3JpZ2luYWxDZW50cyAtIGRpc2NvdW50ZWRDZW50cykgKiAxMDApIC8gb3JpZ2luYWxDZW50c1xuICAgICk7XG4gIH1cblxuICBjb25zdCBpbWFnZVVybCA9IGhpdC5wcm9kdWN0SW1hZ2VTcXVhcmUgfHwgaGl0LnByb2R1Y3RJbWFnZSB8fCBudWxsO1xuICBjb25zdCBzdG9yZVVybCA9IGhpdC51cmxcbiAgICA/IGBodHRwczovL3d3dy5uaW50ZW5kby5jb20ke2hpdC51cmx9YFxuICAgIDogYGh0dHBzOi8vd3d3Lm5pbnRlbmRvLmNvbS91cy9zdG9yZS9wcm9kdWN0cy8ke2lkfS9gO1xuXG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgbmFtZSxcbiAgICBpbWFnZVVybCxcbiAgICBzdG9yZVVybCxcbiAgICBoYXJkd2FyZVBsYXRmb3JtczogaGl0LnBsYXRmb3JtIHx8IFwiTmludGVuZG8gU3dpdGNoXCIsXG4gICAgY3VycmVuY3k6IFwiVVNEXCIsXG4gICAgcHJpY2VPcmlnaW5hbENlbnRzOiBvcmlnaW5hbENlbnRzLFxuICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBkaXNjb3VudGVkQ2VudHMsXG4gICAgZGlzY291bnRQZXJjZW50LFxuICAgIGRpc2NvdW50RW5kQXQ6IGhpdC5lc2hvcERldGFpbHM/LmRpc2NvdW50UHJpY2VFbmQgfHwgbnVsbCxcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24qIGZldGNoTmludGVuZG9VUygpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gIGNvbnN0IGZpbHRlciA9IGF3YWl0IGZpbmRXb3JraW5nRmlsdGVyKCk7XG4gIGNvbnN0IHBhZ2VTaXplID0gNTAwO1xuICBjb25zdCBtYXhQYWdlcyA9IDUwO1xuICBsZXQgZW1pdHRlZCA9IDA7XG4gIGxldCBwYWdlc1dpdGhvdXROZXcgPSAwO1xuXG4gIGZvciAobGV0IHBhZ2UgPSAwOyBwYWdlIDwgbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgIGNvbnN0IGV4dHJhID0gZmlsdGVyID8gYCYke2ZpbHRlcn1gIDogXCJcIjtcbiAgICBjb25zdCBwYXJhbXMgPSBgcXVlcnk9JmhpdHNQZXJQYWdlPSR7cGFnZVNpemV9JnBhZ2U9JHtwYWdlfSR7ZXh0cmF9YDtcblxuICAgIGxldCBkYXRhOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIGRhdGEgPSBhd2FpdCBhbGdvbGlhUXVlcnkocGFyYW1zKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAocGFnZSA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcIm5pbnRlbmRvXCIsIFwidXNcIiwgYEFsZ29saWEgcmVxdWVzdCBmYWlsZWQ6ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBoaXRzOiBBbGdvbGlhSGl0W10gPSBkYXRhPy5oaXRzID8/IFtdO1xuICAgIGlmIChoaXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKHBhZ2UgPT09IDApIHtcbiAgICAgICAgY29uc3QgbXNnID0gZGF0YT8ubWVzc2FnZSB8fCBgMCBoaXRzIChuYkhpdHM9JHtkYXRhPy5uYkhpdHN9KWA7XG4gICAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFwibmludGVuZG9cIiwgXCJ1c1wiLCBgQWxnb2xpYSByZXR1cm5lZCBubyByZXN1bHRzOiAke21zZ31gKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGxldCBwYWdlRGVhbHMgPSAwO1xuICAgIGZvciAoY29uc3QgaGl0IG9mIGhpdHMpIHtcbiAgICAgIGNvbnN0IGRlYWwgPSBwYXJzZU5pbnRlbmRvSGl0KGhpdCk7XG4gICAgICBpZiAoZGVhbCkge1xuICAgICAgICBwYWdlRGVhbHMrKztcbiAgICAgICAgZW1pdHRlZCsrO1xuICAgICAgICB5aWVsZCBkZWFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIGZldGNoaW5nIHVuZmlsdGVyZWQgYW5kIDMgY29uc2VjdXRpdmUgcGFnZXMgaGF2ZSBubyBkZWFscywgc3RvcCBlYXJseVxuICAgIGlmICghZmlsdGVyICYmIHBhZ2VEZWFscyA9PT0gMCkge1xuICAgICAgcGFnZXNXaXRob3V0TmV3Kys7XG4gICAgICBpZiAocGFnZXNXaXRob3V0TmV3ID49IDMpIGJyZWFrO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYWdlc1dpdGhvdXROZXcgPSAwO1xuICAgIH1cblxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBkYXRhPy5uYlBhZ2VzID8/IDA7XG4gICAgaWYgKHBhZ2UgKyAxID49IHRvdGFsUGFnZXMpIGJyZWFrO1xuICB9XG5cbiAgaWYgKGVtaXR0ZWQgPT09IDApIHtcbiAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcIm5pbnRlbmRvXCIsIFwidXNcIiwgXCJObyBzZSBlbmNvbnRyYXJvbiBqdWVnb3MgZW4gb2ZlcnRhIGVuIE5pbnRlbmRvIFVTXCIpO1xuICB9XG59XG5cbi8vIC0tLSBKYXBhbiBlU2hvcCB2aWEgc3RvcmUtanAubmludGVuZG8uY29tIChTRkNDKSAtLS1cbi8vIFByaW1hcnk6IEhUTUwgc2NyYXBpbmcgb2YgdGhlIG9mZmljaWFsIHN0b3JlIGxpc3RpbmcuXG4vLyBGYWxsYmFjazogc2VhcmNoLm5pbnRlbmRvLmpwIEpTT04gQVBJLlxuXG5mdW5jdGlvbiBqcFllblRvQ2VudHMoczogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXMpIHJldHVybiBudWxsO1xuICBjb25zdCBjbGVhbmVkID0gcy5yZXBsYWNlKC9bXjAtOV0vZywgXCJcIik7XG4gIGNvbnN0IG4gPSBwYXJzZUludChjbGVhbmVkLCAxMCk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pIHx8IG4gPT09IDApIHJldHVybiBudWxsO1xuICAvLyBKUFkgaGFzIG5vIGRlY2ltYWxzOyBzdG9yZSBhcyB5ZW4gXHUwMEQ3IDEwMCBmb3IgY29uc2lzdGVuY3kgd2l0aCBvdGhlciBjdXJyZW5jaWVzXG4gIHJldHVybiBuICogMTAwO1xufVxuXG4vKiogUGFyc2UgcHJvZHVjdHMgZnJvbSB0aGUgc3RvcmUtanAubmludGVuZG8uY29tIEhUTUwgbGlzdGluZy5cbiAqICBUaGUgcGFnZSBlbWJlZHMgcHJvZHVjdCB0aWxlcyB3aXRoIHN0cnVjdHVyZWQgZGF0YSB3ZSBjYW4gcmVnZXgtZXh0cmFjdC4gKi9cbmZ1bmN0aW9uIHBhcnNlSnBTdG9yZUh0bWwoaHRtbDogc3RyaW5nKTogUmF3RGVhbFtdIHtcbiAgY29uc3QgZGVhbHM6IFJhd0RlYWxbXSA9IFtdO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgLy8gU3RyYXRlZ3kgMTogTG9vayBmb3IgSlNPTi1MRCBwcm9kdWN0IGRhdGFcbiAgY29uc3QganNvbkxkUmVnZXggPSAvPHNjcmlwdFtePl0qdHlwZT1bXCInXWFwcGxpY2F0aW9uXFwvbGRcXCtqc29uW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi9naTtcbiAgbGV0IGpzb25MZE1hdGNoO1xuICB3aGlsZSAoKGpzb25MZE1hdGNoID0ganNvbkxkUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbGQgPSBKU09OLnBhcnNlKGpzb25MZE1hdGNoWzFdKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gQXJyYXkuaXNBcnJheShsZCkgPyBsZCA6IGxkW1wiQGdyYXBoXCJdID8gbGRbXCJAZ3JhcGhcIl0gOiBbbGRdO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgIGlmIChpdGVtW1wiQHR5cGVcIl0gIT09IFwiUHJvZHVjdFwiICYmIGl0ZW1bXCJAdHlwZVwiXSAhPT0gXCJWaWRlb0dhbWVcIikgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkID0gaXRlbS5za3UgfHwgaXRlbS5wcm9kdWN0SUQgfHwgaXRlbS5pZGVudGlmaWVyO1xuICAgICAgICBpZiAoIWlkIHx8IHNlZW4uaGFzKGlkKSkgY29udGludWU7XG4gICAgICAgIHNlZW4uYWRkKGlkKTtcbiAgICAgICAgY29uc3Qgb2ZmZXIgPSBBcnJheS5pc0FycmF5KGl0ZW0ub2ZmZXJzKSA/IGl0ZW0ub2ZmZXJzWzBdIDogaXRlbS5vZmZlcnM7XG4gICAgICAgIGRlYWxzLnB1c2goe1xuICAgICAgICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSB8fCBcIlwiLFxuICAgICAgICAgIGltYWdlVXJsOiBpdGVtLmltYWdlIHx8IG51bGwsXG4gICAgICAgICAgc3RvcmVVcmw6IGl0ZW0udXJsIHx8IGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9pdGVtL3NvZnR3YXJlLyR7aWR9YCxcbiAgICAgICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgICAgICBjdXJyZW5jeTogXCJKUFlcIixcbiAgICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG51bGwsXG4gICAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGpwWWVuVG9DZW50cyhvZmZlcj8ucHJpY2UgfHwgb2ZmZXI/Lmxvd1ByaWNlKSxcbiAgICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IDAsXG4gICAgICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IC8qIGlnbm9yZSBtYWxmb3JtZWQgSlNPTi1MRCAqLyB9XG4gIH1cblxuICBpZiAoZGVhbHMubGVuZ3RoID4gMCkgcmV0dXJuIGRlYWxzO1xuXG4gIC8vIFN0cmF0ZWd5IDI6IEV4dHJhY3QgZnJvbSBlbWJlZGRlZCBfX05FWFRfREFUQV9fIG9yIHNpbWlsYXIgSlNPTiBibG9ic1xuICBjb25zdCBuZXh0RGF0YU1hdGNoID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoaHRtbCk7XG4gIGlmIChuZXh0RGF0YU1hdGNoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG5leHREYXRhTWF0Y2hbMV0pO1xuICAgICAgY29uc3QgcHJvZHVjdHMgPSBmaW5kUHJvZHVjdHNJblRyZWUoZGF0YSk7XG4gICAgICBmb3IgKGNvbnN0IHAgb2YgcHJvZHVjdHMpIHtcbiAgICAgICAgaWYgKHNlZW4uaGFzKHAuaWQpKSBjb250aW51ZTtcbiAgICAgICAgc2Vlbi5hZGQocC5pZCk7XG4gICAgICAgIGRlYWxzLnB1c2gocCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XG4gIH1cblxuICBpZiAoZGVhbHMubGVuZ3RoID4gMCkgcmV0dXJuIGRlYWxzO1xuXG4gIC8vIFN0cmF0ZWd5IDM6IFJlZ2V4IHNjcmFwZSBwcm9kdWN0IHRpbGVzIGZyb20gSFRNTFxuICAvLyBOaW50ZW5kbyBKUCBzdG9yZSB0aWxlcyB0eXBpY2FsbHkgaGF2ZSBkYXRhIGF0dHJpYnV0ZXMgb3Igc3RydWN0dXJlZCBjbGFzcyBwYXR0ZXJuc1xuICBjb25zdCB0aWxlUmVnZXggPVxuICAgIC9kYXRhLXBpZD1bXCInXShbXlwiJ10rKVtcIiddW1xcc1xcU10qPzxbXj5dKmNsYXNzPVtcIiddW15cIiddKnByb2R1Y3QtbmFtZVteXCInXSpbXCInXVtePl0qPihbXjxdKyk8W1xcc1xcU10qPyg/OmRhdGEtcHJpY2V8Y2xhc3M9W1wiJ11bXlwiJ10qcHJpY2VbXlwiJ10qW1wiJ10pW14+XSo+KFtePF0qKTwvZ2k7XG4gIGxldCB0aWxlTWF0Y2g7XG4gIHdoaWxlICgodGlsZU1hdGNoID0gdGlsZVJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgaWQgPSB0aWxlTWF0Y2hbMV0udHJpbSgpO1xuICAgIGlmICghaWQgfHwgc2Vlbi5oYXMoaWQpKSBjb250aW51ZTtcbiAgICBzZWVuLmFkZChpZCk7XG4gICAgZGVhbHMucHVzaCh7XG4gICAgICBpZCxcbiAgICAgIG5hbWU6IHRpbGVNYXRjaFsyXS50cmltKCksXG4gICAgICBpbWFnZVVybDogbnVsbCxcbiAgICAgIHN0b3JlVXJsOiBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vaXRlbS9zb2Z0d2FyZS8ke2lkfWAsXG4gICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgIGN1cnJlbmN5OiBcIkpQWVwiLFxuICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBudWxsLFxuICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGpwWWVuVG9DZW50cyh0aWxlTWF0Y2hbM10pLFxuICAgICAgZGlzY291bnRQZXJjZW50OiAwLFxuICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFN0cmF0ZWd5IDQ6IExvb2sgZm9yIGFueSBlbWJlZGRlZCBwcm9kdWN0IEpTT04gYXJyYXlzXG4gIGNvbnN0IGpzb25BcnJheVJlZ2V4ID0gL1xcWyhcXHtcIlteXCJdKmlkW15cIl0qXCJbOlxcc10qXCJbXlwiXSpcIltcXHNcXFNdKj9cXH0oPzosXFxzKlxce1tcXHNcXFNdKj9cXH0pKilcXF0vZztcbiAgbGV0IGFyck1hdGNoO1xuICB3aGlsZSAoKGFyck1hdGNoID0ganNvbkFycmF5UmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYXJyID0gSlNPTi5wYXJzZShcIltcIiArIGFyck1hdGNoWzFdICsgXCJdXCIpO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFycikge1xuICAgICAgICBjb25zdCBpZCA9IGl0ZW0uaWQgfHwgaXRlbS5uc3VpZCB8fCBpdGVtLnByb2R1Y3RJZCB8fCBpdGVtLnBpZDtcbiAgICAgICAgY29uc3QgbmFtZSA9IGl0ZW0udGl0bGUgfHwgaXRlbS5uYW1lIHx8IGl0ZW0ucHJvZHVjdE5hbWU7XG4gICAgICAgIGlmICghaWQgfHwgIW5hbWUgfHwgc2Vlbi5oYXMoU3RyaW5nKGlkKSkpIGNvbnRpbnVlO1xuICAgICAgICBzZWVuLmFkZChTdHJpbmcoaWQpKTtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBpdGVtLnNhbGVQcmljZSB8fCBpdGVtLnByaWNlIHx8IGl0ZW0uZGlzY291bnRQcmljZTtcbiAgICAgICAgY29uc3Qgb3JpZ1ByaWNlID0gaXRlbS5vcmlnaW5hbFByaWNlIHx8IGl0ZW0ucmVndWxhclByaWNlIHx8IGl0ZW0ubGlzdFByaWNlO1xuICAgICAgICBkZWFscy5wdXNoKHtcbiAgICAgICAgICBpZDogU3RyaW5nKGlkKSxcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGltYWdlVXJsOiBpdGVtLmltYWdlIHx8IGl0ZW0uaW1hZ2VVcmwgfHwgaXRlbS50aHVtYm5haWwgfHwgbnVsbCxcbiAgICAgICAgICBzdG9yZVVybDogaXRlbS51cmwgfHwgYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2l0ZW0vc29mdHdhcmUvJHtpZH1gLFxuICAgICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgICAgIGN1cnJlbmN5OiBcIkpQWVwiLFxuICAgICAgICAgIHByaWNlT3JpZ2luYWxDZW50czoganBZZW5Ub0NlbnRzKFN0cmluZyhvcmlnUHJpY2UgPz8gXCJcIikpLFxuICAgICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBqcFllblRvQ2VudHMoU3RyaW5nKHByaWNlID8/IFwiXCIpKSxcbiAgICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IHBhcnNlSW50KGl0ZW0uZGlzY291bnRSYXRlIHx8IGl0ZW0uZGlzY291bnRQZXJjZW50IHx8IFwiMFwiKSB8fCAwLFxuICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyAvKiBub3QgdmFsaWQgSlNPTiBhcnJheSAqLyB9XG4gIH1cblxuICByZXR1cm4gZGVhbHM7XG59XG5cbmZ1bmN0aW9uIGZpbmRQcm9kdWN0c0luVHJlZShub2RlOiB1bmtub3duLCByZXN1bHRzOiBSYXdEZWFsW10gPSBbXSk6IFJhd0RlYWxbXSB7XG4gIGlmICghbm9kZSB8fCB0eXBlb2Ygbm9kZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHJlc3VsdHM7XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSB7XG4gICAgZm9yIChjb25zdCB2IG9mIG5vZGUpIGZpbmRQcm9kdWN0c0luVHJlZSh2LCByZXN1bHRzKTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBjb25zdCBvYmogPSBub2RlIGFzIFJlY29yZDxzdHJpbmcsIGFueT47XG4gIGNvbnN0IGlkID0gb2JqLm5zdWlkIHx8IG9iai5pZCB8fCBvYmoucHJvZHVjdElkO1xuICBjb25zdCBuYW1lID0gb2JqLnRpdGxlIHx8IG9iai5uYW1lO1xuICBjb25zdCBoYXNQcmljZSA9IG9iai5wcmljZSAhPSBudWxsIHx8IG9iai5zYWxlUHJpY2UgIT0gbnVsbCB8fCBvYmoucmVndWxhclByaWNlICE9IG51bGw7XG4gIGlmIChpZCAmJiBuYW1lICYmIGhhc1ByaWNlKSB7XG4gICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgICAgbmFtZTogU3RyaW5nKG5hbWUpLFxuICAgICAgaW1hZ2VVcmw6IG9iai5pbWFnZSB8fCBvYmouaW1hZ2VVcmwgfHwgbnVsbCxcbiAgICAgIHN0b3JlVXJsOiBvYmoudXJsIHx8IGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9pdGVtL3NvZnR3YXJlLyR7aWR9YCxcbiAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgY3VycmVuY3k6IFwiSlBZXCIsXG4gICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGpwWWVuVG9DZW50cyhTdHJpbmcob2JqLnJlZ3VsYXJQcmljZSA/PyBvYmoub3JpZ2luYWxQcmljZSA/PyBvYmoucHJpY2UgPz8gXCJcIikpLFxuICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGpwWWVuVG9DZW50cyhTdHJpbmcob2JqLnNhbGVQcmljZSA/PyBvYmouZGlzY291bnRQcmljZSA/PyBvYmoucHJpY2UgPz8gXCJcIikpLFxuICAgICAgZGlzY291bnRQZXJjZW50OiBwYXJzZUludChvYmouZGlzY291bnRSYXRlIHx8IG9iai5kaXNjb3VudFBlcmNlbnQgfHwgXCIwXCIpIHx8IDAsXG4gICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgIH0pO1xuICB9XG4gIGZvciAoY29uc3QgdiBvZiBPYmplY3QudmFsdWVzKG9iaikpIGZpbmRQcm9kdWN0c0luVHJlZSh2LCByZXN1bHRzKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaE5pbnRlbmRvSlBfU3RvcmUoKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICBjb25zdCBtYXhQYWdlcyA9IDUwO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vbGlzdC9zb2Z0d2FyZWAgK1xuICAgICAgYD9zb2Z0VHlwZT1USVRMRSZpc1NhbGU9dHJ1ZSZzcnVsZT1tb3N0LXBvcHVsYXImcGFnZT0ke3BhZ2V9YDtcblxuICAgIGxldCBodG1sOiBzdHJpbmc7XG4gICAgdHJ5IHtcbiAgICAgIGh0bWwgPSBhd2FpdCBmZXRjaEh0bWwodXJsKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGRlYWxzID0gcGFyc2VKcFN0b3JlSHRtbChodG1sKTtcbiAgICBsZXQgbmV3T25QYWdlID0gMDtcbiAgICBmb3IgKGNvbnN0IGRlYWwgb2YgZGVhbHMpIHtcbiAgICAgIGlmIChzZWVuLmhhcyhkZWFsLmlkKSkgY29udGludWU7XG4gICAgICBzZWVuLmFkZChkZWFsLmlkKTtcbiAgICAgIG5ld09uUGFnZSsrO1xuXG4gICAgICBpZiAoXG4gICAgICAgIGRlYWwucHJpY2VPcmlnaW5hbENlbnRzICYmXG4gICAgICAgIGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMgJiZcbiAgICAgICAgZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cyA8IGRlYWwucHJpY2VPcmlnaW5hbENlbnRzICYmXG4gICAgICAgICFkZWFsLmRpc2NvdW50UGVyY2VudFxuICAgICAgKSB7XG4gICAgICAgIGRlYWwuZGlzY291bnRQZXJjZW50ID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAoKGRlYWwucHJpY2VPcmlnaW5hbENlbnRzIC0gZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cykgKiAxMDApIC9cbiAgICAgICAgICAgIGRlYWwucHJpY2VPcmlnaW5hbENlbnRzXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHlpZWxkIGRlYWw7XG4gICAgfVxuXG4gICAgaWYgKG5ld09uUGFnZSA9PT0gMCkgYnJlYWs7XG4gIH1cbn1cblxuLyoqIEZhbGxiYWNrOiBzZWFyY2gubmludGVuZG8uanAgSlNPTiBBUEkgKi9cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaE5pbnRlbmRvSlBfU2VhcmNoQXBpKCk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgY29uc3QgcGFnZVNpemUgPSAzMDA7XG4gIGxldCBzdGFydCA9IDA7XG4gIGNvbnN0IG1heEl0ZW1zID0gNjAwMDtcblxuICB3aGlsZSAoc3RhcnQgPCBtYXhJdGVtcykge1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9zZWFyY2gubmludGVuZG8uanAvbmludGVuZG9fc29mdC9zZWFyY2guanNvbmAgK1xuICAgICAgYD9vcHRfc3Nob3c9MSZmcT1zc2l0dV9zOm9uc2FsZStoYXJkX3M6MV9IQUNgICtcbiAgICAgIGAmcm93cz0ke3BhZ2VTaXplfSZzdGFydD0ke3N0YXJ0fSZzb3J0PXNjb3JlK2Rlc2NgO1xuXG4gICAgbGV0IGRhdGE6IGFueTtcbiAgICB0cnkge1xuICAgICAgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgZG9jcyA9IGRhdGE/LnJlc3VsdD8uaXRlbXMgPz8gW107XG4gICAgaWYgKGRvY3MubGVuZ3RoID09PSAwKSBicmVhaztcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBkb2NzKSB7XG4gICAgICBjb25zdCBpZCA9IGl0ZW0ubnN1aWQgfHwgaXRlbS5pZDtcbiAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLnRpdGxlO1xuICAgICAgaWYgKCFuYW1lIHx8ICFpZCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IG9yaWdpbmFsQ2VudHMgPSBqcFllblRvQ2VudHMoaXRlbS5wcHJpKTtcbiAgICAgIGNvbnN0IGRpc2NvdW50ZWRDZW50cyA9IGpwWWVuVG9DZW50cyhpdGVtLnNwcmkpID8/IG9yaWdpbmFsQ2VudHM7XG5cbiAgICAgIGxldCBkaXNjb3VudFBlcmNlbnQgPSBwYXJzZUludChpdGVtLmRzcGVyKSB8fCAwO1xuICAgICAgaWYgKFxuICAgICAgICAhZGlzY291bnRQZXJjZW50ICYmXG4gICAgICAgIG9yaWdpbmFsQ2VudHMgJiZcbiAgICAgICAgZGlzY291bnRlZENlbnRzICE9IG51bGwgJiZcbiAgICAgICAgZGlzY291bnRlZENlbnRzIDwgb3JpZ2luYWxDZW50c1xuICAgICAgKSB7XG4gICAgICAgIGRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAgICAgKChvcmlnaW5hbENlbnRzIC0gZGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBvcmlnaW5hbENlbnRzXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmICghb3JpZ2luYWxDZW50cyAmJiAhZGlzY291bnRlZENlbnRzKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgaW1hZ2VVcmwgPSBpdGVtLml1cmwgfHwgbnVsbDtcbiAgICAgIGNvbnN0IHN0b3JlVXJsID1cbiAgICAgICAgaXRlbS5zc2x1cmwgfHxcbiAgICAgICAgYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2l0ZW0vc29mdHdhcmUvJHtpZH1gO1xuXG4gICAgICB5aWVsZCB7XG4gICAgICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgICAgICBuYW1lLFxuICAgICAgICBpbWFnZVVybCxcbiAgICAgICAgc3RvcmVVcmwsXG4gICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgICBjdXJyZW5jeTogXCJKUFlcIixcbiAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBvcmlnaW5hbENlbnRzLFxuICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGlzY291bnRlZENlbnRzLFxuICAgICAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHN0YXJ0ICs9IHBhZ2VTaXplO1xuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBkYXRhPy5yZXN1bHQ/LnRvdGFsID8/IDA7XG4gICAgaWYgKHN0YXJ0ID49IHRvdGFsQ291bnQpIGJyZWFrO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaE5pbnRlbmRvSlAoKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAvLyBUcnkgdGhlIG9mZmljaWFsIHN0b3JlIGZpcnN0LCBmYWxsIGJhY2sgdG8gc2VhcmNoIEFQSVxuICBsZXQgY291bnQgPSAwO1xuICB0cnkge1xuICAgIGZvciBhd2FpdCAoY29uc3QgZGVhbCBvZiBmZXRjaE5pbnRlbmRvSlBfU3RvcmUoKSkge1xuICAgICAgY291bnQrKztcbiAgICAgIHlpZWxkIGRlYWw7XG4gICAgfVxuICB9IGNhdGNoIHsgLyogc3RvcmUgc2NyYXBlIGZhaWxlZCAqLyB9XG5cbiAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgLy8gRmFsbGJhY2sgdG8gc2VhcmNoIEFQSVxuICAgIHlpZWxkKiBmZXRjaE5pbnRlbmRvSlBfU2VhcmNoQXBpKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IG5pbnRlbmRvUHJvdmlkZXI6IFByb3ZpZGVyID0ge1xuICBwbGF0Zm9ybTogXCJuaW50ZW5kb1wiLFxuICBhc3luYyAqZmV0Y2hEZWFscyhzb3VyY2U6IFByb3ZpZGVyU291cmNlKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAgIGNvbnN0IGN1cnJlbmN5ID0gQ1VSUkVOQ1lfTUFQW3NvdXJjZS5yZWdpb25dO1xuICAgIGlmICghY3VycmVuY3kpIHtcbiAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFxuICAgICAgICBcIm5pbnRlbmRvXCIsXG4gICAgICAgIHNvdXJjZS5yZWdpb24sXG4gICAgICAgIGBSZWdpXHUwMEYzbiBubyBzb3BvcnRhZGE6ICR7c291cmNlLnJlZ2lvbn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2UucmVnaW9uID09PSBcInVzXCIpIHtcbiAgICAgIHlpZWxkKiBmZXRjaE5pbnRlbmRvVVMoKTtcbiAgICB9IGVsc2UgaWYgKHNvdXJjZS5yZWdpb24gPT09IFwianBcIikge1xuICAgICAgeWllbGQqIGZldGNoTmludGVuZG9KUCgpO1xuICAgIH1cbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL2luZGV4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9pbmRleC50c1wiO2V4cG9ydCB0eXBlIHsgUGxhdGZvcm0sIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsLCBSZWdpb25Db25maWcgfSBmcm9tIFwiLi90eXBlc1wiO1xuZXhwb3J0IHsgUExBVEZPUk1fTEFCRUxTLCBQTEFURk9STV9SRUdJT05TLCBQcm92aWRlckVycm9yIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuaW1wb3J0IHR5cGUgeyBQbGF0Zm9ybSwgUHJvdmlkZXIgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgcHNuUHJvdmlkZXIgfSBmcm9tIFwiLi9wc25cIjtcbmltcG9ydCB7IHhib3hQcm92aWRlciB9IGZyb20gXCIuL3hib3hcIjtcbmltcG9ydCB7IHN0ZWFtUHJvdmlkZXIgfSBmcm9tIFwiLi9zdGVhbVwiO1xuaW1wb3J0IHsgbmludGVuZG9Qcm92aWRlciB9IGZyb20gXCIuL25pbnRlbmRvXCI7XG5cbmNvbnN0IFBST1ZJREVSUzogUmVjb3JkPFBsYXRmb3JtLCBQcm92aWRlcj4gPSB7XG4gIHBzbjogcHNuUHJvdmlkZXIsXG4gIHhib3g6IHhib3hQcm92aWRlcixcbiAgc3RlYW06IHN0ZWFtUHJvdmlkZXIsXG4gIG5pbnRlbmRvOiBuaW50ZW5kb1Byb3ZpZGVyLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3ZpZGVyKHBsYXRmb3JtOiBQbGF0Zm9ybSk6IFByb3ZpZGVyIHtcbiAgcmV0dXJuIFBST1ZJREVSU1twbGF0Zm9ybV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxQcm92aWRlcnMoKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBPYmplY3QudmFsdWVzKFBST1ZJREVSUyk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9leGNoYW5nZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9leGNoYW5nZS50c1wiOy8qKlxuICogRXhjaGFuZ2UgcmF0ZSBmZXRjaGVyIHZpYSBtaW5kaWNhZG9yLmNsIChDaGlsZWFuIHB1YmxpYyBBUEksIG5vIGF1dGggbmVlZGVkKS5cbiAqIEZldGNoZXMgdGhlIGxhdGVzdCBvYnNlcnZlZCB2YWx1ZXMgZm9yIFVTRCwgQlJMLCBhbmQgVFJZIFx1MjE5MiBDTFAuXG4gKi9cblxuaW50ZXJmYWNlIE1pbmRpY2Fkb3JTZXJpZSB7XG4gIGNvZGlnbzogc3RyaW5nO1xuICBub21icmU6IHN0cmluZztcbiAgdW5pZGFkX21lZGlkYTogc3RyaW5nO1xuICBzZXJpZTogQXJyYXk8eyBmZWNoYTogc3RyaW5nOyB2YWxvcjogbnVtYmVyIH0+O1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEluZGljYWRvcihjb2RpZ286IHN0cmluZyk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9taW5kaWNhZG9yLmNsL2FwaS8ke2NvZGlnb31gO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHsgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiwgXCJ1c2VyLWFnZW50XCI6IFwiYXBpcHNuLzEuMFwiIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBkYXRhID0gKGF3YWl0IHIuanNvbigpKSBhcyBNaW5kaWNhZG9yU2VyaWU7XG4gICAgY29uc3QgdmFsdWUgPSBkYXRhPy5zZXJpZT8uWzBdPy52YWxvcjtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgPyB2YWx1ZSA6IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhjaGFuZ2VSYXRlcyB7XG4gIHVzZFRvQ2xwOiBudW1iZXIgfCBudWxsO1xuICBicmxUb0NscDogbnVtYmVyIHwgbnVsbDtcbiAgdHJ5VG9DbHA6IG51bWJlciB8IG51bGw7XG4gIGZldGNoZWRBdDogc3RyaW5nO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hFeGNoYW5nZVJhdGVzKCk6IFByb21pc2U8RXhjaGFuZ2VSYXRlcz4ge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBGZXRjaCBVU0QgXHUyMTkyIENMUCBkaXJlY3RseVxuICBjb25zdCB1c2QgPSBhd2FpdCBmZXRjaEluZGljYWRvcihcImRvbGFyXCIpO1xuICBpZiAodXNkID09IG51bGwpIGVycm9ycy5wdXNoKFwiVVNEIG5vIGRpc3BvbmlibGUgZW4gbWluZGljYWRvci5jbFwiKTtcblxuICAvLyBCUkwgXHUyMTkyIENMUDogZmV0Y2ggQlJML1VTRCByYXRlIGZyb20gYSBmcmVlIGV4Y2hhbmdlIHJhdGUgZW5kcG9pbnRcbiAgLy8gbWluZGljYWRvci5jbCBkb2Vzbid0IGhhdmUgQlJMIGRpcmVjdGx5LCBzbyBhcHByb3hpbWF0ZSB2aWEgVVNEXG4gIC8vIEJSTC9VU0QgXHUyMjQ4IG1pbmRpY2Fkb3IgZG9lc24ndCBjYXJyeSB0aGlzLiBXZSBmYWxsIGJhY2sgdG8gdGhlIHVzZXItY29uZmlndXJlZCB2YWx1ZS5cbiAgLy8gRm9yIFRSWSwgc2FtZSBzaXR1YXRpb24uIE9ubHkgVVNEIGlzIHJlbGlhYmx5IGF2YWlsYWJsZSBmcm9tIG1pbmRpY2Fkb3IuY2wuXG5cbiAgcmV0dXJuIHtcbiAgICB1c2RUb0NscDogdXNkLFxuICAgIGJybFRvQ2xwOiBudWxsLFxuICAgIHRyeVRvQ2xwOiBudWxsLFxuICAgIGZldGNoZWRBdDogbm93LFxuICAgIGVycm9ycyxcbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3NjaGVkdWxlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9zY2hlZHVsZXIudHNcIjsvKipcbiAqIE9wdGlvbmFsIHBlcmlvZGljIHJlZnJlc2ggc2NoZWR1bGVyLiBEaXNhYmxlZCBieSBkZWZhdWx0LlxuICogRW5hYmxlZC9kaXNhYmxlZCB2aWEgc3RvcmUgc2V0dGluZ3MgKGF1dG9SZWZyZXNoSW50ZXJ2YWxIb3VycyA9IDAgbWVhbnMgb2ZmKS5cbiAqL1xuaW1wb3J0IHsgc3RvcmUgfSBmcm9tIFwiLi9zdG9yZVwiO1xuXG50eXBlIFJlZnJlc2hGbiA9ICgpID0+IFByb21pc2U8dm9pZD47XG5cbmxldCB0aW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0QXV0b1JlZnJlc2hBdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0QXV0b1JlZnJlc2hBdCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgcmV0dXJuIGxhc3RBdXRvUmVmcmVzaEF0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRTY2hlZHVsZXIocmVmcmVzaEZuOiBSZWZyZXNoRm4pOiB2b2lkIHtcbiAgcmVzY2hlZHVsZShyZWZyZXNoRm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzY2hlZHVsZShyZWZyZXNoRm46IFJlZnJlc2hGbik6IHZvaWQge1xuICBpZiAodGltZXIpIHtcbiAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICB0aW1lciA9IG51bGw7XG4gIH1cblxuICBjb25zdCBpbnRlcnZhbEhvdXJzID0gc3RvcmUuZ2V0QXV0b1JlZnJlc2hJbnRlcnZhbCgpO1xuICBpZiAoIWludGVydmFsSG91cnMgfHwgaW50ZXJ2YWxIb3VycyA8PSAwKSByZXR1cm47XG5cbiAgY29uc3QgbXMgPSBpbnRlcnZhbEhvdXJzICogNjAgKiA2MCAqIDEwMDA7XG4gIHRpbWVyID0gc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCByZWZyZXNoRm4oKTtcbiAgICAgIGxhc3RBdXRvUmVmcmVzaEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gU2NoZWR1bGVyIGVycm9ycyBhcmUgbm9uLWZhdGFsXG4gICAgfVxuICB9LCBtcyk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcy1wbHVzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3BzLXBsdXMudHNcIjsvKipcbiAqIFBTIFBsdXMgbWVtYmVyc2hpcCBwcmljZSB0cmFja2VyIFx1MjAxNCBtdWx0aS1yZWdpb24uXG4gKlxuICogVHJhY2tzIFBTIFBsdXMgU0tVcyBhY3Jvc3MgVVMsIEJSLCBhbmQgVFIgcmVnaW9ucyB3aXRoOlxuICogICAtIFByaWNlcyBzY3JhcGVkIGZyb20gcGxheXN0YXRpb24uY29tICh3aXRoIGhhcmRjb2RlZCBmYWxsYmFja3MpXG4gKiAgIC0gRXN0aW1hdGVkIENMUCBjb3N0IHVzaW5nIGNvbmZpZ3VyZWQgZXhjaGFuZ2UgcmF0ZXMgKyBwdXJjaGFzZSBmZWVcbiAqICAgLSBDb21wZXRpdG9yIHByaWNlcyAoZnV6enktbWF0Y2hlZCBmcm9tIGV4aXN0aW5nIGNvbXBldGl0b3IgcHJvZHVjdHMpXG4gKi9cbmltcG9ydCB7IHRva2VuaXplLCBzaW1pbGFyaXR5IH0gZnJvbSBcIi4vY29tcGV0aXRvcnNcIjtcbmltcG9ydCB0eXBlIHsgQ29tcGV0aXRvclByb2R1Y3QsIENvbXBldGl0b3JNYXRjaCB9IGZyb20gXCIuL2NvbXBldGl0b3JzXCI7XG5pbXBvcnQgdHlwZSB7IFByaWNpbmdTZXR0aW5ncyB9IGZyb20gXCIuL3N0b3JlXCI7XG5cbmV4cG9ydCB0eXBlIFBsdXNUaWVyID0gXCJlc3NlbnRpYWxcIiB8IFwiZXh0cmFcIiB8IFwicHJlbWl1bVwiO1xuZXhwb3J0IHR5cGUgUGx1c0R1cmF0aW9uID0gXCIxbVwiIHwgXCIzbVwiIHwgXCIxMm1cIjtcbmV4cG9ydCB0eXBlIFBsdXNSZWdpb24gPSBcInVzXCIgfCBcImJyXCIgfCBcInRyXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGx1c1JlZ2lvblByaWNlIHtcbiAgcmVnaW9uOiBQbHVzUmVnaW9uO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBwcmljZTogbnVtYmVyO1xuICBwcmljZUNscDogbnVtYmVyIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQbHVzUGxhbiB7XG4gIHRpZXI6IFBsdXNUaWVyO1xuICBkdXJhdGlvbjogUGx1c0R1cmF0aW9uO1xuICBsYWJlbDogc3RyaW5nO1xuICByZWdpb25QcmljZXM6IFBsdXNSZWdpb25QcmljZVtdO1xuICBjaGVhcGVzdFJlZ2lvbjogUGx1c1JlZ2lvbiB8IG51bGw7XG4gIGNoZWFwZXN0Q2xwOiBudW1iZXIgfCBudWxsO1xuICBzZWFyY2hUZXJtczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGx1c1BsYW5XaXRoTWF0Y2hlcyBleHRlbmRzIFBsdXNQbGFuIHtcbiAgY29tcGV0aXRvck1hdGNoZXM6IENvbXBldGl0b3JNYXRjaFtdO1xuICBiZXN0UHJpY2U6IG51bWJlciB8IG51bGw7XG4gIGJlc3RTdG9yZTogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTY3JhcGVkUGx1c1ByaWNlcyB7XG4gIC8qKiByZWdpb24gXHUyMTkyIHRpZXIgXHUyMTkyIGR1cmF0aW9uIFx1MjE5MiBwcmljZSBpbiBsb2NhbCBjdXJyZW5jeSAqL1xuICBwcmljZXM6IFJlY29yZDxQbHVzUmVnaW9uLCBSZWNvcmQ8UGx1c1RpZXIsIFJlY29yZDxQbHVzRHVyYXRpb24sIG51bWJlcj4+PjtcbiAgc2NyYXBlZEF0OiBzdHJpbmc7XG4gIGVycm9yczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBQbGFuRGVmIHtcbiAgdGllcjogUGx1c1RpZXI7XG4gIGR1cmF0aW9uOiBQbHVzRHVyYXRpb247XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHNlYXJjaFRlcm1zOiBzdHJpbmdbXTtcbn1cblxuY29uc3QgUExBTl9ERUZTOiBQbGFuRGVmW10gPSBbXG4gIHsgdGllcjogXCJlc3NlbnRpYWxcIiwgZHVyYXRpb246IFwiMW1cIiwgIGxhYmVsOiBcIlBTIFBsdXMgRXNzZW50aWFsIFx1MjAxNCAxIE1lc1wiLCAgICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBlc3NlbnRpYWwgMSBtZXNcIiwgXCJwcyBwbHVzIGVzc2VudGlhbCAxIG1lc1wiLCBcInBzIHBsdXMgZXNzZW50aWFsIDEgbW9udGhcIiwgXCJwc24gcGx1cyBlc3NlbnRpYWwgbWVuc3VhbFwiXSB9LFxuICB7IHRpZXI6IFwiZXNzZW50aWFsXCIsIGR1cmF0aW9uOiBcIjNtXCIsICBsYWJlbDogXCJQUyBQbHVzIEVzc2VudGlhbCBcdTIwMTQgMyBNZXNlc1wiLCAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgZXNzZW50aWFsIDMgbWVzZXNcIiwgXCJwcyBwbHVzIGVzc2VudGlhbCAzIG1lc2VzXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgMyBtb250aFwiLCBcInBzbiBwbHVzIGVzc2VudGlhbCB0cmltZXN0cmFsXCJdIH0sXG4gIHsgdGllcjogXCJlc3NlbnRpYWxcIiwgZHVyYXRpb246IFwiMTJtXCIsIGxhYmVsOiBcIlBTIFBsdXMgRXNzZW50aWFsIFx1MjAxNCAxMiBNZXNlc1wiLCBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBlc3NlbnRpYWwgMTIgbWVzZXNcIiwgXCJwcyBwbHVzIGVzc2VudGlhbCAxMiBtZXNlc1wiLCBcInBzIHBsdXMgZXNzZW50aWFsIDEgYVx1MDBGMW9cIiwgXCJwcyBwbHVzIGVzc2VudGlhbCBhbnVhbFwiLCBcInBzIHBsdXMgZXNzZW50aWFsIDEgeWVhclwiXSB9LFxuICB7IHRpZXI6IFwiZXh0cmFcIiwgICAgIGR1cmF0aW9uOiBcIjFtXCIsICBsYWJlbDogXCJQUyBQbHVzIEV4dHJhIFx1MjAxNCAxIE1lc1wiLCAgICAgICAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgZXh0cmEgMSBtZXNcIiwgXCJwcyBwbHVzIGV4dHJhIDEgbWVzXCIsIFwicHMgcGx1cyBleHRyYSAxIG1vbnRoXCJdIH0sXG4gIHsgdGllcjogXCJleHRyYVwiLCAgICAgZHVyYXRpb246IFwiM21cIiwgIGxhYmVsOiBcIlBTIFBsdXMgRXh0cmEgXHUyMDE0IDMgTWVzZXNcIiwgICAgICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBleHRyYSAzIG1lc2VzXCIsIFwicHMgcGx1cyBleHRyYSAzIG1lc2VzXCIsIFwicHMgcGx1cyBleHRyYSAzIG1vbnRoXCJdIH0sXG4gIHsgdGllcjogXCJleHRyYVwiLCAgICAgZHVyYXRpb246IFwiMTJtXCIsIGxhYmVsOiBcIlBTIFBsdXMgRXh0cmEgXHUyMDE0IDEyIE1lc2VzXCIsICAgICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBleHRyYSAxMiBtZXNlc1wiLCBcInBzIHBsdXMgZXh0cmEgMTIgbWVzZXNcIiwgXCJwcyBwbHVzIGV4dHJhIDEgYVx1MDBGMW9cIiwgXCJwcyBwbHVzIGV4dHJhIGFudWFsXCJdIH0sXG4gIHsgdGllcjogXCJwcmVtaXVtXCIsICAgZHVyYXRpb246IFwiMW1cIiwgIGxhYmVsOiBcIlBTIFBsdXMgUHJlbWl1bSBcdTIwMTQgMSBNZXNcIiwgICAgICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBwcmVtaXVtIDEgbWVzXCIsIFwicHMgcGx1cyBwcmVtaXVtIDEgbWVzXCIsIFwicHMgcGx1cyBwcmVtaXVtIDEgbW9udGhcIl0gfSxcbiAgeyB0aWVyOiBcInByZW1pdW1cIiwgICBkdXJhdGlvbjogXCIzbVwiLCAgbGFiZWw6IFwiUFMgUGx1cyBQcmVtaXVtIFx1MjAxNCAzIE1lc2VzXCIsICAgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIHByZW1pdW0gMyBtZXNlc1wiLCBcInBzIHBsdXMgcHJlbWl1bSAzIG1lc2VzXCIsIFwicHMgcGx1cyBwcmVtaXVtIDMgbW9udGhcIl0gfSxcbiAgeyB0aWVyOiBcInByZW1pdW1cIiwgICBkdXJhdGlvbjogXCIxMm1cIiwgbGFiZWw6IFwiUFMgUGx1cyBQcmVtaXVtIFx1MjAxNCAxMiBNZXNlc1wiLCAgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIHByZW1pdW0gMTIgbWVzZXNcIiwgXCJwcyBwbHVzIHByZW1pdW0gMTIgbWVzZXNcIiwgXCJwcyBwbHVzIHByZW1pdW0gMSBhXHUwMEYxb1wiLCBcInBzIHBsdXMgcHJlbWl1bSBhbnVhbFwiXSB9LFxuXTtcblxuLy8gRmFsbGJhY2sgcHJpY2VzIGlmIHNjcmFwaW5nIGZhaWxzIChsYXN0IGtub3duIGdvb2QgdmFsdWVzKVxuY29uc3QgRkFMTEJBQ0tfUFJJQ0VTOiBSZWNvcmQ8UGx1c1JlZ2lvbiwgUmVjb3JkPFBsdXNUaWVyLCBSZWNvcmQ8UGx1c0R1cmF0aW9uLCBudW1iZXI+Pj4gPSB7XG4gIHVzOiB7XG4gICAgZXNzZW50aWFsOiB7IFwiMW1cIjogOS45OSwgIFwiM21cIjogMjQuOTksICBcIjEybVwiOiA3OS45OSB9LFxuICAgIGV4dHJhOiAgICAgeyBcIjFtXCI6IDE0Ljk5LCBcIjNtXCI6IDM5Ljk5LCAgXCIxMm1cIjogMTM0Ljk5IH0sXG4gICAgcHJlbWl1bTogICB7IFwiMW1cIjogMTcuOTksIFwiM21cIjogNDkuOTksICBcIjEybVwiOiAxNTkuOTkgfSxcbiAgfSxcbiAgYnI6IHtcbiAgICBlc3NlbnRpYWw6IHsgXCIxbVwiOiAzNC45MCwgIFwiM21cIjogODkuOTAsICAgXCIxMm1cIjogMTk5LjkwIH0sXG4gICAgZXh0cmE6ICAgICB7IFwiMW1cIjogNTIuOTAsICBcIjNtXCI6IDEzOS45MCwgIFwiMTJtXCI6IDMzOS45MCB9LFxuICAgIHByZW1pdW06ICAgeyBcIjFtXCI6IDU5LjkwLCAgXCIzbVwiOiAxNjUuOTAsICBcIjEybVwiOiAzOTkuOTAgfSxcbiAgfSxcbiAgdHI6IHtcbiAgICBlc3NlbnRpYWw6IHsgXCIxbVwiOiAxMzAsICBcIjNtXCI6IDM0MCwgICBcIjEybVwiOiA5MDAgfSxcbiAgICBleHRyYTogICAgIHsgXCIxbVwiOiAyMDAsICBcIjNtXCI6IDUzMCwgICBcIjEybVwiOiAxNDAwIH0sXG4gICAgcHJlbWl1bTogICB7IFwiMW1cIjogMjUwLCAgXCIzbVwiOiA2NTAsICAgXCIxMm1cIjogMTcwMCB9LFxuICB9LFxufTtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuY29uc3QgUkVHSU9OX0xPQ0FMRTogUmVjb3JkPFBsdXNSZWdpb24sIHN0cmluZz4gPSB7XG4gIHVzOiBcImVuLXVzXCIsXG4gIGJyOiBcInB0LWJyXCIsXG4gIHRyOiBcImVuLXRyXCIsXG59O1xuXG5jb25zdCBSRUdJT05fQ1VSUkVOQ1k6IFJlY29yZDxQbHVzUmVnaW9uLCBzdHJpbmc+ID0ge1xuICB1czogXCJVU0RcIixcbiAgYnI6IFwiQlJMXCIsXG4gIHRyOiBcIlRSWVwiLFxufTtcblxuY29uc3QgUkVHSU9OX0xBQkVMUzogUmVjb3JkPFBsdXNSZWdpb24sIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTXCIsXG4gIGJyOiBcIkJyYXNpbFwiLFxuICB0cjogXCJUdXJxdVx1MDBFRGFcIixcbn07XG5cbmV4cG9ydCB7IFJFR0lPTl9MQUJFTFMgYXMgUExVU19SRUdJT05fTEFCRUxTIH07XG5cbmNvbnN0IFRJRVJfT1JERVI6IFBsdXNUaWVyW10gPSBbXCJlc3NlbnRpYWxcIiwgXCJleHRyYVwiLCBcInByZW1pdW1cIl07XG5jb25zdCBEVVJBVElPTl9PUkRFUjogUGx1c0R1cmF0aW9uW10gPSBbXCIxbVwiLCBcIjNtXCIsIFwiMTJtXCJdO1xuXG4vLyAtLS0gU2NyYXBlciAtLS1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hQc1BsdXNQYWdlKHJlZ2lvbjogUGx1c1JlZ2lvbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGxvY2FsZSA9IFJFR0lPTl9MT0NBTEVbcmVnaW9uXTtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vd3d3LnBsYXlzdGF0aW9uLmNvbS8ke2xvY2FsZX0vcHMtcGx1cy9gO1xuICBsZXQgbGFzdEVycjogdW5rbm93biA9IG51bGw7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMzsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBhY2NlcHQ6IFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksKi8qO3E9MC44XCIsXG4gICAgICAgICAgXCJhY2NlcHQtbGFuZ3VhZ2VcIjogcmVnaW9uID09PSBcImJyXCIgPyBcInB0LUJSLHB0O3E9MC45XCIgOiBcImVuLVVTLGVuO3E9MC45XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgRXJyb3IoYDQwMyBGb3JiaWRkZW4gKCR7dXJsfSlgKTtcbiAgICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9ICgke3VybH0pYCk7XG4gICAgICByZXR1cm4gYXdhaXQgci50ZXh0KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVyciA9IGU7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNTAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIFBTIFBsdXMgcGFnZSBmb3IgJHtyZWdpb259OiAkeyhsYXN0RXJyIGFzIEVycm9yKT8ubWVzc2FnZSB8fCBsYXN0RXJyfWApO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0TmV4dERhdGEoaHRtbDogc3RyaW5nKTogYW55IHwgbnVsbCB7XG4gIGNvbnN0IG0gPSAvPHNjcmlwdFtePl0qaWQ9W1wiJ11fX05FWFRfREFUQV9fW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi8uZXhlYyhodG1sKTtcbiAgaWYgKCFtKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShtWzFdKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VQcmljZShyYXc6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXJhdykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNsZWFuZWQgPSByYXcucmVwbGFjZSgvW15cXGQuLF0vZywgXCJcIik7XG4gIGlmICghY2xlYW5lZCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHBhcnRzID0gY2xlYW5lZC5zcGxpdCgvWy4sXS8pO1xuICBpZiAocGFydHMubGVuZ3RoIDw9IDEpIHtcbiAgICByZXR1cm4gTnVtYmVyKGNsZWFuZWQpIHx8IG51bGw7XG4gIH1cbiAgY29uc3QgbGFzdFBhcnQgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXTtcbiAgaWYgKGxhc3RQYXJ0Lmxlbmd0aCA8PSAyKSB7XG4gICAgY29uc3QgaW50UGFydCA9IHBhcnRzLnNsaWNlKDAsIC0xKS5qb2luKFwiXCIpO1xuICAgIHJldHVybiBOdW1iZXIoYCR7aW50UGFydH0uJHtsYXN0UGFydH1gKSB8fCBudWxsO1xuICB9XG4gIHJldHVybiBOdW1iZXIocGFydHMuam9pbihcIlwiKSkgfHwgbnVsbDtcbn1cblxuY29uc3QgVElFUl9QQVRURVJOUzogUmVjb3JkPFBsdXNUaWVyLCBSZWdFeHA+ID0ge1xuICBlc3NlbnRpYWw6IC9lc3NlbnRpYWwvaSxcbiAgZXh0cmE6IC9leHRyYS9pLFxuICBwcmVtaXVtOiAvcHJlbWl1bXxkZWx1eGUvaSxcbn07XG5cbmNvbnN0IERVUkFUSU9OX1BBVFRFUk5TOiBSZWNvcmQ8UGx1c0R1cmF0aW9uLCBSZWdFeHA+ID0ge1xuICBcIjFtXCI6IC9cXGIxXFxzKig/Om1vbnRofG1lc3xtKD86XHUwMEVBfGUpc3xheSlcXGIvaSxcbiAgXCIzbVwiOiAvXFxiM1xccyooPzptb250aHxtZXN8bSg/Olx1MDBFQXxlKXN8bWVzZXN8YXkpXFxiL2ksXG4gIFwiMTJtXCI6IC9cXGIoPzoxMlxccyooPzptb250aHxtZXN8bSg/Olx1MDBFQXxlKXN8bWVzZXN8YXkpfDFcXHMqKD86eWVhcnxhXHUwMEYxb3xhbm8pKVxcYi9pLFxufTtcblxuZnVuY3Rpb24gY2xhc3NpZnlUaWVyKHRleHQ6IHN0cmluZyk6IFBsdXNUaWVyIHwgbnVsbCB7XG4gIGZvciAoY29uc3QgdCBvZiBUSUVSX09SREVSKSB7XG4gICAgaWYgKFRJRVJfUEFUVEVSTlNbdF0udGVzdCh0ZXh0KSkgcmV0dXJuIHQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNsYXNzaWZ5RHVyYXRpb24odGV4dDogc3RyaW5nKTogUGx1c0R1cmF0aW9uIHwgbnVsbCB7XG4gIGZvciAoY29uc3QgZCBvZiBEVVJBVElPTl9PUkRFUikge1xuICAgIGlmIChEVVJBVElPTl9QQVRURVJOU1tkXS50ZXN0KHRleHQpKSByZXR1cm4gZDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gd2Fsa0ZvclByaWNlcyhcbiAgbm9kZTogdW5rbm93bixcbiAgcmVzdWx0czogTWFwPHN0cmluZywgbnVtYmVyPixcbiAgZGVwdGggPSAwXG4pOiB2b2lkIHtcbiAgaWYgKGRlcHRoID4gMzAgfHwgIW5vZGUpIHJldHVybjtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygbm9kZSkgd2Fsa0ZvclByaWNlcyhpdGVtLCByZXN1bHRzLCBkZXB0aCArIDEpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodHlwZW9mIG5vZGUgIT09IFwib2JqZWN0XCIpIHJldHVybjtcbiAgY29uc3Qgb2JqID0gbm9kZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcblxuICBjb25zdCBuYW1lID0gU3RyaW5nKG9iai5uYW1lIHx8IG9iai50aXRsZSB8fCBvYmoubGFiZWwgfHwgb2JqLnBsYW5OYW1lIHx8IFwiXCIpO1xuICBjb25zdCBwcmljZVN0ciA9IFN0cmluZyhcbiAgICBvYmoucHJpY2UgfHwgb2JqLmZvcm1hdHRlZFByaWNlIHx8IG9iai5kaXNwbGF5UHJpY2UgfHxcbiAgICBvYmouYmFzZVByaWNlIHx8IG9iai5iYXNlUHJpY2VWYWx1ZSB8fCBcIlwiXG4gICk7XG5cbiAgaWYgKG5hbWUgJiYgcHJpY2VTdHIpIHtcbiAgICBjb25zdCB0aWVyID0gY2xhc3NpZnlUaWVyKG5hbWUpO1xuICAgIGNvbnN0IGR1ciA9IGNsYXNzaWZ5RHVyYXRpb24obmFtZSk7XG4gICAgaWYgKHRpZXIgJiYgZHVyKSB7XG4gICAgICBjb25zdCBwcmljZSA9IHBhcnNlUHJpY2UocHJpY2VTdHIpO1xuICAgICAgaWYgKHByaWNlICYmIHByaWNlID4gMCkge1xuICAgICAgICBjb25zdCBrZXkgPSBgJHt0aWVyfToke2R1cn1gO1xuICAgICAgICBpZiAoIXJlc3VsdHMuaGFzKGtleSkpIHJlc3VsdHMuc2V0KGtleSwgcHJpY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgdiBvZiBPYmplY3QudmFsdWVzKG9iaikpIHtcbiAgICB3YWxrRm9yUHJpY2VzKHYsIHJlc3VsdHMsIGRlcHRoICsgMSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEZyb21IdG1sRmFsbGJhY2soXG4gIGh0bWw6IHN0cmluZyxcbiAgcmVnaW9uOiBQbHVzUmVnaW9uXG4pOiBNYXA8c3RyaW5nLCBudW1iZXI+IHtcbiAgY29uc3QgcmVzdWx0cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgY29uc3QgcHJpY2VSZSA9IHJlZ2lvbiA9PT0gXCJiclwiXG4gICAgPyAvUlxcJFxccyooW1xcZC4sXSspL2dcbiAgICA6IHJlZ2lvbiA9PT0gXCJ0clwiXG4gICAgPyAvKD86XHUyMEJBfFRMfFRSWSlcXHMqKFtcXGQuLF0rKS9nXG4gICAgOiAvXFwkXFxzKihbXFxkLixdKykvZztcblxuICBjb25zdCBzZWN0aW9ucyA9IGh0bWwuc3BsaXQoLyg/PWVzc2VudGlhbHxleHRyYXxwcmVtaXVtKS9naSk7XG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgIGNvbnN0IHRpZXIgPSBjbGFzc2lmeVRpZXIoc2VjdGlvbi5zbGljZSgwLCAyMDApKTtcbiAgICBpZiAoIXRpZXIpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZHVyQmxvY2tzID0gc2VjdGlvbi5zcGxpdCgvKD89XFxiKD86MXwzfDEyKVxccyooPzptb250aHxtZXN8bVtcdTAwRUFlXXN8YXl8eWVhcnxhXHUwMEYxb3xhbm8pKS9naSk7XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBkdXJCbG9ja3MpIHtcbiAgICAgIGNvbnN0IGR1ciA9IGNsYXNzaWZ5RHVyYXRpb24oYmxvY2suc2xpY2UoMCwgMTAwKSk7XG4gICAgICBpZiAoIWR1cikgY29udGludWU7XG5cbiAgICAgIGNvbnN0IG1hdGNoID0gcHJpY2VSZS5leGVjKGJsb2NrKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBjb25zdCBwcmljZSA9IHBhcnNlUHJpY2UobWF0Y2hbMV0pO1xuICAgICAgICBpZiAocHJpY2UgJiYgcHJpY2UgPiAwKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0gYCR7dGllcn06JHtkdXJ9YDtcbiAgICAgICAgICBpZiAoIXJlc3VsdHMuaGFzKGtleSkpIHJlc3VsdHMuc2V0KGtleSwgcHJpY2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwcmljZVJlLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBwYXJzZVBzUGx1c0h0bWwoXG4gIGh0bWw6IHN0cmluZyxcbiAgcmVnaW9uOiBQbHVzUmVnaW9uXG4pOiBSZWNvcmQ8UGx1c1RpZXIsIFJlY29yZDxQbHVzRHVyYXRpb24sIG51bWJlcj4+IHwgbnVsbCB7XG4gIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgbnVtYmVyPj4gPSB7fTtcblxuICBjb25zdCBuZXh0RGF0YSA9IGV4dHJhY3ROZXh0RGF0YShodG1sKTtcbiAgbGV0IGZvdW5kID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBpZiAobmV4dERhdGEpIHtcbiAgICB3YWxrRm9yUHJpY2VzKG5leHREYXRhLCBmb3VuZCk7XG4gIH1cblxuICBpZiAoZm91bmQuc2l6ZSA8IDkpIHtcbiAgICBjb25zdCBodG1sRmFsbGJhY2sgPSBleHRyYWN0RnJvbUh0bWxGYWxsYmFjayhodG1sLCByZWdpb24pO1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIGh0bWxGYWxsYmFjaykge1xuICAgICAgaWYgKCFmb3VuZC5oYXMoaykpIGZvdW5kLnNldChrLCB2KTtcbiAgICB9XG4gIH1cblxuICBpZiAoZm91bmQuc2l6ZSA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgZm9yIChjb25zdCBba2V5LCBwcmljZV0gb2YgZm91bmQpIHtcbiAgICBjb25zdCBbdGllciwgZHVyXSA9IGtleS5zcGxpdChcIjpcIik7XG4gICAgaWYgKCFyZXN1bHRbdGllcl0pIHJlc3VsdFt0aWVyXSA9IHt9O1xuICAgIHJlc3VsdFt0aWVyXVtkdXJdID0gcHJpY2U7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0IGFzIFJlY29yZDxQbHVzVGllciwgUmVjb3JkPFBsdXNEdXJhdGlvbiwgbnVtYmVyPj47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzY3JhcGVQc1BsdXNQcmljZXMoKTogUHJvbWlzZTxTY3JhcGVkUGx1c1ByaWNlcz4ge1xuICBjb25zdCByZWdpb25zOiBQbHVzUmVnaW9uW10gPSBbXCJ1c1wiLCBcImJyXCIsIFwidHJcIl07XG4gIGNvbnN0IHByaWNlcyA9IHN0cnVjdHVyZWRDbG9uZShGQUxMQkFDS19QUklDRVMpO1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCByZWdpb24gb2YgcmVnaW9ucykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBodG1sID0gYXdhaXQgZmV0Y2hQc1BsdXNQYWdlKHJlZ2lvbik7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVBzUGx1c0h0bWwoaHRtbCwgcmVnaW9uKTtcbiAgICAgIGlmIChwYXJzZWQpIHtcbiAgICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgICAgZm9yIChjb25zdCB0aWVyIG9mIFRJRVJfT1JERVIpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGR1ciBvZiBEVVJBVElPTl9PUkRFUikge1xuICAgICAgICAgICAgaWYgKHBhcnNlZFt0aWVyXT8uW2R1cl0pIHtcbiAgICAgICAgICAgICAgcHJpY2VzW3JlZ2lvbl1bdGllcl1bZHVyXSA9IHBhcnNlZFt0aWVyXVtkdXJdO1xuICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChgJHtyZWdpb24udG9VcHBlckNhc2UoKX06IHBcdTAwRTFnaW5hIGNhcmdhZGEgcGVybyBubyBzZSBlbmNvbnRyYXJvbiBwcmVjaW9zLCB1c2FuZG8gdmFsb3JlcyBkZSByZXNwYWxkb2ApO1xuICAgICAgICB9IGVsc2UgaWYgKGNvdW50IDwgOSkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKGAke3JlZ2lvbi50b1VwcGVyQ2FzZSgpfTogc29sbyAke2NvdW50fS85IHByZWNpb3MgZXh0cmFcdTAwRURkb3MsIGVsIHJlc3RvIHVzYSByZXNwYWxkb2ApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvcnMucHVzaChgJHtyZWdpb24udG9VcHBlckNhc2UoKX06IG5vIHNlIHB1ZG8gcGFyc2VhciBsYSBwXHUwMEUxZ2luYSwgdXNhbmRvIHZhbG9yZXMgZGUgcmVzcGFsZG9gKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnJvcnMucHVzaChgJHtyZWdpb24udG9VcHBlckNhc2UoKX06ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgcHJpY2VzLCBzY3JhcGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSwgZXJyb3JzIH07XG59XG5cbi8vIC0tLSBQcmljZSBjb21wdXRhdGlvbiAtLS1cblxuY29uc3QgUExVU19NQVRDSF9USFJFU0hPTEQgPSAwLjQ1O1xuXG5mdW5jdGlvbiBiZXN0TWF0Y2hTY29yZShzZWFyY2hUZXJtczogc3RyaW5nW10sIHByb2R1Y3RUaXRsZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgcHJvZHVjdFRva2VucyA9IHRva2VuaXplKHByb2R1Y3RUaXRsZSk7XG4gIGlmICghcHJvZHVjdFRva2Vucy5sZW5ndGgpIHJldHVybiAwO1xuICBsZXQgYmVzdCA9IDA7XG4gIGZvciAoY29uc3QgdGVybSBvZiBzZWFyY2hUZXJtcykge1xuICAgIGNvbnN0IHRlcm1Ub2tlbnMgPSB0b2tlbml6ZSh0ZXJtKTtcbiAgICBpZiAoIXRlcm1Ub2tlbnMubGVuZ3RoKSBjb250aW51ZTtcbiAgICBjb25zdCBzY29yZSA9IHNpbWlsYXJpdHkodGVybVRva2VucywgcHJvZHVjdFRva2Vucyk7XG4gICAgaWYgKHNjb3JlID4gYmVzdCkgYmVzdCA9IHNjb3JlO1xuICB9XG4gIHJldHVybiBiZXN0O1xufVxuXG5mdW5jdGlvbiB0b0NscChwcmljZTogbnVtYmVyLCBjdXJyZW5jeTogc3RyaW5nLCBjZmc6IFByaWNpbmdTZXR0aW5ncyk6IG51bWJlciB7XG4gIGxldCByYXRlOiBudW1iZXI7XG4gIGxldCBkaXNjb3VudDogbnVtYmVyO1xuICBzd2l0Y2ggKGN1cnJlbmN5KSB7XG4gICAgY2FzZSBcIkJSTFwiOiByYXRlID0gY2ZnLmJybFRvQ2xwOyBkaXNjb3VudCA9IGNmZy5iYWxhbmNlRGlzY291bnRCcmwgPz8gMS4wOyBicmVhaztcbiAgICBjYXNlIFwiVFJZXCI6IHJhdGUgPSBjZmcudHJ5VG9DbHA7IGRpc2NvdW50ID0gY2ZnLmJhbGFuY2VEaXNjb3VudFRyeSA/PyAxLjA7IGJyZWFrO1xuICAgIGRlZmF1bHQ6ICAgIHJhdGUgPSBjZmcudXNkVG9DbHA7IGRpc2NvdW50ID0gY2ZnLmJhbGFuY2VEaXNjb3VudFVzZCA/PyAxLjA7IGJyZWFrO1xuICB9XG4gIHJldHVybiBNYXRoLnJvdW5kKHByaWNlICogZGlzY291bnQgKiByYXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoUGxhbnNXaXRoQ29tcGV0aXRvcnMoXG4gIHByb2R1Y3RzOiBDb21wZXRpdG9yUHJvZHVjdFtdLFxuICBjZmc6IFByaWNpbmdTZXR0aW5ncyxcbiAgc2NyYXBlZD86IFNjcmFwZWRQbHVzUHJpY2VzIHwgbnVsbFxuKTogUGx1c1BsYW5XaXRoTWF0Y2hlc1tdIHtcbiAgY29uc3QgcHJpY2VEYXRhID0gc2NyYXBlZD8ucHJpY2VzID8/IEZBTExCQUNLX1BSSUNFUztcblxuICByZXR1cm4gUExBTl9ERUZTLm1hcCgoZGVmKSA9PiB7XG4gICAgY29uc3QgcmVnaW9uczogUGx1c1JlZ2lvbltdID0gW1widXNcIiwgXCJiclwiLCBcInRyXCJdO1xuICAgIGNvbnN0IHJlZ2lvblByaWNlczogUGx1c1JlZ2lvblByaWNlW10gPSByZWdpb25zLm1hcCgocikgPT4ge1xuICAgICAgY29uc3QgY3VycmVuY3kgPSBSRUdJT05fQ1VSUkVOQ1lbcl07XG4gICAgICBjb25zdCBwcmljZSA9IHByaWNlRGF0YVtyXT8uW2RlZi50aWVyXT8uW2RlZi5kdXJhdGlvbl0gPz8gRkFMTEJBQ0tfUFJJQ0VTW3JdW2RlZi50aWVyXVtkZWYuZHVyYXRpb25dO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVnaW9uOiByLFxuICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgcHJpY2UsXG4gICAgICAgIHByaWNlQ2xwOiB0b0NscChwcmljZSwgY3VycmVuY3ksIGNmZyksXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgbGV0IGNoZWFwZXN0UmVnaW9uOiBQbHVzUmVnaW9uIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGNoZWFwZXN0Q2xwOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBmb3IgKGNvbnN0IHJwIG9mIHJlZ2lvblByaWNlcykge1xuICAgICAgaWYgKHJwLnByaWNlQ2xwICE9IG51bGwgJiYgKGNoZWFwZXN0Q2xwID09IG51bGwgfHwgcnAucHJpY2VDbHAgPCBjaGVhcGVzdENscCkpIHtcbiAgICAgICAgY2hlYXBlc3RDbHAgPSBycC5wcmljZUNscDtcbiAgICAgICAgY2hlYXBlc3RSZWdpb24gPSBycC5yZWdpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbWF0Y2hlczogQ29tcGV0aXRvck1hdGNoW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgcHJvZHVjdHMpIHtcbiAgICAgIGNvbnN0IHNjb3JlID0gYmVzdE1hdGNoU2NvcmUoZGVmLnNlYXJjaFRlcm1zLCBwLnRpdGxlKTtcbiAgICAgIGlmIChzY29yZSA+PSBQTFVTX01BVENIX1RIUkVTSE9MRCkge1xuICAgICAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgICAgIHN0b3JlS2V5OiBwLnN0b3JlS2V5LFxuICAgICAgICAgIHRpdGxlOiBwLnRpdGxlLFxuICAgICAgICAgIHVybDogcC51cmwsXG4gICAgICAgICAgcHJpY2VDbHA6IHAucHJpY2VDbHAsXG4gICAgICAgICAgYXZhaWxhYmxlOiBwLmF2YWlsYWJsZSxcbiAgICAgICAgICBzY29yZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIG1hdGNoZXMuc29ydCgoYSwgYikgPT4gYS5wcmljZUNscCAtIGIucHJpY2VDbHApO1xuICAgIGNvbnN0IHRvcCA9IG1hdGNoZXMuc2xpY2UoMCwgOCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGllcjogZGVmLnRpZXIsXG4gICAgICBkdXJhdGlvbjogZGVmLmR1cmF0aW9uLFxuICAgICAgbGFiZWw6IGRlZi5sYWJlbCxcbiAgICAgIHJlZ2lvblByaWNlcyxcbiAgICAgIGNoZWFwZXN0UmVnaW9uLFxuICAgICAgY2hlYXBlc3RDbHAsXG4gICAgICBzZWFyY2hUZXJtczogZGVmLnNlYXJjaFRlcm1zLFxuICAgICAgY29tcGV0aXRvck1hdGNoZXM6IHRvcCxcbiAgICAgIGJlc3RQcmljZTogdG9wLmxlbmd0aCA/IHRvcFswXS5wcmljZUNscCA6IG51bGwsXG4gICAgICBiZXN0U3RvcmU6IHRvcC5sZW5ndGggPyB0b3BbMF0uc3RvcmVLZXkgOiBudWxsLFxuICAgIH07XG4gIH0pO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvYXBpLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL2FwaS50c1wiOy8qKlxuICogTWluaW1hbCBIVFRQIHJvdXRlciBmb3IgdGhlIC9hcGkvKiBuYW1lc3BhY2UuIFVzZXMgb25seSBub2RlOmh0dHAgdHlwZXMgc29cbiAqIHdlIGRvbid0IG5lZWQgRXhwcmVzcyBhcyBhIGRlcGVuZGVuY3kuXG4gKlxuICogUm91dGVzOlxuICogICBHRVQgICAgL2dhbWVzICAgICAgICAgICAgICAgICAgICAgIGxpc3Qgd2l0aCBjb21wdXRlZCBDTFAgcHJpY2VzXG4gKiAgIFBBVENIICAvZ2FtZXMvOmlkICAgICAgICAgICAgICAgICAgeyBzZWxlY3RlZD8sIHB1Ymxpc2hlZD8sIG5vdGVzPyB9XG4gKiAgIFBPU1QgICAvcmVmcmVzaCAgICAgICAgICAgICAgICAgICAgc2NyYXBlIFBTTiBhbmQgdXBzZXJ0XG4gKiAgIEdFVCAgICAvZ2FtZXMvZXhwb3J0LmNzdiAgICAgICAgICAgQ1NWIG9mIHNlbGVjdGVkIGdhbWVzXG4gKiAgIEdFVCAgICAvc2V0dGluZ3MgICAgICAgICAgICAgICAgICAgcHJpY2luZyArIHBzbiBjb25maWdcbiAqICAgUFVUICAgIC9zZXR0aW5ncyAgICAgICAgICAgICAgICAgICBwYXJ0aWFsIHVwZGF0ZSAocHJpY2luZyBhbmQvb3IgcHNuKVxuICogICBQT1NUICAgL21vY2svY2xlYXIgICAgICAgICAgICAgICAgIGRlYWN0aXZhdGUgYWxsIGdhbWVzXG4gKi9cbmltcG9ydCB0eXBlIHsgSW5jb21pbmdNZXNzYWdlLCBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gXCJub2RlOmh0dHBcIjtcbmltcG9ydCB7IHN0b3JlLCB0eXBlIEdhbWUsIHR5cGUgV2F0Y2hlZEdhbWUsIHR5cGUgU3VwYWJhc2VDb25maWcgfSBmcm9tIFwiLi9zdG9yZVwiO1xuaW1wb3J0IHsgY29tcHV0ZVNhbGVQcmljZXMgfSBmcm9tIFwiLi9wcmljaW5nXCI7XG5pbXBvcnQge1xuICBpbnNwZWN0UHJvZHVjdFR5cGVzLFxuICBQZXJzaXN0ZWRRdWVyeU5vdEZvdW5kRXJyb3IsXG4gIFBzbkFwaUVycm9yLFxufSBmcm9tIFwiLi9wc25cIjtcbmltcG9ydCB7XG4gIGZldGNoQ29tcGV0aXRvcixcbiAgbWF0Y2hHYW1lcyxcbiAgQ29tcGV0aXRvckZldGNoRXJyb3IsXG4gIHRva2VuaXplLFxuICBzaW1pbGFyaXR5LFxuICB0eXBlIENvbXBldGl0b3JDb25maWcsXG4gIHR5cGUgQ29tcGV0aXRvck1hdGNoLFxufSBmcm9tIFwiLi9jb21wZXRpdG9yc1wiO1xuaW1wb3J0IHsgZmV0Y2hQcm9kdWN0RGV0YWlsIH0gZnJvbSBcIi4vcHNuLXByb2R1Y3RcIjtcbmltcG9ydCB7XG4gIGdldFByb3ZpZGVyLFxuICBQTEFURk9STV9MQUJFTFMsXG4gIFBMQVRGT1JNX1JFR0lPTlMsXG4gIFByb3ZpZGVyRXJyb3IsXG59IGZyb20gXCIuL3Byb3ZpZGVycy9pbmRleFwiO1xuaW1wb3J0IHR5cGUgeyBQbGF0Zm9ybSwgUHJvdmlkZXJTb3VyY2UgfSBmcm9tIFwiLi9wcm92aWRlcnMvdHlwZXNcIjtcbmltcG9ydCB7IGZldGNoRXhjaGFuZ2VSYXRlcyB9IGZyb20gXCIuL2V4Y2hhbmdlXCI7XG5pbXBvcnQgeyBnZXRMYXN0QXV0b1JlZnJlc2hBdCwgcmVzY2hlZHVsZSwgc3RhcnRTY2hlZHVsZXIgfSBmcm9tIFwiLi9zY2hlZHVsZXJcIjtcbmltcG9ydCB7IG1hdGNoUGxhbnNXaXRoQ29tcGV0aXRvcnMsIHNjcmFwZVBzUGx1c1ByaWNlcyB9IGZyb20gXCIuL3BzLXBsdXNcIjtcbmltcG9ydCB0eXBlIHsgU2NyYXBlZFBsdXNQcmljZXMgfSBmcm9tIFwiLi9wcy1wbHVzXCI7XG5cbi8qKiBFeHRyYWN0IGEgUFNOIHByb2R1Y3QgaWQgZnJvbSBhIHN0b3JlIFVSTC4gQWNjZXB0cyBib3RoIGVuLVVTIGFuZCBvdGhlclxuICogIGxvY2FsZXMsIGFuZCB0b2xlcmF0ZXMgdHJhaWxpbmcgc2VnbWVudHMgLyBxdWVyeSBzdHJpbmdzLiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBzbklkKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgcyA9IFN0cmluZyhpbnB1dCB8fCBcIlwiKS50cmltKCk7XG4gIGlmICghcykgcmV0dXJuIG51bGw7XG4gIC8vIEFscmVhZHkgYW4gaWQgKFVQWFhYWC1DVVNBWFhYWFhfMDAtXHUyMDI2IG9yIEVQXHUyMDI2IC8gVUNcdTIwMjYpXG4gIGlmICgvXltBLVpdezJ9WzAtOV17NH0tW0EtWjAtOV0rX1swLTldezJ9KD86LVtBLVowLTldKyk/JC8udGVzdChzKSkgcmV0dXJuIHM7XG4gIGNvbnN0IG0gPSAvXFwvcHJvZHVjdFxcLyhbQS1aXXsyfVswLTldezR9LVtBLVowLTldK19bMC05XXsyfSg/Oi1bQS1aMC05XSspPykvaS5leGVjKFxuICAgIHNcbiAgKTtcbiAgcmV0dXJuIG0gPyBtWzFdLnRvVXBwZXJDYXNlKCkgOiBudWxsO1xufVxuXG5pbnRlcmZhY2UgV2F0Y2hsaXN0QWxlcnQge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGRpc2NvdW50UGVyY2VudDogbnVtYmVyO1xuICBwcmljZURpc2NvdW50ZWRVc2Q6IG51bWJlciB8IG51bGw7XG4gIHN0b3JlVXJsOiBzdHJpbmcgfCBudWxsO1xufVxuXG4vKiogRGlmZiB0aGUgd2F0Y2hsaXN0IGFnYWluc3QgdGhlIGZyZXNoIHNjcmFwZSBhbmQgZmxhZyB0cmFuc2l0aW9ucy4gVXBkYXRlc1xuICogIGVhY2ggd2F0Y2hlZCBlbnRyeSdzIGxhc3RTdGF0dXMgaW4gcGxhY2UuIFJldHVybnMgdGhlIGxpc3Qgb2YgZ2FtZXMgdGhhdFxuICogIHRyYW5zaXRpb25lZCBvZmZfc2FsZSBcdTIxOTIgb25fc2FsZSB0aGlzIHJ1bi4gKi9cbmZ1bmN0aW9uIGRpZmZXYXRjaGxpc3Qoc2VlbjogU2V0PHN0cmluZz4sIG5vd0lzbzogc3RyaW5nKTogV2F0Y2hsaXN0QWxlcnRbXSB7XG4gIGNvbnN0IGFsZXJ0czogV2F0Y2hsaXN0QWxlcnRbXSA9IFtdO1xuICBmb3IgKGNvbnN0IHcgb2Ygc3RvcmUubGlzdFdhdGNobGlzdCgpKSB7XG4gICAgY29uc3QgZ2FtZSA9IHN0b3JlLmdldEdhbWUody5pZCk7XG4gICAgY29uc3QgaW5TYWxlTm93ID1cbiAgICAgICEhZ2FtZSAmJiBnYW1lLmFjdGl2ZSAmJiBnYW1lLmRpc2NvdW50UGVyY2VudCA+IDAgJiYgc2Vlbi5oYXMody5pZCk7XG4gICAgY29uc3QgdHJhbnNpdGlvbmVkID0gaW5TYWxlTm93ICYmIHcubGFzdFN0YXR1cyAhPT0gXCJvbl9zYWxlXCI7XG5cbiAgICBpZiAodHJhbnNpdGlvbmVkICYmIGdhbWUpIHtcbiAgICAgIGFsZXJ0cy5wdXNoKHtcbiAgICAgICAgaWQ6IHcuaWQsXG4gICAgICAgIG5hbWU6IGdhbWUubmFtZSxcbiAgICAgICAgZGlzY291bnRQZXJjZW50OiBnYW1lLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgcHJpY2VEaXNjb3VudGVkVXNkOlxuICAgICAgICAgIGdhbWUucHJpY2VEaXNjb3VudGVkQ2VudHMgIT0gbnVsbFxuICAgICAgICAgICAgPyBnYW1lLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwXG4gICAgICAgICAgICA6IG51bGwsXG4gICAgICAgIHN0b3JlVXJsOiBnYW1lLnN0b3JlVXJsLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RvcmUucGF0Y2hXYXRjaGVkKHcuaWQsIHtcbiAgICAgIG5hbWU6IGdhbWU/Lm5hbWUgfHwgdy5uYW1lLFxuICAgICAgbGFzdFN0YXR1czogaW5TYWxlTm93ID8gXCJvbl9zYWxlXCIgOiB3Lmxhc3RTdGF0dXMgPT09IFwidW5zZWVuXCIgPyBcInVuc2VlblwiIDogXCJvZmZfc2FsZVwiLFxuICAgICAgbGFzdFNlZW5PblNhbGVBdDogaW5TYWxlTm93ID8gbm93SXNvIDogdy5sYXN0U2Vlbk9uU2FsZUF0LFxuICAgICAgbGFzdFByaWNlQ2VudHM6IGdhbWU/LnByaWNlRGlzY291bnRlZENlbnRzID8/IHcubGFzdFByaWNlQ2VudHMsXG4gICAgICBsYXN0RGlzY291bnRQZXJjZW50OiBnYW1lPy5kaXNjb3VudFBlcmNlbnQgPz8gdy5sYXN0RGlzY291bnRQZXJjZW50LFxuICAgIH0pO1xuICB9XG4gIHJldHVybiBhbGVydHM7XG59XG5cbnR5cGUgSGFuZGxlciA9IChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSwgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA9PiBQcm9taXNlPHZvaWQ+O1xuXG5pbnRlcmZhY2UgUm91dGUge1xuICBtZXRob2Q6IHN0cmluZztcbiAgcGF0dGVybjogUmVnRXhwO1xuICBrZXlzOiBzdHJpbmdbXTtcbiAgaGFuZGxlcjogSGFuZGxlcjtcbn1cblxuY29uc3Qgcm91dGVzOiBSb3V0ZVtdID0gW107XG5cbmZ1bmN0aW9uIHJvdXRlKG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGhhbmRsZXI6IEhhbmRsZXIpIHtcbiAgY29uc3Qga2V5czogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgXCJeXCIgK1xuICAgICAgcGF0aC5yZXBsYWNlKC86KFthLXpBLVpfXSspL2csIChfLCBrKSA9PiB7XG4gICAgICAgIGtleXMucHVzaChrKTtcbiAgICAgICAgcmV0dXJuIFwiKFteL10rKVwiO1xuICAgICAgfSkgK1xuICAgICAgXCIkXCJcbiAgKTtcbiAgcm91dGVzLnB1c2goeyBtZXRob2QsIHBhdHRlcm4sIGtleXMsIGhhbmRsZXIgfSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRKc29uKHJlczogU2VydmVyUmVzcG9uc2UsIHN0YXR1czogbnVtYmVyLCBib2R5OiB1bmtub3duKSB7XG4gIHJlcy5zdGF0dXNDb2RlID0gc3RhdHVzO1xuICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShib2R5KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRCb2R5KHJlcTogSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTxhbnk+IHtcbiAgY29uc3QgY2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xuICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlcSkgY2h1bmtzLnB1c2goY2h1bmsgYXMgQnVmZmVyKTtcbiAgY29uc3QgcmF3ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKFwidXRmLThcIik7XG4gIGlmICghcmF3KSByZXR1cm4ge307XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmF3KTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGdhbWVEYktleShnOiBHYW1lKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2cucGxhdGZvcm19OiR7Zy5yZWdpb259OiR7Zy5pZH1gO1xufVxuXG4vKiogU2F2ZSBwcm9kdWN0IGRldGFpbC4gRG9lcyBOT1Qgb3ZlcndyaXRlIGltYWdlVXJsIFx1MjAxNCB0aGUgdGlsZSBpbWFnZVxuICogIGV4dHJhY3RlZCBmcm9tIHRoZSBIVE1MIGdyaWQgKDQ0MFx1MDBENzQ0MCkgaXMgdGhlIGNvcnJlY3QgY292ZXIgYXJ0LiAqL1xuZnVuY3Rpb24gc2F2ZURldGFpbEFuZFVwZGF0ZUltYWdlKGdhbWU6IEdhbWUsIGRldGFpbDogaW1wb3J0KFwiLi9wc24tcHJvZHVjdFwiKS5Qcm9kdWN0RGV0YWlsKTogdm9pZCB7XG4gIHN0b3JlLnNldFByb2R1Y3REZXRhaWwoZ2FtZS5pZCwgZGV0YWlsKTtcbn1cblxuY29uc3QgQUREX09OX1BBVFRFUk4gPSAvXFxiKGRsY3xzZWFzb24gcGFzc3xhdmF0YXJ8dGhlbWV8Y3VycmVuY3kgcGFja3xjb2luIHBhY2t8cG9pbnQgcGFjaylcXGIvaTtcbmNvbnN0IFBSRU1JVU1fRURJVElPTiA9IC9cXGIoZGVsdXhlfHVsdGltYXRlfGNvbXBsZXRlfGdvdHl8Z2FtZSBvZiB0aGUgeWVhcnxkaWdpdGFsIGVkaXRpb258bGF1bmNoIGVkaXRpb24pXFxiL2k7XG5cbmZ1bmN0aW9uIGNvbXB1dGVIaXRTY29yZShnOiBHYW1lKTogbnVtYmVyIHtcbiAgLy8gTm8gZGlzY291bnQgPSBub3QgdmlhYmxlIGZvciByZXNhbGVcbiAgaWYgKGcuZGlzY291bnRQZXJjZW50IDw9IDApIHJldHVybiAwO1xuXG4gIGxldCBzY29yZSA9IDA7XG4gIGNvbnN0IHByaWNlVXNkID0gKGcucHJpY2VPcmlnaW5hbENlbnRzID8/IDApIC8gMTAwO1xuXG4gIC8vIEFBQSBwcmljZSB0aWVyXG4gIGlmIChwcmljZVVzZCA+PSA2MCkgc2NvcmUgKz0gMzA7XG4gIGVsc2UgaWYgKHByaWNlVXNkID49IDQwKSBzY29yZSArPSAyMDtcbiAgZWxzZSBpZiAocHJpY2VVc2QgPj0gMjApIHNjb3JlICs9IDEwO1xuXG4gIC8vIERpc2NvdW50IGRlcHRoXG4gIGlmIChnLmRpc2NvdW50UGVyY2VudCA+PSA0MCkgc2NvcmUgKz0gMjU7XG4gIGVsc2UgaWYgKGcuZGlzY291bnRQZXJjZW50ID49IDI1KSBzY29yZSArPSAxNTtcbiAgZWxzZSBpZiAoZy5kaXNjb3VudFBlcmNlbnQgPiAwKSBzY29yZSArPSA1O1xuXG4gIC8vIEtub3duIHB1Ymxpc2hlciAoZnJvbSBlbnJpY2hlZCBwcm9kdWN0IGRldGFpbClcbiAgY29uc3QgZGV0YWlsID0gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKTtcbiAgaWYgKGRldGFpbD8ucHVibGlzaGVyKSB7XG4gICAgY29uc3QgaGl0UHVicyA9IHN0b3JlLmdldEhpdFB1Ymxpc2hlcnMoKTtcbiAgICBjb25zdCBwdWIgPSBkZXRhaWwucHVibGlzaGVyLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGhpdFB1YnMuc29tZSgocCkgPT4gcHViLmluY2x1ZGVzKHAudG9Mb3dlckNhc2UoKSkpKSBzY29yZSArPSAyNTtcbiAgfVxuXG4gIC8vIFBTNSBzdXBwb3J0XG4gIGlmIChnLnBsYXRmb3Jtcz8uaW5jbHVkZXMoXCJQUzVcIikpIHNjb3JlICs9IDEwO1xuXG4gIC8vIFBlbmFsdHkgZm9yIGFkZC1vbiBjb250ZW50ICh1bmxlc3MgaXQncyBhIHByZW1pdW0gZWRpdGlvbilcbiAgaWYgKEFERF9PTl9QQVRURVJOLnRlc3QoZy5uYW1lKSAmJiAhUFJFTUlVTV9FRElUSU9OLnRlc3QoZy5uYW1lKSkgc2NvcmUgLT0gNTA7XG5cbiAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgc2NvcmUpKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVTa3UobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc2x1ZyA9IG5hbWVcbiAgICAubm9ybWFsaXplKFwiTkZEXCIpLnJlcGxhY2UoL1tcdTAzMDAtXHUwMzZGXS9nLCBcIlwiKVxuICAgIC50b1VwcGVyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1teQS1aMC05XFxzXS9nLCBcIlwiKVxuICAgIC50cmltKClcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5zbGljZSgwLCA1KVxuICAgIC5qb2luKFwiLVwiKTtcbiAgcmV0dXJuIGBQUy0ke3NsdWd9LTAwMWA7XG59XG5cbmZ1bmN0aW9uIHRvR2FtZU91dChnOiBHYW1lLCBjZmdQcmljaW5nID0gc3RvcmUuZ2V0U2V0dGluZ3MoKSkge1xuICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnUHJpY2luZywgZy5jdXJyZW5jeSB8fCBcIlVTRFwiKTtcbiAgY29uc3QgZGJLZXkgPSBnYW1lRGJLZXkoZyk7XG4gIGNvbnN0IG1hdGNoZXMgPSBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhkYktleSkgfHwgc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoZy5pZCk7XG4gIGNvbnN0IG1hcmtldE1pbiA9IG1hdGNoZXMubGVuZ3RoXG4gICAgPyBNYXRoLm1pbiguLi5tYXRjaGVzLm1hcCgobSkgPT4gbS5wcmljZUNscCkpXG4gICAgOiBudWxsO1xuICByZXR1cm4ge1xuICAgIGlkOiBnLmlkLFxuICAgIGRiS2V5LFxuICAgIHBsYXRmb3JtOiBnLnBsYXRmb3JtIHx8IFwicHNuXCIsXG4gICAgcmVnaW9uOiBnLnJlZ2lvbiB8fCBcInVzXCIsXG4gICAgY3VycmVuY3k6IGcuY3VycmVuY3kgfHwgXCJVU0RcIixcbiAgICBuYW1lOiBnLm5hbWUsXG4gICAgaW1hZ2VVcmw6IGcuaW1hZ2VVcmwsXG4gICAgc3RvcmVVcmw6IGcuc3RvcmVVcmwsXG4gICAgcGxhdGZvcm1zOiBnLnBsYXRmb3JtcyxcbiAgICBwcmljZU9yaWdpbmFsOlxuICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZURpc2NvdW50ZWQ6XG4gICAgICBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZU9yaWdpbmFsVXNkOlxuICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZURpc2NvdW50ZWRVc2Q6XG4gICAgICBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBkaXNjb3VudFBlcmNlbnQ6IGcuZGlzY291bnRQZXJjZW50LFxuICAgIGRpc2NvdW50RW5kQXQ6IGcuZGlzY291bnRFbmRBdCxcbiAgICBzZWxlY3RlZDogZy5zZWxlY3RlZCxcbiAgICBwdWJsaXNoZWQ6IGcucHVibGlzaGVkLFxuICAgIG5vdGVzOiBnLm5vdGVzLFxuICAgIHlvdXR1YmVVcmw6IGcueW91dHViZVVybCB8fCBcIlwiLFxuICAgIGFjdGl2ZTogZy5hY3RpdmUsXG4gICAgY29zdENscDogc2FsZT8uY29zdENscCA/PyBudWxsLFxuICAgIHByaW1hcmlhOiBzYWxlPy5wcmltYXJpYSA/PyBudWxsLFxuICAgIHNlY3VuZGFyaWE6IHNhbGU/LnNlY3VuZGFyaWEgPz8gbnVsbCxcbiAgICB0b3RhbFJldmVudWU6IHNhbGU/LnRvdGFsUmV2ZW51ZSA/PyBudWxsLFxuICAgIG5ldFByb2ZpdDogc2FsZT8ubmV0UHJvZml0ID8/IG51bGwsXG4gICAgbWFya2V0TWluLFxuICAgIG1hcmtldENvdW50OiBtYXRjaGVzLmxlbmd0aCxcbiAgICBtYXJrZXRNYXRjaGVzOiBtYXRjaGVzLFxuICAgIGhpdFNjb3JlOiBjb21wdXRlSGl0U2NvcmUoZyksXG4gIH07XG59XG5cbi8vIEdFVCAvZ2FtZXNcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IHNlYXJjaCA9ICh1cmwuc2VhcmNoUGFyYW1zLmdldChcInNlYXJjaFwiKSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBtaW5EaXNjb3VudCA9IHBhcnNlSW50KHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwibWluX2Rpc2NvdW50XCIpIHx8IFwiMFwiLCAxMCkgfHwgMDtcbiAgY29uc3Qgb25seVNlbGVjdGVkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJvbmx5X3NlbGVjdGVkXCIpID09PSBcInRydWVcIjtcbiAgY29uc3QgaGlkZVB1Ymxpc2hlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiaGlkZV9wdWJsaXNoZWRcIikgPT09IFwidHJ1ZVwiO1xuICBjb25zdCBvbmx5V2l0aE1hcmtldCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV93aXRoX21hcmtldFwiKSA9PT0gXCJ0cnVlXCI7XG4gIGNvbnN0IGluY2x1ZGVJbmFjdGl2ZSA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiaW5jbHVkZV9pbmFjdGl2ZVwiKSA9PT0gXCJ0cnVlXCI7XG4gIGNvbnN0IHBsYXRmb3JtRmlsdGVyID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJwbGF0Zm9ybVwiKSB8fCBcIlwiO1xuICBjb25zdCBvbmx5SGl0cyA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9oaXRzXCIpID09PSBcInRydWVcIjtcbiAgY29uc3Qgc29ydCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwic29ydFwiKSB8fCBcImRpc2NvdW50XCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCk7XG4gIGlmICghaW5jbHVkZUluYWN0aXZlKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiAoZy5wbGF0Zm9ybSB8fCBcInBzblwiKSA9PT0gcGxhdGZvcm1GaWx0ZXIpO1xuICBpZiAobWluRGlzY291bnQgPiAwKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5kaXNjb3VudFBlcmNlbnQgPj0gbWluRGlzY291bnQpO1xuICBpZiAob25seVNlbGVjdGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5zZWxlY3RlZCk7XG4gIGlmIChoaWRlUHVibGlzaGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gIWcucHVibGlzaGVkKTtcbiAgaWYgKG9ubHlIaXRzKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gY29tcHV0ZUhpdFNjb3JlKGcpID49IDUwKTtcbiAgaWYgKG9ubHlXaXRoTWFya2V0KSB7XG4gICAgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IGdhbWVEYktleShnKTtcbiAgICAgIHJldHVybiAoc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoa2V5KSB8fCBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhnLmlkKSkubGVuZ3RoID4gMDtcbiAgICB9KTtcbiAgfVxuICBpZiAoc2VhcmNoKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoKSk7XG5cbiAgaWYgKHNvcnQgPT09IFwiaGl0XCIpIGdhbWVzLnNvcnQoKGEsIGIpID0+IGNvbXB1dGVIaXRTY29yZShiKSAtIGNvbXB1dGVIaXRTY29yZShhKSk7XG4gIGVsc2UgaWYgKHNvcnQgPT09IFwicHJpY2VcIikgZ2FtZXMuc29ydCgoYSwgYikgPT4gKGEucHJpY2VEaXNjb3VudGVkQ2VudHMgPz8gMCkgLSAoYi5wcmljZURpc2NvdW50ZWRDZW50cyA/PyAwKSk7XG4gIGVsc2UgaWYgKHNvcnQgPT09IFwibmFtZVwiKSBnYW1lcy5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKTtcbiAgZWxzZSBpZiAoc29ydCA9PT0gXCJtYXJrZXRcIikge1xuICAgIGdhbWVzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGFtID0gc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoYS5pZCk7XG4gICAgICBjb25zdCBibSA9IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKGIuaWQpO1xuICAgICAgY29uc3QgYXAgPSBhbS5sZW5ndGggPyBNYXRoLm1pbiguLi5hbS5tYXAoKG0pID0+IG0ucHJpY2VDbHApKSA6IEluZmluaXR5O1xuICAgICAgY29uc3QgYnAgPSBibS5sZW5ndGggPyBNYXRoLm1pbiguLi5ibS5tYXAoKG0pID0+IG0ucHJpY2VDbHApKSA6IEluZmluaXR5O1xuICAgICAgcmV0dXJuIGFwIC0gYnA7XG4gICAgfSk7XG4gIH1cbiAgZWxzZSBnYW1lcy5zb3J0KChhLCBiKSA9PiBiLmRpc2NvdW50UGVyY2VudCAtIGEuZGlzY291bnRQZXJjZW50KTtcblxuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgZ2FtZXMubWFwKChnKSA9PiB0b0dhbWVPdXQoZywgY2ZnKSkpO1xufSk7XG5cbi8vIFBBVENIIC9nYW1lcy86aWQgXHUyMDE0IGlkIGNhbiBiZSBhIGNvbXBvc2l0ZSBkYktleSAocHNuOnVzOlVQWFhYWC0uLi4pIG9yIGEgYmFyZSBQU04gaWRcbnJvdXRlKFwiUEFUQ0hcIiwgXCIvZ2FtZXMvOmlkXCIsIGFzeW5jIChyZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgUGFydGlhbDxcbiAgICBQaWNrPEdhbWUsIFwic2VsZWN0ZWRcIiB8IFwicHVibGlzaGVkXCIgfCBcIm5vdGVzXCIgfCBcInlvdXR1YmVVcmxcIj5cbiAgPjtcbiAgY29uc3QgcGF0Y2g6IFBhcnRpYWw8R2FtZT4gPSB7fTtcbiAgaWYgKHR5cGVvZiBib2R5LnNlbGVjdGVkID09PSBcImJvb2xlYW5cIikgcGF0Y2guc2VsZWN0ZWQgPSBib2R5LnNlbGVjdGVkO1xuICBpZiAodHlwZW9mIGJvZHkucHVibGlzaGVkID09PSBcImJvb2xlYW5cIikgcGF0Y2gucHVibGlzaGVkID0gYm9keS5wdWJsaXNoZWQ7XG4gIGlmICh0eXBlb2YgYm9keS5ub3RlcyA9PT0gXCJzdHJpbmdcIikgcGF0Y2gubm90ZXMgPSBib2R5Lm5vdGVzO1xuICBpZiAodHlwZW9mIGJvZHkueW91dHViZVVybCA9PT0gXCJzdHJpbmdcIikgcGF0Y2gueW91dHViZVVybCA9IGJvZHkueW91dHViZVVybC50cmltKCk7XG4gIGNvbnN0IGlkID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5pZCk7XG4gIGxldCB1cGRhdGVkID0gc3RvcmUucGF0Y2hHYW1lKGlkLCBwYXRjaCk7XG4gIGlmICghdXBkYXRlZCkge1xuICAgIC8vIFRyeSBsZWdhY3kga2V5IChiYXJlIFBTTiBpZClcbiAgICB1cGRhdGVkID0gc3RvcmUucGF0Y2hHYW1lKGBwc246dXM6JHtpZH1gLCBwYXRjaCk7XG4gIH1cbiAgaWYgKCF1cGRhdGVkKSByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwibm90X2ZvdW5kXCIgfSk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB0b0dhbWVPdXQodXBkYXRlZCkpO1xufSk7XG5cbi8vIFBPU1QgL3JlZnJlc2ggXHUyMDE0IG11bHRpLXBsYXRmb3JtIHJlZnJlc2guIE9wdGlvbmFsIGJvZHk6IHsgcGxhdGZvcm0/LCByZWdpb24/IH1cbi8vIFdpdGggbm8gYm9keSwgcmVmcmVzaGVzIGFsbCBlbmFibGVkIHNvdXJjZXMuIFdpdGggcGxhdGZvcm0vcmVnaW9uLCByZWZyZXNoZXNcbi8vIG9ubHkgdGhhdCBzcGVjaWZpYyBzb3VyY2UuXG5yb3V0ZShcIlBPU1RcIiwgXCIvcmVmcmVzaFwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcbiAgICBjb25zdCB0YXJnZXRQbGF0Zm9ybSA9IGJvZHkucGxhdGZvcm0gYXMgUGxhdGZvcm0gfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdGFyZ2V0UmVnaW9uID0gYm9keS5yZWdpb24gYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qgc291cmNlcyA9IHN0b3JlLmdldFNvdXJjZXMoKS5maWx0ZXIoKHMpID0+IHtcbiAgICAgIGlmICghcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAodGFyZ2V0UGxhdGZvcm0gJiYgcy5wbGF0Zm9ybSAhPT0gdGFyZ2V0UGxhdGZvcm0pIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICh0YXJnZXRSZWdpb24gJiYgcy5yZWdpb24gIT09IHRhcmdldFJlZ2lvbikgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBjb25zdCBub3dJc28gPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgcmVzdWx0czogQXJyYXk8e1xuICAgICAgcGxhdGZvcm06IHN0cmluZztcbiAgICAgIHJlZ2lvbjogc3RyaW5nO1xuICAgICAgbmV3Q291bnQ6IG51bWJlcjtcbiAgICAgIHVwZGF0ZWQ6IG51bWJlcjtcbiAgICAgIGRpc2FwcGVhcmVkOiBudW1iZXI7XG4gICAgICB0b3RhbFNlZW46IG51bWJlcjtcbiAgICAgIGVycm9yPzogc3RyaW5nO1xuICAgIH0+ID0gW107XG4gICAgbGV0IGFsbFdhdGNobGlzdEFsZXJ0czogV2F0Y2hsaXN0QWxlcnRbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBnZXRQcm92aWRlcihzb3VyY2UucGxhdGZvcm0pO1xuICAgICAgICBjb25zdCBzZWVuS2V5cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBsZXQgbmV3Q291bnQgPSAwO1xuICAgICAgICBsZXQgdXBkYXRlZCA9IDA7XG4gICAgICAgIGxldCB0b3RhbFNlZW4gPSAwO1xuXG4gICAgICAgIC8vIEZvciBQU04sIGluamVjdCB0aGUgY2F0ZWdvcnlJZCBmcm9tIHRoZSBQU04gY29uZmlnIGlmIG5vdCBvbiBzb3VyY2VcbiAgICAgICAgY29uc3QgZWZmU291cmNlID0geyAuLi5zb3VyY2UgfTtcbiAgICAgICAgaWYgKHNvdXJjZS5wbGF0Zm9ybSA9PT0gXCJwc25cIiAmJiAhc291cmNlLmNhdGVnb3J5SWQpIHtcbiAgICAgICAgICBlZmZTb3VyY2UuY2F0ZWdvcnlJZCA9IHN0b3JlLmdldFBzbigpLmRlYWxzQ2F0ZWdvcnlJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgZGVhbCBvZiBwcm92aWRlci5mZXRjaERlYWxzKGVmZlNvdXJjZSkpIHtcbiAgICAgICAgICB0b3RhbFNlZW4rKztcbiAgICAgICAgICBjb25zdCBkYktleSA9IGAke3NvdXJjZS5wbGF0Zm9ybX06JHtzb3VyY2UucmVnaW9ufToke2RlYWwuaWR9YDtcbiAgICAgICAgICBzZWVuS2V5cy5hZGQoZGJLZXkpO1xuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gc3RvcmUuZ2V0R2FtZUJ5Q29tcG9zaXRlKHNvdXJjZS5wbGF0Zm9ybSwgc291cmNlLnJlZ2lvbiwgZGVhbC5pZCk7XG4gICAgICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICAgICAgc3RvcmUudXBzZXJ0R2FtZSh7XG4gICAgICAgICAgICAgIGlkOiBkZWFsLmlkLFxuICAgICAgICAgICAgICBwbGF0Zm9ybTogc291cmNlLnBsYXRmb3JtLFxuICAgICAgICAgICAgICByZWdpb246IHNvdXJjZS5yZWdpb24sXG4gICAgICAgICAgICAgIG5hbWU6IGRlYWwubmFtZSxcbiAgICAgICAgICAgICAgaW1hZ2VVcmw6IGRlYWwuaW1hZ2VVcmwsXG4gICAgICAgICAgICAgIHN0b3JlVXJsOiBkZWFsLnN0b3JlVXJsLFxuICAgICAgICAgICAgICBwbGF0Zm9ybXM6IGRlYWwuaGFyZHdhcmVQbGF0Zm9ybXMsXG4gICAgICAgICAgICAgIGN1cnJlbmN5OiBkZWFsLmN1cnJlbmN5LFxuICAgICAgICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGRlYWwucHJpY2VPcmlnaW5hbENlbnRzLFxuICAgICAgICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICAgICAgICAgICAgZGlzY291bnRQZXJjZW50OiBkZWFsLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgICAgICAgZGlzY291bnRFbmRBdDogZGVhbC5kaXNjb3VudEVuZEF0LFxuICAgICAgICAgICAgICBzZWxlY3RlZDogZmFsc2UsXG4gICAgICAgICAgICAgIHB1Ymxpc2hlZDogZmFsc2UsXG4gICAgICAgICAgICAgIG5vdGVzOiBcIlwiLFxuICAgICAgICAgICAgICB5b3V0dWJlVXJsOiBcIlwiLFxuICAgICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgIGZpcnN0U2VlbkF0OiBub3dJc28sXG4gICAgICAgICAgICAgIGxhc3RTZWVuQXQ6IG5vd0lzbyxcbiAgICAgICAgICAgICAgdXBkYXRlZEF0OiBub3dJc28sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ld0NvdW50Kys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0b3JlLnVwc2VydEdhbWUoe1xuICAgICAgICAgICAgICAuLi5leGlzdGluZyxcbiAgICAgICAgICAgICAgbmFtZTogZGVhbC5uYW1lIHx8IGV4aXN0aW5nLm5hbWUsXG4gICAgICAgICAgICAgIGltYWdlVXJsOiBkZWFsLmltYWdlVXJsIHx8IGV4aXN0aW5nLmltYWdlVXJsLFxuICAgICAgICAgICAgICBzdG9yZVVybDogZGVhbC5zdG9yZVVybCB8fCBleGlzdGluZy5zdG9yZVVybCxcbiAgICAgICAgICAgICAgcGxhdGZvcm1zOiBkZWFsLmhhcmR3YXJlUGxhdGZvcm1zLFxuICAgICAgICAgICAgICBjdXJyZW5jeTogZGVhbC5jdXJyZW5jeSxcbiAgICAgICAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBkZWFsLnByaWNlT3JpZ2luYWxDZW50cyxcbiAgICAgICAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMsXG4gICAgICAgICAgICAgIGRpc2NvdW50UGVyY2VudDogZGVhbC5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IGRlYWwuZGlzY291bnRFbmRBdCxcbiAgICAgICAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgICBsYXN0U2VlbkF0OiBub3dJc28sXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogbm93SXNvLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1cGRhdGVkKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGlzYXBwZWFyZWQgPSBzdG9yZS5tYXJrSW5hY3RpdmVJZk1pc3NpbmcoXG4gICAgICAgICAgc2VlbktleXMsXG4gICAgICAgICAgc291cmNlLnBsYXRmb3JtLFxuICAgICAgICAgIHNvdXJjZS5yZWdpb25cbiAgICAgICAgKTtcblxuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHBsYXRmb3JtOiBzb3VyY2UucGxhdGZvcm0sXG4gICAgICAgICAgcmVnaW9uOiBzb3VyY2UucmVnaW9uLFxuICAgICAgICAgIG5ld0NvdW50LFxuICAgICAgICAgIHVwZGF0ZWQsXG4gICAgICAgICAgZGlzYXBwZWFyZWQsXG4gICAgICAgICAgdG90YWxTZWVuLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc3QgZXJyTXNnID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFske3NvdXJjZS5wbGF0Zm9ybX0vJHtzb3VyY2UucmVnaW9ufV0gRXJyb3I6ICR7ZXJyTXNnfWApO1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHBsYXRmb3JtOiBzb3VyY2UucGxhdGZvcm0sXG4gICAgICAgICAgcmVnaW9uOiBzb3VyY2UucmVnaW9uLFxuICAgICAgICAgIG5ld0NvdW50OiAwLFxuICAgICAgICAgIHVwZGF0ZWQ6IDAsXG4gICAgICAgICAgZGlzYXBwZWFyZWQ6IDAsXG4gICAgICAgICAgdG90YWxTZWVuOiAwLFxuICAgICAgICAgIGVycm9yOiBlcnJNc2csXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlY29tcHV0ZU1hdGNoZXMoKTtcbiAgICAvLyBEaWZmIHdhdGNobGlzdCBmb3IgUFNOIHNvdXJjZXNcbiAgICBjb25zdCBwc25TZWVuSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBnIG9mIHN0b3JlLmxpc3RHYW1lcygpKSB7XG4gICAgICBpZiAoZy5hY3RpdmUgJiYgZy5wbGF0Zm9ybSA9PT0gXCJwc25cIikgcHNuU2Vlbklkcy5hZGQoZy5pZCk7XG4gICAgfVxuICAgIGFsbFdhdGNobGlzdEFsZXJ0cyA9IGRpZmZXYXRjaGxpc3QocHNuU2Vlbklkcywgbm93SXNvKTtcblxuICAgIGNvbnN0IHRvdGFsTmV3ID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLm5ld0NvdW50LCAwKTtcbiAgICBjb25zdCB0b3RhbFVwZGF0ZWQgPSByZXN1bHRzLnJlZHVjZSgocywgcikgPT4gcyArIHIudXBkYXRlZCwgMCk7XG4gICAgY29uc3QgdG90YWxEaXNhcHBlYXJlZCA9IHJlc3VsdHMucmVkdWNlKChzLCByKSA9PiBzICsgci5kaXNhcHBlYXJlZCwgMCk7XG4gICAgY29uc3QgdG90YWxTZWVuID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLnRvdGFsU2VlbiwgMCk7XG4gICAgY29uc3QgdG90YWxLZXB0ID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLnRvdGFsU2VlbiAtIChyLmVycm9yID8gci50b3RhbFNlZW4gOiAwKSwgMCk7XG5cbiAgICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgICAgbmV3OiB0b3RhbE5ldyxcbiAgICAgIHVwZGF0ZWQ6IHRvdGFsVXBkYXRlZCxcbiAgICAgIGRpc2FwcGVhcmVkOiB0b3RhbERpc2FwcGVhcmVkLFxuICAgICAgdG90YWxTZWVuLFxuICAgICAga2VwdDogdG90YWxLZXB0LFxuICAgICAgZmlsdGVyZWRBZGRPbnM6IDAsXG4gICAgICB3YXRjaGxpc3RBbGVydHM6IGFsbFdhdGNobGlzdEFsZXJ0cyxcbiAgICAgIHNvdXJjZVJlc3VsdHM6IHJlc3VsdHMsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIFBlcnNpc3RlZFF1ZXJ5Tm90Rm91bmRFcnJvcikge1xuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICAgIGVycm9yOiBcInBlcnNpc3RlZF9xdWVyeV9ub3RfZm91bmRcIixcbiAgICAgICAgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UsXG4gICAgICAgIGhpbnQ6XG4gICAgICAgICAgXCJBYnJlIERldlRvb2xzID4gTmV0d29yayBlbiBsYSBwXHUwMEUxZ2luYSBkZSBvZmVydGFzIGRlIFBTIFN0b3JlLCBidXNjYSBsYSBcIiArXG4gICAgICAgICAgXCJyZXF1ZXN0IGEgL2FwaS9ncmFwaHFsL3YxL29wP29wZXJhdGlvbk5hbWU9Y2F0ZWdvcnlHcmlkUmV0cmlldmUgeSBcIiArXG4gICAgICAgICAgXCJhY3R1YWxpemEgZWwgaGFzaCBlbiBBanVzdGVzLlwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IgfHwgZSBpbnN0YW5jZW9mIFByb3ZpZGVyRXJyb3IpIHtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJwcm92aWRlcl9lcnJvclwiLFxuICAgICAgICBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSxcbiAgICAgICAgaGludDpcbiAgICAgICAgICBcIlNpIGVzdG8gY29ycmUgZW4gdW5hIHNhbmRib3ggKEJvbHQvU3RhY2tCbGl0eikgbGEgSVAgcHVlZGUgZXN0YXIgXCIgK1xuICAgICAgICAgIFwiYmxvcXVlYWRhLiBQcm9iXHUwMEUxIGRlc2RlIHR1IG1cdTAwRTFxdWluYSBvIHNlcnZpZG9yLlwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcImludGVybmFsXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gR0VUIC9nYW1lcy9leHBvcnQuY3N2XG4vLyBQYXJhbXM6IG9ubHlfc2VsZWN0ZWQ9dHJ1ZXxmYWxzZSwgZm9ybWF0PXNoZWV0cyAoQk9NICsgc2VtaWNvbG9ucyBmb3IgR29vZ2xlIFNoZWV0cylcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzL2V4cG9ydC5jc3ZcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCB8fCBcIi9cIiwgXCJodHRwOi8veFwiKTtcbiAgY29uc3Qgb25seVNlbGVjdGVkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJvbmx5X3NlbGVjdGVkXCIpICE9PSBcImZhbHNlXCI7XG4gIGNvbnN0IHNoZWV0c0Zvcm1hdCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiZm9ybWF0XCIpID09PSBcInNoZWV0c1wiO1xuICBjb25zdCBzZXAgPSBzaGVldHNGb3JtYXQgPyBcIjtcIiA6IFwiLFwiO1xuXG4gIGxldCBnYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBpZiAob25seVNlbGVjdGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5zZWxlY3RlZCk7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3QgaGVhZGVyID0gW1xuICAgIFwiaWRcIixcbiAgICBcInBsYXRhZm9ybWFcIixcbiAgICBcInJlZ2lvblwiLFxuICAgIFwibW9uZWRhXCIsXG4gICAgXCJuYW1lXCIsXG4gICAgXCJwbGF0Zm9ybXNcIixcbiAgICBcInN0b3JlX3VybFwiLFxuICAgIFwicHJlY2lvX29yaWdpbmFsXCIsXG4gICAgXCJwcmVjaW9fZGVzY3VlbnRvXCIsXG4gICAgXCJkZXNjdWVudG9fcGN0XCIsXG4gICAgXCJmaW5fb2ZlcnRhXCIsXG4gICAgXCJjb3N0b19jbHBcIixcbiAgICBcInByaW1hcmlhX2NscFwiLFxuICAgIFwic2VjdW5kYXJpYV9jbHBcIixcbiAgICBcImluZ3Jlc29fdG90YWxcIixcbiAgICBcImdhbmFuY2lhX25ldGFcIixcbiAgICBcIm1hcmdlbl9wY3RcIixcbiAgICBcIm5vdGFzXCIsXG4gIF07XG5cbiAgY29uc3QgZXNjYXBlID0gKHY6IHVua25vd24pID0+IHtcbiAgICBjb25zdCBzID0gdiA9PSBudWxsID8gXCJcIiA6IFN0cmluZyh2KTtcbiAgICBjb25zdCBuZWVkc1F1b3RlID0gcy5pbmNsdWRlcyhzZXApIHx8IHMuaW5jbHVkZXMoJ1wiJykgfHwgcy5pbmNsdWRlcyhcIlxcblwiKTtcbiAgICByZXR1cm4gbmVlZHNRdW90ZSA/IGBcIiR7cy5yZXBsYWNlKC9cIi9nLCAnXCJcIicpfVwiYCA6IHM7XG4gIH07XG5cbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgY29uc3QgbWV0YWRhdGEgPSBzaGVldHNGb3JtYXRcbiAgICA/IGAjIEV4cG9ydGFkbzogJHtub3d9IFx1MDBCNyBUQyBVU0Q6ICR7Y2ZnLnVzZFRvQ2xwfSBcdTAwQjcgRGVzY3VlbnRvIHNhbGRvIFVTRDogJHtjZmcuYmFsYW5jZURpc2NvdW50VXNkfVxcbmBcbiAgICA6IFwiXCI7XG5cbiAgY29uc3QgbGluZXMgPSBbaGVhZGVyLmpvaW4oc2VwKV07XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmcsIGcuY3VycmVuY3kgfHwgXCJVU0RcIik7XG4gICAgY29uc3QgY29zdCA9IHNhbGU/LmNvc3RDbHAgPz8gbnVsbDtcbiAgICBjb25zdCBtYXJnZW4gPSBjb3N0ICYmIHNhbGU/Lm5ldFByb2ZpdFxuICAgICAgPyBNYXRoLnJvdW5kKChzYWxlLm5ldFByb2ZpdCAvIGNvc3QpICogMTAwKVxuICAgICAgOiBcIlwiO1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBbXG4gICAgICAgIGcuaWQsXG4gICAgICAgIGcucGxhdGZvcm0gfHwgXCJwc25cIixcbiAgICAgICAgZy5yZWdpb24gfHwgXCJ1c1wiLFxuICAgICAgICBnLmN1cnJlbmN5IHx8IFwiVVNEXCIsXG4gICAgICAgIGcubmFtZSxcbiAgICAgICAgZy5wbGF0Zm9ybXMsXG4gICAgICAgIGcuc3RvcmVVcmwgPz8gXCJcIixcbiAgICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IChnLnByaWNlT3JpZ2luYWxDZW50cyAvIDEwMCkudG9GaXhlZCgyKSA6IFwiXCIsXG4gICAgICAgIGcucHJpY2VEaXNjb3VudGVkQ2VudHMgIT0gbnVsbCA/IChnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwKS50b0ZpeGVkKDIpIDogXCJcIixcbiAgICAgICAgZy5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGcuZGlzY291bnRFbmRBdCA/PyBcIlwiLFxuICAgICAgICBjb3N0ID8/IFwiXCIsXG4gICAgICAgIHNhbGU/LnByaW1hcmlhID8/IFwiXCIsXG4gICAgICAgIHNhbGU/LnNlY3VuZGFyaWEgPz8gXCJcIixcbiAgICAgICAgc2FsZT8udG90YWxSZXZlbnVlID8/IFwiXCIsXG4gICAgICAgIHNhbGU/Lm5ldFByb2ZpdCA/PyBcIlwiLFxuICAgICAgICBtYXJnZW4sXG4gICAgICAgIGcubm90ZXMsXG4gICAgICBdXG4gICAgICAgIC5tYXAoZXNjYXBlKVxuICAgICAgICAuam9pbihzZXApXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBtZXRhZGF0YSArIGxpbmVzLmpvaW4oXCJcXG5cIik7XG4gIGNvbnN0IGJvbSA9IHNoZWV0c0Zvcm1hdCA/IFwiXHVGRUZGXCIgOiBcIlwiO1xuXG4gIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwidGV4dC9jc3Y7IGNoYXJzZXQ9dXRmLThcIik7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LWRpc3Bvc2l0aW9uXCIsICdhdHRhY2htZW50OyBmaWxlbmFtZT1cImFwaXBzbi1nYW1lcy5jc3ZcIicpO1xuICByZXMuZW5kKGJvbSArIGNvbnRlbnQpO1xufSk7XG5cbi8vIEdFVCAvZ2FtZXMvZXhwb3J0LXN1cGFiYXNlLmNzdiBcdTIwMTQgQ1NWIG1hdGNoaW5nIHRoZSBTdXBhYmFzZSBwcm9kdWN0cyB0YWJsZSBzY2hlbWEgZXhhY3RseVxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvZXhwb3J0LXN1cGFiYXNlLmNzdlwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBvbmx5U2VsZWN0ZWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcIm9ubHlfc2VsZWN0ZWRcIikgIT09IFwiZmFsc2VcIjtcbiAgY29uc3QgcGxhdGZvcm1GaWx0ZXIgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInBsYXRmb3JtXCIpIHx8IFwiXCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG4gIGlmIChvbmx5U2VsZWN0ZWQpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnNlbGVjdGVkKTtcbiAgaWYgKHBsYXRmb3JtRmlsdGVyKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5wbGF0Zm9ybSA9PT0gcGxhdGZvcm1GaWx0ZXIpO1xuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuXG4gIGNvbnN0IGhlYWRlciA9IFtcbiAgICBcInNrdVwiLFxuICAgIFwiZGlzcGxheV9uYW1lXCIsXG4gICAgXCJpbWFnZXNcIixcbiAgICBcInBsYXRmb3JtX2F2YWlsYWJpbGl0eVwiLFxuICAgIFwicHJpY2luZ19ieV9wbGF0Zm9ybV9hbmRfYWNjb3VudFwiLFxuICAgIFwic3RvY2tfcXVhbnRpdHlcIixcbiAgICBcImlzX2FjdGl2ZVwiLFxuICAgIFwic29ydF9vcmRlclwiLFxuICBdO1xuXG4gIGNvbnN0IGVzY2FwZSA9ICh2OiB1bmtub3duKSA9PiB7XG4gICAgY29uc3QgcyA9IHYgPT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcodik7XG4gICAgY29uc3QgbmVlZHNRdW90ZSA9IHMuaW5jbHVkZXMoXCIsXCIpIHx8IHMuaW5jbHVkZXMoJ1wiJykgfHwgcy5pbmNsdWRlcyhcIlxcblwiKTtcbiAgICByZXR1cm4gbmVlZHNRdW90ZSA/IGBcIiR7cy5yZXBsYWNlKC9cIi9nLCAnXCJcIicpfVwiYCA6IHM7XG4gIH07XG5cbiAgY29uc3QgbGluZXMgPSBbaGVhZGVyLmpvaW4oXCIsXCIpXTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgY29uc3Qgc2FsZSA9IGNvbXB1dGVTYWxlUHJpY2VzKGcucHJpY2VEaXNjb3VudGVkQ2VudHMsIGNmZywgZy5jdXJyZW5jeSB8fCBcIlVTRFwiKTtcbiAgICBjb25zdCBkZXRhaWwgPSBzdG9yZS5nZXRQcm9kdWN0RGV0YWlsKGcuaWQpO1xuXG4gICAgLy8gU0tVOiBQUy1TTFVHLTAwMVxuICAgIGNvbnN0IHNsdWcgPSBnLm5hbWVcbiAgICAgIC50b1VwcGVyQ2FzZSgpXG4gICAgICAucmVwbGFjZSgvW15BLVowLTlcXHNdL2csIFwiXCIpXG4gICAgICAudHJpbSgpXG4gICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgLnNsaWNlKDAsIDQpXG4gICAgICAuam9pbihcIi1cIik7XG4gICAgY29uc3Qgc2t1ID0gYFBTLSR7c2x1Z30tMDAxYDtcblxuICAgIC8vIEltYWdlczogW3thbHQsIHVybH1dIFx1MjAxNCBjb3ZlciBhcnQgZnJvbSBncmlkIHRpbGUgZmlyc3QsIHRoZW4gaGVyby9iYW5uZXJcbiAgICBjb25zdCBpbWFnZXM6IEFycmF5PHsgYWx0OiBzdHJpbmc7IHVybDogc3RyaW5nIH0+ID0gW107XG4gICAgaWYgKGcuaW1hZ2VVcmwpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogZy5pbWFnZVVybCB9KTtcbiAgICBpZiAoZGV0YWlsPy5tZWRpYT8uaGVyb1VybCAmJiAhaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBkZXRhaWwubWVkaWEuaGVyb1VybCkpIHtcbiAgICAgIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogZGV0YWlsLm1lZGlhLmhlcm9VcmwgfSk7XG4gICAgfVxuICAgIGlmIChkZXRhaWw/LmNhcm91c2VsSW1hZ2VzKSB7XG4gICAgICBmb3IgKGNvbnN0IGltZyBvZiBkZXRhaWwuY2Fyb3VzZWxJbWFnZXMpIHtcbiAgICAgICAgaWYgKCFpbWFnZXMuc29tZSgoeCkgPT4geC51cmwgPT09IGltZykpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogaW1nIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZGV0YWlsPy5tZWRpYT8uc2NyZWVuc2hvdHMpIHtcbiAgICAgIGZvciAoY29uc3QgaW1nIG9mIGRldGFpbC5tZWRpYS5zY3JlZW5zaG90cykge1xuICAgICAgICBpZiAoIWltYWdlcy5zb21lKCh4KSA9PiB4LnVybCA9PT0gaW1nKSkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBpbWcgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUGxhdGZvcm0gYXZhaWxhYmlsaXR5OiB7UFM0OiB0cnVlLCBQUzU6IHRydWV9XG4gICAgY29uc3QgaHdQbGF0Zm9ybXMgPSAoZy5wbGF0Zm9ybXMgfHwgXCJcIilcbiAgICAgIC5zcGxpdChcIixcIilcbiAgICAgIC5tYXAoKHApID0+IHAudHJpbSgpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBwbGF0Zm9ybUF2YWlsYWJpbGl0eTogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgaHdQbGF0Zm9ybXMpIHBsYXRmb3JtQXZhaWxhYmlsaXR5W3BdID0gdHJ1ZTtcblxuICAgIC8vIFByaWNpbmc6IHBlciBoYXJkd2FyZSBwbGF0Zm9ybSBcdTAwRDcgYWNjb3VudCB0eXBlXG4gICAgY29uc3QgcHJpbWFyaWEgPSBzYWxlPy5wcmltYXJpYSA/PyBudWxsO1xuICAgIGNvbnN0IHNlY3VuZGFyaWEgPSBzYWxlPy5zZWN1bmRhcmlhID8/IG51bGw7XG4gICAgY29uc3QgcHJpY2luZzogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgbnVtYmVyIHwgbnVsbD4+ID0ge307XG4gICAgZm9yIChjb25zdCBwIG9mIGh3UGxhdGZvcm1zLmxlbmd0aCA/IGh3UGxhdGZvcm1zIDogW1wiUFM0XCJdKSB7XG4gICAgICBwcmljaW5nW3BdID0ge1xuICAgICAgICBQcmltYXJpYTogcHJpbWFyaWEsXG4gICAgICAgIFNlY3VuZGFyaWE6IHNlY3VuZGFyaWEsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGxpbmVzLnB1c2goXG4gICAgICBbXG4gICAgICAgIHNrdSxcbiAgICAgICAgZy5uYW1lLFxuICAgICAgICBKU09OLnN0cmluZ2lmeShpbWFnZXMpLFxuICAgICAgICBKU09OLnN0cmluZ2lmeShwbGF0Zm9ybUF2YWlsYWJpbGl0eSksXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHByaWNpbmcpLFxuICAgICAgICAwLFxuICAgICAgICB0cnVlLFxuICAgICAgICAwLFxuICAgICAgXVxuICAgICAgICAubWFwKGVzY2FwZSlcbiAgICAgICAgLmpvaW4oXCIsXCIpXG4gICAgKTtcbiAgfVxuXG4gIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwidGV4dC9jc3Y7IGNoYXJzZXQ9dXRmLThcIik7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LWRpc3Bvc2l0aW9uXCIsICdhdHRhY2htZW50OyBmaWxlbmFtZT1cImFwaXBzbi1zdXBhYmFzZS5jc3ZcIicpO1xuICByZXMuZW5kKGxpbmVzLmpvaW4oXCJcXG5cIikpO1xufSk7XG5cbi8vIEdFVCAvZ2FtZXMvZXhwb3J0Lmpzb24gXHUyMDE0IFN1cGFiYXNlLXJlYWR5IEpTT04gZXhwb3J0IHdpdGggZW5yaWNoZWQgcHJvZHVjdCBkZXRhaWxzXG4vLyBQYXJhbXM6IG9ubHlfc2VsZWN0ZWQ9dHJ1ZXxmYWxzZSwgcGxhdGZvcm09cHNufHhib3h8Li4uLCBlbnJpY2g9dHJ1ZSAoaW5jbHVkZSBwcm9kdWN0IGRldGFpbCBpZiBjYWNoZWQpXG5yb3V0ZShcIkdFVFwiLCBcIi9nYW1lcy9leHBvcnQuanNvblwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBvbmx5U2VsZWN0ZWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcIm9ubHlfc2VsZWN0ZWRcIikgIT09IFwiZmFsc2VcIjtcbiAgY29uc3QgZW5yaWNoID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJlbnJpY2hcIikgIT09IFwiZmFsc2VcIjtcbiAgY29uc3QgcGxhdGZvcm1GaWx0ZXIgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInBsYXRmb3JtXCIpIHx8IFwiXCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG4gIGlmIChvbmx5U2VsZWN0ZWQpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnNlbGVjdGVkKTtcbiAgaWYgKHBsYXRmb3JtRmlsdGVyKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5wbGF0Zm9ybSA9PT0gcGxhdGZvcm1GaWx0ZXIpO1xuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuXG4gIGNvbnN0IHJvd3MgPSBnYW1lcy5tYXAoKGcpID0+IHtcbiAgICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnLCBnLmN1cnJlbmN5IHx8IFwiVVNEXCIpO1xuICAgIGNvbnN0IGRldGFpbCA9IGVucmljaCA/IHN0b3JlLmdldFByb2R1Y3REZXRhaWwoZy5pZCkgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgZGJLZXkgPSBgJHtnLnBsYXRmb3JtfToke2cucmVnaW9ufToke2cuaWR9YDtcbiAgICBjb25zdCBtYXRjaGVzID0gc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoZGJLZXkpIHx8IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKGcuaWQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIENvcmUgaWRlbnRpZmljYXRpb25cbiAgICAgIGlkOiBnLmlkLFxuICAgICAgZGJfa2V5OiBkYktleSxcbiAgICAgIHBsYXRmb3JtOiBnLnBsYXRmb3JtLFxuICAgICAgcmVnaW9uOiBnLnJlZ2lvbixcbiAgICAgIGN1cnJlbmN5OiBnLmN1cnJlbmN5IHx8IFwiVVNEXCIsXG5cbiAgICAgIC8vIEJhc2ljIGluZm9cbiAgICAgIG5hbWU6IGcubmFtZSxcbiAgICAgIGltYWdlX3VybDogZy5pbWFnZVVybCxcbiAgICAgIHN0b3JlX3VybDogZy5zdG9yZVVybCxcbiAgICAgIGhhcmR3YXJlX3BsYXRmb3JtczogZy5wbGF0Zm9ybXMsXG5cbiAgICAgIC8vIFByaWNpbmdcbiAgICAgIHByaWNlX29yaWdpbmFsOiBnLnByaWNlT3JpZ2luYWxDZW50cyAhPSBudWxsID8gZy5wcmljZU9yaWdpbmFsQ2VudHMgLyAxMDAgOiBudWxsLFxuICAgICAgcHJpY2VfZGlzY291bnRlZDogZy5wcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsID8gZy5wcmljZURpc2NvdW50ZWRDZW50cyAvIDEwMCA6IG51bGwsXG4gICAgICBkaXNjb3VudF9wZXJjZW50OiBnLmRpc2NvdW50UGVyY2VudCxcbiAgICAgIGRpc2NvdW50X2VuZF9hdDogZy5kaXNjb3VudEVuZEF0IHx8IGRldGFpbD8uZGlzY291bnRFbmRBdCB8fCBudWxsLFxuXG4gICAgICAvLyBDTFAgcHJpY2luZ1xuICAgICAgY29zdF9jbHA6IHNhbGU/LmNvc3RDbHAgPz8gbnVsbCxcbiAgICAgIHByaW1hcmlhX2NscDogc2FsZT8ucHJpbWFyaWEgPz8gbnVsbCxcbiAgICAgIHNlY3VuZGFyaWFfY2xwOiBzYWxlPy5zZWN1bmRhcmlhID8/IG51bGwsXG5cbiAgICAgIC8vIEVucmljaGVkIGRldGFpbCAoZnJvbSBwcm9kdWN0IHBhZ2Ugc2NyYXBlKVxuICAgICAgZGVzY3JpcHRpb246IGRldGFpbD8uZGVzY3JpcHRpb24gPz8gbnVsbCxcbiAgICAgIHNob3J0X2Rlc2NyaXB0aW9uOiBkZXRhaWw/LnNob3J0RGVzY3JpcHRpb24gPz8gbnVsbCxcbiAgICAgIHB1Ymxpc2hlcjogZGV0YWlsPy5wdWJsaXNoZXIgPz8gbnVsbCxcbiAgICAgIGRldmVsb3BlcjogZGV0YWlsPy5kZXZlbG9wZXIgPz8gbnVsbCxcbiAgICAgIHJlbGVhc2VfZGF0ZTogZGV0YWlsPy5yZWxlYXNlRGF0ZSA/PyBudWxsLFxuICAgICAgZ2VucmVzOiBkZXRhaWw/LmdlbnJlcyA/PyBbXSxcbiAgICAgIGFnZV9yYXRpbmc6IGRldGFpbD8uYWdlUmF0aW5nID8/IG51bGwsXG4gICAgICBjb250ZW50X2Rlc2NyaXB0b3JzOiBkZXRhaWw/LmNvbnRlbnREZXNjcmlwdG9ycyA/PyBbXSxcbiAgICAgIGludGVyYWN0aXZlX2VsZW1lbnRzOiBkZXRhaWw/LmludGVyYWN0aXZlRWxlbWVudHMgPz8gW10sXG4gICAgICBwbGF5ZXJfY291bnQ6IGRldGFpbD8ucGxheWVyQ291bnQgPz8gbnVsbCxcbiAgICAgIG9ubGluZV9wbGF5ZXJfY291bnQ6IGRldGFpbD8ub25saW5lUGxheWVyQ291bnQgPz8gbnVsbCxcbiAgICAgIHBzX3BsdXNfcmVxdWlyZWQ6IGRldGFpbD8ucHNQbHVzUmVxdWlyZWQgPz8gZmFsc2UsXG4gICAgICBpbl9nYW1lX3B1cmNoYXNlczogZGV0YWlsPy5pbkdhbWVQdXJjaGFzZXMgPz8gbnVsbCxcbiAgICAgIGdhbWVfZmVhdHVyZXM6IGRldGFpbD8uZ2FtZUZlYXR1cmVzID8/IFtdLFxuICAgICAgcHNfdmVyc2lvbjogZGV0YWlsPy5wc1ZlcnNpb24gPz8gbnVsbCxcbiAgICAgIGZpbGVfc2l6ZTogZGV0YWlsPy5maWxlU2l6ZSA/PyBudWxsLFxuICAgICAgdm9pY2VfbGFuZ3VhZ2VzOiBkZXRhaWw/LnZvaWNlTGFuZ3VhZ2VzID8/IFtdLFxuICAgICAgc3VidGl0bGVfbGFuZ3VhZ2VzOiBkZXRhaWw/LnN1YnRpdGxlTGFuZ3VhZ2VzID8/IFtdLFxuXG4gICAgICAvLyBNZWRpYVxuICAgICAgcG9ydHJhaXRfdXJsOiBnLmltYWdlVXJsLFxuICAgICAgY292ZXJfdXJsOiBkZXRhaWw/Lm1lZGlhPy5jb3ZlclVybCA/PyBudWxsLFxuICAgICAgaGVyb191cmw6IGRldGFpbD8ubWVkaWE/Lmhlcm9VcmwgPz8gbnVsbCxcbiAgICAgIHNjcmVlbnNob3RzOiBkZXRhaWw/Lm1lZGlhPy5zY3JlZW5zaG90cyA/PyBbXSxcbiAgICAgIGNhcm91c2VsX2ltYWdlczogZGV0YWlsPy5jYXJvdXNlbEltYWdlcyA/PyBbXSxcbiAgICAgIHZpZGVvczogZGV0YWlsPy5tZWRpYT8udmlkZW9zID8/IFtdLFxuXG4gICAgICAvLyBDb21wZXRpdGlvblxuICAgICAgbWFya2V0X21pbl9jbHA6IG1hdGNoZXMubGVuZ3RoID8gTWF0aC5taW4oLi4ubWF0Y2hlcy5tYXAoKG0pID0+IG0ucHJpY2VDbHApKSA6IG51bGwsXG4gICAgICBtYXJrZXRfY291bnQ6IG1hdGNoZXMubGVuZ3RoLFxuXG4gICAgICAvLyBTdGF0dXNcbiAgICAgIHNlbGVjdGVkOiBnLnNlbGVjdGVkLFxuICAgICAgcHVibGlzaGVkOiBnLnB1Ymxpc2hlZCxcbiAgICAgIG5vdGVzOiBnLm5vdGVzLFxuICAgICAgYWN0aXZlOiBnLmFjdGl2ZSxcbiAgICAgIGZpcnN0X3NlZW5fYXQ6IGcuZmlyc3RTZWVuQXQsXG4gICAgICBsYXN0X3NlZW5fYXQ6IGcubGFzdFNlZW5BdCxcbiAgICB9O1xuICB9KTtcblxuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBnYW1lczogcm93cywgZXhwb3J0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSwgY291bnQ6IHJvd3MubGVuZ3RoIH0pO1xufSk7XG5cbi8vIEdFVCAvZ2FtZXMvZXhwb3J0LXN1cGFiYXNlIFx1MjAxNCBleHBvcnQgc2VsZWN0ZWQgZ2FtZXMgZm9ybWF0dGVkIGZvciB0aGUgU3VwYWJhc2UgcHJvZHVjdHMgdGFibGVcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzL2V4cG9ydC1zdXBhYmFzZVwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBvbmx5U2VsZWN0ZWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcIm9ubHlfc2VsZWN0ZWRcIikgIT09IFwiZmFsc2VcIjtcbiAgY29uc3QgcGxhdGZvcm1GaWx0ZXIgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInBsYXRmb3JtXCIpIHx8IFwiXCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG4gIGlmIChvbmx5U2VsZWN0ZWQpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnNlbGVjdGVkKTtcbiAgaWYgKHBsYXRmb3JtRmlsdGVyKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5wbGF0Zm9ybSA9PT0gcGxhdGZvcm1GaWx0ZXIpO1xuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuXG4gIGNvbnN0IHJvd3MgPSBnYW1lcy5tYXAoKGcpID0+IHtcbiAgICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnLCBnLmN1cnJlbmN5IHx8IFwiVVNEXCIpO1xuICAgIGNvbnN0IGRldGFpbCA9IHN0b3JlLmdldFByb2R1Y3REZXRhaWwoZy5pZCk7XG5cbiAgICBjb25zdCBzbHVnID0gZy5uYW1lXG4gICAgICAudG9VcHBlckNhc2UoKVxuICAgICAgLnJlcGxhY2UoL1teQS1aMC05XFxzXS9nLCBcIlwiKVxuICAgICAgLnRyaW0oKVxuICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgIC5zbGljZSgwLCA0KVxuICAgICAgLmpvaW4oXCItXCIpO1xuICAgIGNvbnN0IHNrdSA9IGBQUy0ke3NsdWd9LTAwMWA7XG5cbiAgICBjb25zdCBod1BsYXRmb3JtcyA9IChnLnBsYXRmb3JtcyB8fCBcIlwiKVxuICAgICAgLnNwbGl0KFwiLFwiKVxuICAgICAgLm1hcCgocCkgPT4gcC50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IHBsYXRmb3JtQXZhaWxhYmlsaXR5OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3JtcykgcGxhdGZvcm1BdmFpbGFiaWxpdHlbcF0gPSB0cnVlO1xuXG4gICAgY29uc3QgaW1hZ2VzOiBBcnJheTx7IGFsdDogc3RyaW5nOyB1cmw6IHN0cmluZyB9PiA9IFtdO1xuICAgIGlmIChnLmltYWdlVXJsKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGcuaW1hZ2VVcmwgfSk7XG4gICAgaWYgKGRldGFpbD8ubWVkaWE/Lmhlcm9VcmwgJiYgIWltYWdlcy5zb21lKCh4KSA9PiB4LnVybCA9PT0gZGV0YWlsLm1lZGlhLmhlcm9VcmwpKSB7XG4gICAgICBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGRldGFpbC5tZWRpYS5oZXJvVXJsIH0pO1xuICAgIH1cbiAgICBpZiAoZGV0YWlsPy5jYXJvdXNlbEltYWdlcykge1xuICAgICAgZm9yIChjb25zdCBpbWcgb2YgZGV0YWlsLmNhcm91c2VsSW1hZ2VzKSB7XG4gICAgICAgIGlmICghaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBpbWcpKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGltZyB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGRldGFpbD8ubWVkaWE/LnNjcmVlbnNob3RzKSB7XG4gICAgICBmb3IgKGNvbnN0IGltZyBvZiBkZXRhaWwubWVkaWEuc2NyZWVuc2hvdHMpIHtcbiAgICAgICAgaWYgKCFpbWFnZXMuc29tZSgoeCkgPT4geC51cmwgPT09IGltZykpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogaW1nIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHByaW1hcmlhID0gc2FsZT8ucHJpbWFyaWEgPz8gbnVsbDtcbiAgICBjb25zdCBzZWN1bmRhcmlhID0gc2FsZT8uc2VjdW5kYXJpYSA/PyBudWxsO1xuICAgIGNvbnN0IHByaWNpbmc6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IG51bGw+PiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3Jtcy5sZW5ndGggPyBod1BsYXRmb3JtcyA6IFtcIlBTNFwiXSkge1xuICAgICAgcHJpY2luZ1twXSA9IHsgUHJpbWFyaWE6IHByaW1hcmlhLCBTZWN1bmRhcmlhOiBzZWN1bmRhcmlhIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNrdSxcbiAgICAgIGRpc3BsYXlfbmFtZTogZy5uYW1lLFxuICAgICAgaW1hZ2VzLFxuICAgICAgcGxhdGZvcm1fYXZhaWxhYmlsaXR5OiBwbGF0Zm9ybUF2YWlsYWJpbGl0eSxcbiAgICAgIHByaWNpbmdfYnlfcGxhdGZvcm1fYW5kX2FjY291bnQ6IHByaWNpbmcsXG4gICAgICBzdG9ja19xdWFudGl0eTogMCxcbiAgICAgIGlzX2FjdGl2ZTogdHJ1ZSxcbiAgICAgIHNvcnRfb3JkZXI6IDAsXG4gICAgfTtcbiAgfSk7XG5cbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcm93cywgZXhwb3J0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSwgY291bnQ6IHJvd3MubGVuZ3RoIH0pO1xufSk7XG5cbi8vIFBPU1QgL2dhbWVzL3B1Ymxpc2gtc3VwYWJhc2UgXHUyMDE0IHVwc2VydCBzZWxlY3RlZCBnYW1lcyBkaXJlY3RseSB0byBTdXBhYmFzZVxucm91dGUoXCJQT1NUXCIsIFwiL2dhbWVzL3B1Ymxpc2gtc3VwYWJhc2VcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHN1cGFiYXNlQ2ZnID0gc3RvcmUuZ2V0U3VwYWJhc2UoKTtcbiAgaWYgKCFzdXBhYmFzZUNmZz8udXJsIHx8ICFzdXBhYmFzZUNmZz8uc2VydmljZUtleSkge1xuICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwge1xuICAgICAgZXJyb3I6IFwic3VwYWJhc2Vfbm90X2NvbmZpZ3VyZWRcIixcbiAgICAgIG1lc3NhZ2U6IFwiQ29uZmlndXJhIFN1cGFiYXNlIFVSTCB5IFNlcnZpY2UgS2V5IGVuIEFqdXN0ZXMgYW50ZXMgZGUgcHVibGljYXIuXCIsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgaWRzPzogc3RyaW5nW10gfTtcbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSAmJiBnLnNlbGVjdGVkKTtcbiAgaWYgKGJvZHkuaWRzPy5sZW5ndGgpIHtcbiAgICBjb25zdCBpZFNldCA9IG5ldyBTZXQoYm9keS5pZHMpO1xuICAgIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBpZFNldC5oYXMoZ2FtZURiS2V5KGcpKSk7XG4gIH1cblxuICBpZiAoZ2FtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcIm5vX2dhbWVzXCIsIG1lc3NhZ2U6IFwiTm8gaGF5IGp1ZWdvcyBzZWxlY2Npb25hZG9zIHBhcmEgcHVibGljYXIuXCIgfSk7XG4gIH1cblxuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBjb25zdCB0YWJsZU5hbWUgPSBzdXBhYmFzZUNmZy50YWJsZU5hbWUgfHwgXCJwbGF5c3RhdGlvbl9nYW1lc1wiO1xuXG4gIC8vIEF1dG8tZmV0Y2ggcHJvZHVjdCBkZXRhaWxzIGZvciBQU04gZ2FtZXMgbWlzc2luZyBjYWNoZWQgZGV0YWlsXG4gIGNvbnN0IHBzbkNmZyA9IHN0b3JlLmdldFBzbigpO1xuICBmb3IgKGNvbnN0IGcgb2YgZ2FtZXMpIHtcbiAgICBpZiAoZy5wbGF0Zm9ybSA9PT0gXCJwc25cIiAmJiAhc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IGZldGNoUHJvZHVjdERldGFpbChnLmlkLCBnLnN0b3JlVXJsIHx8IFwiXCIsIHBzbkNmZy5yZWdpb24pO1xuICAgICAgICBzYXZlRGV0YWlsQW5kVXBkYXRlSW1hZ2UoZywgZCk7XG4gICAgICB9IGNhdGNoIHsgLyogcHVibGlzaCB3aWxsIHVzZSBnLmltYWdlVXJsIGFzIGZhbGxiYWNrICovIH1cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJvd3MgPSBnYW1lcy5tYXAoKGcpID0+IHtcbiAgICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnLCBnLmN1cnJlbmN5IHx8IFwiVVNEXCIpO1xuICAgIGNvbnN0IGRldGFpbCA9IHN0b3JlLmdldFByb2R1Y3REZXRhaWwoZy5pZCk7XG5cbiAgICBjb25zdCBod1BsYXRmb3JtcyA9IChnLnBsYXRmb3JtcyB8fCBcIlwiKVxuICAgICAgLnNwbGl0KFwiLFwiKVxuICAgICAgLm1hcCgocCkgPT4gcC50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IHBsYXRmb3JtQXZhaWxhYmlsaXR5OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3JtcykgcGxhdGZvcm1BdmFpbGFiaWxpdHlbcF0gPSB0cnVlO1xuXG4gICAgLy8gaW1hZ2VzWzBdID0gY292ZXIgYXJ0IGZyb20gdGhlIGdyaWQgdGlsZSAoNDQwXHUwMEQ3NDQwKSwgbmV2ZXIgdGhlIGJhbm5lci5cbiAgICBjb25zdCBpbWFnZXM6IEFycmF5PHsgYWx0OiBzdHJpbmc7IHVybDogc3RyaW5nIH0+ID0gW107XG4gICAgaWYgKGcuaW1hZ2VVcmwpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogZy5pbWFnZVVybCB9KTtcbiAgICBpZiAoZGV0YWlsPy5tZWRpYT8uaGVyb1VybCAmJiAhaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBkZXRhaWwubWVkaWEuaGVyb1VybCkpIHtcbiAgICAgIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogZGV0YWlsLm1lZGlhLmhlcm9VcmwgfSk7XG4gICAgfVxuICAgIGlmIChkZXRhaWw/LmNhcm91c2VsSW1hZ2VzKSB7XG4gICAgICBmb3IgKGNvbnN0IGltZyBvZiBkZXRhaWwuY2Fyb3VzZWxJbWFnZXMpIHtcbiAgICAgICAgaWYgKCFpbWFnZXMuc29tZSgoeCkgPT4geC51cmwgPT09IGltZykpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogaW1nIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHByaW1hcmlhID0gc2FsZT8ucHJpbWFyaWEgPz8gbnVsbDtcbiAgICBjb25zdCBzZWN1bmRhcmlhID0gc2FsZT8uc2VjdW5kYXJpYSA/PyBudWxsO1xuICAgIGNvbnN0IHByaWNpbmc6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IG51bGw+PiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3Jtcy5sZW5ndGggPyBod1BsYXRmb3JtcyA6IFtcIlBTNFwiXSkge1xuICAgICAgcHJpY2luZ1twXSA9IHsgUHJpbWFyaWE6IHByaW1hcmlhLCBTZWN1bmRhcmlhOiBzZWN1bmRhcmlhIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNrdTogZ2VuZXJhdGVTa3UoZy5uYW1lKSxcbiAgICAgIGRpc3BsYXlfbmFtZTogZy5uYW1lLFxuICAgICAgaW1hZ2VzLFxuICAgICAgcGxhdGZvcm1fYXZhaWxhYmlsaXR5OiBwbGF0Zm9ybUF2YWlsYWJpbGl0eSxcbiAgICAgIHByaWNpbmdfYnlfcGxhdGZvcm1fYW5kX2FjY291bnQ6IHByaWNpbmcsXG4gICAgICBzdG9ja19xdWFudGl0eTogMCxcbiAgICAgIGlzX2FjdGl2ZTogdHJ1ZSxcbiAgICAgIHNvcnRfb3JkZXI6IDAsXG4gICAgfTtcbiAgfSk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBlbmRwb2ludCA9IGAke3N1cGFiYXNlQ2ZnLnVybH0vcmVzdC92MS8ke3RhYmxlTmFtZX0/b25fY29uZmxpY3Q9c2t1YDtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGVuZHBvaW50LCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBhcGlrZXk6IHN1cGFiYXNlQ2ZnLnNlcnZpY2VLZXksXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtzdXBhYmFzZUNmZy5zZXJ2aWNlS2V5fWAsXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICBQcmVmZXI6IFwicmVzb2x1dGlvbj1tZXJnZS1kdXBsaWNhdGVzXCIsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocm93cyksXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICAgIGVycm9yOiBcInN1cGFiYXNlX2Vycm9yXCIsXG4gICAgICAgIG1lc3NhZ2U6IGBTdXBhYmFzZSByZXNwb25kaVx1MDBGMyAke3Jlc3BvbnNlLnN0YXR1c306ICR7dGV4dC5zbGljZSgwLCAzMDApfWAsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBNYXJrIGdhbWVzIGFzIHB1Ymxpc2hlZCBsb2NhbGx5XG4gICAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgICBzdG9yZS5wYXRjaEdhbWUoZ2FtZURiS2V5KGcpLCB7IHB1Ymxpc2hlZDogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgeyBwdWJsaXNoZWQ6IHJvd3MubGVuZ3RoLCBza3VzOiByb3dzLm1hcCgocikgPT4gci5za3UpIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgZXJyb3I6IFwic3VwYWJhc2VfbmV0d29ya19lcnJvclwiLFxuICAgICAgbWVzc2FnZTogYEVycm9yIGRlIGNvbmV4aVx1MDBGM246ICR7KGVyciBhcyBFcnJvcikubWVzc2FnZX1gLFxuICAgIH0pO1xuICB9XG59KTtcblxuLy8gUE9TVCAvZ2FtZXMvZW5yaWNoIFx1MjAxNCBidWxrLWZldGNoIHByb2R1Y3QgZGV0YWlscyBmb3Igc2VsZWN0ZWQgZ2FtZXMgdGhhdCBkb24ndCBoYXZlIHRoZW0geWV0XG4vLyBCb2R5OiB7IHBsYXRmb3JtPzogc3RyaW5nLCBsaW1pdD86IG51bWJlciB9XG5yb3V0ZShcIlBPU1RcIiwgXCIvZ2FtZXMvZW5yaWNoXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgcGxhdGZvcm0/OiBzdHJpbmc7IGxpbWl0PzogbnVtYmVyIH07XG4gIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oYm9keS5saW1pdCA/PyAyMCwgNTApO1xuICBjb25zdCBnYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpLmZpbHRlcigoZykgPT4ge1xuICAgIGlmICghZy5hY3RpdmUgfHwgIWcuc2VsZWN0ZWQpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYm9keS5wbGF0Zm9ybSAmJiBnLnBsYXRmb3JtICE9PSBib2R5LnBsYXRmb3JtKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHN0b3JlLmdldFByb2R1Y3REZXRhaWwoZy5pZCkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gZy5wbGF0Zm9ybSA9PT0gXCJwc25cIjtcbiAgfSkuc2xpY2UoMCwgbGltaXQpO1xuXG4gIGNvbnN0IHJlc3VsdHM6IEFycmF5PHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBvazogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfT4gPSBbXTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNmZyA9IHN0b3JlLmdldFBzbigpO1xuICAgICAgY29uc3QgZGV0YWlsID0gYXdhaXQgZmV0Y2hQcm9kdWN0RGV0YWlsKGcuaWQsIGcuc3RvcmVVcmwgfHwgXCJcIiwgY2ZnLnJlZ2lvbik7XG4gICAgICBzYXZlRGV0YWlsQW5kVXBkYXRlSW1hZ2UoZywgZGV0YWlsKTtcbiAgICAgIHJlc3VsdHMucHVzaCh7IGlkOiBnLmlkLCBuYW1lOiBnLm5hbWUsIG9rOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7IGlkOiBnLmlkLCBuYW1lOiBnLm5hbWUsIG9rOiBmYWxzZSwgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICAgIH1cbiAgICAvLyBSYXRlLWxpbWl0IHRvIGF2b2lkIGhhbW1lcmluZyBQU05cbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNTAwKSk7XG4gIH1cblxuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBlbnJpY2hlZDogcmVzdWx0cy5maWx0ZXIoKHIpID0+IHIub2spLmxlbmd0aCwgdG90YWw6IHJlc3VsdHMubGVuZ3RoLCByZXN1bHRzIH0pO1xufSk7XG5cbi8vIEdFVCAvc2V0dGluZ3NcbnJvdXRlKFwiR0VUXCIsIFwiL3NldHRpbmdzXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICBwcmljaW5nOiBzdG9yZS5nZXRTZXR0aW5ncygpLFxuICAgIHBzbjogc3RvcmUuZ2V0UHNuKCksXG4gICAgc291cmNlczogc3RvcmUuZ2V0U291cmNlcygpLFxuICAgIHN1cGFiYXNlOiBzdG9yZS5nZXRTdXBhYmFzZSgpLFxuICAgIGhpdFB1Ymxpc2hlcnM6IHN0b3JlLmdldEhpdFB1Ymxpc2hlcnMoKSxcbiAgfSk7XG59KTtcblxuLy8gUFVUIC9zZXR0aW5nc1xucm91dGUoXCJQVVRcIiwgXCIvc2V0dGluZ3NcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMge1xuICAgIHByaWNpbmc/OiBQYXJ0aWFsPFJldHVyblR5cGU8dHlwZW9mIHN0b3JlLmdldFNldHRpbmdzPj47XG4gICAgcHNuPzogUGFydGlhbDxSZXR1cm5UeXBlPHR5cGVvZiBzdG9yZS5nZXRQc24+PjtcbiAgICBzb3VyY2VzPzogUHJvdmlkZXJTb3VyY2VbXTtcbiAgICBzdXBhYmFzZT86IFN1cGFiYXNlQ29uZmlnIHwgbnVsbDtcbiAgICBoaXRQdWJsaXNoZXJzPzogc3RyaW5nW107XG4gIH07XG4gIGNvbnN0IHByaWNpbmcgPSBib2R5LnByaWNpbmcgPyBzdG9yZS51cGRhdGVTZXR0aW5ncyhib2R5LnByaWNpbmcpIDogc3RvcmUuZ2V0U2V0dGluZ3MoKTtcbiAgY29uc3QgcHNuID0gYm9keS5wc24gPyBzdG9yZS51cGRhdGVQc24oYm9keS5wc24pIDogc3RvcmUuZ2V0UHNuKCk7XG4gIGlmIChib2R5LnNvdXJjZXMpIHN0b3JlLnNldFNvdXJjZXMoYm9keS5zb3VyY2VzKTtcbiAgaWYgKGJvZHkuc3VwYWJhc2UgIT09IHVuZGVmaW5lZCkgc3RvcmUuc2V0U3VwYWJhc2UoYm9keS5zdXBhYmFzZSk7XG4gIGlmIChib2R5LmhpdFB1Ymxpc2hlcnMpIHN0b3JlLnNldEhpdFB1Ymxpc2hlcnMoYm9keS5oaXRQdWJsaXNoZXJzKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICBwcmljaW5nLFxuICAgIHBzbixcbiAgICBzb3VyY2VzOiBzdG9yZS5nZXRTb3VyY2VzKCksXG4gICAgc3VwYWJhc2U6IHN0b3JlLmdldFN1cGFiYXNlKCksXG4gICAgaGl0UHVibGlzaGVyczogc3RvcmUuZ2V0SGl0UHVibGlzaGVycygpLFxuICB9KTtcbn0pO1xuXG4vLyBHRVQgL3BsYXRmb3JtcyBcdTIwMTQgc3RhdGljIG1ldGFkYXRhIGFib3V0IGF2YWlsYWJsZSBwbGF0Zm9ybXMgKyByZWdpb25zXG5yb3V0ZShcIkdFVFwiLCBcIi9wbGF0Zm9ybXNcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBsYWJlbHM6IFBMQVRGT1JNX0xBQkVMUywgcmVnaW9uczogUExBVEZPUk1fUkVHSU9OUyB9KTtcbn0pO1xuXG4vLyBQT1NUIC9tb2NrL2NsZWFyIFx1MjAxNCByZW1vdmUgYWxsIGdhbWVzXG5yb3V0ZShcIlBPU1RcIiwgXCIvbW9jay9jbGVhclwiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCk7XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgIHN0b3JlLnVwc2VydEdhbWUoeyAuLi5nLCBhY3RpdmU6IGZhbHNlIH0pO1xuICB9XG4gIC8vIEFsc28gd2lwZSBlbnRyaWVzIGZ1bGx5IGJ5IHJlLXdyaXRpbmcgdGhlIGZpbGU6XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykgc3RvcmUucGF0Y2hHYW1lKGcuaWQsIHsgYWN0aXZlOiBmYWxzZSB9KTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgY2xlYXJlZDogZ2FtZXMubGVuZ3RoIH0pO1xufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNvdXJjZXMgPSBzdG9yZS5nZXRTb3VyY2VzKCkuZmlsdGVyKChzKSA9PiBzLmVuYWJsZWQpO1xuICBjb25zdCBub3dJc28gPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSBnZXRQcm92aWRlcihzb3VyY2UucGxhdGZvcm0pO1xuICAgICAgY29uc3Qgc2VlbktleXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGNvbnN0IGVmZlNvdXJjZSA9IHsgLi4uc291cmNlIH07XG4gICAgICBpZiAoc291cmNlLnBsYXRmb3JtID09PSBcInBzblwiICYmICFzb3VyY2UuY2F0ZWdvcnlJZCkge1xuICAgICAgICBlZmZTb3VyY2UuY2F0ZWdvcnlJZCA9IHN0b3JlLmdldFBzbigpLmRlYWxzQ2F0ZWdvcnlJZDtcbiAgICAgIH1cbiAgICAgIGZvciBhd2FpdCAoY29uc3QgZGVhbCBvZiBwcm92aWRlci5mZXRjaERlYWxzKGVmZlNvdXJjZSkpIHtcbiAgICAgICAgY29uc3QgZGJLZXkgPSBgJHtzb3VyY2UucGxhdGZvcm19OiR7c291cmNlLnJlZ2lvbn06JHtkZWFsLmlkfWA7XG4gICAgICAgIHNlZW5LZXlzLmFkZChkYktleSk7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gc3RvcmUuZ2V0R2FtZUJ5Q29tcG9zaXRlKHNvdXJjZS5wbGF0Zm9ybSwgc291cmNlLnJlZ2lvbiwgZGVhbC5pZCk7XG4gICAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgICBzdG9yZS51cHNlcnRHYW1lKHtcbiAgICAgICAgICAgIGlkOiBkZWFsLmlkLCBwbGF0Zm9ybTogc291cmNlLnBsYXRmb3JtLCByZWdpb246IHNvdXJjZS5yZWdpb24sXG4gICAgICAgICAgICBuYW1lOiBkZWFsLm5hbWUsIGltYWdlVXJsOiBkZWFsLmltYWdlVXJsLCBzdG9yZVVybDogZGVhbC5zdG9yZVVybCxcbiAgICAgICAgICAgIHBsYXRmb3JtczogZGVhbC5oYXJkd2FyZVBsYXRmb3JtcywgY3VycmVuY3k6IGRlYWwuY3VycmVuY3ksXG4gICAgICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGRlYWwucHJpY2VPcmlnaW5hbENlbnRzLCBwcmljZURpc2NvdW50ZWRDZW50czogZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICAgICAgICAgIGRpc2NvdW50UGVyY2VudDogZGVhbC5kaXNjb3VudFBlcmNlbnQsIGRpc2NvdW50RW5kQXQ6IGRlYWwuZGlzY291bnRFbmRBdCxcbiAgICAgICAgICAgIHNlbGVjdGVkOiBmYWxzZSwgcHVibGlzaGVkOiBmYWxzZSwgbm90ZXM6IFwiXCIsIHlvdXR1YmVVcmw6IFwiXCIsIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIGZpcnN0U2VlbkF0OiBub3dJc28sIGxhc3RTZWVuQXQ6IG5vd0lzbywgdXBkYXRlZEF0OiBub3dJc28sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcmUudXBzZXJ0R2FtZSh7XG4gICAgICAgICAgICAuLi5leGlzdGluZywgbmFtZTogZGVhbC5uYW1lIHx8IGV4aXN0aW5nLm5hbWUsIGltYWdlVXJsOiBkZWFsLmltYWdlVXJsIHx8IGV4aXN0aW5nLmltYWdlVXJsLFxuICAgICAgICAgICAgc3RvcmVVcmw6IGRlYWwuc3RvcmVVcmwgfHwgZXhpc3Rpbmcuc3RvcmVVcmwsIHBsYXRmb3JtczogZGVhbC5oYXJkd2FyZVBsYXRmb3JtcyxcbiAgICAgICAgICAgIGN1cnJlbmN5OiBkZWFsLmN1cnJlbmN5LCBwcmljZU9yaWdpbmFsQ2VudHM6IGRlYWwucHJpY2VPcmlnaW5hbENlbnRzLFxuICAgICAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMsIGRpc2NvdW50UGVyY2VudDogZGVhbC5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgICAgICBkaXNjb3VudEVuZEF0OiBkZWFsLmRpc2NvdW50RW5kQXQsIGFjdGl2ZTogdHJ1ZSwgbGFzdFNlZW5BdDogbm93SXNvLCB1cGRhdGVkQXQ6IG5vd0lzbyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RvcmUubWFya0luYWN0aXZlSWZNaXNzaW5nKHNlZW5LZXlzLCBzb3VyY2UucGxhdGZvcm0sIHNvdXJjZS5yZWdpb24pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtzY2hlZHVsZXJdWyR7c291cmNlLnBsYXRmb3JtfS8ke3NvdXJjZS5yZWdpb259XSAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuICByZWNvbXB1dGVNYXRjaGVzKCk7XG59XG5cbmZ1bmN0aW9uIHJlY29tcHV0ZU1hdGNoZXMoKTogdm9pZCB7XG4gIGNvbnN0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG4gIGNvbnN0IHByb2R1Y3RzID0gc3RvcmUuZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKCk7XG4gIGNvbnN0IG1hdGNoZXMgPSBtYXRjaEdhbWVzKGdhbWVzLCBwcm9kdWN0cyk7XG4gIHN0b3JlLnNldENvbXBldGl0b3JNYXRjaGVzKG1hdGNoZXMpO1xufVxuXG4vLyBHRVQgL2NvbXBldGl0b3JzIFx1MjAxNCBsaXN0IHN0b3JlcyArIGxhc3QgcmVmcmVzaCArIG1hdGNoIHN0YXRzXG5yb3V0ZShcIkdFVFwiLCBcIi9jb21wZXRpdG9yc1wiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGNvbXBldGl0b3JzID0gc3RvcmUuZ2V0Q29tcGV0aXRvcnMoKTtcbiAgY29uc3QgcmVmcmVzaGVkQXQgPSBzdG9yZS5nZXRDb21wZXRpdG9yUmVmcmVzaGVkQXQoKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICBjb21wZXRpdG9yczogY29tcGV0aXRvcnMubWFwKChjKSA9PiAoe1xuICAgICAgLi4uYyxcbiAgICAgIHJlZnJlc2hlZEF0OiByZWZyZXNoZWRBdFtjLmtleV0gPz8gbnVsbCxcbiAgICAgIHByb2R1Y3RDb3VudDogc3RvcmVcbiAgICAgICAgLmdldEFsbENvbXBldGl0b3JQcm9kdWN0cyhmYWxzZSlcbiAgICAgICAgLmZpbHRlcigocCkgPT4gcC5zdG9yZUtleSA9PT0gYy5rZXkpLmxlbmd0aCxcbiAgICB9KSksXG4gIH0pO1xufSk7XG5cbi8vIFBVVCAvY29tcGV0aXRvcnMgXHUyMDE0IHJlcGxhY2UgdGhlIGZ1bGwgbGlzdCAodXNlZCBmcm9tIEFqdXN0ZXMpXG5yb3V0ZShcIlBVVFwiLCBcIi9jb21wZXRpdG9yc1wiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7IGNvbXBldGl0b3JzPzogQ29tcGV0aXRvckNvbmZpZ1tdIH07XG4gIGlmICghQXJyYXkuaXNBcnJheShib2R5LmNvbXBldGl0b3JzKSkge1xuICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogXCJiYWRfcmVxdWVzdFwiLCBtZXNzYWdlOiBcImNvbXBldGl0b3JzW10gcmVxdWlyZWRcIiB9KTtcbiAgfVxuICBjb25zdCBjbGVhbjogQ29tcGV0aXRvckNvbmZpZ1tdID0gYm9keS5jb21wZXRpdG9yc1xuICAgIC5maWx0ZXIoKGMpID0+IGMgJiYgdHlwZW9mIGMua2V5ID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBjLmRvbWFpbiA9PT0gXCJzdHJpbmdcIilcbiAgICAubWFwKChjKSA9PiAoe1xuICAgICAga2V5OiBjLmtleS50cmltKCksXG4gICAgICBsYWJlbDogKGMubGFiZWwgfHwgYy5rZXkpLnRyaW0oKSxcbiAgICAgIGRvbWFpbjogYy5kb21haW4ucmVwbGFjZSgvXmh0dHBzPzpcXC9cXC8vLCBcIlwiKS5yZXBsYWNlKC9cXC8uKiQvLCBcIlwiKS50cmltKCksXG4gICAgICB0eXBlOiAoW1wic2hvcGlmeVwiLCBcIndvb2NvbW1lcmNlXCIsIFwiaHRtbFwiLCBcImp1bXBzZWxsZXJcIiwgXCJhdXRvXCJdLmluY2x1ZGVzKGMudHlwZSkgPyBjLnR5cGUgOiBcImF1dG9cIiksXG4gICAgICBlbmFibGVkOiBjLmVuYWJsZWQgIT09IGZhbHNlLFxuICAgIH0pKTtcbiAgc3RvcmUuc2V0Q29tcGV0aXRvcnMoY2xlYW4pO1xuICByZWNvbXB1dGVNYXRjaGVzKCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGNvbXBldGl0b3JzOiBzdG9yZS5nZXRDb21wZXRpdG9ycygpIH0pO1xufSk7XG5cbi8vIFBPU1QgL2NvbXBldGl0b3JzL3JlZnJlc2ggXHUyMDE0IHNjcmFwZSBhbGwgZW5hYmxlZCBzdG9yZXMgYW5kIHJlY29tcHV0ZSBtYXRjaGVzXG5yb3V0ZShcIlBPU1RcIiwgXCIvY29tcGV0aXRvcnMvcmVmcmVzaFwiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGNvbXBldGl0b3JzID0gc3RvcmUuZ2V0Q29tcGV0aXRvcnMoKS5maWx0ZXIoKGMpID0+IGMuZW5hYmxlZCk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3QgcmVzdWx0czogQXJyYXk8eyBrZXk6IHN0cmluZzsgbGFiZWw6IHN0cmluZzsgY291bnQ6IG51bWJlcjsgZXJyb3I/OiBzdHJpbmcgfT4gPSBbXTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICBjb21wZXRpdG9ycy5tYXAoYXN5bmMgKGMpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgZmV0Y2hDb21wZXRpdG9yKGMpO1xuICAgICAgICBzdG9yZS5zZXRDb21wZXRpdG9yUHJvZHVjdHMoYy5rZXksIHByb2R1Y3RzLCBub3cpO1xuICAgICAgICByZXN1bHRzLnB1c2goeyBrZXk6IGMua2V5LCBsYWJlbDogYy5sYWJlbCwgY291bnQ6IHByb2R1Y3RzLmxlbmd0aCB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc3QgbXNnID1cbiAgICAgICAgICBlIGluc3RhbmNlb2YgQ29tcGV0aXRvckZldGNoRXJyb3JcbiAgICAgICAgICAgID8gZS5tZXNzYWdlXG4gICAgICAgICAgICA6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiZXJyb3JcIjtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHsga2V5OiBjLmtleSwgbGFiZWw6IGMubGFiZWwsIGNvdW50OiAwLCBlcnJvcjogbXNnIH0pO1xuICAgICAgfVxuICAgIH0pXG4gICk7XG5cbiAgcmVjb21wdXRlTWF0Y2hlcygpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyByZWZyZXNoZWRBdDogbm93LCByZXN1bHRzIH0pO1xufSk7XG5cbi8vIEdFVCAvcHMtcGx1cyBcdTIwMTQgUFMgUGx1cyBtZW1iZXJzaGlwIHByaWNlcyB2cyBjb21wZXRpdG9yc1xucm91dGUoXCJHRVRcIiwgXCIvcHMtcGx1c1wiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG4gIGNvbnN0IHByb2R1Y3RzID0gc3RvcmUuZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKCk7XG4gIGNvbnN0IHNjcmFwZWQgPSBzdG9yZS5nZXRQc1BsdXNQcmljZXMoKSBhcyBTY3JhcGVkUGx1c1ByaWNlcyB8IG51bGw7XG4gIGNvbnN0IHBsYW5zID0gbWF0Y2hQbGFuc1dpdGhDb21wZXRpdG9ycyhwcm9kdWN0cywgY2ZnLCBzY3JhcGVkKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcGxhbnMsIHNjcmFwZWRBdDogc2NyYXBlZD8uc2NyYXBlZEF0ID8/IG51bGwgfSk7XG59KTtcblxuLy8gUE9TVCAvcHMtcGx1cy9yZWZyZXNoIFx1MjAxNCBzY3JhcGUgY3VycmVudCBQUyBQbHVzIHByaWNlcyBmcm9tIHBsYXlzdGF0aW9uLmNvbVxucm91dGUoXCJQT1NUXCIsIFwiL3BzLXBsdXMvcmVmcmVzaFwiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2NyYXBlUHNQbHVzUHJpY2VzKCk7XG4gICAgc3RvcmUuc2V0UHNQbHVzUHJpY2VzKHJlc3VsdCk7XG4gICAgc2VuZEpzb24ocmVzLCAyMDAsIHJlc3VsdCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJzY3JhcGVfZmFpbGVkXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gUE9TVCAvZ2FtZXMvbG9va3VwIFx1MjAxNCBidWxrIGZ1enp5IHNlYXJjaDogcmVjZWl2ZXMgYSBsaXN0IG9mIHtuYW1lLCBwcmljZVVzZD99XG4vLyBpdGVtcyAocGFyc2VkIGZyb20gcGFzdGVkIGNvbXBldGl0b3IgdGV4dCkgYW5kIG1hdGNoZXMgZWFjaCBhZ2FpbnN0IHRoZSBnYW1lIERCLlxucm91dGUoXCJQT1NUXCIsIFwiL2dhbWVzL2xvb2t1cFwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XG4gIGNvbnN0IGl0ZW1zOiBBcnJheTx7IG5hbWU6IHN0cmluZzsgcHJpY2VNaW46IG51bWJlciB8IG51bGw7IHByaWNlTWF4OiBudW1iZXIgfCBudWxsIH0+ID1cbiAgICBib2R5Py5pdGVtcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGl0ZW1zKSB8fCAhaXRlbXMubGVuZ3RoKSB7XG4gICAgc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwiYmFkX3JlcXVlc3RcIiwgbWVzc2FnZTogXCJpdGVtc1tdIHJlcXVpcmVkXCIgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0U2V0dGluZ3MoKTtcbiAgY29uc3QgYWxsR2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgY29uc3QgZ2FtZUluZGV4ID0gYWxsR2FtZXMubWFwKChnKSA9PiAoe1xuICAgIGdhbWU6IGcsXG4gICAgdG9rZW5zOiB0b2tlbml6ZShnLm5hbWUpLFxuICB9KSk7XG5cbiAgY29uc3QgVEhSRVNIT0xEID0gMC40MDtcbiAgY29uc3QgcmVzdWx0cyA9IGl0ZW1zLm1hcCgoaXRlbSkgPT4ge1xuICAgIGNvbnN0IHF1ZXJ5VG9rZW5zID0gdG9rZW5pemUoaXRlbS5uYW1lKTtcbiAgICBsZXQgYmVzdEdhbWU6IEdhbWUgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgYmVzdFNjb3JlID0gMDtcblxuICAgIGZvciAoY29uc3QgeyBnYW1lLCB0b2tlbnMgfSBvZiBnYW1lSW5kZXgpIHtcbiAgICAgIGlmICghdG9rZW5zLmxlbmd0aCkgY29udGludWU7XG4gICAgICBjb25zdCBzY29yZSA9IHNpbWlsYXJpdHkocXVlcnlUb2tlbnMsIHRva2Vucyk7XG4gICAgICBpZiAoc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgIGJlc3RHYW1lID0gZ2FtZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVkID0gYmVzdFNjb3JlID49IFRIUkVTSE9MRCAmJiBiZXN0R2FtZTtcbiAgICBjb25zdCBvdXQgPSBtYXRjaGVkID8gdG9HYW1lT3V0KGJlc3RHYW1lISwgY2ZnKSA6IG51bGw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcXVlcnk6IGl0ZW0ubmFtZSxcbiAgICAgIHByaWNlTWluOiBpdGVtLnByaWNlTWluLFxuICAgICAgcHJpY2VNYXg6IGl0ZW0ucHJpY2VNYXgsXG4gICAgICBtYXRjaFNjb3JlOiBNYXRoLnJvdW5kKGJlc3RTY29yZSAqIDEwMCkgLyAxMDAsXG4gICAgICBmb3VuZDogISFtYXRjaGVkLFxuICAgICAgZ2FtZTogb3V0LFxuICAgIH07XG4gIH0pO1xuXG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IHJlc3VsdHMgfSk7XG59KTtcblxuLy8gR0VUIC9kZWJ1Zy9wcm9kdWN0LXR5cGVzIFx1MjAxNCBvbmUtc2hvdCByZWNvbm5haXNzYW5jZSB1c2VkIHRvIGRlc2lnbiB0aGVcbi8vIERMQy9hZGQtb24gZmlsdGVyLiBSdW5zIGEgZnVsbCBQU04gc2NyYXBlIGFuZCByZXBvcnRzIGV2ZXJ5IGNsYXNzaWZpY2F0aW9uXG4vLyArIHByb2R1Y3RUeXBlIGNvbWJvIGl0IHNlZXMsIHBsdXMgYWxsIG9ic2VydmVkIHRvcC1sZXZlbCBrZXlzLiBUaGUgcmVzcG9uc2Vcbi8vIGlzIHNtYWxsIChhIGNvdXBsZSBvZiBLQiksIHRoZSBzY3JhcGUgaXRzZWxmIGlzIHRoZSBzbG93IHBhcnQuXG5yb3V0ZShcIkdFVFwiLCBcIi9kZWJ1Zy9wcm9kdWN0LXR5cGVzXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjZmcgPSBzdG9yZS5nZXRQc24oKTtcbiAgICBjb25zdCByZXBvcnQgPSBhd2FpdCBpbnNwZWN0UHJvZHVjdFR5cGVzKGNmZyk7XG4gICAgc2VuZEpzb24ocmVzLCAyMDAsIHJlcG9ydCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIFBzbkFwaUVycm9yKSB7XG4gICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDIsIHtcbiAgICAgICAgZXJyb3I6IFwicHNuX2FwaV9lcnJvclwiLFxuICAgICAgICBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJpbnRlcm5hbFwiLCBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSB9KTtcbiAgfVxufSk7XG5cbi8vIEdFVCAvZ2FtZXMvOmlkL2RldGFpbCBcdTIwMTQgY2FjaGVkIHByb2R1Y3QgZGV0YWlsIChpbWFnZXJ5LCBkZXNjcmlwdGlvblx1MjAyNikuXG4vLyBSZXR1cm5zIDIwNCBObyBDb250ZW50IGlmIHdlIGhhdmVuJ3QgZmV0Y2hlZCBpdCB5ZXQ7IHRoZSBjbGllbnQgc2hvdWxkXG4vLyB0aGVuIFBPU1QgL2dhbWVzLzppZC9kZXRhaWwvcmVmcmVzaCB0byB0cmlnZ2VyIHRoZSBzY3JhcGUuXG5yb3V0ZShcIkdFVFwiLCBcIi9nYW1lcy86aWQvZGV0YWlsXCIsIGFzeW5jIChfcmVxLCByZXMsIHBhcmFtcykgPT4ge1xuICBjb25zdCBkZXRhaWwgPSBzdG9yZS5nZXRQcm9kdWN0RGV0YWlsKHBhcmFtcy5pZCk7XG4gIGlmICghZGV0YWlsKSB7XG4gICAgcmVzLnN0YXR1c0NvZGUgPSAyMDQ7XG4gICAgcmVzLmVuZCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBzZW5kSnNvbihyZXMsIDIwMCwgZGV0YWlsKTtcbn0pO1xuXG4vLyBQT1NUIC9nYW1lcy86aWQvZGV0YWlsL3JlZnJlc2ggXHUyMDE0IHNjcmFwZSB0aGUgcHJvZHVjdCBwYWdlIGFuZCBjYWNoZSBpdC5cbnJvdXRlKFwiUE9TVFwiLCBcIi9nYW1lcy86aWQvZGV0YWlsL3JlZnJlc2hcIiwgYXN5bmMgKF9yZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGdhbWUgPSBzdG9yZS5nZXRHYW1lKHBhcmFtcy5pZCk7XG4gIGlmICghZ2FtZSkgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIm5vdF9mb3VuZFwiIH0pO1xuICB0cnkge1xuICAgIGNvbnN0IGNmZyA9IHN0b3JlLmdldFBzbigpO1xuICAgIGNvbnN0IGRldGFpbCA9IGF3YWl0IGZldGNoUHJvZHVjdERldGFpbChcbiAgICAgIGdhbWUuaWQsXG4gICAgICBnYW1lLnN0b3JlVXJsIHx8IFwiXCIsXG4gICAgICBjZmcucmVnaW9uXG4gICAgKTtcbiAgICBzYXZlRGV0YWlsQW5kVXBkYXRlSW1hZ2UoZ2FtZSwgZGV0YWlsKTtcbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgZGV0YWlsKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJwc25fYXBpX2Vycm9yXCIsXG4gICAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcImludGVybmFsXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gR0VUIC93YXRjaGxpc3QgXHUyMDE0IHRyYWNrZWQgZ2FtZXMgKyBjdXJyZW50IHN0YXR1cyBzbmFwc2hvdC5cbnJvdXRlKFwiR0VUXCIsIFwiL3dhdGNobGlzdFwiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGl0ZW1zOiBzdG9yZS5saXN0V2F0Y2hsaXN0KCkgfSk7XG59KTtcblxuLy8gUE9TVCAvd2F0Y2hsaXN0IFx1MjAxNCBhZGQgYSBnYW1lIGJ5IFVSTCBvciBpZC4gQm9keTogeyBpbnB1dDogc3RyaW5nLCBub3Rlcz8gfVxucm91dGUoXCJQT1NUXCIsIFwiL3dhdGNobGlzdFwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7IGlucHV0Pzogc3RyaW5nOyBub3Rlcz86IHN0cmluZyB9O1xuICBjb25zdCBpZCA9IGV4dHJhY3RQc25JZChib2R5LmlucHV0ID8/IFwiXCIpO1xuICBpZiAoIWlkKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7XG4gICAgICBlcnJvcjogXCJiYWRfaW5wdXRcIixcbiAgICAgIG1lc3NhZ2U6IFwiUGVnXHUwMEUxIGxhIFVSTCBkZWwgcHJvZHVjdG8gZW4gUFNOIG8gdW4gSUQgdGlwbyBVUFhYWFgtQ1VTQVhYWFhYXzAwLVx1MjAyNlwiLFxuICAgIH0pO1xuICB9XG4gIGNvbnN0IGV4aXN0aW5nID0gc3RvcmUuZ2V0V2F0Y2hlZChpZCk7XG4gIGlmIChleGlzdGluZykgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCBleGlzdGluZyk7XG5cbiAgY29uc3QgZ2FtZSA9IHN0b3JlLmdldEdhbWUoaWQpO1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIGNvbnN0IGVudHJ5OiBXYXRjaGVkR2FtZSA9IHtcbiAgICBpZCxcbiAgICBuYW1lOiBnYW1lPy5uYW1lIHx8IGlkLFxuICAgIGFkZGVkQXQ6IG5vdyxcbiAgICBsYXN0U3RhdHVzOiBnYW1lPy5hY3RpdmUgJiYgZ2FtZS5kaXNjb3VudFBlcmNlbnQgPiAwID8gXCJvbl9zYWxlXCIgOiBnYW1lID8gXCJvZmZfc2FsZVwiIDogXCJ1bnNlZW5cIixcbiAgICBsYXN0U2Vlbk9uU2FsZUF0OlxuICAgICAgZ2FtZT8uYWN0aXZlICYmIGdhbWUuZGlzY291bnRQZXJjZW50ID4gMCA/IG5vdyA6IG51bGwsXG4gICAgbGFzdFByaWNlQ2VudHM6IGdhbWU/LnByaWNlRGlzY291bnRlZENlbnRzID8/IG51bGwsXG4gICAgbGFzdERpc2NvdW50UGVyY2VudDogZ2FtZT8uZGlzY291bnRQZXJjZW50ID8/IDAsXG4gICAgbm90ZXM6IChib2R5Lm5vdGVzID8/IFwiXCIpLnRyaW0oKSxcbiAgfTtcbiAgc2VuZEpzb24ocmVzLCAyMDEsIHN0b3JlLnVwc2VydFdhdGNoZWQoZW50cnkpKTtcbn0pO1xuXG4vLyBQQVRDSCAvd2F0Y2hsaXN0LzppZCBcdTIwMTQgZWRpdCBub3RlcyBvciBuYW1lLlxucm91dGUoXCJQQVRDSFwiLCBcIi93YXRjaGxpc3QvOmlkXCIsIGFzeW5jIChyZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgUGFydGlhbDxQaWNrPFdhdGNoZWRHYW1lLCBcIm5vdGVzXCIgfCBcIm5hbWVcIj4+O1xuICBjb25zdCBwYXRjaDogUGFydGlhbDxXYXRjaGVkR2FtZT4gPSB7fTtcbiAgaWYgKHR5cGVvZiBib2R5Lm5vdGVzID09PSBcInN0cmluZ1wiKSBwYXRjaC5ub3RlcyA9IGJvZHkubm90ZXM7XG4gIGlmICh0eXBlb2YgYm9keS5uYW1lID09PSBcInN0cmluZ1wiICYmIGJvZHkubmFtZS50cmltKCkpIHBhdGNoLm5hbWUgPSBib2R5Lm5hbWUudHJpbSgpO1xuICBjb25zdCB1cGRhdGVkID0gc3RvcmUucGF0Y2hXYXRjaGVkKHBhcmFtcy5pZCwgcGF0Y2gpO1xuICBpZiAoIXVwZGF0ZWQpIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiB9KTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHVwZGF0ZWQpO1xufSk7XG5cbi8vIERFTEVURSAvd2F0Y2hsaXN0LzppZFxucm91dGUoXCJERUxFVEVcIiwgXCIvd2F0Y2hsaXN0LzppZFwiLCBhc3luYyAoX3JlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3Qgb2sgPSBzdG9yZS5yZW1vdmVXYXRjaGVkKHBhcmFtcy5pZCk7XG4gIGlmICghb2spIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiB9KTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcmVtb3ZlZDogdHJ1ZSB9KTtcbn0pO1xuXG4vLyBHRVQgL2dhbWVzLzppZC9tYXRjaGVzIFx1MjAxNCBhbGwgY29tcGV0aXRvciBtYXRjaGVzIGZvciBhIGdhbWUgKGZvciBwb3BvdmVycylcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzLzppZC9tYXRjaGVzXCIsIGFzeW5jIChfcmVxLCByZXMsIHBhcmFtcykgPT4ge1xuICBjb25zdCBtYXRjaGVzOiBDb21wZXRpdG9yTWF0Y2hbXSA9IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKHBhcmFtcy5pZCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IG1hdGNoZXMgfSk7XG59KTtcblxuLy8gUE9TVCAvZXhjaGFuZ2UvcmVmcmVzaCBcdTIwMTQgZmV0Y2ggbGF0ZXN0IFVTRFx1MjE5MkNMUCBmcm9tIG1pbmRpY2Fkb3IuY2wgYW5kIHNhdmVcbnJvdXRlKFwiUE9TVFwiLCBcIi9leGNoYW5nZS9yZWZyZXNoXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByYXRlcyA9IGF3YWl0IGZldGNoRXhjaGFuZ2VSYXRlcygpO1xuICAgIGNvbnN0IHBhdGNoOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgaWYgKHJhdGVzLnVzZFRvQ2xwICE9IG51bGwpIHBhdGNoLnVzZFRvQ2xwID0gTWF0aC5yb3VuZChyYXRlcy51c2RUb0NscCk7XG4gICAgaWYgKE9iamVjdC5rZXlzKHBhdGNoKS5sZW5ndGggPiAwKSB7XG4gICAgICBzdG9yZS51cGRhdGVTZXR0aW5ncyhwYXRjaCk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgMjAwLCB7XG4gICAgICB1cGRhdGVkOiBwYXRjaCxcbiAgICAgIGZldGNoZWRBdDogcmF0ZXMuZmV0Y2hlZEF0LFxuICAgICAgZXJyb3JzOiByYXRlcy5lcnJvcnMsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJleGNoYW5nZV9lcnJvclwiLCBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSB9KTtcbiAgfVxufSk7XG5cbi8vIEdFVCAvZGVidWcvc3RhdHVzIFx1MjAxNCBkaWFnbm9zdGljIHNuYXBzaG90IG9mIHN5c3RlbSBoZWFsdGhcbnJvdXRlKFwiR0VUXCIsIFwiL2RlYnVnL3N0YXR1c1wiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGFsbEdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCk7XG4gIGNvbnN0IGFjdGl2ZUdhbWVzID0gYWxsR2FtZXMuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG5cbiAgY29uc3QgZ2FtZXNCeVBsYXRmb3JtOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gIGZvciAoY29uc3QgZyBvZiBhY3RpdmVHYW1lcykge1xuICAgIGdhbWVzQnlQbGF0Zm9ybVtnLnBsYXRmb3JtXSA9IChnYW1lc0J5UGxhdGZvcm1bZy5wbGF0Zm9ybV0gfHwgMCkgKyAxO1xuICB9XG5cbiAgY29uc3Qgc291cmNlcyA9IHN0b3JlLmdldFNvdXJjZXMoKS5tYXAoKHMpID0+ICh7XG4gICAgcGxhdGZvcm06IHMucGxhdGZvcm0sXG4gICAgcmVnaW9uOiBzLnJlZ2lvbixcbiAgICBlbmFibGVkOiBzLmVuYWJsZWQsXG4gIH0pKTtcblxuICBjb25zdCBjb21wZXRpdG9ycyA9IHN0b3JlLmdldENvbXBldGl0b3JzKCk7XG4gIGNvbnN0IGFsbFByb2R1Y3RzID0gc3RvcmUuZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGZhbHNlKTtcbiAgY29uc3QgcmVmcmVzaGVkQXQgPSBzdG9yZS5nZXRDb21wZXRpdG9yUmVmcmVzaGVkQXQoKTtcblxuICBjb25zdCBjb21wZXRpdG9yU3RhdHVzID0gY29tcGV0aXRvcnMubWFwKChjKSA9PiAoe1xuICAgIGtleTogYy5rZXksXG4gICAgbGFiZWw6IGMubGFiZWwsXG4gICAgcHJvZHVjdENvdW50OiBhbGxQcm9kdWN0cy5maWx0ZXIoKHApID0+IHAuc3RvcmVLZXkgPT09IGMua2V5KS5sZW5ndGgsXG4gICAgcmVmcmVzaGVkQXQ6IHJlZnJlc2hlZEF0W2Mua2V5XSA/PyBudWxsLFxuICB9KSk7XG5cbiAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICB0b3RhbEdhbWVzOiBhbGxHYW1lcy5sZW5ndGgsXG4gICAgYWN0aXZlR2FtZXM6IGFjdGl2ZUdhbWVzLmxlbmd0aCxcbiAgICBnYW1lc0J5UGxhdGZvcm0sXG4gICAgc291cmNlcyxcbiAgICBjb21wZXRpdG9yczogY29tcGV0aXRvclN0YXR1cyxcbiAgICBhdXRvUmVmcmVzaEludGVydmFsSG91cnM6IHN0b3JlLmdldEF1dG9SZWZyZXNoSW50ZXJ2YWwoKSxcbiAgICBsYXN0QXV0b1JlZnJlc2hBdDogZ2V0TGFzdEF1dG9SZWZyZXNoQXQoKSxcbiAgICBkYlNpemVLYjogbnVsbCxcbiAgfSk7XG59KTtcblxuLy8gUFVUIC9zY2hlZHVsZXIgXHUyMDE0IGVuYWJsZS9kaXNhYmxlIHBlcmlvZGljIGF1dG8tcmVmcmVzaFxuLy8gQm9keTogeyBpbnRlcnZhbEhvdXJzOiBudW1iZXIgfSAgKDAgPSBkaXNhYmxlZClcbnJvdXRlKFwiUFVUXCIsIFwiL3NjaGVkdWxlclwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7IGludGVydmFsSG91cnM/OiBudW1iZXIgfTtcbiAgY29uc3QgaG91cnMgPSBOdW1iZXIoYm9keS5pbnRlcnZhbEhvdXJzID8/IDApO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShob3VycykgfHwgaG91cnMgPCAwKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcImJhZF9yZXF1ZXN0XCIsIG1lc3NhZ2U6IFwiaW50ZXJ2YWxIb3VycyBtdXN0IGJlID49IDBcIiB9KTtcbiAgfVxuICBzdG9yZS5zZXRBdXRvUmVmcmVzaEludGVydmFsKGhvdXJzKTtcbiAgcmVzY2hlZHVsZShydW5SZWZyZXNoKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgaW50ZXJ2YWxIb3Vyczogc3RvcmUuZ2V0QXV0b1JlZnJlc2hJbnRlcnZhbCgpIH0pO1xufSk7XG5cbi8vIFN0YXJ0IHNjaGVkdWxlciBpZiBjb25maWd1cmVkXG5zdGFydFNjaGVkdWxlcihydW5SZWZyZXNoKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3QoXG4gIHJlcTogSW5jb21pbmdNZXNzYWdlLFxuICByZXM6IFNlcnZlclJlc3BvbnNlXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBwYXRobmFtZSA9IHVybC5wYXRobmFtZTsgLy8gVml0ZSBzdHJpcHMgL2FwaSBwcmVmaXggdmlhIHVzZSgpXG5cbiAgZm9yIChjb25zdCByIG9mIHJvdXRlcykge1xuICAgIGlmIChyLm1ldGhvZCAhPT0gcmVxLm1ldGhvZCkgY29udGludWU7XG4gICAgY29uc3QgbSA9IHIucGF0dGVybi5leGVjKHBhdGhuYW1lKTtcbiAgICBpZiAoIW0pIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIHIua2V5cy5mb3JFYWNoKChrLCBpKSA9PiAocGFyYW1zW2tdID0gZGVjb2RlVVJJQ29tcG9uZW50KG1baSArIDFdKSkpO1xuICAgIHJldHVybiByLmhhbmRsZXIocmVxLCByZXMsIHBhcmFtcyk7XG4gIH1cbiAgc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwibm90X2ZvdW5kXCIsIHBhdGg6IHBhdGhuYW1lIH0pO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3BsdWdpbi50c1wiOy8qKlxuICogVml0ZSBwbHVnaW4gdGhhdCBtb3VudHMgdGhlIGFwaXBzbiBKU09OIEFQSSBvbiB0aGUgZGV2IHNlcnZlci5cbiAqIEV2ZXJ5dGhpbmcgcnVucyBpbiBhIHNpbmdsZSBOb2RlIHByb2Nlc3MgXHUyMDE0IGlkZWFsIGZvciBCb2x0IC8gU3RhY2tCbGl0ei5cbiAqL1xuaW1wb3J0IHR5cGUgeyBQbHVnaW4sIFZpdGVEZXZTZXJ2ZXIgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSBcIm5vZGU6aHR0cFwiO1xuaW1wb3J0IHsgaGFuZGxlUmVxdWVzdCB9IGZyb20gXCIuL2FwaVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBpUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJhcGlwc24tYXBpXCIsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogVml0ZURldlNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcbiAgICAgICAgXCIvYXBpXCIsXG4gICAgICAgIChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSwgbmV4dDogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgIGhhbmRsZVJlcXVlc3QocmVxLCByZXMpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbYXBpXSB1bmhhbmRsZWRcIiwgZXJyKTtcbiAgICAgICAgICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBlcnJvcjogXCJpbnRlcm5hbF9lcnJvclwiLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogU3RyaW5nKChlcnIgYXMgRXJyb3IpPy5tZXNzYWdlIHx8IGVyciksXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9LFxuICB9O1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7OztBQ0VsQixPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFDakIsU0FBUyxxQkFBcUI7QUFMNEcsSUFBTSwyQ0FBMkM7QUErRzNMLElBQU0sbUJBQW9DO0FBQUEsRUFDeEMsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1Ysb0JBQW9CO0FBQUEsRUFDcEIsb0JBQW9CO0FBQUEsRUFDcEIsb0JBQW9CO0FBQUEsRUFDcEIsY0FBYztBQUFBLEVBQ2QsZ0JBQWdCO0FBQUEsRUFDaEIsU0FBUztBQUFBLEVBQ1Qsb0JBQW9CO0FBQ3RCO0FBRUEsSUFBTSx5QkFBbUM7QUFBQSxFQUN2QztBQUFBLEVBQWtDO0FBQUEsRUFBbUI7QUFBQSxFQUNyRDtBQUFBLEVBQXVCO0FBQUEsRUFBYTtBQUFBLEVBQ3BDO0FBQUEsRUFBa0I7QUFBQSxFQUFXO0FBQUEsRUFBbUI7QUFBQSxFQUNoRDtBQUFBLEVBQWU7QUFBQSxFQUFnQjtBQUFBLEVBQWU7QUFBQSxFQUM5QztBQUFBLEVBQVk7QUFBQSxFQUFnQjtBQUFBLEVBQVU7QUFBQSxFQUFRO0FBQUEsRUFDOUM7QUFBQSxFQUFrQjtBQUFBLEVBQXdCO0FBQzVDO0FBRUEsSUFBTSxrQkFBb0M7QUFBQSxFQUN4QyxFQUFFLFVBQVUsT0FBTyxRQUFRLE1BQU0sU0FBUyxNQUFNLFlBQVksR0FBRztBQUFBLEVBQy9ELEVBQUUsVUFBVSxPQUFPLFFBQVEsTUFBTSxTQUFTLE1BQU0sWUFBWSx1Q0FBdUM7QUFBQSxFQUNuRyxFQUFFLFVBQVUsUUFBUSxRQUFRLE1BQU0sU0FBUyxLQUFLO0FBQUEsRUFDaEQsRUFBRSxVQUFVLFFBQVEsUUFBUSxNQUFNLFNBQVMsS0FBSztBQUFBLEVBQ2hELEVBQUUsVUFBVSxRQUFRLFFBQVEsTUFBTSxTQUFTLEtBQUs7QUFBQSxFQUNoRCxFQUFFLFVBQVUsWUFBWSxRQUFRLE1BQU0sU0FBUyxLQUFLO0FBQUEsRUFDcEQsRUFBRSxVQUFVLFlBQVksUUFBUSxNQUFNLFNBQVMsTUFBTTtBQUFBLEVBQ3JELEVBQUUsVUFBVSxTQUFTLFFBQVEsTUFBTSxTQUFTLEtBQUs7QUFBQSxFQUNqRCxFQUFFLFVBQVUsU0FBUyxRQUFRLE1BQU0sU0FBUyxLQUFLO0FBQUEsRUFDakQsRUFBRSxVQUFVLFNBQVMsUUFBUSxNQUFNLFNBQVMsS0FBSztBQUNuRDtBQUVBLElBQU0sc0JBQTBDO0FBQUEsRUFDOUMsRUFBRSxLQUFLLE9BQU8sT0FBTyxpQkFBaUIsUUFBUSxtQkFBbUIsTUFBTSxXQUFXLFNBQVMsS0FBSztBQUFBLEVBQ2hHLEVBQUUsS0FBSyx3QkFBd0IsT0FBTywwQkFBMEIsUUFBUSw0QkFBNEIsTUFBTSxRQUFRLFNBQVMsS0FBSztBQUFBLEVBQ2hJLEVBQUUsS0FBSyxNQUFNLE9BQU8sZ0JBQWdCLFFBQVEsa0JBQWtCLE1BQU0sV0FBVyxTQUFTLEtBQUs7QUFBQSxFQUM3RixFQUFFLEtBQUssWUFBWSxPQUFPLHdCQUF3QixRQUFRLHlCQUF5QixNQUFNLFFBQVEsU0FBUyxLQUFLO0FBQ2pIO0FBRUEsSUFBTSxjQUF5QjtBQUFBLEVBQzdCLFFBQVE7QUFBQTtBQUFBO0FBQUEsRUFHUixpQkFBaUI7QUFBQTtBQUFBO0FBQUEsRUFHakIsa0JBQ0U7QUFBQSxFQUNGLGVBQWU7QUFDakI7QUFFQSxJQUFNLFlBQVksS0FBSyxRQUFRLGNBQWMsd0NBQWUsQ0FBQztBQUM3RCxJQUFNLFlBQVksS0FBSyxRQUFRLFdBQVcscUJBQXFCO0FBQy9ELElBQU0sV0FBVyxLQUFLLFFBQVEsV0FBVyx5QkFBeUI7QUFDbEUsSUFBTSxjQUFjLEtBQUssUUFBUSxXQUFXLDRCQUE0QjtBQUd4RSxJQUFJLFVBQVU7QUFDZCxJQUFJLGVBQWU7QUFFbkIsU0FBUyxZQUFZO0FBQ25CLFFBQU0sTUFBTSxLQUFLLFFBQVEsU0FBUztBQUNsQyxNQUFJLENBQUMsR0FBRyxXQUFXLEdBQUcsRUFBRyxJQUFHLFVBQVUsS0FBSyxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQ2hFO0FBRUEsU0FBUyxhQUFhLE9BQW1EO0FBQ3ZFLFFBQU0sV0FBaUMsQ0FBQztBQUN4QyxhQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssT0FBTyxRQUFRLEtBQUssR0FBRztBQUM1QyxRQUFJLE9BQU8sRUFBRSxlQUFlLFNBQVUsR0FBRSxhQUFhO0FBQ3JELFFBQUksQ0FBQyxFQUFFLFNBQVUsR0FBRSxXQUFXO0FBQzlCLFFBQUksQ0FBQyxFQUFFLE9BQVEsR0FBRSxTQUFTO0FBQzFCLFFBQUksQ0FBQyxFQUFFLFNBQVUsR0FBRSxXQUFXO0FBRTlCLFVBQU0sZUFBZSxHQUFHLEVBQUUsUUFBUSxJQUFJLEVBQUUsTUFBTSxJQUFJLEVBQUUsRUFBRTtBQUN0RCxRQUFJLFFBQVEsRUFBRSxNQUFNLFFBQVEsY0FBYztBQUN4QyxlQUFTLFlBQVksSUFBSTtBQUFBLElBQzNCLE9BQU87QUFDTCxlQUFTLEdBQUcsSUFBSTtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUNBLFNBQU87QUFDVDtBQUVBLFNBQVMsZUFDUCxTQUNBLEtBQ2tCO0FBQ2xCLFFBQU0sV0FBVyxXQUFXLFFBQVEsU0FBUyxJQUFJLENBQUMsR0FBRyxPQUFPLElBQUksQ0FBQztBQUNqRSxRQUFNLGVBQWUsSUFBSSxJQUFJLFNBQVMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLFFBQVEsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBRzdFLGFBQVcsT0FBTyxpQkFBaUI7QUFDakMsVUFBTSxNQUFNLEdBQUcsSUFBSSxRQUFRLElBQUksSUFBSSxNQUFNO0FBQ3pDLFFBQUksQ0FBQyxhQUFhLElBQUksR0FBRyxHQUFHO0FBQzFCLGVBQVMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQUEsSUFDMUIsV0FBVyxJQUFJLFNBQVM7QUFDdEIsWUFBTSxNQUFNLFNBQVMsS0FBSyxDQUFDLE1BQU0sRUFBRSxhQUFhLElBQUksWUFBWSxFQUFFLFdBQVcsSUFBSSxNQUFNO0FBQ3ZGLFVBQUksT0FBTyxDQUFDLElBQUksUUFBUyxLQUFJLFVBQVU7QUFBQSxJQUN6QztBQUFBLEVBQ0Y7QUFHQSxPQUFLLENBQUMsV0FBVyxRQUFRLFdBQVcsTUFBTSxJQUFJLGlCQUFpQjtBQUM3RCxVQUFNLFFBQVEsU0FBUyxLQUFLLENBQUMsTUFBTSxFQUFFLGFBQWEsU0FBUyxFQUFFLFdBQVcsSUFBSTtBQUM1RSxRQUFJLFNBQVMsQ0FBQyxNQUFNLFlBQVk7QUFDOUIsWUFBTSxhQUFhLElBQUk7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLFFBQVEsUUFBbUM7QUFDbEQsUUFBTSxNQUFNLEVBQUUsR0FBRyxhQUFhLEdBQUksT0FBTyxPQUFPLENBQUMsRUFBRztBQUNwRCxRQUFNLFFBQVEsYUFBYSxPQUFPLFNBQVMsQ0FBQyxDQUFDO0FBQzdDLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQSxVQUFVLEVBQUUsR0FBRyxrQkFBa0IsR0FBSSxPQUFPLFlBQVksQ0FBQyxFQUFHO0FBQUEsSUFDNUQ7QUFBQSxJQUNBLFNBQVMsZUFBZSxPQUFPLFNBQVMsR0FBRztBQUFBLElBQzNDLGFBQWEsT0FBTyxlQUFlLENBQUMsR0FBRyxtQkFBbUI7QUFBQSxJQUMxRCxvQkFBb0IsT0FBTyxzQkFBc0IsQ0FBQztBQUFBLElBQ2xELG1CQUFtQixPQUFPLHFCQUFxQixDQUFDO0FBQUEsSUFDaEQsdUJBQXVCLE9BQU8seUJBQXlCLENBQUM7QUFBQSxJQUN4RCxnQkFBZ0IsT0FBTyxrQkFBa0IsQ0FBQztBQUFBLElBQzFDLFdBQVcsT0FBTyxhQUFhLENBQUM7QUFBQSxJQUNoQywwQkFBMEIsT0FBTyw0QkFBNEI7QUFBQSxJQUM3RCxjQUFjLE9BQU8sZ0JBQWdCO0FBQUEsSUFDckMsVUFBVSxPQUFPLFlBQVk7QUFBQSxJQUM3QixlQUFlLE9BQU8saUJBQWlCLENBQUMsR0FBRyxzQkFBc0I7QUFBQSxFQUNuRTtBQUNGO0FBRUEsU0FBUyxVQUFtQjtBQUMxQixTQUFPO0FBQUEsSUFDTCxPQUFPLENBQUM7QUFBQSxJQUNSLFVBQVUsRUFBRSxHQUFHLGlCQUFpQjtBQUFBLElBQ2hDLEtBQUssRUFBRSxHQUFHLFlBQVk7QUFBQSxJQUN0QixTQUFTLENBQUMsR0FBRyxlQUFlO0FBQUEsSUFDNUIsYUFBYSxDQUFDLEdBQUcsbUJBQW1CO0FBQUEsSUFDcEMsb0JBQW9CLENBQUM7QUFBQSxJQUNyQixtQkFBbUIsQ0FBQztBQUFBLElBQ3BCLHVCQUF1QixDQUFDO0FBQUEsSUFDeEIsZ0JBQWdCLENBQUM7QUFBQSxJQUNqQixXQUFXLENBQUM7QUFBQSxJQUNaLDBCQUEwQjtBQUFBLElBQzFCLGNBQWM7QUFBQSxJQUNkLFVBQVU7QUFBQSxJQUNWLGVBQWUsQ0FBQyxHQUFHLHNCQUFzQjtBQUFBLEVBQzNDO0FBQ0Y7QUFFQSxTQUFTLE9BQWdCO0FBQ3ZCLE1BQUk7QUFDRixVQUFNLE1BQU0sR0FBRyxhQUFhLFdBQVcsT0FBTztBQUM5QyxRQUFJO0FBQ0YsWUFBTSxTQUFTLEtBQUssTUFBTSxHQUFHO0FBQzdCLGFBQU8sUUFBUSxNQUFNO0FBQUEsSUFDdkIsUUFBUTtBQUVOLGNBQVEsS0FBSyxrREFBa0Q7QUFDL0QsVUFBSTtBQUNGLGNBQU0sWUFBWSxHQUFHLGFBQWEsYUFBYSxPQUFPO0FBQ3RELGNBQU0sZUFBZSxLQUFLLE1BQU0sU0FBUztBQUN6QyxlQUFPLFFBQVEsWUFBWTtBQUFBLE1BQzdCLFFBQVE7QUFDTixlQUFPLFFBQVE7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFBQSxFQUNGLFFBQVE7QUFDTixXQUFPLFFBQVE7QUFBQSxFQUNqQjtBQUNGO0FBRUEsU0FBUyxjQUFjO0FBQ3JCLE1BQUk7QUFDRixVQUFNLE9BQU8sR0FBRyxTQUFTLFNBQVM7QUFDbEMsVUFBTSxRQUFRLEtBQUssSUFBSSxJQUFJLEtBQUs7QUFDaEMsUUFBSSxRQUFRLEtBQUssS0FBSyxLQUFNO0FBQzFCLFNBQUcsYUFBYSxXQUFXLFdBQVc7QUFBQSxJQUN4QztBQUFBLEVBQ0YsUUFBUTtBQUFBLEVBRVI7QUFDRjtBQUVBLFNBQVMsVUFBVTtBQUNqQixNQUFJLFNBQVM7QUFDWCxtQkFBZTtBQUNmO0FBQUEsRUFDRjtBQUNBLFlBQVU7QUFDVixNQUFJO0FBQ0YsY0FBVTtBQUNWLGdCQUFZO0FBQ1osT0FBRyxjQUFjLFVBQVUsS0FBSyxVQUFVLElBQUksTUFBTSxDQUFDLENBQUM7QUFDdEQsT0FBRyxXQUFXLFVBQVUsU0FBUztBQUFBLEVBQ25DLFVBQUU7QUFDQSxjQUFVO0FBQ1YsUUFBSSxjQUFjO0FBQ2hCLHFCQUFlO0FBQ2YsY0FBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFJLEtBQWMsS0FBSztBQUN2QixJQUFJLFlBQW1DO0FBR3ZDLElBQUk7QUFBRSxVQUFRO0FBQUcsUUFBUTtBQUFlO0FBRXhDLFNBQVMsZUFBZTtBQUN0QixNQUFJLFVBQVcsY0FBYSxTQUFTO0FBQ3JDLGNBQVksV0FBVyxTQUFTLEdBQUc7QUFDckM7QUFFQSxTQUFTLFFBQVEsVUFBb0IsUUFBZ0IsSUFBb0I7QUFDdkUsU0FBTyxHQUFHLFFBQVEsSUFBSSxNQUFNLElBQUksRUFBRTtBQUNwQztBQUVPLElBQU0sUUFBUTtBQUFBLEVBQ25CLFlBQW9CO0FBQ2xCLFdBQU8sT0FBTyxPQUFPLEdBQUcsS0FBSztBQUFBLEVBQy9CO0FBQUEsRUFDQSxRQUFRLElBQThCO0FBQ3BDLFdBQU8sR0FBRyxNQUFNLEVBQUU7QUFBQSxFQUNwQjtBQUFBLEVBQ0EsbUJBQW1CLFVBQW9CLFFBQWdCLElBQThCO0FBQ25GLFdBQU8sR0FBRyxNQUFNLFFBQVEsVUFBVSxRQUFRLEVBQUUsQ0FBQztBQUFBLEVBQy9DO0FBQUEsRUFDQSxXQUFXLE1BQWtCO0FBQzNCLFVBQU0sTUFBTSxRQUFRLEtBQUssVUFBVSxLQUFLLFFBQVEsS0FBSyxFQUFFO0FBQ3ZELE9BQUcsTUFBTSxHQUFHLElBQUk7QUFDaEIsaUJBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxVQUFVLElBQVksT0FBd0M7QUFDNUQsVUFBTSxXQUFXLEdBQUcsTUFBTSxFQUFFO0FBQzVCLFFBQUksQ0FBQyxTQUFVLFFBQU87QUFDdEIsVUFBTSxVQUFnQixFQUFFLEdBQUcsVUFBVSxHQUFHLE9BQU8sWUFBVyxvQkFBSSxLQUFLLEdBQUUsWUFBWSxFQUFFO0FBQ25GLE9BQUcsTUFBTSxFQUFFLElBQUk7QUFDZixpQkFBYTtBQUNiLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxzQkFBc0IsVUFBdUIsVUFBcUIsUUFBeUI7QUFDekYsUUFBSSxJQUFJO0FBQ1IsVUFBTSxPQUFNLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQ25DLGVBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxPQUFPLFFBQVEsR0FBRyxLQUFLLEdBQUc7QUFDL0MsVUFBSSxDQUFDLEVBQUUsT0FBUTtBQUNmLFVBQUksWUFBWSxFQUFFLGFBQWEsU0FBVTtBQUN6QyxVQUFJLFVBQVUsRUFBRSxXQUFXLE9BQVE7QUFDbkMsVUFBSSxDQUFDLFNBQVMsSUFBSSxHQUFHLEdBQUc7QUFDdEIsVUFBRSxTQUFTO0FBQ1gsVUFBRSxZQUFZO0FBQ2Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFFBQUksSUFBSSxFQUFHLGNBQWE7QUFDeEIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGNBQStCO0FBQzdCLFdBQU8sRUFBRSxHQUFHLEdBQUcsU0FBUztBQUFBLEVBQzFCO0FBQUEsRUFDQSxlQUFlLE9BQWtEO0FBQy9ELE9BQUcsV0FBVyxFQUFFLEdBQUcsR0FBRyxVQUFVLEdBQUcsTUFBTTtBQUN6QyxpQkFBYTtBQUNiLFdBQU8sRUFBRSxHQUFHLEdBQUcsU0FBUztBQUFBLEVBQzFCO0FBQUEsRUFDQSxTQUFvQjtBQUNsQixXQUFPLEVBQUUsR0FBRyxHQUFHLElBQUk7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsVUFBVSxPQUFzQztBQUM5QyxPQUFHLE1BQU0sRUFBRSxHQUFHLEdBQUcsS0FBSyxHQUFHLE1BQU07QUFDL0IsaUJBQWE7QUFDYixXQUFPLEVBQUUsR0FBRyxHQUFHLElBQUk7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsaUJBQXFDO0FBQ25DLFdBQU8sR0FBRyxZQUFZLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUU7QUFBQSxFQUM3QztBQUFBLEVBQ0EsZUFBZSxNQUE4QztBQUMzRCxPQUFHLGNBQWMsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFO0FBQzNDLGlCQUFhO0FBQ2IsV0FBTyxHQUFHLFlBQVksSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRTtBQUFBLEVBQzdDO0FBQUEsRUFDQSxzQkFBc0IsS0FBYSxVQUErQixhQUEyQjtBQUMzRixPQUFHLG1CQUFtQixHQUFHLElBQUk7QUFDN0IsT0FBRyxzQkFBc0IsR0FBRyxJQUFJO0FBQ2hDLGlCQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EseUJBQXlCLGNBQWMsTUFBMkI7QUFDaEUsVUFBTSxVQUFVLElBQUk7QUFBQSxNQUNsQixHQUFHLFlBQVksT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRztBQUFBLElBQzFFO0FBQ0EsVUFBTSxNQUEyQixDQUFDO0FBQ2xDLGVBQVcsQ0FBQyxLQUFLLElBQUksS0FBSyxPQUFPLFFBQVEsR0FBRyxrQkFBa0IsR0FBRztBQUMvRCxVQUFJLENBQUMsUUFBUSxJQUFJLEdBQUcsRUFBRztBQUN2QixpQkFBVyxLQUFLLEtBQU0sS0FBSSxLQUFLLENBQUM7QUFBQSxJQUNsQztBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSwyQkFBbUQ7QUFDakQsV0FBTyxFQUFFLEdBQUcsR0FBRyxzQkFBc0I7QUFBQSxFQUN2QztBQUFBLEVBQ0EscUJBQXFCLFNBQWtEO0FBQ3JFLE9BQUcsb0JBQW9CO0FBQ3ZCLGlCQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EscUJBQXFCLFFBQW1DO0FBQ3RELFdBQU8sR0FBRyxrQkFBa0IsTUFBTSxLQUFLLENBQUM7QUFBQSxFQUMxQztBQUFBLEVBQ0EsaUJBQWlCLElBQXVDO0FBQ3RELFdBQU8sR0FBRyxlQUFlLEVBQUU7QUFBQSxFQUM3QjtBQUFBLEVBQ0EsaUJBQWlCLElBQVksUUFBNkI7QUFDeEQsT0FBRyxlQUFlLEVBQUUsSUFBSTtBQUN4QixpQkFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLGdCQUErQjtBQUM3QixXQUFPLE9BQU8sT0FBTyxHQUFHLFNBQVM7QUFBQSxFQUNuQztBQUFBLEVBQ0EsV0FBVyxJQUFxQztBQUM5QyxXQUFPLEdBQUcsVUFBVSxFQUFFO0FBQUEsRUFDeEI7QUFBQSxFQUNBLGNBQWMsT0FBaUM7QUFDN0MsT0FBRyxVQUFVLE1BQU0sRUFBRSxJQUFJO0FBQ3pCLGlCQUFhO0FBQ2IsV0FBTyxFQUFFLEdBQUcsTUFBTTtBQUFBLEVBQ3BCO0FBQUEsRUFDQSxhQUFhLElBQVksT0FBc0Q7QUFDN0UsVUFBTSxXQUFXLEdBQUcsVUFBVSxFQUFFO0FBQ2hDLFFBQUksQ0FBQyxTQUFVLFFBQU87QUFDdEIsVUFBTSxVQUF1QixFQUFFLEdBQUcsVUFBVSxHQUFHLE1BQU07QUFDckQsT0FBRyxVQUFVLEVBQUUsSUFBSTtBQUNuQixpQkFBYTtBQUNiLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxjQUFjLElBQXFCO0FBQ2pDLFFBQUksQ0FBQyxHQUFHLFVBQVUsRUFBRSxFQUFHLFFBQU87QUFDOUIsV0FBTyxHQUFHLFVBQVUsRUFBRTtBQUN0QixpQkFBYTtBQUNiLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxhQUErQjtBQUM3QixXQUFPLEdBQUcsUUFBUSxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFO0FBQUEsRUFDekM7QUFBQSxFQUNBLFdBQVcsTUFBMEM7QUFDbkQsT0FBRyxVQUFVLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRTtBQUN2QyxpQkFBYTtBQUNiLFdBQU8sR0FBRyxRQUFRLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUU7QUFBQSxFQUN6QztBQUFBLEVBQ0EseUJBQWlDO0FBQy9CLFdBQU8sR0FBRyw0QkFBNEI7QUFBQSxFQUN4QztBQUFBLEVBQ0EsdUJBQXVCLE9BQXFCO0FBQzFDLE9BQUcsMkJBQTJCLEtBQUssSUFBSSxHQUFHLEtBQUs7QUFDL0MsaUJBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxrQkFBMkM7QUFDekMsV0FBTyxHQUFHO0FBQUEsRUFDWjtBQUFBLEVBQ0EsZ0JBQWdCLE1BQXFDO0FBQ25ELE9BQUcsZUFBZTtBQUNsQixpQkFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLGNBQXFDO0FBQ25DLFdBQU8sR0FBRyxXQUFXLEVBQUUsR0FBRyxHQUFHLFNBQVMsSUFBSTtBQUFBLEVBQzVDO0FBQUEsRUFDQSxZQUFZLEtBQWtDO0FBQzVDLE9BQUcsV0FBVyxNQUFNLEVBQUUsR0FBRyxJQUFJLElBQUk7QUFDakMsaUJBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxtQkFBNkI7QUFDM0IsV0FBTyxDQUFDLEdBQUcsR0FBRyxhQUFhO0FBQUEsRUFDN0I7QUFBQSxFQUNBLGlCQUFpQixNQUFzQjtBQUNyQyxPQUFHLGdCQUFnQixDQUFDLEdBQUcsSUFBSTtBQUMzQixpQkFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLFFBQWM7QUFDWixRQUFJLFVBQVcsY0FBYSxTQUFTO0FBQ3JDLFlBQVE7QUFBQSxFQUNWO0FBQ0Y7OztBQ3JlQSxTQUFTLFFBQVEsT0FBZSxNQUFzQjtBQUNwRCxNQUFJLFFBQVEsRUFBRyxRQUFPLEtBQUssTUFBTSxLQUFLO0FBQ3RDLFNBQU8sS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJO0FBQ3BDO0FBSUEsU0FBUyxnQkFBZ0IsT0FBdUI7QUFDOUMsTUFBSSxRQUFRLElBQU0sUUFBTyxLQUFLLE1BQU0sUUFBUSxHQUFHLElBQUk7QUFDbkQsU0FBTyxLQUFLLEtBQUssUUFBUSxHQUFJLElBQUksTUFBTztBQUMxQztBQUVBLFNBQVMsYUFBYSxVQUFrQixLQUE4QjtBQUNwRSxVQUFRLFVBQVU7QUFBQSxJQUNoQixLQUFLO0FBQU8sYUFBTyxJQUFJO0FBQUEsSUFDdkIsS0FBSztBQUFPLGFBQU8sSUFBSTtBQUFBLElBQ3ZCLEtBQUs7QUFBTyxhQUFPLElBQUk7QUFBQSxJQUN2QixLQUFLO0FBQUEsSUFDTDtBQUFZLGFBQU8sSUFBSTtBQUFBLEVBQ3pCO0FBQ0Y7QUFFQSxTQUFTLGdCQUFnQixVQUFrQixLQUE4QjtBQUN2RSxVQUFRLFVBQVU7QUFBQSxJQUNoQixLQUFLO0FBQU8sYUFBTyxJQUFJLHNCQUFzQjtBQUFBLElBQzdDLEtBQUs7QUFBTyxhQUFPLElBQUksc0JBQXNCO0FBQUEsSUFDN0MsS0FBSztBQUFBLElBQ0w7QUFBWSxhQUFPLElBQUksc0JBQXNCO0FBQUEsRUFDL0M7QUFDRjtBQUVPLFNBQVMsa0JBQ2QsWUFDQSxLQUNBLFdBQVcsT0FDUTtBQUNuQixNQUFJLGNBQWMsS0FBTSxRQUFPO0FBQy9CLFFBQU0sUUFBUSxhQUFhO0FBQzNCLFFBQU0sT0FBTyxhQUFhLFVBQVUsR0FBRztBQUN2QyxRQUFNLFdBQVcsZ0JBQWdCLFVBQVUsR0FBRztBQUM5QyxRQUFNLE9BQU8sUUFBUSxXQUFXO0FBQ2hDLFFBQU0sVUFBVSxRQUFRLE1BQU0sSUFBSSxPQUFPO0FBRXpDLFFBQU0sY0FBYyxPQUFPLElBQUk7QUFDL0IsUUFBTSxnQkFBZ0IsT0FBTyxJQUFJO0FBRWpDLFFBQU0sV0FBVyxJQUFJLHVCQUF1QixRQUN4QyxnQkFBZ0IsV0FBVyxJQUMzQixRQUFRLGFBQWEsSUFBSSxPQUFPO0FBQ3BDLFFBQU0sYUFBYSxJQUFJLHVCQUF1QixRQUMxQyxnQkFBZ0IsYUFBYSxJQUM3QixRQUFRLGVBQWUsSUFBSSxPQUFPO0FBRXRDLFFBQU0sZUFBZSxXQUFXLElBQUk7QUFDcEMsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLFdBQVcsZUFBZTtBQUFBLEVBQzVCO0FBQ0Y7OztBQzNEQSxJQUFNLEtBQ0o7QUFJSyxJQUFNLDhCQUFOLGNBQTBDLE1BQU07QUFBQSxFQUNyRCxjQUFjO0FBQ1osVUFBTSxvQ0FBb0M7QUFBQSxFQUM1QztBQUNGO0FBRU8sSUFBTSxjQUFOLGNBQTBCLE1BQU07QUFBQztBQU14QyxJQUFNLFlBQVksb0JBQUksSUFBWTtBQUFBLEVBQ2hDO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0YsQ0FBQztBQUVELElBQU0sY0FBYyxvQkFBSSxJQUFZO0FBQUEsRUFDbEM7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDO0FBRU0sU0FBUyxrQkFBa0IsS0FBMEI7QUFDMUQsUUFBTSxJQUFJLE9BQU8sSUFBSSw4QkFBOEIsRUFBRSxFQUFFLFlBQVk7QUFDbkUsTUFBSSxLQUFLLFVBQVUsSUFBSSxDQUFDLEVBQUcsUUFBTztBQUNsQyxRQUFNLElBQUksT0FBTyxJQUFJLHVDQUF1QyxFQUFFLEVBQUUsS0FBSztBQUNyRSxTQUFPLFlBQVksSUFBSSxDQUFDO0FBQzFCO0FBRUEsU0FBUyxhQUFhLEdBQTJCO0FBQy9DLE1BQUksS0FBSyxLQUFNLFFBQU87QUFDdEIsUUFBTSxJQUFJLE9BQU8sQ0FBQyxFQUFFLEtBQUs7QUFDekIsTUFBSSxDQUFDLEtBQUssVUFBVSxLQUFLLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxFQUFHLFFBQU87QUFDM0QsUUFBTSxVQUFVLEVBQUUsUUFBUSxjQUFjLEVBQUUsRUFBRSxRQUFRLE1BQU0sR0FBRztBQUM3RCxRQUFNLFFBQVEsUUFBUSxNQUFNLEdBQUc7QUFDL0IsUUFBTSxPQUNKLE1BQU0sU0FBUyxJQUFJLE1BQU0sTUFBTSxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxNQUFNLE1BQU0sR0FBRyxFQUFFLElBQUk7QUFDeEUsUUFBTSxJQUFJLE9BQU8sSUFBSTtBQUNyQixNQUFJLENBQUMsT0FBTyxTQUFTLENBQUMsRUFBRyxRQUFPO0FBQ2hDLFNBQU8sS0FBSyxNQUFNLElBQUksR0FBRztBQUMzQjtBQXdEQSxlQUFzQixvQkFDcEIsS0FDZ0M7QUFDaEMsUUFBTSxVQUFVLG9CQUFJLElBR2xCO0FBQ0YsUUFBTSxlQUFlLG9CQUFJLElBQW9CO0FBQzdDLE1BQUksUUFBUTtBQUVaLG1CQUFpQixPQUFPLHFCQUFxQixHQUFHLEdBQUc7QUFDakQ7QUFDQSxlQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssT0FBTyxRQUFRLEdBQUcsR0FBRztBQUN4QyxVQUFJLGFBQWEsSUFBSSxDQUFDLEVBQUc7QUFDekIsVUFBSTtBQUNKLFVBQUksS0FBSyxLQUFNLFdBQVU7QUFBQSxlQUNoQixPQUFPLE1BQU0sU0FBVSxXQUFVLEtBQUssVUFBVSxDQUFDLEVBQUUsTUFBTSxHQUFHLEdBQUc7QUFBQSxVQUNuRSxXQUFVLE9BQU8sQ0FBQyxFQUFFLE1BQU0sR0FBRyxHQUFHO0FBQ3JDLG1CQUFhLElBQUksR0FBRyxPQUFPO0FBQUEsSUFDN0I7QUFDQSxVQUFNLE1BQ0osSUFBSSx1Q0FDSixJQUFJLDhCQUNKO0FBQ0YsVUFBTSxLQUFLLElBQUksZUFBZSxJQUFJLFFBQVE7QUFDMUMsVUFBTSxNQUFNLEdBQUcsR0FBRyxJQUFTLEVBQUU7QUFDN0IsVUFBTSxXQUFXLFFBQVEsSUFBSSxHQUFHO0FBQ2hDLFFBQUksVUFBVTtBQUNaLGVBQVM7QUFDVCxVQUFJLFNBQVMsUUFBUSxTQUFTLEtBQUssSUFBSSxLQUFNLFVBQVMsUUFBUSxLQUFLLElBQUksSUFBSTtBQUFBLElBQzdFLE9BQU87QUFDTCxjQUFRLElBQUksS0FBSztBQUFBLFFBQ2YsZ0JBQWdCO0FBQUEsUUFDaEIsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBLFFBQ1AsU0FBUyxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0FBQUEsTUFDcEMsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBRUEsUUFBTSxrQkFBa0IsQ0FBQyxHQUFHLFFBQVEsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLO0FBQzlFLFFBQU0sT0FBTyxDQUFDLEdBQUcsYUFBYSxRQUFRLENBQUMsRUFDcEMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFDckMsSUFBSSxDQUFDLENBQUMsS0FBSyxPQUFPLE9BQU8sRUFBRSxLQUFLLFFBQVEsRUFBRTtBQUU3QyxTQUFPLEVBQUUsV0FBVyxPQUFPLGlCQUFpQixjQUFjLEtBQUs7QUFDakU7QUFFTyxTQUFTLGlCQUFpQixLQUFpQixLQUEwQjtBQUMxRSxRQUFNLEtBQUssSUFBSSxNQUFNLElBQUksYUFBYSxJQUFJO0FBQzFDLE1BQUksQ0FBQyxHQUFJLFFBQU87QUFFaEIsUUFBTSxPQUFPLElBQUksUUFBUSxJQUFJLFNBQVM7QUFDdEMsTUFBSSxDQUFDLEtBQU0sUUFBTztBQUlsQixNQUFJLFdBQTBCLElBQUksZ0JBQWdCO0FBQ2xELE1BQUksQ0FBQyxVQUFVO0FBQ2IsVUFBTSxRQUFRLElBQUksU0FBUyxDQUFDO0FBQzVCLFVBQU0sb0JBQW9CLENBQUMsbUJBQW1CLHFCQUFxQixRQUFRO0FBQzNFLFVBQU0sZ0JBQWdCLENBQUMsVUFBVSxrQkFBa0I7QUFDbkQsZUFBV0EsTUFBSyxPQUFPO0FBQ3JCLFlBQU0sT0FBTyxPQUFPQSxJQUFHLFFBQVEsRUFBRSxFQUFFLFlBQVk7QUFDL0MsVUFBSSxrQkFBa0IsU0FBUyxJQUFJLEdBQUc7QUFDcEMsbUJBQVdBLEdBQUUsT0FBTztBQUNwQixZQUFJLFNBQVU7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFDQSxRQUFJLENBQUMsVUFBVTtBQUNiLGlCQUFXQSxNQUFLLE9BQU87QUFDckIsY0FBTSxPQUFPLE9BQU9BLElBQUcsUUFBUSxFQUFFLEVBQUUsWUFBWTtBQUMvQyxZQUFJLGNBQWMsU0FBUyxJQUFJLEdBQUc7QUFDaEMscUJBQVdBLEdBQUUsT0FBTztBQUNwQixjQUFJLFNBQVU7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsUUFBSSxDQUFDLFlBQVksTUFBTSxDQUFDLEdBQUcsSUFBSyxZQUFXLE1BQU0sQ0FBQyxFQUFFO0FBQUEsRUFDdEQ7QUFFQSxRQUFNLFlBQVksTUFBTSxRQUFRLElBQUksU0FBUyxJQUN6QyxJQUFJLFVBQVUsS0FBSyxHQUFHLElBQ3RCLElBQUksYUFBYTtBQUVyQixRQUFNLFFBQVEsSUFBSSxVQUFVLENBQUMsR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDO0FBQ3ZELFFBQU0scUJBQXFCLGFBQWEsTUFBTSxrQkFBa0IsTUFBTSxTQUFTO0FBQy9FLE1BQUksdUJBQXVCO0FBQUEsSUFDekIsTUFBTSxtQkFBbUIsTUFBTTtBQUFBLEVBQ2pDO0FBQ0EsTUFBSSx3QkFBd0IsS0FBTSx3QkFBdUI7QUFFekQsTUFBSSxrQkFBa0I7QUFDdEIsUUFBTSxLQUFLLE1BQU0sZ0JBQWdCO0FBQ2pDLFFBQU0sSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7QUFDakMsTUFBSSxFQUFHLG1CQUFrQixTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUU7QUFDMUMsTUFDRSxDQUFDLG1CQUNELHNCQUNBLHdCQUF3QixRQUN4QixxQkFBcUIsS0FDckIsdUJBQXVCLG9CQUN2QjtBQUNBLHNCQUFrQixLQUFLO0FBQUEsT0FDbkIscUJBQXFCLHdCQUF3QixNQUFPO0FBQUEsSUFDeEQ7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUFBLElBQ0wsSUFBSSxPQUFPLEVBQUU7QUFBQSxJQUNiLFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSO0FBQUEsSUFDQTtBQUFBLElBQ0EsVUFBVSwrQ0FBK0MsRUFBRTtBQUFBLElBQzNEO0FBQUEsSUFDQSxVQUFVO0FBQUEsSUFDVjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxlQUFlLE1BQU0sV0FBVztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxJQUNQLFlBQVk7QUFBQSxJQUNaLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxJQUNaLFdBQVc7QUFBQSxFQUNiO0FBQ0Y7QUFFQSxlQUFlLFVBQVUsS0FBYSxRQUFpQztBQUNyRSxNQUFJLFlBQXFCO0FBQ3pCLFdBQVMsVUFBVSxHQUFHLFVBQVUsR0FBRyxXQUFXO0FBQzVDLFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLEtBQUs7QUFBQSxRQUN6QixTQUFTO0FBQUEsVUFDUCxjQUFjO0FBQUEsVUFDZCxRQUNFO0FBQUEsVUFDRixtQkFBbUIsT0FBTyxZQUFZLEVBQUUsV0FBVyxJQUFJLElBQUksT0FBTztBQUFBLFVBQ2xFLCtCQUErQjtBQUFBLFFBQ2pDO0FBQUEsTUFDRixDQUFDO0FBQ0QsVUFBSSxFQUFFLFdBQVcsSUFBSyxPQUFNLElBQUksWUFBWSw2QkFBNkIsR0FBRyxFQUFFO0FBQzlFLFVBQUksRUFBRSxXQUFXO0FBQ2YsY0FBTSxJQUFJLFlBQVksd0NBQXdDO0FBQ2hFLFVBQUksRUFBRSxVQUFVLElBQUssT0FBTSxJQUFJLE1BQU0sT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUN0RCxhQUFPLE1BQU0sRUFBRSxLQUFLO0FBQUEsSUFDdEIsU0FBUyxHQUFHO0FBQ1YsVUFBSSxhQUFhLFlBQWEsT0FBTTtBQUNwQyxrQkFBWTtBQUNaLFlBQU0sSUFBSSxRQUFRLENBQUMsUUFBUSxXQUFXLEtBQUssTUFBTSxLQUFLLE9BQU8sQ0FBQztBQUFBLElBQ2hFO0FBQUEsRUFDRjtBQUNBLFFBQU0sSUFBSTtBQUFBLElBQ1Isd0NBQXlDLFdBQXFCLFdBQVcsU0FBUztBQUFBLEVBQ3BGO0FBQ0Y7QUFHQSxTQUFTLGdCQUFnQixNQUEwQjtBQUNqRCxRQUFNLElBQUksaUVBQWlFO0FBQUEsSUFDekU7QUFBQSxFQUNGO0FBQ0EsTUFBSSxDQUFDLEVBQUcsUUFBTztBQUNmLE1BQUk7QUFDRixXQUFPLEtBQUssTUFBTSxFQUFFLENBQUMsQ0FBQztBQUFBLEVBQ3hCLFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBT0EsU0FBUyxnQkFBZ0IsTUFBZSxLQUFvQztBQUMxRSxNQUFJLENBQUMsS0FBTTtBQUNYLE1BQUksTUFBTSxRQUFRLElBQUksR0FBRztBQUN2QixlQUFXLEtBQUssS0FBTSxpQkFBZ0IsR0FBRyxHQUFHO0FBQzVDO0FBQUEsRUFDRjtBQUNBLE1BQUksT0FBTyxTQUFTLFNBQVU7QUFDOUIsUUFBTSxNQUFNO0FBRVosUUFBTSxLQUFNLElBQUksTUFBTSxJQUFJLGFBQWEsSUFBSTtBQUMzQyxRQUFNLE9BQVEsSUFBSSxRQUFRLElBQUk7QUFDOUIsUUFBTSxXQUNILElBQUksU0FBUyxPQUFPLElBQUksVUFBVSxZQUNsQyxNQUFNLFFBQVEsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLFNBQVM7QUFJdEQsTUFDRSxNQUNBLE9BQU8sT0FBTyxZQUNkLGtCQUFrQixLQUFLLEVBQUUsS0FDekIsUUFDQSxZQUNBLENBQUMsSUFBSSxJQUFJLEVBQUUsR0FDWDtBQUNBLFFBQUksSUFBSSxJQUFJLEdBQWlCO0FBQUEsRUFDL0I7QUFFQSxhQUFXLEtBQUssT0FBTyxPQUFPLEdBQUcsRUFBRyxpQkFBZ0IsR0FBRyxHQUFHO0FBQzVEO0FBT0EsU0FBUyxrQkFBa0IsTUFBbUM7QUFDNUQsUUFBTSxNQUFNLG9CQUFJLElBQW9CO0FBRXBDLFFBQU0sUUFBNEMsQ0FBQztBQUNuRCxRQUFNLFNBQVM7QUFDZixNQUFJO0FBQ0osVUFBUSxJQUFJLE9BQU8sS0FBSyxJQUFJLE9BQU8sTUFBTTtBQUN2QyxRQUFJO0FBQ0YsWUFBTSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFFBQVEsV0FBVyxHQUFHLEVBQUUsUUFBUSxVQUFVLEdBQUc7QUFDOUQsWUFBTSxPQUFPLEtBQUssTUFBTSxHQUFHO0FBQzNCLFVBQUksS0FBSyxHQUFJLE9BQU0sS0FBSyxFQUFFLElBQUksS0FBSyxJQUFJLEtBQUssRUFBRSxNQUFNLENBQUM7QUFBQSxJQUN2RCxRQUFRO0FBQUEsSUFBdUI7QUFBQSxFQUNqQztBQUVBLFFBQU0sT0FBNEMsQ0FBQztBQUVuRCxRQUFNLFFBQVE7QUFDZCxVQUFRLElBQUksTUFBTSxLQUFLLElBQUksT0FBTyxNQUFNO0FBRXRDLFFBQUksTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDckIsUUFBSSxDQUFDLElBQUs7QUFFVixRQUFJLElBQUksU0FBUyxHQUFHLEVBQUcsT0FBTSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxLQUFLLEVBQUUsQ0FBQztBQUNwRSxVQUFNLElBQUksUUFBUSxVQUFVLEdBQUc7QUFDL0IsU0FBSyxLQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDO0FBQUEsRUFDakM7QUFFQSxXQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ3JDLFVBQU0sT0FBTyxNQUFNLENBQUM7QUFDcEIsVUFBTSxVQUFVLE1BQU0sSUFBSSxDQUFDLEdBQUcsT0FBTztBQUNyQyxVQUFNLE1BQU0sS0FBSyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sS0FBSyxPQUFPLEVBQUUsTUFBTSxPQUFPO0FBQ2hFLFFBQUksS0FBSztBQUVQLFlBQU0sT0FBTyxJQUFJLElBQUksUUFBUSxHQUFHO0FBQ2hDLFVBQUksSUFBSSxLQUFLLElBQUksT0FBTyxJQUFJLElBQUksSUFBSSxVQUFVLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRztBQUFBLElBQ2xFO0FBQUEsRUFDRjtBQUNBLFNBQU87QUFDVDtBQUVBLFNBQVMsaUJBQWlCLEtBQWdCLE1BQXNCO0FBRTlELFFBQU0sYUFBYSxJQUFJLE9BQU8sWUFBWTtBQUMxQyxTQUFPLGlDQUFpQyxVQUFVLGFBQWEsSUFBSSxlQUFlLElBQUksSUFBSTtBQUM1RjtBQUVBLGdCQUF1QixxQkFDckIsS0FDNEI7QUFDNUIsUUFBTSxPQUFPLG9CQUFJLElBQVk7QUFDN0IsUUFBTSxXQUFXO0FBRWpCLFdBQVMsT0FBTyxHQUFHLFFBQVEsVUFBVSxRQUFRO0FBQzNDLFVBQU0sTUFBTSxpQkFBaUIsS0FBSyxJQUFJO0FBQ3RDLFVBQU0sT0FBTyxNQUFNLFVBQVUsS0FBSyxJQUFJLE1BQU07QUFDNUMsVUFBTSxPQUFPLGdCQUFnQixJQUFJO0FBQ2pDLFFBQUksQ0FBQyxNQUFNO0FBQ1QsVUFBSSxTQUFTLEdBQUc7QUFDZCxjQUFNLElBQUk7QUFBQSxVQUNSO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFDQTtBQUFBLElBQ0Y7QUFDQSxVQUFNLFFBQVEsb0JBQUksSUFBd0I7QUFDMUMsb0JBQWdCLE1BQU0sS0FBSztBQUczQixVQUFNLGFBQWEsa0JBQWtCLElBQUk7QUFFekMsUUFBSSxnQkFBZ0I7QUFDcEIsZUFBVyxDQUFDLElBQUksQ0FBQyxLQUFLLE9BQU87QUFDM0IsVUFBSSxLQUFLLElBQUksRUFBRSxFQUFHO0FBQ2xCLFdBQUssSUFBSSxFQUFFO0FBQ1g7QUFDQSxZQUFNLFVBQVUsV0FBVyxJQUFJLEVBQUU7QUFDakMsVUFBSSxRQUFTLEdBQUUsZUFBZTtBQUM5QixZQUFNO0FBQUEsSUFDUjtBQUNBLFFBQUksa0JBQWtCLEVBQUc7QUFBQSxFQUMzQjtBQUNGOzs7QUMvWUEsSUFBTUMsTUFDSjtBQThCSyxJQUFNLHVCQUFOLGNBQW1DLE1BQU07QUFBQSxFQUM5QyxZQUFtQixVQUFrQixTQUFpQjtBQUNwRCxVQUFNLE9BQU87QUFESTtBQUFBLEVBRW5CO0FBQ0Y7QUFJQSxJQUFNLFFBQVEsb0JBQUksSUFBSTtBQUFBLEVBQ3BCO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFLO0FBQUEsRUFBTTtBQUFBLEVBQUs7QUFBQSxFQUFJO0FBQUEsRUFBSztBQUFBLEVBQUs7QUFBQSxFQUFNO0FBQUEsRUFBSztBQUFBLEVBQUs7QUFBQSxFQUFNO0FBQUEsRUFDaEU7QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU87QUFBQSxFQUFLO0FBQUEsRUFBUTtBQUFBLEVBQVc7QUFBQSxFQUM3RDtBQUFBLEVBQVU7QUFBQSxFQUFLO0FBQUEsRUFBUztBQUFBLEVBQU87QUFBQSxFQUFTO0FBQUEsRUFBUztBQUFBLEVBQVc7QUFBQSxFQUM1RDtBQUFBLEVBQU87QUFBQSxFQUFXO0FBQUEsRUFBVTtBQUFBLEVBQVM7QUFBQSxFQUFXO0FBQUEsRUFBYTtBQUFBLEVBQzdEO0FBQUEsRUFBWTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBUztBQUFBLEVBQVM7QUFBQSxFQUFPO0FBQUEsRUFBUztBQUFBLEVBQzdEO0FBQUEsRUFBYTtBQUFBLEVBQVc7QUFBQSxFQUFhO0FBQUEsRUFBUztBQUFBLEVBQUs7QUFBQSxFQUNuRDtBQUFBLEVBQWM7QUFBQSxFQUFVO0FBQUEsRUFBTztBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBVTtBQUN2RCxDQUFDO0FBRU0sU0FBUyxTQUFTLE9BQXlCO0FBQ2hELFNBQU8sTUFDSixZQUFZLEVBQ1osVUFBVSxLQUFLLEVBQ2YsUUFBUSxvQkFBb0IsRUFBRSxFQUM5QixRQUFRLFVBQVUsRUFBRSxFQUNwQixRQUFRLGVBQWUsR0FBRyxFQUMxQixRQUFRLGNBQWMsR0FBRyxFQUN6QixRQUFRLGdCQUFnQixHQUFHLEVBQzNCLE1BQU0sS0FBSyxFQUNYLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3JDO0FBRU8sU0FBUyxXQUFXLEdBQWEsR0FBcUI7QUFDM0QsTUFBSSxDQUFDLEVBQUUsVUFBVSxDQUFDLEVBQUUsT0FBUSxRQUFPO0FBQ25DLFFBQU0sS0FBSyxJQUFJLElBQUksQ0FBQztBQUNwQixRQUFNLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDcEIsTUFBSSxRQUFRO0FBQ1osYUFBVyxLQUFLLEdBQUksS0FBSSxHQUFHLElBQUksQ0FBQyxFQUFHO0FBQ25DLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsUUFBTSxRQUFRLEdBQUcsT0FBTyxHQUFHLE9BQU87QUFDbEMsUUFBTSxVQUFVLFFBQVE7QUFHeEIsUUFBTSxVQUFVLEtBQUssSUFBSSxHQUFHLE1BQU0sR0FBRyxJQUFJO0FBQ3pDLFFBQU0sY0FBYyxRQUFRO0FBQzVCLFNBQU8sTUFBTSxVQUFVLE1BQU07QUFDL0I7QUFHTyxJQUFNLGtCQUFrQjtBQUkvQixTQUFTLFNBQVMsR0FBMkI7QUFDM0MsTUFBSSxLQUFLLEtBQU0sUUFBTztBQUN0QixNQUFJLE9BQU8sTUFBTSxZQUFZLE9BQU8sU0FBUyxDQUFDLEdBQUc7QUFHL0MsV0FBTyxLQUFLLE1BQU0sQ0FBQztBQUFBLEVBQ3JCO0FBQ0EsUUFBTSxJQUFJLE9BQU8sQ0FBQyxFQUFFLFFBQVEsYUFBYSxFQUFFO0FBQzNDLE1BQUksQ0FBQyxFQUFHLFFBQU87QUFLZixNQUFJLFVBQVU7QUFDZCxRQUFNLGNBQWMsZUFBZSxLQUFLLENBQUM7QUFDekMsTUFBSSxZQUFhLFdBQVUsRUFBRSxNQUFNLEdBQUcsRUFBRTtBQUN4QyxZQUFVLFFBQVEsUUFBUSxTQUFTLEVBQUU7QUFDckMsUUFBTSxJQUFJLE9BQU8sT0FBTztBQUN4QixNQUFJLENBQUMsT0FBTyxTQUFTLENBQUMsRUFBRyxRQUFPO0FBQ2hDLFNBQU8sS0FBSyxNQUFNLENBQUM7QUFDckI7QUFpQkEsZUFBZSxhQUNiLFVBQ0EsUUFDOEI7QUFDOUIsUUFBTSxXQUFnQyxDQUFDO0FBQ3ZDLFdBQVMsT0FBTyxHQUFHLFFBQVEsSUFBSSxRQUFRO0FBQ3JDLFVBQU0sTUFBTSxXQUFXLE1BQU0saUNBQWlDLElBQUk7QUFDbEUsVUFBTSxJQUFJLE1BQU0sTUFBTSxLQUFLO0FBQUEsTUFDekIsU0FBUyxFQUFFLGNBQWNBLEtBQUksUUFBUSxtQkFBbUI7QUFBQSxJQUMxRCxDQUFDO0FBQ0QsUUFBSSxFQUFFLFdBQVcsS0FBSztBQUNwQixZQUFNLElBQUk7QUFBQSxRQUNSO0FBQUEsUUFDQSxHQUFHLE1BQU07QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUNBLFFBQUksQ0FBQyxFQUFFLElBQUk7QUFDVCxZQUFNLElBQUk7QUFBQSxRQUNSO0FBQUEsUUFDQSxHQUFHLE1BQU0sU0FBUyxFQUFFLE1BQU07QUFBQSxNQUM1QjtBQUFBLElBQ0Y7QUFDQSxRQUFJO0FBQ0osUUFBSTtBQUNGLGFBQVEsTUFBTSxFQUFFLEtBQUs7QUFBQSxJQUN2QixRQUFRO0FBQ04sWUFBTSxJQUFJO0FBQUEsUUFDUjtBQUFBLFFBQ0EsR0FBRyxNQUFNO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFDQSxVQUFNLFFBQVEsS0FBSyxZQUFZLENBQUM7QUFDaEMsUUFBSSxDQUFDLE1BQU0sT0FBUTtBQUNuQixlQUFXLEtBQUssT0FBTztBQUNyQixZQUFNLFVBQVUsRUFBRSxXQUFXLENBQUM7QUFDOUIsWUFBTSxRQUFRLFNBQVMsU0FBUyxLQUFLO0FBQ3JDLFVBQUksU0FBUyxLQUFNO0FBQ25CLGVBQVMsS0FBSztBQUFBLFFBQ1o7QUFBQSxRQUNBLE9BQU8sRUFBRTtBQUFBLFFBQ1QsS0FBSyxXQUFXLE1BQU0sYUFBYSxFQUFFLE1BQU07QUFBQSxRQUMzQyxVQUFVO0FBQUEsUUFDVixXQUFXLFNBQVMsY0FBYztBQUFBLE1BQ3BDLENBQUM7QUFBQSxJQUNIO0FBQ0EsUUFBSSxNQUFNLFNBQVMsSUFBSztBQUFBLEVBQzFCO0FBQ0EsU0FBTztBQUNUO0FBbUJBLElBQU0sZ0JBQWdCO0FBQUEsRUFDcEI7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGO0FBRUEsZUFBZSxTQUNiLFVBQ0EsUUFDOEI7QUFDOUIsTUFBSSxZQUFZO0FBQ2hCLGFBQVcsWUFBWSxlQUFlO0FBQ3BDLFFBQUk7QUFDRixhQUFPLE1BQU0sV0FBVyxVQUFVLFFBQVEsUUFBUTtBQUFBLElBQ3BELFNBQVMsR0FBRztBQUNWLFVBQUksYUFBYSxzQkFBc0I7QUFDckMsb0JBQVksRUFBRTtBQUNkO0FBQUEsTUFDRjtBQUNBLFlBQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUNBLFFBQU0sSUFBSTtBQUFBLElBQ1I7QUFBQSxJQUNBLEdBQUcsTUFBTSx1REFBb0QsU0FBUztBQUFBLEVBQ3hFO0FBQ0Y7QUFFQSxlQUFlLFdBQ2IsVUFDQSxRQUNBLFVBQzhCO0FBQzlCLFFBQU0sV0FBZ0MsQ0FBQztBQUN2QyxRQUFNLFNBQVMsU0FBUyxTQUFTLEdBQUcsSUFBSSxNQUFNO0FBQzlDLFdBQVMsT0FBTyxHQUFHLFFBQVEsSUFBSSxRQUFRO0FBQ3JDLFVBQU0sTUFBTSxXQUFXLE1BQU0sR0FBRyxRQUFRLEdBQUcsTUFBTSxxQkFBcUIsSUFBSTtBQUMxRSxVQUFNLElBQUksTUFBTSxNQUFNLEtBQUs7QUFBQSxNQUN6QixTQUFTLEVBQUUsY0FBY0EsS0FBSSxRQUFRLG1CQUFtQjtBQUFBLElBQzFELENBQUM7QUFDRCxRQUFJLEVBQUUsV0FBVyxLQUFLO0FBQ3BCLFlBQU0sSUFBSSxxQkFBcUIsVUFBVSxHQUFHLFFBQVEsYUFBUTtBQUFBLElBQzlEO0FBQ0EsUUFBSSxDQUFDLEVBQUUsSUFBSTtBQUNULFlBQU0sSUFBSSxxQkFBcUIsVUFBVSxHQUFHLFFBQVEsZ0JBQVcsRUFBRSxNQUFNLEVBQUU7QUFBQSxJQUMzRTtBQUNBLFFBQUk7QUFDSixRQUFJO0FBQ0YsY0FBUyxNQUFNLEVBQUUsS0FBSztBQUFBLElBQ3hCLFFBQVE7QUFDTixZQUFNLElBQUkscUJBQXFCLFVBQVUsR0FBRyxRQUFRLHNCQUFtQjtBQUFBLElBQ3pFO0FBQ0EsUUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLEtBQUssQ0FBQyxNQUFNLE9BQVE7QUFDNUMsZUFBVyxLQUFLLE9BQU87QUFDckIsWUFBTSxNQUNKLEVBQUUsUUFBUSxjQUFjLEVBQUUsUUFBUSxTQUFTLEVBQUUsUUFBUTtBQUN2RCxVQUFJLFFBQVEsU0FBUyxHQUFHO0FBQ3hCLFVBQUksU0FBUyxRQUFRLE9BQU8sUUFBUSxLQUFLLE9BQU8sR0FBRyxDQUFDLEtBQUssUUFBUSxLQUFXO0FBQzFFLGdCQUFRLEtBQUssTUFBTSxRQUFRLEdBQUc7QUFBQSxNQUNoQztBQUNBLFVBQUksU0FBUyxLQUFNO0FBQ25CLGVBQVMsS0FBSztBQUFBLFFBQ1o7QUFBQSxRQUNBLE9BQU8sRUFBRTtBQUFBLFFBQ1QsS0FBSyxFQUFFO0FBQUEsUUFDUCxVQUFVO0FBQUEsUUFDVixXQUFXLEVBQUUsZ0JBQWdCO0FBQUEsTUFDL0IsQ0FBQztBQUFBLElBQ0g7QUFDQSxRQUFJLE1BQU0sU0FBUyxJQUFLO0FBQUEsRUFDMUI7QUFDQSxNQUFJLENBQUMsU0FBUyxRQUFRO0FBQ3BCLFVBQU0sSUFBSSxxQkFBcUIsVUFBVSxHQUFHLFFBQVEsV0FBUTtBQUFBLEVBQzlEO0FBQ0EsU0FBTztBQUNUO0FBSUEsSUFBTSxxQkFBcUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRjtBQUVBLElBQU0sb0JBQ0o7QUFFRixlQUFlLFVBQVUsS0FBcUM7QUFDNUQsTUFBSTtBQUNGLFVBQU0sSUFBSSxNQUFNLE1BQU0sS0FBSztBQUFBLE1BQ3pCLFNBQVM7QUFBQSxRQUNQLGNBQWNBO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixtQkFBbUI7QUFBQSxRQUNuQixrQkFBa0I7QUFBQSxRQUNsQixrQkFBa0I7QUFBQSxRQUNsQixrQkFBa0I7QUFBQSxNQUNwQjtBQUFBLElBQ0YsQ0FBQztBQUNELFFBQUksQ0FBQyxFQUFFLEdBQUksUUFBTztBQUNsQixXQUFPLE1BQU0sRUFBRSxLQUFLO0FBQUEsRUFDdEIsUUFBUTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFQSxlQUFlLG1CQUFtQixRQUFtQztBQUNuRSxRQUFNLE9BQU8sb0JBQUksSUFBWTtBQUM3QixRQUFNLFFBQWtCLENBQUM7QUFDekIsYUFBV0MsU0FBUSxvQkFBb0I7QUFDckMsVUFBTSxLQUFLLFdBQVcsTUFBTSxHQUFHQSxLQUFJLEVBQUU7QUFBQSxFQUN2QztBQUVBLFFBQU0sT0FBaUIsQ0FBQztBQUN4QixTQUFPLE1BQU0sVUFBVSxLQUFLLFNBQVMsS0FBTTtBQUN6QyxVQUFNLFVBQVUsTUFBTSxNQUFNO0FBQzVCLFFBQUksS0FBSyxJQUFJLE9BQU8sRUFBRztBQUN2QixTQUFLLElBQUksT0FBTztBQUNoQixVQUFNLE1BQU0sTUFBTSxVQUFVLE9BQU87QUFDbkMsUUFBSSxDQUFDLElBQUs7QUFHVixVQUFNLFNBQVMsTUFBTTtBQUFBLE1BQ25CLElBQUksU0FBUyxtRUFBbUU7QUFBQSxJQUNsRixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUN4QixlQUFXLEtBQUssUUFBUTtBQUN0QixVQUFJLHVDQUF1QyxLQUFLLENBQUMsS0FBSyxPQUFPLFNBQVMsSUFBSTtBQUN4RSxjQUFNLEtBQUssQ0FBQztBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBR0EsVUFBTSxRQUFRLE1BQU07QUFBQSxNQUNsQixJQUFJLFNBQVMsMkRBQTJEO0FBQUEsSUFDMUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDeEIsZUFBVyxLQUFLLE1BQU8sTUFBSyxLQUFLLENBQUM7QUFBQSxFQUNwQztBQUdBLFFBQU0sU0FBUyxLQUFLLE9BQU8sQ0FBQyxNQUFNLGtCQUFrQixLQUFLLENBQUMsQ0FBQztBQUMzRCxRQUFNLE9BQU8sT0FBTyxVQUFVLEtBQUssU0FBUztBQUc1QyxRQUFNLE1BQWdCLENBQUM7QUFDdkIsUUFBTSxRQUFRLG9CQUFJLElBQVk7QUFDOUIsYUFBVyxLQUFLLE1BQU07QUFDcEIsUUFBSSxNQUFNLElBQUksQ0FBQyxFQUFHO0FBQ2xCLFVBQU0sSUFBSSxDQUFDO0FBQ1gsUUFBSSxLQUFLLENBQUM7QUFBQSxFQUNaO0FBQ0EsU0FBTztBQUNUO0FBbUJBLFNBQVMsY0FBYyxHQUFnQztBQUNyRCxNQUFJLENBQUMsS0FBSyxPQUFPLE1BQU0sU0FBVSxRQUFPO0FBQ3hDLFFBQU0sSUFBSyxFQUFvQixPQUFPO0FBQ3RDLE1BQUksQ0FBQyxFQUFHLFFBQU87QUFDZixNQUFJLE1BQU0sUUFBUSxDQUFDLEVBQUcsUUFBTyxFQUFFLEtBQUssQ0FBQyxNQUFNLFdBQVcsS0FBSyxDQUFDLENBQUM7QUFDN0QsU0FBTyxXQUFXLEtBQUssT0FBTyxDQUFDLENBQUM7QUFDbEM7QUFFQSxTQUFTLHVCQUNQLE1BQ0EsVUFDQSxLQUMwQjtBQUMxQixRQUFNLFVBQVUsTUFBTTtBQUFBLElBQ3BCLEtBQUs7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxhQUFXLEtBQUssU0FBUztBQUN2QixRQUFJO0FBQ0osUUFBSTtBQUNGLGVBQVMsS0FBSyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUFBLElBQ2pDLFFBQVE7QUFDTjtBQUFBLElBQ0Y7QUFDQSxVQUFNLFFBQW1CLENBQUM7QUFDMUIsVUFBTSxRQUFTLFNBQXNDLFFBQVE7QUFDN0QsUUFBSSxNQUFNLFFBQVEsS0FBSyxFQUFHLE9BQU0sS0FBSyxHQUFHLEtBQUs7QUFBQSxhQUNwQyxNQUFNLFFBQVEsTUFBTSxFQUFHLE9BQU0sS0FBSyxHQUFHLE1BQU07QUFBQSxRQUMvQyxPQUFNLEtBQUssTUFBTTtBQUV0QixlQUFXLFFBQVEsT0FBTztBQUN4QixVQUFJLENBQUMsY0FBYyxJQUFJLEVBQUc7QUFDMUIsWUFBTSxJQUFJO0FBQ1YsWUFBTSxPQUFPLEVBQUU7QUFDZixVQUFJO0FBQ0osVUFBSSxlQUFlO0FBQ25CLFVBQUksTUFBTSxRQUFRLEVBQUUsTUFBTSxHQUFHO0FBQzNCLG1CQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUc7QUFDeEIsdUJBQWUsRUFBRSxPQUFPLENBQUMsR0FBRyxnQkFBZ0I7QUFBQSxNQUM5QyxXQUFXLEVBQUUsUUFBUTtBQUNuQixtQkFBVyxFQUFFLE9BQU8sU0FBUyxFQUFFLE9BQU87QUFDdEMsdUJBQWUsRUFBRSxPQUFPLGdCQUFnQjtBQUFBLE1BQzFDO0FBQ0EsWUFBTSxRQUFRLFNBQVMsUUFBUTtBQUMvQixVQUFJLENBQUMsUUFBUSxTQUFTLEtBQU07QUFDNUIsYUFBTztBQUFBLFFBQ0w7QUFBQSxRQUNBLE9BQU8sT0FBTyxJQUFJO0FBQUEsUUFDbEI7QUFBQSxRQUNBLFVBQVU7QUFBQSxRQUNWLFdBQVcsQ0FBQyxjQUFjLEtBQUssWUFBWTtBQUFBLE1BQzdDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFHQSxRQUFNLFVBQVUsb0VBQW9FO0FBQUEsSUFDbEY7QUFBQSxFQUNGLElBQUksQ0FBQztBQUNMLFFBQU0sVUFDSixnRkFBZ0Y7QUFBQSxJQUM5RTtBQUFBLEVBQ0YsSUFBSSxDQUFDLEtBQ0wsaUVBQWlFLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDakYsTUFBSSxXQUFXLFNBQVM7QUFDdEIsVUFBTSxRQUFRLFNBQVMsT0FBTztBQUM5QixRQUFJLFNBQVMsTUFBTTtBQUNqQixhQUFPLEVBQUUsVUFBVSxPQUFPLFNBQVMsS0FBSyxVQUFVLE9BQU8sV0FBVyxLQUFLO0FBQUEsSUFDM0U7QUFBQSxFQUNGO0FBR0EsUUFBTSxXQUFXLGdDQUFnQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSztBQUN2RSxRQUFNLFFBQVEsMEJBQTBCLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLO0FBQzlELFFBQU0sZUFBZSxTQUFTO0FBQzlCLE1BQUksY0FBYztBQUVoQixVQUFNLGdCQUFnQjtBQUFBLE1BQ3BCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUNBLGVBQVcsTUFBTSxlQUFlO0FBQzlCLFlBQU0sS0FBSyxHQUFHLEtBQUssSUFBSTtBQUN2QixVQUFJLElBQUk7QUFDTixjQUFNLFFBQVEsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUM1QixZQUFJLFNBQVMsTUFBTTtBQUNqQixnQkFBTSxhQUFhLGFBQ2hCLFFBQVEsZ0JBQWdCLEVBQUUsRUFDMUIsS0FBSztBQUNSLGlCQUFPLEVBQUUsVUFBVSxPQUFPLFlBQVksS0FBSyxVQUFVLE9BQU8sV0FBVyxLQUFLO0FBQUEsUUFDOUU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQ1Q7QUFFQSxlQUFlLG9CQUNiLFVBQ0EsUUFDOEI7QUFDOUIsUUFBTSxPQUFPLE1BQU0sbUJBQW1CLE1BQU07QUFDNUMsTUFBSSxDQUFDLEtBQUssUUFBUTtBQUNoQixVQUFNLElBQUk7QUFBQSxNQUNSO0FBQUEsTUFDQSxHQUFHLE1BQU07QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUNBLFFBQU0sUUFBUSxLQUFLLElBQUksS0FBSyxRQUFRLEdBQUc7QUFDdkMsUUFBTSxjQUFjO0FBQ3BCLFFBQU0sTUFBMkIsQ0FBQztBQUVsQyxXQUFTLElBQUksR0FBRyxJQUFJLE9BQU8sS0FBSyxhQUFhO0FBQzNDLFVBQU0sUUFBUSxLQUFLLE1BQU0sR0FBRyxJQUFJLFdBQVc7QUFDM0MsVUFBTSxVQUFVLE1BQU0sUUFBUTtBQUFBLE1BQzVCLE1BQU0sSUFBSSxPQUFPLE1BQU07QUFDckIsY0FBTSxPQUFPLE1BQU0sVUFBVSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxLQUFNLFFBQU87QUFDbEIsZUFBTyx1QkFBdUIsTUFBTSxVQUFVLENBQUM7QUFBQSxNQUNqRCxDQUFDO0FBQUEsSUFDSDtBQUNBLGVBQVcsS0FBSyxRQUFTLEtBQUksRUFBRyxLQUFJLEtBQUssQ0FBQztBQUFBLEVBQzVDO0FBQ0EsTUFBSSxDQUFDLElBQUksUUFBUTtBQUNmLFVBQU0sSUFBSTtBQUFBLE1BQ1I7QUFBQSxNQUNBLEdBQUcsTUFBTTtBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQ0EsU0FBTztBQUNUO0FBSUEsZUFBZSxnQkFDYixVQUNBLFFBQzhCO0FBQzlCLFFBQU0sT0FBTyxXQUFXLE1BQU07QUFHOUIsUUFBTSxXQUFXLE1BQU0sVUFBVSxPQUFPLEdBQUc7QUFDM0MsUUFBTSxhQUF1QixDQUFDO0FBQzlCLE1BQUksVUFBVTtBQUNaLFVBQU0sV0FBVztBQUNqQixRQUFJO0FBQ0osVUFBTSxPQUFPLG9CQUFJLElBQVk7QUFDN0IsWUFBUSxJQUFJLFNBQVMsS0FBSyxRQUFRLE9BQU8sTUFBTTtBQUM3QyxZQUFNQSxRQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3BDLFVBQUksQ0FBQyxLQUFLLElBQUlBLEtBQUksR0FBRztBQUNuQixhQUFLLElBQUlBLEtBQUk7QUFDYixtQkFBVyxLQUFLQSxLQUFJO0FBQUEsTUFDdEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUdBLE1BQUksQ0FBQyxXQUFXLFNBQVMsYUFBYSxFQUFHLFlBQVcsUUFBUSxhQUFhO0FBRXpFLFFBQU0sV0FBZ0MsQ0FBQztBQUN2QyxRQUFNLFdBQVcsb0JBQUksSUFBWTtBQUNqQyxRQUFNLGdCQUFnQjtBQUN0QixRQUFNLFdBQVc7QUFFakIsYUFBVyxPQUFPLFdBQVcsTUFBTSxHQUFHLGFBQWEsR0FBRztBQUNwRCxhQUFTLE9BQU8sR0FBRyxRQUFRLFVBQVUsUUFBUTtBQUMzQyxZQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsR0FBRyxTQUFTLElBQUk7QUFDdEMsWUFBTSxPQUFPLE1BQU0sVUFBVSxHQUFHO0FBQ2hDLFVBQUksQ0FBQyxLQUFNO0FBR1gsVUFBSSxjQUFjO0FBR2xCLFlBQU0sb0JBQ0o7QUFDRixVQUFJO0FBQ0osWUFBTSxlQUF5QixDQUFDO0FBQ2hDLFlBQU0sWUFBWTtBQUNsQixVQUFJO0FBQ0osY0FBUSxLQUFLLFVBQVUsS0FBSyxJQUFJLE9BQU8sTUFBTTtBQUMzQyxjQUFNLE9BQU8sT0FBTyxHQUFHLENBQUM7QUFDeEIsWUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEdBQUc7QUFDdkIsbUJBQVMsSUFBSSxJQUFJO0FBQ2pCLHVCQUFhLEtBQUssR0FBRyxDQUFDLENBQUM7QUFBQSxRQUN6QjtBQUFBLE1BQ0Y7QUFHQSxpQkFBVyxRQUFRLGNBQWM7QUFDL0IsY0FBTSxjQUFjLEtBQUssUUFBUSx1QkFBdUIsTUFBTTtBQUM5RCxjQUFNLFdBQVcsSUFBSTtBQUFBLFVBQ25CLFlBQVksV0FBVztBQUFBLFFBQ3pCO0FBQ0EsY0FBTSxNQUFNLFNBQVMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLO0FBR3hDLGNBQU0sYUFDSixzRUFBc0UsS0FBSyxHQUFHLEtBQzlFLDZCQUE2QixLQUFLLEdBQUcsS0FDckMsa0NBQWtDLEtBQUssR0FBRztBQUM1QyxjQUFNLFFBQVEsYUFBYSxDQUFDLEdBQUcsS0FBSztBQUdwQyxjQUFNLGFBQ0osa0VBQWtFLEtBQUssR0FBRyxLQUMxRSxpQkFBaUIsS0FBSyxHQUFHLEtBQ3pCLCtCQUErQixLQUFLLEdBQUc7QUFDekMsY0FBTSxRQUFRLFNBQVMsYUFBYSxDQUFDLENBQUM7QUFFdEMsWUFBSSxTQUFTLFNBQVMsTUFBTTtBQUMxQixtQkFBUyxLQUFLO0FBQUEsWUFDWjtBQUFBLFlBQ0E7QUFBQSxZQUNBLEtBQUssT0FBTztBQUFBLFlBQ1osVUFBVTtBQUFBLFlBQ1YsV0FBVztBQUFBLFVBQ2IsQ0FBQztBQUNEO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFFQSxVQUFJLGdCQUFnQixFQUFHO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBRUEsTUFBSSxDQUFDLFNBQVMsUUFBUTtBQUNwQixVQUFNLElBQUk7QUFBQSxNQUNSO0FBQUEsTUFDQSxHQUFHLE1BQU07QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUNBLFNBQU87QUFDVDtBQUlBLGVBQXNCLGdCQUNwQixLQUM4QjtBQUM5QixNQUFJLElBQUksU0FBUyxVQUFXLFFBQU8sYUFBYSxJQUFJLEtBQUssSUFBSSxNQUFNO0FBQ25FLE1BQUksSUFBSSxTQUFTLGNBQWUsUUFBTyxTQUFTLElBQUksS0FBSyxJQUFJLE1BQU07QUFDbkUsTUFBSSxJQUFJLFNBQVMsT0FBUSxRQUFPLG9CQUFvQixJQUFJLEtBQUssSUFBSSxNQUFNO0FBQ3ZFLE1BQUksSUFBSSxTQUFTLGFBQWMsUUFBTyxnQkFBZ0IsSUFBSSxLQUFLLElBQUksTUFBTTtBQUd6RSxRQUFNLFdBQVcsTUFBTSxVQUFVLFdBQVcsSUFBSSxNQUFNLEdBQUc7QUFDekQsTUFBSSxhQUFhLGlCQUFpQixLQUFLLFFBQVEsS0FBSyxrQkFBa0IsS0FBSyxRQUFRLElBQUk7QUFDckYsUUFBSTtBQUNGLGFBQU8sTUFBTSxnQkFBZ0IsSUFBSSxLQUFLLElBQUksTUFBTTtBQUFBLElBQ2xELFNBQVMsR0FBRztBQUNWLFVBQUksRUFBRSxhQUFhLHNCQUF1QixPQUFNO0FBQUEsSUFDbEQ7QUFBQSxFQUNGO0FBRUEsUUFBTSxTQUFtQixDQUFDO0FBQzFCLGFBQVcsTUFBTSxDQUFDLGNBQWMsVUFBVSxtQkFBbUIsR0FBRztBQUM5RCxRQUFJO0FBQ0YsYUFBTyxNQUFNLEdBQUcsSUFBSSxLQUFLLElBQUksTUFBTTtBQUFBLElBQ3JDLFNBQVMsR0FBRztBQUNWLFVBQUksRUFBRSxhQUFhLHNCQUF1QixPQUFNO0FBQ2hELGFBQU8sS0FBSyxFQUFFLE9BQU87QUFBQSxJQUN2QjtBQUFBLEVBQ0Y7QUFDQSxRQUFNLElBQUk7QUFBQSxJQUNSLElBQUk7QUFBQSxJQUNKLHVCQUF1QixJQUFJLE1BQU0sS0FBSyxPQUFPLEtBQUssUUFBSyxDQUFDO0FBQUEsRUFDMUQ7QUFDRjtBQU1PLFNBQVMsV0FDZCxPQUNBLFVBQ21DO0FBRW5DLFFBQU0sZ0JBQ0osU0FBUyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsUUFBUSxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFFeEQsUUFBTSxNQUF5QyxDQUFDO0FBQ2hELGFBQVcsS0FBSyxPQUFPO0FBQ3JCLFVBQU0sVUFBVSxTQUFTLEVBQUUsSUFBSTtBQUMvQixRQUFJLENBQUMsUUFBUSxPQUFRO0FBQ3JCLFVBQU0sVUFBNkIsQ0FBQztBQUNwQyxlQUFXLEVBQUUsR0FBRyxPQUFPLEtBQUssZUFBZTtBQUN6QyxVQUFJLENBQUMsT0FBTyxPQUFRO0FBQ3BCLFlBQU0sUUFBUSxXQUFXLFNBQVMsTUFBTTtBQUN4QyxVQUFJLFNBQVMsaUJBQWlCO0FBQzVCLGdCQUFRLEtBQUs7QUFBQSxVQUNYLFVBQVUsRUFBRTtBQUFBLFVBQ1osT0FBTyxFQUFFO0FBQUEsVUFDVCxLQUFLLEVBQUU7QUFBQSxVQUNQLFVBQVUsRUFBRTtBQUFBLFVBQ1osV0FBVyxFQUFFO0FBQUEsVUFDYjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBRUEsWUFBUSxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsV0FBVyxFQUFFLFFBQVE7QUFDOUMsUUFBSSxFQUFFLEVBQUUsSUFBSSxRQUFRLE1BQU0sR0FBRyxDQUFDO0FBQUEsRUFDaEM7QUFDQSxTQUFPO0FBQ1Q7OztBQ2xxQkEsSUFBTUMsTUFDSjtBQTBDRixlQUFlQyxXQUFVLEtBQWEsUUFBaUM7QUFDckUsTUFBSSxVQUFtQjtBQUN2QixXQUFTLFVBQVUsR0FBRyxVQUFVLEdBQUcsV0FBVztBQUM1QyxRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxLQUFLO0FBQUEsUUFDekIsU0FBUztBQUFBLFVBQ1AsY0FBY0Q7QUFBQSxVQUNkLFFBQ0U7QUFBQSxVQUNGLG1CQUFtQixPQUFPLFlBQVksRUFBRSxXQUFXLElBQUksSUFBSSxPQUFPO0FBQUEsVUFDbEUsK0JBQStCO0FBQUEsUUFDakM7QUFBQSxNQUNGLENBQUM7QUFDRCxVQUFJLEVBQUUsV0FBVyxJQUFLLE9BQU0sSUFBSSxZQUFZLDRCQUE0QixHQUFHLEVBQUU7QUFDN0UsVUFBSSxFQUFFLFdBQVc7QUFDZixjQUFNLElBQUksWUFBWSx3Q0FBd0M7QUFDaEUsVUFBSSxFQUFFLFVBQVUsSUFBSyxPQUFNLElBQUksTUFBTSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ3RELGFBQU8sTUFBTSxFQUFFLEtBQUs7QUFBQSxJQUN0QixTQUFTLEdBQUc7QUFDVixVQUFJLGFBQWEsWUFBYSxPQUFNO0FBQ3BDLGdCQUFVO0FBQ1YsWUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLFdBQVcsS0FBSyxNQUFNLEtBQUssT0FBTyxDQUFDO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQ0EsUUFBTSxJQUFJO0FBQUEsSUFDUiw2QkFBOEIsU0FBbUIsV0FBVyxPQUFPO0FBQUEsRUFDckU7QUFDRjtBQUVBLFNBQVNFLGlCQUFnQixNQUEwQjtBQUNqRCxRQUFNLElBQUksaUVBQWlFO0FBQUEsSUFDekU7QUFBQSxFQUNGO0FBQ0EsTUFBSSxDQUFDLEVBQUcsUUFBTztBQUNmLE1BQUk7QUFDRixXQUFPLEtBQUssTUFBTSxFQUFFLENBQUMsQ0FBQztBQUFBLEVBQ3hCLFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBS0EsU0FBUyxtQkFBbUIsTUFBZSxVQUE2QztBQUN0RixRQUFNLE1BQWlDLENBQUM7QUFDeEMsUUFBTSxRQUFtQixDQUFDLElBQUk7QUFDOUIsU0FBTyxNQUFNLFFBQVE7QUFDbkIsVUFBTSxJQUFJLE1BQU0sSUFBSTtBQUNwQixRQUFJLENBQUMsRUFBRztBQUNSLFFBQUksTUFBTSxRQUFRLENBQUMsR0FBRztBQUNwQixpQkFBVyxLQUFLLEVBQUcsT0FBTSxLQUFLLENBQUM7QUFDL0I7QUFBQSxJQUNGO0FBQ0EsUUFBSSxPQUFPLE1BQU0sU0FBVTtBQUMzQixVQUFNLE1BQU07QUFDWixRQUFJLElBQUksT0FBTyxZQUFZLElBQUksY0FBYyxTQUFVLEtBQUksS0FBSyxHQUFHO0FBQ25FLGVBQVcsS0FBSyxPQUFPLE9BQU8sR0FBRyxHQUFHO0FBQ2xDLFVBQUksS0FBSyxPQUFPLE1BQU0sU0FBVSxPQUFNLEtBQUssQ0FBQztBQUFBLElBQzlDO0FBQUEsRUFDRjtBQUNBLFNBQU87QUFDVDtBQUVBLFNBQVMsWUFBWSxTQUFvRTtBQUN2RixNQUFJLENBQUMsUUFBUSxPQUFRLFFBQU87QUFDNUIsTUFBSSxPQUFPLFFBQVEsQ0FBQztBQUNwQixNQUFJLFdBQVcsT0FBTyxLQUFLLElBQUksRUFBRTtBQUNqQyxhQUFXLEtBQUssU0FBUztBQUN2QixVQUFNLElBQUksT0FBTyxLQUFLLENBQUMsRUFBRTtBQUN6QixRQUFJLElBQUksVUFBVTtBQUNoQixhQUFPO0FBQ1AsaUJBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUNBLFNBQU87QUFDVDtBQUlBLFNBQVMsYUFBYSxTQUE2RDtBQUNqRixRQUFNLFNBQVMsQ0FBQyxHQUFHLE9BQU8sRUFBRTtBQUFBLElBQzFCLENBQUMsR0FBRyxNQUFNLE9BQU8sS0FBSyxDQUFDLEVBQUUsU0FBUyxPQUFPLEtBQUssQ0FBQyxFQUFFO0FBQUEsRUFDbkQ7QUFDQSxRQUFNLFNBQWtDLENBQUM7QUFDekMsYUFBVyxLQUFLLFFBQVE7QUFDdEIsZUFBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sUUFBUSxDQUFDLEdBQUc7QUFDdEMsVUFBSSxLQUFLLEtBQU07QUFDZixVQUFJLE9BQU8sQ0FBQyxLQUFLLEtBQU0sUUFBTyxDQUFDLElBQUk7QUFBQSxJQUNyQztBQUFBLEVBQ0Y7QUFDQSxTQUFPO0FBQ1Q7QUFTQSxTQUFTLGFBQWEsS0FBNEM7QUFDaEUsUUFBTSxPQUFRLElBQUksU0FBd0IsQ0FBQztBQUMzQyxRQUFNLFNBQWlDLENBQUM7QUFDeEMsUUFBTSxjQUF3QixDQUFDO0FBQy9CLFFBQU0sU0FBaUMsQ0FBQztBQUN4QyxNQUFJLHFCQUFvQztBQUV4QyxhQUFXLEtBQUssTUFBTTtBQUNwQixVQUFNLE9BQU8sT0FBTyxHQUFHLFFBQVEsRUFBRSxFQUFFLFlBQVk7QUFDL0MsVUFBTSxPQUFPLE9BQU8sR0FBRyxRQUFRLEVBQUUsRUFBRSxZQUFZO0FBQy9DLFVBQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxRQUFRLE9BQU87QUFHeEMsUUFBSSxLQUFLLFNBQVMsT0FBTyxLQUFLLFNBQVMsU0FBUztBQUM5QyxVQUFJLENBQUMsSUFBSztBQUNWLGFBQU8sS0FBSztBQUFBLFFBQ1Y7QUFBQSxRQUNBLFdBQVc7QUFBQSxRQUNYLFVBQVUsR0FBRyxRQUFRLFFBQVE7QUFBQSxNQUMvQixDQUFDO0FBQ0QsMkJBQXFCO0FBQ3JCO0FBQUEsSUFDRjtBQUNBLFFBQUksQ0FBQyxJQUFLO0FBSVYsUUFBSSxDQUFDLE9BQU8sSUFBSSxFQUFHLFFBQU8sSUFBSSxJQUFJO0FBRWxDLFFBQUksU0FBUyxhQUFjLGFBQVksS0FBSyxHQUFHO0FBQUEsRUFDakQ7QUFFQSxTQUFPO0FBQUEsSUFDTCxTQUNFLE9BQU8sYUFBYSxLQUNwQixPQUFPLFlBQVksS0FDbkIsT0FBTyxrQkFBa0IsS0FDekIsT0FBTyxZQUFZLEtBQ25CO0FBQUEsSUFDRixTQUFTLE9BQU8sTUFBTSxLQUFLLE9BQU8sa0JBQWtCLEtBQUs7QUFBQSxJQUN6RCxlQUFlLE9BQU8sa0JBQWtCLEtBQUssT0FBTyxZQUFZLEtBQUs7QUFBQSxJQUNyRSxVQUNFLE9BQU8sUUFBUSxLQUNmLE9BQU8sUUFBUSxLQUNmLE9BQU8sbUJBQW1CLEtBQzFCLE9BQU8sa0JBQWtCLEtBQ3pCO0FBQUEsSUFDRixhQUNFLE9BQU8saUJBQWlCLEtBQ3hCLE9BQU8sbUJBQW1CLEtBQzFCLE9BQU8sUUFBUSxLQUNmO0FBQUEsSUFDRixhQUFhLENBQUMsR0FBRyxJQUFJLElBQUksV0FBVyxDQUFDO0FBQUEsSUFDckM7QUFBQSxFQUNGO0FBQ0Y7QUFJQSxJQUFNLGVBQWUsb0JBQUksSUFBSTtBQUFBLEVBQzNCO0FBQUEsRUFBSztBQUFBLEVBQU07QUFBQSxFQUFVO0FBQUEsRUFBSztBQUFBLEVBQU07QUFBQSxFQUFLO0FBQUEsRUFBSztBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQzFFLENBQUM7QUFFTSxTQUFTLGFBQWEsS0FBcUI7QUFDaEQsTUFBSSxDQUFDLElBQUssUUFBTztBQUNqQixNQUFJLElBQUk7QUFFUixNQUFJLEVBQUUsUUFBUSwrQkFBK0IsRUFBRTtBQUMvQyxNQUFJLEVBQUUsUUFBUSw2QkFBNkIsRUFBRTtBQUU3QyxNQUFJLEVBQUUsUUFBUSx1Q0FBdUMsQ0FBQyxPQUFPLFFBQVE7QUFDbkUsVUFBTSxJQUFJLE9BQU8sR0FBRyxFQUFFLFlBQVk7QUFDbEMsUUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLEVBQUcsUUFBTztBQUVqQyxXQUFPLE1BQU0sV0FBVyxJQUFJLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDO0FBQUEsRUFDbkQsQ0FBQztBQUVELE1BQUksRUFBRSxRQUFRLDRCQUE0QixTQUFTO0FBQ25ELFNBQU8sRUFBRSxLQUFLO0FBQ2hCO0FBRUEsU0FBUyxjQUFjLEdBQXNCO0FBQzNDLE1BQUksQ0FBQyxFQUFHLFFBQU8sQ0FBQztBQUNoQixNQUFJLE1BQU0sUUFBUSxDQUFDLEdBQUc7QUFDcEIsV0FBTyxFQUNKLElBQUksQ0FBQyxNQUFNO0FBQ1YsVUFBSSxPQUFPLE1BQU0sU0FBVSxRQUFPO0FBQ2xDLFVBQUksS0FBSyxPQUFPLE1BQU0sVUFBVTtBQUM5QixjQUFNLE1BQU07QUFDWixlQUFPLE9BQU8sSUFBSSxRQUFRLElBQUksU0FBUyxJQUFJLGVBQWUsRUFBRTtBQUFBLE1BQzlEO0FBQ0EsYUFBTztBQUFBLElBQ1QsQ0FBQyxFQUNBLE9BQU8sT0FBTztBQUFBLEVBQ25CO0FBQ0EsTUFBSSxPQUFPLE1BQU0sU0FBVSxRQUFPLEVBQUUsTUFBTSxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQU87QUFDbEYsU0FBTyxDQUFDO0FBQ1Y7QUFFQSxTQUFTLElBQUksR0FBMkI7QUFDdEMsTUFBSSxLQUFLLEtBQU0sUUFBTztBQUN0QixNQUFJLE9BQU8sTUFBTSxTQUFVLFFBQU8sRUFBRSxLQUFLLEtBQUs7QUFDOUMsTUFBSSxPQUFPLE1BQU0sVUFBVTtBQUN6QixVQUFNLE1BQU07QUFDWixXQUNHLE9BQU8sSUFBSSxTQUFTLFlBQVksSUFBSSxRQUNwQyxPQUFPLElBQUksZ0JBQWdCLFlBQVksSUFBSSxlQUM1QztBQUFBLEVBRUo7QUFDQSxTQUFPLE9BQU8sQ0FBQyxLQUFLO0FBQ3RCO0FBSUEsU0FBUyx3QkFBd0IsTUFBNkI7QUFHNUQsUUFBTSxhQUNKLCtDQUErQyxLQUFLLElBQUksS0FDeEQsOEJBQThCLEtBQUssSUFBSTtBQUN6QyxNQUFJLGNBQWMsV0FBVyxDQUFDLEVBQUcsUUFBTyxXQUFXLENBQUMsRUFBRSxLQUFLO0FBRzNELFFBQU0sTUFBTSxnQ0FBZ0MsS0FBSyxJQUFJO0FBQ3JELFNBQU8sTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLFFBQVE7QUFDaEM7QUFFQSxTQUFTLDBCQUEwQixLQUF3QztBQUN6RSxRQUFNLEtBQUssSUFBSTtBQUNmLE1BQUksSUFBSSxtQkFBb0IsUUFBTyxjQUFjLEdBQUcsa0JBQWtCO0FBQ3RFLE1BQUksSUFBSSxhQUFjLFFBQU8sY0FBYyxHQUFHLFlBQVk7QUFDMUQsU0FBTyxDQUFDO0FBQ1Y7QUFFQSxTQUFTLDJCQUEyQixLQUF3QztBQUMxRSxRQUFNLEtBQUssSUFBSTtBQUNmLE1BQUksSUFBSSxvQkFBcUIsUUFBTyxjQUFjLEdBQUcsbUJBQW1CO0FBQ3hFLFNBQU8sQ0FBQztBQUNWO0FBRUEsU0FBUyxvQkFBb0IsS0FBOEIsTUFBd0I7QUFFakYsUUFBTSxXQUFxQixDQUFDO0FBQzVCLGFBQVcsT0FBTyxDQUFDLFlBQVksa0JBQWtCLG9CQUFvQixpQkFBaUIsR0FBRztBQUN2RixVQUFNLElBQUksSUFBSSxHQUFHO0FBQ2pCLFFBQUksRUFBRyxVQUFTLEtBQUssR0FBRyxjQUFjLENBQUMsQ0FBQztBQUFBLEVBQzFDO0FBQ0EsTUFBSSxTQUFTLFNBQVMsRUFBRyxRQUFPO0FBR2hDLFFBQU0sZUFDSjtBQUNGLE1BQUk7QUFDSixVQUFRLElBQUksYUFBYSxLQUFLLElBQUksT0FBTyxNQUFNO0FBQzdDLFVBQU0sT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLO0FBQ3ZCLFFBQUksUUFBUSxDQUFDLFNBQVMsU0FBUyxJQUFJLEVBQUcsVUFBUyxLQUFLLElBQUk7QUFBQSxFQUMxRDtBQUdBLFFBQU0sV0FDSjtBQUNGLFVBQVEsSUFBSSxTQUFTLEtBQUssSUFBSSxPQUFPLE1BQU07QUFDekMsVUFBTSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUs7QUFDdkIsUUFBSSxRQUFRLENBQUMsU0FBUyxTQUFTLElBQUksRUFBRyxVQUFTLEtBQUssSUFBSTtBQUFBLEVBQzFEO0FBRUEsU0FBTztBQUNUO0FBRUEsU0FBUyxrQkFBa0IsS0FBOEIsTUFLdkQ7QUFDQSxNQUFJLGNBQWMsSUFBSSxJQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksZ0JBQWdCO0FBQ2xFLE1BQUksb0JBQW9CLElBQUksSUFBSSxpQkFBaUI7QUFDakQsTUFBSSxpQkFBaUI7QUFDckIsTUFBSSxrQkFBaUM7QUFHckMsUUFBTSxVQUFVO0FBQ2hCLFFBQU0sY0FBYyw0QkFBNEIsS0FBSyxPQUFPO0FBQzVELE1BQUksQ0FBQyxlQUFlLFlBQWEsZUFBYyxZQUFZLENBQUMsRUFBRSxRQUFRLE9BQU8sRUFBRSxJQUFJO0FBRW5GLFFBQU0sY0FBYyxtREFBbUQsS0FBSyxPQUFPO0FBQ25GLE1BQUksQ0FBQyxxQkFBcUIsWUFBYSxxQkFBb0IsU0FBUyxZQUFZLENBQUMsQ0FBQztBQUVsRixNQUFJLHdCQUF3QixLQUFLLE9BQU8sRUFBRyxrQkFBaUI7QUFFNUQsTUFBSSxtQ0FBbUMsS0FBSyxPQUFPLEVBQUcsbUJBQWtCO0FBQUEsV0FDL0QsdUJBQXVCLEtBQUssT0FBTyxFQUFHLG1CQUFrQjtBQUVqRSxTQUFPLEVBQUUsYUFBYSxtQkFBbUIsZ0JBQWdCLGdCQUFnQjtBQUMzRTtBQUVBLFNBQVMsaUJBQWlCLEtBQThCLE1BQTZCO0FBQ25GLFFBQU0saUJBQWlCLElBQUksSUFBSSxtQ0FBbUM7QUFDbEUsTUFBSSxrQkFBa0IsVUFBVSxLQUFLLGNBQWMsRUFBRyxRQUFPO0FBRzdELFFBQU0sZUFBZSxzQkFBc0IsS0FBSyxJQUFJO0FBQ3BELFNBQU8sZUFBZSxhQUFhLENBQUMsSUFBSTtBQUMxQztBQUVBLFNBQVMscUJBQXFCLEtBQThCLE1BQTZCO0FBRXZGLFFBQU0sVUFBVSxJQUFJO0FBQ3BCLFFBQU0sVUFBVSxVQUFVLENBQUMsR0FBRyxPQUFPO0FBQ3JDLE1BQUksUUFBUyxRQUFPO0FBRXBCLFFBQU0sUUFBUSxJQUFJO0FBQ2xCLE1BQUksT0FBTyxRQUFTLFFBQU8sT0FBTyxNQUFNLE9BQU87QUFHL0MsUUFBTSxhQUFhLGtEQUFrRCxLQUFLLElBQUk7QUFDOUUsTUFBSSxXQUFZLFFBQU8sV0FBVyxDQUFDLEVBQUUsS0FBSztBQUUxQyxTQUFPO0FBQ1Q7QUFFQSxTQUFTLHNCQUFzQixLQUE4QixNQUF3QjtBQUNuRixRQUFNLFNBQW1CLENBQUM7QUFDMUIsUUFBTSxPQUFPLG9CQUFJLElBQVk7QUFHN0IsUUFBTSxRQUFTLElBQUksU0FBb0QsQ0FBQztBQUN4RSxhQUFXQyxNQUFLLE9BQU87QUFDckIsVUFBTSxNQUFNQSxJQUFHO0FBQ2YsUUFBSSxDQUFDLElBQUs7QUFDVixVQUFNLE9BQU8sT0FBT0EsSUFBRyxRQUFRLEVBQUUsRUFBRSxZQUFZO0FBQy9DLFFBQUksU0FBUyxnQkFBZ0IsU0FBUyxhQUFhLFNBQVMsaUJBQWlCO0FBQzNFLFVBQUksQ0FBQyxLQUFLLElBQUksR0FBRyxHQUFHO0FBQUUsYUFBSyxJQUFJLEdBQUc7QUFBRyxlQUFPLEtBQUssR0FBRztBQUFBLE1BQUc7QUFBQSxJQUN6RDtBQUFBLEVBQ0Y7QUFHQSxRQUFNLFdBQVc7QUFDakIsTUFBSTtBQUNKLFVBQVEsSUFBSSxTQUFTLEtBQUssSUFBSSxPQUFPLE1BQU07QUFDekMsVUFBTSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFFBQVEsVUFBVSxHQUFHO0FBQ3RDLFFBQUksQ0FBQyxLQUFLLElBQUksR0FBRyxHQUFHO0FBQUUsV0FBSyxJQUFJLEdBQUc7QUFBRyxhQUFPLEtBQUssR0FBRztBQUFBLElBQUc7QUFBQSxFQUN6RDtBQUdBLFFBQU0sY0FBYztBQUNwQixVQUFRLElBQUksWUFBWSxLQUFLLElBQUksT0FBTyxNQUFNO0FBQzVDLFVBQU0sU0FBUyxFQUFFLENBQUMsRUFBRSxRQUFRLFVBQVUsR0FBRztBQUN6QyxVQUFNLE9BQU8sT0FBTyxNQUFNLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEtBQUssRUFBRSxDQUFDLENBQUM7QUFDbEUsZUFBVyxPQUFPLE1BQU07QUFDdEIsVUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLEdBQUcsR0FBRztBQUFFLGFBQUssSUFBSSxHQUFHO0FBQUcsZUFBTyxLQUFLLEdBQUc7QUFBQSxNQUFHO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNUO0FBRUEsZUFBc0IsbUJBQ3BCLElBQ0EsVUFDQSxRQUN3QjtBQUN4QixRQUFNLE1BQU0sWUFBWSwrQ0FBK0MsRUFBRTtBQUN6RSxRQUFNLE9BQU8sTUFBTUYsV0FBVSxLQUFLLE1BQU07QUFDeEMsUUFBTSxPQUFPQyxpQkFBZ0IsSUFBSTtBQUNqQyxNQUFJLENBQUMsS0FBTSxPQUFNLElBQUksWUFBWSxzQ0FBc0M7QUFFdkUsUUFBTSxVQUFVLG1CQUFtQixNQUFNLEVBQUU7QUFDM0MsUUFBTSxPQUFPLFlBQVksT0FBTztBQUNoQyxNQUFJLENBQUMsS0FBTSxPQUFNLElBQUksWUFBWSxXQUFXLEVBQUUseUJBQXlCO0FBQ3ZFLFFBQU0sTUFBTSxhQUFhLE9BQU87QUFFaEMsUUFBTSxlQUFlLElBQUk7QUFDekIsUUFBTSxZQUFZLE1BQU0sUUFBUSxZQUFZLElBQ3hDLGFBQWEsS0FBSyxHQUFHLElBQ3JCLE9BQU8sZ0JBQWdCLEVBQUU7QUFFN0IsUUFBTSxXQUNILE9BQU8sSUFBSSxvQkFBb0IsWUFBWSxJQUFJLG1CQUMvQyxPQUFPLElBQUksZ0JBQWdCLFlBQVksSUFBSSxlQUM1QztBQUNGLFFBQU0sWUFDSCxPQUFPLElBQUkscUJBQXFCLFlBQVksSUFBSSxvQkFDakQ7QUFFRixRQUFNLFdBQ0osSUFBSSxJQUFJLDRCQUE0QixLQUNwQyxJQUFJLElBQUksUUFBUSxLQUNoQix3QkFBd0IsSUFBSTtBQUU5QixRQUFNLGdCQUFnQixJQUFJO0FBQzFCLFFBQU0sWUFDSixJQUFJLGVBQWUsV0FBVyxLQUM5QixJQUFJLGVBQWUsSUFBSSxLQUN2QixJQUFJLElBQUksUUFBUTtBQUVsQixRQUFNLGFBQWEsa0JBQWtCLEtBQUssSUFBSTtBQUU5QyxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0EsTUFBTSxPQUFPLElBQUksUUFBUSxJQUFJLFNBQVMsRUFBRTtBQUFBLElBQ3hDLGFBQWEsYUFBYSxRQUFRO0FBQUEsSUFDbEMsa0JBQWtCO0FBQUEsSUFDbEIsV0FBVyxJQUFJLElBQUksYUFBYSxLQUFLLElBQUksSUFBSSxTQUFTLEtBQUssSUFBSSxJQUFJLFdBQVc7QUFBQSxJQUM5RSxXQUFXLElBQUksSUFBSSxhQUFhLEtBQUssSUFBSSxJQUFJLFNBQVM7QUFBQSxJQUN0RCxhQUNFLElBQUksSUFBSSxXQUFXLEtBQ25CLElBQUksSUFBSSxvQkFBb0IsS0FDNUIsSUFBSSxJQUFJLGNBQWM7QUFBQSxJQUN4QixRQUFRLGNBQWMsSUFBSSxNQUFNO0FBQUEsSUFDaEMsZ0JBQWdCLGNBQWMsSUFBSSxtQkFBbUIsSUFBSSxnQkFBZ0I7QUFBQSxJQUN6RSxtQkFBbUI7QUFBQSxNQUNqQixJQUFJLHFCQUFxQixJQUFJO0FBQUEsSUFDL0I7QUFBQSxJQUNBO0FBQUEsSUFDQSxvQkFBb0IsMEJBQTBCLEdBQUc7QUFBQSxJQUNqRCxxQkFBcUIsMkJBQTJCLEdBQUc7QUFBQSxJQUNuRCxhQUFhLFdBQVc7QUFBQSxJQUN4QixtQkFBbUIsV0FBVztBQUFBLElBQzlCLGdCQUFnQixXQUFXO0FBQUEsSUFDM0IsaUJBQWlCLFdBQVc7QUFBQSxJQUM1QixjQUFjLG9CQUFvQixLQUFLLElBQUk7QUFBQSxJQUMzQyxXQUFXLGlCQUFpQixLQUFLLElBQUk7QUFBQSxJQUNyQztBQUFBLElBQ0E7QUFBQSxJQUNBLE9BQU8sYUFBYSxHQUFHO0FBQUEsSUFDdkIsZ0JBQWdCLHNCQUFzQixLQUFLLElBQUk7QUFBQSxJQUMvQyxVQUFVO0FBQUEsSUFDVixlQUFlLHFCQUFxQixLQUFLLElBQUk7QUFBQSxJQUM3QyxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsRUFDcEM7QUFDRjs7O0FDdmVPLElBQU0sa0JBQTRDO0FBQUEsRUFDdkQsS0FBSztBQUFBLEVBQ0wsTUFBTTtBQUFBLEVBQ04sVUFBVTtBQUFBLEVBQ1YsT0FBTztBQUNUO0FBU08sSUFBTSxtQkFBcUQ7QUFBQSxFQUNoRSxLQUFLO0FBQUEsSUFDSCxFQUFFLE1BQU0sTUFBTSxPQUFPLE1BQU0sVUFBVSxPQUFPLFFBQVEsUUFBUTtBQUFBLElBQzVELEVBQUUsTUFBTSxNQUFNLE9BQU8sVUFBVSxVQUFVLE9BQU8sUUFBUSxRQUFRO0FBQUEsRUFDbEU7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLEVBQUUsTUFBTSxNQUFNLE9BQU8sTUFBTSxVQUFVLE9BQU8sUUFBUSxRQUFRO0FBQUEsSUFDNUQsRUFBRSxNQUFNLE1BQU0sT0FBTyxVQUFVLFVBQVUsT0FBTyxRQUFRLFFBQVE7QUFBQSxJQUNoRSxFQUFFLE1BQU0sTUFBTSxPQUFPLGNBQVcsVUFBVSxPQUFPLFFBQVEsUUFBUTtBQUFBLEVBQ25FO0FBQUEsRUFDQSxVQUFVO0FBQUEsSUFDUixFQUFFLE1BQU0sTUFBTSxPQUFPLE1BQU0sVUFBVSxPQUFPLFFBQVEsUUFBUTtBQUFBLElBQzVELEVBQUUsTUFBTSxNQUFNLE9BQU8sWUFBUyxVQUFVLE9BQU8sUUFBUSxLQUFLO0FBQUEsRUFDOUQ7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEVBQUUsTUFBTSxNQUFNLE9BQU8sTUFBTSxVQUFVLE9BQU8sUUFBUSxLQUFLO0FBQUEsSUFDekQsRUFBRSxNQUFNLE1BQU0sT0FBTyxVQUFVLFVBQVUsT0FBTyxRQUFRLFlBQVk7QUFBQSxJQUNwRSxFQUFFLE1BQU0sTUFBTSxPQUFPLGNBQVcsVUFBVSxPQUFPLFFBQVEsVUFBVTtBQUFBLEVBQ3JFO0FBQ0Y7QUE0Qk8sSUFBTSxnQkFBTixjQUE0QixNQUFNO0FBQUEsRUFDdkMsWUFDUyxVQUNBLFFBQ1AsU0FDQTtBQUNBLFVBQU0sSUFBSSxRQUFRLElBQUksTUFBTSxLQUFLLE9BQU8sRUFBRTtBQUpuQztBQUNBO0FBQUEsRUFJVDtBQUNGOzs7QUM5RE8sSUFBTSxjQUF3QjtBQUFBLEVBQ25DLFVBQVU7QUFBQSxFQUNWLE9BQU8sV0FBVyxRQUFpRDtBQUNqRSxVQUFNLFNBQ0osT0FBTyxXQUFXLE9BQU8sVUFBVTtBQUNyQyxVQUFNLE1BQWlCO0FBQUEsTUFDckIsUUFBUTtBQUFBLE1BQ1IsaUJBQWlCLE9BQU8sY0FBYztBQUFBLE1BQ3RDLGtCQUFrQjtBQUFBLE1BQ2xCLGVBQWU7QUFBQSxJQUNqQjtBQUVBLFFBQUksQ0FBQyxJQUFJLGlCQUFpQjtBQUN4QixZQUFNLElBQUk7QUFBQSxRQUNSLGdEQUE2QyxPQUFPLE9BQU8sWUFBWTtBQUFBLE1BQ3pFO0FBQUEsSUFDRjtBQUVBLFVBQU0sV0FBVyxPQUFPLFdBQVcsT0FBTyxRQUFRO0FBRWxELHFCQUFpQixPQUFPLHFCQUFxQixHQUFHLEdBQUc7QUFDakQsVUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUc7QUFDN0IsWUFBTSxPQUFNLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQ25DLFlBQU0sT0FBTyxpQkFBaUIsS0FBSyxHQUFHO0FBQ3RDLFVBQUksQ0FBQyxLQUFNO0FBRVgsWUFBTSxhQUFhLE9BQU8sWUFBWTtBQUN0QyxZQUFNLFdBQVcsaUNBQWlDLFVBQVUsWUFBWSxLQUFLLEVBQUU7QUFFL0UsWUFBTTtBQUFBLFFBQ0osSUFBSSxLQUFLO0FBQUEsUUFDVCxNQUFNLEtBQUs7QUFBQSxRQUNYLFVBQVUsS0FBSztBQUFBLFFBQ2Y7QUFBQSxRQUNBLG1CQUFtQixLQUFLO0FBQUEsUUFDeEI7QUFBQSxRQUNBLG9CQUFvQixLQUFLO0FBQUEsUUFDekIsc0JBQXNCLEtBQUs7QUFBQSxRQUMzQixpQkFBaUIsS0FBSztBQUFBLFFBQ3RCLGVBQWUsS0FBSztBQUFBLE1BQ3RCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjs7O0FDakRBLElBQU1FLE1BQ0o7QUFHRixJQUFNLGFBQXFDO0FBQUEsRUFDekMsSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUNOO0FBRUEsSUFBTSxXQUFtQztBQUFBLEVBQ3ZDLElBQUk7QUFBQSxFQUNKLElBQUk7QUFBQSxFQUNKLElBQUk7QUFDTjtBQUVBLElBQU0sZUFBdUM7QUFBQSxFQUMzQyxJQUFJO0FBQUEsRUFDSixJQUFJO0FBQUEsRUFDSixJQUFJO0FBQ047QUE0QkEsU0FBUyxRQUFRLE9BQWlEO0FBQ2hFLE1BQUksU0FBUyxRQUFRLENBQUMsT0FBTyxTQUFTLEtBQUssRUFBRyxRQUFPO0FBQ3JELFNBQU8sS0FBSyxNQUFNLFFBQVEsR0FBRztBQUMvQjtBQUVBLGVBQWUsZUFBZSxLQUFhLE1BQXVDO0FBQ2hGLE1BQUk7QUFDSixXQUFTLFVBQVUsR0FBRyxVQUFVLEdBQUcsV0FBVztBQUM1QyxRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxLQUFLO0FBQUEsUUFDekIsU0FBUyxFQUFFLGNBQWNBLEtBQUksUUFBUSxtQkFBbUI7QUFBQSxRQUN4RCxHQUFHO0FBQUEsTUFDTCxDQUFDO0FBQ0QsVUFBSSxFQUFFLFdBQVcsS0FBSztBQUNwQixjQUFNLElBQUksUUFBUSxDQUFDLFFBQVEsV0FBVyxLQUFLLE1BQU8sS0FBSyxPQUFPLENBQUM7QUFDL0Q7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1QsU0FBUyxHQUFHO0FBQ1Ysa0JBQVk7QUFDWixZQUFNLElBQUksUUFBUSxDQUFDLFFBQVEsV0FBVyxLQUFLLE1BQU0sS0FBSyxPQUFPLENBQUM7QUFBQSxJQUNoRTtBQUFBLEVBQ0Y7QUFDQSxRQUFNO0FBQ1I7QUFFQSxlQUFlLFVBQVUsS0FBMkI7QUFDbEQsUUFBTSxJQUFJLE1BQU0sZUFBZSxHQUFHO0FBQ2xDLE1BQUksQ0FBQyxFQUFFLElBQUk7QUFDVCxVQUFNLE9BQU8sTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLE1BQU0sRUFBRTtBQUMxQyxVQUFNLElBQUksTUFBTSxRQUFRLEVBQUUsTUFBTSxLQUFLLEtBQUssTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFO0FBQUEsRUFDM0Q7QUFDQSxTQUFPLEVBQUUsS0FBSztBQUNoQjtBQUdBLFNBQVMsbUJBQW1CLE1BQWUsTUFBbUIsS0FBcUI7QUFDakYsTUFBSSxDQUFDLFFBQVEsT0FBTyxTQUFTLFVBQVU7QUFDckMsUUFBSSxPQUFPLFNBQVMsWUFBWSxrQkFBa0IsS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxHQUFHO0FBQy9FLFdBQUssSUFBSSxJQUFJO0FBQ2IsVUFBSSxLQUFLLElBQUk7QUFBQSxJQUNmO0FBQ0E7QUFBQSxFQUNGO0FBQ0EsTUFBSSxNQUFNLFFBQVEsSUFBSSxHQUFHO0FBQ3ZCLGVBQVcsS0FBSyxLQUFNLG9CQUFtQixHQUFHLE1BQU0sR0FBRztBQUNyRDtBQUFBLEVBQ0Y7QUFDQSxhQUFXLEtBQUssT0FBTyxPQUFPLElBQStCLEdBQUc7QUFDOUQsdUJBQW1CLEdBQUcsTUFBTSxHQUFHO0FBQUEsRUFDakM7QUFDRjtBQUtBLGVBQWUsYUFDYixRQUNBLFVBQ21CO0FBQ25CLFFBQU0sU0FBbUIsQ0FBQztBQUcxQixNQUFJO0FBQ0YsVUFBTSxNQUNKLDBGQUNXLE1BQU0sYUFBYSxRQUFRO0FBRXhDLFVBQU0sT0FBTyxNQUFNLFVBQVUsR0FBRztBQUNoQyxVQUFNLFFBQStCLE1BQU0sU0FBUyxDQUFDO0FBQ3JELFVBQU0sTUFBTSxNQUFNLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxFQUFFLE9BQU8sT0FBTztBQUNuRCxRQUFJLElBQUksU0FBUyxFQUFHLFFBQU87QUFBQSxFQUM3QixTQUFTLEdBQUc7QUFDVixXQUFPLEtBQUssU0FBVSxFQUFZLE9BQU8sRUFBRTtBQUFBLEVBQzdDO0FBSUEsUUFBTSxlQUFlO0FBQ3JCLE1BQUk7QUFDRixVQUFNLE1BQ0osNENBQ08sWUFBWSxhQUFhLFNBQVMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLFdBQVcsTUFBTTtBQUN6RSxVQUFNLE9BQU8sTUFBTSxVQUFVLEdBQUc7QUFDaEMsVUFBTSxRQUFnQyxNQUFNLFFBQVEsSUFBSSxJQUFJLE9BQU8sQ0FBQztBQUNwRSxVQUFNLE1BQU0sTUFBTSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsRUFBRSxPQUFPLENBQUMsT0FBcUIsQ0FBQyxDQUFDLEVBQUU7QUFDdEUsUUFBSSxJQUFJLFNBQVMsRUFBRyxRQUFPO0FBQUEsRUFDN0IsU0FBUyxHQUFHO0FBQ1YsV0FBTyxLQUFLLFVBQVcsRUFBWSxPQUFPLEVBQUU7QUFBQSxFQUM5QztBQUdBLE1BQUk7QUFDRixVQUFNLE1BQ0osa0ZBQ3NCLE1BQU0sY0FBYyxRQUFRO0FBRXBELFVBQU0sT0FBTyxNQUFNLFVBQVUsR0FBRztBQUNoQyxVQUFNLFdBQTZCLE1BQU0sWUFBWSxDQUFDO0FBQ3RELFVBQU0sTUFBTSxTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sT0FBTztBQUMzRCxRQUFJLElBQUksU0FBUyxFQUFHLFFBQU87QUFBQSxFQUM3QixTQUFTLEdBQUc7QUFDVixXQUFPLEtBQUssV0FBWSxFQUFZLE9BQU8sRUFBRTtBQUFBLEVBQy9DO0FBR0EsTUFBSTtBQUNGLFVBQU0sWUFDSjtBQUNGLFVBQU0sSUFBSSxNQUFNLGVBQWUsV0FBVztBQUFBLE1BQ3hDLFNBQVM7QUFBQSxRQUNQLGNBQWNBO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixtQkFBbUI7QUFBQSxNQUNyQjtBQUFBLElBQ0YsQ0FBQztBQUNELFFBQUksQ0FBQyxFQUFFLElBQUk7QUFDVCxZQUFNLElBQUksTUFBTSxRQUFRLEVBQUUsTUFBTSxFQUFFO0FBQUEsSUFDcEM7QUFDQSxVQUFNLE9BQU8sTUFBTSxFQUFFLEtBQUs7QUFDMUIsVUFBTSxNQUFnQixDQUFDO0FBQ3ZCLFVBQU0sT0FBTyxvQkFBSSxJQUFZO0FBRzdCLFVBQU0sZ0JBQWdCLGlFQUFpRSxLQUFLLElBQUk7QUFDaEcsUUFBSSxlQUFlO0FBQ2pCLFVBQUk7QUFDRixjQUFNLFdBQVcsS0FBSyxNQUFNLGNBQWMsQ0FBQyxDQUFDO0FBQzVDLDJCQUFtQixVQUFVLE1BQU0sR0FBRztBQUFBLE1BQ3hDLFFBQVE7QUFBQSxNQUF1QjtBQUFBLElBQ2pDO0FBR0EsUUFBSSxJQUFJLFdBQVcsR0FBRztBQUNwQixZQUFNLFlBQVk7QUFDbEIsVUFBSTtBQUNKLGNBQVEsWUFBWSxVQUFVLEtBQUssSUFBSSxPQUFPLE1BQU07QUFDbEQsY0FBTSxLQUFLLFVBQVUsQ0FBQztBQUN0QixZQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsR0FBRztBQUNqQixlQUFLLElBQUksRUFBRTtBQUNYLGNBQUksS0FBSyxFQUFFO0FBQUEsUUFDYjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBR0EsUUFBSSxJQUFJLFdBQVcsR0FBRztBQUNwQixZQUFNLFVBQVU7QUFDaEIsVUFBSTtBQUNKLGNBQVEsVUFBVSxRQUFRLEtBQUssSUFBSSxPQUFPLE1BQU07QUFDOUMsY0FBTSxLQUFLLFFBQVEsQ0FBQztBQUNwQixZQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsR0FBRztBQUNqQixlQUFLLElBQUksRUFBRTtBQUNYLGNBQUksS0FBSyxFQUFFO0FBQUEsUUFDYjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsUUFBSSxJQUFJLFNBQVMsRUFBRyxRQUFPO0FBQzNCLFdBQU8sS0FBSyx1Q0FBdUMsS0FBSyxNQUFNLGdCQUFnQjtBQUFBLEVBQ2hGLFNBQVMsR0FBRztBQUNWLFdBQU8sS0FBSyxnQkFBaUIsRUFBWSxPQUFPLEVBQUU7QUFBQSxFQUNwRDtBQUVBLFFBQU0sSUFBSSxNQUFNLG1DQUFtQyxPQUFPLEtBQUssS0FBSyxDQUFDLEVBQUU7QUFDekU7QUFFQSxlQUFlLG9CQUNiLEtBQ0EsUUFDQSxVQUMyQjtBQUMzQixRQUFNLFlBQVk7QUFDbEIsUUFBTSxNQUF3QixDQUFDO0FBQy9CLFdBQVMsSUFBSSxHQUFHLElBQUksSUFBSSxRQUFRLEtBQUssV0FBVztBQUM5QyxVQUFNLFFBQVEsSUFBSSxNQUFNLEdBQUcsSUFBSSxTQUFTO0FBQ3hDLFVBQU0sTUFDSixnRUFDVyxNQUFNLEtBQUssR0FBRyxDQUFDLFdBQVcsTUFBTSxjQUFjLFFBQVE7QUFFbkUsUUFBSTtBQUNGLFlBQU0sT0FBTyxNQUFNLFVBQVUsR0FBRztBQUNoQyxZQUFNLFdBQTZCLE1BQU0sWUFBWSxDQUFDO0FBQ3RELFVBQUksS0FBSyxHQUFHLFFBQVE7QUFBQSxJQUN0QixRQUFRO0FBQUEsSUFFUjtBQUFBLEVBQ0Y7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGdCQUNQLFNBQ0EsUUFDZ0I7QUFDaEIsUUFBTSxLQUFLLFFBQVE7QUFDbkIsTUFBSSxDQUFDLEdBQUksUUFBTztBQUVoQixRQUFNLEtBQUssUUFBUSxzQkFBc0IsQ0FBQztBQUMxQyxRQUFNLE9BQU8sSUFBSTtBQUNqQixNQUFJLENBQUMsS0FBTSxRQUFPO0FBRWxCLE1BQUksV0FBMEI7QUFDOUIsUUFBTSxTQUFTLElBQUksVUFBVSxDQUFDO0FBQzlCLFFBQU0sT0FBTyxPQUFPO0FBQUEsSUFDbEIsQ0FBQyxRQUFRLElBQUksaUJBQWlCLGtCQUFrQixJQUFJLGlCQUFpQjtBQUFBLEVBQ3ZFO0FBQ0EsUUFBTSxTQUFTLE9BQU8sS0FBSyxDQUFDLFFBQVEsSUFBSSxpQkFBaUIsUUFBUTtBQUNqRSxRQUFNLFNBQVMsT0FBTyxDQUFDO0FBQ3ZCLFFBQU0sU0FBUyxRQUFRLFVBQVU7QUFDakMsTUFBSSxRQUFRLEtBQUs7QUFDZixlQUFXLE9BQU8sSUFBSSxXQUFXLElBQUksSUFDakMsV0FBVyxPQUFPLE1BQ2xCLE9BQU87QUFBQSxFQUNiO0FBRUEsUUFBTSxNQUFNLFFBQVEsMkJBQTJCLENBQUM7QUFDaEQsUUFBTSxTQUFTLEtBQUssa0JBQWtCLENBQUM7QUFFdkMsTUFBSSxZQUEyQjtBQUMvQixNQUFJLFlBQTJCO0FBQy9CLE1BQUksVUFBeUI7QUFDN0IsUUFBTSxXQUFXLGFBQWEsTUFBTSxLQUFLO0FBRXpDLGFBQVcsS0FBSyxRQUFRO0FBQ3RCLFVBQU0sSUFBSSxFQUFFLHFCQUFxQjtBQUNqQyxRQUFJLENBQUMsRUFBRztBQUNSLFVBQU0sT0FBTyxFQUFFLFFBQVEsRUFBRTtBQUN6QixVQUFNLE9BQU8sRUFBRSxhQUFhLEVBQUU7QUFDOUIsUUFBSSxRQUFRLFFBQVEsYUFBYSxLQUFNLGFBQVk7QUFDbkQsUUFBSSxRQUFRLFFBQVEsUUFBUSxRQUFRLFdBQVc7QUFDN0Msa0JBQVk7QUFDWixnQkFBVSxFQUFFLFlBQVksV0FBVztBQUFBLElBQ3JDO0FBQUEsRUFDRjtBQUVBLE1BQUksYUFBYSxRQUFRLGFBQWEsS0FBTSxRQUFPO0FBRW5ELFFBQU0sZ0JBQWdCLFFBQVEsU0FBUztBQUN2QyxRQUFNLGtCQUFrQixRQUFRLFNBQVMsS0FBSztBQUM5QyxNQUFJLGtCQUFrQjtBQUN0QixNQUNFLGlCQUNBLG1CQUFtQixRQUNuQixrQkFBa0IsZUFDbEI7QUFDQSxzQkFBa0IsS0FBSztBQUFBLE9BQ25CLGdCQUFnQixtQkFBbUIsTUFBTztBQUFBLElBQzlDO0FBQUEsRUFDRjtBQUVBLFFBQU0sU0FBUyxXQUFXLE1BQU0sS0FBSztBQUNyQyxRQUFNLFdBQVcsd0JBQXdCLE9BQU8sWUFBWSxDQUFDLGdCQUFnQixtQkFBbUIsS0FBSyxZQUFZLEVBQUUsUUFBUSxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRTtBQUU5SSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EsbUJBQW1CO0FBQUEsSUFDbkI7QUFBQSxJQUNBLG9CQUFvQjtBQUFBLElBQ3BCLHNCQUFzQjtBQUFBLElBQ3RCO0FBQUEsSUFDQSxlQUFlO0FBQUEsRUFDakI7QUFDRjtBQUVPLElBQU0sZUFBeUI7QUFBQSxFQUNwQyxVQUFVO0FBQUEsRUFDVixPQUFPLFdBQVcsUUFBaUQ7QUFDakUsVUFBTSxTQUFTLFdBQVcsT0FBTyxNQUFNO0FBQ3ZDLFVBQU0sV0FBVyxTQUFTLE9BQU8sTUFBTTtBQUN2QyxRQUFJLENBQUMsVUFBVSxDQUFDLFVBQVU7QUFDeEIsWUFBTSxJQUFJLGNBQWMsUUFBUSxPQUFPLFFBQVEsMkJBQXdCLE9BQU8sTUFBTSxFQUFFO0FBQUEsSUFDeEY7QUFFQSxVQUFNLE1BQU0sTUFBTSxhQUFhLFFBQVEsUUFBUTtBQUMvQyxRQUFJLElBQUksV0FBVyxFQUFHO0FBRXRCLFVBQU0sV0FBVyxNQUFNLG9CQUFvQixLQUFLLFFBQVEsUUFBUTtBQUVoRSxlQUFXLFdBQVcsVUFBVTtBQUM5QixZQUFNLE9BQU8sZ0JBQWdCLFNBQVMsT0FBTyxNQUFNO0FBQ25ELFVBQUksUUFBUSxLQUFLLGtCQUFrQixHQUFHO0FBQ3BDLGNBQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjs7O0FDalZBLElBQU1DLE1BQ0o7QUFHRixJQUFNLFNBQWlDO0FBQUEsRUFDckMsSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUNOO0FBRUEsSUFBTUMsZ0JBQXVDO0FBQUEsRUFDM0MsSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUNOO0FBb0JBLGVBQWVDLFdBQVUsS0FBMkI7QUFDbEQsTUFBSTtBQUNKLFdBQVMsVUFBVSxHQUFHLFVBQVUsR0FBRyxXQUFXO0FBQzVDLFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLEtBQUs7QUFBQSxRQUN6QixTQUFTO0FBQUEsVUFDUCxjQUFjRjtBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsUUFBUTtBQUFBLFFBQ1Y7QUFBQSxNQUNGLENBQUM7QUFDRCxVQUFJLENBQUMsRUFBRSxJQUFJO0FBQ1QsY0FBTSxPQUFPLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNLEVBQUU7QUFDMUMsY0FBTSxJQUFJLE1BQU0sUUFBUSxFQUFFLE1BQU0sS0FBSyxLQUFLLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRTtBQUFBLE1BQzNEO0FBQ0EsYUFBTyxNQUFNLEVBQUUsS0FBSztBQUFBLElBQ3RCLFNBQVMsR0FBRztBQUNWLGtCQUFZO0FBQ1osWUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLFdBQVcsS0FBSyxNQUFNLEtBQUssT0FBTyxDQUFDO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQ0EsUUFBTTtBQUNSO0FBRUEsU0FBUyxnQkFBZ0IsVUFBb0Q7QUFDM0UsTUFBSSxDQUFDLFNBQVUsUUFBTztBQUV0QixRQUFNLElBQUksU0FDUCxRQUFRLFdBQVcsR0FBRyxFQUN0QixRQUFRLFdBQVcsRUFBRSxFQUNyQixLQUFLO0FBQ1IsTUFBSSxDQUFDLEtBQUssU0FBUyxLQUFLLENBQUMsS0FBSyxVQUFVLEtBQUssQ0FBQyxFQUFHLFFBQU87QUFFeEQsUUFBTSxVQUFVLEVBQUUsUUFBUSxjQUFjLEVBQUU7QUFDMUMsTUFBSSxDQUFDLFFBQVMsUUFBTztBQUdyQixRQUFNLFFBQVEsUUFBUSxNQUFNLE1BQU07QUFDbEMsTUFBSSxNQUFNLFVBQVUsR0FBRztBQUNyQixVQUFNLFdBQVcsTUFBTSxNQUFNLFNBQVMsQ0FBQztBQUN2QyxRQUFJLFNBQVMsV0FBVyxHQUFHO0FBQ3pCLFlBQU0sUUFBUSxNQUFNLE1BQU0sR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFO0FBQ3hDLFlBQU1HLEtBQUksT0FBTyxRQUFRLE1BQU0sUUFBUTtBQUN2QyxVQUFJLE9BQU8sU0FBU0EsRUFBQyxFQUFHLFFBQU8sS0FBSyxNQUFNQSxLQUFJLEdBQUc7QUFBQSxJQUNuRDtBQUFBLEVBQ0Y7QUFFQSxRQUFNLElBQUksT0FBTyxRQUFRLFFBQVEsTUFBTSxHQUFHLENBQUM7QUFDM0MsTUFBSSxPQUFPLFNBQVMsQ0FBQyxFQUFHLFFBQU8sS0FBSyxNQUFNLElBQUksR0FBRztBQUNqRCxTQUFPO0FBQ1Q7QUFPQSxnQkFBZ0IsZ0JBQ2QsSUFDQSxVQUNBLFFBQ3lCO0FBQ3pCLFFBQU0sV0FBVztBQUNqQixRQUFNLFdBQVc7QUFDakIsUUFBTSxPQUFPLG9CQUFJLElBQVk7QUFFN0IsV0FBUyxPQUFPLEdBQUcsT0FBTyxVQUFVLFFBQVE7QUFDMUMsVUFBTSxRQUFRLE9BQU87QUFDckIsVUFBTSxNQUNKLDhEQUE4RCxLQUFLLFVBQ3pELFFBQVEsd0VBQ2dCLEVBQUU7QUFFdEMsUUFBSTtBQUNKLFFBQUk7QUFDRixhQUFPLE1BQU1ELFdBQVUsR0FBRztBQUFBLElBQzVCLFNBQVMsR0FBRztBQUNWLFVBQUksU0FBUyxHQUFHO0FBQ2QsY0FBTSxJQUFJLGNBQWMsU0FBUyxRQUFRLHdCQUF5QixFQUFZLE9BQU8sRUFBRTtBQUFBLE1BQ3pGO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFlLE1BQU0sZ0JBQWdCO0FBQzNDLFFBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxNQUFNLElBQUk7QUFDL0IsVUFBSSxTQUFTLEdBQUc7QUFDZCxjQUFNLFFBQVEsTUFBTSxlQUFlO0FBQ25DLGNBQU0sSUFBSSxjQUFjLFNBQVMsUUFBUSwwQ0FBMEMsS0FBSyxjQUFjLEtBQUssTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHO0FBQUEsTUFDN0g7QUFDQTtBQUFBLElBQ0Y7QUFHQSxVQUFNLFVBQThDLENBQUM7QUFDckQsVUFBTSxlQUFlLENBQUMsR0FBRyxLQUFLLFNBQVMsK0JBQStCLENBQUM7QUFDdkUsYUFBUyxJQUFJLEdBQUcsSUFBSSxhQUFhLFFBQVEsS0FBSztBQUM1QyxZQUFNLFFBQVEsYUFBYSxDQUFDLEVBQUUsQ0FBQztBQUMvQixZQUFNLFdBQVcsYUFBYSxDQUFDLEVBQUU7QUFDakMsWUFBTSxTQUFTLElBQUksSUFBSSxhQUFhLFNBQVMsYUFBYSxJQUFJLENBQUMsRUFBRSxRQUFTLEtBQUs7QUFDL0UsY0FBUSxLQUFLLEVBQUUsT0FBTyxPQUFPLEtBQUssTUFBTSxVQUFVLE1BQU0sRUFBRSxDQUFDO0FBQUEsSUFDN0Q7QUFFQSxRQUFJLGNBQWM7QUFFbEIsZUFBVyxFQUFFLE9BQU8sT0FBTyxJQUFJLEtBQUssU0FBUztBQUMzQyxVQUFJLEtBQUssSUFBSSxLQUFLLEVBQUc7QUFDckIsV0FBSyxJQUFJLEtBQUs7QUFFZCxZQUFNLFlBQVksc0NBQXNDLEtBQUssR0FBRztBQUNoRSxVQUFJLENBQUMsVUFBVztBQUNoQixZQUFNLE9BQU8sVUFBVSxDQUFDLEVBQUUsS0FBSztBQUUvQixZQUFNLFdBQVcsNkJBQTZCLEtBQUssR0FBRztBQUN0RCxZQUFNLFlBQVksd0NBQXdDLEtBQUssR0FBRztBQUNsRSxZQUFNLGFBQWEscUNBQXFDLEtBQUssR0FBRztBQUVoRSxZQUFNLGlCQUFpQixXQUFXLENBQUMsR0FBRyxLQUFLLEVBQUUsUUFBUSxTQUFTLEVBQUUsS0FBSztBQUNyRSxZQUFNLG1CQUFtQixZQUFZLENBQUMsR0FBRyxLQUFLLEtBQUs7QUFDbkQsWUFBTSxnQkFBZ0IsYUFBYSxDQUFDLEdBQUcsS0FBSyxLQUFLO0FBRWpELFlBQU0sa0JBQWtCLFNBQVMsY0FBYyxLQUFLO0FBQ3BELFlBQU0sZ0JBQWdCLGdCQUFnQixnQkFBZ0I7QUFDdEQsWUFBTSxrQkFBa0IsZ0JBQWdCLGFBQWE7QUFFckQsVUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFpQjtBQUN4QztBQUVBLFlBQU07QUFBQSxRQUNKLElBQUk7QUFBQSxRQUNKO0FBQUEsUUFDQSxVQUFVLGlEQUFpRCxLQUFLO0FBQUEsUUFDaEUsVUFBVSxzQ0FBc0MsS0FBSztBQUFBLFFBQ3JELG1CQUFtQjtBQUFBLFFBQ25CO0FBQUEsUUFDQSxvQkFBb0I7QUFBQSxRQUNwQixzQkFBc0IsbUJBQW1CO0FBQUEsUUFDekM7QUFBQSxRQUNBLGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGFBQWEsTUFBTSxlQUFlO0FBQ3hDLFFBQUksUUFBUSxZQUFZLGNBQWMsZ0JBQWdCLEVBQUc7QUFBQSxFQUMzRDtBQUNGO0FBRU8sSUFBTSxnQkFBMEI7QUFBQSxFQUNyQyxVQUFVO0FBQUEsRUFDVixPQUFPLFdBQVcsUUFBaUQ7QUFDakUsVUFBTSxLQUFLLE9BQU8sT0FBTyxNQUFNO0FBQy9CLFVBQU0sV0FBV0QsY0FBYSxPQUFPLE1BQU07QUFDM0MsUUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVO0FBQ3BCLFlBQU0sSUFBSTtBQUFBLFFBQ1I7QUFBQSxRQUNBLE9BQU87QUFBQSxRQUNQLDJCQUF3QixPQUFPLE1BQU07QUFBQSxNQUN2QztBQUFBLElBQ0Y7QUFFQSxXQUFPLGdCQUFnQixJQUFJLFVBQVUsT0FBTyxNQUFNO0FBQUEsRUFDcEQ7QUFDRjs7O0FDbk1BLElBQU1HLE1BQ0o7QUFHRixJQUFNQyxnQkFBdUM7QUFBQSxFQUMzQyxJQUFJO0FBQUEsRUFDSixJQUFJO0FBQ047QUFFQSxlQUFlQyxnQkFDYixLQUNBLFNBQ21CO0FBQ25CLE1BQUk7QUFDSixXQUFTLFVBQVUsR0FBRyxVQUFVLEdBQUcsV0FBVztBQUM1QyxRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxLQUFLO0FBQUEsUUFDekIsU0FBUyxFQUFFLGNBQWNGLEtBQUksR0FBRyxRQUFRO0FBQUEsTUFDMUMsQ0FBQztBQUNELFVBQUksRUFBRSxXQUFXLE9BQU8sRUFBRSxXQUFXLEtBQUs7QUFDeEMsY0FBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLFdBQVcsS0FBSyxNQUFPLEtBQUssT0FBTyxDQUFDO0FBQy9EO0FBQUEsTUFDRjtBQUNBLGFBQU87QUFBQSxJQUNULFNBQVMsR0FBRztBQUNWLGtCQUFZO0FBQ1osWUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLFdBQVcsS0FBSyxNQUFNLEtBQUssT0FBTyxDQUFDO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQ0EsUUFBTTtBQUNSO0FBRUEsZUFBZUcsV0FBVSxLQUFhLFNBQWdEO0FBQ3BGLFFBQU0sSUFBSSxNQUFNRCxnQkFBZSxLQUFLO0FBQUEsSUFDbEMsUUFBUTtBQUFBLElBQ1IsR0FBRztBQUFBLEVBQ0wsQ0FBQztBQUNELE1BQUksQ0FBQyxFQUFFLEdBQUksT0FBTSxJQUFJLE1BQU0sUUFBUSxFQUFFLE1BQU0sRUFBRTtBQUM3QyxTQUFPLEVBQUUsS0FBSztBQUNoQjtBQUVBLGVBQWVFLFdBQVUsS0FBOEI7QUFDckQsUUFBTSxJQUFJLE1BQU1GLGdCQUFlLEtBQUs7QUFBQSxJQUNsQyxRQUFRO0FBQUEsSUFDUixtQkFBbUI7QUFBQSxFQUNyQixDQUFDO0FBQ0QsTUFBSSxDQUFDLEVBQUUsR0FBSSxPQUFNLElBQUksTUFBTSxRQUFRLEVBQUUsTUFBTSxFQUFFO0FBQzdDLFNBQU8sRUFBRSxLQUFLO0FBQ2hCO0FBRUEsZUFBZSxTQUFTLEtBQWEsTUFBVyxTQUFnRDtBQUM5RixNQUFJO0FBQ0osV0FBUyxVQUFVLEdBQUcsVUFBVSxHQUFHLFdBQVc7QUFDNUMsUUFBSTtBQUNGLFlBQU0sSUFBSSxNQUFNLE1BQU0sS0FBSztBQUFBLFFBQ3pCLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNQLGNBQWNGO0FBQUEsVUFDZCxnQkFBZ0I7QUFBQSxVQUNoQixRQUFRO0FBQUEsVUFDUixHQUFHO0FBQUEsUUFDTDtBQUFBLFFBQ0EsTUFBTSxLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQzNCLENBQUM7QUFDRCxVQUFJLENBQUMsRUFBRSxJQUFJO0FBQ1QsY0FBTSxPQUFPLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNLEVBQUU7QUFDMUMsY0FBTSxJQUFJLE1BQU0sUUFBUSxFQUFFLE1BQU0sS0FBSyxLQUFLLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRTtBQUFBLE1BQzNEO0FBQ0EsYUFBTyxNQUFNLEVBQUUsS0FBSztBQUFBLElBQ3RCLFNBQVMsR0FBRztBQUNWLGtCQUFZO0FBQ1osWUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLFdBQVcsS0FBSyxNQUFNLEtBQUssT0FBTyxDQUFDO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQ0EsUUFBTTtBQUNSO0FBSUEsSUFBTSxpQkFBaUI7QUFDdkIsSUFBTSxrQkFBa0I7QUFDeEIsSUFBTSxnQkFBZ0I7QUF3QnRCLElBQU0sb0JBQW9CO0FBQUEsRUFDeEIsZ0JBQWdCLG1CQUFtQiw0QkFBNEIsQ0FBQztBQUFBLEVBQ2hFLGdCQUFnQixtQkFBbUIsOEJBQThCLENBQUM7QUFBQSxFQUNsRSxrQkFBa0IsbUJBQW1CLHdCQUF3QixDQUFDO0FBQUEsRUFDOUQ7QUFBQTtBQUNGO0FBRUEsZUFBZSxhQUNiLFFBQ2M7QUFDZCxTQUFPO0FBQUEsSUFDTCxXQUFXLGNBQWMsOEJBQThCLGFBQWE7QUFBQSxJQUNwRSxFQUFFLE9BQU87QUFBQSxJQUNUO0FBQUEsTUFDRSw0QkFBNEI7QUFBQSxNQUM1QixxQkFBcUI7QUFBQSxJQUN2QjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLGVBQWUsb0JBQXFDO0FBQ2xELGFBQVcsVUFBVSxtQkFBbUI7QUFDdEMsVUFBTSxRQUFRLFNBQVMsSUFBSSxNQUFNLEtBQUs7QUFDdEMsVUFBTSxTQUFTLDhCQUE4QixLQUFLO0FBQ2xELFFBQUk7QUFDRixZQUFNLE9BQU8sTUFBTSxhQUFhLE1BQU07QUFDdEMsWUFBTSxTQUFTLE1BQU0sVUFBVTtBQUMvQixVQUFJLFNBQVMsR0FBRztBQUNkLGdCQUFRLElBQUksbUNBQW1DLE1BQU0sTUFBTSxVQUFVLGNBQWMsRUFBRTtBQUNyRixlQUFPO0FBQUEsTUFDVDtBQUNBLGNBQVEsSUFBSSx5Q0FBeUMsVUFBVSxjQUFjLEVBQUU7QUFBQSxJQUNqRixTQUFTLEdBQUc7QUFDVixjQUFRLElBQUksK0JBQStCLFVBQVUsY0FBYyxXQUFPLEVBQVksT0FBTyxFQUFFO0FBQUEsSUFDakc7QUFBQSxFQUNGO0FBQ0EsVUFBUSxLQUFLLHVEQUFpRDtBQUM5RCxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGlCQUFpQixLQUFpQztBQUN6RCxRQUFNLEtBQUssSUFBSSxTQUFTLElBQUk7QUFDNUIsUUFBTSxPQUFPLElBQUk7QUFDakIsTUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFJLFFBQU87QUFFekIsUUFBTSxRQUFRLElBQUk7QUFDbEIsTUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLFVBQVcsUUFBTztBQUV2QyxRQUFNLFdBQVcsTUFBTTtBQUN2QixRQUFNLFlBQVksTUFBTTtBQUV4QixRQUFNLGdCQUFnQixZQUFZLE9BQU8sS0FBSyxNQUFNLFdBQVcsR0FBRyxJQUFJO0FBQ3RFLFFBQU0sa0JBQ0osYUFBYSxPQUFPLEtBQUssTUFBTSxZQUFZLEdBQUcsSUFBSTtBQUVwRCxNQUFJLGtCQUFrQixNQUFNLGNBQWM7QUFDMUMsTUFDRSxDQUFDLG1CQUNELGlCQUNBLG1CQUFtQixRQUNuQixrQkFBa0IsZUFDbEI7QUFDQSxzQkFBa0IsS0FBSztBQUFBLE9BQ25CLGdCQUFnQixtQkFBbUIsTUFBTztBQUFBLElBQzlDO0FBQUEsRUFDRjtBQUVBLFFBQU0sV0FBVyxJQUFJLHNCQUFzQixJQUFJLGdCQUFnQjtBQUMvRCxRQUFNLFdBQVcsSUFBSSxNQUNqQiwyQkFBMkIsSUFBSSxHQUFHLEtBQ2xDLDhDQUE4QyxFQUFFO0FBRXBELFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxtQkFBbUIsSUFBSSxZQUFZO0FBQUEsSUFDbkMsVUFBVTtBQUFBLElBQ1Ysb0JBQW9CO0FBQUEsSUFDcEIsc0JBQXNCO0FBQUEsSUFDdEI7QUFBQSxJQUNBLGVBQWUsSUFBSSxjQUFjLG9CQUFvQjtBQUFBLEVBQ3ZEO0FBQ0Y7QUFFQSxnQkFBZ0Isa0JBQTJDO0FBQ3pELFFBQU0sU0FBUyxNQUFNLGtCQUFrQjtBQUN2QyxRQUFNLFdBQVc7QUFDakIsUUFBTSxXQUFXO0FBQ2pCLE1BQUksVUFBVTtBQUNkLE1BQUksa0JBQWtCO0FBRXRCLFdBQVMsT0FBTyxHQUFHLE9BQU8sVUFBVSxRQUFRO0FBQzFDLFVBQU0sUUFBUSxTQUFTLElBQUksTUFBTSxLQUFLO0FBQ3RDLFVBQU0sU0FBUyxzQkFBc0IsUUFBUSxTQUFTLElBQUksR0FBRyxLQUFLO0FBRWxFLFFBQUk7QUFDSixRQUFJO0FBQ0YsYUFBTyxNQUFNLGFBQWEsTUFBTTtBQUFBLElBQ2xDLFNBQVMsR0FBRztBQUNWLFVBQUksU0FBUyxHQUFHO0FBQ2QsY0FBTSxJQUFJLGNBQWMsWUFBWSxNQUFNLDJCQUE0QixFQUFZLE9BQU8sRUFBRTtBQUFBLE1BQzdGO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFxQixNQUFNLFFBQVEsQ0FBQztBQUMxQyxRQUFJLEtBQUssV0FBVyxHQUFHO0FBQ3JCLFVBQUksU0FBUyxHQUFHO0FBQ2QsY0FBTSxNQUFNLE1BQU0sV0FBVyxrQkFBa0IsTUFBTSxNQUFNO0FBQzNELGNBQU0sSUFBSSxjQUFjLFlBQVksTUFBTSxnQ0FBZ0MsR0FBRyxFQUFFO0FBQUEsTUFDakY7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLFlBQVk7QUFDaEIsZUFBVyxPQUFPLE1BQU07QUFDdEIsWUFBTSxPQUFPLGlCQUFpQixHQUFHO0FBQ2pDLFVBQUksTUFBTTtBQUNSO0FBQ0E7QUFDQSxjQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFHQSxRQUFJLENBQUMsVUFBVSxjQUFjLEdBQUc7QUFDOUI7QUFDQSxVQUFJLG1CQUFtQixFQUFHO0FBQUEsSUFDNUIsT0FBTztBQUNMLHdCQUFrQjtBQUFBLElBQ3BCO0FBRUEsVUFBTSxhQUFhLE1BQU0sV0FBVztBQUNwQyxRQUFJLE9BQU8sS0FBSyxXQUFZO0FBQUEsRUFDOUI7QUFFQSxNQUFJLFlBQVksR0FBRztBQUNqQixVQUFNLElBQUksY0FBYyxZQUFZLE1BQU0sbURBQW1EO0FBQUEsRUFDL0Y7QUFDRjtBQU1BLFNBQVMsYUFBYSxHQUE2QztBQUNqRSxNQUFJLENBQUMsRUFBRyxRQUFPO0FBQ2YsUUFBTSxVQUFVLEVBQUUsUUFBUSxXQUFXLEVBQUU7QUFDdkMsUUFBTSxJQUFJLFNBQVMsU0FBUyxFQUFFO0FBQzlCLE1BQUksQ0FBQyxPQUFPLFNBQVMsQ0FBQyxLQUFLLE1BQU0sRUFBRyxRQUFPO0FBRTNDLFNBQU8sSUFBSTtBQUNiO0FBSUEsU0FBUyxpQkFBaUIsTUFBeUI7QUFDakQsUUFBTSxRQUFtQixDQUFDO0FBQzFCLFFBQU0sT0FBTyxvQkFBSSxJQUFZO0FBRzdCLFFBQU0sY0FBYztBQUNwQixNQUFJO0FBQ0osVUFBUSxjQUFjLFlBQVksS0FBSyxJQUFJLE9BQU8sTUFBTTtBQUN0RCxRQUFJO0FBQ0YsWUFBTSxLQUFLLEtBQUssTUFBTSxZQUFZLENBQUMsQ0FBQztBQUNwQyxZQUFNLFFBQVEsTUFBTSxRQUFRLEVBQUUsSUFBSSxLQUFLLEdBQUcsUUFBUSxJQUFJLEdBQUcsUUFBUSxJQUFJLENBQUMsRUFBRTtBQUN4RSxpQkFBVyxRQUFRLE9BQU87QUFDeEIsWUFBSSxLQUFLLE9BQU8sTUFBTSxhQUFhLEtBQUssT0FBTyxNQUFNLFlBQWE7QUFDbEUsY0FBTSxLQUFLLEtBQUssT0FBTyxLQUFLLGFBQWEsS0FBSztBQUM5QyxZQUFJLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRSxFQUFHO0FBQ3pCLGFBQUssSUFBSSxFQUFFO0FBQ1gsY0FBTSxRQUFRLE1BQU0sUUFBUSxLQUFLLE1BQU0sSUFBSSxLQUFLLE9BQU8sQ0FBQyxJQUFJLEtBQUs7QUFDakUsY0FBTSxLQUFLO0FBQUEsVUFDVCxJQUFJLE9BQU8sRUFBRTtBQUFBLFVBQ2IsTUFBTSxLQUFLLFFBQVE7QUFBQSxVQUNuQixVQUFVLEtBQUssU0FBUztBQUFBLFVBQ3hCLFVBQVUsS0FBSyxPQUFPLCtDQUErQyxFQUFFO0FBQUEsVUFDdkUsbUJBQW1CO0FBQUEsVUFDbkIsVUFBVTtBQUFBLFVBQ1Ysb0JBQW9CO0FBQUEsVUFDcEIsc0JBQXNCLGFBQWEsT0FBTyxTQUFTLE9BQU8sUUFBUTtBQUFBLFVBQ2xFLGlCQUFpQjtBQUFBLFVBQ2pCLGVBQWU7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0YsUUFBUTtBQUFBLElBQWlDO0FBQUEsRUFDM0M7QUFFQSxNQUFJLE1BQU0sU0FBUyxFQUFHLFFBQU87QUFHN0IsUUFBTSxnQkFBZ0IsaUVBQWlFLEtBQUssSUFBSTtBQUNoRyxNQUFJLGVBQWU7QUFDakIsUUFBSTtBQUNGLFlBQU0sT0FBTyxLQUFLLE1BQU0sY0FBYyxDQUFDLENBQUM7QUFDeEMsWUFBTSxXQUFXLG1CQUFtQixJQUFJO0FBQ3hDLGlCQUFXLEtBQUssVUFBVTtBQUN4QixZQUFJLEtBQUssSUFBSSxFQUFFLEVBQUUsRUFBRztBQUNwQixhQUFLLElBQUksRUFBRSxFQUFFO0FBQ2IsY0FBTSxLQUFLLENBQUM7QUFBQSxNQUNkO0FBQUEsSUFDRixRQUFRO0FBQUEsSUFBZTtBQUFBLEVBQ3pCO0FBRUEsTUFBSSxNQUFNLFNBQVMsRUFBRyxRQUFPO0FBSTdCLFFBQU0sWUFDSjtBQUNGLE1BQUk7QUFDSixVQUFRLFlBQVksVUFBVSxLQUFLLElBQUksT0FBTyxNQUFNO0FBQ2xELFVBQU0sS0FBSyxVQUFVLENBQUMsRUFBRSxLQUFLO0FBQzdCLFFBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFLEVBQUc7QUFDekIsU0FBSyxJQUFJLEVBQUU7QUFDWCxVQUFNLEtBQUs7QUFBQSxNQUNUO0FBQUEsTUFDQSxNQUFNLFVBQVUsQ0FBQyxFQUFFLEtBQUs7QUFBQSxNQUN4QixVQUFVO0FBQUEsTUFDVixVQUFVLCtDQUErQyxFQUFFO0FBQUEsTUFDM0QsbUJBQW1CO0FBQUEsTUFDbkIsVUFBVTtBQUFBLE1BQ1Ysb0JBQW9CO0FBQUEsTUFDcEIsc0JBQXNCLGFBQWEsVUFBVSxDQUFDLENBQUM7QUFBQSxNQUMvQyxpQkFBaUI7QUFBQSxNQUNqQixlQUFlO0FBQUEsSUFDakIsQ0FBQztBQUFBLEVBQ0g7QUFHQSxRQUFNLGlCQUFpQjtBQUN2QixNQUFJO0FBQ0osVUFBUSxXQUFXLGVBQWUsS0FBSyxJQUFJLE9BQU8sTUFBTTtBQUN0RCxRQUFJO0FBQ0YsWUFBTSxNQUFNLEtBQUssTUFBTSxNQUFNLFNBQVMsQ0FBQyxJQUFJLEdBQUc7QUFDOUMsaUJBQVcsUUFBUSxLQUFLO0FBQ3RCLGNBQU0sS0FBSyxLQUFLLE1BQU0sS0FBSyxTQUFTLEtBQUssYUFBYSxLQUFLO0FBQzNELGNBQU0sT0FBTyxLQUFLLFNBQVMsS0FBSyxRQUFRLEtBQUs7QUFDN0MsWUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEtBQUssSUFBSSxPQUFPLEVBQUUsQ0FBQyxFQUFHO0FBQzFDLGFBQUssSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNuQixjQUFNLFFBQVEsS0FBSyxhQUFhLEtBQUssU0FBUyxLQUFLO0FBQ25ELGNBQU0sWUFBWSxLQUFLLGlCQUFpQixLQUFLLGdCQUFnQixLQUFLO0FBQ2xFLGNBQU0sS0FBSztBQUFBLFVBQ1QsSUFBSSxPQUFPLEVBQUU7QUFBQSxVQUNiO0FBQUEsVUFDQSxVQUFVLEtBQUssU0FBUyxLQUFLLFlBQVksS0FBSyxhQUFhO0FBQUEsVUFDM0QsVUFBVSxLQUFLLE9BQU8sK0NBQStDLEVBQUU7QUFBQSxVQUN2RSxtQkFBbUI7QUFBQSxVQUNuQixVQUFVO0FBQUEsVUFDVixvQkFBb0IsYUFBYSxPQUFPLGFBQWEsRUFBRSxDQUFDO0FBQUEsVUFDeEQsc0JBQXNCLGFBQWEsT0FBTyxTQUFTLEVBQUUsQ0FBQztBQUFBLFVBQ3RELGlCQUFpQixTQUFTLEtBQUssZ0JBQWdCLEtBQUssbUJBQW1CLEdBQUcsS0FBSztBQUFBLFVBQy9FLGVBQWU7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0YsUUFBUTtBQUFBLElBQTZCO0FBQUEsRUFDdkM7QUFFQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLG1CQUFtQixNQUFlLFVBQXFCLENBQUMsR0FBYztBQUM3RSxNQUFJLENBQUMsUUFBUSxPQUFPLFNBQVMsU0FBVSxRQUFPO0FBQzlDLE1BQUksTUFBTSxRQUFRLElBQUksR0FBRztBQUN2QixlQUFXLEtBQUssS0FBTSxvQkFBbUIsR0FBRyxPQUFPO0FBQ25ELFdBQU87QUFBQSxFQUNUO0FBQ0EsUUFBTSxNQUFNO0FBQ1osUUFBTSxLQUFLLElBQUksU0FBUyxJQUFJLE1BQU0sSUFBSTtBQUN0QyxRQUFNLE9BQU8sSUFBSSxTQUFTLElBQUk7QUFDOUIsUUFBTSxXQUFXLElBQUksU0FBUyxRQUFRLElBQUksYUFBYSxRQUFRLElBQUksZ0JBQWdCO0FBQ25GLE1BQUksTUFBTSxRQUFRLFVBQVU7QUFDMUIsWUFBUSxLQUFLO0FBQUEsTUFDWCxJQUFJLE9BQU8sRUFBRTtBQUFBLE1BQ2IsTUFBTSxPQUFPLElBQUk7QUFBQSxNQUNqQixVQUFVLElBQUksU0FBUyxJQUFJLFlBQVk7QUFBQSxNQUN2QyxVQUFVLElBQUksT0FBTywrQ0FBK0MsRUFBRTtBQUFBLE1BQ3RFLG1CQUFtQjtBQUFBLE1BQ25CLFVBQVU7QUFBQSxNQUNWLG9CQUFvQixhQUFhLE9BQU8sSUFBSSxnQkFBZ0IsSUFBSSxpQkFBaUIsSUFBSSxTQUFTLEVBQUUsQ0FBQztBQUFBLE1BQ2pHLHNCQUFzQixhQUFhLE9BQU8sSUFBSSxhQUFhLElBQUksaUJBQWlCLElBQUksU0FBUyxFQUFFLENBQUM7QUFBQSxNQUNoRyxpQkFBaUIsU0FBUyxJQUFJLGdCQUFnQixJQUFJLG1CQUFtQixHQUFHLEtBQUs7QUFBQSxNQUM3RSxlQUFlO0FBQUEsSUFDakIsQ0FBQztBQUFBLEVBQ0g7QUFDQSxhQUFXLEtBQUssT0FBTyxPQUFPLEdBQUcsRUFBRyxvQkFBbUIsR0FBRyxPQUFPO0FBQ2pFLFNBQU87QUFDVDtBQUVBLGdCQUFnQix3QkFBaUQ7QUFDL0QsUUFBTSxXQUFXO0FBQ2pCLFFBQU0sT0FBTyxvQkFBSSxJQUFZO0FBRTdCLFdBQVMsT0FBTyxHQUFHLFFBQVEsVUFBVSxRQUFRO0FBQzNDLFVBQU0sTUFDSixrR0FDdUQsSUFBSTtBQUU3RCxRQUFJO0FBQ0osUUFBSTtBQUNGLGFBQU8sTUFBTUksV0FBVSxHQUFHO0FBQUEsSUFDNUIsUUFBUTtBQUNOO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBUSxpQkFBaUIsSUFBSTtBQUNuQyxRQUFJLFlBQVk7QUFDaEIsZUFBVyxRQUFRLE9BQU87QUFDeEIsVUFBSSxLQUFLLElBQUksS0FBSyxFQUFFLEVBQUc7QUFDdkIsV0FBSyxJQUFJLEtBQUssRUFBRTtBQUNoQjtBQUVBLFVBQ0UsS0FBSyxzQkFDTCxLQUFLLHdCQUNMLEtBQUssdUJBQXVCLEtBQUssc0JBQ2pDLENBQUMsS0FBSyxpQkFDTjtBQUNBLGFBQUssa0JBQWtCLEtBQUs7QUFBQSxXQUN4QixLQUFLLHFCQUFxQixLQUFLLHdCQUF3QixNQUN2RCxLQUFLO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFFQSxZQUFNO0FBQUEsSUFDUjtBQUVBLFFBQUksY0FBYyxFQUFHO0FBQUEsRUFDdkI7QUFDRjtBQUdBLGdCQUFnQiw0QkFBcUQ7QUFDbkUsUUFBTSxXQUFXO0FBQ2pCLE1BQUksUUFBUTtBQUNaLFFBQU0sV0FBVztBQUVqQixTQUFPLFFBQVEsVUFBVTtBQUN2QixVQUFNLE1BQ0osd0dBRVMsUUFBUSxVQUFVLEtBQUs7QUFFbEMsUUFBSTtBQUNKLFFBQUk7QUFDRixhQUFPLE1BQU1ELFdBQVUsR0FBRztBQUFBLElBQzVCLFFBQVE7QUFDTjtBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQU8sTUFBTSxRQUFRLFNBQVMsQ0FBQztBQUNyQyxRQUFJLEtBQUssV0FBVyxFQUFHO0FBRXZCLGVBQVcsUUFBUSxNQUFNO0FBQ3ZCLFlBQU0sS0FBSyxLQUFLLFNBQVMsS0FBSztBQUM5QixZQUFNLE9BQU8sS0FBSztBQUNsQixVQUFJLENBQUMsUUFBUSxDQUFDLEdBQUk7QUFFbEIsWUFBTSxnQkFBZ0IsYUFBYSxLQUFLLElBQUk7QUFDNUMsWUFBTSxrQkFBa0IsYUFBYSxLQUFLLElBQUksS0FBSztBQUVuRCxVQUFJLGtCQUFrQixTQUFTLEtBQUssS0FBSyxLQUFLO0FBQzlDLFVBQ0UsQ0FBQyxtQkFDRCxpQkFDQSxtQkFBbUIsUUFDbkIsa0JBQWtCLGVBQ2xCO0FBQ0EsMEJBQWtCLEtBQUs7QUFBQSxXQUNuQixnQkFBZ0IsbUJBQW1CLE1BQU87QUFBQSxRQUM5QztBQUFBLE1BQ0Y7QUFFQSxVQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWlCO0FBRXhDLFlBQU0sV0FBVyxLQUFLLFFBQVE7QUFDOUIsWUFBTSxXQUNKLEtBQUssVUFDTCwrQ0FBK0MsRUFBRTtBQUVuRCxZQUFNO0FBQUEsUUFDSixJQUFJLE9BQU8sRUFBRTtBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0EsbUJBQW1CO0FBQUEsUUFDbkIsVUFBVTtBQUFBLFFBQ1Ysb0JBQW9CO0FBQUEsUUFDcEIsc0JBQXNCO0FBQUEsUUFDdEI7QUFBQSxRQUNBLGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFFQSxhQUFTO0FBQ1QsVUFBTSxhQUFhLE1BQU0sUUFBUSxTQUFTO0FBQzFDLFFBQUksU0FBUyxXQUFZO0FBQUEsRUFDM0I7QUFDRjtBQUVBLGdCQUFnQixrQkFBMkM7QUFFekQsTUFBSSxRQUFRO0FBQ1osTUFBSTtBQUNGLHFCQUFpQixRQUFRLHNCQUFzQixHQUFHO0FBQ2hEO0FBQ0EsWUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGLFFBQVE7QUFBQSxFQUE0QjtBQUVwQyxNQUFJLFVBQVUsR0FBRztBQUVmLFdBQU8sMEJBQTBCO0FBQUEsRUFDbkM7QUFDRjtBQUVPLElBQU0sbUJBQTZCO0FBQUEsRUFDeEMsVUFBVTtBQUFBLEVBQ1YsT0FBTyxXQUFXLFFBQWlEO0FBQ2pFLFVBQU0sV0FBV0YsY0FBYSxPQUFPLE1BQU07QUFDM0MsUUFBSSxDQUFDLFVBQVU7QUFDYixZQUFNLElBQUk7QUFBQSxRQUNSO0FBQUEsUUFDQSxPQUFPO0FBQUEsUUFDUCwyQkFBd0IsT0FBTyxNQUFNO0FBQUEsTUFDdkM7QUFBQSxJQUNGO0FBRUEsUUFBSSxPQUFPLFdBQVcsTUFBTTtBQUMxQixhQUFPLGdCQUFnQjtBQUFBLElBQ3pCLFdBQVcsT0FBTyxXQUFXLE1BQU07QUFDakMsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFDRjs7O0FDeGhCQSxJQUFNLFlBQXdDO0FBQUEsRUFDNUMsS0FBSztBQUFBLEVBQ0wsTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLEVBQ1AsVUFBVTtBQUNaO0FBRU8sU0FBUyxZQUFZLFVBQThCO0FBQ3hELFNBQU8sVUFBVSxRQUFRO0FBQzNCOzs7QUNOQSxlQUFlLGVBQWUsUUFBd0M7QUFDcEUsUUFBTSxNQUFNLDZCQUE2QixNQUFNO0FBQy9DLE1BQUk7QUFDRixVQUFNLElBQUksTUFBTSxNQUFNLEtBQUs7QUFBQSxNQUN6QixTQUFTLEVBQUUsUUFBUSxvQkFBb0IsY0FBYyxhQUFhO0FBQUEsSUFDcEUsQ0FBQztBQUNELFFBQUksQ0FBQyxFQUFFLEdBQUksUUFBTztBQUNsQixVQUFNLE9BQVEsTUFBTSxFQUFFLEtBQUs7QUFDM0IsVUFBTSxRQUFRLE1BQU0sUUFBUSxDQUFDLEdBQUc7QUFDaEMsV0FBTyxPQUFPLFVBQVUsWUFBWSxPQUFPLFNBQVMsS0FBSyxJQUFJLFFBQVE7QUFBQSxFQUN2RSxRQUFRO0FBQ04sV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQVVBLGVBQXNCLHFCQUE2QztBQUNqRSxRQUFNLE9BQU0sb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFDbkMsUUFBTSxTQUFtQixDQUFDO0FBRzFCLFFBQU0sTUFBTSxNQUFNLGVBQWUsT0FBTztBQUN4QyxNQUFJLE9BQU8sS0FBTSxRQUFPLEtBQUssb0NBQW9DO0FBT2pFLFNBQU87QUFBQSxJQUNMLFVBQVU7QUFBQSxJQUNWLFVBQVU7QUFBQSxJQUNWLFVBQVU7QUFBQSxJQUNWLFdBQVc7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUNGOzs7QUMvQ0EsSUFBSSxRQUErQjtBQUNuQyxJQUFJLG9CQUFtQztBQUVoQyxTQUFTLHVCQUFzQztBQUNwRCxTQUFPO0FBQ1Q7QUFFTyxTQUFTLGVBQWUsV0FBNEI7QUFDekQsYUFBVyxTQUFTO0FBQ3RCO0FBRU8sU0FBUyxXQUFXLFdBQTRCO0FBQ3JELE1BQUksT0FBTztBQUNULGtCQUFjLEtBQUs7QUFDbkIsWUFBUTtBQUFBLEVBQ1Y7QUFFQSxRQUFNLGdCQUFnQixNQUFNLHVCQUF1QjtBQUNuRCxNQUFJLENBQUMsaUJBQWlCLGlCQUFpQixFQUFHO0FBRTFDLFFBQU0sS0FBSyxnQkFBZ0IsS0FBSyxLQUFLO0FBQ3JDLFVBQVEsWUFBWSxZQUFZO0FBQzlCLFFBQUk7QUFDRixZQUFNLFVBQVU7QUFDaEIsMkJBQW9CLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsSUFDN0MsUUFBUTtBQUFBLElBRVI7QUFBQSxFQUNGLEdBQUcsRUFBRTtBQUNQOzs7QUNnQkEsSUFBTSxZQUF1QjtBQUFBLEVBQzNCLEVBQUUsTUFBTSxhQUFhLFVBQVUsTUFBTyxPQUFPLGtDQUFnQyxhQUFhLENBQUMsb0NBQW9DLDJCQUEyQiw2QkFBNkIsNEJBQTRCLEVBQUU7QUFBQSxFQUNyTixFQUFFLE1BQU0sYUFBYSxVQUFVLE1BQU8sT0FBTyxvQ0FBZ0MsYUFBYSxDQUFDLHNDQUFzQyw2QkFBNkIsNkJBQTZCLCtCQUErQixFQUFFO0FBQUEsRUFDNU4sRUFBRSxNQUFNLGFBQWEsVUFBVSxPQUFPLE9BQU8scUNBQWdDLGFBQWEsQ0FBQyx1Q0FBdUMsOEJBQThCLDhCQUEyQiwyQkFBMkIsMEJBQTBCLEVBQUU7QUFBQSxFQUNsUCxFQUFFLE1BQU0sU0FBYSxVQUFVLE1BQU8sT0FBTyw4QkFBZ0MsYUFBYSxDQUFDLGdDQUFnQyx1QkFBdUIsdUJBQXVCLEVBQUU7QUFBQSxFQUMzSyxFQUFFLE1BQU0sU0FBYSxVQUFVLE1BQU8sT0FBTyxnQ0FBZ0MsYUFBYSxDQUFDLGtDQUFrQyx5QkFBeUIsdUJBQXVCLEVBQUU7QUFBQSxFQUMvSyxFQUFFLE1BQU0sU0FBYSxVQUFVLE9BQU8sT0FBTyxpQ0FBZ0MsYUFBYSxDQUFDLG1DQUFtQywwQkFBMEIsMEJBQXVCLHFCQUFxQixFQUFFO0FBQUEsRUFDdE0sRUFBRSxNQUFNLFdBQWEsVUFBVSxNQUFPLE9BQU8sZ0NBQWdDLGFBQWEsQ0FBQyxrQ0FBa0MseUJBQXlCLHlCQUF5QixFQUFFO0FBQUEsRUFDakwsRUFBRSxNQUFNLFdBQWEsVUFBVSxNQUFPLE9BQU8sa0NBQWdDLGFBQWEsQ0FBQyxvQ0FBb0MsMkJBQTJCLHlCQUF5QixFQUFFO0FBQUEsRUFDckwsRUFBRSxNQUFNLFdBQWEsVUFBVSxPQUFPLE9BQU8sbUNBQWdDLGFBQWEsQ0FBQyxxQ0FBcUMsNEJBQTRCLDRCQUF5Qix1QkFBdUIsRUFBRTtBQUNoTjtBQUdBLElBQU0sa0JBQXNGO0FBQUEsRUFDMUYsSUFBSTtBQUFBLElBQ0YsV0FBVyxFQUFFLE1BQU0sTUFBTyxNQUFNLE9BQVEsT0FBTyxNQUFNO0FBQUEsSUFDckQsT0FBVyxFQUFFLE1BQU0sT0FBTyxNQUFNLE9BQVEsT0FBTyxPQUFPO0FBQUEsSUFDdEQsU0FBVyxFQUFFLE1BQU0sT0FBTyxNQUFNLE9BQVEsT0FBTyxPQUFPO0FBQUEsRUFDeEQ7QUFBQSxFQUNBLElBQUk7QUFBQSxJQUNGLFdBQVcsRUFBRSxNQUFNLE1BQVEsTUFBTSxNQUFTLE9BQU8sTUFBTztBQUFBLElBQ3hELE9BQVcsRUFBRSxNQUFNLE1BQVEsTUFBTSxPQUFTLE9BQU8sTUFBTztBQUFBLElBQ3hELFNBQVcsRUFBRSxNQUFNLE1BQVEsTUFBTSxPQUFTLE9BQU8sTUFBTztBQUFBLEVBQzFEO0FBQUEsRUFDQSxJQUFJO0FBQUEsSUFDRixXQUFXLEVBQUUsTUFBTSxLQUFNLE1BQU0sS0FBTyxPQUFPLElBQUk7QUFBQSxJQUNqRCxPQUFXLEVBQUUsTUFBTSxLQUFNLE1BQU0sS0FBTyxPQUFPLEtBQUs7QUFBQSxJQUNsRCxTQUFXLEVBQUUsTUFBTSxLQUFNLE1BQU0sS0FBTyxPQUFPLEtBQUs7QUFBQSxFQUNwRDtBQUNGO0FBRUEsSUFBTUksTUFDSjtBQUdGLElBQU0sZ0JBQTRDO0FBQUEsRUFDaEQsSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUFBLEVBQ0osSUFBSTtBQUNOO0FBRUEsSUFBTSxrQkFBOEM7QUFBQSxFQUNsRCxJQUFJO0FBQUEsRUFDSixJQUFJO0FBQUEsRUFDSixJQUFJO0FBQ047QUFVQSxJQUFNLGFBQXlCLENBQUMsYUFBYSxTQUFTLFNBQVM7QUFDL0QsSUFBTSxpQkFBaUMsQ0FBQyxNQUFNLE1BQU0sS0FBSztBQUl6RCxlQUFlLGdCQUFnQixRQUFxQztBQUNsRSxRQUFNLFNBQVMsY0FBYyxNQUFNO0FBQ25DLFFBQU0sTUFBTSwrQkFBK0IsTUFBTTtBQUNqRCxNQUFJLFVBQW1CO0FBQ3ZCLFdBQVMsVUFBVSxHQUFHLFVBQVUsR0FBRyxXQUFXO0FBQzVDLFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLEtBQUs7QUFBQSxRQUN6QixTQUFTO0FBQUEsVUFDUCxjQUFjQztBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsbUJBQW1CLFdBQVcsT0FBTyxtQkFBbUI7QUFBQSxRQUMxRDtBQUFBLE1BQ0YsQ0FBQztBQUNELFVBQUksRUFBRSxXQUFXLElBQUssT0FBTSxJQUFJLE1BQU0sa0JBQWtCLEdBQUcsR0FBRztBQUM5RCxVQUFJLENBQUMsRUFBRSxHQUFJLE9BQU0sSUFBSSxNQUFNLFFBQVEsRUFBRSxNQUFNLEtBQUssR0FBRyxHQUFHO0FBQ3RELGFBQU8sTUFBTSxFQUFFLEtBQUs7QUFBQSxJQUN0QixTQUFTLEdBQUc7QUFDVixnQkFBVTtBQUNWLFlBQU0sSUFBSSxRQUFRLENBQUMsUUFBUSxXQUFXLEtBQUssTUFBTSxLQUFLLE9BQU8sQ0FBQztBQUFBLElBQ2hFO0FBQUEsRUFDRjtBQUNBLFFBQU0sSUFBSSxNQUFNLG9DQUFvQyxNQUFNLEtBQU0sU0FBbUIsV0FBVyxPQUFPLEVBQUU7QUFDekc7QUFFQSxTQUFTQyxpQkFBZ0IsTUFBMEI7QUFDakQsUUFBTSxJQUFJLGlFQUFpRSxLQUFLLElBQUk7QUFDcEYsTUFBSSxDQUFDLEVBQUcsUUFBTztBQUNmLE1BQUk7QUFDRixXQUFPLEtBQUssTUFBTSxFQUFFLENBQUMsQ0FBQztBQUFBLEVBQ3hCLFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsU0FBUyxXQUFXLEtBQTRCO0FBQzlDLE1BQUksQ0FBQyxJQUFLLFFBQU87QUFDakIsUUFBTSxVQUFVLElBQUksUUFBUSxZQUFZLEVBQUU7QUFDMUMsTUFBSSxDQUFDLFFBQVMsUUFBTztBQUNyQixRQUFNLFFBQVEsUUFBUSxNQUFNLE1BQU07QUFDbEMsTUFBSSxNQUFNLFVBQVUsR0FBRztBQUNyQixXQUFPLE9BQU8sT0FBTyxLQUFLO0FBQUEsRUFDNUI7QUFDQSxRQUFNLFdBQVcsTUFBTSxNQUFNLFNBQVMsQ0FBQztBQUN2QyxNQUFJLFNBQVMsVUFBVSxHQUFHO0FBQ3hCLFVBQU0sVUFBVSxNQUFNLE1BQU0sR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFO0FBQzFDLFdBQU8sT0FBTyxHQUFHLE9BQU8sSUFBSSxRQUFRLEVBQUUsS0FBSztBQUFBLEVBQzdDO0FBQ0EsU0FBTyxPQUFPLE1BQU0sS0FBSyxFQUFFLENBQUMsS0FBSztBQUNuQztBQUVBLElBQU0sZ0JBQTBDO0FBQUEsRUFDOUMsV0FBVztBQUFBLEVBQ1gsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUNYO0FBRUEsSUFBTSxvQkFBa0Q7QUFBQSxFQUN0RCxNQUFNO0FBQUEsRUFDTixNQUFNO0FBQUEsRUFDTixPQUFPO0FBQ1Q7QUFFQSxTQUFTLGFBQWEsTUFBK0I7QUFDbkQsYUFBVyxLQUFLLFlBQVk7QUFDMUIsUUFBSSxjQUFjLENBQUMsRUFBRSxLQUFLLElBQUksRUFBRyxRQUFPO0FBQUEsRUFDMUM7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGlCQUFpQixNQUFtQztBQUMzRCxhQUFXLEtBQUssZ0JBQWdCO0FBQzlCLFFBQUksa0JBQWtCLENBQUMsRUFBRSxLQUFLLElBQUksRUFBRyxRQUFPO0FBQUEsRUFDOUM7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGNBQ1AsTUFDQSxTQUNBLFFBQVEsR0FDRjtBQUNOLE1BQUksUUFBUSxNQUFNLENBQUMsS0FBTTtBQUN6QixNQUFJLE1BQU0sUUFBUSxJQUFJLEdBQUc7QUFDdkIsZUFBVyxRQUFRLEtBQU0sZUFBYyxNQUFNLFNBQVMsUUFBUSxDQUFDO0FBQy9EO0FBQUEsRUFDRjtBQUNBLE1BQUksT0FBTyxTQUFTLFNBQVU7QUFDOUIsUUFBTSxNQUFNO0FBRVosUUFBTSxPQUFPLE9BQU8sSUFBSSxRQUFRLElBQUksU0FBUyxJQUFJLFNBQVMsSUFBSSxZQUFZLEVBQUU7QUFDNUUsUUFBTSxXQUFXO0FBQUEsSUFDZixJQUFJLFNBQVMsSUFBSSxrQkFBa0IsSUFBSSxnQkFDdkMsSUFBSSxhQUFhLElBQUksa0JBQWtCO0FBQUEsRUFDekM7QUFFQSxNQUFJLFFBQVEsVUFBVTtBQUNwQixVQUFNLE9BQU8sYUFBYSxJQUFJO0FBQzlCLFVBQU0sTUFBTSxpQkFBaUIsSUFBSTtBQUNqQyxRQUFJLFFBQVEsS0FBSztBQUNmLFlBQU0sUUFBUSxXQUFXLFFBQVE7QUFDakMsVUFBSSxTQUFTLFFBQVEsR0FBRztBQUN0QixjQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksR0FBRztBQUMxQixZQUFJLENBQUMsUUFBUSxJQUFJLEdBQUcsRUFBRyxTQUFRLElBQUksS0FBSyxLQUFLO0FBQUEsTUFDL0M7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLGFBQVcsS0FBSyxPQUFPLE9BQU8sR0FBRyxHQUFHO0FBQ2xDLGtCQUFjLEdBQUcsU0FBUyxRQUFRLENBQUM7QUFBQSxFQUNyQztBQUNGO0FBRUEsU0FBUyx3QkFDUCxNQUNBLFFBQ3FCO0FBQ3JCLFFBQU0sVUFBVSxvQkFBSSxJQUFvQjtBQUV4QyxRQUFNLFVBQVUsV0FBVyxPQUN2QixxQkFDQSxXQUFXLE9BQ1gsOEJBQ0E7QUFFSixRQUFNLFdBQVcsS0FBSyxNQUFNLCtCQUErQjtBQUMzRCxhQUFXLFdBQVcsVUFBVTtBQUM5QixVQUFNLE9BQU8sYUFBYSxRQUFRLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFDL0MsUUFBSSxDQUFDLEtBQU07QUFFWCxVQUFNLFlBQVksUUFBUSxNQUFNLDJEQUEyRDtBQUMzRixlQUFXLFNBQVMsV0FBVztBQUM3QixZQUFNLE1BQU0saUJBQWlCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUNoRCxVQUFJLENBQUMsSUFBSztBQUVWLFlBQU0sUUFBUSxRQUFRLEtBQUssS0FBSztBQUNoQyxVQUFJLE9BQU87QUFDVCxjQUFNLFFBQVEsV0FBVyxNQUFNLENBQUMsQ0FBQztBQUNqQyxZQUFJLFNBQVMsUUFBUSxHQUFHO0FBQ3RCLGdCQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksR0FBRztBQUMxQixjQUFJLENBQUMsUUFBUSxJQUFJLEdBQUcsRUFBRyxTQUFRLElBQUksS0FBSyxLQUFLO0FBQUEsUUFDL0M7QUFBQSxNQUNGO0FBQ0EsY0FBUSxZQUFZO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBUyxnQkFDUCxNQUNBLFFBQ3VEO0FBQ3ZELFFBQU0sU0FBaUQsQ0FBQztBQUV4RCxRQUFNLFdBQVdBLGlCQUFnQixJQUFJO0FBQ3JDLE1BQUksUUFBUSxvQkFBSSxJQUFvQjtBQUVwQyxNQUFJLFVBQVU7QUFDWixrQkFBYyxVQUFVLEtBQUs7QUFBQSxFQUMvQjtBQUVBLE1BQUksTUFBTSxPQUFPLEdBQUc7QUFDbEIsVUFBTSxlQUFlLHdCQUF3QixNQUFNLE1BQU07QUFDekQsZUFBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLGNBQWM7QUFDakMsVUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUcsT0FBTSxJQUFJLEdBQUcsQ0FBQztBQUFBLElBQ25DO0FBQUEsRUFDRjtBQUVBLE1BQUksTUFBTSxTQUFTLEVBQUcsUUFBTztBQUU3QixhQUFXLENBQUMsS0FBSyxLQUFLLEtBQUssT0FBTztBQUNoQyxVQUFNLENBQUMsTUFBTSxHQUFHLElBQUksSUFBSSxNQUFNLEdBQUc7QUFDakMsUUFBSSxDQUFDLE9BQU8sSUFBSSxFQUFHLFFBQU8sSUFBSSxJQUFJLENBQUM7QUFDbkMsV0FBTyxJQUFJLEVBQUUsR0FBRyxJQUFJO0FBQUEsRUFDdEI7QUFFQSxTQUFPO0FBQ1Q7QUFFQSxlQUFzQixxQkFBaUQ7QUFDckUsUUFBTSxVQUF3QixDQUFDLE1BQU0sTUFBTSxJQUFJO0FBQy9DLFFBQU0sU0FBUyxnQkFBZ0IsZUFBZTtBQUM5QyxRQUFNLFNBQW1CLENBQUM7QUFFMUIsYUFBVyxVQUFVLFNBQVM7QUFDNUIsUUFBSTtBQUNGLFlBQU0sT0FBTyxNQUFNLGdCQUFnQixNQUFNO0FBQ3pDLFlBQU0sU0FBUyxnQkFBZ0IsTUFBTSxNQUFNO0FBQzNDLFVBQUksUUFBUTtBQUNWLFlBQUksUUFBUTtBQUNaLG1CQUFXLFFBQVEsWUFBWTtBQUM3QixxQkFBVyxPQUFPLGdCQUFnQjtBQUNoQyxnQkFBSSxPQUFPLElBQUksSUFBSSxHQUFHLEdBQUc7QUFDdkIscUJBQU8sTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksT0FBTyxJQUFJLEVBQUUsR0FBRztBQUM1QztBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUNBLFlBQUksVUFBVSxHQUFHO0FBQ2YsaUJBQU8sS0FBSyxHQUFHLE9BQU8sWUFBWSxDQUFDLGdGQUE2RTtBQUFBLFFBQ2xILFdBQVcsUUFBUSxHQUFHO0FBQ3BCLGlCQUFPLEtBQUssR0FBRyxPQUFPLFlBQVksQ0FBQyxVQUFVLEtBQUssZ0RBQTZDO0FBQUEsUUFDakc7QUFBQSxNQUNGLE9BQU87QUFDTCxlQUFPLEtBQUssR0FBRyxPQUFPLFlBQVksQ0FBQywrREFBNEQ7QUFBQSxNQUNqRztBQUFBLElBQ0YsU0FBUyxHQUFHO0FBQ1YsYUFBTyxLQUFLLEdBQUcsT0FBTyxZQUFZLENBQUMsS0FBTSxFQUFZLE9BQU8sRUFBRTtBQUFBLElBQ2hFO0FBQUEsRUFDRjtBQUVBLFNBQU8sRUFBRSxRQUFRLFlBQVcsb0JBQUksS0FBSyxHQUFFLFlBQVksR0FBRyxPQUFPO0FBQy9EO0FBSUEsSUFBTSx1QkFBdUI7QUFFN0IsU0FBUyxlQUFlLGFBQXVCLGNBQThCO0FBQzNFLFFBQU0sZ0JBQWdCLFNBQVMsWUFBWTtBQUMzQyxNQUFJLENBQUMsY0FBYyxPQUFRLFFBQU87QUFDbEMsTUFBSSxPQUFPO0FBQ1gsYUFBVyxRQUFRLGFBQWE7QUFDOUIsVUFBTSxhQUFhLFNBQVMsSUFBSTtBQUNoQyxRQUFJLENBQUMsV0FBVyxPQUFRO0FBQ3hCLFVBQU0sUUFBUSxXQUFXLFlBQVksYUFBYTtBQUNsRCxRQUFJLFFBQVEsS0FBTSxRQUFPO0FBQUEsRUFDM0I7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLE1BQU0sT0FBZSxVQUFrQixLQUE4QjtBQUM1RSxNQUFJO0FBQ0osTUFBSTtBQUNKLFVBQVEsVUFBVTtBQUFBLElBQ2hCLEtBQUs7QUFBTyxhQUFPLElBQUk7QUFBVSxpQkFBVyxJQUFJLHNCQUFzQjtBQUFLO0FBQUEsSUFDM0UsS0FBSztBQUFPLGFBQU8sSUFBSTtBQUFVLGlCQUFXLElBQUksc0JBQXNCO0FBQUs7QUFBQSxJQUMzRTtBQUFZLGFBQU8sSUFBSTtBQUFVLGlCQUFXLElBQUksc0JBQXNCO0FBQUs7QUFBQSxFQUM3RTtBQUNBLFNBQU8sS0FBSyxNQUFNLFFBQVEsV0FBVyxJQUFJO0FBQzNDO0FBRU8sU0FBUywwQkFDZCxVQUNBLEtBQ0EsU0FDdUI7QUFDdkIsUUFBTSxZQUFZLFNBQVMsVUFBVTtBQUVyQyxTQUFPLFVBQVUsSUFBSSxDQUFDLFFBQVE7QUFDNUIsVUFBTSxVQUF3QixDQUFDLE1BQU0sTUFBTSxJQUFJO0FBQy9DLFVBQU0sZUFBa0MsUUFBUSxJQUFJLENBQUMsTUFBTTtBQUN6RCxZQUFNLFdBQVcsZ0JBQWdCLENBQUM7QUFDbEMsWUFBTSxRQUFRLFVBQVUsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksUUFBUSxLQUFLLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxJQUFJLEVBQUUsSUFBSSxRQUFRO0FBQ25HLGFBQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFFBQ0EsVUFBVSxNQUFNLE9BQU8sVUFBVSxHQUFHO0FBQUEsTUFDdEM7QUFBQSxJQUNGLENBQUM7QUFFRCxRQUFJLGlCQUFvQztBQUN4QyxRQUFJLGNBQTZCO0FBQ2pDLGVBQVcsTUFBTSxjQUFjO0FBQzdCLFVBQUksR0FBRyxZQUFZLFNBQVMsZUFBZSxRQUFRLEdBQUcsV0FBVyxjQUFjO0FBQzdFLHNCQUFjLEdBQUc7QUFDakIseUJBQWlCLEdBQUc7QUFBQSxNQUN0QjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQTZCLENBQUM7QUFDcEMsZUFBVyxLQUFLLFVBQVU7QUFDeEIsWUFBTSxRQUFRLGVBQWUsSUFBSSxhQUFhLEVBQUUsS0FBSztBQUNyRCxVQUFJLFNBQVMsc0JBQXNCO0FBQ2pDLGdCQUFRLEtBQUs7QUFBQSxVQUNYLFVBQVUsRUFBRTtBQUFBLFVBQ1osT0FBTyxFQUFFO0FBQUEsVUFDVCxLQUFLLEVBQUU7QUFBQSxVQUNQLFVBQVUsRUFBRTtBQUFBLFVBQ1osV0FBVyxFQUFFO0FBQUEsVUFDYjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQ0EsWUFBUSxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsV0FBVyxFQUFFLFFBQVE7QUFDOUMsVUFBTSxNQUFNLFFBQVEsTUFBTSxHQUFHLENBQUM7QUFFOUIsV0FBTztBQUFBLE1BQ0wsTUFBTSxJQUFJO0FBQUEsTUFDVixVQUFVLElBQUk7QUFBQSxNQUNkLE9BQU8sSUFBSTtBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsYUFBYSxJQUFJO0FBQUEsTUFDakIsbUJBQW1CO0FBQUEsTUFDbkIsV0FBVyxJQUFJLFNBQVMsSUFBSSxDQUFDLEVBQUUsV0FBVztBQUFBLE1BQzFDLFdBQVcsSUFBSSxTQUFTLElBQUksQ0FBQyxFQUFFLFdBQVc7QUFBQSxJQUM1QztBQUFBLEVBQ0YsQ0FBQztBQUNIOzs7QUNqWEEsU0FBUyxhQUFhLE9BQThCO0FBQ2xELFFBQU0sSUFBSSxPQUFPLFNBQVMsRUFBRSxFQUFFLEtBQUs7QUFDbkMsTUFBSSxDQUFDLEVBQUcsUUFBTztBQUVmLE1BQUksdURBQXVELEtBQUssQ0FBQyxFQUFHLFFBQU87QUFDM0UsUUFBTSxJQUFJLG1FQUFtRTtBQUFBLElBQzNFO0FBQUEsRUFDRjtBQUNBLFNBQU8sSUFBSSxFQUFFLENBQUMsRUFBRSxZQUFZLElBQUk7QUFDbEM7QUFhQSxTQUFTLGNBQWMsTUFBbUIsUUFBa0M7QUFDMUUsUUFBTSxTQUEyQixDQUFDO0FBQ2xDLGFBQVcsS0FBSyxNQUFNLGNBQWMsR0FBRztBQUNyQyxVQUFNLE9BQU8sTUFBTSxRQUFRLEVBQUUsRUFBRTtBQUMvQixVQUFNLFlBQ0osQ0FBQyxDQUFDLFFBQVEsS0FBSyxVQUFVLEtBQUssa0JBQWtCLEtBQUssS0FBSyxJQUFJLEVBQUUsRUFBRTtBQUNwRSxVQUFNLGVBQWUsYUFBYSxFQUFFLGVBQWU7QUFFbkQsUUFBSSxnQkFBZ0IsTUFBTTtBQUN4QixhQUFPLEtBQUs7QUFBQSxRQUNWLElBQUksRUFBRTtBQUFBLFFBQ04sTUFBTSxLQUFLO0FBQUEsUUFDWCxpQkFBaUIsS0FBSztBQUFBLFFBQ3RCLG9CQUNFLEtBQUssd0JBQXdCLE9BQ3pCLEtBQUssdUJBQXVCLE1BQzVCO0FBQUEsUUFDTixVQUFVLEtBQUs7QUFBQSxNQUNqQixDQUFDO0FBQUEsSUFDSDtBQUVBLFVBQU0sYUFBYSxFQUFFLElBQUk7QUFBQSxNQUN2QixNQUFNLE1BQU0sUUFBUSxFQUFFO0FBQUEsTUFDdEIsWUFBWSxZQUFZLFlBQVksRUFBRSxlQUFlLFdBQVcsV0FBVztBQUFBLE1BQzNFLGtCQUFrQixZQUFZLFNBQVMsRUFBRTtBQUFBLE1BQ3pDLGdCQUFnQixNQUFNLHdCQUF3QixFQUFFO0FBQUEsTUFDaEQscUJBQXFCLE1BQU0sbUJBQW1CLEVBQUU7QUFBQSxJQUNsRCxDQUFDO0FBQUEsRUFDSDtBQUNBLFNBQU87QUFDVDtBQVdBLElBQU0sU0FBa0IsQ0FBQztBQUV6QixTQUFTLE1BQU0sUUFBZ0JDLE9BQWMsU0FBa0I7QUFDN0QsUUFBTSxPQUFpQixDQUFDO0FBQ3hCLFFBQU0sVUFBVSxJQUFJO0FBQUEsSUFDbEIsTUFDRUEsTUFBSyxRQUFRLGtCQUFrQixDQUFDLEdBQUcsTUFBTTtBQUN2QyxXQUFLLEtBQUssQ0FBQztBQUNYLGFBQU87QUFBQSxJQUNULENBQUMsSUFDRDtBQUFBLEVBQ0o7QUFDQSxTQUFPLEtBQUssRUFBRSxRQUFRLFNBQVMsTUFBTSxRQUFRLENBQUM7QUFDaEQ7QUFFQSxTQUFTLFNBQVMsS0FBcUIsUUFBZ0IsTUFBZTtBQUNwRSxNQUFJLGFBQWE7QUFDakIsTUFBSSxVQUFVLGdCQUFnQixpQ0FBaUM7QUFDL0QsTUFBSSxJQUFJLEtBQUssVUFBVSxJQUFJLENBQUM7QUFDOUI7QUFFQSxlQUFlLFNBQVMsS0FBb0M7QUFDMUQsUUFBTSxTQUFtQixDQUFDO0FBQzFCLG1CQUFpQixTQUFTLElBQUssUUFBTyxLQUFLLEtBQWU7QUFDMUQsUUFBTSxNQUFNLE9BQU8sT0FBTyxNQUFNLEVBQUUsU0FBUyxPQUFPO0FBQ2xELE1BQUksQ0FBQyxJQUFLLFFBQU8sQ0FBQztBQUNsQixNQUFJO0FBQ0YsV0FBTyxLQUFLLE1BQU0sR0FBRztBQUFBLEVBQ3ZCLFFBQVE7QUFDTixXQUFPLENBQUM7QUFBQSxFQUNWO0FBQ0Y7QUFFQSxTQUFTLFVBQVUsR0FBaUI7QUFDbEMsU0FBTyxHQUFHLEVBQUUsUUFBUSxJQUFJLEVBQUUsTUFBTSxJQUFJLEVBQUUsRUFBRTtBQUMxQztBQUlBLFNBQVMseUJBQXlCLE1BQVksUUFBcUQ7QUFDakcsUUFBTSxpQkFBaUIsS0FBSyxJQUFJLE1BQU07QUFDeEM7QUFFQSxJQUFNLGlCQUFpQjtBQUN2QixJQUFNLGtCQUFrQjtBQUV4QixTQUFTLGdCQUFnQixHQUFpQjtBQUV4QyxNQUFJLEVBQUUsbUJBQW1CLEVBQUcsUUFBTztBQUVuQyxNQUFJLFFBQVE7QUFDWixRQUFNLFlBQVksRUFBRSxzQkFBc0IsS0FBSztBQUcvQyxNQUFJLFlBQVksR0FBSSxVQUFTO0FBQUEsV0FDcEIsWUFBWSxHQUFJLFVBQVM7QUFBQSxXQUN6QixZQUFZLEdBQUksVUFBUztBQUdsQyxNQUFJLEVBQUUsbUJBQW1CLEdBQUksVUFBUztBQUFBLFdBQzdCLEVBQUUsbUJBQW1CLEdBQUksVUFBUztBQUFBLFdBQ2xDLEVBQUUsa0JBQWtCLEVBQUcsVUFBUztBQUd6QyxRQUFNLFNBQVMsTUFBTSxpQkFBaUIsRUFBRSxFQUFFO0FBQzFDLE1BQUksUUFBUSxXQUFXO0FBQ3JCLFVBQU0sVUFBVSxNQUFNLGlCQUFpQjtBQUN2QyxVQUFNLE1BQU0sT0FBTyxVQUFVLFlBQVk7QUFDekMsUUFBSSxRQUFRLEtBQUssQ0FBQyxNQUFNLElBQUksU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUcsVUFBUztBQUFBLEVBQ25FO0FBR0EsTUFBSSxFQUFFLFdBQVcsU0FBUyxLQUFLLEVBQUcsVUFBUztBQUczQyxNQUFJLGVBQWUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLGdCQUFnQixLQUFLLEVBQUUsSUFBSSxFQUFHLFVBQVM7QUFFM0UsU0FBTyxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLENBQUM7QUFDekM7QUFFQSxTQUFTLFlBQVksTUFBc0I7QUFDekMsUUFBTSxPQUFPLEtBQ1YsVUFBVSxLQUFLLEVBQUUsUUFBUSxVQUFVLEVBQUUsRUFDckMsWUFBWSxFQUNaLFFBQVEsZ0JBQWdCLEVBQUUsRUFDMUIsS0FBSyxFQUNMLE1BQU0sS0FBSyxFQUNYLE1BQU0sR0FBRyxDQUFDLEVBQ1YsS0FBSyxHQUFHO0FBQ1gsU0FBTyxNQUFNLElBQUk7QUFDbkI7QUFFQSxTQUFTLFVBQVUsR0FBUyxhQUFhLE1BQU0sWUFBWSxHQUFHO0FBQzVELFFBQU0sT0FBTyxrQkFBa0IsRUFBRSxzQkFBc0IsWUFBWSxFQUFFLFlBQVksS0FBSztBQUN0RixRQUFNLFFBQVEsVUFBVSxDQUFDO0FBQ3pCLFFBQU0sVUFBVSxNQUFNLHFCQUFxQixLQUFLLEtBQUssTUFBTSxxQkFBcUIsRUFBRSxFQUFFO0FBQ3BGLFFBQU0sWUFBWSxRQUFRLFNBQ3RCLEtBQUssSUFBSSxHQUFHLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFDMUM7QUFDSixTQUFPO0FBQUEsSUFDTCxJQUFJLEVBQUU7QUFBQSxJQUNOO0FBQUEsSUFDQSxVQUFVLEVBQUUsWUFBWTtBQUFBLElBQ3hCLFFBQVEsRUFBRSxVQUFVO0FBQUEsSUFDcEIsVUFBVSxFQUFFLFlBQVk7QUFBQSxJQUN4QixNQUFNLEVBQUU7QUFBQSxJQUNSLFVBQVUsRUFBRTtBQUFBLElBQ1osVUFBVSxFQUFFO0FBQUEsSUFDWixXQUFXLEVBQUU7QUFBQSxJQUNiLGVBQ0UsRUFBRSxzQkFBc0IsT0FBTyxFQUFFLHFCQUFxQixNQUFNO0FBQUEsSUFDOUQsaUJBQ0UsRUFBRSx3QkFBd0IsT0FBTyxFQUFFLHVCQUF1QixNQUFNO0FBQUEsSUFDbEUsa0JBQ0UsRUFBRSxzQkFBc0IsT0FBTyxFQUFFLHFCQUFxQixNQUFNO0FBQUEsSUFDOUQsb0JBQ0UsRUFBRSx3QkFBd0IsT0FBTyxFQUFFLHVCQUF1QixNQUFNO0FBQUEsSUFDbEUsaUJBQWlCLEVBQUU7QUFBQSxJQUNuQixlQUFlLEVBQUU7QUFBQSxJQUNqQixVQUFVLEVBQUU7QUFBQSxJQUNaLFdBQVcsRUFBRTtBQUFBLElBQ2IsT0FBTyxFQUFFO0FBQUEsSUFDVCxZQUFZLEVBQUUsY0FBYztBQUFBLElBQzVCLFFBQVEsRUFBRTtBQUFBLElBQ1YsU0FBUyxNQUFNLFdBQVc7QUFBQSxJQUMxQixVQUFVLE1BQU0sWUFBWTtBQUFBLElBQzVCLFlBQVksTUFBTSxjQUFjO0FBQUEsSUFDaEMsY0FBYyxNQUFNLGdCQUFnQjtBQUFBLElBQ3BDLFdBQVcsTUFBTSxhQUFhO0FBQUEsSUFDOUI7QUFBQSxJQUNBLGFBQWEsUUFBUTtBQUFBLElBQ3JCLGVBQWU7QUFBQSxJQUNmLFVBQVUsZ0JBQWdCLENBQUM7QUFBQSxFQUM3QjtBQUNGO0FBR0EsTUFBTSxPQUFPLFVBQVUsT0FBTyxLQUFLLFFBQVE7QUFDekMsUUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLE9BQU8sS0FBSyxVQUFVO0FBQzlDLFFBQU0sVUFBVSxJQUFJLGFBQWEsSUFBSSxRQUFRLEtBQUssSUFBSSxZQUFZO0FBQ2xFLFFBQU0sY0FBYyxTQUFTLElBQUksYUFBYSxJQUFJLGNBQWMsS0FBSyxLQUFLLEVBQUUsS0FBSztBQUNqRixRQUFNLGVBQWUsSUFBSSxhQUFhLElBQUksZUFBZSxNQUFNO0FBQy9ELFFBQU0sZ0JBQWdCLElBQUksYUFBYSxJQUFJLGdCQUFnQixNQUFNO0FBQ2pFLFFBQU0saUJBQWlCLElBQUksYUFBYSxJQUFJLGtCQUFrQixNQUFNO0FBQ3BFLFFBQU0sa0JBQWtCLElBQUksYUFBYSxJQUFJLGtCQUFrQixNQUFNO0FBQ3JFLFFBQU0saUJBQWlCLElBQUksYUFBYSxJQUFJLFVBQVUsS0FBSztBQUMzRCxRQUFNLFdBQVcsSUFBSSxhQUFhLElBQUksV0FBVyxNQUFNO0FBQ3ZELFFBQU0sT0FBTyxJQUFJLGFBQWEsSUFBSSxNQUFNLEtBQUs7QUFFN0MsTUFBSSxRQUFRLE1BQU0sVUFBVTtBQUM1QixNQUFJLENBQUMsZ0JBQWlCLFNBQVEsTUFBTSxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU07QUFDMUQsTUFBSSxlQUFnQixTQUFRLE1BQU0sT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLFdBQVcsY0FBYztBQUN4RixNQUFJLGNBQWMsRUFBRyxTQUFRLE1BQU0sT0FBTyxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsV0FBVztBQUNqRixNQUFJLGFBQWMsU0FBUSxNQUFNLE9BQU8sQ0FBQyxNQUFNLEVBQUUsUUFBUTtBQUN4RCxNQUFJLGNBQWUsU0FBUSxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTO0FBQzNELE1BQUksU0FBVSxTQUFRLE1BQU0sT0FBTyxDQUFDLE1BQU0sZ0JBQWdCLENBQUMsS0FBSyxFQUFFO0FBQ2xFLE1BQUksZ0JBQWdCO0FBQ2xCLFlBQVEsTUFBTSxPQUFPLENBQUMsTUFBTTtBQUMxQixZQUFNLE1BQU0sVUFBVSxDQUFDO0FBQ3ZCLGNBQVEsTUFBTSxxQkFBcUIsR0FBRyxLQUFLLE1BQU0scUJBQXFCLEVBQUUsRUFBRSxHQUFHLFNBQVM7QUFBQSxJQUN4RixDQUFDO0FBQUEsRUFDSDtBQUNBLE1BQUksT0FBUSxTQUFRLE1BQU0sT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLFlBQVksRUFBRSxTQUFTLE1BQU0sQ0FBQztBQUU3RSxNQUFJLFNBQVMsTUFBTyxPQUFNLEtBQUssQ0FBQyxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQUEsV0FDdkUsU0FBUyxRQUFTLE9BQU0sS0FBSyxDQUFDLEdBQUcsT0FBTyxFQUFFLHdCQUF3QixNQUFNLEVBQUUsd0JBQXdCLEVBQUU7QUFBQSxXQUNwRyxTQUFTLE9BQVEsT0FBTSxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSSxDQUFDO0FBQUEsV0FDbEUsU0FBUyxVQUFVO0FBQzFCLFVBQU0sS0FBSyxDQUFDLEdBQUcsTUFBTTtBQUNuQixZQUFNLEtBQUssTUFBTSxxQkFBcUIsRUFBRSxFQUFFO0FBQzFDLFlBQU0sS0FBSyxNQUFNLHFCQUFxQixFQUFFLEVBQUU7QUFDMUMsWUFBTSxLQUFLLEdBQUcsU0FBUyxLQUFLLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUk7QUFDaEUsWUFBTSxLQUFLLEdBQUcsU0FBUyxLQUFLLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUk7QUFDaEUsYUFBTyxLQUFLO0FBQUEsSUFDZCxDQUFDO0FBQUEsRUFDSCxNQUNLLE9BQU0sS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLGtCQUFrQixFQUFFLGVBQWU7QUFFL0QsUUFBTSxNQUFNLE1BQU0sWUFBWTtBQUM5QixXQUFTLEtBQUssS0FBSyxNQUFNLElBQUksQ0FBQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBR0QsTUFBTSxTQUFTLGNBQWMsT0FBTyxLQUFLLEtBQUssV0FBVztBQUN2RCxRQUFNLE9BQVEsTUFBTSxTQUFTLEdBQUc7QUFHaEMsUUFBTSxRQUF1QixDQUFDO0FBQzlCLE1BQUksT0FBTyxLQUFLLGFBQWEsVUFBVyxPQUFNLFdBQVcsS0FBSztBQUM5RCxNQUFJLE9BQU8sS0FBSyxjQUFjLFVBQVcsT0FBTSxZQUFZLEtBQUs7QUFDaEUsTUFBSSxPQUFPLEtBQUssVUFBVSxTQUFVLE9BQU0sUUFBUSxLQUFLO0FBQ3ZELE1BQUksT0FBTyxLQUFLLGVBQWUsU0FBVSxPQUFNLGFBQWEsS0FBSyxXQUFXLEtBQUs7QUFDakYsUUFBTSxLQUFLLG1CQUFtQixPQUFPLEVBQUU7QUFDdkMsTUFBSSxVQUFVLE1BQU0sVUFBVSxJQUFJLEtBQUs7QUFDdkMsTUFBSSxDQUFDLFNBQVM7QUFFWixjQUFVLE1BQU0sVUFBVSxVQUFVLEVBQUUsSUFBSSxLQUFLO0FBQUEsRUFDakQ7QUFDQSxNQUFJLENBQUMsUUFBUyxRQUFPLFNBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxZQUFZLENBQUM7QUFDOUQsV0FBUyxLQUFLLEtBQUssVUFBVSxPQUFPLENBQUM7QUFDdkMsQ0FBQztBQUtELE1BQU0sUUFBUSxZQUFZLE9BQU8sS0FBSyxRQUFRO0FBQzVDLE1BQUk7QUFDRixVQUFNLE9BQU8sTUFBTSxTQUFTLEdBQUc7QUFDL0IsVUFBTSxpQkFBaUIsS0FBSztBQUM1QixVQUFNLGVBQWUsS0FBSztBQUUxQixVQUFNLFVBQVUsTUFBTSxXQUFXLEVBQUUsT0FBTyxDQUFDLE1BQU07QUFDL0MsVUFBSSxDQUFDLEVBQUUsUUFBUyxRQUFPO0FBQ3ZCLFVBQUksa0JBQWtCLEVBQUUsYUFBYSxlQUFnQixRQUFPO0FBQzVELFVBQUksZ0JBQWdCLEVBQUUsV0FBVyxhQUFjLFFBQU87QUFDdEQsYUFBTztBQUFBLElBQ1QsQ0FBQztBQUVELFVBQU0sVUFBUyxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUN0QyxVQUFNLFVBUUQsQ0FBQztBQUNOLFFBQUkscUJBQXVDLENBQUM7QUFFNUMsZUFBVyxVQUFVLFNBQVM7QUFDNUIsVUFBSTtBQUNGLGNBQU0sV0FBVyxZQUFZLE9BQU8sUUFBUTtBQUM1QyxjQUFNLFdBQVcsb0JBQUksSUFBWTtBQUNqQyxZQUFJLFdBQVc7QUFDZixZQUFJLFVBQVU7QUFDZCxZQUFJQyxhQUFZO0FBR2hCLGNBQU0sWUFBWSxFQUFFLEdBQUcsT0FBTztBQUM5QixZQUFJLE9BQU8sYUFBYSxTQUFTLENBQUMsT0FBTyxZQUFZO0FBQ25ELG9CQUFVLGFBQWEsTUFBTSxPQUFPLEVBQUU7QUFBQSxRQUN4QztBQUVBLHlCQUFpQixRQUFRLFNBQVMsV0FBVyxTQUFTLEdBQUc7QUFDdkQsVUFBQUE7QUFDQSxnQkFBTSxRQUFRLEdBQUcsT0FBTyxRQUFRLElBQUksT0FBTyxNQUFNLElBQUksS0FBSyxFQUFFO0FBQzVELG1CQUFTLElBQUksS0FBSztBQUNsQixnQkFBTSxXQUFXLE1BQU0sbUJBQW1CLE9BQU8sVUFBVSxPQUFPLFFBQVEsS0FBSyxFQUFFO0FBQ2pGLGNBQUksQ0FBQyxVQUFVO0FBQ2Isa0JBQU0sV0FBVztBQUFBLGNBQ2YsSUFBSSxLQUFLO0FBQUEsY0FDVCxVQUFVLE9BQU87QUFBQSxjQUNqQixRQUFRLE9BQU87QUFBQSxjQUNmLE1BQU0sS0FBSztBQUFBLGNBQ1gsVUFBVSxLQUFLO0FBQUEsY0FDZixVQUFVLEtBQUs7QUFBQSxjQUNmLFdBQVcsS0FBSztBQUFBLGNBQ2hCLFVBQVUsS0FBSztBQUFBLGNBQ2Ysb0JBQW9CLEtBQUs7QUFBQSxjQUN6QixzQkFBc0IsS0FBSztBQUFBLGNBQzNCLGlCQUFpQixLQUFLO0FBQUEsY0FDdEIsZUFBZSxLQUFLO0FBQUEsY0FDcEIsVUFBVTtBQUFBLGNBQ1YsV0FBVztBQUFBLGNBQ1gsT0FBTztBQUFBLGNBQ1AsWUFBWTtBQUFBLGNBQ1osUUFBUTtBQUFBLGNBQ1IsYUFBYTtBQUFBLGNBQ2IsWUFBWTtBQUFBLGNBQ1osV0FBVztBQUFBLFlBQ2IsQ0FBQztBQUNEO0FBQUEsVUFDRixPQUFPO0FBQ0wsa0JBQU0sV0FBVztBQUFBLGNBQ2YsR0FBRztBQUFBLGNBQ0gsTUFBTSxLQUFLLFFBQVEsU0FBUztBQUFBLGNBQzVCLFVBQVUsS0FBSyxZQUFZLFNBQVM7QUFBQSxjQUNwQyxVQUFVLEtBQUssWUFBWSxTQUFTO0FBQUEsY0FDcEMsV0FBVyxLQUFLO0FBQUEsY0FDaEIsVUFBVSxLQUFLO0FBQUEsY0FDZixvQkFBb0IsS0FBSztBQUFBLGNBQ3pCLHNCQUFzQixLQUFLO0FBQUEsY0FDM0IsaUJBQWlCLEtBQUs7QUFBQSxjQUN0QixlQUFlLEtBQUs7QUFBQSxjQUNwQixRQUFRO0FBQUEsY0FDUixZQUFZO0FBQUEsY0FDWixXQUFXO0FBQUEsWUFDYixDQUFDO0FBQ0Q7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUVBLGNBQU0sY0FBYyxNQUFNO0FBQUEsVUFDeEI7QUFBQSxVQUNBLE9BQU87QUFBQSxVQUNQLE9BQU87QUFBQSxRQUNUO0FBRUEsZ0JBQVEsS0FBSztBQUFBLFVBQ1gsVUFBVSxPQUFPO0FBQUEsVUFDakIsUUFBUSxPQUFPO0FBQUEsVUFDZjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQSxXQUFBQTtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0gsU0FBUyxHQUFHO0FBQ1YsY0FBTSxTQUFVLEVBQVk7QUFDNUIsZ0JBQVEsTUFBTSxJQUFJLE9BQU8sUUFBUSxJQUFJLE9BQU8sTUFBTSxZQUFZLE1BQU0sRUFBRTtBQUN0RSxnQkFBUSxLQUFLO0FBQUEsVUFDWCxVQUFVLE9BQU87QUFBQSxVQUNqQixRQUFRLE9BQU87QUFBQSxVQUNmLFVBQVU7QUFBQSxVQUNWLFNBQVM7QUFBQSxVQUNULGFBQWE7QUFBQSxVQUNiLFdBQVc7QUFBQSxVQUNYLE9BQU87QUFBQSxRQUNULENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUVBLHFCQUFpQjtBQUVqQixVQUFNLGFBQWEsb0JBQUksSUFBWTtBQUNuQyxlQUFXLEtBQUssTUFBTSxVQUFVLEdBQUc7QUFDakMsVUFBSSxFQUFFLFVBQVUsRUFBRSxhQUFhLE1BQU8sWUFBVyxJQUFJLEVBQUUsRUFBRTtBQUFBLElBQzNEO0FBQ0EseUJBQXFCLGNBQWMsWUFBWSxNQUFNO0FBRXJELFVBQU0sV0FBVyxRQUFRLE9BQU8sQ0FBQyxHQUFHLE1BQU0sSUFBSSxFQUFFLFVBQVUsQ0FBQztBQUMzRCxVQUFNLGVBQWUsUUFBUSxPQUFPLENBQUMsR0FBRyxNQUFNLElBQUksRUFBRSxTQUFTLENBQUM7QUFDOUQsVUFBTSxtQkFBbUIsUUFBUSxPQUFPLENBQUMsR0FBRyxNQUFNLElBQUksRUFBRSxhQUFhLENBQUM7QUFDdEUsVUFBTSxZQUFZLFFBQVEsT0FBTyxDQUFDLEdBQUcsTUFBTSxJQUFJLEVBQUUsV0FBVyxDQUFDO0FBQzdELFVBQU0sWUFBWSxRQUFRLE9BQU8sQ0FBQyxHQUFHLE1BQU0sSUFBSSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsWUFBWSxJQUFJLENBQUM7QUFFM0YsYUFBUyxLQUFLLEtBQUs7QUFBQSxNQUNqQixLQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxhQUFhO0FBQUEsTUFDYjtBQUFBLE1BQ0EsTUFBTTtBQUFBLE1BQ04sZ0JBQWdCO0FBQUEsTUFDaEIsaUJBQWlCO0FBQUEsTUFDakIsZUFBZTtBQUFBLElBQ2pCLENBQUM7QUFBQSxFQUNILFNBQVMsR0FBRztBQUNWLFFBQUksYUFBYSw2QkFBNkI7QUFDNUMsYUFBTyxTQUFTLEtBQUssS0FBSztBQUFBLFFBQ3hCLE9BQU87QUFBQSxRQUNQLFNBQVUsRUFBWTtBQUFBLFFBQ3RCLE1BQ0U7QUFBQSxNQUdKLENBQUM7QUFBQSxJQUNIO0FBQ0EsUUFBSSxhQUFhLGVBQWUsYUFBYSxlQUFlO0FBQzFELGFBQU8sU0FBUyxLQUFLLEtBQUs7QUFBQSxRQUN4QixPQUFPO0FBQUEsUUFDUCxTQUFVLEVBQVk7QUFBQSxRQUN0QixNQUNFO0FBQUEsTUFFSixDQUFDO0FBQUEsSUFDSDtBQUNBLGFBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxZQUFZLFNBQVUsRUFBWSxRQUFRLENBQUM7QUFBQSxFQUN6RTtBQUNGLENBQUM7QUFJRCxNQUFNLE9BQU8scUJBQXFCLE9BQU8sS0FBSyxRQUFRO0FBQ3BELFFBQU0sTUFBTSxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssVUFBVTtBQUM5QyxRQUFNLGVBQWUsSUFBSSxhQUFhLElBQUksZUFBZSxNQUFNO0FBQy9ELFFBQU0sZUFBZSxJQUFJLGFBQWEsSUFBSSxRQUFRLE1BQU07QUFDeEQsUUFBTSxNQUFNLGVBQWUsTUFBTTtBQUVqQyxNQUFJLFFBQVEsTUFBTSxVQUFVLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNO0FBQ3BELE1BQUksYUFBYyxTQUFRLE1BQU0sT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRO0FBQ3hELFFBQU0sTUFBTSxNQUFNLFlBQVk7QUFFOUIsUUFBTSxTQUFTO0FBQUEsSUFDYjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUVBLFFBQU0sU0FBUyxDQUFDLE1BQWU7QUFDN0IsVUFBTSxJQUFJLEtBQUssT0FBTyxLQUFLLE9BQU8sQ0FBQztBQUNuQyxVQUFNLGFBQWEsRUFBRSxTQUFTLEdBQUcsS0FBSyxFQUFFLFNBQVMsR0FBRyxLQUFLLEVBQUUsU0FBUyxJQUFJO0FBQ3hFLFdBQU8sYUFBYSxJQUFJLEVBQUUsUUFBUSxNQUFNLElBQUksQ0FBQyxNQUFNO0FBQUEsRUFDckQ7QUFFQSxRQUFNLE9BQU0sb0JBQUksS0FBSyxHQUFFLFlBQVksRUFBRSxNQUFNLEdBQUcsRUFBRTtBQUNoRCxRQUFNLFdBQVcsZUFDYixnQkFBZ0IsR0FBRyxpQkFBYyxJQUFJLFFBQVEsOEJBQTJCLElBQUksa0JBQWtCO0FBQUEsSUFDOUY7QUFFSixRQUFNLFFBQVEsQ0FBQyxPQUFPLEtBQUssR0FBRyxDQUFDO0FBQy9CLGFBQVcsS0FBSyxPQUFPO0FBQ3JCLFVBQU0sT0FBTyxrQkFBa0IsRUFBRSxzQkFBc0IsS0FBSyxFQUFFLFlBQVksS0FBSztBQUMvRSxVQUFNLE9BQU8sTUFBTSxXQUFXO0FBQzlCLFVBQU0sU0FBUyxRQUFRLE1BQU0sWUFDekIsS0FBSyxNQUFPLEtBQUssWUFBWSxPQUFRLEdBQUcsSUFDeEM7QUFDSixVQUFNO0FBQUEsTUFDSjtBQUFBLFFBQ0UsRUFBRTtBQUFBLFFBQ0YsRUFBRSxZQUFZO0FBQUEsUUFDZCxFQUFFLFVBQVU7QUFBQSxRQUNaLEVBQUUsWUFBWTtBQUFBLFFBQ2QsRUFBRTtBQUFBLFFBQ0YsRUFBRTtBQUFBLFFBQ0YsRUFBRSxZQUFZO0FBQUEsUUFDZCxFQUFFLHNCQUFzQixRQUFRLEVBQUUscUJBQXFCLEtBQUssUUFBUSxDQUFDLElBQUk7QUFBQSxRQUN6RSxFQUFFLHdCQUF3QixRQUFRLEVBQUUsdUJBQXVCLEtBQUssUUFBUSxDQUFDLElBQUk7QUFBQSxRQUM3RSxFQUFFO0FBQUEsUUFDRixFQUFFLGlCQUFpQjtBQUFBLFFBQ25CLFFBQVE7QUFBQSxRQUNSLE1BQU0sWUFBWTtBQUFBLFFBQ2xCLE1BQU0sY0FBYztBQUFBLFFBQ3BCLE1BQU0sZ0JBQWdCO0FBQUEsUUFDdEIsTUFBTSxhQUFhO0FBQUEsUUFDbkI7QUFBQSxRQUNBLEVBQUU7QUFBQSxNQUNKLEVBQ0csSUFBSSxNQUFNLEVBQ1YsS0FBSyxHQUFHO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFFQSxRQUFNLFVBQVUsV0FBVyxNQUFNLEtBQUssSUFBSTtBQUMxQyxRQUFNLE1BQU0sZUFBZSxXQUFNO0FBRWpDLE1BQUksYUFBYTtBQUNqQixNQUFJLFVBQVUsZ0JBQWdCLHlCQUF5QjtBQUN2RCxNQUFJLFVBQVUsdUJBQXVCLHlDQUF5QztBQUM5RSxNQUFJLElBQUksTUFBTSxPQUFPO0FBQ3ZCLENBQUM7QUFHRCxNQUFNLE9BQU8sOEJBQThCLE9BQU8sS0FBSyxRQUFRO0FBQzdELFFBQU0sTUFBTSxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssVUFBVTtBQUM5QyxRQUFNLGVBQWUsSUFBSSxhQUFhLElBQUksZUFBZSxNQUFNO0FBQy9ELFFBQU0saUJBQWlCLElBQUksYUFBYSxJQUFJLFVBQVUsS0FBSztBQUUzRCxNQUFJLFFBQVEsTUFBTSxVQUFVLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNO0FBQ3BELE1BQUksYUFBYyxTQUFRLE1BQU0sT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRO0FBQ3hELE1BQUksZUFBZ0IsU0FBUSxNQUFNLE9BQU8sQ0FBQyxNQUFNLEVBQUUsYUFBYSxjQUFjO0FBQzdFLFFBQU0sTUFBTSxNQUFNLFlBQVk7QUFFOUIsUUFBTSxTQUFTO0FBQUEsSUFDYjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBRUEsUUFBTSxTQUFTLENBQUMsTUFBZTtBQUM3QixVQUFNLElBQUksS0FBSyxPQUFPLEtBQUssT0FBTyxDQUFDO0FBQ25DLFVBQU0sYUFBYSxFQUFFLFNBQVMsR0FBRyxLQUFLLEVBQUUsU0FBUyxHQUFHLEtBQUssRUFBRSxTQUFTLElBQUk7QUFDeEUsV0FBTyxhQUFhLElBQUksRUFBRSxRQUFRLE1BQU0sSUFBSSxDQUFDLE1BQU07QUFBQSxFQUNyRDtBQUVBLFFBQU0sUUFBUSxDQUFDLE9BQU8sS0FBSyxHQUFHLENBQUM7QUFDL0IsYUFBVyxLQUFLLE9BQU87QUFDckIsVUFBTSxPQUFPLGtCQUFrQixFQUFFLHNCQUFzQixLQUFLLEVBQUUsWUFBWSxLQUFLO0FBQy9FLFVBQU0sU0FBUyxNQUFNLGlCQUFpQixFQUFFLEVBQUU7QUFHMUMsVUFBTSxPQUFPLEVBQUUsS0FDWixZQUFZLEVBQ1osUUFBUSxnQkFBZ0IsRUFBRSxFQUMxQixLQUFLLEVBQ0wsTUFBTSxLQUFLLEVBQ1gsTUFBTSxHQUFHLENBQUMsRUFDVixLQUFLLEdBQUc7QUFDWCxVQUFNLE1BQU0sTUFBTSxJQUFJO0FBR3RCLFVBQU0sU0FBOEMsQ0FBQztBQUNyRCxRQUFJLEVBQUUsU0FBVSxRQUFPLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxLQUFLLEVBQUUsU0FBUyxDQUFDO0FBQzVELFFBQUksUUFBUSxPQUFPLFdBQVcsQ0FBQyxPQUFPLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxPQUFPLE1BQU0sT0FBTyxHQUFHO0FBQ2pGLGFBQU8sS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEtBQUssT0FBTyxNQUFNLFFBQVEsQ0FBQztBQUFBLElBQ3hEO0FBQ0EsUUFBSSxRQUFRLGdCQUFnQjtBQUMxQixpQkFBVyxPQUFPLE9BQU8sZ0JBQWdCO0FBQ3ZDLFlBQUksQ0FBQyxPQUFPLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEVBQUcsUUFBTyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sS0FBSyxJQUFJLENBQUM7QUFBQSxNQUMvRTtBQUFBLElBQ0Y7QUFDQSxRQUFJLFFBQVEsT0FBTyxhQUFhO0FBQzlCLGlCQUFXLE9BQU8sT0FBTyxNQUFNLGFBQWE7QUFDMUMsWUFBSSxDQUFDLE9BQU8sS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLEdBQUcsRUFBRyxRQUFPLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxLQUFLLElBQUksQ0FBQztBQUFBLE1BQy9FO0FBQUEsSUFDRjtBQUdBLFVBQU0sZUFBZSxFQUFFLGFBQWEsSUFDakMsTUFBTSxHQUFHLEVBQ1QsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFDbkIsT0FBTyxPQUFPO0FBQ2pCLFVBQU0sdUJBQWdELENBQUM7QUFDdkQsZUFBVyxLQUFLLFlBQWEsc0JBQXFCLENBQUMsSUFBSTtBQUd2RCxVQUFNLFdBQVcsTUFBTSxZQUFZO0FBQ25DLFVBQU0sYUFBYSxNQUFNLGNBQWM7QUFDdkMsVUFBTSxVQUF5RCxDQUFDO0FBQ2hFLGVBQVcsS0FBSyxZQUFZLFNBQVMsY0FBYyxDQUFDLEtBQUssR0FBRztBQUMxRCxjQUFRLENBQUMsSUFBSTtBQUFBLFFBQ1gsVUFBVTtBQUFBLFFBQ1YsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBRUEsVUFBTTtBQUFBLE1BQ0o7QUFBQSxRQUNFO0FBQUEsUUFDQSxFQUFFO0FBQUEsUUFDRixLQUFLLFVBQVUsTUFBTTtBQUFBLFFBQ3JCLEtBQUssVUFBVSxvQkFBb0I7QUFBQSxRQUNuQyxLQUFLLFVBQVUsT0FBTztBQUFBLFFBQ3RCO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGLEVBQ0csSUFBSSxNQUFNLEVBQ1YsS0FBSyxHQUFHO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFFQSxNQUFJLGFBQWE7QUFDakIsTUFBSSxVQUFVLGdCQUFnQix5QkFBeUI7QUFDdkQsTUFBSSxVQUFVLHVCQUF1Qiw0Q0FBNEM7QUFDakYsTUFBSSxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUM7QUFDMUIsQ0FBQztBQUlELE1BQU0sT0FBTyxzQkFBc0IsT0FBTyxLQUFLLFFBQVE7QUFDckQsUUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLE9BQU8sS0FBSyxVQUFVO0FBQzlDLFFBQU0sZUFBZSxJQUFJLGFBQWEsSUFBSSxlQUFlLE1BQU07QUFDL0QsUUFBTSxTQUFTLElBQUksYUFBYSxJQUFJLFFBQVEsTUFBTTtBQUNsRCxRQUFNLGlCQUFpQixJQUFJLGFBQWEsSUFBSSxVQUFVLEtBQUs7QUFFM0QsTUFBSSxRQUFRLE1BQU0sVUFBVSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTTtBQUNwRCxNQUFJLGFBQWMsU0FBUSxNQUFNLE9BQU8sQ0FBQyxNQUFNLEVBQUUsUUFBUTtBQUN4RCxNQUFJLGVBQWdCLFNBQVEsTUFBTSxPQUFPLENBQUMsTUFBTSxFQUFFLGFBQWEsY0FBYztBQUM3RSxRQUFNLE1BQU0sTUFBTSxZQUFZO0FBRTlCLFFBQU0sT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNO0FBQzVCLFVBQU0sT0FBTyxrQkFBa0IsRUFBRSxzQkFBc0IsS0FBSyxFQUFFLFlBQVksS0FBSztBQUMvRSxVQUFNLFNBQVMsU0FBUyxNQUFNLGlCQUFpQixFQUFFLEVBQUUsSUFBSTtBQUN2RCxVQUFNLFFBQVEsR0FBRyxFQUFFLFFBQVEsSUFBSSxFQUFFLE1BQU0sSUFBSSxFQUFFLEVBQUU7QUFDL0MsVUFBTSxVQUFVLE1BQU0scUJBQXFCLEtBQUssS0FBSyxNQUFNLHFCQUFxQixFQUFFLEVBQUU7QUFFcEYsV0FBTztBQUFBO0FBQUEsTUFFTCxJQUFJLEVBQUU7QUFBQSxNQUNOLFFBQVE7QUFBQSxNQUNSLFVBQVUsRUFBRTtBQUFBLE1BQ1osUUFBUSxFQUFFO0FBQUEsTUFDVixVQUFVLEVBQUUsWUFBWTtBQUFBO0FBQUEsTUFHeEIsTUFBTSxFQUFFO0FBQUEsTUFDUixXQUFXLEVBQUU7QUFBQSxNQUNiLFdBQVcsRUFBRTtBQUFBLE1BQ2Isb0JBQW9CLEVBQUU7QUFBQTtBQUFBLE1BR3RCLGdCQUFnQixFQUFFLHNCQUFzQixPQUFPLEVBQUUscUJBQXFCLE1BQU07QUFBQSxNQUM1RSxrQkFBa0IsRUFBRSx3QkFBd0IsT0FBTyxFQUFFLHVCQUF1QixNQUFNO0FBQUEsTUFDbEYsa0JBQWtCLEVBQUU7QUFBQSxNQUNwQixpQkFBaUIsRUFBRSxpQkFBaUIsUUFBUSxpQkFBaUI7QUFBQTtBQUFBLE1BRzdELFVBQVUsTUFBTSxXQUFXO0FBQUEsTUFDM0IsY0FBYyxNQUFNLFlBQVk7QUFBQSxNQUNoQyxnQkFBZ0IsTUFBTSxjQUFjO0FBQUE7QUFBQSxNQUdwQyxhQUFhLFFBQVEsZUFBZTtBQUFBLE1BQ3BDLG1CQUFtQixRQUFRLG9CQUFvQjtBQUFBLE1BQy9DLFdBQVcsUUFBUSxhQUFhO0FBQUEsTUFDaEMsV0FBVyxRQUFRLGFBQWE7QUFBQSxNQUNoQyxjQUFjLFFBQVEsZUFBZTtBQUFBLE1BQ3JDLFFBQVEsUUFBUSxVQUFVLENBQUM7QUFBQSxNQUMzQixZQUFZLFFBQVEsYUFBYTtBQUFBLE1BQ2pDLHFCQUFxQixRQUFRLHNCQUFzQixDQUFDO0FBQUEsTUFDcEQsc0JBQXNCLFFBQVEsdUJBQXVCLENBQUM7QUFBQSxNQUN0RCxjQUFjLFFBQVEsZUFBZTtBQUFBLE1BQ3JDLHFCQUFxQixRQUFRLHFCQUFxQjtBQUFBLE1BQ2xELGtCQUFrQixRQUFRLGtCQUFrQjtBQUFBLE1BQzVDLG1CQUFtQixRQUFRLG1CQUFtQjtBQUFBLE1BQzlDLGVBQWUsUUFBUSxnQkFBZ0IsQ0FBQztBQUFBLE1BQ3hDLFlBQVksUUFBUSxhQUFhO0FBQUEsTUFDakMsV0FBVyxRQUFRLFlBQVk7QUFBQSxNQUMvQixpQkFBaUIsUUFBUSxrQkFBa0IsQ0FBQztBQUFBLE1BQzVDLG9CQUFvQixRQUFRLHFCQUFxQixDQUFDO0FBQUE7QUFBQSxNQUdsRCxjQUFjLEVBQUU7QUFBQSxNQUNoQixXQUFXLFFBQVEsT0FBTyxZQUFZO0FBQUEsTUFDdEMsVUFBVSxRQUFRLE9BQU8sV0FBVztBQUFBLE1BQ3BDLGFBQWEsUUFBUSxPQUFPLGVBQWUsQ0FBQztBQUFBLE1BQzVDLGlCQUFpQixRQUFRLGtCQUFrQixDQUFDO0FBQUEsTUFDNUMsUUFBUSxRQUFRLE9BQU8sVUFBVSxDQUFDO0FBQUE7QUFBQSxNQUdsQyxnQkFBZ0IsUUFBUSxTQUFTLEtBQUssSUFBSSxHQUFHLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSTtBQUFBLE1BQy9FLGNBQWMsUUFBUTtBQUFBO0FBQUEsTUFHdEIsVUFBVSxFQUFFO0FBQUEsTUFDWixXQUFXLEVBQUU7QUFBQSxNQUNiLE9BQU8sRUFBRTtBQUFBLE1BQ1QsUUFBUSxFQUFFO0FBQUEsTUFDVixlQUFlLEVBQUU7QUFBQSxNQUNqQixjQUFjLEVBQUU7QUFBQSxJQUNsQjtBQUFBLEVBQ0YsQ0FBQztBQUVELFdBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxNQUFNLGNBQWEsb0JBQUksS0FBSyxHQUFFLFlBQVksR0FBRyxPQUFPLEtBQUssT0FBTyxDQUFDO0FBQy9GLENBQUM7QUFHRCxNQUFNLE9BQU8sMEJBQTBCLE9BQU8sS0FBSyxRQUFRO0FBQ3pELFFBQU0sTUFBTSxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssVUFBVTtBQUM5QyxRQUFNLGVBQWUsSUFBSSxhQUFhLElBQUksZUFBZSxNQUFNO0FBQy9ELFFBQU0saUJBQWlCLElBQUksYUFBYSxJQUFJLFVBQVUsS0FBSztBQUUzRCxNQUFJLFFBQVEsTUFBTSxVQUFVLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNO0FBQ3BELE1BQUksYUFBYyxTQUFRLE1BQU0sT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRO0FBQ3hELE1BQUksZUFBZ0IsU0FBUSxNQUFNLE9BQU8sQ0FBQyxNQUFNLEVBQUUsYUFBYSxjQUFjO0FBQzdFLFFBQU0sTUFBTSxNQUFNLFlBQVk7QUFFOUIsUUFBTSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU07QUFDNUIsVUFBTSxPQUFPLGtCQUFrQixFQUFFLHNCQUFzQixLQUFLLEVBQUUsWUFBWSxLQUFLO0FBQy9FLFVBQU0sU0FBUyxNQUFNLGlCQUFpQixFQUFFLEVBQUU7QUFFMUMsVUFBTSxPQUFPLEVBQUUsS0FDWixZQUFZLEVBQ1osUUFBUSxnQkFBZ0IsRUFBRSxFQUMxQixLQUFLLEVBQ0wsTUFBTSxLQUFLLEVBQ1gsTUFBTSxHQUFHLENBQUMsRUFDVixLQUFLLEdBQUc7QUFDWCxVQUFNLE1BQU0sTUFBTSxJQUFJO0FBRXRCLFVBQU0sZUFBZSxFQUFFLGFBQWEsSUFDakMsTUFBTSxHQUFHLEVBQ1QsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFDbkIsT0FBTyxPQUFPO0FBQ2pCLFVBQU0sdUJBQWdELENBQUM7QUFDdkQsZUFBVyxLQUFLLFlBQWEsc0JBQXFCLENBQUMsSUFBSTtBQUV2RCxVQUFNLFNBQThDLENBQUM7QUFDckQsUUFBSSxFQUFFLFNBQVUsUUFBTyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sS0FBSyxFQUFFLFNBQVMsQ0FBQztBQUM1RCxRQUFJLFFBQVEsT0FBTyxXQUFXLENBQUMsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsT0FBTyxNQUFNLE9BQU8sR0FBRztBQUNqRixhQUFPLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxLQUFLLE9BQU8sTUFBTSxRQUFRLENBQUM7QUFBQSxJQUN4RDtBQUNBLFFBQUksUUFBUSxnQkFBZ0I7QUFDMUIsaUJBQVcsT0FBTyxPQUFPLGdCQUFnQjtBQUN2QyxZQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsR0FBRyxFQUFHLFFBQU8sS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDL0U7QUFBQSxJQUNGO0FBQ0EsUUFBSSxRQUFRLE9BQU8sYUFBYTtBQUM5QixpQkFBVyxPQUFPLE9BQU8sTUFBTSxhQUFhO0FBQzFDLFlBQUksQ0FBQyxPQUFPLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEVBQUcsUUFBTyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sS0FBSyxJQUFJLENBQUM7QUFBQSxNQUMvRTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFdBQVcsTUFBTSxZQUFZO0FBQ25DLFVBQU0sYUFBYSxNQUFNLGNBQWM7QUFDdkMsVUFBTSxVQUF5RCxDQUFDO0FBQ2hFLGVBQVcsS0FBSyxZQUFZLFNBQVMsY0FBYyxDQUFDLEtBQUssR0FBRztBQUMxRCxjQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsVUFBVSxZQUFZLFdBQVc7QUFBQSxJQUM1RDtBQUVBLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQSxjQUFjLEVBQUU7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsdUJBQXVCO0FBQUEsTUFDdkIsaUNBQWlDO0FBQUEsTUFDakMsZ0JBQWdCO0FBQUEsTUFDaEIsV0FBVztBQUFBLE1BQ1gsWUFBWTtBQUFBLElBQ2Q7QUFBQSxFQUNGLENBQUM7QUFFRCxXQUFTLEtBQUssS0FBSyxFQUFFLE1BQU0sY0FBYSxvQkFBSSxLQUFLLEdBQUUsWUFBWSxHQUFHLE9BQU8sS0FBSyxPQUFPLENBQUM7QUFDeEYsQ0FBQztBQUdELE1BQU0sUUFBUSwyQkFBMkIsT0FBTyxLQUFLLFFBQVE7QUFDM0QsUUFBTSxjQUFjLE1BQU0sWUFBWTtBQUN0QyxNQUFJLENBQUMsYUFBYSxPQUFPLENBQUMsYUFBYSxZQUFZO0FBQ2pELFdBQU8sU0FBUyxLQUFLLEtBQUs7QUFBQSxNQUN4QixPQUFPO0FBQUEsTUFDUCxTQUFTO0FBQUEsSUFDWCxDQUFDO0FBQUEsRUFDSDtBQUVBLFFBQU0sT0FBUSxNQUFNLFNBQVMsR0FBRztBQUNoQyxNQUFJLFFBQVEsTUFBTSxVQUFVLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUTtBQUNsRSxNQUFJLEtBQUssS0FBSyxRQUFRO0FBQ3BCLFVBQU0sUUFBUSxJQUFJLElBQUksS0FBSyxHQUFHO0FBQzlCLFlBQVEsTUFBTSxPQUFPLENBQUMsTUFBTSxNQUFNLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQ3JEO0FBRUEsTUFBSSxNQUFNLFdBQVcsR0FBRztBQUN0QixXQUFPLFNBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxZQUFZLFNBQVMsNkNBQTZDLENBQUM7QUFBQSxFQUN4RztBQUVBLFFBQU0sTUFBTSxNQUFNLFlBQVk7QUFDOUIsUUFBTSxZQUFZLFlBQVksYUFBYTtBQUczQyxRQUFNLFNBQVMsTUFBTSxPQUFPO0FBQzVCLGFBQVcsS0FBSyxPQUFPO0FBQ3JCLFFBQUksRUFBRSxhQUFhLFNBQVMsQ0FBQyxNQUFNLGlCQUFpQixFQUFFLEVBQUUsR0FBRztBQUN6RCxVQUFJO0FBQ0YsY0FBTSxJQUFJLE1BQU0sbUJBQW1CLEVBQUUsSUFBSSxFQUFFLFlBQVksSUFBSSxPQUFPLE1BQU07QUFDeEUsaUNBQXlCLEdBQUcsQ0FBQztBQUFBLE1BQy9CLFFBQVE7QUFBQSxNQUFnRDtBQUN4RCxZQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUFBLElBQzdDO0FBQUEsRUFDRjtBQUVBLFFBQU0sT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNO0FBQzVCLFVBQU0sT0FBTyxrQkFBa0IsRUFBRSxzQkFBc0IsS0FBSyxFQUFFLFlBQVksS0FBSztBQUMvRSxVQUFNLFNBQVMsTUFBTSxpQkFBaUIsRUFBRSxFQUFFO0FBRTFDLFVBQU0sZUFBZSxFQUFFLGFBQWEsSUFDakMsTUFBTSxHQUFHLEVBQ1QsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFDbkIsT0FBTyxPQUFPO0FBQ2pCLFVBQU0sdUJBQWdELENBQUM7QUFDdkQsZUFBVyxLQUFLLFlBQWEsc0JBQXFCLENBQUMsSUFBSTtBQUd2RCxVQUFNLFNBQThDLENBQUM7QUFDckQsUUFBSSxFQUFFLFNBQVUsUUFBTyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sS0FBSyxFQUFFLFNBQVMsQ0FBQztBQUM1RCxRQUFJLFFBQVEsT0FBTyxXQUFXLENBQUMsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsT0FBTyxNQUFNLE9BQU8sR0FBRztBQUNqRixhQUFPLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxLQUFLLE9BQU8sTUFBTSxRQUFRLENBQUM7QUFBQSxJQUN4RDtBQUNBLFFBQUksUUFBUSxnQkFBZ0I7QUFDMUIsaUJBQVcsT0FBTyxPQUFPLGdCQUFnQjtBQUN2QyxZQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsR0FBRyxFQUFHLFFBQU8sS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDL0U7QUFBQSxJQUNGO0FBRUEsVUFBTSxXQUFXLE1BQU0sWUFBWTtBQUNuQyxVQUFNLGFBQWEsTUFBTSxjQUFjO0FBQ3ZDLFVBQU0sVUFBeUQsQ0FBQztBQUNoRSxlQUFXLEtBQUssWUFBWSxTQUFTLGNBQWMsQ0FBQyxLQUFLLEdBQUc7QUFDMUQsY0FBUSxDQUFDLElBQUksRUFBRSxVQUFVLFVBQVUsWUFBWSxXQUFXO0FBQUEsSUFDNUQ7QUFFQSxXQUFPO0FBQUEsTUFDTCxLQUFLLFlBQVksRUFBRSxJQUFJO0FBQUEsTUFDdkIsY0FBYyxFQUFFO0FBQUEsTUFDaEI7QUFBQSxNQUNBLHVCQUF1QjtBQUFBLE1BQ3ZCLGlDQUFpQztBQUFBLE1BQ2pDLGdCQUFnQjtBQUFBLE1BQ2hCLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRixDQUFDO0FBRUQsTUFBSTtBQUNGLFVBQU0sV0FBVyxHQUFHLFlBQVksR0FBRyxZQUFZLFNBQVM7QUFDeEQsVUFBTSxXQUFXLE1BQU0sTUFBTSxVQUFVO0FBQUEsTUFDckMsUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLFFBQ1AsUUFBUSxZQUFZO0FBQUEsUUFDcEIsZUFBZSxVQUFVLFlBQVksVUFBVTtBQUFBLFFBQy9DLGdCQUFnQjtBQUFBLFFBQ2hCLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxNQUFNLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDM0IsQ0FBQztBQUVELFFBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsWUFBTSxPQUFPLE1BQU0sU0FBUyxLQUFLO0FBQ2pDLGFBQU8sU0FBUyxLQUFLLEtBQUs7QUFBQSxRQUN4QixPQUFPO0FBQUEsUUFDUCxTQUFTLHlCQUFzQixTQUFTLE1BQU0sS0FBSyxLQUFLLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFBQSxNQUN2RSxDQUFDO0FBQUEsSUFDSDtBQUdBLGVBQVcsS0FBSyxPQUFPO0FBQ3JCLFlBQU0sVUFBVSxVQUFVLENBQUMsR0FBRyxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQUEsSUFDbkQ7QUFFQSxhQUFTLEtBQUssS0FBSyxFQUFFLFdBQVcsS0FBSyxRQUFRLE1BQU0sS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQUEsRUFDN0UsU0FBUyxLQUFLO0FBQ1osYUFBUyxLQUFLLEtBQUs7QUFBQSxNQUNqQixPQUFPO0FBQUEsTUFDUCxTQUFTLHlCQUF1QixJQUFjLE9BQU87QUFBQSxJQUN2RCxDQUFDO0FBQUEsRUFDSDtBQUNGLENBQUM7QUFJRCxNQUFNLFFBQVEsaUJBQWlCLE9BQU8sS0FBSyxRQUFRO0FBQ2pELFFBQU0sT0FBUSxNQUFNLFNBQVMsR0FBRztBQUNoQyxRQUFNLFFBQVEsS0FBSyxJQUFJLEtBQUssU0FBUyxJQUFJLEVBQUU7QUFDM0MsUUFBTSxRQUFRLE1BQU0sVUFBVSxFQUFFLE9BQU8sQ0FBQyxNQUFNO0FBQzVDLFFBQUksQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLFNBQVUsUUFBTztBQUNyQyxRQUFJLEtBQUssWUFBWSxFQUFFLGFBQWEsS0FBSyxTQUFVLFFBQU87QUFDMUQsUUFBSSxNQUFNLGlCQUFpQixFQUFFLEVBQUUsRUFBRyxRQUFPO0FBQ3pDLFdBQU8sRUFBRSxhQUFhO0FBQUEsRUFDeEIsQ0FBQyxFQUFFLE1BQU0sR0FBRyxLQUFLO0FBRWpCLFFBQU0sVUFBNEUsQ0FBQztBQUNuRixhQUFXLEtBQUssT0FBTztBQUNyQixRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sT0FBTztBQUN6QixZQUFNLFNBQVMsTUFBTSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsWUFBWSxJQUFJLElBQUksTUFBTTtBQUMxRSwrQkFBeUIsR0FBRyxNQUFNO0FBQ2xDLGNBQVEsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLE1BQU0sRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDO0FBQUEsSUFDbkQsU0FBUyxHQUFHO0FBQ1YsY0FBUSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksTUFBTSxFQUFFLE1BQU0sSUFBSSxPQUFPLE9BQVEsRUFBWSxRQUFRLENBQUM7QUFBQSxJQUNqRjtBQUVBLFVBQU0sSUFBSSxRQUFRLENBQUNDLFNBQVEsV0FBV0EsTUFBSyxHQUFHLENBQUM7QUFBQSxFQUNqRDtBQUVBLFdBQVMsS0FBSyxLQUFLLEVBQUUsVUFBVSxRQUFRLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLFFBQVEsT0FBTyxRQUFRLFFBQVEsUUFBUSxDQUFDO0FBQ3JHLENBQUM7QUFHRCxNQUFNLE9BQU8sYUFBYSxPQUFPLE1BQU0sUUFBUTtBQUM3QyxXQUFTLEtBQUssS0FBSztBQUFBLElBQ2pCLFNBQVMsTUFBTSxZQUFZO0FBQUEsSUFDM0IsS0FBSyxNQUFNLE9BQU87QUFBQSxJQUNsQixTQUFTLE1BQU0sV0FBVztBQUFBLElBQzFCLFVBQVUsTUFBTSxZQUFZO0FBQUEsSUFDNUIsZUFBZSxNQUFNLGlCQUFpQjtBQUFBLEVBQ3hDLENBQUM7QUFDSCxDQUFDO0FBR0QsTUFBTSxPQUFPLGFBQWEsT0FBTyxLQUFLLFFBQVE7QUFDNUMsUUFBTSxPQUFRLE1BQU0sU0FBUyxHQUFHO0FBT2hDLFFBQU0sVUFBVSxLQUFLLFVBQVUsTUFBTSxlQUFlLEtBQUssT0FBTyxJQUFJLE1BQU0sWUFBWTtBQUN0RixRQUFNLE1BQU0sS0FBSyxNQUFNLE1BQU0sVUFBVSxLQUFLLEdBQUcsSUFBSSxNQUFNLE9BQU87QUFDaEUsTUFBSSxLQUFLLFFBQVMsT0FBTSxXQUFXLEtBQUssT0FBTztBQUMvQyxNQUFJLEtBQUssYUFBYSxPQUFXLE9BQU0sWUFBWSxLQUFLLFFBQVE7QUFDaEUsTUFBSSxLQUFLLGNBQWUsT0FBTSxpQkFBaUIsS0FBSyxhQUFhO0FBQ2pFLFdBQVMsS0FBSyxLQUFLO0FBQUEsSUFDakI7QUFBQSxJQUNBO0FBQUEsSUFDQSxTQUFTLE1BQU0sV0FBVztBQUFBLElBQzFCLFVBQVUsTUFBTSxZQUFZO0FBQUEsSUFDNUIsZUFBZSxNQUFNLGlCQUFpQjtBQUFBLEVBQ3hDLENBQUM7QUFDSCxDQUFDO0FBR0QsTUFBTSxPQUFPLGNBQWMsT0FBTyxNQUFNLFFBQVE7QUFDOUMsV0FBUyxLQUFLLEtBQUssRUFBRSxRQUFRLGlCQUFpQixTQUFTLGlCQUFpQixDQUFDO0FBQzNFLENBQUM7QUFHRCxNQUFNLFFBQVEsZUFBZSxPQUFPLE1BQU0sUUFBUTtBQUNoRCxRQUFNLFFBQVEsTUFBTSxVQUFVO0FBQzlCLGFBQVcsS0FBSyxPQUFPO0FBQ3JCLFVBQU0sV0FBVyxFQUFFLEdBQUcsR0FBRyxRQUFRLE1BQU0sQ0FBQztBQUFBLEVBQzFDO0FBRUEsYUFBVyxLQUFLLE1BQU8sT0FBTSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsTUFBTSxDQUFDO0FBQzlELFdBQVMsS0FBSyxLQUFLLEVBQUUsU0FBUyxNQUFNLE9BQU8sQ0FBQztBQUM5QyxDQUFDO0FBRUQsZUFBZSxhQUE0QjtBQUN6QyxRQUFNLFVBQVUsTUFBTSxXQUFXLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPO0FBQzFELFFBQU0sVUFBUyxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUN0QyxhQUFXLFVBQVUsU0FBUztBQUM1QixRQUFJO0FBQ0YsWUFBTSxXQUFXLFlBQVksT0FBTyxRQUFRO0FBQzVDLFlBQU0sV0FBVyxvQkFBSSxJQUFZO0FBQ2pDLFlBQU0sWUFBWSxFQUFFLEdBQUcsT0FBTztBQUM5QixVQUFJLE9BQU8sYUFBYSxTQUFTLENBQUMsT0FBTyxZQUFZO0FBQ25ELGtCQUFVLGFBQWEsTUFBTSxPQUFPLEVBQUU7QUFBQSxNQUN4QztBQUNBLHVCQUFpQixRQUFRLFNBQVMsV0FBVyxTQUFTLEdBQUc7QUFDdkQsY0FBTSxRQUFRLEdBQUcsT0FBTyxRQUFRLElBQUksT0FBTyxNQUFNLElBQUksS0FBSyxFQUFFO0FBQzVELGlCQUFTLElBQUksS0FBSztBQUNsQixjQUFNLFdBQVcsTUFBTSxtQkFBbUIsT0FBTyxVQUFVLE9BQU8sUUFBUSxLQUFLLEVBQUU7QUFDakYsWUFBSSxDQUFDLFVBQVU7QUFDYixnQkFBTSxXQUFXO0FBQUEsWUFDZixJQUFJLEtBQUs7QUFBQSxZQUFJLFVBQVUsT0FBTztBQUFBLFlBQVUsUUFBUSxPQUFPO0FBQUEsWUFDdkQsTUFBTSxLQUFLO0FBQUEsWUFBTSxVQUFVLEtBQUs7QUFBQSxZQUFVLFVBQVUsS0FBSztBQUFBLFlBQ3pELFdBQVcsS0FBSztBQUFBLFlBQW1CLFVBQVUsS0FBSztBQUFBLFlBQ2xELG9CQUFvQixLQUFLO0FBQUEsWUFBb0Isc0JBQXNCLEtBQUs7QUFBQSxZQUN4RSxpQkFBaUIsS0FBSztBQUFBLFlBQWlCLGVBQWUsS0FBSztBQUFBLFlBQzNELFVBQVU7QUFBQSxZQUFPLFdBQVc7QUFBQSxZQUFPLE9BQU87QUFBQSxZQUFJLFlBQVk7QUFBQSxZQUFJLFFBQVE7QUFBQSxZQUN0RSxhQUFhO0FBQUEsWUFBUSxZQUFZO0FBQUEsWUFBUSxXQUFXO0FBQUEsVUFDdEQsQ0FBQztBQUFBLFFBQ0gsT0FBTztBQUNMLGdCQUFNLFdBQVc7QUFBQSxZQUNmLEdBQUc7QUFBQSxZQUFVLE1BQU0sS0FBSyxRQUFRLFNBQVM7QUFBQSxZQUFNLFVBQVUsS0FBSyxZQUFZLFNBQVM7QUFBQSxZQUNuRixVQUFVLEtBQUssWUFBWSxTQUFTO0FBQUEsWUFBVSxXQUFXLEtBQUs7QUFBQSxZQUM5RCxVQUFVLEtBQUs7QUFBQSxZQUFVLG9CQUFvQixLQUFLO0FBQUEsWUFDbEQsc0JBQXNCLEtBQUs7QUFBQSxZQUFzQixpQkFBaUIsS0FBSztBQUFBLFlBQ3ZFLGVBQWUsS0FBSztBQUFBLFlBQWUsUUFBUTtBQUFBLFlBQU0sWUFBWTtBQUFBLFlBQVEsV0FBVztBQUFBLFVBQ2xGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUNBLFlBQU0sc0JBQXNCLFVBQVUsT0FBTyxVQUFVLE9BQU8sTUFBTTtBQUFBLElBQ3RFLFNBQVMsR0FBRztBQUNWLGNBQVEsTUFBTSxlQUFlLE9BQU8sUUFBUSxJQUFJLE9BQU8sTUFBTSxLQUFNLEVBQVksT0FBTyxFQUFFO0FBQUEsSUFDMUY7QUFBQSxFQUNGO0FBQ0EsbUJBQWlCO0FBQ25CO0FBRUEsU0FBUyxtQkFBeUI7QUFDaEMsUUFBTSxRQUFRLE1BQU0sVUFBVSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTTtBQUN0RCxRQUFNLFdBQVcsTUFBTSx5QkFBeUI7QUFDaEQsUUFBTSxVQUFVLFdBQVcsT0FBTyxRQUFRO0FBQzFDLFFBQU0scUJBQXFCLE9BQU87QUFDcEM7QUFHQSxNQUFNLE9BQU8sZ0JBQWdCLE9BQU8sTUFBTSxRQUFRO0FBQ2hELFFBQU0sY0FBYyxNQUFNLGVBQWU7QUFDekMsUUFBTSxjQUFjLE1BQU0seUJBQXlCO0FBQ25ELFdBQVMsS0FBSyxLQUFLO0FBQUEsSUFDakIsYUFBYSxZQUFZLElBQUksQ0FBQyxPQUFPO0FBQUEsTUFDbkMsR0FBRztBQUFBLE1BQ0gsYUFBYSxZQUFZLEVBQUUsR0FBRyxLQUFLO0FBQUEsTUFDbkMsY0FBYyxNQUNYLHlCQUF5QixLQUFLLEVBQzlCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRTtBQUFBLElBQ3pDLEVBQUU7QUFBQSxFQUNKLENBQUM7QUFDSCxDQUFDO0FBR0QsTUFBTSxPQUFPLGdCQUFnQixPQUFPLEtBQUssUUFBUTtBQUMvQyxRQUFNLE9BQVEsTUFBTSxTQUFTLEdBQUc7QUFDaEMsTUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLFdBQVcsR0FBRztBQUNwQyxXQUFPLFNBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxlQUFlLFNBQVMseUJBQXlCLENBQUM7QUFBQSxFQUN2RjtBQUNBLFFBQU0sUUFBNEIsS0FBSyxZQUNwQyxPQUFPLENBQUMsTUFBTSxLQUFLLE9BQU8sRUFBRSxRQUFRLFlBQVksT0FBTyxFQUFFLFdBQVcsUUFBUSxFQUM1RSxJQUFJLENBQUMsT0FBTztBQUFBLElBQ1gsS0FBSyxFQUFFLElBQUksS0FBSztBQUFBLElBQ2hCLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxLQUFLO0FBQUEsSUFDL0IsUUFBUSxFQUFFLE9BQU8sUUFBUSxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsU0FBUyxFQUFFLEVBQUUsS0FBSztBQUFBLElBQ3ZFLE1BQU8sQ0FBQyxXQUFXLGVBQWUsUUFBUSxjQUFjLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsT0FBTztBQUFBLElBQzVGLFNBQVMsRUFBRSxZQUFZO0FBQUEsRUFDekIsRUFBRTtBQUNKLFFBQU0sZUFBZSxLQUFLO0FBQzFCLG1CQUFpQjtBQUNqQixXQUFTLEtBQUssS0FBSyxFQUFFLGFBQWEsTUFBTSxlQUFlLEVBQUUsQ0FBQztBQUM1RCxDQUFDO0FBR0QsTUFBTSxRQUFRLHdCQUF3QixPQUFPLE1BQU0sUUFBUTtBQUN6RCxRQUFNLGNBQWMsTUFBTSxlQUFlLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPO0FBQ2xFLFFBQU0sT0FBTSxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUNuQyxRQUFNLFVBQWdGLENBQUM7QUFFdkYsUUFBTSxRQUFRO0FBQUEsSUFDWixZQUFZLElBQUksT0FBTyxNQUFNO0FBQzNCLFVBQUk7QUFDRixjQUFNLFdBQVcsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QyxjQUFNLHNCQUFzQixFQUFFLEtBQUssVUFBVSxHQUFHO0FBQ2hELGdCQUFRLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxPQUFPLEVBQUUsT0FBTyxPQUFPLFNBQVMsT0FBTyxDQUFDO0FBQUEsTUFDckUsU0FBUyxHQUFHO0FBQ1YsY0FBTSxNQUNKLGFBQWEsdUJBQ1QsRUFBRSxVQUNELEVBQVksV0FBVztBQUM5QixnQkFBUSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssT0FBTyxFQUFFLE9BQU8sT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDO0FBQUEsTUFDbkU7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBRUEsbUJBQWlCO0FBQ2pCLFdBQVMsS0FBSyxLQUFLLEVBQUUsYUFBYSxLQUFLLFFBQVEsQ0FBQztBQUNsRCxDQUFDO0FBR0QsTUFBTSxPQUFPLFlBQVksT0FBTyxNQUFNLFFBQVE7QUFDNUMsUUFBTSxNQUFNLE1BQU0sWUFBWTtBQUM5QixRQUFNLFdBQVcsTUFBTSx5QkFBeUI7QUFDaEQsUUFBTSxVQUFVLE1BQU0sZ0JBQWdCO0FBQ3RDLFFBQU0sUUFBUSwwQkFBMEIsVUFBVSxLQUFLLE9BQU87QUFDOUQsV0FBUyxLQUFLLEtBQUssRUFBRSxPQUFPLFdBQVcsU0FBUyxhQUFhLEtBQUssQ0FBQztBQUNyRSxDQUFDO0FBR0QsTUFBTSxRQUFRLG9CQUFvQixPQUFPLE1BQU0sUUFBUTtBQUNyRCxNQUFJO0FBQ0YsVUFBTSxTQUFTLE1BQU0sbUJBQW1CO0FBQ3hDLFVBQU0sZ0JBQWdCLE1BQU07QUFDNUIsYUFBUyxLQUFLLEtBQUssTUFBTTtBQUFBLEVBQzNCLFNBQVMsR0FBRztBQUNWLGFBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxpQkFBaUIsU0FBVSxFQUFZLFFBQVEsQ0FBQztBQUFBLEVBQzlFO0FBQ0YsQ0FBQztBQUlELE1BQU0sUUFBUSxpQkFBaUIsT0FBTyxLQUFLLFFBQVE7QUFDakQsUUFBTSxPQUFPLE1BQU0sU0FBUyxHQUFHO0FBQy9CLFFBQU0sUUFDSixNQUFNO0FBQ1IsTUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLEtBQUssQ0FBQyxNQUFNLFFBQVE7QUFDMUMsYUFBUyxLQUFLLEtBQUssRUFBRSxPQUFPLGVBQWUsU0FBUyxtQkFBbUIsQ0FBQztBQUN4RTtBQUFBLEVBQ0Y7QUFFQSxRQUFNLE1BQU0sTUFBTSxZQUFZO0FBQzlCLFFBQU0sV0FBVyxNQUFNLFVBQVUsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU07QUFDekQsUUFBTSxZQUFZLFNBQVMsSUFBSSxDQUFDLE9BQU87QUFBQSxJQUNyQyxNQUFNO0FBQUEsSUFDTixRQUFRLFNBQVMsRUFBRSxJQUFJO0FBQUEsRUFDekIsRUFBRTtBQUVGLFFBQU0sWUFBWTtBQUNsQixRQUFNLFVBQVUsTUFBTSxJQUFJLENBQUMsU0FBUztBQUNsQyxVQUFNLGNBQWMsU0FBUyxLQUFLLElBQUk7QUFDdEMsUUFBSSxXQUF3QjtBQUM1QixRQUFJLFlBQVk7QUFFaEIsZUFBVyxFQUFFLE1BQU0sT0FBTyxLQUFLLFdBQVc7QUFDeEMsVUFBSSxDQUFDLE9BQU8sT0FBUTtBQUNwQixZQUFNLFFBQVEsV0FBVyxhQUFhLE1BQU07QUFDNUMsVUFBSSxRQUFRLFdBQVc7QUFDckIsb0JBQVk7QUFDWixtQkFBVztBQUFBLE1BQ2I7QUFBQSxJQUNGO0FBRUEsVUFBTSxVQUFVLGFBQWEsYUFBYTtBQUMxQyxVQUFNLE1BQU0sVUFBVSxVQUFVLFVBQVcsR0FBRyxJQUFJO0FBRWxELFdBQU87QUFBQSxNQUNMLE9BQU8sS0FBSztBQUFBLE1BQ1osVUFBVSxLQUFLO0FBQUEsTUFDZixVQUFVLEtBQUs7QUFBQSxNQUNmLFlBQVksS0FBSyxNQUFNLFlBQVksR0FBRyxJQUFJO0FBQUEsTUFDMUMsT0FBTyxDQUFDLENBQUM7QUFBQSxNQUNULE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRixDQUFDO0FBRUQsV0FBUyxLQUFLLEtBQUssRUFBRSxRQUFRLENBQUM7QUFDaEMsQ0FBQztBQU1ELE1BQU0sT0FBTyx3QkFBd0IsT0FBTyxNQUFNLFFBQVE7QUFDeEQsTUFBSTtBQUNGLFVBQU0sTUFBTSxNQUFNLE9BQU87QUFDekIsVUFBTSxTQUFTLE1BQU0sb0JBQW9CLEdBQUc7QUFDNUMsYUFBUyxLQUFLLEtBQUssTUFBTTtBQUFBLEVBQzNCLFNBQVMsR0FBRztBQUNWLFFBQUksYUFBYSxhQUFhO0FBQzVCLGFBQU8sU0FBUyxLQUFLLEtBQUs7QUFBQSxRQUN4QixPQUFPO0FBQUEsUUFDUCxTQUFVLEVBQVk7QUFBQSxNQUN4QixDQUFDO0FBQUEsSUFDSDtBQUNBLGFBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxZQUFZLFNBQVUsRUFBWSxRQUFRLENBQUM7QUFBQSxFQUN6RTtBQUNGLENBQUM7QUFLRCxNQUFNLE9BQU8scUJBQXFCLE9BQU8sTUFBTSxLQUFLLFdBQVc7QUFDN0QsUUFBTSxTQUFTLE1BQU0saUJBQWlCLE9BQU8sRUFBRTtBQUMvQyxNQUFJLENBQUMsUUFBUTtBQUNYLFFBQUksYUFBYTtBQUNqQixRQUFJLElBQUk7QUFDUjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLEtBQUssS0FBSyxNQUFNO0FBQzNCLENBQUM7QUFHRCxNQUFNLFFBQVEsNkJBQTZCLE9BQU8sTUFBTSxLQUFLLFdBQVc7QUFDdEUsUUFBTSxPQUFPLE1BQU0sUUFBUSxPQUFPLEVBQUU7QUFDcEMsTUFBSSxDQUFDLEtBQU0sUUFBTyxTQUFTLEtBQUssS0FBSyxFQUFFLE9BQU8sWUFBWSxDQUFDO0FBQzNELE1BQUk7QUFDRixVQUFNLE1BQU0sTUFBTSxPQUFPO0FBQ3pCLFVBQU0sU0FBUyxNQUFNO0FBQUEsTUFDbkIsS0FBSztBQUFBLE1BQ0wsS0FBSyxZQUFZO0FBQUEsTUFDakIsSUFBSTtBQUFBLElBQ047QUFDQSw2QkFBeUIsTUFBTSxNQUFNO0FBQ3JDLGFBQVMsS0FBSyxLQUFLLE1BQU07QUFBQSxFQUMzQixTQUFTLEdBQUc7QUFDVixRQUFJLGFBQWEsYUFBYTtBQUM1QixhQUFPLFNBQVMsS0FBSyxLQUFLO0FBQUEsUUFDeEIsT0FBTztBQUFBLFFBQ1AsU0FBVSxFQUFZO0FBQUEsTUFDeEIsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTLEtBQUssS0FBSyxFQUFFLE9BQU8sWUFBWSxTQUFVLEVBQVksUUFBUSxDQUFDO0FBQUEsRUFDekU7QUFDRixDQUFDO0FBR0QsTUFBTSxPQUFPLGNBQWMsT0FBTyxNQUFNLFFBQVE7QUFDOUMsV0FBUyxLQUFLLEtBQUssRUFBRSxPQUFPLE1BQU0sY0FBYyxFQUFFLENBQUM7QUFDckQsQ0FBQztBQUdELE1BQU0sUUFBUSxjQUFjLE9BQU8sS0FBSyxRQUFRO0FBQzlDLFFBQU0sT0FBUSxNQUFNLFNBQVMsR0FBRztBQUNoQyxRQUFNLEtBQUssYUFBYSxLQUFLLFNBQVMsRUFBRTtBQUN4QyxNQUFJLENBQUMsSUFBSTtBQUNQLFdBQU8sU0FBUyxLQUFLLEtBQUs7QUFBQSxNQUN4QixPQUFPO0FBQUEsTUFDUCxTQUFTO0FBQUEsSUFDWCxDQUFDO0FBQUEsRUFDSDtBQUNBLFFBQU0sV0FBVyxNQUFNLFdBQVcsRUFBRTtBQUNwQyxNQUFJLFNBQVUsUUFBTyxTQUFTLEtBQUssS0FBSyxRQUFRO0FBRWhELFFBQU0sT0FBTyxNQUFNLFFBQVEsRUFBRTtBQUM3QixRQUFNLE9BQU0sb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFDbkMsUUFBTSxRQUFxQjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxNQUFNLE1BQU0sUUFBUTtBQUFBLElBQ3BCLFNBQVM7QUFBQSxJQUNULFlBQVksTUFBTSxVQUFVLEtBQUssa0JBQWtCLElBQUksWUFBWSxPQUFPLGFBQWE7QUFBQSxJQUN2RixrQkFDRSxNQUFNLFVBQVUsS0FBSyxrQkFBa0IsSUFBSSxNQUFNO0FBQUEsSUFDbkQsZ0JBQWdCLE1BQU0sd0JBQXdCO0FBQUEsSUFDOUMscUJBQXFCLE1BQU0sbUJBQW1CO0FBQUEsSUFDOUMsUUFBUSxLQUFLLFNBQVMsSUFBSSxLQUFLO0FBQUEsRUFDakM7QUFDQSxXQUFTLEtBQUssS0FBSyxNQUFNLGNBQWMsS0FBSyxDQUFDO0FBQy9DLENBQUM7QUFHRCxNQUFNLFNBQVMsa0JBQWtCLE9BQU8sS0FBSyxLQUFLLFdBQVc7QUFDM0QsUUFBTSxPQUFRLE1BQU0sU0FBUyxHQUFHO0FBQ2hDLFFBQU0sUUFBOEIsQ0FBQztBQUNyQyxNQUFJLE9BQU8sS0FBSyxVQUFVLFNBQVUsT0FBTSxRQUFRLEtBQUs7QUFDdkQsTUFBSSxPQUFPLEtBQUssU0FBUyxZQUFZLEtBQUssS0FBSyxLQUFLLEVBQUcsT0FBTSxPQUFPLEtBQUssS0FBSyxLQUFLO0FBQ25GLFFBQU0sVUFBVSxNQUFNLGFBQWEsT0FBTyxJQUFJLEtBQUs7QUFDbkQsTUFBSSxDQUFDLFFBQVMsUUFBTyxTQUFTLEtBQUssS0FBSyxFQUFFLE9BQU8sWUFBWSxDQUFDO0FBQzlELFdBQVMsS0FBSyxLQUFLLE9BQU87QUFDNUIsQ0FBQztBQUdELE1BQU0sVUFBVSxrQkFBa0IsT0FBTyxNQUFNLEtBQUssV0FBVztBQUM3RCxRQUFNLEtBQUssTUFBTSxjQUFjLE9BQU8sRUFBRTtBQUN4QyxNQUFJLENBQUMsR0FBSSxRQUFPLFNBQVMsS0FBSyxLQUFLLEVBQUUsT0FBTyxZQUFZLENBQUM7QUFDekQsV0FBUyxLQUFLLEtBQUssRUFBRSxTQUFTLEtBQUssQ0FBQztBQUN0QyxDQUFDO0FBR0QsTUFBTSxPQUFPLHNCQUFzQixPQUFPLE1BQU0sS0FBSyxXQUFXO0FBQzlELFFBQU0sVUFBNkIsTUFBTSxxQkFBcUIsT0FBTyxFQUFFO0FBQ3ZFLFdBQVMsS0FBSyxLQUFLLEVBQUUsUUFBUSxDQUFDO0FBQ2hDLENBQUM7QUFHRCxNQUFNLFFBQVEscUJBQXFCLE9BQU8sTUFBTSxRQUFRO0FBQ3RELE1BQUk7QUFDRixVQUFNLFFBQVEsTUFBTSxtQkFBbUI7QUFDdkMsVUFBTSxRQUFnQyxDQUFDO0FBQ3ZDLFFBQUksTUFBTSxZQUFZLEtBQU0sT0FBTSxXQUFXLEtBQUssTUFBTSxNQUFNLFFBQVE7QUFDdEUsUUFBSSxPQUFPLEtBQUssS0FBSyxFQUFFLFNBQVMsR0FBRztBQUNqQyxZQUFNLGVBQWUsS0FBSztBQUFBLElBQzVCO0FBQ0EsYUFBUyxLQUFLLEtBQUs7QUFBQSxNQUNqQixTQUFTO0FBQUEsTUFDVCxXQUFXLE1BQU07QUFBQSxNQUNqQixRQUFRLE1BQU07QUFBQSxJQUNoQixDQUFDO0FBQUEsRUFDSCxTQUFTLEdBQUc7QUFDVixhQUFTLEtBQUssS0FBSyxFQUFFLE9BQU8sa0JBQWtCLFNBQVUsRUFBWSxRQUFRLENBQUM7QUFBQSxFQUMvRTtBQUNGLENBQUM7QUFHRCxNQUFNLE9BQU8saUJBQWlCLE9BQU8sTUFBTSxRQUFRO0FBQ2pELFFBQU0sV0FBVyxNQUFNLFVBQVU7QUFDakMsUUFBTSxjQUFjLFNBQVMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNO0FBRW5ELFFBQU0sa0JBQTBDLENBQUM7QUFDakQsYUFBVyxLQUFLLGFBQWE7QUFDM0Isb0JBQWdCLEVBQUUsUUFBUSxLQUFLLGdCQUFnQixFQUFFLFFBQVEsS0FBSyxLQUFLO0FBQUEsRUFDckU7QUFFQSxRQUFNLFVBQVUsTUFBTSxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU87QUFBQSxJQUM3QyxVQUFVLEVBQUU7QUFBQSxJQUNaLFFBQVEsRUFBRTtBQUFBLElBQ1YsU0FBUyxFQUFFO0FBQUEsRUFDYixFQUFFO0FBRUYsUUFBTSxjQUFjLE1BQU0sZUFBZTtBQUN6QyxRQUFNLGNBQWMsTUFBTSx5QkFBeUIsS0FBSztBQUN4RCxRQUFNLGNBQWMsTUFBTSx5QkFBeUI7QUFFbkQsUUFBTSxtQkFBbUIsWUFBWSxJQUFJLENBQUMsT0FBTztBQUFBLElBQy9DLEtBQUssRUFBRTtBQUFBLElBQ1AsT0FBTyxFQUFFO0FBQUEsSUFDVCxjQUFjLFlBQVksT0FBTyxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyxFQUFFO0FBQUEsSUFDOUQsYUFBYSxZQUFZLEVBQUUsR0FBRyxLQUFLO0FBQUEsRUFDckMsRUFBRTtBQUVGLFdBQVMsS0FBSyxLQUFLO0FBQUEsSUFDakIsWUFBWSxTQUFTO0FBQUEsSUFDckIsYUFBYSxZQUFZO0FBQUEsSUFDekI7QUFBQSxJQUNBO0FBQUEsSUFDQSxhQUFhO0FBQUEsSUFDYiwwQkFBMEIsTUFBTSx1QkFBdUI7QUFBQSxJQUN2RCxtQkFBbUIscUJBQXFCO0FBQUEsSUFDeEMsVUFBVTtBQUFBLEVBQ1osQ0FBQztBQUNILENBQUM7QUFJRCxNQUFNLE9BQU8sY0FBYyxPQUFPLEtBQUssUUFBUTtBQUM3QyxRQUFNLE9BQVEsTUFBTSxTQUFTLEdBQUc7QUFDaEMsUUFBTSxRQUFRLE9BQU8sS0FBSyxpQkFBaUIsQ0FBQztBQUM1QyxNQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssS0FBSyxRQUFRLEdBQUc7QUFDeEMsV0FBTyxTQUFTLEtBQUssS0FBSyxFQUFFLE9BQU8sZUFBZSxTQUFTLDZCQUE2QixDQUFDO0FBQUEsRUFDM0Y7QUFDQSxRQUFNLHVCQUF1QixLQUFLO0FBQ2xDLGFBQVcsVUFBVTtBQUNyQixXQUFTLEtBQUssS0FBSyxFQUFFLGVBQWUsTUFBTSx1QkFBdUIsRUFBRSxDQUFDO0FBQ3RFLENBQUM7QUFHRCxlQUFlLFVBQVU7QUFFekIsZUFBc0IsY0FDcEIsS0FDQSxLQUNlO0FBQ2YsUUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLE9BQU8sS0FBSyxVQUFVO0FBQzlDLFFBQU0sV0FBVyxJQUFJO0FBRXJCLGFBQVcsS0FBSyxRQUFRO0FBQ3RCLFFBQUksRUFBRSxXQUFXLElBQUksT0FBUTtBQUM3QixVQUFNLElBQUksRUFBRSxRQUFRLEtBQUssUUFBUTtBQUNqQyxRQUFJLENBQUMsRUFBRztBQUNSLFVBQU0sU0FBaUMsQ0FBQztBQUN4QyxNQUFFLEtBQUssUUFBUSxDQUFDLEdBQUcsTUFBTyxPQUFPLENBQUMsSUFBSSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFO0FBQ25FLFdBQU8sRUFBRSxRQUFRLEtBQUssS0FBSyxNQUFNO0FBQUEsRUFDbkM7QUFDQSxXQUFTLEtBQUssS0FBSyxFQUFFLE9BQU8sYUFBYSxNQUFNLFNBQVMsQ0FBQztBQUMzRDs7O0FDaDNDTyxTQUFTLFlBQW9CO0FBQ2xDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGdCQUFnQixRQUF1QjtBQUNyQyxhQUFPLFlBQVk7QUFBQSxRQUNqQjtBQUFBLFFBQ0EsQ0FBQyxLQUFzQixLQUFxQixTQUFxQjtBQUMvRCx3QkFBYyxLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUTtBQUNyQyxvQkFBUSxNQUFNLG1CQUFtQixHQUFHO0FBQ3BDLGdCQUFJLENBQUMsSUFBSSxhQUFhO0FBQ3BCLGtCQUFJLGFBQWE7QUFDakIsa0JBQUksVUFBVSxnQkFBZ0Isa0JBQWtCO0FBQ2hELGtCQUFJO0FBQUEsZ0JBQ0YsS0FBSyxVQUFVO0FBQUEsa0JBQ2IsT0FBTztBQUFBLGtCQUNQLFNBQVMsT0FBUSxLQUFlLFdBQVcsR0FBRztBQUFBLGdCQUNoRCxDQUFDO0FBQUEsY0FDSDtBQUFBLFlBQ0YsT0FBTztBQUNMLGtCQUFJLElBQUk7QUFBQSxZQUNWO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOzs7QWhCOUJBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO0FBQUEsRUFDOUIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJtIiwgIlVBIiwgInBhdGgiLCAiVUEiLCAiZmV0Y2hIdG1sIiwgImV4dHJhY3ROZXh0RGF0YSIsICJtIiwgIlVBIiwgIlVBIiwgIkNVUlJFTkNZX01BUCIsICJmZXRjaEpzb24iLCAibiIsICJVQSIsICJDVVJSRU5DWV9NQVAiLCAiZmV0Y2hXaXRoUmV0cnkiLCAiZmV0Y2hKc29uIiwgImZldGNoSHRtbCIsICJVQSIsICJVQSIsICJleHRyYWN0TmV4dERhdGEiLCAicGF0aCIsICJ0b3RhbFNlZW4iLCAicmVzIl0KfQo=
