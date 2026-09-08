"""Deterministic Product Identity Engine.

Decides how two variants relate — EXACT_MATCH, VARIANT, SIMILAR,
ALTERNATIVE, or NO_MATCH — from structured attributes only. No ML, no LLM:
identity decisions must be explainable and reproducible. A strong shared
identifier (GTIN/UPC/EAN/MPN) is decisive; otherwise the decision falls
back to brand + category + product name + how much the structured specs
overlap.
"""
from app.services.identity.types import MatchResult, MatchSignals, MatchType

_STRONG_ID_FIELDS = ("gtin", "upc", "ean", "mpn")


def _norm(value: str | None) -> str | None:
    return value.strip().lower() if value else None


def _spec_overlap_ratio(specs_a: dict, specs_b: dict) -> float:
    keys = set(specs_a) | set(specs_b)
    if not keys:
        return 0.0
    matching = sum(1 for k in keys if k in specs_a and k in specs_b and specs_a[k] == specs_b[k])
    return matching / len(keys)


def match(a: MatchSignals, b: MatchSignals) -> MatchResult:
    for field in _STRONG_ID_FIELDS:
        value_a, value_b = _norm(getattr(a, field)), _norm(getattr(b, field))
        if value_a and value_b and value_a == value_b:
            return MatchResult(
                match_type=MatchType.EXACT_MATCH, confidence=1.0, reasons=[f"matching {field}"]
            )

    category_a, category_b = _norm(a.category_slug), _norm(b.category_slug)
    if not category_a or not category_b or category_a != category_b:
        return MatchResult(
            match_type=MatchType.NO_MATCH, confidence=0.0, reasons=["different or unknown category"]
        )

    same_brand = _norm(a.brand_slug) == _norm(b.brand_slug) and a.brand_slug is not None
    same_name = _norm(a.product_name) == _norm(b.product_name) and a.product_name is not None
    overlap = _spec_overlap_ratio(a.specs, b.specs)

    if same_brand and same_name:
        if overlap >= 0.999:
            return MatchResult(
                match_type=MatchType.EXACT_MATCH,
                confidence=0.95,
                reasons=["same brand and model, identical structured specs (no shared strong identifier)"],
            )
        confidence = round(min(0.6 + 0.3 * overlap, 0.9), 2)
        return MatchResult(
            match_type=MatchType.VARIANT,
            confidence=confidence,
            reasons=[f"same brand and model, {overlap:.0%} spec overlap"],
        )

    if same_brand:
        confidence = round(min(0.3 + 0.3 * overlap, 0.6), 2)
        return MatchResult(
            match_type=MatchType.SIMILAR,
            confidence=confidence,
            reasons=["same brand and category, different model name"],
        )

    confidence = round(min(0.15 + 0.25 * overlap, 0.5), 2)
    return MatchResult(
        match_type=MatchType.ALTERNATIVE,
        confidence=confidence,
        reasons=["same category, different brand"],
    )
