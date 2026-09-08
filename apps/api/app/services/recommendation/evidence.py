"""Turns ORM Product/Variant data into CandidateEvidence, and applies hard
constraints. A variant with no valid price evidence is excluded outright —
there is nothing to recommend without a price."""
from decimal import Decimal
from typing import TYPE_CHECKING

from app.services.recommendation.types import CandidateEvidence, HardConstraints

if TYPE_CHECKING:
    from app.models import PriceRecord, Product, RetailerListing, Variant


def _best_offer(
    variant: "Variant", require_in_stock: bool
) -> tuple[Decimal, "PriceRecord", "RetailerListing"] | None:
    best: tuple[Decimal, PriceRecord, RetailerListing] | None = None
    for listing in variant.retailer_listings:
        if not listing.price_records:
            continue
        latest = listing.price_records[-1]
        if require_in_stock and not latest.in_stock:
            continue
        if best is None or latest.price < best[0]:
            best = (latest.price, latest, listing)
    return best


def _passes_hard_constraints(variant: "Variant", price: Decimal, hard: HardConstraints) -> bool:
    if hard.min_price is not None and price < hard.min_price:
        return False
    if hard.max_price is not None and price > hard.max_price:
        return False

    specs = variant.specs or {}
    if hard.min_ram_gb is not None:
        ram = specs.get("ram_gb")
        if ram is None or ram < hard.min_ram_gb:
            return False
    if hard.min_storage_gb is not None:
        storage = specs.get("storage_gb")
        if storage is None or storage < hard.min_storage_gb:
            return False
    return True


def build_candidate_evidence(
    product: "Product", variant: "Variant", hard: HardConstraints
) -> CandidateEvidence | None:
    best = _best_offer(variant, hard.require_in_stock)
    if best is None:
        return None
    price, price_record, listing = best
    if not _passes_hard_constraints(variant, price, hard):
        return None

    offer_count = sum(1 for listing_ in variant.retailer_listings if listing_.price_records)

    ratings = [
        rs.average_rating
        for listing_ in variant.retailer_listings
        for rs in listing_.review_summaries
        if listing_.review_summaries
    ]
    review_counts = [
        rs.review_count
        for listing_ in variant.retailer_listings
        for rs in listing_.review_summaries
        if listing_.review_summaries
    ]

    return CandidateEvidence(
        product_id=product.id,
        product_slug=product.slug,
        product_name=product.name,
        brand_name=product.brand.name,
        variant_id=variant.id,
        variant_sku=variant.sku,
        specs=variant.specs or {},
        price=price,
        currency=price_record.currency,
        in_stock=price_record.in_stock,
        best_retailer_slug=listing.retailer.slug,
        offer_count=offer_count,
        rating=round(sum(ratings) / len(ratings), 2) if ratings else None,
        review_count=sum(review_counts) if review_counts else None,
    )
