"""Product queries: catalog search/listing and full product detail.

Search filters/sorts by "current price", derived from the latest
PriceRecord per listing (see price_repository) — never a stored/cached
price column, so results can't go stale relative to price history.
"""
from decimal import Decimal

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Brand, Category, Product, RetailerListing, Variant
from app.repositories.price_repository import latest_price_records_query

_DETAIL_LOAD_OPTIONS = (
    selectinload(Product.brand),
    selectinload(Product.category),
    selectinload(Product.variants).selectinload(Variant.images),
    selectinload(Product.variants).selectinload(Variant.retailer_listings).selectinload(RetailerListing.retailer),
    selectinload(Product.variants)
    .selectinload(Variant.retailer_listings)
    .selectinload(RetailerListing.price_records),
    selectinload(Product.variants)
    .selectinload(Variant.retailer_listings)
    .selectinload(RetailerListing.review_summaries),
)


def search_products(
    db: Session,
    *,
    q: str | None = None,
    category_slug: str | None = None,
    brand_slug: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    sort: str = "relevance",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[tuple[Product, Decimal | None]], int]:
    latest_prices = latest_price_records_query().subquery()

    min_price_per_product = (
        select(
            Variant.product_id.label("product_id"),
            func.min(latest_prices.c.price).label("min_price"),
        )
        .select_from(Variant)
        .join(RetailerListing, RetailerListing.variant_id == Variant.id)
        .join(latest_prices, latest_prices.c.retailer_listing_id == RetailerListing.id)
        .group_by(Variant.product_id)
    ).subquery()

    base_query = (
        select(Product, min_price_per_product.c.min_price)
        .join(Brand, Product.brand_id == Brand.id)
        .join(Category, Product.category_id == Category.id)
        .outerjoin(min_price_per_product, min_price_per_product.c.product_id == Product.id)
    )

    conditions = []
    if q:
        needle = f"%{q.lower()}%"
        conditions.append(or_(func.lower(Product.name).like(needle), func.lower(Brand.name).like(needle)))
    if category_slug:
        conditions.append(Category.slug == category_slug)
    if brand_slug:
        conditions.append(Brand.slug == brand_slug)
    if min_price is not None:
        conditions.append(min_price_per_product.c.min_price >= min_price)
    if max_price is not None:
        conditions.append(min_price_per_product.c.min_price <= max_price)
    if conditions:
        base_query = base_query.where(and_(*conditions))

    total = db.execute(select(func.count()).select_from(base_query.subquery())).scalar_one()

    if sort == "price_asc":
        base_query = base_query.order_by(min_price_per_product.c.min_price.asc().nulls_last())
    elif sort == "price_desc":
        base_query = base_query.order_by(min_price_per_product.c.min_price.desc().nulls_last())
    else:
        base_query = base_query.order_by(Product.name.asc())

    base_query = (
        base_query.options(*_DETAIL_LOAD_OPTIONS[:3]).offset((page - 1) * page_size).limit(page_size)
    )

    rows = db.execute(base_query).all()
    results = [(row[0], row[1]) for row in rows]
    return results, total


def get_product_by_slug(db: Session, slug: str) -> Product | None:
    query = select(Product).where(Product.slug == slug).options(*_DETAIL_LOAD_OPTIONS)
    return db.execute(query).unique().scalar_one_or_none()
