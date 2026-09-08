from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class OfferRead(BaseModel):
    """A retailer's current price/availability for a variant, with the
    provenance a user needs to judge how much to trust it."""

    retailer_slug: str
    retailer_name: str
    retailer_is_mock: bool
    product_url: str
    seller_name: str | None = None
    condition: str

    price: Decimal
    list_price: Decimal | None = None
    currency: str

    in_stock: bool
    availability_text: str | None = None

    rating: float | None = None
    review_count: int | None = None

    source: str
    collected_at: datetime
    freshness: str
    confidence: float
