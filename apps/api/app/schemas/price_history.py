from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PriceHistoryPoint(BaseModel):
    price: Decimal
    list_price: Decimal | None = None
    in_stock: bool
    collected_at: datetime


class PriceStats(BaseModel):
    """All fields are computed only from stored PriceRecord rows — never
    a claim beyond what we've actually recorded. `lowest_recorded_price`
    is scoped to our own tracking window (see `tracking_since`), never
    presented as an absolute "lowest ever"."""

    current_price: Decimal
    lowest_recorded_price: Decimal
    highest_recorded_price: Decimal
    average_price: Decimal
    price_point_count: int
    tracking_since: datetime
    is_lowest_recorded: bool
    discount_from_list_pct: int | None = None


class PriceHistoryResponse(BaseModel):
    retailer_slug: str
    retailer_name: str
    currency: str
    points: list[PriceHistoryPoint]
    stats: PriceStats
