from typing import Any

from app.services.retailers.mock_base import MockRetailerAdapter


class MyntraAdapter(MockRetailerAdapter):
    """Fashion retailer. Not part of the Phase 2 electronics seed catalog —
    included to demonstrate the adapter interface is category-agnostic."""

    slug = "myntra"
    display_name = "Myntra"

    def _raw_listings(self) -> list[dict[str, Any]]:
        return [
            {
                "sku": "MYN-TSHIRT-CREW-M",
                "brand": "Roadster",
                "title": "Roadster Men Cotton Crew-Neck T-Shirt, Navy Blue, M",
                "price": 499,
                "list_price": 999,
                "in_stock": True,
                "rating": 4.2,
                "review_count": 9840,
                "specs": {"size": "M", "material": "Cotton", "color": "Navy Blue"},
            },
        ]
