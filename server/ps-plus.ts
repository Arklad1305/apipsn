/**
 * PS Plus membership price tracker — multi-region.
 *
 * Tracks PS Plus SKUs across US, BR, and TR regions with:
 *   - Prices scraped from playstation.com (with hardcoded fallbacks)
 *   - Estimated CLP cost using configured exchange rates + purchase fee
 *   - Competitor prices (fuzzy-matched from existing competitor products)
 */
import { tokenize, similarity } from "./competitors";
import type { CompetitorProduct, CompetitorMatch } from "./competitors";
import type { PricingSettings } from "./store";

export type PlusTier = "essential" | "extra" | "premium";
export type PlusDuration = "1m" | "3m" | "12m";
export type PlusRegion = "us" | "br" | "tr";

export interface PlusRegionPrice {
  region: PlusRegion;
  currency: string;
  price: number;
  priceClp: number | null;
}

export interface PlusPlan {
  tier: PlusTier;
  duration: PlusDuration;
  label: string;
  regionPrices: PlusRegionPrice[];
  cheapestRegion: PlusRegion | null;
  cheapestClp: number | null;
  searchTerms: string[];
}

export interface PlusPlanWithMatches extends PlusPlan {
  competitorMatches: CompetitorMatch[];
  bestPrice: number | null;
  bestStore: string | null;
}

export interface ScrapedPlusPrices {
  /** region → tier → duration → price in local currency */
  prices: Record<PlusRegion, Record<PlusTier, Record<PlusDuration, number>>>;
  scrapedAt: string;
  errors: string[];
}

interface PlanDef {
  tier: PlusTier;
  duration: PlusDuration;
  label: string;
  searchTerms: string[];
}

const PLAN_DEFS: PlanDef[] = [
  { tier: "essential", duration: "1m",  label: "PS Plus Essential — 1 Mes",    searchTerms: ["playstation plus essential 1 mes", "ps plus essential 1 mes", "ps plus essential 1 month", "psn plus essential mensual"] },
  { tier: "essential", duration: "3m",  label: "PS Plus Essential — 3 Meses",  searchTerms: ["playstation plus essential 3 meses", "ps plus essential 3 meses", "ps plus essential 3 month", "psn plus essential trimestral"] },
  { tier: "essential", duration: "12m", label: "PS Plus Essential — 12 Meses", searchTerms: ["playstation plus essential 12 meses", "ps plus essential 12 meses", "ps plus essential 1 año", "ps plus essential anual", "ps plus essential 1 year"] },
  { tier: "extra",     duration: "1m",  label: "PS Plus Extra — 1 Mes",        searchTerms: ["playstation plus extra 1 mes", "ps plus extra 1 mes", "ps plus extra 1 month"] },
  { tier: "extra",     duration: "3m",  label: "PS Plus Extra — 3 Meses",      searchTerms: ["playstation plus extra 3 meses", "ps plus extra 3 meses", "ps plus extra 3 month"] },
  { tier: "extra",     duration: "12m", label: "PS Plus Extra — 12 Meses",     searchTerms: ["playstation plus extra 12 meses", "ps plus extra 12 meses", "ps plus extra 1 año", "ps plus extra anual"] },
  { tier: "premium",   duration: "1m",  label: "PS Plus Premium — 1 Mes",      searchTerms: ["playstation plus premium 1 mes", "ps plus premium 1 mes", "ps plus premium 1 month"] },
  { tier: "premium",   duration: "3m",  label: "PS Plus Premium — 3 Meses",    searchTerms: ["playstation plus premium 3 meses", "ps plus premium 3 meses", "ps plus premium 3 month"] },
  { tier: "premium",   duration: "12m", label: "PS Plus Premium — 12 Meses",   searchTerms: ["playstation plus premium 12 meses", "ps plus premium 12 meses", "ps plus premium 1 año", "ps plus premium anual"] },
];

// Fallback prices if scraping fails (last known good values)
const FALLBACK_PRICES: Record<PlusRegion, Record<PlusTier, Record<PlusDuration, number>>> = {
  us: {
    essential: { "1m": 9.99,  "3m": 24.99,  "12m": 79.99 },
    extra:     { "1m": 14.99, "3m": 39.99,  "12m": 134.99 },
    premium:   { "1m": 17.99, "3m": 49.99,  "12m": 159.99 },
  },
  br: {
    essential: { "1m": 34.90,  "3m": 89.90,   "12m": 199.90 },
    extra:     { "1m": 52.90,  "3m": 139.90,  "12m": 339.90 },
    premium:   { "1m": 59.90,  "3m": 165.90,  "12m": 399.90 },
  },
  tr: {
    essential: { "1m": 130,  "3m": 340,   "12m": 900 },
    extra:     { "1m": 200,  "3m": 530,   "12m": 1400 },
    premium:   { "1m": 250,  "3m": 650,   "12m": 1700 },
  },
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const REGION_LOCALE: Record<PlusRegion, string> = {
  us: "en-us",
  br: "pt-br",
  tr: "en-tr",
};

const REGION_CURRENCY: Record<PlusRegion, string> = {
  us: "USD",
  br: "BRL",
  tr: "TRY",
};

const REGION_LABELS: Record<PlusRegion, string> = {
  us: "US",
  br: "Brasil",
  tr: "Turquía",
};

export { REGION_LABELS as PLUS_REGION_LABELS };

const TIER_ORDER: PlusTier[] = ["essential", "extra", "premium"];
const DURATION_ORDER: PlusDuration[] = ["1m", "3m", "12m"];

// --- Scraper ---

async function fetchPsPlusPage(region: PlusRegion): Promise<string> {
  const locale = REGION_LOCALE[region];
  const url = `https://www.playstation.com/${locale}/ps-plus/`;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": region === "br" ? "pt-BR,pt;q=0.9" : "en-US,en;q=0.9",
        },
      });
      if (r.status === 403) throw new Error(`403 Forbidden (${url})`);
      if (!r.ok) throw new Error(`HTTP ${r.status} (${url})`);
      return await r.text();
    } catch (e) {
      lastErr = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw new Error(`Failed to fetch PS Plus page for ${region}: ${(lastErr as Error)?.message || lastErr}`);
}

function extractNextData(html: string): any | null {
  const m = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function parsePrice(raw: string): number | null {
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

const TIER_PATTERNS: Record<PlusTier, RegExp> = {
  essential: /essential/i,
  extra: /extra/i,
  premium: /premium|deluxe/i,
};

const DURATION_PATTERNS: Record<PlusDuration, RegExp> = {
  "1m": /\b1\s*(?:month|mes|m(?:ê|e)s|ay)\b/i,
  "3m": /\b3\s*(?:month|mes|m(?:ê|e)s|meses|ay)\b/i,
  "12m": /\b(?:12\s*(?:month|mes|m(?:ê|e)s|meses|ay)|1\s*(?:year|año|ano))\b/i,
};

function classifyTier(text: string): PlusTier | null {
  for (const t of TIER_ORDER) {
    if (TIER_PATTERNS[t].test(text)) return t;
  }
  return null;
}

function classifyDuration(text: string): PlusDuration | null {
  for (const d of DURATION_ORDER) {
    if (DURATION_PATTERNS[d].test(text)) return d;
  }
  return null;
}

function walkForPrices(
  node: unknown,
  results: Map<string, number>,
  depth = 0
): void {
  if (depth > 30 || !node) return;
  if (Array.isArray(node)) {
    for (const item of node) walkForPrices(item, results, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  const name = String(obj.name || obj.title || obj.label || obj.planName || "");
  const priceStr = String(
    obj.price || obj.formattedPrice || obj.displayPrice ||
    obj.basePrice || obj.basePriceValue || ""
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

function extractFromHtmlFallback(
  html: string,
  region: PlusRegion
): Map<string, number> {
  const results = new Map<string, number>();

  const priceRe = region === "br"
    ? /R\$\s*([\d.,]+)/g
    : region === "tr"
    ? /(?:₺|TL|TRY)\s*([\d.,]+)/g
    : /\$\s*([\d.,]+)/g;

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

function parsePsPlusHtml(
  html: string,
  region: PlusRegion
): Record<PlusTier, Record<PlusDuration, number>> | null {
  const result: Record<string, Record<string, number>> = {};

  const nextData = extractNextData(html);
  let found = new Map<string, number>();

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

  return result as Record<PlusTier, Record<PlusDuration, number>>;
}

export async function scrapePsPlusPrices(): Promise<ScrapedPlusPrices> {
  const regions: PlusRegion[] = ["us", "br", "tr"];
  const prices = structuredClone(FALLBACK_PRICES);
  const errors: string[] = [];

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
          errors.push(`${region.toUpperCase()}: página cargada pero no se encontraron precios, usando valores de respaldo`);
        } else if (count < 9) {
          errors.push(`${region.toUpperCase()}: solo ${count}/9 precios extraídos, el resto usa respaldo`);
        }
      } else {
        errors.push(`${region.toUpperCase()}: no se pudo parsear la página, usando valores de respaldo`);
      }
    } catch (e) {
      errors.push(`${region.toUpperCase()}: ${(e as Error).message}`);
    }
  }

  return { prices, scrapedAt: new Date().toISOString(), errors };
}

// --- Price computation ---

const PLUS_MATCH_THRESHOLD = 0.45;

function bestMatchScore(searchTerms: string[], productTitle: string): number {
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

function toClp(price: number, currency: string, cfg: PricingSettings): number {
  let rate: number;
  let discount: number;
  switch (currency) {
    case "BRL": rate = cfg.brlToClp; discount = cfg.balanceDiscountBrl ?? 1.0; break;
    case "TRY": rate = cfg.tryToClp; discount = cfg.balanceDiscountTry ?? 1.0; break;
    default:    rate = cfg.usdToClp; discount = cfg.balanceDiscountUsd ?? 1.0; break;
  }
  return Math.round(price * discount * rate);
}

export function matchPlansWithCompetitors(
  products: CompetitorProduct[],
  cfg: PricingSettings,
  scraped?: ScrapedPlusPrices | null
): PlusPlanWithMatches[] {
  const priceData = scraped?.prices ?? FALLBACK_PRICES;

  return PLAN_DEFS.map((def) => {
    const regions: PlusRegion[] = ["us", "br", "tr"];
    const regionPrices: PlusRegionPrice[] = regions.map((r) => {
      const currency = REGION_CURRENCY[r];
      const price = priceData[r]?.[def.tier]?.[def.duration] ?? FALLBACK_PRICES[r][def.tier][def.duration];
      return {
        region: r,
        currency,
        price,
        priceClp: toClp(price, currency, cfg),
      };
    });

    let cheapestRegion: PlusRegion | null = null;
    let cheapestClp: number | null = null;
    for (const rp of regionPrices) {
      if (rp.priceClp != null && (cheapestClp == null || rp.priceClp < cheapestClp)) {
        cheapestClp = rp.priceClp;
        cheapestRegion = rp.region;
      }
    }

    const matches: CompetitorMatch[] = [];
    for (const p of products) {
      const score = bestMatchScore(def.searchTerms, p.title);
      if (score >= PLUS_MATCH_THRESHOLD) {
        matches.push({
          storeKey: p.storeKey,
          title: p.title,
          url: p.url,
          priceClp: p.priceClp,
          available: p.available,
          score,
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
      bestStore: top.length ? top[0].storeKey : null,
    };
  });
}
