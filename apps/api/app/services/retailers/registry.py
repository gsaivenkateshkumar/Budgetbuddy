"""Lookup for retailer adapters by slug.

Adding a real integration means adding one entry here pointing at a new
adapter class that implements RetailerAdapter — nothing else in the app
needs to change.
"""
from app.services.retailers.adapters.amazon_in import AmazonInAdapter
from app.services.retailers.adapters.croma import CromaAdapter
from app.services.retailers.adapters.flipkart import FlipkartAdapter
from app.services.retailers.adapters.meesho import MeeshoAdapter
from app.services.retailers.adapters.myntra import MyntraAdapter
from app.services.retailers.adapters.nykaa import NykaaAdapter
from app.services.retailers.base import RetailerAdapter

_ADAPTER_CLASSES: dict[str, type[RetailerAdapter]] = {
    "amazon-in": AmazonInAdapter,
    "flipkart": FlipkartAdapter,
    "croma": CromaAdapter,
    "myntra": MyntraAdapter,
    "meesho": MeeshoAdapter,
    "nykaa": NykaaAdapter,
}


def get_adapter(slug: str) -> RetailerAdapter:
    try:
        return _ADAPTER_CLASSES[slug]()
    except KeyError:
        raise ValueError(f"No retailer adapter registered for slug={slug!r}") from None


def list_adapter_slugs() -> list[str]:
    return list(_ADAPTER_CLASSES.keys())


def list_adapters() -> list[RetailerAdapter]:
    return [cls() for cls in _ADAPTER_CLASSES.values()]
