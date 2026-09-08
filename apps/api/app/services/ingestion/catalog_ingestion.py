"""Retailer-agnostic ingestion: takes NormalizedOffer objects — the same
output shape every RetailerAdapter (mock or real) already produces — and
upserts them into the canonical Brand -> Product -> Variant ->
RetailerListing -> PriceRecord schema.

Deliberately has no Amazon-specific (or any-retailer-specific) code. Any
current or future adapter's search()/get_product() output can be passed
here unchanged — this is what "do not couple the application to one
retailer" means in practice: the retailer boundary stops at
NormalizedOffer, and everything downstream of it is adapter-agnostic.
"""
import re
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models import Brand, Category, PriceRecord, Product, Retailer, RetailerListing, Variant
from app.services.identity.matcher import match
from app.services.identity.types import MatchSignals, MatchType
from app.services.retailers.types import NormalizedOffer

# Only an EXACT_MATCH is trusted to auto-attach a new listing to an
# existing Variant without human review. VARIANT/SIMILAR/ALTERNATIVE all
# mean "plausibly related, not the same purchasable thing" — per the
# task's own rule ("do not merge two products unless identity confidence
# is sufficient"), those create a new Product+Variant instead.
_AUTO_ATTACH_MATCH_TYPES = {MatchType.EXACT_MATCH}

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(value: str) -> str:
    slug = _SLUG_RE.sub("-", value.lower()).strip("-")
    return slug or "item"


def _unique_value(db: Session, model, column, base_value: str) -> str:
    value = base_value
    suffix = 2
    while db.query(model).filter(column == value).first() is not None:
        value = f"{base_value}-{suffix}"
        suffix += 1
    return value


@dataclass
class IngestionResult:
    offers_seen: int = 0
    listings_created: int = 0
    listings_updated: int = 0
    variants_created: int = 0
    variants_attached: int = 0
    price_records_created: int = 0
    errors: list[str] = field(default_factory=list)


def _get_or_create_retailer(db: Session, offer: NormalizedOffer) -> Retailer:
    retailer = db.query(Retailer).filter(Retailer.slug == offer.retailer_slug).first()
    if retailer:
        return retailer
    retailer = Retailer(
        name=offer.retailer_slug.replace("-", " ").title(),
        slug=offer.retailer_slug,
        is_mock=offer.is_mock,
    )
    db.add(retailer)
    db.flush()
    return retailer


def _get_or_create_brand(db: Session, brand_name: str) -> Brand:
    slug = _slugify(brand_name)
    brand = db.query(Brand).filter(Brand.slug == slug).first()
    if brand:
        return brand
    brand = Brand(name=brand_name, slug=slug)
    db.add(brand)
    db.flush()
    return brand


def _get_or_create_category(db: Session, category_slug: str) -> Category:
    category = db.query(Category).filter(Category.slug == category_slug).first()
    if category:
        return category
    category = Category(name=category_slug.replace("-", " ").title(), slug=category_slug)
    db.add(category)
    db.flush()
    return category


def _find_matching_variant(db: Session, signals: MatchSignals) -> Variant | None:
    """Compares against every existing variant in the same category — fine
    at this catalog's current scale; if the candidate set grows large,
    pre-filtering by brand/category at the query level is the natural next
    step, deferred until it's actually needed."""
    candidates = (
        db.query(Variant)
        .join(Product)
        .join(Category)
        .filter(Category.slug == signals.category_slug)
        .all()
    )
    for candidate in candidates:
        result = match(signals, MatchSignals.from_variant(candidate))
        if result.match_type in _AUTO_ATTACH_MATCH_TYPES:
            return candidate
    return None


def _create_variant_from_offer(
    db: Session, offer: NormalizedOffer, brand: Brand, category: Category
) -> Variant:
    product_slug = _unique_value(db, Product, Product.slug, _slugify(f"{brand.slug}-{offer.title}"))
    product = Product(brand=brand, category=category, name=offer.title, slug=product_slug)
    db.add(product)
    db.flush()

    sku_prefix = offer.retailer_slug.upper().replace("-", "")
    base_sku = f"{sku_prefix}-{offer.retailer_sku}".upper()
    variant_sku = _unique_value(db, Variant, Variant.sku, base_sku)
    variant = Variant(
        product=product,
        sku=variant_sku,
        name=offer.title,
        specs={k: v for k, v in offer.specs.items() if k != "brand"},
    )
    db.add(variant)
    db.flush()
    return variant


def ingest_offers(
    db: Session, offers: list[NormalizedOffer], *, category_slug: str
) -> IngestionResult:
    """Idempotently upserts a batch of NormalizedOffers.

    `category_slug` is required because a retailer's raw product data
    doesn't reliably map to one of Budget Buddy's canonical categories
    without a classification step this task deliberately scopes out —
    callers (e.g. scripts/ingest_amazon.py) supply it explicitly, e.g.
    from a --category CLI argument.
    """
    result = IngestionResult(offers_seen=len(offers))
    category = _get_or_create_category(db, category_slug)

    for offer in offers:
        try:
            retailer = _get_or_create_retailer(db, offer)

            existing_listing = (
                db.query(RetailerListing)
                .filter(
                    RetailerListing.retailer_id == retailer.id,
                    RetailerListing.retailer_sku == offer.retailer_sku,
                )
                .first()
            )

            if existing_listing:
                existing_listing.title = offer.title
                existing_listing.product_url = offer.product_url
                existing_listing.seller_name = offer.seller_name
                existing_listing.is_active = offer.in_stock
                listing = existing_listing
                result.listings_updated += 1
            else:
                brand_name = offer.specs.get("brand") or offer.retailer_slug
                brand = _get_or_create_brand(db, brand_name)
                signals = MatchSignals(
                    brand_slug=brand.slug,
                    category_slug=category.slug,
                    product_name=offer.title,
                    specs={k: v for k, v in offer.specs.items() if k != "brand"},
                )
                variant = _find_matching_variant(db, signals)
                if variant:
                    result.variants_attached += 1
                else:
                    variant = _create_variant_from_offer(db, offer, brand, category)
                    result.variants_created += 1

                listing = RetailerListing(
                    variant=variant,
                    retailer=retailer,
                    retailer_sku=offer.retailer_sku,
                    product_url=offer.product_url,
                    title=offer.title,
                    seller_name=offer.seller_name,
                    condition=offer.condition,
                    is_active=offer.in_stock,
                )
                db.add(listing)
                db.flush()
                result.listings_created += 1

            # Price history is append-only: every ingested offer becomes a
            # new PriceRecord, regardless of whether the listing itself was
            # just created or already existed. Never update/delete a prior
            # PriceRecord.
            db.add(
                PriceRecord(
                    retailer_listing=listing,
                    price=offer.price,
                    list_price=offer.list_price,
                    currency=offer.currency,
                    in_stock=offer.in_stock,
                    availability_text=offer.availability_text,
                    source=offer.source,
                    collected_at=offer.collected_at,
                    confidence=offer.confidence,
                )
            )
            result.price_records_created += 1
        except Exception as exc:  # noqa: BLE001 - one bad offer must not abort the batch
            result.errors.append(f"{offer.retailer_sku}: {exc}")

    db.commit()
    return result
