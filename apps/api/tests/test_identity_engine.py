import pytest

from app.models import Brand, Category, Product, Variant
from app.services.identity.matcher import match
from app.services.identity.types import MatchSignals, MatchType


def signals(**overrides):
    base = {
        "brand_slug": "apple",
        "category_slug": "laptops",
        "product_name": "MacBook Air M2",
        "specs": {"ram_gb": 8, "storage_gb": 256, "color": "Space Gray"},
    }
    base.update(overrides)
    return MatchSignals(**base)


def test_matching_gtin_is_exact_match_even_with_different_names():
    a = signals(gtin="08806094875123", product_name="Galaxy S23 (Black)")
    b = signals(gtin="08806094875123", product_name="Samsung Galaxy S23 5G Phantom Black")

    result = match(a, b)

    assert result.match_type == MatchType.EXACT_MATCH
    assert result.confidence == 1.0
    assert "gtin" in result.reasons[0]


def test_matching_mpn_is_exact_match():
    a = signals(mpn="MLXW3HN/A")
    b = signals(mpn="mlxw3hn/a")  # case-insensitive

    result = match(a, b)

    assert result.match_type == MatchType.EXACT_MATCH


def test_conflicting_identifiers_do_not_short_circuit_to_no_match():
    # No shared strong identifier present -> falls through to structured comparison.
    a = signals(gtin="111")
    b = signals(gtin=None)

    result = match(a, b)

    assert result.match_type in {MatchType.EXACT_MATCH, MatchType.VARIANT}


def test_same_brand_model_identical_specs_without_identifiers_is_exact_match():
    a = signals()
    b = signals()

    result = match(a, b)

    assert result.match_type == MatchType.EXACT_MATCH
    assert result.confidence < 1.0  # lower confidence than an identifier-based match


def test_same_brand_model_different_specs_is_variant():
    a = signals(specs={"ram_gb": 8, "storage_gb": 256, "color": "Space Gray"})
    b = signals(specs={"ram_gb": 16, "storage_gb": 512, "color": "Space Gray"})

    result = match(a, b)

    assert result.match_type == MatchType.VARIANT
    assert 0.0 < result.confidence < 1.0


def test_same_brand_different_model_is_similar():
    a = signals(product_name="MacBook Air M2")
    b = signals(product_name="MacBook Pro M2")

    result = match(a, b)

    assert result.match_type == MatchType.SIMILAR


def test_same_category_different_brand_is_alternative():
    a = signals(brand_slug="apple", product_name="MacBook Air M2")
    b = signals(brand_slug="dell", product_name="XPS 13")

    result = match(a, b)

    assert result.match_type == MatchType.ALTERNATIVE


def test_different_category_is_no_match():
    a = signals(category_slug="laptops")
    b = signals(category_slug="smartphones")

    result = match(a, b)

    assert result.match_type == MatchType.NO_MATCH
    assert result.confidence == 0.0


def test_missing_category_is_no_match():
    a = signals(category_slug=None)
    b = signals(category_slug="laptops")

    result = match(a, b)

    assert result.match_type == MatchType.NO_MATCH


@pytest.mark.parametrize(
    ("overlap_specs_a", "overlap_specs_b"),
    [
        ({"ram_gb": 8}, {"ram_gb": 8, "storage_gb": 256}),
        ({}, {"ram_gb": 8}),
    ],
)
def test_confidence_always_within_bounds(overlap_specs_a, overlap_specs_b):
    a = signals(specs=overlap_specs_a)
    b = signals(specs=overlap_specs_b)

    result = match(a, b)

    assert 0.0 <= result.confidence <= 1.0


def test_match_signals_from_variant_reads_orm_hierarchy(db_session):
    brand = Brand(name="Apple", slug="apple")
    category = Category(name="Laptops", slug="laptops")
    db_session.add_all([brand, category])
    db_session.flush()

    product = Product(brand=brand, category=category, name="MacBook Air M2", slug="mba-m2")
    db_session.add(product)
    db_session.flush()

    variant = Variant(
        product=product, sku="MBA-8-256", name="MacBook Air M2 8GB/256GB", gtin="ABC123", specs={"ram_gb": 8}
    )
    db_session.add(variant)
    db_session.commit()

    result = MatchSignals.from_variant(variant)

    assert result.brand_slug == "apple"
    assert result.category_slug == "laptops"
    assert result.product_name == "MacBook Air M2"
    assert result.gtin == "ABC123"
    assert result.specs == {"ram_gb": 8}
