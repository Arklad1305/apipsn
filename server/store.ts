/**
 * JSON-file storage. Avoids native deps (better-sqlite3 breaks in WebContainers).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
}

interface DbShape {
  games: Record<string, Game>;
  settings: PricingSettings;
  psn: PsnConfig;
}

const DEFAULT_SETTINGS: PricingSettings = {
  usdToClp: 970,
  purchaseFeePct: 0.05,
  primaria1Mult: 1.8,
  primaria2Mult: 1.6,
  secundariaMult: 1.1,
  roundTo: 500,
};

const DEFAULT_PSN: PsnConfig = {
  region: "en-US",
  // Placeholder IDs — the user configures the real ones from DevTools.
  // Panel > Ajustes expone ambos.
  dealsCategoryId: "3f772501-f6f8-49b7-abac-874a88ca4897",
  // Unused by the HTML scraper. Kept for reference in case we ever add a
  // GraphQL fallback. Current value captured from DevTools on 2026-04-13.
  categoryGridHash:
    "257713466fc3264850aa473409a29088e3a4115e6e69e9fb3e061c8dd5b9f5c6",
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
    return {
      games: parsed.games ?? {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      psn: { ...DEFAULT_PSN, ...(parsed.psn ?? {}) },
    };
  } catch {
    return { games: {}, settings: { ...DEFAULT_SETTINGS }, psn: { ...DEFAULT_PSN } };
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
  flush(): void {
    if (saveTimer) clearTimeout(saveTimer);
    persist();
  },
};
