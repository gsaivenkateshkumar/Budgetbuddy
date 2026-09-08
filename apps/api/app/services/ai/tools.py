"""Tool definitions wired to Budget Buddy's real product/comparison
services. The AI only ever sees data these tools actually return — it
never invents products, prices, availability, or ratings. Only tools with
a genuine backing implementation are exposed here; nothing is a stub kept
just to satisfy the interface (see product brief section 18)."""
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.services import product_service
from app.services.ai.types import ToolSpec
from app.services.recommendation.engine import compare as compare_products_engine
from app.services.recommendation.types import SoftPreferenceWeights

SEARCH_PRODUCTS = ToolSpec(
    name="search_products",
    description=(
        "Search Budget Buddy's product catalog by free text, with optional category/brand/price filters."
    ),
    parameters={
        "type": "object",
        "properties": {
            "q": {"type": "string", "description": "Free-text search over product/brand name"},
            "category": {"type": "string", "description": "Category slug, e.g. 'laptops'"},
            "brand": {"type": "string", "description": "Brand slug, e.g. 'apple'"},
            "min_price": {"type": "number"},
            "max_price": {"type": "number"},
        },
    },
)

GET_PRODUCT_DETAILS = ToolSpec(
    name="get_product_details",
    description="Get full details for one product by slug: variants, specs, and current retailer offers.",
    parameters={
        "type": "object",
        "properties": {"slug": {"type": "string", "description": "Product slug"}},
        "required": ["slug"],
    },
)

COMPARE_PRODUCTS = ToolSpec(
    name="compare_products",
    description=(
        "Compare 2 or more products by slug and return a ranked, scored comparison with "
        "explanations. Optionally weight price/performance/reviews/battery priorities (0-100)."
    ),
    parameters={
        "type": "object",
        "properties": {
            "product_slugs": {"type": "array", "items": {"type": "string"}, "minItems": 2},
            "price_priority": {"type": "number"},
            "performance_priority": {"type": "number"},
            "reviews_priority": {"type": "number"},
            "battery_priority": {"type": "number"},
        },
        "required": ["product_slugs"],
    },
)

GET_PRICES = ToolSpec(
    name="get_prices",
    description="Get current retailer offers (price, availability, freshness) for one product variant.",
    parameters={
        "type": "object",
        "properties": {
            "slug": {"type": "string", "description": "Product slug"},
            "sku": {"type": "string", "description": "Variant SKU"},
        },
        "required": ["slug", "sku"],
    },
)

ALL_TOOLS: list[ToolSpec] = [SEARCH_PRODUCTS, GET_PRODUCT_DETAILS, COMPARE_PRODUCTS, GET_PRICES]


def _to_jsonable(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if isinstance(value, list):
        return [_to_jsonable(v) for v in value]
    if isinstance(value, Decimal):
        return str(value)
    return value


def dispatch_tool(db: Session, name: str, arguments: dict[str, Any]) -> Any:
    """Executes one tool call against real backend data and returns a
    JSON-serializable result. Raises AppError for unknown tools or missing
    required arguments rather than guessing."""
    if name == "search_products":
        result = product_service.search_products(
            db,
            q=arguments.get("q"),
            category_slug=arguments.get("category"),
            brand_slug=arguments.get("brand"),
            min_price=arguments.get("min_price"),
            max_price=arguments.get("max_price"),
        )
        return _to_jsonable(result)

    if name == "get_product_details":
        if "slug" not in arguments:
            raise AppError("get_product_details requires 'slug'", code="invalid_tool_arguments")
        result = product_service.get_product_detail(db, arguments["slug"])
        return _to_jsonable(result)

    if name == "compare_products":
        slugs = arguments.get("product_slugs") or []
        if len(slugs) < 2:
            raise AppError(
                "compare_products requires at least 2 product_slugs", code="invalid_tool_arguments"
            )
        weights = SoftPreferenceWeights(
            price=arguments.get("price_priority", 40),
            performance=arguments.get("performance_priority", 30),
            reviews=arguments.get("reviews_priority", 20),
            battery=arguments.get("battery_priority", 10),
        )
        result = compare_products_engine(db, slugs, weights)
        return _to_jsonable(result)

    if name == "get_prices":
        if "slug" not in arguments or "sku" not in arguments:
            raise AppError("get_prices requires 'slug' and 'sku'", code="invalid_tool_arguments")
        result = product_service.get_variant_offers(db, arguments["slug"], arguments["sku"])
        return _to_jsonable(result)

    raise AppError(f"Unknown tool: {name}", code="unknown_tool")
