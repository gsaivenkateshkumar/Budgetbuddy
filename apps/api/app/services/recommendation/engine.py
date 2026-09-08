"""Recommendation pipeline: hard constraints -> candidate eligibility ->
soft preferences -> evidence -> scoring -> ranking. AI explanation (Phase
12) narrates this result; it never computes it.
"""
from sqlalchemy.orm import Session

from app.repositories import recommendation_repository
from app.services.recommendation.evidence import build_candidate_evidence
from app.services.recommendation.scoring import score_candidates
from app.services.recommendation.types import (
    HardConstraints,
    RecommendationResult,
    ScoredCandidate,
    SoftPreferenceWeights,
)


def _assign_labels(scored: list[ScoredCandidate]) -> None:
    if not scored:
        return

    scored[0].labels.append("Best Overall")

    cheapest = min(scored, key=lambda c: c.evidence.price)
    cheapest.labels.append("Best Budget Option")

    def value_ratio(c: ScoredCandidate) -> float:
        quality = (c.sub_scores["performance"] + c.sub_scores["reviews"]) / 2
        return quality / float(c.evidence.price)

    best_value = max(scored, key=value_ratio)
    best_value.labels.append("Best Value")


def recommend(
    db: Session,
    hard: HardConstraints,
    preferences: SoftPreferenceWeights | None = None,
    limit: int = 10,
) -> RecommendationResult:
    preferences = preferences or SoftPreferenceWeights()
    weights = preferences.normalized()

    products = recommendation_repository.get_candidate_products(
        db, category_slug=hard.category_slug, brand_slugs=hard.allowed_brand_slugs
    )

    evidences = []
    excluded_count = 0
    for product in products:
        for variant in product.variants:
            evidence = build_candidate_evidence(product, variant, hard)
            if evidence is None:
                excluded_count += 1
            else:
                evidences.append(evidence)

    if not evidences:
        return RecommendationResult(
            hard_constraints=hard, preferences=weights, candidates=[], excluded_count=excluded_count
        )

    scored = score_candidates(evidences, weights)
    scored.sort(key=lambda c: (-c.total_score, c.evidence.price, c.evidence.variant_id))
    for i, candidate in enumerate(scored, start=1):
        candidate.rank = i

    _assign_labels(scored)

    return RecommendationResult(
        hard_constraints=hard,
        preferences=weights,
        candidates=scored[:limit],
        excluded_count=excluded_count,
    )
