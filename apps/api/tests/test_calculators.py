from decimal import Decimal

import pytest

from app.core.errors import AppError
from app.services.calculators import (
    calculate_break_even,
    calculate_margin,
    calculate_pricing,
    calculate_what_if,
)


def test_break_even_normal_case():
    result = calculate_break_even(Decimal("10000"), Decimal("100"), Decimal("50"))

    assert result.contribution_per_unit == Decimal("50.00")
    assert result.break_even_units == Decimal("200.00")
    assert result.break_even_revenue == Decimal("20000.00")
    assert result.is_viable is True


def test_break_even_zero_price_is_explained_not_crashed():
    result = calculate_break_even(Decimal("10000"), Decimal("0"), Decimal("0"))

    assert result.is_viable is False
    assert result.break_even_units is None
    assert "undefined" in result.explanation.lower()


def test_break_even_negative_margin_is_explained_not_crashed():
    result = calculate_break_even(Decimal("10000"), Decimal("50"), Decimal("60"))

    assert result.is_viable is False
    assert result.break_even_units is None
    assert "loses money" in result.explanation.lower()


def test_break_even_equal_price_and_cost_is_not_viable():
    result = calculate_break_even(Decimal("10000"), Decimal("50"), Decimal("50"))

    assert result.is_viable is False
    assert result.contribution_per_unit == Decimal("0.00")


def test_break_even_rejects_negative_inputs():
    with pytest.raises(AppError):
        calculate_break_even(Decimal("-1"), Decimal("100"), Decimal("50"))


def test_margin_normal_case():
    result = calculate_margin(Decimal("1000"), Decimal("400"), Decimal("200"))

    assert result.gross_profit == Decimal("600.00")
    assert result.gross_margin_pct == Decimal("60.00")
    assert result.operating_profit == Decimal("400.00")
    assert result.operating_margin_pct == Decimal("40.00")


def test_margin_zero_revenue_returns_none_percentages():
    result = calculate_margin(Decimal("0"), Decimal("0"), Decimal("0"))

    assert result.gross_margin_pct is None
    assert result.operating_margin_pct is None
    assert "undefined" in result.explanation.lower()


def test_margin_rejects_negative_inputs():
    with pytest.raises(AppError):
        calculate_margin(Decimal("-1"), Decimal("0"), Decimal("0"))


def test_pricing_normal_case():
    result = calculate_pricing(Decimal("100"), Decimal("20"))

    # price * 0.8 = 100 => price = 125
    assert result.suggested_price == Decimal("125.00")
    assert result.profit_per_unit == Decimal("25.00")


def test_pricing_with_fees():
    result = calculate_pricing(Decimal("100"), Decimal("20"), Decimal("2"))

    # price * 0.8 * 0.98 = 100
    assert result.suggested_price > Decimal("125.00")


def test_pricing_rejects_100_percent_margin():
    with pytest.raises(AppError):
        calculate_pricing(Decimal("100"), Decimal("100"))


def test_pricing_rejects_negative_cost():
    with pytest.raises(AppError):
        calculate_pricing(Decimal("-1"), Decimal("20"))


def test_what_if_profit_decreases_with_added_cost():
    result = calculate_what_if(Decimal("42000"), Decimal("18000"), Decimal("0"))

    assert result.projected_profit == Decimal("24000.00")
    assert result.change == Decimal("-18000.00")


def test_what_if_profit_increases_with_added_revenue():
    result = calculate_what_if(Decimal("42000"), Decimal("2500"), Decimal("20000"))

    assert result.projected_profit == Decimal("59500.00")
    assert result.change == Decimal("17500.00")
