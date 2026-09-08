from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.models import (
    Brand,
    Category,
    PriceRecord,
    Product,
    Retailer,
    RetailerListing,
    ReviewSummary,
    Variant,
)
from app.services.recommendation.engine import recommend
from app.services.recommendation.types import HardConstraints, SoftPreferenceWeights


def _add_listing(db_session, variant, retailer, price, *, in_stock=True, rating=None, review_count=None):
    listing = RetailerListing(
        variant=variant,
        retailer=retailer,
        product_url=f"https://{retailer.slug}.example/{variant.sku.lower()}",
        title=variant.name,
    )
    db_session.add(listing)
    db_session.flush()
    db_session.add(
        PriceRecord(
            retailer_listing=listing,
            price=Decimal(str(price)),
            currency="INR",
            in_stock=in_stock,
            source=f"mock:{retailer.slug}_adapter",
            collected_at=datetime.now(UTC),
        )
    )
    if rating is not None:
        db_session.add(
            ReviewSummary(
                retailer_listing=listing,
                average_rating=rating,
                review_count=review_count or 0,
                source=f"mock:{retailer.slug}_adapter",
                collected_at=datetime.now(UTC),
            )
        )
    return listing


@pytest.fixture()
def laptop_catalog(db_session):
    brand = Brand(name="Apple", slug="apple")
    other_brand = Brand(name="Dell", slug="dell")
    category = Category(name="Laptops", slug="laptops")
    retailer = Retailer(name="Amazon India", slug="amazon-in")
    db_session.add_all([brand, other_brand, category, retailer])
    db_session.flush()

    budget = Product(brand=other_brand, category=category, name="Budget Laptop", slug="budget-laptop")
    mid = Product(brand=brand, category=category, name="Mid Laptop", slug="mid-laptop")
    premium = Product(brand=brand, category=category, name="Premium Laptop", slug="premium-laptop")
    db_session.add_all([budget, mid, premium])
    db_session.flush()

    v_budget = Variant(
        product=budget, sku="BUDGET-8-256", name="Budget 8GB/256GB", specs={"ram_gb": 8, "storage_gb": 256}
    )
    v_mid = Variant(
        product=mid, sku="MID-16-512", name="Mid 16GB/512GB", specs={"ram_gb": 16, "storage_gb": 512}
    )
    v_premium = Variant(
        product=premium,
        sku="PREMIUM-32-1024",
        name="Premium 32GB/1TB",
        specs={"ram_gb": 32, "storage_gb": 1024},
    )
    db_session.add_all([v_budget, v_mid, v_premium])
    db_session.flush()

    _add_listing(db_session, v_budget, retailer, 40000, rating=3.8, review_count=50)
    _add_listing(db_session, v_mid, retailer, 70000, rating=4.5, review_count=500)
    _add_listing(db_session, v_premium, retailer, 150000, rating=4.7, review_count=1000)
    db_session.commit()

    return {"budget": v_budget, "mid": v_mid, "premium": v_premium, "category": category.slug}


def test_hard_budget_constraint_excludes_over_budget_candidates(db_session, laptop_catalog):
    hard = HardConstraints(category_slug="laptops", max_price=Decimal("80000"))

    result = recommend(db_session, hard)

    skus = {c.evidence.variant_sku for c in result.candidates}
    assert skus == {"BUDGET-8-256", "MID-16-512"}
    assert result.excluded_count == 1


def test_hard_min_ram_constraint_excludes_insufficient_ram(db_session, laptop_catalog):
    hard = HardConstraints(category_slug="laptops", min_ram_gb=16)

    result = recommend(db_session, hard)

    skus = {c.evidence.variant_sku for c in result.candidates}
    assert skus == {"MID-16-512", "PREMIUM-32-1024"}


def test_out_of_stock_excluded_when_require_in_stock(db_session, laptop_catalog):
    retailer = Retailer(name="Flipkart", slug="flipkart")
    db_session.add(retailer)
    db_session.flush()
    v_budget = laptop_catalog["budget"]
    _add_listing(db_session, v_budget, retailer, 35000, in_stock=False)
    db_session.commit()

    hard = HardConstraints(category_slug="laptops", require_in_stock=True)
    result = recommend(db_session, hard)

    budget_candidate = next(c for c in result.candidates if c.evidence.variant_sku == "BUDGET-8-256")
    # The out-of-stock (cheaper) Flipkart offer must not be used as best price.
    assert budget_candidate.evidence.price == Decimal("40000")


def test_all_candidates_scored_and_ranked(db_session, laptop_catalog):
    hard = HardConstraints(category_slug="laptops")

    result = recommend(db_session, hard)

    assert len(result.candidates) == 3
    ranks = [c.rank for c in result.candidates]
    assert ranks == [1, 2, 3]
    scores = [c.total_score for c in result.candidates]
    assert scores == sorted(scores, reverse=True)


def test_price_emphasis_favors_cheaper_candidate(db_session, laptop_catalog):
    hard = HardConstraints(category_slug="laptops")
    price_focused = SoftPreferenceWeights(price=1.0, performance=0.0, reviews=0.0, battery=0.0)

    result = recommend(db_session, hard, price_focused)

    assert result.candidates[0].evidence.variant_sku == "BUDGET-8-256"


def test_performance_emphasis_favors_higher_spec_candidate(db_session, laptop_catalog):
    hard = HardConstraints(category_slug="laptops")
    perf_focused = SoftPreferenceWeights(price=0.0, performance=1.0, reviews=0.0, battery=0.0)

    result = recommend(db_session, hard, perf_focused)

    assert result.candidates[0].evidence.variant_sku == "PREMIUM-32-1024"


def test_labels_assigned_best_overall_budget_and_value(db_session, laptop_catalog):
    hard = HardConstraints(category_slug="laptops")

    result = recommend(db_session, hard)

    all_labels = {label for c in result.candidates for label in c.labels}
    assert "Best Overall" in all_labels
    assert "Best Budget Option" in all_labels
    assert "Best Value" in all_labels

    budget_candidate = next(c for c in result.candidates if c.evidence.variant_sku == "BUDGET-8-256")
    assert "Best Budget Option" in budget_candidate.labels


def test_explanation_does_not_claim_reviews_when_no_evidence(db_session):
    brand = Brand(name="NoName", slug="noname")
    category = Category(name="Laptops2", slug="laptops2")
    retailer = Retailer(name="Amazon India", slug="amazon-in")
    db_session.add_all([brand, category, retailer])
    db_session.flush()
    product = Product(brand=brand, category=category, name="Mystery Laptop", slug="mystery-laptop")
    db_session.add(product)
    db_session.flush()
    variant = Variant(product=product, sku="MYSTERY-1", name="Mystery 1", specs={})
    db_session.add(variant)
    db_session.flush()
    _add_listing(db_session, variant, retailer, 50000)  # no rating
    db_session.commit()

    result = recommend(db_session, HardConstraints(category_slug="laptops2"))

    candidate = result.candidates[0]
    assert candidate.evidence.rating is None
    assert "No review data available yet" in candidate.explanation
    assert not any("Rated" in r for r in candidate.explanation)


def test_no_candidates_returns_empty_result_not_error(db_session):
    result = recommend(db_session, HardConstraints(category_slug="does-not-exist"))

    assert result.candidates == []
    assert result.excluded_count == 0


def test_preference_weights_normalize_to_sum_one():
    weights = SoftPreferenceWeights(price=2.0, performance=2.0, reviews=0.0, battery=0.0).normalized()

    assert pytest.approx(sum(weights.values())) == 1.0
    assert weights["price"] == pytest.approx(0.5)
    assert weights["performance"] == pytest.approx(0.5)
