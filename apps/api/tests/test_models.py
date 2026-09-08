from datetime import UTC, datetime
from decimal import Decimal

from app.models import Brand, Category, PriceRecord, Product, Retailer, RetailerListing, Variant


def _make_catalog_entry(db_session):
    brand = Brand(name="Apple", slug="apple")
    category = Category(name="Laptops", slug="laptops")
    db_session.add_all([brand, category])
    db_session.flush()

    product = Product(brand=brand, category=category, name="MacBook Air M2", slug="macbook-air-m2")
    db_session.add(product)
    db_session.flush()

    variant = Variant(
        product=product,
        sku="MBA-M2-8-256",
        name="MacBook Air M2 8GB/256GB",
        specs={"ram_gb": 8, "storage_gb": 256},
    )
    db_session.add(variant)
    db_session.flush()

    retailer = Retailer(name="Amazon India", slug="amazon-in")
    db_session.add(retailer)
    db_session.flush()

    listing = RetailerListing(
        variant=variant,
        retailer=retailer,
        product_url="https://www.amazon.example/dp/mba-m2",
        title="MacBook Air M2 8GB/256GB",
    )
    db_session.add(listing)
    db_session.flush()

    db_session.add(
        PriceRecord(
            retailer_listing=listing,
            price=Decimal("94900.00"),
            currency="INR",
            in_stock=True,
            source="mock:amazon_in_adapter",
            collected_at=datetime.now(UTC),
        )
    )
    db_session.commit()
    return product


def test_product_hierarchy_can_be_queried(db_session):
    _make_catalog_entry(db_session)

    product = db_session.query(Product).filter_by(slug="macbook-air-m2").one()

    assert product.brand.slug == "apple"
    assert product.category.slug == "laptops"
    assert len(product.variants) == 1

    variant = product.variants[0]
    assert variant.specs["ram_gb"] == 8
    assert len(variant.retailer_listings) == 1

    listing = variant.retailer_listings[0]
    assert listing.retailer.slug == "amazon-in"
    assert len(listing.price_records) == 1
    assert listing.price_records[0].price == Decimal("94900.00")


def test_category_supports_parent_child_hierarchy(db_session):
    electronics = Category(name="Electronics", slug="electronics")
    laptops = Category(name="Laptops", slug="laptops", parent=electronics)
    db_session.add_all([electronics, laptops])
    db_session.commit()

    fetched = db_session.query(Category).filter_by(slug="laptops").one()
    assert fetched.parent.slug == "electronics"
    assert fetched in electronics.children
