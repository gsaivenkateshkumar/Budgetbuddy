from decimal import Decimal

from pydantic import BaseModel

from app.schemas.brand import BrandRead
from app.schemas.category import CategoryRead
from app.schemas.variant import VariantRead


class ProductSummary(BaseModel):
    id: int
    slug: str
    name: str
    brand: BrandRead
    category: CategoryRead
    primary_image_url: str | None = None
    min_price: Decimal | None = None
    currency: str = "INR"


class ProductDetail(ProductSummary):
    description: str | None = None
    variants: list[VariantRead]
