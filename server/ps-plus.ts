/**
 * PS Plus membership price tracker — multi-region.
 *
 * Tracks PS Plus SKUs across US, BR, and TR regions with:
 *   - Official PSN prices per region (hardcoded baseline)
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

interface RawPlan {
  tier: PlusTier;
  duration: PlusDuration;
  label: string;
  prices: { us: number; br: number; tr: number };
  searchTerms: string[];
}

// Official PS Plus prices per region (as of April 2026)
// US: USD, BR: BRL, TR: TRY
const PLUS_PLANS: RawPlan[] = [
  // Essential
  {
    tier: "essential", duration: "1m",
    label: "PS Plus Essential — 1 Mes",
    prices: { us: 9.99, br: 34.90, tr: 130 },
    searchTerms: ["playstation plus essential 1 mes", "ps plus essential 1 mes", "ps plus essential 1 month", "psn plus essential mensual"],
  },
  {
    tier: "essential", duration: "3m",
    label: "PS Plus Essential — 3 Meses",
    prices: { us: 24.99, br: 89.90, tr: 340 },
    searchTerms: ["playstation plus essential 3 meses", "ps plus essential 3 meses", "ps plus essential 3 month", "psn plus essential trimestral"],
  },
  {
    tier: "essential", duration: "12m",
    label: "PS Plus Essential — 12 Meses",
    prices: { us: 79.99, br: 199.90, tr: 900 },
    searchTerms: ["playstation plus essential 12 meses", "ps plus essential 12 meses", "ps plus essential 1 año", "ps plus essential anual", "ps plus essential 1 year"],
  },
  // Extra
  {
    tier: "extra", duration: "1m",
    label: "PS Plus Extra — 1 Mes",
    prices: { us: 14.99, br: 52.90, tr: 200 },
    searchTerms: ["playstation plus extra 1 mes", "ps plus extra 1 mes", "ps plus extra 1 month"],
  },
  {
    tier: "extra", duration: "3m",
    label: "PS Plus Extra — 3 Meses",
    prices: { us: 39.99, br: 139.90, tr: 530 },
    searchTerms: ["playstation plus extra 3 meses", "ps plus extra 3 meses", "ps plus extra 3 month"],
  },
  {
    tier: "extra", duration: "12m",
    label: "PS Plus Extra — 12 Meses",
    prices: { us: 134.99, br: 339.90, tr: 1400 },
    searchTerms: ["playstation plus extra 12 meses", "ps plus extra 12 meses", "ps plus extra 1 año", "ps plus extra anual"],
  },
  // Premium
  {
    tier: "premium", duration: "1m",
    label: "PS Plus Premium — 1 Mes",
    prices: { us: 17.99, br: 59.90, tr: 250 },
    searchTerms: ["playstation plus premium 1 mes", "ps plus premium 1 mes", "ps plus premium 1 month"],
  },
  {
    tier: "premium", duration: "3m",
    label: "PS Plus Premium — 3 Meses",
    prices: { us: 49.99, br: 165.90, tr: 650 },
    searchTerms: ["playstation plus premium 3 meses", "ps plus premium 3 meses", "ps plus premium 3 month"],
  },
  {
    tier: "premium", duration: "12m",
    label: "PS Plus Premium — 12 Meses",
    prices: { us: 159.99, br: 399.90, tr: 1700 },
    searchTerms: ["playstation plus premium 12 meses", "ps plus premium 12 meses", "ps plus premium 1 año", "ps plus premium anual"],
  },
];

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
  switch (currency) {
    case "BRL": rate = cfg.brlToClp; break;
    case "TRY": rate = cfg.tryToClp; break;
    default: rate = cfg.usdToClp; break;
  }
  return Math.round(price * rate * (1 + cfg.purchaseFeePct));
}

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

export function matchPlansWithCompetitors(
  products: CompetitorProduct[],
  cfg: PricingSettings
): PlusPlanWithMatches[] {
  return PLUS_PLANS.map((raw) => {
    // Build region prices with CLP estimates
    const regions: PlusRegion[] = ["us", "br", "tr"];
    const regionPrices: PlusRegionPrice[] = regions.map((r) => {
      const currency = REGION_CURRENCY[r];
      const price = raw.prices[r];
      return {
        region: r,
        currency,
        price,
        priceClp: toClp(price, currency, cfg),
      };
    });

    // Find cheapest region
    let cheapestRegion: PlusRegion | null = null;
    let cheapestClp: number | null = null;
    for (const rp of regionPrices) {
      if (rp.priceClp != null && (cheapestClp == null || rp.priceClp < cheapestClp)) {
        cheapestClp = rp.priceClp;
        cheapestRegion = rp.region;
      }
    }

    // Match competitors
    const matches: CompetitorMatch[] = [];
    for (const p of products) {
      const score = bestMatchScore(raw.searchTerms, p.title);
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
      tier: raw.tier,
      duration: raw.duration,
      label: raw.label,
      regionPrices,
      cheapestRegion,
      cheapestClp,
      searchTerms: raw.searchTerms,
      competitorMatches: top,
      bestPrice: top.length ? top[0].priceClp : null,
      bestStore: top.length ? top[0].storeKey : null,
    };
  });
}
