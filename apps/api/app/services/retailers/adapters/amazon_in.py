from typing import Any

from app.services.retailers.mock_base import MockRetailerAdapter


class AmazonInAdapter(MockRetailerAdapter):
    slug = "amazon-in"
    display_name = "Amazon India"

    def _raw_listings(self) -> list[dict[str, Any]]:
        return [
            {
                "sku": "AMZ-MBA-M2-8-256",
                "brand": "Apple",
                "title": "Apple MacBook Air M2 (8GB/256GB, Space Gray)",
                "price": 94900,
                "list_price": 99900,
                "in_stock": True,
                "rating": 4.6,
                "review_count": 3210,
                "specs": {"processor": "Apple M2", "ram_gb": 8, "storage_gb": 256},
            },
            {
                "sku": "AMZ-S23-128-BLACK",
                "brand": "Samsung",
                "title": "Samsung Galaxy S23 5G (128GB, Phantom Black)",
                "price": 64999,
                "list_price": 74999,
                "in_stock": True,
                "rating": 4.4,
                "review_count": 5602,
                "specs": {"ram_gb": 8, "storage_gb": 128},
            },
        ]
