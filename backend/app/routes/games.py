from __future__ import annotations

import csv
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import select

from ..db import get_session
from ..models import Game, PricingSettings
from ..pricing import compute_sale_prices
from ..psn.client import PersistedQueryNotFound, PSNApiError
from ..refresh import refresh_category

router = APIRouter(prefix="/api", tags=["games"])


class GameOut(BaseModel):
    id: str
    name: str
    image_url: Optional[str]
    store_url: Optional[str]
    platforms: str
    price_original_usd: Optional[float]
    price_discounted_usd: Optional[float]
    discount_percent: int
    discount_end_at: Optional[str]
    selected: bool
    published: bool
    notes: str
    active: bool
    cost_clp: Optional[int]
    primaria_1: Optional[int]
    primaria_2: Optional[int]
    secundaria: Optional[int]


def _to_out(g: Game, cfg: PricingSettings) -> GameOut:
    sale = compute_sale_prices(g.price_discounted_cents, cfg)
    return GameOut(
        id=g.id,
        name=g.name,
        image_url=g.image_url,
        store_url=g.store_url,
        platforms=g.platforms,
        price_original_usd=(
            g.price_original_cents / 100.0 if g.price_original_cents else None
        ),
        price_discounted_usd=(
            g.price_discounted_cents / 100.0
            if g.price_discounted_cents
            else None
        ),
        discount_percent=g.discount_percent,
        discount_end_at=g.discount_end_at.isoformat() if g.discount_end_at else None,
        selected=g.selected,
        published=g.published,
        notes=g.notes,
        active=g.active,
        cost_clp=sale.cost_clp if sale else None,
        primaria_1=sale.primaria_1 if sale else None,
        primaria_2=sale.primaria_2 if sale else None,
        secundaria=sale.secundaria if sale else None,
    )


@router.get("/games", response_model=list[GameOut])
def list_games(
    search: Optional[str] = None,
    min_discount: int = 0,
    only_selected: bool = False,
    hide_published: bool = False,
    include_inactive: bool = False,
    sort: str = "discount",  # discount | price | name
):
    with get_session() as session:
        stmt = select(Game)
        if not include_inactive:
            stmt = stmt.where(Game.active == True)  # noqa: E712
        if min_discount > 0:
            stmt = stmt.where(Game.discount_percent >= min_discount)
        if only_selected:
            stmt = stmt.where(Game.selected == True)  # noqa: E712
        if hide_published:
            stmt = stmt.where(Game.published == False)  # noqa: E712
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(Game.name.ilike(like))  # type: ignore[attr-defined]

        games = list(session.exec(stmt).all())
        if sort == "price":
            games.sort(key=lambda g: g.price_discounted_cents or 0)
        elif sort == "name":
            games.sort(key=lambda g: g.name.lower())
        else:  # discount
            games.sort(key=lambda g: g.discount_percent, reverse=True)

        cfg = session.exec(select(PricingSettings)).first() or PricingSettings()
        return [_to_out(g, cfg) for g in games]


class GamePatch(BaseModel):
    selected: Optional[bool] = None
    published: Optional[bool] = None
    notes: Optional[str] = None


@router.patch("/games/{game_id}", response_model=GameOut)
def patch_game(game_id: str, patch: GamePatch):
    with get_session() as session:
        g = session.get(Game, game_id)
        if not g:
            raise HTTPException(404, "Game not found")
        if patch.selected is not None:
            g.selected = patch.selected
        if patch.published is not None:
            g.published = patch.published
        if patch.notes is not None:
            g.notes = patch.notes
        session.add(g)
        session.commit()
        session.refresh(g)
        cfg = session.exec(select(PricingSettings)).first() or PricingSettings()
        return _to_out(g, cfg)


@router.post("/refresh")
async def post_refresh():
    with get_session() as session:
        try:
            summary = await refresh_category(session)
        except PersistedQueryNotFound as e:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "persisted_query_not_found",
                    "message": str(e),
                    "hint": (
                        "Abre DevTools > Network en la página de ofertas de PS Store, "
                        "busca una request a /api/graphql/v1/op?operationName=categoryGridRetrieve "
                        "y actualiza PSN_CATEGORY_GRID_HASH en .env."
                    ),
                },
            )
        except PSNApiError as e:
            raise HTTPException(status_code=502, detail=str(e))
    return summary


@router.get("/games/export.csv")
def export_csv(only_selected: bool = True):
    with get_session() as session:
        stmt = select(Game).where(Game.active == True)  # noqa: E712
        if only_selected:
            stmt = stmt.where(Game.selected == True)  # noqa: E712
        games = list(session.exec(stmt).all())
        cfg = session.exec(select(PricingSettings)).first() or PricingSettings()

        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "id",
                "name",
                "platforms",
                "store_url",
                "price_original_usd",
                "price_discounted_usd",
                "discount_percent",
                "discount_end_at",
                "cost_clp",
                "primaria_1_clp",
                "primaria_2_clp",
                "secundaria_clp",
                "notes",
            ]
        )
        for g in games:
            sale = compute_sale_prices(g.price_discounted_cents, cfg)
            writer.writerow(
                [
                    g.id,
                    g.name,
                    g.platforms,
                    g.store_url or "",
                    f"{g.price_original_cents / 100:.2f}"
                    if g.price_original_cents
                    else "",
                    f"{g.price_discounted_cents / 100:.2f}"
                    if g.price_discounted_cents
                    else "",
                    g.discount_percent,
                    g.discount_end_at.isoformat() if g.discount_end_at else "",
                    sale.cost_clp if sale else "",
                    sale.primaria_1 if sale else "",
                    sale.primaria_2 if sale else "",
                    sale.secundaria if sale else "",
                    g.notes,
                ]
            )
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="apipsn-games.csv"'},
        )
