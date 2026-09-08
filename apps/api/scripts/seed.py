"""Seed a small, high-quality development dataset.

All data here is clearly fictional/development-safe (see docs/data-sources.md)
and exists to demonstrate search, product detail, variant matching, price
comparison, recommendation, and price history — never to be presented as
live retailer data.

Usage (from apps/api, with the venv active and migrations applied):
    python scripts/seed.py
"""
import sys
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.exc import OperationalError

from app.core.database import SessionLocal
from app.models import (
    Brand,
    Category,
    Image,
    PriceRecord,
    Product,
    Retailer,
    RetailerListing,
    ReviewSummary,
    Variant,
)

PLACEHOLDER_IMAGE = "https://placeholder.budgetbuddy.dev/{slug}.jpg"


def days_ago(n: int) -> datetime:
    return datetime.now(UTC) - timedelta(days=n)


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(Brand).count() > 0:
            print("Seed data already present — skipping. (Delete budget_buddy.db to reseed.)")
            return

        # --- Retailers -----------------------------------------------------
        # All six launch retailers are represented as clearly-labeled mock
        # adapters (is_mock=True). Only the electronics-relevant ones carry
        # listings in this seed set; Myntra/Nykaa (fashion/beauty) will get
        # listings once non-electronics categories are seeded.
        amazon_in = Retailer(name="Amazon India", slug="amazon-in", website_url="https://www.amazon.in")
        flipkart = Retailer(name="Flipkart", slug="flipkart", website_url="https://www.flipkart.com")
        croma = Retailer(name="Croma", slug="croma", website_url="https://www.croma.com")
        meesho = Retailer(name="Meesho", slug="meesho", website_url="https://www.meesho.com")
        myntra = Retailer(name="Myntra", slug="myntra", website_url="https://www.myntra.com")
        nykaa = Retailer(name="Nykaa", slug="nykaa", website_url="https://www.nykaa.com")
        db.add_all([amazon_in, flipkart, croma, meesho, myntra, nykaa])

        # --- Brands & categories --------------------------------------------
        apple = Brand(name="Apple", slug="apple", country="US")
        dell = Brand(name="Dell", slug="dell", country="US")
        samsung = Brand(name="Samsung", slug="samsung", country="KR")
        db.add_all([apple, dell, samsung])

        electronics = Category(name="Electronics", slug="electronics")
        laptops = Category(name="Laptops", slug="laptops", parent=electronics)
        smartphones = Category(name="Smartphones", slug="smartphones", parent=electronics)
        db.add_all([electronics, laptops, smartphones])
        db.flush()

        # --- Products & variants ---------------------------------------------
        macbook_air = Product(
            brand=apple,
            category=laptops,
            name="MacBook Air M2",
            slug="apple-macbook-air-m2",
            description="13.6-inch laptop with the Apple M2 chip.",
        )
        xps_13 = Product(
            brand=dell,
            category=laptops,
            name="XPS 13",
            slug="dell-xps-13",
            description="13.4-inch premium ultrabook.",
        )
        galaxy_s23 = Product(
            brand=samsung,
            category=smartphones,
            name="Galaxy S23",
            slug="samsung-galaxy-s23",
            description="6.1-inch flagship smartphone.",
        )
        iphone_15 = Product(
            brand=apple,
            category=smartphones,
            name="iPhone 15",
            slug="apple-iphone-15",
            description="6.1-inch smartphone with the A16 Bionic chip.",
        )
        db.add_all([macbook_air, xps_13, galaxy_s23, iphone_15])
        db.flush()

        variants = [
            Variant(
                product=macbook_air,
                sku="MBA-M2-8-256-SG",
                name="MacBook Air M2 8GB/256GB Space Gray",
                mpn="MLXW3HN/A",
                specs={
                    "processor": "Apple M2",
                    "ram_gb": 8,
                    "storage_gb": 256,
                    "screen_size_in": 13.6,
                    "color": "Space Gray",
                    "battery_wh": 52.6,
                },
            ),
            Variant(
                product=macbook_air,
                sku="MBA-M2-16-512-SG",
                name="MacBook Air M2 16GB/512GB Space Gray",
                mpn="MLY23HN/A",
                specs={
                    "processor": "Apple M2",
                    "ram_gb": 16,
                    "storage_gb": 512,
                    "screen_size_in": 13.6,
                    "color": "Space Gray",
                    "battery_wh": 52.6,
                },
            ),
            Variant(
                product=xps_13,
                sku="XPS13-I5-16-512",
                name="XPS 13 Intel i5 16GB/512GB",
                mpn="XPS9340-I5",
                specs={
                    "processor": "Intel Core i5-1334U",
                    "ram_gb": 16,
                    "storage_gb": 512,
                    "screen_size_in": 13.4,
                    "color": "Platinum",
                    "battery_wh": 55,
                },
            ),
            Variant(
                product=xps_13,
                sku="XPS13-I7-16-1024",
                name="XPS 13 Intel i7 16GB/1TB",
                mpn="XPS9340-I7",
                specs={
                    "processor": "Intel Core i7-1355U",
                    "ram_gb": 16,
                    "storage_gb": 1024,
                    "screen_size_in": 13.4,
                    "color": "Graphite",
                    "battery_wh": 55,
                },
            ),
            Variant(
                product=galaxy_s23,
                sku="S23-128-BLACK",
                name="Galaxy S23 128GB Phantom Black",
                gtin="08806094875123",
                specs={
                    "processor": "Snapdragon 8 Gen 2",
                    "ram_gb": 8,
                    "storage_gb": 128,
                    "screen_size_in": 6.1,
                    "color": "Phantom Black",
                    "battery_mah": 3900,
                },
            ),
            Variant(
                product=galaxy_s23,
                sku="S23-256-CREAM",
                name="Galaxy S23 256GB Cream",
                gtin="08806094875256",
                specs={
                    "processor": "Snapdragon 8 Gen 2",
                    "ram_gb": 8,
                    "storage_gb": 256,
                    "screen_size_in": 6.1,
                    "color": "Cream",
                    "battery_mah": 3900,
                },
            ),
            Variant(
                product=iphone_15,
                sku="IP15-128-BLUE",
                name="iPhone 15 128GB Blue",
                mpn="MTP13HN/A",
                specs={
                    "processor": "Apple A16 Bionic",
                    "ram_gb": 6,
                    "storage_gb": 128,
                    "screen_size_in": 6.1,
                    "color": "Blue",
                    "battery_mah": 3349,
                },
            ),
            Variant(
                product=iphone_15,
                sku="IP15-256-BLACK",
                name="iPhone 15 256GB Black",
                mpn="MTP53HN/A",
                specs={
                    "processor": "Apple A16 Bionic",
                    "ram_gb": 6,
                    "storage_gb": 256,
                    "screen_size_in": 6.1,
                    "color": "Black",
                    "battery_mah": 3349,
                },
            ),
        ]
        db.add_all(variants)
        db.flush()

        for variant in variants:
            db.add(
                Image(
                    variant=variant,
                    url=PLACEHOLDER_IMAGE.format(slug=variant.sku.lower()),
                    alt_text=variant.name,
                    position=0,
                    is_primary=True,
                )
            )

        # --- Retailer listings + price history + review summaries ------------
        listing_plans = [
            # (variant, retailer, base_price, list_price, seller_name)
            (variants[0], amazon_in, Decimal("94900"), Decimal("99900"), None),
            (variants[0], flipkart, Decimal("95900"), Decimal("99900"), None),
            (variants[0], croma, Decimal("96900"), Decimal("99900"), None),
            (variants[1], amazon_in, Decimal("114900"), Decimal("119900"), None),
            (variants[1], flipkart, Decimal("115900"), Decimal("119900"), None),
            (variants[2], flipkart, Decimal("89990"), Decimal("94990"), None),
            (variants[2], croma, Decimal("91990"), Decimal("94990"), None),
            (variants[3], amazon_in, Decimal("119990"), Decimal("129990"), None),
            (variants[3], flipkart, Decimal("120990"), Decimal("129990"), None),
            (variants[4], amazon_in, Decimal("64999"), Decimal("74999"), None),
            (variants[4], flipkart, Decimal("63999"), Decimal("74999"), None),
            (variants[4], meesho, Decimal("62999"), Decimal("74999"), "Meesho Retail Partner"),
            (variants[5], amazon_in, Decimal("74999"), Decimal("84999"), None),
            (variants[5], croma, Decimal("75999"), Decimal("84999"), None),
            (variants[6], amazon_in, Decimal("74900"), Decimal("79900"), None),
            (variants[6], flipkart, Decimal("75900"), Decimal("79900"), None),
            (variants[7], amazon_in, Decimal("84900"), Decimal("89900"), None),
            (variants[7], croma, Decimal("85900"), Decimal("89900"), None),
        ]

        for variant, retailer, base_price, list_price, seller_name in listing_plans:
            listing = RetailerListing(
                variant=variant,
                retailer=retailer,
                retailer_sku=f"{retailer.slug.upper()}-{variant.sku}",
                product_url=f"https://www.{retailer.slug.replace('-', '')}.example/dp/{variant.sku.lower()}",
                title=f"{variant.name} ({retailer.name})",
                seller_name=seller_name,
                condition="new",
            )
            db.add(listing)
            db.flush()

            # Price history: a gentle downward drift culminating in today's price.
            history_offsets = [30, 21, 14, 7, 1]
            for i, offset in enumerate(history_offsets):
                drift = Decimal(len(history_offsets) - i - 1) * Decimal("400")
                db.add(
                    PriceRecord(
                        retailer_listing=listing,
                        price=base_price + drift,
                        list_price=list_price,
                        currency="INR",
                        in_stock=True,
                        availability_text="In Stock",
                        source=f"mock:{retailer.slug}_adapter",
                        collected_at=days_ago(offset),
                        confidence=1.0,
                    )
                )
            # Most recent (current) price observation.
            db.add(
                PriceRecord(
                    retailer_listing=listing,
                    price=base_price,
                    list_price=list_price,
                    currency="INR",
                    in_stock=True,
                    availability_text="In Stock",
                    source=f"mock:{retailer.slug}_adapter",
                    collected_at=datetime.now(UTC) - timedelta(minutes=8),
                    confidence=1.0,
                )
            )

            db.add(
                ReviewSummary(
                    retailer_listing=listing,
                    average_rating=4.3,
                    review_count=1240,
                    positive_aspects=["build quality", "battery life"],
                    negative_aspects=["price"],
                    source=f"mock:{retailer.slug}_adapter",
                    collected_at=days_ago(1),
                )
            )

        db.commit()
        print(
            f"Seeded {len(listing_plans)} retailer listings across "
            f"{db.query(Product).count()} products / {db.query(Variant).count()} variants."
        )
    finally:
        db.close()


if __name__ == "__main__":
    try:
        seed()
    except OperationalError as exc:
        print(f"Database error: {exc}\nRun 'alembic upgrade head' first.", file=sys.stderr)
        sys.exit(1)
