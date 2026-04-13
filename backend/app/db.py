from __future__ import annotations

from sqlmodel import Session, SQLModel, create_engine, select

from .config import settings
from .models import PricingSettings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {},
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    # Ensure a singleton pricing row exists.
    with Session(engine) as session:
        existing = session.exec(select(PricingSettings)).first()
        if not existing:
            session.add(PricingSettings(id=1))
            session.commit()


def get_session() -> Session:
    return Session(engine)
