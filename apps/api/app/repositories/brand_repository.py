from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Brand


def list_all(db: Session) -> list[Brand]:
    return list(db.execute(select(Brand).order_by(Brand.name)).scalars().all())


def get_by_slug(db: Session, slug: str) -> Brand | None:
    return db.execute(select(Brand).where(Brand.slug == slug)).scalar_one_or_none()
