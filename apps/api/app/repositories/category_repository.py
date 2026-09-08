from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category


def list_all(db: Session) -> list[Category]:
    return list(db.execute(select(Category).order_by(Category.name)).scalars().all())


def get_by_slug(db: Session, slug: str) -> Category | None:
    return db.execute(select(Category).where(Category.slug == slug)).scalar_one_or_none()
