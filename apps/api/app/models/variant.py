"""Variant = a specific purchasable configuration of a Product (storage,
RAM, color, size, ...). Strong identity signals (mpn/gtin/upc/ean) are used
by the Product Identity Engine (Phase 5) for cross-retailer matching.
`specs` holds flexible, category-dependent structured specifications
(e.g. {"ram_gb": 16, "storage_gb": 512}) — kept as JSON rather than a rigid
EAV schema so different product categories can carry different attributes
without a migration per category."""
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.image import Image
    from app.models.product import Product
    from app.models.retailer_listing import RetailerListing


class Variant(Base, TimestampMixin):
    __tablename__ = "variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(240), nullable=False)

    # Strong matching signals (Product Identity Engine, Phase 5).
    mpn: Mapped[str | None] = mapped_column(String(120), index=True)
    gtin: Mapped[str | None] = mapped_column(String(14), index=True)
    upc: Mapped[str | None] = mapped_column(String(12), index=True)
    ean: Mapped[str | None] = mapped_column(String(13), index=True)

    specs: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="variants")
    images: Mapped[list["Image"]] = relationship(back_populates="variant", cascade="all, delete-orphan")
    retailer_listings: Mapped[list["RetailerListing"]] = relationship(
        back_populates="variant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Variant id={self.id} sku={self.sku!r}>"
