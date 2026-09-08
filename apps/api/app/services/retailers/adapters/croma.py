from typing import Any

from app.services.retailers.mock_base import MockRetailerAdapter


class CromaAdapter(MockRetailerAdapter):
    slug = "croma"
    display_name = "Croma"

    def _raw_listings(self) -> list[dict[str, Any]]:
        return [
            {
                "sku": "CROMA-MBA-M2-8-256",
                "brand": "Apple",
                "title": "Apple MacBook Air 13.6-inch M2 8GB 256GB SSD Space Grey",
                "price": 96900,
                "list_price": 99900,
                "in_stock": True,
                "rating": 4.5,
                "review_count": 640,
                "specs": {"processor": "Apple M2", "ram_gb": 8, "storage_gb": 256},
            },
            {
                "sku": "CROMA-S23-256-CREAM",
                "brand": "Samsung",
                "title": "Samsung Galaxy S23 5G 256GB Cream",
                "price": 75999,
                "list_price": 84999,
                "in_stock": True,
                "rating": 4.4,
                "review_count": 512,
                "specs": {"ram_gb": 8, "storage_gb": 256},
            },
        ]
