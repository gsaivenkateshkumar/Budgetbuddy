import pytest

from app.services.retailers.registry import get_adapter, list_adapter_slugs, list_adapters
from app.services.retailers.types import NormalizedOffer

ALL_SLUGS = list_adapter_slugs()


def test_all_six_launch_retailers_are_registered():
    assert set(ALL_SLUGS) == {"amazon-in", "flipkart", "croma", "myntra", "meesho", "nykaa"}


@pytest.mark.parametrize("slug", ALL_SLUGS)
def test_adapter_is_clearly_labeled_mock(slug):
    adapter = get_adapter(slug)
    assert adapter.is_mock is True
    assert adapter.slug == slug
    assert adapter.display_name


@pytest.mark.parametrize("slug", ALL_SLUGS)
def test_search_returns_normalized_offers_with_provenance(slug):
    adapter = get_adapter(slug)
    results = adapter.search("", limit=10)

    assert len(results) > 0
    for offer in results:
        assert isinstance(offer, NormalizedOffer)
        assert offer.retailer_slug == slug
        assert offer.is_mock is True
        assert offer.source.startswith("mock:")
        assert offer.price > 0


@pytest.mark.parametrize("slug", ALL_SLUGS)
def test_get_product_url_is_well_formed(slug):
    adapter = get_adapter(slug)
    sample_sku = adapter.search("", limit=1)[0].retailer_sku

    url = adapter.get_product_url(sample_sku)

    assert url.startswith("https://")
    assert sample_sku.lower() in url


def test_get_product_returns_none_for_unknown_sku():
    adapter = get_adapter("amazon-in")
    assert adapter.get_product("does-not-exist") is None


def test_search_is_case_insensitive_substring_match():
    adapter = get_adapter("amazon-in")
    results = adapter.search("macbook")
    assert len(results) == 1
    assert "MacBook" in results[0].title


def test_get_offers_returns_offers_for_known_sku():
    adapter = get_adapter("amazon-in")
    sku = adapter.search("macbook")[0].retailer_sku

    offers = adapter.get_offers(sku)

    assert len(offers) == 1
    assert offers[0].retailer_sku == sku


def test_meesho_offer_carries_seller_name():
    adapter = get_adapter("meesho")
    offer = adapter.search("galaxy")[0]
    assert offer.seller_name == "Meesho Retail Partner"


def test_unknown_retailer_slug_raises():
    with pytest.raises(ValueError, match="No retailer adapter registered"):
        get_adapter("not-a-real-retailer")


def test_list_adapters_returns_one_instance_per_retailer():
    adapters = list_adapters()
    assert len(adapters) == len(ALL_SLUGS)
    assert {a.slug for a in adapters} == set(ALL_SLUGS)
