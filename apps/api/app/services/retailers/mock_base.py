"""Shared implementation for development/mock retailer adapters.

A mock adapter returns realistic but clearly-fictional data from a small
in-memory fixture list, `is_mock=True` throughout, and `source` values
prefixed `mock:` — never presented as live retailer data. See
docs/data-sources.md. No network calls, no scraping.

Subclasses supply `slug`, `display_name`, and `_raw_listings()`.
"""
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from app.services.retailers.base import RetailerAdapter
from app.services.retailers.types import NormalizedOffer


class MockRetailerAdapter(RetailerAdapter, ABC):
    is_mock = True

    @abstractmethod
    def _raw_listings(self) -> list[dict[str, Any]]:
        """This adapter's small in-memory dataset of raw listing records."""

    def get_product_url(self, retailer_sku: str) -> str:
        domain = self.slug.replace("-", "")
        return f"https://www.{domain}.example/dp/{retailer_sku.lower()}"

    def normalize(self, raw: dict[str, Any]) -> NormalizedOffer:
        return NormalizedOffer(
            retailer_slug=self.slug,
            retailer_sku=raw["sku"],
            title=raw["title"],
            product_url=self.get_product_url(raw["sku"]),
            price=Decimal(str(raw["price"])),
            list_price=Decimal(str(raw["list_price"])) if raw.get("list_price") is not None else None,
            currency=raw.get("currency", "INR"),
            in_stock=raw.get("in_stock", True),
            availability_text=raw.get("availability_text"),
            seller_name=raw.get("seller_name"),
            condition=raw.get("condition", "new"),
            rating=raw.get("rating"),
            review_count=raw.get("review_count"),
            specs=raw.get("specs") or {},
            image_url=raw.get("image_url"),
            source=f"mock:{self.slug}_adapter",
            collected_at=datetime.now(UTC),
        )

    def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        needle = query.strip().lower()
        matches = [
            raw
            for raw in self._raw_listings()
            if not needle or needle in raw["title"].lower() or needle in raw.get("brand", "").lower()
        ]
        return [self.normalize(raw) for raw in matches[:limit]]

    def get_product(self, retailer_sku: str) -> NormalizedOffer | None:
        for raw in self._raw_listings():
            if raw["sku"] == retailer_sku:
                return self.normalize(raw)
        return None

    def get_offers(self, retailer_sku: str) -> list[NormalizedOffer]:
        offer = self.get_product(retailer_sku)
        return [offer] if offer else []
