from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.retailer_listing import RetailerListing


class Retailer(Base, TimestampMixin):
    """A retailer this platform surfaces listings for.

    `is_mock` marks retailers currently backed by a mock/dev adapter rather
    than a real integration — see docs/data-sources.md. UI must never
    present is_mock=True data as live.
    """

    __tablename__ = "retailers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    country: Mapped[str] = mapped_column(String(2), default="IN", nullable=False)
    website_url: Mapped[str | None] = mapped_column(String(500))
    logo_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_mock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    listings: Mapped[list["RetailerListing"]] = relationship(back_populates="retailer")

    def __repr__(self) -> str:
        return f"<Retailer id={self.id} slug={self.slug!r}>"
