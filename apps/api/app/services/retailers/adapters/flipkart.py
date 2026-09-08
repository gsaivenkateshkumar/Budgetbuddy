from typing import Any

from app.services.retailers.mock_base import MockRetailerAdapter


class FlipkartAdapter(MockRetailerAdapter):
    slug = "flipkart"
    display_name = "Flipkart"

    def _raw_listings(self) -> list[dict[str, Any]]:
        return [
            {
                "sku": "FK-MBA-M2-8-256",
                "brand": "Apple",
                "title": "Apple MacBook Air M2 Chip (8GB, 256GB SSD) Space Gray",
                "price": 95900,
                "list_price": 99900,
                "in_stock": True,
                "rating": 4.5,
                "review_count": 2870,
                "specs": {"processor": "Apple M2", "ram_gb": 8, "storage_gb": 256},
            },
            {
                "sku": "FK-S23-128-BLACK",
                "brand": "Samsung",
                "title": "SAMSUNG Galaxy S23 5G (Phantom Black, 128 GB)",
                "price": 63999,
                "list_price": 74999,
                "in_stock": True,
                "rating": 4.3,
                "review_count": 4110,
                "specs": {"ram_gb": 8, "storage_gb": 128},
            },
        ]
