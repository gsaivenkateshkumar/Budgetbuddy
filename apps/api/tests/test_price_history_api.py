from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.models import Brand, Category, PriceRecord, Product, Retailer, RetailerListing, Variant


@pytest.fixture()
def catalog_with_history(db_session):
    brand = Brand(name="Apple", slug="apple")
    category = Category(name="Laptops", slug="laptops")
    amazon = Retailer(name="Amazon India", slug="amazon-in")
    flipkart = Retailer(name="Flipkart", slug="flipkart")
    db_session.add_all([brand, category, amazon, flipkart])
    db_session.flush()

    product = Product(brand=brand, category=category, name="MacBook Air M2", slug="macbook-air-m2")
    db_session.add(product)
    db_session.flush()

    variant = Variant(product=product, sku="MBA-8-256", name="MBA 8/256", specs={"ram_gb": 8})
    db_session.add(variant)
    db_session.flush()

    amazon_listing = RetailerListing(
        variant=variant, retailer=amazon, product_url="https://amazon.example/mba", title="MBA"
    )
    flipkart_listing = RetailerListing(
        variant=variant, retailer=flipkart, product_url="https://flipkart.example/mba", title="MBA"
    )
    db_session.add_all([amazon_listing, flipkart_listing])
    db_session.flush()

    now = datetime.now(UTC)
    # Amazon: drifts down from 99900 -> 94900 over 3 points; cheaper and in stock.
    for offset, price in [(20, "99900"), (10, "97000"), (1, "94900")]:
        db_session.add(
            PriceRecord(
                retailer_listing=amazon_listing,
                price=Decimal(price),
                list_price=Decimal("99900"),
                currency="INR",
                in_stock=True,
                source="mock:amazon-in_adapter",
                collected_at=now - timedelta(days=offset),
            )
        )
    # Flipkart: single, more expensive point.
    db_session.add(
        PriceRecord(
            retailer_listing=flipkart_listing,
            price=Decimal("95900"),
            list_price=Decimal("99900"),
            currency="INR",
            in_stock=True,
            source="mock:flipkart_adapter",
            collected_at=now - timedelta(days=5),
        )
    )
    db_session.commit()
    return {"slug": product.slug, "sku": variant.sku}


def test_price_history_defaults_to_cheapest_in_stock_listing(client, catalog_with_history):
    response = client.get(
        f"/products/{catalog_with_history['slug']}/variants/{catalog_with_history['sku']}/price-history"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["retailer_slug"] == "amazon-in"
    assert len(body["points"]) == 3


def test_price_history_stats_are_derived_from_stored_records(client, catalog_with_history):
    response = client.get(
        f"/products/{catalog_with_history['slug']}/variants/{catalog_with_history['sku']}/price-history"
    )

    stats = response.json()["stats"]
    assert stats["current_price"] == "94900.00"
    assert stats["lowest_recorded_price"] == "94900.00"
    assert stats["highest_recorded_price"] == "99900.00"
    assert stats["price_point_count"] == 3
    assert stats["is_lowest_recorded"] is True
    assert stats["discount_from_list_pct"] == 5


def test_price_history_respects_explicit_retailer_param(client, catalog_with_history):
    response = client.get(
        f"/products/{catalog_with_history['slug']}/variants/{catalog_with_history['sku']}/price-history",
        params={"retailer": "flipkart"},
    )

    body = response.json()
    assert body["retailer_slug"] == "flipkart"
    assert len(body["points"]) == 1
    assert body["stats"]["is_lowest_recorded"] is True


def test_price_history_404_for_unknown_variant(client, catalog_with_history):
    response = client.get(f"/products/{catalog_with_history['slug']}/variants/does-not-exist/price-history")

    assert response.status_code == 404


def test_price_history_404_for_unknown_retailer(client, catalog_with_history):
    response = client.get(
        f"/products/{catalog_with_history['slug']}/variants/{catalog_with_history['sku']}/price-history",
        params={"retailer": "not-a-real-retailer"},
    )

    assert response.status_code == 404
