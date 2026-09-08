"""Assembles API-facing product schemas from ORM data. Business rule: a
retailer offer is only shown if it has at least one PriceRecord — no price
history means nothing to display, not a fabricated price."""
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models import Product, RetailerListing, Variant
from app.repositories import product_repository
from app.schemas.brand import BrandRead
from app.schemas.category import CategoryRead
from app.schemas.common import Page
from app.schemas.offer import OfferRead
from app.schemas.product import ProductDetail, ProductSummary
from app.schemas.variant import ImageRead, VariantRead
from app.services.freshness import freshness_text


def _primary_image_url(product: Product) -> str | None:
    for variant in product.variants:
        for image in variant.images:
            if image.is_primary:
                return image.url
    return None


def _to_offer_read(listing: RetailerListing) -> OfferRead | None:
    if not listing.price_records:
        return None
    latest = listing.price_records[-1]
    review = listing.review_summaries[-1] if listing.review_summaries else None

    return OfferRead(
        retailer_slug=listing.retailer.slug,
        retailer_name=listing.retailer.name,
        retailer_is_mock=listing.retailer.is_mock,
        product_url=listing.product_url,
        seller_name=listing.seller_name,
        condition=listing.condition,
        price=latest.price,
        list_price=latest.list_price,
        currency=latest.currency,
        in_stock=latest.in_stock,
        availability_text=latest.availability_text,
        rating=review.average_rating if review else None,
        review_count=review.review_count if review else None,
        source=latest.source,
        collected_at=latest.collected_at,
        freshness=freshness_text(latest.collected_at),
        confidence=latest.confidence,
    )


def _to_variant_read(variant: Variant) -> VariantRead:
    offers = [
        offer for listing in variant.retailer_listings if (offer := _to_offer_read(listing)) is not None
    ]
    return VariantRead(
        id=variant.id,
        sku=variant.sku,
        name=variant.name,
        mpn=variant.mpn,
        gtin=variant.gtin,
        upc=variant.upc,
        ean=variant.ean,
        specs=variant.specs or {},
        images=[ImageRead.model_validate(i) for i in variant.images],
        offers=offers,
    )


def _to_product_summary(product: Product, min_price: Decimal | None) -> ProductSummary:
    return ProductSummary(
        id=product.id,
        slug=product.slug,
        name=product.name,
        brand=BrandRead.model_validate(product.brand),
        category=CategoryRead.model_validate(product.category),
        primary_image_url=_primary_image_url(product),
        min_price=min_price,
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
) -> Page[ProductSummary]:
    rows, total = product_repository.search_products(
        db,
        q=q,
        category_slug=category_slug,
        brand_slug=brand_slug,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    items = [_to_product_summary(product, min_price) for product, min_price in rows]
    return Page.create(items, total, page, page_size)


def get_product_detail(db: Session, slug: str) -> ProductDetail:
    product = product_repository.get_product_by_slug(db, slug)
    if product is None:
        raise NotFoundError(f"Product '{slug}' not found")

    variants = [_to_variant_read(v) for v in product.variants]
    all_prices = [offer.price for variant in variants for offer in variant.offers]

    return ProductDetail(
        id=product.id,
        slug=product.slug,
        name=product.name,
        description=product.description,
        brand=BrandRead.model_validate(product.brand),
        category=CategoryRead.model_validate(product.category),
        primary_image_url=_primary_image_url(product),
        min_price=min(all_prices) if all_prices else None,
        variants=variants,
    )


def get_variant_offers(db: Session, product_slug: str, variant_sku: str) -> list[OfferRead]:
    product = product_repository.get_product_by_slug(db, product_slug)
    if product is None:
        raise NotFoundError(f"Product '{product_slug}' not found")

    variant = next((v for v in product.variants if v.sku == variant_sku), None)
    if variant is None:
        raise NotFoundError(f"Variant '{variant_sku}' not found on product '{product_slug}'")

    return [offer for listing in variant.retailer_listings if (offer := _to_offer_read(listing)) is not None]
