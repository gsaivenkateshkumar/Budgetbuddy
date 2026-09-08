from datetime import UTC, datetime
from decimal import Decimal

from app.models import PriceRecord, Product, RetailerListing, Variant
from app.services.ingestion.catalog_ingestion import ingest_offers
from app.services.retailers.types import NormalizedOffer


def make_offer(**overrides) -> NormalizedOffer:
    defaults = dict(
        retailer_slug="amazon-in",
        retailer_sku="B0EXAMPLE1",
        title="Acme Test Laptop 14-inch 16GB/512GB",
        product_url="https://www.amazon.in/dp/B0EXAMPLE1",
        price=Decimal("54999"),
        list_price=Decimal("59999"),
        currency="INR",
        in_stock=True,
        seller_name="Amazon.in",
        specs={"brand": "Acme", "ram_gb": 16, "storage_gb": 512},
        source="amazon_creators_api",
        collected_at=datetime.now(UTC),
        is_mock=False,
    )
    defaults.update(overrides)
    return NormalizedOffer(**defaults)


def test_ingest_creates_new_product_variant_and_listing(db_session):
    offer = make_offer()

    result = ingest_offers(db_session, [offer], category_slug="laptops")

    assert result.listings_created == 1
    assert result.variants_created == 1
    assert result.price_records_created == 1
    assert result.errors == []

    listing = db_session.query(RetailerListing).one()
    assert listing.retailer_sku == "B0EXAMPLE1"
    assert listing.title == offer.title
    assert db_session.query(Product).count() == 1
    assert db_session.query(Variant).count() == 1


def test_ingest_is_idempotent_on_retailer_sku(db_session):
    offer = make_offer()

    ingest_offers(db_session, [offer], category_slug="laptops")
    result_2 = ingest_offers(db_session, [offer], category_slug="laptops")

    assert result_2.listings_created == 0
    assert result_2.listings_updated == 1
    assert db_session.query(RetailerListing).count() == 1
    assert db_session.query(Product).count() == 1
    assert db_session.query(Variant).count() == 1


def test_ingest_never_duplicates_listing_for_same_retailer_and_sku(db_session):
    offer_v1 = make_offer(price=Decimal("54999"))
    offer_v2 = make_offer(price=Decimal("52999"), title="Acme Test Laptop 14-inch 16GB/512GB (Updated)")

    ingest_offers(db_session, [offer_v1], category_slug="laptops")
    ingest_offers(db_session, [offer_v2], category_slug="laptops")

    listings = db_session.query(RetailerListing).all()
    assert len(listings) == 1
    assert listings[0].title == offer_v2.title


def test_ingest_appends_price_history_without_touching_prior_records(db_session):
    offer_v1 = make_offer(price=Decimal("54999"))
    offer_v2 = make_offer(price=Decimal("52999"))

    ingest_offers(db_session, [offer_v1], category_slug="laptops")
    ingest_offers(db_session, [offer_v2], category_slug="laptops")

    records = db_session.query(PriceRecord).order_by(PriceRecord.id).all()
    assert len(records) == 2
    assert records[0].price == Decimal("54999")
    assert records[1].price == Decimal("52999")


def test_ingest_attaches_new_listing_to_existing_variant_on_exact_match(db_session):
    """Two different retailers selling the same physical product (shared
    brand + product name + identical specs, no strong identifier) must
    attach to one Variant, not create two — this is what
    'do not couple to one retailer' means downstream: the same canonical
    product should be reachable regardless of which retailer sourced it."""
    amazon_offer = make_offer(retailer_slug="amazon-in", retailer_sku="B0AMZ1")
    other_offer = make_offer(retailer_slug="flipkart-example", retailer_sku="FK-999")

    ingest_offers(db_session, [amazon_offer], category_slug="laptops")
    result_2 = ingest_offers(db_session, [other_offer], category_slug="laptops")

    assert result_2.variants_attached == 1
    assert result_2.variants_created == 0
    assert db_session.query(Variant).count() == 1
    assert db_session.query(RetailerListing).count() == 2


def test_ingest_does_not_merge_products_with_insufficient_identity_confidence(db_session):
    """Different brand/model — must never be merged into the same Variant,
    even if categories match. Guards the task's explicit 'do not merge two
    products unless identity confidence is sufficient' rule."""
    laptop_a = make_offer(
        retailer_sku="B0AAA",
        title="Acme Test Laptop 14-inch",
        specs={"brand": "Acme", "ram_gb": 16},
    )
    laptop_b = make_offer(
        retailer_sku="B0BBB",
        title="Zenith Pro Book 15-inch",
        specs={"brand": "Zenith", "ram_gb": 32},
    )

    ingest_offers(db_session, [laptop_a], category_slug="laptops")
    result_2 = ingest_offers(db_session, [laptop_b], category_slug="laptops")

    assert result_2.variants_created == 1
    assert result_2.variants_attached == 0
    assert db_session.query(Variant).count() == 2


def test_ingest_handles_missing_optional_fields_gracefully(db_session):
    offer = make_offer(list_price=None, seller_name=None, image_url=None, specs={})

    result = ingest_offers(db_session, [offer], category_slug="laptops")

    assert result.errors == []
    assert result.listings_created == 1


def test_ingest_processes_every_offer_in_a_batch(db_session):
    offer_a = make_offer(retailer_sku="B0GOOD1", title="Acme Test Laptop A")
    offer_b = make_offer(retailer_sku="B0GOOD2", title="Zenith Test Laptop B", specs={"brand": "Zenith"})

    result = ingest_offers(db_session, [offer_a, offer_b], category_slug="laptops")

    assert result.offers_seen == 2
    assert result.listings_created == 2
    assert result.errors == []
