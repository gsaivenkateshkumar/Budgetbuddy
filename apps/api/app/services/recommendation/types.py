"""Data structures for the recommendation pipeline:
hard constraints -> candidate eligibility -> soft preferences -> evidence
-> scoring -> ranking -> (later) AI explanation.

An LLM never picks a winner here — `RecommendationResult` is fully
computed by deterministic scoring; an AI layer (Phase 12) may narrate it,
never override it.
"""
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HardConstraints(BaseModel):
    """Non-negotiable filters. A candidate failing any of these is
    excluded before scoring, not down-ranked."""

    category_slug: str | None = None
    max_price: Decimal | None = None
    min_price: Decimal | None = None
    min_ram_gb: int | None = None
    min_storage_gb: int | None = None
    allowed_brand_slugs: list[str] | None = None
    require_in_stock: bool = True


class SoftPreferenceWeights(BaseModel):
    """Relative importance of each scoring dimension. Values are weights,
    not scores — they're normalized to sum to 1.0 before use, so callers
    can pass e.g. performance=2.0 to mean "twice as important as price"
    without recomputing the others."""

    price: float = Field(default=0.4, ge=0.0)
    performance: float = Field(default=0.3, ge=0.0)
    reviews: float = Field(default=0.2, ge=0.0)
    battery: float = Field(default=0.1, ge=0.0)

    def normalized(self) -> dict[str, float]:
        total = self.price + self.performance + self.reviews + self.battery
        if total <= 0:
            return {"price": 0.25, "performance": 0.25, "reviews": 0.25, "battery": 0.25}
        return {
            "price": self.price / total,
            "performance": self.performance / total,
            "reviews": self.reviews / total,
            "battery": self.battery / total,
        }


class CandidateEvidence(BaseModel):
    """Everything the scorer knows about one variant, all traceable to
    stored data — nothing here is inferred or fabricated."""

    model_config = ConfigDict(frozen=True)

    product_id: int
    product_slug: str
    product_name: str
    brand_name: str
    variant_id: int
    variant_sku: str
    specs: dict[str, Any]
    price: Decimal
    currency: str = "INR"
    in_stock: bool
    best_retailer_slug: str
    offer_count: int
    rating: float | None = None
    review_count: int | None = None


class ScoredCandidate(BaseModel):
    evidence: CandidateEvidence
    sub_scores: dict[str, float]
    total_score: float
    rank: int = 0
    labels: list[str] = Field(default_factory=list)
    explanation: list[str]


class RecommendationResult(BaseModel):
    hard_constraints: HardConstraints
    preferences: dict[str, float]
    candidates: list[ScoredCandidate]
    excluded_count: int
