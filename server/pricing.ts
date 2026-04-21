import type { PricingSettings } from "./store";

export interface SalePrices {
  costClp: number;
  primaria1: number;
  primaria2: number;
  secundaria: number;
}

function roundTo(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}

function exchangeRate(currency: string, cfg: PricingSettings): number {
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

export function computeSalePrices(
  priceCents: number | null,
  cfg: PricingSettings,
  currency = "USD"
): SalePrices | null {
  if (priceCents == null) return null;
  const price = priceCents / 100;
  const rate = exchangeRate(currency, cfg);
  const cost = price * rate * (1 + cfg.purchaseFeePct);
  return {
    costClp: roundTo(cost, cfg.roundTo),
    primaria1: roundTo(cost * cfg.primaria1Mult, cfg.roundTo),
    primaria2: roundTo(cost * cfg.primaria2Mult, cfg.roundTo),
    secundaria: roundTo(cost * cfg.secundariaMult, cfg.roundTo),
  };
}
