from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from ..db import get_session
from ..models import PricingSettings

router = APIRouter(prefix="/api", tags=["settings"])


class SettingsOut(BaseModel):
    usd_to_clp: float
    purchase_fee_pct: float
    primaria_1_mult: float
    primaria_2_mult: float
    secundaria_mult: float
    round_to: int


class SettingsPatch(BaseModel):
    usd_to_clp: Optional[float] = None
    purchase_fee_pct: Optional[float] = None
    primaria_1_mult: Optional[float] = None
    primaria_2_mult: Optional[float] = None
    secundaria_mult: Optional[float] = None
    round_to: Optional[int] = None


def _to_out(s: PricingSettings) -> SettingsOut:
    return SettingsOut(
        usd_to_clp=s.usd_to_clp,
        purchase_fee_pct=s.purchase_fee_pct,
        primaria_1_mult=s.primaria_1_mult,
        primaria_2_mult=s.primaria_2_mult,
        secundaria_mult=s.secundaria_mult,
        round_to=s.round_to,
    )


@router.get("/settings", response_model=SettingsOut)
def get_settings():
    with get_session() as session:
        s = session.exec(select(PricingSettings)).first()
        if not s:
            s = PricingSettings(id=1)
            session.add(s)
            session.commit()
            session.refresh(s)
        return _to_out(s)


@router.put("/settings", response_model=SettingsOut)
def put_settings(patch: SettingsPatch):
    with get_session() as session:
        s = session.exec(select(PricingSettings)).first()
        if not s:
            raise HTTPException(500, "Settings row missing")
        for field, value in patch.model_dump(exclude_none=True).items():
            setattr(s, field, value)
        session.add(s)
        session.commit()
        session.refresh(s)
        return _to_out(s)
