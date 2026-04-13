"""
Refresh job: fetches the configured deals category and upserts rows in SQLite.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from .config import settings
from .models import Game
from .psn.client import PSNClient
from .psn.parser import normalize_product


async def refresh_category(session: Session) -> dict[str, Any]:
    """
    Returns a summary: {new, updated, disappeared, total_seen}.
    """
    seen_ids: set[str] = set()
    new_count = 0
    updated_count = 0
    now = datetime.utcnow()

    async with PSNClient(
        region=settings.psn_region,
        category_grid_hash=settings.psn_category_grid_hash,
    ) as client:
        async for raw in client.iter_category_products(
            settings.psn_deals_category_id
        ):
            normalized = normalize_product(raw.raw)
            if not normalized:
                continue
            gid = normalized["id"]
            seen_ids.add(gid)
            existing = session.get(Game, gid)
            if existing is None:
                session.add(
                    Game(
                        id=gid,
                        name=normalized["name"],
                        image_url=normalized["image_url"],
                        store_url=normalized["store_url"],
                        platforms=normalized["platforms"],
                        price_original_cents=normalized["price_original_cents"],
                        price_discounted_cents=normalized[
                            "price_discounted_cents"
                        ],
                        discount_percent=normalized["discount_percent"],
                        discount_end_at=normalized["discount_end_at"],
                        active=True,
                        first_seen_at=now,
                        last_seen_at=now,
                        updated_at=now,
                    )
                )
                new_count += 1
            else:
                existing.name = normalized["name"] or existing.name
                existing.image_url = normalized["image_url"] or existing.image_url
                existing.store_url = normalized["store_url"] or existing.store_url
                existing.platforms = normalized["platforms"]
                existing.price_original_cents = normalized[
                    "price_original_cents"
                ]
                existing.price_discounted_cents = normalized[
                    "price_discounted_cents"
                ]
                existing.discount_percent = normalized["discount_percent"]
                existing.discount_end_at = normalized["discount_end_at"]
                existing.active = True
                existing.last_seen_at = now
                existing.updated_at = now
                session.add(existing)
                updated_count += 1

    # Mark missing rows as inactive.
    disappeared = 0
    for g in session.exec(select(Game).where(Game.active == True)).all():  # noqa: E712
        if g.id not in seen_ids:
            g.active = False
            g.updated_at = now
            session.add(g)
            disappeared += 1

    session.commit()
    return {
        "new": new_count,
        "updated": updated_count,
        "disappeared": disappeared,
        "total_seen": len(seen_ids),
    }
