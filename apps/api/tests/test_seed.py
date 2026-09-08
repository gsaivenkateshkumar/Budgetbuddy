"""Verifies the dev seed script populates a queryable catalog end-to-end."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from app.models import Brand, PriceRecord, Product, Retailer, RetailerListing, Variant


def test_seed_populates_queryable_catalog(db_session, monkeypatch):
    import seed as seed_module

    monkeypatch.setattr(seed_module, "SessionLocal", lambda: db_session)
    # seed() closes the session it creates; keep the test's db_session usable
    # afterward by preventing that close from tearing down the connection.
    monkeypatch.setattr(db_session, "close", lambda: None)

    seed_module.seed()

    assert db_session.query(Brand).count() == 3
    assert db_session.query(Product).count() == 4
    assert db_session.query(Variant).count() == 8
    assert db_session.query(Retailer).count() == 6
    assert db_session.query(RetailerListing).count() == 18
    assert db_session.query(PriceRecord).count() > 0

    macbook = db_session.query(Product).filter_by(slug="apple-macbook-air-m2").one()
    assert macbook.brand.name == "Apple"
    listing = macbook.variants[0].retailer_listings[0]
    latest_price = max(listing.price_records, key=lambda p: p.collected_at)
    assert latest_price.currency == "INR"
    assert latest_price.price > 0
