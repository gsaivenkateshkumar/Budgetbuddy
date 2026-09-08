"""Aggregate review data for a RetailerListing as observed at a point in
time. Aspect-level sentiment and cross-retailer consensus (docs section 20)
are future extensions; MVP stores the basics with provenance."""
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.retailer_listing import RetailerListing


class ReviewSummary(Base):
    __tablename__ = "review_summaries"

    id: Mapped[int] = mapped_column(primary_key=True)
    retailer_listing_id: Mapped[int] = mapped_column(
        ForeignKey("retailer_listings.id"), nullable=False, index=True
    )

    average_rating: Mapped[float] = mapped_column(nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False)
    positive_aspects: Mapped[list[str] | None] = mapped_column(JSON)
    negative_aspects: Mapped[list[str] | None] = mapped_column(JSON)
    raw: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    source: Mapped[str] = mapped_column(String(120), nullable=False)
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    retailer_listing: Mapped["RetailerListing"] = relationship(back_populates="review_summaries")

    def __repr__(self) -> str:
        return f"<ReviewSummary id={self.id} listing_id={self.retailer_listing_id}>"
