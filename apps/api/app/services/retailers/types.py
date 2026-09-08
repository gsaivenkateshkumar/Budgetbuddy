"""Retailer-agnostic data shapes returned by every adapter.

Core application code depends only on `NormalizedOffer` — never on any
retailer's own field names or response shape. Each adapter's `normalize()`
is the one place retailer-specific structure is translated into this
common type.
"""
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class NormalizedOffer(BaseModel):
    model_config = ConfigDict(frozen=True)

    retailer_slug: str
    retailer_sku: str
    title: str
    product_url: str

    price: Decimal
    list_price: Decimal | None = None
    currency: str = "INR"

    in_stock: bool = True
    availability_text: str | None = None

    seller_name: str | None = None
    condition: str = "new"

    rating: float | None = None
    review_count: int | None = None

    specs: dict[str, Any] = Field(default_factory=dict)
    image_url: str | None = None

    # Provenance — see docs/data-sources.md.
    source: str
    collected_at: datetime
    confidence: float = 1.0
    is_mock: bool = True
