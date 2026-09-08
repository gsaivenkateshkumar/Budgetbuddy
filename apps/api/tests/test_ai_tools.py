from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.core.errors import AppError
from app.models import Brand, Category, PriceRecord, Product, Retailer, RetailerListing, Variant
from app.services.ai.tools import ALL_TOOLS, dispatch_tool


@pytest.fixture()
def catalog(db_session):
    brand = Brand(name="Apple", slug="apple")
    category = Category(name="Laptops", slug="laptops")
    retailer = Retailer(name="Amazon India", slug="amazon-in")
    db_session.add_all([brand, category, retailer])
    db_session.flush()

    product = Product(brand=brand, category=category, name="MacBook Air M2", slug="macbook-air-m2")
    db_session.add(product)
    db_session.flush()

    variant = Variant(product=product, sku="MBA-8-256", name="MBA 8/256", specs={"ram_gb": 8})
    db_session.add(variant)
    db_session.flush()

    listing = RetailerListing(
        variant=variant, retailer=retailer, product_url="https://amazon.example/mba", title="MBA"
    )
    db_session.add(listing)
    db_session.flush()
    db_session.add(
        PriceRecord(
            retailer_listing=listing,
            price=Decimal("94900"),
            currency="INR",
            in_stock=True,
            source="mock:amazon-in_adapter",
            collected_at=datetime.now(UTC),
        )
    )
    db_session.commit()
    return {"slug": product.slug, "sku": variant.sku}


def test_all_tools_have_names_and_json_schema_parameters():
    for tool in ALL_TOOLS:
        assert tool.name
        assert tool.description
        assert tool.parameters.get("type") == "object"


def test_dispatch_search_products_returns_real_catalog_data(db_session, catalog):
    result = dispatch_tool(db_session, "search_products", {"q": "macbook"})
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "macbook-air-m2"


def test_dispatch_get_product_details_returns_real_data(db_session, catalog):
    result = dispatch_tool(db_session, "get_product_details", {"slug": catalog["slug"]})
    assert result["slug"] == "macbook-air-m2"
    assert result["variants"][0]["offers"][0]["price"] == "94900.00"


def test_dispatch_get_product_details_missing_slug_raises():
    with pytest.raises(AppError):
        dispatch_tool(None, "get_product_details", {})


def test_dispatch_compare_products_requires_two_slugs():
    with pytest.raises(AppError):
        dispatch_tool(None, "compare_products", {"product_slugs": ["only-one"]})


def test_dispatch_get_prices_returns_real_offers(db_session, catalog):
    result = dispatch_tool(db_session, "get_prices", {"slug": catalog["slug"], "sku": catalog["sku"]})
    assert len(result) == 1
    assert result[0]["price"] == "94900.00"


def test_dispatch_unknown_tool_raises():
    with pytest.raises(AppError, match="Unknown tool"):
        dispatch_tool(None, "not_a_real_tool", {})
