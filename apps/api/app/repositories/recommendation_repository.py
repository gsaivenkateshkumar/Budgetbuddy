from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Brand, Category, Product, RetailerListing, Variant

_CANDIDATE_LOAD_OPTIONS = (
    selectinload(Product.brand),
    selectinload(Product.category),
    selectinload(Product.variants)
    .selectinload(Variant.retailer_listings)
    .selectinload(RetailerListing.retailer),
    selectinload(Product.variants)
    .selectinload(Variant.retailer_listings)
    .selectinload(RetailerListing.price_records),
    selectinload(Product.variants)
    .selectinload(Variant.retailer_listings)
    .selectinload(RetailerListing.review_summaries),
)


def get_candidate_products(
    db: Session, *, category_slug: str | None = None, brand_slugs: list[str] | None = None
) -> list[Product]:
    """Products (with everything needed to build recommendation evidence)
    eager-loaded in one round trip: variants, their retailer listings, and
    each listing's price/review history."""
    query = select(Product).options(*_CANDIDATE_LOAD_OPTIONS)
    if category_slug:
        query = query.join(Product.category).where(Category.slug == category_slug)
    if brand_slugs:
        query = query.join(Product.brand).where(Brand.slug.in_(brand_slugs))

    return list(db.execute(query).unique().scalars().all())


def get_products_by_slugs(db: Session, slugs: list[str]) -> list[Product]:
    """Same eager-loading as get_candidate_products, scoped to an explicit
    set of product slugs — used for comparison (Phase 10)."""
    query = select(Product).where(Product.slug.in_(slugs)).options(*_CANDIDATE_LOAD_OPTIONS)
    return list(db.execute(query).unique().scalars().all())
