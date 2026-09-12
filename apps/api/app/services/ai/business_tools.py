"""Business-copilot tool definitions. Every tool that reads or writes a
business resource re-derives ownership through business_service — the
agent loop never trusts a bare business_id from model-generated
arguments (see app/services/business_service.get_owned_business).

Arithmetic tools (break-even, margin) call the exact same deterministic
functions the /calculators API and frontend calculators use — the model
never computes these numbers itself, only explains them."""
from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import BusinessProject
from app.repositories import business_repository
from app.services import business_service, calculators
from app.services.ai.types import ToolSpec

GET_BUSINESS_PROJECT = ToolSpec(
    name="get_business_project",
    description="Get the current user's business project: name, stage, budget, target customer, and other stored details.",
    parameters={
        "type": "object",
        "properties": {"business_id": {"type": "integer", "description": "Optional if the user has one business"}},
    },
)

GET_BUSINESS_BUDGET = ToolSpec(
    name="get_business_budget",
    description="Get the user's saved startup budget: line items and total.",
    parameters={"type": "object", "properties": {"business_id": {"type": "integer"}}},
)

CALCULATE_BREAK_EVEN = ToolSpec(
    name="calculate_break_even",
    description="Deterministically calculate break-even units/revenue from fixed costs, selling price, and variable cost per unit.",
    parameters={
        "type": "object",
        "properties": {
            "fixed_costs": {"type": "number"},
            "selling_price": {"type": "number"},
            "variable_cost_per_unit": {"type": "number"},
        },
        "required": ["fixed_costs", "selling_price", "variable_cost_per_unit"],
    },
)

CALCULATE_MARGIN = ToolSpec(
    name="calculate_margin",
    description="Deterministically calculate gross/operating profit and margin percentages from revenue, COGS, and operating expenses.",
    parameters={
        "type": "object",
        "properties": {
            "revenue": {"type": "number"},
            "cogs": {"type": "number"},
            "operating_expenses": {"type": "number"},
        },
        "required": ["revenue", "cogs", "operating_expenses"],
    },
)

GET_FINANCIAL_SUMMARY = ToolSpec(
    name="get_financial_summary",
    description="Get the user's real recorded revenue, expenses, net result, and expense breakdown for their business.",
    parameters={"type": "object", "properties": {"business_id": {"type": "integer"}}},
)

GET_LAUNCH_TASKS = ToolSpec(
    name="get_launch_tasks",
    description="Get the user's launch roadmap tasks, with status (pending/in_progress/completed).",
    parameters={"type": "object", "properties": {"business_id": {"type": "integer"}}},
)

CREATE_LAUNCH_TASK = ToolSpec(
    name="create_launch_task",
    description="Add a new task to the user's launch roadmap.",
    parameters={
        "type": "object",
        "properties": {
            "business_id": {"type": "integer"},
            "title": {"type": "string"},
            "category": {"type": "string"},
            "priority": {"type": "string", "enum": ["low", "medium", "high"]},
            "week": {"type": "integer"},
        },
        "required": ["title"],
    },
)

UPDATE_LAUNCH_TASK = ToolSpec(
    name="update_launch_task",
    description="Update the status of an existing launch task (e.g. mark it completed).",
    parameters={
        "type": "object",
        "properties": {
            "business_id": {"type": "integer"},
            "task_id": {"type": "integer"},
            "status": {"type": "string", "enum": ["pending", "in_progress", "completed"]},
        },
        "required": ["task_id", "status"],
    },
)

BUSINESS_TOOLS: list[ToolSpec] = [
    GET_BUSINESS_PROJECT,
    GET_BUSINESS_BUDGET,
    CALCULATE_BREAK_EVEN,
    CALCULATE_MARGIN,
    GET_FINANCIAL_SUMMARY,
    GET_LAUNCH_TASKS,
    CREATE_LAUNCH_TASK,
    UPDATE_LAUNCH_TASK,
]

_BUSINESS_TOOL_NAMES = {t.name for t in BUSINESS_TOOLS}


def _as_decimal(value: Any, field: str) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise AppError(f"'{field}' must be a number.", code="invalid_tool_arguments") from None


def _resolve_business(db: Session, *, user_id: int, business_id: int | None, default_business_id: int | None) -> BusinessProject:
    bid = business_id or default_business_id
    if bid is not None:
        return business_service.get_owned_business(db, business_id=bid, user_id=user_id)

    businesses = business_repository.list_businesses(db, user_id=user_id)
    if len(businesses) == 1:
        return businesses[0]
    if len(businesses) == 0:
        raise AppError(
            "This user has no business project yet — suggest they create one from /validate or /business.",
            code="no_business",
        )
    options = ", ".join(f"{b.name} (id={b.id})" for b in businesses)
    raise AppError(f"User has multiple businesses; ask which one: {options}", code="ambiguous_business")


def _project_to_dict(project: BusinessProject) -> dict:
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "industry": project.industry,
        "location": project.location,
        "stage": project.stage,
        "startup_budget": str(project.startup_budget) if project.startup_budget is not None else None,
        "currency": project.currency,
        "target_customer": project.target_customer,
        "business_model": project.business_model,
        "delivery_mode": project.delivery_mode,
    }


def is_business_tool(name: str) -> bool:
    return name in _BUSINESS_TOOL_NAMES


def dispatch_business_tool(
    db: Session, name: str, arguments: dict[str, Any], *, user_id: int | None, default_business_id: int | None
) -> Any:
    if name in ("calculate_break_even", "calculate_margin"):
        # Stateless — no auth/business needed.
        if name == "calculate_break_even":
            result = calculators.calculate_break_even(
                _as_decimal(arguments.get("fixed_costs"), "fixed_costs"),
                _as_decimal(arguments.get("selling_price"), "selling_price"),
                _as_decimal(arguments.get("variable_cost_per_unit"), "variable_cost_per_unit"),
            )
        else:
            result = calculators.calculate_margin(
                _as_decimal(arguments.get("revenue"), "revenue"),
                _as_decimal(arguments.get("cogs"), "cogs"),
                _as_decimal(arguments.get("operating_expenses"), "operating_expenses"),
            )
        return {k: str(v) if isinstance(v, Decimal) else v for k, v in result.__dict__.items()}

    if user_id is None:
        raise AppError("Sign in to use business tools.", code="not_authenticated")

    business_id = arguments.get("business_id")

    if name == "get_business_project":
        project = _resolve_business(db, user_id=user_id, business_id=business_id, default_business_id=default_business_id)
        return _project_to_dict(project)

    if name == "get_business_budget":
        project = _resolve_business(db, user_id=user_id, business_id=business_id, default_business_id=default_business_id)
        items = business_repository.get_budget(db, business_project_id=project.id)
        return {
            "items": [{"category": i.category, "amount": str(i.amount)} for i in items],
            "total": str(business_service.budget_total(items)),
        }

    if name == "get_financial_summary":
        project = _resolve_business(db, user_id=user_id, business_id=business_id, default_business_id=default_business_id)
        summary = business_repository.financial_summary(db, business_project_id=project.id)
        return {
            "total_revenue": str(summary["total_revenue"]),
            "total_expenses": str(summary["total_expenses"]),
            "net_result": str(summary["net_result"]),
            "expense_breakdown": [
                {"category": b["category"], "total": str(b["total"])} for b in summary["expense_breakdown"]
            ],
            "entry_count": summary["entry_count"],
        }

    if name == "get_launch_tasks":
        project = _resolve_business(db, user_id=user_id, business_id=business_id, default_business_id=default_business_id)
        tasks = business_repository.list_tasks(db, business_project_id=project.id)
        return [
            {"id": t.id, "title": t.title, "status": t.status, "priority": t.priority, "week": t.week} for t in tasks
        ]

    if name == "create_launch_task":
        project = _resolve_business(db, user_id=user_id, business_id=business_id, default_business_id=default_business_id)
        if not arguments.get("title"):
            raise AppError("create_launch_task requires 'title'.", code="invalid_tool_arguments")
        task = business_repository.create_task(
            db,
            business_project_id=project.id,
            title=arguments["title"],
            category=arguments.get("category"),
            priority=arguments.get("priority", "medium"),
            week=arguments.get("week"),
        )
        return {"id": task.id, "title": task.title, "status": task.status}

    if name == "update_launch_task":
        project = _resolve_business(db, user_id=user_id, business_id=business_id, default_business_id=default_business_id)
        task_id = arguments.get("task_id")
        new_status = arguments.get("status")
        if not task_id or not new_status:
            raise AppError("update_launch_task requires 'task_id' and 'status'.", code="invalid_tool_arguments")
        task = business_repository.get_task(db, business_project_id=project.id, task_id=task_id)
        if task is None:
            raise AppError("Task not found.", code="not_found")
        updated = business_repository.update_task(db, task, status=new_status)
        return {"id": updated.id, "title": updated.title, "status": updated.status}

    raise AppError(f"Unknown business tool: {name}", code="unknown_tool")
