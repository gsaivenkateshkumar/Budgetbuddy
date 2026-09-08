"""Structured input/output types for the Product Identity Engine.

Two products are never merged just because their names look similar —
matching runs only on structured signals (identifiers, brand, category,
specs), and every result carries an explicit relationship type plus a
confidence score rather than a bare yes/no.
"""
from enum import StrEnum
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from app.models.variant import Variant


class MatchType(StrEnum):
    EXACT_MATCH = "EXACT_MATCH"
    VARIANT = "VARIANT"
    SIMILAR = "SIMILAR"
    ALTERNATIVE = "ALTERNATIVE"
    NO_MATCH = "NO_MATCH"


class MatchSignals(BaseModel):
    """The structured attributes the matcher compares. Strong identifiers
    (mpn/gtin/upc/ean) take precedence over everything else; brand/
    category/name/specs are the supporting signals used when no strong
    identifier is available or shared."""

    model_config = ConfigDict(frozen=True)

    mpn: str | None = None
    gtin: str | None = None
    upc: str | None = None
    ean: str | None = None
    brand_slug: str | None = None
    category_slug: str | None = None
    product_name: str | None = None
    specs: dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_variant(cls, variant: "Variant") -> "MatchSignals":
        return cls(
            mpn=variant.mpn,
            gtin=variant.gtin,
            upc=variant.upc,
            ean=variant.ean,
            brand_slug=variant.product.brand.slug,
            category_slug=variant.product.category.slug,
            product_name=variant.product.name,
            specs=variant.specs or {},
        )


class MatchResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    match_type: MatchType
    confidence: float = Field(ge=0.0, le=1.0)
    reasons: list[str]
