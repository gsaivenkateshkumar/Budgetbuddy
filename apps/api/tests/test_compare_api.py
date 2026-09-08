from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.models import Brand, Category, PriceRecord, Product, Retailer, RetailerListing, Variant


@pytest.fixture()
def two_laptops(db_session):
    apple = Brand(name="Apple", slug="apple")
    dell = Brand(name="Dell", slug="dell")
    category = Category(name="Laptops", slug="laptops")
    retailer = Retailer(name="Amazon India", slug="amazon-in")
    db_session.add_all([apple, dell, category, retailer])
    db_session.flush()

    mba = Product(brand=apple, category=category, name="MacBook Air M2", slug="macbook-air-m2")
    xps = Product(brand=dell, category=category, name="XPS 13", slug="xps-13")
    db_session.add_all([mba, xps])
    db_session.flush()

    v_mba = Variant(product=mba, sku="MBA-8-256", name="MBA 8/256", specs={"ram_gb": 8, "storage_gb": 256})
    v_xps = Variant(product=xps, sku="XPS-16-512", name="XPS 16/512", specs={"ram_gb": 16, "storage_gb": 512})
    db_session.add_all([v_mba, v_xps])
    db_session.flush()

    for variant, price in [(v_mba, "94900"), (v_xps, "89990")]:
        listing = RetailerListing(
            variant=variant,
            retailer=retailer,
            product_url=f"https://amazon.example/{variant.sku.lower()}",
            title=variant.name,
        )
        db_session.add(listing)
        db_session.flush()
        db_session.add(
            PriceRecord(
                retailer_listing=listing,
                price=Decimal(price),
                currency="INR",
                in_stock=True,
                source="mock:amazon-in_adapter",
                collected_at=datetime.now(UTC),
            )
        )
    db_session.commit()
    return {"mba_slug": mba.slug, "xps_slug": xps.slug}


def test_compare_requires_at_least_two_products(client):
    response = client.get("/compare", params={"product": "solo-product"})

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_request"


def test_compare_scores_and_ranks_selected_products(client, two_laptops):
    response = client.get(
        "/compare", params=[("product", two_laptops["mba_slug"]), ("product", two_laptops["xps_slug"])]
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["candidates"]) == 2
    slugs = {c["evidence"]["product_slug"] for c in body["candidates"]}
    assert slugs == {"macbook-air-m2", "xps-13"}
    assert body["candidates"][0]["rank"] == 1


def test_compare_respects_custom_priority_weights(client, two_laptops):
    response = client.get(
        "/compare",
        params=[
            ("product", two_laptops["mba_slug"]),
            ("product", two_laptops["xps_slug"]),
            ("price", "0"),
            ("performance", "1"),
            ("reviews", "0"),
            ("battery", "0"),
        ],
    )

    body = response.json()
    assert body["candidates"][0]["evidence"]["product_slug"] == "xps-13"


def test_compare_unknown_slug_is_excluded_not_errored(client, two_laptops):
    response = client.get(
        "/compare",
        params=[
            ("product", two_laptops["mba_slug"]),
            ("product", two_laptops["xps_slug"]),
            ("product", "does-not-exist"),
        ],
    )

    assert response.status_code == 200
    assert len(response.json()["candidates"]) == 2
