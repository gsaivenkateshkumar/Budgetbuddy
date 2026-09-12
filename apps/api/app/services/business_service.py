"""Orchestration for the business domain: ownership enforcement,
validation runs, and the default launch roadmap. Deterministic
calculations live in app/services/calculators.py; this module wires them
to persistence and to the (optional) AI narrative layer."""
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models import BusinessProject
from app.repositories import business_repository
from app.services.ai.base import AIProvider
from app.services.validation_engine import (
    ValidationInput,
    confidence_for,
    generate_report_sections,
    missing_info,
    score_idea,
    verdict_for,
)


def get_owned_business(db: Session, *, business_id: int, user_id: int) -> BusinessProject:
    """The single ownership gate for every business-scoped route. Returns
    404 (never 403) whether the project doesn't exist or belongs to
    someone else, so a user can't distinguish "not found" from "not
    yours" — see product brief section 58."""
    project = business_repository.get_business(db, business_id=business_id, user_id=user_id)
    if project is None:
        raise NotFoundError("Business not found.")
    return project


async def run_validation(db: Session, *, project: BusinessProject, provider: AIProvider):
    inp = ValidationInput(
        idea=project.name,
        description=project.description or "",
        industry=project.industry,
        location=project.location,
        startup_budget=project.startup_budget,
        experience_level=project.experience_level,
        target_customer=project.target_customer,
        delivery_mode=project.delivery_mode,
        time_commitment=project.time_commitment,
        goals=project.goals,
    )
    scores = score_idea(inp)
    missing = missing_info(inp)
    confidence = confidence_for(scores, missing)
    verdict = verdict_for(scores)
    sections = await generate_report_sections(provider, inp, scores, verdict, missing)

    validation = business_repository.add_validation(
        db,
        business_project_id=project.id,
        score_demand=scores.demand,
        score_differentiation=scores.differentiation,
        score_business_model=scores.business_model,
        score_capital=scores.capital,
        score_operational=scores.operational,
        score_gtm=scores.gtm,
        total_score=scores.total,
        confidence=confidence,
        verdict=verdict,
        report={"sections": sections.model_dump(), "missing_info": missing},
    )

    if project.stage == "idea":
        business_repository.update_business(db, project, stage="validation")

    return validation


# ---- Default launch roadmap -------------------------------------------------
# A fixed, deterministic 4-week starter checklist — not AI-generated, so it
# never varies run-to-run and never needs a Groq call to exist. Users can
# add/complete/edit tasks freely afterward; this only seeds the first set.
_DEFAULT_ROADMAP = [
    {"week": 1, "category": "research", "title": "Talk to 5-10 potential customers", "priority": "high"},
    {"week": 1, "category": "research", "title": "Write down your target customer and their problem", "priority": "high"},
    {"week": 2, "category": "offer", "title": "Decide on your offer and pricing", "priority": "high"},
    {"week": 2, "category": "offer", "title": "Set your startup budget in the Budget Planner", "priority": "medium"},
    {"week": 3, "category": "setup", "title": "Source suppliers, equipment, or tools you need", "priority": "medium"},
    {"week": 3, "category": "setup", "title": "Set up the basics: a way to take payment and be found", "priority": "medium"},
    {"week": 4, "category": "launch", "title": "Soft-launch to a small group and collect feedback", "priority": "high"},
    {"week": 4, "category": "launch", "title": "Record your first revenue or expense entry", "priority": "low"},
]


def generate_default_roadmap(db: Session, *, project: BusinessProject) -> list:
    existing = business_repository.list_tasks(db, business_project_id=project.id)
    if existing:
        raise ValueError("This business already has tasks — the default roadmap only seeds an empty checklist.")

    tasks = [{**item, "order_index": i} for i, item in enumerate(_DEFAULT_ROADMAP)]
    return business_repository.create_tasks_bulk(db, business_project_id=project.id, tasks=tasks)


def budget_total(items: list) -> Decimal:
    return sum((item.amount for item in items), Decimal("0"))
