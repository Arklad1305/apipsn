/**
 * JSON-file storage. Avoids native deps (better-sqlite3 breaks in WebContainers).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CompetitorConfig,
  CompetitorMatch,
  CompetitorProduct,
} from "./competitors";
import type { ProductDetail } from "./psn-product";
import type { Platform, ProviderSource } from "./providers/types";

/** A game the user is tracking even when it's not in the current Weekly Deals
 *  category. Every /refresh diffs these against the scrape and reports
 *  transitions (off_sale → on_sale) back to the client. */
export interface WatchedGame {
  id: string;
  name: string;
  addedAt: string;
  /** "unseen" = never found in any refresh yet. */
  lastStatus: "unseen" | "on_sale" | "off_sale";
  lastSeenOnSaleAt: string | null;
  lastPriceCents: number | null;
  lastDiscountPercent: number;
  notes: string;
}

export interface Game {
  id: string;
  platform: Platform;
  region: string;
  name: string;
  imageUrl: string | null;
  storeUrl: string | null;
  platforms: string;
  currency: string;
  priceOriginalCents: number | null;
  priceDiscountedCents: number | null;
  discountPercent: number;
  discountEndAt: string | null;
  selected: boolean;
  published: boolean;
  notes: string;
  youtubeUrl: string;
  active: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
}

export interface PricingSettings {
  usdToClp: number;
  brlToClp: number;
  tryToClp: number;
  jpyToClp: number;
  purchaseFeePct: number;
  primaria1Mult: number;
  primaria2Mult: number;
  secundariaMult: number;
  roundTo: number;
}

export interface PsnConfig {
  region: string;
  dealsCategoryId: string;
  categoryGridHash: string;
  /** When false, filter out DLC, currency, avatars, themes, subscriptions.
   *  Default false — we almost always want just the playable games. */
  includeAddOns: boolean;
}

interface DbShape {
  games: Record<string, Game>;
  settings: PricingSettings;
  psn: PsnConfig;
  sources: ProviderSource[];
  competitors: CompetitorConfig[];
  competitorProducts: Record<string, CompetitorProduct[]>;
  competitorMatches: Record<string, CompetitorMatch[]>;
  competitorRefreshedAt: Record<string, string>;
  productDetails: Record<string, ProductDetail>;
  watchlist: Record<string, WatchedGame>;
}

const DEFAULT_SETTINGS: PricingSettings = {
  usdToClp: 970,
  brlToClp: 170,
  tryToClp: 28,
  jpyToClp: 6.5,
  purchaseFeePct: 0.05,
  primaria1Mult: 1.8,
  primaria2Mult: 1.6,
  secundariaMult: 1.1,
  roundTo: 500,
};

const DEFAULT_SOURCES: ProviderSource[] = [
  { platform: "psn", region: "us", enabled: true, categoryId: "" },
  { platform: "psn", region: "br", enabled: true, categoryId: "3f772501-f6f8-49b7-abac-874a88ca4897" },
  { platform: "xbox", region: "us", enabled: true },
  { platform: "xbox", region: "br", enabled: true },
  { platform: "xbox", region: "tr", enabled: true },
  { platform: "nintendo", region: "us", enabled: true },
  { platform: "nintendo", region: "jp", enabled: false },
  { platform: "steam", region: "us", enabled: true },
  { platform: "steam", region: "br", enabled: true },
  { platform: "steam", region: "tr", enabled: true },
];

const DEFAULT_COMPETITORS: CompetitorConfig[] = [
  { key: "cjm", label: "CJM Digitales", domain: "cjmdigitales.cl", type: "shopify", enabled: true },
  { key: "juegosdigitaleschile", label: "Juegos Digitales Chile", domain: "juegosdigitaleschile.com", type: "html", enabled: true },
  { key: "mj", label: "MJ Digitales", domain: "mjdigitales.cl", type: "shopify", enabled: true },
  { key: "infinity", label: "Infinity Games Chile", domain: "infinitygameschile.cl", type: "html", enabled: true },
];

const DEFAULT_PSN: PsnConfig = {
  region: "en-US",
  // Placeholder IDs — the user configures the real ones from DevTools.
  // Panel > Ajustes expone ambos.
  dealsCategoryId: "3f772501-f6f8-49b7-abac-874a88ca4897",
  // Unused by the HTML scraper. Kept for reference in case we ever add a
  // GraphQL fallback. Current value captured from DevTools on 2026-04-13.
  categoryGridHash:
    "257713466fc3264850aa473409a29088e3a4115e6e69e9fb3e061c8dd5b9f5c6",
  includeAddOns: false,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, "../data/apipsn.json");
const TMP_FILE = path.resolve(__dirname, "../data/apipsn.json.tmp");
const BACKUP_FILE = path.resolve(__dirname, "../data/apipsn.backup.json");

/** Simple write-lock: prevents overlapping writes. */
let writing = false;
let pendingWrite = false;

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function migrateGames(games: Record<string, Game>): Record<string, Game> {
  const migrated: Record<string, Game> = {};
  for (const [key, g] of Object.entries(games)) {
    if (typeof g.youtubeUrl !== "string") g.youtubeUrl = "";
    if (!g.platform) g.platform = "psn";
    if (!g.region) g.region = "us";
    if (!g.currency) g.currency = "USD";
    // Re-key old PSN entries to composite key
    const compositeKey = `${g.platform}:${g.region}:${g.id}`;
    if (key === g.id && key !== compositeKey) {
      migrated[compositeKey] = g;
    } else {
      migrated[key] = g;
    }
  }
  return migrated;
}

function migrateSources(
  sources: ProviderSource[] | undefined,
  psn: PsnConfig
): ProviderSource[] {
  const existing = sources && sources.length > 0 ? [...sources] : [];
  const existingKeys = new Set(existing.map((s) => `${s.platform}:${s.region}`));

  // Always merge missing sources from defaults
  for (const def of DEFAULT_SOURCES) {
    const key = `${def.platform}:${def.region}`;
    if (!existingKeys.has(key)) {
      existing.push({ ...def });
    } else if (def.enabled) {
      const src = existing.find((s) => s.platform === def.platform && s.region === def.region);
      if (src && !src.enabled) src.enabled = true;
    }
  }

  // Carry over existing PSN category ID if sources were empty
  if ((!sources || sources.length === 0) && psn.dealsCategoryId) {
    const psnUs = existing.find((s) => s.platform === "psn" && s.region === "us");
    if (psnUs && !psnUs.categoryId) {
      psnUs.categoryId = psn.dealsCategoryId;
    }
  }

  return existing;
}

function buildDb(parsed: Partial<DbShape>): DbShape {
  const psn = { ...DEFAULT_PSN, ...(parsed.psn ?? {}) };
  const games = migrateGames(parsed.games ?? {});
  return {
    games,
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    psn,
    sources: migrateSources(parsed.sources, psn),
    competitors: parsed.competitors ?? [...DEFAULT_COMPETITORS],
    competitorProducts: parsed.competitorProducts ?? {},
    competitorMatches: parsed.competitorMatches ?? {},
    competitorRefreshedAt: parsed.competitorRefreshedAt ?? {},
    productDetails: parsed.productDetails ?? {},
    watchlist: parsed.watchlist ?? {},
  };
}

function emptyDb(): DbShape {
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
  };
}

function load(): DbShape {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    try {
      const parsed = JSON.parse(raw) as Partial<DbShape>;
      return buildDb(parsed);
    } catch {
      // Main file is corrupted — try backup
      console.warn("[store] Main data file corrupted, loading backup");
      try {
        const backupRaw = fs.readFileSync(BACKUP_FILE, "utf-8");
        const backupParsed = JSON.parse(backupRaw) as Partial<DbShape>;
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
    if (ageMs > 60 * 60 * 1000) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }
  } catch {
    // File may not exist yet — nothing to back up.
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

let db: DbShape = load();
let saveTimer: NodeJS.Timeout | null = null;

// Persist migrated data on first load so new sources/fields are saved
try { persist(); } catch { /* ignore */ }

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 150);
}

function gameKey(platform: Platform, region: string, id: string): string {
  return `${platform}:${region}:${id}`;
}

export const store = {
  listGames(): Game[] {
    return Object.values(db.games);
  },
  getGame(id: string): Game | undefined {
    return db.games[id];
  },
  getGameByComposite(platform: Platform, region: string, id: string): Game | undefined {
    return db.games[gameKey(platform, region, id)];
  },
  upsertGame(game: Game): void {
    const key = gameKey(game.platform, game.region, game.id);
    db.games[key] = game;
    scheduleSave();
  },
  patchGame(id: string, patch: Partial<Game>): Game | undefined {
    const existing = db.games[id];
    if (!existing) return undefined;
    const updated: Game = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    db.games[id] = updated;
    scheduleSave();
    return updated;
  },
  markInactiveIfMissing(seenKeys: Set<string>, platform?: Platform, region?: string): number {
    let n = 0;
    const now = new Date().toISOString();
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
  getSettings(): PricingSettings {
    return { ...db.settings };
  },
  updateSettings(patch: Partial<PricingSettings>): PricingSettings {
    db.settings = { ...db.settings, ...patch };
    scheduleSave();
    return { ...db.settings };
  },
  getPsn(): PsnConfig {
    return { ...db.psn };
  },
  updatePsn(patch: Partial<PsnConfig>): PsnConfig {
    db.psn = { ...db.psn, ...patch };
    scheduleSave();
    return { ...db.psn };
  },
  getCompetitors(): CompetitorConfig[] {
    return db.competitors.map((c) => ({ ...c }));
  },
  setCompetitors(list: CompetitorConfig[]): CompetitorConfig[] {
    db.competitors = list.map((c) => ({ ...c }));
    scheduleSave();
    return db.competitors.map((c) => ({ ...c }));
  },
  setCompetitorProducts(key: string, products: CompetitorProduct[], refreshedAt: string): void {
    db.competitorProducts[key] = products;
    db.competitorRefreshedAt[key] = refreshedAt;
    scheduleSave();
  },
  getAllCompetitorProducts(enabledOnly = true): CompetitorProduct[] {
    const enabled = new Set(
      db.competitors.filter((c) => !enabledOnly || c.enabled).map((c) => c.key)
    );
    const out: CompetitorProduct[] = [];
    for (const [key, list] of Object.entries(db.competitorProducts)) {
      if (!enabled.has(key)) continue;
      for (const p of list) out.push(p);
    }
    return out;
  },
  getCompetitorRefreshedAt(): Record<string, string> {
    return { ...db.competitorRefreshedAt };
  },
  setCompetitorMatches(matches: Record<string, CompetitorMatch[]>): void {
    db.competitorMatches = matches;
    scheduleSave();
  },
  getCompetitorMatches(gameId: string): CompetitorMatch[] {
    return db.competitorMatches[gameId] ?? [];
  },
  getProductDetail(id: string): ProductDetail | undefined {
    return db.productDetails[id];
  },
  setProductDetail(id: string, detail: ProductDetail): void {
    db.productDetails[id] = detail;
    scheduleSave();
  },
  listWatchlist(): WatchedGame[] {
    return Object.values(db.watchlist);
  },
  getWatched(id: string): WatchedGame | undefined {
    return db.watchlist[id];
  },
  upsertWatched(entry: WatchedGame): WatchedGame {
    db.watchlist[entry.id] = entry;
    scheduleSave();
    return { ...entry };
  },
  patchWatched(id: string, patch: Partial<WatchedGame>): WatchedGame | undefined {
    const existing = db.watchlist[id];
    if (!existing) return undefined;
    const updated: WatchedGame = { ...existing, ...patch };
    db.watchlist[id] = updated;
    scheduleSave();
    return updated;
  },
  removeWatched(id: string): boolean {
    if (!db.watchlist[id]) return false;
    delete db.watchlist[id];
    scheduleSave();
    return true;
  },
  getSources(): ProviderSource[] {
    return db.sources.map((s) => ({ ...s }));
  },
  setSources(list: ProviderSource[]): ProviderSource[] {
    db.sources = list.map((s) => ({ ...s }));
    scheduleSave();
    return db.sources.map((s) => ({ ...s }));
  },
  flush(): void {
    if (saveTimer) clearTimeout(saveTimer);
    persist();
  },
};
