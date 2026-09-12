from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Stage = Literal["idea", "validation", "planning", "pre_launch", "launched", "operating"]
TaskStatus = Literal["pending", "in_progress", "completed"]
TaskPriority = Literal["low", "medium", "high"]
EntryType = Literal["revenue", "expense"]
DeliveryMode = Literal["online", "offline", "hybrid"]
Confidence = Literal["Low", "Medium", "High"]


# ---- Business Project -----------------------------------------------------


class BusinessProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    industry: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    startup_budget: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    target_customer: str | None = Field(default=None, max_length=2000)
    business_model: str | None = Field(default=None, max_length=2000)
    experience_level: str | None = Field(default=None, max_length=40)
    delivery_mode: DeliveryMode | None = None
    time_commitment: str | None = Field(default=None, max_length=40)
    goals: str | None = Field(default=None, max_length=2000)


class BusinessProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    industry: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    stage: Stage | None = None
    startup_budget: Decimal | None = Field(default=None, ge=0)
    target_customer: str | None = Field(default=None, max_length=2000)
    business_model: str | None = Field(default=None, max_length=2000)
    experience_level: str | None = Field(default=None, max_length=40)
    delivery_mode: DeliveryMode | None = None
    time_commitment: str | None = Field(default=None, max_length=40)
    goals: str | None = Field(default=None, max_length=2000)


class BusinessProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    industry: str | None
    location: str | None
    stage: Stage
    startup_budget: Decimal | None
    currency: str
    target_customer: str | None
    business_model: str | None
    experience_level: str | None
    delivery_mode: str | None
    time_commitment: str | None
    goals: str | None
    created_at: datetime
    updated_at: datetime


# ---- Idea Validation --------------------------------------------------------


class ValidationScores(BaseModel):
    demand: int = Field(ge=0, le=20)
    differentiation: int = Field(ge=0, le=15)
    business_model: int = Field(ge=0, le=15)
    capital: int = Field(ge=0, le=20)
    operational: int = Field(ge=0, le=15)
    gtm: int = Field(ge=0, le=15)
    total: int = Field(ge=0, le=100)


class ValidationReportSections(BaseModel):
    """The narrative parts of a validation report. Populated by the
    deterministic engine from structured inputs, then optionally enriched
    by the LLM's structured analysis (see app/services/validation_engine.py)
    — never freeform, never trusted un-validated from the model."""

    business_summary: str
    target_customer: str
    problem_being_solved: str
    revenue_model: str
    startup_requirements: str
    estimated_cost_areas: list[str] = Field(default_factory=list)
    operational_complexity: str
    competition_considerations: str
    differentiation_opportunities: str
    major_risks: list[str] = Field(default_factory=list)
    questions_to_validate: list[str] = Field(default_factory=list)
    recommended_next_actions: list[str] = Field(default_factory=list)


class ValidationReport(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_project_id: int
    scores: ValidationScores
    confidence: Confidence
    verdict: str
    missing_info: list[str]
    sections: ValidationReportSections
    created_at: datetime

    @classmethod
    def from_model(cls, model) -> "ValidationReport":  # type: ignore[no-untyped-def]
        report = model.report
        return cls(
            id=model.id,
            business_project_id=model.business_project_id,
            scores=ValidationScores(
                demand=model.score_demand,
                differentiation=model.score_differentiation,
                business_model=model.score_business_model,
                capital=model.score_capital,
                operational=model.score_operational,
                gtm=model.score_gtm,
                total=model.total_score,
            ),
            confidence=model.confidence,
            verdict=model.verdict,
            missing_info=report.get("missing_info", []),
            sections=ValidationReportSections(**report["sections"]),
            created_at=model.created_at,
        )


# ---- Budget -----------------------------------------------------------------


class BudgetItemCreate(BaseModel):
    category: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(ge=0)
    notes: str | None = Field(default=None, max_length=500)


class BudgetItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    amount: Decimal
    notes: str | None


class BudgetPut(BaseModel):
    """Replaces the entire budget item list — the frontend calculator
    always edits the full set, so a full replace avoids partial-update
    drift between categories."""

    items: list[BudgetItemCreate] = Field(max_length=50)


class BudgetRead(BaseModel):
    items: list[BudgetItemRead]
    total: Decimal


# ---- Tasks --------------------------------------------------------------


class BusinessTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, max_length=60)
    priority: TaskPriority = "medium"
    week: int | None = Field(default=None, ge=1, le=52)
    due_date: date | None = None


class BusinessTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None


class BusinessTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    category: str | None
    status: TaskStatus
    priority: TaskPriority
    week: int | None
    order_index: int
    due_date: date | None
    created_at: datetime
    updated_at: datetime


# ---- Financials -----------------------------------------------------------


class FinancialEntryCreate(BaseModel):
    type: EntryType
    amount: Decimal = Field(gt=0)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    entry_date: date


class FinancialEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: EntryType
    amount: Decimal
    category: str | None
    description: str | None
    entry_date: date
    created_at: datetime


class ExpenseCategoryTotal(BaseModel):
    category: str
    total: Decimal


class FinancialSummary(BaseModel):
    total_revenue: Decimal
    total_expenses: Decimal
    net_result: Decimal
    expense_breakdown: list[ExpenseCategoryTotal]
    entry_count: int


# ---- Calculators ------------------------------------------------------------


class BreakEvenRequest(BaseModel):
    fixed_costs: Decimal = Field(ge=0)
    selling_price: Decimal = Field(ge=0)
    variable_cost_per_unit: Decimal = Field(ge=0)


class BreakEvenResponse(BaseModel):
    contribution_per_unit: Decimal
    break_even_units: Decimal | None
    break_even_revenue: Decimal | None
    is_viable: bool
    explanation: str


class MarginRequest(BaseModel):
    revenue: Decimal = Field(ge=0)
    cogs: Decimal = Field(ge=0)
    operating_expenses: Decimal = Field(ge=0)


class MarginResponse(BaseModel):
    gross_profit: Decimal
    gross_margin_pct: Decimal | None
    operating_profit: Decimal
    operating_margin_pct: Decimal | None
    explanation: str


class PricingRequest(BaseModel):
    cost_per_unit: Decimal = Field(ge=0)
    desired_margin_pct: Decimal = Field(ge=0, lt=100)
    fees_pct: Decimal = Field(default=Decimal("0"), ge=0, lt=100)


class PricingResponse(BaseModel):
    suggested_price: Decimal
    profit_per_unit: Decimal
    explanation: str


class WhatIfRequest(BaseModel):
    current_monthly_profit: Decimal
    additional_monthly_cost: Decimal = Field(default=Decimal("0"), ge=0)
    additional_monthly_revenue: Decimal = Field(default=Decimal("0"), ge=0)


class WhatIfResponse(BaseModel):
    current_profit: Decimal
    projected_profit: Decimal
    change: Decimal
    explanation: str
