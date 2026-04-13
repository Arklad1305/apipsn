from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Game(SQLModel, table=True):
    id: str = Field(primary_key=True)  # PSN product id (concept id or CUSA)
    name: str
    image_url: Optional[str] = None
    store_url: Optional[str] = None
    platforms: str = ""

    price_original_cents: Optional[int] = None  # USD cents
    price_discounted_cents: Optional[int] = None  # USD cents
    discount_percent: int = 0
    discount_end_at: Optional[datetime] = None

    # User workflow flags.
    selected: bool = Field(default=False, index=True)
    published: bool = Field(default=False, index=True)
    notes: str = ""

    # Tracking.
    active: bool = Field(default=True, index=True)
    first_seen_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PricingSettings(SQLModel, table=True):
    """Singleton row (id=1) with pricing configuration."""

    id: int = Field(default=1, primary_key=True)
    usd_to_clp: float = 970.0
    purchase_fee_pct: float = 0.05  # 5% extra over USD -> CLP conversion
    primaria_1_mult: float = 1.80
    primaria_2_mult: float = 1.60
    secundaria_mult: float = 1.10
    round_to: int = 500  # round sale prices to nearest N CLP
