from typing import Any

from app.services.retailers.mock_base import MockRetailerAdapter


class NykaaAdapter(MockRetailerAdapter):
    """Beauty retailer. Not part of the Phase 2 electronics seed catalog —
    included to demonstrate the adapter interface is category-agnostic."""

    slug = "nykaa"
    display_name = "Nykaa"

    def _raw_listings(self) -> list[dict[str, Any]]:
        return [
            {
                "sku": "NYK-VITC-SERUM-30ML",
                "brand": "Minimalist",
                "title": "Minimalist 10% Vitamin C Face Serum, 30ml",
                "price": 549,
                "list_price": 699,
                "in_stock": True,
                "rating": 4.3,
                "review_count": 15420,
                "specs": {"volume_ml": 30, "skin_type": "All"},
            },
        ]
