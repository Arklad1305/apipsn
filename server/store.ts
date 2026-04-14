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
  name: string;
  imageUrl: string | null;
  storeUrl: string | null;
  platforms: string;
  priceOriginalCents: number | null; // USD cents
  priceDiscountedCents: number | null; // USD cents
  discountPercent: number;
  discountEndAt: string | null; // ISO date
  selected: boolean;
  published: boolean;
  notes: string;
  /** Optional YouTube URL the user pastes manually. Used as a fallback for the
   *  ficha video when PSN doesn't expose a PROMO/VIDEO asset. */
  youtubeUrl: string;
  active: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
}

export interface PricingSettings {
  usdToClp: number;
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
  competitors: CompetitorConfig[];
  competitorProducts: Record<string, CompetitorProduct[]>;
  competitorMatches: Record<string, CompetitorMatch[]>;
  competitorRefreshedAt: Record<string, string>;
  productDetails: Record<string, ProductDetail>;
  watchlist: Record<string, WatchedGame>;
}

const DEFAULT_SETTINGS: PricingSettings = {
  usdToClp: 970,
  purchaseFeePct: 0.05,
  primaria1Mult: 1.8,
  primaria2Mult: 1.6,
  secundariaMult: 1.1,
  roundTo: 500,
};

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

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(): DbShape {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    const games = parsed.games ?? {};
    // Back-fill youtubeUrl on games persisted before the field existed.
    for (const g of Object.values(games)) {
      if (typeof (g as Game).youtubeUrl !== "string") (g as Game).youtubeUrl = "";
    }
    return {
      games,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      psn: { ...DEFAULT_PSN, ...(parsed.psn ?? {}) },
      competitors: parsed.competitors ?? [...DEFAULT_COMPETITORS],
      competitorProducts: parsed.competitorProducts ?? {},
      competitorMatches: parsed.competitorMatches ?? {},
      competitorRefreshedAt: parsed.competitorRefreshedAt ?? {},
      productDetails: parsed.productDetails ?? {},
      watchlist: parsed.watchlist ?? {},
    };
  } catch {
    return {
      games: {},
      settings: { ...DEFAULT_SETTINGS },
      psn: { ...DEFAULT_PSN },
      competitors: [...DEFAULT_COMPETITORS],
      competitorProducts: {},
      competitorMatches: {},
      competitorRefreshedAt: {},
      productDetails: {},
      watchlist: {},
    };
  }
}

let db: DbShape = load();
let saveTimer: NodeJS.Timeout | null = null;

function persist() {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 150);
}

export const store = {
  listGames(): Game[] {
    return Object.values(db.games);
  },
  getGame(id: string): Game | undefined {
    return db.games[id];
  },
  upsertGame(game: Game): void {
    db.games[game.id] = game;
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
  markInactiveIfMissing(seenIds: Set<string>): number {
    let n = 0;
    const now = new Date().toISOString();
    for (const g of Object.values(db.games)) {
      if (g.active && !seenIds.has(g.id)) {
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
  flush(): void {
    if (saveTimer) clearTimeout(saveTimer);
    persist();
  },
};
