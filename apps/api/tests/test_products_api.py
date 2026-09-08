from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.models import Brand, Category, Image, PriceRecord, Product, Retailer, RetailerListing, Variant


@pytest.fixture()
def catalog(db_session):
    apple = Brand(name="Apple", slug="apple")
    samsung = Brand(name="Samsung", slug="samsung")
    laptops = Category(name="Laptops", slug="laptops")
    phones = Category(name="Smartphones", slug="smartphones")
    db_session.add_all([apple, samsung, laptops, phones])
    db_session.flush()

    macbook = Product(brand=apple, category=laptops, name="MacBook Air M2", slug="macbook-air-m2")
    galaxy = Product(brand=samsung, category=phones, name="Galaxy S23", slug="galaxy-s23")
    db_session.add_all([macbook, galaxy])
    db_session.flush()

    mba_variant = Variant(
        product=macbook, sku="MBA-8-256", name="MacBook Air M2 8GB/256GB", specs={"ram_gb": 8}
    )
    s23_variant = Variant(product=galaxy, sku="S23-128", name="Galaxy S23 128GB", specs={"ram_gb": 8})
    db_session.add_all([mba_variant, s23_variant])
    db_session.flush()

    db_session.add(
        Image(variant=mba_variant, url="https://placeholder.budgetbuddy.dev/mba.jpg", is_primary=True)
    )

    amazon = Retailer(name="Amazon India", slug="amazon-in")
    flipkart = Retailer(name="Flipkart", slug="flipkart")
    db_session.add_all([amazon, flipkart])
    db_session.flush()

    mba_amazon = RetailerListing(
        variant=mba_variant, retailer=amazon, product_url="https://amazon.example/mba", title="MacBook Air M2"
    )
    mba_flipkart = RetailerListing(
        variant=mba_variant,
        retailer=flipkart,
        product_url="https://flipkart.example/mba",
        title="MacBook Air M2",
    )
    s23_amazon = RetailerListing(
        variant=s23_variant, retailer=amazon, product_url="https://amazon.example/s23", title="Galaxy S23"
    )
    db_session.add_all([mba_amazon, mba_flipkart, s23_amazon])
    db_session.flush()

    now = datetime.now(UTC)
    db_session.add_all(
        [
            PriceRecord(
                retailer_listing=mba_amazon,
                price=Decimal("94900"),
                currency="INR",
                in_stock=True,
                source="mock:amazon-in_adapter",
                collected_at=now - timedelta(minutes=10),
            ),
            PriceRecord(
                retailer_listing=mba_flipkart,
                price=Decimal("95900"),
                currency="INR",
                in_stock=True,
                source="mock:flipkart_adapter",
                collected_at=now - timedelta(minutes=5),
            ),
            PriceRecord(
                retailer_listing=s23_amazon,
                price=Decimal("64999"),
                currency="INR",
                in_stock=True,
                source="mock:amazon-in_adapter",
                collected_at=now,
            ),
        ]
    )
    db_session.commit()
    return {"macbook_slug": macbook.slug, "galaxy_slug": galaxy.slug, "mba_sku": mba_variant.sku}


def test_list_products_returns_seeded_catalog(client, catalog):
    response = client.get("/products")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    slugs = {item["slug"] for item in body["items"]}
    assert slugs == {"macbook-air-m2", "galaxy-s23"}


def test_list_products_filters_by_query_text(client, catalog):
    response = client.get("/products", params={"q": "macbook"})

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "macbook-air-m2"


def test_list_products_filters_by_category(client, catalog):
    response = client.get("/products", params={"category": "smartphones"})

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "galaxy-s23"


def test_list_products_filters_by_price_range(client, catalog):
    response = client.get("/products", params={"max_price": 70000})

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "galaxy-s23"


def test_list_products_sorts_by_price_ascending(client, catalog):
    response = client.get("/products", params={"sort": "price_asc"})

    slugs = [item["slug"] for item in response.json()["items"]]
    assert slugs == ["galaxy-s23", "macbook-air-m2"]


def test_list_products_paginates(client, catalog):
    response = client.get("/products", params={"page": 1, "page_size": 1})

    body = response.json()
    assert len(body["items"]) == 1
    assert body["total"] == 2
    assert body["total_pages"] == 2


def test_get_product_detail_includes_offers_from_multiple_retailers(client, catalog):
    response = client.get(f"/products/{catalog['macbook_slug']}")

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "macbook-air-m2"
    assert len(body["variants"]) == 1

    offers = body["variants"][0]["offers"]
    assert len(offers) == 2
    retailer_slugs = {o["retailer_slug"] for o in offers}
    assert retailer_slugs == {"amazon-in", "flipkart"}
    for offer in offers:
        assert offer["freshness"].startswith("Checked")


def test_get_product_detail_404_for_unknown_slug(client, catalog):
    response = client.get("/products/does-not-exist")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_get_variant_offers_endpoint(client, catalog):
    response = client.get(f"/products/{catalog['macbook_slug']}/variants/{catalog['mba_sku']}/offers")

    assert response.status_code == 200
    offers = response.json()
    assert len(offers) == 2
    prices = sorted(Decimal(o["price"]) for o in offers)
    assert prices == [Decimal("94900"), Decimal("95900")]


def test_get_variant_offers_404_for_unknown_sku(client, catalog):
    response = client.get(f"/products/{catalog['macbook_slug']}/variants/does-not-exist/offers")

    assert response.status_code == 404


def test_list_brands(client, catalog):
    response = client.get("/brands")

    assert response.status_code == 200
    names = {b["name"] for b in response.json()}
    assert names == {"Apple", "Samsung"}


def test_list_categories(client, catalog):
    response = client.get("/categories")

    assert response.status_code == 200
    names = {c["name"] for c in response.json()}
    assert names == {"Laptops", "Smartphones"}
