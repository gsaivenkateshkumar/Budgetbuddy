"""Recommendation pipeline: hard constraints -> candidate eligibility ->
soft preferences -> evidence -> scoring -> ranking. AI explanation (Phase
12) narrates this result; it never computes it.

`recommend()` searches a whole category under hard constraints.
`compare()` (Phase 10) scores an explicit, user-picked set of products —
same scoring/ranking/labeling, different candidate source.
"""
from sqlalchemy.orm import Session

from app.repositories import recommendation_repository
from app.services.recommendation.evidence import build_candidate_evidence
from app.services.recommendation.scoring import score_candidates
from app.services.recommendation.types import (
    CandidateEvidence,
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


def _score_rank_and_label(
    evidences: list[CandidateEvidence],
    hard: HardConstraints,
    preferences: SoftPreferenceWeights,
    excluded_count: int,
    limit: int,
) -> RecommendationResult:
    weights = preferences.normalized()

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


def recommend(
    db: Session,
    hard: HardConstraints,
    preferences: SoftPreferenceWeights | None = None,
    limit: int = 10,
) -> RecommendationResult:
    preferences = preferences or SoftPreferenceWeights()

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

    return _score_rank_and_label(evidences, hard, preferences, excluded_count, limit)


def compare(
    db: Session,
    product_slugs: list[str],
    preferences: SoftPreferenceWeights | None = None,
) -> RecommendationResult:
    """Score an explicit set of products against each other. Each product
    contributes its single cheapest eligible variant (by current price) —
    comparison operates at product granularity, matching how users pick
    products to compare ("compare iPhone and Galaxy"), not individual
    SKUs."""
    preferences = preferences or SoftPreferenceWeights()
    hard = HardConstraints()

    products = recommendation_repository.get_products_by_slugs(db, product_slugs)

    evidences = []
    excluded_count = 0
    for product in products:
        variant_evidences = [
            e for v in product.variants if (e := build_candidate_evidence(product, v, hard)) is not None
        ]
        if not variant_evidences:
            excluded_count += 1
            continue
        evidences.append(min(variant_evidences, key=lambda e: e.price))

    return _score_rank_and_label(evidences, hard, preferences, excluded_count, limit=len(product_slugs))
