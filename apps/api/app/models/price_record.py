"""PriceRecord is an append-only price/availability observation for a
RetailerListing at a point in time — this is the price-history table. The
"current price" for a listing is the most recent PriceRecord, derived by
query rather than duplicated into RetailerListing (single source of truth,
no staleness risk).

`source` and `collected_at` carry data provenance; `confidence` lets a
scraped/uncertain source be distinguished from a verified feed later. UI
freshness ("Checked 8 minutes ago") is computed from `collected_at`.
"""
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.retailer_listing import RetailerListing


class PriceRecord(Base):
    __tablename__ = "price_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    retailer_listing_id: Mapped[int] = mapped_column(
        ForeignKey("retailer_listings.id"), nullable=False, index=True
    )

    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    list_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)

    in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    availability_text: Mapped[str | None] = mapped_column(String(200))

    source: Mapped[str] = mapped_column(String(120), nullable=False)
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(default=1.0, nullable=False)

    retailer_listing: Mapped["RetailerListing"] = relationship(back_populates="price_records")

    def __repr__(self) -> str:
        return f"<PriceRecord id={self.id} listing_id={self.retailer_listing_id} price={self.price}>"
