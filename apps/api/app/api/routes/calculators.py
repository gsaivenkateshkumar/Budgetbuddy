"""Stateless deterministic calculators — no auth required (no business
data is read or written), no AI involved. See app/services/calculators.py."""
from fastapi import APIRouter

from app.schemas.business import (
    BreakEvenRequest,
    BreakEvenResponse,
    MarginRequest,
    MarginResponse,
    PricingRequest,
    PricingResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services import calculators

router = APIRouter(prefix="/calculators", tags=["calculators"])


@router.post("/break-even", response_model=BreakEvenResponse)
def break_even(request: BreakEvenRequest) -> BreakEvenResponse:
    result = calculators.calculate_break_even(
        request.fixed_costs, request.selling_price, request.variable_cost_per_unit
    )
    return BreakEvenResponse(**result.__dict__)


@router.post("/margin", response_model=MarginResponse)
def margin(request: MarginRequest) -> MarginResponse:
    result = calculators.calculate_margin(request.revenue, request.cogs, request.operating_expenses)
    return MarginResponse(**result.__dict__)


@router.post("/pricing", response_model=PricingResponse)
def pricing(request: PricingRequest) -> PricingResponse:
    result = calculators.calculate_pricing(request.cost_per_unit, request.desired_margin_pct, request.fees_pct)
    return PricingResponse(**result.__dict__)


@router.post("/what-if", response_model=WhatIfResponse)
def what_if(request: WhatIfRequest) -> WhatIfResponse:
    result = calculators.calculate_what_if(
        request.current_monthly_profit, request.additional_monthly_cost, request.additional_monthly_revenue
    )
    return WhatIfResponse(**result.__dict__)
