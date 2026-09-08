"""A RetailerListing is one retailer's page/offer for a Variant. A single
retailer may carry multiple listings for the same variant (different
sellers on a marketplace like Meesho), so (retailer_id, variant_id) is
intentionally not unique."""
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.price_record import PriceRecord
    from app.models.retailer import Retailer
    from app.models.review_summary import ReviewSummary
    from app.models.variant import Variant


class RetailerListing(Base, TimestampMixin):
    __tablename__ = "retailer_listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("variants.id"), nullable=False, index=True)
    retailer_id: Mapped[int] = mapped_column(ForeignKey("retailers.id"), nullable=False, index=True)
    retailer_sku: Mapped[str | None] = mapped_column(String(150))
    product_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    seller_name: Mapped[str | None] = mapped_column(String(200))
    condition: Mapped[str] = mapped_column(String(20), default="new", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    variant: Mapped["Variant"] = relationship(back_populates="retailer_listings")
    retailer: Mapped["Retailer"] = relationship(back_populates="listings")
    price_records: Mapped[list["PriceRecord"]] = relationship(
        back_populates="retailer_listing", cascade="all, delete-orphan", order_by="PriceRecord.collected_at"
    )
    review_summaries: Mapped[list["ReviewSummary"]] = relationship(
        back_populates="retailer_listing", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<RetailerListing id={self.id} variant_id={self.variant_id} retailer_id={self.retailer_id}>"
