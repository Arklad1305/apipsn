"""
Normalize the raw GraphQL product payload into a flat dict the rest of the app uses.
PSN's product schema is nested: price info lives inside webctas[0].price.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any


_PRICE_RE = re.compile(r"([0-9]+(?:[.,][0-9]+)?)")


def _parse_price_to_cents(value: Any) -> int | None:
    """
    Convert '$19.99' / '19,99 €' / '$1,299.00' to cents as int.
    Returns None for 'Free' / empty / unparseable.
    """
    if value is None:
        return None
    s = str(value).strip()
    if not s or s.lower() in {"free", "gratis", "$0.00", "$0"}:
        # Keep real 0 prices as 0 only if the field was numeric; 'Free' => None to ignore.
        if s.lower() in {"free", "gratis"}:
            return None
    # Keep digits and the last separator as the decimal.
    cleaned = s.replace(",", ".")
    # If multiple dots, assume the last is decimal.
    parts = cleaned.split(".")
    if len(parts) > 2:
        cleaned = "".join(parts[:-1]) + "." + parts[-1]
    m = _PRICE_RE.search(cleaned)
    if not m:
        return None
    try:
        return int(round(float(m.group(1)) * 100))
    except ValueError:
        return None


def _parse_iso_dt(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        s = str(value).replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def normalize_product(raw: dict) -> dict | None:
    """
    Map a raw PSN product dict to our Game fields. Returns None if the product
    has no usable id.
    """
    pid = raw.get("id") or raw.get("productId") or raw.get("conceptId")
    if not pid:
        return None

    name = raw.get("name") or raw.get("title") or ""

    # Image: prefer a square boxart if available.
    image_url = None
    for media in raw.get("media") or []:
        if not isinstance(media, dict):
            continue
        if media.get("role") in {"MASTER", "PREVIEW_GAME_ART", "BOXART"}:
            image_url = media.get("url")
            if image_url:
                break
    if not image_url and raw.get("media"):
        first = raw["media"][0]
        if isinstance(first, dict):
            image_url = first.get("url")

    platforms = raw.get("platforms") or []
    if isinstance(platforms, str):
        platforms = [platforms]

    # Price info is under webctas[0].price for category grid entries.
    price_original_cents = None
    price_discounted_cents = None
    discount_percent = None
    discount_end_at = None
    webctas = raw.get("webctas") or []
    if webctas and isinstance(webctas[0], dict):
        price = webctas[0].get("price") or {}
        price_original_cents = _parse_price_to_cents(
            price.get("basePriceValue") or price.get("basePrice")
        )
        price_discounted_cents = _parse_price_to_cents(
            price.get("discountedValue") or price.get("discountedPrice")
        )
        # discountText is usually like "-30%"
        dt = price.get("discountText") or ""
        m = re.search(r"(\d+)", str(dt))
        if m:
            discount_percent = int(m.group(1))
        discount_end_at = _parse_iso_dt(price.get("endTime"))

    # Fallback: if there is no discount, reuse original as discounted.
    if price_discounted_cents is None:
        price_discounted_cents = price_original_cents

    # Compute discount % if not present.
    if (
        discount_percent is None
        and price_original_cents
        and price_discounted_cents is not None
        and price_original_cents > 0
        and price_discounted_cents < price_original_cents
    ):
        discount_percent = int(
            round(
                (price_original_cents - price_discounted_cents)
                * 100
                / price_original_cents
            )
        )

    return {
        "id": str(pid),
        "name": name,
        "image_url": image_url,
        "platforms": ",".join(str(p) for p in platforms) if platforms else "",
        "price_original_cents": price_original_cents,
        "price_discounted_cents": price_discounted_cents,
        "discount_percent": discount_percent or 0,
        "discount_end_at": discount_end_at,
        "store_url": f"https://store.playstation.com/en-us/product/{pid}",
    }
