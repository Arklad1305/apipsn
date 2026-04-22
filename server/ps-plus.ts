/**
 * PS Plus membership price tracker.
 *
 * Tracks the 9 PS Plus SKUs (3 tiers × 3 durations) with:
 *   - Official PSN prices (hardcoded baseline, updated manually)
 *   - Competitor prices (fuzzy-matched from existing competitor products)
 *
 * Competitor stores sell PS Plus as gift cards/codes with titles like:
 *   "PlayStation Plus Essential 12 Meses", "PS Plus Extra 3 Meses", etc.
 */
import { tokenize, similarity } from "./competitors";
import type { CompetitorProduct, CompetitorMatch } from "./competitors";

export type PlusTier = "essential" | "extra" | "premium";
export type PlusDuration = "1m" | "3m" | "12m";

export interface PlusPlan {
  tier: PlusTier;
  duration: PlusDuration;
  label: string;
  officialPriceUsd: number | null;
  officialPriceClp: number | null;
  searchTerms: string[];
}

export interface PlusPlanWithMatches extends PlusPlan {
  competitorMatches: CompetitorMatch[];
  bestPrice: number | null;
  bestStore: string | null;
}

const PLUS_PLANS: PlusPlan[] = [
  {
    tier: "essential",
    duration: "1m",
    label: "PS Plus Essential — 1 Mes",
    officialPriceUsd: 9.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus essential 1 mes", "ps plus essential 1 mes", "ps plus essential 1 month", "psn plus essential mensual"],
  },
  {
    tier: "essential",
    duration: "3m",
    label: "PS Plus Essential — 3 Meses",
    officialPriceUsd: 24.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus essential 3 meses", "ps plus essential 3 meses", "ps plus essential 3 month", "psn plus essential trimestral"],
  },
  {
    tier: "essential",
    duration: "12m",
    label: "PS Plus Essential — 12 Meses",
    officialPriceUsd: 79.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus essential 12 meses", "ps plus essential 12 meses", "ps plus essential 1 año", "ps plus essential anual", "ps plus essential 1 year"],
  },
  {
    tier: "extra",
    duration: "1m",
    label: "PS Plus Extra — 1 Mes",
    officialPriceUsd: 14.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus extra 1 mes", "ps plus extra 1 mes", "ps plus extra 1 month"],
  },
  {
    tier: "extra",
    duration: "3m",
    label: "PS Plus Extra — 3 Meses",
    officialPriceUsd: 39.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus extra 3 meses", "ps plus extra 3 meses", "ps plus extra 3 month"],
  },
  {
    tier: "extra",
    duration: "12m",
    label: "PS Plus Extra — 12 Meses",
    officialPriceUsd: 134.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus extra 12 meses", "ps plus extra 12 meses", "ps plus extra 1 año", "ps plus extra anual"],
  },
  {
    tier: "premium",
    duration: "1m",
    label: "PS Plus Premium — 1 Mes",
    officialPriceUsd: 17.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus premium 1 mes", "ps plus premium 1 mes", "ps plus premium 1 month"],
  },
  {
    tier: "premium",
    duration: "3m",
    label: "PS Plus Premium — 3 Meses",
    officialPriceUsd: 49.99,
    officialPriceClp: null,
    searchTerms: ["playstation plus premium 3 meses", "ps plus premium 3 meses", "ps plus premium 3 month"],
  },
  {
    tier: "premium",
    duration: "12m",
    label: "PS Plus Premium — 12 Meses",
    officialPriceUsd: 159.99,
    officialPriceClp: null,
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

export function getPlans(): PlusPlan[] {
  return PLUS_PLANS.map((p) => ({ ...p }));
}

export function matchPlansWithCompetitors(
  products: CompetitorProduct[],
  usdToClp: number
): PlusPlanWithMatches[] {
  return PLUS_PLANS.map((plan) => {
    const matches: CompetitorMatch[] = [];

    for (const p of products) {
      const score = bestMatchScore(plan.searchTerms, p.title);
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

    const officialClp = plan.officialPriceUsd
      ? Math.round(plan.officialPriceUsd * usdToClp)
      : null;

    return {
      ...plan,
      officialPriceClp: officialClp,
      competitorMatches: top,
      bestPrice: top.length ? top[0].priceClp : null,
      bestStore: top.length ? top[0].storeKey : null,
    };
  });
}
