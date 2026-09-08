"""Deterministic price-history stats. Every number here is derived from
stored PriceRecord rows for one specific retailer listing — nothing is
inferred or extrapolated. "Lowest recorded" is explicitly scoped to our
own tracking window (`tracking_since`) rather than worded as an absolute
"lowest ever" claim, per the product brief's trust principles.
"""
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.repositories import price_repository, product_repository
from app.schemas.price_history import PriceHistoryPoint, PriceHistoryResponse, PriceStats

if TYPE_CHECKING:
    from app.models import RetailerListing, Variant


def _select_listing(variant: "Variant", retailer_slug: str | None) -> "RetailerListing | None":
    if retailer_slug:
        return next(
            (listing for listing in variant.retailer_listings if listing.retailer.slug == retailer_slug),
            None,
        )

    candidates = [listing for listing in variant.retailer_listings if listing.price_records]
    if not candidates:
        return None

    in_stock = [listing for listing in candidates if listing.price_records[-1].in_stock]
    pool = in_stock or candidates
    return min(pool, key=lambda listing: listing.price_records[-1].price)


def get_variant_price_history(
    db: Session, product_slug: str, variant_sku: str, retailer_slug: str | None = None
) -> PriceHistoryResponse:
    product = product_repository.get_product_by_slug(db, product_slug)
    if product is None:
        raise NotFoundError(f"Product '{product_slug}' not found")

    variant = next((v for v in product.variants if v.sku == variant_sku), None)
    if variant is None:
        raise NotFoundError(f"Variant '{variant_sku}' not found on product '{product_slug}'")

    listing = _select_listing(variant, retailer_slug)
    if listing is None:
        raise NotFoundError("No matching retailer listing with price history found")

    records = price_repository.get_price_history_for_listing(db, listing.id)
    if not records:
        raise NotFoundError("No price history recorded for this listing yet")

    prices = [r.price for r in records]
    current = records[-1]
    lowest = min(prices)
    highest = max(prices)
    average = sum(prices) / len(prices)

    discount_pct = None
    if current.list_price and current.list_price > current.price:
        discount_pct = round((1 - current.price / current.list_price) * 100)

    stats = PriceStats(
        current_price=current.price,
        lowest_recorded_price=lowest,
        highest_recorded_price=highest,
        average_price=round(average, 2),
        price_point_count=len(records),
        tracking_since=records[0].collected_at,
        is_lowest_recorded=current.price == lowest,
        discount_from_list_pct=discount_pct,
    )

    return PriceHistoryResponse(
        retailer_slug=listing.retailer.slug,
        retailer_name=listing.retailer.name,
        currency=current.currency,
        points=[
            PriceHistoryPoint(
                price=r.price, list_price=r.list_price, in_stock=r.in_stock, collected_at=r.collected_at
            )
            for r in records
        ],
        stats=stats,
    )
