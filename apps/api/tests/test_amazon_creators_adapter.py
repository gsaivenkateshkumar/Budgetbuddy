import pytest
import respx
from httpx import Response

from app.services.retailers.adapters.amazon_creators import (
    AmazonAPIError,
    AmazonCreatorsAdapter,
    AmazonCredentialsMissingError,
)

TOKEN_URL = "https://token.example/auth/o2/token"
API_BASE = "https://api.example"


def make_adapter(**overrides) -> AmazonCreatorsAdapter:
    kwargs = {
        "credential_id": "test-credential-id",
        "credential_secret": "test-credential-secret",
        "partner_tag": "budgetbuddy-21",
        "marketplace": "www.amazon.in",
        "token_url": TOKEN_URL,
        "api_base_url": API_BASE,
    }
    kwargs.update(overrides)
    return AmazonCreatorsAdapter(**kwargs)


def mock_token(access_token="test-access-token"):
    return respx.post(TOKEN_URL).mock(
        return_value=Response(200, json={"access_token": access_token, "expires_in": 3600})
    )


SAMPLE_ITEM = {
    "ASIN": "B0EXAMPLE1",
    "itemInfo": {
        "title": {"displayValue": "Test Laptop 14-inch"},
        "byLineInfo": {"brand": {"displayValue": "Acme"}},
    },
    "images": {"primary": {"large": {"url": "https://images.example/laptop.jpg"}}},
    "offers": {
        "listings": [
            {
                "price": {"amount": 54999, "currency": "INR", "savings": {"amount": 5000}},
                "availability": {"type": "Now", "message": "In Stock"},
                "merchantInfo": {"name": "Amazon.in"},
            }
        ]
    },
}


def test_adapter_is_constructible_without_any_credentials():
    adapter = AmazonCreatorsAdapter()
    assert adapter.slug == "amazon-in"
    assert adapter.is_mock is False
    assert adapter.is_configured is False


def test_search_raises_credentials_missing_without_configuration():
    adapter = AmazonCreatorsAdapter(credential_id=None, credential_secret=None, partner_tag=None)
    with pytest.raises(AmazonCredentialsMissingError):
        adapter.search("laptop")


def test_get_product_raises_credentials_missing_without_configuration():
    adapter = AmazonCreatorsAdapter(credential_id=None, credential_secret=None, partner_tag=None)
    with pytest.raises(AmazonCredentialsMissingError):
        adapter.get_product("B0EXAMPLE1")


@respx.mock
def test_search_authenticates_and_maps_results():
    mock_token()
    search_route = respx.post(f"{API_BASE}/catalog/v1/searchItems").mock(
        return_value=Response(200, json={"items": [SAMPLE_ITEM]})
    )

    adapter = make_adapter()
    results = adapter.search("laptop", limit=5)

    assert len(results) == 1
    offer = results[0]
    assert offer.retailer_slug == "amazon-in"
    assert offer.retailer_sku == "B0EXAMPLE1"
    assert offer.title == "Test Laptop 14-inch"
    assert offer.price == 54999
    assert offer.list_price == 59999
    assert offer.currency == "INR"
    assert offer.in_stock is True
    assert offer.image_url == "https://images.example/laptop.jpg"
    assert offer.is_mock is False
    assert offer.source == "amazon_creators_api"

    sent_body = search_route.calls[0].request.content
    assert b"laptop" in sent_body
    auth_header = search_route.calls[0].request.headers["Authorization"]
    assert auth_header == "Bearer test-access-token"


@respx.mock
def test_search_caps_item_count_at_ten_per_call():
    mock_token()
    search_route = respx.post(f"{API_BASE}/catalog/v1/searchItems").mock(
        return_value=Response(200, json={"items": []})
    )

    adapter = make_adapter()
    adapter.search("laptop", limit=50)

    import json

    payload = json.loads(search_route.calls[0].request.content)
    assert payload["itemCount"] == 10


@respx.mock
def test_get_product_returns_single_normalized_offer():
    mock_token()
    respx.post(f"{API_BASE}/catalog/v1/getItems").mock(
        return_value=Response(200, json={"items": [SAMPLE_ITEM]})
    )

    adapter = make_adapter()
    offer = adapter.get_product("B0EXAMPLE1")

    assert offer is not None
    assert offer.retailer_sku == "B0EXAMPLE1"


@respx.mock
def test_get_product_returns_none_when_amazon_returns_no_items():
    mock_token()
    respx.post(f"{API_BASE}/catalog/v1/getItems").mock(return_value=Response(200, json={"items": []}))

    adapter = make_adapter()
    assert adapter.get_product("does-not-exist") is None


@respx.mock
def test_get_offers_wraps_get_product_result():
    mock_token()
    respx.post(f"{API_BASE}/catalog/v1/getItems").mock(
        return_value=Response(200, json={"items": [SAMPLE_ITEM]})
    )

    adapter = make_adapter()
    offers = adapter.get_offers("B0EXAMPLE1")

    assert len(offers) == 1
    assert offers[0].retailer_sku == "B0EXAMPLE1"


def test_normalize_handles_missing_optional_fields():
    adapter = make_adapter()
    minimal_item = {"ASIN": "B0MINIMAL"}

    offer = adapter.normalize(minimal_item)

    assert offer.retailer_sku == "B0MINIMAL"
    assert offer.title == "B0MINIMAL"
    assert offer.price == 0
    assert offer.list_price is None
    assert offer.image_url is None
    assert offer.seller_name is None


@respx.mock
def test_rate_limit_response_is_retried_then_raises_after_exhaustion():
    mock_token()
    route = respx.post(f"{API_BASE}/catalog/v1/searchItems").mock(return_value=Response(429))

    adapter = make_adapter()
    with pytest.raises(AmazonAPIError, match="rate limit"):
        adapter.search("laptop")

    assert route.call_count == 3  # _MAX_RETRIES


@respx.mock
def test_api_error_response_raises_amazon_api_error_without_leaking_token():
    mock_token(access_token="super-secret-token")
    respx.post(f"{API_BASE}/catalog/v1/searchItems").mock(
        return_value=Response(500, text="internal server error")
    )

    adapter = make_adapter()
    with pytest.raises(AmazonAPIError) as exc_info:
        adapter.search("laptop")

    assert "super-secret-token" not in str(exc_info.value)
    assert "500" in str(exc_info.value)


@respx.mock
def test_token_request_failure_raises_amazon_api_error_without_leaking_secret():
    respx.post(TOKEN_URL).mock(return_value=Response(401, text="invalid client"))

    adapter = make_adapter(credential_secret="super-secret-value")
    with pytest.raises(AmazonAPIError) as exc_info:
        adapter.search("laptop")

    assert "super-secret-value" not in str(exc_info.value)


@respx.mock
def test_access_token_is_reused_across_calls_within_expiry():
    token_route = mock_token()
    respx.post(f"{API_BASE}/catalog/v1/searchItems").mock(
        return_value=Response(200, json={"items": []})
    )

    adapter = make_adapter()
    adapter.search("laptop")
    adapter.search("phone")

    assert token_route.call_count == 1


def test_get_product_url_includes_asin_and_partner_tag():
    adapter = make_adapter()
    url = adapter.get_product_url("B0EXAMPLE1")
    assert "B0EXAMPLE1" in url
    assert "budgetbuddy-21" in url
