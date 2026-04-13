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

/**
 * Given a USD price in cents (the discounted PSN price) and the pricing config,
 * return the estimated CLP purchase cost and the three sale prices rounded to
 * `roundTo` pesos.
 */
export function computeSalePrices(
  priceCentsUsd: number | null,
  cfg: PricingSettings
): SalePrices | null {
  if (priceCentsUsd == null) return null;
  const priceUsd = priceCentsUsd / 100;
  const cost = priceUsd * cfg.usdToClp * (1 + cfg.purchaseFeePct);
  return {
    costClp: roundTo(cost, cfg.roundTo),
    primaria1: roundTo(cost * cfg.primaria1Mult, cfg.roundTo),
    primaria2: roundTo(cost * cfg.primaria2Mult, cfg.roundTo),
    secundaria: roundTo(cost * cfg.secundariaMult, cfg.roundTo),
  };
}
