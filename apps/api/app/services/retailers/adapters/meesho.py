from typing import Any

from app.services.retailers.mock_base import MockRetailerAdapter


class MeeshoAdapter(MockRetailerAdapter):
    """Meesho is a multi-seller marketplace — mock listings carry a
    seller_name to reflect that RetailerListing.seller_name is meaningful
    here, unlike single-seller retailers."""

    slug = "meesho"
    display_name = "Meesho"

    def _raw_listings(self) -> list[dict[str, Any]]:
        return [
            {
                "sku": "MSH-S23-128-BLACK",
                "brand": "Samsung",
                "title": "Samsung Galaxy S23 5G 128GB Phantom Black",
                "price": 62999,
                "list_price": 74999,
                "in_stock": True,
                "seller_name": "Meesho Retail Partner",
                "rating": 4.1,
                "review_count": 188,
                "specs": {"ram_gb": 8, "storage_gb": 128},
            },
        ]
