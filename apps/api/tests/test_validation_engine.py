from decimal import Decimal

from app.services.validation_engine import (
    ValidationInput,
    confidence_for,
    missing_info,
    score_idea,
    verdict_for,
)


def _input(**overrides) -> ValidationInput:
    defaults = dict(
        idea="Cloud kitchen",
        description="A cloud kitchen serving regional comfort food to office workers nearby, "
        "delivered through aggregator apps with no dine-in overhead.",
        industry="Food",
        location="Bengaluru",
        startup_budget=Decimal("80000"),
        experience_level="Some experience",
        target_customer="Office workers within 3km who want quick, home-style lunch delivery.",
        delivery_mode="online",
        time_commitment="full-time",
        goals="Break even within 6 months and expand to a second kitchen.",
    )
    defaults.update(overrides)
    return ValidationInput(**defaults)


def test_well_specified_idea_scores_high_and_high_confidence():
    inp = _input()
    scores = score_idea(inp)
    missing = missing_info(inp)

    assert scores.total >= 75
    assert missing == []
    assert confidence_for(scores, missing) == "High"
    assert "promising" in verdict_for(scores).lower()


def test_empty_idea_scores_zero_and_low_confidence():
    inp = _input(
        description="",
        industry=None,
        location=None,
        startup_budget=None,
        experience_level=None,
        target_customer=None,
        delivery_mode=None,
        time_commitment=None,
        goals=None,
    )
    scores = score_idea(inp)
    missing = missing_info(inp)

    assert scores.total == 0
    assert len(missing) >= 3
    assert confidence_for(scores, missing) == "Low"
    assert "rework" in verdict_for(scores).lower()


def test_capital_mismatch_detected_when_budget_far_below_benchmark():
    inp = _input(delivery_mode="offline", startup_budget=Decimal("500"))
    scores = score_idea(inp)

    assert scores.capital == 0
    assert "capital mismatch" in verdict_for(scores).lower()


def test_capital_score_scales_with_budget_and_delivery_mode():
    online_low = score_idea(_input(delivery_mode="online", startup_budget=Decimal("5000")))
    online_full = score_idea(_input(delivery_mode="online", startup_budget=Decimal("40000")))
    offline_same_budget = score_idea(_input(delivery_mode="offline", startup_budget=Decimal("20000")))

    assert online_low.capital < online_full.capital
    assert online_full.capital == 20  # capped at the /20 max
    # The same budget goes further for an online business than an offline one.
    online_same_budget = score_idea(_input(delivery_mode="online", startup_budget=Decimal("20000")))
    assert online_same_budget.capital > offline_same_budget.capital


def test_scores_are_deterministic_for_identical_input():
    inp = _input()
    assert score_idea(inp) == score_idea(inp)


def test_total_never_exceeds_100():
    inp = _input(description="x" * 1000, target_customer="y" * 1000, goals="z" * 1000)
    scores = score_idea(inp)
    assert scores.total <= 100
