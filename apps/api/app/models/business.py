"""Start Currency business domain: a user's BusinessProject is the
persistent workspace that idea validation, budgeting, roadmap tasks, and
financial tracking all attach to. See docs/business-domain.md for the
schema plan behind the Budget Buddy -> Start Currency pivot.
"""
from datetime import date
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

# Kept as plain strings (not a DB enum) so new stages/statuses/categories
# never require a migration — validated at the Pydantic schema layer
# instead. See app/schemas/business.py for the allowed-value lists.
BUSINESS_STAGES = ("idea", "validation", "planning", "pre_launch", "launched", "operating")
TASK_STATUSES = ("pending", "in_progress", "completed")
TASK_PRIORITIES = ("low", "medium", "high")
FINANCIAL_ENTRY_TYPES = ("revenue", "expense")


class BusinessProject(Base, TimestampMixin):
    __tablename__ = "business_projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    industry: Mapped[str | None] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(120))
    stage: Mapped[str] = mapped_column(String(20), default="idea", nullable=False)

    startup_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)

    target_customer: Mapped[str | None] = mapped_column(Text)
    business_model: Mapped[str | None] = mapped_column(Text)
    experience_level: Mapped[str | None] = mapped_column(String(40))
    delivery_mode: Mapped[str | None] = mapped_column(String(20))  # online | offline | hybrid
    time_commitment: Mapped[str | None] = mapped_column(String(40))
    goals: Mapped[str | None] = mapped_column(Text)

    validations: Mapped[list["IdeaValidation"]] = relationship(
        back_populates="business_project", cascade="all, delete-orphan", order_by="IdeaValidation.created_at.desc()"
    )
    budget_items: Mapped[list["BudgetItem"]] = relationship(
        back_populates="business_project", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["BusinessTask"]] = relationship(
        back_populates="business_project", cascade="all, delete-orphan"
    )
    financial_entries: Mapped[list["FinancialEntry"]] = relationship(
        back_populates="business_project", cascade="all, delete-orphan"
    )

    __table_args__ = (CheckConstraint(f"stage IN {BUSINESS_STAGES}", name="ck_business_projects_stage"),)

    def __repr__(self) -> str:
        return f"<BusinessProject id={self.id} name={self.name!r} stage={self.stage!r}>"


class IdeaValidation(Base, TimestampMixin):
    """One validation run for a BusinessProject. History is kept (not
    upserted in place) so a user can see how their idea evolved; the API
    surfaces the latest by created_at."""

    __tablename__ = "idea_validations"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_project_id: Mapped[int] = mapped_column(
        ForeignKey("business_projects.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # Deterministic scoring dimensions — see app/services/validation_engine.py.
    # Never set directly from LLM output; the engine computes each from
    # structured inputs and clamps to its documented max.
    score_demand: Mapped[int] = mapped_column(nullable=False)  # /20
    score_differentiation: Mapped[int] = mapped_column(nullable=False)  # /15
    score_business_model: Mapped[int] = mapped_column(nullable=False)  # /15
    score_capital: Mapped[int] = mapped_column(nullable=False)  # /20
    score_operational: Mapped[int] = mapped_column(nullable=False)  # /15
    score_gtm: Mapped[int] = mapped_column(nullable=False)  # /15
    total_score: Mapped[int] = mapped_column(nullable=False)  # /100, sum of the above

    confidence: Mapped[str] = mapped_column(String(10), nullable=False)  # Low | Medium | High
    verdict: Mapped[str] = mapped_column(String(60), nullable=False)

    # Structured report sections + the list of missing-info notes that
    # drove `confidence` down — see ValidationReport in app/schemas/business.py
    # for the shape validated into/out of this column.
    report: Mapped[dict] = mapped_column(JSON, nullable=False)

    business_project: Mapped["BusinessProject"] = relationship(back_populates="validations")

    __table_args__ = (
        CheckConstraint("confidence IN ('Low', 'Medium', 'High')", name="ck_idea_validations_confidence"),
    )


class BudgetItem(Base, TimestampMixin):
    """One line item in a business's startup budget. The budget "total" is
    always the sum of its items — deliberately no separate header row to
    keep a single number from ever drifting out of sync with its parts."""

    __tablename__ = "budget_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_project_id: Mapped[int] = mapped_column(
        ForeignKey("business_projects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    business_project: Mapped["BusinessProject"] = relationship(back_populates="budget_items")

    __table_args__ = (CheckConstraint("amount >= 0", name="ck_budget_items_amount_non_negative"),)


class BusinessTask(Base, TimestampMixin):
    """A launch/execution checklist item — deliberately lightweight, not a
    project-management system (no subtasks, assignees, or dependencies)."""

    __tablename__ = "business_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_project_id: Mapped[int] = mapped_column(
        ForeignKey("business_projects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    priority: Mapped[str] = mapped_column(String(10), default="medium", nullable=False)
    week: Mapped[int | None] = mapped_column()  # roadmap grouping, e.g. "Week 1" — null for ad-hoc tasks
    order_index: Mapped[int] = mapped_column(default=0, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)

    business_project: Mapped["BusinessProject"] = relationship(back_populates="tasks")

    __table_args__ = (
        CheckConstraint(f"status IN {TASK_STATUSES}", name="ck_business_tasks_status"),
        CheckConstraint(f"priority IN {TASK_PRIORITIES}", name="ck_business_tasks_priority"),
        Index("ix_business_tasks_project_week", "business_project_id", "week"),
    )


class FinancialEntry(Base, TimestampMixin):
    """One real, user-recorded revenue or expense line. The financial
    dashboard is always a direct aggregation of these rows — never a
    separately-stored/cached total that could drift or be fabricated."""

    __tablename__ = "financial_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_project_id: Mapped[int] = mapped_column(
        ForeignKey("business_projects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    type: Mapped[str] = mapped_column(String(10), nullable=False)  # revenue | expense
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)

    business_project: Mapped["BusinessProject"] = relationship(back_populates="financial_entries")

    __table_args__ = (
        CheckConstraint(f"type IN {FINANCIAL_ENTRY_TYPES}", name="ck_financial_entries_type"),
        CheckConstraint("amount >= 0", name="ck_financial_entries_amount_non_negative"),
        Index("ix_financial_entries_project_date", "business_project_id", "entry_date"),
    )
