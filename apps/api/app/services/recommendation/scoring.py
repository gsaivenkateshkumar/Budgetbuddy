"""Deterministic scoring: each dimension is min-max normalized to [0, 1]
across the current candidate set, then combined with the caller's
(normalized) preference weights. No LLM involved — ranking must be
reproducible and explainable.
"""
from app.services.recommendation.types import CandidateEvidence, ScoredCandidate


def _minmax(values: list[float]) -> tuple[float, float]:
    return (min(values), max(values)) if values else (0.0, 0.0)


def _normalize(value: float, lo: float, hi: float) -> float:
    if hi == lo:
        return 1.0
    return (value - lo) / (hi - lo)


def _price_scores(evidences: list[CandidateEvidence]) -> dict[int, float]:
    prices = [float(e.price) for e in evidences]
    lo, hi = _minmax(prices)
    # Cheaper is better: invert the normalized value.
    return {e.variant_id: 1.0 - _normalize(float(e.price), lo, hi) for e in evidences}


def _performance_scores(evidences: list[CandidateEvidence]) -> dict[int, tuple[float, bool]]:
    """Heuristic proxy from structured specs (ram_gb, storage_gb) — not a
    real benchmark. Returns (score, has_evidence) per variant."""
    ram_values = [e.specs["ram_gb"] for e in evidences if isinstance(e.specs.get("ram_gb"), int | float)]
    storage_values = [
        e.specs["storage_gb"] for e in evidences if isinstance(e.specs.get("storage_gb"), int | float)
    ]
    ram_lo, ram_hi = _minmax(ram_values)
    storage_lo, storage_hi = _minmax(storage_values)

    scores: dict[int, tuple[float, bool]] = {}
    for e in evidences:
        parts = []
        ram = e.specs.get("ram_gb")
        if isinstance(ram, int | float):
            parts.append(_normalize(ram, ram_lo, ram_hi))
        storage = e.specs.get("storage_gb")
        if isinstance(storage, int | float):
            parts.append(_normalize(storage, storage_lo, storage_hi))
        if parts:
            scores[e.variant_id] = (sum(parts) / len(parts), True)
        else:
            scores[e.variant_id] = (0.5, False)
    return scores


def _battery_scores(evidences: list[CandidateEvidence]) -> dict[int, tuple[float, bool]]:
    """Uses whichever battery spec key is present (battery_wh for
    laptops, battery_mah for phones) — comparable within one category."""
    values = []
    for e in evidences:
        v = e.specs.get("battery_wh", e.specs.get("battery_mah"))
        if isinstance(v, int | float):
            values.append(v)
    lo, hi = _minmax(values)

    scores: dict[int, tuple[float, bool]] = {}
    for e in evidences:
        v = e.specs.get("battery_wh", e.specs.get("battery_mah"))
        if isinstance(v, int | float):
            scores[e.variant_id] = (_normalize(v, lo, hi), True)
        else:
            scores[e.variant_id] = (0.5, False)
    return scores


def _review_scores(evidences: list[CandidateEvidence]) -> dict[int, tuple[float, bool]]:
    scores: dict[int, tuple[float, bool]] = {}
    for e in evidences:
        if e.rating is not None:
            scores[e.variant_id] = (max(0.0, min(1.0, e.rating / 5.0)), True)
        else:
            scores[e.variant_id] = (0.5, False)
    return scores


def _build_explanation(
    evidence: CandidateEvidence, sub_scores: dict[str, float], has_evidence: dict[str, bool]
) -> list[str]:
    reasons = []
    if sub_scores["price"] >= 0.75:
        reasons.append("Competitively priced among the matching options")
    elif sub_scores["price"] <= 0.25:
        reasons.append("Priced higher than most matching options")

    if has_evidence["performance"]:
        if sub_scores["performance"] >= 0.75:
            reasons.append("Strong RAM/storage specifications among matching options")
    else:
        reasons.append("Limited specification data available for performance comparison")

    if has_evidence["reviews"]:
        reasons.append(f"Rated {evidence.rating}/5 from {evidence.review_count or 0} reviews")
    else:
        reasons.append("No review data available yet")

    if not evidence.in_stock:
        reasons.append("Currently out of stock at the lowest-priced retailer found")

    return reasons


def score_candidates(evidences: list[CandidateEvidence], weights: dict[str, float]) -> list[ScoredCandidate]:
    price_scores = _price_scores(evidences)
    performance_scores = _performance_scores(evidences)
    battery_scores = _battery_scores(evidences)
    review_scores = _review_scores(evidences)

    scored = []
    for e in evidences:
        perf_score, perf_evidence = performance_scores[e.variant_id]
        batt_score, batt_evidence = battery_scores[e.variant_id]
        rev_score, rev_evidence = review_scores[e.variant_id]
        sub_scores = {
            "price": price_scores[e.variant_id],
            "performance": perf_score,
            "battery": batt_score,
            "reviews": rev_score,
        }
        total = sum(weights[k] * sub_scores[k] for k in weights)
        has_evidence = {"performance": perf_evidence, "battery": batt_evidence, "reviews": rev_evidence}
        scored.append(
            ScoredCandidate(
                evidence=e,
                sub_scores={k: round(v, 4) for k, v in sub_scores.items()},
                total_score=round(total, 4),
                explanation=_build_explanation(e, sub_scores, has_evidence),
            )
        )
    return scored
