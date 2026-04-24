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
  const imgRe = /data-qa="[^"]*#game-art#image#image"[^>]*\bsrc="([^"]+)"/g;
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
  const rows = games.map((g) => {
    const sale = computeSalePrices(g.priceDiscountedCents, cfg, g.currency || "USD");
    const detail = store.getProductDetail(g.id);
    const hwPlatforms = (g.platforms || "").split(",").map((p) => p.trim()).filter(Boolean);
    const platformAvailability = {};
    for (const p of hwPlatforms) platformAvailability[p] = true;
    const images = [];
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
      store.setProductDetail(g.id, detail);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL3N0b3JlLnRzIiwgInNlcnZlci9wcmljaW5nLnRzIiwgInNlcnZlci9wc24udHMiLCAic2VydmVyL2NvbXBldGl0b3JzLnRzIiwgInNlcnZlci9wc24tcHJvZHVjdC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3R5cGVzLnRzIiwgInNlcnZlci9wcm92aWRlcnMvcHNuLnRzIiwgInNlcnZlci9wcm92aWRlcnMveGJveC50cyIsICJzZXJ2ZXIvcHJvdmlkZXJzL3N0ZWFtLnRzIiwgInNlcnZlci9wcm92aWRlcnMvbmludGVuZG8udHMiLCAic2VydmVyL3Byb3ZpZGVycy9pbmRleC50cyIsICJzZXJ2ZXIvZXhjaGFuZ2UudHMiLCAic2VydmVyL3NjaGVkdWxlci50cyIsICJzZXJ2ZXIvcHMtcGx1cy50cyIsICJzZXJ2ZXIvYXBpLnRzIiwgInNlcnZlci9wbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgYXBpUGx1Z2luIH0gZnJvbSBcIi4vc2VydmVyL3BsdWdpblwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpUGx1Z2luKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9zdG9yZS50c1wiOy8qKlxuICogSlNPTi1maWxlIHN0b3JhZ2UuIEF2b2lkcyBuYXRpdmUgZGVwcyAoYmV0dGVyLXNxbGl0ZTMgYnJlYWtzIGluIFdlYkNvbnRhaW5lcnMpLlxuICovXG5pbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ29tcGV0aXRvckNvbmZpZyxcbiAgQ29tcGV0aXRvck1hdGNoLFxuICBDb21wZXRpdG9yUHJvZHVjdCxcbn0gZnJvbSBcIi4vY29tcGV0aXRvcnNcIjtcbmltcG9ydCB0eXBlIHsgUHJvZHVjdERldGFpbCB9IGZyb20gXCIuL3Bzbi1wcm9kdWN0XCI7XG5pbXBvcnQgdHlwZSB7IFBsYXRmb3JtLCBQcm92aWRlclNvdXJjZSB9IGZyb20gXCIuL3Byb3ZpZGVycy90eXBlc1wiO1xuXG4vKiogQSBnYW1lIHRoZSB1c2VyIGlzIHRyYWNraW5nIGV2ZW4gd2hlbiBpdCdzIG5vdCBpbiB0aGUgY3VycmVudCBXZWVrbHkgRGVhbHNcbiAqICBjYXRlZ29yeS4gRXZlcnkgL3JlZnJlc2ggZGlmZnMgdGhlc2UgYWdhaW5zdCB0aGUgc2NyYXBlIGFuZCByZXBvcnRzXG4gKiAgdHJhbnNpdGlvbnMgKG9mZl9zYWxlIFx1MjE5MiBvbl9zYWxlKSBiYWNrIHRvIHRoZSBjbGllbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoZWRHYW1lIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBhZGRlZEF0OiBzdHJpbmc7XG4gIC8qKiBcInVuc2VlblwiID0gbmV2ZXIgZm91bmQgaW4gYW55IHJlZnJlc2ggeWV0LiAqL1xuICBsYXN0U3RhdHVzOiBcInVuc2VlblwiIHwgXCJvbl9zYWxlXCIgfCBcIm9mZl9zYWxlXCI7XG4gIGxhc3RTZWVuT25TYWxlQXQ6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RQcmljZUNlbnRzOiBudW1iZXIgfCBudWxsO1xuICBsYXN0RGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIG5vdGVzOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2FtZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHBsYXRmb3JtOiBQbGF0Zm9ybTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgaW1hZ2VVcmw6IHN0cmluZyB8IG51bGw7XG4gIHN0b3JlVXJsOiBzdHJpbmcgfCBudWxsO1xuICBwbGF0Zm9ybXM6IHN0cmluZztcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgcHJpY2VPcmlnaW5hbENlbnRzOiBudW1iZXIgfCBudWxsO1xuICBwcmljZURpc2NvdW50ZWRDZW50czogbnVtYmVyIHwgbnVsbDtcbiAgZGlzY291bnRQZXJjZW50OiBudW1iZXI7XG4gIGRpc2NvdW50RW5kQXQ6IHN0cmluZyB8IG51bGw7XG4gIHNlbGVjdGVkOiBib29sZWFuO1xuICBwdWJsaXNoZWQ6IGJvb2xlYW47XG4gIG5vdGVzOiBzdHJpbmc7XG4gIHlvdXR1YmVVcmw6IHN0cmluZztcbiAgYWN0aXZlOiBib29sZWFuO1xuICBmaXJzdFNlZW5BdDogc3RyaW5nO1xuICBsYXN0U2VlbkF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByaWNpbmdTZXR0aW5ncyB7XG4gIHVzZFRvQ2xwOiBudW1iZXI7XG4gIGJybFRvQ2xwOiBudW1iZXI7XG4gIHRyeVRvQ2xwOiBudW1iZXI7XG4gIGpweVRvQ2xwOiBudW1iZXI7XG4gIC8qKiBGcmFjdGlvbiBvZiBmYWNlIHZhbHVlIHBhaWQgZm9yIFBTTiBiYWxhbmNlIChlLmcuIDAuODAgPSBidXkgJDEwIHNhbGRvIGZvciAkOCkuXG4gICAqICBQZXItY3VycmVuY3kuIFVzZSAxLjAgaWYgYnV5aW5nIGF0IGZ1bGwgcHJpY2UuICovXG4gIGJhbGFuY2VEaXNjb3VudFVzZDogbnVtYmVyO1xuICBiYWxhbmNlRGlzY291bnRCcmw6IG51bWJlcjtcbiAgYmFsYW5jZURpc2NvdW50VHJ5OiBudW1iZXI7XG4gIC8qKiBQcmljZSBtdWx0aXBsaWVyIGZvciBQcmltYXJpYSAoc29sZCBcdTAwRDcyIHBlciBwdXJjaGFzZSkuICovXG4gIHByaW1hcmlhTXVsdDogbnVtYmVyO1xuICAvKiogUHJpY2UgbXVsdGlwbGllciBmb3IgU2VjdW5kYXJpYSAoc29sZCBcdTAwRDcxIHBlciBwdXJjaGFzZSwgY2hlYXBlcikuICovXG4gIHNlY3VuZGFyaWFNdWx0OiBudW1iZXI7XG4gIHJvdW5kVG86IG51bWJlcjtcbiAgLyoqIFdoZW4gdHJ1ZSwgY29uc3VtZXItZmFjaW5nIHByaWNlcyAocHJpbWFyaWEvc2VjdW5kYXJpYSkgdXNlIFguOTkwIGVuZGluZ3MuICovXG4gIGNvbW1lcmNpYWxSb3VuZGluZzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdXBhYmFzZUNvbmZpZyB7XG4gIHVybDogc3RyaW5nO1xuICBzZXJ2aWNlS2V5OiBzdHJpbmc7XG4gIHRhYmxlTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBzbkNvbmZpZyB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBkZWFsc0NhdGVnb3J5SWQ6IHN0cmluZztcbiAgY2F0ZWdvcnlHcmlkSGFzaDogc3RyaW5nO1xuICAvKiogV2hlbiBmYWxzZSwgZmlsdGVyIG91dCBETEMsIGN1cnJlbmN5LCBhdmF0YXJzLCB0aGVtZXMsIHN1YnNjcmlwdGlvbnMuXG4gICAqICBEZWZhdWx0IGZhbHNlIFx1MjAxNCB3ZSBhbG1vc3QgYWx3YXlzIHdhbnQganVzdCB0aGUgcGxheWFibGUgZ2FtZXMuICovXG4gIGluY2x1ZGVBZGRPbnM6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBEYlNoYXBlIHtcbiAgZ2FtZXM6IFJlY29yZDxzdHJpbmcsIEdhbWU+O1xuICBzZXR0aW5nczogUHJpY2luZ1NldHRpbmdzO1xuICBwc246IFBzbkNvbmZpZztcbiAgc291cmNlczogUHJvdmlkZXJTb3VyY2VbXTtcbiAgY29tcGV0aXRvcnM6IENvbXBldGl0b3JDb25maWdbXTtcbiAgY29tcGV0aXRvclByb2R1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBDb21wZXRpdG9yUHJvZHVjdFtdPjtcbiAgY29tcGV0aXRvck1hdGNoZXM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPjtcbiAgY29tcGV0aXRvclJlZnJlc2hlZEF0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBwcm9kdWN0RGV0YWlsczogUmVjb3JkPHN0cmluZywgUHJvZHVjdERldGFpbD47XG4gIHdhdGNobGlzdDogUmVjb3JkPHN0cmluZywgV2F0Y2hlZEdhbWU+O1xuICAvKiogMCA9IGRpc2FibGVkLiBTdG9yZWQgc2VwYXJhdGVseSBzbyBpdCBzdXJ2aXZlcyBzZXR0aW5ncyByZXNldHMuICovXG4gIGF1dG9SZWZyZXNoSW50ZXJ2YWxIb3VyczogbnVtYmVyO1xuICAvKiogU2NyYXBlZCBQUyBQbHVzIHByaWNlcywgcGVyc2lzdGVkIHNvIHRoZXkgc3Vydml2ZSByZXN0YXJ0cy4gKi9cbiAgcHNQbHVzUHJpY2VzOiB7XG4gICAgcHJpY2VzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+Pj47XG4gICAgc2NyYXBlZEF0OiBzdHJpbmc7XG4gICAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgfSB8IG51bGw7XG4gIC8qKiBTdXBhYmFzZSBjb25uZWN0aW9uIGZvciBkaXJlY3QgcHVibGlzaGluZy4gKi9cbiAgc3VwYWJhc2U6IFN1cGFiYXNlQ29uZmlnIHwgbnVsbDtcbiAgLyoqIFB1Ymxpc2hlcnMgY29uc2lkZXJlZCBcImhpdFwiIHRpZXIgZm9yIGF1dG8tZmlsdGVyaW5nLiAqL1xuICBoaXRQdWJsaXNoZXJzOiBzdHJpbmdbXTtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogUHJpY2luZ1NldHRpbmdzID0ge1xuICB1c2RUb0NscDogODkwLFxuICBicmxUb0NscDogMTcwLFxuICB0cnlUb0NscDogMjgsXG4gIGpweVRvQ2xwOiA2LjUsXG4gIGJhbGFuY2VEaXNjb3VudFVzZDogMC44MCxcbiAgYmFsYW5jZURpc2NvdW50QnJsOiAxLjAsXG4gIGJhbGFuY2VEaXNjb3VudFRyeTogMS4wLFxuICBwcmltYXJpYU11bHQ6IDEuMjUsXG4gIHNlY3VuZGFyaWFNdWx0OiAwLjcwLFxuICByb3VuZFRvOiA1MDAsXG4gIGNvbW1lcmNpYWxSb3VuZGluZzogdHJ1ZSxcbn07XG5cbmNvbnN0IERFRkFVTFRfSElUX1BVQkxJU0hFUlM6IHN0cmluZ1tdID0gW1xuICBcIlNvbnkgSW50ZXJhY3RpdmUgRW50ZXJ0YWlubWVudFwiLCBcIkluc29tbmlhYyBHYW1lc1wiLCBcIk5hdWdodHkgRG9nXCIsXG4gIFwiU2FudGEgTW9uaWNhIFN0dWRpb1wiLCBcIkd1ZXJyaWxsYVwiLCBcIlN1Y2tlciBQdW5jaCBQcm9kdWN0aW9uc1wiLFxuICBcIlJvY2tzdGFyIEdhbWVzXCIsIFwiVWJpc29mdFwiLCBcIkVsZWN0cm9uaWMgQXJ0c1wiLCBcIkNhcGNvbVwiLFxuICBcIlNxdWFyZSBFbml4XCIsIFwiQmFuZGFpIE5hbWNvXCIsIFwiV2FybmVyIEJyb3NcIiwgXCJBY3RpdmlzaW9uXCIsXG4gIFwiQmV0aGVzZGFcIiwgXCJGcm9tU29mdHdhcmVcIiwgXCJLb25hbWlcIiwgXCJTRUdBXCIsIFwiMksgR2FtZXNcIixcbiAgXCJDRCBQcm9qZWt0IFJlZFwiLCBcIlJlbWVkeSBFbnRlcnRhaW5tZW50XCIsIFwiVGVhbSBOaW5qYVwiLFxuXTtcblxuY29uc3QgREVGQVVMVF9TT1VSQ0VTOiBQcm92aWRlclNvdXJjZVtdID0gW1xuICB7IHBsYXRmb3JtOiBcInBzblwiLCByZWdpb246IFwidXNcIiwgZW5hYmxlZDogdHJ1ZSwgY2F0ZWdvcnlJZDogXCJcIiB9LFxuICB7IHBsYXRmb3JtOiBcInBzblwiLCByZWdpb246IFwiYnJcIiwgZW5hYmxlZDogdHJ1ZSwgY2F0ZWdvcnlJZDogXCIzZjc3MjUwMS1mNmY4LTQ5YjctYWJhYy04NzRhODhjYTQ4OTdcIiB9LFxuICB7IHBsYXRmb3JtOiBcInhib3hcIiwgcmVnaW9uOiBcInVzXCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBwbGF0Zm9ybTogXCJ4Ym94XCIsIHJlZ2lvbjogXCJiclwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsgcGxhdGZvcm06IFwieGJveFwiLCByZWdpb246IFwidHJcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IHBsYXRmb3JtOiBcIm5pbnRlbmRvXCIsIHJlZ2lvbjogXCJ1c1wiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsgcGxhdGZvcm06IFwibmludGVuZG9cIiwgcmVnaW9uOiBcImpwXCIsIGVuYWJsZWQ6IGZhbHNlIH0sXG4gIHsgcGxhdGZvcm06IFwic3RlYW1cIiwgcmVnaW9uOiBcInVzXCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBwbGF0Zm9ybTogXCJzdGVhbVwiLCByZWdpb246IFwiYnJcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuICB7IHBsYXRmb3JtOiBcInN0ZWFtXCIsIHJlZ2lvbjogXCJ0clwiLCBlbmFibGVkOiB0cnVlIH0sXG5dO1xuXG5jb25zdCBERUZBVUxUX0NPTVBFVElUT1JTOiBDb21wZXRpdG9yQ29uZmlnW10gPSBbXG4gIHsga2V5OiBcImNqbVwiLCBsYWJlbDogXCJDSk0gRGlnaXRhbGVzXCIsIGRvbWFpbjogXCJjam1kaWdpdGFsZXMuY2xcIiwgdHlwZTogXCJzaG9waWZ5XCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBrZXk6IFwianVlZ29zZGlnaXRhbGVzY2hpbGVcIiwgbGFiZWw6IFwiSnVlZ29zIERpZ2l0YWxlcyBDaGlsZVwiLCBkb21haW46IFwianVlZ29zZGlnaXRhbGVzY2hpbGUuY29tXCIsIHR5cGU6IFwiaHRtbFwiLCBlbmFibGVkOiB0cnVlIH0sXG4gIHsga2V5OiBcIm1qXCIsIGxhYmVsOiBcIk1KIERpZ2l0YWxlc1wiLCBkb21haW46IFwibWpkaWdpdGFsZXMuY2xcIiwgdHlwZTogXCJzaG9waWZ5XCIsIGVuYWJsZWQ6IHRydWUgfSxcbiAgeyBrZXk6IFwiaW5maW5pdHlcIiwgbGFiZWw6IFwiSW5maW5pdHkgR2FtZXMgQ2hpbGVcIiwgZG9tYWluOiBcImluZmluaXR5Z2FtZXNjaGlsZS5jbFwiLCB0eXBlOiBcImh0bWxcIiwgZW5hYmxlZDogdHJ1ZSB9LFxuXTtcblxuY29uc3QgREVGQVVMVF9QU046IFBzbkNvbmZpZyA9IHtcbiAgcmVnaW9uOiBcImVuLVVTXCIsXG4gIC8vIFBsYWNlaG9sZGVyIElEcyBcdTIwMTQgdGhlIHVzZXIgY29uZmlndXJlcyB0aGUgcmVhbCBvbmVzIGZyb20gRGV2VG9vbHMuXG4gIC8vIFBhbmVsID4gQWp1c3RlcyBleHBvbmUgYW1ib3MuXG4gIGRlYWxzQ2F0ZWdvcnlJZDogXCIzZjc3MjUwMS1mNmY4LTQ5YjctYWJhYy04NzRhODhjYTQ4OTdcIixcbiAgLy8gVW51c2VkIGJ5IHRoZSBIVE1MIHNjcmFwZXIuIEtlcHQgZm9yIHJlZmVyZW5jZSBpbiBjYXNlIHdlIGV2ZXIgYWRkIGFcbiAgLy8gR3JhcGhRTCBmYWxsYmFjay4gQ3VycmVudCB2YWx1ZSBjYXB0dXJlZCBmcm9tIERldlRvb2xzIG9uIDIwMjYtMDQtMTMuXG4gIGNhdGVnb3J5R3JpZEhhc2g6XG4gICAgXCIyNTc3MTM0NjZmYzMyNjQ4NTBhYTQ3MzQwOWEyOTA4OGUzYTQxMTVlNmU2OWU5ZmIzZTA2MWM4ZGQ1YjlmNWM2XCIsXG4gIGluY2x1ZGVBZGRPbnM6IGZhbHNlLFxufTtcblxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5jb25zdCBEQVRBX0ZJTEUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uL2RhdGEvYXBpcHNuLmpzb25cIik7XG5jb25zdCBUTVBfRklMRSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vZGF0YS9hcGlwc24uanNvbi50bXBcIik7XG5jb25zdCBCQUNLVVBfRklMRSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vZGF0YS9hcGlwc24uYmFja3VwLmpzb25cIik7XG5cbi8qKiBTaW1wbGUgd3JpdGUtbG9jazogcHJldmVudHMgb3ZlcmxhcHBpbmcgd3JpdGVzLiAqL1xubGV0IHdyaXRpbmcgPSBmYWxzZTtcbmxldCBwZW5kaW5nV3JpdGUgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlRGlyKCkge1xuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoREFUQV9GSUxFKTtcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xufVxuXG5mdW5jdGlvbiBtaWdyYXRlR2FtZXMoZ2FtZXM6IFJlY29yZDxzdHJpbmcsIEdhbWU+KTogUmVjb3JkPHN0cmluZywgR2FtZT4ge1xuICBjb25zdCBtaWdyYXRlZDogUmVjb3JkPHN0cmluZywgR2FtZT4gPSB7fTtcbiAgZm9yIChjb25zdCBba2V5LCBnXSBvZiBPYmplY3QuZW50cmllcyhnYW1lcykpIHtcbiAgICBpZiAodHlwZW9mIGcueW91dHViZVVybCAhPT0gXCJzdHJpbmdcIikgZy55b3V0dWJlVXJsID0gXCJcIjtcbiAgICBpZiAoIWcucGxhdGZvcm0pIGcucGxhdGZvcm0gPSBcInBzblwiO1xuICAgIGlmICghZy5yZWdpb24pIGcucmVnaW9uID0gXCJ1c1wiO1xuICAgIGlmICghZy5jdXJyZW5jeSkgZy5jdXJyZW5jeSA9IFwiVVNEXCI7XG4gICAgLy8gUmUta2V5IG9sZCBQU04gZW50cmllcyB0byBjb21wb3NpdGUga2V5XG4gICAgY29uc3QgY29tcG9zaXRlS2V5ID0gYCR7Zy5wbGF0Zm9ybX06JHtnLnJlZ2lvbn06JHtnLmlkfWA7XG4gICAgaWYgKGtleSA9PT0gZy5pZCAmJiBrZXkgIT09IGNvbXBvc2l0ZUtleSkge1xuICAgICAgbWlncmF0ZWRbY29tcG9zaXRlS2V5XSA9IGc7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1pZ3JhdGVkW2tleV0gPSBnO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWlncmF0ZWQ7XG59XG5cbmZ1bmN0aW9uIG1pZ3JhdGVTb3VyY2VzKFxuICBzb3VyY2VzOiBQcm92aWRlclNvdXJjZVtdIHwgdW5kZWZpbmVkLFxuICBwc246IFBzbkNvbmZpZ1xuKTogUHJvdmlkZXJTb3VyY2VbXSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gc291cmNlcyAmJiBzb3VyY2VzLmxlbmd0aCA+IDAgPyBbLi4uc291cmNlc10gOiBbXTtcbiAgY29uc3QgZXhpc3RpbmdLZXlzID0gbmV3IFNldChleGlzdGluZy5tYXAoKHMpID0+IGAke3MucGxhdGZvcm19OiR7cy5yZWdpb259YCkpO1xuXG4gIC8vIEFsd2F5cyBtZXJnZSBtaXNzaW5nIHNvdXJjZXMgZnJvbSBkZWZhdWx0c1xuICBmb3IgKGNvbnN0IGRlZiBvZiBERUZBVUxUX1NPVVJDRVMpIHtcbiAgICBjb25zdCBrZXkgPSBgJHtkZWYucGxhdGZvcm19OiR7ZGVmLnJlZ2lvbn1gO1xuICAgIGlmICghZXhpc3RpbmdLZXlzLmhhcyhrZXkpKSB7XG4gICAgICBleGlzdGluZy5wdXNoKHsgLi4uZGVmIH0pO1xuICAgIH0gZWxzZSBpZiAoZGVmLmVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IHNyYyA9IGV4aXN0aW5nLmZpbmQoKHMpID0+IHMucGxhdGZvcm0gPT09IGRlZi5wbGF0Zm9ybSAmJiBzLnJlZ2lvbiA9PT0gZGVmLnJlZ2lvbik7XG4gICAgICBpZiAoc3JjICYmICFzcmMuZW5hYmxlZCkgc3JjLmVuYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhcnJ5IG92ZXIgZXhpc3RpbmcgUFNOIGNhdGVnb3J5IElEIGlmIHNvdXJjZXMgd2VyZSBlbXB0eVxuICBpZiAoKCFzb3VyY2VzIHx8IHNvdXJjZXMubGVuZ3RoID09PSAwKSAmJiBwc24uZGVhbHNDYXRlZ29yeUlkKSB7XG4gICAgY29uc3QgcHNuVXMgPSBleGlzdGluZy5maW5kKChzKSA9PiBzLnBsYXRmb3JtID09PSBcInBzblwiICYmIHMucmVnaW9uID09PSBcInVzXCIpO1xuICAgIGlmIChwc25VcyAmJiAhcHNuVXMuY2F0ZWdvcnlJZCkge1xuICAgICAgcHNuVXMuY2F0ZWdvcnlJZCA9IHBzbi5kZWFsc0NhdGVnb3J5SWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGV4aXN0aW5nO1xufVxuXG5mdW5jdGlvbiBidWlsZERiKHBhcnNlZDogUGFydGlhbDxEYlNoYXBlPik6IERiU2hhcGUge1xuICBjb25zdCBwc24gPSB7IC4uLkRFRkFVTFRfUFNOLCAuLi4ocGFyc2VkLnBzbiA/PyB7fSkgfTtcbiAgY29uc3QgZ2FtZXMgPSBtaWdyYXRlR2FtZXMocGFyc2VkLmdhbWVzID8/IHt9KTtcbiAgcmV0dXJuIHtcbiAgICBnYW1lcyxcbiAgICBzZXR0aW5nczogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLCAuLi4ocGFyc2VkLnNldHRpbmdzID8/IHt9KSB9LFxuICAgIHBzbixcbiAgICBzb3VyY2VzOiBtaWdyYXRlU291cmNlcyhwYXJzZWQuc291cmNlcywgcHNuKSxcbiAgICBjb21wZXRpdG9yczogcGFyc2VkLmNvbXBldGl0b3JzID8/IFsuLi5ERUZBVUxUX0NPTVBFVElUT1JTXSxcbiAgICBjb21wZXRpdG9yUHJvZHVjdHM6IHBhcnNlZC5jb21wZXRpdG9yUHJvZHVjdHMgPz8ge30sXG4gICAgY29tcGV0aXRvck1hdGNoZXM6IHBhcnNlZC5jb21wZXRpdG9yTWF0Y2hlcyA/PyB7fSxcbiAgICBjb21wZXRpdG9yUmVmcmVzaGVkQXQ6IHBhcnNlZC5jb21wZXRpdG9yUmVmcmVzaGVkQXQgPz8ge30sXG4gICAgcHJvZHVjdERldGFpbHM6IHBhcnNlZC5wcm9kdWN0RGV0YWlscyA/PyB7fSxcbiAgICB3YXRjaGxpc3Q6IHBhcnNlZC53YXRjaGxpc3QgPz8ge30sXG4gICAgYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzOiBwYXJzZWQuYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzID8/IDAsXG4gICAgcHNQbHVzUHJpY2VzOiBwYXJzZWQucHNQbHVzUHJpY2VzID8/IG51bGwsXG4gICAgc3VwYWJhc2U6IHBhcnNlZC5zdXBhYmFzZSA/PyBudWxsLFxuICAgIGhpdFB1Ymxpc2hlcnM6IHBhcnNlZC5oaXRQdWJsaXNoZXJzID8/IFsuLi5ERUZBVUxUX0hJVF9QVUJMSVNIRVJTXSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZW1wdHlEYigpOiBEYlNoYXBlIHtcbiAgcmV0dXJuIHtcbiAgICBnYW1lczoge30sXG4gICAgc2V0dGluZ3M6IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9LFxuICAgIHBzbjogeyAuLi5ERUZBVUxUX1BTTiB9LFxuICAgIHNvdXJjZXM6IFsuLi5ERUZBVUxUX1NPVVJDRVNdLFxuICAgIGNvbXBldGl0b3JzOiBbLi4uREVGQVVMVF9DT01QRVRJVE9SU10sXG4gICAgY29tcGV0aXRvclByb2R1Y3RzOiB7fSxcbiAgICBjb21wZXRpdG9yTWF0Y2hlczoge30sXG4gICAgY29tcGV0aXRvclJlZnJlc2hlZEF0OiB7fSxcbiAgICBwcm9kdWN0RGV0YWlsczoge30sXG4gICAgd2F0Y2hsaXN0OiB7fSxcbiAgICBhdXRvUmVmcmVzaEludGVydmFsSG91cnM6IDAsXG4gICAgcHNQbHVzUHJpY2VzOiBudWxsLFxuICAgIHN1cGFiYXNlOiBudWxsLFxuICAgIGhpdFB1Ymxpc2hlcnM6IFsuLi5ERUZBVUxUX0hJVF9QVUJMSVNIRVJTXSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbG9hZCgpOiBEYlNoYXBlIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByYXcgPSBmcy5yZWFkRmlsZVN5bmMoREFUQV9GSUxFLCBcInV0Zi04XCIpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdykgYXMgUGFydGlhbDxEYlNoYXBlPjtcbiAgICAgIHJldHVybiBidWlsZERiKHBhcnNlZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBNYWluIGZpbGUgaXMgY29ycnVwdGVkIFx1MjAxNCB0cnkgYmFja3VwXG4gICAgICBjb25zb2xlLndhcm4oXCJbc3RvcmVdIE1haW4gZGF0YSBmaWxlIGNvcnJ1cHRlZCwgbG9hZGluZyBiYWNrdXBcIik7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBiYWNrdXBSYXcgPSBmcy5yZWFkRmlsZVN5bmMoQkFDS1VQX0ZJTEUsIFwidXRmLThcIik7XG4gICAgICAgIGNvbnN0IGJhY2t1cFBhcnNlZCA9IEpTT04ucGFyc2UoYmFja3VwUmF3KSBhcyBQYXJ0aWFsPERiU2hhcGU+O1xuICAgICAgICByZXR1cm4gYnVpbGREYihiYWNrdXBQYXJzZWQpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBlbXB0eURiKCk7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZW1wdHlEYigpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlQmFja3VwKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhEQVRBX0ZJTEUpO1xuICAgIGNvbnN0IGFnZU1zID0gRGF0ZS5ub3coKSAtIHN0YXQubXRpbWVNcztcbiAgICBpZiAoYWdlTXMgPiA2MCAqIDYwICogMTAwMCkge1xuICAgICAgZnMuY29weUZpbGVTeW5jKERBVEFfRklMRSwgQkFDS1VQX0ZJTEUpO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gRmlsZSBtYXkgbm90IGV4aXN0IHlldCBcdTIwMTQgbm90aGluZyB0byBiYWNrIHVwLlxuICB9XG59XG5cbmZ1bmN0aW9uIHBlcnNpc3QoKSB7XG4gIGlmICh3cml0aW5nKSB7XG4gICAgcGVuZGluZ1dyaXRlID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgd3JpdGluZyA9IHRydWU7XG4gIHRyeSB7XG4gICAgZW5zdXJlRGlyKCk7XG4gICAgbWF5YmVCYWNrdXAoKTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKFRNUF9GSUxFLCBKU09OLnN0cmluZ2lmeShkYiwgbnVsbCwgMikpO1xuICAgIGZzLnJlbmFtZVN5bmMoVE1QX0ZJTEUsIERBVEFfRklMRSk7XG4gIH0gZmluYWxseSB7XG4gICAgd3JpdGluZyA9IGZhbHNlO1xuICAgIGlmIChwZW5kaW5nV3JpdGUpIHtcbiAgICAgIHBlbmRpbmdXcml0ZSA9IGZhbHNlO1xuICAgICAgcGVyc2lzdCgpO1xuICAgIH1cbiAgfVxufVxuXG5sZXQgZGI6IERiU2hhcGUgPSBsb2FkKCk7XG5sZXQgc2F2ZVRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuXG4vLyBQZXJzaXN0IG1pZ3JhdGVkIGRhdGEgb24gZmlyc3QgbG9hZCBzbyBuZXcgc291cmNlcy9maWVsZHMgYXJlIHNhdmVkXG50cnkgeyBwZXJzaXN0KCk7IH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxuXG5mdW5jdGlvbiBzY2hlZHVsZVNhdmUoKSB7XG4gIGlmIChzYXZlVGltZXIpIGNsZWFyVGltZW91dChzYXZlVGltZXIpO1xuICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0KHBlcnNpc3QsIDE1MCk7XG59XG5cbmZ1bmN0aW9uIGdhbWVLZXkocGxhdGZvcm06IFBsYXRmb3JtLCByZWdpb246IHN0cmluZywgaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwbGF0Zm9ybX06JHtyZWdpb259OiR7aWR9YDtcbn1cblxuZXhwb3J0IGNvbnN0IHN0b3JlID0ge1xuICBsaXN0R2FtZXMoKTogR2FtZVtdIHtcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhkYi5nYW1lcyk7XG4gIH0sXG4gIGdldEdhbWUoaWQ6IHN0cmluZyk6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5nYW1lc1tpZF07XG4gIH0sXG4gIGdldEdhbWVCeUNvbXBvc2l0ZShwbGF0Zm9ybTogUGxhdGZvcm0sIHJlZ2lvbjogc3RyaW5nLCBpZDogc3RyaW5nKTogR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGRiLmdhbWVzW2dhbWVLZXkocGxhdGZvcm0sIHJlZ2lvbiwgaWQpXTtcbiAgfSxcbiAgdXBzZXJ0R2FtZShnYW1lOiBHYW1lKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ID0gZ2FtZUtleShnYW1lLnBsYXRmb3JtLCBnYW1lLnJlZ2lvbiwgZ2FtZS5pZCk7XG4gICAgZGIuZ2FtZXNba2V5XSA9IGdhbWU7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gIH0sXG4gIHBhdGNoR2FtZShpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxHYW1lPik6IEdhbWUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZGIuZ2FtZXNbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogR2FtZSA9IHsgLi4uZXhpc3RpbmcsIC4uLnBhdGNoLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9O1xuICAgIGRiLmdhbWVzW2lkXSA9IHVwZGF0ZWQ7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHVwZGF0ZWQ7XG4gIH0sXG4gIG1hcmtJbmFjdGl2ZUlmTWlzc2luZyhzZWVuS2V5czogU2V0PHN0cmluZz4sIHBsYXRmb3JtPzogUGxhdGZvcm0sIHJlZ2lvbj86IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGddIG9mIE9iamVjdC5lbnRyaWVzKGRiLmdhbWVzKSkge1xuICAgICAgaWYgKCFnLmFjdGl2ZSkgY29udGludWU7XG4gICAgICBpZiAocGxhdGZvcm0gJiYgZy5wbGF0Zm9ybSAhPT0gcGxhdGZvcm0pIGNvbnRpbnVlO1xuICAgICAgaWYgKHJlZ2lvbiAmJiBnLnJlZ2lvbiAhPT0gcmVnaW9uKSBjb250aW51ZTtcbiAgICAgIGlmICghc2VlbktleXMuaGFzKGtleSkpIHtcbiAgICAgICAgZy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgZy51cGRhdGVkQXQgPSBub3c7XG4gICAgICAgIG4rKztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG4gPiAwKSBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gbjtcbiAgfSxcbiAgZ2V0U2V0dGluZ3MoKTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICByZXR1cm4geyAuLi5kYi5zZXR0aW5ncyB9O1xuICB9LFxuICB1cGRhdGVTZXR0aW5ncyhwYXRjaDogUGFydGlhbDxQcmljaW5nU2V0dGluZ3M+KTogUHJpY2luZ1NldHRpbmdzIHtcbiAgICBkYi5zZXR0aW5ncyA9IHsgLi4uZGIuc2V0dGluZ3MsIC4uLnBhdGNoIH07XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gICAgcmV0dXJuIHsgLi4uZGIuc2V0dGluZ3MgfTtcbiAgfSxcbiAgZ2V0UHNuKCk6IFBzbkNvbmZpZyB7XG4gICAgcmV0dXJuIHsgLi4uZGIucHNuIH07XG4gIH0sXG4gIHVwZGF0ZVBzbihwYXRjaDogUGFydGlhbDxQc25Db25maWc+KTogUHNuQ29uZmlnIHtcbiAgICBkYi5wc24gPSB7IC4uLmRiLnBzbiwgLi4ucGF0Y2ggfTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4geyAuLi5kYi5wc24gfTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvcnMoKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvcnMobGlzdDogQ29tcGV0aXRvckNvbmZpZ1tdKTogQ29tcGV0aXRvckNvbmZpZ1tdIHtcbiAgICBkYi5jb21wZXRpdG9ycyA9IGxpc3QubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gZGIuY29tcGV0aXRvcnMubWFwKChjKSA9PiAoeyAuLi5jIH0pKTtcbiAgfSxcbiAgc2V0Q29tcGV0aXRvclByb2R1Y3RzKGtleTogc3RyaW5nLCBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSwgcmVmcmVzaGVkQXQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JQcm9kdWN0c1trZXldID0gcHJvZHVjdHM7XG4gICAgZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0W2tleV0gPSByZWZyZXNoZWRBdDtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGVuYWJsZWRPbmx5ID0gdHJ1ZSk6IENvbXBldGl0b3JQcm9kdWN0W10ge1xuICAgIGNvbnN0IGVuYWJsZWQgPSBuZXcgU2V0KFxuICAgICAgZGIuY29tcGV0aXRvcnMuZmlsdGVyKChjKSA9PiAhZW5hYmxlZE9ubHkgfHwgYy5lbmFibGVkKS5tYXAoKGMpID0+IGMua2V5KVxuICAgICk7XG4gICAgY29uc3Qgb3V0OiBDb21wZXRpdG9yUHJvZHVjdFtdID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCBsaXN0XSBvZiBPYmplY3QuZW50cmllcyhkYi5jb21wZXRpdG9yUHJvZHVjdHMpKSB7XG4gICAgICBpZiAoIWVuYWJsZWQuaGFzKGtleSkpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBwIG9mIGxpc3QpIG91dC5wdXNoKHApO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9LFxuICBnZXRDb21wZXRpdG9yUmVmcmVzaGVkQXQoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gICAgcmV0dXJuIHsgLi4uZGIuY29tcGV0aXRvclJlZnJlc2hlZEF0IH07XG4gIH0sXG4gIHNldENvbXBldGl0b3JNYXRjaGVzKG1hdGNoZXM6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPik6IHZvaWQge1xuICAgIGRiLmNvbXBldGl0b3JNYXRjaGVzID0gbWF0Y2hlcztcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0Q29tcGV0aXRvck1hdGNoZXMoZ2FtZUlkOiBzdHJpbmcpOiBDb21wZXRpdG9yTWF0Y2hbXSB7XG4gICAgcmV0dXJuIGRiLmNvbXBldGl0b3JNYXRjaGVzW2dhbWVJZF0gPz8gW107XG4gIH0sXG4gIGdldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZyk6IFByb2R1Y3REZXRhaWwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBkYi5wcm9kdWN0RGV0YWlsc1tpZF07XG4gIH0sXG4gIHNldFByb2R1Y3REZXRhaWwoaWQ6IHN0cmluZywgZGV0YWlsOiBQcm9kdWN0RGV0YWlsKTogdm9pZCB7XG4gICAgZGIucHJvZHVjdERldGFpbHNbaWRdID0gZGV0YWlsO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICB9LFxuICBsaXN0V2F0Y2hsaXN0KCk6IFdhdGNoZWRHYW1lW10ge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKGRiLndhdGNobGlzdCk7XG4gIH0sXG4gIGdldFdhdGNoZWQoaWQ6IHN0cmluZyk6IFdhdGNoZWRHYW1lIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gZGIud2F0Y2hsaXN0W2lkXTtcbiAgfSxcbiAgdXBzZXJ0V2F0Y2hlZChlbnRyeTogV2F0Y2hlZEdhbWUpOiBXYXRjaGVkR2FtZSB7XG4gICAgZGIud2F0Y2hsaXN0W2VudHJ5LmlkXSA9IGVudHJ5O1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB7IC4uLmVudHJ5IH07XG4gIH0sXG4gIHBhdGNoV2F0Y2hlZChpZDogc3RyaW5nLCBwYXRjaDogUGFydGlhbDxXYXRjaGVkR2FtZT4pOiBXYXRjaGVkR2FtZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBkYi53YXRjaGxpc3RbaWRdO1xuICAgIGlmICghZXhpc3RpbmcpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXBkYXRlZDogV2F0Y2hlZEdhbWUgPSB7IC4uLmV4aXN0aW5nLCAuLi5wYXRjaCB9O1xuICAgIGRiLndhdGNobGlzdFtpZF0gPSB1cGRhdGVkO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiB1cGRhdGVkO1xuICB9LFxuICByZW1vdmVXYXRjaGVkKGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWRiLndhdGNobGlzdFtpZF0pIHJldHVybiBmYWxzZTtcbiAgICBkZWxldGUgZGIud2F0Y2hsaXN0W2lkXTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgZ2V0U291cmNlcygpOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICByZXR1cm4gZGIuc291cmNlcy5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICB9LFxuICBzZXRTb3VyY2VzKGxpc3Q6IFByb3ZpZGVyU291cmNlW10pOiBQcm92aWRlclNvdXJjZVtdIHtcbiAgICBkYi5zb3VyY2VzID0gbGlzdC5tYXAoKHMpID0+ICh7IC4uLnMgfSkpO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICAgIHJldHVybiBkYi5zb3VyY2VzLm1hcCgocykgPT4gKHsgLi4ucyB9KSk7XG4gIH0sXG4gIGdldEF1dG9SZWZyZXNoSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gZGIuYXV0b1JlZnJlc2hJbnRlcnZhbEhvdXJzID8/IDA7XG4gIH0sXG4gIHNldEF1dG9SZWZyZXNoSW50ZXJ2YWwoaG91cnM6IG51bWJlcik6IHZvaWQge1xuICAgIGRiLmF1dG9SZWZyZXNoSW50ZXJ2YWxIb3VycyA9IE1hdGgubWF4KDAsIGhvdXJzKTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0UHNQbHVzUHJpY2VzKCk6IERiU2hhcGVbXCJwc1BsdXNQcmljZXNcIl0ge1xuICAgIHJldHVybiBkYi5wc1BsdXNQcmljZXM7XG4gIH0sXG4gIHNldFBzUGx1c1ByaWNlcyhkYXRhOiBEYlNoYXBlW1wicHNQbHVzUHJpY2VzXCJdKTogdm9pZCB7XG4gICAgZGIucHNQbHVzUHJpY2VzID0gZGF0YTtcbiAgICBzY2hlZHVsZVNhdmUoKTtcbiAgfSxcbiAgZ2V0U3VwYWJhc2UoKTogU3VwYWJhc2VDb25maWcgfCBudWxsIHtcbiAgICByZXR1cm4gZGIuc3VwYWJhc2UgPyB7IC4uLmRiLnN1cGFiYXNlIH0gOiBudWxsO1xuICB9LFxuICBzZXRTdXBhYmFzZShjZmc6IFN1cGFiYXNlQ29uZmlnIHwgbnVsbCk6IHZvaWQge1xuICAgIGRiLnN1cGFiYXNlID0gY2ZnID8geyAuLi5jZmcgfSA6IG51bGw7XG4gICAgc2NoZWR1bGVTYXZlKCk7XG4gIH0sXG4gIGdldEhpdFB1Ymxpc2hlcnMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBbLi4uZGIuaGl0UHVibGlzaGVyc107XG4gIH0sXG4gIHNldEhpdFB1Ymxpc2hlcnMobGlzdDogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBkYi5oaXRQdWJsaXNoZXJzID0gWy4uLmxpc3RdO1xuICAgIHNjaGVkdWxlU2F2ZSgpO1xuICB9LFxuICBmbHVzaCgpOiB2b2lkIHtcbiAgICBpZiAoc2F2ZVRpbWVyKSBjbGVhclRpbWVvdXQoc2F2ZVRpbWVyKTtcbiAgICBwZXJzaXN0KCk7XG4gIH0sXG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJpY2luZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcmljaW5nLnRzXCI7aW1wb3J0IHR5cGUgeyBQcmljaW5nU2V0dGluZ3MgfSBmcm9tIFwiLi9zdG9yZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNhbGVQcmljZXMge1xuICBjb3N0Q2xwOiBudW1iZXI7XG4gIHByaW1hcmlhOiBudW1iZXI7XG4gIHNlY3VuZGFyaWE6IG51bWJlcjtcbiAgLyoqIFJldmVudWUgaWYgYm90aCBwcmltYXJpYSBzbG90cyBzZWxsICsgMSBzZWN1bmRhcmlhICovXG4gIHRvdGFsUmV2ZW51ZTogbnVtYmVyO1xuICAvKiogTmV0IHByb2ZpdCBmcm9tIGEgZnVsbCBzZWxsLXRocm91Z2ggKDJcdTAwRDcgcHJpbWFyaWEgKyAxXHUwMEQ3IHNlY3VuZGFyaWEpICovXG4gIG5ldFByb2ZpdDogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiByb3VuZFRvKHZhbHVlOiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7XG4gIGlmIChzdGVwIDw9IDApIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlKTtcbiAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgLyBzdGVwKSAqIHN0ZXA7XG59XG5cbi8qKiBQc3ljaG9sb2dpY2FsIHByaWNpbmc6IHJvdW5kcyB0byBuZWFyZXN0IFguOTkwIGZvciBjb25zdW1lci1mYWNpbmcgcHJpY2VzLlxuICogIGUuZy4gMTQyNDAgXHUyMTkyIDE0OTkwLCA4ODAwIFx1MjE5MiA4OTkwLCAzMjAwIFx1MjE5MiAyOTkwICovXG5mdW5jdGlvbiByb3VuZENvbW1lcmNpYWwodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICh2YWx1ZSA8IDEwMDApIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlIC8gMTAwKSAqIDEwMDtcbiAgcmV0dXJuIE1hdGguY2VpbCh2YWx1ZSAvIDEwMDApICogMTAwMCAtIDEwO1xufVxuXG5mdW5jdGlvbiBleGNoYW5nZVJhdGUoY3VycmVuY3k6IHN0cmluZywgY2ZnOiBQcmljaW5nU2V0dGluZ3MpOiBudW1iZXIge1xuICBzd2l0Y2ggKGN1cnJlbmN5KSB7XG4gICAgY2FzZSBcIkJSTFwiOiByZXR1cm4gY2ZnLmJybFRvQ2xwO1xuICAgIGNhc2UgXCJUUllcIjogcmV0dXJuIGNmZy50cnlUb0NscDtcbiAgICBjYXNlIFwiSlBZXCI6IHJldHVybiBjZmcuanB5VG9DbHA7XG4gICAgY2FzZSBcIlVTRFwiOlxuICAgIGRlZmF1bHQ6ICAgIHJldHVybiBjZmcudXNkVG9DbHA7XG4gIH1cbn1cblxuZnVuY3Rpb24gYmFsYW5jZURpc2NvdW50KGN1cnJlbmN5OiBzdHJpbmcsIGNmZzogUHJpY2luZ1NldHRpbmdzKTogbnVtYmVyIHtcbiAgc3dpdGNoIChjdXJyZW5jeSkge1xuICAgIGNhc2UgXCJCUkxcIjogcmV0dXJuIGNmZy5iYWxhbmNlRGlzY291bnRCcmwgPz8gMS4wO1xuICAgIGNhc2UgXCJUUllcIjogcmV0dXJuIGNmZy5iYWxhbmNlRGlzY291bnRUcnkgPz8gMS4wO1xuICAgIGNhc2UgXCJVU0RcIjpcbiAgICBkZWZhdWx0OiAgICByZXR1cm4gY2ZnLmJhbGFuY2VEaXNjb3VudFVzZCA/PyAxLjA7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVTYWxlUHJpY2VzKFxuICBwcmljZUNlbnRzOiBudW1iZXIgfCBudWxsLFxuICBjZmc6IFByaWNpbmdTZXR0aW5ncyxcbiAgY3VycmVuY3kgPSBcIlVTRFwiXG4pOiBTYWxlUHJpY2VzIHwgbnVsbCB7XG4gIGlmIChwcmljZUNlbnRzID09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBwcmljZSA9IHByaWNlQ2VudHMgLyAxMDA7XG4gIGNvbnN0IHJhdGUgPSBleGNoYW5nZVJhdGUoY3VycmVuY3ksIGNmZyk7XG4gIGNvbnN0IGRpc2NvdW50ID0gYmFsYW5jZURpc2NvdW50KGN1cnJlbmN5LCBjZmcpO1xuICBjb25zdCBjb3N0ID0gcHJpY2UgKiBkaXNjb3VudCAqIHJhdGU7XG4gIGNvbnN0IGNvc3RDbHAgPSByb3VuZFRvKGNvc3QsIGNmZy5yb3VuZFRvKTtcblxuICBjb25zdCBwcmltYXJpYVJhdyA9IGNvc3QgKiBjZmcucHJpbWFyaWFNdWx0O1xuICBjb25zdCBzZWN1bmRhcmlhUmF3ID0gY29zdCAqIGNmZy5zZWN1bmRhcmlhTXVsdDtcblxuICBjb25zdCBwcmltYXJpYSA9IGNmZy5jb21tZXJjaWFsUm91bmRpbmcgIT09IGZhbHNlXG4gICAgPyByb3VuZENvbW1lcmNpYWwocHJpbWFyaWFSYXcpXG4gICAgOiByb3VuZFRvKHByaW1hcmlhUmF3LCBjZmcucm91bmRUbyk7XG4gIGNvbnN0IHNlY3VuZGFyaWEgPSBjZmcuY29tbWVyY2lhbFJvdW5kaW5nICE9PSBmYWxzZVxuICAgID8gcm91bmRDb21tZXJjaWFsKHNlY3VuZGFyaWFSYXcpXG4gICAgOiByb3VuZFRvKHNlY3VuZGFyaWFSYXcsIGNmZy5yb3VuZFRvKTtcblxuICBjb25zdCB0b3RhbFJldmVudWUgPSBwcmltYXJpYSAqIDIgKyBzZWN1bmRhcmlhO1xuICByZXR1cm4ge1xuICAgIGNvc3RDbHAsXG4gICAgcHJpbWFyaWEsXG4gICAgc2VjdW5kYXJpYSxcbiAgICB0b3RhbFJldmVudWUsXG4gICAgbmV0UHJvZml0OiB0b3RhbFJldmVudWUgLSBjb3N0Q2xwLFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHNuLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3Bzbi50c1wiOy8qKlxuICogUFNOIFN0b3JlIHNjcmFwZXIuXG4gKlxuICogUFNOIG5vdyBzZXJ2ZXItc2lkZS1yZW5kZXJzIHRoZSBjYXRlZ29yeSBwYWdlcyAoTmV4dC5qcykuIFRoZSBwcm9kdWN0IGdyaWRcbiAqIGlzIGVtYmVkZGVkIGFzIEpTT04gaW5zaWRlIGEgYDxzY3JpcHQgaWQ9XCJfX05FWFRfREFUQV9fXCI+YCB0YWcgXHUyMDE0IHdlIGZldGNoXG4gKiB0aGUgSFRNTCBhbmQgcGFyc2UgdGhhdCBibG9iIGluc3RlYWQgb2YgaGl0dGluZyB0aGUgR3JhcGhRTCBlbmRwb2ludCB3aXRoXG4gKiBwZXJzaXN0ZWQgcXVlcmllcy4gTm8gc2hhMjU2IGhhc2hlcyB0byBrZWVwIHVwIHRvIGRhdGUuXG4gKlxuICogICBHRVQgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vPHJlZ2lvbj4vY2F0ZWdvcnkvPGNhdGVnb3J5SWQ+LzxwYWdlPlxuICpcbiAqIFdlIHBhZ2luYXRlIGJ5IHdhbGtpbmcgLzEsIC8yLCAvMyB1bnRpbCBhIHBhZ2UgcmV0dXJucyBubyBuZXcgcHJvZHVjdHMuXG4gKi9cbmltcG9ydCB0eXBlIHsgR2FtZSwgUHNuQ29uZmlnIH0gZnJvbSBcIi4vc3RvcmVcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuLyoqIEtlcHQgZm9yIEFQSSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIG9sZCBjbGllbnQ7IG5vIGxvbmdlciB0aHJvd24uICovXG5leHBvcnQgY2xhc3MgUGVyc2lzdGVkUXVlcnlOb3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIlBTTiBwZXJzaXN0ZWQgcXVlcnkgaGFzaCBpcyBzdGFsZS5cIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBzbkFwaUVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuLyoqIEVudW0gdmFsdWVzIFBTTiB1c2VzIGZvciByZWFsIGdhbWVzIChub3QgRExDIC8gY3VycmVuY3kgLyB0aGVtZXMgL1xuICogIGF2YXRhcnMgLyBzdWJzY3JpcHRpb25zKS4gYHN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uYCBpcyB0aGUgc3RhYmxlXG4gKiAgbm9uLWxvY2FsaXplZCBmaWVsZDsgd2UgYWxzbyBhY2NlcHQgdGhlIGh1bWFuIHN0cmluZ3MgYXMgZmFsbGJhY2suXG4gKiAgQ29uZmlybWVkIGFnYWluc3QgbGl2ZSBlbi1VUyBjYXRhbG9nIG9uIDIwMjYtMDQtMTMuICovXG5jb25zdCBHQU1FX0VOVU0gPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZVTExfR0FNRVwiLFxuICBcIkdBTUVfQlVORExFXCIsXG4gIFwiUFJFTUlVTV9FRElUSU9OXCIsXG4gIFwiQlVORExFXCIsXG5dKTtcblxuY29uc3QgR0FNRV9MQUJFTFMgPSBuZXcgU2V0PHN0cmluZz4oW1xuICBcIkZ1bGwgR2FtZVwiLFxuICBcIkdhbWUgQnVuZGxlXCIsXG4gIFwiUHJlbWl1bSBFZGl0aW9uXCIsXG4gIFwiQnVuZGxlXCIsXG5dKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVsbEdhbWVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCk6IGJvb2xlYW4ge1xuICBjb25zdCBlID0gU3RyaW5nKHJhdy5zdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbiB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICBpZiAoZSAmJiBHQU1FX0VOVU0uaGFzKGUpKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgbCA9IFN0cmluZyhyYXcubG9jYWxpemVkU3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHwgXCJcIikudHJpbSgpO1xuICByZXR1cm4gR0FNRV9MQUJFTFMuaGFzKGwpO1xufVxuXG5mdW5jdGlvbiBwcmljZVRvQ2VudHModjogdW5rbm93bik6IG51bWJlciB8IG51bGwge1xuICBpZiAodiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcyA9IFN0cmluZyh2KS50cmltKCk7XG4gIGlmICghcyB8fCAvXmZyZWUkL2kudGVzdChzKSB8fCAvXmdyYXRpcyQvaS50ZXN0KHMpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2xlYW5lZCA9IHMucmVwbGFjZSgvW14wLTkuLC1dL2csIFwiXCIpLnJlcGxhY2UoLywvZywgXCIuXCIpO1xuICBjb25zdCBwYXJ0cyA9IGNsZWFuZWQuc3BsaXQoXCIuXCIpO1xuICBjb25zdCBub3JtID1cbiAgICBwYXJ0cy5sZW5ndGggPiAyID8gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4oXCJcIikgKyBcIi5cIiArIHBhcnRzLmF0KC0xKSA6IGNsZWFuZWQ7XG4gIGNvbnN0IG4gPSBOdW1iZXIobm9ybSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIE1hdGgucm91bmQobiAqIDEwMCk7XG59XG5cbmludGVyZmFjZSBSYXdQcm9kdWN0IHtcbiAgaWQ/OiBzdHJpbmc7XG4gIHByb2R1Y3RJZD86IHN0cmluZztcbiAgY29uY2VwdElkPzogc3RyaW5nO1xuICBuYW1lPzogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbiAgcGxhdGZvcm1zPzogc3RyaW5nW10gfCBzdHJpbmc7XG4gIC8qKiBQU04gY2xhc3NpZmllcyBpdGVtcyBoZXJlOiBcIkZ1bGwgR2FtZVwiLCBcIkFkZC1PblwiLCBcIkdhbWUgQnVuZGxlXCIsXG4gICAqICBcIkN1cnJlbmN5XCIsIFwiQXZhdGFyXCIsIFwiVGhlbWVcIiwgXCJQUyBQbHVzIFx1MDBCNyBGdWxsIEdhbWVcIiwgZXRjLiAqL1xuICBsb2NhbGl6ZWRTdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcbiAgc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24/OiBzdHJpbmc7XG4gIC8qKiBFbnVtLWlzaDogR0FNRSAvIEJVTkRMRSAvIEFERE9OIC8gQ1VSUkVOQ1kgLyBUSEVNRSAvIEFQUCAvIFNVQlNDUklQVElPTi4gKi9cbiAgcHJvZHVjdFR5cGU/OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIG1lZGlhPzogQXJyYXk8eyByb2xlPzogc3RyaW5nOyB1cmw/OiBzdHJpbmc7IHR5cGU/OiBzdHJpbmcgfT4gfCBudWxsO1xuICB3ZWJjdGFzPzogQXJyYXk8e1xuICAgIHByaWNlPzoge1xuICAgICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgICBiYXNlUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkVmFsdWU/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgICBkaXNjb3VudFRleHQ/OiBzdHJpbmc7XG4gICAgICBlbmRUaW1lPzogc3RyaW5nO1xuICAgIH07XG4gIH0+IHwgbnVsbDtcbiAgcHJpY2U/OiB7XG4gICAgYmFzZVByaWNlVmFsdWU/OiBzdHJpbmc7XG4gICAgYmFzZVByaWNlPzogc3RyaW5nO1xuICAgIGRpc2NvdW50ZWRWYWx1ZT86IHN0cmluZztcbiAgICBkaXNjb3VudGVkUHJpY2U/OiBzdHJpbmc7XG4gICAgZGlzY291bnRUZXh0Pzogc3RyaW5nO1xuICAgIGVuZFRpbWU/OiBzdHJpbmc7XG4gIH07XG4gIC8qKiBDb3Zlci9wb3J0cmFpdCBpbWFnZSBleHRyYWN0ZWQgZnJvbSB0aGUgSFRNTCBncmlkIHRpbGUgKDQ0MFx1MDBENzQ0MCkuXG4gICAqICBUaGlzIGlzIHRoZSBhY3R1YWwgYm94IGFydCBzaG93biBpbiB0aGUgc3RvcmUsIG5vdCB0aGUgYmFubmVyLiAqL1xuICB0aWxlSW1hZ2VVcmw/OiBzdHJpbmc7XG59XG5cbi8qKiBTaGFwZSByZXR1cm5lZCBieSBgaW5zcGVjdFByb2R1Y3RUeXBlc2AgXHUyMDE0IHVzZWQgYnkgdGhlIGRlYnVnIHJvdXRlIHRvXG4gKiAgZmlndXJlIG91dCB0aGUgcmVhbCBjbGFzc2lmaWNhdGlvbiBmaWVsZCBuYW1lcyBiZWZvcmUgd3JpdGluZyB0aGUgZmlsdGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0VHlwZUluc3BlY3Rpb24ge1xuICB0b3RhbFNlZW46IG51bWJlcjtcbiAgY2xhc3NpZmljYXRpb25zOiBBcnJheTx7XG4gICAgY2xhc3NpZmljYXRpb246IHN0cmluZztcbiAgICBwcm9kdWN0VHlwZTogc3RyaW5nO1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgc2FtcGxlczogc3RyaW5nW107XG4gIH0+O1xuICAvKiogRXZlcnkgdG9wLWxldmVsIGtleSBldmVyIHNlZW4gb24gYSBwcm9kdWN0IG9iamVjdCwgd2l0aCBhbiBleGFtcGxlXG4gICAqICB2YWx1ZSBmcm9tIHRoZSBmaXJzdCBwcm9kdWN0IHRoYXQgaGFkIGl0LiBIZWxwcyBzcG90IGFueSBmaWVsZCBuYW1lXG4gICAqICB2YXJpYXRpb24gd2UgbWlzc2VkLiAqL1xuICBvYnNlcnZlZEtleXM6IEFycmF5PHsga2V5OiBzdHJpbmc7IGV4YW1wbGU6IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3BlY3RQcm9kdWN0VHlwZXMoXG4gIGNmZzogUHNuQ29uZmlnXG4pOiBQcm9taXNlPFByb2R1Y3RUeXBlSW5zcGVjdGlvbj4ge1xuICBjb25zdCBieUNvbWJvID0gbmV3IE1hcDxcbiAgICBzdHJpbmcsXG4gICAgeyBjbGFzc2lmaWNhdGlvbjogc3RyaW5nOyBwcm9kdWN0VHlwZTogc3RyaW5nOyBjb3VudDogbnVtYmVyOyBzYW1wbGVzOiBzdHJpbmdbXSB9XG4gID4oKTtcbiAgY29uc3Qgb2JzZXJ2ZWRLZXlzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgYXdhaXQgKGNvbnN0IHJhdyBvZiBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyhjZmcpKSB7XG4gICAgdG90YWwrKztcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhyYXcpKSB7XG4gICAgICBpZiAob2JzZXJ2ZWRLZXlzLmhhcyhrKSkgY29udGludWU7XG4gICAgICBsZXQgZXhhbXBsZTogc3RyaW5nO1xuICAgICAgaWYgKHYgPT0gbnVsbCkgZXhhbXBsZSA9IFwibnVsbFwiO1xuICAgICAgZWxzZSBpZiAodHlwZW9mIHYgPT09IFwib2JqZWN0XCIpIGV4YW1wbGUgPSBKU09OLnN0cmluZ2lmeSh2KS5zbGljZSgwLCAxMjApO1xuICAgICAgZWxzZSBleGFtcGxlID0gU3RyaW5nKHYpLnNsaWNlKDAsIDEyMCk7XG4gICAgICBvYnNlcnZlZEtleXMuc2V0KGssIGV4YW1wbGUpO1xuICAgIH1cbiAgICBjb25zdCBjbHMgPVxuICAgICAgcmF3LmxvY2FsaXplZFN0b3JlRGlzcGxheUNsYXNzaWZpY2F0aW9uIHx8XG4gICAgICByYXcuc3RvcmVEaXNwbGF5Q2xhc3NpZmljYXRpb24gfHxcbiAgICAgIFwiXCI7XG4gICAgY29uc3QgcHQgPSByYXcucHJvZHVjdFR5cGUgfHwgcmF3LnR5cGUgfHwgXCJcIjtcbiAgICBjb25zdCBrZXkgPSBgJHtjbHN9XFx1MDAwMSR7cHR9YDtcbiAgICBjb25zdCBleGlzdGluZyA9IGJ5Q29tYm8uZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICBleGlzdGluZy5jb3VudCsrO1xuICAgICAgaWYgKGV4aXN0aW5nLnNhbXBsZXMubGVuZ3RoIDwgMyAmJiByYXcubmFtZSkgZXhpc3Rpbmcuc2FtcGxlcy5wdXNoKHJhdy5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnlDb21iby5zZXQoa2V5LCB7XG4gICAgICAgIGNsYXNzaWZpY2F0aW9uOiBjbHMsXG4gICAgICAgIHByb2R1Y3RUeXBlOiBwdCxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHNhbXBsZXM6IHJhdy5uYW1lID8gW3Jhdy5uYW1lXSA6IFtdLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY2xhc3NpZmljYXRpb25zID0gWy4uLmJ5Q29tYm8udmFsdWVzKCldLnNvcnQoKGEsIGIpID0+IGIuY291bnQgLSBhLmNvdW50KTtcbiAgY29uc3Qga2V5cyA9IFsuLi5vYnNlcnZlZEtleXMuZW50cmllcygpXVxuICAgIC5zb3J0KChbYV0sIFtiXSkgPT4gYS5sb2NhbGVDb21wYXJlKGIpKVxuICAgIC5tYXAoKFtrZXksIGV4YW1wbGVdKSA9PiAoeyBrZXksIGV4YW1wbGUgfSkpO1xuXG4gIHJldHVybiB7IHRvdGFsU2VlbjogdG90YWwsIGNsYXNzaWZpY2F0aW9ucywgb2JzZXJ2ZWRLZXlzOiBrZXlzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9kdWN0KHJhdzogUmF3UHJvZHVjdCwgbm93OiBzdHJpbmcpOiBHYW1lIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gcmF3LmlkIHx8IHJhdy5wcm9kdWN0SWQgfHwgcmF3LmNvbmNlcHRJZDtcbiAgaWYgKCFpZCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgbmFtZSA9IHJhdy5uYW1lIHx8IHJhdy50aXRsZSB8fCBcIlwiO1xuICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gIC8vIEltYWdlOiBwcmVmZXIgdGhlIHRpbGUgaW1hZ2UgZXh0cmFjdGVkIGZyb20gdGhlIEhUTUwgZ3JpZCAodGhlIGFjdHVhbFxuICAvLyA0NDBcdTAwRDc0NDAgY292ZXIgYXJ0IHRoZSBzdG9yZSBkaXNwbGF5cykuIEZhbGwgYmFjayB0byBtZWRpYSByb2xlcyBmcm9tIEpTT04uXG4gIGxldCBpbWFnZVVybDogc3RyaW5nIHwgbnVsbCA9IHJhdy50aWxlSW1hZ2VVcmwgfHwgbnVsbDtcbiAgaWYgKCFpbWFnZVVybCkge1xuICAgIGNvbnN0IG1lZGlhID0gcmF3Lm1lZGlhIHx8IFtdO1xuICAgIGNvbnN0IHByZWZlcnJlZFBvcnRyYWl0ID0gW1wiUE9SVFJBSVRfQkFOTkVSXCIsIFwiR0FNRUhVQl9DT1ZFUl9BUlRcIiwgXCJCT1hBUlRcIl07XG4gICAgY29uc3QgZmFsbGJhY2tSb2xlcyA9IFtcIk1BU1RFUlwiLCBcIlBSRVZJRVdfR0FNRV9BUlRcIl07XG4gICAgZm9yIChjb25zdCBtIG9mIG1lZGlhKSB7XG4gICAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICAgIGlmIChwcmVmZXJyZWRQb3J0cmFpdC5pbmNsdWRlcyhyb2xlKSkge1xuICAgICAgICBpbWFnZVVybCA9IG0udXJsID8/IG51bGw7XG4gICAgICAgIGlmIChpbWFnZVVybCkgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaW1hZ2VVcmwpIHtcbiAgICAgIGZvciAoY29uc3QgbSBvZiBtZWRpYSkge1xuICAgICAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKGZhbGxiYWNrUm9sZXMuaW5jbHVkZXMocm9sZSkpIHtcbiAgICAgICAgICBpbWFnZVVybCA9IG0udXJsID8/IG51bGw7XG4gICAgICAgICAgaWYgKGltYWdlVXJsKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWltYWdlVXJsICYmIG1lZGlhWzBdPy51cmwpIGltYWdlVXJsID0gbWVkaWFbMF0udXJsO1xuICB9XG5cbiAgY29uc3QgcGxhdGZvcm1zID0gQXJyYXkuaXNBcnJheShyYXcucGxhdGZvcm1zKVxuICAgID8gcmF3LnBsYXRmb3Jtcy5qb2luKFwiLFwiKVxuICAgIDogcmF3LnBsYXRmb3JtcyA/PyBcIlwiO1xuXG4gIGNvbnN0IHByaWNlID0gcmF3LndlYmN0YXM/LlswXT8ucHJpY2UgPz8gcmF3LnByaWNlID8/IHt9O1xuICBjb25zdCBwcmljZU9yaWdpbmFsQ2VudHMgPSBwcmljZVRvQ2VudHMocHJpY2UuYmFzZVByaWNlVmFsdWUgPz8gcHJpY2UuYmFzZVByaWNlKTtcbiAgbGV0IHByaWNlRGlzY291bnRlZENlbnRzID0gcHJpY2VUb0NlbnRzKFxuICAgIHByaWNlLmRpc2NvdW50ZWRWYWx1ZSA/PyBwcmljZS5kaXNjb3VudGVkUHJpY2VcbiAgKTtcbiAgaWYgKHByaWNlRGlzY291bnRlZENlbnRzID09IG51bGwpIHByaWNlRGlzY291bnRlZENlbnRzID0gcHJpY2VPcmlnaW5hbENlbnRzO1xuXG4gIGxldCBkaXNjb3VudFBlcmNlbnQgPSAwO1xuICBjb25zdCBkdCA9IHByaWNlLmRpc2NvdW50VGV4dCB8fCBcIlwiO1xuICBjb25zdCBtID0gLyhcXGQrKS8uZXhlYyhTdHJpbmcoZHQpKTtcbiAgaWYgKG0pIGRpc2NvdW50UGVyY2VudCA9IHBhcnNlSW50KG1bMV0sIDEwKTtcbiAgaWYgKFxuICAgICFkaXNjb3VudFBlcmNlbnQgJiZcbiAgICBwcmljZU9yaWdpbmFsQ2VudHMgJiZcbiAgICBwcmljZURpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgcHJpY2VPcmlnaW5hbENlbnRzID4gMCAmJlxuICAgIHByaWNlRGlzY291bnRlZENlbnRzIDwgcHJpY2VPcmlnaW5hbENlbnRzXG4gICkge1xuICAgIGRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAoKHByaWNlT3JpZ2luYWxDZW50cyAtIHByaWNlRGlzY291bnRlZENlbnRzKSAqIDEwMCkgLyBwcmljZU9yaWdpbmFsQ2VudHNcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpZDogU3RyaW5nKGlkKSxcbiAgICBwbGF0Zm9ybTogXCJwc25cIiBhcyBjb25zdCxcbiAgICByZWdpb246IFwidXNcIixcbiAgICBuYW1lLFxuICAgIGltYWdlVXJsLFxuICAgIHN0b3JlVXJsOiBgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vZW4tdXMvcHJvZHVjdC8ke2lkfWAsXG4gICAgcGxhdGZvcm1zLFxuICAgIGN1cnJlbmN5OiBcIlVTRFwiLFxuICAgIHByaWNlT3JpZ2luYWxDZW50cyxcbiAgICBwcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgZGlzY291bnRFbmRBdDogcHJpY2UuZW5kVGltZSB8fCBudWxsLFxuICAgIHNlbGVjdGVkOiBmYWxzZSxcbiAgICBwdWJsaXNoZWQ6IGZhbHNlLFxuICAgIG5vdGVzOiBcIlwiLFxuICAgIHlvdXR1YmVVcmw6IFwiXCIsXG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIGZpcnN0U2VlbkF0OiBub3csXG4gICAgbGFzdFNlZW5BdDogbm93LFxuICAgIHVwZGF0ZWRBdDogbm93LFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEh0bWwodXJsOiBzdHJpbmcsIHJlZ2lvbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93biA9IG51bGw7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNDsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgICBhY2NlcHQ6XG4gICAgICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IHJlZ2lvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJlc1wiKSA/IFwiZXNcIiA6IFwiZW4tVVNcIixcbiAgICAgICAgICBcIngtcHNuLXN0b3JlLWxvY2FsZS1vdmVycmlkZVwiOiByZWdpb24sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDA0KSB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoYENhdGVnb3J5IG5vdCBmb3VuZCAoNDA0KTogJHt1cmx9YCk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwMylcbiAgICAgICAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFwiUFNOIHJldHVybmVkIDQwMyAoSVAvQ2xvdWRmbGFyZSBibG9jaylcIik7XG4gICAgICBpZiAoci5zdGF0dXMgPj0gNTAwKSB0aHJvdyBuZXcgRXJyb3IoYFBTTiAke3Iuc3RhdHVzfWApO1xuICAgICAgcmV0dXJuIGF3YWl0IHIudGV4dCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHRocm93IGU7XG4gICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgUHNuQXBpRXJyb3IoXG4gICAgYFBTTiBIVE1MIGZldGNoIGZhaWxlZCBhZnRlciByZXRyaWVzOiAkeyhsYXN0RXJyb3IgYXMgRXJyb3IpPy5tZXNzYWdlIHx8IGxhc3RFcnJvcn1gXG4gICk7XG59XG5cbi8qKiBFeHRyYWN0IHRoZSBKU09OIHBheWxvYWQgZnJvbSBgPHNjcmlwdCBpZD1cIl9fTkVYVF9EQVRBX19cIj5cdTIwMjY8L3NjcmlwdD5gLiAqL1xuZnVuY3Rpb24gZXh0cmFjdE5leHREYXRhKGh0bWw6IHN0cmluZyk6IGFueSB8IG51bGwge1xuICBjb25zdCBtID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoXG4gICAgaHRtbFxuICApO1xuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKG1bMV0pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHdhbGsgYSBKU09OIHRyZWUgYW5kIGNvbGxlY3QgYW55dGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgUFNOXG4gKiBwcm9kdWN0IGVudHJ5LiBNYXRjaGVzIG9iamVjdHMgd2l0aCBhbiBgaWRgL2Bwcm9kdWN0SWRgIHBsdXMgZWl0aGVyIGFcbiAqIGBuYW1lYC9gdGl0bGVgIGFuZCBhIGBwcmljZWAvYHdlYmN0YXNgLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvZHVjdHMobm9kZTogdW5rbm93biwgb3V0OiBNYXA8c3RyaW5nLCBSYXdQcm9kdWN0Pik6IHZvaWQge1xuICBpZiAoIW5vZGUpIHJldHVybjtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICBmb3IgKGNvbnN0IHYgb2Ygbm9kZSkgY29sbGVjdFByb2R1Y3RzKHYsIG91dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlb2Ygbm9kZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuICBjb25zdCBvYmogPSBub2RlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXG4gIGNvbnN0IGlkID0gKG9iai5pZCB8fCBvYmoucHJvZHVjdElkIHx8IG9iai5jb25jZXB0SWQpIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgbmFtZSA9IChvYmoubmFtZSB8fCBvYmoudGl0bGUpIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgaGFzUHJpY2UgPVxuICAgIChvYmoucHJpY2UgJiYgdHlwZW9mIG9iai5wcmljZSA9PT0gXCJvYmplY3RcIikgfHxcbiAgICAoQXJyYXkuaXNBcnJheShvYmoud2ViY3RhcykgJiYgb2JqLndlYmN0YXMubGVuZ3RoID4gMCk7XG4gIC8vIFByb2R1Y3QgSURzIG9uIFBTTiBsb29rIGxpa2UgXCJVUDkwMDAtQ1VTQTA3NDA4XzAwLVJFREVNUFRJT04yMDAwMDAwXCJcbiAgLy8gKGNvbnRhaW4gYSBoeXBoZW4gKyB1bmRlcnNjb3JlKS4gRmlsdGVyIG9uIHRoYXQgdG8gYXZvaWQgcGlja2luZyB1cFxuICAvLyBhcmJpdHJhcnkgZW50aXRpZXMgd2l0aCBhbiBgaWRgLlxuICBpZiAoXG4gICAgaWQgJiZcbiAgICB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIgJiZcbiAgICAvXltBLVpdezJ9XFxkezR9LS8udGVzdChpZCkgJiZcbiAgICBuYW1lICYmXG4gICAgaGFzUHJpY2UgJiZcbiAgICAhb3V0LmhhcyhpZClcbiAgKSB7XG4gICAgb3V0LnNldChpZCwgb2JqIGFzIFJhd1Byb2R1Y3QpO1xuICB9XG5cbiAgZm9yIChjb25zdCB2IG9mIE9iamVjdC52YWx1ZXMob2JqKSkgY29sbGVjdFByb2R1Y3RzKHYsIG91dCk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjb3Zlci9wb3J0cmFpdCBpbWFnZSBVUkxzIGZyb20gdGhlIEhUTUwgZ3JpZCB0aWxlcy5cbiAqIEVhY2ggdGlsZSBoYXMgYSBgZGF0YS10ZWxlbWV0cnktbWV0YWAgd2l0aCB0aGUgcHJvZHVjdCBJRCBhbmQgYW4gYDxpbWc+YFxuICogd2l0aCB0aGUgYWN0dWFsIGNvdmVyIGFydCAodGhlIDQ0MFx1MDBENzQ0MCBwb3J0cmFpdCBpbWFnZSB0aGUgc3RvcmUgZGlzcGxheXMpLlxuICovXG5mdW5jdGlvbiBleHRyYWN0VGlsZUltYWdlcyhodG1sOiBzdHJpbmcpOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICBjb25zdCBtZXRhczogQXJyYXk8eyBpZDogc3RyaW5nOyBwb3M6IG51bWJlciB9PiA9IFtdO1xuICBjb25zdCBtZXRhUmUgPSAvZGF0YS10ZWxlbWV0cnktbWV0YT1bXCInXShcXHtbXlwiJ10qXFx9KVtcIiddL2c7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBtZXRhUmUuZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmF3ID0gbVsxXS5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJykucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpO1xuICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UocmF3KTtcbiAgICAgIGlmIChqc29uLmlkKSBtZXRhcy5wdXNoKHsgaWQ6IGpzb24uaWQsIHBvczogbS5pbmRleCB9KTtcbiAgICB9IGNhdGNoIHsgLyogc2tpcCBtYWxmb3JtZWQgKi8gfVxuICB9XG5cbiAgY29uc3QgaW1nczogQXJyYXk8eyB1cmw6IHN0cmluZzsgcG9zOiBudW1iZXIgfT4gPSBbXTtcbiAgY29uc3QgaW1nUmUgPSAvZGF0YS1xYT1cIlteXCJdKiNnYW1lLWFydCNpbWFnZSNpbWFnZVwiW14+XSpcXGJzcmM9XCIoW15cIl0rKVwiL2c7XG4gIHdoaWxlICgobSA9IGltZ1JlLmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgaW1ncy5wdXNoKHsgdXJsOiBtWzFdLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKSwgcG9zOiBtLmluZGV4IH0pO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXRhcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG1ldGEgPSBtZXRhc1tpXTtcbiAgICBjb25zdCBuZXh0UG9zID0gbWV0YXNbaSArIDFdPy5wb3MgPz8gSW5maW5pdHk7XG4gICAgY29uc3QgaW1nID0gaW1ncy5maW5kKCh4KSA9PiB4LnBvcyA+IG1ldGEucG9zICYmIHgucG9zIDwgbmV4dFBvcyk7XG4gICAgaWYgKGltZykge1xuICAgICAgLy8gU3RyaXAgP3c9NDQwIHJlc2l6ZSBwYXJhbSBcdTIxOTIgZnVsbCByZXNvbHV0aW9uIGJhc2UgVVJMXG4gICAgICBjb25zdCBxSWR4ID0gaW1nLnVybC5pbmRleE9mKFwiP1wiKTtcbiAgICAgIG1hcC5zZXQobWV0YS5pZCwgcUlkeCA+IDAgPyBpbWcudXJsLnN1YnN0cmluZygwLCBxSWR4KSA6IGltZy51cmwpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5mdW5jdGlvbiBidWlsZENhdGVnb3J5VXJsKGNmZzogUHNuQ29uZmlnLCBwYWdlOiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyByZWdpb24gbGlrZSBcImVuLVVTXCIgXHUyMTkyIFwiZW4tdXNcIlxuICBjb25zdCByZWdpb25QYXRoID0gY2ZnLnJlZ2lvbi50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gYGh0dHBzOi8vc3RvcmUucGxheXN0YXRpb24uY29tLyR7cmVnaW9uUGF0aH0vY2F0ZWdvcnkvJHtjZmcuZGVhbHNDYXRlZ29yeUlkfS8ke3BhZ2V9YDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiBpdGVyQ2F0ZWdvcnlQcm9kdWN0cyhcbiAgY2ZnOiBQc25Db25maWdcbik6IEFzeW5jR2VuZXJhdG9yPFJhd1Byb2R1Y3Q+IHtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBtYXhQYWdlcyA9IDUwOyAvLyBoYXJkIHN0b3Agc28gYSBidWcgY2FuJ3QgbG9vcCBmb3JldmVyXG5cbiAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgIGNvbnN0IHVybCA9IGJ1aWxkQ2F0ZWdvcnlVcmwoY2ZnLCBwYWdlKTtcbiAgICBjb25zdCBodG1sID0gYXdhaXQgZmV0Y2hIdG1sKHVybCwgY2ZnLnJlZ2lvbik7XG4gICAgY29uc3QgZGF0YSA9IGV4dHJhY3ROZXh0RGF0YShodG1sKTtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGlmIChwYWdlID09PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBQc25BcGlFcnJvcihcbiAgICAgICAgICBcIkNvdWxkIG5vdCBmaW5kIF9fTkVYVF9EQVRBX18gaW4gUFNOIEhUTUwgXHUyMDE0IHBhZ2UgbGF5b3V0IG1heSBoYXZlIGNoYW5nZWQuXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCBmb3VuZCA9IG5ldyBNYXA8c3RyaW5nLCBSYXdQcm9kdWN0PigpO1xuICAgIGNvbGxlY3RQcm9kdWN0cyhkYXRhLCBmb3VuZCk7XG5cbiAgICAvLyBFeHRyYWN0IHRoZSBwb3J0cmFpdC9jb3ZlciBpbWFnZXMgcmVuZGVyZWQgaW4gdGhlIEhUTUwgZ3JpZCB0aWxlcy5cbiAgICBjb25zdCB0aWxlSW1hZ2VzID0gZXh0cmFjdFRpbGVJbWFnZXMoaHRtbCk7XG5cbiAgICBsZXQgbmV3T25UaGlzUGFnZSA9IDA7XG4gICAgZm9yIChjb25zdCBbaWQsIHBdIG9mIGZvdW5kKSB7XG4gICAgICBpZiAoc2Vlbi5oYXMoaWQpKSBjb250aW51ZTtcbiAgICAgIHNlZW4uYWRkKGlkKTtcbiAgICAgIG5ld09uVGhpc1BhZ2UrKztcbiAgICAgIGNvbnN0IHRpbGVJbWcgPSB0aWxlSW1hZ2VzLmdldChpZCk7XG4gICAgICBpZiAodGlsZUltZykgcC50aWxlSW1hZ2VVcmwgPSB0aWxlSW1nO1xuICAgICAgeWllbGQgcDtcbiAgICB9XG4gICAgaWYgKG5ld09uVGhpc1BhZ2UgPT09IDApIGJyZWFrOyAvLyBwYWdpbmF0aW9uIGV4aGF1c3RlZFxuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9jb21wZXRpdG9ycy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9jb21wZXRpdG9ycy50c1wiOy8qKlxuICogQ29tcGV0aXRvciBzY3JhcGVycyArIGZ1enp5IG1hdGNoZXIuXG4gKlxuICogV2Ugc3VwcG9ydCB0d28gZ2VuZXJpYyBzdG9yZWZyb250IHR5cGVzOlxuICogICAtIFNob3BpZnk6ICAgICBHRVQgaHR0cHM6Ly88ZG9tYWluPi9wcm9kdWN0cy5qc29uP2xpbWl0PTI1MCZwYWdlPU5cbiAqICAgLSBXb29Db21tZXJjZTogR0VUIGh0dHBzOi8vPGRvbWFpbj4vd3AtanNvbi93Yy9zdG9yZS92MS9wcm9kdWN0cz9wZXJfcGFnZT0xMDAmcGFnZT1OXG4gKlxuICogQm90aCBleHBvc2UgcHVibGljLCB1bmF1dGhlbnRpY2F0ZWQgSlNPTiBmZWVkcy4gQSB0aGlyZCB0eXBlIFwiYXV0b1wiIHRyaWVzXG4gKiBTaG9waWZ5IGZpcnN0IGFuZCBmYWxscyBiYWNrIHRvIFdvb0NvbW1lcmNlIHNvIHRoZSB1c2VyIGRvZXNuJ3QgaGF2ZSB0b1xuICogZ3Vlc3Mgd2hlbiBhZGRpbmcgYSBuZXcgc3RvcmUuXG4gKlxuICogVGhlIG1hdGNoZXIgbm9ybWFsaXplcyB0aXRsZXMgKGxvd2VyY2FzZWQsIGFjY2VudC1zdHJpcHBlZCwgbm9pc2Ugd29yZHNcbiAqIHJlbW92ZWQpIGFuZCBjb21wYXJlcyBQU04gXHUyMTk0IGNvbXBldGl0b3IgZW50cmllcyB3aXRoIEphY2NhcmQgc2ltaWxhcml0eS5cbiAqL1xuaW1wb3J0IHR5cGUgeyBHYW1lIH0gZnJvbSBcIi4vc3RvcmVcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuZXhwb3J0IHR5cGUgQ29tcGV0aXRvclR5cGUgPSBcInNob3BpZnlcIiB8IFwid29vY29tbWVyY2VcIiB8IFwiaHRtbFwiIHwgXCJqdW1wc2VsbGVyXCIgfCBcImF1dG9cIjtcblxuZXhwb3J0IGludGVyZmFjZSBDb21wZXRpdG9yQ29uZmlnIHtcbiAga2V5OiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGRvbWFpbjogc3RyaW5nO1xuICB0eXBlOiBDb21wZXRpdG9yVHlwZTtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wZXRpdG9yUHJvZHVjdCB7XG4gIHN0b3JlS2V5OiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBwcmljZUNscDogbnVtYmVyO1xuICBhdmFpbGFibGU6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGV0aXRvck1hdGNoIHtcbiAgc3RvcmVLZXk6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHByaWNlQ2xwOiBudW1iZXI7XG4gIGF2YWlsYWJsZTogYm9vbGVhbjtcbiAgc2NvcmU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbXBldGl0b3JGZXRjaEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgc3RvcmVLZXk6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9ybWFsaXphdGlvbiArIHNpbWlsYXJpdHkgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgTk9JU0UgPSBuZXcgU2V0KFtcbiAgXCJmb3JcIixcInRoZVwiLFwib2ZcIixcImFuZFwiLFwib3JcIixcImFcIixcImFuXCIsXCJkZVwiLFwiZGVsXCIsXCJsYVwiLFwiZWxcIixcImxvc1wiLFwibGFzXCIsXG4gIFwicHM0XCIsXCJwczVcIixcInBzM1wiLFwicHN2XCIsXCJwc3BcIixcInhib3hcIixcInBjXCIsXCJzdGVhbVwiLFwibmludGVuZG9cIixcInN3aXRjaFwiLFxuICBcImVkaXRpb25cIixcImVkXCIsXCJkZWx1eGVcIixcImdvbGRcIixcInNpbHZlclwiLFwiYnJvbnplXCIsXCJwbGF0aW51bVwiLFwidWx0aW1hdGVcIixcbiAgXCJnb3R5XCIsXCJzdGFuZGFyZFwiLFwiZGlnaXRhbFwiLFwiY3VlbnRhXCIsXCJwcmltYXJpYVwiLFwic2VjdW5kYXJpYVwiLFwicHJpbWFyaWExXCIsXG4gIFwicHJpbWFyaWEyXCIsXCJnYW1lXCIsXCJqdWVnb1wiLFwianVlZ29zXCIsXCJidW5kbGVcIixcInBhY2tcIixcInNlYXNvblwiLFwicGFzc1wiLFxuICBcImNvbGxlY3Rpb25cIixcImNvbXBsZXRlXCIsXCJyZW1hc3RlcmVkXCIsXCJyZW1ha2VcIixcImhkXCIsXCJkZWZpbml0aXZlXCIsXG4gIFwiYW5uaXZlcnNhcnlcIixcInZlcnNpb25cIixcInZlcnNcIixcInZlclwiLFwiaW5jXCIsXCJpbmNsdXllXCIsXCJwYWNrXCIsXG5dKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplKHRpdGxlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiB0aXRsZVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLm5vcm1hbGl6ZShcIk5GRFwiKVxuICAgIC5yZXBsYWNlKC9bXFx1MDMwMC1cXHUwMzZmXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9bXHUyMTIyXHUwMEFFXHUwMEE5XS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXFtbXlxcXV0qXFxdL2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC9cXChbXildKlxcKS9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvW15hLXowLTkgXSsvZywgXCIgXCIpXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAuZmlsdGVyKCh0KSA9PiB0ICYmICFOT0lTRS5oYXModCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2ltaWxhcml0eShhOiBzdHJpbmdbXSwgYjogc3RyaW5nW10pOiBudW1iZXIge1xuICBpZiAoIWEubGVuZ3RoIHx8ICFiLmxlbmd0aCkgcmV0dXJuIDA7XG4gIGNvbnN0IHNhID0gbmV3IFNldChhKTtcbiAgY29uc3Qgc2IgPSBuZXcgU2V0KGIpO1xuICBsZXQgaW50ZXIgPSAwO1xuICBmb3IgKGNvbnN0IHggb2Ygc2EpIGlmIChzYi5oYXMoeCkpIGludGVyKys7XG4gIGlmICghaW50ZXIpIHJldHVybiAwO1xuICBjb25zdCB1bmlvbiA9IHNhLnNpemUgKyBzYi5zaXplIC0gaW50ZXI7XG4gIGNvbnN0IGphY2NhcmQgPSBpbnRlciAvIHVuaW9uO1xuICAvLyBDb250YWlubWVudCBib251czogaWYgdGhlIHNtYWxsZXIgc2V0IGlzIGZ1bGx5IGNvbnRhaW5lZCBpbiB0aGUgbGFyZ2VyLFxuICAvLyByZXdhcmQgdGhhdCAoY292ZXJzIFwiUmVkIERlYWQgUmVkZW1wdGlvbiAyXCIgXHUyMjgyIFwiUmVkIERlYWQgUmVkZW1wdGlvbiAyIFBTNFwiKS5cbiAgY29uc3QgbWluU2l6ZSA9IE1hdGgubWluKHNhLnNpemUsIHNiLnNpemUpO1xuICBjb25zdCBjb250YWlubWVudCA9IGludGVyIC8gbWluU2l6ZTtcbiAgcmV0dXJuIDAuNiAqIGphY2NhcmQgKyAwLjQgKiBjb250YWlubWVudDtcbn1cblxuLyoqIE1hdGNoIHRocmVzaG9sZCBiZWxvdyB3aGljaCB3ZSBpZ25vcmUgYSBjYW5kaWRhdGUgcGFpci4gKi9cbmV4cG9ydCBjb25zdCBNQVRDSF9USFJFU0hPTEQgPSAwLjU1O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBwcmljZSBwYXJzaW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIHBhcnNlQ2xwKHY6IHVua25vd24pOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKHYgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJudW1iZXJcIiAmJiBOdW1iZXIuaXNGaW5pdGUodikpIHtcbiAgICAvLyBTaG9waWZ5IG9mdGVuIGdpdmVzIHN0cmluZ3MgbGlrZSBcIjI5OTkwLjAwXCI7IG51bWJlcnMgYXJlIGluIG1ham9yIHVuaXRzLlxuICAgIC8vIEhldXJpc3RpYzogdmFsdWVzIDwgMTAwMCBhcmUgdW5saWtlbHkgZm9yIENMUDsgdHJlYXQgYXMtaXMgb3RoZXJ3aXNlLlxuICAgIHJldHVybiBNYXRoLnJvdW5kKHYpO1xuICB9XG4gIGNvbnN0IHMgPSBTdHJpbmcodikucmVwbGFjZSgvW15cXGQsLi1dL2csIFwiXCIpO1xuICBpZiAoIXMpIHJldHVybiBudWxsO1xuICAvLyBDTFAgaGFzIG5vIGRlY2ltYWxzLiBEb3RzIGFuZCBjb21tYXMgYXJlIGFsbW9zdCBhbHdheXMgdGhvdXNhbmRzXG4gIC8vIHNlcGFyYXRvcnMgKFwiJDYuOTkwXCIpLiBUaGUgb25seSBkZWNpbWFsLWlzaCBjYXNlIHdlIHNlZSBpcyBTaG9waWZ5J3NcbiAgLy8gVVNELXN0eWxlIFwiNzk5MC4wMFwiIC8gXCI3OTkwLDAwXCIgXHUyMDE0IGxhc3Qgc2VwYXJhdG9yIGZvbGxvd2VkIGJ5IGV4YWN0bHlcbiAgLy8gMiBkaWdpdHMuIERldGVjdCB0aGF0LCBkcm9wIHRoZSBkZWNpbWFsIHRhaWwsIHN0cmlwIHRoZSByZXN0LlxuICBsZXQgY2xlYW5lZCA9IHM7XG4gIGNvbnN0IGRlY2ltYWxUYWlsID0gL1suLF0oXFxkezJ9KSQvLmV4ZWMocyk7XG4gIGlmIChkZWNpbWFsVGFpbCkgY2xlYW5lZCA9IHMuc2xpY2UoMCwgLTMpO1xuICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9bLixdL2csIFwiXCIpO1xuICBjb25zdCBuID0gTnVtYmVyKGNsZWFuZWQpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShuKSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBNYXRoLnJvdW5kKG4pO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBTaG9waWZ5IHNjcmFwZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuaW50ZXJmYWNlIFNob3BpZnlWYXJpYW50IHtcbiAgcHJpY2U/OiBzdHJpbmc7XG4gIGF2YWlsYWJsZT86IGJvb2xlYW47XG4gIGNvbXBhcmVfYXRfcHJpY2U/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBTaG9waWZ5UHJvZHVjdCB7XG4gIGlkOiBudW1iZXI7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGhhbmRsZTogc3RyaW5nO1xuICB2YXJpYW50cz86IFNob3BpZnlWYXJpYW50W107XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoU2hvcGlmeShcbiAgc3RvcmVLZXk6IHN0cmluZyxcbiAgZG9tYWluOiBzdHJpbmdcbik6IFByb21pc2U8Q29tcGV0aXRvclByb2R1Y3RbXT4ge1xuICBjb25zdCBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSA9IFtdO1xuICBmb3IgKGxldCBwYWdlID0gMTsgcGFnZSA8PSA0MDsgcGFnZSsrKSB7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vJHtkb21haW59L3Byb2R1Y3RzLmpzb24/bGltaXQ9MjUwJnBhZ2U9JHtwYWdlfWA7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczogeyBcInVzZXItYWdlbnRcIjogVUEsIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICB9KTtcbiAgICBpZiAoci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgYCR7ZG9tYWlufSBubyBleHBvbmUgL3Byb2R1Y3RzLmpzb24gKFx1MDBCRm5vIGVzIFNob3BpZnk/KWBcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghci5vaykge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgYCR7ZG9tYWlufSBIVFRQICR7ci5zdGF0dXN9IGVuIC9wcm9kdWN0cy5qc29uYFxuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IGJvZHk6IHsgcHJvZHVjdHM/OiBTaG9waWZ5UHJvZHVjdFtdIH07XG4gICAgdHJ5IHtcbiAgICAgIGJvZHkgPSAoYXdhaXQgci5qc29uKCkpIGFzIHsgcHJvZHVjdHM/OiBTaG9waWZ5UHJvZHVjdFtdIH07XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3IoXG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICBgJHtkb21haW59IGRldm9sdmlcdTAwRjMgYWxnbyBxdWUgbm8gZXMgSlNPTiBlbiAvcHJvZHVjdHMuanNvbmBcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGJhdGNoID0gYm9keS5wcm9kdWN0cyA/PyBbXTtcbiAgICBpZiAoIWJhdGNoLmxlbmd0aCkgYnJlYWs7XG4gICAgZm9yIChjb25zdCBwIG9mIGJhdGNoKSB7XG4gICAgICBjb25zdCB2YXJpYW50ID0gcC52YXJpYW50cz8uWzBdO1xuICAgICAgY29uc3QgcHJpY2UgPSBwYXJzZUNscCh2YXJpYW50Py5wcmljZSk7XG4gICAgICBpZiAocHJpY2UgPT0gbnVsbCkgY29udGludWU7XG4gICAgICBwcm9kdWN0cy5wdXNoKHtcbiAgICAgICAgc3RvcmVLZXksXG4gICAgICAgIHRpdGxlOiBwLnRpdGxlLFxuICAgICAgICB1cmw6IGBodHRwczovLyR7ZG9tYWlufS9wcm9kdWN0cy8ke3AuaGFuZGxlfWAsXG4gICAgICAgIHByaWNlQ2xwOiBwcmljZSxcbiAgICAgICAgYXZhaWxhYmxlOiB2YXJpYW50Py5hdmFpbGFibGUgIT09IGZhbHNlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChiYXRjaC5sZW5ndGggPCAyNTApIGJyZWFrO1xuICB9XG4gIHJldHVybiBwcm9kdWN0cztcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gV29vQ29tbWVyY2Ugc2NyYXBlciAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5pbnRlcmZhY2UgV29vUHJpY2VzIHtcbiAgcHJpY2U/OiBzdHJpbmc7XG4gIHJlZ3VsYXJfcHJpY2U/OiBzdHJpbmc7XG4gIHNhbGVfcHJpY2U/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBXb29Qcm9kdWN0IHtcbiAgaWQ6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICBwZXJtYWxpbms6IHN0cmluZztcbiAgcHJpY2VzPzogV29vUHJpY2VzO1xuICBpc19pbl9zdG9jaz86IGJvb2xlYW47XG4gIGlzX3B1cmNoYXNhYmxlPzogYm9vbGVhbjtcbn1cblxuY29uc3QgV09PX0VORFBPSU5UUyA9IFtcbiAgXCIvd3AtanNvbi93Yy9zdG9yZS92MS9wcm9kdWN0c1wiLFxuICBcIi93cC1qc29uL3djL3N0b3JlL3Byb2R1Y3RzXCIsXG4gIFwiLz9yZXN0X3JvdXRlPS93Yy9zdG9yZS92MS9wcm9kdWN0c1wiLFxuXTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hXb28oXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIGRvbWFpbjogc3RyaW5nXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgbGV0IGxhc3RFcnJvciA9IFwibm8tYXR0ZW1wdFwiO1xuICBmb3IgKGNvbnN0IGJhc2VQYXRoIG9mIFdPT19FTkRQT0lOVFMpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGZldGNoV29vQXQoc3RvcmVLZXksIGRvbWFpbiwgYmFzZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgQ29tcGV0aXRvckZldGNoRXJyb3IpIHtcbiAgICAgICAgbGFzdEVycm9yID0gZS5tZXNzYWdlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICBzdG9yZUtleSxcbiAgICBgJHtkb21haW59IG5vIGV4cG9uZSBuaW5nXHUwMEZBbiBlbmRwb2ludCBXb29Db21tZXJjZSBjb25vY2lkbyAoJHtsYXN0RXJyb3J9KWBcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hXb29BdChcbiAgc3RvcmVLZXk6IHN0cmluZyxcbiAgZG9tYWluOiBzdHJpbmcsXG4gIGJhc2VQYXRoOiBzdHJpbmdcbik6IFByb21pc2U8Q29tcGV0aXRvclByb2R1Y3RbXT4ge1xuICBjb25zdCBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSA9IFtdO1xuICBjb25zdCBqb2luZXIgPSBiYXNlUGF0aC5pbmNsdWRlcyhcIj9cIikgPyBcIiZcIiA6IFwiP1wiO1xuICBmb3IgKGxldCBwYWdlID0gMTsgcGFnZSA8PSA0MDsgcGFnZSsrKSB7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vJHtkb21haW59JHtiYXNlUGF0aH0ke2pvaW5lcn1wZXJfcGFnZT0xMDAmcGFnZT0ke3BhZ2V9YDtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICBoZWFkZXJzOiB7IFwidXNlci1hZ2VudFwiOiBVQSwgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgIH0pO1xuICAgIGlmIChyLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3Ioc3RvcmVLZXksIGAke2Jhc2VQYXRofSBcdTIxOTIgNDA0YCk7XG4gICAgfVxuICAgIGlmICghci5vaykge1xuICAgICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKHN0b3JlS2V5LCBgJHtiYXNlUGF0aH0gXHUyMTkyIEhUVFAgJHtyLnN0YXR1c31gKTtcbiAgICB9XG4gICAgbGV0IGJhdGNoOiBXb29Qcm9kdWN0W107XG4gICAgdHJ5IHtcbiAgICAgIGJhdGNoID0gKGF3YWl0IHIuanNvbigpKSBhcyBXb29Qcm9kdWN0W107XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aHJvdyBuZXcgQ29tcGV0aXRvckZldGNoRXJyb3Ioc3RvcmVLZXksIGAke2Jhc2VQYXRofSBkZXZvbHZpXHUwMEYzIG5vLUpTT05gKTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGJhdGNoKSB8fCAhYmF0Y2gubGVuZ3RoKSBicmVhaztcbiAgICBmb3IgKGNvbnN0IHAgb2YgYmF0Y2gpIHtcbiAgICAgIGNvbnN0IHJhdyA9XG4gICAgICAgIHAucHJpY2VzPy5zYWxlX3ByaWNlIHx8IHAucHJpY2VzPy5wcmljZSB8fCBwLnByaWNlcz8ucmVndWxhcl9wcmljZTtcbiAgICAgIGxldCBwcmljZSA9IHBhcnNlQ2xwKHJhdyk7XG4gICAgICBpZiAocHJpY2UgIT0gbnVsbCAmJiByYXcgJiYgL15cXGQrJC8udGVzdChTdHJpbmcocmF3KSkgJiYgcHJpY2UgPiAxXzAwMF8wMDApIHtcbiAgICAgICAgcHJpY2UgPSBNYXRoLnJvdW5kKHByaWNlIC8gMTAwKTtcbiAgICAgIH1cbiAgICAgIGlmIChwcmljZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgIHByb2R1Y3RzLnB1c2goe1xuICAgICAgICBzdG9yZUtleSxcbiAgICAgICAgdGl0bGU6IHAubmFtZSxcbiAgICAgICAgdXJsOiBwLnBlcm1hbGluayxcbiAgICAgICAgcHJpY2VDbHA6IHByaWNlLFxuICAgICAgICBhdmFpbGFibGU6IHAuaXNfaW5fc3RvY2sgIT09IGZhbHNlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChiYXRjaC5sZW5ndGggPCAxMDApIGJyZWFrO1xuICB9XG4gIGlmICghcHJvZHVjdHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKHN0b3JlS2V5LCBgJHtiYXNlUGF0aH0gdmFjXHUwMEVEb2ApO1xuICB9XG4gIHJldHVybiBwcm9kdWN0cztcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gSFRNTCAvIHNpdGVtYXAgKyBKU09OLUxEIHNjcmFwZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgU0lURU1BUF9DQU5ESURBVEVTID0gW1xuICBcIi9wcm9kdWN0LXNpdGVtYXAueG1sXCIsXG4gIFwiL3dwLXNpdGVtYXAtcG9zdHMtcHJvZHVjdC0xLnhtbFwiLFxuICBcIi9zaXRlbWFwLXByb2R1Y3RzLnhtbFwiLFxuICBcIi9zaXRlbWFwX3Byb2R1Y3RzXzEueG1sXCIsIC8vIFNob3BpZnktc3R5bGUsIGJ1dCBhbHNvIHVzZWQgYnkgb3RoZXJzXG4gIFwiL3NpdGVtYXBfaW5kZXgueG1sXCIsXG4gIFwiL3NpdGVtYXAueG1sXCIsXG5dO1xuXG5jb25zdCBQUk9EVUNUX1VSTF9ISU5UUyA9XG4gIC9cXC8ocHJvZHVjdG98cHJvZHVjdG9zfHByb2R1Y3R8cHJvZHVjdHN8dGllbmRhfHNob3B8Z2FtZXxqdWVnb3xpdGVtKVxcLy9pO1xuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFRleHQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgYWNjZXB0OiBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICBcImFjY2VwdC1sYW5ndWFnZVwiOiBcImVzLUNMLGVzO3E9MC45LGVuO3E9MC44XCIsXG4gICAgICAgIFwic2VjLWZldGNoLWRlc3RcIjogXCJkb2N1bWVudFwiLFxuICAgICAgICBcInNlYy1mZXRjaC1tb2RlXCI6IFwibmF2aWdhdGVcIixcbiAgICAgICAgXCJzZWMtZmV0Y2gtc2l0ZVwiOiBcIm5vbmVcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gYXdhaXQgci50ZXh0KCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVTaXRlbWFwVXJscyhkb21haW46IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBxdWV1ZTogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBwYXRoIG9mIFNJVEVNQVBfQ0FORElEQVRFUykge1xuICAgIHF1ZXVlLnB1c2goYGh0dHBzOi8vJHtkb21haW59JHtwYXRofWApO1xuICB9XG5cbiAgY29uc3QgdXJsczogc3RyaW5nW10gPSBbXTtcbiAgd2hpbGUgKHF1ZXVlLmxlbmd0aCAmJiB1cmxzLmxlbmd0aCA8IDIwMDApIHtcbiAgICBjb25zdCBjdXJyZW50ID0gcXVldWUuc2hpZnQoKSE7XG4gICAgaWYgKHNlZW4uaGFzKGN1cnJlbnQpKSBjb250aW51ZTtcbiAgICBzZWVuLmFkZChjdXJyZW50KTtcbiAgICBjb25zdCB4bWwgPSBhd2FpdCBmZXRjaFRleHQoY3VycmVudCk7XG4gICAgaWYgKCF4bWwpIGNvbnRpbnVlO1xuXG4gICAgLy8gU2l0ZW1hcCBpbmRleCBcdTIxOTIgPHNpdGVtYXA+PGxvYz4uLi48L2xvYz48L3NpdGVtYXA+XG4gICAgY29uc3QgbmVzdGVkID0gQXJyYXkuZnJvbShcbiAgICAgIHhtbC5tYXRjaEFsbCgvPHNpdGVtYXBbXj5dKj5bXFxzXFxTXSo/PGxvYz4oW1xcc1xcU10qPyk8XFwvbG9jPltcXHNcXFNdKj88XFwvc2l0ZW1hcD4vZ2kpXG4gICAgKS5tYXAoKG0pID0+IG1bMV0udHJpbSgpKTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgbmVzdGVkKSB7XG4gICAgICBpZiAoL3Byb2R1Y3R8c2l0ZW1hcFstX11cXGQrfHBhZ2Utc2l0ZW1hcC9pLnRlc3QobikgfHwgbmVzdGVkLmxlbmd0aCA8IDEwKSB7XG4gICAgICAgIHF1ZXVlLnB1c2gobik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVVJMIHNldCBcdTIxOTIgPHVybD48bG9jPi4uLjwvbG9jPjwvdXJsPlxuICAgIGNvbnN0IGl0ZW1zID0gQXJyYXkuZnJvbShcbiAgICAgIHhtbC5tYXRjaEFsbCgvPHVybFtePl0qPltcXHNcXFNdKj88bG9jPihbXFxzXFxTXSo/KTxcXC9sb2M+W1xcc1xcU10qPzxcXC91cmw+L2dpKVxuICAgICkubWFwKChtKSA9PiBtWzFdLnRyaW0oKSk7XG4gICAgZm9yIChjb25zdCB1IG9mIGl0ZW1zKSB1cmxzLnB1c2godSk7XG4gIH1cblxuICAvLyBLZWVwIGxpa2VseS1wcm9kdWN0IFVSTHMgZmlyc3QuIEZhbGwgYmFjayB0byBldmVyeXRoaW5nIGlmIG5vIGhpbnQgbWF0Y2hlcy5cbiAgY29uc3QgaGludGVkID0gdXJscy5maWx0ZXIoKHUpID0+IFBST0RVQ1RfVVJMX0hJTlRTLnRlc3QodSkpO1xuICBjb25zdCBwb29sID0gaGludGVkLmxlbmd0aCA+PSAxMCA/IGhpbnRlZCA6IHVybHM7XG5cbiAgLy8gRGVkdXBsaWNhdGUgcHJlc2VydmluZyBvcmRlclxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGRlZHVwID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgdSBvZiBwb29sKSB7XG4gICAgaWYgKGRlZHVwLmhhcyh1KSkgY29udGludWU7XG4gICAgZGVkdXAuYWRkKHUpO1xuICAgIG91dC5wdXNoKHUpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmludGVyZmFjZSBKc29uTGRQcm9kdWN0IHtcbiAgXCJAdHlwZVwiPzogc3RyaW5nIHwgc3RyaW5nW107XG4gIG5hbWU/OiBzdHJpbmc7XG4gIG9mZmVycz86XG4gICAgfCB7XG4gICAgICAgIHByaWNlPzogc3RyaW5nIHwgbnVtYmVyO1xuICAgICAgICBsb3dQcmljZT86IHN0cmluZyB8IG51bWJlcjtcbiAgICAgICAgcHJpY2VDdXJyZW5jeT86IHN0cmluZztcbiAgICAgICAgYXZhaWxhYmlsaXR5Pzogc3RyaW5nO1xuICAgICAgfVxuICAgIHwgQXJyYXk8e1xuICAgICAgICBwcmljZT86IHN0cmluZyB8IG51bWJlcjtcbiAgICAgICAgcHJpY2VDdXJyZW5jeT86IHN0cmluZztcbiAgICAgICAgYXZhaWxhYmlsaXR5Pzogc3RyaW5nO1xuICAgICAgfT47XG59XG5cbmZ1bmN0aW9uIGlzUHJvZHVjdE5vZGUobjogdW5rbm93bik6IG4gaXMgSnNvbkxkUHJvZHVjdCB7XG4gIGlmICghbiB8fCB0eXBlb2YgbiAhPT0gXCJvYmplY3RcIikgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB0ID0gKG4gYXMgSnNvbkxkUHJvZHVjdClbXCJAdHlwZVwiXTtcbiAgaWYgKCF0KSByZXR1cm4gZmFsc2U7XG4gIGlmIChBcnJheS5pc0FycmF5KHQpKSByZXR1cm4gdC5zb21lKCh4KSA9PiAvcHJvZHVjdC9pLnRlc3QoeCkpO1xuICByZXR1cm4gL3Byb2R1Y3QvaS50ZXN0KFN0cmluZyh0KSk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RQcm9kdWN0RnJvbUh0bWwoXG4gIGh0bWw6IHN0cmluZyxcbiAgc3RvcmVLZXk6IHN0cmluZyxcbiAgdXJsOiBzdHJpbmdcbik6IENvbXBldGl0b3JQcm9kdWN0IHwgbnVsbCB7XG4gIGNvbnN0IHNjcmlwdHMgPSBBcnJheS5mcm9tKFxuICAgIGh0bWwubWF0Y2hBbGwoXG4gICAgICAvPHNjcmlwdFtePl0qdHlwZT1bXCInXWFwcGxpY2F0aW9uXFwvbGRcXCtqc29uW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi9naVxuICAgIClcbiAgKTtcbiAgZm9yIChjb25zdCBtIG9mIHNjcmlwdHMpIHtcbiAgICBsZXQgcGFyc2VkOiB1bmtub3duO1xuICAgIHRyeSB7XG4gICAgICBwYXJzZWQgPSBKU09OLnBhcnNlKG1bMV0udHJpbSgpKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBpdGVtczogdW5rbm93bltdID0gW107XG4gICAgY29uc3QgZ3JhcGggPSAocGFyc2VkIGFzIHsgXCJAZ3JhcGhcIj86IHVua25vd25bXSB9KT8uW1wiQGdyYXBoXCJdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGdyYXBoKSkgaXRlbXMucHVzaCguLi5ncmFwaCk7XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXJzZWQpKSBpdGVtcy5wdXNoKC4uLnBhcnNlZCk7XG4gICAgZWxzZSBpdGVtcy5wdXNoKHBhcnNlZCk7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgIGlmICghaXNQcm9kdWN0Tm9kZShpdGVtKSkgY29udGludWU7XG4gICAgICBjb25zdCBwID0gaXRlbSBhcyBKc29uTGRQcm9kdWN0O1xuICAgICAgY29uc3QgbmFtZSA9IHAubmFtZTtcbiAgICAgIGxldCBwcmljZVJhdzogc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgbGV0IGF2YWlsYWJpbGl0eSA9IFwiXCI7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwLm9mZmVycykpIHtcbiAgICAgICAgcHJpY2VSYXcgPSBwLm9mZmVyc1swXT8ucHJpY2U7XG4gICAgICAgIGF2YWlsYWJpbGl0eSA9IHAub2ZmZXJzWzBdPy5hdmFpbGFiaWxpdHkgPz8gXCJcIjtcbiAgICAgIH0gZWxzZSBpZiAocC5vZmZlcnMpIHtcbiAgICAgICAgcHJpY2VSYXcgPSBwLm9mZmVycy5wcmljZSA/PyBwLm9mZmVycy5sb3dQcmljZTtcbiAgICAgICAgYXZhaWxhYmlsaXR5ID0gcC5vZmZlcnMuYXZhaWxhYmlsaXR5ID8/IFwiXCI7XG4gICAgICB9XG4gICAgICBjb25zdCBwcmljZSA9IHBhcnNlQ2xwKHByaWNlUmF3KTtcbiAgICAgIGlmICghbmFtZSB8fCBwcmljZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0b3JlS2V5LFxuICAgICAgICB0aXRsZTogU3RyaW5nKG5hbWUpLFxuICAgICAgICB1cmwsXG4gICAgICAgIHByaWNlQ2xwOiBwcmljZSxcbiAgICAgICAgYXZhaWxhYmxlOiAhL291dG9mc3RvY2svaS50ZXN0KGF2YWlsYWJpbGl0eSksXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEZhbGxiYWNrOiBPcGVuR3JhcGggLyBpdGVtcHJvcCBtZXRhXG4gIGNvbnN0IG9nVGl0bGUgPSAvPG1ldGFbXj5dK3Byb3BlcnR5PVtcIiddb2c6dGl0bGVbXCInXVtePl0rY29udGVudD1bXCInXShbXlwiJ10rKVtcIiddL2kuZXhlYyhcbiAgICBodG1sXG4gICk/LlsxXTtcbiAgY29uc3Qgb2dQcmljZSA9XG4gICAgLzxtZXRhW14+XStwcm9wZXJ0eT1bXCInXXByb2R1Y3Q6cHJpY2U6YW1vdW50W1wiJ11bXj5dK2NvbnRlbnQ9W1wiJ10oW15cIiddKylbXCInXS9pLmV4ZWMoXG4gICAgICBodG1sXG4gICAgKT8uWzFdIHx8XG4gICAgLzxtZXRhW14+XStpdGVtcHJvcD1bXCInXXByaWNlW1wiJ11bXj5dK2NvbnRlbnQ9W1wiJ10oW15cIiddKylbXCInXS9pLmV4ZWMoaHRtbCk/LlsxXTtcbiAgaWYgKG9nVGl0bGUgJiYgb2dQcmljZSkge1xuICAgIGNvbnN0IHByaWNlID0gcGFyc2VDbHAob2dQcmljZSk7XG4gICAgaWYgKHByaWNlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB7IHN0b3JlS2V5LCB0aXRsZTogb2dUaXRsZSwgdXJsLCBwcmljZUNscDogcHJpY2UsIGF2YWlsYWJsZTogdHJ1ZSB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEZhbGxiYWNrOiBIVE1MIHRpdGxlICsgcHJpY2UgcGF0dGVybiAod29ya3MgZm9yIEp1bXBzZWxsZXIgYW5kIG90aGVyIHBsYXRmb3JtcylcbiAgY29uc3QgdGl0bGVUYWcgPSAvPHRpdGxlW14+XSo+KFtePF0rKTxcXC90aXRsZT4vaS5leGVjKGh0bWwpPy5bMV0/LnRyaW0oKTtcbiAgY29uc3QgaDFUYWcgPSAvPGgxW14+XSo+KFtePF0rKTxcXC9oMT4vaS5leGVjKGh0bWwpPy5bMV0/LnRyaW0oKTtcbiAgY29uc3QgcHJvZHVjdFRpdGxlID0gaDFUYWcgfHwgdGl0bGVUYWc7XG4gIGlmIChwcm9kdWN0VGl0bGUpIHtcbiAgICAvLyBMb29rIGZvciBwcmljZSBpbiBjb21tb24gcGF0dGVybnM6ICRYWC5YWFggb3IgJFhYLFhYWCAoQ0xQIGZvcm1hdClcbiAgICBjb25zdCBwcmljZVBhdHRlcm5zID0gW1xuICAgICAgL2NsYXNzPVtcIiddW15cIiddKig/OnByaWNlfHByZWNpbylbXlwiJ10qW1wiJ11bXj5dKj5cXHMqXFwkP1xccyooW1xcZC4sXSspL2ksXG4gICAgICAvaXRlbXByb3A9W1wiJ11wcmljZVtcIiddW14+XSo+XFxzKlxcJD9cXHMqKFtcXGQuLF0rKS9pLFxuICAgICAgL2RhdGEtcHJpY2U9W1wiJ10oW1xcZC4sXSspW1wiJ10vaSxcbiAgICAgIC9cXGJwcmVjaW9bXjxdKlxcJFxccyooW1xcZC4sXSspL2ksXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHJlIG9mIHByaWNlUGF0dGVybnMpIHtcbiAgICAgIGNvbnN0IHBtID0gcmUuZXhlYyhodG1sKTtcbiAgICAgIGlmIChwbSkge1xuICAgICAgICBjb25zdCBwcmljZSA9IHBhcnNlQ2xwKHBtWzFdKTtcbiAgICAgICAgaWYgKHByaWNlICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBjbGVhblRpdGxlID0gcHJvZHVjdFRpdGxlXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxzKlstXHUyMDEzfFx1MDBCN10uKiQvLCBcIlwiKVxuICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICByZXR1cm4geyBzdG9yZUtleSwgdGl0bGU6IGNsZWFuVGl0bGUsIHVybCwgcHJpY2VDbHA6IHByaWNlLCBhdmFpbGFibGU6IHRydWUgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEh0bWxTdG9yZWZyb250KFxuICBzdG9yZUtleTogc3RyaW5nLFxuICBkb21haW46IHN0cmluZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGNvbnN0IHVybHMgPSBhd2FpdCByZXNvbHZlU2l0ZW1hcFVybHMoZG9tYWluKTtcbiAgaWYgKCF1cmxzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgIHN0b3JlS2V5LFxuICAgICAgYCR7ZG9tYWlufSBubyBleHBvbmUgc2l0ZW1hcC54bWwgY29uIFVSTHMgZGUgcHJvZHVjdG9zYFxuICAgICk7XG4gIH1cbiAgY29uc3QgbGltaXQgPSBNYXRoLm1pbih1cmxzLmxlbmd0aCwgNDAwKTtcbiAgY29uc3QgY29uY3VycmVuY3kgPSA2O1xuICBjb25zdCBvdXQ6IENvbXBldGl0b3JQcm9kdWN0W10gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbWl0OyBpICs9IGNvbmN1cnJlbmN5KSB7XG4gICAgY29uc3QgYmF0Y2ggPSB1cmxzLnNsaWNlKGksIGkgKyBjb25jdXJyZW5jeSk7XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgYmF0Y2gubWFwKGFzeW5jICh1KSA9PiB7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBmZXRjaFRleHQodSk7XG4gICAgICAgIGlmICghaHRtbCkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBleHRyYWN0UHJvZHVjdEZyb21IdG1sKGh0bWwsIHN0b3JlS2V5LCB1KTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgcmVzdWx0cykgaWYgKHApIG91dC5wdXNoKHApO1xuICB9XG4gIGlmICghb3V0Lmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICAgIHN0b3JlS2V5LFxuICAgICAgYCR7ZG9tYWlufTogc2l0ZW1hcCBlbmNvbnRyYWRvIHBlcm8gbm8gc2UgcHVkaWVyb24gZXh0cmFlciBwcm9kdWN0b3MgKHNpbiBKU09OLUxEIG5pIG9nOnByaWNlKWBcbiAgICApO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tIEp1bXBzZWxsZXIgc2NyYXBlciAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEp1bXBzZWxsZXIoXG4gIHN0b3JlS2V5OiBzdHJpbmcsXG4gIGRvbWFpbjogc3RyaW5nXG4pOiBQcm9taXNlPENvbXBldGl0b3JQcm9kdWN0W10+IHtcbiAgY29uc3QgYmFzZSA9IGBodHRwczovLyR7ZG9tYWlufWA7XG5cbiAgLy8gU3RlcCAxOiBGZXRjaCBob21lcGFnZSB0byBkaXNjb3ZlciBjYXRlZ29yeSBsaW5rc1xuICBjb25zdCBob21lSHRtbCA9IGF3YWl0IGZldGNoVGV4dChiYXNlICsgXCIvXCIpO1xuICBjb25zdCBjYXRlZ29yaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoaG9tZUh0bWwpIHtcbiAgICBjb25zdCBjYXRSZWdleCA9IC9ocmVmPVtcIiddKFxcL2NhdGVnb3JpYXNcXC9bXlwiJz8jXSspW1wiJ10vZ2k7XG4gICAgbGV0IG07XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIHdoaWxlICgobSA9IGNhdFJlZ2V4LmV4ZWMoaG9tZUh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgcGF0aCA9IG1bMV0ucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICAgIGlmICghc2Vlbi5oYXMocGF0aCkpIHtcbiAgICAgICAgc2Vlbi5hZGQocGF0aCk7XG4gICAgICAgIGNhdGVnb3JpZXMucHVzaChwYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBBbHdheXMgaW5jbHVkZSAvY2F0ZWdvcmlhcy8gcm9vdCBhcyBmYWxsYmFja1xuICBpZiAoIWNhdGVnb3JpZXMuaW5jbHVkZXMoXCIvY2F0ZWdvcmlhc1wiKSkgY2F0ZWdvcmllcy51bnNoaWZ0KFwiL2NhdGVnb3JpYXNcIik7XG5cbiAgY29uc3QgcHJvZHVjdHM6IENvbXBldGl0b3JQcm9kdWN0W10gPSBbXTtcbiAgY29uc3Qgc2VlblVybHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWF4Q2F0ZWdvcmllcyA9IDIwO1xuICBjb25zdCBtYXhQYWdlcyA9IDUwO1xuXG4gIGZvciAoY29uc3QgY2F0IG9mIGNhdGVnb3JpZXMuc2xpY2UoMCwgbWF4Q2F0ZWdvcmllcykpIHtcbiAgICBmb3IgKGxldCBwYWdlID0gMTsgcGFnZSA8PSBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgICBjb25zdCB1cmwgPSBgJHtiYXNlfSR7Y2F0fT9wYWdlPSR7cGFnZX1gO1xuICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoVGV4dCh1cmwpO1xuICAgICAgaWYgKCFodG1sKSBicmVhaztcblxuICAgICAgLy8gRXh0cmFjdCBwcm9kdWN0IGNhcmRzIFx1MjAxNCBKdW1wc2VsbGVyIHVzZXMgdmFyaW91cyBwYXR0ZXJuc1xuICAgICAgbGV0IGZvdW5kT25QYWdlID0gMDtcblxuICAgICAgLy8gUGF0dGVybiBBOiBwcm9kdWN0IGxpbmtzIHdpdGggL3Byb2R1Y3Rvcy8gaHJlZlxuICAgICAgY29uc3QgcHJvZHVjdEJsb2NrUmVnZXggPVxuICAgICAgICAvaHJlZj1bXCInXShcXC9wcm9kdWN0b3NcXC9bXlwiJz8jXSspW1wiJ11bXl0qPyg/PWhyZWY9W1wiJ11cXC9wcm9kdWN0b3NcXC98JCkvZ2k7XG4gICAgICBsZXQgYmxvY2s6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4gICAgICBjb25zdCBwcm9kdWN0TGlua3M6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBsaW5rUmVnZXggPSAvaHJlZj1bXCInXShcXC9wcm9kdWN0b3NcXC9bXlwiJz8jXSspW1wiJ10vZ2k7XG4gICAgICBsZXQgbG07XG4gICAgICB3aGlsZSAoKGxtID0gbGlua1JlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHBVcmwgPSBiYXNlICsgbG1bMV07XG4gICAgICAgIGlmICghc2VlblVybHMuaGFzKHBVcmwpKSB7XG4gICAgICAgICAgc2VlblVybHMuYWRkKHBVcmwpO1xuICAgICAgICAgIHByb2R1Y3RMaW5rcy5wdXNoKGxtWzFdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZWFjaCBwcm9kdWN0IGxpbmssIGV4dHJhY3QgdGl0bGUgKyBwcmljZSBmcm9tIGl0cyBzdXJyb3VuZGluZyBjb250ZXh0XG4gICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgcHJvZHVjdExpbmtzKSB7XG4gICAgICAgIGNvbnN0IGVzY2FwZWRMaW5rID0gbGluay5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgICAgIGNvbnN0IGN0eFJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICBgaHJlZj1bXCInXSR7ZXNjYXBlZExpbmt9W1wiJ11bXFxcXHNcXFxcU117MCwxMDAwfWBcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgY3R4ID0gY3R4UmVnZXguZXhlYyhodG1sKT8uWzBdID8/IFwiXCI7XG5cbiAgICAgICAgLy8gVGl0bGU6IGxvb2sgZm9yIHByb2R1Y3QgbmFtZSBwYXR0ZXJuc1xuICAgICAgICBjb25zdCB0aXRsZU1hdGNoID1cbiAgICAgICAgICAvY2xhc3M9W1wiJ11bXlwiJ10qKD86dGl0bGV8bm9tYnJlfG5hbWUpW15cIiddKltcIiddW14+XSo+KFtePF17MywxMDB9KTwvLmV4ZWMoY3R4KSB8fFxuICAgICAgICAgIC9hbHQ9W1wiJ10oW15cIiddezMsMTAwfSlbXCInXS8uZXhlYyhjdHgpIHx8XG4gICAgICAgICAgLzxzcGFuW14+XSo+KFtePF17Myw4MH0pPFxcL3NwYW4+Ly5leGVjKGN0eCk7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gdGl0bGVNYXRjaD8uWzFdPy50cmltKCk7XG5cbiAgICAgICAgLy8gUHJpY2U6IGxvb2sgZm9yIENMUCBwcmljZSBwYXR0ZXJuc1xuICAgICAgICBjb25zdCBwcmljZU1hdGNoID1cbiAgICAgICAgICAvY2xhc3M9W1wiJ11bXlwiJ10qKD86cHJpY2V8cHJlY2lvKVteXCInXSpbXCInXVtePl0qPltcXHMkXSooW1xcZC4sXSspLy5leGVjKGN0eCkgfHxcbiAgICAgICAgICAvXFwkXFxzKihbXFxkLixdKykvLmV4ZWMoY3R4KSB8fFxuICAgICAgICAgIC9kYXRhLXByaWNlPVtcIiddKFtcXGQuLF0rKVtcIiddLy5leGVjKGN0eCk7XG4gICAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VDbHAocHJpY2VNYXRjaD8uWzFdKTtcblxuICAgICAgICBpZiAodGl0bGUgJiYgcHJpY2UgIT0gbnVsbCkge1xuICAgICAgICAgIHByb2R1Y3RzLnB1c2goe1xuICAgICAgICAgICAgc3RvcmVLZXksXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIHVybDogYmFzZSArIGxpbmssXG4gICAgICAgICAgICBwcmljZUNscDogcHJpY2UsXG4gICAgICAgICAgICBhdmFpbGFibGU6IHRydWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZm91bmRPblBhZ2UrKztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZm91bmRPblBhZ2UgPT09IDApIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICghcHJvZHVjdHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IENvbXBldGl0b3JGZXRjaEVycm9yKFxuICAgICAgc3RvcmVLZXksXG4gICAgICBgJHtkb21haW59OiBubyBzZSBlbmNvbnRyYXJvbiBwcm9kdWN0b3MgZW4gSnVtcHNlbGxlciAoc2luIC9wcm9kdWN0b3MvIGVuIGVsIEhUTUwpYFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIHByb2R1Y3RzO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBwdWJsaWMgQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaENvbXBldGl0b3IoXG4gIGNmZzogQ29tcGV0aXRvckNvbmZpZ1xuKTogUHJvbWlzZTxDb21wZXRpdG9yUHJvZHVjdFtdPiB7XG4gIGlmIChjZmcudHlwZSA9PT0gXCJzaG9waWZ5XCIpIHJldHVybiBmZXRjaFNob3BpZnkoY2ZnLmtleSwgY2ZnLmRvbWFpbik7XG4gIGlmIChjZmcudHlwZSA9PT0gXCJ3b29jb21tZXJjZVwiKSByZXR1cm4gZmV0Y2hXb28oY2ZnLmtleSwgY2ZnLmRvbWFpbik7XG4gIGlmIChjZmcudHlwZSA9PT0gXCJodG1sXCIpIHJldHVybiBmZXRjaEh0bWxTdG9yZWZyb250KGNmZy5rZXksIGNmZy5kb21haW4pO1xuICBpZiAoY2ZnLnR5cGUgPT09IFwianVtcHNlbGxlclwiKSByZXR1cm4gZmV0Y2hKdW1wc2VsbGVyKGNmZy5rZXksIGNmZy5kb21haW4pO1xuXG4gIC8vIGF1dG86IGRldGVjdCBKdW1wc2VsbGVyIGJ5IGhvbWVwYWdlIGZpbmdlcnByaW50LCB0aGVuIHNob3BpZnkgXHUyMTkyIHdvbyBcdTIxOTIgaHRtbCBmYWxsYmFja1xuICBjb25zdCBob21lSHRtbCA9IGF3YWl0IGZldGNoVGV4dChgaHR0cHM6Ly8ke2NmZy5kb21haW59L2ApO1xuICBpZiAoaG9tZUh0bWwgJiYgKC9cXC9wcm9kdWN0b3NcXC8vaS50ZXN0KGhvbWVIdG1sKSB8fCAvXFwvY2F0ZWdvcmlhc1xcLy9pLnRlc3QoaG9tZUh0bWwpKSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZmV0Y2hKdW1wc2VsbGVyKGNmZy5rZXksIGNmZy5kb21haW4pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBDb21wZXRpdG9yRmV0Y2hFcnJvcikpIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGZuIG9mIFtmZXRjaFNob3BpZnksIGZldGNoV29vLCBmZXRjaEh0bWxTdG9yZWZyb250XSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZm4oY2ZnLmtleSwgY2ZnLmRvbWFpbik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIENvbXBldGl0b3JGZXRjaEVycm9yKSkgdGhyb3cgZTtcbiAgICAgIGVycm9ycy5wdXNoKGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBDb21wZXRpdG9yRmV0Y2hFcnJvcihcbiAgICBjZmcua2V5LFxuICAgIGBubyBzZSBwdWRvIHNjcmFwZWFyICR7Y2ZnLmRvbWFpbn06ICR7ZXJyb3JzLmpvaW4oXCIgXHUwMEI3IFwiKX1gXG4gICk7XG59XG5cbi8qKlxuICogQnVpbGQge2dhbWVJZCAtPiBtYXRjaGVzW119IGZvciBhIGxpc3Qgb2YgUFNOIGdhbWVzIGFuZCB0aGUgY29tYmluZWQgcG9vbFxuICogb2YgY29tcGV0aXRvciBwcm9kdWN0cyAoZnJvbSBhbGwgZW5hYmxlZCBzdG9yZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hHYW1lcyhcbiAgZ2FtZXM6IEdhbWVbXSxcbiAgcHJvZHVjdHM6IENvbXBldGl0b3JQcm9kdWN0W11cbik6IFJlY29yZDxzdHJpbmcsIENvbXBldGl0b3JNYXRjaFtdPiB7XG4gIC8vIFByZWNvbXB1dGUgdG9rZW5zIG9uY2UgcGVyIHByb2R1Y3QuXG4gIGNvbnN0IHByb2R1Y3RUb2tlbnM6IEFycmF5PHsgcDogQ29tcGV0aXRvclByb2R1Y3Q7IHRva2Vuczogc3RyaW5nW10gfT4gPVxuICAgIHByb2R1Y3RzLm1hcCgocCkgPT4gKHsgcCwgdG9rZW5zOiB0b2tlbml6ZShwLnRpdGxlKSB9KSk7XG5cbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBDb21wZXRpdG9yTWF0Y2hbXT4gPSB7fTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgY29uc3QgZ1Rva2VucyA9IHRva2VuaXplKGcubmFtZSk7XG4gICAgaWYgKCFnVG9rZW5zLmxlbmd0aCkgY29udGludWU7XG4gICAgY29uc3QgbWF0Y2hlczogQ29tcGV0aXRvck1hdGNoW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHsgcCwgdG9rZW5zIH0gb2YgcHJvZHVjdFRva2Vucykge1xuICAgICAgaWYgKCF0b2tlbnMubGVuZ3RoKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHNjb3JlID0gc2ltaWxhcml0eShnVG9rZW5zLCB0b2tlbnMpO1xuICAgICAgaWYgKHNjb3JlID49IE1BVENIX1RIUkVTSE9MRCkge1xuICAgICAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgICAgIHN0b3JlS2V5OiBwLnN0b3JlS2V5LFxuICAgICAgICAgIHRpdGxlOiBwLnRpdGxlLFxuICAgICAgICAgIHVybDogcC51cmwsXG4gICAgICAgICAgcHJpY2VDbHA6IHAucHJpY2VDbHAsXG4gICAgICAgICAgYXZhaWxhYmxlOiBwLmF2YWlsYWJsZSxcbiAgICAgICAgICBzY29yZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEtlZXAgYXQgbW9zdCB0b3AtNSBwZXIgZ2FtZSB0byBsaW1pdCBwYXlsb2FkIHNpemUuXG4gICAgbWF0Y2hlcy5zb3J0KChhLCBiKSA9PiBhLnByaWNlQ2xwIC0gYi5wcmljZUNscCk7XG4gICAgb3V0W2cuaWRdID0gbWF0Y2hlcy5zbGljZSgwLCA1KTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHNuLXByb2R1Y3QudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHNuLXByb2R1Y3QudHNcIjsvKipcbiAqIFBTTiBwcm9kdWN0IGRldGFpbCBzY3JhcGVyLlxuICpcbiAqIFRoZSBwcm9kdWN0IHBhZ2UgKHN0b3JlLnBsYXlzdGF0aW9uLmNvbS88cmVnaW9uPi9wcm9kdWN0LzxpZD4pIGlzIFNTUidkXG4gKiBieSBOZXh0LmpzIGp1c3QgbGlrZSB0aGUgY2F0ZWdvcnkgcGFnZXMgXHUyMDE0IHRoZSBmdWxsIHByb2R1Y3QgSlNPTiBzaXRzXG4gKiBpbnNpZGUgYDxzY3JpcHQgaWQ9XCJfX05FWFRfREFUQV9fXCI+YC4gV2Ugd2FsayB0aGF0IHRyZWUgdG8gZmluZCB0aGVcbiAqIG9iamVjdCBtYXRjaGluZyBvdXIgdGFyZ2V0IGlkIGFuZCBub3JtYWxpemUgaXRzIGZpZWxkcy5cbiAqXG4gKiBmaWxlU2l6ZSBpcyB0aGUgb25lIHRoaW5nIFBTTiBkb2Vzbid0IHB1dCBpbiBzdHJ1Y3R1cmVkIGRhdGEgb24gZW4tVVM7XG4gKiB3ZSByZWNvdmVyIGl0IGZyb20gdGhlIHZpc2libGUgSFRNTCB3aXRoIGEgcmVnZXggZmFsbGJhY2suXG4gKi9cbmltcG9ydCB7IFBzbkFwaUVycm9yIH0gZnJvbSBcIi4vcHNuXCI7XG5cbmNvbnN0IFVBID1cbiAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgXCIgK1xuICBcIihLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjdE1lZGlhIHtcbiAgaGVyb1VybDogc3RyaW5nIHwgbnVsbDtcbiAgbG9nb1VybDogc3RyaW5nIHwgbnVsbDtcbiAgYmFja2dyb3VuZFVybDogc3RyaW5nIHwgbnVsbDtcbiAgY292ZXJVcmw6IHN0cmluZyB8IG51bGw7XG4gIHBvcnRyYWl0VXJsOiBzdHJpbmcgfCBudWxsO1xuICBzY3JlZW5zaG90czogc3RyaW5nW107XG4gIHZpZGVvczogQXJyYXk8eyB1cmw6IHN0cmluZzsgcG9zdGVyVXJsOiBzdHJpbmcgfCBudWxsOyBtaW1lVHlwZTogc3RyaW5nIHwgbnVsbCB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0RGV0YWlsIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nOyAvLyBzYW5pdGl6ZWQgSFRNTFxuICBzaG9ydERlc2NyaXB0aW9uOiBzdHJpbmcgfCBudWxsO1xuICBwdWJsaXNoZXI6IHN0cmluZyB8IG51bGw7XG4gIGRldmVsb3Blcjogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIGdlbnJlczogc3RyaW5nW107XG4gIHZvaWNlTGFuZ3VhZ2VzOiBzdHJpbmdbXTtcbiAgc3VidGl0bGVMYW5ndWFnZXM6IHN0cmluZ1tdO1xuICBhZ2VSYXRpbmc6IHN0cmluZyB8IG51bGw7XG4gIGNvbnRlbnREZXNjcmlwdG9yczogc3RyaW5nW107XG4gIGludGVyYWN0aXZlRWxlbWVudHM6IHN0cmluZ1tdO1xuICBwbGF5ZXJDb3VudDogc3RyaW5nIHwgbnVsbDtcbiAgb25saW5lUGxheWVyQ291bnQ6IHN0cmluZyB8IG51bGw7XG4gIHBzUGx1c1JlcXVpcmVkOiBib29sZWFuO1xuICBpbkdhbWVQdXJjaGFzZXM6IHN0cmluZyB8IG51bGw7XG4gIGdhbWVGZWF0dXJlczogc3RyaW5nW107XG4gIHBzVmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgZmlsZVNpemU6IHN0cmluZyB8IG51bGw7XG4gIHBsYXRmb3Jtczogc3RyaW5nO1xuICBtZWRpYTogUHJvZHVjdE1lZGlhO1xuICBjYXJvdXNlbEltYWdlczogc3RyaW5nW107XG4gIHN0b3JlVXJsOiBzdHJpbmc7XG4gIGRpc2NvdW50RW5kQXQ6IHN0cmluZyB8IG51bGw7XG4gIGZldGNoZWRBdDogc3RyaW5nO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEh0bWwodXJsOiBzdHJpbmcsIHJlZ2lvbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgbGV0IGxhc3RFcnI6IHVua25vd24gPSBudWxsO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgICAgYWNjZXB0OlxuICAgICAgICAgICAgXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sLGFwcGxpY2F0aW9uL3htbDtxPTAuOSwqLyo7cT0wLjhcIixcbiAgICAgICAgICBcImFjY2VwdC1sYW5ndWFnZVwiOiByZWdpb24udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKFwiZXNcIikgPyBcImVzXCIgOiBcImVuLVVTXCIsXG4gICAgICAgICAgXCJ4LXBzbi1zdG9yZS1sb2NhbGUtb3ZlcnJpZGVcIjogcmVnaW9uLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwNCkgdGhyb3cgbmV3IFBzbkFwaUVycm9yKGBQcm9kdWN0IG5vdCBmb3VuZCAoNDA0KTogJHt1cmx9YCk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwMylcbiAgICAgICAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFwiUFNOIHJldHVybmVkIDQwMyAoSVAvQ2xvdWRmbGFyZSBibG9jaylcIik7XG4gICAgICBpZiAoci5zdGF0dXMgPj0gNTAwKSB0aHJvdyBuZXcgRXJyb3IoYFBTTiAke3Iuc3RhdHVzfWApO1xuICAgICAgcmV0dXJuIGF3YWl0IHIudGV4dCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHRocm93IGU7XG4gICAgICBsYXN0RXJyID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA0MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IFBzbkFwaUVycm9yKFxuICAgIGBQU04gcHJvZHVjdCBmZXRjaCBmYWlsZWQ6ICR7KGxhc3RFcnIgYXMgRXJyb3IpPy5tZXNzYWdlIHx8IGxhc3RFcnJ9YFxuICApO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0TmV4dERhdGEoaHRtbDogc3RyaW5nKTogYW55IHwgbnVsbCB7XG4gIGNvbnN0IG0gPSAvPHNjcmlwdFtePl0qaWQ9W1wiJ11fX05FWFRfREFUQV9fW1wiJ11bXj5dKj4oW1xcc1xcU10qPyk8XFwvc2NyaXB0Pi8uZXhlYyhcbiAgICBodG1sXG4gICk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UobVsxXSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKiBXYWxrIHRoZSB0cmVlIGNvbGxlY3RpbmcgZXZlcnkgb2JqZWN0IHdob3NlIGBpZGAgbWF0Y2hlcyB0YXJnZXRJZC5cbiAqICBUaGUgcGFnZSBlbWJlZHMgdGhlIHNhbWUgcHJvZHVjdCBzZXZlcmFsIHRpbWVzIChoZWFkZXIsIGhlcm8sIHJlbGF0ZWRcbiAqICBsaW5rcyk7IHdlIHBpY2sgdGhlIHJpY2hlc3QgcmVjb3JkIGJ5IHRvdGFsIGtleSBjb3VudC4gKi9cbmZ1bmN0aW9uIGZpbmRQcm9kdWN0UmVjb3Jkcyh0cmVlOiB1bmtub3duLCB0YXJnZXRJZDogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSB7XG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSA9IFtdO1xuICBjb25zdCBzdGFjazogdW5rbm93bltdID0gW3RyZWVdO1xuICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgY29uc3QgbiA9IHN0YWNrLnBvcCgpO1xuICAgIGlmICghbikgY29udGludWU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobikpIHtcbiAgICAgIGZvciAoY29uc3QgdiBvZiBuKSBzdGFjay5wdXNoKHYpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbiAhPT0gXCJvYmplY3RcIikgY29udGludWU7XG4gICAgY29uc3Qgb2JqID0gbiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBpZiAob2JqLmlkID09PSB0YXJnZXRJZCB8fCBvYmoucHJvZHVjdElkID09PSB0YXJnZXRJZCkgb3V0LnB1c2gob2JqKTtcbiAgICBmb3IgKGNvbnN0IHYgb2YgT2JqZWN0LnZhbHVlcyhvYmopKSB7XG4gICAgICBpZiAodiAmJiB0eXBlb2YgdiA9PT0gXCJvYmplY3RcIikgc3RhY2sucHVzaCh2KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gcGlja1JpY2hlc3QocmVjb3JkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIGlmICghcmVjb3Jkcy5sZW5ndGgpIHJldHVybiBudWxsO1xuICBsZXQgYmVzdCA9IHJlY29yZHNbMF07XG4gIGxldCBiZXN0S2V5cyA9IE9iamVjdC5rZXlzKGJlc3QpLmxlbmd0aDtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpIHtcbiAgICBjb25zdCBrID0gT2JqZWN0LmtleXMocikubGVuZ3RoO1xuICAgIGlmIChrID4gYmVzdEtleXMpIHtcbiAgICAgIGJlc3QgPSByO1xuICAgICAgYmVzdEtleXMgPSBrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYmVzdDtcbn1cblxuLyoqIE1lcmdlIGZpZWxkcyBhY3Jvc3MgZXZlcnkgcmVjb3JkIHdpdGggdGhpcyBpZCBcdTIwMTQgb25lIHNsb3QgbWlnaHQgaGF2ZVxuICogIG1lZGlhLCBhbm90aGVyIGxvbmdEZXNjcmlwdGlvbiwgZXRjLiBSaWNoZXN0IHdpbnMgb24gY29uZmxpY3RzLiAqL1xuZnVuY3Rpb24gbWVyZ2VSZWNvcmRzKHJlY29yZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W10pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIGNvbnN0IHNvcnRlZCA9IFsuLi5yZWNvcmRzXS5zb3J0KFxuICAgIChhLCBiKSA9PiBPYmplY3Qua2V5cyhhKS5sZW5ndGggLSBPYmplY3Qua2V5cyhiKS5sZW5ndGhcbiAgKTtcbiAgY29uc3QgbWVyZ2VkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBmb3IgKGNvbnN0IHIgb2Ygc29ydGVkKSB7XG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMocikpIHtcbiAgICAgIGlmICh2ID09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgaWYgKG1lcmdlZFtrXSA9PSBudWxsKSBtZXJnZWRba10gPSB2O1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVyZ2VkO1xufVxuXG5pbnRlcmZhY2UgUmF3TWVkaWEge1xuICByb2xlPzogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xuICB1cmw/OiBzdHJpbmc7XG4gIHNvdXJjZT86IHsgdXJsPzogc3RyaW5nOyB0eXBlPzogc3RyaW5nIH07XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RNZWRpYShvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvZHVjdE1lZGlhIHtcbiAgY29uc3QgbGlzdCA9IChvYmoubWVkaWEgYXMgUmF3TWVkaWFbXSkgfHwgW107XG4gIGNvbnN0IGJ5Um9sZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICBjb25zdCBzY3JlZW5zaG90czogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdmlkZW9zOiBQcm9kdWN0TWVkaWFbXCJ2aWRlb3NcIl0gPSBbXTtcbiAgbGV0IHBvc3RlckZvck5leHRWaWRlbzogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgZm9yIChjb25zdCBtIG9mIGxpc3QpIHtcbiAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdCB0eXBlID0gU3RyaW5nKG0/LnR5cGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdCB1cmwgPSBtPy51cmwgfHwgbT8uc291cmNlPy51cmwgfHwgbnVsbDtcblxuICAgIC8vIFZpZGVvczogdHlwZSBpcyB1c3VhbGx5IFZJREVPIG9yIFZJREVPX1BST01PLCByb2xlIGlzIFBST01PLlxuICAgIGlmICh0eXBlLmluY2x1ZGVzKFwiVklERU9cIikgfHwgcm9sZSA9PT0gXCJQUk9NT1wiKSB7XG4gICAgICBpZiAoIXVybCkgY29udGludWU7XG4gICAgICB2aWRlb3MucHVzaCh7XG4gICAgICAgIHVybCxcbiAgICAgICAgcG9zdGVyVXJsOiBwb3N0ZXJGb3JOZXh0VmlkZW8sXG4gICAgICAgIG1pbWVUeXBlOiBtPy5zb3VyY2U/LnR5cGUgfHwgbnVsbCxcbiAgICAgIH0pO1xuICAgICAgcG9zdGVyRm9yTmV4dFZpZGVvID0gbnVsbDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoIXVybCkgY29udGludWU7XG5cbiAgICAvLyBTdGFzaCB0aGUgZmlyc3Qgcm9sZSBoaXQgc28gd2UgZG9uJ3Qgb3ZlcndyaXRlIGhlcm8gd2l0aCBhIGxhdGVyXG4gICAgLy8gTUFTVEVSIHRoYXQgbWlnaHQgYmUgbG93ZXIgcXVhbGl0eS5cbiAgICBpZiAoIWJ5Um9sZVtyb2xlXSkgYnlSb2xlW3JvbGVdID0gdXJsO1xuXG4gICAgaWYgKHJvbGUgPT09IFwiU0NSRUVOU0hPVFwiKSBzY3JlZW5zaG90cy5wdXNoKHVybCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGhlcm9Vcmw6XG4gICAgICBieVJvbGVbXCJIRVJPX0JBTk5FUlwiXSB8fFxuICAgICAgYnlSb2xlW1wiSEVST0JBTk5FUlwiXSB8fFxuICAgICAgYnlSb2xlW1wiQkFDS0dST1VORF9JTUFHRVwiXSB8fFxuICAgICAgYnlSb2xlW1wiQkFDS0dST1VORFwiXSB8fFxuICAgICAgbnVsbCxcbiAgICBsb2dvVXJsOiBieVJvbGVbXCJMT0dPXCJdIHx8IGJ5Um9sZVtcIkxPR09fVFJBTlNQQVJFTlRcIl0gfHwgbnVsbCxcbiAgICBiYWNrZ3JvdW5kVXJsOiBieVJvbGVbXCJCQUNLR1JPVU5EX0lNQUdFXCJdIHx8IGJ5Um9sZVtcIkJBQ0tHUk9VTkRcIl0gfHwgbnVsbCxcbiAgICBjb3ZlclVybDpcbiAgICAgIGJ5Um9sZVtcIk1BU1RFUlwiXSB8fFxuICAgICAgYnlSb2xlW1wiQk9YQVJUXCJdIHx8XG4gICAgICBieVJvbGVbXCJHQU1FSFVCX0NPVkVSX0FSVFwiXSB8fFxuICAgICAgYnlSb2xlW1wiUFJFVklFV19HQU1FX0FSVFwiXSB8fFxuICAgICAgbnVsbCxcbiAgICBwb3J0cmFpdFVybDpcbiAgICAgIGJ5Um9sZVtcIlBPUlRSQUlUX0JBTk5FUlwiXSB8fFxuICAgICAgYnlSb2xlW1wiR0FNRUhVQl9DT1ZFUl9BUlRcIl0gfHxcbiAgICAgIGJ5Um9sZVtcIkJPWEFSVFwiXSB8fFxuICAgICAgbnVsbCxcbiAgICBzY3JlZW5zaG90czogWy4uLm5ldyBTZXQoc2NyZWVuc2hvdHMpXSxcbiAgICB2aWRlb3MsXG4gIH07XG59XG5cbi8qKiBNaW5pbWFsIEhUTUwgc2FuaXRpemF0aW9uIFx1MjAxNCBzdHJpcHMgc2NyaXB0cy9zdHlsZXMvZXZlbnQgaGFuZGxlcnMgYW5kXG4gKiAgYW55IHRhZyBvdXRzaWRlIHRoZSB3aGl0ZWxpc3QuIEVub3VnaCBmb3IgUFNOLXNvdXJjZWQgZGVzY3JpcHRpb25zLiAqL1xuY29uc3QgQUxMT1dFRF9UQUdTID0gbmV3IFNldChbXG4gIFwicFwiLCBcImJyXCIsIFwic3Ryb25nXCIsIFwiYlwiLCBcImVtXCIsIFwiaVwiLCBcInVcIiwgXCJ1bFwiLCBcIm9sXCIsIFwibGlcIiwgXCJoMlwiLCBcImgzXCIsIFwiaDRcIixcbl0pO1xuXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVIdG1sKHJhdzogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFyYXcpIHJldHVybiBcIlwiO1xuICBsZXQgcyA9IHJhdztcbiAgLy8gRHJvcCBlbnRpcmUgc2NyaXB0L3N0eWxlIGJsb2Nrcy5cbiAgcyA9IHMucmVwbGFjZSgvPHNjcmlwdFtcXHNcXFNdKj88XFwvc2NyaXB0Pi9naSwgXCJcIik7XG4gIHMgPSBzLnJlcGxhY2UoLzxzdHlsZVtcXHNcXFNdKj88XFwvc3R5bGU+L2dpLCBcIlwiKTtcbiAgLy8gU3RyaXAgYW55IHRhZyBub3QgaW4gdGhlIHdoaXRlbGlzdC4gUHJlc2VydmUgaW5uZXIgdGV4dC5cbiAgcyA9IHMucmVwbGFjZSgvPFxcLz8oW2EtekEtWl1bYS16QS1aMC05XSopXFxiW14+XSo+L2csIChtYXRjaCwgdGFnKSA9PiB7XG4gICAgY29uc3QgdCA9IFN0cmluZyh0YWcpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCFBTExPV0VEX1RBR1MuaGFzKHQpKSByZXR1cm4gXCJcIjtcbiAgICAvLyBGb3IgYWxsb3dlZCB0YWdzLCBkcm9wIGFsbCBhdHRyaWJ1dGVzIChubyBocmVmL3N0eWxlL29uKiBwb3NzaWJsZSkuXG4gICAgcmV0dXJuIG1hdGNoLnN0YXJ0c1dpdGgoXCI8L1wiKSA/IGA8LyR7dH0+YCA6IGA8JHt0fT5gO1xuICB9KTtcbiAgLy8gQ29sbGFwc2UgcnVucyBvZiBlbXB0eSBwYXJhZ3JhcGhzLlxuICBzID0gcy5yZXBsYWNlKC8oPzo8cD5cXHMqPFxcL3A+XFxzKil7Mix9L2dpLCBcIjxwPjwvcD5cIik7XG4gIHJldHVybiBzLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gdG9TdHJpbmdBcnJheSh2OiB1bmtub3duKTogc3RyaW5nW10ge1xuICBpZiAoIXYpIHJldHVybiBbXTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICByZXR1cm4gdlxuICAgICAgLm1hcCgoeCkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHggPT09IFwic3RyaW5nXCIpIHJldHVybiB4O1xuICAgICAgICBpZiAoeCAmJiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgIGNvbnN0IG9iaiA9IHggYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgICAgICAgcmV0dXJuIFN0cmluZyhvYmoubmFtZSB8fCBvYmoubGFiZWwgfHwgb2JqLmRlc2NyaXB0aW9uIHx8IFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIH1cbiAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSByZXR1cm4gdi5zcGxpdChcIixcIikubWFwKChzKSA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuICByZXR1cm4gW107XG59XG5cbmZ1bmN0aW9uIHN0cih2OiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh2ID09IG51bGwpIHJldHVybiBudWxsO1xuICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpIHJldHVybiB2LnRyaW0oKSB8fCBudWxsO1xuICBpZiAodHlwZW9mIHYgPT09IFwib2JqZWN0XCIpIHtcbiAgICBjb25zdCBvYmogPSB2IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIHJldHVybiAoXG4gICAgICAodHlwZW9mIG9iai5uYW1lID09PSBcInN0cmluZ1wiICYmIG9iai5uYW1lKSB8fFxuICAgICAgKHR5cGVvZiBvYmouZGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgJiYgb2JqLmRlc2NyaXB0aW9uKSB8fFxuICAgICAgbnVsbFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2KSB8fCBudWxsO1xufVxuXG4vKiogUFNOIHJhcmVseSBleHBvc2VzIGZpbGUgc2l6ZSBpbiBzdHJ1Y3R1cmVkIGRhdGEgb24gZW4tVVMuIFNjcmFwZSBpdFxuICogIGZyb20gdGhlIHZpc2libGUgSFRNTCBhcyBhIGxhc3QgcmVzb3J0LiBNYXRjaGVzIFwiNzkuOCBHQlwiLCBcIjIgR0JcIiwgZXRjLiAqL1xuZnVuY3Rpb24gZXh0cmFjdEZpbGVTaXplRnJvbUh0bWwoaHRtbDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIC8vIFRoZSBcIkZpbGUgU2l6ZVwiIGxhYmVsIGlzIGZvbGxvd2VkIGJ5IHRoZSB2YWx1ZSBpbiB0aGUgXCJBYm91dCB0aGlzIGdhbWVcIlxuICAvLyBzZWN0aW9uLiBMb29rIGZvciB2YXJpYXRpb25zLlxuICBjb25zdCBsYWJlbE1hdGNoID1cbiAgICAvRmlsZVxccypTaXplW148XSo8XFwvW14+XSs+XFxzKjxbXj5dKz4oW148XSspPC9pLmV4ZWMoaHRtbCkgfHxcbiAgICAvXCJmaWxlU2l6ZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2kuZXhlYyhodG1sKTtcbiAgaWYgKGxhYmVsTWF0Y2ggJiYgbGFiZWxNYXRjaFsxXSkgcmV0dXJuIGxhYmVsTWF0Y2hbMV0udHJpbSgpO1xuICAvLyBHbG9iYWwgZmFsbGJhY2s6IGFueSBcIjxudW1iZXI+IEdCXCIgbmVhciBhIHNpemUtaXNoIGxhYmVsLiBWZXJ5IGNvYXJzZVxuICAvLyBcdTIwMTQgb25seSB1c2UgaWYgdGhlIGxhYmVsZWQgc2NyYXBlIG1pc3Nlcy5cbiAgY29uc3QgYW55ID0gLyhcXGR7MSwzfSg/OlsuLF1cXGQrKT8pXFxzKkdCXFxiL2kuZXhlYyhodG1sKTtcbiAgcmV0dXJuIGFueSA/IGAke2FueVsxXX0gR0JgIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdENvbnRlbnREZXNjcmlwdG9ycyhvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogc3RyaW5nW10ge1xuICBjb25zdCBjciA9IG9iai5jb250ZW50UmF0aW5nIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICBpZiAoY3I/LmNvbnRlbnREZXNjcmlwdG9ycykgcmV0dXJuIHRvU3RyaW5nQXJyYXkoY3IuY29udGVudERlc2NyaXB0b3JzKTtcbiAgaWYgKGNyPy5kZXNjcmlwdGlvbnMpIHJldHVybiB0b1N0cmluZ0FycmF5KGNyLmRlc2NyaXB0aW9ucyk7XG4gIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEludGVyYWN0aXZlRWxlbWVudHMob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHN0cmluZ1tdIHtcbiAgY29uc3QgY3IgPSBvYmouY29udGVudFJhdGluZyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgaWYgKGNyPy5pbnRlcmFjdGl2ZUVsZW1lbnRzKSByZXR1cm4gdG9TdHJpbmdBcnJheShjci5pbnRlcmFjdGl2ZUVsZW1lbnRzKTtcbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0R2FtZUZlYXR1cmVzKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGh0bWw6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgLy8gRnJvbSBKU09OOiBsb29rIGZvciBmZWF0dXJlcywgdXBzZWxsRmVhdHVyZXMsIGdhbWVwbGF5RmVhdHVyZXMsIGV0Yy5cbiAgY29uc3QgZmVhdHVyZXM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3Qga2V5IG9mIFtcImZlYXR1cmVzXCIsIFwidXBzZWxsRmVhdHVyZXNcIiwgXCJnYW1lcGxheUZlYXR1cmVzXCIsIFwiY29uY2VwdEZlYXR1cmVzXCJdKSB7XG4gICAgY29uc3QgdiA9IG9ialtrZXldO1xuICAgIGlmICh2KSBmZWF0dXJlcy5wdXNoKC4uLnRvU3RyaW5nQXJyYXkodikpO1xuICB9XG4gIGlmIChmZWF0dXJlcy5sZW5ndGggPiAwKSByZXR1cm4gZmVhdHVyZXM7XG5cbiAgLy8gRnJvbSBIVE1MOiBleHRyYWN0IGZlYXR1cmUgYmFkZ2VzIGxpa2UgXCJQUyBQbHVzIHJlcXVpcmVkXCIsIFwiMSAtIDIgcGxheWVyc1wiLCBldGMuXG4gIGNvbnN0IGZlYXR1cmVSZWdleCA9XG4gICAgL2RhdGEtcWE9XCJtZmVbXlwiXSojY2hlY2tzP1teXCJdKlwiW14+XSo+KFtePF0rKTwvZ2k7XG4gIGxldCBtO1xuICB3aGlsZSAoKG0gPSBmZWF0dXJlUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCB0ZXh0ID0gbVsxXS50cmltKCk7XG4gICAgaWYgKHRleHQgJiYgIWZlYXR1cmVzLmluY2x1ZGVzKHRleHQpKSBmZWF0dXJlcy5wdXNoKHRleHQpO1xuICB9XG5cbiAgLy8gQWx0ZXJuYXRpdmU6IGV4dHJhY3QgZnJvbSBhcmlhLWxhYmVsIG9yIHRleHQgbm9kZXMgbmVhciBmZWF0dXJlIGljb25zXG4gIGNvbnN0IGFsdFJlZ2V4ID1cbiAgICAvY2xhc3M9XCJbXlwiXSooPzpnYW1lLWZlYXR1cmV8cHN3LWMtdC0zKVteXCJdKlwiW14+XSo+KFtePF17NSwxMjB9KTwvZ2k7XG4gIHdoaWxlICgobSA9IGFsdFJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgdGV4dCA9IG1bMV0udHJpbSgpO1xuICAgIGlmICh0ZXh0ICYmICFmZWF0dXJlcy5pbmNsdWRlcyh0ZXh0KSkgZmVhdHVyZXMucHVzaCh0ZXh0KTtcbiAgfVxuXG4gIHJldHVybiBmZWF0dXJlcztcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFBsYXllckluZm8ob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgaHRtbDogc3RyaW5nKToge1xuICBwbGF5ZXJDb3VudDogc3RyaW5nIHwgbnVsbDtcbiAgb25saW5lUGxheWVyQ291bnQ6IHN0cmluZyB8IG51bGw7XG4gIHBzUGx1c1JlcXVpcmVkOiBib29sZWFuO1xuICBpbkdhbWVQdXJjaGFzZXM6IHN0cmluZyB8IG51bGw7XG59IHtcbiAgbGV0IHBsYXllckNvdW50ID0gc3RyKG9iai5wbGF5ZXJDb3VudCkgfHwgc3RyKG9iai5sb2NhbFBsYXllckNvdW50KTtcbiAgbGV0IG9ubGluZVBsYXllckNvdW50ID0gc3RyKG9iai5vbmxpbmVQbGF5ZXJDb3VudCk7XG4gIGxldCBwc1BsdXNSZXF1aXJlZCA9IGZhbHNlO1xuICBsZXQgaW5HYW1lUHVyY2hhc2VzOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAvLyBQYXJzZSBmcm9tIGZlYXR1cmVzL0hUTUwgdGV4dFxuICBjb25zdCBhbGxUZXh0ID0gaHRtbDtcbiAgY29uc3QgcGxheWVyTWF0Y2ggPSAvKFxcZCtcXHMqLVxccypcXGQrKVxccypwbGF5ZXIvaS5leGVjKGFsbFRleHQpO1xuICBpZiAoIXBsYXllckNvdW50ICYmIHBsYXllck1hdGNoKSBwbGF5ZXJDb3VudCA9IHBsYXllck1hdGNoWzFdLnJlcGxhY2UoL1xccy9nLCBcIlwiKSArIFwiIHBsYXllcnNcIjtcblxuICBjb25zdCBvbmxpbmVNYXRjaCA9IC9zdXBwb3J0cz9cXHMrdXBcXHMrdG9cXHMrKFxcZCspXFxzK29ubGluZVxccytwbGF5ZXJzPy9pLmV4ZWMoYWxsVGV4dCk7XG4gIGlmICghb25saW5lUGxheWVyQ291bnQgJiYgb25saW5lTWF0Y2gpIG9ubGluZVBsYXllckNvdW50ID0gYFVwIHRvICR7b25saW5lTWF0Y2hbMV19IG9ubGluZSBwbGF5ZXJzYDtcblxuICBpZiAoL3BzXFxzKnBsdXNcXHMqcmVxdWlyZWQvaS50ZXN0KGFsbFRleHQpKSBwc1BsdXNSZXF1aXJlZCA9IHRydWU7XG5cbiAgaWYgKC9pbi1nYW1lXFxzK3B1cmNoYXNlcz9cXHMrb3B0aW9uYWwvaS50ZXN0KGFsbFRleHQpKSBpbkdhbWVQdXJjaGFzZXMgPSBcIm9wdGlvbmFsXCI7XG4gIGVsc2UgaWYgKC9pbi1nYW1lXFxzK3B1cmNoYXNlcy9pLnRlc3QoYWxsVGV4dCkpIGluR2FtZVB1cmNoYXNlcyA9IFwieWVzXCI7XG5cbiAgcmV0dXJuIHsgcGxheWVyQ291bnQsIG9ubGluZVBsYXllckNvdW50LCBwc1BsdXNSZXF1aXJlZCwgaW5HYW1lUHVyY2hhc2VzIH07XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RQc1ZlcnNpb24ob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgaHRtbDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNsYXNzaWZpY2F0aW9uID0gc3RyKG9iai5sb2NhbGl6ZWRTdG9yZURpc3BsYXlDbGFzc2lmaWNhdGlvbik7XG4gIGlmIChjbGFzc2lmaWNhdGlvbiAmJiAvcHNbNDVdL2kudGVzdChjbGFzc2lmaWNhdGlvbikpIHJldHVybiBjbGFzc2lmaWNhdGlvbjtcblxuICAvLyBGcm9tIEhUTUxcbiAgY29uc3QgdmVyc2lvbk1hdGNoID0gLyhQU1s0NV1cXHMrVmVyc2lvbikvaS5leGVjKGh0bWwpO1xuICByZXR1cm4gdmVyc2lvbk1hdGNoID8gdmVyc2lvbk1hdGNoWzFdIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdERpc2NvdW50RW5kQXQob2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgaHRtbDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIC8vIEZyb20gSlNPTjogd2ViY3RhcyBwcmljZSBlbmRUaW1lXG4gIGNvbnN0IHdlYmN0YXMgPSBvYmoud2ViY3RhcyBhcyBBcnJheTx7IHByaWNlPzogeyBlbmRUaW1lPzogc3RyaW5nIH0gfT4gfCB1bmRlZmluZWQ7XG4gIGNvbnN0IGVuZFRpbWUgPSB3ZWJjdGFzPy5bMF0/LnByaWNlPy5lbmRUaW1lO1xuICBpZiAoZW5kVGltZSkgcmV0dXJuIGVuZFRpbWU7XG5cbiAgY29uc3QgcHJpY2UgPSBvYmoucHJpY2UgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gIGlmIChwcmljZT8uZW5kVGltZSkgcmV0dXJuIFN0cmluZyhwcmljZS5lbmRUaW1lKTtcblxuICAvLyBGcm9tIEhUTUw6IFwiT2ZmZXIgZW5kcyA0LzIzLzIwMjYgMDI6NTkgYS4gbS4gQ0xUXCJcbiAgY29uc3Qgb2ZmZXJNYXRjaCA9IC9vZmZlclxccytlbmRzP1xccysoXFxkezEsMn1cXC9cXGR7MSwyfVxcL1xcZHs0fVtePF0qKS9pLmV4ZWMoaHRtbCk7XG4gIGlmIChvZmZlck1hdGNoKSByZXR1cm4gb2ZmZXJNYXRjaFsxXS50cmltKCk7XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RDYXJvdXNlbEltYWdlcyhvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBodG1sOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGltYWdlczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIC8vIEZyb20gSlNPTiBtZWRpYTogZ2V0IGFsbCBzY3JlZW5zaG90IFVSTHNcbiAgY29uc3QgbWVkaWEgPSAob2JqLm1lZGlhIGFzIEFycmF5PHsgcm9sZT86IHN0cmluZzsgdXJsPzogc3RyaW5nIH0+KSB8fCBbXTtcbiAgZm9yIChjb25zdCBtIG9mIG1lZGlhKSB7XG4gICAgY29uc3QgdXJsID0gbT8udXJsO1xuICAgIGlmICghdXJsKSBjb250aW51ZTtcbiAgICBjb25zdCByb2xlID0gU3RyaW5nKG0/LnJvbGUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICBpZiAocm9sZSA9PT0gXCJTQ1JFRU5TSE9UXCIgfHwgcm9sZSA9PT0gXCJQUkVWSUVXXCIgfHwgcm9sZSA9PT0gXCJQUkVWSUVXX0lNQUdFXCIpIHtcbiAgICAgIGlmICghc2Vlbi5oYXModXJsKSkgeyBzZWVuLmFkZCh1cmwpOyBpbWFnZXMucHVzaCh1cmwpOyB9XG4gICAgfVxuICB9XG5cbiAgLy8gRnJvbSBIVE1MOiBleHRyYWN0IGNhcm91c2VsIGltYWdlIHNyYy9zcmNzZXRcbiAgY29uc3QgaW1nUmVnZXggPSAvZGF0YS1xYT1cIm1mZS1tZWRpYS1jYXJvdXNlbFteXCJdKlwiW14+XSpzcmM9XCIoW15cIl0rKVwiL2dpO1xuICBsZXQgbTtcbiAgd2hpbGUgKChtID0gaW1nUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCB1cmwgPSBtWzFdLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKTtcbiAgICBpZiAoIXNlZW4uaGFzKHVybCkpIHsgc2Vlbi5hZGQodXJsKTsgaW1hZ2VzLnB1c2godXJsKTsgfVxuICB9XG5cbiAgLy8gQWxzbyBnZXQgaGlnaC1yZXMgdmVyc2lvbnMgZnJvbSBzcmNzZXRcbiAgY29uc3Qgc3Jjc2V0UmVnZXggPSAvZGF0YS1xYT1cIm1mZS1tZWRpYS1jYXJvdXNlbFteXCJdKlwiW14+XSpzcmNzZXQ9XCIoW15cIl0rKVwiL2dpO1xuICB3aGlsZSAoKG0gPSBzcmNzZXRSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNyY3NldCA9IG1bMV0ucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpO1xuICAgIGNvbnN0IHVybHMgPSBzcmNzZXQuc3BsaXQoXCIsXCIpLm1hcCgocykgPT4gcy50cmltKCkuc3BsaXQoL1xccysvKVswXSk7XG4gICAgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xuICAgICAgaWYgKHVybCAmJiAhc2Vlbi5oYXModXJsKSkgeyBzZWVuLmFkZCh1cmwpOyBpbWFnZXMucHVzaCh1cmwpOyB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltYWdlcztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoUHJvZHVjdERldGFpbChcbiAgaWQ6IHN0cmluZyxcbiAgc3RvcmVVcmw6IHN0cmluZyxcbiAgcmVnaW9uOiBzdHJpbmdcbik6IFByb21pc2U8UHJvZHVjdERldGFpbD4ge1xuICBjb25zdCB1cmwgPSBzdG9yZVVybCB8fCBgaHR0cHM6Ly9zdG9yZS5wbGF5c3RhdGlvbi5jb20vZW4tdXMvcHJvZHVjdC8ke2lkfWA7XG4gIGNvbnN0IGh0bWwgPSBhd2FpdCBmZXRjaEh0bWwodXJsLCByZWdpb24pO1xuICBjb25zdCBkYXRhID0gZXh0cmFjdE5leHREYXRhKGh0bWwpO1xuICBpZiAoIWRhdGEpIHRocm93IG5ldyBQc25BcGlFcnJvcihcIk5vIF9fTkVYVF9EQVRBX18gaW4gUFNOIHByb2R1Y3QgcGFnZVwiKTtcblxuICBjb25zdCByZWNvcmRzID0gZmluZFByb2R1Y3RSZWNvcmRzKGRhdGEsIGlkKTtcbiAgY29uc3QgcmljaCA9IHBpY2tSaWNoZXN0KHJlY29yZHMpO1xuICBpZiAoIXJpY2gpIHRocm93IG5ldyBQc25BcGlFcnJvcihgUHJvZHVjdCAke2lkfSBub3QgZm91bmQgaW4gcGFnZSBKU09OYCk7XG4gIGNvbnN0IG9iaiA9IG1lcmdlUmVjb3JkcyhyZWNvcmRzKTtcblxuICBjb25zdCBwbGF0Zm9ybXNSYXcgPSBvYmoucGxhdGZvcm1zO1xuICBjb25zdCBwbGF0Zm9ybXMgPSBBcnJheS5pc0FycmF5KHBsYXRmb3Jtc1JhdylcbiAgICA/IHBsYXRmb3Jtc1Jhdy5qb2luKFwiLFwiKVxuICAgIDogU3RyaW5nKHBsYXRmb3Jtc1JhdyB8fCBcIlwiKTtcblxuICBjb25zdCBsb25nRGVzYyA9XG4gICAgKHR5cGVvZiBvYmoubG9uZ0Rlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiICYmIG9iai5sb25nRGVzY3JpcHRpb24pIHx8XG4gICAgKHR5cGVvZiBvYmouZGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgJiYgb2JqLmRlc2NyaXB0aW9uKSB8fFxuICAgIFwiXCI7XG4gIGNvbnN0IHNob3J0RGVzYyA9XG4gICAgKHR5cGVvZiBvYmouc2hvcnREZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvYmouc2hvcnREZXNjcmlwdGlvbikgfHxcbiAgICBudWxsO1xuXG4gIGNvbnN0IGZpbGVTaXplID1cbiAgICBzdHIob2JqLnJlcXVpcmVkRGlza1NwYWNlRGVzY3JpcHRpb24pIHx8XG4gICAgc3RyKG9iai5maWxlU2l6ZSkgfHxcbiAgICBleHRyYWN0RmlsZVNpemVGcm9tSHRtbChodG1sKTtcblxuICBjb25zdCBjb250ZW50UmF0aW5nID0gb2JqLmNvbnRlbnRSYXRpbmcgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gIGNvbnN0IGFnZVJhdGluZyA9XG4gICAgc3RyKGNvbnRlbnRSYXRpbmc/LmRlc2NyaXB0aW9uKSB8fFxuICAgIHN0cihjb250ZW50UmF0aW5nPy5uYW1lKSB8fFxuICAgIHN0cihvYmouYWdlTGltaXQpO1xuXG4gIGNvbnN0IHBsYXllckluZm8gPSBleHRyYWN0UGxheWVySW5mbyhvYmosIGh0bWwpO1xuXG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgbmFtZTogU3RyaW5nKG9iai5uYW1lIHx8IG9iai50aXRsZSB8fCBcIlwiKSxcbiAgICBkZXNjcmlwdGlvbjogc2FuaXRpemVIdG1sKGxvbmdEZXNjKSxcbiAgICBzaG9ydERlc2NyaXB0aW9uOiBzaG9ydERlc2MsXG4gICAgcHVibGlzaGVyOiBzdHIob2JqLnB1Ymxpc2hlck5hbWUpIHx8IHN0cihvYmoucHVibGlzaGVyKSB8fCBzdHIob2JqLnB1Ymxpc2hlZEJ5KSxcbiAgICBkZXZlbG9wZXI6IHN0cihvYmouZGV2ZWxvcGVyTmFtZSkgfHwgc3RyKG9iai5kZXZlbG9wZXIpLFxuICAgIHJlbGVhc2VEYXRlOlxuICAgICAgc3RyKG9iai5yZWxlYXNlRGF0ZSkgfHxcbiAgICAgIHN0cihvYmoubG9jYWxpemVkUmVsZWFzZURhdGUpIHx8XG4gICAgICBzdHIob2JqLnJlbGVhc2VEYXRlUmF3KSxcbiAgICBnZW5yZXM6IHRvU3RyaW5nQXJyYXkob2JqLmdlbnJlcyksXG4gICAgdm9pY2VMYW5ndWFnZXM6IHRvU3RyaW5nQXJyYXkob2JqLnNwb2tlbkxhbmd1YWdlcyB8fCBvYmouY29tcGF0aWJsZVZvaWNlcyksXG4gICAgc3VidGl0bGVMYW5ndWFnZXM6IHRvU3RyaW5nQXJyYXkoXG4gICAgICBvYmouc3VidGl0bGVMYW5ndWFnZXMgfHwgb2JqLmNvbXBhdGlibGVTdWJ0aXRsZXNcbiAgICApLFxuICAgIGFnZVJhdGluZyxcbiAgICBjb250ZW50RGVzY3JpcHRvcnM6IGV4dHJhY3RDb250ZW50RGVzY3JpcHRvcnMob2JqKSxcbiAgICBpbnRlcmFjdGl2ZUVsZW1lbnRzOiBleHRyYWN0SW50ZXJhY3RpdmVFbGVtZW50cyhvYmopLFxuICAgIHBsYXllckNvdW50OiBwbGF5ZXJJbmZvLnBsYXllckNvdW50LFxuICAgIG9ubGluZVBsYXllckNvdW50OiBwbGF5ZXJJbmZvLm9ubGluZVBsYXllckNvdW50LFxuICAgIHBzUGx1c1JlcXVpcmVkOiBwbGF5ZXJJbmZvLnBzUGx1c1JlcXVpcmVkLFxuICAgIGluR2FtZVB1cmNoYXNlczogcGxheWVySW5mby5pbkdhbWVQdXJjaGFzZXMsXG4gICAgZ2FtZUZlYXR1cmVzOiBleHRyYWN0R2FtZUZlYXR1cmVzKG9iaiwgaHRtbCksXG4gICAgcHNWZXJzaW9uOiBleHRyYWN0UHNWZXJzaW9uKG9iaiwgaHRtbCksXG4gICAgZmlsZVNpemUsXG4gICAgcGxhdGZvcm1zLFxuICAgIG1lZGlhOiBleHRyYWN0TWVkaWEob2JqKSxcbiAgICBjYXJvdXNlbEltYWdlczogZXh0cmFjdENhcm91c2VsSW1hZ2VzKG9iaiwgaHRtbCksXG4gICAgc3RvcmVVcmw6IHVybCxcbiAgICBkaXNjb3VudEVuZEF0OiBleHRyYWN0RGlzY291bnRFbmRBdChvYmosIGh0bWwpLFxuICAgIGZldGNoZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy90eXBlcy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvdHlwZXMudHNcIjtleHBvcnQgdHlwZSBQbGF0Zm9ybSA9IFwicHNuXCIgfCBcInhib3hcIiB8IFwibmludGVuZG9cIiB8IFwic3RlYW1cIjtcblxuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0xBQkVMUzogUmVjb3JkPFBsYXRmb3JtLCBzdHJpbmc+ID0ge1xuICBwc246IFwiUGxheVN0YXRpb25cIixcbiAgeGJveDogXCJYYm94XCIsXG4gIG5pbnRlbmRvOiBcIk5pbnRlbmRvXCIsXG4gIHN0ZWFtOiBcIlN0ZWFtXCIsXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlZ2lvbkNvbmZpZyB7XG4gIGNvZGU6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgbG9jYWxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBQTEFURk9STV9SRUdJT05TOiBSZWNvcmQ8UGxhdGZvcm0sIFJlZ2lvbkNvbmZpZ1tdPiA9IHtcbiAgcHNuOiBbXG4gICAgeyBjb2RlOiBcInVzXCIsIGxhYmVsOiBcIlVTXCIsIGN1cnJlbmN5OiBcIlVTRFwiLCBsb2NhbGU6IFwiZW4tVVNcIiB9LFxuICAgIHsgY29kZTogXCJiclwiLCBsYWJlbDogXCJCcmFzaWxcIiwgY3VycmVuY3k6IFwiQlJMXCIsIGxvY2FsZTogXCJwdC1CUlwiIH0sXG4gIF0sXG4gIHhib3g6IFtcbiAgICB7IGNvZGU6IFwidXNcIiwgbGFiZWw6IFwiVVNcIiwgY3VycmVuY3k6IFwiVVNEXCIsIGxvY2FsZTogXCJlbi1VU1wiIH0sXG4gICAgeyBjb2RlOiBcImJyXCIsIGxhYmVsOiBcIkJyYXNpbFwiLCBjdXJyZW5jeTogXCJCUkxcIiwgbG9jYWxlOiBcInB0LUJSXCIgfSxcbiAgICB7IGNvZGU6IFwidHJcIiwgbGFiZWw6IFwiVHVycXVcdTAwRURhXCIsIGN1cnJlbmN5OiBcIlRSWVwiLCBsb2NhbGU6IFwidHItVFJcIiB9LFxuICBdLFxuICBuaW50ZW5kbzogW1xuICAgIHsgY29kZTogXCJ1c1wiLCBsYWJlbDogXCJVU1wiLCBjdXJyZW5jeTogXCJVU0RcIiwgbG9jYWxlOiBcImVuLVVTXCIgfSxcbiAgICB7IGNvZGU6IFwianBcIiwgbGFiZWw6IFwiSmFwXHUwMEYzblwiLCBjdXJyZW5jeTogXCJKUFlcIiwgbG9jYWxlOiBcImphXCIgfSxcbiAgXSxcbiAgc3RlYW06IFtcbiAgICB7IGNvZGU6IFwidXNcIiwgbGFiZWw6IFwiVVNcIiwgY3VycmVuY3k6IFwiVVNEXCIsIGxvY2FsZTogXCJlblwiIH0sXG4gICAgeyBjb2RlOiBcImJyXCIsIGxhYmVsOiBcIkJyYXNpbFwiLCBjdXJyZW5jeTogXCJCUkxcIiwgbG9jYWxlOiBcImJyYXppbGlhblwiIH0sXG4gICAgeyBjb2RlOiBcInRyXCIsIGxhYmVsOiBcIlR1cnF1XHUwMEVEYVwiLCBjdXJyZW5jeTogXCJUUllcIiwgbG9jYWxlOiBcInR1cmtpc2hcIiB9LFxuICBdLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBSYXdEZWFsIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBpbWFnZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgc3RvcmVVcmw6IHN0cmluZyB8IG51bGw7XG4gIGhhcmR3YXJlUGxhdGZvcm1zOiBzdHJpbmc7XG4gIGN1cnJlbmN5OiBzdHJpbmc7XG4gIHByaWNlT3JpZ2luYWxDZW50czogbnVtYmVyIHwgbnVsbDtcbiAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IG51bWJlciB8IG51bGw7XG4gIGRpc2NvdW50UGVyY2VudDogbnVtYmVyO1xuICBkaXNjb3VudEVuZEF0OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb3ZpZGVyU291cmNlIHtcbiAgcGxhdGZvcm06IFBsYXRmb3JtO1xuICByZWdpb246IHN0cmluZztcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgY2F0ZWdvcnlJZD86IHN0cmluZztcbiAgdXJsPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb3ZpZGVyIHtcbiAgcGxhdGZvcm06IFBsYXRmb3JtO1xuICBmZXRjaERlYWxzKHNvdXJjZTogUHJvdmlkZXJTb3VyY2UpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPjtcbn1cblxuZXhwb3J0IGNsYXNzIFByb3ZpZGVyRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBwbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgcHVibGljIHJlZ2lvbjogc3RyaW5nLFxuICAgIG1lc3NhZ2U6IHN0cmluZ1xuICApIHtcbiAgICBzdXBlcihgWyR7cGxhdGZvcm19LyR7cmVnaW9ufV0gJHttZXNzYWdlfWApO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3Bzbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvcHNuLnRzXCI7aW1wb3J0IHtcbiAgaXRlckNhdGVnb3J5UHJvZHVjdHMsXG4gIGlzRnVsbEdhbWVQcm9kdWN0LFxuICBub3JtYWxpemVQcm9kdWN0LFxuICBQc25BcGlFcnJvcixcbn0gZnJvbSBcIi4uL3BzblwiO1xuaW1wb3J0IHR5cGUgeyBQc25Db25maWcgfSBmcm9tIFwiLi4vc3RvcmVcIjtcbmltcG9ydCB0eXBlIHsgUHJvdmlkZXIsIFByb3ZpZGVyU291cmNlLCBSYXdEZWFsIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IHBzblByb3ZpZGVyOiBQcm92aWRlciA9IHtcbiAgcGxhdGZvcm06IFwicHNuXCIsXG4gIGFzeW5jICpmZXRjaERlYWxzKHNvdXJjZTogUHJvdmlkZXJTb3VyY2UpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gICAgY29uc3QgbG9jYWxlID1cbiAgICAgIHNvdXJjZS5yZWdpb24gPT09IFwiYnJcIiA/IFwicHQtQlJcIiA6IFwiZW4tVVNcIjtcbiAgICBjb25zdCBjZmc6IFBzbkNvbmZpZyA9IHtcbiAgICAgIHJlZ2lvbjogbG9jYWxlLFxuICAgICAgZGVhbHNDYXRlZ29yeUlkOiBzb3VyY2UuY2F0ZWdvcnlJZCB8fCBcIlwiLFxuICAgICAgY2F0ZWdvcnlHcmlkSGFzaDogXCJcIixcbiAgICAgIGluY2x1ZGVBZGRPbnM6IGZhbHNlLFxuICAgIH07XG5cbiAgICBpZiAoIWNmZy5kZWFsc0NhdGVnb3J5SWQpIHtcbiAgICAgIHRocm93IG5ldyBQc25BcGlFcnJvcihcbiAgICAgICAgXCJObyBzZSBjb25maWd1clx1MDBGMyB1biBDYXRlZ29yeSBJRCBwYXJhIFBTTiBcIiArIHNvdXJjZS5yZWdpb24udG9VcHBlckNhc2UoKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW5jeSA9IHNvdXJjZS5yZWdpb24gPT09IFwiYnJcIiA/IFwiQlJMXCIgOiBcIlVTRFwiO1xuXG4gICAgZm9yIGF3YWl0IChjb25zdCByYXcgb2YgaXRlckNhdGVnb3J5UHJvZHVjdHMoY2ZnKSkge1xuICAgICAgaWYgKCFpc0Z1bGxHYW1lUHJvZHVjdChyYXcpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIGNvbnN0IGdhbWUgPSBub3JtYWxpemVQcm9kdWN0KHJhdywgbm93KTtcbiAgICAgIGlmICghZ2FtZSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHJlZ2lvblBhdGggPSBsb2NhbGUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IHN0b3JlVXJsID0gYGh0dHBzOi8vc3RvcmUucGxheXN0YXRpb24uY29tLyR7cmVnaW9uUGF0aH0vcHJvZHVjdC8ke2dhbWUuaWR9YDtcblxuICAgICAgeWllbGQge1xuICAgICAgICBpZDogZ2FtZS5pZCxcbiAgICAgICAgbmFtZTogZ2FtZS5uYW1lLFxuICAgICAgICBpbWFnZVVybDogZ2FtZS5pbWFnZVVybCxcbiAgICAgICAgc3RvcmVVcmwsXG4gICAgICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBnYW1lLnBsYXRmb3JtcyxcbiAgICAgICAgY3VycmVuY3ksXG4gICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogZ2FtZS5wcmljZU9yaWdpbmFsQ2VudHMsXG4gICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBnYW1lLnByaWNlRGlzY291bnRlZENlbnRzLFxuICAgICAgICBkaXNjb3VudFBlcmNlbnQ6IGdhbWUuZGlzY291bnRQZXJjZW50LFxuICAgICAgICBkaXNjb3VudEVuZEF0OiBnYW1lLmRpc2NvdW50RW5kQXQsXG4gICAgICB9O1xuICAgIH1cbiAgfSxcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3hib3gudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL3hib3gudHNcIjtpbXBvcnQgdHlwZSB7IFByb3ZpZGVyLCBQcm92aWRlclNvdXJjZSwgUmF3RGVhbCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBQcm92aWRlckVycm9yIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuY29uc3QgTUFSS0VUX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgdXM6IFwiVVNcIixcbiAgYnI6IFwiQlJcIixcbiAgdHI6IFwiVFJcIixcbn07XG5cbmNvbnN0IExBTkdfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICB1czogXCJlbi1VU1wiLFxuICBicjogXCJwdC1CUlwiLFxuICB0cjogXCJ0ci1UUlwiLFxufTtcblxuY29uc3QgQ1VSUkVOQ1lfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICB1czogXCJVU0RcIixcbiAgYnI6IFwiQlJMXCIsXG4gIHRyOiBcIlRSWVwiLFxufTtcblxuaW50ZXJmYWNlIENhdGFsb2dQcm9kdWN0IHtcbiAgUHJvZHVjdElkOiBzdHJpbmc7XG4gIExvY2FsaXplZFByb3BlcnRpZXM/OiBBcnJheTx7XG4gICAgUHJvZHVjdFRpdGxlPzogc3RyaW5nO1xuICAgIEltYWdlcz86IEFycmF5PHsgSW1hZ2VQdXJwb3NlPzogc3RyaW5nOyBVcmk/OiBzdHJpbmcgfT47XG4gIH0+O1xuICBEaXNwbGF5U2t1QXZhaWxhYmlsaXRpZXM/OiBBcnJheTx7XG4gICAgU2t1PzogeyBQcm9wZXJ0aWVzPzogeyBGdWxmaWxsbWVudERhdGE/OiB7IFBsYXRmb3JtRGVwZW5kZW5jeUluZm8/OiBzdHJpbmcgfSB9IH07XG4gICAgQXZhaWxhYmlsaXRpZXM/OiBBcnJheTx7XG4gICAgICBDb25kaXRpb25zPzogeyBFbmREYXRlPzogc3RyaW5nIH07XG4gICAgICBPcmRlck1hbmFnZW1lbnREYXRhPzoge1xuICAgICAgICBQcmljZT86IHtcbiAgICAgICAgICBMaXN0UHJpY2U/OiBudW1iZXI7XG4gICAgICAgICAgTVNSUD86IG51bWJlcjtcbiAgICAgICAgICBXaG9sZXNhbGVQcmljZT86IG51bWJlcjtcbiAgICAgICAgICBDdXJyZW5jeUNvZGU/OiBzdHJpbmc7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0+O1xuICB9PjtcbiAgUHJvcGVydGllcz86IHtcbiAgICBDYXRlZ29yaWVzPzogc3RyaW5nW107XG4gICAgQ2F0ZWdvcnk/OiBzdHJpbmc7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHRvQ2VudHMocHJpY2U6IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKHByaWNlID09IG51bGwgfHwgIU51bWJlci5pc0Zpbml0ZShwcmljZSkpIHJldHVybiBudWxsO1xuICByZXR1cm4gTWF0aC5yb3VuZChwcmljZSAqIDEwMCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV2l0aFJldHJ5KHVybDogc3RyaW5nLCBpbml0PzogUmVxdWVzdEluaXQpOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGxldCBsYXN0RXJyb3I6IHVua25vd247XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNDsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgaGVhZGVyczogeyBcInVzZXItYWdlbnRcIjogVUEsIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICAgICAgLi4uaW5pdCxcbiAgICAgIH0pO1xuICAgICAgaWYgKHIuc3RhdHVzID09PSA0MjkpIHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDEwMDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gcjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBsYXN0RXJyb3I7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSnNvbih1cmw6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IHIgPSBhd2FpdCBmZXRjaFdpdGhSZXRyeSh1cmwpO1xuICBpZiAoIXIub2spIHtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgci50ZXh0KCkuY2F0Y2goKCkgPT4gXCJcIik7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9OiAke3RleHQuc2xpY2UoMCwgMjAwKX1gKTtcbiAgfVxuICByZXR1cm4gci5qc29uKCk7XG59XG5cbi8qKiBSZWN1cnNpdmVseSB3YWxrIGEgSlNPTiB0cmVlIGxvb2tpbmcgZm9yIFhib3ggcHJvZHVjdCBJRHMgKDEyLWNoYXIgYWxwaGFudW1lcmljIHN0YXJ0aW5nIHdpdGggOSkuICovXG5mdW5jdGlvbiBleHRyYWN0SWRzRnJvbVRyZWUobm9kZTogdW5rbm93biwgc2VlbjogU2V0PHN0cmluZz4sIGlkczogc3RyaW5nW10pOiB2b2lkIHtcbiAgaWYgKCFub2RlIHx8IHR5cGVvZiBub2RlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiICYmIC9eOVtBLVowLTldezExfSQvLnRlc3Qobm9kZSkgJiYgIXNlZW4uaGFzKG5vZGUpKSB7XG4gICAgICBzZWVuLmFkZChub2RlKTtcbiAgICAgIGlkcy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICBmb3IgKGNvbnN0IHYgb2Ygbm9kZSkgZXh0cmFjdElkc0Zyb21UcmVlKHYsIHNlZW4sIGlkcyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgdiBvZiBPYmplY3QudmFsdWVzKG5vZGUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pKSB7XG4gICAgZXh0cmFjdElkc0Zyb21UcmVlKHYsIHNlZW4sIGlkcyk7XG4gIH1cbn1cblxuLy8gVHJ5IG11bHRpcGxlIGVuZHBvaW50cyB0byBnZXQgZGVhbCBwcm9kdWN0IElEcy5cbi8vIFByaW1hcnk6IHJlY28tcHVibGljIChNaWNyb3NvZnQgUmVjb21tZW5kYXRpb25zIEFQSSlcbi8vIEZhbGxiYWNrOiBjYXRhbG9nLmdhbWVwYXNzLmNvbS9zaWdscyAoR2FtZSBQYXNzIHNpZ25hbHMgXHUyMDE0IGNvbnRhaW5zIGRlYWwgbGlzdHMpXG5hc3luYyBmdW5jdGlvbiBmZXRjaERlYWxJZHMoXG4gIG1hcmtldDogc3RyaW5nLFxuICBsYW5ndWFnZTogc3RyaW5nXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBBdHRlbXB0IDE6IFJlY28gQVBJXG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL3JlY28tcHVibGljLnJlYy5tcC5taWNyb3NvZnQuY29tL2NoYW5uZWxzL1JlY28vVjguMC9MaXN0cy9Db21wdXRlZC9EZWFsYCArXG4gICAgICBgP01hcmtldD0ke21hcmtldH0mTGFuZ3VhZ2U9JHtsYW5ndWFnZX0mSXRlbVR5cGVzPUdhbWVgICtcbiAgICAgIGAmZGV2aWNlRmFtaWx5PVdpbmRvd3MuWGJveCZjb3VudD0yMDAwJnNraXBpdGVtcz0wYDtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZmV0Y2hKc29uKHVybCk7XG4gICAgY29uc3QgaXRlbXM6IEFycmF5PHsgSWQ6IHN0cmluZyB9PiA9IGRhdGE/Lkl0ZW1zID8/IFtdO1xuICAgIGNvbnN0IGlkcyA9IGl0ZW1zLm1hcCgoaXQpID0+IGl0LklkKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgaWYgKGlkcy5sZW5ndGggPiAwKSByZXR1cm4gaWRzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3JzLnB1c2goYFJlY286ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gIH1cblxuICAvLyBBdHRlbXB0IDI6IFhib3ggY2F0YWxvZyBkZWFscyB2aWEgc2lnbHMgKHNpZ25hbCBsaXN0cylcbiAgLy8gRGVhbCBsaXN0IElEIGtub3duIGZyb20gWGJveCB3ZWJzaXRlIHNvdXJjZVxuICBjb25zdCBERUFMX0xJU1RfSUQgPSBcImY2ZjFmOTlmLTliNDktNGNjZC1iM2JmLTRkOTc2N2E3N2Y1ZVwiO1xuICB0cnkge1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9jYXRhbG9nLmdhbWVwYXNzLmNvbS9zaWdscy92MmAgK1xuICAgICAgYD9pZD0ke0RFQUxfTElTVF9JRH0mbGFuZ3VhZ2U9JHtsYW5ndWFnZS5zcGxpdChcIi1cIilbMF19Jm1hcmtldD0ke21hcmtldH1gO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaEpzb24odXJsKTtcbiAgICBjb25zdCBpdGVtczogQXJyYXk8eyBpZD86IHN0cmluZyB9PiA9IEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW107XG4gICAgY29uc3QgaWRzID0gaXRlbXMubWFwKChpdCkgPT4gaXQuaWQpLmZpbHRlcigoaWQpOiBpZCBpcyBzdHJpbmcgPT4gISFpZCk7XG4gICAgaWYgKGlkcy5sZW5ndGggPiAwKSByZXR1cm4gaWRzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3JzLnB1c2goYFNpZ2xzOiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICB9XG5cbiAgLy8gQXR0ZW1wdCAzOiBTZWFyY2ggZGlzcGxheWNhdGFsb2cgZm9yIGdhbWVzIHdpdGggZGVhbHNcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vZGlzcGxheWNhdGFsb2cubXAubWljcm9zb2Z0LmNvbS92Ny4wL3Byb2R1Y3RzL3NlYXJjaGAgK1xuICAgICAgYD9xdWVyeT1kZWFsJm1hcmtldD0ke21hcmtldH0mbGFuZ3VhZ2VzPSR7bGFuZ3VhZ2V9YCArXG4gICAgICBgJmZpZWxkc1RlbXBsYXRlPWRldGFpbHMmdG9wPTIwMGA7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgIGNvbnN0IHByb2R1Y3RzOiBDYXRhbG9nUHJvZHVjdFtdID0gZGF0YT8uUHJvZHVjdHMgPz8gW107XG4gICAgY29uc3QgaWRzID0gcHJvZHVjdHMubWFwKChwKSA9PiBwLlByb2R1Y3RJZCkuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGlmIChpZHMubGVuZ3RoID4gMCkgcmV0dXJuIGlkcztcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9ycy5wdXNoKGBTZWFyY2g6ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gIH1cblxuICAvLyBBdHRlbXB0IDQ6IEhUTUwgZmFsbGJhY2sgXHUyMDE0IHNjcmFwZSB4Ym94LmNvbSBkZWFscyBwYWdlIGZvciBwcm9kdWN0IElEc1xuICB0cnkge1xuICAgIGNvbnN0IGJyb3dzZVVybCA9XG4gICAgICBgaHR0cHM6Ly93d3cueGJveC5jb20vZW4tVVMvZ2FtZXMvYnJvd3NlP0ZpbHRlcmVkQnlJZHM9RHluYW1pY0NoYW5uZWwuR2FtZURlYWxzYDtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2hXaXRoUmV0cnkoYnJvd3NlVXJsLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwidXNlci1hZ2VudFwiOiBVQSxcbiAgICAgICAgYWNjZXB0OiBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICBcImFjY2VwdC1sYW5ndWFnZVwiOiBsYW5ndWFnZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyLnN0YXR1c31gKTtcbiAgICB9XG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IHIudGV4dCgpO1xuICAgIGNvbnN0IGlkczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICAvLyBTdHJhdGVneSBBOiBQYXJzZSBfX05FWFRfREFUQV9fIEpTT04gYmxvYiBmb3IgcHJvZHVjdCBJRHNcbiAgICBjb25zdCBuZXh0RGF0YU1hdGNoID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoaHRtbCk7XG4gICAgaWYgKG5leHREYXRhTWF0Y2gpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG5leHREYXRhID0gSlNPTi5wYXJzZShuZXh0RGF0YU1hdGNoWzFdKTtcbiAgICAgICAgZXh0cmFjdElkc0Zyb21UcmVlKG5leHREYXRhLCBzZWVuLCBpZHMpO1xuICAgICAgfSBjYXRjaCB7IC8qIG1hbGZvcm1lZCBKU09OICovIH1cbiAgICB9XG5cbiAgICAvLyBTdHJhdGVneSBCOiBMb29rIGZvciAxMi1jaGFyYWN0ZXIgYWxwaGFudW1lcmljIHByb2R1Y3QgSURzIGluIGRhdGEgYXR0cmlidXRlc1xuICAgIGlmIChpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBhdHRyUmVnZXggPSAvZGF0YS1bYS16LV0qaWQ9W1wiJ10oW0EtWjAtOV17MTJ9KVtcIiddL2dpO1xuICAgICAgbGV0IGF0dHJNYXRjaDtcbiAgICAgIHdoaWxlICgoYXR0ck1hdGNoID0gYXR0clJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGlkID0gYXR0ck1hdGNoWzFdO1xuICAgICAgICBpZiAoIXNlZW4uaGFzKGlkKSkge1xuICAgICAgICAgIHNlZW4uYWRkKGlkKTtcbiAgICAgICAgICBpZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTdHJhdGVneSBDOiBGaW5kIGFueSAxMi1jaGFyIHVwcGVyY2FzZSBhbHBoYW51bWVyaWMgc3RyaW5ncyB0aGF0IGxvb2sgbGlrZSBYYm94IHByb2R1Y3QgSURzXG4gICAgaWYgKGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IGlkUmVnZXggPSAvXFxiKDlbQS1aMC05XXsxMX0pXFxiL2c7XG4gICAgICBsZXQgaWRNYXRjaDtcbiAgICAgIHdoaWxlICgoaWRNYXRjaCA9IGlkUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgaWQgPSBpZE1hdGNoWzFdO1xuICAgICAgICBpZiAoIXNlZW4uaGFzKGlkKSkge1xuICAgICAgICAgIHNlZW4uYWRkKGlkKTtcbiAgICAgICAgICBpZHMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHJldHVybiBpZHM7XG4gICAgZXJyb3JzLnB1c2goYEhUTUwgc2NyYXBlOiBmb3VuZCAwIHByb2R1Y3QgSURzIGluICR7aHRtbC5sZW5ndGh9IGJ5dGVzIG9mIEhUTUxgKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9ycy5wdXNoKGBIVE1MIHNjcmFwZTogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihgQWxsIFhib3ggZGVhbCBlbmRwb2ludHMgZmFpbGVkOiAke2Vycm9ycy5qb2luKFwiIHwgXCIpfWApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFByb2R1Y3REZXRhaWxzKFxuICBpZHM6IHN0cmluZ1tdLFxuICBtYXJrZXQ6IHN0cmluZyxcbiAgbGFuZ3VhZ2U6IHN0cmluZ1xuKTogUHJvbWlzZTxDYXRhbG9nUHJvZHVjdFtdPiB7XG4gIGNvbnN0IGJhdGNoU2l6ZSA9IDIwO1xuICBjb25zdCBhbGw6IENhdGFsb2dQcm9kdWN0W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpZHMubGVuZ3RoOyBpICs9IGJhdGNoU2l6ZSkge1xuICAgIGNvbnN0IGJhdGNoID0gaWRzLnNsaWNlKGksIGkgKyBiYXRjaFNpemUpO1xuICAgIGNvbnN0IHVybCA9XG4gICAgICBgaHR0cHM6Ly9kaXNwbGF5Y2F0YWxvZy5tcC5taWNyb3NvZnQuY29tL3Y3LjAvcHJvZHVjdHNgICtcbiAgICAgIGA/YmlnSWRzPSR7YmF0Y2guam9pbihcIixcIil9Jm1hcmtldD0ke21hcmtldH0mbGFuZ3VhZ2VzPSR7bGFuZ3VhZ2V9YCArXG4gICAgICBgJk1TLUNWPURHVTFtY3VZbzBXTU1wK0YuMWA7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaEpzb24odXJsKTtcbiAgICAgIGNvbnN0IHByb2R1Y3RzOiBDYXRhbG9nUHJvZHVjdFtdID0gZGF0YT8uUHJvZHVjdHMgPz8gW107XG4gICAgICBhbGwucHVzaCguLi5wcm9kdWN0cyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBTa2lwIGZhaWxlZCBiYXRjaCwgY29udGludWUgd2l0aCByZXN0XG4gICAgfVxuICB9XG4gIHJldHVybiBhbGw7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RHYW1lRGF0YShcbiAgcHJvZHVjdDogQ2F0YWxvZ1Byb2R1Y3QsXG4gIHJlZ2lvbjogc3RyaW5nXG4pOiBSYXdEZWFsIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gcHJvZHVjdC5Qcm9kdWN0SWQ7XG4gIGlmICghaWQpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGxwID0gcHJvZHVjdC5Mb2NhbGl6ZWRQcm9wZXJ0aWVzPy5bMF07XG4gIGNvbnN0IG5hbWUgPSBscD8uUHJvZHVjdFRpdGxlO1xuICBpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXG4gIGxldCBpbWFnZVVybDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGltYWdlcyA9IGxwPy5JbWFnZXMgPz8gW107XG4gIGNvbnN0IGhlcm8gPSBpbWFnZXMuZmluZChcbiAgICAoaW1nKSA9PiBpbWcuSW1hZ2VQdXJwb3NlID09PSBcIlN1cGVySGVyb0FydFwiIHx8IGltZy5JbWFnZVB1cnBvc2UgPT09IFwiUG9zdGVyXCJcbiAgKTtcbiAgY29uc3QgYm94QXJ0ID0gaW1hZ2VzLmZpbmQoKGltZykgPT4gaW1nLkltYWdlUHVycG9zZSA9PT0gXCJCb3hBcnRcIik7XG4gIGNvbnN0IGFueUltZyA9IGltYWdlc1swXTtcbiAgY29uc3QgY2hvc2VuID0gaGVybyB8fCBib3hBcnQgfHwgYW55SW1nO1xuICBpZiAoY2hvc2VuPy5VcmkpIHtcbiAgICBpbWFnZVVybCA9IGNob3Nlbi5Vcmkuc3RhcnRzV2l0aChcIi8vXCIpXG4gICAgICA/IFwiaHR0cHM6XCIgKyBjaG9zZW4uVXJpXG4gICAgICA6IGNob3Nlbi5Vcmk7XG4gIH1cblxuICBjb25zdCBkc2EgPSBwcm9kdWN0LkRpc3BsYXlTa3VBdmFpbGFiaWxpdGllcz8uWzBdO1xuICBjb25zdCBhdmFpbHMgPSBkc2E/LkF2YWlsYWJpbGl0aWVzID8/IFtdO1xuXG4gIGxldCBsaXN0UHJpY2U6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBsZXQgc2FsZVByaWNlOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgbGV0IGVuZERhdGU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBjb25zdCBjdXJyZW5jeSA9IENVUlJFTkNZX01BUFtyZWdpb25dIHx8IFwiVVNEXCI7XG5cbiAgZm9yIChjb25zdCBhIG9mIGF2YWlscykge1xuICAgIGNvbnN0IHAgPSBhLk9yZGVyTWFuYWdlbWVudERhdGE/LlByaWNlO1xuICAgIGlmICghcCkgY29udGludWU7XG4gICAgY29uc3QgbXNycCA9IHAuTVNSUCA/PyBwLkxpc3RQcmljZTtcbiAgICBjb25zdCBzYWxlID0gcC5MaXN0UHJpY2UgPz8gcC5XaG9sZXNhbGVQcmljZTtcbiAgICBpZiAobXNycCAhPSBudWxsICYmIGxpc3RQcmljZSA9PSBudWxsKSBsaXN0UHJpY2UgPSBtc3JwO1xuICAgIGlmIChzYWxlICE9IG51bGwgJiYgc2FsZSA8IChtc3JwID8/IEluZmluaXR5KSkge1xuICAgICAgc2FsZVByaWNlID0gc2FsZTtcbiAgICAgIGVuZERhdGUgPSBhLkNvbmRpdGlvbnM/LkVuZERhdGUgPz8gbnVsbDtcbiAgICB9XG4gIH1cblxuICBpZiAobGlzdFByaWNlID09IG51bGwgJiYgc2FsZVByaWNlID09IG51bGwpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IG9yaWdpbmFsQ2VudHMgPSB0b0NlbnRzKGxpc3RQcmljZSk7XG4gIGNvbnN0IGRpc2NvdW50ZWRDZW50cyA9IHRvQ2VudHMoc2FsZVByaWNlKSA/PyBvcmlnaW5hbENlbnRzO1xuICBsZXQgZGlzY291bnRQZXJjZW50ID0gMDtcbiAgaWYgKFxuICAgIG9yaWdpbmFsQ2VudHMgJiZcbiAgICBkaXNjb3VudGVkQ2VudHMgIT0gbnVsbCAmJlxuICAgIGRpc2NvdW50ZWRDZW50cyA8IG9yaWdpbmFsQ2VudHNcbiAgKSB7XG4gICAgZGlzY291bnRQZXJjZW50ID0gTWF0aC5yb3VuZChcbiAgICAgICgob3JpZ2luYWxDZW50cyAtIGRpc2NvdW50ZWRDZW50cykgKiAxMDApIC8gb3JpZ2luYWxDZW50c1xuICAgICk7XG4gIH1cblxuICBjb25zdCBtYXJrZXQgPSBNQVJLRVRfTUFQW3JlZ2lvbl0gfHwgXCJVU1wiO1xuICBjb25zdCBzdG9yZVVybCA9IGBodHRwczovL3d3dy54Ym94LmNvbS8ke21hcmtldC50b0xvd2VyQ2FzZSgpfS9nYW1lcy9zdG9yZS8ke2VuY29kZVVSSUNvbXBvbmVudChuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikpfS8ke2lkfWA7XG5cbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICBuYW1lLFxuICAgIGltYWdlVXJsLFxuICAgIHN0b3JlVXJsLFxuICAgIGhhcmR3YXJlUGxhdGZvcm1zOiBcIlhib3ggU2VyaWVzIFh8UywgWGJveCBPbmVcIixcbiAgICBjdXJyZW5jeSxcbiAgICBwcmljZU9yaWdpbmFsQ2VudHM6IG9yaWdpbmFsQ2VudHMsXG4gICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRpc2NvdW50ZWRDZW50cyxcbiAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgZGlzY291bnRFbmRBdDogZW5kRGF0ZSxcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHhib3hQcm92aWRlcjogUHJvdmlkZXIgPSB7XG4gIHBsYXRmb3JtOiBcInhib3hcIixcbiAgYXN5bmMgKmZldGNoRGVhbHMoc291cmNlOiBQcm92aWRlclNvdXJjZSk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgICBjb25zdCBtYXJrZXQgPSBNQVJLRVRfTUFQW3NvdXJjZS5yZWdpb25dO1xuICAgIGNvbnN0IGxhbmd1YWdlID0gTEFOR19NQVBbc291cmNlLnJlZ2lvbl07XG4gICAgaWYgKCFtYXJrZXQgfHwgIWxhbmd1YWdlKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcInhib3hcIiwgc291cmNlLnJlZ2lvbiwgYFJlZ2lcdTAwRjNuIG5vIHNvcG9ydGFkYTogJHtzb3VyY2UucmVnaW9ufWApO1xuICAgIH1cblxuICAgIGNvbnN0IGlkcyA9IGF3YWl0IGZldGNoRGVhbElkcyhtYXJrZXQsIGxhbmd1YWdlKTtcbiAgICBpZiAoaWRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBmZXRjaFByb2R1Y3REZXRhaWxzKGlkcywgbWFya2V0LCBsYW5ndWFnZSk7XG5cbiAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgcHJvZHVjdHMpIHtcbiAgICAgIGNvbnN0IGRlYWwgPSBleHRyYWN0R2FtZURhdGEocHJvZHVjdCwgc291cmNlLnJlZ2lvbik7XG4gICAgICBpZiAoZGVhbCAmJiBkZWFsLmRpc2NvdW50UGVyY2VudCA+IDApIHtcbiAgICAgICAgeWllbGQgZGVhbDtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9zdGVhbS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvc3RlYW0udHNcIjtpbXBvcnQgdHlwZSB7IFByb3ZpZGVyLCBQcm92aWRlclNvdXJjZSwgUmF3RGVhbCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBQcm92aWRlckVycm9yIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuY29uc3QgVUEgPVxuICBcIk1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiBcIiArXG4gIFwiKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzZcIjtcblxuY29uc3QgQ0NfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICB1czogXCJ1c1wiLFxuICBicjogXCJiclwiLFxuICB0cjogXCJ0clwiLFxufTtcblxuY29uc3QgQ1VSUkVOQ1lfTUFQOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICB1czogXCJVU0RcIixcbiAgYnI6IFwiQlJMXCIsXG4gIHRyOiBcIlRSWVwiLFxufTtcblxuaW50ZXJmYWNlIFN0ZWFtU2VhcmNoUmVzdWx0IHtcbiAgbmFtZTogc3RyaW5nO1xuICBsb2dvOiBzdHJpbmc7XG4gIHRvdGFsX2NvdW50PzogbnVtYmVyO1xuICBpdGVtcz86IEFycmF5PHtcbiAgICB0eXBlOiBzdHJpbmc7XG4gICAgaWQ6IG51bWJlcjtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgbG9nbzogc3RyaW5nO1xuICAgIGxvZ29fcG9zaXRpb246IG51bWJlcjtcbiAgfT47XG59XG5cbmludGVyZmFjZSBTdGVhbVNlYXJjaEl0ZW0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGxvZ286IHN0cmluZztcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hKc29uKHVybDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgbGV0IGxhc3RFcnJvcjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCA0OyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFVBLFxuICAgICAgICAgIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2phdmFzY3JpcHQsICovKlwiLFxuICAgICAgICAgIGNvb2tpZTogXCJ3YW50c19tYXR1cmVfY29udGVudD0xOyBiaXJ0aHRpbWU9NTY4MDIyNDAxOyBTdGVhbV9MYW5ndWFnZT1lbmdsaXNoXCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlmICghci5vaykge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgci50ZXh0KCkuY2F0Y2goKCkgPT4gXCJcIik7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfTogJHt0ZXh0LnNsaWNlKDAsIDIwMCl9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXdhaXQgci5qc29uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEVycm9yID0gZTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVycm9yO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN0ZWFtUHJpY2UocHJpY2VTdHI6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKCFwcmljZVN0cikgcmV0dXJuIG51bGw7XG4gIC8vIERlY29kZSBIVE1MIGVudGl0aWVzIGFuZCBzdHJpcCBub24tYnJlYWtpbmcgc3BhY2VzXG4gIGNvbnN0IHMgPSBwcmljZVN0clxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoLyYjXFxkKzsvZywgXCJcIilcbiAgICAudHJpbSgpO1xuICBpZiAoIXMgfHwgL15mcmVlL2kudGVzdChzKSB8fCAvZ3JhdGlzL2kudGVzdChzKSkgcmV0dXJuIG51bGw7XG4gIC8vIFN0cmlwIGN1cnJlbmN5IHN5bWJvbHMgYW5kIGxldHRlcnMsIGtlZXAgZGlnaXRzLCBkb3RzLCBjb21tYXNcbiAgY29uc3QgY2xlYW5lZCA9IHMucmVwbGFjZSgvW14wLTkuLC1dL2csIFwiXCIpO1xuICBpZiAoIWNsZWFuZWQpIHJldHVybiBudWxsO1xuICAvLyBTdGVhbSBmb3JtYXRzOiBcIiQxOS45OVwiIChVUyksIFwiUiQgODksOTBcIiAoQlIpLCBcIjExOSw5OSBUTFwiIChUUilcbiAgLy8gQWxzbyBoYW5kbGVzIFwiMS4wODksOTBcIiAoQlIgdGhvdXNhbmRzIHNlcGFyYXRvcilcbiAgY29uc3QgcGFydHMgPSBjbGVhbmVkLnNwbGl0KC9bLixdLyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggPj0gMikge1xuICAgIGNvbnN0IGxhc3RQYXJ0ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gICAgaWYgKGxhc3RQYXJ0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgY29uc3Qgd2hvbGUgPSBwYXJ0cy5zbGljZSgwLCAtMSkuam9pbihcIlwiKTtcbiAgICAgIGNvbnN0IG4gPSBOdW1iZXIod2hvbGUgKyBcIi5cIiArIGxhc3RQYXJ0KTtcbiAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUobikpIHJldHVybiBNYXRoLnJvdW5kKG4gKiAxMDApO1xuICAgIH1cbiAgfVxuICAvLyBGYWxsYmFjazogdHJlYXQgY29tbWFzIGFzIGRlY2ltYWwgc2VwYXJhdG9yc1xuICBjb25zdCBuID0gTnVtYmVyKGNsZWFuZWQucmVwbGFjZSgvLC9nLCBcIi5cIikpO1xuICBpZiAoTnVtYmVyLmlzRmluaXRlKG4pKSByZXR1cm4gTWF0aC5yb3VuZChuICogMTAwKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmludGVyZmFjZSBTdGVhbVNlYXJjaFJlc3VsdEl0ZW0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGFwcGlkOiBzdHJpbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaFN0ZWFtRGVhbHMoXG4gIGNjOiBzdHJpbmcsXG4gIGN1cnJlbmN5OiBzdHJpbmcsXG4gIHJlZ2lvbjogc3RyaW5nXG4pOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gIGNvbnN0IHBhZ2VTaXplID0gMTAwO1xuICBjb25zdCBtYXhQYWdlcyA9IDMwO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChsZXQgcGFnZSA9IDA7IHBhZ2UgPCBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBwYWdlICogcGFnZVNpemU7XG4gICAgY29uc3QgdXJsID1cbiAgICAgIGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vc2VhcmNoL3Jlc3VsdHMvP3F1ZXJ5JnN0YXJ0PSR7c3RhcnR9YCArXG4gICAgICBgJmNvdW50PSR7cGFnZVNpemV9JmR5bmFtaWNfZGF0YT0mc29ydF9ieT1fQVNDJnNwZWNpYWxzPTFgICtcbiAgICAgIGAmc25yPTFfN183XzIzMF83JmluZmluaXRlPTEmY2M9JHtjY31gO1xuXG4gICAgbGV0IGRhdGE6IGFueTtcbiAgICB0cnkge1xuICAgICAgZGF0YSA9IGF3YWl0IGZldGNoSnNvbih1cmwpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChwYWdlID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFwic3RlYW1cIiwgcmVnaW9uLCBgU3RlYW0gc2VhcmNoIGZhaWxlZDogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGh0bWw6IHN0cmluZyA9IGRhdGE/LnJlc3VsdHNfaHRtbCA/PyBcIlwiO1xuICAgIGlmICghaHRtbCB8fCBodG1sLnRyaW0oKSA9PT0gXCJcIikge1xuICAgICAgaWYgKHBhZ2UgPT09IDApIHtcbiAgICAgICAgY29uc3QgdG90YWwgPSBkYXRhPy50b3RhbF9jb3VudCA/PyBcIj9cIjtcbiAgICAgICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXCJzdGVhbVwiLCByZWdpb24sIGBTdGVhbSByZXR1cm5lZCBlbXB0eSBIVE1MICh0b3RhbF9jb3VudD0ke3RvdGFsfSwgcHJldmlldzogJHtodG1sLnNsaWNlKDAsIDIwMCl9KWApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gU3BsaXQgSFRNTCBpbnRvIGluZGl2aWR1YWwgcmVzdWx0IHJvd3MgYnkgYW5jaG9yIGJvdW5kYXJpZXNcbiAgICBjb25zdCBhbmNob3JzOiB7IGFwcElkOiBzdHJpbmc7IGJsb2NrOiBzdHJpbmcgfVtdID0gW107XG4gICAgY29uc3QgYW5jaG9yU3RhcnRzID0gWy4uLmh0bWwubWF0Y2hBbGwoLzxhW14+XSpkYXRhLWRzLWFwcGlkPVwiKFxcZCspXCIvZyldO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYW5jaG9yU3RhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhcHBJZCA9IGFuY2hvclN0YXJ0c1tpXVsxXTtcbiAgICAgIGNvbnN0IHN0YXJ0SWR4ID0gYW5jaG9yU3RhcnRzW2ldLmluZGV4ITtcbiAgICAgIGNvbnN0IGVuZElkeCA9IGkgKyAxIDwgYW5jaG9yU3RhcnRzLmxlbmd0aCA/IGFuY2hvclN0YXJ0c1tpICsgMV0uaW5kZXghIDogaHRtbC5sZW5ndGg7XG4gICAgICBhbmNob3JzLnB1c2goeyBhcHBJZCwgYmxvY2s6IGh0bWwuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCkgfSk7XG4gICAgfVxuXG4gICAgbGV0IGZvdW5kT25QYWdlID0gMDtcblxuICAgIGZvciAoY29uc3QgeyBhcHBJZCwgYmxvY2s6IHJvdyB9IG9mIGFuY2hvcnMpIHtcbiAgICAgIGlmIChzZWVuLmhhcyhhcHBJZCkpIGNvbnRpbnVlO1xuICAgICAgc2Vlbi5hZGQoYXBwSWQpO1xuXG4gICAgICBjb25zdCBuYW1lTWF0Y2ggPSAvPHNwYW4gY2xhc3M9XCJ0aXRsZVwiPihbXjxdKyk8XFwvc3Bhbj4vLmV4ZWMocm93KTtcbiAgICAgIGlmICghbmFtZU1hdGNoKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lTWF0Y2hbMV0udHJpbSgpO1xuXG4gICAgICBjb25zdCBwY3RNYXRjaCA9IC9kaXNjb3VudF9wY3RbXj5dKj4oW148XSopPC8uZXhlYyhyb3cpO1xuICAgICAgY29uc3Qgb3JpZ01hdGNoID0gL2Rpc2NvdW50X29yaWdpbmFsX3ByaWNlW14+XSo+KFtePF0qKTwvLmV4ZWMocm93KTtcbiAgICAgIGNvbnN0IGZpbmFsTWF0Y2ggPSAvZGlzY291bnRfZmluYWxfcHJpY2VbXj5dKj4oW148XSopPC8uZXhlYyhyb3cpO1xuXG4gICAgICBjb25zdCBkaXNjb3VudFBjdFN0ciA9IHBjdE1hdGNoPy5bMV0/LnRyaW0oKS5yZXBsYWNlKC9bLSVdL2csIFwiXCIpID8/IFwiXCI7XG4gICAgICBjb25zdCBvcmlnaW5hbFByaWNlU3RyID0gb3JpZ01hdGNoPy5bMV0/LnRyaW0oKSA/PyBcIlwiO1xuICAgICAgY29uc3QgZmluYWxQcmljZVN0ciA9IGZpbmFsTWF0Y2g/LlsxXT8udHJpbSgpID8/IFwiXCI7XG5cbiAgICAgIGNvbnN0IGRpc2NvdW50UGVyY2VudCA9IHBhcnNlSW50KGRpc2NvdW50UGN0U3RyKSB8fCAwO1xuICAgICAgY29uc3Qgb3JpZ2luYWxDZW50cyA9IHBhcnNlU3RlYW1QcmljZShvcmlnaW5hbFByaWNlU3RyKTtcbiAgICAgIGNvbnN0IGRpc2NvdW50ZWRDZW50cyA9IHBhcnNlU3RlYW1QcmljZShmaW5hbFByaWNlU3RyKTtcblxuICAgICAgaWYgKCFvcmlnaW5hbENlbnRzICYmICFkaXNjb3VudGVkQ2VudHMpIGNvbnRpbnVlO1xuICAgICAgZm91bmRPblBhZ2UrKztcblxuICAgICAgeWllbGQge1xuICAgICAgICBpZDogYXBwSWQsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGltYWdlVXJsOiBgaHR0cHM6Ly9jZG4uYWthbWFpLnN0ZWFtc3RhdGljLmNvbS9zdGVhbS9hcHBzLyR7YXBwSWR9L2hlYWRlci5qcGdgLFxuICAgICAgICBzdG9yZVVybDogYGh0dHBzOi8vc3RvcmUuc3RlYW1wb3dlcmVkLmNvbS9hcHAvJHthcHBJZH0vYCxcbiAgICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiUENcIixcbiAgICAgICAgY3VycmVuY3ksXG4gICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogb3JpZ2luYWxDZW50cyxcbiAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRpc2NvdW50ZWRDZW50cyA/PyBvcmlnaW5hbENlbnRzLFxuICAgICAgICBkaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBkYXRhPy50b3RhbF9jb3VudCA/PyAwO1xuICAgIGlmIChzdGFydCArIHBhZ2VTaXplID49IHRvdGFsQ291bnQgfHwgZm91bmRPblBhZ2UgPT09IDApIGJyZWFrO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzdGVhbVByb3ZpZGVyOiBQcm92aWRlciA9IHtcbiAgcGxhdGZvcm06IFwic3RlYW1cIixcbiAgYXN5bmMgKmZldGNoRGVhbHMoc291cmNlOiBQcm92aWRlclNvdXJjZSk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgICBjb25zdCBjYyA9IENDX01BUFtzb3VyY2UucmVnaW9uXTtcbiAgICBjb25zdCBjdXJyZW5jeSA9IENVUlJFTkNZX01BUFtzb3VyY2UucmVnaW9uXTtcbiAgICBpZiAoIWNjIHx8ICFjdXJyZW5jeSkge1xuICAgICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXG4gICAgICAgIFwic3RlYW1cIixcbiAgICAgICAgc291cmNlLnJlZ2lvbixcbiAgICAgICAgYFJlZ2lcdTAwRjNuIG5vIHNvcG9ydGFkYTogJHtzb3VyY2UucmVnaW9ufWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgeWllbGQqIGZldGNoU3RlYW1EZWFscyhjYywgY3VycmVuY3ksIHNvdXJjZS5yZWdpb24pO1xuICB9LFxufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvbmludGVuZG8udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHJvdmlkZXJzL25pbnRlbmRvLnRzXCI7aW1wb3J0IHR5cGUgeyBQcm92aWRlciwgUHJvdmlkZXJTb3VyY2UsIFJhd0RlYWwgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgUHJvdmlkZXJFcnJvciB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IFVBID1cbiAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgXCIgK1xuICBcIihLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2XCI7XG5cbmNvbnN0IENVUlJFTkNZX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgdXM6IFwiVVNEXCIsXG4gIGpwOiBcIkpQWVwiLFxufTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hXaXRoUmV0cnkoXG4gIHVybDogc3RyaW5nLFxuICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuKTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICBsZXQgbGFzdEVycm9yOiB1bmtub3duO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDQ7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIGhlYWRlcnM6IHsgXCJ1c2VyLWFnZW50XCI6IFVBLCAuLi5oZWFkZXJzIH0sXG4gICAgICB9KTtcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gNDAzIHx8IHIuc3RhdHVzID09PSA0MjkpIHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDEwMDAgKiAyICoqIGF0dGVtcHQpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gcjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBsYXN0RXJyb3I7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoSnNvbih1cmw6IHN0cmluZywgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCByID0gYXdhaXQgZmV0Y2hXaXRoUmV0cnkodXJsLCB7XG4gICAgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAuLi5oZWFkZXJzLFxuICB9KTtcbiAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyLnN0YXR1c31gKTtcbiAgcmV0dXJuIHIuanNvbigpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEh0bWwodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCByID0gYXdhaXQgZmV0Y2hXaXRoUmV0cnkodXJsLCB7XG4gICAgYWNjZXB0OiBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IFwiamFcIixcbiAgfSk7XG4gIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9YCk7XG4gIHJldHVybiByLnRleHQoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9zdEpzb24odXJsOiBzdHJpbmcsIGJvZHk6IGFueSwgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBQcm9taXNlPGFueT4ge1xuICBsZXQgbGFzdEVycm9yOiB1bmtub3duO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDQ7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgYWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAuLi5oZWFkZXJzLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICAgIH0pO1xuICAgICAgaWYgKCFyLm9rKSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByLnRleHQoKS5jYXRjaCgoKSA9PiBcIlwiKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7ci5zdGF0dXN9OiAke3RleHQuc2xpY2UoMCwgMjAwKX1gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhd2FpdCByLmpzb24oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBsYXN0RXJyb3I7XG59XG5cbi8vIC0tLSBVUyBlU2hvcCB2aWEgQWxnb2xpYSAoc2FtZSBBUEkgdGhlIE5pbnRlbmRvIHdlYnNpdGUgdXNlcykgLS0tXG5cbmNvbnN0IEFMR09MSUFfQVBQX0lEID0gXCJVM0I2R1I0VUEzXCI7XG5jb25zdCBBTEdPTElBX0FQSV9LRVkgPSBcImEyOWM2OTI3NjM4YmZkOGNlZTIzOTkzZTUxZTcyMWM5XCI7XG5jb25zdCBBTEdPTElBX0lOREVYID0gXCJzdG9yZV9nYW1lX2VuX3VzXCI7XG5cbmludGVyZmFjZSBBbGdvbGlhSGl0IHtcbiAgb2JqZWN0SUQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbnN1aWQ/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbiAgcHJvZHVjdEltYWdlU3F1YXJlPzogc3RyaW5nO1xuICBwcm9kdWN0SW1hZ2U/OiBzdHJpbmc7XG4gIHBsYXRmb3JtPzogc3RyaW5nO1xuICBwcmljZT86IHtcbiAgICByZWdQcmljZT86IG51bWJlcjtcbiAgICBzYWxlUHJpY2U/OiBudW1iZXI7XG4gICAgcGVyY2VudE9mZj86IG51bWJlcjtcbiAgICBkaXNjb3VudGVkPzogYm9vbGVhbjtcbiAgfTtcbiAgZXNob3BEZXRhaWxzPzoge1xuICAgIGRpc2NvdW50UHJpY2VFbmQ/OiBzdHJpbmc7XG4gICAgY3VycmVuY3k/OiBzdHJpbmc7XG4gIH07XG59XG5cbi8vIFRyeSBtdWx0aXBsZSBBbGdvbGlhIGZpbHRlciBzdHJhdGVnaWVzOyBOaW50ZW5kbyBkb2Vzbid0IGRvY3VtZW50IHdoaWNoXG4vLyBhdHRyaWJ1dGVzIGFyZSBjb25maWd1cmVkIGFzIGZpbHRlcmFibGUsIHNvIHdlIGNhc2NhZGUgdW50aWwgb25lIHdvcmtzLlxuY29uc3QgRklMVEVSX1NUUkFURUdJRVMgPSBbXG4gIGBmYWNldEZpbHRlcnM9JHtlbmNvZGVVUklDb21wb25lbnQoJ1tbXCJnZW5lcmFsRmlsdGVyczpEZWFsc1wiXV0nKX1gLFxuICBgZmFjZXRGaWx0ZXJzPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdbW1wiZ2VuZXJhbEZpbHRlcnM6T24gc2FsZVwiXV0nKX1gLFxuICBgbnVtZXJpY0ZpbHRlcnM9JHtlbmNvZGVVUklDb21wb25lbnQoJ1tcInByaWNlLnBlcmNlbnRPZmY+MFwiXScpfWAsXG4gIFwiXCIsIC8vIG5vIGZpbHRlciBcdTIwMTQgZmV0Y2ggZXZlcnl0aGluZyBhbmQgZmlsdGVyIGluIGNvZGVcbl07XG5cbmFzeW5jIGZ1bmN0aW9uIGFsZ29saWFRdWVyeShcbiAgcGFyYW1zOiBzdHJpbmcsXG4pOiBQcm9taXNlPGFueT4ge1xuICByZXR1cm4gcG9zdEpzb24oXG4gICAgYGh0dHBzOi8vJHtBTEdPTElBX0FQUF9JRH0tZHNuLmFsZ29saWEubmV0LzEvaW5kZXhlcy8ke0FMR09MSUFfSU5ERVh9L3F1ZXJ5YCxcbiAgICB7IHBhcmFtcyB9LFxuICAgIHtcbiAgICAgIFwieC1hbGdvbGlhLWFwcGxpY2F0aW9uLWlkXCI6IEFMR09MSUFfQVBQX0lELFxuICAgICAgXCJ4LWFsZ29saWEtYXBpLWtleVwiOiBBTEdPTElBX0FQSV9LRVksXG4gICAgfVxuICApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmaW5kV29ya2luZ0ZpbHRlcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICBmb3IgKGNvbnN0IGZpbHRlciBvZiBGSUxURVJfU1RSQVRFR0lFUykge1xuICAgIGNvbnN0IGV4dHJhID0gZmlsdGVyID8gYCYke2ZpbHRlcn1gIDogXCJcIjtcbiAgICBjb25zdCBwYXJhbXMgPSBgcXVlcnk9JmhpdHNQZXJQYWdlPTUmcGFnZT0wJHtleHRyYX1gO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgYWxnb2xpYVF1ZXJ5KHBhcmFtcyk7XG4gICAgICBjb25zdCBuYkhpdHMgPSBkYXRhPy5uYkhpdHMgPz8gMDtcbiAgICAgIGlmIChuYkhpdHMgPiAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbbmludGVuZG8vdXNdIEZpbHRlciBPSyAobmJIaXRzPSR7bmJIaXRzfSk6ICR7ZmlsdGVyIHx8IFwiKHNpbiBmaWx0cm8pXCJ9YCk7XG4gICAgICAgIHJldHVybiBmaWx0ZXI7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgW25pbnRlbmRvL3VzXSBGaWx0ZXIgbWlzcyAobmJIaXRzPTApOiAke2ZpbHRlciB8fCBcIihzaW4gZmlsdHJvKVwifWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbbmludGVuZG8vdXNdIEZpbHRlciBlcnJvcjogJHtmaWx0ZXIgfHwgXCIoc2luIGZpbHRybylcIn0gXHUyMTkyICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG4gIGNvbnNvbGUud2FybihcIltuaW50ZW5kby91c10gTmluZ1x1MDBGQW4gZmlsdHJvIGRlIEFsZ29saWEgZnVuY2lvblx1MDBGM1wiKTtcbiAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIHBhcnNlTmludGVuZG9IaXQoaGl0OiBBbGdvbGlhSGl0KTogUmF3RGVhbCB8IG51bGwge1xuICBjb25zdCBpZCA9IGhpdC5uc3VpZCB8fCBoaXQub2JqZWN0SUQ7XG4gIGNvbnN0IG5hbWUgPSBoaXQudGl0bGU7XG4gIGlmICghbmFtZSB8fCAhaWQpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHByaWNlID0gaGl0LnByaWNlO1xuICBpZiAoIXByaWNlIHx8ICFwcmljZS5zYWxlUHJpY2UpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHJlZ1ByaWNlID0gcHJpY2UucmVnUHJpY2U7XG4gIGNvbnN0IHNhbGVQcmljZSA9IHByaWNlLnNhbGVQcmljZTtcblxuICBjb25zdCBvcmlnaW5hbENlbnRzID0gcmVnUHJpY2UgIT0gbnVsbCA/IE1hdGgucm91bmQocmVnUHJpY2UgKiAxMDApIDogbnVsbDtcbiAgY29uc3QgZGlzY291bnRlZENlbnRzID1cbiAgICBzYWxlUHJpY2UgIT0gbnVsbCA/IE1hdGgucm91bmQoc2FsZVByaWNlICogMTAwKSA6IG9yaWdpbmFsQ2VudHM7XG5cbiAgbGV0IGRpc2NvdW50UGVyY2VudCA9IHByaWNlLnBlcmNlbnRPZmYgPz8gMDtcbiAgaWYgKFxuICAgICFkaXNjb3VudFBlcmNlbnQgJiZcbiAgICBvcmlnaW5hbENlbnRzICYmXG4gICAgZGlzY291bnRlZENlbnRzICE9IG51bGwgJiZcbiAgICBkaXNjb3VudGVkQ2VudHMgPCBvcmlnaW5hbENlbnRzXG4gICkge1xuICAgIGRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAoKG9yaWdpbmFsQ2VudHMgLSBkaXNjb3VudGVkQ2VudHMpICogMTAwKSAvIG9yaWdpbmFsQ2VudHNcbiAgICApO1xuICB9XG5cbiAgY29uc3QgaW1hZ2VVcmwgPSBoaXQucHJvZHVjdEltYWdlU3F1YXJlIHx8IGhpdC5wcm9kdWN0SW1hZ2UgfHwgbnVsbDtcbiAgY29uc3Qgc3RvcmVVcmwgPSBoaXQudXJsXG4gICAgPyBgaHR0cHM6Ly93d3cubmludGVuZG8uY29tJHtoaXQudXJsfWBcbiAgICA6IGBodHRwczovL3d3dy5uaW50ZW5kby5jb20vdXMvc3RvcmUvcHJvZHVjdHMvJHtpZH0vYDtcblxuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIG5hbWUsXG4gICAgaW1hZ2VVcmwsXG4gICAgc3RvcmVVcmwsXG4gICAgaGFyZHdhcmVQbGF0Zm9ybXM6IGhpdC5wbGF0Zm9ybSB8fCBcIk5pbnRlbmRvIFN3aXRjaFwiLFxuICAgIGN1cnJlbmN5OiBcIlVTRFwiLFxuICAgIHByaWNlT3JpZ2luYWxDZW50czogb3JpZ2luYWxDZW50cyxcbiAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGlzY291bnRlZENlbnRzLFxuICAgIGRpc2NvdW50UGVyY2VudCxcbiAgICBkaXNjb3VudEVuZEF0OiBoaXQuZXNob3BEZXRhaWxzPy5kaXNjb3VudFByaWNlRW5kIHx8IG51bGwsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uKiBmZXRjaE5pbnRlbmRvVVMoKTogQXN5bmNHZW5lcmF0b3I8UmF3RGVhbD4ge1xuICBjb25zdCBmaWx0ZXIgPSBhd2FpdCBmaW5kV29ya2luZ0ZpbHRlcigpO1xuICBjb25zdCBwYWdlU2l6ZSA9IDUwMDtcbiAgY29uc3QgbWF4UGFnZXMgPSA1MDtcbiAgbGV0IGVtaXR0ZWQgPSAwO1xuICBsZXQgcGFnZXNXaXRob3V0TmV3ID0gMDtcblxuICBmb3IgKGxldCBwYWdlID0gMDsgcGFnZSA8IG1heFBhZ2VzOyBwYWdlKyspIHtcbiAgICBjb25zdCBleHRyYSA9IGZpbHRlciA/IGAmJHtmaWx0ZXJ9YCA6IFwiXCI7XG4gICAgY29uc3QgcGFyYW1zID0gYHF1ZXJ5PSZoaXRzUGVyUGFnZT0ke3BhZ2VTaXplfSZwYWdlPSR7cGFnZX0ke2V4dHJhfWA7XG5cbiAgICBsZXQgZGF0YTogYW55O1xuICAgIHRyeSB7XG4gICAgICBkYXRhID0gYXdhaXQgYWxnb2xpYVF1ZXJ5KHBhcmFtcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKHBhZ2UgPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXCJuaW50ZW5kb1wiLCBcInVzXCIsIGBBbGdvbGlhIHJlcXVlc3QgZmFpbGVkOiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgaGl0czogQWxnb2xpYUhpdFtdID0gZGF0YT8uaGl0cyA/PyBbXTtcbiAgICBpZiAoaGl0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmIChwYWdlID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IGRhdGE/Lm1lc3NhZ2UgfHwgYDAgaGl0cyAobmJIaXRzPSR7ZGF0YT8ubmJIaXRzfSlgO1xuICAgICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcIm5pbnRlbmRvXCIsIFwidXNcIiwgYEFsZ29saWEgcmV0dXJuZWQgbm8gcmVzdWx0czogJHttc2d9YCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsZXQgcGFnZURlYWxzID0gMDtcbiAgICBmb3IgKGNvbnN0IGhpdCBvZiBoaXRzKSB7XG4gICAgICBjb25zdCBkZWFsID0gcGFyc2VOaW50ZW5kb0hpdChoaXQpO1xuICAgICAgaWYgKGRlYWwpIHtcbiAgICAgICAgcGFnZURlYWxzKys7XG4gICAgICAgIGVtaXR0ZWQrKztcbiAgICAgICAgeWllbGQgZGVhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBmZXRjaGluZyB1bmZpbHRlcmVkIGFuZCAzIGNvbnNlY3V0aXZlIHBhZ2VzIGhhdmUgbm8gZGVhbHMsIHN0b3AgZWFybHlcbiAgICBpZiAoIWZpbHRlciAmJiBwYWdlRGVhbHMgPT09IDApIHtcbiAgICAgIHBhZ2VzV2l0aG91dE5ldysrO1xuICAgICAgaWYgKHBhZ2VzV2l0aG91dE5ldyA+PSAzKSBicmVhaztcbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZXNXaXRob3V0TmV3ID0gMDtcbiAgICB9XG5cbiAgICBjb25zdCB0b3RhbFBhZ2VzID0gZGF0YT8ubmJQYWdlcyA/PyAwO1xuICAgIGlmIChwYWdlICsgMSA+PSB0b3RhbFBhZ2VzKSBicmVhaztcbiAgfVxuXG4gIGlmIChlbWl0dGVkID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IFByb3ZpZGVyRXJyb3IoXCJuaW50ZW5kb1wiLCBcInVzXCIsIFwiTm8gc2UgZW5jb250cmFyb24ganVlZ29zIGVuIG9mZXJ0YSBlbiBOaW50ZW5kbyBVU1wiKTtcbiAgfVxufVxuXG4vLyAtLS0gSmFwYW4gZVNob3AgdmlhIHN0b3JlLWpwLm5pbnRlbmRvLmNvbSAoU0ZDQykgLS0tXG4vLyBQcmltYXJ5OiBIVE1MIHNjcmFwaW5nIG9mIHRoZSBvZmZpY2lhbCBzdG9yZSBsaXN0aW5nLlxuLy8gRmFsbGJhY2s6IHNlYXJjaC5uaW50ZW5kby5qcCBKU09OIEFQSS5cblxuZnVuY3Rpb24ganBZZW5Ub0NlbnRzKHM6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKCFzKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2xlYW5lZCA9IHMucmVwbGFjZSgvW14wLTldL2csIFwiXCIpO1xuICBjb25zdCBuID0gcGFyc2VJbnQoY2xlYW5lZCwgMTApO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShuKSB8fCBuID09PSAwKSByZXR1cm4gbnVsbDtcbiAgLy8gSlBZIGhhcyBubyBkZWNpbWFsczsgc3RvcmUgYXMgeWVuIFx1MDBENyAxMDAgZm9yIGNvbnNpc3RlbmN5IHdpdGggb3RoZXIgY3VycmVuY2llc1xuICByZXR1cm4gbiAqIDEwMDtcbn1cblxuLyoqIFBhcnNlIHByb2R1Y3RzIGZyb20gdGhlIHN0b3JlLWpwLm5pbnRlbmRvLmNvbSBIVE1MIGxpc3RpbmcuXG4gKiAgVGhlIHBhZ2UgZW1iZWRzIHByb2R1Y3QgdGlsZXMgd2l0aCBzdHJ1Y3R1cmVkIGRhdGEgd2UgY2FuIHJlZ2V4LWV4dHJhY3QuICovXG5mdW5jdGlvbiBwYXJzZUpwU3RvcmVIdG1sKGh0bWw6IHN0cmluZyk6IFJhd0RlYWxbXSB7XG4gIGNvbnN0IGRlYWxzOiBSYXdEZWFsW10gPSBbXTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIC8vIFN0cmF0ZWd5IDE6IExvb2sgZm9yIEpTT04tTEQgcHJvZHVjdCBkYXRhXG4gIGNvbnN0IGpzb25MZFJlZ2V4ID0gLzxzY3JpcHRbXj5dKnR5cGU9W1wiJ11hcHBsaWNhdGlvblxcL2xkXFwranNvbltcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vZ2k7XG4gIGxldCBqc29uTGRNYXRjaDtcbiAgd2hpbGUgKChqc29uTGRNYXRjaCA9IGpzb25MZFJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGxkID0gSlNPTi5wYXJzZShqc29uTGRNYXRjaFsxXSk7XG4gICAgICBjb25zdCBpdGVtcyA9IEFycmF5LmlzQXJyYXkobGQpID8gbGQgOiBsZFtcIkBncmFwaFwiXSA/IGxkW1wiQGdyYXBoXCJdIDogW2xkXTtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICBpZiAoaXRlbVtcIkB0eXBlXCJdICE9PSBcIlByb2R1Y3RcIiAmJiBpdGVtW1wiQHR5cGVcIl0gIT09IFwiVmlkZW9HYW1lXCIpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBpZCA9IGl0ZW0uc2t1IHx8IGl0ZW0ucHJvZHVjdElEIHx8IGl0ZW0uaWRlbnRpZmllcjtcbiAgICAgICAgaWYgKCFpZCB8fCBzZWVuLmhhcyhpZCkpIGNvbnRpbnVlO1xuICAgICAgICBzZWVuLmFkZChpZCk7XG4gICAgICAgIGNvbnN0IG9mZmVyID0gQXJyYXkuaXNBcnJheShpdGVtLm9mZmVycykgPyBpdGVtLm9mZmVyc1swXSA6IGl0ZW0ub2ZmZXJzO1xuICAgICAgICBkZWFscy5wdXNoKHtcbiAgICAgICAgICBpZDogU3RyaW5nKGlkKSxcbiAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUgfHwgXCJcIixcbiAgICAgICAgICBpbWFnZVVybDogaXRlbS5pbWFnZSB8fCBudWxsLFxuICAgICAgICAgIHN0b3JlVXJsOiBpdGVtLnVybCB8fCBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vaXRlbS9zb2Z0d2FyZS8ke2lkfWAsXG4gICAgICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiTmludGVuZG8gU3dpdGNoXCIsXG4gICAgICAgICAgY3VycmVuY3k6IFwiSlBZXCIsXG4gICAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBudWxsLFxuICAgICAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBqcFllblRvQ2VudHMob2ZmZXI/LnByaWNlIHx8IG9mZmVyPy5sb3dQcmljZSksXG4gICAgICAgICAgZGlzY291bnRQZXJjZW50OiAwLFxuICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgbWFsZm9ybWVkIEpTT04tTEQgKi8gfVxuICB9XG5cbiAgaWYgKGRlYWxzLmxlbmd0aCA+IDApIHJldHVybiBkZWFscztcblxuICAvLyBTdHJhdGVneSAyOiBFeHRyYWN0IGZyb20gZW1iZWRkZWQgX19ORVhUX0RBVEFfXyBvciBzaW1pbGFyIEpTT04gYmxvYnNcbiAgY29uc3QgbmV4dERhdGFNYXRjaCA9IC88c2NyaXB0W14+XSppZD1bXCInXV9fTkVYVF9EQVRBX19bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+Ly5leGVjKGh0bWwpO1xuICBpZiAobmV4dERhdGFNYXRjaCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShuZXh0RGF0YU1hdGNoWzFdKTtcbiAgICAgIGNvbnN0IHByb2R1Y3RzID0gZmluZFByb2R1Y3RzSW5UcmVlKGRhdGEpO1xuICAgICAgZm9yIChjb25zdCBwIG9mIHByb2R1Y3RzKSB7XG4gICAgICAgIGlmIChzZWVuLmhhcyhwLmlkKSkgY29udGludWU7XG4gICAgICAgIHNlZW4uYWRkKHAuaWQpO1xuICAgICAgICBkZWFscy5wdXNoKHApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxuICB9XG5cbiAgaWYgKGRlYWxzLmxlbmd0aCA+IDApIHJldHVybiBkZWFscztcblxuICAvLyBTdHJhdGVneSAzOiBSZWdleCBzY3JhcGUgcHJvZHVjdCB0aWxlcyBmcm9tIEhUTUxcbiAgLy8gTmludGVuZG8gSlAgc3RvcmUgdGlsZXMgdHlwaWNhbGx5IGhhdmUgZGF0YSBhdHRyaWJ1dGVzIG9yIHN0cnVjdHVyZWQgY2xhc3MgcGF0dGVybnNcbiAgY29uc3QgdGlsZVJlZ2V4ID1cbiAgICAvZGF0YS1waWQ9W1wiJ10oW15cIiddKylbXCInXVtcXHNcXFNdKj88W14+XSpjbGFzcz1bXCInXVteXCInXSpwcm9kdWN0LW5hbWVbXlwiJ10qW1wiJ11bXj5dKj4oW148XSspPFtcXHNcXFNdKj8oPzpkYXRhLXByaWNlfGNsYXNzPVtcIiddW15cIiddKnByaWNlW15cIiddKltcIiddKVtePl0qPihbXjxdKik8L2dpO1xuICBsZXQgdGlsZU1hdGNoO1xuICB3aGlsZSAoKHRpbGVNYXRjaCA9IHRpbGVSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGlkID0gdGlsZU1hdGNoWzFdLnRyaW0oKTtcbiAgICBpZiAoIWlkIHx8IHNlZW4uaGFzKGlkKSkgY29udGludWU7XG4gICAgc2Vlbi5hZGQoaWQpO1xuICAgIGRlYWxzLnB1c2goe1xuICAgICAgaWQsXG4gICAgICBuYW1lOiB0aWxlTWF0Y2hbMl0udHJpbSgpLFxuICAgICAgaW1hZ2VVcmw6IG51bGwsXG4gICAgICBzdG9yZVVybDogYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2l0ZW0vc29mdHdhcmUvJHtpZH1gLFxuICAgICAgaGFyZHdhcmVQbGF0Zm9ybXM6IFwiTmludGVuZG8gU3dpdGNoXCIsXG4gICAgICBjdXJyZW5jeTogXCJKUFlcIixcbiAgICAgIHByaWNlT3JpZ2luYWxDZW50czogbnVsbCxcbiAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBqcFllblRvQ2VudHModGlsZU1hdGNoWzNdKSxcbiAgICAgIGRpc2NvdW50UGVyY2VudDogMCxcbiAgICAgIGRpc2NvdW50RW5kQXQ6IG51bGwsXG4gICAgfSk7XG4gIH1cblxuICAvLyBTdHJhdGVneSA0OiBMb29rIGZvciBhbnkgZW1iZWRkZWQgcHJvZHVjdCBKU09OIGFycmF5c1xuICBjb25zdCBqc29uQXJyYXlSZWdleCA9IC9cXFsoXFx7XCJbXlwiXSppZFteXCJdKlwiWzpcXHNdKlwiW15cIl0qXCJbXFxzXFxTXSo/XFx9KD86LFxccypcXHtbXFxzXFxTXSo/XFx9KSopXFxdL2c7XG4gIGxldCBhcnJNYXRjaDtcbiAgd2hpbGUgKChhcnJNYXRjaCA9IGpzb25BcnJheVJlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFyciA9IEpTT04ucGFyc2UoXCJbXCIgKyBhcnJNYXRjaFsxXSArIFwiXVwiKTtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhcnIpIHtcbiAgICAgICAgY29uc3QgaWQgPSBpdGVtLmlkIHx8IGl0ZW0ubnN1aWQgfHwgaXRlbS5wcm9kdWN0SWQgfHwgaXRlbS5waWQ7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLnRpdGxlIHx8IGl0ZW0ubmFtZSB8fCBpdGVtLnByb2R1Y3ROYW1lO1xuICAgICAgICBpZiAoIWlkIHx8ICFuYW1lIHx8IHNlZW4uaGFzKFN0cmluZyhpZCkpKSBjb250aW51ZTtcbiAgICAgICAgc2Vlbi5hZGQoU3RyaW5nKGlkKSk7XG4gICAgICAgIGNvbnN0IHByaWNlID0gaXRlbS5zYWxlUHJpY2UgfHwgaXRlbS5wcmljZSB8fCBpdGVtLmRpc2NvdW50UHJpY2U7XG4gICAgICAgIGNvbnN0IG9yaWdQcmljZSA9IGl0ZW0ub3JpZ2luYWxQcmljZSB8fCBpdGVtLnJlZ3VsYXJQcmljZSB8fCBpdGVtLmxpc3RQcmljZTtcbiAgICAgICAgZGVhbHMucHVzaCh7XG4gICAgICAgICAgaWQ6IFN0cmluZyhpZCksXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBpbWFnZVVybDogaXRlbS5pbWFnZSB8fCBpdGVtLmltYWdlVXJsIHx8IGl0ZW0udGh1bWJuYWlsIHx8IG51bGwsXG4gICAgICAgICAgc3RvcmVVcmw6IGl0ZW0udXJsIHx8IGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9pdGVtL3NvZnR3YXJlLyR7aWR9YCxcbiAgICAgICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgICAgICBjdXJyZW5jeTogXCJKUFlcIixcbiAgICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGpwWWVuVG9DZW50cyhTdHJpbmcob3JpZ1ByaWNlID8/IFwiXCIpKSxcbiAgICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czoganBZZW5Ub0NlbnRzKFN0cmluZyhwcmljZSA/PyBcIlwiKSksXG4gICAgICAgICAgZGlzY291bnRQZXJjZW50OiBwYXJzZUludChpdGVtLmRpc2NvdW50UmF0ZSB8fCBpdGVtLmRpc2NvdW50UGVyY2VudCB8fCBcIjBcIikgfHwgMCxcbiAgICAgICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHsgLyogbm90IHZhbGlkIEpTT04gYXJyYXkgKi8gfVxuICB9XG5cbiAgcmV0dXJuIGRlYWxzO1xufVxuXG5mdW5jdGlvbiBmaW5kUHJvZHVjdHNJblRyZWUobm9kZTogdW5rbm93biwgcmVzdWx0czogUmF3RGVhbFtdID0gW10pOiBSYXdEZWFsW10ge1xuICBpZiAoIW5vZGUgfHwgdHlwZW9mIG5vZGUgIT09IFwib2JqZWN0XCIpIHJldHVybiByZXN1bHRzO1xuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkge1xuICAgIGZvciAoY29uc3QgdiBvZiBub2RlKSBmaW5kUHJvZHVjdHNJblRyZWUodiwgcmVzdWx0cyk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbiAgY29uc3Qgb2JqID0gbm9kZSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICBjb25zdCBpZCA9IG9iai5uc3VpZCB8fCBvYmouaWQgfHwgb2JqLnByb2R1Y3RJZDtcbiAgY29uc3QgbmFtZSA9IG9iai50aXRsZSB8fCBvYmoubmFtZTtcbiAgY29uc3QgaGFzUHJpY2UgPSBvYmoucHJpY2UgIT0gbnVsbCB8fCBvYmouc2FsZVByaWNlICE9IG51bGwgfHwgb2JqLnJlZ3VsYXJQcmljZSAhPSBudWxsO1xuICBpZiAoaWQgJiYgbmFtZSAmJiBoYXNQcmljZSkge1xuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBpZDogU3RyaW5nKGlkKSxcbiAgICAgIG5hbWU6IFN0cmluZyhuYW1lKSxcbiAgICAgIGltYWdlVXJsOiBvYmouaW1hZ2UgfHwgb2JqLmltYWdlVXJsIHx8IG51bGwsXG4gICAgICBzdG9yZVVybDogb2JqLnVybCB8fCBgaHR0cHM6Ly9zdG9yZS1qcC5uaW50ZW5kby5jb20vaXRlbS9zb2Z0d2FyZS8ke2lkfWAsXG4gICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgIGN1cnJlbmN5OiBcIkpQWVwiLFxuICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBqcFllblRvQ2VudHMoU3RyaW5nKG9iai5yZWd1bGFyUHJpY2UgPz8gb2JqLm9yaWdpbmFsUHJpY2UgPz8gb2JqLnByaWNlID8/IFwiXCIpKSxcbiAgICAgIHByaWNlRGlzY291bnRlZENlbnRzOiBqcFllblRvQ2VudHMoU3RyaW5nKG9iai5zYWxlUHJpY2UgPz8gb2JqLmRpc2NvdW50UHJpY2UgPz8gb2JqLnByaWNlID8/IFwiXCIpKSxcbiAgICAgIGRpc2NvdW50UGVyY2VudDogcGFyc2VJbnQob2JqLmRpc2NvdW50UmF0ZSB8fCBvYmouZGlzY291bnRQZXJjZW50IHx8IFwiMFwiKSB8fCAwLFxuICAgICAgZGlzY291bnRFbmRBdDogbnVsbCxcbiAgICB9KTtcbiAgfVxuICBmb3IgKGNvbnN0IHYgb2YgT2JqZWN0LnZhbHVlcyhvYmopKSBmaW5kUHJvZHVjdHNJblRyZWUodiwgcmVzdWx0cyk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5hc3luYyBmdW5jdGlvbiogZmV0Y2hOaW50ZW5kb0pQX1N0b3JlKCk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgY29uc3QgbWF4UGFnZXMgPSA1MDtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAobGV0IHBhZ2UgPSAxOyBwYWdlIDw9IG1heFBhZ2VzOyBwYWdlKyspIHtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vc3RvcmUtanAubmludGVuZG8uY29tL2xpc3Qvc29mdHdhcmVgICtcbiAgICAgIGA/c29mdFR5cGU9VElUTEUmaXNTYWxlPXRydWUmc3J1bGU9bW9zdC1wb3B1bGFyJnBhZ2U9JHtwYWdlfWA7XG5cbiAgICBsZXQgaHRtbDogc3RyaW5nO1xuICAgIHRyeSB7XG4gICAgICBodG1sID0gYXdhaXQgZmV0Y2hIdG1sKHVybCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBkZWFscyA9IHBhcnNlSnBTdG9yZUh0bWwoaHRtbCk7XG4gICAgbGV0IG5ld09uUGFnZSA9IDA7XG4gICAgZm9yIChjb25zdCBkZWFsIG9mIGRlYWxzKSB7XG4gICAgICBpZiAoc2Vlbi5oYXMoZGVhbC5pZCkpIGNvbnRpbnVlO1xuICAgICAgc2Vlbi5hZGQoZGVhbC5pZCk7XG4gICAgICBuZXdPblBhZ2UrKztcblxuICAgICAgaWYgKFxuICAgICAgICBkZWFsLnByaWNlT3JpZ2luYWxDZW50cyAmJlxuICAgICAgICBkZWFsLnByaWNlRGlzY291bnRlZENlbnRzICYmXG4gICAgICAgIGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMgPCBkZWFsLnByaWNlT3JpZ2luYWxDZW50cyAmJlxuICAgICAgICAhZGVhbC5kaXNjb3VudFBlcmNlbnRcbiAgICAgICkge1xuICAgICAgICBkZWFsLmRpc2NvdW50UGVyY2VudCA9IE1hdGgucm91bmQoXG4gICAgICAgICAgKChkZWFsLnByaWNlT3JpZ2luYWxDZW50cyAtIGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMpICogMTAwKSAvXG4gICAgICAgICAgICBkZWFsLnByaWNlT3JpZ2luYWxDZW50c1xuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICB5aWVsZCBkZWFsO1xuICAgIH1cblxuICAgIGlmIChuZXdPblBhZ2UgPT09IDApIGJyZWFrO1xuICB9XG59XG5cbi8qKiBGYWxsYmFjazogc2VhcmNoLm5pbnRlbmRvLmpwIEpTT04gQVBJICovXG5hc3luYyBmdW5jdGlvbiogZmV0Y2hOaW50ZW5kb0pQX1NlYXJjaEFwaSgpOiBBc3luY0dlbmVyYXRvcjxSYXdEZWFsPiB7XG4gIGNvbnN0IHBhZ2VTaXplID0gMzAwO1xuICBsZXQgc3RhcnQgPSAwO1xuICBjb25zdCBtYXhJdGVtcyA9IDYwMDA7XG5cbiAgd2hpbGUgKHN0YXJ0IDwgbWF4SXRlbXMpIHtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vc2VhcmNoLm5pbnRlbmRvLmpwL25pbnRlbmRvX3NvZnQvc2VhcmNoLmpzb25gICtcbiAgICAgIGA/b3B0X3NzaG93PTEmZnE9c3NpdHVfczpvbnNhbGUraGFyZF9zOjFfSEFDYCArXG4gICAgICBgJnJvd3M9JHtwYWdlU2l6ZX0mc3RhcnQ9JHtzdGFydH0mc29ydD1zY29yZStkZXNjYDtcblxuICAgIGxldCBkYXRhOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIGRhdGEgPSBhd2FpdCBmZXRjaEpzb24odXJsKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGRvY3MgPSBkYXRhPy5yZXN1bHQ/Lml0ZW1zID8/IFtdO1xuICAgIGlmIChkb2NzLmxlbmd0aCA9PT0gMCkgYnJlYWs7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZG9jcykge1xuICAgICAgY29uc3QgaWQgPSBpdGVtLm5zdWlkIHx8IGl0ZW0uaWQ7XG4gICAgICBjb25zdCBuYW1lID0gaXRlbS50aXRsZTtcbiAgICAgIGlmICghbmFtZSB8fCAhaWQpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBvcmlnaW5hbENlbnRzID0ganBZZW5Ub0NlbnRzKGl0ZW0ucHByaSk7XG4gICAgICBjb25zdCBkaXNjb3VudGVkQ2VudHMgPSBqcFllblRvQ2VudHMoaXRlbS5zcHJpKSA/PyBvcmlnaW5hbENlbnRzO1xuXG4gICAgICBsZXQgZGlzY291bnRQZXJjZW50ID0gcGFyc2VJbnQoaXRlbS5kc3BlcikgfHwgMDtcbiAgICAgIGlmIChcbiAgICAgICAgIWRpc2NvdW50UGVyY2VudCAmJlxuICAgICAgICBvcmlnaW5hbENlbnRzICYmXG4gICAgICAgIGRpc2NvdW50ZWRDZW50cyAhPSBudWxsICYmXG4gICAgICAgIGRpc2NvdW50ZWRDZW50cyA8IG9yaWdpbmFsQ2VudHNcbiAgICAgICkge1xuICAgICAgICBkaXNjb3VudFBlcmNlbnQgPSBNYXRoLnJvdW5kKFxuICAgICAgICAgICgob3JpZ2luYWxDZW50cyAtIGRpc2NvdW50ZWRDZW50cykgKiAxMDApIC8gb3JpZ2luYWxDZW50c1xuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9yaWdpbmFsQ2VudHMgJiYgIWRpc2NvdW50ZWRDZW50cykgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGltYWdlVXJsID0gaXRlbS5pdXJsIHx8IG51bGw7XG4gICAgICBjb25zdCBzdG9yZVVybCA9XG4gICAgICAgIGl0ZW0uc3NsdXJsIHx8XG4gICAgICAgIGBodHRwczovL3N0b3JlLWpwLm5pbnRlbmRvLmNvbS9pdGVtL3NvZnR3YXJlLyR7aWR9YDtcblxuICAgICAgeWllbGQge1xuICAgICAgICBpZDogU3RyaW5nKGlkKSxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgaW1hZ2VVcmwsXG4gICAgICAgIHN0b3JlVXJsLFxuICAgICAgICBoYXJkd2FyZVBsYXRmb3JtczogXCJOaW50ZW5kbyBTd2l0Y2hcIixcbiAgICAgICAgY3VycmVuY3k6IFwiSlBZXCIsXG4gICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogb3JpZ2luYWxDZW50cyxcbiAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRpc2NvdW50ZWRDZW50cyxcbiAgICAgICAgZGlzY291bnRQZXJjZW50LFxuICAgICAgICBkaXNjb3VudEVuZEF0OiBudWxsLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGFydCArPSBwYWdlU2l6ZTtcbiAgICBjb25zdCB0b3RhbENvdW50ID0gZGF0YT8ucmVzdWx0Py50b3RhbCA/PyAwO1xuICAgIGlmIChzdGFydCA+PSB0b3RhbENvdW50KSBicmVhaztcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiogZmV0Y2hOaW50ZW5kb0pQKCk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgLy8gVHJ5IHRoZSBvZmZpY2lhbCBzdG9yZSBmaXJzdCwgZmFsbCBiYWNrIHRvIHNlYXJjaCBBUElcbiAgbGV0IGNvdW50ID0gMDtcbiAgdHJ5IHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGRlYWwgb2YgZmV0Y2hOaW50ZW5kb0pQX1N0b3JlKCkpIHtcbiAgICAgIGNvdW50Kys7XG4gICAgICB5aWVsZCBkZWFsO1xuICAgIH1cbiAgfSBjYXRjaCB7IC8qIHN0b3JlIHNjcmFwZSBmYWlsZWQgKi8gfVxuXG4gIGlmIChjb3VudCA9PT0gMCkge1xuICAgIC8vIEZhbGxiYWNrIHRvIHNlYXJjaCBBUElcbiAgICB5aWVsZCogZmV0Y2hOaW50ZW5kb0pQX1NlYXJjaEFwaSgpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBuaW50ZW5kb1Byb3ZpZGVyOiBQcm92aWRlciA9IHtcbiAgcGxhdGZvcm06IFwibmludGVuZG9cIixcbiAgYXN5bmMgKmZldGNoRGVhbHMoc291cmNlOiBQcm92aWRlclNvdXJjZSk6IEFzeW5jR2VuZXJhdG9yPFJhd0RlYWw+IHtcbiAgICBjb25zdCBjdXJyZW5jeSA9IENVUlJFTkNZX01BUFtzb3VyY2UucmVnaW9uXTtcbiAgICBpZiAoIWN1cnJlbmN5KSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcbiAgICAgICAgXCJuaW50ZW5kb1wiLFxuICAgICAgICBzb3VyY2UucmVnaW9uLFxuICAgICAgICBgUmVnaVx1MDBGM24gbm8gc29wb3J0YWRhOiAke3NvdXJjZS5yZWdpb259YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoc291cmNlLnJlZ2lvbiA9PT0gXCJ1c1wiKSB7XG4gICAgICB5aWVsZCogZmV0Y2hOaW50ZW5kb1VTKCk7XG4gICAgfSBlbHNlIGlmIChzb3VyY2UucmVnaW9uID09PSBcImpwXCIpIHtcbiAgICAgIHlpZWxkKiBmZXRjaE5pbnRlbmRvSlAoKTtcbiAgICB9XG4gIH0sXG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL3Byb3ZpZGVycy9pbmRleC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcm92aWRlcnMvaW5kZXgudHNcIjtleHBvcnQgdHlwZSB7IFBsYXRmb3JtLCBQcm92aWRlclNvdXJjZSwgUmF3RGVhbCwgUmVnaW9uQ29uZmlnIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmV4cG9ydCB7IFBMQVRGT1JNX0xBQkVMUywgUExBVEZPUk1fUkVHSU9OUywgUHJvdmlkZXJFcnJvciB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmltcG9ydCB0eXBlIHsgUGxhdGZvcm0sIFByb3ZpZGVyIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IHBzblByb3ZpZGVyIH0gZnJvbSBcIi4vcHNuXCI7XG5pbXBvcnQgeyB4Ym94UHJvdmlkZXIgfSBmcm9tIFwiLi94Ym94XCI7XG5pbXBvcnQgeyBzdGVhbVByb3ZpZGVyIH0gZnJvbSBcIi4vc3RlYW1cIjtcbmltcG9ydCB7IG5pbnRlbmRvUHJvdmlkZXIgfSBmcm9tIFwiLi9uaW50ZW5kb1wiO1xuXG5jb25zdCBQUk9WSURFUlM6IFJlY29yZDxQbGF0Zm9ybSwgUHJvdmlkZXI+ID0ge1xuICBwc246IHBzblByb3ZpZGVyLFxuICB4Ym94OiB4Ym94UHJvdmlkZXIsXG4gIHN0ZWFtOiBzdGVhbVByb3ZpZGVyLFxuICBuaW50ZW5kbzogbmludGVuZG9Qcm92aWRlcixcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm92aWRlcihwbGF0Zm9ybTogUGxhdGZvcm0pOiBQcm92aWRlciB7XG4gIHJldHVybiBQUk9WSURFUlNbcGxhdGZvcm1dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsUHJvdmlkZXJzKCk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhQUk9WSURFUlMpO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvZXhjaGFuZ2UudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvZXhjaGFuZ2UudHNcIjsvKipcbiAqIEV4Y2hhbmdlIHJhdGUgZmV0Y2hlciB2aWEgbWluZGljYWRvci5jbCAoQ2hpbGVhbiBwdWJsaWMgQVBJLCBubyBhdXRoIG5lZWRlZCkuXG4gKiBGZXRjaGVzIHRoZSBsYXRlc3Qgb2JzZXJ2ZWQgdmFsdWVzIGZvciBVU0QsIEJSTCwgYW5kIFRSWSBcdTIxOTIgQ0xQLlxuICovXG5cbmludGVyZmFjZSBNaW5kaWNhZG9yU2VyaWUge1xuICBjb2RpZ286IHN0cmluZztcbiAgbm9tYnJlOiBzdHJpbmc7XG4gIHVuaWRhZF9tZWRpZGE6IHN0cmluZztcbiAgc2VyaWU6IEFycmF5PHsgZmVjaGE6IHN0cmluZzsgdmFsb3I6IG51bWJlciB9Pjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hJbmRpY2Fkb3IoY29kaWdvOiBzdHJpbmcpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vbWluZGljYWRvci5jbC9hcGkvJHtjb2RpZ299YDtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICBoZWFkZXJzOiB7IGFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsIFwidXNlci1hZ2VudFwiOiBcImFwaXBzbi8xLjBcIiB9LFxuICAgIH0pO1xuICAgIGlmICghci5vaykgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgZGF0YSA9IChhd2FpdCByLmpzb24oKSkgYXMgTWluZGljYWRvclNlcmllO1xuICAgIGNvbnN0IHZhbHVlID0gZGF0YT8uc2VyaWU/LlswXT8udmFsb3I7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBOdW1iZXIuaXNGaW5pdGUodmFsdWUpID8gdmFsdWUgOiBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV4Y2hhbmdlUmF0ZXMge1xuICB1c2RUb0NscDogbnVtYmVyIHwgbnVsbDtcbiAgYnJsVG9DbHA6IG51bWJlciB8IG51bGw7XG4gIHRyeVRvQ2xwOiBudW1iZXIgfCBudWxsO1xuICBmZXRjaGVkQXQ6IHN0cmluZztcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoRXhjaGFuZ2VSYXRlcygpOiBQcm9taXNlPEV4Y2hhbmdlUmF0ZXM+IHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gRmV0Y2ggVVNEIFx1MjE5MiBDTFAgZGlyZWN0bHlcbiAgY29uc3QgdXNkID0gYXdhaXQgZmV0Y2hJbmRpY2Fkb3IoXCJkb2xhclwiKTtcbiAgaWYgKHVzZCA9PSBudWxsKSBlcnJvcnMucHVzaChcIlVTRCBubyBkaXNwb25pYmxlIGVuIG1pbmRpY2Fkb3IuY2xcIik7XG5cbiAgLy8gQlJMIFx1MjE5MiBDTFA6IGZldGNoIEJSTC9VU0QgcmF0ZSBmcm9tIGEgZnJlZSBleGNoYW5nZSByYXRlIGVuZHBvaW50XG4gIC8vIG1pbmRpY2Fkb3IuY2wgZG9lc24ndCBoYXZlIEJSTCBkaXJlY3RseSwgc28gYXBwcm94aW1hdGUgdmlhIFVTRFxuICAvLyBCUkwvVVNEIFx1MjI0OCBtaW5kaWNhZG9yIGRvZXNuJ3QgY2FycnkgdGhpcy4gV2UgZmFsbCBiYWNrIHRvIHRoZSB1c2VyLWNvbmZpZ3VyZWQgdmFsdWUuXG4gIC8vIEZvciBUUlksIHNhbWUgc2l0dWF0aW9uLiBPbmx5IFVTRCBpcyByZWxpYWJseSBhdmFpbGFibGUgZnJvbSBtaW5kaWNhZG9yLmNsLlxuXG4gIHJldHVybiB7XG4gICAgdXNkVG9DbHA6IHVzZCxcbiAgICBicmxUb0NscDogbnVsbCxcbiAgICB0cnlUb0NscDogbnVsbCxcbiAgICBmZXRjaGVkQXQ6IG5vdyxcbiAgICBlcnJvcnMsXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlci9zY2hlZHVsZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zZXJ2ZXIvc2NoZWR1bGVyLnRzXCI7LyoqXG4gKiBPcHRpb25hbCBwZXJpb2RpYyByZWZyZXNoIHNjaGVkdWxlci4gRGlzYWJsZWQgYnkgZGVmYXVsdC5cbiAqIEVuYWJsZWQvZGlzYWJsZWQgdmlhIHN0b3JlIHNldHRpbmdzIChhdXRvUmVmcmVzaEludGVydmFsSG91cnMgPSAwIG1lYW5zIG9mZikuXG4gKi9cbmltcG9ydCB7IHN0b3JlIH0gZnJvbSBcIi4vc3RvcmVcIjtcblxudHlwZSBSZWZyZXNoRm4gPSAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuXG5sZXQgdGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5sZXQgbGFzdEF1dG9SZWZyZXNoQXQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEF1dG9SZWZyZXNoQXQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiBsYXN0QXV0b1JlZnJlc2hBdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0U2NoZWR1bGVyKHJlZnJlc2hGbjogUmVmcmVzaEZuKTogdm9pZCB7XG4gIHJlc2NoZWR1bGUocmVmcmVzaEZuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2NoZWR1bGUocmVmcmVzaEZuOiBSZWZyZXNoRm4pOiB2b2lkIHtcbiAgaWYgKHRpbWVyKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgdGltZXIgPSBudWxsO1xuICB9XG5cbiAgY29uc3QgaW50ZXJ2YWxIb3VycyA9IHN0b3JlLmdldEF1dG9SZWZyZXNoSW50ZXJ2YWwoKTtcbiAgaWYgKCFpbnRlcnZhbEhvdXJzIHx8IGludGVydmFsSG91cnMgPD0gMCkgcmV0dXJuO1xuXG4gIGNvbnN0IG1zID0gaW50ZXJ2YWxIb3VycyAqIDYwICogNjAgKiAxMDAwO1xuICB0aW1lciA9IHNldEludGVydmFsKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcmVmcmVzaEZuKCk7XG4gICAgICBsYXN0QXV0b1JlZnJlc2hBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFNjaGVkdWxlciBlcnJvcnMgYXJlIG5vbi1mYXRhbFxuICAgIH1cbiAgfSwgbXMpO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcHMtcGx1cy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9wcy1wbHVzLnRzXCI7LyoqXG4gKiBQUyBQbHVzIG1lbWJlcnNoaXAgcHJpY2UgdHJhY2tlciBcdTIwMTQgbXVsdGktcmVnaW9uLlxuICpcbiAqIFRyYWNrcyBQUyBQbHVzIFNLVXMgYWNyb3NzIFVTLCBCUiwgYW5kIFRSIHJlZ2lvbnMgd2l0aDpcbiAqICAgLSBQcmljZXMgc2NyYXBlZCBmcm9tIHBsYXlzdGF0aW9uLmNvbSAod2l0aCBoYXJkY29kZWQgZmFsbGJhY2tzKVxuICogICAtIEVzdGltYXRlZCBDTFAgY29zdCB1c2luZyBjb25maWd1cmVkIGV4Y2hhbmdlIHJhdGVzICsgcHVyY2hhc2UgZmVlXG4gKiAgIC0gQ29tcGV0aXRvciBwcmljZXMgKGZ1enp5LW1hdGNoZWQgZnJvbSBleGlzdGluZyBjb21wZXRpdG9yIHByb2R1Y3RzKVxuICovXG5pbXBvcnQgeyB0b2tlbml6ZSwgc2ltaWxhcml0eSB9IGZyb20gXCIuL2NvbXBldGl0b3JzXCI7XG5pbXBvcnQgdHlwZSB7IENvbXBldGl0b3JQcm9kdWN0LCBDb21wZXRpdG9yTWF0Y2ggfSBmcm9tIFwiLi9jb21wZXRpdG9yc1wiO1xuaW1wb3J0IHR5cGUgeyBQcmljaW5nU2V0dGluZ3MgfSBmcm9tIFwiLi9zdG9yZVwiO1xuXG5leHBvcnQgdHlwZSBQbHVzVGllciA9IFwiZXNzZW50aWFsXCIgfCBcImV4dHJhXCIgfCBcInByZW1pdW1cIjtcbmV4cG9ydCB0eXBlIFBsdXNEdXJhdGlvbiA9IFwiMW1cIiB8IFwiM21cIiB8IFwiMTJtXCI7XG5leHBvcnQgdHlwZSBQbHVzUmVnaW9uID0gXCJ1c1wiIHwgXCJiclwiIHwgXCJ0clwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBsdXNSZWdpb25QcmljZSB7XG4gIHJlZ2lvbjogUGx1c1JlZ2lvbjtcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgcHJpY2U6IG51bWJlcjtcbiAgcHJpY2VDbHA6IG51bWJlciB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGx1c1BsYW4ge1xuICB0aWVyOiBQbHVzVGllcjtcbiAgZHVyYXRpb246IFBsdXNEdXJhdGlvbjtcbiAgbGFiZWw6IHN0cmluZztcbiAgcmVnaW9uUHJpY2VzOiBQbHVzUmVnaW9uUHJpY2VbXTtcbiAgY2hlYXBlc3RSZWdpb246IFBsdXNSZWdpb24gfCBudWxsO1xuICBjaGVhcGVzdENscDogbnVtYmVyIHwgbnVsbDtcbiAgc2VhcmNoVGVybXM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBsdXNQbGFuV2l0aE1hdGNoZXMgZXh0ZW5kcyBQbHVzUGxhbiB7XG4gIGNvbXBldGl0b3JNYXRjaGVzOiBDb21wZXRpdG9yTWF0Y2hbXTtcbiAgYmVzdFByaWNlOiBudW1iZXIgfCBudWxsO1xuICBiZXN0U3RvcmU6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NyYXBlZFBsdXNQcmljZXMge1xuICAvKiogcmVnaW9uIFx1MjE5MiB0aWVyIFx1MjE5MiBkdXJhdGlvbiBcdTIxOTIgcHJpY2UgaW4gbG9jYWwgY3VycmVuY3kgKi9cbiAgcHJpY2VzOiBSZWNvcmQ8UGx1c1JlZ2lvbiwgUmVjb3JkPFBsdXNUaWVyLCBSZWNvcmQ8UGx1c0R1cmF0aW9uLCBudW1iZXI+Pj47XG4gIHNjcmFwZWRBdDogc3RyaW5nO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG5pbnRlcmZhY2UgUGxhbkRlZiB7XG4gIHRpZXI6IFBsdXNUaWVyO1xuICBkdXJhdGlvbjogUGx1c0R1cmF0aW9uO1xuICBsYWJlbDogc3RyaW5nO1xuICBzZWFyY2hUZXJtczogc3RyaW5nW107XG59XG5cbmNvbnN0IFBMQU5fREVGUzogUGxhbkRlZltdID0gW1xuICB7IHRpZXI6IFwiZXNzZW50aWFsXCIsIGR1cmF0aW9uOiBcIjFtXCIsICBsYWJlbDogXCJQUyBQbHVzIEVzc2VudGlhbCBcdTIwMTQgMSBNZXNcIiwgICAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgZXNzZW50aWFsIDEgbWVzXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgMSBtZXNcIiwgXCJwcyBwbHVzIGVzc2VudGlhbCAxIG1vbnRoXCIsIFwicHNuIHBsdXMgZXNzZW50aWFsIG1lbnN1YWxcIl0gfSxcbiAgeyB0aWVyOiBcImVzc2VudGlhbFwiLCBkdXJhdGlvbjogXCIzbVwiLCAgbGFiZWw6IFwiUFMgUGx1cyBFc3NlbnRpYWwgXHUyMDE0IDMgTWVzZXNcIiwgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIGVzc2VudGlhbCAzIG1lc2VzXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgMyBtZXNlc1wiLCBcInBzIHBsdXMgZXNzZW50aWFsIDMgbW9udGhcIiwgXCJwc24gcGx1cyBlc3NlbnRpYWwgdHJpbWVzdHJhbFwiXSB9LFxuICB7IHRpZXI6IFwiZXNzZW50aWFsXCIsIGR1cmF0aW9uOiBcIjEybVwiLCBsYWJlbDogXCJQUyBQbHVzIEVzc2VudGlhbCBcdTIwMTQgMTIgTWVzZXNcIiwgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgZXNzZW50aWFsIDEyIG1lc2VzXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgMTIgbWVzZXNcIiwgXCJwcyBwbHVzIGVzc2VudGlhbCAxIGFcdTAwRjFvXCIsIFwicHMgcGx1cyBlc3NlbnRpYWwgYW51YWxcIiwgXCJwcyBwbHVzIGVzc2VudGlhbCAxIHllYXJcIl0gfSxcbiAgeyB0aWVyOiBcImV4dHJhXCIsICAgICBkdXJhdGlvbjogXCIxbVwiLCAgbGFiZWw6IFwiUFMgUGx1cyBFeHRyYSBcdTIwMTQgMSBNZXNcIiwgICAgICAgIHNlYXJjaFRlcm1zOiBbXCJwbGF5c3RhdGlvbiBwbHVzIGV4dHJhIDEgbWVzXCIsIFwicHMgcGx1cyBleHRyYSAxIG1lc1wiLCBcInBzIHBsdXMgZXh0cmEgMSBtb250aFwiXSB9LFxuICB7IHRpZXI6IFwiZXh0cmFcIiwgICAgIGR1cmF0aW9uOiBcIjNtXCIsICBsYWJlbDogXCJQUyBQbHVzIEV4dHJhIFx1MjAxNCAzIE1lc2VzXCIsICAgICAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgZXh0cmEgMyBtZXNlc1wiLCBcInBzIHBsdXMgZXh0cmEgMyBtZXNlc1wiLCBcInBzIHBsdXMgZXh0cmEgMyBtb250aFwiXSB9LFxuICB7IHRpZXI6IFwiZXh0cmFcIiwgICAgIGR1cmF0aW9uOiBcIjEybVwiLCBsYWJlbDogXCJQUyBQbHVzIEV4dHJhIFx1MjAxNCAxMiBNZXNlc1wiLCAgICAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgZXh0cmEgMTIgbWVzZXNcIiwgXCJwcyBwbHVzIGV4dHJhIDEyIG1lc2VzXCIsIFwicHMgcGx1cyBleHRyYSAxIGFcdTAwRjFvXCIsIFwicHMgcGx1cyBleHRyYSBhbnVhbFwiXSB9LFxuICB7IHRpZXI6IFwicHJlbWl1bVwiLCAgIGR1cmF0aW9uOiBcIjFtXCIsICBsYWJlbDogXCJQUyBQbHVzIFByZW1pdW0gXHUyMDE0IDEgTWVzXCIsICAgICAgc2VhcmNoVGVybXM6IFtcInBsYXlzdGF0aW9uIHBsdXMgcHJlbWl1bSAxIG1lc1wiLCBcInBzIHBsdXMgcHJlbWl1bSAxIG1lc1wiLCBcInBzIHBsdXMgcHJlbWl1bSAxIG1vbnRoXCJdIH0sXG4gIHsgdGllcjogXCJwcmVtaXVtXCIsICAgZHVyYXRpb246IFwiM21cIiwgIGxhYmVsOiBcIlBTIFBsdXMgUHJlbWl1bSBcdTIwMTQgMyBNZXNlc1wiLCAgICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBwcmVtaXVtIDMgbWVzZXNcIiwgXCJwcyBwbHVzIHByZW1pdW0gMyBtZXNlc1wiLCBcInBzIHBsdXMgcHJlbWl1bSAzIG1vbnRoXCJdIH0sXG4gIHsgdGllcjogXCJwcmVtaXVtXCIsICAgZHVyYXRpb246IFwiMTJtXCIsIGxhYmVsOiBcIlBTIFBsdXMgUHJlbWl1bSBcdTIwMTQgMTIgTWVzZXNcIiwgICBzZWFyY2hUZXJtczogW1wicGxheXN0YXRpb24gcGx1cyBwcmVtaXVtIDEyIG1lc2VzXCIsIFwicHMgcGx1cyBwcmVtaXVtIDEyIG1lc2VzXCIsIFwicHMgcGx1cyBwcmVtaXVtIDEgYVx1MDBGMW9cIiwgXCJwcyBwbHVzIHByZW1pdW0gYW51YWxcIl0gfSxcbl07XG5cbi8vIEZhbGxiYWNrIHByaWNlcyBpZiBzY3JhcGluZyBmYWlscyAobGFzdCBrbm93biBnb29kIHZhbHVlcylcbmNvbnN0IEZBTExCQUNLX1BSSUNFUzogUmVjb3JkPFBsdXNSZWdpb24sIFJlY29yZDxQbHVzVGllciwgUmVjb3JkPFBsdXNEdXJhdGlvbiwgbnVtYmVyPj4+ID0ge1xuICB1czoge1xuICAgIGVzc2VudGlhbDogeyBcIjFtXCI6IDkuOTksICBcIjNtXCI6IDI0Ljk5LCAgXCIxMm1cIjogNzkuOTkgfSxcbiAgICBleHRyYTogICAgIHsgXCIxbVwiOiAxNC45OSwgXCIzbVwiOiAzOS45OSwgIFwiMTJtXCI6IDEzNC45OSB9LFxuICAgIHByZW1pdW06ICAgeyBcIjFtXCI6IDE3Ljk5LCBcIjNtXCI6IDQ5Ljk5LCAgXCIxMm1cIjogMTU5Ljk5IH0sXG4gIH0sXG4gIGJyOiB7XG4gICAgZXNzZW50aWFsOiB7IFwiMW1cIjogMzQuOTAsICBcIjNtXCI6IDg5LjkwLCAgIFwiMTJtXCI6IDE5OS45MCB9LFxuICAgIGV4dHJhOiAgICAgeyBcIjFtXCI6IDUyLjkwLCAgXCIzbVwiOiAxMzkuOTAsICBcIjEybVwiOiAzMzkuOTAgfSxcbiAgICBwcmVtaXVtOiAgIHsgXCIxbVwiOiA1OS45MCwgIFwiM21cIjogMTY1LjkwLCAgXCIxMm1cIjogMzk5LjkwIH0sXG4gIH0sXG4gIHRyOiB7XG4gICAgZXNzZW50aWFsOiB7IFwiMW1cIjogMTMwLCAgXCIzbVwiOiAzNDAsICAgXCIxMm1cIjogOTAwIH0sXG4gICAgZXh0cmE6ICAgICB7IFwiMW1cIjogMjAwLCAgXCIzbVwiOiA1MzAsICAgXCIxMm1cIjogMTQwMCB9LFxuICAgIHByZW1pdW06ICAgeyBcIjFtXCI6IDI1MCwgIFwiM21cIjogNjUwLCAgIFwiMTJtXCI6IDE3MDAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IFVBID1cbiAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgXCIgK1xuICBcIihLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2XCI7XG5cbmNvbnN0IFJFR0lPTl9MT0NBTEU6IFJlY29yZDxQbHVzUmVnaW9uLCBzdHJpbmc+ID0ge1xuICB1czogXCJlbi11c1wiLFxuICBicjogXCJwdC1iclwiLFxuICB0cjogXCJlbi10clwiLFxufTtcblxuY29uc3QgUkVHSU9OX0NVUlJFTkNZOiBSZWNvcmQ8UGx1c1JlZ2lvbiwgc3RyaW5nPiA9IHtcbiAgdXM6IFwiVVNEXCIsXG4gIGJyOiBcIkJSTFwiLFxuICB0cjogXCJUUllcIixcbn07XG5cbmNvbnN0IFJFR0lPTl9MQUJFTFM6IFJlY29yZDxQbHVzUmVnaW9uLCBzdHJpbmc+ID0ge1xuICB1czogXCJVU1wiLFxuICBicjogXCJCcmFzaWxcIixcbiAgdHI6IFwiVHVycXVcdTAwRURhXCIsXG59O1xuXG5leHBvcnQgeyBSRUdJT05fTEFCRUxTIGFzIFBMVVNfUkVHSU9OX0xBQkVMUyB9O1xuXG5jb25zdCBUSUVSX09SREVSOiBQbHVzVGllcltdID0gW1wiZXNzZW50aWFsXCIsIFwiZXh0cmFcIiwgXCJwcmVtaXVtXCJdO1xuY29uc3QgRFVSQVRJT05fT1JERVI6IFBsdXNEdXJhdGlvbltdID0gW1wiMW1cIiwgXCIzbVwiLCBcIjEybVwiXTtcblxuLy8gLS0tIFNjcmFwZXIgLS0tXG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoUHNQbHVzUGFnZShyZWdpb246IFBsdXNSZWdpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBsb2NhbGUgPSBSRUdJT05fTE9DQUxFW3JlZ2lvbl07XG4gIGNvbnN0IHVybCA9IGBodHRwczovL3d3dy5wbGF5c3RhdGlvbi5jb20vJHtsb2NhbGV9L3BzLXBsdXMvYDtcbiAgbGV0IGxhc3RFcnI6IHVua25vd24gPSBudWxsO1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcInVzZXItYWdlbnRcIjogVUEsXG4gICAgICAgICAgYWNjZXB0OiBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LCovKjtxPTAuOFwiLFxuICAgICAgICAgIFwiYWNjZXB0LWxhbmd1YWdlXCI6IHJlZ2lvbiA9PT0gXCJiclwiID8gXCJwdC1CUixwdDtxPTAuOVwiIDogXCJlbi1VUyxlbjtxPTAuOVwiLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBpZiAoci5zdGF0dXMgPT09IDQwMykgdGhyb3cgbmV3IEVycm9yKGA0MDMgRm9yYmlkZGVuICgke3VybH0pYCk7XG4gICAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Iuc3RhdHVzfSAoJHt1cmx9KWApO1xuICAgICAgcmV0dXJuIGF3YWl0IHIudGV4dCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxhc3RFcnIgPSBlO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlcykgPT4gc2V0VGltZW91dChyZXMsIDUwMCAqIDIgKiogYXR0ZW1wdCkpO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCBQUyBQbHVzIHBhZ2UgZm9yICR7cmVnaW9ufTogJHsobGFzdEVyciBhcyBFcnJvcik/Lm1lc3NhZ2UgfHwgbGFzdEVycn1gKTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE5leHREYXRhKGh0bWw6IHN0cmluZyk6IGFueSB8IG51bGwge1xuICBjb25zdCBtID0gLzxzY3JpcHRbXj5dKmlkPVtcIiddX19ORVhUX0RBVEFfX1tcIiddW14+XSo+KFtcXHNcXFNdKj8pPFxcL3NjcmlwdD4vLmV4ZWMoaHRtbCk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UobVsxXSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlUHJpY2UocmF3OiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKCFyYXcpIHJldHVybiBudWxsO1xuICBjb25zdCBjbGVhbmVkID0gcmF3LnJlcGxhY2UoL1teXFxkLixdL2csIFwiXCIpO1xuICBpZiAoIWNsZWFuZWQpIHJldHVybiBudWxsO1xuICBjb25zdCBwYXJ0cyA9IGNsZWFuZWQuc3BsaXQoL1suLF0vKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgcmV0dXJuIE51bWJlcihjbGVhbmVkKSB8fCBudWxsO1xuICB9XG4gIGNvbnN0IGxhc3RQYXJ0ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gIGlmIChsYXN0UGFydC5sZW5ndGggPD0gMikge1xuICAgIGNvbnN0IGludFBhcnQgPSBwYXJ0cy5zbGljZSgwLCAtMSkuam9pbihcIlwiKTtcbiAgICByZXR1cm4gTnVtYmVyKGAke2ludFBhcnR9LiR7bGFzdFBhcnR9YCkgfHwgbnVsbDtcbiAgfVxuICByZXR1cm4gTnVtYmVyKHBhcnRzLmpvaW4oXCJcIikpIHx8IG51bGw7XG59XG5cbmNvbnN0IFRJRVJfUEFUVEVSTlM6IFJlY29yZDxQbHVzVGllciwgUmVnRXhwPiA9IHtcbiAgZXNzZW50aWFsOiAvZXNzZW50aWFsL2ksXG4gIGV4dHJhOiAvZXh0cmEvaSxcbiAgcHJlbWl1bTogL3ByZW1pdW18ZGVsdXhlL2ksXG59O1xuXG5jb25zdCBEVVJBVElPTl9QQVRURVJOUzogUmVjb3JkPFBsdXNEdXJhdGlvbiwgUmVnRXhwPiA9IHtcbiAgXCIxbVwiOiAvXFxiMVxccyooPzptb250aHxtZXN8bSg/Olx1MDBFQXxlKXN8YXkpXFxiL2ksXG4gIFwiM21cIjogL1xcYjNcXHMqKD86bW9udGh8bWVzfG0oPzpcdTAwRUF8ZSlzfG1lc2VzfGF5KVxcYi9pLFxuICBcIjEybVwiOiAvXFxiKD86MTJcXHMqKD86bW9udGh8bWVzfG0oPzpcdTAwRUF8ZSlzfG1lc2VzfGF5KXwxXFxzKig/OnllYXJ8YVx1MDBGMW98YW5vKSlcXGIvaSxcbn07XG5cbmZ1bmN0aW9uIGNsYXNzaWZ5VGllcih0ZXh0OiBzdHJpbmcpOiBQbHVzVGllciB8IG51bGwge1xuICBmb3IgKGNvbnN0IHQgb2YgVElFUl9PUkRFUikge1xuICAgIGlmIChUSUVSX1BBVFRFUk5TW3RdLnRlc3QodGV4dCkpIHJldHVybiB0O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBjbGFzc2lmeUR1cmF0aW9uKHRleHQ6IHN0cmluZyk6IFBsdXNEdXJhdGlvbiB8IG51bGwge1xuICBmb3IgKGNvbnN0IGQgb2YgRFVSQVRJT05fT1JERVIpIHtcbiAgICBpZiAoRFVSQVRJT05fUEFUVEVSTlNbZF0udGVzdCh0ZXh0KSkgcmV0dXJuIGQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHdhbGtGb3JQcmljZXMoXG4gIG5vZGU6IHVua25vd24sXG4gIHJlc3VsdHM6IE1hcDxzdHJpbmcsIG51bWJlcj4sXG4gIGRlcHRoID0gMFxuKTogdm9pZCB7XG4gIGlmIChkZXB0aCA+IDMwIHx8ICFub2RlKSByZXR1cm47XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSB7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIG5vZGUpIHdhbGtGb3JQcmljZXMoaXRlbSwgcmVzdWx0cywgZGVwdGggKyAxKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHR5cGVvZiBub2RlICE9PSBcIm9iamVjdFwiKSByZXR1cm47XG4gIGNvbnN0IG9iaiA9IG5vZGUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG5cbiAgY29uc3QgbmFtZSA9IFN0cmluZyhvYmoubmFtZSB8fCBvYmoudGl0bGUgfHwgb2JqLmxhYmVsIHx8IG9iai5wbGFuTmFtZSB8fCBcIlwiKTtcbiAgY29uc3QgcHJpY2VTdHIgPSBTdHJpbmcoXG4gICAgb2JqLnByaWNlIHx8IG9iai5mb3JtYXR0ZWRQcmljZSB8fCBvYmouZGlzcGxheVByaWNlIHx8XG4gICAgb2JqLmJhc2VQcmljZSB8fCBvYmouYmFzZVByaWNlVmFsdWUgfHwgXCJcIlxuICApO1xuXG4gIGlmIChuYW1lICYmIHByaWNlU3RyKSB7XG4gICAgY29uc3QgdGllciA9IGNsYXNzaWZ5VGllcihuYW1lKTtcbiAgICBjb25zdCBkdXIgPSBjbGFzc2lmeUR1cmF0aW9uKG5hbWUpO1xuICAgIGlmICh0aWVyICYmIGR1cikge1xuICAgICAgY29uc3QgcHJpY2UgPSBwYXJzZVByaWNlKHByaWNlU3RyKTtcbiAgICAgIGlmIChwcmljZSAmJiBwcmljZSA+IDApIHtcbiAgICAgICAgY29uc3Qga2V5ID0gYCR7dGllcn06JHtkdXJ9YDtcbiAgICAgICAgaWYgKCFyZXN1bHRzLmhhcyhrZXkpKSByZXN1bHRzLnNldChrZXksIHByaWNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IHYgb2YgT2JqZWN0LnZhbHVlcyhvYmopKSB7XG4gICAgd2Fsa0ZvclByaWNlcyh2LCByZXN1bHRzLCBkZXB0aCArIDEpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RGcm9tSHRtbEZhbGxiYWNrKFxuICBodG1sOiBzdHJpbmcsXG4gIHJlZ2lvbjogUGx1c1JlZ2lvblxuKTogTWFwPHN0cmluZywgbnVtYmVyPiB7XG4gIGNvbnN0IHJlc3VsdHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGNvbnN0IHByaWNlUmUgPSByZWdpb24gPT09IFwiYnJcIlxuICAgID8gL1JcXCRcXHMqKFtcXGQuLF0rKS9nXG4gICAgOiByZWdpb24gPT09IFwidHJcIlxuICAgID8gLyg/Olx1MjBCQXxUTHxUUlkpXFxzKihbXFxkLixdKykvZ1xuICAgIDogL1xcJFxccyooW1xcZC4sXSspL2c7XG5cbiAgY29uc3Qgc2VjdGlvbnMgPSBodG1sLnNwbGl0KC8oPz1lc3NlbnRpYWx8ZXh0cmF8cHJlbWl1bSkvZ2kpO1xuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICBjb25zdCB0aWVyID0gY2xhc3NpZnlUaWVyKHNlY3Rpb24uc2xpY2UoMCwgMjAwKSk7XG4gICAgaWYgKCF0aWVyKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGR1ckJsb2NrcyA9IHNlY3Rpb24uc3BsaXQoLyg/PVxcYig/OjF8M3wxMilcXHMqKD86bW9udGh8bWVzfG1bXHUwMEVBZV1zfGF5fHllYXJ8YVx1MDBGMW98YW5vKSkvZ2kpO1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgZHVyQmxvY2tzKSB7XG4gICAgICBjb25zdCBkdXIgPSBjbGFzc2lmeUR1cmF0aW9uKGJsb2NrLnNsaWNlKDAsIDEwMCkpO1xuICAgICAgaWYgKCFkdXIpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBtYXRjaCA9IHByaWNlUmUuZXhlYyhibG9jayk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBwYXJzZVByaWNlKG1hdGNoWzFdKTtcbiAgICAgICAgaWYgKHByaWNlICYmIHByaWNlID4gMCkge1xuICAgICAgICAgIGNvbnN0IGtleSA9IGAke3RpZXJ9OiR7ZHVyfWA7XG4gICAgICAgICAgaWYgKCFyZXN1bHRzLmhhcyhrZXkpKSByZXN1bHRzLnNldChrZXksIHByaWNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcHJpY2VSZS5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuZnVuY3Rpb24gcGFyc2VQc1BsdXNIdG1sKFxuICBodG1sOiBzdHJpbmcsXG4gIHJlZ2lvbjogUGx1c1JlZ2lvblxuKTogUmVjb3JkPFBsdXNUaWVyLCBSZWNvcmQ8UGx1c0R1cmF0aW9uLCBudW1iZXI+PiB8IG51bGwge1xuICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlcj4+ID0ge307XG5cbiAgY29uc3QgbmV4dERhdGEgPSBleHRyYWN0TmV4dERhdGEoaHRtbCk7XG4gIGxldCBmb3VuZCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgaWYgKG5leHREYXRhKSB7XG4gICAgd2Fsa0ZvclByaWNlcyhuZXh0RGF0YSwgZm91bmQpO1xuICB9XG5cbiAgaWYgKGZvdW5kLnNpemUgPCA5KSB7XG4gICAgY29uc3QgaHRtbEZhbGxiYWNrID0gZXh0cmFjdEZyb21IdG1sRmFsbGJhY2soaHRtbCwgcmVnaW9uKTtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBodG1sRmFsbGJhY2spIHtcbiAgICAgIGlmICghZm91bmQuaGFzKGspKSBmb3VuZC5zZXQoaywgdik7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZvdW5kLnNpemUgPT09IDApIHJldHVybiBudWxsO1xuXG4gIGZvciAoY29uc3QgW2tleSwgcHJpY2VdIG9mIGZvdW5kKSB7XG4gICAgY29uc3QgW3RpZXIsIGR1cl0gPSBrZXkuc3BsaXQoXCI6XCIpO1xuICAgIGlmICghcmVzdWx0W3RpZXJdKSByZXN1bHRbdGllcl0gPSB7fTtcbiAgICByZXN1bHRbdGllcl1bZHVyXSA9IHByaWNlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdCBhcyBSZWNvcmQ8UGx1c1RpZXIsIFJlY29yZDxQbHVzRHVyYXRpb24sIG51bWJlcj4+O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NyYXBlUHNQbHVzUHJpY2VzKCk6IFByb21pc2U8U2NyYXBlZFBsdXNQcmljZXM+IHtcbiAgY29uc3QgcmVnaW9uczogUGx1c1JlZ2lvbltdID0gW1widXNcIiwgXCJiclwiLCBcInRyXCJdO1xuICBjb25zdCBwcmljZXMgPSBzdHJ1Y3R1cmVkQ2xvbmUoRkFMTEJBQ0tfUFJJQ0VTKTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgcmVnaW9uIG9mIHJlZ2lvbnMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IGZldGNoUHNQbHVzUGFnZShyZWdpb24pO1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VQc1BsdXNIdG1sKGh0bWwsIHJlZ2lvbik7XG4gICAgICBpZiAocGFyc2VkKSB7XG4gICAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgdGllciBvZiBUSUVSX09SREVSKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBkdXIgb2YgRFVSQVRJT05fT1JERVIpIHtcbiAgICAgICAgICAgIGlmIChwYXJzZWRbdGllcl0/LltkdXJdKSB7XG4gICAgICAgICAgICAgIHByaWNlc1tyZWdpb25dW3RpZXJdW2R1cl0gPSBwYXJzZWRbdGllcl1bZHVyXTtcbiAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goYCR7cmVnaW9uLnRvVXBwZXJDYXNlKCl9OiBwXHUwMEUxZ2luYSBjYXJnYWRhIHBlcm8gbm8gc2UgZW5jb250cmFyb24gcHJlY2lvcywgdXNhbmRvIHZhbG9yZXMgZGUgcmVzcGFsZG9gKTtcbiAgICAgICAgfSBlbHNlIGlmIChjb3VudCA8IDkpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChgJHtyZWdpb24udG9VcHBlckNhc2UoKX06IHNvbG8gJHtjb3VudH0vOSBwcmVjaW9zIGV4dHJhXHUwMEVEZG9zLCBlbCByZXN0byB1c2EgcmVzcGFsZG9gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCR7cmVnaW9uLnRvVXBwZXJDYXNlKCl9OiBubyBzZSBwdWRvIHBhcnNlYXIgbGEgcFx1MDBFMWdpbmEsIHVzYW5kbyB2YWxvcmVzIGRlIHJlc3BhbGRvYCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyb3JzLnB1c2goYCR7cmVnaW9uLnRvVXBwZXJDYXNlKCl9OiAkeyhlIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7IHByaWNlcywgc2NyYXBlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksIGVycm9ycyB9O1xufVxuXG4vLyAtLS0gUHJpY2UgY29tcHV0YXRpb24gLS0tXG5cbmNvbnN0IFBMVVNfTUFUQ0hfVEhSRVNIT0xEID0gMC40NTtcblxuZnVuY3Rpb24gYmVzdE1hdGNoU2NvcmUoc2VhcmNoVGVybXM6IHN0cmluZ1tdLCBwcm9kdWN0VGl0bGU6IHN0cmluZyk6IG51bWJlciB7XG4gIGNvbnN0IHByb2R1Y3RUb2tlbnMgPSB0b2tlbml6ZShwcm9kdWN0VGl0bGUpO1xuICBpZiAoIXByb2R1Y3RUb2tlbnMubGVuZ3RoKSByZXR1cm4gMDtcbiAgbGV0IGJlc3QgPSAwO1xuICBmb3IgKGNvbnN0IHRlcm0gb2Ygc2VhcmNoVGVybXMpIHtcbiAgICBjb25zdCB0ZXJtVG9rZW5zID0gdG9rZW5pemUodGVybSk7XG4gICAgaWYgKCF0ZXJtVG9rZW5zLmxlbmd0aCkgY29udGludWU7XG4gICAgY29uc3Qgc2NvcmUgPSBzaW1pbGFyaXR5KHRlcm1Ub2tlbnMsIHByb2R1Y3RUb2tlbnMpO1xuICAgIGlmIChzY29yZSA+IGJlc3QpIGJlc3QgPSBzY29yZTtcbiAgfVxuICByZXR1cm4gYmVzdDtcbn1cblxuZnVuY3Rpb24gdG9DbHAocHJpY2U6IG51bWJlciwgY3VycmVuY3k6IHN0cmluZywgY2ZnOiBQcmljaW5nU2V0dGluZ3MpOiBudW1iZXIge1xuICBsZXQgcmF0ZTogbnVtYmVyO1xuICBsZXQgZGlzY291bnQ6IG51bWJlcjtcbiAgc3dpdGNoIChjdXJyZW5jeSkge1xuICAgIGNhc2UgXCJCUkxcIjogcmF0ZSA9IGNmZy5icmxUb0NscDsgZGlzY291bnQgPSBjZmcuYmFsYW5jZURpc2NvdW50QnJsID8/IDEuMDsgYnJlYWs7XG4gICAgY2FzZSBcIlRSWVwiOiByYXRlID0gY2ZnLnRyeVRvQ2xwOyBkaXNjb3VudCA9IGNmZy5iYWxhbmNlRGlzY291bnRUcnkgPz8gMS4wOyBicmVhaztcbiAgICBkZWZhdWx0OiAgICByYXRlID0gY2ZnLnVzZFRvQ2xwOyBkaXNjb3VudCA9IGNmZy5iYWxhbmNlRGlzY291bnRVc2QgPz8gMS4wOyBicmVhaztcbiAgfVxuICByZXR1cm4gTWF0aC5yb3VuZChwcmljZSAqIGRpc2NvdW50ICogcmF0ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaFBsYW5zV2l0aENvbXBldGl0b3JzKFxuICBwcm9kdWN0czogQ29tcGV0aXRvclByb2R1Y3RbXSxcbiAgY2ZnOiBQcmljaW5nU2V0dGluZ3MsXG4gIHNjcmFwZWQ/OiBTY3JhcGVkUGx1c1ByaWNlcyB8IG51bGxcbik6IFBsdXNQbGFuV2l0aE1hdGNoZXNbXSB7XG4gIGNvbnN0IHByaWNlRGF0YSA9IHNjcmFwZWQ/LnByaWNlcyA/PyBGQUxMQkFDS19QUklDRVM7XG5cbiAgcmV0dXJuIFBMQU5fREVGUy5tYXAoKGRlZikgPT4ge1xuICAgIGNvbnN0IHJlZ2lvbnM6IFBsdXNSZWdpb25bXSA9IFtcInVzXCIsIFwiYnJcIiwgXCJ0clwiXTtcbiAgICBjb25zdCByZWdpb25QcmljZXM6IFBsdXNSZWdpb25QcmljZVtdID0gcmVnaW9ucy5tYXAoKHIpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbmN5ID0gUkVHSU9OX0NVUlJFTkNZW3JdO1xuICAgICAgY29uc3QgcHJpY2UgPSBwcmljZURhdGFbcl0/LltkZWYudGllcl0/LltkZWYuZHVyYXRpb25dID8/IEZBTExCQUNLX1BSSUNFU1tyXVtkZWYudGllcl1bZGVmLmR1cmF0aW9uXTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlZ2lvbjogcixcbiAgICAgICAgY3VycmVuY3ksXG4gICAgICAgIHByaWNlLFxuICAgICAgICBwcmljZUNscDogdG9DbHAocHJpY2UsIGN1cnJlbmN5LCBjZmcpLFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGxldCBjaGVhcGVzdFJlZ2lvbjogUGx1c1JlZ2lvbiB8IG51bGwgPSBudWxsO1xuICAgIGxldCBjaGVhcGVzdENscDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgZm9yIChjb25zdCBycCBvZiByZWdpb25QcmljZXMpIHtcbiAgICAgIGlmIChycC5wcmljZUNscCAhPSBudWxsICYmIChjaGVhcGVzdENscCA9PSBudWxsIHx8IHJwLnByaWNlQ2xwIDwgY2hlYXBlc3RDbHApKSB7XG4gICAgICAgIGNoZWFwZXN0Q2xwID0gcnAucHJpY2VDbHA7XG4gICAgICAgIGNoZWFwZXN0UmVnaW9uID0gcnAucmVnaW9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoZXM6IENvbXBldGl0b3JNYXRjaFtdID0gW107XG4gICAgZm9yIChjb25zdCBwIG9mIHByb2R1Y3RzKSB7XG4gICAgICBjb25zdCBzY29yZSA9IGJlc3RNYXRjaFNjb3JlKGRlZi5zZWFyY2hUZXJtcywgcC50aXRsZSk7XG4gICAgICBpZiAoc2NvcmUgPj0gUExVU19NQVRDSF9USFJFU0hPTEQpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBzdG9yZUtleTogcC5zdG9yZUtleSxcbiAgICAgICAgICB0aXRsZTogcC50aXRsZSxcbiAgICAgICAgICB1cmw6IHAudXJsLFxuICAgICAgICAgIHByaWNlQ2xwOiBwLnByaWNlQ2xwLFxuICAgICAgICAgIGF2YWlsYWJsZTogcC5hdmFpbGFibGUsXG4gICAgICAgICAgc2NvcmUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBtYXRjaGVzLnNvcnQoKGEsIGIpID0+IGEucHJpY2VDbHAgLSBiLnByaWNlQ2xwKTtcbiAgICBjb25zdCB0b3AgPSBtYXRjaGVzLnNsaWNlKDAsIDgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRpZXI6IGRlZi50aWVyLFxuICAgICAgZHVyYXRpb246IGRlZi5kdXJhdGlvbixcbiAgICAgIGxhYmVsOiBkZWYubGFiZWwsXG4gICAgICByZWdpb25QcmljZXMsXG4gICAgICBjaGVhcGVzdFJlZ2lvbixcbiAgICAgIGNoZWFwZXN0Q2xwLFxuICAgICAgc2VhcmNoVGVybXM6IGRlZi5zZWFyY2hUZXJtcyxcbiAgICAgIGNvbXBldGl0b3JNYXRjaGVzOiB0b3AsXG4gICAgICBiZXN0UHJpY2U6IHRvcC5sZW5ndGggPyB0b3BbMF0ucHJpY2VDbHAgOiBudWxsLFxuICAgICAgYmVzdFN0b3JlOiB0b3AubGVuZ3RoID8gdG9wWzBdLnN0b3JlS2V5IDogbnVsbCxcbiAgICB9O1xuICB9KTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc2VydmVyL2FwaS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NlcnZlci9hcGkudHNcIjsvKipcbiAqIE1pbmltYWwgSFRUUCByb3V0ZXIgZm9yIHRoZSAvYXBpLyogbmFtZXNwYWNlLiBVc2VzIG9ubHkgbm9kZTpodHRwIHR5cGVzIHNvXG4gKiB3ZSBkb24ndCBuZWVkIEV4cHJlc3MgYXMgYSBkZXBlbmRlbmN5LlxuICpcbiAqIFJvdXRlczpcbiAqICAgR0VUICAgIC9nYW1lcyAgICAgICAgICAgICAgICAgICAgICBsaXN0IHdpdGggY29tcHV0ZWQgQ0xQIHByaWNlc1xuICogICBQQVRDSCAgL2dhbWVzLzppZCAgICAgICAgICAgICAgICAgIHsgc2VsZWN0ZWQ/LCBwdWJsaXNoZWQ/LCBub3Rlcz8gfVxuICogICBQT1NUICAgL3JlZnJlc2ggICAgICAgICAgICAgICAgICAgIHNjcmFwZSBQU04gYW5kIHVwc2VydFxuICogICBHRVQgICAgL2dhbWVzL2V4cG9ydC5jc3YgICAgICAgICAgIENTViBvZiBzZWxlY3RlZCBnYW1lc1xuICogICBHRVQgICAgL3NldHRpbmdzICAgICAgICAgICAgICAgICAgIHByaWNpbmcgKyBwc24gY29uZmlnXG4gKiAgIFBVVCAgICAvc2V0dGluZ3MgICAgICAgICAgICAgICAgICAgcGFydGlhbCB1cGRhdGUgKHByaWNpbmcgYW5kL29yIHBzbilcbiAqICAgUE9TVCAgIC9tb2NrL2NsZWFyICAgICAgICAgICAgICAgICBkZWFjdGl2YXRlIGFsbCBnYW1lc1xuICovXG5pbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tIFwibm9kZTpodHRwXCI7XG5pbXBvcnQgeyBzdG9yZSwgdHlwZSBHYW1lLCB0eXBlIFdhdGNoZWRHYW1lLCB0eXBlIFN1cGFiYXNlQ29uZmlnIH0gZnJvbSBcIi4vc3RvcmVcIjtcbmltcG9ydCB7IGNvbXB1dGVTYWxlUHJpY2VzIH0gZnJvbSBcIi4vcHJpY2luZ1wiO1xuaW1wb3J0IHtcbiAgaW5zcGVjdFByb2R1Y3RUeXBlcyxcbiAgUGVyc2lzdGVkUXVlcnlOb3RGb3VuZEVycm9yLFxuICBQc25BcGlFcnJvcixcbn0gZnJvbSBcIi4vcHNuXCI7XG5pbXBvcnQge1xuICBmZXRjaENvbXBldGl0b3IsXG4gIG1hdGNoR2FtZXMsXG4gIENvbXBldGl0b3JGZXRjaEVycm9yLFxuICB0b2tlbml6ZSxcbiAgc2ltaWxhcml0eSxcbiAgdHlwZSBDb21wZXRpdG9yQ29uZmlnLFxuICB0eXBlIENvbXBldGl0b3JNYXRjaCxcbn0gZnJvbSBcIi4vY29tcGV0aXRvcnNcIjtcbmltcG9ydCB7IGZldGNoUHJvZHVjdERldGFpbCB9IGZyb20gXCIuL3Bzbi1wcm9kdWN0XCI7XG5pbXBvcnQge1xuICBnZXRQcm92aWRlcixcbiAgUExBVEZPUk1fTEFCRUxTLFxuICBQTEFURk9STV9SRUdJT05TLFxuICBQcm92aWRlckVycm9yLFxufSBmcm9tIFwiLi9wcm92aWRlcnMvaW5kZXhcIjtcbmltcG9ydCB0eXBlIHsgUGxhdGZvcm0sIFByb3ZpZGVyU291cmNlIH0gZnJvbSBcIi4vcHJvdmlkZXJzL3R5cGVzXCI7XG5pbXBvcnQgeyBmZXRjaEV4Y2hhbmdlUmF0ZXMgfSBmcm9tIFwiLi9leGNoYW5nZVwiO1xuaW1wb3J0IHsgZ2V0TGFzdEF1dG9SZWZyZXNoQXQsIHJlc2NoZWR1bGUsIHN0YXJ0U2NoZWR1bGVyIH0gZnJvbSBcIi4vc2NoZWR1bGVyXCI7XG5pbXBvcnQgeyBtYXRjaFBsYW5zV2l0aENvbXBldGl0b3JzLCBzY3JhcGVQc1BsdXNQcmljZXMgfSBmcm9tIFwiLi9wcy1wbHVzXCI7XG5pbXBvcnQgdHlwZSB7IFNjcmFwZWRQbHVzUHJpY2VzIH0gZnJvbSBcIi4vcHMtcGx1c1wiO1xuXG4vKiogRXh0cmFjdCBhIFBTTiBwcm9kdWN0IGlkIGZyb20gYSBzdG9yZSBVUkwuIEFjY2VwdHMgYm90aCBlbi1VUyBhbmQgb3RoZXJcbiAqICBsb2NhbGVzLCBhbmQgdG9sZXJhdGVzIHRyYWlsaW5nIHNlZ21lbnRzIC8gcXVlcnkgc3RyaW5ncy4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQc25JZChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHMgPSBTdHJpbmcoaW5wdXQgfHwgXCJcIikudHJpbSgpO1xuICBpZiAoIXMpIHJldHVybiBudWxsO1xuICAvLyBBbHJlYWR5IGFuIGlkIChVUFhYWFgtQ1VTQVhYWFhYXzAwLVx1MjAyNiBvciBFUFx1MjAyNiAvIFVDXHUyMDI2KVxuICBpZiAoL15bQS1aXXsyfVswLTldezR9LVtBLVowLTldK19bMC05XXsyfSg/Oi1bQS1aMC05XSspPyQvLnRlc3QocykpIHJldHVybiBzO1xuICBjb25zdCBtID0gL1xcL3Byb2R1Y3RcXC8oW0EtWl17Mn1bMC05XXs0fS1bQS1aMC05XStfWzAtOV17Mn0oPzotW0EtWjAtOV0rKT8pL2kuZXhlYyhcbiAgICBzXG4gICk7XG4gIHJldHVybiBtID8gbVsxXS50b1VwcGVyQ2FzZSgpIDogbnVsbDtcbn1cblxuaW50ZXJmYWNlIFdhdGNobGlzdEFsZXJ0IHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBkaXNjb3VudFBlcmNlbnQ6IG51bWJlcjtcbiAgcHJpY2VEaXNjb3VudGVkVXNkOiBudW1iZXIgfCBudWxsO1xuICBzdG9yZVVybDogc3RyaW5nIHwgbnVsbDtcbn1cblxuLyoqIERpZmYgdGhlIHdhdGNobGlzdCBhZ2FpbnN0IHRoZSBmcmVzaCBzY3JhcGUgYW5kIGZsYWcgdHJhbnNpdGlvbnMuIFVwZGF0ZXNcbiAqICBlYWNoIHdhdGNoZWQgZW50cnkncyBsYXN0U3RhdHVzIGluIHBsYWNlLiBSZXR1cm5zIHRoZSBsaXN0IG9mIGdhbWVzIHRoYXRcbiAqICB0cmFuc2l0aW9uZWQgb2ZmX3NhbGUgXHUyMTkyIG9uX3NhbGUgdGhpcyBydW4uICovXG5mdW5jdGlvbiBkaWZmV2F0Y2hsaXN0KHNlZW46IFNldDxzdHJpbmc+LCBub3dJc286IHN0cmluZyk6IFdhdGNobGlzdEFsZXJ0W10ge1xuICBjb25zdCBhbGVydHM6IFdhdGNobGlzdEFsZXJ0W10gPSBbXTtcbiAgZm9yIChjb25zdCB3IG9mIHN0b3JlLmxpc3RXYXRjaGxpc3QoKSkge1xuICAgIGNvbnN0IGdhbWUgPSBzdG9yZS5nZXRHYW1lKHcuaWQpO1xuICAgIGNvbnN0IGluU2FsZU5vdyA9XG4gICAgICAhIWdhbWUgJiYgZ2FtZS5hY3RpdmUgJiYgZ2FtZS5kaXNjb3VudFBlcmNlbnQgPiAwICYmIHNlZW4uaGFzKHcuaWQpO1xuICAgIGNvbnN0IHRyYW5zaXRpb25lZCA9IGluU2FsZU5vdyAmJiB3Lmxhc3RTdGF0dXMgIT09IFwib25fc2FsZVwiO1xuXG4gICAgaWYgKHRyYW5zaXRpb25lZCAmJiBnYW1lKSB7XG4gICAgICBhbGVydHMucHVzaCh7XG4gICAgICAgIGlkOiB3LmlkLFxuICAgICAgICBuYW1lOiBnYW1lLm5hbWUsXG4gICAgICAgIGRpc2NvdW50UGVyY2VudDogZ2FtZS5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIHByaWNlRGlzY291bnRlZFVzZDpcbiAgICAgICAgICBnYW1lLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGxcbiAgICAgICAgICAgID8gZ2FtZS5wcmljZURpc2NvdW50ZWRDZW50cyAvIDEwMFxuICAgICAgICAgICAgOiBudWxsLFxuICAgICAgICBzdG9yZVVybDogZ2FtZS5zdG9yZVVybCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0b3JlLnBhdGNoV2F0Y2hlZCh3LmlkLCB7XG4gICAgICBuYW1lOiBnYW1lPy5uYW1lIHx8IHcubmFtZSxcbiAgICAgIGxhc3RTdGF0dXM6IGluU2FsZU5vdyA/IFwib25fc2FsZVwiIDogdy5sYXN0U3RhdHVzID09PSBcInVuc2VlblwiID8gXCJ1bnNlZW5cIiA6IFwib2ZmX3NhbGVcIixcbiAgICAgIGxhc3RTZWVuT25TYWxlQXQ6IGluU2FsZU5vdyA/IG5vd0lzbyA6IHcubGFzdFNlZW5PblNhbGVBdCxcbiAgICAgIGxhc3RQcmljZUNlbnRzOiBnYW1lPy5wcmljZURpc2NvdW50ZWRDZW50cyA/PyB3Lmxhc3RQcmljZUNlbnRzLFxuICAgICAgbGFzdERpc2NvdW50UGVyY2VudDogZ2FtZT8uZGlzY291bnRQZXJjZW50ID8/IHcubGFzdERpc2NvdW50UGVyY2VudCxcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gYWxlcnRzO1xufVxuXG50eXBlIEhhbmRsZXIgPSAocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHJlczogU2VydmVyUmVzcG9uc2UsIHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPikgPT4gUHJvbWlzZTx2b2lkPjtcblxuaW50ZXJmYWNlIFJvdXRlIHtcbiAgbWV0aG9kOiBzdHJpbmc7XG4gIHBhdHRlcm46IFJlZ0V4cDtcbiAga2V5czogc3RyaW5nW107XG4gIGhhbmRsZXI6IEhhbmRsZXI7XG59XG5cbmNvbnN0IHJvdXRlczogUm91dGVbXSA9IFtdO1xuXG5mdW5jdGlvbiByb3V0ZShtZXRob2Q6IHN0cmluZywgcGF0aDogc3RyaW5nLCBoYW5kbGVyOiBIYW5kbGVyKSB7XG4gIGNvbnN0IGtleXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHBhdHRlcm4gPSBuZXcgUmVnRXhwKFxuICAgIFwiXlwiICtcbiAgICAgIHBhdGgucmVwbGFjZSgvOihbYS16QS1aX10rKS9nLCAoXywgaykgPT4ge1xuICAgICAgICBrZXlzLnB1c2goayk7XG4gICAgICAgIHJldHVybiBcIihbXi9dKylcIjtcbiAgICAgIH0pICtcbiAgICAgIFwiJFwiXG4gICk7XG4gIHJvdXRlcy5wdXNoKHsgbWV0aG9kLCBwYXR0ZXJuLCBrZXlzLCBoYW5kbGVyIH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kSnNvbihyZXM6IFNlcnZlclJlc3BvbnNlLCBzdGF0dXM6IG51bWJlciwgYm9keTogdW5rbm93bikge1xuICByZXMuc3RhdHVzQ29kZSA9IHN0YXR1cztcbiAgcmVzLnNldEhlYWRlcihcImNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIik7XG4gIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkQm9keShyZXE6IEluY29taW5nTWVzc2FnZSk6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGNodW5rcy5wdXNoKGNodW5rIGFzIEJ1ZmZlcik7XG4gIGNvbnN0IHJhdyA9IEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZyhcInV0Zi04XCIpO1xuICBpZiAoIXJhdykgcmV0dXJuIHt9O1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJhdyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7fTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnYW1lRGJLZXkoZzogR2FtZSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtnLnBsYXRmb3JtfToke2cucmVnaW9ufToke2cuaWR9YDtcbn1cblxuY29uc3QgQUREX09OX1BBVFRFUk4gPSAvXFxiKGRsY3xzZWFzb24gcGFzc3xhdmF0YXJ8dGhlbWV8Y3VycmVuY3kgcGFja3xjb2luIHBhY2t8cG9pbnQgcGFjaylcXGIvaTtcbmNvbnN0IFBSRU1JVU1fRURJVElPTiA9IC9cXGIoZGVsdXhlfHVsdGltYXRlfGNvbXBsZXRlfGdvdHl8Z2FtZSBvZiB0aGUgeWVhcnxkaWdpdGFsIGVkaXRpb258bGF1bmNoIGVkaXRpb24pXFxiL2k7XG5cbmZ1bmN0aW9uIGNvbXB1dGVIaXRTY29yZShnOiBHYW1lKTogbnVtYmVyIHtcbiAgLy8gTm8gZGlzY291bnQgPSBub3QgdmlhYmxlIGZvciByZXNhbGVcbiAgaWYgKGcuZGlzY291bnRQZXJjZW50IDw9IDApIHJldHVybiAwO1xuXG4gIGxldCBzY29yZSA9IDA7XG4gIGNvbnN0IHByaWNlVXNkID0gKGcucHJpY2VPcmlnaW5hbENlbnRzID8/IDApIC8gMTAwO1xuXG4gIC8vIEFBQSBwcmljZSB0aWVyXG4gIGlmIChwcmljZVVzZCA+PSA2MCkgc2NvcmUgKz0gMzA7XG4gIGVsc2UgaWYgKHByaWNlVXNkID49IDQwKSBzY29yZSArPSAyMDtcbiAgZWxzZSBpZiAocHJpY2VVc2QgPj0gMjApIHNjb3JlICs9IDEwO1xuXG4gIC8vIERpc2NvdW50IGRlcHRoXG4gIGlmIChnLmRpc2NvdW50UGVyY2VudCA+PSA0MCkgc2NvcmUgKz0gMjU7XG4gIGVsc2UgaWYgKGcuZGlzY291bnRQZXJjZW50ID49IDI1KSBzY29yZSArPSAxNTtcbiAgZWxzZSBpZiAoZy5kaXNjb3VudFBlcmNlbnQgPiAwKSBzY29yZSArPSA1O1xuXG4gIC8vIEtub3duIHB1Ymxpc2hlciAoZnJvbSBlbnJpY2hlZCBwcm9kdWN0IGRldGFpbClcbiAgY29uc3QgZGV0YWlsID0gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKTtcbiAgaWYgKGRldGFpbD8ucHVibGlzaGVyKSB7XG4gICAgY29uc3QgaGl0UHVicyA9IHN0b3JlLmdldEhpdFB1Ymxpc2hlcnMoKTtcbiAgICBjb25zdCBwdWIgPSBkZXRhaWwucHVibGlzaGVyLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGhpdFB1YnMuc29tZSgocCkgPT4gcHViLmluY2x1ZGVzKHAudG9Mb3dlckNhc2UoKSkpKSBzY29yZSArPSAyNTtcbiAgfVxuXG4gIC8vIFBTNSBzdXBwb3J0XG4gIGlmIChnLnBsYXRmb3Jtcz8uaW5jbHVkZXMoXCJQUzVcIikpIHNjb3JlICs9IDEwO1xuXG4gIC8vIFBlbmFsdHkgZm9yIGFkZC1vbiBjb250ZW50ICh1bmxlc3MgaXQncyBhIHByZW1pdW0gZWRpdGlvbilcbiAgaWYgKEFERF9PTl9QQVRURVJOLnRlc3QoZy5uYW1lKSAmJiAhUFJFTUlVTV9FRElUSU9OLnRlc3QoZy5uYW1lKSkgc2NvcmUgLT0gNTA7XG5cbiAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgc2NvcmUpKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVTa3UobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc2x1ZyA9IG5hbWVcbiAgICAubm9ybWFsaXplKFwiTkZEXCIpLnJlcGxhY2UoL1tcdTAzMDAtXHUwMzZGXS9nLCBcIlwiKVxuICAgIC50b1VwcGVyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1teQS1aMC05XFxzXS9nLCBcIlwiKVxuICAgIC50cmltKClcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5zbGljZSgwLCA1KVxuICAgIC5qb2luKFwiLVwiKTtcbiAgcmV0dXJuIGBQUy0ke3NsdWd9LTAwMWA7XG59XG5cbmZ1bmN0aW9uIHRvR2FtZU91dChnOiBHYW1lLCBjZmdQcmljaW5nID0gc3RvcmUuZ2V0U2V0dGluZ3MoKSkge1xuICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnUHJpY2luZywgZy5jdXJyZW5jeSB8fCBcIlVTRFwiKTtcbiAgY29uc3QgZGJLZXkgPSBnYW1lRGJLZXkoZyk7XG4gIGNvbnN0IG1hdGNoZXMgPSBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhkYktleSkgfHwgc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoZy5pZCk7XG4gIGNvbnN0IG1hcmtldE1pbiA9IG1hdGNoZXMubGVuZ3RoXG4gICAgPyBNYXRoLm1pbiguLi5tYXRjaGVzLm1hcCgobSkgPT4gbS5wcmljZUNscCkpXG4gICAgOiBudWxsO1xuICByZXR1cm4ge1xuICAgIGlkOiBnLmlkLFxuICAgIGRiS2V5LFxuICAgIHBsYXRmb3JtOiBnLnBsYXRmb3JtIHx8IFwicHNuXCIsXG4gICAgcmVnaW9uOiBnLnJlZ2lvbiB8fCBcInVzXCIsXG4gICAgY3VycmVuY3k6IGcuY3VycmVuY3kgfHwgXCJVU0RcIixcbiAgICBuYW1lOiBnLm5hbWUsXG4gICAgaW1hZ2VVcmw6IGcuaW1hZ2VVcmwsXG4gICAgc3RvcmVVcmw6IGcuc3RvcmVVcmwsXG4gICAgcGxhdGZvcm1zOiBnLnBsYXRmb3JtcyxcbiAgICBwcmljZU9yaWdpbmFsOlxuICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZURpc2NvdW50ZWQ6XG4gICAgICBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZU9yaWdpbmFsVXNkOlxuICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IGcucHJpY2VPcmlnaW5hbENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBwcmljZURpc2NvdW50ZWRVc2Q6XG4gICAgICBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICBkaXNjb3VudFBlcmNlbnQ6IGcuZGlzY291bnRQZXJjZW50LFxuICAgIGRpc2NvdW50RW5kQXQ6IGcuZGlzY291bnRFbmRBdCxcbiAgICBzZWxlY3RlZDogZy5zZWxlY3RlZCxcbiAgICBwdWJsaXNoZWQ6IGcucHVibGlzaGVkLFxuICAgIG5vdGVzOiBnLm5vdGVzLFxuICAgIHlvdXR1YmVVcmw6IGcueW91dHViZVVybCB8fCBcIlwiLFxuICAgIGFjdGl2ZTogZy5hY3RpdmUsXG4gICAgY29zdENscDogc2FsZT8uY29zdENscCA/PyBudWxsLFxuICAgIHByaW1hcmlhOiBzYWxlPy5wcmltYXJpYSA/PyBudWxsLFxuICAgIHNlY3VuZGFyaWE6IHNhbGU/LnNlY3VuZGFyaWEgPz8gbnVsbCxcbiAgICB0b3RhbFJldmVudWU6IHNhbGU/LnRvdGFsUmV2ZW51ZSA/PyBudWxsLFxuICAgIG5ldFByb2ZpdDogc2FsZT8ubmV0UHJvZml0ID8/IG51bGwsXG4gICAgbWFya2V0TWluLFxuICAgIG1hcmtldENvdW50OiBtYXRjaGVzLmxlbmd0aCxcbiAgICBtYXJrZXRNYXRjaGVzOiBtYXRjaGVzLFxuICAgIGhpdFNjb3JlOiBjb21wdXRlSGl0U2NvcmUoZyksXG4gIH07XG59XG5cbi8vIEdFVCAvZ2FtZXNcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IHNlYXJjaCA9ICh1cmwuc2VhcmNoUGFyYW1zLmdldChcInNlYXJjaFwiKSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBtaW5EaXNjb3VudCA9IHBhcnNlSW50KHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwibWluX2Rpc2NvdW50XCIpIHx8IFwiMFwiLCAxMCkgfHwgMDtcbiAgY29uc3Qgb25seVNlbGVjdGVkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJvbmx5X3NlbGVjdGVkXCIpID09PSBcInRydWVcIjtcbiAgY29uc3QgaGlkZVB1Ymxpc2hlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiaGlkZV9wdWJsaXNoZWRcIikgPT09IFwidHJ1ZVwiO1xuICBjb25zdCBvbmx5V2l0aE1hcmtldCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV93aXRoX21hcmtldFwiKSA9PT0gXCJ0cnVlXCI7XG4gIGNvbnN0IGluY2x1ZGVJbmFjdGl2ZSA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiaW5jbHVkZV9pbmFjdGl2ZVwiKSA9PT0gXCJ0cnVlXCI7XG4gIGNvbnN0IHBsYXRmb3JtRmlsdGVyID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJwbGF0Zm9ybVwiKSB8fCBcIlwiO1xuICBjb25zdCBvbmx5SGl0cyA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9oaXRzXCIpID09PSBcInRydWVcIjtcbiAgY29uc3Qgc29ydCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwic29ydFwiKSB8fCBcImRpc2NvdW50XCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCk7XG4gIGlmICghaW5jbHVkZUluYWN0aXZlKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiAoZy5wbGF0Zm9ybSB8fCBcInBzblwiKSA9PT0gcGxhdGZvcm1GaWx0ZXIpO1xuICBpZiAobWluRGlzY291bnQgPiAwKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5kaXNjb3VudFBlcmNlbnQgPj0gbWluRGlzY291bnQpO1xuICBpZiAob25seVNlbGVjdGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5zZWxlY3RlZCk7XG4gIGlmIChoaWRlUHVibGlzaGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gIWcucHVibGlzaGVkKTtcbiAgaWYgKG9ubHlIaXRzKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gY29tcHV0ZUhpdFNjb3JlKGcpID49IDUwKTtcbiAgaWYgKG9ubHlXaXRoTWFya2V0KSB7XG4gICAgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IGdhbWVEYktleShnKTtcbiAgICAgIHJldHVybiAoc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoa2V5KSB8fCBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhnLmlkKSkubGVuZ3RoID4gMDtcbiAgICB9KTtcbiAgfVxuICBpZiAoc2VhcmNoKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoKSk7XG5cbiAgaWYgKHNvcnQgPT09IFwiaGl0XCIpIGdhbWVzLnNvcnQoKGEsIGIpID0+IGNvbXB1dGVIaXRTY29yZShiKSAtIGNvbXB1dGVIaXRTY29yZShhKSk7XG4gIGVsc2UgaWYgKHNvcnQgPT09IFwicHJpY2VcIikgZ2FtZXMuc29ydCgoYSwgYikgPT4gKGEucHJpY2VEaXNjb3VudGVkQ2VudHMgPz8gMCkgLSAoYi5wcmljZURpc2NvdW50ZWRDZW50cyA/PyAwKSk7XG4gIGVsc2UgaWYgKHNvcnQgPT09IFwibmFtZVwiKSBnYW1lcy5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKTtcbiAgZWxzZSBpZiAoc29ydCA9PT0gXCJtYXJrZXRcIikge1xuICAgIGdhbWVzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGFtID0gc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoYS5pZCk7XG4gICAgICBjb25zdCBibSA9IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKGIuaWQpO1xuICAgICAgY29uc3QgYXAgPSBhbS5sZW5ndGggPyBNYXRoLm1pbiguLi5hbS5tYXAoKG0pID0+IG0ucHJpY2VDbHApKSA6IEluZmluaXR5O1xuICAgICAgY29uc3QgYnAgPSBibS5sZW5ndGggPyBNYXRoLm1pbiguLi5ibS5tYXAoKG0pID0+IG0ucHJpY2VDbHApKSA6IEluZmluaXR5O1xuICAgICAgcmV0dXJuIGFwIC0gYnA7XG4gICAgfSk7XG4gIH1cbiAgZWxzZSBnYW1lcy5zb3J0KChhLCBiKSA9PiBiLmRpc2NvdW50UGVyY2VudCAtIGEuZGlzY291bnRQZXJjZW50KTtcblxuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgZ2FtZXMubWFwKChnKSA9PiB0b0dhbWVPdXQoZywgY2ZnKSkpO1xufSk7XG5cbi8vIFBBVENIIC9nYW1lcy86aWQgXHUyMDE0IGlkIGNhbiBiZSBhIGNvbXBvc2l0ZSBkYktleSAocHNuOnVzOlVQWFhYWC0uLi4pIG9yIGEgYmFyZSBQU04gaWRcbnJvdXRlKFwiUEFUQ0hcIiwgXCIvZ2FtZXMvOmlkXCIsIGFzeW5jIChyZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgUGFydGlhbDxcbiAgICBQaWNrPEdhbWUsIFwic2VsZWN0ZWRcIiB8IFwicHVibGlzaGVkXCIgfCBcIm5vdGVzXCIgfCBcInlvdXR1YmVVcmxcIj5cbiAgPjtcbiAgY29uc3QgcGF0Y2g6IFBhcnRpYWw8R2FtZT4gPSB7fTtcbiAgaWYgKHR5cGVvZiBib2R5LnNlbGVjdGVkID09PSBcImJvb2xlYW5cIikgcGF0Y2guc2VsZWN0ZWQgPSBib2R5LnNlbGVjdGVkO1xuICBpZiAodHlwZW9mIGJvZHkucHVibGlzaGVkID09PSBcImJvb2xlYW5cIikgcGF0Y2gucHVibGlzaGVkID0gYm9keS5wdWJsaXNoZWQ7XG4gIGlmICh0eXBlb2YgYm9keS5ub3RlcyA9PT0gXCJzdHJpbmdcIikgcGF0Y2gubm90ZXMgPSBib2R5Lm5vdGVzO1xuICBpZiAodHlwZW9mIGJvZHkueW91dHViZVVybCA9PT0gXCJzdHJpbmdcIikgcGF0Y2gueW91dHViZVVybCA9IGJvZHkueW91dHViZVVybC50cmltKCk7XG4gIGNvbnN0IGlkID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5pZCk7XG4gIGxldCB1cGRhdGVkID0gc3RvcmUucGF0Y2hHYW1lKGlkLCBwYXRjaCk7XG4gIGlmICghdXBkYXRlZCkge1xuICAgIC8vIFRyeSBsZWdhY3kga2V5IChiYXJlIFBTTiBpZClcbiAgICB1cGRhdGVkID0gc3RvcmUucGF0Y2hHYW1lKGBwc246dXM6JHtpZH1gLCBwYXRjaCk7XG4gIH1cbiAgaWYgKCF1cGRhdGVkKSByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwibm90X2ZvdW5kXCIgfSk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB0b0dhbWVPdXQodXBkYXRlZCkpO1xufSk7XG5cbi8vIFBPU1QgL3JlZnJlc2ggXHUyMDE0IG11bHRpLXBsYXRmb3JtIHJlZnJlc2guIE9wdGlvbmFsIGJvZHk6IHsgcGxhdGZvcm0/LCByZWdpb24/IH1cbi8vIFdpdGggbm8gYm9keSwgcmVmcmVzaGVzIGFsbCBlbmFibGVkIHNvdXJjZXMuIFdpdGggcGxhdGZvcm0vcmVnaW9uLCByZWZyZXNoZXNcbi8vIG9ubHkgdGhhdCBzcGVjaWZpYyBzb3VyY2UuXG5yb3V0ZShcIlBPU1RcIiwgXCIvcmVmcmVzaFwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcbiAgICBjb25zdCB0YXJnZXRQbGF0Zm9ybSA9IGJvZHkucGxhdGZvcm0gYXMgUGxhdGZvcm0gfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdGFyZ2V0UmVnaW9uID0gYm9keS5yZWdpb24gYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qgc291cmNlcyA9IHN0b3JlLmdldFNvdXJjZXMoKS5maWx0ZXIoKHMpID0+IHtcbiAgICAgIGlmICghcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAodGFyZ2V0UGxhdGZvcm0gJiYgcy5wbGF0Zm9ybSAhPT0gdGFyZ2V0UGxhdGZvcm0pIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICh0YXJnZXRSZWdpb24gJiYgcy5yZWdpb24gIT09IHRhcmdldFJlZ2lvbikgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBjb25zdCBub3dJc28gPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgcmVzdWx0czogQXJyYXk8e1xuICAgICAgcGxhdGZvcm06IHN0cmluZztcbiAgICAgIHJlZ2lvbjogc3RyaW5nO1xuICAgICAgbmV3Q291bnQ6IG51bWJlcjtcbiAgICAgIHVwZGF0ZWQ6IG51bWJlcjtcbiAgICAgIGRpc2FwcGVhcmVkOiBudW1iZXI7XG4gICAgICB0b3RhbFNlZW46IG51bWJlcjtcbiAgICAgIGVycm9yPzogc3RyaW5nO1xuICAgIH0+ID0gW107XG4gICAgbGV0IGFsbFdhdGNobGlzdEFsZXJ0czogV2F0Y2hsaXN0QWxlcnRbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBnZXRQcm92aWRlcihzb3VyY2UucGxhdGZvcm0pO1xuICAgICAgICBjb25zdCBzZWVuS2V5cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBsZXQgbmV3Q291bnQgPSAwO1xuICAgICAgICBsZXQgdXBkYXRlZCA9IDA7XG4gICAgICAgIGxldCB0b3RhbFNlZW4gPSAwO1xuXG4gICAgICAgIC8vIEZvciBQU04sIGluamVjdCB0aGUgY2F0ZWdvcnlJZCBmcm9tIHRoZSBQU04gY29uZmlnIGlmIG5vdCBvbiBzb3VyY2VcbiAgICAgICAgY29uc3QgZWZmU291cmNlID0geyAuLi5zb3VyY2UgfTtcbiAgICAgICAgaWYgKHNvdXJjZS5wbGF0Zm9ybSA9PT0gXCJwc25cIiAmJiAhc291cmNlLmNhdGVnb3J5SWQpIHtcbiAgICAgICAgICBlZmZTb3VyY2UuY2F0ZWdvcnlJZCA9IHN0b3JlLmdldFBzbigpLmRlYWxzQ2F0ZWdvcnlJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgZGVhbCBvZiBwcm92aWRlci5mZXRjaERlYWxzKGVmZlNvdXJjZSkpIHtcbiAgICAgICAgICB0b3RhbFNlZW4rKztcbiAgICAgICAgICBjb25zdCBkYktleSA9IGAke3NvdXJjZS5wbGF0Zm9ybX06JHtzb3VyY2UucmVnaW9ufToke2RlYWwuaWR9YDtcbiAgICAgICAgICBzZWVuS2V5cy5hZGQoZGJLZXkpO1xuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gc3RvcmUuZ2V0R2FtZUJ5Q29tcG9zaXRlKHNvdXJjZS5wbGF0Zm9ybSwgc291cmNlLnJlZ2lvbiwgZGVhbC5pZCk7XG4gICAgICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICAgICAgc3RvcmUudXBzZXJ0R2FtZSh7XG4gICAgICAgICAgICAgIGlkOiBkZWFsLmlkLFxuICAgICAgICAgICAgICBwbGF0Zm9ybTogc291cmNlLnBsYXRmb3JtLFxuICAgICAgICAgICAgICByZWdpb246IHNvdXJjZS5yZWdpb24sXG4gICAgICAgICAgICAgIG5hbWU6IGRlYWwubmFtZSxcbiAgICAgICAgICAgICAgaW1hZ2VVcmw6IGRlYWwuaW1hZ2VVcmwsXG4gICAgICAgICAgICAgIHN0b3JlVXJsOiBkZWFsLnN0b3JlVXJsLFxuICAgICAgICAgICAgICBwbGF0Zm9ybXM6IGRlYWwuaGFyZHdhcmVQbGF0Zm9ybXMsXG4gICAgICAgICAgICAgIGN1cnJlbmN5OiBkZWFsLmN1cnJlbmN5LFxuICAgICAgICAgICAgICBwcmljZU9yaWdpbmFsQ2VudHM6IGRlYWwucHJpY2VPcmlnaW5hbENlbnRzLFxuICAgICAgICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cyxcbiAgICAgICAgICAgICAgZGlzY291bnRQZXJjZW50OiBkZWFsLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgICAgICAgZGlzY291bnRFbmRBdDogZGVhbC5kaXNjb3VudEVuZEF0LFxuICAgICAgICAgICAgICBzZWxlY3RlZDogZmFsc2UsXG4gICAgICAgICAgICAgIHB1Ymxpc2hlZDogZmFsc2UsXG4gICAgICAgICAgICAgIG5vdGVzOiBcIlwiLFxuICAgICAgICAgICAgICB5b3V0dWJlVXJsOiBcIlwiLFxuICAgICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgIGZpcnN0U2VlbkF0OiBub3dJc28sXG4gICAgICAgICAgICAgIGxhc3RTZWVuQXQ6IG5vd0lzbyxcbiAgICAgICAgICAgICAgdXBkYXRlZEF0OiBub3dJc28sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ld0NvdW50Kys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0b3JlLnVwc2VydEdhbWUoe1xuICAgICAgICAgICAgICAuLi5leGlzdGluZyxcbiAgICAgICAgICAgICAgbmFtZTogZGVhbC5uYW1lIHx8IGV4aXN0aW5nLm5hbWUsXG4gICAgICAgICAgICAgIGltYWdlVXJsOiBkZWFsLmltYWdlVXJsIHx8IGV4aXN0aW5nLmltYWdlVXJsLFxuICAgICAgICAgICAgICBzdG9yZVVybDogZGVhbC5zdG9yZVVybCB8fCBleGlzdGluZy5zdG9yZVVybCxcbiAgICAgICAgICAgICAgcGxhdGZvcm1zOiBkZWFsLmhhcmR3YXJlUGxhdGZvcm1zLFxuICAgICAgICAgICAgICBjdXJyZW5jeTogZGVhbC5jdXJyZW5jeSxcbiAgICAgICAgICAgICAgcHJpY2VPcmlnaW5hbENlbnRzOiBkZWFsLnByaWNlT3JpZ2luYWxDZW50cyxcbiAgICAgICAgICAgICAgcHJpY2VEaXNjb3VudGVkQ2VudHM6IGRlYWwucHJpY2VEaXNjb3VudGVkQ2VudHMsXG4gICAgICAgICAgICAgIGRpc2NvdW50UGVyY2VudDogZGVhbC5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IGRlYWwuZGlzY291bnRFbmRBdCxcbiAgICAgICAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgICBsYXN0U2VlbkF0OiBub3dJc28sXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogbm93SXNvLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1cGRhdGVkKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGlzYXBwZWFyZWQgPSBzdG9yZS5tYXJrSW5hY3RpdmVJZk1pc3NpbmcoXG4gICAgICAgICAgc2VlbktleXMsXG4gICAgICAgICAgc291cmNlLnBsYXRmb3JtLFxuICAgICAgICAgIHNvdXJjZS5yZWdpb25cbiAgICAgICAgKTtcblxuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHBsYXRmb3JtOiBzb3VyY2UucGxhdGZvcm0sXG4gICAgICAgICAgcmVnaW9uOiBzb3VyY2UucmVnaW9uLFxuICAgICAgICAgIG5ld0NvdW50LFxuICAgICAgICAgIHVwZGF0ZWQsXG4gICAgICAgICAgZGlzYXBwZWFyZWQsXG4gICAgICAgICAgdG90YWxTZWVuLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc3QgZXJyTXNnID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFske3NvdXJjZS5wbGF0Zm9ybX0vJHtzb3VyY2UucmVnaW9ufV0gRXJyb3I6ICR7ZXJyTXNnfWApO1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHBsYXRmb3JtOiBzb3VyY2UucGxhdGZvcm0sXG4gICAgICAgICAgcmVnaW9uOiBzb3VyY2UucmVnaW9uLFxuICAgICAgICAgIG5ld0NvdW50OiAwLFxuICAgICAgICAgIHVwZGF0ZWQ6IDAsXG4gICAgICAgICAgZGlzYXBwZWFyZWQ6IDAsXG4gICAgICAgICAgdG90YWxTZWVuOiAwLFxuICAgICAgICAgIGVycm9yOiBlcnJNc2csXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlY29tcHV0ZU1hdGNoZXMoKTtcbiAgICAvLyBEaWZmIHdhdGNobGlzdCBmb3IgUFNOIHNvdXJjZXNcbiAgICBjb25zdCBwc25TZWVuSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBnIG9mIHN0b3JlLmxpc3RHYW1lcygpKSB7XG4gICAgICBpZiAoZy5hY3RpdmUgJiYgZy5wbGF0Zm9ybSA9PT0gXCJwc25cIikgcHNuU2Vlbklkcy5hZGQoZy5pZCk7XG4gICAgfVxuICAgIGFsbFdhdGNobGlzdEFsZXJ0cyA9IGRpZmZXYXRjaGxpc3QocHNuU2Vlbklkcywgbm93SXNvKTtcblxuICAgIGNvbnN0IHRvdGFsTmV3ID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLm5ld0NvdW50LCAwKTtcbiAgICBjb25zdCB0b3RhbFVwZGF0ZWQgPSByZXN1bHRzLnJlZHVjZSgocywgcikgPT4gcyArIHIudXBkYXRlZCwgMCk7XG4gICAgY29uc3QgdG90YWxEaXNhcHBlYXJlZCA9IHJlc3VsdHMucmVkdWNlKChzLCByKSA9PiBzICsgci5kaXNhcHBlYXJlZCwgMCk7XG4gICAgY29uc3QgdG90YWxTZWVuID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLnRvdGFsU2VlbiwgMCk7XG4gICAgY29uc3QgdG90YWxLZXB0ID0gcmVzdWx0cy5yZWR1Y2UoKHMsIHIpID0+IHMgKyByLnRvdGFsU2VlbiAtIChyLmVycm9yID8gci50b3RhbFNlZW4gOiAwKSwgMCk7XG5cbiAgICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgICAgbmV3OiB0b3RhbE5ldyxcbiAgICAgIHVwZGF0ZWQ6IHRvdGFsVXBkYXRlZCxcbiAgICAgIGRpc2FwcGVhcmVkOiB0b3RhbERpc2FwcGVhcmVkLFxuICAgICAgdG90YWxTZWVuLFxuICAgICAga2VwdDogdG90YWxLZXB0LFxuICAgICAgZmlsdGVyZWRBZGRPbnM6IDAsXG4gICAgICB3YXRjaGxpc3RBbGVydHM6IGFsbFdhdGNobGlzdEFsZXJ0cyxcbiAgICAgIHNvdXJjZVJlc3VsdHM6IHJlc3VsdHMsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIFBlcnNpc3RlZFF1ZXJ5Tm90Rm91bmRFcnJvcikge1xuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAyLCB7XG4gICAgICAgIGVycm9yOiBcInBlcnNpc3RlZF9xdWVyeV9ub3RfZm91bmRcIixcbiAgICAgICAgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UsXG4gICAgICAgIGhpbnQ6XG4gICAgICAgICAgXCJBYnJlIERldlRvb2xzID4gTmV0d29yayBlbiBsYSBwXHUwMEUxZ2luYSBkZSBvZmVydGFzIGRlIFBTIFN0b3JlLCBidXNjYSBsYSBcIiArXG4gICAgICAgICAgXCJyZXF1ZXN0IGEgL2FwaS9ncmFwaHFsL3YxL29wP29wZXJhdGlvbk5hbWU9Y2F0ZWdvcnlHcmlkUmV0cmlldmUgeSBcIiArXG4gICAgICAgICAgXCJhY3R1YWxpemEgZWwgaGFzaCBlbiBBanVzdGVzLlwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IgfHwgZSBpbnN0YW5jZW9mIFByb3ZpZGVyRXJyb3IpIHtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJwcm92aWRlcl9lcnJvclwiLFxuICAgICAgICBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSxcbiAgICAgICAgaGludDpcbiAgICAgICAgICBcIlNpIGVzdG8gY29ycmUgZW4gdW5hIHNhbmRib3ggKEJvbHQvU3RhY2tCbGl0eikgbGEgSVAgcHVlZGUgZXN0YXIgXCIgK1xuICAgICAgICAgIFwiYmxvcXVlYWRhLiBQcm9iXHUwMEUxIGRlc2RlIHR1IG1cdTAwRTFxdWluYSBvIHNlcnZpZG9yLlwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcImludGVybmFsXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gR0VUIC9nYW1lcy9leHBvcnQuY3N2XG4vLyBQYXJhbXM6IG9ubHlfc2VsZWN0ZWQ9dHJ1ZXxmYWxzZSwgZm9ybWF0PXNoZWV0cyAoQk9NICsgc2VtaWNvbG9ucyBmb3IgR29vZ2xlIFNoZWV0cylcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzL2V4cG9ydC5jc3ZcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCB8fCBcIi9cIiwgXCJodHRwOi8veFwiKTtcbiAgY29uc3Qgb25seVNlbGVjdGVkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJvbmx5X3NlbGVjdGVkXCIpICE9PSBcImZhbHNlXCI7XG4gIGNvbnN0IHNoZWV0c0Zvcm1hdCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiZm9ybWF0XCIpID09PSBcInNoZWV0c1wiO1xuICBjb25zdCBzZXAgPSBzaGVldHNGb3JtYXQgPyBcIjtcIiA6IFwiLFwiO1xuXG4gIGxldCBnYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBpZiAob25seVNlbGVjdGVkKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5zZWxlY3RlZCk7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3QgaGVhZGVyID0gW1xuICAgIFwiaWRcIixcbiAgICBcInBsYXRhZm9ybWFcIixcbiAgICBcInJlZ2lvblwiLFxuICAgIFwibW9uZWRhXCIsXG4gICAgXCJuYW1lXCIsXG4gICAgXCJwbGF0Zm9ybXNcIixcbiAgICBcInN0b3JlX3VybFwiLFxuICAgIFwicHJlY2lvX29yaWdpbmFsXCIsXG4gICAgXCJwcmVjaW9fZGVzY3VlbnRvXCIsXG4gICAgXCJkZXNjdWVudG9fcGN0XCIsXG4gICAgXCJmaW5fb2ZlcnRhXCIsXG4gICAgXCJjb3N0b19jbHBcIixcbiAgICBcInByaW1hcmlhX2NscFwiLFxuICAgIFwic2VjdW5kYXJpYV9jbHBcIixcbiAgICBcImluZ3Jlc29fdG90YWxcIixcbiAgICBcImdhbmFuY2lhX25ldGFcIixcbiAgICBcIm1hcmdlbl9wY3RcIixcbiAgICBcIm5vdGFzXCIsXG4gIF07XG5cbiAgY29uc3QgZXNjYXBlID0gKHY6IHVua25vd24pID0+IHtcbiAgICBjb25zdCBzID0gdiA9PSBudWxsID8gXCJcIiA6IFN0cmluZyh2KTtcbiAgICBjb25zdCBuZWVkc1F1b3RlID0gcy5pbmNsdWRlcyhzZXApIHx8IHMuaW5jbHVkZXMoJ1wiJykgfHwgcy5pbmNsdWRlcyhcIlxcblwiKTtcbiAgICByZXR1cm4gbmVlZHNRdW90ZSA/IGBcIiR7cy5yZXBsYWNlKC9cIi9nLCAnXCJcIicpfVwiYCA6IHM7XG4gIH07XG5cbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgY29uc3QgbWV0YWRhdGEgPSBzaGVldHNGb3JtYXRcbiAgICA/IGAjIEV4cG9ydGFkbzogJHtub3d9IFx1MDBCNyBUQyBVU0Q6ICR7Y2ZnLnVzZFRvQ2xwfSBcdTAwQjcgRGVzY3VlbnRvIHNhbGRvIFVTRDogJHtjZmcuYmFsYW5jZURpc2NvdW50VXNkfVxcbmBcbiAgICA6IFwiXCI7XG5cbiAgY29uc3QgbGluZXMgPSBbaGVhZGVyLmpvaW4oc2VwKV07XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmcsIGcuY3VycmVuY3kgfHwgXCJVU0RcIik7XG4gICAgY29uc3QgY29zdCA9IHNhbGU/LmNvc3RDbHAgPz8gbnVsbDtcbiAgICBjb25zdCBtYXJnZW4gPSBjb3N0ICYmIHNhbGU/Lm5ldFByb2ZpdFxuICAgICAgPyBNYXRoLnJvdW5kKChzYWxlLm5ldFByb2ZpdCAvIGNvc3QpICogMTAwKVxuICAgICAgOiBcIlwiO1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBbXG4gICAgICAgIGcuaWQsXG4gICAgICAgIGcucGxhdGZvcm0gfHwgXCJwc25cIixcbiAgICAgICAgZy5yZWdpb24gfHwgXCJ1c1wiLFxuICAgICAgICBnLmN1cnJlbmN5IHx8IFwiVVNEXCIsXG4gICAgICAgIGcubmFtZSxcbiAgICAgICAgZy5wbGF0Zm9ybXMsXG4gICAgICAgIGcuc3RvcmVVcmwgPz8gXCJcIixcbiAgICAgICAgZy5wcmljZU9yaWdpbmFsQ2VudHMgIT0gbnVsbCA/IChnLnByaWNlT3JpZ2luYWxDZW50cyAvIDEwMCkudG9GaXhlZCgyKSA6IFwiXCIsXG4gICAgICAgIGcucHJpY2VEaXNjb3VudGVkQ2VudHMgIT0gbnVsbCA/IChnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwKS50b0ZpeGVkKDIpIDogXCJcIixcbiAgICAgICAgZy5kaXNjb3VudFBlcmNlbnQsXG4gICAgICAgIGcuZGlzY291bnRFbmRBdCA/PyBcIlwiLFxuICAgICAgICBjb3N0ID8/IFwiXCIsXG4gICAgICAgIHNhbGU/LnByaW1hcmlhID8/IFwiXCIsXG4gICAgICAgIHNhbGU/LnNlY3VuZGFyaWEgPz8gXCJcIixcbiAgICAgICAgc2FsZT8udG90YWxSZXZlbnVlID8/IFwiXCIsXG4gICAgICAgIHNhbGU/Lm5ldFByb2ZpdCA/PyBcIlwiLFxuICAgICAgICBtYXJnZW4sXG4gICAgICAgIGcubm90ZXMsXG4gICAgICBdXG4gICAgICAgIC5tYXAoZXNjYXBlKVxuICAgICAgICAuam9pbihzZXApXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBtZXRhZGF0YSArIGxpbmVzLmpvaW4oXCJcXG5cIik7XG4gIGNvbnN0IGJvbSA9IHNoZWV0c0Zvcm1hdCA/IFwiXHVGRUZGXCIgOiBcIlwiO1xuXG4gIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwidGV4dC9jc3Y7IGNoYXJzZXQ9dXRmLThcIik7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LWRpc3Bvc2l0aW9uXCIsICdhdHRhY2htZW50OyBmaWxlbmFtZT1cImFwaXBzbi1nYW1lcy5jc3ZcIicpO1xuICByZXMuZW5kKGJvbSArIGNvbnRlbnQpO1xufSk7XG5cbi8vIEdFVCAvZ2FtZXMvZXhwb3J0LXN1cGFiYXNlLmNzdiBcdTIwMTQgQ1NWIG1hdGNoaW5nIHRoZSBTdXBhYmFzZSBwcm9kdWN0cyB0YWJsZSBzY2hlbWEgZXhhY3RseVxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvZXhwb3J0LXN1cGFiYXNlLmNzdlwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBvbmx5U2VsZWN0ZWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcIm9ubHlfc2VsZWN0ZWRcIikgIT09IFwiZmFsc2VcIjtcbiAgY29uc3QgcGxhdGZvcm1GaWx0ZXIgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInBsYXRmb3JtXCIpIHx8IFwiXCI7XG5cbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG4gIGlmIChvbmx5U2VsZWN0ZWQpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnNlbGVjdGVkKTtcbiAgaWYgKHBsYXRmb3JtRmlsdGVyKSBnYW1lcyA9IGdhbWVzLmZpbHRlcigoZykgPT4gZy5wbGF0Zm9ybSA9PT0gcGxhdGZvcm1GaWx0ZXIpO1xuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuXG4gIGNvbnN0IGhlYWRlciA9IFtcbiAgICBcInNrdVwiLFxuICAgIFwiZGlzcGxheV9uYW1lXCIsXG4gICAgXCJpbWFnZXNcIixcbiAgICBcInBsYXRmb3JtX2F2YWlsYWJpbGl0eVwiLFxuICAgIFwicHJpY2luZ19ieV9wbGF0Zm9ybV9hbmRfYWNjb3VudFwiLFxuICAgIFwic3RvY2tfcXVhbnRpdHlcIixcbiAgICBcImlzX2FjdGl2ZVwiLFxuICAgIFwic29ydF9vcmRlclwiLFxuICBdO1xuXG4gIGNvbnN0IGVzY2FwZSA9ICh2OiB1bmtub3duKSA9PiB7XG4gICAgY29uc3QgcyA9IHYgPT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcodik7XG4gICAgY29uc3QgbmVlZHNRdW90ZSA9IHMuaW5jbHVkZXMoXCIsXCIpIHx8IHMuaW5jbHVkZXMoJ1wiJykgfHwgcy5pbmNsdWRlcyhcIlxcblwiKTtcbiAgICByZXR1cm4gbmVlZHNRdW90ZSA/IGBcIiR7cy5yZXBsYWNlKC9cIi9nLCAnXCJcIicpfVwiYCA6IHM7XG4gIH07XG5cbiAgY29uc3QgbGluZXMgPSBbaGVhZGVyLmpvaW4oXCIsXCIpXTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgY29uc3Qgc2FsZSA9IGNvbXB1dGVTYWxlUHJpY2VzKGcucHJpY2VEaXNjb3VudGVkQ2VudHMsIGNmZywgZy5jdXJyZW5jeSB8fCBcIlVTRFwiKTtcbiAgICBjb25zdCBkZXRhaWwgPSBzdG9yZS5nZXRQcm9kdWN0RGV0YWlsKGcuaWQpO1xuXG4gICAgLy8gU0tVOiBQUy1TTFVHLTAwMVxuICAgIGNvbnN0IHNsdWcgPSBnLm5hbWVcbiAgICAgIC50b1VwcGVyQ2FzZSgpXG4gICAgICAucmVwbGFjZSgvW15BLVowLTlcXHNdL2csIFwiXCIpXG4gICAgICAudHJpbSgpXG4gICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgLnNsaWNlKDAsIDQpXG4gICAgICAuam9pbihcIi1cIik7XG4gICAgY29uc3Qgc2t1ID0gYFBTLSR7c2x1Z30tMDAxYDtcblxuICAgIC8vIEltYWdlczogW3thbHQsIHVybH1dIFx1MjAxNCBwb3J0cmFpdCAoYm94IGFydCkgZmlyc3QsIHRoZW4gY2Fyb3VzZWwvc2NyZWVuc2hvdHNcbiAgICBjb25zdCBpbWFnZXM6IEFycmF5PHsgYWx0OiBzdHJpbmc7IHVybDogc3RyaW5nIH0+ID0gW107XG4gICAgY29uc3QgcG9ydHJhaXRVcmwgPSBkZXRhaWw/Lm1lZGlhPy5wb3J0cmFpdFVybCA/PyBnLmltYWdlVXJsO1xuICAgIGlmIChwb3J0cmFpdFVybCkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBwb3J0cmFpdFVybCB9KTtcbiAgICBjb25zdCBjb3ZlclVybCA9IGRldGFpbD8ubWVkaWE/LmNvdmVyVXJsO1xuICAgIGlmIChjb3ZlclVybCAmJiBjb3ZlclVybCAhPT0gcG9ydHJhaXRVcmwpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogY292ZXJVcmwgfSk7XG4gICAgaWYgKGRldGFpbD8uY2Fyb3VzZWxJbWFnZXMpIHtcbiAgICAgIGZvciAoY29uc3QgaW1nIG9mIGRldGFpbC5jYXJvdXNlbEltYWdlcykge1xuICAgICAgICBpZiAoIWltYWdlcy5zb21lKCh4KSA9PiB4LnVybCA9PT0gaW1nKSkgaW1hZ2VzLnB1c2goeyBhbHQ6IGcubmFtZSwgdXJsOiBpbWcgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChkZXRhaWw/Lm1lZGlhPy5zY3JlZW5zaG90cykge1xuICAgICAgZm9yIChjb25zdCBpbWcgb2YgZGV0YWlsLm1lZGlhLnNjcmVlbnNob3RzKSB7XG4gICAgICAgIGlmICghaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBpbWcpKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGltZyB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQbGF0Zm9ybSBhdmFpbGFiaWxpdHk6IHtQUzQ6IHRydWUsIFBTNTogdHJ1ZX1cbiAgICBjb25zdCBod1BsYXRmb3JtcyA9IChnLnBsYXRmb3JtcyB8fCBcIlwiKVxuICAgICAgLnNwbGl0KFwiLFwiKVxuICAgICAgLm1hcCgocCkgPT4gcC50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IHBsYXRmb3JtQXZhaWxhYmlsaXR5OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3JtcykgcGxhdGZvcm1BdmFpbGFiaWxpdHlbcF0gPSB0cnVlO1xuXG4gICAgLy8gUHJpY2luZzogcGVyIGhhcmR3YXJlIHBsYXRmb3JtIFx1MDBENyBhY2NvdW50IHR5cGVcbiAgICBjb25zdCBwcmltYXJpYSA9IHNhbGU/LnByaW1hcmlhID8/IG51bGw7XG4gICAgY29uc3Qgc2VjdW5kYXJpYSA9IHNhbGU/LnNlY3VuZGFyaWEgPz8gbnVsbDtcbiAgICBjb25zdCBwcmljaW5nOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBudW1iZXIgfCBudWxsPj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgaHdQbGF0Zm9ybXMubGVuZ3RoID8gaHdQbGF0Zm9ybXMgOiBbXCJQUzRcIl0pIHtcbiAgICAgIHByaWNpbmdbcF0gPSB7XG4gICAgICAgIFByaW1hcmlhOiBwcmltYXJpYSxcbiAgICAgICAgU2VjdW5kYXJpYTogc2VjdW5kYXJpYSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGluZXMucHVzaChcbiAgICAgIFtcbiAgICAgICAgc2t1LFxuICAgICAgICBnLm5hbWUsXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KGltYWdlcyksXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHBsYXRmb3JtQXZhaWxhYmlsaXR5KSxcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkocHJpY2luZyksXG4gICAgICAgIDAsXG4gICAgICAgIHRydWUsXG4gICAgICAgIDAsXG4gICAgICBdXG4gICAgICAgIC5tYXAoZXNjYXBlKVxuICAgICAgICAuam9pbihcIixcIilcbiAgICApO1xuICB9XG5cbiAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJ0ZXh0L2NzdjsgY2hhcnNldD11dGYtOFwiKTtcbiAgcmVzLnNldEhlYWRlcihcImNvbnRlbnQtZGlzcG9zaXRpb25cIiwgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPVwiYXBpcHNuLXN1cGFiYXNlLmNzdlwiJyk7XG4gIHJlcy5lbmQobGluZXMuam9pbihcIlxcblwiKSk7XG59KTtcblxuLy8gR0VUIC9nYW1lcy9leHBvcnQuanNvbiBcdTIwMTQgU3VwYWJhc2UtcmVhZHkgSlNPTiBleHBvcnQgd2l0aCBlbnJpY2hlZCBwcm9kdWN0IGRldGFpbHNcbi8vIFBhcmFtczogb25seV9zZWxlY3RlZD10cnVlfGZhbHNlLCBwbGF0Zm9ybT1wc258eGJveHwuLi4sIGVucmljaD10cnVlIChpbmNsdWRlIHByb2R1Y3QgZGV0YWlsIGlmIGNhY2hlZClcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzL2V4cG9ydC5qc29uXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IG9ubHlTZWxlY3RlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9zZWxlY3RlZFwiKSAhPT0gXCJmYWxzZVwiO1xuICBjb25zdCBlbnJpY2ggPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcImVucmljaFwiKSAhPT0gXCJmYWxzZVwiO1xuICBjb25zdCBwbGF0Zm9ybUZpbHRlciA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwicGxhdGZvcm1cIikgfHwgXCJcIjtcblxuICBsZXQgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgaWYgKG9ubHlTZWxlY3RlZCkgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IGcuc2VsZWN0ZWQpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnBsYXRmb3JtID09PSBwbGF0Zm9ybUZpbHRlcik7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3Qgcm93cyA9IGdhbWVzLm1hcCgoZykgPT4ge1xuICAgIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmcsIGcuY3VycmVuY3kgfHwgXCJVU0RcIik7XG4gICAgY29uc3QgZGV0YWlsID0gZW5yaWNoID8gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBkYktleSA9IGAke2cucGxhdGZvcm19OiR7Zy5yZWdpb259OiR7Zy5pZH1gO1xuICAgIGNvbnN0IG1hdGNoZXMgPSBzdG9yZS5nZXRDb21wZXRpdG9yTWF0Y2hlcyhkYktleSkgfHwgc3RvcmUuZ2V0Q29tcGV0aXRvck1hdGNoZXMoZy5pZCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLy8gQ29yZSBpZGVudGlmaWNhdGlvblxuICAgICAgaWQ6IGcuaWQsXG4gICAgICBkYl9rZXk6IGRiS2V5LFxuICAgICAgcGxhdGZvcm06IGcucGxhdGZvcm0sXG4gICAgICByZWdpb246IGcucmVnaW9uLFxuICAgICAgY3VycmVuY3k6IGcuY3VycmVuY3kgfHwgXCJVU0RcIixcblxuICAgICAgLy8gQmFzaWMgaW5mb1xuICAgICAgbmFtZTogZy5uYW1lLFxuICAgICAgaW1hZ2VfdXJsOiBnLmltYWdlVXJsLFxuICAgICAgc3RvcmVfdXJsOiBnLnN0b3JlVXJsLFxuICAgICAgaGFyZHdhcmVfcGxhdGZvcm1zOiBnLnBsYXRmb3JtcyxcblxuICAgICAgLy8gUHJpY2luZ1xuICAgICAgcHJpY2Vfb3JpZ2luYWw6IGcucHJpY2VPcmlnaW5hbENlbnRzICE9IG51bGwgPyBnLnByaWNlT3JpZ2luYWxDZW50cyAvIDEwMCA6IG51bGwsXG4gICAgICBwcmljZV9kaXNjb3VudGVkOiBnLnByaWNlRGlzY291bnRlZENlbnRzICE9IG51bGwgPyBnLnByaWNlRGlzY291bnRlZENlbnRzIC8gMTAwIDogbnVsbCxcbiAgICAgIGRpc2NvdW50X3BlcmNlbnQ6IGcuZGlzY291bnRQZXJjZW50LFxuICAgICAgZGlzY291bnRfZW5kX2F0OiBnLmRpc2NvdW50RW5kQXQgfHwgZGV0YWlsPy5kaXNjb3VudEVuZEF0IHx8IG51bGwsXG5cbiAgICAgIC8vIENMUCBwcmljaW5nXG4gICAgICBjb3N0X2NscDogc2FsZT8uY29zdENscCA/PyBudWxsLFxuICAgICAgcHJpbWFyaWFfY2xwOiBzYWxlPy5wcmltYXJpYSA/PyBudWxsLFxuICAgICAgc2VjdW5kYXJpYV9jbHA6IHNhbGU/LnNlY3VuZGFyaWEgPz8gbnVsbCxcblxuICAgICAgLy8gRW5yaWNoZWQgZGV0YWlsIChmcm9tIHByb2R1Y3QgcGFnZSBzY3JhcGUpXG4gICAgICBkZXNjcmlwdGlvbjogZGV0YWlsPy5kZXNjcmlwdGlvbiA/PyBudWxsLFxuICAgICAgc2hvcnRfZGVzY3JpcHRpb246IGRldGFpbD8uc2hvcnREZXNjcmlwdGlvbiA/PyBudWxsLFxuICAgICAgcHVibGlzaGVyOiBkZXRhaWw/LnB1Ymxpc2hlciA/PyBudWxsLFxuICAgICAgZGV2ZWxvcGVyOiBkZXRhaWw/LmRldmVsb3BlciA/PyBudWxsLFxuICAgICAgcmVsZWFzZV9kYXRlOiBkZXRhaWw/LnJlbGVhc2VEYXRlID8/IG51bGwsXG4gICAgICBnZW5yZXM6IGRldGFpbD8uZ2VucmVzID8/IFtdLFxuICAgICAgYWdlX3JhdGluZzogZGV0YWlsPy5hZ2VSYXRpbmcgPz8gbnVsbCxcbiAgICAgIGNvbnRlbnRfZGVzY3JpcHRvcnM6IGRldGFpbD8uY29udGVudERlc2NyaXB0b3JzID8/IFtdLFxuICAgICAgaW50ZXJhY3RpdmVfZWxlbWVudHM6IGRldGFpbD8uaW50ZXJhY3RpdmVFbGVtZW50cyA/PyBbXSxcbiAgICAgIHBsYXllcl9jb3VudDogZGV0YWlsPy5wbGF5ZXJDb3VudCA/PyBudWxsLFxuICAgICAgb25saW5lX3BsYXllcl9jb3VudDogZGV0YWlsPy5vbmxpbmVQbGF5ZXJDb3VudCA/PyBudWxsLFxuICAgICAgcHNfcGx1c19yZXF1aXJlZDogZGV0YWlsPy5wc1BsdXNSZXF1aXJlZCA/PyBmYWxzZSxcbiAgICAgIGluX2dhbWVfcHVyY2hhc2VzOiBkZXRhaWw/LmluR2FtZVB1cmNoYXNlcyA/PyBudWxsLFxuICAgICAgZ2FtZV9mZWF0dXJlczogZGV0YWlsPy5nYW1lRmVhdHVyZXMgPz8gW10sXG4gICAgICBwc192ZXJzaW9uOiBkZXRhaWw/LnBzVmVyc2lvbiA/PyBudWxsLFxuICAgICAgZmlsZV9zaXplOiBkZXRhaWw/LmZpbGVTaXplID8/IG51bGwsXG4gICAgICB2b2ljZV9sYW5ndWFnZXM6IGRldGFpbD8udm9pY2VMYW5ndWFnZXMgPz8gW10sXG4gICAgICBzdWJ0aXRsZV9sYW5ndWFnZXM6IGRldGFpbD8uc3VidGl0bGVMYW5ndWFnZXMgPz8gW10sXG5cbiAgICAgIC8vIE1lZGlhXG4gICAgICBwb3J0cmFpdF91cmw6IGRldGFpbD8ubWVkaWE/LnBvcnRyYWl0VXJsID8/IGcuaW1hZ2VVcmwsXG4gICAgICBjb3Zlcl91cmw6IGRldGFpbD8ubWVkaWE/LmNvdmVyVXJsID8/IG51bGwsXG4gICAgICBoZXJvX3VybDogZGV0YWlsPy5tZWRpYT8uaGVyb1VybCA/PyBudWxsLFxuICAgICAgc2NyZWVuc2hvdHM6IGRldGFpbD8ubWVkaWE/LnNjcmVlbnNob3RzID8/IFtdLFxuICAgICAgY2Fyb3VzZWxfaW1hZ2VzOiBkZXRhaWw/LmNhcm91c2VsSW1hZ2VzID8/IFtdLFxuICAgICAgdmlkZW9zOiBkZXRhaWw/Lm1lZGlhPy52aWRlb3MgPz8gW10sXG5cbiAgICAgIC8vIENvbXBldGl0aW9uXG4gICAgICBtYXJrZXRfbWluX2NscDogbWF0Y2hlcy5sZW5ndGggPyBNYXRoLm1pbiguLi5tYXRjaGVzLm1hcCgobSkgPT4gbS5wcmljZUNscCkpIDogbnVsbCxcbiAgICAgIG1hcmtldF9jb3VudDogbWF0Y2hlcy5sZW5ndGgsXG5cbiAgICAgIC8vIFN0YXR1c1xuICAgICAgc2VsZWN0ZWQ6IGcuc2VsZWN0ZWQsXG4gICAgICBwdWJsaXNoZWQ6IGcucHVibGlzaGVkLFxuICAgICAgbm90ZXM6IGcubm90ZXMsXG4gICAgICBhY3RpdmU6IGcuYWN0aXZlLFxuICAgICAgZmlyc3Rfc2Vlbl9hdDogZy5maXJzdFNlZW5BdCxcbiAgICAgIGxhc3Rfc2Vlbl9hdDogZy5sYXN0U2VlbkF0LFxuICAgIH07XG4gIH0pO1xuXG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGdhbWVzOiByb3dzLCBleHBvcnRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCBjb3VudDogcm93cy5sZW5ndGggfSk7XG59KTtcblxuLy8gR0VUIC9nYW1lcy9leHBvcnQtc3VwYWJhc2UgXHUyMDE0IGV4cG9ydCBzZWxlY3RlZCBnYW1lcyBmb3JtYXR0ZWQgZm9yIHRoZSBTdXBhYmFzZSBwcm9kdWN0cyB0YWJsZVxucm91dGUoXCJHRVRcIiwgXCIvZ2FtZXMvZXhwb3J0LXN1cGFiYXNlXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgXCIvXCIsIFwiaHR0cDovL3hcIik7XG4gIGNvbnN0IG9ubHlTZWxlY3RlZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwib25seV9zZWxlY3RlZFwiKSAhPT0gXCJmYWxzZVwiO1xuICBjb25zdCBwbGF0Zm9ybUZpbHRlciA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwicGxhdGZvcm1cIikgfHwgXCJcIjtcblxuICBsZXQgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgaWYgKG9ubHlTZWxlY3RlZCkgZ2FtZXMgPSBnYW1lcy5maWx0ZXIoKGcpID0+IGcuc2VsZWN0ZWQpO1xuICBpZiAocGxhdGZvcm1GaWx0ZXIpIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBnLnBsYXRmb3JtID09PSBwbGF0Zm9ybUZpbHRlcik7XG4gIGNvbnN0IGNmZyA9IHN0b3JlLmdldFNldHRpbmdzKCk7XG5cbiAgY29uc3Qgcm93cyA9IGdhbWVzLm1hcCgoZykgPT4ge1xuICAgIGNvbnN0IHNhbGUgPSBjb21wdXRlU2FsZVByaWNlcyhnLnByaWNlRGlzY291bnRlZENlbnRzLCBjZmcsIGcuY3VycmVuY3kgfHwgXCJVU0RcIik7XG4gICAgY29uc3QgZGV0YWlsID0gc3RvcmUuZ2V0UHJvZHVjdERldGFpbChnLmlkKTtcblxuICAgIGNvbnN0IHNsdWcgPSBnLm5hbWVcbiAgICAgIC50b1VwcGVyQ2FzZSgpXG4gICAgICAucmVwbGFjZSgvW15BLVowLTlcXHNdL2csIFwiXCIpXG4gICAgICAudHJpbSgpXG4gICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgLnNsaWNlKDAsIDQpXG4gICAgICAuam9pbihcIi1cIik7XG4gICAgY29uc3Qgc2t1ID0gYFBTLSR7c2x1Z30tMDAxYDtcblxuICAgIGNvbnN0IGh3UGxhdGZvcm1zID0gKGcucGxhdGZvcm1zIHx8IFwiXCIpXG4gICAgICAuc3BsaXQoXCIsXCIpXG4gICAgICAubWFwKChwKSA9PiBwLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgY29uc3QgcGxhdGZvcm1BdmFpbGFiaWxpdHk6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG4gICAgZm9yIChjb25zdCBwIG9mIGh3UGxhdGZvcm1zKSBwbGF0Zm9ybUF2YWlsYWJpbGl0eVtwXSA9IHRydWU7XG5cbiAgICBjb25zdCBpbWFnZXM6IEFycmF5PHsgYWx0OiBzdHJpbmc7IHVybDogc3RyaW5nIH0+ID0gW107XG4gICAgY29uc3QgcG9ydHJhaXRVcmwyID0gZGV0YWlsPy5tZWRpYT8ucG9ydHJhaXRVcmwgPz8gZy5pbWFnZVVybDtcbiAgICBpZiAocG9ydHJhaXRVcmwyKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IHBvcnRyYWl0VXJsMiB9KTtcbiAgICBjb25zdCBjb3ZlclVybDIgPSBkZXRhaWw/Lm1lZGlhPy5jb3ZlclVybDtcbiAgICBpZiAoY292ZXJVcmwyICYmIGNvdmVyVXJsMiAhPT0gcG9ydHJhaXRVcmwyKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGNvdmVyVXJsMiB9KTtcbiAgICBpZiAoZGV0YWlsPy5jYXJvdXNlbEltYWdlcykge1xuICAgICAgZm9yIChjb25zdCBpbWcgb2YgZGV0YWlsLmNhcm91c2VsSW1hZ2VzKSB7XG4gICAgICAgIGlmICghaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBpbWcpKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGltZyB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGRldGFpbD8ubWVkaWE/LnNjcmVlbnNob3RzKSB7XG4gICAgICBmb3IgKGNvbnN0IGltZyBvZiBkZXRhaWwubWVkaWEuc2NyZWVuc2hvdHMpIHtcbiAgICAgICAgaWYgKCFpbWFnZXMuc29tZSgoeCkgPT4geC51cmwgPT09IGltZykpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogaW1nIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHByaW1hcmlhID0gc2FsZT8ucHJpbWFyaWEgPz8gbnVsbDtcbiAgICBjb25zdCBzZWN1bmRhcmlhID0gc2FsZT8uc2VjdW5kYXJpYSA/PyBudWxsO1xuICAgIGNvbnN0IHByaWNpbmc6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IG51bGw+PiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3Jtcy5sZW5ndGggPyBod1BsYXRmb3JtcyA6IFtcIlBTNFwiXSkge1xuICAgICAgcHJpY2luZ1twXSA9IHsgUHJpbWFyaWE6IHByaW1hcmlhLCBTZWN1bmRhcmlhOiBzZWN1bmRhcmlhIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNrdSxcbiAgICAgIGRpc3BsYXlfbmFtZTogZy5uYW1lLFxuICAgICAgaW1hZ2VzLFxuICAgICAgcGxhdGZvcm1fYXZhaWxhYmlsaXR5OiBwbGF0Zm9ybUF2YWlsYWJpbGl0eSxcbiAgICAgIHByaWNpbmdfYnlfcGxhdGZvcm1fYW5kX2FjY291bnQ6IHByaWNpbmcsXG4gICAgICBzdG9ja19xdWFudGl0eTogMCxcbiAgICAgIGlzX2FjdGl2ZTogdHJ1ZSxcbiAgICAgIHNvcnRfb3JkZXI6IDAsXG4gICAgfTtcbiAgfSk7XG5cbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcm93cywgZXhwb3J0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSwgY291bnQ6IHJvd3MubGVuZ3RoIH0pO1xufSk7XG5cbi8vIFBPU1QgL2dhbWVzL3B1Ymxpc2gtc3VwYWJhc2UgXHUyMDE0IHVwc2VydCBzZWxlY3RlZCBnYW1lcyBkaXJlY3RseSB0byBTdXBhYmFzZVxucm91dGUoXCJQT1NUXCIsIFwiL2dhbWVzL3B1Ymxpc2gtc3VwYWJhc2VcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IHN1cGFiYXNlQ2ZnID0gc3RvcmUuZ2V0U3VwYWJhc2UoKTtcbiAgaWYgKCFzdXBhYmFzZUNmZz8udXJsIHx8ICFzdXBhYmFzZUNmZz8uc2VydmljZUtleSkge1xuICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwge1xuICAgICAgZXJyb3I6IFwic3VwYWJhc2Vfbm90X2NvbmZpZ3VyZWRcIixcbiAgICAgIG1lc3NhZ2U6IFwiQ29uZmlndXJhIFN1cGFiYXNlIFVSTCB5IFNlcnZpY2UgS2V5IGVuIEFqdXN0ZXMgYW50ZXMgZGUgcHVibGljYXIuXCIsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgaWRzPzogc3RyaW5nW10gfTtcbiAgbGV0IGdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCkuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSAmJiBnLnNlbGVjdGVkKTtcbiAgaWYgKGJvZHkuaWRzPy5sZW5ndGgpIHtcbiAgICBjb25zdCBpZFNldCA9IG5ldyBTZXQoYm9keS5pZHMpO1xuICAgIGdhbWVzID0gZ2FtZXMuZmlsdGVyKChnKSA9PiBpZFNldC5oYXMoZ2FtZURiS2V5KGcpKSk7XG4gIH1cblxuICBpZiAoZ2FtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcIm5vX2dhbWVzXCIsIG1lc3NhZ2U6IFwiTm8gaGF5IGp1ZWdvcyBzZWxlY2Npb25hZG9zIHBhcmEgcHVibGljYXIuXCIgfSk7XG4gIH1cblxuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBjb25zdCB0YWJsZU5hbWUgPSBzdXBhYmFzZUNmZy50YWJsZU5hbWUgfHwgXCJwbGF5c3RhdGlvbl9nYW1lc1wiO1xuXG4gIGNvbnN0IHJvd3MgPSBnYW1lcy5tYXAoKGcpID0+IHtcbiAgICBjb25zdCBzYWxlID0gY29tcHV0ZVNhbGVQcmljZXMoZy5wcmljZURpc2NvdW50ZWRDZW50cywgY2ZnLCBnLmN1cnJlbmN5IHx8IFwiVVNEXCIpO1xuICAgIGNvbnN0IGRldGFpbCA9IHN0b3JlLmdldFByb2R1Y3REZXRhaWwoZy5pZCk7XG5cbiAgICBjb25zdCBod1BsYXRmb3JtcyA9IChnLnBsYXRmb3JtcyB8fCBcIlwiKVxuICAgICAgLnNwbGl0KFwiLFwiKVxuICAgICAgLm1hcCgocCkgPT4gcC50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IHBsYXRmb3JtQXZhaWxhYmlsaXR5OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBod1BsYXRmb3JtcykgcGxhdGZvcm1BdmFpbGFiaWxpdHlbcF0gPSB0cnVlO1xuXG4gICAgY29uc3QgaW1hZ2VzOiBBcnJheTx7IGFsdDogc3RyaW5nOyB1cmw6IHN0cmluZyB9PiA9IFtdO1xuICAgIGNvbnN0IHBvcnRyYWl0VXJsID0gZGV0YWlsPy5tZWRpYT8ucG9ydHJhaXRVcmwgPz8gZy5pbWFnZVVybDtcbiAgICBpZiAocG9ydHJhaXRVcmwpIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogcG9ydHJhaXRVcmwgfSk7XG4gICAgaWYgKGRldGFpbD8ubWVkaWE/LmNvdmVyVXJsICYmIGRldGFpbC5tZWRpYS5jb3ZlclVybCAhPT0gcG9ydHJhaXRVcmwpIHtcbiAgICAgIGltYWdlcy5wdXNoKHsgYWx0OiBnLm5hbWUsIHVybDogZGV0YWlsLm1lZGlhLmNvdmVyVXJsIH0pO1xuICAgIH1cbiAgICBpZiAoZGV0YWlsPy5jYXJvdXNlbEltYWdlcykge1xuICAgICAgZm9yIChjb25zdCBpbWcgb2YgZGV0YWlsLmNhcm91c2VsSW1hZ2VzKSB7XG4gICAgICAgIGlmICghaW1hZ2VzLnNvbWUoKHgpID0+IHgudXJsID09PSBpbWcpKSBpbWFnZXMucHVzaCh7IGFsdDogZy5uYW1lLCB1cmw6IGltZyB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwcmltYXJpYSA9IHNhbGU/LnByaW1hcmlhID8/IG51bGw7XG4gICAgY29uc3Qgc2VjdW5kYXJpYSA9IHNhbGU/LnNlY3VuZGFyaWEgPz8gbnVsbDtcbiAgICBjb25zdCBwcmljaW5nOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBudW1iZXIgfCBudWxsPj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgaHdQbGF0Zm9ybXMubGVuZ3RoID8gaHdQbGF0Zm9ybXMgOiBbXCJQUzRcIl0pIHtcbiAgICAgIHByaWNpbmdbcF0gPSB7IFByaW1hcmlhOiBwcmltYXJpYSwgU2VjdW5kYXJpYTogc2VjdW5kYXJpYSB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBza3U6IGdlbmVyYXRlU2t1KGcubmFtZSksXG4gICAgICBkaXNwbGF5X25hbWU6IGcubmFtZSxcbiAgICAgIGltYWdlcyxcbiAgICAgIHBsYXRmb3JtX2F2YWlsYWJpbGl0eTogcGxhdGZvcm1BdmFpbGFiaWxpdHksXG4gICAgICBwcmljaW5nX2J5X3BsYXRmb3JtX2FuZF9hY2NvdW50OiBwcmljaW5nLFxuICAgICAgc3RvY2tfcXVhbnRpdHk6IDAsXG4gICAgICBpc19hY3RpdmU6IHRydWUsXG4gICAgICBzb3J0X29yZGVyOiAwLFxuICAgIH07XG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgZW5kcG9pbnQgPSBgJHtzdXBhYmFzZUNmZy51cmx9L3Jlc3QvdjEvJHt0YWJsZU5hbWV9P29uX2NvbmZsaWN0PXNrdWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgYXBpa2V5OiBzdXBhYmFzZUNmZy5zZXJ2aWNlS2V5LFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7c3VwYWJhc2VDZmcuc2VydmljZUtleX1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgUHJlZmVyOiBcInJlc29sdXRpb249bWVyZ2UtZHVwbGljYXRlc1wiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJvd3MpLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJzdXBhYmFzZV9lcnJvclwiLFxuICAgICAgICBtZXNzYWdlOiBgU3VwYWJhc2UgcmVzcG9uZGlcdTAwRjMgJHtyZXNwb25zZS5zdGF0dXN9OiAke3RleHQuc2xpY2UoMCwgMzAwKX1gLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTWFyayBnYW1lcyBhcyBwdWJsaXNoZWQgbG9jYWxseVxuICAgIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgICAgc3RvcmUucGF0Y2hHYW1lKGdhbWVEYktleShnKSwgeyBwdWJsaXNoZWQ6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcHVibGlzaGVkOiByb3dzLmxlbmd0aCwgc2t1czogcm93cy5tYXAoKHIpID0+IHIuc2t1KSB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgc2VuZEpzb24ocmVzLCA1MDIsIHtcbiAgICAgIGVycm9yOiBcInN1cGFiYXNlX25ldHdvcmtfZXJyb3JcIixcbiAgICAgIG1lc3NhZ2U6IGBFcnJvciBkZSBjb25leGlcdTAwRjNuOiAkeyhlcnIgYXMgRXJyb3IpLm1lc3NhZ2V9YCxcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIFBPU1QgL2dhbWVzL2VucmljaCBcdTIwMTQgYnVsay1mZXRjaCBwcm9kdWN0IGRldGFpbHMgZm9yIHNlbGVjdGVkIGdhbWVzIHRoYXQgZG9uJ3QgaGF2ZSB0aGVtIHlldFxuLy8gQm9keTogeyBwbGF0Zm9ybT86IHN0cmluZywgbGltaXQ/OiBudW1iZXIgfVxucm91dGUoXCJQT1NUXCIsIFwiL2dhbWVzL2VucmljaFwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7IHBsYXRmb3JtPzogc3RyaW5nOyBsaW1pdD86IG51bWJlciB9O1xuICBjb25zdCBsaW1pdCA9IE1hdGgubWluKGJvZHkubGltaXQgPz8gMjAsIDUwKTtcbiAgY29uc3QgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IHtcbiAgICBpZiAoIWcuYWN0aXZlIHx8ICFnLnNlbGVjdGVkKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGJvZHkucGxhdGZvcm0gJiYgZy5wbGF0Zm9ybSAhPT0gYm9keS5wbGF0Zm9ybSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChzdG9yZS5nZXRQcm9kdWN0RGV0YWlsKGcuaWQpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGcucGxhdGZvcm0gPT09IFwicHNuXCI7XG4gIH0pLnNsaWNlKDAsIGxpbWl0KTtcblxuICBjb25zdCByZXN1bHRzOiBBcnJheTx7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgb2s6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nIH0+ID0gW107XG4gIGZvciAoY29uc3QgZyBvZiBnYW1lcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjZmcgPSBzdG9yZS5nZXRQc24oKTtcbiAgICAgIGNvbnN0IGRldGFpbCA9IGF3YWl0IGZldGNoUHJvZHVjdERldGFpbChnLmlkLCBnLnN0b3JlVXJsIHx8IFwiXCIsIGNmZy5yZWdpb24pO1xuICAgICAgc3RvcmUuc2V0UHJvZHVjdERldGFpbChnLmlkLCBkZXRhaWwpO1xuICAgICAgcmVzdWx0cy5wdXNoKHsgaWQ6IGcuaWQsIG5hbWU6IGcubmFtZSwgb2s6IHRydWUgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVzdWx0cy5wdXNoKHsgaWQ6IGcuaWQsIG5hbWU6IGcubmFtZSwgb2s6IGZhbHNlLCBlcnJvcjogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gICAgfVxuICAgIC8vIFJhdGUtbGltaXQgdG8gYXZvaWQgaGFtbWVyaW5nIFBTTlxuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCA1MDApKTtcbiAgfVxuXG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGVucmljaGVkOiByZXN1bHRzLmZpbHRlcigocikgPT4gci5vaykubGVuZ3RoLCB0b3RhbDogcmVzdWx0cy5sZW5ndGgsIHJlc3VsdHMgfSk7XG59KTtcblxuLy8gR0VUIC9zZXR0aW5nc1xucm91dGUoXCJHRVRcIiwgXCIvc2V0dGluZ3NcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIHByaWNpbmc6IHN0b3JlLmdldFNldHRpbmdzKCksXG4gICAgcHNuOiBzdG9yZS5nZXRQc24oKSxcbiAgICBzb3VyY2VzOiBzdG9yZS5nZXRTb3VyY2VzKCksXG4gICAgc3VwYWJhc2U6IHN0b3JlLmdldFN1cGFiYXNlKCksXG4gICAgaGl0UHVibGlzaGVyczogc3RvcmUuZ2V0SGl0UHVibGlzaGVycygpLFxuICB9KTtcbn0pO1xuXG4vLyBQVVQgL3NldHRpbmdzXG5yb3V0ZShcIlBVVFwiLCBcIi9zZXR0aW5nc1wiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7XG4gICAgcHJpY2luZz86IFBhcnRpYWw8UmV0dXJuVHlwZTx0eXBlb2Ygc3RvcmUuZ2V0U2V0dGluZ3M+PjtcbiAgICBwc24/OiBQYXJ0aWFsPFJldHVyblR5cGU8dHlwZW9mIHN0b3JlLmdldFBzbj4+O1xuICAgIHNvdXJjZXM/OiBQcm92aWRlclNvdXJjZVtdO1xuICAgIHN1cGFiYXNlPzogU3VwYWJhc2VDb25maWcgfCBudWxsO1xuICAgIGhpdFB1Ymxpc2hlcnM/OiBzdHJpbmdbXTtcbiAgfTtcbiAgY29uc3QgcHJpY2luZyA9IGJvZHkucHJpY2luZyA/IHN0b3JlLnVwZGF0ZVNldHRpbmdzKGJvZHkucHJpY2luZykgOiBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBjb25zdCBwc24gPSBib2R5LnBzbiA/IHN0b3JlLnVwZGF0ZVBzbihib2R5LnBzbikgOiBzdG9yZS5nZXRQc24oKTtcbiAgaWYgKGJvZHkuc291cmNlcykgc3RvcmUuc2V0U291cmNlcyhib2R5LnNvdXJjZXMpO1xuICBpZiAoYm9keS5zdXBhYmFzZSAhPT0gdW5kZWZpbmVkKSBzdG9yZS5zZXRTdXBhYmFzZShib2R5LnN1cGFiYXNlKTtcbiAgaWYgKGJvZHkuaGl0UHVibGlzaGVycykgc3RvcmUuc2V0SGl0UHVibGlzaGVycyhib2R5LmhpdFB1Ymxpc2hlcnMpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIHByaWNpbmcsXG4gICAgcHNuLFxuICAgIHNvdXJjZXM6IHN0b3JlLmdldFNvdXJjZXMoKSxcbiAgICBzdXBhYmFzZTogc3RvcmUuZ2V0U3VwYWJhc2UoKSxcbiAgICBoaXRQdWJsaXNoZXJzOiBzdG9yZS5nZXRIaXRQdWJsaXNoZXJzKCksXG4gIH0pO1xufSk7XG5cbi8vIEdFVCAvcGxhdGZvcm1zIFx1MjAxNCBzdGF0aWMgbWV0YWRhdGEgYWJvdXQgYXZhaWxhYmxlIHBsYXRmb3JtcyArIHJlZ2lvbnNcbnJvdXRlKFwiR0VUXCIsIFwiL3BsYXRmb3Jtc1wiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGxhYmVsczogUExBVEZPUk1fTEFCRUxTLCByZWdpb25zOiBQTEFURk9STV9SRUdJT05TIH0pO1xufSk7XG5cbi8vIFBPU1QgL21vY2svY2xlYXIgXHUyMDE0IHJlbW92ZSBhbGwgZ2FtZXNcbnJvdXRlKFwiUE9TVFwiLCBcIi9tb2NrL2NsZWFyXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKTtcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSB7XG4gICAgc3RvcmUudXBzZXJ0R2FtZSh7IC4uLmcsIGFjdGl2ZTogZmFsc2UgfSk7XG4gIH1cbiAgLy8gQWxzbyB3aXBlIGVudHJpZXMgZnVsbHkgYnkgcmUtd3JpdGluZyB0aGUgZmlsZTpcbiAgZm9yIChjb25zdCBnIG9mIGdhbWVzKSBzdG9yZS5wYXRjaEdhbWUoZy5pZCwgeyBhY3RpdmU6IGZhbHNlIH0pO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBjbGVhcmVkOiBnYW1lcy5sZW5ndGggfSk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gcnVuUmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc291cmNlcyA9IHN0b3JlLmdldFNvdXJjZXMoKS5maWx0ZXIoKHMpID0+IHMuZW5hYmxlZCk7XG4gIGNvbnN0IG5vd0lzbyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm92aWRlciA9IGdldFByb3ZpZGVyKHNvdXJjZS5wbGF0Zm9ybSk7XG4gICAgICBjb25zdCBzZWVuS2V5cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgY29uc3QgZWZmU291cmNlID0geyAuLi5zb3VyY2UgfTtcbiAgICAgIGlmIChzb3VyY2UucGxhdGZvcm0gPT09IFwicHNuXCIgJiYgIXNvdXJjZS5jYXRlZ29yeUlkKSB7XG4gICAgICAgIGVmZlNvdXJjZS5jYXRlZ29yeUlkID0gc3RvcmUuZ2V0UHNuKCkuZGVhbHNDYXRlZ29yeUlkO1xuICAgICAgfVxuICAgICAgZm9yIGF3YWl0IChjb25zdCBkZWFsIG9mIHByb3ZpZGVyLmZldGNoRGVhbHMoZWZmU291cmNlKSkge1xuICAgICAgICBjb25zdCBkYktleSA9IGAke3NvdXJjZS5wbGF0Zm9ybX06JHtzb3VyY2UucmVnaW9ufToke2RlYWwuaWR9YDtcbiAgICAgICAgc2VlbktleXMuYWRkKGRiS2V5KTtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5nZXRHYW1lQnlDb21wb3NpdGUoc291cmNlLnBsYXRmb3JtLCBzb3VyY2UucmVnaW9uLCBkZWFsLmlkKTtcbiAgICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICAgIHN0b3JlLnVwc2VydEdhbWUoe1xuICAgICAgICAgICAgaWQ6IGRlYWwuaWQsIHBsYXRmb3JtOiBzb3VyY2UucGxhdGZvcm0sIHJlZ2lvbjogc291cmNlLnJlZ2lvbixcbiAgICAgICAgICAgIG5hbWU6IGRlYWwubmFtZSwgaW1hZ2VVcmw6IGRlYWwuaW1hZ2VVcmwsIHN0b3JlVXJsOiBkZWFsLnN0b3JlVXJsLFxuICAgICAgICAgICAgcGxhdGZvcm1zOiBkZWFsLmhhcmR3YXJlUGxhdGZvcm1zLCBjdXJyZW5jeTogZGVhbC5jdXJyZW5jeSxcbiAgICAgICAgICAgIHByaWNlT3JpZ2luYWxDZW50czogZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMsIHByaWNlRGlzY291bnRlZENlbnRzOiBkZWFsLnByaWNlRGlzY291bnRlZENlbnRzLFxuICAgICAgICAgICAgZGlzY291bnRQZXJjZW50OiBkZWFsLmRpc2NvdW50UGVyY2VudCwgZGlzY291bnRFbmRBdDogZGVhbC5kaXNjb3VudEVuZEF0LFxuICAgICAgICAgICAgc2VsZWN0ZWQ6IGZhbHNlLCBwdWJsaXNoZWQ6IGZhbHNlLCBub3RlczogXCJcIiwgeW91dHViZVVybDogXCJcIiwgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgZmlyc3RTZWVuQXQ6IG5vd0lzbywgbGFzdFNlZW5BdDogbm93SXNvLCB1cGRhdGVkQXQ6IG5vd0lzbyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9yZS51cHNlcnRHYW1lKHtcbiAgICAgICAgICAgIC4uLmV4aXN0aW5nLCBuYW1lOiBkZWFsLm5hbWUgfHwgZXhpc3RpbmcubmFtZSwgaW1hZ2VVcmw6IGRlYWwuaW1hZ2VVcmwgfHwgZXhpc3RpbmcuaW1hZ2VVcmwsXG4gICAgICAgICAgICBzdG9yZVVybDogZGVhbC5zdG9yZVVybCB8fCBleGlzdGluZy5zdG9yZVVybCwgcGxhdGZvcm1zOiBkZWFsLmhhcmR3YXJlUGxhdGZvcm1zLFxuICAgICAgICAgICAgY3VycmVuY3k6IGRlYWwuY3VycmVuY3ksIHByaWNlT3JpZ2luYWxDZW50czogZGVhbC5wcmljZU9yaWdpbmFsQ2VudHMsXG4gICAgICAgICAgICBwcmljZURpc2NvdW50ZWRDZW50czogZGVhbC5wcmljZURpc2NvdW50ZWRDZW50cywgZGlzY291bnRQZXJjZW50OiBkZWFsLmRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgICAgIGRpc2NvdW50RW5kQXQ6IGRlYWwuZGlzY291bnRFbmRBdCwgYWN0aXZlOiB0cnVlLCBsYXN0U2VlbkF0OiBub3dJc28sIHVwZGF0ZWRBdDogbm93SXNvLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdG9yZS5tYXJrSW5hY3RpdmVJZk1pc3Npbmcoc2VlbktleXMsIHNvdXJjZS5wbGF0Zm9ybSwgc291cmNlLnJlZ2lvbik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW3NjaGVkdWxlcl1bJHtzb3VyY2UucGxhdGZvcm19LyR7c291cmNlLnJlZ2lvbn1dICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG4gIHJlY29tcHV0ZU1hdGNoZXMoKTtcbn1cblxuZnVuY3Rpb24gcmVjb21wdXRlTWF0Y2hlcygpOiB2b2lkIHtcbiAgY29uc3QgZ2FtZXMgPSBzdG9yZS5saXN0R2FtZXMoKS5maWx0ZXIoKGcpID0+IGcuYWN0aXZlKTtcbiAgY29uc3QgcHJvZHVjdHMgPSBzdG9yZS5nZXRBbGxDb21wZXRpdG9yUHJvZHVjdHMoKTtcbiAgY29uc3QgbWF0Y2hlcyA9IG1hdGNoR2FtZXMoZ2FtZXMsIHByb2R1Y3RzKTtcbiAgc3RvcmUuc2V0Q29tcGV0aXRvck1hdGNoZXMobWF0Y2hlcyk7XG59XG5cbi8vIEdFVCAvY29tcGV0aXRvcnMgXHUyMDE0IGxpc3Qgc3RvcmVzICsgbGFzdCByZWZyZXNoICsgbWF0Y2ggc3RhdHNcbnJvdXRlKFwiR0VUXCIsIFwiL2NvbXBldGl0b3JzXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgY29tcGV0aXRvcnMgPSBzdG9yZS5nZXRDb21wZXRpdG9ycygpO1xuICBjb25zdCByZWZyZXNoZWRBdCA9IHN0b3JlLmdldENvbXBldGl0b3JSZWZyZXNoZWRBdCgpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgIGNvbXBldGl0b3JzOiBjb21wZXRpdG9ycy5tYXAoKGMpID0+ICh7XG4gICAgICAuLi5jLFxuICAgICAgcmVmcmVzaGVkQXQ6IHJlZnJlc2hlZEF0W2Mua2V5XSA/PyBudWxsLFxuICAgICAgcHJvZHVjdENvdW50OiBzdG9yZVxuICAgICAgICAuZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGZhbHNlKVxuICAgICAgICAuZmlsdGVyKChwKSA9PiBwLnN0b3JlS2V5ID09PSBjLmtleSkubGVuZ3RoLFxuICAgIH0pKSxcbiAgfSk7XG59KTtcblxuLy8gUFVUIC9jb21wZXRpdG9ycyBcdTIwMTQgcmVwbGFjZSB0aGUgZnVsbCBsaXN0ICh1c2VkIGZyb20gQWp1c3RlcylcbnJvdXRlKFwiUFVUXCIsIFwiL2NvbXBldGl0b3JzXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRCb2R5KHJlcSkpIGFzIHsgY29tcGV0aXRvcnM/OiBDb21wZXRpdG9yQ29uZmlnW10gfTtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGJvZHkuY29tcGV0aXRvcnMpKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcImJhZF9yZXF1ZXN0XCIsIG1lc3NhZ2U6IFwiY29tcGV0aXRvcnNbXSByZXF1aXJlZFwiIH0pO1xuICB9XG4gIGNvbnN0IGNsZWFuOiBDb21wZXRpdG9yQ29uZmlnW10gPSBib2R5LmNvbXBldGl0b3JzXG4gICAgLmZpbHRlcigoYykgPT4gYyAmJiB0eXBlb2YgYy5rZXkgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGMuZG9tYWluID09PSBcInN0cmluZ1wiKVxuICAgIC5tYXAoKGMpID0+ICh7XG4gICAgICBrZXk6IGMua2V5LnRyaW0oKSxcbiAgICAgIGxhYmVsOiAoYy5sYWJlbCB8fCBjLmtleSkudHJpbSgpLFxuICAgICAgZG9tYWluOiBjLmRvbWFpbi5yZXBsYWNlKC9eaHR0cHM/OlxcL1xcLy8sIFwiXCIpLnJlcGxhY2UoL1xcLy4qJC8sIFwiXCIpLnRyaW0oKSxcbiAgICAgIHR5cGU6IChbXCJzaG9waWZ5XCIsIFwid29vY29tbWVyY2VcIiwgXCJodG1sXCIsIFwianVtcHNlbGxlclwiLCBcImF1dG9cIl0uaW5jbHVkZXMoYy50eXBlKSA/IGMudHlwZSA6IFwiYXV0b1wiKSxcbiAgICAgIGVuYWJsZWQ6IGMuZW5hYmxlZCAhPT0gZmFsc2UsXG4gICAgfSkpO1xuICBzdG9yZS5zZXRDb21wZXRpdG9ycyhjbGVhbik7XG4gIHJlY29tcHV0ZU1hdGNoZXMoKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgY29tcGV0aXRvcnM6IHN0b3JlLmdldENvbXBldGl0b3JzKCkgfSk7XG59KTtcblxuLy8gUE9TVCAvY29tcGV0aXRvcnMvcmVmcmVzaCBcdTIwMTQgc2NyYXBlIGFsbCBlbmFibGVkIHN0b3JlcyBhbmQgcmVjb21wdXRlIG1hdGNoZXNcbnJvdXRlKFwiUE9TVFwiLCBcIi9jb21wZXRpdG9ycy9yZWZyZXNoXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgY29tcGV0aXRvcnMgPSBzdG9yZS5nZXRDb21wZXRpdG9ycygpLmZpbHRlcigoYykgPT4gYy5lbmFibGVkKTtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCByZXN1bHRzOiBBcnJheTx7IGtleTogc3RyaW5nOyBsYWJlbDogc3RyaW5nOyBjb3VudDogbnVtYmVyOyBlcnJvcj86IHN0cmluZyB9PiA9IFtdO1xuXG4gIGF3YWl0IFByb21pc2UuYWxsKFxuICAgIGNvbXBldGl0b3JzLm1hcChhc3luYyAoYykgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcHJvZHVjdHMgPSBhd2FpdCBmZXRjaENvbXBldGl0b3IoYyk7XG4gICAgICAgIHN0b3JlLnNldENvbXBldGl0b3JQcm9kdWN0cyhjLmtleSwgcHJvZHVjdHMsIG5vdyk7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7IGtleTogYy5rZXksIGxhYmVsOiBjLmxhYmVsLCBjb3VudDogcHJvZHVjdHMubGVuZ3RoIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBtc2cgPVxuICAgICAgICAgIGUgaW5zdGFuY2VvZiBDb21wZXRpdG9yRmV0Y2hFcnJvclxuICAgICAgICAgICAgPyBlLm1lc3NhZ2VcbiAgICAgICAgICAgIDogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfHwgXCJlcnJvclwiO1xuICAgICAgICByZXN1bHRzLnB1c2goeyBrZXk6IGMua2V5LCBsYWJlbDogYy5sYWJlbCwgY291bnQ6IDAsIGVycm9yOiBtc2cgfSk7XG4gICAgICB9XG4gICAgfSlcbiAgKTtcblxuICByZWNvbXB1dGVNYXRjaGVzKCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IHJlZnJlc2hlZEF0OiBub3csIHJlc3VsdHMgfSk7XG59KTtcblxuLy8gR0VUIC9wcy1wbHVzIFx1MjAxNCBQUyBQbHVzIG1lbWJlcnNoaXAgcHJpY2VzIHZzIGNvbXBldGl0b3JzXG5yb3V0ZShcIkdFVFwiLCBcIi9wcy1wbHVzXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0U2V0dGluZ3MoKTtcbiAgY29uc3QgcHJvZHVjdHMgPSBzdG9yZS5nZXRBbGxDb21wZXRpdG9yUHJvZHVjdHMoKTtcbiAgY29uc3Qgc2NyYXBlZCA9IHN0b3JlLmdldFBzUGx1c1ByaWNlcygpIGFzIFNjcmFwZWRQbHVzUHJpY2VzIHwgbnVsbDtcbiAgY29uc3QgcGxhbnMgPSBtYXRjaFBsYW5zV2l0aENvbXBldGl0b3JzKHByb2R1Y3RzLCBjZmcsIHNjcmFwZWQpO1xuICBzZW5kSnNvbihyZXMsIDIwMCwgeyBwbGFucywgc2NyYXBlZEF0OiBzY3JhcGVkPy5zY3JhcGVkQXQgPz8gbnVsbCB9KTtcbn0pO1xuXG4vLyBQT1NUIC9wcy1wbHVzL3JlZnJlc2ggXHUyMDE0IHNjcmFwZSBjdXJyZW50IFBTIFBsdXMgcHJpY2VzIGZyb20gcGxheXN0YXRpb24uY29tXG5yb3V0ZShcIlBPU1RcIiwgXCIvcHMtcGx1cy9yZWZyZXNoXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzY3JhcGVQc1BsdXNQcmljZXMoKTtcbiAgICBzdG9yZS5zZXRQc1BsdXNQcmljZXMocmVzdWx0KTtcbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgcmVzdWx0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcInNjcmFwZV9mYWlsZWRcIiwgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UgfSk7XG4gIH1cbn0pO1xuXG4vLyBQT1NUIC9nYW1lcy9sb29rdXAgXHUyMDE0IGJ1bGsgZnV6enkgc2VhcmNoOiByZWNlaXZlcyBhIGxpc3Qgb2Yge25hbWUsIHByaWNlVXNkP31cbi8vIGl0ZW1zIChwYXJzZWQgZnJvbSBwYXN0ZWQgY29tcGV0aXRvciB0ZXh0KSBhbmQgbWF0Y2hlcyBlYWNoIGFnYWluc3QgdGhlIGdhbWUgREIuXG5yb3V0ZShcIlBPU1RcIiwgXCIvZ2FtZXMvbG9va3VwXCIsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcbiAgY29uc3QgaXRlbXM6IEFycmF5PHsgbmFtZTogc3RyaW5nOyBwcmljZU1pbjogbnVtYmVyIHwgbnVsbDsgcHJpY2VNYXg6IG51bWJlciB8IG51bGwgfT4gPVxuICAgIGJvZHk/Lml0ZW1zO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaXRlbXMpIHx8ICFpdGVtcy5sZW5ndGgpIHtcbiAgICBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogXCJiYWRfcmVxdWVzdFwiLCBtZXNzYWdlOiBcIml0ZW1zW10gcmVxdWlyZWRcIiB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjZmcgPSBzdG9yZS5nZXRTZXR0aW5ncygpO1xuICBjb25zdCBhbGxHYW1lcyA9IHN0b3JlLmxpc3RHYW1lcygpLmZpbHRlcigoZykgPT4gZy5hY3RpdmUpO1xuICBjb25zdCBnYW1lSW5kZXggPSBhbGxHYW1lcy5tYXAoKGcpID0+ICh7XG4gICAgZ2FtZTogZyxcbiAgICB0b2tlbnM6IHRva2VuaXplKGcubmFtZSksXG4gIH0pKTtcblxuICBjb25zdCBUSFJFU0hPTEQgPSAwLjQwO1xuICBjb25zdCByZXN1bHRzID0gaXRlbXMubWFwKChpdGVtKSA9PiB7XG4gICAgY29uc3QgcXVlcnlUb2tlbnMgPSB0b2tlbml6ZShpdGVtLm5hbWUpO1xuICAgIGxldCBiZXN0R2FtZTogR2FtZSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBiZXN0U2NvcmUgPSAwO1xuXG4gICAgZm9yIChjb25zdCB7IGdhbWUsIHRva2VucyB9IG9mIGdhbWVJbmRleCkge1xuICAgICAgaWYgKCF0b2tlbnMubGVuZ3RoKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHNjb3JlID0gc2ltaWxhcml0eShxdWVyeVRva2VucywgdG9rZW5zKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdEdhbWUgPSBnYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoZWQgPSBiZXN0U2NvcmUgPj0gVEhSRVNIT0xEICYmIGJlc3RHYW1lO1xuICAgIGNvbnN0IG91dCA9IG1hdGNoZWQgPyB0b0dhbWVPdXQoYmVzdEdhbWUhLCBjZmcpIDogbnVsbDtcblxuICAgIHJldHVybiB7XG4gICAgICBxdWVyeTogaXRlbS5uYW1lLFxuICAgICAgcHJpY2VNaW46IGl0ZW0ucHJpY2VNaW4sXG4gICAgICBwcmljZU1heDogaXRlbS5wcmljZU1heCxcbiAgICAgIG1hdGNoU2NvcmU6IE1hdGgucm91bmQoYmVzdFNjb3JlICogMTAwKSAvIDEwMCxcbiAgICAgIGZvdW5kOiAhIW1hdGNoZWQsXG4gICAgICBnYW1lOiBvdXQsXG4gICAgfTtcbiAgfSk7XG5cbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcmVzdWx0cyB9KTtcbn0pO1xuXG4vLyBHRVQgL2RlYnVnL3Byb2R1Y3QtdHlwZXMgXHUyMDE0IG9uZS1zaG90IHJlY29ubmFpc3NhbmNlIHVzZWQgdG8gZGVzaWduIHRoZVxuLy8gRExDL2FkZC1vbiBmaWx0ZXIuIFJ1bnMgYSBmdWxsIFBTTiBzY3JhcGUgYW5kIHJlcG9ydHMgZXZlcnkgY2xhc3NpZmljYXRpb25cbi8vICsgcHJvZHVjdFR5cGUgY29tYm8gaXQgc2VlcywgcGx1cyBhbGwgb2JzZXJ2ZWQgdG9wLWxldmVsIGtleXMuIFRoZSByZXNwb25zZVxuLy8gaXMgc21hbGwgKGEgY291cGxlIG9mIEtCKSwgdGhlIHNjcmFwZSBpdHNlbGYgaXMgdGhlIHNsb3cgcGFydC5cbnJvdXRlKFwiR0VUXCIsIFwiL2RlYnVnL3Byb2R1Y3QtdHlwZXNcIiwgYXN5bmMgKF9yZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNmZyA9IHN0b3JlLmdldFBzbigpO1xuICAgIGNvbnN0IHJlcG9ydCA9IGF3YWl0IGluc3BlY3RQcm9kdWN0VHlwZXMoY2ZnKTtcbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgcmVwb3J0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJwc25fYXBpX2Vycm9yXCIsXG4gICAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcImludGVybmFsXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gR0VUIC9nYW1lcy86aWQvZGV0YWlsIFx1MjAxNCBjYWNoZWQgcHJvZHVjdCBkZXRhaWwgKGltYWdlcnksIGRlc2NyaXB0aW9uXHUyMDI2KS5cbi8vIFJldHVybnMgMjA0IE5vIENvbnRlbnQgaWYgd2UgaGF2ZW4ndCBmZXRjaGVkIGl0IHlldDsgdGhlIGNsaWVudCBzaG91bGRcbi8vIHRoZW4gUE9TVCAvZ2FtZXMvOmlkL2RldGFpbC9yZWZyZXNoIHRvIHRyaWdnZXIgdGhlIHNjcmFwZS5cbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzLzppZC9kZXRhaWxcIiwgYXN5bmMgKF9yZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGRldGFpbCA9IHN0b3JlLmdldFByb2R1Y3REZXRhaWwocGFyYW1zLmlkKTtcbiAgaWYgKCFkZXRhaWwpIHtcbiAgICByZXMuc3RhdHVzQ29kZSA9IDIwNDtcbiAgICByZXMuZW5kKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHNlbmRKc29uKHJlcywgMjAwLCBkZXRhaWwpO1xufSk7XG5cbi8vIFBPU1QgL2dhbWVzLzppZC9kZXRhaWwvcmVmcmVzaCBcdTIwMTQgc2NyYXBlIHRoZSBwcm9kdWN0IHBhZ2UgYW5kIGNhY2hlIGl0Llxucm91dGUoXCJQT1NUXCIsIFwiL2dhbWVzLzppZC9kZXRhaWwvcmVmcmVzaFwiLCBhc3luYyAoX3JlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3QgZ2FtZSA9IHN0b3JlLmdldEdhbWUocGFyYW1zLmlkKTtcbiAgaWYgKCFnYW1lKSByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwibm90X2ZvdW5kXCIgfSk7XG4gIHRyeSB7XG4gICAgY29uc3QgY2ZnID0gc3RvcmUuZ2V0UHNuKCk7XG4gICAgY29uc3QgZGV0YWlsID0gYXdhaXQgZmV0Y2hQcm9kdWN0RGV0YWlsKFxuICAgICAgZ2FtZS5pZCxcbiAgICAgIGdhbWUuc3RvcmVVcmwgfHwgXCJcIixcbiAgICAgIGNmZy5yZWdpb25cbiAgICApO1xuICAgIHN0b3JlLnNldFByb2R1Y3REZXRhaWwoZ2FtZS5pZCwgZGV0YWlsKTtcbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgZGV0YWlsKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgUHNuQXBpRXJyb3IpIHtcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwge1xuICAgICAgICBlcnJvcjogXCJwc25fYXBpX2Vycm9yXCIsXG4gICAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcImludGVybmFsXCIsIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlIH0pO1xuICB9XG59KTtcblxuLy8gR0VUIC93YXRjaGxpc3QgXHUyMDE0IHRyYWNrZWQgZ2FtZXMgKyBjdXJyZW50IHN0YXR1cyBzbmFwc2hvdC5cbnJvdXRlKFwiR0VUXCIsIFwiL3dhdGNobGlzdFwiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IGl0ZW1zOiBzdG9yZS5saXN0V2F0Y2hsaXN0KCkgfSk7XG59KTtcblxuLy8gUE9TVCAvd2F0Y2hsaXN0IFx1MjAxNCBhZGQgYSBnYW1lIGJ5IFVSTCBvciBpZC4gQm9keTogeyBpbnB1dDogc3RyaW5nLCBub3Rlcz8gfVxucm91dGUoXCJQT1NUXCIsIFwiL3dhdGNobGlzdFwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7IGlucHV0Pzogc3RyaW5nOyBub3Rlcz86IHN0cmluZyB9O1xuICBjb25zdCBpZCA9IGV4dHJhY3RQc25JZChib2R5LmlucHV0ID8/IFwiXCIpO1xuICBpZiAoIWlkKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7XG4gICAgICBlcnJvcjogXCJiYWRfaW5wdXRcIixcbiAgICAgIG1lc3NhZ2U6IFwiUGVnXHUwMEUxIGxhIFVSTCBkZWwgcHJvZHVjdG8gZW4gUFNOIG8gdW4gSUQgdGlwbyBVUFhYWFgtQ1VTQVhYWFhYXzAwLVx1MjAyNlwiLFxuICAgIH0pO1xuICB9XG4gIGNvbnN0IGV4aXN0aW5nID0gc3RvcmUuZ2V0V2F0Y2hlZChpZCk7XG4gIGlmIChleGlzdGluZykgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCBleGlzdGluZyk7XG5cbiAgY29uc3QgZ2FtZSA9IHN0b3JlLmdldEdhbWUoaWQpO1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIGNvbnN0IGVudHJ5OiBXYXRjaGVkR2FtZSA9IHtcbiAgICBpZCxcbiAgICBuYW1lOiBnYW1lPy5uYW1lIHx8IGlkLFxuICAgIGFkZGVkQXQ6IG5vdyxcbiAgICBsYXN0U3RhdHVzOiBnYW1lPy5hY3RpdmUgJiYgZ2FtZS5kaXNjb3VudFBlcmNlbnQgPiAwID8gXCJvbl9zYWxlXCIgOiBnYW1lID8gXCJvZmZfc2FsZVwiIDogXCJ1bnNlZW5cIixcbiAgICBsYXN0U2Vlbk9uU2FsZUF0OlxuICAgICAgZ2FtZT8uYWN0aXZlICYmIGdhbWUuZGlzY291bnRQZXJjZW50ID4gMCA/IG5vdyA6IG51bGwsXG4gICAgbGFzdFByaWNlQ2VudHM6IGdhbWU/LnByaWNlRGlzY291bnRlZENlbnRzID8/IG51bGwsXG4gICAgbGFzdERpc2NvdW50UGVyY2VudDogZ2FtZT8uZGlzY291bnRQZXJjZW50ID8/IDAsXG4gICAgbm90ZXM6IChib2R5Lm5vdGVzID8/IFwiXCIpLnRyaW0oKSxcbiAgfTtcbiAgc2VuZEpzb24ocmVzLCAyMDEsIHN0b3JlLnVwc2VydFdhdGNoZWQoZW50cnkpKTtcbn0pO1xuXG4vLyBQQVRDSCAvd2F0Y2hsaXN0LzppZCBcdTIwMTQgZWRpdCBub3RlcyBvciBuYW1lLlxucm91dGUoXCJQQVRDSFwiLCBcIi93YXRjaGxpc3QvOmlkXCIsIGFzeW5jIChyZXEsIHJlcywgcGFyYW1zKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgUGFydGlhbDxQaWNrPFdhdGNoZWRHYW1lLCBcIm5vdGVzXCIgfCBcIm5hbWVcIj4+O1xuICBjb25zdCBwYXRjaDogUGFydGlhbDxXYXRjaGVkR2FtZT4gPSB7fTtcbiAgaWYgKHR5cGVvZiBib2R5Lm5vdGVzID09PSBcInN0cmluZ1wiKSBwYXRjaC5ub3RlcyA9IGJvZHkubm90ZXM7XG4gIGlmICh0eXBlb2YgYm9keS5uYW1lID09PSBcInN0cmluZ1wiICYmIGJvZHkubmFtZS50cmltKCkpIHBhdGNoLm5hbWUgPSBib2R5Lm5hbWUudHJpbSgpO1xuICBjb25zdCB1cGRhdGVkID0gc3RvcmUucGF0Y2hXYXRjaGVkKHBhcmFtcy5pZCwgcGF0Y2gpO1xuICBpZiAoIXVwZGF0ZWQpIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiB9KTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHVwZGF0ZWQpO1xufSk7XG5cbi8vIERFTEVURSAvd2F0Y2hsaXN0LzppZFxucm91dGUoXCJERUxFVEVcIiwgXCIvd2F0Y2hsaXN0LzppZFwiLCBhc3luYyAoX3JlcSwgcmVzLCBwYXJhbXMpID0+IHtcbiAgY29uc3Qgb2sgPSBzdG9yZS5yZW1vdmVXYXRjaGVkKHBhcmFtcy5pZCk7XG4gIGlmICghb2spIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJub3RfZm91bmRcIiB9KTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgcmVtb3ZlZDogdHJ1ZSB9KTtcbn0pO1xuXG4vLyBHRVQgL2dhbWVzLzppZC9tYXRjaGVzIFx1MjAxNCBhbGwgY29tcGV0aXRvciBtYXRjaGVzIGZvciBhIGdhbWUgKGZvciBwb3BvdmVycylcbnJvdXRlKFwiR0VUXCIsIFwiL2dhbWVzLzppZC9tYXRjaGVzXCIsIGFzeW5jIChfcmVxLCByZXMsIHBhcmFtcykgPT4ge1xuICBjb25zdCBtYXRjaGVzOiBDb21wZXRpdG9yTWF0Y2hbXSA9IHN0b3JlLmdldENvbXBldGl0b3JNYXRjaGVzKHBhcmFtcy5pZCk7XG4gIHNlbmRKc29uKHJlcywgMjAwLCB7IG1hdGNoZXMgfSk7XG59KTtcblxuLy8gUE9TVCAvZXhjaGFuZ2UvcmVmcmVzaCBcdTIwMTQgZmV0Y2ggbGF0ZXN0IFVTRFx1MjE5MkNMUCBmcm9tIG1pbmRpY2Fkb3IuY2wgYW5kIHNhdmVcbnJvdXRlKFwiUE9TVFwiLCBcIi9leGNoYW5nZS9yZWZyZXNoXCIsIGFzeW5jIChfcmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByYXRlcyA9IGF3YWl0IGZldGNoRXhjaGFuZ2VSYXRlcygpO1xuICAgIGNvbnN0IHBhdGNoOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgaWYgKHJhdGVzLnVzZFRvQ2xwICE9IG51bGwpIHBhdGNoLnVzZFRvQ2xwID0gTWF0aC5yb3VuZChyYXRlcy51c2RUb0NscCk7XG4gICAgaWYgKE9iamVjdC5rZXlzKHBhdGNoKS5sZW5ndGggPiAwKSB7XG4gICAgICBzdG9yZS51cGRhdGVTZXR0aW5ncyhwYXRjaCk7XG4gICAgfVxuICAgIHNlbmRKc29uKHJlcywgMjAwLCB7XG4gICAgICB1cGRhdGVkOiBwYXRjaCxcbiAgICAgIGZldGNoZWRBdDogcmF0ZXMuZmV0Y2hlZEF0LFxuICAgICAgZXJyb3JzOiByYXRlcy5lcnJvcnMsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJleGNoYW5nZV9lcnJvclwiLCBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSB9KTtcbiAgfVxufSk7XG5cbi8vIEdFVCAvZGVidWcvc3RhdHVzIFx1MjAxNCBkaWFnbm9zdGljIHNuYXBzaG90IG9mIHN5c3RlbSBoZWFsdGhcbnJvdXRlKFwiR0VUXCIsIFwiL2RlYnVnL3N0YXR1c1wiLCBhc3luYyAoX3JlcSwgcmVzKSA9PiB7XG4gIGNvbnN0IGFsbEdhbWVzID0gc3RvcmUubGlzdEdhbWVzKCk7XG4gIGNvbnN0IGFjdGl2ZUdhbWVzID0gYWxsR2FtZXMuZmlsdGVyKChnKSA9PiBnLmFjdGl2ZSk7XG5cbiAgY29uc3QgZ2FtZXNCeVBsYXRmb3JtOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gIGZvciAoY29uc3QgZyBvZiBhY3RpdmVHYW1lcykge1xuICAgIGdhbWVzQnlQbGF0Zm9ybVtnLnBsYXRmb3JtXSA9IChnYW1lc0J5UGxhdGZvcm1bZy5wbGF0Zm9ybV0gfHwgMCkgKyAxO1xuICB9XG5cbiAgY29uc3Qgc291cmNlcyA9IHN0b3JlLmdldFNvdXJjZXMoKS5tYXAoKHMpID0+ICh7XG4gICAgcGxhdGZvcm06IHMucGxhdGZvcm0sXG4gICAgcmVnaW9uOiBzLnJlZ2lvbixcbiAgICBlbmFibGVkOiBzLmVuYWJsZWQsXG4gIH0pKTtcblxuICBjb25zdCBjb21wZXRpdG9ycyA9IHN0b3JlLmdldENvbXBldGl0b3JzKCk7XG4gIGNvbnN0IGFsbFByb2R1Y3RzID0gc3RvcmUuZ2V0QWxsQ29tcGV0aXRvclByb2R1Y3RzKGZhbHNlKTtcbiAgY29uc3QgcmVmcmVzaGVkQXQgPSBzdG9yZS5nZXRDb21wZXRpdG9yUmVmcmVzaGVkQXQoKTtcblxuICBjb25zdCBjb21wZXRpdG9yU3RhdHVzID0gY29tcGV0aXRvcnMubWFwKChjKSA9PiAoe1xuICAgIGtleTogYy5rZXksXG4gICAgbGFiZWw6IGMubGFiZWwsXG4gICAgcHJvZHVjdENvdW50OiBhbGxQcm9kdWN0cy5maWx0ZXIoKHApID0+IHAuc3RvcmVLZXkgPT09IGMua2V5KS5sZW5ndGgsXG4gICAgcmVmcmVzaGVkQXQ6IHJlZnJlc2hlZEF0W2Mua2V5XSA/PyBudWxsLFxuICB9KSk7XG5cbiAgc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICB0b3RhbEdhbWVzOiBhbGxHYW1lcy5sZW5ndGgsXG4gICAgYWN0aXZlR2FtZXM6IGFjdGl2ZUdhbWVzLmxlbmd0aCxcbiAgICBnYW1lc0J5UGxhdGZvcm0sXG4gICAgc291cmNlcyxcbiAgICBjb21wZXRpdG9yczogY29tcGV0aXRvclN0YXR1cyxcbiAgICBhdXRvUmVmcmVzaEludGVydmFsSG91cnM6IHN0b3JlLmdldEF1dG9SZWZyZXNoSW50ZXJ2YWwoKSxcbiAgICBsYXN0QXV0b1JlZnJlc2hBdDogZ2V0TGFzdEF1dG9SZWZyZXNoQXQoKSxcbiAgICBkYlNpemVLYjogbnVsbCxcbiAgfSk7XG59KTtcblxuLy8gUFVUIC9zY2hlZHVsZXIgXHUyMDE0IGVuYWJsZS9kaXNhYmxlIHBlcmlvZGljIGF1dG8tcmVmcmVzaFxuLy8gQm9keTogeyBpbnRlcnZhbEhvdXJzOiBudW1iZXIgfSAgKDAgPSBkaXNhYmxlZClcbnJvdXRlKFwiUFVUXCIsIFwiL3NjaGVkdWxlclwiLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7IGludGVydmFsSG91cnM/OiBudW1iZXIgfTtcbiAgY29uc3QgaG91cnMgPSBOdW1iZXIoYm9keS5pbnRlcnZhbEhvdXJzID8/IDApO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShob3VycykgfHwgaG91cnMgPCAwKSB7XG4gICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcImJhZF9yZXF1ZXN0XCIsIG1lc3NhZ2U6IFwiaW50ZXJ2YWxIb3VycyBtdXN0IGJlID49IDBcIiB9KTtcbiAgfVxuICBzdG9yZS5zZXRBdXRvUmVmcmVzaEludGVydmFsKGhvdXJzKTtcbiAgcmVzY2hlZHVsZShydW5SZWZyZXNoKTtcbiAgc2VuZEpzb24ocmVzLCAyMDAsIHsgaW50ZXJ2YWxIb3Vyczogc3RvcmUuZ2V0QXV0b1JlZnJlc2hJbnRlcnZhbCgpIH0pO1xufSk7XG5cbi8vIFN0YXJ0IHNjaGVkdWxlciBpZiBjb25maWd1cmVkXG5zdGFydFNjaGVkdWxlcihydW5SZWZyZXNoKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3QoXG4gIHJlcTogSW5jb21pbmdNZXNzYWdlLFxuICByZXM6IFNlcnZlclJlc3BvbnNlXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8IFwiL1wiLCBcImh0dHA6Ly94XCIpO1xuICBjb25zdCBwYXRobmFtZSA9IHVybC5wYXRobmFtZTsgLy8gVml0ZSBzdHJpcHMgL2FwaSBwcmVmaXggdmlhIHVzZSgpXG5cbiAgZm9yIChjb25zdCByIG9mIHJvdXRlcykge1xuICAgIGlmIChyLm1ldGhvZCAhPT0gcmVxLm1ldGhvZCkgY29udGludWU7XG4gICAgY29uc3QgbSA9IHIucGF0dGVybi5leGVjKHBhdGhuYW1lKTtcbiAgICBpZiAoIW0pIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIHIua2V5cy5mb3JFYWNoKChrLCBpKSA9PiAocGFyYW1zW2tdID0gZGVjb2RlVVJJQ29tcG9uZW50KG1baSArIDFdKSkpO1xuICAgIHJldHVybiByLmhhbmRsZXIocmVxLCByZXMsIHBhcmFtcyk7XG4gIH1cbiAgc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwibm90X2ZvdW5kXCIsIHBhdGg6IHBhdGhuYW1lIH0pO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zZXJ2ZXIvcGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc2VydmVyL3BsdWdpbi50c1wiOy8qKlxuICogVml0ZSBwbHVnaW4gdGhhdCBtb3VudHMgdGhlIGFwaXBzbiBKU09OIEFQSSBvbiB0aGUgZGV2IHNlcnZlci5cbiAqIEV2ZXJ5dGhpbmcgcnVucyBpbiBhIHNpbmdsZSBOb2RlIHByb2Nlc3MgXHUyMDE0IGlkZWFsIGZvciBCb2x0IC8gU3RhY2tCbGl0ei5cbiAqL1xuaW1wb3J0IHR5cGUgeyBQbHVnaW4sIFZpdGVEZXZTZXJ2ZXIgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSBcIm5vZGU6aHR0cFwiO1xuaW1wb3J0IHsgaGFuZGxlUmVxdWVzdCB9IGZyb20gXCIuL2FwaVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBpUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJhcGlwc24tYXBpXCIsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogVml0ZURldlNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcbiAgICAgICAgXCIvYXBpXCIsXG4gICAgICAgIChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSwgbmV4dDogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgIGhhbmRsZVJlcXVlc3QocmVxLCByZXMpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbYXBpXSB1bmhhbmRsZWRcIiwgZXJyKTtcbiAgICAgICAgICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBlcnJvcjogXCJpbnRlcm5hbF9lcnJvclwiLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogU3RyaW5nKChlcnIgYXMgRXJyb3IpPy5tZXNzYWdlIHx8IGVyciksXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9LFxuICB9O1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7OztBQ0VsQixPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFDakIsU0FBUyxxQkFBcUI7QUFMNEcsSUFBTSwyQ0FBMkM7QUErRzNMLElBQU0sbUJBQW9DO0FBQUEsRUFDeEMsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1Ysb0JBQW9CO0FBQUEsRUFDcEIsb0JBQW9CO0FBQUEsRUFDcEIsb0JBQW9CO0FBQUEsRUFDcEIsY0FBYztBQUFBLEVBQ2QsZ0JBQWdCO0FBQUEsRUFDaEIsU0FBUztBQUFBLEVBQ1Qsb0JBQW9CO0FBQ3RCO0FBRUEsSUFBTSx5QkFBbUM7QUFBQSxFQUN2QztBQUFBLEVBQWtDO0FBQUEsRUFBbUI7QUFBQSxFQUNyRDtBQUFBLEVBQXVCO0FBQUEsRUFBYTtBQUFBLEVBQ3BDO0FBQUEsRUFBa0I7QUFBQSxFQUFXO0FBQUEsRUFBbUI7QUFBQSxFQUNoRDtBQUFBLEVBQWU7QUFBQSxFQUFnQjtBQUFBLEVBQWU7QUFBQSxFQUM5QztBQUFBLEVBQVk7QUFBQSxFQUFnQjtBQUFBLEVBQVU7QUFBQSxFQUFRO0FBQUEsRUFDOUM7QUFBQSxFQUFrQjtBQUFBLEVBQXdCO0FBQzVDO0FBRUEsSUFBTSxrQkFBb0M7QUFBQSxFQUN4QyxFQUFFLFVBQVUsT0FBTyxRQUFRLE1BQU0sU0FBUyxNQUFNLFlBQVksR0FBRztBQUFBLEVBQy9ELEVB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TSxDQUFDLFFBQVE7QUFDckMsb0JBQVEsTUFBTSxtQkFBbUIsR0FBRztBQUNwQyxnQkFBSSxDQUFDLElBQUksYUFBYTtBQUNwQixrQkFBSSxhQUFhO0FBQ2pCLGtCQUFJLFVBQVUsZ0JBQWdCLGtCQUFrQjtBQUNoRCxrQkFBSTtBQUFBLGdCQUNGLEtBQUssVUFBVTtBQUFBLGtCQUNiLE9BQU87QUFBQSxrQkFDUCxTQUFTLE9BQVEsS0FBZSxXQUFXLEdBQUc7QUFBQSxnQkFDaEQsQ0FBQztBQUFBLGNBQ0g7QUFBQSxZQUNGLE9BQU87QUFDTCxrQkFBSSxJQUFJO0FBQUEsWUFDVjtBQUFBLFVBQ0YsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjs7O0FoQjlCQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQztBQUFBLEVBQzlCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsibSIsICJVQSIsICJwYXRoIiwgIlVBIiwgImZldGNoSHRtbCIsICJleHRyYWN0TmV4dERhdGEiLCAibSIsICJVQSIsICJVQSIsICJDVVJSRU5DWV9NQVAiLCAiZmV0Y2hKc29uIiwgIm4iLCAiVUEiLCAiQ1VSUkVOQ1lfTUFQIiwgImZldGNoV2l0aFJldHJ5IiwgImZldGNoSnNvbiIsICJmZXRjaEh0bWwiLCAiVUEiLCAiVUEiLCAiZXh0cmFjdE5leHREYXRhIiwgInBhdGgiLCAidG90YWxTZWVuIiwgInJlcyJdCn0K
