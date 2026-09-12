"""Deterministic financial calculators. No AI provider is involved in any
arithmetic here — the AI copilot (app/services/ai/tools.py) calls these
same functions and only ever *explains* results computed here, per the
product's "structured data + deterministic calculations, not a chatbot"
principle (see docs/product-decisions.md).

All money in/out is Decimal, never float, to avoid floating-point drift on
persisted or displayed amounts.
"""
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from app.core.errors import AppError

TWO_PLACES = Decimal("0.01")


def _round(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


@dataclass
class BreakEvenResult:
    contribution_per_unit: Decimal
    break_even_units: Decimal | None
    break_even_revenue: Decimal | None
    is_viable: bool
    explanation: str


def calculate_break_even(
    fixed_costs: Decimal, selling_price: Decimal, variable_cost_per_unit: Decimal
) -> BreakEvenResult:
    if fixed_costs < 0 or selling_price < 0 or variable_cost_per_unit < 0:
        raise AppError("Costs and price must not be negative.", code="invalid_input")

    contribution = selling_price - variable_cost_per_unit

    if selling_price == 0:
        return BreakEvenResult(
            contribution_per_unit=_round(contribution),
            break_even_units=None,
            break_even_revenue=None,
            is_viable=False,
            explanation="Selling price is ₹0 — break-even is undefined. Set a real selling price to calculate this.",
        )

    if contribution <= 0:
        return BreakEvenResult(
            contribution_per_unit=_round(contribution),
            break_even_units=None,
            break_even_revenue=None,
            is_viable=False,
            explanation=(
                "Your variable cost per unit is equal to or higher than your selling price, so every "
                "sale loses money — break-even isn't reachable at this price and cost combination. "
                "Raise the price, reduce the variable cost, or both."
            ),
        )

    units = fixed_costs / contribution
    revenue = units * selling_price
    return BreakEvenResult(
        contribution_per_unit=_round(contribution),
        break_even_units=units.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        break_even_revenue=_round(revenue),
        is_viable=True,
        explanation=(
            f"Each unit contributes ₹{_round(contribution)} toward covering fixed costs after variable "
            f"cost. You need to sell about {units.quantize(Decimal('1'), rounding=ROUND_HALF_UP)} units "
            f"(₹{_round(revenue)} in revenue) per period to cover ₹{_round(fixed_costs)} in fixed costs."
        ),
    )


@dataclass
class MarginResult:
    gross_profit: Decimal
    gross_margin_pct: Decimal | None
    operating_profit: Decimal
    operating_margin_pct: Decimal | None
    explanation: str


def calculate_margin(revenue: Decimal, cogs: Decimal, operating_expenses: Decimal) -> MarginResult:
    if revenue < 0 or cogs < 0 or operating_expenses < 0:
        raise AppError("Revenue, COGS, and expenses must not be negative.", code="invalid_input")

    gross_profit = revenue - cogs
    operating_profit = gross_profit - operating_expenses

    gross_margin_pct = _round((gross_profit / revenue) * 100) if revenue > 0 else None
    operating_margin_pct = _round((operating_profit / revenue) * 100) if revenue > 0 else None

    if revenue == 0:
        explanation = "Revenue is ₹0, so margin percentages are undefined — profit/loss is shown in rupees only."
    else:
        explanation = (
            f"Gross profit is ₹{_round(gross_profit)} ({gross_margin_pct}% of revenue). After operating "
            f"expenses, operating profit is ₹{_round(operating_profit)} ({operating_margin_pct}% of revenue)."
        )

    return MarginResult(
        gross_profit=_round(gross_profit),
        gross_margin_pct=gross_margin_pct,
        operating_profit=_round(operating_profit),
        operating_margin_pct=operating_margin_pct,
        explanation=explanation,
    )


@dataclass
class PricingResult:
    suggested_price: Decimal
    profit_per_unit: Decimal
    explanation: str


def calculate_pricing(
    cost_per_unit: Decimal, desired_margin_pct: Decimal, fees_pct: Decimal = Decimal("0")
) -> PricingResult:
    if cost_per_unit < 0:
        raise AppError("Cost per unit must not be negative.", code="invalid_input")
    if not (Decimal("0") <= desired_margin_pct < Decimal("100")):
        raise AppError("Desired margin must be between 0 and 100 (exclusive of 100).", code="invalid_input")
    if not (Decimal("0") <= fees_pct < Decimal("100")):
        raise AppError("Fees/taxes percentage must be between 0 and 100 (exclusive of 100).", code="invalid_input")

    # Price such that, after deducting fees taken off the selling price,
    # the remainder still yields the desired margin over cost:
    #   price * (1 - fees%) * (1 - margin%) = cost   =>   price = cost / ((1 - margin%)(1 - fees%))
    margin_fraction = Decimal("1") - (desired_margin_pct / Decimal("100"))
    fees_fraction = Decimal("1") - (fees_pct / Decimal("100"))
    denominator = margin_fraction * fees_fraction

    if denominator <= 0:
        raise AppError("Margin and fees combination leaves no valid price.", code="invalid_input")

    price = cost_per_unit / denominator
    net_after_fees = price * fees_fraction
    profit_per_unit = net_after_fees - cost_per_unit

    return PricingResult(
        suggested_price=_round(price),
        profit_per_unit=_round(profit_per_unit),
        explanation=(
            f"To cover a cost of ₹{_round(cost_per_unit)} per unit, keep a {desired_margin_pct}% margin, "
            f"and account for {fees_pct}% in fees/taxes taken off the sale price, charge at least "
            f"₹{_round(price)}. This is a planning estimate, not tax or accounting advice — confirm "
            f"applicable taxes with a professional before finalizing pricing."
        ),
    )


@dataclass
class WhatIfResult:
    current_profit: Decimal
    projected_profit: Decimal
    change: Decimal
    explanation: str


def calculate_what_if(
    current_monthly_profit: Decimal, additional_monthly_cost: Decimal, additional_monthly_revenue: Decimal = Decimal("0")
) -> WhatIfResult:
    projected = current_monthly_profit - additional_monthly_cost + additional_monthly_revenue
    change = projected - current_monthly_profit
    direction = "increase" if change >= 0 else "decrease"
    return WhatIfResult(
        current_profit=_round(current_monthly_profit),
        projected_profit=_round(projected),
        change=_round(change),
        explanation=(
            f"Starting from ₹{_round(current_monthly_profit)}/month profit, this change would "
            f"{direction} profit by ₹{_round(abs(change))} to about ₹{_round(projected)}/month, "
            "assuming everything else stays the same."
        ),
    )
