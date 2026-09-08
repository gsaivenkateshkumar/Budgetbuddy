"""Real Amazon India integration via the Amazon Creators API — the
official, currently-supported successor to the Product Advertising API
5.0 (PA-API 5), which Amazon retired on 2026-05-15. No scraping, no
unofficial endpoints: this adapter only ever calls Amazon's documented
OAuth2 + REST surface.

Endpoints/shapes below are sourced from Amazon's public Creators API
documentation and community migration write-ups current as of
implementation time (Amazon's full reference is gated behind an approved
Associates login this environment cannot reach). Marked inline wherever a
detail should be re-verified against your own account's onboarding docs
rather than trusted blindly — regional routing and exact resource paths
are the parts most likely to need adjustment per-account.

Eligibility (documented, not something this code can bypass or should
try to): a *final-accepted* Amazon Associates account with at least 10
qualifying referred sales in the trailing 30 days. A brand-new project
will not meet this immediately — see docs/data-sources.md for exactly
what remains before live ingestion can start.

This adapter is deliberately NOT registered in
app/services/retailers/registry.py yet: doing so would replace the
"amazon-in" mock adapter that existing demo-data tests depend on. Once
Creators API credentials are live and validated end-to-end, promote it
there (see registry.py's own docstring for that exact mechanism) as a
follow-up — not bundled into this change.
"""
import time
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

import httpx

from app.services.retailers.base import RetailerAdapter
from app.services.retailers.types import NormalizedOffer

_SEARCH_PATH = "/catalog/v1/searchItems"
_GET_ITEMS_PATH = "/catalog/v1/getItems"
_MAX_ITEMS_PER_CALL = 10  # Amazon's documented per-call cap for both endpoints.
_MAX_RETRIES = 3
_RETRY_BACKOFF_SECONDS = 1.0
_RESOURCES = [
    "itemInfo.title",
    "itemInfo.byLineInfo",
    "images.primary.large",
    "offers.listings.price",
    "offers.listings.availability",
    "offers.listings.merchantInfo",
]


class AmazonCredentialsMissingError(RuntimeError):
    """Raised when a network-calling method is invoked without
    AMAZON_CREATORS_CREDENTIAL_ID / _SECRET / AMAZON_PARTNER_TAG
    configured. The adapter itself is always constructible without
    credentials — the app must never require Amazon to start."""


class AmazonAPIError(RuntimeError):
    """A configured request to Amazon failed. The message includes the
    HTTP status and response body for diagnosis — never the bearer token,
    the client secret, or any request header."""


class AmazonCreatorsAdapter(RetailerAdapter):
    slug = "amazon-in"
    display_name = "Amazon India"
    is_mock = False

    def __init__(
        self,
        credential_id: str | None = None,
        credential_secret: str | None = None,
        partner_tag: str | None = None,
        marketplace: str | None = None,
        token_url: str | None = None,
        api_base_url: str | None = None,
    ):
        # Falls back to Settings so the adapter can be constructed with no
        # arguments (matches every other adapter's zero-arg registry
        # pattern) while still being independently testable with explicit
        # fake values.
        from app.core.config import get_settings

        settings = get_settings()
        self._credential_id = (
            credential_id if credential_id is not None else settings.amazon_creators_credential_id
        )
        self._credential_secret = (
            credential_secret if credential_secret is not None else settings.amazon_creators_credential_secret
        )
        self._partner_tag = partner_tag if partner_tag is not None else settings.amazon_partner_tag
        self._marketplace = marketplace or settings.amazon_marketplace
        self._token_url = token_url or settings.amazon_creators_token_url
        self._api_base_url = api_base_url or settings.amazon_creators_api_base_url

        self._access_token: str | None = None
        self._token_expires_at: float = 0.0

    @property
    def is_configured(self) -> bool:
        return bool(self._credential_id and self._credential_secret and self._partner_tag)

    def _require_configured(self) -> None:
        if not self.is_configured:
            raise AmazonCredentialsMissingError(
                "Amazon Creators API is not configured — set AMAZON_CREATORS_CREDENTIAL_ID, "
                "AMAZON_CREATORS_CREDENTIAL_SECRET, and AMAZON_PARTNER_TAG to enable Amazon ingestion."
            )

    def _get_access_token(self, client: httpx.Client) -> str:
        if self._access_token and time.monotonic() < self._token_expires_at:
            return self._access_token

        try:
            response = client.post(
                self._token_url,
                auth=(self._credential_id, self._credential_secret),
                data={"grant_type": "client_credentials", "scope": "creatorsapi::default"},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            raise AmazonAPIError(
                f"Amazon token request failed: {exc.response.status_code} {exc.response.text[:300]}"
            ) from exc
        except httpx.HTTPError as exc:
            raise AmazonAPIError(f"Amazon token request failed: {exc}") from exc

        token = data["access_token"]
        # Refresh a little early rather than exactly at expiry.
        self._token_expires_at = time.monotonic() + max(int(data.get("expires_in", 3600)) - 60, 60)
        self._access_token = token
        return token

    def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        self._require_configured()
        body = {**body, "partnerTag": self._partner_tag, "marketplace": self._marketplace}

        with httpx.Client(timeout=15.0) as client:
            token = self._get_access_token(client)
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "x-marketplace": self._marketplace,
            }

            last_error: Exception | None = None
            for attempt in range(_MAX_RETRIES):
                try:
                    response = client.post(f"{self._api_base_url}{path}", json=body, headers=headers)
                    if response.status_code == 429:
                        last_error = AmazonAPIError("Amazon rate limit (429) — retries exhausted")
                        time.sleep(_RETRY_BACKOFF_SECONDS * (2**attempt))
                        continue
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as exc:
                    raise AmazonAPIError(
                        f"Amazon request failed: {exc.response.status_code} {exc.response.text[:300]}"
                    ) from exc
                except httpx.HTTPError as exc:
                    raise AmazonAPIError(f"Amazon request failed: {exc}") from exc

            raise last_error or AmazonAPIError("Amazon request failed after retries")

    def get_product_url(self, retailer_sku: str) -> str:
        return f"https://{self._marketplace}/dp/{retailer_sku}?tag={self._partner_tag or ''}"

    def normalize(self, raw: dict[str, Any]) -> NormalizedOffer:
        item_info = raw.get("itemInfo") or {}
        title = ((item_info.get("title") or {}).get("displayValue")) or raw.get("ASIN", "Unknown product")
        brand = ((item_info.get("byLineInfo") or {}).get("brand") or {}).get("displayValue")

        listings = ((raw.get("offers") or {}).get("listings")) or []
        first_listing = listings[0] if listings else {}
        price_info = first_listing.get("price") or {}
        price = price_info.get("amount")
        savings = price_info.get("savings") or {}
        list_price = None
        if price is not None and savings.get("amount") is not None:
            list_price = Decimal(str(price)) + Decimal(str(savings["amount"]))

        availability = first_listing.get("availability") or {}
        merchant = (first_listing.get("merchantInfo") or {}).get("name")

        image_url = (((raw.get("images") or {}).get("primary") or {}).get("large") or {}).get("url")

        return NormalizedOffer(
            retailer_slug=self.slug,
            retailer_sku=raw["ASIN"],
            title=title,
            product_url=self.get_product_url(raw["ASIN"]),
            price=Decimal(str(price)) if price is not None else Decimal("0"),
            list_price=list_price,
            currency=price_info.get("currency", "INR"),
            in_stock=bool(availability.get("type", "Now") != "OutOfStock"),
            availability_text=availability.get("message"),
            seller_name=merchant,
            condition="new",
            rating=None,
            review_count=None,
            specs={"brand": brand} if brand else {},
            image_url=image_url,
            source="amazon_creators_api",
            collected_at=datetime.now(UTC),
            confidence=1.0,
            is_mock=False,
        )

    def search(self, query: str, limit: int = 20) -> list[NormalizedOffer]:
        body = {
            "keywords": query,
            "itemCount": min(limit, _MAX_ITEMS_PER_CALL),
            "resources": _RESOURCES,
        }
        data = self._post(_SEARCH_PATH, body)
        items = data.get("items") or data.get("searchResult", {}).get("items") or []
        return [self.normalize(item) for item in items]

    def get_product(self, retailer_sku: str) -> NormalizedOffer | None:
        body = {"itemIds": [retailer_sku], "resources": _RESOURCES}
        data = self._post(_GET_ITEMS_PATH, body)
        items = data.get("items") or data.get("itemsResult", {}).get("items") or []
        return self.normalize(items[0]) if items else None

    def get_offers(self, retailer_sku: str) -> list[NormalizedOffer]:
        offer = self.get_product(retailer_sku)
        return [offer] if offer else []
