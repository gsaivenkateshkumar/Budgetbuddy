from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.offer import OfferRead


class ImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    alt_text: str | None = None
    is_primary: bool


class VariantRead(BaseModel):
    id: int
    sku: str
    name: str
    mpn: str | None = None
    gtin: str | None = None
    upc: str | None = None
    ean: str | None = None
    specs: dict[str, Any]
    images: list[ImageRead]
    offers: list[OfferRead]
