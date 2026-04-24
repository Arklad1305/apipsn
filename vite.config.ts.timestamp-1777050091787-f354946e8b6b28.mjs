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
  const imgRe = /data-qa="[^"]*game-art[^"]*image[^"]*"[^>]*\bsrc="([^"]+)"/g;
  while ((m = imgRe.exec(html)) !== null) {
    imgs.push({ url: m[1].replace(/&amp;/g, "&"), pos: m.index });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL3N0b3JlLnRzIiwgInNlcnZlci9wcmljaW5nLnRzIiwgInNlcnZlci9wc24udHMiLCAic2VydmVyL2NvbXBldGl0b3JzLnRzIiwgInNlcnZlci9wc24tcHJvZHVjdC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3R5cGVzLnRzIiwgInNlcnZlci9wcm92aWRlcnMvcHNuLnRzIiwgInNlcnZlci9wcm92aWRlcnMveGJveC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3N0ZWFtLnRzIiwgInNlcnZlci9wcm92aWRlcnMvbmludGVuZG8udHMiLCAic2VydmVyL3Byb3ZpZGVycy9pbmRleC50cyIsICJzZXJ2ZXIvZXhjaGFuZ2UudHMiLCAic2VydmVyL3NjaGVkdWxlci50cyIsICJzZXJ2ZXIvcHMtcGx1cy50cyIsICJzZXJ2ZXIvYXBpLnRzIiwgInNlcnZlci9wbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgYXBpUGx1Z2luIH0gZnJvbSBcIi4vc2VydmVyL3BsdWdpblwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpUGx1Z2luKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiOy8qKlxuICogSlNPTi1maWxlIHN0b3JhZ2UuIEF2b2lkcyBuYXRpdmUgZGVwcyAoYmV0dGVyLXNxbGl0ZTMgYnJlYWtzIGluIFdlYkNvbnRhaW5lcnMpLlxuICovXG5pbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ29tcGV0aXRvckNvbmZpZyxcbiAgQ29tcGV0aXRvck1hdGNoLFxuICBDb21wZXRpdG9yUHJvZHVjdCxcbn0gZnJvbSBcIi4vY29tcGV0aXRvcnNcIjtcbmltcG9ydCB0eXBlIHsgUHJvZHVjdERldGFpbCB9IGZyb20gXCIuL3Bzbi1wcm9kdWN0XCI7XG5pbXBvcnQgdHlwZSB7IFBsYXRmb3JtLCBQcm92aWRlclNvdXJjZSB9IGZyb20gXCIuL3Byb3ZpZGVycy90eXBlc1wiO1xuXG4vKiogQSBnYW1lIHRoZSB1c2VyIGlzIHRyYWNraW5nIGV2ZW4gd2hlbiBpdCdzIG5vdCBpbiB0aGUgY3VycmVudCBXZWVrbHkgRGVhbHNcbiAqICBjYXRlZ29yeS4gRXZlcnkgL3JlZnJlc2ggZGlmZnMgdGhlc2UgYWdhaW5zdCB0aGUgc2NyYXBlIGFuZCByZXBvcnRzXG4gKiAgdHJhbnNpdGlvbnMgKG9mZl9zYWxlIFx1MjE5MiBvbl9zYWxlKSBiYWNrIHRvIHRoZSBjbGllbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoZWRHYW1lIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBhZGRlZEF0OiBzdHJpbmc7XG4gIC8qKiBcInVuc2VlblwiID0gbmV2ZXIgZm91bmQgaW4gYW55IHJlZnJlc2ggeWV0LiAqL1xuICBsYXN0U3RhdHVzOiBcInVuc2VlblwiIHwgXCJvbl9zYWxlXCIgfCBcIm9mZl9zYWxlXCI7XG4gIGxhc3RTZWVuT25TYWxlQXQ6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RQcmljZUNlbnRzOiBudW1iZXIgfCBudWxsO1xuICBsYXN0RGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIG5vdGVzOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2FtZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgaW1hZ2VVcmw6IHN0cmluZyB8IG51bGw7XG4gIHN0b3JlVXJsOiBzdHJpbmcgfCBudWxsO1xuICBwbGF0Zm9ybXM6IHN0cmluZztcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgcHJpY2VPcmlnaW5hbENlbnRzOiBudW1iZXIgfCBudWxsO1xuICBwcmljZURpc2NvdW50ZWRDZW50czogbnVtYmVyIHwgbnVsbDtcbiAgZGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIGRpc2NvdW50RW5kQXQ6IHN0cmluZyB8IG51bGw7XG4gIHNlbGVjdGVkOiBib29sZWFuO1xuICBwdWJsaXNoZWQ6IGJvb2xlYW47XG4gIG5vdGVzOiBzdHJpbmc7XG4gIHlvdXR1YmVVcmw6IHN0cmluZztcbiAgYWN0aXZlOiBib29sZWFuO1xuICBmaXJzdFNlZW5BdDogc3RyaW5nO1xuICBsYXN0U2VlbkF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByaWNpbmdTZXR0aW5ncyB7XG4gIHVzZFRvQ2xwOiBudW1iZXI7XG4gIGJybFRvQ2xwOiBudW1iZXI7XG4gIHRyeVRvQ2xwOiBudW1iZXI7XG4gIGpweVRvQ2xwOiBudW1iZXI7XG4gIC8qKiBGcmFjdGlvbiBvZiBmYWNlIHZhbHVlIHBhaWQgZm9yIFBTTiBiYWxhbmNlIChlLmcuIDAuODAgPSBidXkgJDEwIHNhbGRvIGZvciAkOCkuXG4gICAqICBQZXItY3VycmVuY3kuIFVzZSAxLjAgaWYgYnV5aW5nIGF0IGZ1bGwgcHJpY2UuICovXG4gIGJhbGFuY2VEaXNjb3VudFVzZDogbnVtYmVyO1xuICBiYWxhbmNlRGlzY291bnRCcmw6IG51bWJlcjtcbiAgYmFsYW5jZURpc2NvdW50VHJ5OiBudW1iZXI7XG4gIC8qKiBQcmljZSBtdWx0aXBsaWVyIGZvciBQcmltYXJpYSAoc29sZCBcdTAwRDcyIHBlciBwdXJjaGFzZSkuICovXG4gIHByaW1hcmlhTXVsdDogbnVtYmVyO1xuICAvKiogUHJpY2UgbXVsdGlwbGllciBmb3IgU2VjdW5kYXJpYSAoc29sZCBcdTAwRDcxIHBlciBwdXJjaGFzZSwgY2hlYXBlcikuICovXG4gIHNlY3VuZGFyaWFNdWx0OiBudW1iZXI7XG4gIHJvdW5kVG86IG51bWJlcjtcbiAgLyoqIFdoZW4gdHJ1ZSwgY29uc3VtZXItZmFjaW5nIHByaWNlcyAocHJpbWFyaWEvc2VjdW5kYXJpYSkgdXNlIFguOTkwIGVuZGluZ3MuICovXG4gIGNvbW1lcmNpYWxSb3VuZGluZzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdXBhYmFzZUNvbmZpZyB7XG4gIHVybDogc3RyaW5nO1xuICBzZXJ2aWNlS2V5OiBzdHJpbmc7XG4gIHRhYmxlTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBzbkNvbmZpZyB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBkZWFsc0NhdGVnb3J5SWQ6IHN0cmluZztcbiAgY2F0ZWdvcnlHcmlkSGFzaDogc3RyaW5nO1xuICAvKiogV2hlbiBmYWxzZSwgZmlsdGVyIG91dCBETEMsIGN1cnJlbmN5LCBhdmF0YXJzLCB0aGVtZXMsIHN1YnNjcmlwdGlvbnMuXG4gICAqICBEZWZhdWx0IGZhbHNlIFx1MjAxNCB3ZSBhbG1vc3QgYWx3YXlzIHdhbnQganVzdCB0aGUgcGxheWFibGUgZ2FtZXMuICovXG4gIGluY2x1ZGVBZGRPbnM6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBEYlNoYXBlIHtcbiAgZ2FtZXM6IFJlY29yZDxzdHJpbmcsIEdhbWU+O1xuICBzZXR0aW5nczogUHJpY2luZ1NldHRpbmdzO1xuICBwc246IFBzbkNvbmZpZztcbiAgc291cmNlczogUHJvdmlkZXJTb3VyY2VbXTtcbiAgY29tcGV0aXRvcnM6IENvbXBldGl0b3JDb25maWdbXTtcbiAgY29tcGV0aXRvclByb2R1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBDb21wZXRpdG9yUHJvZHVjdFtdPjtcbiAgY29tcGV0aXRvck1hdGNoZXM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPjtcbiAgY29tcGV0aXRvclJlZnJlc2hlZEF0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBwcm9kdWN0RGV0YWlsczogUmVjb3JkPHN0cmluZywgUHJvZHVjdERldGFpbD47XG4gIHdhdGNobGlzdDogUmVjb3JkPHN0cmluZywgV2F0Y2hlZEdhbWU+O1xuICAvKiogMCA9IGRpc2FibGVkLiBTdG9yZWQgc2VwYXJhdGVseSBzbyBpdCBzdXJ2aXZlcyBzZXR0aW5ncyByZXNldHMuICovXG4gIGF1dG9SZWZyZXNoSW50ZXJ2YWxIb3VyczogbnVtYmVyO1xuICAvKiogU2NyYXBlZCBQUyBQbHVzIHByaWNlcywgcGVyc2lzdGVkIHNvIHRoZXkgc3Vydml2ZSByZXN0YXJ0cy4gKi9cbiAgcHNQbHVzUHJpY2VzOiB7XG4gICAgcHJpY2VzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+Pj47XG4gICAgc2NyYXBlZEF0OiBzdHJpbmc7XG4gICAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgfSB8IG51bGw7XG4gIC8qKiBTdXBhYmFzZSBjb25uZWN0aW9uIGZvciBkaXJlY3QgcHVibGlzaGluZy4gKi9cbiAgc3VwYWJhc2U6IFN1cGFiYXNlQ29uZmlnIHwgbnVsbDtcbiAgLyoqIFB1Ymxpc2hlcnMgY29uc2lkZXJlZCBcImhpdFwiIHRpZXIgZm9yIGF1dG8tZmlsdGVyaW5nLiAqL1xuICBoaXRQdWJsaXNoZXJzOiBzdHJpbmdbXTtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogUHJpY2luZ1NldHRpbmdzID0ge1xuICB1c2RUb0NscDogODkwLFxuICBicmxUb0NscDogMTcwLFxuICB0cnlUb0NscDogMjgsXG4gIGpweVRvQ2xwOiA2LjUsXG4gIGJhbGFuY2VEaXNjb3VudFVzZDogMC44MCxcbiAgYmFsYW5jZURpc2NvdW50QnJsOiAxLjAsXG4gIGJhbGFuY2VEaXNjb3VudFRyeTogMS4wLFxuICBwcmltYXJpYU11bHQ6IDEuMjUsXG4gIHNlY3VuZGFyaWFNdWx0OiAwLjcwLFxuICByb3VuZFRvOiA1MDAsXG4gIGNvbW1lcmNpYWxSb3VuZGluZzogdHJ1ZSxcbn07XG5cbmNvbnN0IERFRkFVTFRfSElUX1BVQkxJU0hFUlM6IHN0cmluZ1tdID0gW1xuICBcIlNvbnkgSW50ZXJhY3RpdmUgRW50ZXJ0YWlubWVudFwiLCBcIkluc29tbmlhYyBHYW1lc1wiLCBcIk5hdWdodHkgRG9nXCIsXG4gIFwiU2FudGEgTW9uaWNhIFN0dWRpb1wiLCBcIkd1ZXJyaWxsYVwiLCBcIlN1Y2tlciBQdW5jaCBQcm9kdWN0aW9uc1wiLFxuICBcIlJvY2tzdGFyIEdhbWVzXCIsIFwiVWJpc29mdFwiLCBcIkVsZWN0cm9uaWMgQXJ0c1wiLCBcIkNhcGNvbVwiLFxuICBcIlNxdWFyZSBFbml4XCIsIFwiQmFuZGFpIE5hbWNvXCIsIFwiV2FybmVyIEJyb3NcIiwgXCJBY3RpdmlzaW9uXCIsXG4gIFwiQmV0aGVzZGFcIiwgXCJGcm9tU29mdHdhcmVcIiwgXCJLb25hbWlcIiwgXCJTRUdBXCIsIFwiMksgR2FtZXNcIixcbiAgXCJDRCBQcm9qZWt0IFJlZFwiLCBcIlJlbWVkeSBFbnRlcnRhaW5tZW50XCIsIFwiVGVhbSBOaW5qYVwiLFxuXTtcblxuY29uc3QgREVGQVVMVF9TT1VSQ0VTOiBQcm92aWRlclNvdXJjZVtdID0gW1xuICB7IHBsYXRmb3JtOiBcInBzblwiLCByZWdpb246IFwidXNcIiwgZW5hYmxlZDogdHJ1ZSwgY2F0ZWdvcnlJZDogXCJcIiB9LFxuICB7IHBsYXRmb3JtOiBcInBzblwiLCByZWdpb246IFwiYnJcIiwgZW5hYmxlZDogdHJ1ZSwgY2F0ZWdvcnlJZDogXCIzZjc3MjUwMS1mNmY4LTQ5YjctYWJhYy04NzRhODhjYTQ4OTdcIiB9LFxuICB7IHBsYXRmb3JtOiBcInhib3hcIiwgcmVnaW9uOiBcInVzXCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBwbGF0Zm9ybTogXCJ4Ym94XCIsIHJlZ2lvbjogXCJiclwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsgcGxhdGZvcm06IFwieGJveFwiLCByZWdpb246IFwidHJcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IHBsYXRmb3JtOiBcIm5pbnRlbmRvXCIsIHJlZ2lvbjogXCJ1c1wiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsgcGxhdGZvcm06IFwibmludGVuZG9cIiwgcmVnaW9uOiBcImpwXCIsIGVuYWJsZWQ6IGZhbHNlIH0sXG4gIHsgcGxhdGZvcm06IFwic3RlYW1cIiwgcmVnaW9uOiBcInVzXCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBwbGF0Zm9ybTogXCJzdGVhbVwiLCByZWdpb246IFwiYnJcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IHBsYXRmb3JtOiBcInN0ZWFtXCIsIHJlZ2lvbjogXCJ0clwiLCBlbmFibGVkOiB0cnVlIH0sXG5dO1xuXG5jb25zdCBERUZBVUxUX0NPTVBFVElUT1JTOiBDb21wZXRpdG9yQ29uZmlnW10gPSBbXG4gIHsga2V5OiBcImNqbVwiLCBsYWJlbDogXCJDSk0gRGlnaXRhbGVzXCIsIGRvbWFpbjogXCJjam1kaWdpdGFsZXMuY2xcIiwgdHlwZTogXCJzaG9waWZ5XCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBrZXk6IFwianVlZ29zZGlnaXRhbGVzY2hpbGVcIiwgbGFiZWw6IFwiSnVlZ29zIERpZ2l0YWxlcyBDaGlsZVwiLCBkb21haW46IFwianVlZ29zZGlnaXRhbGVzY2hpbGUuY29tXCIsIHR5cGU6IFwiaHRtbFwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsga2V5OiBcIm1qXCIsIGxhYmVsOiBcIk1KIERpZ2l0YWxlc1wiLCBkb21haW46IFwibWpkaWdpdGFsZXMuY2xcIiwgdHlwZTogXCJzaG9waWZ5XCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBrZXk6IFwiaW5maW5pdHlcIiwgbGFiZWw6IFwiSW5maW5pdHkgR2FtZXMgQ2hpbGVcIiwgZG9tYWluOiBcImluZmluaXR5Z2FtZXNjaGlsZS5jbFwiLCB0eXBlOiBcImh0bWxcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuXTtcblxuY29uc3QgREVGQVVMVF9QU046IFBzbkNvbmZpZyA9IHtcbiAgcmVnaW9uOiBcImVuLVVTXCIsXG4gIC8vIFBsYWNlaG9sZGVyIElEcyBcdTIwMTQgdGhlIHVzZXIgY29uZmlndXJlcyB0aGUgcmVhbCBvbmVzIGZyb20gRGV2VG9vbHMuXG4gIC8vIFBhbmVsID4gQWp1c3RlcyBleHBvbmUgYW1ib3MuXG4gIGRlYWxzQ2F0ZWdvcnlJZDogXCIzZjc3MjUwMS1mNmY4LTQ5YjctYWJhYy04NzRhODhjYTQ4OTdcIixcbiAgLy8gVW51c2VkIGJ5IHRoZSBIVE1MIHNjcmFwZXIuIEtlcHQgZm9yIHJlZmVyZW5jZSBpbiBjYXNlIHdlIGV2ZXIgYWRkIGFcbiAgLy8gR3JhcGhRTCBmYWxsYmFjay4gQ3VycmVudCB2YWx1ZSBjYXB0dXJlZCBmcm9tIERldlRvb2xzIG9uIDIwMjYtMDQtMTMuXG4gIGNhdGVnb3J5R3JpZEhhc2g6XG4gICAgXCIyNTc3MTM0NjZmYzMyNjQ4NTBhYTQ3MzQwOWEyOTA4OGUzYTQxMTVlNmU2OWU5ZmIzZTA2MWM4ZGQ1YjlmNWM2XCIsXG4gIGluY2x1ZGVBZGRPbnM6IGZhbHNlLFxufTtcblxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5jb25zdCBEQVRBX0ZJTEUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uL2RhdGEvYXBpcHNuLmpzb25cIik7XG5jb25zdCBUTVBfRklMRSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vZGF0YS9hcGlwc24uanNvbi50bXBcIik7XG5jb25zdCBCQUNLVVBfRklMRSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vZGF0YS9hcGlwc24uYmFja3VwLmpzb25cIik7XG5cbi8qKiBTaW1wbGUgd3JpdGUtbG9jazogcHJldmVudHMgb3ZlcmxhcHBpbmcgd3JpdGVzLiAqL1xubGV0IHdyaXRpbmcgPSBmYWxzZTtcbmxldCBwZW5kaW5nV3JpdGUgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlRGlyKCkge1xuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoREFUQV9GSUxFKTtcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xufVxuXG5mdW5jdGlvbiBtaWdyYXRlR2FtZXMoZ2FtZXM6IFJlY29yZDxzdHJpbmcsIEdhbWU+KTogUmVjb3JkPHN0cmluZywgR2FtZT4ge1xuICBjb25zdCBtaWdyYXRlZDogUmVjb3JkPHN0cmluZywgR2FtZT4gPSB7fTtcbiAgZm9yIChjb25zdCBba2V5LCBnXSBvZiBPYmplY3QuZW50cmllcyhnYW1lcykpIHtcbiAgICBpZiAodHlwZW9mIGcueW91dHViZVVybCAhPT0gXCJzdHJpbmdcIikgZy55b3V0dWJlVXJsID0gXCJcIjtcbiAgICBpZiAoIWcucGxhdGZvcm0pIGcucGxhdGZvcm0gPSBcInBzblwiO1xuICAgIGlmICghZy5yZWdpb24pIGcucmVnaW9uID0gXCJ1c1wiO1xuICAgIGlmICghZy5jdXJyZW5jeSkgZy5jdXJyZW5jeSA9IFwiVVNEXCI7XG4gICAgLy8gUmUta2V5IG9sZCBQU04gZW50cmllcyB0byBjb21wb3NpdGUga2V5XG4gICAgY29uc3QgY29tcG9zaXRlS2V5ID0gYCR7Zy5wbGF0Zm9ybX06JHtnLnJlZ2lvbn06JHtnLmlkfWA7XG4gICAgaWYgKGtleSA9PT0gZy5pZCAmJiBrZXkgIT09IGNvbXBvc2l0ZUtleSkge1xuICAgICAgbWlncmF0ZWRbY29tcG9zaXRlS2V5XSA9IGc7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1pZ3JhdGVkW2tleV0gPSBnO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWlncmF0ZWQ7XG59XG5cbmZ1bmN0aW9uIG1pZ3JhdGVTb3VyY2VzKFxuICBzb3VyY2VzOiBQcm92aWRlclNvdXJjZVtdIHwgdW5kZWZpbmVkLFxuICBwc246IFBzbkNvbmZpZ1xuKTogUHJvdmlkZXJTb3VyY2VbXSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gc291cmNlcyAmJiBzb3VyY2VzLmxlbmd0aCA+IDAgPyBbLi4uc291cmNlc10gOiBbXTtcbiAgY29uc3QgZXhpc3RpbmdLZXlzID0gbmV3IFNldChleGlzdGluZy5tYXAoKHMpID0+IGAke3MucGxhdGZvcm19OiR7cy5yZWdpb259YCkpO1xuXG4gIC8vIEFsd2F5cyBtZXJnZSBtaXNzaW5nIHNvdXJjZXMgZnJvbSBkZWZhdWx0c1xuICBmb3IgKGNvbnN0IGRlZiBvZiBERUZBVUxUX1NPVVJDRVMpIHtcbiAgICBjb25zdCBrZXkgPSBgJHtkZWYucGxhdGZvcm19OiR7ZGVmLnJlZ2lvbn1gO1xuICAgIGlmICghZXhpc3RpbmdLZXlzLmhhcyhrZXkpKSB7XG4gICAgICBleGlzdGluZy5wdXNoKHsgLi4uZGVmIH0pO1xuICAgIH0gZWxzZSBpZiAoZGVmLmVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IHNyYyA9IGV4aXN0aW5nLmZpbmQoKHMpID0+IHMucGxhdGZvcm0gPT09IGRlZi5wbGF0Zm9ybSAmJiBzLnJlZ2lvbiA9PT0gZGVmLnJlZ2lvbik7XG4gICAgICBpZiAoc3JjICYmICFzcmMuZW5hYmxlZCkgc3JjLmVuYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhcnJ5IG92ZXIgZXhpc3RpbmcgUFNOIGNhdGVnb3J5IElEIGlmIHNvdXJjZXMgd2VyZSBlbXB0eVxuICBpZiAoKCFzb3VyY2VzIHx8IHNvdXJjZXMubGVuZ3RoID09PSAwKSAmJiBwc24uZGVhbHNDYXRlZ29yeUlkKSB7XG4gICAgY29uc3QgcHNuVXMgPSBleGlzdGluZy5maW5kKChzKSA9PiBzLnBsYXRmb3JtID09PSBcInBzblwiICYmIHMucmVnaW9uID09PSBcInVzXCIpO1xuICAgIGlmIChwc25VcyAmJiAhcHNuVXMuY2F0ZWdvcnlJZCkge1xuICAgICAgcHNuVXMuY2F0ZWdvcnlJZCA9IHBzbi5kZWFsc0NhdGVnb3J5SWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGV4aXN0aW5nO1xufVxuXG5mdW5jdGlvbiBidWlsZERiKHBhcnNlZDogUGFydGlhbDxEYlNoYXBlPik6IERiU2hhcGUge1xuICBjb25zdCBwc24gPSB7IC4uLkRFRkFVTFRfUFNOLCAuLi4ocGFyc2VkLnBzbiA/PyB7fSkgfTtcbiAgY29uc3QgZ2FtZXMgPSBtaWdyYXRlR2FtZXMocGFyc2VkLmdhbWVzID8/IHt9KTtcbiAgcmV0dXJuIHtcbiAgICBnYW1lcyxcbiAgICBzZXR0aW5nczogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLCAuLi4ocGFyc2VkLnNldHRpbmdzID8/IHt9KSB9LFxuICAgIHBzbixcbiAgICBzb3VyY2VzOiBtaWdyYXRlU291cmNlcyhwYXJzZWQuc291cmNlcywgcHNuKSxcbiAgICBjb21wZXRpdG9yczogcGFyc2VkLmNvbXBldGl0b3JzID8/IFsuLi5ERUZBVUxUX0NPTVBFVElUT1JTXSxcbiAgICBjb21wZXRpdG9yUHJvZHVjdHM6IHBhcnNlZC5jb21wZXRpdG9yUHJvZHVjdHMgPz8ge30sXG4gICAgY29tcGV0aXRvck1hdGNoZXM6IHBhcnNlZC5jb21wZXRpdG9yTWF0Y2hlcyA/PyB7fSxcbiAgICBjb21wZXRpdG9yUmVmcmVzaGVkQXQ6IHBhcnNlZC5jb21wZXRpdG9yUmVmcmVzaGVkQXQgPz8ge30sXG4gICAgcHJvZHVjdERldGFpbHM6IHBhcnNlZC5wcm9kdWN0RGV0YWlscyA/PyB7fSxcbiAgICB3YXRjaGxpc3Q6IHBhcnNlZC53YXRjaGxpc3QgPz8ge30sXG4gICAgYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzOiBwYXJzZWQuYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzID8/IDAsXG4gICAgcHNQbHVzUHJpY2VzOiBwYXJzZWQucHNQbHVzUHJpY2VzID8/IG51bGwsXG4gICAgc3VwYWJhc2U6IHBhcnNlZC5zdXBhYmFzZSA/PyBudWxsLFxuICAgIGhpdFB1Ymxpc2hlcnM6IHBhcnNlZC5oaXRQdWJsaXNoZXJzID8/IFsuLi5ERUZBVUxUX0hJVF9QVUJMSVNIRVJTXSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZW1wdHlEYigpOiBEYlNoYXBlIHtcbiAgcmV0dXJuIHtcbiAgICBnYW1lczoge30sXG4gICAgc2V0dGluZ3M6IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9LFxuICAgIHBzbjogeyAuLi5ERUZBVUxUX1BTTiB9LFxuICAgIHNvdXJjZXM6IFsuLi5ERUZBVUxUX1NPVVJDRVNdLFxuICAgIGNvbXBldGl0b3JzOiBbLi4uREVGQVVMVF9DT01QRVRJVE9SU10sXG4gICAgY29tcGV0aXRvclByb2R1Y3RzOiB7fSxcbiAgICBjb21wZXRpdG9yTWF0Y2hlczoge30sXG4gICAgY29tcGV0aXRvclJlZnJlc2hlZEF0OiB7fSxcbiAgICBwcm9kdWN0RGV0YWlsczoge30sXG4gICAgd2F0Y2hsaXN0OiB7fSxcbiAgICBhdXRvUmVmcmVzaEludGVydmFsSG91cnM6IDAsXG4gICAgcHNQbHVzUHJpY2VzOiBudWxsLFxuICAgIHN1cGFiYXNlOiBudWxsLFxuICAgIGhpdFB1Ymxpc2hlcnM6IFsuLi5ERUZBVUxUX0hJVF9QVUJMSVNIRVJTXSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbG9hZCgpOiBEYlNoYXBlIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByYXcgPSBmcy5yZWFkRmlsZVN5bmMoREFUQV9GSUxFLCBcInV0Zi04XCIpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdykgYXMgUGFydGlhbDxEYlNoYXBlPjtcbiAgICAgIHJldHVybiBidWlsZERiKHBhcnNlZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBNYWluIGZpbGUgaXMgY29ycnVwdGVkIFx1MjAxNCB0cnkgYmFja3VwXG4gICAgICBjb25zb2xlLndhcm4oXCJbc3RvcmVdIE1haW4gZGF0YSBmaWxlIGNvcnJ1cHRlZCwgbG9hZGluZyBiYWNrdXBcIik7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBiYWNrdXBSYXcgPSBmcy5yZWFkRmlsZVN5bmMoQkFDS1VQX0ZJTEUsIFwidXRmLThcIik7XG4gICAgICAgIGNvbnN0IGJhY2t1cFBhcnNlZCA9IEpTT04ucGFyc2UoYmFja3VwUmF3KSBhcyBQYXJ0aWFsPERiU2hhcGU+O1xuICAgICAgICByZXR1cm4gYnVpbGREYihiYWNrdXBQYXJzZWQpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBlbXB0eURiKCk7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZW1wdHlEYigpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlQmFja3VwKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhEQVRBX0ZJTEUpO1xuICAgIGNvbnN0IGFnZU1zID0gRGF0ZS5ub3coKSAtIHN0YXQubXRpbWVNcztcbiAgICBpZiAoYWdlTXMgPiA2MCAqIDYwICogMTAwMCkge1xuICAgICAgZnMuY29weUZpbGVTeW5jKERBVEFfRklMRSwgQkFDS1VQX0ZJTEUpO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gRmlsZSBtYXkgbm90IGV4aXN0IHlldCBcdTIwMTQgbm90aGluZyB0byBiYWNrIHVwLlxuICB9XG59XG5cbmZ1bmN0aW9uIHBlcnNpc3QoKSB7XG4gIGlmICh3cml0aW5nKSB7XG4gICAgcGVuZGluZ1dyaXRlID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgd3JpdGluZyA9IHRydWU7XG4gIHRyeSB7XG4gICAgZW5zdXJlRGlyKCk7XG4gICAgbWF5YmVCYWNrdXAoKTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKFRNUF9GSUxFLCBKU09OLnN0cmluZ2lmeShkYiwgbnVsbCwgMikpO1xuICAgIGZzLnJlbmFtZVN5bmMoVE1QX0ZJTEUsIERBVEFfRklMRSk7XG4gIH0gZmluYWxseSB7XG4gICAgd3JpdGluZyA9IGZhbHNlO1xuICAgIGlmIChwZW5kaW5nV3JpdGUpIHtcbiAgICAgIHBlbmRpbmdXcml0ZSA9IGZhbHNlO1xuICAgICAgcGVyc2lzdCgpO1xuICAgIH1cbiAgfVxufVxuXG5sZXQgZGI6IERiU2hhcGUgPSBsb2FkKCk7XG5sZXQgc2F2ZVRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuXG4vLyBQZXJzaXN0IG1pZ3JhdGVkIGRhdGEgb24gZmlyc3QgbG9hZCBzbyBuZXcgc291cmNlcy9maWVsZHMgYXJlIHNhdmVkXG50cnkgeyBwZXJzaXN0KCk7IH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxuXG5mdW5jdGlvbiBzY2hlZHVsZVNhdmUoKSB7XG4gIGlmIChzYXZlVGltZXIpIGNsZWFyVGltZW91dChzYXZlVGltZXIpO1xuICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0KHBlcnNpc3QsIDE1MCk7XG59XG5cbmZ1bmN0aW9uIGdhbWVLZXkocGxhdGZvcm06IFBsYXRmb3JtLCByZWdpb246IHN0cmluZywgaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwbGF0Zm9ybX06JHtyZWdpb259OiR7aWR9YDtcbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0ge1xuICBsaXN0R2FtZXMoKTogR2FtZVtdIHtcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhkYi5nYW1lcyk7XG4gIH0sXG4gIGdldEdhbWUoaWQ6IHN0cmluZyk6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5nYW1lc1tpZF07XG4gIH0sXG4gIGdldEdhbWVCeUNvbXBvc2l0ZShwbGF0Zm9ybTogUGxhdGZvcm0sIHJlZ2lvbjogc3RyaW5nLCBpZDogc3RyaW5nKTogR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGRiLmdhbWVzW2dhbWVLZXkocGxhdGZvcm0sIHJlZ2lvbiwgaWQpXTtcbiAgfSxcbiAgdXBzZXJ0R2FtZShnYW1lOiBHYW1lKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ID0gZ2FtZUtleShnYW1lLnBsYXRmb3JtLCBnYW1lLnJlZ2lvbiwgZ2FtZS5pZCk7XG4gICAgZGIuZ2FtZXNba2V5XSA9IGdhbWU7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gIH0sXG4gIHBhdGNoR2FtZShpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxHYW1lPik6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZGIuZ2FtZXNbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogR2FtZSA9IHsgLi4uZXhpc3RpbmcsIC4uLnBhdGNoLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9O1xuICAgIGRiLmdhbWVzW2lkXSA9IHVwZGF0ZWQ7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHVwZGF0ZWQ7XG4gIH0sXG4gIG1hcmtJbmFjdGl2ZUlmTWlzc2luZyhzZWVuS2V5czogU2V0PHN0cmluZz4sIHBsYXRmb3JtPzogUGxhdGZvcm0sIHJlZ2lvbj86IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGddIG9mIE9iamVjdC5lbnRyaWVzKGRiLmdhbWVzKSkge1xuICAgICAgaWYgKCFnLmFjdGl2ZSkgY29udGludWU7XG4gICAgICBpZiAocGxhdGZvcm0gJiYgZy5wbGF0Zm9ybSAhPT0gcGxhdGZvcm0pIGNvbnRpbnVlO1xuICAgICAgaWYgKHJlZ2lvbiAmJiBnLnJlZ2lvbiAhPT0gcmVnaW9uKSBjb250aW51ZTtcbiAgICAgIGlmICghc2VlbktleXMuaGFzKGtleSkpIHtcbiAgICAgICAgZy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgZy51cGRhdGVkQXQgPSBub3c7XG4gICAgICAgIG4rKztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG4gPiAwKSBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gbjtcbiAgfSxcbiAgZ2V0U2V0dGluZ3MoKTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICByZXR1cm4geyAuLi5kYi5zZXR0aW5ncyB9O1xuICB9LFxuICB1cGRhdGVTZXR0aW5ncyhwYXRjaDogUGFydGlhbDxQcmljaW5nU2V0dGluZ3M+KTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICBkYi5zZXR0aW5ncyA9IHsgLi4uZGIuc2V0dGluZ3MsIC4uLnBhdGNoIH07XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHsgLi4uZGIuc2V0dGluZ3MgfTtcbiAgfSxcbiAgZ2V0UHNuKCk6IFBzbkNvbmZpZyB7XG4gICAgcmV0dXJuIHsgLi4uZGIucHNuIH07XG4gIH0sXG4gIHVwZGF0ZVBzbihwYXRjaDogUGFydGlhbDxQc25Db25maWc+KTogUHNuQ29uZmlnIHtcbiAgICBkYi5wc24gPSB7IC4uLmRiLnBzbiwgLi4ucGF0Y2ggfTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4geyAuLi5kYi5wc24gfTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvcnMoKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvcnMobGlzdDogQ29tcGV0aXRvckNvbmZpZ1tdKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICBkYi5jb21wZXRpdG9ycyA9IGxpc3QubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvclByb2R1Y3RzKGtleTogc3RyaW5nLCBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSwgcmVmcmVzaGVkQXQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JQcm9kdWN0c1trZXldID0gcHJvZHVjdHM7XG4gICAgZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0W2tleV0gPSByZWZyZXNoZWRBdDtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGVuYWJsZWRPbmx5ID0gdHJ1ZSk6IENvbXBldGl0b3JQcm9kdWN0W10ge1xuICAgIGNvbnN0IGVuYWJsZWQgPSBuZXcgU2V0KFxuICAgICAgZGIuY29tcGV0aXRvcnMuZmlsdGVyKChjKSA9PiAhZW5hYmxlZE9ubHkgfHwgYy5lbmFibGVkKS5tYXAoKGMpID0+IGMua2V5KVxuICAgICk7XG4gICAgY29uc3Qgb3V0OiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCBsaXN0XSBvZiBPYmplY3QuZW50cmllcyhkYi5jb21wZXRpdG9yUHJvZHVjdHMpKSB7XG4gICAgICBpZiAoIWVuYWJsZWQuaGFzKGtleSkpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBwIG9mIGxpc3QpIG91dC5wdXNoKHApO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9LFxuICBnZXRDb21wZXRpdG9yUmVmcmVzaGVkQXQoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gICAgcmV0dXJuIHsgLi4uZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0IH07XG4gIH0sXG4gIHNldENvbXBldGl0b3JNYXRjaGVzKG1hdGNoZXM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPik6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JNYXRjaGVzID0gbWF0Y2hlcztcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvck1hdGNoZXMoZ2FtZUlkOiBzdHJpbmcpOiBDb21wZXRpdG9yTWF0Y2hbXSB7XG4gICAgcmV0dXJuIGRiLmNvbXBldGl0b3JNYXRjaGVzW2dhbWVJZF0gPz8gW107XG4gIH0sXG4gIGdldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZyk6IFByb2R1Y3REZXRhaWwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5wcm9kdWN0RGV0YWlsc1tpZF07XG4gIH0sXG4gIHNldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZywgZGV0YWlsOiBQcm9kdWN0RGV0YWlsKTogdm9pZCB7XG4gICAgZGIucHJvZHVjdERldGFpbHNbaWRdID0gZGV0YWlsO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICB9LFxuICBsaXN0V2F0Y2hsaXN0KCk6IFdhdGNoZWRHYW1lW10ge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKGRiLndhdGNobGlzdCk7XG4gIH0sXG4gIGdldFdhdGNoZWQoaWQ6IHN0cmluZyk6IFdhdGNoZWRHYW1lIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gZGIud2F0Y2hsaXN0W2lkXTtcbiAgfSxcbiAgdXBzZXJ0V2F0Y2hlZChlbnRyeTogV2F0Y2hlZEdhbWUpOiBXYXRjaGVkR2FtZSB7XG4gICAgZGIud2F0Y2hsaXN0W2VudHJ5LmlkXSA9IGVudHJ5O1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB7IC4uLmVudHJ5IH07XG4gIH0sXG4gIHBhdGNoV2F0Y2hlZChpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxXYXRjaGVkR2FtZT4pOiBXYXRjaGVkR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBkYi53YXRjaGxpc3RbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogV2F0Y2hlZEdhbWUgPSB7IC4uLmV4aXN0aW5nLCAuLi5wYXRjaCB9O1xuICAgIGRiLndhdGNobGlzdFtpZF0gPSB1cGRhdGVkO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB1cGRhdGVkO1xuICB9LFxuICByZW1vdmVXYXRjaGVkKGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWRiLndhdGNobGlzdFtpZF0pIHJldHVybiBmYWxzZTtcbiAgICBkZWxldGUgZGIud2F0Y2hsaXN0W2lkXTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgZ2V0U291cmNlcygpOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICByZXR1cm4gZGIuc291cmNlcy5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICB9LFxuICBzZXRTb3VyY2VzKGxpc3Q6IFByb3ZpZGVyU291cmNlW10pOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICBkYi5zb3VyY2VzID0gbGlzdC5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiBkYi5zb3VyY2VzLm1hcCgocykgPT4gKHsgLi4ucyB9KSk7XG4gIH0sXG4gIGdldEF1dG9SZWZyZXNoSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gZGIuYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzID8/IDA7XG4gIH0sXG4gIHNldEF1dG9SZWZyZXNoSW50ZXJ2YWwoaG91cnM6IG51bWJlcik6IHZvaWQge1xuICAgIGRiLmF1dG9SZWZyZXNoSW50ZXJ2YWxIb3VycyA9IE1hdGgubWF4KDAsIGhvdXJzKTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0UHNQbHVzUHJpY2VzKCk6IERiU2hhcGVbXCJwc1BsdXNQcmljZXNcIl0ge1xuICAgIHJldHVybiBkYi5wc1BsdXNQcmljZXM7XG4gIH0sXG4gIHNldFBzUGx1c1ByaWNlcyhkYXRhOiBEYlNoYXBlW1wicHNQbHVzUHJpY2VzXCJdKTogdm9pZCB7XG4gICAgZGIucHNQbHVzUHJpY2VzID0gZGF0YTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0U3VwYWJhc2UoKTogU3VwYWJhc2VDb25maWcgfCBudWxsIHtcbiAgICByZXR1cm4gZGIuc3VwYWJhc2UgPyB7IC4uLmRiLnN1cGFiYXNlIH0gOiBudWxsO1xuICB9LFxuICBzZXRTdXBhYmFzZShjZmc6IFN1cGFiYXNlQ29uZmlnIHwgbnVsbCk6IHZvaWQge1xuICAgIGRiLnN1cGFiYXNlID0gY2ZnID8geyAuLi5jZmcgfSA6IG51bGw7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gIH0sXG4gIGdldEhpdFB1Ymxpc2hlcnMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBbLi4uZGIuaGl0UHVibGlzaGVyc107XG4gIH0sXG4gIHNldEhpdFB1Ymxpc2hlcnMobGlzdDogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBkYi5oaXRQdWJsaXNoZXJzID0gWy4uLmxpc3RdO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICB9LFxuICBmbHVzaCgpOiB2b2lkIHtcbiAgICBpZiAoc2F2ZVRpbWVyKSBjbGVhclRpbWVvdXQoc2F2ZVRpbWVyKTtcbiAgICBwZXJzaXN0KCk7XG4gIH0sXG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJpY2luZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcmljaW5nLnRzXCI7aW1wb3J0IHR5cGUgeyBQcmljaW5nU2V0dGluZ3MgfSBmcm9tIFwiLi9zdG9yZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNhbGVQcmljZXMge1xuICBjb3N0Q2xwOiBudW1iZXI7XG4gIHByaW1hcmlhOiBudW1iZXI7XG4gIHNlY3VuZGFyaWE6IG51bWJlcjtcbiAgLyoqIFJldmVudWUgaWYgYm90aCBwcmltYXJpYSBzbG90cyBzZWxsICsgMSBzZWN1bmRhcmlhICovXG4gIHRvdGFsUmV2ZW51ZTogbnVtYmVyO1xuICAvKiogTmV0IHByb2ZpdCBmcm9tIGEgZnVsbCBzZWxsLXRocm91Z2ggKDJcdTAwRDcgcHJpbWFyaWEgKyAxXHUwMEQ3IHNlY3VuZGFyaWEpICovXG4gIG5ldFByb2ZpdDogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiByb3VuZFRvKHZhbHVlOiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7XG4gIGlmIChzdGVwIDw9IDApIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlKTtcbiAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgLyBzdGVwKSAqIHN0ZXA7XG59XG5cbi8qKiBQc3ljaG9sb2dpY2FsIHByaWNpbmc6IHJvdW5kcyB0byBuZWFyZXN0IFguOTkwIGZvciBjb25zdW1lci1mYWNpbmcgcHJpY2VzLlxuICogIGUuZy4gMTQyNDAgXHUyMTkyIDE0OTkwLCA4ODAwIFx1MjE5MiA4OTkwLCAzMjAwIFx1MjE5MiAyOTkwICovXG5mdW5jdGlvbiByb3VuZENvbW1lcmNpYWwodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICh2YWx1ZSA8IDEwMDApIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlIC8gMTAwKSAqIDEwMDtcbiAgcmV0dXJuIE1hdGguY2VpbCh2YWx1ZSAvIDEwMDApICogMTAwMCAtIDEwO1xufVxuXG5mdW5jdGlvbiBleGNoYW5nZVJhdGUoY3VycmVuY3k6IHN0cmluZywgY2ZnOiBQcmljaW5nU2V0dGluZ3MpOiBudW1iZXIge1xuICBzd2l0Y2ggKGN1cnJlbmN5KSB7XG4gICAgY2FzZSBcIkJSTFwiOiByZXR1cm4gY2ZnLmJybFRvQ2xwO1xuICAgIGNhc2UgXCJUUllcIjogcmV0dXJuIGNmZy50cnlUb0NscDtcbiAgICBjYXNlIFwiSlBZXCI6IHJldHVybiBjZmcuanB5VG9DbHA7XG4gICAgY2FzZSBcIlVTRFwiOlxuICAgIGRlZmF1bHQ6ICAgIHJldHVybiBjZmcudXNkVG9DbHA7XG4gIH1cbn1cblxuZnVuY3Rpb24gYmFsYW5jZURpc2NvdW50KGN1cnJlbmN5OiBzdHJpbmcsIGNmZzogUHJpY2luZ1NldHRpbmdzKTogbnVtYmVyIHtcbiAgc3dpdGNoIChjdXJyZW5jeSkge1xuICAgIGNhc2UgXCJCUkxcIjogcmV0dXJuIGNmZy5iYWxhbmNlRGlzY291bnRCcmwgPz8gMS4wO1xuICAgIGNhc2UgXCJUUllcIjogcmV0dXJuIGNmZy5iYWxhbmNlRGlzY291bnRUcnkgPz8gMS4wO1xuICAgIGNhc2UgXCJVU0RcIjpcbiAgICBkZWZhdWx0OiAgICByZXR1cm4gY2ZnLmJhbGFuY2VEaXNjb3VudFVzZCA/PyAxLjA7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVTYWxlUHJpY2VzKFxuICBwcmljZUNlbnRzOiBudW1iZXIgfCBudWxsLFxuICBjZmc6IFByaWNpbmdTZXR0aW5ncyxcbiAgY3VycmVuY3kgPSBcIlVTRFwiXG4pOiBTYWxlUHJpY2VzIHwgbnVsbCB7XG4gIGlmIChwcmljZUNlbnRzID09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBwcmljZSA9IHByaWNlQ2VudHMgLyAxMDA7XG4gIGNvbnN0IHJhdGUgPSBleGNoYW5nZVJhdGUoY3VycmVuY3ksIGNmZyk7XG4gIGNvbnN0IGRpc2NvdW50ID0gYmFsYW5jZURpc2NvdW50KGN1cnJlbmN5LCBjZmcpO1xuICBjb25zdCBjb3N0ID0gcHJpY2UgKiBkaXNjb3VudCAqIHJhdGU7XG4gIGNvbnN0IGNvc3RDbHAgPSByb3VuZFRvKGNvc3QsIGNmZy5yb3VuZFRvKTtcblxuICBjb25zdCBwcmltYXJpYVJhdyA9IGNvc3QgKiBjZmcucHJpbWFyaWFNdWx0O1xuICBjb25zdCBzZWN1bmRhcmlhUmF3ID0gY29zdCAqIGNmZy5zZWN1bmRhcmlhTXVsdDtcblxuICBjb25zdCBwcmltYXJpYSA9IGNmZy5jb21tZXJjaWFsUm91bmRpbmcgIT09IGZhbHNlXG4gICAgPyByb3VuZENvbW1lcmNpYWwocHJpbWFyaWFSYXcpXG4gICAgOiByb3VuZFRvKHByaW1hcmlhUmF3LCBjZmcucm91bmRUbyk7XG4gIGNvbnN0IHNlY3VuZGFyaWEgPSBjZmcuY29tbWVyY2lhbFJvdW5kaW5nICE9PSBmYWxzZVxuICAgID8gcm91bmRDb21tZXJjaWFsKHNlY3VuZGFyaWFSYXcpXG4gICAgOiByb3VuZFRvKHNlY3VuZGFyaWFSYXcsIGNmZy5yb3VuZFRvKTtcblxuICBjb25zdCB0b3RhbFJldmVudWUgPSBwcmltYXJpYSAqIDIgKyBzZWN1bmRhcmlhO1xuICByZXR1cm4ge1xuICAgIGNvc3RDbHAsXG4gICAgcHJpbWFyaWEsXG4gICAgc2VjdW5kYXJpYSxcbiAgICB0b3RhbFJldmVudWUsXG4gICAgbmV0UHJvZml0OiB0b3RhbFJldmVudWUgLSBjb3N0Q2xwLFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHNuLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi50c1wiOy8qKlxuICogUFNOIFN0b3JlIHNjcmFwZXIuXG4gKlxuICogUFNOIG5vdyBzZXJ2ZXItc2lkZS1yZW5kZXJzIHRoZSBjYXRlZ29yeSBwYWdlcyAoTmV4dC5qcykuIFRoZSBwcm9kdWN0IGdyaWRcbiAqIGlzIGVtYmVkZGVkIGFzIEpTT04gaW5zaWRlIGEgYDxzY3JpcHQgaWQ9XCJfX05FWFRfREFUQV9fXCI+YCB0YWcgXHUyMDE0IHdlIGZldGNoXG4gKiB0aGUgSFRNTCBhbmQgcGFyc2UgdGhhdCBibG9iIGluc3RlYWQgb2YgaGl0dGluZyB0aGUgR3JhcGhRTCBlbmRwb2ludCB3aXRoXG4gKiBwZXJzaXN0ZWQgcXVlcmllcy4gTm8gc2hhMjU2IGhhc2hlcyB0byBrZWVwIHVwIHRvIGRhdGUuXG4gKlxuICogICBHRVQgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vPHJlZ2lvbj4vY2F0ZWdvcnkvPGNhdGVnb3J5SWQ+LzxwYWdlPlxuICpcbiAqIFdlIHBhZ2luYXRlIGJ5IHdhbGtpbmcgLzEsIC8yLCAvMyB1bnRpbCBhIHBhZ2UgcmV0dXJucyBubyBuZXcgcHJvZHVjdHMuXG4gKi9cbmltcG9ydCB0eXBlIHsgR2FtZSwgUHNuQ29uZmlnIH0gZnJvbSBcIi4vc3RvcmVcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuLyoqIEtlcHQgZm9yIEFQSSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIG9sZCBjbGllbnQ7IG5vIGxvbmdlciB0aHJvd24uICovXG5leHBvcnQgY2xhc3MgUGVyc2lzdGVkUXVlcnlOb3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIlBTTiBwZXJzaXN0ZWQgcXVlcnkgaGFzaCBpcyBzdGFsZS5cIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBzbkFwaUVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuLyoqIEVudW0gdmFsdWVzIFBTTiB1c2VzIGZvciByZWFsIGdhbWVzIChub3QgRExDIC8gY3VycmVuY3kgLyB0aGVtZXMgL1xuICogIGF2YXRhcnMgLyBzdWJzY3JpcHRpb25zKS4gYHN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uYCBpcyB0aGUgc3RhYmxlXG4gKiAgbm9uLWxvY2FsaXplZCBmaWVsZDsgd2UgYWxzbyBhY2NlcHQgdGhlIGh1bWFuIHN0cmluZ3MgYXMgZmFsbGJhY2suXG4gKiAgQ29uZmlybWVkIGFnYWluc3QgbGl2ZSBlbi1VUyBjYXRhbG9nIG9uIDIwMjYtMDQtMTMuICovXG5jb25zdCBHQU1FX0VOVU0gPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZVTExfR0FNRVwiLFxuICBcIkdBTUVfQlVORExFXCIsXG4gIFwiUFJFTUlVTV9FRElUSU9OXCIsXG4gIFwiQlVORExFXCIsXG5dKTtcblxuY29uc3QgR0FNRV9MQUJFTFMgPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZ1bGwgR2FtZVwiLFxuICBcIkdhbWUgQnVuZGxlXCIsXG4gIFwiUHJlbWl1bSBFZGl0aW9uXCIsXG4gIFwiQnVuZGxlXCIsXG5dKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVsbEdhbWVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCk6IGJvb2xlYW4ge1xuICBjb25zdCBlID0gU3RyaW5nKHJhdy5zdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbiB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICBpZiAoZSAmJiBHQU1FX0VOVU0uaGFzKGUpKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgbCA9IFN0cmluZyhyYXcubG9jYWxpemVkU3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHwgXCJcIikudHJpbSgpO1xuICByZXR1cm4gR0FNRV9MQUJFTFMuaGFzKGwpO1xufVxuXG5mdW5jdGlvbiBwcmljZVRvQ2VudHModjogdW5rbm93bik6IG51bWJlciB8IG51bGwge1xuICBpZiAodiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcyA9IFN0cmluZyh2KS50cmltKCk7XG4gIGlmICghcyB8fCAvXmZyZWUkL2kudGVzdChzKSB8fCAvXmdyYXRpcyQvaS50ZXN0KHMpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2xlYW5lZCA9IHMucmVwbGFjZSgvW14wLTkuLC1dL2csIFwiXCIpLnJlcGxhY2UoLywvZywgXCIuXCIpO1xuICBjb25zdCBwYXJ0cyA9IGNsZWFuZWQuc3BsaXQoXCIuXCIpO1xuICBjb25zdCBub3JtID1cbiAgICBwYXJ0cy5sZW5ndGggPiAyID8gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4oXCJcIikgKyBcIi5cIiArIHBhcnRzLmF0KC0xKSA6IGNsZWFuZWQ7XG4gIGNvbnN0IG4gPSBOdW1iZXIobm9ybSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIE1hdGgucm91bmQobiAqIDEwMCk7XG59XG5cbmludGVyZmFjZSBSYXdQcm9kdWN0IHtcbiAgaWQ/OiBzdHJpbmc7XG4gIHByb2R1Y3RJZD86IHN0cmluZztcbiAgY29uY2VwdElkPzogc3RyaW5nO1xuICBuYW1lPzogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbiAgcGxhdGZvcm1zPzogc3RyaW5nW10gfCBzdHJpbmc7XG4gIC8qKiBQU04gY2xhc3NpZmllcyBpdGVtcyBoZXJlOiBcIkZ1bGwgR2FtZVwiLCBcIkFkZC1PblwiLCBcIkdhbWUgQnVuZGxlXCIsXG4gICAqICBcIkN1cnJlbmN5XCIsIFwiQXZhdGFyXCIsIFwiVGhlbWVcIiwgXCJQUyBQbHVzIFx1MDBCNyBGdWxsIEdhbWVcIiwgZXRjLiAqL1xuICBsb2NhbGl6ZWRTdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcbiAgc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24/OiBzdHJpbmc7XG4gIC8qKiBFbnVtLWlzaDogR0FNRSAvIEJVTkRMRSAvIEFERE9OIC8gQ1VSUkVOQ1kgLyBUSEVNRSAvIEFQUCAvIFNVQlNDUklQVElPTi4gKi9cbiAgcHJvZHVjdFR5cGU/OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIG1lZGlhPzogQXJyYXk8eyByb2xlPzogc3RyaW5nOyB1cmw/OiBzdHJpbmc7IHR5cGU/OiBzdHJpbmcgfT4gfCBudWxsO1xuICB3ZWJjdGFzPzogQXJyYXk8e1xuICAgIHByaWNlPzoge1xuICAgICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgICBiYXNlUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkVmFsdWU/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudFRleHQ/OiBzdHJpbmc7XG4gICAgICBlbmRUaW1lPzogc3RyaW5nO1xuICAgIH07XG4gIH0+IHwgbnVsbDtcbiAgcHJpY2U/OiB7XG4gICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgYmFzZVByaWNlPzogc3RyaW5nO1xuICAgIGRpc2NvdW50ZWRWYWx1ZT86IHN0cmluZztcbiAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgZGlzY291bnRUZXh0Pzogc3RyaW5nO1xuICAgIGVuZFRpbWU/OiBzdHJpbmc7XG4gIH07XG4gIC8qKiBDb3Zlci9wb3J0cmFpdCBpbWFnZSBleHRyYWN0ZWQgZnJvbSB0aGUgSFRNTCBncmlkIHRpbGUgKDQ0MFx1MDBENzQ0MCkuXG4gICAqICBUaGlzIGlzIHRoZSBhY3R1YWwgYm94IGFydCBzaG93biBpbiB0aGUgc3RvcmUsIG5vdCB0aGUgYmFubmVyLiAqL1xuICB0aWxlSW1hZ2VVcmw/OiBzdHJpbmc7XG59XG5cbi8qKiBTaGFwZSByZXR1cm5lZCBieSBgaW5zcGVjdFByb2R1Y3RUeXBlc2AgXHUyMDE0IHVzZWQgYnkgdGhlIGRlYnVnIHJvdXRlIHRvXG4gKiAgZmlndXJlIG91dCB0aGUgcmVhbCBjbGFzc2lmaWNhdGlvbiBmaWVsZCBuYW1lcyBiZWZvcmUgd3JpdGluZyB0aGUgZmlsdGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0VHlwZUluc3BlY3Rpb24ge1xuICB0b3RhbFNlZW46IG51bWJlcjtcbiAgY2xhc3NpZmljYXRpb25zOiBBcnJheTx7XG4gICAgY2xhc3NpZmljYXRpb246IHN0cmluZztcbiAgICBwcm9kdWN0VHlwZTogc3RyaW5nO1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgc2FtcGxlczogc3RyaW5nW107XG4gIH0+O1xuICAvKiogRXZlcnkgdG9wLWxldmVsIGtleSBldmVyIHNlZW4gb24gYSBwcm9kdWN0IG9iamVjdCwgd2l0aCBhbiBleGFtcGxlXG4gICAqICB2YWx1ZSBmcm9tIHRoZSBmaXJzdCBwcm9kdWN0IHRoYXQgaGFkIGl0LiBIZWxwcyBzcG90IGFueSBmaWVsZCBuYW1lXG4gICAqICB2YXJpYXRpb24gd2UgbWlzc2VkLiAqL1xuICBvYnNlcnZlZEtleXM6IEFycmF5PHsga2V5OiBzdHJpbmc7IGV4YW1wbGU6IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3BlY3RQcm9kdWN0VHlwZXMoXG4gIGNmZzogUHNuQ29uZmlnXG4pOiBQcm9taXNlPFByb2R1Y3RUeXBlSW5zcGVjdGlvbj4ge1xuICBjb25zdCBieUNvbWJvID0gbmV3IE1hcDxcbiAgICBzdHJpbmcsXG4gICAgeyBjbGFzc2lmaWNhdGlvbjogc3RyaW5nOyBwcm9kdWN0VHlwZTogc3RyaW5nOyBjb3VudDogbnVtYmVyOyBzYW1wbGVzOiBzdHJpbmdbXSB9XG4gID4oKTtcbiAgY29uc3Qgb2JzZXJ2ZWRLZXlzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgYXdhaXQgKGNvbnN0IHJhdyBvZiBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyhjZmcpKSB7XG4gICAgdG90YWwrKztcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhyYXcpKSB7XG4gICAgICBpZiAob2JzZXJ2ZWRLZXlzLmhhcyhrKSkgY29udGludWU7XG4gICAgICBsZXQgZXhhbXBsZTogc3RyaW5nO1xuICAgICAgaWYgKHYgPT0gbnVsbCkgZXhhbXBsZSA9IFwibnVsbFwiO1xuICAgICAgZWxzZSBpZiAodHlwZW9mIHYgPT09IFwib2JqZWN0XCIpIGV4YW1wbGUgPSBKU09OLnN0cmluZ2lmeSh2KS5zbGljZSgwLCAxMjApO1xuICAgICAgZWxzZSBleGFtcGxlID0gU3RyaW5nKHYpLnNsaWNlKDAsIDEyMCk7XG4gICAgICBvYnNlcnZlZEtleXMuc2V0KGssIGV4YW1wbGUpO1xuICAgIH1cbiAgICBjb25zdCBjbHMgPVxuICAgICAgcmF3LmxvY2FsaXplZFN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uIHx8XG4gICAgICByYXcuc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHxcbiAgICAgIFwiXCI7XG4gICAgY29uc3QgcHQgPSByYXcucHJvZHVjdFR5cGUgfHwgcmF3LnR5cGUgfHwgXCJcIjtcbiAgICBjb25zdCBrZXkgPSBgJHtjbHN9XFx1MDAwMSR7cHR9YDtcbiAgICBjb25zdCBleGlzdGluZyA9IGJ5Q29tYm8uZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICBleGlzdGluZy5jb3VudCsrO1xuICAgICAgaWYgKGV4aXN0aW5nLnNhbXBsZXMubGVuZ3RoIDwgMyAmJiByYXcubmFtZSkgZXhpc3Rpbmcuc2FtcGxlcy5wdXNoKHJhdy5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnlDb21iby5zZXQoa2V5LCB7XG4gICAgICAgIGNsYXNzaWZpY2F0aW9uOiBjbHMsXG4gICAgICAgIHByb2R1Y3RUeXBlOiBwdCxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHNhbXBsZXM6IHJhdy5uYW1lID8gW3Jhdy5uYW1lXSA6IFtdLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY2xhc3NpZmljYXRpb25zID0gWy4uLmJ5Q29tYm8udmFsdWVzKCldLnNvcnQoKGEsIGIpID0+IGIuY291bnQgLSBhLmNvdW50KTtcbiAgY29uc3Qga2V5cyA9IFsuLi5vYnNlcnZlZEtleXMuZW50cmllcygpXVxuICAgIC5zb3J0KChbYV0sIFtiXSkgPT4gYS5sb2NhbGVDb21wYXJlKGIpKVxuICAgIC5tYXAoKFtrZXksIGV4YW1wbGVdKSA9PiAoeyBrZXksIGV4YW1wbGUgfSkpO1xuXG4gIHJldHVybiB7IHRvdGFsU2VlbjogdG90YWwsIGNsYXNzaWZpY2F0aW9ucywgb2JzZXJ2ZWRLZXlzOiBrZXlzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCwgbm93OiBzdHJpbmcpOiBHYW1lIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gcmF3LmlkIHx8IHJhdy5wcm9kdWN0SWQgfHwgcmF3LmNvbmNlcHRJZDtcbiAgaWYgKCFpZCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgbmFtZSA9IHJhdy5uYW1lIHx8IHJhdy50aXRsZSB8fCBcIlwiO1xuICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gIC8vIEltYWdlOiBwcmVmZXIgdGhlIHRpbGUgaW1hZ2UgZXh0cmFjdGVkIGZyb20gdGhlIEhUTUwgZ3JpZCAodGhlIGFjdHVhbFxuICAvLyA0NDBcdTAwRDc0NDAgY292ZXIgYXJ0IHRoZSBzdG9yZSBkaXNwbGF5cykuIEZhbGwgYmFjayB0byBtZWRpYSByb2xlcyBmcm9tIEpTT04uXG4gIGxldCBpbWFnZVVybDogc3RyaW5nIHwgbnVsbCA9IHJhdy50aWxlSW1hZ2VVcmwgfHwgbnVsbDtcbiAgaWYgKCFpbWFnZVVybCkge1xuICAgIGNvbnN0IG1lZGlhID0gcmF3Lm1lZGlhIHx8IFtdO1xuICAgIGNvbnN0IHByZWZlcnJlZFBvcnRyYWl0ID0gW1wiUE9SVFJBSVRfQkFOTkVSXCIsIFwiR0FNRUhVQl9DT1ZFUl9BUlRcIiwgXCJCT1hBUlRcIl07XG4gICAgY29uc3QgZmFsbGJhY2tSb2xlcyA9IFtcIk1BU1RFUlwiLCBcIlBSRVZJRVdfR0FNRV9BUlRcIl07XG4gICAgZm9yIChjb25zdCBtIG9mIG1lZGlhKSB7XG4gICAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICAgIGlmIChwcmVmZXJyZWRQb3J0cmFpdC5pbmNsdWRlcyhyb2xlKSkge1xuICAgICAgICBpbWFnZVVybCA9IG0udXJsID8/IG51bGw7XG4gICAgICAgIGlmIChpbWFnZVVybCkgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaW1hZ2VVcmwpIHtcbiAgICAgIGZvciAoY29uc3QgbSBvZiBtZWRpYSkge1xuICAgICAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKGZhbGxiYWNrUm9sZXMuaW5jbHVkZXMocm9sZSkpIHtcbiAgICAgICAgICBpbWFnZVVybCA9IG0udXJsID8/IG51bGw7XG4gICAgICAgICAgaWYgKGltYWdlVXJsKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWltYWdlVXJsICYmIG1lZGlhWzBdPy51cmwpIGltYWdlVXJsID0gbWVkaWFbMF0udXJsO1xuICB9XG5cbiAgY29uc3QgcGxhdGZvcm1zID0gQXJyYXkuaXNBcnJheShyYXcucGxhdGZvcm1zKVxuICAgID8gcmF3LnBsYXRmb3Jtcy5qb2luKFwiLFwiKVxuICAgIDogcmF3LnBsYXRmb3JtcyA/PyBcIlwiO1xuXG4gIGNvbnN0IHByaWNlID0gcmF3LndlYmN0YXM/LlswXT8ucHJpY2UgPz8gcmF3LnByaWNlID8/IHt9O1xuICBjb25zdCBwcmljZU9yaWdpbmFsQ2VudHMgPSBwcmljZVRvQ2VudHMocHJpY2UuYmFzZVByaWNlVmFsdWUgPz8gcHJpY2UuYmFzZVByaWNlKTtcbiAgbGV0IHByaWNlRGlzY291bnRlZENlbnRzID0gcHJpY2VUb0NlbnRzKFxuICAgIHByaWNlLmRpc2NvdW50ZWRWYWx1ZSA/PyBwcmljZS5kaXNjb3VudGVkUHJpY2VcbiAgKTtcbiAgaWYgKHByaWNlRGlzY291bnRlZENlbnRzID09IG51bGwpIHByaWNlRGlzY291bnRlZENlbnRzID0gcHJpY2VPcmlnaW5hbENlbnRzO1xuXG4gIGxldCBkaXNjb3VudFBlcmNlbnQgPSAwO1xuICBjb25zdCBkdCA9IHByaWNlLmRpc2NvdW50VGV4dCB8fCBcIlwiO1xuICBjb25zdCBtID0gLyhcXGQrKS8uZXhlYyhTdHJpbmcoZHQpKTtcbiAgaWYgKG0pIGRpc2NvdW50UGVyY2VudCA9IHBhcnNlSW50KG1bMV0sIDEwKTtcbiAgaWYgKFxuICAgICFkaXNjb3VudFBlcmNlbnQgJiZcbiAgICBwcmljZU9yaWdpbmFsQ2VudHMgJiZcbiAgICBwcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgcHJpY2VPcmlnaW5hbENlbnRzID4gMCAmJlxuICAgIHByaWNlRGlzY291bnRlZENlbnRzIDwgcHJpY2VPcmlnaW5hbENlbnRzXG4gICkge1xuICAgIGRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAoKHByaWNlT3JpZ2luYWxDZW50cyAtIHByaWNlRGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBwcmljZU9yaWdpbmFsQ2VudHNcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpZDogU3RyaW5nKGlkKSxcbiAgICBwbGF0Zm9ybTogXCJwc25cIiBhcyBjb25zdCxcbiAgICByZWdpb246IFwidXNcIixcbiAgICBuYW1lLFxuICAgIGltYWdlVXJsLFxuICAgIHN0b3JlVXJsOiBgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vZW4tdXMvcHJvZHVjdC8ke2lkfWAsXG4gICAgcGxhdGZvcm1zLFxuICAgIGN1cnJlbmN5OiBcIlVTRFwiLFxuICAgIHByaWNlT3JpZ2luYWxDZW50cyxcbiAgICBwcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgZGlzY291bnRFbmRBdDogcHJpY2UuZW5kVGltZSB8fCBudWxsLFxuICAgIHNlbGVjdGVkOiBmYWxzZSxcbiAgICBwdWJsaXNoZWQ6IGZhbHNlLFxuICAgIG5vdGVzOiBcIlwiLFxuICAgIHlvdXR1YmVVcmw6IFwiXCIsXG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIGZpcnN0U2VlbkF0OiBub3csXG4gICAgbGFzdFNlZW5BdDogbm93LFxuICAgIHVwZGF0ZWRBdDogbm93LFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEh0bWwodXJsOiBzdHJpbmcsIHJlZ2lvbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93biA9IG51bGw7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNDsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBhY2NlcHQ6XG4gICAgICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IHJlZ2lvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJlc1wiKSA/IFwiZXNcIiA6IFwiZW4tVVNcIixcbiAgICAgICAgICBcIngtcHNuLXN0b3JlLWxvY2FsZS1vdmVycmlkZVwiOiByZWdpb24sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDA0KSB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoYENhdGVnb3J5IG5vdCBmb3VuZCAoNDA0KTogJHt1cmx9YCk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwMylcbiAgICAgICAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFwiUFNOIHJldHVybmVkIDQwMyAoSVAvQ2xvdWRmbGFyZSBibG9jaylcIik7XG4gICAgICBpZiAoci5zdGF0dXMgPj0gNTAwKSB0aHJvdyBuZXcgRXJyb3IoYFBTTiAke3Iuc3RhdHVzfWApO1xuICAgICAgcmV0dXJuIGF3YWl0IHIudGV4dCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHRocm93IGU7XG4gICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgYFBTTiBIVE1MIGZldGNoIGZhaWxlZCBhZnRlciByZXRyaWVzOiAkeyhsYXN0RXJyb3IgYXMgRXJyb3IpPy5tZXNzYWdlIHx8IGxhc3RFcnJvcn1gXG4gICk7XG59XG5cbi8qKiBFeHRyYWN0IHRoZSBKU09OIHBheWxvYWQgZnJvbSBgPHNjcmlwdCBpZD1cIl9fTkVYVF9EQVRBX19cIj5cdTIwMjY8L3NjcmlwdD5gLiAqL1xuZnVuY3Rpb24gZXh0cmFjdE5leHREYXRhKGh0bWw6IHN0cmluZyk6IGFueSB8IG51bGwge1xuICBjb25zdCBtID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoXG4gICAgaHRtbFxuICApO1xuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKG1bMV0pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHdhbGsgYSBKU09OIHRyZWUgYW5kIGNvbGxlY3QgYW55dGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgUFNOXG4gKiBwcm9kdWN0IGVudHJ5LiBNYXRjaGVzIG9iamVjdHMgd2l0aCBhbiBgaWRgL2Bwcm9kdWN0SWRgIHBsdXMgZWl0aGVyIGFcbiAqIGBuYW1lYC9gdGl0bGVgIGFuZCBhIGBwcmljZWAvYHdlYmN0YXNgLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvZHVjdHMobm9kZTogdW5rbm93biwgb3V0OiBNYXA8c3RyaW5nLCBSYXdQcm9kdWN0Pik6IHZvaWQge1xuICBpZiAoIW5vZGUpIHJldHVybjtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICBmb3IgKGNvbnN0IHYgb2Ygbm9kZSkgY29sbGVjdFByb2R1Y3RzKHYsIG91dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlb2Ygbm9kZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuICBjb25zdCBvYmogPSBub2RlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXG4gIGNvbnN0IGlkID0gKG9iai5pZCB8fCBvYmoucHJvZHVjdElkIHx8IG9iai5jb25jZXB0SWQpIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgbmFtZSA9IChvYmoubmFtZSB8fCBvYmoudGl0bGUpIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgaGFzUHJpY2UgPVxuICAgIChvYmoucHJpY2UgJiYgdHlwZW9mIG9iai5wcmljZSA9PT0gXCJvYmplY3RcIikgfHxcbiAgICAoQXJyYXkuaXNBcnJheShvYmoud2ViY3RhcykgJiYgb2JqLndlYmN0YXMubGVuZ3RoID4gMCk7XG4gIC8vIFByb2R1Y3QgSURzIG9uIFBTTiBsb29rIGxpa2UgXCJVUDkwMDAtQ1VTQTA3NDA4XzAwLVJFREVNUFRJT04yMDAwMDAwXCJcbiAgLy8gKGNvbnRhaW4gYSBoeXBoZW4gKyB1bmRlcnNjb3JlKS4gRmlsdGVyIG9uIHRoYXQgdG8gYXZvaWQgcGlja2luZyB1cFxuICAvLyBhcmJpdHJhcnkgZW50aXRpZXMgd2l0aCBhbiBgaWRgLlxuICBpZiAoXG4gICAgaWQgJiZcbiAgICB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIgJiZcbiAgICAvXltBLVpdezJ9XFxkezR9LS8udGVzdChpZCkgJiZcbiAgICBuYW1lICYmXG4gICAgaGFzUHJpY2UgJiZcbiAgICAhb3V0LmhhcyhpZClcbiAgKSB7XG4gICAgb3V0LnNldChpZCwgb2JqIGFzIFJhd1Byb2R1Y3QpO1xuICB9XG5cbiAgZm9yIChjb25zdCB2IG9mIE9iamVjdC52YWx1ZXMob2JqKSkgY29sbGVjdFByb2R1Y3RzKHYsIG91dCk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjb3Zlci9wb3J0cmFpdCBpbWFnZSBVUkxzIGZyb20gdGhlIEhUTUwgZ3JpZCB0aWxlcy5cbiAqIEVhY2ggdGlsZSBoYXMgYSBgZGF0YS10ZWxlbWV0cnktbWV0YWAgd2l0aCB0aGUgcHJvZHVjdCBJRCBhbmQgYW4gYDxpbWc+YFxuICogd2l0aCB0aGUgYWN0dWFsIGNvdmVyIGFydCAodGhlIDQ0MFx1MDBENzQ0MCBwb3J0cmFpdCBpbWFnZSB0aGUgc3RvcmUgZGlzcGxheXMpLlxuICovXG5mdW5jdGlvbiBleHRyYWN0VGlsZUltYWdlcyhodG1sOiBzdHJpbmcpOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICBjb25zdCBtZXRhczogQXJyYXk8eyBpZDogc3RyaW5nOyBwb3M6IG51bWJlciB9PiA9IFtdO1xuICBjb25zdCBtZXRhUmUgPSAvZGF0YS10ZWxlbWV0cnktbWV0YT1bXCInXShcXHtbXlwiJ10qXFx9KVtcIiddL2c7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBtZXRhUmUuZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmF3ID0gbVsxXS5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJykucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpO1xuICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UocmF3KTtcbiAgICAgIGlmIChqc29uLmlkKSBtZXRhcy5wdXNoKHsgaWQ6IGpzb24uaWQsIHBvczogbS5pbmRleCB9KTtcbiAgICB9IGNhdGNoIHsgLyogc2tpcCBtYWxmb3JtZWQgKi8gfVxuICB9XG5cbiAgY29uc3QgaW1nczogQXJyYXk8eyB1cmw6IHN0cmluZzsgcG9zOiBudW1iZXIgfT4gPSBbXTtcbiAgY29uc3QgaW1nUmUgPSAvZGF0YS1xYT1cIlteXCJdKmdhbWUtYXJ0W15cIl0qaW1hZ2VbXlwiXSpcIltePl0qXFxic3JjPVwiKFteXCJdKylcIi9nO1xuICB3aGlsZSAoKG0gPSBpbWdSZS5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIGltZ3MucHVzaCh7IHVybDogbVsxXS5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIiksIHBvczogbS5pbmRleCB9KTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWV0YXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBtZXRhID0gbWV0YXNbaV07XG4gICAgY29uc3QgbmV4dFBvcyA9IG1ldGFzW2kgKyAxXT8ucG9zID8/IEluZmluaXR5O1xuICAgIGNvbnN0IGltZyA9IGltZ3MuZmluZCgoeCkgPT4geC5wb3MgPiBtZXRhLnBvcyAmJiB4LnBvcyA8IG5leHRQb3MpO1xuICAgIGlmIChpbWcpIHtcbiAgICAgIC8vIFN0cmlwID93PTQ0MCByZXNpemUgcGFyYW0gXHUyMTkyIGZ1bGwgcmVzb2x1dGlvbiBiYXNlIFVSTFxuICAgICAgY29uc3QgcUlkeCA9IGltZy51cmwuaW5kZXhPZihcIj9cIik7XG4gICAgICBtYXAuc2V0KG1ldGEuaWQsIHFJZHggPiAwID8gaW1nLnVybC5zdWJzdHJpbmcoMCwgcUlkeCkgOiBpbWcudXJsKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hcDtcbn1cblxuZnVuY3Rpb24gYnVpbGRDYXRlZ29yeVVybChjZmc6IFBzbkNvbmZpZywgcGFnZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgLy8gcmVnaW9uIGxpa2UgXCJlbi1VU1wiIFx1MjE5MiBcImVuLXVzXCJcbiAgY29uc3QgcmVnaW9uUGF0aCA9IGNmZy5yZWdpb24udG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIGBodHRwczovL3N0b3JlLnBsYXlzdGF0aW9uLmNvbS8ke3JlZ2lvblBhdGh9L2NhdGVnb3J5LyR7Y2ZnLmRlYWxzQ2F0ZWdvcnlJZH0vJHtwYWdlfWA7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogaXRlckNhdGVnb3J5UHJvZHVjdHMoXG4gIGNmZzogUHNuQ29uZmlnXG4pOiBBc3luY0dlbmVyYXRvcjxSYXdQcm9kdWN0PiB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWF4UGFnZXMgPSA1MDsgLy8gaGFyZCBzdG9wIHNvIGEgYnVnIGNhbid0IGxvb3AgZm9yZXZlclxuXG4gIGZvciAobGV0IHBhZ2UgPSAxOyBwYWdlIDw9IG1heFBhZ2VzOyBwYWdlKyspIHtcbiAgICBjb25zdCB1cmwgPSBidWlsZENhdGVnb3J5VXJsKGNmZywgcGFnZSk7XG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoSHRtbCh1cmwsIGNmZy5yZWdpb24pO1xuICAgIGNvbnN0IGRhdGEgPSBleHRyYWN0TmV4dERhdGEoaHRtbCk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICBpZiAocGFnZSA9PT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgICAgICAgXCJDb3VsZCBub3QgZmluZCBfX05FWFRfREFUQV9fIGluIFBTTiBIVE1MIFx1MjAxNCBwYWdlIGxheW91dCBtYXkgaGF2ZSBjaGFuZ2VkLlwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgZm91bmQgPSBuZXcgTWFwPHN0cmluZywgUmF3UHJvZHVjdD4oKTtcbiAgICBjb2xsZWN0UHJvZHVjdHMoZGF0YSwgZm91bmQpO1xuXG4gICAgLy8gRXh0cmFjdCB0aGUgcG9ydHJhaXQvY292ZXIgaW1hZ2VzIHJlbmRlcmVkIGluIHRoZSBIVE1MIGdyaWQgdGlsZXMuXG4gICAgY29uc3QgdGlsZUltYWdlcyA9IGV4dHJhY3RUaWxlSW1hZ2VzKGh0bWwpO1xuXG4gICAgbGV0IG5ld09uVGhpc1BhZ2UgPSAwO1xuICAgIGZvciAoY29uc3QgW2lkLCBwXSBvZiBmb3VuZCkge1xuICAgICAgaWYgKHNlZW4uaGFzKGlkKSkgY29udGludWU7XG4gICAgICBzZWVuLmFkZChpZCk7XG4gICAgICBuZXdPblRoaXNQYWdlKys7XG4gICAgICBjb25zdCB0aWxlSW1nID0gdGlsZUltYWdlcy5nZXQoaWQpO1xuICAgICAgaWYgKHRpbGVJbWcpIHAudGlsZUltYWdlVXJsID0gdGlsZUltZztcbiAgICAgIHlpZWxkIHA7XG4gICAgfVxuICAgIGlmIChuZXdPblRoaXNQYWdlID09PSAwKSBicmVhazsgLy8gcGFnaW5hdGlvbiBleGhhdXN0ZWRcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvY29tcGV0aXRvcnMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvY29tcGV0aXRvcnMudHNcIjsvKipcbiAqIENvbXBldGl0b3Igc2NyYXBlcnMgKyBmdXp6eSBtYXRjaGVyLlxuICpcbiAqIFdlIHN1cHBvcnQgdHdvIGdlbmVyaWMgc3RvcmVmcm9udCB0eXBlczpcbiAqICAgLSBTaG9waWZ5OiAgICAgR0VUIGh0dHBzOi8vPGRvbWFpbj4vcHJvZHVjdHMuanNvbj9saW1pdD0yNTAmcGFnZT1OXG4gKiAgIC0gV29vQ29tbWVyY2U6IEdFVCBodHRwczovLzxkb21haW4+L3dwLWpzb24vd2Mvc3RvcmUvdjEvcHJvZHVjdHM/cGVyX3BhZ2U9MTAwJnBhZ2U9TlxuICpcbiAqIEJvdGggZXhwb3NlIHB1YmxpYywgdW5hdXRoZW50aWNhdGVkIEpTT04gZmVlZHMuIEEgdGhpcmQgdHlwZSBcImF1dG9cIiB0cmllc1xuICogU2hvcGlmeSBmaXJzdCBhbmQgZmFsbHMgYmFjayB0byBXb29Db21tZXJjZSBzbyB0aGUgdXNlciBkb2Vzbid0IGhhdmUgdG9cbiAqIGd1ZXNzIHdoZW4gYWRkaW5nIGEgbmV3IHN0b3JlLlxuICpcbiAqIFRoZSBtYXRjaGVyIG5vcm1hbGl6ZXMgdGl0bGVzIChsb3dlcmNhc2VkLCBhY2NlbnQtc3RyaXBwZWQsIG5vaXNlIHdvcmRzXG4gKiByZW1vdmVkKSBhbmQgY29tcGFyZXMgUFNOIFx1MjE5NCBjb21wZXRpdG9yIGVudHJpZXMgd2l0aCBKYWNjYXJkIHNpbWlsYXJpdHkuXG4gKi9cbmltcG9ydCB0eXBlIHsgR2FtZSB9IGZyb20gXCIuL3N0b3JlXCI7XG5cbmNvbnN0IFVBID1cbiAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgXCIgK1xuICBcIihLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2XCI7XG5cbmV4cG9ydCB0eXBlIENvbXBldGl0b3JUeXBlID0gXCJzaG9waWZ5XCIgfCBcIndvb2NvbW1lcmNlXCIgfCBcImh0bWxcIiB8IFwianVtcHNlbGxlclwiIHwgXCJhdXRvXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGV0aXRvckNvbmZpZyB7XG4gIGtleTogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBkb21haW46IHN0cmluZztcbiAgdHlwZTogQ29tcGV0aXRvclR5cGU7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGV0aXRvclByb2R1Y3Qge1xuICBzdG9yZUtleTogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgcHJpY2VDbHA6IG51bWJlcjtcbiAgYXZhaWxhYmxlOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBldGl0b3JNYXRjaCB7XG4gIHN0b3JlS2V5OiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBwcmljZUNscDogbnVtYmVyO1xuICBhdmFpbGFibGU6IGJvb2xlYW47XG4gIHNjb3JlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wZXRpdG9yRmV0Y2hFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IocHVibGljIHN0b3JlS2V5OiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vcm1hbGl6YXRpb24gKyBzaW1pbGFyaXR5IC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IE5PSVNFID0gbmV3IFNldChbXG4gIFwiZm9yXCIsXCJ0aGVcIixcIm9mXCIsXCJhbmRcIixcIm9yXCIsXCJhXCIsXCJhblwiLFwiZGVcIixcImRlbFwiLFwibGFcIixcImVsXCIsXCJsb3NcIixcImxhc1wiLFxuICBcInBzNFwiLFwicHM1XCIsXCJwczNcIixcInBzdlwiLFwicHNwXCIsXCJ4Ym94XCIsXCJwY1wiLFwic3RlYW1cIixcIm5pbnRlbmRvXCIsXCJzd2l0Y2hcIixcbiAgXCJlZGl0aW9uXCIsXCJlZFwiLFwiZGVsdXhlXCIsXCJnb2xkXCIsXCJzaWx2ZXJcIixcImJyb256ZVwiLFwicGxhdGludW1cIixcInVsdGltYXRlXCIsXG4gIFwiZ290eVwiLFwic3RhbmRhcmRcIixcImRpZ2l0YWxcIixcImN1ZW50YVwiLFwicHJpbWFyaWFcIixcInNlY3VuZGFyaWFcIixcInByaW1hcmlhMVwiLFxuICBcInByaW1hcmlhMlwiLFwiZ2FtZVwiLFwianVlZ29cIixcImp1ZWdvc1wiLFwiYnVuZGxlXCIsXCJwYWNrXCIsXCJzZWFzb25cIixcInBhc3NcIixcbiAgXCJjb2xsZWN0aW9uXCIsXCJjb21wbGV0ZVwiLFwicmVtYXN0ZXJlZFwiLFwicmVtYWtlXCIsXCJoZFwiLFwiZGVmaW5pdGl2ZVwiLFxuICBcImFubml2ZXJzYXJ5XCIsXCJ2ZXJzaW9uXCIsXCJ2ZXJzXCIsXCJ2ZXJcIixcImluY1wiLFwiaW5jbHV5ZVwiLFwicGFja1wiLFxuXSk7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZSh0aXRsZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gdGl0bGVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5ub3JtYWxpemUoXCJORkRcIilcbiAgICAucmVwbGFjZSgvW1xcdTAzMDAtXFx1MDM2Zl0vZywgXCJcIilcbiAgICAucmVwbGFjZSgvW1x1MjEyMlx1MDBBRVx1MDBBOV0vZywgXCJcIilcbiAgICAucmVwbGFjZSgvXFxbW15cXF1dKlxcXS9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvXFwoW14pXSpcXCkvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1teYS16MC05IF0rL2csIFwiIFwiKVxuICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgLmZpbHRlcigodCkgPT4gdCAmJiAhTk9JU0UuaGFzKHQpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNpbWlsYXJpdHkoYTogc3RyaW5nW10sIGI6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgaWYgKCFhLmxlbmd0aCB8fCAhYi5sZW5ndGgpIHJldHVybiAwO1xuICBjb25zdCBzYSA9IG5ldyBTZXQoYSk7XG4gIGNvbnN0IHNiID0gbmV3IFNldChiKTtcbiAgbGV0IGludGVyID0gMDtcbiAgZm9yIChjb25zdCB4IG9mIHNhKSBpZiAoc2IuaGFzKHgpKSBpbnRlcisrO1xuICBpZiAoIWludGVyKSByZXR1cm4gMDtcbiAgY29uc3QgdW5pb24gPSBzYS5zaXplICsgc2Iuc2l6ZSAtIGludGVyO1xuICBjb25zdCBqYWNjYXJkID0gaW50ZXIgLyB1bmlvbjtcbiAgLy8gQ29udGFpbm1lbnQgYm9udXM6IGlmIHRoZSBzbWFsbGVyIHNldCBpcyBmdWxseSBjb250YWluZWQgaW4gdGhlIGxhcmdlcixcbiAgLy8gcmV3YXJkIHRoYXQgKGNvdmVycyBcIlJlZCBEZWFkIFJlZGVtcHRpb24gMlwiIFx1MjI4MiBcIlJlZCBEZWFkIFJlZGVtcHRpb24gMiBQUzRcIikuXG4gIGNvbnN0IG1pblNpemUgPSBNYXRoLm1pbihzYS5zaXplLCBzYi5zaXplKTtcbiAgY29uc3QgY29udGFpbm1lbnQgPSBpbnRlciAvIG1pblNpemU7XG4gIHJldHVybiAwLjYgKiBqYWNjYXJkICsgMC40ICogY29udGFpbm1lbnQ7XG59XG5cbi8qKiBNYXRjaCB0aHJlc2hvbGQgYmVsb3cgd2hpY2ggd2UgaWdub3JlIGEgY2FuZGlkYXRlIHBhaXIuICovXG5leHBvcnQgY29uc3QgTUFUQ0hfVEhSRVNIT0xEID0gMC41NTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gcHJpY2UgcGFyc2luZyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBwYXJzZUNscCh2OiB1bmtub3duKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICh2ID09IG51bGwpIHJldHVybiBudWxsO1xuICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKHYpKSB7XG4gICAgLy8gU2hvcGlmeSBvZnRlbiBnaXZlcyBzdHJpbmdzIGxpa2UgXCIyOTk5MC4wMFwiOyBudW1iZXJzIGFyZSBpbiBtYWpvciB1bml0cy5cbiAgICAvLyBIZXVyaXN0aWM6IHZhbHVlcyA8IDEwMDAgYXJlIHVubGlrZWx5IGZvciBDTFA7IHRyZWF0IGFzLWlzIG90aGVyd2lzZS5cbiAgICByZXR1cm4gTWF0aC5yb3VuZCh2KTtcbiAgfVxuICBjb25zdCBzID0gU3RyaW5nKHYpLnJlcGxhY2UoL1teXFxkLC4tXS9nLCBcIlwiKTtcbiAgaWYgKCFzKSByZXR1cm4gbnVsbDtcbiAgLy8gQ0xQIGhhcyBubyBkZWNpbWFscy4gRG90cyBhbmQgY29tbWFzIGFyZSBhbG1vc3QgYWx3YXlzIHRob3VzYW5kc1xuICAvLyBzZXBhcmF0b3JzIChcIiQ2Ljk5MFwiKS4gVGhlIG9ubHkgZGVjaW1hbC1pc2ggY2FzZSB3ZSBzZWUgaXMgU2hvcGlmeSdzXG4gIC8vIFVTRC1zdHlsZSBcIjc5OTAuMDBcIiAvIFwiNzk5MCwwMFwiIFx1MjAxNCBsYXN0IHNlcGFyYXRvciBmb2xsb3dlZCBieSBleGFjdGx5XG4gIC8vIDIgZGlnaXRzLiBEZXRlY3QgdGhhdCwgZHJvcCB0aGUgZGVjaW1hbCB0YWlsLCBzdHJpcCB0aGUgcmVzdC5cbiAgbGV0IGNsZWFuZWQgPSBzO1xuICBjb25zdCBkZWNpbWFsVGFpbCA9IC9bLixdKFxcZHsyfSkkLy5leGVjKHMpO1xuICBpZiAoZGVjaW1hbFRhaWwpIGNsZWFuZWQgPSBzLnNsaWNlKDAsIC0zKTtcbiAgY2xlYW5lZCA9IGNsZWFuZWQucmVwbGFjZSgvWy4sXS9nLCBcIlwiKTtcbiAgY29uc3QgbiA9IE51bWJlcihjbGVhbmVkKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobikpIHJldHVybiBudWxsO1xuICByZXR1cm4gTWF0aC5yb3VuZChuKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2hvcGlmeSBzY3JhcGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmludGVyZmFjZSBTaG9waWZ5VmFyaWFudCB7XG4gIHByaWNlPzogc3RyaW5nO1xuICBhdmFpbGFibGU/OiBib29sZWFuO1xuICBjb21wYXJlX2F0X3ByaWNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgU2hvcGlmeVByb2R1Y3Qge1xuICBpZDogbnVtYmVyO1xuICB0aXRsZTogc3RyaW5nO1xuICBoYW5kbGU6IHN0cmluZztcbiAgdmFyaWFudHM/OiBTaG9waWZ5VmFyaWFudFtdO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFNob3BpZnkoXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIGRvbWFpbjogc3RyaW5nXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgY29uc3QgcHJvZHVjdHM6IENvbXBldGl0b3JQcm9kdWN0W10gPSBbXTtcbiAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gNDA7IHBhZ2UrKykge1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7ZG9tYWlufS9wcm9kdWN0cy5qc29uP2xpbWl0PTI1MCZwYWdlPSR7cGFnZX1gO1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHsgXCJ1c2VyLWFnZW50XCI6IFVBLCBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgfSk7XG4gICAgaWYgKHIuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIGAke2RvbWFpbn0gbm8gZXhwb25lIC9wcm9kdWN0cy5qc29uIChcdTAwQkZubyBlcyBTaG9waWZ5PylgXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIXIub2spIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIGAke2RvbWFpbn0gSFRUUCAke3Iuc3RhdHVzfSBlbiAvcHJvZHVjdHMuanNvbmBcbiAgICAgICk7XG4gICAgfVxuICAgIGxldCBib2R5OiB7IHByb2R1Y3RzPzogU2hvcGlmeVByb2R1Y3RbXSB9O1xuICAgIHRyeSB7XG4gICAgICBib2R5ID0gKGF3YWl0IHIuanNvbigpKSBhcyB7IHByb2R1Y3RzPzogU2hvcGlmeVByb2R1Y3RbXSB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgYCR7ZG9tYWlufSBkZXZvbHZpXHUwMEYzIGFsZ28gcXVlIG5vIGVzIEpTT04gZW4gL3Byb2R1Y3RzLmpzb25gXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBiYXRjaCA9IGJvZHkucHJvZHVjdHMgPz8gW107XG4gICAgaWYgKCFiYXRjaC5sZW5ndGgpIGJyZWFrO1xuICAgIGZvciAoY29uc3QgcCBvZiBiYXRjaCkge1xuICAgICAgY29uc3QgdmFyaWFudCA9IHAudmFyaWFudHM/LlswXTtcbiAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VDbHAodmFyaWFudD8ucHJpY2UpO1xuICAgICAgaWYgKHByaWNlID09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgcHJvZHVjdHMucHVzaCh7XG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICB0aXRsZTogcC50aXRsZSxcbiAgICAgICAgdXJsOiBgaHR0cHM6Ly8ke2RvbWFpbn0vcHJvZHVjdHMvJHtwLmhhbmRsZX1gLFxuICAgICAgICBwcmljZUNscDogcHJpY2UsXG4gICAgICAgIGF2YWlsYWJsZTogdmFyaWFudD8uYXZhaWxhYmxlICE9PSBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoYmF0Y2gubGVuZ3RoIDwgMjUwKSBicmVhaztcbiAgfVxuICByZXR1cm4gcHJvZHVjdHM7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIFdvb0NvbW1lcmNlIHNjcmFwZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuaW50ZXJmYWNlIFdvb1ByaWNlcyB7XG4gIHByaWNlPzogc3RyaW5nO1xuICByZWd1bGFyX3ByaWNlPzogc3RyaW5nO1xuICBzYWxlX3ByaWNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgV29vUHJvZHVjdCB7XG4gIGlkOiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcGVybWFsaW5rOiBzdHJpbmc7XG4gIHByaWNlcz86IFdvb1ByaWNlcztcbiAgaXNfaW5fc3RvY2s/OiBib29sZWFuO1xuICBpc19wdXJjaGFzYWJsZT86IGJvb2xlYW47XG59XG5cbmNvbnN0IFdPT19FTkRQT0lOVFMgPSBbXG4gIFwiL3dwLWpzb24vd2Mvc3RvcmUvdjEvcHJvZHVjdHNcIixcbiAgXCIvd3AtanNvbi93Yy9zdG9yZS9wcm9kdWN0c1wiLFxuICBcIi8/cmVzdF9yb3V0ZT0vd2Mvc3RvcmUvdjEvcHJvZHVjdHNcIixcbl07XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV29vKFxuICBzdG9yZUtleTogc3RyaW5nLFxuICBkb21haW46IHN0cmluZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGxldCBsYXN0RXJyb3IgPSBcIm5vLWF0dGVtcHRcIjtcbiAgZm9yIChjb25zdCBiYXNlUGF0aCBvZiBXT09fRU5EUE9JTlRTKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBmZXRjaFdvb0F0KHN0b3JlS2V5LCBkb21haW4sIGJhc2VQYXRoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIENvbXBldGl0b3JGZXRjaEVycm9yKSB7XG4gICAgICAgIGxhc3RFcnJvciA9IGUubWVzc2FnZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgc3RvcmVLZXksXG4gICAgYCR7ZG9tYWlufSBubyBleHBvbmUgbmluZ1x1MDBGQW4gZW5kcG9pbnQgV29vQ29tbWVyY2UgY29ub2NpZG8gKCR7bGFzdEVycm9yfSlgXG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV29vQXQoXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIGRvbWFpbjogc3RyaW5nLFxuICBiYXNlUGF0aDogc3RyaW5nXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgY29uc3QgcHJvZHVjdHM6IENvbXBldGl0b3JQcm9kdWN0W10gPSBbXTtcbiAgY29uc3Qgam9pbmVyID0gYmFzZVBhdGguaW5jbHVkZXMoXCI/XCIpID8gXCImXCIgOiBcIj9cIjtcbiAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gNDA7IHBhZ2UrKykge1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7ZG9tYWlufSR7YmFzZVBhdGh9JHtqb2luZXJ9cGVyX3BhZ2U9MTAwJnBhZ2U9JHtwYWdlfWA7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczogeyBcInVzZXItYWdlbnRcIjogVUEsIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICB9KTtcbiAgICBpZiAoci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKHN0b3JlS2V5LCBgJHtiYXNlUGF0aH0gXHUyMTkyIDQwNGApO1xuICAgIH1cbiAgICBpZiAoIXIub2spIHtcbiAgICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihzdG9yZUtleSwgYCR7YmFzZVBhdGh9IFx1MjE5MiBIVFRQICR7ci5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGxldCBiYXRjaDogV29vUHJvZHVjdFtdO1xuICAgIHRyeSB7XG4gICAgICBiYXRjaCA9IChhd2FpdCByLmpzb24oKSkgYXMgV29vUHJvZHVjdFtdO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKHN0b3JlS2V5LCBgJHtiYXNlUGF0aH0gZGV2b2x2aVx1MDBGMyBuby1KU09OYCk7XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShiYXRjaCkgfHwgIWJhdGNoLmxlbmd0aCkgYnJlYWs7XG4gICAgZm9yIChjb25zdCBwIG9mIGJhdGNoKSB7XG4gICAgICBjb25zdCByYXcgPVxuICAgICAgICBwLnByaWNlcz8uc2FsZV9wcmljZSB8fCBwLnByaWNlcz8ucHJpY2UgfHwgcC5wcmljZXM/LnJlZ3VsYXJfcHJpY2U7XG4gICAgICBsZXQgcHJpY2UgPSBwYXJzZUNscChyYXcpO1xuICAgICAgaWYgKHByaWNlICE9IG51bGwgJiYgcmF3ICYmIC9eXFxkKyQvLnRlc3QoU3RyaW5nKHJhdykpICYmIHByaWNlID4gMV8wMDBfMDAwKSB7XG4gICAgICAgIHByaWNlID0gTWF0aC5yb3VuZChwcmljZSAvIDEwMCk7XG4gICAgICB9XG4gICAgICBpZiAocHJpY2UgPT0gbnVsbCkgY29udGludWU7XG4gICAgICBwcm9kdWN0cy5wdXNoKHtcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIHRpdGxlOiBwLm5hbWUsXG4gICAgICAgIHVybDogcC5wZXJtYWxpbmssXG4gICAgICAgIHByaWNlQ2xwOiBwcmljZSxcbiAgICAgICAgYXZhaWxhYmxlOiBwLmlzX2luX3N0b2NrICE9PSBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoYmF0Y2gubGVuZ3RoIDwgMTAwKSBicmVhaztcbiAgfVxuICBpZiAoIXByb2R1Y3RzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihzdG9yZUtleSwgYCR7YmFzZVBhdGh9IHZhY1x1MDBFRG9gKTtcbiAgfVxuICByZXR1cm4gcHJvZHVjdHM7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIEhUTUwgLyBzaXRlbWFwICsgSlNPTi1MRCBzY3JhcGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IFNJVEVNQVBfQ0FORElEQVRFUyA9IFtcbiAgXCIvcHJvZHVjdC1zaXRlbWFwLnhtbFwiLFxuICBcIi93cC1zaXRlbWFwLXBvc3RzLXByb2R1Y3QtMS54bWxcIixcbiAgXCIvc2l0ZW1hcC1wcm9kdWN0cy54bWxcIixcbiAgXCIvc2l0ZW1hcF9wcm9kdWN0c18xLnhtbFwiLCAvLyBTaG9waWZ5LXN0eWxlLCBidXQgYWxzbyB1c2VkIGJ5IG90aGVyc1xuICBcIi9zaXRlbWFwX2luZGV4LnhtbFwiLFxuICBcIi9zaXRlbWFwLnhtbFwiLFxuXTtcblxuY29uc3QgUFJPRFVDVF9VUkxfSElOVFMgPVxuICAvXFwvKHByb2R1Y3RvfHByb2R1Y3Rvc3xwcm9kdWN0fHByb2R1Y3RzfHRpZW5kYXxzaG9wfGdhbWV8anVlZ298aXRlbSlcXC8vaTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hUZXh0KHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgIGFjY2VwdDogXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcbiAgICAgICAgXCJhY2NlcHQtbGFuZ3VhZ2VcIjogXCJlcy1DTCxlcztxPTAuOSxlbjtxPTAuOFwiLFxuICAgICAgICBcInNlYy1mZXRjaC1kZXN0XCI6IFwiZG9jdW1lbnRcIixcbiAgICAgICAgXCJzZWMtZmV0Y2gtbW9kZVwiOiBcIm5hdmlnYXRlXCIsXG4gICAgICAgIFwic2VjLWZldGNoLXNpdGVcIjogXCJub25lXCIsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGlmICghci5vaykgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGF3YWl0IHIudGV4dCgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlU2l0ZW1hcFVybHMoZG9tYWluOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcXVldWU6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgcGF0aCBvZiBTSVRFTUFQX0NBTkRJREFURVMpIHtcbiAgICBxdWV1ZS5wdXNoKGBodHRwczovLyR7ZG9tYWlufSR7cGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IHVybHM6IHN0cmluZ1tdID0gW107XG4gIHdoaWxlIChxdWV1ZS5sZW5ndGggJiYgdXJscy5sZW5ndGggPCAyMDAwKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHF1ZXVlLnNoaWZ0KCkhO1xuICAgIGlmIChzZWVuLmhhcyhjdXJyZW50KSkgY29udGludWU7XG4gICAgc2Vlbi5hZGQoY3VycmVudCk7XG4gICAgY29uc3QgeG1sID0gYXdhaXQgZmV0Y2hUZXh0KGN1cnJlbnQpO1xuICAgIGlmICgheG1sKSBjb250aW51ZTtcblxuICAgIC8vIFNpdGVtYXAgaW5kZXggXHUyMTkyIDxzaXRlbWFwPjxsb2M+Li4uPC9sb2M+PC9zaXRlbWFwPlxuICAgIGNvbnN0IG5lc3RlZCA9IEFycmF5LmZyb20oXG4gICAgICB4bWwubWF0Y2hBbGwoLzxzaXRlbWFwW14+XSo+W1xcc1xcU10qPzxsb2M+KFtcXHNcXFNdKj8pPFxcL2xvYz5bXFxzXFxTXSo/PFxcL3NpdGVtYXA+L2dpKVxuICAgICkubWFwKChtKSA9PiBtWzFdLnRyaW0oKSk7XG4gICAgZm9yIChjb25zdCBuIG9mIG5lc3RlZCkge1xuICAgICAgaWYgKC9wcm9kdWN0fHNpdGVtYXBbLV9dXFxkK3xwYWdlLXNpdGVtYXAvaS50ZXN0KG4pIHx8IG5lc3RlZC5sZW5ndGggPCAxMCkge1xuICAgICAgICBxdWV1ZS5wdXNoKG4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVSTCBzZXQgXHUyMTkyIDx1cmw+PGxvYz4uLi48L2xvYz48L3VybD5cbiAgICBjb25zdCBpdGVtcyA9IEFycmF5LmZyb20oXG4gICAgICB4bWwubWF0Y2hBbGwoLzx1cmxbXj5dKj5bXFxzXFxTXSo/PGxvYz4oW1xcc1xcU10qPyk8XFwvbG9jPltcXHNcXFNdKj88XFwvdXJsPi9naSlcbiAgICApLm1hcCgobSkgPT4gbVsxXS50cmltKCkpO1xuICAgIGZvciAoY29uc3QgdSBvZiBpdGVtcykgdXJscy5wdXNoKHUpO1xuICB9XG5cbiAgLy8gS2VlcCBsaWtlbHktcHJvZHVjdCBVUkxzIGZpcnN0LiBGYWxsIGJhY2sgdG8gZXZlcnl0aGluZyBpZiBubyBoaW50IG1hdGNoZXMuXG4gIGNvbnN0IGhpbnRlZCA9IHVybHMuZmlsdGVyKCh1KSA9PiBQUk9EVUNUX1VSTF9ISU5UUy50ZXN0KHUpKTtcbiAgY29uc3QgcG9vbCA9IGhpbnRlZC5sZW5ndGggPj0gMTAgPyBoaW50ZWQgOiB1cmxzO1xuXG4gIC8vIERlZHVwbGljYXRlIHByZXNlcnZpbmcgb3JkZXJcbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkZWR1cCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHUgb2YgcG9vbCkge1xuICAgIGlmIChkZWR1cC5oYXModSkpIGNvbnRpbnVlO1xuICAgIGRlZHVwLmFkZCh1KTtcbiAgICBvdXQucHVzaCh1KTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5pbnRlcmZhY2UgSnNvbkxkUHJvZHVjdCB7XG4gIFwiQHR5cGVcIj86IHN0cmluZyB8IHN0cmluZ1tdO1xuICBuYW1lPzogc3RyaW5nO1xuICBvZmZlcnM/OlxuICAgIHwge1xuICAgICAgICBwcmljZT86IHN0cmluZyB8IG51bWJlcjtcbiAgICAgICAgbG93UHJpY2U/OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgICAgIHByaWNlQ3VycmVuY3k/OiBzdHJpbmc7XG4gICAgICAgIGF2YWlsYWJpbGl0eT86IHN0cmluZztcbiAgICAgIH1cbiAgICB8IEFycmF5PHtcbiAgICAgICAgcHJpY2U/OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgICAgIHByaWNlQ3VycmVuY3k/OiBzdHJpbmc7XG4gICAgICAgIGF2YWlsYWJpbGl0eT86IHN0cmluZztcbiAgICAgIH0+O1xufVxuXG5mdW5jdGlvbiBpc1Byb2R1Y3ROb2RlKG46IHVua25vd24pOiBuIGlzIEpzb25MZFByb2R1Y3Qge1xuICBpZiAoIW4gfHwgdHlwZW9mIG4gIT09IFwib2JqZWN0XCIpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgdCA9IChuIGFzIEpzb25MZFByb2R1Y3QpW1wiQHR5cGVcIl07XG4gIGlmICghdCkgcmV0dXJuIGZhbHNlO1xuICBpZiAoQXJyYXkuaXNBcnJheSh0KSkgcmV0dXJuIHQuc29tZSgoeCkgPT4gL3Byb2R1Y3QvaS50ZXN0KHgpKTtcbiAgcmV0dXJuIC9wcm9kdWN0L2kudGVzdChTdHJpbmcodCkpO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0UHJvZHVjdEZyb21IdG1sKFxuICBodG1sOiBzdHJpbmcsXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIHVybDogc3RyaW5nXG4pOiBDb21wZXRpdG9yUHJvZHVjdCB8IG51bGwge1xuICBjb25zdCBzY3JpcHRzID0gQXJyYXkuZnJvbShcbiAgICBodG1sLm1hdGNoQWxsKFxuICAgICAgLzxzY3JpcHRbXj5dKnR5cGU9W1wiJ11hcHBsaWNhdGlvblxcL2xkXFwranNvbltcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vZ2lcbiAgICApXG4gICk7XG4gIGZvciAoY29uc3QgbSBvZiBzY3JpcHRzKSB7XG4gICAgbGV0IHBhcnNlZDogdW5rbm93bjtcbiAgICB0cnkge1xuICAgICAgcGFyc2VkID0gSlNPTi5wYXJzZShtWzFdLnRyaW0oKSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgaXRlbXM6IHVua25vd25bXSA9IFtdO1xuICAgIGNvbnN0IGdyYXBoID0gKHBhcnNlZCBhcyB7IFwiQGdyYXBoXCI/OiB1bmtub3duW10gfSk/LltcIkBncmFwaFwiXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShncmFwaCkpIGl0ZW1zLnB1c2goLi4uZ3JhcGgpO1xuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocGFyc2VkKSkgaXRlbXMucHVzaCguLi5wYXJzZWQpO1xuICAgIGVsc2UgaXRlbXMucHVzaChwYXJzZWQpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBpZiAoIWlzUHJvZHVjdE5vZGUoaXRlbSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgcCA9IGl0ZW0gYXMgSnNvbkxkUHJvZHVjdDtcbiAgICAgIGNvbnN0IG5hbWUgPSBwLm5hbWU7XG4gICAgICBsZXQgcHJpY2VSYXc6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgIGxldCBhdmFpbGFiaWxpdHkgPSBcIlwiO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocC5vZmZlcnMpKSB7XG4gICAgICAgIHByaWNlUmF3ID0gcC5vZmZlcnNbMF0/LnByaWNlO1xuICAgICAgICBhdmFpbGFiaWxpdHkgPSBwLm9mZmVyc1swXT8uYXZhaWxhYmlsaXR5ID8/IFwiXCI7XG4gICAgICB9IGVsc2UgaWYgKHAub2ZmZXJzKSB7XG4gICAgICAgIHByaWNlUmF3ID0gcC5vZmZlcnMucHJpY2UgPz8gcC5vZmZlcnMubG93UHJpY2U7XG4gICAgICAgIGF2YWlsYWJpbGl0eSA9IHAub2ZmZXJzLmF2YWlsYWJpbGl0eSA/PyBcIlwiO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJpY2UgPSBwYXJzZUNscChwcmljZVJhdyk7XG4gICAgICBpZiAoIW5hbWUgfHwgcHJpY2UgPT0gbnVsbCkgY29udGludWU7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgdGl0bGU6IFN0cmluZyhuYW1lKSxcbiAgICAgICAgdXJsLFxuICAgICAgICBwcmljZUNscDogcHJpY2UsXG4gICAgICAgIGF2YWlsYWJsZTogIS9vdXRvZnN0b2NrL2kudGVzdChhdmFpbGFiaWxpdHkpLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBGYWxsYmFjazogT3BlbkdyYXBoIC8gaXRlbXByb3AgbWV0YVxuICBjb25zdCBvZ1RpdGxlID0gLzxtZXRhW14+XStwcm9wZXJ0eT1bXCInXW9nOnRpdGxlW1wiJ11bXj5dK2NvbnRlbnQ9W1wiJ10oW15cIiddKylbXCInXS9pLmV4ZWMoXG4gICAgaHRtbFxuICApPy5bMV07XG4gIGNvbnN0IG9nUHJpY2UgPVxuICAgIC88bWV0YVtePl0rcHJvcGVydHk9W1wiJ11wcm9kdWN0OnByaWNlOmFtb3VudFtcIiddW14+XStjb250ZW50PVtcIiddKFteXCInXSspW1wiJ10vaS5leGVjKFxuICAgICAgaHRtbFxuICAgICk/LlsxXSB8fFxuICAgIC88bWV0YVtePl0raXRlbXByb3A9W1wiJ11wcmljZVtcIiddW14+XStjb250ZW50PVtcIiddKFteXCInXSspW1wiJ10vaS5leGVjKGh0bWwpPy5bMV07XG4gIGlmIChvZ1RpdGxlICYmIG9nUHJpY2UpIHtcbiAgICBjb25zdCBwcmljZSA9IHBhcnNlQ2xwKG9nUHJpY2UpO1xuICAgIGlmIChwcmljZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4geyBzdG9yZUtleSwgdGl0bGU6IG9nVGl0bGUsIHVybCwgcHJpY2VDbHA6IHByaWNlLCBhdmFpbGFibGU6IHRydWUgfTtcbiAgICB9XG4gIH1cblxuICAvLyBGYWxsYmFjazogSFRNTCB0aXRsZSArIHByaWNlIHBhdHRlcm4gKHdvcmtzIGZvciBKdW1wc2VsbGVyIGFuZCBvdGhlciBwbGF0Zm9ybXMpXG4gIGNvbnN0IHRpdGxlVGFnID0gLzx0aXRsZVtePl0qPihbXjxdKyk8XFwvdGl0bGU+L2kuZXhlYyhodG1sKT8uWzFdPy50cmltKCk7XG4gIGNvbnN0IGgxVGFnID0gLzxoMVtePl0qPihbXjxdKyk8XFwvaDE+L2kuZXhlYyhodG1sKT8uWzFdPy50cmltKCk7XG4gIGNvbnN0IHByb2R1Y3RUaXRsZSA9IGgxVGFnIHx8IHRpdGxlVGFnO1xuICBpZiAocHJvZHVjdFRpdGxlKSB7XG4gICAgLy8gTG9vayBmb3IgcHJpY2UgaW4gY29tbW9uIHBhdHRlcm5zOiAkWFguWFhYIG9yICRYWCxYWFggKENMUCBmb3JtYXQpXG4gICAgY29uc3QgcHJpY2VQYXR0ZXJucyA9IFtcbiAgICAgIC9jbGFzcz1bXCInXVteXCInXSooPzpwcmljZXxwcmVjaW8pW15cIiddKltcIiddW14+XSo+XFxzKlxcJD9cXHMqKFtcXGQuLF0rKS9pLFxuICAgICAgL2l0ZW1wcm9wPVtcIiddcHJpY2VbXCInXVtePl0qPlxccypcXCQ/XFxzKihbXFxkLixdKykvaSxcbiAgICAgIC9kYXRhLXByaWNlPVtcIiddKFtcXGQuLF0rKVtcIiddL2ksXG4gICAgICAvXFxicHJlY2lvW148XSpcXCRcXHMqKFtcXGQuLF0rKS9pLFxuICAgIF07XG4gICAgZm9yIChjb25zdCByZSBvZiBwcmljZVBhdHRlcm5zKSB7XG4gICAgICBjb25zdCBwbSA9IHJlLmV4ZWMoaHRtbCk7XG4gICAgICBpZiAocG0pIHtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBwYXJzZUNscChwbVsxXSk7XG4gICAgICAgIGlmIChwcmljZSAhPSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgY2xlYW5UaXRsZSA9IHByb2R1Y3RUaXRsZVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xccypbLVx1MjAxM3xcdTAwQjddLiokLywgXCJcIilcbiAgICAgICAgICAgIC50cmltKCk7XG4gICAgICAgICAgcmV0dXJuIHsgc3RvcmVLZXksIHRpdGxlOiBjbGVhblRpdGxlLCB1cmwsIHByaWNlQ2xwOiBwcmljZSwgYXZhaWxhYmxlOiB0cnVlIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hIdG1sU3RvcmVmcm9udChcbiAgc3RvcmVLZXk6IHN0cmluZyxcbiAgZG9tYWluOiBzdHJpbmdcbik6IFByb21pc2U8Q29tcGV0aXRvclByb2R1Y3RbXT4ge1xuICBjb25zdCB1cmxzID0gYXdhaXQgcmVzb2x2ZVNpdGVtYXBVcmxzKGRvbWFpbik7XG4gIGlmICghdXJscy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgICBzdG9yZUtleSxcbiAgICAgIGAke2RvbWFpbn0gbm8gZXhwb25lIHNpdGVtYXAueG1sIGNvbiBVUkxzIGRlIHByb2R1Y3Rvc2BcbiAgICApO1xuICB9XG4gIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4odXJscy5sZW5ndGgsIDQwMCk7XG4gIGNvbnN0IGNvbmN1cnJlbmN5ID0gNjtcbiAgY29uc3Qgb3V0OiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW1pdDsgaSArPSBjb25jdXJyZW5jeSkge1xuICAgIGNvbnN0IGJhdGNoID0gdXJscy5zbGljZShpLCBpICsgY29uY3VycmVuY3kpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIGJhdGNoLm1hcChhc3luYyAodSkgPT4ge1xuICAgICAgICBjb25zdCBodG1sID0gYXdhaXQgZmV0Y2hUZXh0KHUpO1xuICAgICAgICBpZiAoIWh0bWwpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gZXh0cmFjdFByb2R1Y3RGcm9tSHRtbChodG1sLCBzdG9yZUtleSwgdSk7XG4gICAgICB9KVxuICAgICk7XG4gICAgZm9yIChjb25zdCBwIG9mIHJlc3VsdHMpIGlmIChwKSBvdXQucHVzaChwKTtcbiAgfVxuICBpZiAoIW91dC5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgICBzdG9yZUtleSxcbiAgICAgIGAke2RvbWFpbn06IHNpdGVtYXAgZW5jb250cmFkbyBwZXJvIG5vIHNlIHB1ZGllcm9uIGV4dHJhZXIgcHJvZHVjdG9zIChzaW4gSlNPTi1MRCBuaSBvZzpwcmljZSlgXG4gICAgKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBKdW1wc2VsbGVyIHNjcmFwZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hKdW1wc2VsbGVyKFxuICBzdG9yZUtleTogc3RyaW5nLFxuICBkb21haW46IHN0cmluZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGNvbnN0IGJhc2UgPSBgaHR0cHM6Ly8ke2RvbWFpbn1gO1xuXG4gIC8vIFN0ZXAgMTogRmV0Y2ggaG9tZXBhZ2UgdG8gZGlzY292ZXIgY2F0ZWdvcnkgbGlua3NcbiAgY29uc3QgaG9tZUh0bWwgPSBhd2FpdCBmZXRjaFRleHQoYmFzZSArIFwiL1wiKTtcbiAgY29uc3QgY2F0ZWdvcmllczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGhvbWVIdG1sKSB7XG4gICAgY29uc3QgY2F0UmVnZXggPSAvaHJlZj1bXCInXShcXC9jYXRlZ29yaWFzXFwvW15cIic/I10rKVtcIiddL2dpO1xuICAgIGxldCBtO1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICB3aGlsZSAoKG0gPSBjYXRSZWdleC5leGVjKGhvbWVIdG1sKSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHBhdGggPSBtWzFdLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gICAgICBpZiAoIXNlZW4uaGFzKHBhdGgpKSB7XG4gICAgICAgIHNlZW4uYWRkKHBhdGgpO1xuICAgICAgICBjYXRlZ29yaWVzLnB1c2gocGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQWx3YXlzIGluY2x1ZGUgL2NhdGVnb3JpYXMvIHJvb3QgYXMgZmFsbGJhY2tcbiAgaWYgKCFjYXRlZ29yaWVzLmluY2x1ZGVzKFwiL2NhdGVnb3JpYXNcIikpIGNhdGVnb3JpZXMudW5zaGlmdChcIi9jYXRlZ29yaWFzXCIpO1xuXG4gIGNvbnN0IHByb2R1Y3RzOiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG4gIGNvbnN0IHNlZW5VcmxzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG1heENhdGVnb3JpZXMgPSAyMDtcbiAgY29uc3QgbWF4UGFnZXMgPSA1MDtcblxuICBmb3IgKGNvbnN0IGNhdCBvZiBjYXRlZ29yaWVzLnNsaWNlKDAsIG1heENhdGVnb3JpZXMpKSB7XG4gICAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgICAgY29uc3QgdXJsID0gYCR7YmFzZX0ke2NhdH0/cGFnZT0ke3BhZ2V9YDtcbiAgICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBmZXRjaFRleHQodXJsKTtcbiAgICAgIGlmICghaHRtbCkgYnJlYWs7XG5cbiAgICAgIC8vIEV4dHJhY3QgcHJvZHVjdCBjYXJkcyBcdTIwMTQgSnVtcHNlbGxlciB1c2VzIHZhcmlvdXMgcGF0dGVybnNcbiAgICAgIGxldCBmb3VuZE9uUGFnZSA9IDA7XG5cbiAgICAgIC8vIFBhdHRlcm4gQTogcHJvZHVjdCBsaW5rcyB3aXRoIC9wcm9kdWN0b3MvIGhyZWZcbiAgICAgIGNvbnN0IHByb2R1Y3RCbG9ja1JlZ2V4ID1cbiAgICAgICAgL2hyZWY9W1wiJ10oXFwvcHJvZHVjdG9zXFwvW15cIic/I10rKVtcIiddW15dKj8oPz1ocmVmPVtcIiddXFwvcHJvZHVjdG9zXFwvfCQpL2dpO1xuICAgICAgbGV0IGJsb2NrOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICAgICAgY29uc3QgcHJvZHVjdExpbmtzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgbGlua1JlZ2V4ID0gL2hyZWY9W1wiJ10oXFwvcHJvZHVjdG9zXFwvW15cIic/I10rKVtcIiddL2dpO1xuICAgICAgbGV0IGxtO1xuICAgICAgd2hpbGUgKChsbSA9IGxpbmtSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBwVXJsID0gYmFzZSArIGxtWzFdO1xuICAgICAgICBpZiAoIXNlZW5VcmxzLmhhcyhwVXJsKSkge1xuICAgICAgICAgIHNlZW5VcmxzLmFkZChwVXJsKTtcbiAgICAgICAgICBwcm9kdWN0TGlua3MucHVzaChsbVsxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRm9yIGVhY2ggcHJvZHVjdCBsaW5rLCBleHRyYWN0IHRpdGxlICsgcHJpY2UgZnJvbSBpdHMgc3Vycm91bmRpbmcgY29udGV4dFxuICAgICAgZm9yIChjb25zdCBsaW5rIG9mIHByb2R1Y3RMaW5rcykge1xuICAgICAgICBjb25zdCBlc2NhcGVkTGluayA9IGxpbmsucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICAgICAgICBjb25zdCBjdHhSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgYGhyZWY9W1wiJ10ke2VzY2FwZWRMaW5rfVtcIiddW1xcXFxzXFxcXFNdezAsMTAwMH1gXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGN0eCA9IGN0eFJlZ2V4LmV4ZWMoaHRtbCk/LlswXSA/PyBcIlwiO1xuXG4gICAgICAgIC8vIFRpdGxlOiBsb29rIGZvciBwcm9kdWN0IG5hbWUgcGF0dGVybnNcbiAgICAgICAgY29uc3QgdGl0bGVNYXRjaCA9XG4gICAgICAgICAgL2NsYXNzPVtcIiddW15cIiddKig/OnRpdGxlfG5vbWJyZXxuYW1lKVteXCInXSpbXCInXVtePl0qPihbXjxdezMsMTAwfSk8Ly5leGVjKGN0eCkgfHxcbiAgICAgICAgICAvYWx0PVtcIiddKFteXCInXXszLDEwMH0pW1wiJ10vLmV4ZWMoY3R4KSB8fFxuICAgICAgICAgIC88c3BhbltePl0qPihbXjxdezMsODB9KTxcXC9zcGFuPi8uZXhlYyhjdHgpO1xuICAgICAgICBjb25zdCB0aXRsZSA9IHRpdGxlTWF0Y2g/LlsxXT8udHJpbSgpO1xuXG4gICAgICAgIC8vIFByaWNlOiBsb29rIGZvciBDTFAgcHJpY2UgcGF0dGVybnNcbiAgICAgICAgY29uc3QgcHJpY2VNYXRjaCA9XG4gICAgICAgICAgL2NsYXNzPVtcIiddW15cIiddKig/OnByaWNlfHByZWNpbylbXlwiJ10qW1wiJ11bXj5dKj5bXFxzJF0qKFtcXGQuLF0rKS8uZXhlYyhjdHgpIHx8XG4gICAgICAgICAgL1xcJFxccyooW1xcZC4sXSspLy5leGVjKGN0eCkgfHxcbiAgICAgICAgICAvZGF0YS1wcmljZT1bXCInXShbXFxkLixdKylbXCInXS8uZXhlYyhjdHgpO1xuICAgICAgICBjb25zdCBwcmljZSA9IHBhcnNlQ2xwKHByaWNlTWF0Y2g/LlsxXSk7XG5cbiAgICAgICAgaWYgKHRpdGxlICYmIHByaWNlICE9IG51bGwpIHtcbiAgICAgICAgICBwcm9kdWN0cy5wdXNoKHtcbiAgICAgICAgICAgIHN0b3JlS2V5LFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICB1cmw6IGJhc2UgKyBsaW5rLFxuICAgICAgICAgICAgcHJpY2VDbHA6IHByaWNlLFxuICAgICAgICAgICAgYXZhaWxhYmxlOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGZvdW5kT25QYWdlKys7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZvdW5kT25QYWdlID09PSAwKSBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoIXByb2R1Y3RzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgIHN0b3JlS2V5LFxuICAgICAgYCR7ZG9tYWlufTogbm8gc2UgZW5jb250cmFyb24gcHJvZHVjdG9zIGVuIEp1bXBzZWxsZXIgKHNpbiAvcHJvZHVjdG9zLyBlbiBlbCBIVE1MKWBcbiAgICApO1xuICB9XG4gIHJldHVybiBwcm9kdWN0cztcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gcHVibGljIEFQSSAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hDb21wZXRpdG9yKFxuICBjZmc6IENvbXBldGl0b3JDb25maWdcbik6IFByb21pc2U8Q29tcGV0aXRvclByb2R1Y3RbXT4ge1xuICBpZiAoY2ZnLnR5cGUgPT09IFwic2hvcGlmeVwiKSByZXR1cm4gZmV0Y2hTaG9waWZ5KGNmZy5rZXksIGNmZy5kb21haW4pO1xuICBpZiAoY2ZnLnR5cGUgPT09IFwid29vY29tbWVyY2VcIikgcmV0dXJuIGZldGNoV29vKGNmZy5rZXksIGNmZy5kb21haW4pO1xuICBpZiAoY2ZnLnR5cGUgPT09IFwiaHRtbFwiKSByZXR1cm4gZmV0Y2hIdG1sU3RvcmVmcm9udChjZmcua2V5LCBjZmcuZG9tYWluKTtcbiAgaWYgKGNmZy50eXBlID09PSBcImp1bXBzZWxsZXJcIikgcmV0dXJuIGZldGNoSnVtcHNlbGxlcihjZmcua2V5LCBjZmcuZG9tYWluKTtcblxuICAvLyBhdXRvOiBkZXRlY3QgSnVtcHNlbGxlciBieSBob21lcGFnZSBmaW5nZXJwcmludCwgdGhlbiBzaG9waWZ5IFx1MjE5MiB3b28gXHUyMTkyIGh0bWwgZmFsbGJhY2tcbiAgY29uc3QgaG9tZUh0bWwgPSBhd2FpdCBmZXRjaFRleHQoYGh0dHBzOi8vJHtjZmcuZG9tYWlufS9gKTtcbiAgaWYgKGhvbWVIdG1sICYmICgvXFwvcHJvZHVjdG9zXFwvL2kudGVzdChob21lSHRtbCkgfHwgL1xcL2NhdGVnb3JpYXNcXC8vaS50ZXN0KGhvbWVIdG1sKSkpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGZldGNoSnVtcHNlbGxlcihjZmcua2V5LCBjZmcuZG9tYWluKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgQ29tcGV0aXRvckZldGNoRXJyb3IpKSB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBmbiBvZiBbZmV0Y2hTaG9waWZ5LCBmZXRjaFdvbywgZmV0Y2hIdG1sU3RvcmVmcm9udF0pIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGZuKGNmZy5rZXksIGNmZy5kb21haW4pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBDb21wZXRpdG9yRmV0Y2hFcnJvcikpIHRocm93IGU7XG4gICAgICBlcnJvcnMucHVzaChlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgY2ZnLmtleSxcbiAgICBgbm8gc2UgcHVkbyBzY3JhcGVhciAke2NmZy5kb21haW59OiAke2Vycm9ycy5qb2luKFwiIFx1MDBCNyBcIil9YFxuICApO1xufVxuXG4vKipcbiAqIEJ1aWxkIHtnYW1lSWQgLT4gbWF0Y2hlc1tdfSBmb3IgYSBsaXN0IG9mIFBTTiBnYW1lcyBhbmQgdGhlIGNvbWJpbmVkIHBvb2xcbiAqIG9mIGNvbXBldGl0b3IgcHJvZHVjdHMgKGZyb20gYWxsIGVuYWJsZWQgc3RvcmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoR2FtZXMoXG4gIGdhbWVzOiBHYW1lW10sXG4gIHByb2R1Y3RzOiBDb21wZXRpdG9yUHJvZHVjdFtdXG4pOiBSZWNvcmQ8c3RyaW5nLCBDb21wZXRpdG9yTWF0Y2hbXT4ge1xuICAvLyBQcmVjb21wdXRlIHRva2VucyBvbmNlIHBlciBwcm9kdWN0LlxuICBjb25zdCBwcm9kdWN0VG9rZW5zOiBBcnJheTx7IHA6IENvbXBldGl0b3JQcm9kdWN0OyB0b2tlbnM6IHN0cmluZ1tdIH0+ID1cbiAgICBwcm9kdWN0cy5tYXAoKHApID0+ICh7IHAsIHRva2VuczogdG9rZW5pemUocC50aXRsZSkgfSkpO1xuXG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgQ29tcGV0aXRvck1hdGNoW10+ID0ge307XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgIGNvbnN0IGdUb2tlbnMgPSB0b2tlbml6ZShnLm5hbWUpO1xuICAgIGlmICghZ1Rva2Vucy5sZW5ndGgpIGNvbnRpbnVlO1xuICAgIGNvbnN0IG1hdGNoZXM6IENvbXBldGl0b3JNYXRjaFtdID0gW107XG4gICAgZm9yIChjb25zdCB7IHAsIHRva2VucyB9IG9mIHByb2R1Y3RUb2tlbnMpIHtcbiAgICAgIGlmICghdG9rZW5zLmxlbmd0aCkgY29udGludWU7XG4gICAgICBjb25zdCBzY29yZSA9IHNpbWlsYXJpdHkoZ1Rva2VucywgdG9rZW5zKTtcbiAgICAgIGlmIChzY29yZSA+PSBNQVRDSF9USFJFU0hPTEQpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBzdG9yZUtleTogcC5zdG9yZUtleSxcbiAgICAgICAgICB0aXRsZTogcC50aXRsZSxcbiAgICAgICAgICB1cmw6IHAudXJsLFxuICAgICAgICAgIHByaWNlQ2xwOiBwLnByaWNlQ2xwLFxuICAgICAgICAgIGF2YWlsYWJsZTogcC5hdmFpbGFibGUsXG4gICAgICAgICAgc2NvcmUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBLZWVwIGF0IG1vc3QgdG9wLTUgcGVyIGdhbWUgdG8gbGltaXQgcGF5bG9hZCBzaXplLlxuICAgIG1hdGNoZXMuc29ydCgoYSwgYikgPT4gYS5wcmljZUNscCAtIGIucHJpY2VDbHApO1xuICAgIG91dFtnLmlkXSA9IG1hdGNoZXMuc2xpY2UoMCwgNSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi1wcm9kdWN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi1wcm9kdWN0LnRzXCI7LyoqXG4gKiBQU04gcHJvZHVjdCBkZXRhaWwgc2NyYXBlci5cbiAqXG4gKiBUaGUgcHJvZHVjdCBwYWdlIChzdG9yZS5wbGF5c3RhdGlvbi5jb20vPHJlZ2lvbj4vcHJvZHVjdC88aWQ+KSBpcyBTU1InZFxuICogYnkgTmV4dC5qcyBqdXN0IGxpa2UgdGhlIGNhdGVnb3J5IHBhZ2VzIFx1MjAxNCB0aGUgZnVsbCBwcm9kdWN0IEpTT04gc2l0c1xuICogaW5zaWRlIGA8c2NyaXB0IGlkPVwiX19ORVhUX0RBVEFfX1wiPmAuIFdlIHdhbGsgdGhhdCB0cmVlIHRvIGZpbmQgdGhlXG4gKiBvYmplY3QgbWF0Y2hpbmcgb3VyIHRhcmdldCBpZCBhbmQgbm9ybWFsaXplIGl0cyBmaWVsZHMuXG4gKlxuICogZmlsZVNpemUgaXMgdGhlIG9uZSB0aGluZyBQU04gZG9lc24ndCBwdXQgaW4gc3RydWN0dXJlZCBkYXRhIG9uIGVuLVVTO1xuICogd2UgcmVjb3ZlciBpdCBmcm9tIHRoZSB2aXNpYmxlIEhUTUwgd2l0aCBhIHJlZ2V4IGZhbGxiYWNrLlxuICovXG5pbXBvcnQgeyBQc25BcGlFcnJvciB9IGZyb20gXCIuL3BzblwiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y3RNZWRpYSB7XG4gIGhlcm9Vcmw6IHN0cmluZyB8IG51bGw7XG4gIGxvZ29Vcmw6IHN0cmluZyB8IG51bGw7XG4gIGJhY2tncm91bmRVcmw6IHN0cmluZyB8IG51bGw7XG4gIGNvdmVyVXJsOiBzdHJpbmcgfCBudWxsO1xuICBwb3J0cmFpdFVybDogc3RyaW5nIHwgbnVsbDtcbiAgc2NyZWVuc2hvdHM6IHN0cmluZ1tdO1xuICB2aWRlb3M6IEFycmF5PHsgdXJsOiBzdHJpbmc7IHBvc3RlclVybDogc3RyaW5nIHwgbnVsbDsgbWltZVR5cGU6IHN0cmluZyB8IG51bGwgfT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjdERldGFpbCB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZzsgLy8gc2FuaXRpemVkIEhUTUxcbiAgc2hvcnREZXNjcmlwdGlvbjogc3RyaW5nIHwgbnVsbDtcbiAgcHVibGlzaGVyOiBzdHJpbmcgfCBudWxsO1xuICBkZXZlbG9wZXI6IHN0cmluZyB8IG51bGw7XG4gIHJlbGVhc2VEYXRlOiBzdHJpbmcgfCBudWxsO1xuICBnZW5yZXM6IHN0cmluZ1tdO1xuICB2b2ljZUxhbmd1YWdlczogc3RyaW5nW107XG4gIHN1YnRpdGxlTGFuZ3VhZ2VzOiBzdHJpbmdbXTtcbiAgYWdlUmF0aW5nOiBzdHJpbmcgfCBudWxsO1xuICBjb250ZW50RGVzY3JpcHRvcnM6IHN0cmluZ1tdO1xuICBpbnRlcmFjdGl2ZUVsZW1lbnRzOiBzdHJpbmdbXTtcbiAgcGxheWVyQ291bnQ6IHN0cmluZyB8IG51bGw7XG4gIG9ubGluZVBsYXllckNvdW50OiBzdHJpbmcgfCBudWxsO1xuICBwc1BsdXNSZXF1aXJlZDogYm9vbGVhbjtcbiAgaW5HYW1lUHVyY2hhc2VzOiBzdHJpbmcgfCBudWxsO1xuICBnYW1lRmVhdHVyZXM6IHN0cmluZ1tdO1xuICBwc1ZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIGZpbGVTaXplOiBzdHJpbmcgfCBudWxsO1xuICBwbGF0Zm9ybXM6IHN0cmluZztcbiAgbWVkaWE6IFByb2R1Y3RNZWRpYTtcbiAgY2Fyb3VzZWxJbWFnZXM6IHN0cmluZ1tdO1xuICBzdG9yZVVybDogc3RyaW5nO1xuICBkaXNjb3VudEVuZEF0OiBzdHJpbmcgfCBudWxsO1xuICBmZXRjaGVkQXQ6IHN0cmluZztcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hIdG1sKHVybDogc3RyaW5nLCByZWdpb246IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGxldCBsYXN0RXJyOiB1bmtub3duID0gbnVsbDtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICAgIGFjY2VwdDpcbiAgICAgICAgICAgIFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksKi8qO3E9MC44XCIsXG4gICAgICAgICAgXCJhY2NlcHQtbGFuZ3VhZ2VcIjogcmVnaW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcImVzXCIpID8gXCJlc1wiIDogXCJlbi1VU1wiLFxuICAgICAgICAgIFwieC1wc24tc3RvcmUtbG9jYWxlLW92ZXJyaWRlXCI6IHJlZ2lvbixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgaWYgKHIuc3RhdHVzID09PSA0MDQpIHRocm93IG5ldyBQc25BcGlFcnJvcihgUHJvZHVjdCBub3QgZm91bmQgKDQwNCk6ICR7dXJsfWApO1xuICAgICAgaWYgKHIuc3RhdHVzID09PSA0MDMpXG4gICAgICAgIHRocm93IG5ldyBQc25BcGlFcnJvcihcIlBTTiByZXR1cm5lZCA0MDMgKElQL0Nsb3VkZmxhcmUgYmxvY2spXCIpO1xuICAgICAgaWYgKHIuc3RhdHVzID49IDUwMCkgdGhyb3cgbmV3IEVycm9yKGBQU04gJHtyLnN0YXR1c31gKTtcbiAgICAgIHJldHVybiBhd2FpdCByLnRleHQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFBzbkFwaUVycm9yKSB0aHJvdyBlO1xuICAgICAgbGFzdEVyciA9IGU7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNDAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBQc25BcGlFcnJvcihcbiAgICBgUFNOIHByb2R1Y3QgZmV0Y2ggZmFpbGVkOiAkeyhsYXN0RXJyIGFzIEVycm9yKT8ubWVzc2FnZSB8fCBsYXN0RXJyfWBcbiAgKTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE5leHREYXRhKGh0bWw6IHN0cmluZyk6IGFueSB8IG51bGwge1xuICBjb25zdCBtID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoXG4gICAgaHRtbFxuICApO1xuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKG1bMV0pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKiogV2FsayB0aGUgdHJlZSBjb2xsZWN0aW5nIGV2ZXJ5IG9iamVjdCB3aG9zZSBgaWRgIG1hdGNoZXMgdGFyZ2V0SWQuXG4gKiAgVGhlIHBhZ2UgZW1iZWRzIHRoZSBzYW1lIHByb2R1Y3Qgc2V2ZXJhbCB0aW1lcyAoaGVhZGVyLCBoZXJvLCByZWxhdGVkXG4gKiAgbGlua3MpOyB3ZSBwaWNrIHRoZSByaWNoZXN0IHJlY29yZCBieSB0b3RhbCBrZXkgY291bnQuICovXG5mdW5jdGlvbiBmaW5kUHJvZHVjdFJlY29yZHModHJlZTogdW5rbm93biwgdGFyZ2V0SWQ6IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W10ge1xuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W10gPSBbXTtcbiAgY29uc3Qgc3RhY2s6IHVua25vd25bXSA9IFt0cmVlXTtcbiAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgIGNvbnN0IG4gPSBzdGFjay5wb3AoKTtcbiAgICBpZiAoIW4pIGNvbnRpbnVlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KG4pKSB7XG4gICAgICBmb3IgKGNvbnN0IHYgb2Ygbikgc3RhY2sucHVzaCh2KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG4gIT09IFwib2JqZWN0XCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IG9iaiA9IG4gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgaWYgKG9iai5pZCA9PT0gdGFyZ2V0SWQgfHwgb2JqLnByb2R1Y3RJZCA9PT0gdGFyZ2V0SWQpIG91dC5wdXNoKG9iaik7XG4gICAgZm9yIChjb25zdCB2IG9mIE9iamVjdC52YWx1ZXMob2JqKSkge1xuICAgICAgaWYgKHYgJiYgdHlwZW9mIHYgPT09IFwib2JqZWN0XCIpIHN0YWNrLnB1c2godik7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHBpY2tSaWNoZXN0KHJlY29yZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W10pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBpZiAoIXJlY29yZHMubGVuZ3RoKSByZXR1cm4gbnVsbDtcbiAgbGV0IGJlc3QgPSByZWNvcmRzWzBdO1xuICBsZXQgYmVzdEtleXMgPSBPYmplY3Qua2V5cyhiZXN0KS5sZW5ndGg7XG4gIGZvciAoY29uc3QgciBvZiByZWNvcmRzKSB7XG4gICAgY29uc3QgayA9IE9iamVjdC5rZXlzKHIpLmxlbmd0aDtcbiAgICBpZiAoayA+IGJlc3RLZXlzKSB7XG4gICAgICBiZXN0ID0gcjtcbiAgICAgIGJlc3RLZXlzID0gaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJlc3Q7XG59XG5cbi8qKiBNZXJnZSBmaWVsZHMgYWNyb3NzIGV2ZXJ5IHJlY29yZCB3aXRoIHRoaXMgaWQgXHUyMDE0IG9uZSBzbG90IG1pZ2h0IGhhdmVcbiAqICBtZWRpYSwgYW5vdGhlciBsb25nRGVzY3JpcHRpb24sIGV0Yy4gUmljaGVzdCB3aW5zIG9uIGNvbmZsaWN0cy4gKi9cbmZ1bmN0aW9uIG1lcmdlUmVjb3JkcyhyZWNvcmRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICBjb25zdCBzb3J0ZWQgPSBbLi4ucmVjb3Jkc10uc29ydChcbiAgICAoYSwgYikgPT4gT2JqZWN0LmtleXMoYSkubGVuZ3RoIC0gT2JqZWN0LmtleXMoYikubGVuZ3RoXG4gICk7XG4gIGNvbnN0IG1lcmdlZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgZm9yIChjb25zdCByIG9mIHNvcnRlZCkge1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHIpKSB7XG4gICAgICBpZiAodiA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgIGlmIChtZXJnZWRba10gPT0gbnVsbCkgbWVyZ2VkW2tdID0gdjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1lcmdlZDtcbn1cblxuaW50ZXJmYWNlIFJhd01lZGlhIHtcbiAgcm9sZT86IHN0cmluZztcbiAgdHlwZT86IHN0cmluZztcbiAgdXJsPzogc3RyaW5nO1xuICBzb3VyY2U/OiB7IHVybD86IHN0cmluZzsgdHlwZT86IHN0cmluZyB9O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0TWVkaWEob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb2R1Y3RNZWRpYSB7XG4gIGNvbnN0IGxpc3QgPSAob2JqLm1lZGlhIGFzIFJhd01lZGlhW10pIHx8IFtdO1xuICBjb25zdCBieVJvbGU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgY29uc3Qgc2NyZWVuc2hvdHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHZpZGVvczogUHJvZHVjdE1lZGlhW1widmlkZW9zXCJdID0gW107XG4gIGxldCBwb3N0ZXJGb3JOZXh0VmlkZW86IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIGZvciAoY29uc3QgbSBvZiBsaXN0KSB7XG4gICAgY29uc3Qgcm9sZSA9IFN0cmluZyhtPy5yb2xlIHx8IFwiXCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3QgdHlwZSA9IFN0cmluZyhtPy50eXBlIHx8IFwiXCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3QgdXJsID0gbT8udXJsIHx8IG0/LnNvdXJjZT8udXJsIHx8IG51bGw7XG5cbiAgICAvLyBWaWRlb3M6IHR5cGUgaXMgdXN1YWxseSBWSURFTyBvciBWSURFT19QUk9NTywgcm9sZSBpcyBQUk9NTy5cbiAgICBpZiAodHlwZS5pbmNsdWRlcyhcIlZJREVPXCIpIHx8IHJvbGUgPT09IFwiUFJPTU9cIikge1xuICAgICAgaWYgKCF1cmwpIGNvbnRpbnVlO1xuICAgICAgdmlkZW9zLnB1c2goe1xuICAgICAgICB1cmwsXG4gICAgICAgIHBvc3RlclVybDogcG9zdGVyRm9yTmV4dFZpZGVvLFxuICAgICAgICBtaW1lVHlwZTogbT8uc291cmNlPy50eXBlIHx8IG51bGwsXG4gICAgICB9KTtcbiAgICAgIHBvc3RlckZvck5leHRWaWRlbyA9IG51bGw7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKCF1cmwpIGNvbnRpbnVlO1xuXG4gICAgLy8gU3Rhc2ggdGhlIGZpcnN0IHJvbGUgaGl0IHNvIHdlIGRvbid0IG92ZXJ3cml0ZSBoZXJvIHdpdGggYSBsYXRlclxuICAgIC8vIE1BU1RFUiB0aGF0IG1pZ2h0IGJlIGxvd2VyIHF1YWxpdHkuXG4gICAgaWYgKCFieVJvbGVbcm9sZV0pIGJ5Um9sZVtyb2xlXSA9IHVybDtcblxuICAgIGlmIChyb2xlID09PSBcIlNDUkVFTlNIT1RcIikgc2NyZWVuc2hvdHMucHVzaCh1cmwpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBoZXJvVXJsOlxuICAgICAgYnlSb2xlW1wiSEVST19CQU5ORVJcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkhFUk9CQU5ORVJcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkJBQ0tHUk9VTkRfSU1BR0VcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkJBQ0tHUk9VTkRcIl0gfHxcbiAgICAgIG51bGwsXG4gICAgbG9nb1VybDogYnlSb2xlW1wiTE9HT1wiXSB8fCBieVJvbGVbXCJMT0dPX1RSQU5TUEFSRU5UXCJdIHx8IG51bGwsXG4gICAgYmFja2dyb3VuZFVybDogYnlSb2xlW1wiQkFDS0dST1VORF9JTUFHRVwiXSB8fCBieVJvbGVbXCJCQUNLR1JPVU5EXCJdIHx8IG51bGwsXG4gICAgY292ZXJVcmw6XG4gICAgICBieVJvbGVbXCJNQVNURVJcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkJPWEFSVFwiXSB8fFxuICAgICAgYnlSb2xlW1wiR0FNRUhVQl9DT1ZFUl9BUlRcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIlBSRVZJRVdfR0FNRV9BUlRcIl0gfHxcbiAgICAgIG51bGwsXG4gICAgcG9ydHJhaXRVcmw6XG4gICAgICBieVJvbGVbXCJQT1JUUkFJVF9CQU5ORVJcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkdBTUVIVUJfQ09WRVJfQVJUXCJdIHx8XG4gICAgICBieVJvbGVbXCJCT1hBUlRcIl0gfHxcbiAgICAgIG51bGwsXG4gICAgc2NyZWVuc2hvdHM6IFsuLi5uZXcgU2V0KHNjcmVlbnNob3RzKV0sXG4gICAgdmlkZW9zLFxuICB9O1xufVxuXG4vKiogTWluaW1hbCBIVE1MIHNhbml0aXphdGlvbiBcdTIwMTQgc3RyaXBzIHNjcmlwdHMvc3R5bGVzL2V2ZW50IGhhbmRsZXJzIGFuZFxuICogIGFueSB0YWcgb3V0c2lkZSB0aGUgd2hpdGVsaXN0LiBFbm91Z2ggZm9yIFBTTi1zb3VyY2VkIGRlc2NyaXB0aW9ucy4gKi9cbmNvbnN0IEFMTE9XRURfVEFHUyA9IG5ldyBTZXQoW1xuICBcInBcIiwgXCJiclwiLCBcInN0cm9uZ1wiLCBcImJcIiwgXCJlbVwiLCBcImlcIiwgXCJ1XCIsIFwidWxcIiwgXCJvbFwiLCBcImxpXCIsIFwiaDJcIiwgXCJoM1wiLCBcImg0XCIsXG5dKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplSHRtbChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghcmF3KSByZXR1cm4gXCJcIjtcbiAgbGV0IHMgPSByYXc7XG4gIC8vIERyb3AgZW50aXJlIHNjcmlwdC9zdHlsZSBibG9ja3MuXG4gIHMgPSBzLnJlcGxhY2UoLzxzY3JpcHRbXFxzXFxTXSo/PFxcL3NjcmlwdD4vZ2ksIFwiXCIpO1xuICBzID0gcy5yZXBsYWNlKC88c3R5bGVbXFxzXFxTXSo/PFxcL3N0eWxlPi9naSwgXCJcIik7XG4gIC8vIFN0cmlwIGFueSB0YWcgbm90IGluIHRoZSB3aGl0ZWxpc3QuIFByZXNlcnZlIGlubmVyIHRleHQuXG4gIHMgPSBzLnJlcGxhY2UoLzxcXC8/KFthLXpBLVpdW2EtekEtWjAtOV0qKVxcYltePl0qPi9nLCAobWF0Y2gsIHRhZykgPT4ge1xuICAgIGNvbnN0IHQgPSBTdHJpbmcodGFnKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghQUxMT1dFRF9UQUdTLmhhcyh0KSkgcmV0dXJuIFwiXCI7XG4gICAgLy8gRm9yIGFsbG93ZWQgdGFncywgZHJvcCBhbGwgYXR0cmlidXRlcyAobm8gaHJlZi9zdHlsZS9vbiogcG9zc2libGUpLlxuICAgIHJldHVybiBtYXRjaC5zdGFydHNXaXRoKFwiPC9cIikgPyBgPC8ke3R9PmAgOiBgPCR7dH0+YDtcbiAgfSk7XG4gIC8vIENvbGxhcHNlIHJ1bnMgb2YgZW1wdHkgcGFyYWdyYXBocy5cbiAgcyA9IHMucmVwbGFjZSgvKD86PHA+XFxzKjxcXC9wPlxccyopezIsfS9naSwgXCI8cD48L3A+XCIpO1xuICByZXR1cm4gcy50cmltKCk7XG59XG5cbmZ1bmN0aW9uIHRvU3RyaW5nQXJyYXkodjogdW5rbm93bik6IHN0cmluZ1tdIHtcbiAgaWYgKCF2KSByZXR1cm4gW107XG4gIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgcmV0dXJuIHZcbiAgICAgIC5tYXAoKHgpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKSByZXR1cm4geDtcbiAgICAgICAgaWYgKHggJiYgdHlwZW9mIHggPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBjb25zdCBvYmogPSB4IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgICAgICAgIHJldHVybiBTdHJpbmcob2JqLm5hbWUgfHwgb2JqLmxhYmVsIHx8IG9iai5kZXNjcmlwdGlvbiB8fCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHYuc3BsaXQoXCIsXCIpLm1hcCgocykgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBzdHIodjogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSByZXR1cm4gdi50cmltKCkgfHwgbnVsbDtcbiAgaWYgKHR5cGVvZiB2ID09PSBcIm9iamVjdFwiKSB7XG4gICAgY29uc3Qgb2JqID0gdiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICByZXR1cm4gKFxuICAgICAgKHR5cGVvZiBvYmoubmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBvYmoubmFtZSkgfHxcbiAgICAgICh0eXBlb2Ygb2JqLmRlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiICYmIG9iai5kZXNjcmlwdGlvbikgfHxcbiAgICAgIG51bGxcbiAgICApO1xuICB9XG4gIHJldHVybiBTdHJpbmcodikgfHwgbnVsbDtcbn1cblxuLyoqIFBTTiByYXJlbHkgZXhwb3NlcyBmaWxlIHNpemUgaW4gc3RydWN0dXJlZCBkYXRhIG9uIGVuLVVTLiBTY3JhcGUgaXRcbiAqICBmcm9tIHRoZSB2aXNpYmxlIEhUTUwgYXMgYSBsYXN0IHJlc29ydC4gTWF0Y2hlcyBcIjc5LjggR0JcIiwgXCIyIEdCXCIsIGV0Yy4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RGaWxlU2l6ZUZyb21IdG1sKGh0bWw6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAvLyBUaGUgXCJGaWxlIFNpemVcIiBsYWJlbCBpcyBmb2xsb3dlZCBieSB0aGUgdmFsdWUgaW4gdGhlIFwiQWJvdXQgdGhpcyBnYW1lXCJcbiAgLy8gc2VjdGlvbi4gTG9vayBmb3IgdmFyaWF0aW9ucy5cbiAgY29uc3QgbGFiZWxNYXRjaCA9XG4gICAgL0ZpbGVcXHMqU2l6ZVtePF0qPFxcL1tePl0rPlxccyo8W14+XSs+KFtePF0rKTwvaS5leGVjKGh0bWwpIHx8XG4gICAgL1wiZmlsZVNpemVcIlxccyo6XFxzKlwiKFteXCJdKylcIi9pLmV4ZWMoaHRtbCk7XG4gIGlmIChsYWJlbE1hdGNoICYmIGxhYmVsTWF0Y2hbMV0pIHJldHVybiBsYWJlbE1hdGNoWzFdLnRyaW0oKTtcbiAgLy8gR2xvYmFsIGZhbGxiYWNrOiBhbnkgXCI8bnVtYmVyPiBHQlwiIG5lYXIgYSBzaXplLWlzaCBsYWJlbC4gVmVyeSBjb2Fyc2VcbiAgLy8gXHUyMDE0IG9ubHkgdXNlIGlmIHRoZSBsYWJlbGVkIHNjcmFwZSBtaXNzZXMuXG4gIGNvbnN0IGFueSA9IC8oXFxkezEsM30oPzpbLixdXFxkKyk/KVxccypHQlxcYi9pLmV4ZWMoaHRtbCk7XG4gIHJldHVybiBhbnkgPyBgJHthbnlbMV19IEdCYCA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RDb250ZW50RGVzY3JpcHRvcnMob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHN0cmluZ1tdIHtcbiAgY29uc3QgY3IgPSBvYmouY29udGVudFJhdGluZyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgaWYgKGNyPy5jb250ZW50RGVzY3JpcHRvcnMpIHJldHVybiB0b1N0cmluZ0FycmF5KGNyLmNvbnRlbnREZXNjcmlwdG9ycyk7XG4gIGlmIChjcj8uZGVzY3JpcHRpb25zKSByZXR1cm4gdG9TdHJpbmdBcnJheShjci5kZXNjcmlwdGlvbnMpO1xuICByZXR1cm4gW107XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RJbnRlcmFjdGl2ZUVsZW1lbnRzKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNyID0gb2JqLmNvbnRlbnRSYXRpbmcgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gIGlmIChjcj8uaW50ZXJhY3RpdmVFbGVtZW50cykgcmV0dXJuIHRvU3RyaW5nQXJyYXkoY3IuaW50ZXJhY3RpdmVFbGVtZW50cyk7XG4gIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEdhbWVGZWF0dXJlcyhvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBodG1sOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIC8vIEZyb20gSlNPTjogbG9vayBmb3IgZmVhdHVyZXMsIHVwc2VsbEZlYXR1cmVzLCBnYW1lcGxheUZlYXR1cmVzLCBldGMuXG4gIGNvbnN0IGZlYXR1cmVzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGtleSBvZiBbXCJmZWF0dXJlc1wiLCBcInVwc2VsbEZlYXR1cmVzXCIsIFwiZ2FtZXBsYXlGZWF0dXJlc1wiLCBcImNvbmNlcHRGZWF0dXJlc1wiXSkge1xuICAgIGNvbnN0IHYgPSBvYmpba2V5XTtcbiAgICBpZiAodikgZmVhdHVyZXMucHVzaCguLi50b1N0cmluZ0FycmF5KHYpKTtcbiAgfVxuICBpZiAoZmVhdHVyZXMubGVuZ3RoID4gMCkgcmV0dXJuIGZlYXR1cmVzO1xuXG4gIC8vIEZyb20gSFRNTDogZXh0cmFjdCBmZWF0dXJlIGJhZGdlcyBsaWtlIFwiUFMgUGx1cyByZXF1aXJlZFwiLCBcIjEgLSAyIHBsYXllcnNcIiwgZXRjLlxuICBjb25zdCBmZWF0dXJlUmVnZXggPVxuICAgIC9kYXRhLXFhPVwibWZlW15cIl0qI2NoZWNrcz9bXlwiXSpcIltePl0qPihbXjxdKyk8L2dpO1xuICBsZXQgbTtcbiAgd2hpbGUgKChtID0gZmVhdHVyZVJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgdGV4dCA9IG1bMV0udHJpbSgpO1xuICAgIGlmICh0ZXh0ICYmICFmZWF0dXJlcy5pbmNsdWRlcyh0ZXh0KSkgZmVhdHVyZXMucHVzaCh0ZXh0KTtcbiAgfVxuXG4gIC8vIEFsdGVybmF0aXZlOiBleHRyYWN0IGZyb20gYXJpYS1sYWJlbCBvciB0ZXh0IG5vZGVzIG5lYXIgZmVhdHVyZSBpY29uc1xuICBjb25zdCBhbHRSZWdleCA9XG4gICAgL2NsYXNzPVwiW15cIl0qKD86Z2FtZS1mZWF0dXJlfHBzdy1jLXQtMylbXlwiXSpcIltePl0qPihbXjxdezUsMTIwfSk8L2dpO1xuICB3aGlsZSAoKG0gPSBhbHRSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHRleHQgPSBtWzFdLnRyaW0oKTtcbiAgICBpZiAodGV4dCAmJiAhZmVhdHVyZXMuaW5jbHVkZXModGV4dCkpIGZlYXR1cmVzLnB1c2godGV4dCk7XG4gIH1cblxuICByZXR1cm4gZmVhdHVyZXM7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RQbGF5ZXJJbmZvKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGh0bWw6IHN0cmluZyk6IHtcbiAgcGxheWVyQ291bnQ6IHN0cmluZyB8IG51bGw7XG4gIG9ubGluZVBsYXllckNvdW50OiBzdHJpbmcgfCBudWxsO1xuICBwc1BsdXNSZXF1aXJlZDogYm9vbGVhbjtcbiAgaW5HYW1lUHVyY2hhc2VzOiBzdHJpbmcgfCBudWxsO1xufSB7XG4gIGxldCBwbGF5ZXJDb3VudCA9IHN0cihvYmoucGxheWVyQ291bnQpIHx8IHN0cihvYmoubG9jYWxQbGF5ZXJDb3VudCk7XG4gIGxldCBvbmxpbmVQbGF5ZXJDb3VudCA9IHN0cihvYmoub25saW5lUGxheWVyQ291bnQpO1xuICBsZXQgcHNQbHVzUmVxdWlyZWQgPSBmYWxzZTtcbiAgbGV0IGluR2FtZVB1cmNoYXNlczogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gUGFyc2UgZnJvbSBmZWF0dXJlcy9IVE1MIHRleHRcbiAgY29uc3QgYWxsVGV4dCA9IGh0bWw7XG4gIGNvbnN0IHBsYXllck1hdGNoID0gLyhcXGQrXFxzKi1cXHMqXFxkKylcXHMqcGxheWVyL2kuZXhlYyhhbGxUZXh0KTtcbiAgaWYgKCFwbGF5ZXJDb3VudCAmJiBwbGF5ZXJNYXRjaCkgcGxheWVyQ291bnQgPSBwbGF5ZXJNYXRjaFsxXS5yZXBsYWNlKC9cXHMvZywgXCJcIikgKyBcIiBwbGF5ZXJzXCI7XG5cbiAgY29uc3Qgb25saW5lTWF0Y2ggPSAvc3VwcG9ydHM/XFxzK3VwXFxzK3RvXFxzKyhcXGQrKVxccytvbmxpbmVcXHMrcGxheWVycz8vaS5leGVjKGFsbFRleHQpO1xuICBpZiAoIW9ubGluZVBsYXllckNvdW50ICYmIG9ubGluZU1hdGNoKSBvbmxpbmVQbGF5ZXJDb3VudCA9IGBVcCB0byAke29ubGluZU1hdGNoWzFdfSBvbmxpbmUgcGxheWVyc2A7XG5cbiAgaWYgKC9wc1xccypwbHVzXFxzKnJlcXVpcmVkL2kudGVzdChhbGxUZXh0KSkgcHNQbHVzUmVxdWlyZWQgPSB0cnVlO1xuXG4gIGlmICgvaW4tZ2FtZVxccytwdXJjaGFzZXM/XFxzK29wdGlvbmFsL2kudGVzdChhbGxUZXh0KSkgaW5HYW1lUHVyY2hhc2VzID0gXCJvcHRpb25hbFwiO1xuICBlbHNlIGlmICgvaW4tZ2FtZVxccytwdXJjaGFzZXMvaS50ZXN0KGFsbFRleHQpKSBpbkdhbWVQdXJjaGFzZXMgPSBcInllc1wiO1xuXG4gIHJldHVybiB7IHBsYXllckNvdW50LCBvbmxpbmVQbGF5ZXJDb3VudCwgcHNQbHVzUmVxdWlyZWQsIGluR2FtZVB1cmNoYXNlcyB9O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0UHNWZXJzaW9uKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGh0bWw6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBjbGFzc2lmaWNhdGlvbiA9IHN0cihvYmoubG9jYWxpemVkU3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24pO1xuICBpZiAoY2xhc3NpZmljYXRpb24gJiYgL3BzWzQ1XS9pLnRlc3QoY2xhc3NpZmljYXRpb24pKSByZXR1cm4gY2xhc3NpZmljYXRpb247XG5cbiAgLy8gRnJvbSBIVE1MXG4gIGNvbnN0IHZlcnNpb25NYXRjaCA9IC8oUFNbNDVdXFxzK1ZlcnNpb24pL2kuZXhlYyhodG1sKTtcbiAgcmV0dXJuIHZlcnNpb25NYXRjaCA/IHZlcnNpb25NYXRjaFsxXSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3REaXNjb3VudEVuZEF0KG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGh0bWw6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAvLyBGcm9tIEpTT046IHdlYmN0YXMgcHJpY2UgZW5kVGltZVxuICBjb25zdCB3ZWJjdGFzID0gb2JqLndlYmN0YXMgYXMgQXJyYXk8eyBwcmljZT86IHsgZW5kVGltZT86IHN0cmluZyB9IH0+IHwgdW5kZWZpbmVkO1xuICBjb25zdCBlbmRUaW1lID0gd2ViY3Rhcz8uWzBdPy5wcmljZT8uZW5kVGltZTtcbiAgaWYgKGVuZFRpbWUpIHJldHVybiBlbmRUaW1lO1xuXG4gIGNvbnN0IHByaWNlID0gb2JqLnByaWNlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICBpZiAocHJpY2U/LmVuZFRpbWUpIHJldHVybiBTdHJpbmcocHJpY2UuZW5kVGltZSk7XG5cbiAgLy8gRnJvbSBIVE1MOiBcIk9mZmVyIGVuZHMgNC8yMy8yMDI2IDAyOjU5IGEuIG0uIENMVFwiXG4gIGNvbnN0IG9mZmVyTWF0Y2ggPSAvb2ZmZXJcXHMrZW5kcz9cXHMrKFxcZHsxLDJ9XFwvXFxkezEsMn1cXC9cXGR7NH1bXjxdKikvaS5leGVjKGh0bWwpO1xuICBpZiAob2ZmZXJNYXRjaCkgcmV0dXJuIG9mZmVyTWF0Y2hbMV0udHJpbSgpO1xuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0Q2Fyb3VzZWxJbWFnZXMob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgaHRtbDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBpbWFnZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAvLyBGcm9tIEpTT04gbWVkaWE6IGdldCBhbGwgc2NyZWVuc2hvdCBVUkxzXG4gIGNvbnN0IG1lZGlhID0gKG9iai5tZWRpYSBhcyBBcnJheTx7IHJvbGU/OiBzdHJpbmc7IHVybD86IHN0cmluZyB9PikgfHwgW107XG4gIGZvciAoY29uc3QgbSBvZiBtZWRpYSkge1xuICAgIGNvbnN0IHVybCA9IG0/LnVybDtcbiAgICBpZiAoIXVybCkgY29udGludWU7XG4gICAgY29uc3Qgcm9sZSA9IFN0cmluZyhtPy5yb2xlIHx8IFwiXCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgaWYgKHJvbGUgPT09IFwiU0NSRUVOU0hPVFwiIHx8IHJvbGUgPT09IFwiUFJFVklFV1wiIHx8IHJvbGUgPT09IFwiUFJFVklFV19JTUFHRVwiKSB7XG4gICAgICBpZiAoIXNlZW4uaGFzKHVybCkpIHsgc2Vlbi5hZGQodXJsKTsgaW1hZ2VzLnB1c2godXJsKTsgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEZyb20gSFRNTDogZXh0cmFjdCBjYXJvdXNlbCBpbWFnZSBzcmMvc3Jjc2V0XG4gIGNvbnN0IGltZ1JlZ2V4ID0gL2RhdGEtcWE9XCJtZmUtbWVkaWEtY2Fyb3VzZWxbXlwiXSpcIltePl0qc3JjPVwiKFteXCJdKylcIi9naTtcbiAgbGV0IG07XG4gIHdoaWxlICgobSA9IGltZ1JlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgdXJsID0gbVsxXS5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIik7XG4gICAgaWYgKCFzZWVuLmhhcyh1cmwpKSB7IHNlZW4uYWRkKHVybCk7IGltYWdlcy5wdXNoKHVybCk7IH1cbiAgfVxuXG4gIC8vIEFsc28gZ2V0IGhpZ2gtcmVzIHZlcnNpb25zIGZyb20gc3Jjc2V0XG4gIGNvbnN0IHNyY3NldFJlZ2V4ID0gL2RhdGEtcWE9XCJtZmUtbWVkaWEtY2Fyb3VzZWxbXlwiXSpcIltePl0qc3Jjc2V0PVwiKFteXCJdKylcIi9naTtcbiAgd2hpbGUgKChtID0gc3Jjc2V0UmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBzcmNzZXQgPSBtWzFdLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKTtcbiAgICBjb25zdCB1cmxzID0gc3Jjc2V0LnNwbGl0KFwiLFwiKS5tYXAoKHMpID0+IHMudHJpbSgpLnNwbGl0KC9cXHMrLylbMF0pO1xuICAgIGZvciAoY29uc3QgdXJsIG9mIHVybHMpIHtcbiAgICAgIGlmICh1cmwgJiYgIXNlZW4uaGFzKHVybCkpIHsgc2Vlbi5hZGQodXJsKTsgaW1hZ2VzLnB1c2godXJsKTsgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbWFnZXM7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFByb2R1Y3REZXRhaWwoXG4gIGlkOiBzdHJpbmcsXG4gIHN0b3JlVXJsOiBzdHJpbmcsXG4gIHJlZ2lvbjogc3RyaW5nXG4pOiBQcm9taXNlPFByb2R1Y3REZXRhaWw+IHtcbiAgY29uc3QgdXJsID0gc3RvcmVVcmwgfHwgYGh0dHBzOi8vc3RvcmUucGxheXN0YXRpb24uY29tL2VuLXVzL3Byb2R1Y3QvJHtpZH1gO1xuICBjb25zdCBodG1sID0gYXdhaXQgZmV0Y2hIdG1sKHVybCwgcmVnaW9uKTtcbiAgY29uc3QgZGF0YSA9IGV4dHJhY3ROZXh0RGF0YShodG1sKTtcbiAgaWYgKCFkYXRhKSB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXCJObyBfX05FWFRfREFUQV9fIGluIFBTTiBwcm9kdWN0IHBhZ2VcIik7XG5cbiAgY29uc3QgcmVjb3JkcyA9IGZpbmRQcm9kdWN0UmVjb3JkcyhkYXRhLCBpZCk7XG4gIGNvbnN0IHJpY2ggPSBwaWNrUmljaGVzdChyZWNvcmRzKTtcbiAgaWYgKCFyaWNoKSB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoYFByb2R1Y3QgJHtpZH0gbm90IGZvdW5kIGluIHBhZ2UgSlNPTmApO1xuICBjb25zdCBvYmogPSBtZXJnZVJlY29yZHMocmVjb3Jkcyk7XG5cbiAgY29uc3QgcGxhdGZvcm1zUmF3ID0gb2JqLnBsYXRmb3JtcztcbiAgY29uc3QgcGxhdGZvcm1zID0gQXJyYXkuaXNBcnJheShwbGF0Zm9ybXNSYXcpXG4gICAgPyBwbGF0Zm9ybXNSYXcuam9pbihcIixcIilcbiAgICA6IFN0cmluZyhwbGF0Zm9ybXNSYXcgfHwgXCJcIik7XG5cbiAgY29uc3QgbG9uZ0Rlc2MgPVxuICAgICh0eXBlb2Ygb2JqLmxvbmdEZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvYmoubG9uZ0Rlc2NyaXB0aW9uKSB8fFxuICAgICh0eXBlb2Ygb2JqLmRlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiICYmIG9iai5kZXNjcmlwdGlvbikgfHxcbiAgICBcIlwiO1xuICBjb25zdCBzaG9ydERlc2MgPVxuICAgICh0eXBlb2Ygb2JqLnNob3J0RGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgJiYgb2JqLnNob3J0RGVzY3JpcHRpb24pIHx8XG4gICAgbnVsbDtcblxuICBjb25zdCBmaWxlU2l6ZSA9XG4gICAgc3RyKG9iai5yZXF1aXJlZERpc2tTcGFjZURlc2NyaXB0aW9uKSB8fFxuICAgIHN0cihvYmouZmlsZVNpemUpIHx8XG4gICAgZXh0cmFjdEZpbGVTaXplRnJvbUh0bWwoaHRtbCk7XG5cbiAgY29uc3QgY29udGVudFJhdGluZyA9IG9iai5jb250ZW50UmF0aW5nIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICBjb25zdCBhZ2VSYXRpbmcgPVxuICAgIHN0cihjb250ZW50UmF0aW5nPy5kZXNjcmlwdGlvbikgfHxcbiAgICBzdHIoY29udGVudFJhdGluZz8ubmFtZSkgfHxcbiAgICBzdHIob2JqLmFnZUxpbWl0KTtcblxuICBjb25zdCBwbGF5ZXJJbmZvID0gZXh0cmFjdFBsYXllckluZm8ob2JqLCBodG1sKTtcblxuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIG5hbWU6IFN0cmluZyhvYmoubmFtZSB8fCBvYmoudGl0bGUgfHwgXCJcIiksXG4gICAgZGVzY3JpcHRpb246IHNhbml0aXplSHRtbChsb25nRGVzYyksXG4gICAgc2hvcnREZXNjcmlwdGlvbjogc2hvcnREZXNjLFxuICAgIHB1Ymxpc2hlcjogc3RyKG9iai5wdWJsaXNoZXJOYW1lKSB8fCBzdHIob2JqLnB1Ymxpc2hlcikgfHwgc3RyKG9iai5wdWJsaXNoZWRCeSksXG4gICAgZGV2ZWxvcGVyOiBzdHIob2JqLmRldmVsb3Blck5hbWUpIHx8IHN0cihvYmouZGV2ZWxvcGVyKSxcbiAgICByZWxlYXNlRGF0ZTpcbiAgICAgIHN0cihvYmoucmVsZWFzZURhdGUpIHx8XG4gICAgICBzdHIob2JqLmxvY2FsaXplZFJlbGVhc2VEYXRlKSB8fFxuICAgICAgc3RyKG9iai5yZWxlYXNlRGF0ZVJhdyksXG4gICAgZ2VucmVzOiB0b1N0cmluZ0FycmF5KG9iai5nZW5yZXMpLFxuICAgIHZvaWNlTGFuZ3VhZ2VzOiB0b1N0cmluZ0FycmF5KG9iai5zcG9rZW5MYW5ndWFnZXMgfHwgb2JqLmNvbXBhdGlibGVWb2ljZXMpLFxuICAgIHN1YnRpdGxlTGFuZ3VhZ2VzOiB0b1N0cmluZ0FycmF5KFxuICAgICAgb2JqLnN1YnRpdGxlTGFuZ3VhZ2VzIHx8IG9iai5jb21wYXRpYmxlU3VidGl0bGVzXG4gICAgKSxcbiAgICBhZ2VSYXRpbmcsXG4gICAgY29udGVudERlc2NyaXB0b3JzOiBleHRyYWN0Q29udGVudERlc2NyaXB0b3JzKG9iaiksXG4gICAgaW50ZXJhY3RpdmVFbGVtZW50czogZXh0cmFjdEludGVyYWN0aXZlRWxlbWVudHMob2JqKSxcbiAgICBwbGF5ZXJDb3VudDogcGxheWVySW5mby5wbGF5ZXJDb3VudCxcbiAgICBvbmxpbmVQbGF5ZXJDb3VudDogcGxheWVySW5mby5vbmxpbmVQbGF5ZXJDb3VudCxcbiAgICBwc1BsdXNSZXF1aXJlZDogcGxheWVySW5mby5wc1BsdXNSZXF1aXJlZCxcbiAgICBpbkdhbWVQdXJjaGFzZXM6IHBsYXllckluZm8uaW5HYW1lUHVyY2hhc2VzLFxuICAgIGdhbWVGZWF0dXJlczogZXh0cmFjdEdhbWVGZWF0dXJlcyhvYmosIGh0bWwpLFxuICAgIHBzVmVyc2lvbjogZXh0cmFjdFBzVmVyc2lvbihvYmosIGh0bWwpLFxuICAgIGZpbGVTaXplLFxuICAgIHBsYXRmb3JtcyxcbiAgICBtZWRpYTogZXh0cmFjdE1lZGlhKG9iaiksXG4gICAgY2Fyb3VzZWxJbWFnZXM6IGV4dHJhY3RDYXJvdXNlbEltYWdlcyhvYmosIGh0bWwpLFxuICAgIHN0b3JlVXJsOiB1cmwsXG4gICAgZGlzY291bnRFbmRBdDogZXh0cmFjdERpc2NvdW50RW5kQXQob2JqLCBodG1sKSxcbiAgICBmZXRjaGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvdHlwZXMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3R5cGVzLnRzXCI7ZXhwb3J0IHR5cGUgUGxhdGZvcm0gPSBcInBzblwiIHwgXCJ4Ym94XCIgfCBcIm5pbnRlbmRvXCIgfCBcInN0ZWFtXCI7XG5cbmV4cG9ydCBjb25zdCBQTEFURk9STV9MQUJFTFM6IFJlY29yZDxQbGF0Zm9ybSwgc3RyaW5nPiA9IHtcbiAgcHNuOiBcIlBsYXlTdGF0aW9uXCIsXG4gIHhib3g6IFwiWGJveFwiLFxuICBuaW50ZW5kbzogXCJOaW50ZW5kb1wiLFxuICBzdGVhbTogXCJTdGVhbVwiLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBSZWdpb25Db25maWcge1xuICBjb2RlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGN1cnJlbmN5OiBzdHJpbmc7XG4gIGxvY2FsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgUExBVEZPUk1fUkVHSU9OUzogUmVjb3JkPFBsYXRmb3JtLCBSZWdpb25Db25maWdbXT4gPSB7XG4gIHBzbjogW1xuICAgIHsgY29kZTogXCJ1c1wiLCBsYWJlbDogXCJVU1wiLCBjdXJyZW5jeTogXCJVU0RcIiwgbG9jYWxlOiBcImVuLVVTXCIgfSxcbiAgICB7IGNvZGU6IFwiYnJcIiwgbGFiZWw6IFwiQnJhc2lsXCIsIGN1cnJlbmN5OiBcIkJSTFwiLCBsb2NhbGU6IFwicHQtQlJcIiB9LFxuICBdLFxuICB4Ym94OiBbXG4gICAgeyBjb2RlOiBcInVzXCIsIGxhYmVsOiBcIlVTXCIsIGN1cnJlbmN5OiBcIlVTRFwiLCBsb2NhbGU6IFwiZW4tVVNcIiB9LFxuICAgIHsgY29kZTogXCJiclwiLCBsYWJlbDogXCJCcmFzaWxcIiwgY3VycmVuY3k6IFwiQlJMXCIsIGxvY2FsZTogXCJwdC1CUlwiIH0sXG4gICAgeyBjb2RlOiBcInRyXCIsIGxhYmVsOiBcIlR1cnF1XHUwMEVEYVwiLCBjdXJyZW5jeTogXCJUUllcIiwgbG9jYWxlOiBcInRyLVRSXCIgfSxcbiAgXSxcbiAgbmludGVuZG86IFtcbiAgICB7IGNvZGU6IFwidXNcIiwgbGFiZWw6IFwiVVNcIiwgY3VycmVuY3k6IFwiVVNEXCIsIGxvY2FsZTogXCJlbi1VU1wiIH0sXG4gICAgeyBjb2RlOiBcImpwXCIsIGxhYmVsOiBcIkphcFx1MDBGM25cIiwgY3VycmVuY3k6IFwiSlBZXCIsIGxvY2FsZTogXCJqYVwiIH0sXG4gIF0sXG4gIHN0ZWFtOiBbXG4gICAgeyBjb2RlOiBcInVzXCIsIGxhYmVsOiBcIlVTXCIsIGN1cnJlbmN5OiBcIlVTRFwiLCBsb2NhbGU6IFwiZW5cIiB9LFxuICAgIHsgY29kZTogXCJiclwiLCBsYWJlbDogXCJCcmFzaWxcIiwgY3VycmVuY3k6IFwiQlJMXCIsIGxvY2FsZTogXCJicmF6aWxpYW5cIiB9LFxuICAgIHsgY29kZTogXCJ0clwiLCBsYWJlbDogXCJUdXJxdVx1MDBFRGFcIiwgY3VycmVuY3k6IFwiVFJZXCIsIGxvY2FsZTogXCJ0dXJraXNoXCIgfSxcbiAgXSxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmF3RGVhbCB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgaW1hZ2VVcmw6IHN0cmluZyB8IG51bGw7XG4gIHN0b3JlVXJsOiBzdHJpbmcgfCBudWxsO1xuICBoYXJkd2FyZVBsYXRmb3Jtczogc3RyaW5nO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBwcmljZU9yaWdpbmFsQ2VudHM6IG51bWJlciB8IG51bGw7XG4gIHByaWNlRGlzY291bnRlZENlbnRzOiBudW1iZXIgfCBudWxsO1xuICBkaXNjb3VudFBlcmNlbnQ6IG51bWJlcjtcbiAgZGlzY291bnRFbmRBdDogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm92aWRlclNvdXJjZSB7XG4gIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGNhdGVnb3J5SWQ/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm92aWRlciB7XG4gIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbiAgZmV0Y2hEZWFscyhzb3VyY2U6IFByb3ZpZGVyU291cmNlKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD47XG59XG5cbmV4cG9ydCBjbGFzcyBQcm92aWRlckVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHB1YmxpYyByZWdpb246IHN0cmluZyxcbiAgICBtZXNzYWdlOiBzdHJpbmdcbiAgKSB7XG4gICAgc3VwZXIoYFske3BsYXRmb3JtfS8ke3JlZ2lvbn1dICR7bWVzc2FnZX1gKTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9wc24udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3Bzbi50c1wiO2ltcG9ydCB7XG4gIGl0ZXJDYXRlZ29yeVByb2R1Y3RzLFxuICBpc0Z1bGxHYW1lUHJvZHVjdCxcbiAgbm9ybWFsaXplUHJvZHVjdCxcbiAgUHNuQXBpRXJyb3IsXG59IGZyb20gXCIuLi9wc25cIjtcbmltcG9ydCB0eXBlIHsgUHNuQ29uZmlnIH0gZnJvbSBcIi4uL3N0b3JlXCI7XG5pbXBvcnQgdHlwZSB7IFByb3ZpZGVyLCBQcm92aWRlclNvdXJjZSwgUmF3RGVhbCB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBwc25Qcm92aWRlcjogUHJvdmlkZXIgPSB7XG4gIHBsYXRmb3JtOiBcInBzblwiLFxuICBhc3luYyAqZmV0Y2hEZWFscyhzb3VyY2U6IFByb3ZpZGVyU291cmNlKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICAgIGNvbnN0IGxvY2FsZSA9XG4gICAgICBzb3VyY2UucmVnaW9uID09PSBcImJyXCIgPyBcInB0LUJSXCIgOiBcImVuLVVTXCI7XG4gICAgY29uc3QgY2ZnOiBQc25Db25maWcgPSB7XG4gICAgICByZWdpb246IGxvY2FsZSxcbiAgICAgIGRlYWxzQ2F0ZWdvcnlJZDogc291cmNlLmNhdGVnb3J5SWQgfHwgXCJcIixcbiAgICAgIGNhdGVnb3J5R3JpZEhhc2g6IFwiXCIsXG4gICAgICBpbmNsdWRlQWRkT25zOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgaWYgKCFjZmcuZGVhbHNDYXRlZ29yeUlkKSB7XG4gICAgICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgICAgIFwiTm8gc2UgY29uZmlndXJcdTAwRjMgdW4gQ2F0ZWdvcnkgSUQgcGFyYSBQU04gXCIgKyBzb3VyY2UucmVnaW9uLnRvVXBwZXJDYXNlKClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVuY3kgPSBzb3VyY2UucmVnaW9uID09PSBcImJyXCIgPyBcIkJSTFwiIDogXCJVU0RcIjtcblxuICAgIGZvciBhd2FpdCAoY29uc3QgcmF3IG9mIGl0ZXJDYXRlZ29yeVByb2R1Y3RzKGNmZykpIHtcbiAgICAgIGlmICghaXNGdWxsR2FtZVByb2R1Y3QocmF3KSkgY29udGludWU7XG4gICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICBjb25zdCBnYW1lID0gbm9ybWFsaXplUHJvZHVjdChyYXcsIG5vdyk7XG4gICAgICBpZiAoIWdhbWUpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCByZWdpb25QYXRoID0gbG9jYWxlLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCBzdG9yZVVybCA9IGBodHRwczovL3N0b3JlLnBsYXlzdGF0aW9uLmNvbS8ke3JlZ2lvblBhdGh9L3Byb2R1Y3QvJHtnYW1lLmlkfWA7XG5cbiAgICAgIHlpZWxkIHtcbiAgICAgICAgaWQ6IGdhbWUuaWQsXG4gICAgICAgIG5hbWU6IGdhbWUubmFtZSxcbiAgICAgICAgaW1hZ2VVcmw6IGdhbWUuaW1hZ2VVcmwsXG4gICAgICAgIHN0b3JlVXJsLFxuICAgICAgICBoYXJkd2FyZVBsYXRmb3JtczogZ2FtZS5wbGF0Zm9ybXMsXG4gICAgICAgIGN1cnJlbmN5LFxuICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGdhbWUucHJpY2VPcmlnaW5hbENlbnRzLFxuICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZ2FtZS5wcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICAgICAgZGlzY291bnRQZXJjZW50OiBnYW1lLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgZGlzY291bnRFbmRBdDogZ2FtZS5kaXNjb3VudEVuZEF0LFxuICAgICAgfTtcbiAgICB9XG4gIH0sXG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy94Ym94LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy94Ym94LnRzXCI7aW1wb3J0IHR5cGUgeyBQcm92aWRlciwgUHJvdmlkZXJTb3VyY2UsIFJhd0RlYWwgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgUHJvdmlkZXJFcnJvciB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IFVBID1cbiAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgXCIgK1xuICBcIihLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2XCI7XG5cbmNvbnN0IE1BUktFVF9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTXCIsXG4gIGJyOiBcIkJSXCIsXG4gIHRyOiBcIlRSXCIsXG59O1xuXG5jb25zdCBMQU5HX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgdXM6IFwiZW4tVVNcIixcbiAgYnI6IFwicHQtQlJcIixcbiAgdHI6IFwidHItVFJcIixcbn07XG5cbmNvbnN0IENVUlJFTkNZX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgdXM6IFwiVVNEXCIsXG4gIGJyOiBcIkJSTFwiLFxuICB0cjogXCJUUllcIixcbn07XG5cbmludGVyZmFjZSBDYXRhbG9nUHJvZHVjdCB7XG4gIFByb2R1Y3RJZDogc3RyaW5nO1xuICBMb2NhbGl6ZWRQcm9wZXJ0aWVzPzogQXJyYXk8e1xuICAgIFByb2R1Y3RUaXRsZT86IHN0cmluZztcbiAgICBJbWFnZXM/OiBBcnJheTx7IEltYWdlUHVycG9zZT86IHN0cmluZzsgVXJpPzogc3RyaW5nIH0+O1xuICB9PjtcbiAgRGlzcGxheVNrdUF2YWlsYWJpbGl0aWVzPzogQXJyYXk8e1xuICAgIFNrdT86IHsgUHJvcGVydGllcz86IHsgRnVsZmlsbG1lbnREYXRhPzogeyBQbGF0Zm9ybURlcGVuZGVuY3lJbmZvPzogc3RyaW5nIH0gfSB9O1xuICAgIEF2YWlsYWJpbGl0aWVzPzogQXJyYXk8e1xuICAgICAgQ29uZGl0aW9ucz86IHsgRW5kRGF0ZT86IHN0cmluZyB9O1xuICAgICAgT3JkZXJNYW5hZ2VtZW50RGF0YT86IHtcbiAgICAgICAgUHJpY2U/OiB7XG4gICAgICAgICAgTGlzdFByaWNlPzogbnVtYmVyO1xuICAgICAgICAgIE1TUlA/OiBudW1iZXI7XG4gICAgICAgICAgV2hvbGVzYWxlUHJpY2U/OiBudW1iZXI7XG4gICAgICAgICAgQ3VycmVuY3lDb2RlPzogc3RyaW5nO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9PjtcbiAgfT47XG4gIFByb3BlcnRpZXM/OiB7XG4gICAgQ2F0ZWdvcmllcz86IHN0cmluZ1tdO1xuICAgIENhdGVnb3J5Pzogc3RyaW5nO1xuICB9O1xufVxuXG5mdW5jdGlvbiB0b0NlbnRzKHByaWNlOiBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmIChwcmljZSA9PSBudWxsIHx8ICFOdW1iZXIuaXNGaW5pdGUocHJpY2UpKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIE1hdGgucm91bmQocHJpY2UgKiAxMDApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFdpdGhSZXRyeSh1cmw6IHN0cmluZywgaW5pdD86IFJlcXVlc3RJbml0KTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICBsZXQgbGFzdEVycm9yOiB1bmtub3duO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDQ7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIGhlYWRlcnM6IHsgXCJ1c2VyLWFnZW50XCI6IFVBLCBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIC4uLmluaXQsXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDI5KSB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCAxMDAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb24odXJsOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCByID0gYXdhaXQgZmV0Y2hXaXRoUmV0cnkodXJsKTtcbiAgaWYgKCFyLm9rKSB7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHIudGV4dCgpLmNhdGNoKCgpID0+IFwiXCIpO1xuICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfTogJHt0ZXh0LnNsaWNlKDAsIDIwMCl9YCk7XG4gIH1cbiAgcmV0dXJuIHIuanNvbigpO1xufVxuXG4vKiogUmVjdXJzaXZlbHkgd2FsayBhIEpTT04gdHJlZSBsb29raW5nIGZvciBYYm94IHByb2R1Y3QgSURzICgxMi1jaGFyIGFscGhhbnVtZXJpYyBzdGFydGluZyB3aXRoIDkpLiAqL1xuZnVuY3Rpb24gZXh0cmFjdElkc0Zyb21UcmVlKG5vZGU6IHVua25vd24sIHNlZW46IFNldDxzdHJpbmc+LCBpZHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gIGlmICghbm9kZSB8fCB0eXBlb2Ygbm9kZSAhPT0gXCJvYmplY3RcIikge1xuICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gXCJzdHJpbmdcIiAmJiAvXjlbQS1aMC05XXsxMX0kLy50ZXN0KG5vZGUpICYmICFzZWVuLmhhcyhub2RlKSkge1xuICAgICAgc2Vlbi5hZGQobm9kZSk7XG4gICAgICBpZHMucHVzaChub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSB7XG4gICAgZm9yIChjb25zdCB2IG9mIG5vZGUpIGV4dHJhY3RJZHNGcm9tVHJlZSh2LCBzZWVuLCBpZHMpO1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGNvbnN0IHYgb2YgT2JqZWN0LnZhbHVlcyhub2RlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSkge1xuICAgIGV4dHJhY3RJZHNGcm9tVHJlZSh2LCBzZWVuLCBpZHMpO1xuICB9XG59XG5cbi8vIFRyeSBtdWx0aXBsZSBlbmRwb2ludHMgdG8gZ2V0IGRlYWwgcHJvZHVjdCBJRHMuXG4vLyBQcmltYXJ5OiByZWNvLXB1YmxpYyAoTWljcm9zb2Z0IFJlY29tbWVuZGF0aW9ucyBBUEkpXG4vLyBGYWxsYmFjazogY2F0YWxvZy5nYW1lcGFzcy5jb20vc2lnbHMgKEdhbWUgUGFzcyBzaWduYWxzIFx1MjAxNCBjb250YWlucyBkZWFsIGxpc3RzKVxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hEZWFsSWRzKFxuICBtYXJrZXQ6IHN0cmluZyxcbiAgbGFuZ3VhZ2U6IHN0cmluZ1xuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gQXR0ZW1wdCAxOiBSZWNvIEFQSVxuICB0cnkge1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9yZWNvLXB1YmxpYy5yZWMubXAubWljcm9zb2Z0LmNvbS9jaGFubmVscy9SZWNvL1Y4LjAvTGlzdHMvQ29tcHV0ZWQvRGVhbGAgK1xuICAgICAgYD9NYXJrZXQ9JHttYXJrZXR9Jkxhbmd1YWdlPSR7bGFuZ3VhZ2V9Jkl0ZW1UeXBlcz1HYW1lYCArXG4gICAgICBgJmRldmljZUZhbWlseT1XaW5kb3dzLlhib3gmY291bnQ9MjAwMCZza2lwaXRlbXM9MGA7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgIGNvbnN0IGl0ZW1zOiBBcnJheTx7IElkOiBzdHJpbmcgfT4gPSBkYXRhPy5JdGVtcyA/PyBbXTtcbiAgICBjb25zdCBpZHMgPSBpdGVtcy5tYXAoKGl0KSA9PiBpdC5JZCkuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGlmIChpZHMubGVuZ3RoID4gMCkgcmV0dXJuIGlkcztcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9ycy5wdXNoKGBSZWNvOiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICB9XG5cbiAgLy8gQXR0ZW1wdCAyOiBYYm94IGNhdGFsb2cgZGVhbHMgdmlhIHNpZ2xzIChzaWduYWwgbGlzdHMpXG4gIC8vIERlYWwgbGlzdCBJRCBrbm93biBmcm9tIFhib3ggd2Vic2l0ZSBzb3VyY2VcbiAgY29uc3QgREVBTF9MSVNUX0lEID0gXCJmNmYxZjk5Zi05YjQ5LTRjY2QtYjNiZi00ZDk3NjdhNzdmNWVcIjtcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vY2F0YWxvZy5nYW1lcGFzcy5jb20vc2lnbHMvdjJgICtcbiAgICAgIGA/aWQ9JHtERUFMX0xJU1RfSUR9Jmxhbmd1YWdlPSR7bGFuZ3VhZ2Uuc3BsaXQoXCItXCIpWzBdfSZtYXJrZXQ9JHttYXJrZXR9YDtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZmV0Y2hKc29uKHVybCk7XG4gICAgY29uc3QgaXRlbXM6IEFycmF5PHsgaWQ/OiBzdHJpbmcgfT4gPSBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IFtdO1xuICAgIGNvbnN0IGlkcyA9IGl0ZW1zLm1hcCgoaXQpID0+IGl0LmlkKS5maWx0ZXIoKGlkKTogaWQgaXMgc3RyaW5nID0+ICEhaWQpO1xuICAgIGlmIChpZHMubGVuZ3RoID4gMCkgcmV0dXJuIGlkcztcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9ycy5wdXNoKGBTaWdsczogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgfVxuXG4gIC8vIEF0dGVtcHQgMzogU2VhcmNoIGRpc3BsYXljYXRhbG9nIGZvciBnYW1lcyB3aXRoIGRlYWxzXG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL2Rpc3BsYXljYXRhbG9nLm1wLm1pY3Jvc29mdC5jb20vdjcuMC9wcm9kdWN0cy9zZWFyY2hgICtcbiAgICAgIGA/cXVlcnk9ZGVhbCZtYXJrZXQ9JHttYXJrZXR9Jmxhbmd1YWdlcz0ke2xhbmd1YWdlfWAgK1xuICAgICAgYCZmaWVsZHNUZW1wbGF0ZT1kZXRhaWxzJnRvcD0yMDBgO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaEpzb24odXJsKTtcbiAgICBjb25zdCBwcm9kdWN0czogQ2F0YWxvZ1Byb2R1Y3RbXSA9IGRhdGE/LlByb2R1Y3RzID8/IFtdO1xuICAgIGNvbnN0IGlkcyA9IHByb2R1Y3RzLm1hcCgocCkgPT4gcC5Qcm9kdWN0SWQpLmZpbHRlcihCb29sZWFuKTtcbiAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHJldHVybiBpZHM7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvcnMucHVzaChgU2VhcmNoOiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICB9XG5cbiAgLy8gQXR0ZW1wdCA0OiBIVE1MIGZhbGxiYWNrIFx1MjAxNCBzY3JhcGUgeGJveC5jb20gZGVhbHMgcGFnZSBmb3IgcHJvZHVjdCBJRHNcbiAgdHJ5IHtcbiAgICBjb25zdCBicm93c2VVcmwgPVxuICAgICAgYGh0dHBzOi8vd3d3Lnhib3guY29tL2VuLVVTL2dhbWVzL2Jyb3dzZT9GaWx0ZXJlZEJ5SWRzPUR5bmFtaWNDaGFubmVsLkdhbWVEZWFsc2A7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoV2l0aFJldHJ5KGJyb3dzZVVybCwge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgIGFjY2VwdDogXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcbiAgICAgICAgXCJhY2NlcHQtbGFuZ3VhZ2VcIjogbGFuZ3VhZ2UsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGlmICghci5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGNvbnN0IGh0bWwgPSBhd2FpdCByLnRleHQoKTtcbiAgICBjb25zdCBpZHM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgLy8gU3RyYXRlZ3kgQTogUGFyc2UgX19ORVhUX0RBVEFfXyBKU09OIGJsb2IgZm9yIHByb2R1Y3QgSURzXG4gICAgY29uc3QgbmV4dERhdGFNYXRjaCA9IC88c2NyaXB0W14+XSppZD1bXCInXV9fTkVYVF9EQVRBX19bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+Ly5leGVjKGh0bWwpO1xuICAgIGlmIChuZXh0RGF0YU1hdGNoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBuZXh0RGF0YSA9IEpTT04ucGFyc2UobmV4dERhdGFNYXRjaFsxXSk7XG4gICAgICAgIGV4dHJhY3RJZHNGcm9tVHJlZShuZXh0RGF0YSwgc2VlbiwgaWRzKTtcbiAgICAgIH0gY2F0Y2ggeyAvKiBtYWxmb3JtZWQgSlNPTiAqLyB9XG4gICAgfVxuXG4gICAgLy8gU3RyYXRlZ3kgQjogTG9vayBmb3IgMTItY2hhcmFjdGVyIGFscGhhbnVtZXJpYyBwcm9kdWN0IElEcyBpbiBkYXRhIGF0dHJpYnV0ZXNcbiAgICBpZiAoaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgYXR0clJlZ2V4ID0gL2RhdGEtW2Etei1dKmlkPVtcIiddKFtBLVowLTldezEyfSlbXCInXS9naTtcbiAgICAgIGxldCBhdHRyTWF0Y2g7XG4gICAgICB3aGlsZSAoKGF0dHJNYXRjaCA9IGF0dHJSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBpZCA9IGF0dHJNYXRjaFsxXTtcbiAgICAgICAgaWYgKCFzZWVuLmhhcyhpZCkpIHtcbiAgICAgICAgICBzZWVuLmFkZChpZCk7XG4gICAgICAgICAgaWRzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU3RyYXRlZ3kgQzogRmluZCBhbnkgMTItY2hhciB1cHBlcmNhc2UgYWxwaGFudW1lcmljIHN0cmluZ3MgdGhhdCBsb29rIGxpa2UgWGJveCBwcm9kdWN0IElEc1xuICAgIGlmIChpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBpZFJlZ2V4ID0gL1xcYig5W0EtWjAtOV17MTF9KVxcYi9nO1xuICAgICAgbGV0IGlkTWF0Y2g7XG4gICAgICB3aGlsZSAoKGlkTWF0Y2ggPSBpZFJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGlkID0gaWRNYXRjaFsxXTtcbiAgICAgICAgaWYgKCFzZWVuLmhhcyhpZCkpIHtcbiAgICAgICAgICBzZWVuLmFkZChpZCk7XG4gICAgICAgICAgaWRzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlkcy5sZW5ndGggPiAwKSByZXR1cm4gaWRzO1xuICAgIGVycm9ycy5wdXNoKGBIVE1MIHNjcmFwZTogZm91bmQgMCBwcm9kdWN0IElEcyBpbiAke2h0bWwubGVuZ3RofSBieXRlcyBvZiBIVE1MYCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvcnMucHVzaChgSFRNTCBzY3JhcGU6ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoYEFsbCBYYm94IGRlYWwgZW5kcG9pbnRzIGZhaWxlZDogJHtlcnJvcnMuam9pbihcIiB8IFwiKX1gKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hQcm9kdWN0RGV0YWlscyhcbiAgaWRzOiBzdHJpbmdbXSxcbiAgbWFya2V0OiBzdHJpbmcsXG4gIGxhbmd1YWdlOiBzdHJpbmdcbik6IFByb21pc2U8Q2F0YWxvZ1Byb2R1Y3RbXT4ge1xuICBjb25zdCBiYXRjaFNpemUgPSAyMDtcbiAgY29uc3QgYWxsOiBDYXRhbG9nUHJvZHVjdFtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWRzLmxlbmd0aDsgaSArPSBiYXRjaFNpemUpIHtcbiAgICBjb25zdCBiYXRjaCA9IGlkcy5zbGljZShpLCBpICsgYmF0Y2hTaXplKTtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vZGlzcGxheWNhdGFsb2cubXAubWljcm9zb2Z0LmNvbS92Ny4wL3Byb2R1Y3RzYCArXG4gICAgICBgP2JpZ0lkcz0ke2JhdGNoLmpvaW4oXCIsXCIpfSZtYXJrZXQ9JHttYXJrZXR9Jmxhbmd1YWdlcz0ke2xhbmd1YWdlfWAgK1xuICAgICAgYCZNUy1DVj1ER1UxbWN1WW8wV01NcCtGLjFgO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZmV0Y2hKc29uKHVybCk7XG4gICAgICBjb25zdCBwcm9kdWN0czogQ2F0YWxvZ1Byb2R1Y3RbXSA9IGRhdGE/LlByb2R1Y3RzID8/IFtdO1xuICAgICAgYWxsLnB1c2goLi4ucHJvZHVjdHMpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gU2tpcCBmYWlsZWQgYmF0Y2gsIGNvbnRpbnVlIHdpdGggcmVzdFxuICAgIH1cbiAgfVxuICByZXR1cm4gYWxsO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0R2FtZURhdGEoXG4gIHByb2R1Y3Q6IENhdGFsb2dQcm9kdWN0LFxuICByZWdpb246IHN0cmluZ1xuKTogUmF3RGVhbCB8IG51bGwge1xuICBjb25zdCBpZCA9IHByb2R1Y3QuUHJvZHVjdElkO1xuICBpZiAoIWlkKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBscCA9IHByb2R1Y3QuTG9jYWxpemVkUHJvcGVydGllcz8uWzBdO1xuICBjb25zdCBuYW1lID0gbHA/LlByb2R1Y3RUaXRsZTtcbiAgaWYgKCFuYW1lKSByZXR1cm4gbnVsbDtcblxuICBsZXQgaW1hZ2VVcmw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBjb25zdCBpbWFnZXMgPSBscD8uSW1hZ2VzID8/IFtdO1xuICBjb25zdCBoZXJvID0gaW1hZ2VzLmZpbmQoXG4gICAgKGltZykgPT4gaW1nLkltYWdlUHVycG9zZSA9PT0gXCJTdXBlckhlcm9BcnRcIiB8fCBpbWcuSW1hZ2VQdXJwb3NlID09PSBcIlBvc3RlclwiXG4gICk7XG4gIGNvbnN0IGJveEFydCA9IGltYWdlcy5maW5kKChpbWcpID0+IGltZy5JbWFnZVB1cnBvc2UgPT09IFwiQm94QXJ0XCIpO1xuICBjb25zdCBhbnlJbWcgPSBpbWFnZXNbMF07XG4gIGNvbnN0IGNob3NlbiA9IGhlcm8gfHwgYm94QXJ0IHx8IGFueUltZztcbiAgaWYgKGNob3Nlbj8uVXJpKSB7XG4gICAgaW1hZ2VVcmwgPSBjaG9zZW4uVXJpLnN0YXJ0c1dpdGgoXCIvL1wiKVxuICAgICAgPyBcImh0dHBzOlwiICsgY2hvc2VuLlVyaVxuICAgICAgOiBjaG9zZW4uVXJpO1xuICB9XG5cbiAgY29uc3QgZHNhID0gcHJvZHVjdC5EaXNwbGF5U2t1QXZhaWxhYmlsaXRpZXM/LlswXTtcbiAgY29uc3QgYXZhaWxzID0gZHNhPy5BdmFpbGFiaWxpdGllcyA/PyBbXTtcblxuICBsZXQgbGlzdFByaWNlOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhbGVQcmljZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGxldCBlbmREYXRlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgY3VycmVuY3kgPSBDVVJSRU5DWV9NQVBbcmVnaW9uXSB8fCBcIlVTRFwiO1xuXG4gIGZvciAoY29uc3QgYSBvZiBhdmFpbHMpIHtcbiAgICBjb25zdCBwID0gYS5PcmRlck1hbmFnZW1lbnREYXRhPy5QcmljZTtcbiAgICBpZiAoIXApIGNvbnRpbnVlO1xuICAgIGNvbnN0IG1zcnAgPSBwLk1TUlAgPz8gcC5MaXN0UHJpY2U7XG4gICAgY29uc3Qgc2FsZSA9IHAuTGlzdFByaWNlID8/IHAuV2hvbGVzYWxlUHJpY2U7XG4gICAgaWYgKG1zcnAgIT0gbnVsbCAmJiBsaXN0UHJpY2UgPT0gbnVsbCkgbGlzdFByaWNlID0gbXNycDtcbiAgICBpZiAoc2FsZSAhPSBudWxsICYmIHNhbGUgPCAobXNycCA/PyBJbmZpbml0eSkpIHtcbiAgICAgIHNhbGVQcmljZSA9IHNhbGU7XG4gICAgICBlbmREYXRlID0gYS5Db25kaXRpb25zPy5FbmREYXRlID8/IG51bGw7XG4gICAgfVxuICB9XG5cbiAgaWYgKGxpc3RQcmljZSA9PSBudWxsICYmIHNhbGVQcmljZSA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBvcmlnaW5hbENlbnRzID0gdG9DZW50cyhsaXN0UHJpY2UpO1xuICBjb25zdCBkaXNjb3VudGVkQ2VudHMgPSB0b0NlbnRzKHNhbGVQcmljZSkgPz8gb3JpZ2luYWxDZW50cztcbiAgbGV0IGRpc2NvdW50UGVyY2VudCA9IDA7XG4gIGlmIChcbiAgICBvcmlnaW5hbENlbnRzICYmXG4gICAgZGlzY291bnRlZENlbnRzICE9IG51bGwgJiZcbiAgICBkaXNjb3VudGVkQ2VudHMgPCBvcmlnaW5hbENlbnRzXG4gICkge1xuICAgIGRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAoKG9yaWdpbmFsQ2VudHMgLSBkaXNjb3VudGVkQ2VudHMpICogMTAwKSAvIG9yaWdpbmFsQ2VudHNcbiAgICApO1xuICB9XG5cbiAgY29uc3QgbWFya2V0ID0gTUFSS0VUX01BUFtyZWdpb25dIHx8IFwiVVNcIjtcbiAgY29uc3Qgc3RvcmVVcmwgPSBgaHR0cHM6Ly93d3cueGJveC5jb20vJHttYXJrZXQudG9Mb3dlckNhc2UoKX0vZ2FtZXMvc3RvcmUvJHtlbmNvZGVVUklDb21wb25lbnQobmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgXCItXCIpKX0vJHtpZH1gO1xuXG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgbmFtZSxcbiAgICBpbWFnZVVybCxcbiAgICBzdG9yZVVybCxcbiAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJYYm94IFNlcmllcyBYfFMsIFhib3ggT25lXCIsXG4gICAgY3VycmVuY3ksXG4gICAgcHJpY2VPcmlnaW5hbENlbnRzOiBvcmlnaW5hbENlbnRzLFxuICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBkaXNjb3VudGVkQ2VudHMsXG4gICAgZGlzY291bnRQZXJjZW50LFxuICAgIGRpc2NvdW50RW5kQXQ6IGVuZERhdGUsXG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCB4Ym94UHJvdmlkZXI6IFByb3ZpZGVyID0ge1xuICBwbGF0Zm9ybTogXCJ4Ym94XCIsXG4gIGFzeW5jICpmZXRjaERlYWxzKHNvdXJjZTogUHJvdmlkZXJTb3VyY2UpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gICAgY29uc3QgbWFya2V0ID0gTUFSS0VUX01BUFtzb3VyY2UucmVnaW9uXTtcbiAgICBjb25zdCBsYW5ndWFnZSA9IExBTkdfTUFQW3NvdXJjZS5yZWdpb25dO1xuICAgIGlmICghbWFya2V0IHx8ICFsYW5ndWFnZSkge1xuICAgICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXCJ4Ym94XCIsIHNvdXJjZS5yZWdpb24sIGBSZWdpXHUwMEYzbiBubyBzb3BvcnRhZGE6ICR7c291cmNlLnJlZ2lvbn1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZHMgPSBhd2FpdCBmZXRjaERlYWxJZHMobWFya2V0LCBsYW5ndWFnZSk7XG4gICAgaWYgKGlkcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IHByb2R1Y3RzID0gYXdhaXQgZmV0Y2hQcm9kdWN0RGV0YWlscyhpZHMsIG1hcmtldCwgbGFuZ3VhZ2UpO1xuXG4gICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIHByb2R1Y3RzKSB7XG4gICAgICBjb25zdCBkZWFsID0gZXh0cmFjdEdhbWVEYXRhKHByb2R1Y3QsIHNvdXJjZS5yZWdpb24pO1xuICAgICAgaWYgKGRlYWwgJiYgZGVhbC5kaXNjb3VudFBlcmNlbnQgPiAwKSB7XG4gICAgICAgIHlpZWxkIGRlYWw7XG4gICAgICB9XG4gICAgfVxuICB9LFxufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvc3RlYW0udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3N0ZWFtLnRzXCI7aW1wb3J0IHR5cGUgeyBQcm92aWRlciwgUHJvdmlkZXJTb3VyY2UsIFJhd0RlYWwgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgUHJvdmlkZXJFcnJvciB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IFVBID1cbiAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgXCIgK1xuICBcIihLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2XCI7XG5cbmNvbnN0IENDX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgdXM6IFwidXNcIixcbiAgYnI6IFwiYnJcIixcbiAgdHI6IFwidHJcIixcbn07XG5cbmNvbnN0IENVUlJFTkNZX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgdXM6IFwiVVNEXCIsXG4gIGJyOiBcIkJSTFwiLFxuICB0cjogXCJUUllcIixcbn07XG5cbmludGVyZmFjZSBTdGVhbVNlYXJjaFJlc3VsdCB7XG4gIG5hbWU6IHN0cmluZztcbiAgbG9nbzogc3RyaW5nO1xuICB0b3RhbF9jb3VudD86IG51bWJlcjtcbiAgaXRlbXM/OiBBcnJheTx7XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIGlkOiBudW1iZXI7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGxvZ286IHN0cmluZztcbiAgICBsb2dvX3Bvc2l0aW9uOiBudW1iZXI7XG4gIH0+O1xufVxuXG5pbnRlcmZhY2UgU3RlYW1TZWFyY2hJdGVtIHtcbiAgbmFtZTogc3RyaW5nO1xuICBsb2dvOiBzdHJpbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSnNvbih1cmw6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gIGxldCBsYXN0RXJyb3I6IHVua25vd247XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNDsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvbiwgdGV4dC9qYXZhc2NyaXB0LCAqLypcIixcbiAgICAgICAgICBjb29raWU6IFwid2FudHNfbWF0dXJlX2NvbnRlbnQ9MTsgYmlydGh0aW1lPTU2ODAyMjQwMTsgU3RlYW1fTGFuZ3VhZ2U9ZW5nbGlzaFwiLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBpZiAoIXIub2spIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHIudGV4dCgpLmNhdGNoKCgpID0+IFwiXCIpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyLnN0YXR1c306ICR7dGV4dC5zbGljZSgwLCAyMDApfWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGF3YWl0IHIuanNvbigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxhc3RFcnJvciA9IGU7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgNTAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgfVxuICB9XG4gIHRocm93IGxhc3RFcnJvcjtcbn1cblxuZnVuY3Rpb24gcGFyc2VTdGVhbVByaWNlKHByaWNlU3RyOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICghcHJpY2VTdHIpIHJldHVybiBudWxsO1xuICAvLyBEZWNvZGUgSFRNTCBlbnRpdGllcyBhbmQgc3RyaXAgbm9uLWJyZWFraW5nIHNwYWNlc1xuICBjb25zdCBzID0gcHJpY2VTdHJcbiAgICAucmVwbGFjZSgvJm5ic3A7L2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC8mI1xcZCs7L2csIFwiXCIpXG4gICAgLnRyaW0oKTtcbiAgaWYgKCFzIHx8IC9eZnJlZS9pLnRlc3QocykgfHwgL2dyYXRpcy9pLnRlc3QocykpIHJldHVybiBudWxsO1xuICAvLyBTdHJpcCBjdXJyZW5jeSBzeW1ib2xzIGFuZCBsZXR0ZXJzLCBrZWVwIGRpZ2l0cywgZG90cywgY29tbWFzXG4gIGNvbnN0IGNsZWFuZWQgPSBzLnJlcGxhY2UoL1teMC05LiwtXS9nLCBcIlwiKTtcbiAgaWYgKCFjbGVhbmVkKSByZXR1cm4gbnVsbDtcbiAgLy8gU3RlYW0gZm9ybWF0czogXCIkMTkuOTlcIiAoVVMpLCBcIlIkIDg5LDkwXCIgKEJSKSwgXCIxMTksOTkgVExcIiAoVFIpXG4gIC8vIEFsc28gaGFuZGxlcyBcIjEuMDg5LDkwXCIgKEJSIHRob3VzYW5kcyBzZXBhcmF0b3IpXG4gIGNvbnN0IHBhcnRzID0gY2xlYW5lZC5zcGxpdCgvWy4sXS8pO1xuICBpZiAocGFydHMubGVuZ3RoID49IDIpIHtcbiAgICBjb25zdCBsYXN0UGFydCA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuICAgIGlmIChsYXN0UGFydC5sZW5ndGggPT09IDIpIHtcbiAgICAgIGNvbnN0IHdob2xlID0gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4oXCJcIik7XG4gICAgICBjb25zdCBuID0gTnVtYmVyKHdob2xlICsgXCIuXCIgKyBsYXN0UGFydCk7XG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gTWF0aC5yb3VuZChuICogMTAwKTtcbiAgICB9XG4gIH1cbiAgLy8gRmFsbGJhY2s6IHRyZWF0IGNvbW1hcyBhcyBkZWNpbWFsIHNlcGFyYXRvcnNcbiAgY29uc3QgbiA9IE51bWJlcihjbGVhbmVkLnJlcGxhY2UoLywvZywgXCIuXCIpKTtcbiAgaWYgKE51bWJlci5pc0Zpbml0ZShuKSkgcmV0dXJuIE1hdGgucm91bmQobiAqIDEwMCk7XG4gIHJldHVybiBudWxsO1xufVxuXG5pbnRlcmZhY2UgU3RlYW1TZWFyY2hSZXN1bHRJdGVtIHtcbiAgbmFtZTogc3RyaW5nO1xuICBhcHBpZDogc3RyaW5nO1xufVxuXG5hc3luYyBmdW5jdGlvbiogZmV0Y2hTdGVhbURlYWxzKFxuICBjYzogc3RyaW5nLFxuICBjdXJyZW5jeTogc3RyaW5nLFxuICByZWdpb246IHN0cmluZ1xuKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICBjb25zdCBwYWdlU2l6ZSA9IDEwMDtcbiAgY29uc3QgbWF4UGFnZXMgPSAzMDtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAobGV0IHBhZ2UgPSAwOyBwYWdlIDwgbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgIGNvbnN0IHN0YXJ0ID0gcGFnZSAqIHBhZ2VTaXplO1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9zdG9yZS5zdGVhbXBvd2VyZWQuY29tL3NlYXJjaC9yZXN1bHRzLz9xdWVyeSZzdGFydD0ke3N0YXJ0fWAgK1xuICAgICAgYCZjb3VudD0ke3BhZ2VTaXplfSZkeW5hbWljX2RhdGE9JnNvcnRfYnk9X0FTQyZzcGVjaWFscz0xYCArXG4gICAgICBgJnNucj0xXzdfN18yMzBfNyZpbmZpbml0ZT0xJmNjPSR7Y2N9YDtcblxuICAgIGxldCBkYXRhOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIGRhdGEgPSBhd2FpdCBmZXRjaEpzb24odXJsKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAocGFnZSA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcInN0ZWFtXCIsIHJlZ2lvbiwgYFN0ZWFtIHNlYXJjaCBmYWlsZWQ6ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBodG1sOiBzdHJpbmcgPSBkYXRhPy5yZXN1bHRzX2h0bWwgPz8gXCJcIjtcbiAgICBpZiAoIWh0bWwgfHwgaHRtbC50cmltKCkgPT09IFwiXCIpIHtcbiAgICAgIGlmIChwYWdlID09PSAwKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsID0gZGF0YT8udG90YWxfY291bnQgPz8gXCI/XCI7XG4gICAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFwic3RlYW1cIiwgcmVnaW9uLCBgU3RlYW0gcmV0dXJuZWQgZW1wdHkgSFRNTCAodG90YWxfY291bnQ9JHt0b3RhbH0sIHByZXZpZXc6ICR7aHRtbC5zbGljZSgwLCAyMDApfSlgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIFNwbGl0IEhUTUwgaW50byBpbmRpdmlkdWFsIHJlc3VsdCByb3dzIGJ5IGFuY2hvciBib3VuZGFyaWVzXG4gICAgY29uc3QgYW5jaG9yczogeyBhcHBJZDogc3RyaW5nOyBibG9jazogc3RyaW5nIH1bXSA9IFtdO1xuICAgIGNvbnN0IGFuY2hvclN0YXJ0cyA9IFsuLi5odG1sLm1hdGNoQWxsKC88YVtePl0qZGF0YS1kcy1hcHBpZD1cIihcXGQrKVwiL2cpXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFuY2hvclN0YXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXBwSWQgPSBhbmNob3JTdGFydHNbaV1bMV07XG4gICAgICBjb25zdCBzdGFydElkeCA9IGFuY2hvclN0YXJ0c1tpXS5pbmRleCE7XG4gICAgICBjb25zdCBlbmRJZHggPSBpICsgMSA8IGFuY2hvclN0YXJ0cy5sZW5ndGggPyBhbmNob3JTdGFydHNbaSArIDFdLmluZGV4ISA6IGh0bWwubGVuZ3RoO1xuICAgICAgYW5jaG9ycy5wdXNoKHsgYXBwSWQsIGJsb2NrOiBodG1sLnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpIH0pO1xuICAgIH1cblxuICAgIGxldCBmb3VuZE9uUGFnZSA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IHsgYXBwSWQsIGJsb2NrOiByb3cgfSBvZiBhbmNob3JzKSB7XG4gICAgICBpZiAoc2Vlbi5oYXMoYXBwSWQpKSBjb250aW51ZTtcbiAgICAgIHNlZW4uYWRkKGFwcElkKTtcblxuICAgICAgY29uc3QgbmFtZU1hdGNoID0gLzxzcGFuIGNsYXNzPVwidGl0bGVcIj4oW148XSspPFxcL3NwYW4+Ly5leGVjKHJvdyk7XG4gICAgICBpZiAoIW5hbWVNYXRjaCkgY29udGludWU7XG4gICAgICBjb25zdCBuYW1lID0gbmFtZU1hdGNoWzFdLnRyaW0oKTtcblxuICAgICAgY29uc3QgcGN0TWF0Y2ggPSAvZGlzY291bnRfcGN0W14+XSo+KFtePF0qKTwvLmV4ZWMocm93KTtcbiAgICAgIGNvbnN0IG9yaWdNYXRjaCA9IC9kaXNjb3VudF9vcmlnaW5hbF9wcmljZVtePl0qPihbXjxdKik8Ly5leGVjKHJvdyk7XG4gICAgICBjb25zdCBmaW5hbE1hdGNoID0gL2Rpc2NvdW50X2ZpbmFsX3ByaWNlW14+XSo+KFtePF0qKTwvLmV4ZWMocm93KTtcblxuICAgICAgY29uc3QgZGlzY291bnRQY3RTdHIgPSBwY3RNYXRjaD8uWzFdPy50cmltKCkucmVwbGFjZSgvWy0lXS9nLCBcIlwiKSA/PyBcIlwiO1xuICAgICAgY29uc3Qgb3JpZ2luYWxQcmljZVN0ciA9IG9yaWdNYXRjaD8uWzFdPy50cmltKCkgPz8gXCJcIjtcbiAgICAgIGNvbnN0IGZpbmFsUHJpY2VTdHIgPSBmaW5hbE1hdGNoPy5bMV0/LnRyaW0oKSA/PyBcIlwiO1xuXG4gICAgICBjb25zdCBkaXNjb3VudFBlcmNlbnQgPSBwYXJzZUludChkaXNjb3VudFBjdFN0cikgfHwgMDtcbiAgICAgIGNvbnN0IG9yaWdpbmFsQ2VudHMgPSBwYXJzZVN0ZWFtUHJpY2Uob3JpZ2luYWxQcmljZVN0cik7XG4gICAgICBjb25zdCBkaXNjb3VudGVkQ2VudHMgPSBwYXJzZVN0ZWFtUHJpY2UoZmluYWxQcmljZVN0cik7XG5cbiAgICAgIGlmICghb3JpZ2luYWxDZW50cyAmJiAhZGlzY291bnRlZENlbnRzKSBjb250aW51ZTtcbiAgICAgIGZvdW5kT25QYWdlKys7XG5cbiAgICAgIHlpZWxkIHtcbiAgICAgICAgaWQ6IGFwcElkLFxuICAgICAgICBuYW1lLFxuICAgICAgICBpbWFnZVVybDogYGh0dHBzOi8vY2RuLmFrYW1haS5zdGVhbXN0YXRpYy5jb20vc3RlYW0vYXBwcy8ke2FwcElkfS9oZWFkZXIuanBnYCxcbiAgICAgICAgc3RvcmVVcmw6IGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vYXBwLyR7YXBwSWR9L2AsXG4gICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIlBDXCIsXG4gICAgICAgIGN1cnJlbmN5LFxuICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG9yaWdpbmFsQ2VudHMsXG4gICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBkaXNjb3VudGVkQ2VudHMgPz8gb3JpZ2luYWxDZW50cyxcbiAgICAgICAgZGlzY291bnRQZXJjZW50LFxuICAgICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB0b3RhbENvdW50ID0gZGF0YT8udG90YWxfY291bnQgPz8gMDtcbiAgICBpZiAoc3RhcnQgKyBwYWdlU2l6ZSA+PSB0b3RhbENvdW50IHx8IGZvdW5kT25QYWdlID09PSAwKSBicmVhaztcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc3RlYW1Qcm92aWRlcjogUHJvdmlkZXIgPSB7XG4gIHBsYXRmb3JtOiBcInN0ZWFtXCIsXG4gIGFzeW5jICpmZXRjaERlYWxzKHNvdXJjZTogUHJvdmlkZXJTb3VyY2UpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gICAgY29uc3QgY2MgPSBDQ19NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgY29uc3QgY3VycmVuY3kgPSBDVVJSRU5DWV9NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgaWYgKCFjYyB8fCAhY3VycmVuY3kpIHtcbiAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFxuICAgICAgICBcInN0ZWFtXCIsXG4gICAgICAgIHNvdXJjZS5yZWdpb24sXG4gICAgICAgIGBSZWdpXHUwMEYzbiBubyBzb3BvcnRhZGE6ICR7c291cmNlLnJlZ2lvbn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIHlpZWxkKiBmZXRjaFN0ZWFtRGVhbHMoY2MsIGN1cnJlbmN5LCBzb3VyY2UucmVnaW9uKTtcbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL25pbnRlbmRvLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9uaW50ZW5kby50c1wiO2ltcG9ydCB0eXBlIHsgUHJvdmlkZXIsIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5jb25zdCBDVVJSRU5DWV9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTRFwiLFxuICBqcDogXCJKUFlcIixcbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV2l0aFJldHJ5KFxuICB1cmw6IHN0cmluZyxcbiAgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCA0OyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBoZWFkZXJzOiB7IFwidXNlci1hZ2VudFwiOiBVQSwgLi4uaGVhZGVycyB9LFxuICAgICAgfSk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwMyB8fCByLnN0YXR1cyA9PT0gNDI5KSB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCAxMDAwICogMiAqKiBhdHRlbXB0KSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb24odXJsOiBzdHJpbmcsIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogUHJvbWlzZTxhbnk+IHtcbiAgY29uc3QgciA9IGF3YWl0IGZldGNoV2l0aFJldHJ5KHVybCwge1xuICAgIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgLi4uaGVhZGVycyxcbiAgfSk7XG4gIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9YCk7XG4gIHJldHVybiByLmpzb24oKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hIdG1sKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgciA9IGF3YWl0IGZldGNoV2l0aFJldHJ5KHVybCwge1xuICAgIGFjY2VwdDogXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcbiAgICBcImFjY2VwdC1sYW5ndWFnZVwiOiBcImphXCIsXG4gIH0pO1xuICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfWApO1xuICByZXR1cm4gci50ZXh0KCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RKc29uKHVybDogc3RyaW5nLCBib2R5OiBhbnksIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogUHJvbWlzZTxhbnk+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCA0OyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgLi4uaGVhZGVycyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgICB9KTtcbiAgICAgIGlmICghci5vaykge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgci50ZXh0KCkuY2F0Y2goKCkgPT4gXCJcIik7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfTogJHt0ZXh0LnNsaWNlKDAsIDIwMCl9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXdhaXQgci5qc29uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG4vLyAtLS0gVVMgZVNob3AgdmlhIEFsZ29saWEgKHNhbWUgQVBJIHRoZSBOaW50ZW5kbyB3ZWJzaXRlIHVzZXMpIC0tLVxuXG5jb25zdCBBTEdPTElBX0FQUF9JRCA9IFwiVTNCNkdSNFVBM1wiO1xuY29uc3QgQUxHT0xJQV9BUElfS0VZID0gXCJhMjljNjkyNzYzOGJmZDhjZWUyMzk5M2U1MWU3MjFjOVwiO1xuY29uc3QgQUxHT0xJQV9JTkRFWCA9IFwic3RvcmVfZ2FtZV9lbl91c1wiO1xuXG5pbnRlcmZhY2UgQWxnb2xpYUhpdCB7XG4gIG9iamVjdElEOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIG5zdWlkPzogc3RyaW5nO1xuICB1cmw/OiBzdHJpbmc7XG4gIHByb2R1Y3RJbWFnZVNxdWFyZT86IHN0cmluZztcbiAgcHJvZHVjdEltYWdlPzogc3RyaW5nO1xuICBwbGF0Zm9ybT86IHN0cmluZztcbiAgcHJpY2U/OiB7XG4gICAgcmVnUHJpY2U/OiBudW1iZXI7XG4gICAgc2FsZVByaWNlPzogbnVtYmVyO1xuICAgIHBlcmNlbnRPZmY/OiBudW1iZXI7XG4gICAgZGlzY291bnRlZD86IGJvb2xlYW47XG4gIH07XG4gIGVzaG9wRGV0YWlscz86IHtcbiAgICBkaXNjb3VudFByaWNlRW5kPzogc3RyaW5nO1xuICAgIGN1cnJlbmN5Pzogc3RyaW5nO1xuICB9O1xufVxuXG4vLyBUcnkgbXVsdGlwbGUgQWxnb2xpYSBmaWx0ZXIgc3RyYXRlZ2llczsgTmludGVuZG8gZG9lc24ndCBkb2N1bWVudCB3aGljaFxuLy8gYXR0cmlidXRlcyBhcmUgY29uZmlndXJlZCBhcyBmaWx0ZXJhYmxlLCBzbyB3ZSBjYXNjYWRlIHVudGlsIG9uZSB3b3Jrcy5cbmNvbnN0IEZJTFRFUl9TVFJBVEVHSUVTID0gW1xuICBgZmFjZXRGaWx0ZXJzPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdbW1wiZ2VuZXJhbEZpbHRlcnM6RGVhbHNcIl1dJyl9YCxcbiAgYGZhY2V0RmlsdGVycz0ke2VuY29kZVVSSUNvbXBvbmVudCgnW1tcImdlbmVyYWxGaWx0ZXJzOk9uIHNhbGVcIl1dJyl9YCxcbiAgYG51bWVyaWNGaWx0ZXJzPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdbXCJwcmljZS5wZXJjZW50T2ZmPjBcIl0nKX1gLFxuICBcIlwiLCAvLyBubyBmaWx0ZXIgXHUyMDE0IGZldGNoIGV2ZXJ5dGhpbmcgYW5kIGZpbHRlciBpbiBjb2RlXG5dO1xuXG5hc3luYyBmdW5jdGlvbiBhbGdvbGlhUXVlcnkoXG4gIHBhcmFtczogc3RyaW5nLFxuKTogUHJvbWlzZTxhbnk+IHtcbiAgcmV0dXJuIHBvc3RKc29uKFxuICAgIGBodHRwczovLyR7QUxHT0xJQV9BUFBfSUR9LWRzbi5hbGdvbGlhLm5ldC8xL2luZGV4ZXMvJHtBTEdPTElBX0lOREVYfS9xdWVyeWAsXG4gICAgeyBwYXJhbXMgfSxcbiAgICB7XG4gICAgICBcIngtYWxnb2xpYS1hcHBsaWNhdGlvbi1pZFwiOiBBTEdPTElBX0FQUF9JRCxcbiAgICAgIFwieC1hbGdvbGlhLWFwaS1rZXlcIjogQUxHT0xJQV9BUElfS0VZLFxuICAgIH1cbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmluZFdvcmtpbmdGaWx0ZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgZm9yIChjb25zdCBmaWx0ZXIgb2YgRklMVEVSX1NUUkFURUdJRVMpIHtcbiAgICBjb25zdCBleHRyYSA9IGZpbHRlciA/IGAmJHtmaWx0ZXJ9YCA6IFwiXCI7XG4gICAgY29uc3QgcGFyYW1zID0gYHF1ZXJ5PSZoaXRzUGVyUGFnZT01JnBhZ2U9MCR7ZXh0cmF9YDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGFsZ29saWFRdWVyeShwYXJhbXMpO1xuICAgICAgY29uc3QgbmJIaXRzID0gZGF0YT8ubmJIaXRzID8/IDA7XG4gICAgICBpZiAobmJIaXRzID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW25pbnRlbmRvL3VzXSBGaWx0ZXIgT0sgKG5iSGl0cz0ke25iSGl0c30pOiAke2ZpbHRlciB8fCBcIihzaW4gZmlsdHJvKVwifWApO1xuICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYFtuaW50ZW5kby91c10gRmlsdGVyIG1pc3MgKG5iSGl0cz0wKTogJHtmaWx0ZXIgfHwgXCIoc2luIGZpbHRybylcIn1gKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW25pbnRlbmRvL3VzXSBGaWx0ZXIgZXJyb3I6ICR7ZmlsdGVyIHx8IFwiKHNpbiBmaWx0cm8pXCJ9IFx1MjE5MiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuICBjb25zb2xlLndhcm4oXCJbbmludGVuZG8vdXNdIE5pbmdcdTAwRkFuIGZpbHRybyBkZSBBbGdvbGlhIGZ1bmNpb25cdTAwRjNcIik7XG4gIHJldHVybiBcIlwiO1xufVxuXG5mdW5jdGlvbiBwYXJzZU5pbnRlbmRvSGl0KGhpdDogQWxnb2xpYUhpdCk6IFJhd0RlYWwgfCBudWxsIHtcbiAgY29uc3QgaWQgPSBoaXQubnN1aWQgfHwgaGl0Lm9iamVjdElEO1xuICBjb25zdCBuYW1lID0gaGl0LnRpdGxlO1xuICBpZiAoIW5hbWUgfHwgIWlkKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBwcmljZSA9IGhpdC5wcmljZTtcbiAgaWYgKCFwcmljZSB8fCAhcHJpY2Uuc2FsZVByaWNlKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZWdQcmljZSA9IHByaWNlLnJlZ1ByaWNlO1xuICBjb25zdCBzYWxlUHJpY2UgPSBwcmljZS5zYWxlUHJpY2U7XG5cbiAgY29uc3Qgb3JpZ2luYWxDZW50cyA9IHJlZ1ByaWNlICE9IG51bGwgPyBNYXRoLnJvdW5kKHJlZ1ByaWNlICogMTAwKSA6IG51bGw7XG4gIGNvbnN0IGRpc2NvdW50ZWRDZW50cyA9XG4gICAgc2FsZVByaWNlICE9IG51bGwgPyBNYXRoLnJvdW5kKHNhbGVQcmljZSAqIDEwMCkgOiBvcmlnaW5hbENlbnRzO1xuXG4gIGxldCBkaXNjb3VudFBlcmNlbnQgPSBwcmljZS5wZXJjZW50T2ZmID8/IDA7XG4gIGlmIChcbiAgICAhZGlzY291bnRQZXJjZW50ICYmXG4gICAgb3JpZ2luYWxDZW50cyAmJlxuICAgIGRpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgZGlzY291bnRlZENlbnRzIDwgb3JpZ2luYWxDZW50c1xuICApIHtcbiAgICBkaXNjb3VudFBlcmNlbnQgPSBNYXRoLnJvdW5kKFxuICAgICAgKChvcmlnaW5hbENlbnRzIC0gZGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBvcmlnaW5hbENlbnRzXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGltYWdlVXJsID0gaGl0LnByb2R1Y3RJbWFnZVNxdWFyZSB8fCBoaXQucHJvZHVjdEltYWdlIHx8IG51bGw7XG4gIGNvbnN0IHN0b3JlVXJsID0gaGl0LnVybFxuICAgID8gYGh0dHBzOi8vd3d3Lm5pbnRlbmRvLmNvbSR7aGl0LnVybH1gXG4gICAgOiBgaHR0cHM6Ly93d3cubmludGVuZG8uY29tL3VzL3N0b3JlL3Byb2R1Y3RzLyR7aWR9L2A7XG5cbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICBuYW1lLFxuICAgIGltYWdlVXJsLFxuICAgIHN0b3JlVXJsLFxuICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBoaXQucGxhdGZvcm0gfHwgXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICBjdXJyZW5jeTogXCJVU0RcIixcbiAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG9yaWdpbmFsQ2VudHMsXG4gICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRpc2NvdW50ZWRDZW50cyxcbiAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgZGlzY291bnRFbmRBdDogaGl0LmVzaG9wRGV0YWlscz8uZGlzY291bnRQcmljZUVuZCB8fCBudWxsLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiogZmV0Y2hOaW50ZW5kb1VTKCk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgY29uc3QgZmlsdGVyID0gYXdhaXQgZmluZFdvcmtpbmdGaWx0ZXIoKTtcbiAgY29uc3QgcGFnZVNpemUgPSA1MDA7XG4gIGNvbnN0IG1heFBhZ2VzID0gNTA7XG4gIGxldCBlbWl0dGVkID0gMDtcbiAgbGV0IHBhZ2VzV2l0aG91dE5ldyA9IDA7XG5cbiAgZm9yIChsZXQgcGFnZSA9IDA7IHBhZ2UgPCBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgY29uc3QgZXh0cmEgPSBmaWx0ZXIgPyBgJiR7ZmlsdGVyfWAgOiBcIlwiO1xuICAgIGNvbnN0IHBhcmFtcyA9IGBxdWVyeT0maGl0c1BlclBhZ2U9JHtwYWdlU2l6ZX0mcGFnZT0ke3BhZ2V9JHtleHRyYX1gO1xuXG4gICAgbGV0IGRhdGE6IGFueTtcbiAgICB0cnkge1xuICAgICAgZGF0YSA9IGF3YWl0IGFsZ29saWFRdWVyeShwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChwYWdlID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFwibmludGVuZG9cIiwgXCJ1c1wiLCBgQWxnb2xpYSByZXF1ZXN0IGZhaWxlZDogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGhpdHM6IEFsZ29saWFIaXRbXSA9IGRhdGE/LmhpdHMgPz8gW107XG4gICAgaWYgKGhpdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAocGFnZSA9PT0gMCkge1xuICAgICAgICBjb25zdCBtc2cgPSBkYXRhPy5tZXNzYWdlIHx8IGAwIGhpdHMgKG5iSGl0cz0ke2RhdGE/Lm5iSGl0c30pYDtcbiAgICAgICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXCJuaW50ZW5kb1wiLCBcInVzXCIsIGBBbGdvbGlhIHJldHVybmVkIG5vIHJlc3VsdHM6ICR7bXNnfWApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgbGV0IHBhZ2VEZWFscyA9IDA7XG4gICAgZm9yIChjb25zdCBoaXQgb2YgaGl0cykge1xuICAgICAgY29uc3QgZGVhbCA9IHBhcnNlTmludGVuZG9IaXQoaGl0KTtcbiAgICAgIGlmIChkZWFsKSB7XG4gICAgICAgIHBhZ2VEZWFscysrO1xuICAgICAgICBlbWl0dGVkKys7XG4gICAgICAgIHlpZWxkIGRlYWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgZmV0Y2hpbmcgdW5maWx0ZXJlZCBhbmQgMyBjb25zZWN1dGl2ZSBwYWdlcyBoYXZlIG5vIGRlYWxzLCBzdG9wIGVhcmx5XG4gICAgaWYgKCFmaWx0ZXIgJiYgcGFnZURlYWxzID09PSAwKSB7XG4gICAgICBwYWdlc1dpdGhvdXROZXcrKztcbiAgICAgIGlmIChwYWdlc1dpdGhvdXROZXcgPj0gMykgYnJlYWs7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2VzV2l0aG91dE5ldyA9IDA7XG4gICAgfVxuXG4gICAgY29uc3QgdG90YWxQYWdlcyA9IGRhdGE/Lm5iUGFnZXMgPz8gMDtcbiAgICBpZiAocGFnZSArIDEgPj0gdG90YWxQYWdlcykgYnJlYWs7XG4gIH1cblxuICBpZiAoZW1pdHRlZCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFwibmludGVuZG9cIiwgXCJ1c1wiLCBcIk5vIHNlIGVuY29udHJhcm9uIGp1ZWdvcyBlbiBvZmVydGEgZW4gTmludGVuZG8gVVNcIik7XG4gIH1cbn1cblxuLy8gLS0tIEphcGFuIGVTaG9wIHZpYSBzdG9yZS1qcC5uaW50ZW5kby5jb20gKFNGQ0MpIC0tLVxuLy8gUHJpbWFyeTogSFRNTCBzY3JhcGluZyBvZiB0aGUgb2ZmaWNpYWwgc3RvcmUgbGlzdGluZy5cbi8vIEZhbGxiYWNrOiBzZWFyY2gubmludGVuZG8uanAgSlNPTiBBUEkuXG5cbmZ1bmN0aW9uIGpwWWVuVG9DZW50cyhzOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICghcykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNsZWFuZWQgPSBzLnJlcGxhY2UoL1teMC05XS9nLCBcIlwiKTtcbiAgY29uc3QgbiA9IHBhcnNlSW50KGNsZWFuZWQsIDEwKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobikgfHwgbiA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIC8vIEpQWSBoYXMgbm8gZGVjaW1hbHM7IHN0b3JlIGFzIHllbiBcdTAwRDcgMTAwIGZvciBjb25zaXN0ZW5jeSB3aXRoIG90aGVyIGN1cnJlbmNpZXNcbiAgcmV0dXJuIG4gKiAxMDA7XG59XG5cbi8qKiBQYXJzZSBwcm9kdWN0cyBmcm9tIHRoZSBzdG9yZS1qcC5uaW50ZW5kby5jb20gSFRNTCBsaXN0aW5nLlxuICogIFRoZSBwYWdlIGVtYmVkcyBwcm9kdWN0IHRpbGVzIHdpdGggc3RydWN0dXJlZCBkYXRhIHdlIGNhbiByZWdleC1leHRyYWN0LiAqL1xuZnVuY3Rpb24gcGFyc2VKcFN0b3JlSHRtbChodG1sOiBzdHJpbmcpOiBSYXdEZWFsW10ge1xuICBjb25zdCBkZWFsczogUmF3RGVhbFtdID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAvLyBTdHJhdGVneSAxOiBMb29rIGZvciBKU09OLUxEIHByb2R1Y3QgZGF0YVxuICBjb25zdCBqc29uTGRSZWdleCA9IC88c2NyaXB0W14+XSp0eXBlPVtcIiddYXBwbGljYXRpb25cXC9sZFxcK2pzb25bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+L2dpO1xuICBsZXQganNvbkxkTWF0Y2g7XG4gIHdoaWxlICgoanNvbkxkTWF0Y2ggPSBqc29uTGRSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsZCA9IEpTT04ucGFyc2UoanNvbkxkTWF0Y2hbMV0pO1xuICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5pc0FycmF5KGxkKSA/IGxkIDogbGRbXCJAZ3JhcGhcIl0gPyBsZFtcIkBncmFwaFwiXSA6IFtsZF07XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgaWYgKGl0ZW1bXCJAdHlwZVwiXSAhPT0gXCJQcm9kdWN0XCIgJiYgaXRlbVtcIkB0eXBlXCJdICE9PSBcIlZpZGVvR2FtZVwiKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgaWQgPSBpdGVtLnNrdSB8fCBpdGVtLnByb2R1Y3RJRCB8fCBpdGVtLmlkZW50aWZpZXI7XG4gICAgICAgIGlmICghaWQgfHwgc2Vlbi5oYXMoaWQpKSBjb250aW51ZTtcbiAgICAgICAgc2Vlbi5hZGQoaWQpO1xuICAgICAgICBjb25zdCBvZmZlciA9IEFycmF5LmlzQXJyYXkoaXRlbS5vZmZlcnMpID8gaXRlbS5vZmZlcnNbMF0gOiBpdGVtLm9mZmVycztcbiAgICAgICAgZGVhbHMucHVzaCh7XG4gICAgICAgICAgaWQ6IFN0cmluZyhpZCksXG4gICAgICAgICAgbmFtZTogaXRlbS5uYW1lIHx8IFwiXCIsXG4gICAgICAgICAgaW1hZ2VVcmw6IGl0ZW0uaW1hZ2UgfHwgbnVsbCxcbiAgICAgICAgICBzdG9yZVVybDogaXRlbS51cmwgfHwgYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2l0ZW0vc29mdHdhcmUvJHtpZH1gLFxuICAgICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgICAgIGN1cnJlbmN5OiBcIkpQWVwiLFxuICAgICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogbnVsbCxcbiAgICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czoganBZZW5Ub0NlbnRzKG9mZmVyPy5wcmljZSB8fCBvZmZlcj8ubG93UHJpY2UpLFxuICAgICAgICAgIGRpc2NvdW50UGVyY2VudDogMCxcbiAgICAgICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgLyogaWdub3JlIG1hbGZvcm1lZCBKU09OLUxEICovIH1cbiAgfVxuXG4gIGlmIChkZWFscy5sZW5ndGggPiAwKSByZXR1cm4gZGVhbHM7XG5cbiAgLy8gU3RyYXRlZ3kgMjogRXh0cmFjdCBmcm9tIGVtYmVkZGVkIF9fTkVYVF9EQVRBX18gb3Igc2ltaWxhciBKU09OIGJsb2JzXG4gIGNvbnN0IG5leHREYXRhTWF0Y2ggPSAvPHNjcmlwdFtePl0qaWQ9W1wiJ11fX05FWFRfREFUQV9fW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi8uZXhlYyhodG1sKTtcbiAgaWYgKG5leHREYXRhTWF0Y2gpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobmV4dERhdGFNYXRjaFsxXSk7XG4gICAgICBjb25zdCBwcm9kdWN0cyA9IGZpbmRQcm9kdWN0c0luVHJlZShkYXRhKTtcbiAgICAgIGZvciAoY29uc3QgcCBvZiBwcm9kdWN0cykge1xuICAgICAgICBpZiAoc2Vlbi5oYXMocC5pZCkpIGNvbnRpbnVlO1xuICAgICAgICBzZWVuLmFkZChwLmlkKTtcbiAgICAgICAgZGVhbHMucHVzaChwKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cbiAgfVxuXG4gIGlmIChkZWFscy5sZW5ndGggPiAwKSByZXR1cm4gZGVhbHM7XG5cbiAgLy8gU3RyYXRlZ3kgMzogUmVnZXggc2NyYXBlIHByb2R1Y3QgdGlsZXMgZnJvbSBIVE1MXG4gIC8vIE5pbnRlbmRvIEpQIHN0b3JlIHRpbGVzIHR5cGljYWxseSBoYXZlIGRhdGEgYXR0cmlidXRlcyBvciBzdHJ1Y3R1cmVkIGNsYXNzIHBhdHRlcm5zXG4gIGNvbnN0IHRpbGVSZWdleCA9XG4gICAgL2RhdGEtcGlkPVtcIiddKFteXCInXSspW1wiJ11bXFxzXFxTXSo/PFtePl0qY2xhc3M9W1wiJ11bXlwiJ10qcHJvZHVjdC1uYW1lW15cIiddKltcIiddW14+XSo+KFtePF0rKTxbXFxzXFxTXSo/KD86ZGF0YS1wcmljZXxjbGFzcz1bXCInXVteXCInXSpwcmljZVteXCInXSpbXCInXSlbXj5dKj4oW148XSopPC9naTtcbiAgbGV0IHRpbGVNYXRjaDtcbiAgd2hpbGUgKCh0aWxlTWF0Y2ggPSB0aWxlUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBpZCA9IHRpbGVNYXRjaFsxXS50cmltKCk7XG4gICAgaWYgKCFpZCB8fCBzZWVuLmhhcyhpZCkpIGNvbnRpbnVlO1xuICAgIHNlZW4uYWRkKGlkKTtcbiAgICBkZWFscy5wdXNoKHtcbiAgICAgIGlkLFxuICAgICAgbmFtZTogdGlsZU1hdGNoWzJdLnRyaW0oKSxcbiAgICAgIGltYWdlVXJsOiBudWxsLFxuICAgICAgc3RvcmVVcmw6IGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9pdGVtL3NvZnR3YXJlLyR7aWR9YCxcbiAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgICAgY3VycmVuY3k6IFwiSlBZXCIsXG4gICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG51bGwsXG4gICAgICBwcmljZURpc2NvdW50ZWRDZW50czoganBZZW5Ub0NlbnRzKHRpbGVNYXRjaFszXSksXG4gICAgICBkaXNjb3VudFBlcmNlbnQ6IDAsXG4gICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gU3RyYXRlZ3kgNDogTG9vayBmb3IgYW55IGVtYmVkZGVkIHByb2R1Y3QgSlNPTiBhcnJheXNcbiAgY29uc3QganNvbkFycmF5UmVnZXggPSAvXFxbKFxce1wiW15cIl0qaWRbXlwiXSpcIls6XFxzXSpcIlteXCJdKlwiW1xcc1xcU10qP1xcfSg/OixcXHMqXFx7W1xcc1xcU10qP1xcfSkqKVxcXS9nO1xuICBsZXQgYXJyTWF0Y2g7XG4gIHdoaWxlICgoYXJyTWF0Y2ggPSBqc29uQXJyYXlSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcnIgPSBKU09OLnBhcnNlKFwiW1wiICsgYXJyTWF0Y2hbMV0gKyBcIl1cIik7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYXJyKSB7XG4gICAgICAgIGNvbnN0IGlkID0gaXRlbS5pZCB8fCBpdGVtLm5zdWlkIHx8IGl0ZW0ucHJvZHVjdElkIHx8IGl0ZW0ucGlkO1xuICAgICAgICBjb25zdCBuYW1lID0gaXRlbS50aXRsZSB8fCBpdGVtLm5hbWUgfHwgaXRlbS5wcm9kdWN0TmFtZTtcbiAgICAgICAgaWYgKCFpZCB8fCAhbmFtZSB8fCBzZWVuLmhhcyhTdHJpbmcoaWQpKSkgY29udGludWU7XG4gICAgICAgIHNlZW4uYWRkKFN0cmluZyhpZCkpO1xuICAgICAgICBjb25zdCBwcmljZSA9IGl0ZW0uc2FsZVByaWNlIHx8IGl0ZW0ucHJpY2UgfHwgaXRlbS5kaXNjb3VudFByaWNlO1xuICAgICAgICBjb25zdCBvcmlnUHJpY2UgPSBpdGVtLm9yaWdpbmFsUHJpY2UgfHwgaXRlbS5yZWd1bGFyUHJpY2UgfHwgaXRlbS5saXN0UHJpY2U7XG4gICAgICAgIGRlYWxzLnB1c2goe1xuICAgICAgICAgIGlkOiBTdHJpbmcoaWQpLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgaW1hZ2VVcmw6IGl0ZW0uaW1hZ2UgfHwgaXRlbS5pbWFnZVVybCB8fCBpdGVtLnRodW1ibmFpbCB8fCBudWxsLFxuICAgICAgICAgIHN0b3JlVXJsOiBpdGVtLnVybCB8fCBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vaXRlbS9zb2Z0d2FyZS8ke2lkfWAsXG4gICAgICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiTmludGVuZG8gU3dpdGNoXCIsXG4gICAgICAgICAgY3VycmVuY3k6IFwiSlBZXCIsXG4gICAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBqcFllblRvQ2VudHMoU3RyaW5nKG9yaWdQcmljZSA/PyBcIlwiKSksXG4gICAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGpwWWVuVG9DZW50cyhTdHJpbmcocHJpY2UgPz8gXCJcIikpLFxuICAgICAgICAgIGRpc2NvdW50UGVyY2VudDogcGFyc2VJbnQoaXRlbS5kaXNjb3VudFJhdGUgfHwgaXRlbS5kaXNjb3VudFBlcmNlbnQgfHwgXCIwXCIpIHx8IDAsXG4gICAgICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IC8qIG5vdCB2YWxpZCBKU09OIGFycmF5ICovIH1cbiAgfVxuXG4gIHJldHVybiBkZWFscztcbn1cblxuZnVuY3Rpb24gZmluZFByb2R1Y3RzSW5UcmVlKG5vZGU6IHVua25vd24sIHJlc3VsdHM6IFJhd0RlYWxbXSA9IFtdKTogUmF3RGVhbFtdIHtcbiAgaWYgKCFub2RlIHx8IHR5cGVvZiBub2RlICE9PSBcIm9iamVjdFwiKSByZXR1cm4gcmVzdWx0cztcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICBmb3IgKGNvbnN0IHYgb2Ygbm9kZSkgZmluZFByb2R1Y3RzSW5UcmVlKHYsIHJlc3VsdHMpO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG4gIGNvbnN0IG9iaiA9IG5vZGUgYXMgUmVjb3JkPHN0cmluZywgYW55PjtcbiAgY29uc3QgaWQgPSBvYmoubnN1aWQgfHwgb2JqLmlkIHx8IG9iai5wcm9kdWN0SWQ7XG4gIGNvbnN0IG5hbWUgPSBvYmoudGl0bGUgfHwgb2JqLm5hbWU7XG4gIGNvbnN0IGhhc1ByaWNlID0gb2JqLnByaWNlICE9IG51bGwgfHwgb2JqLnNhbGVQcmljZSAhPSBudWxsIHx8IG9iai5yZWd1bGFyUHJpY2UgIT0gbnVsbDtcbiAgaWYgKGlkICYmIG5hbWUgJiYgaGFzUHJpY2UpIHtcbiAgICByZXN1bHRzLnB1c2goe1xuICAgICAgaWQ6IFN0cmluZyhpZCksXG4gICAgICBuYW1lOiBTdHJpbmcobmFtZSksXG4gICAgICBpbWFnZVVybDogb2JqLmltYWdlIHx8IG9iai5pbWFnZVVybCB8fCBudWxsLFxuICAgICAgc3RvcmVVcmw6IG9iai51cmwgfHwgYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2l0ZW0vc29mdHdhcmUvJHtpZH1gLFxuICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiTmludGVuZG8gU3dpdGNoXCIsXG4gICAgICBjdXJyZW5jeTogXCJKUFlcIixcbiAgICAgIHByaWNlT3JpZ2luYWxDZW50czoganBZZW5Ub0NlbnRzKFN0cmluZyhvYmoucmVndWxhclByaWNlID8/IG9iai5vcmlnaW5hbFByaWNlID8/IG9iai5wcmljZSA/PyBcIlwiKSksXG4gICAgICBwcmljZURpc2NvdW50ZWRDZW50czoganBZZW5Ub0NlbnRzKFN0cmluZyhvYmouc2FsZVByaWNlID8/IG9iai5kaXNjb3VudFByaWNlID8/IG9iai5wcmljZSA/PyBcIlwiKSksXG4gICAgICBkaXNjb3VudFBlcmNlbnQ6IHBhcnNlSW50KG9iai5kaXNjb3VudFJhdGUgfHwgb2JqLmRpc2NvdW50UGVyY2VudCB8fCBcIjBcIikgfHwgMCxcbiAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgfSk7XG4gIH1cbiAgZm9yIChjb25zdCB2IG9mIE9iamVjdC52YWx1ZXMob2JqKSkgZmluZFByb2R1Y3RzSW5UcmVlKHYsIHJlc3VsdHMpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cblxuYXN5bmMgZnVuY3Rpb24qIGZldGNoTmludGVuZG9KUF9TdG9yZSgpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gIGNvbnN0IG1heFBhZ2VzID0gNTA7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGxldCBwYWdlID0gMTsgcGFnZSA8PSBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9saXN0L3NvZnR3YXJlYCArXG4gICAgICBgP3NvZnRUeXBlPVRJVExFJmlzU2FsZT10cnVlJnNydWxlPW1vc3QtcG9wdWxhciZwYWdlPSR7cGFnZX1gO1xuXG4gICAgbGV0IGh0bWw6IHN0cmluZztcbiAgICB0cnkge1xuICAgICAgaHRtbCA9IGF3YWl0IGZldGNoSHRtbCh1cmwpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgZGVhbHMgPSBwYXJzZUpwU3RvcmVIdG1sKGh0bWwpO1xuICAgIGxldCBuZXdPblBhZ2UgPSAwO1xuICAgIGZvciAoY29uc3QgZGVhbCBvZiBkZWFscykge1xuICAgICAgaWYgKHNlZW4uaGFzKGRlYWwuaWQpKSBjb250aW51ZTtcbiAgICAgIHNlZW4uYWRkKGRlYWwuaWQpO1xuICAgICAgbmV3T25QYWdlKys7XG5cbiAgICAgIGlmIChcbiAgICAgICAgZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMgJiZcbiAgICAgICAgZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cyAmJlxuICAgICAgICBkZWFsLnByaWNlRGlzY291bnRlZENlbnRzIDwgZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMgJiZcbiAgICAgICAgIWRlYWwuZGlzY291bnRQZXJjZW50XG4gICAgICApIHtcbiAgICAgICAgZGVhbC5kaXNjb3VudFBlcmNlbnQgPSBNYXRoLnJvdW5kKFxuICAgICAgICAgICgoZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMgLSBkZWFsLnByaWNlRGlzY291bnRlZENlbnRzKSAqIDEwMCkgL1xuICAgICAgICAgICAgZGVhbC5wcmljZU9yaWdpbmFsQ2VudHNcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgeWllbGQgZGVhbDtcbiAgICB9XG5cbiAgICBpZiAobmV3T25QYWdlID09PSAwKSBicmVhaztcbiAgfVxufVxuXG4vKiogRmFsbGJhY2s6IHNlYXJjaC5uaW50ZW5kby5qcCBKU09OIEFQSSAqL1xuYXN5bmMgZnVuY3Rpb24qIGZldGNoTmludGVuZG9KUF9TZWFyY2hBcGkoKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICBjb25zdCBwYWdlU2l6ZSA9IDMwMDtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgY29uc3QgbWF4SXRlbXMgPSA2MDAwO1xuXG4gIHdoaWxlIChzdGFydCA8IG1heEl0ZW1zKSB7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL3NlYXJjaC5uaW50ZW5kby5qcC9uaW50ZW5kb19zb2Z0L3NlYXJjaC5qc29uYCArXG4gICAgICBgP29wdF9zc2hvdz0xJmZxPXNzaXR1X3M6b25zYWxlK2hhcmRfczoxX0hBQ2AgK1xuICAgICAgYCZyb3dzPSR7cGFnZVNpemV9JnN0YXJ0PSR7c3RhcnR9JnNvcnQ9c2NvcmUrZGVzY2A7XG5cbiAgICBsZXQgZGF0YTogYW55O1xuICAgIHRyeSB7XG4gICAgICBkYXRhID0gYXdhaXQgZmV0Y2hKc29uKHVybCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBkb2NzID0gZGF0YT8ucmVzdWx0Py5pdGVtcyA/PyBbXTtcbiAgICBpZiAoZG9jcy5sZW5ndGggPT09IDApIGJyZWFrO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGRvY3MpIHtcbiAgICAgIGNvbnN0IGlkID0gaXRlbS5uc3VpZCB8fCBpdGVtLmlkO1xuICAgICAgY29uc3QgbmFtZSA9IGl0ZW0udGl0bGU7XG4gICAgICBpZiAoIW5hbWUgfHwgIWlkKSBjb250aW51ZTtcblxuICAgICAgY29uc3Qgb3JpZ2luYWxDZW50cyA9IGpwWWVuVG9DZW50cyhpdGVtLnBwcmkpO1xuICAgICAgY29uc3QgZGlzY291bnRlZENlbnRzID0ganBZZW5Ub0NlbnRzKGl0ZW0uc3ByaSkgPz8gb3JpZ2luYWxDZW50cztcblxuICAgICAgbGV0IGRpc2NvdW50UGVyY2VudCA9IHBhcnNlSW50KGl0ZW0uZHNwZXIpIHx8IDA7XG4gICAgICBpZiAoXG4gICAgICAgICFkaXNjb3VudFBlcmNlbnQgJiZcbiAgICAgICAgb3JpZ2luYWxDZW50cyAmJlxuICAgICAgICBkaXNjb3VudGVkQ2VudHMgIT0gbnVsbCAmJlxuICAgICAgICBkaXNjb3VudGVkQ2VudHMgPCBvcmlnaW5hbENlbnRzXG4gICAgICApIHtcbiAgICAgICAgZGlzY291bnRQZXJjZW50ID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAoKG9yaWdpbmFsQ2VudHMgLSBkaXNjb3VudGVkQ2VudHMpICogMTAwKSAvIG9yaWdpbmFsQ2VudHNcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFvcmlnaW5hbENlbnRzICYmICFkaXNjb3VudGVkQ2VudHMpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBpbWFnZVVybCA9IGl0ZW0uaXVybCB8fCBudWxsO1xuICAgICAgY29uc3Qgc3RvcmVVcmwgPVxuICAgICAgICBpdGVtLnNzbHVybCB8fFxuICAgICAgICBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vaXRlbS9zb2Z0d2FyZS8ke2lkfWA7XG5cbiAgICAgIHlpZWxkIHtcbiAgICAgICAgaWQ6IFN0cmluZyhpZCksXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGltYWdlVXJsLFxuICAgICAgICBzdG9yZVVybCxcbiAgICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiTmludGVuZG8gU3dpdGNoXCIsXG4gICAgICAgIGN1cnJlbmN5OiBcIkpQWVwiLFxuICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG9yaWdpbmFsQ2VudHMsXG4gICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBkaXNjb3VudGVkQ2VudHMsXG4gICAgICAgIGRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgc3RhcnQgKz0gcGFnZVNpemU7XG4gICAgY29uc3QgdG90YWxDb3VudCA9IGRhdGE/LnJlc3VsdD8udG90YWwgPz8gMDtcbiAgICBpZiAoc3RhcnQgPj0gdG90YWxDb3VudCkgYnJlYWs7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24qIGZldGNoTmludGVuZG9KUCgpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gIC8vIFRyeSB0aGUgb2ZmaWNpYWwgc3RvcmUgZmlyc3QsIGZhbGwgYmFjayB0byBzZWFyY2ggQVBJXG4gIGxldCBjb3VudCA9IDA7XG4gIHRyeSB7XG4gICAgZm9yIGF3YWl0IChjb25zdCBkZWFsIG9mIGZldGNoTmludGVuZG9KUF9TdG9yZSgpKSB7XG4gICAgICBjb3VudCsrO1xuICAgICAgeWllbGQgZGVhbDtcbiAgICB9XG4gIH0gY2F0Y2ggeyAvKiBzdG9yZSBzY3JhcGUgZmFpbGVkICovIH1cblxuICBpZiAoY291bnQgPT09IDApIHtcbiAgICAvLyBGYWxsYmFjayB0byBzZWFyY2ggQVBJXG4gICAgeWllbGQqIGZldGNoTmludGVuZG9KUF9TZWFyY2hBcGkoKTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgbmludGVuZG9Qcm92aWRlcjogUHJvdmlkZXIgPSB7XG4gIHBsYXRmb3JtOiBcIm5pbnRlbmRvXCIsXG4gIGFzeW5jICpmZXRjaERlYWxzKHNvdXJjZTogUHJvdmlkZXJTb3VyY2UpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gICAgY29uc3QgY3VycmVuY3kgPSBDVVJSRU5DWV9NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgaWYgKCFjdXJyZW5jeSkge1xuICAgICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXG4gICAgICAgIFwibmludGVuZG9cIixcbiAgICAgICAgc291cmNlLnJlZ2lvbixcbiAgICAgICAgYFJlZ2lcdTAwRjNuIG5vIHNvcG9ydGFkYTogJHtzb3VyY2UucmVnaW9ufWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZS5yZWdpb24gPT09IFwidXNcIikge1xuICAgICAgeWllbGQqIGZldGNoTmludGVuZG9VUygpO1xuICAgIH0gZWxzZSBpZiAoc291cmNlLnJlZ2lvbiA9PT0gXCJqcFwiKSB7XG4gICAgICB5aWVsZCogZmV0Y2hOaW50ZW5kb0pQKCk7XG4gICAgfVxuICB9LFxufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvaW5kZXgudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL2luZGV4LnRzXCI7ZXhwb3J0IHR5cGUgeyBQbGF0Zm9ybSwgUHJvdmlkZXJTb3VyY2UsIFJhd0RlYWwsIFJlZ2lvbkNvbmZpZyB9IGZyb20gXCIuL3R5cGVzXCI7XG5leHBvcnQgeyBQTEFURk9STV9MQUJFTFMsIFBMQVRGT1JNX1JFR0lPTlMsIFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5pbXBvcnQgdHlwZSB7IFBsYXRmb3JtLCBQcm92aWRlciB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBwc25Qcm92aWRlciB9IGZyb20gXCIuL3BzblwiO1xuaW1wb3J0IHsgeGJveFByb3ZpZGVyIH0gZnJvbSBcIi4veGJveFwiO1xuaW1wb3J0IHsgc3RlYW1Qcm92aWRlciB9IGZyb20gXCIuL3N0ZWFtXCI7XG5pbXBvcnQgeyBuaW50ZW5kb1Byb3ZpZGVyIH0gZnJvbSBcIi4vbmludGVuZG9cIjtcblxuY29uc3QgUFJPVklERVJTOiBSZWNvcmQ8UGxhdGZvcm0sIFByb3ZpZGVyPiA9IHtcbiAgcHNuOiBwc25Qcm92aWRlcixcbiAgeGJveDogeGJveFByb3ZpZGVyLFxuICBzdGVhbTogc3RlYW1Qcm92aWRlcixcbiAgbmludGVuZG86IG5pbnRlbmRvUHJvdmlkZXIsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvdmlkZXIocGxhdGZvcm06IFBsYXRmb3JtKTogUHJvdmlkZXIge1xuICByZXR1cm4gUFJPVklERVJTW3BsYXRmb3JtXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbFByb3ZpZGVycygpOiBQcm92aWRlcltdIHtcbiAgcmV0dXJuIE9iamVjdC52YWx1ZXMoUFJPVklERVJTKTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL2V4Y2hhbmdlLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL2V4Y2hhbmdlLnRzXCI7LyoqXG4gKiBFeGNoYW5nZSByYXRlIGZldGNoZXIgdmlhIG1pbmRpY2Fkb3IuY2wgKENoaWxlYW4gcHVibGljIEFQSSwgbm8gYXV0aCBuZWVkZWQpLlxuICogRmV0Y2hlcyB0aGUgbGF0ZXN0IG9ic2VydmVkIHZhbHVlcyBmb3IgVVNELCBCUkwsIGFuZCBUUlkgXHUyMTkyIENMUC5cbiAqL1xuXG5pbnRlcmZhY2UgTWluZGljYWRvclNlcmllIHtcbiAgY29kaWdvOiBzdHJpbmc7XG4gIG5vbWJyZTogc3RyaW5nO1xuICB1bmlkYWRfbWVkaWRhOiBzdHJpbmc7XG4gIHNlcmllOiBBcnJheTx7IGZlY2hhOiBzdHJpbmc7IHZhbG9yOiBudW1iZXIgfT47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSW5kaWNhZG9yKGNvZGlnbzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gIGNvbnN0IHVybCA9IGBodHRwczovL21pbmRpY2Fkb3IuY2wvYXBpLyR7Y29kaWdvfWA7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczogeyBhY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLCBcInVzZXItYWdlbnRcIjogXCJhcGlwc24vMS4wXCIgfSxcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgci5qc29uKCkpIGFzIE1pbmRpY2Fkb3JTZXJpZTtcbiAgICBjb25zdCB2YWx1ZSA9IGRhdGE/LnNlcmllPy5bMF0/LnZhbG9yO1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKHZhbHVlKSA/IHZhbHVlIDogbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeGNoYW5nZVJhdGVzIHtcbiAgdXNkVG9DbHA6IG51bWJlciB8IG51bGw7XG4gIGJybFRvQ2xwOiBudW1iZXIgfCBudWxsO1xuICB0cnlUb0NscDogbnVtYmVyIHwgbnVsbDtcbiAgZmV0Y2hlZEF0OiBzdHJpbmc7XG4gIGVycm9yczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaEV4Y2hhbmdlUmF0ZXMoKTogUHJvbWlzZTxFeGNoYW5nZVJhdGVzPiB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIEZldGNoIFVTRCBcdTIxOTIgQ0xQIGRpcmVjdGx5XG4gIGNvbnN0IHVzZCA9IGF3YWl0IGZldGNoSW5kaWNhZG9yKFwiZG9sYXJcIik7XG4gIGlmICh1c2QgPT0gbnVsbCkgZXJyb3JzLnB1c2goXCJVU0Qgbm8gZGlzcG9uaWJsZSBlbiBtaW5kaWNhZG9yLmNsXCIpO1xuXG4gIC8vIEJSTCBcdTIxOTIgQ0xQOiBmZXRjaCBCUkwvVVNEIHJhdGUgZnJvbSBhIGZyZWUgZXhjaGFuZ2UgcmF0ZSBlbmRwb2ludFxuICAvLyBtaW5kaWNhZG9yLmNsIGRvZXNuJ3QgaGF2ZSBCUkwgZGlyZWN0bHksIHNvIGFwcHJveGltYXRlIHZpYSBVU0RcbiAgLy8gQlJML1VTRCBcdTIyNDggbWluZGljYWRvciBkb2Vzbid0IGNhcnJ5IHRoaXMuIFdlIGZhbGwgYmFjayB0byB0aGUgdXNlci1jb25maWd1cmVkIHZhbHVlLlxuICAvLyBGb3IgVFJZLCBzYW1lIHNpdHVhdGlvbi4gT25seSBVU0QgaXMgcmVsaWFibHkgYXZhaWxhYmxlIGZyb20gbWluZGljYWRvci5jbC5cblxuICByZXR1cm4ge1xuICAgIHVzZFRvQ2xwOiB1c2QsXG4gICAgYnJsVG9DbHA6IG51bGwsXG4gICAgdHJ5VG9DbHA6IG51bGwsXG4gICAgZmV0Y2hlZEF0OiBub3csXG4gICAgZXJyb3JzLFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvc2NoZWR1bGVyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3NjaGVkdWxlci50c1wiOy8qKlxuICogT3B0aW9uYWwgcGVyaW9kaWMgcmVmcmVzaCBzY2hlZHVsZXIuIERpc2FibGVkIGJ5IGRlZmF1bHQuXG4gKiBFbmFibGVkL2Rpc2FibGVkIHZpYSBzdG9yZSBzZXR0aW5ncyAoYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzID0gMCBtZWFucyBvZmYpLlxuICovXG5pbXBvcnQgeyBzdG9yZSB9IGZyb20gXCIuL3N0b3JlXCI7XG5cbnR5cGUgUmVmcmVzaEZuID0gKCkgPT4gUHJvbWlzZTx2b2lkPjtcblxubGV0IHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xubGV0IGxhc3RBdXRvUmVmcmVzaEF0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RBdXRvUmVmcmVzaEF0KCk6IHN0cmluZyB8IG51bGwge1xuICByZXR1cm4gbGFzdEF1dG9SZWZyZXNoQXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFNjaGVkdWxlcihyZWZyZXNoRm46IFJlZnJlc2hGbik6IHZvaWQge1xuICByZXNjaGVkdWxlKHJlZnJlc2hGbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNjaGVkdWxlKHJlZnJlc2hGbjogUmVmcmVzaEZuKTogdm9pZCB7XG4gIGlmICh0aW1lcikge1xuICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgIHRpbWVyID0gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGludGVydmFsSG91cnMgPSBzdG9yZS5nZXRBdXRvUmVmcmVzaEludGVydmFsKCk7XG4gIGlmICghaW50ZXJ2YWxIb3VycyB8fCBpbnRlcnZhbEhvdXJzIDw9IDApIHJldHVybjtcblxuICBjb25zdCBtcyA9IGludGVydmFsSG91cnMgKiA2MCAqIDYwICogMTAwMDtcbiAgdGltZXIgPSBzZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJlZnJlc2hGbigpO1xuICAgICAgbGFzdEF1dG9SZWZyZXNoQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBTY2hlZHVsZXIgZXJyb3JzIGFyZSBub24tZmF0YWxcbiAgICB9XG4gIH0sIG1zKTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3BzLXBsdXMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHMtcGx1cy50c1wiOy8qKlxuICogUFMgUGx1cyBtZW1iZXJzaGlwIHByaWNlIHRyYWNrZXIgXHUyMDE0IG11bHRpLXJlZ2lvbi5cbiAqXG4gKiBUcmFja3MgUFMgUGx1cyBTS1VzIGFjcm9zcyBVUywgQlIsIGFuZCBUUiByZWdpb25zIHdpdGg6XG4gKiAgIC0gUHJpY2VzIHNjcmFwZWQgZnJvbSBwbGF5c3RhdGlvbi5jb20gKHdpdGggaGFyZGNvZGVkIGZhbGxiYWNrcylcbiAqICAgLSBFc3RpbWF0ZWQgQ0xQIGNvc3QgdXNpbmcgY29uZmlndXJlZCBleGNoYW5nZSByYXRlcyArIHB1cmNoYXNlIGZlZVxuICogICAtIENvbXBldGl0b3IgcHJpY2VzIChmdXp6eS1tYXRjaGVkIGZyb20gZXhpc3RpbmcgY29tcGV0aXRvciBwcm9kdWN0cylcbiAqL1xuaW1wb3J0IHsgdG9rZW5pemUsIHNpbWlsYXJpdHkgfSBmcm9tIFwiLi9jb21wZXRpdG9yc1wiO1xuaW1wb3J0IHR5cGUgeyBDb21wZXRpdG9yUHJvZHVjdCwgQ29tcGV0aXRvck1hdGNoIH0gZnJvbSBcIi4vY29tcGV0aXRvcnNcIjtcbmltcG9ydCB0eXBlIHsgUHJpY2luZ1NldHRpbmdzIH0gZnJvbSBcIi4vc3RvcmVcIjtcblxuZXhwb3J0IHR5cGUgUGx1c1RpZXIgPSBcImVzc2VudGlhbFwiIHwgXCJleHRyYVwiIHwgXCJwcmVtaXVtXCI7XG5leHBvcnQgdHlwZSBQbHVzRHVyYXRpb24gPSBcIjFtXCIgfCBcIjNtXCIgfCBcIjEybVwiO1xuZXhwb3J0IHR5cGUgUGx1c1JlZ2lvbiA9IFwidXNcIiB8IFwiYnJcIiB8IFwidHJcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQbHVzUmVnaW9uUHJpY2Uge1xuICByZWdpb246IFBsdXNSZWdpb247XG4gIGN1cnJlbmN5OiBzdHJpbmc7XG4gIHByaWNlOiBudW1iZXI7XG4gIHByaWNlQ2xwOiBudW1iZXIgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBsdXNQbGFuIHtcbiAgdGllcjogUGx1c1RpZXI7XG4gIGR1cmF0aW9uOiBQbHVzRHVyYXRpb247XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHJlZ2lvblByaWNlczogUGx1c1JlZ2lvblByaWNlW107XG4gIGNoZWFwZXN0UmVnaW9uOiBQbHVzUmVnaW9uIHwgbnVsbDtcbiAgY2hlYXBlc3RDbHA6IG51bWJlciB8IG51bGw7XG4gIHNlYXJjaFRlcm1zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQbHVzUGxhbldpdGhNYXRjaGVzIGV4dGVuZHMgUGx1c1BsYW4ge1xuICBjb21wZXRpdG9yTWF0Y2hlczogQ29tcGV0aXRvck1hdGNoW107XG4gIGJlc3RQcmljZTogbnVtYmVyIHwgbnVsbDtcbiAgYmVzdFN0b3JlOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjcmFwZWRQbHVzUHJpY2VzIHtcbiAgLyoqIHJlZ2lvbiBcdTIxOTIgdGllciBcdTIxOTIgZHVyYXRpb24gXHUyMTkyIHByaWNlIGluIGxvY2FsIGN1cnJlbmN5ICovXG4gIHByaWNlczogUmVjb3JkPFBsdXNSZWdpb24sIFJlY29yZDxQbHVzVGllciwgUmVjb3JkPFBsdXNEdXJhdGlvbiwgbnVtYmVyPj4+O1xuICBzY3JhcGVkQXQ6IHN0cmluZztcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIFBsYW5EZWYge1xuICB0aWVyOiBQbHVzVGllcjtcbiAgZHVyYXRpb246IFBsdXNEdXJhdGlvbjtcbiAgbGFiZWw6IHN0cmluZztcbiAgc2VhcmNoVGVybXM6IHN0cmluZ1tdO1xufVxuXG5jb25zdCBQTEFOX0RFRlM6IFBsYW5EZWZbXSA9IFtcbiAgeyB0aWVyOiBcImVzc2VudGlhbFwiLCBkdXJhdGlvbjogXCIxbVwiLCAgbGFiZWw6IFwiUFMgUGx1cyBFc3NlbnRpYWwgXHUyMDE0IDEgTWVzXCIsICAgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIGVzc2VudGlhbCAxIG1lc1wiLCBcInBzIHBsdXMgZXNzZW50aWFsIDEgbWVzXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgMSBtb250aFwiLCBcInBzbiBwbHVzIGVzc2VudGlhbCBtZW5zdWFsXCJdIH0sXG4gIHsgdGllcjogXCJlc3NlbnRpYWxcIiwgZHVyYXRpb246IFwiM21cIiwgIGxhYmVsOiBcIlBTIFBsdXMgRXNzZW50aWFsIFx1MjAxNCAzIE1lc2VzXCIsICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBlc3NlbnRpYWwgMyBtZXNlc1wiLCBcInBzIHBsdXMgZXNzZW50aWFsIDMgbWVzZXNcIiwgXCJwcyBwbHVzIGVzc2VudGlhbCAzIG1vbnRoXCIsIFwicHNuIHBsdXMgZXNzZW50aWFsIHRyaW1lc3RyYWxcIl0gfSxcbiAgeyB0aWVyOiBcImVzc2VudGlhbFwiLCBkdXJhdGlvbjogXCIxMm1cIiwgbGFiZWw6IFwiUFMgUGx1cyBFc3NlbnRpYWwgXHUyMDE0IDEyIE1lc2VzXCIsIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIGVzc2VudGlhbCAxMiBtZXNlc1wiLCBcInBzIHBsdXMgZXNzZW50aWFsIDEyIG1lc2VzXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgMSBhXHUwMEYxb1wiLCBcInBzIHBsdXMgZXNzZW50aWFsIGFudWFsXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgMSB5ZWFyXCJdIH0sXG4gIHsgdGllcjogXCJleHRyYVwiLCAgICAgZHVyYXRpb246IFwiMW1cIiwgIGxhYmVsOiBcIlBTIFBsdXMgRXh0cmEgXHUyMDE0IDEgTWVzXCIsICAgICAgICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBleHRyYSAxIG1lc1wiLCBcInBzIHBsdXMgZXh0cmEgMSBtZXNcIiwgXCJwcyBwbHVzIGV4dHJhIDEgbW9udGhcIl0gfSxcbiAgeyB0aWVyOiBcImV4dHJhXCIsICAgICBkdXJhdGlvbjogXCIzbVwiLCAgbGFiZWw6IFwiUFMgUGx1cyBFeHRyYSBcdTIwMTQgMyBNZXNlc1wiLCAgICAgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIGV4dHJhIDMgbWVzZXNcIiwgXCJwcyBwbHVzIGV4dHJhIDMgbWVzZXNcIiwgXCJwcyBwbHVzIGV4dHJhIDMgbW9udGhcIl0gfSxcbiAgeyB0aWVyOiBcImV4dHJhXCIsICAgICBkdXJhdGlvbjogXCIxMm1cIiwgbGFiZWw6IFwiUFMgUGx1cyBFeHRyYSBcdTIwMTQgMTIgTWVzZXNcIiwgICAgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIGV4dHJhIDEyIG1lc2VzXCIsIFwicHMgcGx1cyBleHRyYSAxMiBtZXNlc1wiLCBcInBzIHBsdXMgZXh0cmEgMSBhXHUwMEYxb1wiLCBcInBzIHBsdXMgZXh0cmEgYW51YWxcIl0gfSxcbiAgeyB0aWVyOiBcInByZW1pdW1cIiwgICBkdXJhdGlvbjogXCIxbVwiLCAgbGFiZWw6IFwiUFMgUGx1cyBQcmVtaXVtIFx1MjAxNCAxIE1lc1wiLCAgICAgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIHByZW1pdW0gMSBtZXNcIiwgXCJwcyBwbHVzIHByZW1pdW0gMSBtZXNcIiwgXCJwcyBwbHVzIHByZW1pdW0gMSBtb250aFwiXSB9LFxuICB7IHRpZXI6IFwicHJlbWl1bVwiLCAgIGR1cmF0aW9uOiBcIjNtXCIsICBsYWJlbDogXCJQUyBQbHVzIFByZW1pdW0gXHUyMDE0IDMgTWVzZXNcIiwgICAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgcHJlbWl1bSAzIG1lc2VzXCIsIFwicHMgcGx1cyBwcmVtaXVtIDMgbWVzZXNcIiwgXCJwcyBwbHVzIHByZW1pdW0gMyBtb250aFwiXSB9LFxuICB7IHRpZXI6IFwicHJlbWl1bVwiLCAgIGR1cmF0aW9uOiBcIjEybVwiLCBsYWJlbDogXCJQUyBQbHVzIFByZW1pdW0gXHUyMDE0IDEyIE1lc2VzXCIsICAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgcHJlbWl1bSAxMiBtZXNlc1wiLCBcInBzIHBsdXMgcHJlbWl1bSAxMiBtZXNlc1wiLCBcInBzIHBsdXMgcHJlbWl1bSAxIGFcdTAwRjFvXCIsIFwicHMgcGx1cyBwcmVtaXVtIGFudWFsXCJdIH0sXG5dO1xuXG4vLyBGYWxsYmFjayBwcmljZXMgaWYgc2NyYXBpbmcgZmFpbHMgKGxhc3Qga25vd24gZ29vZCB2YWx1ZXMpXG5jb25zdCBGQUxMQkFDS19QUklDRVM6IFJlY29yZDxQbHVzUmVnaW9uLCBSZWNvcmQ8UGx1c1RpZXIsIFJlY29yZDxQbHVzRHVyYXRpb24sIG51bWJlcj4+PiA9IHtcbiAgdXM6IHtcbiAgICBlc3NlbnRpYWw6IHsgXCIxbVwiOiA5Ljk5LCAgXCIzbVwiOiAyNC45OSwgIFwiMTJtXCI6IDc5Ljk5IH0sXG4gICAgZXh0cmE6ICAgICB7IFwiMW1cIjogMTQuOTksIFwiM21cIjogMzkuOTksICBcIjEybVwiOiAxMzQuOTkgfSxcbiAgICBwcmVtaXVtOiAgIHsgXCIxbVwiOiAxNy45OSwgXCIzbVwiOiA0OS45OSwgIFwiMTJtXCI6IDE1OS45OSB9LFxuICB9LFxuICBicjoge1xuICAgIGVzc2VudGlhbDogeyBcIjFtXCI6IDM0LjkwLCAgXCIzbVwiOiA4OS45MCwgICBcIjEybVwiOiAxOTkuOTAgfSxcbiAgICBleHRyYTogICAgIHsgXCIxbVwiOiA1Mi45MCwgIFwiM21cIjogMTM5LjkwLCAgXCIxMm1cIjogMzM5LjkwIH0sXG4gICAgcHJlbWl1bTogICB7IFwiMW1cIjogNTkuOTAsICBcIjNtXCI6IDE2NS45MCwgIFwiMTJtXCI6IDM5OS45MCB9LFxuICB9LFxuICB0cjoge1xuICAgIGVzc2VudGlhbDogeyBcIjFtXCI6IDEzMCwgIFwiM21cIjogMzQwLCAgIFwiMTJtXCI6IDkwMCB9LFxuICAgIGV4dHJhOiAgICAgeyBcIjFtXCI6IDIwMCwgIFwiM21cIjogNTMwLCAgIFwiMTJtXCI6IDE0MDAgfSxcbiAgICBwcmVtaXVtOiAgIHsgXCIxbVwiOiAyNTAsICBcIjNtXCI6IDY1MCwgICBcIjEybVwiOiAxNzAwIH0sXG4gIH0sXG59O1xuXG5jb25zdCBVQSA9XG4gIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IFwiICtcbiAgXCIoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNlwiO1xuXG5jb25zdCBSRUdJT05fTE9DQUxFOiBSZWNvcmQ8UGx1c1JlZ2lvbiwgc3RyaW5nPiA9IHtcbiAgdXM6IFwiZW4tdXNcIixcbiAgYnI6IFwicHQtYnJcIixcbiAgdHI6IFwiZW4tdHJcIixcbn07XG5cbmNvbnN0IFJFR0lPTl9DVVJSRU5DWTogUmVjb3JkPFBsdXNSZWdpb24sIHN0cmluZz4gPSB7XG4gIHVzOiBcIlVTRFwiLFxuICBicjogXCJCUkxcIixcbiAgdHI6IFwiVFJZXCIsXG59O1xuXG5jb25zdCBSRUdJT05fTEFCRUxTOiBSZWNvcmQ8UGx1c1JlZ2lvbiwgc3RyaW5nPiA9IHtcbiAgdXM6IFwiVVNcIixcbiAgYnI6IFwiQnJhc2lsXCIsXG4gIHRyOiBcIlR1cnF1XHUwMEVEYVwiLFxufTtcblxuZXhwb3J0IHsgUkVHSU9OX0xBQkVMUyBhcyBQTFVTX1JFR0lPTl9MQUJFTFMgfTtcblxuY29uc3QgVElFUl9PUkRFUjogUGx1c1RpZXJbXSA9IFtcImVzc2VudGlhbFwiLCBcImV4dHJhXCIsIFwicHJlbWl1bVwiXTtcbmNvbnN0IERVUkFUSU9OX09SREVSOiBQbHVzRHVyYXRpb25bXSA9IFtcIjFtXCIsIFwiM21cIiwgXCIxMm1cIl07XG5cbi8vIC0tLSBTY3JhcGVyIC0tLVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFBzUGx1c1BhZ2UocmVnaW9uOiBQbHVzUmVnaW9uKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgbG9jYWxlID0gUkVHSU9OX0xPQ0FMRVtyZWdpb25dO1xuICBjb25zdCB1cmwgPSBgaHR0cHM6Ly93d3cucGxheXN0YXRpb24uY29tLyR7bG9jYWxlfS9wcy1wbHVzL2A7XG4gIGxldCBsYXN0RXJyOiB1bmtub3duID0gbnVsbDtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICAgIGFjY2VwdDogXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcbiAgICAgICAgICBcImFjY2VwdC1sYW5ndWFnZVwiOiByZWdpb24gPT09IFwiYnJcIiA/IFwicHQtQlIscHQ7cT0wLjlcIiA6IFwiZW4tVVMsZW47cT0wLjlcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgaWYgKHIuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBFcnJvcihgNDAzIEZvcmJpZGRlbiAoJHt1cmx9KWApO1xuICAgICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyLnN0YXR1c30gKCR7dXJsfSlgKTtcbiAgICAgIHJldHVybiBhd2FpdCByLnRleHQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsYXN0RXJyID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggUFMgUGx1cyBwYWdlIGZvciAke3JlZ2lvbn06ICR7KGxhc3RFcnIgYXMgRXJyb3IpPy5tZXNzYWdlIHx8IGxhc3RFcnJ9YCk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3ROZXh0RGF0YShodG1sOiBzdHJpbmcpOiBhbnkgfCBudWxsIHtcbiAgY29uc3QgbSA9IC88c2NyaXB0W14+XSppZD1bXCInXV9fTkVYVF9EQVRBX19bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+Ly5leGVjKGh0bWwpO1xuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKG1bMV0pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZVByaWNlKHJhdzogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICghcmF3KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2xlYW5lZCA9IHJhdy5yZXBsYWNlKC9bXlxcZC4sXS9nLCBcIlwiKTtcbiAgaWYgKCFjbGVhbmVkKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcGFydHMgPSBjbGVhbmVkLnNwbGl0KC9bLixdLyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggPD0gMSkge1xuICAgIHJldHVybiBOdW1iZXIoY2xlYW5lZCkgfHwgbnVsbDtcbiAgfVxuICBjb25zdCBsYXN0UGFydCA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuICBpZiAobGFzdFBhcnQubGVuZ3RoIDw9IDIpIHtcbiAgICBjb25zdCBpbnRQYXJ0ID0gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4oXCJcIik7XG4gICAgcmV0dXJuIE51bWJlcihgJHtpbnRQYXJ0fS4ke2xhc3RQYXJ0fWApIHx8IG51bGw7XG4gIH1cbiAgcmV0dXJuIE51bWJlcihwYXJ0cy5qb2luKFwiXCIpKSB8fCBudWxsO1xufVxuXG5jb25zdCBUSUVSX1BBVFRFUk5TOiBSZWNvcmQ8UGx1c1RpZXIsIFJlZ0V4cD4gPSB7XG4gIGVzc2VudGlhbDogL2Vzc2VudGlhbC9pLFxuICBleHRyYTogL2V4dHJhL2ksXG4gIHByZW1pdW06IC9wcmVtaXVtfGRlbHV4ZS9pLFxufTtcblxuY29uc3QgRFVSQVRJT05fUEFUVEVSTlM6IFJlY29yZDxQbHVzRHVyYXRpb24sIFJlZ0V4cD4gPSB7XG4gIFwiMW1cIjogL1xcYjFcXHMqKD86bW9udGh8bWVzfG0oPzpcdTAwRUF8ZSlzfGF5KVxcYi9pLFxuICBcIjNtXCI6IC9cXGIzXFxzKig/Om1vbnRofG1lc3xtKD86XHUwMEVBfGUpc3xtZXNlc3xheSlcXGIvaSxcbiAgXCIxMm1cIjogL1xcYig/OjEyXFxzKig/Om1vbnRofG1lc3xtKD86XHUwMEVBfGUpc3xtZXNlc3xheSl8MVxccyooPzp5ZWFyfGFcdTAwRjFvfGFubykpXFxiL2ksXG59O1xuXG5mdW5jdGlvbiBjbGFzc2lmeVRpZXIodGV4dDogc3RyaW5nKTogUGx1c1RpZXIgfCBudWxsIHtcbiAgZm9yIChjb25zdCB0IG9mIFRJRVJfT1JERVIpIHtcbiAgICBpZiAoVElFUl9QQVRURVJOU1t0XS50ZXN0KHRleHQpKSByZXR1cm4gdDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY2xhc3NpZnlEdXJhdGlvbih0ZXh0OiBzdHJpbmcpOiBQbHVzRHVyYXRpb24gfCBudWxsIHtcbiAgZm9yIChjb25zdCBkIG9mIERVUkFUSU9OX09SREVSKSB7XG4gICAgaWYgKERVUkFUSU9OX1BBVFRFUk5TW2RdLnRlc3QodGV4dCkpIHJldHVybiBkO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiB3YWxrRm9yUHJpY2VzKFxuICBub2RlOiB1bmtub3duLFxuICByZXN1bHRzOiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuICBkZXB0aCA9IDBcbik6IHZvaWQge1xuICBpZiAoZGVwdGggPiAzMCB8fCAhbm9kZSkgcmV0dXJuO1xuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkge1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBub2RlKSB3YWxrRm9yUHJpY2VzKGl0ZW0sIHJlc3VsdHMsIGRlcHRoICsgMSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlb2Ygbm9kZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuICBjb25zdCBvYmogPSBub2RlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXG4gIGNvbnN0IG5hbWUgPSBTdHJpbmcob2JqLm5hbWUgfHwgb2JqLnRpdGxlIHx8IG9iai5sYWJlbCB8fCBvYmoucGxhbk5hbWUgfHwgXCJcIik7XG4gIGNvbnN0IHByaWNlU3RyID0gU3RyaW5nKFxuICAgIG9iai5wcmljZSB8fCBvYmouZm9ybWF0dGVkUHJpY2UgfHwgb2JqLmRpc3BsYXlQcmljZSB8fFxuICAgIG9iai5iYXNlUHJpY2UgfHwgb2JqLmJhc2VQcmljZVZhbHVlIHx8IFwiXCJcbiAgKTtcblxuICBpZiAobmFtZSAmJiBwcmljZVN0cikge1xuICAgIGNvbnN0IHRpZXIgPSBjbGFzc2lmeVRpZXIobmFtZSk7XG4gICAgY29uc3QgZHVyID0gY2xhc3NpZnlEdXJhdGlvbihuYW1lKTtcbiAgICBpZiAodGllciAmJiBkdXIpIHtcbiAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VQcmljZShwcmljZVN0cik7XG4gICAgICBpZiAocHJpY2UgJiYgcHJpY2UgPiAwKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGAke3RpZXJ9OiR7ZHVyfWA7XG4gICAgICAgIGlmICghcmVzdWx0cy5oYXMoa2V5KSkgcmVzdWx0cy5zZXQoa2V5LCBwcmljZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCB2IG9mIE9iamVjdC52YWx1ZXMob2JqKSkge1xuICAgIHdhbGtGb3JQcmljZXModiwgcmVzdWx0cywgZGVwdGggKyAxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0RnJvbUh0bWxGYWxsYmFjayhcbiAgaHRtbDogc3RyaW5nLFxuICByZWdpb246IFBsdXNSZWdpb25cbik6IE1hcDxzdHJpbmcsIG51bWJlcj4ge1xuICBjb25zdCByZXN1bHRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBjb25zdCBwcmljZVJlID0gcmVnaW9uID09PSBcImJyXCJcbiAgICA/IC9SXFwkXFxzKihbXFxkLixdKykvZ1xuICAgIDogcmVnaW9uID09PSBcInRyXCJcbiAgICA/IC8oPzpcdTIwQkF8VEx8VFJZKVxccyooW1xcZC4sXSspL2dcbiAgICA6IC9cXCRcXHMqKFtcXGQuLF0rKS9nO1xuXG4gIGNvbnN0IHNlY3Rpb25zID0gaHRtbC5zcGxpdCgvKD89ZXNzZW50aWFsfGV4dHJhfHByZW1pdW0pL2dpKTtcbiAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgY29uc3QgdGllciA9IGNsYXNzaWZ5VGllcihzZWN0aW9uLnNsaWNlKDAsIDIwMCkpO1xuICAgIGlmICghdGllcikgY29udGludWU7XG5cbiAgICBjb25zdCBkdXJCbG9ja3MgPSBzZWN0aW9uLnNwbGl0KC8oPz1cXGIoPzoxfDN8MTIpXFxzKig/Om1vbnRofG1lc3xtW1x1MDBFQWVdc3xheXx5ZWFyfGFcdTAwRjFvfGFubykpL2dpKTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGR1ckJsb2Nrcykge1xuICAgICAgY29uc3QgZHVyID0gY2xhc3NpZnlEdXJhdGlvbihibG9jay5zbGljZSgwLCAxMDApKTtcbiAgICAgIGlmICghZHVyKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgbWF0Y2ggPSBwcmljZVJlLmV4ZWMoYmxvY2spO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VQcmljZShtYXRjaFsxXSk7XG4gICAgICAgIGlmIChwcmljZSAmJiBwcmljZSA+IDApIHtcbiAgICAgICAgICBjb25zdCBrZXkgPSBgJHt0aWVyfToke2R1cn1gO1xuICAgICAgICAgIGlmICghcmVzdWx0cy5oYXMoa2V5KSkgcmVzdWx0cy5zZXQoa2V5LCBwcmljZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHByaWNlUmUubGFzdEluZGV4ID0gMDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUHNQbHVzSHRtbChcbiAgaHRtbDogc3RyaW5nLFxuICByZWdpb246IFBsdXNSZWdpb25cbik6IFJlY29yZDxQbHVzVGllciwgUmVjb3JkPFBsdXNEdXJhdGlvbiwgbnVtYmVyPj4gfCBudWxsIHtcbiAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+PiA9IHt9O1xuXG4gIGNvbnN0IG5leHREYXRhID0gZXh0cmFjdE5leHREYXRhKGh0bWwpO1xuICBsZXQgZm91bmQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGlmIChuZXh0RGF0YSkge1xuICAgIHdhbGtGb3JQcmljZXMobmV4dERhdGEsIGZvdW5kKTtcbiAgfVxuXG4gIGlmIChmb3VuZC5zaXplIDwgOSkge1xuICAgIGNvbnN0IGh0bWxGYWxsYmFjayA9IGV4dHJhY3RGcm9tSHRtbEZhbGxiYWNrKGh0bWwsIHJlZ2lvbik7XG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgaHRtbEZhbGxiYWNrKSB7XG4gICAgICBpZiAoIWZvdW5kLmhhcyhrKSkgZm91bmQuc2V0KGssIHYpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChmb3VuZC5zaXplID09PSAwKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IFtrZXksIHByaWNlXSBvZiBmb3VuZCkge1xuICAgIGNvbnN0IFt0aWVyLCBkdXJdID0ga2V5LnNwbGl0KFwiOlwiKTtcbiAgICBpZiAoIXJlc3VsdFt0aWVyXSkgcmVzdWx0W3RpZXJdID0ge307XG4gICAgcmVzdWx0W3RpZXJdW2R1cl0gPSBwcmljZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQgYXMgUmVjb3JkPFBsdXNUaWVyLCBSZWNvcmQ8UGx1c0R1cmF0aW9uLCBudW1iZXI+Pjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjcmFwZVBzUGx1c1ByaWNlcygpOiBQcm9taXNlPFNjcmFwZWRQbHVzUHJpY2VzPiB7XG4gIGNvbnN0IHJlZ2lvbnM6IFBsdXNSZWdpb25bXSA9IFtcInVzXCIsIFwiYnJcIiwgXCJ0clwiXTtcbiAgY29uc3QgcHJpY2VzID0gc3RydWN0dXJlZENsb25lKEZBTExCQUNLX1BSSUNFUyk7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHJlZ2lvbiBvZiByZWdpb25zKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBmZXRjaFBzUGx1c1BhZ2UocmVnaW9uKTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlUHNQbHVzSHRtbChodG1sLCByZWdpb24pO1xuICAgICAgaWYgKHBhcnNlZCkge1xuICAgICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgICBmb3IgKGNvbnN0IHRpZXIgb2YgVElFUl9PUkRFUikge1xuICAgICAgICAgIGZvciAoY29uc3QgZHVyIG9mIERVUkFUSU9OX09SREVSKSB7XG4gICAgICAgICAgICBpZiAocGFyc2VkW3RpZXJdPy5bZHVyXSkge1xuICAgICAgICAgICAgICBwcmljZXNbcmVnaW9uXVt0aWVyXVtkdXJdID0gcGFyc2VkW3RpZXJdW2R1cl07XG4gICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKGAke3JlZ2lvbi50b1VwcGVyQ2FzZSgpfTogcFx1MDBFMWdpbmEgY2FyZ2FkYSBwZXJvIG5vIHNlIGVuY29udHJhcm9uIHByZWNpb3MsIHVzYW5kbyB2YWxvcmVzIGRlIHJlc3BhbGRvYCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPCA5KSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goYCR7cmVnaW9uLnRvVXBwZXJDYXNlKCl9OiBzb2xvICR7Y291bnR9LzkgcHJlY2lvcyBleHRyYVx1MDBFRGRvcywgZWwgcmVzdG8gdXNhIHJlc3BhbGRvYCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGAke3JlZ2lvbi50b1VwcGVyQ2FzZSgpfTogbm8gc2UgcHVkbyBwYXJzZWFyIGxhIHBcdTAwRTFnaW5hLCB1c2FuZG8gdmFsb3JlcyBkZSByZXNwYWxkb2ApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVycm9ycy5wdXNoKGAke3JlZ2lvbi50b1VwcGVyQ2FzZSgpfTogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBwcmljZXMsIHNjcmFwZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCBlcnJvcnMgfTtcbn1cblxuLy8gLS0tIFByaWNlIGNvbXB1dGF0aW9uIC0tLVxuXG5jb25zdCBQTFVTX01BVENIX1RIUkVTSE9MRCA9IDAuNDU7XG5cbmZ1bmN0aW9uIGJlc3RNYXRjaFNjb3JlKHNlYXJjaFRlcm1zOiBzdHJpbmdbXSwgcHJvZHVjdFRpdGxlOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBwcm9kdWN0VG9rZW5zID0gdG9rZW5pemUocHJvZHVjdFRpdGxlKTtcbiAgaWYgKCFwcm9kdWN0VG9rZW5zLmxlbmd0aCkgcmV0dXJuIDA7XG4gIGxldCBiZXN0ID0gMDtcbiAgZm9yIChjb25zdCB0ZXJtIG9mIHNlYXJjaFRlcm1zKSB7XG4gICAgY29uc3QgdGVybVRva2VucyA9IHRva2VuaXplKHRlcm0pO1xuICAgIGlmICghdGVybVRva2Vucy5sZW5ndGgpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHNjb3JlID0gc2ltaWxhcml0eSh0ZXJtVG9rZW5zLCBwcm9kdWN0VG9rZW5zKTtcbiAgICBpZiAoc2NvcmUgPiBiZXN0KSBiZXN0ID0gc2NvcmU7XG4gIH1cbiAgcmV0dXJuIGJlc3Q7XG59XG5cbmZ1bmN0aW9uIHRvQ2xwKHByaWNlOiBudW1iZXIsIGN1cnJlbmN5OiBzdHJpbmcsIGNmZzogUHJpY2luZ1NldHRpbmdzKTogbnVtYmVyIHtcbiAgbGV0IHJhdGU6IG51bWJlcjtcbiAgbGV0IGRpc2NvdW50OiBudW1iZXI7XG4gIHN3aXRjaCAoY3VycmVuY3kpIHtcbiAgICBjYXNlIFwiQlJMXCI6IHJhdGUgPSBjZmcuYnJsVG9DbHA7IGRpc2NvdW50ID0gY2ZnLmJhbGFuY2VEaXNjb3VudEJybCA/PyAxLjA7IGJyZWFrO1xuICAgIGNhc2UgXCJUUllcIjogcmF0ZSA9IGNmZy50cnlUb0NscDsgZGlzY291bnQgPSBjZmcuYmFsYW5jZURpc2NvdW50VHJ5ID8/IDEuMDsgYnJlYWs7XG4gICAgZGVmYXVsdDogICAgcmF0ZSA9IGNmZy51c2RUb0NscDsgZGlzY291bnQgPSBjZmcuYmFsYW5jZURpc2NvdW50VXNkID8/IDEuMDsgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIE1hdGgucm91bmQocHJpY2UgKiBkaXNjb3VudCAqIHJhdGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hQbGFuc1dpdGhDb21wZXRpdG9ycyhcbiAgcHJvZHVjdHM6IENvbXBldGl0b3JQcm9kdWN0W10sXG4gIGNmZzogUHJpY2luZ1NldHRpbmdzLFxuICBzY3JhcGVkPzogU2NyYXBlZFBsdXNQcmljZXMgfCBudWxsXG4pOiBQbHVzUGxhbldpdGhNYXRjaGVzW10ge1xuICBjb25zdCBwcmljZURhdGEgPSBzY3JhcGVkPy5wcmljZXMgPz8gRkFMTEJBQ0tfUFJJQ0VTO1xuXG4gIHJldHVybiBQTEFOX0RFRlMubWFwKChkZWYpID0+IHtcbiAgICBjb25zdCByZWdpb25zOiBQbHVzUmVnaW9uW10gPSBbXCJ1c1wiLCBcImJyXCIsIFwidHJcIl07XG4gICAgY29uc3QgcmVnaW9uUHJpY2VzOiBQbHVzUmVnaW9uUHJpY2VbXSA9IHJlZ2lvbnMubWFwKChyKSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW5jeSA9IFJFR0lPTl9DVVJSRU5DWVtyXTtcbiAgICAgIGNvbnN0IHByaWNlID0gcHJpY2VEYXRhW3JdPy5bZGVmLnRpZXJdPy5bZGVmLmR1cmF0aW9uXSA/PyBGQUxMQkFDS19QUklDRVNbcl1bZGVmLnRpZXJdW2RlZi5kdXJhdGlvbl07XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWdpb246IHIsXG4gICAgICAgIGN1cnJlbmN5LFxuICAgICAgICBwcmljZSxcbiAgICAgICAgcHJpY2VDbHA6IHRvQ2xwKHByaWNlLCBjdXJyZW5jeSwgY2ZnKSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBsZXQgY2hlYXBlc3RSZWdpb246IFBsdXNSZWdpb24gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgY2hlYXBlc3RDbHA6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIGZvciAoY29uc3QgcnAgb2YgcmVnaW9uUHJpY2VzKSB7XG4gICAgICBpZiAocnAucHJpY2VDbHAgIT0gbnVsbCAmJiAoY2hlYXBlc3RDbHAgPT0gbnVsbCB8fCBycC5wcmljZUNscCA8IGNoZWFwZXN0Q2xwKSkge1xuICAgICAgICBjaGVhcGVzdENscCA9IHJwLnByaWNlQ2xwO1xuICAgICAgICBjaGVhcGVzdFJlZ2lvbiA9IHJwLnJlZ2lvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVzOiBDb21wZXRpdG9yTWF0Y2hbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgcCBvZiBwcm9kdWN0cykge1xuICAgICAgY29uc3Qgc2NvcmUgPSBiZXN0TWF0Y2hTY29yZShkZWYuc2VhcmNoVGVybXMsIHAudGl0bGUpO1xuICAgICAgaWYgKHNjb3JlID49IFBMVVNfTUFUQ0hfVEhSRVNIT0xEKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgc3RvcmVLZXk6IHAuc3RvcmVLZXksXG4gICAgICAgICAgdGl0bGU6IHAudGl0bGUsXG4gICAgICAgICAgdXJsOiBwLnVybCxcbiAgICAgICAgICBwcmljZUNscDogcC5wcmljZUNscCxcbiAgICAgICAgICBhdmFpbGFibGU6IHAuYXZhaWxhYmxlLFxuICAgICAgICAgIHNjb3JlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWF0Y2hlcy5zb3J0KChhLCBiKSA9PiBhLnByaWNlQ2xwIC0gYi5wcmljZUNscCk7XG4gICAgY29uc3QgdG9wID0gbWF0Y2hlcy5zbGljZSgwLCA4KTtcblxuICAgIHJldHVybiB7XG4gICAgICB0aWVyOiBkZWYudGllcixcbiAgICAgIGR1cmF0aW9uOiBkZWYuZHVyYXRpb24sXG4gICAgICBsYWJlbDogZGVmLmxhYmVsLFxuICAgICAgcmVnaW9uUHJpY2VzLFxuICAgICAgY2hlYXBlc3RSZWdpb24sXG4gICAgICBjaGVhcGVzdENscCxcbiAgICAgIHNlYXJjaFRlcm1zOiBkZWYuc2VhcmNoVGVybXMsXG4gICAgICBjb21wZXRpdG9yTWF0Y2hlczogdG9wLFxuICAgICAgYmVzdFByaWNlOiB0b3AubGVuZ3RoID8gdG9wWzBdLnByaWNlQ2xwIDogbnVsbCxcbiAgICAgIGJlc3RTdG9yZTogdG9wLmxlbmd0aCA/IHRvcFswXS5zdG9yZUtleSA6IG51bGwsXG4gICAgfTtcbiAgfSk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9hcGkudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvYXBpLnRzXCI7LyoqXG4gKiBNaW5pbWFsIEhUVFAgcm91dGVyIGZvciB0aGUgL2FwaS8qIG5hbWVzcGFjZS4gVXNlcyBvbmx5IG5vZGU6aHR0cCB0eXBlcyBzb1xuICogd2UgZG9uJ3QgbmVlZCBFeHByZXNzIGFzIGEgZGVwZW5kZW5jeS5cbiAqXG4gKiBSb3V0ZXM6XG4gKiAgIEdFVCAgICAvZ2FtZXMgICAgICAgICAgICAgICAgICAgICAgbGlzdCB3aXRoIGNvbXB1dGVkIENMUCBwcmljZXNcbiAqICAgUEFUQ0ggIC9nYW1lcy86aWQgICAgICAgICAgICAgICAgICB7IHNlbGVjdGVkPywgcHVibGlzaGVkPywgbm90ZXM/IH1cbiAqICAgUE9TVCAgIC9yZWZyZXNoICAgICAgICAgICAgICAgICAgICBzY3JhcGUgUFNOIGFuZCB1cHNlcnRcbiAqICAgR0VUICAgIC9nYW1lcy9leHBvcnQuY3N2ICAgICAgICAgICBDU1Ygb2Ygc2VsZWN0ZWQgZ2FtZXNcbiAqICAgR0VUICAgIC9zZXR0aW5ncyAgICAgICAgICAgICAgICAgICBwcmljaW5nICsgcHNuIGNvbmZpZ1xuICogICBQVVQgICAgL3NldHRpbmdzICAgICAgICAgICAgICAgICAgIHBhcnRpYWwgdXBkYXRlIChwcmljaW5nIGFuZC9vciBwc24pXG4gKiAgIFBPU1QgICAvbW9jay9jbGVhciAgICAgICAgICAgICAgICAgZGVhY3RpdmF0ZSBhbGwgZ2FtZXNcbiAqL1xuaW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSBcIm5vZGU6aHR0cFwiO1xuaW1wb3J0IHsgc3RvcmUsIHR5cGUgR2FtZSwgdHlwZSBXYXRjaGVkR2FtZSwgdHlwZSBTdXBhYmFzZUNvbmZpZyB9IGZyb20gXCIuL3N0b3JlXCI7XG5pbXBvcnQgeyBjb21wdXRlU2FsZVByaWNlcyB9IGZyb20gXCIuL3ByaWNpbmdcIjtcbmltcG9ydCB7XG4gIGluc3BlY3RQcm9kdWN0VHlwZXMsXG4gIFBlcnNpc3RlZFF1ZXJ5Tm90Rm91bmRFcnJvcixcbiAgUHNuQXBpRXJyb3IsXG59IGZyb20gXCIuL3BzblwiO1xuaW1wb3J0IHtcbiAgZmV0Y2hDb21wZXRpdG9yLFxuICBtYXRjaEdhbWVzLFxuICBDb21wZXRpdG9yRmV0Y2hFcnJvcixcbiAgdG9rZW5pemUsXG4gIHNpbWlsYXJpdHksXG4gIHR5cGUgQ29tcGV0aXRvckNvbmZpZyxcbiAgdHlwZSBDb21wZXRpdG9yTWF0Y2gsXG59IGZyb20gXCIuL2NvbXBldGl0b3JzXCI7XG5pbXBvcnQgeyBmZXRjaFByb2R1Y3REZXRhaWwgfSBmcm9tIFwiLi9wc24tcHJvZHVjdFwiO1xuaW1wb3J0IHtcbiAgZ2V0UHJvdmlkZXIsXG4gIFBMQVRGT1JNX0xBQkVMUyxcbiAgUExBVEZPUk1fUkVHSU9OUyxcbiAgUHJvdmlkZXJFcnJvcixcbn0gZnJvbSBcIi4vcHJvdmlkZXJzL2luZGV4XCI7XG5pbXBvcnQgdHlwZSB7IFBsYXRmb3JtLCBQcm92aWRlclNvdXJjZSB9IGZyb20gXCIuL3Byb3ZpZGVycy90eXBlc1wiO1xuaW1wb3J0IHsgZmV0Y2hFeGNoYW5nZVJhdGVzIH0gZnJvbSBcIi4vZXhjaGFuZ2VcIjtcbmltcG9ydCB7IGdldExhc3RBdXRvUmVmcmVzaEF0LCByZXNjaGVkdWxlLCBzdGFydFNjaGVkdWxlciB9IGZyb20gXCIuL3NjaGVkdWxlclwiO1xuaW1wb3J0IHsgbWF0Y2hQbGFuc1dpdGhDb21wZXRpdG9ycywgc2NyYXBlUHNQbHVzUHJpY2VzIH0gZnJvbSBcIi4vcHMtcGx1c1wiO1xuaW1wb3J0IHR5cGUgeyBTY3JhcGVkUGx1c1ByaWNlcyB9IGZyb20gXCIuL3BzLXBsdXNcIjtcblxuLyoqIEV4dHJhY3QgYSBQU04gcHJvZHVjdCBpZCBmcm9tIGEgc3RvcmUgVVJMLiBBY2NlcHRzIGJvdGggZW4tVVMgYW5kIG90aGVyXG4gKiAgbG9jYWxlcywgYW5kIHRvbGVyYXRlcyB0cmFpbGluZyBzZWdtZW50cyAvIHF1ZXJ5IHN0cmluZ3MuICovXG5mdW5jdGlvbiBleHRyYWN0UHNuSWQoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzID0gU3RyaW5nKGlucHV0IHx8IFwiXCIpLnRyaW0oKTtcbiAgaWYgKCFzKSByZXR1cm4gbnVsbDtcbiAgLy8gQWxyZWFkeSBhbiBpZCAoVVBYWFhYLUNVU0FYWFhYWF8wMC1cdTIwMjYgb3IgRVBcdTIwMjYgLyBVQ1x1MjAyNilcbiAgaWYgKC9eW0EtWl17Mn1bMC05XXs0fS1bQS1aMC05XStfWzAtOV17Mn0oPzotW0EtWjAtOV0rKT8kLy50ZXN0KHMpKSByZXR1cm4gcztcbiAgY29uc3QgbSA9IC9cXC9wcm9kdWN0XFwvKFtBLVpdezJ9WzAtOV17NH0tW0EtWjAtOV0rX1swLTldezJ9KD86LVtBLVowLTldKyk/KS9pLmV4ZWMoXG4gICAgc1xuICApO1xuICByZXR1cm4gbSA/IG1bMV0udG9VcHBlckNhc2UoKSA6IG51bGw7XG59XG5cbmludGVyZmFjZSBXYXRjaGxpc3RBbGVydCB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIHByaWNlRGlzY291bnRlZFVzZDogbnVtYmVyIHwgbnVsbDtcbiAgc3RvcmVVcmw6IHN0cmluZyB8IG51bGw7XG59XG5cbi8qKiBEaWZmIHRoZSB3YXRjaGxpc3QgYWdhaW5zdCB0aGUgZnJlc2ggc2NyYXBlIGFuZCBmbGFnIHRyYW5zaXRpb25zLiBVcGRhdGVzXG4gKiAgZWFjaCB3YXRjaGVkIGVudHJ5J3MgbGFzdFN0YXR1cyBpbiBwbGFjZS4gUmV0dXJucyB0aGUgbGlzdCBvZiBnYW1lcyB0aGF0XG4gKiAgdHJhbnNpdGlvbmVkIG9mZl9zYWxlIFx1MjE5MiBvbl9zYWxlIHRoaXMgcnVuLiAqL1xuZnVuY3Rpb24gZGlmZldhdGNobGlzdChzZWVuOiBTZXQ8c3RyaW5nPiwgbm93SXNvOiBzdHJpbmcpOiBXYXRjaGxpc3RBbGVydFtdIHtcbiAgY29uc3QgYWxlcnRzOiBXYXRjaGxpc3RBbGVydFtdID0gW107XG4gIGZvciAoY29uc3QgdyBvZiBzdG9yZS5saXN0V2F0Y2hsaXN0KCkpIHtcbiAgICBjb25zdCBnYW1lID0gc3RvcmUuZ2V0R2FtZSh3LmlkKTtcbiAgICBjb25zdCBpblNhbGVOb3cgPVxuICAgICAgISFnYW1lICYmIGdhbWUuYWN0aXZlICYmIGdhbWUuZGlzY291bnRQZXJjZW50ID4gMCAmJiBzZWVuLmhhcyh3LmlkKTtcbiAgICBjb25zdCB0cmFuc2l0aW9uZWQgPSBpblNhbGVOb3cgJiYgdy5sYXN0U3RhdHVzICE9PSBcIm9uX3NhbGVcIjtcblxuICAgIGlmICh0cmFuc2l0aW9uZWQgJiYgZ2FtZSkge1xuICAgICAgYWxlcnRzLnB1c2goe1xuICAgICAgICBpZDogdy5pZCxcbiAgICAgICAgbmFtZTogZ2FtZS5uYW1lLFxuICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IGdhbWUuZGlzY291bnRQZXJjZW50LFxuICAgICAgICBwcmljZURpc2NvdW50ZWRVc2Q6XG4gICAgICAgICAgZ2FtZS5wcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsXG4gICAgICAgICAgICA/IGdhbWUucHJpY2VEaXNjb3VudGVkQ2VudHMgLyAxMDBcbiAgICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgc3RvcmVVcmw6IGdhbWUuc3RvcmVVcmwsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9yZS5wYXRjaFdhdGNoZWQody5pZCwge1xuICAgICAgbmFtZTogZ2FtZT8ubmFtZSB8fCB3Lm5hbWUsXG4gICAgICBsYXN0U3RhdHVzOiBpblNhbGVOb3cgPyBcIm9uX3NhbGVcIiA6IHcubGFzdFN0YXR1cyA9PT0gXCJ1bnNlZW5cIiA/IFwidW5zZWVuXCIgOiBcIm9mZl9zYWxlXCIsXG4gICAgICBsYXN0U2Vlbk9uU2FsZUF0OiBpblNhbGVOb3cgPyBub3dJc28gOiB3Lmxhc3RTZWVuT25TYWxlQXQsXG4gICAgICBsYXN0UHJpY2VDZW50czogZ2FtZT8ucHJpY2VEaXNjb3VudGVkQ2VudHMgPz8gdy5sYXN0UHJpY2VDZW50cyxcbiAgICAgIGxhc3REaXNjb3VudFBlcmNlbnQ6IGdhbWU/LmRpc2NvdW50UGVyY2VudCA/PyB3Lmxhc3REaXNjb3VudFBlcmNlbnQsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGFsZXJ0cztcbn1cblxudHlwZSBIYW5kbGVyID0gKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pID0+IFByb21pc2U8dm9pZD47XG5cbmludGVyZmFjZSBSb3V0ZSB7XG4gIG1ldGhvZDogc3RyaW5nO1xuICBwYXR0ZXJuOiBSZWdFeHA7XG4gIGtleXM6IHN0cmluZ1tdO1xuICBoYW5kbGVyOiBIYW5kbGVyO1xufVxuXG5jb25zdCByb3V0ZXM6IFJvdXRlW10gPSBbXTtcblxuZnVuY3Rpb24gcm91dGUobWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgaGFuZGxlcjogSGFuZGxlcikge1xuICBjb25zdCBrZXlzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICBcIl5cIiArXG4gICAgICBwYXRoLnJlcGxhY2UoLzooW2EtekEtWl9dKykvZywgKF8sIGspID0+IHtcbiAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICByZXR1cm4gXCIoW14vXSspXCI7XG4gICAgICB9KSArXG4gICAgICBcIiRcIlxuICApO1xuICByb3V0ZXMucHVzaCh7IG1ldGhvZCwgcGF0dGVybiwga2V5cywgaGFuZGxlciB9KTtcbn1cblxuZnVuY3Rpb24gc2VuZEpzb24ocmVzOiBTZXJ2ZXJSZXNwb25zZSwgc3RhdHVzOiBudW1iZXIsIGJvZHk6IHVua25vd24pIHtcbiAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpO1xuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZEJvZHkocmVxOiBJbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcmVxKSBjaHVua3MucHVzaChjaHVuayBhcyBCdWZmZXIpO1xuICBjb25zdCByYXcgPSBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGYtOFwiKTtcbiAgaWYgKCFyYXcpIHJldHVybiB7fTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyYXcpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge307XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2FtZURiS2V5KGc6IEdhbWUpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zy5wbGF0Zm9ybX06JHtnLnJlZ2lvbn06JHtnLmlkfWA7XG59XG5cbi8qKiBTYXZlIHByb2R1Y3QgZGV0YWlsLiBEb2VzIE5PVCBvdmVyd3JpdGUgaW1hZ2VVcmwgXHUyMDE0IHRoZSB0aWxlIGltYWdlXG4gKiAgZXh0cmFjdGVkIGZyb20gdGhlIEhUTUwgZ3JpZCAoNDQwXHUwMEQ3NDQwKSBpcyB0aGUgY29ycmVjdCBjb3ZlciBhcnQuICovXG5mdW5jdGlvbiBzYXZlRGV0YWlsQW5kVXBkYXRlSW1hZ2UoZ2FtZTogR2FtZSwgZGV0YWlsOiBpbXBvcnQoXCIuL3Bzbi1wcm9kdWN0XCIpLlByb2R1Y3REZXRhaWwpOiB2b2lkIHtcbiAgc3RvcmUuc2V0UHJvZHVjdERldGFpbChnYW1lLmlkLCBkZXRhaWwpO1xufVxuXG5jb25zdCBBRERfT05fUEFUVEVSTiA9IC9cXGIoZGxjfHNlYXNvbiBwYXNzfGF2YXRhcnx0aGVtZXxjdXJyZW5jeSBwYWNrfGNvaW4gcGFja3xwb2ludCBwYWNrKVxcYi9pO1xuY29uc3QgUFJFTUlVTV9FRElUSU9OID0gL1xcYihkZWx1eGV8dWx0aW1hdGV8Y29tcGxldGV8Z290eXxnYW1lIG9mIHRoZSB5ZWFyfGRpZ2l0YWwgZWRpdGlvbnxsYXVuY2ggZWRpdGlvbilcXGIvaTtcblxuZnVuY3Rpb24gY29tcHV0ZUhpdFNjb3JlKGc6IEdhbWUpOiBudW1iZXIge1xuICAvLyBObyBkaXNjb3VudCA9IG5vdCB2aWFibGUgZm9yIHJlc2FsZVxuICBpZiAoZy5kaXNjb3VudFBlcmNlbnQgPD0gMCkgcmV0dXJuIDA7XG5cbiAgbGV0IHNjb3JlID0gMDtcbiAgY29uc3QgcHJpY2VVc2QgPSAoZy5wcmljZU9yaWdpbmFsQ2VudHMgPz8gMCkgLyAxMDA7XG5cbiAgLy8gQUFBIHByaWNlIHRpZXJcbiAgaWYgKHByaWNlVXNkID49IDYwKSBzY29yZSArPSAzMDtcbiAgZWxzZSBpZiAocHJpY2VVc2QgPj0gNDApIHNjb3JlICs9IDIwO1xuICBlbHNlIGlmIChwcmljZVVzZCA+PSAyMCkgc2NvcmUgKz0gMTA7XG5cbiAgLy8gRGlzY291bnQgZGVwdGhcbiAgaWYgKGcuZGlzY291bnRQZXJjZW50ID49IDQwKSBzY29yZSArPSAyNTtcbiAgZWxzZSBpZiAoZy5kaXNjb3VudFBlcmNlbnQgPj0gMjUpIHNjb3JlICs9IDE1O1xuICBlbHNlIGlmIChnLmRpc2NvdW50UGVyY2VudCA+IDApIHNjb3JlICs9IDU7XG5cbiAgLy8gS25vd24gcHVibGlzaGVyIChmcm9tIGVucmljaGVkIHByb2R1Y3QgZGV0YWlsKVxuICBjb25zdCBkZXRhaWwgPSBzdG9yZS5nZXRQcm9kdWN0RGV0YWlsKGcuaWQpO1xuICBpZiAoZGV0YWlsPy5wdWJsaXNoZXIpIHtcbiAgICBjb25zdCBoaXRQdWJzID0gc3RvcmUuZ2V0SGl0UHVibGlzaGVycygpO1xuICAgIGNvbnN0IHB1YiA9IGRldGFpbC5wdWJsaXNoZXIudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoaGl0UHVicy5zb21lKChwKSA9PiBwdWIuaW5jbHVkZXMocC50b0xvd2VyQ2FzZSgpKSkpIHNjb3JlICs9IDI1O1xuICB9XG5cbiAgLy8gUFM1IHN1cHBvcnRcbiAgaWYgKGcucGxhdGZvcm1zPy5pbmNsdWRlcyhcIlBTNVwiKSkgc2NvcmUgKz0gMTA7XG5cbiAgLy8gUGVuYWx0eSBmb3IgYWRkLW9uIGNvbnRlbnQgKHVubGVzcyBpdCdzIGEgcHJlbWl1bSBlZGl0aW9uKVxuICBpZiAoQUREX09OX1BBVFRFUk4udGVzdChnLm5hbWUpICYmICFQUkVNSVVNX0VESVRJT04udGVzdChnLm5hbWUpKSBzY29yZSAtPSA1MDtcblxuICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBzY29yZSkpO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVNrdShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzbHVnID0gbmFtZVxuICAgIC5ub3JtYWxpemUoXCJORkRcIikucmVwbGFjZSgvW1x1MDMwMC1cdTAzNkZdL2csIFwiXCIpXG4gICAgLnRvVXBwZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15BLVowLTlcXHNdL2csIFwiXCIpXG4gICAgLnRyaW0oKVxuICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgLnNsaWNlKDAsIDUpXG4gICAgLmpvaW4oXCItXCIpO1xuICByZXR1cm4gYFBTLSR7c2x1Z30tMDAxYDtcbn1cblxuZnVuY3Rpb24gdG9HYW1lT3V0KGc6IEdhbWUsIGNmZ1ByaWNpbmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpKSB7XG4gIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmdQcmljaW5nLCBnLmN1cnJlbmN5IHx8IFwiVVNEXCIpO1xuICBjb25zdCBkYktleSA9IGdhbWVEYktleShnKTtcbiAgY29uc3QgbWF0Y2hlcyA9IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKGRiS2V5KSB8fCBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhnLmlkKTtcbiAgY29uc3QgbWFya2V0TWluID0gbWF0Y2hlcy5sZW5ndGhcbiAgICA/IE1hdGgubWluKC4uLm1hdGNoZXMubWFwKChtKSA9PiBtLnByaWNlQ2xwKSlcbiAgICA6IG51bGw7XG4gIHJldHVybiB7XG4gICAgaWQ6IGcuaWQsXG4gICAgZGJLZXksXG4gICAgcGxhdGZvcm06IGcucGxhdGZvcm0gfHwgXCJwc25cIixcbiAgICByZWdpb246IGcucmVnaW9uIHx8IFwidXNcIixcbiAgICBjdXJyZW5jeTogZy5jdXJyZW5jeSB8fCBcIlVTRFwiLFxuICAgIG5hbWU6IGcubmFtZSxcbiAgICBpbWFnZVVybDogZy5pbWFnZVVybCxcbiAgICBzdG9yZVVybDogZy5zdG9yZVVybCxcbiAgICBwbGF0Zm9ybXM6IGcucGxhdGZvcm1zLFxuICAgIHByaWNlT3JpZ2luYWw6XG4gICAgICBnLnByaWNlT3JpZ2luYWxDZW50cyAhPSBudWxsID8gZy5wcmljZU9yaWdpbmFsQ2VudHMgLyAxMDAgOiBudWxsLFxuICAgIHByaWNlRGlzY291bnRlZDpcbiAgICAgIGcucHJpY2VEaXNjb3VudGVkQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VEaXNjb3VudGVkQ2VudHMgLyAxMDAgOiBudWxsLFxuICAgIHByaWNlT3JpZ2luYWxVc2Q6XG4gICAgICBnLnByaWNlT3JpZ2luYWxDZW50cyAhPSBudWxsID8gZy5wcmljZU9yaWdpbmFsQ2VudHMgLyAxMDAgOiBudWxsLFxuICAgIHByaWNlRGlzY291bnRlZFVzZDpcbiAgICAgIGcucHJpY2VEaXNjb3VudGVkQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VEaXNjb3VudGVkQ2VudHMgLyAxMDAgOiBudWxsLFxuICAgIGRpc2NvdW50UGVyY2VudDogZy5kaXNjb3VudFBlcmNlbnQsXG4gICAgZGlzY291bnRFbmRBdDogZy5kaXNjb3VudEVuZEF0LFxuICAgIHNlbGVjdGVkOiBnLnNlbGVjdGVkLFxuICAgIHB1Ymxpc2hlZDogZy5wdWJsaXNoZWQsXG4gICAgbm90ZXM6IGcubm90ZXMsXG4gICAgeW91dHViZVVybDogZy55b3V0dWJlVXJsIHx8IFwiXCIsXG4gICAgYWN0aXZlOiBnLmFjdGl2ZSxcbiAgICBjb3N0Q2xwOiBzYWxlPy5jb3N0Q2xwID8/IG51bGwsXG4gICAgcHJpbWFyaWE6IHNhbGU/LnByaW1hcmlhID8/IG51bGwsXG4gICAgc2VjdW5kYXJpYTogc2FsZT8uc2VjdW5kYXJpYSA/PyBudWxsLFxuICAgIHRvdGFsUmV2ZW51ZTogc2FsZT8udG90YWxSZXZlbnVlID8/IG51bGwsXG4gICAgbmV0UHJvZml0OiBzYWxlPy5uZXRQcm9maXQgPz8gbnVsbCxcbiAgICBtYXJrZXRNaW4sXG4gICAgbWFya2V0Q291bnQ6IG1hdGNoZXMubGVuZ3RoLFxuICAgIG1hcmtldE1hdGNoZXM6IG1hdGNoZXMsXG4gICAgaGl0U2NvcmU6IGNvbXB1dGVIaXRTY29yZShnKSxcbiAgfTtcbn1cblxuLy8gR0VUIC9nYW1lc1xucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXNcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCB8fCBcIi9cIiwgXCJodHRwOi8veFwiKTtcbiAgY29uc3Qgc2VhcmNoID0gKHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwic2VhcmNoXCIpIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IG1pbkRpc2NvdW50ID0gcGFyc2VJbnQodXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJtaW5fZGlzY291bnRcIikgfHwgXCIwXCIsIDEwKSB8fCAwO1xuICBjb25zdCBvbmx5U2VsZWN0ZWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcIm9ubHlfc2VsZWN0ZWRcIikgPT09IFwidHJ1ZVwiO1xuICBjb25zdCBoaWRlUHVibGlzaGVkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJoaWRlX3B1Ymxpc2hlZFwiKSA9PT0gXCJ0cnVlXCI7XG4gIGNvbnN0IG9ubHlXaXRoTWFya2V0ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJvbmx5X3dpdGhfbWFya2V0XCIpID09PSBcInRydWVcIjtcbiAgY29uc3QgaW5jbHVkZUluYWN0aXZlID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJpbmNsdWRlX2luYWN0aXZlXCIpID09PSBcInRydWVcIjtcbiAgY29uc3QgcGxhdGZvcm1GaWx0ZXIgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInBsYXRmb3JtXCIpIHx8IFwiXCI7XG4gIGNvbnN0IG9ubHlIaXRzID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJvbmx5X2hpdHNcIikgPT09IFwidHJ1ZVwiO1xuICBjb25zdCBzb3J0ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJzb3J0XCIpIHx8IFwiZGlzY291bnRcIjtcblxuICBsZXQgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKTtcbiAgaWYgKCFpbmNsdWRlSW5hY3RpdmUpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG4gIGlmIChwbGF0Zm9ybUZpbHRlcikgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IChnLnBsYXRmb3JtIHx8IFwicHNuXCIpID09PSBwbGF0Zm9ybUZpbHRlcik7XG4gIGlmIChtaW5EaXNjb3VudCA+IDApIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLmRpc2NvdW50UGVyY2VudCA+PSBtaW5EaXNjb3VudCk7XG4gIGlmIChvbmx5U2VsZWN0ZWQpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnNlbGVjdGVkKTtcbiAgaWYgKGhpZGVQdWJsaXNoZWQpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiAhZy5wdWJsaXNoZWQpO1xuICBpZiAob25seUhpdHMpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBjb21wdXRlSGl0U2NvcmUoZykgPj0gNTApO1xuICBpZiAob25seVdpdGhNYXJrZXQpIHtcbiAgICBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gZ2FtZURiS2V5KGcpO1xuICAgICAgcmV0dXJuIChzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhrZXkpIHx8IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKGcuaWQpKS5sZW5ndGggPiAwO1xuICAgIH0pO1xuICB9XG4gIGlmIChzZWFyY2gpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzZWFyY2gpKTtcblxuICBpZiAoc29ydCA9PT0gXCJoaXRcIikgZ2FtZXMuc29ydCgoYSwgYikgPT4gY29tcHV0ZUhpdFNjb3JlKGIpIC0gY29tcHV0ZUhpdFNjb3JlKGEpKTtcbiAgZWxzZSBpZiAoc29ydCA9PT0gXCJwcmljZVwiKSBnYW1lcy5zb3J0KChhLCBiKSA9PiAoYS5wcmljZURpc2NvdW50ZWRDZW50cyA/PyAwKSAtIChiLnByaWNlRGlzY291bnRlZENlbnRzID8/IDApKTtcbiAgZWxzZSBpZiAoc29ydCA9PT0gXCJuYW1lXCIpIGdhbWVzLnNvcnQoKGEsIGIpID0+IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSkpO1xuICBlbHNlIGlmIChzb3J0ID09PSBcIm1hcmtldFwiKSB7XG4gICAgZ2FtZXMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgY29uc3QgYW0gPSBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhhLmlkKTtcbiAgICAgIGNvbnN0IGJtID0gc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoYi5pZCk7XG4gICAgICBjb25zdCBhcCA9IGFtLmxlbmd0aCA/IE1hdGgubWluKC4uLmFtLm1hcCgobSkgPT4gbS5wcmljZUNscCkpIDogSW5maW5pdHk7XG4gICAgICBjb25zdCBicCA9IGJtLmxlbmd0aCA/IE1hdGgubWluKC4uLmJtLm1hcCgobSkgPT4gbS5wcmljZUNscCkpIDogSW5maW5pdHk7XG4gICAgICByZXR1cm4gYXAgLSBicDtcbiAgICB9KTtcbiAgfVxuICBlbHNlIGdhbWVzLnNvcnQoKGEsIGIpID0+IGIuZGlzY291bnRQZXJjZW50IC0gYS5kaXNjb3VudFBlcmNlbnQpO1xuXG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCBnYW1lcy5tYXAoKGcpID0+IHRvR2FtZU91dChnLCBjZmcpKSk7XG59KTtcblxuLy8gUEFUQ0ggL2dhbWVzLzppZCBcdTIwMTQgaWQgY2FuIGJlIGEgY29tcG9zaXRlIGRiS2V5IChwc246dXM6VVBYWFhYLS4uLikgb3IgYSBiYXJlIFBTTiBpZFxucm91dGUoXCJQQVRDSFwiLCBcIi9nYW1lcy86aWRcIiwgYXN5bmMgKHJlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyBQYXJ0aWFsPFxuICAgIFBpY2s8R2FtZSwgXCJzZWxlY3RlZFwiIHwgXCJwdWJsaXNoZWRcIiB8IFwibm90ZXNcIiB8IFwieW91dHViZVVybFwiPlxuICA+O1xuICBjb25zdCBwYXRjaDogUGFydGlhbDxHYW1lPiA9IHt9O1xuICBpZiAodHlwZW9mIGJvZHkuc2VsZWN0ZWQgPT09IFwiYm9vbGVhblwiKSBwYXRjaC5zZWxlY3RlZCA9IGJvZHkuc2VsZWN0ZWQ7XG4gIGlmICh0eXBlb2YgYm9keS5wdWJsaXNoZWQgPT09IFwiYm9vbGVhblwiKSBwYXRjaC5wdWJsaXNoZWQgPSBib2R5LnB1Ymxpc2hlZDtcbiAgaWYgKHR5cGVvZiBib2R5Lm5vdGVzID09PSBcInN0cmluZ1wiKSBwYXRjaC5ub3RlcyA9IGJvZHkubm90ZXM7XG4gIGlmICh0eXBlb2YgYm9keS55b3V0dWJlVXJsID09PSBcInN0cmluZ1wiKSBwYXRjaC55b3V0dWJlVXJsID0gYm9keS55b3V0dWJlVXJsLnRyaW0oKTtcbiAgY29uc3QgaWQgPSBkZWNvZGVVUklDb21wb25lbnQocGFyYW1zLmlkKTtcbiAgbGV0IHVwZGF0ZWQgPSBzdG9yZS5wYXRjaEdhbWUoaWQsIHBhdGNoKTtcbiAgaWYgKCF1cGRhdGVkKSB7XG4gICAgLy8gVHJ5IGxlZ2FjeSBrZXkgKGJhcmUgUFNOIGlkKVxuICAgIHVwZGF0ZWQgPSBzdG9yZS5wYXRjaEdhbWUoYHBzbjp1czoke2lkfWAsIHBhdGNoKTtcbiAgfVxuICBpZiAoIXVwZGF0ZWQpIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiB9KTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHRvR2FtZU91dCh1cGRhdGVkKSk7XG59KTtcblxuLy8gUE9TVCAvcmVmcmVzaCBcdTIwMTQgbXVsdGktcGxhdGZvcm0gcmVmcmVzaC4gT3B0aW9uYWwgYm9keTogeyBwbGF0Zm9ybT8sIHJlZ2lvbj8gfVxuLy8gV2l0aCBubyBib2R5LCByZWZyZXNoZXMgYWxsIGVuYWJsZWQgc291cmNlcy4gV2l0aCBwbGF0Zm9ybS9yZWdpb24sIHJlZnJlc2hlc1xuLy8gb25seSB0aGF0IHNwZWNpZmljIHNvdXJjZS5cbnJvdXRlKFwiUE9TVFwiLCBcIi9yZWZyZXNoXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xuICAgIGNvbnN0IHRhcmdldFBsYXRmb3JtID0gYm9keS5wbGF0Zm9ybSBhcyBQbGF0Zm9ybSB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0YXJnZXRSZWdpb24gPSBib2R5LnJlZ2lvbiBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBzb3VyY2VzID0gc3RvcmUuZ2V0U291cmNlcygpLmZpbHRlcigocykgPT4ge1xuICAgICAgaWYgKCFzLmVuYWJsZWQpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICh0YXJnZXRQbGF0Zm9ybSAmJiBzLnBsYXRmb3JtICE9PSB0YXJnZXRQbGF0Zm9ybSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKHRhcmdldFJlZ2lvbiAmJiBzLnJlZ2lvbiAhPT0gdGFyZ2V0UmVnaW9uKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG5vd0lzbyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBjb25zdCByZXN1bHRzOiBBcnJheTx7XG4gICAgICBwbGF0Zm9ybTogc3RyaW5nO1xuICAgICAgcmVnaW9uOiBzdHJpbmc7XG4gICAgICBuZXdDb3VudDogbnVtYmVyO1xuICAgICAgdXBkYXRlZDogbnVtYmVyO1xuICAgICAgZGlzYXBwZWFyZWQ6IG51bWJlcjtcbiAgICAgIHRvdGFsU2VlbjogbnVtYmVyO1xuICAgICAgZXJyb3I/OiBzdHJpbmc7XG4gICAgfT4gPSBbXTtcbiAgICBsZXQgYWxsV2F0Y2hsaXN0QWxlcnRzOiBXYXRjaGxpc3RBbGVydFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBzb3VyY2VzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IGdldFByb3ZpZGVyKHNvdXJjZS5wbGF0Zm9ybSk7XG4gICAgICAgIGNvbnN0IHNlZW5LZXlzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGxldCBuZXdDb3VudCA9IDA7XG4gICAgICAgIGxldCB1cGRhdGVkID0gMDtcbiAgICAgICAgbGV0IHRvdGFsU2VlbiA9IDA7XG5cbiAgICAgICAgLy8gRm9yIFBTTiwgaW5qZWN0IHRoZSBjYXRlZ29yeUlkIGZyb20gdGhlIFBTTiBjb25maWcgaWYgbm90IG9uIHNvdXJjZVxuICAgICAgICBjb25zdCBlZmZTb3VyY2UgPSB7IC4uLnNvdXJjZSB9O1xuICAgICAgICBpZiAoc291cmNlLnBsYXRmb3JtID09PSBcInBzblwiICYmICFzb3VyY2UuY2F0ZWdvcnlJZCkge1xuICAgICAgICAgIGVmZlNvdXJjZS5jYXRlZ29yeUlkID0gc3RvcmUuZ2V0UHNuKCkuZGVhbHNDYXRlZ29yeUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIGF3YWl0IChjb25zdCBkZWFsIG9mIHByb3ZpZGVyLmZldGNoRGVhbHMoZWZmU291cmNlKSkge1xuICAgICAgICAgIHRvdGFsU2VlbisrO1xuICAgICAgICAgIGNvbnN0IGRiS2V5ID0gYCR7c291cmNlLnBsYXRmb3JtfToke3NvdXJjZS5yZWdpb259OiR7ZGVhbC5pZH1gO1xuICAgICAgICAgIHNlZW5LZXlzLmFkZChkYktleSk7XG4gICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5nZXRHYW1lQnlDb21wb3NpdGUoc291cmNlLnBsYXRmb3JtLCBzb3VyY2UucmVnaW9uLCBkZWFsLmlkKTtcbiAgICAgICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgICAgICBzdG9yZS51cHNlcnRHYW1lKHtcbiAgICAgICAgICAgICAgaWQ6IGRlYWwuaWQsXG4gICAgICAgICAgICAgIHBsYXRmb3JtOiBzb3VyY2UucGxhdGZvcm0sXG4gICAgICAgICAgICAgIHJlZ2lvbjogc291cmNlLnJlZ2lvbixcbiAgICAgICAgICAgICAgbmFtZTogZGVhbC5uYW1lLFxuICAgICAgICAgICAgICBpbWFnZVVybDogZGVhbC5pbWFnZVVybCxcbiAgICAgICAgICAgICAgc3RvcmVVcmw6IGRlYWwuc3RvcmVVcmwsXG4gICAgICAgICAgICAgIHBsYXRmb3JtczogZGVhbC5oYXJkd2FyZVBsYXRmb3JtcyxcbiAgICAgICAgICAgICAgY3VycmVuY3k6IGRlYWwuY3VycmVuY3ksXG4gICAgICAgICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMsXG4gICAgICAgICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBkZWFsLnByaWNlRGlzY291bnRlZENlbnRzLFxuICAgICAgICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IGRlYWwuZGlzY291bnRQZXJjZW50LFxuICAgICAgICAgICAgICBkaXNjb3VudEVuZEF0OiBkZWFsLmRpc2NvdW50RW5kQXQsXG4gICAgICAgICAgICAgIHNlbGVjdGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgcHVibGlzaGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgbm90ZXM6IFwiXCIsXG4gICAgICAgICAgICAgIHlvdXR1YmVVcmw6IFwiXCIsXG4gICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZmlyc3RTZWVuQXQ6IG5vd0lzbyxcbiAgICAgICAgICAgICAgbGFzdFNlZW5BdDogbm93SXNvLFxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5vd0lzbyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbmV3Q291bnQrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RvcmUudXBzZXJ0R2FtZSh7XG4gICAgICAgICAgICAgIC4uLmV4aXN0aW5nLFxuICAgICAgICAgICAgICBuYW1lOiBkZWFsLm5hbWUgfHwgZXhpc3RpbmcubmFtZSxcbiAgICAgICAgICAgICAgaW1hZ2VVcmw6IGRlYWwuaW1hZ2VVcmwgfHwgZXhpc3RpbmcuaW1hZ2VVcmwsXG4gICAgICAgICAgICAgIHN0b3JlVXJsOiBkZWFsLnN0b3JlVXJsIHx8IGV4aXN0aW5nLnN0b3JlVXJsLFxuICAgICAgICAgICAgICBwbGF0Zm9ybXM6IGRlYWwuaGFyZHdhcmVQbGF0Zm9ybXMsXG4gICAgICAgICAgICAgIGN1cnJlbmN5OiBkZWFsLmN1cnJlbmN5LFxuICAgICAgICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGRlYWwucHJpY2VPcmlnaW5hbENlbnRzLFxuICAgICAgICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICAgICAgICAgICAgZGlzY291bnRQZXJjZW50OiBkZWFsLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgICAgICAgZGlzY291bnRFbmRBdDogZGVhbC5kaXNjb3VudEVuZEF0LFxuICAgICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgIGxhc3RTZWVuQXQ6IG5vd0lzbyxcbiAgICAgICAgICAgICAgdXBkYXRlZEF0OiBub3dJc28sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHVwZGF0ZWQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkaXNhcHBlYXJlZCA9IHN0b3JlLm1hcmtJbmFjdGl2ZUlmTWlzc2luZyhcbiAgICAgICAgICBzZWVuS2V5cyxcbiAgICAgICAgICBzb3VyY2UucGxhdGZvcm0sXG4gICAgICAgICAgc291cmNlLnJlZ2lvblxuICAgICAgICApO1xuXG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgcGxhdGZvcm06IHNvdXJjZS5wbGF0Zm9ybSxcbiAgICAgICAgICByZWdpb246IHNvdXJjZS5yZWdpb24sXG4gICAgICAgICAgbmV3Q291bnQsXG4gICAgICAgICAgdXBkYXRlZCxcbiAgICAgICAgICBkaXNhcHBlYXJlZCxcbiAgICAgICAgICB0b3RhbFNlZW4sXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBlcnJNc2cgPSAoZSBhcyBFcnJvcikubWVzc2FnZTtcbiAgICAgICAgY29uc29sZS5lcnJvcihgWyR7c291cmNlLnBsYXRmb3JtfS8ke3NvdXJjZS5yZWdpb259XSBFcnJvcjogJHtlcnJNc2d9YCk7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgcGxhdGZvcm06IHNvdXJjZS5wbGF0Zm9ybSxcbiAgICAgICAgICByZWdpb246IHNvdXJjZS5yZWdpb24sXG4gICAgICAgICAgbmV3Q291bnQ6IDAsXG4gICAgICAgICAgdXBkYXRlZDogMCxcbiAgICAgICAgICBkaXNhcHBlYXJlZDogMCxcbiAgICAgICAgICB0b3RhbFNlZW46IDAsXG4gICAgICAgICAgZXJyb3I6IGVyck1zZyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVjb21wdXRlTWF0Y2hlcygpO1xuICAgIC8vIERpZmYgd2F0Y2hsaXN0IGZvciBQU04gc291cmNlc1xuICAgIGNvbnN0IHBzblNlZW5JZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGcgb2Ygc3RvcmUubGlzdEdhbWVzKCkpIHtcbiAgICAgIGlmIChnLmFjdGl2ZSAmJiBnLnBsYXRmb3JtID09PSBcInBzblwiKSBwc25TZWVuSWRzLmFkZChnLmlkKTtcbiAgICB9XG4gICAgYWxsV2F0Y2hsaXN0QWxlcnRzID0gZGlmZldhdGNobGlzdChwc25TZWVuSWRzLCBub3dJc28pO1xuXG4gICAgY29uc3QgdG90YWxOZXcgPSByZXN1bHRzLnJlZHVjZSgocywgcikgPT4gcyArIHIubmV3Q291bnQsIDApO1xuICAgIGNvbnN0IHRvdGFsVXBkYXRlZCA9IHJlc3VsdHMucmVkdWNlKChzLCByKSA9PiBzICsgci51cGRhdGVkLCAwKTtcbiAgICBjb25zdCB0b3RhbERpc2FwcGVhcmVkID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLmRpc2FwcGVhcmVkLCAwKTtcbiAgICBjb25zdCB0b3RhbFNlZW4gPSByZXN1bHRzLnJlZHVjZSgocywgcikgPT4gcyArIHIudG90YWxTZWVuLCAwKTtcbiAgICBjb25zdCB0b3RhbEtlcHQgPSByZXN1bHRzLnJlZHVjZSgocywgcikgPT4gcyArIHIudG90YWxTZWVuIC0gKHIuZXJyb3IgPyByLnRvdGFsU2VlbiA6IDApLCAwKTtcblxuICAgIHNlbmRKc29uKHJlcywgMjAwLCB7XG4gICAgICBuZXc6IHRvdGFsTmV3LFxuICAgICAgdXBkYXRlZDogdG90YWxVcGRhdGVkLFxuICAgICAgZGlzYXBwZWFyZWQ6IHRvdGFsRGlzYXBwZWFyZWQsXG4gICAgICB0b3RhbFNlZW4sXG4gICAgICBrZXB0OiB0b3RhbEtlcHQsXG4gICAgICBmaWx0ZXJlZEFkZE9uczogMCxcbiAgICAgIHdhdGNobGlzdEFsZXJ0czogYWxsV2F0Y2hsaXN0QWxlcnRzLFxuICAgICAgc291cmNlUmVzdWx0czogcmVzdWx0cyxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgUGVyc2lzdGVkUXVlcnlOb3RGb3VuZEVycm9yKSB7XG4gICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDIsIHtcbiAgICAgICAgZXJyb3I6IFwicGVyc2lzdGVkX3F1ZXJ5X25vdF9mb3VuZFwiLFxuICAgICAgICBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSxcbiAgICAgICAgaGludDpcbiAgICAgICAgICBcIkFicmUgRGV2VG9vbHMgPiBOZXR3b3JrIGVuIGxhIHBcdTAwRTFnaW5hIGRlIG9mZXJ0YXMgZGUgUFMgU3RvcmUsIGJ1c2NhIGxhIFwiICtcbiAgICAgICAgICBcInJlcXVlc3QgYSAvYXBpL2dyYXBocWwvdjEvb3A/b3BlcmF0aW9uTmFtZT1jYXRlZ29yeUdyaWRSZXRyaWV2ZSB5IFwiICtcbiAgICAgICAgICBcImFjdHVhbGl6YSBlbCBoYXNoIGVuIEFqdXN0ZXMuXCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBQc25BcGlFcnJvciB8fCBlIGluc3RhbmNlb2YgUHJvdmlkZXJFcnJvcikge1xuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICAgIGVycm9yOiBcInByb3ZpZGVyX2Vycm9yXCIsXG4gICAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgICAgICBoaW50OlxuICAgICAgICAgIFwiU2kgZXN0byBjb3JyZSBlbiB1bmEgc2FuZGJveCAoQm9sdC9TdGFja0JsaXR6KSBsYSBJUCBwdWVkZSBlc3RhciBcIiArXG4gICAgICAgICAgXCJibG9xdWVhZGEuIFByb2JcdTAwRTEgZGVzZGUgdHUgbVx1MDBFMXF1aW5hIG8gc2Vydmlkb3IuXCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiaW50ZXJuYWxcIiwgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gIH1cbn0pO1xuXG4vLyBHRVQgL2dhbWVzL2V4cG9ydC5jc3Zcbi8vIFBhcmFtczogb25seV9zZWxlY3RlZD10cnVlfGZhbHNlLCBmb3JtYXQ9c2hlZXRzIChCT00gKyBzZW1pY29sb25zIGZvciBHb29nbGUgU2hlZXRzKVxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvZXhwb3J0LmNzdlwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBvbmx5U2VsZWN0ZWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcIm9ubHlfc2VsZWN0ZWRcIikgIT09IFwiZmFsc2VcIjtcbiAgY29uc3Qgc2hlZXRzRm9ybWF0ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJmb3JtYXRcIikgPT09IFwic2hlZXRzXCI7XG4gIGNvbnN0IHNlcCA9IHNoZWV0c0Zvcm1hdCA/IFwiO1wiIDogXCIsXCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG4gIGlmIChvbmx5U2VsZWN0ZWQpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnNlbGVjdGVkKTtcbiAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0U2V0dGluZ3MoKTtcblxuICBjb25zdCBoZWFkZXIgPSBbXG4gICAgXCJpZFwiLFxuICAgIFwicGxhdGFmb3JtYVwiLFxuICAgIFwicmVnaW9uXCIsXG4gICAgXCJtb25lZGFcIixcbiAgICBcIm5hbWVcIixcbiAgICBcInBsYXRmb3Jtc1wiLFxuICAgIFwic3RvcmVfdXJsXCIsXG4gICAgXCJwcmVjaW9fb3JpZ2luYWxcIixcbiAgICBcInByZWNpb19kZXNjdWVudG9cIixcbiAgICBcImRlc2N1ZW50b19wY3RcIixcbiAgICBcImZpbl9vZmVydGFcIixcbiAgICBcImNvc3RvX2NscFwiLFxuICAgIFwicHJpbWFyaWFfY2xwXCIsXG4gICAgXCJzZWN1bmRhcmlhX2NscFwiLFxuICAgIFwiaW5ncmVzb190b3RhbFwiLFxuICAgIFwiZ2FuYW5jaWFfbmV0YVwiLFxuICAgIFwibWFyZ2VuX3BjdFwiLFxuICAgIFwibm90YXNcIixcbiAgXTtcblxuICBjb25zdCBlc2NhcGUgPSAodjogdW5rbm93bikgPT4ge1xuICAgIGNvbnN0IHMgPSB2ID09IG51bGwgPyBcIlwiIDogU3RyaW5nKHYpO1xuICAgIGNvbnN0IG5lZWRzUXVvdGUgPSBzLmluY2x1ZGVzKHNlcCkgfHwgcy5pbmNsdWRlcygnXCInKSB8fCBzLmluY2x1ZGVzKFwiXFxuXCIpO1xuICAgIHJldHVybiBuZWVkc1F1b3RlID8gYFwiJHtzLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgIDogcztcbiAgfTtcblxuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApO1xuICBjb25zdCBtZXRhZGF0YSA9IHNoZWV0c0Zvcm1hdFxuICAgID8gYCMgRXhwb3J0YWRvOiAke25vd30gXHUwMEI3IFRDIFVTRDogJHtjZmcudXNkVG9DbHB9IFx1MDBCNyBEZXNjdWVudG8gc2FsZG8gVVNEOiAke2NmZy5iYWxhbmNlRGlzY291bnRVc2R9XFxuYFxuICAgIDogXCJcIjtcblxuICBjb25zdCBsaW5lcyA9IFtoZWFkZXIuam9pbihzZXApXTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgY29uc3Qgc2FsZSA9IGNvbXB1dGVTYWxlUHJpY2VzKGcucHJpY2VEaXNjb3VudGVkQ2VudHMsIGNmZywgZy5jdXJyZW5jeSB8fCBcIlVTRFwiKTtcbiAgICBjb25zdCBjb3N0ID0gc2FsZT8uY29zdENscCA/PyBudWxsO1xuICAgIGNvbnN0IG1hcmdlbiA9IGNvc3QgJiYgc2FsZT8ubmV0UHJvZml0XG4gICAgICA/IE1hdGgucm91bmQoKHNhbGUubmV0UHJvZml0IC8gY29zdCkgKiAxMDApXG4gICAgICA6IFwiXCI7XG4gICAgbGluZXMucHVzaChcbiAgICAgIFtcbiAgICAgICAgZy5pZCxcbiAgICAgICAgZy5wbGF0Zm9ybSB8fCBcInBzblwiLFxuICAgICAgICBnLnJlZ2lvbiB8fCBcInVzXCIsXG4gICAgICAgIGcuY3VycmVuY3kgfHwgXCJVU0RcIixcbiAgICAgICAgZy5uYW1lLFxuICAgICAgICBnLnBsYXRmb3JtcyxcbiAgICAgICAgZy5zdG9yZVVybCA/PyBcIlwiLFxuICAgICAgICBnLnByaWNlT3JpZ2luYWxDZW50cyAhPSBudWxsID8gKGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwKS50b0ZpeGVkKDIpIDogXCJcIixcbiAgICAgICAgZy5wcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsID8gKGcucHJpY2VEaXNjb3VudGVkQ2VudHMgLyAxMDApLnRvRml4ZWQoMikgOiBcIlwiLFxuICAgICAgICBnLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgZy5kaXNjb3VudEVuZEF0ID8/IFwiXCIsXG4gICAgICAgIGNvc3QgPz8gXCJcIixcbiAgICAgICAgc2FsZT8ucHJpbWFyaWEgPz8gXCJcIixcbiAgICAgICAgc2FsZT8uc2VjdW5kYXJpYSA/PyBcIlwiLFxuICAgICAgICBzYWxlPy50b3RhbFJldmVudWUgPz8gXCJcIixcbiAgICAgICAgc2FsZT8ubmV0UHJvZml0ID8/IFwiXCIsXG4gICAgICAgIG1hcmdlbixcbiAgICAgICAgZy5ub3RlcyxcbiAgICAgIF1cbiAgICAgICAgLm1hcChlc2NhcGUpXG4gICAgICAgIC5qb2luKHNlcClcbiAgICApO1xuICB9XG5cbiAgY29uc3QgY29udGVudCA9IG1ldGFkYXRhICsgbGluZXMuam9pbihcIlxcblwiKTtcbiAgY29uc3QgYm9tID0gc2hlZXRzRm9ybWF0ID8gXCJcdUZFRkZcIiA6IFwiXCI7XG5cbiAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJ0ZXh0L2NzdjsgY2hhcnNldD11dGYtOFwiKTtcbiAgcmVzLnNldEhlYWRlcihcImNvbnRlbnQtZGlzcG9zaXRpb25cIiwgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPVwiYXBpcHNuLWdhbWVzLmNzdlwiJyk7XG4gIHJlcy5lbmQoYm9tICsgY29udGVudCk7XG59KTtcblxuLy8gR0VUIC9nYW1lcy9leHBvcnQtc3VwYWJhc2UuY3N2IFx1MjAxNCBDU1YgbWF0Y2hpbmcgdGhlIFN1cGFiYXNlIHByb2R1Y3RzIHRhYmxlIHNjaGVtYSBleGFjdGx5XG5yb3V0ZShcIkdFVFwiLCBcIi9nYW1lcy9leHBvcnQtc3VwYWJhc2UuY3N2XCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IG9ubHlTZWxlY3RlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9zZWxlY3RlZFwiKSAhPT0gXCJmYWxzZVwiO1xuICBjb25zdCBwbGF0Zm9ybUZpbHRlciA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwicGxhdGZvcm1cIikgfHwgXCJcIjtcblxuICBsZXQgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgaWYgKG9ubHlTZWxlY3RlZCkgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IGcuc2VsZWN0ZWQpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnBsYXRmb3JtID09PSBwbGF0Zm9ybUZpbHRlcik7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3QgaGVhZGVyID0gW1xuICAgIFwic2t1XCIsXG4gICAgXCJkaXNwbGF5X25hbWVcIixcbiAgICBcImltYWdlc1wiLFxuICAgIFwicGxhdGZvcm1fYXZhaWxhYmlsaXR5XCIsXG4gICAgXCJwcmljaW5nX2J5X3BsYXRmb3JtX2FuZF9hY2NvdW50XCIsXG4gICAgXCJzdG9ja19xdWFudGl0eVwiLFxuICAgIFwiaXNfYWN0aXZlXCIsXG4gICAgXCJzb3J0X29yZGVyXCIsXG4gIF07XG5cbiAgY29uc3QgZXNjYXBlID0gKHY6IHVua25vd24pID0+IHtcbiAgICBjb25zdCBzID0gdiA9PSBudWxsID8gXCJcIiA6IFN0cmluZyh2KTtcbiAgICBjb25zdCBuZWVkc1F1b3RlID0gcy5pbmNsdWRlcyhcIixcIikgfHwgcy5pbmNsdWRlcygnXCInKSB8fCBzLmluY2x1ZGVzKFwiXFxuXCIpO1xuICAgIHJldHVybiBuZWVkc1F1b3RlID8gYFwiJHtzLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgIDogcztcbiAgfTtcblxuICBjb25zdCBsaW5lcyA9IFtoZWFkZXIuam9pbihcIixcIildO1xuICBmb3IgKGNvbnN0IGcgb2YgZ2FtZXMpIHtcbiAgICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnLCBnLmN1cnJlbmN5IHx8IFwiVVNEXCIpO1xuICAgIGNvbnN0IGRldGFpbCA9IHN0b3JlLmdldFByb2R1Y3REZXRhaWwoZy5pZCk7XG5cbiAgICAvLyBTS1U6IFBTLVNMVUctMDAxXG4gICAgY29uc3Qgc2x1ZyA9IGcubmFtZVxuICAgICAgLnRvVXBwZXJDYXNlKClcbiAgICAgIC5yZXBsYWNlKC9bXkEtWjAtOVxcc10vZywgXCJcIilcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAuc2xpY2UoMCwgNClcbiAgICAgIC5qb2luKFwiLVwiKTtcbiAgICBjb25zdCBza3UgPSBgUFMtJHtzbHVnfS0wMDFgO1xuXG4gICAgLy8gSW1hZ2VzOiBbe2FsdCwgdXJsfV0gXHUyMDE0IGNvdmVyIGFydCBmcm9tIGdyaWQgdGlsZSBmaXJzdCwgdGhlbiBoZXJvL2Jhbm5lclxuICAgIGNvbnN0IGltYWdlczogQXJyYXk8eyBhbHQ6IHN0cmluZzsgdXJsOiBzdHJpbmcgfT4gPSBbXTtcbiAgICBpZiAoZy5pbWFnZVVybCkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBnLmltYWdlVXJsIH0pO1xuICAgIGlmIChkZXRhaWw/Lm1lZGlhPy5oZXJvVXJsICYmICFpbWFnZXMuc29tZSgoeCkgPT4geC51cmwgPT09IGRldGFpbC5tZWRpYS5oZXJvVXJsKSkge1xuICAgICAgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBkZXRhaWwubWVkaWEuaGVyb1VybCB9KTtcbiAgICB9XG4gICAgaWYgKGRldGFpbD8uY2Fyb3VzZWxJbWFnZXMpIHtcbiAgICAgIGZvciAoY29uc3QgaW1nIG9mIGRldGFpbC5jYXJvdXNlbEltYWdlcykge1xuICAgICAgICBpZiAoIWltYWdlcy5zb21lKCh4KSA9PiB4LnVybCA9PT0gaW1nKSkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBpbWcgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkZXRhaWw/Lm1lZGlhPy5zY3JlZW5zaG90cykge1xuICAgICAgZm9yIChjb25zdCBpbWcgb2YgZGV0YWlsLm1lZGlhLnNjcmVlbnNob3RzKSB7XG4gICAgICAgIGlmICghaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBpbWcpKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGltZyB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQbGF0Zm9ybSBhdmFpbGFiaWxpdHk6IHtQUzQ6IHRydWUsIFBTNTogdHJ1ZX1cbiAgICBjb25zdCBod1BsYXRmb3JtcyA9IChnLnBsYXRmb3JtcyB8fCBcIlwiKVxuICAgICAgLnNwbGl0KFwiLFwiKVxuICAgICAgLm1hcCgocCkgPT4gcC50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IHBsYXRmb3JtQXZhaWxhYmlsaXR5OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3JtcykgcGxhdGZvcm1BdmFpbGFiaWxpdHlbcF0gPSB0cnVlO1xuXG4gICAgLy8gUHJpY2luZzogcGVyIGhhcmR3YXJlIHBsYXRmb3JtIFx1MDBENyBhY2NvdW50IHR5cGVcbiAgICBjb25zdCBwcmltYXJpYSA9IHNhbGU/LnByaW1hcmlhID8/IG51bGw7XG4gICAgY29uc3Qgc2VjdW5kYXJpYSA9IHNhbGU/LnNlY3VuZGFyaWEgPz8gbnVsbDtcbiAgICBjb25zdCBwcmljaW5nOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBudW1iZXIgfCBudWxsPj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgaHdQbGF0Zm9ybXMubGVuZ3RoID8gaHdQbGF0Zm9ybXMgOiBbXCJQUzRcIl0pIHtcbiAgICAgIHByaWNpbmdbcF0gPSB7XG4gICAgICAgIFByaW1hcmlhOiBwcmltYXJpYSxcbiAgICAgICAgU2VjdW5kYXJpYTogc2VjdW5kYXJpYSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGluZXMucHVzaChcbiAgICAgIFtcbiAgICAgICAgc2t1LFxuICAgICAgICBnLm5hbWUsXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KGltYWdlcyksXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHBsYXRmb3JtQXZhaWxhYmlsaXR5KSxcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkocHJpY2luZyksXG4gICAgICAgIDAsXG4gICAgICAgIHRydWUsXG4gICAgICAgIDAsXG4gICAgICBdXG4gICAgICAgIC5tYXAoZXNjYXBlKVxuICAgICAgICAuam9pbihcIixcIilcbiAgICApO1xuICB9XG5cbiAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJ0ZXh0L2NzdjsgY2hhcnNldD11dGYtOFwiKTtcbiAgcmVzLnNldEhlYWRlcihcImNvbnRlbnQtZGlzcG9zaXRpb25cIiwgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPVwiYXBpcHNuLXN1cGFiYXNlLmNzdlwiJyk7XG4gIHJlcy5lbmQobGluZXMuam9pbihcIlxcblwiKSk7XG59KTtcblxuLy8gR0VUIC9nYW1lcy9leHBvcnQuanNvbiBcdTIwMTQgU3VwYWJhc2UtcmVhZHkgSlNPTiBleHBvcnQgd2l0aCBlbnJpY2hlZCBwcm9kdWN0IGRldGFpbHNcbi8vIFBhcmFtczogb25seV9zZWxlY3RlZD10cnVlfGZhbHNlLCBwbGF0Zm9ybT1wc258eGJveHwuLi4sIGVucmljaD10cnVlIChpbmNsdWRlIHByb2R1Y3QgZGV0YWlsIGlmIGNhY2hlZClcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzL2V4cG9ydC5qc29uXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IG9ubHlTZWxlY3RlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9zZWxlY3RlZFwiKSAhPT0gXCJmYWxzZVwiO1xuICBjb25zdCBlbnJpY2ggPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcImVucmljaFwiKSAhPT0gXCJmYWxzZVwiO1xuICBjb25zdCBwbGF0Zm9ybUZpbHRlciA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwicGxhdGZvcm1cIikgfHwgXCJcIjtcblxuICBsZXQgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgaWYgKG9ubHlTZWxlY3RlZCkgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IGcuc2VsZWN0ZWQpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnBsYXRmb3JtID09PSBwbGF0Zm9ybUZpbHRlcik7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3Qgcm93cyA9IGdhbWVzLm1hcCgoZykgPT4ge1xuICAgIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmcsIGcuY3VycmVuY3kgfHwgXCJVU0RcIik7XG4gICAgY29uc3QgZGV0YWlsID0gZW5yaWNoID8gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBkYktleSA9IGAke2cucGxhdGZvcm19OiR7Zy5yZWdpb259OiR7Zy5pZH1gO1xuICAgIGNvbnN0IG1hdGNoZXMgPSBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhkYktleSkgfHwgc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoZy5pZCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLy8gQ29yZSBpZGVudGlmaWNhdGlvblxuICAgICAgaWQ6IGcuaWQsXG4gICAgICBkYl9rZXk6IGRiS2V5LFxuICAgICAgcGxhdGZvcm06IGcucGxhdGZvcm0sXG4gICAgICByZWdpb246IGcucmVnaW9uLFxuICAgICAgY3VycmVuY3k6IGcuY3VycmVuY3kgfHwgXCJVU0RcIixcblxuICAgICAgLy8gQmFzaWMgaW5mb1xuICAgICAgbmFtZTogZy5uYW1lLFxuICAgICAgaW1hZ2VfdXJsOiBnLmltYWdlVXJsLFxuICAgICAgc3RvcmVfdXJsOiBnLnN0b3JlVXJsLFxuICAgICAgaGFyZHdhcmVfcGxhdGZvcm1zOiBnLnBsYXRmb3JtcyxcblxuICAgICAgLy8gUHJpY2luZ1xuICAgICAgcHJpY2Vfb3JpZ2luYWw6IGcucHJpY2VPcmlnaW5hbENlbnRzICE9IG51bGwgPyBnLnByaWNlT3JpZ2luYWxDZW50cyAvIDEwMCA6IG51bGwsXG4gICAgICBwcmljZV9kaXNjb3VudGVkOiBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICAgIGRpc2NvdW50X3BlcmNlbnQ6IGcuZGlzY291bnRQZXJjZW50LFxuICAgICAgZGlzY291bnRfZW5kX2F0OiBnLmRpc2NvdW50RW5kQXQgfHwgZGV0YWlsPy5kaXNjb3VudEVuZEF0IHx8IG51bGwsXG5cbiAgICAgIC8vIENMUCBwcmljaW5nXG4gICAgICBjb3N0X2NscDogc2FsZT8uY29zdENscCA/PyBudWxsLFxuICAgICAgcHJpbWFyaWFfY2xwOiBzYWxlPy5wcmltYXJpYSA/PyBudWxsLFxuICAgICAgc2VjdW5kYXJpYV9jbHA6IHNhbGU/LnNlY3VuZGFyaWEgPz8gbnVsbCxcblxuICAgICAgLy8gRW5yaWNoZWQgZGV0YWlsIChmcm9tIHByb2R1Y3QgcGFnZSBzY3JhcGUpXG4gICAgICBkZXNjcmlwdGlvbjogZGV0YWlsPy5kZXNjcmlwdGlvbiA/PyBudWxsLFxuICAgICAgc2hvcnRfZGVzY3JpcHRpb246IGRldGFpbD8uc2hvcnREZXNjcmlwdGlvbiA/PyBudWxsLFxuICAgICAgcHVibGlzaGVyOiBkZXRhaWw/LnB1Ymxpc2hlciA/PyBudWxsLFxuICAgICAgZGV2ZWxvcGVyOiBkZXRhaWw/LmRldmVsb3BlciA/PyBudWxsLFxuICAgICAgcmVsZWFzZV9kYXRlOiBkZXRhaWw/LnJlbGVhc2VEYXRlID8/IG51bGwsXG4gICAgICBnZW5yZXM6IGRldGFpbD8uZ2VucmVzID8/IFtdLFxuICAgICAgYWdlX3JhdGluZzogZGV0YWlsPy5hZ2VSYXRpbmcgPz8gbnVsbCxcbiAgICAgIGNvbnRlbnRfZGVzY3JpcHRvcnM6IGRldGFpbD8uY29udGVudERlc2NyaXB0b3JzID8/IFtdLFxuICAgICAgaW50ZXJhY3RpdmVfZWxlbWVudHM6IGRldGFpbD8uaW50ZXJhY3RpdmVFbGVtZW50cyA/PyBbXSxcbiAgICAgIHBsYXllcl9jb3VudDogZGV0YWlsPy5wbGF5ZXJDb3VudCA/PyBudWxsLFxuICAgICAgb25saW5lX3BsYXllcl9jb3VudDogZGV0YWlsPy5vbmxpbmVQbGF5ZXJDb3VudCA/PyBudWxsLFxuICAgICAgcHNfcGx1c19yZXF1aXJlZDogZGV0YWlsPy5wc1BsdXNSZXF1aXJlZCA/PyBmYWxzZSxcbiAgICAgIGluX2dhbWVfcHVyY2hhc2VzOiBkZXRhaWw/LmluR2FtZVB1cmNoYXNlcyA/PyBudWxsLFxuICAgICAgZ2FtZV9mZWF0dXJlczogZGV0YWlsPy5nYW1lRmVhdHVyZXMgPz8gW10sXG4gICAgICBwc192ZXJzaW9uOiBkZXRhaWw/LnBzVmVyc2lvbiA/PyBudWxsLFxuICAgICAgZmlsZV9zaXplOiBkZXRhaWw/LmZpbGVTaXplID8/IG51bGwsXG4gICAgICB2b2ljZV9sYW5ndWFnZXM6IGRldGFpbD8udm9pY2VMYW5ndWFnZXMgPz8gW10sXG4gICAgICBzdWJ0aXRsZV9sYW5ndWFnZXM6IGRldGFpbD8uc3VidGl0bGVMYW5ndWFnZXMgPz8gW10sXG5cbiAgICAgIC8vIE1lZGlhXG4gICAgICBwb3J0cmFpdF91cmw6IGcuaW1hZ2VVcmwsXG4gICAgICBjb3Zlcl91cmw6IGRldGFpbD8ubWVkaWE/LmNvdmVyVXJsID8/IG51bGwsXG4gICAgICBoZXJvX3VybDogZGV0YWlsPy5tZWRpYT8uaGVyb1VybCA/PyBudWxsLFxuICAgICAgc2NyZWVuc2hvdHM6IGRldGFpbD8ubWVkaWE/LnNjcmVlbnNob3RzID8/IFtdLFxuICAgICAgY2Fyb3VzZWxfaW1hZ2VzOiBkZXRhaWw/LmNhcm91c2VsSW1hZ2VzID8/IFtdLFxuICAgICAgdmlkZW9zOiBkZXRhaWw/Lm1lZGlhPy52aWRlb3MgPz8gW10sXG5cbiAgICAgIC8vIENvbXBldGl0aW9uXG4gICAgICBtYXJrZXRfbWluX2NscDogbWF0Y2hlcy5sZW5ndGggPyBNYXRoLm1pbiguLi5tYXRjaGVzLm1hcCgobSkgPT4gbS5wcmljZUNscCkpIDogbnVsbCxcbiAgICAgIG1hcmtldF9jb3VudDogbWF0Y2hlcy5sZW5ndGgsXG5cbiAgICAgIC8vIFN0YXR1c1xuICAgICAgc2VsZWN0ZWQ6IGcuc2VsZWN0ZWQsXG4gICAgICBwdWJsaXNoZWQ6IGcucHVibGlzaGVkLFxuICAgICAgbm90ZXM6IGcubm90ZXMsXG4gICAgICBhY3RpdmU6IGcuYWN0aXZlLFxuICAgICAgZmlyc3Rfc2Vlbl9hdDogZy5maXJzdFNlZW5BdCxcbiAgICAgIGxhc3Rfc2Vlbl9hdDogZy5sYXN0U2VlbkF0LFxuICAgIH07XG4gIH0pO1xuXG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGdhbWVzOiByb3dzLCBleHBvcnRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCBjb3VudDogcm93cy5sZW5ndGggfSk7XG59KTtcblxuLy8gR0VUIC9nYW1lcy9leHBvcnQtc3VwYWJhc2UgXHUyMDE0IGV4cG9ydCBzZWxlY3RlZCBnYW1lcyBmb3JtYXR0ZWQgZm9yIHRoZSBTdXBhYmFzZSBwcm9kdWN0cyB0YWJsZVxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvZXhwb3J0LXN1cGFiYXNlXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IG9ubHlTZWxlY3RlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9zZWxlY3RlZFwiKSAhPT0gXCJmYWxzZVwiO1xuICBjb25zdCBwbGF0Zm9ybUZpbHRlciA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwicGxhdGZvcm1cIikgfHwgXCJcIjtcblxuICBsZXQgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgaWYgKG9ubHlTZWxlY3RlZCkgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IGcuc2VsZWN0ZWQpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnBsYXRmb3JtID09PSBwbGF0Zm9ybUZpbHRlcik7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3Qgcm93cyA9IGdhbWVzLm1hcCgoZykgPT4ge1xuICAgIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmcsIGcuY3VycmVuY3kgfHwgXCJVU0RcIik7XG4gICAgY29uc3QgZGV0YWlsID0gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKTtcblxuICAgIGNvbnN0IHNsdWcgPSBnLm5hbWVcbiAgICAgIC50b1VwcGVyQ2FzZSgpXG4gICAgICAucmVwbGFjZSgvW15BLVowLTlcXHNdL2csIFwiXCIpXG4gICAgICAudHJpbSgpXG4gICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgLnNsaWNlKDAsIDQpXG4gICAgICAuam9pbihcIi1cIik7XG4gICAgY29uc3Qgc2t1ID0gYFBTLSR7c2x1Z30tMDAxYDtcblxuICAgIGNvbnN0IGh3UGxhdGZvcm1zID0gKGcucGxhdGZvcm1zIHx8IFwiXCIpXG4gICAgICAuc3BsaXQoXCIsXCIpXG4gICAgICAubWFwKChwKSA9PiBwLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgY29uc3QgcGxhdGZvcm1BdmFpbGFiaWxpdHk6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG4gICAgZm9yIChjb25zdCBwIG9mIGh3UGxhdGZvcm1zKSBwbGF0Zm9ybUF2YWlsYWJpbGl0eVtwXSA9IHRydWU7XG5cbiAgICBjb25zdCBpbWFnZXM6IEFycmF5PHsgYWx0OiBzdHJpbmc7IHVybDogc3RyaW5nIH0+ID0gW107XG4gICAgaWYgKGcuaW1hZ2VVcmwpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogZy5pbWFnZVVybCB9KTtcbiAgICBpZiAoZGV0YWlsPy5tZWRpYT8uaGVyb1VybCAmJiAhaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBkZXRhaWwubWVkaWEuaGVyb1VybCkpIHtcbiAgICAgIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogZGV0YWlsLm1lZGlhLmhlcm9VcmwgfSk7XG4gICAgfVxuICAgIGlmIChkZXRhaWw/LmNhcm91c2VsSW1hZ2VzKSB7XG4gICAgICBmb3IgKGNvbnN0IGltZyBvZiBkZXRhaWwuY2Fyb3VzZWxJbWFnZXMpIHtcbiAgICAgICAgaWYgKCFpbWFnZXMuc29tZSgoeCkgPT4geC51cmwgPT09IGltZykpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogaW1nIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZGV0YWlsPy5tZWRpYT8uc2NyZWVuc2hvdHMpIHtcbiAgICAgIGZvciAoY29uc3QgaW1nIG9mIGRldGFpbC5tZWRpYS5zY3JlZW5zaG90cykge1xuICAgICAgICBpZiAoIWltYWdlcy5zb21lKCh4KSA9PiB4LnVybCA9PT0gaW1nKSkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBpbWcgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcHJpbWFyaWEgPSBzYWxlPy5wcmltYXJpYSA/PyBudWxsO1xuICAgIGNvbnN0IHNlY3VuZGFyaWEgPSBzYWxlPy5zZWN1bmRhcmlhID8/IG51bGw7XG4gICAgY29uc3QgcHJpY2luZzogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgbnVtYmVyIHwgbnVsbD4+ID0ge307XG4gICAgZm9yIChjb25zdCBwIG9mIGh3UGxhdGZvcm1zLmxlbmd0aCA/IGh3UGxhdGZvcm1zIDogW1wiUFM0XCJdKSB7XG4gICAgICBwcmljaW5nW3BdID0geyBQcmltYXJpYTogcHJpbWFyaWEsIFNlY3VuZGFyaWE6IHNlY3VuZGFyaWEgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2t1LFxuICAgICAgZGlzcGxheV9uYW1lOiBnLm5hbWUsXG4gICAgICBpbWFnZXMsXG4gICAgICBwbGF0Zm9ybV9hdmFpbGFiaWxpdHk6IHBsYXRmb3JtQXZhaWxhYmlsaXR5LFxuICAgICAgcHJpY2luZ19ieV9wbGF0Zm9ybV9hbmRfYWNjb3VudDogcHJpY2luZyxcbiAgICAgIHN0b2NrX3F1YW50aXR5OiAwLFxuICAgICAgaXNfYWN0aXZlOiB0cnVlLFxuICAgICAgc29ydF9vcmRlcjogMCxcbiAgICB9O1xuICB9KTtcblxuICBzZW5kSnNvbihyZXMsIDIwMCwgeyByb3dzLCBleHBvcnRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCBjb3VudDogcm93cy5sZW5ndGggfSk7XG59KTtcblxuLy8gUE9TVCAvZ2FtZXMvcHVibGlzaC1zdXBhYmFzZSBcdTIwMTQgdXBzZXJ0IHNlbGVjdGVkIGdhbWVzIGRpcmVjdGx5IHRvIFN1cGFiYXNlXG5yb3V0ZShcIlBPU1RcIiwgXCIvZ2FtZXMvcHVibGlzaC1zdXBhYmFzZVwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3Qgc3VwYWJhc2VDZmcgPSBzdG9yZS5nZXRTdXBhYmFzZSgpO1xuICBpZiAoIXN1cGFiYXNlQ2ZnPy51cmwgfHwgIXN1cGFiYXNlQ2ZnPy5zZXJ2aWNlS2V5KSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7XG4gICAgICBlcnJvcjogXCJzdXBhYmFzZV9ub3RfY29uZmlndXJlZFwiLFxuICAgICAgbWVzc2FnZTogXCJDb25maWd1cmEgU3VwYWJhc2UgVVJMIHkgU2VydmljZSBLZXkgZW4gQWp1c3RlcyBhbnRlcyBkZSBwdWJsaWNhci5cIixcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgeyBpZHM/OiBzdHJpbmdbXSB9O1xuICBsZXQgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlICYmIGcuc2VsZWN0ZWQpO1xuICBpZiAoYm9keS5pZHM/Lmxlbmd0aCkge1xuICAgIGNvbnN0IGlkU2V0ID0gbmV3IFNldChib2R5Lmlkcyk7XG4gICAgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IGlkU2V0LmhhcyhnYW1lRGJLZXkoZykpKTtcbiAgfVxuXG4gIGlmIChnYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwibm9fZ2FtZXNcIiwgbWVzc2FnZTogXCJObyBoYXkganVlZ29zIHNlbGVjY2lvbmFkb3MgcGFyYSBwdWJsaWNhci5cIiB9KTtcbiAgfVxuXG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG4gIGNvbnN0IHRhYmxlTmFtZSA9IHN1cGFiYXNlQ2ZnLnRhYmxlTmFtZSB8fCBcInBsYXlzdGF0aW9uX2dhbWVzXCI7XG5cbiAgLy8gQXV0by1mZXRjaCBwcm9kdWN0IGRldGFpbHMgZm9yIFBTTiBnYW1lcyBtaXNzaW5nIGNhY2hlZCBkZXRhaWxcbiAgY29uc3QgcHNuQ2ZnID0gc3RvcmUuZ2V0UHNuKCk7XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgIGlmIChnLnBsYXRmb3JtID09PSBcInBzblwiICYmICFzdG9yZS5nZXRQcm9kdWN0RGV0YWlsKGcuaWQpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkID0gYXdhaXQgZmV0Y2hQcm9kdWN0RGV0YWlsKGcuaWQsIGcuc3RvcmVVcmwgfHwgXCJcIiwgcHNuQ2ZnLnJlZ2lvbik7XG4gICAgICAgIHNhdmVEZXRhaWxBbmRVcGRhdGVJbWFnZShnLCBkKTtcbiAgICAgIH0gY2F0Y2ggeyAvKiBwdWJsaXNoIHdpbGwgdXNlIGcuaW1hZ2VVcmwgYXMgZmFsbGJhY2sgKi8gfVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMzAwKSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgcm93cyA9IGdhbWVzLm1hcCgoZykgPT4ge1xuICAgIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmcsIGcuY3VycmVuY3kgfHwgXCJVU0RcIik7XG4gICAgY29uc3QgZGV0YWlsID0gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKTtcblxuICAgIGNvbnN0IGh3UGxhdGZvcm1zID0gKGcucGxhdGZvcm1zIHx8IFwiXCIpXG4gICAgICAuc3BsaXQoXCIsXCIpXG4gICAgICAubWFwKChwKSA9PiBwLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgY29uc3QgcGxhdGZvcm1BdmFpbGFiaWxpdHk6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG4gICAgZm9yIChjb25zdCBwIG9mIGh3UGxhdGZvcm1zKSBwbGF0Zm9ybUF2YWlsYWJpbGl0eVtwXSA9IHRydWU7XG5cbiAgICAvLyBpbWFnZXNbMF0gPSBjb3ZlciBhcnQgZnJvbSB0aGUgZ3JpZCB0aWxlICg0NDBcdTAwRDc0NDApLCBuZXZlciB0aGUgYmFubmVyLlxuICAgIGNvbnN0IGltYWdlczogQXJyYXk8eyBhbHQ6IHN0cmluZzsgdXJsOiBzdHJpbmcgfT4gPSBbXTtcbiAgICBpZiAoZy5pbWFnZVVybCkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBnLmltYWdlVXJsIH0pO1xuICAgIGlmIChkZXRhaWw/Lm1lZGlhPy5oZXJvVXJsICYmICFpbWFnZXMuc29tZSgoeCkgPT4geC51cmwgPT09IGRldGFpbC5tZWRpYS5oZXJvVXJsKSkge1xuICAgICAgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBkZXRhaWwubWVkaWEuaGVyb1VybCB9KTtcbiAgICB9XG4gICAgaWYgKGRldGFpbD8uY2Fyb3VzZWxJbWFnZXMpIHtcbiAgICAgIGZvciAoY29uc3QgaW1nIG9mIGRldGFpbC5jYXJvdXNlbEltYWdlcykge1xuICAgICAgICBpZiAoIWltYWdlcy5zb21lKCh4KSA9PiB4LnVybCA9PT0gaW1nKSkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBpbWcgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcHJpbWFyaWEgPSBzYWxlPy5wcmltYXJpYSA/PyBudWxsO1xuICAgIGNvbnN0IHNlY3VuZGFyaWEgPSBzYWxlPy5zZWN1bmRhcmlhID8/IG51bGw7XG4gICAgY29uc3QgcHJpY2luZzogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgbnVtYmVyIHwgbnVsbD4+ID0ge307XG4gICAgZm9yIChjb25zdCBwIG9mIGh3UGxhdGZvcm1zLmxlbmd0aCA/IGh3UGxhdGZvcm1zIDogW1wiUFM0XCJdKSB7XG4gICAgICBwcmljaW5nW3BdID0geyBQcmltYXJpYTogcHJpbWFyaWEsIFNlY3VuZGFyaWE6IHNlY3VuZGFyaWEgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2t1OiBnZW5lcmF0ZVNrdShnLm5hbWUpLFxuICAgICAgZGlzcGxheV9uYW1lOiBnLm5hbWUsXG4gICAgICBpbWFnZXMsXG4gICAgICBwbGF0Zm9ybV9hdmFpbGFiaWxpdHk6IHBsYXRmb3JtQXZhaWxhYmlsaXR5LFxuICAgICAgcHJpY2luZ19ieV9wbGF0Zm9ybV9hbmRfYWNjb3VudDogcHJpY2luZyxcbiAgICAgIHN0b2NrX3F1YW50aXR5OiAwLFxuICAgICAgaXNfYWN0aXZlOiB0cnVlLFxuICAgICAgc29ydF9vcmRlcjogMCxcbiAgICB9O1xuICB9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IGVuZHBvaW50ID0gYCR7c3VwYWJhc2VDZmcudXJsfS9yZXN0L3YxLyR7dGFibGVOYW1lfT9vbl9jb25mbGljdD1za3VgO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZW5kcG9pbnQsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIGFwaWtleTogc3VwYWJhc2VDZmcuc2VydmljZUtleSxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3N1cGFiYXNlQ2ZnLnNlcnZpY2VLZXl9YCxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgIFByZWZlcjogXCJyZXNvbHV0aW9uPW1lcmdlLWR1cGxpY2F0ZXNcIixcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyb3dzKSxcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDIsIHtcbiAgICAgICAgZXJyb3I6IFwic3VwYWJhc2VfZXJyb3JcIixcbiAgICAgICAgbWVzc2FnZTogYFN1cGFiYXNlIHJlc3BvbmRpXHUwMEYzICR7cmVzcG9uc2Uuc3RhdHVzfTogJHt0ZXh0LnNsaWNlKDAsIDMwMCl9YCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE1hcmsgZ2FtZXMgYXMgcHVibGlzaGVkIGxvY2FsbHlcbiAgICBmb3IgKGNvbnN0IGcgb2YgZ2FtZXMpIHtcbiAgICAgIHN0b3JlLnBhdGNoR2FtZShnYW1lRGJLZXkoZyksIHsgcHVibGlzaGVkOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIHNlbmRKc29uKHJlcywgMjAwLCB7IHB1Ymxpc2hlZDogcm93cy5sZW5ndGgsIHNrdXM6IHJvd3MubWFwKChyKSA9PiByLnNrdSkgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICBlcnJvcjogXCJzdXBhYmFzZV9uZXR3b3JrX2Vycm9yXCIsXG4gICAgICBtZXNzYWdlOiBgRXJyb3IgZGUgY29uZXhpXHUwMEYzbjogJHsoZXJyIGFzIEVycm9yKS5tZXNzYWdlfWAsXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vLyBQT1NUIC9nYW1lcy9lbnJpY2ggXHUyMDE0IGJ1bGstZmV0Y2ggcHJvZHVjdCBkZXRhaWxzIGZvciBzZWxlY3RlZCBnYW1lcyB0aGF0IGRvbid0IGhhdmUgdGhlbSB5ZXRcbi8vIEJvZHk6IHsgcGxhdGZvcm0/OiBzdHJpbmcsIGxpbWl0PzogbnVtYmVyIH1cbnJvdXRlKFwiUE9TVFwiLCBcIi9nYW1lcy9lbnJpY2hcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgeyBwbGF0Zm9ybT86IHN0cmluZzsgbGltaXQ/OiBudW1iZXIgfTtcbiAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihib2R5LmxpbWl0ID8/IDIwLCA1MCk7XG4gIGNvbnN0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiB7XG4gICAgaWYgKCFnLmFjdGl2ZSB8fCAhZy5zZWxlY3RlZCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChib2R5LnBsYXRmb3JtICYmIGcucGxhdGZvcm0gIT09IGJvZHkucGxhdGZvcm0pIHJldHVybiBmYWxzZTtcbiAgICBpZiAoc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBnLnBsYXRmb3JtID09PSBcInBzblwiO1xuICB9KS5zbGljZSgwLCBsaW1pdCk7XG5cbiAgY29uc3QgcmVzdWx0czogQXJyYXk8eyBpZDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IG9rOiBib29sZWFuOyBlcnJvcj86IHN0cmluZyB9PiA9IFtdO1xuICBmb3IgKGNvbnN0IGcgb2YgZ2FtZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0UHNuKCk7XG4gICAgICBjb25zdCBkZXRhaWwgPSBhd2FpdCBmZXRjaFByb2R1Y3REZXRhaWwoZy5pZCwgZy5zdG9yZVVybCB8fCBcIlwiLCBjZmcucmVnaW9uKTtcbiAgICAgIHNhdmVEZXRhaWxBbmRVcGRhdGVJbWFnZShnLCBkZXRhaWwpO1xuICAgICAgcmVzdWx0cy5wdXNoKHsgaWQ6IGcuaWQsIG5hbWU6IGcubmFtZSwgb2s6IHRydWUgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVzdWx0cy5wdXNoKHsgaWQ6IGcuaWQsIG5hbWU6IGcubmFtZSwgb2s6IGZhbHNlLCBlcnJvcjogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gICAgfVxuICAgIC8vIFJhdGUtbGltaXQgdG8gYXZvaWQgaGFtbWVyaW5nIFBTTlxuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDApKTtcbiAgfVxuXG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGVucmljaGVkOiByZXN1bHRzLmZpbHRlcigocikgPT4gci5vaykubGVuZ3RoLCB0b3RhbDogcmVzdWx0cy5sZW5ndGgsIHJlc3VsdHMgfSk7XG59KTtcblxuLy8gR0VUIC9zZXR0aW5nc1xucm91dGUoXCJHRVRcIiwgXCIvc2V0dGluZ3NcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIHByaWNpbmc6IHN0b3JlLmdldFNldHRpbmdzKCksXG4gICAgcHNuOiBzdG9yZS5nZXRQc24oKSxcbiAgICBzb3VyY2VzOiBzdG9yZS5nZXRTb3VyY2VzKCksXG4gICAgc3VwYWJhc2U6IHN0b3JlLmdldFN1cGFiYXNlKCksXG4gICAgaGl0UHVibGlzaGVyczogc3RvcmUuZ2V0SGl0UHVibGlzaGVycygpLFxuICB9KTtcbn0pO1xuXG4vLyBQVVQgL3NldHRpbmdzXG5yb3V0ZShcIlBVVFwiLCBcIi9zZXR0aW5nc1wiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7XG4gICAgcHJpY2luZz86IFBhcnRpYWw8UmV0dXJuVHlwZTx0eXBlb2Ygc3RvcmUuZ2V0U2V0dGluZ3M+PjtcbiAgICBwc24/OiBQYXJ0aWFsPFJldHVyblR5cGU8dHlwZW9mIHN0b3JlLmdldFBzbj4+O1xuICAgIHNvdXJjZXM/OiBQcm92aWRlclNvdXJjZVtdO1xuICAgIHN1cGFiYXNlPzogU3VwYWJhc2VDb25maWcgfCBudWxsO1xuICAgIGhpdFB1Ymxpc2hlcnM/OiBzdHJpbmdbXTtcbiAgfTtcbiAgY29uc3QgcHJpY2luZyA9IGJvZHkucHJpY2luZyA/IHN0b3JlLnVwZGF0ZVNldHRpbmdzKGJvZHkucHJpY2luZykgOiBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBjb25zdCBwc24gPSBib2R5LnBzbiA/IHN0b3JlLnVwZGF0ZVBzbihib2R5LnBzbikgOiBzdG9yZS5nZXRQc24oKTtcbiAgaWYgKGJvZHkuc291cmNlcykgc3RvcmUuc2V0U291cmNlcyhib2R5LnNvdXJjZXMpO1xuICBpZiAoYm9keS5zdXBhYmFzZSAhPT0gdW5kZWZpbmVkKSBzdG9yZS5zZXRTdXBhYmFzZShib2R5LnN1cGFiYXNlKTtcbiAgaWYgKGJvZHkuaGl0UHVibGlzaGVycykgc3RvcmUuc2V0SGl0UHVibGlzaGVycyhib2R5LmhpdFB1Ymxpc2hlcnMpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIHByaWNpbmcsXG4gICAgcHNuLFxuICAgIHNvdXJjZXM6IHN0b3JlLmdldFNvdXJjZXMoKSxcbiAgICBzdXBhYmFzZTogc3RvcmUuZ2V0U3VwYWJhc2UoKSxcbiAgICBoaXRQdWJsaXNoZXJzOiBzdG9yZS5nZXRIaXRQdWJsaXNoZXJzKCksXG4gIH0pO1xufSk7XG5cbi8vIEdFVCAvcGxhdGZvcm1zIFx1MjAxNCBzdGF0aWMgbWV0YWRhdGEgYWJvdXQgYXZhaWxhYmxlIHBsYXRmb3JtcyArIHJlZ2lvbnNcbnJvdXRlKFwiR0VUXCIsIFwiL3BsYXRmb3Jtc1wiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGxhYmVsczogUExBVEZPUk1fTEFCRUxTLCByZWdpb25zOiBQTEFURk9STV9SRUdJT05TIH0pO1xufSk7XG5cbi8vIFBPU1QgL21vY2svY2xlYXIgXHUyMDE0IHJlbW92ZSBhbGwgZ2FtZXNcbnJvdXRlKFwiUE9TVFwiLCBcIi9tb2NrL2NsZWFyXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgc3RvcmUudXBzZXJ0R2FtZSh7IC4uLmcsIGFjdGl2ZTogZmFsc2UgfSk7XG4gIH1cbiAgLy8gQWxzbyB3aXBlIGVudHJpZXMgZnVsbHkgYnkgcmUtd3JpdGluZyB0aGUgZmlsZTpcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSBzdG9yZS5wYXRjaEdhbWUoZy5pZCwgeyBhY3RpdmU6IGZhbHNlIH0pO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBjbGVhcmVkOiBnYW1lcy5sZW5ndGggfSk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gcnVuUmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc291cmNlcyA9IHN0b3JlLmdldFNvdXJjZXMoKS5maWx0ZXIoKHMpID0+IHMuZW5hYmxlZCk7XG4gIGNvbnN0IG5vd0lzbyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm92aWRlciA9IGdldFByb3ZpZGVyKHNvdXJjZS5wbGF0Zm9ybSk7XG4gICAgICBjb25zdCBzZWVuS2V5cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgY29uc3QgZWZmU291cmNlID0geyAuLi5zb3VyY2UgfTtcbiAgICAgIGlmIChzb3VyY2UucGxhdGZvcm0gPT09IFwicHNuXCIgJiYgIXNvdXJjZS5jYXRlZ29yeUlkKSB7XG4gICAgICAgIGVmZlNvdXJjZS5jYXRlZ29yeUlkID0gc3RvcmUuZ2V0UHNuKCkuZGVhbHNDYXRlZ29yeUlkO1xuICAgICAgfVxuICAgICAgZm9yIGF3YWl0IChjb25zdCBkZWFsIG9mIHByb3ZpZGVyLmZldGNoRGVhbHMoZWZmU291cmNlKSkge1xuICAgICAgICBjb25zdCBkYktleSA9IGAke3NvdXJjZS5wbGF0Zm9ybX06JHtzb3VyY2UucmVnaW9ufToke2RlYWwuaWR9YDtcbiAgICAgICAgc2VlbktleXMuYWRkKGRiS2V5KTtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5nZXRHYW1lQnlDb21wb3NpdGUoc291cmNlLnBsYXRmb3JtLCBzb3VyY2UucmVnaW9uLCBkZWFsLmlkKTtcbiAgICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICAgIHN0b3JlLnVwc2VydEdhbWUoe1xuICAgICAgICAgICAgaWQ6IGRlYWwuaWQsIHBsYXRmb3JtOiBzb3VyY2UucGxhdGZvcm0sIHJlZ2lvbjogc291cmNlLnJlZ2lvbixcbiAgICAgICAgICAgIG5hbWU6IGRlYWwubmFtZSwgaW1hZ2VVcmw6IGRlYWwuaW1hZ2VVcmwsIHN0b3JlVXJsOiBkZWFsLnN0b3JlVXJsLFxuICAgICAgICAgICAgcGxhdGZvcm1zOiBkZWFsLmhhcmR3YXJlUGxhdGZvcm1zLCBjdXJyZW5jeTogZGVhbC5jdXJyZW5jeSxcbiAgICAgICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMsIHByaWNlRGlzY291bnRlZENlbnRzOiBkZWFsLnByaWNlRGlzY291bnRlZENlbnRzLFxuICAgICAgICAgICAgZGlzY291bnRQZXJjZW50OiBkZWFsLmRpc2NvdW50UGVyY2VudCwgZGlzY291bnRFbmRBdDogZGVhbC5kaXNjb3VudEVuZEF0LFxuICAgICAgICAgICAgc2VsZWN0ZWQ6IGZhbHNlLCBwdWJsaXNoZWQ6IGZhbHNlLCBub3RlczogXCJcIiwgeW91dHViZVVybDogXCJcIiwgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgZmlyc3RTZWVuQXQ6IG5vd0lzbywgbGFzdFNlZW5BdDogbm93SXNvLCB1cGRhdGVkQXQ6IG5vd0lzbyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9yZS51cHNlcnRHYW1lKHtcbiAgICAgICAgICAgIC4uLmV4aXN0aW5nLCBuYW1lOiBkZWFsLm5hbWUgfHwgZXhpc3RpbmcubmFtZSwgaW1hZ2VVcmw6IGRlYWwuaW1hZ2VVcmwgfHwgZXhpc3RpbmcuaW1hZ2VVcmwsXG4gICAgICAgICAgICBzdG9yZVVybDogZGVhbC5zdG9yZVVybCB8fCBleGlzdGluZy5zdG9yZVVybCwgcGxhdGZvcm1zOiBkZWFsLmhhcmR3YXJlUGxhdGZvcm1zLFxuICAgICAgICAgICAgY3VycmVuY3k6IGRlYWwuY3VycmVuY3ksIHByaWNlT3JpZ2luYWxDZW50czogZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMsXG4gICAgICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cywgZGlzY291bnRQZXJjZW50OiBkZWFsLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IGRlYWwuZGlzY291bnRFbmRBdCwgYWN0aXZlOiB0cnVlLCBsYXN0U2VlbkF0OiBub3dJc28sIHVwZGF0ZWRBdDogbm93SXNvLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdG9yZS5tYXJrSW5hY3RpdmVJZk1pc3Npbmcoc2VlbktleXMsIHNvdXJjZS5wbGF0Zm9ybSwgc291cmNlLnJlZ2lvbik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW3NjaGVkdWxlcl1bJHtzb3VyY2UucGxhdGZvcm19LyR7c291cmNlLnJlZ2lvbn1dICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG4gIHJlY29tcHV0ZU1hdGNoZXMoKTtcbn1cblxuZnVuY3Rpb24gcmVjb21wdXRlTWF0Y2hlcygpOiB2b2lkIHtcbiAgY29uc3QgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgY29uc3QgcHJvZHVjdHMgPSBzdG9yZS5nZXRBbGxDb21wZXRpdG9yUHJvZHVjdHMoKTtcbiAgY29uc3QgbWF0Y2hlcyA9IG1hdGNoR2FtZXMoZ2FtZXMsIHByb2R1Y3RzKTtcbiAgc3RvcmUuc2V0Q29tcGV0aXRvck1hdGNoZXMobWF0Y2hlcyk7XG59XG5cbi8vIEdFVCAvY29tcGV0aXRvcnMgXHUyMDE0IGxpc3Qgc3RvcmVzICsgbGFzdCByZWZyZXNoICsgbWF0Y2ggc3RhdHNcbnJvdXRlKFwiR0VUXCIsIFwiL2NvbXBldGl0b3JzXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgY29tcGV0aXRvcnMgPSBzdG9yZS5nZXRDb21wZXRpdG9ycygpO1xuICBjb25zdCByZWZyZXNoZWRBdCA9IHN0b3JlLmdldENvbXBldGl0b3JSZWZyZXNoZWRBdCgpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIGNvbXBldGl0b3JzOiBjb21wZXRpdG9ycy5tYXAoKGMpID0+ICh7XG4gICAgICAuLi5jLFxuICAgICAgcmVmcmVzaGVkQXQ6IHJlZnJlc2hlZEF0W2Mua2V5XSA/PyBudWxsLFxuICAgICAgcHJvZHVjdENvdW50OiBzdG9yZVxuICAgICAgICAuZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGZhbHNlKVxuICAgICAgICAuZmlsdGVyKChwKSA9PiBwLnN0b3JlS2V5ID09PSBjLmtleSkubGVuZ3RoLFxuICAgIH0pKSxcbiAgfSk7XG59KTtcblxuLy8gUFVUIC9jb21wZXRpdG9ycyBcdTIwMTQgcmVwbGFjZSB0aGUgZnVsbCBsaXN0ICh1c2VkIGZyb20gQWp1c3RlcylcbnJvdXRlKFwiUFVUXCIsIFwiL2NvbXBldGl0b3JzXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgY29tcGV0aXRvcnM/OiBDb21wZXRpdG9yQ29uZmlnW10gfTtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGJvZHkuY29tcGV0aXRvcnMpKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcImJhZF9yZXF1ZXN0XCIsIG1lc3NhZ2U6IFwiY29tcGV0aXRvcnNbXSByZXF1aXJlZFwiIH0pO1xuICB9XG4gIGNvbnN0IGNsZWFuOiBDb21wZXRpdG9yQ29uZmlnW10gPSBib2R5LmNvbXBldGl0b3JzXG4gICAgLmZpbHRlcigoYykgPT4gYyAmJiB0eXBlb2YgYy5rZXkgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGMuZG9tYWluID09PSBcInN0cmluZ1wiKVxuICAgIC5tYXAoKGMpID0+ICh7XG4gICAgICBrZXk6IGMua2V5LnRyaW0oKSxcbiAgICAgIGxhYmVsOiAoYy5sYWJlbCB8fCBjLmtleSkudHJpbSgpLFxuICAgICAgZG9tYWluOiBjLmRvbWFpbi5yZXBsYWNlKC9eaHR0cHM/OlxcL1xcLy8sIFwiXCIpLnJlcGxhY2UoL1xcLy4qJC8sIFwiXCIpLnRyaW0oKSxcbiAgICAgIHR5cGU6IChbXCJzaG9waWZ5XCIsIFwid29vY29tbWVyY2VcIiwgXCJodG1sXCIsIFwianVtcHNlbGxlclwiLCBcImF1dG9cIl0uaW5jbHVkZXMoYy50eXBlKSA/IGMudHlwZSA6IFwiYXV0b1wiKSxcbiAgICAgIGVuYWJsZWQ6IGMuZW5hYmxlZCAhPT0gZmFsc2UsXG4gICAgfSkpO1xuICBzdG9yZS5zZXRDb21wZXRpdG9ycyhjbGVhbik7XG4gIHJlY29tcHV0ZU1hdGNoZXMoKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgY29tcGV0aXRvcnM6IHN0b3JlLmdldENvbXBldGl0b3JzKCkgfSk7XG59KTtcblxuLy8gUE9TVCAvY29tcGV0aXRvcnMvcmVmcmVzaCBcdTIwMTQgc2NyYXBlIGFsbCBlbmFibGVkIHN0b3JlcyBhbmQgcmVjb21wdXRlIG1hdGNoZXNcbnJvdXRlKFwiUE9TVFwiLCBcIi9jb21wZXRpdG9ycy9yZWZyZXNoXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgY29tcGV0aXRvcnMgPSBzdG9yZS5nZXRDb21wZXRpdG9ycygpLmZpbHRlcigoYykgPT4gYy5lbmFibGVkKTtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCByZXN1bHRzOiBBcnJheTx7IGtleTogc3RyaW5nOyBsYWJlbDogc3RyaW5nOyBjb3VudDogbnVtYmVyOyBlcnJvcj86IHN0cmluZyB9PiA9IFtdO1xuXG4gIGF3YWl0IFByb21pc2UuYWxsKFxuICAgIGNvbXBldGl0b3JzLm1hcChhc3luYyAoYykgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBmZXRjaENvbXBldGl0b3IoYyk7XG4gICAgICAgIHN0b3JlLnNldENvbXBldGl0b3JQcm9kdWN0cyhjLmtleSwgcHJvZHVjdHMsIG5vdyk7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7IGtleTogYy5rZXksIGxhYmVsOiBjLmxhYmVsLCBjb3VudDogcHJvZHVjdHMubGVuZ3RoIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBtc2cgPVxuICAgICAgICAgIGUgaW5zdGFuY2VvZiBDb21wZXRpdG9yRmV0Y2hFcnJvclxuICAgICAgICAgICAgPyBlLm1lc3NhZ2VcbiAgICAgICAgICAgIDogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfHwgXCJlcnJvclwiO1xuICAgICAgICByZXN1bHRzLnB1c2goeyBrZXk6IGMua2V5LCBsYWJlbDogYy5sYWJlbCwgY291bnQ6IDAsIGVycm9yOiBtc2cgfSk7XG4gICAgICB9XG4gICAgfSlcbiAgKTtcblxuICByZWNvbXB1dGVNYXRjaGVzKCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IHJlZnJlc2hlZEF0OiBub3csIHJlc3VsdHMgfSk7XG59KTtcblxuLy8gR0VUIC9wcy1wbHVzIFx1MjAxNCBQUyBQbHVzIG1lbWJlcnNoaXAgcHJpY2VzIHZzIGNvbXBldGl0b3JzXG5yb3V0ZShcIkdFVFwiLCBcIi9wcy1wbHVzXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0U2V0dGluZ3MoKTtcbiAgY29uc3QgcHJvZHVjdHMgPSBzdG9yZS5nZXRBbGxDb21wZXRpdG9yUHJvZHVjdHMoKTtcbiAgY29uc3Qgc2NyYXBlZCA9IHN0b3JlLmdldFBzUGx1c1ByaWNlcygpIGFzIFNjcmFwZWRQbHVzUHJpY2VzIHwgbnVsbDtcbiAgY29uc3QgcGxhbnMgPSBtYXRjaFBsYW5zV2l0aENvbXBldGl0b3JzKHByb2R1Y3RzLCBjZmcsIHNjcmFwZWQpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBwbGFucywgc2NyYXBlZEF0OiBzY3JhcGVkPy5zY3JhcGVkQXQgPz8gbnVsbCB9KTtcbn0pO1xuXG4vLyBQT1NUIC9wcy1wbHVzL3JlZnJlc2ggXHUyMDE0IHNjcmFwZSBjdXJyZW50IFBTIFBsdXMgcHJpY2VzIGZyb20gcGxheXN0YXRpb24uY29tXG5yb3V0ZShcIlBPU1RcIiwgXCIvcHMtcGx1cy9yZWZyZXNoXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzY3JhcGVQc1BsdXNQcmljZXMoKTtcbiAgICBzdG9yZS5zZXRQc1BsdXNQcmljZXMocmVzdWx0KTtcbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgcmVzdWx0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcInNjcmFwZV9mYWlsZWRcIiwgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gIH1cbn0pO1xuXG4vLyBQT1NUIC9nYW1lcy9sb29rdXAgXHUyMDE0IGJ1bGsgZnV6enkgc2VhcmNoOiByZWNlaXZlcyBhIGxpc3Qgb2Yge25hbWUsIHByaWNlVXNkP31cbi8vIGl0ZW1zIChwYXJzZWQgZnJvbSBwYXN0ZWQgY29tcGV0aXRvciB0ZXh0KSBhbmQgbWF0Y2hlcyBlYWNoIGFnYWluc3QgdGhlIGdhbWUgREIuXG5yb3V0ZShcIlBPU1RcIiwgXCIvZ2FtZXMvbG9va3VwXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcbiAgY29uc3QgaXRlbXM6IEFycmF5PHsgbmFtZTogc3RyaW5nOyBwcmljZU1pbjogbnVtYmVyIHwgbnVsbDsgcHJpY2VNYXg6IG51bWJlciB8IG51bGwgfT4gPVxuICAgIGJvZHk/Lml0ZW1zO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaXRlbXMpIHx8ICFpdGVtcy5sZW5ndGgpIHtcbiAgICBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogXCJiYWRfcmVxdWVzdFwiLCBtZXNzYWdlOiBcIml0ZW1zW10gcmVxdWlyZWRcIiB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBjb25zdCBhbGxHYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBjb25zdCBnYW1lSW5kZXggPSBhbGxHYW1lcy5tYXAoKGcpID0+ICh7XG4gICAgZ2FtZTogZyxcbiAgICB0b2tlbnM6IHRva2VuaXplKGcubmFtZSksXG4gIH0pKTtcblxuICBjb25zdCBUSFJFU0hPTEQgPSAwLjQwO1xuICBjb25zdCByZXN1bHRzID0gaXRlbXMubWFwKChpdGVtKSA9PiB7XG4gICAgY29uc3QgcXVlcnlUb2tlbnMgPSB0b2tlbml6ZShpdGVtLm5hbWUpO1xuICAgIGxldCBiZXN0R2FtZTogR2FtZSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBiZXN0U2NvcmUgPSAwO1xuXG4gICAgZm9yIChjb25zdCB7IGdhbWUsIHRva2VucyB9IG9mIGdhbWVJbmRleCkge1xuICAgICAgaWYgKCF0b2tlbnMubGVuZ3RoKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHNjb3JlID0gc2ltaWxhcml0eShxdWVyeVRva2VucywgdG9rZW5zKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdEdhbWUgPSBnYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoZWQgPSBiZXN0U2NvcmUgPj0gVEhSRVNIT0xEICYmIGJlc3RHYW1lO1xuICAgIGNvbnN0IG91dCA9IG1hdGNoZWQgPyB0b0dhbWVPdXQoYmVzdEdhbWUhLCBjZmcpIDogbnVsbDtcblxuICAgIHJldHVybiB7XG4gICAgICBxdWVyeTogaXRlbS5uYW1lLFxuICAgICAgcHJpY2VNaW46IGl0ZW0ucHJpY2VNaW4sXG4gICAgICBwcmljZU1heDogaXRlbS5wcmljZU1heCxcbiAgICAgIG1hdGNoU2NvcmU6IE1hdGgucm91bmQoYmVzdFNjb3JlICogMTAwKSAvIDEwMCxcbiAgICAgIGZvdW5kOiAhIW1hdGNoZWQsXG4gICAgICBnYW1lOiBvdXQsXG4gICAgfTtcbiAgfSk7XG5cbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcmVzdWx0cyB9KTtcbn0pO1xuXG4vLyBHRVQgL2RlYnVnL3Byb2R1Y3QtdHlwZXMgXHUyMDE0IG9uZS1zaG90IHJlY29ubmFpc3NhbmNlIHVzZWQgdG8gZGVzaWduIHRoZVxuLy8gRExDL2FkZC1vbiBmaWx0ZXIuIFJ1bnMgYSBmdWxsIFBTTiBzY3JhcGUgYW5kIHJlcG9ydHMgZXZlcnkgY2xhc3NpZmljYXRpb25cbi8vICsgcHJvZHVjdFR5cGUgY29tYm8gaXQgc2VlcywgcGx1cyBhbGwgb2JzZXJ2ZWQgdG9wLWxldmVsIGtleXMuIFRoZSByZXNwb25zZVxuLy8gaXMgc21hbGwgKGEgY291cGxlIG9mIEtCKSwgdGhlIHNjcmFwZSBpdHNlbGYgaXMgdGhlIHNsb3cgcGFydC5cbnJvdXRlKFwiR0VUXCIsIFwiL2RlYnVnL3Byb2R1Y3QtdHlwZXNcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNmZyA9IHN0b3JlLmdldFBzbigpO1xuICAgIGNvbnN0IHJlcG9ydCA9IGF3YWl0IGluc3BlY3RQcm9kdWN0VHlwZXMoY2ZnKTtcbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgcmVwb3J0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJwc25fYXBpX2Vycm9yXCIsXG4gICAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcImludGVybmFsXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gR0VUIC9nYW1lcy86aWQvZGV0YWlsIFx1MjAxNCBjYWNoZWQgcHJvZHVjdCBkZXRhaWwgKGltYWdlcnksIGRlc2NyaXB0aW9uXHUyMDI2KS5cbi8vIFJldHVybnMgMjA0IE5vIENvbnRlbnQgaWYgd2UgaGF2ZW4ndCBmZXRjaGVkIGl0IHlldDsgdGhlIGNsaWVudCBzaG91bGRcbi8vIHRoZW4gUE9TVCAvZ2FtZXMvOmlkL2RldGFpbC9yZWZyZXNoIHRvIHRyaWdnZXIgdGhlIHNjcmFwZS5cbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzLzppZC9kZXRhaWxcIiwgYXN5bmMgKF9yZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGRldGFpbCA9IHN0b3JlLmdldFByb2R1Y3REZXRhaWwocGFyYW1zLmlkKTtcbiAgaWYgKCFkZXRhaWwpIHtcbiAgICByZXMuc3RhdHVzQ29kZSA9IDIwNDtcbiAgICByZXMuZW5kKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHNlbmRKc29uKHJlcywgMjAwLCBkZXRhaWwpO1xufSk7XG5cbi8vIFBPU1QgL2dhbWVzLzppZC9kZXRhaWwvcmVmcmVzaCBcdTIwMTQgc2NyYXBlIHRoZSBwcm9kdWN0IHBhZ2UgYW5kIGNhY2hlIGl0Llxucm91dGUoXCJQT1NUXCIsIFwiL2dhbWVzLzppZC9kZXRhaWwvcmVmcmVzaFwiLCBhc3luYyAoX3JlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3QgZ2FtZSA9IHN0b3JlLmdldEdhbWUocGFyYW1zLmlkKTtcbiAgaWYgKCFnYW1lKSByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwibm90X2ZvdW5kXCIgfSk7XG4gIHRyeSB7XG4gICAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0UHNuKCk7XG4gICAgY29uc3QgZGV0YWlsID0gYXdhaXQgZmV0Y2hQcm9kdWN0RGV0YWlsKFxuICAgICAgZ2FtZS5pZCxcbiAgICAgIGdhbWUuc3RvcmVVcmwgfHwgXCJcIixcbiAgICAgIGNmZy5yZWdpb25cbiAgICApO1xuICAgIHNhdmVEZXRhaWxBbmRVcGRhdGVJbWFnZShnYW1lLCBkZXRhaWwpO1xuICAgIHNlbmRKc29uKHJlcywgMjAwLCBkZXRhaWwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBQc25BcGlFcnJvcikge1xuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICAgIGVycm9yOiBcInBzbl9hcGlfZXJyb3JcIixcbiAgICAgICAgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiaW50ZXJuYWxcIiwgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gIH1cbn0pO1xuXG4vLyBHRVQgL3dhdGNobGlzdCBcdTIwMTQgdHJhY2tlZCBnYW1lcyArIGN1cnJlbnQgc3RhdHVzIHNuYXBzaG90Llxucm91dGUoXCJHRVRcIiwgXCIvd2F0Y2hsaXN0XCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgaXRlbXM6IHN0b3JlLmxpc3RXYXRjaGxpc3QoKSB9KTtcbn0pO1xuXG4vLyBQT1NUIC93YXRjaGxpc3QgXHUyMDE0IGFkZCBhIGdhbWUgYnkgVVJMIG9yIGlkLiBCb2R5OiB7IGlucHV0OiBzdHJpbmcsIG5vdGVzPyB9XG5yb3V0ZShcIlBPU1RcIiwgXCIvd2F0Y2hsaXN0XCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgaW5wdXQ/OiBzdHJpbmc7IG5vdGVzPzogc3RyaW5nIH07XG4gIGNvbnN0IGlkID0gZXh0cmFjdFBzbklkKGJvZHkuaW5wdXQgPz8gXCJcIik7XG4gIGlmICghaWQpIHtcbiAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHtcbiAgICAgIGVycm9yOiBcImJhZF9pbnB1dFwiLFxuICAgICAgbWVzc2FnZTogXCJQZWdcdTAwRTEgbGEgVVJMIGRlbCBwcm9kdWN0byBlbiBQU04gbyB1biBJRCB0aXBvIFVQWFhYWC1DVVNBWFhYWFhfMDAtXHUyMDI2XCIsXG4gICAgfSk7XG4gIH1cbiAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5nZXRXYXRjaGVkKGlkKTtcbiAgaWYgKGV4aXN0aW5nKSByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIGV4aXN0aW5nKTtcblxuICBjb25zdCBnYW1lID0gc3RvcmUuZ2V0R2FtZShpZCk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3QgZW50cnk6IFdhdGNoZWRHYW1lID0ge1xuICAgIGlkLFxuICAgIG5hbWU6IGdhbWU/Lm5hbWUgfHwgaWQsXG4gICAgYWRkZWRBdDogbm93LFxuICAgIGxhc3RTdGF0dXM6IGdhbWU/LmFjdGl2ZSAmJiBnYW1lLmRpc2NvdW50UGVyY2VudCA+IDAgPyBcIm9uX3NhbGVcIiA6IGdhbWUgPyBcIm9mZl9zYWxlXCIgOiBcInVuc2VlblwiLFxuICAgIGxhc3RTZWVuT25TYWxlQXQ6XG4gICAgICBnYW1lPy5hY3RpdmUgJiYgZ2FtZS5kaXNjb3VudFBlcmNlbnQgPiAwID8gbm93IDogbnVsbCxcbiAgICBsYXN0UHJpY2VDZW50czogZ2FtZT8ucHJpY2VEaXNjb3VudGVkQ2VudHMgPz8gbnVsbCxcbiAgICBsYXN0RGlzY291bnRQZXJjZW50OiBnYW1lPy5kaXNjb3VudFBlcmNlbnQgPz8gMCxcbiAgICBub3RlczogKGJvZHkubm90ZXMgPz8gXCJcIikudHJpbSgpLFxuICB9O1xuICBzZW5kSnNvbihyZXMsIDIwMSwgc3RvcmUudXBzZXJ0V2F0Y2hlZChlbnRyeSkpO1xufSk7XG5cbi8vIFBBVENIIC93YXRjaGxpc3QvOmlkIFx1MjAxNCBlZGl0IG5vdGVzIG9yIG5hbWUuXG5yb3V0ZShcIlBBVENIXCIsIFwiL3dhdGNobGlzdC86aWRcIiwgYXN5bmMgKHJlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyBQYXJ0aWFsPFBpY2s8V2F0Y2hlZEdhbWUsIFwibm90ZXNcIiB8IFwibmFtZVwiPj47XG4gIGNvbnN0IHBhdGNoOiBQYXJ0aWFsPFdhdGNoZWRHYW1lPiA9IHt9O1xuICBpZiAodHlwZW9mIGJvZHkubm90ZXMgPT09IFwic3RyaW5nXCIpIHBhdGNoLm5vdGVzID0gYm9keS5ub3RlcztcbiAgaWYgKHR5cGVvZiBib2R5Lm5hbWUgPT09IFwic3RyaW5nXCIgJiYgYm9keS5uYW1lLnRyaW0oKSkgcGF0Y2gubmFtZSA9IGJvZHkubmFtZS50cmltKCk7XG4gIGNvbnN0IHVwZGF0ZWQgPSBzdG9yZS5wYXRjaFdhdGNoZWQocGFyYW1zLmlkLCBwYXRjaCk7XG4gIGlmICghdXBkYXRlZCkgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIm5vdF9mb3VuZFwiIH0pO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgdXBkYXRlZCk7XG59KTtcblxuLy8gREVMRVRFIC93YXRjaGxpc3QvOmlkXG5yb3V0ZShcIkRFTEVURVwiLCBcIi93YXRjaGxpc3QvOmlkXCIsIGFzeW5jIChfcmVxLCByZXMsIHBhcmFtcykgPT4ge1xuICBjb25zdCBvayA9IHN0b3JlLnJlbW92ZVdhdGNoZWQocGFyYW1zLmlkKTtcbiAgaWYgKCFvaykgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIm5vdF9mb3VuZFwiIH0pO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyByZW1vdmVkOiB0cnVlIH0pO1xufSk7XG5cbi8vIEdFVCAvZ2FtZXMvOmlkL21hdGNoZXMgXHUyMDE0IGFsbCBjb21wZXRpdG9yIG1hdGNoZXMgZm9yIGEgZ2FtZSAoZm9yIHBvcG92ZXJzKVxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvOmlkL21hdGNoZXNcIiwgYXN5bmMgKF9yZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IG1hdGNoZXM6IENvbXBldGl0b3JNYXRjaFtdID0gc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMocGFyYW1zLmlkKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgbWF0Y2hlcyB9KTtcbn0pO1xuXG4vLyBQT1NUIC9leGNoYW5nZS9yZWZyZXNoIFx1MjAxNCBmZXRjaCBsYXRlc3QgVVNEXHUyMTkyQ0xQIGZyb20gbWluZGljYWRvci5jbCBhbmQgc2F2ZVxucm91dGUoXCJQT1NUXCIsIFwiL2V4Y2hhbmdlL3JlZnJlc2hcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJhdGVzID0gYXdhaXQgZmV0Y2hFeGNoYW5nZVJhdGVzKCk7XG4gICAgY29uc3QgcGF0Y2g6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgICBpZiAocmF0ZXMudXNkVG9DbHAgIT0gbnVsbCkgcGF0Y2gudXNkVG9DbHAgPSBNYXRoLnJvdW5kKHJhdGVzLnVzZFRvQ2xwKTtcbiAgICBpZiAoT2JqZWN0LmtleXMocGF0Y2gpLmxlbmd0aCA+IDApIHtcbiAgICAgIHN0b3JlLnVwZGF0ZVNldHRpbmdzKHBhdGNoKTtcbiAgICB9XG4gICAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICAgIHVwZGF0ZWQ6IHBhdGNoLFxuICAgICAgZmV0Y2hlZEF0OiByYXRlcy5mZXRjaGVkQXQsXG4gICAgICBlcnJvcnM6IHJhdGVzLmVycm9ycyxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcImV4Y2hhbmdlX2Vycm9yXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gR0VUIC9kZWJ1Zy9zdGF0dXMgXHUyMDE0IGRpYWdub3N0aWMgc25hcHNob3Qgb2Ygc3lzdGVtIGhlYWx0aFxucm91dGUoXCJHRVRcIiwgXCIvZGVidWcvc3RhdHVzXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgYWxsR2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKTtcbiAgY29uc3QgYWN0aXZlR2FtZXMgPSBhbGxHYW1lcy5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcblxuICBjb25zdCBnYW1lc0J5UGxhdGZvcm06IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgZm9yIChjb25zdCBnIG9mIGFjdGl2ZUdhbWVzKSB7XG4gICAgZ2FtZXNCeVBsYXRmb3JtW2cucGxhdGZvcm1dID0gKGdhbWVzQnlQbGF0Zm9ybVtnLnBsYXRmb3JtXSB8fCAwKSArIDE7XG4gIH1cblxuICBjb25zdCBzb3VyY2VzID0gc3RvcmUuZ2V0U291cmNlcygpLm1hcCgocykgPT4gKHtcbiAgICBwbGF0Zm9ybTogcy5wbGF0Zm9ybSxcbiAgICByZWdpb246IHMucmVnaW9uLFxuICAgIGVuYWJsZWQ6IHMuZW5hYmxlZCxcbiAgfSkpO1xuXG4gIGNvbnN0IGNvbXBldGl0b3JzID0gc3RvcmUuZ2V0Q29tcGV0aXRvcnMoKTtcbiAgY29uc3QgYWxsUHJvZHVjdHMgPSBzdG9yZS5nZXRBbGxDb21wZXRpdG9yUHJvZHVjdHMoZmFsc2UpO1xuICBjb25zdCByZWZyZXNoZWRBdCA9IHN0b3JlLmdldENvbXBldGl0b3JSZWZyZXNoZWRBdCgpO1xuXG4gIGNvbnN0IGNvbXBldGl0b3JTdGF0dXMgPSBjb21wZXRpdG9ycy5tYXAoKGMpID0+ICh7XG4gICAga2V5OiBjLmtleSxcbiAgICBsYWJlbDogYy5sYWJlbCxcbiAgICBwcm9kdWN0Q291bnQ6IGFsbFByb2R1Y3RzLmZpbHRlcigocCkgPT4gcC5zdG9yZUtleSA9PT0gYy5rZXkpLmxlbmd0aCxcbiAgICByZWZyZXNoZWRBdDogcmVmcmVzaGVkQXRbYy5rZXldID8/IG51bGwsXG4gIH0pKTtcblxuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIHRvdGFsR2FtZXM6IGFsbEdhbWVzLmxlbmd0aCxcbiAgICBhY3RpdmVHYW1lczogYWN0aXZlR2FtZXMubGVuZ3RoLFxuICAgIGdhbWVzQnlQbGF0Zm9ybSxcbiAgICBzb3VyY2VzLFxuICAgIGNvbXBldGl0b3JzOiBjb21wZXRpdG9yU3RhdHVzLFxuICAgIGF1dG9SZWZyZXNoSW50ZXJ2YWxIb3Vyczogc3RvcmUuZ2V0QXV0b1JlZnJlc2hJbnRlcnZhbCgpLFxuICAgIGxhc3RBdXRvUmVmcmVzaEF0OiBnZXRMYXN0QXV0b1JlZnJlc2hBdCgpLFxuICAgIGRiU2l6ZUtiOiBudWxsLFxuICB9KTtcbn0pO1xuXG4vLyBQVVQgL3NjaGVkdWxlciBcdTIwMTQgZW5hYmxlL2Rpc2FibGUgcGVyaW9kaWMgYXV0by1yZWZyZXNoXG4vLyBCb2R5OiB7IGludGVydmFsSG91cnM6IG51bWJlciB9ICAoMCA9IGRpc2FibGVkKVxucm91dGUoXCJQVVRcIiwgXCIvc2NoZWR1bGVyXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgaW50ZXJ2YWxIb3Vycz86IG51bWJlciB9O1xuICBjb25zdCBob3VycyA9IE51bWJlcihib2R5LmludGVydmFsSG91cnMgPz8gMCk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKGhvdXJzKSB8fCBob3VycyA8IDApIHtcbiAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwiYmFkX3JlcXVlc3RcIiwgbWVzc2FnZTogXCJpbnRlcnZhbEhvdXJzIG11c3QgYmUgPj0gMFwiIH0pO1xuICB9XG4gIHN0b3JlLnNldEF1dG9SZWZyZXNoSW50ZXJ2YWwoaG91cnMpO1xuICByZXNjaGVkdWxlKHJ1blJlZnJlc2gpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBpbnRlcnZhbEhvdXJzOiBzdG9yZS5nZXRBdXRvUmVmcmVzaEludGVydmFsKCkgfSk7XG59KTtcblxuLy8gU3RhcnQgc2NoZWR1bGVyIGlmIGNvbmZpZ3VyZWRcbnN0YXJ0U2NoZWR1bGVyKHJ1blJlZnJlc2gpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVxdWVzdChcbiAgcmVxOiBJbmNvbWluZ01lc3NhZ2UsXG4gIHJlczogU2VydmVyUmVzcG9uc2Vcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IHBhdGhuYW1lID0gdXJsLnBhdGhuYW1lOyAvLyBWaXRlIHN0cmlwcyAvYXBpIHByZWZpeCB2aWEgdXNlKClcblxuICBmb3IgKGNvbnN0IHIgb2Ygcm91dGVzKSB7XG4gICAgaWYgKHIubWV0aG9kICE9PSByZXEubWV0aG9kKSBjb250aW51ZTtcbiAgICBjb25zdCBtID0gci5wYXR0ZXJuLmV4ZWMocGF0aG5hbWUpO1xuICAgIGlmICghbSkgY29udGludWU7XG4gICAgY29uc3QgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgci5rZXlzLmZvckVhY2goKGssIGkpID0+IChwYXJhbXNba10gPSBkZWNvZGVVUklDb21wb25lbnQobVtpICsgMV0pKSk7XG4gICAgcmV0dXJuIHIuaGFuZGxlcihyZXEsIHJlcywgcGFyYW1zKTtcbiAgfVxuICBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiwgcGF0aDogcGF0aG5hbWUgfSk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wbHVnaW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcGx1Z2luLnRzXCI7LyoqXG4gKiBWaXRlIHBsdWdpbiB0aGF0IG1vdW50cyB0aGUgYXBpcHNuIEpTT04gQVBJIG9uIHRoZSBkZXYgc2VydmVyLlxuICogRXZlcnl0aGluZyBydW5zIGluIGEgc2luZ2xlIE5vZGUgcHJvY2VzcyBcdTIwMTQgaWRlYWwgZm9yIEJvbHQgLyBTdGFja0JsaXR6LlxuICovXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiwgVml0ZURldlNlcnZlciB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tIFwibm9kZTpodHRwXCI7XG5pbXBvcnQgeyBoYW5kbGVSZXF1ZXN0IH0gZnJvbSBcIi4vYXBpXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGlQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImFwaXBzbi1hcGlcIixcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFxuICAgICAgICBcIi9hcGlcIixcbiAgICAgICAgKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlLCBuZXh0OiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgaGFuZGxlUmVxdWVzdChyZXEsIHJlcykuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlthcGldIHVuaGFuZGxlZFwiLCBlcnIpO1xuICAgICAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiBcImludGVybmFsX2Vycm9yXCIsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBTdHJpbmcoKGVyciBhcyBFcnJvcik/Lm1lc3NhZ2UgfHwgZXJyKSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH0sXG4gIH07XG59XG4i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QUFDO0FBQzNEOzs7QUNoM0NPLFNBQVMsWUFBb0I7QUFDbEMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sZ0JBQWdCLFFBQXVCO0FBQ3JDLGFBQU8sWUFBWTtBQUFBLFFBQ2pCO0FBQUEsUUFDQSxDQUFDLEtBQXNCLEtBQXFCLFNBQXFCO0FBQy9ELHdCQUFjLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxRQUFRO0FBQ3JDLG9CQUFRLE1BQU0sbUJBQW1CLEdBQUc7QUFDcEMsZ0JBQUksQ0FBQyxJQUFJLGFBQWE7QUFDcEIsa0JBQUksYUFBYTtBQUNqQixrQkFBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsa0JBQUk7QUFBQSxnQkFDRixLQUFLLFVBQVU7QUFBQSxrQkFDYixPQUFPO0FBQUEsa0JBQ1AsU0FBUyxPQUFRLEtBQWUsV0FBVyxHQUFHO0FBQUEsZ0JBQ2hELENBQUM7QUFBQSxjQUNIO0FBQUEsWUFDRixPQUFPO0FBQ0wsa0JBQUksSUFBSTtBQUFBLFlBQ1Y7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7OztBaEI5QkEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7QUFBQSxFQUM5QixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbIm0iLCAiVUEiLCAicGF0aCIsICJVQSIsICJmZXRjaEh0bWwiLCAiZXh0cmFjdE5leHREYXRhIiwgIm0iLCAiVUEiLCAiVUEiLCAiQ1VSUkVOQ1lfTUFQIiwgImZldGNoSnNvbiIsICJuIiwgIlVBIiwgIkNVUlJFTkNZX01BUCIsICJmZXRjaFdpdGhSZXRyeSIsICJmZXRjaEpzb24iLCAiZmV0Y2hIdG1sIiwgIlVBIiwgIlVBIiwgImV4dHJhY3ROZXh0RGF0YSIsICJwYXRoIiwgInRvdGFsU2VlbiIsICJyZXMiXQp9Cg==
