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
  const primaria = roundTo(cost * cfg.primariaMult, cfg.roundTo);
  const secundaria = roundTo(cost * cfg.secundariaMult, cfg.roundTo);
  const totalRevenue = primaria * 2 + secundaria;
  return {
    costClp: roundTo(cost, cfg.roundTo),
    primaria,
    secundaria,
    totalRevenue,
    netProfit: totalRevenue - roundTo(cost, cfg.roundTo),
  };
}
