from __future__ import annotations

from dataclasses import dataclass

from .models import PricingSettings


@dataclass
class SalePrices:
    cost_clp: int
    primaria_1: int
    primaria_2: int
    secundaria: int


def _round_to(value: float, step: int) -> int:
    if step <= 0:
        return int(round(value))
    return int(round(value / step) * step)


def compute_sale_prices(
    price_cents_usd: int | None, cfg: PricingSettings
) -> SalePrices | None:
    """
    Given a PSN price in USD cents (the discounted price) and the current
    pricing settings, return the sale prices in CLP (integer pesos) for the
    three account variants plus the estimated purchase cost in CLP.

    Returns None if the input price is missing.
    """
    if price_cents_usd is None:
        return None
    price_usd = price_cents_usd / 100.0
    cost_clp = price_usd * cfg.usd_to_clp * (1.0 + cfg.purchase_fee_pct)
    return SalePrices(
        cost_clp=_round_to(cost_clp, cfg.round_to),
        primaria_1=_round_to(cost_clp * cfg.primaria_1_mult, cfg.round_to),
        primaria_2=_round_to(cost_clp * cfg.primaria_2_mult, cfg.round_to),
        secundaria=_round_to(cost_clp * cfg.secundaria_mult, cfg.round_to),
    )
