import type { PricingSettings } from "./store";

export interface SalePrices {
  costClp: number;
  primaria: number;
  secundaria: number;
  /** Revenue if both primaria slots sell + 1 secundaria */
  totalRevenue: number;
  /** Net profit from a full sell-through (2× primaria + 1× secundaria) */
  netProfit: number;
}

function roundTo(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}

/** Psychological pricing: rounds to nearest X.990 for consumer-facing prices.
 *  e.g. 14240 → 14990, 8800 → 8990, 3200 → 2990 */
function roundCommercial(value: number): number {
  if (value < 1000) return Math.round(value / 100) * 100;
  return Math.ceil(value / 1000) * 1000 - 10;
}

function exchangeRate(currency: string, cfg: PricingSettings): number {
  switch (currency) {
    case "BRL": return cfg.brlToClp;
    case "TRY": return cfg.tryToClp;
    case "JPY": return cfg.jpyToClp;
    case "USD":
    default:    return cfg.usdToClp;
  }
}

function balanceDiscount(currency: string, cfg: PricingSettings): number {
  switch (currency) {
    case "BRL": return cfg.balanceDiscountBrl ?? 1.0;
    case "TRY": return cfg.balanceDiscountTry ?? 1.0;
    case "USD":
    default:    return cfg.balanceDiscountUsd ?? 1.0;
  }
}

export function computeSalePrices(
  priceCents: number | null,
  cfg: PricingSettings,
  currency = "USD"
): SalePrices | null {
  if (priceCents == null) return null;
  const price = priceCents / 100;
  const rate = exchangeRate(currency, cfg);
  const discount = balanceDiscount(currency, cfg);
  const cost = price * discount * rate;
  const costClp = roundTo(cost, cfg.roundTo);

  const primariaRaw = cost * cfg.primariaMult;
  const secundariaRaw = cost * cfg.secundariaMult;

  const primaria = cfg.commercialRounding !== false
    ? roundCommercial(primariaRaw)
    : roundTo(primariaRaw, cfg.roundTo);
  const secundaria = cfg.commercialRounding !== false
    ? roundCommercial(secundariaRaw)
    : roundTo(secundariaRaw, cfg.roundTo);

  const totalRevenue = primaria * 2 + secundaria;
  return {
    costClp,
    primaria,
    secundaria,
    totalRevenue,
    netProfit: totalRevenue - costClp,
  };
}
