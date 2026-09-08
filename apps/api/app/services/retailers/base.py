"""The retailer adapter interface.

Every retailer (Amazon India, Flipkart, Croma, Myntra, Meesho, Nykaa, and
any future retailer) is accessed only through this interface, returning
`NormalizedOffer` — never a retailer-specific schema. This keeps each
retailer implementation swappable independently: a mock/dev adapter today,
an official API or licensed feed later, without touching the rest of the
app. See docs/data-sources.md for the no-scraping / no-ToS-bypass policy.
"""
from abc import ABC, abstractmethod
from typing import Any

from app.services.retailers.types import NormalizedOffer


class RetailerAdapter(ABC):
    slug: str
    display_name: str
    is_mock: bool = True

    @abstractmethod
    def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        """Free-text search against this retailer's catalog."""

    @abstractmethod
    def get_product(self, retailer_sku: str) -> NormalizedOffer | None:
        """Fetch one listing by this retailer's own SKU/identifier."""

    def get_price(self, retailer_sku: str) -> NormalizedOffer | None:
        """Price + currency for a listing. Default: reuse get_product,
        since mock/dev adapters fetch price and product data together."""
        return self.get_product(retailer_sku)

    def get_availability(self, retailer_sku: str) -> NormalizedOffer | None:
        """Stock status for a listing. Default: reuse get_product."""
        return self.get_product(retailer_sku)

    @abstractmethod
    def get_offers(self, retailer_sku: str) -> list[NormalizedOffer]:
        """All seller offers for a listing (marketplace retailers may have
        more than one; most return a single offer)."""

    @abstractmethod
    def normalize(self, raw: dict[str, Any]) -> NormalizedOffer:
        """Translate this retailer's raw record shape into NormalizedOffer."""

    @abstractmethod
    def get_product_url(self, retailer_sku: str) -> str:
        """Outbound URL to this retailer's product page for a SKU."""
